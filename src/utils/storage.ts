// File: src/utils/storage.ts - PERBAIKAN ERROR
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AppState,
  Transaction,
  Budget,
  Savings,
  SavingsTransaction,
  User,
} from "../types";
import { calculateTotals } from "./calculations";

// ======================================================
// KEY GENERATORS - UNTUK DATA PER USER
// ======================================================
const getUserKey = (userId: string, dataType: string): string => {
  return `@mymoney_user_${userId}_${dataType}`;
};

const USER_KEYS = {
  TRANSACTIONS: (userId: string) => getUserKey(userId, "transactions"),
  BUDGETS: (userId: string) => getUserKey(userId, "budgets"),
  SAVINGS: (userId: string) => getUserKey(userId, "savings"),
  SAVINGS_TRANSACTIONS: (userId: string) =>
    getUserKey(userId, "savings_transactions"),
  USER_DATA: (userId: string) => getUserKey(userId, "user_data"),
};

// Key untuk data global (users list, current user)
const GLOBAL_KEYS = {
  USERS: "@mymoney_users_v2",
  CURRENT_USER: "@mymoney_current_user_v2",
  MIGRATION_FLAG: "@mymoney_migrated_v2", // Flag untuk menandai migrasi sudah dilakukan
};

// Default state untuk user baru
const getDefaultUserState = (
  userId: string
): Omit<AppState, "currentUser" | "users"> => ({
  transactions: [],
  budgets: [],
  savings: [],
  savingsTransactions: [],
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
});

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

// ======================================================
// VALIDATION FUNCTIONS (DIPERBAIKI untuk Type Safety)
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
      userId: obj.userId || undefined,
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

    const today = new Date().toISOString().split("T")[0];

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
        case "custom":
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
      startDate,
      endDate,
      lastResetDate: obj.lastResetDate,
      createdAt: obj.createdAt || new Date().toISOString(),
      userId: obj.userId || undefined,
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
      userId: obj.userId || undefined,
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
      userId: obj.userId || undefined,
    };
  } catch (error) {
    console.warn("Savings transaction validation error:", error);
    return null;
  }
};

// ======================================================
// HELPER FUNCTION UNTUK SIMPAN DATA USER
// ======================================================
const saveUserDataToStorage = async (
  userId: string,
  data: Partial<AppState>
): Promise<void> => {
  try {
    // Validasi data sebelum disimpan
    const validatedTransactions: Transaction[] = data.transactions
      ? data.transactions
          .filter(
            (t): t is Transaction =>
              t !== null && typeof t === "object" && "id" in t
          )
          .map((t) => validateTransaction({ ...t, userId }))
          .filter((t): t is Transaction => t !== null)
      : [];

    const validatedBudgets: Budget[] = data.budgets
      ? data.budgets
          .filter(
            (b): b is Budget => b !== null && typeof b === "object" && "id" in b
          )
          .map((b) => validateBudget({ ...b, userId }))
          .filter((b): b is Budget => b !== null)
      : [];

    const validatedSavings: Savings[] = data.savings
      ? data.savings
          .filter(
            (s): s is Savings =>
              s !== null && typeof s === "object" && "id" in s
          )
          .map((s) => validateSavings({ ...s, userId }))
          .filter((s): s is Savings => s !== null)
      : [];

    const validatedSavingsTransactions: SavingsTransaction[] =
      data.savingsTransactions
        ? data.savingsTransactions
            .filter(
              (st): st is SavingsTransaction =>
                st !== null && typeof st === "object" && "id" in st
            )
            .map((st) => validateSavingsTransaction({ ...st, userId }))
            .filter((st): st is SavingsTransaction => st !== null)
        : [];

    // Simpan setiap tipe data ke key terpisah
    if (validatedTransactions) {
      await AsyncStorage.setItem(
        USER_KEYS.TRANSACTIONS(userId),
        JSON.stringify(validatedTransactions)
      );
    }

    if (validatedBudgets) {
      await AsyncStorage.setItem(
        USER_KEYS.BUDGETS(userId),
        JSON.stringify(validatedBudgets)
      );
    }

    if (validatedSavings) {
      await AsyncStorage.setItem(
        USER_KEYS.SAVINGS(userId),
        JSON.stringify(validatedSavings)
      );
    }

    if (validatedSavingsTransactions) {
      await AsyncStorage.setItem(
        USER_KEYS.SAVINGS_TRANSACTIONS(userId),
        JSON.stringify(validatedSavingsTransactions)
      );
    }

    // Simpan totals ke user_data
    const userData = {
      totalIncome: data.totalIncome || 0,
      totalExpense: data.totalExpense || 0,
      balance: data.balance || 0,
      lastUpdated: new Date().toISOString(),
    };

    await AsyncStorage.setItem(
      USER_KEYS.USER_DATA(userId),
      JSON.stringify(userData)
    );

    console.log(`✅ Data tersimpan untuk user: ${userId}`);
  } catch (error) {
    console.error(`❌ Error menyimpan data untuk user ${userId}:`, error);
    throw error;
  }
};

