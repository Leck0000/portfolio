---
project: lck-drag-path
feature: rail-and-accessibility
phase: spec
status: approved
updated: 2026-11-13
---
# Requirements — rail-and-accessibility

## Context

The drag-path scroll rail (`#rail`) is the page's signature interaction. It already works by mouse, touch, and keyboard. This spec formalises the full behavioural contract — drag, fling, keyboard, reduced-motion, screen-reader semantics — and closes the one known accessibility gap: a skip-to-main link (WCAG 2.4.1, Level A).

No new dependencies. Everything stays in `index.html`.

## Existing baseline (confirmed in `index.html`)

| Item | Status |
|---|---|
| `role="slider"`, `aria-orientation="vertical"`, `aria-valuemin/max/valuenow` | ✓ present |
| Keyboard: Arrow ±5 %, Home, End | ✓ present |
| `touch-action: none`, `setPointerCapture` | ✓ present |
| `prefers-reduced-motion` → instant scroll | ✓ present |
| `prefers-reduced-transparency` → solid surfaces | ✓ present |
| `prefers-contrast: more` → solid glass | ✓ present |
| `3px var(--fg)` focus outline on `#rail:focus-visible` | ✓ present |
| `aria-label="Main"` on `<nav>` | ✓ present |
| `lang="en"` on `<html>` | ✓ present |
| Skip-to-main link | ✗ missing |

## Requirements

### R1 — Drag: 1:1 grab with offset preservation

WHEN a visitor presses the pointer down anywhere on `#rail`  
THE SYSTEM SHALL begin a drag, keeping the dot at exactly the pointer's Y position relative to where it was grabbed (offset preserved), not snapping to the pointer tip.

**Acceptance criteria**

1. WHEN pointer-down fires on `#rail`  
   THE SYSTEM SHALL record the offset between the pointer Y and the dot's current Y, and use that offset for the duration of the drag.

2. WHEN the offset between pointer Y and dot Y is greater than 24 px at the moment of grab  
   THE SYSTEM SHALL treat the offset as zero (snap-to-pointer) rather than introducing a large jump.

3. WHEN the dot is dragged beyond the top or bottom of the rail  
   THE SYSTEM SHALL apply rubber-band resistance (the dot moves less than the pointer, converging asymptotically) so it never leaves the rail by more than a visible margin.

4. WHEN the pointer is released  
   THE SYSTEM SHALL spring the dot back to the constrained position (0 % – 100 % of the rail) if it was rubber-banded.

5. WHEN a drag is active  
   THE SYSTEM SHALL add class `d` to `#rail` and scale the dot to 1.2×, and remove them on release.

6. WHEN `prefers-reduced-motion` is active  
   THE SYSTEM SHALL skip the scale transform on the dot (no visual size change during drag).

---

### R2 — Fling: momentum handoff

WHEN a visitor releases the pointer after a fast drag  
THE SYSTEM SHALL hand the release velocity to the spring and let the page coast, decelerating naturally.

**Acceptance criteria**

1. WHEN the pointer is released with a velocity above 400 px/s (measured over the last ≤ 6 samples, within 80 ms of release)  
   THE SYSTEM SHALL continue scrolling in the same direction by passing the velocity to the spring (`springTo`).

2. WHEN the pointer is released with a velocity at or below 400 px/s  
   THE SYSTEM SHALL stop the scroll at the current position (no fling).

3. WHEN a fling is in progress and the visitor touches, scrolls, or presses any key  
   THE SYSTEM SHALL cancel the fling immediately (interruptible).

4. WHEN `prefers-reduced-motion` is active  
   THE SYSTEM SHALL not fling; release always stops at the current scroll position.

---

### R3 — Spring scroll

WHEN the page is commanded to scroll to a target (nav link, keyboard on the rail, fling, or section snap)  
THE SYSTEM SHALL animate to that target using a critically damped spring (damping 1.0, response 0.45 s).

**Acceptance criteria**

1. WHEN the spring is running  
   THE SYSTEM SHALL settle within 0.4 px and 4 px/s of the target before stopping, then snap exactly to the target.

