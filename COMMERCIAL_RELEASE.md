# Sonix — Commercial Release

**Tagline:** The complete, production-grade Instagram-style social app — backend, mobile, and admin — in one package.

Sonix is a full-stack social networking starter kit that ships with everything a modern social app needs:
short-video **Reels**, **Stories**, **real-time Chat** (1:1 + groups), **Feeds**, **Discovery**, **Moderation/Admin**,
and **Analytics**. It is built on a battle-tested stack (Laravel + React Native / Expo) and is ready to rebrand and ship.

---

## What's in the box

```
sonix/
├── laravel-backend/   # REST API (Laravel, Sanctum, PostgreSQL/MySQL, Reverb realtime)
├── expo-app/          # React Native / Expo mobile app (iOS + Android)
├── assets/            # Logo, splash, branding source
├── docs/              # Installation, API, Database, Deployment, Admin, FAQ, Branding
├── commercial/        # Store screenshots checklist, certification
├── ENV.example        # All environment variables documented
├── docker-compose.yml # One-command local stack (API + DB + Redis + Reverb)
├── README.md
├── LICENSE
└── CHANGELOG.md
```

- **Mobile:** ~40 screens, 17 components, full i18n (English + Arabic, RTL/LTR), themed 3D glassmorphism UI.
- **Backend:** 24 API controllers, 43 models, 175+ REST endpoints, admin middleware, security headers, rate limiting.
- **Realtime:** Reverb + Redis broadcasting (typing, presence, read/delivered receipts, group messages).

## Quick start (under 10 minutes)

```bash
# Backend
cd laravel-backend
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed
php artisan serve                 # http://127.0.0.1:8000

# Mobile
cd expo-app
npm install
# set BASE_URL in src/api/client.js -> http://10.0.2.2:8000/api (Android) or localhost (iOS)
npx expo start
```

Demo accounts after seeding: `admin@sonix.app` / `demo@sonix.app` (password: `password`).

## Quality bar

- Every Critical, High, and Medium button / navigation / screen / API defect closed (pre-sale audit + fix pass).
- All buttons functional; no fake switches, no placeholder screens, no broken routes.
- Backend passes Laravel Pint; frontend parses clean under Expo.
- Realtime channels verified end-to-end (group messages, read/delivered, 2FA login).

> ⚠️ **Runtime note:** the package was validated via static analysis + live backend API tests. Buyers should
> smoke-test on a physical device/emulator before publishing. Buyer-side configuration (Firebase `google-services.json`,
> APNs, SMTP, Reverb, Cloudinary) is documented but must be supplied by the buyer.

## License

Released under the **Sonix Commercial Starter Kit License** (see `LICENSE`). You may rebrand and ship your own
applications; you may not resell the unmodified source as a competing starter kit.

**Sonix — ship your social app this week, not next quarter.**
