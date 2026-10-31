import {it,expect,vi,afterEach} from 'vitest';
import {featuredHomes} from '../src/lib/home-listings';
import {sampleListings} from '../src/server/listings/sample';
import {siteUrl} from '../src/lib/config';
import {pageMetadata} from '../src/lib/seo';
afterEach(()=>vi.unstubAllEnvs());
it('shows six active real homes newest first without mutating shared inventory or showing samples',()=>{const homes=Array.from({length:8},(_,i)=>({...sampleListings[0],id:String(i),isSample:false,listedAt:`2026-10-${String(i+1).padStart(2,'0')}T00:00:00Z`}));const input=[...homes,sampleListings[0],{...homes[0],id:'closed',status:'CLOSED',listedAt:'2026-10-30T00:00:00Z'}];expect(featuredHomes(input).map(l=>l.id)).toEqual(['7','6','5','4','3','2']);expect(input[0].id).toBe('0');});
it('defaults public canonical and social URLs to the live domain when public configuration is absent',()=>{vi.stubEnv('NEXT_PUBLIC_SITE_URL','');vi.stubEnv('SITE_URL','http://localhost:3000');expect(siteUrl()).toBe('https://www.pbrealestatepros.com');const metadata=pageMetadata('Home','Homes','/');expect(metadata.alternates?.canonical).toBe('https://www.pbrealestatepros.com/');expect(JSON.stringify(metadata.openGraph)).not.toContain('localhost');});
