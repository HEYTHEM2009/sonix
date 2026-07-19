import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, SIZES } from "../../components/Theme";
import { useLanguage } from "../../context/LanguageContext";

export default function BulkActionBar({ count, onDelete, onForward, onCancel }) {
  const { t } = useLanguage();
  return (
    <View style={s.bar}>
      <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
        <Text style={s.cancelText}>{t("cancelSelection") || t("cancel")}</Text>
      </TouchableOpacity>
      <View style={s.countWrap}>
        <Text style={s.count}>{count}</Text>
        <Text style={s.countLabel}>{t("selected")}</Text>
      </View>
      <View style={s.actions}>
        <TouchableOpacity style={[s.action, s.forward]} onPress={onForward}>
          <Text style={s.actionIcon}>↪</Text>
          <Text style={s.actionLabel}>{t("bulkForward")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.action, s.delete]} onPress={onDelete}>
          <Text style={s.actionIcon}>🗑️</Text>
          <Text style={s.actionLabel}>{t("bulkDelete")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#15152a",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#2a2a3a",
  },
  cancelBtn: { paddingVertical: 6, paddingRight: 8 },
  cancelText: { color: COLORS.primary, fontSize: SIZES.sm, fontWeight: "600" },
  countWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  count: { color: COLORS.text, fontSize: SIZES.lg, fontWeight: "800" },
  countLabel: { color: COLORS.muted, fontSize: SIZES.xs },
  actions: { flexDirection: "row", gap: 8 },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  forward: { backgroundColor: COLORS.primary + "30" },
  delete: { backgroundColor: COLORS.danger + "30" },
  actionIcon: { fontSize: 16, color: COLORS.text },
  actionLabel: { color: COLORS.text, fontSize: SIZES.sm, fontWeight: "600" },
});
