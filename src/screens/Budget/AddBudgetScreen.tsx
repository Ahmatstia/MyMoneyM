import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import DateTimePicker from "@react-native-community/datetimepicker";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import {
  formatCurrency,
  safeNumber,
  getCurrentDate,
  getMonthlyCycleRange,
} from "../../utils/calculations";
import { RootStackParamList } from "../../types";
import { Colors } from "../../theme/theme";
import { useTheme } from "../../theme/ThemeContext";
import CategoryPickerModal, { DEFAULT_CATEGORIES, CategoryItem } from "../../components/CategoryPickerModal";


type AddBudgetScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddBudget"
>;

type AddBudgetScreenRouteProp = RouteProp<RootStackParamList, "AddBudget">;




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
  const { colors } = useTheme();
  const PRIMARY_COLOR = colors.primary;
  const ACCENT_COLOR = colors.accent;
  const BACKGROUND_COLOR = colors.background;
  const SURFACE_COLOR = colors.surface;
  const TEXT_PRIMARY = colors.textPrimary;
  const TEXT_SECONDARY = colors.textSecondary;
  const BORDER_COLOR = colors.border;
  const SUCCESS_COLOR = colors.success;
  const WARNING_COLOR = colors.warning;
  const ERROR_COLOR = colors.error;
  const INFO_COLOR = colors.info;

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

  // Model Anggaran: Berulang (Rutin) vs Sekali Pakai (Event)
  const [isRecurring, setIsRecurring] = useState<boolean>(
    budgetData ? budgetData.isRecurring !== false : true
  );

  const initialRecurringType = (): "monthly" | "weekly" | "custom_days" => {
    if (!budgetData) return "monthly";
    if (budgetData.period === "weekly") return "weekly";
    if (budgetData.period === "custom" && budgetData.cycleDays) return "custom_days";
    return "monthly";
  };
  const [recurringType, setRecurringType] = useState<"monthly" | "weekly" | "custom_days">(
    initialRecurringType()
  );
  const [customDays, setCustomDays] = useState<string>(
    budgetData?.cycleDays ? String(budgetData.cycleDays) : "10"
  );

  const [period, setPeriod] = useState<
    "custom" | "weekly" | "monthly" | "yearly"
  >(budgetData?.period || "monthly");

  const initialStartDate = useMemo(() => {
    if (budgetData?.startDate) return budgetData.startDate;
    if (state.paydayCutoff && state.paydayCutoff > 1) {
      const cycleRange = getMonthlyCycleRange(state.paydayCutoff);
      return formatDateToYYYYMMDD(cycleRange.startDate);
    }
    return getCurrentDate();
  }, [budgetData, state.paydayCutoff]);

  const [startDate, setStartDate] = useState<string>(initialStartDate);
  const [endDate, setEndDate] = useState<string>(
    budgetData?.endDate || getCurrentDate()
  );
  const [loading, setLoading] = useState(false);
  const [limitError, setLimitError] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

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

  // Update end date berdasarkan model anggaran & periode
  useEffect(() => {
    if (!isRecurring) {
      setPeriod("custom");
      return;
    }

    const start = new Date(startDate);
    let newEndDate = new Date(start);

    if (recurringType === "weekly") {
      setPeriod("weekly");
      newEndDate.setDate(newEndDate.getDate() + 6);
    } else if (recurringType === "monthly") {
      setPeriod("monthly");
      if (start.getDate() === 1) {
        newEndDate = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      } else {
        const targetMonth = start.getMonth() + 1;
        const targetYear = start.getFullYear() + Math.floor(targetMonth / 12);
        const normMonth = targetMonth % 12;
        const daysInTargetMonth = new Date(targetYear, normMonth + 1, 0).getDate();
        const targetDay = Math.min(start.getDate() - 1, daysInTargetMonth);
        newEndDate = new Date(targetYear, normMonth, Math.max(1, targetDay));
      }
    } else if (recurringType === "custom_days") {
      setPeriod("custom");
      const days = Math.max(1, parseInt(customDays, 10) || 10);
      newEndDate.setDate(newEndDate.getDate() + (days - 1));
    }

    setEndDate(formatDateToYYYYMMDD(newEndDate));
  }, [isRecurring, recurringType, customDays, startDate]);

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
  const handleDateSelect = (_event: any, selectedDate?: Date) => {
    setShowCalendar(false);

    if (selectedDate) {
      const formattedDate = formatDateToYYYYMMDD(selectedDate);

      if (calendarMode === "start") {
        setStartDate(formattedDate);
      } else {
        setEndDate(formattedDate);
      }
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
      // RISK-005 FIX: Compare case-insensitively & only check active budgets
      const today = new Date().toISOString().split("T")[0];
      const isDuplicate = state.budgets.some((b) => {
        if (b.category.toLowerCase() !== category.toLowerCase()) return false;
        // Jika anggaran lama adalah sekali pakai dan sudah lewat tanggalnya, jangan blokir
        const isCompleted = b.isRecurring === false && today > b.endDate;
        return !isCompleted;
      });
      if (isDuplicate) {
        Alert.alert("Error", `Kategori "${category}" sudah memiliki anggaran aktif.`);
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

    const parsedCustomDays = isRecurring && recurringType === "custom_days"
      ? Math.max(1, parseInt(customDays, 10) || 10)
      : undefined;

    const resolvedPeriod: "custom" | "weekly" | "monthly" | "yearly" = isRecurring
      ? (recurringType === "custom_days" ? "custom" : recurringType)
      : "custom";

    setLoading(true);
    try {
      const budgetPayload = {
        category,
        limit: limitNum,
        period: resolvedPeriod,
        startDate,
        endDate,
        isRecurring,
        cycleDays: parsedCustomDays,
      };

      if (isEditMode && budgetData) {
        await editBudget(budgetData.id, {
          ...budgetPayload,
          lastResetDate: budgetData.lastResetDate || budgetData.createdAt,
        });
        Alert.alert("Sukses", "Anggaran berhasil diperbarui", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        await addBudget(budgetPayload);
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

  // Render category icon — removed (now uses CategoryPickerModal)

  // Resolve icon+color for the selected category
  const resolvedCategory = React.useMemo((): CategoryItem | null => {
    const all: CategoryItem[] = [
      ...DEFAULT_CATEGORIES,
      ...(state.customCategories || []).map((c) => ({
        id: c.id, name: c.name, icon: c.icon, color: c.color,
        isCustom: true as const, customId: c.id,
      })),
    ];
    return all.find((c) => c.name === category) || null;
  }, [category, state.customCategories]);


  // Categories already in use (for budget duplicate detection)
  const usedBudgetCategories = React.useMemo(() =>
    isEditMode
      ? state.budgets.filter((b) => b.id !== budgetData?.id).map((b) => b.category)
      : state.budgets.map((b) => b.category),
    [state.budgets, isEditMode, budgetData]
  );

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]} edges={['bottom']}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-4 pt-4 pb-2`}
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

        {/* Category Selection */}
        <View style={tw`mb-4`}>
          <View style={tw`flex-row items-center justify-between mb-1.5 ml-1`}>
            <Text style={[tw`text-[10px] font-bold uppercase tracking-widest`, { color: TEXT_SECONDARY }]}>Kategori</Text>
            {category ? <Text style={[tw`text-[10px] font-bold`, { color: ACCENT_COLOR }]}>✓ Terpilih</Text> : null}
          </View>

          <TouchableOpacity
            onPress={() => setShowCategoryPicker(true)}
            disabled={loading}
            style={[tw`rounded-xl px-4 py-3 flex-row items-center`, { backgroundColor: SURFACE_COLOR }]}
          >
            {resolvedCategory ? (
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${resolvedCategory.color}20`, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Ionicons name={resolvedCategory.icon as any} size={16} color={resolvedCategory.color} />
              </View>
            ) : (
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${ACCENT_COLOR}12`, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Ionicons name="grid-outline" size={16} color={ACCENT_COLOR} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ color: category ? TEXT_PRIMARY : Colors.textTertiary, fontSize: 13, fontWeight: "600" }}>
                {category || "Pilih kategori..."}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.gray500} />
          </TouchableOpacity>

          <CategoryPickerModal
            visible={showCategoryPicker}
            onClose={() => setShowCategoryPicker(false)}
            onSelect={(name) => setCategory(name)}
            selectedName={category}
            usedBudgetCategories={usedBudgetCategories}
          />
        </View>

        {/* Model & Jenis Periode Anggaran */}
        <View style={tw`mb-4`}>
          <Text style={[tw`text-[10px] font-bold uppercase tracking-widest mb-2 ml-1`, { color: TEXT_SECONDARY }]}>
            Model Anggaran
          </Text>
          <View style={[tw`flex-row p-1 rounded-2xl mb-3`, { backgroundColor: SURFACE_COLOR }]}>
            <TouchableOpacity
              style={[
                tw`flex-1 flex-row items-center justify-center py-2.5 px-3 rounded-xl gap-2`,
                isRecurring ? { backgroundColor: ACCENT_COLOR } : { backgroundColor: "transparent" },
              ]}
              onPress={() => setIsRecurring(true)}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons
                name="sync-outline"
                size={16}
                color={isRecurring ? Colors.background : TEXT_SECONDARY}
              />
              <View>
                <Text
                  style={[
                    tw`text-xs font-bold`,
                    { color: isRecurring ? Colors.background : TEXT_PRIMARY },
                  ]}
                >
                  Berulang (Rutin)
                </Text>
                <Text
                  style={[
                    tw`text-[9px]`,
                    { color: isRecurring ? `${Colors.background}CC` : TEXT_SECONDARY },
                  ]}
                >
                  Auto-renew tiap siklus
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                tw`flex-1 flex-row items-center justify-center py-2.5 px-3 rounded-xl gap-2`,
                !isRecurring ? { backgroundColor: ACCENT_COLOR } : { backgroundColor: "transparent" },
              ]}
              onPress={() => setIsRecurring(false)}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons
                name="flag-outline"
                size={16}
                color={!isRecurring ? Colors.background : TEXT_SECONDARY}
              />
              <View>
                <Text
                  style={[
                    tw`text-xs font-bold`,
                    { color: !isRecurring ? Colors.background : TEXT_PRIMARY },
                  ]}
                >
                  Sekali Pakai (Event)
                </Text>
                <Text
                  style={[
                    tw`text-[9px]`,
                    { color: !isRecurring ? `${Colors.background}CC` : TEXT_SECONDARY },
                  ]}
                >
                  Liburan, mudik, renovasi
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {isRecurring ? (
            <View>
              <Text style={[tw`text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1`, { color: TEXT_SECONDARY }]}>
                Siklus Berulang
              </Text>
              <View style={tw`flex-row gap-2`}>
                {[
                  { key: "monthly", label: "Bulanan", desc: "Tiap bulan" },
                  { key: "weekly", label: "Mingguan", desc: "7 hari" },
                  { key: "custom_days", label: "Siklus Kustom", desc: `${customDays || "10"} hari` },
                ].map((p) => {
                  const isActive = recurringType === p.key;
                  return (
                    <TouchableOpacity
                      key={p.key}
                      style={[
                        tw`flex-1 rounded-xl px-3 py-2.5 items-center`,
                        isActive
                          ? { backgroundColor: ACCENT_COLOR + "18", borderWidth: 1, borderColor: ACCENT_COLOR }
                          : { backgroundColor: SURFACE_COLOR },
                      ]}
                      onPress={() => setRecurringType(p.key as any)}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          tw`text-xs font-bold`,
                          isActive ? { color: ACCENT_COLOR } : { color: TEXT_PRIMARY },
                        ]}
                      >
                        {p.label}
                      </Text>
                      <Text
                        style={[
                          tw`text-[9px] mt-0.5`,
                          isActive ? { color: ACCENT_COLOR } : { color: TEXT_SECONDARY },
                        ]}
                      >
                        {p.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {recurringType === "custom_days" && (
                <View style={[tw`mt-3 p-3.5 rounded-xl border`, { backgroundColor: SURFACE_COLOR, borderColor: BORDER_COLOR }]}>
                  <Text style={[tw`text-[11px] font-bold mb-1.5`, { color: TEXT_PRIMARY }]}>
                    Ulangi Setiap Berapa Hari?
                  </Text>
                  <View style={tw`flex-row items-center gap-2 mb-2.5`}>
                    <TextInput
                      style={[
                        tw`text-base font-bold px-3 py-2 rounded-lg text-center`,
                        { backgroundColor: Colors.background, color: ACCENT_COLOR, minWidth: 60 },
                      ]}
                      value={customDays}
                      onChangeText={(val) => {
                        const clean = val.replace(/[^0-9]/g, "");
                        setCustomDays(clean);
                      }}
                      keyboardType="number-pad"
                      maxLength={3}
                      placeholder="10"
                      placeholderTextColor={Colors.textTertiary}
                    />
                    <Text style={[tw`text-xs font-medium flex-1`, { color: TEXT_SECONDARY }]}>
                      hari sekali (auto-reset setiap {customDays || "10"} hari)
                    </Text>
                  </View>
                  <View style={tw`flex-row gap-2`}>
                    {["7", "10", "14", "15", "30"].map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[
                          tw`px-2.5 py-1 rounded-lg`,
                          customDays === d
                            ? { backgroundColor: ACCENT_COLOR }
                            : { backgroundColor: Colors.background },
                        ]}
                        onPress={() => setCustomDays(d)}
                      >
                        <Text
                          style={[
                            tw`text-[10px] font-bold`,
                            customDays === d ? { color: Colors.background } : { color: TEXT_SECONDARY },
                          ]}
                        >
                          {d} hr
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View
              style={[
                tw`p-3.5 rounded-xl flex-row items-start gap-2.5`,
                { backgroundColor: `${Colors.accent}12`, borderWidth: 1, borderColor: `${Colors.accent}25` },
              ]}
            >
              <Ionicons name="information-circle-outline" size={18} color={ACCENT_COLOR} style={tw`mt-0.5`} />
              <View style={tw`flex-1`}>
                <Text style={[tw`text-xs font-bold mb-0.5`, { color: ACCENT_COLOR }]}>
                  Anggaran Sekali Pakai (Event)
                </Text>
                <Text style={[tw`text-[11px] leading-4`, { color: TEXT_SECONDARY }]}>
                  Berlaku khusus untuk rentang tanggal tertentu. Setelah periode berakhir, anggaran akan berstatus Selesai dan tersimpan di Riwayat Anggaran tanpa direset ulang.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Quick Limit Suggestions */}
        {!limit && (
          <View style={tw`mb-4`}>
            <Text style={[tw`text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1`, { color: TEXT_SECONDARY }]}>
              💡 Limit Cepat
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-1`}>
              <View style={tw`flex-row px-1`}>
                {QUICK_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.label}
                    style={[tw`rounded-xl px-4 py-2 mr-2`, { backgroundColor: SURFACE_COLOR }]}
                    onPress={() => setLimit(preset.value)}
                  >
                    <Text style={[tw`text-xs font-bold`, { color: ACCENT_COLOR }]}>{preset.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Limit Input */}
        <View style={tw`mb-4`}>
          <View style={tw`flex-row justify-between items-center mb-1.5 ml-1`}>
            <Text style={[tw`text-[10px] font-bold uppercase tracking-widest`, { color: TEXT_SECONDARY }]}>
              Limit Anggaran
            </Text>
            <TouchableOpacity
              style={tw`flex-row items-center gap-1 mr-1`}
              onPress={() => setShowCalculator(!showCalculator)}
              disabled={loading}
            >
              <Ionicons name="calculator-outline" size={12} color={showCalculator ? ACCENT_COLOR : TEXT_SECONDARY} />
              <Text style={[tw`text-[10px] font-bold`, showCalculator ? { color: ACCENT_COLOR } : { color: TEXT_SECONDARY }]}>
                {showCalculator ? "TUTUP" : "KALKULATOR"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[tw`rounded-xl px-4 py-3`, { backgroundColor: SURFACE_COLOR, borderWidth: limitError ? 1 : 0, borderColor: limitError ? ERROR_COLOR : "transparent" }]}>
            <View style={tw`flex-row items-center`}>
              <Text style={[tw`text-lg font-bold mr-2`, { color: TEXT_SECONDARY }]}>Rp</Text>
              <TextInput
                style={[tw`flex-1 text-xl font-bold`, { color: TEXT_PRIMARY, padding: 0 }]}
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
              <View style={tw`mt-2 pt-2 border-t border-gray-700`}>
                <Text style={[tw`text-[10px] font-medium`, { color: TEXT_SECONDARY }]}>{formatLimitDisplay()}</Text>
                {parseFloat(limit) > 5000000 && (
                  <View style={tw`flex-row items-center mt-1`}>
                    <Ionicons name="bulb-outline" size={10} color={WARNING_COLOR} />
                    <Text style={[tw`text-[10px] ml-1`, { color: WARNING_COLOR }]}>💰 Anggaran besar!</Text>
                  </View>
                )}
              </View>
            ) : null}
            {limitError ? <Text style={[tw`text-[10px] mt-1`, { color: ERROR_COLOR }]}>{limitError}</Text> : null}
          </View>
        </View>

        {/* Budget Calculator */}
        {showCalculator && (
          <View style={[tw`rounded-xl p-4 mb-4`, { backgroundColor: SURFACE_COLOR }]}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={[tw`text-[13px] font-bold`, { color: TEXT_PRIMARY }]}>🧮 Kalkulator Anggaran</Text>
              <TouchableOpacity onPress={() => setShowCalculator(false)} disabled={loading}>
                <Ionicons name="close-circle" size={20} color={TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>

            <Text style={[tw`text-[10px] mb-2`, { color: TEXT_SECONDARY }]}>Masukkan jumlah untuk perhitungan:</Text>

            <View style={[tw`flex-row items-center rounded-xl px-4 py-3 mb-4`, { backgroundColor: Colors.background }]}>
              <Text style={[tw`mr-2 font-bold`, { color: TEXT_PRIMARY }]}>Rp</Text>
              <TextInput
                style={[tw`flex-1 text-[13px] font-bold`, { color: TEXT_PRIMARY, padding: 0 }]}
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
                <Text style={[tw`text-[10px] font-bold uppercase tracking-widest mb-3 ml-1`, { color: TEXT_SECONDARY }]}>
                  Perkiraan Pengeluaran:
                </Text>

                <View>
                  {/* Per Hari */}
                  <TouchableOpacity
                    style={[tw`flex-row justify-between items-center p-3 rounded-xl mb-2`, { backgroundColor: Colors.background }]}
                    onPress={() => applyCalculatorResult("daily")}
                    disabled={loading}
                  >
                    <View>
                      <Text style={[tw`text-[10px] font-medium`, { color: TEXT_SECONDARY }]}>Per Hari (x30)</Text>
                      <Text style={[tw`text-[13px] font-bold`, { color: TEXT_PRIMARY }]}>{formatCurrency(calculatorResult.daily)}</Text>
                    </View>
                    <Text style={[tw`text-[10px] font-bold`, { color: ACCENT_COLOR }]}>Pakai</Text>
                  </TouchableOpacity>

                  {/* Per Minggu */}
                  <TouchableOpacity
                    style={[tw`flex-row justify-between items-center p-3 rounded-xl mb-2`, { backgroundColor: Colors.background }]}
                    onPress={() => applyCalculatorResult("weekly")}
                    disabled={loading}
                  >
                    <View>
                      <Text style={[tw`text-[10px] font-medium`, { color: TEXT_SECONDARY }]}>Per Minggu (x4)</Text>
                      <Text style={[tw`text-[13px] font-bold`, { color: TEXT_PRIMARY }]}>{formatCurrency(calculatorResult.weekly)}</Text>
                    </View>
                    <Text style={[tw`text-[10px] font-bold`, { color: ACCENT_COLOR }]}>Pakai</Text>
                  </TouchableOpacity>

                  {/* Per Bulan */}
                  <TouchableOpacity
                    style={[tw`flex-row justify-between items-center p-3 rounded-xl`, { backgroundColor: Colors.background }]}
                    onPress={() => applyCalculatorResult("monthly")}
                    disabled={loading}
                  >
                    <View>
                      <Text style={[tw`text-[10px] font-medium`, { color: TEXT_SECONDARY }]}>Per Bulan (Langsung)</Text>
                      <Text style={[tw`text-[13px] font-bold`, { color: TEXT_PRIMARY }]}>{formatCurrency(calculatorResult.monthly)}</Text>
                    </View>
                    <Text style={[tw`text-[10px] font-bold`, { color: ACCENT_COLOR }]}>Pakai</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[tw`text-[10px] text-center mt-3 font-medium`, { color: Colors.gray500 }]}>
                  Tap salah satu untuk mengatur sebagai limit
                </Text>
              </View>
            )}

            {/* Calculation Info */}
            <View
              style={[
                tw`p-4 rounded-2xl`,
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

        {/* Date Selection */}
        <View style={tw`mb-5`}>
          <Text
            style={[tw`text-sm font-medium mb-3`, { color: TEXT_SECONDARY }]}
          >
            {isRecurring ? "Jadwal & Periode Siklus" : "Rentang Tanggal Event (Sekali Pakai)"}
          </Text>

          {/* Start Date */}
          <View style={tw`mb-3`}>
            <Text style={[tw`text-xs mb-2`, { color: TEXT_SECONDARY }]}>
              {isRecurring ? "Tanggal Mulai Siklus" : "Tanggal Mulai"}
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

          {/* End Date (selalu untuk sekali pakai, atau jika custom / edit) */}
          {(!isRecurring || isEditMode) && (
            <View style={tw`mb-3`}>
              <Text style={[tw`text-xs mb-2`, { color: TEXT_SECONDARY }]}>
                {isRecurring ? "Tanggal Akhir Siklus" : "Tanggal Selesai Event"}
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

          {/* Total Hari & Info */}
          <View
            style={[
              tw`mt-1 p-3.5 rounded-xl border`,
              { backgroundColor: SURFACE_COLOR, borderColor: BORDER_COLOR },
            ]}
          >
            <View style={tw`flex-row items-center justify-between mb-1`}>
              <Text style={[tw`text-[11px] font-bold`, { color: TEXT_PRIMARY }]}>
                {isRecurring ? "🔄 Siklus Periode Aktif" : "🎯 Durasi Event Sekali Pakai"}
              </Text>
              <Text style={[tw`text-[11px] font-bold`, { color: ACCENT_COLOR }]}>
                {calculateTotalDays()} hari
              </Text>
            </View>
            <Text style={[tw`text-[11px] leading-4`, { color: TEXT_SECONDARY }]}>
              {formatDateForDisplay(startDate)} s.d. {formatDateForDisplay(endDate)}
              {isRecurring ? "\n(Otomatis reset siklus berikutnya setelah tanggal akhir)" : "\n(Status akan berubah menjadi 'Selesai' setelah tanggal akhir)"}
            </Text>
          </View>
        </View>

        {/* Estimated Daily - KONSISTEN STYLE */}
        {limit && safeNumber(parseFloat(limit)) > 0 && (
          <View style={[tw`rounded-xl p-4 mb-4`, { backgroundColor: SUCCESS_COLOR + "10" }]}>
            <View style={tw`flex-row items-center justify-between`}>
              <View>
                <Text style={[tw`text-[10px] font-bold uppercase tracking-widest`, { color: SUCCESS_COLOR }]}>Estimasi Harian</Text>
                <Text style={[tw`text-[13px] font-bold mt-1`, { color: SUCCESS_COLOR }]}>{formatCurrency(getDailyEstimate())} <Text style={tw`font-medium text-[10px]`}>/ hari</Text></Text>
              </View>
              <View style={tw`items-end`}>
                <Text style={[tw`text-[10px] font-bold uppercase tracking-widest`, { color: SUCCESS_COLOR }]}>Total Hari</Text>
                <Text style={[tw`text-[13px] font-bold mt-1`, { color: SUCCESS_COLOR }]}>{calculateTotalDays()}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Tips */}
        <View style={[tw`rounded-xl p-4 mb-4`, { backgroundColor: INFO_COLOR + "10" }]}>
          <View style={tw`flex-row items-center mb-2`}>
            <Ionicons name="bulb-outline" size={14} color={INFO_COLOR} />
            <Text style={[tw`text-[11px] font-bold uppercase tracking-widest ml-1`, { color: INFO_COLOR }]}>Tips Anggaran</Text>
          </View>
          <Text style={[tw`text-[11px] mb-1`, { color: INFO_COLOR }]}><Text style={tw`font-bold`}>Makanan</Text>: Rp 15-30k/hari</Text>
          <Text style={[tw`text-[11px] mb-1`, { color: INFO_COLOR }]}><Text style={tw`font-bold`}>Transport</Text>: Rp 10-20k/hari</Text>
          <Text style={[tw`text-[11px] mb-1`, { color: INFO_COLOR }]}><Text style={tw`font-bold`}>Hiburan</Text>: 10-20% gaji</Text>
          <Text style={[tw`text-[11px]`, { color: INFO_COLOR }]}><Text style={tw`font-bold`}>Tabungan</Text>: Min 20% gaji</Text>
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
            style={[tw`flex-1 rounded-xl py-3.5 items-center`, { backgroundColor: ACCENT_COLOR, opacity: (!category || !limit || loading) ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={!category || !limit || loading}
          >
            <Text style={tw`text-white text-[13px] font-bold`}>
              {loading ? "Menyimpan..." : isEditMode ? "Simpan" : "Tambah"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* DateTime Picker Modal */}
      {showCalendar && (
        <DateTimePicker
          value={calendarMode === "start" ? new Date(startDate) : new Date(endDate)}
          mode="date"
          display="default"
          onValueChange={handleDateSelect}
          onDismiss={() => setShowCalendar(false)}
        />
      )}
    </SafeAreaView>
  );
};

export default AddBudgetScreen;
