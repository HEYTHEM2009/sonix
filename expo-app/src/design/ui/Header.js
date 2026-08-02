import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GLASS } from "../DesignSystem";
import { IconButton } from "./Button";

export default function Header({ title, leftAction, leftIcon, rightActions = [], subtitle, glass = false }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.sm }, glass && styles.glassContainer]}>
      <View style={styles.content}>
        <View style={styles.left}>
          {leftAction && (
            <IconButton icon={leftIcon || "←"} onPress={leftAction} color={COLORS.text} bgColor="rgba(255,255,255,0.05)" size={38} style={{ marginRight: SPACING.sm }} />
          )}
        </View>
        <View style={styles.center}>
          <Text style={[styles.title, glass && styles.glassTitle]} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>
        <View style={styles.right}>
          {rightActions.map((action, i) => (
            <IconButton key={i} icon={action.icon} onPress={action.onPress} color={COLORS.textSecondary} bgColor="rgba(255,255,255,0.03)" size={38} style={{ marginLeft: SPACING.xs }} />
          ))}
        </View>
      </View>
    </View>
  );
}

export function ScreenHeader({ title, rightContent, glass = false }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[glass ? styles.glassScreenHeader : styles.screenHeader, { paddingTop: insets.top + SPACING.sm }]}>
      <Text style={[styles.screenTitle, glass && { color: COLORS.text }]}>{title}</Text>
      {rightContent && <View style={styles.rightContent}>{rightContent}</View>}
    </View>
  );
}

export function PremiumHeader({ title, subtitle, gradient = false, style }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={gradient ? COLORS.gradientPremium : [COLORS.bg, COLORS.bgSecondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.premiumHeader, { paddingTop: insets.top + SPACING.xl }, style]}
    >
      <Text style={styles.eyebrow}>{subtitle || "SONIX"}</Text>
      <Text style={styles.premiumTitle}>{title}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "transparent", paddingBottom: SPACING.sm, borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight },
  glassContainer: { backgroundColor: GLASS.default.backgroundColor, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  content: { flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.md, minHeight: 48 },
  left: { minWidth: 50, alignItems: "flex-start" },
  center: { flex: 1, alignItems: "center" },
  title: { ...TYPOGRAPHY.bodyBold, color: COLORS.text, fontSize: 17 },
  glassTitle: { ...TYPOGRAPHY.bodyBold, color: COLORS.text },
  subtitle: { ...TYPOGRAPHY.small, color: COLORS.textSecondary },
  right: { minWidth: 50, flexDirection: "row", alignItems: "center", justifyContent: "flex-end" },
  screenHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight },
  glassScreenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    backgroundColor: GLASS.default.backgroundColor,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  screenTitle: { ...TYPOGRAPHY.h2, color: COLORS.text },
  rightContent: { flexDirection: "row", gap: SPACING.sm },
  premiumHeader: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl, borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight },
  eyebrow: { ...TYPOGRAPHY.label, color: COLORS.primaryLight, marginBottom: SPACING.xs },
  premiumTitle: { ...TYPOGRAPHY.hero, color: COLORS.text },
});
