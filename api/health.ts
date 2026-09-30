import { sb, json, type VercelRequest, type VercelResponse } from './_supabase.js';

function keyType() {
  const key = String(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '');
  if (!key) return 'missing';
  if (key.startsWith('sb_secret_')) return 'supabase_secret';
  if (key.startsWith('sb_publishable_') || key.startsWith('sb_anon_')) return 'publishable_or_anon';
  try {
    const p = key.split('.')[1];
    if (p) {
      const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
      return payload?.role === 'service_role' ? 'service_role_jwt' : String(payload?.role || 'jwt');
    }
  } catch {}
  return 'server_key';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return json(res, { ok: false, message: 'Method not allowed' }, 405);
  try {
    const rows = await sb('aviator_users?select=id&limit=1');
    return json(res, {
      ok: true,
      database: 'connected',
      server_key_type: keyType(),
      sample_rows: Array.isArray(rows) ? rows.length : 0
    });
  } catch (e: any) {
    console.error('health failed:', e);
    return json(res, {
      ok: false,
      database: 'error',
      server_key_type: keyType(),
      message: String(e?.message || 'Database connection failed'),
      error_code: e?.code || null
    }, 500);
  }
}
