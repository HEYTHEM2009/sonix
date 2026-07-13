import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../context/LanguageContext";
import { COLORS, SIZES, FONTS } from "../components/Theme";
import Screen3D from "../components/3D/Screen3D";

const FAQ_DATA = {
  en: [
    { q: "How do I create an account?", a: "Open the app, tap 'Sign Up', enter your email, username, and password. You'll be ready to explore Sonix in seconds." },
    { q: "How can I reset my password?", a: "On the login screen, tap 'Forgot Password'. Enter your email and follow the link sent to your inbox to set a new password." },
    { q: "How do I block or report someone?", a: "Go to the user's profile, tap the three-dot menu, and select 'Block' or 'Report'. Blocked users can be managed in Settings > Blocked Users." },
    { q: "Why can't I see someone's posts?", a: "They may have a private account, blocked you, or deactivated their account. You can send a follow request for private accounts." },
    { q: "How do I delete my account?", a: "Go to Settings > Danger Zone > Delete Account. Enter your password to confirm. This action is permanent and irreversible." },
    { q: "How do I save a post?", a: "Tap the bookmark icon below any post to save it. View saved posts from Settings > Saved Posts." },
    { q: "How does privacy work?", a: "You can toggle 'Private Account' in Settings. Private accounts require approval for new followers. Your existing followers stay." },
    { q: "Is Sonix free?", a: "Yes, Sonix is completely free to use. There are no subscription plans or hidden fees." },
  ],
  ar: [
    { q: "كيف يمكنني إنشاء حساب؟", a: "افتح التطبيق، اضغط 'إنشاء حساب'، أدخل بريدك الإلكتروني واسم المستخدم وكلمة المرور. ستكون جاهزاً لاستكشاف Sonix في ثوانٍ." },
    { q: "كيف يمكنني إعادة تعيين كلمة المرور؟", a: "في شاشة تسجيل الدخول، اضغط 'نسيت كلمة المرور'. أدخل بريدك الإلكتروني واتبع الرابط المرسل لتعيين كلمة مرور جديدة." },
    { q: "كيف أحظر أو أبلغ عن شخص ما؟", a: "اذهب إلى ملف المستخدم، اضغط على قائمة النقاط الثلاث، واختر 'حظر' أو 'إبلاغ'. يمكن إدارة المحظورين من الإعدادات > المستخدمون المحظورون." },
    { q: "لماذا لا أستطيع رؤية منشورات شخص ما؟", a: "قد يكون حسابه خاصاً، أو قام بحظرك، أو عطّل حسابه. يمكنك إرسال طلب متابعة للحسابات الخاصة." },
    { q: "كيف أحذف حسابي؟", a: "اذهب إلى الإعدادات > المنطقة الخطرة > حذف الحساب. أدخل كلمة المرور للتأكيد. هذا الإجراء نهائي ولا يمكن التراجع عنه." },
    { q: "كيف أحفظ منشوراً؟", a: "اضغط على أيقونة الإشارة المرجعية أسفل أي منشور لحفظه. شاهد المنشورات المحفوظة من الإعدادات > المنشورات المحفوظة." },
    { q: "كيف تعمل الخصوصية؟", a: "يمكنك تفعيل 'حساب خاص' في الإعدادات. الحسابات الخاصة تتطلب موافقة للمتابعين الجدد. متابعوك الحاليون يبقون كما هم." },
    { q: "هل Sonix مجاني؟", a: "نعم، Sonix مجاني تماماً للاستخدام. لا توجد خطط اشتراك أو رسوم مخفية." },
  ],
};

export default function HelpCenterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { lang, t } = useLanguage();
  const [openIndex, setOpenIndex] = useState(null);
  const faq = FAQ_DATA[lang] || FAQ_DATA.en;

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <Screen3D style={[s.wrap, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t("helpCenter")}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <Text style={s.intro}>{t("helpIntro")}</Text>

        {faq.map((item, i) => (
          <View key={i} style={[s.faqItem, openIndex === i && s.faqItemOpen]}>
            <TouchableOpacity style={s.faqHeader} onPress={() => toggle(i)} activeOpacity={0.7}>
              <Text style={s.faqQ}>{item.q}</Text>
              <Text style={s.faqArrow}>{openIndex === i ? "⌄" : "›"}</Text>
            </TouchableOpacity>
            {openIndex === i && (
              <View style={s.faqBody}>
                <Text style={s.faqA}>{item.a}</Text>
              </View>
            )}
          </View>
        ))}

        <Text style={s.contactTitle}>{t("contactSupport")}</Text>
        <Text style={s.contactText}>{t("helpContactDesc")}</Text>
      </ScrollView>
    </Screen3D>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 8 },
  backBtn: { fontSize: 22, color: COLORS.text },
  title: { fontSize: SIZES.lg, ...FONTS.semiBold, color: COLORS.text },
  intro: { fontSize: 14, color: COLORS.muted, lineHeight: 20, marginBottom: 20, marginTop: 8, textAlign: "center" },
  faqItem: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  faqItemOpen: { borderColor: COLORS.accent },
  faqHeader: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 14 },
  faqQ: { flex: 1, fontSize: 14, ...FONTS.semiBold, color: COLORS.text, lineHeight: 20 },
  faqArrow: { fontSize: 18, color: COLORS.muted, marginLeft: 8 },
  faqBody: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 0.5, borderTopColor: COLORS.border, paddingTop: 10 },
  faqA: { fontSize: 14, color: COLORS.muted, lineHeight: 20 },
  contactTitle: { fontSize: 16, ...FONTS.semiBold, color: COLORS.text, marginTop: 24, marginBottom: 6 },
  contactText: { fontSize: 13, color: COLORS.muted, lineHeight: 18 },
});
