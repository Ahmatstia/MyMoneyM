export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: "monthly" | "weekly";
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

export type RootStackParamList = {
  Home: undefined;
  Transactions: undefined;
  Budget: undefined;
  Savings: undefined;
  // menambahkan parameter untuk edit mode
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
