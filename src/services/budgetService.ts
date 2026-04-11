import { Budget, AppState, Transaction } from "../types";
import { storageService } from "../utils/storage";
import { calculateTotals } from "../utils/calculations";
import { generateId } from "../utils/idGenerator";

export const budgetService = {
  async addBudget(
    budget: Omit<Budget, "id" | "spent" | "createdAt">
  ): Promise<AppState> {
    const currentData = await storageService.loadData();

    const newBudget: Budget = {
      ...budget,
      id: generateId(),
      spent: 0,
      createdAt: new Date().toISOString(),
    };

    const updatedBudgets = [...currentData.budgets, newBudget];

    const newData: AppState = {
      ...currentData,
      budgets: updatedBudgets,
    };

    await storageService.saveData(newData);
    return newData;
  },

  // BUG-08 FIX: Filter transactions by budget date range
  async updateBudgetSpent(): Promise<AppState> {
    const currentData = await storageService.loadData();

    const updatedBudgets = currentData.budgets.map((budget) => {
      const categoryExpenses = currentData.transactions
        .filter((t) => {
          if (t.type !== "expense") return false;
          if (t.category !== budget.category) return false;
          // Only count transactions within budget date range
          return t.date >= budget.startDate && t.date <= budget.endDate;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      return { ...budget, spent: categoryExpenses };
    });

    const newData: AppState = {
      ...currentData,
      budgets: updatedBudgets,
    };

    await storageService.saveData(newData);
    return newData;
  },

  async deleteBudget(id: string): Promise<AppState> {
    const currentData = await storageService.loadData();

    const updatedBudgets = currentData.budgets.filter((b) => b.id !== id);

    const newData: AppState = {
      ...currentData,
      budgets: updatedBudgets,
    };

    await storageService.saveData(newData);
    return newData;
  },

  async getOverBudgetCategories(): Promise<Budget[]> {
    const currentData = await storageService.loadData();
    return currentData.budgets.filter((b) => b.spent > b.limit);
  },
};
