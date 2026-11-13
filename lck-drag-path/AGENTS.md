# Project framework

Read this at the start of every session. Follow the phase order. Do not skip gates.

## 1. Pipeline

| Phase | Who | Output | Gate |
|---|---|---|---|
| 0 Intake | You + Claude (chat) | `docs/brief.md` | You approve |
| 1 Critique | Council (Claude chat), Full tier only | entry in `docs/decisions.md` | You approve |
| 2 Spec | Kiro | `.kiro/specs/<feature>/requirements.md` | You approve |
| 3 Design | Kiro + Hermes (Archify) | `design.md`, `docs/architecture.html`, Council (Claude chat) on the design (Full) | You approve |
| 4 Plan | Kiro | `tasks.md`, each task with a runnable check | You approve |
| 5 Build | Kiro, on a branch | commits, one per task | Build and tests pass, output shown |
| 6 Review and test | Hermes (+ Claude on request) | `docs/review.md` | No must-fix left, with evidence |
| 7 Deploy | Hermes writes CI/CD, pipeline deploys | live URL | You approve the merge, then verify live |
| 8 Retro | Hermes + you | updated docs, `docs/debt.md` | none |

Builder and reviewer are always different agents. Only one agent edits a branch at a time.

## 2. Roles

| Tool | Role |
|---|---|
| You | Decide, approve every gate, merge |
| Claude (chat) | Thinking partner at the front: intake and brief. Runs the council on the idea and on `design.md`. Writes the Kiro and Hermes prompts for every phase (see `prompts.md`). Optional outside reviewer. Helps when stuck. Curates this file. |
| llm-council (run by Claude chat) | Five-lens critique with peer review and a chairman verdict, on the idea and on `design.md`. Never on the task list. |
| Kiro | Spec, design, tasks and the build. Skills: Ponytail, UI UX Pro Max, Impeccable. Hooks on save for lint and tests. |
| Hermes | Review, independent testing, CI/CD, diagrams, retro. Skills: Ponytail review, agency-agents personas, Graphify, Archify, Osmani checklist. |
| Obsidian | Optional viewer for `docs/` (see section 8) |

Claude's limits: Claude works from what you paste or upload (brief, design, diff, `review.md`, logs). It cannot see your repo, run Kiro or Hermes, or remember anything except what is in the files. Intake, outside review and unstuck help are optional. The council run is required in the Full tier. In chat, Claude runs the council as a single pass: it writes the five lenses, a peer-review round and the chairman verdict itself instead of spawning separate agents, so it is less independent than a true multi-agent run. Treat it as a structured critique and save it for decisions where being wrong is expensive.

Precedence when rules conflict: your instruction, then the approved spec, then Ponytail (how much code), then everything else.

## 3. Tiers

Pick one in `docs/brief.md`.

- **Light** (small or throwaway): skip Phase 1, Council optional. Kiro uses Quick Spec (you still read and approve it). Hermes reviews and runs tests. Deploy.
- **Full** (anything you will keep or others will use): every phase. **This project: Full.**

In both tiers, Claude's intake and outside-review roles are optional. The council run is Full tier only.

## 4. Files

```
AGENTS.md             this file (rules, read by Kiro and Hermes)
docs/index.md         home note: status, current phase, links
docs/brief.md         one-page intake, tier, constraints
docs/decisions.md     decisions with reasons (council output)
docs/design.md        UI tokens and rules (UI projects)
docs/architecture.html + .png   Archify diagram
docs/review.md        Hermes findings, newest first
docs/debt.md          deferred shortcuts
.kiro/steering/       product.md, tech.md, structure.md (short, point at docs/)
.kiro/specs/<feature>/  requirements.md, design.md, tasks.md
.github/workflows/    CI/CD, written by Hermes
graphify-out/         code graph (existing or large repos)
```

If chat and docs disagree, docs win. Copy doc skeletons from `templates.md`.

## 5. Phases

### 0. Intake (you + Claude)
Paste the raw idea into Claude chat:
`Interview me one question at a time about this idea: <idea>. Push back on weak assumptions. When we're done, write docs/brief.md: goal, user, constraints, non-goals, done means, tier.`
Save the result as `docs/brief.md`.

### 1. Critique (Council, Full tier)
Run only when the choice is costly to reverse, there are two or more real options, and a quick test cannot settle it. Skip if you could undo it in a day, one option is the clear standard, the answer is a fact you can look up, or the project is small. One run per decision, about three per project at most.
In Claude chat, paste `docs/brief.md` (and `docs/decisions.md` if it exists), then send:
`council this: <decision or the brief>. Options: <A> vs <B>. Constraints: <from brief>.`
Ask Claude to write the decision entry (verdict, options, reason, "revisit if") and save it to `docs/decisions.md`.

### 2. Spec (Kiro)
Requirements-first for new features, design-first for technical work. Acceptance criteria in EARS: `WHEN <event> THE SYSTEM SHALL <behavior>`. Run Analyze Requirements before design. Bugs get a Bugfix spec. Feed context with `#[[file:docs/brief.md]]` and `#[[file:docs/decisions.md]]`.

### 3. Design
Kiro writes `design.md`. In Hermes: `Use Archify to diagram .kiro/specs/<feature>/design.md. 8 to 12 components, one primary path. Save to docs/architecture.html, export PNG to docs/architecture.png.` Full tier: paste `design.md` into Claude chat with `council this:` before approving. UI projects: choose tokens with UI UX Pro Max and save to `docs/design.md`. **This project:** no Archify diagram (one static file). `docs/design.md` is already drafted from UI UX Pro Max, so Kiro confirms or amends it instead of starting over.

