---
project: lck-drag-path
phase: critique
status: approved
updated: 2026-11-13
tags: [decisions]
---
## Keep the Drag Path theme, make the page a working portfolio (2026-11-12)
**Decision:** Keep the theme and the drag-the-dot rail. Aim the page at one audience, rewrite the headline to say what Aleck Christian Biong builds, and back every project card with a live link and a screenshot.
**Options considered:** A) Keep it a pure vibe page. B) Drop the gimmick for a conventional portfolio. C) Keep the gimmick, make the content portfolio-first.
**Why:** The drag rail is the memorable part, and no advisor wanted it cut. But the page proves nothing yet: no links, no screenshots, placeholder contact buttons. Option C keeps what is distinctive and fixes what is weak.
**Revisit if:** The audience turns out to be only friends or classmates (then A is fine), or visitors bounce before reaching the projects.
**Source:** council run (single-pass in Claude chat, not separate agents)

### Council verdict (kept in full)
**Where the council agrees**
- The drag-the-dot interaction is the page's best idea and the thing people will remember.
- The projects are the strongest content, but nothing links to them yet.

**Where the council clashes**
- Fun vs. function: the Expansionist says lean into the gimmick; the Contrarian says a recruiter or client will not wait through glitch effects to learn what Aleck Christian Biong does.
- Theme visibility: the Outsider says the Twenty One Pilots tie is invisible unless you know the song (it is only in the footer); the First Principles Thinker says that is fine if the page is for Aleck Christian Biong, not strangers.

**Blind spots the council caught**
- "student. builder." says nothing about what Aleck Christian Biong can do for someone.
- The page has no proof: no screenshots, no live links, and the email and GitHub buttons are placeholders.

**Recommendation:** Keep the theme and the drag path, but make it a portfolio that works. Decide who it is for (clients for side income, or school and internships) and write the headline for that person. "I build websites and browser automation" beats a vibe line.

**The one thing to do first:** Add real links and screenshots to the four project cards, starting with Mapishi Restaurant, and put in the real email and GitHub.

## Stay on plain HTML/CSS/JS; move to Astro when a page per project is needed (2026-11-12)
**Decision:** Keep the site as one static HTML/CSS/JS file for now. Move to Astro when case-study pages (one per project) are wanted. Test with Playwright, deploy with GitHub Actions to GitHub Pages.
**Options considered:** A) Plain HTML/CSS/JS. B) Astro. C) Eleventy. D) Next.js or Vite + React.
**Why:** The brief says $0 budget and small, independently shippable tasks, and Ponytail says native features before dependencies. Plain HTML has no build step or dependencies, so nothing to maintain. Astro and Eleventy add a build step the site has not earned yet. Next.js or Vite + React is overkill for a portfolio. Astro becomes worth it once content repeats across pages.
**Revisit if:** A second page or case study is added, project data starts being copied across files, or a build step stops being a cost.
**Source:** own call, Tool Evaluator lens (agency-agents). No council run: reversible in a day, per AGENTS.md. Current Astro and Eleventy docs and versions not checked; confirm at Spec time.
