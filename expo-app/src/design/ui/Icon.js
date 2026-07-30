import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../DesignSystem";

const SIZE_MAP = { xs: 14, sm: 16, md: 20, lg: 24, xl: 28, xxl: 32, hero: 40 };

export default function Icon({ name, size = "md", color = COLORS.text, style }) {
  if (!name) return null;
  const px = SIZE_MAP[size] || size;
  if (/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
    return <Ionicons name={name} size={px} color={color} style={style} />;
  }
  return <Text style={[{ fontSize: px, color, lineHeight: px + 4 }, style]}>{name}</Text>;
}
