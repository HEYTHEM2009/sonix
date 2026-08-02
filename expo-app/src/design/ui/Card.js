import { useRef, useEffect, useCallback, useMemo } from "react";
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING, RADIUS, SHADOWS, GLASS } from "../DesignSystem";

export default function Card({
  children,
  onPress,
  variant = "default",
  padding = SPACING.md,
  marginBottom = SPACING.md,
  animate = true,
  glass = false,
  gradient = false,
  glow = false,
  elevated = false,
  style,
}) {
  const mount = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animate) {
      Animated.spring(mount, { toValue: 1, damping: 18, stiffness: 150, mass: 0.8, useNativeDriver: true }).start();
    } else {
      mount.setValue(1);
    }
    if (glow) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(breath, { toValue: 1, duration: 2500, useNativeDriver: false }),
          Animated.timing(breath, { toValue: 0, duration: 2500, useNativeDriver: false }),
        ])
      ).start();
    }
  }, [animate, glow, mount, breath]);

  const onPressIn = useCallback(() => {
    Animated.spring(pressScale, { toValue: 0.98, damping: 15, stiffness: 200, useNativeDriver: true }).start();
  }, [pressScale]);

  const onPressOut = useCallback(() => {
    Animated.spring(pressScale, { toValue: 1, damping: 15, stiffness: 200, useNativeDriver: true }).start();
  }, [pressScale]);

  const bgColors = {
    default: COLORS.card,
    elevated: COLORS.cardElevated,
    surface: COLORS.surface,
    transparent: "transparent",
  };

  const combinedScale = useMemo(() =>
    animate
      ? Animated.multiply(
          mount.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1] }),
          pressScale
        )
      : pressScale,
    [animate, mount, pressScale]
  );

  const animatedStyle = animate ? {
    opacity: mount,
    transform: [
      { translateY: mount.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
      { scale: combinedScale },
    ],
  } : { transform: [{ scale: pressScale }] };

  const shadowStyle = elevated ? SHADOWS.floating : glow ? {
    ...SHADOWS.glow,
    shadowOpacity: breath.interpolate ? undefined : 0.4,
  } : SHADOWS.card;

  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? {
    onPress,
    onPressIn,
    onPressOut,
    activeOpacity: 0.7,
  } : {};

  if (glass) {
    return (
      <Animated.View style={[animatedStyle, style]}>
        <Wrapper {...wrapperProps}>
          <View style={[styles.glassCard, { padding, marginBottom }]}>
            <View style={styles.glassInner}>
              {children}
            </View>
          </View>
        </Wrapper>
      </Animated.View>
    );
  }

  if (gradient) {
    return (
      <Animated.View style={[styles.card, shadowStyle, animatedStyle, { marginBottom }, style]}>
        <LinearGradient colors={COLORS.gradientCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: RADIUS.lg, padding }}>
          <Wrapper {...wrapperProps}>
            {children}
          </Wrapper>
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.card, { backgroundColor: bgColors[variant], padding, marginBottom }, shadowStyle, animatedStyle, style]}>
      <Wrapper {...wrapperProps}>
        {children}
      </Wrapper>
    </Animated.View>
  );
}

export function CardRow({ children, onPress, style, glass = false }) {
  return (
    <TouchableOpacity
      style={[glass ? styles.glassRow : styles.row, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  );
}

export function FloatingCard({ children, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  return (
    <Animated.View
      style={[
        styles.floatingCard,
        {
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
          ],
        },
        SHADOWS.floating,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  glassCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: GLASS.default.backgroundColor,
    overflow: "hidden",
  },
  glassInner: {
    padding: SPACING.md,
    borderRadius: RADIUS.xl - 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  glassRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    backgroundColor: GLASS.default.backgroundColor,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  floatingCard: {
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.cardElevated,
    padding: SPACING.lg,
    borderWidth: 0.5,
    borderColor: COLORS.borderLight,
  },
});
