'use client';
import { useEffect,useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { track,activityReady } from '@/lib/activity-client';
export default function LeadConversion({live=false}:{live?:boolean}){
 const pathname=usePathname();
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{
  if(window.location.pathname.startsWith('/admin'))return;
  let visit=crypto.randomUUID();try{const stored=sessionStorage.getItem('pax-visit');if(stored)visit=stored as typeof visit;else sessionStorage.setItem('pax-visit',visit);}catch{/* Browsing works when browser storage is disabled. */}
  void track({kind:'visit',visitId:visit});
  const interval=setInterval(()=>{if(document.visibilityState==='visible')void track({kind:'time',seconds:30});},30000);
  return()=>clearInterval(interval);
 },[]);
 useEffect(()=>{const match=/^\/listings\/([^/]+)$/.exec(pathname);if(match)void track({kind:'view',slug:decodeURIComponent(match[1])});},[pathname]);
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage('');const f=new FormData(e.currentTarget);
  try{await activityReady();const r=await fetch('/api/pax/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:f.get('email'),purpose:'CONTACT',smsConsent:false,emailConsent:f.get('emailConsent')==='on'})});const body=await r.json();if(!r.ok)throw new Error(body.error);setMessage(body.message);setOpen(false);}
  catch(e){setMessage(e instanceof Error?e.message:'Please try again.');}finally{setBusy(false);}
 }
 function dismiss(){setOpen(false);void track({kind:'dismiss'});}
 if(pathname.startsWith("/admin"))return null;
 return <section className="lead-conversion" aria-label="Next steps with Pax">
  <div className="container"><p><strong>Pax · Your next move</strong> Want help finding real Palm Beach County homes?</p><button className="btn outline small" onClick={()=>setOpen(v=>!v)}>Ask Paul to follow up</button>
  {open&&<form className="lead-form" onSubmit={submit}><h2>Let’s make your next move easier.</h2><p>What email should Paul use? You can keep browsing without sharing anything else.</p>
   <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
   <label className="channel-consent"><input type="checkbox" name="emailConsent"/>Email my acknowledgment, confirmed-search matches.</label>
   <p className="pax-fine">Submitting saves your contact details and browsing history for Paul’s personal follow-up. <Link href="/privacy">Privacy</Link>. {!live&&"Fictional sample properties cannot be toured; "}all appointments require confirmation.</p>
   <button className="btn" disabled={busy}>{busy?'Saving…':'Send my request'}</button> <button type="button" className="btn outline" onClick={dismiss}>Keep browsing</button>
  </form>}{message&&<p role="status">{message}</p>}</div>
 </section>;
}
