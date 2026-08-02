import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import client from "../api/client";
import Icon from "../design/ui/Icon";
import { COLORS, SIZES, FONTS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS, LAYOUT } from "../design/DesignSystem";
import Screen3D from "../components/3D/Screen3D";

export default function NotificationsScreen({ navigation }) {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    try { const res = await client.get("/notifications"); setNotifications(res.data || []); await client.patch("/notifications/seen"); } catch (e) { console.warn("Notifications load error", e?.response?.status); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <Screen3D style={s.container}>
      <View style={[s.topBar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{top:8, bottom:8, left:8, right:8}}><Icon name="arrow-back" size={20} color={COLORS.text} /></TouchableOpacity>
        <Text style={s.title}>{t("notifications")}</Text>
        <View style={{ width: 36 }} />
      </View>
      {loading ? (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => String(n.id)}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 30) }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.text} colors={[COLORS.text]} />}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Text style={s.emptyIcon}>N</Text>
              <Text style={s.emptyTitle}>{t("noNotifications")}</Text>
            </View>
          }
          renderItem={({ item: n }) => (
            <TouchableOpacity
              style={[s.card, !n.seen && s.unread]}
              activeOpacity={0.8}
              onPress={() => {
                if (n.sender?.id) navigation.navigate("UserProfile", { userId: n.sender.id });
              }}
            >
              <View style={s.avatar}><Text style={s.avatarText}>{n.sender?.username?.[0]?.toUpperCase() || "?"}</Text></View>
              <Text style={s.msg}><Text style={s.user}>{n.sender?.username}</Text> {n.message}</Text>
              <Text style={s.time}>{new Date(n.created_at).toLocaleDateString()}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </Screen3D>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingBottom: SPACING.sm, paddingHorizontal: SPACING.md, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.md, backgroundColor: GLASS.bg },
  backText: { ...TYPOGRAPHY.h3, color: COLORS.text },
  title: { fontSize: SIZES.md, ...FONTS.semiBold, color: COLORS.text },
  emptyWrap: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 40, marginBottom: SPACING.sm, color: COLORS.muted, ...FONTS.bold },
  emptyTitle: { ...TYPOGRAPHY.body, color: COLORS.muted },
  card: { flexDirection: "row", padding: SPACING.md, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, gap: SPACING.sm, alignItems: "center", backgroundColor: GLASS.bg },
  unread: { backgroundColor: COLORS.surfaceLight },
  avatar: { width: 40, height: 40, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { ...TYPOGRAPHY.bodyBold, color: COLORS.text },
  msg: { flex: 1, ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  user: { ...FONTS.bold, color: COLORS.text },
  time: { ...TYPOGRAPHY.small, color: COLORS.muted },
});
