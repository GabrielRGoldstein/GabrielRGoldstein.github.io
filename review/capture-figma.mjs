// Review-only browser capture; wait for the actual dialog image to decode.
import { chromium } from "@playwright/test";
import sharp from "sharp";

const browser = await chromium.launch({ headless: true });
try {
  for (const [label, width, height] of [["desktop", 1440, 900], ["mobile", 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("http://127.0.0.1:4337/", { waitUntil: "networkidle" });
    const title = page.locator('[data-project-id="figma-clone"] [data-project-dialog-trigger]');
    await title.scrollIntoViewIfNeeded();
    await page.locator('[data-project-id="figma-clone"] img').evaluate(async img => { await img.decode(); });
    await page.screenshot({ path: `review/${label}-figma-work.png`, fullPage: true });
    await page.screenshot({ path: `review/${label}-work.png`, fullPage: true });
    await title.focus();
    await page.screenshot({ path: `review/${label}-focus.png` });
    await title.click();
    const dialog = page.locator("#project-figma-clone-dialog");
    await dialog.waitFor({ state: "visible" });
    const image = dialog.locator("img");
    const details = await image.evaluate(async img => {
      await img.decode();
      return { complete: img.complete, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, url: img.currentSrc };
    });
    await image.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `review/${label}-figma-dialog.png` });
    await page.screenshot({ path: `review/${label}-dialog.png` });
    const bounds = await image.boundingBox();
    if (!bounds) throw new Error(`${label}: dialog image has no bounding box`);
    const imagePixels = await image.screenshot();
    const stats = await sharp(imagePixels).stats();
    console.log(JSON.stringify({ label, details, bounds, screenshotChannels: stats.channels.map(c => ({ min: c.min, max: c.max, stdev: c.stdev })), errors }));
    if (errors.length || details.naturalWidth !== 1600 || details.naturalHeight !== 797 || stats.channels.every(c => c.stdev < 1)) {
      throw new Error(`${label}: dialog failed render/decode/pixel-variance check`);
    }
    await page.close();
    const staticPage = await browser.newPage({ viewport: { width, height }, javaScriptEnabled: false });
    await staticPage.goto("http://127.0.0.1:4337/", { waitUntil: "load" });
    await staticPage.locator('[data-project-id="figma-clone"] img').evaluate(async img => { await img.decode(); });
    await staticPage.screenshot({ path: `review/${label}-no-js-work.png`, fullPage: true });
    await staticPage.close();
  }
} finally {
  await browser.close();
}
