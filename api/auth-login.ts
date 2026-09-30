import { sb, json, phone, body, type VercelRequest, type VercelResponse } from './_supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, { message: 'Method not allowed' }, 405);
  try {
    const b: any = body(req);
    const p = phone(b.phone);
    if (!/^255[67]\d{8}$/.test(p)) return json(res, { message: 'Weka namba sahihi ya simu' }, 400);
    const rows = await sb(`aviator_users?phone=eq.${encodeURIComponent(p)}&select=*&limit=1`);
    if (!rows?.[0]) return json(res, { message: 'Namba haijasajiliwa' }, 404);
    const user = rows[0];
    const token = crypto.randomUUID() + crypto.randomUUID().replaceAll('-', '');
    await sb('aviator_sessions', {
      method: 'POST',
      body: JSON.stringify({ token, user_id: user.id, expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString() }),
    });
    return json(res, { user, token });
  } catch (e: any) {
    console.error('auth-login failed:', e);
    return json(res, { message: e?.message || 'Imeshindikana kuingia' }, 500);
  }
}
