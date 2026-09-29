import { json, supabaseUpdate, type VercelRequest, type VercelResponse } from '../src/lib/server.js';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res,{success:false,message:'Invalid request'},405);
  const body=(req.body??{}) as Record<string,unknown>; const id=Number(body.userId??0); const values=body.values;
  if(!id || !values || typeof values!=='object') return json(res,{success:false,message:'Invalid data'},400);
  try { const updated=await supabaseUpdate('aviator_users',{id:`eq.${id}`},values as Record<string,unknown>); return json(res,{success:updated!==null}); }
  catch { return json(res,{success:false},500); }
}
