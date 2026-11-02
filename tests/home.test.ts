import {it,expect,vi,afterEach} from 'vitest';
import {featuredHomes} from '../src/lib/home-listings';
import {sampleListings} from '../src/server/listings/sample';
import {siteUrl} from '../src/lib/config';
import {pageMetadata} from '../src/lib/seo';
afterEach(()=>vi.unstubAllEnvs());
it('shows six highest-priced active real single-family sales above the inclusive $2M floor',()=>{
 const homes=Array.from({length:8},(_,i)=>({...sampleListings[0],id:String(i),isSample:false,propertyType:'HOUSE',price:2000000+i*100000}));
 const input=[...homes,{...homes[0],id:'closed',status:'CLOSED',price:9000000},{...homes[0],id:'sample',isSample:true,price:9000000},{...homes[0],id:'condo',propertyType:'CONDO',price:9000000},{...homes[0],id:'unknown',propertyType:undefined,price:9000000}];
 expect(featuredHomes(input,'SALE').map(l=>l.id)).toEqual(['7','6','5','4','3','2']);expect(input[0].id).toBe('0');
 expect(featuredHomes([homes[0],{...homes[0],id:'cheap',price:1999999}],'SALE').map(l=>l.id)).toEqual(['0']);
});
it('fills lease slots with the next highest monthly rents and never mixes in sale prices',()=>{
 const rentals=Array.from({length:8},(_,i)=>({...sampleListings[3],id:String(i),isSample:false,price:3000+i*1000}));
 expect(featuredHomes([...rentals,{...sampleListings[0],isSample:false,price:50000000}],'RENT').map(l=>l.id)).toEqual(['7','6','5','4','3','2']);expect(featuredHomes(rentals.slice(0,2),'RENT')).toHaveLength(1);
});
it('defaults public canonical and social URLs to the live domain when public configuration is absent',()=>{vi.stubEnv('NEXT_PUBLIC_SITE_URL','');vi.stubEnv('SITE_URL','http://localhost:3000');expect(siteUrl()).toBe('https://www.pbrealestatepros.com');const metadata=pageMetadata('Home','Homes','/');expect(metadata.alternates?.canonical).toBe('https://www.pbrealestatepros.com/');expect(JSON.stringify(metadata.openGraph)).not.toContain('localhost');});
