import {test,expect} from '@playwright/test';
test('Madison stays nonmodal, draggable and preserves conversation across navigation and minimization',async({page})=>{
 let avatarRequests=0;await page.route('**/api/pax/avatar',route=>{avatarRequests++;return route.fulfill({status:503,json:{error:'Video is not configured in this test.'}});});
 await page.goto('/');await page.getByRole('button',{name:'Talk to Madison — powered by Pax',exact:true}).click();
 const panel=page.getByRole('dialog',{name:'Ask Pax'});await expect(panel).toBeVisible();await expect(panel).toHaveAttribute('aria-modal','false');
 expect(avatarRequests).toBe(0);await expect(panel.getByRole('button',{name:'Start video chat',exact:true})).toBeDisabled();
 await panel.getByRole('checkbox',{name:/I agree to save this chat/}).check();
 await panel.getByLabel('Message Pax',{exact:true}).fill('Find a home in Delray');await panel.getByRole('button',{name:'Send message'}).click();
 await expect(panel.locator('.pax-message.user').filter({hasText:'Find a home in Delray'})).toBeVisible();
 const before=await panel.boundingBox();await panel.getByRole('button',{name:'Move Madison window'}).focus();await page.keyboard.press('ArrowUp');const moved=await panel.boundingBox();expect(moved!.y).toBeLessThan(before!.y);
 await panel.getByRole('button',{name:'Minimize Madison'}).click();await expect(panel).toHaveClass(/is-minimized/);
 await page.locator('footer a[href="/communities"]').click();await expect(page).toHaveURL(/\/communities$/);await expect(panel).toBeVisible();await expect(panel).toHaveClass(/is-minimized/);
 await panel.getByRole('button',{name:'Restore Madison conversation'}).click();await expect(panel.locator('.pax-message.user').filter({hasText:'Find a home in Delray'})).toBeVisible();
 await panel.getByLabel('Message Pax',{exact:true}).fill('Keep this draft');await panel.getByRole('button',{name:'Close Pax'}).click();await expect(panel).not.toBeVisible();
 await page.getByRole('button',{name:'Talk to Madison — powered by Pax',exact:true}).click();await expect(panel.getByLabel('Message Pax',{exact:true})).toHaveValue('Keep this draft');expect(avatarRequests).toBe(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('video requires explicit consent and handles unconfigured service without starting audio',async({page})=>{
 await page.route('**/api/pax/avatar',route=>route.fulfill({status:503,json:{error:'Video is not configured in this test.'}}));
 await page.goto('/');await page.locator('.madison-hero-button').click();const panel=page.getByRole('dialog',{name:'Ask Pax'});
 await panel.getByRole('checkbox',{name:/Allow Anam/}).check();await panel.getByRole('button',{name:'Start video chat',exact:true}).click();
 await expect(panel.getByRole('alert')).toContainText('Video is not configured');await expect(panel.getByRole('button',{name:'Start video chat',exact:true})).toBeEnabled();
 expect(await panel.locator('video').evaluate((v:HTMLVideoElement)=>v.srcObject===null)).toBe(true);
 const rejected=await page.request.post('/api/pax/avatar',{data:{consent:true},headers:{Origin:'https://unrelated.example'}});expect(rejected.status()).toBe(403);
});
