const path = require('path');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const { canonicalize, signBytes } = require('../index');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'tracetotrust';

const now = new Date().toISOString();

const sampleBatches = [
  {
    id: 'om-hny-sidr-2026-batch-001',
    product_name: 'Premium Sidr Honey',
    product_type: 'HONEY',
    producer_id: 'producer-jabal-akhdar-apiaries',
    origin_region: 'Nizwa',
    quantity: 120,
    production_date: '2026-01-18',
    expiry_date: '2027-01-18',
    description: 'Single-origin Omani Sidr honey harvested from registered hives near Jabal Akhdar.',
    revoked: false,
    revoke_reason: null,
    created_at: '2026-01-18T08:00:00.000Z',
    seed_slug: 'sidr-honey'
  },
  {
    id: 'om-frk-dhofar-2026-batch-001',
    product_name: 'Dhofar Hojari Frankincense',
    product_type: 'FRANKINCENSE',
    producer_id: 'producer-dhofar-resins',
    origin_region: 'Salalah',
    quantity: 80,
    production_date: '2026-02-03',
    expiry_date: '2029-02-03',
    description: 'Hojari-grade resin sorted and packed for premium retail traceability.',
    revoked: false,
    revoke_reason: null,
    created_at: '2026-02-03T07:30:00.000Z',
    seed_slug: 'hojari-frankincense'
  },
  {
    id: 'om-dat-nizwa-2026-batch-001',
    product_name: 'Nizwa Khalas Dates',
    product_type: 'DATES',
    producer_id: 'producer-nizwa-date-farms',
    origin_region: 'Nizwa',
    quantity: 300,
    production_date: '2026-03-10',
    expiry_date: '2026-11-30',
    description: 'Premium Khalas dates graded, packed, and tracked from farm to retail.',
    revoked: false,
    revoke_reason: null,
    created_at: '2026-03-10T09:15:00.000Z',
    seed_slug: 'khalas-dates'
  },
  {
    id: 'om-fsh-sur-2026-batch-001',
    product_name: 'Sur Yellowfin Tuna',
    product_type: 'FISH',
    producer_id: 'producer-sur-fisheries',
    origin_region: 'Sur',
    quantity: 42,
    production_date: '2026-04-08',
    expiry_date: '2026-04-20',
    description: 'Cold-chain seafood batch revoked after an inspection issue.',
    revoked: true,
    revoke_reason: 'Recall: cold-chain temperature exceeded the allowed threshold during transport.',
    created_at: '2026-04-08T05:45:00.000Z',
    seed_slug: 'yellowfin-tuna'
  }
];

const sampleLabels = [
  {
    id: 'om-label-hny-sidr-2026-001',
    batch_id: 'om-hny-sidr-2026-batch-001',
    code: 'OM-HNY-SIDR-2026-001',
    scan_count: 2,
    first_scan_at: '2026-04-18T10:00:00.000Z',
    last_scan_at: '2026-04-18T11:45:00.000Z',
    created_at: '2026-01-18T08:20:00.000Z'
  },
  {
    id: 'om-label-frk-dhofar-2026-001',
    batch_id: 'om-frk-dhofar-2026-batch-001',
    code: 'OM-FRK-DHOFAR-2026-001',
    scan_count: 4,
    first_scan_at: '2026-04-17T12:10:00.000Z',
    last_scan_at: '2026-04-19T14:30:00.000Z',
    created_at: '2026-02-03T08:00:00.000Z'
  },
  {
    id: 'om-label-dat-nizwa-2026-001',
    batch_id: 'om-dat-nizwa-2026-batch-001',
    code: 'OM-DAT-NIZWA-2026-001',
    scan_count: 11,
    first_scan_at: '2026-04-15T09:00:00.000Z',
    last_scan_at: '2026-04-19T17:20:00.000Z',
    created_at: '2026-03-10T10:10:00.000Z'
  },
  {
    id: 'om-label-fsh-sur-2026-001',
    batch_id: 'om-fsh-sur-2026-batch-001',
    code: 'OM-FSH-SUR-2026-001',
    scan_count: 1,
    first_scan_at: '2026-04-09T08:00:00.000Z',
    last_scan_at: '2026-04-09T08:00:00.000Z',
    created_at: '2026-04-08T06:10:00.000Z'
  }
];

