# Deployment Guide — Sonix

Deploy the Laravel API to any PHP host and ship the Expo app to Google Play / App Store.

## Backend Deployment

### Option A — Traditional VPS / Shared Hosting (Laravel Forge, Ploi, cPanel)
1. Push `laravel-backend` to your server.
2. Run `composer install --no-dev --optimize-autoloader`.
3. `cp .env.example .env && php artisan key:generate`.
4. Set `APP_ENV=production`, `APP_DEBUG=false`.
5. `php artisan migrate --force`.
6. Configure your web server root to `public/` (see `nginx-site.conf` in repo root).
7. Set up a cron for Laravel scheduler if needed:
   ```
   * * * * * cd /path/to/laravel-backend && php artisan schedule:run >> /dev/null 2>&1
   ```

### Option B — Docker
The repo includes `laravel-backend/Dockerfile`, `docker/docker-entrypoint.sh`, `docker/nginx-site.conf`, `docker/supervisord.conf`, and a root `docker-compose.yml` (API + Postgres + Redis + Reverb).
```bash
# Full stack (db + redis + api + reverb) with compose
docker compose up -d --build

# Or build/run the API image alone
docker build -t sonix-api laravel-backend
docker run -p 8000:80 -e DB_HOST=... sonix-api
```
The container runs nginx + PHP-FPM + the Laravel scheduler via supervisord and auto-runs migrations on boot.

### Option C — Railway / Render / Heroku
- Use `laravel-backend/railway.json` (already present) for Railway.
- Set env vars from `.env.example`.
- Build command: `composer install --no-dev -o`
- Start command: `docker-entrypoint.sh` (Dockerfile deploy) or `php artisan serve --host=0.0.0.0 --port=$PORT`.

### Media storage in production
- Default: local `storage/app/public` (run `php artisan storage:link`).
- Recommended: S3 / Cloudinary / MinIO. Configure `FILESYSTEM_DISK` and the relevant keys in `.env`.

### Security checklist for production
- [ ] `APP_DEBUG=false`
- [ ] `APP_KEY` generated and secret
- [ ] HTTPS enforced (SSL terminate at proxy)
- [ ] Rate limiting enabled (built-in `throttleApi`)
- [ ] Security headers + anti-scraping middleware active (already registered)
- [ ] Database backups scheduled
- [ ] `storage/logs` writable and rotated

## Mobile Deployment (Expo)

### Expo EAS Build
```bash
cd expo-app
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android
eas build --platform ios
```

`eas.json` is preconfigured for your EAS project (update `owner`/`projectId` in `app.json` and `eas.json`).

### Update API base URL
Set `BASE_URL` in `src/api/client.js` to your deployed API (e.g. `https://api.yourdomain.com/api`). Use an environment-config or build-time variable for white-labeling.

### Store listing assets
- App icon, splash, and screenshots are generated under `assets/`. See `docs/BRANDING.md`.
- Prepare privacy policy + terms URLs for store submission.

### Over-the-air updates
```bash
eas update --branch production --message "release"
```

## Scaling notes
- Use Redis for cache/session/queue.
- Put the API behind a CDN for media.
- Use a managed Postgres (Neon / Supabase / Railway).
- Horizontal scale API behind a load balancer; media on shared object storage.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `500` on every request after deploy | `APP_KEY` empty or `APP_DEBUG=false` hiding error | Run `php artisan key:generate`; check `storage/logs/laravel.log` |
| Migrations fail with `connection refused` | Wrong `DB_HOST`/`DB_PORT` | For Docker use service name (`db:5432`); for localhost use `127.0.0.1:5432` |
| Realtime not working | Reverb not running or wrong `REVERB_*` config | Start `php artisan reverb:start`; match `REVERB_APP_KEY` in app and server |
| Media/images 403 or broken | Storage symlink missing | Run `php artisan storage:link`; ensure `FILESYSTEM_DISK` matches host |
| CORS errors from the app | `CORS_ALLOWED_ORIGIN` too strict | Set to your API origin(s), comma-separated (avoid `*` in production) |
| Email reset never arrives | `MAIL_*` misconfigured | Use a real SMTP or a transactional provider; test with `php artisan tinker` + `Mail::raw(...)` |
| Push notifications don't fire | `google-services.json` / APNs not configured | Add Firebase config for Android and APNs cert for iOS (buyer-side) |
| `Class not found` after pull | Autoloader stale | `composer dump-autoload -o` and `php artisan config:clear` |
| Seeder says "Already seeded" | Previous seed present | Truncate tables or remove the guard in `DatabaseSeeder` |

## Upgrade guide

To upgrade an existing Sonix installation to a new release:

1. **Backup** the database and `.env`:
   ```bash
   php artisan db:backup  # or use your managed DB snapshot
   cp .env .env.backup
   ```
2. **Pull** the new code and install dependencies:
   ```bash
   git pull
   composer install --no-dev -o
   cd ../expo-app && npm install && cd ../laravel-backend
   ```
3. **Run** migrations (always non-destructive forward-only):
   ```bash
   php artisan migrate --force
   ```
4. **Rebuild caches**:
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```
5. **Re-seed demo data only if fresh** (seeders are idempotent / guarded):
   ```bash
   php artisan db:seed --force
   ```
6. **Rebuild the mobile app** with the new `BASE_URL` and submit an EAS update:
   ```bash
   eas update --branch production --message "upgrade to vX.Y.Z"
   ```
7. **Verify**: open the app, log in with a demo account, and confirm feed/chat/reels load.

> Never edit core files directly if you plan to upgrade — use child themes / config overrides so your changes survive updates.
