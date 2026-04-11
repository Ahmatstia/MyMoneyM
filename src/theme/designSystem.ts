// File: src/theme/designSystem.ts
// Shared UI constants for consistent styling across ALL screens
import { ViewStyle, TextStyle } from "react-native";
import { Colors } from "./theme";

// ==================== COLOR ALIASES ====================
// Use these instead of re-declaring in every screen
export const DS = {
  // Backgrounds
  bg: Colors.background,
  surface: Colors.surface,
  surfaceLight: Colors.surfaceLight,

  // Text
  text: Colors.textPrimary,
  textSub: Colors.textSecondary,
  textMuted: Colors.textTertiary,
  textDisabled: Colors.textDisabled,

  // Accent & Status
  accent: Colors.accent,
  success: Colors.success,
  warning: Colors.warning,
  error: Colors.error,
  info: Colors.info,
  purple: Colors.purple,

  // Borders
  border: Colors.border,
  borderLight: Colors.borderLight,
};

// ==================== SHARED STYLES ====================

/** Page-level container */
export const pageContainer: ViewStyle = {
  flex: 1,
  backgroundColor: DS.bg,
};

/** Standard screen header bar */
export const headerBar: ViewStyle = {
  paddingHorizontal: 16,
  paddingTop: 12,
  paddingBottom: 14,
  backgroundColor: DS.surface,
  borderBottomWidth: 1,
  borderBottomColor: DS.border,
};

/** Header title text */
export const headerTitle: TextStyle = {
  fontSize: 20,
  fontWeight: "700",
  color: DS.text,
};

/** Header subtitle text */
export const headerSubtitle: TextStyle = {
  fontSize: 13,
  color: DS.textSub,
  marginTop: 2,
};

/** Standard card wrapper */
export const card: ViewStyle = {
  backgroundColor: DS.surface,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: DS.border,
};

/** Card with padding (most common) */
export const cardPadded: ViewStyle = {
  ...card,
  padding: 16,
};

/** Compact card (less padding) */
export const cardCompact: ViewStyle = {
  ...card,
  padding: 12,
};

/** Section title */
export const sectionTitle: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
  color: DS.text,
  marginBottom: 12,
};

/** ScrollView content padding */
export const scrollContent: ViewStyle = {
  paddingHorizontal: 16,
  paddingTop: 16,
  paddingBottom: 32,
};

/** Filter pill (inactive) */
export const filterPill: ViewStyle = {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 999,
  backgroundColor: DS.surfaceLight,
};

/** Filter pill (active) */
export const filterPillActive: ViewStyle = {
  ...filterPill,
  backgroundColor: DS.accent + "20",
};

/** Filter pill text (inactive) */
export const filterPillText: TextStyle = {
  fontSize: 12,
  fontWeight: "500",
  color: DS.textSub,
};

/** Filter pill text (active) */
export const filterPillTextActive: TextStyle = {
  ...filterPillText,
  color: DS.accent,
};

/** Summary stat column */
export const statColumn: ViewStyle = {
  flex: 1,
  alignItems: "center",
};

/** Stat label */
export const statLabel: TextStyle = {
  fontSize: 11,
  color: DS.textSub,
  marginBottom: 2,
};

/** Stat value */
export const statValue: TextStyle = {
  fontSize: 14,
  fontWeight: "700",
  color: DS.text,
};

/** Vertical divider in stat rows */
export const statDivider: ViewStyle = {
  width: 1,
  height: 24,
  backgroundColor: DS.border,
};

/** Icon button (small, round) */
export const iconButton: ViewStyle = {
  width: 32,
  height: 32,
  borderRadius: 10,
  backgroundColor: DS.surfaceLight,
  justifyContent: "center",
  alignItems: "center",
};

/** FAB (Floating Action Button) in header */
export const headerFAB: ViewStyle = {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: DS.accent,
  justifyContent: "center",
  alignItems: "center",
};

/** Badge (status indicator) */
export const badge = (color: string): ViewStyle => ({
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 8,
  backgroundColor: color + "20",
});

/** Badge text */
export const badgeText = (color: string): TextStyle => ({
  fontSize: 11,
  fontWeight: "500",
  color: color,
});

/** Progress bar track */
export const progressTrack: ViewStyle = {
  height: 6,
  borderRadius: 3,
  backgroundColor: DS.surfaceLight,
  overflow: "hidden",
};

/** Progress bar fill */
export const progressFill = (color: string, pct: number): ViewStyle => ({
  height: "100%",
  borderRadius: 3,
  backgroundColor: color,
  width: `${Math.max(0, Math.min(pct, 100))}%`,
});

/** Empty state container */
export const emptyState: ViewStyle = {
  alignItems: "center",
  paddingVertical: 48,
};

/** Empty state title */
export const emptyTitle: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
  color: DS.text,
  marginTop: 16,
  marginBottom: 8,
  textAlign: "center",
};

/** Empty state subtitle */
export const emptySubtitle: TextStyle = {
  fontSize: 13,
  color: DS.textSub,
  textAlign: "center",
  marginBottom: 20,
  lineHeight: 20,
};

/** Primary action button */
export const primaryButton: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 20,
  paddingVertical: 10,
  borderRadius: 12,
  backgroundColor: DS.accent,
  gap: 8,
};

/** Primary button text */
export const primaryButtonText: TextStyle = {
  fontSize: 13,
  fontWeight: "600",
  color: "#FFFFFF",
};

/** Section separator inside card */
export const cardSeparator: ViewStyle = {
  height: 1,
  backgroundColor: DS.border,
  marginVertical: 12,
};
