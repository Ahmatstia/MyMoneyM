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

export const formatToDateKey = (date: Date): string => {
  try {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return date.toISOString().split("T")[0];
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
    return 0;
  }
};

// Format number for display with thousands separator
export const formatNumber = (num: number): string => {
  try {
    return safeNumber(num).toLocaleString("id-ID");
  } catch (error) {
    return "0";
  }
};

// Filter transactions by time period (Weekly, Monthly, Yearly, All)
export type TimeFilter = "weekly" | "monthly" | "yearly" | "all";

export interface MonthlyCycleRange {
  startDate: Date;
  endDate: Date;
  nextPaydayDate: Date;
  daysRemaining: number;
  totalDays: number;
  daysPassed: number;
  label: string;
}

/**
 * Menghitung rentang siklus bulanan berdasarkan tanggal gajian (payday cut-off).
 * Menangani secara akurat kondisi sebelum gajian vs sesudah gajian dan tanggal akhir bulan.
 */
export const getMonthlyCycleRange = (
  paydayCutoff: number = 1,
  referenceDate: Date = new Date(),
): MonthlyCycleRange => {
  const ref = new Date(referenceDate);
  const cutoff = Math.max(1, Math.min(31, Math.floor(paydayCutoff || 1)));

  // Clamping tanggal agar aman di bulan yang tidak memiliki tgl 31 / 30 / 29 (Februari)
  const getClampedDate = (year: number, month: number, targetDay: number): Date => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const day = Math.min(targetDay, daysInMonth);
    return new Date(year, month, day);
  };

  let startDate: Date;
  let endDate: Date;
  let nextPaydayDate: Date;

  if (cutoff === 1) {
    // Kalender standar: tanggal 1 s/d akhir bulan berjalan
    startDate = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
    const lastDayOfMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
    endDate = new Date(ref.getFullYear(), ref.getMonth(), lastDayOfMonth, 23, 59, 59, 999);
    nextPaydayDate = new Date(ref.getFullYear(), ref.getMonth() + 1, 1, 0, 0, 0, 0);
  } else {
    const currentDay = ref.getDate();

    if (currentDay < cutoff) {
      // Kondisi 1: Hari ini sebelum tanggal gajian (masih dalam siklus bulan sebelumnya)
      // Contoh: Hari ini 21 Sept, cutoff 25 -> Siklus: 25 Ags s/d 24 Sept. Next payday: 25 Sept.
      const startYear = ref.getMonth() === 0 ? ref.getFullYear() - 1 : ref.getFullYear();
      const startMonth = ref.getMonth() === 0 ? 11 : ref.getMonth() - 1;
      startDate = getClampedDate(startYear, startMonth, cutoff);
      startDate.setHours(0, 0, 0, 0);

      const endDay = Math.max(1, cutoff - 1);
      endDate = getClampedDate(ref.getFullYear(), ref.getMonth(), endDay);
      endDate.setHours(23, 59, 59, 999);

      nextPaydayDate = getClampedDate(ref.getFullYear(), ref.getMonth(), cutoff);
      nextPaydayDate.setHours(0, 0, 0, 0);
    } else {
      // Kondisi 2: Hari ini >= tanggal gajian (sudah gajian, masuk siklus bulan ini)
      // Contoh: Hari ini 26 Sept, cutoff 25 -> Siklus: 25 Sept s/d 24 Okt. Next payday: 25 Okt.
      startDate = getClampedDate(ref.getFullYear(), ref.getMonth(), cutoff);
      startDate.setHours(0, 0, 0, 0);

      const nextMonth = ref.getMonth() + 1;
      const endYear = ref.getFullYear() + Math.floor(nextMonth / 12);
      const normNextMonth = nextMonth % 12;

      const endDay = Math.max(1, cutoff - 1);
      endDate = getClampedDate(endYear, normNextMonth, endDay);
      endDate.setHours(23, 59, 59, 999);

      nextPaydayDate = getClampedDate(endYear, normNextMonth, cutoff);
      nextPaydayDate.setHours(0, 0, 0, 0);
    }
  }

  const totalDays = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );

  const msToNext = nextPaydayDate.getTime() - ref.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msToNext / (1000 * 60 * 60 * 24)));
  const daysPassed = Math.max(1, totalDays - daysRemaining);

  const startStr = startDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  const endStr = endDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  const label = cutoff === 1 ? "Bulan Ini" : `${startStr} - ${endStr}`;

  return {
    startDate,
    endDate,
    nextPaydayDate,
    daysRemaining,
    totalDays,
    daysPassed,
    label,
  };
};

