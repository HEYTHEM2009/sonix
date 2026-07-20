# Changelog — Sonix

All notable changes to the Sonix starter kit.

## [2.1.0] — 2026-07-18 — Reels Pro
### Added
- **Reels Pro**: draft reels, scheduled publishing (`scheduled_at`), featured/curated feed (`is_featured`).
- **Music library**: `music_tracks` table + `MusicTrackSeeder` (12 seeded tracks) powering `/reels/music` and audio search.
- **Pro badge**: `users.is_pro` / `users.pro_until` with self-serve toggle (`POST /reels/pro`) and PRO badge in `ReelItem`/`UserCard`.
- **Reels tabs** (For You / Trending / Featured / Drafts / Scheduled) in `ReelsScreen`.
- **Create Reel** enhancements: pick from music library, Publish/Draft/Schedule status chips.
- **Performance**: composite indexes on `reels` (feed, featured) and `music_tracks` (trending).
- **Security**: relaxed `AntiScraping` to only block malicious bots; added CSP header in `SecurityHeaders`.
- Commercial: `SELLING.md` master listing copy + `commercial/SCREENSHOTS.md` capture checklist.

### Changed
- `SearchService.audio()` now queries the `music_tracks` catalog (with genre filter); suggestions use trending tracks.
- Public feeds (`feed`, `forYou`) now exclude drafts and not-yet-scheduled reels.

## [2.0.0] — 2026-07-18 — Commercial Edition
### Added
- **Reels v2**: vertical feed, autoplay, double-tap like, comments, saves, shares, watch history, creator analytics, trending + "For You" recommendation engine, popular hashtags.
- **Search**: unified search across users/reels/posts/stories/hashtags/audio, trending hashtags, cached smart suggestions.
- **Admin Panel**: dashboard, user ban/unban, content removal, reports moderation, roles/permissions, settings, audit logs, bad-word filter CRUD, broadcast notifications. Mobile `AdminScreen` for `role=admin`.
- **Onboarding**: first-launch swipeable carousel with branding.
- **Global Toast** system + production-safe error boundary.
- **Security hardening**: `APP_DEBUG=false`, SecurityHeaders + AntiScraping middleware, signed media URLs, safe exception renderer, API throttling, defensive migrations with guards.
- **Reusable UI**: `UserCard`, `SearchScreen`, `ReelItem` (native `expo-video`), `useReels` infinite-scroll hook.
- **Performance**: missing indexes migration, cached search/analytics, backfilled reel analytics command.
- Commercial documentation set (README, INSTALL, DEPLOYMENT, API, DATABASE, ADMIN, FAQ, CHANGELOG, LICENSE).

### Changed
- Backend upgraded to Laravel 13 bootstrap-style `bootstrap/app.php`.
- `ReelController` rewritten to v2 contract; exceptions no longer leak raw messages.
- Mobile `ReelsScreen` rebuilt on `useReels` + native `expo-video` `VideoView`.

### Fixed
- SearchService used `name` column (absent) → now uses `username`/`bio`.
- `forYou` correctly excludes own reels.

## [1.0.0] — 2026-06
- Initial release: auth, posts, stories, chat, notifications, RTL/i18n, Docker deploy.
