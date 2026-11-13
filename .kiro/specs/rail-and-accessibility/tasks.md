---
project: lck-drag-path
feature: rail-and-accessibility
phase: plan
status: approved
updated: 2026-11-13
---
# Tasks — rail-and-accessibility

Branch: `feat/rail-and-accessibility`
One commit per task. All checks run with `python -m http.server` and the browser open at `http://localhost:8000`.

---

## T1 — Skip-to-main link — regression check *(already in baseline)*

**Requirement:** R8  
**Status:** Baseline already has `<a class="skip-link" href="#main-content">Skip to main content</a>` as the first child of `<body>`, `<main id="main-content" tabindex="-1">`, and the full `.skip-link` / `.skip-link:focus-visible` CSS. Regression check only — no code change expected.

**Check:**
1. Open page. Press Tab once. Skip link appears at top-left with contrasting colors.
2. Press Enter. Focus moves to `<main>`. Page scrolls to top of content.
3. Press Tab again (without activating). Skip link hides. Next focused element is the nav name link.
4. Inspect DOM: `<a class="skip-link">` is the first child of `<body>`.
5. Text is exactly "Skip to main content".
6. If all pass with no code change, skip this commit.

---

## T2 — Decorative rail children: `aria-hidden` — regression check *(already in baseline)*

**Requirement:** R7.3  
**Status:** Baseline already has `aria-hidden="true"` on both the `<svg>` and `<div id="dot">` inside `#rail`. Regression check only — no code change expected.

**Check:**
1. Inspect DOM: `<svg>` inside `#rail` has `aria-hidden="true"`.
2. `<div id="dot">` has `aria-hidden="true"`.
3. `#rail` itself still has `role="slider"` and all `aria-*` attributes intact.
4. No visual change to the rail.
5. If all pass with no code change, skip this commit.

---

## T3 — Keyboard navigation regression check

**Requirement:** R5  
**What:** Verify all keyboard behaviors defined in R5 work correctly. This is a regression check against the existing implementation; no code change expected unless broken.

**Check (run in this order):**
1. Tab to `#rail`. Confirm focus ring visible (3px `--fg` outline).
2. Press Arrow Down five times. Page scrolls forward in ~5% increments.
3. Press Arrow Up five times. Page scrolls back.
4. Press End. Page jumps to bottom. `aria-valuenow` is "100".
5. Press Home. Page jumps to top. `aria-valuenow` is "0".
6. While rail is focused, native browser scroll must not trigger (no double-scroll).
7. If all pass with no code change, skip this commit.

---

## T4 — `aria-valuenow` update on scroll

**Requirement:** R5.7, R7.2  
**What:** Confirm `aria-valuenow` on `#rail` updates to the nearest integer percentage whenever the page scrolls (by any means: drag, keyboard, nav click, wheel). The existing `place()` function already calls `rail.setAttribute('aria-valuenow', Math.round(prog()*100))` on the `scroll` event. Verify correctness; no code change expected unless broken.

**Check:**
1. Scroll page to roughly halfway. Inspect `#rail` → `aria-valuenow` is near "50".
2. Scroll to bottom. `aria-valuenow` is "100".
3. Scroll to top. `aria-valuenow` is "0".
4. Drag the dot to 25%. `aria-valuenow` updates during drag.
5. If all pass with no code change, skip this commit.

---

## T5 — Spring interruptibility regression check

**Requirement:** R3.2  
**What:** Confirm that any user input (wheel, touch, key, pointer) cancels an in-progress spring animation immediately. No code change expected unless broken.

**Check:**
1. Click a nav link (e.g. "Work"). Spring begins scrolling.
2. Immediately press any arrow key. Scroll stops. Page stays at interrupted position.
3. Click a nav link. Spring begins. Scroll with the mouse wheel. Spring cancels.
4. Click a nav link. Spring begins. Click the rail dot. Spring cancels.
5. If all pass with no code change, skip this commit.

---

## T6 — Reduced-motion: instant scroll and no scale effects

**Requirement:** R1.6, R2.4, R3.3, R4.6  
**What:** Verify all reduced-motion behaviors. No code change expected; regression check only.

**Check (with DevTools → Rendering → `prefers-reduced-motion: reduce`):**
1. Click a nav link. Page jumps instantly (no spring animation).
2. Drag the dot and release with velocity. No fling — page stays at release position.
3. Drag the dot. `#dot` does not scale to 1.2× during drag.
4. After drag release, dot moves to snap position instantly (no CSS transition).
5. Colors panel opens and closes with fade only (no scale).
6. If all pass with no code change, skip this commit.

---

## T7 — Responsive layout: no overflow at 375 px

**Requirement:** R10.1, R10.2, R10.4  
**What:** Verify the rail, main content, and body produce no horizontal overflow at 375 px width. No code change expected; regression check only.

**Check:**
1. DevTools → 375 × 667 px.
2. No horizontal scrollbar on `<body>`.
3. Main content text does not run under the rail (right padding clears 44px rail + margin).
4. Rail visible at right edge (`right: max(6px, …)`).
5. At 768 px, 1024 px, and 1440 px: same — no overflow, rail visible.
6. If all pass with no code change, skip this commit.

---

## T8 — Touch target size: regression check

**Requirement:** R9  
**What:** Confirm `#rail` maintains at least 44 × 44 px. No change expected.

**Check:**
1. DevTools → inspect `#rail`. Computed width: 44 px. Height: > 44 px (66 vh).
2. At 375 px viewport: same dimensions hold.
3. If all pass with no code change, skip this commit.

---

## T9 — Rail `title` attribute preserved

**Requirement:** R7.4  
**What:** Confirm `title="Drag along the path"` is present on `#rail` and has not been accidentally removed by any other task in this feature branch.

**Check:**
1. Inspect DOM: `#rail` has `title="Drag along the path"`. Pass.

---

## T10 — Full keyboard tab-order smoke test

**Requirement:** R8, R5, general accessibility  
**What:** Tab through the entire page and confirm focus order is logical and every interactive element has a visible focus ring.

**Check (tab order expected):**
1. Skip link (appears on first Tab)
2. Nav: name link, Work, About, Tools, Contact, color button
3. Color panel (when open): swatches ×6, color picker, Light mode button, Reset button
4. Rail slider
5. Hero: "See my work" button, "Contact me" button
6. Work: four card links
7. Contact: Email me, GitHub button

Each element: 3px `--fg` focus outline visible. No element skipped or focused out of DOM order.
If a focus ring is missing, add `outline` rule for that element and note it. Each missing ring is its own fix and its own commit.

---

## Skipped / deferred

- `aria-valuenow` throttle: deferred to Hermes AT testing (spec open question). If Hermes finds it noisy, Kiro adds a 200 ms debounce as a follow-up task.
- Rail visibility on small landscape viewports: left as-is per spec decision.
- Screen reader testing (NVDA, VoiceOver): Hermes review phase.
