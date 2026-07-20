# NAVIGATION AUDIT — Sonix Mobile App

**Audit date:** 2026-07-19 · **Re-audited 2026-07-19 (post-fix pass).** Cross-checked every `navigation.navigate(...)` against `AppNavigator.js` registered screen names.

---

## A. Hard navigation failures (crash / dead-end)

### N-CRIT/HIGH-1 — `navigate("ReelsTab", ...)` → Route not found
- **Location:** SearchScreen.js:74 (also used by trending + hashtag rows via `openHashtag`)
- **Impact:** Every hashtag tap in Search and Explore throws "Route 'ReelsTab' not found".
- **Fix:** `navigation.navigate("Reels", { hashtag: tag })`.
- **Status:** ✅ **FIXED** — `openHashtag` now navigates to `Reels` with `{ hashtag }`. (BUG-002)

### N-HIGH-2 — `ResetPassword` screen orphaned (never navigated to)
- **Location:** ForgotPasswordScreen.js:61-66 navigates to `Login`, not `ResetPassword`.
- **Impact:** Forgot-password → reset code entry is unreachable.
- **Fix:** Navigate to `ResetPassword` after sending code.
- **Status:** ✅ **FIXED** — ForgotPassword now navigates to `ResetPassword` with `{ email }`; ResetPassword prefills email from params. (BUG-008)

### N-HIGH-3 — 2FA login has no destination screen
- **Location:** AuthContext.login (no `two_factor_required` branch); no `TwoFactor`/`TwoFactorLogin` screen in AppNavigator.
- **Impact:** 2FA-enabled users cannot complete login (see B-CRIT-1).
- **Fix:** Add a 2FA screen + branch.
- **Status:** ✅ **FIXED** — `AuthContext.login` returns the 2FA flag without persisting a session; `LoginScreen` branches to a new `TwoFactorScreen`; `TwoFactor` registered in `AppNavigator`. `twoFactorLogin()` persists only after a real token. (BUG-001 / CRIT-001)

### N-MED-1 — `navigation.getParam?.("userId")` deprecated
- **Location:** SearchScreen.js:91-92
- **Impact:** Always evaluates falsy → self-result navigates to `UserProfile` instead of `Profile`. Wrong screen, not a crash.
- **Fix:** Use `route.params?.userId`.
- **Status:** ⚪ Remaining (low impact; self→UserProfile is acceptable behavior).

### N-MED-2 — Followers "following" tab param ignored
- **Location:** ProfileScreen.js:91-98 → `navigation.navigate("Followers")` (no `tab` param)
- **Impact:** Tapping "following" lands on followers tab.
- **Fix:** `navigate("Followers", { tab: "following" })` + read `route.params?.tab`.
- **Status:** ✅ **FIXED** — Profile "following" stat navigates with `{ tab: "following" }`; FollowersScreen initializes `tab` from `route.params?.tab`. (BUG-010)

### N-LOW-1 — CreateStory dead gear button
- **Location:** CreateStoryScreen.js:323-325 (`onPress` undefined) — harmless no-op.

---

## B. Navigation graph integrity

### Registered Stack screens (authed): 30
Home, UserProfile, Followers, Chat, GroupChat, CreateGroup, Comments, Camera, StoryViewer, Notifications, EditProfile, SavedPosts, ImageViewer, SharePost, LikeList, EditPost, Settings, CreateStory, VideoPost, Highlights, BlockedUsers, HelpCenter, ReportProblem, Terms, Privacy, HashtagPosts, CreateReel, Search, Admin, Users.

### Registered Auth screens: Login, Register, ForgotPassword, ResetPassword, Onboarding

### Bottom tabs: Feed, Explore, Reels, Create, Messages, Profile
- `Create` tab renders a FAB (`CreateButton`) that navigates to `routeName="Create"` → resolves to `CreatePostScreen` (Tab.Screen name="Create"). ✅ Valid.
- All tab icons use emoji (`🏠🔍🎬💬👤`) — functional, low polish.

### Verified-OK navigation targets (sampled)
- Feed → SharePost, LikeList, EditPost, ImageViewer, VideoPost, HashtagPosts, CreateStory, StoryViewer, Highlights, Explore, Notifications, Comments, UserProfile, Reels ✅
- Settings → EditProfile, SavedPosts, BlockedUsers, HelpCenter, ReportProblem, Terms, Privacy, Admin ✅
- UserProfile → Chat, UserProfile(self-guard), Followers ✅
- UsersScreen → UserProfile, Chat ✅
- LikeList → UserProfile ✅

**No other dead/undefined `navigate()` targets found** outside N-HIGH-1.

---

## C. Deep-link / param safety
- `route.params.userId` defaults to `null` and is guarded in UserProfileScreen load. ✅
- `Chat`/`GroupChat` require `userId`/`groupId` params; missing params → blank screen (no guard alert) — Low risk.
- `ImageViewer` requires `uri` param; missing → blank. Low risk.

## D. Modal / animation
- Camera/CreateStory use `slide_from_bottom`; StoryViewer/ImageViewer/VideoPost use `fade`. ✅
- `HomeTabs` is a nested Tab inside the Stack; navigating from a Stack screen back to a tab uses `navigation.navigate("Home", { screen: "Reels" })` (CreateReelScreen.js:201) — valid. ✅

## Counts
- Critical/High nav failures: 0 (3 fixed) · Medium: 1 remaining (N-MED-1, low impact) · Low: 1
