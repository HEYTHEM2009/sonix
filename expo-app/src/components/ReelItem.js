import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  Animated as RNA,
  Easing,
} from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { VideoView, useVideoPlayer } from "expo-video";
import { resolveUrl } from "../api/client";
import { COLORS } from "../design/DesignSystem";
import Icon from "../design/ui/Icon";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

function formatCount(n) {
  if (!n || n === 0) return "";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

function FloatingHeart({ x, y }) {
  const scale = useRef(new RNA.Value(0)).current;
  const opacity = useRef(new RNA.Value(1)).current;
  const translateY = useRef(new RNA.Value(0)).current;

  useEffect(() => {
    RNA.sequence([
      RNA.timing(scale, { toValue: 1.2, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      RNA.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    RNA.timing(opacity, { toValue: 0, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    RNA.timing(translateY, { toValue: -90, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, []);

  return (
    <RNA.View
      pointerEvents="none"
      style={[{ position: "absolute", left: x - 40, top: y - 40, zIndex: 15, transform: [{ scale }, { translateY }], opacity }]}
    >
      <Icon name="heart" size={80} color="#ff2d55" />
    </RNA.View>
  );
}

function SmallHeart({ x, y, offsetX, offsetY, delayMs }) {
  const scale = useRef(new RNA.Value(0)).current;
  const opacity = useRef(new RNA.Value(1)).current;
  const translateX = useRef(new RNA.Value(0)).current;
  const translateY = useRef(new RNA.Value(0)).current;
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const timer = setTimeout(() => {
      RNA.sequence([
        RNA.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
        RNA.timing(scale, { toValue: 0.6, duration: 400, useNativeDriver: true }),
      ]).start();
      RNA.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }).start();
      RNA.timing(translateX, { toValue: offsetX, duration: 500, useNativeDriver: true }).start();
      RNA.timing(translateY, { toValue: offsetY, duration: 500, useNativeDriver: true }).start();
    }, delayMs);
    return () => clearTimeout(timer);
  }, []);

  return (
    <RNA.View
      pointerEvents="none"
      style={[{ position: "absolute", left: x - 14, top: y - 14, zIndex: 14, transform: [{ scale }, { translateX }, { translateY }], opacity }]}
    >
      <Icon name="heart" size={28} color="#ff2d55" />
    </RNA.View>
  );
}

const ReelItem = memo(function ReelItem({
  reel,
  isActive,
  currentUser,
  onLike,
  onComment,
  onShare,
  onSave,
  onUserPress,
  onDelete,
  onDownload,
  onView,
  index,
  total,
}) {
  const [liked, setLiked] = useState(!!reel.liked);
  const [likesCount, setLikesCount] = useState(reel.likes_count || 0);
  const [saved, setSaved] = useState(!!reel.saved);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [paused, setPaused] = useState(true);
  const [hearts, setHearts] = useState([]);

  const heartAnim = useRef(new RNA.Value(0)).current;
  const pulseAnim = useRef(new RNA.Value(0)).current;
  const spinAnim = useRef(new RNA.Value(0)).current;
  const heartScale = heartAnim.interpolate({
    inputRange: [0, 1, 1.3],
    outputRange: [1, 1.3, 1],
  });
  const heartOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.6],
  });
  const spin = useRef(null);
  const hasViewed = useRef(false);
  const localPausedRef = useRef(true);

  const videoUrl = resolveUrl(reel.video_url);
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = false;
  });

  useEffect(() => {
    if (!player) return;
    const sub = player.addListener("statusChange", ({ status }) => {
      if (status === "readyToPlay") setVideoReady(true);
      if (status === "error") setVideoError(true);
    });
    const playSub = player.addListener("playingChange", ({ isPlaying }) => {
      localPausedRef.current = !isPlaying;
      setPaused(!isPlaying);
    });
    if (player.status === "readyToPlay") setVideoReady(true);
    if (player.status === "error") setVideoError(true);
    localPausedRef.current = !player.playing;
    setPaused(!player.playing);
    return () => { sub.remove(); playSub.remove(); };
  }, [player]);

  useEffect(() => {
    if (isActive && !hasViewed.current) {
      hasViewed.current = true;
      onView(reel.id);
    }
    if (!isActive) hasViewed.current = false;
  }, [isActive, reel.id, onView]);

  useEffect(() => {
    if (!player) return;
    if (isActive) {
      player.muted = false;
      localPausedRef.current = false;
      player.play();
    } else {
      player.pause();
      player.muted = true;
      localPausedRef.current = true;
    }
  }, [isActive, player]);

  useEffect(() => {
    if (isActive) {
      spin.current = setInterval(() => {
        RNA.sequence([
          RNA.timing(spinAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          RNA.timing(spinAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]).start();
      }, 8000);
    }
    return () => {
      if (spin.current) clearInterval(spin.current);
    };
  }, [isActive, spinAnim]);

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const addHeart = useCallback((x, y) => {
    const id = Date.now() + Math.random();
    setHearts((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 900);
  }, []);

  const performLike = useCallback(() => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((c) => (newLiked ? c + 1 : c - 1));
    onLike(reel.id)
      .then((res) => {
        if (res) {
          setLiked(res.liked);
          setLikesCount(res.likes_count);
        }
      })
      .catch(() => {
        setLiked(!newLiked);
        setLikesCount((c) => (newLiked ? c - 1 : c + 1));
      });
  }, [liked, reel.id, onLike]);

  const handleDoubleTap = useCallback(
    (x, y) => {
      if (!liked) performLike();
      addHeart(x, y);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [liked, performLike, addHeart],
  );

  const togglePlayPause = useCallback(() => {
    if (!player) return;
    const next = !localPausedRef.current;
    localPausedRef.current = next;
    if (next) {
      player.pause();
    } else {
      player.play();
    }
  }, [player]);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      handleDoubleTap(event.x, event.y);
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      togglePlayPause();
    });

  const composedGesture = Gesture.Exclusive(doubleTap, singleTap);

  const toggleLike = useCallback(async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((c) => (newLiked ? c + 1 : c - 1));
    if (newLiked) {
      RNA.sequence([
        RNA.spring(heartAnim, { toValue: 1.3, useNativeDriver: true }),
        RNA.spring(heartAnim, { toValue: 1, useNativeDriver: true }),
      ]).start();
      RNA.sequence([
        RNA.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        RNA.timing(pulseAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
    try {
      const res = await onLike(reel.id);
      if (res) {
        setLiked(res.liked);
        setLikesCount(res.likes_count);
      }
    } catch (e) {
      setLiked(!newLiked);
      setLikesCount((c) => (newLiked ? c - 1 : c + 1));
    }
  }, [liked, reel.id, heartAnim, pulseAnim, onLike]);

  const toggleSave = useCallback(async () => {
    const newSaved = !saved;
    setSaved(newSaved);
    try {
      const res = await onSave(reel.id);
      if (res && typeof res.saved === "boolean") setSaved(res.saved);
    } catch (e) {
      setSaved(!newSaved);
    }
  }, [saved, reel.id, onSave]);

  return (
    <View style={[styles.reelContainer, { height: SCREEN_H }]}>
      {!videoReady && !videoError && (
        <View style={styles.videoLoading}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
      {videoError && (
        <View style={styles.videoLoading}>
          <Icon name="alert-circle" size={14} color="#fff" />
          <Text style={{ color: "#888", fontSize: 12, marginTop: 6 }}>Video unavailable</Text>
        </View>
      )}

      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        allowsPictureInPicture={false}
        onFirstFrameRender={() => setVideoReady(true)}
        nativeControls={false}
      />

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.85)"]}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {total > 1 && (
        <View style={styles.progressDots}>
          {Array.from({ length: Math.min(total, 30) }).map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}

      <GestureDetector gesture={composedGesture}>
        <View style={StyleSheet.absoluteFill} />
      </GestureDetector>

      {paused && videoReady && (
        <View style={styles.playOverlay} pointerEvents="none">
          <Icon name="play" size={72} color="#fff" style={{ opacity: 0.85 }} />
        </View>
      )}

      {hearts.map((h) => (
        <React.Fragment key={h.id}>
          <FloatingHeart x={h.x} y={h.y} />
          <SmallHeart x={h.x} y={h.y} offsetX={-40} offsetY={-50} delayMs={50} />
          <SmallHeart x={h.x} y={h.y} offsetX={40} offsetY={-40} delayMs={80} />
        </React.Fragment>
      ))}

      <View style={styles.sidebar}>
        <TouchableOpacity
          style={styles.sidebarAvatarWrap}
          onPress={() => onUserPress(reel.user?.id)}
          activeOpacity={0.7}
        >
          {reel.user?.avatar ? (
            <Image source={{ uri: resolveUrl(reel.user.avatar) }} style={styles.sidebarAvatar} />
          ) : (
            <View style={[styles.sidebarAvatar, styles.sidebarAvatarFallback]}>
              <Text style={styles.sidebarAvatarText}>
                {reel.user?.username?.[0]?.toUpperCase() || "?"}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarAction} onPress={toggleLike} activeOpacity={0.7}>
          <RNA.View style={[styles.sidebarIcon, { transform: [{ scale: heartScale }], opacity: heartOpacity }]}>
            <Icon name={liked ? "heart" : "heart-outline"} size={30} color="#fff" />
          </RNA.View>
          <Text style={styles.sidebarCount}>{formatCount(likesCount)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sidebarAction}
          onPress={() => onComment(reel.id)}
          activeOpacity={0.7}
        >
          <Icon name="chatbubble-outline" size={30} color="#fff" />
          <Text style={styles.sidebarCount}>{formatCount(reel.comments_count)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarAction} onPress={toggleSave} activeOpacity={0.7}>
          <Icon name={saved ? "bookmark" : "bookmark-outline"} size={30} color="#fff" />
          <Text style={styles.sidebarCount}>{formatCount(reel.saves_count)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sidebarAction}
          onPress={() => onShare(reel)}
          activeOpacity={0.7}
        >
          <Icon name="share-outline" size={30} color="#fff" />
          <Text style={styles.sidebarCount}>{formatCount(reel.shares_count)}</Text>
        </TouchableOpacity>

        {reel.user?.id === currentUser?.id && (
          <TouchableOpacity
            style={styles.sidebarAction}
            onPress={() =>
              Alert.alert("Delete Reel", "Are you sure?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => onDelete(reel.id) },
              ])
            }
            activeOpacity={0.7}
          >
            <Icon name="trash-outline" size={30} color="#fff" />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.sidebarAction} onPress={() => onDownload(reel)} activeOpacity={0.7}>
          <Icon name="download-outline" size={30} color="#fff" />
        </TouchableOpacity>

        <RNA.View style={[styles.musicDisc, { transform: [{ rotate: spinInterpolation }] }]}>
          <Icon name="musical-note" size={16} color="#fff" />
        </RNA.View>
      </View>

      <View style={styles.bottomOverlay}>
        <View style={styles.bottomTextWrap}>
          <View style={styles.usernameRow}>
            <TouchableOpacity onPress={() => onUserPress(reel.user?.id)} activeOpacity={0.7}>
              <Text style={styles.reelUsername}>@{reel.user?.username}</Text>
            </TouchableOpacity>
            {reel.user?.is_pro ? <Text style={styles.proBadge}>PRO</Text> : null}
          </View>
          {reel.caption ? (
            <Text style={styles.reelCaption} numberOfLines={2}>
              {reel.caption}
            </Text>
          ) : null}
          {reel.music_title ? (
            <View style={styles.musicRow}>
              <Icon name="musical-note" size={12} color="#ddd" />
              <Text style={styles.musicText} numberOfLines={1}>
                {reel.music_title}
              </Text>
            </View>
          ) : null}
          {reel.hashtags?.length > 0 && (
            <View style={styles.hashtagRow}>
              {reel.hashtags.map((h) => (
                <Text key={h} style={styles.hashtag}>
                  #{h}
                </Text>
              ))}
            </View>
          )}
          {reel.views_count > 0 && (
            <Text style={styles.viewCount}>{formatCount(reel.views_count)} views</Text>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  usernameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  proBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#111",
    backgroundColor: "#FFD60A",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  reelContainer: { width: SCREEN_W, backgroundColor: "#000", position: "relative" },
  videoLoading: {
    position: "absolute",
    inset: 0,
    zIndex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.4,
    zIndex: 3,
    pointerEvents: "none",
  },
  progressDots: { position: "absolute", right: 6, top: "35%", zIndex: 20, alignItems: "center", gap: 3 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)" },
  dotActive: { backgroundColor: "#fff", width: 5, height: 5, borderRadius: 2.5 },
  sidebar: { position: "absolute", right: 10, bottom: SCREEN_H * 0.18, zIndex: 25, alignItems: "center", gap: 14 },
  sidebarAvatarWrap: { position: "relative", marginBottom: 4 },
  sidebarAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: "#fff" },
  sidebarAvatarFallback: {
    backgroundColor: "rgba(124,108,247,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarAvatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
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
  bottomOverlay: { position: "absolute", bottom: 80, left: 12, right: 80, zIndex: 25 },
  bottomTextWrap: { gap: 4 },
  reelUsername: { color: "#fff", fontSize: 16, fontWeight: "800" },
  reelCaption: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 18,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  musicRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  musicIconSmall: { color: "#fff", fontSize: 12 },
  musicText: { color: "#ddd", fontSize: 12, flex: 1 },
  hashtagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  hashtag: { color: COLORS.primary || "#7c6cf7", fontSize: 12, fontWeight: "700" },
  viewCount: { color: "#aaa", fontSize: 11, marginTop: 4 },
  playOverlay: {
    position: "absolute", inset: 0, zIndex: 10,
    alignItems: "center", justifyContent: "center",
  },
  playIcon: { fontSize: 72, opacity: 0.85 },
});

export default ReelItem;
