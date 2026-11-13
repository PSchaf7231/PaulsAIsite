'use client';
import {useState,useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {salePrices,rentalPrices,searchPriceLabel} from '@/lib/search-prices';
import {searchCities,findTown} from '@/lib/search-cities';

// Compact homepage hero search: one card that fits above the fold on desktop and phone.
export default function HeroSearch(){
 const router=useRouter();
 const [pending,startTransition]=useTransition();
 const [type,setType]=useState('SALE');
 const rental=type==='RENT',prices=rental?rentalPrices:salePrices;
 return <form className="hero-search" aria-label="Search Palm Beach County homes" action="/listings" onSubmit={e=>{e.preventDefault();const params=new URLSearchParams();for(const [k,v] of new FormData(e.currentTarget))if(typeof v==='string'&&v.trim())params.set(k,v.trim());const q=params.get('q');if(q&&findTown(q))params.delete('city');startTransition(()=>router.push(`/listings?${params}`));}}>
  <label className="hero-search-q"><span className="sr-only">Describe the home you want</span><input name="q" maxLength={2000} placeholder="Describe your home, like a 3-bedroom pool home"/></label>
  <div className="hero-search-row">
   <label>City<select name="city" defaultValue=""><option value="">All cities</option>{searchCities.map(c=><option key={c}>{c}</option>)}</select></label>
   <label>Looking to<select name="type" value={type} onChange={e=>{setType(e.target.value);const f=e.currentTarget.form;if(f)(f.elements.namedItem('maxPrice') as HTMLSelectElement).value='';}}><option value="SALE">Buy</option><option value="RENT">Rent</option></select></label>
   <label>Max price<select name="maxPrice" defaultValue=""><option value="">Any</option>{prices.map(v=><option value={v} key={v}>{searchPriceLabel(v,rental)}</option>)}</select></label>
   <label>Beds<select name="beds" defaultValue=""><option value="">Any</option>{[1,2,3,4,5].map(n=><option value={n} key={n}>{n}+</option>)}</select></label>
   <button className="hero-search-btn" type="submit" disabled={pending}>{pending?'Searching…':'Search'}</button>
  </div>
 </form>;
}
