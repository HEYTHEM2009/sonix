import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  StatusBar,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SIZES } from "../components/Theme";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

const PAGES = [
  {
    key: "welcome",
    emoji: "🎬",
    title: "Welcome to Sonix",
    desc: "The open-source social platform for short videos, reels, stories and live community. Build your own Instagram-style app in days, not months.",
  },
  {
    key: "reels",
    emoji: "✨",
    title: "Reels & Short Video",
    desc: "Vertical full-screen video feed with autoplay, likes, comments, saves, shares, hashtags, mentions and creator analytics.",
  },
  {
    key: "social",
    emoji: "💬",
    title: "Real-time Social",
    desc: "Follow people, send direct & group messages, post stories, comment and get rich push-style notifications.",
  },
  {
    key: "admin",
    emoji: "🛡️",
    title: "Built-in Admin & Moderation",
    desc: "Full admin dashboard: users, reports, content removal, roles, settings, bad-word filters and analytics — ready to ship.",
  },
  {
    key: "opensource",
    emoji: "🚀",
    title: "Yours to Own",
    desc: "100% original source. Laravel API + React Native/Expo. Deploy anywhere. No locked features. Start building now.",
  },
];

export default function OnboardingScreen({ navigation }) {
  const { t } = useLanguage();
  const { finishOnboarding } = useAuth();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatRef = useRef(null);

  const goNext = () => {
    if (index < PAGES.length - 1) {
      flatRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      finish();
    }
  };

  const finish = async () => {
    await finishOnboarding();
    navigation.replace("Login");
  };

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const renderItem = ({ item }) => (
    <View style={[styles.page, { width }]}>
      <View style={styles.emojiWrap}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.desc}>{item.desc}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.brandRow}>
        <Text style={styles.brand}>Sonix</Text>
        <TouchableOpacity onPress={finish}>
          <Text style={styles.skip}>{t("skip") || "Skip"}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatRef}
        data={PAGES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.key}
        renderItem={renderItem}
        onScroll={onScroll}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(i);
        }}
        scrollEventThrottle={16}
      />

      <View style={styles.dots}>
        {PAGES.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1.3, 0.8],
            extrapolate: "clamp",
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          });
          return (
            <Animated.View
              key={i}
              style={[styles.dot, { opacity, transform: [{ scale }] }]}
            />
          );
        })}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.btn} onPress={goNext} activeOpacity={0.85}>
          <Text style={styles.btnText}>
            {index === PAGES.length - 1 ? (t("getStarted") || "Get Started") : (t("next") || "Next")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  brand: { color: COLORS.primary, fontSize: 22, fontWeight: "800", letterSpacing: 0.5 },
  skip: { color: COLORS.textSecondary, fontSize: 14, fontWeight: "600" },
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
  },
  emojiWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(124,108,247,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 34,
  },
  emoji: { fontSize: 52 },
  title: { color: COLORS.text, fontSize: SIZES.title, fontWeight: "800", textAlign: "center", marginBottom: 16 },
  desc: { color: COLORS.textSecondary, fontSize: SIZES.lg, textAlign: "center", lineHeight: 24 },
  dots: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginVertical: 18 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.primary, marginHorizontal: 5 },
  footer: { paddingHorizontal: 24 },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusLg,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  btnText: { color: "#fff", fontSize: SIZES.lg, fontWeight: "700" },
});
