declare const process: { env: Record<string, string | undefined> };
import { json, supabaseRequest, type VercelRequest, type VercelResponse } from '../src/lib/server.js';
function allowed(req: VercelRequest) { return String(req.query?.key ?? '') && String(req.query?.key ?? '') === (process.env['ADMIN_ACCESS_KEY'] ?? ''); }
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowed(req)) return json(res,{success:false,message:'Unauthorized'},401);
  try { const r=await supabaseRequest('GET','aviator_submissions',{select:'*',order:'timestamp.desc'}); if(!r.ok)return json(res,{success:false,message:'Imeshindikana kusoma submissions.'},500); return json(res,{success:true,rows:r.data}); }
  catch { return json(res,{success:false,message:'Server error.'},500); }
}
