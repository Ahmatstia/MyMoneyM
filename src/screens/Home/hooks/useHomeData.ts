import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { AppState } from "../../../types";
import {
  TimeFilter,
  filterTransactionsByTime,
  calculateTotals,
  getActiveCycleInfo,
  getMonthlyCycleRange,
  calculateProjection,
  calculateOpeningBalance,
  safeNumber,
  safePositiveNumber,
} from "../../../utils/calculations";
import {
  calculateTransactionAnalytics,
  calculateFinancialHealthScore,
} from "../../../utils/analytics";
import { Colors } from "../../../theme/theme";
import { getJakartaDateKey } from "../../../utils/dailyCheckIn";
import {
  DEFAULT_CATEGORIES,
  ALL_SYSTEM_CATEGORIES,
  CategoryItem,
} from "../../../constants/categories";

type SafeIconName = keyof typeof Ionicons.glyphMap;

export const useHomeData = (
  state: AppState,
  timeFilter: TimeFilter,
  navigation: any,
) => {
  const activeCycle = useMemo(() => {
    const cycle = getActiveCycleInfo(state.transactions, state.paydayCutoff);

    // Cycle calculation automatically anchors to paydayCutoff or the latest cycle income via getActiveCycleInfo
    return cycle;
  }, [state.transactions, state.paydayCutoff]);

  const activeDailyPlans = useMemo(
    () => {
      const today = getJakartaDateKey();
      return (state.dailyPlans || []).filter(
        (plan) => plan.isActive && plan.startDate <= today && plan.endDate >= today,
      );
    },
    [state.dailyPlans],
  );

  const filteredTransactions = useMemo(
    () =>
      filterTransactionsByTime(
        state.transactions,
        timeFilter,
        state.paydayCutoff,
        state.dailyPlans,
        false,
      ),
    [state.transactions, timeFilter, state.paydayCutoff, state.dailyPlans],
  );

  const {
    totalIncome: filteredIncome,
    totalExpense: filteredExpense,
    balance: filteredPeriodNetto,
  } = useMemo(
    () => calculateTotals(filteredTransactions),
    [filteredTransactions],
  );

  const openingBalance = useMemo(() => {
    if (timeFilter === "all") return 0;

    const now = new Date();
    let startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    startDate.setHours(0, 0, 0, 0);

    if (timeFilter === "target") {
      const starts = activeDailyPlans.map((plan) => plan.startDate).sort();
      if (starts.length) startDate = new Date(`${starts[0]}T00:00:00`);
    } else if (timeFilter === "weekly") {
      const currentDay = now.getDay() === 0 ? 7 : now.getDay();
      startDate.setDate(now.getDate() - currentDay + 1);
    } else if (timeFilter === "monthly") {
      if (state.paydayCutoff && state.paydayCutoff > 1) {
        const cycleRange = getMonthlyCycleRange(state.paydayCutoff, now);
        startDate = cycleRange.startDate;
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
    } else if (timeFilter === "yearly") {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    return calculateOpeningBalance(
      state.transactions,
      startDate,
      undefined,
    );
  }, [state.transactions, timeFilter, state.paydayCutoff, activeDailyPlans]);

  const filteredBalance = useMemo(
    () => openingBalance + filteredPeriodNetto,
    [openingBalance, filteredPeriodNetto],
  );

  const hasFinancialData = useMemo(() => {
    return (
      state.transactions.length > 0 ||
      state.budgets.length > 0 ||
      state.savings.length > 0
    );
  }, [state.transactions, state.budgets, state.savings]);

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
    const analytics = calculateTransactionAnalytics(
      state.transactions,
      "month",
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

  const financialHealthScore = useMemo(() => {
    try {
      if (!hasFinancialData) {
        return {
          overallScore: 0,
          category: "Belum Ada Data",
          color: Colors.gray400,
          factors: {
            savingsRate: { score: 0, weight: 0.3, status: "poor" as const },
            budgetAdherence: { score: 0, weight: 0.3, status: "poor" as const },
            expenseControl: { score: 0, weight: 0.25, status: "poor" as const },
            goalProgress: { score: 0, weight: 0.15, status: "poor" as const },
          },
          recommendations: [
            "Mulai dengan mencatat semua transaksi secara rutin",
            "Buat anggaran untuk kategori pengeluaran utama",
          ],
        };
      }

      const budgetAnalytics = {
        hasBudgets: state.budgets.length > 0,
        totalBudget: state.budgets.reduce(
          (sum, b) => sum + safePositiveNumber(b.limit),
          0,
        ),
        totalSpent: state.budgets.reduce(
          (sum, b) => sum + safePositiveNumber(b.spent),
          0,
        ),
        utilizationRate:
          state.budgets.reduce(
            (sum, b) => sum + safePositiveNumber(b.limit),
            0,
          ) > 0
            ? (state.budgets.reduce(
                (sum, b) => sum + safePositiveNumber(b.spent),
                0,
              ) /
                state.budgets.reduce(
                  (sum, b) => sum + safePositiveNumber(b.limit),
                  0,
                )) *
              100
            : 0,
        overBudgetCount: state.budgets.filter(
          (b) => safePositiveNumber(b.spent) > safePositiveNumber(b.limit),
        ).length,
        underBudgetCount: state.budgets.filter(
          (b) => safePositiveNumber(b.spent) <= safePositiveNumber(b.limit),
        ).length,
        budgetsAtRisk: state.budgets.filter(
          (b) =>
            safePositiveNumber(b.spent) > safePositiveNumber(b.limit) * 0.8,
        ),
      };

      const savingsAnalytics = {
        hasSavings: state.savings.length > 0,
        totalTarget: state.savings.reduce(
          (sum, s) => sum + safePositiveNumber(s.target),
          0,
        ),
        totalCurrent: state.savings.reduce(
          (sum, s) => sum + safePositiveNumber(s.current),
          0,
        ),
        overallProgress:
          state.savings.reduce(
            (sum, s) => sum + safePositiveNumber(s.target),
            0,
          ) > 0
            ? (state.savings.reduce(
                (sum, s) => sum + safePositiveNumber(s.current),
                0,
              ) /
                state.savings.reduce(
                  (sum, s) => sum + safePositiveNumber(s.target),
                  0,
                )) *
              100
            : 0,
        completedSavings: state.savings.filter(
          (s) => safePositiveNumber(s.current) >= safePositiveNumber(s.target),
        ).length,
        activeSavings: state.savings.filter(
          (s) => safePositiveNumber(s.current) < safePositiveNumber(s.target),
        ).length,
        nearingCompletion: state.savings.filter((s) => {
          const target = safePositiveNumber(s.target);
          const current = safePositiveNumber(s.current);
          return target > 0 && current / target >= 0.8 && current < target;
        }),
      };

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
        totalActiveDebt,
      );
    } catch (error) {
      return {
        overallScore: 50,
        category: "Cukup",
        color: Colors.warning,
        factors: {
          savingsRate: { score: 50, weight: 0.3, status: "warning" as const },
          budgetAdherence: {
            score: 50,
            weight: 0.3,
            status: "warning" as const,
          },
          expenseControl: {
            score: 50,
            weight: 0.25,
            status: "warning" as const,
          },
          goalProgress: {
            score: 50,
            weight: 0.15,
            status: "warning" as const,
          },
        },
        recommendations: [
          "Mulai dengan mencatat semua transaksi secara rutin",
          "Buat anggaran untuk kategori pengeluaran utama",
        ],
      };
    }
  }, [state.budgets, state.savings, transactionAnalytics, hasFinancialData]);

  const getPersonalizedGreeting = () => {
    const hour = new Date().getHours();
    let greeting = "";
    if (hour < 12) greeting = "Selamat Pagi";
    else if (hour < 15) greeting = "Selamat Siang";
    else if (hour < 19) greeting = "Selamat Sore";
    else greeting = "Selamat Malam";

    if (state.userProfile?.name) {
      return `${greeting}, ${state.userProfile.name} 👋`;
    }

    return `${greeting} 👋`;
  };

  const getSmartInsights = () => {
    const insights = [];

    if (!hasFinancialData) {
      insights.push({
        type: "info",
        title: "Mulai Catat Keuangan",
        message:
          "Tambahkan transaksi pertama Anda untuk melihat analisis keuangan",
        icon: "add-circle-outline" as SafeIconName,
        color: Colors.accent,
        action: "Tambah Transaksi",
        onPress: () => navigation.navigate("AddTransaction"),
      });
      return insights;
    }

    if (transactionAnalytics.savingsRate < 10) {
      insights.push({
        type: "warning",
        title: "Rasio Tabungan Rendah",
        message: `Hanya ${safeNumber(transactionAnalytics.savingsRate).toFixed(
          1,
        )}% dari pemasukan disimpan`,
        icon: "trending-down-outline" as SafeIconName,
        color: Colors.error,
        action: "Tingkatkan ke 20%",
        onPress: () => navigation.navigate("Analytics"),
      });
    } else if (transactionAnalytics.savingsRate >= 20) {
      insights.push({
        type: "success",
        title: "Rasio Tabungan Baik!",
        message: `${safeNumber(transactionAnalytics.savingsRate).toFixed(
          1,
        )}% pemasukan berhasil disimpan`,
        icon: "trending-up-outline" as SafeIconName,
        color: Colors.success,
        action: "Pertahankan!",
        onPress: () => navigation.navigate("Analytics"),
      });
    }

    if (transactionAnalytics.topCategories.length > 0) {
      const [topCategory, topAmount] = transactionAnalytics.topCategories[0];
      const safeTopAmount = safeNumber(topAmount);
      const safeTotalExpense = safeNumber(transactionAnalytics.totalExpense);
      const percentage =
        safeTotalExpense > 0 ? (safeTopAmount / safeTotalExpense) * 100 : 0;

      if (percentage > 40) {
        insights.push({
          type: "warning",
          title: "Konsentrasi Pengeluaran Tinggi",
          message: `${topCategory} menghabiskan ${safeNumber(
            percentage,
          ).toFixed(0)}% dari total pengeluaran`,
          icon: "pie-chart-outline" as SafeIconName,
          color: Colors.warning,
          action: "Diversifikasi",
          onPress: () =>
            navigation.navigate("Analytics", { tab: "categories" }),
        });
      }
    }

    if (state.budgets.length > 0) {
      const overBudgetCount = state.budgets.filter(
        (b) => safeNumber(b.spent) > safeNumber(b.limit),
      ).length;
      if (overBudgetCount > 0) {
        insights.push({
          type: "warning",
          title: `${overBudgetCount} Anggaran Melebihi Limit`,
          message: "Beberapa kategori pengeluaran melebihi batas",
          icon: "alert-circle-outline" as SafeIconName,
          color: Colors.error,
          action: "Review Anggaran",
          onPress: () => navigation.navigate("Budget"),
        });
      }
    }

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
          color: Colors.accent,
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
        color: Colors.error,
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
        color: Colors.accent,
        action: "Pantau Terus",
        onPress: () => navigation.navigate("Analytics"),
      });
    }

    return insights.slice(0, 3);
  };

  const smartInsights = useMemo(
    () => getSmartInsights(),
    [
      hasFinancialData,
      transactionAnalytics,
      state.budgets,
      state.savings,
      financialHealthScore,
    ],
  );

  const getDynamicQuickActions = () => {
    return [
      {
        id: "transactions",
        title: "Transaksi",
        icon: "swap-horizontal-outline" as SafeIconName,
        color: Colors.accent,
        onPress: () => navigation.navigate("Transactions"),
      },
      {
        id: "budget",
        title: "Anggaran",
        icon: "pie-chart-outline" as SafeIconName,
        color: Colors.warning,
        onPress: () => navigation.navigate("Budget"),
      },
      {
        id: "savings",
        title: "Tabungan",
        icon: "wallet-outline" as SafeIconName,
        color: Colors.purpleLight,
        onPress: () => navigation.navigate("Savings"),
      },
      {
        id: "analytics",
        title: "Analitik",
        icon: "stats-chart-outline" as SafeIconName,
        color: Colors.success,
        onPress: () => navigation.navigate("Analytics"),
      },
      {
        id: "debt",
        title: "Hutang",
        icon: "card-outline" as SafeIconName,
        color: Colors.error,
        onPress: () => navigation.navigate("Debt"),
      },
    ];
  };

  const dynamicQuickActions = useMemo(
    () => getDynamicQuickActions(),
    [navigation],
  );

  const projectionData = useMemo(() => {
    if (!hasFinancialData) return null;

    const now = new Date();
    const selectedCycle = null;
    let startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);
    let label = "akhir bulan";

    if (timeFilter === "target" && activeDailyPlans.length) {
      const starts = activeDailyPlans.map((plan) => plan.startDate).sort();
      const ends = activeDailyPlans.map((plan) => plan.endDate).sort();
      startDate = new Date(`${starts[0]}T00:00:00`);
      endDate = new Date(`${ends[ends.length - 1]}T23:59:59`);
      label = "Batas Aktif";
    } else if (timeFilter === "weekly") {
      const currentDay = now.getDay() === 0 ? 7 : now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - currentDay + 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      label = "akhir minggu";
    } else if (timeFilter === "monthly") {
      if (state.paydayCutoff && state.paydayCutoff > 1) {
        const cycleRange = getMonthlyCycleRange(state.paydayCutoff, now);
        startDate = cycleRange.startDate;
        endDate = cycleRange.endDate;
        label = "akhir bulan pembukuan";
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        label = "akhir bulan";
      }
    } else if (timeFilter === "yearly") {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      endDate.setHours(23, 59, 59, 999);
      label = "akhir tahun";
    }

    const totalAvailableCash = filteredIncome + openingBalance;

    return {
      ...calculateProjection(
        totalAvailableCash,
        filteredExpense,
        startDate,
        endDate,
        now,
      ),
      label,
      activeCycle: selectedCycle,
    };
  }, [
    hasFinancialData,
    timeFilter,
    activeCycle,
    activeDailyPlans,
    filteredIncome,
    filteredExpense,
    openingBalance,
    state.paydayCutoff,
  ]);

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

  const getQuickStats = () => {
    if (!hasFinancialData) {
      return [
        {
          id: "start",
          label: "Mulai Dengan",
          value: "Transaksi",
          unit: "Pertama",
          color: Colors.info,
        },
        {
          id: "track",
          label: "Pantau",
          value: "Pengeluaran",
          color: Colors.success,
        },
        {
          id: "target",
          label: "Buat",
          value: "Target",
          unit: "Tabungan",
          color: Colors.warning,
        },
      ];
    }

    // Hitung kategori pengeluaran terbesar sesuai timeFilter
    const expenseTxList = (filteredTransactions || []).filter(
      (t) => t.type === "expense",
    );
    const categorySpending: Record<string, number> = {};
    expenseTxList.forEach((t) => {
      const cat = t.category || "Lainnya";
      categorySpending[cat] =
        (categorySpending[cat] || 0) + safeNumber(t.amount);
    });
    const sortedCategories = Object.entries(categorySpending).sort(
      (a, b) => safeNumber(b[1]) - safeNumber(a[1]),
    );
    const topCategory = sortedCategories.length > 0 ? sortedCategories[0] : null;
    const topCatName = topCategory ? topCategory[0] : "-";
    const topCatAmount = topCategory ? safeNumber(topCategory[1]) : 0;
    const topCatPct =
      filteredExpense > 0
        ? Math.min(100, Math.round((topCatAmount / filteredExpense) * 100))
        : 0;

    const avgDaily = projectionData?.dailyAvgExpense || 0;
    const currentTransactionCount = filteredTransactions.length;

    return [
      {
        id: "top_expense",
        label: "Beban Terbesar",
        value:
          topCategory && topCatAmount > 0
            ? topCatAmount >= 1000000
              ? `${(topCatAmount / 1000000).toFixed(1)}jt`
              : topCatAmount >= 1000
                ? `${(topCatAmount / 1000).toFixed(0)}rb`
                : topCatAmount.toFixed(0)
            : "Rp 0",
        unit:
          topCategory && topCatAmount > 0
            ? `${topCatName} (${topCatPct}%)`
            : "Nihil",
        trend: topCategory && topCatAmount > 0 ? "●" : "✓",
        trendLabel: topCategory && topCatAmount > 0 ? `${topCatPct}%` : "Terkendali",
        color: topCategory && topCatAmount > 0 ? Colors.warning : Colors.success,
      },
      {
        id: "daily_avg",
        label: "Rata-rata",
        value:
          avgDaily >= 1000000
            ? `${(avgDaily / 1000000).toFixed(1)}jt`
            : avgDaily >= 1000
              ? `${(avgDaily / 1000).toFixed(0)}rb`
              : avgDaily.toString(),
        unit: "/hari",
        trend: avgDaily < 100000 ? "↓" : "↑",
        trendLabel: avgDaily < 100000 ? "Hemat" : "Tinggi",
        color: avgDaily < 100000 ? Colors.success : Colors.error,
      },
      {
        id: "transactions_count",
        label: "Transaksi",
        value: currentTransactionCount.toString(),
        unit: timeFilter === "all" ? "total" : "transaksi",
        trend: currentTransactionCount > 10 ? "↑" : "↓",
        trendLabel:
          timeFilter === "all"
            ? "Selama ini"
            : timeFilter === "weekly"
              ? "Minggu ini"
              : timeFilter === "monthly"
                ? "Bulan ini"
                : "Tahun ini",
        color: Colors.accent,
      },
    ];
  };

  const quickStats = useMemo(
    () => getQuickStats(),
    [
      hasFinancialData,
      state.transactions,
      state.budgets,
      state.balance,
      projectionData,
      filteredTransactions,
      timeFilter,
    ],
  );

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

  const getSafeIcon = (iconName: string): SafeIconName => {
    const defaultIcon: SafeIconName = "receipt-outline";
    if (iconName in Ionicons.glyphMap) {
      return iconName as SafeIconName;
    }
    return defaultIcon;
  };

  const resolveCategory = (categoryName: string): CategoryItem => {
    const all: CategoryItem[] = [
      ...(state.customCategories || []).map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        isCustom: true as const,
        customId: c.id,
      })),
      ...ALL_SYSTEM_CATEGORIES,
    ];
    const found = all.find((c) => c.name === categoryName || (categoryName === "Gaji" && c.id === "pemasukan"));
    return (
      found || {
        id: "unknown",
        name: categoryName,
        icon: "receipt-outline",
        color: Colors.gray400,
      }
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return Colors.success;
    if (score >= 60) return Colors.info;
    if (score >= 40) return Colors.warning;
    return Colors.error;
  };

  return {
    activeCycle,
    filteredTransactions,
    filteredIncome,
    filteredExpense,
    filteredPeriodNetto,
    openingBalance,
    filteredBalance,
    hasFinancialData,
    transactionAnalytics,
    financialHealthScore,
    smartInsights,
    dynamicQuickActions,
    projectionData,
    goalsPreview,
    quickStats,
    getCurrentDate,
    resolveCategory,
    getScoreColor,
    getPersonalizedGreeting,
  };
};
