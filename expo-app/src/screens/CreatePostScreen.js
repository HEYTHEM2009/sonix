import { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, KeyboardAvoidingView, Platform, ScrollView, Dimensions, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import client from "../api/client";
import { COLORS, SIZES, FONTS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS, LAYOUT } from "../design/DesignSystem";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import Icon from "../design/ui/Icon";
import Screen3D from "../components/3D/Screen3D";

const { width: SCREEN_W } = Dimensions.get("window");

export default function CreatePostScreen({ navigation }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [mediaUri, setMediaUri] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionResults, setMentionResults] = useState([]);
  const [mentionIndex, setMentionIndex] = useState(-1);
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef(null);
  const insets = useSafeAreaInsets();

  const detectMention = (text, pos) => {
    const before = text.slice(0, pos);
    const match = before.match(/@([\p{L}\p{N}_]*)$/u);
    if (match) {
      setMentionQuery(match[1]);
    } else {
      setMentionQuery(null);
      setMentionResults([]);
    }
  };

  const handleChangeText = (text) => {
    setContent(text);
    detectMention(text, cursorPos);
  };

  const handleSelectionChange = (e) => {
    const pos = e.nativeEvent.selection.end;
    setCursorPos(pos);
    if (mentionQuery !== null) detectMention(content, pos);
  };

  useEffect(() => {
    if (mentionQuery !== null && mentionQuery.length >= 1) {
      const timeout = setTimeout(async () => {
        try {
          const res = await client.get(`/users/search?q=${encodeURIComponent(mentionQuery)}&per_page=5`);
          setMentionResults(res.data?.data || res.data || []);
          setMentionIndex(-1);
        } catch (e) {}
      }, 200);
      return () => clearTimeout(timeout);
    } else {
      setMentionResults([]);
    }
  }, [mentionQuery]);

  const insertMention = (username) => {
    const before = content.slice(0, cursorPos);
    const after = content.slice(cursorPos);
    const replaced = before.replace(/@[\p{L}\p{N}_]*$/u, `@${username} `);
    setContent(replaced + after);
    setMentionQuery(null);
    setMentionResults([]);
  };

  const pickMedia = async (type) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === "video" ? ["videos"] : ["images"],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType(type);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") { Alert.alert(t("permissionNeeded")); return; }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType("image");
    }
  };

  const submit = async () => {
    if (!content.trim() && !mediaUri) return;
    setUploading(true);
    try {
      const formData = new FormData();
      if (content.trim()) formData.append("content", content.trim());
      if (mediaUri) {
        const ext = mediaType === "video" ? "mp4" : "jpg";
        const mime = mediaType === "video" ? "video/mp4" : "image/jpeg";
        const filename = mediaUri.split("/").pop() || `media.${ext}`;
        formData.append(mediaType === "video" ? "video" : "image", { uri: mediaUri, name: filename, type: mime });
      }
      await client.post("/posts", formData, { headers: { "Content-Type": "multipart/form-data" } });
      navigation.navigate("Home", { screen: "Feed" });
    } catch (e) {
      Alert.alert(t("error"), e.response?.data?.message || t("failedToCreatePost"));
    }
    setUploading(false);
  };

  const canPost = content.trim() || mediaUri;

  return (
    <Screen3D style={s.container}>
      <View style={[s.topBar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="close" size={16} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={s.title}>{t("newPost")}</Text>
        <TouchableOpacity style={[s.shareBtn, !canPost && s.shareBtnDisabled]} onPress={submit} disabled={uploading || !canPost}>
          <Text style={[s.shareText, !canPost && s.shareTextDisabled]}>{uploading ? t("sharing") : t("share")}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top + 46}
      >
        <ScrollView style={s.scrollContent} contentContainerStyle={s.scrollContentContainer}>
          <View style={s.authorRow}>
            <View style={[s.authorAvatar, { backgroundColor: COLORS.primary + "30" }]}>
              <Text style={[s.authorAvatarText, { color: COLORS.primary }]}>{(user?.username || "U").charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={s.authorName}>{user?.username || "You"}</Text>
              <Text style={s.authorBadge}>{user?.is_private ? t("private") : t("public")}</Text>
            </View>
          </View>

          <TextInput
            ref={inputRef}
            style={s.input}
            multiline
            placeholder={t("whatsOnMind")}
            placeholderTextColor={COLORS.muted}
            value={content}
            onChangeText={handleChangeText}
            onSelectionChange={handleSelectionChange}
            textAlignVertical="top"
            maxLength={5000}
            autoFocus
          />

          {mediaUri && (
            <View style={s.mediaContainer}>
              {mediaType === "video" ? (
                <View style={s.videoThumbnail}>
                  <Image source={{ uri: mediaUri }} style={s.media} resizeMode="cover" />
                  <View style={s.playOverlay}>
                    <View style={s.playCircle}><Icon name="play" size={22} color={COLORS.text} style={{ marginLeft: SPACING.xs }} /></View>
                  </View>
                  <View style={s.videoBadge}><Text style={s.videoBadgeText}>Video</Text></View>
                </View>
              ) : (
                <Image source={{ uri: mediaUri }} style={s.media} resizeMode="cover" />
              )}
              <TouchableOpacity style={s.removeMediaBtn} onPress={() => { setMediaUri(null); setMediaType(null); }}>
                <Icon name="close" size={14} color={COLORS.text} />
              </TouchableOpacity>
              <View style={s.mediaOverlay}>
                <TouchableOpacity style={s.changeMediaBtn} onPress={() => pickMedia(mediaType || "image")}>
                  <Text style={s.changeMediaText}>{t("changePhoto")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[s.toolbar, { paddingBottom: Math.max(insets.bottom + 8, 16) }]}>
          <View style={s.toolActions}>
            <TouchableOpacity style={s.toolBtn} onPress={() => pickMedia("image")}>
              <View style={[s.toolIconWrap, { backgroundColor: COLORS.primary + "20" }]}>
                <Icon name="images" size={18} color={COLORS.primary} />
              </View>
              <Text style={s.toolLabel}>{t("gallery")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.toolBtn} onPress={takePhoto}>
              <View style={[s.toolIconWrap, { backgroundColor: COLORS.gold + "20" }]}>
                <Icon name="camera" size={18} color={COLORS.gold} />
              </View>
              <Text style={s.toolLabel}>{t("camera")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.toolBtn} onPress={() => pickMedia("video")}>
              <View style={[s.toolIconWrap, { backgroundColor: "#E1705530" }]}>
                <Icon name="videocam" size={18} color={"#E17055"} />
              </View>
              <Text style={s.toolLabel}>{t("video")}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.charCount}>
            <Text style={[s.charText, content.length > 2000 && { color: COLORS.danger }]}>
              {content.length}/2000
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      {mentionResults.length > 0 && (
        <View style={s.mentionDropdown}>
          <FlatList
            data={mentionResults}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[s.mentionRow, index === mentionIndex && s.mentionRowActive]}
                onPress={() => insertMention(item.username)}
              >
                <View style={s.mentionAvatar}>
                  <Text style={s.mentionAvatarText}>{item.username?.[0]?.toUpperCase() || "?"}</Text>
                </View>
                <Text style={s.mentionName}>{item.username}</Text>
                {item.name && <Text style={s.mentionFullName}>{item.name}</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </Screen3D>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, ...GLASS.elevated },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 16, color: COLORS.text, ...FONTS.bold },
  title: { fontSize: SIZES.lg, ...FONTS.bold, color: COLORS.text },
  shareBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingHorizontal: SPACING.xl, height: 36, alignItems: "center", justifyContent: "center" },
  shareBtnDisabled: { backgroundColor: COLORS.border },
  shareText: { color: COLORS.text, ...FONTS.bold, fontSize: SIZES.md },
  shareTextDisabled: { color: COLORS.muted },
  scrollContent: { flex: 1 },
  scrollContentContainer: { padding: SPACING.lg },
  authorRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.lg },
  authorAvatar: { width: 40, height: 40, borderRadius: RADIUS.full, alignItems: "center", justifyContent: "center" },
  authorAvatarText: { ...FONTS.bold, fontSize: 16 },
  authorName: { fontSize: SIZES.md, ...FONTS.semiBold, color: COLORS.text },
  authorBadge: { fontSize: SIZES.xs, color: COLORS.muted },
  input: { fontSize: 17, color: COLORS.text, lineHeight: 26, minHeight: 120, padding: 0 },
  mediaContainer: { marginTop: SPACING.lg, borderRadius: RADIUS.xl, overflow: "hidden", position: "relative", ...GLASS.elevated },
  media: { width: "100%", height: 280, borderRadius: RADIUS.xl },
  videoThumbnail: { position: "relative" },
  playOverlay: { position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" },
  playCircle: { width: 56, height: 56, borderRadius: RADIUS.full, backgroundColor: COLORS.overlay, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "rgba(255,255,255,0.3)" },
  playIcon: { color: COLORS.text, fontSize: 22, marginLeft: SPACING.xs },
  videoBadge: { position: "absolute", top: SPACING.sm, left: SPACING.sm, backgroundColor: COLORS.overlay, borderRadius: RADIUS.md, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs },
  videoBadgeText: { color: COLORS.text, fontSize: 12, ...FONTS.semiBold },
  removeMediaBtn: { position: "absolute", top: SPACING.sm, right: SPACING.sm, width: SPACING.xxxl, height: SPACING.xxxl, borderRadius: RADIUS.full, backgroundColor: COLORS.overlay, alignItems: "center", justifyContent: "center", zIndex: 2 },
  removeMediaText: { color: COLORS.text, fontSize: 14, ...FONTS.bold },
  mediaOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: SPACING.sm, backgroundColor: COLORS.overlay, flexDirection: "row", justifyContent: "flex-end" },
  changeMediaBtn: { backgroundColor: COLORS.primary + "CC", borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  changeMediaText: { color: COLORS.text, fontSize: SIZES.sm, ...FONTS.semiBold },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, borderTopWidth: 0.5, borderTopColor: COLORS.border, backgroundColor: COLORS.bg },
  toolActions: { flexDirection: "row", gap: SPACING.lg },
  toolBtn: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  toolIconWrap: { width: 36, height: 36, borderRadius: RADIUS.full, alignItems: "center", justifyContent: "center" },
  toolIcon: { fontSize: 18 },
  toolLabel: { fontSize: SIZES.sm, ...FONTS.semiBold, color: COLORS.textSecondary },
  charCount: { alignItems: "flex-end" },
  charText: { fontSize: SIZES.xs, color: COLORS.muted },

  mentionDropdown: { position: "absolute", left: SPACING.lg, right: SPACING.lg, bottom: 60, maxHeight: 200, ...GLASS.elevated, borderRadius: RADIUS.md, zIndex: 100, elevation: 10 },
  mentionRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  mentionRowActive: { backgroundColor: COLORS.input },
  mentionAvatar: { width: 30, height: 30, borderRadius: RADIUS.full, backgroundColor: COLORS.primary + "30", alignItems: "center", justifyContent: "center" },
  mentionAvatarText: { fontSize: 13, ...FONTS.bold, color: COLORS.primary },
  mentionName: { fontSize: SIZES.md, ...FONTS.semiBold, color: COLORS.text },
  mentionFullName: { fontSize: SIZES.sm, color: COLORS.muted, flex: 1 },
});
