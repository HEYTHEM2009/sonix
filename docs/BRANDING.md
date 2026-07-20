# Sonix Brand Kit

Sonix ships with a clean, original brand identity. Everything below is **100% original** — no third-party logos, trademarks, or copyrighted assets are included.

## Logo
- `assets/logo.svg` — primary mark (gradient rounded square + play glyph).
- `expo-app/assets/icon.png` — app icon (512×512).
- `expo-app/assets/splash.png` — launch splash.

The mark combines a gradient tile (amethyst → gold) with a play triangle, symbolising short-form video.

## Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` (Amethyst) | `#7c6cf7` | Primary actions, links, active states |
| `primaryLight` | `#a99cf8` | Hover / secondary accents |
| `accent` (Gold) | `#d4a574` | Premium highlights, gradients |
| `accentLight` | `#e8c89a` | Soft gold surfaces |
| `bg` (Deep Space) | `#0d0d1a` | App background |
| `card` | `#1a1a2e` | Cards, sheets |
| `success` | `#4ade80` | Positive actions |
| `warning` | `#fbbf24` | Cautions |
| `danger` | `#f87171` | Destructive actions |

All colors live in `expo-app/src/components/Theme.js` (`COLORS`). Edit there to re-skin the whole app.

## Typography
- System font stack by default (RN default).
- Headings use weight 700–800; body 400–600.
- Arabic (RTL) is fully supported via the i18n layer.

## Rebranding Steps
1. Replace `assets/logo.svg`, `expo-app/assets/icon.png`, `expo-app/assets/splash.png` with your own (keep dimensions).
2. Update `COLORS` in `expo-app/src/components/Theme.js`.
3. Change the app name in `expo-app/app.json` (`expo.name`, `expo.slug`).
4. Update the product name in `laravel-backend/.env` (`APP_NAME`).
5. Replace marketing copy in `docs/` and store listings.

## Store listing assets
Generate screenshots from the running app (Onboarding, Feed, Reels, Search, Admin). Use the provided color palette for backgrounds.

## Do / Don't
- ✅ Recolor, rename, and redistribute your rebranded build.
- ❌ Keep the "Sonix" name/trademark in a public competitor product without rebranding.
- ❌ Introduce third-party brand assets (Instagram, TikTok, etc.).
