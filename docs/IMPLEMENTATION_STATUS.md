# Portfolio Implementation Status

Last updated: 2026-08-06 20:38 MDT

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

Batch 2 — Content Model and JSON Validation — **complete and independently approved**

Next batch: Batch 3 — Shared Components and Static Assets

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

## Intentional placeholders and pending content

- The Batch 1 project/experience shell remains visible; Batch 3 and Batch 4 replace shell arrays with validated data-driven components.
- Project cover paths are validated contracts, but the corresponding optimized image assets still need to be supplied or designed in Batch 3.
- The local GitHub avatar fallback path is validated; the wolf avatar asset is copied into production in Batch 3 and must be labeled as a GitHub avatar, not a portrait.
- Project repository and live-demo destinations remain `null` until each public-safe URL is audited.
- LinkedIn remains `null` until the final profile URL is confirmed.
- Résumé remains `null` until a final production PDF is available; the source DOCX is not a deployable asset.

## Known blockers and deferred inputs

- Final project images and public repository/demo URLs are required before Batch 3 acceptance.
- Final PDF résumé and LinkedIn profile URL are required before Batch 4 acceptance.
- GitHub repository name, final deployment URL, and custom-domain decision are deferred to Batch 8.
- Analytics provider is deferred to Batch 9.

## Exact continuation command

Run this from `site/` at the start of Batch 3:

```bash
git log -1 --oneline && git status --short && npm test -- --run && npm run check && npm run build
```

Then read the Batch 3 section of the implementation plan and inspect only the selected project-gallery, Inline Identity, and Primary CTA Buttons references needed for shared components and static assets.
