import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { COLORS } from "../../constants/theme";

const CONFIG = {
  critical: {
    bg: COLORS.critical_dim,
    text: COLORS.critical,
    label: "CRITICAL",
  },
  medium: { bg: COLORS.warning_dim, text: COLORS.warning, label: "MEDIUM" },
  low: { bg: COLORS.success_dim, text: COLORS.success, label: "LOW" },
  // request statuses
  pending: { bg: COLORS.warning_dim, text: COLORS.warning, label: "PENDING" },
  in_progress: { bg: COLORS.info_dim, text: COLORS.info, label: "IN PROGRESS" },
  completed: {
    bg: COLORS.success_dim,
    text: COLORS.success,
    label: "COMPLETED",
  },
  escalated: {
    bg: COLORS.escalated_dim,
    text: COLORS.escalated,
    label: "ESCALATED",
  },
  cancelled: { bg: COLORS.danger_dim, text: COLORS.danger, label: "CANCELLED" },
  // task statuses
  overdue: { bg: COLORS.danger_dim, text: COLORS.danger, label: "OVERDUE" },
  assigned: { bg: COLORS.info_dim, text: COLORS.info, label: "ASSIGNED" },
} as Record<string, { bg: string; text: string; label: string }>;

interface Props {
  value: string;
  style?: ViewStyle;
  uppercase?: boolean;
}

export const StatusPill: React.FC<Props> = ({
  value,
  style,
  uppercase = true,
}) => {
  const cfg = CONFIG[value] ?? {
    bg: COLORS.surface2,
    text: COLORS.text_muted,
    label: value,
  };
  return (
    <View style={[styles.pill, { backgroundColor: cfg.bg }, style]}>
      <Text style={[styles.text, { color: cfg.text }]}>
        {uppercase ? cfg.label : value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: "Inter-SemiBold",
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
