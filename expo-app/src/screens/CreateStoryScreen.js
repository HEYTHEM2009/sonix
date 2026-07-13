import React, { useState, useRef, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal, Animated, Keyboard, KeyboardAvoidingView, Platform, FlatList, Image, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
const loadMediaLibrary = () => import("expo-media-library");
const loadFileSystem = () => import("expo-file-system/legacy");
import client from "../api/client";
import { COLORS, SIZES, FONTS } from "../components/Theme";
import { useLanguage } from "../context/LanguageContext";
const StoryEditor = React.lazy(() => import("../components/StoryEditor"));
import Screen3D from "../components/3D/Screen3D";

const { width: SCREEN_W } = Dimensions.get("window");
const GRID_COLS = 3;
const GRID_GAP = 2;
const GRID_ITEM_SIZE = (SCREEN_W - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

export default function CreateStoryScreen({ navigation }) {
  const { t } = useLanguage();
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [step, setStep] = useState("pick");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState("");
  const [recentAssets, setRecentAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadRecentAssets();
  }, []);

  const loadRecentAssets = async () => {
    try {
      const MediaLibrary = await loadMediaLibrary();
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === "granted");
      if (status !== "granted") {
        setAssetsLoading(false);
        return;
      }

      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: ["photo", "video"],
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        first: 50,
      });

      setRecentAssets(assets.map((a) => ({
        id: a.id,
        uri: a.uri,
        mediaType: a.mediaType === "video" ? "video" : "image",
        duration: a.duration,
        filename: a.filename,
        creationTime: a.creationTime,
      })));
    } catch (e) {
      console.warn("Failed to load assets:", e);
    }
    setAssetsLoading(false);
  };

  const animateProgress = (toValue) => {
    Animated.timing(progressAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleAssetPress = (asset) => {
    if (asset.mediaType === "video" && asset.duration && asset.duration > 60) {
      Alert.alert(t("tooLong"), t("videoTooLong"));
      return;
    }
    setMedia(asset.uri);
    setMediaType(asset.mediaType);
    setStep("edit");
  };

  const capture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("permissionNeeded"), t("grantCameraPhoto"));
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        setMedia(result.assets[0].uri);
        setMediaType("image");
        setStep("edit");
      }
    } catch (e) {
      Alert.alert(t("error"), t("failedToCapturePhoto"));
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("permissionNeeded"), t("grantCameraRollPhoto"));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        setMedia(result.assets[0].uri);
        setMediaType("image");
        setStep("edit");
      }
    } catch (e) {
      Alert.alert(t("error"), t("failedToPickImage"));
    }
  };

  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("permissionNeeded"), t("grantCameraRollVideo"));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        if (asset.duration && asset.duration > 60000) {
          Alert.alert(t("tooLong"), t("videoTooLong"));
          return;
        }
        setMedia(asset.uri);
        setMediaType("video");
        setStep("edit");
      }
    } catch (e) {
      Alert.alert(t("error"), t("failedToPickVideo"));
    }
  };

  const postStory = async ({ text_overlay, text_color, bg_color, duration, imageUri, videoUri, mediaType: mType, stickers, drawing_data }) => {
    const hasImage = mType !== "video" && imageUri;
    const hasVideo = mType === "video" && videoUri;
    const hasText = text_overlay && text_overlay.trim().length > 0;
    const hasStickers = stickers && stickers.length > 0;
    const hasDrawing = drawing_data && drawing_data.length > 0;

    if (!hasImage && !hasVideo && !hasText) {
      Alert.alert(t("emptyStory"), t("addContent"));
      return;
    }

    Keyboard.dismiss();
    setUploading(true);
    setUploadProgress(0);
    setUploadPhase(t("preparing"));
    animateProgress(0);

    const formData = new FormData();
    if (text_overlay) formData.append("text_overlay", text_overlay);
    if (text_color) formData.append("text_color", text_color);
    if (bg_color) formData.append("bg_color", bg_color);
    formData.append("duration", String(duration || 5));
    if (stickers) formData.append("stickers", JSON.stringify(stickers));
    if (drawing_data) formData.append("drawing_data", JSON.stringify(drawing_data));

    if (hasVideo && videoUri) {
      setUploadPhase(t("uploadingVideo"));
      try {
        const FS = await loadFileSystem();
        const fileInfo = await FS.getInfoAsync(videoUri);
        if (fileInfo.exists && fileInfo.size > 50 * 1024 * 1024) {
          setUploading(false);
          Alert.alert(t("error"), "Video too large (max 50MB)");
          return;
        }
      } catch (_) {}
      const ext = videoUri.split(".").pop() || "mp4";
      const mimeMap = { mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm" };
      const filename = `story_${Date.now()}.${ext}`;
      formData.append("video", { uri: videoUri, name: filename, type: mimeMap[ext] || "video/mp4" });
    } else if (hasImage && imageUri) {
      const filename = `story_${Date.now()}.jpg`;
      formData.append("image", { uri: imageUri, name: filename, type: "image/jpeg" });
      setUploadPhase(t("uploadingPhoto"));
    } else {
      setUploadPhase(t("publishing"));
    }

    animateProgress(0.3);
    setUploadProgress(30);

    try {
      const res = await client.post("/stories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(Math.min(percent, 90));
            animateProgress(percent / 100);
          }
        },
      });

      setUploadPhase(t("published"));
      setUploadProgress(100);
      animateProgress(1);

      setTimeout(() => {
        setUploading(false);
        navigation.navigate("Home", { screen: "Feed" });
      }, 600);

    } catch (e) {
      setUploading(false);
      const msg = e?.response?.data?.message || e?.message || t("error");
      Alert.alert(t("error"), t("failedToPostStory").replace("{message}", msg));
    }
  };

  if (step === "edit") {
    return (
      <Screen3D style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[s.topBar, { paddingTop: insets.top + 6 }]}>
            <TouchableOpacity onPress={() => { setStep("pick"); setMedia(null); Keyboard.dismiss(); }}>
              <Text style={s.closeText}>✕</Text>
            </TouchableOpacity>
            <Text style={s.title}>{t("editStory")}</Text>
            <View style={{ width: 40 }} />
          </View>
          <StoryEditor
            imageUri={mediaType === "image" ? media : null}
            videoUri={mediaType === "video" ? media : null}
            mediaType={mediaType}
            onPost={postStory}
          />
        </KeyboardAvoidingView>

        <Modal visible={uploading} transparent animationType="fade" statusBarTranslucent>
          <View style={s.uploadOverlay}>
            <View style={s.uploadBox}>
              <View style={s.uploadIconWrap}>
                {uploadProgress >= 100 ? (
                  <Text style={s.uploadCheckmark}>✓</Text>
                ) : (
                  <ActivityIndicator size="large" color={COLORS.primary} />
                )}
              </View>
              <Text style={s.uploadPhase}>{uploadPhase}</Text>
              <View style={s.progressTrack}>
                <Animated.View
                  style={[s.progressFill, {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  }]}
                />
              </View>
              <Text style={s.progressText}>{uploadProgress}%</Text>
            </View>
          </View>
        </Modal>
      </Screen3D>
    );
  }

  const renderAsset = ({ item, index }) => (
    <TouchableOpacity
      key={item.id}
      style={s.gridItem}
      onPress={() => handleAssetPress(item)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.uri }} style={s.gridImage} />
      {item.mediaType === "video" && (
        <View style={s.videoBadge}>
          <Text style={s.videoBadgeText}>▶</Text>
          {item.duration > 0 && (
            <Text style={s.videoDuration}>
              {Math.floor(item.duration / 60)}:{String(Math.floor(item.duration % 60)).padStart(2, "0")}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <>
      <TouchableOpacity style={s.cameraItem} onPress={capture} activeOpacity={0.7}>
        <View style={s.cameraCircle}>
          <Text style={s.cameraIcon}>📷</Text>
        </View>
        <Text style={s.cameraLabel}>{t("camera")}</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.closeBtn}>
          <Text style={s.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t("addToStory")}</Text>
        <TouchableOpacity style={s.settingsBtn}>
          <Text style={s.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={s.optionsRow}>
        <TouchableOpacity style={s.optionCard} onPress={pickImage} activeOpacity={0.7}>
          <View style={[s.optionIconWrap, { backgroundColor: "#FF6B6B20" }]}>
            <Text style={s.optionEmoji}>🎨</Text>
          </View>
          <Text style={s.optionLabel}>{t("templates")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.optionCard} onPress={pickVideo} activeOpacity={0.7}>
          <View style={[s.optionIconWrap, { backgroundColor: "#A855F720" }]}>
            <Text style={s.optionEmoji}>🎵</Text>
          </View>
          <Text style={s.optionLabel}>{t("music")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.optionCard} onPress={pickImage} activeOpacity={0.7}>
          <View style={[s.optionIconWrap, { backgroundColor: "#F59E0B20" }]}>
            <Text style={s.optionEmoji}>🖼️</Text>
          </View>
          <Text style={s.optionLabel}>{t("collage")}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.recentHeader}>
        <Text style={s.recentTitle}>{t("recent")}</Text>
        <TouchableOpacity onPress={pickImage}>
          <Text style={s.selectBtn}>{t("select")}</Text>
        </TouchableOpacity>
      </View>

      {assetsLoading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : !hasPermission ? (
        <View style={s.loadingWrap}>
          <Text style={s.emptyText}>{t("grantCameraRollPhoto")}</Text>
          <TouchableOpacity style={s.grantBtn} onPress={loadRecentAssets}>
            <Text style={s.grantBtnText}>{t("grantPermission")}</Text>
          </TouchableOpacity>
        </View>
      ) : recentAssets.length === 0 ? (
        <View style={s.loadingWrap}>
          <Text style={s.emptyText}>{t("emptyFeed")}</Text>
        </View>
      ) : (
        <FlatList
          data={recentAssets}
          keyExtractor={(item) => item.id}
          numColumns={GRID_COLS}
          renderItem={renderAsset}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={s.gridContainer}
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({
            length: GRID_ITEM_SIZE,
            offset: (GRID_ITEM_SIZE) * Math.floor(index / GRID_COLS),
            index,
          })}
        />
      )}

      <Modal visible={uploading} transparent animationType="fade" statusBarTranslucent>
        <View style={s.uploadOverlay}>
          <View style={s.uploadBox}>
            <View style={s.uploadIconWrap}>
              {uploadProgress >= 100 ? (
                <Text style={s.uploadCheckmark}>✓</Text>
              ) : (
                <ActivityIndicator size="large" color={COLORS.primary} />
              )}
            </View>
            <Text style={s.uploadPhase}>{uploadPhase}</Text>
            <View style={s.progressTrack}>
              <Animated.View
                style={[s.progressFill, {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                }]}
              />
            </View>
            <Text style={s.progressText}>{uploadProgress}%</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center" },
  closeText: { fontSize: 18, color: COLORS.text, ...FONTS.bold },
  headerTitle: { fontSize: SIZES.lg, ...FONTS.bold, color: COLORS.text },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center" },
  settingsIcon: { fontSize: 18 },

  optionsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  optionCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: 16, alignItems: "center", gap: 8 },
  optionIconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  optionEmoji: { fontSize: 24 },
  optionLabel: { fontSize: SIZES.sm, ...FONTS.semiBold, color: COLORS.text },

  recentHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  recentTitle: { fontSize: SIZES.md, ...FONTS.bold, color: COLORS.text },
  selectBtn: { fontSize: SIZES.sm, color: COLORS.primary, ...FONTS.semiBold },

  gridContainer: { paddingBottom: 100 },
  gridItem: { width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE, padding: 1 },
  gridImage: { width: "100%", height: "100%", borderRadius: 2 },
  videoBadge: { position: "absolute", bottom: 6, left: 6, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  videoBadgeText: { fontSize: 8, color: "#fff" },
  videoDuration: { fontSize: 10, color: "#fff", ...FONTS.semiBold },

  cameraItem: { width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE, alignItems: "center", justifyContent: "center", padding: 1 },
  cameraCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  cameraIcon: { fontSize: 28, color: "#fff" },
  cameraLabel: { fontSize: SIZES.xs, color: COLORS.text, ...FONTS.semiBold },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { color: COLORS.muted, fontSize: SIZES.sm, textAlign: "center", paddingHorizontal: 40 },
  grantBtn: { backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingHorizontal: 24, paddingVertical: 10 },
  grantBtnText: { color: "#fff", ...FONTS.semiBold, fontSize: SIZES.sm },

  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  title: { fontSize: SIZES.lg, ...FONTS.bold, color: COLORS.text },

  uploadOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center" },
  uploadBox: { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, padding: 30, alignItems: "center", gap: 16, width: 260 },
  uploadIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary + "20", alignItems: "center", justifyContent: "center" },
  uploadCheckmark: { fontSize: 32, color: COLORS.success, ...FONTS.bold },
  uploadPhase: { color: COLORS.text, fontSize: SIZES.md, ...FONTS.semiBold },
  progressTrack: { width: "100%", height: 6, borderRadius: 3, backgroundColor: COLORS.input, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: COLORS.primary },
  progressText: { color: COLORS.muted, fontSize: SIZES.sm },
});
