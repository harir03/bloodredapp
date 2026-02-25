import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import { COLORS, FONTS } from "../../constants/theme";

interface KPICardProps {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  trend?: number; // positive = up, negative = down
  onPress?: () => void;
  style?: ViewStyle;
  compact?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  icon,
  color = COLORS.primary,
  trend,
  onPress,
  style,
  compact = false,
}) => {
  const dimColor = color + "22";

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      style={[styles.card, compact && styles.compact, style]}
    >
      <View style={[styles.iconBox, { backgroundColor: dimColor }]}>
        <Ionicons name={icon} size={compact ? 18 : 22} color={color} />
      </View>
      <Text style={[styles.value, compact && styles.valueSmall]}>{value}</Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      {trend !== undefined && (
        <View style={styles.trend}>
          <Ionicons
            name={trend >= 0 ? "trending-up" : "trending-down"}
            size={12}
            color={trend >= 0 ? COLORS.success : COLORS.danger}
          />
          <Text
            style={[
              styles.trendText,
              { color: trend >= 0 ? COLORS.success : COLORS.danger },
            ]}
          >
            {Math.abs(trend)}%
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
    minWidth: 120,
  },
  compact: {
    padding: 12,
    borderRadius: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  value: {
    ...FONTS.h2,
    color: COLORS.text_primary,
    marginBottom: 4,
  },
  valueSmall: {
    ...FONTS.h3,
  },
  label: {
    ...FONTS.caption,
    color: COLORS.text_muted,
    lineHeight: 15,
  },
  trend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 6,
  },
  trendText: {
    fontFamily: "Inter-Medium",
    fontSize: 11,
  },
});
