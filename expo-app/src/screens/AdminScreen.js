import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import adminApi from "../api/admin";
import { COLORS, SIZES, FONTS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS, LAYOUT } from "../design/DesignSystem";
import UserCard from "../components/UserCard";

const TABS = ["dashboard", "users", "reels", "reports", "badwords"];

export default function AdminScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({});
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.dashboard();
      setData((prev) => ({ ...prev, dashboard: res.data?.data || res.data }));
    } catch (e) {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user?.role === "admin") load();
  }, [load, user]);

  const loadTab = useCallback(
    async (tb) => {
      try {
        if (tb === "users" && !data.users) {
          const r = await adminApi.users({ limit: 50 });
          setData((p) => ({ ...p, users: r.data?.data || r.data }));
        }
        if (tb === "reels" && !data.reels) {
          const r = await adminApi.reels({ limit: 50 });
          setData((p) => ({ ...p, reels: r.data?.data || r.data }));
        }
        if (tb === "reports" && !data.reports) {
          const r = await adminApi.reports({ limit: 50 });
          setData((p) => ({ ...p, reports: r.data?.data || r.data }));
        }
        if (tb === "badwords" && !data.badwords) {
          const r = await adminApi.badWords();
          setData((p) => ({ ...p, badwords: r.data?.data || r.data }));
        }
      } catch (e) {
        toast.error("Failed to load");
      }
    },
    [data, toast]
  );

  const onTab = (tb) => {
    setTab(tb);
    loadTab(tb);
  };

  if (user?.role !== "admin") {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.lockText}>{t("adminOnly") || "Admin access only"}</Text>
      </View>
    );
  }

  const stats = data.dashboard?.stats || {};

  const StatGrid = () => (
    <View style={styles.statGrid}>
      {[
        ["users", stats.users],
        ["reels", stats.reels],
        ["posts", stats.posts],
        ["stories", stats.stories],
        ["reports", stats.reports],
        ["comments", stats.comments],
      ].map(([k, v]) => (
        <View key={k} style={styles.statCard}>
          <Text style={styles.statValue}>{v ?? 0}</Text>
          <Text style={styles.statLabel}>{t(k) || k}</Text>
        </View>
      ))}
    </View>
  );

  const renderUsers = () => (
    <FlatList
      data={data.users?.data || []}
      keyExtractor={(i) => `u-${i.id}`}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <UserCard
            user={item}
            t={t}
            onFollow={null}
          />
          <View style={styles.rowActions}>
            {item.is_banned ? (
              <TouchableOpacity style={styles.btnGreen} onPress={() => banUnban(item, false)}>
                <Text style={styles.btnText}>{t("unban") || "Unban"}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.btnRed} onPress={() => banUnban(item, true)}>
                <Text style={styles.btnText}>{t("ban") || "Ban"}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>{t("noResults")}</Text>}
    />
  );

  const banUnban = async (item, ban) => {
    try {
      if (ban) await adminApi.banUser(item.id);
      else await adminApi.unbanUser(item.id);
      setData((p) => ({
        ...p,
        users: { ...p.users, data: p.users.data.map((u) => (u.id === item.id ? { ...u, is_banned: ban } : u)) },
      }));
      toast.success(ban ? "User banned" : "User unbanned");
    } catch (e) {
      toast.error("Action failed");
    }
  };

  const renderReels = () => (
    <FlatList
      data={data.reels?.data || []}
      keyExtractor={(i) => `r-${i.id}`}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>@{item.user?.username}</Text>
            <Text style={styles.rowSub} numberOfLines={1}>{item.caption || "(no caption)"}</Text>
            <Text style={styles.rowMeta}>* {item.likes_count || 0} · C {item.comments_count || 0}</Text>
          </View>
          <TouchableOpacity style={styles.btnRed} onPress={() => removeContent("reel", item.id)}>
            <Text style={styles.btnText}>{t("remove") || "Remove"}</Text>
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>{t("noResults")}</Text>}
    />
  );

  const removeContent = async (type, id) => {
    try {
      await adminApi.removeContent(type, id);
      setData((p) => ({
        ...p,
        reels: {
          ...p.reels,
          data: Array.isArray(p.reels?.data) ? p.reels.data.filter((r) => r.id !== id) : p.reels?.data,
        },
      }));
      toast.success("Removed");
    } catch (e) {
      toast.error("Remove failed");
    }
  };

  const renderReports = () => (
    <FlatList
      data={data.reports?.data || []}
      keyExtractor={(i) => `rep-${i.id}`}
      renderItem={({ item }) => (
        <View style={styles.reportCard}>
          <Text style={styles.rowTitle}>
            {item.reporter?.username} → {item.reportedUser?.username || item.reportable_type}
          </Text>
          <Text style={styles.rowSub}>Reason: {item.reason}</Text>
          {item.description ? <Text style={styles.rowMeta}>{item.description}</Text> : null}
          <View style={styles.rowActions}>
            <Text style={[styles.badge, item.status === "resolved" && styles.badgeOk]}>{item.status}</Text>
            {item.status !== "resolved" && (
              <TouchableOpacity style={styles.btnGreen} onPress={() => resolve(item.id)}>
                <Text style={styles.btnText}>{t("resolve") || "Resolve"}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>{t("noResults")}</Text>}
    />
  );

  const resolve = async (id) => {
    try {
      await adminApi.resolveReport(id, "resolved");
      setData((p) => ({
        ...p,
        reports: {
          ...p.reports,
          data: p.reports.data.map((r) => (r.id === id ? { ...r, status: "resolved" } : r)),
        },
      }));
      toast.success("Report resolved");
    } catch (e) {
      toast.error("Failed");
    }
  };

  const renderBadWords = () => (
    <View style={{ flex: 1 }}>
      <TouchableOpacity style={styles.addBtn} onPress={() => setModal({ type: "badword" })}>
        <Text style={styles.btnText}>+ {t("addWord") || "Add word"}</Text>
      </TouchableOpacity>
      <FlatList
        data={data.badwords || []}
        keyExtractor={(i) => `bw-${i.id}`}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowTitle}>{item.word}</Text>
            <TouchableOpacity style={styles.btnRed} onPress={() => delBadWord(item.id)}>
              <Text style={styles.btnText}>{t("delete") || "Delete"}</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{t("noResults")}</Text>}
      />
    </View>
  );

  const delBadWord = async (id) => {
    try {
      await adminApi.deleteBadWord(id);
      setData((p) => ({ ...p, badwords: p.badwords.filter((b) => b.id !== id) }));
      toast.success("Deleted");
    } catch (e) {
      toast.error("Failed");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("adminPanel") || "Admin Panel"}</Text>
        <TouchableOpacity style={styles.broadcastBtn} onPress={() => setModal({ type: "notify" })}>
          <Text style={styles.btnText}>ANNOUNCE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {TABS.map((tb) => (
          <TouchableOpacity key={tb} style={[styles.tab, tab === tb && styles.tabActive]} onPress={() => onTab(tb)}>
            <Text style={[styles.tabText, tab === tb && styles.tabTextActive]}>{t(tb) || tb}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.text} style={{ marginTop: SPACING.huge }} />
      ) : (
        <View style={styles.body}>
          {tab === "dashboard" && <StatGrid />}
          {tab === "users" && renderUsers()}
          {tab === "reels" && renderReels()}
          {tab === "reports" && renderReports()}
          {tab === "badwords" && renderBadWords()}
        </View>
      )}

      <Modal visible={!!modal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {modal?.type === "badword" && (
              <BadWordForm
                onClose={() => setModal(null)}
                onDone={async (w) => {
                  try {
                    await adminApi.addBadWord(w);
                    const r = await adminApi.badWords();
                    setData((p) => ({ ...p, badwords: r.data?.data || r.data }));
                    toast.success("Word added");
                  } catch (e) {
                    toast.error("Failed to add");
                  }
                  setModal(null);
                }}
              />
            )}
            {modal?.type === "notify" && (
              <NotifyForm
                onClose={() => setModal(null)}
                onDone={async (msg) => {
                  try {
                    await adminApi.notifications(msg);
                    toast.success("Broadcast sent");
                  } catch (e) {
                    toast.error("Broadcast failed");
                  }
                  setModal(null);
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function BadWordForm({ onClose, onDone }) {
  const [word, setWord] = useState("");
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <Text style={styles.modalTitle}>Add blocked word</Text>
      <TextInput style={styles.input} value={word} onChangeText={setWord} placeholder="word" placeholderTextColor={COLORS.placeholder} />
      <View style={styles.modalBtns}>
        <TouchableOpacity style={styles.btnGray} onPress={onClose}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btnGreen} onPress={() => word.trim() && onDone(word.trim())}><Text style={styles.btnText}>Add</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function NotifyForm({ onClose, onDone }) {
  const [msg, setMsg] = useState("");
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <Text style={styles.modalTitle}>Broadcast notification</Text>
      <TextInput style={[styles.input, { height: 90 }]} multiline value={msg} onChangeText={setMsg} placeholder="Message to all users" placeholderTextColor={COLORS.placeholder} />
      <View style={styles.modalBtns}>
        <TouchableOpacity style={styles.btnGray} onPress={onClose}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btnGreen} onPress={() => msg.trim() && onDone(msg.trim())}><Text style={styles.btnText}>Send</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" },
  lockText: { color: COLORS.textSecondary, fontSize: SIZES.lg, ...FONTS.semiBold },
  header: { ...GLASS.elevated, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  headerTitle: { color: COLORS.text, fontSize: SIZES.xl, ...FONTS.black },
  broadcastBtn: { backgroundColor: COLORS.primaryGlowLight, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm },
  tabs: { flexDirection: "row", paddingHorizontal: SPACING.sm, gap: SPACING.xs, marginBottom: SPACING.sm, flexWrap: "wrap" },
  tab: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: COLORS.glassLight },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontSize: SIZES.sm, ...FONTS.semiBold },
  tabTextActive: { color: COLORS.text },
  body: { flex: 1, paddingHorizontal: SPACING.md },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, paddingTop: SPACING.sm },
  statCard: { width: "48%", backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: "center", ...GLASS.elevated },
  statValue: { color: COLORS.text, fontSize: SIZES.title, ...FONTS.black },
  statLabel: { color: COLORS.textSecondary, fontSize: SIZES.xs, marginTop: SPACING.xxs },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.sm, ...GLASS.elevated },
  rowInfo: { flex: 1 },
  rowTitle: { color: COLORS.text, fontSize: SIZES.md, ...FONTS.bold },
  rowSub: { color: COLORS.textSecondary, fontSize: SIZES.xs, marginTop: SPACING.xxs },
  rowMeta: { color: COLORS.muted, fontSize: SIZES.xs, marginTop: SPACING.xxs },
  rowActions: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  btnRed: { backgroundColor: COLORS.danger, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.sm },
  btnGreen: { backgroundColor: COLORS.success, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.sm },
  btnGray: { backgroundColor: COLORS.glassLight, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm },
  btnText: { color: COLORS.text, fontSize: SIZES.sm, ...FONTS.bold },
  reportCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, ...GLASS.elevated },
  badge: { color: COLORS.warning, fontSize: SIZES.sm, ...FONTS.bold, textTransform: "capitalize", marginRight: SPACING.sm },
  badgeOk: { color: COLORS.success },
  addBtn: { backgroundColor: COLORS.primary, alignSelf: "flex-start", paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, marginBottom: SPACING.sm },
  empty: { color: COLORS.muted, textAlign: "center", marginTop: SPACING.huge },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: "center", padding: SPACING.xxl },
  modal: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.xl },
  modalTitle: { color: COLORS.text, fontSize: SIZES.lg, ...FONTS.bold, marginBottom: SPACING.md },
  input: { backgroundColor: COLORS.input, color: COLORS.text, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: SIZES.md, marginBottom: SPACING.md },
  modalBtns: { flexDirection: "row", justifyContent: "flex-end", gap: SPACING.sm },
});
