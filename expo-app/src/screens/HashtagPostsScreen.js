import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SIZES, FONTS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS, LAYOUT } from "../design/DesignSystem";
import Icon from "../design/ui/Icon";
import client, { resolveUrl } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

export default function HashtagPostsScreen({ route, navigation }) {
  const tag = route.params?.tag ?? '';
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(async (pageNum = 1) => {
    try {
      const res = await client.get(`/posts/hashtag/${tag}?per_page=20&page=${pageNum}`);
      const data = res.data;
      if (pageNum === 1) setPosts(data.data || []);
      else setPosts(prev => [...prev, ...(data.data || [])]);
      setHasMore(data.next_page_url !== null);
      setPage(pageNum);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }, [tag]);

  useEffect(() => { fetchPosts(1); }, [fetchPosts]);

  const renderPost = ({ item }) => (
    <TouchableOpacity style={s.postCard} onPress={() => navigation.navigate("Comments", { postId: item.id })} activeOpacity={0.8}>
      <View style={s.postHeader}>
        {item.user?.avatar ? <Image source={{ uri: resolveUrl(item.user?.avatar) }} style={s.avatar} /> : <View style={[s.avatar, { backgroundColor: COLORS.primaryGlowLight, alignItems: "center", justifyContent: "center" }]}><Text style={{ color: COLORS.primary, ...FONTS.bold, fontSize: 12 }}>{item.user?.username?.[0]?.toUpperCase() || "?"}</Text></View>}
        <Text style={s.username}>{item.user?.username}</Text>
      </View>
      {item.image && <Image source={{ uri: resolveUrl(item.image) }} style={s.postImg} resizeMode="cover" />}
      {item.content ? <Text style={s.content} numberOfLines={3}>{item.content}</Text> : null}
      <View style={s.statsRow}>
        <Text style={s.stat}>{t("likes").replace("{count}", item.likes_count || 0)}</Text>
        <Text style={s.stat}>{t("commentsCount").replace("{count}", item.comments_count || 0)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><Icon name="arrow-back" size={20} color={COLORS.gold} /><Text style={s.backBtn}>{t("back")}</Text></TouchableOpacity>
          <Text style={s.title}>#{tag}</Text>
          <View style={{ width: 60 }} />
        </View>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><Icon name="arrow-back" size={20} color={COLORS.gold} /><Text style={s.backBtn}>{t("back")}</Text></TouchableOpacity>
        <Text style={s.title}>#{tag}</Text>
        <View style={{ width: 60 }} />
      </View>
      <FlatList
        data={posts}
        keyExtractor={item => String(item.id)}
        renderItem={renderPost}
        contentContainerStyle={{ paddingBottom: SPACING.huge }}
        ListEmptyComponent={<Text style={s.empty}>{t("noResults")}</Text>}
        onEndReached={() => { if (hasMore && !loading) fetchPosts(page + 1); }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={hasMore ? <ActivityIndicator size="small" color={COLORS.primary} /> : null}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, ...GLASS.default },
  backBtn: { fontSize: SIZES.md, color: COLORS.gold },
  title: { fontSize: SIZES.lg, ...FONTS.bold, color: COLORS.text },
  postCard: { ...GLASS.elevated, marginHorizontal: SPACING.md, marginTop: SPACING.md, borderRadius: RADIUS.md, padding: SPACING.md, overflow: "hidden", ...SHADOWS.glass },
  postHeader: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.sm, gap: SPACING.sm },
  avatar: { width: 32, height: 32, borderRadius: RADIUS.full, backgroundColor: COLORS.border },
  username: { ...FONTS.semiBold, color: COLORS.text, fontSize: SIZES.sm },
  postImg: { width: "100%", height: 200, borderRadius: RADIUS.sm, marginBottom: SPACING.sm },
  content: { color: COLORS.text, fontSize: SIZES.md, lineHeight: 20 },
  statsRow: { flexDirection: "row", gap: SPACING.lg, marginTop: SPACING.sm },
  stat: { fontSize: SIZES.sm, color: COLORS.muted },
  empty: { textAlign: "center", marginTop: 60, color: COLORS.muted, fontSize: SIZES.md },
});
