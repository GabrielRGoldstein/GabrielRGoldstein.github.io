import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";

import Analytics from "./Analytics.astro";
import type { AnalyticsConfig } from "../lib/analytics-config";

const websiteId = ["00000000", "0000", "4000", "8000", "000000000001"].join("-");
const config: AnalyticsConfig = {
  provider: "umami",
  websiteId,
  scriptUrl: "https://cloud.umami.is/script.js",
  domain: "gabrielrgoldstein.github.io",
};

describe("Analytics", () => {
  it("renders no third-party tracker when analytics is disabled", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Analytics, {
      props: { config: null },
    });

    expect(html).not.toContain("cloud.umami.is");
    expect(html).not.toContain("data-website-id");
  });

  it("renders one fixed privacy-configured Umami tracker when enabled", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Analytics, {
      props: { config },
    });

    expect(html.match(/https:\/\/cloud\.umami\.is\/script\.js/g)).toHaveLength(1);
    expect(html).toContain(`data-website-id="${config.websiteId}"`);
    expect(html).toContain(`data-domains="${config.domain}"`);
    expect(html).toContain('data-exclude-search="true"');
    expect(html).toContain('data-exclude-hash="true"');
    expect(html).toContain('data-do-not-track="true"');
    expect(html).toContain('data-auto-track="true"');
    expect(html).not.toContain("data-performance");
  });
});