### 4. Plan (Kiro)
`tasks.md`. Every task needs a check you can run. Add one if missing. Each task fits one session.

### 5. Build (Kiro)
Work on branch `feat/<name>`. One task at a time, one commit per task. Ponytail governs code size: reuse before writing, standard library and native features before dependencies, minimum that passes the check. Never cut validation at trust boundaries, security, accessibility, or error handling that protects data. Mark deliberate shortcuts with a `shortcut:` comment. Hooks run lint and tests on save. Kiro marking a task done is not evidence. Build and test output is.

### 6. Review and test (Hermes)
Hermes never edits the feature branch. It writes findings to `docs/review.md`; Kiro fixes them.
1. `/ponytail-review` on the branch.
2. Independent tests: turn the EARS criteria in `requirements.md` into Hermes's own tests and run them against the running app (browser automation for UI). Do not reuse Kiro's tests as proof.
3. Reality Checker persona: default verdict NEEDS WORK, pass only with evidence (build output, test output, screenshots).
4. UI projects: Accessibility Auditor persona.
5. High-risk changes: you may paste the diff and `review.md` into Claude chat for an outside opinion.
Loop with Kiro until no must-fix remains.

### 7. Deploy (Hermes writes it, the pipeline runs it)
Hermes writes the CI/CD workflow once: tests on every PR, deploy on merge to the main branch. Static sites: GitHub Actions to GitHub Pages. Secrets stay in the CI secret store. Never give an agent production credentials. You approve the merge. Then verify the live URL, not just the green pipeline. Run `/ponytail-debt` to write `docs/debt.md`. If nothing is deployed, still keep the CI.

### 8. Retro
Update `docs/decisions.md` and `docs/index.md`. Refresh the graph (`/graphify . --update`). Note what hurt in the handoffs. Bring that to Claude chat to tighten this file.

## 6. Skills sync

Kiro reads `.kiro/skills/` and `~/.kiro/skills/`. Hermes reads `~/.hermes/skills/`. Keep one source repo of skills and copy or link it into both. Do not install Superpowers on Kiro projects, since Kiro specs replace it. The council needs no install: it runs in Claude chat. Test each skill once in the tool you install it in.

## 7. Working rules

- One task at a time. Stop after each and report.
- Say "done" only with proof: command run, output shown.
- Do not add a dependency without saying what it replaces.
- Do not refactor outside the current task. Note it in `docs/debt.md`.
- If the spec is unclear, ask. Do not guess on scope or data.
- Do not run personas or council during Build.
- When context gets long, restart from the spec and tasks instead of re-explaining.
- Every reply ends with what was skipped, what was not checked, and any risk.

## 8. Obsidian (optional)

Open `docs/` (or a central vault with each project's `docs/` linked in) in Obsidian. Agents read and write the same plain markdown, so nothing depends on Obsidian. Every doc has frontmatter (`project`, `phase`, `status`, `updated`). Link with relative markdown links like `[spec](spec.md)`, not wikilinks. Never touch `.obsidian/` (put it in `.gitignore`). Embed `docs/architecture.png` in `index.md`; Obsidian cannot render the HTML diagram. Mermaid blocks render natively.

## 9. Definition of done

- Every must-have in `requirements.md` works and is demonstrated.
- Build and tests pass, output shown.
- `docs/review.md` has no open must-fix.
- Live and verified if deployable.
- `docs/` matches reality.

## 10. Curating for a project

Copy this file into the project root, then edit for that project: set the tier, delete phases that do not apply (no UI means no UI skills or accessibility persona), and add project rules at the bottom. Keep the master copy untouched.

## 11. Prompts

Claude writes the Kiro and Hermes prompts. Tell Claude the project, the phase and your stack commands, and paste the files that phase needs. Claude replies with the exact prompt to paste. The templates are in `prompts.md`, which stays in your playbooks and is not copied into projects.

### Kickoff

Claude chat (Phase 0):
```
New project. Interview me one question at a time, push back on weak assumptions, then write docs/brief.md (goal, user, constraints, non-goals, done means, tier).
Idea: <one paragraph>
```
Kiro or Hermes (after the brief is saved):
```
Follow AGENTS.md. Read docs/brief.md. Start at the next unapproved phase and wait for my approval at each gate.
```

## 12. Project rules (lck-drag-path)

- `index.html` is the existing baseline. Improve it task by task. Do not rebuild it.
- Single static file, no dependencies, no build step, until the "revisit if" trigger in `docs/decisions.md` fires. Any new dependency must say what it replaces.
- All colors come from CSS variables. Text must keep 4.5:1 contrast in every accent and light/dark combination.
- Accessibility is not negotiable: the scroll rail works by keyboard, focus is visible, reduced motion is respected.
- Check every UI change at 375px wide first, then 768, 1024 and 1440.
- Placeholders (email address, GitHub URL, project links) are not done. Never invent real values. Ask.
- Write copy in plain words and explain jargon. Do not claim anything about a project beyond what the owner stated.
- No song lyrics or band artwork, no Twenty One Pilots credit line (removed on request), and only a subtle "drag path" label on the scroll rail as the theme reference.
- Motion and layout follow the `apple-design` skill: system type, interruptible spring motion, reduced-motion and reduced-transparency fallbacks.
