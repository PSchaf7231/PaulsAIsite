import {it,expect} from 'vitest';
import {findTown,suggestTowns} from '../src/lib/search-cities';
import {basicSearchFilters} from '../src/server/listings/typed-search';
import {mergeTypedSearch,listingSearchParams,listingPageFilters} from '../src/lib/listing-query';
import {listingFactLabel,type Listing} from '../src/lib/listings';
import {salePrices} from '../src/lib/search-prices';
import {validUsPhone} from '../src/lib/phone';
import samples from '../src/lib/sample-listings.json';
it('reads Delray spellings and common misspellings as the right town',()=>{
 for(const q of ['Delray','del ray','Del Rey','delray beach','delraybeach','Dellray Beach','pool home in del rey'])expect(findTown(q)?.city).toBe('Delray Beach');
 expect(findTown('Jupitor')?.city).toBe('Jupiter');expect(findTown('Bocca Raton')?.city).toBe('Boca Raton');
 expect(findTown('homes in Palm Beach County')).toBeNull();expect(findTown('asdfghjkl')).toBeNull();expect(findTown('3 bed pool home')).toBeNull();
 expect(basicSearchFilters('3 bed condo in Dellray Beach')).toMatchObject({city:'Delray Beach',beds:3,propertyType:'CONDO'});
});
it('suggests close towns only',()=>{expect(suggestTowns('Welingtn')).toContain('Wellington');expect(suggestTowns('asdfghjkl')).toEqual([]);});
it('lets a typed town replace the city already in the URL',()=>{
 expect(mergeTypedSearch({city:'Boca Raton',type:'SALE',propertyType:'HOUSE',minPrice:1000000},{city:'Delray Beach'})).toEqual({city:'Delray Beach',type:'SALE',propertyType:'HOUSE',minPrice:1000000});
 expect(mergeTypedSearch({city:'Boca Raton',type:'SALE',minPrice:1000000},{city:'Delray Beach',type:'RENT'})).toEqual({city:'Delray Beach',type:'RENT'});
 expect(mergeTypedSearch({city:'Boca Raton',minPrice:1000000},{text:'911 N Ocean Blvd'},true)).toEqual({text:'911 N Ocean Blvd'});
});
it('round-trips filters, sort and page through the URL',()=>{
 const f={city:'Jupiter',type:'SALE' as const,propertyType:'HOUSE',minPrice:1000000,pool:true,sort:'price-desc' as const};
 const p=listingSearchParams(f,2);expect(p.get('page')).toBe('2');expect(listingPageFilters(Object.fromEntries(p))).toEqual(f);
});
it('uses about 25 price steps, singular bed/bath labels and 10-digit phones',()=>{
 expect(salePrices.length).toBeGreaterThanOrEqual(20);expect(salePrices.length).toBeLessThanOrEqual(30);
 const one={...samples[0],beds:1,baths:1,missingFields:[]} as unknown as Listing;expect(listingFactLabel(one,'beds')).toBe('1 bed');expect(listingFactLabel({...one,baths:2.5},'baths')).toBe('2.5 baths');
 expect(validUsPhone('12')).toBe(false);expect(validUsPhone('(561) 255-7285')).toBe(true);expect(validUsPhone('+1 561 255 7285')).toBe(true);
});

import {randomUUID} from 'node:crypto';
import {captureLead,captureSchema} from '../src/server/pax/conversion';
import {newState} from '../src/server/pax/state';
it('sends the listing MLS number, address and page link to Follow Up Boss with a showing request',()=>{
 const s=newState('d'.repeat(64));
 const input=captureSchema.parse({name:'Test Person',phone:'561-555-0100',email:'t@example.com',purpose:'SHOWING',listing:{slug:'106-toteka-circle-jupiter-33458-b26073825'},preferredDay:'Friday, November 20',smsConsent:true,eventId:randomUUID()});
 captureLead(s,input,'WEBSITE',{slug:'106-toteka-circle-jupiter-33458-b26073825',url:'https://www.pbrealestatepros.com/listings/106-toteka-circle-jupiter-33458-b26073825',mlsNumber:'B26073825',address:'106 Toteka Circle',city:'Jupiter',postalCode:'33458',price:500000});
 const fub=s.notifications.find(n=>n.integration==='fub')!;const payload=fub.payload as {type:string;message:string;property:{mlsNumber:string;street:string;url:string}};
 expect(payload.type).toBe('Property Inquiry');expect(payload.property).toMatchObject({mlsNumber:'B26073825',street:'106 Toteka Circle'});
 expect(payload.message).toContain('Showing request: 106 Toteka Circle, Jupiter, FL 33458 | MLS #B26073825 | https://www.pbrealestatepros.com/listings/106-toteka-circle-jupiter-33458-b26073825');
 expect(payload.message).toContain('Preferred day: Friday, November 20');expect(s.communicationConsent?.sms).toBe(true);
});
