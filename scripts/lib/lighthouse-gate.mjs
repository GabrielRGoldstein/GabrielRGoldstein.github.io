import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, readFile, rm } from "node:fs/promises";
import { createConnection } from "node:net";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const require = createRequire(import.meta.url);

function withTimeout(promise, timeoutMs, message) {
  let timeout;
  return Promise.race([
    promise.finally(() => clearTimeout(timeout)),
    new Promise((_, reject) => {
      timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

function median(values) {
  const ordered = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0
    ? (ordered[midpoint - 1] + ordered[midpoint]) / 2
    : ordered[midpoint];
}

export function evaluateBudgets(reports, assertions) {
  const failures = [];
  const measured = {};

  for (const [audit, [, threshold]] of Object.entries(assertions)) {
    const values = audit.startsWith("categories:")
      ? reports.map((report) => report.categories[audit.slice("categories:".length)].score)
      : reports.map((report) => report.audits[audit].numericValue);
    const value = median(values);
    measured[audit] = value;

    if ("minScore" in threshold && value < threshold.minScore) {
      failures.push(`${audit}: ${value} is below ${threshold.minScore}`);
    }
    if ("maxNumericValue" in threshold && value > threshold.maxNumericValue) {
      failures.push(`${audit}: ${value} exceeds ${threshold.maxNumericValue}`);
    }
  }

  if (failures.length > 0) throw new Error(`Lighthouse budgets failed:\n${failures.join("\n")}`);
  return measured;
}

export async function startOwnedPreview(root, startPreview) {
  const astroEntry = pathToFileURL(require.resolve("astro")).href;
  const preview = startPreview ?? (await import(astroEntry)).preview;
  if (typeof preview !== "function") throw new Error("Astro preview API is unavailable");
  const owned = await preview({
    root,
    logLevel: "silent",
    server: { host: "127.0.0.1", port: 0 },
  });

  if (!Number.isInteger(owned.port) || owned.port <= 0 || owned.host !== "127.0.0.1") {
    await owned.stop();
    throw new Error("Astro preview did not return an owned loopback port");
  }
  return owned;
}

export async function verifyPreviewArtifact(previewUrl, expectedHtml, fetchPage = fetch) {
  const response = await fetchPage(previewUrl);
  if (!response.ok) throw new Error(`Owned preview returned HTTP ${response.status}`);
  const actualHtml = await response.text();
  if (actualHtml !== expectedHtml) {
    throw new Error("Owned preview artifact identity does not match dist/index.html");
  }
}

export function assertLighthouseReportIdentity(report, previewUrl) {
  const auditedUrl = report.finalDisplayedUrl ?? report.finalUrl;
  if (!auditedUrl || new URL(auditedUrl).href !== new URL(previewUrl).href) {
    throw new Error(`Lighthouse audited URL ${auditedUrl ?? "<missing>"} instead of ${previewUrl}`);
  }
}

export function isPortOpen(host, port, timeoutMs = 500) {
  return new Promise((resolveConnection) => {
    const socket = createConnection({ host, port });
    const finish = (connected) => {
      socket.destroy();
      resolveConnection(connected);
    };
    socket.setTimeout(timeoutMs, () => finish(false));
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
  });
}

async function forceCloseOwnedServer(owned, timeoutMs = 1_000) {
  if (!owned.server?.listening) return;
  const closed = new Promise((resolveClose, reject) => {
    owned.server.close((error) => (error ? reject(error) : resolveClose()));
  });
  owned.server.closeAllConnections?.();
  await withTimeout(closed, timeoutMs, `Forced preview cleanup exceeded ${timeoutMs}ms`);
}

export async function stopOwnedPreview(owned, timeoutMs = 3_000) {
  const closed = owned.closed();
  let gracefulError;
  try {
    await withTimeout(
      Promise.all([closed, owned.stop()]),
      timeoutMs,
      `Astro preview on ${owned.host}:${owned.port} did not close within ${timeoutMs}ms`,
    );
  } catch (error) {
    gracefulError = error;
    await forceCloseOwnedServer(owned);
  }
  if (await isPortOpen(owned.host, owned.port)) {
    throw new Error(`Astro preview port ${owned.host}:${owned.port} remains open after cleanup`);
  }
  if (gracefulError) throw gracefulError;
}

function waitForSuccessfulExit(child, label) {
  return new Promise((resolveExit, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolveExit();
      else reject(new Error(`${label} exited with ${code ?? signal}`));
    });
  });
}

async function runLighthouse(root, previewUrl, reportDirectory, index) {
  const reportPath = resolve(reportDirectory, `run-${index + 1}.json`);
  const lighthouseCli = resolve(root, "node_modules/lighthouse/cli/index.js");
  const child = spawn(
    process.execPath,
    [
      lighthouseCli,
      previewUrl,
      "--quiet",
      "--preset=desktop",
      "--only-categories=performance,accessibility,best-practices,seo",
      "--output=json",
      `--output-path=${reportPath}`,
      "--chrome-flags=--headless --no-sandbox --disable-gpu",
    ],
    {
      cwd: root,
      env: { ...process.env, CHROME_PATH: chromium.executablePath() },
      stdio: "inherit",
    },
  );
  await waitForSuccessfulExit(child, `Lighthouse run ${index + 1}`);
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  assertLighthouseReportIdentity(report, previewUrl);
  return report;
}

export async function runLighthouseGate(root = process.cwd()) {
  const config = JSON.parse(await readFile(resolve(root, "lighthouserc.json"), "utf8"));
  const runCount = config.ci.collect.numberOfRuns;
  const assertions = config.ci.assert.assertions;
  const staticDirectory = resolve(root, config.ci.collect.staticDistDir);
  const expectedHtml = await readFile(resolve(staticDirectory, "index.html"), "utf8");
  const reportDirectory = resolve(root, ".lighthouseci");

  if (!Number.isInteger(runCount) || runCount < 1) {
    throw new Error("Lighthouse numberOfRuns must be a positive integer");
  }

  await rm(reportDirectory, { recursive: true, force: true });
  await mkdir(reportDirectory, { recursive: true });

  const owned = await startOwnedPreview(root);
  const previewUrl = `http://${owned.host}:${owned.port}/`;
  try {
    await verifyPreviewArtifact(previewUrl, expectedHtml);
    const reports = [];
    for (let index = 0; index < runCount; index += 1) {
      reports.push(await runLighthouse(root, previewUrl, reportDirectory, index));
    }
    const measured = evaluateBudgets(reports, assertions);
    console.log(`Lighthouse budgets passed across ${runCount} runs.`);
    for (const [audit, value] of Object.entries(measured)) console.log(`${audit}: ${value}`);
    return measured;
  } finally {
    await stopOwnedPreview(owned);
  }
}
