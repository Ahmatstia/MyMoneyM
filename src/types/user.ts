// Type untuk User
export interface User {
  id: string;
  name: string;
  createdAt: string;
  avatar?: string; // Opsional: emoji seperti "👤"
  color?: string; // Opsional: warna tema
}

// Untuk navigasi
// export type RootStackParamList = {
//   Welcome: undefined;
//   UserSelect: undefined;
//   Home: undefined;
//   Transactions: undefined;
//   Budget: undefined;
//   Savings: undefined;
//   Analytics: undefined;
//   UserManager: undefined;
// };
