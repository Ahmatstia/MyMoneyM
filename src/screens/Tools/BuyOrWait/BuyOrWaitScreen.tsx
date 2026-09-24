// File: src/screens/Tools/BuyOrWait/BuyOrWaitScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
import { useKeyboardBottomInset } from "../../../utils/keyboard";

export const BuyOrWaitScreen: React.FC = () => {
  const { BG, TP, TS, BORDER, colors } = useToolsTheme();
  const navigation = useNavigation<any>();
  const keyboardBottomInset = useKeyboardBottomInset(24);
  const { state } = useAppContext();

  const balance = safeNumber(state.balance);

  const [price, setPrice] = useState("");
  const [label, setLabel] = useState("");
  const [customBalance, setCustomBalance] = useState(String(balance));
  const [customDays, setCustomDays] = useState("");

  const handleRefresh = () => {
    setCustomBalance(String(balance));
    setCustomDays("");
    setPrice("");
    setLabel("");
  };

  const remainingDays = daysLeftInMonth(state.paydayCutoff);
  const itemPrice = safeNumber(Number(price));
  const currentBal = safeNumber(Number(customBalance));
  const numDays = customDays ? Math.max(1, Number(customDays)) : remainingDays;
  const afterBuy = currentBal - itemPrice;
  const dailyAfter = numDays > 0 ? afterBuy / numDays : 0;
  const canBuy = afterBuy >= 0 && dailyAfter >= 30000;
  const savePerDay = 50000;
  const daysToSave = itemPrice > 0 ? Math.ceil(itemPrice / savePerDay) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      {/* ── Standardized AppHeader ── */}
      <AppHeader
        title="Beli atau Tunda?"
        subtitle="Simulasikan dampak pembelian terhadap saldo & jatah harian"
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
            accessibilityLabel="Reset Simulasi"
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
          contentContainerStyle={{ padding: 20, paddingBottom: keyboardBottomInset }}
        >
          <Label text="Dana yang Tersedia (Bisa Diubah)" />
          <InputBox
            value={customBalance}
            onChange={setCustomBalance}
            placeholder="Saldo saat ini"
          />

          <Label text="Harga Barang" />
          <InputBox
            value={price}
            onChange={setPrice}
            placeholder="Masukkan harga"
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Label text="Nama Barang (Opsional)" />
              <TextInput
                value={label}
                onChangeText={setLabel}
                placeholder="Misal: Sepatu"
                placeholderTextColor={Colors.gray500}
                style={{
                  backgroundColor: BG,
                  borderRadius: 14,
                  padding: 14,
                  color: TP,
                  fontSize: 15,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: BORDER,
                }}
              />
            </View>
            <View style={{ flex: 0.9 }}>
              <Label text={`Hari (Default: ${remainingDays})`} />
              <InputBox
                value={customDays}
                onChange={setCustomDays}
                placeholder={String(remainingDays)}
                isCurrency={false}
              />
            </View>
          </View>

          {itemPrice > 0 && (
            <View
              style={{
                borderRadius: 20,
                padding: 18,
                borderWidth: 1,
                backgroundColor: canBuy
                  ? `${Colors.success}10`
                  : `${Colors.error}10`,
                borderColor: canBuy
                  ? `${Colors.success}25`
                  : `${Colors.error}25`,
                marginTop: 6,
              }}
            >
              <Text
                style={{
                  color: canBuy ? Colors.success : Colors.error,
                  fontSize: 16,
                  fontWeight: "800",
                  marginBottom: 14,
                  textAlign: "center",
                }}
              >
                {canBuy ? "✅ AMAN DIBELI SEKARANG" : "🔴 SEBAIKNYA DITUNDA"}
              </Text>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: TS, fontSize: 12, marginBottom: 4 }}>
                  Jika dibeli, sisa uangmu tinggal:
                </Text>
                <Text
                  style={{
                    color: afterBuy < 0 ? Colors.error : TP,
                    fontSize: 20,
                    fontWeight: "800",
                  }}
                >
                  {fmt(afterBuy)}
                </Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: TS, fontSize: 12, marginBottom: 4 }}>
                  Jatah belanja/hari jadi sisa:
                </Text>
                <Text
                  style={{
                    color: dailyAfter < 30000 ? Colors.error : Colors.success,
                    fontSize: 20,
                    fontWeight: "800",
                  }}
                >
                  {fmt(dailyAfter)}{" "}
                  <Text style={{ fontSize: 13, color: TS, fontWeight: "600" }}>
                    / hari
                  </Text>
                </Text>
              </View>

              {!canBuy && (
                <View
                  style={{
                    marginTop: 10,
                    backgroundColor: `${Colors.info}15`,
                    borderRadius: 12,
                    padding: 12,
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
                    💡 Saran: Tahan dulu! Coba sisihkan {fmt(savePerDay)}
                    /hari. Kamu bisa beli {label || "barang ini"} dalam{" "}
                    <Text style={{ fontWeight: "800" }}>{daysToSave} hari</Text>{" "}
                    tanpa khawatir mengganggu kebutuhan harian.
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BuyOrWaitScreen;
