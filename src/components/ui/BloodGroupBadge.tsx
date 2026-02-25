import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { COLORS } from "../../constants/theme";

const BLOOD_COLORS: Record<string, { bg: string; text: string }> = {
  "A+": { bg: "rgba(229, 62, 62, 0.18)", text: "#FC8181" },
  "A-": { bg: "rgba(197, 48, 48, 0.18)", text: "#FEB2B2" },
  "B+": { bg: "rgba(221, 107, 32, 0.18)", text: "#F6AD55" },
  "B-": { bg: "rgba(192, 86, 33, 0.18)", text: "#FBD38D" },
  "AB+": { bg: "rgba(128, 90, 213, 0.18)", text: "#B794F4" },
  "AB-": { bg: "rgba(107, 70, 193, 0.18)", text: "#D6BCFA" },
  "O+": { bg: "rgba(49, 130, 206, 0.18)", text: "#63B3ED" },
  "O-": { bg: "rgba(44, 82, 130, 0.18)", text: "#90CDF4" },
};

interface Props {
  group: string;
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
}

export const BloodGroupBadge: React.FC<Props> = ({
  group,
  size = "md",
  style,
}) => {
  const colors = BLOOD_COLORS[group] ?? {
    bg: COLORS.surface2,
    text: COLORS.text_muted,
  };
  const dim = size === "sm" ? 28 : size === "lg" ? 48 : 36;
  const fontSize = size === "sm" ? 10 : size === "lg" ? 16 : 12;

  return (
    <View
      style={[
        styles.badge,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: colors.bg,
        },
        style,
      ]}
    >
      <Text
        style={[styles.text, { color: colors.text, fontSize }]}
        numberOfLines={1}
      >
        {group}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  text: {
    fontFamily: "Inter-Bold",
    lineHeight: undefined,
  },
});
