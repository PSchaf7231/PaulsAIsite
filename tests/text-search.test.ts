import {it,expect} from 'vitest';
import {parseTextQuery,textQueryMatches,exactStreetMatch,houseNumberPattern,wholeWordPattern,exactStreetPattern} from '../src/lib/text-search';
import {filterListings,type Listing} from '../src/lib/listings';
import {sampleListings} from '../src/server/listings/sample';
import {basicSearchFilters} from '../src/server/listings/typed-search';
const home=(address:string,mlsNumber:string,city='Palm Beach',postalCode='33480'):Listing=>({...sampleListings[0],id:`id-${mlsNumber}`,slug:`s-${mlsNumber}`,address,mlsNumber,city,postalCode,type:'SALE',status:'ACTIVE',price:2000000});
// The live misfires: "911 N Ocean" -> 911 Ocean Drive (Juno Beach); "1491 N Ocean" -> a home whose MLS number contains 1491.
const inventory=[
 home('911 Ocean Dr Unit 601','RX-11011111','Juno Beach','33408'),
 home('3951 N Ocean Blvd Unit 302','RX-11014910','Delray Beach','33483'),
 home('9110 N Ocean Blvd','RX-11022222'),
 home('1911 N Ocean Blvd','RX-11033333'),
 home('911 Ocean Ave N','RX-11055555','Lantana','33462'),
 home('911 North Ocean Boulevard Unit 4','RX-11044444'),
 home('911 N Ocean Blvd','RX-11066666'),
 home('600 NE 5th Ave','A11934670','Delray Beach','33444'),
];
const search=(text:string)=>filterListings(inventory,{text}).map(l=>l.address);
it('parses addresses, MLS numbers and free words',()=>{
 expect(parseTextQuery('911 N Ocean')).toEqual({kind:'address',number:'911',street:['n','ocean'],locality:[]});
 expect(parseTextQuery('911 North Ocean Boulevard, Palm Beach, FL 33480')).toEqual({kind:'address',number:'911',street:['n','ocean','blvd'],locality:['palm','beach','33480']});
 expect(parseTextQuery('3951 N Ocean Blvd #302')).toEqual({kind:'address',number:'3951',street:['n','ocean','blvd','302'],locality:[]});
 expect(parseTextQuery('911 N Ocean Blvd FL 33480')).toMatchObject({street:['n','ocean','blvd'],locality:['33480']});
 expect(parseTextQuery('RX-11012345')).toEqual({kind:'mls',key:'rx11012345',digits:'11012345'});
 expect(parseTextQuery('A11934670')).toMatchObject({kind:'mls',key:'a11934670'});
 expect(parseTextQuery('11012345')).toMatchObject({kind:'mls',key:'11012345'});
 expect(parseTextQuery('1491')).toEqual({kind:'words',tokens:['1491']});
 expect(parseTextQuery('33444')).toEqual({kind:'words',tokens:['33444']});
});
it('"911 N Ocean" finds 911 N Ocean Blvd (any spelling), not 911 Ocean Drive, 9110 or 1911, exact street first',()=>{
 expect(search('911 N Ocean')).toEqual(['911 North Ocean Boulevard Unit 4','911 N Ocean Blvd','911 Ocean Ave N']);
 expect(search('911 North Ocean Boulevard')).toEqual(['911 North Ocean Boulevard Unit 4','911 N Ocean Blvd']);
 expect(search('911 N Ocean Blvd')).not.toContain('911 Ocean Dr Unit 601');
 expect(search('911 Ocean Dr')).toEqual(['911 Ocean Dr Unit 601']);
 expect(search('911 Ocean Drive Unit 601')).toEqual(['911 Ocean Dr Unit 601']);
});
it('"1491 N Ocean" never matches an MLS number containing 1491; no match means an empty result, not other homes',()=>{
 expect(search('1491 N Ocean')).toEqual([]);
 expect(search('1491')).toEqual([]);
 expect(search('3951 N Ocean Blvd #302')).toEqual(['3951 N Ocean Blvd Unit 302']);
 expect(search('3951 N Ocean Blvd, Delray Beach')).toEqual(['3951 N Ocean Blvd Unit 302']);
 expect(search('3951 N Ocean Blvd, Boca Raton')).toEqual([]);
});
it('MLS numbers match exactly',()=>{
 expect(search('RX-11014910')).toEqual(['3951 N Ocean Blvd Unit 302']);
 expect(search('rx11014910')).toEqual(['3951 N Ocean Blvd Unit 302']);
 expect(search('11014910')).toEqual(['3951 N Ocean Blvd Unit 302']);
 expect(search('A11934670')).toEqual(['600 NE 5th Ave']);
 expect(search('RX-1101491')).toEqual([]);
});
it('patterns behave the same in JavaScript as the SQL store expects (POSIX-compatible word boundaries)',()=>{
 const t=(p:string,s:string)=>new RegExp(p).test(s);
 expect(t(houseNumberPattern('911'),'911 n ocean blvd')).toBe(true);expect(t(houseNumberPattern('911'),'9110 n ocean blvd')).toBe(false);expect(t(houseNumberPattern('911'),'1911 n ocean')).toBe(false);
 expect(t(wholeWordPattern('n'),'911 north ocean')).toBe(true);expect(t(wholeWordPattern('n'),'911 ocean dr unit 601')).toBe(false);
 expect(t(exactStreetPattern({number:'911',street:['n','ocean']}),'911 n ocean blvd')).toBe(true);expect(t(exactStreetPattern({number:'911',street:['n','ocean']}),'911 ocean ave n')).toBe(false);
 expect(textQueryMatches({address:'911 N. Ocean Blvd',city:'Palm Beach',postalCode:'33480'},parseTextQuery('911 N Ocean'))).toBe(true);
});
it('typed search keeps ZIP and city searches, and splits a trailing city off an address',()=>{
 expect(basicSearchFilters('33444')).toEqual({postalCode:'33444'});
 expect(basicSearchFilters('Delray Beach')).toEqual({city:'Delray Beach'});
 expect(basicSearchFilters('Boca Raton')).toEqual({city:'Boca Raton'});
 expect(basicSearchFilters('911 N Ocean')).toEqual({text:'911 N Ocean'});
 expect(basicSearchFilters('1491 N Ocean')).toEqual({text:'1491 N Ocean'});
 expect(basicSearchFilters('911 N Ocean Blvd Palm Beach')).toEqual({text:'911 N Ocean Blvd, Palm Beach'});
 expect(basicSearchFilters('911 N Ocean Blvd West Palm Beach FL 33401')).toEqual({text:'911 N Ocean Blvd, West Palm Beach FL 33401'});
 expect(basicSearchFilters('A11934670')).toEqual({text:'A11934670'});
 expect(basicSearchFilters('11012345')).toEqual({text:'11012345'});
 expect(basicSearchFilters('3 bed house in Jupiter')).toMatchObject({city:'Jupiter',beds:3});
});
