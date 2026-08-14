import { readFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";
import { parse } from "yaml";

const root = new URL("../../", import.meta.url);
const readRepositoryFile = (path: string) => readFile(new URL(path, root), "utf8");
const immutableAction = /uses:\s*[\w.-]+\/[\w.-]+(?:\/[\w.-]+)?@([a-f\d]{40})(?:\s|$)/g;

describe("GitHub automation policy", () => {
  test("Astro builds canonical metadata for the confirmed root production origin", async () => {
    const { default: astroConfig } = await import("../../astro.config.mjs");

    expect(astroConfig.site).toBe("https://gabrielrgoldstein.github.io");
    expect(astroConfig.base ?? "/").toBe("/");

    const packageJson = JSON.parse(await readRepositoryFile("package.json"));
    expect(packageJson.scripts["test:production"]).toBe(
      "playwright test --config=playwright.production.config.ts",
    );
  });

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

    const parsedWorkflow = parse(workflow);
    const verifySteps = parsedWorkflow.jobs.verify.steps;
    const lighthouseStep = verifySteps.find((step: { name?: string }) => step.name === "Run Lighthouse budgets");
    const lighthouseUpload = verifySteps.find((step: { name?: string }) => step.name === "Upload Lighthouse reports");
    expect(lighthouseStep).toMatchObject({ id: "lighthouse", run: "npm run lighthouse" });
    expect(lighthouseUpload.if).toBe("always() && steps.lighthouse.outcome != 'skipped'");
    expect(lighthouseUpload.with).toMatchObject({
      path: ".lighthouseci/",
      "include-hidden-files": true,
      "if-no-files-found": "error",
      "retention-days": 7,
    });

    const playwrightConfig = await readRepositoryFile("playwright.config.ts");
    expect(playwrightConfig).toContain('process.env.CI ? [["list"], ["html", { open: "never" }]] : "list"');
  });

  test("main pushes deploy the verified dist artifact with job-scoped Pages permissions", async () => {
    const source = await readRepositoryFile(".github/workflows/quality.yml");
    const workflow = parse(source);
    const deployCondition = "github.event_name == 'push' && github.ref == 'refs/heads/main'";
    const verifySteps = workflow.jobs.verify.steps;
    const lighthouseIndex = verifySteps.findIndex((step: { run?: string }) => step.run === "npm run lighthouse");
    const configureIndex = verifySteps.findIndex(
      (step: { uses?: string }) =>
        step.uses === "actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d",
    );
    const uploadIndex = verifySteps.findIndex(
      (step: { uses?: string }) =>
        step.uses === "actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9",
    );
    const uploadStep = verifySteps[uploadIndex];
    const deploy = workflow.jobs.deploy;

    expect(workflow.permissions).toEqual({ contents: "read" });
    expect(workflow.jobs.verify.permissions).toEqual({ contents: "read", pages: "read" });
    expect(configureIndex).toBeGreaterThan(lighthouseIndex);
    expect(uploadIndex).toBeGreaterThan(configureIndex);
    expect(verifySteps[configureIndex].if).toBe(deployCondition);
    expect(uploadStep.if).toBe(deployCondition);
    expect(uploadStep.with.path).toBe("./dist");
    expect(deploy.if).toBe(deployCondition);
    expect(deploy.needs).toBe("verify");
    expect(deploy.permissions).toEqual({ pages: "write", "id-token": "write" });
    expect(deploy.environment).toEqual({
      name: "github-pages",
      url: "${{ steps.deployment.outputs.page_url }}",
    });
    expect(deploy.steps).toContainEqual({
      name: "Deploy to GitHub Pages",
      id: "deployment",
      uses: "actions/deploy-pages@cd2ce8fcbc39b97be8ca5fce6e763baed58fa128",
    });
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
    expect(workflow).not.toContain("gitleaks/gitleaks-action@");

    const parsedWorkflow = parse(workflow);
    const secretSteps = parsedWorkflow.jobs.secrets.steps;
    const secretCheckout = secretSteps.find((step: { name?: string }) => step.name === "Check out complete history");
    expect(secretCheckout.with["fetch-depth"]).toBe(0);

    const scanStep = secretSteps.find(
      (step: { name?: string }) => step.name === "Scan complete history for committed secrets",
    );
    expect(scanStep.env).toEqual({
      GITLEAKS_VERSION: "8.30.1",
      GITLEAKS_ARCHIVE: "gitleaks_8.30.1_linux_x64.tar.gz",
      GITLEAKS_SHA256: "551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb",
    });

    const scanRun = scanStep.run as string;
    const scanLines = scanRun.split("\n").map((line) => line.trim());
    expect(scanRun).toContain(
      "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/${GITLEAKS_ARCHIVE}",
    );
    expect(scanLines).toContain(
      `printf '%s  %s\\n' "\${GITLEAKS_SHA256}" "\${tool_dir}/\${GITLEAKS_ARCHIVE}" | sha256sum --check --strict`,
    );
    expect(scanLines).toContain(
      `tar -xzf "\${tool_dir}/\${GITLEAKS_ARCHIVE}" -C "\${tool_dir}" gitleaks`,
    );
    expect(scanLines).toContain(
      `test "$(git -C "$GITHUB_WORKSPACE" rev-parse --is-inside-work-tree)" = "true"`,
    );
    expect(scanLines.filter((line) => line.startsWith('"${tool_dir}/gitleaks" git'))).toEqual([
      `"\${tool_dir}/gitleaks" git "$GITHUB_WORKSPACE" --redact --no-banner`,
    ]);
    expect(scanRun).not.toMatch(
      /--log-opts|github\.event|GITHUB_(?:SHA|BASE_REF|HEAD_REF)|(?:HEAD|[0-9a-f]{7,40})[~^]|\.\./,
    );

    const securityPolicy = await readRepositoryFile("SECURITY.md");
    const site = JSON.parse(await readRepositoryFile("src/data/site.json"));
    expect(securityPolicy).toContain(site.email);
    expect(securityPolicy).toMatch(/do not (?:open|file) a public issue/i);
    expect(securityPolicy).toMatch(/private vulnerability reporting is enabled and API-verified/i);
    expect(securityPolicy).toContain("GabrielRGoldstein/GabrielRGoldstein.github.io");
    expect(securityPolicy).toContain(
      "https://github.com/GabrielRGoldstein/GabrielRGoldstein.github.io/security/advisories/new",
    );
    expect(securityPolicy).not.toMatch(/cannot be promised|wait until Batch 8/i);
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
