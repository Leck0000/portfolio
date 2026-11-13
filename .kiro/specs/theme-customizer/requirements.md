---
project: lck-drag-path
feature: theme-customizer
phase: spec
status: draft
updated: 2026-11-13
---
# Requirements — theme-customizer

## Context

The colors panel (`#cp`) already exists in `index.html` with six preset swatches, a free color picker, a light/dark toggle, and a reset button. State is saved to `localStorage`. This spec formalises what "working correctly" means for every part of the customizer and closes the one known gap: the 4.5:1 contrast guarantee is a heuristic today, not a measured fact.

The customizer must work without any external dependency and without a build step.

## Background: how accent contrast works today

`apply()` in `index.html` computes two derived variables from the raw accent `--y`:

| Variable | Purpose | Current rule |
|---|---|---|
| `--on` | text color drawn on top of a filled accent button | black if luminance > 0.55, else white |
| `--a` | accent used as text or border (on `--bg` / `--card`) | in dark mode: lighten 50% if luminance < 0.4; in light mode: darken 55% if luminance > 0.3 |

The heuristic is close but not guaranteed to reach 4.5:1 for every free-picker input against every background. The spec requires the build to implement a verifiable rule (see R3).

## Requirements

### R1 — Accent preset swatches

WHEN a visitor clicks a preset swatch  
THE SYSTEM SHALL apply that accent color immediately to all accent-colored elements on the page, without a page reload.

**Acceptance criteria**

1. WHEN a swatch is clicked  
   THE SYSTEM SHALL update `--y`, `--a`, `--on`, and `--ring` on `:root` within one animation frame.

2. WHEN a swatch is selected  
   THE SYSTEM SHALL set `aria-pressed="true"` on that swatch and `aria-pressed="false"` on all others.

3. WHEN the preset list renders  
   THE SYSTEM SHALL include exactly these six options in this order: Yellow (`#f5d90a`), Cyan (`#22d3ee`), Pink (`#ff5fa2`), Green (`#4ade80`), Orange (`#ff8a3d`), Red (`#ff4d4d`).

4. WHEN a swatch button is focused by keyboard  
   THE SYSTEM SHALL show a `3px var(--fg)` focus outline.

5. WHEN the visitor saves the choice and returns to the page later  
   THE SYSTEM SHALL restore the previously selected accent from `localStorage` on page load.

---

### R2 — Free color picker

WHEN a visitor uses the color picker (`<input type="color">`)  
THE SYSTEM SHALL apply any chosen color as the accent color immediately, using the same derivation rules as the preset swatches.

**Acceptance criteria**

1. WHEN the input value changes  
   THE SYSTEM SHALL update `--y`, `--a`, `--on`, and `--ring` within one animation frame.

2. WHEN any color is applied via the picker  
   THE SYSTEM SHALL deselect all preset swatches (all `aria-pressed="false"`).

3. WHEN the visitor saves the choice and returns to the page later  
   THE SYSTEM SHALL restore the custom color from `localStorage` on page load.

4. WHEN the picker receives focus  
   THE SYSTEM SHALL show a `3px var(--fg)` focus outline.

---

### R3 — Accessible contrast for accent-on-background

WHEN any accent color is applied (preset or free-picker)  
THE SYSTEM SHALL derive `--a` (the accent used as text or on borders) such that it meets a minimum contrast ratio of 4.5:1 against `--bg` in the current mode.

**Acceptance criteria**

1. WHEN the computed relative luminance of `--a` against `--bg` is below 4.5:1  
   THE SYSTEM SHALL iterate the lightness of `--a` (darkening in light mode, lightening in dark mode) until 4.5:1 is reached, or until the extreme (pure black / pure white) is reached.

2. WHEN the computed relative luminance of `--on` against `--y` is below 4.5:1  
   THE SYSTEM SHALL flip `--on` to the other pole (black or white) so that it meets 4.5:1.

3. WHEN `prefers-contrast: more` is active  
   THE SYSTEM SHALL apply the same contrast check and enforce a minimum of 4.5:1 on all text. For body copy (paragraphs, card descriptions, section text — not labels or buttons) THE SYSTEM SHALL aim for 7:1 (WCAG AAA) where achievable without inverting the brand palette.

4. WHEN contrast cannot be reached (edge case: a mid-grey accent where neither pure-black nor pure-white text clears 4.5:1 against the background)  
   THE SYSTEM SHALL fall back to `--fg` for text color and log a `console.warn` with the offending hex value. This edge case must not throw an uncaught error.

**Implementation note (not a requirement — guidance for the build task)**  
The WCAG relative luminance formula (`0.2126 R + 0.7152 G + 0.0722 B`, with sRGB linearisation) must be used for the check. No external library. A pure-JS helper of ≤ 20 lines is sufficient.

