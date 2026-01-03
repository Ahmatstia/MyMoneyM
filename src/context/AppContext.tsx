// File: src/context/AppContext.tsx - UPDATE UNTUK STORAGE PER USER
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
  User,
} from "../types";
import { storageService } from "../utils/storage";
import { calculateTotals, safeNumber } from "../utils/calculations";
import {
  generateTransactionId,
  generateBudgetId,
  generateSavingsId,
  generateId,
} from "../utils/idGenerator";
import {
  createUser,
  getCurrentUser,
  setCurrentUser,
  loadUsers,
  saveUsers,
} from "../utils/userManager";

/* ======================================================
   CONTEXT TYPE - TAMBAH FUNGSI USER
====================================================== */
interface AppContextType {
  state: AppState;
  isLoading: boolean;

  // 🔹 USER MANAGEMENT - BARU
  currentUser: User | null;
  allUsers: User[];
  initializeUser: (name: string) => Promise<User>;
  switchToUser: (userId: string) => Promise<void>;
  refreshUserList: () => Promise<void>;

  // 🔹 TRANSACTIONS
  addTransaction: (
    transaction: Omit<Transaction, "id" | "createdAt" | "userId">
  ) => Promise<void>;
  editTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // 🔹 BUDGETS
  addBudget: (
    budget: Omit<
      Budget,
      "id" | "spent" | "createdAt" | "lastResetDate" | "userId"
    >
  ) => Promise<void>;
  editBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  // 🔹 SAVINGS
  addSavings: (
    savings: Omit<Savings, "id" | "createdAt" | "userId">
  ) => Promise<void>;
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
   DEFAULT STATE - TAMBAH USER
====================================================== */
const defaultAppState: AppState = {
  currentUser: null,
  users: [],
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
  const [allUsers, setAllUsers] = useState<User[]>([]); // TAMBAH STATE
  const isMounted = useRef(true);

  /* ======================================================
     HELPER FUNCTIONS (DIPERBAIKI untuk userId)
  ====================================================== */

  // 🟢 PERBAIKAN: Fungsi untuk validasi tanggal
  const isValidDateString = (dateStr: string): boolean => {
    try {
      if (!dateStr || typeof dateStr !== "string") return false;
      const date = new Date(dateStr);
      return !isNaN(date.getTime()) && dateStr.length === 10;
    } catch {
      return false;
    }
  };

  // 🟢 PERBAIKAN: Fungsi untuk validasi dan setup budget - DITAMBAH userId
  const validateAndSetupBudget = (budget: any, userId: string): Budget => {
    try {
      let startDate = budget.startDate;
      let endDate = budget.endDate;
      const createdAt = budget.createdAt || new Date().toISOString();
      const createdDate = createdAt.split("T")[0];

      if (!isValidDateString(startDate)) {
        startDate = createdDate;
      }

      if (!isValidDateString(endDate)) {
        const start = new Date(startDate);
        let end = new Date(start);

        const period = budget.period || "monthly";

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
        id: budget.id,
        category: budget.category,
        limit: Math.max(0, budget.limit || 0),
        spent: Math.max(0, budget.spent || 0),
        period: budget.period || "monthly",
        startDate,
        endDate,
        lastResetDate: budget.lastResetDate,
        createdAt: budget.createdAt || new Date().toISOString(),
        userId,
      };
    } catch (error) {
      console.error("Error validating budget:", error);
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
        userId,
      };
    }
  };

  // 🟢 PERBAIKAN: Validate savings - DITAMBAH userId
  const validateSavings = (savings: any, userId: string): Savings => {
    try {
      return {
        id: savings.id || generateSavingsId(),
        name: savings.name || "Tabungan Baru",
        target: Math.max(0, savings.target || 0),
        current: Math.max(0, savings.current || 0),
        deadline: savings.deadline,
        category: savings.category || "other",
        priority: savings.priority || "medium",
        description: savings.description || "",
        icon: savings.icon || "wallet",
        createdAt: savings.createdAt || new Date().toISOString(),
        userId,
      };
    } catch (error) {
      console.error("Error validating savings:", error);
      return {
        id: generateSavingsId(),
        name: "Tabungan Baru",
        target: 0,
        current: 0,
        deadline: undefined,
        category: "other",
        priority: "medium",
        description: "",
        icon: "wallet",
        createdAt: new Date().toISOString(),
        userId,
      };
    }
  };

