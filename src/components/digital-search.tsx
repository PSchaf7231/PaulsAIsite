'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { usePax } from './pax-panel';
import HomeSearch from './home-search';

export default function DigitalSearch(){
 const [query,setQuery]=useState('');
 const open=usePax();
 return <div className="digital-search">
  <div className="digital-search-top"><span><Sparkles size={14} aria-hidden="true"/> YOUR SEARCH, IN YOUR WORDS</span><span>POWERED BY PAX</span></div>
  <form onSubmit={e=>{e.preventDefault();if(query.trim())open(query.trim());}}>
   <label className="sr-only" htmlFor="home-natural-search">Describe your ideal home</label>
   <input id="home-natural-search" value={query} onChange={e=>setQuery(e.target.value)} maxLength={2000} placeholder="A waterfront home in Jupiter, with room for a boat…" required/>
   <button className="btn" type="submit">Explore with Pax <ArrowUpRight size={18} aria-hidden="true"/></button>
  </form>
  <div className="digital-suggestions"><span>Start somewhere</span>{['Oceanfront in Palm Beach','A private pool in Boca Raton','I’m thinking of selling'].map(q=><button key={q} onClick={()=>open(q)}>{q} ↗</button>)}</div>
  <div className="digital-search-bottom"><Link href="/listings">Browse homes yourself ↗</Link><span>Explore at your own pace.</span></div>
  <button type="button" className="madison-hero-button" onClick={()=>open()}>◉ Talk to Madison <span>Video chat · powered by Pax</span></button>
  <details className="digital-filters"><summary>Prefer filters? Search by city, price & beds</summary><HomeSearch/></details>
 </div>;
}
