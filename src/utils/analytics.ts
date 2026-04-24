// File: src/utils/analytics.ts (DIPERBAIKI - fix savings analytics)
import { Transaction, Budget, Savings } from "../types";
import { getMonthRange, getWeekRange, getYearRange } from "./formatters";
import { safeNumber, getSafePercentage, filterTransactionsByTime, getActiveCycleInfo } from "./calculations";

// ==================== SAFE ANALYTICS FUNCTIONS ====================

// Calculate analytics data for transactions with safe defaults
export const calculateTransactionAnalytics = (
  transactions: Transaction[] = [],
  timeRange: "week" | "month" | "year" = "month"
) => {
  try {
    // Filter transactions by date range / cycle using the shared utility
    const filteredTransactions = filterTransactionsByTime(
      transactions,
      timeRange === "week" ? "weekly" : timeRange === "month" ? "monthly" : timeRange === "year" ? "yearly" : "all"
    );

    // Tetap ambil startDate dan endDate statis untuk fallback metadata
    let startDate = new Date();
    let endDate = new Date();
    try {
      if (filteredTransactions.length > 0) {
        // Ambil range dari transaksi termuda & tertua atau ikuti week/month range asli
        // For simplicity we will just generate static dates for display bounds
        // or re-use the util ranges
        if (timeRange === "week") {
            const cycle = getActiveCycleInfo(transactions);
            if(cycle) {
                startDate = cycle.startDate;
                endDate = cycle.endDate;
            } else {
                startDate = getWeekRange().start;
                endDate = getWeekRange().end;
            }
        } else if (timeRange === "month") {
            startDate = getMonthRange().start;
            endDate = getMonthRange().end;
        } else if (timeRange === "year") {
            startDate = getYearRange().start;
            endDate = getYearRange().end;
        }
      }
    } catch {}

    // Calculate totals with safeNumber
    const totalIncome = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0);

    const totalExpense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0);

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // Calculate daily trends for the last 7 days
    const dailyTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayTransactions = filteredTransactions.filter(
        (t) => t.date === dateStr
      );

      const dayIncome = dayTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + safeNumber(t.amount), 0);

      const dayExpense = dayTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + safeNumber(t.amount), 0);

      dailyTrends.push({
        date: dateStr,
        income: dayIncome,
        expense: dayExpense,
      });
    }

    // Calculate category spending
    const categorySpending: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        if (t.category) {
          categorySpending[t.category] =
            (categorySpending[t.category] || 0) + safeNumber(t.amount);
        }
      });

    // Sort categories by spending
    const topCategories = Object.entries(categorySpending)
      .sort((a, b) => safeNumber(b[1]) - safeNumber(a[1]))
      .slice(0, 5);

    // Calculate average daily spending
    const daysInRange = Math.max(
      1,
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    const avgDailyExpense = totalExpense / daysInRange;

    return {
      timeRange,
      startDate,
      endDate,
      totalIncome: safeNumber(totalIncome),
      totalExpense: safeNumber(totalExpense),
      netSavings: safeNumber(netSavings),
      savingsRate: safeNumber(savingsRate),
      dailyTrends,
      topCategories,
      avgDailyExpense: safeNumber(avgDailyExpense),
      transactionCount: filteredTransactions.length,
      incomeTransactionCount: filteredTransactions.filter(
        (t) => t.type === "income"
      ).length,
      expenseTransactionCount: filteredTransactions.filter(
        (t) => t.type === "expense"
      ).length,
    };
  } catch (error) {

    // Return safe defaults
    const now = new Date();
    return {
      timeRange,
      startDate: now,
      endDate: now,
      totalIncome: 0,
      totalExpense: 0,
      netSavings: 0,
      savingsRate: 0,
      dailyTrends: [],
      topCategories: [],
      avgDailyExpense: 0,
      transactionCount: 0,
      incomeTransactionCount: 0,
      expenseTransactionCount: 0,
    };
  }
};

