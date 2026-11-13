"use client";
import {useRouter} from "next/navigation";
import {salePrices,rentalPrices,searchPriceLabel} from "@/lib/search-prices";
import { useState, useEffect, useRef, useTransition } from "react";
import { track } from "@/lib/activity-client";
import { searchCities } from "@/lib/search-cities";
import { listingSearchParams } from "@/lib/listing-query";
import { type Listing, type ListingFilters } from "@/lib/listings";
import ListingDisclosure from "./listing-disclosure";
import ListingCard from "./listing-card";
import MapPanel from "./map-panel";

type FilterState={city:string;type:string;propertyType:string;minPrice:string;maxPrice:string;beds:string;baths:string;pool:boolean;waterfront:boolean;garage:boolean;text:string;postalCode:string;sort:string};
const fromFilters=(f:ListingFilters):FilterState=>({city:f.city||'',type:f.type||'SALE',propertyType:f.propertyType||'',minPrice:f.minPrice?.toString()||'',maxPrice:f.maxPrice?.toString()||'',beds:f.beds?.toString()||'',baths:f.baths?.toString()||'',pool:!!f.pool,waterfront:!!f.waterfront,garage:!!f.garage,text:f.text||'',postalCode:f.postalCode||'',sort:f.sort||''});
const toFilters=(s:FilterState):ListingFilters=>({city:s.city||undefined,type:(s.type||'SALE') as ListingFilters['type'],propertyType:s.propertyType||undefined,minPrice:s.minPrice?Number(s.minPrice):undefined,maxPrice:s.maxPrice?Number(s.maxPrice):undefined,beds:s.beds?Number(s.beds):undefined,baths:s.baths?Number(s.baths):undefined,pool:s.pool||undefined,waterfront:s.waterfront||undefined,garage:s.garage||undefined,text:s.text||undefined,postalCode:s.postalCode||undefined,sort:(s.sort||undefined) as ListingFilters['sort']});
const SCROLL_KEY='listings-scroll';

