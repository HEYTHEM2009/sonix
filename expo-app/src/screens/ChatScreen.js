import { useState, useEffect, useLayoutEffect, useCallback, useRef, memo } from "react";
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
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { COLORS, SIZES, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS } from "../design/DesignSystem";
import Screen3D from "../components/3D/Screen3D";
import AudioWaveform from "../components/AudioWaveform";
import VideoBubble from "../components/chat/VideoBubble";
import VoiceRecorder from "../components/chat/VoiceRecorder";
import MediaProgress from "../components/chat/MediaProgress";
import { pickDocument, isDocument, formatBytes } from "../utils/media";
import { validateMessage, floodGuard } from "../utils/validation";
import { cacheDraft, getDraft } from "../api/cache";
import ConnectionBanner from "../components/chat/ConnectionBanner";
import MessageSearchBar from "../components/chat/MessageSearchBar";
import DraftIndicator from "../components/chat/DraftIndicator";
import BulkActionBar from "../components/chat/BulkActionBar";

const { width: SCREEN_W } = Dimensions.get("window");
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
  { key: "reply", icon: "↩", labelKey: "reply" },
  { key: "forward", icon: "↪", labelKey: "forward" },
  { key: "copy", icon: "📋", labelKey: "copyMessage" },
  { key: "sticker", icon: "🎨", labelKey: "addSticker" },
  { key: "info", icon: "ℹ️", labelKey: "messageInfo" },
  { key: "delete", icon: "🗑️", labelKey: "deleteForYou", danger: true },
  { key: "unsend", icon: "🚫", labelKey: "unsend", danger: true },
];

const MESSAGE_OPTIONS_MINE = [
  { key: "reply", icon: "↩", labelKey: "reply" },
  { key: "forward", icon: "↪", labelKey: "forward" },
  { key: "copy", icon: "📋", labelKey: "copyMessage" },
  { key: "edit", icon: "✏️", labelKey: "edit" },
  { key: "sticker", icon: "🎨", labelKey: "addSticker" },
  { key: "info", icon: "ℹ️", labelKey: "messageInfo" },
  { key: "pin", icon: "📌", labelKey: "pin" },
  { key: "delete", icon: "🗑️", labelKey: "deleteForYou", danger: true },
  { key: "unsend", icon: "🚫", labelKey: "unsend", danger: true },
];

const STICKER_PACKS = [
  { id: "popular", name: "Popular", stickers: ["😂", "❤️", "🔥", "👍", "😭", "😍", "🥰", "😘", "😎", "🙏", "💀", "✨", "🎉", "💯", "🫡", "🤡", "😈", "🥳", "😍", "🤩"] },
  { id: "reactions", name: "Reactions", stickers: ["😍", "🤩", "🥰", "😘", "😭", "😤", "🥺", "😱", "🤔", "🫣", "🤣", "😇", "🥳", "😴", "🤗", "🫡", "😏", "🙄", "😬", "🤥"] },
  { id: "greetings", name: "Hi", stickers: ["👋", "🤙", "✌️", "🫶", "👐", "🤝", "💪", "🫡", "🙋", "🙇", "👀", "💅", "🫰", "🤌", "👆", "👉", "✊", "🙏", "💪", "🤲"] },
  { id: "love", name: "Love", stickers: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "♥️", "🫶", "😍"] },
  { id: "animals", name: "Animals", stickers: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆"] },
  { id: "food", name: "Food", stickers: ["🍕", "🍔", "🍟", "🌭", "🍿", "🧂", "🥓", "🥚", "🍳", "🥞", "🧇", "🥩", "🍗", "🍖", "🌮", "🌯", "🫔", "🥙", "🧆", "🥗"] },
];

