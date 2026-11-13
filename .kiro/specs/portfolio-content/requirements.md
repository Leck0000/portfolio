---
project: lck-drag-path
feature: portfolio-content
phase: spec
status: draft
updated: 2026-11-13
---
# Requirements — portfolio-content

## Context

`index.html` is the existing baseline. This spec covers all content changes within it: the hero, project cards, about section, stack section, and contact section. It does not redesign any section or introduce new sections (non-goal from `docs/brief.md`). No new dependencies.

Owner-supplied inputs required before build tasks can be marked done:
- Real email address (replaces `mailto:your@email.com`)
- Real GitHub profile URL (replaces `https://github.com/`)
- For each of the four projects: a live URL and a screenshot image (PNG or JPEG, ≤ 200 KB each, any aspect ratio — builder will crop/contain to fit)

## Requirements

### R1 — Hero headline

WHEN a first-time visitor opens the page  
THE SYSTEM SHALL display a headline that names what Aleck Christian Biong builds and who it is for, within the first screen, without requiring any scroll.

**Acceptance criteria**

1. WHEN the page loads at viewport 375 × 667 px  
   THE SYSTEM SHALL show the `<h1>` and the `.sub` paragraph fully within the visible area.

2. WHEN a visitor reads the hero  
   THE SYSTEM SHALL convey the builder's name, what he builds (websites and browser automation), and the audience (businesses and freelance clients) using plain words with no unexplained jargon.

3. WHEN any technical term appears in the hero or sub-headline  
   THE SYSTEM SHALL accompany it with a plain-language gloss in the same sentence or the next (e.g. "browser automation — Python tools that use websites for you").

**Notes**
- The current `h1` ("I build websites and automate web tasks.") already satisfies this intent; only the `.sub` text may need a minor copy pass.
- Do not change the `h1` font size, weight, or color treatment (`<span>` in `--a`).

---

### R2 — Project cards with screenshots and links

WHEN a visitor views the Work section  
THE SYSTEM SHALL show four project cards, each with a name, a one- or two-sentence plain-language description, a screenshot, and a link to the live project or repository.

**Acceptance criteria**

1. WHEN the page renders  
   THE SYSTEM SHALL display exactly four cards: Mapishi Restaurant website, Crypto trading dashboard, SysDesk, Browser automation tools.

2. WHEN an image asset is provided for a project  
   THE SYSTEM SHALL show it inside its card using an `<img>` element with a descriptive `alt` attribute, cropped or contained to a consistent aspect ratio (16:9) using `object-fit: cover`.

3. WHEN a live URL is provided for a project  
   THE SYSTEM SHALL wrap the card or its title in an `<a>` element that opens the URL in a new tab (`target="_blank" rel="noopener noreferrer"`).

4. WHEN no image asset has been provided for a project  
   THE SYSTEM SHALL show a neutral placeholder in the image area (the card's `--card` background with a "No screenshot yet" text at `--mut` color) so layout does not collapse.

5. WHEN a card link is focused by keyboard  
   THE SYSTEM SHALL show the standard `3px var(--fg)` focus outline from `docs/design.md`.

6. WHEN the viewport is 375 px wide  
   THE SYSTEM SHALL lay out the grid as a single column with no horizontal overflow.

7. WHEN the viewport is 768 px or wider  
   THE SYSTEM SHALL lay out the grid as two columns.

**Notes**
- Keep `border-radius: 20px` and existing card token (`--card`, `--line`, `--sh`). Do not change card background, border, or padding except to add the image area at the top of each card.
- Project names and descriptions must stay in plain language; no claim beyond what the owner stated in `docs/brief.md`.
- "A website I built for a real restaurant" is fine. Do not add client names, revenue figures, or unverifiable claims.

---

### R3 — About and stack sections

WHEN a visitor reads the About or Tools section  
THE SYSTEM SHALL present information using plain words and explain any technical term the first time it appears.

**Acceptance criteria**

1. WHEN the About section renders  
   THE SYSTEM SHALL include the degree name in full (Bachelor of Science in Information Technology), not only the abbreviation.

2. WHEN the Tools section renders  
   THE SYSTEM SHALL show each technology with both its name and a one-line plain-language explanation of what it does.

3. WHEN a visitor reads any copy on the page  
   THE SYSTEM SHALL contain no sentence that assumes prior knowledge of programming, trading, or IT acronyms without an inline explanation.

**Notes**
- Current about and stack copy already largely satisfies R3. A copy pass to verify is enough; no structural change needed.

---

### R4 — Contact section

WHEN a visitor clicks the "Email me" button  
THE SYSTEM SHALL open the user's email client with the owner's real email address pre-filled.

WHEN a visitor clicks the "See my code on GitHub" button  
THE SYSTEM SHALL navigate to the owner's real GitHub profile URL.

**Acceptance criteria**

1. WHEN the page is built  
   THE SYSTEM SHALL contain no placeholder URLs (`mailto:your@email.com`, `https://github.com/`) in the rendered HTML.

2. WHEN the Email me button is activated by keyboard or pointer  
   THE SYSTEM SHALL trigger a `mailto:` link with the owner's real email address.

3. WHEN the GitHub button is activated by keyboard or pointer  
   THE SYSTEM SHALL open the owner's real GitHub profile in a new tab (`target="_blank" rel="noopener noreferrer"`).

4. WHEN the owner has not yet supplied the real values  
   THE SYSTEM SHALL retain clearly marked placeholder comments in the HTML (`<!-- TODO: replace with real email -->`) so the build task is visibly incomplete.

---

### R5 — Footer

WHEN the page renders  
THE SYSTEM SHALL show a footer with the copyright year, the owner's name, and the "Thanks for dragging along." sign-off (theme wordplay).

**Acceptance criteria**

1. WHEN the page renders in any year  
   THE SYSTEM SHALL show the correct current year in the copyright line.

2. WHEN the footer text is read by a screen reader  
   THE SYSTEM SHALL contain no emoji, no band name, no song title, and no band artwork.

---

## Non-goals

- No new sections (the five that exist: hero, about, built, stack, contact are final).
- No backend, CMS, or contact form.
- No real client names, testimonials, or unverifiable claims.
- No web fonts or external assets other than the owner-supplied screenshots.

## Open questions — resolved

1. **Email address** — use placeholder (`mailto:your@email.com`). Hermes will fetch the real value from Gmail and replace it.
2. **GitHub URL** — use placeholder (`https://github.com/`). Hermes will fetch the real profile URL and replace it.
3. **Project URLs** — use clearly marked placeholder comments in HTML for all four projects. Hermes will fetch live URLs.
4. **Screenshots** — use the neutral placeholder defined in R2.4 for all four cards. Hermes will capture screenshots via Playwright.
5. **Two-column grid** — confirmed: 768 px breakpoint.
