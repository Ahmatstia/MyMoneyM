// File: src/utils/csvExport.ts
// CSV Export for Machine Learning — comprehensive data from MyMoney

import { AppState } from "../types";
import { formatCurrency, safeNumber } from "./calculations";

// ─── Helper: Escape CSV field ──────────────────────────────────────────────────
const csvEscape = (value: any): string => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// ─── Helper: Join row ─────────────────────────────────────────────────────────
const csvRow = (values: any[]): string => values.map(csvEscape).join(",");

// ─── Helper: Days in month ────────────────────────────────────────────────────
const daysInMonth = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

// ─── 1. TRANSACTIONS CSV ──────────────────────────────────────────────────────
export const generateTransactionsCsv = (state: AppState): string => {
  const headers = [
    "date",
    "day_of_week",
    "day_of_month",
    "month",
    "year",
    "is_weekend",
    "is_month_start",
    "is_month_end",
    "days_to_month_end",
    "type",
    "category",
    "description",
    "amount",
    "is_large_transaction",
    "transaction_count_today",
    "created_hour",
  ];

  const rows: string[] = [csvRow(headers)];

  // Count transactions per day for density feature
  const txPerDay: Record<string, number> = {};
  state.transactions.forEach((t) => {
    const d = t.date;
    txPerDay[d] = (txPerDay[d] || 0) + 1;
  });

  // Sort by date oldest first (best for time series)
  const sorted = [...state.transactions].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  sorted.forEach((tx) => {
    const d = new Date(tx.date);
    const dow = d.getDay(); // 0=Sunday, 6=Saturday
    const dom = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const totalDays = daysInMonth(d);

    rows.push(
      csvRow([
        tx.date,
        dow,
        dom,
        month,
        year,
        dow === 0 || dow === 6 ? 1 : 0,
        dom <= 3 ? 1 : 0,
        dom >= totalDays - 2 ? 1 : 0,
        totalDays - dom,
        tx.type,
        csvEscape(tx.category),
        csvEscape(tx.description),
        tx.amount,
        tx.amount >= 500000 ? 1 : 0,
        txPerDay[tx.date] || 1,
        new Date(tx.createdAt).getHours(),
      ]),
    );
  });

  return rows.join("\n");
};

// ─── 2. BUDGETS CSV ───────────────────────────────────────────────────────────
export const generateBudgetsCsv = (state: AppState): string => {
  const headers = [
    "category",
    "period",
    "limit",
    "spent",
    "utilization_rate",
    "is_over_budget",
    "remaining_budget",
    "start_date",
    "end_date",
  ];

  const rows: string[] = [csvRow(headers)];

  state.budgets.forEach((b) => {
    const limit = safeNumber(b.limit);
    const spent = safeNumber(b.spent);
    const rate = limit > 0 ? (spent / limit) * 100 : 0;

    rows.push(
      csvRow([
        csvEscape(b.category),
        b.period,
        limit,
        spent,
        rate.toFixed(1),
        spent > limit ? 1 : 0,
        Math.max(0, limit - spent),
        b.startDate,
        b.endDate,
      ]),
    );
  });

  return rows.join("\n");
};

// ─── 3. SAVINGS CSV ───────────────────────────────────────────────────────────
export const generateSavingsCsv = (state: AppState): string => {
  const headers = [
    "name",
    "target",
    "current",
    "progress_pct",
    "remaining",
    "deadline",
    "days_to_deadline",
    "category",
    "priority",
    "monthly_contribution_needed",
  ];

  const rows: string[] = [csvRow(headers)];

  state.savings.forEach((s) => {
    const target = safeNumber(s.target);
    const current = safeNumber(s.current);
    const progress = target > 0 ? (current / target) * 100 : 0;
    const remaining = target - current;

    let daysToDeadline = -1;
    let monthlyContribution = 0;
    if (s.deadline) {
      const dl = new Date(s.deadline);
      const today = new Date();
      daysToDeadline = Math.max(
        0,
        Math.ceil((dl.getTime() - today.getTime()) / 86400000),
      );
      const monthsRemaining = Math.max(1, daysToDeadline / 30);
      monthlyContribution =
        remaining > 0 ? Math.round(remaining / monthsRemaining) : 0;
    }

    rows.push(
      csvRow([
        csvEscape(s.name),
        target,
        current,
        progress.toFixed(1),
        remaining,
        s.deadline || "",
        daysToDeadline >= 0 ? daysToDeadline : "",
        csvEscape(s.category),
        s.priority,
        monthlyContribution,
      ]),
    );
  });

  return rows.join("\n");
};

