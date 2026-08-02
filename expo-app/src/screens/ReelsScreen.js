import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Share,
  Alert,
  NativeModules,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import reelsApi from "../api/reels";
import { useReels } from "../hooks/useReels";
import { resolveUrl } from "../api/client";
import ReelItem from "../components/ReelItem";
import { COLORS, SIZES, FONTS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS, LAYOUT } from "../design/DesignSystem";
import Icon from "../design/ui/Icon";

const { height: SCREEN_H } = Dimensions.get("window");

export default function ReelsScreen({ navigation }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const [screenFocused, setScreenFocused] = useState(true);
  const [tab, setTab] = useState("foryou");
  const flatListRef = useRef(null);

  useEffect(() => {
    const focus = navigation.addListener("focus", () => setScreenFocused(true));
    const blur = navigation.addListener("blur", () => setScreenFocused(false));
    return () => { focus(); blur(); };
  }, [navigation]);

  const fetchFeed = useCallback(
    (params) => {
      if (tab === "trending") return reelsApi.trending(params);
      if (tab === "featured") return reelsApi.featured(params);
      if (tab === "drafts") return reelsApi.drafts(params);
      if (tab === "scheduled") return reelsApi.scheduled(params);
      return reelsApi.feed(params);
    },
    [tab]
  );
  const { reels, loading, refreshing, hasMore, refresh, loadMore, setReels } = useReels(fetchFeed);

  useEffect(() => {
    refresh();
  }, [refresh, tab]);

  const likeReel = useCallback(async (reelId) => {
    try {
      const res = await reelsApi.toggleLike(reelId);
      return res.data?.data || res.data;
    } catch (e) {
      console.warn("Like error:", e?.message);
      return null;
    }
  }, []);

  const saveReel = useCallback(async (reelId) => {
    try {
      const res = await reelsApi.toggleSave(reelId);
      return res.data?.data || res.data;
    } catch (e) {
      console.warn("Save error:", e?.message);
      return null;
    }
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;

  const handleUserPress = useCallback(
    (userId) => {
      if (userId === user?.id) navigation.navigate("Profile");
      else navigation.navigate("UserProfile", { userId });
    },
    [navigation, user]
  );

  const handleComment = useCallback(
    (reelId) => navigation.navigate("Comments", { reelId, type: "reel" }),
    [navigation]
  );

  const handleShare = useCallback(async (reel) => {
    try {
      await reelsApi.share(reel.id);
      const url = resolveUrl(reel.video_url);
      await Share.share({
        message: `${reel.caption || "Check out this reel!"}\n${url}`,
        url,
      });
    } catch (e) {
      if (e.message !== "User did not share") console.warn("Share error:", e.message);
    }
  }, []);

  const handleDeleteReel = useCallback(
    async (reelId) => {
      try {
        await reelsApi.remove(reelId);
        setReels((prev) => prev.filter((r) => r.id !== reelId));
      } catch (e) {
        console.warn("Delete reel error:", e?.message);
      }
    },
    [setReels]
  );

  const handleViewReel = useCallback(async (reelId) => {
    try {
      await reelsApi.recordView(reelId, { seconds: 3, percent: 30 });
    } catch (e) {
      /* silent */
    }
  }, []);

  const handleDownload = useCallback(async (reel) => {
    try {
      const hasNative = !!(NativeModules?.ExpoMediaLibraryNext || NativeModules?.ExpoMediaLibrary);
      if (!hasNative) {
        Alert.alert("Not supported", "Saving videos is not supported in Expo Go. Update Expo Go or use a development build.");
        return;
      }
      const MediaLibrary = await import("expo-media-library");
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow access to save videos.");
        return;
      }
      const url = resolveUrl(reel.video_url);
      const fileUri = FileSystem.documentDirectory + `reel_${reel.id}.mp4`;
      const downloaded = await FileSystem.downloadAsync(url, fileUri);
      await MediaLibrary.saveToLibraryAsync(downloaded.uri);
      Alert.alert("Saved", "Video saved to your gallery.");
    } catch (e) {
      Alert.alert("Download failed", e?.message || "Could not download video.");
    }
  }, []);

  if (loading && reels.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.text} />
        <Text style={styles.loadingText}>{t("loading") || "Loading..."}</Text>
      </View>
    );
  }

  const TABS = [
    { key: "foryou", label: t("reelsForYou") || "For You" },
    { key: "trending", label: t("reelsTrending") || "Trending" },
    { key: "featured", label: t("reelsFeatured") || "Featured" },
    { key: "drafts", label: t("reelsDrafts") || "Drafts" },
    { key: "scheduled", label: t("reelsScheduled") || "Scheduled" },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.tabBar, { paddingTop: insets.top + SPACING.xs }]}>
        {TABS.map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[styles.tabItem, tab === tb.key && styles.tabItemActive]}
            onPress={() => {
              setTab(tb.key);
              flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, tab === tb.key && styles.tabLabelActive]}>
              {tb.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.cameraFab, { top: insets.top + 50 }]}
        onPress={() => navigation.navigate("CreateReel")}
        activeOpacity={0.7}
      >
        <Text style={styles.cameraFabIcon}>+</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={reels}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <ReelItem
            reel={item}
            isActive={index === activeIndex && screenFocused}
            currentUser={user}
            onLike={likeReel}
            onSave={saveReel}
            onComment={handleComment}
            onShare={handleShare}
            onUserPress={handleUserPress}
            onDelete={handleDeleteReel}
            onDownload={handleDownload}
            onView={handleViewReel}
            index={index}
            total={reels.length}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_H}
        snapToAlignment="start"
        decelerationRate="fast"
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews
        refreshing={refreshing}
        onRefresh={refresh}
        contentContainerStyle={reels.length === 0 ? { flex: 1 } : undefined}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="diamond-outline" size={60} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>{t("noReels") || "No Reels Yet"}</Text>
            <Text style={styles.emptySub}>{t("noReelsSub") || "Be the first to share a reel!"}</Text>
          </View>
        }
        ListFooterComponent={
          hasMore && reels.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={COLORS.text} />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
    ...GLASS.elevated,
    zIndex: 20,
  },
  tabItem: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabLabel: { color: COLORS.muted, fontSize: SIZES.sm, ...FONTS.semiBold },
  tabLabelActive: { color: COLORS.text, ...FONTS.bold },
  cameraFab: {
    position: "absolute",
    top: 50,
    right: SPACING.md,
    zIndex: 30,
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.glass,
  },
  cameraFabIcon: { fontSize: SIZES.xxl },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { color: COLORS.muted, marginTop: SPACING.md, fontSize: SIZES.md },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 100 },
  emptyIcon: { fontSize: 60, marginBottom: SPACING.lg },
  emptyTitle: { fontSize: SIZES.xxl, ...FONTS.bold, color: COLORS.text, marginBottom: SPACING.sm },
  emptySub: { fontSize: SIZES.md, color: COLORS.muted, textAlign: "center" },
  footerLoader: { paddingVertical: SPACING.xl, alignItems: "center" },
});
