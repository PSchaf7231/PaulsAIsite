import {test,expect} from '@playwright/test';
test('city tile sets sale, single-family and inclusive million-dollar minimum immediately',async({page})=>{
 await page.goto('/');await expect(page.locator('.home-place')).toHaveCount(6);await expect(page.locator('.home-place').filter({hasText:'Palm Beach Gardens'})).toHaveCount(1);await expect(page.locator('.home-place').filter({hasText:'Wellington'})).toHaveCount(0);
 const link=page.locator('.home-place').filter({has:page.getByRole('heading',{name:'Palm Beach',exact:true})});
 await link.click();await expect(page).toHaveURL(/propertyType=single-family/);await expect(page.getByRole('combobox',{name:'Property type',exact:true})).toHaveValue('SALE');await expect(page.getByRole('combobox',{name:'Home style',exact:true})).toHaveValue('HOUSE');await expect(page.getByLabel('Min price ($)',{exact:true})).toHaveValue('1000000');await expect(page.getByTestId('listing-card')).toHaveCount(0);
 const result=await page.request.get('/api/listings?city=Palm%20Beach&type=sale&propertyType=single-family&minPrice=1000000');expect(result.ok()).toBe(true);expect((await result.json()).listings).toEqual([]);
 await expect(page.getByRole('link',{name:'Photo credits',exact:true})).toHaveCount(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
