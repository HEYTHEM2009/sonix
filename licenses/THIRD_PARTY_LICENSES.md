# Third-Party Licenses & Attribution — Sonix

Sonix is built on open-source software. This file lists the major dependencies and
their licenses. The Sonix source itself is governed by the root `LICENSE`.

## Backend (PHP / Laravel) — `laravel-backend/composer.json`
| Package | License |
|---------|---------|
| laravel/framework | MIT |
| laravel/reverb | MIT |
| laravel/sanctum | MIT |
| laravel/tinker | MIT |
| intervention/image | MIT |
| phpunit/phpunit (dev) | BSD-3-Clause |
| mockery/mockery (dev) | BSD-3-Clause |
| nunomaduro/collision (dev) | MIT |
| laravel/pint (dev) | MIT |
| fakerphp/faker (dev) | MIT |

## Mobile (React Native / Expo) — `expo-app/package.json`
Key runtime dependencies (MIT / Apache-2.0 unless noted):
- expo (~57) — MIT
- react / react-native (0.86) — MIT
- react-navigation — MIT
- axios — MIT
- @react-navigation/native, /stack, /bottom-tabs — MIT
- react-native-reanimated — MIT
- react-native-gesture-handler — MIT
- expo-video — MIT
- expo-image-picker, expo-media-library, expo-file-system — MIT
- expo-notifications — MIT
- @react-native-async-storage/async-storage — MIT
- react-native-webview — MIT (BSD-ish, MIT licensed)
- react-native-safe-area-context — MIT

> Exact versions and the full transitive tree are resolved by `composer install` and
> `npm install`. Run `composer licenses` and `npx license-checker` in each folder for
> the complete, authoritative list before distribution.

## Assets
All branding assets (logo, splash, illustrations) in `assets/` are original and created
for Sonix. No third-party copyrighted assets, logos, or trademarks are included.

## Trademark notice
Sonix is provided without any rights to the names/trademarks of Instagram, TikTok,
Facebook, or any third party. You are responsible for ensuring your rebranded product
does not infringe third-party rights.
