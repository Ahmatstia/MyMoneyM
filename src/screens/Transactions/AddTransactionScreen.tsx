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

const PRIMARY_COLOR = Colors.primary;
const ACCENT_COLOR = Colors.accent;
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR = Colors.surface;
const TEXT_PRIMARY = Colors.textPrimary;
const TEXT_SECONDARY = Colors.textSecondary;
const BORDER_COLOR = Colors.border;
const SUCCESS_COLOR = Colors.success;
const ERROR_COLOR = Colors.error;
const WARNING_COLOR = Colors.warning;

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

  const params = route.params || {};
  const isEditMode = params.editMode || false;
  const transactionData = params.transactionData;

  const handleDeleteTransaction = useCallback(async () => {
    if (!transactionData?.id) {
      Alert.alert("Error", "Data transaksi tidak valid");
      return;
    }

    try {
      await deleteTransaction(transactionData.id);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Gagal menghapus transaksi");
    }
  }, [transactionData, deleteTransaction, navigation]);

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
          onPress: handleDeleteTransaction,
        },
      ]
    );
  }, [isEditMode, transactionData, handleDeleteTransaction]);

  useEffect(() => {
    if (isEditMode && transactionData) {
      setType(transactionData.type);
      setAmount(safeNumber(transactionData.amount).toString());
      setCategory(transactionData.category);
      setDescription(transactionData.description || "");
      setDate(transactionData.date);
    }

    navigation.setOptions({
      title: isEditMode ? "Edit Transaksi" : "Tambah Transaksi",
      headerStyle: { backgroundColor: PRIMARY_COLOR },
      headerTintColor: TEXT_PRIMARY,
      headerTitleStyle: { fontWeight: "600" },
      headerRight: () => (
        <TouchableOpacity
          onPress={showDeleteConfirmation}
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
      setAmountError("Jumlah terlalu besar");
      return false;
    }

    return true;
  };

  const handleAmountChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, "");
    const parts = cleanValue.split(".");

    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;

    setAmount(cleanValue);
    if (cleanValue) {
      validateAmount(cleanValue);
    } else {
      setAmountError("");
    }
  };

  const formatAmountDisplay = () => {
    if (!amount) return "";
    const amountNum = safeNumber(parseFloat(amount));
    if (isNaN(amountNum)) return amount;

    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amountNum);
  };

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
      Alert.alert(
        "Error",
        error.message ||
          `Gagal ${isEditMode ? "mengedit" : "menambah"} transaksi`
      );
    } finally {
      setLoading(false);
    }
  };

  const getFormattedDate = () => {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return date;

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

  const renderCategoryIcon = (iconName: string) => {
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
        contentContainerStyle={tw`p-5 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        {/* Transaction Type - 2 Columns Compact */}
        <View style={tw`mb-5`}>
          <Text
            style={[tw`text-xs font-medium mb-2`, { color: TEXT_SECONDARY }]}
          >
            Tipe Transaksi
          </Text>
          <View style={tw`flex-row gap-2`}>
            {/* Pengeluaran */}
            <TouchableOpacity
              style={[
                tw`flex-1 rounded-xl px-3 py-2.5 border`,
                type === "expense"
                  ? {
                      backgroundColor: ERROR_COLOR + "15",
                      borderColor: ERROR_COLOR,
                    }
                  : {
                      backgroundColor: SURFACE_COLOR,
                      borderColor: BORDER_COLOR,
                    },
              ]}
              onPress={() => setType("expense")}
              disabled={loading}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <Ionicons
                  name="arrow-up"
                  size={16}
                  color={type === "expense" ? ERROR_COLOR : TEXT_SECONDARY}
                />
                <Text
                  style={[
                    tw`text-xs font-semibold ml-1.5`,
                    {
                      color: type === "expense" ? ERROR_COLOR : TEXT_SECONDARY,
                    },
                  ]}
                >
                  Pengeluaran
                </Text>
              </View>
            </TouchableOpacity>

            {/* Pemasukan */}
            <TouchableOpacity
              style={[
                tw`flex-1 rounded-xl px-3 py-2.5 border`,
                type === "income"
                  ? {
                      backgroundColor: SUCCESS_COLOR + "15",
                      borderColor: SUCCESS_COLOR,
                    }
                  : {
                      backgroundColor: SURFACE_COLOR,
                      borderColor: BORDER_COLOR,
                    },
              ]}
              onPress={() => setType("income")}
              disabled={loading}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <Ionicons
                  name="arrow-down"
                  size={16}
                  color={type === "income" ? SUCCESS_COLOR : TEXT_SECONDARY}
                />
                <Text
                  style={[
                    tw`text-xs font-semibold ml-1.5`,
                    {
                      color: type === "income" ? SUCCESS_COLOR : TEXT_SECONDARY,
                    },
                  ]}
                >
                  Pemasukan
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Amount Suggestions - Fitur Baru! */}
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
                {[10000, 25000, 50000, 100000, 250000, 500000].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      tw`rounded-xl px-4 py-2 mr-2`,
                      {
                        backgroundColor: SURFACE_COLOR,
                        borderWidth: 1,
                        borderColor: BORDER_COLOR,
                      },
                    ]}
                    onPress={() => setAmount(value.toString())}
                  >
                    <Text
                      style={[tw`text-xs font-medium`, { color: ACCENT_COLOR }]}
                    >
                      {new Intl.NumberFormat("id-ID", {
                        notation: "compact",
                        compactDisplay: "short",
                      }).format(value)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Amount Input dengan Preview */}
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
                keyboardType="decimal-pad"
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
                {/* Tips Berdasarkan Jumlah */}
                {parseFloat(amount) > 1000000 && (
                  <View style={tw`flex-row items-center mt-2`}>
                    <Ionicons
                      name="bulb-outline"
                      size={12}
                      color={WARNING_COLOR}
                    />
                    <Text style={[tw`text-xs ml-1`, { color: WARNING_COLOR }]}>
                      💰 Transaksi besar! Pastikan sudah sesuai
                    </Text>
                  </View>
                )}
              </View>
            ) : null}
            {amountError ? (
              <Text style={[tw`text-xs mt-2`, { color: ERROR_COLOR }]}>
                {amountError}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Category Selection dengan Emoji */}
        <View style={tw`mb-5`}>
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <Text style={[tw`text-sm font-medium`, { color: TEXT_SECONDARY }]}>
              Kategori
            </Text>
            {category && (
              <Text style={[tw`text-xs`, { color: ACCENT_COLOR }]}>
                ✓ {category}
              </Text>
            )}
          </View>
          <View style={tw`flex-row flex-wrap -mx-1.5`}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={tw`w-1/5 px-1.5 mb-3`}
                onPress={() => setCategory(cat.name)}
                disabled={loading}
              >
                <View
                  style={[
                    tw`rounded-2xl items-center py-3`,
                    category === cat.name
                      ? type === "income"
                        ? {
                            backgroundColor: SUCCESS_COLOR + "20",
                            borderWidth: 2,
                            borderColor: SUCCESS_COLOR,
                          }
                        : {
                            backgroundColor: ERROR_COLOR + "20",
                            borderWidth: 2,
                            borderColor: ERROR_COLOR,
                          }
                      : { backgroundColor: SURFACE_COLOR },
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
                    tw`text-xs mt-1.5 text-center`,
                    category === cat.name
                      ? { fontWeight: "600", color: TEXT_PRIMARY }
                      : { color: TEXT_SECONDARY },
                  ]}
                  numberOfLines={1}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Selection */}
        <View style={tw`mb-5`}>
          <Text
            style={[tw`text-sm font-medium mb-3`, { color: TEXT_SECONDARY }]}
          >
            Tanggal
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
                {getFormattedDate()}
              </Text>
            </View>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={TEXT_SECONDARY}
            />
          </TouchableOpacity>
        </View>

        {/* Description Input dengan Character Counter */}
        <View style={tw`mb-5`}>
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <Text style={[tw`text-sm font-medium`, { color: TEXT_SECONDARY }]}>
              Catatan (opsional)
            </Text>
            <Text style={[tw`text-xs`, { color: Colors.textTertiary }]}>
              {description.length}/200
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
              placeholder="Tambahkan catatan untuk memudahkan pelacakan..."
              placeholderTextColor={Colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              maxLength={200}
              editable={!loading}
            />
          </View>
        </View>

        {/* Transaction Summary Preview - Fitur Baru! */}
        {amount && category && (
          <View
            style={[
              tw`rounded-2xl p-4 mb-5`,
              {
                backgroundColor:
                  type === "income" ? SUCCESS_COLOR + "10" : ERROR_COLOR + "10",
                borderWidth: 1,
                borderColor:
                  type === "income" ? SUCCESS_COLOR + "30" : ERROR_COLOR + "30",
              },
            ]}
          >
            <View style={tw`flex-row items-center mb-2`}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={type === "income" ? SUCCESS_COLOR : ERROR_COLOR}
              />
              <Text
                style={[
                  tw`text-xs font-semibold ml-2`,
                  { color: type === "income" ? SUCCESS_COLOR : ERROR_COLOR },
                ]}
              >
                Preview Transaksi
              </Text>
            </View>
            <Text style={[tw`text-sm`, { color: TEXT_PRIMARY }]}>
              {type === "income" ? "💰 Pemasukan" : "💸 Pengeluaran"} sebesar{" "}
              <Text style={tw`font-bold`}>Rp {formatAmountDisplay()}</Text>{" "}
              untuk kategori <Text style={tw`font-bold`}>{category}</Text>
              {description
                ? ` - ${description.substring(0, 30)}${
                    description.length > 30 ? "..." : ""
                  }`
                : ""}
            </Text>
          </View>
        )}

        {/* Action Buttons - 2 Columns */}
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
              { backgroundColor: ACCENT_COLOR, opacity: loading ? 0.7 : 1 },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={tw`text-white text-sm font-semibold`}>
              {loading ? "Menyimpan..." : isEditMode ? "Simpan" : "Tambah"}
            </Text>
          </TouchableOpacity>
        </View>
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
            style={[tw`rounded-t-3xl p-5`, { backgroundColor: SURFACE_COLOR }]}
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
