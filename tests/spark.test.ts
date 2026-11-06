import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {mapSpark,sparkFilter,fetchSpark,sparkToken,sparkCount} from '../src/server/listings/spark';
import {searchInventory,getListing} from '../src/server/listings/service';
import {queryInventory} from '../src/server/pax/inventory';
import {newState} from '../src/server/pax/state';
import {aiReferral} from '../src/lib/ai-referral';
import {siteUrl} from '../src/lib/config';
import {filterListings,type Listing} from '../src/lib/listings';
// In-memory stand-in for the MlsListing table: same filter semantics, and records whether the database was read.
const {readSnapshot,store}=vi.hoisted(()=>({readSnapshot:vi.fn(),store:{} as Record<string,unknown>}));
vi.mock('../src/server/listings/store',()=>store);
beforeEach(()=>{readSnapshot.mockReset();
 const rows=async()=>(await readSnapshot()) as {listings:Listing[];checkedAt:string};
 Object.assign(store,{
  storeStatus:async()=>{const r=await rows();return {rows:r.listings.length||1,checkedAt:new Date().toISOString(),lastCompleteAt:null};},
  storeIsFresh:()=>true,
  searchStore:async(f:object,{limit,offset}:{limit:number;offset:number})=>{const m=filterListings((await rows()).listings,f);return {listings:m.slice(offset,offset+limit),total:m.length};},
  listingByMls:async(id:string)=>(await rows()).listings.find(l=>(l.mlsNumber||'').toLowerCase().replace(/[^a-z0-9]/g,'')===id.toLowerCase().replace(/[^a-z0-9]/g,''))||null,
  mapStore:async()=>({homes:[],total:0,missingCoordinates:0}),knownCities:async()=>[],resetStoreCaches:()=>undefined
 });
});
const record={ListingKey:'integration1',ListingId:'RX-1234567',StandardStatus:'Active',CountyOrParish:'Palm Beach',StreetNumber:'123',StreetName:'Integration',StreetSuffix:'Way',City:'Delray Beach',PostalCode:'33444',ListPrice:450000,BedroomsTotal:3,BathroomsTotalInteger:2,LivingArea:1700,ListOfficeName:'Test Office (fixture)',ModificationTimestamp:'2026-10-29T12:00:00Z',PropertyType:'Residential',PropertySubType:'Single Family Residence',PublicRemarks:'Test fixture, not an actual listing.',Latitude:26.4,Longitude:-80.1,PoolPrivateYN:true,AssociationYN:false,Media:[{MediaURL:'https://cdn.photos.sparkplatform.com/test.jpg',MediaCategory:'Photo',Order:1}],InternetEntireListingDisplayYN:true,InternetAddressDisplayYN:true};
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
it('maps actual fields, address/MLS slugs, office and timestamps without invented photos',()=>{
 const l=mapSpark(record,'2026-10-30T00:00:00Z')!;expect(l.slug).toBe('123-integration-way-delray-beach-33444-rx-1234567');expect(l.isSample).toBe(false);expect(l.attribution).toBe('Listing courtesy of Test Office (fixture)');expect(l.photos).toHaveLength(1);expect(l.verifiedAmenities).toMatchObject({'private pool':true,'no hoa':true});expect(mapSpark({...record,Media:[],Latitude:null},'now')?.photos).toEqual([]);expect(mapSpark({...record,Latitude:null},'now')?.latitude).toBeNull();
 for(const patch of [{InternetEntireListingDisplayYN:false},{InternetAddressDisplayYN:false},{ListOfficeName:''},{StandardStatus:'Closed'},{CountyOrParish:'Broward'},{ModificationTimestamp:'bad'}])expect(mapSpark({...record,...patch},'now')).toBeNull();
});
it('keeps unknown measurements unknown and separates rentals from sale records',()=>{
 const l=mapSpark({...record,PropertyType:'Residential Lease',ListPrice:3500,LivingArea:undefined},'now')!;expect(l.type).toBe('RENT');expect(l.missingFields).toContain('sqft');expect(sparkFilter({type:'RENT',maxPrice:3500})).toContain("Residential Lease");expect(sparkFilter({type:'SALE'})).not.toContain('500000');expect(sparkFilter({city:"O'Brien",mustHaves:['private pool']})).toContain("'O''Brien'");expect(sparkFilter({mustHaves:['private pool']})).toContain('PoolPrivateYN eq true');
});
it('uses the server bearer header, expands Media and follows even a short next page',async()=>{
 vi.stubEnv('SPARK_ACCESS_TOKEN','test-primary');const next='https://replication.sparkapi.com/Version/3/Reso/OData/Property?$skip=1';
 const fetcher=vi.fn().mockResolvedValueOnce(Response.json({value:[record],'@odata.nextLink':next})).mockResolvedValueOnce(Response.json({value:[{...record,ListingKey:'integration2',ListingId:'RX-7654321'}]}));
 const data=await fetchSpark({}, {},fetcher);expect(data.listings).toHaveLength(2);expect(fetcher).toHaveBeenCalledTimes(2);const url=new URL(fetcher.mock.calls[0][0]);expect(url.searchParams.get('$expand')).toBe('Media');expect(url.searchParams.get('$select')).toBeNull();expect(url.href).not.toContain('test-primary');expect(fetcher.mock.calls[0][1].headers.Authorization).toBe('Bearer test-primary');expect(fetcher.mock.calls[0][1].redirect).toBe('error');
});
it('never sends a bearer token to an off-origin pagination URL',async()=>{
 vi.stubEnv('SPARK_ACCESS_TOKEN','test-pagination');const fetcher=vi.fn().mockResolvedValue(Response.json({value:[record],'@odata.nextLink':'https://unrelated.example/Property'}));await expect(fetchSpark({}, {},fetcher)).rejects.toThrow('Invalid Spark pagination');expect(fetcher).toHaveBeenCalledTimes(1);
});
it('does not mask zero matches or failed live requests with sample records',async()=>{
 readSnapshot.mockResolvedValue({listings:[],checkedAt:'2026-11-05T00:00:00Z'});vi.stubEnv('SPARK_ACCESS_TOKEN','test-zero');vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({value:[]})));expect(await searchInventory()).toMatchObject({mode:'live',listings:[]});
 readSnapshot.mockRejectedValue(new Error('Snapshot unavailable'));vi.stubEnv('SPARK_ACCESS_TOKEN','test-error');vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('',{status:401})));expect(await searchInventory()).toMatchObject({mode:'unavailable',listings:[]});
 vi.stubEnv('SPARK_ACCESS_TOKEN','');vi.stubEnv('SPARK_API_TOKEN','');expect((await searchInventory()).listings).toHaveLength(3);
});
it('shares filtering between the public inventory function and Pax',async()=>{
 readSnapshot.mockResolvedValue({listings:[mapSpark(record,'now')!],checkedAt:'now'});vi.stubEnv('SPARK_ACCESS_TOKEN','test-shared');vi.stubGlobal('fetch',vi.fn().mockImplementation(()=>Promise.resolve(Response.json({value:[record]}))));
 const filtered=await searchInventory({city:'Delray Beach',maxPrice:600000,beds:3});const state=newState('test');state.preferences={area:'Delray Beach',maxPrice:600000,beds:3};await queryInventory(state);expect(state.results).toEqual(filtered.listings.map(l=>l.slug));expect(state.listingRecords?.every(l=>!l.isSample)).toBe(true);expect(state.feedMode).toBe('live');
});
it('looks up a detail URL by its MLS number and never returns an invalid path',async()=>{
 readSnapshot.mockResolvedValue({listings:[mapSpark(record,'now')!],checkedAt:'now'});vi.stubEnv('SPARK_ACCESS_TOKEN','test-detail');const fetcher=vi.fn().mockResolvedValue(Response.json({value:[record]}));vi.stubGlobal('fetch',fetcher);const l=await getListing('123-integration-way-delray-beach-33444-rx-1234567');expect(l?.mlsNumber).toBe('RX-1234567');expect(fetcher).not.toHaveBeenCalled();expect(await getListing('../../outside')).toBeNull();
});
it('supports the Hobson token name and sitemap count without exposing secrets',async()=>{
 vi.stubEnv('SPARK_ACCESS_TOKEN','');vi.stubEnv('SPARK_API_TOKEN','test-hobson');expect(sparkToken()).toBe('test-hobson');vi.stubEnv('SPARK_ACCESS_TOKEN','test-primary');expect(sparkToken()).toBe('test-primary');const fetcher=vi.fn().mockResolvedValue(Response.json({'@odata.count':12345,value:[]}));expect(await sparkCount(fetcher)).toBe(12345);expect(new URL(String(fetcher.mock.calls[0][0])).searchParams.get('$count')).toBe('true');
});
it('falls back to the approved IDX key when an older Spark token is rejected',async()=>{
 vi.stubEnv('SPARK_ACCESS_TOKEN','expired-token');vi.stubEnv('SPARK_API_TOKEN','');vi.stubEnv('API_IDX_KEY','approved-token');
 const fetcher=vi.fn().mockResolvedValueOnce(new Response('',{status:401})).mockResolvedValueOnce(Response.json({value:[record]}));
 const data=await fetchSpark({}, {limit:1},fetcher);expect(data.listings).toHaveLength(1);expect(fetcher).toHaveBeenCalledTimes(2);expect(fetcher.mock.calls[0][1].headers.Authorization).toBe('Bearer expired-token');expect(fetcher.mock.calls[1][1].headers.Authorization).toBe('Bearer approved-token');
});
it('recognizes AI referrals without sending query text or trusting lookalike domains',()=>{
 expect(aiReferral('https://chatgpt.com/c/private','?secret=do-not-send')).toBe('ChatGPT');expect(aiReferral('','?utm_source=perplexity&query=private')).toBe('Perplexity');expect(aiReferral('https://chatgpt.com.evil.example/','')).toBeNull();expect(aiReferral('https://google.com/','')).toBeNull();
});
it('uses NEXT_PUBLIC_SITE_URL ahead of legacy localhost configuration',()=>{vi.stubEnv('NEXT_PUBLIC_SITE_URL','https://homes.example.com/');vi.stubEnv('SITE_URL','http://localhost:3000');expect(siteUrl()).toBe('https://homes.example.com');});

