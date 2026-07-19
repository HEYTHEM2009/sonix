import React from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { COLORS, SIZES } from "../../components/Theme";
import { useLanguage } from "../../context/LanguageContext";

export default function DraftIndicator({ visible }) {
  const { t } = useLanguage();
  return (
    <View style={[s.wrap, !visible && s.hidden]}>
      <Text style={s.text}>📝 {t("draftSaved")}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: 2,
  },
  hidden: { opacity: 0 },
  text: {
    color: COLORS.muted,
    fontSize: SIZES.xs,
    fontStyle: "italic",
  },
});
