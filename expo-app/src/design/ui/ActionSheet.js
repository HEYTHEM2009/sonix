import { View, Text, TouchableOpacity, Modal, StyleSheet, Animated } from "react-native";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from "../DesignSystem";
import { useLanguage } from "../../context/LanguageContext";

export default function ActionSheet({ visible, onClose, options = [], title }) {
  const { t } = useLanguage();
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slide, { toValue: visible ? 1 : 0, tension: 60, friction: 12, useNativeDriver: true }).start();
  }, [visible, slide]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }] }]}>
          {title && <Text style={styles.title}>{title}</Text>}
          {options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.option, opt.destructive && styles.destructive]}
              onPress={() => { onClose(); opt.onPress?.(); }}
              activeOpacity={0.7}
            >
              {opt.icon && <Text style={styles.optionIcon}>{opt.icon}</Text>}
              <Text style={[styles.optionText, opt.destructive && { color: COLORS.danger }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.cancel} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelText}>{t("cancel")}</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: "flex-end" },
  sheet: { backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, paddingBottom: SPACING.xxxl, paddingTop: SPACING.xl, ...SHADOWS.lg },
  title: { ...TYPOGRAPHY.bodyBold, color: COLORS.textSecondary, textAlign: "center", marginBottom: SPACING.lg, textTransform: "uppercase", letterSpacing: 0.5 },
  option: { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl },
  destructive: {},
  optionIcon: { fontSize: 20, marginRight: SPACING.md, width: 24, textAlign: "center" },
  optionText: { ...TYPOGRAPHY.body, color: COLORS.text, flex: 1 },
  cancel: { marginTop: SPACING.sm, paddingVertical: SPACING.lg, alignItems: "center", borderTopWidth: 0.5, borderTopColor: COLORS.border, marginHorizontal: SPACING.xl },
  cancelText: { ...TYPOGRAPHY.bodyBold, color: COLORS.primaryLight },
});
