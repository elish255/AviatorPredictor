import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { allowed, clearUser, getCurrentUser, getSite, getUserId, loginWithPhone, packages, paid, registerWithPhone, saveBettingSite, type User } from './lib/app';

const sites = [
  ['1XBET', '/images/1xbet.svg'],
  ['betway', '/images/betway.svg'],
  ['Betika', '/images/betika.svg'],
  ['MELBET', '/images/melbet.svg'],
  ['888sport', '/images/888sport.svg'],
  ['SportPesa', '/images/sportpesa.svg'],
] as const;

function go(path: string) { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); }
function Layout({ children, back = true }: { children: React.ReactNode; back?: boolean }) {
  return <div className="app-shell"><header className="topbar"><div className="topwrap">{back ? <button className="back-btn" onClick={() => window.history.back()}>‹</button> : <div className="back-space"/>}<div className="brand"><img src="/images/aviator-plane.svg" alt="Aviator"/><div><b>Aviator</b><span>Predictor</span></div></div><div className="back-space"/></div></header><main className="page">{children}</main></div>;
}

function Home() {
  return <div className="home-screen"><div className="home-glow"/><div className="home-brand"><img src="/images/aviator-plane.svg" alt="Aviator"/><h1>Aviator</h1><h2>Predictor</h2></div><p className="home-tagline">Smart Predictions<br/>Better Chances</p><div className="hero-plane"><img src="/images/aviator-plane.svg" alt=""/></div><button className="primary-btn home-start" onClick={() => go('/register')}>START NOW</button><button className="home-login" onClick={() => go('/login')}>INGIA</button></div>;
}

function Register() {
  const [phone, setPhone] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setError(''); try { await registerWithPhone(phone); go('/betting-site'); } catch (err) { setError(err instanceof Error ? err.message : 'Kuna tatizo.'); } finally { setBusy(false); } }
  return <Layout><section className="auth-screen"><div className="auth-logo"><img src="/images/aviator-plane.svg" alt=""/><h1>Jisajili</h1></div><p className="auth-sub">Weka namba yako ya simu<br/>kuunda akaunti yako</p>{error && <div className="error">{error}</div>}<form onSubmit={submit} className="dark-form"><label>☎ &nbsp; Namba ya simu</label><input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))} placeholder="2556XXXXXXXX" maxLength={12} inputMode="numeric" required/><button className="primary-btn" disabled={busy}>{busy?'INASAJILI...':'JISAJILI'}</button></form><p className="auth-switch">Tayari una akaunti? <button type="button" onClick={()=>go('/login')}>Ingia</button></p></section></Layout>;
}

function Login() {
  const [phone, setPhone] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setError(''); try { await loginWithPhone(phone); go('/betting-site'); } catch (err) { setError(err instanceof Error ? err.message : 'Kuna tatizo.'); } finally { setBusy(false); } }
  return <Layout><section className="auth-screen"><div className="auth-logo"><img src="/images/aviator-plane.svg" alt=""/><h1>Ingia</h1></div><p className="auth-sub">Weka namba yako ya simu<br/>kuendelea na akaunti yako</p>{error && <div className="error">{error}</div>}<form onSubmit={submit} className="dark-form"><label>☎ &nbsp; Namba ya simu</label><input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))} placeholder="2556XXXXXXXX" maxLength={12} inputMode="numeric" required/><button className="primary-btn" disabled={busy}>{busy?'INASOMA...':'INGIA'}</button></form><p className="auth-switch">Huna akaunti? <button type="button" onClick={()=>go('/register')}>Jisajili</button></p></section></Layout>;
}

function BettingSite() {
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => { if (!getUserId()) go('/login'); }, []);
  async function choose(name: string, image: string) { if (busy) return; setBusy(true); setError(''); try { await saveBettingSite(name, image); go('/loading'); } catch (e) { setError(e instanceof Error ? e.message : 'Connection Error'); setBusy(false); } }
  return <Layout><section className="sites-screen"><h1>Chagua Betting Site</h1><p>Chagua tovuti yako ya kubeti</p>{error && <div className="error">{error}</div>}<div className="site-grid">{sites.map(([name,img]) => <button key={name} className="site-card" disabled={busy} onClick={() => choose(name,img)}><img src={img} alt={name}/><span>{name}</span></button>)}</div><button className="primary-btn sites-next" disabled>{busy?'Inaunganisha...':'Endelea'}</button></section></Layout>;
}

