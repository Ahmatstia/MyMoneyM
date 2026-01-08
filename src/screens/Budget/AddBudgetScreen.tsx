// File: src/screens/AddBudgetScreen.tsx - KONSISTEN DENGAN SEMUA FITUR
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

type AddBudgetScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddBudget"
>;

type AddBudgetScreenRouteProp = RouteProp<RootStackParamList, "AddBudget">;

// WARNA KONSISTEN
const PRIMARY_COLOR = Colors.primary;
const ACCENT_COLOR = Colors.accent;
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR = Colors.surface;
const TEXT_PRIMARY = Colors.textPrimary;
const TEXT_SECONDARY = Colors.textSecondary;
const BORDER_COLOR = Colors.border;
const SUCCESS_COLOR = Colors.success;
const WARNING_COLOR = Colors.warning;
const ERROR_COLOR = Colors.error;
const INFO_COLOR = Colors.info;

const CATEGORIES = [
  { id: "makanan", name: "Makanan", icon: "restaurant-outline" },
  { id: "transportasi", name: "Transportasi", icon: "car-outline" },
  { id: "belanja", name: "Belanja", icon: "cart-outline" },
  { id: "hiburan", name: "Hiburan", icon: "film-outline" },
  { id: "kesehatan", name: "Kesehatan", icon: "medical-outline" },
  { id: "pendidikan", name: "Pendidikan", icon: "school-outline" },
  { id: "tagihan", name: "Tagihan", icon: "document-text-outline" },
  { id: "lainnya", name: "Lainnya", icon: "ellipsis-horizontal-outline" },
] as const;

