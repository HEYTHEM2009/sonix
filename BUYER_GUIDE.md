# Buyer Guide — Sonix

Welcome to **Sonix**, a complete, production-ready social-media starter kit
(Laravel REST API + React Native / Expo mobile app). This file is your
starting point. Full documentation lives in the [`docs/`](docs/) folder.

## Quick start
1. Read [`docs/INSTALL.md`](docs/INSTALL.md) to run locally in ~10 minutes.
2. Follow [`docs/BUYER_GUIDE.md`](docs/BUYER_GUIDE.md) to rebrand, configure
   services (mail, realtime, push, media), and deploy.
3. API details: [`docs/API.md`](docs/API.md). Database schema:
   [`docs/DATABASE.md`](docs/DATABASE.md). FAQ: [`docs/FAQ.md`](docs/FAQ.md).

## What you get
- Laravel 13 API (Sanctum auth, Reverb + Redis realtime, Cloudinary media).
- Expo / React Native app (Reels, Stories, real-time chat, search, admin panel).
- Docker + nginx deployment config, env examples, and full docs.

## Rebrand in minutes
- App name / logo: `assets/logo.png` + `APP_NAME` in `.env`.
- Theme: `expo-app/src/components/Theme.js`. Strings: `expo-app/src/i18n`.

## Environment files
| File | Purpose |
|------|---------|
| `.env.example` | Index of required variables |
| `laravel-backend/.env.example` | Backend (Laravel) config |
| `expo-app/.env.example` | Mobile (Expo) config |

Never commit real `.env` files — all secrets above are placeholders.

## Demo accounts (seeded)
- Admin: `admin@sonix.app` / `password`
- User:  `demo@sonix.app`  / `password`

## License
See [`LICENSE`](LICENSE). You may rebrand and use Sonix as the foundation for
your own product or commercial offering per the license terms.
