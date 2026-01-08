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
  useEffect(() => {
    navigation.setOptions({
      title:
        transactionType === "deposit" ? "Tambah Setoran" : "Penarikan Dana",
      headerStyle: { backgroundColor: PRIMARY_COLOR },
      headerTintColor: TEXT_PRIMARY,
      headerTitleStyle: { fontWeight: "600" },
    });
  }, [transactionType, navigation]);

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
    <View style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-5 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        {/* Savings Info */}
        <View
          style={[
            tw`rounded-2xl p-4 mb-5`,
            {
              backgroundColor: SURFACE_COLOR,
              borderWidth: 1,
              borderColor: BORDER_COLOR,
            },
          ]}
        >
          <View style={tw`flex-row items-center mb-4`}>
            <View
              style={[
                tw`w-12 h-12 rounded-full items-center justify-center mr-3`,
                { backgroundColor: ACCENT_COLOR + "20" },
              ]}
            >
              <Ionicons
                name={(saving.icon as any) || "wallet"}
                size={24}
                color={ACCENT_COLOR}
              />
            </View>
            <View style={tw`flex-1`}>
              <Text
                style={[tw`text-base font-semibold`, { color: TEXT_PRIMARY }]}
              >
                {saving.name}
              </Text>
              <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
                Target: {formatCurrency(safeNumber(saving.target))}
              </Text>
            </View>
          </View>

          {/* Transaction Type Selection - KONSISTEN STYLE */}
          <View style={tw`flex-row gap-2`}>
            <TouchableOpacity
              style={[
                tw`flex-1 rounded-xl px-3 py-2.5 border`,
                transactionType === "deposit"
                  ? {
                      backgroundColor: SUCCESS_COLOR + "15",
                      borderColor: SUCCESS_COLOR,
                    }
                  : {
                      backgroundColor: SURFACE_COLOR,
                      borderColor: BORDER_COLOR,
                    },
              ]}
              onPress={() => setTransactionType("deposit")}
              disabled={loading}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <Ionicons
                  name="arrow-down"
                  size={16}
                  color={
                    transactionType === "deposit"
                      ? SUCCESS_COLOR
                      : TEXT_SECONDARY
                  }
                />
                <Text
                  style={[
                    tw`text-xs font-semibold ml-1.5`,
                    {
                      color:
                        transactionType === "deposit"
                          ? SUCCESS_COLOR
                          : TEXT_SECONDARY,
                    },
                  ]}
                >
                  Setoran
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                tw`flex-1 rounded-xl px-3 py-2.5 border`,
                transactionType === "withdrawal"
                  ? {
                      backgroundColor: ERROR_COLOR + "15",
                      borderColor: ERROR_COLOR,
                    }
                  : {
                      backgroundColor: SURFACE_COLOR,
                      borderColor: BORDER_COLOR,
                    },
              ]}
              onPress={() => setTransactionType("withdrawal")}
              disabled={loading || currentBalance <= 0}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <Ionicons
                  name="arrow-up"
                  size={16}
                  color={
                    transactionType === "withdrawal"
                      ? ERROR_COLOR
                      : currentBalance <= 0
                      ? Colors.textTertiary
                      : TEXT_SECONDARY
                  }
                />
                <Text
                  style={[
                    tw`text-xs font-semibold ml-1.5`,
                    {
                      color:
                        transactionType === "withdrawal"
                          ? ERROR_COLOR
                          : currentBalance <= 0
                          ? Colors.textTertiary
                          : TEXT_SECONDARY,
                    },
                  ]}
                >
                  Penarikan
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Current Balance */}
          <View style={tw`mt-4 pt-4 border-t border-gray-700`}>
            <View style={tw`flex-row justify-between`}>
              <Text
                style={[tw`text-sm font-medium`, { color: TEXT_SECONDARY }]}
              >
                Saldo Saat Ini:
              </Text>
              <Text style={[tw`text-sm font-bold`, { color: TEXT_PRIMARY }]}>
                {formatCurrency(currentBalance)}
              </Text>
            </View>
            {currentBalance <= 0 && transactionType === "withdrawal" && (
              <Text style={[tw`text-xs mt-1`, { color: ERROR_COLOR }]}>
                Saldo tidak mencukupi untuk penarikan
              </Text>
            )}
          </View>
        </View>

        {/* Quick Amount Suggestions - KONSISTEN DENGAN SCREEN LAIN */}
        {!amount && (
          <View style={tw`mb-5`}>
            <Text
              style={[tw`text-xs font-medium mb-2`, { color: TEXT_SECONDARY }]}
            >
              💡 Jumlah Cepat
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={tw`-mx-1`}
            >
              <View style={tw`flex-row px-1`}>
                {getQuickPresets().map((preset) => {
                  const isDisabled =
                    transactionType === "withdrawal" &&
                    parseFloat(preset.value) > currentBalance;

                  return (
                    <TouchableOpacity
                      key={preset.label}
                      style={[
                        tw`rounded-xl px-4 py-2 mr-2`,
                        {
                          backgroundColor: SURFACE_COLOR,
                          borderWidth: 1,
                          borderColor: BORDER_COLOR,
                          opacity: isDisabled ? 0.5 : 1,
                        },
                      ]}
                      onPress={() => !isDisabled && setAmount(preset.value)}
                      disabled={isDisabled || loading}
                    >
                      <Text
                        style={[
                          tw`text-xs font-medium`,
                          {
                            color: isDisabled
                              ? Colors.textTertiary
                              : ACCENT_COLOR,
                          },
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Amount Input - KONSISTEN STYLE */}
        <View style={tw`mb-5`}>
          <Text
            style={[tw`text-sm font-medium mb-3`, { color: TEXT_SECONDARY }]}
          >
            Jumlah
          </Text>
          <View
            style={[
              tw`rounded-2xl p-5 border`,
              {
                backgroundColor: SURFACE_COLOR,
                borderColor: amountError ? ERROR_COLOR : BORDER_COLOR,
              },
            ]}
          >
            <View style={tw`flex-row items-center`}>
              <Text style={[tw`text-xl mr-2`, { color: TEXT_SECONDARY }]}>
                Rp
              </Text>
              <TextInput
                style={[
                  tw`flex-1 text-2xl font-semibold`,
                  { color: TEXT_PRIMARY },
                ]}
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
              <View style={tw`mt-3 pt-3 border-t border-gray-700`}>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  {formatAmountDisplay()}
                </Text>
              </View>
            ) : null}
            {amountError ? (
              <Text style={[tw`text-xs mt-2`, { color: ERROR_COLOR }]}>
                {amountError}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Balance Preview */}
        {amount && safeNumber(parseFloat(amount)) > 0 && (
          <View
            style={[
              tw`rounded-2xl p-4 mb-5`,
              {
                backgroundColor: INFO_COLOR + "10",
                borderWidth: 1,
                borderColor: INFO_COLOR + "30",
              },
            ]}
          >
            <View style={tw`flex-row items-center mb-3`}>
              <Ionicons
                name="calculator-outline"
                size={16}
                color={INFO_COLOR}
              />
              <Text
                style={[tw`text-sm font-semibold ml-2`, { color: INFO_COLOR }]}
              >
                Preview Transaksi
              </Text>
            </View>

            <View style={tw`space-y-2`}>
              <View style={tw`flex-row justify-between`}>
                <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
                  Saldo saat ini:
                </Text>
                <Text
                  style={[tw`text-sm font-medium`, { color: TEXT_PRIMARY }]}
                >
                  {formatCurrency(currentBalance)}
                </Text>
              </View>

              <View style={tw`flex-row justify-between`}>
                <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
                  {transactionType === "deposit"
                    ? "Setoran (+)"
                    : "Penarikan (-)"}
                  :
                </Text>
                <Text
                  style={[
                    tw`text-sm font-bold`,
                    transactionType === "deposit"
                      ? { color: SUCCESS_COLOR }
                      : { color: ERROR_COLOR },
                  ]}
                >
                  {transactionType === "deposit" ? "+" : "-"}{" "}
                  {formatCurrency(safeNumber(parseFloat(amount)))}
                </Text>
              </View>

              <View style={tw`h-px bg-gray-700 my-2`} />

              <View style={tw`flex-row justify-between`}>
                <Text style={[tw`text-sm font-bold`, { color: TEXT_PRIMARY }]}>
                  Saldo baru:
                </Text>
                <Text style={[tw`text-sm font-bold`, { color: TEXT_PRIMARY }]}>
                  {formatCurrency(newBalance)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Date Selection - KONSISTEN STYLE */}
        <View style={tw`mb-5`}>
          <Text
            style={[tw`text-sm font-medium mb-3`, { color: TEXT_SECONDARY }]}
          >
            Tanggal Transaksi
          </Text>
          <TouchableOpacity
            style={[
              tw`rounded-2xl p-4 flex-row justify-between items-center border`,
              { backgroundColor: SURFACE_COLOR, borderColor: BORDER_COLOR },
            ]}
            onPress={() => setShowCalendar(true)}
            disabled={loading}
          >
            <View style={tw`flex-1 mr-3`}>
              <Text style={[tw`text-sm font-medium`, { color: TEXT_PRIMARY }]}>
                {formatDisplayDate(date)}
              </Text>
            </View>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={TEXT_SECONDARY}
            />
          </TouchableOpacity>
        </View>

        {/* Note Input - KONSISTEN STYLE */}
        <View style={tw`mb-5`}>
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <Text style={[tw`text-sm font-medium`, { color: TEXT_SECONDARY }]}>
              Catatan (opsional)
            </Text>
            <Text style={[tw`text-xs`, { color: Colors.textTertiary }]}>
              {note.length}/100
            </Text>
          </View>
          <View
            style={[
              tw`rounded-2xl p-4 border`,
              { backgroundColor: SURFACE_COLOR, borderColor: BORDER_COLOR },
            ]}
          >
            <TextInput
              style={[tw`text-sm min-h-20`, { color: TEXT_PRIMARY }]}
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
        <View
          style={[
            tw`rounded-2xl p-4 mb-5`,
            {
              backgroundColor: INFO_COLOR + "10",
              borderWidth: 1,
              borderColor: INFO_COLOR + "30",
            },
          ]}
        >
          <View style={tw`flex-row items-center mb-3`}>
            <Ionicons name="bulb-outline" size={16} color={INFO_COLOR} />
            <Text
              style={[tw`text-sm font-semibold ml-2`, { color: INFO_COLOR }]}
            >
              💡 Tips {transactionType === "deposit" ? "Setoran" : "Penarikan"}
            </Text>
          </View>

          {transactionType === "deposit" ? (
            <>
              <Text style={[tw`text-xs mb-1`, { color: INFO_COLOR }]}>
                • <Text style={tw`font-medium`}>Rutin</Text>: Setor secara
                berkala untuk konsistensi
              </Text>
              <Text style={[tw`text-xs mb-1`, { color: INFO_COLOR }]}>
                • <Text style={tw`font-medium`}>Pay Yourself First</Text>:
                Sisihkan 20% dari pendapatan
              </Text>
              <Text style={[tw`text-xs`, { color: INFO_COLOR }]}>
                • <Text style={tw`font-medium`}>Automate</Text>: Gunakan
                autodebit untuk disiplin
              </Text>
            </>
          ) : (
            <>
              <Text style={[tw`text-xs mb-1`, { color: INFO_COLOR }]}>
                • <Text style={tw`font-medium`}>Plan</Text>: Rencanakan
                penarikan sesuai kebutuhan
              </Text>
              <Text style={[tw`text-xs mb-1`, { color: INFO_COLOR }]}>
                • <Text style={tw`font-medium`}>Emergency Only</Text>:
                Prioritaskan untuk kebutuhan darurat
              </Text>
              <Text style={[tw`text-xs`, { color: INFO_COLOR }]}>
                • <Text style={tw`font-medium`}>Leave Buffer</Text>: Sisakan
                saldo untuk biaya tak terduga
              </Text>
            </>
          )}
        </View>

        {/* Action Buttons - KONSISTEN STYLE */}
        <View style={tw`flex-row gap-3 mt-3`}>
          {/* Batal Button */}
          <TouchableOpacity
            style={[
              tw`flex-1 rounded-2xl py-4 items-center border-2`,
              { borderColor: BORDER_COLOR, backgroundColor: SURFACE_COLOR },
            ]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={[tw`text-sm font-semibold`, { color: TEXT_PRIMARY }]}>
              Batal
            </Text>
          </TouchableOpacity>

          {/* Simpan Button */}
          <TouchableOpacity
            style={[
              tw`flex-1 rounded-2xl py-4 items-center`,
              {
                backgroundColor:
                  transactionType === "deposit" ? SUCCESS_COLOR : ERROR_COLOR,
                opacity: !amount || loading ? 0.7 : 1,
              },
            ]}
            onPress={handleSubmit}
            disabled={!amount || loading}
          >
            <Text style={tw`text-white text-sm font-semibold`}>
              {loading
                ? "Menyimpan..."
                : transactionType === "deposit"
                ? "Tambah Setoran"
                : "Lakukan Penarikan"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Calendar Modal - KONSISTEN STYLE */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
          <View
            style={[tw`rounded-t-3xl p-5`, { backgroundColor: SURFACE_COLOR }]}
          >
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={[tw`text-lg font-bold`, { color: TEXT_PRIMARY }]}>
                Pilih Tanggal Transaksi
              </Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={TEXT_SECONDARY}
                />
              </TouchableOpacity>
            </View>
            <Calendar
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
                backgroundColor: SURFACE_COLOR,
                calendarBackground: SURFACE_COLOR,
                textSectionTitleColor: TEXT_SECONDARY,
                selectedDayBackgroundColor: ACCENT_COLOR,
                selectedDayTextColor: "#FFFFFF",
                todayTextColor: ACCENT_COLOR,
                dayTextColor: TEXT_PRIMARY,
                textDisabledColor: Colors.textTertiary,
                dotColor: ACCENT_COLOR,
                selectedDotColor: "#FFFFFF",
                arrowColor: ACCENT_COLOR,
                monthTextColor: ACCENT_COLOR,
                textMonthFontWeight: "bold",
                textDayFontSize: 16,
                textMonthFontSize: 18,
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AddSavingsTransactionScreen;
