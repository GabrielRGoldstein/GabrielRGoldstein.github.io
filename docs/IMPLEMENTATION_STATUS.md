# Portfolio Implementation Status

Last updated: 2026-08-06 22:42 MDT

## Locked design decisions

- Layout: original two-column Project Gallery
- Palette: Refined DMG
- Typography: self-hosted Geist + Geist Mono
- GitHub treatment: Inline Identity
- Section order: hero, selected projects, experience, contact footer
- About: no standalone section; useful positioning copy belongs in the hero
- Contact: sticky-nav `#contact` jump to Study 2 Primary CTA Buttons
- Contact hierarchy: filled email CTA; bordered GitHub, LinkedIn, and résumé actions
- Architecture: Astro static output, strict TypeScript, plain external CSS, validated local content

## Current batch

Batch 3 — Header, Hero, GitHub Identity, and Project Gallery — **complete and independently approved**

Next batch: Batch 4 — Experience, Contact, Résumé, and Footer

## Completed batches

### Batch 0 — Production Repository Foundation

- Created the isolated Astro 7.2.0 production repository on local `main`.
- Enabled strict TypeScript and a working `npm run check` command.
- Added project README, agent notes, and this durable handoff.
- Verified the neutral static foundation and committed it as `a6593c8`.

### Batch 1 — Design Tokens, Fonts, and Page Shell

- Acquired four static WOFF2 files from Vercel's official `geist` 1.7.2 package and preserved the SIL Open Font License.
- Added Refined DMG design tokens, external global styles, local font faces, accessibility foundations, and responsive production rules.
- Created `BaseLayout.astro` and the semantic structural shell for every final section except About, which is intentionally absent.
- Added working Work, Experience, and Contact anchors and accessible pending states for unconfirmed destinations.
- Corrected mobile hero/navigation overflow and two accessibility blockers found by fail-closed review.
- Passed a fresh independent pre-commit review and committed the batch as `c58fafc`.

### Batch 2 — Content Model and JSON Validation

- Added version-controlled authored content:
  - `src/data/site.json`
  - `src/data/projects.json`
  - `src/data/experience.json`
- Added Zod 4.4.3 contracts for site identity, metadata, contact destinations, curated projects, project covers, and multi-period experience dates.
- Added Vitest 4.1.10 and a `test` package script.
- Added 55 focused content-contract tests developed through RED-GREEN cycles.
- Rejects blank required project and experience fields, malformed/unsafe URLs, non-root-relative assets, non-PDF résumé paths, malformed or reversed dates, empty experience periods, duplicate IDs/slugs/order values, and invalid project order values.
- Restricts external destinations to HTTP(S), while unknown LinkedIn, résumé, repository, and live-demo destinations remain explicit `null` values.
- Preserves manually authored project order and exposes typed, sorted project data through `src/lib/content.ts`.
- Preserves the résumé's two distinct freelance periods instead of representing them as one continuous range.
- Confirmed the L3Harris start month from the résumé source and omitted clearance, customer, and program-specific details from public JSON.
- Wired validated metadata into `index.astro`, making authored-content validation execute during every Astro build without client-side fetching.
- Documented the content workflow and test command in `README.md`.
- The first fail-closed review rejected prefix-only local-path validation because `//host/path` and `/\\host/path` could resolve as network paths.
- Replaced prefix checks with one shared root-relative path contract that requires exactly one leading slash and rejects backslashes; added six failing-then-passing regression cases across project covers, the GitHub avatar fallback, and résumé paths.
- The second fail-closed review found that WHATWG URL parsing strips tab, LF, and CR characters, allowing control-character-obfuscated network paths through the regex-only contract.
- Hardened local-path validation to reject ASCII controls and backslashes, require a single leading slash, and resolve against a fixed base whose origin must remain unchanged; added nine failing-then-passing control-character regressions across all three path fields.
- The third fail-closed review found that applying the PDF check to the raw résumé string allowed a non-PDF pathname to masquerade through a `.pdf` query or fragment and rejected valid PDF paths with query data.
- Moved the PDF extension check to the resolved URL pathname with exception-safe parsing; added four failing-then-passing query/fragment regressions.

### Batch 3 — Header, Hero, GitHub Identity, and Project Gallery

