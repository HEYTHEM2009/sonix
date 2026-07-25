import { View, StyleSheet } from "react-native";
import { COLORS, SPACING } from "../DesignSystem";

export default function Divider({ style, marginVertical = SPACING.md }) {
  return <View style={[styles.divider, { marginVertical }, style]} />;
}

function SectionHeader({ title, action, style }) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={styles.sectionLine} />
      <View style={styles.sectionLabel}>
        <View style={styles.sectionDot} />
        <View style={styles.sectionTitle}>
          <View style={styles.sectionTitle} />
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  divider: { height: 0.5, backgroundColor: COLORS.border, marginHorizontal: SPACING.lg },
});
