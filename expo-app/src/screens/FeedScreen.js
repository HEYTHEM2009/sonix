import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, RefreshControl, StyleSheet, Dimensions, Pressable, Animated, I18nManager, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useRealtimeContext } from "../context/RealtimeContext";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import client, { resolveUrl } from "../api/client";
import realtime from "../api/realtime";
import { COLORS, SIZES, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS } from "../design/DesignSystem";
import Button from "../design/ui/Button";
import Avatar from "../design/ui/Avatar";
import Icon from "../design/ui/Icon";
import { PostSkeleton } from "../design/states/LoadingState";
import EmptyState from "../design/states/EmptyState";
import ErrorState from "../design/states/ErrorState";
import OfflineState, { OfflineBanner } from "../design/states/OfflineState";

const { width: SCREEN_W } = Dimensions.get("window");

function formatTime(dateStr, t) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return t("now");
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return d.toLocaleDateString(I18nManager.isRTL ? "ar" : "en-US", { month: "short", day: "numeric" });
}

const LikeAnimation = memo(({ show }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (show) {
      scale.setValue(0); opacity.setValue(1);
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.4, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        Animated.delay(300),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [show]);
  if (!show) return null;
  return <Animated.View style={[styles.heartOverlay, { transform: [{ scale }], opacity }]}><Icon name="heart" size={80} color={COLORS.danger} /></Animated.View>;
});

