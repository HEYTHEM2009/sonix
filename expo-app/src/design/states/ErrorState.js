import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from "../DesignSystem";
import { useLanguage } from "../../context/LanguageContext";

export default function ErrorState({ message, onRetry, icon = "⚠️" }) {
  const { t } = useLanguage();
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{t("oops")}</Text>
      <Text style={styles.message}>{message || t("somethingWentWrong")}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.btn} onPress={onRetry} activeOpacity={0.8}>
          <Text style={styles.btnText}>{t("tryAgain")}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function InlineError({ message, onRetry }) {
  return (
    <View style={styles.inline}>
      <Text style={styles.inlineIcon}>⚠️</Text>
      <Text style={styles.inlineText}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.inlineBtn}>
          <Text style={styles.inlineBtnText}>{t("retry")}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: SPACING.xxl, minHeight: 300 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.danger + "15", alignItems: "center", justifyContent: "center", marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.danger + "20" },
  icon: { fontSize: 36 },
  title: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: SPACING.sm },
  message: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: "center", marginBottom: SPACING.xl, lineHeight: 22 },
  btn: { backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: RADIUS.full, ...SHADOWS.glow },
  btnText: { ...TYPOGRAPHY.bodyBold, color: COLORS.white },
  inline: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.danger + "10", borderRadius: RADIUS.md, padding: SPACING.md, marginHorizontal: SPACING.lg, borderWidth: 1, borderColor: COLORS.danger + "15" },
  inlineIcon: { fontSize: 16, marginRight: SPACING.sm },
  inlineText: { flex: 1, ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  inlineBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, marginLeft: SPACING.sm },
  inlineBtnText: { ...TYPOGRAPHY.caption, color: COLORS.white, fontWeight: "600" },
});
