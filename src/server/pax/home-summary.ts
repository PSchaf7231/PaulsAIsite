import { listingPrice,type Listing } from '../../lib/listings';
import type { Preference } from '../../lib/pax';
import { englishLabel } from '../../lib/property-details';
import { matchCriteria } from './search-criteria';
export function homeSummary(l:Listing,p:Preference={}){
 const facts=[`${listingPrice(l)} in ${l.city}${l.isSample?' — a fictional sample, not an available home':''}.`,`${l.type==='COMMERCIAL'?'Commercial space':l.missingFields?.includes('beds')?'bedroom count not supplied':`${l.beds} bedrooms`}, ${l.missingFields?.includes("baths")?"bathroom count not supplied":`${l.baths} bathrooms`} and ${l.missingFields?.includes("sqft")?"square footage not supplied":`${l.sqft.toLocaleString("en-US")} square feet`}.`,l.features.length?`Standouts: ${l.features.slice(0,3).map(f=>englishLabel(f)).join('; ')}.`:'No additional features are verified in this record.'];
 const criteria=['areas','area','minPrice','maxPrice','beds','baths','type','propertyType','mustHaves','dealBreakers'] as const;
 if(!criteria.some(k=>p[k]!==undefined&&p[k]!==''&&(!Array.isArray(p[k])||p[k].length)))return [...facts,'Tell Pax your budget and must-haves to see how this home fits your search.'];
 const match=matchCriteria(p,[l])[0];
 const gaps=[];
 if(p.maxPrice!=null&&l.price>p.maxPrice)gaps.push(`above your $${p.maxPrice.toLocaleString('en-US')} budget`);
 if(p.minPrice!=null&&l.price<p.minPrice)gaps.push('below your minimum price');
 if(p.beds!=null&&l.beds<p.beds)gaps.push(`fewer than your ${p.beds} bedrooms`);
 if(p.baths!=null&&l.baths<p.baths)gaps.push(`fewer than your ${p.baths} bathrooms`);
 if(p.type&&l.type!==p.type)gaps.push('a different sale/rental category');
 if(!match)return [...facts,`Fit with your search: ${gaps.length?gaps.join('; '):'outside at least one of your chosen areas, property types or feature requirements'}. Ask Pax to compare the trade-offs.`];
 return [...facts,match.exact?'Fit with your search: matches the property criteria you’ve shared so far. Your timeline and moving plans still need a conversation with Paul.':`Fit with your search: matches your stated location, price and room filters, where supplied. Still unverified: ${match.unknown.slice(0,3).join('; ')}. Paul can help confirm.`];
}