function Loading() { const site = getSite(); useEffect(() => { const t=setTimeout(()=>go('/dashboard'),2500); return ()=>clearTimeout(t); },[]); return <div className="connecting-screen"><img className="connecting-plane" src="/images/aviator-plane.svg" alt=""/><h1>Connecting to your site...</h1><p>Tafadhali subiri, tunaunganisha<br/>na tovuti yako ya kubeti.</p>{site.name && <div className="connecting-site"><img src={site.image || '/images/1xbet.svg'} alt={site.name}/><span>{site.name}</span></div>}<div className="connect-ring"><span>↗</span></div></div>; }

function Dashboard({ user }: { user: User }) {
  const site=getSite();
  const next = !paid(user,1)?1:!paid(user,2)?2:!paid(user,3)?3:1;
  return <Layout back={false}><div className="dashboard-screen"><section className="user-strip"><div className="avatar">👤</div><div><b>{user.phone}</b><span>🟢 Connected</span></div><button onClick={()=>go('/logout')}>⋮</button></section><section className="odds-card"><div className="odds-icon">☎</div><div className="fixed-odd">1x00</div><img src="/images/aviator-plane.svg" alt=""/><button className="primary-btn" onClick={()=>go(`/package${next}`)}>Next odd</button></section><section className="connected-site-card"><h3>Connected Site</h3><div className="connected-site-row">{site.image ? <img src={site.image} alt={site.name}/> : <div className="site-fallback">{site.name?.slice(0,1)}</div>}<div><b>{site.name}</b><span>Connected</span></div></div></section><nav className="bottom-nav"><button className="active">⌂<span>Home</span></button><button>◷<span>History</span></button><button>♙<span>Profile</span></button></nav></div></Layout>;
}

function PackagePage({ user, pkg }: { user: User; pkg: 1|2|3 }) {
  const info=packages[pkg]; const [phone,setPhone]=useState(String(user.phone??'')); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  useEffect(()=>{ if (!allowed(user,pkg)) { go(pkg===2?'/package1':pkg===3?'/package2':'/dashboard'); return; } if(paid(user,pkg)) go(pkg===1?'/package2':pkg===2?'/package3':'/dashboard'); },[user,pkg]);
  async function pay(e: React.FormEvent){e.preventDefault(); if(busy)return; setBusy(true);setError(''); try { const r=await fetch('/api/payment-create',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({userId:getUserId(),package:pkg,phone})}); const data=await r.json(); if(data.status==='ALREADY_PAID'){go(data.redirect||'/dashboard');return;} if(data.success && data.order_id){go(`/waiting?order=${encodeURIComponent(data.order_id)}`);return;} throw new Error(data.message||'Imeshindikana kuanzisha malipo.'); } catch(e){setError(e instanceof Error?e.message:'Kuna tatizo la server.');setBusy(false);} }
  return <Layout><section className="access-screen"><div className="access-top"><button onClick={()=>go('/dashboard')}>‹</button><h2>Lipia Access</h2><span>🔒</span></div><div className="access-card"><small>{info.name}</small><h1>{info.title}</h1><div className="access-price">TSh {info.amount.toLocaleString()}</div><p>{info.description}</p><ul>{info.features.map(f=><li key={f}>✓ {f}</li>)}</ul></div><form className="dark-form payment-form" onSubmit={pay}>{error&&<div className="error">{error}</div>}<label>Namba ya simu</label><input type="tel" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))} placeholder="2556XXXXXXXX" maxLength={12} inputMode="numeric" required/><button className="primary-btn" disabled={busy}>{busy?'Inatuma...':'LIPA SASA'}</button><div className="secure-note">🔒 Malipo yako yanalindwa</div></form></section></Layout>;
}

