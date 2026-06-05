// File: src/theme/theme.ts
// ─────────────────────────────────────────────────────────────────────────────
// TEMA SISTEM — MyMoney
//
// Cara kerja:
//   • THEMES       → record semua tema yang tersedia
//   • DEFAULT_THEME_ID → tema yang dipakai saat pertama install
//   • AppColors    → interface untuk satu objek tema
//   • Colors       → export backward-compat (selalu = emerald, tema default)
//
// Untuk menambah tema baru:
//   1. Tambah id ke ThemeId union type
//   2. Tambah entri ke THEMES
//   3. Tambah kartu pratinjau di SettingsScreen
// ─────────────────────────────────────────────────────────────────────────────

// ─── Types ───────────────────────────────────────────────────────────────────

export type ThemeId =
  | "emerald"
  | "navy_gold"
  | "indigo"
  | "deep_purple"
  | "teal_calm"
  | "light_clean";

export const DEFAULT_THEME_ID: ThemeId = "emerald";

export interface AppColors {
  // Backgrounds
  background: string;
  surface: string;
  surfaceLight: string;
  surfaceDark: string;

  // Accent / Brand
  accent: string;
  accentDark: string;
  accentLight: string;

  // Legacy aliases (beberapa screen masih pakai ini)
  primary: string;
  primaryDark: string;
  primaryLight: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;

  // Borders
  border: string;
  borderLight: string;
  borderDark: string;

  // Semantics
  success: string;
  successLight: string;
  successDark: string;

  warning: string;
  warningLight: string;
  warningDark: string;

  error: string;
  errorLight: string;
  errorDark: string;

  info: string;
  infoLight: string;
  infoDark: string;

  // Special
  purple: string;
  purpleLight: string;
  purpleDark: string;

  pink: string;
  pinkLight: string;
  pinkDark: string;

  // Neutrals
  gray50: string;
  gray100: string;
  gray200: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  gray700: string;
  gray800: string;
  gray900: string;

  // Misc
  white: string;
  black: string;
  transparent: string;
}

// ─── Tema: Emerald Finance (DEFAULT) ─────────────────────────────────────────
// Modern, aman, identik dengan uang dan pertumbuhan.
// Accent: emerald green (#10B981) — menggantikan cyan lama.

const emeraldFinance: AppColors = {
  background:   "#0B1220",
  surface:      "#111827",
  surfaceLight: "#1F2937",
  surfaceDark:  "#060D18",

  accent:      "#10B981",
  accentDark:  "#059669",
  accentLight: "#34D399",

  primary:      "#0B1220",
  primaryDark:  "#060D18",
  primaryLight: "#111827",

  textPrimary:   "#F9FAFB",
  textSecondary: "#D1D5DB",
  textTertiary:  "#9CA3AF",
  textDisabled:  "#6B7280",

  border:      "#1F2937",
  borderLight: "#374151",
  borderDark:  "#111827",

  success:      "#22C55E",
  successLight: "#4ADE80",
  successDark:  "#16A34A",

  warning:      "#F59E0B",
  warningLight: "#FBBF24",
  warningDark:  "#D97706",

  error:      "#EF4444",
  errorLight: "#F87171",
  errorDark:  "#DC2626",

  info:      "#3B82F6",
  infoLight: "#60A5FA",
  infoDark:  "#2563EB",

  purple:      "#8B5CF6",
  purpleLight: "#A78BFA",
  purpleDark:  "#7C3AED",

  pink:      "#EC4899",
  pinkLight: "#F472B6",
  pinkDark:  "#DB2777",

  gray50:  "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",

  white:       "#FFFFFF",
  black:       "#000000",
  transparent: "transparent",
};

// ─── Tema: Navy Gold ──────────────────────────────────────────────────────────
// Premium, elegan, cocok untuk pengguna yang suka tampilan wealth management.

