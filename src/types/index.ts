export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string; // Format: YYYY-MM-DD
  createdAt: string; // ISO string
  // HAPUS: userId? - tidak perlu multi user
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: "custom" | "weekly" | "monthly" | "yearly";
  startDate: string; // ✨ TAMBAH: tanggal mulai periode
  endDate: string; // ✨ TAMBAH: tanggal akhir periode
  lastResetDate?: string; // Format: YYYY-MM-DD
  createdAt: string; // ISO string
  // HAPUS: userId? - tidak perlu multi user
}

export interface Savings {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline?: string;
  category: string; // Tambahkan
  priority: "low" | "medium" | "high"; // Tambahkan
  description: string; // Tambahkan
  icon: string; // Tambahkan
  createdAt: string; // Tambahkan
  // HAPUS: userId? - tidak perlu multi user
}

export interface SavingsTransaction {
  id: string;
  savingsId: string;
  type: "deposit" | "withdrawal" | "initial" | "adjustment";
  amount: number;
  date: string;
  note?: string;
  previousBalance: number;
  newBalance: number;
  createdAt: string; // Tambahkan
  // HAPUS: userId? - tidak perlu multi user
}

export interface AppState {
  // HAPUS user management
  // currentUser: User | null;
  // users: User[];

  // Financial data
  transactions: Transaction[];
  budgets: Budget[];
  savings: Savings[];
  savingsTransactions: SavingsTransaction[];

  // Calculated totals
  totalIncome: number;
  totalExpense: number;
  balance: number;
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
  SavingsHistory: { savingsId: string };
  AddSavingsTransaction: { savingsId: string; type?: "deposit" | "withdrawal" };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
