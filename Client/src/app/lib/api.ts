export const ADMIN_PASSWORD_KEY = 'trace_admin_password_v1'

export function getAdminPassword() {
  return localStorage.getItem(ADMIN_PASSWORD_KEY) || ''
}

export function setAdminPassword(pw: string) {
  localStorage.setItem(ADMIN_PASSWORD_KEY, pw)
}

async function apiFetch(path: string, opts: RequestInit = {}, admin = false) {
  const headers: Record<string, string> = {
    ...(opts.headers as any),
  }
  if (admin) {
    const pw = getAdminPassword()
    if (pw) headers['x-admin-password'] = pw
  }

  const res = await fetch(path, { ...opts, headers })
  const text = await res.text()
  let json: any = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { success: false, error: 'INVALID_JSON', raw: text }
  }
  if (!res.ok) {
    throw Object.assign(new Error(json?.error || 'HTTP_ERROR'), { status: res.status, body: json })
  }
  return json
}

export const api = {
  health: () => apiFetch('/api/health'),
  adminStats: () => apiFetch('/api/admin/stats', {}, true),
  listBatches: (product_type?: string) =>
    apiFetch(product_type ? `/api/batches?product_type=${encodeURIComponent(product_type)}` : '/api/batches', {}, true),
  createBatch: (data: any) => apiFetch('/api/batches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }, true),
  getBatch: (id: string) => apiFetch(`/api/batches/${encodeURIComponent(id)}`, {}, true),
  addEvent: (batchId: string, data: any) => apiFetch(`/api/batches/${encodeURIComponent(batchId)}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }, true),
  signEvent: (eventId: string) => apiFetch(`/api/events/${encodeURIComponent(eventId)}/sign`, { method: 'POST' }, true),
  createLabels: (batchId: string, count: number) => apiFetch(`/api/batches/${encodeURIComponent(batchId)}/labels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count }),
  }, true),
  verify: (code: string) => apiFetch(`/api/verify/${encodeURIComponent(code)}`),
}
