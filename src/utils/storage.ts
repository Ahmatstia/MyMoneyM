// File: src/utils/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Transaction, Budget, Savings } from "../types";
import { calculateTotals } from "./calculations";

const STORAGE_KEY = "@mymoney_app_data_v3";

const defaultAppState: AppState = {
  transactions: [],
  budgets: [],
  savings: [],
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
};

// Helper function untuk validasi tanggal
const isValidDateString = (dateStr: string): boolean => {
  try {
    if (!dateStr || typeof dateStr !== "string") return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) && dateStr.length === 10; // YYYY-MM-DD
  } catch {
    return false;
  }
};

// Helper function untuk validasi data - DIPERBAIKI
const validateTransaction = (obj: any): Transaction | null => {
  if (!obj || typeof obj !== "object") return null;

  try {
    // Validasi field yang diperlukan dengan toleransi
    if (
      typeof obj.id !== "string" ||
      typeof obj.amount !== "number" ||
      !["income", "expense"].includes(obj.type) ||
      typeof obj.category !== "string"
    ) {
      return null;
    }

    return {
      id: obj.id,
      amount: Math.max(0, obj.amount), // Pastikan positif
      type: obj.type,
      category: obj.category,
      description: obj.description || "",
      date: obj.date || new Date().toISOString().split("T")[0],
      createdAt: obj.createdAt || new Date().toISOString(),
    };
  } catch (error) {
    console.warn("Transaction validation error:", error);
    return null;
  }
};

const validateBudget = (obj: any): Budget | null => {
  if (!obj || typeof obj !== "object") return null;

  try {
    if (
      typeof obj.id !== "string" ||
      typeof obj.category !== "string" ||
      typeof obj.limit !== "number" ||
      !["monthly", "weekly", "yearly", "custom"].includes(
        obj.period || "monthly"
      )
    ) {
      return null;
    }

    // 🟢 PERBAIKAN CRITICAL: Pertahankan tanggal yang sudah ada jika valid
    let startDate = obj.startDate;
    let endDate = obj.endDate;

    // Validasi dan pastikan tanggal valid
    const today = new Date().toISOString().split("T")[0];

    if (!isValidDateString(startDate)) {
      // Jika startDate tidak valid, gunakan createdAt atau hari ini
      const createdAt = obj.createdAt || new Date().toISOString();
      startDate = createdAt.split("T")[0];
    }

    if (!isValidDateString(endDate)) {
      // Jika endDate tidak valid, hitung berdasarkan period
      const start = new Date(startDate);
      let end = new Date(start);

      const period = obj.period || "monthly";
      switch (period) {
        case "weekly":
          end.setDate(end.getDate() + 6);
          break;
        case "monthly":
          end.setDate(end.getDate() + 29);
          break;
        case "yearly":
          end.setFullYear(end.getFullYear() + 1);
          end.setDate(end.getDate() - 1);
          break;
        case "custom":
          // Untuk custom tanpa endDate, default 30 hari
          end.setDate(end.getDate() + 29);
          break;
        default:
          end.setDate(end.getDate() + 29);
      }
      endDate = end.toISOString().split("T")[0];
    }

    return {
      id: obj.id,
      category: obj.category,
      limit: Math.max(0, obj.limit || 0),
      spent: Math.max(0, obj.spent || 0),
      period: obj.period || "monthly",
      startDate, // 🟢 TANGGAL DI PERTAHANKAN
      endDate, // 🟢 TANGGAL DI PERTAHANKAN
      lastResetDate: obj.lastResetDate,
      createdAt: obj.createdAt || new Date().toISOString(),
    };
  } catch (error) {
    console.warn("Budget validation error:", error);
    return null;
  }
};

const validateSavings = (obj: any): Savings | null => {
  if (!obj || typeof obj !== "object") return null;

  try {
    if (
      typeof obj.id !== "string" ||
      typeof obj.name !== "string" ||
      typeof obj.target !== "number"
    ) {
      return null;
    }

    return {
      id: obj.id,
      name: obj.name,
      target: Math.max(0, obj.target || 0),
      current: Math.max(0, obj.current || 0),
      deadline: obj.deadline,
      createdAt: obj.createdAt || new Date().toISOString(),
    };
  } catch (error) {
    console.warn("Savings validation error:", error);
    return null;
  }
};

