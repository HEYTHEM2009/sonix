# Release Notes — Sonix

## v1.0.0 (2026-07-19) — Initial Commercial Release
First public, commercially-ready release of the Sonix social media starter kit.

### Included
- Laravel 13 REST API (24 controllers, 43 models, 175+ endpoints).
- React Native / Expo SDK 57 mobile app (~40 screens, EN + AR, RTL/LTR).
- Reels with For-You + Trending engine, creator analytics, Pro features (drafts, schedule, music library).
- Stories with viewers, reactions, highlights, analytics.
- Real-time 1:1 + group chat (Reverb + Redis): typing, presence, read/delivered receipts, offline queue.
- Feeds, hashtags, unified search, notifications (push + in-app).
- Admin & moderation: dashboard, user mgmt, content removal, reports, bad-word filter, broadcast, audit logs.
- Auth: 2FA, email verification, password reset, privacy/activity toggles.
- Docker / docker-compose, nginx, supervisord, Railway configs; `.env.example`; idempotent seeders.
- Full documentation: INSTALL, API, DATABASE, DEPLOYMENT, ADMIN, FAQ, Branding, Buyer Guide.
- Commercial license + Regular/Extended/Commercial tiers, Terms, Privacy template, third-party attribution.

### Quality
- Pre-sale audit: all Critical, High, and Medium defects closed.
- Backend passes Laravel Pint; frontend parses clean under Expo.
- Realtime channels (2FA login, group messages, read/delivered) verified live.

### Known limitations
- Push notifications require buyer-supplied Firebase (`google-services.json`) / APNs.
- Media storage defaults to local; Cloudinary/S3 configurable via env.
- No automated test suite beyond example stubs (recommend adding before fork).

## Upgrade path
See `docs/DEPLOYMENT.md` → Upgrade guide.
