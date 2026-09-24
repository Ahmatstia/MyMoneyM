// File: src/screens/Tools/SalaryAllocator/SalaryAllocatorScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../../../theme/theme";
import { safeNumber } from "../../../utils/calculations";
import { AppHeader } from "../../../components/common";
import { useToolsTheme, fmt, Label, InputBox } from "../common";

// ── Bucket type ───────────────────────────────────────────────────────────────
interface Bucket {
  key: string;
  emoji: string;
  label: string;
  sub: string;
  pct: number;
  color: string;
}

const DEFAULT_BUCKETS: Bucket[] = [
  { key: "needs",   emoji: "🏠", label: "Kebutuhan Pokok",   sub: "Makan, kos, listrik, transportasi", pct: 50, color: Colors.info },
  { key: "wants",   emoji: "🎮", label: "Keinginan",          sub: "Nongkrong, hiburan, belanja",       pct: 30, color: Colors.warning },
  { key: "savings", emoji: "🏦", label: "Tabungan & Investasi", sub: "Dana darurat, tabungan, hutang",   pct: 20, color: Colors.success },
];

// ── Stepper component ─────────────────────────────────────────────────────────
const PctStepper = ({
  value, onChange, color,
}: { value: number; onChange: (v: number) => void; color: string }) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
    <TouchableOpacity
      onPress={() => onChange(Math.max(0, value - 1))}
      style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: `${color}20`, alignItems: "center", justifyContent: "center" }}
      activeOpacity={0.7}
    >
      <Ionicons name="remove" size={16} color={color} />
    </TouchableOpacity>
    <View style={{ width: 46, alignItems: "center" }}>
      <Text style={{ color, fontSize: 15, fontWeight: "800" }}>{value}%</Text>
    </View>
    <TouchableOpacity
      onPress={() => onChange(Math.min(100, value + 1))}
      style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: `${color}20`, alignItems: "center", justifyContent: "center" }}
      activeOpacity={0.7}
    >
      <Ionicons name="add" size={16} color={color} />
    </TouchableOpacity>
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
export const SalaryAllocatorScreen: React.FC = () => {
  const { BG, SURF, BORDER, TP, TS, colors } = useToolsTheme();

  const [salary, setSalary] = useState("");
  const [extra, setExtra] = useState("");
  const [buckets, setBuckets] = useState<Bucket[]>(DEFAULT_BUCKETS);
  const [isCustomising, setIsCustomising] = useState(false);

  const total = safeNumber(Number(salary)) + safeNumber(Number(extra));
  const totalPct = buckets.reduce((s, b) => s + b.pct, 0);
  const isValid = totalPct === 100;

  const results = useMemo(
    () => buckets.map((b) => ({ ...b, val: total * (b.pct / 100) })),
    [buckets, total]
  );

  const updatePct = (key: string, newPct: number) =>
    setBuckets((prev) => prev.map((b) => (b.key === key ? { ...b, pct: newPct } : b)));

  const handleReset = () => {
    setSalary("");
    setExtra("");
    setBuckets(DEFAULT_BUCKETS);
    setIsCustomising(false);
  };

  const pctLabel = buckets.map((b) => `${b.pct}%`).join("/");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <AppHeader
        title="Bagi Anggaran"
        subtitle={`Alokasi otomatis: ${pctLabel}`}
        showBack={true}
        rightComponent={
          <TouchableOpacity
            onPress={handleReset}
            style={{
              width: 38, height: 38, borderRadius: 12,
              backgroundColor: `${colors.border}40`,
              alignItems: "center", justifyContent: "center",
            }}
            accessibilityLabel="Reset Alokasi"
          >
            <Ionicons name="refresh" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        >
          <Label text="Pemasukan Utama" />
          <InputBox value={salary} onChange={setSalary} placeholder="Nominal gaji / uang masuk" />
          <Label text="Pemasukan Tambahan (opsional)" />
          <InputBox value={extra} onChange={setExtra} placeholder="Freelance, bonus, dll." />

          {/* ── Kustomisasi Toggle ── */}
          <TouchableOpacity
            onPress={() => setIsCustomising((v) => !v)}
            activeOpacity={0.7}
            style={{
              flexDirection: "row", alignItems: "center",
              backgroundColor: SURF, borderRadius: 14, padding: 13,
              borderWidth: 1,
              borderColor: isCustomising ? `${colors.accent}60` : `${BORDER}80`,
              marginBottom: 14, gap: 10,
            }}
          >
            <Ionicons
              name={isCustomising ? "options" : "options-outline"}
              size={18}
              color={isCustomising ? colors.accent : TS}
            />
            <Text style={{ flex: 1, color: isCustomising ? colors.accent : TP, fontSize: 13, fontWeight: "700" }}>
              Kustomisasi Persentase
            </Text>
            <Text style={{ color: TS, fontSize: 11 }}>{pctLabel}</Text>
            <Ionicons name={isCustomising ? "chevron-up" : "chevron-down"} size={16} color={TS} />
          </TouchableOpacity>

          {/* ── Customisation Panel ── */}
          {isCustomising && (
            <View
              style={{
                backgroundColor: SURF, borderRadius: 18, padding: 16,
                borderWidth: 1, borderColor: `${colors.accent}30`, marginBottom: 14,
              }}
            >
              <Text style={{ color: TS, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 }}>
                Atur Persentase Alokasi
              </Text>

              {buckets.map((b) => (
                <View key={b.key} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: TP, fontSize: 13, fontWeight: "700", marginBottom: 4 }}>
                      {b.emoji} {b.label}
                    </Text>
                    <View style={{ height: 5, backgroundColor: `${b.color}25`, borderRadius: 3, overflow: "hidden" }}>
                      <View style={{ width: `${b.pct}%`, height: "100%", backgroundColor: b.color, borderRadius: 3 }} />
                    </View>
                  </View>
                  <PctStepper value={b.pct} onChange={(v) => updatePct(b.key, v)} color={b.color} />
                </View>
              ))}

              {/* Total validator */}
              <View
                style={{
                  flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                  marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: `${BORDER}60`,
                }}
              >
                <Text style={{ color: TS, fontSize: 11, fontWeight: "600" }}>Total persentase</Text>
                <Text style={{ fontSize: 14, fontWeight: "800", color: isValid ? Colors.success : Colors.error }}>
                  {totalPct}%{isValid ? " ✓" : " ≠ 100%"}
                </Text>
              </View>

              {!isValid && (
                <View style={{ backgroundColor: `${Colors.error}12`, borderRadius: 10, padding: 10, marginTop: 8 }}>
                  <Text style={{ color: Colors.error, fontSize: 11, fontWeight: "600" }}>
                    ⚠ Total harus 100%.{" "}
                    {totalPct > 100
                      ? `Kelebihan ${totalPct - 100}%.`
                      : `Kekurangan ${100 - totalPct}%.`}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── Results ── */}
          <View
            style={{
              backgroundColor: `${Colors.success}10`,
              borderRadius: 20, padding: 18,
              borderWidth: 1,
              borderColor: isValid ? `${Colors.success}20` : `${Colors.error}30`,
              marginTop: 4,
            }}
          >
            <Text
              style={{
                color: Colors.gray400, fontSize: 11, fontWeight: "700",
                textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 12,
              }}
            >
              Total Terkumpul: {fmt(total)}
            </Text>

            {results.map((row) => (
              <View
                key={row.key}
                style={{
                  backgroundColor: `${row.color}12`,
                  borderRadius: 14, padding: 14, marginBottom: 10,
                  borderWidth: 1, borderColor: `${row.color}20`,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ color: TP, fontSize: 14, fontWeight: "700" }}>
                      {row.emoji} {row.label}
                    </Text>
                    <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 2 }}>
                      {row.sub}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: row.color, fontSize: 16, fontWeight: "800" }}>
                      {isValid ? fmt(row.val) : "—"}
                    </Text>
                    <Text style={{ color: Colors.gray500, fontSize: 10 }}>{row.pct}%</Text>
                  </View>
                </View>
              </View>
            ))}

            {!isValid && (
              <Text style={{ color: Colors.error, fontSize: 11, fontWeight: "600", textAlign: "center", marginTop: 4 }}>
                Sesuaikan persentase agar total = 100% untuk melihat hasil.
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SalaryAllocatorScreen;