export const getActiveCycleInfo = (
  transactions: Transaction[] = [],
  paydayCutoff: number = 1,
) => {
  const now = new Date();
  let latestCycleStart: Date | null = null;
  let latestTime = 0;
  let activePeriod = 7;
  let cycleIncomeId: string | undefined = undefined;

  for (let i = 0; i < transactions.length; i++) {
    if (transactions[i].type === "income" && transactions[i].cyclePeriod) {
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
    startDate.setDate(
      originalStartDate.getDate() + cyclesPassed * activePeriod,
    );

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + activePeriod - 1);
    endDate.setHours(23, 59, 59, 999);

    let label =
      activePeriod === 7
        ? "Periode 7 Hari"
        : activePeriod === 30
          ? "Periode 30 Hari"
          : `Periode ${activePeriod} Hari`;

    return {
      hasCycle: true,
      period: activePeriod,
      startDate,
      endDate,
      label,
      cycleIncomeId,
      isPaydayCycle: false,
    };
  }

  // Jika tidak ada transaksi pemasukan berlabel siklus khusus, namun paydayCutoff > 1:
  if (paydayCutoff && paydayCutoff > 1) {
    const cycleRange = getMonthlyCycleRange(paydayCutoff, now);
    return {
      hasCycle: true,
      period: cycleRange.totalDays,
      startDate: cycleRange.startDate,
      endDate: cycleRange.endDate,
      label: `Siklus Gajian (${cycleRange.label})`,
      cycleIncomeId: undefined,
      isPaydayCycle: true,
    };
  }

  return null;
};

