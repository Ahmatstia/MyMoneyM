import { Transaction, Budget, Savings } from "../types";

export const calculateTotals = (transactions: Transaction[]) => {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return { totalIncome, totalExpense, balance };
};

export const calculateBudgetProgress = (budget: Budget) => {
  const percentage = (budget.spent / budget.limit) * 100;
  return Math.min(percentage, 100);
};

export const calculateSavingsProgress = (savings: Savings) => {
  const percentage = (savings.current / savings.target) * 100;
  return Math.min(percentage, 100);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
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

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    return date.toLocaleDateString("id-ID", options);
  } catch (error) {
    return dateString;
  }
};
