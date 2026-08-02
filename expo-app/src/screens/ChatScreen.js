import { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo, memo } from "react";
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Image, Alert, ActivityIndicator,
  Dimensions, Animated, Keyboard, Modal, ScrollView, I18nManager, Share, Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { isExpoGo } from "../utils/audioHelper";
import client, { resolveUrl, uploadWithProgress } from "../api/client";
import { getEcho } from "../api/websocket";
import realtime from "../api/realtime";
import { cacheMessages, getCachedMessages, addToOfflineQueue, getOfflineQueue, removeFromOfflineQueue } from "../api/cache";
import Icon from "../design/ui/Icon";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { COLORS, SIZES, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS, STATUS_COLORS } from "../design/DesignSystem";
import Screen3D from "../components/3D/Screen3D";
import AudioWaveform from "../components/AudioWaveform";
import VideoBubble from "../components/chat/VideoBubble";
import VoiceRecorder from "../components/chat/VoiceRecorder";
import MediaProgress from "../components/chat/MediaProgress";
import { LinearGradient } from "expo-linear-gradient";
import { pickDocument, isDocument, formatBytes } from "../utils/media";

/* ─── Attachment sheet data ──────────────────────────── */
const ATTACH_OPTIONS = [
  { key: "camera", icon: "camera", labelKey: "camera", color: "#7C6FFF" },
  { key: "gallery", icon: "images", labelKey: "gallery", color: "#34D399" },
  { key: "video", icon: "film", labelKey: "video", color: "#F59E0B" },
  { key: "document", icon: "document-text", labelKey: "document", color: "#60A5FA" },
  { key: "audio", icon: "mic", labelKey: "audio", color: "#F472B6" },
  { key: "location", icon: "location", labelKey: "location", color: "#A78BFA" },
];
import { validateMessage, floodGuard } from "../utils/validation";
import { cacheDraft, getDraft } from "../api/cache";
import ConnectionBanner from "../components/chat/ConnectionBanner";
import MessageSearchBar from "../components/chat/MessageSearchBar";
import DraftIndicator from "../components/chat/DraftIndicator";
import BulkActionBar from "../components/chat/BulkActionBar";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const EMOJI_LIST = ["❤️", "😂", "😮", "😢", "😡", "👍"];
const VANISH_OPTIONS = [
  { label: "5s", seconds: 5 },
  { label: "10s", seconds: 10 },
  { label: "30s", seconds: 30 },
  { label: "1m", seconds: 60 },
  { label: "5m", seconds: 300 },
  { label: "1h", seconds: 3600 },
];

const MESSAGE_OPTIONS = [
  { key: "reply", icon: "return-down-back", labelKey: "reply" },
  { key: "forward", icon: "return-down-forward", labelKey: "forward" },
  { key: "copy", icon: "clipboard", labelKey: "copyMessage" },
  { key: "download", icon: "download", labelKey: "download", mediaOnly: true },
  { key: "sticker", icon: "color-palette", labelKey: "addSticker" },
  { key: "info", icon: "information-circle", labelKey: "messageInfo" },
  { key: "delete", icon: "trash", labelKey: "deleteForYou", danger: true },
  { key: "unsend", icon: "ban", labelKey: "unsend", danger: true },
];

const MESSAGE_OPTIONS_MINE = [
  { key: "reply", icon: "return-down-back", labelKey: "reply" },
  { key: "forward", icon: "return-down-forward", labelKey: "forward" },
  { key: "copy", icon: "clipboard", labelKey: "copyMessage" },
  { key: "download", icon: "download", labelKey: "download", mediaOnly: true },
  { key: "edit", icon: "create", labelKey: "edit", textOnly: true },
  { key: "sticker", icon: "color-palette", labelKey: "addSticker" },
  { key: "info", icon: "information-circle", labelKey: "messageInfo" },
  { key: "pin", icon: "pin", labelKey: "pin" },
  { key: "delete", icon: "trash", labelKey: "deleteForYou", danger: true },
  { key: "unsend", icon: "ban", labelKey: "unsend", danger: true },
];

const STICKER_PACKS = [
  { id: "popular", name: "Popular", stickers: ["😂", "❤️", "🔥", "👍", "😭", "😍", "🥰", "😘", "😎", "🙏", "💀", "✨", "🎉", "💯", "🫡", "🤡", "😈", "🥳", "😍", "🤩"] },
  { id: "reactions", name: "Reactions", stickers: ["😍", "🤩", "🥰", "😘", "😭", "😤", "🥺", "😱", "🤔", "🫣", "🤣", "😇", "🥳", "😴", "🤗", "🫡", "😏", "🙄", "😬", "🤥"] },
  { id: "greetings", name: "Hi", stickers: ["👋", "🤙", "✌️", "🫶", "👐", "🤝", "💪", "🫡", "🙋", "🙇", "👀", "💅", "🫰", "🤌", "👆", "👉", "✊", "🙏", "💪", "🤲"] },
  { id: "love", name: "Love", stickers: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "♥️", "🫶", "😍"] },
  { id: "animals", name: "Animals", stickers: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆"] },
  { id: "food", name: "Food", stickers: ["🍕", "🍔", "🍟", "🌭", "🍿", "🧂", "🥓", "🥚", "🍳", "🥞", "🧇", "🥩", "🍗", "🍖", "🌮", "🌯", "🫔", "🥙", "🧆", "🥗"] },
];

/* ─── Unread Separator ────────────────────────────────── */
const UnreadSeparator = memo(function UnreadSeparator() {
  const { t } = useLanguage();
  const slideAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(slideAnim, { toValue: 1, tension: 100, friction: 10, useNativeDriver: true }).start(); }, []);
  return (
    <Animated.View style={[s.unreadSep, { opacity: slideAnim, transform: [{ scale: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }]}>
      <LinearGradient colors={["transparent", COLORS.primary + "30", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.unreadSepLine} />
      <View style={s.unreadBadge}>
        <Text style={s.unreadBadgeText}>{t("newMessages")}</Text>
      </View>
      <LinearGradient colors={["transparent", COLORS.primary + "30", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.unreadSepLine} />
    </Animated.View>
  );
});

/* ─── Sticky Date Separator ──────────────────────────── */
const DateSeparator = memo(function DateSeparator({ date }) {
  const { t } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start(); }, []);
  const d = new Date(date);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  let label;
  if (d.toDateString() === now.toDateString()) label = t("today");
  else if (d.toDateString() === yesterday.toDateString()) label = t("yesterday");
  else label = d.toLocaleDateString(I18nManager.isRTL ? "ar" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  return (
    <Animated.View style={[s.dateSep, { opacity: fadeAnim }]}>
      <LinearGradient colors={["rgba(124, 111, 255, 0.15)", "rgba(124, 111, 255, 0.05)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.dateSepLine} />
      <View style={s.dateSepChip}>
        <Text style={s.dateSepText}>{label}</Text>
      </View>
      <LinearGradient colors={["rgba(124, 111, 255, 0.05)", "rgba(124, 111, 255, 0.15)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.dateSepLine} />
    </Animated.View>
  );
});

/* ─── Ambient Chat Gradient ──────────────────────────── */
const AmbientGradient = memo(function AmbientGradient() {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim1, { toValue: 1, duration: 8000, useNativeDriver: false }),
      Animated.timing(anim1, { toValue: 0, duration: 8000, useNativeDriver: false }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(anim2, { toValue: 1, duration: 12000, useNativeDriver: false }),
      Animated.timing(anim2, { toValue: 0, duration: 12000, useNativeDriver: false }),
    ])).start();
  }, []);
  const interpolateColor = (animVal) => ({
    opacity: animVal.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.015, 0.035, 0.015] }),
  });
  return (
    <View style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <Animated.View style={[s.ambientGlow1, interpolateColor(anim1)]} />
      <Animated.View style={[s.ambientGlow2, interpolateColor(anim2)]} />
      <Animated.View style={[s.ambientGlow3, { opacity: anim1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.01, 0.025, 0.01] }) }]} />
    </View>
  );
});

/* ─── Message Appear Animation ────────────────────────── */
const MessageAppear = memo(function MessageAppear({ children, index }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(Math.min(index * 15, 200)),
      Animated.parallel([
        Animated.timing(anim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(anim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }, { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }}>
      {children}
    </Animated.View>
  );
});

/* ─── Scroll to Bottom FAB ──────────────────────────── */
const ScrollToBottomFAB = memo(function ScrollToBottomFAB({ onPress, insets }) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(bounceAnim, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={{ position: "absolute", right: 16, bottom: Math.max(insets.bottom + 60, 70), zIndex: 30, opacity: bounceAnim, transform: [{ scale: bounceAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={s.scrollFAB}>
        <Icon name="arrow-down" size={20} color={COLORS.white} />
      </TouchableOpacity>
    </Animated.View>
  );
});

/* ─── Animated Header Menu ──────────────────────────── */
const AnimatedMenu = memo(function AnimatedMenu({ onClose, userId, setShowVanishPicker, setShowMenu }) {
  const { t } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 1, tension: 150, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[s.dropdownMenu, { opacity: fadeAnim, transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] }]}>
      <TouchableOpacity style={s.menuItem} onPress={() => { setShowMenu(false); setShowVanishPicker(true); }}>
        <Icon name="flame" size={18} color={COLORS.text} />
        <Text style={s.menuText}>{t("vanishMode")}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.menuItem} onPress={() => { setShowMenu(false); client.post(`/messages/mute/${userId}`).then(() => Alert.alert(t("success"))); }}>
        <Icon name="notifications-off" size={18} color={COLORS.text} />
        <Text style={s.menuText}>{t("mute")}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.menuItem} onPress={() => { setShowMenu(false); client.post(`/messages/pin/${userId}`).then(() => Alert.alert(t("success"))); }}>
        <Icon name="pin" size={18} color={COLORS.text} />
        <Text style={s.menuText}>{t("pin")}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

/* ─── Animated Status Indicator ──────────────────────── */
const StatusIndicator = memo(function StatusIndicator({ item }) {
  const anim = useRef(new Animated.Value(0)).current;
  const status = item.is_read ? "read" : item.delivered ? "delivered" : "sent";
  const color = STATUS_COLORS[status];
  useEffect(() => { Animated.spring(anim, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }).start(); }, []);
  return (
    <Animated.View style={{ opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }], marginLeft: 4 }}>
      <Icon name={item.is_read ? "checkmark-done" : "checkmark"} size="xs" color={item.is_read ? COLORS.success : "rgba(255,255,255,0.5)"} />
    </Animated.View>
  );
});

