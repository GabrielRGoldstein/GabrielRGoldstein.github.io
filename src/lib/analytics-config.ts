export interface AnalyticsEnvironment {
  PUBLIC_ANALYTICS_PROVIDER?: string;
  PUBLIC_UMAMI_WEBSITE_ID?: string;
}

export interface AnalyticsConfig {
  provider: "umami";
  websiteId: string;
  scriptUrl: "https://cloud.umami.is/script.js";
  domain: "gabrielrgoldstein.github.io";
}

const UMAMI_WEBSITE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function resolveAnalyticsConfig(
  env: AnalyticsEnvironment,
): AnalyticsConfig | null {
  const provider = env.PUBLIC_ANALYTICS_PROVIDER?.trim() ?? "";
  const websiteId = env.PUBLIC_UMAMI_WEBSITE_ID?.trim() ?? "";

  if (!provider && !websiteId) return null;

  if (
    provider !== "umami" ||
    !UMAMI_WEBSITE_ID_PATTERN.test(websiteId)
  ) {
    throw new Error(
      "Analytics configuration requires provider 'umami' and a valid public Umami website UUID.",
    );
  }

  return {
    provider: "umami",
    websiteId,
    scriptUrl: "https://cloud.umami.is/script.js",
    domain: "gabrielrgoldstein.github.io",
  };
}
