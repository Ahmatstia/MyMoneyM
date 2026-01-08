// File: src/utils/analytics.ts
import { Transaction, Budget, Savings } from "../types";
import { getMonthRange, getWeekRange, getYearRange } from "./formatters";
import { safeNumber, getSafePercentage } from "./calculations";

// ==================== SAFE ANALYTICS FUNCTIONS ====================

// Calculate analytics data for transactions with safe defaults
export const calculateTransactionAnalytics = (
  transactions: Transaction[] = [],
  timeRange: "week" | "month" | "year" = "month"
) => {
  try {
    let startDate: Date;
    let endDate: Date;

    switch (timeRange) {
      case "week":
        const weekRange = getWeekRange();
        startDate = weekRange.start;
        endDate = weekRange.end;
        break;
      case "month":
        const monthRange = getMonthRange();
        startDate = monthRange.start;
        endDate = monthRange.end;
        break;
      case "year":
        const yearRange = getYearRange();
        startDate = yearRange.start;
        endDate = yearRange.end;
        break;
      default:
        const defaultRange = getMonthRange();
        startDate = defaultRange.start;
        endDate = defaultRange.end;
    }

    // Filter transactions by date range with error handling
    const filteredTransactions = transactions.filter((t) => {
      try {
        if (!t || !t.date) return false;
        const transactionDate = new Date(t.date);
        if (isNaN(transactionDate.getTime())) return false;
        return transactionDate >= startDate && transactionDate <= endDate;
      } catch (error) {
        return false;
      }
    });

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
    console.error("Error in calculateTransactionAnalytics:", error);
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

// Calculate budget utilization analytics
export const calculateBudgetAnalytics = (budgets: Budget[] = []) => {
  try {
    if (!budgets || budgets.length === 0) {
      return {
        totalBudget: 0,
        totalSpent: 0,
        utilizationRate: 0,
        overBudgetCount: 0,
        underBudgetCount: 0,
        budgetsAtRisk: [] as Budget[],
      };
    }

    const totalBudget = budgets.reduce(
      (sum, b) => sum + safeNumber(b.limit),
      0
    );
    const totalSpent = budgets.reduce((sum, b) => sum + safeNumber(b.spent), 0);
    const utilizationRate =
      totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    const overBudgetCount = budgets.filter(
      (b) => safeNumber(b.spent) > safeNumber(b.limit)
    ).length;
    const underBudgetCount = budgets.filter(
      (b) => safeNumber(b.spent) <= safeNumber(b.limit)
    ).length;

    const budgetsAtRisk = budgets
      .filter((b) => safeNumber(b.spent) > safeNumber(b.limit) * 0.8)
      .sort((a, b) => {
        const ratioA =
          safeNumber(b.limit) > 0
            ? safeNumber(b.spent) / safeNumber(b.limit)
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
    };
  } catch (error) {
    console.error("Error in calculateBudgetAnalytics:", error);
    return {
      totalBudget: 0,
      totalSpent: 0,
      utilizationRate: 0,
      overBudgetCount: 0,
      underBudgetCount: 0,
      budgetsAtRisk: [],
    };
  }
};

// Calculate savings progress analytics
export const calculateSavingsAnalytics = (savings: Savings[] = []) => {
  try {
    if (!savings || savings.length === 0) {
      return {
        totalTarget: 0,
        totalCurrent: 0,
        overallProgress: 0,
        completedSavings: 0,
        activeSavings: 0,
        nearingCompletion: [] as Savings[],
      };
    }

    const totalTarget = savings.reduce(
      (sum, s) => sum + safeNumber(s.target),
      0
    );
    const totalCurrent = savings.reduce(
      (sum, s) => sum + safeNumber(s.current),
      0
    );
    const overallProgress =
      totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

    const completedSavings = savings.filter(
      (s) => safeNumber(s.current) >= safeNumber(s.target)
    ).length;
    const activeSavings = savings.filter(
      (s) => safeNumber(s.current) < safeNumber(s.target)
    ).length;

    const nearingCompletion = savings
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
    };
  } catch (error) {
    console.error("Error in calculateSavingsAnalytics:", error);
    return {
      totalTarget: 0,
      totalCurrent: 0,
      overallProgress: 0,
      completedSavings: 0,
      activeSavings: 0,
      nearingCompletion: [],
    };
  }
};

// ==================== FINANCIAL HEALTH SCORE ====================

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
    emergencyFund: {
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

export const calculateFinancialHealthScore = (
  transactionAnalytics: ReturnType<typeof calculateTransactionAnalytics>,
  budgetAnalytics: ReturnType<typeof calculateBudgetAnalytics>,
  savingsAnalytics: ReturnType<typeof calculateSavingsAnalytics>
): FinancialHealthScore => {
  try {
    // Factor 1: Savings Rate (30%)
    const savingsRateScore = calculateSavingsRateScore(
      safeNumber(transactionAnalytics.savingsRate)
    );

    // Factor 2: Budget Adherence (25%)
    const budgetAdherenceScore = calculateBudgetAdherenceScore(budgetAnalytics);

    // Factor 3: Emergency Fund (20%)
    const emergencyFundScore = calculateEmergencyFundScore(
      safeNumber(transactionAnalytics.totalExpense),
      safeNumber(savingsAnalytics.totalCurrent)
    );

    // Factor 4: Expense Control (15%)
    const expenseControlScore = calculateExpenseControlScore(
      safeNumber(transactionAnalytics.totalIncome),
      safeNumber(transactionAnalytics.totalExpense)
    );

    // Factor 5: Goal Progress (10%)
    const goalProgressScore = calculateGoalProgressScore(savingsAnalytics);

    // Calculate weighted overall score
    const overallScore = Math.round(
      savingsRateScore.score * savingsRateScore.weight +
        budgetAdherenceScore.score * budgetAdherenceScore.weight +
        emergencyFundScore.score * emergencyFundScore.weight +
        expenseControlScore.score * expenseControlScore.weight +
        goalProgressScore.score * goalProgressScore.weight
    );

    // Determine category and color - MENGGUNAKAN WARNA DARI TEMA
    const { category, color } = getScoreCategory(overallScore);

    // Generate recommendations
    const recommendations = generateRecommendations({
      savingsRateScore,
      budgetAdherenceScore,
      emergencyFundScore,
      expenseControlScore,
      goalProgressScore,
    });

    return {
      overallScore,
      category,
      color,
      factors: {
        savingsRate: savingsRateScore,
        budgetAdherence: budgetAdherenceScore,
        emergencyFund: emergencyFundScore,
        expenseControl: expenseControlScore,
        goalProgress: goalProgressScore,
      },
      recommendations,
    };
  } catch (error) {
    console.error("Error calculating health score:", error);
    // Return safe default dengan warna dari tema
    return {
      overallScore: 50,
      category: "Cukup",
      color: "#F59E0B", // warning color dari tema
      factors: {
        savingsRate: { score: 50, weight: 0.3, status: "warning" },
        budgetAdherence: { score: 50, weight: 0.25, status: "warning" },
        emergencyFund: { score: 50, weight: 0.2, status: "warning" },
        expenseControl: { score: 50, weight: 0.15, status: "warning" },
        goalProgress: { score: 50, weight: 0.1, status: "warning" },
      },
      recommendations: [
        "Mulai dengan mencatat semua transaksi secara rutin",
        "Buat anggaran untuk kategori pengeluaran utama",
      ],
    };
  }
};

// Helper functions for health score calculation
const calculateSavingsRateScore = (savingsRate: number) => {
  let score: number;
  let status: "good" | "warning" | "poor";

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
    score = 10;
    status = "poor";
  }

  return { score, weight: 0.3, status };
};

const calculateBudgetAdherenceScore = (
  budgetAnalytics: ReturnType<typeof calculateBudgetAnalytics>
) => {
  const utilizationRate = safeNumber(budgetAnalytics.utilizationRate);
  const overBudgetCount = budgetAnalytics.overBudgetCount;

  let score: number;
  let status: "good" | "warning" | "poor";

  if (overBudgetCount === 0) {
    if (utilizationRate <= 90) {
      score = 100;
      status = "good";
    } else if (utilizationRate <= 100) {
      score = 80;
      status = "warning";
    } else {
      score = 50;
      status = "warning";
    }
  } else {
    score = Math.max(0, 100 - overBudgetCount * 20);
    status = overBudgetCount > 2 ? "poor" : "warning";
  }

  return { score, weight: 0.25, status };
};

const calculateEmergencyFundScore = (
  monthlyExpense: number,
  totalSavings: number
) => {
  const monthsCovered = monthlyExpense > 0 ? totalSavings / monthlyExpense : 0;

  let score: number;
  let status: "good" | "warning" | "poor";

  if (monthsCovered >= 6) {
    score = 100;
    status = "good";
  } else if (monthsCovered >= 3) {
    score = 75;
    status = "warning";
  } else if (monthsCovered >= 1) {
    score = 50;
    status = "warning";
  } else {
    score = 20;
    status = "poor";
  }

  return { score, weight: 0.2, status };
};

const calculateExpenseControlScore = (
  totalIncome: number,
  totalExpense: number
) => {
  const expenseRatio = totalIncome > 0 ? totalExpense / totalIncome : 1;

  let score: number;
  let status: "good" | "warning" | "poor";

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
    score = 10;
    status = "poor";
  }

  return { score, weight: 0.15, status };
};

const calculateGoalProgressScore = (
  savingsAnalytics: ReturnType<typeof calculateSavingsAnalytics>
) => {
  const overallProgress = safeNumber(savingsAnalytics.overallProgress);
  const completedCount = savingsAnalytics.completedSavings;
  const totalCount =
    savingsAnalytics.activeSavings + savingsAnalytics.completedSavings;

  let score: number;
  let status: "good" | "warning" | "poor";

  if (totalCount === 0) {
    score = 50; // Neutral score if no goals
    status = "warning";
  } else if (completedCount === totalCount) {
    score = 100;
    status = "good";
  } else if (overallProgress >= 50) {
    score = 75;
    status = "warning";
  } else if (overallProgress > 0) {
    score = 50;
    status = "warning";
  } else {
    score = 20;
    status = "poor";
  }

  return { score, weight: 0.1, status };
};

// MENGUNAKAN WARNA DARI TEMA YANG SUDAH ADA
const getScoreCategory = (score: number) => {
  if (score >= 80) {
    return { category: "Sangat Sehat", color: "#10B981" }; // success dari tema
  } else if (score >= 60) {
    return { category: "Sehat", color: "#3B82F6" }; // info dari tema
  } else if (score >= 40) {
    return { category: "Cukup", color: "#F59E0B" }; // warning dari tema
  } else if (score >= 20) {
    return { category: "Perlu Perbaikan", color: "#EF4444" }; // error dari tema
  } else {
    return { category: "Kritis", color: "#DC2626" }; // errorDark dari tema
  }
};

const generateRecommendations = (factors: {
  savingsRateScore: { score: number; status: string };
  budgetAdherenceScore: { score: number; status: string };
  emergencyFundScore: { score: number; status: string };
  expenseControlScore: { score: number; status: string };
  goalProgressScore: { score: number; status: string };
}) => {
  const recommendations: string[] = [];

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

  // Budget adherence recommendations
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

  // Emergency fund recommendations
  if (
    factors.emergencyFundScore.status === "poor" ||
    factors.emergencyFundScore.score < 40
  ) {
    recommendations.push("Buat dana darurat minimal 3x pengeluaran bulanan");
  } else if (factors.emergencyFundScore.status === "warning") {
    recommendations.push(
      "Tingkatkan dana darurat hingga 6x pengeluaran bulanan"
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

  // Goal progress recommendations
  if (
    factors.goalProgressScore.status === "poor" ||
    factors.goalProgressScore.score < 40
  ) {
    recommendations.push(
      "Buat target tabungan yang realistis dan mulailah menabung"
    );
  } else if (factors.goalProgressScore.status === "warning") {
    recommendations.push(
      "Tingkatkan kontribusi tabungan untuk mencapai target lebih cepat"
    );
  }

  // If no specific recommendations, provide general tips
  if (recommendations.length === 0) {
    recommendations.push(
      "Pertahankan kebiasaan keuangan sehat Anda",
      "Review laporan keuangan secara berkala"
    );
  }

  return recommendations.slice(0, 4); // Max 4 recommendations
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

    // Transaction insights
    const savingsRate = safeNumber(transactionAnalytics.savingsRate) || 0;

    if (savingsRate < 0) {
      insights.push({
        type: "warning",
        title: "Defisit Terdeteksi",
        message: "Pengeluaran Anda melebihi pemasukan bulan ini.",
        icon: "warning",
        color: "#EF4444", // error dari tema
      });
    } else if (savingsRate < 20) {
      insights.push({
        type: "info",
        title: "Rasio Tabungan Rendah",
        message: "Coba tingkatkan rasio tabungan minimal 20% dari pemasukan.",
        icon: "info",
        color: "#F59E0B", // warning dari tema
      });
    } else {
      insights.push({
        type: "success",
        title: "Rasio Tabungan Baik",
        message: "Rasio tabungan Anda di atas 20%, pertahankan!",
        icon: "checkmark",
        color: "#10B981", // success dari tema
      });
    }

    // Budget insights
    const overBudgetCount = budgetAnalytics.overBudgetCount || 0;
    if (overBudgetCount > 0) {
      insights.push({
        type: "warning",
        title: `${overBudgetCount} Anggaran Melebihi Limit`,
        message: "Beberapa kategori pengeluaran melebihi batas anggaran.",
        icon: "pie-chart",
        color: "#EF4444", // error dari tema
      });
    }

    const budgetsAtRisk = budgetAnalytics.budgetsAtRisk || [];
    if (budgetsAtRisk.length > 0) {
      insights.push({
        type: "info",
        title: `${budgetsAtRisk.length} Anggaran Mendekati Limit`,
        message: "Beberapa kategori hampir mencapai batas anggaran.",
        icon: "alert",
        color: "#F59E0B", // warning dari tema
      });
    }

    // Savings insights
    const nearingCompletion = savingsAnalytics.nearingCompletion || [];
    if (nearingCompletion.length > 0) {
      insights.push({
        type: "success",
        title: `${nearingCompletion.length} Target Tabungan Hampir Tercapai`,
        message: "Beberapa target tabungan Anda hampir tercapai!",
        icon: "trophy",
        color: "#10B981", // success dari tema
      });
    }

    const overallProgress = safeNumber(savingsAnalytics.overallProgress) || 0;
    if (overallProgress >= 50) {
      insights.push({
        type: "info",
        title: "Progress Tabungan Baik",
        message: `Anda telah mencapai ${overallProgress.toFixed(
          1
        )}% dari total target tabungan.`,
        icon: "trending-up",
        color: "#3B82F6", // info dari tema
      });
    }

    // Add default insight if none
    if (insights.length === 0) {
      insights.push({
        type: "info",
        title: "Keuangan Sehat",
        message: "Semua indikator keuangan Anda dalam kondisi baik.",
        icon: "heart",
        color: "#10B981", // success dari tema
      });
    }

    return insights.slice(0, 3); // Return max 3 insights
  } catch (error) {
    console.error("Error generating insights:", error);
    return [
      {
        type: "info",
        title: "Analitik Dimuat",
        message: "Sistem analitik sedang memproses data Anda",
        icon: "information-circle",
        color: "#3B82F6", // info dari tema
      },
    ];
  }
};
