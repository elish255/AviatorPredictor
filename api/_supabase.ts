declare const process: { env: Record<string, string | undefined> };

export type VercelRequest = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
};

export type VercelResponse = {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
};

function env(name: string) {
  return String(process.env[name] ?? '').trim();
}

function config() {
  const url = (env('SUPABASE_URL') || env('VITE_SUPABASE_URL')).replace(/\/$/, '');
  const key = env('SUPABASE_SERVICE_ROLE_KEY') || env('SUPABASE_SECRET_KEY') || env('SUPABASE_SERVICE_KEY');

  if (!url) throw new Error('Supabase URL is missing. Set SUPABASE_URL in Vercel Production environment variables.');
  if (!key) throw new Error('Supabase server key is missing. Set SUPABASE_SERVICE_ROLE_KEY in Vercel Production environment variables.');

  return { url, key };
}

export async function sb(path: string, init: RequestInit = {}) {
  const { url, key } = config();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const headers = new Headers(init.headers);
    headers.set('apikey', key);
    headers.set('Authorization', `Bearer ${key}`);
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    const r = await fetch(`${url}/rest/v1/${path}`, { ...init, headers, signal: controller.signal });
    const text = await r.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!r.ok) {
      const message = data?.message || data?.hint || data?.details || data?.error_description || `Database request failed (${r.status})`;
      const err = new Error(String(message));
      (err as any).status = r.status;
      (err as any).code = data?.code;
      throw err;
    }
    return data;
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error('Supabase request timed out after 10 seconds. Check SUPABASE_URL/network.');
    throw e;
  } finally {
    clearTimeout(timeout);
  }
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
