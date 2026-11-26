# Aivora Admin: design system

Light, soft UI in Aivora green. All values live in `src/app/globals.css` as CSS variables, exposed to Tailwind through `@theme inline`. Components use only the token names below, never raw hex.

## Tokens

| Group | Tailwind names | Notes |
|-------|----------------|-------|
| Brand | `brand` `brand-strong` `brand-soft` `brand-ring` | `#129a55`, used for primary actions, active nav and focus rings |
| Text | `ink` `ink-soft` `muted` `subtle` | headings → body → secondary → placeholder |
| Surfaces | `canvas` `surface` `surface-muted` | page → cards → insets/table headers |
| Lines | `line` `line-strong` | borders, dividers |
| Status | `danger(-strong/-soft)` `warning(-soft)` `info(-soft)` | strong for text/icons, soft for backgrounds |
| Depth | `shadow-xs` `shadow-card` `shadow-pop` | controls → cards → modals/menus |
| Motion | `animate-fade-in` `pop-in` `slide-in` `slide-in-left` `toast-in` | all disabled under `prefers-reduced-motion` |

Type: Plus Jakarta Sans for UI, JetBrains Mono for codes, IDs and IPs. Base size 14px.

## Components (`src/components/ui`)

Import everything from `@/components/ui`.

- **Layout:** `Card`, `CardHeader`, `CardToolbar`, `PageHeader`, `StatCard`
- **Actions:** `Button` (primary · secondary · ghost · danger · danger-soft), `ButtonLink`, `IconButton`, `CopyButton`
- **Forms:** `Field` (label, hint, error, aria wiring), `Input` (leading/trailing slots), `Textarea`, `Select`, `SearchInput`, `NumberField`, `Switch`, `SwitchRow`, `Segmented`
- **Data:** `DataTable` (responsive columns, paging, skeleton, empty state), `Badge`, `Avatar`, `Person`, `ChatTranscript`, `Elapsed`
- **Feedback:** `Callout`, `EmptyState`, `Skeleton`, toasts (`useToast`), `useConfirm()`, `Modal`, `Drawer`, `SaveBar`

## Patterns

- **Reads:** `useQuery(key, signal => api(signal), { refreshMs })`. Requests are cancelled on unmount, and the previous data stays on screen while a refresh runs.
- **Writes:** `useAction().run(key, fn, { success, errorTitle })` shows a toast and tracks pending state per row or button.
- **Destructive actions:** always go through `useConfirm()` with `tone: "danger"`.
- **Forms with Save:** `useDraft(base)` + `SaveBar`. Only changed fields are sent.
- **Errors:** `errorMessage(err)` turns backend error codes into plain sentences (`src/lib/errors.ts`).
- **Status labels and colours:** in one place, `src/lib/status.ts`.
