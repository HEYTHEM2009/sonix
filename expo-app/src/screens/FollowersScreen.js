import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import client from "../api/client";
import { COLORS, SIZES, FONTS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS, LAYOUT } from "../design/DesignSystem";
import Screen3D from "../components/3D/Screen3D";
import Icon from "../design/ui/Icon";

export default function FollowersScreen({ navigation, route }) {
  const { t } = useLanguage();
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [tab, setTab] = useState(route.params?.tab === "following" ? "following" : "followers");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    try {
      const toList = (res) => {
        const d = res?.data;
        return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
      };
      const [f1, f2] = await Promise.all([
        client.get(`/follow/${user.id}/followers`),
        client.get(`/follow/${user.id}/following`),
      ]);
      setFollowers(toList(f1));
      setFollowing(toList(f2));
    } catch (e) { console.warn("Followers load error", e?.response?.status); }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const list = tab === "followers" ? followers : following;

  return (
    <Screen3D style={s.container}>
      <View style={[s.topBar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Icon name="arrow-back" size={22} color={COLORS.text} /></TouchableOpacity>
        <Text style={s.title}>{tab === "followers" ? t("followersTab") : t("followingTab")}</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={s.tabs}>
        <TouchableOpacity onPress={() => setTab("followers")} style={[s.tab, tab === "followers" && s.activeTab]}>
          <Text style={[s.tabText, tab === "followers" && s.activeTabText]}>{t("followersTab")}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab("following")} style={[s.tab, tab === "following" && s.activeTab]}>
          <Text style={[s.tabText, tab === "following" && s.activeTabText]}>{t("followingTab")}</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: SPACING.huge }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(f) => String(f.id)}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 30) }}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              {tab === "followers" ? <Icon name="people" size={36} color={COLORS.muted} /> : <Icon name="person" size={36} color={COLORS.muted} />}
              <Text style={s.empty}>{tab === "followers" ? t("noFollowers") : t("noFollowing")}</Text>
            </View>
          }
          renderItem={({ item: f }) => {
            const profile = tab === "followers" ? f.follower : f.following;
            return (
              <TouchableOpacity
                style={s.row}
                activeOpacity={0.8}
                onPress={() => { if (profile?.id) navigation.navigate("UserProfile", { userId: profile.id }); }}
              >
                <View style={s.avatar}>
                  <Text style={s.avatarText}>
                    {profile?.username?.[0]?.toUpperCase() || "?"}
                  </Text>
                </View>
                <Text style={s.name}>
                  {profile?.username || t("unknown")}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </Screen3D>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  topBar: { ...GLASS.default, paddingBottom: SPACING.sm, paddingHorizontal: SPACING.md, borderBottomWidth: 0.5, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  backText: { ...TYPOGRAPHY.stat, color: COLORS.text },
  title: { fontSize: SIZES.md, ...FONTS.semiBold, color: COLORS.text },
  tabs: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  tab: { flex: 1, padding: SPACING.md, alignItems: "center" },
  activeTab: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 14, ...FONTS.semiBold, color: COLORS.muted },
  activeTabText: { color: COLORS.text },
  emptyWrap: { alignItems: "center", paddingTop: SPACING.huge },
  emptyIcon: { fontSize: 36, marginBottom: SPACING.sm },
  empty: { textAlign: "center", color: COLORS.muted, fontSize: SIZES.md },
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight },
  avatar: { width: 40, height: 40, borderRadius: RADIUS.full, backgroundColor: COLORS.input, alignItems: "center", justifyContent: "center" },
  avatarText: { ...TYPOGRAPHY.bodyBold, color: COLORS.text },
  name: { ...FONTS.semiBold, fontSize: 14, color: COLORS.text },
});
