import { Dimensions, Platform } from "react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export const COLORS = {
  bg: "#050510",
  bgSecondary: "#0A0A1A",
  surface: "#0F0F2A",
  card: "rgba(18, 18, 50, 0.6)",
  cardElevated: "rgba(26, 26, 60, 0.7)",
  cardHover: "rgba(40, 40, 80, 0.8)",
  glass: "rgba(15, 15, 42, 0.6)",
  glassBorder: "rgba(108, 99, 255, 0.12)",
  glassLight: "rgba(255, 255, 255, 0.05)",

  primary: "#7C6FFF",
  primaryLight: "#9E94FF",
  primaryLighter: "#B8B0FF",
  primaryDark: "#5A4ED8",
  primaryGlow: "rgba(124, 111, 255, 0.3)",
  primaryGlowLight: "rgba(124, 111, 255, 0.15)",

  accent: "#F0A500",
  accentLight: "#FFC107",
  accentDark: "#D48900",
  accentGlow: "rgba(240, 165, 0, 0.25)",

  secondary: "#00D4AA",
  secondaryLight: "#33DFBD",
  secondaryGlow: "rgba(0, 212, 170, 0.2)",

  success: "#34D399",
  successLight: "#6EE7B7",
  warning: "#FBBF24",
  warningLight: "#FCD34D",
  danger: "#EF4444",
  dangerLight: "#F87171",
  info: "#60A5FA",

  text: "#F8F9FE",
  textSecondary: "#9CA3B8",
  textTertiary: "#6B7280",
  muted: "#4B5563",
  placeholder: "#6B7280",
  textInverse: "#0A0A1A",

  border: "rgba(124, 111, 255, 0.15)",
  borderLight: "rgba(124, 111, 255, 0.08)",
  borderAccent: "rgba(240, 165, 0, 0.2)",

  input: "rgba(15, 15, 42, 0.8)",
  inputBorder: "rgba(124, 111, 255, 0.15)",
  inputFocusBorder: "rgba(124, 111, 255, 0.5)",

  overlay: "rgba(0, 0, 0, 0.7)",
  overlayLight: "rgba(0, 0, 0, 0.3)",

  gradientPrimary: ["#7C6FFF", "#9E94FF"],
  gradientAccent: ["#F0A500", "#FFC107"],
  gradientPremium: ["#7C6FFF", "#00D4AA"],
  gradientSunset: ["#7C6FFF", "#F0A500"],
  gradientCard: ["rgba(26, 26, 60, 0.4)", "rgba(15, 15, 42, 0.6)"],
  gradientOverlay: ["transparent", "rgba(0, 0, 0, 0.9)"],
  gradientAurora: ["#7C6FFF", "#00D4AA", "#F0A500"],
  gradientGlass: ["rgba(124, 111, 255, 0.08)", "rgba(0, 212, 170, 0.04)"],
  gradientBubbleMine: ["#7C6FFF", "#9E94FF", "#B8B0FF", "#7C6FFF"],
  gradientBubbleGlow: ["rgba(124, 111, 255, 0.4)", "rgba(158, 148, 255, 0.15)", "transparent"],
  gradientBubbleReflect: ["rgba(255,255,255,0.12)", "rgba(255,255,255,0.02)", "transparent"],
  gradientStatusSent: ["#6B7280", "#9CA3B8"],
  gradientStatusRead: ["#00D26A", "#34D399"],
  gradientStatusFailed: ["#EF4444", "#F87171"],
  gradientPremiumBubble: ["#7C6FFF", "#9E94FF", "#B388FF", "#7C6FFF"],
  gradientParticle: ["#7C6FFF", "#00D4AA"],

  dynamicIsland: "rgba(10, 10, 26, 0.85)",
  tabBg: "rgba(10, 10, 26, 0.7)",
  tabBorder: "rgba(124, 111, 255, 0.1)",

  transparent: "transparent",
  white: "#FFFFFF",
  black: "#000000",

  amethyst: "#7C6FFF",
  amethystLight: "#9E94FF",
  gold: "#F0A500",
  goldLight: "#FFC107",
  emerald: "#00D4AA",
  ruby: "#EF4444",
  sapphire: "#60A5FA",

  celestial: "#60A5FA",
  screenBg: "#050510",
  safeAreaBg: "#050510",
};

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,
};

