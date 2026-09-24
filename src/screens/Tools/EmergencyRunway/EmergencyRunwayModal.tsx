import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../theme/theme";
import { useTheme } from "../../../theme/ThemeContext";
import { formatCurrency, safeNumber } from "../../../utils/calculations";
import {
  useToolsTheme,
  R,
  PAD,
  fmt,
  daysLeftInMonth,
  Label,
  InputBox,
  ResultRow,
} from "../common";

// 4. Nafas Hidup
export const RunwayCalc = ({
  visible,
  onClose,
  balance,
  avgExpense,
}: {
  visible: boolean;
  onClose: () => void;
  balance: number;
  avgExpense: number;
}) => {
  const { BG, SURF, ACCENT, TP, TS, BORDER, colors } = useToolsTheme();
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
    <Modal
      visible={visible}
      statusBarTranslucent={true}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "transparent",
        }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={{
            backgroundColor: SURF,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: PAD,
            paddingBottom: 36,
            borderTopWidth: 1,
            borderTopColor: BORDER,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: `${Colors.purple}18`,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Ionicons name="timer-outline" size={20} color={Colors.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TP, fontSize: 16, fontWeight: "800" }}>
                Cek Nafas Hidup
              </Text>
              <Text
                style={{ color: Colors.gray400, fontSize: 11, marginTop: 2 }}
              >
                Berapa lama kamu bisa bertahan tanpa pemasukan?
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Tersinkron",
                  "Data nafas hidup dihitung otomatis berdasarkan saldo kas terkini.",
                );
              }}
              style={{ marginRight: 16 }}
            >
              <Ionicons name="refresh" size={24} color={Colors.gray400} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={Colors.gray500} />
            </TouchableOpacity>
          </View>

          <View
            style={{
              backgroundColor: `${statusColor}12`,
              borderRadius: 18,
              padding: 20,
              alignItems: "center",
              marginBottom: 16,
              borderWidth: 1,
              borderColor: `${statusColor}25`,
            }}
          >
            <Text
              style={{
                color: Colors.gray400,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 6,
              }}
            >
              Jika Tidak Ada Pemasukan
            </Text>
            <Text
              style={{
                color: statusColor,
                fontSize: isDeficit ? 30 : 38,
                fontWeight: "800",
              }}
            >
              {isDeficit
                ? "0 Hari (Defisit)"
                : `${months > 0 ? `${months} bln ` : ""}${remDays} hari`}
            </Text>
            <View
              style={{
                paddingHorizontal: 14,
                paddingVertical: 5,
                borderRadius: 20,
                backgroundColor: `${statusColor}20`,
                marginTop: 8,
              }}
            >
              <Text
                style={{
                  color: statusColor,
                  fontSize: 11,
                  fontWeight: "700",
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
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: `${Colors.purple}20`,
            }}
          >
            <ResultRow
              label="Saldo Total"
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
                marginTop: 10,
                backgroundColor: `${Colors.info}12`,
                borderRadius: 10,
                padding: 10,
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
                💡 Para ahli keuangan menyarankan dana darurat minimal{" "}
                <Text style={{ fontWeight: "800" }}>
                  3-6× pengeluaran bulanan
                </Text>{" "}
                agar finansialmu aman.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};


export default RunwayCalc;
