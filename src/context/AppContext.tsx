// File: src/context/AppContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import {
  AppState,
  Transaction,
  Budget,
  Savings,
  SavingsTransaction,
} from "../types";
import { storageService } from "../utils/storage";
import { calculateTotals, safeNumber } from "../utils/calculations";
import {
  generateTransactionId,
  generateBudgetId,
  generateSavingsId,
  generateId,
} from "../utils/idGenerator";

/* ======================================================
   CONTEXT TYPE
====================================================== */
interface AppContextType {
  state: AppState;
  isLoading: boolean;

  // 🔹 UX FLAGS
  hasFinancialData: boolean;

  // 🔹 TRANSACTIONS
  addTransaction: (
    transaction: Omit<Transaction, "id" | "createdAt">
  ) => Promise<void>;
  editTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // 🔹 BUDGETS
  addBudget: (
    budget: Omit<Budget, "id" | "spent" | "createdAt" | "lastResetDate">
  ) => Promise<void>;
  editBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  // 🔹 SAVINGS
  addSavings: (savings: Omit<Savings, "id" | "createdAt">) => Promise<void>;
  editSavings: (id: string, updates: Partial<Savings>) => Promise<void>;
  deleteSavings: (id: string) => Promise<void>;
  addSavingsTransaction: (
    savingsId: string,
    transaction: {
      type: "deposit" | "withdrawal";
      amount: number;
      date: string;
      note?: string;
    }
  ) => Promise<void>;
  getSavingsTransactions: (savingsId: string) => SavingsTransaction[];

  // 🔹 SYSTEM
  refreshData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  debugStorage: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/* ======================================================
   DEFAULT STATE
====================================================== */
const defaultAppState: AppState = {
  transactions: [],
  budgets: [],
  savings: [],
  savingsTransactions: [],
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
};

/* ======================================================
   PROVIDER
====================================================== */
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AppState>(defaultAppState);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  /* ======================================================
     HELPER FUNCTIONS
  ====================================================== */

  // 🟢 PERBAIKAN: Fungsi untuk validasi tanggal
  const isValidDateString = (dateStr: string): boolean => {
    try {
      if (!dateStr || typeof dateStr !== "string") return false;
      const date = new Date(dateStr);
      return !isNaN(date.getTime()) && dateStr.length === 10; // YYYY-MM-DD
    } catch {
      return false;
    }
  };

