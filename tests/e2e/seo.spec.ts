import { test,expect } from '@playwright/test';
const slugs=['delray-beach','boynton-beach','boca-raton','lake-worth-beach','west-palm-beach','jupiter','palm-beach-gardens','wellington'];
test('all eight neighborhood guides have unique metadata, local topics, FAQs and Pax',async({page})=>{
 const titles=new Set<string>(),descriptions=new Set<string>();
 for(const slug of slugs){await page.goto(`/communities/${slug}`);await expect(page.getByText(/DRAFT — For Paul/)).toHaveCount(0);await expect(page.getByText(/clearly marked fictional samples/)).toHaveCount(0);await expect(page.getByRole('heading',{name:'Schools',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'HOA and 55+ communities'})).toBeVisible();await expect(page.getByRole('heading',{name:/search with Pax/})).toHaveCount(1);titles.add(await page.title());descriptions.add((await page.locator('meta[name="description"]').getAttribute('content'))!);await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);const schema=await page.locator('script[type="application/ld+json"]').allTextContents();expect(schema.map(s=>JSON.parse(s)['@type'])).toContain('FAQPage');}
 expect(titles.size).toBe(8);expect(descriptions.size).toBe(8);
 await page.goto('/communities/lake-worth');await expect(page).toHaveURL(/\/communities\/lake-worth-beach$/);
});
test('listing SEO, share image, sitemap and robots avoid fictional offers and private URLs',async({page,request})=>{
 await page.goto('/listings/boynton-poolside');await expect(page).toHaveTitle(/Boynton Beach home for sale with pool/);await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','http://localhost:3000/listings/boynton-poolside');
 const image=await page.locator('meta[property="og:image"]').getAttribute('content');const response=await request.get(image!);expect(response.status()).toBe(200);expect(response.headers()['content-type']).toContain('image/png');expect((await response.body()).subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
 const robots=await (await request.get('/robots.txt')).text();expect(robots).toContain('Disallow: /admin/');expect(robots).toContain('Allow: /');
 const sitemapResponse=await request.get('/sitemap.xml');expect(sitemapResponse.status()).toBe(200);const sitemap=await sitemapResponse.text();expect(sitemap).toContain('/communities</loc>');expect(sitemap).not.toContain('boynton-poolside');expect(sitemap).not.toContain('/admin/');expect(sitemap).not.toContain('/communities/delray-beach');
 await expect(page.locator('meta[name="google-site-verification"]')).toHaveAttribute('content','test-verification-code');
});
test('analytics needs consent, excludes private pages and does not send query parameters',async({page})=>{
 let scripts=0;await page.route('https://www.googletagmanager.com/**',async route=>{scripts++;await route.fulfill({contentType:'text/javascript',body:'/* Local test: no real analytics requests */'});});
 await page.goto('/about?private_test=do-not-send');await expect(page.getByRole('button',{name:'Allow site analytics',exact:true})).toBeVisible();expect(scripts).toBe(0);await page.getByRole('button',{name:'Allow site analytics',exact:true}).click();await expect.poll(()=>scripts).toBe(1);
 const events=await page.evaluate(()=>JSON.stringify((window as unknown as {dataLayer:unknown[]}).dataLayer));expect(events).toContain('page_view');expect(events).not.toContain('do-not-send');
 await page.goto('/admin/leads');await expect(page.getByRole('button',{name:'Allow site analytics',exact:true})).toHaveCount(0);expect(scripts).toBe(1);
});
