import {it,expect} from 'vitest';
import {mapInventory,groupMapHomes,mapPayload,toPinTuple,fromPinTuples,padBounds,viewIsCovered,MAP_PIN_CAP} from '../src/lib/map-inventory';
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
it('returns only pins inside the requested bounds, capped, with the in-area count and no extent',()=>{
 const rows=Array.from({length:3000},(_,i)=>({...sampleListings[0],id:`id-${i}`,slug:`home-${i}`,latitude:26+(i%100)/100,longitude:-80.5+(i%50)/100}));
 const all=mapInventory(rows,{});
 const box={north:26.495,south:26,east:-80.255,west:-80.5};
 const inBox=all.homes.filter(h=>h.latitude<=26.495&&h.longitude<=-80.255).length;
 const r=mapPayload(all,box);expect(r.inView).toBe(inBox);expect(r.pins).toHaveLength(Math.min(inBox,MAP_PIN_CAP));expect(r.extent).toBeNull();
 expect(fromPinTuples(r.pins).every(h=>h.latitude>=26&&h.latitude<=26.495&&h.longitude>=-80.5&&h.longitude<=-80.255)).toBe(true);
 const unbounded=mapPayload(all);expect(unbounded.pins).toHaveLength(MAP_PIN_CAP);expect(unbounded.truncated).toBe(true);expect(unbounded.inView).toBe(3000);expect(unbounded.total).toBe(3000);
 expect(unbounded.extent).toEqual({north:26.99,south:26,east:-80.01,west:-80.5});
 const small=mapPayload(all,box,100);expect(small.pins).toHaveLength(100);expect(small.truncated).toBe(inBox>100);
});
it('slims each pin to the fields the marker and popup show and keeps the payload small',()=>{
 const pin=toPinTuple({slug:'911-n-ocean-blvd-palm-beach-33480-rx-11012345',address:'911 N Ocean Blvd',city:'Palm Beach',price:2450000,type:'SALE',latitude:26.7123456789,longitude:-80.0398765432});
 expect(pin).toEqual(['911-n-ocean-blvd-palm-beach-33480-rx-11012345','911 N Ocean Blvd','Palm Beach',2450000,26.71235,-80.03988]);
 expect(toPinTuple({slug:'r',address:'a',city:'c',price:5000,type:'RENT',latitude:1,longitude:2})).toEqual(['r','a','c',5000,1,2,1]);
 expect(fromPinTuples([pin,['r','a','c',5000,1,2,1]],false)).toEqual([{id:pin[0],slug:pin[0],address:'911 N Ocean Blvd',city:'Palm Beach',price:2450000,latitude:26.71235,longitude:-80.03988,type:'SALE',isSample:false},{id:'r',slug:'r',address:'a',city:'c',price:5000,latitude:1,longitude:2,type:'RENT',isSample:false}]);
 // A full capped response with realistic slugs/addresses stays far under 300 KB (was ~3.3 MB for every match).
 const pins=Array.from({length:MAP_PIN_CAP},(_,i)=>toPinTuple({slug:`${1000+i}-south-ocean-boulevard-unit-${i}-highland-beach-33487-rx-${11000000+i}`,address:`${1000+i} S Ocean Blvd Unit ${i}`,city:'Highland Beach',price:1250000+i,type:'SALE',latitude:26.3+i/1e4,longitude:-80.06-i/1e4}));
 expect(JSON.stringify({pins,total:13208,missingCoordinates:12,inView:9000,truncated:true,cap:MAP_PIN_CAP,extent:null,mode:'live',checkedAt:new Date().toISOString()}).length).toBeLessThan(300_000);
});
it('refetches only when the view leaves the loaded area, or zooms into a capped area',()=>{
 const loaded=padBounds({north:26.8,south:26.6,east:-80,west:-80.2});
 expect(loaded.north).toBeCloseTo(26.85);expect(loaded.west).toBeCloseTo(-80.25);
 const inside={north:26.81,south:26.6,east:-80.01,west:-80.21},outside={north:27,south:26.9,east:-80,west:-80.2};
 expect(viewIsCovered({bounds:loaded,truncated:false,zoom:11},inside,12)).toBe(true);
 expect(viewIsCovered({bounds:loaded,truncated:false,zoom:11},outside,11)).toBe(false);
 expect(viewIsCovered({bounds:loaded,truncated:true,zoom:11},inside,11)).toBe(true);
 expect(viewIsCovered({bounds:loaded,truncated:true,zoom:11},inside,12)).toBe(false);
 expect(viewIsCovered({bounds:null,truncated:false,zoom:null},outside,9)).toBe(true);
 expect(viewIsCovered({bounds:null,truncated:true,zoom:null},outside,9)).toBe(false);
 expect(padBounds({north:89,south:-89,east:179,west:-179})).toEqual({north:90,south:-90,east:180,west:-180});
});
