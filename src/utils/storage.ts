// File: src/utils/storage.ts - PERBAIKAN TYPE SCRIPT
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AppState,
  Transaction,
  Budget,
  Savings,
  SavingsTransaction,
} from "../types";
import { calculateTotals } from "./calculations";

// ======================================================
// SIMPLE STORAGE KEYS - SINGLE USER
// ======================================================
const STORAGE_KEYS = {
  APP_DATA: "@mymoney_app_data_v4", // Version 4: simple single user
  MIGRATION_FLAG: "@mymoney_migrated_v4",
};

// ======================================================
// SIMPLE VALIDATION FUNCTIONS - NO userId
// ======================================================
const validateTransaction = (obj: any): Transaction | null => {
  if (!obj || typeof obj !== "object") return null;

  try {
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
      amount: Math.max(0, obj.amount),
      type: obj.type,
      category: obj.category,
      description: obj.description || "",
      date: obj.date || new Date().toISOString().split("T")[0],
      createdAt: obj.createdAt || new Date().toISOString(),
      // NO userId field
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

    let startDate = obj.startDate;
    let endDate = obj.endDate;

    if (!isValidDateString(startDate)) {
      const createdAt = obj.createdAt || new Date().toISOString();
      startDate = createdAt.split("T")[0];
    }

    if (!isValidDateString(endDate)) {
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
      startDate,
      endDate,
      lastResetDate: obj.lastResetDate,
      createdAt: obj.createdAt || new Date().toISOString(),
      // NO userId field
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
      description: obj.description || "",
      category: obj.category || "other",
      priority: obj.priority || "medium",
      icon: obj.icon || "wallet",
      createdAt: obj.createdAt || new Date().toISOString(),
      // NO userId field
    };
  } catch (error) {
    console.warn("Savings validation error:", error);
    return null;
  }
};

const validateSavingsTransaction = (obj: any): SavingsTransaction | null => {
  if (!obj || typeof obj !== "object") return null;
  try {
    if (
      typeof obj.id !== "string" ||
      typeof obj.savingsId !== "string" ||
      typeof obj.amount !== "number" ||
      !["deposit", "withdrawal", "initial", "adjustment"].includes(
        obj.type || "deposit"
      )
    ) {
      return null;
    }
    return {
      id: obj.id,
      savingsId: obj.savingsId,
      type: obj.type || "deposit",
      amount: Math.max(0, obj.amount || 0),
      date: obj.date || new Date().toISOString().split("T")[0],
      note: obj.note || "",
      previousBalance: Math.max(0, obj.previousBalance || 0),
      newBalance: Math.max(0, obj.newBalance || 0),
      createdAt: obj.createdAt || new Date().toISOString(),
      // NO userId field
    };
  } catch (error) {
    console.warn("Savings transaction validation error:", error);
    return null;
  }
};

// ======================================================
// HELPER FUNCTIONS
// ======================================================
const isValidDateString = (dateStr: string): boolean => {
  try {
    if (!dateStr || typeof dateStr !== "string") return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) && dateStr.length === 10;
  } catch {
    return false;
  }
};

