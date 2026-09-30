const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error('Supabase environment variables are missing');

export async function sb(path:string, init:RequestInit={}) {
  const headers = new Headers(init.headers);
  headers.set('apikey', key!);
  headers.set('Authorization', `Bearer ${key}`);
  headers.set('Content-Type','application/json');
  headers.set('Accept','application/json');
  const r = await fetch(`${url}/rest/v1/${path}`, {...init, headers});
  const text = await r.text();
  let data:any = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if(!r.ok) throw new Error(data?.message || data?.hint || data?.details || `Database request failed (${r.status})`);
  return data;
}
export function json(data:any,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})}
export function phone(v:any){let p=String(v??'').replace(/\D/g,'');if(p.startsWith('0'))p='255'+p.slice(1);if(!p.startsWith('255')&&p.length===9)p='255'+p;return p}
export async function requireSession(req:Request){const token=req.headers.get('x-session-token')||'';if(!token)throw new Error('Session required');const rows=await sb(`aviator_sessions?token=eq.${encodeURIComponent(token)}&select=token,user_id,expires_at&limit=1`);if(!rows?.[0])throw new Error('Session expired');if(new Date(rows[0].expires_at).getTime()<Date.now())throw new Error('Session expired');return rows[0].user_id as string}
