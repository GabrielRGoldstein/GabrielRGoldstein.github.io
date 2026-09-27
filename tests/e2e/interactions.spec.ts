import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator } from "@playwright/test";

import {
  hasExpectedAnalyticsResources,
  isProductionUrl,
  umamiScriptUrl,
} from "../support/production-origin";

const experienceRows = "[data-experience-id]";

async function expectFallbackMatchesDialog(card: Locator, dialog: Locator) {
  const fallback = card.locator("[data-project-dialog-fallback]");
  await expect(card.locator(".project-card__body > p")).toHaveText(
    await dialog.locator("[id$='-summary']").innerText(),
  );
  const fallbackStack = await fallback.locator("li").allTextContents();
  expect(fallbackStack).toEqual(
    await dialog.locator(".project-dialog__stack li").allTextContents(),
  );
  expect(fallbackStack.length).toBeGreaterThan(0);
  const fallbackLinks = await card.locator(".project-card__links a").evaluateAll((links) =>
    links.map((link) => (link as HTMLAnchorElement).href),
  );
  expect(fallbackLinks).toEqual(
    await dialog.locator(".project-dialog__links a").evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).href),
    ),
  );
  for (const link of await card.locator(".project-card__links a").all()) {
    await expect(link).toBeVisible();
  }
  const fallbackPending = await fallback
    .locator(".project-card__fallback-pending")
    .allTextContents();
  expect(fallbackPending).toEqual(
    await dialog.locator(".project-dialog__pending").allTextContents(),
  );
  for (const pending of await fallback.locator(".project-card__fallback-pending").all()) {
    await expect(pending).toBeVisible();
  }
}
const productionOrigin = "https://gabrielrgoldstein.github.io";
const productionAnalyticsEnabled = isProductionUrl();

test("has no automatically detectable accessibility violations", async ({
  page,
}) => {
  await page.goto("/");

  const standardResults = await new AxeBuilder({ page }).analyze();
  const visibleLabelResults = await new AxeBuilder({ page })
    .withRules(["label-content-name-mismatch"])
    .analyze();

  expect([
    ...standardResults.violations,
    ...visibleLabelResults.violations,
  ]).toEqual([]);

  await page.goto("/missing-page-for-batch-6");
  const notFoundResults = await new AxeBuilder({ page }).analyze();
  expect(notFoundResults.violations).toEqual([]);
});