const navyGold: AppColors = {
  background:   "#0B1220",
  surface:      "#151F33",
  surfaceLight: "#1E2D45",
  surfaceDark:  "#060D18",

  accent:      "#F59E0B",
  accentDark:  "#D97706",
  accentLight: "#FCD34D",

  primary:      "#0B1220",
  primaryDark:  "#060D18",
  primaryLight: "#151F33",

  textPrimary:   "#F9FAFB",
  textSecondary: "#D1D5DB",
  textTertiary:  "#9CA3AF",
  textDisabled:  "#6B7280",

  border:      "#1E2D45",
  borderLight: "#2D4163",
  borderDark:  "#111827",

  success:      "#22C55E",
  successLight: "#4ADE80",
  successDark:  "#16A34A",

  warning:      "#F59E0B",
  warningLight: "#FBBF24",
  warningDark:  "#D97706",

  error:      "#F87171",
  errorLight: "#FCA5A5",
  errorDark:  "#EF4444",

  info:      "#3B82F6",
  infoLight: "#60A5FA",
  infoDark:  "#2563EB",

  purple:      "#8B5CF6",
  purpleLight: "#A78BFA",
  purpleDark:  "#7C3AED",

  pink:      "#EC4899",
  pinkLight: "#F472B6",
  pinkDark:  "#DB2777",

  gray50:  "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",

  white:       "#FFFFFF",
  black:       "#000000",
  transparent: "transparent",
};

// ─── Tema: Indigo Modern ──────────────────────────────────────────────────────
// Teknologi, startup, modern. Lebih fresh dibanding hijau klasik.

const indigoModern: AppColors = {
  background:   "#0F172A",
  surface:      "#1E293B",
  surfaceLight: "#334155",
  surfaceDark:  "#020617",

  accent:      "#4F46E5",
  accentDark:  "#4338CA",
  accentLight: "#818CF8",

  primary:      "#0F172A",
  primaryDark:  "#020617",
  primaryLight: "#1E293B",

  textPrimary:   "#F8FAFC",
  textSecondary: "#CBD5E1",
  textTertiary:  "#94A3B8",
  textDisabled:  "#64748B",

  border:      "#334155",
  borderLight: "#475569",
  borderDark:  "#1E293B",

  success:      "#22C55E",
  successLight: "#4ADE80",
  successDark:  "#16A34A",

  warning:      "#F59E0B",
  warningLight: "#FBBF24",
  warningDark:  "#D97706",

  error:      "#EF4444",
  errorLight: "#F87171",
  errorDark:  "#DC2626",

  info:      "#3B82F6",
  infoLight: "#60A5FA",
  infoDark:  "#2563EB",

  purple:      "#8B5CF6",
  purpleLight: "#A78BFA",
  purpleDark:  "#7C3AED",

  pink:      "#EC4899",
  pinkLight: "#F472B6",
  pinkDark:  "#DB2777",

  gray50:  "#F8FAFC",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray300: "#CBD5E1",
  gray400: "#94A3B8",
  gray500: "#64748B",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1E293B",
  gray900: "#0F172A",

  white:       "#FFFFFF",
  black:       "#000000",
  transparent: "transparent",
};

// ─── Tema: Deep Purple ────────────────────────────────────────────────────────
// Berani tapi tetap elegan. Cocok untuk diferensiasi brand.

const deepPurple: AppColors = {
  background:   "#0B1020",
  surface:      "#171C2C",
  surfaceLight: "#242B40",
  surfaceDark:  "#05080F",

  accent:      "#8B5CF6",
  accentDark:  "#7C3AED",
  accentLight: "#A78BFA",

  primary:      "#0B1020",
  primaryDark:  "#05080F",
  primaryLight: "#171C2C",

  textPrimary:   "#F8FAFC",
  textSecondary: "#CBD5E1",
  textTertiary:  "#94A3B8",
  textDisabled:  "#64748B",

  border:      "#242B40",
  borderLight: "#323B56",
  borderDark:  "#171C2C",

  success:      "#22C55E",
  successLight: "#4ADE80",
  successDark:  "#16A34A",

  warning:      "#F59E0B",
  warningLight: "#FBBF24",
  warningDark:  "#D97706",

  error:      "#FB7185",
  errorLight: "#FDA4AF",
  errorDark:  "#F43F5E",

  info:      "#3B82F6",
  infoLight: "#60A5FA",
  infoDark:  "#2563EB",

  purple:      "#8B5CF6",
  purpleLight: "#A78BFA",
  purpleDark:  "#7C3AED",

  pink:      "#EC4899",
  pinkLight: "#F472B6",
  pinkDark:  "#DB2777",

  gray50:  "#F8FAFC",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray300: "#CBD5E1",
  gray400: "#94A3B8",
  gray500: "#64748B",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1E293B",
  gray900: "#0F172A",

  white:       "#FFFFFF",
  black:       "#000000",
  transparent: "transparent",
};

