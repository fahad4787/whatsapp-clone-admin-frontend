# QA report: admin redesign

**Date:** 27 Nov 2026
**Build:** `next build` (production) served by `next start`, against the local backend (port 8080) with seeded test data.
**Tooling:** Playwright 1.49 (Chromium), axe-core 4.14, the Next.js build output, Vitest (backend).

All runs were local; nothing here was run against production. The work was then committed and pushed to `main` (auto-deploys to Render) with your go-ahead.

## 1. Build and static checks

| Check | Result |
|---|---|
| `tsc --noEmit` (admin) | ✅ 0 errors |
| `eslint src` (admin) | ✅ 0 errors, 0 warnings |
| `next build` (admin) | ✅ 22 routes, all static |
| `tsc --noEmit` (backend) | ✅ 0 errors |
| `vitest run` (backend) | ✅ 22 files, 62/62 tests |
| New runtime dependencies | None (still `next`, `react`, `react-dom`, `lucide-react`) |

**First-load JS:** dashboard 132 kB; other pages 125–128 kB; shared 103 kB. The baseline before the redesign was about 122–125 kB, so the cost is about 3–7 kB per page: the command palette, chart, theme and motion all hand-written.

## 2. Responsive and console sweep

17 admin routes plus `/login` at **1920, 1440, 1280, 1024, 768, 390 and 360px**, signed in with a local test admin:

| Check | Result |
|---|---|
| Horizontal page overflow (`scrollWidth > innerWidth`) | ✅ 0 of 126 page × width combinations |
| Console errors or uncaught exceptions | ✅ 0 |

Found and fixed during visual review of the screenshots:

- **390px:** the trend chart's last two date labels overlapped. The label count now scales with chart width (at most one per 72px).
- **< 1024px:** the "Collapse sidebar" button showed on mobile. Its `hidden` class lost to the button's own `inline-flex`; it now uses `max-lg:hidden`. That squeeze was also truncating the breadcrumb to "Dash…".
- **Full-page captures:** the sidebar's white column ended at the first viewport height. The surface now lives on a full-height column, with the sticky nav inside it.

Screenshots are in `docs/screenshots/after/`, in light and dark (plus `conversations-attachment-*.png` for image previews): the dashboard at every width; Users, Settings, Conversations and Audit at 1440 and 390; the command palette; the mobile drawer; login. Before screenshots are in `docs/screenshots/before/`.

## 3. Accessibility (WCAG 2.2 AA)

**Automated: axe-core**, 17 routes × {1440, 390} × {light, dark}, rules `wcag2a, wcag2aa, wcag21aa, wcag22aa`.

| Run | Violations |
|---|---|
| Before fixes | `color-contrast` ×22, `label-content-name-mismatch` ×34 |
| **After fixes** | **`color-contrast` ×16, all the same element: white text on `#129a55` primary buttons (3.63:1)** |

The remaining 16 are one brand decision repeated: the Users, OTPs, Channels and Admins primary buttons, at 2 widths × 2 themes. It is reported, not changed, per the brand rule. See DESIGN_SYSTEM.md §3 for the one-token fix that needs owner sign-off.

**Manual checks:**

| Area | Result |
|---|---|
| Keyboard only: skip link → sidebar → top bar → content | ✅ Logical order, visible focus everywhere |
| Command palette | ✅ ⌘K, Ctrl+K and `/` open it; arrows, Enter and Esc work; focus returns to the trigger; combobox/listbox roles and `aria-activedescendant` |
| Menus (theme, account) | ✅ Esc closes and returns focus; `menuitemradio` with `aria-checked` |
| Segmented controls | ✅ Roving tabindex; ←/→/Home/End |
| Data tables | ✅ Sort buttons in headers with `aria-sort`; rows reachable and activated with Enter |
| Trend chart | ✅ Focusable, with an `aria-label` summary; arrow keys read each day; full table alternative |
| Toasts | ✅ `role="status"`/`alert`; pause on hover or focus (2.2.1); Dismiss is labelled |
| Colour alone | ✅ Comparison line uses a dash pattern plus the legend; deltas use an arrow plus text plus colour |
| Reduced motion | ✅ With `prefers-reduced-motion: reduce`, animation and transition durations computed to 0.00001s (effectively off) |
| Zoom / reflow | ✅ 360px layout (≈ 400% of 1440) has no 2-D scrolling apart from the data tables' own scroll areas |

## 4. Performance (dashboard, median of 3 cold loads)

Production build on localhost. "Throttled" is 4× CPU slowdown plus 1.6 Mbps / 150 ms latency.

| Metric | Desktop | Throttled | Target |
|---|---|---|---|
| First Contentful Paint | 39 ms | 635 ms | < 1.8 s ✅ |
| Largest Contentful Paint | 290 ms | 2.46 s | < 2.5 s ✅ |
| Cumulative Layout Shift | 0.001 | 0.048 | < 0.1 ✅ |
| Total Blocking Time | 49 ms | 608 ms | < 200 ms desktop ✅ / throttled ⚠️ |
| Load event | 132 ms | 1.84 s | — |
| JS transferred | 226 kB | 166 kB (compressed) | — |
| CSS transferred | 12 kB | 12 kB | — |
| Command palette open (interaction) | 61 ms | 197 ms | < 200 ms ✅ |

