import { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import client, { resolveUrl } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import { COLORS, SIZES, FONTS, SPACING, RADIUS, SHADOWS, GLASS, TYPOGRAPHY, LAYOUT } from "../design/DesignSystem";
import Screen3D from "../components/3D/Screen3D";
import Icon from "../design/ui/Icon";

export default function BlockedUsersScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState(null);

  const loadBlocked = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get("/block/list");
      setUsers(res.data || []);
    } catch {
      Alert.alert(t("error"), t("failedToLoad"));
    }
    setLoading(false);
  }, [t]);

  useEffect(() => { loadBlocked(); }, [loadBlocked]);

  const handleUnblock = useCallback(async (userId) => {
    setUnblockingId(userId);
    try {
      const res = await client.post(`/users/${userId}/unblock`);
      if (res.data?.blocked === false || res.status === 200) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch {
      Alert.alert(t("error"), t("failedToUnblock"));
    }
    setUnblockingId(null);
  }, [t]);

  const renderItem = useCallback(({ item }) => (
    <View style={s.userRow}>
      {item.avatar ? <Image source={{ uri: resolveUrl(item.avatar) }} style={s.avatar} /> : <View style={[s.avatar, { backgroundColor: COLORS.primary + "30", alignItems: "center", justifyContent: "center" }]}><Text style={{ color: COLORS.primary, ...FONTS.bold, fontSize: 16 }}>{item.username?.[0]?.toUpperCase() || "?"}</Text></View>}
      <View style={s.userInfo}>
        <Text style={s.username}>{item.username}</Text>
      </View>
      <TouchableOpacity
        style={s.unblockBtn}
        onPress={() => handleUnblock(item.id)}
        disabled={unblockingId === item.id}
      >
        {unblockingId === item.id ? (
          <ActivityIndicator size="small" color={COLORS.text} />
        ) : (
          <Text style={s.unblockText}>{t("unblock")}</Text>
        )}
      </TouchableOpacity>
    </View>
  ), [handleUnblock, unblockingId, t]);

  return (
    <Screen3D style={[s.wrap, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={SIZES.xxl} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={s.title}>{t("blockedUsers")}</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.gold} style={{ marginTop: 60 }} />
      ) : users.length === 0 ? (
        <View style={s.empty}>
          <Icon name="ban" size={48} color={COLORS.muted} />
          <Text style={s.emptyText}>{t("noBlockedUsers")}</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm }}
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
  userRow: { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.md, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, gap: SPACING.md, ...GLASS.default },
  avatar: { width: 44, height: 44, borderRadius: RADIUS.full, backgroundColor: COLORS.input },
  userInfo: { flex: 1 },
  username: { fontSize: SIZES.md, ...FONTS.semiBold, color: COLORS.text },
  unblockBtn: { backgroundColor: COLORS.danger, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  unblockText: { color: COLORS.text, ...FONTS.semiBold, fontSize: 13 },
  empty: { alignItems: "center", marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: SIZES.md, color: COLORS.muted },
});
