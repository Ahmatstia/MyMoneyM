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

  async updateBudgetSpent(): Promise<AppState> {
    const currentData = await storageService.loadData();

    const updatedBudgets = currentData.budgets.map((budget) => {
      const categoryExpenses = currentData.transactions
        .filter((t) => t.type === "expense" && t.category === budget.category)
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
