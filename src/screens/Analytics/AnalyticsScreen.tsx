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
import { Colors } from "../../theme/theme";

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
        <Text
          style={tw.style(`text-sm font-medium`, { color: Colors.textPrimary })}
        >
          {item.category}
        </Text>
        <View style={tw`flex-row items-center`}>
          <Text style={tw.style(`text-sm mr-2`, { color: Colors.textPrimary })}>
            {item.yourPercentage.toFixed(0)}%
          </Text>
          <View
            style={[
              tw`px-2 py-1 rounded-full`,
              item.status === "above" && {
                backgroundColor: `${Colors.error}20`,
              },
              item.status === "below" && {
                backgroundColor: `${Colors.success}20`,
              },
              item.status === "normal" && {
                backgroundColor: Colors.surfaceLight,
              },
            ]}
          >
            <Text
              style={[
                tw`text-xs font-medium`,
                item.status === "above" && { color: Colors.error },
                item.status === "below" && { color: Colors.success },
                item.status === "normal" && { color: Colors.textSecondary },
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
        <View
          style={tw.style(`flex-1 h-2 rounded-full overflow-hidden`, {
            backgroundColor: Colors.surfaceLight,
          })}
        >
          <View
            style={[
              {
                width: `${Math.min(item.yourPercentage, 100)}%`,
                height: "100%",
                borderRadius: 9999,
              },
              item.status === "above" && { backgroundColor: Colors.error },
              item.status === "below" && { backgroundColor: Colors.success },
              item.status === "normal" && { backgroundColor: Colors.info },
            ]}
          />
        </View>
        <Text style={tw.style(`text-xs ml-2`, { color: Colors.textTertiary })}>
          Rata-rata: {item.avgPercentage}%
        </Text>
      </View>
    </View>
  );

  return (
    <View style={tw.style(`flex-1`, { backgroundColor: Colors.background })}>
      {/* Header Minimalis */}
      <View
        style={tw.style(`px-4 pt-3 pb-4 border-b`, {
          backgroundColor: Colors.surface,
          borderColor: Colors.border,
        })}
      >
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <View>
            <Text
              style={tw.style(`text-2xl font-bold`, {
                color: Colors.textPrimary,
              })}
            >
              Analitik
            </Text>
            <Text
              style={tw.style(`text-sm mt-0.5`, {
                color: Colors.textSecondary,
              })}
            >
              {getCurrentMonth()}
            </Text>
          </View>
          <TouchableOpacity
            style={tw.style(
              `w-10 h-10 rounded-full justify-center items-center`,
              {
                backgroundColor: `${Colors.accent}20`,
              }
            )}
            onPress={handleExport}
          >
            <Ionicons name="share-outline" size={20} color={Colors.accent} />
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
                timeRange === tab.key
                  ? { backgroundColor: Colors.accent }
                  : { backgroundColor: Colors.surfaceLight },
              ]}
              onPress={() => setTimeRange(tab.key as any)}
            >
              <Text
                style={[
                  tw`text-sm font-medium`,
                  timeRange === tab.key
                    ? { color: Colors.textPrimary }
                    : { color: Colors.textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Main Tabs */}
      <View
        style={tw.style(`border-b`, {
          backgroundColor: Colors.surface,
          borderColor: Colors.border,
        })}
      >
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
                activeTab === tab.key
                  ? { backgroundColor: `${Colors.accent}20` }
                  : { backgroundColor: Colors.surfaceLight },
              ]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={
                  activeTab === tab.key ? Colors.accent : Colors.textSecondary
                }
              />
              <Text
                style={[
                  tw`ml-2 text-sm font-medium`,
                  activeTab === tab.key
                    ? { color: Colors.accent }
                    : { color: Colors.textSecondary },
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
              style={tw.style(`rounded-xl p-4 mb-4 border`, {
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              })}
            >
              <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text
                  style={tw.style(`text-lg font-semibold`, {
                    color: Colors.textPrimary,
                  })}
                >
                  Ringkasan {timeRange}
                </Text>
                <View
                  style={tw.style(`px-3 py-1 rounded-full`, {
                    backgroundColor: `${Colors.accent}20`,
                  })}
                >
                  <Text
                    style={tw.style(`text-xs font-medium`, {
                      color: Colors.accent,
                    })}
                  >
                    vs bulan lalu:{" "}
                    {formatChange(comparativeData.savingsRateChange, true)}
                  </Text>
                </View>
              </View>

              <View style={tw`flex-row justify-between mb-6`}>
                <View style={tw`items-center flex-1`}>
                  <Text
                    style={tw.style(`text-xs mb-1`, {
                      color: Colors.textSecondary,
                    })}
                  >
                    Pemasukan
                  </Text>
                  <Text
                    style={tw.style(`text-lg font-bold`, {
                      color: Colors.success,
                    })}
                  >
                    {formatCurrency(transactionAnalytics.totalIncome)}
                  </Text>
                  <Text
                    style={tw.style(
                      `text-xs`,
                      comparativeData.incomeChange >= 0
                        ? { color: Colors.success }
                        : { color: Colors.error }
                    )}
                  >
                    {formatChange(comparativeData.incomeChange)}
                  </Text>
                </View>

                <View
                  style={tw.style(`w-px h-12`, {
                    backgroundColor: Colors.border,
                  })}
                />

                <View style={tw`items-center flex-1`}>
                  <Text
                    style={tw.style(`text-xs mb-1`, {
                      color: Colors.textSecondary,
                    })}
                  >
                    Pengeluaran
                  </Text>
                  <Text
                    style={tw.style(`text-lg font-bold`, {
                      color: Colors.error,
                    })}
                  >
                    {formatCurrency(transactionAnalytics.totalExpense)}
                  </Text>
                  <Text
                    style={tw.style(
                      `text-xs`,
                      comparativeData.expenseChange >= 0
                        ? { color: Colors.error }
                        : { color: Colors.success }
                    )}
                  >
                    {formatChange(comparativeData.expenseChange)}
                  </Text>
                </View>
              </View>

              {/* Savings Rate Progress */}
              <View style={tw`mb-4`}>
                <View style={tw`flex-row justify-between items-center mb-2`}>
                  <Text
                    style={tw.style(`text-sm font-medium`, {
                      color: Colors.textPrimary,
                    })}
                  >
                    Rasio Tabungan
                  </Text>
                  <Text
                    style={tw.style(`text-lg font-bold`, {
                      color: Colors.accent,
                    })}
                  >
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
                      ? Colors.success
                      : transactionAnalytics.savingsRate >= 10
                      ? Colors.warning
                      : Colors.error
                  }
                  style={tw.style(`h-2 rounded-full`, {
                    backgroundColor: Colors.surfaceLight,
                  })}
                />
                <View style={tw`flex-row justify-between mt-1`}>
                  <Text
                    style={tw.style(`text-xs`, { color: Colors.textTertiary })}
                  >
                    0% (Defisit)
                  </Text>
                  <Text
                    style={tw.style(`text-xs`, { color: Colors.textTertiary })}
                  >
                    20% (Sehat)
                  </Text>
                  <Text
                    style={tw.style(`text-xs`, { color: Colors.textTertiary })}
                  >
                    100%
                  </Text>
                </View>
              </View>

              {/* Cash Flow Forecast */}
              {cashFlowForecast.daysRemaining > 0 && (
                <View
                  style={tw.style(`mt-4 p-3 rounded-lg border`, {
                    backgroundColor: Colors.surfaceLight,
                    borderColor: Colors.border,
                  })}
                >
                  <View style={tw`flex-row items-center mb-2`}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={Colors.textSecondary}
                    />
                    <Text
                      style={tw.style(`text-sm font-medium ml-2`, {
                        color: Colors.textPrimary,
                      })}
                    >
                      Proyeksi Akhir Bulan
                    </Text>
                  </View>
                  <Text
                    style={tw.style(
                      `text-lg font-bold`,
                      cashFlowForecast.status === "safe"
                        ? { color: Colors.success }
                        : cashFlowForecast.status === "warning"
                        ? { color: Colors.warning }
                        : { color: Colors.error }
                    )}
                  >
                    {formatCurrency(cashFlowForecast.forecast)}
                  </Text>
                  <Text
                    style={tw.style(`text-xs mt-1`, {
                      color: Colors.textSecondary,
                    })}
                  >
                    {cashFlowForecast.daysRemaining} hari lagi, rata-rata{" "}
                    {formatCurrency(cashFlowForecast.dailyAvg)}/hari
                  </Text>
                </View>
              )}
            </View>

            {/* Quick Stats */}
            <View style={tw`flex-row gap-3 mb-4`}>
              <View
                style={tw.style(`flex-1 p-3 rounded-xl border`, {
                  backgroundColor: Colors.surface,
                  borderColor: Colors.border,
                })}
              >
                <Text
                  style={tw.style(`text-xs mb-1`, {
                    color: Colors.textSecondary,
                  })}
                >
                  Transaksi
                </Text>
                <Text
                  style={tw.style(`text-lg font-bold`, {
                    color: Colors.textPrimary,
                  })}
                >
                  {transactionAnalytics.transactionCount}
                </Text>
                <Text
                  style={tw.style(`text-xs`, { color: Colors.textTertiary })}
                >
                  {transactionAnalytics.incomeTransactionCount} masuk,{" "}
                  {transactionAnalytics.expenseTransactionCount} keluar
                </Text>
              </View>

              <View
                style={tw.style(`flex-1 p-3 rounded-xl border`, {
                  backgroundColor: Colors.surface,
                  borderColor: Colors.border,
                })}
              >
                <Text
                  style={tw.style(`text-xs mb-1`, {
                    color: Colors.textSecondary,
                  })}
                >
                  Anggaran
                </Text>
                <Text
                  style={tw.style(`text-lg font-bold`, {
                    color: Colors.textPrimary,
                  })}
                >
                  {budgetAnalytics.overBudgetCount}
                </Text>
                <Text
                  style={tw.style(`text-xs`, { color: Colors.textTertiary })}
                >
                  {budgetAnalytics.overBudgetCount > 0
                    ? "Melebihi limit"
                    : "Semua aman"}
                </Text>
              </View>

              <View
                style={tw.style(`flex-1 p-3 rounded-xl border`, {
                  backgroundColor: Colors.surface,
                  borderColor: Colors.border,
                })}
              >
                <Text
                  style={tw.style(`text-xs mb-1`, {
                    color: Colors.textSecondary,
                  })}
                >
                  Tabungan
                </Text>
                <Text
                  style={tw.style(`text-lg font-bold`, {
                    color: Colors.textPrimary,
                  })}
                >
                  {savingsAnalytics.completedSavings}/
                  {savingsAnalytics.activeSavings +
                    savingsAnalytics.completedSavings}
                </Text>
                <Text
                  style={tw.style(`text-xs`, { color: Colors.textTertiary })}
                >
                  {savingsAnalytics.overallProgress.toFixed(0)}% tercapai
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Trends Tab */}
        {activeTab === "trends" && (
          <View
            style={tw.style(`rounded-xl p-4 border`, {
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            })}
          >
            <Text
              style={tw.style(`text-lg font-semibold mb-4`, {
                color: Colors.textPrimary,
              })}
            >
              Tren {timeRange}
            </Text>

            <View>
              {/* Spending Trend */}
              <View style={tw`mb-4`}>
                <View style={tw`flex-row justify-between items-center mb-2`}>
                  <Text
                    style={tw.style(`text-sm font-medium`, {
                      color: Colors.textPrimary,
                    })}
                  >
                    Pengeluaran
                  </Text>
                  <Text
                    style={tw.style(
                      `text-sm`,
                      comparativeData.expenseChange >= 0
                        ? { color: Colors.error }
                        : { color: Colors.success }
                    )}
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
                  color={Colors.error}
                  style={tw.style(`h-2 rounded-full`, {
                    backgroundColor: Colors.surfaceLight,
                  })}
                />
              </View>

              {/* Income Trend */}
              <View style={tw`mb-4`}>
                <View style={tw`flex-row justify-between items-center mb-2`}>
                  <Text
                    style={tw.style(`text-sm font-medium`, {
                      color: Colors.textPrimary,
                    })}
                  >
                    Pemasukan
                  </Text>
                  <Text
                    style={tw.style(
                      `text-sm`,
                      comparativeData.incomeChange >= 0
                        ? { color: Colors.success }
                        : { color: Colors.error }
                    )}
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
                  color={Colors.success}
                  style={tw.style(`h-2 rounded-full`, {
                    backgroundColor: Colors.surfaceLight,
                  })}
                />
              </View>

              {/* Savings Rate Trend */}
              <View>
                <View style={tw`flex-row justify-between items-center mb-2`}>
                  <Text
                    style={tw.style(`text-sm font-medium`, {
                      color: Colors.textPrimary,
                    })}
                  >
                    Rasio Tabungan
                  </Text>
                  <Text
                    style={tw.style(
                      `text-sm`,
                      comparativeData.savingsRateChange >= 0
                        ? { color: Colors.success }
                        : { color: Colors.error }
                    )}
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
                  color={Colors.accent}
                  style={tw.style(`h-2 rounded-full`, {
                    backgroundColor: Colors.surfaceLight,
                  })}
                />
                <View style={tw`flex-row justify-between mt-1`}>
                  <Text
                    style={tw.style(`text-xs`, { color: Colors.textTertiary })}
                  >
                    Bulan lalu:{" "}
                    {safeNumber(comparativeData.previous.savingsRate).toFixed(
                      1
                    )}
                    %
                  </Text>
                  <Text
                    style={tw.style(`text-xs`, { color: Colors.textTertiary })}
                  >
                    Sekarang:{" "}
                    {safeNumber(transactionAnalytics.savingsRate).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Daily Average */}
            <View
              style={tw.style(`mt-6 p-3 rounded-lg`, {
                backgroundColor: Colors.surfaceLight,
              })}
            >
              <Text
                style={tw.style(`text-sm font-medium mb-2`, {
                  color: Colors.textPrimary,
                })}
              >
                Rata-rata Harian
              </Text>
              <View style={tw`flex-row justify-between`}>
                <View style={tw`items-center flex-1`}>
                  <Text
                    style={tw.style(`text-xs`, { color: Colors.textSecondary })}
                  >
                    Pengeluaran
                  </Text>
                  <Text
                    style={tw.style(`text-sm font-semibold`, {
                      color: Colors.error,
                    })}
                  >
                    {formatCurrency(transactionAnalytics.avgDailyExpense)}
                  </Text>
                </View>
                <View
                  style={tw.style(`w-px h-8`, {
                    backgroundColor: Colors.border,
                  })}
                />
                <View style={tw`items-center flex-1`}>
                  <Text
                    style={tw.style(`text-xs`, { color: Colors.textSecondary })}
                  >
                    vs Rata-rata*
                  </Text>
                  <Text
                    style={tw.style(
                      `text-sm font-semibold`,
                      transactionAnalytics.avgDailyExpense > 100000
                        ? { color: Colors.error }
                        : { color: Colors.success }
                    )}
                  >
                    {transactionAnalytics.avgDailyExpense > 100000
                      ? "↑ Tinggi"
                      : "↓ Rendah"}
                  </Text>
                </View>
              </View>
              <Text
                style={tw.style(`text-xs mt-2`, { color: Colors.textTertiary })}
              >
                *Berdasarkan data pengguna di kota besar
              </Text>
            </View>
          </View>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <View
            style={tw.style(`rounded-xl p-4 border`, {
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            })}
          >
            <Text
              style={tw.style(`text-lg font-semibold mb-4`, {
                color: Colors.textPrimary,
              })}
            >
              Analisis Kategori
            </Text>

            {transactionAnalytics.topCategories.length > 0 ? (
              <>
                {categoryBenchmarks.slice(0, 5).map(renderBenchmarkItem)}

                <Divider
                  style={tw.style(`my-4`, { backgroundColor: Colors.border })}
                />

                {/* Budget Optimization */}
                {budgetSuggestion && (
                  <View
                    style={tw.style(`p-3 rounded-lg border`, {
                      backgroundColor: `${Colors.warning}10`,
                      borderColor: `${Colors.warning}30`,
                    })}
                  >
                    <View style={tw`flex-row items-start mb-2`}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={20}
                        color={Colors.warning}
                      />
                      <Text
                        style={tw.style(`text-sm font-medium ml-2 flex-1`, {
                          color: Colors.warning,
                        })}
                      >
                        {budgetSuggestion.message}
                      </Text>
                    </View>
                    <Text
                      style={tw.style(`text-sm`, { color: Colors.warning })}
                    >
                      Total kelebihan:{" "}
                      {formatCurrency(budgetSuggestion.totalOver)}
                    </Text>
                    <Text
                      style={tw.style(`text-xs mt-1`, {
                        color: Colors.warningLight,
                      })}
                    >
                      💡 {budgetSuggestion.suggestion}
                    </Text>
                  </View>
                )}

                {/* Top Spending Alert */}
                {transactionAnalytics.topCategories[0] &&
                  safeNumber(transactionAnalytics.topCategories[0][1]) >
                    safeNumber(transactionAnalytics.totalExpense) * 0.4 && (
                    <View
                      style={tw.style(`mt-3 p-3 rounded-lg border`, {
                        backgroundColor: `${Colors.error}10`,
                        borderColor: `${Colors.error}30`,
                      })}
                    >
                      <View style={tw`flex-row items-center mb-1`}>
                        <Ionicons
                          name="warning-outline"
                          size={16}
                          color={Colors.error}
                        />
                        <Text
                          style={tw.style(`text-sm font-medium ml-2`, {
                            color: Colors.error,
                          })}
                        >
                          Konsentrasi Pengeluaran Tinggi
                        </Text>
                      </View>
                      <Text
                        style={tw.style(`text-sm`, { color: Colors.error })}
                      >
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
                <Ionicons
                  name="pricetags-outline"
                  size={48}
                  color={Colors.textTertiary}
                />
                <Text
                  style={tw.style(`text-base font-medium mt-4 mb-2`, {
                    color: Colors.textPrimary,
                  })}
                >
                  Belum ada data kategori
                </Text>
                <Text
                  style={tw.style(`text-sm text-center`, {
                    color: Colors.textSecondary,
                  })}
                >
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
              <View
                style={tw.style(`rounded-xl p-4 border`, {
                  backgroundColor: Colors.surface,
                  borderColor: Colors.border,
                })}
              >
                <Text
                  style={tw.style(`text-lg font-semibold mb-4`, {
                    color: Colors.textPrimary,
                  })}
                >
                  Insights Keuangan
                </Text>
                {insights.map((insight, index) => (
                  <View
                    key={index}
                    style={[
                      tw`p-3 rounded-lg mb-3`,
                      insight.type === "success" && {
                        backgroundColor: `${Colors.success}10`,
                        borderColor: `${Colors.success}30`,
                        borderWidth: 1,
                      },
                      insight.type === "warning" && {
                        backgroundColor: `${Colors.error}10`,
                        borderColor: `${Colors.error}30`,
                        borderWidth: 1,
                      },
                      insight.type === "info" && {
                        backgroundColor: `${Colors.info}10`,
                        borderColor: `${Colors.info}30`,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <View style={tw`flex-row items-start`}>
                      <Ionicons
                        name={getSafeIcon(insight.icon)}
                        size={20}
                        color={
                          insight.type === "success"
                            ? Colors.success
                            : insight.type === "warning"
                            ? Colors.error
                            : Colors.info
                        }
                      />
                      <View style={tw`ml-3 flex-1`}>
                        <Text
                          style={[
                            tw`text-sm font-semibold mb-1`,
                            insight.type === "success" && {
                              color: Colors.success,
                            },
                            insight.type === "warning" && {
                              color: Colors.error,
                            },
                            insight.type === "info" && { color: Colors.info },
                          ]}
                        >
                          {insight.title}
                        </Text>
                        <Text
                          style={[
                            tw`text-sm`,
                            insight.type === "success" && {
                              color: Colors.successLight,
                            },
                            insight.type === "warning" && {
                              color: Colors.errorLight,
                            },
                            insight.type === "info" && {
                              color: Colors.infoLight,
                            },
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
              <View
                style={tw.style(`rounded-xl p-4 border`, {
                  backgroundColor: Colors.surface,
                  borderColor: Colors.border,
                })}
              >
                <Text
                  style={tw.style(`text-lg font-semibold mb-4`, {
                    color: Colors.textPrimary,
                  })}
                >
                  Quick Wins
                </Text>
                {quickWins.map((win, index) => (
                  <TouchableOpacity
                    key={index}
                    style={tw.style(`p-3 rounded-lg mb-3 border`, {
                      backgroundColor: Colors.surfaceLight,
                      borderColor: Colors.border,
                    })}
                    activeOpacity={0.7}
                  >
                    <View style={tw`flex-row items-start`}>
                      <View
                        style={tw.style(
                          `w-10 h-10 rounded-lg justify-center items-center mr-3`,
                          {
                            backgroundColor: `${Colors.accent}20`,
                          }
                        )}
                      >
                        <Ionicons
                          name={win.icon}
                          size={20}
                          color={Colors.accent}
                        />
                      </View>
                      <View style={tw`flex-1`}>
                        <Text
                          style={tw.style(`text-sm font-semibold mb-1`, {
                            color: Colors.textPrimary,
                          })}
                        >
                          {win.title}
                        </Text>
                        <Text
                          style={tw.style(`text-sm mb-2`, {
                            color: Colors.textSecondary,
                          })}
                        >
                          {win.description}
                        </Text>
                        <View style={tw`flex-row items-center justify-between`}>
                          <Text
                            style={tw.style(`text-xs font-medium`, {
                              color: Colors.success,
                            })}
                          >
                            💡 {win.tip}
                          </Text>
                          <Text
                            style={tw.style(`text-xs font-semibold`, {
                              color: Colors.success,
                            })}
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
            <View
              style={tw.style(`rounded-xl p-4 border`, {
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              })}
            >
              <Text
                style={tw.style(`text-lg font-semibold mb-4`, {
                  color: Colors.textPrimary,
                })}
              >
                Tips Harian
              </Text>

              <View>
                <View style={tw`flex-row items-start`}>
                  <View
                    style={tw.style(
                      `w-6 h-6 rounded-full justify-center items-center mr-3 mt-0.5`,
                      {
                        backgroundColor: `${Colors.accent}20`,
                      }
                    )}
                  >
                    <Text
                      style={tw.style(`text-xs font-bold`, {
                        color: Colors.accent,
                      })}
                    >
                      1
                    </Text>
                  </View>
                  <View style={tw`flex-1`}>
                    <Text
                      style={tw.style(`text-sm font-medium`, {
                        color: Colors.textPrimary,
                      })}
                    >
                      Review Mingguan
                    </Text>
                    <Text
                      style={tw.style(`text-sm`, {
                        color: Colors.textSecondary,
                      })}
                    >
                      Luangkan 10 menit setiap Minggu malam untuk review
                      pengeluaran minggu ini
                    </Text>
                  </View>
                </View>

                <View style={tw`flex-row items-start`}>
                  <View
                    style={tw.style(
                      `w-6 h-6 rounded-full justify-center items-center mr-3 mt-0.5`,
                      {
                        backgroundColor: `${Colors.success}20`,
                      }
                    )}
                  >
                    <Text
                      style={tw.style(`text-xs font-bold`, {
                        color: Colors.success,
                      })}
                    >
                      2
                    </Text>
                  </View>
                  <View style={tw`flex-1`}>
                    <Text
                      style={tw.style(`text-sm font-medium`, {
                        color: Colors.textPrimary,
                      })}
                    >
                      Auto-Saving
                    </Text>
                    <Text
                      style={tw.style(`text-sm`, {
                        color: Colors.textSecondary,
                      })}
                    >
                      Set up auto-transfer 10% gaji ke rekening tabungan setiap
                      tanggal gajian
                    </Text>
                  </View>
                </View>

                <View style={tw`flex-row items-start`}>
                  <View
                    style={tw.style(
                      `w-6 h-6 rounded-full justify-center items-center mr-3 mt-0.5`,
                      {
                        backgroundColor: `${Colors.warning}20`,
                      }
                    )}
                  >
                    <Text
                      style={tw.style(`text-xs font-bold`, {
                        color: Colors.warning,
                      })}
                    >
                      3
                    </Text>
                  </View>
                  <View style={tw`flex-1`}>
                    <Text
                      style={tw.style(`text-sm font-medium`, {
                        color: Colors.textPrimary,
                      })}
                    >
                      Cash-Only Weekend
                    </Text>
                    <Text
                      style={tw.style(`text-sm`, {
                        color: Colors.textSecondary,
                      })}
                    >
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
          <Text
            style={tw.style(`text-sm font-medium mb-3`, {
              color: Colors.textPrimary,
            })}
          >
            Aksi Cepat
          </Text>
          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity
              style={tw.style(`flex-1 p-3 rounded-xl border items-center`, {
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              })}
              onPress={() => navigation.navigate("AddTransaction")}
            >
              <Ionicons
                name="add-circle-outline"
                size={24}
                color={Colors.accent}
              />
              <Text
                style={tw.style(`text-xs font-medium mt-2`, {
                  color: Colors.textPrimary,
                })}
              >
                Transaksi Baru
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw.style(`flex-1 p-3 rounded-xl border items-center`, {
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              })}
              onPress={() => navigation.navigate("Budget")}
            >
              <Ionicons
                name="pie-chart-outline"
                size={24}
                color={Colors.purple}
              />
              <Text
                style={tw.style(`text-xs font-medium mt-2`, {
                  color: Colors.textPrimary,
                })}
              >
                Cek Anggaran
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw.style(`flex-1 p-3 rounded-xl border items-center`, {
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              })}
              onPress={() => navigation.navigate("Savings")}
            >
              <Ionicons name="wallet-outline" size={24} color={Colors.pink} />
              <Text
                style={tw.style(`text-xs font-medium mt-2`, {
                  color: Colors.textPrimary,
                })}
              >
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
