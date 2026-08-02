import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from "../../design/DesignSystem";
import { useLanguage } from "../../context/LanguageContext";
import Icon from "../../design/ui/Icon";

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
          <Icon name="return-down-forward" size="sm" color={COLORS.text} />
          <Text style={s.actionLabel}>{t("bulkForward")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.action, s.delete]} onPress={onDelete}>
          <Icon name="trash-outline" size="sm" color={COLORS.danger} />
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
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  cancelBtn: { paddingVertical: 6, paddingRight: SPACING.sm },
  cancelText: { ...TYPOGRAPHY.captionBold, color: COLORS.primary },
  countWrap: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  count: { ...TYPOGRAPHY.h2, color: COLORS.text },
  countLabel: { ...TYPOGRAPHY.small, color: COLORS.muted },
  actions: { flexDirection: "row", gap: SPACING.sm },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  forward: { backgroundColor: COLORS.primaryGlowLight },
  delete: { backgroundColor: COLORS.danger + "20" },
  actionLabel: { ...TYPOGRAPHY.captionBold, color: COLORS.text },
});
