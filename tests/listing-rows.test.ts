import {it,expect} from 'vitest';
import {toRow,withDetail,fromSummary,whereClause,orderClause,rankClause} from '../src/server/listings/rows';
import {sampleListings} from '../src/server/listings/sample';
import type {Listing} from '../src/lib/listings';
const live:Listing={...sampleListings[0],id:'spark-20250101000000000000000000',mlsNumber:'RX-11012345',slug:'911-n-ocean-blvd-palm-beach-33480-rx-11012345',address:'911 N Ocean Blvd',city:'Palm Beach',postalCode:'33480',description:'Long remarks '.repeat(50),photos:Array.from({length:30},(_,i)=>({url:`https://cdn.example.com/p${i}.jpg`,alt:`x ${i}`,position:i})),verifiedAmenities:{pool:true,waterfront:true,garage:false,'no hoa':true},isSample:false,updatedAt:'2026-11-01T00:00:00.000Z'};
it('stores a compact card summary (first photo, no remarks) and full detail separately',()=>{
 const row=toRow(live);
 expect(row.listingKey).toBe('20250101000000000000000000');expect(row.mlsKey).toBe('rx11012345');
 expect((row.summary.photos as unknown[]).length).toBe(1);expect(row.summary.description).toBe('');
 expect(row.detail.photos).toHaveLength(30);expect(row.pool&&row.waterfront&&!row.garage).toBe(true);
 expect(row.searchText).toContain('911 n ocean blvd palm beach 33480 rx-11012345');
 const restored=withDetail(fromSummary(row.summary),row.detail as never);
 expect(restored.photos).toHaveLength(30);expect(restored.photos[3]).toEqual({url:'https://cdn.example.com/p3.jpg',alt:'911 N Ocean Blvd — MLS photo 4',position:3});expect(restored.description).toBe(live.description);
});
it('stores missing beds/baths/sqft as NULL so minimum filters exclude them like before',()=>{
 const row=toRow({...live,missingFields:['beds','sqft']});expect(row.beds).toBeNull();expect(row.sqft).toBeNull();expect(row.baths).toBe(live.baths);
});
it('drops invalid coordinates instead of inventing pins',()=>{expect(toRow({...live,latitude:null}).latitude).toBeNull();expect(toRow({...live,latitude:200,longitude:-80}).longitude).toBeNull();});
it('builds parameterised SQL for every filter and never interpolates values',()=>{
 const {sql,params}=whereClause({city:"Delray Beach'; drop table x",areas:['Boca Raton'],type:'SALE',propertyType:'HOUSE',minPrice:2000000,maxPrice:5000000,beds:3,baths:2,pool:true,waterfront:true,garage:true,mustHaves:['no hoa','55+'],postalCode:'33444',text:'911 N Ocean, FL'},{north:27,south:26,east:-80,west:-81});
 expect(sql).not.toContain('drop table');expect(sql).toContain('"active"');expect(sql).toContain('"price">=$');expect(sql).toContain('"price"<=$');expect(sql).toContain(`("amenities"->>'no hoa')='true'`);
 expect(params).toEqual(expect.arrayContaining(["Delray Beach'; drop table x",['boca raton'],'SALE','HOUSE',2000000,5000000,3,2,'33444','^[^a-z0-9]*911([^a-z0-9]|$)','(^|[^a-z0-9])(n|north)([^a-z0-9]|$)','(^|[^a-z0-9])ocean([^a-z0-9]|$)',26,27,-81,-80]));
 expect(params).not.toContain('%fl%');
});
it('always restricts to active, eligible homes (sale, or rentals from $3,500/month)',()=>{expect(whereClause({}).sql).toBe(`"active" AND ("type"='SALE' OR ("type"='RENT' AND "price">=3500))`);});
it('sorts with a stable tiebreaker so pages never repeat or skip homes',()=>{expect(orderClause('price-asc')).toBe('"price" ASC, "listingKey" ASC');expect(orderClause('price-desc')).toBe('"price" DESC, "listingKey" DESC');expect(orderClause()).toContain('"listingKey"');});
it('typed addresses: house number as the leading token, street words as whole words, exact street ranked first',()=>{
 const {sql,params}=whereClause({text:'911 N Ocean'});
 expect(sql).toContain(`lower("address") ~ $1`);expect(sql).not.toContain('"searchText"');expect(sql).not.toContain('mlsKey');
 expect(params).toEqual(['^[^a-z0-9]*911([^a-z0-9]|$)','(^|[^a-z0-9])(n|north)([^a-z0-9]|$)','(^|[^a-z0-9])ocean([^a-z0-9]|$)']);
 const rank=rankClause({text:'911 N Ocean'},params.length)!;
 expect(rank.sql).toBe(`(lower("address") ~ $4) DESC`);expect(rank.params).toEqual(['^[^a-z0-9]*911[^a-z0-9]+(n|north)[^a-z0-9]+ocean([^a-z0-9]|$)']);
 expect(rankClause({city:'Jupiter'},0)).toBeUndefined();expect(rankClause({text:'RX-11012345'},0)).toBeUndefined();
 const located=whereClause({text:'600 NE 5th Ave, Delray Beach, FL 33444'});
 expect(located.params).toEqual(expect.arrayContaining(['%delray%','%beach%','%33444%']));expect(located.params).not.toContain('%fl%');
});
it('MLS numbers match the whole normalised number, never a substring',()=>{
 expect(whereClause({text:'RX-11012345'})).toEqual({sql:expect.stringContaining('"mlsKey"=$1'),params:['rx11012345']});
 expect(whereClause({text:'A11934670'}).params).toEqual(['a11934670']);
 const digits=whereClause({text:'11012345'});expect(digits.sql).toContain(`regexp_replace("mlsKey",'^[a-z]+','')=$1`);expect(digits.params).toEqual(['11012345']);
 // Short numbers in free text must be whole words, so "1491" never matches inside RX-11014910.
 const words=whereClause({text:'1491'});expect(words.sql).toContain('"searchText" ~ $1');expect(words.params).toEqual(['(^|[^a-z0-9])1491([^a-z0-9]|$)']);
});
