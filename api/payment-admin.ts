declare const process: { env: Record<string, string | undefined> };
import { sb, json, body, type VercelRequest, type VercelResponse } from './_supabase.js';
async function advance(uid: string, pkg: number) { const next = pkg >= 3 ? 1 : pkg + 1; await sb(`aviator_users?id=eq.${encodeURIComponent(uid)}`, { method: 'PATCH', body: JSON.stringify({ current_package: next, last_package: pkg }) }); }
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, { message: 'Method not allowed' }, 405);
  try { const b: any = body(req); if (!process.env.ADMIN_PANEL_KEY || String(b.key) !== process.env.ADMIN_PANEL_KEY) return json(res, { message: 'Access denied' }, 403); const id = String(b.payment_id || ''); const rows = await sb(`aviator_payments?id=eq.${encodeURIComponent(id)}&select=id,user_id,package_no,status&limit=1`); const pay = rows?.[0]; if (!pay) return json(res, { message: 'Payment haipo' }, 404); if (String(pay.status).toUpperCase() !== 'SUCCESS') { await sb(`aviator_payments?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status: 'SUCCESS' }) }); await advance(pay.user_id, Number(pay.package_no)); } return json(res, { ok: true }); } catch (e: any) { console.error(e); return json(res, { message: e?.message || 'Imeshindikana' }, 400); }
}
