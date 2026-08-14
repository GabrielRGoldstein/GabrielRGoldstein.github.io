import { createServer } from "node:http";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import {
  assertLighthouseReportIdentity,
  evaluateBudgets,
  isPortOpen,
  startOwnedPreview,
  stopOwnedPreview,
  verifyPreviewArtifact,
} from "../../scripts/lib/lighthouse-gate.mjs";

const temporaryDirectories: string[] = [];
const incumbentServers: ReturnType<typeof createServer>[] = [];

async function createStaticRoot(html: string) {
  const root = await mkdtemp(join(tmpdir(), "portfolio-lighthouse-"));
  temporaryDirectories.push(root);
  await mkdir(join(root, "dist"));
  await writeFile(join(root, "dist", "index.html"), html);
  return root;
}

async function listen(server: ReturnType<typeof createServer>, port: number) {
  incumbentServers.push(server);
  await new Promise<void>((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolveListen);
  });
}

async function closeServer(server: ReturnType<typeof createServer>) {
  if (!server.listening) return;
  const closed = new Promise<void>((resolveClose, reject) =>
    server.close((error) => (error ? reject(error) : resolveClose())),
  );
  server.closeAllConnections();
  await closed;
}

afterEach(async () => {
  await Promise.allSettled(incumbentServers.splice(0).map(closeServer));
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("Lighthouse runner ownership and evidence", () => {
  test("uses an owned dynamic port, verifies the built artifact, and closes cleanly", async () => {
    const incumbentSentinel = "<h1>unrelated incumbent</h1>";
    const incumbent = createServer((_request, response) => response.end(incumbentSentinel));
    await listen(incumbent, 4327);

    const expectedHtml = "<!doctype html><title>owned artifact</title><h1>Portfolio sentinel</h1>";
    const root = await createStaticRoot(expectedHtml);
    const owned = await startOwnedPreview(root);
    const ownedUrl = `http://127.0.0.1:${owned.port}/`;

    expect(owned.port).not.toBe(4327);
    await expect(verifyPreviewArtifact(ownedUrl, expectedHtml)).resolves.toBeUndefined();
    await expect(verifyPreviewArtifact(ownedUrl, incumbentSentinel)).rejects.toThrow(/artifact identity/i);

    await stopOwnedPreview(owned);
    expect(await isPortOpen(owned.host, owned.port)).toBe(false);
    expect(await (await fetch("http://127.0.0.1:4327/")).text()).toBe(incumbentSentinel);
  }, 15_000);

  test("rejects Lighthouse reports for a different page", () => {
    expect(() =>
      assertLighthouseReportIdentity(
        { finalDisplayedUrl: "http://127.0.0.1:54321/incumbent" },
        "http://127.0.0.1:54321/",
      ),
    ).toThrow(/audited URL/i);
  });

  test("force-closes an owned listener when graceful cleanup stalls", async () => {
    const server = createServer((_request, response) => response.end("owned"));
    await listen(server, 0);
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected a TCP listener");
    const never = new Promise<void>(() => undefined);
    const owned = {
      host: "127.0.0.1",
      port: address.port,
      server,
      closed: () => never,
      stop: () => never,
    };

    await expect(stopOwnedPreview(owned, 25)).rejects.toThrow(/did not close within 25ms/i);
    expect(await isPortOpen(owned.host, owned.port)).toBe(false);
  });

  test("fails when measured Lighthouse values breach a committed budget", () => {
    const assertions = {
      "categories:performance": ["error", { minScore: 0.9 }],
      "total-blocking-time": ["error", { maxNumericValue: 100 }],
    };
    const reports = [
      { categories: { performance: { score: 0.5 } }, audits: { "total-blocking-time": { numericValue: 0 } } },
      { categories: { performance: { score: 0.6 } }, audits: { "total-blocking-time": { numericValue: 0 } } },
    ];

    expect(() => evaluateBudgets(reports, assertions)).toThrow(/performance.*below 0\.9/i);
  });
});
