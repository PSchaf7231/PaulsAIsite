import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
 testDir:"./tests/e2e",timeout:45000,workers:1,
 use:{baseURL:"http://localhost:3000",headless:true,launchOptions:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:["--no-sandbox"]}:{}},
 projects:[{name:"desktop",use:{...devices["Desktop Chrome"]}},{name:"mobile",use:{...devices["iPhone 13"],defaultBrowserType:"chromium"}}],
 webServer:{command:"npm run dev",url:"http://localhost:3000",reuseExistingServer:!process.env.CI,timeout:120000,env:{LISTINGS_SOURCE:"sample",PAX_STORAGE:"local",PAX_LOCAL_DIRECTORY:".pax-test-data",PAX_TEST_MODE:"1",PAX_NOTIFICATIONS:"preview"}}
});
