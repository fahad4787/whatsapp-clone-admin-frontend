# Aivora Admin: Design System

The tokens live in `src/app/globals.css`. Components use them through Tailwind names (`bg-brand`, `text-muted`, `border-line`, …), mapped in `@theme inline`. **Never put a hex in a component.**

## 1. Brand rule (non-negotiable)

Every hex in the light theme is the original Aivora value. The redesign added **no new hues**. Extra tones are:

- **Existing hexes reused for a new role.** For example, `--brand-text` reuses `#0b7a42` (originally `--brand-strong`), and `--danger-text` reuses `#be123c` (originally `--danger-strong`).
- **Derived with `color-mix()`** from existing hexes, for example the chart area fill (`--brand` at 14%) and every dark-theme surface.

There are no gradients, no shadcn defaults and no new accents. The logo (`AivoraLogo.tsx`) is untouched.

## 2. Colour

### Light theme (default): original values

| Token | Hex | Role |
|---|---|---|
| `--brand` | `#129a55` | Primary actions, active nav icon, chart line, focus ring base |
| `--brand-strong` | `#0b7a42` | Primary button hover |
| `--brand-text` | `#0b7a42` | Brand-coloured **text** (links, "View all", good-trend pill) |
| `--brand-soft` | `#e9f8ef` | Active nav row, good-trend pill background, selected rows |
| `--ink` | `#0c1612` | Headings and primary text |
| `--ink-soft` | `#2e3d36` | Body text and table cells |
| `--muted` | `#5b6b63` | Secondary text, labels, axis labels |
| `--subtle` | `#8b9a93` | **Decorative only**: placeholder, chevrons, comparison line (2.94:1, never for readable text) |
| `--line` / `--line-strong` | `#e4ebe7` / `#d2ddd6` | Borders, grid lines |
| `--canvas` | `#f3f6f4` | App background |
| `--surface` / `--surface-muted` | `#ffffff` / `#f7faf8` | Cards / table headers, wells |
| `--danger` / `--danger-strong` / `--danger-soft` | `#e11d48` / `#be123c` / `#fff1f3` | Destructive actions, bad trends |
| `--danger-text` | `#be123c` | Danger **text on the soft tint** (badges, bad-trend pill) |
| `--warning` / `--warning-soft` | `#b45309` / `#fff7ed` | Warnings, offline banner |
| `--info` / `--info-soft` | `#2563eb` / `#eff5ff` | Informational callouts |
| `--chat-*` | original chat hexes (`#efeae2`, `#d9fdd3`, `#53bdeb`, …) | Transcript viewer (mirrors the mobile app) |

### Dark theme (opt-in only)

Dark is applied only when `<html data-theme="dark">` is set. Users choose it from the Theme menu or the command palette (Light / Dark / Match system). **The default is light**, and there is no automatic conversion. Every dark value is a `color-mix()` of original hexes: surfaces come from `#0c1612` (brand ink), text from `#f3f6f4` / `#d2ddd6`, and semantic hues are lightened toward white until they pass AA. `#129a55` itself is unchanged.

### Charts

There is one accent. `--chart-1` is the brand green. The comparison period is a dashed `--subtle` line, so it is told apart by **dash pattern and the legend**, not colour alone. Grid lines use `--line`. Axis text uses `--muted`. No other series hues exist; if a chart ever needs more than two series, use small multiples rather than new colours.

## 3. Contrast (WCAG 2.2 AA)

| Pair | Ratio | Result | Treatment |
|---|---|---|---|
| `#0c1612` on `#ffffff` | 18.44 | ✓ | |
| `#2e3d36` on `#ffffff` | 11.43 | ✓ | |
| `#5b6b63` on `#ffffff` / `#f7faf8` / `#f3f6f4` | 5.63 / 5.36 / 5.18 | ✓ | |
| `#8b9a93` on `#ffffff` | 2.94 | ✗ text | Decorative only; readable text moved to `--muted` |
| `#129a55` text on `#ffffff` | 3.63 | ✗ small text | Text now uses `--brand-text` `#0b7a42` (5.42 ✓) |
| `#0b7a42` on `#e9f8ef` | 4.94 | ✓ | Good-trend pill, counts |
| `#129a55` on `#e9f8ef` | 3.31 | ✗ | Not used for text |
| `#e11d48` on `#ffffff` | 4.70 | ✓ | |
| `#e11d48` on `#fff1f3` | 4.27 | ✗ small text | Text now uses `--danger-text` `#be123c` (5.72 ✓) |
| `#b45309` on `#fff7ed` | 4.73 | ✓ | |
| `#2563eb` on `#eff5ff` | 4.72 | ✓ | |
| **White on `#129a55`** (primary buttons) | **3.63** | **✗ small text** | **Unchanged (brand colour). Owner decision needed, see below** |
| `#129a55` on `#0c1612` (dark) | 5.07 | ✓ | |
| `#8b9a93` on `#0c1612` (dark) | 6.27 | ✓ | |

