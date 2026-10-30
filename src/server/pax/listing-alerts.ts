import { siteUrl } from "../../lib/config";
import { randomUUID } from 'node:crypto';
import type { PaxState } from '../../lib/pax';
import type { Listing } from '../../lib/listings';
import { sampleListings } from '../listings/sample';
import { matchCriteria } from './search-criteria';
import { automaticSms } from './delivery-settings';
export function queueListingAlerts(state:PaxState,listings:Listing[]=sampleListings){
 if(!state.lead)return 0;let count=0;
 for(const search of state.searches){
  if(search.status!=='ACTIVE_SAMPLE'&&search.status!=='ACTIVE')continue;
  const live=state.feedMode==='live';if(live&&search.status==='ACTIVE_SAMPLE'){search.status='ACTIVE';search.seenListingIds=undefined;}if(!live&&search.status==='ACTIVE')continue;
  if(!search.seenListingIds){search.seenListingIds=listings.map(l=>l.id);continue;}
  const seen=new Set(search.seenListingIds),fresh=matchCriteria(search.preferences,listings).filter(m=>m.exact&&!seen.has(m.listing.id)&&(!live||!!m.listing.listedAt&&Date.parse(m.listing.listedAt)>Date.parse(search.createdAt)));
  // All observed inventory is baseline, including nonmatches; price changes are not new listings.
  search.seenListingIds=[...new Set([...seen,...listings.map(l=>l.id)])];
  if(!fresh.length)continue;
  const at=new Date().toISOString(),slugs=fresh.map(m=>m.listing.slug);state.listingAlerts??=[];state.listingAlerts.push({at,slugs});
  const summary=`New ${live?'listing':'fictional sample'} matches for your confirmed search${live?'':' (not live MLS listings)'}:\n${fresh.map(m=>`${m.listing.address}, ${m.listing.city} — $${m.listing.price.toLocaleString('en-US')}${m.listing.type==='RENT'?' / month':''}\n${siteUrl()}/listings/${m.listing.slug}`).join('\n')}\nPaul Schafranick · 561-255-7285. ${live?'Paul can confirm availability and details.':'Sample homes cannot be toured.'} To stop these search alerts: ${siteUrl()}/alerts/unsubscribe?id=${state.id}&token=${search.unsubscribeToken||''}`;
  for(const channel of ['email','sms'] as const){
   const to=channel==='email'?state.lead.email:state.lead.phone;
   if(!to||!state.communicationConsent?.[channel]||(channel==='sms'&&!automaticSms()))continue;
   state.notifications.push({id:randomUUID(),reason:live?'new listing matches':'new sample matches',summary,status:'pending',attempts:0,nextAttemptAt:at,channel,audience:'lead',to});
  }
  state.events.push({kind:'listing_alert',at,detail:slugs.join(', ')});count+=fresh.length;
 }return count;
}
