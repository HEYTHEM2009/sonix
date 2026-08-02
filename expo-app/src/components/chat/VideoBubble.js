import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEvent } from "expo";
import Icon from "../../design/ui/Icon";

const COLORS = {
  primary: "#6C5CE7",
  text: "#ffffff",
  bg: "#1e1e30",
  border: "#2a2a3a",
};

const VideoBubble = ({ uri, isMine = false, style, onFullscreen, onVideoPress, onLongPress, color = COLORS.primary }) => {
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);

  // useVideoPlayer must be called unconditionally on every render (Rules of Hooks).
  const player = useVideoPlayer(uri || "", (p) => {
    p.showNativeControls = true;
  });

  const { status } = useEvent(player, "statusChange", { status: player.status });

  useEffect(() => {
    if (status === "error") setFailed(true);
  }, [status]);

  const openExternal = () => {
    if (onFullscreen) onFullscreen(uri);
    else Linking.openURL(uri).catch(() => {});
  };

  const play = () => {
    if (!uri) {
      openExternal();
      return;
    }
    try {
      setStarted(true);
      player.play();
    } catch (_) {
      openExternal();
    }
  };

  const openViewer = () => {
    if (onVideoPress) {
      onVideoPress();
      return;
    }
    play();
  };

  const retry = () => {
    setFailed(false);
    setStarted(true);
    try {
      player.play();
    } catch (_) {
      openExternal();
    }
  };

  const thumbStyle = [styles.thumb, style];
  const wrapStyle = [styles.wrap, { borderColor: isMine ? color : COLORS.border }, style];

  if (started && uri) {
    if (failed) {
      return (
        <View style={wrapStyle}>
          <TouchableOpacity
            style={[thumbStyle, styles.errorBox]}
            activeOpacity={0.85}
            onPress={retry}
            onLongPress={onLongPress}
            delayLongPress={350}
          >
            <Icon name="alert-circle-outline" size="md" color="#fff" />
            <Text style={styles.errorText}>Video unavailable</Text>
            <View style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={wrapStyle}>
        <VideoView player={player} style={thumbStyle} />
        {status === "loading" && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        )}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={wrapStyle}
      onPress={openViewer}
      onLongPress={onLongPress}
      delayLongPress={350}
      activeOpacity={0.85}
    >
      <View style={thumbStyle}>
        <View style={styles.playOverlay}>
          <Icon name="play" size="hero" color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
  },
  thumb: {
    width: 220,
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  playOverlay: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 18,
  },
  loadingOverlay: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  errorBox: {
    backgroundColor: "#14141f",
  },
  errorText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    marginTop: 6,
  },
  retryBtn: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  retryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  playIcon: {
    fontSize: 44,
    color: "#fff",
  },
});

export default VideoBubble;
