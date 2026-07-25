import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, RefreshControl, Dimensions, Animated } from "react-native";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import client, { resolveUrl } from "../api/client";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS, LAYOUT } from "../design/DesignSystem";
import Avatar from "../design/ui/Avatar";
import Button, { IconButton } from "../design/ui/Button";
import Card from "../design/ui/Card";
import { ProfileSkeleton } from "../design/states/LoadingState";
import ErrorState from "../design/states/ErrorState";
import Header from "../design/ui/Header";

const { width: SCREEN_W } = Dimensions.get("window");
const COLS = 3;
const GAP = 2;
const CELL = (SCREEN_W - GAP * (COLS - 1)) / COLS;

export default function ProfileScreen({ navigation }) {
  const { t } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [isPrivate, setIsPrivate] = useState(false);
  const [requests, setRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const isOnline = useNetworkStatus();
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({ inputRange: [0, 150], outputRange: [1, 0], extrapolate: "clamp" });
  const headerScale = scrollY.interpolate({ inputRange: [-100, 0, 100], outputRange: [1.15, 1, 0.95], extrapolate: "clamp" });

  const load = useCallback(async () => {
    setError(null);
    try {
      const [postsRes, statsRes, meRes] = await Promise.all([
        client.get(`/posts/user/${user.id}`),
        client.get(`/users/${user.id}/stats`),
        client.get("/users/me"),
      ]);
      setPosts(postsRes.data?.data || []);
      setStats(statsRes.data);
      setIsPrivate(!!meRes.data.is_private);
    } catch (e) {
      if (e?.response?.status !== 401) setError(t("loadError"));
    }
    setLoading(false);
  }, [user, t]);

  useEffect(() => { load(); }, [load]);

  const loadRequests = async () => {
    try { const res = await client.get("/follow/requests"); setRequests(res.data || []); setShowRequests(true); } catch (e) {}
  };
  const approveRequest = async (id) => {
    try { await client.post(`/follow/approve/${id}`); setRequests((p) => p.filter((r) => r.id !== id)); load(); } catch (e) {}
  };
  const rejectRequest = async (id) => {
    try { await client.post(`/follow/reject/${id}`); setRequests((p) => p.filter((r) => r.id !== id)); } catch (e) {}
  };
  const togglePrivacy = async () => {
    try { const res = await client.post("/users/toggle-privacy"); setIsPrivate(res.data.is_private); } catch (e) {}
  };

  const header = useMemo(() => (
    <View>
      <Animated.View style={[styles.heroSection, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
        <LinearGradient colors={[COLORS.gradientPremium[0] + "40", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroGradient} />
        <View style={[styles.heroContent, { paddingTop: insets.top + SPACING.xl }]}>
          <View style={styles.heroTop}>
            <Text style={styles.username}>{user?.username}</Text>
            <View style={styles.topActions}>
              <IconButton icon="⚙️" onPress={() => navigation.navigate("Settings")} color={COLORS.text} bgColor="rgba(255,255,255,0.05)" size={38} />
              <IconButton icon="🚪" onPress={logout} color={COLORS.dangerLight} bgColor="rgba(255,255,255,0.03)" size={38} />
            </View>
          </View>
          <View style={styles.heroBody}>
            <Avatar source={user?.avatar ? `${resolveUrl(user.avatar)}?t=${Date.now()}` : null} username={user?.username} size="hero" story elevated />
            <View style={styles.heroStats}>
              <View style={[styles.glassStat, { alignItems: "center" }]}>
                <Text style={styles.statNum}>{stats.posts}</Text>
                <Text style={styles.statLbl}>{t("posts")}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate("Followers")} style={styles.glassStat}>
                <Text style={[styles.statNum, { textAlign: "center" }]}>{stats.followers}</Text>
                <Text style={styles.statLbl}>{t("followers")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("Followers", { tab: "following" })} style={styles.glassStat}>
                <Text style={[styles.statNum, { textAlign: "center" }]}>{stats.following}</Text>
                <Text style={styles.statLbl}>{t("following")}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.name}>{user?.name || user?.username}</Text>
          {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}
          <View style={styles.privacyRow}>
            <View style={[styles.privacyBadge, isPrivate && { backgroundColor: COLORS.accent + "25", borderColor: COLORS.accent + "40" }]}>
              <Text style={[styles.privacyText, isPrivate && { color: COLORS.accent }]}>{isPrivate ? `🔒 ${t("private")}` : `🌐 ${t("public")}`}</Text>
            </View>
          </View>
          <View style={styles.btnRow}>
            <Button title={t("editProfile")} variant="primary" size="sm" onPress={() => navigation.navigate("EditProfile")} style={{ flex: 1 }} />
            <Button title={isPrivate ? t("makePublic") : t("makePrivate")} variant="glass" size="sm" onPress={togglePrivacy} style={{ flex: 1 }} />
            {isPrivate && (
              <Button title={`${t("requests")}${requests.length > 0 ? ` (${requests.length})` : ""}`} variant="accent" size="sm" onPress={loadRequests} />
            )}
          </View>
        </View>
      </Animated.View>

      <View style={styles.savedSection}>
        <TouchableOpacity style={[styles.glassRow, { marginBottom: SPACING.sm }]} onPress={() => navigation.navigate("SavedPosts")}>
          <Text style={styles.savedIcon}>🔖</Text>
          <Text style={styles.savedLabel}>{t("saved")}</Text>
          <Text style={styles.savedArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.glassRow} onPress={() => navigation.navigate("Highlights")}>
          <Text style={styles.savedIcon}>✨</Text>
          <Text style={styles.savedLabel}>{t("highlights")}</Text>
          <Text style={styles.savedArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {showRequests && requests.length > 0 && (
        <Card glass style={{ marginHorizontal: SPACING.lg, marginBottom: SPACING.md }}>
          {requests.map((r) => (
            <View key={r.id} style={styles.reqRow}>
              <Avatar source={null} username={r.follower?.username} size="sm" />
              <Text style={styles.reqName}>{r.follower?.username}</Text>
              <View style={styles.reqActions}>
                <TouchableOpacity onPress={() => approveRequest(r.id)} style={styles.approveBtn}>
                  <Text style={styles.btnCheck}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => rejectRequest(r.id)} style={styles.rejectBtn}>
                  <Text style={styles.btnX}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </Card>
      )}

      {posts.length === 0 && !loading && (
        <View style={styles.emptyPosts}>
          <Text style={styles.emptyIcon}>📷</Text>
          <Text style={styles.emptyTitle}>{t("noPosts")}</Text>
        </View>
      )}
    </View>
  ), [user, stats, isPrivate, requests, showRequests, insets, t, navigation, logout, loadRequests, approveRequest, rejectRequest, togglePrivacy, headerOpacity, headerScale]);

  if (loading) {
    return <View style={[styles.container, { paddingTop: insets.top }]}><ProfileSkeleton /></View>;
  }

  if (error) {
    return <View style={[styles.container, { paddingTop: insets.top }]}><ErrorState message={error} onRetry={load} /></View>;
  }

  return (
    <View style={styles.container}>
      <AnimatedFlatList
        data={posts}
        numColumns={COLS}
        keyExtractor={(p) => String(p.id)}
        ListHeaderComponent={header}
        columnWrapperStyle={posts.length > 0 ? { gap: GAP, paddingHorizontal: GAP / 2 } : null}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 80, 30) }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={COLORS.text} colors={[COLORS.text]} />}
        renderItem={({ item: post }) => (
          <TouchableOpacity style={styles.cell} activeOpacity={0.7}>
            {post.image ? (
              <Image source={{ uri: resolveUrl(post.image) }} style={styles.cellImg} resizeMode="cover" />
            ) : (
              <View style={styles.cellTextWrap}><Text style={styles.cellText} numberOfLines={4}>{post.content}</Text></View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.screenBg },
  heroSection: { position: "relative", overflow: "hidden" },
  heroGradient: { position: "absolute", top: 0, left: 0, right: 0, height: 300 },
  heroContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.xl },
  username: { ...TYPOGRAPHY.h2, color: COLORS.text },
  topActions: { flexDirection: "row", gap: SPACING.sm },
  heroBody: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.xxl, marginBottom: SPACING.lg },
  heroStats: { flex: 1, flexDirection: "row", justifyContent: "space-around", marginTop: SPACING.sm },

  glassStat: {
    alignItems: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: GLASS.default.backgroundColor,
    borderWidth: 1,
    borderColor: GLASS.default.borderColor,
    minWidth: 70,
  },
  statNum: { ...TYPOGRAPHY.h3, color: COLORS.text, fontWeight: "800" },
  statLbl: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, marginTop: 2 },

  name: { ...TYPOGRAPHY.bodyBold, color: COLORS.text, marginBottom: 2 },
  bio: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, lineHeight: 18, marginBottom: SPACING.md },
  privacyRow: { flexDirection: "row", marginBottom: SPACING.md },
  privacyBadge: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, backgroundColor: GLASS.default.backgroundColor, borderWidth: 1, borderColor: GLASS.default.borderColor, alignSelf: "flex-start" },
  privacyText: { ...TYPOGRAPHY.smallBold, color: COLORS.primaryLight },

  btnRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.md },

  savedSection: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  glassRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    backgroundColor: GLASS.default.backgroundColor,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: GLASS.default.borderColor,
  },
  savedIcon: { fontSize: 18, marginRight: SPACING.md },
  savedLabel: { ...TYPOGRAPHY.body, color: COLORS.text, flex: 1 },
  savedArrow: { ...TYPOGRAPHY.body, color: COLORS.muted },

  reqRow: { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.sm, gap: SPACING.md },
  reqName: { flex: 1, ...TYPOGRAPHY.bodyBold, color: COLORS.text },
  reqActions: { flexDirection: "row", gap: SPACING.sm },
  approveBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.success, alignItems: "center", justifyContent: "center" },
  btnCheck: { color: "#fff", fontSize: 16, fontWeight: "700" },
  rejectBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: GLASS.default.borderColor },
  btnX: { color: COLORS.danger, fontSize: 16, fontWeight: "700" },

  emptyPosts: { alignItems: "center", paddingTop: SPACING.huge },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyTitle: { ...TYPOGRAPHY.body, color: COLORS.muted },

  cell: { width: CELL, height: CELL, marginBottom: GAP, borderRadius: 4, overflow: "hidden" },
  cellImg: { width: "100%", height: "100%" },
  cellTextWrap: { width: "100%", height: "100%", backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center", padding: 6 },
  cellText: { fontSize: 11, color: COLORS.textSecondary, textAlign: "center" },
});
