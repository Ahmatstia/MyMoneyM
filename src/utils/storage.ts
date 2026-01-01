import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Transaction, Budget, Savings } from "../types";
import { calculateTotals } from "./calculations";

const STORAGE_KEY = "@mymoney_app_data_v2"; // Tambahkan @ prefix dan versi

const defaultAppState: AppState = {
  transactions: [],
  budgets: [],
  savings: [],
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
};

// Helper function untuk validasi data
const validateTransaction = (obj: any): Transaction | null => {
  if (!obj || typeof obj !== "object") return null;

  // Validasi field yang diperlukan
  if (
    typeof obj.id !== "string" ||
    typeof obj.amount !== "number" ||
    obj.amount <= 0 ||
    !["income", "expense"].includes(obj.type) ||
    typeof obj.category !== "string" ||
    typeof obj.description !== "string" ||
    typeof obj.date !== "string"
  ) {
    return null;
  }

  return {
    id: obj.id,
    amount: obj.amount,
    type: obj.type,
    category: obj.category,
    description: obj.description,
    date: obj.date,
    ...(obj.createdAt && { createdAt: obj.createdAt }),
  };
};

const validateBudget = (obj: any): Budget | null => {
  if (!obj || typeof obj !== "object") return null;

  if (
    typeof obj.id !== "string" ||
    typeof obj.category !== "string" ||
    typeof obj.limit !== "number" ||
    typeof obj.spent !== "number" ||
    !["monthly", "weekly"].includes(obj.period)
  ) {
    return null;
  }

  return obj as Budget;
};

const validateSavings = (obj: any): Savings | null => {
  if (!obj || typeof obj !== "object") return null;

  if (
    typeof obj.id !== "string" ||
    typeof obj.name !== "string" ||
    typeof obj.target !== "number" ||
    typeof obj.current !== "number" ||
    (obj.deadline && typeof obj.deadline !== "string")
  ) {
    return null;
  }

  return obj as Savings;
};

export const storageService = {
  async saveData(data: AppState): Promise<void> {
    try {
      // Pastikan data valid sebelum disimpan
      const validatedData: AppState = {
        transactions: data.transactions.filter(
          (t) => t && typeof t === "object" && t.id
        ),
        budgets: data.budgets.filter((b) => b && typeof b === "object" && b.id),
        savings: data.savings.filter((s) => s && typeof s === "object" && s.id),
        totalIncome: data.totalIncome || 0,
        totalExpense: data.totalExpense || 0,
        balance: data.balance || 0,
      };

      const jsonValue = JSON.stringify(validatedData);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
      console.log(
        "✅ Data saved successfully, transactions:",
        validatedData.transactions.length
      );
    } catch (error) {
      console.error("❌ Error saving data:", error);
      throw error; // Re-throw error untuk ditangkap di AppContext
    }
  },

  async loadData(): Promise<AppState> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);

      if (!jsonValue) {
        console.log("📁 No saved data, returning default");
        return defaultAppState;
      }

      let parsedData;
      try {
        parsedData = JSON.parse(jsonValue);
      } catch (parseError) {
        console.error("❌ Error parsing JSON data:", parseError);
        return defaultAppState;
      }

      // Validasi dan bersihkan data
      const validatedTransactions: Transaction[] = [];
      if (Array.isArray(parsedData.transactions)) {
        parsedData.transactions.forEach((t: any) => {
          const validTransaction = validateTransaction(t);
          if (validTransaction) {
            validatedTransactions.push(validTransaction);
          } else {
            console.warn("⚠️ Invalid transaction found and skipped:", t);
          }
        });
      }

      const validatedBudgets: Budget[] = [];
      if (Array.isArray(parsedData.budgets)) {
        parsedData.budgets.forEach((b: any) => {
          const validBudget = validateBudget(b);
          if (validBudget) {
            validatedBudgets.push(validBudget);
          }
        });
      }

      const validatedSavings: Savings[] = [];
      if (Array.isArray(parsedData.savings)) {
        parsedData.savings.forEach((s: any) => {
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

      console.log("📂 Data loaded successfully:");
      console.log("- Transactions:", finalData.transactions.length);
      console.log("- Budgets:", finalData.budgets.length);
      console.log("- Savings:", finalData.savings.length);
      console.log("- Total Income:", finalData.totalIncome);
      console.log("- Total Expense:", finalData.totalExpense);
      console.log("- Balance:", finalData.balance);

      return finalData;
    } catch (error) {
      console.error("❌ Error loading data:", error);
      return defaultAppState;
    }
  },

  async clearData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log("🗑️ All data cleared successfully");
    } catch (error) {
      console.error("❌ Error clearing data:", error);
      throw error;
    }
  },

  // Tambahan: Debug function untuk melihat data yang tersimpan
  async debugStorage(): Promise<void> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      console.log("🔍 Storage debug:");
      console.log("- Key:", STORAGE_KEY);
      console.log("- Has data:", !!jsonValue);
      if (jsonValue) {
        const data = JSON.parse(jsonValue);
        console.log("- Transactions count:", data.transactions?.length || 0);
        console.log("- Transactions:", data.transactions || []);
      }
    } catch (error) {
      console.error("❌ Debug error:", error);
    }
  },

  // Tambahan: Migrasi data dari versi lama jika perlu
  async migrateFromOldStorage(): Promise<void> {
    const oldKeys = ["mymoney_data", "@mymoney_data"];

    for (const oldKey of oldKeys) {
      try {
        const oldData = await AsyncStorage.getItem(oldKey);
        if (oldData) {
          console.log(`🔄 Migrating data from ${oldKey}...`);
          await AsyncStorage.setItem(STORAGE_KEY, oldData);
          await AsyncStorage.removeItem(oldKey);
          console.log(`✅ Migration from ${oldKey} completed`);
        }
      } catch (error) {
        console.error(`❌ Migration error from ${oldKey}:`, error);
      }
    }
  },
};
