import {test,expect} from '@playwright/test';
test('card effects animate, pause, and respect reduced motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/listings');const card=page.getByTestId('listing-card').first();await expect(card).toBeVisible();
 const angle=()=>card.evaluate(el=>getComputedStyle(el,'::before').getPropertyValue('--pax-border-angle'));
 const first=await angle();await expect.poll(angle).not.toBe(first);
 await expect(card.locator('.ai-status')).toHaveText('AI-assisted');
 await page.getByRole('button',{name:'Reduce motion'}).click();await expect.poll(()=>card.evaluate(el=>getComputedStyle(el,'::before').animationPlayState)).toBe('paused');
 await page.getByRole('button',{name:'Restore motion'}).click();await page.emulateMedia({reducedMotion:'reduce'});
 await expect.poll(()=>card.evaluate(el=>getComputedStyle(el,'::before').animationName)).toBe('none');
 await expect.poll(()=>card.locator('.listing-photo').evaluate(el=>getComputedStyle(el,'::after').display)).toBe('none');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('quiet pages share the moving backdrop',async({page})=>{await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/contact');await expect.poll(()=>page.locator('.site-ai-atmosphere').evaluate(el=>getComputedStyle(el,'::after').animationName)).toBe('site-light-pass');await expect(page.getByRole('dialog')).not.toBeVisible();});
