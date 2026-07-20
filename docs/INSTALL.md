# Installation Guide — Sonix

This guide walks you through installing the **Laravel API** and the **React Native / Expo** mobile app from scratch.

## Requirements

### Backend (Laravel)
- PHP >= 8.3
- Composer >= 2
- PostgreSQL >= 14 (recommended) / MySQL >= 8 / SQLite
- Extensions: `ctype, curl, dom, fileinfo, json, mbstring, openssl, pdo, tokenizer, xml`
- FFmpeg (optional, for video transcoding/thumbnails)

### Mobile (Expo)
- Node.js >= 18
- npm >= 9 (or yarn / pnpm)
- Expo CLI (`npm i -g expo-cli`)
- Android Studio / Xcode for device builds (optional for Expo Go)

---

## 1. Backend

```bash
cd laravel-backend

# 1. Install dependencies
composer install

# 2. Environment
cp .env.example .env
php artisan key:generate

# 3. Configure database in .env
#   DB_CONNECTION=pgsql
#   DB_HOST=127.0.0.1
#   DB_PORT=5432
#   DB_DATABASE=sonix
#   DB_USERNAME=sonix
#   DB_PASSWORD=secret

# 4. Run migrations + seeders
php artisan migrate --force --seed

# 5. (Optional) Storage symlink for local media
php artisan storage:link

# 6. Start the API
php artisan serve            # http://127.0.0.1:8000
```

The API is now available at `http://127.0.0.1:8000/api`.

### Useful commands
```bash
php artisan route:list                 # list all endpoints
php artisan config:clear               # clear config cache
php artisan queue:work                 # run queue worker (if used)
php artisan backfill:reel-analytics    # backfill reel analytics
```

---

## 2. Mobile App

```bash
cd expo-app

npm install

# Point the app at your API. Edit src/api/client.js baseURL:
#   const BASE_URL = "http://10.0.2.2:8000/api";   # Android emulator -> host
#   const BASE_URL = "http://localhost:8000/api";  # iOS simulator

npx expo start
```

Scan the QR code with **Expo Go** (or run `npx expo run:android` / `npx expo run:ios`).

> For physical devices, use your computer's LAN IP (e.g. `http://192.168.0.20:8000/api`) and ensure the phone is on the same network.

---

## 3. Demo Accounts

After seeding you get:

| Role  | Email              | Password   |
|-------|--------------------|------------|
| admin | admin@sonix.app    | password   |
| user  | demo@sonix.app     | password   |

(See `database/seeders` for the full demo dataset.)

---

## 4. Environment Notes

- `APP_DEBUG` ships as `false` for safety.
- Media is served through signed URLs for anonymous users; authenticated requests pass automatically.
- Caching defaults to the file driver; switch to Redis in production via `CACHE_DRIVER=redis`.

Troubleshooting: see [FAQ.md](FAQ.md).