export const filterTransactionsByTime = (
  transactions: Transaction[],
  timeFilter: TimeFilter,
  paydayCutoff: number = 1,
): Transaction[] => {
  if (timeFilter === "all" || !transactions?.length) return transactions;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Pre-calculate weekly & monthly bounds / cycle info
  let startOfWeek: Date | undefined;
  let endOfWeek: Date | undefined;
  let cycleIncomeId: string | undefined;

  let startOfMonth: Date | undefined, endOfMonth: Date | undefined;
  let monthlyCycleIncomeId: string | undefined;

  const cycle = getActiveCycleInfo(transactions, paydayCutoff);

  if (timeFilter === "weekly") {
    if (cycle && cycle.period <= 14) {
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
  } else if (timeFilter === "monthly") {
    if (cycle && cycle.period > 14) {
      startOfMonth = cycle.startDate;
      endOfMonth = cycle.endDate;
      monthlyCycleIncomeId = cycle.cycleIncomeId;
    } else if (paydayCutoff > 1) {
      const cycleRange = getMonthlyCycleRange(paydayCutoff, now);
      startOfMonth = cycleRange.startDate;
      endOfMonth = cycleRange.endDate;
    } else {
      const standardMonthRange = getMonthlyCycleRange(1, now);
      startOfMonth = standardMonthRange.startDate;
      endOfMonth = standardMonthRange.endDate;
    }
  }

  const cycleIncome = cycleIncomeId
    ? transactions.find((t) => t.id === cycleIncomeId)
    : null;
  const monthlyCycleIncome = monthlyCycleIncomeId
    ? transactions.find((t) => t.id === monthlyCycleIncomeId)
    : null;

  const currentYearStr = String(currentYear);
  const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

  const startOfWeekStr = startOfWeek ? formatToDateKey(startOfWeek) : "";
  const endOfWeekStr = endOfWeek ? formatToDateKey(endOfWeek) : "";
  const startOfMonthStr = startOfMonth ? formatToDateKey(startOfMonth) : "";
  const endOfMonthStr = endOfMonth ? formatToDateKey(endOfMonth) : "";

  return transactions.filter((t) => {
    try {
      const txDateStr = (t?.date || "").slice(0, 10);
      if (!txDateStr || txDateStr.length < 10) return false;

      if (timeFilter === "yearly") {
        return txDateStr.startsWith(currentYearStr);
      }

      if (timeFilter === "monthly") {
        if (startOfMonthStr && endOfMonthStr) {
          if (txDateStr < startOfMonthStr || txDateStr > endOfMonthStr) return false;

          if (
            monthlyCycleIncome &&
            txDateStr === startOfMonthStr &&
            t.id !== monthlyCycleIncomeId
          ) {
            if (t.createdAt && monthlyCycleIncome.createdAt && t.createdAt < monthlyCycleIncome.createdAt) {
              return false;
            }
          }
          return true;
        }
        return txDateStr.startsWith(currentMonthStr);
      }

      if (timeFilter === "weekly") {
        if (txDateStr < startOfWeekStr || txDateStr > endOfWeekStr) return false;

        if (
          cycleIncome &&
          txDateStr === startOfWeekStr &&
          t.id !== cycleIncomeId
        ) {
          if (t.createdAt && cycleIncome.createdAt && t.createdAt < cycleIncome.createdAt) {
            return false;
          }
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
  currentDate: Date = new Date(),
) => {
  try {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const now = new Date(currentDate);

    // Total hari dalam periode ini
    const totalDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    );

    // Hari yang sudah berjalan (minimal 1 agar tidak pembagian nol)
    // Use floor + 1 untuk calendar days: hari pertama = 1, bukan 0
    const daysPassed = Math.max(
      1,
      Math.min(
        totalDays,
        Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
          1,
      ),
    );

    // Sisa hari
    const daysRemaining = Math.max(0, totalDays - daysPassed);

    // Progress waktu (persentase hari yang sudah lewat)
    const progress = (daysPassed / totalDays) * 100;

    // Rata-rata pengeluaran harian
    const dailyAvgExpense = safePositiveNumber(totalExpense) / daysPassed;

    // Estimasi total pengeluaran sampai akhir periode
    const projectedExpense =
      safePositiveNumber(totalExpense) + dailyAvgExpense * daysRemaining;

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
  cycleIncomeId?: string,
) => {
  try {
    const startStr = formatToDateKey(startDate);

    const cycleIncome = cycleIncomeId
      ? transactions.find((t) => t.id === cycleIncomeId)
      : null;

    return transactions.reduce((sum, t) => {
      const txDateStr = (t?.date || "").slice(0, 10);
      if (!txDateStr || txDateStr.length < 10) return sum;

      // 1. Jika tanggal transaksi mutlak sebelum startDate
      if (txDateStr < startStr) {
        return (
          sum +
          (t.type === "income" ? safeNumber(t.amount) : -safeNumber(t.amount))
        );
      }

      // 2. Jika tanggal SAMA, tapi dicatat SEBELUM income pembuka siklus
      if (
        cycleIncome &&
        txDateStr === startStr &&
        t.id !== cycleIncomeId
      ) {
        if (t.createdAt && cycleIncome.createdAt && t.createdAt < cycleIncome.createdAt) {
          return (
            sum +
            (t.type === "income" ? safeNumber(t.amount) : -safeNumber(t.amount))
          );
        }
      }

      return sum;
    }, 0);
  } catch (error) {
    return 0;
  }
};