it('sorts at the provider before limiting results and caps card photos while keeping detail photos',async()=>{
 vi.stubEnv('SPARK_ACCESS_TOKEN','test-ordering');const raw={...record,Media:[...record.Media,...record.Media.map(m=>({...m,Order:2}))]};const fetcher=vi.fn().mockImplementation(()=>Promise.resolve(Response.json({value:[raw]})));const cards=await fetchSpark({sort:'price-asc'},{limit:1},fetcher);expect(new URL(fetcher.mock.calls[0][0]).searchParams.get('$orderby')).toBe('ListPrice asc,ListingKey asc');expect(cards.listings[0].photos).toHaveLength(1);const detail=await fetchSpark({}, {listingId:'RX-1234567'},fetcher);expect(detail.listings[0].photos).toHaveLength(2);
});
it('keeps commercial leases out of residential monthly-rent results',()=>{
 expect(sparkFilter({type:'RENT'})).toContain("PropertyType eq 'Residential Lease'");
 expect(sparkFilter({type:'RENT'})).not.toContain('Commercial Lease');
 expect(mapSpark({...record,PropertyType:'Commercial Lease',ListPrice:35},'2026-11-02T00:00:00Z')).toBeNull();
});

it('excludes commercial and below-floor rentals from every feed including direct lookup',()=>{
 for(const PropertyType of ['Commercial Sale','Commercial Lease'])expect(mapSpark({...record,PropertyType},'now')).toBeNull();
 expect(mapSpark({...record,PropertyType:'Residential Lease',ListPrice:3499},'now')).toBeNull();
 expect(mapSpark({...record,PropertyType:'Residential Lease',ListPrice:3500},'now')?.price).toBe(3500);
 expect(sparkFilter()).toContain("ListPrice ge 3500");
});
it('round-trips Ocean Blvd and every generated detail slug, including ZIP+4 and hyphenated MLS IDs',async()=>{
 vi.stubEnv('SPARK_ACCESS_TOKEN','test-round-trip');
 for(const [id,zip] of [['R11140358','33480'],['R11140358','33480-1234'],['RX-1234567','33444']]){
  vi.stubEnv('SPARK_ACCESS_TOKEN',`test-round-trip-${id}-${zip}`);
  const raw={...record,StreetNumber:'1491',StreetDirPrefix:'N',StreetName:'Ocean',StreetSuffix:'Blvd',ListingId:id,PostalCode:zip};
  const mapped=mapSpark(raw,'2026-11-05T00:00:00Z')!;readSnapshot.mockResolvedValue({listings:[mapped],checkedAt:'now'});
  const fetcher=vi.fn().mockResolvedValue(Response.json({value:[raw]}));vi.stubGlobal('fetch',fetcher);
  expect((await getListing(mapped.slug))?.mlsNumber).toBe(id);
  expect(fetcher).not.toHaveBeenCalled();
 }
});
it('does not turn a provider outage into a property-not-found result',async()=>{
 readSnapshot.mockRejectedValue(new Error('Snapshot unavailable'));vi.stubEnv('SPARK_ACCESS_TOKEN','test-detail-failure');vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('',{status:503})));
 await expect(getListing('1491-n-ocean-blvd-palm-beach-33480-r11140358')).rejects.toThrow('Snapshot unavailable');
});

