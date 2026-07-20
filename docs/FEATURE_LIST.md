# Sonix — Feature List

A complete feature catalogue of the Sonix social media starter kit.

## Authentication & Account
- Email + password auth (Sanctum bearer tokens)
- Password reset with enumeration-safe flow
- Email verification with expiring codes (resend supported)
- Two-factor authentication (2FA code) enforced server-side before token issuance
- Change password, delete account
- Profile privacy toggle (public / private)
- Activity-status (online) toggle

## Profiles
- Avatar, bio, username, display name
- Followers / following with tabs
- Private-account follow requests (approve / reject)
- Profile visitors, badges
- Profile templates
- Block / unblock users with server reconciliation
- Muted words

## Posts
- Text / image / video posts
- Likes, comments with @mentions, bookmarks, share
- Hashtag feeds and post statistics (views, pins)
- Pinned posts
- Saved posts gallery

## Stories
- Photo / video / text stories
- Viewers list, reactions, forwards
- Story highlights (create / add / remove)
- Per-story analytics

## Reels (v2)
- Vertical full-screen feed with native autoplay (expo-video)
- Double-tap like, comments, saves, shares
- Hashtags, @mentions, watch history, completion tracking
- For-You and Trending recommendation engine
- Popular hashtags, by-hashtag browsing
- Creator analytics (views, engagement rate)
- **Pro features:** drafts, scheduled publishing, featured/curated feed, built-in music library, Pro badge

## Search & Discovery
- Unified search: users, reels, posts, stories, hashtags, audio
- Trending hashtags, smart suggestions with caching
- Recent searches (save / clear)

## Messaging
- 1:1 and group chat
- Realtime typing indicators, presence, read & delivered receipts (Reverb + Redis)
- Voice messages with animated waveform
- Media: image / video / document / voice
- Vanish mode, mute, pin conversation, star, save, draft
- Offline message queue auto-flushed on reconnect
- Block / unblock from chat

## Notifications
- Push (Expo Notifications) + in-app notifications
- Notification preferences (push / email / like / comment / follow / message)
- Mark seen

## Admin & Moderation
- Dashboard with live stats
- User management (ban / unban, roles & permissions)
- Content removal (posts / reels / stories)
- Reports queue with moderation status
- Bad-word (profanity) filter CRUD
- Broadcast notifications to all users
- Settings + audit logs

## Onboarding & UX
- First-launch swipeable onboarding carousel
- Bilingual UI (English / Arabic) with full RTL support
- Global toast system + production-safe error boundary
- Presence / online indicators
- Themed 3D glassmorphism design that respects reduced-motion

## Platform & DevOps
- Laravel 13 REST API, PHP 8.3+
- PostgreSQL / MySQL / SQLite
- Cloudinary / S3 / MinIO media storage with signed URLs
- Reverb WebSocket realtime + Redis caching/queues
- Docker / docker-compose, nginx, supervisord, Railway configs
- Expo EAS Build for iOS / Android
- Rate limiting, security headers, anti-scraping middleware
