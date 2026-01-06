// [file name]: src/theme/theme.ts
// [file content begin]
export const Colors = {
  // TEMA NAVY BLUE
  primary: "#0F172A", // Navy blue gelap
  primaryDark: "#020617", // Navy blue lebih gelap
  primaryLight: "#1E293B", // Navy blue medium

  accent: "#22D3EE", // Cyan terang
  accentDark: "#0EA5E9", // Cyan medium
  accentLight: "#67E8F9", // Cyan sangat terang

  background: "#0F172A", // Background navy blue gelap
  surface: "#1E293B", // Permukaan navy blue medium
  surfaceLight: "#334155", // Permukaan navy blue terang
  surfaceDark: "#0F172A", // Permukaan navy blue gelap

  // Text Colors
  textPrimary: "#F8FAFC", // Teks utama putih
  textSecondary: "#CBD5E1", // Teks sekunder abu-abu muda
  textTertiary: "#94A3B8", // Teks tersier abu-abu
  textDisabled: "#64748B", // Teks disabled

  // Border Colors
  border: "#334155", // Border navy blue terang
  borderLight: "#475569", // Border lebih terang
  borderDark: "#1E293B", // Border lebih gelap

  // Status Colors
  success: "#10B981", // Hijau
  successLight: "#34D399", // Hijau terang
  successDark: "#059669", // Hijau gelap

  warning: "#F59E0B", // Kuning
  warningLight: "#FBBF24", // Kuning terang
  warningDark: "#D97706", // Kuning gelap

  error: "#EF4444", // Merah
  errorLight: "#F87171", // Merah terang
  errorDark: "#DC2626", // Merah gelap

  info: "#3B82F6", // Biru terang
  infoLight: "#60A5FA", // Biru lebih terang
  infoDark: "#2563EB", // Biru gelap

  // Special Colors - TAMBAHKAN INI
  purple: "#8B5CF6", // Ungu
  purpleLight: "#A78BFA", // Ungu terang
  purpleDark: "#7C3AED", // Ungu gelap

  pink: "#EC4899", // Pink
  pinkLight: "#F472B6", // Pink terang
  pinkDark: "#DB2777", // Pink gelap

  // Neutral Colors
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

  // Opacity Variants
  transparent: "transparent",
  white: "#FFFFFF",
  black: "#000000",

  // Gradients
  gradient: {
    primary: ["#0F172A", "#1E293B", "#334155"],
    accent: ["#22D3EE", "#0EA5E9", "#0284C7"],
    success: ["#10B981", "#34D399", "#059669"],
    purple: ["#8B5CF6", "#7C3AED", "#6D28D9"],
  },

  // Shadow colors untuk depth
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
// [file content end]
