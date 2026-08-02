import { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, Animated, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../context/LanguageContext";
import { COLORS, SIZES, FONTS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS, LAYOUT } from "../design/DesignSystem";
import VideoBackground from "../components/VideoBackground";
import Icon from "../design/ui/Icon";
import client from "../api/client";

function Logo3D() {
  const rotateY = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.timing(rotateY, { toValue: 360, duration: 8000, useNativeDriver: true })).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[s.logoContainer, { transform: [{ translateY: floatAnim }] }]}>
      <View style={s.logoShadow} />
      <Animated.View style={[s.logoCard, { transform: [{ perspective: 800 }, { rotateY: rotateY.interpolate({ inputRange: [0, 360], outputRange: ["0deg", "360deg"] }) }] }]}>
        <View style={s.logoInner}><Text style={s.logoText}>S</Text></View>
      </Animated.View>
    </Animated.View>
  );
}

export default function ForgotPasswordScreen({ navigation }) {
  const { t, isRTL } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const insets = useSafeAreaInsets();

  const cardAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const emailAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(cardAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }).start();
  }, []);

  const focusInput = () => {
    setFocusedField("email");
    Animated.spring(emailAnim, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }).start();
  };
  const blurInput = () => {
    setFocusedField(null);
    Animated.spring(emailAnim, { toValue: 0, tension: 40, friction: 7, useNativeDriver: true }).start();
  };

  const handleSendCode = async () => {
    if (!email.trim()) return Alert.alert(t("error"), t("allFieldsRequired"));
    setLoading(true);
    try {
      await client.post("/auth/forgot-password", { email: email.trim() });
      Alert.alert(t("success"), t("codeSent"));
      navigation.navigate("ResetPassword", { email: email.trim() });
    } catch (e) {
      Alert.alert(t("error"), e.response?.data?.message || t("resetFailed"));
    }
    setLoading(false);
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <VideoBackground />
      <View style={s.overlay} />

      <KeyboardAvoidingView style={[s.inner, { paddingTop: insets.top + 20 }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={s.topSection}>
          <Logo3D />
          <Text style={s.appName}>{t("sonix")}</Text>
          <Text style={s.tagline}>{t("forgotPasswordTitle")}</Text>
        </View>

        <Animated.View style={[s.card, { opacity: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }), transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }, { perspective: 1000 }, { rotateX: cardAnim.interpolate({ inputRange: [0, 1], outputRange: ["10deg", "0deg"] }) }] }]}>
          <View style={s.cardGlow} />

          <Text style={s.subtitle}>{t("forgotPasswordSubtitle")}</Text>

          <Animated.View style={[s.inputWrap, focusedField === "email" && s.inputWrapActive, { transform: [{ scale: emailAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) }], shadowOpacity: emailAnim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.4] }) }]}>
            <View style={[s.inputIconWrap, focusedField === "email" && s.inputIconActive]}><Icon name="mail" size="sm" color={COLORS.primaryLight} /></View>
            <TextInput style={s.input} placeholder={t("email")} placeholderTextColor={COLORS.muted} value={email} onChangeText={setEmail} onFocus={focusInput} onBlur={blurInput} autoCapitalize="none" keyboardType="email-address" textAlign={isRTL ? "right" : "left"} />
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[s.btn, loading && s.btnDisabled]}
              onPress={handleSendCode}
              onPressIn={() => Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start()}
              onPressOut={() => Animated.spring(btnScale, { toValue: 1, tension: 50, friction: 3, useNativeDriver: true }).start()}
              disabled={loading} activeOpacity={0.9}
            >
              <View style={s.btnGlow} />
              <Text style={s.btnText}>{loading ? t("sending") : t("sendCode")}</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        <View style={s.divider}>
          <View style={s.dividerLine} /><View style={s.dividerDot} /><View style={s.dividerLine} />
        </View>

        <TouchableOpacity style={s.backCard} onPress={() => navigation.navigate("Login")} activeOpacity={0.8}>
          <Text style={s.backText}>{t("backToLogin")}</Text>
        </TouchableOpacity>

        <Text style={s.version}>{t("appVersion")}</Text>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(13,13,26,0.35)", zIndex: 3, pointerEvents: "none" },
  inner: { flex: 1, paddingHorizontal: SPACING.xl, zIndex: 4 },
  topSection: { alignItems: "center", marginBottom: SPACING.xl },

  logoContainer: { alignItems: "center", marginBottom: SPACING.md, width: 90, height: 90 },
  logoShadow: { position: "absolute", bottom: -8, width: 70, height: 12, borderRadius: RADIUS.sm, backgroundColor: COLORS.gold, opacity: 0.25 },
  logoCard: { width: 80, height: 80, borderRadius: RADIUS.xl, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", ...SHADOWS.accent, elevation: 15 },
  logoInner: { width: 72, height: 72, borderRadius: RADIUS.lg, backgroundColor: GLASS.highlight, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: COLORS.borderAccent },
  logoText: { color: COLORS.goldLight, fontSize: 36, ...FONTS.black },

  appName: { fontSize: 34, ...FONTS.black, color: COLORS.text, letterSpacing: -1 },
  tagline: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },

  card: { backgroundColor: GLASS.bg, borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: GLASS.border, ...SHADOWS.glow, elevation: 20, overflow: "hidden" },
  cardGlow: { position: "absolute", top: -50, right: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: COLORS.primary, opacity: 0.06 },

  subtitle: { color: COLORS.textSecondary, fontSize: SIZES.sm, ...FONTS.medium, textAlign: "center", marginBottom: SPACING.lg },

  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, height: 54, gap: SPACING.sm, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: SPACING.md, ...SHADOWS.sm, elevation: 5 },
  inputWrapActive: { borderColor: COLORS.primary, backgroundColor: COLORS.surface },
  inputIconWrap: { width: 34, height: 34, borderRadius: RADIUS.sm, backgroundColor: GLASS.bg, alignItems: "center", justifyContent: "center" },
  inputIconActive: { backgroundColor: COLORS.primaryGlowLight },
  inputIcon: { fontSize: 15, color: COLORS.primaryLight },
  input: { flex: 1, color: COLORS.text, fontSize: SIZES.md, ...FONTS.medium },

  btn: { height: 54, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", ...SHADOWS.primary, elevation: 10, overflow: "hidden" },
  btnGlow: { position: "absolute", top: 0, left: 0, right: 0, height: "50%", backgroundColor: GLASS.highlight, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: COLORS.text, fontSize: SIZES.lg, ...FONTS.bold, letterSpacing: 0.5 },

  divider: { flexDirection: "row", alignItems: "center", marginVertical: SPACING.xl, gap: SPACING.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerDot: { width: 6, height: 6, borderRadius: RADIUS.xs, backgroundColor: COLORS.muted },

  backCard: { backgroundColor: GLASS.bg, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  backText: { color: COLORS.gold, fontSize: SIZES.md, ...FONTS.bold },

  version: { color: COLORS.muted, fontSize: SIZES.xs, textAlign: "center", paddingBottom: SPACING.lg, marginTop: "auto" },
});