// PERBAIKAN: Calculate budget utilization analytics - FIXED
export const calculateBudgetAnalytics = (budgets: Budget[] = []) => {
  try {

    // Jika budgets adalah array kosong atau null/undefined
    if (!budgets || !Array.isArray(budgets) || budgets.length === 0) {

      return {
        totalBudget: 0,
        totalSpent: 0,
        utilizationRate: 0,
        overBudgetCount: 0,
        underBudgetCount: 0,
        budgetsAtRisk: [] as Budget[],
        hasBudgets: false,
      };
    }

    // Filter hanya budgets yang valid
    const validBudgets = budgets.filter(
      (b) =>
        b &&
        typeof b === "object" &&
        typeof b.limit === "number" &&
        typeof b.spent === "number" &&
        !isNaN(b.limit) &&
        !isNaN(b.spent)
    );


    const totalBudget = validBudgets.reduce(
      (sum, b) => sum + safeNumber(b.limit),
      0
    );

    const totalSpent = validBudgets.reduce(
      (sum, b) => sum + safeNumber(b.spent),
      0
    );

    

    const utilizationRate =
      totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    const overBudgetCount = validBudgets.filter(
      (b) => safeNumber(b.spent) > safeNumber(b.limit)
    ).length;

    const underBudgetCount = validBudgets.filter(
      (b) => safeNumber(b.spent) <= safeNumber(b.limit)
    ).length;

    const budgetsAtRisk = validBudgets
      .filter((b) => {
        const limit = safeNumber(b.limit);
        const spent = safeNumber(b.spent);
        return limit > 0 && spent > limit * 0.8 && spent <= limit;
      })
      .sort((a, b) => {
        const ratioA =
          safeNumber(a.limit) > 0
            ? safeNumber(a.spent) / safeNumber(a.limit)
            : 0;
        const ratioB =
          safeNumber(b.limit) > 0
            ? safeNumber(b.spent) / safeNumber(b.limit)
            : 0;
        return ratioB - ratioA;
      });

    return {
      totalBudget: safeNumber(totalBudget),
      totalSpent: safeNumber(totalSpent),
      utilizationRate: safeNumber(utilizationRate),
      overBudgetCount,
      underBudgetCount,
      budgetsAtRisk,
      hasBudgets: validBudgets.length > 0,
    };
  } catch (error) {

    return {
      totalBudget: 0,
      totalSpent: 0,
      utilizationRate: 0,
      overBudgetCount: 0,
      underBudgetCount: 0,
      budgetsAtRisk: [],
      hasBudgets: false,
    };
  }
};

// PERBAIKAN BESAR: Calculate savings progress analytics - FIXED
export const calculateSavingsAnalytics = (savings: Savings[] = []) => {
  try {

    // Jika savings adalah array kosong atau null/undefined
    if (!savings || !Array.isArray(savings) || savings.length === 0) {

      return {
        totalTarget: 0,
        totalCurrent: 0,
        overallProgress: 0,
        completedSavings: 0,
        activeSavings: 0,
        nearingCompletion: [] as Savings[],
        hasSavings: false, // PERBAIKAN: Tambah flag hasSavings
      };
    }

    // Filter hanya savings yang valid
    const validSavings = savings.filter(
      (s) =>
        s &&
        typeof s === "object" &&
        typeof s.target === "number" &&
        typeof s.current === "number" &&
        !isNaN(s.target) &&
        !isNaN(s.current)
    );


    const totalTarget = validSavings.reduce(
      (sum, s) => sum + safeNumber(s.target),
      0
    );

    const totalCurrent = validSavings.reduce(
      (sum, s) => sum + safeNumber(s.current),
      0
    );

    

    const overallProgress =
      totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

    const completedSavings = validSavings.filter(
      (s) => safeNumber(s.current) >= safeNumber(s.target)
    ).length;

    const activeSavings = validSavings.filter(
      (s) => safeNumber(s.current) < safeNumber(s.target)
    ).length;

    const nearingCompletion = validSavings
      .filter((s) => {
        const target = safeNumber(s.target);
        const current = safeNumber(s.current);
        return target > 0 && current / target >= 0.8 && current < target;
      })
      .sort((a, b) => {
        const ratioA =
          safeNumber(a.target) > 0
            ? safeNumber(a.current) / safeNumber(a.target)
            : 0;
        const ratioB =
          safeNumber(b.target) > 0
            ? safeNumber(b.current) / safeNumber(b.target)
            : 0;
        return ratioB - ratioA;
      });

    return {
      totalTarget: safeNumber(totalTarget),
      totalCurrent: safeNumber(totalCurrent),
      overallProgress: safeNumber(overallProgress),
      completedSavings,
      activeSavings,
      nearingCompletion,
      hasSavings: validSavings.length > 0, // PERBAIKAN: Tambah flag
    };
  } catch (error) {

    return {
      totalTarget: 0,
      totalCurrent: 0,
      overallProgress: 0,
      completedSavings: 0,
      activeSavings: 0,
      nearingCompletion: [],
      hasSavings: false,
    };
  }
};

