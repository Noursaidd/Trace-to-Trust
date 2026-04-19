const fs = require('fs');
const path = require('path');
const dns = require('dns');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: path.join(__dirname, '.env') });

if (!process.env.VERCEL) {
  dns.setDefaultResultOrder('verbatim');
  dns.setServers(['1.1.1.1', '8.8.8.8', '8.8.4.4']);
}

const PORT = Number(process.env.PORT || 3000);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'tracetotrust';
const KEYS_PATH = process.env.KEYS_PATH || path.join(__dirname, 'keys.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_COOKIE_NAME = 'trace_admin_session';
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

const COLLECTIONS = {
  products: 'Products',
  events: 'batch_events',
  labels: 'labels'
};

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '1mb' }));

let productsCollection;
let eventsCollection;
let labelsCollection;
let mongoClient;
let mongoClientPromise;

function envKey(name) {
  const b64 = process.env[`${name}_B64`];
  if (b64) return Buffer.from(b64, 'base64').toString('utf8');
  return process.env[name];
}

function loadOrCreateKeys() {
  const publicKeyPem = envKey('SIGNING_PUBLIC_KEY_PEM');
  const privateKeyPem = envKey('SIGNING_PRIVATE_KEY_PEM');
  if (publicKeyPem && privateKeyPem) {
    return {
      algorithm: 'ed25519',
      publicKeyPem,
      privateKeyPem,
      createdAt: process.env.SIGNING_KEY_CREATED_AT || 'environment'
    };
  }

  if (fs.existsSync(KEYS_PATH)) {
    return JSON.parse(fs.readFileSync(KEYS_PATH, 'utf8'));
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const keys = {
    algorithm: 'ed25519',
    publicKeyPem: publicKey.export({ format: 'pem', type: 'spki' }),
    privateKeyPem: privateKey.export({ format: 'pem', type: 'pkcs8' }),
    createdAt: new Date().toISOString()
  };

  if (process.env.VERCEL) {
    console.warn('SIGNING_* env vars are not set; generated an ephemeral signing key for this function instance.');
    return keys;
  }

  fs.writeFileSync(KEYS_PATH, JSON.stringify(keys, null, 2));
  return keys;
}

function canonicalize(obj) {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(canonicalize).join(',')}]`;

  const keys = Object.keys(obj).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(obj[key])}`).join(',')}}`;
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const keys = loadOrCreateKeys();
const privateKey = crypto.createPrivateKey(keys.privateKeyPem);
const publicKey = crypto.createPublicKey(keys.publicKeyPem);

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((acc, part) => {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (!rawName) return acc;
    acc[rawName] = decodeURIComponent(rawValue.join('=') || '');
    return acc;
  }, {});
}

function safeEqualString(a, b) {
  const aBuf = Buffer.from(String(a || ''), 'utf8');
  const bBuf = Buffer.from(String(b || ''), 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function isAdminPasswordValid(password) {
  return Boolean(ADMIN_PASSWORD) && safeEqualString(password, ADMIN_PASSWORD);
}

function signAdminPayload(payload) {
  return crypto.createHmac('sha256', keys.privateKeyPem).update(payload).digest('base64url');
}

function createAdminToken() {
  const payload = Buffer.from(JSON.stringify({
    exp: Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000,
    nonce: crypto.randomUUID()
  })).toString('base64url');
  return `${payload}.${signAdminPayload(payload)}`;
}

function verifyAdminToken(token) {
  if (!token || !token.includes('.')) return false;
  const [payload, signature] = token.split('.');
  if (!safeEqualString(signature, signAdminPayload(payload))) return false;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number(decoded.exp) > Date.now();
  } catch {
    return false;
  }
}

function hasAdminAccess(req) {
  const headerPassword = req.get('x-admin-password');
  if (isAdminPasswordValid(headerPassword)) return true;

  const cookies = parseCookies(req.get('cookie') || '');
  return verifyAdminToken(cookies[ADMIN_COOKIE_NAME]);
}

function setAdminCookie(res, token) {
  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: Boolean(process.env.VERCEL),
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS * 1000,
    path: '/'
  });
}

function clearAdminCookie(res) {
  res.clearCookie(ADMIN_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: Boolean(process.env.VERCEL),
    path: '/'
  });
}

function requireAdmin(req, res, next) {
  if (!ADMIN_PASSWORD) {
    return res.status(503).json({ success: false, error: 'ADMIN_PASSWORD_NOT_CONFIGURED' });
  }

  if (!hasAdminAccess(req)) {
    return res.status(401).json({ success: false, error: 'ADMIN_AUTH_REQUIRED' });
  }

  return next();
}

app.use('/api', asyncHandler(async (_req, _res, next) => {
  await ensureDatabase();
  next();
}));

function signBytes(buf) {
  return crypto.sign(null, buf, privateKey).toString('base64');
}

function verifyBytes(buf, sigB64) {
  try {
    return crypto.verify(null, buf, publicKey, Buffer.from(sigB64, 'base64'));
  } catch {
    return false;
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ success: true, ok: true });
});

app.post('/api/admin/login', asyncHandler(async (req, res) => {
  if (!ADMIN_PASSWORD) {
    return res.status(503).json({ success: false, error: 'ADMIN_PASSWORD_NOT_CONFIGURED' });
  }

  const password = String(req.body?.password || '');
  if (!isAdminPasswordValid(password)) {
    return res.status(401).json({ success: false, error: 'INVALID_ADMIN_PASSWORD' });
  }

  setAdminCookie(res, createAdminToken());
  res.json({ success: true, authenticated: true });
}));

app.get('/api/admin/session', (req, res) => {
  res.json({ success: true, authenticated: hasAdminAccess(req) });
});

app.post('/api/admin/logout', (_req, res) => {
  clearAdminCookie(res);
  res.json({ success: true, authenticated: false });
});

app.post('/api/batches', requireAdmin, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const id = uuidv4();

  const doc = {
    id,
    product_name: body.product_name,
    product_type: body.product_type,
    producer_id: body.producer_id || null,
    origin_region: body.origin_region || null,
    quantity: body.quantity ?? null,
    production_date: body.production_date || null,
    expiry_date: body.expiry_date || null,
    description: body.description || null,
    revoked: false,
    revoke_reason: null,
    created_at: new Date().toISOString()
  };

  if (!doc.product_name || !doc.product_type) {
    return res.status(400).json({ success: false, error: 'product_name and product_type are required' });
  }

  await productsCollection.insertOne(doc);
  res.json({ success: true, batch: doc });
}));

app.get('/api/batches', requireAdmin, asyncHandler(async (req, res) => {
  const { product_type } = req.query;
  const query = product_type ? { product_type } : {};
  const batches = await productsCollection.find(query).sort({ created_at: -1 }).toArray();

  const withCounts = await Promise.all(
    batches.map(async (batch) => {
      const labels = await labelsCollection.find({ batch_id: batch.id }).toArray();
      return {
        ...batch,
        label_count: labels.length,
        sample_label_code: labels[0]?.code || null
      };
    })
  );

  res.json({ success: true, batches: withCounts });
}));

app.get('/api/batches/:id', requireAdmin, asyncHandler(async (req, res) => {
  const batch = await productsCollection.findOne({ id: req.params.id });
  if (!batch) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  }

  const events = await eventsCollection.find({ batch_id: batch.id }).sort({ created_at: 1 }).toArray();
  const labels = await labelsCollection.find({ batch_id: batch.id }).sort({ created_at: -1 }).toArray();
  res.json({ success: true, batch, events, labels });
}));

app.patch('/api/batches/:id', requireAdmin, asyncHandler(async (req, res) => {
  const batch = await productsCollection.findOne({ id: req.params.id });
  if (!batch) {
    return res.status(404).json({ success: false, error: 'BATCH_NOT_FOUND' });
  }

  const body = req.body || {};
  const updates = {};

  if (Object.prototype.hasOwnProperty.call(body, 'product_name')) {
    const value = String(body.product_name || '').trim();
    if (!value) {
      return res.status(400).json({ success: false, error: 'INVALID_PRODUCT_NAME' });
    }
    updates.product_name = value;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'product_type')) {
    const value = String(body.product_type || '').trim();
    if (!value) {
      return res.status(400).json({ success: false, error: 'INVALID_PRODUCT_TYPE' });
    }
    updates.product_type = value;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'origin_region')) {
    const value = String(body.origin_region || '').trim();
    updates.origin_region = value || null;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'quantity')) {
    if (body.quantity === '' || body.quantity === null || body.quantity === undefined) {
      updates.quantity = null;
    } else {
      const qty = Number(body.quantity);
      if (Number.isNaN(qty)) {
        return res.status(400).json({ success: false, error: 'INVALID_QUANTITY' });
      }
      updates.quantity = qty;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'production_date')) {
    const value = String(body.production_date || '').trim();
    updates.production_date = value || null;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'expiry_date')) {
    const value = String(body.expiry_date || '').trim();
    updates.expiry_date = value || null;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'description')) {
    const value = String(body.description || '').trim();
    updates.description = value || null;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, error: 'NO_UPDATES' });
  }

  await productsCollection.updateOne({ id: batch.id }, { $set: updates });
  const updatedBatch = await productsCollection.findOne({ id: batch.id });
  res.json({ success: true, batch: updatedBatch });
}));

app.post('/api/batches/:id/events', requireAdmin, asyncHandler(async (req, res) => {
  const batch = await productsCollection.findOne({ id: req.params.id });
  if (!batch) {
    return res.status(404).json({ success: false, error: 'BATCH_NOT_FOUND' });
  }

  const body = req.body || {};
  const payload = body.payload || {};
  const payloadCanonical = canonicalize(payload);
  const payloadHash = crypto.createHash('sha256').update(payloadCanonical).digest('hex');
  const eventId = uuidv4();

  const event = {
    id: eventId,
    batch_id: batch.id,
    event_type: body.event_type || 'EVENT',
    payload_json: payloadCanonical,
    payload_hash: payloadHash,
    location: body.location || null,
    timestamp: body.timestamp || new Date().toISOString(),
    trust_tier: body.trust_tier || 'B',
    signature: null,
    signed_at: null,
    created_at: new Date().toISOString()
  };

  await eventsCollection.insertOne(event);
  res.json({ success: true, event });
}));

app.post('/api/events/:id/sign', requireAdmin, asyncHandler(async (req, res) => {
  const event = await eventsCollection.findOne({ id: req.params.id });
  if (!event) {
    return res.status(404).json({ success: false, error: 'EVENT_NOT_FOUND' });
  }

  const signedAt = new Date().toISOString();
  const signature = signBytes(Buffer.from(event.payload_hash, 'utf8'));

  await eventsCollection.updateOne(
    { id: event.id },
    { $set: { signature, signed_at: signedAt } }
  );

  const updatedEvent = await eventsCollection.findOne({ id: event.id });
  res.json({
    success: true,
    signature,
    public_key: keys.publicKeyPem,
    signed_at: signedAt,
    event: updatedEvent
  });
}));

app.post('/api/batches/:id/labels', requireAdmin, asyncHandler(async (req, res) => {
  const batch = await productsCollection.findOne({ id: req.params.id });
  if (!batch) {
    return res.status(404).json({ success: false, error: 'BATCH_NOT_FOUND' });
  }

  const count = Math.min(Math.max(Number(req.body?.count || 1), 1), 5000);
  const created = [];

  for (let i = 0; i < count; i += 1) {
    const label = {
      id: uuidv4(),
      batch_id: batch.id,
      code: crypto.randomUUID(),
      first_scan_at: null,
      scan_count: 0,
      last_scan_at: null,
      created_at: new Date().toISOString()
    };

    await labelsCollection.insertOne(label);
    created.push({ id: label.id, batch_id: label.batch_id, code: label.code });
  }

  res.json({ success: true, labels: created });
}));

app.get('/api/labels/:code/qr', asyncHandler(async (req, res) => {
  const label = await labelsCollection.findOne({ code: req.params.code });
  if (!label) {
    return res.status(404).send('NOT_FOUND');
  }

  const host = req.get('host') || `localhost:${PORT}`;
  const frontendHost = host.replace(new RegExp(`:${PORT}$`), ':8080');
  const verifyUrl = `${req.protocol}://${frontendHost}/verify/${label.code}`;
  const png = await QRCode.toBuffer(verifyUrl, { type: 'png', margin: 1, scale: 8 });

  res.setHeader('Content-Type', 'image/png');
  res.send(png);
}));

