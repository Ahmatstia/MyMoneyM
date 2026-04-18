// File: src/utils/calculations.ts
import { Transaction, Budget, Savings } from "../types";

// Safe number helper - ALLOWS NEGATIVE (needed for balance/deficit)
export const safeNumber = (num: any): number => {
  if (num === undefined || num === null) return 0;

  try {
    // Handle string numbers with commas or dots
    if (typeof num === "string") {
      // Remove any non-numeric characters except decimal point and minus sign
      const cleaned = num.replace(/[^\d.-]/g, "");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
    }

    const parsed = Number(num);
    return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
  } catch (error) {
    console.warn("Error in safeNumber:", error, "value:", num);
    return 0;
  }
};

// Safe positive number helper - for amounts, limits, spent (must be >= 0)
export const safePositiveNumber = (num: any): number => {
  return Math.max(0, safeNumber(num));
};

export const calculateTotals = (transactions: Transaction[] = []) => {
  try {
    const totalIncome = transactions
      .filter((t) => t?.type === "income")
      .reduce((sum, t) => sum + safeNumber(t?.amount), 0);

    const totalExpense = transactions
      .filter((t) => t?.type === "expense")
      .reduce((sum, t) => sum + safeNumber(t?.amount), 0);

    // BUG-02 FIX: Balance MUST be allowed to be negative (deficit)
    const balance = totalIncome - totalExpense;

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
    // BUG-12 FIX: Math.floor so "today" shows correctly (Math.ceil made it always >= 1)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

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

// Filter transactions by time period (Weekly, Monthly, Yearly, All)
export type TimeFilter = "weekly" | "monthly" | "yearly" | "all";

export const getActiveCycleInfo = (transactions: Transaction[]) => {
  const now = new Date();
  let latestCycleStart: Date | null = null;
  let latestTime = 0;
  let activePeriod = 7;
  let cycleIncomeId: string | undefined = undefined;

  for (let i = 0; i < transactions.length; i++) {
    if (transactions[i].cyclePeriod) {
      const tDate = new Date(transactions[i].date);
      const time = tDate.getTime();
      if (time <= now.getTime() && time > latestTime) {
        latestTime = time;
        latestCycleStart = tDate;
        activePeriod = transactions[i].cyclePeriod!;
        cycleIncomeId = transactions[i].id;
      }
    }
  }

  if (latestCycleStart) {
    const originalStartDate = new Date(latestCycleStart);
    originalStartDate.setHours(0, 0, 0, 0);

    const nowTime = now.getTime();
    const startTime = originalStartDate.getTime();
    
    // Hitung berapa kali siklus telah lewat
    let cyclesPassed = 0;
    if (nowTime >= startTime) {
      const diffTime = Math.abs(nowTime - startTime);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      cyclesPassed = Math.floor(diffDays / activePeriod);
    }

    const startDate = new Date(originalStartDate);
    startDate.setDate(originalStartDate.getDate() + (cyclesPassed * activePeriod));

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + activePeriod - 1);
    endDate.setHours(23, 59, 59, 999);

    let label = activePeriod === 7 ? "Periode 7 Hari" : activePeriod === 30 ? "Periode 30 Hari" : `Periode ${activePeriod} Hari`;

    return { hasCycle: true, period: activePeriod, startDate, endDate, label, cycleIncomeId };
  }
  return null;
};

export const filterTransactionsByTime = (
  transactions: Transaction[],
  timeFilter: TimeFilter
): Transaction[] => {
  if (timeFilter === "all" || !transactions?.length) return transactions;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Pre-calculate weekly bounds / cycle info
  let startOfWeek: Date, endOfWeek: Date;
  let cycleIncomeId: string | undefined;

  if (timeFilter === "weekly") {
    const cycle = getActiveCycleInfo(transactions);
    
    if (cycle) {
      startOfWeek = cycle.startDate;
      endOfWeek = cycle.endDate;
      cycleIncomeId = cycle.cycleIncomeId;
    } else {
      const currentDay = now.getDay() === 0 ? 7 : now.getDay();
      startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - currentDay + 1);
      startOfWeek.setHours(0, 0, 0, 0);

      endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
    }
  }

  const cycleIncome = cycleIncomeId 
    ? transactions.find(t => t.id === cycleIncomeId) 
    : null;

  return transactions.filter((t) => {
    try {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return false;

      if (timeFilter === "yearly") {
        return d.getFullYear() === currentYear;
      }

      if (timeFilter === "monthly") {
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }

      if (timeFilter === "weekly") {
        // Cek apakah tanggal di luar range siklus
        if (d < startOfWeek || d > endOfWeek) return false;

        // Smart Day Sorting: Jika hari sama dengan awal siklus
        if (cycleIncome && d.setHours(0,0,0,0) === startOfWeek.getTime() && t.id !== cycleIncomeId) {
          // Jika transaksi ini dicatat SEBELUM income pembuka siklus, jangan masukkan ke filter ini
          // (Karena akan dianggap sebagai bagian dari Saldo Awal/Bawaan)
          if (t.createdAt < cycleIncome.createdAt) return false;
        }
        
        return true;
      }
      return true; // Fallback
    } catch {
      return false;
    }
  });
};

