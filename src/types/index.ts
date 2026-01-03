// File: src/types/index.ts
export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string; // Format: YYYY-MM-DD
  createdAt: string; // ISO string
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: "custom" | "weekly" | "monthly" | "yearly"; // ✨ UPDATE: tambah "yearly" dan "custom"
  startDate: string; // ✨ TAMBAH: tanggal mulai periode
  endDate: string; // ✨ TAMBAH: tanggal akhir periode
  lastResetDate?: string; // Format: YYYY-MM-DD
  createdAt: string; // ISO string
}

export interface Savings {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline?: string; // Format: YYYY-MM-DD
  createdAt?: string; // ISO string
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
  savingsTransactions?: SavingsTransaction[]; // Optional
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