test("serves portfolio discovery, sharing, and not-found assets", async ({
  page,
  request,
}) => {
  await page.goto("/");

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${productionOrigin}/`,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    `${productionOrigin}/`,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    `${productionOrigin}/og/portfolio-card.png`,
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    "content",
    `${productionOrigin}/og/portfolio-card.png`,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );

  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect((await robots.text()).replaceAll("\r\n", "\n").trim()).toBe(
    `User-agent: *\nAllow: /\n\nSitemap: ${productionOrigin}/sitemap.xml`,
  );

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()["content-type"]).toContain("xml");
  const sitemapXml = (await sitemap.text()).replaceAll("\r\n", "\n");
  expect(sitemapXml).toContain(`<loc>${productionOrigin}/</loc>`);
  expect(sitemapXml.match(/<url>/g)).toHaveLength(1);

  const socialCard = await request.get("/og/portfolio-card.png");
  expect(socialCard.status()).toBe(200);
  expect(socialCard.headers()["content-type"]).toContain("image/png");
  const socialCardBytes = await socialCard.body();
  expect(Array.from(socialCardBytes.subarray(0, 8))).toEqual([
    137, 80, 78, 71, 13, 10, 26, 10,
  ]);
  expect(socialCardBytes.readUInt32BE(16)).toBe(1200);
  expect(socialCardBytes.readUInt32BE(20)).toBe(630);
  const decodedSocialCard = await page.evaluate(async () => {
    const response = await fetch("/og/portfolio-card.png");
    const bitmap = await createImageBitmap(await response.blob());
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  });
  expect(decodedSocialCard).toEqual({ width: 1200, height: 630 });

  const favicon = await request.get("/favicon.svg");
  expect(favicon.status()).toBe(200);
  const faviconSvg = (await favicon.text()).replaceAll("\r\n", "\n").trim();
  expect(faviconSvg).toBe(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Gabriel Goldstein portfolio mark">\n' +
      '  <rect width="64" height="64" rx="12" fill="#07170d" />\n' +
      '  <path d="M14 18h16v7H21v14h9v-4h-5v-7h12v18H14V18Z" fill="#edf7bb" />\n' +
      '  <path d="M43 14h7L31 50h-7L43 14Z" fill="#b6e448" />\n' +
      "</svg>",
  );
  const decodedSvgFavicon = await page.evaluate(async () => {
    const image = new Image();
    image.src = "/favicon.svg";
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight };
  });
  expect(decodedSvgFavicon.width).toBeGreaterThan(0);
  expect(decodedSvgFavicon.height).toBeGreaterThan(0);

  const pngFavicon = await request.get("/favicon.png");
  expect(pngFavicon.status()).toBe(200);
  expect(pngFavicon.headers()["content-type"]).toContain("image/png");
  const faviconBytes = await pngFavicon.body();
  expect(Array.from(faviconBytes.subarray(0, 8))).toEqual([
    137, 80, 78, 71, 13, 10, 26, 10,
  ]);
  expect(faviconBytes.readUInt32BE(16)).toBe(64);
  expect(faviconBytes.readUInt32BE(20)).toBe(64);
  const decodedFavicon = await page.evaluate(async () => {
    const response = await fetch("/favicon.png");
    const bitmap = await createImageBitmap(await response.blob());
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  });
  expect(decodedFavicon).toEqual({ width: 64, height: 64 });

  const notFound = await request.get("/missing-page-for-batch-6");
  expect(notFound.status()).toBe(404);
  const notFoundHtml = await notFound.text();
  expect(notFoundHtml).toContain("Page not found");
  expect(notFoundHtml).toContain('href="/"');
  expect(notFoundHtml).toContain('name="robots" content="noindex, nofollow"');
});

test("keeps the custom 404 page readable and inside the mobile gutter", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/missing-page-for-batch-6");

  const content = page.locator("main.not-found");
  const heading = content.getByRole("heading", { level: 1 });
  const returnLink = content.getByRole("link", {
    name: "Return to the portfolio",
  });
  const contentBox = await content.boundingBox();
  const linkBox = await returnLink.boundingBox();
  const headingSize = await heading.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  );

  expect(contentBox).not.toBeNull();
  expect(contentBox!.x).toBeGreaterThanOrEqual(20);
  expect(contentBox!.width).toBeLessThanOrEqual(335);
  expect(headingSize).toBeGreaterThanOrEqual(38);
  expect(linkBox).not.toBeNull();
  expect(linkBox!.height).toBeGreaterThanOrEqual(44);
});

for (const width of [375, 768, 1280, 1600]) {
  test(`renders cleanly at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    const page = await context.newPage();
    const runtimeErrors: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });
    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    await page.goto("/", { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      await Promise.all([
        document.fonts.load("400 16px Geist"),
        document.fonts.load("500 16px Geist"),
        document.fonts.load("700 16px Geist"),
        document.fonts.load('500 16px "Geist Mono"'),
      ]);
    });

    const metrics = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      fonts: {
        regular: document.fonts.check("400 16px Geist"),
        medium: document.fonts.check("500 16px Geist"),
        bold: document.fonts.check("700 16px Geist"),
        mono: document.fonts.check('500 16px "Geist Mono"'),
      },
      thirdPartyResources: performance
        .getEntriesByType("resource")
        .map((entry) => entry.name)
        .filter((url) => !url.startsWith(window.location.origin)),
    }));

    expect(metrics.documentWidth).toBe(metrics.viewportWidth);
    expect(metrics.bodyWidth).toBe(metrics.viewportWidth);
    expect(Object.values(metrics.fonts).every(Boolean)).toBe(true);
    expect(hasExpectedAnalyticsResources(metrics.thirdPartyResources)).toBe(
      true,
    );
    expect(runtimeErrors).toEqual([]);

    const externalTabs = page.locator('a[target="_blank"]');
    for (let index = 0; index < (await externalTabs.count()); index += 1) {
      await expect(externalTabs.nth(index)).toHaveAttribute(
        "rel",
        /noreferrer/,
      );
    }

    await context.close();
  });
}

test("dispatches only allowlisted conversion events through the neutral browser adapter", async ({
  page,
}) => {
  await page.route(umamiScriptUrl, (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "",
    }),
  );
  await page.addInitScript(() => {
    const events: Array<{
      event: string;
      properties?: Record<string, string>;
    }> = [];
    Object.assign(window, {
      __portfolioAnalyticsEvents: events,
      umami: {
        track(event: string, properties?: Record<string, string>) {
          events.push({ event, properties });
        },
      },
    });
  });
  await page.goto("/");

  await expect(page.locator(`script[src="${umamiScriptUrl}"]`)).toHaveCount(
    productionAnalyticsEnabled ? 1 : 0,
  );
  const authoredEvents = await page
    .locator("[data-analytics-event]")
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-analytics-event")),
    );
  expect(authoredEvents.sort()).toEqual([
    "email_click",
    "github_profile_click",
    "github_profile_click",
    "linkedin_click",
    "project_demo_click",
    "project_demo_click",
    "project_demo_click",
    "project_demo_click",
    "project_demo_click",
    "project_demo_click",
    "project_repository_click",
    "project_repository_click",
    "project_repository_click",
    "project_repository_click",
    "project_repository_click",
    "project_repository_click",
    "resume_download",
    "resume_download",
  ]);

  await page
    .locator('[data-analytics-event="email_click"]')
    .evaluate((element) => {
      element.addEventListener("click", (event) => event.preventDefault(), {
        once: true,
      });
      (element as HTMLElement).click();
    });
  await page.locator("[data-project-dialog-trigger]").first().click();
  await page
    .locator('.project-dialog [data-analytics-event="project_repository_click"]')
    .first()
    .evaluate((element) => {
      element.addEventListener("click", (event) => event.preventDefault(), {
        once: true,
      });
      (element as HTMLElement).click();
    });
  await page.locator("[data-project-dialog-close]").first().click();
  await page.evaluate(() => {
    const button = document.createElement("button");
    button.dataset.analyticsEvent = "project_repository_click";
    button.dataset.analyticsProjectId = "dependable-tools";
    button.dataset.visitorEmail = "must-not-dispatch@example.com";
    document.body.append(button);
    button.click();
    button.remove();
  });

  const events = await page.evaluate(
    () =>
      (
        window as unknown as {
          __portfolioAnalyticsEvents: Array<{
            event: string;
            properties?: Record<string, string>;
          }>;
        }
      ).__portfolioAnalyticsEvents,
  );
  expect(events).toEqual([
    { event: "email_click", properties: undefined },
    {
      event: "project_open",
      properties: { project_id: "discord-clone" },
    },
    {
      event: "project_repository_click",
      properties: { project_id: "discord-clone" },
    },
    {
      event: "project_repository_click",
      properties: { project_id: "dependable-tools" },
    },
  ]);
});

