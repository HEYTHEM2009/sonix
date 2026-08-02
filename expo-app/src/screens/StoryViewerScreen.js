import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, StatusBar, FlatList, Modal, TextInput, ActivityIndicator, Animated, Alert, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import client, { resolveUrl } from "../api/client";
import { COLORS, SIZES, FONTS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS, LAYOUT } from "../design/DesignSystem";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { prefetchNextStories, clearPrefetchCache } from "../api/media";
import Icon from "../design/ui/Icon";

const { width, height } = Dimensions.get("window");

const REACTION_EMOJI = { "[heart]": "❤️", "[fire]": "🔥" };

function StoryMedia({ story, onEnd, isScreenFocused, webViewRef }) {
  const [videoError, setVideoError] = useState(null);
  const localRef = useRef(null);
  const errorTimer = useRef(null);

  useEffect(() => {
    return () => {
      clearTimeout(errorTimer.current);
      const wv = localRef.current;
      if (wv) {
        try {
          wv.injectJavaScript?.("(function(){try{var v=document.getElementById('v');v.pause();v.muted=true;v.removeAttribute('src');v.load();}catch(e){}})();true;");
        } catch (_) {}
        try { wv.stopLoading?.(); } catch (_) {}
      }
    };
  }, []);

  const setRef = useCallback((node) => {
    localRef.current = node;
    if (webViewRef) webViewRef.current = node;
  }, [webViewRef]);

  useEffect(() => {
    if (!isScreenFocused && localRef.current) {
      localRef.current.postMessage("mute");
    }
  }, [isScreenFocused]);

  if (story.type === "video") {
    const videoUrl = resolveUrl(story.video);
    if (!videoUrl) {
      return (
        <View style={{ width, height: "100%", backgroundColor: COLORS.black, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: COLORS.text, fontSize: 13 }}>Video unavailable</Text>
        </View>
      );
    }
    const ext = (videoUrl.split(".").pop() || "").split("?")[0].toLowerCase();
    const mimeMap = { mp4: "video/mp4", m4v: "video/mp4", mov: "video/quicktime", webm: "video/webm", avi: "video/x-msvideo" };
    const videoMime = mimeMap[ext] || "video/mp4";
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
    video { width: 100%; height: 100%; object-fit: contain; background: #000; }
  </style>
</head>
<body>
  <video id="v" playsinline webkit-playsinline autoplay muted
    src="${videoUrl}" type="${videoMime}"
    style="width:100%;height:100%;object-fit:contain"></video>
  <script>
    var v = document.getElementById('v');
    var muted = true;
    var playPromise = null;
    function setMuted(m) {
      muted = m;
      v.muted = m;
      if (m) {
        try { v.pause(); } catch(e) {}
        setTimeout(function() { if (muted) { try { v.pause(); } catch(e) {} } }, 150);
      }
      else {
        try { playPromise = v.play(); if (playPromise) playPromise.catch(function(){}); } catch(e) {}
      }
      window.ReactNativeWebView.postMessage('soundState:' + (m ? 'off' : 'on'));
    }
    function stopPlayback() {
      muted = true;
      try { v.pause(); } catch(e) {}
      try { v.muted = true; } catch(e) {}
      try { v.removeAttribute('src'); v.load(); } catch(e) {}
    }
    v.addEventListener('ended', function() { window.ReactNativeWebView.postMessage('ended'); });
    v.addEventListener('error', function(e) { window.ReactNativeWebView.postMessage('error:' + (e.target.error?.message || 'unknown')); });
    v.load();
    v.play().catch(function() {});
    window.addEventListener('message', function(e) {
      var d = e.data;
      if (d === 'toggleSound') setMuted(!muted);
      else if (d === 'unmute') setMuted(false);
      else if (d === 'mute') setMuted(true);
      else if (d === 'stop') stopPlayback();
    });
    document.addEventListener('message', function(e) {
      var d = e.data;
      if (d === 'toggleSound') setMuted(!muted);
      else if (d === 'unmute') setMuted(false);
      else if (d === 'mute') setMuted(true);
      else if (d === 'stop') stopPlayback();
    });
  </script>
</body>
</html>`;
    return (
      <View style={{ width, height: "100%", backgroundColor: COLORS.black }}>
        <WebView
          ref={setRef}
          source={{ html }}
          style={{ width, height: "100%", backgroundColor: COLORS.black }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          scrollEnabled={false}
          allowsFullscreenVideo={false}
          mixedContentMode="always"
          onMessage={(e) => {
            if (e.nativeEvent.data === "ended") onEnd?.();
            else if (e.nativeEvent.data?.startsWith("error:")) {
              setVideoError(e.nativeEvent.data.replace("error:", ""));
              clearTimeout(errorTimer.current);
              errorTimer.current = setTimeout(() => onEnd?.(), 3000);
            }
          }}
        />
        {!isScreenFocused && <View style={{ position: "absolute", inset: 0, backgroundColor: COLORS.black }} />}
        {videoError && (
          <View style={{ position: "absolute", bottom: 80, left: 20, right: 20, backgroundColor: COLORS.dangerLight, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: "center" }}>
            <Text style={{ color: COLORS.text, ...FONTS.semiBold, fontSize: 13 }}>Video failed to load</Text>
            <Text style={{ color: COLORS.white, fontSize: 11, marginTop: SPACING.xs }}>{videoError}</Text>
        </View>
      )}
      </View>
    );
  }
  if (story.type === "text" && !story.image) {
    return <View style={[s.textStoryBg, { backgroundColor: story.bg_color || COLORS.bg }]} />;
  }
  const imageUri = resolveUrl(story.image);
  if (!imageUri) {
    return <View style={[s.textStoryBg, { backgroundColor: story.bg_color || COLORS.bg }]} />;
  }
  return <Image source={{ uri: imageUri }} style={s.image} resizeMode="contain" />;
}

function DrawingOverlay({ drawingData }) {
  if (!drawingData || !Array.isArray(drawingData) || drawingData.length === 0) return null;
  return (
    <View style={s.drawingOverlayWrap} pointerEvents="none">
      {drawingData.map((stroke, si) => {
        if (!stroke || !Array.isArray(stroke)) return null;
        return stroke.map((point, pi) => (
          <View
            key={`${si}-${pi}`}
            style={{
              position: "absolute",
              left: (point.x / 300) * width,
              top: (point.y / 420) * (width * 1.4),
              width: point.size || 4,
              height: point.size || 4,
              borderRadius: (point.size || 4) / 2,
              backgroundColor: point.color || COLORS.text,
              opacity: 0.9,
            }}
          />
        ));
      })}
    </View>
  );
}

function StickerOverlay({ stickers }) {
  if (!stickers || !stickers.length) return null;
  return (
    <>
      {stickers.map((sticker, i) => (
        <View
          key={i}
          style={[s.stickerItem, {
            left: (sticker.x / 100) * width,
            top: (sticker.y / 100) * (height * 0.7),
            transform: [{ scale: sticker.scale || 1 }],
          }]}
        >
          <Text style={{ fontSize: (sticker.size || 40) }}>{sticker.emoji}</Text>
        </View>
      ))}
    </>
  );
}

function ViewerListModal({ visible, storyId, onClose }) {
  const { t } = useLanguage();
  const [viewers, setViewers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible || !storyId) return;
    setLoading(true);
    client.get(`/stories/${storyId}/viewers`)
      .then((res) => {
        const data = res.data;
        setViewers(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible, storyId]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.viewerModal}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>{t("viewers")}</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.gold} style={{ marginTop: SPACING.xl }} />
          ) : (
            <FlatList
              data={viewers}
              keyExtractor={(v) => String(v.id)}
              contentContainerStyle={{ paddingBottom: SPACING.xl }}
              ListEmptyComponent={<Text style={s.emptyText}>{t("noViewers")}</Text>}
              renderItem={({ item }) => (
                <View style={s.viewerRow}>
                  <View style={s.viewerAvatar}>
                    <Text style={s.viewerAvatarText}>{item.username?.[0]?.toUpperCase() || "?"}</Text>
                  </View>
                  <Text style={s.viewerName}>{item.username}</Text>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

function ForwardModal({ visible, storyId, onClose }) {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    client.get("/users").then((res) => {
      const data = res.data;
      const usersList = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setUsers(usersList.slice(0, 50));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [visible]);

  const toggle = (id) => {
    setSelected((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const send = async () => {
    if (selected.size === 0) return;
    setSending(true);
    try {
      await client.post(`/stories/${storyId}/forward`, { user_ids: Array.from(selected) });
      onClose();
    } catch (_) {}
    setSending(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.viewerModal}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>{t("shareTo")}</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.gold} style={{ marginTop: SPACING.xl }} />
          ) : (
            <>
              <FlatList
                data={users}
                keyExtractor={(u) => String(u.id)}
                contentContainerStyle={{ paddingBottom: SPACING.xl }}
                renderItem={({ item }) => (
                  <TouchableOpacity style={s.forwardRow} onPress={() => toggle(item.id)}>
                    <View style={s.viewerAvatar}>
                      <Text style={s.viewerAvatarText}>{item.username?.[0]?.toUpperCase() || "?"}</Text>
                    </View>
                    <Text style={s.viewerName}>{item.username}</Text>
                    <View style={[s.checkbox, selected.has(item.id) && s.checkboxActive]}>
                      {selected.has(item.id) && <Icon name="checkmark" size={14} color={COLORS.text} />}
                    </View>
                  </TouchableOpacity>
                )}
              />
              {selected.size > 0 && (
                <TouchableOpacity style={s.forwardBtn} onPress={send} disabled={sending}>
                  {sending ? <ActivityIndicator color={COLORS.text} /> : <Text style={s.forwardBtnText}>{t("shareCount").replace("{count}", selected.size)}</Text>}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function AnalyticsModal({ visible, storyId, onClose }) {
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible || !storyId) return;
    setLoading(true);
    client.get(`/stories/${storyId}/analytics`)
      .then((res) => setAnalytics(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible, storyId]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.viewerModal}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>{t("storyInsights")}</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.gold} style={{ marginTop: SPACING.xl }} />
          ) : analytics ? (
            <View style={s.analyticsWrap}>
              <View style={s.analyticsRow}>
                <View style={s.analyticsCard}>
                  <Text style={s.analyticsNum}>{analytics.view_count}</Text>
                  <Text style={s.analyticsLabel}>{t("views")}</Text>
                </View>
                <View style={s.analyticsCard}>
                  <Text style={s.analyticsNum}>{analytics.reaction_count}</Text>
                  <Text style={s.analyticsLabel}>{t("reactions")}</Text>
                </View>
              </View>
              {analytics.reactions?.length > 0 && (
                <View style={s.reactionsBreakdown}>
                  <Text style={[s.analyticsLabel, { marginBottom: SPACING.sm }]}>{t("reactions")}</Text>
                  {analytics.reactions.map((r, i) => (
                    <View key={i} style={s.reactionLine}>
                      <Text style={{ fontSize: 18 }}>{REACTION_EMOJI[r.emoji] || r.emoji}</Text>
                      <Text style={s.reactionCount}>{r.count}</Text>
                    </View>
                  ))}
                </View>
              )}
              {analytics.recent_viewers?.length > 0 && (
                <View>
                    <Text style={[s.analyticsLabel, { marginBottom: SPACING.sm, marginTop: SPACING.md }]}>{t("recentViewers")}</Text>
                  {analytics.recent_viewers.map((v) => (
                    <View key={v.id} style={s.viewerRow}>
                      <View style={[s.viewerAvatar, { width: 28, height: 28, borderRadius: 14 }]}>
                        <Text style={[s.viewerAvatarText, { fontSize: 11 }]}>{v.username?.[0]?.toUpperCase() || "?"}</Text>
                      </View>
                      <Text style={[s.viewerName, { fontSize: 13 }]}>{v.username}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

export default function StoryViewerScreen({ route, navigation }) {
  const { stories: initialStories, user: storyUser, onStoriesChanged } = route?.params || {};
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [myReactions, setMyReactions] = useState({});
  const [reactionSent, setReactionSent] = useState({});
  const [showViewers, setShowViewers] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [stories, setStories] = useState(initialStories || []);
  const timerRef = useRef(null);
  const pausedRef = useRef(false);
  const viewReported = useRef(new Set());
  const insets = useSafeAreaInsets();
  const isScreenFocused = useIsFocused();
  const swipeX = useRef(new Animated.Value(0)).current;
  const swipeOpacity = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const webViewRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const indexRef = useRef(0);
  const advanceRef = useRef(null);
  const goBackStoryRef = useRef(null);

  useEffect(() => { indexRef.current = index; }, [index]);

  const stopAudio = useCallback(() => {
    const wv = webViewRef.current;
    if (!wv) return;
    try {
      wv.postMessage?.("stop");
      wv.postMessage?.("mute");
      wv.injectJavaScript?.("(function(){try{var v=document.getElementById('v');v.pause();v.muted=true;v.removeAttribute('src');v.load();}catch(e){}})();true;");
    } catch (_) {}
  }, []);

  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  const goingBackRef = useRef(false);

  const goBack = useCallback(() => {
    if (goingBackRef.current) return;
    goingBackRef.current = true;
    stopAudio();
    Animated.parallel([
      Animated.timing(swipeOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 0.9, friction: 8, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          goingBackRef.current = false;
        }
      }, 0);
    });
  }, [navigation, swipeOpacity, scaleAnim, stopAudio]);

  const advance = useCallback(() => {
    if (index < (stories?.length || 1) - 1) {
      Animated.sequence([
        Animated.timing(swipeOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(swipeOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
      setIndex((i) => i + 1);
      setProgress(0);
    } else {
      goBack();
    }
  }, [index, stories, goBack, swipeOpacity]);

  const goBackStory = useCallback(() => {
    if (index > 0) {
      Animated.sequence([
        Animated.timing(swipeOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(swipeOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
      setIndex((i) => i - 1);
      setProgress(0);
    }
  }, [index, swipeOpacity]);

  advanceRef.current = advance;
  goBackStoryRef.current = goBackStory;

  const currentStory = stories?.[index];
  const dur = (currentStory?.duration || 5) * 1000;
  const isOwner = currentUser?.id === storyUser?.id;

  useEffect(() => {
    clearInterval(timerRef.current);
    if (currentStory?.type === "video") return;
    const interval = 100;
    const step = interval / dur;
    timerRef.current = setInterval(() => {
      if (!pausedRef.current) {
        setProgress((p) => {
          const next = p + step;
          if (next >= 1) {
            clearInterval(timerRef.current);
            advanceRef.current?.();
            return 0;
          }
          return next;
        });
      }
    }, interval);
    return () => clearInterval(timerRef.current);
  }, [index, dur, currentStory?.type]);

  useEffect(() => {
    setMuted(true);
    webViewRef.current?.postMessage("mute");
  }, [index]);

  useEffect(() => {
    if (currentStory && !viewReported.current.has(currentStory.id)) {
      viewReported.current.add(currentStory.id);
      client.post(`/stories/${currentStory.id}/view`).catch(() => {});
    }
  }, [currentStory]);

  useEffect(() => {
    if (currentStory?.my_reaction) {
      setMyReactions((p) => ({ ...p, [currentStory.id]: currentStory.my_reaction }));
    }
  }, [currentStory]);

  useEffect(() => {
    if (!isScreenFocused) {
      pausedRef.current = true;
      webViewRef.current?.postMessage("mute");
      setMuted(true);
    } else {
      pausedRef.current = false;
    }
  }, [isScreenFocused]);

  useEffect(() => {
    return () => {
      clearPrefetchCache();
    };
  }, []);

  useEffect(() => {
    if (stories && index < stories.length - 1) {
      prefetchNextStories(stories, index);
    }
  }, [index, stories]);

  const panResponder = useRef(
    require("react-native").PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0 && indexRef.current === 0) return;
        swipeX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = width * 0.25;
        if (gestureState.dx < -threshold && indexRef.current < (stories?.length || 1) - 1) {
          advanceRef.current?.();
        } else if (gestureState.dx > threshold && indexRef.current > 0) {
          goBackStoryRef.current?.();
        } else {
          Animated.spring(swipeX, { toValue: 0, friction: 5, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const handlePress = (evt) => {
    const x = evt.nativeEvent.locationX;
    if (x < width * 0.3) {
      goBackStory();
    } else {
      advance();
    }
  };

  const sendReaction = async (emoji) => {
    if (!currentStory) return;
    try {
      await client.post(`/stories/${currentStory.id}/react`, { emoji });
      setMyReactions((p) => ({ ...p, [currentStory.id]: emoji }));
      setReactionSent((p) => ({ ...p, [currentStory.id]: emoji }));
      setTimeout(() => setReactionSent((p) => { const n = { ...p }; delete n[currentStory.id]; return n; }), 2000);
    } catch (_) {}
  };

  const sendReply = async () => {
    if (!replyText.trim() || !storyUser) return;
    try {
      await client.post("/messages", { receiver_id: storyUser.id, content: replyText.trim() });
      setReplyText("");
      setShowReplyInput(false);
    } catch (_) {}
  };

  const deleteStory = () => {
    Alert.alert(t("deleteStory"), t("deleteStoryConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await client.delete(`/stories/${currentStory.id}`);
            const newStories = stories.filter((s) => s.id !== currentStory.id);
            setStories(newStories);
            onStoriesChanged?.(newStories);
            if (newStories.length === 0) {
              goBack();
            } else {
              if (index >= newStories.length) {
                setIndex(Math.max(0, newStories.length - 1));
              }
              setProgress(0);
            }
          } catch (_) {}
          setDeleting(false);
        },
      },
    ]);
  };

  if (!stories?.length || !currentStory) return null;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: swipeOpacity, transform: [{ scale: scaleAnim }, { translateX: swipeX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handlePress}
          onLongPress={() => { pausedRef.current = true; }}
          onPressOut={() => { pausedRef.current = false; }}
          style={StyleSheet.absoluteFill}
        >
          <StoryMedia key={currentStory.id} story={currentStory} onEnd={advance} isScreenFocused={isScreenFocused} webViewRef={webViewRef} />
          <DrawingOverlay drawingData={currentStory.drawing_data} />
          <StickerOverlay stickers={currentStory.stickers} />
        </TouchableOpacity>
      </Animated.View>

      <View style={s.gradientTop} />
      <View style={s.gradientBottom} />

      {currentStory.text_overlay ? (
        <View style={[s.textOverlayWrap, currentStory.bg_color ? { backgroundColor: currentStory.bg_color } : { backgroundColor: COLORS.overlayLight }]}>
          <Text style={[s.textOverlay, { color: currentStory.text_color || COLORS.text }]}>{currentStory.text_overlay}</Text>
        </View>
      ) : null}

      <View style={[s.header, { top: insets.top + 10 }]}>
        <View style={s.progressBar}>
          {stories.map((_, i) => (
            <View
              key={i}
              style={[s.progressSegment, { backgroundColor: i < index ? COLORS.primary : i === index ? COLORS.primary + "CC" : COLORS.overlayLight }]}
            >
              {i === index && <View style={[s.progressFill, { width: `${progress * 100}%` }]} />}
            </View>
          ))}
        </View>
        <View style={s.userRow}>
          <View style={[s.avatar, { backgroundColor: COLORS.primary + "40" }]}>
            <Text style={[s.avatarText, { color: COLORS.primary }]}>{storyUser?.username?.[0]?.toUpperCase() || "?"}</Text>
          </View>
          <Text style={s.username}>{storyUser?.username}</Text>
          <Text style={s.time}>
            {new Date(currentStory.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
          {currentStory?.type === "video" && (
            <TouchableOpacity
              style={s.insightBtn}
              onPress={() => {
                const newMuted = !muted;
                setMuted(newMuted);
                webViewRef.current?.postMessage(newMuted ? "mute" : "unmute");
              }}
            >
              <Icon name={muted ? "volume-mute" : "volume-high"} size={18} color={COLORS.text} />
            </TouchableOpacity>
          )}
          {isOwner && (
            <>
              <TouchableOpacity style={s.insightBtn} onPress={() => setShowAnalytics(true)}>
                <Icon name="stats-chart-outline" size={18} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity style={[s.insightBtn, { backgroundColor: COLORS.danger + "33" }]} onPress={deleteStory} disabled={deleting}>
                {deleting ? <ActivityIndicator size="small" color={COLORS.danger} /> : <Icon name="trash" size={18} color={COLORS.danger} />}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <TouchableOpacity style={[s.closeBtn, { top: insets.top + 10 }]} onPress={goBack}>
        <Icon name="close" size={22} color={COLORS.text} />
      </TouchableOpacity>

      <View style={[s.reactionBar, { bottom: Math.max(insets.bottom + 20, 40) }]}>
        {["[heart]", "[laugh]", "[wow]", "[sad]", "[fire]"].map((emoji) => (
          <TouchableOpacity
            key={emoji}
            style={[s.reactionBtn, myReactions[currentStory.id] === emoji && s.reactionBtnActive]}
            onPress={() => sendReaction(emoji)}
          >
            {emoji === "[heart]" && <Icon name="heart" size={22} color={COLORS.text} />}
            {emoji === "[laugh]" && <Text style={s.reactionEmoji}>😂</Text>}
            {emoji === "[wow]" && <Text style={s.reactionEmoji}>😮</Text>}
            {emoji === "[sad]" && <Text style={s.reactionEmoji}>😢</Text>}
            {emoji === "[fire]" && <Icon name="flame" size={22} color={COLORS.text} />}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={s.replyBtn} onPress={() => setShowReplyInput(true)}>
          <Icon name="chatbubble-ellipses" size={20} color={COLORS.text} />
        </TouchableOpacity>
        {!isOwner && (
          <TouchableOpacity style={s.forwardBtnSmall} onPress={() => setShowForward(true)}>
            <Icon name="share-outline" size={20} color={COLORS.text} />
          </TouchableOpacity>
        )}
      </View>

      {reactionSent[currentStory.id] && (
        <View style={[s.sentBadge, { bottom: Math.max(insets.bottom + 70, 90) }]}>
          <Text style={s.sentText}>{t("reactedEmoji").replace("{emoji}", reactionSent[currentStory.id])}</Text>
        </View>
      )}

      {isOwner && currentStory && (
        <TouchableOpacity
          style={[s.viewersBadge, { top: insets.top + 70 }]}
          onPress={() => setShowViewers(true)}
        >
          <Icon name="eye" size={14} color={COLORS.text} />
          <Text style={s.viewersText}>{currentStory.view_count || 0}</Text>
        </TouchableOpacity>
      )}

      {showReplyInput && (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
        <View style={[s.replyInputBar, { bottom: keyboardHeight > 0 ? keyboardHeight + 8 : Math.max(insets.bottom + 20, 40) }]}>
          <TextInput
            style={s.replyInput}
            value={replyText}
            onChangeText={setReplyText}
            placeholder={t("replyToStory")}
            placeholderTextColor={COLORS.muted}
            autoFocus
          />
          <TouchableOpacity style={s.sendBtn} onPress={sendReply}>
            <Text style={s.sendText}>{t("send")}</Text>
          </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
      )}

      <ViewerListModal visible={showViewers} storyId={currentStory?.id} onClose={() => setShowViewers(false)} />
      <ForwardModal visible={showForward} storyId={currentStory?.id} onClose={() => setShowForward(false)} />
      <AnalyticsModal visible={showAnalytics} storyId={currentStory?.id} onClose={() => setShowAnalytics(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  textStoryBg: { flex: 1 },
  image: { width, height: "100%", position: "absolute" },
  drawingOverlayWrap: { ...StyleSheet.absoluteFillObject, zIndex: 3 },
  stickerItem: { position: "absolute", zIndex: 6 },
  textOverlayWrap: { position: "absolute", left: SPACING.xl, right: SPACING.xl, top: "40%", paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, borderRadius: RADIUS.md, alignItems: "center", zIndex: 5 },
  textOverlay: { fontSize: 28, ...FONTS.bold, textAlign: "center", lineHeight: 36 },
  gradientTop: { position: "absolute", top: 0, left: 0, right: 0, height: 120, backgroundColor: COLORS.overlayLight, zIndex: 8 },
  gradientBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: 160, backgroundColor: COLORS.overlay, zIndex: 8 },
  header: { position: "absolute", left: 0, right: 0, paddingHorizontal: SPACING.md, zIndex: 10 },
  progressBar: { flexDirection: "row", gap: SPACING.xs, marginBottom: SPACING.md },
  progressSegment: { flex: 1, height: 3, borderRadius: RADIUS.xs, overflow: "hidden", position: "relative" },
  progressFill: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: COLORS.text },
  userRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  avatar: { width: 32, height: 32, borderRadius: RADIUS.full, alignItems: "center", justifyContent: "center" },
  avatarText: { ...TYPOGRAPHY.captionBold },
  username: { color: COLORS.text, ...FONTS.semiBold, fontSize: 14 },
  time: { color: COLORS.textSecondary, fontSize: 12, marginLeft: "auto" },
  insightBtn: { width: 32, height: 32, borderRadius: RADIUS.full, backgroundColor: COLORS.glassLight, alignItems: "center", justifyContent: "center", marginLeft: SPACING.xs },
  insightText: { fontSize: 14 },
  closeBtn: { position: "absolute", right: SPACING.lg, zIndex: 10, width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.overlayLight, alignItems: "center", justifyContent: "center" },
  closeText: { color: COLORS.text, fontSize: 22 },
  reactionBar: { position: "absolute", left: 0, right: 0, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: SPACING.sm, paddingHorizontal: SPACING.md, zIndex: 10 },
  reactionBtn: { width: 44, height: 44, borderRadius: RADIUS.full, backgroundColor: COLORS.glassLight, alignItems: "center", justifyContent: "center" },
  reactionBtnActive: { backgroundColor: COLORS.primary + "80", borderWidth: 2, borderColor: COLORS.primary },
  reactionEmoji: { fontSize: 22 },
  replyBtn: { width: 44, height: 44, borderRadius: RADIUS.full, backgroundColor: COLORS.glassLight, alignItems: "center", justifyContent: "center" },
  replyBtnText: { fontSize: 20 },
  forwardBtnSmall: { width: 44, height: 44, borderRadius: RADIUS.full, backgroundColor: COLORS.glassLight, alignItems: "center", justifyContent: "center" },
  forwardBtnText2: { ...TYPOGRAPHY.h3, color: COLORS.text },
  sentBadge: { position: "absolute", alignSelf: "center", zIndex: 10 },
  sentText: { ...TYPOGRAPHY.captionBold, color: COLORS.gold, backgroundColor: COLORS.overlayLight, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.xl },
  viewersBadge: { position: "absolute", right: SPACING.lg, zIndex: 10, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADIUS.md, backgroundColor: COLORS.overlayLight },
  viewersText: { ...TYPOGRAPHY.label, color: COLORS.text },
  replyInputBar: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingHorizontal: SPACING.lg, zIndex: 10, backgroundColor: COLORS.glass, borderTopWidth: 1, borderTopColor: COLORS.glassBorder, paddingVertical: SPACING.sm },
  replyInput: { flex: 1, height: 42, borderRadius: RADIUS.full, backgroundColor: COLORS.glassLight, paddingHorizontal: SPACING.lg, color: COLORS.text, fontSize: 14, borderWidth: 1, borderColor: COLORS.glassBorder },
  sendBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: COLORS.primary },
  sendText: { color: COLORS.text, ...FONTS.semiBold, fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: COLORS.overlay },
  viewerModal: { backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, maxHeight: "70%", paddingTop: SPACING.sm, paddingBottom: SPACING.xl },
  modalHandle: { width: 40, height: 4, borderRadius: RADIUS.xs, backgroundColor: COLORS.muted, alignSelf: "center", marginBottom: SPACING.md },
  modalTitle: { fontSize: SIZES.lg, ...FONTS.bold, color: COLORS.text, textAlign: "center", marginBottom: SPACING.md },
  emptyText: { textAlign: "center", color: COLORS.muted, padding: SPACING.xxxl },
  viewerRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  viewerAvatar: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.glass, alignItems: "center", justifyContent: "center" },
  viewerAvatarText: { ...TYPOGRAPHY.captionBold, color: COLORS.text },
  viewerName: { flex: 1, color: COLORS.text, ...FONTS.medium, fontSize: 14 },
  forwardRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  checkbox: { width: 24, height: 24, borderRadius: RADIUS.full, borderWidth: 2, borderColor: COLORS.muted, alignItems: "center", justifyContent: "center" },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: COLORS.text, fontSize: 14, ...FONTS.bold },
  forwardBtn: { backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingVertical: SPACING.md, alignItems: "center", marginHorizontal: SPACING.lg, marginTop: SPACING.sm },
  forwardBtnText: { ...TYPOGRAPHY.bodyBold, color: COLORS.text },
  analyticsWrap: { paddingHorizontal: SPACING.lg },
  analyticsRow: { flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.lg },
  analyticsCard: { flex: 1, backgroundColor: COLORS.glass, borderRadius: SIZES.radius, padding: SPACING.lg, alignItems: "center" },
  analyticsNum: { fontSize: 28, ...FONTS.bold, color: COLORS.gold },
  analyticsLabel: { ...TYPOGRAPHY.label, color: COLORS.muted, marginTop: SPACING.xs },
  reactionsBreakdown: { backgroundColor: COLORS.glass, borderRadius: SIZES.radius, padding: SPACING.md, marginBottom: SPACING.sm },
  reactionLine: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingVertical: SPACING.xs },
  reactionCount: { color: COLORS.text, ...FONTS.medium, fontSize: 14 },
});
