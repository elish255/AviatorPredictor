import { json, supabaseFirst, supabaseUpdate, type VercelRequest, type VercelResponse } from '../src/lib/server';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, { success: false, message: 'Request method sio sahihi.' }, 405);
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const phone = String(body.phone ?? '').replace(/[^0-9]/g, '');
    if (!/^0[67][0-9]{8}$/.test(phone)) return json(res, { success: false, message: 'Tafadhali ingiza namba sahihi ya simu, mfano 0712345678.' }, 400);
    const normalized = `255${phone.slice(1)}`;
    const user = await supabaseFirst('aviator_users', { or: `(phone.eq.${phone},phone.eq.${normalized})` });
    if (!user) return json(res, { success: false, message: 'Account haipo. Tafadhali jisajili kwanza.' }, 404);
    const updated = await supabaseUpdate('aviator_users', { id: `eq.${user.id}` }, { last_login_at: new Date().toISOString(), last_page: '/betting-site' });
    return json(res, { success: true, user: Array.isArray(updated) && updated[0] ? updated[0] : user });
  } catch (error) {
    console.error(error);
    return json(res, { success: false, message: 'Imeshindikana kuwasiliana na database.' }, 500);
  }
}
