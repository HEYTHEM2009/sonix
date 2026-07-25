import { useRef, useEffect } from "react";
import { Animated, View, StyleSheet } from "react-native";
import { COLORS, RADIUS } from "../DesignSystem";

export function Skeleton({ width = "100%", height = 12, borderRadius = RADIUS.sm, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: COLORS.border, opacity }, style]}
    />
  );
}

export function PostSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Skeleton width={36} height={36} borderRadius={18} />
        <View style={styles.headerLines}>
          <Skeleton width={120} height={12} />
          <Skeleton width={60} height={8} style={{ marginTop: 4 }} />
        </View>
      </View>
      <Skeleton width="100%" height={200} borderRadius={RADIUS.md} style={styles.image} />
      <View style={styles.actions}>
        <Skeleton width={24} height={24} borderRadius={12} />
        <Skeleton width={24} height={24} borderRadius={12} />
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>
      <Skeleton width={80} height={12} />
      <Skeleton width="60%" height={10} style={{ marginTop: 8 }} />
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View style={styles.profile}>
      <Skeleton width={86} height={86} borderRadius={43} />
      <View style={styles.statsRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.stat}>
            <Skeleton width={40} height={16} />
            <Skeleton width={50} height={10} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>
      <Skeleton width={150} height={14} style={{ marginTop: 12 }} />
      <Skeleton width="80%" height={10} style={{ marginTop: 6 }} />
    </View>
  );
}

export function MessageSkeleton() {
  return (
    <View style={styles.msgRow}>
      <Skeleton width={52} height={52} borderRadius={26} />
      <View style={styles.msgContent}>
        <Skeleton width={120} height={14} />
        <Skeleton width="80%" height={10} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export default function LoadingState({ type = "post", count = 3 }) {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <View style={styles.container}>
      {type === "post" && items.map((i) => <PostSkeleton key={i} />)}
      {type === "profile" && <ProfileSkeleton />}
      {type === "message" && items.map((i) => <MessageSkeleton key={i} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 12, marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLines: { flex: 1 },
  image: { marginTop: 10 },
  actions: { flexDirection: "row", gap: 16, paddingVertical: 10 },
  profile: { alignItems: "center", padding: 20 },
  statsRow: { flexDirection: "row", gap: 40, marginTop: 16 },
  stat: { alignItems: "center" },
  msgRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  msgContent: { flex: 1 },
});
