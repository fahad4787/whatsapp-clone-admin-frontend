# Component guidelines

Everything is imported from `@/components/ui` (plus `@/components/charts` and `@/components/layout`). The kit is built in-house on Tailwind v4 tokens. The only runtime dependencies are `next`, `react`, `react-dom` and `lucide-react`.

## Shell

| Component | Notes |
|---|---|
| `AdminShell` | Provides `ShellContext` (`collapsed`, `toggleCollapsed`, `openPalette`). Shortcuts: ⌘/Ctrl+K toggles the command palette; `/` opens it when no field is focused and no modal is open. Remembers recent pages. Renders the skip link, sidebar or drawer, `Topbar`, `OfflineNotice`, `<main id="main">` and `CommandPalette`. |
| `Sidebar` | Grouped navigation from `config/nav.ts` (badges and keywords live there). When collapsed it shows icons only, with fixed-position tooltips on hover and focus. |
| `Topbar` | Collapse toggle (lg and up), breadcrumbs (the page label is `aria-current`), search trigger (full at xl and up, icon below), health pill, theme menu (`menuitemradio`), account menu. Popovers close on outside click or Esc and return focus to their trigger. |
| `CommandPalette` | WAI-ARIA combobox plus listbox. Groups: Recent, Pages, Search (users and conversations by the typed text), Actions (theme, sidebar, sign out, banned users). Uses substring matching with weighting, and fuzzy matching on titles only. Keys: ↑/↓, Ctrl+Home/End, Enter, Esc. **Every entry routes to an existing page or action. Nothing is a placeholder.** |
| `OfflineNotice` | Shown only while `navigator.onLine` is false. |
| `template.tsx` | Per-route page-in animation. The shell itself never re-animates. |

## Data display

| Component | Notes |
|---|---|
| `StatCard` | `label`, `value`, optional `icon`, `accent`, `hint`, `delta`, `spark`, `href` / `onClick`. With `href` it becomes a link card with a chevron (drill-down). Loading shows skeletons sized to the content, so there is no layout shift. |
| `AnimatedNumber` | Tweens only when the value **changes** (refreshes), never on first paint. Respects reduced motion. Tabular figures. |
| `Delta` | Trend pill. Colour follows *good or bad* (`goodWhen`); the arrow follows the sign. A null percentage (no baseline) shows "New" or "No activity", **never a made-up percentage**. Includes screen-reader direction and context text. |
| `Sparkline` | Decorative (`aria-hidden`); the number it summarises is always visible beside it. |
| `TrendChart` | Single y-axis starting at zero, nice ticks, about 6 date labels. Previous period is a dashed line. Pointer crosshair and tooltip. Focusable: arrow keys, Home, End and Esc read each day. Has an `aria-label` summary. |
| `TrendTable` | The same data as an accessible table, toggled from the chart card. |
| `DataTable` | Sticky header, responsive columns (`hideBelow`), client paging, keyboard-activatable rows. **Opt-in sorting:** give a column `sortValue(row)`; the header becomes a button and `aria-sort` is set. Nulls sort last, strings compare numerically and case-insensitively. Sorting covers the rows already loaded for that page. |
| `Badge`, `Avatar`/`Person`, `ChatTranscript` | Tones map to tokens. Danger badges use `--danger-text` for AA. |

## Controls

| Component | Notes |
|---|---|
| `Button` | Variants `primary`, `secondary`, `ghost`, `danger`, `danger-soft`. Sizes `sm` and `md`. `loading` disables the button and shows a spinner; `icon` is optional. |
| `IconButton` | A `label` is **required** and becomes the accessible name and tooltip. |
| `Segmented` | Tablist with a sliding thumb, roving tabindex, ←/→/Home/End. |
| `Switch`, `Input`, `Select`, `SearchInput`, `Field`, `SaveBar` | `Field` wires the label, note and error through `aria-describedby`. |

## Feedback and states

Every data region handles **loading, empty, error, success and partial** states:

- **Loading:** skeletons that match the final layout (`Skeleton`, table skeleton rows, `StatCard loading`).
- **Empty:** `EmptyState` with an icon, a plain-language title and, where useful, the next step.
- **Error:** `ErrorCallout` shows the server message plus a **Retry** that re-runs the same request (`useQuery().reload`), with a spinner while it refetches. It is used on every page.
- **Unsupported:** the trend card shows an info callout naming the missing endpoint when the backend returns 404, instead of fake data.
- **Toasts:** success and error messages. Errors use `role="alert"`. Timers pause while the pointer or focus is on the stack.
- **Offline:** `OfflineNotice`.

## Rules

1. Use tokens only, never raw hexes. Brand-coloured *text* uses `text-brand-text`; danger text on a soft tint uses `text-danger-text`.
2. `text-subtle` is for decoration (placeholders, separators, chevrons), never words people need to read.
3. Never ship a button without a handler, or a statistic without a data source. If the backend can't provide something, show an honest state.
4. Every icon-only control needs a name (`IconButton label`, or `aria-label`), and visible text must be contained in the accessible name (WCAG 2.5.3).
5. Numbers in columns or animations get `.tnum`.
