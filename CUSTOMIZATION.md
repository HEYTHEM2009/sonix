# Customization Guide

## Quick Customization (5 minutes)

### 1. Change App Name

**Frontend:**
- Edit `expo-app/app.json` → `name`, `slug`, `bundleIdentifier`, `package`
- Edit `expo-app/src/i18n/translations.js` → `sonix` and `appVersion` keys

**Backend:**
- Edit `.env` → `APP_NAME=YourAppName`
- Edit `.env` → `MEDIA_WATERMARK_TEXT=YourAppName`

### 2. Change Colors

Edit `expo-app/src/components/Theme.js`:

```javascript
export const colors = {
  primary: '#7c6cf7',      // Change this to your brand color
  accent: '#d4a574',       // Change this to your accent color
  background: '#0d0d1a',   // Dark background
  surface: '#1a1a2e',      // Card background
  text: '#ffffff',          // White text
  textSecondary: '#8888aa', // Gray text
  border: '#2a2a4a',       // Border color
  error: '#ff4444',        // Error red
  success: '#44ff44',      // Success green
};
```

### 3. Change Logo

Replace these files with your logo (1024x1024 PNG):
- `expo-app/assets/icon.png` — App icon
- `expo-app/assets/splash.png` — Splash screen

---

## Advanced Customization

### Change Splash Screen Colors

Edit `expo-app/app.json`:
```json
{
  "expo": {
    "splash": {
      "backgroundColor": "#0a0a1a"  // Change to your brand color
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#0D0D1A"  // Change to your brand color
      }
    }
  }
}
```

### Change Login Screen Video

Replace `expo-app/assets/videos/bg-video.mp4` with your own video.

### Change App Store Listing

Edit `expo-app/app.json`:
```json
{
  "expo": {
    "name": "Your App Name",
    "description": "Your app description for store",
    "ios": {
      "bundleIdentifier": "com.yourcompany.app",
      "infoPlist": {
        "NSCameraUsageDescription": "Allow camera access for your app"
      }
    },
    "android": {
      "package": "com.yourcompany.app"
    }
  }
}
```

---

## Backend Customization

### Change Watermark Text

Edit `.env`:
```
MEDIA_WATERMARK_TEXT=YourBrand
MEDIA_WATERMARK_ENABLED=true
```

### Change Cloudinary Folder

The Cloudinary folder is automatically set to your `APP_NAME`. To change it:
```
APP_NAME=your-brand
```

### Change Redis Prefix

The Redis cache prefix is read from config. To change it, edit `laravel-backend/config/cache.php`:
```php
'prefix' => env('CACHE_PREFIX', 'your-app:'),
```

---

## Adding New Languages

Edit `expo-app/src/i18n/translations.js`:

```javascript
const translations = {
  en: { /* English translations */ },
  ar: { /* Arabic translations */ },
  fr: { /* Add French translations */ },
  es: { /* Add Spanish translations */ },
};
```

Then update `expo-app/src/context/LanguageContext.js` to support the new language.

---

## Changing Default Users (Seeder)

Edit `laravel-backend/database/seeders/DatabaseSeeder.php` to change:
- Default usernames
- Default email addresses
- Default passwords
- Sample posts content

---

## Checklist Before Publishing

- [ ] Changed `APP_NAME` in `.env`
- [ ] Changed `APP_URL` to your domain
- [ ] Changed `expo-app/app.json` name/slug/identifiers
- [ ] Changed logo files (icon.png, splash.png)
- [ ] Changed colors in Theme.js
- [ ] Changed translations (app name in translations.js)
- [ ] Changed demo user emails/passwords
- [ ] Set `APP_DEBUG=false` in production
- [ ] Generated new `APP_KEY`
- [ ] Set up Cloudinary for file storage
- [ ] Built new APK with EAS
