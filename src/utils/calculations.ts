// File: src/utils/calculations.ts
import { Transaction, Budget, Savings } from "../types";

// Safe number helper with better error handling
export const safeNumber = (num: any): number => {
  if (num === undefined || num === null) return 0;

  try {
    // Handle string numbers with commas or dots
    if (typeof num === "string") {
      // Remove any non-numeric characters except decimal point and minus sign
      const cleaned = num.replace(/[^\d.-]/g, "");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) || !isFinite(parsed) ? 0 : Math.max(0, parsed);
    }

    const parsed = Number(num);
    return isNaN(parsed) || !isFinite(parsed) ? 0 : Math.max(0, parsed);
  } catch (error) {
    console.warn("Error in safeNumber:", error, "value:", num);
    return 0;
  }
};

export const calculateTotals = (transactions: Transaction[] = []) => {
  try {
    const totalIncome = transactions
      .filter((t) => t?.type === "income")
      .reduce((sum, t) => sum + safeNumber(t?.amount), 0);

    const totalExpense = transactions
      .filter((t) => t?.type === "expense")
      .reduce((sum, t) => sum + safeNumber(t?.amount), 0);

    const balance = safeNumber(totalIncome - totalExpense);

    return { totalIncome, totalExpense, balance };
  } catch (error) {
    console.error("Error in calculateTotals:", error);
    return { totalIncome: 0, totalExpense: 0, balance: 0 };
  }
};

export const calculateBudgetProgress = (budget: Budget) => {
  try {
    const safeSpent = safeNumber(budget?.spent);
    const safeLimit = safeNumber(budget?.limit);

    if (safeLimit <= 0) return 0;

    const percentage = (safeSpent / safeLimit) * 100;
    return Math.min(Math.max(0, percentage), 100);
  } catch (error) {
    console.error("Error in calculateBudgetProgress:", error);
    return 0;
  }
};

export const calculateSavingsProgress = (savings: Savings) => {
  try {
    const safeCurrent = safeNumber(savings?.current);
    const safeTarget = safeNumber(savings?.target);

    if (safeTarget <= 0) return 0;

    const percentage = (safeCurrent / safeTarget) * 100;
    return Math.min(Math.max(0, percentage), 100);
  } catch (error) {
    console.error("Error in calculateSavingsProgress:", error);
    return 0;
  }
};

export const formatCurrency = (amount: number): string => {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safeNumber(amount));
  } catch (error) {
    console.error("Error in formatCurrency:", error);
    return "Rp 0";
  }
};

export const getCurrentMonth = (): string => {
  try {
    const now = new Date();
    return now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  } catch (error) {
    return new Date().toISOString().slice(0, 7);
  }
};

export const getCurrentDate = (): string => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (error) {
    return new Date().toISOString().split("T")[0];
  }
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
    console.error("Error in formatResetDate:", error);
    return dateString || "Tanggal tidak valid";
  }
};

// Helper untuk percentage yang aman dengan error handling
export const getSafePercentage = (part: number, total: number): number => {
  try {
    const safePart = safeNumber(part);
    const safeTotal = safeNumber(total);

    if (safeTotal <= 0) return 0;

    const percentage = (safePart / safeTotal) * 100;
    const result = isNaN(percentage) ? 0 : percentage;
    return Math.max(0, Math.min(result, 100));
  } catch (error) {
    console.error("Error in getSafePercentage:", error);
    return 0;
  }
};

// Format number for display with thousands separator
export const formatNumber = (num: number): string => {
  try {
    return safeNumber(num).toLocaleString("id-ID");
  } catch (error) {
    console.error("Error in formatNumber:", error);
    return "0";
  }
};
