declare const process: { env: Record<string, string | undefined> };
import { sb, json, phone, requireSession, body, type VercelRequest, type VercelResponse } from './_supabase.js';
const CREATE_URL = process.env.FIMIPAY_CREATE_PAYMENT_URL || 'https://fimipay.com/api/v1/payment/create_order';
const API_KEY = process.env.FIMIPAY_API_KEY || '';
const prices: Record<number, number> = { 1: 2000, 2: 3000, 3: 5000 };
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, { message: 'Method not allowed' }, 405);
  try { if (!API_KEY) return json(res, { message: 'Payment service is not configured' }, 500); const uid = await requireSession(req); const b: any = body(req); const packageNo = Number(b.package_no); const amount = prices[packageNo]; const p = phone(b.phone); if (!amount || !/^255[67]\d{8}$/.test(p)) return json(res, { message: 'Namba au package si sahihi' }, 400); const users = await sb(`aviator_users?id=eq.${encodeURIComponent(uid)}&select=id,phone,full_name,current_package&limit=1`); const user = users?.[0]; if (!user) return json(res, { message: 'Session expired' }, 401); if (Number(user.current_package) !== packageNo) return json(res, { message: `Unaendelea na hatua ${user.current_package}` }, 409);
    // FimiPay validates the payer/payout details using these field names.
// Keep the method configurable because the enabled mobile-money rail is
// account-specific in FimiPay. For this Tanzania project the default is M-PESA.
const method = String(process.env.FIMIPAY_METHOD || 'mpesa').trim();
const accountName = String(user.full_name || process.env.FIMIPAY_ACCOUNT_NAME || 'SmarkSoko').trim();
const payload = {
  buyer_name: accountName,
  buyer_phone: p,
  amount,
  currency: 'TZS',
  method,
  account_number: p,
  account_name: accountName,
  // Kept for compatibility with older FimiPay configurations.
  payment_method: 'mobile'
};
    const r = await fetch(CREATE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'FimiPay-SDK/1.0', Authorization: `Bearer ${API_KEY}` }, body: JSON.stringify(payload) });
    const raw = await r.text(); let data: any; try { data = JSON.parse(raw); } catch { data = { message: raw }; } if (!r.ok || data?.status === 'error') {
      console.error('Payment create failed', r.status, raw);
      const fieldErrors = data?.errors && typeof data.errors === 'object'
        ? Object.entries(data.errors).flatMap(([field, msgs]: any) => (Array.isArray(msgs) ? msgs : [msgs]).map((m: any) => `${field}: ${m}`))
        : [];
      return json(res, {
        message: data?.message || 'Imeshindikana kuanzisha malipo',
        errors: fieldErrors
      }, 400);
    }
    const d = data?.data || {}; const orderId = d.order_id || data?.order_id; if (!orderId) return json(res, { message: 'Payment request haikutoa order' }, 502); await sb('aviator_payments', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ user_id: uid, package_no: packageNo, amount, status: String(d.payment_status || 'PENDING').toUpperCase(), order_id: orderId, phone: p }) }); return json(res, { order_id: orderId, payment_status: String(d.payment_status || 'PENDING').toUpperCase() });
  } catch (e: any) { console.error(e); return json(res, { message: e?.message || 'Imeshindikana kuanzisha malipo' }, 400); }
}