  // 🟢 PERBAIKAN: Fungsi untuk validasi dan setup budget (PERTAHANKAN TANGGAL)
  const validateAndSetupBudget = (budget: any): Budget => {
    try {
      // Pertahankan tanggal yang sudah ada jika valid
      let startDate = budget.startDate;
      let endDate = budget.endDate;
      const createdAt = budget.createdAt || new Date().toISOString();
      const createdDate = createdAt.split("T")[0];

      // 🟢 PERBAIKAN CRITICAL: Validasi tanggal
      if (!isValidDateString(startDate)) {
        startDate = createdDate;
      }

      if (!isValidDateString(endDate)) {
        // Jika endDate tidak valid, hitung berdasarkan period
        const start = new Date(startDate);
        let end = new Date(start);

        const period = budget.period || "monthly";

        switch (period) {
          case "weekly":
            end.setDate(end.getDate() + 6); // 7 hari
            break;
          case "monthly":
            end.setDate(end.getDate() + 29); // 30 hari
            break;
          case "yearly":
            end.setFullYear(end.getFullYear() + 1);
            end.setDate(end.getDate() - 1);
            break;
          case "custom":
            // Untuk custom tanpa tanggal, default 30 hari
            end.setDate(end.getDate() + 29);
            break;
          default:
            end.setDate(end.getDate() + 29); // default 30 hari
        }

        endDate = end.toISOString().split("T")[0];
      }

      return {
        id: budget.id,
        category: budget.category,
        limit: Math.max(0, budget.limit || 0),
        spent: Math.max(0, budget.spent || 0),
        period: budget.period || "monthly",
        startDate, // 🟢 TANGGAL DI PERTAHANKAN
        endDate, // 🟢 TANGGAL DI PERTAHANKAN
        lastResetDate: budget.lastResetDate,
        createdAt: budget.createdAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error validating budget:", error);
      // Return default budget jika error
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      return {
        id: budget.id || `budget-${Date.now()}`,
        category: budget.category || "Lainnya",
        limit: Math.max(0, budget.limit || 0),
        spent: Math.max(0, budget.spent || 0),
        period: budget.period || "monthly",
        startDate: today,
        endDate: today,
        createdAt: new Date().toISOString(),
      };
    }
  };

  const validateSavings = (savings: any): Savings => {
    try {
      return {
        id: savings.id || generateSavingsId(),
        name: savings.name || "Tabungan Baru",
        target: Math.max(0, savings.target || 0),
        current: Math.max(0, savings.current || 0),
        deadline: savings.deadline,
        category: savings.category || "other", // TAMBAHKAN
        priority: savings.priority || "medium", // TAMBAHKAN
        description: savings.description || "", // TAMBAHKAN
        icon: savings.icon || "wallet", // TAMBAHKAN
        createdAt: savings.createdAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error validating savings:", error);
      // 🟢 PERBAIKAN: Return default savings dengan SEMUA properti
      return {
        id: generateSavingsId(),
        name: "Tabungan Baru",
        target: 0,
        current: 0,
        deadline: undefined,
        category: "other", // TAMBAHKAN
        priority: "medium", // TAMBAHKAN
        description: "", // TAMBAHKAN
        icon: "wallet", // TAMBAHKAN
        createdAt: new Date().toISOString(),
      };
    }
  };

  // 🟢 PERBAIKAN: Fungsi untuk validasi savings transactions
  const validateSavingsTransaction = (transaction: any): SavingsTransaction => {
    try {
      return {
        id: transaction.id || generateId(),
        savingsId: transaction.savingsId,
        type: transaction.type || "deposit",
        amount: Math.max(0, transaction.amount || 0),
        date: transaction.date || new Date().toISOString().split("T")[0],
        note: transaction.note || "",
        previousBalance: Math.max(0, transaction.previousBalance || 0),
        newBalance: Math.max(0, transaction.newBalance || 0),
        createdAt: transaction.createdAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error validating savings transaction:", error);
      return {
        id: generateId(),
        savingsId: transaction.savingsId || "",
        type: "deposit",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        previousBalance: 0,
        newBalance: 0,
        createdAt: new Date().toISOString(),
      };
    }
  };

  // 🟢 PERBAIKAN: Update budgets dari transactions (PERTAHANKAN TANGGAL)
  const updateBudgetsFromTransactions = (
    transactions: Transaction[],
    budgets: Budget[]
  ): Budget[] => {
    if (!budgets.length) return budgets;

    return budgets.map((budget) => {
      try {
        const startDate = budget.startDate;
        const endDate = budget.endDate;

        // Filter transaksi dalam periode yang ditentukan
        const spent = transactions
          .filter((t) => {
            if (t.type !== "expense") return false;
            if (t.category !== budget.category) return false;

            const transDate = t.date;
            return transDate >= startDate && transDate <= endDate;
          })
          .reduce((sum, t) => sum + safeNumber(t.amount), 0);

        return {
          ...budget,
          spent: Math.max(0, spent),
        };
      } catch (error) {
        console.error(`Error updating budget ${budget.category}:`, error);
        return budget;
      }
    });
  };

  /* ======================================================
     LOAD INITIAL DATA
  ====================================================== */
  useEffect(() => {
    console.log("🔄 AppProvider: Initial load started");
    loadInitialData();

    return () => {
      isMounted.current = false;
      console.log("🧹 AppProvider unmounted");
    };
  }, []);

  const loadInitialData = async () => {
    if (!isMounted.current) return;

    try {
      console.log("📥 Loading initial data...");

      await storageService.migrateFromOldStorage();
      const data = await storageService.loadData();

      // 🟢 PERBAIKAN: Validasi semua budgets dengan mempertahankan tanggal
      const validatedBudgets = (
        Array.isArray(data.budgets) ? data.budgets : []
      ).map(validateAndSetupBudget);

      // 🟢 PERBAIKAN: Validasi semua savings
      const validatedSavings = (
        Array.isArray(data.savings) ? data.savings : []
      ).map(validateSavings);

      // 🟢 PERBAIKAN: Validasi savings transactions
      const validatedSavingsTransactions = (
        Array.isArray(data.savingsTransactions) ? data.savingsTransactions : []
      ).map(validateSavingsTransaction);

      const validatedState: AppState = {
        transactions: Array.isArray(data.transactions) ? data.transactions : [],
        budgets: validatedBudgets,
        savings: validatedSavings,
        savingsTransactions: validatedSavingsTransactions,
        totalIncome: safeNumber(data.totalIncome),
        totalExpense: safeNumber(data.totalExpense),
        balance: safeNumber(data.balance),
      };

      // Hitung ulang spent untuk semua budgets
      const recalculatedBudgets = updateBudgetsFromTransactions(
        validatedState.transactions,
        validatedState.budgets
      );

      const finalState: AppState = {
        ...validatedState,
        budgets: recalculatedBudgets,
      };

      if (isMounted.current) {
        setState(finalState);
      }

      console.log("✅ Data loaded successfully:", {
        transactions: finalState.transactions.length,
        budgets: finalState.budgets.length,
        savings: finalState.savings.length,
        savingsTransactions: finalState.savingsTransactions.length,
      });
    } catch (error) {
      console.error("❌ Error loading initial data:", error);
      if (isMounted.current) {
        setState(defaultAppState);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        console.log("🏁 AppProvider ready");
      }
    }
  };

  /* ======================================================
     SYSTEM FUNCTIONS
  ====================================================== */
  const refreshData = async () => {
    setIsLoading(true);
    await loadInitialData();
  };

  const clearAllData = async () => {
    await storageService.clearData();
    setState(defaultAppState);
  };

  const debugStorage = async () => {
    await storageService.debugStorage();
  };

  /* ======================================================
     TRANSACTIONS
  ====================================================== */
  const addTransaction = async (
    transaction: Omit<Transaction, "id" | "createdAt">
  ) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: generateTransactionId(),
      createdAt: new Date().toISOString(),
    };

    const updatedTransactions = [newTransaction, ...state.transactions];
    const totals = calculateTotals(updatedTransactions);
    const updatedBudgets = updateBudgetsFromTransactions(
      updatedTransactions,
      state.budgets
    );

    const newState: AppState = {
      ...state,
      transactions: updatedTransactions,
      budgets: updatedBudgets,
      ...totals,
    };

    setState(newState);
    await storageService.saveData(newState);
  };

  const editTransaction = async (id: string, updates: Partial<Transaction>) => {
    const updatedTransactions = state.transactions.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    );

    const totals = calculateTotals(updatedTransactions);
    const updatedBudgets = updateBudgetsFromTransactions(
      updatedTransactions,
      state.budgets
    );

    const newState: AppState = {
      ...state,
      transactions: updatedTransactions,
      budgets: updatedBudgets,
      ...totals,
    };

    setState(newState);
    await storageService.saveData(newState);
  };

