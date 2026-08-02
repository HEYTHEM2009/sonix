import { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Dimensions, Animated as RNA } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  TapGestureHandler,
  State,
} from "react-native-gesture-handler";
import Icon from "../design/ui/Icon";
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

  const scale = useRef(new RNA.Value(1)).current;
  const scaleRef = useRef(1);
  const translateX = useRef(new RNA.Value(0)).current;
  const translateY = useRef(new RNA.Value(0)).current;
  const [downloading, setDownloading] = useState(false);

  const fullUrl = resolveUrl(imageUrl);

  const pinchRef = useRef(null);
  const doubleTapRef = useRef(null);

  const onPinch = (event) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      const next = Math.min(Math.max(scaleRef.current * event.nativeEvent.scale, 0.5), 4);
      scaleRef.current = next;
      scale.setValue(next);
    } else if (event.nativeEvent.state === State.END) {
      if (scaleRef.current <= 1) {
        scaleRef.current = 1;
        RNA.spring(scale, { toValue: 1, useNativeDriver: true }).start();
        RNA.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        RNA.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      }
    }
  };

  const onDoubleTap = () => {
    if (scaleRef.current > 1) {
      scaleRef.current = 1;
      RNA.spring(scale, { toValue: 1, useNativeDriver: true }).start();
      RNA.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      RNA.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    } else {
      scaleRef.current = 2.2;
      RNA.spring(scale, { toValue: 2.2, useNativeDriver: true }).start();
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
          <Icon name="close" size="md" color="#fff" />
        </TouchableOpacity>
        {username && <Text style={s.username}>{username}</Text>}
        <View style={s.topActions}>
          <TouchableOpacity onPress={downloadImage} style={s.zoomBtn} disabled={downloading}>
            {downloading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Icon name="download" size="sm" color="#fff" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              scaleRef.current = 1;
              RNA.spring(scale, { toValue: 1, useNativeDriver: true }).start();
              RNA.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: true }).start();
              RNA.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }).start();
            }}
            style={s.zoomBtn}
          >
            <Icon name="expand" size="sm" color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <PinchGestureHandler ref={pinchRef} onHandlerStateChange={onPinch} simultaneousHandlers={doubleTapRef}>
        <RNA.View style={s.imgWrap}>
          <TapGestureHandler
            ref={doubleTapRef}
            numberOfTaps={2}
            onActivated={onDoubleTap}
            simultaneousHandlers={pinchRef}
          >
            <RNA.View style={[s.imgWrap, { transform: [{ translateX }, { translateY }, { scale }] }]}>
              <RNA.Image source={{ uri: fullUrl }} style={s.img} resizeMode="contain" />
            </RNA.View>
          </TapGestureHandler>
        </RNA.View>
      </PinchGestureHandler>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.black, justifyContent: "center", alignItems: "center" },
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
  username: { fontSize: 15, fontWeight: "600", color: COLORS.white },
  topActions: { flexDirection: "row", gap: 6 },
  zoomBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.glassLight,
    borderWidth: 0.5,
    borderColor: COLORS.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },

  imgWrap: { width: SCREEN_W, height: SCREEN_H, alignItems: "center", justifyContent: "center" },
  img: { width: "100%", height: "100%" },
});
