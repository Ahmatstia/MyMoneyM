// File: src/screens/Tools/EmergencyRunway/EmergencyRunwayScreen.tsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
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
  ResultRow,
} from "../common";

export const EmergencyRunwayScreen: React.FC = () => {
  const { BG, ACCENT, colors } = useToolsTheme();
  const navigation = useNavigation<any>();
  const { state } = useAppContext();

  const balance = safeNumber(state.balance);
  const avgExpense = useMemo(() => {
    const txs = state.transactions || [];
    if (txs.length === 0) return 0;
    const expenses = txs.filter((t) => t.type === "expense");
    if (expenses.length === 0) return 0;
    const months = new Set(expenses.map((t) => t.date.slice(0, 7))).size;
    const total = expenses.reduce((s, t) => s + safeNumber(t.amount), 0);
    return months > 0 ? total / months : total;
  }, [state.transactions]);

  const dailyAvg = avgExpense / 30;
  const isDeficit = balance <= 0;
  const runwayDays =
    !isDeficit && dailyAvg > 0
      ? Math.max(0, Math.floor(balance / dailyAvg))
      : 0;
  const months = Math.floor(runwayDays / 30);
  const remDays = runwayDays % 30;
  const idealDE = avgExpense * 3;
  const idealSingle = avgExpense * 6;
  const status = isDeficit
    ? "defisit"
    : runwayDays >= 90
      ? "aman"
      : runwayDays >= 30
        ? "waspada"
        : "kritis";
  const statusColor =
    status === "aman"
      ? Colors.success
      : status === "waspada"
        ? Colors.warning
        : Colors.error;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      {/* ── Standardized AppHeader ── */}
      <AppHeader
        title="Cek Nafas Hidup"
        subtitle="Berapa lama kamu bisa bertahan tanpa pemasukan?"
        showBack={true}
        rightComponent={
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Tersinkron",
                "Data nafas hidup dihitung otomatis secara langsung berdasarkan saldo kas & histori transaksi terkini.",
              );
            }}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: `${colors.border}40`,
              alignItems: "center",
              justifyContent: "center",
            }}
            accessibilityLabel="Info Sinkronisasi"
          >
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        <View
          style={{
            backgroundColor: `${statusColor}12`,
            borderRadius: 22,
            padding: 24,
            alignItems: "center",
            marginBottom: 20,
            borderWidth: 1,
            borderColor: `${statusColor}25`,
          }}
        >
          <Text
            style={{
              color: Colors.gray400,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 1.1,
              marginBottom: 8,
              fontWeight: "700",
            }}
          >
            Jika Tidak Ada Pemasukan
          </Text>
          <Text
            style={{
              color: statusColor,
              fontSize: isDeficit ? 30 : 40,
              fontWeight: "800",
            }}
          >
            {isDeficit
              ? "0 Hari (Defisit)"
              : `${months > 0 ? `${months} bln ` : ""}${remDays} hari`}
          </Text>
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: `${statusColor}20`,
              marginTop: 10,
            }}
          >
            <Text
              style={{
                color: statusColor,
                fontSize: 11,
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Status: {status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: `${Colors.purple}10`,
            borderRadius: 20,
            padding: 18,
            borderWidth: 1,
            borderColor: `${Colors.purple}20`,
          }}
        >
          <ResultRow
            label="Saldo Kas Total"
            value={fmt(balance)}
            color={ACCENT}
          />
          <ResultRow
            label="Avg Pengeluaran/Bulan"
            value={fmt(avgExpense)}
            color={Colors.warning}
          />
          <ResultRow
            label="Avg Pengeluaran/Hari"
            value={fmt(dailyAvg)}
            color={Colors.warning}
          />
          <ResultRow
            label="Dana Darurat Ideal (3x)"
            value={fmt(idealDE)}
            color={Colors.info}
          />
          <ResultRow
            label="Dana Darurat Ideal (6x)"
            value={fmt(idealSingle)}
            color={Colors.info}
          />

          <View
            style={{
              marginTop: 14,
              backgroundColor: `${Colors.info}12`,
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: `${Colors.info}25`,
            }}
          >
            <Text
              style={{
                color: Colors.info,
                fontSize: 12,
                fontWeight: "600",
                lineHeight: 18,
              }}
            >
              💡 Rekomendasi Perencana Finansial: Usahakan memiliki dana darurat minimal{" "}
              <Text style={{ fontWeight: "800" }}>3-6× pengeluaran bulanan</Text>{" "}
              di instrumen likuid agar fondasi keuangan keluarga tetap kokoh.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EmergencyRunwayScreen;