// ─── Tema: Teal Calm ──────────────────────────────────────────────────────────
// Tenang, profesional, nyaman dipakai harian.

const tealCalm: AppColors = {
  background:   "#081A1A",
  surface:      "#102526",
  surfaceLight: "#1A3738",
  surfaceDark:  "#040E0E",

  accent:      "#14B8A6",
  accentDark:  "#0D9488",
  accentLight: "#2DD4BF",

  primary:      "#081A1A",
  primaryDark:  "#040E0E",
  primaryLight: "#102526",

  textPrimary:   "#F0FDFA",
  textSecondary: "#CCFBF1",
  textTertiary:  "#99F6E4",
  textDisabled:  "#5EEAD4",

  border:      "#1A3738",
  borderLight: "#2A4F50",
  borderDark:  "#102526",

  success:      "#22C55E",
  successLight: "#4ADE80",
  successDark:  "#16A34A",

  warning:      "#F59E0B",
  warningLight: "#FBBF24",
  warningDark:  "#D97706",

  error:      "#F87171",
  errorLight: "#FCA5A5",
  errorDark:  "#EF4444",

  info:      "#3B82F6",
  infoLight: "#60A5FA",
  infoDark:  "#2563EB",

  purple:      "#8B5CF6",
  purpleLight: "#A78BFA",
  purpleDark:  "#7C3AED",

  pink:      "#EC4899",
  pinkLight: "#F472B6",
  pinkDark:  "#DB2777",

  gray50:  "#F0FDFA",
  gray100: "#CCFBF1",
  gray200: "#99F6E4",
  gray300: "#5EEAD4",
  gray400: "#2DD4BF",
  gray500: "#14B8A6",
  gray600: "#0D9488",
  gray700: "#0F766E",
  gray800: "#115E59",
  gray900: "#134E4A",

  white:       "#FFFFFF",
  black:       "#000000",
  transparent: "transparent",
};

// ─── Tema: Light Clean ────────────────────────────────────────────────────────
// Terang, bersih, kontras tinggi.

const lightClean: AppColors = {
  background:   "#F8FAFC",
  surface:      "#FFFFFF",
  surfaceLight: "#F1F5F9",
  surfaceDark:  "#E2E8F0",

  accent:      "#0EA5E9",
  accentDark:  "#0284C7",
  accentLight: "#38BDF8",

  primary:      "#F8FAFC",
  primaryDark:  "#E2E8F0",
  primaryLight: "#FFFFFF",

  textPrimary:   "#0F172A",
  textSecondary: "#334155",
  textTertiary:  "#64748B",
  textDisabled:  "#94A3B8",

  border:      "#E2E8F0",
  borderLight: "#CBD5E1",
  borderDark:  "#94A3B8",

  success:      "#22C55E",
  successLight: "#4ADE80",
  successDark:  "#16A34A",

  warning:      "#F59E0B",
  warningLight: "#FBBF24",
  warningDark:  "#D97706",

  error:      "#EF4444",
  errorLight: "#F87171",
  errorDark:  "#DC2626",

  info:      "#3B82F6",
  infoLight: "#60A5FA",
  infoDark:  "#2563EB",

  purple:      "#8B5CF6",
  purpleLight: "#A78BFA",
  purpleDark:  "#7C3AED",

  pink:      "#EC4899",
  pinkLight: "#F472B6",
  pinkDark:  "#DB2777",

  gray50:  "#F8FAFC",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray300: "#CBD5E1",
  gray400: "#94A3B8",
  gray500: "#64748B",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1E293B",
  gray900: "#0F172A",

  white:       "#FFFFFF",
  black:       "#000000",
  transparent: "transparent",
};

