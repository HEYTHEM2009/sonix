# FAQ — Sonix

**Q: Is Sonix original source?**
A: Yes. 100% original code. No Instagram/TikTok/Facebook assets, logos, or trademarks are included. You may rebrand freely.

**Q: What license applies?**
A: A commercial license (see `LICENSE`). You may build and ship products with it; you may not resell the raw source as a competing starter kit.

**Q: Can I deploy on shared hosting?**
A: Yes. Any PHP 8.3+ host works. Point the web root to `laravel-backend/public`.

**Q: Which database do I need?**
A: PostgreSQL (recommended), MySQL 8+, or SQLite. Configure `DB_CONNECTION` in `.env`.

**Q: Does it need FFmpeg?**
A: Optional. Required only if you transcode video or generate thumbnails server-side. The app also works with client-uploaded thumbnails.

**Q: How do I change the API URL in the app?**
A: Edit `BASE_URL` in `expo-app/src/api/client.js`. For white-label builds, use an environment or build-time constant.

**Q: How do I make myself an admin?**
A: See `docs/ADMIN.md` — set `role='admin'` on your user. An Admin entry then appears in Settings.

**Q: Why is my media URL returning 403?**
A: Anonymous media URLs are signed. Authenticated requests pass automatically. Ensure the app sends the bearer token and that `resolveUrl()` is used for media paths.

**Q: Search returns empty / errors?**
A: The SearchService queries `username`/`bio`, not `name`. Make sure migrations ran (`php artisan migrate --force`). Clear cache if results look stale.

**Q: How do I rebrand (logo, colors, name)?**
A: Replace `assets/logo.png` and update `expo-app/src/components/Theme.js` `COLORS`. See `docs/BRANDING.md`.

**Q: Does it support RTL / Arabic?**
A: Yes. Full RTL + LTR with an i18n layer (`src/i18n/translations.js`). Add languages there.

**Q: Can I use Redis?**
A: Yes. Set `CACHE_DRIVER=redis` and `REDIS_*` env vars.

**Q: Where are the demo accounts?**
A: Seeded: `admin@sonix.app` / `demo@sonix.app` (password `password`). See `docs/INSTALL.md`.

**Q: How do I update the app over the air?**
A: Use `eas update` (Expo EAS). See `docs/DEPLOYMENT.md`.

**Q: Is it production-ready?**
A: Yes — rate limiting, security headers, safe error handling, throttling, signed media, and audit logging are included. Follow the production security checklist in `docs/DEPLOYMENT.md`.
