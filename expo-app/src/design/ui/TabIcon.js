import { useRef, useEffect } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { COLORS, SPACING, RADIUS } from "../DesignSystem";
import Icon from "./Icon";

const ICONS = {
  Feed: { active: "home", inactive: "home-outline" },
  Explore: { active: "search", inactive: "search-outline" },
  Reels: { active: "film", inactive: "film-outline" },
  Messages: { active: "chatbubble", inactive: "chatbubble-outline" },
  Profile: { active: "person", inactive: "person-outline" },
};

export default function TabIcon({ label, focused, badgeCount }) {
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

  const icons = ICONS[label] || { active: "ellipse", inactive: "ellipse-outline" };

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
        <Icon name={focused ? icons.active : icons.inactive} size="md" color={focused ? COLORS.primary : COLORS.textSecondary} />
        {badgeCount != null && badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount > 99 ? "99+" : badgeCount}</Text>
          </View>
        )}
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
  activeBar: { width: 16, height: 3, borderRadius: 1.5, backgroundColor: COLORS.primary, marginTop: 3, zIndex: 2 },
  glowRing: { position: "absolute", width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primaryGlow, top: -4 },
  badge: { position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: RADIUS.full, backgroundColor: COLORS.danger, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { fontSize: 10, fontWeight: "700", color: COLORS.white },
});
