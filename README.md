# Gabriel Goldstein Portfolio

Production source for Gabriel Goldstein's software-engineering portfolio.

The site is a static Astro project. Design studies and portable wireframes remain outside this repository under the parent `Portfolio Rework/sketches/` workspace.

## Current design direction

- Original project-gallery layout
- Refined DMG color system
- Geist + Geist Mono typography
- Inline GitHub identity
- Selected projects above expandable professional experience
- No standalone About section
- Contact footer with a primary email CTA and secondary GitHub, LinkedIn, and résumé actions

## Requirements

- Node.js 22.12 or newer
- npm 10 or newer

## Commands

Run commands from this `site/` directory.

| Command | Purpose |
| --- | --- |
| `npm ci` | Reproduce the exact locked dependency tree |
| `npm run dev` | Start the Astro development server |
| `npm run check` | Run Astro and TypeScript diagnostics |
| `npm test -- --run` | Run the content-contract test suite once |
| `npm run test:e2e` | Build and test generated output through `astro preview` |
| `PRODUCTION_URL=https://gabrielrgoldstein.github.io npm run test:production` | Run the browser suite against the exact deployed HTTPS origin without starting a local server |
| `npm run build` | Generate the static production site in `dist/` |
| `npm run check:built` | Validate generated internal routes, fragments, and assets |
| `npm run check:workflows` | Parse workflow YAML and enforce immutable action SHAs |
| `npm run lighthouse` | Build, run two Lighthouse audits, enforce budgets, and write ignored reports |
| `npm run quality` | Run unit, type/static, production-browser, built-output, workflow, and dependency gates |
| `npm run preview` | Preview the generated production build |

`npm run quality` is the canonical local CI equivalent. Its Playwright command owns `127.0.0.1:4325` with `reuseExistingServer: false`, builds first, and tests production output rather than Astro's development server. `npm run lighthouse` starts Astro's programmatic production preview on a kernel-assigned `127.0.0.1` port, verifies the served root exactly matches `dist/index.html`, requires each report to identify that URL, and verifies server shutdown. Generated JSON reports live under ignored `.lighthouseci/`.

## Automated quality and security

