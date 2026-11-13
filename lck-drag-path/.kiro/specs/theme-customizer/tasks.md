---
project: lck-drag-path
feature: theme-customizer
phase: plan
status: draft
updated: 2026-11-13
---
# Tasks — theme-customizer

Branch: `feat/theme-customizer`
One commit per task. All checks run with `python -m http.server` and the browser open at `http://localhost:8000`.

---

## T1 — Extract WCAG luminance helpers

**Requirement:** R3  
**What:** Add two pure-JS helper functions inside the existing IIFE in `index.html`, before `apply()`. These replace the current ad-hoc `lum()` and `mix()` functions with ones that implement the WCAG relative-luminance formula and an iterative contrast-adjustment loop.

**Functions to add (replace existing `lum` and `mix`):**

```js
// WCAG 2.1 relative luminance (IEC 61966-2-1 sRGB)
function wcagLum(hex) {
  var n = parseInt(hex.slice(1), 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255].reduce(function(sum, c, i) {
    var s = c / 255;
    s = s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    return sum + s * [0.2126, 0.7152, 0.0722][i];
  }, 0);
}

// Contrast ratio between two hex colors (always ≥ 1)
function contrast(h1, h2) {
  var l1 = wcagLum(h1), l2 = wcagLum(h2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// Blend hex toward target channel value t (0–255) by fraction p
function mix(hex, t, p) {
  var n = parseInt(hex.slice(1), 16);
  return '#' + [n >> 16 & 255, n >> 8 & 255, n & 255]
    .map(function(v) { return ('0' + Math.round(v * (1 - p) + t * p).toString(16)).slice(-2); })
    .join('');
}
```

Remove the old `lum` function. `mix` signature stays the same (backward-compatible).

**Check:**
1. Open browser console. Run:
   ```js
   contrast('#f5d90a', '#121212') // should be ≥ 4.5
   contrast('#ffffff', '#000000') // should be 21
   contrast('#808080', '#808080') // should be 1
   ```
2. No console errors on page load.
3. Existing theme behavior unchanged (yellow accent still applies on load).

---

## T2 — Iterative contrast adjustment for `--a` and `--on`

**Requirement:** R3.1, R3.2, R3.4  
**What:** Replace the heuristic contrast derivation in `apply()` with an iterative loop that guarantees 4.5:1 for `--a` against `--bg`, and 4.5:1 for `--on` against `--y`.

**Replace the current `--a` and `--on` block in `apply()`:**

```js
function adjustToContrast(hex, bg, target, toward) {
  // toward: 0 = darken, 255 = lighten
  var out = hex, step = 0, ratio;
  while ((ratio = contrast(out, bg)) < target && step < 50) {
    out = mix(out, toward, 0.07);
    step++;
  }
  if (contrast(out, bg) < target) {
    // edge case: fell through — use --fg and warn
    console.warn('[theme] Cannot reach ' + target + ':1 for ' + hex + ' on ' + bg);
    return null; // caller uses --fg fallback
  }
  return out;
}
```

Inside `apply()`, replace the existing `--a` / `--on` derivation with:

```js
var bgHex = S.m === 'dark' ? '#121212' : '#f5f5f7';
var toward = S.m === 'dark' ? 255 : 0;
var aVal = adjustToContrast(S.a, bgHex, 4.5, toward);
R.style.setProperty('--a', aVal !== null ? aVal : 'var(--fg)');

var onToward = wcagLum(S.a) > 0.55 ? 0 : 255;
var onVal = contrast(onToward === 0 ? '#000000' : '#ffffff', S.a) >= 4.5
  ? (onToward === 0 ? '#000000' : '#ffffff')
  : (onToward === 0 ? '#ffffff' : '#000000');
R.style.setProperty('--on', onVal);
```

**Check:**
1. Apply each of the six presets. Open DevTools → Computed styles → verify `--a` value.
2. For each preset in dark mode, run in console: `contrast(getComputedStyle(document.documentElement).getPropertyValue('--a').trim(), '#121212')` — result must be ≥ 4.5.
3. For each preset in light mode, repeat against `'#f5f5f7'` — result must be ≥ 4.5.
4. For the yellow preset (`#f5d90a`), `--on` must be `#000000` (black text on yellow).
5. No console errors; edge-case warn only if triggered.

---

## T3 — `prefers-contrast: more` body-copy boost

**Requirement:** R3.3  
**What:** When `prefers-contrast: more` is active, re-run `adjustToContrast` with a 7:1 target for the body-copy color (`--fg` / `--mut` on `--bg`). This is a CSS media query, not a JS change — use CSS custom-property overrides in a `@media` block.

**What to add in the `<style>` block:**

```css
@media(prefers-contrast:more){
  :root{--fg:#ffffff;--mut:#d0cfc9}
  :root[data-mode=light]{--fg:#000000;--mut:#3a3a3f}
}
```

These values are pre-verified to clear 7:1 on the respective backgrounds (`#121212` / `#f5f5f7`). The accent path (`--a`) is already handled by the JS in T2 (it only targets 4.5:1; the CSS boost covers body text independently).

**Check:**
1. In DevTools → Rendering → Emulate CSS media: `prefers-contrast: more`.
2. Body text visually more contrasty than default. No horizontal overflow or layout break.
3. Cards, nav, and buttons still readable.
4. Disable emulation — page returns to normal.

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
