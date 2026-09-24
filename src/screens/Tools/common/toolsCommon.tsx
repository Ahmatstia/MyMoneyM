import React from "react";
import { View, Text, TextInput } from "react-native";
import { Colors } from "../../../theme/theme";
import { useTheme } from "../../../theme/ThemeContext";
import { formatCurrency } from "../../../utils/calculations";

// ── Design tokens & Dynamic Theme ────────────────────────────────────────────
export const useToolsTheme = () => {
  const { colors } = useTheme();
  return {
    BG: colors.background,
    SURF: colors.surface,
    ACCENT: colors.accent,
    TP: colors.textPrimary,
    TS: colors.textSecondary,
    BORDER: `${colors.border}80`,
    colors,
  };
};

export const R = 20;
export const PAD = 20;

// ── Helpers ──────────────────────────────────────────────────────────────────
export const fmt = (n: number) => formatCurrency(n);

export function daysLeftInMonth(): number {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return last.getDate() - now.getDate() + 1;
}

// ── Small reusable components ────────────────────────────────────────────────
export const Label = ({ text }: { text: string }) => (
  <Text
    style={{
      color: Colors.gray400,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.1,
      textTransform: "uppercase",
      marginBottom: 8,
    }}
  >
    {text}
  </Text>
);

export const InputBox = ({
  value,
  onChange,
  placeholder,
  isCurrency = true,
}: {
  value: string;
  onChange: (t: string) => void;
  placeholder?: string;
  isCurrency?: boolean;
}) => {
  const { BG, TP, BORDER } = useToolsTheme();
  const displayValue = value
    ? isCurrency
      ? `Rp ${parseInt(value, 10).toLocaleString("id-ID")}`
      : parseInt(value, 10).toLocaleString("id-ID")
    : "";

  return (
    <TextInput
      value={displayValue}
      onChangeText={(t) => onChange(t.replace(/\D/g, ""))}
      keyboardType="numeric"
      placeholder={placeholder ?? "0"}
      placeholderTextColor={Colors.gray500}
      style={{
        backgroundColor: BG,
        borderRadius: 14,
        padding: 14,
        color: TP,
        fontSize: 20,
        fontWeight: "800",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: BORDER,
      }}
    />
  );
};

export const ResultRow = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) => {
  const { TS, ACCENT, BORDER } = useToolsTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
      }}
    >
      <Text style={{ color: TS, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: color ?? ACCENT, fontSize: 14, fontWeight: "700" }}>
        {value}
      </Text>
    </View>
  );
};
