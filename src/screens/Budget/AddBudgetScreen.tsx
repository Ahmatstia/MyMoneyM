import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { formatCurrency, safeNumber } from "../../utils/calculations";

// Type untuk icon yang aman
type SafeIconName = keyof typeof Ionicons.glyphMap;

const AVAILABLE_CATEGORIES = [
  "Makanan",
  "Transportasi",
  "Belanja",
  "Hiburan",
  "Kesehatan",
  "Pendidikan",
  "Tagihan",
  "Lainnya",
];

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

const AddBudgetScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const params = route.params || {};
  const isEditMode = params.editMode || false;
  const budgetData = params.budgetData;

  const { addBudget, editBudget, deleteBudget, state } = useAppContext();

  // State utama
  const [category, setCategory] = useState(budgetData?.category || "");
  const [limit, setLimit] = useState(
    budgetData?.limit ? safeNumber(budgetData.limit).toString() : ""
  );
  const [period, setPeriod] = useState<
    "custom" | "weekly" | "monthly" | "yearly"
  >(budgetData?.period || "monthly");
  const [startDate, setStartDate] = useState<string>(
    budgetData?.startDate || formatDate(new Date())
  );
  const [endDate, setEndDate] = useState<string>(
    budgetData?.endDate || formatDate(new Date())
  );
  const [loading, setLoading] = useState(false);

  // State untuk calendar modal
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [tempDate, setTempDate] = useState<string>("");

  // State untuk calculator
  const [calculatorInput, setCalculatorInput] = useState("");
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorResult, setCalculatorResult] = useState<{
    daily: number;
    weekly: number;
    monthly: number;
  } | null>(null);

  // Update title based on mode
  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? "Edit Anggaran" : "Tambah Anggaran",
      headerStyle: {
        backgroundColor: "#4F46E5",
      },
      headerTintColor: "#FFFFFF",
      headerTitleStyle: {
        fontWeight: "600",
      },
    });
  }, [isEditMode, navigation]);

  // Update end date ketika period berubah (hanya untuk mode TAMBAH BARU)
  useEffect(() => {
    // Hanya update otomatis jika TIDAK dalam edit mode dan period BUKAN custom
    if (period !== "custom" && !isEditMode) {
      const start = parseDate(startDate);
      const newEndDate = new Date(start);

      switch (period) {
        case "weekly":
          newEndDate.setDate(newEndDate.getDate() + 6); // 7 hari termasuk start
          break;
        case "monthly":
          newEndDate.setDate(newEndDate.getDate() + 29); // 30 hari termasuk start
          break;
        case "yearly":
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          newEndDate.setDate(newEndDate.getDate() - 1); // -1 hari
          break;
      }

      setEndDate(formatDate(newEndDate));
    }
  }, [period, startDate, isEditMode]);

  // Hitung total hari
  const calculateTotalDays = (): number => {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // +1 untuk include start date
  };

  // Format tanggal untuk display
  const formatDisplayDate = (dateStr: string): string => {
    const date = parseDate(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Fungsi untuk calendar
  const openStartCalendar = () => {
    setTempDate(startDate);
    setShowStartCalendar(true);
  };

  const openEndCalendar = () => {
    setTempDate(endDate);
    setShowEndCalendar(true);
  };

  const handleCalendarSelect = (date: any) => {
    const selectedDate = date.dateString;

    if (showStartCalendar) {
      setStartDate(selectedDate);
      setShowStartCalendar(false);
    } else if (showEndCalendar) {
      setEndDate(selectedDate);
      setShowEndCalendar(false);
    }
  };

  // Fungsi untuk menghitung budget calculator
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

  // Handle calculator input change
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

  // Apply calculator result to limit
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

  // Quick calculator presets
  const QUICK_PRESETS = [
    { label: "50rb", value: "50000" },
    { label: "100rb", value: "100000" },
    { label: "200rb", value: "200000" },
    { label: "500rb", value: "500000" },
    { label: "1jt", value: "1000000" },
    { label: "2jt", value: "2000000" },
  ];

  // Format limit input
  const handleLimitChange = (text: string) => {
    const cleanedText = text.replace(/[^0-9.]/g, "");
    const dotCount = (cleanedText.match(/\./g) || []).length;
    if (dotCount > 1) return;

    if (cleanedText.includes(".")) {
      const parts = cleanedText.split(".");
      if (parts[1].length > 2) return;
    }

    setLimit(cleanedText);
  };

  // Calculate daily estimate
  const getDailyEstimate = () => {
    const limitNum = safeNumber(parseFloat(limit));
    if (limitNum <= 0) return 0;

    const totalDays = calculateTotalDays();
    return safeNumber(limitNum / totalDays);
  };

  // Handle delete budget
  const handleDeleteBudget = async () => {
    if (!budgetData?.id) {
      Alert.alert("Error", "Data anggaran tidak valid");
      return;
    }

    try {
      await deleteBudget(budgetData.id);
      navigation.goBack();
    } catch (error: any) {
      console.error("Delete budget error:", error);
      Alert.alert(
        "Error",
        error.message || "Gagal menghapus anggaran. Silakan coba lagi."
      );
    }
  };

  // Show delete confirmation
  const showDeleteConfirmation = () => {
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
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!category || !limit) {
      Alert.alert("Error", "Mohon isi kategori dan limit anggaran");
      return;
    }

    const limitNum = safeNumber(parseFloat(limit));
    if (limitNum <= 0) {
      Alert.alert("Error", "Limit harus berupa angka positif");
      return;
    }

    // Validasi tanggal
    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (startDate > endDate) {
      Alert.alert(
        "Error",
        "Tanggal mulai tidak boleh lebih besar dari tanggal akhir"
      );
      return;
    }

    const totalDays = calculateTotalDays();
    if (totalDays <= 0) {
      Alert.alert("Error", "Periode anggaran tidak valid");
      return;
    }

    // Cek apakah kategori sudah digunakan (untuk mode tambah baru)
    if (!isEditMode) {
      const isDuplicate = state.budgets.some((b) => b.category === category);
      if (isDuplicate) {
        Alert.alert(
          "Error",
          `Kategori "${category}" sudah memiliki anggaran. Gunakan kategori lain atau edit anggaran yang sudah ada.`
        );
        return;
      }
    }

    // Validasi limit terlalu besar
    if (limitNum > 1000000000) {
      Alert.alert("Error", "Limit terlalu besar. Maksimal Rp 1.000.000.000");
      return;
    }

    // Validasi tanggal tidak boleh di masa lalu untuk start date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today && !isEditMode) {
      Alert.alert(
        "Perhatian",
        "Tanggal mulai tidak boleh di masa lalu untuk anggaran baru",
        [
          {
            text: "Gunakan Hari Ini",
            onPress: () => {
              const todayStr = formatDate(new Date());
              setStartDate(todayStr);
              // Recalculate end date based on today
              if (period !== "custom") {
                const newEnd = new Date();
                switch (period) {
                  case "weekly":
                    newEnd.setDate(newEnd.getDate() + 6);
                    break;
                  case "monthly":
                    newEnd.setDate(newEnd.getDate() + 29);
                    break;
                  case "yearly":
                    newEnd.setFullYear(newEnd.getFullYear() + 1);
                    newEnd.setDate(newEnd.getDate() - 1);
                    break;
                }
                setEndDate(formatDate(newEnd));
              }
            },
          },
          { text: "Tetap Gunakan", onPress: () => saveBudget(limitNum) },
        ]
      );
      return;
    }

    await saveBudget(limitNum);
  };

  // Fungsi untuk menyimpan budget
  const saveBudget = async (limitNum: number) => {
    setLoading(true);
    try {
      if (isEditMode && budgetData) {
        // Edit mode - pertahankan tanggal yang sudah diubah user
        await editBudget(budgetData.id, {
          category,
          limit: limitNum,
          period,
          startDate, // Gunakan tanggal dari state
          endDate, // Gunakan tanggal dari state
          lastResetDate: budgetData.lastResetDate || budgetData.createdAt,
        });
        Alert.alert("Sukses", "Anggaran berhasil diperbarui", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        // Add mode
        await addBudget({
          category,
          limit: limitNum,
          period,
          startDate, // Gunakan tanggal dari state
          endDate, // Gunakan tanggal dari state
        });
        Alert.alert("Sukses", "Anggaran berhasil ditambahkan", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      console.error("Error saving budget:", error);
      Alert.alert(
        "Error",
        error.message ||
          `Gagal ${isEditMode ? "mengedit" : "menambah"} anggaran`
      );
    } finally {
      setLoading(false);
    }
  };

  // Calendar Component Modal
  const renderCalendarModal = () => (
    <Modal
      visible={showStartCalendar || showEndCalendar}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        setShowStartCalendar(false);
        setShowEndCalendar(false);
      }}
    >
      <View style={tw`flex-1 justify-center items-center bg-black/50`}>
        <View style={tw`bg-white rounded-xl p-4 w-11/12`}>
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text style={tw`text-lg font-semibold text-gray-900`}>
              Pilih Tanggal
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowStartCalendar(false);
                setShowEndCalendar(false);
              }}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Calendar
            current={tempDate}
            onDayPress={handleCalendarSelect}
            markedDates={{
              [tempDate]: {
                selected: true,
                selectedColor: "#4F46E5",
              },
            }}
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

          <View style={tw`mt-4 flex-row justify-between`}>
            <TouchableOpacity
              style={tw`px-4 py-2 bg-gray-200 rounded-lg`}
              onPress={() => {
                const today = formatDate(new Date());
                if (showStartCalendar) {
                  setStartDate(today);
                } else {
                  setEndDate(today);
                }
                setShowStartCalendar(false);
                setShowEndCalendar(false);
              }}
            >
              <Text style={tw`text-gray-700 font-medium`}>Hari Ini</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`px-4 py-2 bg-indigo-600 rounded-lg`}
              onPress={() => {
                setShowStartCalendar(false);
                setShowEndCalendar(false);
              }}
            >
              <Text style={tw`text-white font-medium`}>Selesai</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={tw`text-xl font-semibold text-gray-900 mb-6 text-center`}>
          {isEditMode ? "Edit Anggaran" : "Tambah Anggaran Baru"}
        </Text>

        {/* Info jika edit mode */}
        {isEditMode && budgetData && (
          <View
            style={tw`bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6`}
          >
            <Text style={tw`text-sm font-semibold text-blue-800 mb-3`}>
              Informasi Anggaran Saat Ini
            </Text>
            <View style={tw`flex-row justify-between mb-2`}>
              <Text style={tw`text-xs text-gray-600`}>Terpakai:</Text>
              <Text style={tw`text-xs font-semibold text-gray-900`}>
                {formatCurrency(safeNumber(budgetData.spent))}
              </Text>
            </View>
            <View style={tw`flex-row justify-between mb-2`}>
              <Text style={tw`text-xs text-gray-600`}>Sisa:</Text>
              <Text
                style={[
                  tw`text-xs font-semibold`,
                  safeNumber(budgetData.limit - budgetData.spent) >= 0
                    ? tw`text-emerald-600`
                    : tw`text-red-600`,
                ]}
              >
                {formatCurrency(
                  safeNumber(budgetData.limit - budgetData.spent)
                )}
              </Text>
            </View>
            <View style={tw`mt-2 pt-2 border-t border-blue-200`}>
              <Text style={tw`text-xs text-blue-700`}>
                <Text style={tw`font-medium`}>Periode saat ini:</Text>{" "}
                {formatDisplayDate(budgetData.startDate)} -{" "}
                {formatDisplayDate(budgetData.endDate)}
              </Text>
            </View>
          </View>
        )}

        {/* Category Selection */}
        <View style={tw`mb-6`}>
          <View style={tw`flex-row justify-between items-center mb-3`}>
            <Text style={tw`text-sm font-medium text-gray-700`}>Kategori</Text>
            {!isEditMode &&
              state.budgets.some((b) => b.category === category) && (
                <Text style={tw`text-xs text-red-600`}>
                  Kategori sudah digunakan
                </Text>
              )}
          </View>
          <View style={tw`flex-row flex-wrap gap-2`}>
            {AVAILABLE_CATEGORIES.map((cat) => {
              const isUsed =
                !isEditMode && state.budgets.some((b) => b.category === cat);

              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    tw`px-4 py-3 rounded-lg border flex-1 min-w-[45%]`,
                    category === cat
                      ? tw`bg-indigo-600 border-indigo-600`
                      : tw`bg-gray-100 border-gray-200`,
                    isUsed && tw`bg-gray-50 opacity-70`,
                  ]}
                  onPress={() => {
                    if (!isUsed || isEditMode) {
                      setCategory(cat);
                    }
                  }}
                  disabled={isUsed}
                >
                  <View style={tw`items-center`}>
                    <Text
                      style={[
                        tw`text-sm text-center`,
                        category === cat
                          ? tw`text-white font-medium`
                          : tw`text-gray-700`,
                        isUsed && tw`text-gray-500`,
                      ]}
                    >
                      {cat}
                    </Text>
                    {isUsed && (
                      <Text style={tw`text-xs text-red-500 mt-1 font-medium`}>
                        Terpakai
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Period Selection */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-sm font-medium text-gray-700 mb-3`}>
            Jenis Periode
          </Text>
          <View style={tw`flex-row flex-wrap gap-3`}>
            {[
              {
                key: "weekly",
                label: "Mingguan",
                icon: "calendar-outline",
                days: "7 hari",
              },
              {
                key: "monthly",
                label: "Bulanan",
                icon: "calendar-outline",
                days: "30 hari",
              },
              {
                key: "yearly",
                label: "Tahunan",
                icon: "calendar-outline",
                days: "1 tahun",
              },
              {
                key: "custom",
                label: "Custom",
                icon: "create-outline",
                days: "Pilih",
              },
            ].map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[
                  tw`flex-1 min-w-[45%] p-4 bg-white rounded-xl border-2 items-center`,
                  period === p.key
                    ? tw`border-indigo-500 bg-indigo-50`
                    : tw`border-gray-200`,
                ]}
                onPress={() => setPeriod(p.key as any)}
              >
                <View style={tw`mb-2`}>
                  <Ionicons
                    name={p.icon as any}
                    size={24}
                    color={period === p.key ? "#4F46E5" : "#6B7280"}
                  />
                </View>
                <Text
                  style={[
                    tw`text-sm font-semibold mb-1 text-center`,
                    period === p.key ? tw`text-indigo-600` : tw`text-gray-600`,
                  ]}
                >
                  {p.label}
                </Text>
                <Text style={tw`text-xs text-gray-500 text-center`}>
                  {p.days}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Selection */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-sm font-medium text-gray-700 mb-3`}>
            {period === "custom" ? "Rentang Tanggal" : "Tanggal Mulai"}
          </Text>

          {/* Start Date */}
          <View style={tw`mb-3`}>
            <Text style={tw`text-xs text-gray-600 mb-2`}>Tanggal Mulai</Text>
            <TouchableOpacity
              style={tw`flex-row items-center justify-between bg-white border border-gray-300 rounded-lg px-3 py-3`}
              onPress={openStartCalendar}
            >
              <View style={tw`flex-row items-center`}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color="#4F46E5"
                  style={tw`mr-2`}
                />
                <Text style={tw`text-gray-800`}>
                  {formatDisplayDate(startDate)}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* End Date (selalu tampilkan untuk semua jenis period saat edit mode) */}
          {(period === "custom" || isEditMode) && (
            <View>
              <Text style={tw`text-xs text-gray-600 mb-2`}>Tanggal Akhir</Text>
              <TouchableOpacity
                style={tw`flex-row items-center justify-between bg-white border border-gray-300 rounded-lg px-3 py-3`}
                onPress={openEndCalendar}
              >
                <View style={tw`flex-row items-center`}>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color="#4F46E5"
                    style={tw`mr-2`}
                  />
                  <Text style={tw`text-gray-800`}>
                    {formatDisplayDate(endDate)}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}

          {/* Total Hari Info */}
          <View style={tw`mt-3 bg-gray-50 p-3 rounded-lg`}>
            <Text style={tw`text-xs text-gray-700`}>
              <Text style={tw`font-medium`}>Total Periode:</Text>{" "}
              {calculateTotalDays()} hari ({formatDisplayDate(startDate)} -{" "}
              {formatDisplayDate(endDate)})
            </Text>
          </View>
        </View>

        {/* Amount Input dengan Calculator Button */}
        <View style={tw`mb-6`}>
          <View style={tw`flex-row justify-between items-center mb-2`}>
            <Text style={tw`text-sm font-medium text-gray-700`}>
              Limit Anggaran *
            </Text>
            <TouchableOpacity
              style={tw`flex-row items-center gap-1`}
              onPress={() => setShowCalculator(!showCalculator)}
            >
              <Ionicons
                name="calculator-outline"
                size={16}
                color={showCalculator ? "#4F46E5" : "#6B7280"}
              />
              <Text
                style={[
                  tw`text-xs`,
                  showCalculator
                    ? tw`text-indigo-600 font-medium`
                    : tw`text-gray-600`,
                ]}
              >
                {showCalculator ? "Tutup" : "Kalkulator"}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              tw`flex-row items-center bg-white border rounded-lg px-3`,
              !limit ? tw`border-gray-300` : tw`border-indigo-300`,
            ]}
          >
            <Text style={tw`text-gray-600 mr-2`}>Rp</Text>
            <TextInput
              style={tw`flex-1 py-3 text-gray-800 text-base`}
              placeholder="Masukkan limit anggaran"
              placeholderTextColor="#9CA3AF"
              value={limit}
              onChangeText={handleLimitChange}
              keyboardType="decimal-pad"
              returnKeyType="done"
              maxLength={15}
              editable={!loading}
            />
          </View>

          {/* Quick Presets */}
          <View style={tw`mt-3`}>
            <Text style={tw`text-xs text-gray-600 mb-2`}>Pilih cepat:</Text>
            <View style={tw`flex-row flex-wrap gap-2`}>
              {QUICK_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.label}
                  style={tw`px-3 py-1.5 bg-gray-100 rounded-lg active:bg-gray-200`}
                  onPress={() => setLimit(preset.value)}
                  disabled={loading}
                >
                  <Text style={tw`text-xs text-gray-700`}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Budget Calculator */}
          {showCalculator && (
            <View
              style={tw`mt-4 bg-white border border-gray-300 rounded-xl p-4`}
            >
              <View style={tw`flex-row justify-between items-center mb-3`}>
                <Text style={tw`text-sm font-medium text-gray-800`}>
                  🧮 Kalkulator Anggaran
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCalculator(false)}
                  disabled={loading}
                >
                  <Ionicons name="close-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <Text style={tw`text-xs text-gray-600 mb-2`}>
                Masukkan jumlah untuk melihat perhitungan:
              </Text>

              <View
                style={tw`flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 mb-4`}
              >
                <Text style={tw`text-gray-600 mr-2`}>Rp</Text>
                <TextInput
                  style={tw`flex-1 py-3 text-gray-800`}
                  placeholder="Contoh: 200000"
                  placeholderTextColor="#9CA3AF"
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
                  <Text style={tw`text-xs font-medium text-gray-700 mb-2`}>
                    Perkiraan Pengeluaran:
                  </Text>

                  <View style={tw`bg-gray-50 rounded-lg p-3`}>
                    {/* Per Hari */}
                    <TouchableOpacity
                      style={tw`flex-row justify-between items-center p-3 mb-2 bg-white rounded-lg border border-gray-200 active:bg-gray-50`}
                      onPress={() => applyCalculatorResult("daily")}
                      disabled={loading}
                    >
                      <View>
                        <Text style={tw`text-sm font-medium text-gray-900`}>
                          Per Hari
                        </Text>
                        <Text style={tw`text-xs text-gray-500`}>
                          Untuk pengeluaran harian
                        </Text>
                      </View>
                      <View style={tw`items-end`}>
                        <Text style={tw`text-sm font-bold text-gray-900`}>
                          {formatCurrency(calculatorResult.daily)}
                        </Text>
                        <Text style={tw`text-xs text-gray-500`}>
                          × 30 ={" "}
                          {formatCurrency(
                            safeNumber(calculatorResult.daily * 30)
                          )}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Per Minggu */}
                    <TouchableOpacity
                      style={tw`flex-row justify-between items-center p-3 mb-2 bg-white rounded-lg border border-gray-200 active:bg-gray-50`}
                      onPress={() => applyCalculatorResult("weekly")}
                      disabled={loading}
                    >
                      <View>
                        <Text style={tw`text-sm font-medium text-gray-900`}>
                          Per Minggu
                        </Text>
                        <Text style={tw`text-xs text-gray-500`}>
                          Untuk pengeluaran mingguan
                        </Text>
                      </View>
                      <View style={tw`items-end`}>
                        <Text style={tw`text-sm font-bold text-gray-900`}>
                          {formatCurrency(calculatorResult.weekly)}
                        </Text>
                        <Text style={tw`text-xs text-gray-500`}>
                          × 4 ={" "}
                          {formatCurrency(
                            safeNumber(calculatorResult.weekly * 4)
                          )}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Per Bulan */}
                    <TouchableOpacity
                      style={tw`flex-row justify-between items-center p-3 bg-white rounded-lg border border-gray-200 active:bg-gray-50`}
                      onPress={() => applyCalculatorResult("monthly")}
                      disabled={loading}
                    >
                      <View>
                        <Text style={tw`text-sm font-medium text-gray-900`}>
                          Per Bulan
                        </Text>
                        <Text style={tw`text-xs text-gray-500`}>
                          Untuk pengeluaran bulanan
                        </Text>
                      </View>
                      <View style={tw`items-end`}>
                        <Text style={tw`text-sm font-bold text-gray-900`}>
                          {formatCurrency(calculatorResult.monthly)}
                        </Text>
                        <Text style={tw`text-xs text-gray-500`}>
                          ÷ 30 ={" "}
                          {formatCurrency(
                            safeNumber(calculatorResult.monthly / 30)
                          )}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  <Text style={tw`text-xs text-gray-500 mt-2 text-center`}>
                    Tap salah satu untuk mengatur sebagai limit
                  </Text>
                </View>
              )}

              {/* Calculation Info */}
              <View style={tw`bg-blue-50 p-3 rounded-lg`}>
                <Text style={tw`text-xs font-medium text-blue-800 mb-1`}>
                  💡 Cara Hitung:
                </Text>
                <Text style={tw`text-xs text-blue-700`}>
                  • <Text style={tw`font-medium`}>Per Hari</Text>: Jumlah ÷ 30
                  hari
                </Text>
                <Text style={tw`text-xs text-blue-700`}>
                  • <Text style={tw`font-medium`}>Per Minggu</Text>: Jumlah ÷ 4
                  minggu
                </Text>
                <Text style={tw`text-xs text-blue-700`}>
                  • <Text style={tw`font-medium`}>Per Bulan</Text>: Jumlah
                  langsung
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Estimated Daily if limit filled */}
        {limit && safeNumber(parseFloat(limit)) > 0 && (
          <View
            style={tw`mb-6 bg-emerald-50 border border-emerald-100 rounded-xl p-4`}
          >
            <Text style={tw`text-sm font-semibold text-emerald-800 mb-2`}>
              📊 Estimasi Pengeluaran Harian
            </Text>

            <View style={tw`flex-row justify-between items-center mb-3`}>
              <View>
                <Text style={tw`text-xs text-gray-600`}>Per Hari</Text>
                <Text style={tw`text-base font-bold text-emerald-700`}>
                  {formatCurrency(getDailyEstimate())}
                </Text>
              </View>
              <View>
                <Text style={tw`text-xs text-gray-600`}>Total Periode</Text>
                <Text style={tw`text-base font-bold text-emerald-700`}>
                  {calculateTotalDays()} hari
                </Text>
              </View>
            </View>

            <Text style={tw`text-xs text-emerald-700`}>
              Dengan limit {formatCurrency(safeNumber(parseFloat(limit)))} untuk
              periode {calculateTotalDays()} hari, Anda bisa menghabiskan
              maksimal{" "}
              <Text style={tw`font-bold`}>
                {formatCurrency(getDailyEstimate())}
              </Text>{" "}
              per hari.
            </Text>
          </View>
        )}

        {/* Tips */}
        <View style={tw`bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6`}>
          <Text style={tw`text-sm font-semibold text-blue-800 mb-2`}>
            💡 Tips Menentukan Anggaran
          </Text>
          <Text style={tw`text-xs text-blue-700 mb-1`}>
            • <Text style={tw`font-medium`}>Makanan</Text>: Rp
            15.000-30.000/hari
          </Text>
          <Text style={tw`text-xs text-blue-700 mb-1`}>
            • <Text style={tw`font-medium`}>Transportasi</Text>: Rp
            10.000-20.000/hari
          </Text>
          <Text style={tw`text-xs text-blue-700 mb-1`}>
            • <Text style={tw`font-medium`}>Hiburan</Text>: 10-20% dari
            pendapatan
          </Text>
          <Text style={tw`text-xs text-blue-700`}>
            • <Text style={tw`font-medium`}>Tabungan</Text>: Minimal 20% dari
            pendapatan
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={tw`flex-row gap-3 mb-3`}>
          {isEditMode && (
            <TouchableOpacity
              style={tw`flex-1 py-3 bg-red-600 rounded-lg items-center active:bg-red-700`}
              onPress={showDeleteConfirmation}
              disabled={loading}
            >
              <Text style={tw`text-white font-medium`}>Hapus</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              tw`${
                isEditMode ? "flex-2" : "flex-1"
              } py-3 rounded-lg items-center`,
              !category || !limit || loading
                ? tw`bg-gray-400`
                : tw`bg-indigo-600 active:bg-indigo-700`,
            ]}
            onPress={handleSubmit}
            disabled={!category || !limit || loading}
          >
            {loading ? (
              <Text style={tw`text-white font-medium`}>Menyimpan...</Text>
            ) : (
              <Text style={tw`text-white font-medium`}>
                {isEditMode ? "Simpan Perubahan" : "Simpan Anggaran"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          style={tw`py-3 border border-gray-300 rounded-lg items-center mb-8 active:bg-gray-50`}
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

export default AddBudgetScreen;