test("groups the project heading and description as one editorial intro", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  const intro = page.locator(
    ".section-header--projects .section-header__intro",
  );
  const heading = intro.getByRole("heading", { level: 2 });
  const description = intro.locator("p");
  const count = page.locator(
    ".section-header--projects .section-header__count",
  );
  const introBox = await intro.boundingBox();
  const headingBox = await heading.boundingBox();
  const descriptionBox = await description.boundingBox();
  const countBox = await count.boundingBox();

  expect(introBox).not.toBeNull();
  expect(headingBox).not.toBeNull();
  expect(descriptionBox).not.toBeNull();
  expect(countBox).not.toBeNull();
  expect(Math.abs(headingBox!.x - descriptionBox!.x)).toBeLessThanOrEqual(1);
  expect(descriptionBox!.y).toBeGreaterThan(headingBox!.y + headingBox!.height);
  expect(countBox!.x).toBeGreaterThan(introBox!.x + introBox!.width);
  expect(countBox!.y + countBox!.height).toBeLessThanOrEqual(
    introBox!.y + introBox!.height + 1,
  );
});

test("gives project cards equivalent hover and keyboard-focus treatment", async ({
  page,
}) => {
  await page.goto("/#work");

  const card = page.locator(".project-card").first();
  const image = card.locator(".project-card__visual img");
  const trigger = card.locator("[data-project-dialog-trigger]");
  const resting = await card.evaluate((element) => ({
    borderColor: getComputedStyle(element).borderColor,
    transform: getComputedStyle(element).transform,
  }));

  await card.hover();
  await expect
    .poll(() => card.evaluate((element) => getComputedStyle(element).transform))
    .toBe("matrix(1, 0, 0, 1, 0, -5)");
  const hover = await card.evaluate((element) => ({
    borderColor: getComputedStyle(element).borderColor,
    transform: getComputedStyle(element).transform,
  }));
  expect(hover.borderColor).not.toBe(resting.borderColor);
  await expect
    .poll(() =>
      image.evaluate((element) => getComputedStyle(element).transform),
    )
    .not.toBe("none");

  await page.mouse.move(0, 0);
  await trigger.focus();
  await expect(trigger).toBeFocused();
  await expect
    .poll(() => card.evaluate((element) => getComputedStyle(element).transform))
    .toBe("matrix(1, 0, 0, 1, 0, -5)");
  await expect
    .poll(() =>
      card.evaluate((element) => getComputedStyle(element).borderColor),
    )
    .toBe(hover.borderColor);
});