2. WHEN the spring is running and the visitor provides any input (wheel, touchstart, keydown, pointerdown)  
   THE SYSTEM SHALL cancel the animation immediately, leaving the page at its current scroll position.

3. WHEN `prefers-reduced-motion` is active  
   THE SYSTEM SHALL replace the spring with an instant `scrollTo` call (no animation).

4. WHEN a nav link is clicked  
   THE SYSTEM SHALL scroll to the target section using the spring, prevent the default anchor jump, and update the URL hash without pushing a new history entry.

---

### R4 — Dot position tracking

WHEN the page scrolls (by any means)  
THE SYSTEM SHALL update the dot's position on the rail to reflect the current scroll progress (0 % at top, 100 % at bottom).

**Acceptance criteria**

1. WHEN scroll progress is P  
   THE SYSTEM SHALL place the dot at Y = P × railHeight on the sinusoidal path, and at the corresponding X on that path.

2. WHEN the page has not been scrolled  
   THE SYSTEM SHALL place the dot at the top of the rail (Y = 0).

3. WHEN the page is at maximum scroll  
   THE SYSTEM SHALL place the dot at the bottom of the rail (Y = railHeight).

4. WHEN the viewport is resized  
   THE SYSTEM SHALL rebuild the SVG path and reposition the dot.

5. WHEN the dot is settling after a drag release (snap class active)  
   THE SYSTEM SHALL animate dot position with the CSS transition (`top 0.35s cubic-bezier(.2,.9,.3,1)`) and remove the snap class after 380 ms.

6. WHEN `prefers-reduced-motion` is active  
   THE SYSTEM SHALL skip the snap transition (dot moves instantly to its new position).

---

### R5 — Keyboard operation

WHEN `#rail` has focus and the visitor presses a key  
THE SYSTEM SHALL scroll the page according to the key, as a WCAG 2.1 slider.

**Acceptance criteria**

1. WHEN Arrow Down or Arrow Right is pressed  
   THE SYSTEM SHALL scroll forward by 5 % of the scrollable height.

2. WHEN Arrow Up or Arrow Left is pressed  
   THE SYSTEM SHALL scroll backward by 5 % of the scrollable height.

3. WHEN Home is pressed  
   THE SYSTEM SHALL scroll to the top of the page (0 %).

4. WHEN End is pressed  
   THE SYSTEM SHALL scroll to the bottom of the page (100 %).

5. WHEN any rail key is pressed  
   THE SYSTEM SHALL call `preventDefault()` to suppress native browser scroll.

6. WHEN `#rail` is focused  
   THE SYSTEM SHALL show a `3px var(--fg)` focus outline with `outline-offset: 3px`.

7. WHEN `#rail` has focus and `aria-valuenow` changes  
   THE SYSTEM SHALL update `aria-valuenow` to the nearest integer percentage, so assistive technology can read the current position.

---

### R6 — Touch operation

WHEN a visitor drags the dot with a finger on a touch device  
THE SYSTEM SHALL behave identically to pointer drag (R1 and R2), using the Pointer Events API.

**Acceptance criteria**

1. WHEN a touch drag begins on `#rail`  
   THE SYSTEM SHALL call `setPointerCapture` so the drag continues even if the finger moves outside the rail.

2. WHEN a touch drag ends  
   THE SYSTEM SHALL apply the same velocity-based fling logic as pointer release (R2).

3. WHEN a visitor scrolls the page by swiping anywhere outside `#rail`  
   THE SYSTEM SHALL not interfere with native scroll (the `touch-action: none` restriction applies only to `#rail`, not the page).

---

### R7 — Screen-reader semantics

WHEN a screen reader encounters `#rail`  
THE SYSTEM SHALL present it as a vertical slider controlling page position.

**Acceptance criteria**

1. WHEN rendered  
   THE SYSTEM SHALL have `role="slider"`, `aria-orientation="vertical"`, `aria-valuemin="0"`, `aria-valuemax="100"`, and `aria-label="Page position"`.

