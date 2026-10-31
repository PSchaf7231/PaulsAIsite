import Image from 'next/image';
import Link from 'next/link';
import { agent } from '@/lib/config';
import { pageMetadata } from '@/lib/seo';
import ListingDisclosure from '@/components/listing-disclosure';
import { searchInventory } from '@/server/listings/service';
import { PaxButton } from '@/components/pax-panel';
import HomeFeatured from '@/components/home-featured';
import HomeSearch from '@/components/home-search';
import HomePlacePhoto from '@/components/home-place-photo';
import { homePlaces } from '@/lib/home-places';
import { featuredHomes } from '@/lib/home-listings';
export const dynamic='force-dynamic';
export const metadata=pageMetadata('Where Palm Beach comes home','Discover Palm Beach County homes with Paul Schafranick. A personal approach to buying, leasing and selling.','/');
export default async function Home(){
 const [sale,rent]=await Promise.all([searchInventory({type:'SALE'}),searchInventory({type:'RENT'})]);

 return <div className="coastal-home"><section className="coastal-hero">
 {/* Styling pass: existing still illustration retained until the licensed drone asset can be downloaded and verified. No video is claimed or requested from visitors' browsers yet. */}
 <Image className="coastal-backdrop" src="/images/coastal-home.webp" alt="Illustrative coastal estate with a pool and palms" width={1536} height={1024} sizes="100vw" priority/>
 <div className="coastal-shade"/><div className="container coastal-hero-content"><span className="eyebrow">PALM BEACH REAL ESTATE PROS</span><h1>Where Palm Beach<br/><em>comes home.</em></h1><p>A little closer to the ocean.<br/>A little closer to the life you imagine.</p><div className="actions"><Link className="btn light" href="/listings">Search Homes <span aria-hidden="true">↗</span></Link><PaxButton className="btn coastal-glass">Ask Pax <span aria-hidden="true">↗</span></PaxButton></div><HomeSearch/></div><span className="coastal-location">PALM BEACH COUNTY, FLORIDA</span></section>
 <section className="container coastal-section" id="featured-homes"><HomeFeatured sale={featuredHomes(sale.listings)} rent={featuredHomes(rent.listings)}/><div className="home-explore"><Link className="textlink" href="/listings">Explore all properties ↗</Link></div>{sale.mode!=='sample'&&<ListingDisclosure live checkedAt={sale.checkedAt}/>}</section>
 <section className="coastal-communities"><div className="container coastal-section"><div className="coastal-section-head"><div><span className="eyebrow">SIX PLACES. ENDLESS POSSIBILITIES.</span><h2>Find your kind of Palm Beach.</h2></div><p>From oceanfront mornings to<br/>a little more room to breathe.</p></div><div className="home-places">{homePlaces.map(({city,tag,photo,alt},i)=><Link className={`home-place home-place-${i}`} href={`/listings?city=${encodeURIComponent(city)}`} key={city}><HomePlacePhoto src={photo} alt={alt}/><span className="place-number">0{i+1}</span><div><h3>{city}</h3><p>{tag}</p></div><span aria-hidden="true">↗</span></Link>)}</div><details className="home-photo-credits"><summary>Community photography credits</summary><p>Photographs depict local places at the time taken; displayed crops retain their original licenses.</p><ul>{homePlaces.map(p=><li key={p.city}><a href={`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(p.file)}`}>{p.city} — {p.author}</a> · <a href={p.licenseUrl}>{p.license}</a></li>)}</ul></details></div></section>
 <section className="container coastal-section"><div className="coastal-seller"><span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span><h2>Thinking of selling?</h2><p>Get a free home value report.<br/>Local perspective. A thoughtful plan. A conversation with Paul.</p><PaxButton message="I’m selling and would like a free home value report." className="btn">Get my home value report ↗</PaxButton></div></section>
 <section className="coastal-contact"><div className="container"><div><span className="eyebrow">PERSONAL GUIDANCE, EVERY STEP</span><h2>{agent.name}</h2><p>Let’s talk about what comes next.</p></div><div className="coastal-contact-actions"><a className="contact-number" href="tel:5612557285">561-255-7285</a><div><a href="tel:5612557285">Call Paul</a><span aria-hidden="true"> / </span><a href="sms:+15612557285">Text Paul</a></div><Link className="btn outline" href="/contact">Get in touch ↗</Link></div></div></section><div className="container home-guides"><Link href="/communities">Neighborhood guides ↗</Link></div></div>;
}
