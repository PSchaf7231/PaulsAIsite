import {it,expect,vi,afterEach} from 'vitest';
import {collectSnapshot,readSnapshot,refreshSnapshot} from '../src/server/listings/snapshot';
import {sampleListings} from '../src/server/listings/sample';
const {query,release,fetchPage}=vi.hoisted(()=>({query:vi.fn(),release:vi.fn(),fetchPage:vi.fn()}));
vi.mock('pg',()=>({Pool:class {query=query;connect=async()=>({query,release});}}));
vi.mock('../src/server/listings/spark',()=>({fetchSpark:fetchPage}));
afterEach(()=>{query.mockReset();fetchPage.mockReset();});
it('collects every raw page including excluded records and preserves full detail photos',async()=>{
 const page=vi.fn().mockResolvedValueOnce({listings:[sampleListings[0]],rawCount:200,hasMore:true}).mockResolvedValueOnce({listings:[sampleListings[1]],rawCount:3,hasMore:false});
 const result=await collectSnapshot(page);expect(result.listings).toHaveLength(2);expect(page.mock.calls[1][1]).toMatchObject({offset:200,fullPhotos:true});
});
it('never publishes a partial snapshot when a later source page fails',async()=>{
 query.mockResolvedValue({rows:[{locked:true}]});fetchPage.mockResolvedValueOnce({listings:[sampleListings[0]],rawCount:200,hasMore:true}).mockRejectedValueOnce(new Error('MLS offline'));
 await expect(refreshSnapshot()).rejects.toThrow('MLS offline');expect(query.mock.calls.some(([sql])=>sql.startsWith('INSERT'))).toBe(false);expect(query.mock.calls.at(-1)?.[0]).toContain('pg_advisory_unlock');expect(release).toHaveBeenCalled();
});
it('publishes the entire snapshot in a single atomic upsert',async()=>{
 query.mockResolvedValue({rows:[{locked:true}]});fetchPage.mockResolvedValue({listings:sampleListings,rawCount:5,hasMore:false});
 expect(await refreshSnapshot()).toMatchObject({count:5});const writes=query.mock.calls.filter(([sql])=>sql.startsWith('INSERT'));expect(writes).toHaveLength(1);expect(JSON.parse(writes[0][1][0])).toHaveLength(5);
});
it('rejects a missing or stale snapshot instead of showing old or fabricated inventory',async()=>{
 query.mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[{listings:sampleListings,checkedAt:'2020-01-01'}]});
 await expect(readSnapshot()).rejects.toThrow('successful refresh');await expect(readSnapshot()).rejects.toThrow('successful refresh');
});
it('rejects a source page that cannot advance',async()=>{
 const page=vi.fn().mockResolvedValue({listings:[],rawCount:0,hasMore:true});await expect(collectSnapshot(page)).rejects.toThrow('did not advance');
});
it('reads a large inventory in parallel waves and stops at the last page',async()=>{
 const total=6600,page=vi.fn(async(_f:unknown,{offset}:{offset:number})=>{const raw=Math.max(0,Math.min(200,total-offset));return {listings:raw?[{...sampleListings[0],id:`L${offset}`}]:[],rawCount:raw,hasMore:offset+raw<total};});
 const result=await collectSnapshot(page as never);expect(result.listings).toHaveLength(33);expect(page.mock.calls.length).toBeLessThanOrEqual(36);
});
