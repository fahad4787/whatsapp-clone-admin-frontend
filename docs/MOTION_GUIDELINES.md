# Motion guidelines

Motion explains change: where something came from, what it is now, and that the app heard you. It is never decoration. Everything is CSS (keyframes plus transitions) or a small `requestAnimationFrame` loop. There is no animation library.

## Durations

| Tier | Range | Token | Used for |
|---|---|---|---|
| Micro | 100–180ms | `--dur-micro` 140ms | Hover and press colour, chevron nudge, fade-in, sort icon, toast exit (160ms) |
| Component | 180–280ms | `--dur-base` 220ms | Popovers and menus (`pop-in`), toast enter, Segmented thumb (200ms), command palette |
| Layout | 250–400ms | `--dur-layout` 320ms | Page enter, drawer slide, sidebar collapse (300ms), chart line draw (480ms, one-off) |

Exits are faster than entrances (about 160ms versus 220–320ms), so dismissing always feels immediate.

## Curves

- `--motion-ease-out` `cubic-bezier(0.22, 1, 0.36, 1)`: entrances and anything responding to input.
- `--motion-ease-in` `cubic-bezier(0.55, 0, 1, 0.45)`: exits.
- `--motion-ease-in-out`: on-screen movement between two resting states.

## Catalogue

| Interaction | Motion |
|---|---|
| Route change | Content fades in and rises 4px (`animate-page-in`). The shell stays still. |
| Sidebar collapse | Width transition 300ms. Labels hide; tooltips take over. |
| Mobile drawer | Slides in from the left with the scrim fading. Exit is animated through `usePresence`. |
| Menus and popovers | `pop-in` (opacity, 6px rise, 0.98 scale) and `pop-out`. |
| Modal / Drawer | Enter and exit both animated (`usePresence` keeps them mounted for the exit). |
| Command palette | Pop and scrim fade, 140ms exit. |
| Toast | Rises in, then slides right and fades out. Pauses on hover or focus. |
| Segmented | The thumb slides between options. No animation on first placement. |
| KPI values | Ease to new values on refresh (420ms, ease-out cubic), never counting up on first load. |
| Trend chart | The line draws once (480ms) and the area fades in. Switching metric or range re-keys and redraws. |
| Cards | Hover raises the shadow; press scales to 0.99. Link cards nudge their chevron 2px. |
| Skeletons | 1.4s shimmer. |

## Reduced motion

`@media (prefers-reduced-motion: reduce)` collapses every animation and transition to 0.01ms. `AnimatedNumber` checks `matchMedia` and jumps straight to the value. Theme switches add `.theme-switching` to suppress colour transitions, so the whole UI doesn't fade. QA checks this with Playwright's `reducedMotion: "reduce"` (see QA_REPORT.md).

## Performance

Only `transform`, `opacity`, `width` (sidebar and thumb) and `box-shadow` are animated. Nothing animates layout-heavy properties on large trees. The chart draw uses `stroke-dasharray` on a `pathLength={1}` path.
