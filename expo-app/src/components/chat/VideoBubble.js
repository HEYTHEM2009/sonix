import { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";

const COLORS = {
  primary: "#6C5CE7",
  text: "#ffffff",
  bg: "#1e1e30",
  border: "#2a2a3a",
};

const VideoBubble = ({ uri, isMine = false, style, onFullscreen, color = COLORS.primary }) => {
  const [started, setStarted] = useState(false);

  // useVideoPlayer must be called unconditionally on every render (Rules of Hooks).
  const player = useVideoPlayer(uri || "", (p) => {
    p.showNativeControls = true;
  });

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

  const thumbStyle = [styles.thumb, style];
  const wrapStyle = [styles.wrap, { borderColor: isMine ? color : COLORS.border }, style];

  if (started && uri) {
    return (
      <View style={wrapStyle}>
        <VideoView player={player} style={thumbStyle} />
      </View>
    );
  }

  return (
    <TouchableOpacity style={wrapStyle} onPress={play} activeOpacity={0.85}>
      <View style={thumbStyle}>
        <View style={styles.playOverlay}>
          <Text style={styles.playIcon}>▶</Text>
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
    height: 160,
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
  playIcon: {
    fontSize: 44,
    color: "#fff",
  },
});

export default VideoBubble;
