# Gabriel Goldstein Portfolio

Production source for Gabriel Goldstein's software-engineering portfolio.

The site is being built as a static Astro project. Design studies and portable wireframes remain outside this repository under the parent `Portfolio Rework/sketches/` workspace.

## Current design direction

- Original project-gallery layout
- Refined DMG color system
- Geist + Geist Mono typography
- Inline GitHub identity
- Featured projects above expandable professional experience
- No standalone About section
- Contact footer with a primary email CTA and secondary GitHub, LinkedIn, and résumé actions

## Requirements

- Node.js 22.12 or newer
- npm 10 or newer

## Commands

Run commands from this `site/` directory.

| Command | Purpose |
| --- | --- |
| `npm install` | Install locked dependencies |
| `npm run dev` | Start the Astro development server |
| `npm run check` | Run Astro and TypeScript diagnostics |
| `npm test -- --run` | Run the content-contract test suite once |
| `npm run build` | Generate the static production site in `dist/` |
| `npm run preview` | Preview the generated production build |

## Content model

Version-controlled JSON under `src/data/` is the portfolio's content database:

- `site.json` — identity, hero, GitHub fallback, contact, and metadata
- `projects.json` — manually curated projects and authored display order
- `experience.json` — public-safe professional experience and date ranges

Zod contracts live in `src/schemas/content.ts`. `src/lib/content.ts` validates all three sources, rejects duplicate stable IDs/slugs/order values, and exposes typed, ordered data to Astro. The index route imports the validated content, so malformed authored JSON fails both tests and the production build.

Unknown external destinations remain explicit `null` values until verified. Project links must use HTTP(S), local assets must be root-relative, and a future résumé path must reference a PDF.

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

Deployment is intentionally deferred until Batch 8. No remote GitHub repository or production environment is configured in Batch 0.
