import type {Preference} from '@/lib/pax';
import {interpretSearch} from '@/server/listings/typed-search';
import {searchSummary} from '@/lib/search-summary';
import PaxEntry from '@/components/pax-entry';
import {searchInventory} from '@/server/listings/service';
import {listingPageFilters} from '@/lib/listing-query';
import ListingsExplorer from "@/components/listings-explorer";
import { pageMetadata } from "@/lib/seo";
export const dynamic="force-dynamic";
export const metadata=pageMetadata("Explore properties","Search homes for sale, rentals, and commercial properties in Palm Beach County.","/listings");
export default async function Listings({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;const query=typeof params.q==='string'?params.q.trim().slice(0,2000):'';
 const interpreted=query?await interpretSearch(query):null;const filters={...interpreted?.filters,...listingPageFilters(params)};const inventory=await searchInventory(filters);const listings=inventory.listings;
 return <div className="container" style={{paddingBottom:75}}><div className="page-intro"><span className="eyebrow">YOUR NEXT CHAPTER</span><h1>Find a place that feels right.</h1><p>Explore freely. Narrow your search by community, price, and the space you need.</p>{inventory.mode==="sample" && <p className="notice">Sample collection · These fictional listings are for demonstration, not available properties.</p>}</div><PaxEntry key={query} search initial={query} title="Tell Madison what you want — it’ll narrow these down." placeholder="A pool, a boat dock, room for the dog…"/>{query&&<section className="notice madison-search-summary" aria-label="Madison search results"><strong>Madison’s property search</strong><p>You asked: {query}</p><p>{searchSummary({...filters,area:filters.city,propertyType:filters.propertyType as Preference['propertyType']})}</p><p>{inventory.mode==='unavailable'?'Live listings are temporarily unavailable.':`${inventory.listings.length} matching properties.`} {interpreted?.method==='basic'?'Using city, price, beds and supported features from your request. ':''}Specific features such as a boat dock need confirmation in the listing details.</p></section>}<ListingsExplorer key={JSON.stringify(filters)} listings={listings} initialFilters={filters} initialFeed={inventory}/></div>;
}
