import React from "react";
import { StyleSheet, Text, ViewStyle } from "react-native";
import Animated, {
    useAnimatedStyle,
    withTiming,
} from "react-native-reanimated";
import { COLORS, FONTS, SIZES, SPACING } from "../../constants/theme";

type StatusType =
  | "Pending"
  | "Active"
  | "Completed"
  | "Escalated"
  | "Inactive"
  | "admin"
  | "city_manager"
  | "helpline"
  | "hr_manager"
  | "volunteer"
  | string; // fallback for unknown values

interface StatusBadgeProps {
  status: StatusType;
  style?: ViewStyle;
}

const statusConfig: Record<string, { backgroundColor: string; color: string }> =
  {
    // task / call statuses
    Pending: { backgroundColor: COLORS.warning, color: COLORS.background },
    Active: { backgroundColor: COLORS.info, color: COLORS.text_primary },
    Completed: { backgroundColor: COLORS.success, color: COLORS.text_primary },
    Escalated: { backgroundColor: COLORS.danger, color: COLORS.text_primary },
    Inactive: { backgroundColor: COLORS.text_muted, color: COLORS.background },
    // roles
    admin: { backgroundColor: COLORS.primary, color: COLORS.white },
    city_manager: { backgroundColor: COLORS.info, color: COLORS.white },
    helpline: { backgroundColor: COLORS.warning, color: COLORS.background },
    hr_manager: { backgroundColor: "#8B5CF6", color: COLORS.white },
    volunteer: { backgroundColor: COLORS.success, color: COLORS.white },
  };

const DEFAULT_CONFIG = {
  backgroundColor: COLORS.surface2,
  color: COLORS.text_muted,
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withTiming(1, { duration: 300 }) }],
      opacity: withTiming(1, { duration: 300 }),
    };
  });

  const { backgroundColor, color } = statusConfig[status] ?? DEFAULT_CONFIG;

  return (
    <Animated.View
      style={[styles.badge, { backgroundColor }, animatedStyle, style]}
    >
      <Text style={[styles.text, { color }]}>{status.replace(/_/g, " ")}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs,
    borderRadius: SIZES.radius,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    ...FONTS.label,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});

export default StatusBadge;