function Waiting() {
  const order=new URLSearchParams(location.search).get('order')||''; const [state,setState]=useState<'pending'|'success'|'failed'|'error'>('pending'); const [message,setMessage]=useState('Inaangalia malipo...');
  useEffect(()=>{if(!order){setState('error');setMessage('Order haijapatikana.');return;} let stopped=false; const check=async()=>{try{const r=await fetch(`/api/payment-status?order_id=${encodeURIComponent(order)}&userId=${getUserId()}&_=${Date.now()}`,{cache:'no-store'});const d=await r.json(); if(stopped)return; if(d.status==='SUCCESS' && d.payment_status==='SUCCESS'){setState('success');setMessage('Malipo yamefanikiwa!');stopped=true;setTimeout(()=>go(d.redirect||'/dashboard'),700);return;} if(d.status==='FAILED'){setState('failed');setMessage('Malipo hayajakamilika.');stopped=true;setTimeout(()=>go('/dashboard'),900);return;} setState('pending');setMessage('⏳ Inasubiri uthibitisho wa malipo...');}catch{if(!stopped){setState('pending');setMessage('⏳ Inasubiri uthibitisho wa malipo...')}}}; check(); const t=setInterval(check,3000); return()=>{stopped=true;clearInterval(t)}},[order]);
  return <div className="connecting-screen wait-screen"><div className="wait-icon">{state==='success'?'✓':state==='failed'?'↩':'💳'}</div>{state==='pending'&&<div className="big-spinner"/>}<h2>{state==='success'?'Malipo Yamefanikiwa':state==='failed'?'Malipo Hayajakamilika':'Inasubiri Malipo'}</h2><p>{state==='success'?'Unaelekezwa kwenye hatua inayofuata...':'Tafadhali thibitisha ombi la malipo kwenye simu yako.'}</p><div className={`status ${state}`}>{message}</div></div>;
}

function ControlPanel() {
  const [key,setKey]=useState(sessionStorage.getItem('aviator_control_key')||''); const [rows,setRows]=useState<any[]>([]); const [msg,setMsg]=useState(''); const [busy,setBusy]=useState(false);
  async function load(){setMsg(''); const r=await fetch(`/api/payment-list?key=${encodeURIComponent(key)}`,{cache:'no-store'}); const d=await r.json().catch(()=>null); if(!r.ok||!d?.success){setMsg(d?.message||'Imeshindikana kusoma malipo.');return;} sessionStorage.setItem('aviator_control_key',key);setRows(d.rows||[])}
  async function markPaid(paymentId:string){if(busy)return;setBusy(true);const r=await fetch('/api/payment-admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,paymentId})});const d=await r.json().catch(()=>null);setBusy(false);if(!r.ok||!d?.success){alert(d?.message||'Imeshindikana.');return;} await load()}
  return <Layout><section className="control-screen"><h2>Payment Control</h2><input value={key} onChange={e=>setKey(e.target.value)} placeholder="Access key" type="password"/><button className="primary-btn" onClick={load}>FUNGUA</button>{msg&&<div className="error">{msg}</div>}<div className="admin-list">{rows.map(r=><div className="admin-row" key={r.id}><b>{r.user?.full_name??'User'}</b><span>{r.user?.phone??r.payment_phone} • Package {r.package_no} • TSh {Number(r.amount||0).toLocaleString()}</span><small>{r.status} / {r.payment_status}</small>{r.status!=='paid'&&<button disabled={busy} onClick={()=>markPaid(String(r.id))}>MARK SUCCESSFUL</button>}</div>)}</div></section></Layout>;
}

function App(){ const [path,setPath]=useState(location.pathname); const [user,setUser]=useState<User|null>(null); const [loading,setLoading]=useState(true); useEffect(()=>{const f=()=>{setPath(location.pathname);getCurrentUser().then(setUser)}; addEventListener('popstate',f); getCurrentUser().then(setUser).finally(()=>setLoading(false)); return()=>removeEventListener('popstate',f)},[]); if(loading)return <div className="connecting-screen"><div className="big-spinner"/></div>; if(path==='/logout'){clearUser();go('/login');return null;} if(path==='/')return <Home/>; if(path==='/login')return <Login/>; if(path==='/register')return <Register/>; if(path==='/control')return <ControlPanel/>; if(path==='/waiting')return <Waiting/>; if(path==='/betting-site'){if(!user){go('/login');return null;}return <BettingSite/>;} if(path==='/loading'){if(!user){go('/login');return null;}return <Loading/>;} if(path==='/dashboard'){if(!user){go('/login');return null;}return <Dashboard user={user}/>;} const match=path.match(/^\/package([123])$/); if(match){if(!user){go('/login');return null;}return <PackagePage user={user} pkg={Number(match[1]) as 1|2|3}/>;} go('/'); return null; }

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
