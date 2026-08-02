import { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import client, { resolveUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { COLORS, SIZES, FONTS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS, LAYOUT } from "../design/DesignSystem";
import Screen3D from "../components/3D/Screen3D";
import Icon from "../design/ui/Icon";

export default function CreateGroupScreen({ navigation }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, []);

  useEffect(() => {
    if (search.length === 0) { loadSuggestions(); return; }
    const timer = setTimeout(() => { if (search.length >= 2) loadSearch(); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const seen = new Set();
      const list = [];
      try {
        const res = await client.get("/users");
        const userData = res.data;
        const raw = Array.isArray(userData) ? userData : Array.isArray(userData?.data) ? userData.data : [];
        raw.forEach((u) => {
          if (u.id !== user?.id && !seen.has(u.id)) {
            seen.add(u.id);
            list.push(u);
          }
        });
      } catch (_) {}
      setUsers(list);
    } catch (e) {
      console.warn("Suggestions error", e?.message || e);
    } finally {
      setLoading(false);
    }
  };

  const loadSearch = async () => {
    try {
      setLoading(true);
      const res = await client.get("/users/search", { params: { q: search } });
      const data = res.data;
      const raw = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      const list = raw.filter((u) => u.id !== user?.id);
      setUsers(list);
    } catch (e) {
      console.warn("User search error", e?.message || e);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const create = async () => {
    if (!name.trim()) { Alert.alert(t("error"), t("allFieldsRequired")); return; }
    const memberIds = Array.from(selectedIds);
    if (memberIds.length === 0) { Alert.alert(t("error"), t("addMembers")); return; }
    setCreating(true);
    try {
      const res = await client.post("/groups", { name: name.trim(), member_ids: memberIds });
      Alert.alert(t("success"), t("groupCreated"));
      navigation.replace("GroupChat", { groupId: res.data.id, groupName: res.data.name });
    } catch (e) {
      Alert.alert(t("error"), e?.response?.data?.message || t("error"));
    } finally {
      setCreating(false);
    }
  };

  const renderUser = ({ item }) => {
    const selected = selectedIds.has(item.id);
    return (
      <TouchableOpacity style={[s.userRow, selected && s.userRowSelected]} onPress={() => toggleUser(item.id)} activeOpacity={0.7}>
        {item.avatar ? (
          <Image source={{ uri: resolveUrl(item.avatar) }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, s.avatarPlaceholder]}>
            <Text style={s.avatarLetter}>{item.username?.[0]?.toUpperCase() || "?"}</Text>
          </View>
        )}
        <View style={s.userInfo}>
          <Text style={s.username}>{item.username}</Text>
          {item.bio ? <Text style={s.userBio} numberOfLines={1}>{item.bio}</Text> : null}
        </View>
        <View style={[s.checkbox, selected && s.checkboxSelected]}>
          {selected && <Icon name="checkmark" size={14} color={COLORS.text} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen3D style={[s.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Icon name="arrow-back" size={22} color={COLORS.gold} /></TouchableOpacity>
        <Text style={s.title}>{t("newGroup")}</Text>
        <TouchableOpacity onPress={create} disabled={creating || !name.trim() || selectedIds.size === 0} style={[s.createBtn, (!name.trim() || selectedIds.size === 0) && s.createBtnDisabled]}>
          <Text style={s.createText}>{t("createGroup")}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.inputWrap}>
        <TextInput style={s.input} value={name} onChangeText={setName} placeholder={t("groupName")} placeholderTextColor={COLORS.muted} />
      </View>

      {selectedIds.size > 0 && (
        <View style={s.selectedBar}>
          <Text style={s.selectedCount}>{selectedIds.size} {t("members")}</Text>
        </View>
      )}

      <View style={s.searchWrap}>
        <Icon name="search" size={16} color={COLORS.muted} />
        <TextInput style={s.searchInput} value={search} onChangeText={setSearch} placeholder={t("searchUsers")} placeholderTextColor={COLORS.muted} />
      </View>

      {!search && <Text style={s.sectionTitle}>{t("suggestions") || "Suggestions"}</Text>}

      {loading ? (
        <View style={s.centered}><ActivityIndicator color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderUser}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={s.emptyText}>{search.length > 0 ? t("noResults") : t("noMembers") || "No users found"}</Text>
          }
        />
      )}
      </KeyboardAvoidingView>
    </Screen3D>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: GLASS.elevated.backgroundColor, borderBottomWidth: 1, borderBottomColor: GLASS.elevated.borderColor },
  backBtn: { padding: SPACING.xs },
  backText: { color: COLORS.gold, fontSize: 22, fontWeight: "600" },
  title: { fontSize: SIZES.lg, ...FONTS.semiBold, color: COLORS.text },
  createBtn: { backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingHorizontal: 14, paddingVertical: 7 },
  createBtnDisabled: { opacity: 0.4 },
  createText: { color: COLORS.text, ...FONTS.semiBold, fontSize: 13 },
  inputWrap: { paddingHorizontal: 16, marginBottom: 10 },
  input: { backgroundColor: COLORS.input, borderRadius: SIZES.radius, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.text, fontSize: SIZES.md },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.input, borderRadius: SIZES.radius, marginHorizontal: 16, marginBottom: 10, paddingHorizontal: SPACING.md },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, color: COLORS.text, fontSize: SIZES.md },
  sectionTitle: { paddingHorizontal: 16, marginBottom: 6, color: COLORS.muted, fontWeight: "600", fontSize: SIZES.sm },
  selectedBar: { paddingHorizontal: 16, marginBottom: 8 },
  selectedCount: { color: COLORS.primary, fontWeight: "600", fontSize: SIZES.sm },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: COLORS.muted, fontSize: SIZES.md, textAlign: "center", marginTop: 40 },
  userRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 11, gap: SPACING.md },
  userRowSelected: { backgroundColor: COLORS.primary + "15" },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { backgroundColor: COLORS.primary + "30", alignItems: "center", justifyContent: "center" },
  avatarLetter: { fontSize: 18, fontWeight: "700", color: COLORS.primary },
  userInfo: { flex: 1 },
  username: { fontSize: SIZES.md, fontWeight: "600", color: COLORS.text },
  userBio: { fontSize: 12, color: COLORS.muted, marginTop: 1 },
  checkbox: { width: 24, height: 24, borderRadius: RADIUS.lg, borderWidth: 2, borderColor: COLORS.muted, alignItems: "center", justifyContent: "center" },
  checkboxSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
});
