declare const process: { env: Record<string, string | undefined> };
import {
  json, normalizeTanzaniaPhone, packageAmount, packageAllowed, packagePaid, packageRedirect,
  supabaseFirst, supabaseInsert, supabaseUpdate, type VercelRequest, type VercelResponse,
} from '../src/lib/server.js';

function env(name: string, fallback = '') { return (process.env[name] ?? fallback).trim(); }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, { success: false, status: 'ERROR', message: 'Request method sio sahihi.' }, 405);
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const userId = Number(body.userId ?? 0);
    const pkg = Number(body.package ?? 0);
    const phone = normalizeTanzaniaPhone(String(body.phone ?? ''));
    if (!userId) return json(res, { success: false, status: 'ERROR', message: 'Session imekwisha. Login tena.' }, 401);
    if (![1, 2, 3].includes(pkg)) return json(res, { success: false, status: 'ERROR', message: 'Package sio sahihi.' }, 400);
    if (!phone) return json(res, { success: false, status: 'ERROR', message: 'Namba ya simu sio sahihi.' }, 400);

    const user = await supabaseFirst('aviator_users', { id: `eq.${userId}` });
    if (!user) return json(res, { success: false, status: 'ERROR', message: 'User hayupo.' }, 404);
    if (!packageAllowed(user, pkg)) return json(res, { success: false, status: 'ERROR', message: 'Hujaruhusiwa kulipia package hii.' }, 403);
    if (packagePaid(user, pkg)) return json(res, { success: true, status: 'ALREADY_PAID', message: 'Package hii tayari imelipiwa.', redirect: packageRedirect(pkg) });
    const amount = packageAmount(pkg);
    const currency = env('FIMIPAY_CURRENCY', 'TZS');
    const existing = await supabaseFirst('aviator_payments', { user_id: `eq.${userId}`, package_no: `eq.${pkg}`, status: `eq.pending`, order: 'created_at.desc' });
    if (existing?.order_id) return json(res, { success: true, status: 'PENDING', payment_status: String(existing.payment_status ?? 'PENDING'), order_id: String(existing.order_id), amount, currency });
    const apiKey = env('FIMIPAY_API_KEY');
    if (!apiKey) return json(res, { success: false, status: 'ERROR', message: 'Payment configuration haijakamilika.' }, 500);

    const createUrl = env('FIMIPAY_CREATE_PAYMENT_URL', 'https://fimipay.com/api/v1/payment/create_order');
    const fallbackEmail = env('FIMIPAY_BUYER_EMAIL', 'customer@example.com');
    const buyerName = String(user.fullname ?? user.name ?? user.firstname ?? 'Customer').trim() || 'Customer';
    const buyerEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(user.email ?? '')) ? String(user.email) : fallbackEmail;

    const response = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'FimiPay-SDK/1.0',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ buyer_email: buyerEmail, buyer_name: buyerName, buyer_phone: phone, amount, currency, payment_method: 'mobile' }),
    });
    const raw = await response.text();
    let result: any;
    try { result = JSON.parse(raw); } catch { result = null; }
    const data = result?.data && typeof result.data === 'object' ? result.data : {};
    const orderId = String(data.order_id ?? result?.order_id ?? '').trim();
    const paymentStatus = String(data.payment_status ?? result?.payment_status ?? 'PENDING').toUpperCase();
    const apiStatus = String(result?.status ?? '').toLowerCase();
    if (!response.ok || apiStatus !== 'success' || !orderId) {
      console.error('Payment create failed', response.status, raw.slice(0, 1500));
      return json(res, { success: false, status: 'ERROR', message: 'Imeshindikana kuanzisha malipo.' }, 400);
    }

    const inserted = await supabaseInsert('aviator_payments', {
      user_id: userId,
      package_no: pkg,
      amount,
      payment_phone: phone,
      reference: String(data.reference ?? ''),
      status: 'pending',
      payment_status: paymentStatus || 'PENDING',
      order_id: orderId,
    });
    if (!inserted) return json(res, { success: false, status: 'ERROR', message: 'Payment haikuweza kuhifadhiwa.' }, 500);

    await supabaseUpdate('aviator_users', { id: `eq.${userId}` }, { [`package${pkg}_status`]: 'pending', current_package: pkg, payment_status: 'pending', last_page: `/waiting?order=${encodeURIComponent(orderId)}` });
    return json(res, { success: true, status: 'PENDING', payment_status: paymentStatus, order_id: orderId, amount, currency });
  } catch (error) {
    console.error(error);
    return json(res, { success: false, status: 'ERROR', message: 'Kuna tatizo la server. Jaribu tena.' }, 500);
  }
}
