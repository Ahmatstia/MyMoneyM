// File: src/screens/HomeScreen.tsx
import React, { useMemo, useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import {
  formatCurrency,
  safeNumber,
  safePositiveNumber,
  TimeFilter,
  filterTransactionsByTime,
  calculateTotals,
  getActiveCycleInfo,
  calculateProjection,
  calculateOpeningBalance,
} from "../../utils/calculations";
import { calculateTransactionAnalytics } from "../../utils/analytics";
import { calculateFinancialHealthScore } from "../../utils/analytics";

import { Colors } from "../../theme/theme";

type SafeIconName = keyof typeof Ionicons.glyphMap;

// ─── Tema warna (sama persis dengan aslinya) ──────────────────────────────────
const PRIMARY_COLOR    = Colors.primary;
const ACCENT_COLOR     = Colors.accent;
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR    = Colors.surface;
const TEXT_PRIMARY     = Colors.textPrimary;
const TEXT_SECONDARY   = Colors.textSecondary;
const BORDER_COLOR     = Colors.border;
const SUCCESS_COLOR    = Colors.success;
const WARNING_COLOR    = Colors.warning;
const ERROR_COLOR      = Colors.error;

// ─── Komponen UI kecil ────────────────────────────────────────────────────────

/** Garis pemisah tipis antar section — menggantikan card wrapper */
const Sep = ({ marginV = 20 }: { marginV?: number }) => (
  <View
    style={{
      height: 1,
      backgroundColor: SURFACE_COLOR,
      marginHorizontal: -16,
      marginVertical: marginV,
    }}
  />
);

/** Header section dengan label uppercase dan link opsional */
const SectionHeader = ({
  title,
  linkLabel,
  onPress,
}: {
  title: string;
  linkLabel?: string;
  onPress?: () => void;
}) => (
  <View style={tw`flex-row justify-between items-center mb-3`}>
    <Text
      style={{
        color: Colors.gray400,
        fontSize: 10,
        fontWeight: "600",
        letterSpacing: 1,
        textTransform: "uppercase",
      }}
    >
      {title}
    </Text>
    {linkLabel && onPress && (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Text style={{ color: ACCENT_COLOR, fontSize: 12 }}>{linkLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Main component ───────────────────────────────────────────────────────────

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state, isLoading, refreshData } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("monthly");

  const activeCycle = useMemo(() => getActiveCycleInfo(state.transactions), [state.transactions]);

  const filteredTransactions = useMemo(
    () => filterTransactionsByTime(state.transactions, timeFilter),
    [state.transactions, timeFilter]
  );

  const { totalIncome: filteredIncome, totalExpense: filteredExpense, balance: filteredPeriodNetto } = useMemo(
    () => calculateTotals(filteredTransactions),
    [filteredTransactions]
  );

  const openingBalance = useMemo(() => {
    if (timeFilter === "all") return 0;
    
    const now = new Date();
    let startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    startDate.setHours(0,0,0,0);
    let cycleIncomeId: string | undefined;

    if (timeFilter === "weekly") {
      const cycle = getActiveCycleInfo(state.transactions);
      if (cycle) {
        startDate = cycle.startDate;
        cycleIncomeId = cycle.cycleIncomeId;
      } else {
        const currentDay = now.getDay() === 0 ? 7 : now.getDay();
        startDate.setDate(now.getDate() - currentDay + 1);
      }
    } else if (timeFilter === "monthly") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeFilter === "yearly") {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    return calculateOpeningBalance(state.transactions, startDate, cycleIncomeId);
  }, [state.transactions, timeFilter]);

  const filteredBalance = useMemo(
    () => openingBalance + filteredPeriodNetto,
    [openingBalance, filteredPeriodNetto]
  );

  // ── Helper icon aman (sama dengan asli) ──────────────────────────────────
  const getSafeIcon = (iconName: string): SafeIconName => {
    const defaultIcon: SafeIconName = "receipt-outline";
    if (iconName in Ionicons.glyphMap) {
      return iconName as SafeIconName;
    }
    return defaultIcon;
  };

  // ── Refresh handler (sama dengan asli) ───────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  // ── Cek apakah ada data keuangan (sama dengan asli) ──────────────────────
  const hasFinancialData = useMemo(() => {
    return (
      state.transactions.length > 0 ||
      state.budgets.length > 0 ||
      state.savings.length > 0
    );
  }, [state.transactions, state.budgets, state.savings]);

  // ── Transaction analytics (sama dengan asli) ─────────────────────────────
  const transactionAnalytics = useMemo(() => {
    if (!hasFinancialData) {
      const now = new Date();
      return {
        timeRange: "month" as const,
        startDate: now,
        endDate: now,
        totalIncome: 0,
        totalExpense: 0,
        netSavings: 0,
        savingsRate: 0,
        avgDailyExpense: 0,
        dailyTrends: [],
        topCategories: [],
        transactionCount: 0,
        incomeTransactionCount: 0,
        expenseTransactionCount: 0,
      };
    }
    const analytics = calculateTransactionAnalytics(state.transactions, "month");
    return {
      ...analytics,
      totalIncome:     safeNumber(analytics.totalIncome),
      totalExpense:    safeNumber(analytics.totalExpense),
      netSavings:      safeNumber(analytics.netSavings),
      savingsRate:     safeNumber(analytics.savingsRate),
      avgDailyExpense: safeNumber(analytics.avgDailyExpense),
    };
  }, [state.transactions, hasFinancialData]);

  // ── Financial health score (sama dengan asli) ─────────────────────────────
  const financialHealthScore = useMemo(() => {
    try {
      if (!hasFinancialData) {
        return {
          overallScore: 0,
          category: "Belum Ada Data",
          color: Colors.gray400,
          factors: {
            savingsRate:     { score: 0, weight: 0.3,  status: "poor" as const },
            budgetAdherence: { score: 0, weight: 0.3,  status: "poor" as const },
            expenseControl:  { score: 0, weight: 0.25, status: "poor" as const },
            goalProgress:    { score: 0, weight: 0.15, status: "poor" as const },
          },
          recommendations: [
            "Mulai dengan mencatat semua transaksi secara rutin",
            "Buat anggaran untuk kategori pengeluaran utama",
          ],
        };
      }

      const budgetAnalytics = {
        hasBudgets: state.budgets.length > 0,
        totalBudget: state.budgets.reduce((sum, b) => sum + safePositiveNumber(b.limit), 0),
        totalSpent:  state.budgets.reduce((sum, b) => sum + safePositiveNumber(b.spent), 0),
        utilizationRate:
          state.budgets.reduce((sum, b) => sum + safePositiveNumber(b.limit), 0) > 0
            ? (state.budgets.reduce((sum, b) => sum + safePositiveNumber(b.spent), 0) /
               state.budgets.reduce((sum, b) => sum + safePositiveNumber(b.limit), 0)) * 100
            : 0,
        overBudgetCount: state.budgets.filter(
          (b) => safePositiveNumber(b.spent) > safePositiveNumber(b.limit)
        ).length,
        underBudgetCount: state.budgets.filter(
          (b) => safePositiveNumber(b.spent) <= safePositiveNumber(b.limit)
        ).length,
        budgetsAtRisk: state.budgets.filter(
          (b) => safePositiveNumber(b.spent) > safePositiveNumber(b.limit) * 0.8
        ),
      };

      const savingsAnalytics = {
        hasSavings: state.savings.length > 0,
        totalTarget:  state.savings.reduce((sum, s) => sum + safePositiveNumber(s.target), 0),
        totalCurrent: state.savings.reduce((sum, s) => sum + safePositiveNumber(s.current), 0),
        overallProgress:
          state.savings.reduce((sum, s) => sum + safePositiveNumber(s.target), 0) > 0
            ? (state.savings.reduce((sum, s) => sum + safePositiveNumber(s.current), 0) /
               state.savings.reduce((sum, s) => sum + safePositiveNumber(s.target), 0)) * 100
            : 0,
        completedSavings: state.savings.filter(
          (s) => safePositiveNumber(s.current) >= safePositiveNumber(s.target)
        ).length,
        activeSavings: state.savings.filter(
          (s) => safePositiveNumber(s.current) < safePositiveNumber(s.target)
        ).length,
        nearingCompletion: state.savings.filter((s) => {
          const target  = safePositiveNumber(s.target);
          const current = safePositiveNumber(s.current);
          return target > 0 && current / target >= 0.8 && current < target;
        }),
      };

      // Hitung total sisa hutang aktif (borrowed) sebagai beban keuangan
      const totalActiveDebt = (state.debts || [])
        .filter((d) => d.type === "borrowed" && d.status !== "paid")
        .reduce((sum, d) => sum + safePositiveNumber(d.remaining), 0);

      return calculateFinancialHealthScore(
        {
          transactionCount: filteredTransactions.length,
          totalIncome: filteredIncome,
          totalExpense: filteredExpense,
        } as any,
        budgetAnalytics,
        savingsAnalytics,
        totalActiveDebt
      );
    } catch (error) {
      console.error("Error calculating health score:", error);
      return {
        overallScore: 50,
        category: "Cukup",
        color: Colors.warning,
        factors: {
          savingsRate:     { score: 50, weight: 0.3,  status: "warning" as const },
          budgetAdherence: { score: 50, weight: 0.3,  status: "warning" as const },
          expenseControl:  { score: 50, weight: 0.25, status: "warning" as const },
          goalProgress:    { score: 50, weight: 0.15, status: "warning" as const },
        },
        recommendations: [
          "Mulai dengan mencatat semua transaksi secara rutin",
          "Buat anggaran untuk kategori pengeluaran utama",
        ],
      };
    }
  }, [state.budgets, state.savings, transactionAnalytics, hasFinancialData]);

  // ── Personalized greeting (sama dengan asli) ──────────────────────────────
  const getPersonalizedGreeting = () => {
    const hour = new Date().getHours();
    let greeting = "";
    if (hour < 12)      greeting = "Selamat Pagi";
    else if (hour < 15) greeting = "Selamat Siang";
    else if (hour < 19) greeting = "Selamat Sore";
    else                greeting = "Selamat Malam";

    if (safeNumber(transactionAnalytics.savingsRate) >= 30) {
      greeting += "! 💰 Tabungan Luar Biasa";
    } else if (safeNumber(state.balance) > safeNumber(state.totalIncome) * 0.5) {
      greeting += "! 👍 Saldo Sehat";
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

  // ── Smart insights (sama dengan asli) ─────────────────────────────────────
  const getSmartInsights = () => {
    const insights = [];

    if (!hasFinancialData) {
      insights.push({
        type: "info",
        title: "Mulai Catat Keuangan",
        message: "Tambahkan transaksi pertama Anda untuk melihat analisis keuangan",
        icon: "add-circle-outline" as SafeIconName,
        color: ACCENT_COLOR,
        action: "Tambah Transaksi",
        onPress: () => navigation.navigate("AddTransaction"),
      });
      return insights;
    }

    if (transactionAnalytics.savingsRate < 10) {
      insights.push({
        type: "warning",
        title: "Rasio Tabungan Rendah",
        message: `Hanya ${safeNumber(transactionAnalytics.savingsRate).toFixed(1)}% dari pemasukan disimpan`,
        icon: "trending-down-outline" as SafeIconName,
        color: ERROR_COLOR,
        action: "Tingkatkan ke 20%",
        onPress: () => navigation.navigate("Analytics"),
      });
    } else if (transactionAnalytics.savingsRate >= 20) {
      insights.push({
        type: "success",
        title: "Rasio Tabungan Baik!",
        message: `${safeNumber(transactionAnalytics.savingsRate).toFixed(1)}% pemasukan berhasil disimpan`,
        icon: "trending-up-outline" as SafeIconName,
        color: SUCCESS_COLOR,
        action: "Pertahankan!",
        onPress: () => navigation.navigate("Analytics"),
      });
    }

    if (transactionAnalytics.topCategories.length > 0) {
      const [topCategory, topAmount] = transactionAnalytics.topCategories[0];
      const safeTopAmount    = safeNumber(topAmount);
      const safeTotalExpense = safeNumber(transactionAnalytics.totalExpense);
      const percentage =
        safeTotalExpense > 0 ? (safeTopAmount / safeTotalExpense) * 100 : 0;

      if (percentage > 40) {
        insights.push({
          type: "warning",
          title: "Konsentrasi Pengeluaran Tinggi",
          message: `${topCategory} menghabiskan ${safeNumber(percentage).toFixed(0)}% dari total pengeluaran`,
          icon: "pie-chart-outline" as SafeIconName,
          color: WARNING_COLOR,
          action: "Diversifikasi",
          onPress: () => navigation.navigate("Analytics", { tab: "categories" }),
        });
      }
    }

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

    if (state.savings.length > 0) {
      const nearingCompletion = state.savings.filter((s) => {
        const safeCurrent = safeNumber(s.current);
        const safeTarget  = safeNumber(s.target);
        return safeTarget > 0 && safeCurrent / safeTarget >= 0.8 && safeCurrent < safeTarget;
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

    if (financialHealthScore.overallScore < 40) {
      insights.push({
        type: "warning",
        title: "Kesehatan Keuangan Perlu Perhatian",
        message: `Skor kesehatan: ${financialHealthScore.overallScore}/100`,
        icon: "heart-outline" as SafeIconName,
        color: ERROR_COLOR,
        action: "Lihat Detail",
        onPress: () => navigation.navigate("Analytics", { tab: "health" }),
      });
    }

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

    return insights.slice(0, 3);
  };

  const smartInsights = useMemo(
    () => getSmartInsights(),
    [hasFinancialData, transactionAnalytics, state.budgets, state.savings, financialHealthScore]
  );

  // ── Static quick actions ──────────────────────────────
  const getDynamicQuickActions = () => {
    return [
      {
        id: "transactions",
        title: "Transaksi",
        icon: "swap-horizontal-outline" as SafeIconName,
        color: ACCENT_COLOR,
        onPress: () => navigation.navigate("Transactions"),
      },
      {
        id: "budget",
        title: "Anggaran",
        icon: "pie-chart-outline" as SafeIconName,
        color: WARNING_COLOR,
        onPress: () => navigation.navigate("Budget"),
      },
      {
        id: "analytics",
        title: "Analitik",
        icon: "stats-chart-outline" as SafeIconName,
        color: SUCCESS_COLOR,
        onPress: () => navigation.navigate("Analytics"),
      },
      {
        id: "debt",
        title: "Hutang",
        icon: "card-outline" as SafeIconName,
        color: ERROR_COLOR,
        onPress: () => navigation.navigate("Debt"),
      },
    ];
  };

  const dynamicQuickActions = useMemo(
    () => getDynamicQuickActions(),
    [navigation]
  );

  // ── Dynamic projection (DIPERBAIKI: Mengikuti filter waktu) ────────────────
  const projectionData = useMemo(() => {
    if (!hasFinancialData || timeFilter === "all") return null;

    const now = new Date();
    let startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    let label = "akhir bulan";

    if (timeFilter === "weekly") {
      if (activeCycle) {
        startDate = activeCycle.startDate;
        endDate = activeCycle.endDate;
        label = "akhir siklus";
      } else {
        const currentDay = now.getDay() === 0 ? 7 : now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - currentDay + 1);
        startDate.setHours(0,0,0,0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23,59,59,999);
        label = "akhir minggu";
      }
    } else if (timeFilter === "yearly") {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      label = "akhir tahun";
    }

    // Proyeksi harus memperhitungkan total uang yang tersedia (Saldo Bawaan + Pemasukan)
    const totalAvailableCash = filteredIncome + openingBalance;

    return {
      ...calculateProjection(totalAvailableCash, filteredExpense, startDate, endDate, now),
      label,
    };
  }, [hasFinancialData, timeFilter, activeCycle, filteredIncome, filteredExpense, openingBalance]);

  // ── Goals preview (sama dengan asli) ─────────────────────────────────────
  const getGoalsPreview = () => {
    if (state.savings.length === 0) return [];
    return state.savings
      .filter((s) => {
        const safeCurrent = safeNumber(s.current);
        const safeTarget  = safeNumber(s.target);
        return safeTarget > 0 && safeCurrent < safeTarget;
      })
      .sort((a, b) => {
        const aProgress =
          safeNumber(a.target) > 0
            ? safeNumber(a.current) / Math.max(1, safeNumber(a.target))
            : 0;
        const bProgress =
          safeNumber(b.target) > 0
            ? safeNumber(b.current) / Math.max(1, safeNumber(b.target))
            : 0;
        return bProgress - aProgress;
      })
      .slice(0, 3);
  };

  const goalsPreview = useMemo(() => getGoalsPreview(), [state.savings]);

  // ── Quick stats (sama dengan asli) ────────────────────────────────────────
  const getQuickStats = () => {
    if (!hasFinancialData) {
      return [
        { id: "start",  label: "Mulai Dengan", value: "Transaksi", unit: "Pertama", color: Colors.info },
        { id: "track",  label: "Pantau",        value: "Pengeluaran",                color: SUCCESS_COLOR },
        { id: "target", label: "Buat",          value: "Target",    unit: "Tabungan", color: WARNING_COLOR },
      ];
    }

    const daysPassed = projectionData?.daysPassed || 7;
    
    // Hitung berapa hari unik yang ada pengeluaran dalam filter saat ini
    const expenseDaysCount = new Set(
      filteredTransactions
        .filter((t) => t.type === "expense")
        .map((t) => new Date(t.date).toDateString())
    ).size;

    const daysWithoutSpending = Math.max(0, daysPassed - expenseDaysCount);

    // DIPERBAIKI: Menggunakan rata-rata harian dari siklus aktif (bukan bagi 30 kaku)
    const avgDaily = projectionData?.dailyAvgExpense || 0;

    // DIPERBAIKI: Transaksi mengikuti filter waktu yang aktif
    const currentTransactionCount = filteredTransactions.length;
    
    return [
      {
        id: "spending_streak",
        label: timeFilter === "all" ? "Hari Tanpa Pengeluaran" : `Tanpa Pengeluaran (${timeFilter})`,
        value: daysWithoutSpending.toString(),
        unit: "hari",
        trend: daysWithoutSpending >= (daysPassed * 0.5) ? "↓" : "↑",
        trendLabel: daysWithoutSpending >= (daysPassed * 0.5) ? "Bagus" : "Boros",
        color: daysWithoutSpending >= (daysPassed * 0.5) ? SUCCESS_COLOR : WARNING_COLOR,
      },
      {
        id: "daily_avg",
        label: "Rata-rata / Hari",
        value: avgDaily >= 1000000 
          ? `${(avgDaily / 1000000).toFixed(1)}jt` 
          : avgDaily >= 1000 
            ? `${(avgDaily / 1000).toFixed(0)}rb` 
            : avgDaily.toString(),
        unit: "IDR",
        trend: avgDaily < 100000 ? "↓" : "↑",
        trendLabel: avgDaily < 100000 ? "Hemat" : "Tinggi",
        color: avgDaily < 100000 ? SUCCESS_COLOR : ERROR_COLOR,
      },
      {
        id: "transactions_count",
        label: "Transaksi",
        value: currentTransactionCount.toString(),
        unit: timeFilter === "all" ? "total" : timeFilter === "weekly" ? "siklus" : "periode",
        trend: currentTransactionCount > 10 ? "↑" : "↓",
        trendLabel: timeFilter === "all" ? "Selama ini" : timeFilter === "weekly" ? "Siklus ini" : timeFilter === "monthly" ? "Bulan ini" : "Tahun ini",
        color: ACCENT_COLOR,
      },
    ];
  };

  const quickStats = useMemo(
    () => getQuickStats(),
    [hasFinancialData, state.transactions, projectionData, filteredTransactions, timeFilter]
  );

  // ── Helper functions (sama dengan asli) ───────────────────────────────────
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
    Makanan:      "restaurant-outline",
    Transportasi: "car-outline",
    Belanja:      "cart-outline",
    Hiburan:      "film-outline",
    Kesehatan:    "medical-outline",
    Pendidikan:   "school-outline",
    Gaji:         "cash-outline",
    Investasi:    "trending-up-outline",
    Lainnya:      "ellipsis-horizontal-outline",
  };

  const getTransactionIcon = (category: string): SafeIconName => {
    const icon = transactionIcons[category];
    return icon ? getSafeIcon(icon) : "receipt-outline";
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 50 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return Colors.success;
    if (score >= 60) return Colors.info;
    if (score >= 40) return Colors.warning;
    if (score >= 20) return Colors.error;
    return Colors.errorDark;
  };

  const getScoreDescription = (score: number) => {
    if (score >= 80) return "Sangat Sehat";
    if (score >= 60) return "Sehat";
    if (score >= 40) return "Cukup";
    if (score >= 20) return "Perlu Perbaikan";
    return "Kritis";
  };

  // ── Skeleton loading ───────────────────────────────────────────────────────
  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
          {/* Header skeleton */}
          <View style={tw`flex-row justify-between items-center pt-4 pb-3`}>
            <View style={tw`flex-1`}>
              <View style={[tw`h-6 rounded-lg mb-2 w-52`, { backgroundColor: SURFACE_COLOR }]} />
              <View style={[tw`h-3 rounded-lg w-36`,      { backgroundColor: SURFACE_COLOR }]} />
            </View>
            <View style={[tw`w-28 h-10 rounded-full`, { backgroundColor: SURFACE_COLOR }]} />
          </View>

          <View style={{ height: 1, backgroundColor: SURFACE_COLOR, marginHorizontal: -16, marginVertical: 16 }} />

          {/* Balance skeleton */}
          <View style={[tw`h-3 rounded-lg w-10 mb-3`,  { backgroundColor: SURFACE_COLOR }]} />
          <View style={[tw`h-10 rounded-lg w-48 mb-4`, { backgroundColor: SURFACE_COLOR }]} />
          <View style={tw`flex-row gap-4 mb-4`}>
            <View style={[tw`flex-1 h-10 rounded-lg`, { backgroundColor: SURFACE_COLOR }]} />
            <View style={{ width: 1, backgroundColor: SURFACE_COLOR }} />
            <View style={[tw`flex-1 h-10 rounded-lg`, { backgroundColor: SURFACE_COLOR }]} />
          </View>
          <View style={[tw`h-1 rounded-full mb-2`, { backgroundColor: SURFACE_COLOR }]} />

          <View style={{ height: 1, backgroundColor: SURFACE_COLOR, marginHorizontal: -16, marginVertical: 16 }} />

          {/* Pills skeleton */}
          <View style={tw`flex-row gap-2 mb-4`}>
            {[130, 110, 100].map((w, i) => (
              <View key={i} style={[tw`h-7 rounded-full`, { width: w, backgroundColor: SURFACE_COLOR }]} />
            ))}
          </View>

          <View style={{ height: 1, backgroundColor: SURFACE_COLOR, marginHorizontal: -16, marginVertical: 16 }} />

          {/* Quick actions skeleton */}
          <View style={[tw`h-3 rounded-lg w-20 mb-4`, { backgroundColor: SURFACE_COLOR }]} />
          <View style={tw`flex-row justify-between mb-2`}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={tw`items-center w-1/4`}>
                <View style={[tw`w-10 h-10 rounded-xl mb-2`, { backgroundColor: SURFACE_COLOR }]} />
                <View style={[tw`h-2.5 rounded-lg w-12`,     { backgroundColor: SURFACE_COLOR }]} />
              </View>
            ))}
          </View>

          <View style={{ height: 1, backgroundColor: SURFACE_COLOR, marginHorizontal: -16, marginVertical: 16 }} />

          {/* Stats skeleton */}
          <View style={[tw`h-3 rounded-lg w-16 mb-4`, { backgroundColor: SURFACE_COLOR }]} />
          <View style={tw`flex-row gap-3 mb-2`}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[tw`flex-1 h-16 rounded-xl`, { backgroundColor: SURFACE_COLOR }]} />
            ))}
          </View>

          <View style={{ height: 1, backgroundColor: SURFACE_COLOR, marginHorizontal: -16, marginVertical: 16 }} />

          {/* Transactions skeleton */}
          <View style={[tw`h-3 rounded-lg w-32 mb-4`, { backgroundColor: SURFACE_COLOR }]} />
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                tw`flex-row items-center py-3`,
                i < 3 && { borderBottomWidth: 1, borderBottomColor: SURFACE_COLOR },
              ]}
            >
              <View style={[tw`w-9 h-9 rounded-xl mr-3`,      { backgroundColor: SURFACE_COLOR }]} />
              <View style={tw`flex-1`}>
                <View style={[tw`h-3 rounded-lg w-24 mb-1.5`, { backgroundColor: SURFACE_COLOR }]} />
                <View style={[tw`h-2.5 rounded-lg w-36`,      { backgroundColor: SURFACE_COLOR }]} />
              </View>
              <View style={[tw`h-3 rounded-lg w-20`, { backgroundColor: SURFACE_COLOR }]} />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[ACCENT_COLOR]}
            tintColor={ACCENT_COLOR}
            title="Memperbarui data..."
            titleColor={TEXT_SECONDARY}
          />
        }
      >
        {/* ════════════════════════════════════════
            HEADER
        ════════════════════════════════════════ */}
        <View style={tw`flex-row justify-between items-start pt-3 pb-2`}>
          <View style={tw`flex-1 pr-3`}>
            <Text style={{ color: TEXT_PRIMARY, fontSize: 20, fontWeight: "700", marginBottom: 3 }}>
              {getPersonalizedGreeting()}
            </Text>
            <Text style={{ color: Colors.gray400, fontSize: 11 }}>{getCurrentDate()}</Text>
          </View>

          {/* Health score chip */}
          {hasFinancialData ? (
            <TouchableOpacity
              style={[
                tw`flex-row items-center px-3 py-2 rounded-full`,
                {
                  backgroundColor: `${getScoreColor(financialHealthScore.overallScore)}15`,
                  borderWidth: 1,
                  borderColor: `${getScoreColor(financialHealthScore.overallScore)}35`,
                },
              ]}
              onPress={() => navigation.navigate("Analytics", { tab: "health" })}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: getScoreColor(financialHealthScore.overallScore),
                  fontSize: 15,
                  fontWeight: "700",
                  marginRight: 6,
                }}
              >
                {financialHealthScore.overallScore}
              </Text>
              <View>
                <Text
                  style={{
                    color: getScoreColor(financialHealthScore.overallScore),
                    fontSize: 10,
                    fontWeight: "600",
                  }}
                >
                  {getScoreDescription(financialHealthScore.overallScore)}
                </Text>
                <Text style={{ color: Colors.gray400, fontSize: 9 }}>Skor keuangan</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                tw`flex-row items-center px-3 py-2 rounded-full`,
                {
                  backgroundColor: `${ACCENT_COLOR}15`,
                  borderWidth: 1,
                  borderColor: `${ACCENT_COLOR}35`,
                },
              ]}
              onPress={() => navigation.navigate("AddTransaction")}
              activeOpacity={0.7}
            >
              <Ionicons name="rocket-outline" size={13} color={ACCENT_COLOR} style={{ marginRight: 5 }} />
              <View>
                <Text style={{ color: ACCENT_COLOR, fontSize: 10, fontWeight: "600" }}>Mulai!</Text>
                <Text style={{ color: Colors.gray400, fontSize: 9 }}>Catat keuangan</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <Sep />

        {/* ════════════════════════════════════════
            TIME FILTER CHIPS
        ════════════════════════════════════════ */}
        <View style={tw`flex-row mb-4`}>
          {(["weekly", "monthly", "yearly", "all"] as TimeFilter[]).map((filter) => {
            const labels: Record<string, string> = {
              weekly: activeCycle ? activeCycle.label : "Minggu Ini",
              monthly: "Bulan Ini",
              yearly: "Tahun Ini",
              all: "Semua",
            };
            const isActive = timeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  tw`px-3 py-1.5 rounded-full mr-2`,
                  {
                    backgroundColor: isActive ? `${ACCENT_COLOR}15` : SURFACE_COLOR,
                    borderWidth: 1,
                    borderColor: isActive ? `${ACCENT_COLOR}35` : "transparent",
                  },
                ]}
                onPress={() => setTimeFilter(filter)}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    color: isActive ? ACCENT_COLOR : Colors.gray400,
                    fontSize: 11,
                    fontWeight: isActive ? "600" : "500",
                  }}
                >
                  {labels[filter]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ════════════════════════════════════════
            BALANCE + MONTHLY PROGRESS
        ════════════════════════════════════════ */}
        <View style={tw`pb-1`}>
          <Text
            style={{
              color: Colors.gray400,
              fontSize: 10,
              fontWeight: "600",
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            {hasFinancialData ? "Saldo" : "Selamat Datang"}
          </Text>

          <Text
            style={{ color: TEXT_PRIMARY, fontSize: 32, fontWeight: "700", letterSpacing: -0.5, marginBottom: 16 }}
          >
            {hasFinancialData ? formatCurrency(safeNumber(state.balance)) : "Rp 0"}
          </Text>

          {/* Income / Expense row */}
          <View style={tw`flex-row items-center mb-4`}>
            <View style={tw`flex-1`}>
              <Text style={{ color: Colors.gray400, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>
                Pemasukan
              </Text>
              <Text style={{ color: SUCCESS_COLOR, fontSize: 14, fontWeight: "600" }}>
                {formatCurrency(safeNumber(filteredIncome))}
              </Text>
            </View>

            <View style={{ width: 1, height: 32, backgroundColor: SURFACE_COLOR, marginHorizontal: 16 }} />

            <View style={tw`flex-1`}>
              <Text style={{ color: Colors.gray400, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>
                Pengeluaran
              </Text>
              <Text style={{ color: ERROR_COLOR, fontSize: 14, fontWeight: "600" }}>
                {formatCurrency(safeNumber(filteredExpense))}
              </Text>
            </View>

            <View style={{ width: 1, height: 32, backgroundColor: SURFACE_COLOR, marginHorizontal: 16 }} />

            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: Colors.gray400, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>
                {timeFilter === "all" ? "Sisa" : "Saldo Akhir"}
              </Text>
              <Text style={{ color: filteredBalance >= 0 ? TEXT_SECONDARY : ERROR_COLOR, fontSize: 14, fontWeight: "600" }}>
                {formatCurrency(safeNumber(filteredBalance))}
              </Text>
            </View>
          </View>

          {/* Opening Balance Hint */}
          {timeFilter !== "all" && openingBalance !== 0 && (
            <View style={tw`mb-4 -mt-2`}>
              <Text style={{ color: Colors.gray500, fontSize: 10, fontStyle: "italic" }}>
                * Sudah termasuk saldo bawaan {formatCurrency(openingBalance)} dari periode sebelumnya
              </Text>
            </View>
          )}

          {/* Progress bar tipis */}
          <View style={{ height: 2, backgroundColor: SURFACE_COLOR, borderRadius: 2, marginBottom: 12 }}>
            <View
              style={{
                height: 2,
                borderRadius: 2,
                width: `${Math.max(0, Math.min(safeNumber(projectionData?.progress), 100))}%`,
                backgroundColor: hasFinancialData && projectionData
                  ? projectionData.status === "surplus"
                    ? SUCCESS_COLOR
                    : projectionData.status === "warning"
                    ? WARNING_COLOR
                    : ERROR_COLOR
                  : Colors.gray500,
              }}
            />
          </View>

          {/* Projected balance */}
          {hasFinancialData && projectionData && projectionData.daysRemaining > 0 && (
            <View style={tw`flex-row justify-between items-center`}>
              <Text style={{ color: Colors.gray400, fontSize: 11 }}>
                Proyeksi {projectionData.label} ({projectionData.daysRemaining} hari lagi)
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: projectionData.projectedBalance >= 0 ? SUCCESS_COLOR : ERROR_COLOR,
                }}
              >
                {projectionData.projectedBalance >= 0 ? "+" : ""}
                {formatCurrency(safeNumber(projectionData.projectedBalance))}
              </Text>
            </View>
          )}
        </View>

        <Sep />

        {/* ════════════════════════════════════════
            DYNAMIC QUICK ACTIONS
        ════════════════════════════════════════ */}
        <SectionHeader title="Aksi Cepat" />
        <View style={tw`flex-row justify-between mb-2`}>
          {dynamicQuickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={tw`items-center w-1/4`}
              onPress={action.onPress}
              activeOpacity={0.7}
              accessible
              accessibilityLabel={`${action.title} button`}
              accessibilityHint={`Navigates to ${action.title} screen`}
              accessibilityRole="button"
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Animated.View
                style={[
                  tw`w-10 h-10 rounded-xl items-center justify-center mb-1.5`,
                  {
                    backgroundColor: `${action.color}18`,
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <Ionicons name={action.icon} size={18} color={action.color} />
              </Animated.View>
              <Text style={{ color: Colors.gray400, fontSize: 10, fontWeight: "500" }}>
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Sep />

        {/* ════════════════════════════════════════
            QUICK STATS
        ════════════════════════════════════════ */}
        <SectionHeader title="Statistik" />
        <View style={tw`flex-row mb-2`}>
          {quickStats.map((stat, index) => (
            <View
              key={stat.id}
              style={[
                tw`flex-1 rounded-xl p-3`,
                index < quickStats.length - 1 && { marginRight: 8 },
                { backgroundColor: SURFACE_COLOR },
              ]}
            >
              <Text
                style={{
                  color: Colors.gray400,
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 5,
                }}
                numberOfLines={1}
              >
                {stat.label}
              </Text>
              <Text style={{ color: stat.color, fontSize: 14, fontWeight: "700" }}>
                {stat.value}
              </Text>
              {stat.unit && (
                <Text style={{ color: Colors.gray400, fontSize: 9, marginTop: 1 }}>{stat.unit}</Text>
              )}
            </View>
          ))}
        </View>

        <Sep />

        {/* ════════════════════════════════════════
            RECENT TRANSACTIONS
        ════════════════════════════════════════ */}
        <SectionHeader
          title={filteredTransactions.length > 0 ? "Transaksi Terbaru" : state.transactions.length > 0 ? "Belum Ada Transaksi" : "Mulai Catat Keuangan"}
          linkLabel={state.transactions.length > 0 ? "Lihat Semua" : "Mulai Sekarang"}
          onPress={() =>
            state.transactions.length > 0
              ? navigation.navigate("Transactions")
              : navigation.navigate("AddTransaction")
          }
        />

        {filteredTransactions.length > 0 ? (
          <View>
            {filteredTransactions
              .slice()
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5)
              .map((transaction, index, arr) => (
                <TouchableOpacity
                  key={transaction.id}
                  style={[
                    tw`flex-row items-center py-3`,
                    index < arr.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: SURFACE_COLOR,
                    },
                  ]}
                  onPress={() =>
                    navigation.navigate("AddTransaction", {
                      editMode: true,
                      transactionData: transaction,
                    })
                  }
                  activeOpacity={0.6}
                  accessible
                  accessibilityLabel={`Transaksi ${
                    transaction.type === "income" ? "pemasukan" : "pengeluaran"
                  } di kategori ${transaction.category} senilai ${formatCurrency(transaction.amount)}`}
                  accessibilityHint="Tekan untuk mengedit transaksi ini"
                >
                  <View
                    style={[
                      tw`w-9 h-9 rounded-xl items-center justify-center mr-3`,
                      {
                        backgroundColor:
                          transaction.type === "income"
                            ? `${SUCCESS_COLOR}15`
                            : `${ERROR_COLOR}15`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={getTransactionIcon(transaction.category)}
                      size={16}
                      color={transaction.type === "income" ? SUCCESS_COLOR : ERROR_COLOR}
                    />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text
                      style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "500", marginBottom: 1 }}
                    >
                      {transaction.category}
                    </Text>
                    <Text style={{ color: Colors.gray400, fontSize: 11 }} numberOfLines={1}>
                      {transaction.description || "Tidak ada deskripsi"} ·{" "}
                      {new Date(transaction.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: transaction.type === "income" ? SUCCESS_COLOR : ERROR_COLOR,
                    }}
                  >
                    {transaction.type === "income" ? "+" : "−"}
                    {formatCurrency(safeNumber(transaction.amount))}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        ) : state.transactions.length > 0 ? (
          /* Empty state saat terfilter (misal minggu ini kosong) */
          <View style={[tw`py-6 items-center`]}>
            <View style={[tw`w-12 h-12 rounded-full items-center justify-center mb-2`, { backgroundColor: `${SURFACE_COLOR}80` }]}>
              <Ionicons name="documents-outline" size={24} color={Colors.gray400} />
            </View>
            <Text style={{ color: Colors.gray400, fontSize: 12 }}>Tidak ada transaksi di periode ini</Text>
          </View>
        ) : (
          /* Empty state total (belum ada transaksi sama sekali) */
          <TouchableOpacity
            onPress={() => navigation.navigate("AddTransaction")}
            activeOpacity={0.7}
            style={[
              tw`flex-row items-center py-4 px-4 rounded-xl`,
              {
                backgroundColor: `${ACCENT_COLOR}10`,
                borderWidth: 1,
                borderColor: `${ACCENT_COLOR}20`,
              },
            ]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <View
              style={[
                tw`w-9 h-9 rounded-xl items-center justify-center mr-3`,
                { backgroundColor: `${ACCENT_COLOR}25` },
              ]}
            >
              <Ionicons name="add" size={18} color={ACCENT_COLOR} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "500" }}>
                Tambah transaksi pertama
              </Text>
              <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 1 }}>
                💡 Catat pemasukan atau pengeluaran · Buat anggaran · Tetapkan tabungan
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.gray400} />
          </TouchableOpacity>
        )}

        {/* ════════════════════════════════════════
            BUDGET + GOALS (Progress & Target)
        ════════════════════════════════════════ */}
        {hasFinancialData && (state.budgets.length > 0 || goalsPreview.length > 0) && (
          <>
            <Sep />

            <View style={tw`flex-row justify-between items-center mb-3`}>
              <Text
                style={{
                  color: Colors.gray400,
                  fontSize: 10,
                  fontWeight: "600",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                Progress & Target
              </Text>
              <View style={tw`flex-row gap-3`}>
                {state.budgets.length > 0 && (
                  <TouchableOpacity onPress={() => navigation.navigate("Budget")} activeOpacity={0.7}>
                    <Text style={{ color: ACCENT_COLOR, fontSize: 12 }}>Anggaran</Text>
                  </TouchableOpacity>
                )}
                {goalsPreview.length > 0 && (
                  <TouchableOpacity onPress={() => navigation.navigate("Savings")} activeOpacity={0.7}>
                    <Text style={{ color: SUCCESS_COLOR, fontSize: 12 }}>Tabungan</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={tw`flex-row`}>
              {/* LEFT COLUMN: BUDGET */}
              {state.budgets.length > 0 && (
                <View
                  style={[
                    tw`flex-1 pr-4`,
                    goalsPreview.length > 0 && {
                      borderRightWidth: 1,
                      borderRightColor: SURFACE_COLOR,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: Colors.gray400,
                      fontSize: 9,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      marginBottom: 10,
                    }}
                  >
                    Anggaran ({state.budgets.slice(0, 3).length})
                  </Text>
                  {state.budgets.slice(0, 3).map((budget) => {
                    const safeSpent = safeNumber(budget.spent);
                    const safeLimit = safeNumber(budget.limit);
                    const progress  = safeLimit > 0 ? (safeSpent / safeLimit) * 100 : 0;
                    const barColor  =
                      progress > 90 ? ERROR_COLOR : progress > 70 ? WARNING_COLOR : SUCCESS_COLOR;
                    return (
                      <View key={budget.id} style={tw`mb-4`}>
                        <View style={tw`flex-row justify-between items-center mb-1`}>
                          <Text style={{ color: TEXT_SECONDARY, fontSize: 11, fontWeight: "500" }}>
                            {budget.category}
                          </Text>
                          <Text
                            style={{
                              color: progress > 90 ? ERROR_COLOR : Colors.gray400,
                              fontSize: 10,
                            }}
                          >
                            {Math.round(safeNumber(progress))}%
                          </Text>
                        </View>
                        <View
                          style={{ height: 3, backgroundColor: Colors.surfaceLight, borderRadius: 3 }}
                        >
                          <View
                            style={{
                              height: 3,
                              borderRadius: 3,
                              width: `${Math.max(0, Math.min(safeNumber(progress), 100))}%`,
                              backgroundColor: barColor,
                            }}
                          />
                        </View>
                        <Text style={{ color: Colors.gray400, fontSize: 10, marginTop: 3 }}>
                          {formatCurrency(safeSpent)} / {formatCurrency(safeLimit)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* RIGHT COLUMN: GOALS */}
              {goalsPreview.length > 0 && (
                <View style={[tw`flex-1`, state.budgets.length > 0 && { paddingLeft: 16 }]}>
                  <Text
                    style={{
                      color: Colors.gray400,
                      fontSize: 9,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      marginBottom: 10,
                    }}
                  >
                    Tabungan ({goalsPreview.length})
                  </Text>
                  {goalsPreview.slice(0, 3).map((goal) => {
                    const safeCurrent = safeNumber(goal.current);
                    const safeTarget  = safeNumber(goal.target);
                    const progress    = safeTarget > 0 ? (safeCurrent / safeTarget) * 100 : 0;
                    const barColor    =
                      progress >= 80 ? SUCCESS_COLOR : progress >= 50 ? WARNING_COLOR : ACCENT_COLOR;
                    return (
                      <TouchableOpacity
                        key={goal.id}
                        style={tw`mb-4`}
                        onPress={() => navigation.navigate("Savings")}
                        activeOpacity={0.7}
                      >
                        <View style={tw`flex-row justify-between items-center mb-1`}>
                          <Text
                            style={{ color: TEXT_SECONDARY, fontSize: 11, fontWeight: "500" }}
                            numberOfLines={1}
                          >
                            {goal.name}
                          </Text>
                          <Text style={{ color: Colors.gray400, fontSize: 10 }}>
                            {Math.round(safeNumber(progress))}%
                          </Text>
                        </View>
                        <View
                          style={{ height: 3, backgroundColor: Colors.surfaceLight, borderRadius: 3 }}
                        >
                          <View
                            style={{
                              height: 3,
                              borderRadius: 3,
                              width: `${Math.max(0, Math.min(safeNumber(progress), 100))}%`,
                              backgroundColor: barColor,
                            }}
                          />
                        </View>
                        <Text style={{ color: Colors.gray400, fontSize: 10, marginTop: 3 }}>
                          {formatCurrency(safeCurrent)} / {formatCurrency(safeTarget)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}

        {/* ════════════════════════════════════════
            HEALTH SCORE RECOMMENDATIONS
            Ditampilkan jika ada data & skor < 70
        ════════════════════════════════════════ */}
        {hasFinancialData &&
          financialHealthScore.recommendations &&
          financialHealthScore.recommendations.length > 0 &&
          financialHealthScore.overallScore < 70 && (
            <>
              <Sep />
              <SectionHeader
                title="Rekomendasi"
                linkLabel="Lihat Analitik"
                onPress={() => navigation.navigate("Analytics", { tab: "health" })}
              />
              {financialHealthScore.recommendations.slice(0, 2).map((rec, i) => (
                <View key={i} style={tw`flex-row items-start mb-3`}>
                  <View
                    style={[
                      tw`w-5 h-5 rounded-full items-center justify-center mr-3 mt-0.5`,
                      { backgroundColor: `${ACCENT_COLOR}20`, flexShrink: 0 },
                    ]}
                  >
                    <Text style={{ color: ACCENT_COLOR, fontSize: 10, fontWeight: "700" }}>
                      {i + 1}
                    </Text>
                  </View>
                  <Text style={{ color: TEXT_SECONDARY, fontSize: 12, flex: 1, lineHeight: 18 }}>
                    {rec}
                  </Text>
                </View>
              ))}
            </>
          )}

      </ScrollView>

      {/* ════════════════════════════════════════
          FLOATING ADD BUTTON
      ════════════════════════════════════════ */}
      <Animated.View
        style={[
          tw`absolute bottom-6 right-5`,
          {
            width: 52,
            height: 52,
            borderRadius: 16,
            backgroundColor: ACCENT_COLOR,
            shadowColor: ACCENT_COLOR,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 10,
            elevation: 10,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={tw`w-full h-full items-center justify-center`}
          onPress={() => navigation.navigate("AddTransaction")}
          activeOpacity={0.8}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessible
          accessibilityLabel="Tambah transaksi baru"
          accessibilityHint="Tekan untuk menambahkan transaksi pemasukan atau pengeluaran"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={26} color={BACKGROUND_COLOR} />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

export default HomeScreen;