# Aivora Admin

Next.js 15 admin console for Aivora. It talks to `aivora-backend` (`/api/admin/*`). Pages and APIs are listed in [docs/ADMIN_MAP.md](docs/ADMIN_MAP.md), tokens and components in [design-system.md](design-system.md).

## Architecture

```
src/
  app/
    (admin)/        # one folder per page, all behind the auth shell
    login/          # sign-in + 2FA
  components/
    layout/         # AdminShell, Sidebar, Topbar
    ui/             # design-system primitives
    calls/          # call table cells shared by Live + History
    brand/          # logo
  config/           # nav (single source for sidebar + titles), constants
  hooks/            # useQuery, useAction, useDraft, useAdminCallsStream, …
  lib/
    api/            # http client (auth, refresh, errors), endpoints, DTO types
    errors.ts       # backend error code → message
    status.ts       # status labels + badge tones
    format.ts csv.ts validate.ts cn.ts
```

**Rules of thumb**

- Pages fetch with `useQuery` and write with `useAction`. No page calls `fetch` directly.
- UI comes from `@/components/ui`, and colours come from tokens only.
- Validation matches the backend's limits, so a form never sends something the API rejects.

## Run

```bash
cd aivora-admin
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8080`). Open [http://localhost:3000/login](http://localhost:3000/login) and sign in with an admin account from the backend.

## Routes

| Path | Page |
|------|------|
| `/login` | Admin sign-in + 2FA |
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
| `/stickers` | Sticker packs |
| `/channels` | Channels |
| `/admins` | Admin users |
| `/audit` | Audit log |
| `/security` | Security |
| `/firewall` | IP access |

## Security

- Do not commit admin passwords or SMS/email secrets.
- The session token lives in `localStorage`. The server checks the token and role on every request, and checks the IP allow-list at sign-in.
