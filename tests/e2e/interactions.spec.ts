import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const experienceRows = "[data-experience-id]";
const toggles = "[data-experience-toggle]";
const panels = "[data-experience-panel]";
const productionOrigin = "https://gabrielrgoldstein.github.io";

test("has no automatically detectable accessibility violations", async ({ page }) => {
  await page.goto("/");

  const standardResults = await new AxeBuilder({ page }).analyze();
  const visibleLabelResults = await new AxeBuilder({ page })
    .withRules(["label-content-name-mismatch"])
    .analyze();

  expect([...standardResults.violations, ...visibleLabelResults.violations]).toEqual([]);

  await page.goto("/missing-page-for-batch-6");
  const notFoundResults = await new AxeBuilder({ page }).analyze();
  expect(notFoundResults.violations).toEqual([]);
});

test("serves portfolio discovery, sharing, and not-found assets", async ({ page, request }) => {
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

test("keeps the custom 404 page readable and inside the mobile gutter", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/missing-page-for-batch-6");

  const content = page.locator("main.not-found");
  const heading = content.getByRole("heading", { level: 1 });
  const returnLink = content.getByRole("link", { name: "Return to the portfolio" });
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
  test(`renders cleanly with local assets at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
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
    expect(metrics.thirdPartyResources).toEqual([]);
    expect(runtimeErrors).toEqual([]);

    const externalTabs = page.locator('a[target="_blank"]');
    for (let index = 0; index < (await externalTabs.count()); index += 1) {
      await expect(externalTabs.nth(index)).toHaveAttribute("rel", /noreferrer/);
    }

    await context.close();
  });
}

test("dispatches only allowlisted conversion events through the neutral browser adapter", async ({ page }) => {
  await page.addInitScript(() => {
    const events: Array<{ event: string; properties?: Record<string, string> }> = [];
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

  await expect(page.locator('script[src="https://cloud.umami.is/script.js"]')).toHaveCount(0);
  const authoredEvents = await page
    .locator("[data-analytics-event]")
    .evaluateAll((elements) => elements.map((element) => element.getAttribute("data-analytics-event")));
  expect(authoredEvents.sort()).toEqual([
    "email_click",
    "github_profile_click",
    "github_profile_click",
    "linkedin_click",
    "resume_download",
    "resume_download",
  ]);

  await page.locator('[data-analytics-event="email_click"]').evaluate((element) => {
    element.addEventListener("click", (event) => event.preventDefault(), { once: true });
    (element as HTMLElement).click();
  });
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
      event: "project_repository_click",
      properties: { project_id: "dependable-tools" },
    },
  ]);
});

test("uses a balanced 7/5 project hierarchy that stacks cleanly on mobile", async ({ browser }) => {
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const desktopPage = await desktop.newPage();
  await desktopPage.goto("/");

  const desktopCards = desktopPage.locator(".project-card");
  const wideBox = await desktopCards.nth(0).boundingBox();
  const narrowBox = await desktopCards.nth(1).boundingBox();

  expect(wideBox).not.toBeNull();
  expect(narrowBox).not.toBeNull();
  expect(wideBox!.y).toBe(narrowBox!.y);
  expect(wideBox!.width / narrowBox!.width).toBeGreaterThan(1.35);
  expect(wideBox!.width / narrowBox!.width).toBeLessThan(1.5);
  expect(wideBox!.height).toBeGreaterThan(narrowBox!.height);
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto("/");

  const mobileCards = mobilePage.locator(".project-card");
  const firstMobileBox = await mobileCards.nth(0).boundingBox();
  const secondMobileBox = await mobileCards.nth(1).boundingBox();
  const mobileWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);

  expect(firstMobileBox).not.toBeNull();
  expect(secondMobileBox).not.toBeNull();
  expect(firstMobileBox!.width).toBe(secondMobileBox!.width);
  expect(secondMobileBox!.y).toBeGreaterThan(firstMobileBox!.y + firstMobileBox!.height);
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

  const avatarSource = await page.locator(".github-identity__avatar").evaluate(
    (image: HTMLImageElement) => image.currentSrc,
  );
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
    const currentSource = await image.evaluate((element: HTMLImageElement) => element.currentSrc);
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
  test(`selects appropriate project covers at the stacked-card boundary at DPR ${deviceScaleFactor}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 850, height: 900 },
      deviceScaleFactor,
    });
    const page = await context.newPage();
    await page.goto("/");

    const images = await page.locator(".project-card__visual img").all();
    expect(images).toHaveLength(4);

    for (const image of images) {
      await image.scrollIntoViewIfNeeded();
      const renderedWidth = await image.evaluate(
        (element: HTMLImageElement) => element.getBoundingClientRect().width,
      );
      const currentSource = await image.evaluate((element: HTMLImageElement) => element.currentSrc);
      const sourceWidth = await page.evaluate(async (url) => {
        const response = await fetch(url);
        const bitmap = await createImageBitmap(await response.blob());
        const width = bitmap.width;
        bitmap.close();
        return width;
      }, currentSource);

      expect(renderedWidth).toBeGreaterThan(780);
      expect(sourceWidth).toBeGreaterThanOrEqual(Math.ceil(renderedWidth * deviceScaleFactor));
      if (deviceScaleFactor === 1) expect(sourceWidth).toBeLessThanOrEqual(800);
    }

    await context.close();
  });
}