// ======================================================
// MIGRATION FUNCTION - FROM OLD VERSIONS
// ======================================================
const migrateOldData = async (): Promise<AppState | null> => {
  try {
    console.log("🔄 Migrasi data dari versi lama...");

    // Cek semua versi key lama
    const OLD_KEYS = [
      "@mymoney_app_data_v3",
      "@mymoney_app_data_v2",
      "@mymoney_app_data",
      "@mymoney_data",
      "mymoney_data",
      "@mymoney_user_", // Multi-user keys (skip yang ini)
    ];

    let migratedData: AppState | null = null;

    for (const key of OLD_KEYS) {
      try {
        // Skip multi-user keys
        if (key.includes("_user_")) continue;

        const jsonValue = await AsyncStorage.getItem(key);
        if (jsonValue) {
          console.log(`✅ Data lama ditemukan di: ${key}`);
          const oldData = JSON.parse(jsonValue);

          // Extract hanya data financial, buang user data
          const transactions: Transaction[] = Array.isArray(
            oldData.transactions
          )
            ? oldData.transactions
                .map((t: any) => validateTransaction(t))
                .filter((t: Transaction | null): t is Transaction => t !== null)
            : [];

          const budgets: Budget[] = Array.isArray(oldData.budgets)
            ? oldData.budgets
                .map((b: any) => validateBudget(b))
                .filter((b: Budget | null): b is Budget => b !== null)
            : [];

          const savings: Savings[] = Array.isArray(oldData.savings)
            ? oldData.savings
                .map((s: any) => validateSavings(s))
                .filter((s: Savings | null): s is Savings => s !== null)
            : [];

          const savingsTransactions: SavingsTransaction[] = Array.isArray(
            oldData.savingsTransactions
          )
            ? oldData.savingsTransactions
                .map((st: any) => validateSavingsTransaction(st))
                .filter(
                  (st: SavingsTransaction | null): st is SavingsTransaction =>
                    st !== null
                )
            : [];

          const totals = calculateTotals(transactions);

          migratedData = {
            transactions,
            budgets,
            savings,
            savingsTransactions,
            ...totals,
          };

          // Simpan sebagai data baru
          await AsyncStorage.setItem(
            STORAGE_KEYS.APP_DATA,
            JSON.stringify(migratedData)
          );

          // Hapus data lama
          await AsyncStorage.removeItem(key);

          console.log(`✅ Migrasi dari ${key} selesai`);
          break;
        }
      } catch (e) {
        console.warn(`⚠️ Gagal migrasi dari ${key}:`, e);
      }
    }

    if (!migratedData) {
      console.log("📭 Tidak ada data lama untuk dimigrasi");
    }

    return migratedData;
  } catch (error) {
    console.error("❌ Error migrasi data:", error);
    return null;
  }
};

