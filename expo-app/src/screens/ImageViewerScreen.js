import { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  TapGestureHandler,
  State,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { downloadAsync, cacheDirectory } from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { resolveUrl } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export default function ImageViewerScreen({ route, navigation }) {
  const { t } = useLanguage();
  const imageUrl = route.params?.imageUrl ?? "";
  const username = route.params?.username ?? "";
  const insets = useSafeAreaInsets();

  const scale = useSharedValue(1);
  const savedScale = useRef(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [downloading, setDownloading] = useState(false);

  const fullUrl = resolveUrl(imageUrl);

  const pinchRef = useRef(null);
  const doubleTapRef = useRef(null);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const onPinch = (event) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      const next = Math.min(Math.max(savedScale.current * event.nativeEvent.scale, 0.5), 4);
      scale.value = next;
    } else if (event.nativeEvent.state === State.END) {
      savedScale.current = Math.min(Math.max(scale.value, 0.5), 4);
      if (savedScale.current <= 1) {
        scale.value = withSpring(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.current = 1;
      }
    }
  };

  const onDoubleTap = () => {
    if (savedScale.current > 1) {
      scale.value = withSpring(1);
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      savedScale.current = 1;
    } else {
      scale.value = withSpring(2.2);
      savedScale.current = 2.2;
    }
  };

  const downloadImage = async () => {
    try {
      setDownloading(true);
      const filename = imageUrl.split("/").pop() || `photo_${Date.now()}.jpg`;
      const fileUri = cacheDirectory + filename;
      const downloadResult = await downloadAsync(fullUrl, fileUri);
      if (downloadResult.status === 200) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(downloadResult.uri, { mimeType: "image/jpeg", dialogTitle: t("saveImage") });
        } else {
          Alert.alert(t("success"), t("imageSaved"));
        }
      } else {
        Alert.alert(t("error"), t("downloadFailed"));
      }
    } catch (e) {
      Alert.alert(t("error"), t("saveFailed"));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <GestureHandlerRootView style={s.wrap}>
      <View style={[s.topBar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.closeBtn}>
          <Text style={s.closeText}>✕</Text>
        </TouchableOpacity>
        {username && <Text style={s.username}>{username}</Text>}
        <View style={s.topActions}>
          <TouchableOpacity onPress={downloadImage} style={s.zoomBtn} disabled={downloading}>
            {downloading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={s.zoomBtnText}>⬇</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              savedScale.current = 1;
              scale.value = withSpring(1);
              translateX.value = withTiming(0);
              translateY.value = withTiming(0);
            }}
            style={s.zoomBtn}
          >
            <Text style={s.zoomBtnText}>⟲</Text>
          </TouchableOpacity>
        </View>
      </View>

      <PinchGestureHandler ref={pinchRef} onHandlerStateChange={onPinch} simultaneousHandlers={doubleTapRef}>
        <Animated.View style={s.imgWrap}>
          <TapGestureHandler
            ref={doubleTapRef}
            numberOfTaps={2}
            onActivated={onDoubleTap}
            simultaneousHandlers={pinchRef}
          >
            <Animated.View style={[s.imgWrap, animatedStyle]}>
              <Animated.Image source={{ uri: fullUrl }} style={s.img} resizeMode="contain" />
            </Animated.View>
          </TapGestureHandler>
        </Animated.View>
      </PinchGestureHandler>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  closeText: { fontSize: 22, color: "#fff", fontWeight: "600" },
  username: { fontSize: 15, fontWeight: "600", color: "#fff" },
  topActions: { flexDirection: "row", gap: 6 },
  zoomBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  zoomBtnText: { fontSize: 18, color: "#fff", fontWeight: "600" },
  imgWrap: { width: SCREEN_W, height: SCREEN_H, alignItems: "center", justifyContent: "center" },
  img: { width: "100%", height: "100%" },
});
