// File: src/types/index.ts
export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: "monthly" | "weekly";
  lastResetDate?: string;
  createdAt: string;
}

export interface Savings {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline?: string;
}

export interface SavingsTransaction {
  id: string;
  savingsId: string;
  type: "deposit" | "withdrawal" | "adjustment";
  amount: number;
  date: string;
  note?: string;
  previousBalance: number;
  newBalance: number;
}

export interface AppState {
  transactions: Transaction[];
  budgets: Budget[];
  savings: Savings[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsTransactions: SavingsTransaction[];
}

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  MainTabs: undefined;
  Transactions: undefined;
  Budget: undefined;
  Savings: undefined;
  Analytics: undefined;
  Calendar: undefined;
  SavingsDetail: { savingsId: string };

  AddTransaction: {
    editMode?: boolean;
    transactionData?: Transaction;
  };

  AddBudget: {
    editMode?: boolean;
    budgetData?: Budget;
  };

  AddSavings: {
    editMode?: boolean;
    savingsData?: Savings;
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
