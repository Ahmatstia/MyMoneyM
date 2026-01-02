// File: src/utils/calendarCalculations.ts
import { Transaction } from "../types";

// Get transactions by date range
export const getTransactionsByDateRange = (
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): Transaction[] => {
  return transactions.filter((t) => {
    const transactionDate = new Date(t.date);
    return transactionDate >= startDate && transactionDate <= endDate;
  });
};

// Get transactions for specific month
export const getMonthlyTransactions = (
  transactions: Transaction[],
  year: number,
  month: number // 0-11
): Transaction[] => {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  return getTransactionsByDateRange(transactions, startDate, endDate);
};

// Get transactions for specific week
export const getWeeklyTransactions = (
  transactions: Transaction[],
  startOfWeek: Date
): Transaction[] => {
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  return getTransactionsByDateRange(transactions, startOfWeek, endOfWeek);
};

// Calculate daily totals
export const calculateDailyTotals = (transactions: Transaction[]) => {
  const dailyTotals: Record<
    string,
    { income: number; expense: number; net: number; count: number }
  > = {};

  transactions.forEach((transaction) => {
    const date = transaction.date;

    if (!dailyTotals[date]) {
      dailyTotals[date] = {
        income: 0,
        expense: 0,
        net: 0,
        count: 0,
      };
    }

    if (transaction.type === "income") {
      dailyTotals[date].income += transaction.amount;
      dailyTotals[date].net += transaction.amount;
    } else {
      dailyTotals[date].expense += transaction.amount;
      dailyTotals[date].net -= transaction.amount;
    }

    dailyTotals[date].count += 1;
  });

  return dailyTotals;
};

// Get busiest transaction days (most transactions)
export const getBusiestDays = (
  transactions: Transaction[],
  limit: number = 5
): Array<{ date: string; count: number; total: number }> => {
  const dailyTotals = calculateDailyTotals(transactions);

  return Object.entries(dailyTotals)
    .map(([date, data]) => ({
      date,
      count: data.count,
      total: Math.abs(data.net),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

// Get highest spending days
export const getHighestSpendingDays = (
  transactions: Transaction[],
  limit: number = 5
): Array<{ date: string; expense: number; income: number }> => {
  const dailyTotals = calculateDailyTotals(transactions);

  return Object.entries(dailyTotals)
    .map(([date, data]) => ({
      date,
      expense: data.expense,
      income: data.income,
    }))
    .sort((a, b) => b.expense - a.expense)
    .slice(0, limit);
};

// Calculate month-over-month comparison
export const getMonthComparison = (
  transactions: Transaction[],
  currentMonth: number,
  currentYear: number
) => {
  // Current month transactions
  const currentMonthData = getMonthlyTransactions(
    transactions,
    currentYear,
    currentMonth
  );

  // Previous month transactions
  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;

  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear = currentYear - 1;
  }

  const prevMonthData = getMonthlyTransactions(
    transactions,
    prevYear,
    prevMonth
  );

  // Calculate totals
  const currentIncome = currentMonthData
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const currentExpense = currentMonthData
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const prevIncome = prevMonthData
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const prevExpense = prevMonthData
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate changes
  const incomeChange =
    prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0;

  const expenseChange =
    prevExpense > 0 ? ((currentExpense - prevExpense) / prevExpense) * 100 : 0;

  return {
    current: {
      income: currentIncome,
      expense: currentExpense,
      net: currentIncome - currentExpense,
      count: currentMonthData.length,
    },
    previous: {
      income: prevIncome,
      expense: prevExpense,
      net: prevIncome - prevExpense,
      count: prevMonthData.length,
    },
    changes: {
      income: incomeChange,
      expense: expenseChange,
    },
  };
};

// Generate financial insights based on calendar patterns
export const generateCalendarInsights = (transactions: Transaction[]) => {
  const insights: Array<{
    type: string;
    title: string;
    message: string;
    icon: string;
    color?: string;
  }> = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Get data for current and previous month
  const currentMonthData = getMonthlyTransactions(
    transactions,
    currentYear,
    currentMonth
  );

  const dailyTotals = calculateDailyTotals(currentMonthData);

  // Insight 1: Most active day of week
  const dayOfWeekCount: Record<number, number> = {};
  currentMonthData.forEach((t) => {
    const day = new Date(t.date).getDay();
    dayOfWeekCount[day] = (dayOfWeekCount[day] || 0) + 1;
  });

  const mostActiveDay = Object.entries(dayOfWeekCount).sort(
    (a, b) => b[1] - a[1]
  )[0];

  if (mostActiveDay) {
    const dayNames = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    insights.push({
      type: "info",
      title: `Hari Teraktif: ${dayNames[parseInt(mostActiveDay[0])]}`,
      message: `${mostActiveDay[1]} transaksi di hari ini`,
      icon: "calendar",
      color: "#3B82F6",
    });
  }

  // Insight 2: Day with highest expense
  const spendingDays = Object.entries(dailyTotals)
    .filter(([_, data]) => data.expense > 0)
    .sort((a, b) => b[1].expense - a[1].expense);

  if (spendingDays.length > 0) {
    const [date, data] = spendingDays[0];
    const formattedDate = new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });

    insights.push({
      type: data.expense > 1000000 ? "warning" : "info",
      title: `Pengeluaran Tertinggi: ${formattedDate}`,
      message: `Rp ${data.expense.toLocaleString("id-ID")}`,
      icon: "trending-up",
      color: data.expense > 1000000 ? "#EF4444" : "#F59E0B",
    });
  }

  // Insight 3: Days without transactions
  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0);
  const totalDays = monthEnd.getDate();
  const daysWithTransactions = Object.keys(dailyTotals).length;
  const daysWithout = totalDays - daysWithTransactions;

  if (daysWithout > 10) {
    insights.push({
      type: "warning",
      title: `${daysWithout} Hari Tanpa Transaksi`,
      message: "Coba catat transaksi lebih konsisten",
      icon: "alert-circle",
      color: "#EF4444",
    });
  }

  return insights.slice(0, 3);
};
