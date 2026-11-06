// Runs against a real PostgreSQL database with the migrations applied: TEST_DATABASE_URL=postgres://... npx vitest run tests/listing-store.integration.test.ts
// Skipped when TEST_DATABASE_URL is not set. Never point it at production: it replaces the MlsListing table contents.
import {describe,it,expect,beforeAll,afterAll,vi} from 'vitest';
import type {Listing} from '../src/lib/listings';
const url=process.env.TEST_DATABASE_URL;
vi.mock('../src/server/listings/spark',async original=>({...await original<typeof import('../src/server/listings/spark')>(),sparkConfigured:()=>true,fetchSpark:vi.fn(async()=>({listings:[],checkedAt:'',hasMore:false,rawCount:0}))}));
const cities=['Delray Beach','Boca Raton','Palm Beach','West Palm Beach','Jupiter','Boynton Beach','Highland Beach','Wellington'];
const zips:Record<string,string>={'Delray Beach':'33444','Boca Raton':'33432','Palm Beach':'33480','West Palm Beach':'33401',Jupiter:'33458','Boynton Beach':'33435','Highland Beach':'33487',Wellington:'33414'};
export function syntheticInventory(n:number):Listing[]{
 return Array.from({length:n},(_,i)=>{
  const city=cities[i%cities.length],rent=i%9===4,price=rent?3000+(i%40)*500:250000+((i*7919)%400)*62500,key=`2025${String(i).padStart(22,'0')}`,mls=`RX-${11000000+i}`;
  const address=i===0?'911 N Ocean Blvd':i===1?'600 NE 5th Ave':i===2?'1491 N Ocean Blvd':`${100+i} Test ${['Ave','St','Way','Ct'][i%4]}`;
  const words=(v:string)=>v.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  return {id:`spark-${key}`,mlsNumber:mls,slug:`${words(address)}-${words(city)}-${zips[city]}-${words(mls)}`,title:address,address,city,postalCode:zips[city],price,beds:1+(i%6),baths:1+(i%5),sqft:900+(i%30)*120,missingFields:i%97===0?['beds']:[],
   latitude:i%50===0?null:26.3+(i%1000)/1000,longitude:-80.3+(i%700)/1000,type:rent?'RENT':'SALE',status:'ACTIVE',description:'Light-filled home with renovated kitchen, impact windows and a short walk to the beach. '.repeat(18),
   features:['Dual sinks','Kitchen island','Impact glass','Two car garage'],propertyType:['HOUSE','CONDO','TOWNHOUSE','VILLA'][i%4],verifiedAmenities:{pool:i%3===0,waterfront:i%5===0,garage:i%2===0,'no hoa':i%7===0},
   source:'BEACHESMLS',attribution:'Listing courtesy of Test Realty',office:'Test Realty',isSample:false,
   photos:Array.from({length:35},(_,p)=>({url:`https://cdn.photos.sparkplatform.com/fl/20251104${String(i).padStart(8,'0')}${String(p).padStart(4,'0')}-o.jpg`,alt:`${address} — MLS photo ${p+1}`,position:p})),
   updatedAt:new Date(Date.UTC(2026,9,1)+i*60000).toISOString(),listedAt:'2026-09-01T00:00:00.000Z'} as Listing;
 });
}
describe.skipIf(!url)('MLS row storage against PostgreSQL',()=>{
 const N=Number(process.env.TEST_INVENTORY_SIZE||13208);
 let sync:typeof import('../src/server/listings/sync'),service:typeof import('../src/server/listings/service'),store:typeof import('../src/server/listings/store');
 const timings:Record<string,number>={};
 const time=async<T,>(label:string,fn:()=>Promise<T>)=>{const t=performance.now();const r=await fn();timings[label]=Math.round(performance.now()-t);return r;};
 beforeAll(async()=>{
  process.env.DIRECT_URL=url;process.env.DATABASE_URL=url;
  sync=await import('../src/server/listings/sync');service=await import('../src/server/listings/service');store=await import('../src/server/listings/store');
  const {Client}=await import('pg');const c=new Client(url);await c.connect();await c.query('TRUNCATE "MlsListing"; DELETE FROM "MlsSyncStatus";');await c.end();
 },60000);
 afterAll(async()=>{console.table(timings);await sync?.closeSyncDatabase();await store?.closeReadDatabase();});
 it('first sync writes the whole inventory in batches well inside the time budget',async()=>{
  const inventory=syntheticInventory(N);
  const result=await time('first full sync (write only)',()=>sync.syncListings({collect:async()=>({listings:inventory,checkedAt:new Date().toISOString()})}));
  expect(result).toMatchObject({count:N,written:N,complete:true});
  const again=await time('second sync, nothing changed',()=>sync.syncListings({collect:async()=>({listings:inventory,checkedAt:new Date().toISOString()})}));
  expect(again).toMatchObject({written:0,unchanged:N,deactivated:0});
  const fewer=inventory.slice(0,N-25).map((l,i)=>i===5?{...l,price:l.price+1,updatedAt:new Date().toISOString()}:l);
  const third=await time('third sync, 1 changed + 25 removed',()=>sync.syncListings({collect:async()=>({listings:fewer,checkedAt:new Date().toISOString()})}));
  expect(third).toMatchObject({written:1,deactivated:25,complete:true});
  store.resetStoreCaches();
 },240000);
 it('filter search (/listings defaults): SALE $750K-$9.99M ascending, 24 per page, with totals',async()=>{
  const r=await time('default /listings query',()=>service.searchInventory({type:'SALE',minPrice:750000,maxPrice:9999999,sort:'price-asc'},{limit:24}));
  expect(r.mode).toBe('live');expect(r.listings).toHaveLength(24);expect(r.total).toBeGreaterThan(24);expect(r.hasMore).toBe(true);
  expect(r.listings.every((l,i,a)=>l.type==='SALE'&&l.price>=750000&&l.price<=9999999&&(!i||a[i-1].price<=l.price))).toBe(true);
  expect(r.listings[0].photos).toHaveLength(1);expect(r.listings[0].description).toBe('');
  const page2=await time('page 2',()=>service.searchInventory({type:'SALE',minPrice:750000,maxPrice:9999999,sort:'price-asc'},{limit:24,offset:24}));
  expect(new Set([...r.listings,...page2.listings].map(l=>l.id)).size).toBe(48);
  const last=await service.searchInventory({type:'SALE',minPrice:750000,maxPrice:9999999,sort:'price-asc'},{limit:24,offset:Math.floor((r.total-1)/24)*24});expect(last.hasMore).toBe(false);
 });
 it('price range $2M-$5M (dropdowns), descending',async()=>{
  const r=await time('$2M-$5M price-desc',()=>service.searchInventory({type:'SALE',minPrice:2000000,maxPrice:5000000,sort:'price-desc'},{limit:24}));
  expect(r.total).toBeGreaterThan(0);expect(r.listings.every((l,i,a)=>l.price>=2e6&&l.price<=5e6&&(!i||a[i-1].price>=l.price))).toBe(true);
 });
 it('city, beds, baths, home style and feature filters combine',async()=>{
  const r=await time('city+beds+baths+style+pool',()=>service.searchInventory({city:'Delray Beach',beds:1,baths:1,propertyType:'HOUSE',pool:true},{limit:24}));
  expect(r.total).toBeGreaterThan(0);expect(r.listings.every(l=>l.city==='Delray Beach'&&l.beds>=1&&l.baths>=1&&l.propertyType==='HOUSE'&&l.verifiedAmenities?.pool)).toBe(true);
  const rent=await service.searchInventory({type:'RENT'},{limit:500});expect(rent.listings.every(l=>l.type==='RENT'&&l.price>=3500)).toBe(true);
  const missingBeds=await service.searchInventory({beds:1},{limit:500});expect(missingBeds.listings.some(l=>l.missingFields?.includes('beds'))).toBe(false);
 });
 it('typed search: city, ZIP, street address and MLS number',async()=>{
  const {interpretSearch}=await import('../src/server/listings/typed-search');
  const cities=await store.knownCities();expect(cities).toContain('Highland Beach');
  for(const [q,expected] of [['Delray Beach',{city:'Delray Beach'}],['33444',{postalCode:'33444'}],['911 N Ocean Blvd',{text:'911 N Ocean Blvd'}],['Highland Beach townhouse',{city:'Highland Beach',propertyType:'TOWNHOUSE'}]] as const){
   const {filters}=await interpretSearch(q,cities);expect(filters).toMatchObject(expected);
   const r=await time(`typed "${q}"`,()=>service.searchInventory(filters,{limit:24}));expect(r.total,`${q} ${JSON.stringify(filters)}`).toBeGreaterThan(0);
  }
  const address=await service.searchInventory({text:'911 N Ocean Blvd, Delray Beach, FL 33444'},{limit:24});expect(address.listings.map(l=>l.address)).toContain('911 N Ocean Blvd');
  const mls=await service.searchInventory({text:'RX-11000001'},{limit:24});expect(mls.listings[0].address).toBe('600 NE 5th Ave');
  const zip=await service.searchInventory({postalCode:'33444'},{limit:500});expect(zip.listings.every(l=>l.postalCode==='33444')).toBe(true);
 });
 it('map endpoint data: lightweight pins for every match, or only those inside bounds',async()=>{
  const all=await time('map all matches (defaults)',()=>service.mapListings({type:'SALE',minPrice:750000,maxPrice:9999999}));
  expect(all.homes.length+all.missingCoordinates).toBe(all.total);expect(Object.keys(all.homes[0]).sort()).toEqual(['address','city','id','isSample','latitude','longitude','price','slug','type']);
  const box=await time('map in bounds',()=>service.mapListings({type:'SALE'},{north:26.5,south:26.4,east:-80.0,west:-80.3}));
  expect(box.homes.length).toBeGreaterThan(0);expect(box.homes.every(h=>h.latitude>=26.4&&h.latitude<=26.5&&h.longitude>=-80.3&&h.longitude<=-80)).toBe(true);
  timings['map pins JSON bytes (defaults)']=JSON.stringify(all).length;
 });
 it('detail lookup reads one row with every photo, redirects stale slugs and 404s removed homes',async()=>{
  const inv=syntheticInventory(3);
  for(const l of inv){const found=await time(`detail ${l.address}`,()=>service.getListing(l.slug));expect(found?.address).toBe(l.address);expect(found?.photos).toHaveLength(35);expect(found?.description.length).toBeGreaterThan(100);}
  const renamed=await service.getListing('old-address-palm-beach-33480-rx-11000000');expect(renamed?.slug).toBe(inv[0].slug);
  const removed=syntheticInventory(N).at(-1)!;expect(await service.getListing(removed.slug)).toBeNull();
 });
 it('falls back to a live Spark lookup by MLS number when the row is missing',async()=>{
  const spark=await import('../src/server/listings/spark');const one=syntheticInventory(N+1).at(-1)!;
  vi.mocked(spark.fetchSpark).mockResolvedValueOnce({listings:[one],checkedAt:'',hasMore:false,rawCount:1});
  expect((await service.getListing(one.slug))?.mlsNumber).toBe(one.mlsNumber);expect(vi.mocked(spark.fetchSpark).mock.calls.at(-1)?.[1]).toMatchObject({listingId:`rx-${11000000+N}`});
 });
 it('row sizes stay small for card queries',async()=>{
  const {Client}=await import('pg');const c=new Client(url);await c.connect();
  const {rows}=await c.query(`SELECT avg(pg_column_size("summary"))::int AS summary, avg(pg_column_size("detail"))::int AS detail, avg(length("summary"::text))::int AS summary_text, avg(length("detail"::text))::int AS detail_text FROM "MlsListing"`);await c.end();
  Object.assign(timings,{'avg summary bytes (stored)':rows[0].summary,'avg detail bytes (stored)':rows[0].detail,'avg summary JSON chars':rows[0].summary_text,'avg detail JSON chars':rows[0].detail_text});
  expect(rows[0].summary_text).toBeLessThan(2500);
 });
});
