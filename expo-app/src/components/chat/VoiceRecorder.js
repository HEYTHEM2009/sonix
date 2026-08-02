import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Alert, Vibration,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import Icon from "../../design/ui/Icon";

const BAR_COUNT = 28;
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const WAVE_WIDTH = BAR_COUNT * (BAR_WIDTH + BAR_GAP);

function formatMs(ms) {
  if (!ms || ms === 0) return "0:00";
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  return `${min}:${(sec % 60).toString().padStart(2, "0")}`;
}

function deriveAmplitude(elapsed, paused) {
  if (paused) return 0.08;
  const base = 0.35 + 0.25 * Math.sin(elapsed / 1.7) + 0.15 * Math.sin(elapsed / 0.6);
  const noise = (Math.sin(elapsed * 12.9898) * 43758.5453) % 1;
  const jitter = Math.abs(noise) * 0.2;
  return Math.min(1, Math.max(0.08, base + jitter));
}

const VoiceRecorder = ({ onSend, onCancel, onRecordingStateChange }) => {
  const { t } = useLanguage();

  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [amplitudes, setAmplitudes] = useState(Array.from({ length: BAR_COUNT }, () => 0.08));

  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const elapsedRef = useRef(0);
  const pausedRef = useRef(false);
  const cancelledRef = useRef(false);
  const finishedRef = useRef(false);

  const releaseMic = useCallback(async () => {
    try {
      const audio = require("expo-audio");
      await audio.setAudioModeAsync({ allowsRecording: false });
    } catch (_) {}
  }, []);

  const start = useCallback(async () => {
    if (finishedRef.current) return;
    try {
      if (isExpoGo()) {
        Alert.alert(t("error"), t("voiceMessagesRequireDevBuild"));
        if (onCancel) onCancel();
        return;
      }
      const { AudioModule, setAudioModeAsync, RecordingPresets, requestRecordingPermissionsAsync } = require("expo-audio");
      const { status } = await requestRecordingPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("error"), t("failedToRecord"));
        if (onCancel) onCancel();
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      const recorder = new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY);
      await recorder.prepareToRecordAsync(RecordingPresets.HIGH_QUALITY);
      await recorder.record();
      recorderRef.current = recorder;
      setRecording(true);
      setPaused(false);
      pausedRef.current = false;
      if (onRecordingStateChange) onRecordingStateChange(recorder);
      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
        setAmplitudes((prev) => {
          const next = [...prev.slice(1), deriveAmplitude(elapsedRef.current, pausedRef.current)];
          return next;
        });
      }, 1000);
    } catch (e) {
      console.warn("VoiceRecorder start error", e);
      if (onCancel) onCancel();
    }
  }, [onCancel, onRecordingStateChange, t]);

  useEffect(() => {
    start();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const rec = recorderRef.current;
      recorderRef.current = null;
      (async () => {
        try { if (rec && typeof rec.stop === "function" && !finishedRef.current) await rec.stop(); } catch (_) {}
        await releaseMic();
      })();
    };
  }, [start, releaseMic]);

  const togglePause = useCallback(async () => {
    const rec = recorderRef.current;
    if (!rec) return;
    try {
      if (pausedRef.current) {
        if (typeof rec.resume === "function") await rec.resume();
        setPaused(false);
        pausedRef.current = false;
      } else {
        if (typeof rec.pause === "function") await rec.pause();
        setPaused(true);
        pausedRef.current = true;
      }
      if (onRecordingStateChange) onRecordingStateChange(rec);
    } catch (e) {
      console.warn("VoiceRecorder pause/resume not supported", e);
    }
  }, [onRecordingStateChange]);

  const stop = useCallback(async () => {
    const rec = recorderRef.current;
    if (!rec || finishedRef.current) return;
    finishedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    const duration = elapsedRef.current;
    let uri = null;
    try {
      const result = await rec.stop();
      const urlFromResult = result && typeof result === "object" && typeof result.url === "string" ? result.url : null;
      uri = urlFromResult || rec.uri || null;
    } catch (e) {
      console.warn("VoiceRecorder stop error", e);
    }
    recorderRef.current = null;
    await releaseMic();
    if (cancelledRef.current || duration <= 0 || !uri) return;
    if (onSend) onSend(uri, duration);
  }, [onSend, releaseMic]);

  const cancel = useCallback(async () => {
    const rec = recorderRef.current;
    if (finishedRef.current) return;
    cancelledRef.current = true;
    finishedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      if (rec && typeof rec.stop === "function") await rec.stop();
    } catch (_) {}
    recorderRef.current = null;
    await releaseMic();
    if (onCancel) onCancel();
  }, [onCancel, releaseMic]);

  return (
    <View style={styles.bar}>
      <TouchableOpacity onPress={cancel} style={styles.cancelBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon name="close" size="sm" color="#fff" />
      </TouchableOpacity>

      <View style={styles.center}>
        <AudioWaveForRecorder paused={paused} amplitudes={amplitudes} />
        <Text style={styles.timer}>{formatMs(elapsed * 1000)}</Text>
      </View>

      <View style={styles.rightControls}>
        <TouchableOpacity onPress={togglePause} style={styles.pauseBtn} disabled={!recording}>
          <Icon name={paused ? "play" : "pause"} size="sm" color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={stop} style={styles.sendBtn}>
          <Animated.View style={styles.sendInner}>
            <Icon name="arrow-up" size="md" color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const AudioWaveForRecorder = ({ paused, amplitudes }) => (
  <View style={styles.waveWrap}>
    {amplitudes.map((a, i) => (
      <View
        key={i}
        style={[
          styles.waveBar,
          {
            height: Math.max(a * 26, 2),
            opacity: paused ? 0.35 : 0.9,
          },
        ]}
      />
    ))}
  </View>
);

function isExpoGo() {
  try {
    const Constants = require("expo-constants");
    const env = (Constants?.default || Constants)?.executionEnvironment;
    return env === "storeClient";
  } catch (_) {
    return false;
  }
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7c3aed",
    borderRadius: 28,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },
  cancelBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  cancelIcon: { fontSize: 16, color: "#fff", fontWeight: "700" },
  center: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  waveWrap: { flexDirection: "row", alignItems: "center", height: 28 },
  waveBar: { width: BAR_WIDTH, marginHorizontal: BAR_GAP / 2, borderRadius: 2, backgroundColor: "#fff" },
  timer: { fontSize: 14, fontWeight: "600", color: "#fff", minWidth: 40, textAlign: "center" },
  rightControls: { flexDirection: "row", alignItems: "center", gap: 6 },
  pauseBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  pauseIcon: { fontSize: 15, color: "#fff", fontWeight: "700" },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.28)", alignItems: "center", justifyContent: "center" },
  sendInner: { alignItems: "center", justifyContent: "center" },
  sendIcon: { color: "#fff", fontSize: 18, fontWeight: "700" },
});

export default VoiceRecorder;
