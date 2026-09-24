// File: src/screens/Tools/DailyLimit/DailyLimitScreen.tsx
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
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useAppContext } from "../../../context/AppContext";
import { Colors } from "../../../theme/theme";
import { safeNumber } from "../../../utils/calculations";
import { AppHeader } from "../../../components/common";
import {
  useToolsTheme,
  fmt,
  daysLeftInMonth,
  Label,
  InputBox,
} from "../common";

export const DailyLimitScreen: React.FC = () => {
  const { BG, ACCENT, TP, TS, BORDER, colors } = useToolsTheme();
  const navigation = useNavigation<any>();
  const { state } = useAppContext();

  const balance = safeNumber(state.balance);
  const totalDebt = useMemo(
    () =>
      (state.debts || [])
        .filter((d) => d.type === "borrowed" && d.status !== "paid")
        .reduce((s, d) => s + safeNumber(d.remaining), 0),
    [state.debts],
  );

  const [customBalance, setCustomBalance] = useState(String(balance));
  const [days, setDays] = useState("");
  const [reserve, setReserve] = useState("");

  const handleRefresh = () => {
    setCustomBalance(String(balance));
    setDays("");
    setReserve("");
  };

  const remainingDays = daysLeftInMonth();
  const currentBal = safeNumber(Number(customBalance));
  const safeBalance = Math.max(
    0,
    currentBal - totalDebt - safeNumber(Number(reserve)),
  );
  const numDays = days ? Math.max(1, Number(days)) : remainingDays;
  const perDay = safeBalance / numDays;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      {/* ── Standardized AppHeader ── */}
      <AppHeader
        title="Batas Aman Harian"
        subtitle="Hitung jatah aman belanja per hari"
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
            accessibilityLabel="Reset Kalkulasi"
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
          <Label text="Dana yang Tersedia (Bisa Diubah)" />
          <InputBox
            value={customBalance}
            onChange={setCustomBalance}
            placeholder="Saldo saat ini"
          />

          <Label text="Reservasi / Keperluan Wajib" />
          <InputBox
            value={reserve}
            onChange={setReserve}
            placeholder="Misal: tagihan, dll"
          />

          <Label text={`Jumlah Hari (Default: ${remainingDays} Hari)`} />
          <InputBox
            value={days}
            onChange={setDays}
            placeholder={`Sisa ${remainingDays} hari`}
            isCurrency={false}
          />

          <View
            style={{
              backgroundColor: `${ACCENT}10`,
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: `${ACCENT}25`,
              marginTop: 6,
            }}
          >
            <Text
              style={{
                color: TP,
                fontSize: 14,
                fontWeight: "700",
                marginBottom: 14,
              }}
            >
              Kesimpulan untukmu:
            </Text>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: TS, fontSize: 12, marginBottom: 4 }}>
                Uang yang BISA dipakai
              </Text>
              <Text style={{ color: ACCENT, fontSize: 22, fontWeight: "800" }}>
                {fmt(safeBalance)}
              </Text>
              {totalDebt > 0 && (
                <Text
                  style={{ color: Colors.error, fontSize: 10, marginTop: 4 }}
                >
                  *Telah dipotong hutang ({fmt(totalDebt)})
                </Text>
              )}
            </View>

            <View
              style={{ height: 1, backgroundColor: BORDER, marginBottom: 14 }}
            />

            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: TS, fontSize: 12, marginBottom: 4 }}>
                Maka, jatah maksimal belanjamu:
              </Text>
              <Text
                style={{
                  color: Colors.success,
                  fontSize: 26,
                  fontWeight: "800",
                }}
              >
                {fmt(perDay)}{" "}
                <Text style={{ fontSize: 14, color: TS, fontWeight: "600" }}>
                  / hari
                </Text>
              </Text>
            </View>

            <View
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor:
                  perDay < 50000
                    ? `${Colors.error}15`
                    : `${Colors.success}15`,
              }}
            >
              <Text
                style={{
                  color: perDay < 50000 ? Colors.error : Colors.success,
                  fontSize: 12,
                  fontWeight: "700",
                  textAlign: "center",
                  lineHeight: 18,
                }}
              >
                {perDay < 50000
                  ? "⚠️ Anggaran cukup ketat! Sebaiknya mulai berhemat dari sekarang."
                  : "✅ Anggaran aman. Kamu bisa pakai sesuai jatah harian di atas."}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default DailyLimitScreen;