  const deleteTransaction = async (id: string) => {
    console.log(`🗑️  Menghapus transaksi: ${id}`);

    const transactionToDelete = state.transactions.find((t) => t.id === id);
    if (!transactionToDelete) {
      console.warn("⚠️ Transaksi tidak ditemukan untuk dihapus");
      return;
    }

    const updatedTransactions = state.transactions.filter((t) => t.id !== id);

    const totals = calculateTotals(updatedTransactions);
    const updatedBudgets = updateBudgetsFromTransactions(
      updatedTransactions,
      state.budgets
    );

    const newState: AppState = {
      ...state,
      transactions: updatedTransactions,
      budgets: updatedBudgets,
      ...totals,
    };

    setState(newState);
    await storageService.saveData(newState);

    console.log(
      `✅ Transaksi dihapus. Sisa: ${updatedTransactions.length} transaksi`
    );
  };

  /* ======================================================
     BUDGETS - PERBAIKAN TANGGAL
  ====================================================== */
  const addBudget = async (
    budget: Omit<Budget, "id" | "spent" | "createdAt" | "lastResetDate">
  ) => {
    const newBudget: Budget = {
      ...budget,
      id: generateBudgetId(),
      spent: 0,
      createdAt: new Date().toISOString(),
      lastResetDate: new Date().toISOString(),
    };

    console.log("➕ Menambahkan budget baru:", {
      category: newBudget.category,
      startDate: newBudget.startDate,
      endDate: newBudget.endDate,
      period: newBudget.period,
    });

    const updatedBudgets = updateBudgetsFromTransactions(state.transactions, [
      ...state.budgets,
      newBudget,
    ]);

    const newState: AppState = {
      ...state,
      budgets: updatedBudgets,
    };

    setState(newState);
    await storageService.saveData(newState);

    console.log("✅ Budget added:", {
      category: newBudget.category,
      period: newBudget.period,
      startDate: newBudget.startDate,
      endDate: newBudget.endDate,
      limit: newBudget.limit,
      days:
        Math.ceil(
          (new Date(newBudget.endDate).getTime() -
            new Date(newBudget.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1,
    });
  };

  const editBudget = async (id: string, updates: Partial<Budget>) => {
    console.log("✏️ Edit budget:", { id, updates });

    const updatedBudgets = state.budgets.map((b) =>
      b.id === id ? { ...b, ...updates } : b
    );

    const recalculated = updateBudgetsFromTransactions(
      state.transactions,
      updatedBudgets
    );

    const newState: AppState = {
      ...state,
      budgets: recalculated,
    };

    setState(newState);
    await storageService.saveData(newState);

    console.log("✅ Budget edited:", {
      id,
      category: updates.category,
      startDate: updates.startDate,
      endDate: updates.endDate,
    });
  };

  const deleteBudget = async (id: string) => {
    const newState: AppState = {
      ...state,
      budgets: state.budgets.filter((b) => b.id !== id),
    };

    setState(newState);
    await storageService.saveData(newState);
  };

  /* ======================================================
     SAVINGS - COMPLETE FUNCTIONS - FIXED
  ====================================================== */
  const addSavings = async (savings: Omit<Savings, "id" | "createdAt">) => {
    const newSavings: Savings = {
      ...savings,
      id: generateSavingsId(),
      createdAt: new Date().toISOString(),
    };

    // Create initial transaction jika ada saldo awal
    let initialTransaction: SavingsTransaction | null = null;
    if (safeNumber(newSavings.current) > 0) {
      initialTransaction = {
        id: generateId(),
        savingsId: newSavings.id,
        type: "initial",
        amount: safeNumber(newSavings.current),
        date: new Date().toISOString().split("T")[0],
        note: "Saldo awal",
        previousBalance: 0,
        newBalance: safeNumber(newSavings.current),
        createdAt: new Date().toISOString(),
      };
    }

    const newState: AppState = {
      ...state,
      savings: [...state.savings, newSavings],
      savingsTransactions: initialTransaction
        ? [...state.savingsTransactions, initialTransaction]
        : state.savingsTransactions,
    };

    setState(newState);
    await storageService.saveData(newState);

    console.log("✅ Savings added:", {
      name: newSavings.name,
      target: newSavings.target,
      current: newSavings.current,
      category: newSavings.category,
    });
  };

  const editSavings = async (id: string, updates: Partial<Savings>) => {
    console.log("✏️ Edit savings:", { id, updates });

    const updatedSavings = state.savings.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );

    const newState: AppState = {
      ...state,
      savings: updatedSavings,
    };

    setState(newState);
    await storageService.saveData(newState);

    console.log("✅ Savings edited:", {
      id,
      name: updates.name,
      target: updates.target,
    });
  };

  const deleteSavings = async (id: string) => {
    const newState: AppState = {
      ...state,
      savings: state.savings.filter((s) => s.id !== id),
      savingsTransactions: state.savingsTransactions.filter(
        (st) => st.savingsId !== id
      ),
    };

    setState(newState);
    await storageService.saveData(newState);

    console.log("✅ Savings deleted:", { id });
  };

  const addSavingsTransaction = async (
    savingsId: string,
    transaction: {
      type: "deposit" | "withdrawal";
      amount: number;
      date: string;
      note?: string;
    }
  ) => {
    const saving = state.savings.find((s) => s.id === savingsId);
    if (!saving) throw new Error("Tabungan tidak ditemukan");

    const previousBalance = safeNumber(saving.current);
    const amount = safeNumber(transaction.amount);

    if (transaction.type === "withdrawal" && amount > previousBalance) {
      throw new Error("Saldo tidak mencukupi");
    }

    const newBalance =
      transaction.type === "deposit"
        ? previousBalance + amount
        : previousBalance - amount;

    // Update savings
    const updatedSavings = state.savings.map((s) =>
      s.id === savingsId ? { ...s, current: newBalance } : s
    );

    // Create transaction record
    const newTransaction: SavingsTransaction = {
      id: generateId(),
      savingsId,
      type: transaction.type,
      amount,
      date: transaction.date,
      note: transaction.note,
      previousBalance,
      newBalance,
      createdAt: new Date().toISOString(),
    };

    const newState: AppState = {
      ...state,
      savings: updatedSavings,
      savingsTransactions: [...state.savingsTransactions, newTransaction],
    };

    setState(newState);
    await storageService.saveData(newState);
  };

  const getSavingsTransactions = (savingsId: string): SavingsTransaction[] => {
    return state.savingsTransactions
      .filter((st) => st.savingsId === savingsId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  /* ======================================================
     UX FLAG
  ====================================================== */
  const hasFinancialData = state.transactions.length > 0;

  /* ======================================================
     PROVIDER VALUE
  ====================================================== */
  return (
    <AppContext.Provider
      value={{
        state,
        isLoading,
        hasFinancialData,

        addTransaction,
        editTransaction,
        deleteTransaction,

        addBudget,
        editBudget,
        deleteBudget,

        addSavings,
        editSavings,
        deleteSavings,
        addSavingsTransaction,
        getSavingsTransactions,

        refreshData,
        clearAllData,
        debugStorage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

/* ======================================================
   HOOK
====================================================== */
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};
