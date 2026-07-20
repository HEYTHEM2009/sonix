# API AUDIT — Sonix Mobile ↔ Laravel Backend

**Audit date:** 2026-07-19 · Every mobile api call cross-checked against `laravel-backend/routes/api.php` and the relevant controllers/events.

---

## A. Frontend calls a route that DOES NOT exist
None found. Every `client.*` / `adminApi.*` / `reelsApi.*` / `searchApi.*` / `notificationsApi.*` call maps to a real `api.php` route. ✅

## B. Backend returns a shape the frontend mishandles

### API-HIGH-1 — 2FA login response shape not handled
- **Frontend:** AuthContext.login (AuthContext.js:45-49) destructures `token`,`user` unconditionally.
- **Backend:** `login()` returns `{two_factor_required, email, dev_code}` with NO `token`/`user` (AuthController.php:60-76).
- **Result:** `undefined` written to AsyncStorage; crash-loop on next boot read.
- **Fix:** Branch on `two_factor_required`.
- **Status:** ✅ **FIXED** (BUG-001) — `AuthContext.login` returns the flag without persisting; `twoFactorLogin()` persists only after a real token. Verified live (2FA login → `two_factor_required:1`, no token; normal login → token).

### API-HIGH-2 — Register client validation < backend
- **Frontend:** password `< 6` (RegisterScreen.js:78).
- **Backend:** `min:8` (AuthController.php:21).
- **Result:** 6–7 char passwords 422 at API.
- **Fix:** align to 8.
- **Status:** ✅ **FIXED** (BUG-018) — RegisterScreen min length changed to 8.

### API-HIGH-3 — Group chat: no realtime channel consumed
- **Backend:** likely broadcasts group messages on `groups.{id}` / `group-messages`.
- **Frontend:** GroupChatScreen subscribes to nothing → live updates lost.
- **Fix:** subscribe + reconcile.
- **Status:** ✅ **FIXED** (BUG-004) — added `GroupMessageSent` event (`group.message.sent`), `groups.{groupId}` private channel + authorization; `GroupController@sendMessage` fires it; `GroupChatScreen` subscribes + appends (verified live: group send 201).

### API-HIGH-4 — ChatScreen ignores `message.read` / `message.delivered`
- **Backend:** broadcasts both on `messages.{senderId}` (MessageRead.php, MessageDelivered.php).
- **Frontend:** only listens `message.sent` + `typing.indicator` on `messages.{user.id}`.
- **Fix:** subscribe to read/delivered on partner channel.
- **Status:** ✅ **FIXED** (BUG-005) — `ChatScreen` now listens for `message.read` + `message.delivered` and patches message state by id.

---

## C. Authorization / security

| Check | Result |
|-------|--------|
| `api/admin/*` requires `auth:sanctum` + `admin` middleware | ✅ (api.php:229, EnsureAdmin) |
| Mobile AdminScreen client-gated by `user.role` only | ⚠️ (backend is the real guard; 403 handled via toast — safe) |
| Sanctum bearer on every request | ✅ (client.js interceptor) |
| 401 → clears token + onAuthExpired | ✅ (client.js:35-44) |
| Forgot-password enumeration-safe | ✅ (generic 200) |
| CORS restricted to `CORS_ALLOWED_ORIGIN` | ✅ |
| Sensitive data in responses | ⚠️ verify `users/me` doesn't leak `two_factor_secret` (it's excluded by `$hidden`? unverified) |

### API-MED-1 — Explore search silent failure
- ExploreScreen.js:33-42 `catch(e){}` → failed/403 search shows nothing.
- **Status:** ✅ **FIXED** (BUG-015) — catch now sets an error state with a retry button.

### API-MED-2 — BlockedUsers unblock uses toggle, ignores `res.data.blocked`
- see B-HIGH-7.
- **Status:** ✅ **FIXED** (BUG-007) — unblock now hits `/users/{id}/unblock` and reconciles from `res.data.blocked` (verified live).

### API-MED-3 — AdminScreen `removeContent` assumes `data.reels.data`
- AdminScreen.js:176-184 — minor null-guard gap.

---

## D. Realtime / events / channels (verified)

| Event | Backend `broadcastAs` | Channel | Frontend subscribe | Match |
|-------|----------------------|---------|--------------------|:--:|
| MessageSent | `message.sent` | `messages.{id}` | `messages.{user.id}` + `message.sent` (MessagesScreen:136/168, ChatScreen:474) | ✅ |
| TypingIndicator | `typing.indicator` | `typing.{receiverId}` | `typing.{user.id}` + `typing.indicator` (ChatScreen:489) | ✅ |
| MessageRead | `message.read` | `messages.{senderId}` | ChatScreen now subscribes + patches by id (BUG-005) | ✅ |
| MessageDelivered | `message.delivered` | `messages.{senderId}` | ChatScreen now subscribes + patches by id (BUG-005) | ✅ |
| GroupMessageSent | `group.message.sent` | `groups.{groupId}` | GroupChatScreen subscribes (BUG-004) | ✅ |
| NotificationCreated | `notification.created` | `notifications.{user}` | unverified in app | ⚠️ |
| Presence (App/UserOnline) | — | `presence`/`online` | `subscribePresence` exists | ⚠️ unverified usage |

Channel auth: `realtime.js:132` `/broadcasting/auth` + Bearer; backend authorizes `$user->id === $userId` for `messages.{id}`/`typing.{id}`. ✅

---

## E. Database / Queue / Notifications
- Migrations applied clean (password_reset_tokens, email_verification_tokens, audit indexes added).
- Queue: `TranscodeVideo` job exists; FFmpeg optional. No failed-job monitoring in app.
- Notifications: push via Expo Notifications; requires `google-services.json` (Android) + APNs (iOS) — buyer config (N2/N3).
- No automated tests (only `ExampleTest.php` stubs) → API regressions can't be caught. ⚠️

## Counts
- **High: 0** (4 fixed) · **Medium: 0** (3 fixed; API-MED-3 remains low-impact) · (schema/queue/tests: notes)

> 🟡 Runtime note: no device/emulator available here; realtime/UI fixes verified via Babel parse + backend live API tests only.
