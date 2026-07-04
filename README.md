# 🚀 Sonix — Full-Stack Social Media Starter Kit

> **Skip months of development.** Ship an Instagram-like social app in under 30 minutes.

Built with **Laravel 11** + **React Native (Expo 56)**. Fully featured, production-ready, and deployable to Railway + EAS Build.

---

## ✨ What You Get

### 🎯 Core Features
- **Auth System** — Register/Login with Laravel Sanctum (token-based)
- **User Profiles** — Avatar, bio, followers/following, private accounts
- **Posts** — Photos, videos, captions, hashtags, likes, comments, bookmarks
- **Stories** — Photos, videos, text-only with drawing, stickers, reactions, highlights
- **Real-time Chat** — WebSocket messaging with typing indicators & online status
- **Push Notifications** — Expo push notification infrastructure

### 🎨 Premium UI
- **3D Floating Tab Bar** — Animated, glassmorphism design
- **Video Backgrounds** — TikTok-style on login/register screens
- **Smooth Transitions** — 60fps animated screen transitions
- **Midnight Luxe Theme** — Dark mode with purple/gold accents

### 🌍 Built-in
- **i18n** — Arabic + English (294+ translation keys, ready for any language)
- **Image Compression** — Server-side GD compression with thumbnails
- **Offline Mode** — Local message cache with AsyncStorage
- **Cursor Pagination** — Efficient infinite scrolling

---

## 📊 By The Numbers

| What | Count |
|------|-------|
| Screens | 24 |
| Components | 7 |
| API Controllers | 13 |
| Database Models | 17 |
| Migrations | 34 |
| API Endpoints | 63+ |
| Translation Keys | 294+ |

---

## ⚡ Quick Start (30 minutes to running)

### Prerequisites
- PHP 8.3+ with PostgreSQL + Redis
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
# DB_DATABASE=social_app
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

# Edit src/api/client.js — set your API URL:
# const API = "http://YOUR_SERVER_IP:5000/api";

npx expo start
```

Open Expo Go on your phone → Scan QR → Done! 🎉

---

## 🚀 Deploy to Production

### Backend → Railway (Free)
1. Push to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add PostgreSQL + Redis plugins
4. Set env variables (see `.env.example`)
5. Railway auto-deploys on every push!

### Frontend → APK (EAS Build)
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```
Download the APK and install on any Android device.

---

## 🗂️ Project Structure

```
sonix/
├── laravel-backend/              # Laravel 11 API
│   ├── app/Http/Controllers/     # 13 API controllers
│   ├── app/Models/               # 17 Eloquent models
│   ├── app/Services/             # ImageService (GD compression)
│   ├── database/migrations/      # 34 migrations
│   ├── database/seeders/         # Sample data seeder
│   └── routes/api.php            # 63+ API routes
│
├── expo-app/                     # React Native (Expo 56)
│   └── src/
│       ├── api/                  # Client, WebSocket, Cache, Notifications
│       ├── components/           # Theme, StoryEditor, 3D effects
│       ├── context/              # AuthContext, LanguageContext
│       ├── i18n/                 # Arabic/English translations
│       ├── navigation/           # AppNavigator with 3D tab bar
│       └── screens/              # 24 screens
│
├── Dockerfile                    # One-click Railway deploy
├── railway.json                  # Railway config
└── eas.json                      # EAS Build profiles
```

---

## 🔧 Customization Guide

### Change API URL
Edit `expo-app/src/api/client.js`:
```javascript
const API = "https://your-domain.com/api";
```

### Change Theme Colors
Edit `expo-app/src/components/Theme.js`:
```javascript
export const COLORS = {
  bg: "#0d0d1a",       // Background
  primary: "#7c6cf7",  // Primary purple
  accent: "#d4a574",   // Gold accent
};
```

### Change Default Language
Edit `expo-app/src/context/LanguageContext.js`:
```javascript
const [lang, setLang] = useState("en"); // "ar" for Arabic
```

### Add New Translations
Edit `expo-app/src/i18n/translations.js` — add keys to `ar` and `en` objects.

---

## 📋 Sample Data (Seeders)

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
| sonix | admin@sonix.app | password123 |
| sara | sara@test.com | password123 |
| omar | omar@test.com | password123 |

---

## 🛡️ Security Notes

- Sanctum token authentication with auto-logout on expiry
- Rate limiting on all mutation endpoints (throttle middleware)
- Server-side image compression (prevents large file uploads)
- Private account toggle with follow request approval
- User blocking system
- Content reporting system

---

## 📄 License

MIT License — Use freely for personal or commercial projects.

---

## 💡 Tips for Selling on Gumroad

1. **Screenshot the app** running on a real device
2. **Record a 30-second demo video** showing key features
3. **Highlight the time saved** — "63+ API endpoints, 24 screens, fully featured"
4. **Emphasize the tech stack** — Laravel + React Native is in high demand
5. **Mention the deployment** — "Deploy to Railway + EAS Build in 30 minutes"

---

Built with ❤️ for the developer community.
