const BASE_URL = process.env.API_BASE || 'http://127.0.0.1:8081';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ibrahim123';

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
  const health = await getJson('/api/health');
  if (!health?.success) throw new Error('health endpoint did not return success');

  const headers = { 'x-admin-password': ADMIN_PASSWORD };
  const batchesResp = await getJson('/api/batches', { headers });
  const batches = batchesResp?.batches || [];
  if (batches.length < 4) {
    throw new Error(`expected at least 4 seeded batches, got ${batches.length}`);
  }

  const labelCodes = [];
  for (const batch of batches.slice(0, 4)) {
    const details = await getJson(`/api/batches/${encodeURIComponent(batch.id)}`, { headers });
    if (!details?.labels?.length) throw new Error(`batch ${batch.id} has no labels`);
    labelCodes.push(details.labels[0].code);
  }

  const allowed = new Set(['valid', 'unsigned', 'tampered', 'revoked']);
  for (const code of labelCodes.slice(0, 3)) {
    const verify = await getJson(`/api/verify/${encodeURIComponent(code)}`);
    if (!allowed.has(verify?.status)) {
      throw new Error(`label ${code} has invalid status: ${String(verify?.status)}`);
    }
    if (!verify?.batch?.id) throw new Error(`label ${code} missing batch`);
    if (!Array.isArray(verify?.events) || verify.events.length < 3) {
      throw new Error(`label ${code} missing realistic event chain`);
    }
  }

  console.log('Smoke test passed. Sample labels:');
  for (const code of labelCodes.slice(0, 3)) {
    console.log(`- ${code}`);
  }
}

main().catch((err) => {
  console.error('Smoke test failed:', err.message);
  process.exit(1);
});