const eventTemplates = {
  'om-hny-sidr-2026-batch-001': [
    ['ORIGIN_DECLARED', 'Nizwa', '2026-01-18T08:10:00.000Z', { farm: 'Jabal Akhdar Apiaries', hive_group: 'JA-17', floral_source: 'Sidr' }],
    ['HARVEST_OR_CATCH', 'Jabal Akhdar', '2026-01-18T09:30:00.000Z', { harvest_lot: 'HNY-2026-0118', moisture_percent: 17.8 }],
    ['QUALITY_TEST', 'Nizwa Lab', '2026-01-19T13:15:00.000Z', { result: 'pass', hmf_ppm: 12, antibiotic_screen: 'clear' }],
    ['PACKAGING', 'Nizwa Packhouse', '2026-01-20T07:45:00.000Z', { jars: 120, net_weight_g: 500 }]
  ],
  'om-frk-dhofar-2026-batch-001': [
    ['ORIGIN_DECLARED', 'Salalah', '2026-02-03T07:45:00.000Z', { grove: 'Wadi Dawkah', grade: 'Hojari' }],
    ['PROCESSING', 'Salalah Sorting Center', '2026-02-04T10:30:00.000Z', { sorted_weight_kg: 80, impurity_percent: 1.2 }],
    ['PACKAGING', 'Salalah', '2026-02-05T15:05:00.000Z', { packs: 160, pack_weight_g: 500 }]
  ],
  'om-dat-nizwa-2026-batch-001': [
    ['ORIGIN_DECLARED', 'Nizwa', '2026-03-10T09:20:00.000Z', { farm: 'Falaj Daris Date Farm', variety: 'Khalas' }],
    ['PROCESSING', 'Nizwa', '2026-03-11T11:00:00.000Z', { wash_cycle: 'complete', grade: 'A' }],
    ['QUALITY_TEST', 'Nizwa Food Lab', '2026-03-12T14:40:00.000Z', { result: 'pass', moisture_percent: 20.1 }],
    ['RETAIL_DELIVERY', 'Muscat', '2026-03-15T16:10:00.000Z', { retailer: 'Muscat Heritage Market', cartons: 30 }]
  ],
  'om-fsh-sur-2026-batch-001': [
    ['HARVEST_OR_CATCH', 'Sur Harbor', '2026-04-08T05:55:00.000Z', { vessel: 'SUR-14', catch_method: 'line-caught' }],
    ['STORAGE', 'Sur Cold Store', '2026-04-08T06:35:00.000Z', { temperature_c: 1.8, ice_batch: 'ICE-884' }],
    ['TRANSPORT', 'Muscat Highway', '2026-04-08T10:50:00.000Z', { vehicle: 'TRK-2204', max_temperature_c: 8.5 }]
  ]
};

function signedEvent(batchId, index, [eventType, location, timestamp, payload]) {
  const payloadCanonical = canonicalize(payload);
  const payloadHash = crypto.createHash('sha256').update(payloadCanonical).digest('hex');

  return {
    id: `${batchId}-${String(index + 1).padStart(2, '0')}-${eventType.toLowerCase()}`,
    batch_id: batchId,
    event_type: eventType,
    payload_json: payloadCanonical,
    payload_hash: payloadHash,
    location,
    timestamp,
    trust_tier: 'B',
    signature: signBytes(Buffer.from(payloadHash, 'utf8')),
    signed_at: now,
    created_at: timestamp
  };
}

async function seed() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();

  const db = client.db(MONGO_DB_NAME);
  const products = db.collection('Products');
  const events = db.collection('batch_events');
  const labels = db.collection('labels');

  await Promise.all([
    products.createIndex({ id: 1 }, { unique: true }),
    products.createIndex({ product_type: 1 }),
    events.createIndex({ batch_id: 1 }),
    events.createIndex({ id: 1 }, { unique: true }),
    labels.createIndex({ code: 1 }, { unique: true }),
    labels.createIndex({ batch_id: 1 })
  ]);

  for (const batch of sampleBatches) {
    await products.updateOne(
      { id: batch.id },
      { $set: { ...batch, seeded_at: now }, $unset: { demo_slug: '', demo_seeded_at: '' } },
      { upsert: true }
    );
  }

  for (const batch of sampleBatches) {
    const batchEvents = eventTemplates[batch.id].map((template, index) => signedEvent(batch.id, index, template));
    for (const event of batchEvents) {
      await events.updateOne(
        { id: event.id },
        { $set: { ...event, seeded_at: now }, $unset: { demo_seeded_at: '' } },
        { upsert: true }
      );
    }
  }

  for (const label of sampleLabels) {
    await labels.updateOne(
      { code: label.code },
      {
        $set: {
          id: label.id,
          batch_id: label.batch_id,
          code: label.code,
          created_at: label.created_at,
          seeded_at: now
        },
        $unset: {
          demo_seeded_at: ''
        },
        $setOnInsert: {
          scan_count: label.scan_count,
          first_scan_at: label.first_scan_at,
          last_scan_at: label.last_scan_at
        }
      },
      { upsert: true }
    );
  }

  const legacyBatchIds = [
    'demo-honey-sidr-2026',
    'demo-frankincense-dhofar-2026',
    'demo-dates-nizwa-2026',
    'demo-fish-sur-2026'
  ];

  await labels.deleteMany({
    code: {
      $in: [
        'DEMO-HONEY-SIDR-2026',
        'DEMO-FRANKINCENSE-DHOFAR-2026',
        'DEMO-DATES-NIZWA-2026',
        'DEMO-FISH-SUR-2026'
      ]
    }
  });
  await products.deleteMany({ id: { $in: legacyBatchIds } });
  await events.deleteMany({ batch_id: { $in: legacyBatchIds } });
  await labels.deleteMany({ batch_id: { $in: legacyBatchIds } });

  const counts = {
    products: await products.countDocuments(),
    events: await events.countDocuments(),
    labels: await labels.countDocuments()
  };

  console.log(`Seeded ${sampleBatches.length} sample batches and ${sampleLabels.length} sample labels.`);
  console.log(`Collection counts: Products=${counts.products}, batch_events=${counts.events}, labels=${counts.labels}`);
  console.log('Primary verification URL path: /verify/OM-HNY-SIDR-2026-001');

  await client.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