/* ─── Typing Indicator ──────────────────────────────── */
const TypingIndicator = memo(function TypingIndicator({ username }) {
  const { t } = useLanguage();
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const anim = () => Animated.sequence([
      Animated.parallel([Animated.timing(dot1, { toValue: 1, duration: 400, useNativeDriver: true }), Animated.timing(dot2, { toValue: 0.3, duration: 400, useNativeDriver: true }), Animated.timing(dot3, { toValue: 0.3, duration: 400, useNativeDriver: true })]),
      Animated.parallel([Animated.timing(dot1, { toValue: 0.3, duration: 400, useNativeDriver: true }), Animated.timing(dot2, { toValue: 1, duration: 400, useNativeDriver: true }), Animated.timing(dot3, { toValue: 0.3, duration: 400, useNativeDriver: true })]),
      Animated.parallel([Animated.timing(dot1, { toValue: 0.3, duration: 400, useNativeDriver: true }), Animated.timing(dot2, { toValue: 0.3, duration: 400, useNativeDriver: true }), Animated.timing(dot3, { toValue: 1, duration: 400, useNativeDriver: true })]),
    ]);
    const loop = Animated.loop(anim());
    loop.start();
    return () => loop.stop();
  }, [dot1, dot2, dot3]);
  return (
    <View style={s.typingWrap}>
      <View style={s.typingBubble}>
        <Text style={s.typingLabel} numberOfLines={1}>{username}</Text>
        <View style={s.typingDots}>
          <Animated.View style={[s.dot, { opacity: dot1 }]} />
          <Animated.View style={[s.dot, { opacity: dot2 }]} />
          <Animated.View style={[s.dot, { opacity: dot3 }]} />
        </View>
      </View>
    </View>
  );
});

