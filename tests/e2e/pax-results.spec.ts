import { test,expect,type Page } from '@playwright/test';
async function say(page:Page,text:string){const panel=page.getByRole('dialog');await panel.getByLabel('Message Pax',{exact:true}).fill(text);await panel.getByRole('button',{name:'Send message',exact:true}).click();await expect(panel.getByLabel('Message Pax',{exact:true})).toBeEnabled();}
test('numbered results, chips, comparison, pins and Create alert share the same search',async({page,isMobile})=>{
 await page.goto('/pax');const panel=page.getByRole('dialog');await expect(panel.getByText('Automated test mode · no live AI or delivery')).toBeVisible();await panel.getByRole('checkbox').check();
 await say(page,'Find a home in Delray under 600k');await expect(panel.getByTestId('listing-card')).toHaveCount(1);
 await panel.getByRole('button',{name:'Remove Delray Beach filter',exact:true}).click();await expect(panel.getByTestId('listing-card')).toHaveCount(2);
 await panel.getByRole('button',{name:'Remove Up to $600,000 filter',exact:true}).click();await expect(panel.getByTestId('listing-card')).toHaveCount(3);
 await panel.getByRole('button',{name:'Add to comparison: result 1',exact:true}).click();await panel.getByRole('button',{name:'Add to comparison: result 2',exact:true}).click();await expect(panel.getByRole('region',{name:'Home comparison'})).toContainText('Compare homes (2/3)');
 await panel.getByRole('button',{name:'Show result 3 on map',exact:true}).click();await expect(panel.locator('.leaflet-popup')).toContainText('#3');
 const before=(await (await page.request.get('/api/pax/session')).json()).session.results;
 await say(page,'tell me about number 3');await expect(panel.locator('.pax-message.assistant').last()).toContainText('Number 3');const after=(await (await page.request.get('/api/pax/session')).json()).session;expect(after.results).toEqual(before);
 await panel.getByRole('button',{name:'Create alert',exact:true}).click();await expect(panel.locator('.pax-message.assistant').last()).toContainText('What email');
 await say(page,'test@example.com');await expect(panel.getByRole('button',{name:'Confirm',exact:true})).toBeVisible();await panel.getByRole('button',{name:'Confirm',exact:true}).click();await expect.poll(async()=>(await (await page.request.get('/api/pax/session')).json()).session.searches.length).toBe(1);
 if(isMobile){await panel.getByRole('button',{name:/Hide results/}).click();await expect(panel.getByTestId('listing-card').first()).not.toBeVisible();await panel.getByRole('button',{name:/Show results/}).click();await expect(panel.getByTestId('listing-card').first()).toBeVisible();}
 else{const chat=await panel.locator('.pax-conversation').boundingBox(),results=await panel.locator('.pax-results').boundingBox();expect(results!.x).toBeGreaterThan(chat!.x+chat!.width-2);}
 await say(page,'just show me homes');await expect(panel.getByTestId('listing-card')).toHaveCount(5);await expect(panel.getByRole('button',{name:'Show me more',exact:true})).toHaveCount(0);await say(page,'show me more');await expect(panel.locator('.pax-message.assistant').last()).toContainText('all matching samples');
});
test('small talk and one must-have question do not secretly launch a search',async({page})=>{
 await page.goto('/pax');const panel=page.getByRole('dialog');await expect(panel.getByText('Automated test mode · no live AI or delivery')).toBeVisible();await panel.getByRole('checkbox').check();await say(page,'hello');await expect(panel.locator('.pax-message.assistant').last()).toContainText('Glad you stopped by');await expect(panel.getByTestId('listing-card')).toHaveCount(0);
 await say(page,'Find a home');await expect(panel.locator('.pax-message.assistant').last()).toContainText('one must-have');await expect(panel.getByTestId('listing-card')).toHaveCount(0);
 await say(page,'just show me homes');await expect(panel.getByTestId('listing-card')).toHaveCount(5);
});
