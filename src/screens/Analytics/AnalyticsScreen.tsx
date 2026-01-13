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
  calculateFinancialHealthScore,
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
    "health" | "summary" | "trends" | "categories" | "insights"
  >("health");

  // Safe icon helper
  const getSafeIcon = (iconName: string): SafeIconName => {
    const defaultIcon: SafeIconName = "alert-circle-outline";
    if (iconName in Ionicons.glyphMap) {
      return iconName as SafeIconName;
    }
    return defaultIcon;
  };

  // ==================== CHECK IF HAS DATA ====================
  const hasData = useMemo(() => {
    return (
      state.transactions.length > 0 ||
      state.budgets.length > 0 ||
      state.savings.length > 0
    );
  }, [state]);

  // ==================== SAFE ANALYTICS CALCULATIONS ====================
  const transactionAnalytics = useMemo(() => {
    try {
      const analytics = calculateTransactionAnalytics(
        state.transactions || [],
        timeRange
      );

      return {
        ...analytics,
        totalIncome: safeNumber(analytics.totalIncome),
        totalExpense: safeNumber(analytics.totalExpense),
        netSavings: safeNumber(analytics.netSavings),
        savingsRate: safeNumber(analytics.savingsRate),
        avgDailyExpense: safeNumber(analytics.avgDailyExpense),
        transactionCount: analytics.transactionCount || 0,
        incomeTransactionCount: analytics.incomeTransactionCount || 0,
        expenseTransactionCount: analytics.expenseTransactionCount || 0,
        topCategories: analytics.topCategories || [],
        dailyTrends: analytics.dailyTrends || [],
      };
    } catch (error) {
      console.error("Error calculating transaction analytics:", error);
      return {
        totalIncome: 0,
        totalExpense: 0,
        netSavings: 0,
        savingsRate: 0,
        avgDailyExpense: 0,
        transactionCount: 0,
        incomeTransactionCount: 0,
        expenseTransactionCount: 0,
        topCategories: [],
        dailyTrends: [],
        timeRange,
        startDate: new Date(),
        endDate: new Date(),
      };
    }
  }, [state.transactions, timeRange]);

  const budgetAnalytics = useMemo(() => {
    try {
      return calculateBudgetAnalytics(state.budgets || []);
    } catch (error) {
      console.error("Error calculating budget analytics:", error);
      return {
        totalBudget: 0,
        totalSpent: 0,
        utilizationRate: 0,
        overBudgetCount: 0,
        underBudgetCount: 0,
        budgetsAtRisk: [],
      };
    }
  }, [state.budgets]);

  const savingsAnalytics = useMemo(() => {
    try {
      return calculateSavingsAnalytics(state.savings || []);
    } catch (error) {
      console.error("Error calculating savings analytics:", error);
      return {
        totalTarget: 0,
        totalCurrent: 0,
        overallProgress: 0,
        completedSavings: 0,
        activeSavings: 0,
        nearingCompletion: [],
      };
    }
  }, [state.savings]);

  // ==================== FINANCIAL HEALTH SCORE ====================
  const financialHealthScore = useMemo(() => {
    try {
      return calculateFinancialHealthScore(
        transactionAnalytics,
        budgetAnalytics,
        savingsAnalytics
      );
    } catch (error) {
      console.error("Error calculating health score:", error);
      return {
        overallScore: 0,
        category: "Belum Ada Data",
        color: Colors.gray500,
        factors: {
          savingsRate: { score: 0, weight: 0.3, status: "poor" },
          budgetAdherence: { score: 0, weight: 0.25, status: "poor" },
          emergencyFund: { score: 0, weight: 0.2, status: "poor" },
          expenseControl: { score: 0, weight: 0.15, status: "poor" },
          goalProgress: { score: 0, weight: 0.1, status: "poor" },
        },
        recommendations: [
          "Mulai dengan mencatat transaksi pertama Anda",
          "Buat anggaran sederhana untuk pengeluaran utama",
          "Tetapkan target tabungan kecil untuk memulai",
        ],
      };
    }
  }, [transactionAnalytics, budgetAnalytics, savingsAnalytics]);

  const insights = useMemo(() => {
    try {
      return generateFinancialInsights(
        transactionAnalytics,
        budgetAnalytics,
        savingsAnalytics
      );
    } catch (error) {
      console.error("Error generating insights:", error);
      return [
        {
          type: "info",
          title: "Data Dimuat",
          message: "Analitik keuangan Anda sedang diproses",
          icon: "information-circle",
          color: Colors.info,
        },
      ];
    }
  }, [transactionAnalytics, budgetAnalytics, savingsAnalytics]);

  // ==================== NO DATA SCREEN ====================
  if (!hasData) {
    return (
      <View style={tw.style(`flex-1`, { backgroundColor: Colors.background })}>
        {/* Header Minimalis */}
        <View
          style={tw.style(`px-4 pt-3 pb-4 border-b`, {
            backgroundColor: Colors.surface,
            borderColor: Colors.border,
          })}
        >
          <View style={tw`flex-row justify-between items-center`}>
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
          </View>
        </View>

        {/* No Data Content - DIPERBAIKI: Gunakan ScrollView dengan contentContainerStyle yang benar */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`py-6 px-6`} // DIPERBAIKI: tambah px-6
        >
          <View style={tw`items-center`}>
            <Ionicons
              name="analytics-outline"
              size={80}
              color={Colors.gray500}
              style={tw`mb-6`}
            />

            <Text
              style={tw.style(`text-xl font-bold mb-3 text-center`, {
                color: Colors.textPrimary,
              })}
            >
              Belum Ada Data Keuangan
            </Text>

            <Text
              style={tw.style(`text-base text-center mb-6`, {
                color: Colors.textSecondary,
              })}
            >
              Mulai catat transaksi, buat anggaran, atau tambah target tabungan
              untuk melihat analitik kesehatan keuangan Anda.
            </Text>

            {/* Health Score Card - Empty State */}
            <View
              style={tw.style(`rounded-xl p-6 w-full border`, {
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              })}
            >
              <View style={tw`items-center mb-4`}>
                <View
                  style={[
                    tw`w-32 h-32 rounded-full justify-center items-center`,
                    {
                      backgroundColor: `${Colors.gray500}20`,
                      borderWidth: 4,
                      borderColor: Colors.gray500,
                    },
                  ]}
                >
                  <Text
                    style={tw.style(`text-4xl font-bold`, {
                      color: Colors.gray500,
                    })}
                  >
                    0
                  </Text>
                  <Text
                    style={tw.style(`text-base mt-1`, {
                      color: Colors.textSecondary,
                    })}
                  >
                    / 100
                  </Text>
                </View>
                <Text
                  style={tw.style(`text-xl font-bold mt-4`, {
                    color: Colors.gray500,
                  })}
                >
                  Belum Ada Data
                </Text>
                <Text
                  style={tw.style(`text-sm text-center mt-1`, {
                    color: Colors.textSecondary,
                  })}
                >
                  Mulai catat keuangan untuk melihat skor
                </Text>
              </View>

              {/* Quick Actions */}
              <View style={tw`mt-6`}>
                <Text
                  style={tw.style(`text-sm font-medium mb-3`, {
                    color: Colors.textPrimary,
                  })}
                >
                  Mulai Dari Sini
                </Text>
                <View style={tw`flex-row gap-3 mb-4`}>
                  <TouchableOpacity
                    style={tw.style(
                      `flex-1 p-3 rounded-xl border items-center`,
                      {
                        backgroundColor: Colors.surfaceLight,
                        borderColor: Colors.border,
                      }
                    )}
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
                      Transaksi Pertama
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={tw.style(
                      `flex-1 p-3 rounded-xl border items-center`,
                      {
                        backgroundColor: Colors.surfaceLight,
                        borderColor: Colors.border,
                      }
                    )}
                    onPress={() => navigation.navigate("AddBudget")}
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
                      Buat Anggaran
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={tw.style(
                      `flex-1 p-3 rounded-xl border items-center`,
                      {
                        backgroundColor: Colors.surfaceLight,
                        borderColor: Colors.border,
                      }
                    )}
                    onPress={() => navigation.navigate("AddSavings")}
                  >
                    <Ionicons
                      name="wallet-outline"
                      size={24}
                      color={Colors.pink}
                    />
                    <Text
                      style={tw.style(`text-xs font-medium mt-2`, {
                        color: Colors.textPrimary,
                      })}
                    >
                      Target Tabungan
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tips Untuk Pemula - DIPERBAIKI: menggunakan komponen Text untuk semua teks */}
              <View
                style={tw.style(`mt-4 p-4 rounded-lg`, {
                  backgroundColor: `${Colors.accent}10`,
                })}
              >
                <View style={tw`flex-row items-center mb-2`}>
                  <Ionicons
                    name="bulb-outline"
                    size={16}
                    color={Colors.accent}
                  />
                  <Text
                    style={tw.style(`text-sm font-medium ml-2`, {
                      color: Colors.accent,
                    })}
                  >
                    Tips Untuk Pemula
                  </Text>
                </View>
                <Text
                  style={tw.style(`text-sm`, {
                    color: Colors.textSecondary,
                  })}
                >
                  1. Catat semua pemasukan dan pengeluaran{"\n"}
                  2. Buat anggaran untuk 3 kategori utama{"\n"}
                  3. Tetapkan target tabungan kecil{"\n"}
                  4. Review mingguan progress Anda
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ==================== SAFE COMPARATIVE DATA ====================
  const getComparativeData = () => {
    try {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const lastMonthTransactions = (state.transactions || []).filter((t) => {
        try {
          if (!t || !t.date) return false;
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

      const safeCurrentIncome = safeNumber(transactionAnalytics.totalIncome);
      const safeCurrentExpense = safeNumber(transactionAnalytics.totalExpense);
      const safeCurrentSavingsRate = safeNumber(
        transactionAnalytics.savingsRate
      );

      const safeLastMonthIncome = safeNumber(lastMonthAnalytics.totalIncome);
      const safeLastMonthExpense = safeNumber(lastMonthAnalytics.totalExpense);
      const safeLastMonthSavingsRate = safeNumber(
        lastMonthAnalytics.savingsRate
      );

      return {
        current: {
          totalIncome: safeCurrentIncome,
          totalExpense: safeCurrentExpense,
          savingsRate: safeCurrentSavingsRate,
        },
        previous: {
          totalIncome: safeLastMonthIncome,
          totalExpense: safeLastMonthExpense,
          savingsRate: safeLastMonthSavingsRate,
        },
        incomeChange: safeCurrentIncome - safeLastMonthIncome,
        expenseChange: safeCurrentExpense - safeLastMonthExpense,
        savingsRateChange: safeCurrentSavingsRate - safeLastMonthSavingsRate,
      };
    } catch (error) {
      console.error("Error in getComparativeData:", error);
      return {
        current: {
          totalIncome: 0,
          totalExpense: 0,
          savingsRate: 0,
        },
        previous: {
          totalIncome: 0,
          totalExpense: 0,
          savingsRate: 0,
        },
        incomeChange: 0,
        expenseChange: 0,
        savingsRateChange: 0,
      };
    }
  };

  const comparativeData = getComparativeData();

  // ==================== SAFE CASH FLOW FORECAST ====================
  const getCashFlowForecast = () => {
    try {
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
          forecast > 100000
            ? "safe"
            : forecast > -100000
            ? "warning"
            : "danger",
      };
    } catch (error) {
      console.error("Error in cash flow forecast:", error);
      return {
        dailyAvg: 0,
        daysRemaining: 0,
        forecast: 0,
        status: "safe",
      };
    }
  };

  const cashFlowForecast = getCashFlowForecast();

  // ==================== SAFE CATEGORY BENCHMARKS ====================
  type BenchmarkItem = {
    category: string;
    yourPercentage: number;
    avgPercentage: number;
    difference: number;
    status: "above" | "below" | "normal";
  };

  const getCategoryBenchmarks = (): BenchmarkItem[] => {
    try {
      const averagePercentages: Record<string, number> = {
        Makanan: 30,
        Transportasi: 20,
        Belanja: 15,
        Hiburan: 10,
        Tagihan: 15,
        Lainnya: 10,
      };

      const totalExpense = safeNumber(transactionAnalytics.totalExpense);
      if (totalExpense <= 0) return [];

      return (transactionAnalytics.topCategories || []).map(
        ([category, amount]): BenchmarkItem => {
          const safeAmount = safeNumber(amount);
          const yourPercentage = getSafePercentage(safeAmount, totalExpense);
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
    } catch (error) {
      console.error("Error in category benchmarks:", error);
      return [];
    }
  };

  const categoryBenchmarks = getCategoryBenchmarks();

  // ==================== EXPORT FUNCTION ====================
  const handleExport = async () => {
    try {
      const summary = `
📊 LAPORAN KEUANGAN - ${getCurrentMonth()}

PEMASUKAN: ${formatCurrency(transactionAnalytics.totalIncome)}
PENGELUARAN: ${formatCurrency(transactionAnalytics.totalExpense)}
TABUNGAN BERSIH: ${formatCurrency(transactionAnalytics.netSavings)}
RASIO TABUNGAN: ${safeNumber(transactionAnalytics.savingsRate).toFixed(1)}%

📈 SKOR KESEHATAN KEUANGAN: ${financialHealthScore.overallScore}/100
Kategori: ${financialHealthScore.category}

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

  // ==================== HELPER FUNCTIONS ====================
  const formatChange = (value: number, isPercent = false) => {
    try {
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
    } catch (error) {
      return "+Rp 0";
    }
  };

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

  // ==================== RENDER HEALTH SCORE ====================
  const renderHealthScore = () => {
    const { overallScore, category, color, factors, recommendations } =
      financialHealthScore;

    const getScoreDescription = (score: number) => {
      if (score >= 80) return "Sangat Sehat";
      if (score >= 60) return "Sehat";
      if (score >= 40) return "Cukup";
      if (score >= 20) return "Perlu Perbaikan";
      if (score === 0) return "Belum Ada Data";
      return "Kritis";
    };

    const getScoreColor = (score: number) => {
      if (score === 0) return Colors.gray500;
      if (score >= 80) return Colors.success;
      if (score >= 60) return Colors.info;
      if (score >= 40) return Colors.warning;
      if (score >= 20) return Colors.error;
      return Colors.errorDark;
    };

    return (
      <View style={tw`mb-4`}>
        {/* Main Score Card */}
        <View
          style={tw.style(`rounded-xl p-4 mb-3 border`, {
            backgroundColor: Colors.surface,
            borderColor: Colors.border,
          })}
        >
          <Text
            style={tw.style(`text-lg font-semibold mb-4`, {
              color: Colors.textPrimary,
            })}
          >
            Skor Kesehatan Keuangan
          </Text>

          {/* Score Circle */}
          <View style={tw`items-center mb-6`}>
            <View
              style={[
                tw`w-32 h-32 rounded-full justify-center items-center`,
                {
                  backgroundColor: `${getScoreColor(overallScore)}20`,
                  borderWidth: 4,
                  borderColor: getScoreColor(overallScore),
                },
              ]}
            >
              <Text
                style={tw.style(`text-4xl font-bold`, {
                  color: getScoreColor(overallScore),
                })}
              >
                {overallScore}
              </Text>
              <Text
                style={tw.style(`text-base mt-1`, {
                  color: Colors.textPrimary,
                })}
              >
                / 100
              </Text>
            </View>
            <Text
              style={[
                tw.style(`text-lg font-semibold mt-4`, {
                  color: getScoreColor(overallScore),
                }),
              ]}
            >
              {getScoreDescription(overallScore)}
            </Text>
            <Text
              style={tw.style(`text-sm text-center mt-1`, {
                color: Colors.textSecondary,
              })}
            >
              {category}
            </Text>
          </View>

          {/* Score Breakdown */}
          <View style={tw`mb-4`}>
            <Text
              style={tw.style(`text-sm font-medium mb-3`, {
                color: Colors.textPrimary,
              })}
            >
              Detail Skor
            </Text>

            {Object.entries(factors).map(([key, factor]) => (
              <View key={key} style={tw`mb-3`}>
                <View style={tw`flex-row justify-between items-center mb-1`}>
                  <Text
                    style={tw.style(`text-sm`, { color: Colors.textPrimary })}
                  >
                    {key === "savingsRate" && "Rasio Tabungan"}
                    {key === "budgetAdherence" && "Kepatuhan Anggaran"}
                    {key === "expenseControl" && "Kontrol Pengeluaran"}
                    {key === "goalProgress" && "Progress Target"}
                  </Text>
                  <Text
                    style={tw.style(`text-sm`, { color: Colors.textPrimary })}
                  >
                    {factor.score}/100
                  </Text>
                </View>
                <ProgressBar
                  progress={Math.max(0, Math.min(factor.score / 100, 1))}
                  color={getScoreColor(factor.score)}
                  style={tw.style(`h-2 rounded-full`, {
                    backgroundColor: Colors.surfaceLight,
                  })}
                />
                <View style={tw`flex-row justify-between mt-1`}>
                  <Text
                    style={tw.style(`text-xs`, { color: Colors.textTertiary })}
                  >
                    Bobot: {(factor.weight * 100).toFixed(0)}%
                  </Text>
                  <Text
                    style={tw.style(`text-xs`, {
                      color:
                        factor.status === "good"
                          ? Colors.success
                          : factor.status === "warning"
                          ? Colors.warning
                          : Colors.error,
                    })}
                  >
                    {factor.status === "good"
                      ? "✓ Baik"
                      : factor.status === "warning"
                      ? "⚠ Perlu perbaikan"
                      : "✗ Perlu perhatian"}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <View
              style={tw.style(`mt-4 p-3 rounded-lg border`, {
                backgroundColor: Colors.surfaceLight,
                borderColor: Colors.border,
              })}
            >
              <Text
                style={tw.style(`text-sm font-medium mb-2`, {
                  color: Colors.textPrimary,
                })}
              >
                Rekomendasi Perbaikan
              </Text>
              {recommendations.map((rec, index) => (
                <View key={index} style={tw`flex-row items-start mb-2`}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={Colors.success}
                    style={tw`mt-0.5 mr-2`}
                  />
                  <Text
                    style={tw.style(`text-sm flex-1`, {
                      color: Colors.textSecondary,
                    })}
                  >
                    {rec}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Health Score Legend */}
        <View
          style={tw.style(`rounded-xl p-3 border`, {
            backgroundColor: Colors.surface,
            borderColor: Colors.border,
          })}
        >
          <Text
            style={tw.style(`text-sm font-medium mb-2`, {
              color: Colors.textPrimary,
            })}
          >
            Keterangan Skor
          </Text>
          <View style={tw`flex-row flex-wrap gap-2`}>
            {[
              { range: "0", label: "Belum Ada Data", color: Colors.gray500 },
              { range: "80-100", label: "Sangat Sehat", color: Colors.success },
              { range: "60-79", label: "Sehat", color: Colors.info },
              { range: "40-59", label: "Cukup", color: Colors.warning },
              { range: "20-39", label: "Perlu Perbaikan", color: Colors.error },
              { range: "1-19", label: "Kritis", color: Colors.errorDark },
            ].map((item) => (
              <View
                key={item.range}
                style={tw.style(`flex-row items-center px-2 py-1 rounded-lg`, {
                  backgroundColor: Colors.surfaceLight,
                })}
              >
                <View
                  style={[
                    tw`w-3 h-3 rounded-full mr-2`,
                    { backgroundColor: item.color },
                  ]}
                />
                <Text
                  style={tw.style(`text-xs`, { color: Colors.textPrimary })}
                >
                  {item.range}: {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

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

      {/* Main Tabs - Added Health Tab */}
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
              key: "health",
              label: "Kesehatan",
              icon: "heart-outline" as SafeIconName,
            },
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
        {/* Health Tab */}
        {activeTab === "health" && renderHealthScore()}

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
                style={tw.style(`rounded-xl p-4 mb-3 border`, {
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
