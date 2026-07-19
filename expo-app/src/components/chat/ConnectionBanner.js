import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../components/Theme";
import { useRealtime } from "../../hooks/useRealtime";

// NOTE: i18n is not wired yet (no src/i18n/index.js with a useTranslation hook).
// When available, swap the plain strings below for t("connecting"), etc.
function statusLabel(status) {
  switch (status) {
    case "connected":
      return "Online";
    case "connecting":
      return "Connecting…";
    case "reconnecting":
    case "disconnected":
      return "Reconnecting…";
    case "error":
      return "Connection error";
    default:
      return "";
  }
}

function dotColor(status) {
  switch (status) {
    case "connected":
      return COLORS.success;
    case "error":
      return COLORS.danger;
    default:
      return COLORS.warning;
  }
}

export default function ConnectionBanner({ style }) {
  const { status } = useRealtime();
  const label = statusLabel(status);

  if (!label) return null;

  const showDot = status === "connected";

  return (
    <View style={[styles.container, style]}>
      {showDot ? (
        <View style={[styles.dot, { backgroundColor: dotColor(status) }]} />
      ) : null}
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(13,13,26,0.85)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    marginVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  text: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
  },
});
