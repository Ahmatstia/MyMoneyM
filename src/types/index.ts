export type TransactionType = "income" | "expense";

export interface CustomCategory {
  id: string;          // Unique ID, e.g. "cat_abc123"
  name: string;        // Display name, e.g. "Vape"
  icon: string;        // Ionicons key, e.g. "flame-outline"
  color: string;       // Hex color, e.g. "#F59E0B"
  isCustom: true;      // Always true, to distinguish from built-ins
  createdAt: string;   // ISO string
}

export interface SubTransaction {
  id: string;
  name: string;        // Item name, e.g. "Kopi Susu", "Nasi Goreng"
  amount: number;      // Price of this item
  qty: number;         // Quantity, default 1
  note?: string;       // Optional note
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;           // Format: YYYY-MM-DD
  createdAt: string;      // ISO string
  cyclePeriod?: number;   // Days for income cycle (7, 30, etc)
  subTransactions?: SubTransaction[]; // Optional: itemized cart items
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
  imageCover?: string; // NEW: For Wishlist & Dream Planner
  createdAt: string;
}

export type DebtType = "borrowed" | "lent"; // borrowed = hutang saya, lent = piutang (saya dipinjami)
export type DebtStatus = "active" | "partial" | "paid";

export interface Debt {
  id: string;
  name: string;          // Nama pemberi hutang / peminjam
  amount: number;        // Jumlah total hutang
  remaining: number;     // Sisa hutang
  type: DebtType;
  category: string;      // Contoh: Kebutuhan, Darurat, Konsumtif
  description: string;
  dueDate?: string;      // Tanggal jatuh tempo (YYYY-MM-DD)
  status: DebtStatus;
  createdAt: string;
  updatedAt?: string;
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

export interface UserProfile {
  name: string;
  avatar?: string;      // URI gambar profil
  coverImage?: string;  // URI gambar latar belakang (sidebar)
}

export interface AppState {
  // Financial data
  transactions: Transaction[];
  budgets: Budget[];
  savings: Savings[];
  savingsTransactions: SavingsTransaction[];
  notes: Note[];
  debts: Debt[];
  userProfile: UserProfile;
  customCategories: CustomCategory[]; // NEW: User-defined categories

  // Calculated totals
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

// BUG-03 FIX: Sinkronkan interface dengan implementasi di analytics.ts
export interface FinancialHealthScore {
  overallScore: number;
  category: string;
  color: string;
  factors: {
    savingsRate: {
      score: number;
      weight: number;
      status: "good" | "warning" | "poor";
    };
    budgetAdherence: {
      score: number;
      weight: number;
      status: "good" | "warning" | "poor";
    };
    expenseControl: {
      score: number;
      weight: number;
      status: "good" | "warning" | "poor";
    };
    goalProgress: {
      score: number;
      weight: number;
      status: "good" | "warning" | "poor";
    };
  };
  recommendations: string[];
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
  Notes: undefined;
  NoteForm: { noteId?: string };
  NoteDetail: { noteId: string };
  Debt: undefined;       // NEW
  AddDebt: {
    editMode?: boolean;
    debtData?: Debt;
  };                     // NEW
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
  ManageCategories: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