// ==================== FINANCIAL HEALTH SCORE (DIPERBAIKI - fix savings scoring) ====================

export interface FinancialHealthScore {
  overallScore: number;
  category: string;
  color: string;
  factors: {
    savingsRate: {
      score: number;
      weight: number;
      status: "good" | "warning" | "poor";
    };
    budgetAdherence: {
      score: number;
      weight: number;
      status: "good" | "warning" | "poor";
    };
    expenseControl: {
      score: number;
      weight: number;
      status: "good" | "warning" | "poor";
    };
    goalProgress: {
      score: number;
      weight: number;
      status: "good" | "warning" | "poor";
    };
  };
  recommendations: string[];
}

type FactorStatus = "good" | "warning" | "poor";

export const calculateFinancialHealthScore = (
  transactionAnalytics: ReturnType<typeof calculateTransactionAnalytics>,
  budgetAnalytics: ReturnType<typeof calculateBudgetAnalytics>,
  savingsAnalytics: ReturnType<typeof calculateSavingsAnalytics>,
  totalActiveDebt: number = 0   // NEW: Total sisa hutang aktif (borrowed)
): FinancialHealthScore => {
  try {
    const hasTransactions = transactionAnalytics.transactionCount > 0;
    const totalIncome = safeNumber(transactionAnalytics.totalIncome);
    const totalExpense = safeNumber(transactionAnalytics.totalExpense);

    if (!hasTransactions && totalIncome === 0 && totalExpense === 0) {
      return {
        overallScore: 0,
        category: "Belum Ada Data",
        color: "#64748B",
        factors: {
          savingsRate: { score: 0, weight: 0, status: "poor" as FactorStatus },
          budgetAdherence: { score: 0, weight: 0, status: "poor" as FactorStatus },
          expenseControl: { score: 0, weight: 1, status: "poor" as FactorStatus },
          goalProgress: { score: 0, weight: 0, status: "poor" as FactorStatus },
        },
        recommendations: [
          "Mulai dengan mencatat transaksi pemasukan pertama Anda",
        ],
      };
    }

    if (totalIncome <= 0 && totalExpense > 0) {
      return {
        overallScore: 20,
        category: "Kritis",
        color: "#DC2626",
        factors: {
           savingsRate: { score: 0, weight: 0, status: "poor" as FactorStatus },
           budgetAdherence: { score: 0, weight: 0, status: "poor" as FactorStatus },
           expenseControl: { score: 20, weight: 1, status: "poor" as FactorStatus },
           goalProgress: { score: 0, weight: 0, status: "poor" as FactorStatus },
        },
        recommendations: [
          "Tidak ada pemasukan tercatat, tapi ada pengeluaran.",
          "Tambahkan pemasukan rutin Anda untuk melihat skor akurat."
        ],
      };
    }

    // Hutang dihitung sebagai beban tambahan di atas pengeluaran
    const safeDebt = safeNumber(totalActiveDebt);
    const effectiveExpense = totalExpense + safeDebt;
    const expenseRatio = effectiveExpense / totalIncome;
    let score = 0;
    let category = "";
    let color = "";
    let recommendations: string[] = [];
    let status: FactorStatus = "poor";

    if (expenseRatio <= 0.4) {
      score = 100;
      category = "Sangat Sehat";
      color = "#10B981";
      status = "good";
      recommendations = [
        "Bagus sekali! Pengeluaran Anda berada di bawah 40%.",
        "Anda menyisihkan porsi tabungan yang sangat sehat.",
        ...(safeDebt > 0 ? ["💳 Anda masih punya hutang aktif — pertahankan cicilan agar tetap di zona aman."] : []),
      ];
    } else if (expenseRatio <= 0.6) {
      score = 80;
      category = "Sehat";
      color = "#3B82F6";
      status = "good";
      recommendations = [
        "Keuangan Anda dalam kondisi sehat.",
        "Anda berhasil menjaga pengeluaran pada takaran normal.",
        ...(safeDebt > 0 ? ["💳 Hutang Anda sudah diperhitungkan dalam beban ini. Prioritaskan pelunasan."] : []),
      ];
    } else if (expenseRatio <= 0.7) {
      score = 60;
      category = "Cukup";
      color = "#F59E0B";
      status = "warning";
      recommendations = [
        "Pengeluaran Anda mulai mendekati batas tinggi.",
        "Lebih waspada terhadap belanja-belanja kecil minggu ini.",
        ...(safeDebt > 0 ? ["💳 Hutang ikut menekan skor Anda! Kurangi hutang untuk memperbaiki kesehatan keuangan."] : []),
      ];
    } else if (expenseRatio < 0.8) {
      score = 40;
      category = "Perlu Perbaikan";
      color = "#EF4444";
      status = "warning";
      recommendations = [
        "Warning! Pengeluaran + hutang Anda memakan mayoritas pemasukan.",
        "Stop pengeluaran tersier, fokus hanya untuk makan dan darurat.",
        ...(safeDebt > 0 ? ["💳 Segera cicil hutang aktif untuk menurunkan beban keuangan Anda."] : []),
      ];
    } else {
      score = 20;
      category = "Kritis";
      color = "#DC2626";
      status = "poor";
      recommendations = [
        safeDebt > 0
          ? `GAWAT! Pengeluaran + sisa hutang (${(safeDebt/1000).toFixed(0)}rb) mencapai 80%+ dari pemasukan!`
          : "GAWAT! Pengeluaran Anda mencapai 80% atau lebih dari pemasukan.",
        "Anda berada di ambang kesulitan finansial. Hentikan pengeluaran yang tidak penting secepatnya!",
        ...(safeDebt > 0 ? ["💳 Hutang Anda adalah kontributor utama skor kritis ini. Lunasi sesegera mungkin!"] : []),
      ];
    }

    return {
      overallScore: score,
      category,
      color,
      factors: {
        savingsRate: { score: 0, weight: 0, status: "poor" },
        budgetAdherence: { score: 0, weight: 0, status: "poor" },
        expenseControl: { score, weight: 1, status },
        goalProgress: { score: 0, weight: 0, status: "poor" },
      },
      recommendations,
    };
  } catch (error) {

    return {
      overallScore: 0,
      category: "Belum Ada Data",
      color: "#64748B",
      factors: {
        savingsRate: { score: 0, weight: 0, status: "poor" },
        budgetAdherence: { score: 0, weight: 0, status: "poor" },
        expenseControl: { score: 0, weight: 1, status: "poor" },
        goalProgress: { score: 0, weight: 0, status: "poor" },
      },
      recommendations: ["Maaf terjadi kesalahan kalkulasi skor."],
    };
  }
};

