import {sb,json,phone} from './_supabase';

export default async function handler(req:Request){
  if(req.method!=='POST') return json({message:'Method not allowed'},405);
  try{
    const b:any=await req.json().catch(()=>({}));
    const p=phone(b.phone);
    if(p.length!==12) return json({message:'Weka namba sahihi ya simu'},400);

    const rows=await sb(`aviator_users?phone=eq.${encodeURIComponent(p)}&select=*&limit=1`);
    if(!rows?.[0]) return json({message:'Namba haijasajiliwa'},404);

    const user=rows[0];
    const token=crypto.randomUUID()+crypto.randomUUID().replaceAll('-','');
    await sb('aviator_sessions',{
      method:'POST',
      headers:{Prefer:'return=minimal'},
      body:JSON.stringify({
        token,
        user_id:user.id,
        expires_at:new Date(Date.now()+1000*60*60*24*30).toISOString()
      })
    });
    return json({user,token});
  }catch(e:any){
    console.error('auth-login error:',e);
    return json({message:e?.message||'Imeshindikana kuingia'},500);
  }
}
