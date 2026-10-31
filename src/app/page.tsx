import PaxEntry from '@/components/pax-entry';
import {cityHomeSearchUrl} from '@/lib/listing-query';
import Link from 'next/link';
import { agent } from '@/lib/config';
import { pageMetadata } from '@/lib/seo';
import ListingDisclosure from '@/components/listing-disclosure';
import { searchInventory } from '@/server/listings/service';
import HomeFeatured from '@/components/home-featured';
import HowPaxWorks from '@/components/how-pax-works';
import DigitalSearch from '@/components/digital-search';
import HomePlacePhoto from '@/components/home-place-photo';
import {homeTilePhotos} from '@/lib/home-tile-photos';
import { homePlaces } from '@/lib/home-places';
import { featuredHomes } from '@/lib/home-listings';
export const dynamic='force-dynamic';
export const metadata=pageMetadata('Where Palm Beach comes home','Discover Palm Beach County homes with Paul Schafranick. A personal approach to buying, leasing and selling.','/');
export default async function Home(){
 const [sale,rent]=await Promise.all([searchInventory({type:'SALE',propertyType:'HOUSE',minPrice:2000000,sort:'price-desc'}),searchInventory({type:'RENT',sort:'price-desc'})]);

 return <div className="coastal-home"><section className="coastal-hero">
 {/* Hero intentionally uses abstract motion only. Keep property imagery in results and listing pages. */}
 <div className="digital-atmosphere" aria-hidden="true"><span className="digital-orbit orbit-one"/><span className="digital-orbit orbit-two"/><span className="digital-node node-one"/><span className="digital-node node-two"/></div>
 <div className="container coastal-hero-content"><span className="ai-hero-badge">✦ AI-POWERED HOME SEARCH</span><h1>Meet Pax.<br/><em>Your AI home guide.</em></h1><p>Palm Beach County, in a conversation.<br/>Ask, explore, compare — backed by Paul, a real agent.</p><DigitalSearch/></div><span className="coastal-location">PALM BEACH COUNTY, FLORIDA</span></section>
 <HowPaxWorks/><div className="digital-path container"><span>01 / Discover your place</span><span>02 / Explore the details</span><span>03 / Make your move</span></div><section className="container coastal-section" id="featured-homes"><HomeFeatured sale={featuredHomes(sale.listings,'SALE')} rent={featuredHomes(rent.listings,'RENT')}/><div className="home-explore"><Link className="textlink" href="/listings">Explore all properties ↗</Link></div>{sale.mode!=='sample'&&<ListingDisclosure live checkedAt={sale.checkedAt}/>}</section>
 <section className="coastal-communities"><div className="container coastal-section"><div className="coastal-section-head"><div><span className="eyebrow">SIX PLACES. ENDLESS POSSIBILITIES.</span><h2>Find your kind of Palm Beach.</h2></div><p>From oceanfront mornings to<br/>a little more room to breathe.</p></div><div className="home-places">{homePlaces.map(({city,tag,photo,alt},i)=><Link className={`home-place home-place-${i}`} href={cityHomeSearchUrl(city)} key={city}><HomePlacePhoto src={homeTilePhotos[city]?.src||photo} alt={homeTilePhotos[city]?.alt||alt}/><span className="place-number">0{i+1}</span><div><h3>{city}</h3><p>{tag}</p></div><span aria-hidden="true">↗</span></Link>)}</div></div></section>
 <section className="container coastal-section"><div className="coastal-seller"><span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span><h2>Thinking of selling?</h2><p>Get a free home value report.<br/>Local perspective. A thoughtful plan. A conversation with Paul.</p><PaxEntry title="Let’s talk about your home" placeholder="What’s my home worth?" initial="What’s my home worth?" chips={["I’m selling and would like a free home value report."]}/></div></section>
 <section className="coastal-contact"><div className="container"><div><span className="eyebrow">PERSONAL GUIDANCE, EVERY STEP</span><h2>{agent.name}</h2><p>Let’s talk about what comes next.</p></div><div className="coastal-contact-actions"><a className="contact-number" href="tel:5612557285">561-255-7285</a><div><a href="tel:5612557285">Call Paul</a><span aria-hidden="true"> / </span><a href="sms:+15612557285">Text Paul</a></div><Link className="btn outline" href="/contact">Get in touch ↗</Link></div></div></section><div className="container home-guides"><Link href="/communities">Neighborhood guides ↗</Link></div></div>;
}