export const TYPOGRAPHY = {
  hero: { fontSize: 38, fontWeight: "900", lineHeight: 44, letterSpacing: -0.8 },
  h1: { fontSize: 30, fontWeight: "800", lineHeight: 36, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: "700", lineHeight: 30, letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: "700", lineHeight: 26 },
  h4: { fontSize: 17, fontWeight: "600", lineHeight: 22 },
  body: { fontSize: 15, fontWeight: "400", lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: "600", lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: "400", lineHeight: 18 },
  captionBold: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  small: { fontSize: 11, fontWeight: "400", lineHeight: 16 },
  smallBold: { fontSize: 11, fontWeight: "600", lineHeight: 16 },
  label: { fontSize: 12, fontWeight: "700", lineHeight: 16, letterSpacing: 0.5, textTransform: "uppercase" },
  stat: { fontSize: 22, fontWeight: "800", lineHeight: 26 },
  statLabel: { fontSize: 11, fontWeight: "500", lineHeight: 14, letterSpacing: 0.3 },
};

export const SHADOWS = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  xl: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 12,
  },
  glow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 10,
  },
  glowAccent: {
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  glass: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  floating: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 36,
    elevation: 16,
  },
};

export const RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 999,
};

export const STATUS_COLORS = {
  sending: COLORS.textTertiary,
  sent: COLORS.muted,
  delivered: COLORS.textSecondary,
  read: "#00D26A",
  failed: COLORS.danger,
};

export const BUBBLE = {
  maxWidth: "78%",
  paddingH: 16,
  paddingV: 12,
  radius: 22,
  radiusMineBottom: 4,
  radiusTheirsBottom: 4,
  marginBottom: 6,
};

export const SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  title: 26,
  hero: 32,
  radius: RADIUS.md,
  radiusLg: RADIUS.xl,
};

export const FONTS = {
  regular: { fontWeight: "400" },
  medium: { fontWeight: "500" },
  semiBold: { fontWeight: "600" },
  bold: { fontWeight: "700" },
  black: { fontWeight: "900" },
};

export const LAYOUT = {
  screenPadding: SPACING.lg,
  cardPadding: SPACING.md,
  screenWidth: SCREEN_W,
  screenHeight: SCREEN_H,
  isSmallDevice: SCREEN_W < 375,
  isTablet: SCREEN_W >= 768,
  isIOS: Platform.OS === "ios",
  isAndroid: Platform.OS === "android",
  statusBarHeight: Platform.OS === "ios" ? 44 : 24,
  bottomNavHeight: 85,
  tabBarHeight: 70,
};

export const ANIMATION = {
  spring: { damping: 15, stiffness: 200, mass: 1, useNativeDriver: true },
  springLight: { damping: 18, stiffness: 150, mass: 0.8, useNativeDriver: true },
  springHeavy: { damping: 12, stiffness: 250, mass: 1.2, useNativeDriver: true },
  springBouncy: { damping: 10, stiffness: 180, mass: 0.7, useNativeDriver: true },
  timing: { duration: 350, useNativeDriver: true },
  timingFast: { duration: 200, useNativeDriver: true },
  timingSlow: { duration: 500, useNativeDriver: true },
  timingVerySlow: { duration: 800, useNativeDriver: true },
};

export const GLASS = {
  default: {
    backgroundColor: COLORS.glass,
    borderColor: COLORS.glassBorder,
    borderWidth: 1,
    backdropFilter: "blur(20px)",
  },
  light: {
    backgroundColor: COLORS.glassLight,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 0.5,
  },
  elevated: {
    backgroundColor: "rgba(18, 18, 50, 0.7)",
    borderColor: "rgba(124, 111, 255, 0.15)",
    borderWidth: 1,
  },
};

export const BLUR = {
  intensity: {
    low: 5,
    medium: 15,
    high: 25,
  },
};
