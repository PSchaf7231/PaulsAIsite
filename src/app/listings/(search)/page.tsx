import type {Preference} from '@/lib/pax';
import Link from 'next/link';
import {interpretSearch} from '@/server/listings/typed-search';
import {searchSummary} from '@/lib/search-summary';
import PaxEntry from '@/components/pax-entry';
import {searchInventory} from '@/server/listings/service';
import {knownCities} from '@/server/listings/store';
import {initialListingFilters,mergeTypedSearch,listingSearchParams,listingPageNumber} from '@/lib/listing-query';
import {parseTextQuery} from '@/lib/text-search';
import {findTown,suggestTowns} from '@/lib/search-cities';
import ListingsExplorer from "@/components/listings-explorer";
import { pageMetadata } from "@/lib/seo";
export const dynamic="force-dynamic";
const PAGE_SIZE=24;
export const metadata=pageMetadata("Explore properties","Search homes for sale, rentals, and commercial properties in Palm Beach County.","/listings");
export default async function Listings({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;const query=typeof params.q==='string'?params.q.trim().slice(0,2000):'';
 const page=listingPageNumber(params.page);
 const known=query?await knownCities().catch(()=>[]):[];
 const interpreted=query?await interpretSearch(query,known):null;
 // A typed street address or MLS number looks for one home, so older filters and the For sale default don't hide it.
 const specificHome=!!interpreted?.filters.text&&parseTextQuery(interpreted.filters.text).kind!=='words';
 // What the visitor typed beats the URL and the dropdowns (a typed town replaces the chosen city).
 let filters=mergeTypedSearch(initialListingFilters(params),interpreted?.filters,specificHome);
 // For sale unless the visitor picks For lease or types "rent".
 if(!filters.type&&!specificHome)filters={...filters,type:'SALE'};
 let inventory=await searchInventory(filters,{limit:PAGE_SIZE,offset:(page-1)*PAGE_SIZE});
 // One quick retry when the listing database hiccups (seen once in testing while filters changed quickly).
 if(inventory.mode==='unavailable')inventory=await searchInventory(filters,{limit:PAGE_SIZE,offset:(page-1)*PAGE_SIZE});
 const listings=inventory.listings;
 // Unrecognised words that match no address, city, ZIP or MLS number: say so instead of showing every home.
 const notFound=!!query&&interpreted?.method==='text'&&!specificHome&&inventory.mode!=='unavailable'&&!inventory.total;
 const suggestions=notFound?suggestTowns(query,known):[];
 const town=query&&filters.city?findTown(query,known):null;
 const suggestionHref=(city:string)=>{const p=listingSearchParams({...filters,city,text:undefined,postalCode:undefined});return `/listings?${p}`;};
 return <div className="container" style={{paddingBottom:75}}><div className="page-intro"><span className="eyebrow">YOUR NEXT CHAPTER</span><h1>Find a place that feels right.</h1><p>Explore freely. Narrow your search by city, price, and the space you need.</p>{inventory.mode==="sample" && <p className="notice">Sample collection · These fictional listings are for demonstration, not available properties.</p>}</div><PaxEntry key={query} search initial={query} title="Tell Madison what you want — it’ll narrow these down." placeholder="Example: pool, boat dock, room for the dog"/>
 {notFound?<section className="notice search-not-found" role="status" aria-label="No match"><h2>We couldn’t find “{query}”.</h2>{suggestions.length?<p>Did you mean {suggestions.map((city,i)=><span key={city}>{i>0?(i===suggestions.length-1?' or ':', '):''}<Link className="textlink" href={suggestionHref(city)}>{city}</Link></span>)}?</p>:<p>Try a city, ZIP code, street address or MLS number, for example Delray Beach or 33483.</p>}<p><Link className="btn outline small" href="/listings?all=1">See all homes for sale</Link></p></section>
 :<>{query&&<section className="notice madison-search-summary" aria-label="Madison search results"><strong>Madison’s property search</strong><p>You asked: {query}</p>{town&&!town.exact&&<p>Showing {town.city} for “{town.typed}”.</p>}<p>{searchSummary({...filters,area:filters.city,propertyType:filters.propertyType as Preference['propertyType']})}</p><p>{inventory.mode==='unavailable'?'Live listings are temporarily unavailable.':`${inventory.total.toLocaleString('en-US')} matching ${inventory.total===1?'property':'properties'}.`} {interpreted?.method==='basic'?'Using city, price, beds and supported features from your request. ':''}Specific features such as a boat dock need confirmation in the listing details.</p></section>}<ListingsExplorer key={query+JSON.stringify(filters)+page} listings={listings} initialFilters={filters} initialFeed={inventory} initialPage={page} scrollOnMount={!!query}/></>}</div>;
}
