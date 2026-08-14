import { defineConfig } from "@playwright/test";

const expectedProductionOrigin = "https://gabrielrgoldstein.github.io";

export function requireProductionUrl(value = process.env.PRODUCTION_URL) {
  let parsed: URL;
  try {
    parsed = new URL(value ?? "");
  } catch {
    throw new Error("PRODUCTION_URL must be the confirmed HTTPS production origin");
  }

  if (
    parsed.origin !== expectedProductionOrigin ||
    parsed.protocol !== "https:" ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.pathname !== "/" ||
    parsed.search !== "" ||
    parsed.hash !== ""
  ) {
    throw new Error("PRODUCTION_URL must be the confirmed HTTPS production origin");
  }

  return parsed.origin;
}

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
