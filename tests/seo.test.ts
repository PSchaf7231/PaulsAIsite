import { it,expect,vi,afterEach } from 'vitest';
import { pageMetadata,listingMetadata,listingSchema,agentSchema,faqSchema,jsonLd } from '../src/lib/seo';
import { communities,communityFaqs } from '../src/lib/communities';
import { sampleListings } from '../src/server/listings/sample';
afterEach(()=>vi.unstubAllEnvs());
it('has eight distinct reviewable neighborhood drafts with visible FAQ content',()=>{
 expect(communities).toHaveLength(8);expect(new Set(communities.map(c=>c.slug)).size).toBe(8);expect(communities.find(c=>c.slug==='lake-worth-beach')?.name).toBe('Lake Worth Beach');
 for(const c of communities){expect(c.reviewed).toBe(false);expect(c.beaches.length).toBeGreaterThan(60);expect(c.schools).toContain('exact street address');const f=communityFaqs(c);expect(faqSchema(f).mainEntity.map(q=>q.acceptedAnswer.text)).toEqual(f.map(a=>a.answer));}
});
it('keeps sample offers out of listing schema and noindexes samples even when public indexing is enabled',()=>{
 vi.stubEnv('SEO_INDEXING_ENABLED','true');vi.stubEnv('NEXT_PUBLIC_SITE_URL','https://example.com');
 const metadata=sampleListings.map(listingMetadata);expect(new Set(metadata.map(m=>m.title)).size).toBe(5);expect(new Set(metadata.map(m=>m.description)).size).toBe(5);
 for(const l of sampleListings){expect(listingMetadata(l).robots).toMatchObject({index:false});expect(listingSchema(l)).not.toHaveProperty('offers');}
 expect(String(listingMetadata(sampleListings[2]).title)).toContain('with pool');expect(listingSchema({...sampleListings[0],isSample:false})).toHaveProperty('offers.price',585000);
});
it('generates canonical/social URLs, safe JSON-LD and factual agent identity without brokerage claims',()=>{
 vi.stubEnv('NEXT_PUBLIC_SITE_URL','https://example.com');vi.stubEnv('SEO_INDEXING_ENABLED','false');const m=pageMetadata('Delray Beach homes','Local guide','/communities/delray-beach');expect(m.alternates?.canonical).toBe('https://example.com/communities/delray-beach');expect(m.openGraph).toMatchObject({url:'https://example.com/communities/delray-beach'});expect(m.robots).toMatchObject({index:false});expect(jsonLd({text:'</script>'})).not.toContain('<');expect(agentSchema()).toMatchObject({'@type':'RealEstateAgent',name:'Paul Schafranick'});expect(agentSchema()).not.toHaveProperty('address');
});
