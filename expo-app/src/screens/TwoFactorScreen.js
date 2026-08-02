import { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, Animated, StatusBar, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { COLORS, SIZES, FONTS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS, LAYOUT } from "../design/DesignSystem";
import VideoBackground from "../components/VideoBackground";

export default function TwoFactorScreen({ navigation, route }) {
  const { t, isRTL } = useLanguage();
  const { twoFactorLogin } = useAuth();
  const email = route.params?.email || "";
  const insets = useSafeAreaInsets();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(cardAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }).start();
  }, []);

  const handleVerify = async () => {
    if (code.trim().length !== 6) return Alert.alert(t("error"), t("enter6DigitCode") || "Enter the 6-digit code");
    setLoading(true);
    try {
      await twoFactorLogin(email, code.trim());
      // AuthContext now holds a valid token/user; navigate to the app root.
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (e) {
      Alert.alert(t("loginFailed"), e.response?.data?.message || t("invalidCode") || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <VideoBackground />
      <View style={s.overlay} />

      <KeyboardAvoidingView style={[s.inner, { paddingTop: insets.top + 20 }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Animated.View style={[s.card, { opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }]}>
          <Text style={s.title}>{t("twoFactorTitle") || "Two-Factor Authentication"}</Text>
          <Text style={s.subtitle}>{t("twoFactorSubtitle") || `Enter the 6-digit code sent to ${email}`}</Text>

          <TextInput
            style={s.input}
            placeholder="______"
            placeholderTextColor={COLORS.muted}
            value={code}
            onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
            autoFocus
          />

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleVerify} disabled={loading} activeOpacity={0.9}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={s.btnText}>{t("verify") || "Verify"}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backText}>{t("back") || "Back"}</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(13,13,26,0.35)", zIndex: 3, pointerEvents: "none" },
  inner: { flex: 1, paddingHorizontal: SPACING.xl, zIndex: 4, justifyContent: "center" },
  card: { backgroundColor: GLASS.bg, borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: GLASS.border, ...SHADOWS.glow, elevation: 20 },
  title: { fontSize: 22, ...FONTS.bold, color: COLORS.text, textAlign: "center" },
  subtitle: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.sm, marginBottom: SPACING.lg, textAlign: "center" },
  input: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.lg, paddingVertical: SPACING.md, fontSize: 28, letterSpacing: 8, color: COLORS.text, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: SPACING.md, ...FONTS.medium, textAlign: "center" },
  btn: { height: 54, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", ...SHADOWS.primary, elevation: 10 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: COLORS.text, fontSize: SIZES.lg, ...FONTS.bold },
  backBtn: { marginTop: SPACING.md, alignItems: "center" },
  backText: { color: COLORS.gold, fontSize: SIZES.sm, ...FONTS.medium },
});
