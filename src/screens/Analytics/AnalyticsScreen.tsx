// File: src/screens/Analytics/AnalyticsScreen.tsx
import React, { useState, useMemo } from "react";
import { View, ScrollView, TouchableOpacity, Share, Alert } from "react-native";
import { Text, ProgressBar, Divider } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import {
  calculateTransactionAnalytics,
  calculateBudgetAnalytics,
  calculateSavingsAnalytics,
  generateFinancialInsights,
} from "../../utils/analytics";
import {
  formatCurrency,
  getCurrentMonth,
  getSafePercentage,
  safeNumber,
} from "../../utils/calculations";

// Type untuk icon yang aman
type SafeIconName = keyof typeof Ionicons.glyphMap;

const AnalyticsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state } = useAppContext();

  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">(
    "month"
  );
  const [activeTab, setActiveTab] = useState<
    "summary" | "trends" | "categories" | "insights"
  >("summary");

  // Safe icon helper
  const getSafeIcon = (iconName: string): SafeIconName => {
    const defaultIcon: SafeIconName = "alert-circle-outline";
    if (iconName in Ionicons.glyphMap) {
      return iconName as SafeIconName;
    }
    return defaultIcon;
  };

  // Analytics calculations with safe values
  const transactionAnalytics = useMemo(() => {
    const analytics = calculateTransactionAnalytics(
      state.transactions,
      timeRange
    );
    return {
      ...analytics,
      totalIncome: safeNumber(analytics.totalIncome),
      totalExpense: safeNumber(analytics.totalExpense),
      netSavings: safeNumber(analytics.netSavings),
      savingsRate: safeNumber(analytics.savingsRate),
      avgDailyExpense: safeNumber(analytics.avgDailyExpense),
    };
  }, [state.transactions, timeRange]);

  const budgetAnalytics = useMemo(
    () => calculateBudgetAnalytics(state.budgets),
    [state.budgets]
  );

  const savingsAnalytics = useMemo(
    () => calculateSavingsAnalytics(state.savings),
    [state.savings]
  );

  const insights = useMemo(
    () =>
      generateFinancialInsights(
        transactionAnalytics,
        budgetAnalytics,
        savingsAnalytics
      ),
    [transactionAnalytics, budgetAnalytics, savingsAnalytics]
  );

  // Calculate vs last month (comparative analysis) with safe values
  const getComparativeData = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const lastMonthTransactions = state.transactions.filter((t) => {
      try {
        const transDate = new Date(t.date);
        if (isNaN(transDate.getTime())) return false;

        return (
          transDate.getMonth() === lastMonth.getMonth() &&
          transDate.getFullYear() === lastMonth.getFullYear()
        );
      } catch (error) {
        return false;
      }
    });

    const lastMonthAnalytics = calculateTransactionAnalytics(
      lastMonthTransactions,
      "month"
    );

    const incomeChange = safeNumber(
      transactionAnalytics.totalIncome - lastMonthAnalytics.totalIncome
    );
    const expenseChange = safeNumber(
      transactionAnalytics.totalExpense - lastMonthAnalytics.totalExpense
    );
    const savingsRateChange = safeNumber(
      transactionAnalytics.savingsRate - lastMonthAnalytics.savingsRate
    );

    return {
      current: transactionAnalytics,
      previous: {
        ...lastMonthAnalytics,
        savingsRate: safeNumber(lastMonthAnalytics.savingsRate),
      },
      incomeChange,
      expenseChange,
      savingsRateChange,
    };
  };

  const comparativeData = getComparativeData();

  // Cash flow forecast with safe values
  const getCashFlowForecast = () => {
    const dailyAvgSpending = safeNumber(transactionAnalytics.avgDailyExpense);
    const daysRemaining = Math.max(0, 30 - new Date().getDate());
    const forecast = safeNumber(
      transactionAnalytics.netSavings - dailyAvgSpending * daysRemaining
    );

    return {
      dailyAvg: dailyAvgSpending,
      daysRemaining,
      forecast,
      status:
        forecast > 100000 ? "safe" : forecast > -100000 ? "warning" : "danger",
    };
  };

  const cashFlowForecast = getCashFlowForecast();

  // Type-safe category benchmarks
  type CategoryPercentages = {
    [key: string]: number;
  };

  type BenchmarkItem = {
    category: string;
    yourPercentage: number;
    avgPercentage: number;
    difference: number;
    status: "above" | "below" | "normal";
  };

  const getCategoryBenchmarks = (): BenchmarkItem[] => {
    const averagePercentages: CategoryPercentages = {
      Makanan: 30,
      Transportasi: 20,
      Belanja: 15,
      Hiburan: 10,
      Tagihan: 15,
      Lainnya: 10,
    };

    return transactionAnalytics.topCategories.map(
      ([category, amount]): BenchmarkItem => {
        const yourPercentage = getSafePercentage(
          amount,
          transactionAnalytics.totalExpense
        );
        const avgPercentage = averagePercentages[category] || 15;
        const difference = safeNumber(yourPercentage - avgPercentage);

        let status: "above" | "below" | "normal";
        if (difference > 5) {
          status = "above";
        } else if (difference < -5) {
          status = "below";
        } else {
          status = "normal";
        }

        return {
          category,
          yourPercentage,
          avgPercentage,
          difference,
          status,
        };
      }
    );
  };

  const categoryBenchmarks = getCategoryBenchmarks();

  // Quick wins analysis
  type QuickWin = {
    icon: SafeIconName;
    title: string;
    description: string;
    tip: string;
    potential: number;
  };

  const getQuickWins = (): QuickWin[] => {
    const wins: QuickWin[] = [];

    // Check for food delivery spending
    const foodSpending = transactionAnalytics.topCategories.find(
      ([cat]) => cat === "Makanan"
    );
    if (foodSpending && foodSpending[1] > 1000000) {
      const potentialSavings = safeNumber(Math.round(foodSpending[1] * 0.3));
      wins.push({
        icon: "restaurant-outline",
        title: "Pengeluaran Makan",
        description: `Rp ${(foodSpending[1] / 1000000).toFixed(1)}jt/bulan`,
        tip: `Masak 3x/minggu bisa hemat Rp ${(potentialSavings / 1000).toFixed(
          0
        )}rb`,
        potential: potentialSavings,
      });
    }

    // Check subscriptions
    const subscriptionCount = state.transactions.filter(
      (t) =>
        t.category === "Hiburan" &&
        t.description.toLowerCase().includes("langganan")
    ).length;

    if (subscriptionCount > 2) {
      const potentialSavings = safeNumber(150000 * subscriptionCount);
      wins.push({
        icon: "play-circle-outline",
        title: "Langganan Streaming",
        description: `${subscriptionCount} layanan aktif`,
        tip: `Rotasi layanan bisa hemat Rp ${(potentialSavings / 1000).toFixed(
          0
        )}rb/bulan`,
        potential: potentialSavings,
      });
    }

    return wins.slice(0, 3);
  };

  const quickWins = getQuickWins();

  // Budget optimization suggestions
  type BudgetSuggestion = {
    message: string;
    totalOver: number;
    suggestion: string;
  } | null;

  const getBudgetSuggestions = (): BudgetSuggestion => {
    if (
      !budgetAnalytics.budgetsAtRisk ||
      budgetAnalytics.budgetsAtRisk.length === 0
    )
      return null;

    const totalOver = budgetAnalytics.budgetsAtRisk.reduce((sum, b) => {
      const over = safeNumber(b.spent) - safeNumber(b.limit);
      return over > 0 ? sum + over : sum;
    }, 0);

    if (totalOver === 0) return null;

    return {
      message: `${budgetAnalytics.budgetsAtRisk.length} anggaran melebihi limit`,
      totalOver,
      suggestion: "Tinjau ulang limit anggaran atau kurangi pengeluaran",
    };
  };

  const budgetSuggestion = getBudgetSuggestions();

  // Export function
  const handleExport = async () => {
    try {
      const summary = `
📊 LAPORAN KEUANGAN - ${getCurrentMonth()}

PEMASUKAN: ${formatCurrency(transactionAnalytics.totalIncome)}
PENGELUARAN: ${formatCurrency(transactionAnalytics.totalExpense)}
TABUNGAN BERSIH: ${formatCurrency(transactionAnalytics.netSavings)}
RASIO TABUNGAN: ${safeNumber(transactionAnalytics.savingsRate).toFixed(1)}%

📈 TREN: ${comparativeData.incomeChange >= 0 ? "+" : ""}${formatCurrency(
        comparativeData.incomeChange
      )} vs bulan lalu
${comparativeData.savingsRateChange >= 0 ? "✅" : "⚠️"} Rasio tabungan ${
        comparativeData.savingsRateChange >= 0 ? "naik" : "turun"
      } ${Math.abs(safeNumber(comparativeData.savingsRateChange)).toFixed(1)}%

💡 INSIGHT: ${insights[0]?.message || "Keuangan dalam kondisi stabil"}

#MyMoney #KeuanganSehat
      `.trim();

      const fileUri =
        FileSystem.documentDirectory +
        `laporan-${new Date().toISOString().slice(0, 10)}.txt`;
      await FileSystem.writeAsStringAsync(fileUri, summary, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: "text/plain",
        dialogTitle: "Bagikan Laporan Keuangan",
      });
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Error", "Gagal mengekspor laporan");
    }
  };

  // Format change indicator
  const formatChange = (value: number, isPercent = false) => {
    const safeValue = safeNumber(value);
    const absValue = Math.abs(safeValue);
    const prefix = safeValue >= 0 ? "+" : "-";

    if (isPercent) {
      return `${prefix}${absValue.toFixed(1)}%`;
    }

    if (absValue >= 1000000) {
      return `${prefix}Rp ${(absValue / 1000000).toFixed(1)}jt`;
    }

    if (absValue >= 1000) {
      return `${prefix}Rp ${(absValue / 1000).toFixed(0)}rb`;
    }

    return `${prefix}Rp ${absValue}`;
  };

  // Render category benchmark item
  const renderBenchmarkItem = (item: BenchmarkItem) => (
    <View key={item.category} style={tw`mb-3`}>
      <View style={tw`flex-row justify-between items-center mb-1`}>
        <Text style={tw`text-sm font-medium text-gray-900`}>
          {item.category}
        </Text>
        <View style={tw`flex-row items-center`}>
          <Text style={tw`text-sm text-gray-900 mr-2`}>
            {item.yourPercentage.toFixed(0)}%
          </Text>
          <View
            style={[
              tw`px-2 py-1 rounded-full`,
              item.status === "above" && tw`bg-red-100`,
              item.status === "below" && tw`bg-emerald-100`,
              item.status === "normal" && tw`bg-gray-100`,
            ]}
          >
            <Text
              style={[
                tw`text-xs font-medium`,
                item.status === "above" && tw`text-red-600`,
                item.status === "below" && tw`text-emerald-600`,
                item.status === "normal" && tw`text-gray-600`,
              ]}
            >
              {item.status === "above"
                ? "↑ Tinggi"
                : item.status === "below"
                ? "↓ Rendah"
                : "Normal"}
            </Text>
          </View>
        </View>
      </View>
      <View style={tw`flex-row items-center`}>
        <View style={tw`flex-1 h-2 bg-gray-200 rounded-full overflow-hidden`}>
          <View
            style={[
              tw`h-full rounded-full`,
              { width: `${Math.min(item.yourPercentage, 100)}%` },
              item.status === "above" && tw`bg-red-500`,
              item.status === "below" && tw`bg-emerald-500`,
              item.status === "normal" && tw`bg-gray-400`,
            ]}
          />
        </View>
        <Text style={tw`text-xs text-gray-400 ml-2`}>
          Rata-rata: {item.avgPercentage}%
        </Text>
      </View>
    </View>
  );

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {/* Header Minimalis */}
      <View style={tw`px-4 pt-3 pb-4 bg-white border-b border-gray-200`}>
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <View>
            <Text style={tw`text-2xl font-bold text-gray-900`}>Analitik</Text>
            <Text style={tw`text-sm text-gray-600 mt-0.5`}>
              {getCurrentMonth()}
            </Text>
          </View>
          <TouchableOpacity
            style={tw`w-10 h-10 rounded-full bg-indigo-100 justify-center items-center`}
            onPress={handleExport}
          >
            <Ionicons name="share-outline" size={20} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* Time Range Tabs */}
        <View style={tw`flex-row gap-2`}>
          {[
            { key: "week", label: "Minggu" },
            { key: "month", label: "Bulan" },
            { key: "year", label: "Tahun" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                tw`px-4 py-2 rounded-full`,
                timeRange === tab.key ? tw`bg-indigo-600` : tw`bg-gray-100`,
              ]}
              onPress={() => setTimeRange(tab.key as any)}
            >
              <Text
                style={[
                  tw`text-sm font-medium`,
                  timeRange === tab.key ? tw`text-white` : tw`text-gray-700`,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Main Tabs */}
      <View style={tw`bg-white border-b border-gray-200`}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tw`px-4 py-2 flex-row gap-2`}
        >
          {[
            {
              key: "summary",
              label: "Ringkasan",
              icon: "stats-chart-outline" as SafeIconName,
            },
            {
              key: "trends",
              label: "Tren",
              icon: "trending-up-outline" as SafeIconName,
            },
            {
              key: "categories",
              label: "Kategori",
              icon: "pricetags-outline" as SafeIconName,
            },
            {
              key: "insights",
              label: "Tips",
              icon: "bulb-outline" as SafeIconName,
            },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                tw`px-4 py-2 rounded-full flex-row items-center`,
                activeTab === tab.key ? tw`bg-indigo-100` : tw`bg-gray-100`,
              ]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={activeTab === tab.key ? "#4F46E5" : "#6B7280"}
              />
              <Text
                style={[
                  tw`ml-2 text-sm font-medium`,
                  activeTab === tab.key
                    ? tw`text-indigo-600`
                    : tw`text-gray-700`,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-4 pb-8`}>
        {/* Summary Tab */}
        {activeTab === "summary" && (
          <>
            {/* Main Stats Card */}
            <View
              style={tw`bg-white rounded-xl p-4 mb-4 border border-gray-200`}
            >
              <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text style={tw`text-lg font-semibold text-gray-900`}>
                  Ringkasan {timeRange}
                </Text>
                <View style={tw`px-3 py-1 bg-indigo-50 rounded-full`}>
                  <Text style={tw`text-xs font-medium text-indigo-600`}>
                    vs bulan lalu:{" "}
                    {formatChange(comparativeData.savingsRateChange, true)}
                  </Text>
                </View>
              </View>

              <View style={tw`flex-row justify-between mb-6`}>
                <View style={tw`items-center flex-1`}>
                  <Text style={tw`text-gray-600 text-xs mb-1`}>Pemasukan</Text>
                  <Text style={tw`text-lg font-bold text-emerald-600`}>
                    {formatCurrency(transactionAnalytics.totalIncome)}
                  </Text>
                  <Text
                    style={tw`text-xs ${
                      comparativeData.incomeChange >= 0
                        ? "text-emerald-500"
                        : "text-red-500"
                    }`}
                  >
                    {formatChange(comparativeData.incomeChange)}
                  </Text>
                </View>

                <View style={tw`w-px h-12 bg-gray-200`} />

                <View style={tw`items-center flex-1`}>
                  <Text style={tw`text-gray-600 text-xs mb-1`}>
                    Pengeluaran
                  </Text>
                  <Text style={tw`text-lg font-bold text-red-600`}>
                    {formatCurrency(transactionAnalytics.totalExpense)}
                  </Text>
                  <Text
                    style={tw`text-xs ${
                      comparativeData.expenseChange >= 0
                        ? "text-red-500"
                        : "text-emerald-500"
                    }`}
                  >
                    {formatChange(comparativeData.expenseChange)}
                  </Text>
                </View>
              </View>

              {/* Savings Rate Progress */}
              <View style={tw`mb-4`}>
                <View style={tw`flex-row justify-between items-center mb-2`}>
                  <Text style={tw`text-gray-700 text-sm font-medium`}>
                    Rasio Tabungan
                  </Text>
                  <Text style={tw`text-lg font-bold text-indigo-600`}>
                    {transactionAnalytics.savingsRate.toFixed(1)}%
                  </Text>
                </View>
                <ProgressBar
                  progress={Math.max(
                    0,
                    Math.min(
                      safeNumber(transactionAnalytics.savingsRate) / 100,
                      1
                    )
                  )}
                  color={
                    transactionAnalytics.savingsRate >= 20
                      ? "#10B981"
                      : transactionAnalytics.savingsRate >= 10
                      ? "#F59E0B"
                      : "#EF4444"
                  }
                  style={tw`h-2 rounded-full`}
                />
                <View style={tw`flex-row justify-between mt-1`}>
                  <Text style={tw`text-xs text-gray-400`}>0% (Defisit)</Text>
                  <Text style={tw`text-xs text-gray-400`}>20% (Sehat)</Text>
                  <Text style={tw`text-xs text-gray-400`}>100%</Text>
                </View>
              </View>

              {/* Cash Flow Forecast */}
              {cashFlowForecast.daysRemaining > 0 && (
                <View
                  style={tw`mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200`}
                >
                  <View style={tw`flex-row items-center mb-2`}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color="#6B7280"
                    />
                    <Text style={tw`text-sm font-medium text-gray-700 ml-2`}>
                      Proyeksi Akhir Bulan
                    </Text>
                  </View>
                  <Text
                    style={tw`text-lg font-bold ${
                      cashFlowForecast.status === "safe"
                        ? "text-emerald-600"
                        : cashFlowForecast.status === "warning"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(cashFlowForecast.forecast)}
                  </Text>
                  <Text style={tw`text-xs text-gray-600 mt-1`}>
                    {cashFlowForecast.daysRemaining} hari lagi, rata-rata{" "}
                    {formatCurrency(cashFlowForecast.dailyAvg)}/hari
                  </Text>
                </View>
              )}
            </View>

            {/* Quick Stats */}
            <View style={tw`flex-row gap-3 mb-4`}>
              <View
                style={tw`flex-1 bg-white p-3 rounded-xl border border-gray-200`}
              >
                <Text style={tw`text-gray-600 text-xs mb-1`}>Transaksi</Text>
                <Text style={tw`text-lg font-bold text-gray-900`}>
                  {transactionAnalytics.transactionCount}
                </Text>
                <Text style={tw`text-xs text-gray-500`}>
                  {transactionAnalytics.incomeTransactionCount} masuk,{" "}
                  {transactionAnalytics.expenseTransactionCount} keluar
                </Text>
              </View>

              <View
                style={tw`flex-1 bg-white p-3 rounded-xl border border-gray-200`}
              >
                <Text style={tw`text-gray-600 text-xs mb-1`}>Anggaran</Text>
                <Text style={tw`text-lg font-bold text-gray-900`}>
                  {budgetAnalytics.overBudgetCount}
                </Text>
                <Text style={tw`text-xs text-gray-500`}>
                  {budgetAnalytics.overBudgetCount > 0
                    ? "Melebihi limit"
                    : "Semua aman"}
                </Text>
              </View>

              <View
                style={tw`flex-1 bg-white p-3 rounded-xl border border-gray-200`}
              >
                <Text style={tw`text-gray-600 text-xs mb-1`}>Tabungan</Text>
                <Text style={tw`text-lg font-bold text-gray-900`}>
                  {savingsAnalytics.completedSavings}/
                  {savingsAnalytics.activeSavings +
                    savingsAnalytics.completedSavings}
                </Text>
                <Text style={tw`text-xs text-gray-500`}>
                  {savingsAnalytics.overallProgress.toFixed(0)}% tercapai
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Trends Tab */}
        {activeTab === "trends" && (
          <View style={tw`bg-white rounded-xl p-4 border border-gray-200`}>
            <Text style={tw`text-lg font-semibold text-gray-900 mb-4`}>
              Tren {timeRange}
            </Text>

            <View>
              {/* Spending Trend */}
              <View style={tw`mb-4`}>
                <View style={tw`flex-row justify-between items-center mb-2`}>
                  <Text style={tw`text-sm font-medium text-gray-900`}>
                    Pengeluaran
                  </Text>
                  <Text
                    style={tw`text-sm ${
                      comparativeData.expenseChange >= 0
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {comparativeData.expenseChange >= 0 ? "Naik" : "Turun"}{" "}
                    {formatChange(Math.abs(comparativeData.expenseChange))}
                  </Text>
                </View>
                <ProgressBar
                  progress={Math.max(
                    0,
                    Math.min(
                      safeNumber(transactionAnalytics.totalExpense) /
                        (safeNumber(transactionAnalytics.totalIncome) * 1.5 ||
                          1),
                      1
                    )
                  )}
                  color="#EF4444"
                  style={tw`h-2 rounded-full`}
                />
              </View>

              {/* Income Trend */}
              <View style={tw`mb-4`}>
                <View style={tw`flex-row justify-between items-center mb-2`}>
                  <Text style={tw`text-sm font-medium text-gray-900`}>
                    Pemasukan
                  </Text>
                  <Text
                    style={tw`text-sm ${
                      comparativeData.incomeChange >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {comparativeData.incomeChange >= 0 ? "Naik" : "Turun"}{" "}
                    {formatChange(Math.abs(comparativeData.incomeChange))}
                  </Text>
                </View>
                <ProgressBar
                  progress={Math.max(
                    0,
                    Math.min(
                      safeNumber(transactionAnalytics.totalIncome) /
                        (safeNumber(comparativeData.previous.totalIncome) *
                          1.3 || 1),
                      1
                    )
                  )}
                  color="#10B981"
                  style={tw`h-2 rounded-full`}
                />
              </View>

              {/* Savings Rate Trend */}
              <View>
                <View style={tw`flex-row justify-between items-center mb-2`}>
                  <Text style={tw`text-sm font-medium text-gray-900`}>
                    Rasio Tabungan
                  </Text>
                  <Text
                    style={tw`text-sm ${
                      comparativeData.savingsRateChange >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {comparativeData.savingsRateChange >= 0
                      ? "Membaik"
                      : "Memburuk"}{" "}
                    {Math.abs(
                      safeNumber(comparativeData.savingsRateChange)
                    ).toFixed(1)}
                    %
                  </Text>
                </View>
                <ProgressBar
                  progress={Math.max(
                    0,
                    Math.min(
                      safeNumber(transactionAnalytics.savingsRate) / 100,
                      1
                    )
                  )}
                  color="#4F46E5"
                  style={tw`h-2 rounded-full`}
                />
                <View style={tw`flex-row justify-between mt-1`}>
                  <Text style={tw`text-xs text-gray-400`}>
                    Bulan lalu:{" "}
                    {safeNumber(comparativeData.previous.savingsRate).toFixed(
                      1
                    )}
                    %
                  </Text>
                  <Text style={tw`text-xs text-gray-400`}>
                    Sekarang:{" "}
                    {safeNumber(transactionAnalytics.savingsRate).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Daily Average */}
            <View style={tw`mt-6 p-3 bg-gray-50 rounded-lg`}>
              <Text style={tw`text-sm font-medium text-gray-900 mb-2`}>
                Rata-rata Harian
              </Text>
              <View style={tw`flex-row justify-between`}>
                <View style={tw`items-center flex-1`}>
                  <Text style={tw`text-xs text-gray-600`}>Pengeluaran</Text>
                  <Text style={tw`text-sm font-semibold text-red-600`}>
                    {formatCurrency(transactionAnalytics.avgDailyExpense)}
                  </Text>
                </View>
                <View style={tw`w-px h-8 bg-gray-300`} />
                <View style={tw`items-center flex-1`}>
                  <Text style={tw`text-xs text-gray-600`}>vs Rata-rata*</Text>
                  <Text
                    style={tw`text-sm font-semibold ${
                      transactionAnalytics.avgDailyExpense > 100000
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {transactionAnalytics.avgDailyExpense > 100000
                      ? "↑ Tinggi"
                      : "↓ Rendah"}
                  </Text>
                </View>
              </View>
              <Text style={tw`text-xs text-gray-400 mt-2`}>
                *Berdasarkan data pengguna di kota besar
              </Text>
            </View>
          </View>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <View style={tw`bg-white rounded-xl p-4 border border-gray-200`}>
            <Text style={tw`text-lg font-semibold text-gray-900 mb-4`}>
              Analisis Kategori
            </Text>

            {transactionAnalytics.topCategories.length > 0 ? (
              <>
                {categoryBenchmarks.slice(0, 5).map(renderBenchmarkItem)}

                <Divider style={tw`my-4`} />

                {/* Budget Optimization */}
                {budgetSuggestion && (
                  <View
                    style={tw`p-3 bg-amber-50 rounded-lg border border-amber-200`}
                  >
                    <View style={tw`flex-row items-start mb-2`}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={20}
                        color="#F59E0B"
                      />
                      <Text
                        style={tw`text-sm font-medium text-amber-900 ml-2 flex-1`}
                      >
                        {budgetSuggestion.message}
                      </Text>
                    </View>
                    <Text style={tw`text-amber-800 text-sm`}>
                      Total kelebihan:{" "}
                      {formatCurrency(budgetSuggestion.totalOver)}
                    </Text>
                    <Text style={tw`text-amber-700 text-xs mt-1`}>
                      💡 {budgetSuggestion.suggestion}
                    </Text>
                  </View>
                )}

                {/* Top Spending Alert */}
                {transactionAnalytics.topCategories[0] &&
                  safeNumber(transactionAnalytics.topCategories[0][1]) >
                    safeNumber(transactionAnalytics.totalExpense) * 0.4 && (
                    <View
                      style={tw`mt-3 p-3 bg-red-50 rounded-lg border border-red-200`}
                    >
                      <View style={tw`flex-row items-center mb-1`}>
                        <Ionicons
                          name="warning-outline"
                          size={16}
                          color="#DC2626"
                        />
                        <Text style={tw`text-sm font-medium text-red-900 ml-2`}>
                          Konsentrasi Pengeluaran Tinggi
                        </Text>
                      </View>
                      <Text style={tw`text-red-800 text-sm`}>
                        {transactionAnalytics.topCategories[0][0]} menghabiskan{" "}
                        {getSafePercentage(
                          transactionAnalytics.topCategories[0][1],
                          transactionAnalytics.totalExpense
                        ).toFixed(0)}
                        % dari total pengeluaran
                      </Text>
                    </View>
                  )}
              </>
            ) : (
              <View style={tw`items-center py-8`}>
                <Ionicons name="pricetags-outline" size={48} color="#9CA3AF" />
                <Text style={tw`text-gray-900 text-base font-medium mt-4 mb-2`}>
                  Belum ada data kategori
                </Text>
                <Text style={tw`text-gray-600 text-sm text-center`}>
                  Mulai catat transaksi untuk melihat analisis kategori
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Insights Tab */}
        {activeTab === "insights" && (
          <View style={tw`mb-4`}>
            {/* Financial Insights */}
            {insights.length > 0 && (
              <View style={tw`bg-white rounded-xl p-4 border border-gray-200`}>
                <Text style={tw`text-lg font-semibold text-gray-900 mb-4`}>
                  Insights Keuangan
                </Text>
                {insights.map((insight, index) => (
                  <View
                    key={index}
                    style={[
                      tw`p-3 rounded-lg mb-3`,
                      insight.type === "success" &&
                        tw`bg-emerald-50 border border-emerald-200`,
                      insight.type === "warning" &&
                        tw`bg-red-50 border border-red-200`,
                      insight.type === "info" &&
                        tw`bg-blue-50 border border-blue-200`,
                    ]}
                  >
                    <View style={tw`flex-row items-start`}>
                      <Ionicons
                        name={getSafeIcon(insight.icon)}
                        size={20}
                        color={
                          insight.type === "success"
                            ? "#10B981"
                            : insight.type === "warning"
                            ? "#DC2626"
                            : "#3B82F6"
                        }
                      />
                      <View style={tw`ml-3 flex-1`}>
                        <Text
                          style={[
                            tw`text-sm font-semibold mb-1`,
                            insight.type === "success" && tw`text-emerald-900`,
                            insight.type === "warning" && tw`text-red-900`,
                            insight.type === "info" && tw`text-blue-900`,
                          ]}
                        >
                          {insight.title}
                        </Text>
                        <Text
                          style={[
                            tw`text-sm`,
                            insight.type === "success" && tw`text-emerald-800`,
                            insight.type === "warning" && tw`text-red-800`,
                            insight.type === "info" && tw`text-blue-800`,
                          ]}
                        >
                          {insight.message}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Quick Wins */}
            {quickWins.length > 0 && (
              <View style={tw`bg-white rounded-xl p-4 border border-gray-200`}>
                <Text style={tw`text-lg font-semibold text-gray-900 mb-4`}>
                  Quick Wins
                </Text>
                {quickWins.map((win, index) => (
                  <TouchableOpacity
                    key={index}
                    style={tw`p-3 bg-gray-50 rounded-lg mb-3 border border-gray-200`}
                    activeOpacity={0.7}
                  >
                    <View style={tw`flex-row items-start`}>
                      <View
                        style={tw`w-10 h-10 rounded-lg bg-indigo-100 justify-center items-center mr-3`}
                      >
                        <Ionicons name={win.icon} size={20} color="#4F46E5" />
                      </View>
                      <View style={tw`flex-1`}>
                        <Text
                          style={tw`text-sm font-semibold text-gray-900 mb-1`}
                        >
                          {win.title}
                        </Text>
                        <Text style={tw`text-sm text-gray-600 mb-2`}>
                          {win.description}
                        </Text>
                        <View style={tw`flex-row items-center justify-between`}>
                          <Text
                            style={tw`text-xs text-emerald-700 font-medium`}
                          >
                            💡 {win.tip}
                          </Text>
                          <Text
                            style={tw`text-xs font-semibold text-emerald-600`}
                          >
                            Potensi +{formatCurrency(win.potential)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Tips Card */}
            <View style={tw`bg-white rounded-xl p-4 border border-gray-200`}>
              <Text style={tw`text-lg font-semibold text-gray-900 mb-4`}>
                Tips Harian
              </Text>

              <View>
                <View style={tw`flex-row items-start`}>
                  <View
                    style={tw`w-6 h-6 rounded-full bg-indigo-100 justify-center items-center mr-3 mt-0.5`}
                  >
                    <Text style={tw`text-xs font-bold text-indigo-600`}>1</Text>
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-sm font-medium text-gray-900`}>
                      Review Mingguan
                    </Text>
                    <Text style={tw`text-sm text-gray-600`}>
                      Luangkan 10 menit setiap Minggu malam untuk review
                      pengeluaran minggu ini
                    </Text>
                  </View>
                </View>

                <View style={tw`flex-row items-start`}>
                  <View
                    style={tw`w-6 h-6 rounded-full bg-emerald-100 justify-center items-center mr-3 mt-0.5`}
                  >
                    <Text style={tw`text-xs font-bold text-emerald-600`}>
                      2
                    </Text>
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-sm font-medium text-gray-900`}>
                      Auto-Saving
                    </Text>
                    <Text style={tw`text-sm text-gray-600`}>
                      Set up auto-transfer 10% gaji ke rekening tabungan setiap
                      tanggal gajian
                    </Text>
                  </View>
                </View>

                <View style={tw`flex-row items-start`}>
                  <View
                    style={tw`w-6 h-6 rounded-full bg-amber-100 justify-center items-center mr-3 mt-0.5`}
                  >
                    <Text style={tw`text-xs font-bold text-amber-600`}>3</Text>
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-sm font-medium text-gray-900`}>
                      Cash-Only Weekend
                    </Text>
                    <Text style={tw`text-sm text-gray-600`}>
                      Coba metode cash-only untuk pengeluaran weekend, terbukti
                      kurangi impulse buying 30%
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={tw`mt-4`}>
          <Text style={tw`text-sm font-medium text-gray-900 mb-3`}>
            Aksi Cepat
          </Text>
          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity
              style={tw`flex-1 bg-white p-3 rounded-xl border border-gray-200 items-center`}
              onPress={() => navigation.navigate("AddTransaction")}
            >
              <Ionicons name="add-circle-outline" size={24} color="#4F46E5" />
              <Text style={tw`text-xs font-medium text-gray-900 mt-2`}>
                Transaksi Baru
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`flex-1 bg-white p-3 rounded-xl border border-gray-200 items-center`}
              onPress={() => navigation.navigate("Budget")}
            >
              <Ionicons name="pie-chart-outline" size={24} color="#8B5CF6" />
              <Text style={tw`text-xs font-medium text-gray-900 mt-2`}>
                Cek Anggaran
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`flex-1 bg-white p-3 rounded-xl border border-gray-200 items-center`}
              onPress={() => navigation.navigate("Savings")}
            >
              <Ionicons name="wallet-outline" size={24} color="#EC4899" />
              <Text style={tw`text-xs font-medium text-gray-900 mt-2`}>
                Progress Tabungan
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default AnalyticsScreen;
