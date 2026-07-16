import { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import client from "../api/client";
import { COLORS, FONTS, SIZES } from "../components/Theme";
import Screen3D from "../components/3D/Screen3D";

const { width: SCREEN_W } = Dimensions.get("window");

export default function CreateReelScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [mode, setMode] = useState("photo");
  const [recording, setRecording] = useState(false);
  const [facing, setFacing] = useState("back");
  const [flash, setFlash] = useState("off");
  const [recordTime, setRecordTime] = useState(0);
  const [step, setStep] = useState("capture");
  const [videoUri, setVideoUri] = useState(null);
  const [caption, setCaption] = useState("");
  const [musicTitle, setMusicTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const cameraRef = useRef(null);
  const recordTimer = useRef(null);
  const { user } = useAuth();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  useEffect(() => { if (!permission?.granted) requestPermission(); }, [permission]);

  useEffect(() => {
    if (recording) {
      recordTimer.current = setInterval(() => setRecordTime((tm) => tm + 1), 1000);
    } else {
      clearInterval(recordTimer.current);
      setRecordTime(0);
    }
    return () => clearInterval(recordTimer.current);
  }, [recording]);

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert(t("permissionNeeded")); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      if (result.assets[0].duration && result.assets[0].duration > 180000) {
        Alert.alert(t("tooLong"), t("videoTooLong"));
        return;
      }
      setVideoUri(result.assets[0].uri);
      setStep("details");
    }
  };

  const toggleRecord = async () => {
    if (!cameraRef.current) return;
    if (recording) {
      setRecording(false);
      try {
        const video = await cameraRef.current.stopRecording();
        setVideoUri(video.uri);
        setStep("details");
      } catch (e) {
        Alert.alert(t("error"), t("failedToUploadVideoStory"));
      }
    } else {
      setRecording(true);
      cameraRef.current.recordAsync({ maxDuration: 60 }).catch(() => setRecording(false));
    }
  };

  const submitReel = async () => {
    if (!videoUri || uploading) return;
    setUploading(true);
    try {
      const form = new FormData();
      const ext = videoUri.split(".").pop() || "mp4";
      const mimeMap = { mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm" };
      const filename = `reel_${Date.now()}.${ext}`;
      form.append("video", { uri: videoUri, name: filename, type: mimeMap[ext] || "video/mp4" });
      if (caption.trim()) form.append("caption", caption.trim());
      if (musicTitle.trim()) form.append("music_title", musicTitle.trim());
      form.append("duration", "30");
      await client.post("/reels", form, { headers: { "Content-Type": "multipart/form-data" } });
      navigation.navigate("Home", { screen: "Reels" });
    } catch (e) {
      Alert.alert(t("error"), e?.response?.data?.message || t("failedToCreatePost"));
    }
    setUploading(false);
  };

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <Text style={{ color: "#fff", fontSize: 15, marginBottom: 16, textAlign: "center" }}>{t("cameraPermissionRequired")}</Text>
        <TouchableOpacity style={s.grantBtn} onPress={requestPermission}><Text style={s.grantText}>{t("grantPermission")}</Text></TouchableOpacity>
      </View>
    );
  }

  const formatTime = (sec) => `${Math.floor(sec / 60).toString().padStart(2, "0")}:${(sec % 60).toString().padStart(2, "0")}`;

  if (step === "details") {
    return (
      <Screen3D style={s.container}>
        <View style={[s.topBar, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity onPress={() => { setStep("capture"); setVideoUri(null); }} style={s.backBtn}>
            <Text style={s.backText}>✕</Text>
          </TouchableOpacity>
          <Text style={s.title}>New Reel</Text>
          <TouchableOpacity style={[s.shareBtn]} onPress={submitReel} disabled={uploading}>
            <Text style={s.shareText}>{uploading ? t("sharing") : t("share")}</Text>
          </TouchableOpacity>
        </View>
        <View style={s.detailsWrap}>
          <TextInput
            style={s.input}
            placeholder={t("writeCaption")}
            placeholderTextColor={COLORS.muted}
            value={caption}
            onChangeText={setCaption}
            multiline
            textAlignVertical="top"
          />
          <TextInput
            style={s.inputMusic}
            placeholder={"🎵 " + (t("musicTitle") || "Music / Artist")}
            placeholderTextColor={COLORS.muted}
            value={musicTitle}
            onChangeText={setMusicTitle}
          />
        </View>
        {uploading && <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.primary} size="large" />}
      </Screen3D>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
        flash={flash}
        mode="video"
      />

      <View style={[s.topControls, { top: insets.top + 12 }]}>
        <TouchableOpacity style={s.controlBtn} onPress={() => navigation.goBack()}>
          <Text style={s.controlIcon}>✕</Text>
        </TouchableOpacity>
        <View style={s.topRight}>
          <TouchableOpacity style={s.controlBtn} onPress={() => setFlash(flash === "off" ? "on" : "off")}>
            <Text style={s.controlIcon}>⚡</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.controlBtn} onPress={() => setFacing(facing === "back" ? "front" : "back")}>
            <Text style={s.controlIcon}>🔄</Text>
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
        <TouchableOpacity style={s.sideBtn} onPress={pickVideo}>
          <Text style={s.sideIcon}>🖼️</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.recordBtn, recording && s.recordingActive]} onPress={toggleRecord}>
          {recording ? (
            <View style={s.recordingSquare} />
          ) : (
            <View style={s.recordInner} />
          )}
        </TouchableOpacity>

        <View style={{ width: 60 }} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000", padding: 40 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 16, color: COLORS.text, fontWeight: "700" },
  title: { fontSize: SIZES.lg, fontWeight: "700", color: COLORS.text },
  shareBtn: { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 20, height: 36, alignItems: "center", justifyContent: "center" },
  shareText: { color: COLORS.text, fontWeight: "700", fontSize: SIZES.md },
  detailsWrap: { padding: 16, gap: 12 },
  input: { backgroundColor: COLORS.input, color: COLORS.text, borderRadius: 12, padding: 12, fontSize: 15, minHeight: 100, textAlignVertical: "top" },
  inputMusic: { backgroundColor: COLORS.input, color: COLORS.text, borderRadius: 12, padding: 12, fontSize: 14 },
  topControls: { position: "absolute", left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", zIndex: 10 },
  controlBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  controlIcon: { color: "#fff", fontSize: 18 },
  recordIndicator: { position: "absolute", alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 8, zIndex: 10, backgroundColor: "rgba(225,112,85,0.8)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  recordDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#fff" },
  recordTime: { color: "#fff", ...FONTS.semiBold, fontSize: 14 },
  controls: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 30 },
  sideBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  sideIcon: { color: "#fff", fontSize: 22 },
  recordBtn: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: COLORS.danger, alignItems: "center", justifyContent: "center" },
  recordInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: COLORS.danger },
  recordingActive: { borderColor: COLORS.danger },
  recordingSquare: { width: 30, height: 30, borderRadius: 6, backgroundColor: COLORS.danger },
  grantBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 28 },
  grantText: { color: "#fff", ...FONTS.semiBold, fontSize: 14 },
});
