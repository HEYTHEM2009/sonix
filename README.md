# Social Media Starter Kit

**Skip months of development.** Ship an Instagram-like social app in under 30 minutes.

Built with **Laravel 13** + **React Native (Expo SDK 56)**. Fully featured, production-ready, and deployable to Railway + EAS Build.

---

## What You Get

### Core Features
- **Auth System** — Register/Login with Laravel Sanctum (token-based)
- **User Profiles** — Avatar, bio, followers/following, private accounts
- **Posts** — Photos, videos, captions, likes, comments, bookmarks, sharing
- **Stories** — Photos, videos, text-only with drawing, stickers, reactions, highlights, Instagram-style creation screen
- **Real-time Chat** — WebSocket messaging with typing indicators, online status, read receipts, image/voice messages
- **Push Notifications** — Expo push notification infrastructure
- **Cloud Storage** — Cloudinary integration (optional) with local fallback
- **User Search** — Find people, follow/unfollow, follow requests

### Premium UI
- **3D Floating Tab Bar** — Animated, glassmorphism design
- **Video Backgrounds** — TikTok-style on login/register screens
- **Smooth Transitions** — 60fps animated screen transitions
- **Dark Theme** — Modern dark mode with customizable colors
- **Instagram-style Story Creation** — Gallery grid, templates, music, collage options
- **Sound Toggle** — Video sound controls without leaving stories

### Built-in
- **i18n** — Arabic + English (300+ translation keys, ready for any language)
- **Image/Video Upload** — Server-side compression with thumbnails
- **Offline Mode** — Local message cache with AsyncStorage
- **Cursor Pagination** — Efficient infinite scrolling
- **Cloudinary Support** — Persistent file storage across deploys

---

## By The Numbers

| What | Count |
|------|-------|
| Screens | 24 |
| Components | 8 |
| API Controllers | 13 |
| Database Models | 17 |
| Migrations | 34 |
| API Endpoints | 63+ |
| Translation Keys | 300+ |

---

## Quick Start (30 minutes to running)

### Prerequisites
- PHP 8.4+ with PostgreSQL + Redis
- Node.js 18+ with Expo CLI
- Railway account (free tier) + Expo account (free)

### Step 1: Backend

```bash
cd laravel-backend
composer install
cp .env.example .env
php artisan key:generate

# Configure .env with your database:
# DB_CONNECTION=pgsql
# DB_HOST=your-host
# DB_DATABASE=your_database
# DB_USERNAME=your-user
# DB_PASSWORD=your-password

php artisan migrate --force
php artisan db:seed          # Loads sample data (6 users, 10 posts, stories)
php artisan serve --port=5000
```

### Step 2: Frontend

```bash
cd expo-app
npm install

# Create .env file:
echo "EXPO_PUBLIC_API_URL=http://localhost:5000/api" > .env
echo "EXPO_PUBLIC_WS_HOST=localhost" >> .env
echo "EXPO_PUBLIC_REVERB_KEY=your-reverb-key" >> .env

npx expo start
```

Open Expo Go on your phone -> Scan QR -> Done!

---

## Deploy to Production

### Backend -> Railway (Free)
1. Push to GitHub
2. Go to [railway.app](https://railway.app) -> New Project -> Deploy from GitHub
3. Add PostgreSQL + Redis plugins
4. Set env variables (see `.env.example`)
5. Railway auto-deploys on every push!

### Frontend -> APK (EAS Build)
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```
Download the APK and install on any Android device.

### Optional: Cloudinary (Persistent File Storage)
1. Create free account at [cloudinary.com](https://cloudinary.com)
2. Get Cloud Name, API Key, API Secret
3. Add to Railway env vars:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

---

## Project Structure

```
social-platform/
├── laravel-backend/              # Laravel 13 API
│   ├── app/Http/Controllers/     # 13 API controllers
│   ├── app/Models/               # 17 Eloquent models
│   ├── app/Services/             # ImageService, CloudinaryService, StoryCacheService
│   ├── app/Helpers/              # Sanitize, StorageHelper
│   ├── database/migrations/      # 34 migrations
│   ├── database/seeders/         # Sample data seeder
│   └── routes/api.php            # 63+ API routes
│
├── expo-app/                     # React Native (Expo SDK 56)
│   └── src/
│       ├── api/                  # Client, WebSocket, Cache, Media, Notifications
│       ├── components/           # Theme, StoryEditor, 3D effects, VideoBackground
│       ├── context/              # AuthContext, LanguageContext
│       ├── i18n/                 # Arabic/English translations
│       ├── navigation/           # AppNavigator with 3D tab bar
│       └── screens/              # 24 screens
│
├── Dockerfile                    # nginx + php-fpm + supervisor (production)
├── docker-entrypoint.sh          # Auto-generates .env from env vars
├── railway.json                  # Railway config
├── eas.json                      # EAS Build profiles
├── INSTALL.md                    # Detailed installation guide
├── CONFIG.md                     # Environment variables reference
└── CUSTOMIZATION.md              # How to rebrand the app
```

---

## Customization Guide

See `CUSTOMIZATION.md` for detailed instructions on:
- Changing app name, logo, and colors
- Adding new languages
- Changing default users
- Modifying the theme

### Quick Changes

**Change App Name:** Edit `expo-app/app.json` and `.env` → `APP_NAME`

**Change Colors:** Edit `expo-app/src/components/Theme.js`

**Change Logo:** Replace `expo-app/assets/icon.png` and `expo-app/assets/splash.png`

---

## Sample Data (Seeders)

Run `php artisan db:seed` to populate your app with:
- 6 users (admin, sara, omar, nora, alex, lily)
- 10 posts with varied content
- 3 stories
- 10 likes, 5 comments
- Follow relationships
- Bookmarks

**Test credentials:**

| User | Email | Password |
|------|-------|----------|
| admin | admin@example.com | password123 |
| sara | sara@test.com | password123 |
| omar | omar@test.com | password123 |

---

## Documentation

- `INSTALL.md` — Step-by-step installation guide
- `CONFIG.md` — All environment variables explained
- `CUSTOMIZATION.md` — How to rebrand and customize

---

## Security

- Sanctum token authentication with auto-logout on expiry
- Rate limiting on all mutation endpoints
- Server-side image compression (prevents large file uploads)
- Path traversal protection on media endpoints
- Private account toggle with follow request approval
- User blocking system
- Content reporting system
- XSS protection via content sanitization

---

## License

MIT License — Use freely for personal or commercial projects.
