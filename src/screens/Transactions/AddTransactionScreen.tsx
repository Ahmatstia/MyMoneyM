import React, { useState, useEffect, useCallback } from "react";
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
import { Colors } from "../../theme/theme";

type AddTransactionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddTransaction"
>;

type AddTransactionScreenRouteProp = RouteProp<
  RootStackParamList,
  "AddTransaction"
>;

// GUNAKAN WARNA DARI TEMA NAVY BLUE
const PRIMARY_COLOR = Colors.primary; // "#0F172A" - Navy blue gelap
const ACCENT_COLOR = Colors.accent; // "#22D3EE" - Cyan terang
const BACKGROUND_COLOR = Colors.background; // "#0F172A" - Background navy blue gelap
const SURFACE_COLOR = Colors.surface; // "#1E293B" - Permukaan navy blue medium
const TEXT_PRIMARY = Colors.textPrimary; // "#F8FAFC" - Teks utama putih
const TEXT_SECONDARY = Colors.textSecondary; // "#CBD5E1" - Teks sekunder abu-abu muda
const BORDER_COLOR = Colors.border; // "#334155" - Border navy blue lebih terang
const SUCCESS_COLOR = Colors.success; // "#10B981" - Hijau
const WARNING_COLOR = Colors.warning; // "#F59E0B" - Kuning
const ERROR_COLOR = Colors.error; // "#EF4444" - Merah

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
  const { addTransaction, editTransaction, deleteTransaction } =
    useAppContext();

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

  // ✅ FIX CRITICAL: Buat delete handler dengan useCallback
  const handleDeleteTransaction = useCallback(async () => {
    if (!transactionData?.id) {
      Alert.alert("Error", "Data transaksi tidak valid");
      return;
    }

    try {
      console.log("🗑️  Deleting transaction:", transactionData.id);
      await deleteTransaction(transactionData.id);
      navigation.goBack();
    } catch (error: any) {
      console.error("Delete error:", error);
      Alert.alert(
        "Error",
        error.message || "Gagal menghapus transaksi. Silakan coba lagi."
      );
    }
  }, [transactionData, deleteTransaction, navigation]);

  // ✅ FIX CRITICAL: Show delete confirmation (tidak ada hooks violation)
  const showDeleteConfirmation = useCallback(() => {
    if (!isEditMode || !transactionData) return;

    Alert.alert(
      "Hapus Transaksi",
      "Apakah Anda yakin ingin menghapus transaksi ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: handleDeleteTransaction, // ✅ Gunakan handler yang sudah dibuat
        },
      ]
    );
  }, [isEditMode, transactionData, handleDeleteTransaction]);

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
        backgroundColor: PRIMARY_COLOR,
      },
      headerTintColor: TEXT_PRIMARY,
      headerTitleStyle: {
        fontWeight: "600",
      },
      headerRight: () => (
        <TouchableOpacity
          onPress={showDeleteConfirmation} // ✅ Gunakan fungsi yang aman
          style={tw`mr-4 ${isEditMode ? "opacity-100" : "opacity-0"}`}
          disabled={!isEditMode || loading}
        >
          <Ionicons
            name="trash-outline"
            size={22}
            color={isEditMode && !loading ? TEXT_PRIMARY : "transparent"}
          />
        </TouchableOpacity>
      ),
    });
  }, [
    isEditMode,
    transactionData,
    navigation,
    loading,
    showDeleteConfirmation,
  ]);

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

  // Render category icons
  const renderCategoryIcon = (iconName: string) => {
    // Map icon names to valid Ionicons
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      "restaurant-outline": "restaurant-outline",
      "car-outline": "car-outline",
      "cart-outline": "cart-outline",
      "film-outline": "film-outline",
      "medical-outline": "medical-outline",
      "school-outline": "school-outline",
      "document-text-outline": "document-text-outline",
      "cash-outline": "cash-outline",
      "trending-up-outline": "trending-up-outline",
      "ellipsis-horizontal-outline": "ellipsis-horizontal-outline",
    };

    return iconMap[iconName] || "receipt-outline";
  };

  return (
    <View style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        {/* Transaction Type Selection */}
        <View style={tw`mb-6`}>
          <Text
            style={[tw`text-base font-medium mb-3`, { color: TEXT_PRIMARY }]}
          >
            Tipe Transaksi
          </Text>
          <View
            style={[
              tw`rounded-xl p-1`,
              { backgroundColor: Colors.surfaceLight },
            ]}
          >
            <TouchableOpacity
              style={[
                tw`flex-1 py-3 rounded-lg`,
                type === "expense" ? { backgroundColor: SURFACE_COLOR } : {},
              ]}
              onPress={() => setType("expense")}
              disabled={loading}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <View
                  style={[
                    tw`w-8 h-8 rounded-full justify-center items-center mr-2`,
                    { backgroundColor: Colors.error + "20" },
                  ]}
                >
                  <Ionicons name="arrow-up" size={16} color={ERROR_COLOR} />
                </View>
                <Text
                  style={[
                    tw`text-sm font-medium`,
                    type === "expense"
                      ? { color: ERROR_COLOR }
                      : { color: TEXT_SECONDARY },
                  ]}
                >
                  Pengeluaran
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                tw`flex-1 py-3 rounded-lg`,
                type === "income" ? { backgroundColor: SURFACE_COLOR } : {},
              ]}
              onPress={() => setType("income")}
              disabled={loading}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <View
                  style={[
                    tw`w-8 h-8 rounded-full justify-center items-center mr-2`,
                    { backgroundColor: Colors.success + "20" },
                  ]}
                >
                  <Ionicons name="arrow-down" size={16} color={SUCCESS_COLOR} />
                </View>
                <Text
                  style={[
                    tw`text-sm font-medium`,
                    type === "income"
                      ? { color: SUCCESS_COLOR }
                      : { color: TEXT_SECONDARY },
                  ]}
                >
                  Pemasukan
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount Input */}
        <View style={tw`mb-6`}>
          <Text
            style={[tw`text-base font-medium mb-3`, { color: TEXT_PRIMARY }]}
          >
            Jumlah
          </Text>
          <View
            style={[
              tw`rounded-xl p-4`,
              {
                backgroundColor: SURFACE_COLOR,
                borderWidth: 1,
                borderColor: amountError ? Colors.error + "40" : BORDER_COLOR,
              },
            ]}
          >
            <View style={tw`flex-row items-center`}>
              <Text style={[tw`text-lg mr-2`, { color: TEXT_PRIMARY }]}>
                Rp
              </Text>
              <TextInput
                style={[
                  tw`flex-1 text-xl font-medium`,
                  { color: TEXT_PRIMARY },
                ]}
                placeholder="0"
                placeholderTextColor={Colors.textTertiary}
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="decimal-pad"
                returnKeyType="done"
                maxLength={15}
                editable={!loading}
              />
            </View>
            {amount ? (
              <Text style={[tw`text-sm mt-1`, { color: TEXT_SECONDARY }]}>
                {formatAmountDisplay()}
              </Text>
            ) : null}
            {amountError ? (
              <Text style={[tw`text-xs mt-2`, { color: ERROR_COLOR }]}>
                {amountError}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Category Selection */}
        <View style={tw`mb-6`}>
          <Text
            style={[tw`text-base font-medium mb-3`, { color: TEXT_PRIMARY }]}
          >
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
                  disabled={loading}
                >
                  <View
                    style={[
                      tw`w-16 h-16 rounded-xl justify-center items-center`,
                      category === cat.name
                        ? type === "income"
                          ? {
                              backgroundColor: Colors.success + "20",
                              borderWidth: 2,
                              borderColor: SUCCESS_COLOR,
                            }
                          : {
                              backgroundColor: Colors.error + "20",
                              borderWidth: 2,
                              borderColor: ERROR_COLOR,
                            }
                        : { backgroundColor: Colors.surfaceLight },
                    ]}
                  >
                    <Ionicons
                      name={renderCategoryIcon(cat.icon)}
                      size={24}
                      color={
                        category === cat.name
                          ? type === "income"
                            ? SUCCESS_COLOR
                            : ERROR_COLOR
                          : TEXT_SECONDARY
                      }
                    />
                  </View>
                  <Text
                    style={[
                      tw`text-xs mt-2 text-center`,
                      category === cat.name
                        ? { fontWeight: "500", color: TEXT_PRIMARY }
                        : { color: TEXT_SECONDARY },
                    ]}
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
          <Text
            style={[tw`text-base font-medium mb-3`, { color: TEXT_PRIMARY }]}
          >
            Deskripsi (opsional)
          </Text>
          <View
            style={[
              tw`rounded-xl p-3`,
              {
                backgroundColor: SURFACE_COLOR,
                borderWidth: 1,
                borderColor: BORDER_COLOR,
              },
            ]}
          >
            <TextInput
              style={[tw`text-sm min-h-20`, { color: TEXT_PRIMARY }]}
              placeholder="Contoh: Makan siang di kantin, beli buku, dll."
              placeholderTextColor={Colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              maxLength={200}
              editable={!loading}
            />
            <Text
              style={[
                tw`text-xs text-right mt-1`,
                { color: Colors.textTertiary },
              ]}
            >
              {description.length}/200
            </Text>
          </View>
        </View>

        {/* Date Selection */}
        <View style={tw`mb-8`}>
          <Text
            style={[tw`text-base font-medium mb-3`, { color: TEXT_PRIMARY }]}
          >
            Tanggal
          </Text>
          <TouchableOpacity
            style={[
              tw`rounded-xl p-4 flex-row justify-between items-center`,
              {
                backgroundColor: SURFACE_COLOR,
                borderWidth: 1,
                borderColor: BORDER_COLOR,
              },
            ]}
            onPress={() => setShowCalendar(true)}
            disabled={loading}
          >
            <View>
              <Text
                style={[tw`text-sm font-medium mb-1`, { color: TEXT_PRIMARY }]}
              >
                {getFormattedDate()}
              </Text>
              <Text style={[tw`text-xs`, { color: Colors.textTertiary }]}>
                Ketuk untuk mengubah tanggal
              </Text>
            </View>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={TEXT_SECONDARY}
            />
          </TouchableOpacity>
        </View>

        {/* Edit Mode Info */}
        {isEditMode && transactionData && (
          <View
            style={[
              tw`rounded-xl p-4 mb-6`,
              {
                backgroundColor: Colors.surfaceLight,
                borderWidth: 1,
                borderColor: BORDER_COLOR,
              },
            ]}
          >
            <Text
              style={[tw`text-sm font-medium mb-2`, { color: TEXT_PRIMARY }]}
            >
              Informasi Transaksi
            </Text>
            <View style={tw`flex-row justify-between mb-2`}>
              <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                ID Transaksi:
              </Text>
              <Text style={[tw`text-xs font-medium`, { color: TEXT_PRIMARY }]}>
                {transactionData.id.substring(0, 8)}...
              </Text>
            </View>
            <View style={tw`flex-row justify-between`}>
              <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                Dibuat pada:
              </Text>
              <Text style={[tw`text-xs`, { color: TEXT_PRIMARY }]}>
                {new Date(transactionData.createdAt).toLocaleDateString(
                  "id-ID"
                )}
              </Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            tw`rounded-xl py-4 items-center justify-center`,
            {
              backgroundColor: ACCENT_COLOR,
              opacity: loading ? 0.7 : 1,
            },
          ]}
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
          style={[
            tw`rounded-xl py-3 items-center justify-center mt-3`,
            {
              borderWidth: 1,
              borderColor: BORDER_COLOR,
            },
          ]}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={[tw`text-sm font-medium`, { color: TEXT_PRIMARY }]}>
            Batal
          </Text>
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
          <View
            style={[tw`rounded-t-3xl p-4`, { backgroundColor: SURFACE_COLOR }]}
          >
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={[tw`text-lg font-bold`, { color: TEXT_PRIMARY }]}>
                Pilih Tanggal
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

export default AddTransactionScreen;
