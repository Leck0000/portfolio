---
project: lck-drag-path
feature: theme-customizer
phase: plan
status: approved
updated: 2026-11-13
---
# Tasks — theme-customizer

Branch: `feat/theme-customizer`
One commit per task. All checks run with `python -m http.server` and the browser open at `http://localhost:8000`.

---

## T1 — WCAG luminance helpers — regression check *(already in baseline)*

**Requirement:** R3  
**Status:** Baseline already has `wcagLum`, `contrast`, `mix`, and `adjustToContrast` implemented inside the IIFE. Regression check only — no code change expected.

**Check:**
1. Open browser console. Run:
   ```js
   contrast('#f5d90a', '#121212') // should be ≥ 4.5
   contrast('#ffffff', '#000000') // should be 21
   contrast('#808080', '#808080') // should be 1
   ```
2. No console errors on page load.
3. Existing theme behavior unchanged (yellow accent still applies on load).
4. If all pass with no code change, skip this commit.

---

## T2 — Iterative contrast adjustment — regression check *(already in baseline)*

**Requirement:** R3.1, R3.2, R3.4  
**Status:** Baseline already has `adjustToContrast` and the iterative derivation of `--a` and `--on` inside `apply()`. Regression check only — no code change expected.

**Check:**
1. Apply each of the six presets. Open DevTools → Computed styles → verify `--a` value.
2. For each preset in dark mode, run in console: `contrast(getComputedStyle(document.documentElement).getPropertyValue('--a').trim(), '#121212')` — result must be ≥ 4.5.
3. For each preset in light mode, repeat against `'#f5f5f7'` — result must be ≥ 4.5.
4. For the yellow preset (`#f5d90a`), `--on` must be `#000000` (black text on yellow).
5. No console errors; edge-case warn only if triggered.
6. If all pass with no code change, skip this commit.

---

## T3 — `prefers-contrast: more` body-copy boost — regression check *(already in baseline)*

**Requirement:** R3.3  
**Status:** Baseline already has the `@media(prefers-contrast:more)` block with `--fg:#ffffff;--mut:#d0cfc9` for dark and `--fg:#000000;--mut:#3a3a3f` for light. Regression check only — no code change expected.

**Check:**
1. In DevTools → Rendering → Emulate CSS media: `prefers-contrast: more`.
2. Body text visually more contrasty than default. No horizontal overflow or layout break.
3. Cards, nav, and buttons still readable.
4. Disable emulation — page returns to normal.
5. If all pass with no code change, skip this commit.

---

## T4 — `prefers-reduced-motion` panel behavior

**Requirement:** R6.4 (already in CSS — verify it has not regressed)  
**What:** Verify the existing `@media(prefers-reduced-motion:reduce)` rule correctly removes the scale transform from `#cp` and `#cp.open`. No code change expected; this is a regression check that becomes a commit only if a fix is needed.

**Check:**
1. DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`.
2. Open and close the colors panel. It fades in/out — no scale animation.
3. Dot drag: no `scale(1.2)` on the dot. Nav spring: instant scroll.
4. If all pass with no code change, skip this commit (nothing to commit).

---

## T5 — Flash-of-default-theme: verify and fix if needed

**Requirement:** R7 note  
**What:** With a non-default accent saved in `localStorage`, hard-reload the page and observe whether a yellow flash is visible before the saved color applies.

**How to test:**
1. Set accent to Cyan, reload. Watch the first 200 ms — does yellow briefly appear?
2. If no flash: no change needed, skip this commit.
3. If flash visible: move the localStorage read + CSS variable application into an inline `<script>` tag in `<head>`, before `</head>`. This script reads `lck-theme` from localStorage and sets `--y`, `--a`, `--on`, `--ring`, and `data-mode` on `:root` synchronously. The full `apply()` in the IIFE still runs at DOMContentLoaded to wire up the UI state (button labels, `aria-pressed`, etc.).

**Minimal head script (only if needed):**
```html
<script>
(function(){try{
  var s=JSON.parse(localStorage.getItem('lck-theme'));
  if(!s||!/^#[0-9a-f]{6}$/i.test(s.a))return;
  var r=document.documentElement;
  r.style.setProperty('--y',s.a);
  r.style.setProperty('--ring',s.a+'33');
  if(s.m==='light')r.setAttribute('data-mode','light');
}catch(e){}}());
</script>
```

**Check:**
1. With Cyan saved, hard-reload (Ctrl+Shift+R). No yellow flash. Cyan visible immediately.
2. Clear localStorage, reload. Yellow default loads. No error in console.

---

## T6 — Preset swatch `aria-pressed` correctness on load

**Requirement:** R1.2, R1.5  
**What:** Verify that on page load with a saved preset, the correct swatch has `aria-pressed="true"` and all others have `aria-pressed="false"`. This is handled by `apply()` calling the `forEach` over `sw.children`. Confirm it works; no code change expected unless broken.

**Check:**
1. Click Green, reload. Inspect DOM: Green swatch `aria-pressed="true"`, all others `false`.
2. Click Reset, reload. Yellow swatch `aria-pressed="true"`.
3. Use free picker (not a preset), reload. All swatches `aria-pressed="false"`.

---

## T7 — Reset also resets the color picker input value

**Requirement:** R5.3  
**What:** Confirm that after clicking Reset, `#ci` (the color picker input) shows `#f5d90a`. The existing `apply()` already sets `ci.value = S.a` — verify this covers the reset case.

**Check:**
1. Pick a custom color via the picker. Click Reset. Inspect `#ci` — value is `#f5d90a`. Pass.

---

## Skipped / deferred

- Contrast measurement against card backgrounds (`--card`) is not required by the spec; `--a` is only required to contrast against `--bg`. Note in `docs/debt.md` for a future pass.
- Testing with actual assistive technology (screen reader announcement of mode change) is deferred to Hermes review.
