import { sb, json, phone, body, type VercelRequest, type VercelResponse } from './_supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, { message: 'Method not allowed' }, 405);
  try {
    const b: any = body(req);
    const p = phone(b.phone);
    if (!/^255[67]\d{8}$/.test(p)) return json(res, { message: 'Weka namba sahihi ya simu' }, 400);
    const found = await sb(`aviator_users?phone=eq.${encodeURIComponent(p)}&select=*&limit=1`);
    if (found?.[0]) return json(res, { message: 'Namba hii tayari imesajiliwa. Ingia kwa namba hiyo.' }, 409);
    const rows = await sb('aviator_users', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ phone: p, current_package: 1 }),
    });
    const user = rows?.[0];
    if (!user) return json(res, { message: 'Imeshindikana kuunda account.' }, 500);
    const token = crypto.randomUUID() + crypto.randomUUID().replaceAll('-', '');
    await sb('aviator_sessions', {
      method: 'POST',
      body: JSON.stringify({ token, user_id: user.id, expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString() }),
    });
    return json(res, { user, token });
  } catch (e: any) {
    console.error('auth-register failed:', e);
    return json(res, { message: e?.message || 'Imeshindikana kuunda account' }, 500);
  }
}