// Helper functions for health score calculation
const calculateSavingsRateScore = (savingsRate: number) => {
  let score: number;
  let status: FactorStatus;

  if (savingsRate >= 20) {
    score = 100;
    status = "good";
  } else if (savingsRate >= 10) {
    score = 70;
    status = "warning";
  } else if (savingsRate >= 0) {
    score = 40;
    status = "warning";
  } else {
    score = 0;
    status = "poor";
  }

  return { score, weight: 0.3, status };
};

const calculateBudgetAdherenceScore = (
  budgetAnalytics: ReturnType<typeof calculateBudgetAnalytics>
) => {
  // Jika tidak ada anggaran sama sekali
  if (!budgetAnalytics.hasBudgets) {
    return { score: 0, weight: 0.3, status: "poor" as FactorStatus };
  }

  const utilizationRate = safeNumber(budgetAnalytics.utilizationRate);
  const overBudgetCount = budgetAnalytics.overBudgetCount;
  const totalBudgets =
    budgetAnalytics.overBudgetCount + budgetAnalytics.underBudgetCount;

  let score: number;
  let status: FactorStatus;

  if (totalBudgets === 0) {
    score = 0;
    status = "poor";
  } else if (overBudgetCount === 0) {
    if (utilizationRate <= 80) {
      score = 100;
      status = "good";
    } else if (utilizationRate <= 90) {
      score = 80;
      status = "warning";
    } else if (utilizationRate <= 100) {
      score = 60;
      status = "warning";
    } else {
      score = 40;
      status = "warning";
    }
  } else {
    const penaltyPerOverBudget = Math.min(20, Math.floor(100 / totalBudgets));
    const penalty = overBudgetCount * penaltyPerOverBudget;
    score = Math.max(0, 100 - penalty);
    status = overBudgetCount > totalBudgets * 0.5 ? "poor" : "warning";
  }

  return { score, weight: 0.3, status };
};

