# Sketch 11 parity, lean verification, and project scaling

> **Historical/superseded audit.** This document records the 2026-08-12 Batch 6.1 baseline and recommendations. Batch 10.1 later adopted the approved Editorial Links redesign and implemented accessible project dialogs using verified existing content. Present-tense statements below describe that older baseline; current implementation state and continuation live in `IMPLEMENTATION_STATUS.md`.

Date: 2026-08-12
Production baseline: `ab898e2 feat: polish responsive SEO and performance`
Reference: `../sketches/011-contact-footer-variations/primary-cta-buttons/index.html`

## Implemented decision

Implement **one small corrective Batch 6.1 before Batch 7**:

> **Batch 6.1 — Sketch 11 Fidelity and Project Scalability**

Its scope is:

1. Make adding an arbitrary number of authored projects reliable from `src/data/projects.json`.
2. Remove the remaining four-project assumptions from tests and image delivery.
3. Restore Sketch 11's asymmetric project hierarchy and descriptive project framing.
4. Keep intentional production improvements and avoid rebuilding disposable sketch interactions without a real content need.

A second corrective batch is unnecessary. Sketch 11's project filters and project-preview modal remain deferred until there are enough projects or real case-study content to justify them. The current production hero copy and practice-area chips remain unchanged.

## Executive findings

The production site is **not hard-limited to four rendered projects**. `ProjectGrid.astro` already maps over every project it receives, `projectsSchema` accepts an array of any length, and `validateProjects()` sorts the full array by authored `order`.

The current workflow is nevertheless not safely N-project-ready because:

- `ProjectCard.astro` invents `-640.webp` and `-800.webp` paths from every project slug instead of reading available image sources from JSON.
- The authored-content test hard-codes the exact order array `[1, 2, 3, 4]`.
- All four current records are marked `featured`, but `featured` does not control inclusion; it only changes the card label.
- The gallery has only been accepted visually with four cards. An odd or larger count will render, but its editorial layout and page length have not been deliberately specified.

The right fix is a small content-contract correction, not a CMS, database, API, client-side JSON fetch, pagination system, or framework migration.

---

## Sketch 11 versus production

### A. Fidelity gaps worth considering for Batch 6.1

| Area | Sketch 11 | Production | Recommendation |
|---|---|---|---|
| Project grid hierarchy | First row uses an asymmetric 8/4 split; later cards use an even split. | Every desktop card uses an equal two-column width. | **Restore if this asymmetry is part of the desired identity.** It is the clearest visual fidelity gap. Make the emphasis data-driven or order-driven without limiting total project count. |
| Project section framing | Descriptive line: “Production-minded work spanning real-time systems, AI, commerce, and data.” | Dynamic count: “4 projects, intentionally curated.” | **Prefer both:** retain a useful descriptive sentence and derive the count separately. Do not hard-code four. |
| Hero headline | “Complex systems, clearly built.” | “Complicated systems. Dependable tools.” | **Gabriel decision required.** This is a content-direction difference, not an implementation bug. Restore the Sketch copy only if it remains the preferred positioning. |
| Hero proof chips | “4 years experience”, “Security+”, “Colorado Springs”. | “Systems”, “Security”, “Data”, “Product”. | **Gabriel decision required.** Sketch uses credentials/context; production uses practice areas. Either is valid. Avoid displaying a years-of-experience value that needs frequent maintenance unless it is derived or deliberately updated. |
| Project interaction cues | Cards use arrows and open a project snapshot modal. | Cards are static unless a real repository/demo URL exists; pending destinations are honest text. | **Do not restore the modal yet.** It would contain duplicated summaries or placeholder case studies. Add it only with real case-study content. |
| Project filters | All / Full-stack / AI-Data / Client. | No filter controls. | **Defer by default.** Four projects do not need filtering. Reconsider when the selected gallery grows beyond roughly 8 projects or user testing shows scanning difficulty. |
| Experience header action | Includes “Download résumé ↗”. | Résumé is available in the sticky header and Contact footer, but not the Experience header. | **Keep production unless Gabriel wants the third résumé affordance.** Reintroducing it is simple but redundant. |

### B. Intentional production changes to retain

