import { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { COLORS, SPACING, RADIUS } from "../DesignSystem";

const ICONS = {
  Feed: { active: "🏠", inactive: "🏡" },
  Explore: { active: "🔍", inactive: "🔎" },
  Reels: { active: "🎬", inactive: "🎞️" },
  Messages: { active: "💬", inactive: "✉️" },
  Profile: { active: "👤", inactive: "👤" },
};

export default function TabIcon({ label, focused }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(pulse, { toValue: 1, damping: 12, stiffness: 200, mass: 0.6, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(pulse, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [focused, pulse, glow]);

  const icons = ICONS[label] || { active: "•", inactive: "•" };

  return (
    <Animated.View style={[
      styles.wrap,
      focused && styles.wrapActive,
      {
        transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
      },
    ]}>
      <Animated.View style={[
        styles.iconContainer,
        focused && {
          backgroundColor: "rgba(124, 111, 255, 0.15)",
        },
      ]}>
        <Text style={[styles.icon, focused && styles.iconActive]}>
          {focused ? icons.active : icons.inactive}
        </Text>
      </Animated.View>
      {focused && (
        <>
          <View style={styles.activeBar} />
          <Animated.View style={[styles.glowRing, {
            opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }),
            transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }],
          }]} />
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", width: 48, height: 52 },
  wrapActive: {},
  iconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 20, opacity: 0.4 },
  iconActive: { opacity: 1 },
  activeBar: { width: 16, height: 3, borderRadius: 1.5, backgroundColor: COLORS.primary, marginTop: 3, zIndex: 2 },
  glowRing: { position: "absolute", width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primaryGlow, top: -4 },
});
