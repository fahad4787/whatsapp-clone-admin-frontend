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

## Backend (later)

Implement APIs behind these screens, then connect:

- Admin UI → admin API  
- Android Dev app → public `/api/*` + WS (already recovered in `bolta-punjab`)
