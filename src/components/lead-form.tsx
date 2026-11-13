'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {activityReady} from '@/lib/activity-client';
import {analyticsConsent,marketingEvent} from '@/lib/marketing-events';
export default function LeadForm(){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;setBusy(true);setError('');const data=new FormData(e.currentTarget),eventId=crypto.randomUUID();
  try{await activityReady();const response=await fetch('/api/pax/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:data.get('name'),phone:data.get('phone'),email:data.get('email'),intent:data.get('intent'),wanted:data.get('message'),purpose:'CONTACT',eventId,analyticsConsent:analyticsConsent()})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Unable to save your request. Please try again.');marketingEvent('Lead',result.eventId);router.push('/thank-you');}
  catch(error){setError(error instanceof Error?error.message:'Please try again.');setBusy(false);}
 }
 return <section className="container section" id="lead-form"><h2>Book a Free Consultation</h2><p>Tell Paul about your next move.</p><form className="lead-form" onSubmit={submit}>
 <label>Name<input name="name" autoComplete="name" required maxLength={100}/></label>
 <label>Phone<input name="phone" type="tel" autoComplete="tel" required maxLength={30}/></label>
 <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
 <label>I am<select name="intent"><option value="BUYER">Buying</option><option value="SELLER">Selling</option><option value="RENTER">Renting</option></select></label>
 <label>Message<textarea name="message" maxLength={600} rows={4}/></label>
 <p>Paul receives your contact details, message and property browsing history for personal follow-up. <a href="/privacy">Privacy policy</a>.</p>
 <button className="btn" disabled={busy}>{busy?'Saving…':'Send my request'}</button>{error&&<p role="alert">{error}</p>}
 </form></section>;
}
