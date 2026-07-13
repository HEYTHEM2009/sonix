import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../context/LanguageContext";
import { COLORS, SIZES, FONTS } from "../components/Theme";
import Screen3D from "../components/3D/Screen3D";

const CONTENT = {
  en: [
    { title: "Acceptance of Terms", body: "By creating an account or using Sonix, you agree to these Terms of Service. If you do not agree, do not use the app." },
    { title: "Eligibility", body: "You must be at least 13 years old to use Sonix. By creating an account, you confirm that you meet this age requirement." },
    { title: "Account Responsibility", body: "You are solely responsible for maintaining the confidentiality of your login credentials and for all activity under your account. Notify us immediately of any unauthorized use." },
    { title: "Prohibited Conduct", body: "You agree not to: post hateful or harassing content; impersonate others; spam or manipulate engagement; share illegal material; violate others' intellectual property rights." },
    { title: "Content Ownership", body: "You retain ownership of content you post. By posting on Sonix, you grant us a non-exclusive, royalty-free license to display and distribute your content within the app." },
    { title: "Termination", body: "We reserve the right to suspend or terminate accounts that violate these terms, without prior notice. You may delete your account at any time from Settings." },
    { title: "Limitation of Liability", body: "Sonix is provided 'as is' without warranties. We are not liable for damages arising from your use of the app, including loss of data or interruptions." },
    { title: "Changes to Terms", body: "We may update these terms at any time. Continued use after changes constitutes acceptance. You will be notified of material changes via the app." },
  ],
  ar: [
    { title: "قبول الشروط", body: "بإنشاء حساب أو استخدام Sonix، فإنك توافق على شروط الخدمة هذه. إذا كنت لا توافق، فلا تستخدم التطبيق." },
    { title: "الأهلية", body: "يجب أن يكون عمرك 13 عاماً على الأقل لاستخدام Sonix. بإنشاء حساب، فإنك تؤكد أنك تستوفي هذا الشرط." },
    { title: "مسؤولية الحساب", body: "أنت المسؤول الوحيد عن الحفاظ على سرية بيانات تسجيل الدخول وعن جميع الأنشطة تحت حسابك. أبلغنا فوراً عن أي استخدام غير مصرح به." },
    { title: "السلوك المحظور", body: "توافق على عدم: نشر محتوى مسيء أو تحريضي؛ انتحال شخصيات الآخرين؛ إرسال رسائل مزعجة؛ مشاركة مواد غير قانونية؛ انتهاك حقوق الملكية الفكرية للآخرين." },
    { title: "ملكية المحتوى", body: "تحتفظ بملكية المحتوى الذي تنشره. بالنشر على Sonix، تمنحنا ترخيصاً غير حصري لعرض وتوزيع محتواك داخل التطبيق." },
    { title: "إنهاء الحساب", body: "نحتفظ بالحق في تعليق أو إنهاء الحسابات التي تخالف هذه الشروط دون إشعار مسبق. يمكنك حذف حسابك في أي وقت من الإعدادات." },
    { title: "حدود المسؤولية", body: "Sonix يُقدم 'كما هو' دون ضمانات. نحن غير مسؤولين عن الأضرار الناتجة عن استخدامك للتطبيق، بما في ذلك فقدان البيانات أو الانقطاعات." },
    { title: "تغييرات الشروط", body: "قد نقوم بتحديث هذه الشروط في أي وقت. الاستمرار في الاستخدام بعد التغييرات يعني القبول. سيتم إشعارك بالتغييرات الجوهرية عبر التطبيق." },
  ],
};

export default function TermsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { lang, t } = useLanguage();
  const sections = CONTENT[lang] || CONTENT.en;

  return (
    <Screen3D style={[s.wrap, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t("termsOfService")}</Text>
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
