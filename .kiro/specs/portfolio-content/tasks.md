---
project: lck-drag-path
feature: portfolio-content
phase: plan
status: draft
updated: 2026-11-13
---
# Tasks — portfolio-content

Branch: `feat/portfolio-content`
One commit per task. All checks run with `python -m http.server` and the browser open at `http://localhost:8000`.

---

## T1 — Hero copy pass

**Requirement:** R1  
**What:** Verify the `<h1>` and `.sub` paragraph satisfy R1 (names builder, what he builds, audience, no unexplained jargon). Make any copy edits needed. No structural change.

**Check:**
1. Open at 375 × 667 px in browser DevTools device emulation.
2. Confirm `<h1>` and `.sub` are both fully visible without scrolling.
3. Read aloud: does it name Aleck, what he builds, and who it is for in plain words? If yes, pass.
4. Search the hero text for any term that lacks an inline gloss (e.g. "automation" without explanation). If none, pass.

**Done when:** No copy changes needed, or copy edited and all four checks pass.

---

## T2 — Card image area: add screenshot slot to card HTML and CSS

**Requirement:** R2 (structure only — no real assets yet)  
**What:** Add an image area at the top of each `.card` in the Work section. When no asset is provided, show the neutral placeholder (card background + "No screenshot yet" label). Card layout, border-radius, and tokens must not change.

**What to change in `index.html`:**
- Add a `<div class="card-img">` as the first child of each `.card`, containing an `<img>` with `alt=""` and `src=""` (empty until assets arrive), plus a `<span class="card-img-placeholder">No screenshot yet</span>` shown when `src` is empty.
- Add CSS: `.card-img` fixed height (`10rem`), `border-radius: 20px 20px 0 0`, `overflow: hidden`, `background: var(--card)`. `img` inside: `width: 100%; height: 100%; object-fit: cover; display: block`. `.card-img-placeholder`: centered, `color: var(--mut)`, `font-size: .85rem`, shown only when `img` has no `src` (use `:not([src])` or the `onerror` pattern — see note).

**Note:** `<img src="">` with an empty string still fires a request in some browsers. Use `<img alt="..." data-src="">` and only set `src` when a real value exists, or simply omit the `src` attribute entirely and show the placeholder `<span>` unconditionally until real assets are supplied.

**Check:**
1. Open in browser. Each card shows a placeholder area at the top (`No screenshot yet` on card background).
2. At 375 px: single-column grid, no overflow. At 768 px: two-column grid (see T3).
3. Card border-radius, padding, background, border, and shadow unchanged from baseline.
4. No horizontal scrollbar at any tested width.

---

## T3 — Card grid: two-column layout at 768 px

**Requirement:** R2.6, R2.7  
**What:** Add a media query so `.grid` switches to two columns at 768 px. Currently `.grid` is `display: grid; gap: .9rem` with no column rule (so it is always single-column).

**What to change:**
```css
@media(min-width:768px){.grid{grid-template-columns:1fr 1fr}}
```

**Check:**
1. At 375 px: single column. At 768 px: two columns. At 1024 px: two columns. No overflow at any width.

---

## T4 — Card links: wrap each card in an anchor

**Requirement:** R2.3, R2.5  
**What:** Wrap each `.card` in `<a href="<!-- TODO: replace -->" target="_blank" rel="noopener noreferrer" class="card-link">`. Add CSS so the link does not add underline or color shift to the card.

**What to change:**
- Wrap each card div in `<a class="card-link" href="#" target="_blank" rel="noopener noreferrer">…</a>` with a `<!-- TODO: replace with real project URL -->` comment on the `href`.
- CSS: `.card-link{display:block;text-decoration:none;color:inherit;border-radius:20px}` and `.card-link:focus-visible{outline:3px solid var(--fg);outline-offset:3px}`.
- The existing `.card` styles stay on the inner `div`.

**Check:**
1. Tab to each card link — 3px `--fg` focus ring visible.
2. Card visually unchanged (no underline, no color change).
3. Source contains `<!-- TODO: replace with real project URL -->` comment on each href.
4. `target="_blank"` and `rel="noopener noreferrer"` present on each link (inspect DOM).

---

## T5 — About section: degree name in full

**Requirement:** R3.1  
**What:** Ensure the About section writes out "Bachelor of Science in Information Technology (BSIT)" rather than only the abbreviation. Current text already includes the full name — verify and edit only if needed.

**Check:**
1. View source: search for "Bachelor of Science in Information Technology". Present → pass.
2. If only "BSIT" is found, expand it and re-check.

---

## T6 — Contact: placeholder comments

**Requirement:** R4.4  
**What:** Confirm both contact buttons contain clearly marked placeholder comments so the incomplete state is visible. Current `href` values are `mailto:your@email.com` and `https://github.com/`.

**What to change:**
- Replace `href="mailto:your@email.com"` with `href="mailto:your@email.com"<!-- TODO: replace with real email -->` — actually, add the comment as a sibling HTML comment on the line above the element, since comments cannot be inside attribute values.
- Same for the GitHub button.

**What to add above each button:**
```html
<!-- TODO: replace with real email address -->
<a class="btn" href="mailto:your@email.com">Email me</a>

<!-- TODO: replace with real GitHub profile URL -->
<a class="btn o" href="https://github.com/" target="_blank" rel="noopener noreferrer">See my code on GitHub</a>
```

Also add `target="_blank" rel="noopener noreferrer"` to the GitHub button if not already present (R4.3).

**Check:**
1. View source: `<!-- TODO: replace with real email address -->` comment present above email button.
2. View source: `<!-- TODO: replace with real GitHub profile URL -->` comment present above GitHub button.
3. GitHub button has `target="_blank" rel="noopener noreferrer"`.
4. Neither placeholder value has changed (still `mailto:your@email.com` and `https://github.com/`).

---

## T7 — Footer: copyright year

**Requirement:** R5.1  
**What:** Confirm the footer year matches the current year (2026). No change needed unless it differs.

**Check:**
1. View source: footer contains `© 2026`. Pass.
2. No emoji, band name, song title, or band artwork in footer text.

---

## Skipped / deferred

- Real email, GitHub URL, project URLs, and screenshots are explicitly deferred. Hermes will fetch and inject them in the Review/Deploy phase.
- Card description copy quality (plain language audit beyond what T1 covers) is a Hermes review task.