// ─── THEMES Registry ─────────────────────────────────────────────────────────

export const THEMES: Record<ThemeId, AppColors> = {
  emerald:      emeraldFinance,
  navy_gold:    navyGold,
  indigo:       indigoModern,
  deep_purple:  deepPurple,
  teal_calm:    tealCalm,
  light_clean:  lightClean,
};

export const THEME_META: Record<ThemeId, { name: string; emoji: string; description: string; swatches: string[] }> = {
  emerald: {
    name:        "Emerald Finance",
    emoji:       "💚",
    description: "Modern, aman, identik dengan uang dan pertumbuhan.",
    swatches:    ["#0B1220", "#111827", "#10B981", "#22C55E", "#EF4444"],
  },
  navy_gold: {
    name:        "Navy Gold",
    emoji:       "✨",
    description: "Premium, elegan, cocok untuk tampilan wealth management.",
    swatches:    ["#0B1220", "#151F33", "#F59E0B", "#22C55E", "#F87171"],
  },
  indigo: {
    name:        "Indigo Modern",
    emoji:       "⚡",
    description: "Teknologi, startup, modern. Lebih fresh dibanding hijau klasik.",
    swatches:    ["#0F172A", "#1E293B", "#4F46E5", "#22C55E", "#EF4444"],
  },
  deep_purple: {
    name:        "Deep Purple",
    emoji:       "🌙",
    description: "Berani tapi tetap elegan. Cocok untuk diferensiasi brand.",
    swatches:    ["#0B1020", "#171C2C", "#8B5CF6", "#22C55E", "#FB7185"],
  },
  teal_calm: {
    name:        "Teal Calm",
    emoji:       "🍃",
    description: "Tenang, profesional, nyaman dipakai harian.",
    swatches:    ["#081A1A", "#102526", "#14B8A6", "#22C55E", "#F87171"],
  },
  light_clean: {
    name:        "Light Clean",
    emoji:       "☀️",
    description: "Terang, bersih, kontras tinggi untuk pengguna siang hari.",
    swatches:    ["#F8FAFC", "#FFFFFF", "#0EA5E9", "#22C55E", "#EF4444"],
  },
};

// ─── Backward Compatibility ───────────────────────────────────────────────────
// Import `Colors` masih berfungsi di layar yang belum dimigrasikan.
// Nilainya selalu mengikuti tema Emerald (default).

export const Colors = {
  ...emeraldFinance,

  // Gradients & shadows (tidak masuk AppColors tapi masih dipakai beberapa screen)
  gradient: {
    primary: ["#0B1220", "#111827", "#1F2937"],
    accent:  ["#10B981", "#059669", "#047857"],
    success: ["#22C55E", "#4ADE80", "#16A34A"],
    purple:  ["#8B5CF6", "#7C3AED", "#6D28D9"],
  },
  shadow: {
    light:  "rgba(11, 18, 32, 0.8)",
    medium: "rgba(6, 13, 24, 0.9)",
    dark:   "rgba(0, 0, 0, 0.95)",
  },
};

// ─── Theme object (tetap kompatibel) ─────────────────────────────────────────

export const Theme = {
  colors: Colors,
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
  },
  borderRadius: {
    xs: 6, sm: 10, md: 14, lg: 18, xl: 24, round: 9999,
  },
  typography: {
    h1:      { fontSize: 32, fontWeight: "800" as const, lineHeight: 40,  color: Colors.textPrimary },
    h2:      { fontSize: 26, fontWeight: "700" as const, lineHeight: 34,  color: Colors.textPrimary },
    h3:      { fontSize: 20, fontWeight: "600" as const, lineHeight: 28,  color: Colors.textPrimary },
    body:    { fontSize: 16, fontWeight: "400" as const, lineHeight: 24,  color: Colors.textSecondary },
    caption: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20,  color: Colors.textTertiary },
    small:   { fontSize: 12, fontWeight: "400" as const, lineHeight: 16,  color: Colors.textTertiary },
  },
};
