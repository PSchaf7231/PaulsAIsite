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
