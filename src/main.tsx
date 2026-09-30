import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type Site = { name: string; image: string };
type User = { id: string; full_name?: string; phone: string; last_package: number; current_package: number; site_name?: string; site_image?: string };
type Payment = { id: string; user_id: string; package_no: number; amount: number; status: string; order_id?: string };

const SITES: Site[] = [
  ['1WINBET','1win.png'], ['SportyBet','sportybet.png'], ['BETWINNER','betwinner.png'], ['PREMIER Bet','premierbet.png'],
  ['Betpawa','betpawa.png'], ['WasafiBet','wasafibet.png'], ['BetKing','betking.png'], ['1XBet','1xbet.png'],
  ['Gwalabet','gwalabet.png'], ['Sportsbet','sportsbet.png'], ['Bet365','bet365.png'], ['sportpesa','sportpesa.png']
].map(([name,image]) => ({name,image:`/images/${image}`}));
const PACKAGES = [
  {no:1, name:'APP ID PAYMENT', title:'LIPIA ACCESS', amount:2000, description:'Siku 7 Bure', features:['Full Predictor','Live Odds']},
  {no:2, name:'VPN SETUP PAYMENT', title:'VPN ACCESS', amount:3000, description:'LIPIA VPN CONFIGURATIONS', features:['Live Odds','Matumizi Bila Kikomo']},
  {no:3, name:'CONNECT APP PAYMENT', title:'🏆 CONNECT ACCOUNT', amount:5000, description:'Full Access', features:['Full Account Linking','Live Odds','VIP Support']}
];
const api = async (url:string, body:unknown) => {
  const headers:Record<string,string>={'Content-Type':'application/json'};
  const token=localStorage.getItem('aviator_session'); if(token) headers['x-session-token']=token;
  const r = await fetch(url,{method:'POST',headers,body:JSON.stringify(body)});
  const raw = await r.text();
  let data:any = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { message: raw }; }
  if(!r.ok) throw new Error(data.message || data.error || `Request failed (${r.status})`);
  return data;
};
const money=(n:number)=>`TZS ${n.toLocaleString('en-TZ')}`;
const normalizePhone=(v:string)=>{let p=v.replace(/\D/g,''); if(p.startsWith('0')) p='255'+p.slice(1); if(p.startsWith('255')) return p; return p.length===9?'255'+p:p;};

function App(){
  const [path,setPath]=useState(window.location.pathname);
  const [user,setUser]=useState<User|null>(()=>{try{return JSON.parse(localStorage.getItem('aviator_user')||'null')}catch{return null}});
  const [site,setSite]=useState<Site|null>(()=>{try{return JSON.parse(localStorage.getItem('aviator_site')||'null')}catch{return null}});
  const [loading,setLoading]=useState(false);
  const go=(p:string)=>{history.pushState({},'',p);setPath(p);window.scrollTo(0,0)};
  useEffect(()=>{const h=()=>setPath(window.location.pathname);addEventListener('popstate',h);return()=>removeEventListener('popstate',h)},[]);
  const refreshUser=async(phone?:string)=>{
    if(!phone) return;
    const r=await api('/api/auth-login',{phone}); setUser(r.user); localStorage.setItem('aviator_user',JSON.stringify(r.user)); localStorage.setItem('aviator_session',r.token);
  };
  const selectSite=async(s:Site)=>{setSite(s);localStorage.setItem('aviator_site',JSON.stringify(s)); if(user){try{await api('/api/save-site',{user_id:user.id,site_name:s.name,site_image:s.image})}catch{}} go('/connecting')};
  const start=()=>go(user?'/sites':'/register');
  if(path==='/') return <Home onStart={start}/>;
  if(path==='/register') return <Register loading={loading} setLoading={setLoading} onDone={(u)=>{setUser(u);localStorage.setItem('aviator_user',JSON.stringify(u));go('/login')}} onLogin={()=>go('/login')}/>;
  if(path==='/login') return <Login loading={loading} setLoading={setLoading} onDone={(u)=>{setUser(u);localStorage.setItem('aviator_user',JSON.stringify(u));go('/sites')}} onRegister={()=>go('/register')}/>;
  if(path==='/sites') return <Sites sites={SITES} selected={site} onSelect={selectSite}/>;
  if(path==='/connecting') return <Connecting site={site} onDone={()=>go('/dashboard')}/>;
  if(path.startsWith('/package')) return <PaymentPage user={user} packageNo={Number(path.replace('/package',''))||1} onBack={()=>go('/dashboard')} onRefresh={refreshUser}/>;
  if(path==='/dashboard') return <Dashboard user={user} site={site} onNext={async()=>{if(!user){go('/login');return} try{setLoading(true);const r=await api('/api/auth-login',{phone:user.phone});setUser(r.user);localStorage.setItem('aviator_user',JSON.stringify(r.user));localStorage.setItem('aviator_session',r.token);const next=Number(r.user.current_package||1);if(next>=1&&next<=3)go(`/package${next}`);else go('/dashboard')}catch{go('/login')}finally{setLoading(false)}}} />;
  if(path==='/control') return <Control/>;
  return <Home onStart={start}/>;
}

