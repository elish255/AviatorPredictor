declare const process: { env: Record<string, string | undefined> };

export type VercelRequest = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
};

export type VercelResponse = {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
};

function config() {
  const url = String(process.env.SUPABASE_URL ?? '').trim().replace(/\/$/, '');
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? '').trim();
  if (!url || !key) throw new Error('Supabase environment variables are missing');
  return { url, key };
}

export async function sb(path: string, init: RequestInit = {}) {
  const { url, key } = config();
  const headers = new Headers(init.headers);
  headers.set('apikey', key);
  headers.set('Authorization', `Bearer ${key}`);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  const r = await fetch(`${url}/rest/v1/${path}`, { ...init, headers });
  const text = await r.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!r.ok) throw new Error(data?.message || data?.hint || data?.details || `Database request failed (${r.status})`);
  return data;
}

export function json(res: VercelResponse, data: any, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.end(JSON.stringify(data));
}

export function body(req: VercelRequest): any {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

export function phone(v: any) {
  let p = String(v ?? '').replace(/\D/g, '');
  if (p.startsWith('0')) p = '255' + p.slice(1);
  if (!p.startsWith('255') && p.length === 9) p = '255' + p;
  return p;
}

export async function requireSession(req: VercelRequest) {
  const raw = req.headers?.['x-session-token'];
  const token = Array.isArray(raw) ? String(raw[0] ?? '') : String(raw ?? '');
  if (!token) throw new Error('Session required');
  const rows = await sb(`aviator_sessions?token=eq.${encodeURIComponent(token)}&select=token,user_id,expires_at&limit=1`);
  if (!rows?.[0]) throw new Error('Session expired');
  if (new Date(rows[0].expires_at).getTime() < Date.now()) throw new Error('Session expired');
  return rows[0].user_id as string;
}
