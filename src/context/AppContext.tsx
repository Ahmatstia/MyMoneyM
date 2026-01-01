import React, { createContext, useState, useContext, useEffect } from "react";
import { AppState, Transaction } from "../types";
import { storageService } from "../utils/storage";
import { calculateTotals } from "../utils/calculations";
import { generateId } from "../utils/idGenerator";

interface AppContextType {
  state: AppState;
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
  editTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>; // PASTIKAN ADA
  deleteTransaction: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AppState>({
    transactions: [],
    budgets: [],
    savings: [],
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });

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
  };

  // TAMBAHKAN FUNGSI INI
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
  };

  // TAMBAHKAN FUNGSI INI
  const deleteTransaction = async (id: string) => {
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
  };

  return (
    <AppContext.Provider
      value={{
        state,
        addTransaction,
        editTransaction, // TAMBAHKAN
        deleteTransaction, // TAMBAHKAN
        refreshData,
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
