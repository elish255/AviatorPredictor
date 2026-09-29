declare const process: { env: Record<string, string | undefined> };
import { json, cycleValues, supabaseFirst, supabaseUpdate, type VercelRequest, type VercelResponse } from '../src/lib/server';

function adminKey(body: Record<string, unknown>) {
  const key = String(body.key ?? '').trim();
  return Boolean(key) && key === (process.env['ADMIN_ACCESS_KEY'] ?? '').trim();
}

async function completePackage(userId: number, pkg: number, paymentId: string) {
  const payment = await supabaseFirst('aviator_payments', { id: `eq.${paymentId}`, user_id: `eq.${userId}` });
  if (!payment) throw new Error('Payment haipo.');
  if (String(payment.status ?? '').toLowerCase() === 'paid') return '/dashboard';
  const updated = await supabaseUpdate('aviator_payments', { id: `eq.${paymentId}` }, {
    status: 'paid', payment_status: 'SUCCESS', reference: String(payment.reference ?? 'MANUAL'),
  });
  if (updated === null) throw new Error('Payment haikuweza kusasishwa.');
  const user = await supabaseFirst('aviator_users', { id: `eq.${userId}` });
  if (!user) throw new Error('User hayupo.');
  const values = cycleValues(pkg, Number(user.cycle_no ?? 1));
  const userUpdated = await supabaseUpdate('aviator_users', { id: `eq.${userId}` }, values);
  if (userUpdated === null) throw new Error('User haikuweza kusasishwa.');
  return pkg === 1 ? '/package2' : pkg === 2 ? '/package3' : '/dashboard';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, { success: false, message: 'Invalid request.' }, 405);
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (!adminKey(body)) return json(res, { success: false, message: 'Unauthorized.' }, 401);
    const paymentId = String(body.paymentId ?? '').trim();
    if (!paymentId) return json(res, { success: false, message: 'Payment haijachaguliwa.' }, 400);
    const payment = await supabaseFirst('aviator_payments', { id: `eq.${paymentId}` });
    if (!payment) return json(res, { success: false, message: 'Payment haipo.' }, 404);
    const userId = Number(payment.user_id ?? 0);
    const pkg = Number(payment.package_no ?? 0);
    if (!userId || ![1,2,3].includes(pkg)) return json(res, { success: false, message: 'Payment data sio sahihi.' }, 400);
    const redirect = await completePackage(userId, pkg, paymentId);
    return json(res, { success: true, redirect });
  } catch (error) {
    console.error(error);
    return json(res, { success: false, message: error instanceof Error ? error.message : 'Server error.' }, 500);
  }
}
