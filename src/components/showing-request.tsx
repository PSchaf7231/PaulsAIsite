'use client';
import {useEffect,useRef,useState} from 'react';
import {activityReady} from '@/lib/activity-client';
import {analyticsConsent,marketingEvent} from '@/lib/marketing-events';
import {validUsPhone,PHONE_ERROR} from '@/lib/phone';

export const OPEN_SHOWING_EVENT='open-showing-request';
// Short showing request at the top of a listing page. Sends the home with the lead and thanks the visitor in place.
export default function ShowingRequest({slug,address,sample=false}:{slug:string;address:string;sample?:boolean}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState('');
 const box=useRef<HTMLDivElement>(null),first=useRef<HTMLInputElement>(null);
 function show(){setOpen(true);requestAnimationFrame(()=>{box.current?.scrollIntoView({behavior:'smooth',block:'center'});first.current?.focus({preventScroll:true});});}
 useEffect(()=>{window.addEventListener(OPEN_SHOWING_EVENT,show);return()=>window.removeEventListener(OPEN_SHOWING_EVENT,show);},[]);
 const today=new Date();const minDay=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;setError('');const f=new FormData(e.currentTarget);
  const phone=String(f.get('phone')||'');if(!validUsPhone(phone)){setError(PHONE_ERROR);return;}
  const day=String(f.get('day')||'');const dayLabel=day?new Date(`${day}T12:00:00`).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}):'Flexible';
  setBusy(true);
  try{await activityReady();const r=await fetch('/api/pax/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:f.get('name'),phone,email:f.get('email'),purpose:'SHOWING',intent:'BUYER',listing:{slug},preferredDay:dayLabel,smsConsent:f.get('sms')==='on',emailConsent:false,eventId:crypto.randomUUID(),analyticsConsent:analyticsConsent()})});const body=await r.json().catch(()=>({}));if(!r.ok)throw new Error(body.error||'Unable to send your request. Please try again.');marketingEvent('Lead',body.eventId);
   const name=String(f.get('name')||'').trim().split(' ')[0];setDone(`Thank you${name?`, ${name}`:''}. Paul has your showing request for ${address} and will confirm a time with you.`);}
  catch(err){setError(err instanceof Error?err.message:'Please try again.');}finally{setBusy(false);}
 }
 return <div className="showing-request" ref={box} id="request-showing">
  {!open&&!done&&<button type="button" className="btn" onClick={show}>Request a showing</button>}
  {done&&<p className="showing-thanks" role="status">{done}</p>}
  {open&&!done&&<form className="lead-form showing-form" onSubmit={submit}><h2>Request a showing</h2>
   <label>Home<input name="home" value={address} readOnly/></label>
   <label>Name<input ref={first} name="name" autoComplete="name" required maxLength={100}/></label>
   <label>Phone<input name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={20} placeholder="(561) 555-0123"/></label>
   <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
   <label>Preferred day<input name="day" type="date" min={minDay}/></label>
   <label className="channel-consent"><input type="checkbox" name="sms"/>OK to text me about this request. Message and data rates may apply. Reply STOP to opt out.</label>
   <p className="pax-fine">{sample?'This is a sample home and cannot be toured; Paul can show you similar homes. ':''}All appointments require confirmation. <a href="/privacy">Privacy policy</a>.</p>
   <div className="lead-form-actions"><button className="btn" disabled={busy}>{busy?'Sending…':'Send request'}</button><button type="button" className="btn outline" onClick={()=>setOpen(false)}>Cancel</button></div>
   {error&&<p role="alert">{error}</p>}
  </form>}
 </div>;
}
