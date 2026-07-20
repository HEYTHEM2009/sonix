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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import adminApi from "../api/admin";
import { COLORS, SIZES } from "../components/Theme";
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

  // Lazy load tab content when switched
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
        <Text style={styles.lock}>🔒</Text>
        <Text style={styles.lockText}>{t("adminOnly") || "Admin access only"}</Text>
      </View>
    );
  }

  const stats = data.dashboard?.stats || {};

  const StatGrid = () => (
    <View style={styles.statGrid}>
      {[
        ["users", stats.users, "👥"],
        ["reels", stats.reels, "🎬"],
        ["posts", stats.posts, "📝"],
        ["stories", stats.stories, "📸"],
        ["reports", stats.reports, "⚠️"],
        ["comments", stats.comments, "💬"],
      ].map(([k, v, icon]) => (
        <View key={k} style={styles.statCard}>
          <Text style={styles.statIcon}>{icon}</Text>
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
            <Text style={styles.rowMeta}>♥ {item.likes_count || 0} · 💬 {item.comments_count || 0}</Text>
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
        <Text style={styles.headerTitle}>🛡️ {t("adminPanel") || "Admin Panel"}</Text>
        <TouchableOpacity style={styles.broadcastBtn} onPress={() => setModal({ type: "notify" })}>
          <Text style={styles.btnText}>📢</Text>
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
        <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
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
    <>
      <Text style={styles.modalTitle}>Add blocked word</Text>
      <TextInput style={styles.input} value={word} onChangeText={setWord} placeholder="word" placeholderTextColor="#888" />
      <View style={styles.modalBtns}>
        <TouchableOpacity style={styles.btnGray} onPress={onClose}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btnGreen} onPress={() => word.trim() && onDone(word.trim())}><Text style={styles.btnText}>Add</Text></TouchableOpacity>
      </View>
    </>
  );
}

function NotifyForm({ onClose, onDone }) {
  const [msg, setMsg] = useState("");
  return (
    <>
      <Text style={styles.modalTitle}>Broadcast notification</Text>
      <TextInput style={[styles.input, { height: 90 }]} multiline value={msg} onChangeText={setMsg} placeholder="Message to all users" placeholderTextColor="#888" />
      <View style={styles.modalBtns}>
        <TouchableOpacity style={styles.btnGray} onPress={onClose}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btnGreen} onPress={() => msg.trim() && onDone(msg.trim())}><Text style={styles.btnText}>Send</Text></TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" },
  lock: { fontSize: 48, marginBottom: 12 },
  lockText: { color: COLORS.textSecondary, fontSize: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { color: COLORS.text, fontSize: SIZES.xl, fontWeight: "800" },
  broadcastBtn: { backgroundColor: "rgba(124,108,247,0.18)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  tabs: { flexDirection: "row", paddingHorizontal: 10, gap: 6, marginBottom: 8, flexWrap: "wrap" },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)" },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: "#aaa", fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  body: { flex: 1, paddingHorizontal: 12 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingTop: 8 },
  statCard: { width: (SIZES.radiusLg, "48%"), backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 16, alignItems: "center" },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { color: COLORS.text, fontSize: 24, fontWeight: "800" },
  statLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 10, marginBottom: 8 },
  rowInfo: { flex: 1 },
  rowTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  rowSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  rowMeta: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  rowActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnRed: { backgroundColor: COLORS.danger, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  btnGreen: { backgroundColor: COLORS.success, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  btnGray: { backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8 },
  btnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  reportCard: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 12, marginBottom: 8 },
  badge: { color: COLORS.warning, fontSize: 12, fontWeight: "700", textTransform: "capitalize", marginRight: 8 },
  badgeOk: { color: COLORS.success },
  addBtn: { backgroundColor: COLORS.primary, alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, marginBottom: 10 },
  empty: { color: "#888", textAlign: "center", marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: "center", padding: 24 },
  modal: { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: 20 },
  modalTitle: { color: COLORS.text, fontSize: SIZES.lg, fontWeight: "700", marginBottom: 14 },
  input: { backgroundColor: COLORS.input, color: "#fff", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, marginBottom: 14 },
  modalBtns: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
});
