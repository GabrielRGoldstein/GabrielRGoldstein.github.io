export const expectedProductionOrigin = "https://gabrielrgoldstein.github.io";
export const umamiScriptUrl = "https://cloud.umami.is/script.js";
export const umamiGatewayUrl = "https://gateway.umami.is/api/send";

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

export function isProductionUrl(value = process.env.PRODUCTION_URL) {
  try {
    requireProductionUrl(value);
    return true;
  } catch {
    return false;
  }
}

export function hasExpectedAnalyticsResources(
  resources: readonly string[],
  productionUrl = process.env.PRODUCTION_URL,
) {
  const expected = isProductionUrl(productionUrl) ? [umamiGatewayUrl, umamiScriptUrl] : [];
  const actual = [...resources].sort();
  expected.sort();

  return actual.length === expected.length && actual.every((resource, index) => resource === expected[index]);
}
