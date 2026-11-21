import { sb, json, phone, requireSession, body, type VercelRequest, type VercelResponse } from './_supabase.js';
import { DALIPAY_ORDER_PREFIX, DALIPAY_PROVIDERS, dalipayConfigured, dalipayExternalId, dalipayRequest, DalipayError } from './_dalipay.js';

const prices: Record<number, number> = { 1: 2000, 2: 3000, 3: 5000 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, { message: 'Method not allowed' }, 405);
  try {
    if (!dalipayConfigured()) return json(res, { message: 'Dalipay haijawekwa tayari' }, 503);
    const uid = await requireSession(req);
    const b = body(req);
    const packageNo = Number(b.package_no);
    const amount = prices[packageNo];
    const p = phone(b.phone);
    if (!amount || !/^255[67]\d{8}$/.test(p)) return json(res, { message: 'Namba au package si sahihi' }, 400);
    if (!DALIPAY_PROVIDERS.includes(b.provider)) return json(res, { message: 'Chagua mtandao sahihi wa malipo' }, 400);

    const users = await sb(`aviator_users?id=eq.${encodeURIComponent(uid)}&select=id,phone,full_name,current_package&limit=1`);
    const user = users?.[0];
    if (!user) return json(res, { message: 'Session expired' }, 401);
    if (Number(user.current_package) !== packageNo) return json(res, { message: `Unaendelea na hatua ${user.current_package}` }, 409);

    const data = await dalipayRequest('', {
      account_number: `0${p.slice(3)}`,
      amount,
      currency: 'TZS',
      provider: b.provider,
      external_id: dalipayExternalId(),
      customer_name: String(user.full_name || 'Customer').trim()
    });
    if (typeof data.uuid !== 'string' || !/^[0-9a-f-]{36}$/i.test(data.uuid)) {
      return json(res, { message: 'Dalipay haikutoa kumbukumbu sahihi ya malipo' }, 502);
    }
    // Keep the existing schema; the prefix distinguishes new Dalipay orders
    // from older FimiPay orders that may still need to finish polling.
    const orderId = `${DALIPAY_ORDER_PREFIX}${data.uuid}`;
    await sb('aviator_payments', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ user_id: uid, package_no: packageNo, amount, status: 'PENDING', order_id: orderId, phone: p })
    });
    return json(res, { order_id: orderId, payment_status: 'PENDING' });
  } catch (e: any) {
    if (e instanceof DalipayError) {
      return json(res, {
        message: `${e.message} [${e.code}; kumbukumbu: ${e.diagnosticId}]`,
        code: e.code,
        diagnostic_id: e.diagnosticId
      }, e.httpStatus);
    }
    return json(res, { message: e?.message || 'Imeshindikana kuanzisha malipo' }, 400);
  }
}