const calculateExpenseControlScore = (
  totalIncome: number,
  totalExpense: number
) => {
  // Perbaikan: Jika tidak ada data sama sekali
  if (totalIncome === 0 && totalExpense === 0) {
    return { score: 0, weight: 0.25, status: "poor" as FactorStatus };
  }

  const expenseRatio = totalIncome > 0 ? totalExpense / totalIncome : 1;

  let score: number;
  let status: FactorStatus;

  if (expenseRatio <= 0.7) {
    score = 100;
    status = "good";
  } else if (expenseRatio <= 0.9) {
    score = 70;
    status = "warning";
  } else if (expenseRatio <= 1) {
    score = 40;
    status = "warning";
  } else {
    score = 0;
    status = "poor";
  }

  return { score, weight: 0.25, status };
};

// PERBAIKAN BESAR: Goal Progress Score - FIXED
const calculateGoalProgressScore = (
  savingsAnalytics: ReturnType<typeof calculateSavingsAnalytics>
) => {
  

  // Jika tidak ada tabungan sama sekali
  if (!savingsAnalytics.hasSavings) {

    return { score: 0, weight: 0.15, status: "poor" as FactorStatus };
  }

  const overallProgress = safeNumber(savingsAnalytics.overallProgress);
  const completedCount = savingsAnalytics.completedSavings;
  const totalCount =
    savingsAnalytics.activeSavings + savingsAnalytics.completedSavings;

  let score: number;
  let status: FactorStatus;

  if (totalCount === 0) {
    // Tidak mungkin terjadi karena hasSavings = true, tapi tetap handle
    score = 0;
    status = "poor";
  } else if (completedCount === totalCount && totalCount > 0) {
    // Semua tabungan sudah tercapai
    score = 100;
    status = "good";
  } else if (overallProgress >= 75) {
    // Progress sangat baik
    score = 85;
    status = "good";
  } else if (overallProgress >= 50) {
    // Progress baik
    score = 70;
    status = "warning";
  } else if (overallProgress >= 25) {
    // Progress sedang
    score = 50;
    status = "warning";
  } else if (overallProgress > 0) {
    // Progress sedikit
    score = 30;
    status = "poor";
  } else {
    // Belum ada progress sama sekali
    score = 0;
    status = "poor";
  }


  return { score, weight: 0.15, status };
};

const getScoreCategory = (score: number) => {
  if (score === 0) {
    return { category: "Belum Ada Data", color: "#64748B" };
  } else if (score >= 80) {
    return { category: "Sangat Sehat", color: "#10B981" };
  } else if (score >= 60) {
    return { category: "Sehat", color: "#3B82F6" };
  } else if (score >= 40) {
    return { category: "Cukup", color: "#F59E0B" };
  } else if (score >= 20) {
    return { category: "Perlu Perbaikan", color: "#EF4444" };
  } else {
    return { category: "Kritis", color: "#DC2626" };
  }
};