test("opens project details from non-interactive card space without hijacking links", async ({
  page,
}) => {
  await page.goto("/#work");

  const card = page.locator(".project-card").first();
  const dialog = page.locator("[data-project-dialog]").first();
  const trigger = card.locator("[data-project-dialog-trigger]");
  const repository = dialog.getByRole("link", { name: "View repository" });

  await card.locator(".project-card__visual").click();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("[data-project-dialog-close]")).toBeFocused();
  await dialog.locator("[data-project-dialog-close]").click();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await repository.evaluate((link) =>
    link.addEventListener("click", (event) => event.preventDefault(), { once: true }),
  );
  await repository.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("opens project details by keyboard and restores focus for every close path", async ({
  page,
}) => {
  await page.goto("/#work");

  const triggers = page.locator("[data-project-dialog-trigger]");
  const dialogs = page.locator("[data-project-dialog]");
  const firstTrigger = triggers.first();
  const firstDialog = dialogs.first();

  await expect(triggers).toHaveCount(5);
  await expect(dialogs).toHaveCount(5);
  await expect(firstTrigger).toBeVisible();
  await expect(firstDialog).toBeHidden();
  await expect(
    page.locator(".project-card").first().locator("[data-project-dialog-fallback]"),
  ).toBeHidden();

  await firstTrigger.focus();
  await page.keyboard.press("Enter");
  await expect(firstDialog).toBeVisible();
  await expect(
    firstDialog.locator("[data-project-dialog-close]"),
  ).toBeFocused();
  await expect(page.locator("html")).toHaveClass(/project-dialog-open/);

  await firstDialog.locator("[data-project-dialog-close]").click();
  await expect(firstDialog).toBeHidden();
  await expect(firstTrigger).toBeFocused();
  await expect(page.locator("html")).not.toHaveClass(/project-dialog-open/);

  await page.keyboard.press("Space");
  await expect(firstDialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(firstDialog).toBeHidden();
  await expect(firstTrigger).toBeFocused();

  await firstTrigger.click();
  await page.mouse.click(4, 4);
  await expect(firstDialog).toBeHidden();
  await expect(firstTrigger).toBeFocused();
});

test("contains focus and passes accessibility checks inside a linkless project dialog", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#work");

  const mobileActions = page.locator(
    ".project-card__open:visible, .project-card__links a:visible",
  );
  expect(await mobileActions.count()).toBe(5);
  for (const action of await mobileActions.all()) {
    const bounds = await action.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
  }

  const trigger = page.locator("[data-project-dialog-trigger]").nth(2);
  const dialog = page.locator("[data-project-dialog]").nth(2);
  const closeButton = dialog.locator("[data-project-dialog-close]");
  await trigger.click();
  await expect(closeButton).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(closeButton).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(closeButton).toBeFocused();

  await page
    .locator(".site-header a")
    .first()
    .evaluate((element) => {
      (element as HTMLElement).focus();
    });
  await expect(closeButton).toBeFocused();
  const results = await new AxeBuilder({ page })
    .include("dialog[open]")
    .analyze();
  expect(results.violations).toEqual([]);

  const dialogBounds = await dialog.boundingBox();
  const closeBounds = await closeButton.boundingBox();
  expect(dialogBounds).not.toBeNull();
  expect(closeBounds).not.toBeNull();
  expect(dialogBounds!.width).toBeLessThanOrEqual(390);
  expect(dialogBounds!.height).toBeLessThanOrEqual(844);
  expect(dialogBounds!.x).toBeGreaterThanOrEqual(0);
  expect(dialogBounds!.y).toBeGreaterThanOrEqual(0);
  expect(dialogBounds!.x + dialogBounds!.width).toBeLessThanOrEqual(390);
  expect(dialogBounds!.y + dialogBounds!.height).toBeLessThanOrEqual(844);
  expect(closeBounds!.width).toBeGreaterThanOrEqual(44);
  expect(closeBounds!.height).toBeGreaterThanOrEqual(44);

  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();

  const linkedTrigger = page.locator("[data-project-dialog-trigger]").first();
  const linkedDialog = page.locator("[data-project-dialog]").first();
  const linkedClose = linkedDialog.locator("[data-project-dialog-close]");
  const repositoryLink = linkedDialog.getByRole("link", { name: /repository/i });
  await linkedTrigger.click();
  await expect(linkedClose).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(repositoryLink).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(linkedDialog.getByRole("link", { name: /sign-in required/i })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(linkedClose).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(linkedDialog.getByRole("link", { name: /sign-in required/i })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(repositoryLink).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(linkedClose).toBeFocused();
  const repositoryBounds = await repositoryLink.boundingBox();
  expect(repositoryBounds).not.toBeNull();
  expect(repositoryBounds!.width).toBeGreaterThanOrEqual(44);
  expect(repositoryBounds!.height).toBeGreaterThanOrEqual(44);
  const linkedResults = await new AxeBuilder({ page })
    .include("dialog[open]")
    .analyze();
  expect(linkedResults.violations).toEqual([]);
  await page.keyboard.press("Escape");
});

test("keeps every project action at least 44px at 375px", async ({ browser }) => {
  const enhanced = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await enhanced.newPage();
  await page.goto("/#work");

  const triggers = page.locator("[data-project-dialog-trigger]:visible");
  await expect(triggers).toHaveCount(5);
  for (const trigger of await triggers.all()) {
    const bounds = await trigger.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
  }

  for (let index = 0; index < 5; index += 1) {
    const trigger = triggers.nth(index);
    const dialog = page.locator("[data-project-dialog]").nth(index);
    await trigger.click();
    await expect(dialog).toBeVisible();
    const dialogBounds = await dialog.boundingBox();
    expect(dialogBounds).not.toBeNull();
    expect(dialogBounds!.x).toBeGreaterThanOrEqual(0);
    expect(dialogBounds!.y).toBeGreaterThanOrEqual(0);
    expect(dialogBounds!.x + dialogBounds!.width).toBeLessThanOrEqual(375);
    expect(dialogBounds!.y + dialogBounds!.height).toBeLessThanOrEqual(812);
    for (const action of await dialog.locator("button:visible, a:visible").all()) {
      const bounds = await action.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
    }
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  }
  await enhanced.close();

  const staticContext = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 375, height: 812 },
  });
  const staticPage = await staticContext.newPage();
  await staticPage.goto("/#work");
  const staticLinks = staticPage.locator(".project-card__links a:visible");
  await expect(staticLinks).toHaveCount(6);
  for (const link of await staticLinks.all()) {
    const bounds = await link.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
  }
  await staticContext.close();
});

