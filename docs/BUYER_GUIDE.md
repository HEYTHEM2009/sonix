# Buyer Guide — Sonix

Welcome! This guide helps you go from purchase to a live, branded social app.

## 1. Before you start
- A server with PHP 8.3+, a database (PostgreSQL recommended), and Node 18+ for the app.
- Accounts you'll need to configure (buyer-side, not included): a domain, SMTP/email,
  Firebase project (`google-services.json`) for Android push, APNs for iOS, and optional Cloudinary for media.
- ~30–60 minutes for a local run; a few hours for a production deploy.

## 2. Run it locally (first 10 minutes)
Follow `docs/INSTALL.md`:
1. `cd laravel-backend && composer install && cp .env.example .env && php artisan key:generate`
2. `php artisan migrate --seed && php artisan serve`
3. `cd expo-app && npm install`, copy `expo-app/.env.example` to `expo-app/.env` and set `EXPO_PUBLIC_API_URL` to your API (`http://10.0.2.2:8000/api` for Android emulator, or your LAN/production URL), then `npx expo start`
4. Log in with `demo@sonix.app` / `password`.

## 3. Rebrand
- **Name / logo:** replace `assets/logo.png` and update `APP_NAME` in `.env`; strings live in `expo-app/src/i18n`.
- **Colors:** theme tokens in `expo-app/src/components/Theme.js`.
- **Backend display:** `app_name` / mail from-name in `.env`.

## 4. Configure services
| Service | Where | Doc |
|---------|-------|-----|
| Database | `.env` `DB_*` | `docs/INSTALL.md` |
| Mail | `.env` `MAIL_*` | `docs/INSTALL.md` |
| Realtime | `.env` `REVERB_*` + `php artisan reverb:start` | `docs/DEPLOYMENT.md` |
| Push (Android) | `google-services.json` in `expo-app/` | Expo docs |
| Push (iOS) | APNs cert + EAS config | Expo docs |
| Media (Cloudinary) | `.env` `CLOUDINARY_*` | `docs/DEPLOYMENT.md` |

## 5. Deploy
- **Backend:** `docs/DEPLOYMENT.md` (Docker / Railway / Forge / cPanel).
- **Mobile:** `eas build` for iOS/Android; set `BASE_URL` to your API; `eas submit`.

## 6. Verify after deploy
- Log in, post, like, comment; open Reels; send a chat message and confirm read receipt;
  log in as admin and check the dashboard. See `docs/DEPLOYMENT.md` Troubleshooting.

## 7. Upgrades
- Follow the Upgrade guide in `docs/DEPLOYMENT.md`. Never edit core files you intend to keep through updates.

## 8. Support & license
- License terms: `LICENSE`. You may rebrand and ship your own apps; you may not resell the
  unmodified source as a competing starter kit.
- Support is at the seller's discretion; include your purchase reference.

## FAQ
See `docs/FAQ.md`. Common questions: "Can I use this for a SaaS?" (Extended/Commercial license),
"Is it white-label?" (yes), "Are push notifications included?" (yes, with your Firebase/APNs config).
