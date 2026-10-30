import { test,expect } from '@playwright/test';
test('three optional opening choices keep typing open and recognize sellers',async({page})=>{
 await page.goto('/');await page.locator('.floating-pax').click();
 const panel=page.getByRole('dialog',{name:'Ask Pax',exact:true});
 await expect(panel.getByRole('button',{name:'I’m buying',exact:true})).toBeVisible();await expect(panel.getByRole('button',{name:'I’m selling',exact:true})).toBeVisible();await expect(panel.getByRole('button',{name:'Just looking',exact:true})).toBeVisible();await expect(panel.getByLabel('Message Pax',{exact:true})).toBeVisible();
 const consent=panel.getByRole('checkbox');if(await consent.count())await consent.first().check();
 await panel.getByRole('button',{name:'I’m selling',exact:true}).click();await expect(panel.getByRole('log')).toContainText('pricing');
 const state=(await (await page.request.get('/api/pax/session')).json()).session;expect(state.preferences.intent).toBe('SELLER');expect(state.lead).toBeUndefined();
});
test('AI discovery, referral tagging and launch contact use public information only',async({page,request})=>{
 const llms=await request.get('/llms.txt');expect(llms.status()).toBe(200);expect(await llms.text()).toContain('paul@palmbeachrentalpros.com');
 const robots=await (await request.get('/robots.txt')).text();for(const bot of ['GPTBot','OAI-SearchBot','ClaudeBot','PerplexityBot'])expect(robots).toContain(bot);
 await page.route('https://www.googletagmanager.com/**',route=>route.fulfill({contentType:'text/javascript',body:'/* local analytics stub */'}));
 await page.goto('/?utm_source=chatgpt&private_test=hidden');await page.getByRole('button',{name:'Allow site analytics',exact:true}).click();
 const events=await page.evaluate(()=>JSON.stringify((window as unknown as {dataLayer:unknown[]}).dataLayer));expect(events).toContain('ai_referral_source');expect(events).toContain('ChatGPT');expect(events).not.toContain('private_test');
 await expect(page.locator('a[href="mailto:paul@palmbeachrentalpros.com"]').first()).toBeVisible();await expect(page.locator('.facts')).toHaveCount(0);
 const inventory=await (await request.get('/api/listings?city=Boynton%20Beach')).json();expect(inventory.mode).toBe('sample');expect(inventory.listings.length).toBeGreaterThan(0);expect(inventory.listings.every((l:{city:string})=>l.city==='Boynton Beach')).toBe(true);
});
