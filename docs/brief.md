---
project: lck-drag-path
phase: intake
status: approved
updated: 2026-11-13
tags: [brief]
---
# Brief
**Tier:** full (a page you will keep and others will see)
**Goal:** Turn the existing Drag Path-themed personal page into a working portfolio. A visitor should learn in one screen what Aleck Christian Biong builds and be able to open real proof of it. The Twenty One Pilots theme and the drag-the-dot scroll rail stay.
**User:** Primary: prospective clients for freelance web and browser-automation work. Secondary: school and internship reviewers.
**Constraints:** Stack: plain HTML/CSS/JS in one file, no dependencies, no framework. Hosting: GitHub Pages. Theme: black and yellow by default (`#121212` / `#f5d90a`), system fonts, an Apple-style look (glass top bar, rounded cards, spring motion), and a visitor-changeable accent color and light/dark mode. No song lyrics or band artwork. The "fan-made, not affiliated" footer was removed on request (2026-11-12). Budget: $0 for now (free GitHub Pages hosting, no custom domain yet). Time: no fixed deadline; the page is ongoing and will be updated continuously, so work in small tasks that each ship on their own.
**Commands:** install: none. dev: `python -m http.server`, open `index.html`. test: none yet (Hermes writes browser-automation checks from the EARS criteria). build: none.
**Non-goals:** No backend, CMS, blog or contact form. No new dependencies. No redesign of the drag-path interaction. No new sections beyond the five that exist (hero, about, built, stack, contact).
**Done means:**
- The hero headline says what Aleck Christian Biong builds and for whom, not just "student. builder."
- A first-time visitor with no background knowledge understands the page within the first screen; jargon is explained in plain words.
- Visitors can change the accent color (presets and a free color picker) and switch light/dark mode; the choice is remembered, and text stays readable (4.5:1 contrast) in every combination.
- Each of the four project cards (Mapishi Restaurant, OKX-style trading terminal, SysDesk, browser automation) has a live link and a screenshot.
- The email and GitHub buttons point to real addresses (currently placeholders).
- The drag dot works by mouse and touch, and the page stays usable by keyboard and with reduced motion.
- Readable on a phone with no sideways scroll, verified in a browser.
- Deployed to GitHub Pages and the live URL checked, not just the pipeline.
