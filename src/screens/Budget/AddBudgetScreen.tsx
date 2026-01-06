// File: src/screens/AddBudgetScreen.tsx - WITH NAVY BLUE THEME
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
import { Colors } from "../../theme/theme";

// Type untuk icon yang aman
type SafeIconName = keyof typeof Ionicons.glyphMap;

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
const INFO_COLOR = Colors.info; // "#3B82F6" - Biru terang

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
        backgroundColor: PRIMARY_COLOR,
      },
      headerTintColor: TEXT_PRIMARY,
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
        <View
          style={[
            tw`rounded-xl p-4 w-11/12`,
            { backgroundColor: SURFACE_COLOR },
          ]}
        >
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text style={[tw`text-lg font-semibold`, { color: TEXT_PRIMARY }]}>
              Pilih Tanggal
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowStartCalendar(false);
                setShowEndCalendar(false);
              }}
            >
              <Ionicons name="close" size={24} color={TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>

          <Calendar
            current={tempDate}
            onDayPress={handleCalendarSelect}
            markedDates={{
              [tempDate]: {
                selected: true,
                selectedColor: ACCENT_COLOR,
              },
            }}
            theme={{
              backgroundColor: SURFACE_COLOR,
              calendarBackground: SURFACE_COLOR,
              textSectionTitleColor: TEXT_SECONDARY,
              selectedDayBackgroundColor: ACCENT_COLOR,
              selectedDayTextColor: "#ffffff",
              todayTextColor: ACCENT_COLOR,
              dayTextColor: TEXT_PRIMARY,
              textDisabledColor: Colors.textTertiary,
              dotColor: ACCENT_COLOR,
              selectedDotColor: "#ffffff",
              arrowColor: ACCENT_COLOR,
              monthTextColor: TEXT_PRIMARY,
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
            style={tw`rounded-lg`}
          />

          <View style={tw`mt-4 flex-row justify-between`}>
            <TouchableOpacity
              style={[
                tw`px-4 py-2 rounded-lg`,
                { backgroundColor: Colors.surfaceLight },
              ]}
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
              <Text style={[tw`font-medium`, { color: TEXT_PRIMARY }]}>
                Hari Ini
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                tw`px-4 py-2 rounded-lg`,
                { backgroundColor: ACCENT_COLOR },
              ]}
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
    <View style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        {/* Info jika edit mode */}
        {isEditMode && budgetData && (
          <View
            style={[
              tw`rounded-xl p-4 mb-6`,
              {
                backgroundColor: Colors.info + "10",
                borderWidth: 1,
                borderColor: Colors.info + "30",
              },
            ]}
          >
            <Text
              style={[tw`text-sm font-semibold mb-3`, { color: INFO_COLOR }]}
            >
              Informasi Anggaran Saat Ini
            </Text>
            <View style={tw`flex-row justify-between mb-2`}>
              <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                Terpakai:
              </Text>
              <Text
                style={[tw`text-xs font-semibold`, { color: TEXT_PRIMARY }]}
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
                  tw`text-xs font-semibold`,
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
            <View
              style={[
                tw`mt-2 pt-2`,
                { borderTopWidth: 1, borderTopColor: Colors.info + "30" },
              ]}
            >
              <Text style={[tw`text-xs`, { color: INFO_COLOR }]}>
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
            <Text style={[tw`text-sm font-medium`, { color: TEXT_PRIMARY }]}>
              Kategori
            </Text>
            {!isEditMode &&
              state.budgets.some((b) => b.category === category) && (
                <Text style={[tw`text-xs`, { color: ERROR_COLOR }]}>
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
                      ? {
                          backgroundColor: ACCENT_COLOR,
                          borderColor: ACCENT_COLOR,
                        }
                      : {
                          backgroundColor: Colors.surfaceLight,
                          borderColor: BORDER_COLOR,
                        },
                    isUsed && {
                      backgroundColor: Colors.surfaceLight,
                      opacity: 0.7,
                    },
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
                          ? { color: "#FFFFFF", fontWeight: "500" }
                          : { color: TEXT_PRIMARY },
                        isUsed && { color: Colors.textTertiary },
                      ]}
                    >
                      {cat}
                    </Text>
                    {isUsed && (
                      <Text
                        style={[
                          tw`text-xs mt-1 font-medium`,
                          { color: ERROR_COLOR },
                        ]}
                      >
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
          <Text style={[tw`text-sm font-medium mb-3`, { color: TEXT_PRIMARY }]}>
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
                  tw`flex-1 min-w-[45%] p-4 rounded-xl border-2 items-center`,
                  { backgroundColor: SURFACE_COLOR },
                  period === p.key
                    ? {
                        borderColor: ACCENT_COLOR,
                        backgroundColor: Colors.accent + "10",
                      }
                    : { borderColor: BORDER_COLOR },
                ]}
                onPress={() => setPeriod(p.key as any)}
              >
                <View style={tw`mb-2`}>
                  <Ionicons
                    name={p.icon as any}
                    size={24}
                    color={period === p.key ? ACCENT_COLOR : TEXT_SECONDARY}
                  />
                </View>
                <Text
                  style={[
                    tw`text-sm font-semibold mb-1 text-center`,
                    period === p.key
                      ? { color: ACCENT_COLOR }
                      : { color: TEXT_PRIMARY },
                  ]}
                >
                  {p.label}
                </Text>
                <Text
                  style={[tw`text-xs text-center`, { color: TEXT_SECONDARY }]}
                >
                  {p.days}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Selection */}
        <View style={tw`mb-6`}>
          <Text style={[tw`text-sm font-medium mb-3`, { color: TEXT_PRIMARY }]}>
            {period === "custom" ? "Rentang Tanggal" : "Tanggal Mulai"}
          </Text>

          {/* Start Date */}
          <View style={tw`mb-3`}>
            <Text style={[tw`text-xs mb-2`, { color: TEXT_SECONDARY }]}>
              Tanggal Mulai
            </Text>
            <TouchableOpacity
              style={[
                tw`flex-row items-center justify-between rounded-lg px-3 py-3`,
                {
                  backgroundColor: SURFACE_COLOR,
                  borderWidth: 1,
                  borderColor: BORDER_COLOR,
                },
              ]}
              onPress={openStartCalendar}
            >
              <View style={tw`flex-row items-center`}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={ACCENT_COLOR}
                  style={tw`mr-2`}
                />
                <Text style={{ color: TEXT_PRIMARY }}>
                  {formatDisplayDate(startDate)}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>

          {/* End Date (selalu tampilkan untuk semua jenis period saat edit mode) */}
          {(period === "custom" || isEditMode) && (
            <View>
              <Text style={[tw`text-xs mb-2`, { color: TEXT_SECONDARY }]}>
                Tanggal Akhir
              </Text>
              <TouchableOpacity
                style={[
                  tw`flex-row items-center justify-between rounded-lg px-3 py-3`,
                  {
                    backgroundColor: SURFACE_COLOR,
                    borderWidth: 1,
                    borderColor: BORDER_COLOR,
                  },
                ]}
                onPress={openEndCalendar}
              >
                <View style={tw`flex-row items-center`}>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={ACCENT_COLOR}
                    style={tw`mr-2`}
                  />
                  <Text style={{ color: TEXT_PRIMARY }}>
                    {formatDisplayDate(endDate)}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-down"
                  size={18}
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
              {calculateTotalDays()} hari ({formatDisplayDate(startDate)} -{" "}
              {formatDisplayDate(endDate)})
            </Text>
          </View>
        </View>

        {/* Amount Input dengan Calculator Button */}
        <View style={tw`mb-6`}>
          <View style={tw`flex-row justify-between items-center mb-2`}>
            <Text style={[tw`text-sm font-medium`, { color: TEXT_PRIMARY }]}>
              Limit Anggaran *
            </Text>
            <TouchableOpacity
              style={tw`flex-row items-center gap-1`}
              onPress={() => setShowCalculator(!showCalculator)}
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
              tw`flex-row items-center rounded-lg px-3`,
              {
                backgroundColor: SURFACE_COLOR,
                borderWidth: 1,
                borderColor: limit ? ACCENT_COLOR + "40" : BORDER_COLOR,
              },
            ]}
          >
            <Text style={[tw`mr-2`, { color: TEXT_PRIMARY }]}>Rp</Text>
            <TextInput
              style={[tw`flex-1 py-3 text-base`, { color: TEXT_PRIMARY }]}
              placeholder="Masukkan limit anggaran"
              placeholderTextColor={Colors.textTertiary}
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
            <Text style={[tw`text-xs mb-2`, { color: TEXT_SECONDARY }]}>
              Pilih cepat:
            </Text>
            <View style={tw`flex-row flex-wrap gap-2`}>
              {QUICK_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.label}
                  style={[
                    tw`px-3 py-1.5 rounded-lg active:bg-[${Colors.surfaceLight}]`,
                    { backgroundColor: Colors.surfaceLight },
                  ]}
                  onPress={() => setLimit(preset.value)}
                  disabled={loading}
                >
                  <Text style={[tw`text-xs`, { color: TEXT_PRIMARY }]}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Budget Calculator */}
          {showCalculator && (
            <View
              style={[
                tw`mt-4 rounded-xl p-4`,
                {
                  backgroundColor: SURFACE_COLOR,
                  borderWidth: 1,
                  borderColor: BORDER_COLOR,
                },
              ]}
            >
              <View style={tw`flex-row justify-between items-center mb-3`}>
                <Text
                  style={[tw`text-sm font-medium`, { color: TEXT_PRIMARY }]}
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

              <Text style={[tw`text-xs mb-2`, { color: TEXT_SECONDARY }]}>
                Masukkan jumlah untuk melihat perhitungan:
              </Text>

              <View
                style={[
                  tw`flex-row items-center rounded-lg px-3 mb-4`,
                  {
                    backgroundColor: Colors.surfaceLight,
                    borderWidth: 1,
                    borderColor: BORDER_COLOR,
                  },
                ]}
              >
                <Text style={[tw`mr-2`, { color: TEXT_PRIMARY }]}>Rp</Text>
                <TextInput
                  style={[tw`flex-1 py-3`, { color: TEXT_PRIMARY }]}
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
                      tw`text-xs font-medium mb-2`,
                      { color: TEXT_PRIMARY },
                    ]}
                  >
                    Perkiraan Pengeluaran:
                  </Text>

                  <View
                    style={[
                      tw`rounded-lg p-3`,
                      { backgroundColor: Colors.surfaceLight },
                    ]}
                  >
                    {/* Per Hari */}
                    <TouchableOpacity
                      style={[
                        tw`flex-row justify-between items-center p-3 mb-2 rounded-lg border active:bg-[${Colors.surfaceLight}]`,
                        {
                          backgroundColor: SURFACE_COLOR,
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
                        <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                          Untuk pengeluaran harian
                        </Text>
                      </View>
                      <View style={tw`items-end`}>
                        <Text
                          style={[
                            tw`text-sm font-bold`,
                            { color: TEXT_PRIMARY },
                          ]}
                        >
                          {formatCurrency(calculatorResult.daily)}
                        </Text>
                        <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
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
                        tw`flex-row justify-between items-center p-3 mb-2 rounded-lg border active:bg-[${Colors.surfaceLight}]`,
                        {
                          backgroundColor: SURFACE_COLOR,
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
                        <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                          Untuk pengeluaran mingguan
                        </Text>
                      </View>
                      <View style={tw`items-end`}>
                        <Text
                          style={[
                            tw`text-sm font-bold`,
                            { color: TEXT_PRIMARY },
                          ]}
                        >
                          {formatCurrency(calculatorResult.weekly)}
                        </Text>
                        <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
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
                        tw`flex-row justify-between items-center p-3 rounded-lg border active:bg-[${Colors.surfaceLight}]`,
                        {
                          backgroundColor: SURFACE_COLOR,
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
                        <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                          Untuk pengeluaran bulanan
                        </Text>
                      </View>
                      <View style={tw`items-end`}>
                        <Text
                          style={[
                            tw`text-sm font-bold`,
                            { color: TEXT_PRIMARY },
                          ]}
                        >
                          {formatCurrency(calculatorResult.monthly)}
                        </Text>
                        <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
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
                      tw`text-xs text-center mt-2`,
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
                  tw`p-3 rounded-lg`,
                  {
                    backgroundColor: Colors.info + "10",
                    borderWidth: 1,
                    borderColor: Colors.info + "30",
                  },
                ]}
              >
                <Text
                  style={[tw`text-xs font-medium mb-1`, { color: INFO_COLOR }]}
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
        </View>

        {/* Estimated Daily if limit filled */}
        {limit && safeNumber(parseFloat(limit)) > 0 && (
          <View
            style={[
              tw`mb-6 rounded-xl p-4`,
              {
                backgroundColor: Colors.success + "10",
                borderWidth: 1,
                borderColor: Colors.success + "30",
              },
            ]}
          >
            <Text
              style={[tw`text-sm font-semibold mb-2`, { color: SUCCESS_COLOR }]}
            >
              📊 Estimasi Pengeluaran Harian
            </Text>

            <View style={tw`flex-row justify-between items-center mb-3`}>
              <View>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  Per Hari
                </Text>
                <Text
                  style={[tw`text-base font-bold`, { color: SUCCESS_COLOR }]}
                >
                  {formatCurrency(getDailyEstimate())}
                </Text>
              </View>
              <View>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  Total Periode
                </Text>
                <Text
                  style={[tw`text-base font-bold`, { color: SUCCESS_COLOR }]}
                >
                  {calculateTotalDays()} hari
                </Text>
              </View>
            </View>

            <Text style={[tw`text-xs`, { color: SUCCESS_COLOR }]}>
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
        <View
          style={[
            tw`rounded-xl p-4 mb-6`,
            {
              backgroundColor: Colors.info + "10",
              borderWidth: 1,
              borderColor: Colors.info + "30",
            },
          ]}
        >
          <Text style={[tw`text-sm font-semibold mb-2`, { color: INFO_COLOR }]}>
            💡 Tips Menentukan Anggaran
          </Text>
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

        {/* Action Buttons */}
        <View style={tw`flex-row gap-3 mb-3`}>
          {isEditMode && (
            <TouchableOpacity
              style={[
                tw`flex-1 py-3 rounded-lg items-center`,
                {
                  backgroundColor: ERROR_COLOR,
                  opacity: loading ? 0.7 : 1,
                },
              ]}
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
              {
                backgroundColor:
                  !category || !limit || loading
                    ? Colors.textTertiary
                    : ACCENT_COLOR,
                opacity: !category || !limit || loading ? 0.7 : 1,
              },
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
          style={[
            tw`py-3 rounded-lg items-center mb-8`,
            {
              borderWidth: 1,
              borderColor: BORDER_COLOR,
              opacity: loading ? 0.7 : 1,
            },
          ]}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={[tw``, { color: TEXT_PRIMARY }]}>Batal</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Calendar Modal */}
      {renderCalendarModal()}
    </View>
  );
};

export default AddBudgetScreen;
