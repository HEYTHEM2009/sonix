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

export default function ResetPasswordScreen({ navigation, route }) {
  const { t, isRTL } = useLanguage();
  const [email, setEmail] = useState(route.params?.email || "");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const insets = useSafeAreaInsets();

  const cardAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const inputAnims = {
    email: useRef(new Animated.Value(0)).current,
    token: useRef(new Animated.Value(0)).current,
    password: useRef(new Animated.Value(0)).current,
    confirm: useRef(new Animated.Value(0)).current,
  };

  useEffect(() => {
    Animated.spring(cardAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }).start();
  }, []);

  const focusInput = (field) => { setFocusedField(field); Animated.spring(inputAnims[field], { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }).start(); };
  const blurInput = (field) => { setFocusedField(null); Animated.spring(inputAnims[field], { toValue: 0, tension: 40, friction: 7, useNativeDriver: true }).start(); };

  const handleReset = async () => {
    if (!email.trim() || !token.trim() || !password.trim() || !passwordConfirmation.trim()) {
      return Alert.alert(t("error"), t("allFieldsRequired"));
    }
    if (password !== passwordConfirmation) {
      return Alert.alert(t("error"), t("passwordMismatch"));
    }
    if (password.length < 8) {
      return Alert.alert(t("error"), t("passwordLength"));
    }
    setLoading(true);
    try {
      await client.post("/auth/reset-password", {
        email: email.trim(),
        token: token.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });
      Alert.alert(t("success"), t("resetSuccess"));
      navigation.navigate("Login");
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
          <Text style={s.tagline}>{t("resetPasswordTitle")}</Text>
        </View>

        <Animated.View style={[s.card, { opacity: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }), transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }, { perspective: 1000 }, { rotateX: cardAnim.interpolate({ inputRange: [0, 1], outputRange: ["10deg", "0deg"] }) }] }]}>
          <View style={s.cardGlow} />

          <Text style={s.subtitle}>{t("resetPasswordSubtitle")}</Text>

          <Animated.View style={[s.inputWrap, focusedField === "email" && s.inputWrapActive, { transform: [{ scale: inputAnims.email.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) }], shadowOpacity: inputAnims.email.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.4] }) }]}>
            <View style={[s.inputIconWrap, focusedField === "email" && s.inputIconActive]}><Icon name="mail" size="sm" color={COLORS.primaryLight} /></View>
            <TextInput style={s.input} placeholder={t("email")} placeholderTextColor={COLORS.muted} value={email} onChangeText={setEmail} onFocus={() => focusInput("email")} onBlur={() => blurInput("email")} autoCapitalize="none" keyboardType="email-address" textAlign={isRTL ? "right" : "left"} />
          </Animated.View>

          <Animated.View style={[s.inputWrap, focusedField === "token" && s.inputWrapActive, { transform: [{ scale: inputAnims.token.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) }], shadowOpacity: inputAnims.token.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.4] }) }]}>
            <View style={[s.inputIconWrap, focusedField === "token" && s.inputIconActive]}><Icon name="key" size="sm" color={COLORS.primaryLight} /></View>
            <TextInput style={s.input} placeholder={t("resetCode")} placeholderTextColor={COLORS.muted} value={token} onChangeText={setToken} onFocus={() => focusInput("token")} onBlur={() => blurInput("token")} autoCapitalize="none" textAlign={isRTL ? "right" : "left"} />
          </Animated.View>

          <Animated.View style={[s.inputWrap, focusedField === "password" && s.inputWrapActive, { transform: [{ scale: inputAnims.password.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) }], shadowOpacity: inputAnims.password.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.4] }) }]}>
            <View style={[s.inputIconWrap, focusedField === "password" && s.inputIconActive]}><Icon name="lock-closed" size="sm" color={COLORS.primaryLight} /></View>
            <TextInput style={s.input} placeholder={t("newPassword")} placeholderTextColor={COLORS.muted} value={password} onChangeText={setPassword} onFocus={() => focusInput("password")} onBlur={() => blurInput("password")} secureTextEntry={!showPassword} textAlign={isRTL ? "right" : "left"} />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}><Icon name={showPassword ? "eye" : "eye-off"} size="sm" color={COLORS.muted} /></TouchableOpacity>
          </Animated.View>

          <Animated.View style={[s.inputWrap, focusedField === "confirm" && s.inputWrapActive, { transform: [{ scale: inputAnims.confirm.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) }], shadowOpacity: inputAnims.confirm.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.4] }) }]}>
            <View style={[s.inputIconWrap, focusedField === "confirm" && s.inputIconActive]}><Icon name="lock-closed" size="sm" color={COLORS.primaryLight} /></View>
            <TextInput style={s.input} placeholder={t("confirmPassword")} placeholderTextColor={COLORS.muted} value={passwordConfirmation} onChangeText={setPasswordConfirmation} onFocus={() => focusInput("confirm")} onBlur={() => blurInput("confirm")} secureTextEntry={!showConfirm} textAlign={isRTL ? "right" : "left"} />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={s.eyeBtn}><Icon name={showConfirm ? "eye" : "eye-off"} size="sm" color={COLORS.muted} /></TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[s.btn, loading && s.btnDisabled]}
              onPress={handleReset}
              onPressIn={() => Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start()}
              onPressOut={() => Animated.spring(btnScale, { toValue: 1, tension: 50, friction: 3, useNativeDriver: true }).start()}
              disabled={loading} activeOpacity={0.9}
            >
              <View style={s.btnGlow} />
              <Text style={s.btnText}>{loading ? t("resetting") : t("resetPassword")}</Text>
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
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.overlayLight, zIndex: 3, pointerEvents: "none" },
  inner: { flex: 1, paddingHorizontal: SPACING.xxl, zIndex: 4 },
  topSection: { alignItems: "center", marginBottom: SPACING.xxxl },

  logoContainer: { alignItems: "center", marginBottom: SPACING.md, width: 90, height: 90 },
  logoShadow: { position: "absolute", bottom: -8, width: 70, height: 12, borderRadius: RADIUS.xs, backgroundColor: COLORS.gold, opacity: 0.25 },
  logoCard: { width: 80, height: 80, borderRadius: RADIUS.xxl, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 },
  logoInner: { width: 72, height: 72, borderRadius: RADIUS.xl, backgroundColor: COLORS.glassLight, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(212,165,116,0.2)" },
  logoText: { color: COLORS.accentLight, fontSize: 36, ...FONTS.black },

  appName: { fontSize: 34, ...FONTS.black, color: COLORS.text, letterSpacing: -1 },
  tagline: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },

  card: { ...GLASS.elevated, borderRadius: RADIUS.xxl, padding: SPACING.xxl, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 30, elevation: 20, overflow: "hidden" },
  cardGlow: { position: "absolute", top: -50, right: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: COLORS.primary, opacity: 0.06 },

  subtitle: { color: COLORS.textSecondary, fontSize: SIZES.sm, ...FONTS.medium, textAlign: "center", marginBottom: SPACING.xl },

  inputWrap: { ...GLASS.default, flexDirection: "row", alignItems: "center", borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, height: 54, gap: SPACING.sm, marginBottom: SPACING.md, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 5 },
  inputWrapActive: { borderColor: COLORS.primary, backgroundColor: COLORS.cardElevated },
  inputIconWrap: { width: 34, height: 34, borderRadius: RADIUS.sm, backgroundColor: COLORS.primaryGlowLight, alignItems: "center", justifyContent: "center" },
  inputIconActive: { backgroundColor: COLORS.primaryGlow },
  inputIcon: { fontSize: 15 },
  input: { flex: 1, color: COLORS.text, fontSize: SIZES.md, ...FONTS.medium },
  eyeBtn: { padding: RADIUS.xs },
  eyeIcon: { fontSize: 16 },

  btn: { height: 54, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10, overflow: "hidden" },
  btnGlow: { position: "absolute", top: 0, left: 0, right: 0, height: "50%", backgroundColor: "rgba(255,255,255,0.08)", borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: COLORS.text, fontSize: SIZES.lg, ...FONTS.bold, letterSpacing: 0.5 },

  divider: { flexDirection: "row", alignItems: "center", marginVertical: SPACING.xxl, gap: SPACING.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerDot: { width: 6, height: 6, borderRadius: RADIUS.xs, backgroundColor: COLORS.muted },

  backCard: { ...GLASS.default, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: "center" },
  backText: { color: COLORS.gold, fontSize: SIZES.md, ...FONTS.bold },

  version: { color: COLORS.muted, fontSize: SIZES.xs, textAlign: "center", paddingBottom: SPACING.xl, marginTop: "auto" },
});