// Helper untuk format tanggal
const formatDateForDisplay = (dateStr: string): string => {
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

// Helper untuk format ke YYYY-MM-DD
const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const AddBudgetScreen: React.FC = () => {
  const navigation = useNavigation<AddBudgetScreenNavigationProp>();
  const route = useRoute<AddBudgetScreenRouteProp>();
  const { addBudget, editBudget, deleteBudget, state } = useAppContext();

  const params = route.params || {};
  const isEditMode = params.editMode || false;
  const budgetData = params.budgetData;

  // State utama
  const [category, setCategory] = useState(budgetData?.category || "");
  const [limit, setLimit] = useState(
    budgetData?.limit ? safeNumber(budgetData.limit).toString() : ""
  );
  const [period, setPeriod] = useState<
    "custom" | "weekly" | "monthly" | "yearly"
  >(budgetData?.period || "monthly");
  const [startDate, setStartDate] = useState<string>(
    budgetData?.startDate || getCurrentDate()
  );
  const [endDate, setEndDate] = useState<string>(
    budgetData?.endDate || getCurrentDate()
  );
  const [loading, setLoading] = useState(false);
  const [limitError, setLimitError] = useState("");

  // State untuk modal kalender
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState<"start" | "end">("start");

  // State untuk calculator (PERTAHANKAN FITUR)
  const [calculatorInput, setCalculatorInput] = useState("");
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorResult, setCalculatorResult] = useState<{
    daily: number;
    weekly: number;
    monthly: number;
  } | null>(null);

  // Quick presets untuk limit (PERTAHANKAN FITUR)
  const QUICK_PRESETS = [
    { label: "50rb", value: "50000" },
    { label: "100rb", value: "100000" },
    { label: "200rb", value: "200000" },
    { label: "500rb", value: "500000" },
    { label: "1jt", value: "1000000" },
    { label: "2jt", value: "2000000" },
  ];

  // Update title dan header
  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? "Edit Anggaran" : "Tambah Anggaran",
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
  }, [isEditMode, navigation, loading]);

  // Update end date berdasarkan period
  useEffect(() => {
    if (period !== "custom" && !isEditMode) {
      const start = new Date(startDate);
      const newEndDate = new Date(start);

      switch (period) {
        case "weekly":
          newEndDate.setDate(newEndDate.getDate() + 6);
          break;
        case "monthly":
          newEndDate.setDate(newEndDate.getDate() + 29);
          break;
        case "yearly":
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          newEndDate.setDate(newEndDate.getDate() - 1);
          break;
      }

      setEndDate(formatDateToYYYYMMDD(newEndDate));
    }
  }, [period, startDate, isEditMode]);

  // Validasi limit
  const validateLimit = (value: string): boolean => {
    setLimitError("");

    if (!value.trim()) {
      setLimitError("Limit harus diisi");
      return false;
    }

    const limitNum = safeNumber(parseFloat(value.replace(/[^0-9.]/g, "")));
    if (isNaN(limitNum) || limitNum <= 0) {
      setLimitError("Limit harus angka positif");
      return false;
    }

    if (limitNum > 1000000000) {
      setLimitError("Limit terlalu besar (maks: 1M)");
      return false;
    }

    return true;
  };

  // Handle limit change
  const handleLimitChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, "");
    const parts = cleanValue.split(".");

    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;

    setLimit(cleanValue);
    if (cleanValue) {
      validateLimit(cleanValue);
    } else {
      setLimitError("");
    }
  };

  // Format limit display
  const formatLimitDisplay = () => {
    if (!limit) return "";
    const limitNum = safeNumber(parseFloat(limit));
    if (isNaN(limitNum)) return limit;

    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(limitNum);
  };

  // Handle date select
  const handleDateSelect = (day: any) => {
    try {
      const selectedDate = new Date(day.dateString);
      if (isNaN(selectedDate.getTime())) {
        throw new Error("Tanggal tidak valid");
      }

      const formattedDate = formatDateToYYYYMMDD(selectedDate);

      if (calendarMode === "start") {
        setStartDate(formattedDate);
      } else {
        setEndDate(formattedDate);
      }
      setShowCalendar(false);
    } catch (error) {
      Alert.alert("Error", "Gagal memilih tanggal");
    }
  };

  // Open calendar
  const openCalendar = (mode: "start" | "end") => {
    setCalendarMode(mode);
    setShowCalendar(true);
  };

  // Handle delete budget
  const handleDeleteBudget = useCallback(async () => {
    if (!budgetData?.id) {
      Alert.alert("Error", "Data anggaran tidak valid");
      return;
    }

    try {
      await deleteBudget(budgetData.id);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Gagal menghapus anggaran");
    }
  }, [budgetData, deleteBudget, navigation]);

  // Show delete confirmation
  const showDeleteConfirmation = useCallback(() => {
    if (!isEditMode || !budgetData) return;

    Alert.alert(
      "Hapus Anggaran",
      `Apakah Anda yakin ingin menghapus anggaran "${budgetData.category}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: handleDeleteBudget,
        },
      ]
    );
  }, [isEditMode, budgetData, handleDeleteBudget]);

  // Handle calculator input change (PERTAHANKAN FITUR)
  const handleCalculatorInputChange = (text: string) => {
    const cleanedText = text.replace(/[^0-9.]/g, "");
    const dotCount = (cleanedText.match(/\./g) || []).length;
    if (dotCount > 1) return;

    if (cleanedText.includes(".")) {
      const parts = cleanedText.split(".");
      if (parts[1].length > 2) return;
    }

    setCalculatorInput(cleanedText);

    if (cleanedText) {
      calculateBudget(cleanedText);
    } else {
      setCalculatorResult(null);
    }
  };

  // Calculate budget (PERTAHANKAN FITUR)
  const calculateBudget = (amountStr: string) => {
    const amount = safeNumber(parseFloat(amountStr));
    if (amount <= 0) {
      setCalculatorResult(null);
      return;
    }

    const daily = safeNumber(amount / 30);
    const weekly = safeNumber(amount / 4);
    const monthly = safeNumber(amount);

    setCalculatorResult({
      daily,
      weekly,
      monthly,
    });
  };

  // Apply calculator result (PERTAHANKAN FITUR)
  const applyCalculatorResult = (type: "daily" | "weekly" | "monthly") => {
    if (!calculatorResult) return;

    let calculatedLimit = 0;

    switch (type) {
      case "daily":
        calculatedLimit = safeNumber(calculatorResult.daily * 30);
        break;
      case "weekly":
        calculatedLimit = safeNumber(calculatorResult.weekly * 4);
        break;
      case "monthly":
        calculatedLimit = safeNumber(calculatorResult.monthly);
        break;
    }

    setLimit(calculatedLimit.toFixed(0));
    setShowCalculator(false);
    setCalculatorInput("");
    setCalculatorResult(null);
  };

  // Calculate total days
  const calculateTotalDays = (): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  // Calculate daily estimate
  const getDailyEstimate = () => {
    const limitNum = safeNumber(parseFloat(limit));
    if (limitNum <= 0) return 0;

    const totalDays = calculateTotalDays();
    return safeNumber(limitNum / totalDays);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateLimit(limit)) {
      Alert.alert("Error", limitError || "Limit tidak valid");
      return;
    }

    if (!category) {
      Alert.alert("Error", "Pilih kategori anggaran");
      return;
    }

    // Validasi duplikat kategori (kecuali edit mode)
    if (!isEditMode) {
      const isDuplicate = state.budgets.some((b) => b.category === category);
      if (isDuplicate) {
        Alert.alert("Error", `Kategori "${category}" sudah memiliki anggaran.`);
        return;
      }
    }

    // Validasi tanggal
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      Alert.alert(
        "Error",
        "Tanggal mulai tidak boleh lebih besar dari tanggal akhir"
      );
      return;
    }

    const limitNum = safeNumber(parseFloat(limit));

    setLoading(true);
    try {
      if (isEditMode && budgetData) {
        await editBudget(budgetData.id, {
          category,
          limit: limitNum,
          period,
          startDate,
          endDate,
          lastResetDate: budgetData.lastResetDate || budgetData.createdAt,
        });
        Alert.alert("Sukses", "Anggaran berhasil diperbarui", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        await addBudget({
          category,
          limit: limitNum,
          period,
          startDate,
          endDate,
        });
        Alert.alert("Sukses", "Anggaran berhasil ditambahkan", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message ||
          `Gagal ${isEditMode ? "mengedit" : "menambah"} anggaran`
      );
    } finally {
      setLoading(false);
    }
  };

  // Render category icon
  const renderCategoryIcon = (iconName: string) => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      "restaurant-outline": "restaurant-outline",
      "car-outline": "car-outline",
      "cart-outline": "cart-outline",
      "film-outline": "film-outline",
      "medical-outline": "medical-outline",
      "school-outline": "school-outline",
      "document-text-outline": "document-text-outline",
      "ellipsis-horizontal-outline": "ellipsis-horizontal-outline",
    };

    return iconMap[iconName] || "wallet-outline";
  };

  return (
    <View style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-5 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        {/* Info jika edit mode - STYLE KONSISTEN */}
        {isEditMode && budgetData && (
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
                name="information-circle"
                size={16}
                color={INFO_COLOR}
              />
              <Text
                style={[tw`text-sm font-semibold ml-2`, { color: INFO_COLOR }]}
              >
                Informasi Anggaran Saat Ini
              </Text>
            </View>

            <View style={tw`mt-2`}>
              <View style={tw`flex-row justify-between mb-2`}>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  Terpakai:
                </Text>
                <Text
                  style={[tw`text-xs font-medium`, { color: TEXT_PRIMARY }]}
                >
                  {formatCurrency(safeNumber(budgetData.spent))}
                </Text>
              </View>

              <View style={tw`flex-row justify-between mb-2`}>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  Sisa:
                </Text>
                <Text
                  style={[
                    tw`text-xs font-medium`,
                    safeNumber(budgetData.limit - budgetData.spent) >= 0
                      ? { color: SUCCESS_COLOR }
                      : { color: ERROR_COLOR },
                  ]}
                >
                  {formatCurrency(
                    safeNumber(budgetData.limit - budgetData.spent)
                  )}
                </Text>
              </View>

              <View style={tw`pt-2 border-t border-gray-700`}>
                <Text style={[tw`text-xs`, { color: INFO_COLOR }]}>
                  Periode: {formatDateForDisplay(budgetData.startDate)} -{" "}
                  {formatDateForDisplay(budgetData.endDate)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Category Selection - KONSISTEN DENGAN TRANSAKSI */}
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
            {CATEGORIES.map((cat) => {
              const isUsed =
                !isEditMode &&
                state.budgets.some((b) => b.category === cat.name);

              return (
                <TouchableOpacity
                  key={cat.id}
                  style={tw`w-1/4 px-1.5 mb-3`}
                  onPress={() => !isUsed && setCategory(cat.name)}
                  disabled={isUsed || loading}
                >
                  <View
                    style={[
                      tw`rounded-2xl items-center py-3`,
                      category === cat.name
                        ? {
                            backgroundColor: ACCENT_COLOR + "20",
                            borderWidth: 2,
                            borderColor: ACCENT_COLOR,
                          }
                        : isUsed
                        ? {
                            backgroundColor: Colors.surfaceLight,
                            opacity: 0.5,
                          }
                        : { backgroundColor: SURFACE_COLOR },
                    ]}
                  >
                    <Ionicons
                      name={renderCategoryIcon(cat.icon)}
                      size={24}
                      color={
                        category === cat.name
                          ? ACCENT_COLOR
                          : isUsed
                          ? Colors.textTertiary
                          : TEXT_SECONDARY
                      }
                    />
                    {isUsed && (
                      <View
                        style={[
                          tw`absolute -top-1 -right-1 rounded-full w-4 h-4 items-center justify-center`,
                          { backgroundColor: ERROR_COLOR },
                        ]}
                      >
                        <Text style={tw`text-[8px] text-white`}>!</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      tw`text-xs mt-1.5 text-center`,
                      category === cat.name
                        ? { fontWeight: "600", color: TEXT_PRIMARY }
                        : isUsed
                        ? { color: Colors.textTertiary }
                        : { color: TEXT_SECONDARY },
                    ]}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Period Selection - STYLE KONSISTEN */}
        <View style={tw`mb-5`}>
          <Text
            style={[tw`text-sm font-medium mb-3`, { color: TEXT_SECONDARY }]}
          >
            Jenis Periode
          </Text>
          <View style={tw`flex-row flex-wrap gap-2`}>
            {[
              { key: "weekly", label: "Mingguan", days: "7 hari" },
              { key: "monthly", label: "Bulanan", days: "30 hari" },
              { key: "yearly", label: "Tahunan", days: "365 hari" },
              { key: "custom", label: "Custom", days: "Pilih" },
            ].map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[
                  tw`flex-1 min-w-[48%] rounded-xl px-3 py-2.5 border`,
                  period === p.key
                    ? {
                        backgroundColor: ACCENT_COLOR + "15",
                        borderColor: ACCENT_COLOR,
                      }
                    : {
                        backgroundColor: SURFACE_COLOR,
                        borderColor: BORDER_COLOR,
                      },
                ]}
                onPress={() => setPeriod(p.key as any)}
                disabled={loading}
              >
                <View style={tw`items-center`}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={period === p.key ? ACCENT_COLOR : TEXT_SECONDARY}
                  />
                  <Text
                    style={[
                      tw`text-xs font-semibold mt-1.5`,
                      period === p.key
                        ? { color: ACCENT_COLOR }
                        : { color: TEXT_SECONDARY },
                    ]}
                  >
                    {p.label}
                  </Text>
                  <Text
                    style={[tw`text-xs mt-0.5`, { color: Colors.textTertiary }]}
                  >
                    {p.days}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Limit Suggestions - KONSISTEN DENGAN TRANSAKSI */}
        {!limit && (
          <View style={tw`mb-5`}>
            <Text
              style={[tw`text-xs font-medium mb-2`, { color: TEXT_SECONDARY }]}
            >
              💡 Limit Cepat
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={tw`-mx-1`}
            >
              <View style={tw`flex-row px-1`}>
                {QUICK_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.label}
                    style={[
                      tw`rounded-xl px-4 py-2 mr-2`,
                      {
                        backgroundColor: SURFACE_COLOR,
                        borderWidth: 1,
                        borderColor: BORDER_COLOR,
                      },
                    ]}
                    onPress={() => setLimit(preset.value)}
                  >
                    <Text
                      style={[tw`text-xs font-medium`, { color: ACCENT_COLOR }]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Limit Input - KONSISTEN DENGAN TRANSAKSI */}
        <View style={tw`mb-5`}>
          <View style={tw`flex-row justify-between items-center mb-3`}>
            <Text style={[tw`text-sm font-medium`, { color: TEXT_SECONDARY }]}>
              Limit Anggaran
            </Text>
            <TouchableOpacity
              style={tw`flex-row items-center gap-1`}
              onPress={() => setShowCalculator(!showCalculator)}
              disabled={loading}
            >
              <Ionicons
                name="calculator-outline"
                size={16}
                color={showCalculator ? ACCENT_COLOR : TEXT_SECONDARY}
              />
              <Text
                style={[
                  tw`text-xs`,
                  showCalculator
                    ? { color: ACCENT_COLOR, fontWeight: "500" }
                    : { color: TEXT_SECONDARY },
                ]}
              >
                {showCalculator ? "Tutup" : "Kalkulator"}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              tw`rounded-2xl p-5 border`,
              {
                backgroundColor: SURFACE_COLOR,
                borderColor: limitError ? ERROR_COLOR : BORDER_COLOR,
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
                value={limit}
                onChangeText={handleLimitChange}
                keyboardType="decimal-pad"
                returnKeyType="done"
                maxLength={15}
                editable={!loading}
              />
            </View>
            {limit && !limitError ? (
              <View style={tw`mt-3 pt-3 border-t border-gray-700`}>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  {formatLimitDisplay()}
                </Text>
                {/* Tips Berdasarkan Limit */}
                {parseFloat(limit) > 5000000 && (
                  <View style={tw`flex-row items-center mt-2`}>
                    <Ionicons
                      name="bulb-outline"
                      size={12}
                      color={WARNING_COLOR}
                    />
                    <Text style={[tw`text-xs ml-1`, { color: WARNING_COLOR }]}>
                      💰 Anggaran besar! Pastikan realistis
                    </Text>
                  </View>
                )}
              </View>
            ) : null}
            {limitError ? (
              <Text style={[tw`text-xs mt-2`, { color: ERROR_COLOR }]}>
                {limitError}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Budget Calculator - PERTAHANKAN FITUR DENGAN STYLE KONSISTEN */}
        {showCalculator && (
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
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text
                style={[tw`text-sm font-semibold`, { color: TEXT_PRIMARY }]}
              >
                🧮 Kalkulator Anggaran
              </Text>
              <TouchableOpacity
                onPress={() => setShowCalculator(false)}
                disabled={loading}
              >
                <Ionicons
                  name="close-outline"
                  size={20}
                  color={TEXT_SECONDARY}
                />
              </TouchableOpacity>
            </View>

            <Text style={[tw`text-xs mb-3`, { color: TEXT_SECONDARY }]}>
              Masukkan jumlah untuk melihat perhitungan:
            </Text>

            <View
              style={[
                tw`flex-row items-center rounded-xl px-4 py-3 mb-4`,
                {
                  backgroundColor: Colors.surfaceLight,
                  borderWidth: 1,
                  borderColor: BORDER_COLOR,
                },
              ]}
            >
              <Text style={[tw`mr-2`, { color: TEXT_PRIMARY }]}>Rp</Text>
              <TextInput
                style={[tw`flex-1 text-base`, { color: TEXT_PRIMARY }]}
                placeholder="Contoh: 200000"
                placeholderTextColor={Colors.textTertiary}
                value={calculatorInput}
                onChangeText={handleCalculatorInputChange}
                keyboardType="decimal-pad"
                maxLength={15}
                editable={!loading}
              />
            </View>

            {/* Calculator Results */}
            {calculatorResult && (
              <View style={tw`mb-4`}>
                <Text
                  style={[
                    tw`text-xs font-medium mb-3`,
                    { color: TEXT_SECONDARY },
                  ]}
                >
                  Perkiraan Pengeluaran:
                </Text>

                <View>
                  {/* Per Hari */}
                  <TouchableOpacity
                    style={[
                      tw`flex-row justify-between items-center p-4 rounded-xl border mb-3`,
                      {
                        backgroundColor: Colors.surfaceLight,
                        borderColor: BORDER_COLOR,
                      },
                    ]}
                    onPress={() => applyCalculatorResult("daily")}
                    disabled={loading}
                  >
                    <View>
                      <Text
                        style={[
                          tw`text-sm font-medium`,
                          { color: TEXT_PRIMARY },
                        ]}
                      >
                        Per Hari
                      </Text>
                      <Text
                        style={[tw`text-xs mt-1`, { color: TEXT_SECONDARY }]}
                      >
                        Untuk pengeluaran harian
                      </Text>
                    </View>
                    <View style={tw`items-end`}>
                      <Text
                        style={[tw`text-sm font-bold`, { color: TEXT_PRIMARY }]}
                      >
                        {formatCurrency(calculatorResult.daily)}
                      </Text>
                      <Text
                        style={[tw`text-xs mt-1`, { color: TEXT_SECONDARY }]}
                      >
                        × 30 ={" "}
                        {formatCurrency(
                          safeNumber(calculatorResult.daily * 30)
                        )}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Per Minggu */}
                  <TouchableOpacity
                    style={[
                      tw`flex-row justify-between items-center p-4 rounded-xl border mb-3`,
                      {
                        backgroundColor: Colors.surfaceLight,
                        borderColor: BORDER_COLOR,
                      },
                    ]}
                    onPress={() => applyCalculatorResult("weekly")}
                    disabled={loading}
                  >
                    <View>
                      <Text
                        style={[
                          tw`text-sm font-medium`,
                          { color: TEXT_PRIMARY },
                        ]}
                      >
                        Per Minggu
                      </Text>
                      <Text
                        style={[tw`text-xs mt-1`, { color: TEXT_SECONDARY }]}
                      >
                        Untuk pengeluaran mingguan
                      </Text>
                    </View>
                    <View style={tw`items-end`}>
                      <Text
                        style={[tw`text-sm font-bold`, { color: TEXT_PRIMARY }]}
                      >
                        {formatCurrency(calculatorResult.weekly)}
                      </Text>
                      <Text
                        style={[tw`text-xs mt-1`, { color: TEXT_SECONDARY }]}
                      >
                        × 4 ={" "}
                        {formatCurrency(
                          safeNumber(calculatorResult.weekly * 4)
                        )}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Per Bulan */}
                  <TouchableOpacity
                    style={[
                      tw`flex-row justify-between items-center p-4 rounded-xl border mb-3`,
                      {
                        backgroundColor: Colors.surfaceLight,
                        borderColor: BORDER_COLOR,
                      },
                    ]}
                    onPress={() => applyCalculatorResult("monthly")}
                    disabled={loading}
                  >
                    <View>
                      <Text
                        style={[
                          tw`text-sm font-medium`,
                          { color: TEXT_PRIMARY },
                        ]}
                      >
                        Per Bulan
                      </Text>
                      <Text
                        style={[tw`text-xs mt-1`, { color: TEXT_SECONDARY }]}
                      >
                        Untuk pengeluaran bulanan
                      </Text>
                    </View>
                    <View style={tw`items-end`}>
                      <Text
                        style={[tw`text-sm font-bold`, { color: TEXT_PRIMARY }]}
                      >
                        {formatCurrency(calculatorResult.monthly)}
                      </Text>
                      <Text
                        style={[tw`text-xs mt-1`, { color: TEXT_SECONDARY }]}
                      >
                        ÷ 30 ={" "}
                        {formatCurrency(
                          safeNumber(calculatorResult.monthly / 30)
                        )}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <Text
                  style={[
                    tw`text-xs text-center mt-3`,
                    { color: TEXT_SECONDARY },
                  ]}
                >
                  Tap salah satu untuk mengatur sebagai limit
                </Text>
              </View>
            )}

            {/* Calculation Info */}
            <View
              style={[
                tw`p-4 rounded-xl`,
                {
                  backgroundColor: INFO_COLOR + "10",
                  borderWidth: 1,
                  borderColor: INFO_COLOR + "30",
                },
              ]}
            >
              <Text
                style={[tw`text-xs font-medium mb-2`, { color: INFO_COLOR }]}
              >
                💡 Cara Hitung:
              </Text>
              <Text style={[tw`text-xs mb-1`, { color: INFO_COLOR }]}>
                • <Text style={tw`font-medium`}>Per Hari</Text>: Jumlah ÷ 30
                hari
              </Text>
              <Text style={[tw`text-xs mb-1`, { color: INFO_COLOR }]}>
                • <Text style={tw`font-medium`}>Per Minggu</Text>: Jumlah ÷ 4
                minggu
              </Text>
              <Text style={[tw`text-xs`, { color: INFO_COLOR }]}>
                • <Text style={tw`font-medium`}>Per Bulan</Text>: Jumlah
                langsung
              </Text>
            </View>
          </View>
        )}

        {/* Date Selection - KONSISTEN DENGAN TRANSAKSI */}
        <View style={tw`mb-5`}>
          <Text
            style={[tw`text-sm font-medium mb-3`, { color: TEXT_SECONDARY }]}
          >
            {period === "custom" ? "Rentang Tanggal" : "Tanggal Mulai"}
          </Text>

          {/* Start Date */}
          <View style={tw`mb-3`}>
            <Text style={[tw`text-xs mb-2`, { color: TEXT_SECONDARY }]}>
              Tanggal Mulai
            </Text>
            <TouchableOpacity
              style={[
                tw`rounded-2xl p-4 flex-row justify-between items-center border`,
                { backgroundColor: SURFACE_COLOR, borderColor: BORDER_COLOR },
              ]}
              onPress={() => openCalendar("start")}
              disabled={loading}
            >
              <View style={tw`flex-1 mr-3`}>
                <Text
                  style={[tw`text-sm font-medium`, { color: TEXT_PRIMARY }]}
                >
                  {formatDateForDisplay(startDate)}
                </Text>
              </View>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={TEXT_SECONDARY}
              />
            </TouchableOpacity>
          </View>

          {/* End Date (jika custom atau edit mode) */}
          {(period === "custom" || isEditMode) && (
            <View>
              <Text style={[tw`text-xs mb-2`, { color: TEXT_SECONDARY }]}>
                Tanggal Akhir
              </Text>
              <TouchableOpacity
                style={[
                  tw`rounded-2xl p-4 flex-row justify-between items-center border`,
                  { backgroundColor: SURFACE_COLOR, borderColor: BORDER_COLOR },
                ]}
                onPress={() => openCalendar("end")}
                disabled={loading}
              >
                <View style={tw`flex-1 mr-3`}>
                  <Text
                    style={[tw`text-sm font-medium`, { color: TEXT_PRIMARY }]}
                  >
                    {formatDateForDisplay(endDate)}
                  </Text>
                </View>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={TEXT_SECONDARY}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Total Hari Info */}
          <View
            style={[
              tw`mt-3 p-3 rounded-lg`,
              { backgroundColor: Colors.surfaceLight },
            ]}
          >
            <Text style={[tw`text-xs`, { color: TEXT_PRIMARY }]}>
              <Text style={tw`font-medium`}>Total Periode:</Text>{" "}
              {calculateTotalDays()} hari ({formatDateForDisplay(startDate)} -{" "}
              {formatDateForDisplay(endDate)})
            </Text>
          </View>
        </View>

        {/* Estimated Daily - KONSISTEN STYLE */}
        {limit && safeNumber(parseFloat(limit)) > 0 && (
          <View
            style={[
              tw`rounded-2xl p-4 mb-5`,
              {
                backgroundColor: SUCCESS_COLOR + "10",
                borderWidth: 1,
                borderColor: SUCCESS_COLOR + "30",
              },
            ]}
          >
            <View style={tw`flex-row items-center mb-2`}>
              <Ionicons
                name="calculator-outline"
                size={16}
                color={SUCCESS_COLOR}
              />
              <Text
                style={[
                  tw`text-sm font-semibold ml-2`,
                  { color: SUCCESS_COLOR },
                ]}
              >
                Estimasi Pengeluaran Harian
              </Text>
            </View>

            <View style={tw`flex-row justify-between items-center mb-3`}>
              <View>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  Per Hari
                </Text>
                <Text style={[tw`text-lg font-bold`, { color: SUCCESS_COLOR }]}>
                  {formatCurrency(getDailyEstimate())}
                </Text>
              </View>
              <View style={tw`items-end`}>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  Total Periode
                </Text>
                <Text style={[tw`text-lg font-bold`, { color: SUCCESS_COLOR }]}>
                  {calculateTotalDays()} hari
                </Text>
              </View>
            </View>

            <Text style={[tw`text-xs`, { color: SUCCESS_COLOR }]}>
              Dengan limit {formatCurrency(safeNumber(parseFloat(limit)))} untuk{" "}
              {calculateTotalDays()} hari
            </Text>
          </View>
        )}

        {/* Tips - PERBAIKI SPACE-Y */}
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
              💡 Tips Menentukan Anggaran
            </Text>
          </View>

          {/* GANTI space-y dengan margin manual */}
          <Text style={[tw`text-xs mb-1`, { color: INFO_COLOR }]}>
            • <Text style={tw`font-medium`}>Makanan</Text>: Rp
            15.000-30.000/hari
          </Text>
          <Text style={[tw`text-xs mb-1`, { color: INFO_COLOR }]}>
            • <Text style={tw`font-medium`}>Transportasi</Text>: Rp
            10.000-20.000/hari
          </Text>
          <Text style={[tw`text-xs mb-1`, { color: INFO_COLOR }]}>
            • <Text style={tw`font-medium`}>Hiburan</Text>: 10-20% dari
            pendapatan
          </Text>
          <Text style={[tw`text-xs`, { color: INFO_COLOR }]}>
            • <Text style={tw`font-medium`}>Tabungan</Text>: Minimal 20% dari
            pendapatan
          </Text>
        </View>

        {/* Action Buttons - KONSISTEN DENGAN TRANSAKSI */}
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
            disabled={!category || !limit || loading}
          >
            <Text style={tw`text-white text-sm font-semibold`}>
              {loading ? "Menyimpan..." : isEditMode ? "Simpan" : "Tambah"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Calendar Modal - KONSISTEN DENGAN TRANSAKSI */}
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
                Pilih Tanggal {calendarMode === "start" ? "Mulai" : "Akhir"}
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
                [calendarMode === "start" ? startDate : endDate]: {
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

export default AddBudgetScreen;
