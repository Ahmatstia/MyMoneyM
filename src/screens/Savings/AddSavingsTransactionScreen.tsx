// File: src/screens/AddSavingsTransactionScreen.tsx - KONSISTEN DENGAN TEMA
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import {
  formatCurrency,
  safeNumber,
  getCurrentDate,
} from "../../utils/calculations";
import { RootStackParamList } from "../../types";
import { Colors } from "../../theme/theme";

type AddSavingsTransactionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddSavingsTransaction"
>;

type AddSavingsTransactionScreenRouteProp = RouteProp<
  RootStackParamList,
  "AddSavingsTransaction"
>;

// WARNA KONSISTEN
const PRIMARY_COLOR = Colors.primary;
const ACCENT_COLOR = Colors.accent;
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR = Colors.surface;
const TEXT_PRIMARY = Colors.textPrimary;
const TEXT_SECONDARY = Colors.textSecondary;
const BORDER_COLOR = Colors.border;
const SUCCESS_COLOR = Colors.success;
const ERROR_COLOR = Colors.error;
const INFO_COLOR = Colors.info;

const AddSavingsTransactionScreen: React.FC = () => {
  const navigation = useNavigation<AddSavingsTransactionScreenNavigationProp>();
  const route = useRoute<AddSavingsTransactionScreenRouteProp>();

  const params = route.params || {};
  const savingsId = params.savingsId;
  const type = params.type || "deposit";

  const { state, addSavingsTransaction } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [amountError, setAmountError] = useState("");

  // Temukan savings berdasarkan ID
  const saving = state.savings?.find((s) => s.id === savingsId);

  // Jika saving tidak ditemukan
  if (!saving) {
    return (
      <View
        style={[
          tw`flex-1 justify-center items-center p-4`,
          { backgroundColor: BACKGROUND_COLOR },
        ]}
      >
        <Ionicons name="warning-outline" size={48} color={ERROR_COLOR} />
        <Text
          style={[tw`text-lg font-semibold mt-4 mb-2`, { color: TEXT_PRIMARY }]}
        >
          Tabungan tidak ditemukan
        </Text>
        <TouchableOpacity
          style={[
            tw`mt-4 px-4 py-2 rounded-lg`,
            { backgroundColor: ACCENT_COLOR },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Text style={tw`text-white font-medium`}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // State form
  const [transactionType, setTransactionType] = useState<
    "deposit" | "withdrawal"
  >(type);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getCurrentDate());
  const [note, setNote] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  // Update title
  // useEffect(() => {
  //   navigation.setOptions({
  //     title:
  //       transactionType === "deposit" ? "Tambah Setoran" : "Penarikan Dana",
  //     headerStyle: { backgroundColor: PRIMARY_COLOR },
  //     headerTintColor: TEXT_PRIMARY,
  //     headerTitleStyle: { fontWeight: "600" },
  //   });
  // }, [transactionType, navigation]);

  // Validasi amount
  const validateAmount = (value: string): boolean => {
    setAmountError("");

    if (!value.trim()) {
      setAmountError("Jumlah harus diisi");
      return false;
    }

    const amountNum = safeNumber(parseFloat(value.replace(/[^0-9]/g, "")));
    if (isNaN(amountNum) || amountNum <= 0) {
      setAmountError("Jumlah harus angka positif");
      return false;
    }

    if (transactionType === "withdrawal") {
      const currentBalance = safeNumber(saving.current);
      if (amountNum > currentBalance) {
        setAmountError(`Melebihi saldo (${formatCurrency(currentBalance)})`);
        return false;
      }
    }

    if (amountNum > 1000000000) {
      setAmountError("Jumlah terlalu besar (maks: 1M)");
      return false;
    }

    return true;
  };

  // Handle amount change
  const handleAmountChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, "");
    setAmount(cleanValue);
    if (cleanValue) {
      validateAmount(cleanValue);
    } else {
      setAmountError("");
    }
  };

  // Format amount display
  const formatAmountDisplay = () => {
    if (!amount) return "";
    const amountNum = safeNumber(parseFloat(amount));
    if (isNaN(amountNum)) return amount;

    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountNum);
  };

  // Format tanggal untuk display
  const formatDisplayDate = (dateStr: string): string => {
    try {
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) return dateStr;

      return dateObj.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return dateStr;
    }
  };

  // Handle date select
  const handleDateSelect = (day: any) => {
    try {
      const selectedDate = new Date(day.dateString);
      if (isNaN(selectedDate.getTime())) {
        throw new Error("Tanggal tidak valid");
      }

      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const dayStr = String(selectedDate.getDate()).padStart(2, "0");

      setDate(`${year}-${month}-${dayStr}`);
      setShowCalendar(false);
    } catch (error) {
      Alert.alert("Error", "Gagal memilih tanggal");
    }
  };

  // Quick amount presets
  const getQuickPresets = () => {
    const currentBalance = safeNumber(saving.current);

    if (transactionType === "deposit") {
      return [
        { label: "50rb", value: "50000" },
        { label: "100rb", value: "100000" },
        { label: "200rb", value: "200000" },
        { label: "500rb", value: "500000" },
        { label: "1jt", value: "1000000" },
        { label: "2jt", value: "2000000" },
      ];
    } else {
      const allAmount = currentBalance.toString();
      return [
        { label: "50rb", value: "50000" },
        { label: "100rb", value: "100000" },
        { label: "200rb", value: "200000" },
        { label: "500rb", value: "500000" },
        { label: "1jt", value: "1000000" },
        {
          label: `Semua (${formatCurrency(currentBalance)})`,
          value: allAmount,
        },
      ];
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateAmount(amount)) {
      Alert.alert("Error", amountError || "Jumlah tidak valid");
      return;
    }

    const amountNum = safeNumber(parseFloat(amount));

    setLoading(true);
    try {
      await addSavingsTransaction(saving.id, {
        type: transactionType,
        amount: amountNum,
        date,
        note: note.trim(),
      });

      Alert.alert(
        "Sukses",
        `${transactionType === "deposit" ? "Setoran" : "Penarikan"} berhasil`,
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("SavingsDetail", { savingsId }),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Gagal menambahkan transaksi");
    } finally {
      setLoading(false);
    }
  };

  const currentBalance = safeNumber(saving.current);
  const newBalance = amount
    ? transactionType === "deposit"
      ? currentBalance + safeNumber(parseFloat(amount))
      : currentBalance - safeNumber(parseFloat(amount))
    : currentBalance;

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-4 pt-4 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <TouchableOpacity
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${ACCENT_COLOR}15`,
              marginRight: 12,
            }}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={ACCENT_COLOR} />
          </TouchableOpacity>
          <Text style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: "700" }}>
            {transactionType === "deposit" ? "Tambah Setoran" : "Penarikan Dana"}
          </Text>
        </View>
        {/* Savings Info */}
        <View style={[tw`rounded-xl p-4 mb-4`, { backgroundColor: SURFACE_COLOR }]}>
          <View style={tw`flex-row items-center mb-4`}>
            <View style={[tw`w-12 h-12 rounded-full items-center justify-center mr-3`, { backgroundColor: ACCENT_COLOR + "20" }]}>
              <Ionicons name={(saving.icon as any) || "wallet"} size={24} color={ACCENT_COLOR} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={[tw`text-[13px] font-bold`, { color: TEXT_PRIMARY }]}>{saving.name}</Text>
              <Text style={[tw`text-[11px] font-medium`, { color: TEXT_SECONDARY }]}>
                Target: {formatCurrency(safeNumber(saving.target))}
              </Text>
            </View>
          </View>

          {/* Transaction Type Selection */}
          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity
              style={[
                tw`flex-1 rounded-xl px-3 py-3`,
                transactionType === "deposit"
                  ? { backgroundColor: SUCCESS_COLOR + "15" }
                  : { backgroundColor: BACKGROUND_COLOR },
              ]}
              onPress={() => setTransactionType("deposit")}
              disabled={loading}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <Ionicons name="arrow-down" size={14} color={transactionType === "deposit" ? SUCCESS_COLOR : TEXT_SECONDARY} />
                <Text style={[tw`text-[11px] font-bold ml-1.5`, { color: transactionType === "deposit" ? SUCCESS_COLOR : TEXT_SECONDARY }]}>
                  Setoran
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                tw`flex-1 rounded-xl px-3 py-3`,
                transactionType === "withdrawal"
                  ? { backgroundColor: ERROR_COLOR + "15" }
                  : { backgroundColor: BACKGROUND_COLOR },
              ]}
              onPress={() => setTransactionType("withdrawal")}
              disabled={loading || currentBalance <= 0}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <Ionicons
                  name="arrow-up"
                  size={14}
                  color={transactionType === "withdrawal" ? ERROR_COLOR : currentBalance <= 0 ? Colors.gray500 : TEXT_SECONDARY}
                />
                <Text
                  style={[
                    tw`text-[11px] font-bold ml-1.5`,
                    { color: transactionType === "withdrawal" ? ERROR_COLOR : currentBalance <= 0 ? Colors.gray500 : TEXT_SECONDARY },
                  ]}
                >
                  Penarikan
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Current Balance */}
          <View style={tw`mt-4 pt-3 border-t border-gray-700`}>
            <View style={tw`flex-row justify-between items-center`}>
              <Text style={[tw`text-[10px] font-bold uppercase tracking-widest`, { color: TEXT_SECONDARY }]}>Saldo Saat Ini</Text>
              <Text style={[tw`text-[13px] font-bold`, { color: TEXT_PRIMARY }]}>{formatCurrency(currentBalance)}</Text>
            </View>
            {currentBalance <= 0 && transactionType === "withdrawal" && (
              <Text style={[tw`text-[10px] mt-1`, { color: ERROR_COLOR }]}>Saldo tidak mencukupi untuk penarikan</Text>
            )}
          </View>
        </View>

        {/* Quick Amount Suggestions */}
        {!amount && (
          <View style={tw`mb-4`}>
            <Text style={[tw`text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1`, { color: TEXT_SECONDARY }]}>💡 Jumlah Cepat</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-1`}>
              <View style={tw`flex-row px-1`}>
                {getQuickPresets().map((preset) => {
                  const isDisabled = transactionType === "withdrawal" && parseFloat(preset.value) > currentBalance;
                  return (
                    <TouchableOpacity
                      key={preset.label}
                      style={[tw`rounded-xl px-4 py-2 mr-2`, { backgroundColor: SURFACE_COLOR, opacity: isDisabled ? 0.5 : 1 }]}
                      onPress={() => !isDisabled && setAmount(preset.value)}
                      disabled={isDisabled || loading}
                    >
                      <Text style={[tw`text-xs font-bold`, { color: isDisabled ? Colors.gray500 : ACCENT_COLOR }]}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Amount Input */}
        <View style={tw`mb-4`}>
          <Text style={[tw`text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1`, { color: TEXT_SECONDARY }]}>Jumlah</Text>
          <View style={[tw`rounded-xl px-4 py-3`, { backgroundColor: SURFACE_COLOR, borderWidth: amountError ? 1 : 0, borderColor: amountError ? ERROR_COLOR : "transparent" }]}>
            <View style={tw`flex-row items-center`}>
              <Text style={[tw`text-lg font-bold mr-2`, { color: TEXT_SECONDARY }]}>Rp</Text>
              <TextInput
                style={[tw`flex-1 text-xl font-bold`, { color: TEXT_PRIMARY, padding: 0 }]}
                placeholder="0"
                placeholderTextColor={Colors.textTertiary}
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                returnKeyType="done"
                maxLength={15}
                editable={!loading}
              />
            </View>
            {amount && !amountError ? (
              <View style={tw`mt-2 pt-2 border-t border-gray-700`}>
                <Text style={[tw`text-[10px] font-medium`, { color: TEXT_SECONDARY }]}>{formatAmountDisplay()}</Text>
              </View>
            ) : null}
            {amountError ? <Text style={[tw`text-[10px] mt-1`, { color: ERROR_COLOR }]}>{amountError}</Text> : null}
          </View>
        </View>

        {/* Balance Preview */}
        {amount && safeNumber(parseFloat(amount)) > 0 && (
          <View style={[tw`rounded-xl p-4 mb-4`, { backgroundColor: INFO_COLOR + "10" }]}>
            <View style={tw`flex-row items-center mb-2`}>
              <Ionicons name="calculator-outline" size={14} color={INFO_COLOR} />
              <Text style={[tw`text-[11px] font-bold uppercase tracking-widest ml-1`, { color: INFO_COLOR }]}>Preview Transaksi</Text>
            </View>

            <View style={tw`space-y-1`}>
              <View style={tw`flex-row justify-between items-center`}>
                <Text style={[tw`text-[11px] font-bold`, { color: TEXT_SECONDARY }]}>Saldo saat ini:</Text>
                <Text style={[tw`text-[11px] font-bold`, { color: TEXT_PRIMARY }]}>{formatCurrency(currentBalance)}</Text>
              </View>

              <View style={tw`flex-row justify-between items-center`}>
                <Text style={[tw`text-[11px] font-bold`, { color: TEXT_SECONDARY }]}>
                  {transactionType === "deposit" ? "Setoran (+)" : "Penarikan (-)"}:
                </Text>
                <Text style={[tw`text-[11px] font-bold`, transactionType === "deposit" ? { color: SUCCESS_COLOR } : { color: ERROR_COLOR }]}>
                  {transactionType === "deposit" ? "+" : "-"} {formatCurrency(safeNumber(parseFloat(amount)))}
                </Text>
              </View>

              <View style={tw`h-px bg-gray-700 my-1`} />

              <View style={tw`flex-row justify-between items-center`}>
                <Text style={[tw`text-[11px] font-bold`, { color: TEXT_PRIMARY }]}>Saldo baru:</Text>
                <Text style={[tw`text-[11px] font-bold`, { color: TEXT_PRIMARY }]}>{formatCurrency(newBalance)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Date Selection */}
        <View style={tw`mb-4`}>
          <Text style={[tw`text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1`, { color: TEXT_SECONDARY }]}>Tanggal Transaksi</Text>
          <TouchableOpacity
            style={[tw`rounded-xl p-3 flex-row justify-between items-center`, { backgroundColor: SURFACE_COLOR }]}
            onPress={() => setShowCalendar(true)}
            disabled={loading}
          >
            <View style={tw`flex-1 mr-3`}>
              <Text style={[tw`text-[13px] font-semibold`, { color: TEXT_PRIMARY }]}>{formatDisplayDate(date)}</Text>
            </View>
            <Ionicons name="calendar-outline" size={16} color={Colors.gray500} />
          </TouchableOpacity>
        </View>

        {/* Note Input */}
        <View style={tw`mb-4`}>
          <View style={tw`flex-row items-center justify-between mb-1.5 ml-1`}>
            <Text style={[tw`text-[10px] font-bold uppercase tracking-widest`, { color: TEXT_SECONDARY }]}>Catatan (opsional)</Text>
            <Text style={[tw`text-[10px]`, { color: Colors.gray500 }]}>{note.length}/100</Text>
          </View>
          <View style={[tw`rounded-xl px-4 py-3`, { backgroundColor: SURFACE_COLOR }]}>
            <TextInput
              style={[tw`text-[13px] font-medium min-h-[60px]`, { color: TEXT_PRIMARY, padding: 0 }]}
              placeholder="Tambahkan catatan..."
              placeholderTextColor={Colors.textTertiary}
              value={note}
              onChangeText={setNote}
              multiline
              textAlignVertical="top"
              maxLength={100}
              editable={!loading}
            />
          </View>
        </View>

        {/* Tips */}
        <View style={[tw`rounded-xl p-4 mb-4`, { backgroundColor: INFO_COLOR + "10" }]}>
          <View style={tw`flex-row items-center mb-2`}>
            <Ionicons name="bulb-outline" size={14} color={INFO_COLOR} />
            <Text style={[tw`text-[11px] font-bold uppercase tracking-widest ml-1`, { color: INFO_COLOR }]}>
              Tips {transactionType === "deposit" ? "Setoran" : "Penarikan"}
            </Text>
          </View>

          {transactionType === "deposit" ? (
            <>
              <Text style={[tw`text-[11px] mb-1`, { color: INFO_COLOR }]}><Text style={tw`font-bold`}>Rutin</Text>: Setor berkala</Text>
              <Text style={[tw`text-[11px] mb-1`, { color: INFO_COLOR }]}><Text style={tw`font-bold`}>Pay Yourself First</Text>: Sisihkan awal bulan</Text>
              <Text style={[tw`text-[11px]`, { color: INFO_COLOR }]}><Text style={tw`font-bold`}>Automate</Text>: Set autodebit</Text>
            </>
          ) : (
            <>
              <Text style={[tw`text-[11px] mb-1`, { color: INFO_COLOR }]}><Text style={tw`font-bold`}>Plan</Text>: Rencanakan penarikan</Text>
              <Text style={[tw`text-[11px] mb-1`, { color: INFO_COLOR }]}><Text style={tw`font-bold`}>Emergency Only</Text>: Prioritas darurat</Text>
              <Text style={[tw`text-[11px]`, { color: INFO_COLOR }]}><Text style={tw`font-bold`}>Leave Buffer</Text>: Sisakan saldo</Text>
            </>
          )}
        </View>

        {/* Action Buttons */}
        <View style={tw`flex-row gap-3 mt-2`}>
          <TouchableOpacity
            style={[tw`flex-1 rounded-xl py-3.5 items-center`, { backgroundColor: SURFACE_COLOR }]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={[tw`text-[13px] font-bold`, { color: TEXT_PRIMARY }]}>Batal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[tw`flex-1 rounded-xl py-3.5 items-center`, { backgroundColor: transactionType === "deposit" ? SUCCESS_COLOR : ERROR_COLOR, opacity: (!amount || loading) ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={!amount || loading}
          >
            <Text style={tw`text-white text-[13px] font-bold`}>
              {loading ? "Menyimpan..." : transactionType === "deposit" ? "Tambah Setoran" : "Lakukan Penarikan"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <TouchableOpacity
          style={tw`flex-1 justify-center px-4 bg-black/60`}
          activeOpacity={1}
          onPress={() => setShowCalendar(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[tw`rounded-2xl overflow-hidden`, { backgroundColor: SURFACE_COLOR }]}>
            <Calendar
              current={date}
              onDayPress={handleDateSelect}
              markedDates={{
                [date]: {
                  selected: true,
                  selectedColor: ACCENT_COLOR,
                  selectedTextColor: "#FFFFFF",
                },
              }}
              maxDate={getCurrentDate()}
              theme={{
                calendarBackground: SURFACE_COLOR,
                textSectionTitleColor: TEXT_SECONDARY,
                selectedDayBackgroundColor: ACCENT_COLOR,
                selectedDayTextColor: "#FFFFFF",
                todayTextColor: ACCENT_COLOR,
                dayTextColor: TEXT_PRIMARY,
                textDisabledColor: Colors.textTertiary,
                monthTextColor: TEXT_PRIMARY,
                arrowColor: ACCENT_COLOR,
              }}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default AddSavingsTransactionScreen;
