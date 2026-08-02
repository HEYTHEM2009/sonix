import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import client from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import { COLORS, SIZES, FONTS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, GLASS, LAYOUT } from "../design/DesignSystem";
import Icon from "../design/ui/Icon";
import Screen3D from "../components/3D/Screen3D";

const TABS = ["feedback", "reportContent"];

export default function ReportProblemScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [tab, setTab] = useState("feedback");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [reportType, setReportType] = useState("post");
  const [reportTargetId, setReportTargetId] = useState("");
  const [reportReason, setReportReason] = useState("");

  const handleSendFeedback = async () => {
    if (!subject.trim() || !message.trim()) return Alert.alert(t("error"), t("fillAllFields"));
    setSending(true);
    try {
      await client.post("/support/feedback", { subject, message });
      Alert.alert(t("success"), t("feedbackSent"));
      setSubject("");
      setMessage("");
    } catch {
      Alert.alert(t("error"), t("feedbackFailed"));
    }
    setSending(false);
  };

  const handleSendReport = async () => {
    if (!reportTargetId.trim() || !reportReason.trim()) return Alert.alert(t("error"), t("fillAllFields"));
    setSending(true);
    try {
      await client.post("/reports", {
        type: reportType,
        id: parseInt(reportTargetId.trim(), 10),
        reason: reportReason.trim(),
      });
      Alert.alert(t("success"), t("reportSubmitted") || "Report submitted");
      setReportTargetId("");
      setReportReason("");
    } catch (e) {
      const msg = e?.response?.data?.message;
      Alert.alert(t("error"), msg || t("reportFailed") || "Could not submit report");
    }
    setSending(false);
  };

  return (
    <Screen3D style={[s.wrap, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={s.title}>{t("reportProblem")}</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.tabRow}>
        {TABS.map((key) => (
          <TouchableOpacity
            key={key}
            style={[s.tab, tab === key && s.tabActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[s.tabText, tab === key && s.tabTextActive]}>
              {t(key + "Tab")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.lg }}>
        {tab === "feedback" ? (
          <View>
            <Text style={s.label}>{t("subject")}</Text>
            <TextInput
              style={s.input}
              value={subject}
              onChangeText={setSubject}
              placeholder={t("subjectPlaceholder")}
              placeholderTextColor={COLORS.muted}
              maxLength={255}
            />

            <Text style={s.label}>{t("message")}</Text>
            <TextInput
              style={[s.input, s.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder={t("messagePlaceholder")}
              placeholderTextColor={COLORS.muted}
              multiline
              textAlignVertical="top"
              maxLength={5000}
            />

            <TouchableOpacity
              style={s.sendBtn}
              onPress={handleSendFeedback}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <Text style={s.sendBtnText}>{t("send")}</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {[1, 2, 3].map((i) => (
              <View key={i} style={s.reportItem}>
                <Text style={s.reportItemTitle}>{t("reportExample" + i)}</Text>
                <Text style={s.reportItemDesc}>{t("reportExample" + i + "Desc")}</Text>
              </View>
            ))}

            <Text style={s.label}>{t("reportType") || "Content type"}</Text>
            <View style={s.typeRow}>
              {["post", "user"].map((ty) => (
                <TouchableOpacity
                  key={ty}
                  style={[s.typeBtn, reportType === ty && s.typeBtnActive]}
                  onPress={() => setReportType(ty)}
                >
                  <Text style={[s.typeBtnText, reportType === ty && s.typeBtnTextActive]}>{t(ty + "Label") || ty}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>{t("targetId") || "Content ID"}</Text>
            <TextInput
              style={s.input}
              value={reportTargetId}
              onChangeText={setReportTargetId}
              placeholder={t("targetIdPlaceholder") || "e.g. 123"}
              placeholderTextColor={COLORS.muted}
              keyboardType="numeric"
              maxLength={20}
            />

            <Text style={s.label}>{t("reason")}</Text>
            <TextInput
              style={[s.input, s.textArea]}
              value={reportReason}
              onChangeText={setReportReason}
              placeholder={t("reportReasonPlaceholder") || "Describe the issue"}
              placeholderTextColor={COLORS.muted}
              multiline
              textAlignVertical="top"
              maxLength={255}
            />

            <TouchableOpacity style={s.sendBtn} onPress={handleSendReport} disabled={sending}>
              {sending ? <ActivityIndicator color={COLORS.text} /> : <Text style={s.sendBtnText}>{t("submitReport") || t("send")}</Text>}
            </TouchableOpacity>
            <Text style={s.reportNote}>{t("reportNote")}</Text>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </Screen3D>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, ...GLASS.default },
  backBtn: { fontSize: 22, color: COLORS.text },
  title: { fontSize: SIZES.lg, ...FONTS.semiBold, color: COLORS.text },
  tabRow: { flexDirection: "row", marginHorizontal: SPACING.lg, marginBottom: SPACING.md, backgroundColor: COLORS.input, borderRadius: RADIUS.md, padding: 3 },
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: "center", borderRadius: RADIUS.sm },
  tabActive: { backgroundColor: COLORS.card },
  tabText: { fontSize: 13, ...FONTS.medium, color: COLORS.muted },
  tabTextActive: { color: COLORS.gold, ...FONTS.semiBold },
  label: { fontSize: 14, ...FONTS.semiBold, color: COLORS.text, marginBottom: SPACING.xs, marginTop: SPACING.md },
  input: { backgroundColor: COLORS.input, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, color: COLORS.text, fontSize: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  textArea: { minHeight: 120 },
  sendBtn: { backgroundColor: COLORS.gold, borderRadius: RADIUS.md, paddingVertical: SPACING.md, alignItems: "center", marginTop: SPACING.sm },
  sendBtnText: { color: COLORS.text, ...FONTS.semiBold, fontSize: 16 },
  reportItem: { ...GLASS.elevated, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  reportItemTitle: { fontSize: 14, ...FONTS.semiBold, color: COLORS.text, marginBottom: SPACING.xxs },
  reportItemDesc: { fontSize: 13, color: COLORS.muted, lineHeight: 18 },
  typeRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.sm },
  typeBtn: { flex: 1, paddingVertical: SPACING.sm, alignItems: "center", borderRadius: RADIUS.md, backgroundColor: COLORS.input, borderWidth: 1, borderColor: COLORS.border },
  typeBtnActive: { backgroundColor: COLORS.card, borderColor: COLORS.gold },
  typeBtnText: { fontSize: 13, ...FONTS.medium, color: COLORS.muted },
  typeBtnTextActive: { color: COLORS.gold, ...FONTS.semiBold },
  reportNote: { fontSize: 12, color: COLORS.muted, textAlign: "center", marginTop: SPACING.md, fontStyle: "italic" },
});
