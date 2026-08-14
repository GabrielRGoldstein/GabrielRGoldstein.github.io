import { readdir, readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parse } from "parse5";

const PROVIDER = "umami";
const SCRIPT_URL = "https://cloud.umami.is/script.js";
const DOMAIN = "gabrielrgoldstein.github.io";
const WEBSITE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMBEDDED_DOCUMENT_ELEMENTS = new Set(["iframe", "frame", "object", "embed"]);
const EXPECTED_ATTRIBUTE_NAMES = [
  "data-auto-track",
  "data-do-not-track",
  "data-domains",
  "data-exclude-hash",
  "data-exclude-search",
  "data-website-id",
  "defer",
  "src",
];

async function collectHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectHtmlFiles(path)));
    if (entry.isFile() && extname(entry.name) === ".html") files.push(path);
  }

  return files;
}

function collectScriptAttributes(html) {
  const parseErrors = [];
  const document = parse(html, {
    onParseError: (error) => parseErrors.push(error),
  });
  const duplicate = parseErrors.find((error) => error.code === "duplicate-attribute");

  if (duplicate) {
    throw new Error("Analytics build validation found a duplicate HTML attribute.");
  }

  const scripts = [];
  const visit = (node) => {
    if (EMBEDDED_DOCUMENT_ELEMENTS.has(node.tagName)) {
      throw new Error(
        `Analytics build validation forbids executable embedded document element <${node.tagName}>.`,
      );
    }

    if (node.tagName === "script") {
      scripts.push(new Map(node.attrs.map((attribute) => [attribute.name, attribute.value])));
    }

    for (const child of node.childNodes ?? []) visit(child);
  };

  visit(document);
  return scripts;
}

function resolveExpectedConfig(env) {
  const provider = env.PUBLIC_ANALYTICS_PROVIDER?.trim() ?? "";
  const websiteId = env.PUBLIC_UMAMI_WEBSITE_ID?.trim() ?? "";

  if (!provider && !websiteId) return null;
  if (provider !== PROVIDER || !WEBSITE_ID_PATTERN.test(websiteId)) {
    throw new Error(
      "Analytics configuration requires provider 'umami' and a valid public Umami website UUID.",
    );
  }

  return { websiteId };
}

function isAnalyticsLike(attributes) {
  const src = attributes.get("src") ?? "";
  return attributes.has("data-website-id") || /umami/i.test(src);
}

function validateTracker(attributes, websiteId) {
  const names = [...attributes.keys()].sort();
  const expectedValues = {
    src: SCRIPT_URL,
    "data-website-id": websiteId,
    "data-domains": DOMAIN,
    "data-auto-track": "true",
    "data-exclude-search": "true",
    "data-exclude-hash": "true",
    "data-do-not-track": "true",
    defer: "",
  };

  if (JSON.stringify(names) !== JSON.stringify(EXPECTED_ATTRIBUTE_NAMES)) return false;
  return Object.entries(expectedValues).every(
    ([name, value]) => attributes.get(name) === value,
  );
}

export async function validateAnalyticsBuild(rootDirectory, env = process.env) {
  const root = resolve(rootDirectory);
  const htmlFiles = await collectHtmlFiles(root);
  const config = resolveExpectedConfig(env);
  let trackerScripts = 0;
  const failures = [];

  if (htmlFiles.length === 0) {
    throw new Error("Analytics build validation found no generated HTML files.");
  }

  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    const scripts = collectScriptAttributes(html);
    const analyticsScripts = scripts.filter(isAnalyticsLike);
    trackerScripts += analyticsScripts.length;

    if (!config) {
      if (analyticsScripts.length > 0) {
        failures.push(`${file}: disabled analytics build emitted a tracker`);
      }
      continue;
    }

    if (
      analyticsScripts.length !== 1 ||
      !validateTracker(analyticsScripts[0], config.websiteId)
    ) {
      failures.push(`${file}: expected one exact privacy-configured Umami tracker`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Analytics build validation failed:\n${failures.join("\n")}`);
  }

  return {
    enabled: config !== null,
    htmlFiles: htmlFiles.length,
    trackerScripts,
  };
}

async function main() {
  const root = process.argv[2] ?? "dist";
  const result = await validateAnalyticsBuild(root);
  console.log(
    `Analytics build validation passed: ${result.htmlFiles} HTML files, ${result.trackerScripts} tracker scripts, enabled=${result.enabled}.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
