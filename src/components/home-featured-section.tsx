import Link from 'next/link';
import ListingDisclosure from './listing-disclosure';
import HomeFeatured from './home-featured';
import {searchInventory} from '@/server/listings/service';
import {featuredHomes} from '@/lib/home-listings';
export default async function HomeFeaturedSection(){
 const [sale,rent]=await Promise.all([
  searchInventory({type:'SALE',propertyType:'HOUSE',minPrice:2000000,sort:'price-desc'},{limit:6}),
  searchInventory({type:'RENT',sort:'price-desc'},{limit:6})
 ]);
 return <><HomeFeatured sale={featuredHomes(sale.listings,'SALE')} rent={featuredHomes(rent.listings,'RENT')}/><div className="home-explore"><Link className="textlink" href="/listings">Explore all properties ↗</Link></div>{sale.mode!=='sample'&&<ListingDisclosure live checkedAt={sale.checkedAt}/>}</>;
}
export function FeaturedLoading(){return <div className="featured-loading" role="status"><span className="eyebrow">A PLACE TO CALL YOUR OWN</span><h2>Find your next chapter.</h2><p>Loading featured homes…</p></div>;}
