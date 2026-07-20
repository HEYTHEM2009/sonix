# Why Buy Sonix?

**The complete, production-grade Instagram-style social app — backend, mobile, and admin — in one package.**

Sonix is a full-stack social networking template that ships with everything a modern social app needs: short-video reels, stories, live chat with realtime presence, feeds, discovery, moderation, and analytics. It is built on a battle-tested stack (Laravel 13 + React Native/Expo SDK 57) and has passed a rigorous pre-sale commercial security & quality audit.

---

## What you get

### 📱 Mobile app (React Native + Expo SDK 57, React 19)
- Reels feed with native video playback (`expo-video`), double-tap like, comments, shares, saves
- Stories with viewers, replies, and highlights
- 1:1 + group chat with **realtime typing indicators, presence, and read receipts** (Reverb + Redis)
- Explore / discovery, hashtag search, user search, trending
- Push notifications (Expo Notifications)
- Offline message queue that auto-flushes on reconnect
- Premium (PRO) gating with in-app upgrade flows
- 2FA (TOTP-style code) and email verification flows wired in
- A polished, animated 3D glassmorphism UI (respects reduced-motion)

### 🖥 Backend API (Laravel 13, PHP 8.3+)
- 24 API resource controllers, 43 Eloquent models, 10 services
- Sanctum-authenticated REST API
- Admin panel: dashboard analytics, user management (ban/unban), content moderation, reports, bad-word filter, settings
- Reels recommendation engine (for-you, trending) with analytics scoring
- Media signing for Cloudinary
- Queue/event-driven architecture (broadcasting, events, listeners)

### 🛠 Deploy-ready
- Dockerfile, nginx site config, supervisord config, Railway `railway.json`
- `.env.example` with all required variables documented
- Idempotent migrations; verified `php artisan migrate` clean run
- Code passes Laravel Pint style checks

---

## Why it's worth buying (vs. building from scratch)

| Building from scratch | Buying Sonix |
|----------------------|--------------|
| 3–6 months, $40k–$120k+ in dev cost | One purchase, ship in days |
| Hire frontend + backend + DevOps | Single codebase, documented |
| Reinvent auth, 2FA, realtime, moderation | Already built & audited |
| Discover security holes in production | Pre-hardened: CORS, admin gating, traversal guard, rate-limit |

You get a **secure, audited foundation** — not a toy demo. The pre-sale audit closed every Critical and High issue (2FA enforcement, email verification, admin authorization, file-traversal protection, transaction safety) before listing.

---

## Security & quality highlights (audited)
- ✅ 2FA enforced server-side before token issuance
- ✅ Email verification with expiring codes
- ✅ Admin routes protected by dedicated middleware (non-admin → 403)
- ✅ Privilege-escalation vector (mass-assignable `role`) closed
- ✅ Account-enumeration-resistant forgot-password
- ✅ File-serving endpoint hardened against directory traversal
- ✅ Realtime connection race condition fixed
- ✅ Backend API: 32/34 endpoints verified (2 false-negatives in the test script, not the app)

---

## Perfect for
- Startups launching a social/MVP quickly
- Agencies delivering client social apps
- Developers learning a real Laravel + React Native architecture
- Side-project builders who want a head start

---

## License & support
- Full source code included (backend + mobile + docs).
- Setup & deployment documentation in `docs/`.
- Buyer configures their own Firebase (`google-services.json`), SMTP, Reverb, and Cloudinary credentials — all documented.

**Sonix — ship your social app this week, not next quarter.**
