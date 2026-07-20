<p align="center">
  <img src="assets/logo.png" alt="Sonix Logo" width="120" height="120" />
</p>

<h1 align="center">Sonix — Full-Stack Social Media Starter Kit</h1>

<p align="center">
  A production-ready, 100% original social media platform built with <strong>Laravel</strong> (REST API) and <strong>React Native / Expo</strong> (mobile app). Reels, Stories, Real-time Chat, Search, Admin Panel, and more — out of the box.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#installation">Installation</a> •
  <a href="#api-reference">API</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#admin-panel">Admin</a> •
  <a href="#license">License</a>
</p>

---

## Why Sonix

Sonix is a **complete commercial starter kit** you can rebrand and sell, or use as the foundation for your own social product. It is:

- **100% original source** — no third-party copyrighted assets, logos, or code.
- **Fully open** — Laravel + Expo/React Native, deployable anywhere (shared hosting, VPS, Docker, serverless).
- **Feature-complete** — auth, profiles, posts, reels, stories, chat, search, notifications, admin & moderation.
- **Production-hardened** — rate limiting, security headers, anti-scraping, signed media URLs, safe error handling, audit logging.
- **Bilingual** — full RTL + LTR support (Arabic & English) with an extensible i18n layer.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Laravel 13 (PHP 8.3+) |
| Auth | Laravel Sanctum (token auth) |
| Database | PostgreSQL / MySQL / SQLite |
| Mobile | React Native 0.8x + Expo SDK 57 |
| Video | `expo-video` (native player) |
| State | React Context (Auth, Language, Toast) |
| Media | Local / S3 / Cloudinary / MinIO |
| Caching | Laravel Cache (file/redis) |

## Features

### Core
- Email + password authentication, password reset, email verification hooks
- Profiles: avatar, bio, username, private accounts, blocks, muted words
- Security: rate limiting, secure headers, signed media, 2FA-ready

### Social
- Posts (text / image / video), likes, comments with @mentions, bookmarks, share, pin
- Hashtag feeds, view tracking & post statistics
- Stories with stickers, drawing, and analytics
- Voice messages with animated waveform, vanish mode, group chat with typing indicators

### Reels v2 (NEW)
- Vertical full-screen feed with autoplay, double-tap like, comments, saves, shares
- Hashtags, @mentions, watch history, completion tracking
- Creator analytics: views, engagement rate, trending & "For You" recommendation engine
- Popular hashtags, by-hashtag browsing
- **Pro features**: drafts, scheduled publishing, featured/curated feed, built-in music library
- **Pro badge** for creators (self-serve toggle in Settings)

### Search (NEW)
- Unified search across users, reels, posts, stories, hashtags, audio
- Trending hashtags, smart suggestions with caching

### Admin & Moderation (NEW)
- Dashboard with live stats
- User management (ban / unban), content removal
- Reports queue with moderation status
- Roles & permissions, settings, audit logs
- Bad-word filter (profanity) CRUD
- Broadcast notifications to all users

### Onboarding (NEW)
- First-launch swipeable onboarding carousel
- Global toast system & production-safe error boundary

## Getting Started

```bash
# Backend
cd laravel-backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve

# Mobile
cd expo-app
npm install
npx expo start
```

Full detail in [docs/INSTALL.md](docs/INSTALL.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## API Reference

See [docs/API.md](docs/API.md) for the full endpoint catalogue (175+ routes), auth scheme, and examples.

## Database

See [docs/DATABASE.md](docs/DATABASE.md) for the schema overview (40 models, 56+ migrations).

## Admin Panel

See [docs/ADMIN.md](docs/ADMIN.md) for admin usage. A user with `role = admin` gets the Admin entry in Settings.

## Security

- `APP_DEBUG` is `false` in shipped `.env`
- Security headers + anti-scraping middleware on the API
- Media URLs require a signature for anonymous users; authenticated users pass
- Generic error messages to clients; full detail is logged server-side
- Throttling on API routes

## License

Sonimated under a **commercial license** included in [LICENSE](LICENSE). You may rebrand and ship the product; you may **not** resell the raw source as a competing starter kit without permission. See the file for full terms.

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/INSTALL.md](docs/INSTALL.md) | Local install in <10 min |
| [docs/API.md](docs/API.md) | Full REST endpoint catalogue |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema overview (43 models) |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Docker / Railway / EAS + Troubleshooting + Upgrade |
| [docs/ADMIN.md](docs/ADMIN.md) | Admin panel usage |
| [docs/FAQ.md](docs/FAQ.md) | Common questions |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Version history |
| [docs/BRANDING.md](docs/BRANDING.md) | Rebrand assets |
| [docs/FEATURE_LIST.md](docs/FEATURE_LIST.md) | Complete feature catalogue |
| [docs/COMPARISON.md](docs/COMPARISON.md) | Sonix vs alternatives |
| [docs/DEMO_VIDEO_SCRIPT.md](docs/DEMO_VIDEO_SCRIPT.md) | Marketplace video script |
| [docs/BUYER_GUIDE.md](docs/BUYER_GUIDE.md) | From purchase to live app |
| [docs/MARKETING.md](docs/MARKETING.md) | Store copy, SEO, pricing |
| [docs/WHY_BUY_SONIX.md](docs/WHY_BUY_SONIX.md) | Why buy |
| [COMMERCIAL_RELEASE.md](COMMERCIAL_RELEASE.md) | Package overview |
| [ENV.example](ENV.example) | All environment variables |
| [licenses/](licenses/) | Regular / Extended / Commercial + Terms + Privacy + third-party |
| [store/](store/) | Per-marketplace listings, release notes, version history |

## Support

See [docs/FAQ.md](docs/FAQ.md) for common questions, and [docs/CHANGELOG.md](docs/CHANGELOG.md) for version history.
