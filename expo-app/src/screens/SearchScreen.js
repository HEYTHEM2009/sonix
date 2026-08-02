import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import searchApi from "../api/search";
import reelsApi from "../api/reels";
import UserCard from "../components/UserCard";
import Icon from "../design/ui/Icon";
import { COLORS, SIZES, FONTS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS, LAYOUT } from "../design/DesignSystem";

const { width: SCREEN_W } = Dimensions.get("window");
const TABS = ["all", "users", "reels", "hashtags", "audio"];

export default function SearchScreen({ navigation }) {
  const { t } = useLanguage();
  const toast = useToast();
  const { user: currentUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [results, setResults] = useState({ users: [], reels: [], hashtags: [], audio: [] });
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState([]);
  const debounceRef = useRef(null);

  const loadTrending = useCallback(async () => {
    try {
      const res = await searchApi.trending({ limit: 20 });
      setTrending(Object.keys(res.data?.data || {}));
    } catch (e) {}
  }, []);

  useEffect(() => {
    loadTrending();
  }, [loadTrending]);

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults({ users: [], reels: [], hashtags: [], audio: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await searchApi.suggestions(q, { limit: 15 });
      const d = res.data?.data || {};
      setResults({
        users: d.users?.data || [],
        reels: d.reels?.data || [],
        hashtags: d.hashtags || {},
        audio: d.audio?.data || [],
      });
    } catch (e) {
      toast.error(t("searchFailed") || "Search failed");
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  const onChange = (text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), 350);
  };

  const openHashtag = (tag) => {
    navigation.navigate("Reels", { hashtag: tag });
  };

  const filteredUsers =
    tab === "all" || tab === "users" ? results.users : [];
  const filteredReels =
    tab === "all" || tab === "reels" ? results.reels : [];
  const filteredHashtags =
    tab === "all" || tab === "hashtags" ? Object.keys(results.hashtags) : [];
  const filteredAudio =
    tab === "all" || tab === "audio" ? results.audio : [];

  const renderItem = ({ item }) => {
    if (item.__type === "user") {
      return (
        <UserCard
          user={item}
          onPress={(u) =>
            navigation.navigate(u.id === currentUser?.id ? "Profile" : "UserProfile", { userId: u.id })
          }
          t={t}
        />
      );
    }
    if (item.__type === "reel") {
      return (
        <TouchableOpacity
          style={styles.reelRow}
          onPress={() => navigation.navigate("Reels", { reelId: item.id })}
        >
          <Text style={styles.reelCaption} numberOfLines={1}>@{item.user?.username}: {item.caption || "(no caption)"}</Text>
          <Text style={styles.reelMusic}>{item.music_title || ""}</Text>
        </TouchableOpacity>
      );
    }
    if (item.__type === "hashtag") {
      return (
        <TouchableOpacity style={styles.hashtagRow} onPress={() => openHashtag(item.tag)}>
          <Text style={styles.hashtag}>#{item.tag}</Text>
          <Text style={styles.hashtagCount}>{item.count} posts</Text>
        </TouchableOpacity>
      );
    }
    if (item.__type === "audio") {
      return (
        <TouchableOpacity style={styles.audioRow} activeOpacity={0.8} onPress={() => navigation.navigate("Reels", { musicId: item.id, musicTitle: item.title || item.music_title })}>
          <Icon name="musical-note" size={14} color={COLORS.textSecondary} style={{ marginRight: SPACING.sm }} />
          <Text style={styles.audioTitle} numberOfLines={1}>
            {item.title || item.music_title}{item.artist ? " — " + item.artist : ""}
          </Text>
          {item.genre ? <Text style={styles.audioGenre}>{item.genre}</Text> : null}
        </TouchableOpacity>
      );
    }
    return null;
  };

  const data = [
    ...filteredUsers.map((u) => ({ ...u, __type: "user", key: `u-${u.id}` })),
    ...filteredReels.map((r) => ({ ...r, __type: "reel", key: `r-${r.id}` })),
    ...filteredHashtags.map((tag) => ({ tag, count: results.hashtags[tag], __type: "hashtag", key: `h-${tag}` })),
    ...filteredAudio.map((a) => ({ ...a, __type: "audio", key: `a-${a.id ?? (a.title || a.music_title)}` })),
  ];

  const showTrending = !query.trim();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder={t("search") || "Search users, reels, hashtags..."}
          placeholderTextColor={COLORS.placeholder}
          value={query}
          onChangeText={onChange}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(""); onChange(""); }} hitSlop={{top:8, bottom:8, left:8, right:8}}>
            <Icon name="close" size={16} color={COLORS.muted} style={{ marginLeft: SPACING.sm }} />
          </TouchableOpacity>
        )}
      </View>

      {!showTrending && (
        <View style={styles.tabs}>
          {TABS.map((tb) => (
            <TouchableOpacity
              key={tb}
              style={[styles.tab, tab === tb && styles.tabActive]}
              onPress={() => setTab(tb)}
              hitSlop={{top:8, bottom:8}}
            >
              <Text style={[styles.tabText, tab === tb && styles.tabTextActive]}>
                {t(tb) || tb}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showTrending ? (
        <FlatList
          data={trending}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<Text style={styles.sectionTitle}>{t("trending") || "Trending"}</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.hashtagRow} onPress={() => openHashtag(item)}>
              <Text style={styles.hashtag}>#{item}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={loading ? <ActivityIndicator color={COLORS.white} style={{ marginTop: 40 }} /> : null}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={COLORS.white} style={{ marginTop: 40 }} />
            ) : (
              <Text style={styles.empty}>{t("noResults") || "No results"}</Text>
            )
          }
        />
      )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GLASS.bg,
    margin: SPACING.md,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    height: 46,
    borderWidth: 1,
    borderColor: GLASS.border,
    ...SHADOWS.sm,
  },
  input: { flex: 1, color: COLORS.text, fontSize: SIZES.sm },
  clear: { color: COLORS.muted, fontSize: 16, marginLeft: SPACING.sm },
  tabs: { flexDirection: "row", paddingHorizontal: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.xs },
  tab: { paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: GLASS.bg, borderWidth: 1, borderColor: "transparent" },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.muted, fontSize: SIZES.xs, ...FONTS.semiBold },
  tabTextActive: { color: COLORS.text },
  list: { paddingBottom: 40 },
  sectionTitle: { color: COLORS.text, fontSize: SIZES.lg, ...FONTS.bold, margin: SPACING.lg, marginTop: SPACING.sm },
  hashtagRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: GLASS.border,
  },
  hashtag: { color: COLORS.primary, fontSize: SIZES.sm, ...FONTS.bold },
  hashtagCount: { color: COLORS.muted, fontSize: SIZES.xs },
  reelRow: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: GLASS.border },
  reelCaption: { color: COLORS.textSecondary, fontSize: SIZES.sm },
  reelMusic: { color: COLORS.muted, fontSize: SIZES.xs, marginTop: SPACING.xs },
  audioRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: GLASS.border },
  audioIcon: { fontSize: 14, marginRight: SPACING.sm },
  audioTitle: { color: COLORS.text, fontSize: SIZES.sm, flex: 1 },
  audioGenre: { color: COLORS.muted, fontSize: SIZES.xs, marginLeft: SPACING.sm },
  empty: { color: COLORS.muted, textAlign: "center", marginTop: 60, fontSize: SIZES.sm },
});
