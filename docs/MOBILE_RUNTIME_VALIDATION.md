# Mobile Runtime Validation — Phase 1 (1:1 Messaging)

**Project:** Sonix (React Native / Expo SDK 57 mobile app + Laravel 13 REST API)
**Scope:** Static verification of the Expo app's Phase 1 messaging implementation, plus an explicit statement on runtime validation status.
**Date:** 2026-07-19
**Validation mode:** Static analysis (parse, import resolution, config, manifests, UI wiring). **No device/emulator runtime was available on the build machine** — runtime execution is marked 🟡 *Pending Runtime Validation* per project directive (never fabricate runtime success).

---

## 1. Environment / Tooling used

| Check | Tool | Result |
|---|---|---|
| JS/JSX syntax + Babel transform | `@babel/core` with project `babel.config.js` (`babel-preset-expo` + `react-native-reanimated/plugin`) | 79/79 source files parsed, **0 errors** |
| Import resolution (messaging files) | Custom resolver vs `node_modules` + `src/` | 0 missing imports |
| Expo config / permissions / plugins | `app.json` inspection | Present & valid |
| Native dependency presence | `node_modules` + `package.json` inspection | Required deps present |
| UI/realtime wiring | Source grep of `ChatScreen`, `MessagesScreen`, `useMessages`, `realtime` | Correctly wired |

---

## 2. Per-feature static verification

Legend: ✅ Static-valid · 🟡 Runtime required (could not execute on device) · ❌ Failed

| # | Phase 1 Feature | Static Result | Notes |
|---|---|---|---|
| 1 | Send text message | ✅ Static-valid | `ChatScreen` → `POST /messages`; payload shape matches `MessageController::send` |
| 2 | Receive message (realtime) | ✅ Static-valid | `useMessages`/`MessagesScreen` → `realtime.listen('messages.{id}','message.sent')` → `private-messages.{id}` |
| 3 | Delivered receipt | ✅ Static-valid | Listener on `message.delivered` updates `delivered` flag |
| 4 | Read receipt | ✅ Static-valid | Listener on `message.read` updates `is_read`; backend now broadcasts it (see findings) |
| 5 | Typing indicator | ✅ Static-valid | `useMessages` now subscribes `typing.{id}` → `typing.indicator` (fixed during cert) |
| 6 | Online presence | ✅ Static-valid | `POST /messages/online` endpoint + `updateOnline` handler present |
| 7 | Reactions (add/remove) | ✅ Static-valid | `ChatScreen` calls `/messages/{id}/react`; `MessageReaction` model present |
| 8 | Edit message | ✅ Static-valid | `PUT /messages/{id}`; controller + service present |
| 9 | Star / Save toggle | ✅ Static-valid | `ConversationSetting` model + endpoints present |
| 10 | Pin conversation | ✅ Static-valid | `message pin toggle` endpoint present |
| 11 | Draft save / get | ✅ Static-valid | `MessageDraft` model + `/messages/{userId}/draft` GET/POST present |
| 12 | Search in conversation | ✅ Static-valid | `/messages/{userId}/search` present |
| 13 | Forward message | ✅ Static-valid | `/messages/{id}/forward` present |
| 14 | Media upload (image) | ✅ Static-valid | `expo-image-picker` + `StorageHelper`; endpoint returns 201 in API cert |
| 15 | Media upload (document) | ✅ Static-valid | `expo-document-picker` installed; endpoint returns 201 in API cert |
| 16 | Media upload (voice) | ✅ Static-valid | `expo-audio` present; same `StorageHelper` path as image/document |
| 17 | Conversations list | ✅ Static-valid | `MessagesScreen` → `/messages/conversations`; unread badges wired |
| 18 | Unread count | ✅ Static-valid | `/messages/unread` consumed in `MessagesScreen` |
| 19 | Block / Unblock | ✅ Static-valid | `/users/{userId}/block|unblock`; `BlockedUser` model (UTF-16 bug fixed) |
| 20 | Delete for me | ✅ Static-valid | `DELETE /messages/{id}/for-me`; `deleted_for` JSON array |
| 21 | Delete for everyone | ✅ Static-valid | `DELETE /messages/{id}`; `is_deleted` flag |
| 22 | Push/In-app notifications | 🟡 Runtime required | `expo-notifications` plugin configured; notification channel `private-notifications.{id}` exists backend-side. Delivery to a real device/token not testable here. |
| 23 | Realtime connection (Echo/Reverb) | ✅ Static-valid | `realtime.js` builds `Echo({broadcaster:'pusher'})`; **authEndpoint fixed** to `/broadcasting/auth` |
| 24 | Offline queue / cache | ✅ Static-valid | `src/api/cache.js` import + `addToOfflineQueue` referenced in `useMessages` |
| 25 | Navigation into chat | ✅ Static-valid | `AppNavigator` references `ChatScreen`/`MessagesScreen`; no broken imports |

