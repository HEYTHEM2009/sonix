import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, GLASS } from "../../design/DesignSystem";
import { useLanguage } from "../../context/LanguageContext";
import Icon from "../../design/ui/Icon";

export default function MessageSearchBar({ value, onChangeText, onClose, placeholder }) {
  const { t } = useLanguage();
  return (
    <View style={s.wrap}>
      <Icon name="search" size="sm" color={COLORS.textSecondary} />
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || t("searchMessages")}
        placeholderTextColor={COLORS.textTertiary}
        autoFocus
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {value && value.length > 0 ? (
        <TouchableOpacity style={s.clearBtn} onPress={() => onChangeText("")} activeOpacity={0.7}>
          <Icon name="close" size="sm" color={COLORS.textTertiary} />
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
        <Text style={s.closeText}>{t("cancel")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.glassLight,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    height: 42,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  icon: { fontSize: 15, color: COLORS.textSecondary },
  input: { flex: 1, color: COLORS.text, fontSize: TYPOGRAPHY.body.fontSize, paddingVertical: 0 },
  clearBtn: { padding: SPACING.xs },
  clearText: { color: COLORS.textTertiary, fontSize: 15 },
  closeBtn: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs },
  closeText: { color: COLORS.primary, fontSize: TYPOGRAPHY.caption.fontSize, fontWeight: "600" },
});