  // 🟢 PERBAIKAN: Update budgets dari transactions - FILTER by userId
  const updateBudgetsFromTransactions = (
    transactions: Transaction[],
    budgets: Budget[],
    userId: string
  ): Budget[] => {
    if (!budgets.length) return budgets;

    return budgets.map((budget) => {
      try {
        const startDate = budget.startDate;
        const endDate = budget.endDate;

        const spent = transactions
          .filter((t) => {
            if (t.userId !== userId) return false; // Hanya transaksi user ini
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
     LOAD INITIAL DATA - UPDATE UNTUK USER
  ====================================================== */
  useEffect(() => {
    console.log("🔄 AppProvider: Initial load started");
    loadInitialData();

    return () => {
      isMounted.current = false;
      console.log("🧹 AppProvider unmounted");
    };
  }, []);

  // FUNGSI BARU: Load data untuk user tertentu - PAKAI storageService.loadUserData
  const loadUserData = async (user: User) => {
    try {
      console.log(`📥 Loading data for user: ${user.name} (${user.id})`);

      // Load data user dari storage per user
      const userData = await storageService.loadUserData(user.id);

      // Validasi data dengan userId
      const validatedBudgets = (
        Array.isArray(userData.budgets) ? userData.budgets : []
      ).map((budget) => validateAndSetupBudget(budget, user.id));

      const validatedSavings = (
        Array.isArray(userData.savings) ? userData.savings : []
      ).map((savings) => validateSavings(savings, user.id));

      // Recalculate budgets dengan filter userId
      const recalculatedBudgets = updateBudgetsFromTransactions(
        userData.transactions || [],
        validatedBudgets,
        user.id
      );

      const userState: AppState = {
        currentUser: user,
        users: allUsers,
        transactions: Array.isArray(userData.transactions)
          ? userData.transactions.filter(
              (t: Transaction) => t.userId === user.id
            )
          : [],
        budgets: recalculatedBudgets.filter((b) => b.userId === user.id),
        savings: validatedSavings.filter((s) => s.userId === user.id),
        savingsTransactions: Array.isArray(userData.savingsTransactions)
          ? userData.savingsTransactions.filter(
              (st: SavingsTransaction) => st.userId === user.id
            )
          : [],
        totalIncome: safeNumber(userData.totalIncome),
        totalExpense: safeNumber(userData.totalExpense),
        balance: safeNumber(userData.balance),
      };

      if (isMounted.current) {
        setState(userState);
      }

      console.log(`✅ Data loaded for user: ${user.name}`);
      console.log(`   - ${userState.transactions.length} transactions`);
      console.log(`   - ${userState.budgets.length} budgets`);
      console.log(`   - ${userState.savings.length} savings`);

      return userState;
    } catch (error) {
      console.error(`Error loading data for user ${user.name}:`, error);

      // Return default state jika error
      const defaultUserState: AppState = {
        currentUser: user,
        users: allUsers,
        transactions: [],
        budgets: [],
        savings: [],
        savingsTransactions: [],
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
      };

      if (isMounted.current) {
        setState(defaultUserState);
      }

      return defaultUserState;
    }
  };

  const loadInitialData = async () => {
    if (!isMounted.current) return;

    try {
      console.log("📥 Loading initial data...");

      // Load semua user
      const users = await loadUsers();
      setAllUsers(users);

      // Load current user
      const currentUser = await getCurrentUser();

      if (currentUser) {
        // Load data untuk current user
        await loadUserData(currentUser);
      } else if (users.length > 0) {
        // Jika ada user tapi tidak ada current user, pilih user pertama
        await switchToUser(users[0].id);
      } else {
        // Tidak ada user sama sekali
        setState({
          ...defaultAppState,
          users: [],
        });
      }
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
     USER MANAGEMENT FUNCTIONS - BARU
  ====================================================== */
  const initializeUser = async (name: string): Promise<User> => {
    const newUser = await createUser(name);

    // Set sebagai current user
    await setCurrentUser(newUser);

    // Refresh user list
    const users = await loadUsers();
    setAllUsers(users);

    // Load data untuk user baru
    await loadUserData(newUser);

    return newUser;
  };

  const switchToUser = async (userId: string) => {
    try {
      const users = await loadUsers();
      const user = users.find((u) => u.id === userId);

      if (user) {
        await setCurrentUser(user);
        await loadUserData(user);
      }
    } catch (error) {
      console.error("Error switching user:", error);
    }
  };

  const refreshUserList = async () => {
    const users = await loadUsers();
    setAllUsers(users);
  };

  /* ======================================================
     SYSTEM FUNCTIONS - UPDATE untuk userId
  ====================================================== */
  const refreshData = async () => {
    if (state.currentUser) {
      await loadUserData(state.currentUser);
    }
  };

  const clearAllData = async () => {
    if (state.currentUser) {
      await storageService.clearUserData(state.currentUser.id);
      await loadUserData(state.currentUser);
    }
  };

  const debugStorage = async () => {
    await storageService.debugStorage();
  };

  /* ======================================================
     TRANSACTIONS - UPDATE dengan userId
  ====================================================== */
  const addTransaction = async (
    transaction: Omit<Transaction, "id" | "createdAt" | "userId">
  ) => {
    if (!state.currentUser) {
      console.error("❌ Tidak ada user yang aktif");
      return;
    }

    const newTransaction: Transaction = {
      ...transaction,
      id: generateTransactionId(),
      createdAt: new Date().toISOString(),
      userId: state.currentUser.id, // Tambahkan userId
    };

    const updatedTransactions = [newTransaction, ...state.transactions];
    const totals = calculateTotals(updatedTransactions);
    const updatedBudgets = updateBudgetsFromTransactions(
      updatedTransactions,
      state.budgets,
      state.currentUser.id
    );

    const newState: AppState = {
      ...state,
      transactions: updatedTransactions,
      budgets: updatedBudgets,
      ...totals,
    };

    setState(newState);

    // Simpan dengan userId
    await storageService.saveUserData(state.currentUser.id, {
      transactions: updatedTransactions,
      budgets: updatedBudgets,
      ...totals,
    });
  };

  const editTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!state.currentUser) {
      console.error("❌ Tidak ada user yang aktif");
      return;
    }

    const updatedTransactions = state.transactions.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    );

    const totals = calculateTotals(updatedTransactions);
    const updatedBudgets = updateBudgetsFromTransactions(
      updatedTransactions,
      state.budgets,
      state.currentUser.id
    );

    const newState: AppState = {
      ...state,
      transactions: updatedTransactions,
      budgets: updatedBudgets,
      ...totals,
    };

    setState(newState);
    await storageService.saveUserData(state.currentUser.id, {
      transactions: updatedTransactions,
      budgets: updatedBudgets,
      ...totals,
    });
  };

  const deleteTransaction = async (id: string) => {
    if (!state.currentUser) {
      console.error("❌ Tidak ada user yang aktif");
      return;
    }

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
      state.budgets,
      state.currentUser.id
    );

    const newState: AppState = {
      ...state,
      transactions: updatedTransactions,
      budgets: updatedBudgets,
      ...totals,
    };

    setState(newState);
    await storageService.saveUserData(state.currentUser.id, {
      transactions: updatedTransactions,
      budgets: updatedBudgets,
      ...totals,
    });

    console.log(
      `✅ Transaksi dihapus. Sisa: ${updatedTransactions.length} transaksi`
    );
  };

  /* ======================================================
     BUDGETS - UPDATE dengan userId
  ====================================================== */
  const addBudget = async (
    budget: Omit<
      Budget,
      "id" | "spent" | "createdAt" | "lastResetDate" | "userId"
    >
  ) => {
    if (!state.currentUser) {
      console.error("❌ Tidak ada user yang aktif");
      return;
    }

    const newBudget: Budget = {
      ...budget,
      id: generateBudgetId(),
      spent: 0,
      createdAt: new Date().toISOString(),
      lastResetDate: new Date().toISOString(),
      userId: state.currentUser.id, // Tambahkan userId
    };

    console.log("➕ Menambahkan budget baru:", {
      category: newBudget.category,
      startDate: newBudget.startDate,
      endDate: newBudget.endDate,
      period: newBudget.period,
      userId: newBudget.userId,
    });

    const updatedBudgets = updateBudgetsFromTransactions(
      state.transactions,
      [...state.budgets, newBudget],
      state.currentUser.id
    );

    const newState: AppState = {
      ...state,
      budgets: updatedBudgets,
    };

    setState(newState);
    await storageService.saveUserData(state.currentUser.id, {
      budgets: updatedBudgets,
    });

    console.log("✅ Budget added:", {
      category: newBudget.category,
      period: newBudget.period,
      startDate: newBudget.startDate,
      endDate: newBudget.endDate,
      limit: newBudget.limit,
      userId: newBudget.userId,
    });
  };

  const editBudget = async (id: string, updates: Partial<Budget>) => {
    if (!state.currentUser) {
      console.error("❌ Tidak ada user yang aktif");
      return;
    }

    console.log("✏️ Edit budget:", { id, updates });

    const updatedBudgets = state.budgets.map((b) =>
      b.id === id ? { ...b, ...updates } : b
    );

    const recalculated = updateBudgetsFromTransactions(
      state.transactions,
      updatedBudgets,
      state.currentUser.id
    );

    const newState: AppState = {
      ...state,
      budgets: recalculated,
    };

    setState(newState);
    await storageService.saveUserData(state.currentUser.id, {
      budgets: recalculated,
    });

    console.log("✅ Budget edited:", {
      id,
      category: updates.category,
    });
  };

  const deleteBudget = async (id: string) => {
    if (!state.currentUser) {
      console.error("❌ Tidak ada user yang aktif");
      return;
    }

    const newState: AppState = {
      ...state,
      budgets: state.budgets.filter((b) => b.id !== id),
    };

    setState(newState);
    await storageService.saveUserData(state.currentUser.id, {
      budgets: newState.budgets,
    });
  };

  /* ======================================================
     SAVINGS - UPDATE dengan userId
  ====================================================== */
  const addSavings = async (
    savings: Omit<Savings, "id" | "createdAt" | "userId">
  ) => {
    if (!state.currentUser) {
      console.error("❌ Tidak ada user yang aktif");
      return;
    }

    const newSavings: Savings = {
      ...savings,
      id: generateSavingsId(),
      createdAt: new Date().toISOString(),
      userId: state.currentUser.id, // Tambahkan userId
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
        userId: state.currentUser.id, // Tambahkan userId
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
    await storageService.saveUserData(state.currentUser.id, {
      savings: newState.savings,
      savingsTransactions: newState.savingsTransactions,
    });

    console.log("✅ Savings added:", {
      name: newSavings.name,
      target: newSavings.target,
      current: newSavings.current,
      userId: newSavings.userId,
    });
  };

  const editSavings = async (id: string, updates: Partial<Savings>) => {
    if (!state.currentUser) {
      console.error("❌ Tidak ada user yang aktif");
      return;
    }

    console.log("✏️ Edit savings:", { id, updates });

    const updatedSavings = state.savings.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );

    const newState: AppState = {
      ...state,
      savings: updatedSavings,
    };

    setState(newState);
    await storageService.saveUserData(state.currentUser.id, {
      savings: updatedSavings,
    });

    console.log("✅ Savings edited:", {
      id,
      name: updates.name,
    });
  };

  const deleteSavings = async (id: string) => {
    if (!state.currentUser) {
      console.error("❌ Tidak ada user yang aktif");
      return;
    }

    const newState: AppState = {
      ...state,
      savings: state.savings.filter((s) => s.id !== id),
      savingsTransactions: state.savingsTransactions.filter(
        (st) => st.savingsId !== id
      ),
    };

    setState(newState);
    await storageService.saveUserData(state.currentUser.id, {
      savings: newState.savings,
      savingsTransactions: newState.savingsTransactions,
    });

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
    if (!state.currentUser) {
      console.error("❌ Tidak ada user yang aktif");
      throw new Error("User tidak ditemukan");
    }

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
      userId: state.currentUser.id, // Tambahkan userId
    };

    const newState: AppState = {
      ...state,
      savings: updatedSavings,
      savingsTransactions: [...state.savingsTransactions, newTransaction],
    };

    setState(newState);
    await storageService.saveUserData(state.currentUser.id, {
      savings: updatedSavings,
      savingsTransactions: newState.savingsTransactions,
    });
  };

  const getSavingsTransactions = (savingsId: string): SavingsTransaction[] => {
    return state.savingsTransactions
      .filter(
        (st) =>
          st.savingsId === savingsId && st.userId === state.currentUser?.id
      ) // Filter by userId
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  /* ======================================================
     PROVIDER VALUE
  ====================================================== */
  return (
    <AppContext.Provider
      value={{
        state,
        isLoading,

        // User Management
        currentUser: state.currentUser,
        allUsers,
        initializeUser,
        switchToUser,
        refreshUserList,

        // Data Operations
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

        // System
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