// ======================================================
// MAIN STORAGE SERVICE - SIMPLE SINGLE USER
// ======================================================
export const storageService = {
  async saveData(data: AppState): Promise<void> {
    try {
      console.log("💾 Menyimpan data...");

      // Validasi dan cleanup data
      const validatedTransactions: Transaction[] = data.transactions
        ? data.transactions
            .map((t) => validateTransaction(t))
            .filter((t: Transaction | null): t is Transaction => t !== null)
        : [];

      const validatedBudgets: Budget[] = data.budgets
        ? data.budgets
            .map((b) => validateBudget(b))
            .filter((b: Budget | null): b is Budget => b !== null)
        : [];

      const validatedSavings: Savings[] = data.savings
        ? data.savings
            .map((s) => validateSavings(s))
            .filter((s: Savings | null): s is Savings => s !== null)
        : [];

      const validatedSavingsTransactions: SavingsTransaction[] =
        data.savingsTransactions
          ? data.savingsTransactions
              .map((st) => validateSavingsTransaction(st))
              .filter(
                (st: SavingsTransaction | null): st is SavingsTransaction =>
                  st !== null
              )
          : [];

      const totals = calculateTotals(validatedTransactions);

      const appData: AppState = {
        transactions: validatedTransactions,
        budgets: validatedBudgets,
        savings: validatedSavings,
        savingsTransactions: validatedSavingsTransactions,
        ...totals,
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.APP_DATA,
        JSON.stringify(appData)
      );
      console.log(
        `✅ Data tersimpan: ${validatedTransactions.length} transaksi`
      );
    } catch (error) {
      console.error("❌ Error menyimpan data:", error);
      throw error;
    }
  },

  async loadData(): Promise<AppState> {
    try {
      console.log("📥 Memuat data...");

      // Cek migration flag
      const isMigrated = await AsyncStorage.getItem(
        STORAGE_KEYS.MIGRATION_FLAG
      );

      if (isMigrated !== "true") {
        console.log("🔄 Cek data lama...");
        const migratedData = await migrateOldData();
        if (migratedData) {
          await AsyncStorage.setItem(STORAGE_KEYS.MIGRATION_FLAG, "true");
          console.log(
            `✅ Data dimigrasi: ${migratedData.transactions.length} transaksi`
          );
          return migratedData;
        }
        // Set flag meski tidak ada data lama
        await AsyncStorage.setItem(STORAGE_KEYS.MIGRATION_FLAG, "true");
      }

      // Load data baru
      const appDataJson = await AsyncStorage.getItem(STORAGE_KEYS.APP_DATA);

      if (!appDataJson) {
        console.log("📭 Tidak ada data, return default");
        return {
          transactions: [],
          budgets: [],
          savings: [],
          savingsTransactions: [],
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
        };
      }

      const parsedData = JSON.parse(appDataJson);

      // Validasi data yang diload
      const transactions: Transaction[] = Array.isArray(parsedData.transactions)
        ? parsedData.transactions
            .map((t: any) => validateTransaction(t))
            .filter((t: Transaction | null): t is Transaction => t !== null)
        : [];

      const budgets: Budget[] = Array.isArray(parsedData.budgets)
        ? parsedData.budgets
            .map((b: any) => validateBudget(b))
            .filter((b: Budget | null): b is Budget => b !== null)
        : [];

      const savings: Savings[] = Array.isArray(parsedData.savings)
        ? parsedData.savings
            .map((s: any) => validateSavings(s))
            .filter((s: Savings | null): s is Savings => s !== null)
        : [];

      const savingsTransactions: SavingsTransaction[] = Array.isArray(
        parsedData.savingsTransactions
      )
        ? parsedData.savingsTransactions
            .map((st: any) => validateSavingsTransaction(st))
            .filter(
              (st: SavingsTransaction | null): st is SavingsTransaction =>
                st !== null
            )
        : [];

      const totals = calculateTotals(transactions);

      const appData: AppState = {
        transactions,
        budgets,
        savings,
        savingsTransactions,
        ...totals,
      };

      console.log(`✅ Data dimuat: ${transactions.length} transaksi`);
      return appData;
    } catch (error) {
      console.error("❌ Error memuat data:", error);
      return {
        transactions: [],
        budgets: [],
        savings: [],
        savingsTransactions: [],
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
      };
    }
  },

  async clearData(): Promise<void> {
    try {
      console.log("🗑️  Menghapus semua data...");
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.APP_DATA),
        AsyncStorage.removeItem(STORAGE_KEYS.MIGRATION_FLAG),
      ]);

      // Hapus juga semua key lama untuk kebersihan
      const allKeys = await AsyncStorage.getAllKeys();
      const myMoneyKeys = allKeys.filter(
        (key) => key.startsWith("@mymoney") || key.startsWith("mymoney")
      );

      await Promise.all(myMoneyKeys.map((key) => AsyncStorage.removeItem(key)));

      console.log("✅ Semua data dihapus");
    } catch (error) {
      console.error("❌ Error menghapus data:", error);
      throw error;
    }
  },

  async debugStorage(): Promise<void> {
    try {
      console.log("\n🔍 [DEBUG STORAGE] =======================");

      const allKeys = await AsyncStorage.getAllKeys();
      console.log("All AsyncStorage keys:", allKeys);

      const appDataJson = await AsyncStorage.getItem(STORAGE_KEYS.APP_DATA);
      console.log("App data exists:", !!appDataJson);

      if (appDataJson) {
        const appData = JSON.parse(appDataJson);
        console.log("Transactions:", appData.transactions?.length || 0);
        console.log("Budgets:", appData.budgets?.length || 0);
        console.log("Savings:", appData.savings?.length || 0);

        if (appData.transactions?.length > 0) {
          console.log("Sample transaction:", {
            id: appData.transactions[0].id,
            type: appData.transactions[0].type,
            amount: appData.transactions[0].amount,
            category: appData.transactions[0].category,
          });
        }
      }

      console.log("========================================\n");
    } catch (error) {
      console.error("❌ Debug error:", error);
    }
  },
};
