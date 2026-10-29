import {test,expect,type Page} from "@playwright/test";
async function begin(page:Page){await page.goto('/pax');await expect(page.getByText('Automated test mode · no live AI or delivery')).toBeVisible();await page.getByRole('checkbox').check();}
async function say(page:Page,text:string){await page.getByLabel('Message Pax',{exact:true}).fill(text);await page.getByRole('button',{name:'Send message',exact:true}).click();await expect(page.getByLabel('Message Pax',{exact:true})).toBeEnabled();}
async function session(page:Page){return (await (await page.request.get('/api/pax/session')).json()).session;}
test('Pax searches samples, syncs map, saves freely, and resumes after reload',async({page})=>{
 await begin(page);await say(page,'Find a home in Delray under 600k');
 await expect(page.getByTestId('listing-card')).toHaveCount(1);await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);
 await page.getByRole('button',{name:'Save this home',exact:true}).click();await expect(page.getByRole('button',{name:'Saved',exact:true})).toBeDisabled();
 expect((await session(page)).lead).toBeUndefined();
 await page.reload();await expect(page.getByRole('button',{name:'Saved',exact:true})).toBeVisible();
 await page.getByTestId('listing-card').click();await expect(page.getByRole('heading',{name:'Courtyard days, coastal evenings'})).toBeVisible();
 await expect.poll(async()=> (await session(page)).viewed).toContain('delray-courtyard');
});
test('contact confirmation captures one lead and attaches previous interest',async({page})=>{
 await begin(page);await say(page,'Find a home in Delray under 600k');await page.getByRole('button',{name:'Save this home',exact:true}).click();await expect(page.getByRole('button',{name:'Saved',exact:true})).toBeVisible();
 await say(page,'Please contact me at test@example.com');await expect(page.getByRole('button',{name:'Confirm',exact:true})).toBeVisible();
 expect((await session(page)).lead).toBeUndefined();const action=(await session(page)).actions[0];
 await page.getByRole('button',{name:'Confirm',exact:true}).click();await expect(page.getByText('Your contact information is saved for Paul to follow up about this request.')).toBeVisible();
 let s=await session(page);expect(s.lead.email).toBe('test@example.com');expect(s.saved).toEqual(['delray-courtyard']);
 const response=await page.request.post('/api/pax/action',{headers:{origin:'http://localhost:3000'},data:{type:'confirm',actionId:action.id,accepted:true}});expect(response.status()).toBe(200);
 s=await session(page);expect(s.events.filter((e:{kind:string})=>e.kind==='lead_captured')).toHaveLength(1);
});
test('saved search is stored honestly without claiming live alerts',async({page})=>{
 await begin(page);await say(page,'Find a home in Delray under 600k');await say(page,'Save my search and use test@example.com');
 await page.getByRole('button',{name:'Confirm',exact:true}).click();await expect(page.getByText(/Your search preferences are saved/)).toBeVisible();
 expect((await session(page)).searches[0].status).toBe('SAMPLE_ONLY');
});
test('a callback is a request, not a booked appointment',async({page})=>{
 await begin(page);await say(page,'Please call me Saturday at 10 AM Eastern, test@example.com');
 await page.getByRole('button',{name:'Confirm',exact:true}).click();await expect(page.getByText(/Your call request is recorded. Paul still needs to confirm/)).toBeVisible();
 expect((await session(page)).appointments[0].status).toBe('REQUESTED');
});
test('declining contact preserves free browsing and creates no lead',async({page})=>{
 await begin(page);await say(page,'Please contact me at test@example.com');await page.getByRole('button',{name:'Not now',exact:true}).click();
 await expect(page.getByText('No problem. You can keep browsing freely.')).toBeVisible();await say(page,'Find a home in Delray');
 await expect(page.getByTestId('listing-card')).toHaveCount(1);expect((await session(page)).lead).toBeUndefined();
});
test('seller and hot-lead signals are recorded; samples cannot be toured',async({page})=>{
 await begin(page);await say(page,'We need to sell first');await expect(page.getByText(/Paul can help with a free home value report/)).toBeVisible();expect((await session(page)).preferences.intent).toBe('SELLER');
 await say(page,"I'm pre-approved and moving within 60 days");await say(page,'I want to book a showing');await expect(page.getByText(/These homes are fictional samples, so they can’t be toured/)).toBeVisible();
 const s=await session(page);expect(s.preferences.preApproved).toBe(true);expect(s.events.some((e:{kind:string})=>e.kind==='hot_lead')).toBe(true);expect(s.appointments).toHaveLength(0);
});
test('another visitor cannot read or confirm this conversation',async({page,browser})=>{
 await begin(page);await say(page,'Please contact me at test@example.com');const s=await session(page);const other=await browser.newContext();
 try{
  const data=await (await other.request.get('http://localhost:3000/api/pax/session')).json();expect(data.session).toBeNull();
  const result=await other.request.post('http://localhost:3000/api/pax/action',{headers:{origin:'http://localhost:3000'},data:{type:'confirm',actionId:s.actions[0].id,accepted:true}});expect(result.status()).toBe(401);
  const crossOrigin=await page.request.post('/api/pax/action',{headers:{origin:'https://unrelated.example'},data:{type:'confirm',actionId:s.actions[0].id,accepted:true}});expect(crossOrigin.status()).toBe(403);
 }finally{await other.close();}
});
test('a slow session lookup does not clear the visitor’s chat consent',async({page})=>{
 let release!:()=>void,started!:()=>void;
 const gate=new Promise<void>(resolve=>{release=resolve;});const requested=new Promise<void>(resolve=>{started=resolve;});
 await page.route('**/api/pax/session',async route=>{started();await gate;await route.continue();});
 await page.goto('/pax');await requested;await page.getByRole('checkbox').check();release();
 await expect(page.getByText('Automated test mode · no live AI or delivery')).toBeVisible();
 await expect(page.getByRole('checkbox')).toBeChecked();
 await say(page,'Find a home in Delray under 600k');await expect(page.getByTestId('listing-card')).toHaveCount(1);
});
