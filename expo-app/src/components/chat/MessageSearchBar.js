import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, SIZES } from "../../components/Theme";
import { useLanguage } from "../../context/LanguageContext";

export default function MessageSearchBar({ value, onChangeText, onClose, placeholder }) {
  const { t } = useLanguage();
  return (
    <View style={s.wrap}>
      <View style={s.iconWrap}>
        <Text style={s.icon}>🔍</Text>
      </View>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || t("searchMessages")}
        placeholderTextColor={COLORS.muted}
        autoFocus
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {value && value.length > 0 ? (
        <TouchableOpacity style={s.clearBtn} onPress={() => onChangeText("")}>
          <Text style={s.clearText}>✕</Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity style={s.closeBtn} onPress={onClose}>
        <Text style={s.closeText}>{t("cancel")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#15152a",
    borderRadius: SIZES.radius,
    paddingHorizontal: 10,
    height: 40,
    marginHorizontal: 12,
    marginVertical: 6,
    gap: 6,
  },
  iconWrap: { paddingRight: 2 },
  icon: { fontSize: 15, opacity: 0.7 },
  input: { flex: 1, color: COLORS.text, fontSize: SIZES.md },
  clearBtn: { padding: 4 },
  clearText: { color: COLORS.muted, fontSize: 15 },
  closeBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  closeText: { color: COLORS.primary, fontSize: SIZES.sm, fontWeight: "600" },
});