- Added tested `SiteHeader`, `Hero`, `GithubIdentity`, `ProjectGrid`, and `ProjectCard` Astro components.
- Added an Astro-aware Vitest configuration and seven RED-GREEN component/integration tests, bringing the complete suite to 62 tests.
- Replaced the Batch 1 top-half shell with validated `site.json` and curated `projects.json` content; no client-side JSON fetch or script is required.
- Added a local 256 × 256 WebP copy of the public GitHub wolf avatar, accurately labeled as an avatar rather than a portrait.
- Added four distinct 1600 × 1000 Refined DMG WebP project covers. Each is visibly labeled as a designed conceptual cover and has matching authored alt text rather than being presented as a real screenshot.
- Added explicit image dimensions, stable project IDs, curated ordering, stack/category metadata, honest non-interactive pending link states, and protected external-link rendering for future repository/demo destinations.
- Preserved the original two-column gallery at desktop widths and the established single-column responsive breakpoint.
- Replaced placeholder-only CSS with production image-card and Inline Identity styles while retaining external plain CSS and zero runtime scripts.
- Browser verification found that the skip link scrolled correctly but left focus on the body; added a failing integration regression and made `#main-content` programmatically focusable with `tabindex="-1"`.
- The first fail-closed review rejected the avatar alt text because it described the photorealistic wolf image as illustrated; added a failing-then-passing regression and changed the authored text to the neutral, accurate “Wolf GitHub avatar for GabrielRGoldstein.”

## Batch 2 verification evidence

```text
Automated:
- npm test -- --run: 55 tests passed in 1 test file
- npm run check: 8 files, 0 errors, 0 warnings, 0 hints
- npm run build: static output, 1 page generated
- npm audit --audit-level=high: 0 vulnerabilities
- git diff --check: passed

Negative build proof:
- Temporarily changed the first project summary to whitespace only
- npm run build: failed with exit code 1 and a field-scoped Zod summary error
- Restored the exact original JSON bytes in a finally block
- Restored npm run build: passed with exit code 0

Final fresh fail-closed review:
- Passed with no security concerns, logic errors, privacy issues, or accessibility regressions
- Non-blocking suggestion: add an explicit caller-array non-mutation regression for project sorting
```

## Batch 3 verification evidence

```text
Automated:
- npm test -- --run: 62 tests passed across 2 test files
- npm run check: 15 files, 0 errors, 0 warnings, 0 hints
- npm run build: static output, 1 page generated
- git diff --check: passed

Assets:
- Avatar: WebP, 256 × 256, 24,846 bytes
- Four project covers: WebP, 1600 × 1000 each, 34,410–45,040 bytes
- Visual inspection confirmed all five assets are readable, unclipped, and free of unsupported glyph artifacts

Browser and accessibility:
- Desktop: two-column gallery, all five images loaded at natural dimensions, no console errors, zero scripts
- CDP-emulated 390 px: inner width and scroll width both 390 px; header and cards 350 px; no horizontal overflow
- CDP-emulated 768 px: inner width and scroll width both 768 px; header and cards 712 px; no horizontal overflow
- No duplicate IDs; heading levels are sequential; pending résumé/project/contact states are absent from the focus order
- Skip link exposes a visible 3 px focus outline and moves focus to `#main-content`
- Lowest tested new color contrast combination is muted text on surface at 6.72:1

Final fresh fail-closed re-review:
- Passed corrected staged tree `7c659fb51cdd482ba88341f527ecb866c2acb0a0`
- No security concerns, logic errors, accessibility findings, suggestions, or content-integrity issues
- Confirmed the corrected wolf-avatar alt text is accurate and the regression test fails the former misleading text
```

## Intentional placeholders and pending content

- The Batch 1 experience shell remains visible; Batch 4 replaces it with validated experience components.
- Project covers are intentional conceptual illustrations, not screenshots. Replace them only if audited real project imagery becomes available later.
- Project repository and live-demo destinations remain `null` until each public-safe URL is audited.
- LinkedIn remains `null` until the final profile URL is confirmed.
- Résumé remains `null` until a final production PDF is available; the source DOCX is not a deployable asset.

## Known blockers and deferred inputs

- Final PDF résumé and LinkedIn profile URL are required before Batch 4 acceptance.
- GitHub repository name, final deployment URL, and custom-domain decision are deferred to Batch 8.
- Analytics provider is deferred to Batch 9.

## Exact continuation command

Run this from `site/` at the start of Batch 4:

```bash
git log -1 --oneline && git status --short && npm test -- --run && npm run check && npm run build
```

Then read the Batch 4 section of the implementation plan and the later locked product decisions. Build Experience, Contact, Résumé, and Footer from validated content; do not reintroduce a standalone About section. Obtain a production PDF résumé and confirmed LinkedIn URL before closing Batch 4.
