import { View, Text, TouchableOpacity, Modal, StyleSheet, Animated } from "react-native";
import { useEffect, useRef, useCallback } from "react";
import Icon from "./Icon";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GLASS } from "../DesignSystem";
import { useLanguage } from "../../context/LanguageContext";

export default function ActionSheet({ visible, onClose, options = [], title }) {
  const { t } = useLanguage();
  const slide = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slide, { toValue: 1, tension: 60, friction: 12, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slide, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, slide, backdropOpacity]);

  const handlePress = useCallback((optOnPress) => {
    onClose();
    optOnPress?.();
  }, [onClose]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose}>
          <Animated.View style={[styles.sheet, { transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }] }]}>
            {title && <Text style={styles.title}>{title}</Text>}
            {options.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.option, opt.destructive && styles.destructive]}
                onPress={() => handlePress(opt.onPress)}
                activeOpacity={0.7}
              >
                {opt.icon && <Icon name={opt.icon} size="md" color={opt.destructive ? COLORS.danger : COLORS.text} style={{ marginRight: SPACING.md, width: 24 }} />}
                <Text style={[styles.optionText, opt.destructive && { color: COLORS.danger }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancel} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: "flex-end" },
  backdropTouch: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: GLASS.default.backgroundColor,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingBottom: SPACING.xxxl,
    paddingTop: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderBottomWidth: 0,
    ...SHADOWS.lg,
  },
  title: { ...TYPOGRAPHY.bodyBold, color: COLORS.textSecondary, textAlign: "center", marginBottom: SPACING.lg, textTransform: "uppercase", letterSpacing: 0.5 },
  option: { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl, minHeight: 48 },
  destructive: {},
  optionText: { ...TYPOGRAPHY.body, color: COLORS.text, flex: 1 },
  cancel: { marginTop: SPACING.md, paddingVertical: SPACING.lg, alignItems: "center", borderTopWidth: 0.5, borderTopColor: COLORS.borderLight, marginHorizontal: SPACING.xl, minHeight: 48 },
  cancelText: { ...TYPOGRAPHY.bodyBold, color: COLORS.primaryLight },
});
