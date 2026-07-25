import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from "../DesignSystem";
import { useLanguage } from "../../context/LanguageContext";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";

export default function OfflineState({ onRetry }) {
  const { t } = useLanguage();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconWrap, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }]}>
        <Text style={styles.icon}>📡</Text>
      </Animated.View>
      <Text style={styles.title}>{t("noConnection")}</Text>
      <Text style={styles.message}>{t("offlineMessage")}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.btn} onPress={onRetry} activeOpacity={0.8}>
          <Text style={styles.btnText}>{t("retry")}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function OfflineBanner() {
  const { t } = useLanguage();
  const isOffline = useNetworkStatus?.() ?? false;
  const slide = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.spring(slide, { toValue: isOffline ? 0 : -50, tension: 60, friction: 12, useNativeDriver: true }).start();
  }, [isOffline, slide]);

  if (!isOffline) return null;

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slide }] }]}>
      <View style={styles.bannerDot} />
      <Text style={styles.bannerText}>{t("offline")}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: SPACING.xxl, minHeight: 300 },
  iconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.warning + "15", alignItems: "center", justifyContent: "center", marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.warning + "20" },
  icon: { fontSize: 40 },
  title: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: SPACING.sm },
  message: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: "center", marginBottom: SPACING.xl },
  btn: { backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: RADIUS.full, ...SHADOWS.glow },
  btnText: { ...TYPOGRAPHY.bodyBold, color: COLORS.white },
  banner: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.warning + "20", paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.warning + "15" },
  bannerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.warning, marginRight: SPACING.sm },
  bannerText: { ...TYPOGRAPHY.captionBold, color: COLORS.warning },
});
