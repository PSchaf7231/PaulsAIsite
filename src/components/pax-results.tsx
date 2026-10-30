'use client';
import { listingFact } from '../lib/listings';
import { useRef,useState,useMemo } from 'react';
import { Check,Heart,MapPin,Columns2 } from 'lucide-react';
import Link from 'next/link';
import type { PublicPaxState } from '@/lib/pax';
import ListingDisclosure from './listing-disclosure';
import { type Listing,listingPrice } from '@/lib/listings';
import ListingCard from './listing-card';
import MapPanel from './map-panel';
export default function PaxResults({session,busy,action}:{session:PublicPaxState|null;busy:boolean;action:(body:unknown)=>Promise<void>}){
 const [expanded,setExpanded]=useState(true),[selected,setSelected]=useState<{slug:string;request:number}>(),mapRef=useRef<HTMLDivElement>(null);
 const listings=useMemo(()=>(session?.results||[]).map(slug=>(session?.listingRecords||[]).find(l=>l.slug===slug)).filter((l):l is Listing=>!!l),[session?.results,session?.listingRecords]);
 const live=session?.feedMode==='live'||session?.feedMode==='unavailable';
 const compared=(session?.compared||[]).map(slug=>(session?.listingRecords||[]).find(l=>l.slug===slug)).filter((l):l is Listing=>!!l);
 return <div className={`pax-results ${expanded?'results-expanded':'results-collapsed'}`}>
  <button className="results-sheet-handle" aria-expanded={expanded} aria-controls="pax-result-content" onClick={()=>setExpanded(v=>!v)}><span aria-hidden="true">━</span>{expanded?'Hide':'Show'} results · {listings.length} {live?'homes':'samples'}</button>
  <div id="pax-result-content" className="pax-result-content">
   <div className="pax-results-heading"><span className="eyebrow">YOUR SEARCH, IN VIEW</span><h2>{listings.length?`${listings.length} ${live?'':'sample '}${listings.length===1?'property':'properties'}`:'A place to start'}</h2><p>Say “tell me about number 3.” {!live&&"These are fictional samples, not live listings."}</p><button className="btn small" disabled={busy||!session?.messages.length} onClick={()=>action({type:'create_alert'})}>Create alert</button></div>
   {listings.length>0?<>
    <div ref={mapRef} className="pax-results-map" tabIndex={-1}><MapPanel listings={listings} selectedSlug={selected?.slug} focusRequest={selected?.request} numbered/></div>
    <div className="pax-result-cards">{listings.map((listing,index)=><article key={listing.id} className="pax-numbered-card" aria-label={`Result ${index+1}: ${listing.title}`}>
     <span className="result-number">#{index+1}</span><ListingCard listing={listing} hideFavorite/>
     {session?.matchNotes?.[listing.slug]?.length?<p className="notice">Potential match — Paul needs to confirm: {session.matchNotes[listing.slug].join('; ')}</p>:null}
     <div className="result-actions"><button className="pax-save" disabled={busy||session?.saved.includes(listing.slug)} onClick={()=>action({type:'save',slug:listing.slug})} aria-label={session?.saved.includes(listing.slug)?'Saved':'Save this home'}>{session?.saved.includes(listing.slug)?<Check size={15}/>:<Heart size={15}/>} {session?.saved.includes(listing.slug)?'Saved':'Save'}</button>
      <button className="pax-save" disabled={busy} aria-pressed={session?.compared?.includes(listing.slug)||false} aria-label={`${session?.compared?.includes(listing.slug)?'Remove from':'Add to'} comparison: result ${index+1}`} onClick={()=>action({type:session?.compared?.includes(listing.slug)?'uncompare':'compare',slug:listing.slug})}><Columns2 size={15}/>{session?.compared?.includes(listing.slug)?'Comparing':'Compare'}</button>
      <button className="pax-save map-pin-button" aria-label={`Show result ${index+1} on map`} onClick={()=>{setSelected(previous=>({slug:listing.slug,request:(previous?.request||0)+1}));mapRef.current?.scrollIntoView({block:'nearest',behavior:'smooth'});mapRef.current?.focus({preventScroll:true});}}><MapPin size={16}/></button></div>
    </article>)}</div>
    {session?.hasMoreResults?<button className="btn outline small" disabled={busy} onClick={()=>action({type:'more'})}>Show me more</button>:<p className="pax-fine">You’ve seen all {listings.length} loaded matches.{!live&&" Five sample listings are available in total."}{session?.feedHasMore&&" Narrow your criteria to search more of the MLS feed."}</p>}
   </>:<div className="pax-empty"><p>{session?.events.some(e=>e.kind==='search')?'No listings match these preferences. Try removing a filter or ask Paul about real homes.':'Your matching homes will appear here as you chat.'}</p><Link className="textlink" href="/listings">Explore properties ↗</Link></div>}
   {compared.length>0&&<section className="pax-comparison" aria-label="Home comparison"><h3>Compare homes ({compared.length}/3)</h3><p className="pax-fine">Recorded listing fields only. Unknown HOA and other details need Paul’s confirmation.</p><div className="comparison-scroll"><table><caption className="sr-only">Selected homes side by side</caption><thead><tr><th scope="col">Feature</th>{compared.map(l=><th key={l.id} scope="col">{l.address}<button className="textlink" disabled={busy} onClick={()=>action({type:'uncompare',slug:l.slug})} aria-label={`Remove ${l.address} from comparison`}>Remove</button></th>)}</tr></thead><tbody>{[
    ['City',...compared.map(l=>l.city)],['Price',...compared.map(listingPrice)],['Beds / baths',...compared.map(l=>`${listingFact(l,'beds')} / ${listingFact(l,'baths')}`)],['Sq ft',...compared.map(l=>listingFact(l,'sqft'))],['Listed features',...compared.map(l=>l.features.join(', '))]
   ].map(row=><tr key={row[0]}><th scope="row">{row[0]}</th>{row.slice(1).map((value,i)=><td key={compared[i].id}>{value}</td>)}</tr>)}</tbody></table></div></section>}
   {session?.lead&&<p className="pax-fine">Your contact is saved for Paul. Email alerts require permission and a configured service.</p>}
   {session?.feedMode==='unavailable'&&<p role="alert">Live listings are temporarily unavailable. Please retry or contact Paul.</p>}<ListingDisclosure live={live} checkedAt={session?.feedCheckedAt}/>
  </div>
 </div>;
}
