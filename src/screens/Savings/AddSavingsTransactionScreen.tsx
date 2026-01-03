// File: src/screens/AddSavingsTransactionScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { formatCurrency, safeNumber } from "../../utils/calculations";

// Helper untuk format tanggal
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const AddSavingsTransactionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { savingsId, type = "deposit" } = route.params;

  const { state, addSavingsTransaction } = useAppContext();
  const [loading, setLoading] = useState(false);

  // Temukan savings berdasarkan ID
  const saving = state.savings?.find((s) => s.id === savingsId);

  if (!saving) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50 p-4`}>
        <Ionicons name="warning-outline" size={48} color="#EF4444" />
        <Text style={tw`text-lg font-semibold text-gray-900 mt-4 mb-2`}>
          Tabungan tidak ditemukan
        </Text>
        <TouchableOpacity
          style={tw`mt-4 px-4 py-2 bg-indigo-600 rounded-lg`}
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
  const [date, setDate] = useState(formatDate(new Date()));
  const [note, setNote] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  // Update title
  useEffect(() => {
    navigation.setOptions({
      title:
        transactionType === "deposit" ? "Tambah Setoran" : "Penarikan Dana",
      headerStyle: {
        backgroundColor: "#4F46E5",
      },
      headerTintColor: "#FFFFFF",
      headerTitleStyle: {
        fontWeight: "600",
      },
    });
  }, [transactionType, navigation]);

  // Format tanggal untuk display
  const formatDisplayDate = (dateStr: string): string => {
    try {
      const dateObj = parseDate(dateStr);
      return dateObj.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return dateStr;
    }
  };

  // Handle calendar
  const openCalendar = () => {
    setShowCalendar(true);
  };

  const handleCalendarSelect = (selectedDate: any) => {
    setDate(selectedDate.dateString);
    setShowCalendar(false);
  };

  // Format input angka
  const handleAmountChange = (text: string) => {
    const cleanedText = text.replace(/[^0-9]/g, "");
    setAmount(cleanedText);
  };

  // Handle submit - FIXED VERSION
  const handleSubmit = async () => {
    const amountNum = safeNumber(parseFloat(amount));

    if (amountNum <= 0) {
      Alert.alert("Error", "Jumlah harus lebih dari 0");
      return;
    }

    if (transactionType === "withdrawal") {
      const currentBalance = safeNumber(saving.current);
      if (amountNum > currentBalance) {
        Alert.alert(
          "Error",
          `Jumlah penarikan melebihi saldo (${formatCurrency(currentBalance)})`
        );
        return;
      }
    }

    setLoading(true);
    try {
      // Panggil fungsi dari context untuk menambahkan transaksi
      await addSavingsTransaction(saving.id, {
        type: transactionType,
        amount: amountNum,
        date,
        note,
      });

      Alert.alert(
        "Sukses",
        `${
          transactionType === "deposit" ? "Setoran" : "Penarikan"
        } berhasil ditambahkan`,
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("SavingsDetail", { savingsId }),
          },
        ]
      );
    } catch (error: any) {
      console.error("Error adding transaction:", error);
      Alert.alert("Error", error.message || "Gagal menambahkan transaksi");
    } finally {
      setLoading(false);
    }
  };

  // Calendar Modal
  const renderCalendarModal = () => (
    <Modal
      visible={showCalendar}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCalendar(false)}
    >
      <View style={tw`flex-1 justify-center items-center bg-black/50`}>
        <View style={tw`bg-white rounded-xl p-4 w-11/12`}>
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text style={tw`text-lg font-semibold text-gray-900`}>
              Pilih Tanggal
            </Text>
            <TouchableOpacity onPress={() => setShowCalendar(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Calendar
            current={date}
            onDayPress={handleCalendarSelect}
            markedDates={{
              [date]: {
                selected: true,
                selectedColor: "#4F46E5",
              },
            }}
            maxDate={formatDate(new Date())}
            theme={{
              backgroundColor: "#ffffff",
              calendarBackground: "#ffffff",
              textSectionTitleColor: "#6B7280",
              selectedDayBackgroundColor: "#4F46E5",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#4F46E5",
              dayTextColor: "#111827",
              textDisabledColor: "#D1D5DB",
              dotColor: "#4F46E5",
              selectedDotColor: "#ffffff",
              arrowColor: "#4F46E5",
              monthTextColor: "#111827",
              textDayFontFamily: "System",
              textMonthFontFamily: "System",
              textDayHeaderFontFamily: "System",
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
            style={tw`rounded-lg`}
          />

          <View style={tw`mt-4 flex-row justify-end`}>
            <TouchableOpacity
              style={tw`px-4 py-2 bg-indigo-600 rounded-lg`}
              onPress={() => setShowCalendar(false)}
            >
              <Text style={tw`text-white font-medium`}>Selesai</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const currentBalance = safeNumber(saving.current);
  const maxWithdrawal = currentBalance;

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        {/* Savings Info */}
        <View style={tw`bg-white rounded-xl p-4 mb-6 border border-gray-200`}>
          <View style={tw`flex-row items-center gap-3 mb-3`}>
            <View
              style={tw`w-12 h-12 rounded-full bg-indigo-100 items-center justify-center`}
            >
              <Ionicons
                name={(saving.icon as any) || "wallet"}
                size={24}
                color="#4F46E5"
              />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-base font-semibold text-gray-900`}>
                {saving.name}
              </Text>
              <Text style={tw`text-sm text-gray-600`}>
                Saldo saat ini: {formatCurrency(currentBalance)}
              </Text>
            </View>
          </View>

          <View style={tw`flex-row gap-2`}>
            <TouchableOpacity
              style={[
                tw`flex-1 py-2 rounded-lg items-center`,
                transactionType === "deposit"
                  ? tw`bg-emerald-600`
                  : tw`bg-gray-100`,
              ]}
              onPress={() => setTransactionType("deposit")}
            >
              <Text
                style={[
                  tw`text-sm font-medium`,
                  transactionType === "deposit"
                    ? tw`text-white`
                    : tw`text-gray-700`,
                ]}
              >
                Setoran
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                tw`flex-1 py-2 rounded-lg items-center`,
                transactionType === "withdrawal"
                  ? tw`bg-red-600`
                  : tw`bg-gray-100`,
              ]}
              onPress={() => setTransactionType("withdrawal")}
              disabled={currentBalance <= 0}
            >
              <Text
                style={[
                  tw`text-sm font-medium`,
                  transactionType === "withdrawal"
                    ? tw`text-white`
                    : currentBalance <= 0
                    ? tw`text-gray-400`
                    : tw`text-gray-700`,
                ]}
              >
                Penarikan
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount Input */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>
            Jumlah *
          </Text>
          <View
            style={tw`flex-row items-center bg-white border border-gray-300 rounded-lg px-3`}
          >
            <Text style={tw`text-gray-600 mr-2`}>Rp</Text>
            <TextInput
              style={tw`flex-1 py-3 text-gray-800 text-lg`}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              maxLength={15}
            />
          </View>

          {/* Quick Amount Presets */}
          <View style={tw`mt-3`}>
            <Text style={tw`text-xs text-gray-600 mb-2`}>Pilih cepat:</Text>
            <View style={tw`flex-row flex-wrap gap-2`}>
              {transactionType === "deposit"
                ? [
                    { label: "50rb", value: "50000" },
                    { label: "100rb", value: "100000" },
                    { label: "200rb", value: "200000" },
                    { label: "500rb", value: "500000" },
                  ].map((preset) => (
                    <TouchableOpacity
                      key={preset.label}
                      style={tw`px-3 py-1.5 bg-gray-100 rounded-lg active:bg-gray-200`}
                      onPress={() => setAmount(preset.value)}
                    >
                      <Text style={tw`text-xs text-gray-700`}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  ))
                : [
                    { label: "50rb", value: "50000" },
                    { label: "100rb", value: "100000" },
                    { label: "200rb", value: "200000" },
                    {
                      label: `Semua (${formatCurrency(maxWithdrawal)})`,
                      value: maxWithdrawal.toString(),
                    },
                  ].map((preset) => (
                    <TouchableOpacity
                      key={preset.label}
                      style={[
                        tw`px-3 py-1.5 bg-gray-100 rounded-lg active:bg-gray-200`,
                        parseFloat(preset.value) > maxWithdrawal &&
                          tw`opacity-50`,
                      ]}
                      onPress={() => {
                        if (parseFloat(preset.value) <= maxWithdrawal) {
                          setAmount(preset.value);
                        }
                      }}
                      disabled={parseFloat(preset.value) > maxWithdrawal}
                    >
                      <Text style={tw`text-xs text-gray-700`}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
            </View>
          </View>

          {/* Balance Preview */}
          {amount && safeNumber(parseFloat(amount)) > 0 && (
            <View style={tw`mt-4 bg-blue-50 p-3 rounded-lg`}>
              <View style={tw`flex-row justify-between items-center`}>
                <Text style={tw`text-sm font-medium text-gray-700`}>
                  Saldo saat ini:
                </Text>
                <Text style={tw`text-sm font-medium text-gray-900`}>
                  {formatCurrency(currentBalance)}
                </Text>
              </View>

              <View style={tw`flex-row justify-between items-center mt-1`}>
                <Text style={tw`text-sm font-medium text-gray-700`}>
                  {transactionType === "deposit" ? "+" : "-"}:
                </Text>
                <Text
                  style={[
                    tw`text-sm font-medium`,
                    transactionType === "deposit"
                      ? tw`text-emerald-600`
                      : tw`text-red-600`,
                  ]}
                >
                  {formatCurrency(safeNumber(parseFloat(amount)))}
                </Text>
              </View>

              <View style={tw`h-px bg-gray-300 my-2`} />

              <View style={tw`flex-row justify-between items-center`}>
                <Text style={tw`text-sm font-semibold text-gray-900`}>
                  Saldo baru:
                </Text>
                <Text style={tw`text-sm font-semibold text-gray-900`}>
                  {formatCurrency(
                    transactionType === "deposit"
                      ? currentBalance + safeNumber(parseFloat(amount))
                      : currentBalance - safeNumber(parseFloat(amount))
                  )}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Date Selection */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>
            Tanggal Transaksi
          </Text>
          <TouchableOpacity
            style={tw`flex-row items-center justify-between bg-white border border-gray-300 rounded-lg px-3 py-3`}
            onPress={openCalendar}
          >
            <View style={tw`flex-row items-center`}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color="#4F46E5"
                style={tw`mr-2`}
              />
              <Text style={tw`text-gray-800`}>{formatDisplayDate(date)}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Note Input */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>
            Catatan (Opsional)
          </Text>
          <TextInput
            style={tw`bg-white border border-gray-300 rounded-lg px-3 py-3 text-gray-800 min-h-[80px]`}
            placeholder="Tambahkan catatan..."
            placeholderTextColor="#9CA3AF"
            value={note}
            onChangeText={setNote}
            multiline
            textAlignVertical="top"
            maxLength={100}
          />
          <Text style={tw`text-xs text-gray-500 mt-1 text-right`}>
            {note.length}/100 karakter
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={tw`flex-row gap-3`}>
          <TouchableOpacity
            style={[
              tw`flex-1 py-3 rounded-lg items-center`,
              !amount || loading
                ? tw`bg-gray-400`
                : transactionType === "deposit"
                ? tw`bg-emerald-600 active:bg-emerald-700`
                : tw`bg-red-600 active:bg-red-700`,
            ]}
            onPress={handleSubmit}
            disabled={!amount || loading}
          >
            {loading ? (
              <Text style={tw`text-white font-medium`}>Menyimpan...</Text>
            ) : (
              <Text style={tw`text-white font-medium`}>
                {transactionType === "deposit"
                  ? "Tambah Setoran"
                  : "Lakukan Penarikan"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          style={tw`py-3 border border-gray-300 rounded-lg items-center mt-3 active:bg-gray-50`}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={tw`text-gray-700`}>Batal</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Calendar Modal */}
      {renderCalendarModal()}
    </View>
  );
};

export default AddSavingsTransactionScreen;
