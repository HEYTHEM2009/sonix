import { View, Text, StyleSheet } from "react-native";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from "../DesignSystem";

const VARIANTS = {
  primary: { bg: COLORS.primary, text: COLORS.white, glow: COLORS.primaryGlow },
  accent: { bg: COLORS.accent, text: COLORS.black, glow: COLORS.accentGlow },
  danger: { bg: COLORS.danger, text: COLORS.white, glow: COLORS.danger + "30" },
  success: { bg: COLORS.success, text: COLORS.white, glow: COLORS.success + "30" },
  warning: { bg: COLORS.warning, text: COLORS.black, glow: COLORS.warning + "30" },
  glass: { bg: "rgba(124, 111, 255, 0.2)", text: COLORS.primaryLight, glow: "rgba(124, 111, 255, 0.1)" },
};

const SIZE_STYLES = {
  sm: { minWidth: 18, height: 18, paddingHorizontal: 4, text: { ...TYPOGRAPHY.smallBold, fontSize: 10 } },
  lg: { minWidth: 24, height: 24, paddingHorizontal: 8, text: { ...TYPOGRAPHY.smallBold, fontSize: 11 } },
};

export default function Badge({ count, max = 99, variant = "primary", size = "sm", showZero = false, style }) {
  if (!count || count <= 0) {
    if (showZero) { count = 0; } else { return null; }
  }
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZE_STYLES[size] || SIZE_STYLES.sm;
  const display = count > max ? `${max}+` : String(count);

  return (
    <View style={[styles.badge, { backgroundColor: v.bg }, s, style]}>
      <Text style={[styles.text, { color: v.text }, s.text]}>{display}</Text>
    </View>
  );
}

export function Dot({ color = COLORS.primary, size = 8, glow = false, style }) {
  return (
    <View style={[styles.dot, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }, glow && { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: size }, style]} />
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: "center", justifyContent: "center", borderRadius: RADIUS.full },
  text: { ...TYPOGRAPHY.smallBold },
  dot: {},
});
