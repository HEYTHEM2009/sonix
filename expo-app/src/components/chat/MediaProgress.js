import { View, StyleSheet } from "react-native";
import { COLORS } from "../Theme";

const MediaProgress = ({ progress = 0, visible = false, color = COLORS.primary }) => {
  if (!visible) return null;
  const clamped = Math.min(Math.max(progress, 0), 1);
  return (
    <View style={styles.track} pointerEvents="none">
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});

export default MediaProgress;