test("avoids original-size covers after the project grid reaches its content cap", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1520, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto("/");

  const images = await page.locator(".project-card__visual img").all();
  expect(images).toHaveLength(4);

  for (const image of images) {
    await image.scrollIntoViewIfNeeded();
    const renderedWidth = await image.evaluate(
      (element: HTMLImageElement) => element.getBoundingClientRect().width,
    );
    const currentSource = await image.evaluate((element: HTMLImageElement) => element.currentSrc);
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

test("enhances the current role as the only initially expanded experience", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.goto("/#experience");

  const rows = page.locator(experienceRows);
  const buttons = page.locator(toggles);
  const details = page.locator(panels);

  await expect(rows).toHaveCount(4);
  await expect(buttons).toHaveCount(4);
  await expect(details).toHaveCount(4);

  await expect(buttons.first()).toBeVisible();
  await expect(buttons.first()).toHaveAttribute("aria-expanded", "true");
  await expect(buttons.first()).toContainText("Hide details");
  await expect(details.first()).toBeVisible();

  for (let index = 1; index < 4; index += 1) {
    await expect(buttons.nth(index)).toBeVisible();
    await expect(buttons.nth(index)).toHaveAttribute("aria-expanded", "false");
    await expect(buttons.nth(index)).toContainText("Show details");
    await expect(details.nth(index)).toBeHidden();
  }

  for (let index = 0; index < 4; index += 1) {
    const panelId = await buttons.nth(index).getAttribute("aria-controls");
    expect(panelId).not.toBeNull();
    await expect(page.locator(`#${panelId}`)).toHaveCount(1);
  }

  expect(runtimeErrors).toEqual([]);
});

test("supports single-open keyboard disclosure without moving focus", async ({ page }) => {
  await page.goto("/#experience");

  const buttons = page.locator(toggles);
  const details = page.locator(panels);
  const previousRoleButton = buttons.nth(1);

  await previousRoleButton.focus();
  await page.keyboard.press("Enter");

  await expect(buttons.first()).toHaveAttribute("aria-expanded", "false");
  await expect(details.first()).toBeHidden();
  await expect(previousRoleButton).toHaveAttribute("aria-expanded", "true");
  await expect(previousRoleButton).toContainText("Hide details");
  await expect(details.nth(1)).toBeVisible();
  await expect(previousRoleButton).toBeFocused();

  await page.keyboard.press("Space");

  await expect(previousRoleButton).toHaveAttribute("aria-expanded", "false");
  await expect(previousRoleButton).toContainText("Show details");
  await expect(details.nth(1)).toBeHidden();
  await expect(previousRoleButton).toBeFocused();
});

test("keeps mobile disclosure controls large enough without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#experience");

  const buttons = page.locator(toggles);
  await expect(buttons).toHaveCount(4);

  for (let index = 0; index < 4; index += 1) {
    const bounds = await buttons.nth(index).boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
  }

  const viewportMetrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(viewportMetrics.innerWidth).toBe(390);
  expect(viewportMetrics.scrollWidth).toBeLessThanOrEqual(viewportMetrics.innerWidth);
});

test("keeps every experience panel readable when JavaScript is unavailable", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto(`${baseURL}/#experience`);

  const buttons = page.locator(toggles);
  const details = page.locator(panels);
  await expect(buttons).toHaveCount(4);
  await expect(details).toHaveCount(4);

  for (let index = 0; index < 4; index += 1) {
    await expect(buttons.nth(index)).toBeHidden();
    await expect(details.nth(index)).toBeVisible();
  }

  await context.close();
});

test("removes smooth motion when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#experience");

  const motion = await page.evaluate(() => {
    const button = document.querySelector<HTMLElement>("[data-experience-toggle]");
    const styles = button ? getComputedStyle(button) : null;
    return {
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      transitionSeconds: styles ? Number.parseFloat(styles.transitionDuration) : null,
    };
  });

  expect(motion.scrollBehavior).toBe("auto");
  expect(motion.transitionSeconds).not.toBeNull();
  expect(motion.transitionSeconds!).toBeLessThanOrEqual(0.00001);
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