Repository-contained automation targets the confirmed public repository [`GabrielRGoldstein/GabrielRGoldstein.github.io`](https://github.com/GabrielRGoldstein/GabrielRGoldstein.github.io):

- `.github/workflows/quality.yml` runs on pull requests, pushes to `main`, and manual dispatch. Its verification job has only `contents: read` plus the `pages: read` required to query configured Pages metadata, uses an exact Node 22.23.2 runtime, runs `npm ci`, the canonical quality gate, and Lighthouse budgets. Playwright failure evidence and Lighthouse JSON are retained as short-lived workflow artifacts instead of being committed. A successful `main` push then uploads only `dist/` and deploys it to GitHub Pages from a dedicated job whose only write capabilities are `pages: write` and `id-token: write`.
- `.github/workflows/security.yml` runs CodeQL for JavaScript/TypeScript and Gitleaks secret scanning on pull requests, pushes to `main`, a weekly schedule, and manual dispatch. Only the CodeQL job receives `security-events: write`.
- `.github/dependabot.yml` schedules bounded weekly npm and GitHub Actions updates.
- Every third-party action is pinned to a full commit SHA. Dependabot maintains those immutable references, and `npm run check:workflows` rejects floating action tags.
- [`SECURITY.md`](SECURITY.md) defines the private email fallback and links to GitHub private vulnerability reporting, which is enabled and API-verified for the confirmed repository.

The committed Lighthouse budgets are Performance ≥ 90, Accessibility/Best Practices/SEO = 100, FCP ≤ 2.5 s, LCP ≤ 3.0 s, TBT ≤ 100 ms, and CLS ≤ 0.05. The final Batch 8 local production-preview gate passed two runs at 100/100/100/100 with median FCP about 394 ms, LCP about 434 ms, TBT 0 ms, and CLS about 0.00028. These measurements validate the built candidate but are not claims about the deployed origin; remote Lighthouse evidence is required after push.

The Batch 8 deployment candidate has been parsed and exercised through local equivalents but has not yet been pushed, so this document does not claim that the new GitHub-hosted workflows or Astro deployment have run. Hosted execution, exact deployment identity, branch-protection contexts, and production response evidence must be recorded only after the reviewed candidate is pushed.

## Content model

Version-controlled JSON under `src/data/` is the portfolio's content database:

- `site.json` — identity, hero, GitHub fallback, contact, and metadata
- `projects.json` — manually curated projects and authored display order
- `experience.json` — public-safe professional experience and date ranges

Zod contracts live in `src/schemas/content.ts`. `src/lib/content.ts` validates all three sources, rejects duplicate stable IDs/slugs/order values, and exposes typed, ordered data to Astro. The index route imports the validated content, so malformed authored JSON fails both tests and the production build.

Unknown external destinations remain explicit `null` values until verified. Project links must use HTTP(S), local assets must be root-relative, and a future résumé path must reference a PDF.

### Adding portfolio projects

`src/data/projects.json` may contain any practical number of authored projects. The homepage renders every record with `"selected": true`, sorted by its unique positive `order`; records with `"selected": false` remain validated but do not appear in the selected-project gallery.

To add a project:

1. Add one JSON object with a unique `id`, `slug`, and `order`.
2. Set `selected` to control homepage inclusion.
3. Add a public-safe summary, category, stack, and honest `null` or confirmed HTTP(S) project links.
4. Add a repository-owned base cover under `public/images/projects/` and author its root-relative `src`, `alt`, `width`, and `height`.
5. Optionally add a `cover.sources` array of responsive image paths and intrinsic widths. If it is omitted, the base cover renders by itself; the component never guesses filenames.
6. Run `npm test -- --run`, `npm run check`, and `npm run build`.

Example cover configuration:

```json
"cover": {
  "src": "/images/projects/example-project.webp",
  "alt": "Designed project cover illustrating Example Project",
  "width": 1600,
  "height": 1000,
  "sources": [
    { "src": "/images/projects/example-project-640.webp", "width": 640 },
    { "src": "/images/projects/example-project-800.webp", "width": 800 }
  ]
}
```

The first two selected projects receive a 7/5 wide/narrow desktop emphasis adapted from Sketch 11. This moderated split preserves a clear featured hierarchy without compressing the secondary cover or creating the excessive dead space produced by the sketch's stronger 8/4 ratio. Every later selected project uses the repeatable half-width card treatment, and all cards stack in one column below the gallery breakpoint. Filters, pagination, and project modals remain intentionally absent until the collection or case-study content creates a real need.

## Fonts

Geist and Geist Mono are self-hosted from Vercel's official [`geist` package](https://www.npmjs.com/package/geist), version 1.7.2. The package source is [`vercel/geist-font`](https://github.com/vercel/geist-font) and the fonts are distributed under the SIL Open Font License.

Only the production weights are stored in `public/fonts/`:

- Geist Regular 400
- Geist Medium 500–600
- Geist Bold 700–900
- Geist Mono Medium 500–700

The package's license text is preserved at [`public/fonts/LICENSE-Geist.txt`](public/fonts/LICENSE-Geist.txt). The production page makes no runtime request to Google Fonts or another font CDN.

## Project state

Implementation is organized into small, independently verified batches. See [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md) for the current checkpoint and exact continuation command.

The full implementation plan lives in the parent workspace at:

```text
../.hermes/plans/2026-08-06_172556-portfolio-mvp-batched-implementation.md
```

## Deployment

The confirmed deployment target is the existing public root-site repository [`GabrielRGoldstein/GabrielRGoldstein.github.io`](https://github.com/GabrielRGoldstein/GabrielRGoldstein.github.io), hosted by GitHub Pages at <https://gabrielrgoldstein.github.io/>. No custom domain or deployment secret is configured, and analytics remains deferred to Batch 9.

The repository's previous Next.js portfolio history is preserved as the second parent of local merge commit `8e4280f4c40fad33e4a24c56d87f1ed986fa9e18`; replacing the published source therefore requires no force-push. Astro's `site` is the confirmed root origin, so generated canonical, Open Graph, Twitter-image, `robots.txt`, and single-route sitemap URLs are absolute and do not use a project subpath.

On a push to `main`, the quality workflow must pass the complete repository gate and Lighthouse budgets before it uploads `dist/` with `actions/upload-pages-artifact` and a separate least-privilege job deploys that artifact with `actions/deploy-pages`. All remote actions are pinned to immutable commits. Main-push runs are serialized rather than cancelled during deployment; pull-request runs remain cancellable.

GitHub Pages currently reports workflow-based publishing, managed HTTPS enforcement, no custom domain, and a live legacy portfolio. These settings identify the destination but do not prove the new Astro candidate is deployed. After the reviewed candidate is pushed, acceptance requires the GitHub Actions run, Pages deployment URL/SHA, HTTPS redirects and headers, cache behavior, canonical/share metadata, sitemap/robots, internal assets and links, custom 404, production Playwright suite, responsive rendering, and remote Lighthouse budgets to be inspected directly.
