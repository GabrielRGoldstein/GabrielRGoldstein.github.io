import { defineConfig } from "@playwright/test";

import { requireProductionUrl } from "./tests/support/production-origin";

export { requireProductionUrl } from "./tests/support/production-origin";

const productionOrigin = requireProductionUrl();

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: productionOrigin,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
