import { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { VideoView, useVideoPlayer } from "expo-video";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import client from "../api/client";
import { COLORS, FONTS, SIZES, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS, LAYOUT } from "../design/DesignSystem";
import Icon from "../design/ui/Icon";
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
    <View style={{ flex: 1, backgroundColor: COLORS.black }}>
      <VideoView player={player} style={{ flex: 1 }} contentFit="cover" nativeControls />
      <View style={[{ position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.md, paddingTop: insets.top + 6, paddingBottom: SPACING.sm, backgroundColor: COLORS.overlay }]}>
        <TouchableOpacity onPress={onBack} style={{ width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
          <Icon name="close" size={16} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, ...FONTS.bold, color: COLORS.text }}>Preview</Text>
        <TouchableOpacity style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingHorizontal: SPACING.xl, height: 36, alignItems: "center", justifyContent: "center" }} onPress={onNext}>
          <Text style={{ color: COLORS.text, ...FONTS.bold, fontSize: 15 }}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CreateReelScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [mode, setMode] = useState("video");
  const [recording, setRecording] = useState(false);
  const [facing, setFacing] = useState("back");
  const [flash, setFlash] = useState("off");
  const [recordTime, setRecordTime] = useState(0);
  const [step, setStep] = useState("capture");
  const [videoUri, setVideoUri] = useState(null);
  const [caption, setCaption] = useState("");
  const [musicTitle, setMusicTitle] = useState("");
  const [status, setStatus] = useState("published");
  const [scheduledAt, setScheduledAt] = useState("");
  const [musicList, setMusicList] = useState([]);
  const [showMusic, setShowMusic] = useState(false);
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

    if (!micPermission?.granted) {
      const { granted } = await requestMicPermission();
      if (!granted) {
        Alert.alert(t("error"), t("micPermissionRequired") || "Microphone permission is required to record video.");
        return;
      }
    }

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
    if (status === "scheduled" && !scheduledAt) {
      Alert.alert(t("error"), t("scheduleRequired") || "Pick a schedule date/time.");
      return;
    }
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
      form.append("status", status);
      if (status === "scheduled") form.append("scheduled_at", new Date(scheduledAt).toISOString());
      await client.post("/reels", form, { headers: { "Content-Type": "multipart/form-data" } });
      navigation.navigate("Home", { screen: "Reels" });
    } catch (e) {
      Alert.alert(t("error"), e?.response?.data?.message || t("failedToCreatePost"));
    }
    setUploading(false);
  };

  const openMusic = async () => {
    try {
      const res = await client.get("/reels/music");
      setMusicList(res.data?.data || []);
      setShowMusic(true);
    } catch (e) {
      console.warn("music load error", e);
    }
  };

  const STATUS_OPTIONS = [
    { key: "published", label: t("publish") || "Publish" },
    { key: "draft", label: t("saveDraft") || "Save Draft" },
    { key: "scheduled", label: t("schedule") || "Schedule" },
  ];

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <Text style={{ color: COLORS.text, fontSize: 15, marginBottom: SPACING.lg, textAlign: "center" }}>{t("cameraPermissionRequired")}</Text>
        <TouchableOpacity style={s.grantBtn} onPress={requestPermission}><Text style={s.grantText}>{t("grantPermission")}</Text></TouchableOpacity>
      </View>
    );
  }

  const formatTime = (sec) => `${Math.floor(sec / 60).toString().padStart(2, "0")}:${(sec % 60).toString().padStart(2, "0")}`;

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
            <Icon name="close" size={16} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={s.title}>New Reel</Text>
          <TouchableOpacity style={[s.shareBtn]} onPress={submitReel} disabled={uploading}>
            <Text style={s.shareText}>{uploading ? t("sharing") : t("share")}</Text>
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
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
          <TouchableOpacity style={s.musicPicker} onPress={openMusic}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
              <Icon name="musical-note" size={16} color={COLORS.text} />
              <Text style={s.musicPickerText}>
                {musicTitle || (t("pickMusic") || "Pick from Music Library")}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={s.statusRow}>
            {STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[s.statusChip, status === opt.key && s.statusChipActive]}
                onPress={() => setStatus(opt.key)}
              >
                <Text style={[s.statusChipText, status === opt.key && s.statusChipTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {status === "scheduled" && (
            <TextInput
              style={s.inputMusic}
              placeholder="YYYY-MM-DD HH:MM"
              placeholderTextColor={COLORS.muted}
              value={scheduledAt}
              onChangeText={setScheduledAt}
            />
          )}

          {speed !== 1 && <Text style={s.metaInfo}>Speed: {speed}x</Text>}
          {filter > 0 && <Text style={s.metaInfo}>Filter: {FILTERS[filter].name}</Text>}
        </View>
        </KeyboardAvoidingView>

        {showMusic && (
          <View style={s.musicSheet}>
            <Text style={s.musicSheetTitle}>{t("musicLibrary") || "Music Library"}</Text>
            <ScrollView style={{ maxHeight: 240 }}>
              {musicList.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={s.musicItem}
                  onPress={() => { setMusicTitle(`${m.title} — ${m.artist || "Unknown"}`); setShowMusic(false); }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Icon name="musical-note" size={14} color={COLORS.text} />
                    <Text style={s.musicItemTitle}>{m.title}</Text>
                  </View>
                  <Text style={s.musicItemArtist}>{m.artist} · {m.genre}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={s.musicClose} onPress={() => setShowMusic(false)}>
              <Text style={s.musicCloseText}>{t("cancel") || "Cancel"}</Text>
            </TouchableOpacity>
          </View>
        )}
        {uploading && <ActivityIndicator style={{ marginTop: SPACING.xl }} color={COLORS.primary} size="large" />}
      </Screen3D>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.black }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
        flash={flash}
        mode={mode}
      />

      {filter > 0 && (
        <View style={[StyleSheet.absoluteFill, FILTERS[filter].style, { zIndex: 5 }]} pointerEvents="none" />
      )}

      {countdown !== null && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 20, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.overlay }]}>
          <Text style={s.countdownText}>{countdown}</Text>
        </View>
      )}

      <View style={[s.topControls, { top: insets.top + 12 }]}>
        <TouchableOpacity style={s.controlBtn} onPress={() => navigation.goBack()}>
          <Icon name="close" size={18} color={COLORS.text} />
        </TouchableOpacity>
        <View style={s.topRight}>
          <TouchableOpacity style={[s.controlBtn, flash !== "off" && s.controlBtnActive]} onPress={toggleFlash}>
            <Icon name={flash === "off" ? "flash-off" : "flash"} size={18} color={flash !== "off" ? COLORS.gold : COLORS.text} />
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
          {speed !== 1 && <Text style={s.speedBadge}>{speed}x</Text>}
        </View>
      )}

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

      <View style={[s.controls, { bottom: Math.max(insets.bottom + 20, 40) }]}>
        <TouchableOpacity style={s.sideBtn} onPress={pickVideo}>
          <Icon name="images" size={22} color={COLORS.text} />
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
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.black, padding: 40 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, ...GLASS.elevated },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 16, color: COLORS.text, ...FONTS.bold },
  title: { fontSize: SIZES.lg, ...FONTS.bold, color: COLORS.text },
  shareBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingHorizontal: SPACING.xl, height: 36, alignItems: "center", justifyContent: "center" },
  shareText: { color: COLORS.text, ...FONTS.bold, fontSize: SIZES.md },
  detailsWrap: { padding: SPACING.lg, gap: SPACING.md, ...GLASS.light, flex: 1 },
  input: { backgroundColor: COLORS.input, color: COLORS.text, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: 15, minHeight: 100, textAlignVertical: "top" },
  inputMusic: { backgroundColor: COLORS.input, color: COLORS.text, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: 14 },
  metaInfo: { color: COLORS.muted, fontSize: 12, fontStyle: "italic" },
  musicPicker: { backgroundColor: COLORS.input, borderRadius: RADIUS.md, padding: SPACING.md },
  musicPickerText: { color: COLORS.text, fontSize: 14 },
  statusRow: { flexDirection: "row", gap: SPACING.sm },
  statusChip: { flex: 1, backgroundColor: COLORS.input, borderRadius: RADIUS.sm, paddingVertical: SPACING.sm, alignItems: "center" },
  statusChipActive: { backgroundColor: COLORS.primary },
  statusChipText: { color: COLORS.muted, fontSize: 13, ...FONTS.semiBold },
  statusChipTextActive: { color: COLORS.text, ...FONTS.bold },
  musicSheet: { position: "absolute", left: SPACING.md, right: SPACING.md, bottom: SPACING.xl, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, zIndex: 50, maxHeight: 320, ...GLASS.elevated },
  musicSheetTitle: { color: COLORS.text, ...FONTS.black, fontSize: 16, marginBottom: SPACING.sm },
  musicItem: { paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  musicItemTitle: { color: COLORS.text, fontSize: 14, ...FONTS.semiBold },
  musicItemArtist: { color: COLORS.textSecondary, fontSize: 12, marginTop: SPACING.xxs },
  musicClose: { marginTop: SPACING.sm, alignItems: "center" },
  musicCloseText: { color: COLORS.primary, ...FONTS.bold },
  topControls: { position: "absolute", left: SPACING.lg, right: SPACING.lg, flexDirection: "row", justifyContent: "space-between", zIndex: 10 },
  controlBtn: { width: 40, height: 40, borderRadius: RADIUS.full, backgroundColor: COLORS.overlayLight, alignItems: "center", justifyContent: "center" },
  controlBtnActive: { backgroundColor: "rgba(255,200,0,0.6)" },
  controlIcon: { color: COLORS.text, fontSize: 18 },
  recordIndicator: { position: "absolute", alignSelf: "center", flexDirection: "row", alignItems: "center", gap: SPACING.sm, zIndex: 10, backgroundColor: "rgba(225,112,85,0.8)", paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.xl },
  recordDot: { width: 10, height: 10, borderRadius: RADIUS.xs, backgroundColor: COLORS.text },
  recordTime: { color: COLORS.text, ...FONTS.semiBold, fontSize: 14 },
  speedBadge: { color: COLORS.text, fontSize: 11, backgroundColor: COLORS.overlayLight, paddingHorizontal: SPACING.xs, paddingVertical: SPACING.xxs, borderRadius: SPACING.sm },
  controls: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 30 },
  sideBtn: { width: 50, height: 50, borderRadius: RADIUS.full, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  sideIcon: { color: COLORS.text, fontSize: 22 },
  recordBtn: { width: 76, height: 76, borderRadius: RADIUS.full, borderWidth: 4, borderColor: COLORS.danger, alignItems: "center", justifyContent: "center" },
  recordInner: { width: 62, height: 62, borderRadius: RADIUS.full, backgroundColor: COLORS.danger },
  recordingActive: { borderColor: COLORS.danger },
  recordingSquare: { width: 30, height: 30, borderRadius: RADIUS.xs, backgroundColor: COLORS.danger },
  grantBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingVertical: SPACING.sm, paddingHorizontal: 28 },
  grantText: { color: COLORS.text, ...FONTS.semiBold, fontSize: 14 },
  countdownText: { fontSize: 80, ...FONTS.black, color: COLORS.text, textShadowColor: COLORS.overlay, textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },

  topRight: { flexDirection: "row", gap: SPACING.sm },
});

