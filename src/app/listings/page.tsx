import PaxEntry from '@/components/pax-entry';
import { listingsService, listingsSource } from "@/server/listings";
import ListingsExplorer from "@/components/listings-explorer";
import { pageMetadata } from "@/lib/seo";
export const dynamic="force-dynamic";
export const metadata=pageMetadata("Explore properties","Search homes for sale, rentals, and commercial properties in Palm Beach County.","/listings");
export default async function Listings({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;const listings=await listingsService().search();
 const city=typeof params.city==="string"?params.city:"";const type=typeof params.type==="string" && ["SALE","RENT","COMMERCIAL"].includes(params.type)?params.type:"";
 return <div className="container" style={{paddingBottom:75}}><div className="page-intro"><span className="eyebrow">YOUR NEXT CHAPTER</span><h1>Find a place that feels right.</h1><p>Explore freely. Narrow your search by community, price, and the space you need.</p>{(listingsSource()==="sample" || listings.some(l=>l.isSample)) && <p className="notice">Sample collection · These fictional listings are for demonstration, not available properties.</p>}</div><PaxEntry title="Tell Pax what you want — it’ll narrow these down." placeholder="A pool, a boat dock, room for the dog…"/><ListingsExplorer key={`${city}-${type}`} listings={listings} initialCity={city} initialType={type}/></div>;
}
