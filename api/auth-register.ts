import { json, normalizeTanzaniaPhone, supabaseFirst, supabaseInsert, type VercelRequest, type VercelResponse } from '../src/lib/server';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, { success: false, message: 'Request method sio sahihi.' }, 405);
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const phone = normalizeTanzaniaPhone(String(body.phone ?? ''));
    if (!phone) return json(res, { success: false, message: 'Tafadhali ingiza namba sahihi ya simu, mfano 0712345678.' }, 400);

    const existing = await supabaseFirst('aviator_users', { phone: `eq.${phone}` });
    if (existing) return json(res, { success: false, message: 'Namba hii tayari imesajiliwa. Tumia INGIA.' }, 409);

    const user = await supabaseInsert('aviator_users', {
      full_name: `User ${phone.slice(-4)}`,
      phone,
      current_package: 0,
      payment_status: 'pending',
      package1_status: 'locked',
      package2_status: 'locked',
      package3_status: 'locked',
      completed: 0,
      last_page: '/betting-site',
    });
    if (!user) return json(res, { success: false, message: 'Imeshindikana kutengeneza account.' }, 500);
    return json(res, { success: true, user });
  } catch (error) {
    console.error(error);
    return json(res, { success: false, message: 'Imeshindikana kuwasiliana na database.' }, 500);
  }
}
