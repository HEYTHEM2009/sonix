import { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import client from "../api/client";
import Icon from "../design/ui/Icon";
import { COLORS, SIZES, FONTS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS, LAYOUT } from "../design/DesignSystem";

export default function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [capturing, setCapturing] = useState(false);
  const [mode, setMode] = useState("photo");
  const [recording, setRecording] = useState(false);
  const [facing, setFacing] = useState("back");
  const [flash, setFlash] = useState("off");
  const [recordTime, setRecordTime] = useState(0);
  const cameraRef = useRef(null);
  const recordTimer = useRef(null);
  const { user } = useAuth();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  useEffect(() => { if (!permission?.granted) requestPermission(); }, [permission]);

  useEffect(() => {
    if (recording) {
      recordTimer.current = setInterval(() => setRecordTime((t) => t + 1), 1000);
    } else {
      clearInterval(recordTimer.current);
      setRecordTime(0);
    }
    return () => clearInterval(recordTimer.current);
  }, [recording]);

  const takeAndUpload = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo?.uri) {
        Alert.alert(t("error"), t("failedToCapturePhoto") || "Failed to capture photo");
        setCapturing(false);
        return;
      }
      const form = new FormData();
      form.append("image", { uri: photo.uri, type: "image/jpeg", name: "story.jpg" });
      await client.post("/stories", form, { headers: { "Content-Type": "multipart/form-data" } });
      navigation.goBack();
    } catch (e) {
      Alert.alert(t("error"), t("failedToCreateStory"));
    }
    setCapturing(false);
  };

  const toggleRecord = async () => {
    if (!cameraRef.current) return;
    if (recording) {
      // stopRecording() resolves the pending recordAsync() promise with the video.
      try {
        cameraRef.current.stopRecording();
      } catch (e) {
        console.warn("Stop recording error", e);
      }
    } else {
      if (!micPermission?.granted) {
        const { granted } = await requestMicPermission();
        if (!granted) {
          Alert.alert(t("error"), t("micPermissionRequired") || "Microphone permission is required to record video.");
          return;
        }
      }
      setRecording(true);
      try {
        const video = await cameraRef.current.recordAsync({ maxDuration: 30 });
        if (video && video.uri) {
          const form = new FormData();
          form.append("video", { uri: video.uri, type: "video/mp4", name: "story.mp4" });
          await client.post("/stories", form, { headers: { "Content-Type": "multipart/form-data" } });
          navigation.goBack();
        } else {
          Alert.alert(t("error"), t("failedToRecordVideo") || "Failed to record video.");
        }
      } catch (e) {
        console.warn("Record error", e);
        Alert.alert(t("error"), t("failedToRecordVideo") || "Failed to record video.");
      } finally {
        setRecording(false);
      }
    }
  };

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <Text style={{ color: COLORS.text, fontSize: 15, marginBottom: SPACING.lg, textAlign: "center" }}>{t("cameraPermissionRequired")}</Text>
        <TouchableOpacity style={s.grantBtn} onPress={requestPermission}><Text style={s.grantText}>{t("grantPermission")}</Text></TouchableOpacity>
      </View>
    );
  }

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.black }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
        flash={flash}
        mode={mode === "video" ? "video" : "picture"}
      />

      <View style={[s.topControls, { top: insets.top + 12 }]}>
        <TouchableOpacity style={s.controlBtn} onPress={() => navigation.goBack()}>
          <Icon name="close" size={18} color={COLORS.text} />
        </TouchableOpacity>

        <View style={s.topRight}>
          <TouchableOpacity style={s.controlBtn} onPress={() => setFlash(flash === "off" ? "on" : "off")}>
            <Icon name={flash === "on" ? "flash" : "flash-off"} size={18} color={flash === "on" ? COLORS.gold : COLORS.text} />
            <Text style={[s.flashLabel, flash === "on" && { color: COLORS.gold }]}>{flash === "on" ? "ON" : "OFF"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.controlBtn} onPress={() => setFacing(facing === "back" ? "front" : "back")}>
            <Icon name="camera-reverse" size={18} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {recording && (
        <View style={[s.recordIndicator, { top: insets.top + 60 }]}>
          <View style={s.recordDot} />
          <Text style={s.recordTime}>{formatTime(recordTime)}</Text>
        </View>
      )}

      <View style={[s.controls, { bottom: Math.max(insets.bottom + 20, 40) }]}>
        <TouchableOpacity
          style={[s.modeSwitch, mode === "video" && s.modeActive]}
          onPress={() => setMode(mode === "photo" ? "video" : "photo")}
        >
          <Icon name={mode === "photo" ? "videocam" : "camera"} size={16} color={mode === "video" ? COLORS.primary : COLORS.text} />
          <Text style={[s.modeText, mode === "video" && { color: COLORS.primary }]}>
            {mode === "photo" ? "Video" : "Photo"}
          </Text>
        </TouchableOpacity>

        {mode === "photo" ? (
          <TouchableOpacity style={[s.captureBtn, capturing && s.capturing]} onPress={takeAndUpload} disabled={capturing}>
            {capturing ? <ActivityIndicator color={COLORS.text} size="large" /> : <View style={s.captureInner} />}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.recordBtn, recording && s.recordingActive]} onPress={toggleRecord}>
            {recording ? (
              <View style={s.recordingSquare} />
            ) : (
              <View style={s.recordInner} />
            )}
          </TouchableOpacity>
        )}

        <View style={{ width: 60 }} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.black, padding: SPACING.huge },
  topControls: { position: "absolute", left: SPACING.lg, right: SPACING.lg, flexDirection: "row", justifyContent: "space-between", zIndex: 10 },
  controlBtn: { width: 40, height: 40, borderRadius: RADIUS.xl, backgroundColor: COLORS.overlayLight, alignItems: "center", justifyContent: "center" },
  controlIcon: { color: COLORS.text, fontSize: 18 },
  flashLabel: { color: COLORS.text, fontSize: 9, ...FONTS.semiBold },
  topRight: { flexDirection: "row", gap: SPACING.sm },
  recordIndicator: { position: "absolute", alignSelf: "center", flexDirection: "row", alignItems: "center", gap: SPACING.sm, zIndex: 10, backgroundColor: COLORS.danger + "CC", paddingHorizontal: SPACING.md, paddingVertical: RADIUS.xs, borderRadius: RADIUS.xl },
  recordDot: { width: 10, height: 10, borderRadius: RADIUS.full, backgroundColor: COLORS.text },
  recordTime: { color: COLORS.text, ...FONTS.semiBold, fontSize: 14 },
  controls: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACING.xxxl },
  modeSwitch: { paddingHorizontal: SPACING.md, paddingVertical: RADIUS.xs, borderRadius: RADIUS.lg, backgroundColor: "rgba(255,255,255,0.15)" },
  modeActive: { backgroundColor: COLORS.primaryGlowLight },
  modeText: { color: COLORS.text, fontSize: 13, ...FONTS.semiBold },
  captureBtn: { width: 76, height: 76, borderRadius: RADIUS.full, borderWidth: 4, borderColor: COLORS.text, alignItems: "center", justifyContent: "center" },
  captureInner: { width: 62, height: 62, borderRadius: RADIUS.full, backgroundColor: COLORS.text },
  capturing: { opacity: 0.5 },
  recordBtn: { width: 76, height: 76, borderRadius: RADIUS.full, borderWidth: 4, borderColor: COLORS.danger, alignItems: "center", justifyContent: "center" },
  recordInner: { width: 62, height: 62, borderRadius: RADIUS.full, backgroundColor: COLORS.danger },
  recordingActive: { borderColor: COLORS.danger },
  recordingSquare: { width: 30, height: 30, borderRadius: RADIUS.xs, backgroundColor: COLORS.danger },
  grantBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.xxl },
  grantText: { color: COLORS.text, ...FONTS.semiBold, fontSize: 14 },
});
