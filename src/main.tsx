import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { allowed, clearUser, getCurrentUser, getSite, getUserId, loginWithPhone, packages, paid, registerWithPhone, saveBettingSite, type User } from './lib/app';

const sites = [
  ['1WINBET','images/1win.png'], ['SportyBet','images/sportybet.png'], ['BETWINNER','images/betwinner.png'], ['PremierBet','images/premierbet.png'],
  ['BetPawa','images/betpawa.png'], ['WasafiBet','images/wasafibet.png'], ['BetKing','images/betking.png'], ['1XBet','images/1xbet.png'],
  ['Gwalabet','images/gwalabet.png'], ['Sportsbet','images/sportsbet.png'], ['Bet365','images/bet365.png'], ['SportPesa','images/sportpesa.png'],
] as const;

function go(path: string) { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); }
function Layout({ children, back = true }: { children: React.ReactNode; back?: boolean }) {
  return <><header className="topbar"><div className="topwrap">{back ? <button className="back-btn" onClick={() => window.history.back()}>←</button> : <div className="back-space"/>}<div className="logo"><div className="logo-icon">✈</div><div><b>Aviator Predictor</b><small>Premium Aviator Predictor</small></div></div><div className="back-space"/></div></header><main className="page">{children}</main><footer>© {new Date().getFullYear()} Aviator Predictor</footer></>;
}

function Home() { return <Layout back={false}><section className="home-card"><h1>AVIATOR PREDICTOR</h1><p>Get access to premium odds</p><div className="home-art">✈️</div><button onClick={() => go('/register')}>START NOW</button><button className="secondary-btn" onClick={() => go('/login')}>INGIA</button></section></Layout>; }

function Register() {
  const [phone, setPhone] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setError(''); try { await registerWithPhone(phone); go('/betting-site'); } catch (err) { setError(err instanceof Error ? err.message : 'Kuna tatizo.'); } finally { setBusy(false); } }
  return <Layout><section className="card"><h2 className="title">Jisajili</h2><p className="muted">Weka namba yako ya simu. Itatumika kutambua account yako ukirudi tena.</p>{error && <div className="error">{error}</div>}<form onSubmit={submit}><label className="phone-label">Namba ya Simu</label><input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))} placeholder="0712345678" maxLength={10} inputMode="numeric" required/><button disabled={busy}>{busy?'INASAJILI...':'JISAJILI'}</button></form><p style={{textAlign:'center',marginTop:16}}>Una account? <button type="button" className="link-btn" onClick={()=>go('/login')}>INGIA</button></p></section></Layout>;
}

function Login() {
  const [phone, setPhone] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setError(''); try { await loginWithPhone(phone); go('/betting-site'); } catch (err) { setError(err instanceof Error ? err.message : 'Kuna tatizo.'); } finally { setBusy(false); } }
  return <Layout><section className="card"><h2 className="title">Ingia</h2><p className="muted">Tumia namba ile ile uliyosajili nayo ili kuendelea na hatua yako ya mwisho.</p>{error && <div className="error">{error}</div>}<form onSubmit={submit}><label className="phone-label">Namba ya Simu</label><input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))} placeholder="0712345678" maxLength={10} inputMode="numeric" required/><button disabled={busy}>{busy?'INASOMA...':'INGIA'}</button></form><p style={{textAlign:'center',marginTop:16}}>Huna account? <button type="button" className="link-btn" onClick={()=>go('/register')}>JISAJILI</button></p></section></Layout>;
}

function BettingSite() {
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => { if (!getUserId()) go('/login'); }, []);
  async function choose(name: string, image: string) { if (busy) return; setBusy(true); setError(''); try { await saveBettingSite(name, image); go('/loading'); } catch (e) { setError(e instanceof Error ? e.message : 'Connection Error'); setBusy(false); } }
  return <Layout><h1 className="white-title">CHOOSE YOUR BETTING SITE</h1><p className="site-note">Chagua betting site yako ili kuendelea.</p>{error && <div className="error">{error}</div>}<div className="site-grid">{sites.map(([name,img]) => <button key={name} className={`site-card ${busy?'disabled':''}`} onClick={() => choose(name,img)}><div className="site-img">{name.slice(0,1)}</div><div>{name}</div></button>)}</div></Layout>;
}

