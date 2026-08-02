import { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { COLORS, SIZES, FONTS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS, LAYOUT } from "../design/DesignSystem";
import Screen3D from "../components/3D/Screen3D";
import Icon from "../design/ui/Icon";

function renderLinkable(text) {
  if (!text) return null;
  const parts = text.split(/([#@][\p{L}\p{N}_]+)/gu);
  return parts.map((part, i) => {
    if (part.startsWith("#")) return <Text key={i} style={s.linkHash}>{part}</Text>;
    if (part.startsWith("@")) return <Text key={i} style={s.linkMention}>{part}</Text>;
    return <Text key={i}>{part}</Text>;
  });
}

function CommentItem({ comment, user, isRTL, isReel, onDelete, onReply }) {
  const [liked, setLiked] = useState(comment.liked || false);
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((c) => newLiked ? c + 1 : c - 1);
    try {
      if (isReel) {
        const res = await client.post(`/reel-comments/${comment.id}/like`);
        setLiked(res.data?.data?.liked ?? false);
        setLikesCount(res.data?.data?.likes_count ?? 0);
      }
    } catch (e) { setLiked(!newLiked); setLikesCount((c) => newLiked ? c - 1 : c + 1); }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      await onReply(comment.id, replyText.trim());
      setReplyText("");
      setReplying(false);
      setShowReplies(true);
    } catch (e) {}
  };

  const replies = comment.replies || [];

  return (
    <View>
      <TouchableOpacity
        style={[s.row, isRTL && { flexDirection: "row-reverse" }]}
        onLongPress={() => comment.user?.id === user?.id && onDelete(comment.id)}
        activeOpacity={0.7}
      >
        <View style={s.avatar}><Text style={s.avatarText}>{comment.user?.username?.[0]?.toUpperCase() || "?"}</Text></View>
        <View style={s.content}>
          <Text style={s.msg}>
            <Text style={s.user}>{comment.user?.username} </Text>
            {renderLinkable(comment.content)}
          </Text>
          <View style={s.commentActions}>
            <Text style={s.time}>{new Date(comment.created_at).toLocaleDateString()}</Text>
            {isReel && (
              <>
                <TouchableOpacity onPress={handleLike} style={s.actionBtn} hitSlop={{top:8, bottom:8, left:8, right:8}}>
                  <Icon name={liked ? "heart" : "heart-outline"} size={14} color={liked ? COLORS.danger : COLORS.muted} />
                  {likesCount > 0 && <Text style={[s.actionText, liked && { color: COLORS.danger }]}> {likesCount}</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setReplying(!replying)} style={s.actionBtn} hitSlop={{top:8, bottom:8, left:8, right:8}}>
                  <Text style={s.actionText}>Reply</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        {comment.user?.id === user?.id && <Icon name="close" size={12} color={COLORS.muted} style={{ paddingLeft: SPACING.xs, paddingTop: SPACING.xs }} />}
      </TouchableOpacity>

      {/* Reply input */}
      {replying && (
        <View style={s.replyInputRow}>
          <TextInput
            style={s.replyInput}
            value={replyText}
            onChangeText={setReplyText}
            placeholder={`Reply to ${comment.user?.username}...`}
            placeholderTextColor={COLORS.muted}
            autoFocus
            returnKeyType="send"
            onSubmitEditing={handleReply}
          />
          <TouchableOpacity onPress={handleReply} style={s.replySendBtn} hitSlop={{top:8, bottom:8, left:8, right:8}}>
            <Icon name="arrow-forward" size={16} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      )}

      {/* Show replies */}
      {replies.length > 0 && (
        <TouchableOpacity onPress={() => setShowReplies(!showReplies)} style={s.repliesToggle} hitSlop={{top:8, bottom:8, left:8, right:8}}>
          <Text style={s.repliesToggleText}>
            {showReplies ? "Hide" : `View ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
          </Text>
        </TouchableOpacity>
      )}

      {showReplies && replies.map((reply) => (
        <View key={reply.id} style={[s.row, s.replyRow, isRTL && { flexDirection: "row-reverse" }]}>
          <View style={[s.avatar, s.avatarSmall]}><Text style={[s.avatarText, { fontSize: 10 }]}>{reply.user?.username?.[0]?.toUpperCase() || "?"}</Text></View>
          <View style={s.content}>
            <Text style={s.msg}>
              <Text style={s.user}>{reply.user?.username} </Text>
              {renderLinkable(reply.content)}
            </Text>
            <Text style={s.time}>{new Date(reply.created_at).toLocaleDateString()}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function CommentsScreen({ route, navigation }) {
  const { t, isRTL } = useLanguage();
  const postId = route.params?.postId ?? null;
  const reelId = route.params?.reelId ?? null;
  const isReel = route.params?.type === "reel" || !!reelId;
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    try {
      if (isReel && reelId) {
        const res = await client.get(`/reels/${reelId}`);
        setComments(res.data?.data?.comments || []);
      } else if (postId) {
        const res = await client.get(`/posts/${postId}/comments`);
        setComments(res.data?.data || []);
      }
    } catch (e) { console.warn("Comments load error", e?.response?.status); }
    setLoading(false);
  }, [postId, reelId, isReel]);

  useEffect(() => { load(); }, [load]);

  const submit = useCallback(async () => {
    const content = text.trim();
    if (!content) return;
    try {
      if (isReel && reelId) {
        await client.post(`/reels/${reelId}/comment`, { content });
      } else if (postId) {
        await client.post(`/posts/${postId}/comments`, { content });
      }
      setText("");
      await load();
    } catch (e) {
      console.warn("Comment error", e?.response?.status);
      Alert.alert(t("error") || "Error", t("commentFailed") || "Failed to post comment");
    }
  }, [text, isReel, reelId, postId, load, t]);

  const submitReply = async (parentId, content) => {
    if (isReel && reelId) {
      await client.post(`/reels/${reelId}/comment`, { content, parent_id: parentId });
      await load();
    }
  };

  const deleteComment = (commentId) => {
    Alert.alert(t("deleteComment"), t("deleteCommentConfirm"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("delete"), style: "destructive", onPress: async () => {
        try {
          if (isReel) {
            await client.delete(`/reel-comments/${commentId}`);
          } else {
            await client.delete(`/comments/${commentId}`);
          }
          setComments((prev) => prev.filter((c) => c.id !== commentId));
        } catch (e) { console.warn("Delete comment error", e?.response?.status); }
      }},
    ]);
  };

  return (
    <Screen3D>
    <KeyboardAvoidingView style={s.container} behavior="padding" keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
      <View style={[s.topBar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{top:8, bottom:8, left:8, right:8}}>
          <Icon name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={s.title}>{t("comments")}</Text>
        <View style={{ width: 36 }} />
      </View>
      {loading ? (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={comments.filter((c) => !c.parent_id)}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ padding: 12, paddingBottom: Math.max(insets.bottom + 60, 70) }}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Icon name="chatbubble-outline" size={36} color={COLORS.muted} />
              <Text style={s.empty}>{t("noComments")}</Text>
            </View>
          }
          renderItem={({ item: c }) => (
            <CommentItem
              comment={c}
              user={user}
              isRTL={isRTL}
              isReel={isReel}
              onDelete={deleteComment}
              onReply={submitReply}
            />
          )}
        />
      )}
      <View style={[s.inputRow, { paddingBottom: Math.max(insets.bottom + 6, 12) }]}>
        <TextInput style={s.input} value={text} onChangeText={setText} placeholder={t("addCommentPlaceholder")} placeholderTextColor={COLORS.muted} returnKeyType="send" onSubmitEditing={submit} />
        <TouchableOpacity onPress={submit} hitSlop={{top:8, bottom:8, left:8, right:8}}>
          <Text style={[s.postBtn, text.trim() && s.postBtnActive]}>{t("post")}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    </Screen3D>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingBottom: SPACING.sm, paddingHorizontal: SPACING.md, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.md, backgroundColor: GLASS.bg },
  backText: { ...TYPOGRAPHY.h3, color: COLORS.text },
  title: { fontSize: SIZES.md, ...FONTS.semiBold, color: COLORS.text },
  emptyWrap: { alignItems: "center", paddingTop: 40 },
  emptyIcon: { fontSize: 36, marginBottom: SPACING.sm, color: COLORS.muted, ...FONTS.bold },
  empty: { textAlign: "center", color: COLORS.muted, fontSize: SIZES.md },
  row: { flexDirection: "row", marginBottom: SPACING.md, gap: SPACING.sm, alignItems: "flex-start" },
  replyRow: { marginLeft: 44, marginBottom: SPACING.sm },
  avatar: { width: 34, height: 34, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  avatarSmall: { width: 26, height: 26, borderRadius: RADIUS.full },
  avatarText: { ...TYPOGRAPHY.smallBold, color: COLORS.text },
  content: { flex: 1 },
  msg: { ...TYPOGRAPHY.caption, color: COLORS.text },
  user: { ...FONTS.bold },
  time: { ...TYPOGRAPHY.small, color: COLORS.muted, marginTop: SPACING.xs },
  delHint: { ...TYPOGRAPHY.small, color: COLORS.muted, paddingLeft: SPACING.xs, paddingTop: SPACING.xs },
  commentActions: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginTop: SPACING.xs },
  actionBtn: { paddingVertical: SPACING.xs },
  actionText: { ...TYPOGRAPHY.small, color: COLORS.muted },
  replyInputRow: { flexDirection: "row", alignItems: "center", marginLeft: 44, marginBottom: SPACING.sm, gap: SPACING.xs },
  replyInput: { flex: 1, height: 32, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceLight, paddingHorizontal: SPACING.md, ...TYPOGRAPHY.caption, color: COLORS.text },
  replySendBtn: { width: 32, height: 32, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  replySendText: { ...TYPOGRAPHY.label, color: COLORS.text },
  repliesToggle: { marginLeft: 44, marginBottom: SPACING.sm },
  repliesToggleText: { ...TYPOGRAPHY.smallBold, color: COLORS.primary },
  inputRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, borderTopWidth: 0.5, borderTopColor: COLORS.border, gap: SPACING.sm, backgroundColor: COLORS.bg },
  input: { flex: 1, height: 38, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceLight, paddingHorizontal: SPACING.lg, ...TYPOGRAPHY.body, color: COLORS.text },
  postBtn: { ...TYPOGRAPHY.captionBold, color: COLORS.gold, opacity: 0.5 },
  postBtnActive: { opacity: 1 },
  linkHash: { color: COLORS.gold, ...FONTS.semiBold },
  linkMention: { color: COLORS.primary, ...FONTS.semiBold },
});
