'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { usePax } from './pax-panel';
import HomeSearch from './home-search';

export default function DigitalSearch(){
 const [query,setQuery]=useState('');
 const open=usePax();
 const searchShortcuts=[
  {label:'Oceanfront in Palm Beach',href:'/listings?city=Palm+Beach&type=SALE&waterfront=true'},
  {label:'A private pool in Boca Raton',href:'/listings?city=Boca+Raton&type=SALE&pool=true'},
 ];
 return <div className="digital-search">
  <div className="digital-search-top"><span><Sparkles size={14} aria-hidden="true"/> YOUR SEARCH, IN YOUR WORDS</span><span>POWERED BY MADISON</span></div>
  <form onSubmit={e=>{e.preventDefault();if(query.trim())open(query.trim());}}>
   <label className="sr-only" htmlFor="home-natural-search">Describe your ideal home</label>
   <input id="home-natural-search" value={query} onChange={e=>setQuery(e.target.value)} maxLength={2000} placeholder="A waterfront home in Jupiter, with room for a boat…" required/>
   <button className="btn" type="submit">Explore with Madison <ArrowUpRight size={18} aria-hidden="true"/></button>
  </form>
  <div className="digital-suggestions"><span>Start somewhere</span>{searchShortcuts.map(item=><Link key={item.label} href={item.href}>{item.label} ↗</Link>)}<Link href="/contact">I’m thinking of selling ↗</Link></div>
  <div className="digital-search-bottom"><Link href="/listings">Browse homes yourself ↗</Link><span>Explore at your own pace.</span></div>
  <button type="button" className="madison-hero-button" onClick={()=>open()}>◉ Talk to Madison <span>Video chat · powered by Madison</span></button>
  <details className="digital-filters"><summary>Prefer filters? Search by city, price & beds</summary><HomeSearch/></details>
 </div>;
}