app.get('/api/verify/:code', asyncHandler(async (req, res) => {
  const label = await labelsCollection.findOne({ code: req.params.code });
  if (!label) {
    return res.status(404).json({ success: false, error: 'LABEL_NOT_FOUND' });
  }

  const now = new Date().toISOString();
  await labelsCollection.updateOne(
    { code: label.code },
    {
      $inc: { scan_count: 1 },
      $set: {
        first_scan_at: label.first_scan_at || now,
        last_scan_at: now
      }
    }
  );

  const updatedLabel = await labelsCollection.findOne({ code: label.code });
  const batch = await productsCollection.findOne({ id: label.batch_id });
  if (!batch) {
    return res.status(404).json({ success: false, error: 'BATCH_NOT_FOUND' });
  }

  const events = await eventsCollection.find({ batch_id: batch.id }).sort({ created_at: -1 }).toArray();
  const unsigned = events.filter((event) => !event.signature);

  let tampered = false;
  for (const event of events) {
    if (!event.signature) continue;
    if (!verifyBytes(Buffer.from(event.payload_hash, 'utf8'), event.signature)) {
      tampered = true;
      break;
    }
  }

  let status = 'valid';
  if (batch.revoked) status = 'revoked';
  else if (tampered) status = 'tampered';
  else if (events.length === 0 || unsigned.length === events.length) status = 'unsigned';

  res.json({
    success: true,
    status,
    suspicious: updatedLabel?.scan_count >= 10,
    scan_count: updatedLabel?.scan_count || 0,
    batch,
    events,
    public_key: keys.publicKeyPem
  });
}));

