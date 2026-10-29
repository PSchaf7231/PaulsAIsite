import type { Preference } from './pax';
export function searchSummary(p:Preference){
 return [p.beds?`${p.beds}+ beds`:null,p.baths?`${p.baths}+ baths`:null,p.propertyType?.toLowerCase().replaceAll('_',' '),p.areas?.length?p.areas.join(' or '):p.area,p.maxPrice?`under $${p.maxPrice.toLocaleString('en-US')}${p.type==='RENT'?' per month':''}`:null,p.minPrice?`at least $${p.minPrice.toLocaleString('en-US')}`:null,p.mustHaves?.length?`must have: ${p.mustHaves.join(', ')}`:null,p.dealBreakers?.length?`avoid: ${p.dealBreakers.join(', ')}`:null,p.timeline?`timeline: ${p.timeline}`:null,p.movingReason?`moving because: ${p.movingReason}`:null].filter(Boolean).join(' · ')||'Palm Beach County homes';
}