| Difference | Why production should retain it |
|---|---|
| Real repository-owned conceptual covers replace sketch placeholders. | This is a production-quality improvement. The covers are explicitly labeled and do not pretend to be screenshots. |
| Cards include authored stack tags, category, explicit dimensions, and honest pending-link states. | These provide useful technical evidence and avoid fabricated destinations. |
| Self-hosted Geist replaces Google Fonts. | This removes a third-party runtime dependency and improves privacy/reliability. |
| Palette/contact variation switcher is absent. | It was comparison-hub chrome, not part of the selected site. |
| Production adds an eyebrow above the hero. | It clarifies role and location without adding an About section. |
| Production Experience uses accurate month ranges, locations, multi-period freelance history, and public-safe content. | These are truthfulness and content-model improvements over the simplified sketch. |
| The current role is expanded initially and older roles are progressively disclosed. | This behavior was deliberately accessibility-tested and keeps all content available without JavaScript. |
| Production contact actions use confirmed LinkedIn and PDF destinations. | The sketch contained a placeholder LinkedIn link and DOCX résumé. |
| The footer omits “Primary CTA buttons / Study 2”. | That label described the wireframe study, not the public portfolio. |
| SEO, favicons, social card, 404, responsive images, skip link, focus handling, and reduced-motion behavior differ from or do not appear in Sketch 11. | These are production requirements, not fidelity regressions. |

### C. Differences that are mostly density/polish, not defects

- Production cards are taller because they include real covers, longer truthful summaries, technology tags, and link status.
- Production Experience rows are taller because the current role exposes useful details and every row has accessible controls.
- Production's Contact section is extremely close to Sketch 11 Study 2; its spacing and markup were adapted for real destinations and mobile targets.
- Production uses exact authored project names (“ML Stock Trading Bot”) instead of abbreviated sketch labels (“Trading Bot”).

---

## N-project implementation

### Current behavior

The following parts already support N projects:

- `src/data/projects.json` is an array.
- `src/schemas/content.ts` validates `z.array(projectSchema)` without a maximum length.
- `src/lib/content.ts` validates every record and sorts the entire array by `order`.
- `src/components/ProjectGrid.astro` renders `projects.map(...)`.
- The section count uses `projects.length`.
- Component and browser loops generally iterate over the project collection rather than selecting four specific cards.

### Remaining constraints

#### 1. Image sources are implicit

Current code:

```ts
const mobileCover = `/images/projects/${project.slug}-640.webp`;
const responsiveCover = `/images/projects/${project.slug}-800.webp`;
```

This means a new JSON record silently requires three correctly named files. JSON does not describe that dependency, and the schema cannot distinguish a project with only one valid cover from one with a complete responsive set.

#### 2. One authored-data test encodes the current count

Current assertion:

```ts
expect(portfolioContent.projects.map(({ order }) => order)).toEqual([1, 2, 3, 4]);
```

It should validate ordering generically and use a separate synthetic test containing more than four records.

#### 3. `featured` has no selection behavior

All records are rendered. `featured` currently changes only the text “Featured” versus “Project”. The original content architecture expected a `selected` flag to control homepage inclusion.

We should choose and document one clear meaning:

- **Recommended:** rename or replace `featured` with `selected`; render every `selected: true` project in order. The JSON may hold N total projects, and any number may be selected for the homepage.
- If Gabriel instead wants every JSON record always visible, remove the boolean entirely and render all records.

Do not keep a boolean whose name implies behavior it does not have.

### Minimal proposed data shape

```json
{
  "id": "example-project",
  "slug": "example-project",
  "selected": true,
  "order": 5,
  "title": "Example Project",
  "category": "systems",
  "summary": "A concise, public-safe project summary.",
  "stack": ["TypeScript", "Astro"],
  "cover": {
    "src": "/images/projects/example-project.webp",
    "alt": "Designed project cover illustrating Example Project",
    "width": 1600,
    "height": 1000,
    "sources": [
      { "src": "/images/projects/example-project-640.webp", "width": 640 },
      { "src": "/images/projects/example-project-800.webp", "width": 800 }
    ]
  },
  "repositoryUrl": null,
  "liveUrl": null
}
```

`cover.sources` should be optional. If it is absent, `ProjectCard` should render only `cover.src`; adding a project should not require responsive derivatives before the project can build correctly. Responsive variants remain recommended for final production polish.

### Minimal implementation steps

1. Update `projectSchema` to describe `selected`, explicit image dimensions, and optional explicit responsive sources.
2. Update `validateProjects()` to filter selected projects only at the homepage boundary—or expose both `allProjects` and `selectedProjects` if future case-study routes need the full collection.
3. Update `ProjectCard.astro` to build `srcset` from authored sources and fall back to the base cover without inventing filenames.
4. Replace the exact `[1, 2, 3, 4]` assertion with generic sorted-order and non-empty assertions.
5. Add one synthetic component test that renders 7 projects and verifies each appears once in authored order.
6. Update the responsive browser test to verify every rendered image decodes and is appropriately sized without requiring every filename to end in `-640.webp`.
7. Test an odd count such as 5 or 7 at desktop and mobile widths.
8. Document the exact “add a project” workflow in `README.md`.