/* ─── Date Separator ────────────────────────────────── */
const DateSeparator = memo(function DateSeparator({ date }) {
  const { t } = useLanguage();
  const d = new Date(date);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  let label;
  if (d.toDateString() === now.toDateString()) label = t("today");
  else if (d.toDateString() === yesterday.toDateString()) label = t("yesterday");
  else label = d.toLocaleDateString(I18nManager.isRTL ? "ar" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  return (
    <View style={s.dateSep}>
      <View style={s.dateSepLine} />
      <Text style={s.dateSepText}>{label}</Text>
      <View style={s.dateSepLine} />
    </View>
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
  item, isMine, onLongPress, onDoubleTap, onImagePress, onImageLongPress, currentUserId, selected,
}) => {
  const { t } = useLanguage();
  const [showReactions, setShowReactions] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
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
      const uri = resolveUrl(item.voice);
      const player = createAudioPlayer(uri);
      if (soundRef.current) { try { soundRef.current.release(); } catch (_) {} }
      soundRef.current = player;
      player.addListener("playbackStatusUpdate", (status) => {
        if (status.didJustFinish) { setPlaying(false); setPosition(0); }
        else { setPosition(Math.floor((status.currentTime || 0) * 1000)); setDuration(Math.floor((status.duration || 0) * 1000)); }
      });
      player.play();
      setPlaying(true);
    } catch (e) { console.warn("Voice play error", e); }
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
          onLongPress={() => { if (onImageLongPress) onImageLongPress(item); }}
          onPress={() => { if (onImagePress) onImagePress(item); }}
          activeOpacity={0.8}
        >
          <Image source={{ uri: resolveUrl(item.image) }} style={s.messageImage} resizeMode="cover" />
        </TouchableOpacity>
      ) : isVoice ? (
        <TouchableOpacity onLongPress={handleLongPress} onPress={toggleVoice} activeOpacity={0.8} style={[s.bubble, isMine ? s.mine : s.theirs, s.voiceBubble]}>
          <TouchableOpacity onPress={toggleVoice} style={[s.playBtn, isMine && s.playBtnMine]}>
            <Text style={s.playIcon}>{playing ? "⏸" : "▶"}</Text>
          </TouchableOpacity>
          <AudioWaveform playing={playing} width={110} height={24} color={isMine ? "#fff" : COLORS.primary} />
          <Text style={[s.voiceDuration, isMine && { color: "#ffffffaa" }]}>{formatMs(playing ? position : duration)}</Text>
        </TouchableOpacity>
      ) : isVideo ? (
        <View style={[s.bubble, isMine ? s.mine : s.theirs, { padding: 0, overflow: "hidden" }]}>
          <VideoBubble uri={resolveUrl(item.video)} isMine={isMine} />
        </View>
       ) : isDocument ? (
        <TouchableOpacity onLongPress={handleLongPress} onPress={() => { const url = resolveUrl(item.document || item.file_url); if (url) Linking.openURL(url).catch(() => {}); }} activeOpacity={0.8} style={[s.bubble, isMine ? s.mine : s.theirs, s.docBubble]}>
          <View style={s.docRow}>
            <View style={s.docIconWrap}>
              <Text style={s.docIcon}>📎</Text>
            </View>
            <View style={s.docInfo}>
              <Text style={[s.docName, isMine && { color: "#fff" }]} numberOfLines={1}>{item.file_name || t("document")}</Text>
              {item.file_size ? <Text style={[s.docSize, isMine && { color: "#ffffffaa" }]}>{formatBytes(item.file_size)}</Text> : null}
            </View>
            <Text style={[s.docOpen, isMine && { color: "#fff" }]}>↗</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onLongPress={handleLongPress} onPress={handleTap} activeOpacity={0.8} style={[s.bubble, isMine ? s.mine : s.theirs, item.pending && s.bubblePendingBg]}>
          <Text style={[s.bubbleText, isMine && s.bubbleTextMine, item.pending && s.bubbleTextPending]}>{item.content}</Text>
        </TouchableOpacity>
      )}

      <View style={[s.bubbleMeta, isMine && s.bubbleMetaMine]}>
        {item.is_edited && <Text style={[s.editedLabel, isMine && { color: "#ffffff88" }]}>{t("edited")}</Text>}
        <Text style={[s.bubbleTime, isMine && s.bubbleTimeMine]}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
        {isMine && !item.pending && (
          <Text style={[s.readIcon, item.is_read ? s.readIconBlue : null]}>
            {item.is_read ? "✓✓" : "✓"}
          </Text>
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
                voice: event.voice, video: event.video, sender_id: event.sender_id,
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
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...(res.data || {}), pending: false } : m));
      await load();
    } catch (e) {
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

  const reactAnimTimer = useRef(null);
  const handleDoubleTap = async (item) => {
    if (item.pending) return;
    clearTimeout(reactAnimTimer.current);
    setReactAnim({ id: item.id, emoji: "❤️" });
    try { await client.post(`/messages/${item.id}/react`, { emoji: "❤️" }); } catch (_) {}
    reactAnimTimer.current = setTimeout(() => setReactAnim(null), 1000);
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
  messages.forEach((m) => {
    const d = new Date(m.created_at).toDateString();
    if (d !== lastDate) { groupedMessages.push({ type: "date", date: m.created_at, key: `date_${d}` }); lastDate = d; }
    groupedMessages.push({ ...m, key: String(m.id) });
  });

  const hasText = text.trim().length > 0;

  /* ─── Task 9: list data (search overrides normal grouping) ─── */
  const listData = (searchOpen && searchQuery.trim())
    ? searchResults.map((m) => ({ ...m, key: String(m.id) }))
    : groupedMessages;

  return (
    <View style={s.outerContainer}>
      <Screen3D>
        <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : "padding"} keyboardVerticalOffset={0}>
          {/* ─── Header ─────────────────────────────────── */}
          <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Text style={s.backText}>←</Text>
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <TouchableOpacity onPress={() => {
                if (userId === user?.id) navigation.navigate("Home", { screen: "Profile" });
                else navigation.navigate("UserProfile", { userId, username });
              }}>
                <View style={s.avatarSmall}>
                  <Text style={s.avatarText}>{username?.[0]?.toUpperCase() || "?"}</Text>
                  {isOnline && <View style={s.onlineDot} />}
                </View>
              </TouchableOpacity>
              <View>
                <Text style={s.name}>{username}</Text>
                <Text style={[s.statusText, { color: isOnline ? "#00d26a" : COLORS.muted }]}>
                  {isOnline ? t("online") : t("offline")}
                  {vanishMode ? " · 🔥" : ""}
                </Text>
              </View>
            </View>
            <View style={s.headerActions}>
              <TouchableOpacity style={s.headerActionBtn} onPress={() => Alert.alert(t("voiceCall") || "Voice Call")}>
                <Text style={s.headerActionIcon}>📞</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.headerActionBtn} onPress={() => Alert.alert(t("videoCall") || "Video Call")}>
                <Text style={s.headerActionIcon}>📹</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.headerActionBtn} onPress={() => setShowMenu(!showMenu)}>
                <Text style={s.headerActionIcon}>ℹ️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.headerActionBtn} onPress={() => setSearchOpen((p) => !p)}>
                <Text style={s.headerActionIcon}>🔍</Text>
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
            <View style={s.dropdownMenu}>
              <TouchableOpacity style={s.menuItem} onPress={() => { setShowMenu(false); setShowVanishPicker(true); }}>
                <Text style={s.menuIcon}>🔥</Text>
                <Text style={s.menuText}>{t("vanishMode")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.menuItem} onPress={() => { setShowMenu(false); client.post(`/messages/mute/${userId}`).then(() => Alert.alert(t("success"))); }}>
                <Text style={s.menuIcon}>🔕</Text>
                <Text style={s.menuText}>{t("mute")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.menuItem} onPress={() => { setShowMenu(false); client.post(`/messages/pin/${userId}`).then(() => Alert.alert(t("success"))); }}>
                <Text style={s.menuIcon}>📌</Text>
                <Text style={s.menuText}>{t("pin")}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ─── Edit Bar ────────────────────────────────── */}
          {editingMsg && (
            <View style={s.editBar}>
              <View style={s.editBarContent}>
                <Text style={s.editBarLabel}>✏️ {t("editMessage")}</Text>
                <Text style={s.editBarText} numberOfLines={1}>{editingMsg.content}</Text>
              </View>
              <TouchableOpacity onPress={cancelEdit} style={s.editBarClose}>
                <Text style={s.editBarCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ─── Reply Bar ───────────────────────────────── */}
          {replyTo && !editingMsg && (
            <View style={s.replyBar}>
              <View style={s.replyBarAccent} />
              <View style={s.replyBarContent}>
                <Text style={s.replyBarName}>{replyTo.sender?.username || t("message")}</Text>
                <Text style={s.replyBarText} numberOfLines={1}>{replyTo.content || "📎"}</Text>
              </View>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Text style={s.replyBarClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ─── Vanish Timer Bar ────────────────────────── */}
          {vanishMode && (
            <View style={s.vanishBar}>
              <Text style={s.vanishBarText}>🔥 {t("vanishTimer")}: {vanishSeconds}s</Text>
            </View>
          )}

          {/* ─── Messages ────────────────────────────────── */}
          <FlatList
            ref={flatListRef}
            data={listData}
            keyExtractor={(m) => m.key}
            contentContainerStyle={{ padding: 12, paddingBottom: Math.max(insets.bottom + 60, 70) }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={searching ? <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 10 }} /> : (loadingMore ? <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 10 }} /> : null)}
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <Text style={s.emptyIcon}>💬</Text>
                <Text style={s.emptyText}>{searchOpen && searchQuery.trim() ? t("noResults") : t("startConvWith").replace("{username}", username)}</Text>
              </View>
            }
            renderItem={({ item }) => {
              if (item.type === "date") return <DateSeparator date={item.date} />;
              const mine = item.sender_id === user?.id;
              const selected = selectedIds.has(item.id);
              return (
                <View>
                  <TouchableOpacity
                    activeOpacity={bulkMode ? 1 : 0.9}
                    onLongPress={() => {
                      if (!bulkMode) { setBulkMode(true); toggleSelect(item); }
                      else toggleSelect(item);
                    }}
                    onPress={() => { if (bulkMode) toggleSelect(item); }}
                    disabled={bulkMode && item.pending}
                  >
                    <MessageBubble
                      item={item}
                      isMine={mine}
                      currentUserId={user?.id}
                      selected={selected}
                      onDoubleTap={bulkMode ? undefined : handleDoubleTap}
                      onImagePress={(msg) => bulkMode ? toggleSelect(msg) : setViewImage(msg.image)}
                      onImageLongPress={(msg) => {
                        if (bulkMode) return;
                        Alert.alert(t("image"), null, [
                          { text: t("downloadImage"), onPress: () => {
                            if (Platform.OS === "web") window.open(resolveUrl(msg.image), "_blank");
                            else Share.share({ url: resolveUrl(msg.image) });
                          }},
                          { text: t("cancel"), style: "cancel" },
                        ]);
                      }}
                      onLongPress={(msg) => { if (!bulkMode) setContextMenu(msg); else toggleSelect(msg); }}
                    />
                  </TouchableOpacity>
                  {reactAnim?.id === item.id && !bulkMode && (
                    <View style={[s.reactAnimWrap, mine ? { right: 20 } : { left: 20 }]}>
                      <Text style={s.reactAnimText}>{reactAnim.emoji}</Text>
                    </View>
                  )}
                </View>
              );
            }}
          />

          {remoteTyping && <TypingIndicator username={username} />}

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
              <TouchableOpacity style={s.inputActionBtn} onPress={() => {
                Alert.alert("", t("attach"), [
                  { text: t("photo") || "Photo", onPress: () => sendMedia("image") },
                  { text: t("video") || "Video", onPress: () => sendMedia("video") },
                  { text: t("document") || "Document", onPress: () => sendDocument() },
                  { text: t("cancel"), style: "cancel" },
                ]);
              }}>
                <Text style={s.inputActionIcon}>📷</Text>
                <MediaProgress progress={uploadProgress} visible={uploading} />
              </TouchableOpacity>

              <TextInput
                style={s.input}
                value={text}
                onChangeText={handleTextChange}
                placeholder={editingMsg ? t("editMessage") : t("message") + "..."}
                placeholderTextColor={COLORS.muted}
                returnKeyType="send"
                onSubmitEditing={send}
                multiline
                maxLength={5000}
                editable={!bulkMode}
              />
              {!bulkMode && <DraftIndicator visible={draftSaved} />}

              {hasText || editingMsg ? (
                <TouchableOpacity style={[s.sendBtn, s.sendBtnActive]} onPress={send} disabled={sending}>
                  {sending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.sendIcon}>➤</Text>}
                </TouchableOpacity>
              ) : (
                <View style={s.inputActionsRight}>
                  <TouchableOpacity style={s.inputActionBtn} onPress={() => setShowEmojiPicker((p) => !p)}>
                    <Text style={s.inputActionIcon}>😊</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.inputActionBtn} onPressIn={openVoiceRecorder}>
                    <Text style={s.inputActionIcon}>🎤</Text>
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
          <Modal visible={!!contextMenu} transparent animationType="fade" onRequestClose={() => setContextMenu(null)}>
            <TouchableOpacity style={s.ctxOverlay} activeOpacity={1} onPress={() => setContextMenu(null)}>
              {contextMenu && (
                <View style={s.ctxModal}>
                  <View style={s.ctxHandle} />
                  <View style={[s.ctxBubblePreview, contextMenu.sender_id === user?.id ? s.ctxBubbleMine : s.ctxBubbleTheirs]}>
                    <Text style={[s.ctxBubbleText, contextMenu.sender_id === user?.id && { color: "#fff" }]} numberOfLines={3}>{contextMenu.content || "📎"}</Text>
                  </View>
                  <View style={s.ctxEmojiRow}>
                    {EMOJI_LIST.map((emoji) => (
                      <TouchableOpacity key={emoji} style={s.ctxEmojiBtn} onPress={() => { setContextMenu(null); handleReaction(contextMenu, emoji); }}>
                        <Text style={s.ctxEmojiText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={s.ctxOptions}>
                    {(contextMenu.sender_id === user?.id ? MESSAGE_OPTIONS_MINE : MESSAGE_OPTIONS).map((opt) => (
                      <TouchableOpacity key={opt.key} style={[s.ctxOption, opt.danger && s.ctxOptionDanger]} onPress={() => handleContextMenu(opt.key, contextMenu)}>
                        <Text style={[s.ctxOptionIcon, opt.danger && s.ctxOptionDangerText]}>{opt.icon}</Text>
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
                    <Text style={[s.vanishOptionText, vanishSeconds === opt.seconds && { color: "#fff" }]}>{opt.label}</Text>
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

  /* Header */
  topBar: { paddingBottom: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: GLASS.default.borderColor, backgroundColor: GLASS.default.backgroundColor, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: GLASS.default.backgroundColor, borderWidth: 1, borderColor: GLASS.default.borderColor },
  backText: { fontSize: 22, color: COLORS.text },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  avatarSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryGlow, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: GLASS.default.borderColor },
  avatarText: { color: COLORS.primary, fontWeight: "700", fontSize: 16 },
  onlineDot: { position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: "#00d26a", borderWidth: 2, borderColor: "#0d0d1a" },
  name: { ...TYPOGRAPHY.bodyBold, color: COLORS.text },
  statusText: { ...TYPOGRAPHY.caption, marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 2 },
  headerActionBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: GLASS.default.backgroundColor, borderWidth: 1, borderColor: GLASS.default.borderColor },
  headerActionIcon: { fontSize: 18 },

  /* Menu */
  dropdownMenu: { position: "absolute", top: 100, right: 12, ...GLASS.default, borderRadius: RADIUS.lg, padding: SPACING.xs, zIndex: 100, ...SHADOWS.glass, elevation: 12, minWidth: 180 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: RADIUS.md },
  menuIcon: { fontSize: 18 },
  menuText: { ...TYPOGRAPHY.bodyBold, color: COLORS.text },

  /* Bars */
  editBar: { flexDirection: "row", alignItems: "center", ...GLASS.default, paddingHorizontal: SPACING.md, paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: GLASS.default.borderColor },
  editBarContent: { flex: 1 },
  editBarLabel: { ...TYPOGRAPHY.caption, fontWeight: "600", color: COLORS.primary },
  editBarText: { ...TYPOGRAPHY.caption, color: COLORS.muted },
  editBarClose: { padding: 6 },
  editBarCloseText: { fontSize: 18, color: COLORS.muted },

  replyBar: { flexDirection: "row", alignItems: "center", ...GLASS.default, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: GLASS.default.borderColor },
  replyBarAccent: { width: 3, height: 36, borderRadius: 1.5, backgroundColor: COLORS.primary },
  replyBarContent: { flex: 1 },
  replyBarName: { ...TYPOGRAPHY.caption, fontWeight: "700", color: COLORS.primary },
  replyBarText: { ...TYPOGRAPHY.small, color: COLORS.muted, marginTop: 1 },
  replyBarClose: { fontSize: 18, color: COLORS.muted, padding: 6 },

  vanishBar: { ...GLASS.default, backgroundColor: GLASS.default.backgroundColor, paddingHorizontal: SPACING.md, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.danger + "40", borderLeftWidth: 3, borderLeftColor: COLORS.danger },
  vanishBarText: { ...TYPOGRAPHY.caption, color: COLORS.danger, fontWeight: "600", textAlign: "center" },

  /* Empty */
  emptyWrap: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: { ...TYPOGRAPHY.body, color: COLORS.muted, textAlign: "center" },

  /* Date Separator */
  dateSep: { flexDirection: "row", alignItems: "center", marginVertical: 16, gap: 10 },
  dateSepLine: { flex: 1, height: 1, backgroundColor: GLASS.default.borderColor },
  dateSepText: { ...TYPOGRAPHY.caption, color: COLORS.muted, fontWeight: "600" },

  /* Bubble */
  bubbleWrap: { marginBottom: 4, maxWidth: "78%", overflow: "visible" },
  bubbleWrapMine: { alignSelf: "flex-end" },
  bubbleWrapTheirs: { alignSelf: "flex-start" },
  bubblePending: { opacity: 0.6 },
  bubbleSelected: { backgroundColor: COLORS.primaryGlow, borderRadius: 16, padding: 2 },

  replyPreview: { ...GLASS.default, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 3, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  replyPreviewMine: { borderLeftColor: COLORS.accent },
  replyPreviewTheirs: { borderLeftColor: COLORS.primary },
  replyName: { ...TYPOGRAPHY.caption, fontWeight: "700", color: COLORS.primary },
  replyText: { ...TYPOGRAPHY.small, color: COLORS.muted, marginTop: 1 },

  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  mine: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  theirs: { ...GLASS.default, backgroundColor: GLASS.default.backgroundColor, borderBottomLeftRadius: 4 },
  bubblePendingBg: { backgroundColor: COLORS.primary + "99" },
  bubbleText: { fontSize: 14, lineHeight: 21, color: COLORS.text },
  bubbleTextMine: { color: "#fff" },
  bubbleTextPending: { fontStyle: "italic" },

  messageImage: { width: SCREEN_W * 0.6, height: SCREEN_W * 0.5, borderRadius: 18 },

  videoWrap: { width: SCREEN_W * 0.55, height: SCREEN_W * 0.4, position: "relative" },
  videoThumb: { width: "100%", height: "100%", borderRadius: 18 },
  playOverlay: { position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 18 },
  playOverlayIcon: { fontSize: 44, color: "#fff" },

  docBubble: { minWidth: 200, ...GLASS.default, backgroundColor: GLASS.default.backgroundColor },
  docRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  docIconWrap: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.primaryGlow, alignItems: "center", justifyContent: "center" },
  docIcon: { fontSize: 18 },
  docInfo: { flex: 1 },
  docName: { ...TYPOGRAPHY.bodyBold, color: COLORS.text },
  docSize: { ...TYPOGRAPHY.small, color: COLORS.muted, marginTop: 2 },
  docOpen: { fontSize: 18, color: COLORS.text, fontWeight: "700" },

  voiceBubble: { flexDirection: "row", alignItems: "center", gap: 10, minWidth: 180 },
  playBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.primaryGlow, alignItems: "center", justifyContent: "center" },
  playBtnMine: { backgroundColor: "rgba(255,255,255,0.25)" },
  playIcon: { fontSize: 13, color: "#fff" },
  voiceDuration: { fontSize: 11, color: "rgba(255,255,255,0.6)", minWidth: 32, textAlign: "right" },

  bubbleMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3, paddingLeft: 4 },
  bubbleMetaMine: { justifyContent: "flex-end", paddingRight: 4 },
  editedLabel: { ...TYPOGRAPHY.small, color: COLORS.muted, fontStyle: "italic" },
  bubbleTime: { ...TYPOGRAPHY.small, color: COLORS.muted },
  bubbleTimeMine: { color: COLORS.muted },
  readIcon: { fontSize: 11, color: COLORS.muted },
  readIconBlue: { color: "#00d26a" },

  /* Reactions */
  reactionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  reactionsRowMine: { justifyContent: "flex-end" },
  reactionChip: { ...GLASS.default, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  reactionEmoji: { fontSize: 13 },

  reactionsPicker: { flexDirection: "row", ...GLASS.default, borderRadius: 28, padding: 6, gap: 2, marginTop: 6, ...SHADOWS.glass, elevation: 8, zIndex: 10 },
  reactionsPickerMine: { alignSelf: "flex-end" },
  reactionsPickerTheirs: { alignSelf: "flex-start" },
  reactionOption: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  reactionOptionText: { fontSize: 20 },

  reactAnimWrap: { position: "absolute", bottom: 0, zIndex: 20, alignItems: "center", justifyContent: "center" },
  reactAnimText: { fontSize: 60 },

  /* Typing */
  typingWrap: { flexDirection: "row", paddingHorizontal: SPACING.md, paddingVertical: 6 },
  typingBubble: { ...GLASS.default, borderRadius: 20, paddingHorizontal: SPACING.md, paddingVertical: 10 },
  typingDots: { flexDirection: "row", gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.primary },

  /* Emoji picker */
  emojiPicker: { position: "absolute", left: 12, right: 12, flexDirection: "row", ...GLASS.default, borderRadius: 28, padding: 8, justifyContent: "center", gap: 4, zIndex: 20 },
  emojiBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  emojiBtnText: { fontSize: 22 },

  /* Recording */
  recordingBarOuter: { paddingHorizontal: 12, paddingTop: 12, ...GLASS.default, borderTopWidth: 1, borderTopColor: GLASS.default.borderColor },
  recordingBar: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.primary, borderRadius: 28, paddingHorizontal: 8, paddingVertical: 10, gap: 8 },
  recDeleteBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primaryGlow, alignItems: "center", justifyContent: "center" },
  recDeleteIcon: { fontSize: 16, color: "#fff", fontWeight: "700" },
  recTimer: { ...TYPOGRAPHY.bodyBold, color: "#fff", minWidth: 40, textAlign: "center" },
  recSendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryGlow, alignItems: "center", justifyContent: "center" },
  recSendIcon: { color: "#fff", fontSize: 18, fontWeight: "700" },

  /* Input */
  inputRow: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: GLASS.default.borderColor, ...GLASS.default, gap: 6 },
  input: { flex: 1, minHeight: 38, maxHeight: 100, borderRadius: 20, ...GLASS.default, paddingHorizontal: SPACING.md, ...TYPOGRAPHY.body, paddingVertical: 9 },
  inputActionsRight: { flexDirection: "row", gap: 4, alignItems: "center" },
  inputActionBtn: { width: 38, height: 38, borderRadius: 19, ...GLASS.default, alignItems: "center", justifyContent: "center" },
  inputActionIcon: { fontSize: 18 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, ...GLASS.default, alignItems: "center", justifyContent: "center" },
  sendBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sendIcon: { color: "#fff", fontSize: 16 },

  /* Context Menu */
  ctxOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  ctxModal: { ...GLASS.default, borderRadius: 20, width: "100%", padding: SPACING.md },
  ctxHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.textTertiary, alignSelf: "center", marginBottom: 12 },
  ctxBubblePreview: { ...GLASS.default, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  ctxBubbleMine: { backgroundColor: COLORS.primaryGlow, borderBottomRightRadius: 4 },
  ctxBubbleTheirs: { ...GLASS.default, borderBottomLeftRadius: 4 },
  ctxBubbleText: { ...TYPOGRAPHY.body, color: COLORS.text, lineHeight: 19 },
  ctxEmojiRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: GLASS.default.borderColor },
  ctxEmojiBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", ...GLASS.default },
  ctxEmojiText: { fontSize: 20 },
  ctxOptions: { gap: 2 },
  ctxOption: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 13, paddingHorizontal: 8, borderRadius: 10 },
  ctxOptionIcon: { fontSize: 18, width: 24, textAlign: "center" },
  ctxOptionLabel: { ...TYPOGRAPHY.body, color: COLORS.text, fontWeight: "500" },
  ctxOptionDanger: { backgroundColor: COLORS.danger + "15" },
  ctxOptionDangerText: { color: COLORS.danger },

  /* Sticker */
  stickerText: { fontSize: 64, lineHeight: 72 },
  stickerModal: { ...GLASS.default, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingBottom: 24, maxHeight: "60%" },
  stickerHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.textTertiary, alignSelf: "center", marginBottom: 8 },
  stickerTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, textAlign: "center", marginBottom: 12 },
  stickerCategories: { paddingHorizontal: 12, marginBottom: 12 },
  stickerCatBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, ...GLASS.default, marginRight: 8 },
  stickerCatBtnActive: { backgroundColor: COLORS.primary },
  stickerCatText: { ...TYPOGRAPHY.caption, fontWeight: "600", color: COLORS.muted },
  stickerCatTextActive: { color: "#fff" },
  stickerGrid: { paddingHorizontal: 8 },
  stickerItem: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12, minWidth: "20%" },
  stickerItemText: { fontSize: 36 },

  /* Modals */
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  vanishModal: { ...GLASS.default, borderRadius: 20, padding: 24, width: "80%", alignItems: "center" },
  vanishModalTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: 16 },
  vanishOption: { width: "100%", paddingVertical: 14, borderRadius: RADIUS.md, alignItems: "center", marginBottom: 4, ...GLASS.default },
  vanishOptionActive: { backgroundColor: COLORS.primary },
  vanishOptionText: { ...TYPOGRAPHY.bodyBold, color: COLORS.text },
  vanishOffBtn: { marginTop: 12, paddingVertical: 10 },
  vanishOffText: { ...TYPOGRAPHY.body, color: COLORS.danger, fontWeight: "600" },

  forwardModal: { ...GLASS.default, borderRadius: 20, padding: 20, width: "85%", maxHeight: "60%" },
  forwardTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: 16, textAlign: "center" },
  forwardRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: GLASS.default.borderColor },
  forwardAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryGlow, alignItems: "center", justifyContent: "center" },
  forwardAvatarText: { color: COLORS.primary, fontWeight: "700", fontSize: 16 },
  forwardName: { ...TYPOGRAPHY.bodyBold, color: COLORS.text },
  forwardCancel: { marginTop: 12, paddingVertical: 10, alignItems: "center" },
  forwardCancelText: { ...TYPOGRAPHY.body, color: COLORS.muted, fontWeight: "600" },

  infoModal: { ...GLASS.default, borderRadius: 20, padding: 24, width: "82%" },
  infoTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: 16, textAlign: "center" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: GLASS.default.borderColor },
  infoLabel: { ...TYPOGRAPHY.caption, color: COLORS.muted },
  infoValue: { ...TYPOGRAPHY.caption, color: COLORS.text, fontWeight: "500", flex: 1, textAlign: "right" },
  infoClose: { marginTop: 16, paddingVertical: 12, alignItems: "center", backgroundColor: COLORS.primary, borderRadius: RADIUS.md },
  infoCloseText: { ...TYPOGRAPHY.bodyBold, color: "#fff" },

  /* Image Viewer */
  imageViewerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" },
  imageViewerImage: { width: "100%", height: "80%" },
});
