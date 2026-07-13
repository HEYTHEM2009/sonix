<p align="center">
  <img src="assets/logo.png" alt="Sonix Logo" width="120" height="120" />
</p>

<h1 align="center">Sonix — Social Media App</h1>

<p align="center">
  Full-stack social media application built with <strong>Laravel 11</strong> (backend API) and <strong>React Native / Expo SDK 57</strong> (mobile app).
</p>

---

## Features

| # | Feature | Status |
|---|---------|--------|
| 1 | Authentication (register, login, logout, password reset) | ✅ |
| 2 | Posts (create, edit, delete, like, bookmark, hashtag) | ✅ |
| 3 | Feed with infinite scroll, stories, and explore page | ✅ |
| 4 | Comments with @mentions and #hashtag highlighting | ✅ |
| 5 | User profiles (follow/unfollow, private accounts, stats) | ✅ |
| 6 | Real-time messaging (1-on-1 chat with text, voice, images) | ✅ |
| 7 | **Group chat** (create groups, add members, group messaging) | ✅ |
| 8 | **Full RTL support** (Arabic + English with auto-direction) | ✅ |
| 9 | Push notifications with preference toggles | ✅ |
| 10 | Notification preferences (6 customizable toggles) | ✅ |
| 11 | Settings screens (blocked users, help, report, terms, privacy) | ✅ |
| 12 | **External post sharing** (native share sheet) | ✅ |
| 13 | **Hashtag feed** (tap #hashtag to see all posts) | ✅ |
| 14 | **@mention autocomplete** in post composer | ✅ |
| 15 | **Explore / Discover page** (trending posts + suggested users) | ✅ |
| 16 | Stories (create, view, react, highlights) | ✅ |
| 17 | Profile customization (bio, avatar, website, private toggle) | ✅ |
| 18 | Search users | ✅ |
| 19 | View profile visitors, badges, and profile templates | ✅ |
| 20 | Bookmark / saved posts | ✅ |

---

## Tech Stack

### Backend
- **Framework**: Laravel 11
- **Database**: PostgreSQL (MySQL compatible)
- **Auth**: Laravel Sanctum (token-based)
- **Storage**: Local / S3-compatible
- **Queue**: Database (sync driver fallback)

### Mobile App
- **Framework**: React Native 0.86 + Expo SDK 57
- **Navigation**: React Navigation 7
- **Language**: JavaScript
- **HTTP Client**: Axios
- **Animations**: React Native Reanimated

---

## Requirements

### Backend
- PHP 8.2+
- Composer 2.x
- PostgreSQL 15+ (or MySQL 8+)
- Redis (optional — falls back gracefully)

### Mobile App
- Node.js 20+
- npm or yarn
- Expo CLI
- Android Studio or Xcode (for native builds)

---

## Installation

### 1. Backend Setup

```bash
cd laravel-backend
composer install
cp .env.example .env
php artisan key:generate
```

Configure your database in `.env`:

```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=sonix
DB_USERNAME=postgres
DB_PASSWORD=secret
```

Run migrations and seed test data:

```bash
php artisan migrate
php artisan db:seed --class=TestUserSeeder
```

Start the development server:

```bash
php artisan serve
```

### 2. Mobile App Setup

```bash
cd expo-app
npm install
```

Create `expo-app/.env`:

```
API_URL=http://192.168.x.x:8000/api
```

Start Expo:

```bash
npx expo start
```

Scan the QR code with Expo Go (Android) or run on an emulator.

---

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/register` | No | Create account |
| POST | `/api/login` | No | Login |
| POST | `/api/logout` | Yes | Logout |
| POST | `/api/forgot-password` | No | Send reset code |
| POST | `/api/reset-password` | No | Verify + reset |

### Posts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/posts` | Yes | Feed posts |
| POST | `/api/posts` | Yes | Create post |
| GET | `/api/posts/{id}` | Yes | Single post |
| PUT | `/api/posts/{id}` | Yes | Edit post |
| DELETE | `/api/posts/{id}` | Yes | Delete post |
| GET | `/api/posts/user/{id}` | Yes | User's posts |
| GET | `/api/posts/hashtag/{tag}` | Yes | Posts by hashtag |

### Likes / Bookmarks
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/likes` | Yes | Toggle like |
| GET | `/api/posts/{id}/likes` | Yes | Like list |
| POST | `/api/bookmarks` | Yes | Toggle bookmark |
| GET | `/api/bookmarks` | Yes | Saved posts |

### Comments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/posts/{id}/comments` | Yes | Get comments |
| POST | `/api/posts/{id}/comments` | Yes | Add comment |
| DELETE | `/api/comments/{id}` | Yes | Delete comment |

### Follow
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/follow` | Yes | Follow/unfollow |
| GET | `/api/follow/{id}/status` | Yes | Follow status |
| GET | `/api/follow/requests` | Yes | Pending requests |
| POST | `/api/follow/approve/{id}` | Yes | Approve request |
| POST | `/api/follow/reject/{id}` | Yes | Reject request |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/{id}` | Yes | Profile (ID or username) |
| GET | `/api/users/{id}/stats` | Yes | User stats |
| PUT | `/api/users/profile` | Yes | Update profile |
| POST | `/api/users/toggle-privacy` | Yes | Toggle private |
| GET | `/api/users/search` | Yes | Search users |

### Messages (1-on-1)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/messages/conversations` | Yes | Conversation list |
| GET | `/api/messages/{userId}` | Yes | Message history |
| POST | `/api/messages/{userId}` | Yes | Send message |
| DELETE | `/api/messages/{id}` | Yes | Delete message |

### Group Chat
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/groups` | Yes | My groups |
| POST | `/api/groups` | Yes | Create group |
| GET | `/api/groups/{id}` | Yes | Group details |
| POST | `/api/groups/{id}/members` | Yes | Add members |
| DELETE | `/api/groups/{id}/members/{userId}` | Yes | Remove member |
| POST | `/api/groups/{id}/messages` | Yes | Send message |
| GET | `/api/groups/{id}/messages` | Yes | Group messages |
| DELETE | `/api/groups/{id}` | Yes | Delete group |

### Notifications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | Yes | List notifications |
| PATCH | `/api/notifications/seen` | Yes | Mark all seen |
| PATCH | `/api/notifications/{id}/read` | Yes | Mark read |
| GET | `/api/notifications/preferences` | Yes | Get preferences |
| PUT | `/api/notifications/preferences` | Yes | Update preferences |

### Stories
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/stories` | Yes | Friends stories |
| POST | `/api/stories` | Yes | Create story |
| DELETE | `/api/stories/{id}` | Yes | Delete story |
| POST | `/api/stories/{id}/view` | Yes | Mark viewed |
| POST | `/api/stories/{id}/react` | Yes | React to story |

### Explore
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/explore` | Yes | Trending + suggested |

### Block
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/block` | Yes | Block/unblock |
| GET | `/api/block` | Yes | Blocked users |
| GET | `/api/block/{id}/status` | Yes | Block status |

### Support
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/feedback` | Yes | Submit feedback |
| GET | `/api/help` | No | Help content |
| GET | `/api/privacy` | No | Privacy policy |
| GET | `/api/terms` | No | Terms of service |

---

## Project Structure

```
sonix/
├── laravel-backend/          # Laravel API
│   ├── app/
│   │   ├── Console/Commands/   # Custom artisan commands
│   │   ├── Events/             # Event classes
│   │   ├── Exceptions/         # Exception handlers
│   │   ├── Helpers/            # Utility helpers
│   │   ├── Http/Controllers/   # API controllers
│   │   ├── Models/             # Eloquent models
│   │   └── Services/           # Business logic services
│   ├── config/                 # Configuration files
│   ├── database/migrations/    # Database migrations
│   ├── routes/                 # Route definitions
│   └── storage/                # File storage
│
├── expo-app/                  # React Native / Expo app
│   ├── src/
│   │   ├── api/                # API client + helpers
│   │   ├── assets/             # Images, fonts
│   │   ├── components/         # Reusable components
│   │   ├── context/            # React contexts (Auth, Language)
│   │   ├── i18n/               # Translations (EN/AR)
│   │   ├── navigation/         # React Navigation setup
│   │   └── screens/            # All app screens
│   ├── App.js                  # Root component
│   └── app.json                # Expo config
│
└── docs/                      # Documentation
```

---

## Customization

### Changing the App Name

1. Edit `expo-app/app.json` — change `name` and `slug`
2. Edit `expo-app/src/i18n/translations.js` — change `sonix` key

### Color Theme

Edit `expo-app/src/components/Theme.js`:

```js
export const COLORS = {
  primary: "#6C63FF",   // Your brand color
  background: "#0D1117", // Dark bg
  surface: "#161B22",    // Card bg
  // ...
};
```

### Adding a New Language

1. Add translation object in `expo-app/src/i18n/translations.js`
2. Add language to the picker in `expo-app/src/context/LanguageContext.js`
3. Add the language code to `expo-app/app.json` `"locales"` section

---

## Deployment

### Backend (Production)

Recommended providers: **Railway**, **DigitalOcean App Platform**, **RunCloud**, or any VPS.

```bash
# Production-ready commands
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan migrate --force
```

### Mobile App (Store Release)

```bash
cd expo-app
npx expo prebuild
npx expo run:android --variant release  # Android APK/AAB
# or use EAS Build:
npx eas build --platform android --profile production
```

---

## License

All Rights Reserved. This source code is the property of the copyright holder. Distribution, modification, or commercial use without explicit written permission is prohibited.

---

## Support

For technical inquiries or purchase information, please contact the repository owner.
