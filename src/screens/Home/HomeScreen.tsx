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

// Type untuk icon yang aman
type SafeIconName = keyof typeof Ionicons.glyphMap;

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
      <SafeAreaView style={tw`flex-1 bg-gray-50`}>
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={tw`mt-4 text-gray-600 text-center px-8`}>
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

    // Different greeting for new users
    if (!hasFinancialData) {
      greeting += "! 👋";
      return greeting;
    }

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
        color: "#6B7280",
        icon: "help-circle-outline" as SafeIconName,
      };
    }

    const safeScore = safeNumber(score);
    if (safeScore >= 80)
      return {
        label: "Sangat Sehat",
        color: "#10B981",
        icon: "heart-outline" as SafeIconName,
      };
    if (safeScore >= 60)
      return {
        label: "Sehat",
        color: "#F59E0B",
        icon: "checkmark-circle-outline" as SafeIconName,
      };
    if (safeScore >= 40)
      return {
        label: "Perhatian",
        color: "#F59E0B",
        icon: "alert-circle-outline" as SafeIconName,
      };
    return {
      label: "Kritis",
      color: "#EF4444",
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
        color: "#4F46E5",
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
        color: "#EF4444",
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
        color: "#10B981",
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
          color: "#F59E0B",
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
          color: "#EF4444",
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
          color: "#8B5CF6",
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
        color: "#4F46E5",
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
      color: "#4F46E5",
      onPress: () => navigation.navigate("Transactions"),
    });

    actions.push({
      id: 2,
      title: "Analitik",
      icon: "stats-chart-outline" as SafeIconName,
      color: "#10B981",
      onPress: () => navigation.navigate("Analytics"),
    });

    // Contextual actions based on time
    if (hour < 12) {
      // Morning: Budget review
      actions.push({
        id: 3,
        title: "Review Hari",
        icon: "calendar-outline" as SafeIconName,
        color: "#F59E0B",
        onPress: () => navigation.navigate("Budget"),
      });
    } else if (hour > 18) {
      // Evening: Input today's transactions
      actions.push({
        id: 3,
        title: "Catat Hari",
        icon: "checkmark-circle-outline" as SafeIconName,
        color: "#EC4899",
        onPress: () => navigation.navigate("AddTransaction"),
      });
    } else {
      // Daytime: Regular budget
      actions.push({
        id: 3,
        title: "Anggaran",
        icon: "pie-chart-outline" as SafeIconName,
        color: "#F59E0B",
        onPress: () => navigation.navigate("Budget"),
      });
    }

    // Weekend special: Weekly review
    if (isWeekend) {
      actions.push({
        id: 4,
        title: "Review Minggu",
        icon: "document-text-outline" as SafeIconName,
        color: "#8B5CF6",
        onPress: () => navigation.navigate("Analytics"),
      });
    } else {
      // Weekday: Savings focus
      actions.push({
        id: 4,
        title: "Tabungan",
        icon: "wallet-outline" as SafeIconName,
        color: "#8B5CF6",
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
          color: "#4F46E5",
          onPress: () => navigation.navigate("AddTransaction"),
        },
        {
          id: 1,
          title: "Tutorial",
          icon: "help-circle-outline" as SafeIconName,
          color: "#10B981",
          onPress: () => navigation.navigate("Analytics"),
        },
        {
          id: 2,
          title: "Anggaran",
          icon: "pie-chart-outline" as SafeIconName,
          color: "#F59E0B",
          onPress: () => navigation.navigate("Budget"),
        },
        {
          id: 3,
          title: "Tabungan",
          icon: "wallet-outline" as SafeIconName,
          color: "#8B5CF6",
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
          color: "#4F46E5",
        },
        {
          id: 2,
          label: "Pantau",
          value: "Pengeluaran",
          trend: "📊",
          color: "#10B981",
        },
        {
          id: 3,
          label: "Buat",
          value: "Target",
          unit: "Tabungan",
          trend: "🎯",
          color: "#F59E0B",
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
        color: "#10B981",
      },
      {
        id: 2,
        label: "Rata-rata/Hari",
        value: formatCurrency(avgDailyExpense),
        trend: avgDailyExpense > 100000 ? "↑" : "↓",
        color: "#F59E0B",
      },
      {
        id: 3,
        label: "Transaksi",
        value: thisMonthTransactions.toString(),
        unit: "bulan ini",
        trend: transactionGrowth >= 0 ? "+" : "-",
        color: "#4F46E5",
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
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-5 pb-24`}
      >
        {/* HEADER WITH HEALTH SCORE */}
        <View style={tw`flex-row justify-between items-center pt-3 pb-3`}>
          <View style={tw`flex-1`}>
            <Text style={tw`text-gray-800 text-xl font-bold`}>
              {getPersonalizedGreeting()}
            </Text>
            <Text style={tw`text-gray-500 text-sm mt-0.5`}>
              {getCurrentDate()}
            </Text>
          </View>

          {/* Health Score Badge - IMPROVED */}
          {healthScore !== null ? (
            <TouchableOpacity
              style={[
                tw`px-3 py-2 rounded-xl items-center justify-center`,
                { backgroundColor: `${healthStatus.color}15` },
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
              <Text style={[tw`text-xs mt-0.5`, { color: healthStatus.color }]}>
                {healthStatus.label}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={tw`px-3 py-2 rounded-xl items-center justify-center bg-gray-100`}
              onPress={() => navigation.navigate("AddTransaction")}
            >
              <View style={tw`flex-row items-center`}>
                <Ionicons name="add-circle-outline" size={16} color="#4F46E5" />
                <Text style={tw`ml-1 text-xs font-medium text-gray-700`}>
                  Mulai
                </Text>
              </View>
              <Text style={tw`text-xs mt-0.5 text-gray-500`}>Tambah Data</Text>
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
                  { backgroundColor: `${insight.color}15` },
                ]}
                onPress={insight.onPress}
                activeOpacity={0.7}
              >
                <View style={tw`flex-row items-start`}>
                  <View
                    style={[
                      tw`w-8 h-8 rounded-lg items-center justify-center mr-2`,
                      { backgroundColor: `${insight.color}25` },
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
                    <Text style={tw`text-xs text-gray-700 mb-2`}>
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
          style={tw`bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100`}
        >
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text
              style={tw`text-gray-500 text-xs font-medium uppercase tracking-wider`}
            >
              {hasFinancialData ? "SALDO ANDA" : "SELAMAT DATANG"}
            </Text>
            <View style={tw`px-2 py-1 bg-gray-100 rounded-full`}>
              <Text style={tw`text-gray-600 text-xs font-medium`}>
                {hasFinancialData
                  ? `Hari ke-${monthlyProgress.currentDay} dari ${monthlyProgress.daysInMonth}`
                  : "Hari Pertama"}
              </Text>
            </View>
          </View>

          <Text style={tw`text-gray-800 text-2xl font-bold mb-5`}>
            {hasFinancialData
              ? formatCurrency(safeNumber(state.balance))
              : "Rp 0"}
          </Text>

          {/* Monthly Progress Bar */}
          <View style={tw`mb-4`}>
            <View style={tw`flex-row justify-between items-center mb-1`}>
              <Text style={tw`text-gray-600 text-xs`}>
                {hasFinancialData ? "Progress Bulan Ini" : "Siap Memulai?"}
              </Text>
              <Text style={tw`text-gray-600 text-xs font-medium`}>
                {hasFinancialData
                  ? `${safeNumber(monthlyProgress.progress).toFixed(0)}%`
                  : "0%"}
              </Text>
            </View>
            <View style={tw`h-1.5 bg-gray-100 rounded-full overflow-hidden`}>
              <View
                style={[
                  tw`h-full rounded-full`,
                  {
                    width: `${Math.max(
                      0,
                      Math.min(safeNumber(monthlyProgress.progress), 100)
                    )}%`,
                  },
                  hasFinancialData
                    ? (monthlyProgress.status === "surplus" &&
                        tw`bg-emerald-500`,
                      monthlyProgress.status === "warning" && tw`bg-yellow-500`,
                      monthlyProgress.status === "deficit" && tw`bg-red-500`)
                    : tw`bg-gray-300`,
                ]}
              />
            </View>
          </View>

          <View style={tw`flex-row items-center`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-gray-500 text-xs mb-1`}>Pemasukan</Text>
              <Text style={tw`text-emerald-600 text-base font-semibold`}>
                {formatCurrency(safeNumber(state.totalIncome))}
              </Text>
            </View>

            <View style={tw`w-px h-10 bg-gray-200 mx-4`} />

            <View style={tw`flex-1`}>
              <Text style={tw`text-gray-500 text-xs mb-1`}>Pengeluaran</Text>
              <Text style={tw`text-red-500 text-base font-semibold`}>
                {formatCurrency(safeNumber(state.totalExpense))}
              </Text>
              <Text style={tw`text-gray-400 text-xs`}>
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
            <View style={tw`mt-3 pt-3 border-t border-gray-100`}>
              <Text style={tw`text-gray-500 text-xs mb-1`}>
                Proyeksi akhir bulan ({monthlyProgress.daysRemaining} hari
                lagi):
              </Text>
              <Text
                style={[
                  tw`text-base font-semibold`,
                  monthlyProgress.projectedBalance >= 0
                    ? tw`text-emerald-600`
                    : tw`text-red-600`,
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
                  { backgroundColor: `${action.color}15` },
                ]}
              >
                <Ionicons name={action.icon} size={20} color={action.color} />
              </View>
              <Text style={tw`text-gray-700 text-xs font-medium text-center`}>
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* QUICK STATS - HORIZONTAL COMPACT */}
        <View style={tw`bg-white rounded-xl p-3 mb-6 border border-gray-100`}>
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
                  <Text style={tw`text-gray-500 text-xs text-center`}>
                    {stat.label}
                  </Text>
                </View>
                {index < quickStats.length - 1 && (
                  <View style={tw`w-px h-8 bg-gray-200`} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* RECENT TRANSACTIONS HEADER */}
        <View style={tw`flex-row justify-between items-center mb-4`}>
          <Text style={tw`text-gray-800 text-lg font-semibold`}>
            {hasFinancialData ? "Transaksi Terbaru" : "Mulai Catat Keuangan"}
          </Text>
          {state.transactions.length > 0 ? (
            <TouchableOpacity
              onPress={() => navigation.navigate("Transactions")}
            >
              <Text style={tw`text-indigo-600 text-sm font-medium`}>
                Lihat Semua
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate("AddTransaction")}
            >
              <Text style={tw`text-indigo-600 text-sm font-medium`}>
                Mulai Sekarang
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {/* TRANSACTIONS LIST */}
        {state.transactions.length > 0 ? (
          <View
            style={tw`bg-white rounded-2xl mb-6 overflow-hidden border border-gray-100`}
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
                    index < 2 && tw`border-b border-gray-100`,
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
                          ? tw`bg-emerald-50`
                          : tw`bg-red-50`,
                      ]}
                    >
                      <Ionicons
                        name={getTransactionIcon(transaction.category)}
                        size={18}
                        color={
                          transaction.type === "income" ? "#10B981" : "#EF4444"
                        }
                      />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text
                        style={tw`text-gray-800 text-sm font-medium mb-0.5`}
                      >
                        {transaction.category}
                      </Text>
                      <Text style={tw`text-gray-500 text-xs mb-1`}>
                        {transaction.description || "Tidak ada deskripsi"}
                      </Text>
                      <Text style={tw`text-gray-400 text-xs`}>
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
                        ? tw`text-emerald-600`
                        : tw`text-red-500`,
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
            style={tw`bg-white rounded-2xl p-8 items-center mb-6 border border-gray-100`}
          >
            <View
              style={tw`w-16 h-16 rounded-xl bg-indigo-50 items-center justify-center mb-4`}
            >
              <Ionicons name="wallet-outline" size={28} color="#4F46E5" />
            </View>
            <Text style={tw`text-gray-800 text-base font-semibold mb-1`}>
              Selamat Datang di MyMoney!
            </Text>
            <Text style={tw`text-gray-500 text-sm text-center mb-5 leading-5`}>
              Mulai kelola keuangan Anda dengan mencatat transaksi pertama
            </Text>
            <TouchableOpacity
              style={tw`bg-indigo-600 px-5 py-2.5 rounded-lg flex-row items-center`}
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
                <Text style={tw`text-gray-800 text-lg font-semibold`}>
                  Progress & Target
                </Text>
                <View style={tw`flex-row gap-3`}>
                  {state.budgets.length > 0 && (
                    <TouchableOpacity
                      onPress={() => navigation.navigate("Budget")}
                    >
                      <Text style={tw`text-indigo-600 text-sm font-medium`}>
                        Anggaran
                      </Text>
                    </TouchableOpacity>
                  )}
                  {goalsPreview.length > 0 && (
                    <TouchableOpacity
                      onPress={() => navigation.navigate("Savings")}
                    >
                      <Text style={tw`text-emerald-600 text-sm font-medium`}>
                        Tabungan
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View
                style={tw`bg-white rounded-2xl p-4 mb-6 border border-gray-100`}
              >
                <View style={tw`flex-row`}>
                  {/* LEFT COLUMN: BUDGET SUMMARY - FIXED division by zero */}
                  {state.budgets.length > 0 && (
                    <View style={tw`flex-1 pr-3 border-r border-gray-200`}>
                      <Text style={tw`text-gray-600 text-xs font-medium mb-3`}>
                        Anggaran ({state.budgets.slice(0, 3).length})
                      </Text>
                      {state.budgets.slice(0, 3).map((budget) => {
                        const safeSpent = safeNumber(budget.spent);
                        const safeLimit = safeNumber(budget.limit);
                        const progress =
                          safeLimit > 0 ? (safeSpent / safeLimit) * 100 : 0;
                        const progressColor =
                          progress > 90
                            ? "#EF4444"
                            : progress > 70
                            ? "#F59E0B"
                            : "#10B981";

                        return (
                          <View key={budget.id} style={tw`mb-3 last:mb-0`}>
                            <View
                              style={tw`flex-row justify-between items-center mb-1`}
                            >
                              <Text
                                style={tw`text-gray-700 text-xs font-medium`}
                              >
                                {budget.category}
                              </Text>
                              <Text style={tw`text-gray-400 text-xs`}>
                                {Math.round(safeNumber(progress))}%
                              </Text>
                            </View>
                            <View
                              style={tw`h-1 bg-gray-100 rounded-full overflow-hidden`}
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
                            <Text style={tw`text-gray-400 text-xs mt-1`}>
                              {formatCurrency(safeSpent)} /{" "}
                              {formatCurrency(safeLimit)}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* RIGHT COLUMN: GOALS PREVIEW - FIXED division by zero */}
                  {goalsPreview.length > 0 && (
                    <View style={tw`flex-1 pl-3`}>
                      <Text style={tw`text-gray-600 text-xs font-medium mb-3`}>
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
                                style={tw`text-gray-700 text-xs font-medium`}
                              >
                                {goal.name}
                              </Text>
                              <Text style={tw`text-gray-400 text-xs`}>
                                {Math.round(safeNumber(progress))}%
                              </Text>
                            </View>
                            <View
                              style={tw`h-1 bg-gray-100 rounded-full overflow-hidden`}
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
                                        ? "#10B981"
                                        : progress >= 50
                                        ? "#F59E0B"
                                        : "#4F46E5",
                                  },
                                ]}
                              />
                            </View>
                            <Text style={tw`text-gray-400 text-xs mt-1`}>
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

        {/* MOTIVATIONAL QUOTE (Bonus) */}
        <View
          style={tw`bg-indigo-50 rounded-2xl p-4 mb-6 border border-indigo-100`}
        >
          <Text style={tw`text-indigo-800 text-sm italic mb-1`}>
            {hasFinancialData
              ? "Keuangan yang sehat dimulai dari kebiasaan kecil yang konsisten."
              : "Langkah pertama menuju kebebasan finansial dimulai dari pencatatan yang baik."}
          </Text>
          <Text style={tw`text-indigo-600 text-xs`}>#MyMoneyTips</Text>
        </View>
        {/* Spacer untuk floating button */}
        <View style={tw`h-16`} />
      </ScrollView>

      {/* FLOATING ADD BUTTON */}
      <TouchableOpacity
        style={tw`absolute bottom-6 right-5 w-14 h-14 bg-indigo-600 rounded-2xl items-center justify-center shadow-lg`}
        onPress={() => navigation.navigate("AddTransaction")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default HomeScreen;
