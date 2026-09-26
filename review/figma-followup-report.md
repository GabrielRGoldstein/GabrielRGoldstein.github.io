# Figma bounded media follow-up — candidate for independent review

Workspace `wt/t_404f160a`, HEAD `a29d2e662c7d4bee311c09baf8546fc18153daad`; pre-existing uncommitted five-project candidate preserved. The terminal/profile cannot inspect image pixels visually. Pixel/visual verdict **UNVERIFIED** pending Benzaiten; this is not owner acceptance or release clearance.

## Bounded changes

- `review/generate-figma-crop.mjs`: radius 20→27 at source center (1913.5,260.5), same neutral fill/thin border. The radius-22 intermediate failed a native-pixel probe: original white at (1896,243) remained. The final probe found that pixel changed from (255,255,255) to (32,39,49). Script recomputes exact changed RGB bounds, refuses edits outside the tight placeholder region and rejects leftover bright source pixels in x1896..1931,y243..278. Final count 1,604; actual bounds x1886..1940,y233..287; permitted envelope x1885..1942,y232..289. These are source-space RGB checks, not WebP pixel approval.
- `src/styles/portfolio.css`: only Figma dialog figure drops user-agent 40px margin; on stacked/mobile layout its padding is 4px. The editor remains `object-fit: contain` with full natural 1600×797 frame. No modal shell, content, action, title, cover alt or gallery alt was changed.
- Four Figma derivatives regenerated; canonical 2559×1274 PNG remains SHA-256 `3260e780d47d946602a6f9ee483cdfcc77af6d2ce0bd494c840d03a74970e5c1`.

| WebP | Dimensions | SHA-256 |
| --- | --- | --- |
| `figma-clone-640.webp` | 640×400 | `12d1be1705b9e8956d0401e9d52dc34faa984fe1673f8ce5bd5138034f71c939` |
| `figma-clone-800.webp` | 800×500 | `08f47192475a12e909ae7be0daf00a005f4934a904d94507bb4a7b323a8c334e` |
| `figma-clone.webp` | 1600×1000 | `3023fc3426139ef4cc20eb2cb804d43217a61011ed1ddefc1a4b293e57e26201` |
| `figma-clone-detail.webp` | 1600×797 | `1e799cd11f956c12fe667f96c24313c97944f515d53758fdd319c460800cbbe8` |

## Captures and study differences

`review/{desktop,mobile}-{work,figma-work,dialog,figma-dialog,focus,no-js-work}.png` regenerated after final build and `img.decode()` at 1440×900 and 390×844. `review/before/` retains prior Figma work/dialog/focus/no-JS captures. `review/{desktop,mobile}-figma-dialog-comparison.png` labels three same-viewport columns: approved study (`t_dd9370a9`), previous candidate, corrected candidate. Desktop comparison SHA-256 `1b5b46811d1c3ba9d1fe9ce7b0bd61606281a6a6e8eeb3dae5e73e143aeab7d9`; mobile `3638a7ca637a5f6a68f64f05ce22c51b41d6e17be1edb4386447abcf93fe543c`.

Decoded detail image before→after: desktop ~546×272→626×312 (study ~615×305); mobile ~230×115→334×166 (study ~332×167). Browser exact after: desktop image box x176,y294.05,w626.19,h311.91; mobile x28,y103.88,w334,h166.36. Screenshot vertical positions differ from study because the study and production dialogs have different surrounding content/scroll states. Source is a full editor, unlike the study crop; compare imagery and dark-pane balance, not just geometric sizes. Dialog image decoded as 1600×797, had nonuniform screenshot pixels and zero page errors in both captures. No programmatic proof determines if the larger mask looks acceptable, whether unrelated controls were visually obscured or if the final WebP lost all rim artifacts.

## Gates and next reviewers

`npm.cmd run quality`: 172/172 unit tests, Astro check 50 files / 0 diagnostics, build 2 pages, Playwright 34/34, built references 2 HTML / 51, workflow validation 2 PASS; overall **FAIL** at unchanged npm audit: eight package nodes (3 moderate, 4 high, 1 critical). Final derivative regeneration then `npm.cmd run build` passed (2 pages), `node review/capture-figma.mjs` and `node review/compare-figma.mjs` passed. A first final `npm.cmd run test:e2e` failed to start because the capture preview still owned port 4337; after killing only that preview, retry passed 34/34 on final assets. `git diff --check` exit 0, package manifest/lockfile diffs empty; no commit/push/deploy. Lighthouse **UNVERIFIED** (previous Windows Chrome cleanup EPERM, no gate bypass). Independent Benzaiten must view all four WebPs and desktop/mobile card/dialog/focus/no-JS captures including the magnified rim versus study, explicitly assess the expanded mask/controls and dialog balance. Saru must independently recheck code/bounds/hash and JS-on/off modal focus, scroll, CTA/overflow behavior on this exact uncommitted candidate. Owner retains approval of visual trade-off and dependency/security/release gates.
