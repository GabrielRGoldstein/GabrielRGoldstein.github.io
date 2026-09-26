// Focused browser proof and new captures for the approved dialog-link layout.
import { chromium } from "@playwright/test";
import projects from "../src/data/projects.json" with { type: "json" };

const browser = await chromium.launch({ headless: true });
const cases = [
  ["desktop", 1440, 900, 1],
  ["mobile", 390, 844, 1],
  ["narrow", 320, 568, 1],
  ["zoom-equivalent-200", 360, 225, 1],
];
const selectors = {
  dialog: slug => `#project-${slug}-dialog`,
  trigger: slug => `[data-project-id="${slug}"] [data-project-dialog-trigger]`,
  fallback: slug => `[data-project-id="${slug}"] [data-project-dialog-fallback] a`,
};
function assert(condition, message) { if (!condition) throw new Error(message); }

try {
  for (const [label, width, height, dpr] of cases) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dpr });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("http://127.0.0.1:4337/", { waitUntil: "networkidle" });
    const baseOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert(!baseOverflow, `${label}: page horizontal overflow`);
    for (const project of projects) {
      const slug = project.slug;
      const expected = [
        ...(project.repositoryUrl ? [{ text: "View repository", href: project.repositoryUrl }] : []),
        ...(project.liveUrl ? [{ text: slug === "discord-clone" ? "View project (sign-in required)" : "View project", href: project.liveUrl }] : []),
      ];
      const trigger = page.locator(selectors.trigger(slug));
      await trigger.click();
      const dialog = page.locator(selectors.dialog(slug));
      assert(await dialog.evaluate(d => d.open), `${label}/${slug}: dialog did not open`);
      await dialog.locator("img").evaluate(async image => { await image.decode(); });
      const initial = await dialog.evaluate(d => ({ scrollHeight: d.scrollHeight, clientHeight: d.clientHeight, scrollWidth: d.scrollWidth, clientWidth: d.clientWidth }));
      const links = await dialog.locator(".project-dialog__links a").evaluateAll(elements => elements.map(a => {
        const r = a.getBoundingClientRect();
        return { text: a.textContent.trim(), href: a.href, target: a.target, rel: a.rel, rect: { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height } };
      }));
      assert(links.length === expected.length, `${label}/${slug}: wrong action count`);
      const close = await dialog.locator("[data-project-dialog-close]").evaluate(el => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
      });
      for (let i = 0; i < links.length; i++) {
        const action = links[i];
        assert(action.text === expected[i].text && action.href === expected[i].href && action.target === "_blank" && action.rel.includes("noreferrer"), `${label}/${slug}: wrong action ${i}`);
        assert(action.rect.height >= 44 && action.rect.width >= 44, `${label}/${slug}: undersized target ${i}`);
        assert(action.rect.right <= close.x || action.rect.bottom <= close.y || action.rect.y >= close.bottom, `${label}/${slug}: close overlaps action ${i}`);
        if (i) assert(action.rect.y >= links[i - 1].rect.bottom && Math.abs(action.rect.x - links[i - 1].rect.x) < 1, `${label}/${slug}: links not one left-aligned column`);
      }
      assert(initial.scrollWidth <= initial.clientWidth + 1, `${label}/${slug}: horizontal dialog overflow`);
      if (links.length) {
        await dialog.locator("[data-project-dialog-close]").focus();
        for (let i = 0; i < links.length; i++) {
          await page.keyboard.press("Tab");
          assert(await dialog.locator(".project-dialog__links a").nth(i).evaluate(el => document.activeElement === el), `${label}/${slug}: wrong keyboard tab order ${i}`);
        }
        const last = dialog.locator(".project-dialog__links a").last();
        await last.focus();
        const focused = await last.evaluate(el => {
          const r = el.getBoundingClientRect();
          const d = el.closest("dialog").getBoundingClientRect();
          return { active: document.activeElement === el, bottom: r.bottom, top: r.top, dialogBottom: d.bottom, dialogTop: d.top };
        });
        assert(focused.active && focused.top >= Math.max(0, focused.dialogTop) - 1 && focused.bottom <= Math.min(height, focused.dialogBottom) + 1, `${label}/${slug}: last action not reachable by keyboard/scroll`);
      }
      await dialog.locator("[data-project-dialog-close]").focus();
      assert(await dialog.locator("[data-project-dialog-close]").evaluate(el => document.activeElement === el && el.getBoundingClientRect().top >= 0 && el.getBoundingClientRect().bottom <= innerHeight), `${label}/${slug}: close unreachable`);
      if (["desktop", "mobile"].includes(label) && ["figma-clone", "discord-clone"].includes(slug)) {
        // Restore the decoded image to the view used for the existing baseline captures.
        await dialog.locator("img").scrollIntoViewIfNeeded();
        await page.screenshot({ path: `review/${label}-${slug}-stacked-dialog.png` });
      }
      await page.keyboard.press("Escape");
      assert(!(await dialog.evaluate(d => d.open)) && await trigger.evaluate(t => document.activeElement === t), `${label}/${slug}: Escape did not restore trigger focus`);
      console.log(JSON.stringify({ label, slug, links, scroll: initial, close, pageErrors: errors }));
    }
    assert(!errors.length, `${label}: page errors ${errors.join("; ")}`);
    await page.close();
  }
  const noJs = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await noJs.goto("http://127.0.0.1:4337/");
  for (const p of projects) {
    const links = await noJs.locator(selectors.fallback(p.slug)).evaluateAll(elements => elements.map(a => ({ text: a.textContent.trim(), href: a.href })));
    const expected = [...(p.repositoryUrl ? [{ text: "View repository", href: p.repositoryUrl }] : []), ...(p.liveUrl ? [{ text: p.slug === "discord-clone" ? "View project (sign-in required)" : "View project", href: p.liveUrl }] : [])];
    assert(JSON.stringify(links) === JSON.stringify(expected), `noJS/${p.slug}: incorrect direct links`);
  }
  await noJs.close();
  const failed = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await failed.addInitScript(() => { HTMLDialogElement.prototype.showModal = function () { throw Error("simulated failure"); }; });
  await failed.goto("http://127.0.0.1:4337/");
  await failed.locator(selectors.trigger("figma-clone")).click();
  const failedLinks = await failed.locator(selectors.fallback("figma-clone")).evaluateAll(elements => elements.map(a => a.href));
  assert(JSON.stringify(failedLinks) === JSON.stringify([projects[4].repositoryUrl, projects[4].liveUrl]) && await failed.locator(selectors.fallback("figma-clone")).first().isVisible(), "showModal failure: links missing");
  await failed.close();
  console.log("PASS: all viewports, no-JS links, and showModal-failure links");
} finally {
  await browser.close();
}
