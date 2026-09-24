import { AppState, Budget, Savings } from "../../types";
import { NotificationMessages } from "./messages";
import {
  calculateBudgetProgress,
  calculateSavingsProgress,
  getCurrentDate,
  safeNumber,
  formatCurrency,
  formatToDateKey,
} from "../calculations";

export const checkBudgetAlerts = (appState: AppState): any[] => {
  const alerts = [];
  const today = getCurrentDate();

  try {
    for (const budget of appState.budgets || []) {
      const budgetStart = (budget.startDate || "").slice(0, 10);
      const budgetEnd = (budget.endDate || "").slice(0, 10);

      // Skip if budget not active today
      if (budgetStart && budgetStart > today) continue;
      if (budgetEnd && budgetEnd < today) continue;

      const percentage = calculateBudgetProgress(budget);

      // Budget warning (80-99%)
      if (percentage >= 80 && percentage < 100) {
        alerts.push(NotificationMessages.budgetWarning(budget));
      }

      // Budget exceeded (100%+)
      if (percentage >= 100) {
        alerts.push(NotificationMessages.budgetExceeded(budget));
      }
    }
  } catch (error) {
    console.warn("[checkBudgetAlerts] error:", error);
  }

  return alerts;
};

export const checkSavingsProgress = (appState: AppState): any[] => {
  const alerts = [];

  try {
    for (const savings of appState.savings) {
      if (savings.target <= 0) continue;

      const percentage = calculateSavingsProgress(savings);

      // Check milestone percentages (100, 75, 50, 25)
      const milestones = [100, 75, 50, 25];
      for (const milestone of milestones) {
        if (milestone === 100) {
          if (percentage >= 100) {
            alerts.push(NotificationMessages.savingsComplete(savings));
            break;
          }
        } else if (percentage >= milestone && percentage < milestone + 5) {
          alerts.push(
            NotificationMessages.savingsMilestone(savings, milestone)
          );
          break; // Only show one alert per savings item
        }
      }

      // Deadline approaching (within 7 days)
      if (savings.deadline) {
        try {
          const deadline = new Date(savings.deadline);
          const today = new Date();
          const daysLeft = Math.ceil(
            (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysLeft <= 7 && daysLeft > 0) {
            alerts.push({
              title: "⏰ Deadline Mendekati",
              body: `Tabungan "${
                savings.name
              }" deadline ${daysLeft} hari lagi!\nProgress: ${Math.round(
                percentage
              )}%`,
              data: { type: "SAVINGS_DEADLINE", savingsId: savings.id },
            });
          }
        } catch (dateError) {

        }
      }
    }
  } catch (error) {

  }

  return alerts;
};

export const checkTransactionReminders = (appState: AppState): any[] => {
  const alerts = [];
  const today = getCurrentDate();
  const currentHour = new Date().getHours();

  try {
    // Check if user hasn't recorded any transactions today
    const todayTransactions = appState.transactions.filter(
      (t) => t.date === today
    );

    // Only remind in afternoon/evening if no transactions
    if (
      todayTransactions.length === 0 &&
      currentHour >= 16 &&
      currentHour <= 20
    ) {
      alerts.push(NotificationMessages.noTransactionToday());
    }

    // Check for large transactions today
    const largeTransactions = todayTransactions.filter(
      (t) => t.amount >= 1000000 && t.type === "expense"
    );

    if (largeTransactions.length > 0 && currentHour >= 18) {
      const largest = largeTransactions.reduce(
        (max, t) => (t.amount > max.amount ? t : max),
        { amount: 0, category: "" }
      );

      alerts.push({
        title: "💰 Transaksi Besar Hari Ini",
        body: `Transaksi terbesar: ${largest.category} sebesar ${formatCurrency(
          largest.amount
        )}`,
        data: { type: "LARGE_TRANSACTION", category: largest.category },
      });
    }
  } catch (error) {

  }

  return alerts;
};

export const checkNotesReminders = (_appState: AppState): any[] => {
  return [];
};

export const generateDailySummary = (appState: AppState): string => {
  const today = getCurrentDate();

  try {
    const todayTransactions = appState.transactions.filter(
      (t) => t.date === today
    );
    const todayExpenses = todayTransactions
      .reduce((sum, t) => {
        if (t.type === "expense") return sum + safeNumber(t.amount);
        if (t.type === "transfer") return sum + safeNumber(t.adminFee);
        return sum;
      }, 0);

    const todayIncome = todayTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0);

    const biggestExpense = todayTransactions
      .filter((t) => t.type === "expense")
      .reduce(
        (max, t) => (t.amount > max.amount ? t : max),
        { amount: 0, category: "Tidak ada" } as { amount: number; category: string }
      );

    let summary = `📊 Ringkasan Harian:\n`;
    summary += `✅ Pemasukan: ${formatCurrency(todayIncome)}\n`;
    summary += `✅ Pengeluaran: ${formatCurrency(todayExpenses)}`;

    if (biggestExpense.amount > 0) {
      summary += `\n📈 Pengeluaran terbesar: ${
        biggestExpense.category
      } (${formatCurrency(biggestExpense.amount)})`;
    }

    return summary;
  } catch (error) {

    return "📊 Ringkasan harian tidak tersedia saat ini.";
  }
};

// Helper untuk weekly summary (untuk hari Minggu)
export const generateWeeklySummary = (appState: AppState): string => {
  try {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekStartStr = formatToDateKey(weekStart);
    const weekEndStr = formatToDateKey(weekEnd);

    const weekTransactions = appState.transactions.filter(
      (t) => t.date >= weekStartStr && t.date <= weekEndStr
    );
    const weekIncome = weekTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0);

    const weekExpense = weekTransactions
      .reduce((sum, t) => {
        if (t.type === "expense") return sum + safeNumber(t.amount);
        if (t.type === "transfer") return sum + safeNumber(t.adminFee);
        return sum;
      }, 0);

    return (
      `📈 Ringkasan Mingguan:\n` +
      `💰 Pemasukan: ${formatCurrency(weekIncome)}\n` +
      `💸 Pengeluaran: ${formatCurrency(weekExpense)}\n` +
      `📈 Balance: ${formatCurrency(weekIncome - weekExpense)}`
    );
  } catch (error) {

    return "📈 Ringkasan mingguan tidak tersedia.";
  }
};
