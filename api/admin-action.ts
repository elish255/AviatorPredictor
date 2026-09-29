declare const process: { env: Record<string, string | undefined> };
import { json, supabaseFirst, supabaseInsert, supabaseUpdate, type VercelRequest, type VercelResponse } from '../src/lib/server.js';
function keyOk(body: Record<string,unknown>){return String(body.key??'') && String(body.key??'') === (process.env['ADMIN_ACCESS_KEY'] ?? '');}
function appId(){return `AVIATOR-${Math.random().toString(36).slice(2,10).toUpperCase()}`;}
export default async function handler(req: VercelRequest,res: VercelResponse){
  if(req.method!=='POST')return json(res,{success:false,message:'Invalid request'},405);
  const body=(req.body??{}) as Record<string,unknown>; if(!keyOk(body))return json(res,{success:false,message:'Unauthorized'},401);
  const action=String(body.action??''); const id=String(body.id??'');
  if(!id || !['approve','reject'].includes(action))return json(res,{success:false,message:'Invalid action'},400);
  try{
    const sub=await supabaseFirst('aviator_submissions',{id:`eq.${id}`}); if(!sub)return json(res,{success:false,message:'Submission haipo.'},404);
    if(action==='reject'){const u=await supabaseUpdate('aviator_submissions',{id:`eq.${id}`},{status:'rejected',decision_date:new Date().toISOString()});return json(res,{success:u!==null});}
    const userId=String(sub.userId??sub.user_id??''); if(!userId)return json(res,{success:false,message:'User ID haipo.'},400);
    const code=appId();
    const user=await supabaseFirst('aviator_users',{id:`eq.${userId}`});
    if(!user){await supabaseInsert('aviator_users',{id:Number(userId),phone:String(sub.phoneNumber??sub.phone??''),created_at:new Date().toISOString(),hasAppId:true,appIdCode:code,appIdPurchasedAt:new Date().toISOString()});}
    else await supabaseUpdate('aviator_users',{id:`eq.${userId}`},{hasAppId:true,appIdCode:code,appIdPurchasedAt:new Date().toISOString()});
    await supabaseInsert('aviator_app_ids',{code,userId,status:'active',createdAt:new Date().toISOString()});
    const updated=await supabaseUpdate('aviator_submissions',{id:`eq.${id}`},{status:'approved',decision_date:new Date().toISOString(),appIdGenerated:code});
    return json(res,{success:updated!==null,appId:code});
  }catch(e){console.error(e);return json(res,{success:false,message:'Server error.'},500)}
}
