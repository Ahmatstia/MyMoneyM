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
  Note,
  Debt,
} from "../types";
import { storageService } from "../utils/storage";
import { calculateTotals, safeNumber } from "../utils/calculations";
import {
  generateTransactionId,
  generateBudgetId,
  generateSavingsId,
  generateId,
} from "../utils/idGenerator";
import { notificationService } from "../utils/notifications";
import {
  isValidDateString,
  validateNote,
  validateAndSetupBudget,
  validateSavings,
  validateTransaction,
  validateSavingsTransaction,
  updateBudgetsFromTransactions
} from "../utils/validators";

interface AppContextType {
  state: AppState;
  isLoading: boolean;

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

  // 🔹 NOTES
  addNote: (
    note: Omit<Note, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  editNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  getNote: (id: string) => Note | undefined;

  // 🔹 DEBTS
  addDebt: (debt: Omit<Debt, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  editDebt: (id: string, updates: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  payDebt: (id: string, amount: number) => Promise<void>;

  // 🔹 NOTIFICATIONS
  triggerNotificationCheck: () => Promise<void>;

  // 🔹 SYSTEM
  refreshData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  debugStorage: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultAppState: AppState = {
  transactions: [],
  budgets: [],
  savings: [],
  savingsTransactions: [],
  notes: [],
  debts: [],
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AppState>(defaultAppState);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  // ========== LOAD INITIAL DATA ==========
  useEffect(() => {

    loadInitialData();

    return () => {
      isMounted.current = false;

    };
  }, []);

  const loadInitialData = async () => {
    if (!isMounted.current) return;

    try {

      const appData = await storageService.loadData();

      // Pastikan semua properti ada termasuk notes
      const completeAppData: AppState = {
        ...defaultAppState,
        ...appData,
        notes: appData.notes || [],
        debts: appData.debts || [],
      };

      if (isMounted.current) {
        setState(completeAppData);
      }
    } catch (error) {

      if (isMounted.current) {
        setState(defaultAppState);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);

      }
    }
  };

  // ========== NOTIFICATIONS SETUP ==========
  const notificationsInitialized = useRef(false);

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Only initialize once when loading completes
        if (!isLoading && !notificationsInitialized.current) {
          notificationsInitialized.current = true;

          // Request permission
          await notificationService.registerForPushNotificationsAsync();

          // Initialize notifications with current state — this schedules daily reminders
          // and checks immediate alerts ONCE on app startup
          await notificationService.initialize(state);
        }
      } catch (error) {

      }
    };

    setupNotifications();
  }, [isLoading]);

  // REMOVED: The second useEffect that watched [state.transactions, state.budgets, etc.]
  // was causing DUPLICATE notifications because:
  // 1. initialize() already calls checkImmediateAlerts()
  // 2. Every mutation function (addTransaction, addBudget, etc.) already calls
  //    notificationService.updateNotifications(newState) directly
  // 3. This useEffect was a third layer firing the same alerts again

  useEffect(() => {
    // Check notifications every 5 minutes when app is active
    const interval = setInterval(async () => {
      if (!isLoading) {
        await triggerNotificationCheck();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isLoading]);

  // ========== SYSTEM FUNCTIONS ==========
  const refreshData = async () => {
    try {
      const appData = await storageService.loadData();
      const completeAppData: AppState = {
        ...defaultAppState,
        ...appData,
        notes: appData.notes || [],
        debts: appData.debts || [],
      };
      if (isMounted.current) {
        setState(completeAppData);
      }
    } catch (error) {

    }
  };

  const clearAllData = async () => {
    try {
      await storageService.clearData();
      if (isMounted.current) {
        setState(defaultAppState);
      }
    } catch (error) {

    }
  };

  const debugStorage = async () => {
    await storageService.debugStorage();
  };

  const triggerNotificationCheck = async () => {
    await notificationService.checkImmediateAlerts(state);
  };

  // ========== TRANSACTIONS FUNCTIONS ==========
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

    // Send notifications
    await notificationService.updateNotifications(newState);

    // Specific notification for large transaction
    if (transaction.amount >= 1000000) {
      await notificationService.sendNotification({
        title: "💰 Transaksi Besar",
        body: `Transaksi ${
          transaction.type === "income" ? "pemasukan" : "pengeluaran"
        } Rp ${transaction.amount.toLocaleString("id-ID")} tercatat`,
        data: { type: "NEW_TRANSACTION", transactionId: newTransaction.id },
      });
    }


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
    await notificationService.updateNotifications(newState);
  };

  const deleteTransaction = async (id: string) => {

    const transactionToDelete = state.transactions.find((t) => t.id === id);
    if (!transactionToDelete) {

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
    await notificationService.updateNotifications(newState);

    
  };

  // ========== BUDGETS FUNCTIONS ==========
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

    // Send notification
    await notificationService.updateNotifications(newState);
    await notificationService.sendNotification({
      title: "📊 Budget Baru",
      body: `Budget ${budget.category} Rp ${budget.limit.toLocaleString(
        "id-ID"
      )} dibuat`,
      data: { type: "NEW_BUDGET", budgetId: newBudget.id },
    });
  };

  const editBudget = async (id: string, updates: Partial<Budget>) => {
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
    await notificationService.updateNotifications(newState);
  };

  const deleteBudget = async (id: string) => {
    const newState: AppState = {
      ...state,
      budgets: state.budgets.filter((b) => b.id !== id),
    };

    setState(newState);
    await storageService.saveData(newState);
    await notificationService.updateNotifications(newState);
  };

  // ========== SAVINGS FUNCTIONS ==========
  const addSavings = async (savings: Omit<Savings, "id" | "createdAt">) => {
    const newSavings: Savings = {
      ...savings,
      id: generateSavingsId(),
      createdAt: new Date().toISOString(),
    };

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

    // Send notification
    await notificationService.updateNotifications(newState);
    await notificationService.sendNotification({
      title: "🏦 Tabungan Baru",
      body: `Tabungan "${
        savings.name
      }" dengan target Rp ${savings.target.toLocaleString("id-ID")} dibuat`,
      data: { type: "NEW_SAVINGS", savingsId: newSavings.id },
    });
  };

  const editSavings = async (id: string, updates: Partial<Savings>) => {
    const updatedSavings = state.savings.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );

    const newState: AppState = {
      ...state,
      savings: updatedSavings,
    };

    setState(newState);
    await storageService.saveData(newState);
    await notificationService.updateNotifications(newState);
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
    await notificationService.updateNotifications(newState);
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

    const updatedSavings = state.savings.map((s) =>
      s.id === savingsId ? { ...s, current: newBalance } : s
    );

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
    await notificationService.updateNotifications(newState);
  };

  const getSavingsTransactions = (savingsId: string): SavingsTransaction[] => {
    return state.savingsTransactions
      .filter((st) => st.savingsId === savingsId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // ========== NOTES FUNCTIONS ==========
  const addNote = async (
    note: Omit<Note, "id" | "createdAt" | "updatedAt">
  ) => {

    const newNote: Note = validateNote({
      ...note,
      id: generateId(),
      createdAt: new Date().toISOString(),
    });

    const updatedNotes = [newNote, ...state.notes];
    const newState: AppState = {
      ...state,
      notes: updatedNotes,
    };

    setState(newState);
    await storageService.saveData(newState);

    // Send notification
    await notificationService.updateNotifications(newState);
    await notificationService.sendNotification({
      title: "📔 Catatan Baru",
      body: `Catatan "${note.title.substring(0, 30)}${
        note.title.length > 30 ? "..." : ""
      }" disimpan`,
      data: { type: "NEW_NOTE", noteId: newNote.id },
    });


  };

  const editNote = async (id: string, updates: Partial<Note>) => {

    const noteToUpdate = state.notes.find((n) => n.id === id);
    if (!noteToUpdate) {

      return;
    }

    const updatedNote: Note = validateNote({
      ...noteToUpdate,
      ...updates,
      id,
    });

    const updatedNotes = state.notes.map((n) =>
      n.id === id ? updatedNote : n
    );

    const newState: AppState = {
      ...state,
      notes: updatedNotes,
    };

    setState(newState);
    await storageService.saveData(newState);
    await notificationService.updateNotifications(newState);


  };

  const deleteNote = async (id: string) => {

    const updatedNotes = state.notes.filter((n) => n.id !== id);
    const newState: AppState = {
      ...state,
      notes: updatedNotes,
    };

    setState(newState);
    await storageService.saveData(newState);
    await notificationService.updateNotifications(newState);


  };

  const getNote = (id: string): Note | undefined => {
    return state.notes.find((note) => note.id === id);
  };

  // ========== DEBTS FUNCTIONS ==========
  const addDebt = async (debt: Omit<Debt, "id" | "createdAt" | "updatedAt">) => {
    const newDebt: Debt = {
      ...debt,
      id: generateId(),
      remaining: debt.amount,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    const newState: AppState = {
      ...state,
      debts: [newDebt, ...state.debts],
    };
    setState(newState);
    await storageService.saveData(newState);
  };

  const editDebt = async (id: string, updates: Partial<Debt>) => {
    const updatedDebts = state.debts.map((d) =>
      d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
    );
    const newState: AppState = { ...state, debts: updatedDebts };
    setState(newState);
    await storageService.saveData(newState);
  };

  const deleteDebt = async (id: string) => {
    const newState: AppState = {
      ...state,
      debts: state.debts.filter((d) => d.id !== id),
    };
    setState(newState);
    await storageService.saveData(newState);
  };

  const payDebt = async (id: string, amount: number) => {
    const debt = state.debts.find((d) => d.id === id);
    if (!debt) return;
    const newRemaining = Math.max(0, debt.remaining - amount);
    const newStatus: Debt["status"] =
      newRemaining === 0 ? "paid" : newRemaining < debt.amount ? "partial" : "active";
    await editDebt(id, { remaining: newRemaining, status: newStatus });
  };

  // ========== PROVIDER VALUE ==========
  const contextValue: AppContextType = {
    state,
    isLoading,

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

    addNote,
    editNote,
    deleteNote,
    getNote,

    addDebt,
    editDebt,
    deleteDebt,
    payDebt,

    triggerNotificationCheck,

    refreshData,
    clearAllData,
    debugStorage,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};