**Open brand decision.** White 14px text on `#129a55` is 3.63:1. That passes for large text (≥18.66px bold) and for UI components (3:1), but fails AA for normal-size text. The brief forbids changing brand hexes, so it is reported here and **not changed**. The lowest-impact fix would be primary buttons with a `#0b7a42` fill (`--brand-strong`, already the hover colour, 5.42:1). That needs sign-off from the brand owner.

## 4. Typography

- **Families:** Plus Jakarta Sans (UI) and JetBrains Mono (codes, IDs, OTPs). Both are unchanged.
- **Scale (px):** 11 (eyebrows, table headers, uppercase) · 12 (meta) · 13 (body-small, the default for dense UI) · 14 (body) · 15 (card titles) · 24 (page title) · 28 (KPI numbers).
- **Weights:** 500 for labels, 600 for headings and buttons, 700 for page titles and KPI values. `extrabold` was removed: it read as loud next to the data.
- **Figures:** `.tnum` (tabular figures) on every number that changes or sits in a column, so values don't jitter while animating or across rows.
- **Tracking:** page titles use −0.02em; uppercase table headers use wider tracking.

## 5. Spacing and layout

- **Base unit:** 4px (Tailwind scale).
- **Card padding:** 16px for KPI cards, 20px for content cards. Grid gaps are 16px.
- **Page gutters:** 16px under 640px, 24px at 640px and up, 32px at 1024px and up. Content width is capped at 1400px.
- **Sidebar:** 15.5rem expanded, 4.25rem collapsed (persisted). Below 1024px it becomes a drawer.
- **Top bar:** 3.5rem.

## 6. Radius

| Token | Value | Used for |
|---|---|---|
| `--shape-xs` | 6px | Skeleton bars, kbd |
| `--shape-sm` | 8px | Buttons, inputs, menu items (`rounded-lg`) |
| `--shape-md` | 10px | |
| `--shape-lg` | 12px | Cards, popovers, callouts (`rounded-xl`) |
| `--shape-xl` | 16px | Modals |

`rounded-2xl` on cards was retired for a calmer, more architectural look.

## 7. Elevation

| Name | Used for |
|---|---|
| `shadow-xs` | Segmented thumb, small controls |
| `shadow-card` | Resting cards. A hairline only, so borders do the work. In dark mode, a 1px ring. |
| `shadow-raised` | Hovered interactive cards |
| `shadow-pop` | Menus, tooltips, toasts, command palette |

## 8. Focus

Every interactive element shows a visible focus indicator: `focus-visible:ring-2 ring-brand-ring` (brand at 24% opacity, 38% in dark), or the inset brand bar on table rows. The focus ring is never removed without a replacement. A "Skip to content" link is the first tab stop.

## 9. Motion

See `MOTION_GUIDELINES.md`. Tokens: `--dur-micro` 140ms, `--dur-base` 220ms, `--dur-layout` 320ms, and the curves `--motion-ease-out` / `-in` / `-in-out`.

## 10. Breakpoints

Tailwind defaults, verified at 1920, 1440, 1280, 1024, 768, 390 and 360px:

| Breakpoint | What changes |
|---|---|
| `< 420px` | KPI grid is one column |
| `≥ 420px` | KPI grid is two columns |
| `sm 640` | Table columns start to appear (`hideBelow`) |
| `lg 1024` | Fixed sidebar replaces the drawer; collapse button appears; KPIs in three columns |
| `xl 1280` | Full search field, breadcrumb parents and account text in the top bar; KPIs in five columns |
