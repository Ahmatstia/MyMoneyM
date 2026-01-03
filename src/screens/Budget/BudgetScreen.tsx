// File: src/screens/BudgetScreen.tsx
import React, { useState, useMemo } from "react";
import { View, ScrollView, Alert, TouchableOpacity } from "react-native";
import { Text, ProgressBar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { formatCurrency, safeNumber } from "../../utils/calculations";
import { Budget } from "../../types";

// Type untuk icon yang aman
type SafeIconName = keyof typeof Ionicons.glyphMap;

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
    if (progress > 100) return "#DC2626";
    if (progress >= 80) return "#F59E0B";
    return "#10B981";
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
          progress > 100 && tw`bg-red-100`,
          progress >= 80 && progress <= 100 && tw`bg-yellow-100`,
          progress < 80 && tw`bg-emerald-100`,
        ]}
      >
        <Text
          style={[
            tw`text-xs font-medium`,
            progress > 100 && tw`text-red-600`,
            progress >= 80 && progress <= 100 && tw`text-yellow-600`,
            progress < 80 && tw`text-emerald-600`,
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
      <Ionicons name="pie-chart-outline" size={48} color="#9CA3AF" />
      <Text
        style={tw`text-lg font-semibold text-gray-900 mt-4 mb-2 text-center`}
      >
        {filter === "all" ? "Belum ada anggaran" : "Tidak ada anggaran"}
      </Text>
      <Text style={tw`text-sm text-gray-600 text-center mb-6 leading-5`}>
        {filter === "all"
          ? "Mulai dengan membuat anggaran pertama Anda"
          : `Tidak ada anggaran dengan status "${filter}"`}
      </Text>
      {filter === "all" && (
        <TouchableOpacity
          style={tw`flex-row items-center bg-indigo-600 px-5 py-3 rounded-lg gap-2`}
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
    <View style={tw`flex-1 bg-gray-50`}>
      {/* Header */}
      <View
        style={tw`px-4 pt-3 pb-4 bg-white border-b border-gray-200 flex-row justify-between items-center`}
      >
        <View>
          <Text style={tw`text-2xl font-bold text-gray-900`}>Anggaran</Text>
          <Text style={tw`text-sm text-gray-600 mt-0.5`}>
            {state.budgets.length} anggaran aktif
          </Text>
        </View>
        <TouchableOpacity
          style={tw`w-10 h-10 rounded-full bg-indigo-600 justify-center items-center`}
          onPress={() => navigation.navigate("AddBudget")}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      <View style={tw`bg-white py-4 px-4 border-b border-gray-200`}>
        <View style={tw`flex-row justify-between items-center`}>
          <View style={tw`items-center flex-1`}>
            <Text style={tw`text-gray-600 text-xs mb-0.5`}>Total Limit</Text>
            <Text style={tw`text-base font-bold text-gray-900`}>
              {formatCurrency(summary.totalLimit)}
            </Text>
          </View>
          <View style={tw`w-px h-6 bg-gray-200`} />
          <View style={tw`items-center flex-1`}>
            <Text style={tw`text-gray-600 text-xs mb-0.5`}>Total Terpakai</Text>
            <Text style={tw`text-base font-bold text-gray-900`}>
              {formatCurrency(summary.totalSpent)}
            </Text>
          </View>
          <View style={tw`w-px h-6 bg-gray-200`} />
          <View style={tw`items-center flex-1`}>
            <Text style={tw`text-gray-600 text-xs mb-0.5`}>Total Sisa</Text>
            <Text
              style={[
                tw`text-base font-bold`,
                summary.totalRemaining >= 0
                  ? tw`text-emerald-600`
                  : tw`text-red-600`,
              ]}
            >
              {formatCurrency(summary.totalRemaining)}
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={tw`bg-white border-b border-gray-200 py-2 px-4`}>
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
                filter === tab.key ? tw`bg-indigo-100` : tw`bg-gray-100`,
              ]}
              onPress={() => setFilter(tab.key as any)}
            >
              <Text
                style={[
                  tw`text-xs font-medium`,
                  filter === tab.key ? tw`text-indigo-700` : tw`text-gray-700`,
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
                  style={tw`bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100`}
                >
                  {/* Card Header */}
                  <View style={tw`flex-row justify-between items-start mb-3`}>
                    <View style={tw`flex-row items-center gap-2`}>
                      <Text style={tw`text-base font-semibold text-gray-900`}>
                        {budget.category}
                      </Text>
                      <StatusBadge budget={budget} />
                    </View>
                    <View style={tw`flex-row gap-2`}>
                      <TouchableOpacity
                        style={tw`w-8 h-8 rounded-lg bg-gray-100 justify-center items-center`}
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
                          color="#4F46E5"
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={tw`w-8 h-8 rounded-lg bg-gray-100 justify-center items-center`}
                        onPress={() => handleDelete(budget)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#DC2626"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Period Info */}
                  <View style={tw`mb-3`}>
                    <Text style={tw`text-xs text-gray-600 mb-1`}>
                      {dateInfo}
                    </Text>
                    <View style={tw`flex-row justify-between items-center`}>
                      <View style={tw`flex-row items-center gap-2`}>
                        <Text
                          style={tw`text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-lg`}
                        >
                          {periodInfo}
                        </Text>
                        {daysRemaining > 0 ? (
                          <View style={tw`px-2 py-1 bg-blue-100 rounded-lg`}>
                            <Text style={tw`text-xs font-medium text-blue-700`}>
                              {daysRemainingText}
                            </Text>
                          </View>
                        ) : (
                          <View style={tw`px-2 py-1 bg-gray-100 rounded-lg`}>
                            <Text style={tw`text-xs font-medium text-gray-700`}>
                              Selesai
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={tw`text-sm font-semibold text-indigo-600`}>
                        {progress.toFixed(0)}%
                      </Text>
                    </View>
                  </View>

                  {/* Daily Stats Card */}
                  <View
                    style={tw`mb-3 bg-gray-50 p-3 rounded-lg border border-gray-200`}
                  >
                    <View
                      style={tw`flex-row justify-between items-center mb-2`}
                    >
                      <View style={tw`flex-row items-center gap-1`}>
                        <Ionicons
                          name="calendar-outline"
                          size={12}
                          color="#6B7280"
                        />
                        <Text style={tw`text-xs font-medium text-gray-700`}>
                          Progress Harian
                        </Text>
                      </View>
                      <Text style={tw`text-xs text-gray-500`}>
                        Hari ke-{daysPassed} dari {totalDays} hari
                      </Text>
                    </View>

                    <View style={tw`flex-row justify-between`}>
                      <View style={tw`flex-1 pr-2`}>
                        <Text style={tw`text-xs text-gray-600 mb-0.5`}>
                          Rata-rata/Hari
                        </Text>
                        <Text style={tw`text-sm font-semibold text-gray-900`}>
                          {formatCurrency(dailyAverage)}
                        </Text>
                        <Text style={tw`text-xs text-gray-500 mt-0.5`}>
                          dari {daysPassed} hari
                        </Text>
                      </View>

                      <View style={tw`w-px bg-gray-300`} />

                      <View style={tw`flex-1 pl-2`}>
                        <Text style={tw`text-xs text-gray-600 mb-0.5`}>
                          {daysRemaining > 0 ? "Sisa/Hari" : "Kelebihan/Hari"}
                        </Text>
                        <Text
                          style={[
                            tw`text-sm font-semibold`,
                            dailyRemaining >= 0
                              ? tw`text-emerald-600`
                              : tw`text-red-600`,
                          ]}
                        >
                          {formatCurrency(dailyRemaining)}
                        </Text>
                        <Text style={tw`text-xs text-gray-500 mt-0.5`}>
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
                      <Text style={tw`text-xs text-gray-600`}>
                        {formatCurrency(safeNumber(budget.spent))} /{" "}
                        {formatCurrency(safeNumber(budget.limit))}
                      </Text>
                      <Text style={tw`text-sm font-semibold text-indigo-600`}>
                        {progress.toFixed(0)}%
                      </Text>
                    </View>
                    <ProgressBar
                      progress={normalizedProgress}
                      color={statusColor}
                      style={tw`h-2 rounded-full`}
                    />
                    <View style={tw`flex-row justify-between mt-1`}>
                      <Text style={tw`text-xs text-gray-400`}>Rp0</Text>
                      <Text style={tw`text-xs text-gray-400`}>
                        {formatCurrency(safeNumber(budget.limit))}
                      </Text>
                    </View>
                  </View>

                  {/* Details Row */}
                  <View style={tw`flex-row mb-2 pt-3 border-t border-gray-200`}>
                    <View style={tw`flex-1 items-center`}>
                      <Text style={tw`text-xs text-gray-600 mb-1`}>
                        Terpakai
                      </Text>
                      <Text style={tw`text-sm font-semibold text-gray-900`}>
                        {formatCurrency(safeNumber(budget.spent))}
                      </Text>
                    </View>
                    <View style={tw`flex-1 items-center`}>
                      <Text style={tw`text-xs text-gray-600 mb-1`}>Limit</Text>
                      <Text style={tw`text-sm font-semibold text-gray-900`}>
                        {formatCurrency(safeNumber(budget.limit))}
                      </Text>
                    </View>
                    <View style={tw`flex-1 items-center`}>
                      <Text style={tw`text-xs text-gray-600 mb-1`}>
                        Sisa Total
                      </Text>
                      <Text
                        style={[
                          tw`text-sm font-semibold`,
                          remaining >= 0
                            ? tw`text-emerald-600`
                            : tw`text-red-600`,
                        ]}
                      >
                        {formatCurrency(remaining)}
                      </Text>
                    </View>
                  </View>

                  {/* Info Message */}
                  {dailyRemaining > 0 ? (
                    <View
                      style={tw`mt-2 p-2 bg-emerald-50 rounded-lg border border-emerald-100`}
                    >
                      <Text style={tw`text-xs text-emerald-800 text-center`}>
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
                      style={tw`mt-2 p-2 bg-red-50 rounded-lg border border-red-100`}
                    >
                      <Text style={tw`text-xs text-red-800 text-center`}>
                        🔴 Kelebihan:{" "}
                        <Text style={tw`font-bold`}>
                          {formatCurrency(Math.abs(dailyRemaining))}
                        </Text>{" "}
                        per hari. Kurangi pengeluaran!
                      </Text>
                    </View>
                  ) : daysRemaining === 0 ? (
                    <View
                      style={tw`mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-100`}
                    >
                      <Text style={tw`text-xs text-yellow-800 text-center`}>
                        ⚠️ Budget sudah berakhir!
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={tw`mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100`}
                    >
                      <Text style={tw`text-xs text-blue-800 text-center`}>
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