---

## 3. Findings discovered & fixed during certification

| ID | Severity | Issue | Fix | Status |
|---|---|---|---|---|
| F1 | 🔴 Critical | `realtime.js` used `authEndpoint: ${IMAGE_BASE}/api/broadcasting/auth` but Laravel registers the route at `/broadcasting/auth` (no `/api`). Private-channel subscription returned **404 → mobile could never subscribe to `messages.{id}` → zero realtime delivery.** | Changed to `${IMAGE_BASE}/broadcasting/auth`. | ✅ Fixed |
| F2 | 🔴 High | `MessageController::markAsRead` bulk-updated `is_read` but **never broadcast `MessageRead`** → sender never received a read receipt in realtime. | Now broadcasts `MessageRead` (respecting `privacy_read_receipts`). | ✅ Fixed |
| F3 | 🟠 Medium | Mobile app **never subscribed to `typing.{id}`** and had no typing-indicator handler → typing realtime was dead on the client. | Added `typing.indicator` listener in `useMessages` with 4s auto-clear. | ✅ Fixed |
| F4 | 🔴 Critical | `MessageService` broadcast calls used `->toOthers()`; the server-side (no Echo socket) caused the queued `BroadcastEvent` to be skipped → **0 realtime events delivered.** | Removed `->toOthers()` from `MessageSent`/`NotificationCreated`/`MessageDelivered`/`MessageRead`. | ✅ Fixed (earlier) |
| F5 | 🟠 Medium | `app/Models/BlockedUser.php` was UTF-16 LE encoded → PHP couldn't parse the class → "Class not found" on every send. | Rewrote as UTF-8 no-BOM. | ✅ Fixed (earlier) |
| F6 | 🟠 Medium | `Message` model lacked `deleted_for` cast → "Array to string conversion" on insert. | Added `'deleted_for' => 'array'` to `$casts`. | ✅ Fixed (earlier) |

---

## 4. Runtime validation status

| Component | Status | Evidence |
|---|---|---|
| Backend API (25 features, HTTP) | 🟢 **Passed** | `api_harness.js` → 25/25 (incl. corrected media upload 201) |
| Backend Realtime (WS delivery) | 🟢 **Passed** | `rt_harness.js` → `message.sent`/`message.delivered`/`message.read`/`typing.indicator` all received by correct channels |
| Mobile app on device/emulator | 🟡 **Pending Runtime Validation** | No Android SDK / iOS Simulator / physical device on the build host. Cannot launch Expo app. |
| Mobile static correctness | 🟢 **Passed** | 79/79 files parse, 0 missing imports, config/permissions valid, UI/realtime wiring verified. |

**Explicit non-claim:** We do **not** claim the mobile app was run on a device. Items marked 🟡 must be validated on a real device/emulator (Expo Go or EAS build) before production sign-off. The static layer strongly indicates correctness because the same WebSocket contracts verified end-to-end on the backend (channel names, event names, auth endpoint) now match exactly what the app code uses.

---

## 5. Required before production (mobile runtime)

1. `eas build` / `expo run:android` on a physical device or emulator.
2. Confirm `expo-notifications` token registration + push delivery (F1–F3 backend paths are proven; device token path is not).
3. Verify typing bubble renders and auto-clears in `ChatScreen`.
4. Verify read/delivered ticks update live in `ChatScreen`.
5. Confirm offline send queue flushes on reconnect (logic present; needs device network toggle test).

---

*Generated by the Production Certification workflow. Companion doc: `PHASE_1_PRODUCTION_CERTIFICATION.md`.*
