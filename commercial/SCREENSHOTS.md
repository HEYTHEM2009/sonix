# Store Screenshots — Capture Checklist

Generate these 7 screenshots with Expo for your marketplace listing.
Run the app with `npx expo start` (or build a preview APK via EAS) and capture each.

| # | Screen | How to reach | Notes |
|---|--------|-------------|-------|
| 1 | Onboarding | First launch (clear AsyncStorage `onboarded`) | Swipe through 5 pages |
| 2 | Home Feed | Login → Home tab | Show a post with image |
| 3 | Reels (For You) | Reels tab | Vertical video, sidebar actions |
| 4 | Reels (Featured) | Reels tab → Featured | Curated feed |
| 5 | Search | Search tab | Type a term, show users + hashtags + audio |
| 6 | Create Reel | Reels → camera 📷 → capture → details | Show music picker + Publish/Draft/Schedule |
| 7 | Admin | Login as `admin@sonix.app` → Settings → Admin | Dashboard stats |
| 8 | Profile/Settings | Profile → Settings | Pro toggle, language (AR/RTL) |

## Device frames
- Use `expo` + a phone frame, or screenshot on a real device.
- Recommended size: 1170×2532 (iPhone) or 1080×2340 (Android).
- Keep it clean: no debug overlays, `APP_DEBUG=false`.

## Demo credentials (put in listing or private docs)
- User: `demo@sonix.app` / `password`
- Admin: `admin@sonix.app` / `password`

## Brand assets
- Logo source: `assets/logo.svg` (original gradient play mark)
- Colors & fonts: `docs/BRANDING.md`
- App icons: `expo-app/assets/icon.png`, `splash.png`