it('sorts the whole cached inventory before pagination and never calls MLS on a visitor read',async()=>{
 vi.stubEnv('SPARK_ACCESS_TOKEN','fixture');const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 const base=mapSpark(record,'now')!;const listings=Array.from({length:900},(_,i)=>({...base,id:`row-${i}`,price:750000+i*1000}));readSnapshot.mockResolvedValue({listings,checkedAt:'now'});
 const result=await searchInventory({sort:'price-desc'},{limit:24,offset:24});expect(result.total).toBe(900);expect(result.listings).toHaveLength(24);expect(result.listings[0].price).toBe(1625000);expect(result.hasMore).toBe(true);expect(fetcher).not.toHaveBeenCalled();
});
it('falls back to one live Spark lookup by MLS number when the row is missing, instead of an error page',async()=>{
 readSnapshot.mockResolvedValue({listings:[],checkedAt:'now'});vi.stubEnv('SPARK_ACCESS_TOKEN','test-fallback');
 const fetcher=vi.fn().mockResolvedValue(Response.json({value:[record]}));vi.stubGlobal('fetch',fetcher);
 expect((await getListing('123-integration-way-delray-beach-33444-rx-1234567'))?.mlsNumber).toBe('RX-1234567');
 expect(fetcher).toHaveBeenCalledTimes(1);expect(new URL(String(fetcher.mock.calls[0][0])).searchParams.get('$filter')).toContain("ListingId eq 'RX-1234567'");
});
it('serves a detail page from Spark when the database is unreachable',async()=>{
 readSnapshot.mockRejectedValue(new Error('db down'));vi.stubEnv('SPARK_ACCESS_TOKEN','test-db-down');vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({value:[record]})));
 expect((await getListing('123-integration-way-delray-beach-33444-rx-1234567'))?.address).toBe('123 Integration Way');
});
