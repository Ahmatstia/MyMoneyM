import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "../types";

const STORAGE_KEY = "mymoney_data";

const defaultAppState: AppState = {
  transactions: [],
  budgets: [],
  savings: [],
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
};

export const storageService = {
  async saveData(data: AppState): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving data:", error);
    }
  },

  async loadData(): Promise<AppState> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return defaultAppState;
    } catch (error) {
      console.error("Error loading data:", error);
      return defaultAppState;
    }
  },

  async clearData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing data:", error);
    }
  },
};
