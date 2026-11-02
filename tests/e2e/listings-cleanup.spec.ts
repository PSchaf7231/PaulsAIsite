import {test,expect} from '@playwright/test';
test('listing defaults stay residential and errors do not claim zero matches',async({page})=>{
 await page.goto('/listings');
 await expect(page.getByRole('combobox',{name:'Property type',exact:true})).toHaveValue('SALE');
 await expect(page.getByRole('combobox',{name:'Home style',exact:true})).toHaveValue('HOUSE');
 await expect(page.getByLabel('Min price ($)',{exact:true})).toHaveValue('1000000');
 await expect(page.getByRole('combobox',{name:'Sort by'})).toHaveValue('price-desc');
 const count=await page.getByTestId('listing-card').count();
 await expect(page.locator('.results-toolbar')).toContainText(`${count} ${count===1?'property':'properties'} found`);
 if(await page.locator('.pax-save').count())expect(await page.locator('.pax-save').first().evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
 await page.route('**/api/listings?*',route=>route.fulfill({status:503,json:{error:'Feed unavailable'}}));
 await page.getByLabel('Max price ($)',{exact:true}).fill('3000000');
 await expect(page.locator('.results-toolbar').getByRole('alert')).toContainText('temporarily unavailable');
 await expect(page.locator('.results-toolbar')).not.toContainText('0 properties found');
 await expect(page.getByTestId('listing-card')).toHaveCount(count);
});
