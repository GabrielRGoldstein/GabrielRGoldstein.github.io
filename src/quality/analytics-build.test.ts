import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import { validateAnalyticsBuild } from "../../scripts/check-analytics-build.mjs";

const temporaryDirectories: string[] = [];
const websiteId = ["00000000", "0000", "4000", "8000", "000000000001"].join("-");
const enabledEnv = {
  PUBLIC_ANALYTICS_PROVIDER: "umami",
  PUBLIC_UMAMI_WEBSITE_ID: websiteId,
};
const tracker = `<script defer src="https://cloud.umami.is/script.js" data-website-id="${websiteId}" data-domains="gabrielrgoldstein.github.io" data-auto-track="true" data-exclude-search="true" data-exclude-hash="true" data-do-not-track="true"></script>`;

async function createSite(files: Record<string, string>) {
  const root = await mkdtemp(join(tmpdir(), "portfolio-analytics-build-"));
  temporaryDirectories.push(root);

  for (const [relativePath, content] of Object.entries(files)) {
    const destination = join(root, relativePath);
    await mkdir(join(destination, ".."), { recursive: true });
    await writeFile(destination, content);
  }

  return root;
}

afterEach(async () => {
  const { rm } = await import("node:fs/promises");
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("analytics build validation", () => {
  test("accepts a disabled build only when no Umami tracker is emitted", async () => {
    const root = await createSite({ "index.html": "<main>Portfolio</main>" });

    await expect(validateAnalyticsBuild(root, {})).resolves.toEqual({
      enabled: false,
      htmlFiles: 1,
      trackerScripts: 0,
    });
  });

  test("accepts exactly one privacy-configured tracker in every enabled page", async () => {
    const root = await createSite({
      "index.html": `<head>${tracker}</head>`,
      "404.html": `<head>${tracker}</head>`,
    });

    await expect(validateAnalyticsBuild(root, enabledEnv)).resolves.toEqual({
      enabled: true,
      htmlFiles: 2,
      trackerScripts: 2,
    });
  });

  test("detects a tracker when a quoted value contains a tag boundary", async () => {
    const browserExecutableTracker = tracker.replace(
      "<script ",
      '<script data-note=">" ',
    );
    const root = await createSite({ "index.html": browserExecutableTracker });

    await expect(validateAnalyticsBuild(root, {})).rejects.toThrow(/disabled analytics build/i);
  });

  test("rejects executable nested documents in disabled mode", async () => {
    const nestedTracker = tracker.replaceAll('"', "&quot;");
    const root = await createSite({
      "index.html": `<iframe srcdoc="${nestedTracker}"></iframe>`,
    });

    await expect(validateAnalyticsBuild(root, {})).rejects.toThrow(/embedded document/i);
  });

  test("detects browser-normalized mixed-case tracker markup", async () => {
    const mixedCaseTracker = tracker
      .replace("<script", "<ScRiPt")
      .replace('src="https://cloud.umami.is/script.js"', 'SrC="https://cloud.umami.is/script.js"');
    const root = await createSite({ "index.html": mixedCaseTracker });

    await expect(validateAnalyticsBuild(root, {})).rejects.toThrow(/disabled analytics build/i);
  });

  test("ignores tracker-looking markup inside an inert HTML comment", async () => {
    const root = await createSite({ "index.html": `<!-- ${tracker} -->` });

    await expect(validateAnalyticsBuild(root, {})).resolves.toEqual({
      enabled: false,
      htmlFiles: 1,
      trackerScripts: 0,
    });
  });

  test("rejects a valueless security-sensitive tracker attribute", async () => {
    const valuelessIdentity = tracker.replace(
      `data-website-id="${websiteId}"`,
      "data-website-id",
    );
    const root = await createSite({ "index.html": valuelessIdentity });

    await expect(validateAnalyticsBuild(root, enabledEnv)).rejects.toThrow(
      /analytics build validation/i,
    );
  });

  test("rejects duplicate tracker attributes before browser interpretation", async () => {
    for (const ambiguousTracker of [
      tracker.replace(
        'src="https://cloud.umami.is/script.js"',
        'src="https://attacker.invalid/collect.js" src="https://cloud.umami.is/script.js"',
      ),
      tracker.replace(
        `data-website-id="${websiteId}"`,
        `data-website-id="attacker-value" data-website-id="${websiteId}"`,
      ),
    ]) {
      const root = await createSite({ "index.html": ambiguousTracker });
      await expect(validateAnalyticsBuild(root, enabledEnv)).rejects.toThrow(/duplicate/i);
    }
  });

  test("rejects emitted analytics in disabled mode and malformed enabled output", async () => {
    const disabledRoot = await createSite({ "index.html": tracker });
    await expect(validateAnalyticsBuild(disabledRoot, {})).rejects.toThrow(
      /disabled analytics build/i,
    );

    const malformedRoot = await createSite({
      "index.html": tracker.replace(' data-do-not-track="true"', ""),
    });
    await expect(validateAnalyticsBuild(malformedRoot, enabledEnv)).rejects.toThrow(
      /analytics build validation/i,
    );
  });
});
