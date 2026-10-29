import { test,expect,type Page } from '@playwright/test';
async function say(page:Page,text:string){await page.getByLabel('Message Pax',{exact:true}).fill(text);await page.getByRole('button',{name:'Send message',exact:true}).click();await expect(page.getByLabel('Message Pax',{exact:true})).toBeEnabled();}
async function session(page:Page){return (await (await page.request.get('/api/pax/session')).json()).session;}
test('conversational criteria are confirmed, updated, and visible on the private lead page with three manual texts',async({page,context})=>{
 await page.goto('/pax');await expect(page.getByText('Automated test mode · no live AI or delivery')).toBeVisible();await page.getByRole('checkbox').check();
 await say(page,'I want 3 beds, 2 baths in Delray or Boynton under $650k, pool, no HOA. Moving in 60 days to be closer to work.');
 await expect(page.getByRole('dialog').getByTestId('listing-card')).toHaveCount(2);await expect(page.getByText(/Potential match — Paul needs to confirm/)).toHaveCount(2);
 expect((await session(page)).searches).toHaveLength(0);
 await say(page,'Save my search test@example.com');await page.getByRole('checkbox',{name:/Email my acknowledgment/}).check();await page.getByRole('button',{name:'Confirm',exact:true}).click();
 await expect.poll(async()=>(await session(page)).searches.length).toBe(1);
 await say(page,'add Lake Worth');await say(page,'bump it to $700K');expect((await session(page)).searches[0].preferences.maxPrice).toBe(650000);
 await say(page,'yes');const state=await session(page);expect(state.searches[0].preferences.maxPrice).toBe(700000);expect(state.searches[0].preferences.areas).toContain('Lake Worth Beach');expect(state.searches[0].preferences.baths).toBe(2);
 // Add an explicitly supplied phone to this visitor via the normal capture endpoint.
 const capture=await page.request.post('/api/pax/lead',{headers:{origin:'http://localhost:3000'},data:{name:'Private Buyer',email:'test@example.com',phone:'2025550123',wanted:'Delray or Boynton',timeline:'60 days',smsConsent:false,emailConsent:true,purpose:'CALL'}});expect(capture.ok()).toBe(true);
 const cookie=(await context.cookies()).find(c=>c.name==='pax_visitor')!;const {createHash}=await import('node:crypto');const id=createHash('sha256').update(cookie.value).digest('hex');
 await page.goto(`/admin/leads/${id}`);await expect(page.getByRole('heading',{name:'Paul’s lead inbox'})).toBeVisible();await expect(page.getByText('Private Buyer',{exact:true})).toHaveCount(0);
 await page.getByLabel('Administrator email').fill('paul@example.com');await page.getByLabel('Password',{exact:true}).fill('e2e-private-access');await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Private Buyer'})).toBeVisible();await expect(page.getByRole('heading',{name:'Pax’s 3 suggested texts'})).toBeVisible();
 await expect(page.getByText(/moving because: closer to work/).first()).toBeVisible();await expect(page.getByLabel('Suggested text 1')).toBeVisible();
 const draft='Hi Sam & family? Let’s talk + plan.';await page.getByLabel('Suggested text 1').fill(draft);const href=await page.getByRole('link',{name:'Open text 1',exact:true}).getAttribute('href');expect(href).toContain('sms:+12025550123');expect(decodeURIComponent(href!.split('body=')[1])).toBe(draft);
 await expect(page.getByRole('link',{name:/Open text [123]/})).toHaveCount(3);await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.getByLabel('Administrator email')).toBeVisible();
});