// PERBAIKAN: Update generate recommendations dengan parameter hasSavings
const generateRecommendations = (factors: {
  savingsRateScore: { score: number; status: FactorStatus };
  budgetAdherenceScore: { score: number; status: FactorStatus };
  expenseControlScore: { score: number; status: FactorStatus };
  goalProgressScore: { score: number; status: FactorStatus };
  hasBudgets: boolean;
  hasSavings: boolean; // PERBAIKAN: Tambah parameter
}) => {
  const recommendations: string[] = [];

  // Jika semua skor 0 (belum ada data)
  if (
    factors.savingsRateScore.score === 0 &&
    factors.budgetAdherenceScore.score === 0 &&
    factors.expenseControlScore.score === 0 &&
    factors.goalProgressScore.score === 0
  ) {
    return [
      "Mulai dengan mencatat transaksi pertama Anda",
      "Buat anggaran sederhana untuk pengeluaran utama",
      "Tetapkan target tabungan kecil untuk memulai",
    ];
  }

  // Budget recommendations
  if (factors.hasBudgets) {
    if (
      factors.budgetAdherenceScore.status === "poor" ||
      factors.budgetAdherenceScore.score < 40
    ) {
      recommendations.push(
        "Tinjau ulang anggaran yang melebihi limit dan sesuaikan pengeluaran"
      );
    } else if (factors.budgetAdherenceScore.status === "warning") {
      recommendations.push(
        "Monitor anggaran yang mendekati limit untuk menghindari kelebihan"
      );
    }
  } else {
    recommendations.push("Buat anggaran untuk kategori pengeluaran utama Anda");
  }

  // Savings rate recommendations
  if (
    factors.savingsRateScore.status === "poor" ||
    factors.savingsRateScore.score < 40
  ) {
    recommendations.push(
      "Tingkatkan rasio tabungan minimal 10% dari pemasukan"
    );
  } else if (factors.savingsRateScore.status === "warning") {
    recommendations.push(
      "Targetkan rasio tabungan 20% untuk kesehatan keuangan optimal"
    );
  }

  // Expense control recommendations
  if (
    factors.expenseControlScore.status === "poor" ||
    factors.expenseControlScore.score < 40
  ) {
    recommendations.push(
      "Kurangi pengeluaran yang tidak penting, fokus pada kebutuhan utama"
    );
  } else if (factors.expenseControlScore.status === "warning") {
    recommendations.push(
      "Analisis pengeluaran kategori terbesar untuk efisiensi"
    );
  }

  // Goal progress recommendations - PERBAIKAN: Cek dulu apakah ada tabungan
  if (factors.hasSavings) {
    if (
      factors.goalProgressScore.status === "poor" ||
      factors.goalProgressScore.score < 40
    ) {
      recommendations.push(
        "Tingkatkan kontribusi tabungan untuk mencapai target lebih cepat"
      );
    } else if (factors.goalProgressScore.status === "warning") {
      recommendations.push(
        "Pertahankan konsistensi menabung untuk mencapai target"
      );
    }
  } else {
    // Jika tidak ada tabungan sama sekali
    recommendations.push(
      "Mulai buat target tabungan untuk tujuan finansial Anda"
    );
  }

  // If no specific recommendations, provide general tips
  if (recommendations.length === 0) {
    recommendations.push(
      "Pertahankan kebiasaan keuangan sehat Anda",
      "Review laporan keuangan secara berkala"
    );
  }

  return recommendations.slice(0, 4);
};

// ==================== FINANCIAL INSIGHTS ====================

