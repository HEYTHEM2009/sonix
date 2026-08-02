import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import client, { resolveUrl } from "../api/client";
import { COLORS, SIZES, FONTS, SPACING, RADIUS, SHADOWS, GLASS, TYPOGRAPHY, LAYOUT } from "../design/DesignSystem";
import { useLanguage } from "../context/LanguageContext";
import Screen3D from "../components/3D/Screen3D";
import Icon from "../design/ui/Icon";

export default function SavedPostsScreen({ navigation }) {
  const { t } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (pageNum = 1, append = false) => {
    try {
      const res = await client.get(`/bookmarks?page=${pageNum}`);
      const newPosts = res.data?.data || [];
      if (append) setPosts((p) => [...p, ...newPosts]);
      else setPosts(newPosts);
      setHasMore(newPosts.length >= 20);
      setPage(pageNum);
    } catch (e) { console.warn("Saved load error", e?.response?.status); }
    setLoading(false);
  }, []);

  useEffect(() => { load(1); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(1); setRefreshing(false); };

  const postsGrid = [];
  for (let i = 0; i < posts.length; i += 3) {
    postsGrid.push(posts.slice(i, i + 3));
  }

  const insets = useSafeAreaInsets();

  return (
    <Screen3D>
      <View style={[s.topBar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="arrow-back" size={SIZES.xxl} color={COLORS.text} /></TouchableOpacity>
        <Text style={s.title}>{t("savedPosts")}</Text>
        <View style={{ width: 36 }} />
      </View>
      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={postsGrid}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 30) }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.text} colors={[COLORS.text]} />}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Icon name="bookmark-outline" size={36} color={COLORS.muted} />
              <Text style={s.empty}>{t("noSavedPosts")}</Text>
            </View>
          }
          renderItem={({ item: row }) => (
            <View style={s.row}>
              {row.map((post) => (
                <TouchableOpacity key={post.id} style={s.cell} activeOpacity={0.8} onPress={() => navigation.navigate("Comments", { postId: post.id })}>
                  {post.image ? <Image source={{ uri: resolveUrl(post.image) }} style={s.cellImg} resizeMode="cover" />
                  : <View style={s.cellText}><Text style={s.cellTextContent} numberOfLines={3}>{post.content}</Text></View>}
                </TouchableOpacity>
              ))}
              {row.length < 3 && <View style={{ flex: 3 - row.length }} />}
            </View>
          )}
        />
      )}
    </Screen3D>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingBottom: SPACING.sm + 2, paddingHorizontal: SPACING.md, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backText: { fontSize: SIZES.xxl, color: COLORS.text },
  title: { fontSize: SIZES.md, ...FONTS.semiBold, color: COLORS.text },
  emptyWrap: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 36, marginBottom: SPACING.sm },
  empty: { textAlign: "center", ...TYPOGRAPHY.body, color: COLORS.muted },
  row: { flexDirection: "row", gap: SPACING.xxs, marginBottom: SPACING.xxs },
  cell: { flex: 1, aspectRatio: 1, overflow: "hidden" },
  cellImg: { width: "100%", height: "100%" },
  cellText: { width: "100%", height: "100%", backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center", padding: SPACING.xs + 2 },
  cellTextContent: { fontSize: 10, color: COLORS.textSecondary, textAlign: "center" },
});
