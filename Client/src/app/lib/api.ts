async function apiFetch(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...(opts.headers as any),
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
  adminStats: () => apiFetch('/api/admin/stats'),
  listBatches: (product_type?: string) =>
    apiFetch(product_type ? `/api/batches?product_type=${encodeURIComponent(product_type)}` : '/api/batches'),
  createBatch: (data: any) => apiFetch('/api/batches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updateBatch: (id: string, data: any) => apiFetch(`/api/batches/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  getBatch: (id: string) => apiFetch(`/api/batches/${encodeURIComponent(id)}`),
  addEvent: (batchId: string, data: any) => apiFetch(`/api/batches/${encodeURIComponent(batchId)}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  signEvent: (eventId: string) => apiFetch(`/api/events/${encodeURIComponent(eventId)}/sign`, { method: 'POST' }),
  createLabels: (batchId: string, count: number) => apiFetch(`/api/batches/${encodeURIComponent(batchId)}/labels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count }),
  }),
  revokeBatch: (id: string, reason: string) => apiFetch(`/api/batches/${encodeURIComponent(id)}/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  }),
  verify: (code: string) => apiFetch(`/api/verify/${encodeURIComponent(code)}`),
}
