import { readFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";

const root = new URL("../../", import.meta.url);
const readRepositoryFile = (path: string) => readFile(new URL(path, root), "utf8");
const immutableAction = /uses:\s*[\w.-]+\/[\w.-]+(?:\/[\w.-]+)?@([a-f\d]{40})(?:\s|$)/g;

describe("GitHub automation policy", () => {
  test("quality automation is least-privilege, reproducible, and retains useful reports", async () => {
    const workflow = await readRepositoryFile(".github/workflows/quality.yml");
    const actionUses = [...workflow.matchAll(/uses:\s*([^\s]+)/g)];

    expect(workflow).toContain("pull_request:");
    expect(workflow).toMatch(/push:[\s\S]*branches:\s*\[main\]/);
    expect(workflow).toMatch(/permissions:\s*\n\s*contents:\s*read/);
    expect(workflow).not.toMatch(/permissions:\s*write-all/);
    expect(actionUses.length).toBeGreaterThan(0);
    expect([...workflow.matchAll(immutableAction)]).toHaveLength(actionUses.length);
    expect(workflow).toContain("persist-credentials: false");
    expect(workflow).toContain("npm ci");
    expect(workflow).toContain("npm run quality");
    expect(workflow).toContain("npx playwright install --with-deps chromium");
    expect(workflow).toContain("if: failure()");
    expect(workflow).toContain("playwright-report/");
    expect(workflow).toContain("npm run lighthouse");
    expect(workflow).toContain(".lighthouseci/");

    const playwrightConfig = await readRepositoryFile("playwright.config.ts");
    expect(playwrightConfig).toContain('process.env.CI ? [["list"], ["html", { open: "never" }]] : "list"');
  });

  test("security automation runs CodeQL and secret scanning with bounded permissions", async () => {
    const workflow = await readRepositoryFile(".github/workflows/security.yml");
    const actionUses = [...workflow.matchAll(/uses:\s*([^\s]+)/g)];

    expect(workflow).toContain("pull_request:");
    expect(workflow).toMatch(/schedule:[\s\S]*cron:/);
    expect(workflow).toContain("security-events: write");
    expect(workflow).not.toMatch(/permissions:\s*write-all/);
    expect(actionUses.length).toBeGreaterThan(0);
    expect([...workflow.matchAll(immutableAction)]).toHaveLength(actionUses.length);
    expect(workflow.match(/persist-credentials:\s*false/g)).toHaveLength(2);
    expect(workflow).toContain("github/codeql-action/init@");
    expect(workflow).toContain("github/codeql-action/analyze@");
    expect(workflow).toContain("gitleaks/gitleaks-action@");

    const securityPolicy = await readRepositoryFile("SECURITY.md");
    const site = JSON.parse(await readRepositoryFile("src/data/site.json"));
    expect(securityPolicy).toContain(site.email);
    expect(securityPolicy).toMatch(/do not (?:open|file) a public issue/i);
    expect(securityPolicy).toMatch(/private vulnerability reporting.*Batch 8/i);
  });

  test("Dependabot maintains npm and immutable GitHub Actions dependencies weekly", async () => {
    const config = await readRepositoryFile(".github/dependabot.yml");

    expect(config).toContain('package-ecosystem: "npm"');
    expect(config).toContain('package-ecosystem: "github-actions"');
    expect(config.match(/interval:\s*"weekly"/g)).toHaveLength(2);
    expect(config.match(/open-pull-requests-limit:/g)).toHaveLength(2);
  });

  test("Lighthouse configuration enforces score and user-experience budgets", async () => {
    const config = JSON.parse(await readRepositoryFile("lighthouserc.json"));
    const assertions = config.ci.assert.assertions;

    expect(config.ci.collect.staticDistDir).toBe("./dist");
    expect(config.ci.collect.numberOfRuns).toBeGreaterThanOrEqual(2);
    expect(assertions["categories:performance"][1].minScore).toBeGreaterThanOrEqual(0.9);
    expect(assertions["categories:accessibility"][1].minScore).toBe(1);
    expect(assertions["categories:best-practices"][1].minScore).toBe(1);
    expect(assertions["categories:seo"][1].minScore).toBe(1);
    expect(assertions["cumulative-layout-shift"][1].maxNumericValue).toBeLessThanOrEqual(0.05);
    expect(assertions["total-blocking-time"][1].maxNumericValue).toBeLessThanOrEqual(100);
  });
});
