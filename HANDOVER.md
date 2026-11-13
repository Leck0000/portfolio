# Handover: Aleck Christian Biong portfolio page

Start here. This folder is ready to drop into the root of the project repo.

## What is in it
| Path | What it is |
|---|---|
| `AGENTS.md` | Your framework, curated for this project (Full tier, project rules in section 12) |
| `index.html` | The current page. Baseline to improve, not to rebuild. Live copy: https://claude.ai/artifact/EDg4jNJ5Nw9VxSQd7H28B4 |
| `docs/brief.md` | Goal, audience, constraints, non-goals, done means |
| `docs/decisions.md` | Council verdict and the stack decision |
| `docs/design.md` | Color, type and shape tokens, drafted from UI UX Pro Max |
| `docs/index.md` | Status and gate table |
| `.kiro/steering/` | product.md, tech.md, structure.md for Kiro |

Not included on purpose: `templates.md` and `prompts.md` (they stay in your playbooks), `.github/workflows/` (Hermes writes it at Deploy), and any specs (Kiro writes them).

## Do this first
1. Read `docs/brief.md`. If it is right, set `status: approved` in it and mark Intake approved in `docs/index.md`.
2. Read both entries in `docs/decisions.md`. Approve them the same way (Critique gate).
3. Paste the Spec prompt below into Kiro.

## Spec prompt for Kiro
```
Follow AGENTS.md. Phase 2 Spec, requirements-first. Read #[[file:docs/brief.md]], #[[file:docs/decisions.md]] and #[[file:docs/design.md]]. index.html is the existing baseline: do not rebuild it. Write one spec per feature: portfolio-content, theme-customizer, rail-and-accessibility. EARS acceptance criteria. Run Analyze Requirements. Stop for my approval.
```
The three features are my suggestion from the brief's "done means". Change them if you prefer.

## Known gaps in the baseline
- Email and GitHub buttons are placeholders (`your@email.com`, `https://github.com/`).
- The four project cards have no live links or screenshots.
- The SysDesk card wording is a guess from your notes. Confirm what it does.
- Not tested in a browser: layout at 375, 768, 1024 and 1440px, the color panel on touch devices, the drag rail on touch, and text contrast in every accent and mode combination.
- No automated tests yet.

## Stack commands
install: none. dev: `python -m http.server`, then open index.html. test: none yet (Hermes writes Playwright checks from the EARS criteria). build: none.
