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

  // Budget functions
  addBudget: (budget: Omit<Budget, "id" | "spent">) => Promise<void>;
  editBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  resetBudget: (id: string, newLimit?: number) => Promise<void>;
  updateBudgetSpent: () => Promise<void>;

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

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const data = await storageService.loadData();
    setState(data);
  };

  const refreshData = async () => {
    await loadInitialData();
  };

  const clearAllData = async () => {
    await storageService.clearData();
    setState(defaultAppState);
  };

  // ========== TRANSACTION FUNCTIONS ==========
  const addTransaction = async (transaction: Omit<Transaction, "id">) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
    };

    const updatedTransactions = [newTransaction, ...state.transactions];
    const totals = calculateTotals(updatedTransactions);

    const newState: AppState = {
      ...state,
      transactions: updatedTransactions,
      ...totals,
    };

    setState(newState);
    await storageService.saveData(newState);

    // Update budget spent amount if expense
    if (transaction.type === "expense") {
      await updateBudgetSpent();
    }
  };

  const editTransaction = async (id: string, updates: Partial<Transaction>) => {
    const updatedTransactions = state.transactions.map((transaction) =>
      transaction.id === id ? { ...transaction, ...updates } : transaction
    );

    const totals = calculateTotals(updatedTransactions);

    const newState: AppState = {
      ...state,
      transactions: updatedTransactions,
      ...totals,
    };

    setState(newState);
    await storageService.saveData(newState);

    // Update budget spent if expense amount changed
    if (updates.type === "expense" || updates.amount !== undefined) {
      await updateBudgetSpent();
    }
  };

  const deleteTransaction = async (id: string) => {
    const transactionToDelete = state.transactions.find((t) => t.id === id);
    const updatedTransactions = state.transactions.filter(
      (transaction) => transaction.id !== id
    );

    const totals = calculateTotals(updatedTransactions);

    const newState: AppState = {
      ...state,
      transactions: updatedTransactions,
      ...totals,
    };

    setState(newState);
    await storageService.saveData(newState);

    // Update budget spent if deleted transaction was an expense
    if (transactionToDelete?.type === "expense") {
      await updateBudgetSpent();
    }
  };

  // ========== BUDGET FUNCTIONS ==========
  const addBudget = async (budget: Omit<Budget, "id" | "spent">) => {
    const newBudget: Budget = {
      ...budget,
      id: generateId(),
      spent: 0,
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

    const newState: AppState = { ...state, budgets: updatedBudgets };
    setState(newState);
    await storageService.saveData(newState);
  };

  const deleteBudget = async (id: string) => {
    const updatedBudgets = state.budgets.filter((budget) => budget.id !== id);
    const newState: AppState = { ...state, budgets: updatedBudgets };

    setState(newState);
    await storageService.saveData(newState);
  };

  const resetBudget = async (id: string, newLimit?: number) => {
    const updatedBudgets = state.budgets.map((budget) => {
      if (budget.id === id) {
        return {
          ...budget,
          spent: 0,
          limit: newLimit || budget.limit,
        };
      }
      return budget;
    });

    const newState: AppState = { ...state, budgets: updatedBudgets };
    setState(newState);
    await storageService.saveData(newState);
  };

  const updateBudgetSpent = async () => {
    const updatedBudgets = state.budgets.map((budget) => {
      const categoryExpenses = state.transactions
        .filter((t) => t.type === "expense" && t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);

      return { ...budget, spent: categoryExpenses };
    });

    const newState: AppState = {
      ...state,
      budgets: updatedBudgets,
    };

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

  return (
    <AppContext.Provider
      value={{
        state,
        // Transaction functions
        addTransaction,
        editTransaction,
        deleteTransaction,
        // Budget functions
        addBudget,
        editBudget,
        deleteBudget,
        resetBudget,
        updateBudgetSpent,
        // Savings functions
        addSavings,
        editSavings,
        deleteSavings,
        updateSavings,
        // Utility functions
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