// ─── 4. DEBTS CSV ─────────────────────────────────────────────────────────────
export const generateDebtsCsv = (state: AppState): string => {
  const headers = [
    "name",
    "type",
    "amount",
    "remaining",
    "paid_amount",
    "payoff_pct",
    "category",
    "status",
    "due_date",
    "days_to_due",
  ];

  const rows: string[] = [csvRow(headers)];

  state.debts.forEach((d) => {
    const amount = safeNumber(d.amount);
    const remaining = safeNumber(d.remaining);
    const paid = amount - remaining;
    const payoff = amount > 0 ? (paid / amount) * 100 : 0;

    let daysToDue = -1;
    if (d.dueDate) {
      const due = new Date(d.dueDate);
      const today = new Date();
      daysToDue = Math.ceil((due.getTime() - today.getTime()) / 86400000);
    }

    rows.push(
      csvRow([
        csvEscape(d.name),
        d.type,
        amount,
        remaining,
        paid,
        payoff.toFixed(1),
        csvEscape(d.category),
        d.status,
        d.dueDate || "",
        daysToDue,
      ]),
    );
  });

  return rows.join("\n");
};

// ─── 5. DAILY CHECKINS CSV ────────────────────────────────────────────────────
export const generateCheckInsCsv = (state: AppState): string => {
  const headers = [
    "date",
    "day_of_week",
    "day_of_month",
    "month",
    "year",
    "is_weekend",
  ];

  const rows: string[] = [csvRow(headers)];

  const sorted = [...(state.dailyCheckIns || [])].sort();

  sorted.forEach((dateStr) => {
    const d = new Date(dateStr);
    const dow = d.getDay();
    rows.push(
      csvRow([
        dateStr,
        dow,
        d.getDate(),
        d.getMonth() + 1,
        d.getFullYear(),
        dow === 0 || dow === 6 ? 1 : 0,
      ]),
    );
  });

  return rows.join("\n");
};

// ─── 6. MONTHLY SUMMARY CSV ───────────────────────────────────────────────────
export const generateMonthlySummaryCsv = (state: AppState): string => {
  const headers = [
    "year_month",
    "income",
    "expense",
    "net",
    "savings_rate",
    "transaction_count",
    "active_days",
    "avg_daily_expense",
    "largest_expense",
    "largest_expense_category",
    "top_category",
    "top_category_amount",
  ];

  const rows: string[] = [csvRow(headers)];

  // Aggregate per month
  const monthly: Record<
    string,
    {
      income: number;
      expense: number;
      count: number;
      days: Set<string>;
      expenses: { amount: number; category: string }[];
      categories: Record<string, number>;
    }
  > = {};

  state.transactions.forEach((tx) => {
    const key = tx.date.substring(0, 7); // YYYY-MM
    if (!monthly[key]) {
      monthly[key] = {
        income: 0,
        expense: 0,
        count: 0,
        days: new Set(),
        expenses: [],
        categories: {},
      };
    }
    const m = monthly[key];
    if (tx.type === "income") m.income += tx.amount;
    else {
      m.expense += tx.amount;
      m.expenses.push({ amount: tx.amount, category: tx.category });
      m.categories[tx.category] = (m.categories[tx.category] || 0) + tx.amount;
    }
    m.count++;
    m.days.add(tx.date);
  });

  Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([ym, data]) => {
      const net = data.income - data.expense;
      const savingsRate = data.income > 0 ? (net / data.income) * 100 : 0;
      const activeDays = data.days.size;
      const avgDailyExpense = activeDays > 0 ? data.expense / activeDays : 0;
      const largestExpense =
        data.expenses.length > 0
          ? data.expenses.reduce((max, e) => (e.amount > max.amount ? e : max))
          : { amount: 0, category: "" };
      const topCategory = Object.entries(data.categories).sort(
        (a, b) => b[1] - a[1],
      )[0];

      rows.push(
        csvRow([
          ym,
          data.income,
          data.expense,
          net,
          savingsRate.toFixed(1),
          data.count,
          activeDays,
          Math.round(avgDailyExpense),
          largestExpense.amount,
          csvEscape(largestExpense.category),
          topCategory ? csvEscape(topCategory[0]) : "",
          topCategory ? topCategory[1] : 0,
        ]),
      );
    });

  return rows.join("\n");
};