export const storageService = {
  async saveData(data: AppState): Promise<void> {
    try {
      console.log("💾 Menyimpan data...");

      // Pastikan data valid sebelum disimpan
      const validatedData: AppState = {
        transactions: data.transactions
          .filter((t) => t && typeof t === "object" && t.id)
          .map((t) => validateTransaction(t))
          .filter(Boolean) as Transaction[],
        budgets: data.budgets
          .filter((b) => b && typeof b === "object" && b.id)
          .map((b) => validateBudget(b))
          .filter(Boolean) as Budget[],
        savings: data.savings
          .filter((s) => s && typeof s === "object" && s.id)
          .map((s) => validateSavings(s))
          .filter(Boolean) as Savings[],
        totalIncome: Math.max(0, data.totalIncome || 0),
        totalExpense: Math.max(0, data.totalExpense || 0),
        balance: data.balance || 0,
      };

      const jsonValue = JSON.stringify(validatedData);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
      console.log(
        "✅ Data disimpan:",
        validatedData.transactions.length,
        "transaksi",
        validatedData.budgets.length,
        "budgets"
      );
    } catch (error) {
      console.error("❌ Error menyimpan data:", error);
      throw error;
    }
  },

  async loadData(): Promise<AppState> {
    try {
      console.log("📥 Memuat data dari storage...");

      // Cari data dari semua kemungkinan key
      const possibleKeys = [
        STORAGE_KEY,
        "@mymoney_app_data_v2",
        "@mymoney_app_data",
        "@mymoney_data",
        "mymoney_data",
      ];

      let loadedData: any = null;
      let loadedKey = "";

      // Coba setiap key sampai ketemu data
      for (const key of possibleKeys) {
        try {
          const jsonValue = await AsyncStorage.getItem(key);
          if (jsonValue) {
            console.log(`✅ Data ditemukan di: ${key}`);
            loadedData = JSON.parse(jsonValue);
            loadedKey = key;
            break;
          }
        } catch (e) {
          console.warn(`⚠️ Gagal baca ${key}:`, e);
        }
      }

      if (!loadedData) {
        console.log("📭 Tidak ada data, menggunakan default");
        return defaultAppState;
      }

      // Validasi dan bersihkan data
      const validatedTransactions: Transaction[] = [];
      if (Array.isArray(loadedData.transactions)) {
        loadedData.transactions.forEach((t: any) => {
          const validTransaction = validateTransaction(t);
          if (validTransaction) {
            validatedTransactions.push(validTransaction);
          }
        });
      }

      const validatedBudgets: Budget[] = [];
      if (Array.isArray(loadedData.budgets)) {
        loadedData.budgets.forEach((b: any) => {
          const validBudget = validateBudget(b);
          if (validBudget) {
            validatedBudgets.push(validBudget);
          }
        });
      }

      const validatedSavings: Savings[] = [];
      if (Array.isArray(loadedData.savings)) {
        loadedData.savings.forEach((s: any) => {
          const validSavings = validateSavings(s);
          if (validSavings) {
            validatedSavings.push(validSavings);
          }
        });
      }

      // Hitung ulang totals untuk memastikan konsistensi
      const totals = calculateTotals(validatedTransactions);

      const finalData: AppState = {
        transactions: validatedTransactions,
        budgets: validatedBudgets,
        savings: validatedSavings,
        ...totals,
      };

      console.log("📊 Data berhasil dimuat:");
      console.log("   - Transaksi:", finalData.transactions.length);
      console.log("   - Budgets:", finalData.budgets.length);
      console.log("   - Savings:", finalData.savings.length);
      console.log("   - Saldo:", finalData.balance);

      // Debug: Tampilkan info tanggal budgets
      console.log("📅 Info Budgets:");
      finalData.budgets.forEach((b, i) => {
        console.log(
          `   ${i + 1}. ${b.category}: ${b.startDate} - ${b.endDate} (${
            b.period
          })`
        );
      });

      // Simpan ke key yang benar untuk konsistensi
      if (loadedKey !== STORAGE_KEY) {
        console.log(`🔄 Migrasi data dari ${loadedKey} ke ${STORAGE_KEY}`);
        await this.saveData(finalData);
      }

      return finalData;
    } catch (error) {
      console.error("❌ Error memuat data:", error);
      return defaultAppState;
    }
  },

  async clearData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log("🗑️ Semua data dihapus");
    } catch (error) {
      console.error("❌ Error menghapus data:", error);
      throw error;
    }
  },

  async debugStorage(): Promise<void> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      console.log("🔍 Debug Storage:");
      console.log("- Key:", STORAGE_KEY);
      console.log("- Ada data:", !!jsonValue);
      if (jsonValue) {
        const data = JSON.parse(jsonValue);
        console.log("- Transaksi:", data.transactions?.length || 0);
        console.log("- Budgets:", data.budgets?.length || 0);
        console.log("- Saldo:", data.balance);
        console.log("- Budgets sample:", {
          count: data.budgets?.length || 0,
          budgets: data.budgets?.slice(0, 3)?.map((b: any) => ({
            category: b.category,
            startDate: b.startDate,
            endDate: b.endDate,
            period: b.period,
          })),
        });
      }
    } catch (error) {
      console.error("❌ Debug error:", error);
    }
  },

  async migrateFromOldStorage(): Promise<void> {
    const oldKeys = [
      "@mymoney_app_data_v2",
      "@mymoney_app_data",
      "@mymoney_data",
      "mymoney_data",
    ];

    for (const oldKey of oldKeys) {
      try {
        const oldData = await AsyncStorage.getItem(oldKey);
        if (oldData) {
          console.log(`🔄 Migrasi data dari ${oldKey}...`);
          await AsyncStorage.setItem(STORAGE_KEY, oldData);
          await AsyncStorage.removeItem(oldKey);
          console.log(`✅ Migrasi dari ${oldKey} selesai`);
        }
      } catch (error) {
        console.error(`❌ Migrasi error dari ${oldKey}:`, error);
      }
    }
  },
};
