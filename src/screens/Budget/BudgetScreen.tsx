// File: src/screens/BudgetScreen.tsx - WITH NAVY BLUE THEME
import React, { useState, useMemo } from "react";
import { View, ScrollView, Alert, TouchableOpacity } from "react-native";
import { Text, ProgressBar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { formatCurrency, safeNumber } from "../../utils/calculations";
import { Budget } from "../../types";
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

const BudgetScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state, deleteBudget } = useAppContext();

  const [filter, setFilter] = useState<"all" | "over" | "warning" | "safe">(
    "all"
  );

  // Helper untuk parse tanggal
  const parseDate = (dateStr: string): Date => {
    try {
      return new Date(dateStr);
    } catch (error) {
      return new Date();
    }
  };

  // Calculate summary
  const summary = useMemo(() => {
    const totalLimit = state.budgets.reduce(
      (sum, b) => sum + safeNumber(b.limit),
      0
    );
    const totalSpent = state.budgets.reduce(
      (sum, b) => sum + safeNumber(b.spent),
      0
    );

    const overBudgets = state.budgets.filter((b) => {
      const safeSpent = safeNumber(b.spent);
      const safeLimit = safeNumber(b.limit);
      return safeLimit > 0 && safeSpent > safeLimit;
    }).length;

    const warningBudgets = state.budgets.filter((b) => {
      const safeSpent = safeNumber(b.spent);
      const safeLimit = safeNumber(b.limit);
      if (safeLimit <= 0) return false;

      const progress = (safeSpent / safeLimit) * 100;
      return progress >= 80 && progress <= 100;
    }).length;

    return {
      totalLimit: safeNumber(totalLimit),
      totalSpent: safeNumber(totalSpent),
      totalRemaining: safeNumber(totalLimit - totalSpent),
      overBudgets,
      warningBudgets,
      safeBudgets: state.budgets.length - overBudgets - warningBudgets,
    };
  }, [state.budgets]);

  // Filter budgets
  const filteredBudgets = useMemo(() => {
    return state.budgets.filter((budget) => {
      const safeSpent = safeNumber(budget.spent);
      const safeLimit = safeNumber(budget.limit);
      if (safeLimit <= 0) return filter === "all";

      const progress = (safeSpent / safeLimit) * 100;

      switch (filter) {
        case "over":
          return safeSpent > safeLimit;
        case "warning":
          return progress >= 80 && progress <= 100;
        case "safe":
          return progress < 80;
        default:
          return true;
      }
    });
  }, [state.budgets, filter]);

  // Hitung hari yang sudah berlalu
  const calculateDaysPassed = (budget: Budget): number => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startDate = parseDate(budget.startDate);
    const start = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    );

    if (today < start) return 0;

    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays + 1);
  };

  // Hitung hari tersisa
  const calculateDaysRemaining = (budget: Budget): number => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const endDate = parseDate(budget.endDate);
    const end = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    );

    if (today > end) return 0;

    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  };

  // Hitung total hari periode
  const calculateTotalDays = (budget: Budget): number => {
    const startDate = parseDate(budget.startDate);
    const endDate = parseDate(budget.endDate);

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(1, diffDays + 1);
  };

  // Hitung sisa harian
  const calculateDailyRemaining = (budget: Budget): number => {
    const daysRemaining = calculateDaysRemaining(budget);
    const safeSpent = safeNumber(budget.spent);
    const safeLimit = safeNumber(budget.limit);
    const remaining = safeLimit - safeSpent;

    if (daysRemaining <= 0 || remaining <= 0) return 0;
    return safeNumber(remaining / daysRemaining);
  };

  // Hitung rata-rata harian
  const calculateDailyAverage = (budget: Budget): number => {
    const daysPassed = calculateDaysPassed(budget);
    const safeSpent = safeNumber(budget.spent);

    if (daysPassed <= 0) return 0;
    return safeNumber(safeSpent / daysPassed);
  };

  // Format hari tersisa
  const formatDaysRemaining = (days: number): string => {
    if (days <= 0) return "Berakhir";
    if (days === 1) return "Besok";
    return `${days} hari lagi`;
  };

  // Format periode
  const formatPeriodInfo = (budget: Budget): string => {
    const periodLabel =
      budget.period === "monthly"
        ? "Bulanan"
        : budget.period === "weekly"
        ? "Mingguan"
        : budget.period === "yearly"
        ? "Tahunan"
        : budget.period === "custom"
        ? "Custom"
        : "Bulanan";

    return periodLabel;
  };

  // Format info tanggal
  const formatDateInfo = (budget: Budget): string => {
    try {
      const startDate = parseDate(budget.startDate);
      const endDate = parseDate(budget.endDate);

      const startDateStr = startDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });

      const endDateStr = endDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year:
          startDate.getFullYear() !== endDate.getFullYear()
            ? "numeric"
            : undefined,
      });

      return `${startDateStr} - ${endDateStr}`;
    } catch (error) {
      return "Periode aktif";
    }
  };

  // Get progress percentage
  const getProgressPercentage = (budget: Budget): number => {
    const safeSpent = safeNumber(budget.spent);
    const safeLimit = safeNumber(budget.limit);

    if (safeLimit <= 0) return 0;

    const progress = (safeSpent / safeLimit) * 100;
    return isNaN(progress) ? 0 : Math.min(progress, 100);
  };

  // Get status color
  const getStatusColor = (budget: Budget) => {
    const progress = getProgressPercentage(budget);
    if (progress > 100) return ERROR_COLOR;
    if (progress >= 80) return WARNING_COLOR;
    return SUCCESS_COLOR;
  };

  // Handle delete budget
  const handleDelete = (budget: Budget) => {
    Alert.alert(
      "Hapus Anggaran",
      `Hapus anggaran "${budget.category}"?\n\nSemua transaksi dengan kategori ini tetap tersimpan.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBudget(budget.id);
              Alert.alert(
                "✅ Berhasil Dihapus",
                `Anggaran "${budget.category}" telah dihapus.\n\nUntuk membuat anggaran baru, tekan tombol +`,
                [{ text: "OK" }]
              );
            } catch (error) {
              Alert.alert("Error", "Gagal menghapus anggaran");
            }
          },
        },
      ]
    );
  };

  // Status Badge Component
  const StatusBadge = ({ budget }: { budget: Budget }) => {
    const progress = getProgressPercentage(budget);
    const text =
      progress > 100 ? "Melebihi" : progress >= 80 ? "Perhatian" : "Aman";

    return (
      <View
        style={[
          tw`px-2 py-1 rounded-lg`,
          progress > 100 && { backgroundColor: Colors.error + "20" },
          progress >= 80 &&
            progress <= 100 && { backgroundColor: Colors.warning + "20" },
          progress < 80 && { backgroundColor: Colors.success + "20" },
        ]}
      >
        <Text
          style={[
            tw`text-xs font-medium`,
            progress > 100 && { color: ERROR_COLOR },
            progress >= 80 && progress <= 100 && { color: WARNING_COLOR },
            progress < 80 && { color: SUCCESS_COLOR },
          ]}
        >
          {text}
        </Text>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={tw`items-center py-12`}>
      <Ionicons
        name="pie-chart-outline"
        size={48}
        color={Colors.textTertiary}
      />
      <Text
        style={[
          tw`text-lg font-semibold mt-4 mb-2 text-center`,
          { color: TEXT_PRIMARY },
        ]}
      >
        {filter === "all" ? "Belum ada anggaran" : "Tidak ada anggaran"}
      </Text>
      <Text
        style={[
          tw`text-sm text-center mb-6 leading-5`,
          { color: TEXT_SECONDARY },
        ]}
      >
        {filter === "all"
          ? "Mulai dengan membuat anggaran pertama Anda"
          : `Tidak ada anggaran dengan status "${filter}"`}
      </Text>
      {filter === "all" && (
        <TouchableOpacity
          style={[
            tw`flex-row items-center px-5 py-3 rounded-lg gap-2`,
            { backgroundColor: ACCENT_COLOR },
          ]}
          onPress={() => navigation.navigate("AddBudget")}
        >
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={tw`text-sm font-semibold text-white`}>
            Buat Anggaran Pertama
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
      {/* Header */}
      <View
        style={[
          tw`px-4 pt-3 pb-4 flex-row justify-between items-center`,
          {
            backgroundColor: SURFACE_COLOR,
            borderBottomWidth: 1,
            borderBottomColor: BORDER_COLOR,
          },
        ]}
      >
        <View>
          <Text style={[tw`text-2xl font-bold`, { color: TEXT_PRIMARY }]}>
            Anggaran
          </Text>
          <Text style={[tw`text-sm mt-0.5`, { color: TEXT_SECONDARY }]}>
            {state.budgets.length} anggaran aktif
          </Text>
        </View>
        <TouchableOpacity
          style={[
            tw`w-10 h-10 rounded-full justify-center items-center`,
            { backgroundColor: ACCENT_COLOR },
          ]}
          onPress={() => navigation.navigate("AddBudget")}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      <View
        style={[
          tw`py-4 px-4`,
          {
            backgroundColor: SURFACE_COLOR,
            borderBottomWidth: 1,
            borderBottomColor: BORDER_COLOR,
          },
        ]}
      >
        <View style={tw`flex-row justify-between items-center`}>
          <View style={tw`items-center flex-1`}>
            <Text style={[tw`text-xs mb-0.5`, { color: TEXT_SECONDARY }]}>
              Total Limit
            </Text>
            <Text style={[tw`text-base font-bold`, { color: TEXT_PRIMARY }]}>
              {formatCurrency(summary.totalLimit)}
            </Text>
          </View>
          <View style={[tw`w-px h-6`, { backgroundColor: BORDER_COLOR }]} />
          <View style={tw`items-center flex-1`}>
            <Text style={[tw`text-xs mb-0.5`, { color: TEXT_SECONDARY }]}>
              Total Terpakai
            </Text>
            <Text style={[tw`text-base font-bold`, { color: TEXT_PRIMARY }]}>
              {formatCurrency(summary.totalSpent)}
            </Text>
          </View>
          <View style={[tw`w-px h-6`, { backgroundColor: BORDER_COLOR }]} />
          <View style={tw`items-center flex-1`}>
            <Text style={[tw`text-xs mb-0.5`, { color: TEXT_SECONDARY }]}>
              Total Sisa
            </Text>
            <Text
              style={[
                tw`text-base font-bold`,
                summary.totalRemaining >= 0
                  ? { color: SUCCESS_COLOR }
                  : { color: ERROR_COLOR },
              ]}
            >
              {formatCurrency(summary.totalRemaining)}
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View
        style={[
          tw`py-2 px-4`,
          {
            backgroundColor: SURFACE_COLOR,
            borderBottomWidth: 1,
            borderBottomColor: BORDER_COLOR,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tw`flex-row gap-2`}
        >
          {[
            { key: "all", label: "Semua", count: state.budgets.length },
            { key: "safe", label: "Aman", count: summary.safeBudgets },
            {
              key: "warning",
              label: "Perhatian",
              count: summary.warningBudgets,
            },
            { key: "over", label: "Melebihi", count: summary.overBudgets },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                tw`px-3 py-1.5 rounded-full`,
                filter === tab.key
                  ? { backgroundColor: ACCENT_COLOR + "20" }
                  : { backgroundColor: Colors.surfaceLight },
              ]}
              onPress={() => setFilter(tab.key as any)}
            >
              <Text
                style={[
                  tw`text-xs font-medium`,
                  filter === tab.key
                    ? { color: ACCENT_COLOR }
                    : { color: TEXT_SECONDARY },
                ]}
              >
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Budget List */}
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        {filteredBudgets.length === 0
          ? renderEmptyState()
          : filteredBudgets.map((budget) => {
              const progress = getProgressPercentage(budget);
              const remaining = safeNumber(budget.limit - budget.spent);
              const statusColor = getStatusColor(budget);
              const normalizedProgress = Math.min(progress / 100, 1);

              // Hitung statistik
              const daysRemaining = calculateDaysRemaining(budget);
              const daysPassed = calculateDaysPassed(budget);
              const totalDays = calculateTotalDays(budget);
              const dailyRemaining = calculateDailyRemaining(budget);
              const dailyAverage = calculateDailyAverage(budget);

              // Format informasi
              const periodInfo = formatPeriodInfo(budget);
              const dateInfo = formatDateInfo(budget);
              const daysRemainingText = formatDaysRemaining(daysRemaining);

              return (
                <View
                  key={budget.id}
                  style={[
                    tw`rounded-xl p-4 mb-3`,
                    {
                      backgroundColor: SURFACE_COLOR,
                      borderWidth: 1,
                      borderColor: BORDER_COLOR,
                    },
                  ]}
                >
                  {/* Card Header */}
                  <View style={tw`flex-row justify-between items-start mb-3`}>
                    <View style={tw`flex-row items-center gap-2`}>
                      <Text
                        style={[
                          tw`text-base font-semibold`,
                          { color: TEXT_PRIMARY },
                        ]}
                      >
                        {budget.category}
                      </Text>
                      <StatusBadge budget={budget} />
                    </View>
                    <View style={tw`flex-row gap-2`}>
                      <TouchableOpacity
                        style={[
                          tw`w-8 h-8 rounded-lg justify-center items-center`,
                          { backgroundColor: Colors.surfaceLight },
                        ]}
                        onPress={() => {
                          navigation.navigate("AddBudget", {
                            editMode: true,
                            budgetData: budget,
                          });
                        }}
                      >
                        <Ionicons
                          name="pencil-outline"
                          size={18}
                          color={ACCENT_COLOR}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          tw`w-8 h-8 rounded-lg justify-center items-center`,
                          { backgroundColor: Colors.surfaceLight },
                        ]}
                        onPress={() => handleDelete(budget)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={ERROR_COLOR}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Period Info */}
                  <View style={tw`mb-3`}>
                    <Text style={[tw`text-xs mb-1`, { color: TEXT_SECONDARY }]}>
                      {dateInfo}
                    </Text>
                    <View style={tw`flex-row justify-between items-center`}>
                      <View style={tw`flex-row items-center gap-2`}>
                        <Text
                          style={[
                            tw`text-sm font-medium px-2 py-1 rounded-lg`,
                            {
                              backgroundColor: Colors.surfaceLight,
                              color: TEXT_PRIMARY,
                            },
                          ]}
                        >
                          {periodInfo}
                        </Text>
                        {daysRemaining > 0 ? (
                          <View
                            style={[
                              tw`px-2 py-1 rounded-lg`,
                              { backgroundColor: Colors.info + "20" },
                            ]}
                          >
                            <Text
                              style={[
                                tw`text-xs font-medium`,
                                { color: INFO_COLOR },
                              ]}
                            >
                              {daysRemainingText}
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={[
                              tw`px-2 py-1 rounded-lg`,
                              { backgroundColor: Colors.surfaceLight },
                            ]}
                          >
                            <Text
                              style={[
                                tw`text-xs font-medium`,
                                { color: TEXT_SECONDARY },
                              ]}
                            >
                              Selesai
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={[
                          tw`text-sm font-semibold`,
                          { color: ACCENT_COLOR },
                        ]}
                      >
                        {progress.toFixed(0)}%
                      </Text>
                    </View>
                  </View>

                  {/* Daily Stats Card */}
                  <View
                    style={[
                      tw`mb-3 p-3 rounded-lg border`,
                      {
                        backgroundColor: Colors.surfaceLight,
                        borderColor: BORDER_COLOR,
                      },
                    ]}
                  >
                    <View
                      style={tw`flex-row justify-between items-center mb-2`}
                    >
                      <View style={tw`flex-row items-center gap-1`}>
                        <Ionicons
                          name="calendar-outline"
                          size={12}
                          color={TEXT_SECONDARY}
                        />
                        <Text
                          style={[
                            tw`text-xs font-medium`,
                            { color: TEXT_PRIMARY },
                          ]}
                        >
                          Progress Harian
                        </Text>
                      </View>
                      <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                        Hari ke-{daysPassed} dari {totalDays} hari
                      </Text>
                    </View>

                    <View style={tw`flex-row justify-between`}>
                      <View style={tw`flex-1 pr-2`}>
                        <Text
                          style={[
                            tw`text-xs mb-0.5`,
                            { color: TEXT_SECONDARY },
                          ]}
                        >
                          Rata-rata/Hari
                        </Text>
                        <Text
                          style={[
                            tw`text-sm font-semibold`,
                            { color: TEXT_PRIMARY },
                          ]}
                        >
                          {formatCurrency(dailyAverage)}
                        </Text>
                        <Text
                          style={[
                            tw`text-xs mt-0.5`,
                            { color: Colors.textTertiary },
                          ]}
                        >
                          dari {daysPassed} hari
                        </Text>
                      </View>

                      <View
                        style={[tw`w-px`, { backgroundColor: BORDER_COLOR }]}
                      />

                      <View style={tw`flex-1 pl-2`}>
                        <Text
                          style={[
                            tw`text-xs mb-0.5`,
                            { color: TEXT_SECONDARY },
                          ]}
                        >
                          {daysRemaining > 0 ? "Sisa/Hari" : "Kelebihan/Hari"}
                        </Text>
                        <Text
                          style={[
                            tw`text-sm font-semibold`,
                            dailyRemaining >= 0
                              ? { color: SUCCESS_COLOR }
                              : { color: ERROR_COLOR },
                          ]}
                        >
                          {formatCurrency(dailyRemaining)}
                        </Text>
                        <Text
                          style={[
                            tw`text-xs mt-0.5`,
                            { color: Colors.textTertiary },
                          ]}
                        >
                          {daysRemaining > 0
                            ? `untuk ${daysRemaining} hari`
                            : "melebihi batas"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={tw`mb-4`}>
                    <View
                      style={tw`flex-row justify-between items-center mb-1`}
                    >
                      <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                        {formatCurrency(safeNumber(budget.spent))} /{" "}
                        {formatCurrency(safeNumber(budget.limit))}
                      </Text>
                      <Text
                        style={[
                          tw`text-sm font-semibold`,
                          { color: ACCENT_COLOR },
                        ]}
                      >
                        {progress.toFixed(0)}%
                      </Text>
                    </View>
                    <ProgressBar
                      progress={normalizedProgress}
                      color={statusColor}
                      style={[
                        tw`h-2 rounded-full`,
                        { backgroundColor: Colors.surfaceLight },
                      ]}
                    />
                    <View style={tw`flex-row justify-between mt-1`}>
                      <Text
                        style={[tw`text-xs`, { color: Colors.textTertiary }]}
                      >
                        Rp0
                      </Text>
                      <Text
                        style={[tw`text-xs`, { color: Colors.textTertiary }]}
                      >
                        {formatCurrency(safeNumber(budget.limit))}
                      </Text>
                    </View>
                  </View>

                  {/* Details Row */}
                  <View
                    style={[
                      tw`flex-row mb-2 pt-3`,
                      { borderTopWidth: 1, borderTopColor: BORDER_COLOR },
                    ]}
                  >
                    <View style={tw`flex-1 items-center`}>
                      <Text
                        style={[tw`text-xs mb-1`, { color: TEXT_SECONDARY }]}
                      >
                        Terpakai
                      </Text>
                      <Text
                        style={[
                          tw`text-sm font-semibold`,
                          { color: TEXT_PRIMARY },
                        ]}
                      >
                        {formatCurrency(safeNumber(budget.spent))}
                      </Text>
                    </View>
                    <View style={tw`flex-1 items-center`}>
                      <Text
                        style={[tw`text-xs mb-1`, { color: TEXT_SECONDARY }]}
                      >
                        Limit
                      </Text>
                      <Text
                        style={[
                          tw`text-sm font-semibold`,
                          { color: TEXT_PRIMARY },
                        ]}
                      >
                        {formatCurrency(safeNumber(budget.limit))}
                      </Text>
                    </View>
                    <View style={tw`flex-1 items-center`}>
                      <Text
                        style={[tw`text-xs mb-1`, { color: TEXT_SECONDARY }]}
                      >
                        Sisa Total
                      </Text>
                      <Text
                        style={[
                          tw`text-sm font-semibold`,
                          remaining >= 0
                            ? { color: SUCCESS_COLOR }
                            : { color: ERROR_COLOR },
                        ]}
                      >
                        {formatCurrency(remaining)}
                      </Text>
                    </View>
                  </View>

                  {/* Info Message */}
                  {dailyRemaining > 0 ? (
                    <View
                      style={[
                        tw`mt-2 p-2 rounded-lg border`,
                        {
                          backgroundColor: Colors.success + "10",
                          borderColor: Colors.success + "30",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          tw`text-xs text-center`,
                          { color: SUCCESS_COLOR },
                        ]}
                      >
                        🟢 Target harian:{" "}
                        <Text style={tw`font-bold`}>
                          {formatCurrency(dailyRemaining)}
                        </Text>{" "}
                        per hari selama{" "}
                        <Text style={tw`font-bold`}>{daysRemaining} hari</Text>{" "}
                        lagi
                      </Text>
                    </View>
                  ) : dailyRemaining < 0 ? (
                    <View
                      style={[
                        tw`mt-2 p-2 rounded-lg border`,
                        {
                          backgroundColor: Colors.error + "10",
                          borderColor: Colors.error + "30",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          tw`text-xs text-center`,
                          { color: ERROR_COLOR },
                        ]}
                      >
                        🔴 Kelebihan:{" "}
                        <Text style={tw`font-bold`}>
                          {formatCurrency(Math.abs(dailyRemaining))}
                        </Text>{" "}
                        per hari. Kurangi pengeluaran!
                      </Text>
                    </View>
                  ) : daysRemaining === 0 ? (
                    <View
                      style={[
                        tw`mt-2 p-2 rounded-lg border`,
                        {
                          backgroundColor: Colors.warning + "10",
                          borderColor: Colors.warning + "30",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          tw`text-xs text-center`,
                          { color: WARNING_COLOR },
                        ]}
                      >
                        ⚠️ Budget sudah berakhir!
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        tw`mt-2 p-2 rounded-lg border`,
                        {
                          backgroundColor: Colors.info + "10",
                          borderColor: Colors.info + "30",
                        },
                      ]}
                    >
                      <Text
                        style={[tw`text-xs text-center`, { color: INFO_COLOR }]}
                      >
                        🔵 Budget berjalan normal.
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
      </ScrollView>
    </View>
  );
};

export default BudgetScreen;