test("suppresses project-open analytics when showModal fails", async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.addInitScript(() => {
    const events: Array<{
      event: string;
      properties?: Record<string, string>;
    }> = [];
    Object.assign(window, {
      __portfolioAnalyticsEvents: events,
      umami: {
        track(event: string, properties?: Record<string, string>) {
          events.push({ event, properties });
        },
      },
    });
    HTMLDialogElement.prototype.showModal = function showModalFailure() {
      throw new Error("Synthetic showModal failure");
    };
  });
  await page.goto("/");

  const cards = page.locator(".project-card");
  await expect(cards).toHaveCount(5);
  for (let index = 0; index < 5; index += 1) {
    const card = cards.nth(index);
    const trigger = card.locator("[data-project-dialog-trigger]");
    const dialog = page.locator("[data-project-dialog]").nth(index);
    const fallback = card.locator("[data-project-dialog-fallback]");
    await expect(trigger).toBeVisible();
    await expect(fallback).toBeHidden();
    await trigger.click();

    await expect(trigger).toBeHidden();
    await expect(dialog).toBeHidden();
    await expect(fallback).toBeVisible();
    await expect(fallback.getByText("Technologies")).toBeVisible();
    await expectFallbackMatchesDialog(card, dialog);
  }
  await expect(page.locator(".project-card__links a:visible")).toHaveCount(6);
  await expect(page.locator(".project-card__fallback-pending:visible")).toHaveCount(0);
  const events = await page.evaluate(
    () =>
      (
        window as unknown as {
          __portfolioAnalyticsEvents: Array<{
            event: string;
            properties?: Record<string, string>;
          }>;
        }
      ).__portfolioAnalyticsEvents,
  );
  expect(events).toEqual([]);
  expect(runtimeErrors).toEqual([]);
});

test("retains the static fallback when native dialog APIs are unavailable", async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "HTMLDialogElement", {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto("/");

  await expect(page.locator(".project-card")).toHaveCount(5);
  const triggers = page.locator("[data-project-dialog-trigger]");
  await expect(triggers).toHaveCount(5);
  for (let index = 0; index < 5; index += 1) {
    const card = page.locator(".project-card").nth(index);
    const fallback = card.locator("[data-project-dialog-fallback]");
    const dialog = page.locator("[data-project-dialog]").nth(index);
    await expect(triggers.nth(index)).toBeHidden();
    await expect(card.locator("h3")).toBeVisible();
    await expect(card.locator(".project-card__body > p")).toBeVisible();
    await expect(fallback).toBeVisible();
    await expectFallbackMatchesDialog(card, dialog);
    const fallbackStack = await fallback.locator("li").allTextContents();
    const dialogStack = await dialog.locator(".project-dialog__stack li").allTextContents();
    expect(fallbackStack).toEqual(dialogStack);
    expect(fallbackStack.length).toBeGreaterThan(0);
    const cardLinks = await card.locator(".project-card__links a").evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).href),
    );
    const dialogLinks = await dialog.locator(".project-dialog__links a").evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).href),
    );
    expect(cardLinks).toEqual(dialogLinks);
    for (const link of await card.locator(".project-card__links a").all()) {
      await expect(link).toBeVisible();
    }
  }
  await expect(
    page.locator(".project-card__fallback-pending:visible"),
  ).toHaveCount(0);
  expect(runtimeErrors).toEqual([]);
});

for (const unavailableMethod of ["showModal", "close"] as const) {
  test(`retains complete static details when dialog.${unavailableMethod} is unavailable`, async ({
    page,
  }) => {
    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    await page.addInitScript((method) => {
      Object.defineProperty(HTMLDialogElement.prototype, method, {
        configurable: true,
        value: undefined,
      });
    }, unavailableMethod);
    await page.goto("/");

    await expect(page.locator("[data-project-dialog-trigger]:visible")).toHaveCount(0);
    const cards = page.locator(".project-card");
    for (let index = 0; index < 5; index += 1) {
      const card = cards.nth(index);
      const dialog = page.locator("[data-project-dialog]").nth(index);
      await expect(card.locator("h3")).toBeVisible();
      await expect(card.locator(".project-card__body > p")).toBeVisible();
      await expect(card.locator("[data-project-dialog-fallback]")).toBeVisible();
      await expectFallbackMatchesDialog(card, dialog);
      for (const item of await card.locator("[data-project-dialog-fallback] li").all()) {
        await expect(item).toBeVisible();
      }
    }
    await expect(page.locator(".project-card__links a:visible")).toHaveCount(6);
    await expect(page.locator(".project-card__fallback-pending:visible")).toHaveCount(0);
    expect(runtimeErrors).toEqual([]);
  });
}

