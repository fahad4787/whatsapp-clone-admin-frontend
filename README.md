# Bolta Punjab Admin (Dev)

Next.js admin console matched to the live [Bolta Punjab Admin](https://wa.zirvik.com/admin) UI, polished with **Soft UI Evolution** + Bolta green.

## Skills installed

| Skill | Where |
|-------|--------|
| [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | `~/.cursor/skills/` + `.cursor/skills/` |
| graphify | linked in `.cursor/skills/` |
| vercel-react-best-practices | linked |
| web-design-guidelines | linked |
| frontend-design | linked |

See `design-system.md` and `.cursor/rules/admin-ui.mdc`.

## Run

```bash
cd bolta-punjab-admin
npm install
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login). Mock sign-in accepts any email/password (session in `localStorage` only).

## Routes (same as live)

| Path | Page |
|------|------|
| `/login` | Admin login + APK QR card |
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

## Reference screenshots

Captured from the live admin (read-only): `reference-screenshots/`.

## Security

- **Do not** commit live admin passwords or SMS/email secrets into this repo.
- Browser password saving is fine for your local browser; keep secrets out of git.
- Backend wiring comes next — this UI currently uses mock data in `src/lib/mock.ts`.

## Next steps

1. Build API that serves these admin screens.
2. Point the Android Dev app (`com.boltapunjab.app.dev`) at that API.
