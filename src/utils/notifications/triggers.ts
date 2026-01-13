import { AppState, Budget, Savings } from "../../types";
import { NotificationMessages } from "./messages";
import {
  calculateBudgetProgress,
  calculateSavingsProgress,
  getCurrentDate,
  safeNumber,
  formatCurrency,
} from "../calculations";

export const checkBudgetAlerts = (appState: AppState): any[] => {
  const alerts = [];
  const today = getCurrentDate();

  try {
    for (const budget of appState.budgets) {
      // Skip if budget not active today
      if (budget.startDate > today || budget.endDate < today) continue;

      const percentage = calculateBudgetProgress(budget);

      // Budget warning (80-95%)
      if (percentage >= 80 && percentage < 100) {
        alerts.push(NotificationMessages.budgetWarning(budget));
      }

      // Budget exceeded (100%+)
      if (percentage >= 100) {
        alerts.push(NotificationMessages.budgetExceeded(budget));
      }
    }
  } catch (error) {
    console.error("❌ Error checking budget alerts:", error);
  }

  return alerts;
};

export const checkSavingsProgress = (appState: AppState): any[] => {
  const alerts = [];

  try {
    for (const savings of appState.savings) {
      if (savings.target <= 0) continue;

      const percentage = calculateSavingsProgress(savings);

      // Check milestone percentages (25, 50, 75, 100)
      const milestones = [25, 50, 75, 100];
      for (const milestone of milestones) {
        // Check if we just crossed this milestone (±2% tolerance)
        if (percentage >= milestone && percentage < milestone + 2) {
          if (milestone === 100) {
            alerts.push(NotificationMessages.savingsComplete(savings));
          } else {
            alerts.push(
              NotificationMessages.savingsMilestone(savings, milestone)
            );
          }
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
          console.error("❌ Error parsing deadline:", dateError);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error checking savings progress:", error);
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
    console.error("❌ Error checking transaction reminders:", error);
  }

  return alerts;
};

export const checkNotesReminders = (appState: AppState): any[] => {
  const alerts = [];
  const today = getCurrentDate();
  const currentHour = new Date().getHours();

  try {
    // Check for notes created today
    const todayNotes = appState.notes.filter((note) => note.date === today);

    // Encourage note-taking in the evening if no notes today
    if (todayNotes.length === 0 && currentHour >= 19) {
      alerts.push(NotificationMessages.notesReminder());
    }

    // Check for notes related to important transactions
    const importantNotes = todayNotes.filter(
      (note) =>
        note.type === "financial_decision" ||
        note.financialImpact === "negative" ||
        (note.amount && note.amount >= 500000)
    );

    if (importantNotes.length > 0 && currentHour >= 20) {
      alerts.push({
        title: "📋 Catatan Penting Hari Ini",
        body: `Anda membuat ${importantNotes.length} catatan finansial penting hari ini`,
        data: { type: "IMPORTANT_NOTES" },
      });
    }
  } catch (error) {
    console.error("❌ Error checking notes reminders:", error);
  }

  return alerts;
};

export const generateDailySummary = (appState: AppState): string => {
  const today = getCurrentDate();

  try {
    const todayTransactions = appState.transactions.filter(
      (t) => t.date === today
    );
    const todayExpenses = todayTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0);

    const todayIncome = todayTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0);

    const biggestExpense = todayTransactions
      .filter((t) => t.type === "expense")
      .reduce((max, t) => (t.amount > max.amount ? t : max), {
        amount: 0,
        category: "Tidak ada",
      });

    const notesCount = appState.notes.filter((n) => n.date === today).length;

    let summary = `📊 Ringkasan Harian:\n`;
    summary += `✅ Pemasukan: ${formatCurrency(todayIncome)}\n`;
    summary += `✅ Pengeluaran: ${formatCurrency(todayExpenses)}\n`;

    if (biggestExpense.amount > 0) {
      summary += `📈 Pengeluaran terbesar: ${
        biggestExpense.category
      } (${formatCurrency(biggestExpense.amount)})\n`;
    }

    if (notesCount > 0) {
      summary += `📝 Catatan: ${notesCount} catatan hari ini`;
    } else {
      summary += `📝 Belum ada catatan hari ini`;
    }

    return summary;
  } catch (error) {
    console.error("❌ Error generating daily summary:", error);
    return "📊 Ringkasan harian tidak tersedia saat ini.";
  }
};

// Helper untuk weekly summary (untuk hari Minggu)
export const generateWeeklySummary = (appState: AppState): string => {
  try {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)

    const weekStartStr = weekStart.toISOString().split("T")[0];

    const weekTransactions = appState.transactions.filter(
      (t) => t.date >= weekStartStr
    );
    const weekIncome = weekTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0);

    const weekExpense = weekTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0);

    return (
      `📈 Ringkasan Mingguan:\n` +
      `💰 Pemasukan: ${formatCurrency(weekIncome)}\n` +
      `💸 Pengeluaran: ${formatCurrency(weekExpense)}\n` +
      `📈 Balance: ${formatCurrency(weekIncome - weekExpense)}`
    );
  } catch (error) {
    console.error("❌ Error generating weekly summary:", error);
    return "📈 Ringkasan mingguan tidak tersedia.";
  }
};
