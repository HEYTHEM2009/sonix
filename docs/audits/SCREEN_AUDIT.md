# SCREEN AUDIT — Sonix Mobile App

**Audit date:** 2026-07-19 · Static inspection, no device runtime (see FINAL_COMMERCIAL_AUDIT.md N1).

For every screen: opens correctly, navigation, back, header, SafeArea, keyboard, scroll, refresh, empty/error/loading states, dark/light, landscape, small/large screens.

---

## Critical / High screen-level defects

### S-CRIT-1 — 2FA users cannot enter the app (Login → dead end)
- **Screen:** LoginScreen + AuthContext.login (see B-CRIT-1)
- Login flow has no branch for `two_factor_required`. Session state corrupted. **Blocks all 2FA users.**
- **Status:** ✅ **FIXED** — `AuthContext.login` returns the 2FA flag without persisting a session; `LoginScreen` branches to the new `TwoFactorScreen`; `twoFactorLogin()` persists only after a real token. (BUG-001)

### S-HIGH-1 — Notifications screen: items inert
- NotificationsScreen.js:48 — see B-HIGH-2. Tap does nothing.
- **Status:** ✅ **FIXED** — rows are now `TouchableOpacity` → sender `UserProfile`. (BUG-003)

### S-HIGH-2 — Group chat: no live updates
- GroupChatScreen.js — see B-HIGH-4. Screen functions as a local-only log.
- **Status:** ✅ **FIXED** — subscribes to `groups.{groupId}` private channel; remote messages append live. (BUG-004)

### S-HIGH-3 — Search hashtag crash
- SearchScreen.js:74 navigates to `ReelsTab` (nonexistent) → navigation error. Affects trending + hashtag taps app-wide.
- **Status:** ✅ **FIXED** — `openHashtag` navigates to `Reels` with `{ hashtag }`. (BUG-002)

### S-HIGH-4 — Forgot-password flow dead-ends
- ForgotPasswordScreen.js:61-66 → Login instead of ResetPassword; ResetPasswordScreen orphaned.
- **Status:** ✅ **FIXED** — ForgotPassword → ResetPassword with `{ email }`; ResetPassword prefills email. (BUG-008)

---

## Per-screen table

