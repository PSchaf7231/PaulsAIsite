import type { Metadata } from 'next';
import { agent,siteUrl } from './config';
import type { Listing } from './listings';
export function indexingEnabled(){return process.env.SEO_INDEXING_ENABLED==='true';}
export function absoluteUrl(path:string){return new URL(path,siteUrl()).toString();}
export function pageMetadata(title:string,description:string,path:string,options:{noindex?:boolean}={}):Metadata{
 const image=absoluteUrl(`/api/og?title=${encodeURIComponent(title.slice(0,100))}`);
 return {title,description,alternates:{canonical:absoluteUrl(path)},robots:{index:indexingEnabled()&&!options.noindex,follow:true},openGraph:{title:`${title} | ${agent.brandName}`,description,url:absoluteUrl(path),siteName:agent.brandName,locale:'en_US',type:'website',images:[{url:image,width:1200,height:630,alt:`${title} — Paul Schafranick`}]},twitter:{card:'summary_large_image',title,description,images:[image]}};
}
export function listingMetadata(l:Listing){
 const pool=l.features.some(f=>/pool/i.test(f));
 const kind=l.type==='COMMERCIAL'?'Commercial property':l.type==='RENT'?'Home for rent':'Home for sale';
 const title=`${l.city} ${kind.toLowerCase()}${pool?' with pool':''} — ${l.address}${l.isSample?' (sample)':''}`;
 const description=`${l.isSample?'Fictional sample: ':''}${l.beds?`${l.beds} beds, `:''}${l.baths} baths in ${l.city} at $${l.price.toLocaleString('en-US')}${l.type==='RENT'?' per month':''}. ${l.features.slice(0,2).join(', ')}. Discuss your search with Paul Schafranick.`;
 return pageMetadata(title,description,`/listings/${l.slug}`,{noindex:l.isSample});
}
export function agentSchema(){return {'@context':'https://schema.org','@type':'RealEstateAgent','@id':absoluteUrl('/#agent'),name:agent.name,url:absoluteUrl('/'),telephone:'+15612557285',email:agent.email,areaServed:agent.communities.map(name=>({'@type':'City',name})),...(agent.headshot?{image:agent.headshot}:{}),...(agent.licenseNumber?{identifier:agent.licenseNumber}:{}),sameAs:Object.values(agent.socials)};}
export function listingSchema(l:Listing){return {'@context':'https://schema.org','@type':'RealEstateListing','@id':absoluteUrl(`/listings/${l.slug}#listing`),url:absoluteUrl(`/listings/${l.slug}`),name:`${l.isSample?'Fictional sample: ':''}${l.title}`,description:l.description,...(!l.isSample?{offers:{'@type':'Offer',price:l.price,priceCurrency:'USD',url:absoluteUrl(`/listings/${l.slug}`)},mainEntity:{'@type':l.type==='COMMERCIAL'?'Place':'Residence',address:{'@type':'PostalAddress',streetAddress:l.address,addressLocality:l.city,addressRegion:'FL',postalCode:l.postalCode,addressCountry:'US'}}}:{}),publisher:{'@id':absoluteUrl('/#agent')}};}
export function faqSchema(faqs:{question:string;answer:string}[]){return {'@context':'https://schema.org','@type':'FAQPage',mainEntity:faqs.map(f=>({'@type':'Question',name:f.question,acceptedAnswer:{'@type':'Answer',text:f.answer}}))};}
export function jsonLd(value:unknown){return JSON.stringify(value).replace(/</g,'\\u003c');}
