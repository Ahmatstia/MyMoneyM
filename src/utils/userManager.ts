import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types";

const USERS_KEY = "@mymoney_users";
const CURRENT_USER_KEY = "@mymoney_current_user";

// Helper untuk generate user ID
export const generateUserId = (): string => {
  return `user_${Date.now()}`;
};

// Simpan semua user ke storage
export const saveUsers = async (users: User[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error("Error saving users:", error);
    throw error;
  }
};

// Ambil semua user dari storage
export const loadUsers = async (): Promise<User[]> => {
  try {
    const usersJson = await AsyncStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch (error) {
    console.error("Error loading users:", error);
    return [];
  }
};

// Set user yang sedang aktif
export const setCurrentUser = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Error setting current user:", error);
    throw error;
  }
};

// Ambil user yang sedang aktif
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// Buat user baru
export const createUser = async (name: string): Promise<User> => {
  const existingUsers = await loadUsers();

  const newUser: User = {
    id: generateUserId(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
    avatar: "👤",
    color: "#4F46E5",
  };

  const updatedUsers = [...existingUsers, newUser];
  await saveUsers(updatedUsers);

  return newUser;
};

// Cek apakah sudah ada user
export const hasUsers = async (): Promise<boolean> => {
  const users = await loadUsers();
  return users.length > 0;
};