for (const relationship of [
  {
    attribute: "aria-labelledby",
    authoredId: "project-discord-clone-dialog-title",
  },
  {
    attribute: "aria-describedby",
    authoredId: "project-discord-clone-dialog-summary",
  },
] as const) {
  test(`does not enhance a project whose ${relationship.attribute} relationship is invalid`, async ({
    page,
  }) => {
    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    await page.route("**/", async (route) => {
      const response = await route.fetch();
      if (route.request().resourceType() !== "document") {
        await route.fulfill({ response });
        return;
      }
      const body = await response.text();
      const corrupted = body.replace(
        `${relationship.attribute}="${relationship.authoredId}"`,
        `${relationship.attribute}="project-discord-clone-dialog-missing"`,
      );
      expect(corrupted).not.toBe(body);
      await route.fulfill({ response, body: corrupted });
    });
    await page.goto("/");

    const firstCard = page.locator(".project-card").first();
    const firstDialog = page.locator("[data-project-dialog]").first();
    await expect(firstCard.locator("[data-project-dialog-trigger]")).toBeHidden();
    await expect(firstCard.locator("[data-project-dialog-fallback]")).toBeVisible();
    await expect(firstCard.locator("[data-project-dialog-fallback] li")).not.toHaveCount(0);
    await expectFallbackMatchesDialog(firstCard, firstDialog);
    await expect(
      page.locator(".project-card").nth(1).locator("[data-project-dialog-trigger]"),
    ).toBeVisible();
    expect(runtimeErrors).toEqual([]);
  });
}

test("contains a hostile Event target getter without breaking dialog controls", async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.goto("/");
  await page.evaluate(() => {
    Object.defineProperty(Event.prototype, "target", {
      configurable: true,
      get() {
        throw new Error("Synthetic hostile Event.target getter");
      },
    });
  });

  const trigger = page.locator("[data-project-dialog-trigger]").first();
  const dialog = page.locator("[data-project-dialog]").first();
  const closeButton = dialog.locator("[data-project-dialog-close]");

  await trigger.click();
  await expect(dialog).toHaveJSProperty("open", true);
  await closeButton.click();
  await expect(dialog).not.toHaveJSProperty("open", true);
  await trigger.click();
  await expect(dialog).toHaveJSProperty("open", true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toHaveJSProperty("open", true);
  await trigger.click();
  await expect(dialog).toHaveJSProperty("open", true);
  expect(runtimeErrors).toEqual([]);
});

test("keeps dialogs usable when analytics discovery or dispatch throws", async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.addInitScript(() => {
    let mode = 0;
    Object.defineProperty(window, "__setHostileAnalyticsMode", {
      value(nextMode: number) {
        mode = nextMode;
      },
    });
    Object.defineProperty(window, "umami", {
      configurable: true,
      get() {
        if (mode === 0) throw new Error("host getter failure");
        if (mode === 1) {
          const tracker = {};
          Object.defineProperty(tracker, "track", {
            get() {
              throw new Error("tracker getter failure");
            },
          });
          return tracker;
        }
        return {
          track() {
            throw new Error("dispatch failure");
          },
        };
      },
    });
  });
  await page.goto("/");
  const trigger = page.locator("[data-project-dialog-trigger]").first();
  const dialog = page.locator("[data-project-dialog]").first();
  const close = dialog.locator("[data-project-dialog-close]");

  for (const mode of [0, 1, 2]) {
    await page.evaluate((nextMode) => {
      (
        window as unknown as { __setHostileAnalyticsMode(mode: number): void }
      ).__setHostileAnalyticsMode(nextMode);
    }, mode);
    await trigger.click();
    await expect(dialog).toBeVisible();
    await close.click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  }

  await trigger.evaluate((element) => {
    Object.defineProperty(element, "dataset", {
      configurable: true,
      get() {
        throw new Error("dataset getter failure");
      },
    });
  });
  await trigger.click();
  await expect(dialog).toBeVisible();
  await close.click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(runtimeErrors).toEqual([]);
});

test("uses a balanced 7/5 project hierarchy without first-row dead space", async ({
  browser,
}) => {
  const desktop = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const desktopPage = await desktop.newPage();
  await desktopPage.goto("/");

  const desktopCards = desktopPage.locator(".project-card");
  const wideBox = await desktopCards.nth(0).boundingBox();
  const narrowBox = await desktopCards.nth(1).boundingBox();
  const nextRowBox = await desktopCards.nth(2).boundingBox();

  expect(wideBox).not.toBeNull();
  expect(narrowBox).not.toBeNull();
  expect(nextRowBox).not.toBeNull();
  expect(wideBox!.y).toBe(narrowBox!.y);
  expect(wideBox!.width / narrowBox!.width).toBeGreaterThan(1.35);
  expect(wideBox!.width / narrowBox!.width).toBeLessThan(1.5);

  const wideBottom = wideBox!.y + wideBox!.height;
  const narrowBottom = narrowBox!.y + narrowBox!.height;
  expect(Math.abs(wideBottom - narrowBottom)).toBeLessThanOrEqual(2);
  expect(
    nextRowBox!.y - Math.max(wideBottom, narrowBottom),
  ).toBeGreaterThanOrEqual(16);
  expect(
    nextRowBox!.y - Math.max(wideBottom, narrowBottom),
  ).toBeLessThanOrEqual(24);
  await desktop.close();

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 900 },
  });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto("/");

  const mobileCards = mobilePage.locator(".project-card");
  const firstMobileBox = await mobileCards.nth(0).boundingBox();
  const secondMobileBox = await mobileCards.nth(1).boundingBox();
  const mobileWidth = await mobilePage.evaluate(
    () => document.documentElement.scrollWidth,
  );

  expect(firstMobileBox).not.toBeNull();
  expect(secondMobileBox).not.toBeNull();
  expect(firstMobileBox!.width).toBe(secondMobileBox!.width);
  expect(secondMobileBox!.y).toBeGreaterThan(
    firstMobileBox!.y + firstMobileBox!.height,
  );
  expect(mobileWidth).toBe(390);
  await mobile.close();
});

