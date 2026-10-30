import { test,expect } from '@playwright/test';
test('anonymous favorites trigger a soft ask, attach history, and preserve free browsing',async({page})=>{
 await page.goto('/listings');await page.getByRole('button',{name:'Save this home',exact:true}).first().click();
 await expect(page.getByRole('button',{name:'Saved',exact:true})).toBeVisible();await expect(page.getByLabel('Pax suggestion')).toBeVisible();
 await page.getByRole('button',{name:'Save my preferences',exact:true}).click();
 await expect(page.getByLabel('Your name',{exact:true})).toHaveCount(0);await expect(page.getByLabel('Phone',{exact:true})).toHaveCount(0);await page.getByLabel('Email',{exact:true}).fill('buyer@example.com');
 await expect(page.getByRole('checkbox',{name:/Text me an automated/})).toHaveCount(0);await page.getByRole('checkbox',{name:/Email my acknowledgment/}).check();
 await page.getByRole('button',{name:'Send my request',exact:true}).click();await expect(page.getByLabel('Next steps with Pax').getByRole('status')).toContainText('Your request is saved');
 const state=(await (await page.request.get('/api/pax/session')).json()).session;expect(state.lead.email).toBe('buyer@example.com');expect(state.saved.length).toBe(1);expect(state.source).toBe('WEBSITE');expect(state.communicationConsent).toMatchObject({sms:false,email:true});
 await expect(page.getByTestId('listing-card')).toHaveCount(5);
});
test('not now pauses offers without capturing contact or blocking photos',async({page})=>{
 await page.goto('/listings');await page.getByRole('button',{name:'Save this home',exact:true}).first().click();await expect(page.getByLabel('Pax suggestion')).toBeVisible();
 await page.getByRole('button',{name:'Not now',exact:true}).click();await expect(page.getByLabel('Pax suggestion')).toHaveCount(0);
 await page.getByTestId('listing-card').first().click();await expect(page.locator('h1')).toBeVisible();
 const state=(await (await page.request.get('/api/pax/session')).json()).session;expect(state.lead).toBeUndefined();expect(state.activity.dismissedUntil).toBeGreaterThan(Date.now());
});

test('Facebook HTTP webhook verifies challenge/signature and durably deduplicates receipt',async({request},testInfo)=>{
 const {createHmac,createHash}=await import('node:crypto');const {readFile}=await import('node:fs/promises');
 const verify=await request.get('/api/webhooks/facebook?hub.mode=subscribe&hub.verify_token=e2e-only-verify&hub.challenge=123456');expect(verify.status()).toBe(200);expect(await verify.text()).toBe('123456');
 const badVerify=await request.get('/api/webhooks/facebook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=123456');expect(badVerify.status()).toBe(403);
 const leadId=String(Date.now())+(testInfo.project.name==='mobile'?'2':'1');
 const body=JSON.stringify({object:'page',entry:[{id:'100',changes:[{field:'leadgen',value:{leadgen_id:leadId,form_id:'300'}}]}]});
 const rejected=await request.post('/api/webhooks/facebook',{data:body,headers:{'Content-Type':'application/json'}});expect(rejected.status()).toBe(401);
 const signature='sha256='+createHmac('sha256','e2e-only-secret').update(body).digest('hex');
 for(let i=0;i<2;i++){const result=await request.post('/api/webhooks/facebook',{data:body,headers:{'Content-Type':'application/json','X-Hub-Signature-256':signature}});expect(result.status()).toBe(200);}
 const id=createHash('sha256').update(`facebook-lead:${leadId}`).digest('hex');
 const state=JSON.parse(await readFile(`.pax-test-data/${id}.json`,'utf8'));expect(state.source).toBe('FACEBOOK_FORM');expect(state.facebook.status).toBe('pending');expect(state.events.filter((e:{kind:string})=>e.kind==='facebook_received')).toHaveLength(1);expect(state.lead).toBeUndefined();
});
