# Gabriel Goldstein Portfolio

Production source for Gabriel Goldstein's software-engineering portfolio.

The site is being built as a static Astro project. Design studies and portable wireframes remain outside this repository under the parent `Portfolio Rework/sketches/` workspace.

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
| `npm run build` | Generate the static production site in `dist/` |
| `npm run check:built` | Validate generated internal routes, fragments, and assets |
| `npm run check:workflows` | Parse workflow YAML and enforce immutable action SHAs |
| `npm run lighthouse` | Build, run two Lighthouse audits, enforce budgets, and write ignored reports |
| `npm run quality` | Run unit, type/static, production-browser, built-output, workflow, and dependency gates |
| `npm run preview` | Preview the generated production build |

`npm run quality` is the canonical local CI equivalent. Its Playwright command owns `127.0.0.1:4325` with `reuseExistingServer: false`, builds first, and tests production output rather than Astro's development server. `npm run lighthouse` starts Astro's programmatic production preview on a kernel-assigned `127.0.0.1` port, verifies the served root exactly matches `dist/index.html`, requires each report to identify that URL, and verifies server shutdown. Generated JSON reports live under ignored `.lighthouseci/`.

## Automated quality and security

Repository-contained automation is ready for activation when this local repository is pushed to GitHub:

- `.github/workflows/quality.yml` runs on pull requests, pushes to `main`, and manual dispatch. It uses least-privilege read permissions, an exact Node 22.23.2 runtime, `npm ci`, the canonical quality gate, and Lighthouse budgets. Playwright failure evidence and Lighthouse JSON are retained as short-lived workflow artifacts instead of being committed.
- `.github/workflows/security.yml` runs CodeQL for JavaScript/TypeScript and Gitleaks secret scanning on pull requests, pushes to `main`, a weekly schedule, and manual dispatch. Only the CodeQL job receives `security-events: write`.
- `.github/dependabot.yml` schedules bounded weekly npm and GitHub Actions updates.
- Every third-party action is pinned to a full commit SHA. Dependabot maintains those immutable references, and `npm run check:workflows` rejects floating action tags.
- [`SECURITY.md`](SECURITY.md) defines the current private email reporting channel and records that GitHub private vulnerability reporting must wait until Batch 8 creates a repository where it can be enabled and verified.

The committed Lighthouse budgets are Performance ≥ 90, Accessibility/Best Practices/SEO = 100, FCP ≤ 2.5 s, LCP ≤ 3.0 s, TBT ≤ 100 ms, and CLS ≤ 0.05. A local desktop production-preview gate passed two runs at 100/100/100/100 with median FCP about 408 ms, LCP about 438 ms, TBT 0 ms, and CLS about 0.00028. These measurements are local evidence, not claims about an unidentified production host.

The workflow files have been parsed and exercised through their local command equivalents, but they have not executed on GitHub because this repository still has no remote. Batch 8 owns repository creation, branch protection, required-check configuration, hosting, production origin, and deployed response validation.

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

Deployment is intentionally deferred until Batch 8. Batch 7 does not configure a remote GitHub repository, hosting platform, production domain, analytics provider, branch protection, secrets, or deployment workflow.
