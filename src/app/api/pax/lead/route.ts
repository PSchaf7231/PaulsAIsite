import {randomUUID} from 'node:crypto';
import { after } from 'next/server';
import { identity,readBody,routeError,RequestError } from '@/server/pax/security';
import { withSession } from '@/server/pax/store';
import { captureSchema,captureLead,type LeadProperty } from '@/server/pax/conversion';
import { listingsService } from '@/server/listings';
import { siteUrl } from '@/lib/config';
// Website leads sent from a listing page carry that home: MLS number, address and page link, read from our own listing data.
async function leadProperty(slug:string):Promise<LeadProperty>{
 const url=`${siteUrl()}/listings/${slug}`;
 try{
  const l=await Promise.race([listingsService().getBySlug(slug),new Promise<null>(r=>setTimeout(()=>r(null),4000))]);
  if(l)return {slug:l.slug,url:`${siteUrl()}/listings/${l.slug}`,mlsNumber:l.mlsNumber||undefined,address:l.address,city:l.city,postalCode:l.postalCode,price:l.price,forRent:l.type==='RENT'};
 }catch{/* Keep the lead; the page link still identifies the home. */}
 return {slug,url};
}
import { flushNotifications } from '@/server/pax/notifications';
export async function POST(req:Request){try{
 const parsed=captureSchema.safeParse(await readBody(req));if(!parsed.success)throw new RequestError('Please provide valid contact details.');
 parsed.data.eventId??=randomUUID();
 // A website phone number needs 10 digits (a leading US 1 is fine).
 if(parsed.data.phone){const digits=parsed.data.phone.replace(/\D/g,'');if(!(digits.length===10||(digits.length===11&&digits.startsWith('1'))))throw new RequestError('Please enter a 10-digit phone number.');}
 const property=parsed.data.listing?await leadProperty(parsed.data.listing.slug):undefined;
 const id=(await identity(true))!;
 const result=await withSession(id,state=>{if(state.events.filter(e=>e.kind==='lead_request').length>=5)throw new RequestError('Your request is already saved. Please contact Paul for further changes.',429);return captureLead(state,parsed.data,'WEBSITE',property);});
 after(async()=>{try{await flushNotifications(id);}catch{/* Durable worker retries. */}});
 return Response.json(result.value,{headers:{'Cache-Control':'no-store'}});
}catch(e){return routeError(e);}}
