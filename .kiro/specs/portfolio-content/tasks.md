---
project: lck-drag-path
feature: portfolio-content
phase: plan
status: approved
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

## T2 — Card image area: regression check *(already in baseline)*

**Requirement:** R2 (structure only — no real assets yet)  
**Status:** Baseline `index.html` already has `.card-img` markup with placeholder span and all required CSS. This is a regression check only — no code change expected.

**Check:**
1. Open in browser. Each card shows a placeholder area at the top (`No screenshot yet` on card background).
2. At 375 px: single-column grid, no overflow. At 768 px: two-column grid.
3. Card border-radius, padding, background, border, and shadow unchanged from baseline.
4. No horizontal scrollbar at any tested width.
5. If all pass with no code change, skip this commit.

---

## T3 — Card grid: two-column layout at 768 px — regression check *(already in baseline)*

**Requirement:** R2.6, R2.7  
**Status:** Baseline already has `@media(min-width:768px){.grid{grid-template-columns:1fr 1fr}}`. Regression check only — no code change expected.

**Check:**
1. At 375 px: single column. At 768 px: two columns. At 1024 px: two columns. No overflow at any width.
2. If all pass with no code change, skip this commit.

---

## T4 — Card links: regression check *(already in baseline)*

**Requirement:** R2.3, R2.5  
**Status:** Baseline already wraps each `.card` in `<a class="card-link" href="#" target="_blank" rel="noopener noreferrer">` with `<!-- TODO: replace with real project URL -->` comments. Focus ring CSS is present. Regression check only — no code change expected.

**Check:**
1. Tab to each card link — 3px `--fg` focus ring visible.
2. Card visually unchanged (no underline, no color change).
3. Source contains `<!-- TODO: replace with real project URL -->` comment on each card.
4. `target="_blank"` and `rel="noopener noreferrer"` present on each link.
5. If all pass with no code change, skip this commit.

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
