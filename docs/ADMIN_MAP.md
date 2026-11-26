# Admin pages → backend

Every page talks to the real API under `/api/admin/*`. The client lives in `src/lib/api/endpoints.ts`.

| Page | Path | API | What works |
|------|------|-----|------------|
| Sign in | `/login` | `auth/login`, `auth/totp`, `auth/totp/setup`, `auth/totp/confirm` | Password, 2FA code, first-time authenticator setup, IP and lockout errors |
| Dashboard | `/` | `metrics`, `reports`, `otps` | Live KPIs, open reports, recent codes |
| Users | `/users` | `users` | Search, filter, create, ban/unban, delete, CSV |
| OTP log | `/otps` | `otps` | Codes with status, show/copy, auto refresh |
| Conversations | `/conversations` | `conversations` | Search by title, phone or name; transcript and members |
| Live calls | `/live` | `calls/stream` (SSE) | Real-time ringing/active calls, end a call |
| Call history | `/calls` | `calls` | Filter by status/type, CSV |
| Reports | `/reports` | `reports` | Review, resolve or dismiss with a note, optional ban |
| Countries | `/countries` | `countries` | Show/hide, edit name, dial code and order |
| Settings | `/settings` | `settings` | OTP expiry and resend gap, SMS on/off, maintenance mode |
| Legal | `/legal` | `legal` | Terms and privacy text (shown in the app under Help) |
| Android app | `/android` | `settings` | Latest/minimum version, download link (force-update prompt) |
| Sticker packs | `/stickers` | `stickers` | Read-only list (packs ship with the app) |
| Channels | `/channels` | `channels` | Create, edit, verify, list/unlist, delete, hide posts |
| Admin users | `/admins` | `admins` | List; super admins can add admins |
| Audit log | `/audit` | `audit` | Last 200 admin actions, filter, CSV |
| Security | `/security` | `security` | Require 2FA, session length, login lockout |
| IP access | `/firewall` | `firewall` | Admin sign-in allow-list (IPv4 / CIDR) |

## Settings stored but not used yet

The backend stores these, but neither the backend nor the app reads them, so the admin hides them: OTP length, attempts and rate limits, ring timeout, group size limits, upload limit, edit window, people search. Wire each into the backend before adding it back to `/settings`.
