import LeadForm from '@/components/lead-form';
import PaxEntry from '@/components/pax-entry';
import {cityHomeSearchUrl} from '@/lib/listing-query';
import Link from 'next/link';
import { agent } from '@/lib/config';
import { pageMetadata } from '@/lib/seo';
import {Suspense} from 'react';
import HomeFeaturedSection,{FeaturedLoading} from '@/components/home-featured-section';
import HowPaxWorks from '@/components/how-pax-works';
import DigitalSearch from '@/components/digital-search';
import HomePlacePhoto from '@/components/home-place-photo';
import {homeTilePhotos} from '@/lib/home-tile-photos';
import { homePlaces } from '@/lib/home-places';
export const dynamic='force-dynamic';
const homeTitle='Palm Beach Real Estate Pros | Paul Schafranick, Realtor®';
const baseMeta=pageMetadata(homeTitle,'Palm Beach County homes for sale and rent with Paul Schafranick, Realtor®. A personal approach to buying, leasing and selling from Boca Raton to Jupiter.','/');
export const metadata={...baseMeta,title:{absolute:homeTitle},openGraph:{...baseMeta.openGraph,title:homeTitle}};
export default function Home(){
 return <div className="coastal-home"><section className="coastal-hero">
 {/* Decorative hero photo (not a listing). Keep property facts in results and listing pages. */}
 <picture className="hero-photo" aria-hidden="true"><source media="(max-width:700px)" srcSet="/images/hero-glass-jupiter-mobile.webp"/><img src="/images/hero-glass-jupiter.webp" alt="" fetchPriority="high" decoding="async"/></picture><span className="hero-photo-shade" aria-hidden="true"/>
 <div className="digital-atmosphere" aria-hidden="true"><span className="digital-orbit orbit-one"/><span className="digital-orbit orbit-two"/><span className="digital-node node-one"/><span className="digital-node node-two"/></div>
 <div className="container coastal-hero-content"><span className="ai-hero-badge ai-active-border">✦ AI-POWERED HOME SEARCH</span><h1>Meet Madison.<br/><em>Your AI home guide.</em></h1><p>Palm Beach County, in a conversation.<br/>Ask, explore, compare.</p><DigitalSearch/><div className="hero-lead-actions"><a className="btn outline" href="#lead-form">Get a Call</a><a className="hero-call-link" href="tel:+15612557285">Call Paul (561) 255-7285</a></div></div><span className="coastal-location">PALM BEACH COUNTY, FLORIDA</span></section>

 <section className="coastal-communities"><div className="container coastal-section"><div className="coastal-section-head"><div><span className="eyebrow">SIX PLACES. ENDLESS POSSIBILITIES.</span><h2>Find your kind of Palm Beach.</h2></div><p>From oceanfront mornings to<br/>a little more room to breathe.</p></div><div className="home-places">{homePlaces.map(({city,tag,photo,alt},i)=><Link className={`home-place home-place-${i}`} href={cityHomeSearchUrl(city)} key={city}><HomePlacePhoto src={homeTilePhotos[city]?.src||photo} alt={homeTilePhotos[city]?.alt||alt}/><div><h3>{city}</h3><p>{tag}</p></div><span aria-hidden="true">↗</span></Link>)}</div></div></section>
 <section className="container coastal-section" id="featured-homes"><Suspense fallback={<FeaturedLoading/>}><HomeFeaturedSection/></Suspense></section><HowPaxWorks/><div className="digital-path container"><span>01 / Discover your place</span><span>02 / Explore the details</span><span>03 / Make your move</span></div><section className="container coastal-section"><div className="coastal-seller"><span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span><h2>Thinking of selling?</h2><p>Get a free home value report.<br/>Local perspective. A thoughtful plan. A conversation with Paul.</p><PaxEntry title="Let’s talk about your home" placeholder="What’s my home worth?" initial="What’s my home worth?" chips={["I’m selling and would like a free home value report."]}/></div></section>
 <LeadForm/><section className="coastal-contact"><div className="container"><div><span className="eyebrow">PERSONAL GUIDANCE, EVERY STEP</span><h2>{agent.name}</h2><p>Let’s talk about what comes next.</p></div><div className="coastal-contact-actions"><a className="contact-number" href="tel:5612557285">561-255-7285</a><div><a href="tel:5612557285">Call Paul</a><span aria-hidden="true"> / </span><a href="sms:+15612557285">Text Paul</a></div><Link className="btn outline" href="/contact">Get in touch ↗</Link></div></div></section><div className="container home-guides"><Link href="/communities">Neighborhood guides ↗</Link></div></div>;
}
