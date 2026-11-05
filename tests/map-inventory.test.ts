import {it,expect} from 'vitest';
import {mapInventory,groupMapHomes} from '../src/lib/map-inventory';
import {sampleListings} from '../src/server/listings/sample';
it('maps all 901 matching homes without a 24/200/500 cap or card/detail payload',()=>{
 const rows=Array.from({length:901},(_,i)=>({...sampleListings[0],id:`id-${i}`,price:750000+i}));
 const result=mapInventory(rows,{minPrice:750000,type:'SALE'});expect(result.total).toBe(901);expect(result.homes).toHaveLength(901);expect(result.homes[900].id).toBe('id-900');expect(result.homes[0]).not.toHaveProperty('photos');expect(result.homes[0]).not.toHaveProperty('description');
});
it('uses the same filters and reports missing coordinates without plotting invented pins',()=>{
 const rows=[{...sampleListings[0],price:800000},{...sampleListings[0],id:'missing',price:900000,latitude:null},{...sampleListings[0],id:'rent',type:'RENT' as const,price:5000},{...sampleListings[0],id:'expensive',price:10000000}];
 const result=mapInventory(rows,{type:'SALE',minPrice:750000,maxPrice:9999999});expect(result.total).toBe(2);expect(result.homes).toHaveLength(1);expect(result.missingCoordinates).toBe(1);
});
it('keeps every colocated home accessible and filters only by the visible area',()=>{
 const {homes}=mapInventory(Array.from({length:350},(_,i)=>({...sampleListings[0],id:`id-${i}`})),{});
 const groups=groupMapHomes(homes,()=>true,()=>({x:50,y:50}));expect(groups).toHaveLength(1);expect(groups[0].homes).toHaveLength(350);
 expect(groupMapHomes(homes,h=>h.id==='id-349',()=>({x:50,y:50}))[0].homes[0].id).toBe('id-349');expect(groupMapHomes(homes,()=>false,()=>({x:50,y:50}))).toEqual([]);
});
