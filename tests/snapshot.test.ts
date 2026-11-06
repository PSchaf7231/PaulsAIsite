import {it,expect,vi} from 'vitest';
import {collectSnapshot} from '../src/server/listings/snapshot';
import {sampleListings} from '../src/server/listings/sample';
vi.mock('../src/server/listings/spark',()=>({fetchSpark:vi.fn()}));
it('collects every raw page including excluded records and preserves full detail photos',async()=>{
 const page=vi.fn().mockResolvedValueOnce({listings:[sampleListings[0]],rawCount:200,hasMore:true}).mockResolvedValueOnce({listings:[sampleListings[1]],rawCount:3,hasMore:false});
 const result=await collectSnapshot(page);expect(result.listings).toHaveLength(2);expect(page.mock.calls[1][1]).toMatchObject({offset:200,fullPhotos:true});
});
it('rejects a source page that cannot advance',async()=>{
 const page=vi.fn().mockResolvedValue({listings:[],rawCount:0,hasMore:true});await expect(collectSnapshot(page)).rejects.toThrow('did not advance');
});
it('reads a large inventory in parallel waves and stops at the last page',async()=>{
 const total=6600,page=vi.fn(async(_f:unknown,{offset}:{offset:number})=>{const raw=Math.max(0,Math.min(200,total-offset));return {listings:raw?[{...sampleListings[0],id:`L${offset}`}]:[],rawCount:raw,hasMore:offset+raw<total};});
 const result=await collectSnapshot(page as never);expect(result.listings).toHaveLength(33);expect(page.mock.calls.length).toBeLessThanOrEqual(36);
});
