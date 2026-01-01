import { Transaction, Budget, Savings } from "../types";
import { getMonthRange } from "./formatters";

// Calculate analytics data for transactions
export const calculateTransactionAnalytics = (
  transactions: Transaction[],
  timeRange: "week" | "month" | "year" = "month"
) => {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  switch (timeRange) {
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      const monthRange = getMonthRange();
      startDate = monthRange.start;
      endDate = monthRange.end;
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      break;
  }

  // Filter transactions by date range
  const filteredTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.date);
    return transactionDate >= startDate && transactionDate <= endDate;
  });

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

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
      .reduce((sum, t) => sum + t.amount, 0);

    const dayExpense = dayTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

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
      categorySpending[t.category] =
        (categorySpending[t.category] || 0) + t.amount;
    });

  // Sort categories by spending
  const topCategories = Object.entries(categorySpending)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Calculate average daily spending
  const daysInRange = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const avgDailyExpense = daysInRange > 0 ? totalExpense / daysInRange : 0;

  return {
    timeRange,
    startDate,
    endDate,
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate,
    dailyTrends,
    topCategories,
    avgDailyExpense,
    transactionCount: filteredTransactions.length,
    incomeTransactionCount: filteredTransactions.filter(
      (t) => t.type === "income"
    ).length,
    expenseTransactionCount: filteredTransactions.filter(
      (t) => t.type === "expense"
    ).length,
  };
};

// Calculate budget utilization analytics
export const calculateBudgetAnalytics = (budgets: Budget[]) => {
  if (budgets.length === 0) {
    return {
      totalBudget: 0,
      totalSpent: 0,
      utilizationRate: 0,
      overBudgetCount: 0,
      underBudgetCount: 0,
      budgetsAtRisk: [] as Budget[],
    };
  }

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const utilizationRate =
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const overBudgetCount = budgets.filter((b) => b.spent > b.limit).length;
  const underBudgetCount = budgets.filter((b) => b.spent <= b.limit).length;

  const budgetsAtRisk = budgets
    .filter((b) => b.spent > b.limit * 0.8) // More than 80% spent
    .sort((a, b) => b.spent / b.limit - a.spent / a.limit);

  return {
    totalBudget,
    totalSpent,
    utilizationRate,
    overBudgetCount,
    underBudgetCount,
    budgetsAtRisk,
  };
};

// Calculate savings progress analytics
export const calculateSavingsAnalytics = (savings: Savings[]) => {
  if (savings.length === 0) {
    return {
      totalTarget: 0,
      totalCurrent: 0,
      overallProgress: 0,
      completedSavings: 0,
      activeSavings: 0,
      nearingCompletion: [] as Savings[],
    };
  }

  const totalTarget = savings.reduce((sum, s) => sum + s.target, 0);
  const totalCurrent = savings.reduce((sum, s) => sum + s.current, 0);
  const overallProgress =
    totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  const completedSavings = savings.filter((s) => s.current >= s.target).length;
  const activeSavings = savings.filter((s) => s.current < s.target).length;

  const nearingCompletion = savings
    .filter((s) => s.current / s.target >= 0.8 && s.current < s.target)
    .sort((a, b) => b.current / b.target - a.current / a.target);

  return {
    totalTarget,
    totalCurrent,
    overallProgress,
    completedSavings,
    activeSavings,
    nearingCompletion,
  };
};

// Generate financial insights based on analytics
export const generateFinancialInsights = (
  transactionAnalytics: ReturnType<typeof calculateTransactionAnalytics>,
  budgetAnalytics: ReturnType<typeof calculateBudgetAnalytics>,
  savingsAnalytics: ReturnType<typeof calculateSavingsAnalytics>
) => {
  const insights = [];

  // Transaction insights
  if (transactionAnalytics.savingsRate < 0) {
    insights.push({
      type: "warning",
      title: "Defisit Terdeteksi",
      message: "Pengeluaran Anda melebihi pemasukan bulan ini.",
      icon: "warning",
      color: "#DC2626",
    });
  } else if (transactionAnalytics.savingsRate < 20) {
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
  if (budgetAnalytics.overBudgetCount > 0) {
    insights.push({
      type: "warning",
      title: `${budgetAnalytics.overBudgetCount} Anggaran Melebihi Limit`,
      message: "Beberapa kategori pengeluaran melebihi batas anggaran.",
      icon: "pie-chart",
      color: "#DC2626",
    });
  }

  if (budgetAnalytics.budgetsAtRisk.length > 0) {
    insights.push({
      type: "info",
      title: `${budgetAnalytics.budgetsAtRisk.length} Anggaran Mendekati Limit`,
      message: "Beberapa kategori hampir mencapai batas anggaran.",
      icon: "alert",
      color: "#F59E0B",
    });
  }

  // Savings insights
  if (savingsAnalytics.nearingCompletion.length > 0) {
    insights.push({
      type: "success",
      title: `${savingsAnalytics.nearingCompletion.length} Target Tabungan Hampir Tercapai`,
      message: "Beberapa target tabungan Anda hampir tercapai!",
      icon: "trophy",
      color: "#10B981",
    });
  }

  if (savingsAnalytics.overallProgress >= 50) {
    insights.push({
      type: "info",
      title: "Progress Tabungan Baik",
      message: `Anda telah mencapai ${savingsAnalytics.overallProgress.toFixed(
        1
      )}% dari total target tabungan.`,
      icon: "trending-up",
      color: "#4F46E5",
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

  return insights.slice(0, 3); // Return max 3 insights
};
