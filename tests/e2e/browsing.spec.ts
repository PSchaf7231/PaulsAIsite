import { test, expect } from "@playwright/test";
test("homepage, contact details, and Pax are available",async({page})=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto("/");await expect(page.getByRole("heading",{name:"A place to live. A life to love."})).toBeVisible();
 await expect(page.locator('a[href="tel:5612557285"]').first()).toBeVisible();
 await expect(page.locator('[data-testid="listing-card"]')).toHaveCount(3);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.getByRole("link",{name:/Work with Paul/}).click();
 await expect(page.locator('a[href="mailto:paul@palmbeachrealestatepros.com"]').first()).toBeVisible();
 await page.locator(".floating-pax").click();await expect(page.getByRole("dialog",{name:"Ask Pax"})).toBeVisible();
 expect(errors).toEqual([]);
});
test("filters and map share results, reset restores all five, and detail opens",async({page})=>{
 await page.goto("/listings");await expect(page.getByTestId("listing-card")).toHaveCount(5);
 await expect(page.locator(".leaflet-marker-icon")).toHaveCount(5);
 await page.getByRole("combobox",{name:"Community",exact:true}).selectOption("Delray Beach");
 await expect(page.getByTestId("listing-card")).toHaveCount(1);await expect(page.locator(".leaflet-marker-icon")).toHaveCount(1);
 await page.getByLabel("Max price ($)",{exact:true}).fill("500000");await expect(page.getByText("No properties match just yet.")).toBeVisible();await expect(page.locator(".leaflet-marker-icon")).toHaveCount(0);
 await page.getByRole("button",{name:"Clear filters"}).click();await expect(page.getByTestId("listing-card")).toHaveCount(5);
 await page.getByRole("combobox",{name:"Property type",exact:true}).selectOption("RENT");await expect(page.getByTestId("listing-card")).toHaveCount(1);
 await page.getByTestId("listing-card").click();await expect(page.getByRole("heading",{name:"A fresh start near the coast"})).toBeVisible();await expect(page.getByText("$3,400 / month",{exact:true}).first()).toBeVisible();
});
test("community links prefilter and unknown listing returns 404",async({page})=>{
 await page.goto("/communities/delray-beach");await page.getByRole("link",{name:/Explore properties in Delray Beach/}).click();
 await expect(page.getByRole("combobox",{name:"Community",exact:true})).toHaveValue("Delray Beach");await expect(page.getByTestId("listing-card")).toHaveCount(1);
 const response=await page.goto("/listings/does-not-exist");expect(response?.status()).toBe(404);await expect(page.getByRole("heading",{name:"Let’s get you back home."})).toBeVisible();
});
test("local illustration replaces an unavailable external photo",async({page})=>{
 await page.route('**/_next/image?*',route=>new URL(route.request().url()).searchParams.get('url')?.startsWith('https://images.unsplash.com/')?route.abort():route.continue());
 await page.goto('/listings');
 const photo=page.getByTestId('listing-card').first().locator('img');
 await page.getByTestId("listing-card").first().scrollIntoViewIfNeeded();
 await expect(photo).toHaveAttribute('alt',/AI-generated illustrative/);
 await expect.poll(()=>photo.evaluate((image:HTMLImageElement)=>image.complete && image.naturalWidth>0)).toBe(true);
});
