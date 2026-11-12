import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir:"./e2e",
  use:{baseURL:"http://localhost:3100",...devices["iPhone 13 Mini"],viewport:{width:360,height:800}},
  webServer:{command:"node node_modules/next/dist/bin/next dev --port 3100",url:"http://localhost:3100",reuseExistingServer:false},
});

