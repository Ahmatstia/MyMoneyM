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

// Navigation types - SIMPLIFIED VERSION
export type RootStackParamList = {
  Home: undefined;
  Transactions: undefined;
  Budget: undefined;
  Savings: undefined;
  AddTransaction: {
    editMode?: boolean;
    transactionData?: Transaction;
  };
  AddBudget: undefined;
  AddSavings: undefined;
};