const speedStyles = StyleSheet.create({
  speedBar: { position: "absolute", left: SPACING.sm, zIndex: 15, alignItems: "center", gap: SPACING.xs },
  speedBtn: { width: 38, height: 28, borderRadius: RADIUS.md, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  speedBtnActive: { backgroundColor: "rgba(255,255,255,0.9)" },
  speedLabel: { color: COLORS.text, fontSize: 11, ...FONTS.semiBold },
  speedLabelActive: { color: COLORS.black },

  timerBar: { position: "absolute", right: SPACING.sm, zIndex: 15, alignItems: "center", gap: SPACING.xs },
  timerBtn: { width: 38, height: 28, borderRadius: RADIUS.md, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  timerBtnActive: { backgroundColor: "rgba(255,255,255,0.9)" },
  timerLabel: { color: COLORS.text, fontSize: 11, ...FONTS.semiBold },
  timerLabelActive: { color: COLORS.black },

  filterStrip: { position: "absolute", left: 0, right: 0, zIndex: 15, paddingHorizontal: SPACING.md },
  filterBtn: { alignItems: "center", marginRight: SPACING.md, gap: SPACING.xs },
  filterPreview: { width: 44, height: 44, borderRadius: RADIUS.full, backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 2, borderColor: "transparent" },
  filterBtnActive: { borderColor: COLORS.text },
  filterLabel: { color: "rgba(255,255,255,0.6)", fontSize: 10 },
  filterLabelActive: { color: COLORS.text, ...FONTS.semiBold },
});
