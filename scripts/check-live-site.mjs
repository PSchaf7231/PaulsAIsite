// Read-only production smoke check. Run after Vercel reports Ready:
// node scripts/check-live-site.mjs
import {chromium} from '@playwright/test';
const origin=process.env.AUDIT_SITE_URL||'https://www.pbrealestatepros.com';
const browser=await chromium.launch({headless:true,...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{}),...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--no-sandbox']}: {})});
const results=[],failures=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const started=Date.now();await page.goto(origin,{waitUntil:'domcontentloaded'});results.push(`Homepage HTML loaded in ${Date.now()-started}ms`);
 await page.getByLabel('Describe your ideal home',{exact:true}).fill('3 bedrooms in Delray Beach under 1 million');
 await page.getByRole('button',{name:'Explore with Madison'}).click();
 await page.getByRole('region',{name:'Madison search results'}).waitFor();results.push('Homepage typed search reaches Madison search results');
 const initial=await page.request.get(origin+'/api/listings?type=SALE&minPrice=750000&maxPrice=9999999&sort=price-asc');const defaults=await initial.json();if(!initial.ok()||defaults.mode!=='live'||!defaults.listings.length)throw Error('Default live inventory unavailable');if(defaults.listings.some((l,i,a)=>l.type!=='SALE'||l.price<750000||l.price>=10000000||(i&&l.price<a[i-1].price)))throw Error('Default inventory filters or sort failed');results.push('Default sale inventory and ascending prices verified');
 const search=page.getByRole('region',{name:'Tell Madison what you want — it’ll narrow these down.'});
 await search.getByRole('textbox').fill('condo in Boca Raton under 2 million');await search.getByRole('button',{name:'Ask Madison ↗'}).click();await page.getByRole('region',{name:'Madison search results'}).filter({hasText:'condo in Boca Raton'}).waitFor();results.push('Listings typed search updates the request');
 const sortResponse=page.waitForResponse(r=>r.url().includes('/api/listings?')&&r.url().includes('sort=price-asc'));
 await page.getByRole('combobox',{name:'Sort by'}).selectOption('price-asc');if(!(await sortResponse).ok())throw Error('Sort request failed');results.push('Sort requests results without a Search click');
 await page.getByRole('button',{name:'Reset',exact:true}).click();await page.waitForURL(origin+'/listings?all=1');
 for(const name of ['Community','Property type','Home style','Min price ($)','Max price ($)','Bedrooms','Bathrooms','Features','Sort by'])if(await page.getByRole('combobox',{name,exact:true}).inputValue()!=='')throw Error(`Reset retained ${name}`);
 results.push('Reset clears every filter');
 const inventoryResponse=await page.request.get(origin+'/api/listings');if(!inventoryResponse.ok())throw Error('Production inventory endpoint failed');const inventory=await inventoryResponse.json();let inventoryPage=1;let more=inventory.hasMore;while(more){const next=await page.request.get(`${origin}/api/listings?page=${++inventoryPage}`);if(!next.ok())throw Error('Inventory pagination failed');const data=await next.json();inventory.listings.push(...data.listings);more=data.hasMore;if(inventoryPage>5000)throw Error('Inventory pagination did not terminate');}if(inventory.mode!=='live')failures.push(`Inventory is ${inventory.mode}, not live`);
 const leaseResponse=page.waitForResponse(r=>r.url().includes('/api/listings?')&&r.url().includes('type=RENT'));
 await page.getByRole('combobox',{name:'Property type',exact:true}).selectOption('RENT');if(!(await leaseResponse).ok())throw Error('Lease request failed');
 if(!await page.getByRole('combobox',{name:'Max price ($ / month)',exact:true}).locator('option').allTextContents().then(x=>x.includes('$5,000 / month')))throw Error('Monthly rent options missing');results.push('For Lease uses monthly rent choices');
 const slugs=[...new Set(inventory.listings.map(l=>l.slug))];
 for(const slug of slugs){const response=await page.request.get(`${origin}/listings/${encodeURIComponent(slug)}`);if(response.status()!==200)failures.push(`${slug}: HTTP ${response.status()}`);}
 results.push(`Checked ${slugs.length} production inventory detail links`);
 const ocean=inventory.listings.find(l=>/r11140358$/i.test(l.slug));if(!ocean)failures.push('R11140358 was not in the returned inventory; its active status remains unverified');
 // Observe real requests; do not intercept or fabricate a successful Meta response.
 const pixel=await browser.newPage();const calls=[];pixel.on('request',r=>{if(r.url().includes('facebook.com/tr/'))calls.push(r.url());});
 await pixel.goto(origin,{waitUntil:'domcontentloaded'});await pixel.getByRole('button',{name:'Allow site analytics',exact:true}).click();
 try{await pixel.waitForRequest(r=>r.url().includes('facebook.com/tr/')&&new URL(r.url()).searchParams.get('id')==='733196970795080',{timeout:20000});results.push('Observed real Meta Pixel request with ID 733196970795080');}catch{if(!calls.some(url=>new URL(url).searchParams.get('id')==='733196970795080'))failures.push('No real Meta Pixel request observed after consent');}
}catch(error){failures.push(error.message);}finally{await browser.close();}
console.log(JSON.stringify({origin,passed:results,failed:failures},null,2));if(failures.length)process.exitCode=1;
