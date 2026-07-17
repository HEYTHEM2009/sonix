import { useState, useEffect, useCallback, useRef, memo } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Dimensions, Animated, Pressable, ActivityIndicator, Share, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import client, { resolveUrl } from "../api/client";
import { COLORS } from "../components/Theme";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const SPIN_INTERVAL = 8000;

const ReelItem = memo(({ reel, isActive, currentUser, onLike, onComment, onShare, onUserPress, onDelete, onDownload, onView, index, total }) => {
  const { t } = useLanguage();
  const [liked, setLiked] = useState(reel.liked > 0);
  const [likesCount, setLikesCount] = useState(reel.likes_count || 0);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    setLiked(reel.liked > 0);
    setLikesCount(reel.likes_count || 0);
  }, [reel.liked, reel.likes_count]);
  const [soundOn, setSoundOn] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const heartAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const webViewRef = useRef(null);

  const spin = useRef(null);
  const hasViewed = useRef(false);
  useEffect(() => {
    if (isActive && !hasViewed.current) {
      hasViewed.current = true;
      onView(reel.id);
    }
    if (!isActive) hasViewed.current = false;
  }, [isActive, reel.id, onView]);

  useEffect(() => {
    if (isActive) {
      spin.current = setInterval(() => {
        Animated.sequence([
          Animated.timing(spinAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(spinAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]).start();
      }, SPIN_INTERVAL);
    }
    return () => { if (spin.current) clearInterval(spin.current); };
  }, [isActive, spinAnim]);

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const toggleLike = useCallback(async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((c) => newLiked ? c + 1 : c - 1);
    if (newLiked) {
      heartAnim.setValue(0);
      Animated.sequence([
        Animated.spring(heartAnim, { toValue: 1.3, useNativeDriver: true }),
        Animated.spring(heartAnim, { toValue: 1, useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
    try {
      const res = await client.post(`/reels/${reel.id}/like`);
      if (res.data) {
        setLiked(res.data.liked);
        setLikesCount(res.data.likes_count);
      }
    } catch (e) {
      setLiked(!newLiked);
      setLikesCount((c) => newLiked ? c - 1 : c + 1);
    }
  }, [reel.id, heartAnim, pulseAnim]);

  const doubleTapLike = useRef(null);
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (doubleTapLike.current && now - doubleTapLike.current < 300) {
      if (!liked) toggleLike();
    }
    doubleTapLike.current = now;
  }, [liked, toggleLike]);

  const formatCount = (n) => {
    if (!n || n === 0) return "";
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return String(n);
  };

  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#000;display:flex;align-items:center;justify-content:center;height:100vh;overflow:hidden}
  video{width:100%;height:100%;object-fit:cover}
  </style></head><body>
  <video id="v" playsinline webkit-playsinline ${isActive ? "autoplay" : "muted"}
   src="${resolveUrl(reel.video_url)}" type="video/mp4"
   style="width:100%;height:100%;object-fit:cover" preload="auto"></video>
  <script>
  var v=document.getElementById("v");
  v.muted=false;
  v.addEventListener("canplaythrough",function(){
    window.ReactNativeWebView.postMessage("ready");
  });
  v.addEventListener("error",function(){
    window.ReactNativeWebView.postMessage("error");
  });
  v.addEventListener("ended",function(){
    v.currentTime=0;v.play().catch(function(){});
  });
  document.addEventListener("message",function(e){
    if(e.data==="play"){v.muted=false;v.play().catch(function(){})}
    else if(e.data==="pause"){v.pause()}
    else if(e.data==="mute"){v.muted=true}
    else if(e.data==="unmute"){v.muted=false;v.play().catch(function(){})}
  });
  ${isActive ? "v.muted=false;v.play().catch(function(){})" : "v.pause()"}
  </script></body></html>`;

  return (
    <View style={[styles.reelContainer, { height: SCREEN_H }]}>
      {!videoReady && !videoError && (
        <View style={styles.videoLoading}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
      {videoError && (
        <View style={styles.videoLoading}>
          <Text style={{ color: "#fff", fontSize: 14 }}>⚠️</Text>
          <Text style={{ color: "#888", fontSize: 12, marginTop: 6 }}>Video unavailable</Text>
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        scrollEnabled={false}
        nestedScrollEnabled
        androidLayerType="hardware"
        onMessage={(e) => {
          const msg = e.nativeEvent?.data;
          if (msg === "error") { setVideoError(true); webViewRef.current?.postMessage("pause"); }
          else if (msg === "ready") { setVideoReady(true); }
        }}
        onLoadEnd={() => {
          if (isActive) webViewRef.current?.postMessage("play");
        }}
      />

      {/* Bottom gradient overlay */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.85)"]}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* Progress dots on right side */}
      {total > 1 && (
        <View style={styles.progressDots}>
          {Array.from({ length: Math.min(total, 30) }).map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}

      {/* Double-tap heart animation */}
      <Pressable style={styles.tapArea} onPress={handleDoubleTap}>
        <Animated.View style={[styles.heartOverlay, { transform: [{ scale: heartAnim }], opacity: heartAnim }]}>
          <Text style={styles.heartBig}>❤️</Text>
        </Animated.View>
        <Animated.View style={[styles.ringPulse, { opacity: pulseAnim, transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }] }]} />
      </Pressable>

      {/* Right-side engagement sidebar */}
      <View style={styles.sidebar}>
        {/* Avatar + follow */}
        <TouchableOpacity style={styles.sidebarAvatarWrap} onPress={() => onUserPress(reel.user?.id)} activeOpacity={0.7}>
          {reel.user?.avatar ? (
            <Image source={{ uri: `${resolveUrl(reel.user.avatar)}?t=${Date.now()}` }} style={styles.sidebarAvatar} />
          ) : (
            <View style={[styles.sidebarAvatar, styles.sidebarAvatarFallback]}>
              <Text style={styles.sidebarAvatarText}>{reel.user?.username?.[0]?.toUpperCase() || "?"}</Text>
            </View>
          )}
          {!following && reel.user?.id !== currentUser?.id && (
            <View style={styles.followBadge}>
              <Text style={styles.followBadgeIcon}>+</Text>
            </View>
          )}
        </TouchableOpacity>

        {reel.user?.id !== currentUser?.id && (
          <TouchableOpacity
            style={styles.followBtnSmall}
            onPress={() => setFollowing(!following)}
            activeOpacity={0.7}
          >
            <Text style={styles.followBtnSmallText}>
              {following ? (t("following") || "Following") : (t("follow") || "Follow")}
            </Text>
          </TouchableOpacity>
        )}

        {/* Like */}
        <TouchableOpacity style={styles.sidebarAction} onPress={toggleLike} activeOpacity={0.7}>
          <Animated.Text style={[styles.sidebarIcon, liked && { transform: [{ scale: 1.15 }] }]}>
            {liked ? "❤️" : "🤍"}
          </Animated.Text>
          <Text style={styles.sidebarCount}>{formatCount(likesCount)}</Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity style={styles.sidebarAction} onPress={() => onComment(reel.id)} activeOpacity={0.7}>
          <Text style={styles.sidebarIcon}>💬</Text>
          <Text style={styles.sidebarCount}>{formatCount(reel.comments_count)}</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.sidebarAction} onPress={() => onShare(reel)} activeOpacity={0.7}>
          <Text style={styles.sidebarIcon}>📤</Text>
          <Text style={styles.sidebarCount}></Text>
        </TouchableOpacity>

        {/* Delete — only for owner */}
        {reel.user?.id === currentUser?.id && (
          <TouchableOpacity style={styles.sidebarAction} onPress={() => {
            Alert.alert("Delete Reel", "Are you sure you want to delete this reel?", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => onDelete(reel.id) },
            ]);
          }} activeOpacity={0.7}>
            <Text style={styles.sidebarIcon}>🗑️</Text>
            <Text style={styles.sidebarCount}></Text>
          </TouchableOpacity>
        )}

        {/* Download */}
        <TouchableOpacity style={styles.sidebarAction} onPress={() => onDownload(reel)} activeOpacity={0.7}>
          <Text style={styles.sidebarIcon}>⬇️</Text>
          <Text style={styles.sidebarCount}></Text>
        </TouchableOpacity>

        {/* Sound toggle */}
        <TouchableOpacity
          style={styles.sidebarAction}
          onPress={() => { setSoundOn(!soundOn); webViewRef.current?.postMessage(soundOn ? "mute" : "unmute"); }}
          activeOpacity={0.7}
        >
          <Animated.View style={[styles.musicDisc, { transform: [{ rotate: spinInterpolation }] }]}>
            <Text style={styles.musicDiscIcon}>🎵</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Bottom info overlay */}
      <View style={styles.bottomOverlay}>
        {/* Username + caption */}
        <View style={styles.bottomTextWrap}>
          <TouchableOpacity onPress={() => onUserPress(reel.user?.id)} activeOpacity={0.7}>
            <Text style={styles.reelUsername}>@{reel.user?.username}</Text>
          </TouchableOpacity>
          {reel.caption ? (
            <Text style={styles.reelCaption} numberOfLines={2}>{reel.caption}</Text>
          ) : null}
          {reel.music_title ? (
            <View style={styles.musicRow}>
              <Text style={styles.musicIconSmall}>♪</Text>
              <Text style={styles.musicText} numberOfLines={1}>{reel.music_title}</Text>
            </View>
          ) : null}
          {reel.views_count > 0 && (
            <Text style={styles.viewCount}>{formatCount(reel.views_count)} views</Text>
          )}
        </View>
      </View>
    </View>
  );
});

export default function ReelsScreen({ navigation }) {
  const openCamera = useCallback(() => {
    navigation.navigate("CreateReel");
  }, [navigation]);
  const { t } = useLanguage();
  const { user } = useAuth();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const loadingRef = useRef(false);
  const insets = useSafeAreaInsets();

  const loadReels = useCallback(async (pageNum = 1, append = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (pageNum === 1 && !append) setLoading(true);
    try {
      const res = await client.get(`/reels?page=${pageNum}&per_page=20`);
      const data = res.data?.data || [];
      if (append) setReels((prev) => [...prev, ...data]);
      else setReels(data);
      setHasMore(data.length >= 20);
      setPage(pageNum);
    } catch (e) {
      console.warn("Reels error:", e?.code || e?.message);
    }
    loadingRef.current = false;
    setLoading(false);
  }, []);

  useEffect(() => { loadReels(1); }, [loadReels]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setHasMore(true);
    await loadReels(1);
    setRefreshing(false);
  }, [loadReels]);

  const onEndReached = useCallback(async () => {
    if (!hasMore || loadingRef.current) return;
    await loadReels(page + 1, true);
  }, [hasMore, page, loadReels]);

  const likeReel = useCallback(async (reelId, liked) => {
    try {
      const res = await client.post(`/reels/${reelId}/like`);
      return res.data;
    } catch (e) {
      console.warn("Like error:", e?.message);
      return null;
    }
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;

  const handleUserPress = useCallback((userId) => {
    if (userId === user?.id) navigation.navigate("Profile");
    else navigation.navigate("UserProfile", { userId });
  }, [navigation, user]);

  const handleComment = useCallback((reelId) => {
    navigation.navigate("Comments", { reelId, type: "reel" });
  }, [navigation]);

  const handleShare = useCallback(async (reel) => {
    try {
      await Share.share({ message: reel.caption || "Check out this reel!", url: reel.video_url });
    } catch (e) { if (e.message !== "User did not share") console.warn("Share error:", e.message); }
  }, []);

  const handleDeleteReel = useCallback(async (reelId) => {
    try {
      await client.delete(`/reels/${reelId}`);
      setReels((prev) => prev.filter((r) => r.id !== reelId));
    } catch (e) {
      console.warn("Delete reel error:", e?.message);
    }
  }, []);

  const handleViewReel = useCallback(async (reelId) => {
    try { await client.post(`/reels/${reelId}/view`); } catch (e) {}
  }, []);

  const handleDownload = useCallback(async (reel) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission needed", "Allow access to save videos."); return; }
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

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.cameraFab} onPress={openCamera} activeOpacity={0.7}>
        <Text style={styles.cameraFabIcon}>📷</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={reels}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <ReelItem
            reel={item}
            isActive={index === activeIndex}
            currentUser={user}
            onLike={likeReel}
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
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={reels.length === 0 ? { flex: 1 } : undefined}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎬</Text>
            <Text style={styles.emptyTitle}>{t("noReels") || "No Reels Yet"}</Text>
            <Text style={styles.emptySub}>{t("noReelsSub") || "Be the first to share a reel!"}</Text>
          </View>
        }
        ListFooterComponent={hasMore && reels.length > 0 ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
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
  loadingContainer: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#999", marginTop: 12, fontSize: 14 },
  reelContainer: { width: SCREEN_W, backgroundColor: "#000", position: "relative" },
  webview: { width: SCREEN_W, height: SCREEN_H, backgroundColor: "#000" },
  videoLoading: { position: "absolute", inset: 0, zIndex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111" },
  bottomGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: SCREEN_H * 0.4, zIndex: 3, pointerEvents: "none" },

  /* Progress dots — right side */
  progressDots: { position: "absolute", right: 6, top: "35%", zIndex: 15, alignItems: "center", gap: 3 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)" },
  dotActive: { backgroundColor: "#fff", width: 5, height: 5, borderRadius: 2.5 },

  /* Double-tap area */
  tapArea: { position: "absolute", inset: 0, zIndex: 5 },
  heartOverlay: { position: "absolute", top: "38%", alignSelf: "center", zIndex: 10 },
  heartBig: { fontSize: 100, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  ringPulse: { position: "absolute", top: "40%", alignSelf: "center", width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: "rgba(255,50,50,0.4)", zIndex: 9 },

  /* Right-side engagement sidebar */
  sidebar: {
    position: "absolute",
    right: 10,
    bottom: SCREEN_H * 0.18,
    zIndex: 20,
    alignItems: "center",
    gap: 14,
  },
  sidebarAvatarWrap: { position: "relative", marginBottom: 4 },
  sidebarAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: "#fff" },
  sidebarAvatarFallback: { backgroundColor: "rgba(124,108,247,0.4)", alignItems: "center", justifyContent: "center" },
  sidebarAvatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  followBadge: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#000",
  },
  followBadgeIcon: { color: "#fff", fontSize: 14, fontWeight: "700", marginTop: -1 },
  followBtnSmall: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 4,
  },
  followBtnSmallText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  sidebarAction: { alignItems: "center", gap: 2 },
  sidebarIcon: { fontSize: 30 },
  sidebarCount: { color: "#fff", fontSize: 12, fontWeight: "600" },
  musicDisc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#555",
  },
  musicDiscIcon: { fontSize: 16 },

  /* Bottom overlay — username, caption, music */
  bottomOverlay: {
    position: "absolute",
    bottom: 80,
    left: 12,
    right: 80,
    zIndex: 20,
  },
  bottomTextWrap: { gap: 4 },
  reelUsername: { color: "#fff", fontSize: 16, fontWeight: "800" },
  reelCaption: { color: "#fff", fontSize: 13, lineHeight: 18, textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  musicRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  musicIconSmall: { color: "#fff", fontSize: 12 },
  musicText: { color: "#ddd", fontSize: 12, flex: 1 },
  viewCount: { color: "#aaa", fontSize: 11, marginTop: 4 },

  /* Empty / footer */
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 100 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 8 },
  emptySub: { fontSize: 14, color: "#888", textAlign: "center" },
  footerLoader: { paddingVertical: 20, alignItems: "center" },
});
