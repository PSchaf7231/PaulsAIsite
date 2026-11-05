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
 await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(page).toHaveURL(/\/listings$/);await expect(searchBox(page)).toHaveValue('');await expect(page.getByRole('region',{name:'Madison search results'})).toHaveCount(0);
});
test('sort is immediate; Reset clears filters and query; lease prices are monthly',async({page})=>{
 await page.goto('/listings');await page.getByRole('combobox',{name:'Sort by'}).selectOption('price-asc');
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
