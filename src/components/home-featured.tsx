'use client';
import { useState } from 'react';
import type { Listing } from '@/lib/listings';
import ListingCard from './listing-card';
export default function HomeFeatured({sale,rent}:{sale:Listing[];rent:Listing[]}){
 const [type,setType]=useState<'SALE'|'RENT'>('SALE');const homes=type==='SALE'?sale:rent;
 return <><div className="coastal-section-head"><div><span className="eyebrow">A PLACE TO CALL YOUR OWN</span><h2>Find your next chapter.</h2></div><div className="home-toggle" role="group" aria-label="Featured property type"><button aria-pressed={type==='SALE'} onClick={()=>setType('SALE')}>For Sale</button><button aria-pressed={type==='RENT'} onClick={()=>setType('RENT')}>For Lease</button></div></div><div className="home-listings">{homes.map(l=><ListingCard key={l.id} listing={l}/>)}</div>{!homes.length&&<p className="home-empty">Your next home is worth finding. <a href={`/listings?type=${type}`}>Explore the full search ↗</a></p>}</>;
}
