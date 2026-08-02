import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image, TextInput, Dimensions, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "../design/ui/Icon";
import { COLORS, SIZES, FONTS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS, LAYOUT } from "../design/DesignSystem";
import client, { resolveUrl } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

const { width: SCREEN_W } = Dimensions.get("window");
const COL_W = (SCREEN_W - 36) / 3;

export default function ExploreScreen({ navigation }) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState({ trending: [], suggested: [] });
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(false);

  const fetchExplore = useCallback(async () => {
    setError(false);
    try {
      const res = await client.get("/explore");
      setData(res.data || {});
    } catch (e) {
      console.warn("Explore load error", e?.response?.status);
      setError(true);
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchExplore(); }, [fetchExplore]));

  useEffect(() => {
    if (!searchQ.trim()) { setSearchResults([]); setSearching(false); return; }
    const timeout = setTimeout(async () => {
      try {
        const res = await client.get(`/users/search?q=${encodeURIComponent(searchQ)}&per_page=10`);
        setSearchResults(res.data?.data || res.data || []);
      } catch (e) {}
      setSearching(false);
    }, 300);
    setSearching(true);
    return () => clearTimeout(timeout);
  }, [searchQ]);

  const renderTrendingPost = ({ item }) => (
    <TouchableOpacity style={s.gridItem} onPress={() => navigation.navigate("Comments", { postId: item.id })} activeOpacity={0.8}>
      {item.image ? (
        <Image source={{ uri: resolveUrl(item.image) }} style={s.gridImg} resizeMode="cover" />
      ) : (
        <View style={[s.gridImg, s.gridTextBg]}>
          <Text style={s.gridText} numberOfLines={3}>{item.content}</Text>
        </View>
      )}
      <View style={[s.gridOverlay, { flexDirection: "row", alignItems: "center" }]}>
        <Icon name="heart" size={12} color={COLORS.text} />
        <Text style={s.gridLikes}> {item.likes_count || 0}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSuggestedUser = ({ item }) => (
    <TouchableOpacity style={s.userRow} onPress={() => navigation.navigate("UserProfile", { userId: item.id })} activeOpacity={0.7}>
      {item.avatar ? <Image source={{ uri: resolveUrl(item.avatar) }} style={s.userAvatar} /> : <View style={[s.userAvatar, { backgroundColor: COLORS.primary + "30", alignItems: "center", justifyContent: "center" }]}><Text style={{ color: COLORS.primary, fontWeight: "700", fontSize: 16 }}>{item.username?.[0]?.toUpperCase() || "?"}</Text></View>}
      <View style={s.userInfo}>
        <Text style={s.userName}>{item.username}</Text>
        {item.bio ? <Text style={s.userBio} numberOfLines={1}>{item.bio}</Text> : null}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.topBar}><Text style={s.logo}>{t("sonix")}</Text></View>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.topBar}><Text style={s.logo}>{t("sonix")}</Text></View>
        <View style={s.errorWrap}>
          <Text style={s.errorText}>{t("failedToLoad")}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={fetchExplore} activeOpacity={0.8}>
            <Text style={s.retryText}>{t("retry") || "Retry"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.topBar}>
        <Text style={s.logo}>{t("sonix")}</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Notifications")} style={s.bellBtn}><Text style={s.bellIcon}>N</Text></TouchableOpacity>
      </View>

      <View style={s.searchBar}>
        <TextInput style={s.searchInput} value={searchQ} onChangeText={setSearchQ} placeholder={t("searchUsers")} placeholderTextColor={COLORS.muted} returnKeyType="search" />
        {searchQ ? <TouchableOpacity onPress={() => setSearchQ("")}><Text style={s.clearBtn}>x</Text></TouchableOpacity> : null}
      </View>

      <FlatList
        data={searchQ.trim() ? searchResults : data.suggested}
        keyExtractor={(item) => String(item.id)}
        renderItem={searchQ.trim() ? renderSuggestedUser : renderSuggestedUser}
        ListHeaderComponent={searchQ.trim() ? null : (
          <View>
            {data.trending.length > 0 && (
              <View>
                <Text style={s.sectionTitle}>{t("trending")}</Text>
                <FlatList data={data.trending} keyExtractor={(item) => String(item.id)} renderItem={renderTrendingPost} numColumns={3} scrollEnabled={false} columnWrapperStyle={s.gridRow} />
              </View>
            )}
            <Text style={s.sectionTitle}>{t("suggested")}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={searching ? <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.primary} /> : <Text style={s.empty}>{t("noResults")}</Text>}
      />
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  logo: { fontSize: 24, ...FONTS.black, color: COLORS.text },
  bellBtn: { width: 34, height: 34, borderRadius: RADIUS.md, backgroundColor: GLASS.bg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: GLASS.border },
  bellIcon: { fontSize: SIZES.sm, color: COLORS.text, ...FONTS.bold },

  searchBar: { flexDirection: "row", alignItems: "center", marginHorizontal: SPACING.lg, marginBottom: SPACING.md, backgroundColor: GLASS.bg, borderRadius: RADIUS.xl, paddingHorizontal: SPACING.md, height: 42, borderWidth: 1, borderColor: GLASS.border, ...SHADOWS.sm },
  searchInput: { flex: 1, fontSize: SIZES.sm, color: COLORS.text },
  clearBtn: { fontSize: 14, color: COLORS.muted, padding: SPACING.xs },

  sectionTitle: { fontSize: SIZES.lg, ...FONTS.bold, color: COLORS.text, paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },

  gridRow: { paddingHorizontal: SPACING.sm, gap: SPACING.xs, marginBottom: SPACING.xs },
  gridItem: { width: COL_W, height: COL_W, borderRadius: RADIUS.md, overflow: "hidden", position: "relative" },
  gridImg: { width: "100%", height: "100%" },
  gridTextBg: { backgroundColor: COLORS.surfaceLight, justifyContent: "center", padding: SPACING.xs },
  gridText: { fontSize: SIZES.xs, color: COLORS.textSecondary, lineHeight: 15 },
  gridOverlay: { position: "absolute", bottom: SPACING.xs, left: SPACING.xs, backgroundColor: COLORS.overlayLight, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.xs, paddingVertical: SPACING.xs },
  gridLikes: { color: COLORS.text, fontSize: SIZES.xs },

  userRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderBottomWidth: 0.5, borderBottomColor: GLASS.border },
  userAvatar: { width: 44, height: 44, borderRadius: RADIUS.full, backgroundColor: COLORS.border },
  userInfo: { flex: 1 },
  userName: { ...FONTS.semiBold, color: COLORS.text, fontSize: SIZES.md },
  userBio: { fontSize: SIZES.sm, color: COLORS.muted, marginTop: SPACING.xs },

  empty: { textAlign: "center", marginTop: 40, color: COLORS.muted, fontSize: SIZES.md },
  errorWrap: { alignItems: "center", marginTop: 80 },
  errorText: { color: COLORS.muted, fontSize: SIZES.md, marginBottom: SPACING.lg },
  retryBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm, ...SHADOWS.primary },
  retryText: { color: COLORS.text, ...FONTS.bold, fontSize: SIZES.md },
});