app.post('/api/batches/:id/revoke', requireAdmin, asyncHandler(async (req, res) => {
  const batch = await productsCollection.findOne({ id: req.params.id });
  if (!batch) {
    return res.status(404).json({ success: false, error: 'BATCH_NOT_FOUND' });
  }

  const reason = String(req.body?.reason || '').slice(0, 300);
  await productsCollection.updateOne(
    { id: batch.id },
    { $set: { revoked: true, revoke_reason: reason } }
  );

  const updatedBatch = await productsCollection.findOne({ id: batch.id });
  res.json({ success: true, batch: updatedBatch });
}));

app.get('/api/admin/stats', requireAdmin, asyncHandler(async (_req, res) => {
  const totalBatches = await productsCollection.countDocuments();
  const totalLabels = await labelsCollection.countDocuments();
  const totalEvents = await eventsCollection.countDocuments();
  const signedEvents = await eventsCollection.countDocuments({ signature: { $ne: null } });
  const revoked = await productsCollection.countDocuments({ revoked: true });
  const scanAgg = await labelsCollection.aggregate([
    { $group: { _id: null, totalScans: { $sum: '$scan_count' } } }
  ]).toArray();

  res.json({
    success: true,
    stats: {
      totalBatches,
      totalLabels,
      totalEvents,
      signedEvents,
      revoked,
      totalScans: scanAgg[0]?.totalScans || 0
    }
  });
}));