---

### R4 — Light / dark mode toggle

WHEN a visitor clicks the mode toggle button  
THE SYSTEM SHALL switch between dark mode (default) and light mode, updating all color tokens and the button label immediately.

**Acceptance criteria**

1. WHEN dark mode is active  
   THE SYSTEM SHALL show the button label "Light mode" and have `data-mode="dark"` on `:root`.

2. WHEN light mode is active  
   THE SYSTEM SHALL show the button label "Dark mode" and have `data-mode="light"` on `:root`.

3. WHEN mode changes  
   THE SYSTEM SHALL re-run the contrast derivation (R3) for the current accent against the new background.

4. WHEN the visitor saves the choice and returns to the page later  
   THE SYSTEM SHALL restore the previously selected mode from `localStorage` on page load.

5. WHEN `localStorage` is unavailable  
   THE SYSTEM SHALL default to dark mode without throwing an uncaught error.

---

### R5 — Reset

WHEN a visitor clicks the Reset button  
THE SYSTEM SHALL restore the accent to Yellow (`#f5d90a`) and the mode to dark, and save that state to `localStorage`.

**Acceptance criteria**

1. WHEN Reset is clicked  
   THE SYSTEM SHALL restore `--y`, `--a`, `--on`, `--ring`, and `data-mode` to their default values within one animation frame.

2. WHEN Reset is clicked  
   THE SYSTEM SHALL update `localStorage` to the default state.

3. WHEN Reset is clicked  
   THE SYSTEM SHALL set `aria-pressed="true"` on the Yellow swatch and deselect all others.

---

### R6 — Panel open / close

WHEN a visitor activates the color-button (`#cb`) in the nav  
THE SYSTEM SHALL open the colors panel (`#cp`), making it interactive and visible.

WHEN the panel is open and the visitor activates `#cb` again, presses Escape, or clicks outside the panel  
THE SYSTEM SHALL close the panel and return focus to `#cb`.

**Acceptance criteria**

1. WHEN the panel opens  
   THE SYSTEM SHALL set `aria-expanded="true"` on `#cb` and remove `inert` from `#cp`.

2. WHEN the panel closes  
   THE SYSTEM SHALL set `aria-expanded="false"` on `#cb` and restore `inert` on `#cp`.

3. WHEN `prefers-reduced-motion` is not active  
   THE SYSTEM SHALL animate the panel open with a scale + opacity transition (`scale(0.94) → 1`, `opacity 0 → 1`, 300ms spring).

4. WHEN `prefers-reduced-motion` is active  
   THE SYSTEM SHALL show and hide the panel with an opacity fade only (no scale transform).

5. WHEN the panel is open and the viewport is 375 px wide  
   THE SYSTEM SHALL not overflow the viewport horizontally (panel max-width: `min(18rem, calc(100vw - 1.5rem))`).

---

### R7 — Persistence and fallback

WHEN the page loads  
THE SYSTEM SHALL attempt to read theme state from `localStorage` key `lck-theme`.

**Acceptance criteria**

1. WHEN a valid saved state is found (`{ a: "#rrggbb", m: "dark"|"light" }`)  
   THE SYSTEM SHALL apply it before the first paint (synchronously in `<script>` before the closing `</body>` tag, or via a `<style>` block in `<head>`).

2. WHEN the saved state is malformed or absent  
   THE SYSTEM SHALL apply the default (Yellow, dark) without throwing an error.

3. WHEN `localStorage` throws (private browsing, storage full, security policy)  
   THE SYSTEM SHALL catch the error silently and apply the default.

**Note:** Applying the saved theme before first paint prevents a flash of the default yellow on a returning visitor who chose a different accent. The current implementation applies it in the DOMContentLoaded callback, which may cause a brief flash. A flash on first load (no saved preference) is acceptable. The build task should verify the demo and, if a flash is visible for returning visitors (saved preference exists), move the localStorage read into an inline `<script>` in `<head>` that sets CSS variables before the stylesheet renders.

---

## Non-goals

- No server-side theme persistence.
- No system `prefers-color-scheme` auto-detection (the user controls light/dark manually; the default is always dark).
- No additional presets beyond the six defined in R1.3.
- No animation library.

## Open questions — resolved

1. **Flash-of-default-theme** — a flash on first load (no saved preference) is acceptable. For returning visitors (saved preference exists), the build task must verify the demo; if a flash is visible it should be fixed by moving the localStorage read into `<head>`. See R7 note.
2. **AAA contrast target** — baseline is 4.5:1 (AA) across the entire interface. Body copy (paragraphs, descriptions, section text) aims for 7:1 (AAA) under `prefers-contrast: more`, where achievable without inverting the brand palette. See R3.3.
