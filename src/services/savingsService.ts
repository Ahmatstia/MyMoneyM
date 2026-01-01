import { Savings, AppState } from "../types";
import { storageService } from "../utils/storage";
import { generateId } from "../utils/idGenerator";

export const savingsService = {
  async addSavings(
    savings: Omit<Savings, "id" | "createdAt">
  ): Promise<AppState> {
    const currentData = await storageService.loadData();

    const newSavings: Savings = {
      ...savings,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    const updatedSavings = [...currentData.savings, newSavings];

    const newData: AppState = {
      ...currentData,
      savings: updatedSavings,
    };

    await storageService.saveData(newData);
    return newData;
  },

  async updateSavings(id: string, amount: number): Promise<AppState> {
    const currentData = await storageService.loadData();

    const updatedSavings = currentData.savings.map((saving) => {
      if (saving.id === id) {
        return {
          ...saving,
          current: Math.min(saving.current + amount, saving.target),
        };
      }
      return saving;
    });

    const newData: AppState = {
      ...currentData,
      savings: updatedSavings,
    };

    await storageService.saveData(newData);
    return newData;
  },

  async deleteSavings(id: string): Promise<AppState> {
    const currentData = await storageService.loadData();

    const updatedSavings = currentData.savings.filter((s) => s.id !== id);

    const newData: AppState = {
      ...currentData,
      savings: updatedSavings,
    };

    await storageService.saveData(newData);
    return newData;
  },

  async getCompletedSavings(): Promise<Savings[]> {
    const currentData = await storageService.loadData();
    return currentData.savings.filter((s) => s.current >= s.target);
  },
};
