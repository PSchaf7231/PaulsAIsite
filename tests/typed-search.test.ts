import {it,expect} from 'vitest';
import {basicSearchFilters} from '../src/server/listings/typed-search';
import {rentalPrices,searchPriceLabel} from '../src/lib/search-prices';
it('extracts requested city, budget, rooms and features without sale presets',()=>{
 expect(basicSearchFilters('3-bedroom waterfront home in Jupiter under $1.5 million')).toEqual({city:'Jupiter',beds:3,waterfront:true,maxPrice:1500000});
 expect(basicSearchFilters('condo for lease in West Palm Beach under $5,000 per month')).toEqual({city:'West Palm Beach',type:'RENT',propertyType:'CONDO',maxPrice:5000});
 expect(basicSearchFilters('Find a place in Palm Beach Gardens')).toEqual({city:'Palm Beach Gardens'});
 expect(basicSearchFilters('Single-family in Boca with a garage above 900k')).toMatchObject({city:'Boca Raton',propertyType:'HOUSE',garage:true,minPrice:900000});
});
it('offers monthly rent values without using sale amounts',()=>{
 expect(rentalPrices).toContain(5000);expect(rentalPrices).not.toContain(250000);expect(searchPriceLabel(5000,true)).toBe('$5,000 / month');
});
it('turns ZIP codes, street addresses and MLS numbers into searchable filters instead of showing everything',()=>{
 expect(basicSearchFilters('33444')).toEqual({postalCode:'33444'});
 expect(basicSearchFilters('homes in 33480 under 5m')).toMatchObject({postalCode:'33480',maxPrice:5000000});
 expect(basicSearchFilters('911 N Ocean Blvd')).toEqual({text:'911 N Ocean Blvd'});
 expect(basicSearchFilters('600 NE 5th Ave, Delray Beach, FL')).toEqual({text:'600 NE 5th Ave, Delray Beach, FL'});
 expect(basicSearchFilters('RX-11012345')).toEqual({text:'RX-11012345'});
 expect(basicSearchFilters('3 bed house in Jupiter')).toMatchObject({city:'Jupiter',beds:3});
 expect(basicSearchFilters('Highland Beach',['Highland Beach','Palm Beach'])).toEqual({city:'Highland Beach'});
 expect(basicSearchFilters('West Palm Beach',['Palm Beach'])).toEqual({city:'West Palm Beach'});
});
