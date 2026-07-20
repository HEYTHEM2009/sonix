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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import searchApi from "../api/search";
import reelsApi from "../api/reels";
import UserCard from "../components/UserCard";
import { COLORS } from "../components/Theme";

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
          <Text style={styles.audioIcon}>🎵</Text>
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
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder={t("search") || "Search users, reels, hashtags..."}
          placeholderTextColor="#888"
          value={query}
          onChangeText={onChange}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(""); onChange(""); }}>
            <Text style={styles.clear}>✕</Text>
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
          ListEmptyComponent={loading ? <ActivityIndicator color="#fff" style={{ marginTop: 40 }} /> : null}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
            ) : (
              <Text style={styles.empty}>{t("noResults") || "No results"}</Text>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D1A" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    margin: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, color: "#fff", fontSize: 15 },
  clear: { color: "#aaa", fontSize: 16, marginLeft: 8 },
  tabs: { flexDirection: "row", paddingHorizontal: 12, gap: 8, marginBottom: 6 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)" },
  tabActive: { backgroundColor: COLORS.primary || "#7c6cf7" },
  tabText: { color: "#aaa", fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  list: { paddingBottom: 40 },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700", margin: 16, marginTop: 8 },
  hashtagRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  hashtag: { color: COLORS.primary || "#7c6cf7", fontSize: 15, fontWeight: "700" },
  hashtagCount: { color: "#888", fontSize: 12 },
  reelRow: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  reelCaption: { color: "#fff", fontSize: 14 },
  reelMusic: { color: "#999", fontSize: 12, marginTop: 2 },
  audioRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  audioIcon: { fontSize: 16, marginRight: 10 },
  audioTitle: { color: "#fff", fontSize: 14, flex: 1 },
  audioGenre: { color: "#888", fontSize: 12, marginLeft: 8 },
  empty: { color: "#888", textAlign: "center", marginTop: 60, fontSize: 14 },
});
