import PaxEntry from '@/components/pax-entry';
import {searchInventory} from '@/server/listings/service';
import {listingPageFilters} from '@/lib/listing-query';
import ListingsExplorer from "@/components/listings-explorer";
import { pageMetadata } from "@/lib/seo";
export const dynamic="force-dynamic";
export const metadata=pageMetadata("Explore properties","Search homes for sale, rentals, and commercial properties in Palm Beach County.","/listings");
export default async function Listings({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const filters=listingPageFilters(await searchParams);const inventory=await searchInventory(filters);const listings=inventory.listings;
 return <div className="container" style={{paddingBottom:75}}><div className="page-intro"><span className="eyebrow">YOUR NEXT CHAPTER</span><h1>Find a place that feels right.</h1><p>Explore freely. Narrow your search by community, price, and the space you need.</p>{inventory.mode==="sample" && <p className="notice">Sample collection · These fictional listings are for demonstration, not available properties.</p>}</div><PaxEntry title="Tell Pax what you want — it’ll narrow these down." placeholder="A pool, a boat dock, room for the dog…"/><ListingsExplorer key={JSON.stringify(filters)} listings={listings} initialFilters={filters} initialFeed={inventory}/></div>;
}