test("selects right-sized responsive portfolio images", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 900 },
    deviceScaleFactor: 1.75,
  });
  const page = await context.newPage();
  await page.goto("/");

  const avatarSource = await page
    .locator(".github-identity__avatar")
    .evaluate((image: HTMLImageElement) => image.currentSrc);
  expect(avatarSource).toMatch(/avatar-128\.webp$/);
  const avatarDimensions = await page.evaluate(async (url) => {
    const response = await fetch(url);
    const bitmap = await createImageBitmap(await response.blob());
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  }, avatarSource);
  expect(avatarDimensions).toEqual({ width: 128, height: 128 });

  for (const image of await page.locator(".project-card__visual img").all()) {
    await image.scrollIntoViewIfNeeded();
    const currentSource = await image.evaluate(
      (element: HTMLImageElement) => element.currentSrc,
    );
    expect(currentSource).toMatch(/-640\.webp$/);
    const dimensions = await page.evaluate(async (url) => {
      const response = await fetch(url);
      const bitmap = await createImageBitmap(await response.blob());
      const size = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return size;
    }, currentSource);
    expect(dimensions).toEqual({ width: 640, height: 400 });
  }

  await context.close();
});

for (const deviceScaleFactor of [1, 2]) {
  test(`selects appropriate project covers at the stacked-card boundary at DPR ${deviceScaleFactor}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 850, height: 900 },
      deviceScaleFactor,
    });
    const page = await context.newPage();
    await page.goto("/");

    const images = await page.locator(".project-card__visual img").all();
    expect(images).toHaveLength(5);

    for (const image of images) {
      await image.scrollIntoViewIfNeeded();
      const renderedWidth = await image.evaluate(
        (element: HTMLImageElement) => element.getBoundingClientRect().width,
      );
      const currentSource = await image.evaluate(
        (element: HTMLImageElement) => element.currentSrc,
      );
      const sourceWidth = await page.evaluate(async (url) => {
        const response = await fetch(url);
        const bitmap = await createImageBitmap(await response.blob());
        const width = bitmap.width;
        bitmap.close();
        return width;
      }, currentSource);

      expect(renderedWidth).toBeGreaterThan(780);
      expect(sourceWidth).toBeGreaterThanOrEqual(
        Math.ceil(renderedWidth * deviceScaleFactor),
      );
      if (deviceScaleFactor === 1) expect(sourceWidth).toBeLessThanOrEqual(800);
    }

    await context.close();
  });
}

test("avoids original-size covers after the project grid reaches its content cap", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1520, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto("/");

  const images = await page.locator(".project-card__visual img").all();
  expect(images).toHaveLength(5);

  for (const image of images) {
    await image.scrollIntoViewIfNeeded();
    const renderedWidth = await image.evaluate(
      (element: HTMLImageElement) => element.getBoundingClientRect().width,
    );
    const currentSource = await image.evaluate(
      (element: HTMLImageElement) => element.currentSrc,
    );
    const sourceWidth = await page.evaluate(async (url) => {
      const response = await fetch(url);
      const bitmap = await createImageBitmap(await response.blob());
      const width = bitmap.width;
      bitmap.close();
      return width;
    }, currentSource);

    expect(sourceWidth).toBeGreaterThanOrEqual(Math.ceil(renderedWidth));
    expect(sourceWidth).toBeLessThanOrEqual(800);
  }

  await context.close();
});

test("shows approved Experience outcomes at the hash without disclosures", async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.goto("/#experience");

  const rows = page.locator(experienceRows);
  await expect(rows).toHaveCount(4);
  await expect(page.locator("#experience")).toBeInViewport();
  const outcomes = [
    "Established a shared Kanban workflow that clarified task status and ownership and helped return the project to schedule.",
    "Raised test-process automation from roughly 40% to 92.6%.",
    "Worked with more than 15 clients and built or maintained eight or more websites.",
    "Delivered more than 20 Power BI reports and helped cut combined project delivery time by 30%.",
  ];
  for (let index = 0; index < outcomes.length; index += 1) {
    await expect(rows.nth(index).locator(".experience-row__summary")).toHaveText(outcomes[index]);
    await expect(rows.nth(index).locator(".experience-row__summary")).toBeVisible();
  }
  await expect(page.locator("#experience button, [data-experience-toggle], [data-experience-panel]")).toHaveCount(0);

  expect(runtimeErrors).toEqual([]);
});

test("keeps Experience out of keyboard tab order and preserves contact résumé", async ({
  page,
}) => {
  await page.goto("/#experience");

  const resume = page.locator('.contact-footer a[href$="gabriel-goldstein-resume.pdf"]');
  await resume.focus();
  await expect(resume).toBeFocused();
  await expect(page.locator("#experience button, #experience a, #experience [tabindex]")).toHaveCount(0);
});

test("keeps both Freelance periods and visible outcomes on mobile without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#experience");

  await expect(page.locator(experienceRows)).toHaveCount(4);
  await expect(page.locator(experienceRows).nth(2).locator(".experience-row__period")).toHaveCount(2);
  for (const row of await page.locator(experienceRows).all()) {
    await expect(row.locator(".experience-row__summary")).toBeVisible();
  }

  const viewportMetrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(viewportMetrics.innerWidth).toBe(390);
  expect(viewportMetrics.scrollWidth).toBeLessThanOrEqual(
    viewportMetrics.innerWidth,
  );
});

test("keeps every Experience outcome readable when JavaScript is unavailable", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto(`${baseURL}/#experience`);

  const outcomes = page.locator(".experience-row__summary");
  await expect(outcomes).toHaveCount(4);

  for (let index = 0; index < 4; index += 1) {
    await expect(outcomes.nth(index)).toBeVisible();
  }

  await context.close();
});

