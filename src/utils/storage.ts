// File: src/utils/storage.ts - PERBAIKAN TYPE SCRIPT
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AppState,
  Transaction,
  Budget,
  Savings,
  SavingsTransaction,
  Note,
  Debt,
} from "../types";
import { calculateTotals } from "./calculations";

// ======================================================
// SIMPLE STORAGE KEYS - SINGLE USER
// ======================================================
const STORAGE_KEYS = {
  APP_DATA: "@mymoney_app_data_v5", // Version 5: tambah notes
  MIGRATION_FLAG: "@mymoney_migrated_v5",
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
      cyclePeriod: typeof obj.cyclePeriod === 'number' ? obj.cyclePeriod : undefined,
    };
  } catch (error) {

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
    };
  } catch (error) {

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
    };
  } catch (error) {

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
    };
  } catch (error) {

    return null;
  }
};

// TAMBAHKAN: Validasi Note
const validateNote = (obj: any): Note | null => {
  if (!obj || typeof obj !== "object") return null;

  try {
    const validTypes = [
      "financial_decision",
      "expense_reflection",
      "goal_progress",
      "investment_idea",
      "budget_analysis",
      "general",
    ];

    if (
      typeof obj.id !== "string" ||
      typeof obj.title !== "string" ||
      !validTypes.includes(obj.type || "general")
    ) {
      return null;
    }

    return {
      id: obj.id,
      title: obj.title || "",
      content: obj.content || "",
      type: obj.type || "general",
      mood: ["positive", "neutral", "negative", "reflective"].includes(obj.mood)
        ? obj.mood
        : undefined,
      financialImpact: ["positive", "neutral", "negative"].includes(
        obj.financialImpact
      )
        ? obj.financialImpact
        : undefined,
      amount:
        typeof obj.amount === "number" ? Math.max(0, obj.amount) : undefined,
      category: obj.category || undefined,
      tags: Array.isArray(obj.tags) ? obj.tags : [],
      relatedTransactionIds: Array.isArray(obj.relatedTransactionIds)
        ? obj.relatedTransactionIds
        : [],
      relatedSavingsIds: Array.isArray(obj.relatedSavingsIds)
        ? obj.relatedSavingsIds
        : [],
      relatedBudgetIds: Array.isArray(obj.relatedBudgetIds)
        ? obj.relatedBudgetIds
        : [],
      date: obj.date || new Date().toISOString().split("T")[0],
      createdAt: obj.createdAt || new Date().toISOString(),
      updatedAt: obj.updatedAt || new Date().toISOString(),
    };
  } catch (error) {

    return null;
  }
};

const validateDebt = (obj: any): Debt | null => {
  if (!obj || typeof obj !== "object") return null;
  try {
    if (
      typeof obj.id !== "string" ||
      typeof obj.name !== "string" ||
      typeof obj.amount !== "number" ||
      !["borrowed", "lent"].includes(obj.type || "borrowed")
    ) {
      return null;
    }
    return {
      id: obj.id,
      name: obj.name,
      amount: Math.max(0, obj.amount || 0),
      remaining: Math.max(0, typeof obj.remaining === "number" ? obj.remaining : (obj.amount || 0)),
      type: obj.type || "borrowed",
      status: ["active", "partial", "paid"].includes(obj.status) ? obj.status : "active",
      category: obj.category || "Lainnya",
      description: obj.description || "",
      dueDate: obj.dueDate,
      createdAt: obj.createdAt || new Date().toISOString(),
      updatedAt: obj.updatedAt,
    };
  } catch (error) {

    return null;
  }
};

