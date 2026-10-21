# Aivora Admin (Dev)

Next.js 15 admin console for Aivora — Soft UI + brand green, config-driven list pages, mock data until the API is wired.

## Knowledge graph

Architecture questions should go through **graphify** (not blind search):

```bash
cd aivora-admin
graphify query "How does ResourcePage connect to list pages?"
open graphify-out/graph.html   # interactive map
```

Rebuild after large refactors: `/graphify src` (AST extract of `src/`). Outputs live in `graphify-out/` (gitignored).

## Architecture

```
src/
  app/                 # Next.js App Router — thin route files only
    (admin)/           # Authenticated shell routes
    login/             # Auth screen
  components/
    layout/            # AdminShell, Sidebar
    ui/                # Shared primitives (Button, Search, Select, …)
    data/              # DataTable + ResourcePage (mapping-driven lists)
  config/              # Nav, app constants (no secrets)
  data/                # Mock datasets (swap for API clients later)
  features/
    resources/         # Table/filter/action configs per resource
    dashboard/         # Dashboard chart/stat configs
    settings/          # Settings form schema
  types/               # Shared domain types
```

**Rules of thumb**

- Routes stay thin: `return <ResourcePage {...usersResource} />`
- UI primitives live in `components/ui` — pages never duplicate table markup
- New list screens = add a resource config in `features/resources`, then a 3-line page
- Mock data is isolated in `data/` so API wiring is a drop-in replacement

## Run

```bash
cd aivora-admin
npm install
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login). Mock sign-in accepts any email/password (`localStorage` session only).

## Routes

| Path | Page |
|------|------|
| `/login` | Admin login + APK card |
| `/` | Dashboard |
| `/users` | Users |
| `/otps` | OTP log |
| `/conversations` | Conversations |
| `/live` | Live calls |
| `/calls` | Call history |
| `/reports` | Reports |
| `/countries` | Countries |
| `/settings` | Settings |
| `/legal` | Legal |
| `/android` | Android app |
| `/stickers` | Stickers |
| `/channels` | Channels |
| `/admins` | Admin users |
| `/audit` | Audit log |
| `/security` | Security |
| `/firewall` | IP access |

## Security

- Do not commit live admin passwords or SMS/email secrets.
- Download URL and branding live in `src/config/constants.ts` (dummy CDN for now).
- Backend wiring comes next — UI uses `src/data/mock.ts`.

## Next steps

1. Replace `data/mock` with API clients.
2. Point the Android Dev app (`com.aivora.app.dev`) at that API.
