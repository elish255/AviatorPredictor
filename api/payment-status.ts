declare const process: { env: Record<string, string | undefined> };
import {
  json, cycleValues, packageRedirect,
  supabaseFirst, supabaseUpdate,
  type VercelRequest, type VercelResponse,
} from '../src/lib/server';

function env(name: string, fallback = '') { return (process.env[name] ?? fallback).trim(); }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') return json(res, { success: false, status: 'ERROR', message: 'Request method sio sahihi.' }, 405);
  try {
    const q = req.query ?? {};
    const body = (req.body ?? {}) as Record<string, unknown>;
    const rawOrder = q.order_id ?? body.order_id ?? '';
    const rawUser = q.userId ?? body.userId ?? 0;
    const orderId = String(Array.isArray(rawOrder) ? rawOrder[0] : rawOrder).trim();
    const userId = Number(Array.isArray(rawUser) ? rawUser[0] : rawUser);
    if (!orderId || !userId) return json(res, { success: false, status: 'ERROR', message: 'Order ID haijapatikana.' }, 400);

    const payment = await supabaseFirst('aviator_payments', { order_id: `eq.${orderId}`, user_id: `eq.${userId}` });
    if (!payment) return json(res, { success: false, status: 'ERROR', message: 'Payment haipo kwenye database.' }, 404);
    const pkg = Number(payment.package_no ?? 0);

    if (String(payment.status ?? '').toLowerCase() === 'paid' || String(payment.payment_status ?? '').toUpperCase() === 'SUCCESS') {
      return json(res, { success: true, status: 'SUCCESS', payment_status: 'SUCCESS', order_id: orderId, package: pkg, redirect: packageRedirect(pkg) });
    }

    const apiKey = env('FIMIPAY_API_KEY');
    if (!apiKey) return json(res, { success: false, status: 'ERROR', message: 'Payment configuration haijakamilika.' }, 500);
    const statusUrl = env('FIMIPAY_ORDER_STATUS_URL', 'https://fimipay.com/api/v1/payment/order_status');
    const timeout = Math.min(120, Math.max(10, Number(env('FIMIPAY_TIMEOUT', '60')) || 60));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout * 1000);
    let response: Response;
    try {
      response = await fetch(statusUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'FimiPay-SDK/1.0',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ order_id: orderId }),
        signal: controller.signal,
      });
    } finally { clearTimeout(timer); }

    const raw = await response.text();
    let result: any;
    try { result = JSON.parse(raw); } catch { result = null; }
    if (!response.ok || String(result?.status ?? '').toLowerCase() !== 'success') {
      console.error('Payment status failed', response.status, raw.slice(0, 1500));
      return json(res, { success: false, status: 'PENDING', payment_status: 'PENDING', order_id: orderId, message: '⏳ Inasubiri uthibitisho wa malipo...' });
    }

    const data = result?.data && typeof result.data === 'object' ? result.data : {};
    const paymentStatus = String(data.payment_status ?? result?.payment_status ?? 'PENDING').toUpperCase();
    const transactionId = String(data.transid ?? data.transaction_id ?? result?.transid ?? result?.transaction_id ?? '').trim();
    const reference = String(data.reference ?? result?.reference ?? payment.reference ?? '').trim();

    if (paymentStatus === 'SUCCESS') {
      const saved = await supabaseUpdate('aviator_payments', { id: `eq.${payment.id}` }, {
        status: 'paid', payment_status: 'SUCCESS', transaction_id: transactionId, reference,
      });
      if (saved === null) return json(res, { success: false, status: 'PROCESSING_ERROR', payment_status: 'SUCCESS', order_id: orderId, message: 'Malipo yamepokelewa lakini account bado inakamilishwa.' }, 500);

      const user = await supabaseFirst('aviator_users', { id: `eq.${userId}` });
      if (!user) return json(res, { success: false, status: 'PROCESSING_ERROR', payment_status: 'SUCCESS', order_id: orderId, message: 'User hayupo.' }, 500);
      const cycleNo = Number(user.cycle_no ?? 1);
      const userUpdated = await supabaseUpdate('aviator_users', { id: `eq.${userId}` }, cycleValues(pkg, cycleNo));
      if (userUpdated === null) return json(res, { success: false, status: 'PROCESSING_ERROR', payment_status: 'SUCCESS', order_id: orderId, message: 'Malipo yamepokelewa lakini account bado inakamilishwa.' }, 500);

      return json(res, { success: true, status: 'SUCCESS', payment_status: 'SUCCESS', order_id: orderId, transaction_id: transactionId, reference, package: pkg, redirect: packageRedirect(pkg) });
    }

    if (['CANCELLED', 'USERCANCELLED', 'REJECTED'].includes(paymentStatus)) {
      await supabaseUpdate('aviator_payments', { id: `eq.${payment.id}` }, { status: 'failed', payment_status: paymentStatus, transaction_id: transactionId, reference });
      return json(res, { success: false, status: 'FAILED', payment_status: paymentStatus, order_id: orderId, message: 'Malipo yameghairiwa au hayajakamilika.', redirect: '/dashboard' });
    }

    await supabaseUpdate('aviator_payments', { id: `eq.${payment.id}` }, { payment_status: paymentStatus, transaction_id: transactionId, reference });
    return json(res, { success: false, status: 'PENDING', payment_status: paymentStatus || 'PENDING', order_id: orderId, message: '⏳ Inasubiri uthibitisho wa malipo...' });
  } catch (error) {
    console.error(error);
    return json(res, { success: false, status: 'PENDING', payment_status: 'PENDING', message: '⏳ Inasubiri uthibitisho wa malipo...' });
  }
}
