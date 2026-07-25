import React, { memo, useRef, useEffect, Suspense } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { COLORS, SPACING, RADIUS, SHADOWS, LAYOUT } from "../design/DesignSystem";
import TabIcon from "../design/ui/TabIcon";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import TwoFactorScreen from "../screens/TwoFactorScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import FeedScreen from "../screens/FeedScreen";
import CreatePostScreen from "../screens/CreatePostScreen";
import ProfileScreen from "../screens/ProfileScreen";
import UserProfileScreen from "../screens/UserProfileScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import FollowersScreen from "../screens/FollowersScreen";
import UsersScreen from "../screens/UsersScreen";
import MessagesScreen from "../screens/MessagesScreen";
import ChatScreen from "../screens/ChatScreen";
import CommentsScreen from "../screens/CommentsScreen";
const CameraScreen = React.lazy(() => import("../screens/CameraScreen"));
import StoryViewerScreen from "../screens/StoryViewerScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import SavedPostsScreen from "../screens/SavedPostsScreen";
const ImageViewerScreen = React.lazy(() => import("../screens/ImageViewerScreen"));
import SharePostScreen from "../screens/SharePostScreen";
import LikeListScreen from "../screens/LikeListScreen";
import GroupChatScreen from "../screens/GroupChatScreen";
import CreateGroupScreen from "../screens/CreateGroupScreen";
import EditPostScreen from "../screens/EditPostScreen";
import SettingsScreen from "../screens/SettingsScreen";
const CreateStoryScreen = React.lazy(() => import("../screens/CreateStoryScreen"));
import VideoPostScreen from "../screens/VideoPostScreen";
import HighlightsScreen from "../screens/HighlightsScreen";
import BlockedUsersScreen from "../screens/BlockedUsersScreen";
import ExploreScreen from "../screens/ExploreScreen";
import SearchScreen from "../screens/SearchScreen";
import AdminScreen from "../screens/AdminScreen";
import HelpCenterScreen from "../screens/HelpCenterScreen";
import ReportProblemScreen from "../screens/ReportProblemScreen";
import TermsScreen from "../screens/TermsScreen";
import PrivacyScreen from "../screens/PrivacyScreen";
import HashtagPostsScreen from "../screens/HashtagPostsScreen";
import ReelsScreen from "../screens/ReelsScreen";
import CreateReelScreen from "../screens/CreateReelScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CreateButton({ navigation }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ]),
    ])).start();
  }, [scaleAnim, ringAnim]);

  const onPressIn = () => Animated.spring(rotate, { toValue: 1, damping: 15, stiffness: 250, useNativeDriver: true }).start();
  const onPressOut = () => {
    Animated.spring(rotate, { toValue: 0, damping: 15, stiffness: 250, useNativeDriver: true }).start();
    navigation.navigate("Create");
  };

  return (
    <TouchableOpacity onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={0.8} style={styles.createBtn}>
      <LinearGradient colors={COLORS.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.createGradient}>
        <Animated.View style={{ transform: [{ rotate: rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "90deg"] }) }] }}>
          <Text style={styles.createIcon}>+</Text>
        </Animated.View>
      </LinearGradient>
      <Animated.View style={[styles.createPulse, { opacity: scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] }), transform: [{ scale: scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }] }]} />
      <Animated.View style={[styles.ringGlow, { opacity: ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.4] }), transform: [{ scale: ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.2] }) }, { rotate: ringAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) }] }]} />
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { isRTL } = useLanguage();
  const tabs = state.routes;
  const orderedTabs = isRTL ? [...tabs].reverse() : tabs;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
    ])).start();
  }, [floatAnim]);

  return (
    <View style={[styles.tabContainer, { paddingBottom: Math.max(insets.bottom + 8, 16) }]}>
      <Animated.View style={[styles.tabBar, { transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]}>
        <View style={styles.tabBarGradient}>
          {orderedTabs.map((route) => {
            const originalIndex = tabs.indexOf(route);
            const isFocused = state.index === originalIndex;
            if (route.name === "Create") return <CreateButton key={route.name} navigation={navigation} />;
            return (
              <TouchableOpacity key={route.name} style={styles.tab} onPress={() => navigation.navigate(route.name)} activeOpacity={0.7}>
                <TabIcon label={route.name} focused={isFocused} />
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

function SuspenseScreen({ children }) {
  return <Suspense fallback={<View style={styles.suspense}><ActivityIndicator size="large" color={COLORS.primaryLight} /></View>}>{children}</Suspense>;
}

function HomeTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Reels" component={ReelsScreen} />
      <Tab.Screen name="Create" component={CreatePostScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading, onboarded } = useAuth();
  if (loading) return null;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.bg }, animation: "slide_from_right", animationDuration: 350 }}>
      {!user ? (
        onboarded ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="TwoFactor" component={TwoFactorScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="TwoFactor" component={TwoFactorScreen} />
          </>
        )
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeTabs} />
          <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          <Stack.Screen name="Followers" component={FollowersScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="GroupChat" component={GroupChatScreen} />
          <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
          <Stack.Screen name="Comments" component={CommentsScreen} />
          <Stack.Screen name="Camera" options={{ animation: "slide_from_bottom" }}>{() => <SuspenseScreen><CameraScreen /></SuspenseScreen>}</Stack.Screen>
          <Stack.Screen name="StoryViewer" component={StoryViewerScreen} options={{ animation: "fade" }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="SavedPosts" component={SavedPostsScreen} />
          <Stack.Screen name="ImageViewer" options={{ animation: "fade" }}>{() => <SuspenseScreen><ImageViewerScreen /></SuspenseScreen>}</Stack.Screen>
          <Stack.Screen name="SharePost" component={SharePostScreen} />
          <Stack.Screen name="LikeList" component={LikeListScreen} />
          <Stack.Screen name="EditPost" component={EditPostScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="CreateStory" options={{ animation: "slide_from_bottom" }}>{() => <SuspenseScreen><CreateStoryScreen /></SuspenseScreen>}</Stack.Screen>
          <Stack.Screen name="VideoPost" component={VideoPostScreen} options={{ animation: "fade" }} />
          <Stack.Screen name="Highlights" component={HighlightsScreen} />
          <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
          <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
          <Stack.Screen name="ReportProblem" component={ReportProblemScreen} />
          <Stack.Screen name="Terms" component={TermsScreen} />
          <Stack.Screen name="Privacy" component={PrivacyScreen} />
          <Stack.Screen name="HashtagPosts" component={HashtagPostsScreen} />
          <Stack.Screen name="CreateReel" component={CreateReelScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="Admin" component={AdminScreen} />
          <Stack.Screen name="Users" component={UsersScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabContainer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "transparent" },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginHorizontal: SPACING.lg,
    marginBottom: 4,
    height: 68,
    borderRadius: RADIUS.xxl,
    backgroundColor: COLORS.tabBg,
    borderWidth: 1,
    borderColor: COLORS.tabBorder,
    ...SHADOWS.floating,
    overflow: "hidden",
  },
  tabBarGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: SPACING.sm,
    backgroundColor: "rgba(10, 10, 26, 0.65)",
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", height: 52 },
  createBtn: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", marginTop: -16 },
  createGradient: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", ...SHADOWS.glow },
  createIcon: { fontSize: 30, color: COLORS.text, fontWeight: "300", marginTop: -2 },
  createPulse: { position: "absolute", width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.primary },
  ringGlow: { position: "absolute", width: 68, height: 68, borderRadius: 34, borderWidth: 1.5, borderColor: COLORS.accent },
  suspense: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg },
});
