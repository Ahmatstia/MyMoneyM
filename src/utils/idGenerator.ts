// File: src/utils/idGenerator.ts
// Simple ID generator untuk React Native (tanpa dependencies)
export const generateId = (): string => {
  return "id-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
};

// Untuk generate ID dengan prefix
export const generateUniqueId = (prefix: string = "id"): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}-${timestamp}-${random}`;
};

// ID khusus untuk tipe tertentu
export const generateTransactionId = (): string => {
  return `trx-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

export const generateBudgetId = (): string => {
  return `budget-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

export const generateSavingsId = (): string => {
  return `savings-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};