2. WHEN the page scrolls  
   THE SYSTEM SHALL update `aria-valuenow` to the nearest integer (0–100).

3. WHEN the dot or SVG path elements are rendered  
   THE SYSTEM SHALL have `aria-hidden="true"` on any purely decorative child elements inside `#rail` to avoid duplicate announcements.

4. WHEN `#rail` is encountered by a screen reader  
   THE SYSTEM SHALL have a `title` attribute of "Drag along the path" for tooltip display (already present; must not be removed).

---

### R8 — Skip-to-main link (WCAG 2.4.1, Level A)

WHEN a keyboard user opens the page  
THE SYSTEM SHALL provide a skip link that, when activated, moves focus directly to `<main>`.

**Acceptance criteria**

1. WHEN the page loads and the visitor has not yet interacted  
   THE SYSTEM SHALL include a visually hidden skip link as the first focusable element in the DOM.

2. WHEN the skip link receives focus (e.g. first Tab press)  
   THE SYSTEM SHALL become visible (positioned at top-left, contrasting background, legible text).

3. WHEN the skip link is activated  
   THE SYSTEM SHALL move focus to `<main>` and scroll it into view.

4. WHEN focus leaves the skip link without activation  
   THE SYSTEM SHALL hide it again (return to visually hidden state).

5. WHEN rendered  
   THE SYSTEM SHALL use link text "Skip to main content".

**Implementation note**  
A standard CSS clip-and-position technique is sufficient:

```css
.skip-link {
  position: absolute;
  top: -9999px;
  left: 0;
  background: var(--fg);
  color: var(--bg);
  padding: .6rem 1.2rem;
  border-radius: 0 0 8px 0;
  font-weight: 600;
  z-index: 100;
  text-decoration: none;
}
.skip-link:focus-visible {
  top: 0;
}
```

`<main>` needs `tabindex="-1"` to be a focus target without appearing in the tab order.

---

### R9 — Touch target size

WHEN `#rail` is rendered on any viewport  
THE SYSTEM SHALL provide a touch / click target of at least 44 × 44 CSS px (WCAG 2.5.5, Level AA).

**Acceptance criteria**

1. WHEN rendered  
   THE SYSTEM SHALL have `width: 44px` and `height ≥ 44px` (currently 66 vh, which is well above 44 px on any supported device).

2. WHEN rendered at 375 px viewport width  
   THE SYSTEM SHALL not overlap the main content text area (the existing `padding-right: 4rem` on `<main>` clears the rail).

---

### R10 — Responsive layout

WHEN the page is viewed at any supported viewport width  
THE SYSTEM SHALL keep the rail visible and usable, and the main content readable.

**Acceptance criteria**

1. WHEN the viewport is 375 px wide  
   THE SYSTEM SHALL show the rail at `right: max(6px, env(safe-area-inset-right, 0px))` and the main content with no horizontal overflow.

2. WHEN the viewport is 375 px wide  
   THE SYSTEM SHALL show `<main>` with right padding sufficient to clear the rail (`4rem` = 64 px at default font size).

3. WHEN the viewport is 768 px, 1024 px, or 1440 px wide  
   THE SYSTEM SHALL show the rail in the same position and the content centred at max-width 46 rem.

4. WHEN the viewport width is less than 375 px  
   THE SYSTEM SHALL not introduce horizontal overflow on `<body>` (existing `overflow-x: hidden` must remain).

---

## Non-goals

- No redesign of the rail path shape (sinusoidal curve stays).
- No new interaction modes (e.g. click-to-jump on the path rather than on the dot).
- No unit or integration test framework — Hermes writes browser-automation tests from these EARS criteria.
- No change to the rail's visual styling beyond what R6–R8 require.

## Open questions — resolved

1. **`aria-valuenow` announce frequency** — left to Hermes to test with assistive technology. No throttle prescribed in this spec; Hermes will note findings in `docs/review.md` and Kiro will add a throttle if testing shows it is needed.
2. **Rail on very small landscape viewports** — leave as-is. No height threshold or hide behaviour added.
