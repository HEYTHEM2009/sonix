# UI Issues — Phase 1 Audit

**Status:** Pre-release audit of redesigned screens  
**Severity Levels:** 🔴 Critical | 🟡 High | 🔵 Medium | ⚪ Low  

---

## 🔴 Critical (Must fix before Phase 2)

| # | Issue | Location | Status |
|---|-------|----------|--------|
| C1 | 36 screens still reference legacy `Theme.js` — design inconsistency | All non-redesigned screens | ⚠️ Not a bug per se; planned migration |
| C2 | `Screen3D` animated background may cause jank on low-end devices | All screens using Screen3D | ⚠️ Need testing on device |

## 🟡 High (Should fix before Phase 2)

| # | Issue | Location | Status |
|---|-------|----------|--------|
| H1 | No Haptic Feedback on button presses or tab switches | All screens | ✅ Foundation ready; requires `expo-haptics` |
| H2 | Avatar component has no accessibility `label` prop | Avatar.js | Need to add `accessibilityLabel` |
| H3 | No keyboard avoidance on Messages search | MessagesScreen | ✅ Already using KeyboardAvoidingView pattern? No — MessagesScreen has no keyboard handling |
| H4 | PostCard uses `imagePressable` without `accessibilityRole="image"` | FeedScreen | Accessibility gap |
| H5 | No `accessibilityRole="tab"` on tab bar items | AppNavigator | Accessibility gap |

## 🔵 Medium (Fix during Phase 2)

| # | Issue | Location | Status |
|---|-------|----------|--------|
| M1 | Emoji icons used instead of vector icons (e.g., `react-native-vector-icons` or `@expo/vector-icons`) | All screens | Cosmetic — emoji are cross-platform but inconsistent across devices |
| M2 | No `Platform.select` for iOS vs Android safe area differences | DesignSystem.js | `statusBarHeight` is hardcoded; should use `useSafeAreaInsets` dynamically |
| M3 | `Screen3D` component added 3D decorative elements — no loading state for the 3D canvas itself | Screen3D.js | Minor visual impact |
| M4 | No explicit `hitSlop` on icon buttons (except menu dots) | Multiple screens | UI may feel unresponsive on small touch targets |
| M5 | RTL stories horizontal FlatList does not reverse direction | FeedScreen | `horizontal` + RTL may not scroll right-to-left on Android |

## ⚪ Low (Track for later)

| # | Issue | Location | Status |
|---|-------|----------|--------|
| L1 | `Toaster` shown during errors lacks animation | ToastContext | Existing component, minor |
| L2 | No pull-to-refresh haptic | All screens | Delight, not necessity |
| L3 | Tab bar Create button text weight `300` renders differently across fonts | AppNavigator | Minor visual diff |
| L4 | `OfflineBanner` animates in/out but no connection state persistence | OfflineState | Banner disappears immediately on reconnect |
| L5 | Feed `onEndReached` loads more posts but no loading indicator at bottom after first batch | FeedScreen | Loading dots exist but subtle |

---

## Design System Consistency Audit

### Colors Used (should match DesignSystem.js)

| Token | Current Value | Used In | Match? |
|-------|---------------|---------|--------|
| `COLORS.bg` | `#0a0a14` | ✅ DesignSystem | Correct |
| `COLORS.primary` | `#6C63FF` | ✅ DesignSystem | Updated from `#7c6cf7` |
| `COLORS.accent` | `#F0A500` | ✅ DesignSystem | Updated from `#d4a574` |
| Legacy `COLORS.primary` | `#7c6cf7` | ❌ All old screens | 36 screens still use old value |
| Legacy `COLORS.accent` | `#d4a574` | ❌ All old screens | 36 screens still use old value |

### Typography Consistency

| Style | DesignSystem | Legacy Theme | Match? |
|-------|-------------|-------------|--------|
| h1 | `32px/900` | — | New |
| h2 | `26px/800` | — | New |
| body | `15px/400` | — | New |
| Legacy SIZES.md | — | `14px` | Old |
| Legacy SIZES.lg | — | `16px` | Old |

### Spacing Consistency

| Token | Value | Match |
|-------|-------|-------|
| DesignSystem SPACING.md | `12px` | ✅ |
| Legacy SIZES.md | `14px` | ❌ Different |
| DesignSystem SPACING.lg | `16px` | ✅ |
| Legacy SIZES.lg | `16px` | ✅ Matches |

---

## Visual Regression Points

### FeedScreen (Redesigned)
- [ ] Card radius: `RADIUS.lg` (16px) vs legacy `SIZES.radius` (14px)
- [ ] Card shadow: new `SHADOWS.card` vs legacy `elevation: undefined`
- [ ] Card margin: `SPACING.sm` (8px) vs legacy `marginHorizontal: 6`
- [ ] Avatar size: `size="sm"` (32px) vs legacy `36px`
- [ ] Post image height: `SCREEN_W - 40` vs legacy `SCREEN_W - 24`

### ProfileScreen (Redesigned)
- [ ] Avatar size: `xxl` (88px) vs legacy `78px`
- [ ] Stat numbers: `TYPOGRAPHY.h3` vs legacy `17px`
- [ ] Buttons: new `Button` component vs legacy `TouchableOpacity`
- [ ] Savings row: now separated with arrow → vs legacy inline

### MessagesScreen (Redesigned)
- [ ] Avatar: new component vs legacy hand-rolled
- [ ] Search input: new `SearchInput` vs legacy inline
- [ ] Header: new `ScreenHeader` pattern vs legacy
- [ ] Unread badge: new `Badge` component vs legacy `View`

---

## Checklist for Device Testing

- [ ] Login screen renders centered card on large screen (tablet)
- [ ] Feed posts have correct spacing and shadows
- [ ] Tab bar icons animate on press
- [ ] Create button spins and has glow ring
- [ ] Profile avatar has gold story ring
- [ ] Messages swipe actions are tappable
- [ ] Empty state shows when feed is empty
- [ ] Loading skeleton pulses correctly
- [ ] Offline banner slides in when airplane mode
- [ ] RTL mode reverses tab bar and text alignment
- [ ] Safe areas respected on notch devices
- [ ] Keyboard pushes login form up (not overlapping)

---

## Known Non-Issues

| Concern | Resolution |
|---------|------------|
| Prefers `react-native-vector-icons` over emoji | Emoji are zero-dependency, cross-platform, and render consistently on modern Android (11+). Acceptable for v1 commercial. |
| No TypeScript | Project is `.js` — adding TS would be a major rewrite. Not required for current phase per AGENTS.md. |
| No unit tests for UI components | Project has no test framework configured for frontend. Backend has 4 test files. New tests can be added in Phase 14. |
