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

// 1. Batas Aman Harian
export const DailyLimitCalc = ({
  visible,
  onClose,
  balance,
  totalDebt,
}: {
  visible: boolean;
  onClose: () => void;
  balance: number;
  totalDebt: number;
}) => {
  const { BG, SURF, ACCENT, TP, TS, BORDER, colors } = useToolsTheme();
  // Custom flexibility
  const [customBalance, setCustomBalance] = useState(String(balance));
  const [days, setDays] = useState("");
  const [reserve, setReserve] = useState("");

  // Reset & sync every time modal opens
  React.useEffect(() => {
    if (visible) {
      handleRefresh();
    }
  }, [visible, balance]);

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
  const perWeek = perDay * 7;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: "rgba(2,6,23,0.88)" }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        />
        <View
          style={{
            backgroundColor: SURF,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: PAD,
            paddingBottom: 24,
            borderTopWidth: 1,
            borderTopColor: BORDER,
            maxHeight: "88%",
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
                backgroundColor: `${ACCENT}18`,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={ACCENT}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TP, fontSize: 16, fontWeight: "800" }}>
                Batas Aman Harian
              </Text>
              <Text
                style={{ color: Colors.gray400, fontSize: 11, marginTop: 2 }}
              >
                Hitung jatah aman per hari
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleRefresh}
              style={{ marginRight: 16 }}
            >
              <Ionicons name="refresh" size={24} color={Colors.gray400} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={Colors.gray500} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
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
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: `${ACCENT}20`,
                marginTop: 4,
              }}
            >
              <Text
                style={{
                  color: TP,
                  fontSize: 13,
                  fontWeight: "700",
                  marginBottom: 12,
                }}
              >
                Kesimpulan untukmu:
              </Text>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: TS, fontSize: 12, marginBottom: 4 }}>
                  Uang yang BISA dipakai
                </Text>
                <Text
                  style={{ color: ACCENT, fontSize: 20, fontWeight: "800" }}
                >
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
                style={{ height: 1, backgroundColor: BORDER, marginBottom: 12 }}
              />

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: TS, fontSize: 12, marginBottom: 4 }}>
                  Maka, jatah maksimal belanjamu:
                </Text>
                <Text
                  style={{
                    color: Colors.success,
                    fontSize: 24,
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
                  marginTop: 4,
                  padding: 10,
                  borderRadius: 10,
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
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};


export default DailyLimitCalc;