function Loading() { const site = getSite(); useEffect(() => { const t=setTimeout(()=>go('/dashboard'),3000); return ()=>clearTimeout(t); },[]); return <div className="loading-page"><div className="loading-card">{site.name && <div className="site-img large">{site.name.slice(0,1)}</div>}<div className="big-spinner"/><h1>CONNECTING TO YOUR SITE</h1><p>Connecting to <b>{site.name}</b></p><div className="progress"><span/></div><b>Please wait...</b></div></div>; }

function Dashboard({ user }: { user: User }) {
  const site=getSite(); const [odds,setOdds]=useState(1.00);
  useEffect(()=>{const t=setInterval(()=>setOdds(v=>Number((v+Math.random()*1.8).toFixed(2))),1800); return ()=>clearInterval(t)},[]);
  const next = !paid(user,1)?1:!paid(user,2)?2:!paid(user,3)?3:1;
  return <Layout><div className="dash"><section className="welcome-card"><h2>Welcome 👋</h2><h3>PATA PREDICTIONS ZA UHAKIKA</h3><p>Premium Aviator Predictor</p></section><section className="predict-card"><div className="plane">✈️</div><h1>Aviator Predictor</h1><div className="odds"><div className="ring"/><div><strong>{odds.toFixed(2)}x</strong><small>Prediction</small></div></div></section><button className="predict-btn" onClick={()=>go('/next-package')}>NEXT ODDS</button><section className="connected-card"><div className="site-img">{site.name.slice(0,1)}</div><div><h3>{site.name}</h3><p>🟢 Connected</p></div></section><div className="package-status"><span>Package 1: {paid(user,1)?'PAID':'READY'}</span><span>Package 2: {paid(user,2)?'PAID':'LOCKED'}</span><span>Package 3: {paid(user,3)?'PAID':'LOCKED'}</span><span>Next: Package {next}</span></div></div></Layout>;
}

function NextPackage({ user }: { user: User }) {
  const next = !paid(user,1)?1:!paid(user,2)?2:!paid(user,3)?3:1;
  useEffect(()=>{ if(next===1 && paid(user,3)) go('/package1'); },[next,user]);
  return <Layout><section className="card center"><h2 className="title">NEXT ODDS</h2><p>Unaendelea na Package {next}.</p><button onClick={()=>go(`/package${next}`)}>CONTINUE</button></section></Layout>;
}

function PackagePage({ user, pkg }: { user: User; pkg: 1|2|3 }) {
  const info=packages[pkg]; const [phone,setPhone]=useState(String(user.phone??'')); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  useEffect(()=>{ if (!allowed(user,pkg)) { go(pkg===2?'/package1':pkg===3?'/package2':'/dashboard'); return; } if(paid(user,pkg)) go(pkg===1?'/package2':pkg===2?'/package3':'/dashboard'); },[user,pkg]);
  async function pay(e: React.FormEvent){e.preventDefault(); if(busy)return; setBusy(true);setError(''); try { const r=await fetch('/api/payment-create',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({userId:getUserId(),package:pkg,phone})}); const data=await r.json(); if(data.status==='ALREADY_PAID'){go(data.redirect||'/dashboard');return;} if(data.success && data.order_id){go(`/waiting?order=${encodeURIComponent(data.order_id)}`);return;} throw new Error(data.message||'Imeshindikana kuanzisha malipo.'); } catch(e){setError(e instanceof Error?e.message:'Kuna tatizo la server.');setBusy(false);} }
  return <Layout><div className="package-head"><button onClick={()=>go('/dashboard')}>←</button><b>{info.name}</b><span>📱</span></div><section className="package-card"><small>🔥 OFFICIAL PASS</small><h2>{info.title}</h2><div className="price">TSh {info.amount.toLocaleString()}</div><p>{info.description}</p><ul>{info.features.map(f=><li key={f}>✓ {f}</li>)}</ul></section><form className="payment-box" onSubmit={pay}>{error&&<div className="error">{error}</div>}<label>Namba ya simu ya malipo</label><input type="tel" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))} placeholder="0712345678" maxLength={10} inputMode="numeric" required/><button disabled={busy}>{busy?'⏳ Inatuma...':`LIPA TSh ${info.amount.toLocaleString()}`}</button></form></Layout>;
}

