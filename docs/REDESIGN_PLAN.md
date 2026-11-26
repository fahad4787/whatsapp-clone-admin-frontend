# Redesign plan

## Direction: "Calm operations console"

An admin for a messaging platform is used to answer three questions quickly: *Is everything healthy? What changed? What needs me?* The direction prioritises **legibility of numbers and change** over ornament.

- **Brand-led, not brand-flooded.** The existing green marks action, selection and the one data series. Everything else is the original neutral ramp.
- **Architectural surfaces.** Hairline borders do the work. Shadows appear only when something is lifted (hover, menus). The radius is 12px, down from 16px.
- **Numbers first.** Tabular figures, 28px KPI values, deltas with context ("sign-ups, 7d"), and a single hero trend chart.
- **Honest data.** If the backend can't provide a figure, the UI says so. No placeholder statistics, no fake buttons.
- **Light by default.** Dark is an opt-in theme derived from the brand ink. There is no automatic conversion.

Rejected directions: a glassmorphism or gradient "SaaS" look (breaks the brand rule, and lowers contrast on data), and a dense Bloomberg-style grid (too much for a small ops team; poor on mobile).

## Constraints

- Every existing hex and the logo stay identical. New tones come only from reused hexes or `color-mix()`.
- No changes to business logic, API contracts, auth or permissions. The only backend additions are read-only: a series endpoint and media URL fields on the conversation detail response.
- No new runtime dependencies (no chart, animation or component libraries). The bundle budget is about 130 kB first-load JS per page.
- WCAG 2.2 AA, with exceptions reported rather than silently fixed when the fix would touch a brand colour.

## Phases (as executed)

| Phase | Scope | Status |
|---|---|---|
| 1. Audit | Baseline screenshots, axe pass, findings (UI_AUDIT.md) | Done |
| 2. Tokens | Text roles (`--brand-text`, `--danger-text`), motion tokens, elevation, dark theme via `color-mix`, theme script with no flash | Done |
| 3. Shell | Collapsible sidebar, mobile drawer, top bar (breadcrumbs, search, health, theme, account), command palette, skip link, offline banner | Done |
| 4. Dashboard | KPI deltas and sparklines, drill-downs, trend chart and table, metric and range switching, backend series endpoint | Done |
| 4b. Conversations | Inline image previews with full-size view, video and audio players, file links (backend returns the media URL) | Done |
| 5. Tables and states | Sorting, `ErrorCallout` with retry everywhere, focus treatment, empty and loading states | Done |
| 6. Motion | Overlay enter and exit, page-in, toast pause, Segmented thumb, number tweening, reduced motion | Done |
| 7. QA | 17 routes + login × 7 widths: overflow and console sweep, axe, screenshots light and dark, Core Web Vitals | Done (QA_REPORT.md) |
| 8. Docs | This folder | Done |

## Rollout

1. **Admin front-end:** safe to deploy on its own. With the backend not yet updated, the trend card shows an informational callout, attachments show as file chips, and every other feature works.
2. **Backend:** a read-only aggregate query over existing tables and extra read-only fields on the conversation detail, with no migrations. Once deployed, the trend chart and image previews light up automatically.
3. **Brand decision:** primary button contrast (white on `#129a55`, 3.63:1). Options are in DESIGN_SYSTEM.md §3.

Both repos were pushed to `main` with your go-ahead; Render auto-deploys each.

## Possible next steps (not done)

- Server-side sorting and pagination for Users and Conversations once they grow past a few thousand rows. Today's sort is client-side over the loaded page.
- Wiring the roughly 11 stored-but-unused settings into the backend (listed in ADMIN_MAP.md), then re-adding their controls.
- Per-admin saved views (filters and sorts) once there's a backend place to store them.
