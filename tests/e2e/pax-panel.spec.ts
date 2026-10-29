import { test,expect } from '@playwright/test';
test('Pax stays over the current home, preserves scroll and conversation across pages',async({page,isMobile})=>{
 await page.goto('/listings/boynton-poolside');
 await page.evaluate(()=>window.scrollTo(0,300));
 const position=await page.evaluate(()=>window.scrollY);
 await page.locator('.floating-pax').click();
 const panel=page.getByRole('dialog',{name:'Ask Pax'});
 await expect(panel).toBeVisible();await expect(panel.getByText('Viewing: Your own poolside retreat')).toBeVisible();
 await expect(page).toHaveURL(/\/listings\/boynton-poolside$/);
 const box=await panel.boundingBox();expect(box).not.toBeNull();if(isMobile){expect(box!.y).toBeGreaterThan(0);}else{expect(box!.x).toBeGreaterThan(0);}
 await expect(panel.getByText('Automated test mode · no live AI or delivery')).toBeVisible();
 await panel.getByRole('checkbox').check();await panel.getByLabel('Message Pax',{exact:true}).fill('Find a home in Delray');await panel.getByRole('button',{name:'Send message'}).click();
 await expect(panel.getByLabel('Message Pax',{exact:true})).toBeEnabled();
 const state=await (await page.request.get('/api/pax/session')).json();expect(state.session.currentPage.listingSlug).toBe('boynton-poolside');
 await panel.getByRole('button',{name:'Close Pax'}).click();await expect(panel).not.toBeVisible();expect(await page.evaluate(()=>window.scrollY)).toBe(position);
 await page.locator('.floating-pax').click();await expect(panel.locator('.pax-message.user').filter({hasText:'Find a home in Delray'})).toBeVisible();
 await panel.getByTestId('listing-card').click();await expect(page).toHaveURL(/\/listings\/delray-courtyard$/);await expect(panel).not.toBeVisible();
 await page.locator('.floating-pax').click();await expect(panel.getByText('Viewing: Courtyard days, coastal evenings')).toBeVisible();await expect(panel.locator('.pax-message.user').filter({hasText:'Find a home in Delray'})).toBeVisible();
 await panel.getByLabel('Message Pax',{exact:true}).fill('Keep this draft');await page.keyboard.press('Escape');await expect(panel).not.toBeVisible();await expect(page.locator('.floating-pax')).toBeFocused();
 await page.locator('.floating-pax').click();await expect(panel.getByLabel('Message Pax',{exact:true})).toHaveValue('Keep this draft');
});
test('homepage has only a small neighborhood link and chat buttons keep its URL',async({page})=>{
 await page.goto('/');await expect(page.getByRole('heading',{name:'Find your kind of Florida.'})).toHaveCount(0);await expect(page.getByRole('link',{name:'Neighborhood guides'})).toHaveCount(1);
 await page.getByRole('button',{name:'Chat with Pax ↗',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page).toHaveURL('http://localhost:3000/');
});
