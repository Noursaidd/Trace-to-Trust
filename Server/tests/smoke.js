const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const dns = require('dns');
const { MongoClient } = require('mongodb');

dns.setDefaultResultOrder('verbatim');
dns.setServers(['1.1.1.1', '8.8.8.8', '8.8.4.4']);

const BASE_URL = process.env.API_BASE || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ibrahim123';

async function cleanupSmokeBatch(batchId) {
  if (!batchId || !process.env.MONGO_URI || process.env.SKIP_SMOKE_CLEANUP === '1') return;

  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db(process.env.MONGO_DB_NAME || 'tracetotrust');

  await Promise.all([
    db.collection('Products').deleteOne({ id: batchId, product_type: 'SMOKE_TEST' }),
    db.collection('batch_events').deleteMany({ batch_id: batchId }),
    db.collection('labels').deleteMany({ batch_id: batchId })
  ]);

  await client.close();
}

async function getJson(path, init = {}) {
  const res = await fetch(`${BASE_URL}${path}`, init);
  const text = await res.text();
  let body = {};

  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`${path} -> HTTP ${res.status} ${JSON.stringify(body)}`);
  }

  return body;
}

async function main() {
  let batchId = '';

  const health = await getJson('/api/health');
  if (!health?.success) {
    throw new Error('health endpoint did not return success');
  }

  const headers = {
    'x-admin-password': ADMIN_PASSWORD,
    'Content-Type': 'application/json'
  };

  const createBatch = await getJson('/api/batches', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      product_name: `Smoke Product ${Date.now()}`,
      product_type: 'SMOKE_TEST',
      origin_region: 'Test Region',
      quantity: 1,
      description: 'Created by smoke test'
    })
  });

  batchId = createBatch?.batch?.id;
  if (!batchId) {
    throw new Error('failed to create batch');
  }

  const addEvent = await getJson(`/api/batches/${encodeURIComponent(batchId)}/events`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      event_type: 'QUALITY_TEST',
      payload: { result: 'pass', source: 'smoke' },
      location: 'Test Lab'
    })
  });

  const eventId = addEvent?.event?.id;
  if (!eventId) {
    throw new Error('failed to create event');
  }

  const signResp = await getJson(`/api/events/${encodeURIComponent(eventId)}/sign`, {
    method: 'POST',
    headers: { 'x-admin-password': ADMIN_PASSWORD }
  });

  if (!signResp?.signature) {
    throw new Error('failed to sign event');
  }

  const labelsResp = await getJson(`/api/batches/${encodeURIComponent(batchId)}/labels`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ count: 1 })
  });

  const code = labelsResp?.labels?.[0]?.code;
  if (!code) {
    throw new Error('failed to create label');
  }

  const verify = await getJson(`/api/verify/${encodeURIComponent(code)}`);
  const allowed = new Set(['valid', 'unsigned', 'tampered', 'revoked']);
  if (!allowed.has(verify?.status)) {
    throw new Error(`invalid verify status: ${String(verify?.status)}`);
  }

  console.log('Smoke test passed.');
  console.log(`Batch: ${batchId}`);
  console.log(`Label: ${code}`);
  await cleanupSmokeBatch(batchId);
}

main().catch((err) => {
  console.error('Smoke test failed:', err.message);
  process.exit(1);
});
