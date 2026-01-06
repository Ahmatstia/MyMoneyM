// File: src/screens/HomeScreen.tsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { formatCurrency, safeNumber } from "../../utils/calculations";
import { calculateTransactionAnalytics } from "../../utils/analytics";

// Import tema navy blue dari file theme
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

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state, isLoading } = useAppContext();

  // Helper untuk mendapatkan icon yang aman
  const getSafeIcon = (iconName: string): SafeIconName => {
    const defaultIcon: SafeIconName = "receipt-outline";
    if (iconName in Ionicons.glyphMap) {
      return iconName as SafeIconName;
    }
    return defaultIcon;
  };

  // Check if user has any financial data
  const hasFinancialData = useMemo(() => {
    return (
      state.transactions.length > 0 ||
      state.budgets.length > 0 ||
      state.savings.length > 0
    );
  }, [state.transactions, state.budgets, state.savings]);

  // ANALYTICS FOR INSIGHTS with safe values
  const transactionAnalytics = useMemo(() => {
    if (!hasFinancialData) {
      return {
        totalIncome: 0,
        totalExpense: 0,
        netSavings: 0,
        savingsRate: 0,
        avgDailyExpense: 0,
        topCategories: [],
        transactionCount: 0,
        incomeTransactionCount: 0,
        expenseTransactionCount: 0,
      };
    }

    const analytics = calculateTransactionAnalytics(
      state.transactions,
      "month"
    );
    return {
      ...analytics,
      totalIncome: safeNumber(analytics.totalIncome),
      totalExpense: safeNumber(analytics.totalExpense),
      netSavings: safeNumber(analytics.netSavings),
      savingsRate: safeNumber(analytics.savingsRate),
      avgDailyExpense: safeNumber(analytics.avgDailyExpense),
    };
  }, [state.transactions, hasFinancialData]);

  // PERBAIKAN: Conditional return HARUS DI BAWAH semua hooks
  if (isLoading) {
    return (
      <SafeAreaView style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={ACCENT_COLOR} />
          <Text style={[tw`mt-4 px-8`, { color: TEXT_SECONDARY }]}>
            Memuat data keuangan Anda...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // 1. PERSONALIZED GREETING (Phase 1) - IMPROVED
  const getPersonalizedGreeting = () => {
    const hour = new Date().getHours();
    let greeting = "";

    if (hour < 12) greeting = "Selamat Pagi";
    else if (hour < 15) greeting = "Selamat Siang";
    else if (hour < 19) greeting = "Selamat Sore";
    else greeting = "Selamat Malam";

    // Add financial milestone if any
    if (safeNumber(transactionAnalytics.savingsRate) >= 30) {
      greeting += "! Tabungan Luar Biasa";
    } else if (
      safeNumber(state.balance) >
      safeNumber(state.totalIncome) * 0.5
    ) {
      greeting += "! Saldo Sehat";
    } else if (
      state.budgets.length > 0 &&
      state.budgets.every((b) => safeNumber(b.spent) <= safeNumber(b.limit))
    ) {
      greeting += "! ✅ Semua Anggaran Aman";
    } else {
      greeting += "! 📊";
    }

    return greeting;
  };

  // 2. FINANCIAL HEALTH SCORE - IMPROVED FOR NEW USERS
  const calculateHealthScore = () => {
    // Jika tidak ada data sama sekali, return null (tidak ada skor)
    if (!hasFinancialData) {
      return null;
    }

    let score = 50; // Base score

    // 1. Savings Rate (0-30 points) - FIXED
    const safeSavingsRate = safeNumber(transactionAnalytics.savingsRate);
    const savingsRatePoints = Math.min(safeSavingsRate * 1.5, 30);
    score += savingsRatePoints;

    // 2. Budget Adherence (0-25 points) - FIXED
    if (state.budgets.length > 0) {
      const onBudgetCount = state.budgets.filter(
        (b) => safeNumber(b.spent) <= safeNumber(b.limit)
      ).length;
      const budgetPoints = (onBudgetCount / state.budgets.length) * 25;
      score += safeNumber(budgetPoints);
    }

    // 3. Emergency Fund (0-20 points) - FIXED division by zero
    const safeTotalExpense = safeNumber(state.totalExpense);
    const emergencyMonths =
      safeTotalExpense > 0
        ? safeNumber(state.balance) / (safeTotalExpense / 30)
        : 0;
    const emergencyPoints = Math.min(safeNumber(emergencyMonths) * 5, 20);
    score += emergencyPoints;

    // 4. Transaction Consistency (0-15 points)
    const avgTransactionsPerDay = state.transactions.length / 30;
    const consistencyPoints = Math.min(avgTransactionsPerDay * 5, 15);
    score += consistencyPoints;

    // 5. Income Stability Bonus (0-10 points)
    if (state.totalIncome > state.totalExpense * 1.2) {
      score += 10;
    }

    return Math.min(Math.round(safeNumber(score)), 100);
  };

  const healthScore = calculateHealthScore();
  const getHealthStatus = (score: number | null) => {
    // Jika tidak ada skor (belum ada data)
    if (score === null) {
      return {
        label: "Belum Ada Data",
        color: TEXT_SECONDARY,
        icon: "help-circle-outline" as SafeIconName,
      };
    }

    const safeScore = safeNumber(score);
    if (safeScore >= 80)
      return {
        label: "Sangat Sehat",
        color: SUCCESS_COLOR,
        icon: "heart-outline" as SafeIconName,
      };
    if (safeScore >= 60)
      return {
        label: "Sehat",
        color: WARNING_COLOR,
        icon: "checkmark-circle-outline" as SafeIconName,
      };
    if (safeScore >= 40)
      return {
        label: "Perhatian",
        color: WARNING_COLOR,
        icon: "alert-circle-outline" as SafeIconName,
      };
    return {
      label: "Kritis",
      color: ERROR_COLOR,
      icon: "warning-outline" as SafeIconName,
    };
  };

  const healthStatus = getHealthStatus(healthScore);

  // 3. SMART INSIGHTS (Phase 2) - IMPROVED FOR NEW USERS
  const getSmartInsights = () => {
    const insights = [];

    // Special insight for new users
    if (!hasFinancialData) {
      insights.push({
        type: "info",
        title: "Mulai Catat Keuangan",
        message:
          "Tambahkan transaksi pertama Anda untuk melihat analisis keuangan",
        icon: "add-circle-outline" as SafeIconName,
        color: ACCENT_COLOR,
        action: "Tambah Transaksi",
        onPress: () => navigation.navigate("AddTransaction"),
      });

      // Limit to just one insight for new users
      return insights;
    }

    // Insight 1: Savings Rate - FIXED
    if (transactionAnalytics.savingsRate < 10) {
      insights.push({
        type: "warning",
        title: "Rasio Tabungan Rendah",
        message: `Hanya ${safeNumber(transactionAnalytics.savingsRate).toFixed(
          1
        )}% dari pemasukan disimpan`,
        icon: "trending-down-outline" as SafeIconName,
        color: ERROR_COLOR,
        action: "Tingkatkan ke 20%",
        onPress: () => navigation.navigate("Analytics"),
      });
    } else if (transactionAnalytics.savingsRate >= 20) {
      insights.push({
        type: "success",
        title: "Rasio Tabungan Baik!",
        message: `${safeNumber(transactionAnalytics.savingsRate).toFixed(
          1
        )}% pemasukan berhasil disimpan`,
        icon: "trending-up-outline" as SafeIconName,
        color: SUCCESS_COLOR,
        action: "Pertahankan!",
        onPress: () => navigation.navigate("Analytics"),
      });
    }

    // Insight 2: Spending Concentration - FIXED division by zero
    if (transactionAnalytics.topCategories.length > 0) {
      const [topCategory, topAmount] = transactionAnalytics.topCategories[0];
      const safeTopAmount = safeNumber(topAmount);
      const safeTotalExpense = safeNumber(transactionAnalytics.totalExpense);
      const percentage =
        safeTotalExpense > 0 ? (safeTopAmount / safeTotalExpense) * 100 : 0;

      if (percentage > 40) {
        insights.push({
          type: "warning",
          title: `Konsentrasi Pengeluaran Tinggi`,
          message: `${topCategory} menghabiskan ${safeNumber(
            percentage
          ).toFixed(0)}% dari total pengeluaran`,
          icon: "pie-chart-outline" as SafeIconName,
          color: WARNING_COLOR,
          action: "Diversifikasi",
          onPress: () =>
            navigation.navigate("Analytics", { tab: "categories" }),
        });
      }
    }

    // Insight 3: Budget Status
    if (state.budgets.length > 0) {
      const overBudgetCount = state.budgets.filter(
        (b) => safeNumber(b.spent) > safeNumber(b.limit)
      ).length;
      if (overBudgetCount > 0) {
        insights.push({
          type: "warning",
          title: `${overBudgetCount} Anggaran Melebihi Limit`,
          message: "Beberapa kategori pengeluaran melebihi batas",
          icon: "alert-circle-outline" as SafeIconName,
          color: ERROR_COLOR,
          action: "Review Anggaran",
          onPress: () => navigation.navigate("Budget"),
        });
      }
    }

    // Insight 4: Savings Progress - FIXED division by zero
    if (state.savings.length > 0) {
      const nearingCompletion = state.savings.filter((s) => {
        const safeCurrent = safeNumber(s.current);
        const safeTarget = safeNumber(s.target);
        return (
          safeTarget > 0 &&
          safeCurrent / safeTarget >= 0.8 &&
          safeCurrent < safeTarget
        );
      });
      if (nearingCompletion.length > 0) {
        insights.push({
          type: "success",
          title: `${nearingCompletion.length} Target Hampir Tercapai!`,
          message: "Tabungan Anda hampir mencapai target",
          icon: "trophy-outline" as SafeIconName,
          color: ACCENT_COLOR,
          action: "Lihat Progress",
          onPress: () => navigation.navigate("Savings"),
        });
      }
    }

    // Default insight if none
    if (insights.length === 0) {
      insights.push({
        type: "info",
        title: "Keuangan Stabil",
        message: "Semua indikator dalam kondisi baik",
        icon: "checkmark-circle-outline" as SafeIconName,
        color: ACCENT_COLOR,
        action: "Pantau Terus",
        onPress: () => navigation.navigate("Analytics"),
      });
    }

    return insights.slice(0, 3); // Max 3 insights
  };

  const smartInsights = getSmartInsights();

  // 4. DYNAMIC QUICK ACTIONS (Phase 1) - IMPROVED FOR NEW USERS
  const getDynamicQuickActions = () => {
    const hour = new Date().getHours();
    const isWeekend = [0, 6].includes(new Date().getDay());
    const actions = [];

    // Always show these
    actions.push({
      id: 1,
      title: "Transaksi",
      icon: "swap-horizontal-outline" as SafeIconName,
      color: ACCENT_COLOR,
      onPress: () => navigation.navigate("Transactions"),
    });

    actions.push({
      id: 2,
      title: "Analitik",
      icon: "stats-chart-outline" as SafeIconName,
      color: SUCCESS_COLOR,
      onPress: () => navigation.navigate("Analytics"),
    });

    // Contextual actions based on time
    if (hour < 12) {
      // Morning: Budget review
      actions.push({
        id: 3,
        title: "Review Hari",
        icon: "calendar-outline" as SafeIconName,
        color: WARNING_COLOR,
        onPress: () => navigation.navigate("Budget"),
      });
    } else if (hour > 18) {
      // Evening: Input today's transactions
      actions.push({
        id: 3,
        title: "Catat Hari",
        icon: "checkmark-circle-outline" as SafeIconName,
        color: Colors.info,
        onPress: () => navigation.navigate("AddTransaction"),
      });
    } else {
      // Daytime: Regular budget
      actions.push({
        id: 3,
        title: "Anggaran",
        icon: "pie-chart-outline" as SafeIconName,
        color: WARNING_COLOR,
        onPress: () => navigation.navigate("Budget"),
      });
    }

    // Weekend special: Weekly review
    if (isWeekend) {
      actions.push({
        id: 4,
        title: "Review Minggu",
        icon: "document-text-outline" as SafeIconName,
        color: Colors.purple,
        onPress: () => navigation.navigate("Analytics"),
      });
    } else {
      // Weekday: Savings focus
      actions.push({
        id: 4,
        title: "Tabungan",
        icon: "wallet-outline" as SafeIconName,
        color: ACCENT_COLOR,
        onPress: () => navigation.navigate("Savings"),
      });
    }

    // Special action for new users - more prominent
    if (!hasFinancialData) {
      return [
        {
          id: 0,
          title: "Mulai Catat",
          icon: "add-circle-outline" as SafeIconName,
          color: ACCENT_COLOR,
          onPress: () => navigation.navigate("AddTransaction"),
        },
        {
          id: 1,
          title: "Tutorial",
          icon: "help-circle-outline" as SafeIconName,
          color: SUCCESS_COLOR,
          onPress: () => navigation.navigate("Analytics"),
        },
        {
          id: 2,
          title: "Anggaran",
          icon: "pie-chart-outline" as SafeIconName,
          color: WARNING_COLOR,
          onPress: () => navigation.navigate("Budget"),
        },
        {
          id: 3,
          title: "Tabungan",
          icon: "wallet-outline" as SafeIconName,
          color: ACCENT_COLOR,
          onPress: () => navigation.navigate("Savings"),
        },
      ];
    }

    return actions.slice(0, 4); // Max 4 actions
  };

  const dynamicQuickActions = getDynamicQuickActions();

  // 5. MONTHLY PROGRESS INDICATOR (Phase 1) - FIXED division by zero
  const getMonthlyProgress = () => {
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();
    const progress = safeNumber((currentDay / daysInMonth) * 100);

    // Projected end-of-month balance - FIXED division by zero
    const dailyAvgExpense =
      currentDay > 0 ? safeNumber(state.totalExpense) / currentDay : 0;
    const daysRemaining = Math.max(0, daysInMonth - currentDay);
    const projectedExpense = safeNumber(
      safeNumber(state.totalExpense) + dailyAvgExpense * daysRemaining
    );
    const projectedBalance = safeNumber(
      safeNumber(state.totalIncome) - projectedExpense
    );

    return {
      currentDay,
      daysInMonth,
      progress: isNaN(progress) ? 0 : progress,
      dailyAvgExpense: safeNumber(dailyAvgExpense),
      daysRemaining,
      projectedBalance: isNaN(projectedBalance) ? 0 : projectedBalance,
      status:
        projectedBalance > 0
          ? "surplus"
          : projectedBalance > -1000000
          ? "warning"
          : "deficit",
    };
  };

  const monthlyProgress = getMonthlyProgress();

  // 6. GOALS PREVIEW (Phase 2) - FIXED division by zero
  const getGoalsPreview = () => {
    if (state.savings.length === 0) return [];

    return state.savings
      .filter((s) => {
        const safeCurrent = safeNumber(s.current);
        const safeTarget = safeNumber(s.target);
        return safeTarget > 0 && safeCurrent < safeTarget;
      })
      .sort((a, b) => {
        const aProgress =
          safeNumber(a.target) > 0
            ? safeNumber(a.current) / safeNumber(a.target)
            : 0;
        const bProgress =
          safeNumber(b.target) > 0
            ? safeNumber(b.current) / safeNumber(b.target)
            : 0;
        return bProgress - aProgress;
      })
      .slice(0, 3);
  };

  const goalsPreview = getGoalsPreview();

  // 7. QUICK STATS (Phase 2) - FIXED all calculations
  const getQuickStats = () => {
    // Jika tidak ada data, tampilkan stats yang lebih informatif
    if (!hasFinancialData) {
      return [
        {
          id: 1,
          label: "Mulai Dengan",
          value: "Transaksi",
          unit: "Pertama",
          trend: "✨",
          color: ACCENT_COLOR,
        },
        {
          id: 2,
          label: "Pantau",
          value: "Pengeluaran",
          trend: "📊",
          color: SUCCESS_COLOR,
        },
        {
          id: 3,
          label: "Buat",
          value: "Target",
          unit: "Tabungan",
          trend: "🎯",
          color: WARNING_COLOR,
        },
      ];
    }

    // Calculate days without shopping expense
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const shoppingTransactions = state.transactions.filter(
      (t) =>
        t.type === "expense" &&
        t.category === "Belanja" &&
        new Date(t.date) >= sevenDaysAgo
    );

    const daysWithoutShopping = Math.max(
      0,
      7 -
        new Set(
          shoppingTransactions.map((t) => new Date(t.date).toDateString())
        ).size
    );

    // Average daily expense - FIXED
    const avgDailyExpense = safeNumber(state.totalExpense / 30);

    // Transactions this month
    const thisMonthTransactions = state.transactions.filter((t) => {
      const transDate = new Date(t.date);
      return transDate.getMonth() === new Date().getMonth();
    }).length;

    // Month-over-month comparison - FIXED division by zero
    const lastMonthTransactions = state.transactions.filter((t) => {
      const transDate = new Date(t.date);
      const lastMonth = new Date().getMonth() - 1;
      return transDate.getMonth() === (lastMonth < 0 ? 11 : lastMonth);
    }).length;

    const transactionGrowth =
      lastMonthTransactions > 0
        ? safeNumber(
            ((thisMonthTransactions - lastMonthTransactions) /
              lastMonthTransactions) *
              100
          )
        : 100;

    return [
      {
        id: 1,
        label: "Hari Tanpa Belanja",
        value: daysWithoutShopping.toString(),
        unit: "hari",
        trend: daysWithoutShopping >= 4 ? "+" : "-",
        color: SUCCESS_COLOR,
      },
      {
        id: 2,
        label: "Rata-rata/Hari",
        value: formatCurrency(avgDailyExpense),
        trend: avgDailyExpense > 100000 ? "↑" : "↓",
        color: WARNING_COLOR,
      },
      {
        id: 3,
        label: "Transaksi",
        value: thisMonthTransactions.toString(),
        unit: "bulan ini",
        trend: transactionGrowth >= 0 ? "+" : "-",
        color: ACCENT_COLOR,
      },
    ];
  };

  const quickStats = getQuickStats();

  // 8. Helper functions
  const getCurrentDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return now.toLocaleDateString("id-ID", options);
  };

  const transactionIcons: Record<string, SafeIconName> = {
    Makanan: "restaurant-outline",
    Transportasi: "car-outline",
    Belanja: "cart-outline",
    Hiburan: "film-outline",
    Kesehatan: "medical-outline",
    Pendidikan: "school-outline",
    Gaji: "cash-outline",
    Investasi: "trending-up-outline",
    Lainnya: "ellipsis-horizontal-outline",
  };

  const getTransactionIcon = (category: string): SafeIconName => {
    const icon = transactionIcons[category];
    return icon ? getSafeIcon(icon) : "receipt-outline";
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-5 pb-24`}
      >
        {/* HEADER SECTION */}
        <View style={tw`flex-row justify-between items-center pt-3 pb-3`}>
          <View style={tw`flex-1`}>
            <View style={tw`flex-row items-center mb-0.5`}>
              <Text style={[tw`text-xl font-bold`, { color: TEXT_PRIMARY }]}>
                {getPersonalizedGreeting()}
              </Text>
            </View>
            <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
              {getCurrentDate()}
            </Text>
          </View>

          {/* Health Score Badge */}
          {healthScore !== null ? (
            <TouchableOpacity
              style={[
                tw`px-3 py-2 rounded-xl items-center justify-center`,
                {
                  backgroundColor: SURFACE_COLOR,
                  borderWidth: 1,
                  borderColor: BORDER_COLOR,
                },
              ]}
              onPress={() => navigation.navigate("Analytics")}
            >
              <View style={tw`flex-row items-center`}>
                <Ionicons
                  name={healthStatus.icon}
                  size={16}
                  color={healthStatus.color}
                />
                <Text
                  style={[tw`ml-1 font-bold`, { color: healthStatus.color }]}
                >
                  {healthScore}
                </Text>
              </View>
              <Text style={[tw`text-xs mt-0.5`, { color: TEXT_SECONDARY }]}>
                {healthStatus.label}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                tw`px-3 py-2 rounded-xl items-center justify-center`,
                {
                  backgroundColor: SURFACE_COLOR,
                  borderWidth: 1,
                  borderColor: BORDER_COLOR,
                },
              ]}
              onPress={() => navigation.navigate("AddTransaction")}
            >
              <View style={tw`flex-row items-center`}>
                <Ionicons
                  name="add-circle-outline"
                  size={16}
                  color={ACCENT_COLOR}
                />
                <Text
                  style={[
                    tw`ml-1 text-xs font-medium`,
                    { color: ACCENT_COLOR },
                  ]}
                >
                  Mulai
                </Text>
              </View>
              <Text style={[tw`text-xs mt-0.5`, { color: TEXT_SECONDARY }]}>
                Tambah Data
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SMART INSIGHTS CARDS */}
        {smartInsights.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={tw`-mx-5 pl-5 mb-4`}
            contentContainerStyle={tw`pr-5`}
          >
            {smartInsights.map((insight, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  tw`w-64 rounded-xl p-3 mr-3`,
                  {
                    backgroundColor: SURFACE_COLOR,
                    borderWidth: 1,
                    borderColor: BORDER_COLOR,
                  },
                ]}
                onPress={insight.onPress}
                activeOpacity={0.7}
              >
                <View style={tw`flex-row items-start`}>
                  <View
                    style={[
                      tw`w-8 h-8 rounded-lg items-center justify-center mr-2`,
                      { backgroundColor: `${insight.color}20` },
                    ]}
                  >
                    <Ionicons
                      name={insight.icon}
                      size={16}
                      color={insight.color}
                    />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text
                      style={[
                        tw`text-sm font-semibold mb-1`,
                        { color: insight.color },
                      ]}
                    >
                      {insight.title}
                    </Text>
                    <Text style={[tw`text-xs mb-2`, { color: TEXT_SECONDARY }]}>
                      {insight.message}
                    </Text>
                    <Text
                      style={[
                        tw`text-xs font-medium`,
                        { color: insight.color },
                      ]}
                    >
                      → {insight.action}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* BALANCE CARD WITH MONTHLY PROGRESS */}
        <View
          style={[
            tw`rounded-2xl p-5 mb-6`,
            {
              backgroundColor: SURFACE_COLOR,
              borderWidth: 1,
              borderColor: BORDER_COLOR,
            },
          ]}
        >
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text
              style={[
                tw`text-xs font-medium uppercase tracking-wider`,
                { color: TEXT_SECONDARY },
              ]}
            >
              {hasFinancialData ? "SALDO ANDA" : "SELAMAT DATANG"}
            </Text>
            <View
              style={[
                tw`px-2 py-1 rounded-full`,
                { backgroundColor: Colors.surfaceLight },
              ]}
            >
              <Text
                style={[tw`text-xs font-medium`, { color: TEXT_SECONDARY }]}
              >
                {hasFinancialData
                  ? `Hari ke-${monthlyProgress.currentDay} dari ${monthlyProgress.daysInMonth}`
                  : "Hari Pertama"}
              </Text>
            </View>
          </View>

          <Text style={[tw`text-2xl font-bold mb-5`, { color: TEXT_PRIMARY }]}>
            {hasFinancialData
              ? formatCurrency(safeNumber(state.balance))
              : "Rp 0"}
          </Text>

          {/* Monthly Progress Bar */}
          <View style={tw`mb-4`}>
            <View style={tw`flex-row justify-between items-center mb-1`}>
              <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                {hasFinancialData ? "Progress Bulan Ini" : "Siap Memulai?"}
              </Text>
              <Text
                style={[tw`text-xs font-medium`, { color: TEXT_SECONDARY }]}
              >
                {hasFinancialData
                  ? `${safeNumber(monthlyProgress.progress).toFixed(0)}%`
                  : "0%"}
              </Text>
            </View>
            <View
              style={[
                tw`h-1.5 rounded-full overflow-hidden`,
                { backgroundColor: Colors.surfaceLight },
              ]}
            >
              <View
                style={[
                  tw`h-full rounded-full`,
                  {
                    width: `${Math.max(
                      0,
                      Math.min(safeNumber(monthlyProgress.progress), 100)
                    )}%`,
                    backgroundColor: hasFinancialData
                      ? monthlyProgress.status === "surplus"
                        ? SUCCESS_COLOR
                        : monthlyProgress.status === "warning"
                        ? WARNING_COLOR
                        : ERROR_COLOR
                      : Colors.textTertiary,
                  },
                ]}
              />
            </View>
          </View>

          <View style={tw`flex-row items-center`}>
            <View style={tw`flex-1`}>
              <Text style={[tw`text-xs mb-1`, { color: TEXT_SECONDARY }]}>
                Pemasukan
              </Text>
              <Text
                style={[tw`text-base font-semibold`, { color: SUCCESS_COLOR }]}
              >
                {formatCurrency(safeNumber(state.totalIncome))}
              </Text>
            </View>

            <View
              style={[tw`w-px h-10 mx-4`, { backgroundColor: BORDER_COLOR }]}
            />

            <View style={tw`flex-1`}>
              <Text style={[tw`text-xs mb-1`, { color: TEXT_SECONDARY }]}>
                Pengeluaran
              </Text>
              <Text
                style={[tw`text-base font-semibold`, { color: ERROR_COLOR }]}
              >
                {formatCurrency(safeNumber(state.totalExpense))}
              </Text>
              <Text style={[tw`text-xs`, { color: Colors.textTertiary }]}>
                {hasFinancialData
                  ? `${formatCurrency(
                      safeNumber(monthlyProgress.dailyAvgExpense)
                    )}/hari`
                  : "Belum ada data"}
              </Text>
            </View>
          </View>

          {/* Projected Balance */}
          {hasFinancialData && monthlyProgress.daysRemaining > 0 && (
            <View
              style={[
                tw`mt-3 pt-3`,
                { borderTopWidth: 1, borderTopColor: BORDER_COLOR },
              ]}
            >
              <Text style={[tw`text-xs mb-1`, { color: TEXT_SECONDARY }]}>
                Proyeksi akhir bulan ({monthlyProgress.daysRemaining} hari
                lagi):
              </Text>
              <Text
                style={[
                  tw`text-base font-semibold`,
                  monthlyProgress.projectedBalance >= 0
                    ? { color: SUCCESS_COLOR }
                    : { color: ERROR_COLOR },
                ]}
              >
                {formatCurrency(safeNumber(monthlyProgress.projectedBalance))}
              </Text>
            </View>
          )}
        </View>

        {/* DYNAMIC QUICK ACTIONS */}
        <View style={tw`flex-row justify-between mb-8`}>
          {dynamicQuickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={tw`items-center w-1/4`}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View
                style={[
                  tw`w-12 h-12 rounded-xl items-center justify-center mb-2`,
                  {
                    backgroundColor: SURFACE_COLOR,
                    borderWidth: 1,
                    borderColor: BORDER_COLOR,
                  },
                ]}
              >
                <Ionicons name={action.icon} size={20} color={action.color} />
              </View>
              <Text
                style={[
                  tw`text-xs font-medium text-center`,
                  { color: TEXT_PRIMARY },
                ]}
              >
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* QUICK STATS - HORIZONTAL COMPACT */}
        <View
          style={[
            tw`rounded-xl p-3 mb-6`,
            {
              backgroundColor: SURFACE_COLOR,
              borderWidth: 1,
              borderColor: BORDER_COLOR,
            },
          ]}
        >
          <View style={tw`flex-row justify-between`}>
            {quickStats.map((stat, index) => (
              <React.Fragment key={stat.id}>
                <View style={tw`flex-1 items-center`}>
                  <Text
                    style={[
                      tw`text-base font-bold mb-0.5`,
                      { color: stat.color },
                    ]}
                  >
                    {stat.value}
                  </Text>
                  <Text
                    style={[tw`text-xs text-center`, { color: TEXT_SECONDARY }]}
                  >
                    {stat.label}
                  </Text>
                </View>
                {index < quickStats.length - 1 && (
                  <View
                    style={[tw`w-px h-8`, { backgroundColor: BORDER_COLOR }]}
                  />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* RECENT TRANSACTIONS HEADER */}
        <View style={tw`flex-row justify-between items-center mb-4`}>
          <Text style={[tw`text-lg font-semibold`, { color: TEXT_PRIMARY }]}>
            {hasFinancialData ? "Transaksi Terbaru" : "Mulai Catat Keuangan"}
          </Text>
          {state.transactions.length > 0 ? (
            <TouchableOpacity
              onPress={() => navigation.navigate("Transactions")}
            >
              <Text style={[tw`text-sm font-medium`, { color: ACCENT_COLOR }]}>
                Lihat Semua
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate("AddTransaction")}
            >
              <Text style={[tw`text-sm font-medium`, { color: ACCENT_COLOR }]}>
                Mulai Sekarang
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* TRANSACTIONS LIST */}
        {state.transactions.length > 0 ? (
          <View
            style={[
              tw`rounded-2xl mb-6 overflow-hidden`,
              {
                backgroundColor: SURFACE_COLOR,
                borderWidth: 1,
                borderColor: BORDER_COLOR,
              },
            ]}
          >
            {state.transactions
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )
              .slice(0, 3)
              .map((transaction, index) => (
                <TouchableOpacity
                  key={transaction.id}
                  style={[
                    tw`flex-row justify-between items-center p-4`,
                    index < 2 && {
                      borderBottomWidth: 1,
                      borderBottomColor: BORDER_COLOR,
                    },
                  ]}
                  onPress={() =>
                    navigation.navigate("AddTransaction", {
                      editMode: true,
                      transactionData: transaction,
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View style={tw`flex-row items-center flex-1`}>
                    <View
                      style={[
                        tw`w-10 h-10 rounded-lg items-center justify-center mr-3`,
                        transaction.type === "income"
                          ? { backgroundColor: Colors.success + "20" }
                          : { backgroundColor: Colors.error + "20" },
                      ]}
                    >
                      <Ionicons
                        name={getTransactionIcon(transaction.category)}
                        size={18}
                        color={
                          transaction.type === "income"
                            ? SUCCESS_COLOR
                            : ERROR_COLOR
                        }
                      />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text
                        style={[
                          tw`text-sm font-medium mb-0.5`,
                          { color: TEXT_PRIMARY },
                        ]}
                      >
                        {transaction.category}
                      </Text>
                      <Text
                        style={[tw`text-xs mb-1`, { color: TEXT_SECONDARY }]}
                      >
                        {transaction.description || "Tidak ada deskripsi"}
                      </Text>
                      <Text
                        style={[tw`text-xs`, { color: Colors.textTertiary }]}
                      >
                        {new Date(transaction.date).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      tw`text-sm font-semibold`,
                      transaction.type === "income"
                        ? { color: SUCCESS_COLOR }
                        : { color: ERROR_COLOR },
                    ]}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(safeNumber(transaction.amount))}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        ) : (
          <View
            style={[
              tw`rounded-2xl p-8 items-center mb-6`,
              {
                backgroundColor: SURFACE_COLOR,
                borderWidth: 1,
                borderColor: BORDER_COLOR,
              },
            ]}
          >
            <View
              style={[
                tw`w-16 h-16 rounded-xl items-center justify-center mb-4`,
                { backgroundColor: Colors.accent + "20" },
              ]}
            >
              <Ionicons name="wallet-outline" size={28} color={ACCENT_COLOR} />
            </View>
            <Text
              style={[
                tw`text-base font-semibold mb-1`,
                { color: TEXT_PRIMARY },
              ]}
            >
              Selamat Datang di MyMoney!
            </Text>
            <Text
              style={[
                tw`text-sm text-center mb-5 leading-5`,
                { color: TEXT_SECONDARY },
              ]}
            >
              Mulai kelola keuangan Anda dengan mencatat transaksi pertama
            </Text>
            <TouchableOpacity
              style={[
                tw`px-5 py-2.5 rounded-lg flex-row items-center`,
                { backgroundColor: ACCENT_COLOR },
              ]}
              onPress={() => navigation.navigate("AddTransaction")}
            >
              <Ionicons
                name="add-circle"
                size={20}
                color="#FFFFFF"
                style={tw`mr-2`}
              />
              <Text style={tw`text-white text-sm font-medium`}>
                Tambah Transaksi Pertama
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* COMBINED: BUDGET + GOALS IN ONE CARD */}
        {hasFinancialData &&
          (state.budgets.length > 0 || goalsPreview.length > 0) && (
            <>
              <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text
                  style={[tw`text-lg font-semibold`, { color: TEXT_PRIMARY }]}
                >
                  Progress & Target
                </Text>
                <View style={tw`flex-row gap-3`}>
                  {state.budgets.length > 0 && (
                    <TouchableOpacity
                      onPress={() => navigation.navigate("Budget")}
                    >
                      <Text
                        style={[
                          tw`text-sm font-medium`,
                          { color: ACCENT_COLOR },
                        ]}
                      >
                        Anggaran
                      </Text>
                    </TouchableOpacity>
                  )}
                  {goalsPreview.length > 0 && (
                    <TouchableOpacity
                      onPress={() => navigation.navigate("Savings")}
                    >
                      <Text
                        style={[
                          tw`text-sm font-medium`,
                          { color: SUCCESS_COLOR },
                        ]}
                      >
                        Tabungan
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View
                style={[
                  tw`rounded-2xl p-4 mb-6`,
                  {
                    backgroundColor: SURFACE_COLOR,
                    borderWidth: 1,
                    borderColor: BORDER_COLOR,
                  },
                ]}
              >
                <View style={tw`flex-row`}>
                  {/* LEFT COLUMN: BUDGET SUMMARY */}
                  {state.budgets.length > 0 && (
                    <View
                      style={[
                        tw`flex-1 pr-3`,
                        { borderRightWidth: 1, borderRightColor: BORDER_COLOR },
                      ]}
                    >
                      <Text
                        style={[
                          tw`text-xs font-medium mb-3`,
                          { color: TEXT_SECONDARY },
                        ]}
                      >
                        Anggaran ({state.budgets.slice(0, 3).length})
                      </Text>
                      {state.budgets.slice(0, 3).map((budget) => {
                        const safeSpent = safeNumber(budget.spent);
                        const safeLimit = safeNumber(budget.limit);
                        const progress =
                          safeLimit > 0 ? (safeSpent / safeLimit) * 100 : 0;
                        const progressColor =
                          progress > 90
                            ? ERROR_COLOR
                            : progress > 70
                            ? WARNING_COLOR
                            : SUCCESS_COLOR;

                        return (
                          <View key={budget.id} style={tw`mb-3 last:mb-0`}>
                            <View
                              style={tw`flex-row justify-between items-center mb-1`}
                            >
                              <Text
                                style={[
                                  tw`text-xs font-medium`,
                                  { color: TEXT_PRIMARY },
                                ]}
                              >
                                {budget.category}
                              </Text>
                              <Text
                                style={[tw`text-xs`, { color: TEXT_SECONDARY }]}
                              >
                                {Math.round(safeNumber(progress))}%
                              </Text>
                            </View>
                            <View
                              style={[
                                tw`h-1 rounded-full overflow-hidden`,
                                { backgroundColor: Colors.surfaceLight },
                              ]}
                            >
                              <View
                                style={[
                                  tw`h-full rounded-full`,
                                  {
                                    width: `${Math.max(
                                      0,
                                      Math.min(safeNumber(progress), 100)
                                    )}%`,
                                    backgroundColor: progressColor,
                                  },
                                ]}
                              />
                            </View>
                            <Text
                              style={[
                                tw`text-xs mt-1`,
                                { color: TEXT_SECONDARY },
                              ]}
                            >
                              {formatCurrency(safeSpent)} /{" "}
                              {formatCurrency(safeLimit)}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* RIGHT COLUMN: GOALS PREVIEW */}
                  {goalsPreview.length > 0 && (
                    <View style={tw`flex-1 pl-3`}>
                      <Text
                        style={[
                          tw`text-xs font-medium mb-3`,
                          { color: TEXT_SECONDARY },
                        ]}
                      >
                        Tabungan ({goalsPreview.length})
                      </Text>
                      {goalsPreview.slice(0, 3).map((goal) => {
                        const safeCurrent = safeNumber(goal.current);
                        const safeTarget = safeNumber(goal.target);
                        const progress =
                          safeTarget > 0 ? (safeCurrent / safeTarget) * 100 : 0;
                        return (
                          <TouchableOpacity
                            key={goal.id}
                            style={tw`mb-3 last:mb-0`}
                            onPress={() => navigation.navigate("Savings")}
                            activeOpacity={0.7}
                          >
                            <View
                              style={tw`flex-row justify-between items-center mb-1`}
                            >
                              <Text
                                style={[
                                  tw`text-xs font-medium`,
                                  { color: TEXT_PRIMARY },
                                ]}
                              >
                                {goal.name}
                              </Text>
                              <Text
                                style={[tw`text-xs`, { color: TEXT_SECONDARY }]}
                              >
                                {Math.round(safeNumber(progress))}%
                              </Text>
                            </View>
                            <View
                              style={[
                                tw`h-1 rounded-full overflow-hidden`,
                                { backgroundColor: Colors.surfaceLight },
                              ]}
                            >
                              <View
                                style={[
                                  tw`h-full rounded-full`,
                                  {
                                    width: `${Math.max(
                                      0,
                                      Math.min(safeNumber(progress), 100)
                                    )}%`,
                                    backgroundColor:
                                      progress >= 80
                                        ? SUCCESS_COLOR
                                        : progress >= 50
                                        ? WARNING_COLOR
                                        : ACCENT_COLOR,
                                  },
                                ]}
                              />
                            </View>
                            <Text
                              style={[
                                tw`text-xs mt-1`,
                                { color: TEXT_SECONDARY },
                              ]}
                            >
                              {formatCurrency(safeCurrent)} /{" "}
                              {formatCurrency(safeTarget)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
            </>
          )}

        {/* MOTIVATIONAL QUOTE */}
        <View
          style={[
            tw`rounded-2xl p-4 mb-6`,
            {
              backgroundColor: Colors.surfaceLight,
              borderWidth: 1,
              borderColor: BORDER_COLOR,
            },
          ]}
        >
          <Text style={[tw`text-sm italic mb-1`, { color: ACCENT_COLOR }]}>
            {hasFinancialData
              ? "Keuangan yang sehat dimulai dari kebiasaan kecil yang konsisten."
              : "Langkah pertama menuju kebebasan finansial dimulai dari pencatatan yang baik."}
          </Text>
          <Text style={[tw`text-xs`, { color: ACCENT_COLOR }]}>
            #MyMoneyTips
          </Text>
        </View>

        {/* Spacer untuk floating button */}
        <View style={tw`h-16`} />
      </ScrollView>

      {/* FLOATING ADD BUTTON */}
      <TouchableOpacity
        style={[
          tw`absolute bottom-6 right-5 w-14 h-14 rounded-2xl items-center justify-center shadow-lg`,
          { backgroundColor: ACCENT_COLOR },
        ]}
        onPress={() => navigation.navigate("AddTransaction")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default HomeScreen;
