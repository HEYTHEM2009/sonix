import React, { memo } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { resolveUrl } from "../api/client";
import { COLORS } from "./Theme";

const UserCard = memo(function UserCard({ user, onPress, onFollow, isFollowing, t }) {
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.left} onPress={() => onPress?.(user)} activeOpacity={0.7}>
        {user.avatar ? (
          <Image source={{ uri: resolveUrl(user.avatar) }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{user.username?.[0]?.toUpperCase() || "?"}</Text>
          </View>
        )}
        <View style={styles.info}>
          <View style={styles.usernameRow}>
            <Text style={styles.username}>@{user.username}</Text>
            {user.is_pro ? <Text style={styles.proBadge}>PRO</Text> : null}
          </View>
          {user.bio ? <Text style={styles.bio} numberOfLines={1}>{user.bio}</Text> : null}
        </View>
      </TouchableOpacity>
      {onFollow ? (
        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followingBtn]}
          onPress={() => onFollow(user)}
          activeOpacity={0.7}
        >
          <Text style={styles.followText}>{isFollowing ? (t?.("following") || "Following") : (t?.("follow") || "Follow")}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  left: { flex: 1, flexDirection: "row", alignItems: "center" },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#222" },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(124,108,247,0.4)" },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  info: { marginLeft: 12, flex: 1 },
  usernameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  proBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#111",
    backgroundColor: "#FFD60A",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: "hidden",
  },
  username: { color: "#fff", fontSize: 15, fontWeight: "700" },
  bio: { color: "#999", fontSize: 12, marginTop: 2 },
  followBtn: {
    backgroundColor: COLORS.primary || "#7c6cf7",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  followingBtn: { backgroundColor: "rgba(255,255,255,0.12)" },
  followText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});

export default UserCard;
