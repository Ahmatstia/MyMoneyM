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
  lastResetDate?: string; // TAMBAHAN: Tanggal terakhir reset
  createdAt: string; // TAMBAHAN: Tanggal budget dibuat
}

export interface Savings {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline?: string;
}

export interface AppState {
  transactions: Transaction[];
  budgets: Budget[];
  savings: Savings[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

// Navigation types - UPDATED WITH ANALYTICS
export type RootStackParamList = {
  Home: undefined;
  Transactions: undefined;
  Budget: undefined;
  Savings: undefined;
  Analytics: undefined; // NEW
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

// Untuk deklarasi global
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
