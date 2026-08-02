import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import client from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import { COLORS, SIZES, FONTS, SPACING, RADIUS, SHADOWS, GLASS, TYPOGRAPHY, LAYOUT } from "../design/DesignSystem";
import Screen3D from "../components/3D/Screen3D";
import Icon from "../design/ui/Icon";

export default function LikeListScreen({ route, navigation }) {
  const { t } = useLanguage();
  const postId = route.params?.postId ?? null;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await client.get(`/likes/${postId}/users`);
        setUsers(res.data?.data || []);
      } catch (e) { console.warn("Like list error", e?.response?.status); }
      setLoading(false);
    })();
  }, [postId]);

  return (
    <Screen3D>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="arrow-back" size={SIZES.xxl} color={COLORS.text} /></TouchableOpacity>
        <Text style={s.title}>{t("likesTitle")}</Text>
        <View style={{ width: 36 }} />
      </View>
      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => String(u.id)}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Icon name="heart-outline" size={36} color={COLORS.muted} />
              <Text style={s.empty}>{t("noLikesYet")}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={s.userRow} onPress={() => navigation.navigate("UserProfile", { userId: item.id })}>
              <View style={s.avatar}><Text style={s.avatarText}>{item.username?.[0]?.toUpperCase() || "?"}</Text></View>
              <Text style={s.username}>{item.username}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </Screen3D>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm },
  backBtn: { fontSize: SIZES.xxl, color: COLORS.text },
  title: { fontSize: SIZES.lg, ...FONTS.semiBold, color: COLORS.text },
  emptyWrap: { alignItems: "center", paddingTop: SPACING.xxxl },
  emptyIcon: { fontSize: 36, marginBottom: SPACING.sm },
  empty: { color: COLORS.muted, textAlign: "center", fontSize: SIZES.md },
  userRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.md, ...GLASS.default },
  avatar: { width: 40, height: 40, borderRadius: RADIUS.full, backgroundColor: COLORS.input, alignItems: "center", justifyContent: "center" },
  avatarText: { color: COLORS.text, fontSize: 16, ...FONTS.semiBold },
  username: { color: COLORS.text, fontSize: 14, ...FONTS.medium },
});
