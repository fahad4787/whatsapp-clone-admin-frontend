# Live admin → rebuild map

Mapped from `https://wa.zirvik.com/admin` (session provided by you).

## Sidebar modules

1. Dashboard — KPIs, live WS/LiveKit counts, charts, recent OTPs  
2. Users — search, status filter, export, create  
3. OTP log — generate code, reveal (audited), auto-refresh  
4. Conversations — groups/direct, member/message counts  
5. Live calls — in-progress rooms  
6. Call history — outcomes, export  
7. Reports — open reports, block user / open channel  
8. Countries — enable dial codes for signup  
9. Settings — OTP/calls/groups/media/messages/Android/email/SMS/privacy  
10. Legal — privacy + terms editors  
11. Android app — APK upload + version gates  
12. Stickers — packs  
13. Channels — broadcast channels  
14. Admin users — panel operators  
15. Audit log — admin actions  
16. Security — 2FA / session policy  
17. IP access — admin allowlist  

## Live today (Wave 8 + chat Waves 9–15)

| Screen | Status |
|--------|--------|
| Dashboard | Live — metrics include online, groups/direct, TTL chats, media/voice/polls/events |
| Users | Live — last seen + privacy; ban/unban/delete |
| OTP log | Live |
| Conversations | Live — list + detail (members, TTL, message types) |
| Reports | Live — message previews on reported chats |
| Calls / channels / stickers / settings / … | Still mock / later |

## Backend

- Admin UI → `/api/admin/*` (auth, users, otps, reports, metrics, conversations)  
- Android app → public `/api/*` + WS (`aivora`)
