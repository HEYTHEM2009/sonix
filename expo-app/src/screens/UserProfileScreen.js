import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import client, { resolveUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Screen3D from "../components/3D/Screen3D";
import { COLORS, SIZES, FONTS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS, LAYOUT } from "../design/DesignSystem";
import Icon from "../design/ui/Icon";

export default function UserProfileScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { userId = null } = route?.params || {};
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [followState, setFollowState] = useState("none");
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const { user: currentUser } = useAuth();
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const userRes = await client.get(`/users/${userId}`);
      const realId = userRes.data.id;
      const [postsRes, statsRes, statusRes, blockRes] = await Promise.all([
        client.get(`/posts/user/${realId}`),
        client.get(`/users/${realId}/stats`),
        client.get(`/follow/${realId}/status`),
        client.get(`/block/${realId}/status`),
      ]);
      setProfile(userRes.data);
      setPosts(postsRes.data?.data || []);
      setStats(statsRes.data);
      if (statusRes.data.following) setFollowState("following");
      else if (statusRes.data.requested) setFollowState("requested");
      else setFollowState("none");
      setBlocked(blockRes.data.blocked);
    } catch (e) { console.warn("Profile load error", e?.response?.status); }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const toggleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      const res = await client.post("/follow", { following_id: profile.id });
      if (res.data.requested) setFollowState("requested");
      else if (res.data.following) setFollowState("following");
      else setFollowState("none");
      load();
    } catch (e) { console.warn("Follow error", e?.response?.status); }
    setFollowLoading(false);
  };

  const toggleBlock = () => {
    Alert.alert(blocked ? t("unblock") : t("block"), (blocked ? t("unblockConfirm") : t("blockConfirm")).replace("{username}", profile?.username || ""), [
      { text: t("cancel"), style: "cancel" },
      { text: blocked ? t("unblock") : t("block"), style: "destructive", onPress: async () => {
        try {
          const res = await client.post("/block", { blocked_id: profile.id });
          setBlocked(res.data.blocked);
        } catch (e) { console.warn("Block error", e?.response?.status); }
      }},
    ]);
  };

  if (loading) {
    return <Screen3D noParticles><View style={[s.loadingWrap, { paddingTop: insets.top }]}><ActivityIndicator size="large" color={COLORS.text} /></View></Screen3D>;
  }

  return (
    <Screen3D noParticles>
    <FlatList
      style={s.list}
      data={posts}
      numColumns={3}
      keyExtractor={(p) => String(p.id)}
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 30) }}
      columnWrapperStyle={posts.length > 0 ? { gap: 2 } : null}
      ListHeaderComponent={() => (
        <View>
          <View style={[s.topBar, { paddingTop: insets.top + 6 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Icon name="arrow-back" size={22} color={COLORS.text} /></TouchableOpacity>
            <Text style={s.topTitle}>{profile?.username}</Text>
            <TouchableOpacity onPress={toggleBlock}><Text style={s.blockBtn}>{blocked ? t("unblock") : "•••"}</Text></TouchableOpacity>
          </View>

          <View style={s.card}>
            <View style={s.topRow}>
              <View style={s.avatarRing}>
                <View style={s.avatarInner}><Text style={s.avatarText}>{profile?.username?.[0]?.toUpperCase() || "?"}</Text></View>
              </View>
              <View style={s.statsRow}>
                <View style={s.statItem}><Text style={s.statNum}>{stats?.posts || 0}</Text><Text style={s.statLbl}>{t("posts")}</Text></View>
                <View style={s.statItem}><Text style={s.statNum}>{stats?.followers || 0}</Text><Text style={s.statLbl}>{t("followers")}</Text></View>
                <View style={s.statItem}><Text style={s.statNum}>{stats?.following || 0}</Text><Text style={s.statLbl}>{t("following")}</Text></View>
              </View>
            </View>
            <Text style={s.name}>{profile?.username}</Text>
            {profile?.bio && <Text style={s.bio}>{profile.bio}</Text>}

            {currentUser && parseInt(userId) !== currentUser.id && (
              <View style={s.btnRow}>
                <TouchableOpacity onPress={toggleFollow} disabled={followLoading} style={[s.followBtn, { flex: 1, backgroundColor: followState === "none" ? COLORS.primary : COLORS.card }]}>
                  {followLoading ? <ActivityIndicator color={COLORS.text} size="small" /> : (
                    <Text style={s.followText}>{followState === "following" ? t("followingStatus") : followState === "requested" ? t("requested") : t("follow")}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={s.msgBtn} onPress={() => navigation.navigate("Chat", { userId, username: profile?.username })}>
                  <Text style={s.msgBtnText}>{t("messageUser")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
      ListEmptyComponent={<Text style={s.empty}>{t("noPosts")}</Text>}
      renderItem={({ item: post }) => (
        <TouchableOpacity style={s.cell}>
          {post.image && <Image source={{ uri: resolveUrl(post.image) }} style={s.cellImg} resizeMode="cover" />}
          {!post.image && <View style={s.cellText}><Text style={s.cellTextContent} numberOfLines={3}>{post.content}</Text></View>}
        </TouchableOpacity>
      )}
    />
    </Screen3D>
  );
}

const s = StyleSheet.create({
  list: { flex: 1, backgroundColor: COLORS.bg },
  loadingWrap: { flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, backgroundColor: GLASS.bg, borderBottomColor: GLASS.border, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 22, color: COLORS.text },
  topTitle: { fontSize: SIZES.lg, ...FONTS.semiBold, color: COLORS.text },
  blockBtn: { fontSize: SIZES.lg, color: COLORS.primary + "AA", ...FONTS.semiBold },
  card: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, marginBottom: 2 },
  topRow: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.md, gap: SPACING.xl },
  avatarRing: { width: 86, height: 86, borderRadius: RADIUS.full, borderWidth: 2, borderColor: COLORS.gold, alignItems: "center", justifyContent: "center" },
  avatarInner: { width: 78, height: 78, borderRadius: RADIUS.full, backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center" },
  avatarText: { color: COLORS.text, fontSize: SIZES.hero, ...FONTS.semiBold },
  statsRow: { flex: 1, flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statNum: { ...TYPOGRAPHY.h4, color: COLORS.text },
  statLbl: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  name: { fontSize: SIZES.md, ...FONTS.semiBold, color: COLORS.text, marginBottom: SPACING.xs },
  bio: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginBottom: SPACING.md },
  btnRow: { flexDirection: "row", gap: SPACING.sm },
  followBtn: { paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, alignItems: "center" },
  followText: { color: COLORS.text, ...FONTS.semiBold, fontSize: SIZES.md },
  msgBtn: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.xl, borderRadius: RADIUS.sm, backgroundColor: COLORS.card, alignItems: "center", borderWidth: 0.5, borderColor: COLORS.border },
  msgBtnText: { color: COLORS.text, ...FONTS.semiBold, fontSize: SIZES.md },
  empty: { textAlign: "center", color: COLORS.muted, padding: SPACING.xxxl },
  cell: { flex: 1, aspectRatio: 1, marginBottom: 2, overflow: "hidden" },
  cellImg: { width: "100%", height: "100%" },
  cellText: { width: "100%", height: "100%", backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center", padding: 6 },
  cellTextContent: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, textAlign: "center" },
});
