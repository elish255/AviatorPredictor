declare const process: { env: Record<string, string | undefined> };
import { json, supabaseRequest, type VercelRequest, type VercelResponse } from '../src/lib/server.js';

function allowed(req: VercelRequest) {
  const key = String(req.query?.key ?? '').trim();
  return Boolean(key) && key === (process.env['ADMIN_ACCESS_KEY'] ?? '').trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return json(res, { success: false, message: 'Invalid request.' }, 405);
  if (!allowed(req)) return json(res, { success: false, message: 'Unauthorized.' }, 401);
  try {
    const payments = await supabaseRequest('GET', 'aviator_payments', {
      select: 'id,user_id,package_no,amount,payment_phone,order_id,status,payment_status,reference,transaction_id,created_at,updated_at',
      order: 'created_at.desc',
      limit: '100',
    });
    if (!payments.ok || !Array.isArray(payments.data)) return json(res, { success: false, message: 'Imeshindikana kusoma malipo.' }, 500);
    const rows = payments.data as Record<string, unknown>[];
    const userIds = [...new Set(rows.map(r => Number(r.user_id ?? 0)).filter(Boolean))];
    const users = new Map<string, Record<string, unknown>>();
    for (const id of userIds) {
      const u = await supabaseRequest('GET', 'aviator_users', { select: 'id,full_name,phone,current_package,package1_status,package2_status,package3_status', id: `eq.${id}`, limit: '1' });
      if (u.ok && Array.isArray(u.data) && u.data[0]) users.set(String(id), u.data[0] as Record<string, unknown>);
    }
    return json(res, { success: true, rows: rows.map(r => ({ ...r, user: users.get(String(r.user_id)) ?? null })) });
  } catch (error) {
    console.error(error);
    return json(res, { success: false, message: 'Server error.' }, 500);
  }
}
