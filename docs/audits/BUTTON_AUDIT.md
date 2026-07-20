# BUTTON AUDIT — Sonix Mobile App

**Audit date:** 2026-07-19
**Method:** Static inspection of every screen/component + backend route cross-check. No runtime device available (see N1 in FINAL_COMMERCIAL_AUDIT.md), so crashes are inferred from code paths, not reproduced on a device. Every finding cites `file:line`.
**Scope:** 40 screens, 17 components, 5 api modules, 4 contexts, 3 hooks.

Legend: ✅ verified-OK · ⚠️ issue

---

## A. Critical / High buttons that are BROKEN or DANGEROUS

### B-CRIT-1 — Login button breaks for 2FA-enabled users (no handling, corrupts token)
- **Screen:** LoginScreen → `login()` (AuthContext.js:43-50)
- **Button:** "Log In" (LoginScreen.js:57 `await login(email, password)`)
- **Defect:** Backend `login()` now returns `{two_factor_required:true}` with NO `token`/`user` when 2FA is on (AuthController.php:60-76). `login()` does `const { token: t, user: u } = res.data` → both `undefined`, then `AsyncStorage.multiSet([["token", undefined], ...])` and `setUser(undefined)`. No `two_factor_required` branch, no 2FA screen exists in AppNavigator.
- **Severity:** Critical
- **Repro:** Log in with any account where `two_factor_enabled=1`.
- **Fix:** Detect `res.data.two_factor_required`; navigate to a 2FA screen and call `/auth/2fa-login`; only persist token/user after token issuance.
- **Status:** ✅ **FIXED** — `AuthContext.login` returns the flag without persisting; `LoginScreen` branches to new `TwoFactorScreen` → `twoFactorLogin()`; verified live (2FA login → `two_factor_required:1`, no token; normal login → token).
- **Risk:** 2FA users cannot log in; AsyncStorage holds `"token"→undefined` (session corruption).

### B-HIGH-1 — "Forgot Password" → navigates to Login, not Reset (ResetPassword orphaned)
- **Screen:** ForgotPasswordScreen.js:61-66
- **Defect:** After sending code, UI unconditionally `navigation.navigate("Login")`. `ResetPasswordScreen` is registered (AppNavigator:246/254) but **never navigated to from anywhere**. User is told a code was sent but sent back to login with no way to enter it.
- **Severity:** High
- **Fix:** Navigate to `ResetPassword` (pass email); persist reset email.
- **Status:** ✅ **FIXED** (BUG-008) — ForgotPassword → ResetPassword with `{ email }`; ResetPassword prefills email.

### B-HIGH-2 — Notifications items are NOT pressable
- **Screen:** NotificationsScreen.js:48 (renderItem returns `<View>`, no `onPress`)
- **Defect:** Tapping any notification does nothing. Core "tap notification → content" flow is dead.
- **Severity:** High
- **Fix:** Wrap card in `TouchableOpacity`; navigate by `n.type`/`n.notifiable` (post/user/message).
- **Status:** ✅ **FIXED** (BUG-003) — notification rows now `TouchableOpacity` → sender `UserProfile`.

### B-HIGH-3 — Search hashtag navigates to non-existent "ReelsTab" screen
- **Screen:** SearchScreen.js:74 `navigation.navigate("ReelsTab", { screen:"Reels", params:{hashtag:tag} })`
- **Defect:** No `ReelsTab` screen exists in AppNavigator (reels are the `Reels` Tab). This throws "Route 'ReelsTab' not found" → navigation error.
- **Severity:** High
- **Fix:** `navigation.navigate("Reels", { hashtag: tag })`.
- **Status:** ✅ **FIXED** (BUG-002) — `openHashtag` navigates to `Reels` with `{ hashtag }`.

### B-HIGH-4 — Group chat has zero realtime wiring
- **Screen:** GroupChatScreen.js (no `getEcho`/realtime subscription)
- **Defect:** `send()` POSTs and appends optimistically, but no listener for partner messages, typing, read receipts, or presence. Two group members do not see each other live.
- **Severity:** High
- **Fix:** Subscribe to the group broadcast channel + typing channel; reconcile against backend events.
- **Status:** ✅ **FIXED** (BUG-004) — added `GroupMessageSent` event + `groups.{groupId}` private channel + authz; `GroupChatScreen` subscribes and appends remote messages live (verified live: group send 201).

### B-HIGH-5 — ChatScreen never receives `message.read` / `message.delivered`
- **Screen:** ChatScreen.js:468-501
- **Defect:** Subscribes only to `messages.{user.id}` + `typing.{user.id}`. Backend broadcasts `message.read`/`message.delivered` on `messages.{partnerId}`, which ChatScreen never joins. Read-receipt "✓✓" never updates from server.
- **Severity:** High
- **Fix:** Also `listen('messages.'+userId, 'message.read'|'message.delivered', ...)` and patch matching ids. Prefer consuming `useMessages` hook (correct impl, currently unused).
- **Status:** ✅ **FIXED** (BUG-005) — `ChatScreen` realtime now also handles `message.read` and `message.delivered` and patches message state by id.

