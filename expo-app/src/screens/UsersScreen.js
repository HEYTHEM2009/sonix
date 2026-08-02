import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import client, { resolveUrl } from "../api/client";
import { COLORS, SIZES, FONTS, SPACING, RADIUS, SHADOWS, GLASS, TYPOGRAPHY, LAYOUT } from "../design/DesignSystem";
import Icon from "../design/ui/Icon";
import Screen3D from "../components/3D/Screen3D";
import AsyncStorage from "@react-native-async-storage/async-storage";

const RECENT_KEY = "recent_searches";
const PER_PAGE = 20;

function fmtCount(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

export default function UsersScreen({ navigation }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [recent, setRecent] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [followingIds, setFollowingIds] = useState(new Set());
  const [requestedIds, setRequestedIds] = useState(new Set());

  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // Debounce query — 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!user) return;
    client.get(`/follow/${user.id}/following`).then((res) => {
      setFollowingIds(new Set((res.data || []).map((f) => f.following_id || f.following?.id)));
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY).then((v) => {
      if (v) setRecent(JSON.parse(v));
    });
  }, []);

  // Suggestions when typing (short query)
  useEffect(() => {
    if (debounced.length < 1) { setSuggestions([]); setShowSuggestions(false); return; }
    if (debounced.length < 2) return;
    const ctrl = new AbortController();
    client.get("/users/search/suggestions", { params: { q: debounced }, signal: ctrl.signal })
      .then((res) => { setSuggestions(res.data || []); setShowSuggestions(true); })
      .catch(() => {});
    return () => ctrl.abort();
  }, [debounced]);

  // Search
  const doSearch = useCallback(async (q, pageNum = 1, append = false) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const params = { q, per_page: PER_PAGE, page: pageNum };
      if (filterType !== "all") params.is_private = filterType === "private" ? "1" : "0";
      const res = await client.get("/users/search", { params, signal: ctrl.signal });
      const data = res.data?.data || res.data || [];
      if (append) {
        setResults((prev) => [...prev, ...data]);
      } else {
        setResults(data);
      }
      setHasMore(data.length >= PER_PAGE);
      setPage(pageNum);
    } catch (e) {
      if (e.name !== "CanceledError" && e.code !== "ERR_CANCELED") {
        setError(t("searchError"));
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      if (pageNum === 1) setRefreshing(false);
    }
  }, [filterType, t]);

  // Trigger search on debounced query
  useEffect(() => {
    if (debounced.length >= 2) {
      doSearch(debounced);
      setShowSuggestions(false);
    } else if (debounced.length === 0) {
      setResults([]);
      setHasMore(true);
      setPage(1);
      setError(null);
    }
  }, [debounced, doSearch]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || loading) return;
    doSearch(debounced, page + 1, true);
  }, [debounced, page, hasMore, loadingMore, loading, doSearch]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (debounced.length >= 2) doSearch(debounced);
    else setRefreshing(false);
  }, [debounced, doSearch]);

  const pickSuggestion = useCallback((username) => {
    setQuery(username);
    setShowSuggestions(false);
  }, []);

  const pickRecent = useCallback((u) => {
    setQuery(u.username);
  }, []);

  const toggleFollow = useCallback(async (userId) => {
    try {
      const res = await client.post("/follow", { followingId: userId });
      if (res.data.requested) setRequestedIds((p) => new Set([...p, userId]));
      else if (res.data.following) setFollowingIds((p) => new Set([...p, userId]));
      else {
        setFollowingIds((p) => { const n = new Set(p); n.delete(userId); return n; });
        setRequestedIds((p) => { const n = new Set(p); n.delete(userId); return n; });
      }
    } catch (e) { console.warn("Toggle follow error", e?.response?.status); }
  }, []);

  const getFollowState = useCallback((uid) => {
    if (uid === user?.id) return "me";
    if (followingIds.has(uid)) return "following";
    if (requestedIds.has(uid)) return "requested";
    return "follow";
  }, [user, followingIds, requestedIds]);

  const saveRecentSearch = useCallback(async (searchedUser) => {
    const updated = [searchedUser, ...recent.filter((r) => r.id !== searchedUser.id)].slice(0, 10);
    setRecent(updated);
    AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  }, [recent]);

  const clearRecent = useCallback(() => {
    Alert.alert(t("clearRecent"), t("clearRecentConfirm"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("clearRecent"), style: "destructive", onPress: () => { setRecent([]); AsyncStorage.removeItem(RECENT_KEY); } },
    ]);
  }, [t]);

  const filters = useMemo(() => [
    { key: "all", label: t("showAll") },
    { key: "public", label: t("showPublic") },
    { key: "private", label: t("showPrivate") },
  ], [t]);

  const onSearch = useCallback((q) => {
    setQuery(q);
  }, []);

  const avatarInitial = (u) => {
    if (u.avatar) {
      return <Image source={{ uri: resolveUrl(u.avatar) }} style={s.avatarImg} />;
    }
    return <Text style={s.avatarText}>{u.username?.[0]?.toUpperCase() || "?"}</Text>;
  };

  const renderUser = useCallback(({ item: u }) => {
    const state = getFollowState(u.id);
    return (
      <TouchableOpacity
        style={s.userCard}
        onPress={() => {
          if (u.id !== user?.id) saveRecentSearch({ id: u.id, username: u.username, avatar: u.avatar });
          navigation.navigate("UserProfile", { userId: u.id });
        }}
        activeOpacity={0.7}
      >
        <View style={s.avatarWrap}>
          <View style={s.avatar}>{avatarInitial(u)}</View>
          {u.is_online && <View style={s.onlineDot} />}
        </View>
        <View style={s.userInfo}>
          <View style={s.nameRow}>
            <Text style={s.username} numberOfLines={1}>{u.username}</Text>
            {u.is_private && <Text style={s.lockIcon}>(Private)</Text>}
          </View>
          {u.bio ? <Text style={s.bio} numberOfLines={1}>{u.bio}</Text> : null}
          <Text style={s.followers}>
            {fmtCount(u.followers_count || 0)} {t("followers")}
          </Text>
        </View>
        {state !== "me" && (
          <TouchableOpacity
            onPress={() => toggleFollow(u.id)}
            style={[
              s.followBtn,
              { backgroundColor: state === "follow" ? COLORS.primary : COLORS.input },
            ]}
          >
            <Text style={[s.followText, { color: state === "follow" ? COLORS.white : COLORS.textSecondary }]}>
              {state === "following" ? t("followingStatus") : state === "requested" ? t("requested") : t("follow")}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }, [getFollowState, toggleFollow, saveRecentSearch, navigation, user, t]);

  const renderSuggestion = ({ item: u }) => (
    <TouchableOpacity style={s.suggRow} onPress={() => pickSuggestion(u.username)}>
      <View style={[s.suggAvatar, { backgroundColor: COLORS.input }]}>
        {avatarInitial(u)}
      </View>
      <Text style={s.suggName}>{u.username}</Text>
    </TouchableOpacity>
  );

  const renderRecent = ({ item: u }) => (
    <TouchableOpacity style={s.recentRow} onPress={() => pickRecent(u)}>
      <View style={s.recentIcon}>
        <Icon name="time" size={10} />
      </View>
      <Text style={s.recentName} numberOfLines={1}>{u.username}</Text>
    </TouchableOpacity>
  );

  const showFilterBar = debounced.length >= 2;

  return (
    <Screen3D style={s.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Search Header */}
      <View style={[s.header, { paddingTop: insets.top + 6 }]}>
        <TextInput
          ref={inputRef}
          style={s.searchInput}
          placeholder={t("searchUsers")}
          placeholderTextColor={COLORS.muted}
          value={query}
          onChangeText={onSearch}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(""); setDebounced(""); setShowSuggestions(false); }} style={s.clearBtn}>
            <Icon name="close" size={16} color={COLORS.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter bar (only when searching) */}
      {showFilterBar && (
        <View style={s.filterBar}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilterType(f.key)}
              style={[s.filterChip, filterType === f.key && { backgroundColor: COLORS.primary }]}
            >
              <Text style={[s.filterChipText, filterType === f.key && { color: COLORS.white }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={s.suggestionsWrap}>
          <Text style={s.suggestionsLabel}>{t("searchSuggestions")}</Text>
          <FlatList
            data={suggestions}
            keyExtractor={(u) => "sugg-" + u.id}
            renderItem={renderSuggestion}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Recent searches (when search is empty) */}
      {query.length === 0 && recent.length > 0 && (
        <View style={s.recentSection}>
          <View style={s.recentHeader}>
            <Text style={s.recentLabel}>{t("recentSearches")}</Text>
            <TouchableOpacity onPress={clearRecent}>
              <Text style={s.clearText}>{t("clearRecent")}</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recent}
            keyExtractor={(u) => "rec-" + u.id}
            renderItem={renderRecent}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Search results */}
      {query.length >= 2 ? (
        loading && results.length === 0 ? (
          <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
        ) : error && results.length === 0 ? (
          <View style={s.emptyWrap}>
            <Icon name="alert-circle" size={40} style={{ marginBottom: SPACING.md }} />
            <Text style={s.empty}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(u) => String(u.id)}
            renderItem={renderUser}
            contentContainerStyle={s.listContent}
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <Icon name="search" size={40} style={{ marginBottom: SPACING.md }} />
                <Text style={s.empty}>{t("noUsersFound")}</Text>
              </View>
            }
            ListFooterComponent={loadingMore ? <ActivityIndicator color={COLORS.gold} style={{ padding: SPACING.lg }} /> : null}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            keyboardShouldPersistTaps="handled"
          />
        )
      ) : query.length === 0 ? (
        <View style={s.emptyWrap}>
          <Icon name="people" size={40} style={{ marginBottom: SPACING.md }} />
          <Text style={s.empty}>{t("searchPeople")}</Text>
        </View>
      ) : null}
      </KeyboardAvoidingView>
    </Screen3D>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.input,
    borderRadius: RADIUS.sm,
    padding: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  clearBtn: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs + 2,
  },
  clearBtnText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.muted,
  },
  filterBar: {
    flexDirection: "row",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    gap: SPACING.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  filterChip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.input,
  },
  filterChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  suggestionsWrap: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  suggestionsLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.muted,
    marginBottom: SPACING.xs + 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  suggRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    gap: SPACING.sm + 2,
  },
  suggAvatar: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  suggName: {
    color: COLORS.text,
    fontSize: 14,
    ...FONTS.medium,
  },
  recentSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  recentLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  clearText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gold,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    gap: SPACING.sm + 2,
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.input,
    alignItems: "center",
    justifyContent: "center",
  },
  recentIconText: { fontSize: 10, color: COLORS.text },
  recentName: {
    color: COLORS.text,
    fontSize: 14,
    ...FONTS.medium,
    flex: 1,
  },
  listContent: { paddingBottom: 30 },
  emptyWrap: { alignItems: "center", paddingTop: 60, paddingHorizontal: SPACING.xxl },
  emptyIcon: { fontSize: 40, marginBottom: SPACING.md },
  empty: { ...TYPOGRAPHY.body, textAlign: "center", color: COLORS.muted },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    ...GLASS.default,
  },
  avatarWrap: { position: "relative", marginRight: SPACING.sm + 2 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.input,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: 44, height: 44, borderRadius: RADIUS.full },
  avatarText: { ...TYPOGRAPHY.bodyBold, color: COLORS.text },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  userInfo: { flex: 1, marginRight: SPACING.sm },
  nameRow: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  username: { ...FONTS.semiBold, fontSize: 14, color: COLORS.text },
  lockIcon: { fontSize: 10, color: COLORS.muted },
  bio: { fontSize: 12, color: COLORS.textSecondary, marginTop: SPACING.xxs },
  followers: { ...TYPOGRAPHY.small, color: COLORS.muted, marginTop: SPACING.xxs },
  followBtn: { paddingVertical: SPACING.xs + 2, paddingHorizontal: 18, borderRadius: RADIUS.sm },
  followText: { ...TYPOGRAPHY.captionBold },
});
