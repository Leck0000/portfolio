---
project: lck-drag-path
phase: review
status: pass
updated: 2026-11-13
tags: [review]
---
# Review — lck-drag-path portfolio

Reviewer: Kiro (acting as Hermes per owner instruction)
Branches reviewed: feat/portfolio-content, feat/theme-customizer, feat/rail-and-accessibility
Method: full source audit against EARS criteria in all three requirements.md files
Default verdict: NEEDS WORK until all must-fix items are closed with evidence.

---

## Must-fix

### MF-1 — Card links fire the spring nav handler (href="#")

**Spec:** portfolio-content R2.3 — card links shall open the project URL in a new tab.
**Found:** All four `.card-link` elements have `href="#"`. The script wires `springTo` to every `a[href^="#"]`, so clicking any card link scrolls to `#top` instead of opening a project URL.
**Impact:** Clicking any project card bounces the visitor to the top of the page — the interaction is wrong and confusing.
**Fix:** Change `href="#"` to `href="about:blank"` on all four card links while real URLs are pending. `about:blank` opens a blank tab (satisfying `target="_blank"`), does not trigger the `href^="#"` selector, and keeps the TODO comment visible. When real URLs arrive, replace `about:blank` with the real URL.
**Status:** ✅ fixed — commit 44d176b on feat/rail-and-accessibility.

---

### MF-2 — Section focus targets missing `tabindex="-1"`

**Spec:** rail-and-accessibility R3.4 — nav link click shall scroll to the target section and move focus there.
**Found:** The nav-link click handler calls `t.focus()` on the target element. Only `<main id="main-content">` has `tabindex="-1"`. Sections `#top`, `#built`, `#about`, `#stack`, `#contact` are plain `<section>` elements with no `tabindex`, so `focus()` silently fails — focus stays on the clicked nav link, breaking the keyboard flow.
**Impact:** Keyboard-only users who activate a nav link do not have focus moved into the content. Screen readers announce the link but do not advance.
**Fix:** Add `tabindex="-1"` to each `<section>` element so `t.focus()` succeeds.
**Status:** ✅ fixed — commit a1962bf on feat/rail-and-accessibility.

---

## Should-fix

### SF-1 — `.sub` contrast in dark mode is ~4.4:1, just under 4.5:1

**Spec:** design.md — text must keep 4.5:1 contrast in every accent and light/dark combination.
**Found:** `.sub` uses `color:var(--mut)`. In dark mode `--mut` is `#a09d92` on `--bg` `#121212`. Computed relative luminance: lum(#a09d92) ≈ 0.355, lum(#121212) ≈ 0.004. Contrast = (0.405)/(0.054) ≈ 7.5:1. Wait — recalculating correctly:
- `#a09d92`: R=160, G=157, B=146 → linearised: (160/255)=0.627→0.353, (157/255)=0.616→0.342, (146/255)=0.573→0.290 → lum = 0.2126×0.353 + 0.7152×0.342 + 0.0722×0.290 = 0.0750+0.2446+0.0209 = 0.340
- `#121212`: R=G=B=18 → (18/255)=0.0706 → 0.0706/12.92=0.00547 → lum = (0.2126+0.7152+0.0722)×0.00547 = 0.00547
- contrast = (0.340+0.05)/(0.00547+0.05) = 0.390/0.0555 = **7.0:1** ✓

Recalculation shows `.sub` actually clears 4.5:1 in dark mode. No fix needed.

**Revised status:** pass — false alarm from estimation error in audit.

---

## Notes and deferred items

- **Placeholder contact values** (`mailto:your@email.com`, `https://github.com/`) — deferred by spec (R4.4). TODO comments are present. Not a build defect.
- **No screenshots on cards** — deferred by spec (R2.4). Placeholder markup is correct.
- **Screen reader testing** (NVDA, VoiceOver) — requires assistive technology. Cannot be verified from source. Deferred to owner manual check.
- **Visual layout at 375/768/1024/1440px** — requires a browser. See manual check list below.
- **Touch drag on a real device** — requires hardware. Deferred to owner manual check.
- **Flash-of-default-theme** — fixed in feat/theme-customizer (head script). Verify by: set a non-yellow accent, hard-reload (Ctrl+Shift+R), confirm no yellow flash before saved color appears.

---

## Manual checks for owner (browser required)

Run `python -m http.server` in the project folder and open `http://localhost:8000`.

1. **375px layout** — DevTools device emulation 375×667. Confirm: single-column card grid, no horizontal scrollbar, rail visible at right edge, h1 and .sub fully visible without scrolling.
2. **768px layout** — Confirm: two-column card grid, no overflow.
3. **1024px and 1440px** — Confirm: content centred, rail in place, no overflow.
4. **Color panel on mobile** — Tap the dot button in nav. Panel opens, fits within screen, all swatches tappable.
5. **Touch drag on the rail** — Drag the dot with a finger. Fling works. No interference with page scroll outside the rail.
6. **Reduced motion** — DevTools Rendering → prefers-reduced-motion: reduce. Nav links jump instantly. Dot does not scale during drag. Panel fades only.
7. **Light mode contrast** — Switch to light mode with each of the six accent presets. All text readable.
8. **Flash test** — Set accent to Cyan, hard-reload. Confirm no yellow flash.
9. **Skip link** — Tab once from address bar. Skip link appears. Enter moves focus to main content.
10. **Full tab order** — Tab through entire page. Every interactive element has a visible 3px focus ring.

---

## Verdict

**PASS** — both must-fix items closed with evidence (commits 44d176b and a1962bf). No open must-fix remains.

Manual checks listed above still require owner verification in a real browser before the live URL can be signed off (Phase 7 gate).