### B-HIGH-6 — Settings "Activity Status" switch is a fake/inert toggle
- **Screen:** SettingsScreen.js:349-360
- **Defect:** `value={true}`, **no `onValueChange`**, no API, not stored. Tapping does nothing (Switch won't even flip).
- **Severity:** High (misleading control)
- **Fix:** Wire to an endpoint or remove the row.
- **Status:** ✅ **FIXED** (BUG-006) — added `activity_status` column + migration + `toggle-activity-status` endpoint; switch binds to `user.activity_status` and toggles via API (verified live).

### B-HIGH-7 — BlockedUsers "Unblock" reuses block/toggle and ignores response
- **Screen:** BlockedUsersScreen.js:29-38 (`handleUnblock` POST `/block`)
- **Defect:** Uses the same `BlockController@toggle` as block; ignores `res.data.blocked`; filters locally. If toggle misfires, UI wrongly removes/keeps items. No success/error reconciliation.
- **Severity:** High
- **Fix:** Read `res.data.blocked`; only filter when `blocked===false`; restore on error.
- **Status:** ✅ **FIXED** (BUG-007) — unblock now calls `/users/{id}/unblock` and reconciles list from `res.data.blocked === false` (verified live: returns `{blocked:false}`).

---

## B. Medium buttons

| ID | Button | Location | Defect | Fix | Status |
|----|--------|----------|--------|-----|--------|
| B-MED-1 | Followers list rows | FollowersScreen.js:63-74 | Plain `<View>`, not tappable → can't open profile | Wrap in `TouchableOpacity` → `UserProfile` | ✅ FIXED (BUG-009) |
| B-MED-2 | Profile "following" stat | ProfileScreen.js:91-98 | Both followers/following navigate to `Followers` (defaults to followers tab) | Pass `{tab:"following"}` | ✅ FIXED (BUG-010) |
| B-MED-3 | Saved post cells | SavedPostsScreen.js:63 | No `onPress` → saved post can't be opened | Add onPress → post detail | ✅ FIXED (BUG-011) |
| B-MED-4 | Search "audio" rows | SearchScreen.js:117-126 | Plain `<View>`, no onPress | Add handler | ✅ FIXED (BUG-012) |
| B-MED-5 | Offline queue flush on reconnect | ChatScreen.js:354-367 | Flush runs on mount only; `useMessages.flushQueue` unused | Wire `realtime.onStatus` flush | ✅ FIXED (BUG-013) |
| B-MED-6 | Media send failures | ChatScreen.js:569-661 | Voice/document failures leave `pending:true` forever (no rollback/queue) | Mark failed/remove or queue | ✅ FIXED (BUG-014) |
| B-MED-7 | Explore search catch empty | ExploreScreen.js:33-42 | `catch(e){}` swallows errors silently | Show toast | ✅ FIXED (BUG-015) |
| B-MED-8 | Report content tab | ReportProblemScreen.js:94-104 | 3 static rows, no onPress/API (only `feedback` posts) | Implement or relabel | ✅ FIXED (BUG-016) |
| B-MED-9 | CreateStory "Templates/Music/Collage" | CreateStoryScreen.js:329-346 | All three open gallery; no real feature | Implement or relabel | ✅ FIXED (BUG-017) |
| B-MED-10 | Register min-length mismatch | RegisterScreen.js:78 (`<6`) vs backend `min:8` | 6-7 char passwords fail at API | Change to `<8` | ✅ FIXED (BUG-018) |

---

## C. Low buttons

| ID | Location | Defect |
|----|----------|--------|
| B-LOW-1 | CreateStoryScreen.js:323-325 | Dead gear button (`onPress` undefined) |
| B-LOW-2 | ChatScreen.js:673 | "pin" context menu pins conversation, not message (label mismatch) |
| B-LOW-3 | SearchScreen.js:92 | `renderSuggestedUser : renderSuggestedUser` identical ternary (dead branch) |
| B-LOW-4 | SearchScreen.js:91 | `navigation.getParam?.(...)` deprecated in RN v6; self-result navigates to UserProfile not Profile |
| B-LOW-5 | AdminScreen.js:176-184 | `removeContent` assumes `data.reels` shape; minor null-guard gap |
| B-LOW-6 | SharePostScreen.js:41-45 | `Share.share({url})` — Android ignores top-level url (works via message) |
| B-LOW-7 | CameraScreen.js:56 | Video stop path uses `stopRecording()` (returns void) not `recordAsync()` — video stories can't be created | ✅ FIXED (BUG-019) uses `recordAsync().then(upload)` + `stopRecording()` |
| B-LOW-8 | CommentsScreen.js:222 | `onLike={()=>{}}` dead no-op |

---

## D. Verified-OK (not broken) — sampled

- Login/Register/Forgot/Reset navigation targets all exist (no dead nav).
- Feed like/bookmark, post menu edit/delete/report → real routes + rollback.
- UserProfile follow/unfollow/block/message → real routes + guards.
- EditProfile save, change-password, delete-account, privacy toggle, PRO toggle, notification prefs → real routes + loading/error.
- Chat send, read-mark, edit/unsend/delete, typing → real routes + offline queue.
- Reels like/save/share/delete → real routes + optimistic update.
- `expo-video` import (`ReelItem`/`StoryEditor`/`CreateReelScreen`) is **correct** for installed `expo-video ~57.0.0` — NOT a bug (agent uncertainty disproven).
- MessagesScreen realtime `message.sent` / `typing.indicator` channel+event names match backend exactly.

---

## E. Systematic gaps (apply to ALL buttons)
- **No `accessibilityLabel` / `accessibilityRole`** on any `TouchableOpacity` (auth screens' password-eye toggles especially invisible to screen readers).
- **No haptic feedback** on any button (only visual springs).
- **No offline banner**; offline taps fall through to axios 30s timeout → generic error.

---

## Counts
- **Critical: 0** (1 fixed) · **High: 0** (7 fixed) · **Medium: 0** (10 fixed) · **Low: 8** (1 fixed: B-LOW-7; 7 remaining polish/accessibility — out of scope)

> 🟡 Runtime note: no device/emulator available here; fixes verified via Babel/Expo parse + backend live API tests. No device-runtime success asserted where interactive execution is required.
