# UI audit (before the redesign)

Baseline screenshots are in `docs/screenshots/before/`, taken at 1440px against the local backend with seeded test data. The admin was already functional (every page wired to the real API). This audit is about presentation, navigation, states and accessibility, not missing features.

## What was already good (kept)

- One clear brand colour (`#129a55`) on calm neutrals, which reads as a real product rather than a template.
- A grouped sidebar (Overview / Activity / Product / Administration) that matches how the admin is used.
- Real data on every surface. Honest empty states ("Inbox zero", "No calls right now").
- A shared UI kit (`@/components/ui`) and one data hook (`useQuery`), so a redesign could happen at the kit level without touching business logic.

## Findings

Severity: **H** blocks or misleads, **M** slows people down, **L** polish.

### Information and the dashboard

| # | Sev | Finding |
|---|---|---|
| A1 | H | KPI tiles showed bare numbers with no context. There was no trend, no comparison period, and no way to tell whether 55 messages today is normal. |
| A2 | H | No time-series view anywhere. The backend only exposed point-in-time counters, so "how are we trending?" could not be answered. |
| A3 | M | KPI tiles were not drill-downs: seeing 40 users didn't take you to Users. |
| A4 | M | A two-column "Accounts" tile and equal-weight cards meant nothing led the eye; the hierarchy was flat. |
| A5 | L | `extrabold` headings and 2xl radii on every card felt loud next to dense data. |

### Navigation and shell

| # | Sev | Finding |
|---|---|---|
| N1 | M | No global search or command palette. Reaching "IP access" or finding a user meant scanning the sidebar, then the page. |
| N2 | M | The sidebar couldn't collapse, so 15.5rem was always spent on navigation at 1280px. |
| N3 | M | The top bar had a page title only: no breadcrumb context, no theme control, no account menu (sign-out lived only in the sidebar footer). |
| N4 | L | No visible offline state. Requests silently failed when the network dropped. |

### Tables

| # | Sev | Finding |
|---|---|---|
| T1 | M | No column sorting on any table. |
| T2 | M | Error states were a red callout with no retry. Recovering meant a full page reload. |
| T3 | L | Row keyboard focus was a faint ring that disappeared against the hover background. |
| T4 | H | Conversation transcripts showed picture, video and voice attachments only as a filename or MIME chip, so moderators couldn't see what was sent. |

### Motion and feedback

| # | Sev | Finding |
|---|---|---|
| M1 | L | Popovers, drawers and toasts appeared and disappeared instantly (no exit transitions). Route changes snapped. |
| M2 | L | Toasts couldn't be paused, so long error messages vanished while being read. |
| M3 | L | Segmented controls jumped between options with no sense of position. |

### Accessibility (axe-core 4.14 on 17 routes + login, and manual checks)

| # | Sev | Finding |
|---|---|---|
| X1 | H | **Contrast:** brand `#129a55` used as *text* on white is 3.63:1, failing AA for small text ("View all" links, counts, the "you" tag). |
| X2 | H | **Contrast:** `#e11d48` text on its own tint `#fff1f3` is 4.27:1, failing AA (danger badges, avatar initials). |
| X3 | M | **Contrast:** `--subtle` `#8b9a93` (2.94:1) used for some readable text, such as the select chevron, the "—" placeholders in OTPs and the reports arrow. |
| X4 | M | **Label in name (2.5.3):** the logo link and the account button had `aria-label`s that didn't contain their visible text. |
| X5 | H | **Contrast, brand-owned:** white text on `#129a55` primary buttons is 3.63:1. This fails AA for normal text. The brief forbids changing brand hexes, so it is **reported, not changed**. See DESIGN_SYSTEM.md §3. |
| X6 | L | No skip link, and no `aria-sort` (because no sorting). |

## How each finding was addressed

| Finding | Resolution |
|---|---|
| A1–A3 | KPI tiles gained 7-day deltas against the previous 7 days, sparklines and drill-down links. Deltas show "New" or "No activity" when there's no baseline, never an invented percentage. |
| A2 | New read-only backend endpoint `GET /api/admin/metrics/series?days=N` (complete UTC days only), plus a trend chart with the previous-period comparison, a metric and range switcher, and a table view. If the backend isn't deployed yet, the card shows an honest "endpoint not available" callout. |
| A4–A5 | Tighter type scale, 12px card radius, weights 600/700, one hero chart with supporting cards. |
| N1–N4 | Command palette (⌘K or `/`), collapsible sidebar with tooltips, breadcrumbs, theme menu, account menu, offline banner. |
| T4 | The admin conversation detail now returns the media URL (read-only, behind admin auth). Images render inline as lazy-loaded thumbnails with alt text and open full size in a dialog; video and audio get native players; other files are links. Non-http(s) URLs and broken images fall back to a chip. Media deleted for everyone stays hidden. |
| T1–T3 | Opt-in column sorting (`sortValue`) on Users, Calls, Channels, Countries and Admins. `ErrorCallout` with Retry on every page. Inset brand bar for row focus. |
| M1–M3 | Enter and exit transitions for every overlay, page-in transition, pausable toasts, sliding Segmented thumb. Everything respects reduced motion. |
| X1–X3 | New text roles that reuse *existing* hexes: `--brand-text` `#0b7a42` (5.42:1) and `--danger-text` `#be123c` (5.72:1). `--subtle` is restricted to decoration. |
| X4 | Visible text is now contained in the accessible name. |
| X5 | Open. Needs a brand-owner decision. |
| X6 | Skip link added. `aria-sort` on sortable headers. |
