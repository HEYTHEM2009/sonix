import { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions, ScrollView } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { VideoView, useVideoPlayer } from "expo-video";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import client from "../api/client";
import { COLORS, FONTS, SIZES } from "../components/Theme";
import Screen3D from "../components/3D/Screen3D";

const { width: SCREEN_W } = Dimensions.get("window");

const SPEEDS = [
  { label: "0.5x", value: 0.5 },
  { label: "1x", value: 1 },
  { label: "2x", value: 2 },
  { label: "3x", value: 3 },
];

const TIMERS = [
  { label: "Off", value: 0 },
  { label: "3s", value: 3 },
  { label: "5s", value: 5 },
  { label: "10s", value: 10 },
];

const FILTERS = [
  { name: "Normal", style: {} },
  { name: "Warm", style: { backgroundColor: "rgba(255,140,0,0.15)" } },
  { name: "Cool", style: { backgroundColor: "rgba(0,100,255,0.12)" } },
  { name: "B&W", style: { backgroundColor: "rgba(0,0,0,0.05)", opacity: 0.95 } },
  { name: "Vintage", style: { backgroundColor: "rgba(180,120,60,0.18)" } },
  { name: "Bright", style: { backgroundColor: "rgba(255,255,255,0.1)" } },
  { name: "Fade", style: { backgroundColor: "rgba(200,200,200,0.2)" } },
  { name: "Dramatic", style: { backgroundColor: "rgba(0,0,0,0.25)" } },
];

