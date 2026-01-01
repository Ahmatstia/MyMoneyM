import { Transaction, AppState } from "../types";
import { storageService } from "../utils/storage";
import { calculateTotals } from "../utils/calculations";
import { generateId } from "../utils/idGenerator";

export const transactionService = {
  async addTransaction(
    transaction: Omit<Transaction, "id" | "createdAt">
  ): Promise<AppState> {
    const currentData = await storageService.loadData();

    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    const updatedTransactions = [newTransaction, ...currentData.transactions];
    const totals = calculateTotals(updatedTransactions);

    const newData: AppState = {
      ...currentData,
      transactions: updatedTransactions,
      ...totals,
    };

    await storageService.saveData(newData);
    return newData;
  },

  async deleteTransaction(id: string): Promise<AppState> {
    const currentData = await storageService.loadData();

    const updatedTransactions = currentData.transactions.filter(
      (t) => t.id !== id
    );
    const totals = calculateTotals(updatedTransactions);

    const newData: AppState = {
      ...currentData,
      transactions: updatedTransactions,
      ...totals,
    };

    await storageService.saveData(newData);
    return newData;
  },

  async getTransactionsByMonth(
    month?: number,
    year?: number
  ): Promise<Transaction[]> {
    const currentData = await storageService.loadData();

    if (!month && !year) {
      return currentData.transactions;
    }

    const targetMonth = month || new Date().getMonth();
    const targetYear = year || new Date().getFullYear();

    return currentData.transactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return (
        date.getMonth() === targetMonth && date.getFullYear() === targetYear
      );
    });
  },

  async getTransactionsByCategory(category: string): Promise<Transaction[]> {
    const currentData = await storageService.loadData();
    return currentData.transactions.filter((t) => t.category === category);
  },
};