// ─── 7. ALL-IN-ONE CSV ───────────────────────────────────────────────────────
// Merges every transaction row with current budget, savings, debt, and monthly
// summary context — a single file for maximum feature richness in ML models.
export const generateAllInOneCsv = (state: AppState): string => {
  const headers = [
    // ── Transaction features ──
    "date",
    "day_of_week",
    "day_of_month",
    "month",
    "year",
    "is_weekend",
    "is_month_start",
    "is_month_end",
    "days_to_month_end",
    "type",
    "category",
    "description",
    "amount",
    "is_large_transaction",
    "transaction_count_today",
    "created_hour",

    // ── Budget context ──
    "budget_count",
    "budget_total_limit",
    "budget_total_spent",
    "budget_avg_utilization",
    "budget_over_count",

    // ── Savings context ──
    "savings_count",
    "savings_total_target",
    "savings_total_current",
    "savings_total_remaining",
    "savings_avg_progress",

    // ── Debt context ──
    "debt_count",
    "debt_total_amount",
    "debt_total_remaining",
    "debt_total_paid",
    "debt_avg_payoff",
    "debt_active_count",

    // ── Monthly context (for this transaction's month) ──
    "monthly_income",
    "monthly_expense",
    "monthly_net",
    "monthly_savings_rate",
    "monthly_transaction_count",
    "monthly_active_days",
    "monthly_avg_daily_expense",

    // ── Check-in context ──
    "checkin_count_total",
    "checkin_days_since_last",
  ];

  const rows: string[] = [csvRow(headers)];

  // ── Pre-compute aggregate contexts ──

  // Budget context
  const budgetCount = state.budgets.length;
  const budgetTotalLimit = state.budgets.reduce(
    (s, b) => s + safeNumber(b.limit),
    0,
  );
  const budgetTotalSpent = state.budgets.reduce(
    (s, b) => s + safeNumber(b.spent),
    0,
  );
  const budgetAvgUtil =
    budgetCount > 0
      ? state.budgets.reduce((s, b) => {
          const l = safeNumber(b.limit);
          return s + (l > 0 ? (safeNumber(b.spent) / l) * 100 : 0);
        }, 0) / budgetCount
      : 0;
  const budgetOverCount = state.budgets.filter(
    (b) => safeNumber(b.spent) > safeNumber(b.limit),
  ).length;

  // Savings context
  const savingsCount = state.savings.length;
  const savingsTotalTarget = state.savings.reduce(
    (s, sv) => s + safeNumber(sv.target),
    0,
  );
  const savingsTotalCurrent = state.savings.reduce(
    (s, sv) => s + safeNumber(sv.current),
    0,
  );
  const savingsTotalRemaining = savingsTotalTarget - savingsTotalCurrent;
  const savingsAvgProgress =
    savingsCount > 0
      ? state.savings.reduce((s, sv) => {
          const t = safeNumber(sv.target);
          return s + (t > 0 ? (safeNumber(sv.current) / t) * 100 : 0);
        }, 0) / savingsCount
      : 0;

  // Debt context
  const debtCount = state.debts.length;
  const debtTotalAmount = state.debts.reduce(
    (s, d) => s + safeNumber(d.amount),
    0,
  );
  const debtTotalRemaining = state.debts.reduce(
    (s, d) => s + safeNumber(d.remaining),
    0,
  );
  const debtTotalPaid = debtTotalAmount - debtTotalRemaining;
  const debtAvgPayoff =
    debtCount > 0
      ? state.debts.reduce((s, d) => {
          const a = safeNumber(d.amount);
          return s + (a > 0 ? ((a - safeNumber(d.remaining)) / a) * 100 : 0);
        }, 0) / debtCount
      : 0;
  const debtActiveCount = state.debts.filter((d) => d.status !== "paid").length;

  // Check-in context
  const checkinCount = (state.dailyCheckIns || []).length;
  const sortedCheckins = [...(state.dailyCheckIns || [])].sort().reverse();
  let daysSinceLastCheckin = -1;
  if (sortedCheckins.length > 0) {
    const lastCheckin = new Date(sortedCheckins[0]);
    const today = new Date();
    daysSinceLastCheckin = Math.floor(
      (today.getTime() - lastCheckin.getTime()) / 86400000,
    );
  }

  // Monthly summaries by key
  const monthly: Record<
    string,
    { income: number; expense: number; count: number; days: Set<string> }
  > = {};
  state.transactions.forEach((tx) => {
    const key = tx.date.substring(0, 7);
    if (!monthly[key]) {
      monthly[key] = { income: 0, expense: 0, count: 0, days: new Set() };
    }
    if (tx.type === "income") monthly[key].income += tx.amount;
    else monthly[key].expense += tx.amount;
    monthly[key].count++;
    monthly[key].days.add(tx.date);
  });

  // Transaction count per day
  const txPerDay: Record<string, number> = {};
  state.transactions.forEach((t) => {
    txPerDay[t.date] = (txPerDay[t.date] || 0) + 1;
  });

  // Sort by date oldest first
  const sorted = [...state.transactions].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  sorted.forEach((tx) => {
    const d = new Date(tx.date);
    const dow = d.getDay();
    const dom = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const totalDays = daysInMonth(d);
    const monthKey = tx.date.substring(0, 7);
    const m = monthly[monthKey];

    rows.push(
      csvRow([
        // Transaction
        tx.date,
        dow,
        dom,
        month,
        year,
        dow === 0 || dow === 6 ? 1 : 0,
        dom <= 3 ? 1 : 0,
        dom >= totalDays - 2 ? 1 : 0,
        totalDays - dom,
        tx.type,
        csvEscape(tx.category),
        csvEscape(tx.description),
        tx.amount,
        tx.amount >= 500000 ? 1 : 0,
        txPerDay[tx.date] || 1,
        new Date(tx.createdAt).getHours(),

        // Budget
        budgetCount,
        budgetTotalLimit,
        budgetTotalSpent,
        budgetAvgUtil.toFixed(1),
        budgetOverCount,

        // Savings
        savingsCount,
        savingsTotalTarget,
        savingsTotalCurrent,
        savingsTotalRemaining,
        savingsAvgProgress.toFixed(1),

        // Debt
        debtCount,
        debtTotalAmount,
        debtTotalRemaining,
        debtTotalPaid,
        debtAvgPayoff.toFixed(1),
        debtActiveCount,

        // Monthly
        m ? m.income : 0,
        m ? m.expense : 0,
        m ? m.income - m.expense : 0,
        m && m.income > 0
          ? (((m.income - m.expense) / m.income) * 100).toFixed(1)
          : 0,
        m ? m.count : 0,
        m ? m.days.size : 0,
        m && m.days.size > 0 ? Math.round(m.expense / m.days.size) : 0,

        // Check-in
        checkinCount,
        daysSinceLastCheckin >= 0 ? daysSinceLastCheckin : "",
      ]),
    );
  });

  return rows.join("\n");
};

// ─── Main export: all CSVs ────────────────────────────────────────────────────
export const exportAllCsv = (
  state: AppState,
): { filename: string; content: string }[] => {
  return [
    {
      filename: "mymoney_transactions.csv",
      content: generateTransactionsCsv(state),
    },
    { filename: "mymoney_budgets.csv", content: generateBudgetsCsv(state) },
    { filename: "mymoney_savings.csv", content: generateSavingsCsv(state) },
    { filename: "mymoney_debts.csv", content: generateDebtsCsv(state) },
    { filename: "mymoney_checkins.csv", content: generateCheckInsCsv(state) },
    {
      filename: "mymoney_monthly_summary.csv",
      content: generateMonthlySummaryCsv(state),
    },
    {
      filename: "mymoney_all_in_one.csv",
      content: generateAllInOneCsv(state),
    },
  ];
};
