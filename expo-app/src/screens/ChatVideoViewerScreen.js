import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, Share, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEvent } from "expo";
import Icon from "../design/ui/Icon";
import { resolveUrl } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import { COLORS, RADIUS } from "../design/DesignSystem";

function formatRelative(ts, t) {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return t("now");
  if (diff < 3600000) return t("minutesAgo").replace("{n}", Math.max(1, Math.floor(diff / 60000)));
  if (diff < 86400000) return t("hoursAgo").replace("{n}", Math.floor(diff / 3600000));
  return t("daysAgo").replace("{n}", Math.floor(diff / 86400000));
}

export default function ChatVideoViewerScreen({ route, navigation }) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const params = route.params ?? {};
  const fullUrl = resolveUrl(params.videoUrl || "");
  const [failed, setFailed] = useState(false);

  const player = useVideoPlayer(fullUrl, (p) => {
    p.showNativeControls = true;
  });

  const { status } = useEvent(player, "statusChange", { status: player.status });

  const shareVideo = () => {
    Share.share({ url: fullUrl }).catch(() => {});
  };

  const moreOptions = () => {
    Alert.alert(t("video"), null, [
      { text: t("share"), onPress: shareVideo },
      { text: t("cancel"), style: "cancel" },
    ]);
  };

  const retry = () => {
    setFailed(false);
    try {
      player.play();
    } catch (_) {}
  };

  return (
    <View style={s.wrap}>
      {failed ? (
        <View style={s.center}>
          <Icon name="alert-circle-outline" size="xl" color="#fff" />
          <Text style={s.errText}>{t("unknown")}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={retry} activeOpacity={0.85}>
            <Text style={s.retryText}>{t("retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <VideoView player={player} style={s.video} />
      )}
      {!failed && status === "loading" && (
        <View style={s.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      <View style={[s.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn} hitSlop={8}>
          <Icon name="close" size="lg" color="#fff" />
        </TouchableOpacity>
        <View style={s.userWrap}>
          {params.avatar ? (
            <Image source={{ uri: resolveUrl(params.avatar) }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Icon name="person" size="sm" color="#fff" />
            </View>
          )}
          <View style={s.userMeta}>
            <Text style={s.username} numberOfLines={1}>
              {params.username || t("unknown")}
            </Text>
            <Text style={s.time}>{formatRelative(params.timestamp, t)}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={moreOptions} style={s.iconBtn} hitSlop={8}>
          <Icon name="ellipsis-horizontal" size="lg" color="#fff" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[s.replyBar, { bottom: insets.bottom + 10 }]}
        activeOpacity={0.85}
      >
        <Icon name="chatbubble-ellipses-outline" size="sm" color="rgba(255,255,255,0.7)" />
        <Text style={s.replyText}>{t("reply")}...</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.black },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errText: { color: "rgba(255,255,255,0.75)", fontSize: 13 },
  retryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  retryText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  video: { flex: 1, backgroundColor: COLORS.black },
  loadingOverlay: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  userWrap: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  avatar: { width: 32, height: 32, borderRadius: RADIUS.full },
  avatarFallback: {
    backgroundColor: COLORS.glassLight,
    borderWidth: 0.5,
    borderColor: COLORS.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  userMeta: { alignItems: "center" },
  username: { color: COLORS.white, fontSize: 13, fontWeight: "600", maxWidth: 160 },
  time: { color: "rgba(255,255,255,0.6)", fontSize: 11 },
  replyBar: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: RADIUS.full,
    borderWidth: 0.5,
    borderColor: COLORS.glassBorder,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  replyText: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
});