// ======================================================
// HELPER FUNCTIONS
// =======================================================================
// BUG-11 FIX: Accept YYYY-MM-DD and YYYY-M-D formats
const isValidDateString = (dateStr: string): boolean => {
  try {
    if (!dateStr || typeof dateStr !== "string") return false;
    if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
};

// ======================================================
// MIGRATION FUNCTION - FROM OLD VERSIONS
// ======================================================
const migrateOldData = async (): Promise<AppState | null> => {
  try {

    // Cek semua versi key lama
    const OLD_KEYS = [
      "@mymoney_app_data_v4",
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

          // Untuk data lama yang belum punya notes, default ke array kosong
          const notes: Note[] = Array.isArray(oldData.notes)
            ? oldData.notes
                .map((n: any) => validateNote(n))
                .filter((n: Note | null): n is Note => n !== null)
            : [];

          const totals = calculateTotals(transactions);

          migratedData = {
            transactions,
            budgets,
            savings,
            savingsTransactions,
            notes,
            debts: [], // TAMBAHKAN
            ...totals,
          };

          // Simpan sebagai data baru
          await AsyncStorage.setItem(
            STORAGE_KEYS.APP_DATA,
            JSON.stringify(migratedData)
          );

          // Hapus data lama
          await AsyncStorage.removeItem(key);


          break;
        }
      } catch (e) {

      }
    }

    if (!migratedData) {

    }

    return migratedData;
  } catch (error) {

    return null;
  }
};

// ======================================================
// MAIN STORAGE SERVICE - SIMPLE SINGLE USER
// ======================================================
export const storageService = {
  async saveData(data: AppState): Promise<void> {
    try {

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

      const validatedNotes: Note[] = data.notes
        ? data.notes
            .map((n) => validateNote(n))
            .filter((n: Note | null): n is Note => n !== null)
        : [];

      // NEW: Validasi hutang
      const validatedDebts: Debt[] = data.debts
        ? data.debts
            .map((d) => validateDebt(d))
            .filter((d: Debt | null): d is Debt => d !== null)
        : [];

      const totals = calculateTotals(validatedTransactions);

      const appData: AppState = {
        transactions: validatedTransactions,
        budgets: validatedBudgets,
        savings: validatedSavings,
        savingsTransactions: validatedSavingsTransactions,
        notes: validatedNotes,
        debts: validatedDebts, // NEW
        ...totals,
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.APP_DATA,
        JSON.stringify(appData)
      );
      
    } catch (error) {

      throw error;
    }
  },

  async loadData(): Promise<AppState> {
    try {

      // Cek migration flag
      const isMigrated = await AsyncStorage.getItem(
        STORAGE_KEYS.MIGRATION_FLAG
      );

      if (isMigrated !== "true") {

        const migratedData = await migrateOldData();
        if (migratedData) {
          await AsyncStorage.setItem(STORAGE_KEYS.MIGRATION_FLAG, "true");
          
          return migratedData;
        }
        // Set flag meski tidak ada data lama
        await AsyncStorage.setItem(STORAGE_KEYS.MIGRATION_FLAG, "true");
      }

      // Load data baru
      const appDataJson = await AsyncStorage.getItem(STORAGE_KEYS.APP_DATA);

      if (!appDataJson) {

        return {
          transactions: [],
          budgets: [],
          savings: [],
          savingsTransactions: [],
          notes: [],
          debts: [], // TAMBAHKAN
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

      const notes: Note[] = Array.isArray(parsedData.notes)
        ? parsedData.notes
            .map((n: any) => validateNote(n))
            .filter((n: Note | null): n is Note => n !== null)
        : [];

      // NEW: Load debts
      const debts: Debt[] = Array.isArray(parsedData.debts)
        ? parsedData.debts
            .map((d: any) => validateDebt(d))
            .filter((d: Debt | null): d is Debt => d !== null)
        : [];

      const totals = calculateTotals(transactions);

      const appData: AppState = {
        transactions,
        budgets,
        savings,
        savingsTransactions,
        notes,
        debts, // NEW
        ...totals,
      };

      
      return appData;
    } catch (error) {

      return {
        transactions: [],
        budgets: [],
        savings: [],
        savingsTransactions: [],
        notes: [],
        debts: [], // TAMBAHKAN
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
      };
    }
  },

  async clearData(): Promise<void> {
    try {

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


    } catch (error) {

      throw error;
    }
  },

  async debugStorage(): Promise<void> {
    try {

      const allKeys = await AsyncStorage.getAllKeys();

      const appDataJson = await AsyncStorage.getItem(STORAGE_KEYS.APP_DATA);

      if (appDataJson) {
        const appData = JSON.parse(appDataJson);




         // NEW

        if (appData.transactions?.length > 0) {
          
        }

        if (appData.notes?.length > 0) {
          
        }
      }


    } catch (error) {

    }
  },
};
