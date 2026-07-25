import { useState, useRef, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Animated, Dimensions, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS, LAYOUT } from "../design/DesignSystem";
import Button from "../design/ui/Button";
import Input from "../design/ui/Input";

const { width: SCREEN_W } = Dimensions.get("window");

export default function LoginScreen({ navigation }) {
  const { t, isRTL } = useLanguage();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoAnim, { toValue: 1, damping: 15, stiffness: 120, mass: 0.8, useNativeDriver: true }),
      Animated.spring(formAnim, { toValue: 1, damping: 18, stiffness: 150, mass: 0.9, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, [logoAnim, formAnim, floatAnim]);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) { setError(t("fillFields")); return; }
    setLoading(true);
    setError("");
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || t("loginError"));
    }
    setLoading(false);
  }, [email, password, login, t]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={[COLORS.bg, COLORS.bgSecondary, COLORS.surface]} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handed" showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.logoSection, { opacity: logoAnim, transform: [{ translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }] }]}>
            <Animated.View style={[styles.logoGlow, { transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) }] }]}>
              <LinearGradient colors={COLORS.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoGradient}>
                <Text style={styles.logoIcon}>✦</Text>
              </LinearGradient>
            </Animated.View>
            <Text style={styles.brand}>SONIX</Text>
            <Text style={styles.tagline}>{t("welcomeBack")}</Text>
          </Animated.View>

          <Animated.View style={{ opacity: formAnim, transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }}>
            <View style={styles.glassCard}>
              <View style={styles.glassInner}>
                <Input
                  label={t("email")}
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon="✉️"
                  glass
                />
                <Input
                  label={t("password")}
                  placeholder={t("passwordPlaceholder")}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  icon="🔒"
                  glass
                />
                {error && <Text style={styles.error}>{error}</Text>}
                <Button title={loading ? t("signingIn") : t("signIn")} onPress={handleLogin} loading={loading} fullWidth size="lg" variant="premium" elevated style={{ marginTop: SPACING.sm }} />
                <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate("ForgotPassword")}>
                  <Text style={styles.forgotText}>{t("forgotPassword")}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t("noAccount")}</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.footerLink}>{t("signUp")}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.screenBg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: SPACING.xxl, paddingBottom: SPACING.xxxl },
  logoSection: { alignItems: "center", marginBottom: SPACING.xxxl * 1.2 },
  logoGlow: { width: 88, height: 88, borderRadius: 44, marginBottom: SPACING.lg, ...SHADOWS.floating },
  logoGradient: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center" },
  logoIcon: { fontSize: 40, color: COLORS.text },
  brand: { ...TYPOGRAPHY.hero, color: COLORS.text, letterSpacing: 4, marginBottom: SPACING.xs },
  tagline: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  glassCard: {
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: GLASS.default.borderColor,
    backgroundColor: GLASS.default.backgroundColor,
    overflow: "hidden",
    ...SHADOWS.glass,
  },
  glassInner: { padding: SPACING.xxl },
  error: { ...TYPOGRAPHY.caption, color: COLORS.danger, textAlign: "center", marginBottom: SPACING.md },
  forgotBtn: { alignItems: "center", paddingVertical: SPACING.lg },
  forgotText: { ...TYPOGRAPHY.captionBold, color: COLORS.primaryLight },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: SPACING.xxl, gap: SPACING.xs },
  footerText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  footerLink: { ...TYPOGRAPHY.bodyBold, color: COLORS.primaryLight },
});
