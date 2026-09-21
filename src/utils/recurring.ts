// File: src/utils/recurring.ts
import { AppState, RecurringTransaction, Transaction } from "../types";
import {
  calculateTotals,
  calculateWalletBalances,
  calculatePartitionedBalances,
  DEFAULT_WALLET_ID,
  safeNumber,
} from "./calculations";
import { getJakartaDateKey } from "./dailyCheckIn";

/**
 * Format string tanggal YYYY-MM-DD ke Date object lokal
 */
export const parseDateString = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Format Date object ke string YYYY-MM-DD
 */
export const formatDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * Menghitung tanggal eksekusi berikutnya berdasarkan frekuensi
 */
export const calculateNextRunDate = (
  item: RecurringTransaction,
  fromDateStr?: string
): string => {
  const baseDate = parseDateString(fromDateStr || item.nextRunDate || item.startDate);

  if (item.frequency === "weekly") {
    // Tambah 7 hari
    const next = new Date(baseDate);
    next.setDate(baseDate.getDate() + 7);
    return formatDateString(next);
  }

  if (item.frequency === "monthly") {
    // Tambah 1 bulan, pertahankan dayOfMonth jika memungkinkan
    const targetDay = item.dayOfMonth || baseDate.getDate();
    const nextYear = baseDate.getMonth() === 11 ? baseDate.getFullYear() + 1 : baseDate.getFullYear();
    const nextMonth = baseDate.getMonth() === 11 ? 0 : baseDate.getMonth() + 1;

    // Cari hari maksimal di bulan depan (misal Feb 28/29)
    const maxDaysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
    const safeDay = Math.min(targetDay, maxDaysInNextMonth);

    const next = new Date(nextYear, nextMonth, safeDay);
    return formatDateString(next);
  }

  if (item.frequency === "custom_days") {
    const days = Math.max(1, safeNumber(item.intervalDays) || 7);
    const next = new Date(baseDate);
    next.setDate(baseDate.getDate() + days);
    return formatDateString(next);
  }

  // Fallback: +7 hari
  const next = new Date(baseDate);
  next.setDate(baseDate.getDate() + 7);
  return formatDateString(next);
};

/**
 * Inisialisasi tanggal pertama untuk jadwal baru
 */
export const calculateInitialRunDate = (
  frequency: RecurringTransaction["frequency"],
  startDateStr: string,
  dayOfWeek?: number, // 1 (Senin) - 7 (Minggu)
  dayOfMonth?: number // 1 - 31
): string => {
  const start = parseDateString(startDateStr);

  if (frequency === "weekly" && dayOfWeek !== undefined) {
    // dayOfWeek 1 = Senin ... 7 = Minggu
    // JS Date.getDay(): 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
    const jsTargetDay = dayOfWeek === 7 ? 0 : dayOfWeek;
    const currentJsDay = start.getDay();
    let diff = jsTargetDay - currentJsDay;
    if (diff < 0) {
      diff += 7;
    }
    const target = new Date(start);
    target.setDate(start.getDate() + diff);
    return formatDateString(target);
  }

  if (frequency === "monthly" && dayOfMonth !== undefined) {
    const maxDays = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    const safeDay = Math.min(dayOfMonth, maxDays);

    let target = new Date(start.getFullYear(), start.getMonth(), safeDay);
    // Jika tanggal tersebut sudah lewat dari startDate, lompat ke bulan berikutnya
    if (target < start) {
      const nextMonth = start.getMonth() + 1;
      const nextYear = nextMonth > 11 ? start.getFullYear() + 1 : start.getFullYear();
      const actualNextMonth = nextMonth > 11 ? 0 : nextMonth;
      const maxNext = new Date(nextYear, actualNextMonth + 1, 0).getDate();
      target = new Date(nextYear, actualNextMonth, Math.min(dayOfMonth, maxNext));
    }
    return formatDateString(target);
  }

  return startDateStr;
};

