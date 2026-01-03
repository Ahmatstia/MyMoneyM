// File: src/utils/calculations.ts
import { Transaction, Budget, Savings } from "../types";

// Safe number helper
export const safeNumber = (num: any): number => {
  if (num === undefined || num === null) return 0;
  const parsed = Number(num);
  return isNaN(parsed) || !isFinite(parsed) ? 0 : Math.max(0, parsed);
};

export const calculateTotals = (transactions: Transaction[]) => {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + safeNumber(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + safeNumber(t.amount), 0);

  const balance = safeNumber(totalIncome - totalExpense);

  return { totalIncome, totalExpense, balance };
};

export const calculateBudgetProgress = (budget: Budget) => {
  const safeSpent = safeNumber(budget.spent);
  const safeLimit = safeNumber(budget.limit);

  if (safeLimit <= 0) return 0;

  const percentage = (safeSpent / safeLimit) * 100;
  return Math.min(Math.max(0, percentage), 100);
};

export const calculateSavingsProgress = (savings: Savings) => {
  const safeCurrent = safeNumber(savings.current);
  const safeTarget = safeNumber(savings.target);

  if (safeTarget <= 0) return 0;

  const percentage = (safeCurrent / safeTarget) * 100;
  return Math.min(Math.max(0, percentage), 100);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(safeNumber(amount));
};

export const getCurrentMonth = (): string => {
  const now = new Date();
  return now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
};

export const getCurrentDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatResetDate = (dateString?: string): string => {
  if (!dateString) return "Belum pernah reset";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hari ini";
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 7) return `${diffDays} hari lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  } catch (error) {
    return dateString;
  }
};

// Helper untuk percentage yang aman
export const getSafePercentage = (part: number, total: number): number => {
  const safePart = safeNumber(part);
  const safeTotal = safeNumber(total);

  if (safeTotal <= 0) return 0;

  const percentage = (safePart / safeTotal) * 100;
  const result = isNaN(percentage) ? 0 : percentage;
  return Math.max(0, Math.min(result, 100));
};