test("keeps project cards readable and hides inert dialog controls without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto(`${baseURL}/#work`);

  await expect(page.locator(".project-card")).toHaveCount(5);
  const summaries = page.locator(".project-card__body > p");
  await expect(summaries).toHaveCount(5);
  for (let index = 0; index < 5; index += 1) {
    await expect(summaries.nth(index)).toBeVisible();
  }
  const fallbackDetails = page.locator(".project-card__fallback-details");
  await expect(fallbackDetails).toHaveCount(5);
  for (let index = 0; index < 5; index += 1) {
    const card = page.locator(".project-card").nth(index);
    const dialog = page.locator("[data-project-dialog]").nth(index);
    await expect(fallbackDetails.nth(index)).toBeVisible();
    await expect(fallbackDetails.nth(index).locator("li")).not.toHaveCount(0);
    await expectFallbackMatchesDialog(card, dialog);
  }
  const pendingStates = page.locator(".project-card__fallback-pending");
  await expect(pendingStates).toHaveCount(0);
  const staticProjectLinks = page.locator(".project-card__links a");
  await expect(staticProjectLinks).toHaveCount(6);
  await expect(staticProjectLinks.nth(0)).toHaveAttribute(
    "href",
    "https://github.com/GabrielRGoldstein/DiscordClone",
  );
  await expect(staticProjectLinks.nth(2)).toHaveAttribute(
    "href",
    "https://github.com/GabrielRGoldstein/Python-Trading-Bot",
  );
  const triggers = page.locator("[data-project-dialog-trigger]");
  await expect(triggers).toHaveCount(5);
  for (let index = 0; index < 5; index += 1) {
    await expect(triggers.nth(index)).toBeHidden();
  }
  await expect(page.locator("dialog[open]")).toHaveCount(0);

  await context.close();
});

test("removes project motion when reduced motion is requested", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#work");

  const card = page.locator(".project-card").first();
  await card.hover();
  await page.waitForTimeout(50);
  const motion = await page.evaluate(() => {
    const card = document.querySelector<HTMLElement>(".project-card");
    const image = document.querySelector<HTMLElement>(
      ".project-card__visual img",
    );

    const cardMatrix = card
      ? new DOMMatrixReadOnly(getComputedStyle(card).transform)
      : null;
    const imageMatrix = image
      ? new DOMMatrixReadOnly(getComputedStyle(image).transform)
      : null;
    return {
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      cardTranslationY: cardMatrix?.m42 ?? null,
      imageScaleX: imageMatrix?.m11 ?? null,
    };
  });

  expect(motion.scrollBehavior).toBe("auto");
  expect(motion.cardTranslationY).toBe(0);
  expect(motion.imageScaleX).toBe(1);
});

test("keeps the skip link offscreen until keyboard focus", async ({ page }) => {
  await page.goto("/");

  const skipLink = page.getByRole("link", { name: "Skip to content" });
  const initialBounds = await skipLink.boundingBox();
  expect(initialBounds).not.toBeNull();
  expect(initialBounds!.y + initialBounds!.height).toBeLessThanOrEqual(0);

  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();

  await expect
    .poll(async () => {
      const focusedBounds = await skipLink.boundingBox();
      return focusedBounds?.y ?? Number.NEGATIVE_INFINITY;
    })
    .toBeGreaterThanOrEqual(0);
});
