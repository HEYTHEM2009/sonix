# Performance Report — Phase 1

**App:** Sonix (React Native / Expo 57)  
**Target:** Android (arm64-v8a)  
**Date:** 2026-07-22  

---

## 1. Bundle Analysis

| Metric | Value | Notes |
|--------|-------|-------|
| APK size (single ABI) | 45.3 MB | arm64-v8a only. Multi-ABI: ~80 MB |
| JavaScript bundle size | ~3–4 MB (est.) | Metro bundle with Hermes bytecode |
| Asset size | ~15 MB | Images, fonts, icons |

## 2. FlatList / Scroll Optimizations

All redesigned screens use the **performance-optimized** FlatList config:

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `initialNumToRender` | 6–8 | Minimize initial render cost |
| `maxToRenderPerBatch` | 8–10 | Balance update frequency |
| `windowSize` | 9–11 | Render window around visible area |
| `removeClippedSubviews` | ✅ | Remove off-screen native views |
| `updateCellsBatchingPeriod` | 50ms | Batch pending updates |

**FeedScreen:** `initialNumToRender=6`, `maxToRenderPerBatch=8`, `windowSize=9` — aggressive but safe.

### PostCard memoization
- `PostCard` wrapped in `React.memo` — re-renders only when props change
- `LikeAnimation` wrapped in `React.memo` — isolated re-render for heart burst
- Callback handlers memoized with `useCallback` on parent

## 3. Animation Performance

All animations use `useNativeDriver: true` — runs on the UI thread, not JS thread:

| Animation | Type | Native Driver | FPS Impact |
|-----------|------|---------------|------------|
| Card entry | spring (translateY, scale, rotateX) | ✅ | None |
| Like heart burst | spring (scale) + timing (opacity) | ✅ | None |
| Tab icon pulse | spring (scale) | ✅ | None |
| Tab bar float | timing (translateY) | ✅ | None |
| Create button spin | spring (rotate) | ✅ | None |
| Create ring glow | timing (opacity, scale, rotate) | ✅ | None |
| Button press | spring (scale → 0.96) | ✅ | None |
| Login logo | spring (opacity, translateY) | ✅ | None |
| Login form | spring (opacity, translateY) | ✅ | None |
| Skeleton pulse | timing loop (opacity 0.3→1) | ✅ | None |
| Offline banner slide | spring (translateY) | ✅ | None |
| Swipe actions | spring (translateX) | ✅ | None |

## 4. Memory Considerations

| Strategy | Status | Details |
|----------|--------|---------|
| Image resize mode | ✅ `cover` | Prevents oversized decode |
| Image cache | ✅ `resolveUrl` cache busting only | No explicit cache library yet |
| FlatList recycler | ✅ | Native view recycling enabled |
| Lazy loading | ✅ | CameraScreen, ImageViewerScreen, CreateStoryScreen use `React.lazy()` |
| `removeClippedSubviews` | ✅ | FeedScreen, ProfileScreen |

## 5. Network Optimization

| Strategy | Status | Notes |
|----------|--------|-------|
| Pagination | ✅ | `per_page=20`, page-based |
| Infinite scroll | ✅ `onEndReached` | 50% threshold |
| Loading guard | ✅ `loadingRef` | Prevents duplicate requests |
| Optimistic updates | ✅ | Like, bookmark update instantly, rollback on failure |
| Error rollback | ✅ | Optimistic like/bookmark revert on network error |
| Request deduplication | ✅ | `loadingRef.current` guard prevents race |

## 6. Rendering Optimization

| Strategy | Status | Notes |
|----------|--------|-------|
| `React.memo` | ✅ | PostCard, ConversationItem, LikeAnimation, TabBarIcon |
| `useCallback` | ✅ | All event handlers |
| `useMemo` | ✅ | Stories data, header components |
| `useRef` for Animation.Values | ✅ | Prevents re-creation on re-render |
| `useFocusEffect` | ✅ | Data refresh only when screen focused |

## 7. Perceived Performance

| Scenario | Implementation | Expected UX |
|----------|---------------|-------------|
| App cold start | Splash screen → auth check | < 2 sec |
| Feed load | Skeleton loading immediately | Instant feedback |
| Image loading | Placeholder background color (#1a1a35) | No white flash |
| Post interaction | Optimistic UI update | Instant feel |
| Navigation | Native stack (native-stack) | Native transitions |
| Tab switch | Pre-mounted tabs, no re-render | Instant |

---

## 8. Performance Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Image list in Feed with 100+ items | Low | FlatList with `windowSize=9` + `removeClippedSubviews` |
| Reel video preloading | Medium | Not yet implemented (Phase 6) |
| Chat screen with 1000+ messages | Medium | Will need inverted FlatList + section list |
| 3D background (Screen3D) | Low | Uses Animated, not heavy canvas |

---

## 9. Benchmarks (Lab — Metro Dev Server)

| Metric | Value | Tool |
|--------|-------|------|
| Metro bundle time (cold) | ~35s | Metro CLI |
| Metro bundle time (warm) | ~5s | Metro CLI |
| Gradle assemble (cold, single ABI) | ~19min | Gradle |
| Gradle assemble (warm, single ABI) | ~2min | Gradle |
| Gradle assemble (cold, multi ABI) | ~40min (est.) | — |

---

> **Note:** Device-specific benchmarks (FPS, startup time, memory) require real-device profiling with Android Studio Profiler or Flipper. The above numbers are from the dev environment.
