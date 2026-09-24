// File: src/screens/Tools/SalaryAllocator/SalaryAllocatorScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../../../theme/theme";
import { safeNumber } from "../../../utils/calculations";
import { AppHeader } from "../../../components/common";
import {
  useToolsTheme,
  fmt,
  Label,
  InputBox,
} from "../common";

export const SalaryAllocatorScreen: React.FC = () => {
  const { BG, TP, colors } = useToolsTheme();
  const navigation = useNavigation<any>();

  const [salary, setSalary] = useState("");
  const [extra, setExtra] = useState("");

  const handleRefresh = () => {
    setSalary("");
    setExtra("");
  };

  const total = safeNumber(Number(salary)) + safeNumber(Number(extra));
  const needs = total * 0.5;
  const wants = total * 0.3;
  const savings = total * 0.2;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      {/* ── Standardized AppHeader ── */}
      <AppHeader
        title="Bagi Anggaran 50/30/20"
        subtitle="Alokasi otomatis: Kebutuhan, Keinginan, Tabungan"
        showBack={true}
        rightComponent={
          <TouchableOpacity
            onPress={handleRefresh}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: `${colors.border}40`,
              alignItems: "center",
              justifyContent: "center",
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
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        >
          <Label text="Pemasukan Utama" />
          <InputBox
            value={salary}
            onChange={setSalary}
            placeholder="Nominal uang masuk utama"
          />
          <Label text="Pemasukan Tambahan (opsional)" />
          <InputBox
            value={extra}
            onChange={setExtra}
            placeholder="Freelance, uang saku, bonus, dll"
          />

          <View
            style={{
              backgroundColor: `${Colors.success}10`,
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: `${Colors.success}20`,
              marginTop: 6,
            }}
          >
            <Text
              style={{
                color: Colors.gray400,
                fontSize: 11,
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: 1.1,
                marginBottom: 12,
              }}
            >
              Total Terkumpul: {fmt(total)}
            </Text>
            {[
              {
                pct: "50%",
                label: "🏠 Kebutuhan Pokok",
                sub: "Makan, kos, listrik, transportasi",
                val: needs,
                c: Colors.info,
              },
              {
                pct: "30%",
                label: "🎮 Keinginan",
                sub: "Nongkrong, hiburan, belanja",
                val: wants,
                c: Colors.warning,
              },
              {
                pct: "20%",
                label: "🏦 Tabungan & Investasi",
                sub: "Dana darurat, tabungan, hutang",
                val: savings,
                c: Colors.success,
              },
            ].map((row) => (
              <View
                key={row.pct}
                style={{
                  backgroundColor: `${row.c}12`,
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: `${row.c}20`,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View>
                    <Text
                      style={{ color: TP, fontSize: 14, fontWeight: "700" }}
                    >
                      {row.label}
                    </Text>
                    <Text
                      style={{
                        color: Colors.gray400,
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      {row.sub}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        color: row.c,
                        fontSize: 16,
                        fontWeight: "800",
                      }}
                    >
                      {fmt(row.val)}
                    </Text>
                    <Text style={{ color: Colors.gray500, fontSize: 10 }}>
                      {row.pct}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SalaryAllocatorScreen;
