// File: src/theme/theme.ts
export const Colors = {
  // TEMA NAVY BLUE (existing - tidak diubah)
  primary: "#0F172A",
  primaryDark: "#020617",
  primaryLight: "#1E293B",

  accent: "#22D3EE",
  accentDark: "#0EA5E9",
  accentLight: "#67E8F9",

  background: "#0F172A",
  surface: "#1E293B",
  surfaceLight: "#334155",
  surfaceDark: "#0F172A",

  // Text Colors
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textTertiary: "#94A3B8",
  textDisabled: "#64748B",

  // Border Colors
  border: "#334155",
  borderLight: "#475569",
  borderDark: "#1E293B",

  // Status Colors
  success: "#10B981",
  successLight: "#34D399",
  successDark: "#059669",

  warning: "#F59E0B",
  warningLight: "#FBBF24",
  warningDark: "#D97706",

  error: "#EF4444",
  errorLight: "#F87171",
  errorDark: "#DC2626", // <-- SUDAH ADA DI TEMA

  info: "#3B82F6",
  infoLight: "#60A5FA",
  infoDark: "#2563EB",

  // Special Colors - SUDAH ADA
  purple: "#8B5CF6",
  purpleLight: "#A78BFA",
  purpleDark: "#7C3AED",

  pink: "#EC4899",
  pinkLight: "#F472B6",
  pinkDark: "#DB2777",

  // Neutral Colors - SUDAH ADA
  gray50: "#F8FAFC",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray300: "#CBD5E1",
  gray400: "#94A3B8",
  gray500: "#64748B",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1E293B",
  gray900: "#0F172A",

  // Opacity Variants - SUDAH ADA
  transparent: "transparent",
  white: "#FFFFFF",
  black: "#000000",

  // Gradients - SUDAH ADA
  gradient: {
    primary: ["#0F172A", "#1E293B", "#334155"],
    accent: ["#22D3EE", "#0EA5E9", "#0284C7"],
    success: ["#10B981", "#34D399", "#059669"],
    purple: ["#8B5CF6", "#7C3AED", "#6D28D9"],
  },

  // Shadow colors - SUDAH ADA
  shadow: {
    light: "rgba(15, 23, 42, 0.8)",
    medium: "rgba(2, 6, 23, 0.9)",
    dark: "rgba(0, 0, 0, 0.95)",
  },
};

export const Theme = {
  colors: Colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    round: 9999,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: "800" as const,
      lineHeight: 40,
      color: Colors.textPrimary,
    },
    h2: {
      fontSize: 26,
      fontWeight: "700" as const,
      lineHeight: 34,
      color: Colors.textPrimary,
    },
    h3: {
      fontSize: 20,
      fontWeight: "600" as const,
      lineHeight: 28,
      color: Colors.textPrimary,
    },
    body: {
      fontSize: 16,
      fontWeight: "400" as const,
      lineHeight: 24,
      color: Colors.textSecondary,
    },
    caption: {
      fontSize: 14,
      fontWeight: "400" as const,
      lineHeight: 20,
      color: Colors.textTertiary,
    },
    small: {
      fontSize: 12,
      fontWeight: "400" as const,
      lineHeight: 16,
      color: Colors.textTertiary,
    },
  },
};
