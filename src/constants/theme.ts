import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const COLORS = {
  // Brand
  primary: "#C1121F",
  primary_dim: "#7D0A12",
  primary_glow: "rgba(193, 18, 31, 0.2)",
  primary_subtle: "rgba(193, 18, 31, 0.08)",

  // Surfaces
  background: "#0D0D0D",
  surface: "#1A1A1A",
  surface2: "#242424",
  surface3: "#2E2E2E",
  border: "#2E2E2E",
  border_subtle: "#1F1F1F",

  // Text
  text_primary: "#F5F5F5",
  text_secondary: "#AAAAAA",
  text_muted: "#666666",
  text_disabled: "#444444",

  // Semantic
  success: "#22C55E",
  success_dim: "rgba(34, 197, 94, 0.15)",
  warning: "#F59E0B",
  warning_dim: "rgba(245, 158, 11, 0.15)",
  danger: "#EF4444",
  danger_dim: "rgba(239, 68, 68, 0.15)",
  info: "#3B82F6",
  info_dim: "rgba(59, 130, 246, 0.15)",
  accent: "#FF6B6B",

  // Status
  critical: "#FF3B3B",
  critical_dim: "rgba(255, 59, 59, 0.15)",
  escalated: "#F97316",
  escalated_dim: "rgba(249, 115, 22, 0.15)",

  // Urgency
  urgency_low: "#22C55E",
  urgency_medium: "#F59E0B",
  urgency_critical: "#EF4444",

  // Blood groups
  blood_a_pos: "#E53E3E",
  blood_a_neg: "#C53030",
  blood_b_pos: "#DD6B20",
  blood_b_neg: "#C05621",
  blood_ab_pos: "#805AD5",
  blood_ab_neg: "#6B46C1",
  blood_o_pos: "#3182CE",
  blood_o_neg: "#2C5282",

  // UI
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(0, 0, 0, 0.7)",
  overlay_light: "rgba(0, 0, 0, 0.4)",
  shimmer_base: "#1E1E1E",
  shimmer_highlight: "#2A2A2A",

  // Gradient stops
  gradient_start: "#C1121F",
  gradient_end: "#7D0A12",

  // Light theme (future)
  light_primary: "#C1121F",
  light_background: "#F5F5F5",
  light_surface: "#FFFFFF",
  light_border: "#E0E0E0",
  light_text_primary: "#1A1A1A",
  light_text_muted: "#555555",
};

export const SIZES = {
  // global sizes
  base: 4,
  font: 15,
  radius: 12,
  padding: 24,

  // font sizes
  h1: 28,
  h2: 22,
  h3: 18,
  h4: 16,
  body: 15,
  body3: 13,
  caption: 12,
  label: 13,

  // app dimensions
  width,
  height,
};

export const FONTS = {
  h1: { fontFamily: "System", fontWeight: "bold" as const, fontSize: SIZES.h1, lineHeight: 36 },
  h2: { fontFamily: "System", fontWeight: "600" as const, fontSize: SIZES.h2, lineHeight: 30 },
  h3: { fontFamily: "System", fontWeight: "600" as const, fontSize: SIZES.h3, lineHeight: 22 },
  h4: { fontFamily: "System", fontWeight: "500" as const, fontSize: SIZES.h4, lineHeight: 20 },
  body: { fontFamily: "System", fontWeight: "400" as const, fontSize: SIZES.body, lineHeight: 22 },
  body2: { fontFamily: "System", fontWeight: "400" as const, fontSize: 14, lineHeight: 20 },
  body3: { fontFamily: "System", fontWeight: "400" as const, fontSize: SIZES.body3, lineHeight: 18 },
  caption: {
    fontFamily: "System",
    fontWeight: "400" as const,
    fontSize: SIZES.caption,
    lineHeight: 16,
  },
  label: { fontFamily: "System", fontWeight: "500" as const, fontSize: SIZES.label, lineHeight: 18 },
};

export const SPACING = {
  xs: SIZES.base, // 4
  s: SIZES.base * 2, // 8
  m: SIZES.base * 3, // 12
  l: SIZES.base * 4, // 16
  xl: SIZES.base * 5, // 20
  xxl: SIZES.base * 6, // 24
  xxxl: SIZES.base * 8, // 32
  xxxxl: SIZES.base * 10, // 40
  xxxxxl: SIZES.base * 12, // 48
};

export const SHADOWS = {
  light: {
    shadowColor: COLORS.background,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.background,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4.65,
    elevation: 8,
  },
  dark: {
    shadowColor: COLORS.background,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.2,
    shadowRadius: 9.51,
    elevation: 15,
  },
};

export const RADII = {
  xs: 4,
  s: 6,
  m: 10,
  l: 14,
  xl: 20,
  xxl: 28,
  full: 999,
};

const appTheme = { COLORS, SIZES, FONTS, SPACING, SHADOWS, RADII };

export default appTheme;