function Shell({children}:{children:React.ReactNode}){return <div className="app-shell">{children}</div>}
function Home({onStart}:{onStart:()=>void}){return <Shell><main className="home"><div className="home-glow"/><img className="home-logo" src="/images/aviator.png"/><h1>Aviator</h1><h2>Predictor</h2><p>Smart Predictions<br/>Better Chances</p><div className="red-line"/><img className="home-plane" src="/images/plane.png"/><button className="primary home-btn" onClick={onStart}>Start Now</button></main></Shell>}

function Register({onDone,onLogin,loading,setLoading}:{onDone:(u:User)=>void;onLogin:()=>void;loading:boolean;setLoading:(v:boolean)=>void}){
 const [fullName,setFullName]=useState(''); const [phone,setPhone]=useState('');
 const submit=async()=>{const name=fullName.trim().replace(/\s+/g,' ');const p=normalizePhone(phone);if(name.length<2)return alert('Weka jina lako kamili');if(p.length!==12)return alert('Weka namba sahihi ya simu');try{setLoading(true);const r=await api('/api/auth-register',{full_name:name,phone:p});localStorage.setItem('aviator_session',r.token);onDone(r.user)}catch(e){alert((e as Error).message)}finally{setLoading(false)}};
 return <Shell><div className="auth-card"><img src="/images/aviator.png" className="auth-logo"/><h1>Jisajili</h1><p>Weka jina lako kamili na namba ya simu<br/>kuunda akaunti yako</p><input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Full Name" autoComplete="name"/><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Namba ya simu (e.g. 2556XXXXXXXX)" inputMode="tel" autoComplete="tel"/><button className="primary" disabled={loading} onClick={submit}>{loading?'Inasubiri...':'Jisajili'}</button><div className="auth-foot">Tayari una akaunti? <button onClick={onLogin}>Ingia</button></div></div></Shell>
}
function Login({onDone,onRegister,loading,setLoading}:{onDone:(u:User)=>void;onRegister:()=>void;loading:boolean;setLoading:(v:boolean)=>void}){
 const [phone,setPhone]=useState(''); const submit=async()=>{const p=normalizePhone(phone);try{setLoading(true);const r=await api('/api/auth-login',{phone:p});localStorage.setItem('aviator_session',r.token);onDone(r.user)}catch(e){alert((e as Error).message)}finally{setLoading(false)}};
 return <Shell><div className="auth-card"><img src="/images/aviator.png" className="auth-logo"/><h1>Ingia</h1><p>Weka namba yako ya simu</p><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Namba ya simu" inputMode="tel"/><button className="primary" disabled={loading} onClick={submit}>{loading?'Inasubiri...':'Ingia'}</button><div className="auth-foot">Huna akaunti? <button onClick={onRegister}>Jisajili</button></div></div></Shell>
}
function Sites({sites,onSelect}:{sites:Site[];selected:Site|null;onSelect:(s:Site)=>void}){return <Shell><div className="site-page"><div className="page-head"><button className="back" onClick={()=>history.back()}>‹</button><div><h1>Chagua Betting Site</h1><p>Chagua tovuti yako ya kubeti</p></div></div><div className="site-grid">{sites.map(s=><button className="site-card" key={s.name} onClick={()=>onSelect(s)}><div className="site-img"><img src={s.image} alt={s.name}/></div><span>{s.name}</span></button>)}</div><button className="primary" disabled>Endelea</button></div></Shell>}
function Connecting({site,onDone}:{site:Site|null;onDone:()=>void}){useEffect(()=>{const t=setTimeout(onDone,2200);return()=>clearTimeout(t)},[]);return <Shell><div className="connecting"><div className="ring"><img src="/images/aviator.png"/></div><h1>Connecting to your site...</h1><p>Tafadhali subiri, tunaunganisha<br/>na tovuti yako ya kubeti.</p><div className="connect-site">{site&&<img src={site.image} alt=""/>}<b>{site?.name||''}</b></div></div></Shell>}
function Dashboard({user,site,onNext}:{user:User|null;site:Site|null;onNext:()=>void}){return <Shell><div className="dashboard"><header className="dash-head"><div className="menu">☰</div><img src="/images/aviator2.png"/><div className="menu">☰</div></header><div className="user-pill"><div className="avatar">●</div><div><b>{user?.full_name||('+'+(user?.phone||''))}</b><small>+{user?.phone||''} · ● Connected</small></div></div><div className="predictor"><div className="circle"><span>1x00</span></div><button className="primary" onClick={onNext}>Next odd</button></div><div className="connected-box"><small>Connected Site</small>{site&&<div><img src={site.image} alt={site.name}/><b>{site.name}</b></div>}</div><nav><button className="active">⌂<span>Home</span></button><button>◷<span>History</span></button><button>♙<span>Profile</span></button></nav></div></Shell>}