/**
 * Label teks frekuensi yang ramah pengguna
 */
export const getFrequencyLabel = (item: RecurringTransaction): string => {
  const DAYS = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  if (item.frequency === "weekly") {
    const dayName = item.dayOfWeek ? DAYS[item.dayOfWeek] : "Minggu";
    return `Setiap ${dayName}`;
  }

  if (item.frequency === "monthly") {
    return `Setiap tanggal ${item.dayOfMonth || 1}`;
  }

  if (item.frequency === "custom_days") {
    return `Setiap ${item.intervalDays || 7} hari`;
  }

  return "Rutin";
};

/**
 * Mesin Pemroses Transaksi Rutin (Catch-up on Launch)
 * Dijalankan otomatis saat aplikasi dibuka / kembali ke foreground
 */
export const processRecurringTransactions = (
  state: AppState
): {
  updatedState: AppState;
  executedCount: number;
  newTransactions: Transaction[];
} => {
  const recurringList = state.recurringTransactions || [];
  if (recurringList.length === 0) {
    return { updatedState: state, executedCount: 0, newTransactions: [] };
  }

  const todayStr = getJakartaDateKey();
  const newTransactions: Transaction[] = [];
  let hasChanges = false;

  const updatedRecurringList = recurringList.map((item) => {
    if (!item.isActive) {
      return item;
    }

    let currentItem = { ...item };
    let safetyCounter = 0; // Cegah infinite loop jika tanggal sangat lama

    // Loop jika sudah melewati jadwal (bisa catch-up multiple missed intervals)
    while (currentItem.nextRunDate <= todayStr && safetyCounter < 12) {
      safetyCounter++;
      hasChanges = true;

      // Buat ID unik untuk transaksi yang digenerate
      const generatedId = `rec_tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Jika pemasukan dan mengaktifkan autoStartNewCycle, pasang cyclePeriod
      const cycleDays =
        currentItem.type === "income" && currentItem.autoStartNewCycle
          ? currentItem.cyclePeriodDays || (currentItem.frequency === "weekly" ? 7 : 30)
          : undefined;

      const newTx: Transaction = {
        id: generatedId,
        amount: safeNumber(currentItem.amount),
        type: currentItem.type,
        category: currentItem.category,
        description:
          currentItem.description?.trim() ||
          (currentItem.name && currentItem.name !== currentItem.category
            ? currentItem.name
            : currentItem.category),
        date: currentItem.nextRunDate,
        createdAt: new Date().toISOString(),
        cyclePeriod: cycleDays,
        walletId: currentItem.walletId || DEFAULT_WALLET_ID,
        toWalletId: currentItem.toWalletId,
        adminFee: currentItem.adminFee,
      };

      newTransactions.push(newTx);

      // Hitung jadwal berikutnya
      const nextDate = calculateNextRunDate(currentItem, currentItem.nextRunDate);
      currentItem = {
        ...currentItem,
        lastRunDate: currentItem.nextRunDate,
        nextRunDate: nextDate,
        updatedAt: new Date().toISOString(),
      };
    }

    return currentItem;
  });

  if (!hasChanges || newTransactions.length === 0) {
    return { updatedState: state, executedCount: 0, newTransactions: [] };
  }

  // Gabungkan transaksi baru (taruh di depan/urut tanggal)
  const combinedTransactions = [...newTransactions, ...state.transactions];
  const totals = calculateTotals(combinedTransactions);
  const updatedWallets = calculateWalletBalances(state.wallets || [], combinedTransactions);
  const partitioned = calculatePartitionedBalances(updatedWallets);

  const updatedState: AppState = {
    ...state,
    transactions: combinedTransactions,
    wallets: updatedWallets,
    recurringTransactions: updatedRecurringList,
    operationalBalance: partitioned.operationalBalance,
    savingsBalance: partitioned.savingsBalance,
    ...totals,
  };

  return {
    updatedState,
    executedCount: newTransactions.length,
    newTransactions,
  };
};