/* ─── Message Bubble ─────────────────────────────────── */
const MessageBubble = memo(({
  item, isMine, onLongPress, onDoubleTap, onImagePress, onVideoPress, onVideoLongPress, currentUserId, selected,
}) => {
  const { t } = useLanguage();
  const [showReactions, setShowReactions] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(() => (item.duration ? Math.floor(item.duration * 1000) : 0));
  const soundRef = useRef(null);
  const lastTap = useRef(0);
  const doubleTapTimer = useRef(null);

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      clearTimeout(doubleTapTimer.current);
      if (onDoubleTap) onDoubleTap(item);
    } else {
      doubleTapTimer.current = setTimeout(() => setShowReactions((p) => !p), 300);
    }
    lastTap.current = now;
  };

  const handleLongPress = () => {
    if (item.pending) return;
    if (onLongPress) onLongPress(item);
  };

  const handleReaction = async (emoji) => {
    setShowReactions(false);
    try { await client.post(`/messages/${item.id}/react`, { emoji }); } catch (_) {}
  };

  const toggleVoice = async () => {
    try {
      if (playing && soundRef.current) {
        soundRef.current.pause();
        setPlaying(false);
        return;
      }
      if (isExpoGo()) { Alert.alert(t("error"), t("voicePlaybackRequiresDevBuild")); return; }
      const { createAudioPlayer } = require("expo-audio");
      const rawVoice = item.voice;
      const uri = resolveUrl(rawVoice);
      console.log("[VOICE_PLAY] item.id:", item.id, "item.duration:", item.duration, "rawVoice:", rawVoice, "resolvedUri:", uri);
      try {
        const headRes = await fetch(uri, { method: "HEAD" });
        console.log("[VOICE_PLAY] HEAD status:", headRes.status, "content-type:", headRes.headers.get("content-type"), "content-length:", headRes.headers.get("content-length"));
        if (headRes.status !== 200) {
          Alert.alert("Voice Debug", `URL: ${uri}\nHEAD status: ${headRes.status}\nDuration: ${item.duration}s`);
        }
      } catch (headErr) {
        console.log("[VOICE_PLAY] HEAD failed:", headErr?.message);
        Alert.alert("Voice Debug", `URL: ${uri}\nHEAD error: ${headErr?.message}\nDuration: ${item.duration}s`);
      }
      const player = createAudioPlayer(uri);
      if (soundRef.current) { try { soundRef.current.release(); } catch (_) {} }
      soundRef.current = player;
      player.addListener("playbackStatusUpdate", (status) => {
        console.log("[VOICE_STATUS] isLoaded:", status.isLoaded, "currentTime:", status.currentTime, "duration:", status.duration, "didJustFinish:", status.didJustFinish, "error:", status.error);
        if (!status.isLoaded && status.error) {
          console.log("[VOICE_STATUS] LOAD ERROR:", JSON.stringify(status.error));
          Alert.alert("Voice Error", `Failed to load audio.\nURL: ${uri}\nError: ${JSON.stringify(status.error)}`);
        }
        if (status.didJustFinish) { setPlaying(false); setPosition(0); }
        else { setPosition(Math.floor((status.currentTime || 0) * 1000)); setDuration(Math.floor((status.duration || 0) * 1000)); }
      });
      player.play();
      setPlaying(true);
      setTimeout(() => {
        if (soundRef.current && !soundRef.current._loaded) {
          console.log("[VOICE_STATUS] TIMEOUT: player did not load after 5s");
        }
      }, 5000);
    } catch (e) { console.warn("[VOICE_PLAY_ERROR]", e); }
  };

  useEffect(() => {
    return () => { if (soundRef.current) { try { soundRef.current.pause(); soundRef.current.release(); } catch (_) {} } };
  }, []);

  const replyName = item.reply_message?.sender?.username;
  const replyContent = item.reply_message?.content;
  const isImage = item.type === "image" && item.image;
  const isVoice = item.type === "voice" && item.voice;
  const isVideo = item.type === "video" && item.video;
  const isDocument = item.type === "document" && (item.document || item.file_url);
  const isSticker = item.type === "sticker";

  return (
    <View style={[s.bubbleWrap, isMine ? s.bubbleWrapMine : s.bubbleWrapTheirs, item.pending && s.bubblePending, selected && s.bubbleSelected]}>
      {item.reply_message && (
        <View style={[s.replyPreview, isMine ? s.replyPreviewMine : s.replyPreviewTheirs]}>
          <Text style={s.replyName}>{replyName || t("message")}</Text>
          <Text style={s.replyText} numberOfLines={1}>{replyContent || "..."}</Text>
        </View>
      )}

      {isSticker ? (
        <TouchableOpacity onLongPress={handleLongPress} onPress={handleTap} activeOpacity={0.8}>
          <Text style={s.stickerText}>{item.content}</Text>
        </TouchableOpacity>
      ) : isImage ? (
        <TouchableOpacity
          onLongPress={handleLongPress}
          onPress={() => { if (onImagePress) onImagePress(item); }}
          activeOpacity={0.8}
        >
          <Image source={{ uri: resolveUrl(item.image) }} style={s.messageImage} resizeMode="cover" />
        </TouchableOpacity>
      ) : isVoice ? (
        isMine ? (
          <TouchableOpacity onLongPress={handleLongPress} activeOpacity={0.9}>
            <View>
              <LinearGradient
                colors={COLORS.gradientBubbleMine}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1.2 }}
                style={[s.bubble, s.mine, s.voiceBubble, SHADOWS.glow]}
              >
                <TouchableOpacity onPress={toggleVoice} style={[s.playBtn, s.playBtnMine]}>
                  <Icon name={playing ? "pause" : "play"} size={13} color={COLORS.white} />
                </TouchableOpacity>
                <AudioWaveform playing={playing} width={110} height={24} color={COLORS.white} />
                <Text style={[s.voiceDuration, { color: "#ffffffaa" }]}>{formatMs(playing ? position : duration)}</Text>
              </LinearGradient>
              <LinearGradient colors={COLORS.gradientBubbleReflect} start={{ x: 0, y: 0 }} end={{ x: 0.3, y: 1 }} style={s.mineReflect} pointerEvents="none" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onLongPress={handleLongPress} onPress={toggleVoice} activeOpacity={0.8} style={[s.bubble, s.theirs, s.voiceBubble]}>
            <TouchableOpacity onPress={toggleVoice} style={s.playBtn}>
              <Icon name={playing ? "pause" : "play"} size={13} color={COLORS.white} />
            </TouchableOpacity>
            <AudioWaveform playing={playing} width={110} height={24} color={COLORS.primary} />
            <Text style={s.voiceDuration}>{formatMs(playing ? position : duration)}</Text>
          </TouchableOpacity>
        )
      ) : isVideo ? (
        <View style={[s.bubble, isMine ? s.mine : s.theirs, { padding: 0, overflow: "hidden" }]}>
          <VideoBubble
            uri={resolveUrl(item.video)}
            isMine={isMine}
            onVideoPress={() => onVideoPress?.(item)}
            onLongPress={() => onVideoLongPress?.(item)}
          />
        </View>
       ) : isDocument ? (
        isMine ? (
          <View>
            <LinearGradient
              colors={COLORS.gradientBubbleMine}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1.2 }}
              style={[s.bubble, s.mine, s.docBubble, SHADOWS.glow]}
            >
              <View style={s.docRow}>
                <View style={s.docIconWrap}>
                  <Icon name="paperclip" size={18} color={COLORS.text} />
                </View>
                <View style={s.docInfo}>
                  <Text style={[s.docName, { color: COLORS.white }]} numberOfLines={1}>{item.file_name || t("document")}</Text>
                  {item.file_size ? <Text style={[s.docSize, { color: "#ffffffaa" }]}>{formatBytes(item.file_size)}</Text> : null}
                </View>
                <Icon name="open-outline" size={18} color={COLORS.white} />
              </View>
            </LinearGradient>
            <LinearGradient colors={COLORS.gradientBubbleReflect} start={{ x: 0, y: 0 }} end={{ x: 0.3, y: 1 }} style={s.mineReflect} pointerEvents="none" />
          </View>
        ) : (
          <TouchableOpacity onLongPress={handleLongPress} onPress={() => { const url = resolveUrl(item.document || item.file_url); if (url) Linking.openURL(url).catch(() => {}); }} activeOpacity={0.8} style={[s.bubble, s.theirs, s.docBubble]}>
            <View style={s.docRow}>
              <View style={s.docIconWrap}>
                  <Icon name="paperclip" size={18} color={COLORS.text} />
              </View>
              <View style={s.docInfo}>
                <Text style={s.docName} numberOfLines={1}>{item.file_name || t("document")}</Text>
                {item.file_size ? <Text style={s.docSize}>{formatBytes(item.file_size)}</Text> : null}
              </View>
              <Icon name="open-outline" size={18} color={COLORS.text} />
            </View>
          </TouchableOpacity>
        )
      ) : isMine ? (
        <View>
          <LinearGradient
            colors={COLORS.gradientBubbleMine}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1.2 }}
            style={[s.bubble, s.mine, SHADOWS.glow]}
          >
            <Text style={[s.bubbleText, s.bubbleTextMine, item.pending && s.bubbleTextPending]}>{item.content}</Text>
          </LinearGradient>
          <LinearGradient
            colors={COLORS.gradientBubbleReflect}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.3, y: 1 }}
            style={s.mineReflect}
            pointerEvents="none"
          />
        </View>
      ) : (
        <TouchableOpacity onLongPress={handleLongPress} onPress={handleTap} activeOpacity={0.8} style={[s.bubble, s.theirs, item.pending && s.bubblePendingBg]}>
          <Text style={[s.bubbleText, item.pending && s.bubbleTextPending]}>{item.content}</Text>
        </TouchableOpacity>
      )}

      <View style={[s.bubbleMeta, isMine && s.bubbleMetaMine]}>
        {item.is_edited && <Text style={[s.editedLabel, isMine && { color: "#ffffff88" }]}>{t("edited")}</Text>}
        <Text style={[s.bubbleTime, isMine && s.bubbleTimeMine]}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
        {isMine && !item.pending && (
          <StatusIndicator item={item} />
        )}
        {item.pending && <ActivityIndicator size={8} color={COLORS.muted} style={{ marginLeft: 4 }} />}
      </View>

      {item.reactions && item.reactions.length > 0 && (
        <View style={[s.reactionsRow, isMine && s.reactionsRowMine]}>
          {item.reactions.map((r, i) => (
            <TouchableOpacity key={i} style={s.reactionChip} onLongPress={() => setShowReactions(true)}>
              <Text style={s.reactionEmoji}>{r.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showReactions && (
        <View style={[s.reactionsPicker, isMine ? s.reactionsPickerMine : s.reactionsPickerTheirs]}>
          {EMOJI_LIST.map((emoji) => (
            <TouchableOpacity key={emoji} style={s.reactionOption} onPress={() => handleReaction(emoji)}>
              <Text style={s.reactionOptionText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
});

function formatMs(ms) {
  if (!ms || ms === 0) return "0:00";
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  return `${min}:${(sec % 60).toString().padStart(2, "0")}`;
}

/* ═══════════════════════════════════════════════════════
   ChatScreen
   ═══════════════════════════════════════════════════════ */
export default function ChatScreen({ route, navigation }) {
  const params = route.params ?? {};
  const userId = params.userId;
  const username = params.username;

  if (!userId) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg }}>
        <Text style={{ color: COLORS.text }}>Conversation not found.</Text>
      </View>
    );
  }
  const { t } = useLanguage();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [vanishMode, setVanishMode] = useState(false);
  const [showVanishPicker, setShowVanishPicker] = useState(false);
  const [vanishSeconds, setVanishSeconds] = useState(30);
  const [showForward, setShowForward] = useState(false);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showInfo, setShowInfo] = useState(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [reactAnim, setReactAnim] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [stickerCategory, setStickerCategory] = useState("popular");
  const [stickerTargetMsg, setStickerTargetMsg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAttachSheet, setShowAttachSheet] = useState(false);
  const [showScrollFAB, setShowScrollFAB] = useState(false);

  // ─── Animated online pulse ────────────────────────
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isOnline) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, { toValue: 1.6, duration: 1500, useNativeDriver: true }),
            Animated.timing(ringAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
            Animated.timing(ringAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
          ]),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
      ringAnim.setValue(0);
    }
  }, [isOnline]);

  // ─── Task 9: search / draft / bulk ───────────────
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const draftSavedTimer = useRef(null);
  const searchDebounce = useRef(null);
  const draftSaveDebounce = useRef(null);
  const lastSentTs = useRef(null);

  const flatListRef = useRef(null);
  const typingTimerRef = useRef(null);

  /* ─── Load messages ─────────────────────────────────── */
  const load = useCallback(async (cursor = null) => {
    try {
      const url = cursor ? `/messages/${userId}?cursor=${cursor}&limit=50` : `/messages/${userId}?limit=50`;
      const res = await client.get(url);
      const newMessages = res.data?.data || [];
      const nextCursor = res.data?.next_cursor;
      const more = res.data?.has_more || false;
      if (cursor) setMessages((prev) => [...newMessages, ...prev]);
      else { setMessages(newMessages); await cacheMessages(userId, newMessages); }
      setHasMore(more);
    } catch (e) {
      if (!cursor) { const cached = await getCachedMessages(userId); if (cached.length > 0) setMessages(cached); }
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const processQueue = async () => {
      const queue = await getOfflineQueue();
      for (const msg of queue) {
        try {
          const payload = { receiver_id: msg.receiver_id, content: msg.content };
          if (msg.reply_to) payload.reply_to = msg.reply_to;
          await client.post("/messages", payload);
          await removeFromOfflineQueue(msg.temp_id);
        } catch (_) {}
      }
    };
    processQueue();

    // BUG-013: flush the offline queue again whenever realtime reconnects.
    const unsub = realtime.onStatus((status) => {
      if (status === "connected") processQueue();
    });
    return () => { if (unsub) unsub(); };
  }, []);

  const loadMore = async () => {
    if (!hasMore || loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    await load(messages[0]?.id);
    setLoadingMore(false);
  };

  /* ─── Task 9: draft load on mount ──────────────────── */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await client.get(`/messages/${userId}/draft`);
        const content = res.data?.content;
        if (active && content) setText(content);
      } catch (_) {
        try { const cached = await getDraft(userId); if (active && cached) setText(cached); } catch (_) {}
      }
    })();
    return () => { active = false; };
  }, [userId]);

  /* ─── Task 9: in-conversation search ─────────────── */
  const runSearch = useCallback(async (q) => {
    if (!q || !q.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const res = await client.get(`/messages/${userId}/search`, { params: { q: q.trim(), per_page: 30 } });
      setSearchResults(res.data?.data || []);
    } catch (_) {
      const all = messages.filter((m) => (m.content || "").toLowerCase().includes(q.trim().toLowerCase()));
      setSearchResults(all);
    } finally {
      setSearching(false);
    }
  }, [userId, messages]);

  const onSearchChange = (val) => {
    setSearchQuery(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!val.trim()) { setSearchResults([]); return; }
    searchDebounce.current = setTimeout(() => runSearch(val), 350);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  /* ─── Task 9: draft autosave ─────────────────────── */
  const saveDraftNow = useCallback(async (val) => {
    try {
      await client.post(`/messages/${userId}/draft`, { content: val || "" });
    } catch (_) {
      try { await cacheDraft(userId, val || ""); } catch (_) {}
    }
    setDraftSaved(true);
    if (draftSavedTimer.current) clearTimeout(draftSavedTimer.current);
    draftSavedTimer.current = setTimeout(() => setDraftSaved(false), 1500);
  }, [userId]);

  /* ─── Task 9: bulk selection ─────────────────────── */
  const toggleSelect = (item) => {
    if (item.pending) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  };

  const exitBulk = () => {
    setBulkMode(false);
    setSelectedIds(new Set());
  };

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      try { await client.delete(`/messages/${id}/for-me`); } catch (_) {}
    }
    setMessages((prev) => prev.filter((m) => !selectedIds.has(m.id)));
    exitBulk();
  };

  const bulkForward = () => {
    if (selectedIds.size === 0) { exitBulk(); return; }
    setForwardMsg({ id: Array.from(selectedIds)[0], _bulk: Array.from(selectedIds) });
    setShowForward(true);
    loadConversations();
  };

  /* ─── WebSocket ─────────────────────────────────────── */
  useEffect(() => {
    let echoChannel, typingChannel;
    const setupWebSocket = async () => {
      try {
        const echo = await getEcho();
        if (!echo) return;
        echoChannel = echo.private(`messages.${user?.id}`);
        echoChannel.listen("message.sent", (event) => {
          if (event.sender_id === parseInt(userId) || event.receiver_id === parseInt(userId)) {
            setMessages((prev) => {
              if (prev.find((m) => m.id === event.id)) return prev;
              return [...prev, {
                id: event.id, content: event.content, type: event.type, image: event.image,
                voice: event.voice, video: event.video, document: event.document, duration: event.duration,
                sender_id: event.sender_id,
                receiver_id: event.receiver_id, created_at: event.created_at,
                is_read: event.is_read, reply_to: event.reply_to, sender: event.sender,
                reply_message: null, reactions: [],
              }];
            });
          }
        });
        typingChannel = echo.private(`typing.${user?.id}`);
        typingChannel.listen("typing.indicator", (event) => {
          if (event.sender_id === parseInt(userId)) setRemoteTyping(event.typing);
        });
        // Delivered + read receipts for messages we sent (BUG-005).
        echoChannel.listen("message.delivered", (event) => {
          if (!event || event.id == null) return;
          setMessages((prev) =>
            prev.map((m) => (m.id === event.id ? { ...m, delivered: event.delivered ?? true } : m))
          );
        });
        echoChannel.listen("message.read", (event) => {
          if (!event || event.id == null) return;
          setMessages((prev) =>
            prev.map((m) => (m.id === event.id ? { ...m, is_read: event.read ?? true } : m))
          );
        });
        client.post("/messages/online").catch(() => {});
      } catch (_) {}
    };
    setupWebSocket();
    const checkOnline = setInterval(async () => {
      try { const r = await client.get(`/users/${userId}/status`); setIsOnline(r.data?.is_online || false); } catch (_) {}
    }, 10000);
    return () => { if (echoChannel) echoChannel.leave(); if (typingChannel) typingChannel.leave(); clearInterval(checkOnline); };
  }, [user?.id, userId]);

  useLayoutEffect(() => { navigation.setOptions({ headerShown: false }); }, [navigation]);

  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidShow", () => {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => sub.remove();
  }, []);

  // Mark messages as read only when the other user has unread messages for us,
  // and debounce so optimistic local appends don't spam the server.
  useEffect(() => {
    if (!userId) return;
    const hasUnreadFromThem = messages.some(
      (m) => m.sender_id !== parseInt(userId) && !m.is_read
    );
    if (!hasUnreadFromThem) return;

    const t = setTimeout(() => {
      client.post(`/messages/read/${userId}`).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [messages, userId]);

  /* ─── Send message ──────────────────────────────────── */
  const send = async () => {
    if (editingMsg) {
      try {
        await client.put(`/messages/${editingMsg.id}`, { content: text.trim() });
        setMessages((prev) => prev.map((m) => m.id === editingMsg.id ? { ...m, content: text.trim(), is_edited: true } : m));
        setText(""); setEditingMsg(null);
      } catch (_) {}
      return;
    }
    if (!text.trim() && !replyTo) return;
    const validationError = validateMessage(text);
    if (validationError) { Alert.alert(t("error"), t(validationError)); return; }
    if (!floodGuard(lastSentTs.current, 300)) return;
    lastSentTs.current = Date.now();
    const msg = text.trim();
    setText(""); setSending(true); setReplyTo(null);
    try { await saveDraftNow(""); } catch (_) {}
    const tempId = `temp_${Date.now()}`;
    const optimistic = {
      id: tempId, content: msg, type: "text", sender_id: user?.id,
      receiver_id: parseInt(userId), created_at: new Date().toISOString(),
      is_read: false, reply_to: replyTo?.id,
      sender: { id: user?.id, username: user?.username, avatar: user?.avatar },
      reply_message: replyTo, reactions: [], pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const payload = { receiver_id: userId, content: msg };
      if (replyTo) payload.reply_to = replyTo.id;
      if (vanishMode) payload.vanish = true;
      const res = await client.post("/messages", payload);
      if (vanishMode && res.data?.id) client.post(`/messages/${res.data.id}/vanish`, { seconds: vanishSeconds }).catch(() => {});
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...res.data, pending: false } : m));
      await removeFromOfflineQueue(tempId);
    } catch (_) {
      await addToOfflineQueue({ temp_id: tempId, ...optimistic });
    }
    setSending(false);
  };

  /* ─── Send media ────────────────────────────────────── */
  const sendMedia = async (type) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === "video" ? ["videos"] : ["images"], quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]) {
        setSending(true);
        setUploading(true); setUploadProgress(0);
        const uri = result.assets[0].uri;
        const filename = uri.split("/").pop() || (type === "video" ? "video.mp4" : "photo.jpg");
        const ext = filename.split(".").pop().toLowerCase();
        const mimeMap = { mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };
        const mimeType = mimeMap[ext] || (type === "video" ? "video/mp4" : "image/jpeg");
        const tempId = `temp_${Date.now()}`;
        const optimistic = {
          id: tempId, type: type === "video" ? "video" : "image",
          sender_id: user?.id, receiver_id: parseInt(userId),
          created_at: new Date().toISOString(), is_read: false,
          image: type === "video" ? null : uri, video: type === "video" ? uri : null,
          sender: { id: user?.id, username: user?.username, avatar: user?.avatar },
          reactions: [], pending: true,
        };
        setMessages((prev) => [...prev, optimistic]);
        try {
          const formData = new FormData();
          formData.append("receiver_id", String(userId));
          formData.append(type === "video" ? "video" : "image", { uri, name: filename, type: mimeType });
          const res = await uploadWithProgress("/messages", formData, setUploadProgress);
          setMessages((prev) => prev.map((m) => m.id === tempId ? { ...(res.data || {}), pending: false } : m));
          await load();
        } catch (_) {
          setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, pending: false } : m));
          Alert.alert(t("error"), t(type === "video" ? "failedToSendVideo" : "failedToSendImage"));
        }
        setUploading(false); setUploadProgress(0);
        setSending(false);
      }
    } catch (_) { Alert.alert(t("error"), t("failedToSendImage")); }
  };

  /* ─── VoiceRecorder integration ────────────────────── */
  const handleSendVoice = async (uri, duration) => {
    setShowVoiceRecorder(false);
    if (!uri || duration <= 0) return;
    const tempId = `temp_${Date.now()}`;
    const optimistic = {
      id: tempId, type: "voice", sender_id: user?.id,
      receiver_id: parseInt(userId), created_at: new Date().toISOString(),
      is_read: false, voice: uri, duration,
      sender: { id: user?.id, username: user?.username, avatar: user?.avatar },
      reactions: [], pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    const formData = new FormData();
    formData.append("receiver_id", String(userId));
    formData.append("duration", String(duration));
    const filename = `voice_${Date.now()}.m4a`;
    formData.append("voice", { uri, name: filename, type: "audio/mp4" });
    setSending(true);
    setUploading(true); setUploadProgress(0);
    try {
      const res = await uploadWithProgress("/messages", formData, setUploadProgress);
      console.log("[VOICE_SEND_OK] res.data:", JSON.stringify({ id: res.data?.id, type: res.data?.type, voice: res.data?.voice, duration: res.data?.duration }));
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...(res.data || {}), pending: false } : m));
      await load();
    } catch (e) {
      console.error("VOICE_SEND_FAILED", e?.message, e?.response?.status, e?.response?.data);
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, pending: false } : m));
      Alert.alert(t("error"), e?.response?.data?.message || t("failedToSend"));
    }
    setUploading(false); setUploadProgress(0);
    setSending(false);
  };

  const openVoiceRecorder = () => {
    if (isExpoGo()) { Alert.alert(t("error"), t("voiceMessagesRequireDevBuild")); return; }
    setShowVoiceRecorder(true);
  };

  /* ─── Send document / zip / pdf ─────────────────────── */
  // Backend MessageController@send accepts a `document` multipart field
  // (type "document") and persists it via StorageHelper. The message renders
  // locally optimistically and is reconciled with the server response.
  const sendDocument = async () => {
    let doc = null;
    try {
      doc = await pickDocument();
    } catch (_) {
      Alert.alert(t("error"), t("failedToSend"));
      return;
    }
    if (!doc) return;
    setUploading(true); setUploadProgress(0);
    const tempId = `temp_${Date.now()}`;
    const optimistic = {
      id: tempId, type: "document", sender_id: user?.id,
      receiver_id: parseInt(userId), created_at: new Date().toISOString(),
      is_read: false, document: doc.uri, file_name: doc.name, file_size: doc.size,
      sender: { id: user?.id, username: user?.username, avatar: user?.avatar },
      reactions: [], pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const formData = new FormData();
      formData.append("receiver_id", String(userId));
      formData.append("type", "document");
      formData.append("document", { uri: doc.uri, name: doc.name, type: doc.mimeType });
      const res = await uploadWithProgress("/messages", formData, setUploadProgress);
      if (res.data?.id) {
        setMessages((prev) => prev.map((m) => m.id === tempId ? { ...res.data, pending: false } : m));
      } else {
        setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, pending: false } : m));
      }
      await load();
    } catch (_) {
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, pending: false } : m));
    }
    setUploading(false); setUploadProgress(0);
  };

  /* ─── Context menu actions ──────────────────────────── */
  const handleContextMenu = (key, item) => {
    const mine = item.sender_id === user?.id;
    setContextMenu(null);
    switch (key) {
      case "reply": setReplyTo(item); break;
      case "forward": setForwardMsg(item); setShowForward(true); loadConversations(); break;
      case "copy": Share.share({ message: item.content || "" }); break;
      case "download":
        const dlUrl = resolveUrl(item.image || item.video || item.document || item.voice || "");
        if (dlUrl) {
          if (Platform.OS === "web") window.open(dlUrl, "_blank");
          else Share.share({ url: dlUrl });
        }
        break;
      case "edit": setEditingMsg(item); setText(item.content); break;
      case "info": setShowInfo(item); break;
      case "pin": client.post(`/messages/pin/${userId}`).then(() => Alert.alert(t("success"))); break;
      case "sticker":
        setStickerTargetMsg(item);
        setShowStickerPicker(true);
        break;
      case "delete":
        Alert.alert(t("deleteMessage"), t("deleteMessageConfirm"), [
          { text: t("cancel"), style: "cancel" },
          { text: t("delete"), style: "destructive", onPress: async () => { try { await client.delete(`/messages/${item.id}/for-me`); setMessages((prev) => prev.filter((m) => m.id !== item.id)); } catch (_) {} } },
        ]);
        break;
      case "unsend":
        Alert.alert(t("unsend"), t("unsendConfirm"), [
          { text: t("cancel"), style: "cancel" },
          { text: t("unsend"), style: "destructive", onPress: async () => { try { await client.delete(`/messages/${item.id}`); load(); } catch (_) {} } },
        ]);
        break;
    }
  };

  const sendSticker = async (sticker) => {
    setShowStickerPicker(false);
    const tempId = `temp_${Date.now()}`;
    const optimistic = {
      id: tempId, content: sticker, type: "sticker", sender_id: user?.id,
      receiver_id: parseInt(userId), created_at: new Date().toISOString(),
      is_read: false, sender: { id: user?.id, username: user?.username, avatar: user?.avatar },
      reactions: [], pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const res = await client.post("/messages", { receiver_id: userId, content: sticker, type: "sticker" });
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...res.data, pending: false } : m));
    } catch (_) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const handleAttachAction = (key) => {
    switch (key) {
      case "camera":
      case "gallery": sendMedia("image"); break;
      case "video": sendMedia("video"); break;
      case "document": sendDocument(); break;
      case "audio": openVoiceRecorder(); break;
      case "location":
        const url = `https://maps.google.com/?q=${encodeURIComponent(t("shareLocation"))}`;
        Share.share({ url }).catch(() => {});
        break;
    }
  };

  const handleForward = async (targetId) => {
    if (!forwardMsg) return;
    const ids = forwardMsg._bulk && forwardMsg._bulk.length ? forwardMsg._bulk : [forwardMsg.id];
    try {
      for (const id of ids) {
        await client.post(`/messages/${id}/forward`, { receiver_id: targetId });
      }
      setShowForward(false); setForwardMsg(null);
      if (bulkMode) exitBulk();
      Alert.alert(t("success"), t("forward"));
    } catch (_) {}
  };

  const loadConversations = async () => {
    try { const res = await client.get("/messages/conversations"); setConversations((res.data || []).filter((c) => c.user.id !== user?.id)); } catch (_) {}
  };

  /* ─── Stable callbacks for FlatList ──────────────────── */
  const keyExtractor = useCallback((m) => m.key, []);
  const onContentSizeChange = useCallback(() => flatListRef.current?.scrollToEnd({ animated: false }), []);
  const onScroll = useCallback((e) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    setShowScrollFAB(distanceFromBottom > 200);
  }, []);
  const onEndReached = useCallback(() => {
    if (!hasMore || loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    load(messages[0]?.id).finally(() => setLoadingMore(false));
  }, [hasMore, loadingMore, messages, load]);
  const listFooter = useMemo(() => {
    if (searching) return <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 10 }} />;
    if (loadingMore) return <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 10 }} />;
    return null;
  }, [searching, loadingMore]);
  const listEmpty = useMemo(() => (
    <View style={s.emptyWrap}>
      <Icon name="chatbubble" size={56} color={COLORS.textSecondary} />
      <Text style={s.emptyText}>{searchOpen && searchQuery.trim() ? t("noResults") : t("startConvWith").replace("{username}", username)}</Text>
    </View>
  ), [searchOpen, searchQuery, username, t]);

  const handleImagePress = useCallback((msg) => {
    if (bulkMode) toggleSelect(msg);
    else setViewImage(msg.image);
  }, [bulkMode]);
  const handleVideoPress = useCallback((msg) => {
    if (bulkMode) {
      toggleSelect(msg);
      return;
    }
    if (!msg?.video) return;
    navigation.navigate("ChatVideoViewer", {
      videoUrl: msg.video,
      username: msg.sender?.username,
      avatar: msg.sender?.avatar,
      timestamp: msg.created_at,
    });
  }, [bulkMode, navigation]);
  const handleBubbleLongPress = useCallback((msg) => {
    if (!bulkMode) setContextMenu(msg);
    else toggleSelect(msg);
  }, [bulkMode]);
  const handleMessageLongPress = useCallback((item) => {
    if (!bulkMode) { setBulkMode(true); toggleSelect(item); }
    else toggleSelect(item);
  }, [bulkMode]);
  const handleMessagePress = useCallback((item) => {
    if (bulkMode) toggleSelect(item);
  }, [bulkMode]);

  const reactAnimTimer = useRef(null);
  const reactAnimScale = useRef(new Animated.Value(0)).current;
  const handleDoubleTap = async (item) => {
    if (item.pending) return;
    clearTimeout(reactAnimTimer.current);
    reactAnimScale.setValue(0);
    setReactAnim({ id: item.id, emoji: "❤️" });
    Animated.sequence([
      Animated.spring(reactAnimScale, { toValue: 1.4, tension: 200, friction: 8, useNativeDriver: true }),
      Animated.spring(reactAnimScale, { toValue: 1, tension: 150, friction: 10, useNativeDriver: true }),
    ]).start();
    try { await client.post(`/messages/${item.id}/react`, { emoji: "❤️" }); } catch (_) {}
    reactAnimTimer.current = setTimeout(() => {
      Animated.timing(reactAnimScale, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setReactAnim(null));
    }, 1200);
  };
  useEffect(() => () => clearTimeout(reactAnimTimer.current), []);

  const handleTextChange = (val) => {
    setText(val);
    if (!typingTimerRef.current) client.post("/messages/typing", { receiver_id: userId, typing: true }).catch(() => {});
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      client.post("/messages/typing", { receiver_id: userId, typing: false }).catch(() => {});
      typingTimerRef.current = null;
    }, 2000);
    if (draftSaveDebounce.current) clearTimeout(draftSaveDebounce.current);
    draftSaveDebounce.current = setTimeout(() => saveDraftNow(val), 800);
  };

  const cancelEdit = () => { setEditingMsg(null); setText(""); };

  /* ─── Group messages by date ────────────────────────── */
  const groupedMessages = [];
  let lastDate = null;
  let unreadInserted = false;
  messages.forEach((m) => {
    const d = new Date(m.created_at).toDateString();
    if (d !== lastDate) { groupedMessages.push({ type: "date", date: m.created_at, key: `date_${d}` }); lastDate = d; }
    if (!unreadInserted && m.sender_id !== user?.id && !m.is_read) {
      groupedMessages.push({ type: "unread", key: `unread_${m.id}` });
      unreadInserted = true;
    }
    groupedMessages.push({ ...m, key: String(m.id) });
  });

  const hasText = text.trim().length > 0;

  /* ─── Task 9: list data (search overrides normal grouping) ─── */
  const listData = (searchOpen && searchQuery.trim())
    ? searchResults.map((m) => ({ ...m, key: String(m.id) }))
    : groupedMessages;

  const stickyIndices = listData
    .map((item, idx) => item.type === "date" ? idx : -1)
    .filter((idx) => idx >= 0);

  return (
    <View style={s.outerContainer}>
      <Screen3D>
        <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : "padding"} keyboardVerticalOffset={0}>
          {/* ─── Header ─────────────────────────────────── */}
          <View style={[s.topBar, { paddingTop: insets.top + 2 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
              <Icon name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} size={20} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity style={s.headerCenter} onPress={() => {
              if (userId === user?.id) navigation.navigate("Home", { screen: "Profile" });
              else navigation.navigate("UserProfile", { userId, username });
            }} activeOpacity={0.8}>
              <View style={s.avatarWrap}>
                <View style={[s.avatarSmall, isOnline && s.avatarSmallOnline]}>
                  <Text style={s.avatarText}>{username?.[0]?.toUpperCase() || "?"}</Text>
                </View>
                {isOnline && (
                  <>
                    <Animated.View style={[s.onlineRing, { opacity: ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }), transform: [{ scale: ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] }) }] }]} />
                    <Animated.View style={[s.onlineDot, { transform: [{ scale: pulseAnim }] }]} />
                  </>
                )}
              </View>
              <View style={s.headerInfo}>
                <Text style={s.name} numberOfLines={1}>{username}</Text>
                {remoteTyping ? (
                  <View style={s.typingRow}>
                    <Text style={s.typingText}>{t("typing")}</Text>
                    <View style={s.typingDotsInline}>
                      <View style={[s.typingDotInline, s.typingDotInlineAnim1]} />
                      <View style={[s.typingDotInline, s.typingDotInlineAnim2]} />
                      <View style={[s.typingDotInline, s.typingDotInlineAnim3]} />
                    </View>
                  </View>
                ) : (
                  <Text style={[s.statusText, { color: isOnline ? COLORS.success : COLORS.textTertiary }]}>
                    {isOnline ? t("online") : t("offline")}
                    {vanishMode ? " · " : ""}{vanishMode ? <Icon name="flame" size={12} color={COLORS.success} /> : null}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
            <View style={s.headerActions}>
              <TouchableOpacity style={s.headerActionBtn} onPress={() => setSearchOpen((p) => !p)} activeOpacity={0.7}>
                <Icon name="search" size={16} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity style={s.headerActionBtn} onPress={() => setShowMenu(!showMenu)} activeOpacity={0.7}>
                <Icon name="ellipsis-horizontal" size={16} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>

          <ConnectionBanner />

          {searchOpen && (
            <MessageSearchBar
              value={searchQuery}
              onChangeText={onSearchChange}
              onClose={closeSearch}
              placeholder={t("searchInConversation")}
            />
          )}

          {/* ─── Menu ────────────────────────────────────── */}
          {showMenu && (
            <AnimatedMenu onClose={() => setShowMenu(false)} userId={userId} setShowVanishPicker={setShowVanishPicker} setShowMenu={setShowMenu} />
          )}

          {/* ─── Edit Bar ────────────────────────────────── */}
          {editingMsg && (
            <View style={s.editBar}>
              <View style={s.editBarContent}>
                <Icon name="create" size={14} color={COLORS.primary} /><Text style={s.editBarLabel}> {t("editMessage")}</Text>
                <Text style={s.editBarText} numberOfLines={1}>{editingMsg.content}</Text>
              </View>
              <TouchableOpacity onPress={cancelEdit} style={s.editBarClose}>
                <Icon name="close" size={18} color={COLORS.muted} />
              </TouchableOpacity>
            </View>
          )}

          {/* ─── Reply Bar ───────────────────────────────── */}
          {replyTo && !editingMsg && (
            <View style={s.replyBar}>
              <View style={s.replyBarAccent} />
              <View style={s.replyBarContent}>
                <Text style={s.replyBarName}>{replyTo.sender?.username || t("message")}</Text>
                {replyTo.content ? <Text style={s.replyBarText} numberOfLines={1}>{replyTo.content}</Text> : <Icon name="paperclip" size={14} color={COLORS.muted} />}
              </View>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Icon name="close" size={18} color={COLORS.muted} />
              </TouchableOpacity>
            </View>
          )}

          {/* ─── Vanish Timer Bar ────────────────────────── */}
          {vanishMode && (
            <View style={s.vanishBar}>
              <Text style={s.vanishBarText}><Icon name="flame" size={12} color={COLORS.danger} /> {t("vanishTimer")}: {vanishSeconds}s</Text>
            </View>
          )}

          {/* ─── Messages ────────────────────────────────── */}
          <View style={s.messagesArea}>
            <AmbientGradient />
            <FlatList
            ref={flatListRef}
            data={listData}
            keyExtractor={keyExtractor}
            stickyHeaderIndices={stickyIndices}
            removeClippedSubviews={false}
            contentContainerStyle={{ padding: 12, paddingBottom: Math.max(insets.bottom + 60, 70) }}
            onContentSizeChange={onContentSizeChange}
            onScroll={onScroll}
            scrollEventThrottle={16}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={listFooter}
            ListEmptyComponent={listEmpty}
            renderItem={({ item, index }) => {
              if (item.type === "date") return <DateSeparator date={item.date} />;
              if (item.type === "unread") return <UnreadSeparator />;
              const mine = item.sender_id === user?.id;
              const selected = selectedIds.has(item.id);
              return (
                <MessageAppear index={index}>
                  <View>
                    <TouchableOpacity
                      activeOpacity={bulkMode ? 1 : 0.9}
                      onLongPress={() => handleMessageLongPress(item)}
                      onPress={() => handleMessagePress(item)}
                      disabled={bulkMode && item.pending}
                    >
                      <MessageBubble
                        item={item}
                        isMine={mine}
                        currentUserId={user?.id}
                        selected={selected}
                        onDoubleTap={bulkMode ? undefined : handleDoubleTap}
                        onImagePress={handleImagePress}
                        onVideoPress={handleVideoPress}
                        onVideoLongPress={handleBubbleLongPress}
                        onLongPress={handleBubbleLongPress}
                      />
                    </TouchableOpacity>
                    {reactAnim?.id === item.id && !bulkMode && (
                      <Animated.View style={[s.reactAnimWrap, mine ? { right: 20 } : { left: 20 }, { transform: [{ scale: reactAnimScale }] }]}>
                        <Text style={s.reactAnimText}>{reactAnim.emoji}</Text>
                      </Animated.View>
                    )}
                  </View>
                </MessageAppear>
              );
            }}
          />
          </View>

          {remoteTyping && <TypingIndicator username={username} />}

          {/* ─── Scroll to Bottom FAB ──────────────────────── */}
          {showScrollFAB && <ScrollToBottomFAB onPress={() => flatListRef.current?.scrollToEnd({ animated: true })} insets={insets} />}

          {/* ─── Emoji Picker ────────────────────────────── */}
          {showEmojiPicker && (
            <View style={[s.emojiPicker, { bottom: Math.max(insets.bottom + 50, 60) }]}>
              {EMOJI_LIST.map((emoji) => (
                <TouchableOpacity key={emoji} style={s.emojiBtn} onPress={() => { setText((p) => p + emoji); setShowEmojiPicker(false); }}>
                  <Text style={s.emojiBtnText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ─── Recording UI ────────────────────────────── */}
          {showVoiceRecorder && (
            <View style={[s.recordingBarOuter, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
              <VoiceRecorder
                onSend={handleSendVoice}
                onCancel={() => setShowVoiceRecorder(false)}
              />
            </View>
          )}

          {/* ─── Input Bar ───────────────────────────────── */}
          {!showVoiceRecorder && !bulkMode && (
            <View style={[s.inputRow, { paddingBottom: Math.max(insets.bottom + 6, 12) }]}>
              <TouchableOpacity style={s.inputActionBtn} onPress={() => setShowAttachSheet(true)} activeOpacity={0.7}>
                <Icon name="add" size={18} color={COLORS.textSecondary} />
                <MediaProgress progress={uploadProgress} visible={uploading} />
              </TouchableOpacity>

              <TextInput
                style={s.input}
                value={text}
                onChangeText={handleTextChange}
                placeholder={editingMsg ? t("editMessage") : t("message") + "..."}
                placeholderTextColor={COLORS.textTertiary}
                returnKeyType="send"
                onSubmitEditing={send}
                multiline
                maxLength={5000}
                editable={!bulkMode}
              />
              {!bulkMode && <DraftIndicator visible={draftSaved} />}

              {hasText || editingMsg ? (
                <TouchableOpacity style={s.sendBtnActive} onPress={send} disabled={sending} activeOpacity={0.7}>
                  {sending ? <ActivityIndicator size="small" color={COLORS.white} /> : <Icon name="arrow-forward" size={17} color={COLORS.white} />}
                </TouchableOpacity>
              ) : (
                <View style={s.inputActionsRight}>
                  <TouchableOpacity style={s.inputActionBtn} onPress={() => setShowEmojiPicker((p) => !p)} activeOpacity={0.7}>
                    <Icon name="happy" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={s.inputActionBtn} onPressIn={openVoiceRecorder}>
                    <Icon name="mic" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {bulkMode && (
            <BulkActionBar
              count={selectedIds.size}
              onDelete={bulkDelete}
              onForward={bulkForward}
              onCancel={exitBulk}
            />
          )}

          {/* ─── Context Menu Modal ──────────────────────── */}
          <Modal visible={!!contextMenu} transparent animationType="slide" onRequestClose={() => setContextMenu(null)}>
            <TouchableOpacity style={s.ctxOverlay} activeOpacity={1} onPress={() => setContextMenu(null)}>
              {contextMenu && (
                <View style={s.ctxSheet}>
                  <View style={s.ctxHandle} />
                  <View style={[s.ctxBubblePreview, contextMenu.sender_id === user?.id ? s.ctxBubbleMine : s.ctxBubbleTheirs]}>
                    {contextMenu.content ? <Text style={[s.ctxBubbleText, contextMenu.sender_id === user?.id && { color: COLORS.white }]} numberOfLines={3}>{contextMenu.content}</Text> : <Icon name="paperclip" size={16} color={contextMenu.sender_id === user?.id ? COLORS.white : COLORS.text} />}
                  </View>
                  <View style={s.ctxEmojiRow}>
                    {EMOJI_LIST.map((emoji) => (
                      <TouchableOpacity key={emoji} style={s.ctxEmojiBtn} onPress={() => { setContextMenu(null); handleReaction(contextMenu, emoji); }} activeOpacity={0.7}>
                        <Text style={s.ctxEmojiText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={s.ctxOptions}>
                    {(contextMenu.sender_id === user?.id ? MESSAGE_OPTIONS_MINE : MESSAGE_OPTIONS)
                      .filter((opt) => {
                        if (opt.mediaOnly) return contextMenu.type === "image" || contextMenu.type === "video";
                        if (opt.textOnly) return contextMenu.type === "text";
                        if (opt.key === "copy") return !!contextMenu.content;
                        return true;
                      })
                      .map((opt) => (
                        <TouchableOpacity key={opt.key} style={[s.ctxOption, opt.danger && s.ctxOptionDanger]} onPress={() => handleContextMenu(opt.key, contextMenu)} activeOpacity={0.7}>
                          <Icon name={opt.icon} size={18} color={opt.danger ? COLORS.danger : COLORS.text} style={s.ctxOptionIcon} />
                          <Text style={[s.ctxOptionLabel, opt.danger && s.ctxOptionDangerText]}>{t(opt.labelKey)}</Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </Modal>

          {/* ─── Vanish Timer Picker ─────────────────────── */}
          <Modal visible={showVanishPicker} transparent animationType="fade" onRequestClose={() => setShowVanishPicker(false)}>
            <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowVanishPicker(false)}>
              <View style={s.vanishModal}>
                <Text style={s.vanishModalTitle}>{t("vanishTimer")}</Text>
                {VANISH_OPTIONS.map((opt) => (
                  <TouchableOpacity key={opt.seconds} style={[s.vanishOption, vanishSeconds === opt.seconds && s.vanishOptionActive]} onPress={() => { setVanishSeconds(opt.seconds); setVanishMode(true); setShowVanishPicker(false); }}>
                    <Text style={[s.vanishOptionText, vanishSeconds === opt.seconds && { color: COLORS.white }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
                {vanishMode && (
                  <TouchableOpacity style={s.vanishOffBtn} onPress={() => { setVanishMode(false); setShowVanishPicker(false); }}>
                    <Text style={s.vanishOffText}>{t("cancel")}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          </Modal>

          {/* ─── Forward Modal ───────────────────────────── */}
          <Modal visible={showForward} transparent animationType="slide" onRequestClose={() => setShowForward(false)}>
            <View style={s.modalOverlay}>
              <View style={s.forwardModal}>
                <Text style={s.forwardTitle}>{t("forwardMessage")}</Text>
                <FlatList
                  data={conversations}
                  keyExtractor={(c) => String(c.user.id)}
                  renderItem={({ item: c }) => (
                    <TouchableOpacity style={s.forwardRow} onPress={() => handleForward(c.user.id)}>
                      <View style={s.forwardAvatar}>
                        <Text style={s.forwardAvatarText}>{c.user.username?.[0]?.toUpperCase()}</Text>
                      </View>
                      <Text style={s.forwardName}>{c.user.username}</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={<ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />}
                />
                <TouchableOpacity style={s.forwardCancel} onPress={() => setShowForward(false)}>
                  <Text style={s.forwardCancelText}>{t("cancel")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* ─── Info Modal ──────────────────────────────── */}
          <Modal visible={!!showInfo} transparent animationType="fade" onRequestClose={() => setShowInfo(null)}>
            <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowInfo(null)}>
              <View style={s.infoModal}>
                <Text style={s.infoTitle}>{t("messageInfo")}</Text>
                {showInfo && (
                  <>
                    <View style={s.infoRow}>
                      <Text style={s.infoLabel}>{t("sentAt")}</Text>
                      <Text style={s.infoValue}>{new Date(showInfo.created_at).toLocaleString()}</Text>
                    </View>
                    {showInfo.sender_id === user?.id && (
                      <View style={s.infoRow}>
                        <Text style={s.infoLabel}>{showInfo.read_at ? t("readAt") : t("deliveredAt")}</Text>
                        <Text style={s.infoValue}>{showInfo.read_at ? new Date(showInfo.read_at).toLocaleString() : t("notDelivered")}</Text>
                      </View>
                    )}
                    {showInfo.is_edited && (
                      <View style={s.infoRow}>
                        <Text style={s.infoLabel}>{t("edit")}</Text>
                        <Text style={s.infoValue}>{t("edited")}</Text>
                      </View>
                    )}
                  </>
                )}
                <TouchableOpacity style={s.infoClose} onPress={() => setShowInfo(null)}>
                  <Text style={s.infoCloseText}>{t("done")}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* ─── Image Viewer ────────────────────────────── */}
          <Modal visible={!!viewImage} transparent animationType="fade" onRequestClose={() => setViewImage(null)}>
            <TouchableOpacity style={s.imageViewerOverlay} activeOpacity={1} onPress={() => setViewImage(null)}>
              {viewImage && <Image source={{ uri: resolveUrl(viewImage) }} style={s.imageViewerImage} resizeMode="contain" />}
            </TouchableOpacity>
          </Modal>

          {/* ─── Sticker Picker Modal ─────────────────────── */}
          <Modal visible={showStickerPicker} transparent animationType="slide" onRequestClose={() => setShowStickerPicker(false)}>
            <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowStickerPicker(false)}>
              <View style={s.stickerModal}>
                <View style={s.stickerHandle} />
                <Text style={s.stickerTitle}>{t("addSticker")}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.stickerCategories}>
                  {STICKER_PACKS.map((pack) => (
                    <TouchableOpacity
                      key={pack.id}
                      style={[s.stickerCatBtn, stickerCategory === pack.id && s.stickerCatBtnActive]}
                      onPress={() => setStickerCategory(pack.id)}
                    >
                      <Text style={[s.stickerCatText, stickerCategory === pack.id && s.stickerCatTextActive]}>{pack.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <FlatList
                  data={STICKER_PACKS.find((p) => p.id === stickerCategory)?.stickers || []}
                  keyExtractor={(item, i) => `${stickerCategory}_${i}`}
                  numColumns={5}
                  contentContainerStyle={s.stickerGrid}
                  renderItem={({ item: sticker }) => (
                    <TouchableOpacity style={s.stickerItem} onPress={() => { sendSticker(sticker); setShowStickerPicker(false); }}>
                      <Text style={s.stickerItemText}>{sticker}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableOpacity>
          </Modal>

          {/* ─── Premium Attachment Sheet ─────────────────────── */}
          <Modal visible={showAttachSheet} transparent animationType="none" onRequestClose={() => setShowAttachSheet(false)}>
            <TouchableOpacity style={s.attachOverlay} activeOpacity={1} onPress={() => setShowAttachSheet(false)}>
              <Animated.View style={s.attachSheet}>
                <View style={s.attachHandle} />
                <Text style={s.attachTitle}>{t("attach")}</Text>
                <View style={s.attachGrid}>
                  {ATTACH_OPTIONS.map((opt, idx) => (
                    <TouchableOpacity
                      key={opt.key}
                      style={s.attachCard}
                      onPress={() => { setShowAttachSheet(false); handleAttachAction(opt.key); }}
                      activeOpacity={0.85}
                    >
                      <View style={[s.attachCardIcon, { backgroundColor: opt.color + "20" }]}>
                        <LinearGradient colors={[opt.color + "40", opt.color + "10"]} style={s.attachCardGradient}>
                          <Icon name={opt.icon} size={28} style={s.attachCardEmoji} />
                        </LinearGradient>
                      </View>
                      <Text style={s.attachCardLabel}>{t(opt.labelKey)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            </TouchableOpacity>
          </Modal>

        </KeyboardAvoidingView>
      </Screen3D>
    </View>
  );

  function handleReaction(item, emoji) {
    try { client.post(`/messages/${item.id}/react`, { emoji }); } catch (_) {}
  }
}

/* ═══════════════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════════════ */
const s = StyleSheet.create({
  outerContainer: { flex: 1 },
  container: { flex: 1 },
  messagesArea: { flex: 1 },

  /* Header */
  topBar: { paddingBottom: 6, paddingHorizontal: SPACING.md, backgroundColor: COLORS.dynamicIsland, borderBottomWidth: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", shadowColor: COLORS.black, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12, zIndex: 50 },
  backBtn: { width: 32, height: 32, borderRadius: RADIUS.xl, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.glassLight, borderWidth: 1, borderColor: COLORS.borderLight },
  backText: { ...TYPOGRAPHY.h3, color: COLORS.text },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  avatarWrap: { width: 40, height: 40, alignItems: "center", justifyContent: "center", position: "relative" },
  avatarSmall: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primaryGlow, alignItems: "center", justifyContent: "center", borderWidth: 2.5, borderColor: COLORS.glassBorder },
  avatarSmallOnline: { borderColor: COLORS.success, shadowColor: COLORS.success, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 8, elevation: 6 },
  avatarText: { ...TYPOGRAPHY.bodyBold, color: COLORS.primaryLight },
  onlineRing: { position: "absolute", width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: COLORS.success },
  onlineDot: { position: "absolute", bottom: 0, right: 0, width: 11, height: 11, borderRadius: 5.5, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.bg, shadowColor: COLORS.success, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4, elevation: 4 },
  headerInfo: { flex: 1 },
  name: { ...TYPOGRAPHY.bodyBold, color: COLORS.text },
  statusText: { ...TYPOGRAPHY.small, marginTop: 1 },
  typingRow: { flexDirection: "row", alignItems: "center", gap: SPACING.xs, marginTop: 1 },
  typingText: { ...TYPOGRAPHY.smallBold, color: COLORS.primary },
  typingDotsInline: { flexDirection: "row", gap: 3, marginLeft: 2 },
  typingDotInline: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary },
  typingDotInlineAnim1: { opacity: 0.4 },
  typingDotInlineAnim2: { opacity: 0.7 },
  typingDotInlineAnim3: { opacity: 1 },
  headerActions: { flexDirection: "row", gap: SPACING.xxs },
  headerActionBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.glassLight, borderWidth: 1, borderColor: COLORS.borderLight },
  headerActionIcon: { fontSize: 16, color: COLORS.text },

  /* Menu */
  dropdownMenu: { position: "absolute", top: 56, right: 12, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: RADIUS.xl, padding: SPACING.xs, zIndex: 100, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 16, minWidth: 180, backdropFilter: "blur(20px)" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: SPACING.md, paddingVertical: 14, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.md },
  menuIcon: { fontSize: 18 },
  menuText: { ...TYPOGRAPHY.bodyBold, color: COLORS.text },

  /* Bars */
  editBar: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, paddingHorizontal: SPACING.md, paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  editBarContent: { flex: 1 },
  editBarLabel: { ...TYPOGRAPHY.captionBold, color: COLORS.primary },
  editBarText: { ...TYPOGRAPHY.caption, color: COLORS.muted },
  editBarClose: { padding: 6 },
  editBarCloseText: { fontSize: 18, color: COLORS.muted },

  replyBar: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, paddingHorizontal: SPACING.md, paddingVertical: 10, gap: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  replyBarAccent: { width: 3, height: 36, borderRadius: 1.5, backgroundColor: COLORS.primary },
  replyBarContent: { flex: 1 },
  replyBarName: { ...TYPOGRAPHY.captionBold, color: COLORS.primary },
  replyBarText: { ...TYPOGRAPHY.small, color: COLORS.muted, marginTop: 1 },
  replyBarClose: { fontSize: 18, color: COLORS.muted, padding: 6 },

  vanishBar: { backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.danger + "40", borderLeftWidth: 3, borderLeftColor: COLORS.danger },
  vanishBarText: { ...TYPOGRAPHY.captionBold, color: COLORS.danger, textAlign: "center" },

  /* Empty */
  emptyWrap: { alignItems: "center", paddingTop: SPACING.sm0 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: "center" },

  /* Scroll FAB */
  scrollFAB: { position: "absolute", right: 16, width: 40, height: 40, borderRadius: RADIUS.xxl, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8, zIndex: 30 },
  scrollFABIcon: { color: COLORS.white, fontSize: 20, fontWeight: "700" },

  /* Date Separator */
  dateSep: { flexDirection: "row", alignItems: "center", marginVertical: 14, gap: 10, paddingTop: 4, backgroundColor: "transparent" },
  dateSepLine: { flex: 1, height: 1, borderRadius: 0.5 },
  dateSepChip: { backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 5, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  dateSepText: { ...TYPOGRAPHY.captionBold, color: COLORS.muted },

  /* Unread Separator */
  unreadSep: { flexDirection: "row", alignItems: "center", marginVertical: 10, gap: 10 },
  unreadSepLine: { flex: 1, height: 1 },
  unreadBadge: { backgroundColor: COLORS.primary + "25", borderWidth: 1, borderColor: COLORS.primary + "40", borderRadius: 14, paddingHorizontal: SPACING.lg, paddingVertical: 5 },
  unreadBadgeText: { ...TYPOGRAPHY.captionBold, color: COLORS.primaryLight },

  /* Bubble */
  bubbleWrap: { marginBottom: 6, maxWidth: "78%", overflow: "visible" },
  bubbleWrapMine: { alignSelf: "flex-end" },
  bubbleWrapTheirs: { alignSelf: "flex-start" },
  bubblePending: { opacity: 0.6 },
  bubbleSelected: { backgroundColor: COLORS.primaryGlow, borderRadius: RADIUS.xl, padding: SPACING.xxs },

  replyPreview: { borderRadius: 14, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginBottom: SPACING.xs, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  replyPreviewMine: { borderLeftColor: COLORS.accent },
  replyPreviewTheirs: { borderLeftColor: COLORS.primary },
  replyName: { ...TYPOGRAPHY.captionBold, color: COLORS.primaryLight },
  replyText: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, marginTop: 1 },

  bubble: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: 22 },
  mine: { borderBottomRightRadius: 5 },
  mineGlow: { position: "absolute", inset: 0, borderRadius: 22, borderBottomRightRadius: 5 },
  mineReflect: { position: "absolute", top: 0, left: 0, right: 0, height: 28, borderRadius: 22, borderBottomRightRadius: 5 },
  theirs: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.glassBorder, borderBottomLeftRadius: 5, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 },
  bubblePendingBg: { opacity: 0.5 },
  bubbleText: { ...TYPOGRAPHY.body, color: COLORS.text, letterSpacing: 0.2 },
  bubbleTextMine: { color: COLORS.white, fontWeight: "500" },
  bubbleTextPending: { fontStyle: "italic", opacity: 0.6 },

  messageImage: { width: SCREEN_W * 0.6, height: SCREEN_W * 0.5, borderRadius: 18 },

  videoWrap: { width: SCREEN_W * 0.55, height: SCREEN_W * 0.4, position: "relative" },
  videoThumb: { width: "100%", height: "100%", borderRadius: 18 },
  playOverlay: { position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 18 },
  playOverlayIcon: { fontSize: 44, color: COLORS.white },

  docBubble: { minWidth: 200 },
  docRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: SPACING.xs },
  docIconWrap: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.primaryGlow, alignItems: "center", justifyContent: "center" },
  docIcon: { fontSize: 18 },
  docInfo: { flex: 1 },
  docName: { ...TYPOGRAPHY.bodyBold, color: COLORS.text },
  docSize: { ...TYPOGRAPHY.small, color: COLORS.muted, marginTop: 2 },
  docOpen: { fontSize: 18, color: COLORS.text, fontWeight: "700" },

  voiceBubble: { flexDirection: "row", alignItems: "center", gap: 10, minWidth: 180 },
  playBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.primaryGlow, alignItems: "center", justifyContent: "center" },
  playBtnMine: { backgroundColor: "rgba(255,255,255,0.25)" },
  playIcon: { fontSize: 13, color: COLORS.white },
  voiceDuration: { ...TYPOGRAPHY.small, color: "rgba(255,255,255,0.6)", minWidth: 32, textAlign: "right" },

  bubbleMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, paddingLeft: SPACING.xs },
  bubbleMetaMine: { justifyContent: "flex-end", paddingRight: 4 },
  editedLabel: { ...TYPOGRAPHY.small, color: COLORS.muted, fontStyle: "italic", fontSize: 10 },
  bubbleTime: { ...TYPOGRAPHY.small, color: COLORS.muted, fontSize: 10, lineHeight: 14 },
  bubbleTimeMine: { color: COLORS.muted },
  readIcon: { fontSize: 11, color: COLORS.muted },
  readIconBlue: { color: COLORS.success },

  /* Reactions */
  reactionsRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs, marginTop: 4 },
  reactionsRowMine: { justifyContent: "flex-end" },
  reactionChip: { backgroundColor: COLORS.glassLight, borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xxs },
  reactionEmoji: { fontSize: 13 },

  reactionsPicker: { flexDirection: "row", backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 28, padding: 6, gap: SPACING.xxs, marginTop: 6, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8, zIndex: 10 },
  reactionsPickerMine: { alignSelf: "flex-end" },
  reactionsPickerTheirs: { alignSelf: "flex-start" },
  reactionOption: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  reactionOptionText: { fontSize: 20 },

  reactAnimWrap: { position: "absolute", bottom: 0, zIndex: 20, alignItems: "center", justifyContent: "center" },
  reactAnimText: { fontSize: 60 },

  /* Typing */
  typingWrap: { flexDirection: "row", paddingHorizontal: SPACING.md, paddingVertical: 6 },
  typingBubble: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: RADIUS.xxl, paddingHorizontal: SPACING.md, paddingVertical: 10 },
  typingLabel: { ...TYPOGRAPHY.captionBold, color: COLORS.textSecondary },
  typingDots: { flexDirection: "row", gap: SPACING.xs },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.primary },

  /* Emoji picker */
  emojiPicker: { position: "absolute", left: 12, right: 12, flexDirection: "row", backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 28, padding: SPACING.sm, justifyContent: "center", gap: SPACING.xs, zIndex: 20, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 12 },
  emojiBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  emojiBtnText: { fontSize: 22 },

  /* Recording */
  recordingBarOuter: { paddingHorizontal: SPACING.md, paddingTop: 12, backgroundColor: COLORS.glass, borderTopWidth: 1, borderTopColor: COLORS.glassBorder },
  recordingBar: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.primary, borderRadius: 28, paddingHorizontal: SPACING.sm, paddingVertical: 10, gap: SPACING.sm },
  recDeleteBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primaryGlow, alignItems: "center", justifyContent: "center" },
  recDeleteIcon: { fontSize: 16, color: COLORS.white, fontWeight: "700" },
  recTimer: { ...TYPOGRAPHY.bodyBold, color: COLORS.white, minWidth: 40, textAlign: "center" },
  recSendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryGlow, alignItems: "center", justifyContent: "center" },
  recSendIcon: { color: COLORS.white, fontSize: 18, fontWeight: "700" },

  /* Input */
  inputRow: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 10, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: GLASS.default.borderColor, backgroundColor: GLASS.default.backgroundColor, gap: 6 },
  input: { flex: 1, minHeight: 40, maxHeight: 100, borderRadius: RADIUS.xxl, backgroundColor: COLORS.glassLight, borderWidth: 1, borderColor: COLORS.borderLight, paddingHorizontal: SPACING.md, ...TYPOGRAPHY.body, paddingVertical: 10, color: COLORS.text },
  inputActionsRight: { flexDirection: "row", gap: SPACING.xs, alignItems: "center" },
  inputActionBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.glassLight, borderWidth: 1, borderColor: COLORS.borderLight },
  inputActionIcon: { fontSize: 18, color: COLORS.textSecondary },
  sendBtnActive: { width: 40, height: 40, borderRadius: RADIUS.xxl, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  sendIcon: { color: COLORS.white, fontSize: 17 },

  /* Context Menu */
  ctxOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  ctxSheet: { backgroundColor: COLORS.glass, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: COLORS.glassBorder, paddingBottom: 32, paddingTop: SPACING.sm, paddingHorizontal: SPACING.xl },
  ctxHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.textTertiary, alignSelf: "center", marginBottom: SPACING.md },
  ctxBubblePreview: { borderRadius: RADIUS.xl, paddingHorizontal: 14, paddingVertical: 10, marginBottom: SPACING.md, backgroundColor: COLORS.glassLight, borderWidth: 1, borderColor: COLORS.borderLight },
  ctxBubbleMine: { backgroundColor: COLORS.primaryGlow, borderBottomRightRadius: 4 },
  ctxBubbleTheirs: { borderBottomLeftRadius: 4 },
  ctxBubbleText: { ...TYPOGRAPHY.body, color: COLORS.text },
  ctxEmojiRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: SPACING.md, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  ctxEmojiBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.glassLight, borderWidth: 1, borderColor: COLORS.borderLight },
  ctxEmojiText: { fontSize: 20 },
  ctxOptions: { gap: SPACING.xxs },
  ctxOption: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: SPACING.md, borderRadius: RADIUS.lg },
  ctxOptionIcon: { fontSize: 18, width: 24, textAlign: "center" },
  ctxOptionLabel: { ...TYPOGRAPHY.bodyBold, color: COLORS.text },
  ctxOptionDanger: { backgroundColor: COLORS.danger + "15" },
  ctxOptionDangerText: { color: COLORS.danger },

  /* Sticker */
  stickerText: { fontSize: 64, lineHeight: 72 },
  stickerModal: { backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingBottom: 24, maxHeight: "60%" },
  stickerHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.textTertiary, alignSelf: "center", marginBottom: 8 },
  stickerTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, textAlign: "center", marginBottom: SPACING.md },
  stickerCategories: { paddingHorizontal: SPACING.md, marginBottom: SPACING.md },
  stickerCatBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.xxl, backgroundColor: COLORS.glassLight, borderWidth: 1, borderColor: COLORS.borderLight, marginRight: 8 },
  stickerCatBtnActive: { backgroundColor: COLORS.primary },
  stickerCatText: { ...TYPOGRAPHY.captionBold, color: COLORS.textSecondary },
  stickerCatTextActive: { color: COLORS.white },
  stickerGrid: { paddingHorizontal: SPACING.sm },
  stickerItem: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: SPACING.md, minWidth: "20%" },
  stickerItemText: { fontSize: 36 },

  /* Attachment Sheet */
  attachOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.7)" },
  attachSheet: { backgroundColor: COLORS.glass, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: COLORS.glassBorder, paddingBottom: 40, paddingTop: SPACING.sm, paddingHorizontal: SPACING.xl },
  attachHandle: { width: 40, height: 5, borderRadius: 2.5, backgroundColor: COLORS.textTertiary, alignSelf: "center", marginBottom: 16 },
  attachTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, textAlign: "center", marginBottom: 20 },
  attachGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: SPACING.lg },
  attachCard: { alignItems: "center", gap: SPACING.sm, width: 90 },
  attachCardIcon: { width: 64, height: 64, borderRadius: RADIUS.xxl, overflow: "hidden", alignItems: "center", justifyContent: "center", shadowColor: COLORS.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  attachCardGradient: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  attachCardEmoji: { fontSize: 28 },
  attachCardLabel: { ...TYPOGRAPHY.captionBold, color: COLORS.textSecondary },

  /* Modals */
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  vanishModal: { backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: RADIUS.xxl, padding: SPACING.xxl, width: "80%", alignItems: "center" },
  vanishModalTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: 16 },
  vanishOption: { width: "100%", paddingVertical: 14, borderRadius: RADIUS.md, alignItems: "center", marginBottom: SPACING.xs, backgroundColor: COLORS.glassLight, borderWidth: 1, borderColor: COLORS.borderLight },
  vanishOptionActive: { backgroundColor: COLORS.primary },
  vanishOptionText: { ...TYPOGRAPHY.bodyBold, color: COLORS.text },
  vanishOffBtn: { marginTop: 12, paddingVertical: 10 },
  vanishOffText: { ...TYPOGRAPHY.bodyBold, color: COLORS.danger },

  forwardModal: { backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: RADIUS.xxl, padding: SPACING.xl, width: "85%", maxHeight: "60%" },
  forwardTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: 16, textAlign: "center" },
  forwardRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  forwardAvatar: { width: 40, height: 40, borderRadius: RADIUS.xxl, backgroundColor: COLORS.primaryGlow, alignItems: "center", justifyContent: "center" },
  forwardAvatarText: { ...TYPOGRAPHY.bodyBold, color: COLORS.primary },
  forwardName: { ...TYPOGRAPHY.bodyBold, color: COLORS.text },
  forwardCancel: { marginTop: 12, paddingVertical: 10, alignItems: "center" },
  forwardCancelText: { ...TYPOGRAPHY.bodyBold, color: COLORS.muted },

  infoModal: { backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: RADIUS.xxl, padding: SPACING.xxl, width: "82%" },
  infoTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: 16, textAlign: "center" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  infoLabel: { ...TYPOGRAPHY.caption, color: COLORS.muted },
  infoValue: { ...TYPOGRAPHY.captionBold, color: COLORS.text, flex: 1, textAlign: "right" },
  infoClose: { marginTop: 16, paddingVertical: SPACING.md, alignItems: "center", backgroundColor: COLORS.primary, borderRadius: RADIUS.md },
  infoCloseText: { ...TYPOGRAPHY.bodyBold, color: COLORS.white },

  /* Image Viewer */
  imageViewerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" },
  imageViewerImage: { width: "100%", height: "80%" },
});