| Screen | Opens | Nav OK | Back | SafeArea | Refresh | Empty | Error | Loading | Notes / Defects |
|--------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|----------------|
| Login | ✅ | ✅ | n/a | ✅ | n/a | ✅ | ✅ | ✅ | 2FA fixed (S-CRIT-1) |
| Register | ✅ | ✅ | ✅ | ✅ | n/a | ✅ | ✅ | ✅ | min 6→8 fixed (B-MED-10/BUG-018) |
| ForgotPassword | ✅ | ✅ | ✅ | ✅ | n/a | ✅ | ✅ | ✅ | → ResetPassword fixed (S-HIGH-4) |
| ResetPassword | ✅ | n/a | ✅ | ✅ | n/a | ✅ | ✅ | ✅ | reachable (prefills email) |
| Onboarding | ✅ | ✅ | n/a | ✅ | n/a | n/a | n/a | n/a | rapid-tap early finish (low) |
| Feed | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | clean |
| Profile | ✅ | ✅ | ✅ | ✅ | n/a | ✅ | ✅ | ✅ | following tab fixed (B-MED-2/BUG-010) |
| UserProfile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | clean |
| Notifications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | items tappable (S-HIGH-1) |
| Followers | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | rows tappable (B-MED-1/BUG-009) |
| Users | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | robust (loading/error/abort) |
| Messages | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | realtime OK |
| Chat | ✅ | ✅ | ✅ | ✅ | n/a | ✅ | ✅ | ✅ | read/delivered realtime fixed (B-HIGH-5/BUG-005); media pending fixed (BUG-014); offline-flush-on-reconnect fixed (BUG-013) |
| GroupChat | ✅ | ✅ | ✅ | ✅ | n/a | ✅ | ✅ | ✅ | realtime fixed (S-HIGH-2/BUG-004) |
| Comments | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | dead onLike noop (low) |
| Camera | ✅ | ✅ | ✅ | ✅ | n/a | n/a | ✅ | ✅ | stopRecording fixed (B-LOW-7/BUG-019) |
| StoryViewer | ✅ | ✅ | ✅ | ✅ | n/a | n/a | ✅ | ✅ | autoplay fixed (BUG-020) |
| EditProfile | ✅ | ✅ | ✅ | ✅ | n/a | n/a | ✅ | ✅ | clean |
| SavedPosts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | cells tappable (B-MED-3/BUG-011) |
| ImageViewer | ✅ | ✅ | ✅ | ✅ | n/a | n/a | n/a | n/a | overlay blocks gesture-zoom (M/low) |
| SharePost | ✅ | ✅ | ✅ | ✅ | n/a | n/a | ✅ | ✅ | per-user loading; Android share url (low) |
| LikeList | ✅ | ✅ | ✅ | ✅ | n/a | ✅ | ✅ | ✅ | clean |
| EditPost | ✅ | ✅ | ✅ | ✅ | n/a | n/a | ✅ | ✅ | media not editable (by design) |
| Settings | ✅ | ✅ | ✅ | ✅ | n/a | n/a | ✅ | ✅ | Activity switch wired (B-HIGH-6/BUG-006) |
| CreateStory | ✅ | ✅ | ✅ | ✅ | n/a | n/a | ✅ | ✅ | dead gear (low); cards relabeled (BUG-017) |
| VideoPost | ✅ | ✅ | ✅ | ✅ | n/a | n/a | ✅ | ✅ | WebView no pause-on-blur (low) |
| Highlights | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | clean |
| BlockedUsers | ✅ | ✅ | ✅ | ✅ | n/a | ✅ | ✅ | ✅ | unblock reconciled (B-HIGH-7/BUG-007) |
| Explore | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | error/retry added (BUG-015); dead ternary (low) |
| Search | ✅ | ✅ | ✅ | ✅ | n/a | ✅ | ✅ | ✅ | ReelsTab crash fixed (S-HIGH-3); audio tappable (BUG-012) |
| Admin | ✅ | ⚠️ | ✅ | ✅ | n/a | ✅ | ✅ | ✅ | client-gated only; 403 toast-safe |
| HelpCenter | ✅ | ✅ | ✅ | ✅ | n/a | n/a | n/a | n/a | clean |
| ReportProblem | ✅ | ✅ | ✅ | ✅ | n/a | n/a | ✅ | ✅ | reportContent form live (BUG-016) |
| Terms | ✅ | ✅ | ✅ | ✅ | n/a | n/a | n/a | n/a | clean |
| Privacy | ✅ | ✅ | ✅ | ✅ | n/a | n/a | n/a | n/a | clean |
| HashtagPosts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | clean |
| Reels | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | clean (tabs owner-only) |
| CreateReel | ✅ | ✅ | ✅ | ✅ | n/a | n/a | ✅ | ✅ | clean |
| CreatePost | ✅ | ✅ | ✅ | ✅ | n/a | n/a | ✅ | ✅ | video thumbnail as Image (low) |
| CreateGroup | ✅ | ✅ | ✅ | ✅ | n/a | n/a | ✅ | ✅ | clean |
| Onboarding | ✅ | ✅ | n/a | ✅ | n/a | n/a | n/a | n/a | rapid tap (low) |

---

## Cross-cutting screen issues
- **No light theme:** single dark theme only; no theme switcher (premium expectation).
- **Landscape:** no `screenOrientation` lock or landscape layout; tab bar + 3D background may clip on small landscape.
- **Small screens:** 3D `Screen3D` absolute glows use fixed `W*0.5` etc.; very small devices may overflow but `flex:1` contains content.
- **Empty states:** present on Feed/Explore/Search/Notifications/Followers/Saved/Users/Hashtag/Reels — good.
- **Error states:** most screens have try/catch + toast; Explore/Search silently swallow some (B-MED-7, M).
- **Loading:** Spinners used broadly; some screens lack skeletons (polish).

## Counts
- Critical: 1 · High: 4 · (per-screen Medium/Low tracked in table)
