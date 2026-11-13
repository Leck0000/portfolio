---
project: lck-drag-path
phase: design
status: draft
updated: 2026-11-13
tags: [design]
---
# Design tokens and rules

Sources: UI UX Pro Max design-system output (pattern: scroll-triggered storytelling with a progress indicator; its brutalism style, Archivo and Space Grotesk fonts and grey-blue palette were replaced) and the apple-design skill (system type, materials, springs, reduced-motion handling). Values below match the current `index.html`. Kiro confirms or amends them in the Design phase.

## Color
| Token | Dark (default) | Light |
|---|---|---|
| `--bg` | `#121212` | `#f5f5f7` |
| `--fg` | `#ece7d8` | `#1d1d1f` |
| `--mut` | `#a09d92` | `#5c5c61` |
| `--line` | 10% white | 10% black |
| `--card` | `#1c1c1e` | `#ffffff` |
| `--y` (accent fill) | `#f5d90a` default, user-changeable | same |

- `--on` (text on accent fill): black if the accent's luminance is above 0.55, otherwise white.
- `--a` (accent used as text or border): in dark mode, lighten the accent 50% if luminance is below 0.4. In light mode, darken it 55% if luminance is above 0.3.
- Presets: yellow, cyan, pink, green, orange, red. Plus a free color picker. Choice saved in `localStorage` (guarded with try/catch).

## Type
- System font stack (`-apple-system`, SF Pro, `system-ui`), with `font-optical-sizing: auto`. No web fonts.
- Tracking and leading change with size: h1 `clamp(2.4rem,8vw,4.5rem)`, line-height 1.05, tracking -0.035em. h2 `clamp(1.8rem,5vw,2.6rem)`, 1.1, -0.025em. Body 1rem/1.55, tracking 0. Small labels +0.08em.
- Sizes and spacing in `rem`, so the page scales with the visitor's text-size setting.

## Shape and materials
- Rounded: cards 20px, buttons and chips fully pill-shaped. No heavy borders; 1px hairlines at 10% opacity.
- Translucent "glass" layer (`backdrop-filter: blur(20px) saturate(180%)`) for the sticky top bar and the Colors panel. The panel is anchored to its button (`transform-origin: top right`).
- Falls back to solid surfaces under `prefers-reduced-transparency` and `prefers-contrast: more`.
- Layout: content max-width 46rem, 4rem right padding to clear the scroll rail.

## Motion
- Scrolling (nav links, buttons, keyboard on the rail, rail flings) uses a small critically damped spring (damping 1.0, response 0.45s). It is interruptible: wheel, touch, key or pointer input cancels it at once.
- Rail dot: 1:1 drag that keeps the grab offset, rubber-bands at the ends, hands release velocity to the spring, and projects momentum (deceleration 0.995).
- Press feedback: `scale(.96)` on pointer-down, 100ms.
- `prefers-reduced-motion`: springs become instant scrolls, the panel only fades, no scale effects.

## Rules
- Text contrast 4.5:1 minimum in every accent and mode combination (not yet measured).
- Visible focus: 3px `--fg` outline. Pointer cursor on clickable elements.
- No emojis as icons. No song lyrics or band artwork.
- Scroll-driven and drag motion must stay interruptible.
- Theme nod: a small vertical "drag path" label under the scroll rail, plus light wordplay on the title only: "No dragging required." (contact), "Thanks for dragging along." (footer), "Drag along the path" (rail tooltip). No lyrics or close paraphrase, no band credit or artwork. Keep it subtle and keep the copy clear to a first-time visitor.
- Check 375px, 768px, 1024px and 1440px.