Throttled TBT is mostly React hydration plus the first data render, so on a slow phone CPU the dashboard takes about half a second to respond after load. Splitting the chart into its own chunk is the next lever if that matters.

## 5. Colour comparison: original vs updated

Method: extract every hex from the original `globals.css` (saved before the redesign) and from the light-theme block of the new `globals.css`, then diff them.

| | Count |
|---|---|
| Hexes in the original light theme | 26 (25 unique colours; `#fff` and `#ffffff` both present) |
| Hexes in the new light theme | 26 |
| Removed | `#fff` (written as `#ffffff`, the same colour) |
| Added | `#53bdeb`: **not new**. It was already used inline in the original `ChatTranscript.tsx` (read-receipt ticks) and is now a token. |
| Logo (`components/brand/AivoraLogo.tsx`) | Unchanged (`git diff` empty) |
| Login page `#6fcf97` | Pre-existing (in commit `0027608`), untouched |

New colour **roles** reuse existing hexes: `--brand-text` = `#0b7a42` and `--danger-text` = `#be123c`. Dark-theme values are all `color-mix()` derivations of the original hexes, and dark is opt-in only.

| Role | Original | Updated | Why |
|---|---|---|---|
| Brand fill (buttons, active nav, chart) | `#129a55` | `#129a55` | Unchanged |
| Brand **text** (links, counts) | `#129a55` (3.63:1 ✗) | `#0b7a42` (5.42:1 ✓) | Existing `--brand-strong` reused |
| Danger text on tint | `#e11d48` on `#fff1f3` (4.27:1 ✗) | `#be123c` (5.72:1 ✓) | Existing `--danger-strong` reused |
| Readable secondary text | sometimes `#8b9a93` (2.94:1 ✗) | `#5b6b63` (5.63:1 ✓) | Existing `--muted` |
| Primary button label | white on `#129a55` (3.63:1 ✗) | unchanged | **Brand decision pending** |

## 6. Independent code review

A separate reviewer read the diff with no access to my reasoning. It confirmed the trend maths, chart, sort, Segmented, command palette and theme boot as correct, and found four real issues. **All four are fixed:**

1. **Toasts could stop auto-dismissing** after a toast was closed with its focused Dismiss button, because blur never fires on a removed node. The stack now re-checks focus and hover after every change.
2. **A theme change in another tab** updated the menu's checkmark but not the page. The storage listener now re-applies the theme.
3. **The series endpoint window included today's partial day** (the client worked around it). The endpoint now returns `2 × days` complete UTC days ending yesterday, with date bounds that don't depend on the database's timezone setting. Verified: `days=30` returns 60 points, 2026-09-27 to 2026-11-25 (yesterday, UTC).
4. **Trend card:** one failed background refresh replaced a good chart with an error, and a too-short series showed a skeleton forever. The chart now stays when data exists, and short history shows a plain message.

## 7. Conversations: image attachments

The transcript used to show only a filename or MIME chip for attachments. The backend's admin conversation detail now also returns `attachment_url`, `attachment_thumbnail_url`, size and dimensions (read-only, behind admin auth, hidden for messages deleted for everyone).

| Check (local, seeded image message) | 1440px | 390px |
|---|---|---|
| Thumbnail loads inline (lazy, with alt text) | ✅ | ✅ |
| Click opens the full-size image in a dialog, Esc closes | ✅ | ✅ |
| Horizontal overflow | ✅ none | ✅ none |
| Console errors | ✅ 0 | ✅ 0 |

Video and audio get native players; other files open in a new tab. Non-http(s) URLs and broken images fall back to a chip.

## 8. Known limitations

- **Primary button contrast** (above): needs a brand-owner decision.
- **Deploy order.** The admin and backend deploy separately. If the admin goes live before the backend, the trend card shows an informational callout and image attachments fall back to file chips until the backend is up; nothing breaks.
- **Media URLs are public.** Images in the transcript load from the same public `/uploads/media/…` URLs the apps use; the admin adds no new exposure, but those URLs are not access-controlled.
- **Sorting is client-side** over the rows loaded on the current page. Fine at today's volumes; server-side sorting would be needed at scale.
- **Browsers:** the automated runs used Chromium only. Safari and Firefox weren't run; the CSS (`color-mix`, `@custom-variant`, `:has`-free) is supported in both current versions.
- Real-device testing (the Vivo or Xiaomi phones) wasn't done for the admin; mobile was checked in emulation.

## 9. Self-score

**88 / 100**

| Area | Score | Notes |
|---|---|---|
| Visual quality and hierarchy | 18/20 | Calm, consistent, brand-true; dashboard leads with numbers and one chart |
| Information and usefulness | 18/20 | Real deltas, trend with comparison, drill-downs, image previews in Conversations; no invented data |
| Accessibility | 16/20 | axe clean except the brand-owned primary button contrast (needs sign-off) |
| Responsive | 14/15 | 0 overflow across 126 page × width combinations; mobile checked in emulation only |
| Motion and polish | 9/10 | Token-based, reduced-motion respected |
| Engineering | 13/15 | No new dependencies; tsc, eslint, build and 62 backend tests pass; sorting is client-side only |

Not 100 because of the open button-contrast decision, Chromium-only automation, no real-device pass, and client-side-only sorting.