// ======================================================
// MIGRATION FUNCTION - Untuk migrasi data lama ke per user
// ======================================================
const migrateOldDataToUser = async (
  userId: string
): Promise<AppState | null> => {
  try {
    console.log(`🔄 Migrasi data lama untuk user: ${userId}`);

    // Key data lama
    const OLD_KEYS = [
      "@mymoney_app_data_v3",
      "@mymoney_app_data_v2",
      "@mymoney_app_data",
      "@mymoney_data",
      "mymoney_data",
    ];

    let oldData: any = null;
    let oldKey = "";

    // Cari data lama
    for (const key of OLD_KEYS) {
      try {
        const jsonValue = await AsyncStorage.getItem(key);
        if (jsonValue) {
          console.log(`✅ Data lama ditemukan di: ${key}`);
          oldData = JSON.parse(jsonValue);
          oldKey = key;
          break;
        }
      } catch (e) {
        console.warn(`⚠️ Gagal baca ${key}:`, e);
      }
    }

    if (!oldData) {
      console.log("📭 Tidak ada data lama untuk dimigrasi");
      return null;
    }

    // Validasi data lama
    const validatedTransactions: Transaction[] = [];
    if (Array.isArray(oldData.transactions)) {
      oldData.transactions.forEach((t: any) => {
        const validTransaction = validateTransaction(t);
        if (validTransaction) {
          validatedTransactions.push({ ...validTransaction, userId });
        }
      });
    }

    const validatedBudgets: Budget[] = [];
    if (Array.isArray(oldData.budgets)) {
      oldData.budgets.forEach((b: any) => {
        const validBudget = validateBudget(b);
        if (validBudget) {
          validatedBudgets.push({ ...validBudget, userId });
        }
      });
    }

    const validatedSavings: Savings[] = [];
    if (Array.isArray(oldData.savings)) {
      oldData.savings.forEach((s: any) => {
        const validSavings = validateSavings(s);
        if (validSavings) {
          validatedSavings.push({ ...validSavings, userId });
        }
      });
    }

    const validatedSavingsTransactions: SavingsTransaction[] = [];
    if (Array.isArray(oldData.savingsTransactions)) {
      oldData.savingsTransactions.forEach((st: any) => {
        const validTransaction = validateSavingsTransaction(st);
        if (validTransaction) {
          validatedSavingsTransactions.push({ ...validTransaction, userId });
        }
      });
    }

    // Hitung totals
    const totals = calculateTotals(validatedTransactions);

    const migratedData: AppState = {
      currentUser: null,
      users: [],
      transactions: validatedTransactions,
      budgets: validatedBudgets,
      savings: validatedSavings,
      savingsTransactions: validatedSavingsTransactions,
      ...totals,
    };

    // Simpan data yang sudah dimigrasi ke storage user
    await saveUserDataToStorage(userId, migratedData);

    // Hapus data lama
    await AsyncStorage.removeItem(oldKey);

    // Set flag bahwa migrasi sudah dilakukan
    await AsyncStorage.setItem(GLOBAL_KEYS.MIGRATION_FLAG, "true");

    console.log(`✅ Migrasi selesai untuk user: ${userId}`);
    console.log(`   - ${validatedTransactions.length} transaksi`);
    console.log(`   - ${validatedBudgets.length} budgets`);
    console.log(`   - ${validatedSavings.length} savings`);

    return migratedData;
  } catch (error) {
    console.error("❌ Error migrasi data:", error);
    return null;
  }
};

