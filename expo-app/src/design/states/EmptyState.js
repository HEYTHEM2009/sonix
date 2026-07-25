import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from "../DesignSystem";
import { useLanguage } from "../../context/LanguageContext";

export default function EmptyState({ icon = "📭", title, message, actionLabel, onAction, secondaryAction }) {
  const { t } = useLanguage();
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title || t("nothingHere")}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.btn} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
      {secondaryAction}
    </View>
  );
}

export function EmptyRow({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", padding: SPACING.xxl, paddingTop: SPACING.huge, minHeight: 300 },
  iconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.primaryGlow, alignItems: "center", justifyContent: "center", marginBottom: SPACING.xl, borderWidth: 1, borderColor: "rgba(108,99,255,0.15)" },
  icon: { fontSize: 40 },
  title: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: SPACING.sm, textAlign: "center" },
  message: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: "center", marginBottom: SPACING.xl, lineHeight: 22 },
  btn: { backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: RADIUS.full },
  btnText: { ...TYPOGRAPHY.bodyBold, color: COLORS.white },
  row: { flexDirection: "row", alignItems: "center", padding: SPACING.md, marginHorizontal: SPACING.lg, backgroundColor: COLORS.card, borderRadius: RADIUS.md, marginBottom: SPACING.sm },
  rowIcon: { fontSize: 20, marginRight: SPACING.md },
  rowLabel: { ...TYPOGRAPHY.body, color: COLORS.text, flex: 1 },
});