// Generate financial insights based on analytics
export const generateFinancialInsights = (
  transactionAnalytics: ReturnType<typeof calculateTransactionAnalytics>,
  budgetAnalytics: ReturnType<typeof calculateBudgetAnalytics>,
  savingsAnalytics: ReturnType<typeof calculateSavingsAnalytics>
) => {
  try {
    const insights = [];

    

    // Check if no data
    if (
      transactionAnalytics.transactionCount === 0 &&
      !budgetAnalytics.hasBudgets &&
      !savingsAnalytics.hasSavings // PERBAIKAN: Gunakan hasSavings
    ) {
      insights.push({
        type: "info",
        title: "Mulai Catat Keuangan",
        message:
          "Belum ada data transaksi. Mulai catat pengeluaran dan pemasukan untuk melihat analitik.",
        icon: "document-text-outline",
        color: "#64748B",
      });
      return insights;
    }

    // Transaction insights
    const savingsRate = safeNumber(transactionAnalytics.savingsRate) || 0;

    if (savingsRate < 0) {
      insights.push({
        type: "warning",
        title: "Defisit Terdeteksi",
        message: "Pengeluaran Anda melebihi pemasukan bulan ini.",
        icon: "warning",
        color: "#EF4444",
      });
    } else if (savingsRate < 20) {
      insights.push({
        type: "info",
        title: "Rasio Tabungan Rendah",
        message: "Coba tingkatkan rasio tabungan minimal 20% dari pemasukan.",
        icon: "info",
        color: "#F59E0B",
      });
    } else {
      insights.push({
        type: "success",
        title: "Rasio Tabungan Baik",
        message: "Rasio tabungan Anda di atas 20%, pertahankan!",
        icon: "checkmark",
        color: "#10B981",
      });
    }

    // Budget insights
    if (budgetAnalytics.hasBudgets) {
      const overBudgetCount = budgetAnalytics.overBudgetCount || 0;
      if (overBudgetCount > 0) {
        insights.push({
          type: "warning",
          title: `${overBudgetCount} Anggaran Melebihi Limit`,
          message: "Beberapa kategori pengeluaran melebihi batas anggaran.",
          icon: "pie-chart",
          color: "#EF4444",
        });
      }

      const budgetsAtRisk = budgetAnalytics.budgetsAtRisk || [];
      if (budgetsAtRisk.length > 0) {
        insights.push({
          type: "info",
          title: `${budgetsAtRisk.length} Anggaran Mendekati Limit`,
          message: "Beberapa kategori hampir mencapai batas anggaran.",
          icon: "alert",
          color: "#F59E0B",
        });
      }
    } else {
      insights.push({
        type: "info",
        title: "Belum Ada Anggaran",
        message: "Buat anggaran untuk kategori pengeluaran utama Anda.",
        icon: "pie-chart-outline",
        color: "#64748B",
      });
    }

    // PERBAIKAN BESAR: Savings insights - Cek dulu apakah ada tabungan
    if (savingsAnalytics.hasSavings) {
      const nearingCompletion = savingsAnalytics.nearingCompletion || [];
      if (nearingCompletion.length > 0) {
        insights.push({
          type: "success",
          title: `${nearingCompletion.length} Target Tabungan Hampir Tercapai`,
          message: "Beberapa target tabungan Anda hampir tercapai!",
          icon: "trophy",
          color: "#10B981",
        });
      }

      const overallProgress = safeNumber(savingsAnalytics.overallProgress) || 0;
      if (overallProgress >= 75) {
        insights.push({
          type: "success",
          title: "Progress Tabungan Sangat Baik",
          message: `Anda telah mencapai ${overallProgress.toFixed(
            1
          )}% dari total target tabungan.`,
          icon: "trophy",
          color: "#10B981",
        });
      } else if (overallProgress >= 50) {
        insights.push({
          type: "info",
          title: "Progress Tabungan Baik",
          message: `Anda telah mencapai ${overallProgress.toFixed(
            1
          )}% dari total target tabungan.`,
          icon: "trending-up",
          color: "#3B82F6",
        });
      } else if (overallProgress > 0) {
        insights.push({
          type: "info",
          title: "Mulai Menabung",
          message: `Anda telah memulai dengan ${overallProgress.toFixed(
            1
          )}% dari target tabungan.`,
          icon: "trending-up",
          color: "#3B82F6",
        });
      }
    } else {
      // Insight jika belum ada tabungan
      insights.push({
        type: "info",
        title: "Belum Ada Target Tabungan",
        message: "Buat target tabungan untuk mencapai tujuan finansial Anda.",
        icon: "wallet-outline",
        color: "#64748B",
      });
    }

    // Add default insight if none
    if (insights.length === 0) {
      insights.push({
        type: "info",
        title: "Keuangan Sehat",
        message: "Semua indikator keuangan Anda dalam kondisi baik.",
        icon: "heart",
        color: "#10B981",
      });
    }

    return insights.slice(0, 3);
  } catch (error) {

    return [
      {
        type: "info",
        title: "Analitik Dimuat",
        message: "Sistem analitik sedang memproses data Anda",
        icon: "information-circle",
        color: "#3B82F6",
      },
    ];
  }
};
