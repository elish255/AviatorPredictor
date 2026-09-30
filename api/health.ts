import { sb, json, type VercelRequest, type VercelResponse } from './_supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return json(res, { ok: false, message: 'Method not allowed' }, 405);
  try {
    const rows = await sb('aviator_users?select=id&limit=1');
    return json(res, { ok: true, database: 'connected', sample_rows: Array.isArray(rows) ? rows.length : 0 });
  } catch (e: any) {
    console.error('health failed:', e);
    return json(res, { ok: false, database: 'error', message: String(e?.message || 'Database connection failed'), error_code: e?.code || null }, 500);
  }
}
