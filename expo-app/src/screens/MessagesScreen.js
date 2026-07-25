import { useState, useEffect, useCallback, memo, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, RefreshControl, Alert, Animated, I18nManager } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useRealtimeContext } from "../context/RealtimeContext";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { blockUser } from "../utils/security";
import client, { resolveUrl } from "../api/client";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS } from "../design/DesignSystem";
import Avatar from "../design/ui/Avatar";
import Badge from "../design/ui/Badge";
import { SearchInput } from "../design/ui/Input";
import { ScreenHeader } from "../design/ui/Header";
import { MessageSkeleton } from "../design/states/LoadingState";
import EmptyState from "../design/states/EmptyState";
import ErrorState from "../design/states/ErrorState";
import { OfflineBanner } from "../design/states/OfflineState";

function formatTime(dateStr, t) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return t("now");
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return d.toLocaleDateString(I18nManager.isRTL ? "ar" : "en-US", { month: "short", day: "numeric" });
}

const SwipeActions = ({ children, onPin, onMute, onDelete, onBlock }) => {
  const translateX = useRef(new Animated.Value(0)).current;

  const handlePanEnd = (_, gs) => {
    Animated.spring(translateX, { toValue: gs.dx < -80 ? -140 : 0, useNativeDriver: true }).start();
  };
  const resetSwipe = () => Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();

  const actions = [
    { icon: "📌", color: COLORS.primary, onPress: () => { resetSwipe(); onPin(); } },
    { icon: "🔕", color: "#F59E0B", onPress: () => { resetSwipe(); onMute(); } },
    { icon: "🗑️", color: COLORS.danger, onPress: () => { resetSwipe(); onDelete(); } },
    { icon: "🚫", color: "#8B5CF6", onPress: () => { resetSwipe(); onBlock(); } },
  ];

  return (
    <View style={styles.swipeWrap}>
      <View style={styles.swipeActions}>
        {actions.map((a, i) => (
          <TouchableOpacity key={i} style={[styles.swipeAction, { backgroundColor: a.color }]} onPress={a.onPress}>
            <Text style={styles.swipeText}>{a.icon}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Animated.View style={[{ transform: [{ translateX }], backgroundColor: COLORS.screenBg }]}>
        {children}
      </Animated.View>
    </View>
  );
};

const ConversationItem = memo(({ item, onPress, onLongPress, onDelete, onMute, onPin, onBlock, t, currentUser, onAvatarPress }) => (
  <SwipeActions
    onPin={() => onPin(item.user.id)}
    onMute={() => onMute(item.user.id)}
    onDelete={() => onDelete(item.user.id, item.user.username)}
    onBlock={() => onBlock(item.user.id, item.user.username)}
  >
    <View style={styles.row}>
      <Avatar
        source={item.user.avatar ? `${resolveUrl(item.user.avatar)}${item.user.id === currentUser?.id ? "?t=" + Date.now() : ""}` : null}
        username={item.user.username}
        size="md"
        online={item.user.is_online}
        onPress={() => onAvatarPress?.(item.user)}
      />
      <TouchableOpacity style={styles.rowContent} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.7}>
        <View style={styles.nameRow}>
          <View style={styles.nameLeft}>
            {item.is_pinned && <Text style={styles.pinIcon}>📌</Text>}
            <Text style={styles.name} numberOfLines={1}>{item.user.username}</Text>
          </View>
          <View style={styles.nameRight}>
            {item.is_muted && <Text style={styles.muteIcon}>🔕</Text>}
            {item.last_message?.created_at && <Text style={styles.time}>{formatTime(item.last_message.created_at, t)}</Text>}
          </View>
        </View>
        <View style={styles.previewRow}>
          <Text style={[styles.preview, item.unread_count > 0 && { color: COLORS.text, fontWeight: "600" }]} numberOfLines={1}>
            {item.last_message?.type === "image" ? `📷 ${t("photo")}` : item.last_message?.type === "voice" ? `🎤 ${t("voice")}` : item.last_message?.is_mine ? `${t("you")}: ` : ""}{item.last_message?.content || t("startConv")}
          </Text>
          {item.unread_count > 0 && <Badge count={item.unread_count} variant="primary" />}
        </View>
      </TouchableOpacity>
    </View>
  </SwipeActions>
));

export default function MessagesScreen({ navigation }) {
  const { t } = useLanguage();
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { realtime } = useRealtimeContext();
  const [unread, setUnread] = useState(0);
  const isOnline = useNetworkStatus();

  const load = useCallback(async () => {
    setError(null);
    try {
      const [convRes, grpRes] = await Promise.all([
        client.get("/messages/conversations"),
        client.get("/groups"),
      ]);
      setConversations(convRes.data || []);
      setGroups(grpRes.data || []);
    } catch (e) {
      if (e?.response?.status !== 401) setError(t("loadError"));
    }
    setLoading(false);
  }, [t]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const unsub = navigation.addListener("focus", () => load()); return unsub; }, [navigation, load]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const fetchUnread = useCallback(async () => {
    try { const res = await client.get("/messages/unread"); setUnread(res.data?.unread || 0); } catch (e) {}
  }, []);

  useEffect(() => { fetchUnread(); }, [fetchUnread]);

  useEffect(() => {
    let mounted = true;
    if (!user?.id) return;
    const myChannel = `messages.${user.id}`;
    const onSent = (event) => {
      if (!mounted) return;
      const partnerId = event.sender_id === parseInt(user.id, 10) ? event.receiver_id : event.sender_id;
      if (partnerId == null) return;
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.user && c.user.id === partnerId);
        if (idx < 0) return prev;
        const updated = prev.slice();
        const conv = { ...updated[idx] };
        conv.last_message = { id: event.id, content: event.content, type: event.type, sender_id: event.sender_id, created_at: event.created_at, is_mine: event.sender_id === parseInt(user.id, 10) };
        if (event.sender_id !== parseInt(user.id, 10)) conv.unread_count = (conv.unread_count || 0) + 1;
        updated.splice(idx, 1);
        updated.unshift(conv);
        return updated;
      });
      if (event.sender_id !== parseInt(user.id, 10)) fetchUnread();
    };
    (async () => {
      try { await realtime.init(); if (mounted) realtime.listen(myChannel, "message.sent", onSent); } catch (e) {}
    })();
    return () => { mounted = false; try { realtime.leave(myChannel); } catch (e) {} };
  }, [user?.id, realtime, fetchUnread]);

  const deleteConversation = (userId, username) => {
    Alert.alert(t("deleteConversation"), t("deleteConvConfirm").replace("{username}", username), [
      { text: t("cancel"), style: "cancel" },
      { text: t("delete"), style: "destructive", onPress: async () => { try { await client.delete(`/messages/conversation/${userId}`); load(); } catch (e) {} }},
    ]);
  };
  const toggleMute = async (userId) => { try { await client.post(`/messages/mute/${userId}`); load(); } catch (e) {} };
  const togglePin = async (userId) => { try { await client.post(`/messages/pin/${userId}`); load(); } catch (e) {} };
  const blockConversation = (userId, username) => {
    Alert.alert(t("blockUser"), t("blockConfirm").replace("{username}", username), [
      { text: t("cancel"), style: "cancel" },
      { text: t("block"), style: "destructive", onPress: async () => { const res = await blockUser(userId); if (!res || res.error) return; setConversations((prev) => prev.filter((c) => c.user?.id !== userId)); setUnread(0); }},
    ]);
  };

  const groupFiltered = search ? groups.filter((g) => g.name?.toLowerCase().includes(search.toLowerCase())) : groups;
  const convFiltered = search ? conversations.filter((c) => c.user?.username?.toLowerCase().includes(search.toLowerCase())) : conversations;

  const data = [];
  if (groupFiltered.length > 0 && !search) {
    data.push({ type: "section", key: "groups", label: t("groups") });
    groupFiltered.forEach((g) => data.push({ type: "group", ...g }));
  }
  if (convFiltered.length > 0) {
    data.push({ type: "section", key: "conversations", label: t("messages") });
    convFiltered.forEach((c) => data.push({ type: "conv", ...c }));
  }

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title={t("messages")} />
        {[1, 2, 3, 4, 5].map((i) => <MessageSkeleton key={i} />)}
      </View>
    );
  }

  if (error) {
    return <View style={[styles.container, { paddingTop: insets.top }]}><ErrorState message={error} onRetry={load} /></View>;
  }

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <View style={[styles.headerWrap, { paddingTop: insets.top + SPACING.sm }]}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t("messages")}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate("CreateGroup")}>
              <Text style={styles.headerBtnIcon}>👥</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate("Users")}>
              <Text style={styles.headerBtnIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
        </View>
        <SearchInput
          placeholder={t("searchConversations")}
          value={search}
          onChangeText={setSearch}
          onClear={() => setSearch("")}
        />
      </View>

      <FlatList
        data={data}
        keyExtractor={(item, i) => item.key || String(item.id || i)}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 80, 100) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <EmptyState
            icon="💬"
            title={search ? t("noResults") : t("noMessages")}
            message={search ? t("tryDifferentSearch") : t("startConversation")}
          />
        }
        renderItem={({ item }) => {
          if (item.type === "section") return <Text style={styles.sectionHeader}>{item.label}</Text>;
          if (item.type === "group") {
            return (
              <TouchableOpacity style={styles.groupRow} onPress={() => navigation.navigate("GroupChat", { groupId: item.id, groupName: item.name })} activeOpacity={0.7}>
                <View style={styles.groupAvatar}><Text style={styles.groupAvatarText}>👥</Text></View>
                <View style={styles.groupInfo}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.preview} numberOfLines={1}>{item.last_message ? `${item.last_message.username}: ${item.last_message.content}` : t("startConv")}</Text>
                </View>
                <Text style={styles.memberCount}>{item.members_count}{t("members")}</Text>
              </TouchableOpacity>
            );
          }
          return (
            <ConversationItem
              item={item}
              onPress={() => item.user && navigation.navigate("Chat", { userId: item.user.id, username: item.user.username })}
              onAvatarPress={(u) => navigation.navigate("UserProfile", { userId: u.id, username: u.username })}
              onLongPress={() => {
                if (!item.user) return;
                Alert.alert(item.user.username, null, [
                  { text: item.is_pinned ? t("unpin") : t("pin"), onPress: () => togglePin(item.user.id) },
                  { text: item.is_muted ? t("unmute") : t("mute"), onPress: () => toggleMute(item.user.id) },
                  { text: t("blockUser"), style: "destructive", onPress: () => blockConversation(item.user.id, item.user.username) },
                  { text: t("delete"), style: "destructive", onPress: () => deleteConversation(item.user.id, item.user.username) },
                  { text: t("cancel"), style: "cancel" },
                ]);
              }}
              onDelete={deleteConversation}
              onMute={toggleMute}
              onPin={togglePin}
              onBlock={blockConversation}
              t={t}
              currentUser={user}
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.screenBg },
  headerWrap: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, backgroundColor: GLASS.default.backgroundColor, borderBottomWidth: 1, borderBottomColor: GLASS.default.borderColor },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.md },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text },
  headerActions: { flexDirection: "row", gap: SPACING.sm },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: GLASS.default.backgroundColor, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: GLASS.default.borderColor },
  headerBtnIcon: { fontSize: 18 },

  swipeWrap: { overflow: "hidden", marginBottom: 0 },
  swipeActions: { position: "absolute", right: 0, top: 6, bottom: 6, flexDirection: "row", alignItems: "center", paddingRight: SPACING.md, gap: 2 },
  swipeAction: { width: 40, height: "100%", alignItems: "center", justifyContent: "center", borderRadius: RADIUS.sm },
  swipeText: { fontSize: 18 },

  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg - 4, gap: SPACING.md, backgroundColor: COLORS.screenBg, marginHorizontal: SPACING.md, marginVertical: 2, borderRadius: RADIUS.md },
  rowContent: { flex: 1 },
  groupRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.md, marginHorizontal: SPACING.md, marginVertical: 2, borderRadius: RADIUS.md, backgroundColor: GLASS.default.backgroundColor, borderWidth: 1, borderColor: GLASS.default.borderColor },
  groupAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primaryGlow, alignItems: "center", justifyContent: "center" },
  groupAvatarText: { fontSize: 24 },
  groupInfo: { flex: 1 },
  memberCount: { ...TYPOGRAPHY.small, color: COLORS.muted },

  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 3 },
  nameLeft: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  nameRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  name: { ...TYPOGRAPHY.bodyBold, color: COLORS.text, flex: 1 },
  time: { ...TYPOGRAPHY.small, color: COLORS.muted },
  pinIcon: { fontSize: 12 },
  muteIcon: { fontSize: 12 },

  previewRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  preview: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, flex: 1 },
  sectionHeader: { ...TYPOGRAPHY.label, color: COLORS.textTertiary, paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.xs, letterSpacing: 1 },
});
