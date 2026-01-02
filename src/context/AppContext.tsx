import React, { createContext, useState, useContext, useEffect } from "react";
import { AppState, Transaction, Budget, Savings } from "../types";
import { storageService } from "../utils/storage";
import { calculateTotals } from "../utils/calculations";
import { generateId } from "../utils/idGenerator";

interface AppContextType {
  state: AppState;
  // Transaction functions
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
  editTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Budget functions - HAPUS resetBudget
  addBudget: (
    budget: Omit<Budget, "id" | "spent" | "createdAt">
  ) => Promise<void>;
  editBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  // Savings functions
  addSavings: (savings: Omit<Savings, "id">) => Promise<void>;
  editSavings: (id: string, updates: Partial<Savings>) => Promise<void>;
  deleteSavings: (id: string) => Promise<void>;
  updateSavings: (id: string, amount: number) => Promise<void>;

  // Utility functions
  refreshData: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultAppState: AppState = {
  transactions: [],
  budgets: [],
  savings: [],
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AppState>(defaultAppState);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const data = await storageService.loadData();
      setState(data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsInitialized(true);
    }
  };

  const refreshData = async () => {
    await loadInitialData();
  };

  const clearAllData = async () => {
    await storageService.clearData();
    setState(defaultAppState);
  };

  // SIMPLE: Hitung spent dari SEMUA transaksi kategori tersebut
  const updateBudgetsFromTransactions = (
    transactions: Transaction[],
    budgets: Budget[]
  ): Budget[] => {
    return budgets.map((budget) => {
      const categoryExpenses = transactions
        .filter((t) => t.type === "expense" && t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);

      return { ...budget, spent: categoryExpenses };
    });
  };

  // ========== TRANSACTION FUNCTIONS ==========
  const addTransaction = async (transaction: Omit<Transaction, "id">) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
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
    const updatedTransactions = state.transactions.map((transaction) =>
      transaction.id === id ? { ...transaction, ...updates } : transaction
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
    const transactionToDelete = state.transactions.find((t) => t.id === id);

    if (!transactionToDelete) {
      console.warn("Transaction not found:", id);
      return;
    }

    const updatedTransactions = state.transactions.filter(
      (transaction) => transaction.id !== id
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

  // ========== BUDGET FUNCTIONS ==========
  const addBudget = async (
    budget: Omit<Budget, "id" | "spent" | "createdAt">
  ) => {
    const newBudget: Budget = {
      ...budget,
      id: generateId(),
      spent: 0,
      createdAt: new Date().toISOString(),
    };

    const updatedBudgets = [...state.budgets, newBudget];
    const newState: AppState = { ...state, budgets: updatedBudgets };

    setState(newState);
    await storageService.saveData(newState);
  };

  const editBudget = async (id: string, updates: Partial<Budget>) => {
    const updatedBudgets = state.budgets.map((budget) =>
      budget.id === id ? { ...budget, ...updates } : budget
    );

    // Recalculate spent setelah edit
    const recalculatedBudgets = updateBudgetsFromTransactions(
      state.transactions,
      updatedBudgets
    );

    const newState: AppState = { ...state, budgets: recalculatedBudgets };
    setState(newState);
    await storageService.saveData(newState);
  };

  const deleteBudget = async (id: string) => {
    const updatedBudgets = state.budgets.filter((budget) => budget.id !== id);
    const newState: AppState = { ...state, budgets: updatedBudgets };

    setState(newState);
    await storageService.saveData(newState);
  };

  // ========== SAVINGS FUNCTIONS ==========
  const addSavings = async (savings: Omit<Savings, "id">) => {
    const newSavings: Savings = {
      ...savings,
      id: generateId(),
    };

    const updatedSavings = [...state.savings, newSavings];
    const newState: AppState = { ...state, savings: updatedSavings };

    setState(newState);
    await storageService.saveData(newState);
  };

  const editSavings = async (id: string, updates: Partial<Savings>) => {
    const updatedSavings = state.savings.map((saving) =>
      saving.id === id ? { ...saving, ...updates } : saving
    );

    const newState: AppState = { ...state, savings: updatedSavings };
    setState(newState);
    await storageService.saveData(newState);
  };

  const deleteSavings = async (id: string) => {
    const updatedSavings = state.savings.filter((saving) => saving.id !== id);
    const newState: AppState = { ...state, savings: updatedSavings };

    setState(newState);
    await storageService.saveData(newState);
  };

  const updateSavings = async (id: string, amount: number) => {
    const updatedSavings = state.savings.map((saving) => {
      if (saving.id === id) {
        return {
          ...saving,
          current: Math.min(saving.current + amount, saving.target),
        };
      }
      return saving;
    });

    const newState: AppState = {
      ...state,
      savings: updatedSavings,
    };

    setState(newState);
    await storageService.saveData(newState);
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <AppContext.Provider
      value={{
        state,
        addTransaction,
        editTransaction,
        deleteTransaction,
        addBudget,
        editBudget,
        deleteBudget,
        addSavings,
        editSavings,
        deleteSavings,
        updateSavings,
        refreshData,
        clearAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