function Waiting() {
  const order=new URLSearchParams(location.search).get('order')||''; const [state,setState]=useState<'pending'|'success'|'failed'|'error'>('pending'); const [message,setMessage]=useState('Inaangalia malipo...');
  useEffect(()=>{if(!order){setState('error');setMessage('Order haijapatikana.');return;} let stopped=false; const check=async()=>{try{const r=await fetch(`/api/payment-status?order_id=${encodeURIComponent(order)}&userId=${getUserId()}&_=${Date.now()}`,{cache:'no-store'});const d=await r.json(); if(stopped)return; if(d.status==='SUCCESS' && d.payment_status==='SUCCESS'){setState('success');setMessage('Malipo yamefanikiwa!');stopped=true;setTimeout(()=>go(d.redirect||'/dashboard'),700);return;} if(d.status==='FAILED'){setState('failed');setMessage('Malipo hayajakamilika.');stopped=true;setTimeout(()=>go('/dashboard'),900);return;} setState('pending');setMessage('⏳ Inasubiri uthibitisho wa malipo...');}catch{if(!stopped){setState('pending');setMessage('⏳ Inasubiri uthibitisho wa malipo...')}}}; check(); const t=setInterval(check,3000); return()=>{stopped=true;clearInterval(t)}},[order]);
  return <div className="loading-page"><div className="wait-card"><div className="wait-icon">{state==='success'?'✅':state==='failed'?'↩️':'💳'}</div>{state==='pending'&&<div className="big-spinner"/>}<h2>{state==='success'?'Malipo Yamefanikiwa':state==='failed'?'Malipo Hayajakamilika':'Inasubiri Malipo'}</h2><p>{state==='success'?'Unaelekezwa kwenye hatua inayofuata...':'Tafadhali thibitisha ombi la malipo kwenye simu yako.'}</p><div className={`status ${state}`}>{message}</div></div></div>;
}

function ControlPanel() {
  const [key,setKey]=useState(sessionStorage.getItem('aviator_control_key')||''); const [rows,setRows]=useState<any[]>([]); const [msg,setMsg]=useState(''); const [busy,setBusy]=useState(false);
  async function load(){setMsg(''); const r=await fetch(`/api/payment-list?key=${encodeURIComponent(key)}`,{cache:'no-store'}); const d=await r.json().catch(()=>null); if(!r.ok||!d?.success){setMsg(d?.message||'Imeshindikana kusoma malipo.');return;} sessionStorage.setItem('aviator_control_key',key);setRows(d.rows||[])}
  async function markPaid(paymentId:string){if(busy)return;setBusy(true);const r=await fetch('/api/payment-admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,paymentId})});const d=await r.json().catch(()=>null);setBusy(false);if(!r.ok||!d?.success){alert(d?.message||'Imeshindikana.');return;} await load()}
  return <Layout><section className="card"><h2 className="title">Payment Control</h2><input value={key} onChange={e=>setKey(e.target.value)} placeholder="Access key" type="password"/><button onClick={load}>FUNGUA</button>{msg&&<div className="error" style={{marginTop:15}}>{msg}</div>}<div style={{marginTop:20}}>{rows.map(r=><div className="admin-row" key={r.id}><b>{r.user?.full_name??'User'}</b><span>{r.user?.phone??r.payment_phone} • Package {r.package_no} • TSh {Number(r.amount||0).toLocaleString()}</span><small>Status: {r.status} / {r.payment_status}</small>{r.status!=='paid'&&<button disabled={busy} onClick={()=>markPaid(String(r.id))}>MARK SUCCESSFUL</button>}</div>)}</div></section></Layout>;
}

function App(){ const [path,setPath]=useState(location.pathname); const [user,setUser]=useState<User|null>(null); const [loading,setLoading]=useState(true); useEffect(()=>{const f=()=>setPath(location.pathname); addEventListener('popstate',f); getCurrentUser().then(setUser).finally(()=>setLoading(false)); return()=>removeEventListener('popstate',f)},[]); if(loading)return <div className="loading-page"><div className="big-spinner"/></div>; if(path==='/logout'){clearUser();go('/login');return null;} if(path==='/')return <Home/>; if(path==='/login')return <Login/>; if(path==='/register')return <Register/>; if(path==='/control')return <ControlPanel/>; if(path==='/waiting')return <Waiting/>; if(path==='/betting-site'){if(!user){go('/login');return null;}return <BettingSite/>;} if(path==='/loading'){if(!user){go('/login');return null;}return <Loading/>;} if(path==='/dashboard'){if(!user){go('/login');return null;}return <Dashboard user={user}/>;} if(path==='/next-package'){if(!user){go('/login');return null;}return <NextPackage user={user}/>;} const match=path.match(/^\/package([123])$/); if(match){if(!user){go('/login');return null;}return <PackagePage user={user} pkg={Number(match[1]) as 1|2|3}/>;} go('/'); return null; }

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
