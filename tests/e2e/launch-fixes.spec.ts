import {test,expect} from '@playwright/test';
import samples from '../../src/lib/sample-listings.json';
test.beforeEach(async({page})=>{
 await page.route('**/_next/image?*',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"/>'}));
});
function searchBox(page:import('@playwright/test').Page){return page.getByRole('region',{name:'Tell Madison what you want — it’ll narrow these down.'}).getByRole('textbox');}
test('home and listings typed searches produce property results',async({page})=>{
 await page.goto('/');await page.getByLabel('Describe your ideal home',{exact:true}).fill('3 bedrooms in Delray Beach under 600k');await page.getByRole('button',{name:'Explore with Madison'}).click();
 await expect(page).toHaveURL(/\/listings\?q=/);await expect(page.getByRole('region',{name:'Madison search results'})).toContainText('Delray Beach');await expect(page.getByTestId('listing-card')).toHaveCount(1);
 await expect(page.getByTestId('listing-card')).toContainText('Delray Beach');
 await page.getByRole('region',{name:'Tell Madison what you want — it’ll narrow these down.'}).getByRole('textbox').fill('Boca Raton under 1 million');await page.getByRole('button',{name:'Ask Madison ↗',exact:true}).click();
 await expect(page.getByTestId('listing-card')).toHaveCount(1);await expect(page.getByTestId('listing-card')).toContainText('Boca Raton');
 await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(page).toHaveURL(/\/listings\?all=1$/);await expect(searchBox(page)).toHaveValue('');await expect(page.getByRole('region',{name:'Madison search results'})).toHaveCount(0);
});
test('sort is immediate; Reset clears filters and query; lease prices are monthly',async({page})=>{
 await page.goto('/listings?all=1');await page.getByRole('combobox',{name:'Sort by'}).selectOption('price-asc');
 await expect(page.getByTestId('listing-card').first()).toContainText('$495,000');
 await page.getByRole('combobox',{name:'Sort by'}).selectOption('price-desc');await expect(page.getByTestId('listing-card').first()).toContainText('$925,000');
 await page.getByRole('combobox',{name:'Min price ($)',exact:true}).selectOption('1000000');await page.getByRole('combobox',{name:'Home style',exact:true}).selectOption('HOUSE');
 await page.getByRole('button',{name:'Reset',exact:true}).click();for(const label of ['Community','Property type','Home style','Min price ($)','Max price ($)','Bedrooms','Bathrooms','Features','Sort by'])await expect(page.getByRole('combobox',{name:label,exact:true})).toHaveValue('');
 await expect(page.getByTestId('listing-card')).toHaveCount(3);
 const request=page.waitForRequest(r=>r.url().includes('/api/listings?')&&r.url().includes('type=RENT'));
 await page.getByRole('combobox',{name:'Property type',exact:true}).selectOption('RENT');await request;
 await expect(page.getByRole('combobox',{name:'Max price ($ / month)',exact:true})).toContainText('$5,000 / month');await expect(page.getByRole('combobox',{name:'Max price ($ / month)',exact:true})).not.toContainText('$250K');
});
test('each displayed detail link resolves to a property page',async({page})=>{
 await page.goto('/listings');const links=await page.getByTestId('listing-card').evaluateAll(elements=>elements.map(e=>e.getAttribute('href')!));expect(links.length).toBeGreaterThan(0);
 for(const href of links){const response=await page.goto(href);expect(response?.status()).toBe(200);await expect(page.locator('.listing-detail h1')).toBeVisible();}
});
test('Madison has one label, hero placement, drag, close and the preserved embed',async({page},testInfo)=>{
 await page.goto('/');const launcher=page.getByRole('button',{name:'Talk to Madison',exact:true});await expect(launcher).toHaveCount(1);
 await page.screenshot({path:`/tmp/madison-hero-${testInfo.project.name}.png`});
 const hero=await page.locator('.coastal-hero').boundingBox();const card=await page.getByRole('dialog',{name:'Talk to Madison'}).boundingBox();expect(card!.y).toBeGreaterThanOrEqual(hero!.y);
 const box=await launcher.boundingBox();expect(box!.y).toBeLessThan(200);expect(box!.x).toBeGreaterThan(page.viewportSize()!.width/2-50);
 await launcher.click();const dialog=page.getByRole('dialog',{name:'Talk to Madison'});await expect(dialog).toBeVisible();
 await expect(dialog.locator('iframe')).toHaveAttribute('srcdoc',/agent-id="cdb09e97-23af-4628-9df7-f8a270fb8265"/);
 const handle=dialog.getByRole('button',{name:'Move Madison window'});await handle.press('ArrowLeft');await expect(dialog).not.toHaveClass(/madison-hero-card/);
 await dialog.getByRole('button',{name:'Close Madison'}).click();await expect(dialog).toBeHidden();await expect(launcher).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('Meta loads after consent and queues one pageview on each public route',async({page})=>{
 await page.route('**/connect.facebook.net/**',route=>route.fulfill({contentType:'application/javascript',body:'window.__pixelCalls=[];fbq.callMethod=function(){window.__pixelCalls.push(Array.from(arguments));};while(fbq.queue.length)fbq.callMethod.apply(fbq,fbq.queue.shift());'}));
 await page.goto('/');await page.getByRole('button',{name:'Allow site analytics',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>((window as unknown as {__pixelCalls?:unknown[][]}).__pixelCalls||[]).filter(c=>c[0]==='track'&&c[1]==='PageView').length)).toBe(1);
 expect(await page.evaluate(()=>((window as unknown as {__pixelCalls:unknown[][]}).__pixelCalls).some(c=>c[0]==='init'&&c[1]==='733196970795080'))).toBe(true);
 await page.getByRole('link',{name:'Browse homes yourself ↗'}).click();await expect.poll(()=>page.evaluate(()=>((window as unknown as {__pixelCalls:unknown[][]}).__pixelCalls||[]).filter(c=>c[0]==='track'&&c[1]==='PageView').length)).toBe(2);
});

test('rental result cards show monthly asking rent',async({page})=>{
 await page.route('**/api/listings?*',route=>route.fulfill({json:{listings:[{...samples[3],price:5000}],mode:'sample',hasMore:false}}));
 await page.goto('/listings');await page.getByRole('combobox',{name:'Property type',exact:true}).selectOption('RENT');await expect(page.getByTestId('listing-card')).toHaveCount(1);await expect(page.getByTestId('listing-card')).toContainText('$5,000 / month');
});

test('default inventory is sale-only, $750k to below $10m, ascending, and present in HTML',async({page,request})=>{
 const response=await request.get('/listings');const html=await response.text();expect(html).toContain('data-testid="listing-card"');expect(html).toContain('1 property found');
 await page.goto('/listings');await expect(page.getByRole('combobox',{name:'Property type',exact:true})).toHaveValue('SALE');await expect(page.getByRole('combobox',{name:'Min price ($)',exact:true})).toHaveValue('750000');await expect(page.getByRole('combobox',{name:'Max price ($)',exact:true})).toHaveValue('9999999');await expect(page.getByRole('combobox',{name:'Sort by'})).toHaveValue('price-asc');
 await expect(page.getByTestId('listing-card')).toHaveCount(1);await expect(page.getByTestId('listing-card')).toContainText('$925,000');
 await page.locator('.map-shell').scrollIntoViewIfNeeded();await expect(page.locator('.map-price')).toHaveCount(1);await expect(page.locator('.map-price')).toContainText('$925,000');
});
test('loading never becomes an empty result and searches scroll to results',async({page})=>{
 await page.goto('/listings?city=Missing');
 let finish:()=>void=()=>{};const gate=new Promise<void>(resolve=>{finish=resolve;});
 await page.route('**/api/listings?*',async route=>{await gate;await route.fulfill({json:{listings:[samples[0]],total:1,mode:'sample',hasMore:false}});});
 await page.getByRole('button',{name:'Search homes',exact:true}).click();await expect(page.getByText('Finding matching homes…')).toBeVisible();await expect(page.getByText('No properties match just yet.')).toHaveCount(0);
 await expect.poll(async()=>Math.round((await page.locator('#listing-results').boundingBox())!.y)).toBeLessThan(200);
 finish();await expect(page.getByTestId('listing-card')).toHaveCount(1);
});
test('map includes all matching homes independently of card pages, with accessible grouped links',async({page})=>{
 const homes=Array.from({length:250},(_,i)=>({...samples[0],id:`fixture-${i}`,slug:`fixture-${i}`,address:`Fixture ${i}`,price:750000+i*1000}));
 await page.route('**/api/listings?*',route=>{const params=new URL(route.request().url()).searchParams;const pageNumber=Number(params.get('page')||1);const sorted=params.get('sort')==='price-desc'?[...homes].reverse():homes;return route.fulfill({json:{listings:sorted.slice((pageNumber-1)*24,pageNumber*24),total:250,mode:'sample',hasMore:pageNumber*24<250}});});
 let mapRequests=0;
 await page.route('**/api/listings/map?*',route=>{mapRequests++;const lat=homes.map(h=>h.latitude!),lng=homes.map(h=>h.longitude!);return route.fulfill({json:{pins:homes.map(h=>[h.slug,h.address,h.city,h.price,h.latitude,h.longitude]),total:250,missingCoordinates:0,inView:250,truncated:false,cap:2000,extent:{north:Math.max(...lat),south:Math.min(...lat),east:Math.max(...lng),west:Math.min(...lng)},mode:'sample'}});});
 await page.goto('/listings');await page.getByRole('combobox',{name:'Sort by'}).selectOption('price-desc');await expect(page.getByTestId('listing-card')).toHaveCount(24);
 await page.locator('.map-shell').scrollIntoViewIfNeeded();await expect(page.locator('.area-map-summary').first()).toContainText('250 mapped homes');await expect(page.locator('.map-cluster')).toHaveText('250');
 await page.locator('.map-cluster').click();await expect(page.getByRole('link',{name:/Fixture 0$/})).toBeVisible();await page.getByRole('button',{name:'More homes',exact:true}).click();await expect(page.getByRole('link',{name:/Fixture 10$/})).toBeVisible();await page.locator('.leaflet-popup-close-button').click();
 const before=mapRequests;await page.getByRole('button',{name:'Next 24 homes'}).click();await expect(page.getByTestId('listing-card').first()).toContainText('$975,000');await expect(page.locator('.map-cluster')).toHaveText('250');expect(mapRequests).toBe(before);
 await page.locator('.map-shell').scrollIntoViewIfNeeded();const map=page.locator('.area-map .leaflet-container');await map.focus();for(let i=0;i<12;i++)await map.press('ArrowRight');await expect(page.locator('.area-map-count')).toContainText('0 matching homes');await expect(page.getByTestId('listing-card')).toHaveCount(24);
});
test('map asks only for the visible area when a search has more homes than one response carries',async({page})=>{
 const home=(i:number,lat:number,lng:number)=>[`area-${i}`,`Area ${i}`,'Delray Beach',800000+i,lat,lng];
 const requests:URL[]=[];
 await page.route('**/api/listings/map?*',route=>{const url=new URL(route.request().url());requests.push(url);const bounded=url.searchParams.has('north');
  return route.fulfill({json:bounded?{pins:[home(1,26.46,-80.07),home(2,26.461,-80.071)],total:5000,missingCoordinates:0,inView:2,truncated:false,cap:2000,extent:null,mode:'sample'}
   :{pins:Array.from({length:3},(_,i)=>home(i,26.3+i*0.2,-80.1)),total:5000,missingCoordinates:0,inView:5000,truncated:true,cap:2000,extent:{north:26.9,south:26.3,east:-80.0,west:-80.2},mode:'sample'}});});
 await page.goto('/listings');await page.locator('.map-shell').scrollIntoViewIfNeeded();
 await expect(page.locator('.area-map-summary').first()).toContainText('5,000 mapped homes');
 await expect.poll(()=>requests.filter(u=>u.searchParams.has('north')).length).toBeGreaterThan(0);
 const bounded=requests.find(u=>u.searchParams.has('north'))!;for(const k of ['north','south','east','west'])expect(Number.isFinite(Number(bounded.searchParams.get(k)))).toBe(true);
 expect(bounded.searchParams.get('type')).toBe(requests[0].searchParams.get('type'));
});