// ======================================================
// MAIN STORAGE SERVICE - FUNGSI BARU PER USER
// ======================================================
export const storageService = {
  // ✅ BARU: Simpan data untuk user tertentu
  async saveUserData(userId: string, data: Partial<AppState>): Promise<void> {
    await saveUserDataToStorage(userId, data);
  },

  // ✅ BARU: Muat data untuk user tertentu
  async loadUserData(userId: string): Promise<AppState> {
    try {
      console.log(`📥 Memuat data untuk user: ${userId}`);

      // Cek apakah data sudah dimigrasi
      const isMigrated = await AsyncStorage.getItem(GLOBAL_KEYS.MIGRATION_FLAG);

      if (!isMigrated) {
        // Coba migrasi data lama
        const migratedData = await migrateOldDataToUser(userId);
        if (migratedData) {
          return migratedData;
        }
      }

      // Muat data dari storage per user
      const [
        transactionsJson,
        budgetsJson,
        savingsJson,
        savingsTransactionsJson,
        userDataJson,
      ] = await Promise.all([
        AsyncStorage.getItem(USER_KEYS.TRANSACTIONS(userId)),
        AsyncStorage.getItem(USER_KEYS.BUDGETS(userId)),
        AsyncStorage.getItem(USER_KEYS.SAVINGS(userId)),
        AsyncStorage.getItem(USER_KEYS.SAVINGS_TRANSACTIONS(userId)),
        AsyncStorage.getItem(USER_KEYS.USER_DATA(userId)),
      ]);

      // Parse dan validasi data - DIPERBAIKI TYPE CASTING
      const transactions: Transaction[] = transactionsJson
        ? (JSON.parse(transactionsJson) as any[])
            .map((t) => validateTransaction(t))
            .filter((t): t is Transaction => t !== null)
        : [];

      const budgets: Budget[] = budgetsJson
        ? (JSON.parse(budgetsJson) as any[])
            .map((b) => validateBudget(b))
            .filter((b): b is Budget => b !== null)
        : [];

      const savings: Savings[] = savingsJson
        ? (JSON.parse(savingsJson) as any[])
            .map((s) => validateSavings(s))
            .filter((s): s is Savings => s !== null)
        : [];

      const savingsTransactions: SavingsTransaction[] = savingsTransactionsJson
        ? (JSON.parse(savingsTransactionsJson) as any[])
            .map((st) => validateSavingsTransaction(st))
            .filter((st): st is SavingsTransaction => st !== null)
        : [];

      const userData = userDataJson
        ? JSON.parse(userDataJson)
        : { totalIncome: 0, totalExpense: 0, balance: 0 };

      // Hitung ulang totals untuk memastikan konsistensi
      const totals = calculateTotals(transactions);

      const userState: AppState = {
        currentUser: null,
        users: [],
        transactions,
        budgets,
        savings,
        savingsTransactions,
        ...totals,
      };

      console.log(`✅ Data dimuat untuk user: ${userId}`);
      console.log(`   - ${transactions.length} transaksi`);
      console.log(`   - ${budgets.length} budgets`);
      console.log(`   - ${savings.length} savings`);
      console.log(`   - ${savingsTransactions.length} savings transactions`);

      return userState;
    } catch (error) {
      console.error(`❌ Error memuat data untuk user ${userId}:`, error);

      // Return default state jika error
      return {
        currentUser: null,
        users: [],
        ...getDefaultUserState(userId),
      };
    }
  },

  // ✅ BARU: Hapus data untuk user tertentu
  async clearUserData(userId: string): Promise<void> {
    try {
      console.log(`🗑️  Menghapus data untuk user: ${userId}`);

      await Promise.all([
        AsyncStorage.removeItem(USER_KEYS.TRANSACTIONS(userId)),
        AsyncStorage.removeItem(USER_KEYS.BUDGETS(userId)),
        AsyncStorage.removeItem(USER_KEYS.SAVINGS(userId)),
        AsyncStorage.removeItem(USER_KEYS.SAVINGS_TRANSACTIONS(userId)),
        AsyncStorage.removeItem(USER_KEYS.USER_DATA(userId)),
      ]);

      console.log(`✅ Data dihapus untuk user: ${userId}`);
    } catch (error) {
      console.error(`❌ Error menghapus data untuk user ${userId}:`, error);
      throw error;
    }
  },

  // ⚠️ FUNGSI LAMA - Untuk kompatibilitas (akan dihapus nanti)
  async saveData(data: AppState): Promise<void> {
    console.warn(
      "⚠️ Fungsi saveData() sudah deprecated, gunakan saveUserData()"
    );
    if (data.currentUser) {
      await this.saveUserData(data.currentUser.id, data);
    }
  },

  async loadData(): Promise<AppState> {
    console.warn(
      "⚠️ Fungsi loadData() sudah deprecated, gunakan loadUserData()"
    );

    // Coba load current user
    const currentUserJson = await AsyncStorage.getItem(
      GLOBAL_KEYS.CURRENT_USER
    );
    if (currentUserJson) {
      const currentUser = JSON.parse(currentUserJson);
      return this.loadUserData(currentUser.id);
    }

    // Return default jika tidak ada user
    return {
      currentUser: null,
      users: [],
      ...getDefaultUserState("default"),
    };
  },

  async clearData(): Promise<void> {
    console.warn(
      "⚠️ Fungsi clearData() sudah deprecated, gunakan clearUserData()"
    );

    // Hapus semua data dari semua user
    const usersJson = await AsyncStorage.getItem(GLOBAL_KEYS.USERS);
    if (usersJson) {
      const users: User[] = JSON.parse(usersJson);
      for (const user of users) {
        await this.clearUserData(user.id);
      }
    }

    // Hapus data global
    await Promise.all([
      AsyncStorage.removeItem(GLOBAL_KEYS.USERS),
      AsyncStorage.removeItem(GLOBAL_KEYS.CURRENT_USER),
      AsyncStorage.removeItem(GLOBAL_KEYS.MIGRATION_FLAG),
    ]);
  },

  async debugStorage(): Promise<void> {
    try {
      console.log("🔍 Debug Storage:");

      // Debug data global
      const usersJson = await AsyncStorage.getItem(GLOBAL_KEYS.USERS);
      const currentUserJson = await AsyncStorage.getItem(
        GLOBAL_KEYS.CURRENT_USER
      );
      const migrationFlag = await AsyncStorage.getItem(
        GLOBAL_KEYS.MIGRATION_FLAG
      );

      console.log("- Global Users:", usersJson ? JSON.parse(usersJson) : []);
      console.log(
        "- Current User:",
        currentUserJson ? JSON.parse(currentUserJson) : null
      );
      console.log("- Migration Flag:", migrationFlag);

      // Debug data per user
      if (currentUserJson) {
        const currentUser = JSON.parse(currentUserJson);
        console.log(
          `\nData untuk user: ${currentUser.name} (${currentUser.id})`
        );

        const [transactions, budgets, savings, savingsTransactions] =
          await Promise.all([
            AsyncStorage.getItem(USER_KEYS.TRANSACTIONS(currentUser.id)),
            AsyncStorage.getItem(USER_KEYS.BUDGETS(currentUser.id)),
            AsyncStorage.getItem(USER_KEYS.SAVINGS(currentUser.id)),
            AsyncStorage.getItem(
              USER_KEYS.SAVINGS_TRANSACTIONS(currentUser.id)
            ),
          ]);

        console.log(
          `- Transactions: ${
            transactions ? JSON.parse(transactions).length : 0
          }`
        );
        console.log(`- Budgets: ${budgets ? JSON.parse(budgets).length : 0}`);
        console.log(`- Savings: ${savings ? JSON.parse(savings).length : 0}`);
        console.log(
          `- Savings Transactions: ${
            savingsTransactions ? JSON.parse(savingsTransactions).length : 0
          }`
        );
      }
    } catch (error) {
      console.error("❌ Debug error:", error);
    }
  },
};