### What not to build

- No database or CMS.
- No client-side fetch of `projects.json`.
- No React state or Astro islands.
- No automatic GitHub “latest repositories” feed.
- No pagination for a normal portfolio-sized collection.
- No filter UI until the selected set is large enough to need it.
- No modal until real case-study content exists.

For a portfolio, “N projects” should mean a maintainable authored collection, not an unbounded high-volume catalog.

---

## Leaner implementation and verification policy

Batch 6 used unusually heavy verification because it introduced the production browser harness, accessibility automation, metadata, binary assets, responsive-image delivery, Lighthouse claims, and several test-validity corrections at once. That level of repeated review should **not** become the default.

### Cut back immediately

1. **One independent reviewer per code-changing batch.** Dispatch a replacement only if the first reviewer times out or cannot complete a required gate. Do not routinely run two or more overlapping reviews.
2. **No post-review documentation-only tree.** Before review, record status as “candidate ready for review”; after approval, commit the exact reviewed tree. Put the approval details in the handoff/final response or the next status update. This avoids a second documentation-integrity review.
3. **No duplicate full post-commit suite.** If `HEAD^{tree}` exactly equals the reviewed tree, post-commit verification should be limited to tree identity, clean status, and—when justified—a short smoke command. The full suite already certified those bytes.
4. **No Lighthouse on ordinary content or CSS batches.** Run it only when changing performance-sensitive assets, loading behavior, build output, or the Lighthouse budget itself; otherwise run it at deployment/launch checkpoints.
5. **No corruption probes on ordinary feature work.** Use them only when adding or changing the test harness that claims to validate generated artifacts.
6. **Use two responsive widths for focused layout work:** one mobile width (390 px) and one desktop width (1280 px). Reserve 375/768/1280/1600 matrices for launch acceptance or breakpoint-heavy changes.
7. **Run focused tests during development.** Run the complete unit/check/build/browser set once at the end of a batch, not after every small edit.
8. **Do not delegate mechanical inspection that direct file reads can answer.** Reserve subagents for independent review or genuinely parallel reasoning.
9. **Avoid preserving generated reports in Git.** CI artifacts can retain Lighthouse/Playwright evidence later without adding generated files to product history.

### Proportionate gates by change type

| Change type | Required gates | Skip unless relevant |
|---|---|---|
| JSON content only | Focused schema/content test, Astro check, production build | Lighthouse, full visual matrix, corruption probes, multiple reviewers |
| Project component/schema change | Focused unit/component tests, Astro check, build, one mobile + one desktop browser pass, axe smoke | Full four-width matrix, Lighthouse unless image loading changes |
| CSS-only fidelity change | Astro check, build, mobile + desktop visual/overflow pass | Dependency audit, binary probes, Lighthouse unless performance changes |
| Test-harness or asset-delivery change | Unit/check/build, focused E2E, relevant negative probe | Unrelated Experience/contact regressions during iteration |
| Deployment/launch | Full unit/check/build/E2E, dependency audit, Lighthouse, broken links, production-origin/header checks | Nothing material; this is the appropriate comprehensive checkpoint |

### Batch 6.1 verification target

For the recommended combined corrective batch:

```text
Focused content/component tests
Astro check
Production build
Project browser smoke at 390 px and 1280 px
One axe smoke
One independent review of the final candidate
Commit-tree identity and clean status
```

Run the full existing E2E suite once before commit because Batch 6.1 changes shared project rendering. Do not rerun Lighthouse unless responsive delivery changes materially enough to affect the existing budget.

---

## Proposed schedule and decisions

### Recommended sequence

1. **Now:** review this audit and confirm the three design choices below.
2. **Next implementation batch:** Batch 6.1 — Sketch 11 Fidelity and Project Scalability.
3. **After Batch 6.1:** continue to Batch 7 — Automated Quality and DevSecOps, using the lean verification policy above.
4. **Optional later:** filters and/or case-study modal only when project count/content justifies them.

### Decisions applied in Batch 6.1

1. Restore Sketch 11's asymmetric first project row using a moderated 7/5 split. Side-by-side production-cover comparison rejected 8/4 because it compressed the secondary card and created excessive dead space; 6/6 was balanced but lost the intended hierarchy.
2. Keep the production hero: “Complicated systems. Dependable tools.” plus practice-area chips.
3. Keep filters and modal deferred; reconsider filters only when the selected set becomes difficult to scan and add a modal only with real case-study content.
