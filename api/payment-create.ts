import {sb,json,phone,requireSession} from './_supabase.js';
const CREATE_URL=process.env.FIMIPAY_CREATE_PAYMENT_URL||'https://fimipay.com/api/v1/payment/create_order';
const API_KEY=process.env.FIMIPAY_API_KEY||'';
const prices:Record<number,number>={1:2000,2:3000,3:5000};
export default async function handler(req:Request){if(req.method!=='POST')return json({message:'Method not allowed'},405);try{if(!API_KEY)return json({message:'Payment service is not configured'},500);const uid=await requireSession(req);const b:any=await req.json();const packageNo=Number(b.package_no);const amount=prices[packageNo];const p=phone(b.phone);if(!amount||p.length!==12)return json({message:'Namba au package si sahihi'},400);const users=await sb(`aviator_users?id=eq.${encodeURIComponent(uid)}&select=id,phone,current_package&limit=1`);const user=users?.[0];if(!user)return json({message:'Session expired'},401);if(Number(user.current_package)!==packageNo)return json({message:`Unaendelea na hatua ${user.current_package}`},409);
 const payload={buyer_name:'Aviator User',buyer_phone:p,amount,currency:'TZS',payment_method:'mobile'};
 const r=await fetch(CREATE_URL,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','User-Agent':'FimiPay-SDK/1.0','Authorization':`Bearer ${API_KEY}`},body:JSON.stringify(payload)});
 const raw=await r.text();let data:any;try{data=JSON.parse(raw)}catch{data={message:raw}};if(!r.ok||data?.status==='error'){console.error('Payment create failed',r.status,raw);return json({message:data?.message||'Imeshindikana kuanzisha malipo'},400)}
 const d=data?.data||{};const orderId=d.order_id||data?.order_id;if(!orderId)return json({message:'Payment request haikutoa order'},502);
 await sb('aviator_payments',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({user_id:uid,package_no:packageNo,amount,status:String(d.payment_status||'PENDING').toUpperCase(),order_id:orderId,phone:p})});
 return json({order_id:orderId,payment_status:String(d.payment_status||'PENDING').toUpperCase()});
 }catch(e:any){console.error(e);return json({message:e.message||'Imeshindikana kuanzisha malipo'},400)}}
