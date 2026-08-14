import { describe, expect, it } from "vitest";

import { resolveAnalyticsConfig } from "./analytics-config";

const websiteId = ["00000000", "0000", "4000", "8000", "000000000001"].join("-");

describe("analytics configuration", () => {
  it("is disabled only when both public configuration values are absent", () => {
    expect(resolveAnalyticsConfig({})).toBeNull();
    expect(
      resolveAnalyticsConfig({
        PUBLIC_ANALYTICS_PROVIDER: "",
        PUBLIC_UMAMI_WEBSITE_ID: "  ",
      }),
    ).toBeNull();
  });

  it("fails closed on partial, unknown, or malformed public configuration", () => {
    for (const env of [
      { PUBLIC_ANALYTICS_PROVIDER: "umami" },
      { PUBLIC_UMAMI_WEBSITE_ID: websiteId },
      {
        PUBLIC_ANALYTICS_PROVIDER: "plausible",
        PUBLIC_UMAMI_WEBSITE_ID: websiteId,
      },
      {
        PUBLIC_ANALYTICS_PROVIDER: "umami",
        PUBLIC_UMAMI_WEBSITE_ID: "not-a-uuid",
      },
    ]) {
      expect(() => resolveAnalyticsConfig(env)).toThrow(/analytics configuration/i);
    }
  });

  it("resolves a valid public Umami configuration to fixed privacy-safe settings", () => {
    expect(
      resolveAnalyticsConfig({
        PUBLIC_ANALYTICS_PROVIDER: "umami",
        PUBLIC_UMAMI_WEBSITE_ID: websiteId,
      }),
    ).toEqual({
      provider: "umami",
      websiteId,
      scriptUrl: "https://cloud.umami.is/script.js",
      domain: "gabrielrgoldstein.github.io",
    });
  });
});
