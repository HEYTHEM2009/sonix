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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import reelsApi from "../api/reels";
import { useReels } from "../hooks/useReels";
import { resolveUrl } from "../api/client";
import ReelItem from "../components/ReelItem";
import { COLORS } from "../components/Theme";

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
        <ActivityIndicator size="large" color="#fff" />
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
      <View style={[styles.tabBar, { paddingTop: insets.top + 6 }]}>
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
        <Text style={styles.cameraFabIcon}>📷</Text>
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
            <Text style={styles.emptyIcon}>🎬</Text>
            <Text style={styles.emptyTitle}>{t("noReels") || "No Reels Yet"}</Text>
            <Text style={styles.emptySub}>{t("noReelsSub") || "Be the first to share a reel!"}</Text>
          </View>
        }
        ListFooterComponent={
          hasMore && reels.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: "rgba(0,0,0,0.65)",
    zIndex: 20,
  },
  tabItem: { paddingVertical: 6, paddingHorizontal: 8 },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: "#fff" },
  tabLabel: { color: "#aaa", fontSize: 13, fontWeight: "600" },
  tabLabelActive: { color: "#fff", fontWeight: "700" },
  cameraFab: {
    position: "absolute",
    top: 50,
    right: 12,
    zIndex: 30,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraFabIcon: { fontSize: 20 },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { color: "#999", marginTop: 12, fontSize: 14 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 100 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 8 },
  emptySub: { fontSize: 14, color: "#888", textAlign: "center" },
  footerLoader: { paddingVertical: 20, alignItems: "center" },
});
