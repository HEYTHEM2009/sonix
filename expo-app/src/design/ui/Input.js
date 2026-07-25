import { useState, useRef, useCallback } from "react";
import { View, Text, TextInput, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, GLASS } from "../DesignSystem";

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  multiline = false,
  numberOfLines = 1,
  icon,
  error,
  hint,
  disabled = false,
  autoCapitalize = "none",
  keyboardType = "default",
  returnKeyType,
  onSubmitEditing,
  inputRef,
  maxLength,
  glass = false,
  style,
  inputStyle,
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const onFocus = useCallback(() => {
    setFocused(true);
    Animated.parallel([
      Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(glowAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
    ]).start();
  }, [borderAnim, glowAnim]);

  const onBlur = useCallback(() => {
    setFocused(false);
    Animated.parallel([
      Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
      Animated.timing(glowAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();
  }, [borderAnim, glowAnim]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.inputBorder, COLORS.inputFocusBorder],
  });

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, error && { color: COLORS.danger }]}>{label}</Text>}
      <Animated.View style={[
        styles.inputWrap,
        glass && GLASS.default,
        { borderColor: error ? COLORS.danger : focused ? COLORS.inputFocusBorder : glass ? COLORS.glassBorder : COLORS.inputBorder },
        glass && { backgroundColor: GLASS.default.backgroundColor },
        multiline && styles.multiline,
        disabled && styles.disabled,
      ]}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            glass && { backgroundColor: "transparent" },
            icon && { paddingLeft: SPACING.sm },
            multiline && { minHeight: numberOfLines * 22, textAlignVertical: "top" },
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          editable={!disabled}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          maxLength={maxLength}
          onFocus={onFocus}
          onBlur={onBlur}
          accessibilityLabel={label || placeholder}
          {...props}
        />
        {maxLength && (
          <Text style={[styles.counter, { color: (value?.length || 0) > maxLength * 0.9 ? COLORS.danger : COLORS.muted }]}>
            {value?.length || 0}/{maxLength}
          </Text>
        )}
      </Animated.View>
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

export function SearchInput({ placeholder, value, onChangeText, onClear, style, glass = true }) {
  return (
    <View style={[glass ? styles.glassSearchWrap : styles.searchWrap, style]}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholder}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        accessibilityLabel={placeholder}
      />
      {value?.length > 0 && onClear && (
        <TouchableOpacity onPress={onClear} style={styles.clearBtn} accessibilityRole="button" accessibilityLabel="Clear search">
          <Text style={styles.clearIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.lg },
  label: { ...TYPOGRAPHY.captionBold, color: COLORS.textSecondary, marginBottom: SPACING.sm, marginLeft: 2 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.input,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: SPACING.md,
    minHeight: 50,
  },
  multiline: { paddingTop: SPACING.md, alignItems: "flex-start" },
  disabled: { opacity: 0.5 },
  input: { flex: 1, color: COLORS.text, fontSize: 15, paddingVertical: SPACING.md - 2, backgroundColor: "transparent" },
  icon: { fontSize: 18, marginRight: SPACING.sm, opacity: 0.6 },
  counter: { fontSize: 11, marginLeft: SPACING.sm },
  error: { ...TYPOGRAPHY.small, color: COLORS.danger, marginTop: SPACING.xs, marginLeft: 2 },
  hint: { ...TYPOGRAPHY.small, color: COLORS.muted, marginTop: SPACING.xs, marginLeft: 2 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.input,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  glassSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GLASS.default.backgroundColor,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    height: 46,
    borderWidth: 1,
    borderColor: GLASS.default.borderColor,
  },
  searchIcon: { fontSize: 16, marginRight: SPACING.sm, opacity: 0.6 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 15, paddingVertical: 0 },
  clearBtn: { padding: SPACING.xs },
  clearIcon: { fontSize: 14, color: COLORS.muted },
});
