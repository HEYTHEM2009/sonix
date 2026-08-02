import { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet } from "react-native";
import Icon from "../ui/Icon";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from "../DesignSystem";
import { useLanguage } from "../../context/LanguageContext";

export default function ErrorState({ message, onRetry, icon = "alert-circle", hint }) {
  const { t } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size="xl" color={COLORS.danger} />
      </View>
      <Text style={styles.title}>{t("oops")}</Text>
      <Text style={styles.message}>{message || t("somethingWentWrong")}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
      {onRetry && (
        <TouchableOpacity style={styles.btn} onPress={onRetry} activeOpacity={0.7}>
          <Text style={styles.btnText}>{t("tryAgain")}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

export function InlineError({ message, onRetry }) {
  return (
    <View style={styles.inline}>
      <Icon name="alert-circle" size="sm" color={COLORS.danger} style={{ marginRight: SPACING.sm }} />
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
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: SPACING.xxl, minHeight: 300, backgroundColor: COLORS.glass, borderColor: COLORS.glassBorder, borderWidth: 1, margin: SPACING.lg, borderRadius: RADIUS.xl },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.danger + "15", alignItems: "center", justifyContent: "center", marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.danger + "20" },
  title: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: SPACING.sm },
  message: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: "center", marginBottom: SPACING.xl, lineHeight: 22 },
  hint: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, textAlign: "center", marginBottom: SPACING.lg, marginTop: -SPACING.md },
  btn: { backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: RADIUS.full, minHeight: 44, justifyContent: "center", ...SHADOWS.glow },
  btnText: { ...TYPOGRAPHY.bodyBold, color: COLORS.white },
  inline: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.danger + "10", borderRadius: RADIUS.md, padding: SPACING.md, marginHorizontal: SPACING.lg, borderWidth: 1, borderColor: COLORS.danger + "15" },
  inlineText: { flex: 1, ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  inlineBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, marginLeft: SPACING.sm },
  inlineBtnText: { ...TYPOGRAPHY.caption, color: COLORS.white, fontWeight: "600" },
});
