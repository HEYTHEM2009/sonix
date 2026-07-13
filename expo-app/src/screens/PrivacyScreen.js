import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../context/LanguageContext";
import { COLORS, SIZES, FONTS } from "../components/Theme";
import Screen3D from "../components/3D/Screen3D";

const CONTENT = {
  en: [
    { title: "Information We Collect", body: "We collect information you provide when creating an account: email, username, password. We also collect content you post, your interactions (likes, comments, follows), and basic usage data such as device type and app version." },
    { title: "How We Use Your Information", body: "We use your data to operate and improve Sonix: show your profile to others, display posts in feeds, send notifications you opt into, and provide customer support." },
    { title: "Data Sharing", body: "We do not sell your personal data. We may share data with service providers that help run the app (hosting, analytics) who are bound by strict confidentiality agreements." },
    { title: "Data Retention", body: "We retain your data as long as your account is active. If you delete your account, your data is permanently removed within 30 days. Backup copies may persist up to 90 days." },
    { title: "Your Rights", body: "You can access, update, or delete your data at any time via Settings. You can control who sees your content via Private Account and block users." },
    { title: "Cookies & Tracking", body: "We use essential tokens for authentication (Sanctum tokens). We do not use third-party tracking cookies. Session data is stored securely on our servers." },
    { title: "Children's Privacy", body: "Sonix is not intended for children under 13. We do not knowingly collect data from children. If we discover such data, we delete it immediately." },
    { title: "Contact Us", body: "For privacy questions, contact us through the Help Center in Settings or send a message via the Report a Problem feature." },
  ],
  ar: [
    { title: "المعلومات التي نجمعها", body: "نجمع المعلومات التي تقدمها عند إنشاء حساب: البريد الإلكتروني، اسم المستخدم، كلمة المرور. كما نجمع المحتوى الذي تنشره، تفاعلاتك (إعجابات، تعليقات، متابعات)، وبيانات الاستخدام الأساسية مثل نوع الجهاز وإصدار التطبيق." },
    { title: "كيف نستخدم معلوماتك", body: "نستخدم بياناتك لتشغيل وتحسين Sonix: عرض ملفك للآخرين، عرض المنشورات في الخلاصات، إرسال الإشعارات التي اشتركت فيها، وتقديم الدعم الفني." },
    { title: "مشاركة البيانات", body: "نحن لا نبيع بياناتك الشخصية. قد نشارك البيانات مع مزودي الخدمة الذين يساعدون في تشغيل التطبيق (الاستضافة، التحليلات) وهم ملزمون باتفاقيات سرية صارمة." },
    { title: "الاحتفاظ بالبيانات", body: "نحتفظ ببياناتك طالما حسابك نشط. إذا حذفت حسابك، تُحذف بياناتك نهائياً خلال 30 يوماً. قد تبقى النسخ الاحتياطية لمدة تصل إلى 90 يوماً." },
    { title: "حقوقك", body: "يمكنك الوصول إلى بياناتك أو تحديثها أو حذفها في أي وقت من خلال الإعدادات. يمكنك التحكم في من يرى محتواك عبر الحساب الخاص وحظر المستخدمين." },
    { title: "ملفات تعريف الارتباط والتتبع", body: "نستخدم الرموز الأساسية للمصادقة (Sanctum tokens). لا نستخدم ملفات تتبع من أطراف ثالثة. يتم تخزين بيانات الجلسة بشكل آمن على خوادمنا." },
    { title: "خصوصية الأطفال", body: "Sonix غير موجه للأطفال تحت سن 13. لا نجمع بيانات من الأطفال عن علم. إذا اكتشفنا مثل هذه البيانات، نحذفها فوراً." },
    { title: "اتصل بنا", body: "للاستفسارات حول الخصوصية، اتصل بنا من خلال مركز المساعدة في الإعدادات أو أرسل رسالة عبر ميزة الإبلاغ عن مشكلة." },
  ],
};

export default function PrivacyScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { lang, t } = useLanguage();
  const sections = CONTENT[lang] || CONTENT.en;

  return (
    <Screen3D style={[s.wrap, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t("privacyPolicy")}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <Text style={s.date}>Last updated: July 2026</Text>
        {sections.map((sec, i) => (
          <View key={i} style={s.section}>
            <Text style={s.heading}>{sec.title}</Text>
            <Text style={s.body}>{sec.body}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen3D>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 8 },
  backBtn: { fontSize: 22, color: COLORS.text },
  title: { fontSize: SIZES.lg, ...FONTS.semiBold, color: COLORS.text },
  date: { fontSize: 12, color: COLORS.muted, marginBottom: 20, marginTop: 8 },
  section: { marginBottom: 20 },
  heading: { fontSize: 16, ...FONTS.semiBold, color: COLORS.text, marginBottom: 6 },
  body: { fontSize: 14, color: COLORS.muted, lineHeight: 22 },
});