function PreviewScreen({ uri, onBack, onNext, insets }) {
  const player = useVideoPlayer(uri, (p) => { p.loop = true; p.play(); });
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <VideoView player={player} style={{ flex: 1 }} contentFit="cover" nativeControls />
      <View style={[{ position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingTop: insets.top + 6, paddingBottom: 8, backgroundColor: "rgba(0,0,0,0.6)" }]}>
        <TouchableOpacity onPress={onBack} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 16, color: "#fff", fontWeight: "700" }}>✕</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: "700", color: "#fff" }}>Preview</Text>
        <TouchableOpacity style={{ backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 20, height: 36, alignItems: "center", justifyContent: "center" }} onPress={onNext}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CreateReelScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState("video");
  const [recording, setRecording] = useState(false);
  const [facing, setFacing] = useState("back");
  const [flash, setFlash] = useState("off");
  const [recordTime, setRecordTime] = useState(0);
  const [step, setStep] = useState("capture");
  const [videoUri, setVideoUri] = useState(null);
  const [caption, setCaption] = useState("");
  const [musicTitle, setMusicTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [timer, setTimer] = useState(0);
  const [filter, setFilter] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [lastRecordTime, setLastRecordTime] = useState(0);
  const cameraRef = useRef(null);
  const recordTimer = useRef(null);
  const countdownTimer = useRef(null);
  const { user } = useAuth();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  useEffect(() => { if (!permission?.granted) requestPermission(); }, [permission]);

  useEffect(() => {
    if (recording) {
      recordTimer.current = setInterval(() => setRecordTime((tm) => tm + 1), 1000);
    } else {
      clearInterval(recordTimer.current);
      if (recordTime > 0) setLastRecordTime(recordTime);
      setRecordTime(0);
    }
    return () => clearInterval(recordTimer.current);
  }, [recording]);

  useEffect(() => {
    return () => { if (countdownTimer.current) clearInterval(countdownTimer.current); };
  }, []);

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
      setStep("preview");
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || recording) return;
    try {
      setRecording(true);
      setMode("video");
      await new Promise((r) => setTimeout(r, 300));
      const video = await cameraRef.current.recordAsync({ maxDuration: 60 });
      if (video && video.uri) {
        setVideoUri(video.uri);
        setStep("preview");
      } else {
        Alert.alert(t("error"), t("failedToRecordVideo") || "Failed to record video. Please try again.");
      }
    } catch (e) {
      console.warn("Reel record error", e);
      Alert.alert(t("error"), t("failedToRecordVideo") || "Failed to record video. Please try again.");
    }
    setRecording(false);
  };

  const stopRecording = () => {
    if (cameraRef.current && recording) {
      cameraRef.current.stopRecording();
    }
  };

  const toggleRecord = () => {
    if (recording) {
      stopRecording();
    } else if (timer > 0) {
      startCountdown();
    } else {
      startRecording();
    }
  };

  const startCountdown = () => {
    let count = timer;
    setCountdown(count);
    countdownTimer.current = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(countdownTimer.current);
        setCountdown(null);
        startRecording();
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  const toggleFlash = () => {
    setFlash((prev) => {
      if (prev === "off") return "on";
      if (prev === "on") return "auto";
      return "off";
    });
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
      form.append("duration", String(Math.max(lastRecordTime, 30)));
      if (speed !== 1) form.append("speed", String(speed));
      if (filter > 0) form.append("filter", FILTERS[filter].name);
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
  const flashIcon = flash === "off" ? "⚡" : flash === "on" ? "⚡🔥" : "⚡A";

  if (step === "preview" && videoUri) {
    return (
      <PreviewScreen uri={videoUri} onBack={() => { setStep("capture"); setVideoUri(null); }} onNext={() => setStep("details")} insets={insets} />
    );
  }

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
          {speed !== 1 && <Text style={s.metaInfo}>Speed: {speed}x</Text>}
          {filter > 0 && <Text style={s.metaInfo}>Filter: {FILTERS[filter].name}</Text>}
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
        mode={mode}
      />

      {/* Filter overlay */}
      {filter > 0 && (
        <View style={[StyleSheet.absoluteFill, FILTERS[filter].style, { zIndex: 5 }]} pointerEvents="none" />
      )}

      {/* Countdown overlay */}
      {countdown !== null && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <Text style={s.countdownText}>{countdown}</Text>
        </View>
      )}

      {/* Top controls */}
      <View style={[s.topControls, { top: insets.top + 12 }]}>
        <TouchableOpacity style={s.controlBtn} onPress={() => navigation.goBack()}>
          <Text style={s.controlIcon}>✕</Text>
        </TouchableOpacity>
        <View style={s.topRight}>
          <TouchableOpacity style={[s.controlBtn, flash !== "off" && s.controlBtnActive]} onPress={toggleFlash}>
            <Text style={s.controlIcon}>{flashIcon}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.controlBtn} onPress={() => setFacing(facing === "back" ? "front" : "back")}>
            <Text style={s.controlIcon}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recording indicator */}
      {recording && (
        <View style={[s.recordIndicator, { top: insets.top + 60 }]}>
          <View style={s.recordDot} />
          <Text style={s.recordTime}>{formatTime(recordTime)}</Text>
          {speed !== 1 && <Text style={s.speedBadge}>{speed}x</Text>}
        </View>
      )}

      {/* Speed controls - left side */}
      <View style={[speedStyles.speedBar, { top: SCREEN_W * 0.35 }]}>
        {SPEEDS.map((sp) => (
          <TouchableOpacity
            key={sp.value}
            style={[speedStyles.speedBtn, speed === sp.value && speedStyles.speedBtnActive]}
            onPress={() => setSpeed(sp.value)}
          >
            <Text style={[speedStyles.speedLabel, speed === sp.value && speedStyles.speedLabelActive]}>{sp.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Timer controls - right side top */}
      <View style={[speedStyles.timerBar, { top: SCREEN_W * 0.35 }]}>
        {TIMERS.map((tm) => (
          <TouchableOpacity
            key={tm.value}
            style={[speedStyles.timerBtn, timer === tm.value && speedStyles.timerBtnActive]}
            onPress={() => setTimer(tm.value)}
          >
            <Text style={[speedStyles.timerLabel, timer === tm.value && speedStyles.timerLabelActive]}>{tm.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filter strip - bottom */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[speedStyles.filterStrip, { bottom: Math.max(insets.bottom + 100, 120) }]}>
        {FILTERS.map((f, i) => (
          <TouchableOpacity
            key={f.name}
            style={[speedStyles.filterBtn, filter === i && speedStyles.filterBtnActive]}
            onPress={() => setFilter(i)}
          >
            <View style={[speedStyles.filterPreview, f.style]} />
            <Text style={[speedStyles.filterLabel, filter === i && speedStyles.filterLabelActive]}>{f.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom controls */}
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

        <View style={{ width: 50 }} />
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
  metaInfo: { color: COLORS.muted, fontSize: 12, fontStyle: "italic" },
  topControls: { position: "absolute", left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", zIndex: 10 },
  controlBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  controlBtnActive: { backgroundColor: "rgba(255,200,0,0.6)" },
  controlIcon: { color: "#fff", fontSize: 18 },
  recordIndicator: { position: "absolute", alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 8, zIndex: 10, backgroundColor: "rgba(225,112,85,0.8)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  recordDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#fff" },
  recordTime: { color: "#fff", ...FONTS.semiBold, fontSize: 14 },
  speedBadge: { color: "#fff", fontSize: 11, backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  controls: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 30 },
  sideBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  sideIcon: { color: "#fff", fontSize: 22 },
  recordBtn: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: COLORS.danger, alignItems: "center", justifyContent: "center" },
  recordInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: COLORS.danger },
  recordingActive: { borderColor: COLORS.danger },
  recordingSquare: { width: 30, height: 30, borderRadius: 6, backgroundColor: COLORS.danger },
  grantBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 28 },
  grantText: { color: "#fff", ...FONTS.semiBold, fontSize: 14 },
  countdownText: { fontSize: 80, fontWeight: "800", color: "#fff", textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },

  topRight: { flexDirection: "row", gap: 8 },
});

const speedStyles = StyleSheet.create({
  /* Speed bar - left side */
  speedBar: { position: "absolute", left: 10, zIndex: 15, alignItems: "center", gap: 6 },
  speedBtn: { width: 38, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  speedBtnActive: { backgroundColor: "rgba(255,255,255,0.9)" },
  speedLabel: { color: "#fff", fontSize: 11, fontWeight: "600" },
  speedLabelActive: { color: "#000" },

  /* Timer bar - right side */
  timerBar: { position: "absolute", right: 10, zIndex: 15, alignItems: "center", gap: 6 },
  timerBtn: { width: 38, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  timerBtnActive: { backgroundColor: "rgba(255,255,255,0.9)" },
  timerLabel: { color: "#fff", fontSize: 11, fontWeight: "600" },
  timerLabelActive: { color: "#000" },

  /* Filter strip */
  filterStrip: { position: "absolute", left: 0, right: 0, zIndex: 15, paddingHorizontal: 12 },
  filterBtn: { alignItems: "center", marginRight: 12, gap: 4 },
  filterPreview: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 2, borderColor: "transparent" },
  filterBtnActive: { borderColor: "#fff" },
  filterLabel: { color: "rgba(255,255,255,0.6)", fontSize: 10 },
  filterLabelActive: { color: "#fff", fontWeight: "600" },
});