app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, error: 'INTERNAL_SERVER_ERROR' });
});

async function ensureDatabase() {
  if (productsCollection && eventsCollection && labelsCollection) {
    return {
      productsCollection,
      eventsCollection,
      labelsCollection
    };
  }

  if (!mongoClientPromise) {
    mongoClient = new MongoClient(MONGO_URI);
    mongoClientPromise = mongoClient.connect();
  }

  const client = await mongoClientPromise;
  console.log('Connected to MongoDB');

  const db = client.db(MONGO_DB_NAME);
  productsCollection = db.collection(COLLECTIONS.products);
  eventsCollection = db.collection(COLLECTIONS.events);
  labelsCollection = db.collection(COLLECTIONS.labels);

  await Promise.all([
    productsCollection.createIndex({ id: 1 }, { unique: true }),
    productsCollection.createIndex({ product_type: 1 }),
    eventsCollection.createIndex({ batch_id: 1 }),
    eventsCollection.createIndex({ id: 1 }, { unique: true }),
    labelsCollection.createIndex({ code: 1 }, { unique: true }),
    labelsCollection.createIndex({ batch_id: 1 })
  ]);

  return {
    productsCollection,
    eventsCollection,
    labelsCollection
  };
}

async function startServer() {
  await ensureDatabase();
  app.listen(PORT, () => {
    console.log(`Trace-to-Trust backend running on http://localhost:${PORT}`);
    console.log(`MongoDB Database: ${MONGO_DB_NAME}`);
    console.log(`Collections: ${COLLECTIONS.products}, ${COLLECTIONS.events}, ${COLLECTIONS.labels}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  });
}

module.exports = {
  app,
  ensureDatabase,
  canonicalize,
  signBytes,
  verifyBytes
};
