// File: src/screens/AddTransactionScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { getCurrentDate, safeNumber } from "../../utils/calculations";
import { RootStackParamList, TransactionType } from "../../types";

type AddTransactionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddTransaction"
>;

type AddTransactionScreenRouteProp = RouteProp<
  RootStackParamList,
  "AddTransaction"
>;

// Categories with icons
const CATEGORIES = [
  { id: "makanan", name: "Makanan", icon: "restaurant-outline" },
  { id: "transportasi", name: "Transportasi", icon: "car-outline" },
  { id: "belanja", name: "Belanja", icon: "cart-outline" },
  { id: "hiburan", name: "Hiburan", icon: "film-outline" },
  { id: "kesehatan", name: "Kesehatan", icon: "medical-outline" },
  { id: "pendidikan", name: "Pendidikan", icon: "school-outline" },
  { id: "tagihan", name: "Tagihan", icon: "document-text-outline" },
  { id: "gaji", name: "Gaji", icon: "cash-outline" },
  { id: "investasi", name: "Investasi", icon: "trending-up-outline" },
  { id: "lainnya", name: "Lainnya", icon: "ellipsis-horizontal-outline" },
] as const;

const AddTransactionScreen: React.FC = () => {
  const navigation = useNavigation<AddTransactionScreenNavigationProp>();
  const route = useRoute<AddTransactionScreenRouteProp>();
  const { addTransaction, editTransaction } = useAppContext();

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(getCurrentDate());
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amountError, setAmountError] = useState("");

  // Get params with safe defaults
  const params = route.params || {};
  const isEditMode = params.editMode || false;
  const transactionData = params.transactionData;

  // Initialize form with transaction data if in edit mode
  useEffect(() => {
    if (isEditMode && transactionData) {
      setType(transactionData.type);
      setAmount(safeNumber(transactionData.amount).toString());
      setCategory(transactionData.category);
      setDescription(transactionData.description || "");
      setDate(transactionData.date);
    }

    // Set navigation title
    navigation.setOptions({
      title: isEditMode ? "Edit Transaksi" : "Tambah Transaksi",
      headerStyle: {
        backgroundColor: "#4F46E5",
      },
      headerTintColor: "#FFFFFF",
      headerTitleStyle: {
        fontWeight: "600",
      },
      headerRight: () => (
        <TouchableOpacity
          onPress={handleDelete}
          style={tw`mr-4 ${isEditMode ? "opacity-100" : "opacity-0"}`}
        >
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      ),
    });
  }, [isEditMode, transactionData, navigation]);

  // Validate amount input
  const validateAmount = (value: string): boolean => {
    setAmountError("");

    if (!value.trim()) {
      setAmountError("Jumlah harus diisi");
      return false;
    }

    const amountNum = safeNumber(parseFloat(value.replace(/[^0-9.]/g, "")));
    if (isNaN(amountNum) || amountNum <= 0) {
      setAmountError("Jumlah harus angka positif");
      return false;
    }

    if (amountNum > 1000000000) {
      // 1 Miliar
      setAmountError("Jumlah terlalu besar");
      return false;
    }

    return true;
  };

  // Format amount while typing
  const handleAmountChange = (value: string) => {
    // Remove non-numeric characters except decimal point
    const cleanValue = value.replace(/[^0-9.]/g, "");

    // Only allow one decimal point
    const parts = cleanValue.split(".");
    if (parts.length > 2) {
      return;
    }

    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return;
    }

    setAmount(cleanValue);

    // Validate as user types
    if (cleanValue) {
      validateAmount(cleanValue);
    } else {
      setAmountError("");
    }
  };

  // Format amount for display
  const formatAmountDisplay = () => {
    if (!amount) return "";

    const amountNum = safeNumber(parseFloat(amount));
    if (isNaN(amountNum)) return amount;

    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amountNum);
  };

  // Handle date select from calendar
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

  // Handle delete transaction
  const handleDelete = () => {
    if (!isEditMode || !transactionData) return;

    Alert.alert(
      "Hapus Transaksi",
      "Apakah Anda yakin ingin menghapus transaksi ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              const { deleteTransaction } = useAppContext();
              await deleteTransaction(transactionData.id);
              navigation.goBack();
            } catch (error) {
              console.error("Delete error:", error);
              Alert.alert("Error", "Gagal menghapus transaksi");
            }
          },
        },
      ]
    );
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateAmount(amount)) {
      Alert.alert("Error", amountError || "Jumlah tidak valid");
      return;
    }

    if (!category) {
      Alert.alert("Error", "Pilih kategori transaksi");
      return;
    }

    if (!date) {
      Alert.alert("Error", "Pilih tanggal transaksi");
      return;
    }

    const amountNum = safeNumber(parseFloat(amount));

    setLoading(true);
    try {
      if (isEditMode && transactionData) {
        // Edit existing transaction
        await editTransaction(transactionData.id, {
          amount: amountNum,
          type,
          category,
          description: description.trim(),
          date,
        });
        Alert.alert("Sukses", "Transaksi berhasil diperbarui", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        // Add new transaction
        await addTransaction({
          amount: amountNum,
          type,
          category,
          description: description.trim(),
          date,
        });
        Alert.alert("Sukses", "Transaksi berhasil ditambahkan", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      console.error("Save error:", error);
      Alert.alert(
        "Error",
        error.message ||
          `Gagal ${isEditMode ? "mengedit" : "menambah"} transaksi`
      );
    } finally {
      setLoading(false);
    }
  };

  // Get formatted date for display
  const getFormattedDate = () => {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return date;
      }

      return dateObj.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return date;
    }
  };

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        {/* Transaction Type Selection */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-gray-800 text-base font-medium mb-3`}>
            Tipe Transaksi
          </Text>
          <View style={tw`flex-row bg-gray-100 rounded-xl p-1`}>
            <TouchableOpacity
              style={tw`flex-1 py-3 rounded-lg ${
                type === "expense" ? "bg-white shadow-sm" : ""
              }`}
              onPress={() => setType("expense")}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <View
                  style={tw`w-8 h-8 rounded-full bg-red-100 justify-center items-center mr-2`}
                >
                  <Ionicons name="arrow-up" size={16} color="#EF4444" />
                </View>
                <Text
                  style={tw`text-sm font-medium ${
                    type === "expense" ? "text-red-600" : "text-gray-600"
                  }`}
                >
                  Pengeluaran
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`flex-1 py-3 rounded-lg ${
                type === "income" ? "bg-white shadow-sm" : ""
              }`}
              onPress={() => setType("income")}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <View
                  style={tw`w-8 h-8 rounded-full bg-emerald-100 justify-center items-center mr-2`}
                >
                  <Ionicons name="arrow-down" size={16} color="#10B981" />
                </View>
                <Text
                  style={tw`text-sm font-medium ${
                    type === "income" ? "text-emerald-600" : "text-gray-600"
                  }`}
                >
                  Pemasukan
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount Input */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-gray-800 text-base font-medium mb-3`}>
            Jumlah
          </Text>
          <View
            style={tw`bg-white rounded-xl border ${
              amountError ? "border-red-300" : "border-gray-300"
            } p-4`}
          >
            <View style={tw`flex-row items-center`}>
              <Text style={tw`text-gray-700 text-lg mr-2`}>Rp</Text>
              <TextInput
                style={tw`flex-1 text-gray-800 text-xl font-medium`}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="decimal-pad"
                returnKeyType="done"
                maxLength={15}
              />
            </View>
            {amount ? (
              <Text style={tw`text-gray-500 text-sm mt-1`}>
                {formatAmountDisplay()}
              </Text>
            ) : null}
            {amountError ? (
              <Text style={tw`text-red-500 text-xs mt-2`}>{amountError}</Text>
            ) : null}
          </View>
        </View>

        {/* Category Selection */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-gray-800 text-base font-medium mb-3`}>
            Kategori
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={tw`-mx-2`}
            contentContainerStyle={tw`px-2`}
          >
            <View style={tw`flex-row flex-wrap`}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={tw`items-center mr-3 mb-3`}
                  onPress={() => setCategory(cat.name)}
                >
                  <View
                    style={tw`w-16 h-16 rounded-xl justify-center items-center ${
                      category === cat.name
                        ? type === "income"
                          ? "bg-emerald-100 border-2 border-emerald-500"
                          : "bg-red-100 border-2 border-red-500"
                        : "bg-gray-100"
                    }`}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={24}
                      color={
                        category === cat.name
                          ? type === "income"
                            ? "#10B981"
                            : "#EF4444"
                          : "#6B7280"
                      }
                    />
                  </View>
                  <Text
                    style={tw`text-xs mt-2 text-center ${
                      category === cat.name
                        ? "font-medium text-gray-800"
                        : "text-gray-600"
                    }`}
                    numberOfLines={2}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Description Input */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-gray-800 text-base font-medium mb-3`}>
            Deskripsi (opsional)
          </Text>
          <View style={tw`bg-white rounded-xl border border-gray-300 p-3`}>
            <TextInput
              style={tw`text-gray-800 text-sm min-h-20`}
              placeholder="Contoh: Makan siang di kantin, beli buku, dll."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              maxLength={200}
            />
            <Text style={tw`text-gray-400 text-xs text-right mt-1`}>
              {description.length}/200
            </Text>
          </View>
        </View>

        {/* Date Selection */}
        <View style={tw`mb-8`}>
          <Text style={tw`text-gray-800 text-base font-medium mb-3`}>
            Tanggal
          </Text>
          <TouchableOpacity
            style={tw`bg-white rounded-xl border border-gray-300 p-4 flex-row justify-between items-center`}
            onPress={() => setShowCalendar(true)}
          >
            <View>
              <Text style={tw`text-gray-800 text-sm font-medium mb-1`}>
                {getFormattedDate()}
              </Text>
              <Text style={tw`text-gray-400 text-xs`}>
                Ketuk untuk mengubah tanggal
              </Text>
            </View>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Edit Mode Info */}
        {isEditMode && transactionData && (
          <View
            style={tw`bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200`}
          >
            <Text style={tw`text-gray-700 text-sm font-medium mb-2`}>
              Informasi Transaksi
            </Text>
            <View style={tw`flex-row justify-between mb-2`}>
              <Text style={tw`text-gray-500 text-xs`}>ID Transaksi:</Text>
              <Text style={tw`text-gray-800 text-xs font-medium`}>
                {transactionData.id.substring(0, 8)}...
              </Text>
            </View>
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-gray-500 text-xs`}>Dibuat pada:</Text>
              <Text style={tw`text-gray-800 text-xs`}>
                {new Date(transactionData.createdAt).toLocaleDateString(
                  "id-ID"
                )}
              </Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={tw`bg-indigo-600 rounded-xl py-4 items-center justify-center ${
            loading ? "opacity-70" : ""
          }`}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <View style={tw`flex-row items-center`}>
              <Text style={tw`text-white text-base font-medium mr-2`}>
                Menyimpan...
              </Text>
            </View>
          ) : (
            <Text style={tw`text-white text-base font-medium`}>
              {isEditMode ? "Simpan Perubahan" : "Simpan Transaksi"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={tw`border border-gray-300 rounded-xl py-3 items-center justify-center mt-3`}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={tw`text-gray-700 text-sm font-medium`}>Batal</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
          <View style={tw`bg-white rounded-t-3xl p-4`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-gray-800 text-lg font-bold`}>
                Pilih Tanggal
              </Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Ionicons name="close-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={{
                [date]: {
                  selected: true,
                  selectedColor: "#4F46E5",
                  selectedTextColor: "#FFFFFF",
                },
              }}
              theme={{
                backgroundColor: "#ffffff",
                calendarBackground: "#ffffff",
                textSectionTitleColor: "#6B7280",
                selectedDayBackgroundColor: "#4F46E5",
                selectedDayTextColor: "#ffffff",
                todayTextColor: "#4F46E5",
                dayTextColor: "#374151",
                textDisabledColor: "#D1D5DB",
                dotColor: "#4F46E5",
                selectedDotColor: "#ffffff",
                arrowColor: "#4F46E5",
                monthTextColor: "#4F46E5",
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

export default AddTransactionScreen;
