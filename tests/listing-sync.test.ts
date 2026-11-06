import {it,expect,vi,afterEach} from 'vitest';
import {syncListings,upsertStatement,BATCH_SIZE} from '../src/server/listings/sync';
import {toRow} from '../src/server/listings/rows';
import {sampleListings} from '../src/server/listings/sample';
import type {Listing} from '../src/lib/listings';
const {query,release}=vi.hoisted(()=>({query:vi.fn(),release:vi.fn()}));
vi.mock('pg',()=>({Pool:class {query=query;connect=async()=>({query,release});end=async()=>undefined;}}));
vi.mock('../src/server/listings/spark',()=>({fetchSpark:vi.fn()}));
afterEach(()=>{query.mockReset();release.mockReset();});
const home=(i:number,updated='2026-11-01T00:00:00.000Z'):Listing=>({...sampleListings[0],id:`spark-K${i}`,mlsNumber:`RX-${10000000+i}`,slug:`home-${i}`,isSample:false,updatedAt:updated});
function db(existing:{listingKey:string;sourceUpdatedAt:string;active:boolean}[]=[]){
 query.mockImplementation(async(sql:string)=>{
  if(sql.includes('pg_try_advisory_lock'))return {rows:[{locked:true}]};
  if(sql.startsWith('SELECT "listingKey", "sourceUpdatedAt"'))return {rows:existing};
  if(sql.includes('count(*)'))return {rows:[{n:1000}]};
  if(sql.startsWith('UPDATE "MlsListing" SET "active"=false'))return {rowCount:2,rows:[]};
  return {rows:[],rowCount:0};
 });
}
const writes=()=>query.mock.calls.filter(([sql])=>String(sql).startsWith('INSERT INTO "MlsListing"'));
it('writes new listings in batches of 250 rows and records a complete sync',async()=>{
 db();const listings=Array.from({length:1001},(_,i)=>home(i));
 const result=await syncListings({collect:async()=>({listings,checkedAt:'2026-11-06T00:00:00.000Z'})});
 expect(result).toMatchObject({count:1001,written:1001,remaining:0,complete:true,deactivated:2});
 expect(writes()).toHaveLength(Math.ceil(1001/BATCH_SIZE));expect(writes()[0][1][0]).toHaveLength(BATCH_SIZE);
 const status=query.mock.calls.find(([sql])=>String(sql).startsWith('INSERT INTO "MlsSyncStatus"'));expect(status?.[0]).toContain('"lastCompleteAt"');
 expect(query.mock.calls.at(-1)?.[0]).toContain('pg_advisory_unlock');expect(release).toHaveBeenCalled();
});
it('re-sends only new or modified listings; unchanged ones are only marked as seen',async()=>{
 db([{listingKey:'K0',sourceUpdatedAt:'2026-11-01T00:00:00.000Z',active:true},{listingKey:'K1',sourceUpdatedAt:'2026-10-01T00:00:00.000Z',active:true}]);
 const result=await syncListings({collect:async()=>({listings:[home(0),home(1),home(2)],checkedAt:'2026-11-06T00:00:00.000Z'})});
 expect(result).toMatchObject({written:2,unchanged:1});expect(writes()[0][1][0]).toEqual(['K1','K2']);
 const seen=query.mock.calls.find(([sql])=>String(sql).startsWith('UPDATE "MlsListing" SET "lastSeenAt"'));expect(seen?.[1][0]).toEqual(['K0']);
});
it('stops at the time budget without deactivating anything, so the next run resumes',async()=>{
 db();let t=0;const listings=Array.from({length:1000},(_,i)=>home(i));
 const result=await syncListings({budgetMs:1000,now:()=>(t+=300),collect:async()=>({listings,checkedAt:'2026-11-06T00:00:00.000Z'})});
 expect(result.complete).toBe(false);expect(result.remaining).toBeGreaterThan(0);
 expect(query.mock.calls.some(([sql])=>String(sql).includes('"active"=false'))).toBe(false);
});
it('keeps existing rows when the MLS download fails and records the error',async()=>{
 db();await expect(syncListings({collect:async()=>{throw new Error('Spark request failed (500).');}})).rejects.toThrow('500');
 expect(writes()).toHaveLength(0);expect(query.mock.calls.some(([sql])=>String(sql).includes('"active"=false'))).toBe(false);
 const status=query.mock.calls.find(([sql])=>String(sql).startsWith('INSERT INTO "MlsSyncStatus"'));expect(status?.[1]).toContain('Spark request failed (500).');
});
it('refuses to deactivate the inventory after an implausibly small pull',async()=>{
 db(Array.from({length:100},(_,i)=>({listingKey:`K${i}`,sourceUpdatedAt:'2026-11-01T00:00:00.000Z',active:true})));
 const result=await syncListings({collect:async()=>({listings:[home(500)],checkedAt:'2026-11-06T00:00:00.000Z'})});
 expect(result.deactivated).toBe(0);expect(query.mock.calls.some(([sql])=>String(sql).includes('"active"=false'))).toBe(false);
});
it('skips when another refresh holds the lock',async()=>{query.mockResolvedValue({rows:[{locked:false}]});expect(await syncListings({collect:async()=>({listings:[],checkedAt:''})})).toMatchObject({skipped:true});});
it('uses a fixed number of array parameters per batch statement',()=>{const s=upsertStatement([toRow(home(1)),toRow(home(2))],'2026-11-06T00:00:00.000Z');expect(s.params).toHaveLength(25);expect(s.sql).toContain('ON CONFLICT ("listingKey")');});