/**
 * Kalkulasi Proyeksi Keuangan Dinamis
 * Menebak saldo akhir periode berdasarkan rata-rata pengeluaran harian saat ini.
 */
export const calculateProjection = (
  totalIncome: number,
  totalExpense: number,
  startDate: Date,
  endDate: Date,
  currentDate: Date = new Date()
) => {
  try {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const now = new Date(currentDate);

    // Total hari dalam periode ini
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    // Hari yang sudah berjalan (minimal 1 agar tidak pembagian nol)
    const daysPassed = Math.max(1, Math.min(totalDays, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))));

    // Sisa hari
    const daysRemaining = Math.max(0, totalDays - daysPassed);

    // Progress waktu (persentase hari yang sudah lewat)
    const progress = (daysPassed / totalDays) * 100;

    // Rata-rata pengeluaran harian
    const dailyAvgExpense = safePositiveNumber(totalExpense) / daysPassed;

    // Estimasi total pengeluaran sampai akhir periode
    const projectedExpense = safePositiveNumber(totalExpense) + (dailyAvgExpense * daysRemaining);

    // Estimasi saldo akhir
    const projectedBalance = safeNumber(totalIncome) - projectedExpense;

    return {
      daysPassed,
      daysRemaining,
      totalDays,
      progress: isNaN(progress) ? 0 : progress,
      dailyAvgExpense: safeNumber(dailyAvgExpense),
      projectedBalance: isNaN(projectedBalance) ? 0 : projectedBalance,
      status:
        projectedBalance >= 0
          ? ("surplus" as const)
          : projectedBalance > -1000000
          ? ("warning" as const)
          : ("deficit" as const),
    };
  } catch (error) {
    console.error("Error in calculateProjection:", error);
    return {
      daysPassed: 1,
      daysRemaining: 0,
      totalDays: 1,
      progress: 0,
      dailyAvgExpense: 0,
      projectedBalance: 0,
      status: "surplus" as const,
    };
  }
};

/**
 * Kalkulasi Saldo Awal (Bawaan) sebelum periode dimulai.
 * Digunakan untuk sinkronisasi Saldo Total vs Sisa Periode.
 */
export const calculateOpeningBalance = (
  transactions: Transaction[],
  startDate: Date,
  cycleIncomeId?: string
) => {
  try {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const cycleIncome = cycleIncomeId 
      ? transactions.find(t => t.id === cycleIncomeId) 
      : null;

    return transactions.reduce((sum, t) => {
      const tDate = new Date(t.date);
      tDate.setHours(0, 0, 0, 0);

      // 1. Jika tanggal transaksi mutlak sebelum startDate
      if (tDate < start) {
        return sum + (t.type === "income" ? safeNumber(t.amount) : -safeNumber(t.amount));
      }

      // 2. Jika tanggal SAMA, tapi dicatat SEBELUM income pembuka siklus
      if (cycleIncome && tDate.getTime() === start.getTime() && t.id !== cycleIncomeId) {
        if (t.createdAt < cycleIncome.createdAt) {
          return sum + (t.type === "income" ? safeNumber(t.amount) : -safeNumber(t.amount));
        }
      }

      return sum;
    }, 0);
  } catch (error) {
    console.error("Error in calculateOpeningBalance:", error);
    return 0;
  }
};
