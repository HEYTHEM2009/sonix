import { useRef, useCallback } from "react";
import { Text, TouchableOpacity, StyleSheet, ActivityIndicator, View, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "./Icon";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GLASS } from "../DesignSystem";

const VARIANTS = {
  primary: { bg: COLORS.primary, text: COLORS.white, border: COLORS.primary, gradient: COLORS.gradientPrimary },
  accent: { bg: COLORS.accent, text: COLORS.black, border: COLORS.accent, gradient: COLORS.gradientAccent },
  premium: { bg: COLORS.gradientPremium[0], text: COLORS.white, border: "transparent", gradient: COLORS.gradientPremium },
  sunset: { bg: COLORS.gradientSunset[0], text: COLORS.white, border: "transparent", gradient: COLORS.gradientSunset },
  secondary: { bg: COLORS.card, text: COLORS.text, border: COLORS.border },
  ghost: { bg: "transparent", text: COLORS.primaryLight, border: "transparent" },
  danger: { bg: COLORS.danger, text: COLORS.white, border: COLORS.danger },
  success: { bg: COLORS.success, text: COLORS.white, border: COLORS.success },
  glass: { bg: GLASS.default.backgroundColor, text: COLORS.text, border: GLASS.default.borderColor, glass: true },
};

const SIZES_MAP = {
  sm: { py: SPACING.sm, px: SPACING.lg, text: TYPOGRAPHY.captionBold },
  md: { py: SPACING.md + 2, px: SPACING.xl, text: TYPOGRAPHY.bodyBold },
  lg: { py: SPACING.lg, px: SPACING.xxl, text: { ...TYPOGRAPHY.h4, fontWeight: "600" } },
  xl: { py: SPACING.xl, px: SPACING.xxxl, text: { ...TYPOGRAPHY.h3, fontWeight: "700" } },
};

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  rounded = false,
  elevated = false,
  style,
  textStyle,
  ...props
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const elevation = useRef(new Animated.Value(0)).current;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES_MAP[size] || SIZES_MAP.md;

  const onPressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.96, damping: 10, stiffness: 200, mass: 0.8, useNativeDriver: true }),
      Animated.timing(elevation, { toValue: 1, duration: 100, useNativeDriver: false }),
    ]).start();
  }, [scale, elevation]);

  const onPressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, damping: 15, stiffness: 200, useNativeDriver: true }),
      Animated.timing(elevation, { toValue: 0, duration: 100, useNativeDriver: false }),
    ]).start();
  }, [scale, elevation]);

  const bgColor = disabled ? (v.bg ? v.bg + "40" : "#333") : v.bg;
  const isGlass = v.glass;

  const shadowStyle = elevated ? (variant === "primary" || variant === "premium" ? SHADOWS.floating : SHADOWS.glass) : variant === "primary" && !disabled ? SHADOWS.glow : isGlass && !disabled ? SHADOWS.glass : {};

  const content = (
    <View style={[styles.content, iconPosition === "right" && { flexDirection: "row-reverse" }]}>
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <>
          {icon && <Icon name={icon} size="md" color={v.text} />}
          <Text style={[s.text, { color: disabled ? v.text + "50" : v.text }, icon && styles.textWithIcon, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </View>
  );

  const borderRadius = rounded ? RADIUS.full : RADIUS.md;

  if (v.gradient && !disabled && !isGlass) {
    return (
      <Animated.View style={[{ transform: [{ scale }] }, shadowStyle, fullWidth && { width: "100%" }]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={disabled || loading}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ disabled: disabled || loading }}
          accessibilityLabel={title}
          style={[fullWidth && styles.fullWidth, style]}
          {...props}
        >
          <LinearGradient
            colors={v.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.base, { paddingVertical: s.py, paddingHorizontal: s.px, borderRadius }]}
          >
            {content}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ transform: [{ scale }] }, shadowStyle, fullWidth && { width: "100%" }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
        accessibilityLabel={title}
        style={[
          styles.base,
          isGlass && GLASS.default,
          {
            backgroundColor: isGlass ? undefined : bgColor,
            borderColor: disabled ? v.border + "30" : v.border,
            paddingVertical: s.py,
            paddingHorizontal: s.px,
            borderRadius,
          },
          variant === "secondary" && SHADOWS.sm,
          fullWidth && styles.fullWidth,
          style,
        ]}
        {...props}
      >
        {content}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function IconButton({ icon, onPress, size = 44, color = COLORS.primaryLight, bgColor = "transparent", rounded = true, elevated = false, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = useCallback(() => Animated.spring(scale, { toValue: 0.85, damping: 12, stiffness: 250, useNativeDriver: true }).start(), [scale]);
  const onPressOut = useCallback(() => Animated.spring(scale, { toValue: 1, damping: 15, stiffness: 200, useNativeDriver: true }).start(), [scale]);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, elevated && SHADOWS.glow]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.7}
        accessibilityRole="button"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={[
          styles.iconBtn,
          {
            width: size, height: size,
            borderRadius: rounded ? size / 2 : RADIUS.md,
            backgroundColor: bgColor,
          },
          style,
        ]}
      >
        <Icon name={icon} size="lg" color={color} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function GlassButton({ title, onPress, icon, size = "md", style }) {
  const s = SIZES_MAP[size] || SIZES_MAP.md;
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = useCallback(() => Animated.spring(scale, { toValue: 0.95, damping: 12, stiffness: 200, useNativeDriver: true }).start(), [scale]);
  const onPressOut = useCallback(() => Animated.spring(scale, { toValue: 1, damping: 15, stiffness: 200, useNativeDriver: true }).start(), [scale]);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, SHADOWS.glass]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.7}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        style={[styles.glassBtn, { paddingVertical: s.py, paddingHorizontal: s.px }, style]}
      >
        {icon && <Icon name={icon} size="md" color={COLORS.text} style={{ marginRight: SPACING.sm }} />}
        <Text style={[styles.glassText, s.text]}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center", borderWidth: 1, minHeight: 44 },
  fullWidth: { width: "100%" },
  content: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  textWithIcon: { marginLeft: SPACING.sm },
  iconBtn: { alignItems: "center", justifyContent: "center" },
  glassBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GLASS.default.backgroundColor,
    borderColor: COLORS.glassBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    minHeight: 44,
  },
  glassText: { color: COLORS.text },
});
