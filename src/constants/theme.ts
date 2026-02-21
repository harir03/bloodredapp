import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const COLORS = {
  primary: "#C1121F",
  primary_dim: "#7D0A12",
  background: "#0D0D0D",
  surface: "#1A1A1A",
  surface2: "#242424",
  border: "#2E2E2E",
  text_primary: "#F5F5F5",
  text_muted: "#888888",
  success: "#2ECC71",
  warning: "#F39C12",
  danger: "#E74C3C",
  info: "#3498DB",
  accent: "#FF6B6B",
  white: "#FFFFFF",
  text_secondary: "#AAAAAA",

  // Light theme colors (optional, for future use)
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
  h1: { fontFamily: "Inter-Bold", fontSize: SIZES.h1, lineHeight: 36 },
  h2: { fontFamily: "Inter-SemiBold", fontSize: SIZES.h2, lineHeight: 30 },
  h3: { fontFamily: "Inter-SemiBold", fontSize: SIZES.h3, lineHeight: 22 },
  h4: { fontFamily: "Inter-Medium", fontSize: SIZES.h4, lineHeight: 20 },
  body: { fontFamily: "Inter-Regular", fontSize: SIZES.body, lineHeight: 22 },
  body3: { fontFamily: "Inter-Regular", fontSize: SIZES.body3, lineHeight: 18 },
  caption: {
    fontFamily: "Inter-Regular",
    fontSize: SIZES.caption,
    lineHeight: 16,
  },
  label: { fontFamily: "Inter-Medium", fontSize: SIZES.label, lineHeight: 18 },
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

const appTheme = { COLORS, SIZES, FONTS, SPACING, SHADOWS };

export default appTheme;
