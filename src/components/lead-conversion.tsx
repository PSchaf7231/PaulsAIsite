'use client';
import { useEffect,useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { track,activityReady } from '@/lib/activity-client';
export default function LeadConversion({automaticTexts=false}:{automaticTexts?:boolean}){
 const pathname=usePathname();
 const [offer,setOffer]=useState(false),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{
  if(window.location.pathname.startsWith('/admin'))return;
  let visit=crypto.randomUUID();try{const stored=sessionStorage.getItem('pax-visit');if(stored)visit=stored as typeof visit;else sessionStorage.setItem('pax-visit',visit);}catch{/* Browsing works when browser storage is disabled. */}
  void track({kind:'visit',visitId:visit});
  const interval=setInterval(()=>{if(document.visibilityState==='visible')void track({kind:'time',seconds:30});},30000);
  function activity(e:Event){const data=(e as CustomEvent).detail;if(data.eligible){setOffer(true);void track({kind:'offer'});}}
  window.addEventListener('pax:activity',activity);
  return()=>{clearInterval(interval);window.removeEventListener('pax:activity',activity);};
 },[]);
 useEffect(()=>{const match=/^\/listings\/([^/]+)$/.exec(pathname);if(match)void track({kind:'view',slug:decodeURIComponent(match[1])});},[pathname]);
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage('');const f=new FormData(e.currentTarget);
  try{await activityReady();const r=await fetch('/api/pax/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:f.get('name'),email:f.get('email'),phone:f.get('phone'),wanted:f.get('wanted'),timeline:f.get('timeline'),purpose:f.get('purpose'),smsConsent:f.get('smsConsent')==='on',emailConsent:f.get('emailConsent')==='on'})});const body=await r.json();if(!r.ok)throw new Error(body.error);setMessage(body.message);setOffer(false);setOpen(false);}
  catch(e){setMessage(e instanceof Error?e.message:'Please try again.');}finally{setBusy(false);}
 }
 function dismiss(){setOffer(false);setOpen(false);void track({kind:'dismiss'});}
 if(pathname.startsWith("/admin"))return null;
 return <section className="lead-conversion" aria-label="Next steps with Pax">
  <div className="container"><p><strong>Pax · Your next move</strong> Want help finding real Palm Beach County homes?</p><button className="btn outline small" onClick={()=>setOpen(v=>!v)}>Ask Paul to follow up</button>
  {offer&&!open&&<aside className="soft-ask" aria-label="Pax suggestion"><p>You’ve found a few things you like. Want Paul to help find similar homes or arrange a real showing?</p><p className="pax-fine">Save your preferences now; Pax can confirm a detailed search in chat and check for new matching samples. Live MLS listings are not connected.</p><button className="btn small" onClick={()=>setOpen(true)}>Save my preferences</button> <button className="btn outline small" onClick={dismiss}>Not now</button></aside>}
  {open&&<form className="lead-form" onSubmit={submit}><h2>Let’s make your next move easier.</h2><p>Share only the contact details you want to use. At least a phone or email is needed. No signup is needed to browse.</p>
   <label>Your name<input name="name" autoComplete="name" required maxLength={100}/></label>
   <label>Email<input name="email" type="email" autoComplete="email" maxLength={254}/></label>
   <label>Phone<input name="phone" type="tel" autoComplete="tel" maxLength={30}/></label>
   <label>What are you looking for?<textarea name="wanted" required maxLength={600} placeholder="An area, price range, or a home you liked"/></label>
   <label>Your timeline<input name="timeline" required maxLength={100} placeholder="For example, within 90 days"/></label>
   <label>How can Paul help?<select name="purpose"><option value="SEARCH">Save my search preferences</option><option value="CALL">Discuss real homes or a showing</option><option value="VALUATION">Free home value report</option></select></label>
   {automaticTexts&&<label className="channel-consent"><input type="checkbox" name="smsConsent"/>Text me an automated acknowledgment from Pax, Paul Schafranick’s assistant, about my request. Message and data rates may apply. Reply STOP to opt out. Consent is optional and is not a condition of buying or browsing.</label>}
   <label className="channel-consent"><input type="checkbox" name="emailConsent"/>Email my acknowledgment and new matches for searches I confirm.</label>
   <p className="pax-fine">Submitting saves your contact details and browsing history for Paul’s personal follow-up. <Link href="/privacy">Privacy</Link>. Fictional sample properties cannot be toured; all appointments require confirmation.</p>
   <button className="btn" disabled={busy}>{busy?'Saving…':'Send my request'}</button> <button type="button" className="btn outline" onClick={dismiss}>Keep browsing</button>
  </form>}{message&&<p role="status">{message}</p>}</div>
 </section>;
}
