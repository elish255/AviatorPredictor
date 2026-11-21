declare const process: { env: Record<string, string | undefined> };
import { sb, json, requireSession, body, type VercelRequest, type VercelResponse } from './_supabase.js';

import { DALIPAY_ORDER_PREFIX, dalipayRequest, dalipayStatus } from './_dalipay.js';

const STATUS_URL = process.env.FIMIPAY_ORDER_STATUS_URL || 'https://fimipay.com/api/v1/payment/order_status';
const API_KEY = process.env.FIMIPAY_API_KEY || '';

async function advance(uid: string, pkg: number) {
  // Package 1 -> 2, Package 2 -> 3, Package 3 -> dashboard/completed state (4).
  const next = pkg >= 3 ? 4 : pkg + 1;
  // Make advancement idempotent. If the gateway/Supabase already marked the
  // payment SUCCESS, this still makes sure the user's current package moves on.
  const rows = await sb(`aviator_users?id=eq.${encodeURIComponent(uid)}&select=id,current_package&limit=1`);
  const user = rows?.[0];
  if (!user) throw new Error('User haijapatikana');

  const current = Number(user.current_package || 1);
  if (current === pkg) {
    await sb(`aviator_users?id=eq.${encodeURIComponent(uid)}`, {
      method: 'PATCH',
      body: JSON.stringify({ current_package: next, last_package: pkg })
    });
    return next;
  }

  // If the user has already moved past this package, do not move them back.
  // This also makes repeated SUCCESS polling safe.
  if (current === next || current > pkg) return current;

  // Defensive recovery for an older/inconsistent record.
  await sb(`aviator_users?id=eq.${encodeURIComponent(uid)}`, {
    method: 'PATCH',
    body: JSON.stringify({ current_package: next, last_package: pkg })
  });
  return next;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, { message: 'Method not allowed' }, 405);
  try {
    const uid = await requireSession(req);
    const b: any = body(req);
    const orderId = String(b.order_id || '');
    if (!orderId) return json(res, { message: 'Order haipo' }, 400);

    const rows = await sb(`aviator_payments?order_id=eq.${encodeURIComponent(orderId)}&user_id=eq.${encodeURIComponent(uid)}&select=id,user_id,package_no,status,order_id,amount&limit=1`);
    const pay = rows?.[0];
    if (!pay) return json(res, { message: 'Payment haijapatikana' }, 404);

    // IMPORTANT: even when our DB already says SUCCESS, advance the package
    // if an earlier request did not complete the user update.
    if (['SUCCESS', 'COMPLETED', 'PAID'].includes(String(pay.status).toUpperCase())) {
      const nextPackage = await advance(uid, Number(pay.package_no));
      return json(res, { payment_status: 'SUCCESS', next_package: nextPackage });
    }

    let rawStatus: string;
    if (orderId.startsWith(DALIPAY_ORDER_PREFIX)) {
      const uuid = orderId.slice(DALIPAY_ORDER_PREFIX.length);
      const data = await dalipayRequest(`/${encodeURIComponent(uuid)}/status`);
      // A paid result must match this collection and the server-priced amount.
      if (data.uuid !== uuid || Number(data.amount) !== Number(pay.amount) || data.currency !== 'TZS') {
        return json(res, { message: 'Taarifa za malipo hazilingani' }, 502);
      }
      rawStatus = dalipayStatus(data.status);
    } else {
      // Preserve status checks for FimiPay orders created before the switch.
      if (!API_KEY) return json(res, { message: 'Legacy payment service is not configured' }, 503);
      const r = await fetch(STATUS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'FimiPay-SDK/1.0',
          Authorization: `Bearer ${API_KEY}`
        },
        body: JSON.stringify({ order_id: orderId })
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) return json(res, { message: 'Imeshindikana kuangalia malipo' }, 502);
      rawStatus = String(data?.data?.payment_status || data?.payment_status || 'PENDING').toUpperCase();
    }
    const success = ['SUCCESS', 'COMPLETED', 'PAID'].includes(rawStatus);
    await sb(`aviator_payments?id=eq.${encodeURIComponent(pay.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: rawStatus })
    });

    let nextPackage: number | undefined;
    if (success) {
      nextPackage = await advance(uid, Number(pay.package_no));
    }

    return json(res, {
      payment_status: success ? 'SUCCESS' : rawStatus,
      ...(nextPackage ? { next_package: nextPackage } : {})
    });
  } catch (e: any) {
    console.error('payment-status failed:', e);
    return json(res, { message: e?.message || 'Imeshindikana kuangalia malipo' }, 400);
  }
}