function PaymentPage({user,packageNo,onBack,onRefresh}:{user:User|null;packageNo:number;onBack:()=>void;onRefresh:(phone?:string)=>Promise<void>}){
 const pkg=PACKAGES.find(x=>x.no===packageNo)||PACKAGES[0]; const [phone,setPhone]=useState(user?.phone||''); const [status,setStatus]=useState<'idle'|'waiting'|'success'|'cancelled'|'failed'>('idle'); const [orderId,setOrderId]=useState(''); const [busy,setBusy]=useState(false);
 useEffect(()=>{if(user?.phone)setPhone(user.phone)},[user?.phone]);
 useEffect(()=>{if(!orderId)return; const timer=setInterval(async()=>{try{const r=await api('/api/payment-status',{order_id:orderId}); const s=String(r.payment_status||'').toUpperCase(); if(s==='SUCCESS'){clearInterval(timer);setStatus('success');const next=Number(r.next_package||packageNo+1);if(user?.phone){try{await onRefresh(user.phone)}catch{}};setTimeout(()=>{if(next>=1&&next<=3)location.replace(`/package${next}`);else location.replace('/dashboard')},350)} else if(['CANCELLED','USERCANCELLED'].includes(s)){clearInterval(timer);setStatus('cancelled');setTimeout(onBack,700)} else if(['REJECTED'].includes(s)){clearInterval(timer);setStatus('failed')}}catch{}},2500);return()=>clearInterval(timer)},[orderId]);
 const pay=async()=>{try{setBusy(true);setStatus('idle');const r=await api('/api/payment-create',{user_id:user?.id,package_no:packageNo,phone:normalizePhone(phone),amount:pkg.amount});setOrderId(r.order_id);setStatus('waiting')}catch(e){alert((e as Error).message)}finally{setBusy(false)}};
 return <Shell><div className="pay-page"><button className="back" onClick={onBack}>‹</button><div className="pay-card"><div className="pay-title">{pkg.name}</div><div className="package-official">🔥 OFFICIAL PASS</div><h2 className="package-title">{pkg.title}</h2><div className="price">{money(pkg.amount)}</div><p className="package-description">{pkg.description}</p><div className="package-features">{pkg.features.map((feature:string)=><span key={feature}>✓ {feature}</span>)}</div><label>Namba yenye salio</label><input value={phone} onChange={e=>setPhone(e.target.value)} inputMode="tel" placeholder="0712345678"/><button className="primary" disabled={busy||status==='waiting'} onClick={pay}>{status==='waiting'?'Inasubiri uthibitisho...':busy?'Inaanzisha...':`LIPA TSh ${pkg.amount.toLocaleString('en-US')}`}</button>{status==='waiting'&&<div className="waiting"><div className="mini-ring"/> <b>Inasubiri uthibitisho...</b><span>Thibitisha ombi kwenye simu yako.</span><button className="secondary" onClick={()=>{setOrderId('');setStatus('cancelled');onBack()}}>Cancel</button></div>}{status==='success'&&<div className="success">Malipo yamefanikiwa. Tunaendelea...</div>}{status==='cancelled'&&<div className="cancel">Malipo yameghairiwa. <button onClick={onBack}>Rudi Dashboard</button></div>}{status==='failed'&&<div className="cancel">Malipo hayakukamilika. Jaribu tena.</div>}<small className="secure">🔒 Malipo yako yana salama</small></div></div></Shell>
}

function Control(){const [key,setKey]=useState('');const [rows,setRows]=useState<Payment[]>([]);const load=async()=>{try{const r=await api('/api/payment-list',{key});setRows(r.payments||[])}catch(e){alert((e as Error).message)}};const mark=async(id:string)=>{try{await api('/api/payment-admin',{key,payment_id:id});await load()}catch(e){alert((e as Error).message)}};return <Shell><div className="control"><h1>Payment Control</h1><input placeholder="Control key" value={key} onChange={e=>setKey(e.target.value)}/><button className="primary" onClick={load}>Open</button><div className="table">{rows.map(r=><div className="row" key={r.id}><span>Package {r.package_no}<br/>{money(r.amount)}</span><b>{r.status}</b><button onClick={()=>mark(r.id)}>Mark Paid</button></div>)}</div></div></Shell>}

createRoot(document.getElementById('root')!).render(<App/>);
