# Sonix — Project Instructions

These instructions are specific to the **Sonix** workspace (React Native/Expo mobile app + Laravel REST API). They take the highest priority over the user-level `~/.config/opencode/AGENTS.md` and built-in defaults. When a project rule conflicts with a global rule, follow the project rule.

## Stack

- **Mobile:** React Native 0.86 + Expo SDK 57 (`expo-app/`), React 19, JavaScript (`.js`, no TypeScript — do not introduce TS unless asked).
- **Backend:** Laravel 13 (PHP 8.3) REST API (`laravel-backend/`), Sanctum bearer auth, PostgreSQL (prod) / SQLite (dev fallback).
- **Realtime:** Reverb + Redis (broadcasting, typing, presence).
- **Media:** Cloudinary (video/image).
- **Build/deploy:** EAS Build (`<your-eas-project-slug>`), Docker + nginx (see `docker-compose.yml`).

## Project layout

- `expo-app/` — React Native app (screens under `src/screens`, navigation `src/navigation`, api client `src/api/client.js`, i18n `src/i18n`).
- `laravel-backend/` — API (controllers `app/Http/Controllers/Api`, models `app/Models`, services `app/Services`, middleware `app/Http/Middleware`, migrations `database/migrations`).
- `docs/`, `commercial/`, `assets/` — non-code (sales/deploy docs, media).

## Commands

- **Backend tests:** `cd laravel-backend && vendor/bin/phpunit` (or `./vendor/bin/pest` if present). Use `APP_ENV=testing DB_CONNECTION=sqlite DB_DATABASE=:memory:`.
- **Backend lint:** `cd laravel-backend && ./vendor/bin/pint` (Laravel Pint).
- **Mobile:** `cd expo-app && npm start` (Expo dev), `npm run android` (EAS build). No `npm test` framework configured — rely on type/build checks and manual/expo verification.
- **Migrations:** `cd laravel-backend && php artisan migrate`.

## Conventions (follow, do not override unprompted)

- API organized by resource controllers under `app/Http/Controllers/Api`; routes grouped under `auth:sanctum`.
- All DB access via Eloquent / parameterized queries (no raw SQL concatenation).
- Consistent `$request->validate()` at the top of controllers.
- Frontend uses a central axios client (`src/api/client.js`) with a 401 interceptor that clears auth on token expiry.
- State via React Context + local hooks (no Redux/Zustand). Navigation is Stack + Bottom-Tab.

## Security rules (mandatory for this repo)

- `APP_DEBUG` must stay `false` in shipped `.env`.
- Security middlewares (`SecurityHeaders`, `AntiScraping`, `MediaSecurity`) must remain registered in `bootstrap/app.php`.
- Never return raw exception messages (`$e->getMessage()`) to API clients; log server-side only.
- `deleted_for` is stored as a JSON array of user IDs — query with `whereJsonDoesntContain`, never `LIKE '%id%'`.
- Password-reset tokens are hashed before storage; keep them >= 8 chars.

## Known gaps (from AUDIT_REPORT.md — pick up when asked)

Reels depth (WebView→native `expo-video`), Explore/discovery, Moderation/Admin panel, Analytics, CSP header, `reel_comments.parent_id` index (added), `ReelService` double-count (fixed). Do not start large new features unless the task requests them.

## Compose with global policy

Global ELITE MAX workflow, Skills, Context7/MCP usage, 3D/UI quality bar, and the final checklist all apply here. This file only adds Sonix-specific constraints; everything else is inherited from the user-level `AGENTS.md`.
