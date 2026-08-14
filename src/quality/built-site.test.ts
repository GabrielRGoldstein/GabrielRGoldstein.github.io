import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import { scanBuiltSite } from "../../scripts/check-built-site.mjs";

const temporaryDirectories: string[] = [];

async function createSite(files: Record<string, string>) {
  const root = await mkdtemp(join(tmpdir(), "portfolio-built-site-"));
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

describe("built-site reference validation", () => {
  test("accepts existing internal routes, assets, CSS URLs, and fragments", async () => {
    const root = await createSite({
      "index.html": '<a href="/404.html">Missing page help</a><a href="#contact">Contact</a><img src="/images/cover.webp"><link rel="stylesheet" href="/_astro/site.css"><section id="contact"></section>',
      "404.html": '<a href="/">Home</a>',
      "images/cover.webp": "image",
      "_astro/site.css": '@font-face{src:url("/fonts/geist.woff2")}',
      "fonts/geist.woff2": "font",
    });

    await expect(scanBuiltSite(root)).resolves.toMatchObject({
      htmlFiles: 2,
      checkedReferences: 6,
    });
  });

  test("rejects missing internal files with the source document", async () => {
    const root = await createSite({
      "index.html": '<img src="/images/missing.webp">',
    });

    await expect(scanBuiltSite(root)).rejects.toThrow(
      "index.html -> /images/missing.webp",
    );
  });

  test("rejects missing fragments in the resolved target document", async () => {
    const root = await createSite({
      "index.html": '<a href="/details.html#evidence">Evidence</a>',
      "details.html": '<main id="summary"></main>',
    });

    await expect(scanBuiltSite(root)).rejects.toThrow(
      "details.html#evidence",
    );
  });
});
