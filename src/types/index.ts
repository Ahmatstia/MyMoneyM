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
  period: "custom" | "weekly" | "monthly" | "yearly";
  startDate: string;
  endDate: string;
  lastResetDate?: string; // Format: YYYY-MM-DD
  createdAt: string; // ISO string
}

export interface Savings {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline?: string;
  category: string;
  priority: "low" | "medium" | "high";
  description: string;
  icon: string;
  createdAt: string;
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
  createdAt: string;
}

// TAMBAHKAN INTERFACE NOTE
export interface Note {
  id: string;
  title: string;
  content: string;
  type:
    | "financial_decision"
    | "expense_reflection"
    | "goal_progress"
    | "investment_idea"
    | "budget_analysis"
    | "general";
  mood?: "positive" | "neutral" | "negative" | "reflective";
  financialImpact?: "positive" | "neutral" | "negative";
  amount?: number;
  category?: string;
  tags: string[];
  relatedTransactionIds?: string[];
  relatedSavingsIds?: string[];
  relatedBudgetIds?: string[];
  date: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt?: string;
}

export interface AppState {
  // Financial data
  transactions: Transaction[];
  budgets: Budget[];
  savings: Savings[];
  savingsTransactions: SavingsTransaction[];
  notes: Note[]; // TAMBAHKAN

  // Calculated totals
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export type RootStackParamList = {
  Home: undefined;
  MainTabs: undefined;
  Transactions: undefined;
  Budget: undefined;
  Savings: undefined;
  Analytics: undefined;
  Calendar: undefined;
  SavingsDetail: { savingsId: string };
  Notes: undefined; // TAMBAHKAN
  NoteForm: { noteId?: string }; // TAMBAHKAN
  NoteDetail: { noteId: string }; // TAMBAHKAN
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
