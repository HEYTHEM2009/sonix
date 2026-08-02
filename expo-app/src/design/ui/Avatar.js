import { useState, useRef, useEffect } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, RADIUS, SHADOWS, SPACING } from "../DesignSystem";

const SIZES = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 56,
  xl: 72,
  xxl: 88,
  hero: 120,
};

export default function Avatar({
  source,
  username,
  size = "md",
  online = false,
  story = false,
  storyColors = COLORS.gradientPremium,
  glow = false,
  elevated = false,
  onPress,
  style,
}) {
  const [failed, setFailed] = useState(false);
  const ringAnim = useRef(new Animated.Value(0)).current;
  const dim = SIZES[size] || SIZES.md;
  const ringW = story ? 3 : glow ? 2 : 0;

  useEffect(() => {
    if (story || glow) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(ringAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [story, glow, ringAnim]);

  const content = (
    <View style={[styles.wrap, { width: dim + ringW * 4, height: dim + ringW * 4 }]}>
      {story ? (
        <Animated.View style={[styles.storyRing, { width: dim + 8, height: dim + 8, borderRadius: (dim + 8) / 2, opacity: ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] }) }]}>
          <LinearGradient colors={storyColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.storyGradient, { width: dim + 8, height: dim + 8, borderRadius: (dim + 8) / 2 }]}>
            <View style={[styles.storyInner, { width: dim - 2, height: dim - 2, borderRadius: (dim - 2) / 2 }]}>
              {renderAvatar()}
            </View>
          </LinearGradient>
        </Animated.View>
      ) : glow ? (
        <Animated.View style={[{ width: dim + 6, height: dim + 6, borderRadius: (dim + 6) / 2 }, { opacity: ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.2] }) }, SHADOWS.glow]}>
          {renderAvatar()}
        </Animated.View>
      ) : (
        renderAvatar()
      )}
      {online && <View style={[styles.onlineDot, { width: dim * 0.24, height: dim * 0.24, borderRadius: dim * 0.12, right: 1.5, bottom: 1.5, borderWidth: 2.5 }]} />}
    </View>
  );

  function renderAvatar() {
    return source && !failed ? (
      <Image
        source={{ uri: source }}
        style={[styles.image, { width: dim, height: dim, borderRadius: dim / 2 }]}
        onError={() => setFailed(true)}
      />
    ) : (
      <View style={[styles.placeholder, { width: dim, height: dim, borderRadius: dim / 2 }]}>
        <Text style={[styles.letter, { fontSize: dim * 0.42 }]}>
          {username?.[0]?.toUpperCase() || "?"}
        </Text>
      </View>
    );
  }

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[elevated && SHADOWS.glow, style]}>{content}</TouchableOpacity>;
  }
  return <View style={[elevated && SHADOWS.glow, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  wrap: { position: "relative", alignItems: "center", justifyContent: "center" },
  storyRing: { alignItems: "center", justifyContent: "center" },
  storyGradient: { alignItems: "center", justifyContent: "center" },
  storyInner: { backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" },
  image: { resizeMode: "cover" },
  placeholder: { backgroundColor: COLORS.primaryGlow, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.glassBorder },
  letter: { color: COLORS.primaryLight, fontWeight: "700", textAlign: "center", textAlignVertical: "center" },
  onlineDot: { position: "absolute", backgroundColor: COLORS.success, borderColor: COLORS.bg, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4 },
});