// Every filter, the sort and the page live in the URL. Changing any of them loads that URL, so Back, refresh and shared links
// all show the same search. Filters apply as soon as they change.
export default function ListingsExplorer({listings,initialFilters={},initialFeed,initialPage=1,scrollOnMount=false}:{listings:Listing[];initialFilters?:ListingFilters;initialPage?:number;scrollOnMount?:boolean;initialFeed?:{mode:string;checkedAt?:string;hasMore:boolean;total?:number}}){
 const router=useRouter();
 const [pending,startTransition]=useTransition();
 const [state,setState]=useState(()=>fromFilters(initialFilters));
 const feed=initialFeed||{mode:listings.some(l=>l.isSample)?'sample':'live',checkedAt:listings[0]?.checkedAt,hasMore:false};
 const error=feed.mode==='unavailable'?'Live listings are temporarily unavailable. Please retry or contact Paul.':'';
 const page=initialPage;
 const resultsTop=useRef<HTMLDivElement>(null);
 const mapFilters=(()=>{const p=listingSearchParams({...initialFilters,sort:undefined});return p.toString();})();
 function scrollResults(){resultsTop.current?.scrollIntoView({behavior:'smooth',block:'start'});}
 useEffect(()=>{
  // Coming Back to this exact search: return to where the visitor was in the list.
  const key=`${SCROLL_KEY}:${window.location.search}`;
  let saved:string|null=null;try{saved=sessionStorage.getItem(key);}catch{/* storage may be off */}
  if(saved){const y=Number(saved);requestAnimationFrame(()=>window.scrollTo(0,y));}
  else if(scrollOnMount)resultsTop.current?.scrollIntoView({behavior:'instant',block:'start'});
  let timer:ReturnType<typeof setTimeout>|undefined;
  function remember(){clearTimeout(timer);timer=setTimeout(()=>{try{sessionStorage.setItem(key,String(Math.round(window.scrollY)));}catch{}},150);}
  window.addEventListener('scroll',remember,{passive:true});
  return()=>{window.removeEventListener('scroll',remember);clearTimeout(timer);};
 },[scrollOnMount]);
 useEffect(()=>{const f=initialFilters;const timer=setTimeout(()=>{void track({kind:"search",filters:{...(f.sort?{sort:f.sort}:{}),...(f.minPrice?{minPrice:f.minPrice}:{}),...(f.city?{area:f.city}:{}),...(f.maxPrice?{maxPrice:f.maxPrice}:{}),...(f.beds?{beds:f.beds}:{}),...(f.type?{type:f.type}:{})}});},600);return()=>clearTimeout(timer);},[initialFilters]);
 function go(next:FilterState,nextPage=1){
  if(next.minPrice&&next.maxPrice&&Number(next.minPrice)>Number(next.maxPrice))return;
  const params=listingSearchParams(toFilters(next),nextPage);
  try{sessionStorage.removeItem(`${SCROLL_KEY}:?${params}`);}catch{}
  startTransition(()=>router.push(`/listings?${params}`,{scroll:false}));
 }
 function update(patch:Partial<FilterState>){const next={...state,...patch};setState(next);go(next);}
 function goPage(n:number){scrollResults();go(state,n);}
 function reset(){const next=fromFilters({type:'SALE'});setState(next);startTransition(()=>router.push('/listings?all=1',{scroll:false}));}
 const {city,type,propertyType,minPrice,maxPrice,beds,baths,pool,waterfront,garage,sort}=state;
 const rental=type==='RENT',priceOptions=[...new Set([...(rental?rentalPrices:salePrices),...[minPrice,maxPrice].filter(Boolean).map(Number)])].sort((a,b)=>a-b);
 const invalidRange=!!minPrice && !!maxPrice && Number(minPrice)>Number(maxPrice);
 const cityOptions=[...new Set([...searchCities,...(initialFilters.city&&!searchCities.includes(initialFilters.city)?[initialFilters.city]:[])])];
 const results=listings,total=feed.total??results.length;
 return <><div className="filters" aria-busy={pending}><label>City<select value={city} onChange={e=>update({city:e.target.value,postalCode:'',text:''})}><option value="">All cities</option>{cityOptions.map(c=><option key={c}>{c}</option>)}</select></label><label>For sale / For lease<select value={type} onChange={e=>update({type:e.target.value,minPrice:'',maxPrice:''})}><option value="SALE">For sale</option><option value="RENT">For lease</option></select></label><label>Property type<select value={propertyType} onChange={e=>update({propertyType:e.target.value})}><option value="">All property types</option><option value="HOUSE">Single-family homes</option><option value="CONDO">Condos</option><option value="TOWNHOUSE">Townhouses</option><option value="VILLA">Villas</option></select></label><label>Min price {rental?'($ / month)':'($)'}<select value={minPrice} onChange={e=>update({minPrice:e.target.value})}><option value="">No minimum</option>{priceOptions.map(value=><option key={value} value={value}>{searchPriceLabel(value,rental)}</option>)}</select></label><label>Max price {rental?'($ / month)':'($)'}<select value={maxPrice} onChange={e=>update({maxPrice:e.target.value})}><option value="">No maximum</option>{priceOptions.map(value=><option key={value} value={value}>{searchPriceLabel(value,rental)}</option>)}</select></label><label>Bedrooms<select value={beds} onChange={e=>update({beds:e.target.value})}><option value="">Any bedrooms</option>{[1,2,3,4,5,6,7,8,9,10].map(n=><option key={n} value={n}>{n}+ {n===1?'bed':'beds'}</option>)}</select></label><label>Bathrooms<select value={baths} onChange={e=>update({baths:e.target.value})}><option value="">Any bathrooms</option>{[1,2,3,4,5,6,7,8].map(n=><option key={n} value={n}>{n}+ {n===1?'bath':'baths'}</option>)}</select></label><label>Features<select value={pool?"pool":waterfront?"waterfront":garage?"garage":""} onChange={e=>update({pool:e.target.value==="pool",waterfront:e.target.value==="waterfront",garage:e.target.value==="garage"})}><option value="">Any features</option><option value="pool">Private pool</option><option value="waterfront">Waterfront</option><option value="garage">Garage</option></select></label>
<p className="filters-hint" role="status">{pending?"Updating homes…":"Results update as you change a filter."}</p>
<button type="button" className="btn outline small" onClick={reset}>Reset</button>
</div>{invalidRange && <p role="alert" className="notice">Minimum price must be less than or equal to maximum price.</p>}<div ref={resultsTop} id="listing-results" style={{scrollMarginTop:100}} className="results-toolbar">{pending&&<span role="status">Updating listings…</span>}{error&&<p role="alert">{error} <button className="btn outline small" onClick={()=>router.refresh()}>Retry search</button></p>}<span aria-live="polite">{error?"Listing count unavailable":`${total.toLocaleString('en-US')} ${total === 1 ? "property" : "properties"} found`}</span><label>Sort by<select value={sort} onChange={e=>update({sort:e.target.value})}><option value="">Recommended</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label></div><div className="explorer" style={pending?{opacity:.6,transition:'opacity .2s'}:undefined}><div>{results.length ? <div className="listing-grid">{results.map(l=><ListingCard key={l.id} listing={l}/>)}</div>:<div className="empty-state"><h3>{error?"We couldn’t load the listings.":"No properties match just yet."}</h3><p>{error?"Please retry shortly or contact Paul.":"Try another city or a wider price range."}</p><button className="btn outline small" onClick={reset} style={{marginTop:20}}>Clear filters</button></div>}</div><MapPanel listings={results} searchFilters={mapFilters}/></div><p className="notice">Residential rental prices are monthly; sale prices are asking prices. Residential rentals start at $3,500 per month. {feed.mode==='sample'?'Sample addresses and map locations are illustrative.':'Confirm availability and details with Paul.'}</p><ListingDisclosure live={feed.mode!=="sample"} checkedAt={feed.checkedAt}/>{(page>1||feed.hasMore)&&<nav aria-label="Results pages"><button className="btn outline small" disabled={pending||page===1} onClick={()=>goPage(page-1)}>Previous</button><span> Page {page} </span><button className="btn small" disabled={pending||!feed.hasMore} onClick={()=>goPage(page+1)}>Next 24 homes</button></nav>}</>;
}
