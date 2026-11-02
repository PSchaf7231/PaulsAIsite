import {it,expect} from 'vitest';
import {listingQuerySchema,cityHomeSearchUrl} from '../src/lib/listing-query';
import {filterListings,type Listing} from '../src/lib/listings';
import samples from '../src/lib/sample-listings.json';
it('normalizes city tile URLs and excludes rentals, condos, unknown types and cheaper houses',()=>{
 const url=new URL(cityHomeSearchUrl('Palm Beach'),'https://example.com');const filters=listingQuerySchema.parse(Object.fromEntries(url.searchParams));expect(filters).toEqual({city:'Palm Beach',type:'SALE',propertyType:'HOUSE',minPrice:1000000});
 const base={...samples[0],city:'Palm Beach',type:'SALE',propertyType:'HOUSE',price:1000000} as Listing;
 const homes=[base,{...base,type:'RENT' as const},{...base,propertyType:'CONDO'},{...base,propertyType:undefined},{...base,price:999999},{...base,city:'Jupiter'}];expect(filterListings(homes,filters)).toEqual([base]);
});
it('accepts canonical filters and rejects unsupported property styles',()=>{expect(listingQuerySchema.parse({type:'SALE',propertyType:'HOUSE'}).propertyType).toBe('HOUSE');expect(listingQuerySchema.safeParse({propertyType:'something-else'}).success).toBe(false);});

import {listingPageFilters} from '../src/lib/listing-query';
it('defaults the listing page and city-only links to million-dollar single-family sales',()=>{
 expect(listingPageFilters({})).toEqual({type:'SALE',propertyType:'HOUSE',minPrice:1000000,sort:'price-desc'});
 expect(listingPageFilters({city:'Delray Beach'})).toMatchObject({city:'Delray Beach',type:'SALE',propertyType:'HOUSE',minPrice:1000000});
 expect(listingPageFilters({type:'RENT',maxPrice:'5000'})).toEqual({type:'RENT',maxPrice:5000,sort:'price-desc'});
});
