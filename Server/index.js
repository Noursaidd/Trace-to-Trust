const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const PORT = process.env.PORT ? Number(process.env.PORT) : 8081;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.sqlite');
const KEYS_PATH = process.env.KEYS_PATH || path.join(__dirname, 'keys.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

function requireAdmin(req, res, next) {
  const pw = req.header('x-admin-password');
  if (!pw || pw !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
  }
  next();
}

function loadOrCreateKeys() {
  if (fs.existsSync(KEYS_PATH)) {
    return JSON.parse(fs.readFileSync(KEYS_PATH, 'utf8'));
  }
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const pubPem = publicKey.export({ format: 'pem', type: 'spki' });
  const privPem = privateKey.export({ format: 'pem', type: 'pkcs8' });
  const keys = { algorithm: 'ed25519', publicKeyPem: pubPem, privateKeyPem: privPem, createdAt: new Date().toISOString() };
  fs.writeFileSync(KEYS_PATH, JSON.stringify(keys, null, 2));
  return keys;
}

function canonicalize(obj) {
  // stable JSON stringify: sort keys recursively
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalize).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') + '}';
}

const keys = loadOrCreateKeys();
const privateKey = crypto.createPrivateKey(keys.privateKeyPem);
const publicKey = crypto.createPublicKey(keys.publicKeyPem);

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS producers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  producer_id TEXT,
  origin_region TEXT,
  quantity INTEGER,
  production_date TEXT,
  expiry_date TEXT,
  description TEXT,
  revoked INTEGER DEFAULT 0,
  revoke_reason TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS batch_events (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  signature TEXT,
  signed_at TEXT,
  trust_tier TEXT DEFAULT 'B',
  location TEXT,
  timestamp TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS labels (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  first_scan_at TEXT,
  scan_count INTEGER DEFAULT 0,
  last_scan_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

const stmtCreateBatch = db.prepare(`
INSERT INTO batches (id, product_name, product_type, producer_id, origin_region, quantity, production_date, expiry_date, description)
VALUES (@id, @product_name, @product_type, @producer_id, @origin_region, @quantity, @production_date, @expiry_date, @description)
`);
const stmtCreateProducer = db.prepare(`
INSERT INTO producers (id, name, region) VALUES (@id, @name, @region)
`);

const stmtListBatches = db.prepare(`SELECT * FROM batches ORDER BY created_at DESC`);
const stmtGetBatch = db.prepare(`SELECT * FROM batches WHERE id = ?`);
const stmtGetEvents = db.prepare(`SELECT * FROM batch_events WHERE batch_id = ? ORDER BY created_at ASC`);
const stmtCreateEvent = db.prepare(`
INSERT INTO batch_events (id, batch_id, event_type, payload_json, payload_hash, location, timestamp, trust_tier)
VALUES (@id, @batch_id, @event_type, @payload_json, @payload_hash, @location, @timestamp, @trust_tier)
`);
const stmtGetEvent = db.prepare(`SELECT * FROM batch_events WHERE id = ?`);
const stmtSignEvent = db.prepare(`UPDATE batch_events SET signature = ?, signed_at = ? WHERE id = ?`);

const stmtCreateLabel = db.prepare(`INSERT INTO labels (id, batch_id, code) VALUES (?, ?, ?)`);
const stmtGetLabel = db.prepare(`SELECT * FROM labels WHERE code = ?`);
const stmtListLabelsForBatch = db.prepare(`SELECT * FROM labels WHERE batch_id = ? ORDER BY created_at DESC`);
const stmtIncScan = db.prepare(`
UPDATE labels SET
  scan_count = scan_count + 1,
  first_scan_at = COALESCE(first_scan_at, ?),
  last_scan_at = ?
WHERE code = ?
`);

function signBytes(buf) {
  const sig = crypto.sign(null, buf, privateKey);
  return sig.toString('base64');
}

function verifyBytes(buf, sigB64) {
  try {
    return crypto.verify(null, buf, publicKey, Buffer.from(sigB64, 'base64'));
  } catch {
    return false;
  }
}

function createSignedEvent(batchId, eventType, payload, location, timestamp, trustTier = 'B') {
  const eventId = uuidv4();
  const payloadCanonical = canonicalize(payload);
  const payloadHash = crypto.createHash('sha256').update(payloadCanonical).digest('hex');
  stmtCreateEvent.run({
    id: eventId,
    batch_id: batchId,
    event_type: eventType,
    payload_json: payloadCanonical,
    payload_hash: payloadHash,
    location: location || null,
    timestamp: timestamp || new Date().toISOString(),
    trust_tier: trustTier,
  });

  if (['ORIGIN_DECLARED', 'PACKAGING', 'QUALITY_TEST'].includes(eventType)) {
    const sig = signBytes(Buffer.from(payloadHash, 'utf8'));
    stmtSignEvent.run(sig, new Date().toISOString(), eventId);
  }
}

function seedIfEmpty() {
  const batchesCount = db.prepare('SELECT COUNT(*) AS c FROM batches').get().c;
  if (batchesCount > 0) return;

  const producers = [
    { id: 'prod-al-jabal-al-akhdar', name: 'Al Jabal Al Akhdar Cooperative', region: 'Nizwa' },
    { id: 'prod-dhofar-resins', name: 'Dhofar Resins & Aromatics', region: 'Salalah' },
    { id: 'prod-nizwa-dates', name: 'Nizwa Date Growers Union', region: 'Nizwa' },
    { id: 'prod-sea-route-fisheries', name: 'Sea Route Fisheries LLC', region: 'Sur' },
  ];

  const seededBatches = [
    {
      id: 'batch-honey-nizwa-2026-01',
      product_name: 'Jabal Akhdar Sidr Honey 500g',
      product_type: 'HONEY',
      producer_id: 'prod-al-jabal-al-akhdar',
      origin_region: 'Nizwa',
      quantity: 1200,
      production_date: '2026-01-12',
      expiry_date: '2028-01-12',
      description: 'Raw Omani sidr honey harvested from mountain apiaries in Jabal Akhdar, packed in tamper-evident jars.',
      labels: ['LBL-HNY-NIZ-001', 'LBL-HNY-NIZ-002', 'LBL-HNY-NIZ-003', 'LBL-HNY-NIZ-004', 'LBL-HNY-NIZ-005'],
      events: [
        {
          event_type: 'ORIGIN_DECLARED',
          location: 'Nizwa',
          timestamp: '2026-01-12T07:30:00.000Z',
          payload: { farm_name: 'Al Ain Apiary', beekeeper_license: 'OM-BEE-4451', nectar_source: 'Sidr', hive_count: 340, wilaya: 'Nizwa' },
        },
        {
          event_type: 'HARVEST_OR_CATCH',
          location: 'Nizwa',
          timestamp: '2026-01-13T05:20:00.000Z',
          payload: { extraction_method: 'cold centrifugal', harvested_kg: 612, ambient_temp_c: 26.3, moisture_percent: 16.8 },
        },
        {
          event_type: 'QUALITY_TEST',
          location: 'Muscat',
          timestamp: '2026-01-14T09:10:00.000Z',
          payload: { lab_name: 'Oman Food Safety Lab', hmf_mg_per_kg: 9.4, sucrose_percent: 2.1, pollen_profile: 'sidr-dominant', result: 'pass' },
        },
        {
          event_type: 'PACKAGING',
          location: 'Nizwa',
          timestamp: '2026-01-15T11:00:00.000Z',
          payload: { facility: 'Nizwa Packing Line 2', jar_size_g: 500, units_packed: 1200, seal_type: 'induction + shrink band' },
        },
      ],
    },
    {
      id: 'batch-frankincense-dhofar-2026-02',
      product_name: 'Dhofar Hojari Frankincense Premium 250g',
      product_type: 'FRANKINCENSE',
      producer_id: 'prod-dhofar-resins',
      origin_region: 'Salalah',
      quantity: 900,
      production_date: '2026-02-01',
      expiry_date: '2029-02-01',
      description: 'Hand-sorted Hojari resin from Dhofar with graded moisture control and retail pouches.',
      labels: ['LBL-FRN-DHF-001', 'LBL-FRN-DHF-002', 'LBL-FRN-DHF-003', 'LBL-FRN-DHF-004', 'LBL-FRN-DHF-005'],
      events: [
        {
          event_type: 'ORIGIN_DECLARED',
          location: 'Salalah',
          timestamp: '2026-02-01T06:50:00.000Z',
          payload: { grove_zone: 'Wadi Dawkah', collector_permit: 'OM-FRK-772', tree_species: 'Boswellia sacra', wilaya: 'Salalah' },
        },
        {
          event_type: 'PROCESSING',
          location: 'Salalah',
          timestamp: '2026-02-02T08:20:00.000Z',
          payload: { sorting_grade: 'Hojari Premium', impurity_percent: 1.3, drying_hours: 18, batch_weight_kg: 225 },
        },
        {
          event_type: 'QUALITY_TEST',
          location: 'Muscat',
          timestamp: '2026-02-03T10:00:00.000Z',
          payload: { lab_name: 'Dhofar Quality Center', volatile_oil_percent: 7.1, foreign_matter_percent: 0.4, result: 'pass' },
        },
        {
          event_type: 'PACKAGING',
          location: 'Salalah',
          timestamp: '2026-02-03T15:40:00.000Z',
          payload: { pouch_size_g: 250, pouches_filled: 900, desiccant_type: 'food-grade silica', seal_test: 'pass' },
        },
      ],
    },
    {
      id: 'batch-dates-nizwa-2026-01',
      product_name: 'Nizwa Khalas Dates 1kg',
      product_type: 'DATES',
      producer_id: 'prod-nizwa-dates',
      origin_region: 'Nizwa',
      quantity: 1500,
      production_date: '2026-01-20',
      expiry_date: '2027-12-31',
      description: 'Premium Khalas dates sorted by moisture and size, packed in food-safe trays.',
      labels: ['LBL-DAT-NIZ-001', 'LBL-DAT-NIZ-002', 'LBL-DAT-NIZ-003', 'LBL-DAT-NIZ-004', 'LBL-DAT-NIZ-005'],
      events: [
        {
          event_type: 'ORIGIN_DECLARED',
          location: 'Nizwa',
          timestamp: '2026-01-20T04:30:00.000Z',
          payload: { farm_cluster: 'Birkat Al Mouz', cultivar: 'Khalas', palms_count: 520, irrigation: 'falaj system', wilaya: 'Nizwa' },
        },
        {
          event_type: 'HARVEST_OR_CATCH',
          location: 'Nizwa',
          timestamp: '2026-01-21T05:40:00.000Z',
          payload: { harvested_kg: 1850, ripeness_stage: 'tamar', brix_avg: 72.4, manual_sorting: true },
        },
        {
          event_type: 'QUALITY_TEST',
          location: 'Muscat',
          timestamp: '2026-01-22T09:45:00.000Z',
          payload: { lab_name: 'Oman AgroLab', moisture_percent: 18.2, pesticide_residue: 'none_detected', aflatoxin_ppb: 0.7, result: 'pass' },
        },
        {
          event_type: 'PACKAGING',
          location: 'Nizwa',
          timestamp: '2026-01-23T13:15:00.000Z',
          payload: { tray_size_kg: 1, trays_packed: 1500, modified_atmosphere: true, carton_count: 300 },
        },
        {
          event_type: 'TRANSPORT',
          location: 'Nizwa -> Muscat',
          timestamp: '2026-01-23T18:20:00.000Z',
          payload: { truck_plate: 'B 34921', temp_c: 17, dispatch_note: 'DN-OM-88214', eta_hours: 2.5 },
        },
      ],
    },
    {
      id: 'batch-fish-sur-sohar-2026-02',
      product_name: 'Omani Kingfish Fresh Fillet 1kg',
      product_type: 'FISH',
      producer_id: 'prod-sea-route-fisheries',
      origin_region: 'Sur',
      quantity: 800,
      production_date: '2026-02-07',
      expiry_date: '2026-02-14',
      description: 'Fresh kingfish landed at Sur, chilled chain monitored and distributed to Sohar retail markets.',
      labels: ['LBL-FSH-SUR-001', 'LBL-FSH-SUR-002', 'LBL-FSH-SUR-003', 'LBL-FSH-SUR-004', 'LBL-FSH-SUR-005'],
      events: [
        {
          event_type: 'ORIGIN_DECLARED',
          location: 'Sur',
          timestamp: '2026-02-07T01:40:00.000Z',
          payload: { vessel_id: 'OM-SUR-117', captain: 'Saeed Al Hinai', fishing_zone: 'Arabian Sea FAO 51', landing_port: 'Sur' },
        },
        {
          event_type: 'HARVEST_OR_CATCH',
          location: 'Sur',
          timestamp: '2026-02-07T03:10:00.000Z',
          payload: { species: 'Scomberomorus commerson', landed_kg: 1025, ice_to_fish_ratio: 1.2, core_temp_c: 2.8 },
        },
        {
          event_type: 'QUALITY_TEST',
          location: 'Sur',
          timestamp: '2026-02-07T05:00:00.000Z',
          payload: { histamine_mg_per_kg: 8.5, tvb_n_mg_per_100g: 19.4, sensory_grade: 'A', result: 'pass' },
        },
        {
          event_type: 'PACKAGING',
          location: 'Sur',
          timestamp: '2026-02-07T06:25:00.000Z',
          payload: { fillet_weight_kg: 1, units_packed: 800, chill_room_temp_c: 1.5, packaging_line: 'SeaRoute-L3' },
        },
        {
          event_type: 'TRANSPORT',
          location: 'Sur -> Sohar',
          timestamp: '2026-02-07T09:30:00.000Z',
          payload: { reefer_truck: 'R-8822', avg_temp_c: 2.1, destination_market: 'Sohar Fish Market', route_hours: 4.2 },
        },
      ],
    },
  ];

  const tx = db.transaction(() => {
    for (const producer of producers) {
      stmtCreateProducer.run(producer);
    }

    for (const batch of seededBatches) {
      stmtCreateBatch.run({
        id: batch.id,
        product_name: batch.product_name,
        product_type: batch.product_type,
        producer_id: batch.producer_id,
        origin_region: batch.origin_region,
        quantity: batch.quantity,
        production_date: batch.production_date,
        expiry_date: batch.expiry_date,
        description: batch.description,
      });

      for (const event of batch.events) {
        createSignedEvent(batch.id, event.event_type, event.payload, event.location, event.timestamp, 'B');
      }

      for (const code of batch.labels) {
        stmtCreateLabel.run(uuidv4(), batch.id, code);
      }
    }
  });

  tx();
  console.log(`Seeded ${seededBatches.length} Oman batches with ${seededBatches.length * 5} labels.`);
}

app.get('/api/health', (_req, res) => res.json({ success: true, ok: true }));

// Admin: create batch
app.post('/api/batches', requireAdmin, (req, res) => {
  const body = req.body || {};
  const id = uuidv4();
  const row = {
    id,
    product_name: body.product_name,
    product_type: body.product_type,
    producer_id: body.producer_id || null,
    origin_region: body.origin_region || null,
    quantity: body.quantity ?? null,
    production_date: body.production_date || null,
    expiry_date: body.expiry_date || null,
    description: body.description || null,
  };

  if (!row.product_name || !row.product_type) {
    return res.status(400).json({ success: false, error: 'product_name and product_type are required' });
  }

  stmtCreateBatch.run(row);
  res.json({ success: true, batch: stmtGetBatch.get(id) });
});

app.get('/api/batches', requireAdmin, (req, res) => {
  const { product_type } = req.query;
  let batches = stmtListBatches.all();
  if (product_type) batches = batches.filter(b => b.product_type === product_type);
  const withCounts = batches.map(b => {
    const labels = stmtListLabelsForBatch.all(b.id);
    return { ...b, label_count: labels.length, sample_label_code: labels[0]?.code || null };
  });
  res.json({ success: true, batches: withCounts });
});

app.get('/api/batches/:id', requireAdmin, (req, res) => {
  const batch = stmtGetBatch.get(req.params.id);
  if (!batch) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  const events = stmtGetEvents.all(batch.id);
  const labels = stmtListLabelsForBatch.all(batch.id);
  res.json({ success: true, batch, events, labels });
});

app.post('/api/batches/:id/events', requireAdmin, (req, res) => {
  const batch = stmtGetBatch.get(req.params.id);
  if (!batch) return res.status(404).json({ success: false, error: 'BATCH_NOT_FOUND' });

  const body = req.body || {};
  const eventId = uuidv4();
  const payload = body.payload || {};
  const payloadCanonical = canonicalize(payload);
  const payloadHash = crypto.createHash('sha256').update(payloadCanonical).digest('hex');

  stmtCreateEvent.run({
    id: eventId,
    batch_id: batch.id,
    event_type: body.event_type || 'EVENT',
    payload_json: payloadCanonical,
    payload_hash: payloadHash,
    location: body.location || null,
    timestamp: body.timestamp || new Date().toISOString(),
    trust_tier: body.trust_tier || 'B'
  });

  res.json({ success: true, event: stmtGetEvent.get(eventId) });
});

app.post('/api/events/:id/sign', requireAdmin, (req, res) => {
  const ev = stmtGetEvent.get(req.params.id);
  if (!ev) return res.status(404).json({ success: false, error: 'EVENT_NOT_FOUND' });

  const msg = Buffer.from(ev.payload_hash, 'utf8');
  const sig = signBytes(msg);
  const signedAt = new Date().toISOString();
  stmtSignEvent.run(sig, signedAt, ev.id);

  res.json({
    success: true,
    signature: sig,
    public_key: keys.publicKeyPem,
    signed_at: signedAt,
    event: stmtGetEvent.get(ev.id)
  });
});

// Labels: generate multiple QR codes for a batch
app.post('/api/batches/:id/labels', requireAdmin, (req, res) => {
  const batch = stmtGetBatch.get(req.params.id);
  if (!batch) return res.status(404).json({ success: false, error: 'BATCH_NOT_FOUND' });

  const count = Math.min(Math.max(Number(req.body?.count || 1), 1), 5000);
  const created = [];
  const tx = db.transaction(() => {
    for (let i = 0; i < count; i++) {
      const labelId = uuidv4();
      const code = crypto.randomUUID();
      stmtCreateLabel.run(labelId, batch.id, code);
      created.push({ id: labelId, batch_id: batch.id, code });
    }
  });
  tx();

  res.json({ success: true, labels: created });
});

// Return QR png for a label code
app.get('/api/labels/:code/qr', async (req, res) => {
  const label = stmtGetLabel.get(req.params.code);
  if (!label) return res.status(404).send('NOT_FOUND');

  const url = `${req.protocol}://${req.get('host').replace(String(PORT), '8080')}/verify/${label.code}`;
  const png = await QRCode.toBuffer(url, { type: 'png', margin: 1, scale: 8 });
  res.setHeader('Content-Type', 'image/png');
  res.send(png);
});

// Public verify by label code
app.get('/api/verify/:code', (req, res) => {
  const label = stmtGetLabel.get(req.params.code);
  if (!label) return res.status(404).json({ success: false, error: 'LABEL_NOT_FOUND' });

  // scan log / anti-clone heuristic
  const now = new Date().toISOString();
  stmtIncScan.run(now, now, label.code);
  const updatedLabel = stmtGetLabel.get(label.code);

  const batch = stmtGetBatch.get(label.batch_id);
  if (!batch) return res.status(404).json({ success: false, error: 'BATCH_NOT_FOUND' });

  const events = stmtGetEvents.all(batch.id);
  const unsigned = events.filter(e => !e.signature);

  let tampered = false;
  for (const e of events) {
    if (!e.signature) continue;
    const ok = verifyBytes(Buffer.from(e.payload_hash, 'utf8'), e.signature);
    if (!ok) { tampered = true; break; }
  }

  let status = 'valid';
  if (batch.revoked) status = 'revoked';
  else if (tampered) status = 'tampered';
  else if (events.length === 0 || unsigned.length === events.length) status = 'unsigned';

  // Suspicious scan warning: many scans in short time window
  let suspicious = false;
  if (updatedLabel.scan_count >= 10) suspicious = true;

  res.json({
    success: true,
    status,
    suspicious,
    scan_count: updatedLabel.scan_count,
    batch,
    events,
    public_key: keys.publicKeyPem,
  });
});

app.post('/api/batches/:id/revoke', requireAdmin, (req, res) => {
  const batch = stmtGetBatch.get(req.params.id);
  if (!batch) return res.status(404).json({ success: false, error: 'BATCH_NOT_FOUND' });
  const reason = String(req.body?.reason || '').slice(0, 300);
  db.prepare('UPDATE batches SET revoked = 1, revoke_reason = ? WHERE id = ?').run(reason, batch.id);
  res.json({ success: true, batch: stmtGetBatch.get(batch.id) });
});

// Admin stats
app.get('/api/admin/stats', requireAdmin, (_req, res) => {
  const totalBatches = db.prepare('SELECT COUNT(*) as c FROM batches').get().c;
  const totalLabels = db.prepare('SELECT COUNT(*) as c FROM labels').get().c;
  const totalEvents = db.prepare('SELECT COUNT(*) as c FROM batch_events').get().c;
  const signedEvents = db.prepare('SELECT COUNT(*) as c FROM batch_events WHERE signature IS NOT NULL').get().c;
  const revoked = db.prepare('SELECT COUNT(*) as c FROM batches WHERE revoked = 1').get().c;
  const totalScans = db.prepare('SELECT SUM(scan_count) as s FROM labels').get().s || 0;
  res.json({ success: true, stats: { totalBatches, totalLabels, totalEvents, signedEvents, revoked, totalScans } });
});

app.listen(PORT, () => {
  seedIfEmpty();
  console.log(`Trace-to-Trust backend running on http://localhost:${PORT}`);
  console.log(`DB: ${DB_PATH}`);
});
