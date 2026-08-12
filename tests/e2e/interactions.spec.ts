import { expect, test } from "@playwright/test";

const experienceRows = "[data-experience-id]";
const toggles = "[data-experience-toggle]";
const panels = "[data-experience-panel]";

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