const PostCard = memo(({ post, currentUser, onLike, onBookmark, onComment, onShare, onImagePress, onVideoPress, onMenuPress, onUserPress, onLikesPress, navigation }) => {
  const { t, isRTL } = useLanguage();
  const [showHeart, setShowHeart] = useState(false);
  const [liked, setLiked] = useState(post.liked > 0);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [bookmarked, setBookmarked] = useState(post.bookmarked || false);
  const lastTap = useRef(0);
  const tapTimer = useRef(null);
  const likeAnims = Array.from({ length: 5 }, () => useRef(new Animated.Value(0)).current);
  const cardAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(cardAnim, { toValue: 1, tension: 40, friction: 9, useNativeDriver: true }).start(); }, []);

  const handleLike = useCallback(() => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    onLike(post.id, !newLiked, likesCount);
    if (newLiked) {
      likeAnims.forEach((a) => { a.current.setValue(0); Animated.spring(a.current, { toValue: 1, useNativeDriver: true }).start(); });
    }
  }, [liked, likesCount, post.id, onLike, likeAnims]);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      clearTimeout(tapTimer.current);
      if (!liked) handleLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    } else {
      tapTimer.current = setTimeout(() => {
        if (post.type === "video" && post.video) onVideoPress(post);
        else if (post.image) onImagePress(post);
      }, 300);
    }
    lastTap.current = now;
  }, [liked, handleLike, post, onImagePress, onVideoPress]);

  const handleBookmark = useCallback(() => {
    setBookmarked(!bookmarked);
    onBookmark(post.id);
  }, [bookmarked, post.id, onBookmark]);

  const cardStyle = {
    opacity: cardAnim,
    transform: [
      { translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
      { scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
    ],
  };

  return (
    <Animated.View style={[styles.card, cardStyle]}>
      <View style={styles.cardHeader}>
        <TouchableOpacity style={styles.cardHeaderLeft} onPress={() => onUserPress(post.user?.id)} activeOpacity={0.7}>
          <Avatar source={post.user?.avatar ? `${resolveUrl(post.user.avatar)}${post.user?.id === currentUser?.id ? `?t=${Date.now()}` : ""}` : null} username={post.user?.username} size="sm" />
          <View>
            <Text style={styles.cardUsername}>{post.user?.username}</Text>
            <Text style={styles.cardTime}>{formatTime(post.created_at, t)}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onMenuPress(post)} style={styles.menuBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="ellipsis-horizontal" size="sm" color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {(post.type === "video" && post.video) || post.image ? (
        <Pressable onPress={handleDoubleTap} style={styles.mediaWrap}>
          {post.type === "video" && post.video ? (
            <>
              {post.thumbnail || post.image ? (
                <Image source={{ uri: resolveUrl(post.thumbnail || post.image) }} style={styles.postImg} resizeMode="cover" />
              ) : null}
              <TouchableOpacity style={styles.playOverlay} onPress={() => onVideoPress(post)} activeOpacity={0.8}>
                <View style={styles.playCircle}><Icon name="play" size={24} color="#fff" style={{ marginLeft: 3 }} /></View>
              </TouchableOpacity>
            </>
          ) : post.image ? (
            <Image source={{ uri: resolveUrl(post.image) }} style={styles.postImg} resizeMode="cover" />
          ) : null}
          <LikeAnimation show={showHeart} />
        </Pressable>
      ) : null}

      {post.content ? (
        <View style={[styles.contentWrap, !post.image && !(post.type === "video" && post.video) && styles.textOnly]}>
            <Text style={[styles.contentText, !post.image && !(post.type === "video" && post.video) && { fontSize: 16, lineHeight: 24 }]}>
            <Text style={styles.contentUser}>{post.user?.username} </Text>
            <ContentText text={post.content} navigation={navigation} />
          </Text>
        </View>
      ) : null}

      <View style={styles.actionsBar}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity onPress={handleLike} style={styles.actionBtn} hitSlop={{top:8, bottom:8, left:8, right:8}}>
            <Icon name={liked ? "heart" : "heart-outline"} size={22} color={liked ? COLORS.danger : COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onComment(post.id)} style={styles.actionBtn} hitSlop={{top:8, bottom:8, left:8, right:8}}>
            <Icon name="chatbubble-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onShare(post.id)} style={styles.actionBtn} hitSlop={{top:8, bottom:8, left:8, right:8}}>
            <Icon name="share-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleBookmark} style={styles.actionBtn} hitSlop={{top:8, bottom:8, left:8, right:8}}>
          <Icon name={bookmarked ? "bookmark" : "bookmark-outline"} size={22} color={COLORS.text} style={bookmarked ? { transform: [{ scale: 1.15 }] } : undefined} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => onLikesPress(post.id)} hitSlop={{top:8, bottom:8, left:8, right:8}}>
        <Text style={styles.likesText}>{t("likes").replace("{count}", likesCount)}</Text>
      </TouchableOpacity>

      {post.comments && post.comments.length > 0 && (
        <View style={styles.commentsPreview}>
          {post.comments.slice(0, 2).map((comment) => (
            <TouchableOpacity key={comment.id} onPress={() => onComment(post.id)} style={styles.commentRow} hitSlop={{top:8, bottom:8, left:8, right:8}}>
              <Text style={styles.commentUser}>{comment.user?.username}</Text>
              <Text style={styles.commentText} numberOfLines={1}>{comment.content}</Text>
            </TouchableOpacity>
          ))}
          {post.comments_count > 2 && (
            <TouchableOpacity onPress={() => onComment(post.id)} hitSlop={{top:8, bottom:8, left:8, right:8}}>
              <Text style={styles.viewAllComments}>{t("viewComments").replace("{count}", post.comments_count)}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {(!post.comments || post.comments.length === 0) && (
        <TouchableOpacity onPress={() => onComment(post.id)} hitSlop={{top:8, bottom:8, left:8, right:8}}><Text style={styles.viewAllComments}>{t("addComment")}</Text></TouchableOpacity>
      )}
    </Animated.View>
  );
});

function ContentText({ text, navigation }) {
  if (!text) return null;
  const parts = text.split(/([#@][\p{L}\p{N}_]+)/gu);
  return parts.map((part, i) => {
    if (part.startsWith("#")) return <Text key={i} style={styles.hashtag} onPress={() => navigation?.navigate?.("HashtagPosts", { tag: part.slice(1) })}>{part}</Text>;
    if (part.startsWith("@")) return <Text key={i} style={styles.mention} onPress={() => navigation?.navigate?.("UserProfile", { username: part.slice(1) })}>{part}</Text>;
    return <Text key={i}>{part}</Text>;
  });
}

export default function FeedScreen({ navigation }) {
  const { t, isRTL } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();
  const loadingRef = useRef(false);
  const insets = useSafeAreaInsets();
  const isOnline = useNetworkStatus();
  const { isConnected } = useRealtimeContext();

  useEffect(() => {
    if (!user?.id || !isConnected) return undefined;
    const channelName = `stories.${user.id}`;
    realtime.listen(channelName, "story.created", (payload) => {
      if (!payload?.id) return;
      setStories((prev) => {
        const story = {
          id: payload.id,
          user_id: payload.user_id,
          type: payload.type,
          image: payload.image,
          video: payload.video,
          text_overlay: payload.text_overlay,
          text_color: payload.text_color,
          bg_color: payload.bg_color,
          duration: payload.duration,
          stickers: payload.stickers,
          drawing_data: payload.drawing_data,
          created_at: payload.created_at,
        };
        const idx = prev.findIndex((g) => g.user?.id === payload.user_id);
        if (idx !== -1) {
          const group = prev[idx];
          if (group.stories?.some((s) => s.id === story.id)) return prev;
          const next = prev.slice();
          next[idx] = { ...group, stories: [story, ...(group.stories || [])], has_unseen: true };
          return next;
        }
        return [{ user: payload.user, stories: [story], has_unseen: true }, ...prev];
      });
    });
    return () => realtime.leave(channelName);
  }, [user?.id, isConnected]);

  const loadPosts = useCallback(async (pageNum = 1, append = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setError(null);
    if (pageNum === 1 && !append) setLoading(true);
    try {
      const res = await client.get(`/feed?page=${pageNum}&per_page=20`);
      const newPosts = res.data?.data || [];
      if (append) setPosts((prev) => [...prev, ...newPosts]);
      else setPosts(newPosts);
      setHasMore(newPosts.length >= 20);
      setPage(pageNum);
    } catch (e) {
      if (e?.response?.status !== 401) setError(t("feedError"));
    }
    loadingRef.current = false;
    setLoading(false);
  }, [t]);

  const loadStories = useCallback(async () => {
    try { const res = await client.get("/stories"); setStories(res.data || []); } catch (e) {}
  }, []);

  const loadHighlights = useCallback(async () => {
    try { const res = await client.get("/stories/highlights/all"); setHighlights(res.data || []); } catch (e) {}
  }, []);

  const refreshAll = useCallback(() => { loadPosts(1); loadStories(); loadHighlights(); }, [loadPosts, loadStories, loadHighlights]);

  useFocusEffect(useCallback(() => { loadingRef.current = false; refreshAll(); return () => { loadingRef.current = false; }; }, [refreshAll]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true); setHasMore(true);
    await Promise.all([loadPosts(1), loadStories(), loadHighlights()]);
    setRefreshing(false);
  }, [loadPosts, loadStories, loadHighlights]);

  const onEndReached = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    await loadPosts(page + 1, true);
    setLoadingMore(false);
  }, [hasMore, loadingMore, page, loadPosts]);

  const renderPost = useCallback(({ item: post }) => (
    <PostCard
      post={post}
      currentUser={user}
      onLike={likePost}
      onBookmark={toggleBookmark}
      onComment={(id) => navigation.navigate("Comments", { postId: id })}
      onShare={(id) => navigation.navigate("SharePost", { postId: id })}
      onImagePress={(p) => navigation.navigate("ImageViewer", { imageUrl: p.image, username: p.user?.username })}
      onVideoPress={(p) => navigation.navigate("VideoPost", { videoUrl: p.video, username: p.user?.username })}
      onMenuPress={(p) => {
        const isMine = p.user?.id === user?.id;
        const options = [];
        if (isMine) {
          options.push({ text: `✏️ ${t("edit")}`, onPress: () => navigation.navigate("EditPost", { postId: p.id, initialContent: p.content }) });
          options.push({ text: `🗑️ ${t("deletePost")}`, destructive: true, onPress: () => { client.delete(`/posts/${p.id}`).then(() => setPosts((prev) => prev.filter((x) => x.id !== p.id))).catch(() => {}); } });
        } else {
          options.push({ text: `⚠️ ${t("report")}`, onPress: () => { client.post("/reports", { type: "post", id: p.id, reason: "Inappropriate" }).catch(() => {}); } });
        }
        options.push({ text: t("cancel"), cancel: true });
        Alert.alert(null, null, options);
      }}
      onUserPress={(id) => navigation.navigate("UserProfile", { userId: id })}
      onLikesPress={(id) => navigation.navigate("LikeList", { postId: id })}
      navigation={navigation}
    />
  ), [user, likePost, toggleBookmark, t, navigation]);

  const likePost = useCallback((postId, liked, count) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, liked: liked ? 0 : 1, likes_count: count + (liked ? -1 : 1) } : p));
    client.post("/likes", { post_id: postId }).catch(() => setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, liked: liked ? 1 : 0, likes_count: count } : p)));
  }, []);

  const toggleBookmark = useCallback((postId) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, bookmarked: !p.bookmarked } : p));
    client.post("/bookmarks", { post_id: postId }).catch(() => setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, bookmarked: !p.bookmarked } : p)));
  }, []);

  const storiesData = useMemo(() => [
    { _k: "me", isMe: true },
    ...stories.map((s, i) => ({ ...s, _k: `s_${s.user?.id || i}` })),
  ], [stories]);

  const header = useMemo(() => (
    <View>
      <View style={[styles.topBar, { paddingTop: insets.top + SPACING.sm }]}>
        <Text style={styles.logo}>{t("sonix")}</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Notifications")} style={styles.notifBtn} hitSlop={{top:8, bottom:8, left:8, right:8}}>
          <Icon name="notifications-outline" size={18} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.storiesSection}>
        <FlatList
          horizontal
          data={storiesData}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item._k}
          contentContainerStyle={{ paddingHorizontal: SPACING.md, gap: 10 }}
          renderItem={({ item }) => {
            if (item.isMe) {
              return (
                <TouchableOpacity style={styles.storyItem} onPress={() => navigation.navigate("CreateStory")} activeOpacity={0.7}>
                  <View style={styles.myStoryRing}>
                    <View style={styles.myStoryAvatar}>
                      {user?.avatar ? (
                        <Image source={{ uri: `${resolveUrl(user.avatar)}?t=${Date.now()}` }} style={{ width: 56, height: 56, borderRadius: 28 }} />
                      ) : (
                        <Text style={styles.myStoryInitial}>{user?.username?.[0]?.toUpperCase() || "?"}</Text>
                      )}
                    </View>
                    <View style={styles.plusBadge}><Text style={styles.plusText}>+</Text></View>
                  </View>
                  <Text style={styles.storyLabel}>{t("yourStory")}</Text>
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity style={styles.storyItem} onPress={() => navigation.navigate("StoryViewer", { stories: item.stories, user: item.user })} activeOpacity={0.7}>
                <View style={[styles.storyRing, !item.has_unseen && { borderColor: COLORS.border }]}>
                  <View style={styles.storyAvatarInner}>
                    {item.user?.avatar ? (
                      <Image source={{ uri: `${resolveUrl(item.user.avatar)}${item.user?.id === user?.id ? "?t=" + Date.now() : ""}` }} style={{ width: 54, height: 54, borderRadius: 27 }} />
                    ) : (
                      <Text style={styles.storyInitial}>{item.user?.username?.[0]?.toUpperCase() || "?"}</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.storyLabel} numberOfLines={1}>{item.user?.username}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  ), [insets, storiesData, user, highlights, t, navigation]);

  if (loading && posts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.topBar, { paddingTop: insets.top + SPACING.sm }]}>
          <Text style={styles.logo}>{t("sonix")}</Text>
        </View>
        <FlatList data={[1, 2, 3]} renderItem={() => <PostSkeleton />} keyExtractor={(i) => String(i)} contentContainerStyle={{ padding: SPACING.md }} />
      </View>
    );
  }

  if (error && posts.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ErrorState message={error} onRetry={() => loadPosts(1)} />
      </View>
    );
  }

  if (!isOnline && posts.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <OfflineState onRetry={() => loadPosts(1)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <FlatList
        data={posts}
        keyExtractor={(p) => String(p.id)}
        ListHeaderComponent={header}
        extraData={posts.length}
        initialNumToRender={4}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews
        ListEmptyComponent={
          <EmptyState
            icon="sparkles"
            title={t("emptyFeed")}
            message={t("followPeople")}
            actionLabel={t("findPeople")}
            onAction={() => navigation.getParent()?.navigate("Explore")}
          />
        }
        ListFooterComponent={loadingMore ? (
          <View style={styles.loadingFooter}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.loadingDot, i > 0 && { opacity: 1 - i * 0.3 }]} />
            ))}
          </View>
        ) : null}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
        renderItem={renderPost}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.screenBg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  logo: { fontSize: 28, fontWeight: "900", color: COLORS.text, letterSpacing: 2 },
  notifBtn: { width: 40, height: 40, borderRadius: RADIUS.xxl, backgroundColor: GLASS.default.backgroundColor, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: GLASS.default.borderColor },
  notifIcon: { fontSize: 18 },

  storiesSection: { paddingVertical: SPACING.sm, paddingBottom: SPACING.md },
  storyItem: { alignItems: "center", width: 70 },
  myStoryRing: { width: 68, height: 68, borderRadius: 34, borderWidth: 2, borderColor: COLORS.primaryGlow, alignItems: "center", justifyContent: "center", marginBottom: SPACING.xs },
  myStoryAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.cardElevated, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  myStoryInitial: { color: COLORS.primary, fontSize: 22, fontWeight: "700" },
  plusBadge: { position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", borderWidth: 2.5, borderColor: COLORS.bg },
  plusText: { color: COLORS.text, ...TYPOGRAPHY.bodyBold, marginTop: -1 },
  storyRing: { width: 68, height: 68, borderRadius: 34, borderWidth: 3, borderColor: COLORS.accent, padding: SPACING.xxs, marginBottom: SPACING.xs },
  storyAvatarInner: { width: "100%", height: "100%", borderRadius: 29, backgroundColor: COLORS.cardElevated, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  storyInitial: { color: COLORS.text, fontSize: 22, fontWeight: "700" },
  storyLabel: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, textAlign: "center", maxWidth: 68 },

  card: { marginBottom: SPACING.sm, borderRadius: RADIUS.xl, padding: SPACING.md, marginHorizontal: SPACING.sm, backgroundColor: GLASS.default.backgroundColor, borderWidth: 1, borderColor: GLASS.default.borderColor, ...SHADOWS.glass },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.sm },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardUsername: { fontSize: SIZES.md, fontWeight: "700", color: COLORS.text },
  cardTime: { fontSize: SIZES.xs, color: COLORS.muted },
  menuBtn: { padding: SPACING.xs, width: 32, height: 32, borderRadius: RADIUS.xl, backgroundColor: COLORS.glassLight, alignItems: "center", justifyContent: "center" },
  menuDots: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "900", letterSpacing: 1 },

  mediaWrap: { position: "relative", borderRadius: RADIUS.lg, overflow: "hidden" },
  postImg: { width: "100%", height: SCREEN_W - 40, borderRadius: RADIUS.lg, backgroundColor: COLORS.cardElevated },
  playOverlay: { position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" },
  playCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.overlayLight, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.2)" },
  playIcon: { color: COLORS.white, fontSize: 24, marginLeft: 4 },

  heartOverlay: { position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", zIndex: 10 },
  heartBig: { fontSize: 80 },

  contentWrap: { paddingVertical: SPACING.sm },
  textOnly: { paddingHorizontal: 4, paddingVertical: SPACING.md },
  contentText: { fontSize: SIZES.md, color: COLORS.text, lineHeight: 22 },
  contentUser: { fontWeight: "700", color: COLORS.primaryLight },

  actionsBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: SPACING.xs, marginTop: SPACING.xs },
  actionsLeft: { flexDirection: "row", alignItems: "center", gap: SPACING.xl },
  actionBtn: { padding: 6 },
  actionIcon: { fontSize: 22 },

  likesText: { fontSize: SIZES.sm, fontWeight: "700", color: COLORS.text, paddingVertical: 2 },
  commentsPreview: { paddingVertical: SPACING.xs, gap: SPACING.xs },
  commentRow: { flexDirection: "row", gap: SPACING.xs, alignItems: "center" },
  commentUser: { fontSize: SIZES.sm, fontWeight: "700", color: COLORS.text },
  commentText: { fontSize: SIZES.sm, color: COLORS.textTertiary, flex: 1 },
  viewAllComments: { fontSize: SIZES.sm, color: COLORS.muted, paddingVertical: SPACING.xs },
  hashtag: { color: COLORS.accent, fontWeight: "600" },
  mention: { color: COLORS.primaryLight, fontWeight: "600" },

  loadingFooter: { flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: SPACING.xl },
  loadingDot: { width: 8, height: 8, borderRadius: RADIUS.xs, backgroundColor: COLORS.primary },
});
