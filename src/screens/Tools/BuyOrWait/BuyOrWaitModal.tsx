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

// 3. Beli atau Tunda?
export const BuyOrWaitCalc = ({
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
  const [price, setPrice] = useState("");
  const [label, setLabel] = useState("");

  // Custom flexibility
  const [customBalance, setCustomBalance] = useState(String(balance));
  const [customDays, setCustomDays] = useState("");

  // Reset & sync every time modal opens
  React.useEffect(() => {
    if (visible) {
      handleRefresh();
    }
  }, [visible, balance]);

  const handleRefresh = () => {
    setCustomBalance(String(balance));
    setCustomDays("");
    setPrice("");
    setLabel("");
  };

  const remainingDays = daysLeftInMonth();
  const itemPrice = safeNumber(Number(price));
  const currentBal = safeNumber(Number(customBalance));
  const numDays = customDays ? Math.max(1, Number(customDays)) : remainingDays;
  const afterBuy = currentBal - itemPrice;
  const dailyAfter = numDays > 0 ? afterBuy / numDays : 0;
  const canBuy = afterBuy >= 0 && dailyAfter >= 30000;
  const savePerDay = 50000;
  const daysToSave = itemPrice > 0 ? Math.ceil(itemPrice / savePerDay) : 0;

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
                backgroundColor: `${Colors.warning}18`,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Ionicons name="cart-outline" size={20} color={Colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TP, fontSize: 16, fontWeight: "800" }}>
                Beli atau Tunda?
              </Text>
              <Text
                style={{ color: Colors.gray400, fontSize: 11, marginTop: 2 }}
              >
                Simulasikan dampak pembelian
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
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  backgroundColor: canBuy
                    ? `${Colors.success}10`
                    : `${Colors.error}10`,
                  borderColor: canBuy
                    ? `${Colors.success}25`
                    : `${Colors.error}25`,
                }}
              >
                <Text
                  style={{
                    color: canBuy ? Colors.success : Colors.error,
                    fontSize: 15,
                    fontWeight: "800",
                    marginBottom: 12,
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
                      fontSize: 18,
                      fontWeight: "800",
                    }}
                  >
                    {fmt(afterBuy)}
                  </Text>
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: TS, fontSize: 12, marginBottom: 4 }}>
                    Jatah makan/hari jadi sisa:
                  </Text>
                  <Text
                    style={{
                      color: dailyAfter < 30000 ? Colors.error : Colors.success,
                      fontSize: 18,
                      fontWeight: "800",
                    }}
                  >
                    {fmt(dailyAfter)}{" "}
                    <Text
                      style={{ fontSize: 12, color: TS, fontWeight: "600" }}
                    >
                      / hari
                    </Text>
                  </Text>
                </View>

                {!canBuy && (
                  <View
                    style={{
                      marginTop: 10,
                      backgroundColor: `${Colors.info}15`,
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
                      💡 Saran: Tahan dulu! Coba sisihkan {fmt(savePerDay)}
                      /hari. Kamu bisa beli {label || "barang ini"} dalam{" "}
                      <Text style={{ fontWeight: "800" }}>
                        {daysToSave} hari
                      </Text>{" "}
                      tanpa khawatir melarat.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};


export default BuyOrWaitCalc;
