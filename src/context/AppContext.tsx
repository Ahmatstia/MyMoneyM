import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import { AppState as RNAppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AppState,
  Transaction,
  Budget,
  Savings,
  SavingsTransaction,
  Note,
  Debt,
  UserProfile,
  CustomCategory,
  RecurringTransaction,
  Wallet,
  DailyPlan,
} from "../types";
import { storageService, createDefaultWallet } from "../utils/storage";
import { clearAllPersistedFilesAsync } from "../utils/imageStorage";
import {
  calculateTotals,
  calculateWalletBalances,
  calculatePartitionedBalances,
  DEFAULT_WALLET_ID,
  formatToDateKey,
  safeNumber,
} from "../utils/calculations";
import { getJakartaDateKey, calculateDailyCheckInStreak } from "../utils/dailyCheckIn";
import { gamificationBus } from "../utils/gamificationBus";
import {
  generateTransactionId,
  generateBudgetId,
  generateSavingsId,
  generateId,
} from "../utils/idGenerator";
import { notificationService } from "../utils/notifications";
import {
  isValidDateString,
  validateNote,
  validateAndSetupBudget,
  validateSavings,
  validateTransaction,
  validateSavingsTransaction,
  updateBudgetsFromTransactions,
} from "../utils/validators";
import {
  processRecurringTransactions,
  calculateInitialRunDate,
} from "../utils/recurring";
import { isImageFileExisting } from "../utils/imageStorage";
import { ALL_SYSTEM_CATEGORIES } from "../constants/categories";

interface AppContextType {
  state: AppState;
  isLoading: boolean;
  globalLoading: {
    visible: boolean;
    message?: string;
  };
  setLoading: (visible: boolean, message?: string) => void;

  // 🔹 TRANSACTIONS
  addTransaction: (
    transaction: Omit<Transaction, "id" | "createdAt">,
    replaceDailyPlan?: boolean,
  ) => Promise<void>;
  editTransaction: (
    id: string,
    updates: Partial<Transaction>,
    replaceDailyPlan?: boolean,
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // 🔹 WALLETS
  addWallet: (
    wallet: Omit<Wallet, "id" | "createdAt" | "balance">,
  ) => Promise<void>;
  editWallet: (id: string, updates: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  reconcileWallet: (
    walletId: string,
    actualBalance: number,
    note?: string,
  ) => Promise<void>;

  // 🔹 BUDGETS
  addBudget: (
    budget: Omit<Budget, "id" | "spent" | "createdAt" | "lastResetDate">,
  ) => Promise<void>;
  editBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  // 🔹 SAVINGS
  addSavings: (savings: Omit<Savings, "id" | "createdAt">) => Promise<void>;
  editSavings: (id: string, updates: Partial<Savings>) => Promise<void>;
  deleteSavings: (id: string) => Promise<void>;
  addSavingsTransaction: (
    savingsId: string,
    transaction: {
      type: "deposit" | "withdrawal";
      amount: number;
      date: string;
      note?: string;
      walletId?: string;
    },
    syncWithCash?: boolean,
    walletId?: string,
  ) => Promise<void>;
  getSavingsTransactions: (savingsId: string) => SavingsTransaction[];

  // 🔹 NOTES
  addNote: (
    note: Omit<Note, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  editNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  getNote: (id: string) => Note | undefined;

  // 🔹 DEBTS
  addDebt: (
    debt: Omit<Debt, "id" | "createdAt" | "updatedAt">,
    syncWithCash?: boolean,
    walletId?: string,
  ) => Promise<void>;
  editDebt: (id: string, updates: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  payDebt: (id: string, amount: number, walletId?: string) => Promise<void>;

  // 🔹 CUSTOM CATEGORIES
  addCustomCategory: (
    category: Omit<CustomCategory, "id" | "createdAt" | "isCustom">,
  ) => Promise<void>;
  editCustomCategory: (
    id: string,
    updates: Partial<Omit<CustomCategory, "id" | "isCustom" | "createdAt">>,
  ) => Promise<void>;
  deleteCustomCategory: (id: string) => Promise<void>;

  // 🔹 RECURRING TRANSACTIONS
  addRecurringTransaction: (
    recurring: Omit<RecurringTransaction, "id" | "createdAt" | "nextRunDate"> & {
      nextRunDate?: string;
    },
  ) => Promise<void>;
  editRecurringTransaction: (
    id: string,
    updates: Partial<RecurringTransaction>,
  ) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  toggleRecurringTransaction: (id: string) => Promise<void>;
  processRecurringNow: () => Promise<void>;

  // 🔹 NOTIFICATIONS
  triggerNotificationCheck: () => Promise<void>;

  // 🔹 SYSTEM
  refreshData: () => Promise<void>;
  importBackupData: (importedData: any) => Promise<AppState>;
  clearAllData: () => Promise<void>;
  debugStorage: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updatePaydayCutoff: (day: number, syncRecurringSalary?: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultAppState: AppState = {
  transactions: [],
  wallets: [createDefaultWallet(0)],
  dailyPlans: [],
  budgets: [],
  savings: [],
  savingsTransactions: [],
  notes: [],
  debts: [],
  recurringTransactions: [],
  customCategories: [],
  dailyCheckIns: [],
  userProfile: {
    name: "MyMoney",
  },
  paydayCutoff: 1,
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
  operationalBalance: 0,
  savingsBalance: 0,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AppState>(defaultAppState);
  const [isLoading, setIsLoading] = useState(true);
  const [globalLoading, setGlobalLoadingState] = useState<{
    visible: boolean;
    message?: string;
  }>({ visible: false });
  const isMounted = useRef(true);
  // RISK-001 FIX: Keep a fresh reference to state so async callbacks
  // (e.g. 5-min notification interval) always use current data, not stale closure.
  const stateRef = useRef<AppState>(state);
  useEffect(() => {
    stateRef.current = state;
  });

  const setLoading = (visible: boolean, message?: string) => {
    setGlobalLoadingState({ visible, message });
  };

  // ========== LOAD INITIAL DATA ==========
  useEffect(() => {
    loadInitialData();

    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadInitialData = async () => {
    if (!isMounted.current) return;

    try {
      const appData = await storageService.loadData();

      // Pastikan semua properti ada termasuk notes dan recurring
      let completeAppData: AppState = {
        ...defaultAppState,
        ...appData,
        notes: appData.notes || [],
        debts: appData.debts || [],
        recurringTransactions: appData.recurringTransactions || [],
        customCategories: appData.customCategories || [],
        dailyPlans: appData.dailyPlans || [],
        userProfile: appData.userProfile || defaultAppState.userProfile,
        paydayCutoff: appData.paydayCutoff || 1,
      };

      // Migrasi Nama Default Otomatis (Hapus paksa nama lama yang tersimpan)
      const currentName = completeAppData.userProfile.name
        ?.trim()
        .toLowerCase();
      const oldDefaults = [
        "pengguna mymoney",
        "sobat cuan",
        "pengguna",
        "my money",
      ];

      if (!currentName || oldDefaults.includes(currentName)) {
        completeAppData.userProfile.name = "MyMoney";
      }

      // Bersihkan URI gambar profil jika filenya sudah terhapus oleh OS di cache lama
      if (
        completeAppData.userProfile.avatar &&
        !isImageFileExisting(completeAppData.userProfile.avatar)
      ) {
        completeAppData.userProfile.avatar = undefined;
      }
      if (
        completeAppData.userProfile.coverImage &&
        !isImageFileExisting(completeAppData.userProfile.coverImage)
      ) {
        completeAppData.userProfile.coverImage = undefined;
      }

      // Auto-Migration: Menyelamatkan kategori yang sudah pernah digunakan pengguna pada transaksi/anggaran lama
      // agar tidak hilang dari daftar pilihan kategori kustom saat beralih ke Zero-Default.
      const migrationCatKey = "@mymoney_legacy_categories_migrated_v1";
      const isCatMigrated = await AsyncStorage.getItem(migrationCatKey);
      if (!isCatMigrated) {
        const existingCatNames = new Set(
          (completeAppData.customCategories || []).map((c) => c.name.toLowerCase())
        );
        const usedCategoriesInTransactions = new Set<string>();

        // 1. Ambil dari riwayat transaksi
        (completeAppData.transactions || []).forEach((t) => {
          if (t.category && t.category.trim()) {
            usedCategoriesInTransactions.add(t.category.trim());
          }
        });
        // 2. Ambil dari anggaran
        (completeAppData.budgets || []).forEach((b) => {
          if (b.category && b.category.trim()) {
            usedCategoriesInTransactions.add(b.category.trim());
          }
        });
        // 3. Ambil dari transaksi rutin
        (completeAppData.recurringTransactions || []).forEach((r) => {
          if (r.category && r.category.trim()) {
            usedCategoriesInTransactions.add(r.category.trim());
          }
        });

        let hasNewAdoptedCategories = false;
        const adoptedCategories: CustomCategory[] = [
          ...(completeAppData.customCategories || []),
        ];

        usedCategoriesInTransactions.forEach((catName) => {
          if (!existingCatNames.has(catName.toLowerCase())) {
            const preset = ALL_SYSTEM_CATEGORIES.find(
              (p) =>
                p.name.toLowerCase() === catName.toLowerCase() ||
                (catName.toLowerCase() === "gaji" && p.id === "pemasukan")
            );

            adoptedCategories.push({
              id: `cat_migrated_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              name: catName.toLowerCase() === "gaji" ? "Pemasukan" : catName,
              icon: preset ? preset.icon : "pricetag-outline",
              color: preset ? preset.color : "#8B5CF6",
              isCustom: true,
              createdAt: new Date().toISOString(),
            });
            existingCatNames.add(catName.toLowerCase());
            hasNewAdoptedCategories = true;
          }
        });

        if (hasNewAdoptedCategories) {
          completeAppData.customCategories = adoptedCategories;
          await storageService.saveData(completeAppData);
        }
        await AsyncStorage.setItem(migrationCatKey, "true");
      }

      // Check & process any due recurring transactions upon startup
      const recurringResult = processRecurringTransactions(completeAppData);
      if (recurringResult.executedCount > 0) {
        const updatedBudgets = updateBudgetsFromTransactions(
          recurringResult.updatedState.transactions,
          recurringResult.updatedState.budgets,
        );
        recurringResult.updatedState.budgets = updatedBudgets;
        completeAppData = recurringResult.updatedState;
        await storageService.saveData(completeAppData);
      }

      if (isMounted.current) {
        setState(completeAppData);
      }
    } catch (error) {
      if (isMounted.current) {
        setState(defaultAppState);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  // ========== NOTIFICATIONS SETUP ==========
  const notificationsInitialized = useRef(false);

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Only initialize once when loading completes
        if (!isLoading && !notificationsInitialized.current) {
          notificationsInitialized.current = true;

          // Request permission
          await notificationService.registerForPushNotificationsAsync();

          // Initialize notifications with current state — this schedules daily reminders
          // and checks immediate alerts ONCE on app startup
          await notificationService.initialize(state);
        }
      } catch (error) {}
    };

    setupNotifications();
  }, [isLoading]);



  // ========== SYSTEM FUNCTIONS ==========
  const refreshData = async () => {
    try {
      const appData = await storageService.loadData();
      const completeAppData: AppState = {
        ...defaultAppState,
        ...appData,
        notes: appData.notes || [],
        debts: appData.debts || [],
        recurringTransactions: appData.recurringTransactions || [],
        customCategories: appData.customCategories || [],
        dailyPlans: appData.dailyPlans || [],
        userProfile: appData.userProfile || defaultAppState.userProfile,
      };
      if (isMounted.current) {
        setState(completeAppData);
      }
    } catch (error) {}
  };

  const importBackupData = async (importedData: any): Promise<AppState> => {
    // 1. Set migration flag so loadData will never overwrite with old storage keys
    await AsyncStorage.setItem("@mymoney_migrated_v5", "true");

    // 2. Validate, calculate, and save data to storage
    await storageService.saveData(importedData);

    // 3. Load the structured, validated AppState
    const appData = await storageService.loadData();
    const completeAppData: AppState = {
      ...defaultAppState,
      ...appData,
      notes: appData.notes || [],
      debts: appData.debts || [],
      recurringTransactions: appData.recurringTransactions || [],
      customCategories: appData.customCategories || [],
      dailyPlans: appData.dailyPlans || [],
      userProfile: appData.userProfile || defaultAppState.userProfile,
    };

    // 4. Force synchronous update to React state and ref
    stateRef.current = completeAppData;
    setState(completeAppData);

    // 5. Update notifications and gamification
    await notificationService.updateNotifications(completeAppData);
    gamificationBus.emit({ type: "check_milestones" });

    return completeAppData;
  };

  const clearAllData = async () => {
    try {
      await storageService.clearData();
      await clearAllPersistedFilesAsync();
      await notificationService.cancelAllNotifications();
      gamificationBus.reset();
      stateRef.current = defaultAppState;
      if (isMounted.current) {
        setState(defaultAppState);
      }
    } catch (error) {
      console.warn("[clearAllData] error:", error);
    }
  };

  const debugStorage = async () => {
    await storageService.debugStorage();
  };

  const triggerNotificationCheck = async () => {
    // Use stateRef.current so this always sees the latest state,
    // not the stale closure captured when the 5-min interval was set up.
    await notificationService.checkImmediateAlerts(stateRef.current);
  };

  // ========== DAILY CHECK-IN & RECURRING LISTENERS ==========
  // RISK-002 FIX: Use functional setState so we always read the freshest
  // dailyCheckIns — prevents double check-in from stale closure reads.
  const checkInToday = async () => {
    const todayKey = getJakartaDateKey();
    let didUpdate = false;
    let savedState: AppState | null = null;

    setState((prevState) => {
      if (prevState.dailyCheckIns && prevState.dailyCheckIns.includes(todayKey)) {
        return prevState; // already checked in — no change
      }
      const updatedCheckIns = [...(prevState.dailyCheckIns || []), todayKey];
      const newState: AppState = { ...prevState, dailyCheckIns: updatedCheckIns };
      didUpdate = true;
      savedState = newState;
      return newState;
    });

    // Persist only when we actually made a change
    if (didUpdate && savedState) {
      await storageService.saveData(savedState);
      gamificationBus.award("daily_checkin");

      const streak = calculateDailyCheckInStreak(
        (savedState as AppState).dailyCheckIns || []
      );
      if (streak === 7) {
        gamificationBus.award("streak_7");
      } else if (streak === 30) {
        gamificationBus.award("streak_30");
      }
    }
  };

  const processRecurringNow = async () => {
    const currentState = stateRef.current;
    const { updatedState, executedCount } = processRecurringTransactions(currentState);
    if (executedCount > 0) {
      const updatedBudgets = updateBudgetsFromTransactions(
        updatedState.transactions,
        updatedState.budgets,
      );
      const finalState = {
        ...updatedState,
        budgets: updatedBudgets,
      };
      if (isMounted.current) {
        setState(finalState);
      }
      await storageService.saveData(finalState);
      await notificationService.updateNotifications(finalState);
      await notificationService.sendNotification({
        title: "⚡ Transaksi Rutin Diproses",
        body: `${executedCount} transaksi otomatis telah berhasil dicatat.`,
        data: { type: "RECURRING_PROCESSED" },
      });
    }
  };

  // Listen for app foreground events to trigger daily check-in and recurring processing
  useEffect(() => {
    if (isLoading) return;

    const subscription = RNAppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "active") {
          checkInToday();
          processRecurringNow();
        }
      },
    );

    // Check immediately when loading completes (once)
    checkInToday();
    processRecurringNow();

    return () => {
      subscription.remove();
    };
  // Only re-run when isLoading changes (not on every dailyCheckIns update)
  }, [isLoading]);

  // Centralized helper to recompute totals, budgets, wallets, and partitioned balances consistently
  const computeFullState = (
    baseState: AppState,
    updatedTransactions: Transaction[],
    overrides: Partial<AppState> = {},
  ): AppState => {
    const totals = calculateTotals(updatedTransactions);
    const updatedBudgets = updateBudgetsFromTransactions(
      updatedTransactions,
      overrides.budgets || baseState.budgets,
    );
    const walletsToCalculate = overrides.wallets || baseState.wallets || [];
    const updatedWallets = calculateWalletBalances(
      walletsToCalculate,
      updatedTransactions,
    );
    const partitioned = calculatePartitionedBalances(updatedWallets);

    return {
      ...baseState,
      ...overrides,
      transactions: updatedTransactions,
      wallets: updatedWallets,
      budgets: updatedBudgets,
      ...totals,
      balance: updatedWallets.length > 0 ? partitioned.netWorth : totals.balance,
      operationalBalance: partitioned.operationalBalance,
      savingsBalance: partitioned.savingsBalance,
    };
  };

  // ========== TRANSACTIONS FUNCTIONS ==========
  const addTransaction = async (
    transaction: Omit<Transaction, "id" | "createdAt">,
    replaceDailyPlan: boolean = false,
  ) => {
    const defaultWalletId =
      state.wallets?.find((w) => w.isDefault)?.id ||
      state.wallets?.[0]?.id ||
      DEFAULT_WALLET_ID;

    const cycleDays =
      transaction.type === "income" &&
      typeof transaction.cyclePeriod === "number" &&
      transaction.cyclePeriod > 0
        ? Math.floor(transaction.cyclePeriod)
        : undefined;
    const planStartDate = (transaction.date || getJakartaDateKey()).slice(0, 10);
    const planEnd = new Date(`${planStartDate}T12:00:00`);
    if (cycleDays) planEnd.setDate(planEnd.getDate() + cycleDays - 1);
    const planEndDate = cycleDays
      ? formatToDateKey(planEnd)
      : undefined;
    const conflicts = cycleDays && planEndDate
      ? state.dailyPlans.filter(
          (plan) =>
            plan.walletId === (transaction.walletId || defaultWalletId) &&
            plan.isActive &&
            plan.endDate >= planStartDate &&
            plan.startDate <= planEndDate,
        )
      : [];
    if (conflicts.length && !replaceDailyPlan) {
      throw new Error("DAILY_PLAN_CONFLICT");
    }

    // cyclePeriod hanya input form untuk membuat DailyPlan; jangan simpan aturan lama
    // karena ia membuat filter global mencampur rekening yang berbeda.
    const { cyclePeriod: _cyclePeriod, ...transactionData } = transaction;
    const newTransaction: Transaction = {
      ...transactionData,
      id: generateTransactionId(),
      createdAt: new Date().toISOString(),
      walletId: transaction.walletId || defaultWalletId,
    };

    const updatedTransactions = [newTransaction, ...state.transactions];
    const now = new Date().toISOString();
    const dailyPlans = cycleDays && planEndDate
      ? [
          ...state.dailyPlans.map((plan) =>
            conflicts.some((conflict) => conflict.id === plan.id)
              ? { ...plan, isActive: false, endedAt: now }
              : plan,
          ),
          {
            id: `daily_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            walletId: transaction.walletId || defaultWalletId,
            amount: safeNumber(transaction.amount),
            sourceTransactionId: newTransaction.id,
            startDate: planStartDate,
            endDate: planEndDate,
            isActive: true,
            createdAt: now,
          },
        ]
      : state.dailyPlans;
    const newState = computeFullState(state, updatedTransactions, { dailyPlans });

    setState(newState);
    await storageService.saveData(newState);
    gamificationBus.award("transaction");

    // Send notifications
    await notificationService.updateNotifications(newState);

    // Specific notification for large transaction
    if (transaction.amount >= 1000000) {
      await notificationService.sendNotification({
        title: "💰 Transaksi Besar",
        body: `Transaksi ${
          transaction.type === "income"
            ? "pemasukan"
            : transaction.type === "transfer"
              ? "transfer"
              : "pengeluaran"
        } Rp ${transaction.amount.toLocaleString("id-ID")} tercatat`,
        data: { type: "NEW_TRANSACTION", transactionId: newTransaction.id },
      });
    }
  };

  const editTransaction = async (
    id: string,
    updates: Partial<Transaction>,
    replaceDailyPlan = false,
  ) => {
    const existing = state.transactions.find((transaction) => transaction.id === id);
    if (!existing) return;
    const hasCycleUpdate = Object.prototype.hasOwnProperty.call(updates, "cyclePeriod");
    const nextTransaction = { ...existing, ...updates };
    let dailyPlans = state.dailyPlans;

    if (hasCycleUpdate) {
      const cycleDays =
        nextTransaction.type === "income" &&
        typeof updates.cyclePeriod === "number" &&
        updates.cyclePeriod > 0
          ? Math.floor(updates.cyclePeriod)
          : undefined;
      const relatedPlans = state.dailyPlans.filter((plan) => plan.sourceTransactionId === id);
      const now = new Date().toISOString();

      if (!cycleDays) {
        dailyPlans = state.dailyPlans.map((plan) =>
          plan.sourceTransactionId === id && plan.isActive
            ? { ...plan, isActive: false, endedAt: now }
            : plan,
        );
      } else {
        const startDate = (nextTransaction.date || getJakartaDateKey()).slice(0, 10);
        const end = new Date(`${startDate}T12:00:00`);
        end.setDate(end.getDate() + cycleDays - 1);
        const endDate = formatToDateKey(end);
        const walletId = nextTransaction.walletId || DEFAULT_WALLET_ID;
        const conflicts = state.dailyPlans.filter(
          (plan) =>
            !relatedPlans.some((related) => related.id === plan.id) &&
            plan.walletId === walletId &&
            plan.isActive &&
            plan.endDate >= startDate &&
            plan.startDate <= endDate,
        );
        if (conflicts.length && !replaceDailyPlan) throw new Error("DAILY_PLAN_CONFLICT");

        const plan = {
          id: relatedPlans[0]?.id || `daily_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          walletId,
          amount: safeNumber(nextTransaction.amount),
          sourceTransactionId: id,
          startDate,
          endDate,
          isActive: true,
          createdAt: relatedPlans[0]?.createdAt || now,
        };
        const basePlans = replaceDailyPlan
          ? state.dailyPlans.map((p) =>
              conflicts.some((c) => c.id === p.id)
                ? { ...p, isActive: false, endedAt: now }
                : p,
            )
          : state.dailyPlans;
        dailyPlans = relatedPlans.length
          ? basePlans.map((item) =>
              item.id === relatedPlans[0].id ? { ...item, ...plan, endedAt: undefined } : item,
            )
          : [...basePlans, plan];
      }
    }

    const updatedTransactions = state.transactions.map((t) =>
      t.id === id ? { ...nextTransaction, cyclePeriod: undefined } : t,
    );

    const newState = computeFullState(state, updatedTransactions, { dailyPlans });

    setState(newState);
    await storageService.saveData(newState);
    await notificationService.updateNotifications(newState);
  };

  const deleteTransaction = async (id: string) => {
    const transactionToDelete = state.transactions.find((t) => t.id === id);
    if (!transactionToDelete) {
      return;
    }

    const updatedTransactions = state.transactions.filter((t) => t.id !== id);
    const dailyPlans = state.dailyPlans.map((plan) =>
      plan.sourceTransactionId === id && plan.isActive
        ? { ...plan, isActive: false, endedAt: new Date().toISOString() }
        : plan,
    );
    const newState = computeFullState(state, updatedTransactions, { dailyPlans });

    setState(newState);
    await storageService.saveData(newState);
    await notificationService.updateNotifications(newState);
  };

  // ========== WALLETS FUNCTIONS ==========
  const addWallet = async (
    walletData: Omit<Wallet, "id" | "createdAt" | "balance">,
  ) => {
    const newWalletId = `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newWallet: Wallet = {
      ...walletData,
      id: newWalletId,
      balance: safeNumber(walletData.initialBalance),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let updatedWalletsList = [...(state.wallets || [])];
    if (newWallet.isDefault) {
      updatedWalletsList = updatedWalletsList.map((w) => ({
        ...w,
        isDefault: false,
      }));
    }
    updatedWalletsList.push(newWallet);

    const newState = computeFullState(state, state.transactions, {
      wallets: updatedWalletsList,
    });

    setState(newState);
    await storageService.saveData(newState);
  };

  const editWallet = async (id: string, updates: Partial<Wallet>) => {
    let updatedWalletsList = (state.wallets || []).map((w) => {
      if (w.id === id) {
        return {
          ...w,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      if (updates.isDefault) {
        return { ...w, isDefault: false };
      }
      return w;
    });

    const newState = computeFullState(state, state.transactions, {
      wallets: updatedWalletsList,
    });

    setState(newState);
    await storageService.saveData(newState);
  };

  const deleteWallet = async (id: string) => {
    const wallets = state.wallets || [];
    if (wallets.length <= 1) {
      throw new Error("Tidak dapat menghapus dompet terakhir");
    }

    const targetWallet = wallets.find((w) => w.id === id);
    if (!targetWallet) return;

    const hasHistory = state.transactions.some(
      (tx) => tx.walletId === id || tx.toWalletId === id,
    );
    const hasPlan = state.dailyPlans.some((plan) => plan.walletId === id);
    if (hasHistory || hasPlan) {
      throw new Error(
        "Rekening yang memiliki transaksi atau batas aktif tidak dapat dihapus. Hapus atau pindahkan riwayatnya terlebih dahulu.",
      );
    }

    let remainingWallets = wallets.filter((w) => w.id !== id);

    if (targetWallet.isDefault && remainingWallets.length > 0) {
      remainingWallets[0] = { ...remainingWallets[0], isDefault: true };
    }

    const newState = computeFullState(state, state.transactions, {
      wallets: remainingWallets,
    });

    setState(newState);
    await storageService.saveData(newState);
  };

  const reconcileWallet = async (
    walletId: string,
    actualBalance: number,
    note?: string,
  ) => {
    const targetWallet = (state.wallets || []).find((w) => w.id === walletId);
    if (!targetWallet) return;

    const currentBalance = safeNumber(targetWallet.balance);
    const diff = safeNumber(actualBalance) - currentBalance;

    if (diff === 0) return;

    const isSurplus = diff > 0;
    const defaultWalletId =
      state.wallets?.find((w) => w.isDefault)?.id ||
      state.wallets?.[0]?.id ||
      DEFAULT_WALLET_ID;

    const adjustmentTx: Transaction = {
      id: generateTransactionId(),
      amount: Math.abs(diff),
      type: isSurplus ? "income" : "expense",
      category: "Koreksi Saldo",
      description:
        note?.trim() ||
        (isSurplus
          ? `Penyesuaian Saldo Kas Masuk: ${targetWallet.name}`
          : `Penyesuaian Selisih Saldo Kas: ${targetWallet.name}`),
      date: getJakartaDateKey(),
      createdAt: new Date().toISOString(),
      walletId: walletId || defaultWalletId,
    };

    const updatedTransactions = [adjustmentTx, ...state.transactions];
    const newState = computeFullState(state, updatedTransactions);

    setState(newState);
    await storageService.saveData(newState);
    await notificationService.updateNotifications(newState);
  };

  // ========== BUDGETS FUNCTIONS ==========
  const addBudget = async (
    budget: Omit<Budget, "id" | "spent" | "createdAt" | "lastResetDate">,
  ) => {
    const newBudget: Budget = {
      ...budget,
      id: generateBudgetId(),
      spent: 0,
      createdAt: new Date().toISOString(),
      lastResetDate: new Date().toISOString(),
    };

    const updatedBudgets = updateBudgetsFromTransactions(state.transactions, [
      ...state.budgets,
      newBudget,
    ]);

    const newState: AppState = {
      ...state,
      budgets: updatedBudgets,
    };

    setState(newState);
    await storageService.saveData(newState);
    gamificationBus.award("budget_created");

    // Send notification
    await notificationService.updateNotifications(newState);
    await notificationService.sendNotification({
      title: "📊 Budget Baru",
      body: `Budget ${budget.category} Rp ${budget.limit.toLocaleString(
        "id-ID",
      )} dibuat`,
      data: { type: "NEW_BUDGET", budgetId: newBudget.id },
    });
  };

  const editBudget = async (id: string, updates: Partial<Budget>) => {
    const updatedBudgets = state.budgets.map((b) =>
      b.id === id ? { ...b, ...updates } : b,
    );

    const recalculated = updateBudgetsFromTransactions(
      state.transactions,
      updatedBudgets,
    );

    const newState: AppState = {
      ...state,
      budgets: recalculated,
    };

    setState(newState);
    await storageService.saveData(newState);
    await notificationService.updateNotifications(newState);
  };

  const deleteBudget = async (id: string) => {
    const newState: AppState = {
      ...state,
      budgets: state.budgets.filter((b) => b.id !== id),
    };

    setState(newState);
    await storageService.saveData(newState);
    await notificationService.updateNotifications(newState);
  };

  // ========== SAVINGS FUNCTIONS ==========
  const addSavings = async (savings: Omit<Savings, "id" | "createdAt">) => {
    const newSavings: Savings = {
      ...savings,
      id: generateSavingsId(),
      createdAt: new Date().toISOString(),
    };

    let initialTransaction: SavingsTransaction | null = null;
    if (safeNumber(newSavings.current) > 0) {
      initialTransaction = {
        id: generateId(),
        savingsId: newSavings.id,
        type: "initial",
        amount: safeNumber(newSavings.current),
        date: getJakartaDateKey(),
        note: "Saldo awal",
        previousBalance: 0,
        newBalance: safeNumber(newSavings.current),
        createdAt: new Date().toISOString(),
      };
    }

    const newState: AppState = {
      ...state,
      savings: [...state.savings, newSavings],
      savingsTransactions: initialTransaction
        ? [...state.savingsTransactions, initialTransaction]
        : state.savingsTransactions,
    };

    setState(newState);
    await storageService.saveData(newState);
    gamificationBus.award("savings_created");

    // Send notification
    await notificationService.updateNotifications(newState);
    await notificationService.sendNotification({
      title: "🏦 Tabungan Baru",
      body: `Tabungan "${
        savings.name
      }" dengan target Rp ${savings.target.toLocaleString("id-ID")} dibuat`,
      data: { type: "NEW_SAVINGS", savingsId: newSavings.id },
    });
  };

  const editSavings = async (id: string, updates: Partial<Savings>) => {
    const updatedSavings = state.savings.map((s) =>
      s.id === id ? { ...s, ...updates } : s,
    );

    const newState: AppState = {
      ...state,
      savings: updatedSavings,
    };

    setState(newState);
    await storageService.saveData(newState);
    await notificationService.updateNotifications(newState);
  };

  const deleteSavings = async (id: string) => {
    const newState: AppState = {
      ...state,
      savings: state.savings.filter((s) => s.id !== id),
      savingsTransactions: state.savingsTransactions.filter(
        (st) => st.savingsId !== id,
      ),
    };

    setState(newState);
    await storageService.saveData(newState);
    await notificationService.updateNotifications(newState);
  };

  const addSavingsTransaction = async (
    savingsId: string,
    transaction: {
      type: "deposit" | "withdrawal";
      amount: number;
      date: string;
      note?: string;
      walletId?: string;
    },
    syncWithCash: boolean = false,
    walletId?: string,
  ) => {
    const saving = state.savings.find((s) => s.id === savingsId);
    if (!saving) throw new Error("Tabungan tidak ditemukan");

    const previousBalance = safeNumber(saving.current);
    const amount = safeNumber(transaction.amount);

    if (transaction.type === "withdrawal" && amount > previousBalance) {
      throw new Error("Saldo tidak mencukupi");
    }

    const newBalance =
      transaction.type === "deposit"
        ? previousBalance + amount
        : previousBalance - amount;

    const updatedSavings = state.savings.map((s) =>
      s.id === savingsId ? { ...s, current: newBalance } : s,
    );

    const newTransaction: SavingsTransaction = {
      id: generateId(),
      savingsId,
      type: transaction.type,
      amount,
      date: transaction.date,
      note: transaction.note,
      previousBalance,
      newBalance,
      createdAt: new Date().toISOString(),
    };

    let updatedTransactions = state.transactions;
    const targetWalletId =
      transaction.walletId ||
      walletId ||
      state.wallets?.find((w) => w.isDefault)?.id ||
      DEFAULT_WALLET_ID;

    if (syncWithCash && amount > 0) {
      const isDeposit = transaction.type === "deposit";
      const newCashTransaction: Transaction = {
        id: generateTransactionId(),
        amount: amount,
        type: isDeposit ? "expense" : "income",
        category: "Tabungan",
        description: isDeposit
          ? `Setor Tabungan: ${saving.name}`
          : `Tarik Tabungan: ${saving.name}`,
        date: transaction.date || getJakartaDateKey(),
        createdAt: new Date().toISOString(),
        walletId: targetWalletId,
      };
      updatedTransactions = [newCashTransaction, ...state.transactions];
    }

    const baseState: AppState = {
      ...state,
      savings: updatedSavings,
      savingsTransactions: [...state.savingsTransactions, newTransaction],
    };

    const newState = computeFullState(baseState, updatedTransactions);

    setState(newState);
    await storageService.saveData(newState);
    await notificationService.updateNotifications(newState);

    if (transaction.type === "deposit") {
      gamificationBus.award("savings_deposit");
      if (
        saving.target > 0 &&
        newBalance >= saving.target &&
        previousBalance < saving.target
      ) {
        gamificationBus.award("savings_completed");
      }
    }
  };

  const getSavingsTransactions = (savingsId: string): SavingsTransaction[] => {
    return state.savingsTransactions
      .filter((st) => st.savingsId === savingsId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // ========== NOTES FUNCTIONS ==========
  const addNote = async (
    note: Omit<Note, "id" | "createdAt" | "updatedAt">,
  ) => {
    const newNote: Note = validateNote({
      ...note,
      id: generateId(),
      createdAt: new Date().toISOString(),
    });

    const updatedNotes = [newNote, ...state.notes];
    const newState: AppState = {
      ...state,
      notes: updatedNotes,
    };

    setState(newState);
    await storageService.saveData(newState);

    // Send notification
    await notificationService.updateNotifications(newState);
    await notificationService.sendNotification({
      title: "📔 Catatan Baru",
      body: `Catatan "${note.title.substring(0, 30)}${
        note.title.length > 30 ? "..." : ""
      }" disimpan`,
      data: { type: "NEW_NOTE", noteId: newNote.id },
    });
  };

  const editNote = async (id: string, updates: Partial<Note>) => {
    const noteToUpdate = state.notes.find((n) => n.id === id);
    if (!noteToUpdate) {
      return;
    }

    const updatedNote: Note = validateNote({
      ...noteToUpdate,
      ...updates,
      id,
    });

    const updatedNotes = state.notes.map((n) =>
      n.id === id ? updatedNote : n,
    );

    const newState: AppState = {
      ...state,
      notes: updatedNotes,
    };

    setState(newState);
    await storageService.saveData(newState);
    await notificationService.updateNotifications(newState);
  };

  const deleteNote = async (id: string) => {
    const updatedNotes = state.notes.filter((n) => n.id !== id);
    const newState: AppState = {
      ...state,
      notes: updatedNotes,
    };

    setState(newState);
    await storageService.saveData(newState);
    await notificationService.updateNotifications(newState);
  };

  const getNote = (id: string): Note | undefined => {
    return state.notes.find((note) => note.id === id);
  };

  // ========== DEBTS FUNCTIONS ==========
  const addDebt = async (
    debt: Omit<Debt, "id" | "createdAt" | "updatedAt">,
    syncWithCash: boolean = false,
    walletId?: string,
  ) => {
    const newDebt: Debt = {
      ...debt,
      id: generateId(),
      remaining: debt.amount,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), // RISK-004 FIX: set updatedAt on creation for consistent sorting/filtering
    };

    let updatedTransactions = state.transactions;
    const targetWalletId =
      walletId ||
      state.wallets?.find((w) => w.isDefault)?.id ||
      DEFAULT_WALLET_ID;

    if (syncWithCash && debt.amount > 0) {
      const isBorrowed = debt.type === "borrowed";
      const newTransaction: Transaction = {
        id: generateTransactionId(),
        amount: debt.amount,
        type: isBorrowed ? "income" : "expense",
        category: "Hutang",
        description: isBorrowed
          ? `Penerimaan Pinjaman: ${debt.name}`
          : `Pemberian Pinjaman: ${debt.name}`,
        date: getJakartaDateKey(),
        createdAt: new Date().toISOString(),
        walletId: targetWalletId,
      };
      updatedTransactions = [newTransaction, ...state.transactions];
    }

    const baseState: AppState = {
      ...state,
      debts: [newDebt, ...state.debts],
    };
    const newState = computeFullState(baseState, updatedTransactions);

    setState(newState);
    await storageService.saveData(newState);
    await notificationService.updateNotifications(newState);
    gamificationBus.award("debt_recorded");
  };

  const editDebt = async (id: string, updates: Partial<Debt>) => {
    const updatedDebts = state.debts.map((d) =>
      d.id === id
        ? { ...d, ...updates, updatedAt: new Date().toISOString() }
        : d,
    );
    const newState: AppState = { ...state, debts: updatedDebts };
    setState(newState);
    await storageService.saveData(newState);
    await notificationService.updateNotifications(newState);
  };

  const deleteDebt = async (id: string) => {
    const newState: AppState = {
      ...state,
      debts: state.debts.filter((d) => d.id !== id),
    };
    setState(newState);
    await storageService.saveData(newState);
    await notificationService.updateNotifications(newState);
  };

  const payDebt = async (id: string, amount: number, walletId?: string) => {
    const debt = state.debts.find((d) => d.id === id);
    if (!debt) return;

    const newRemaining = Math.max(0, debt.remaining - amount);
    const newStatus: Debt["status"] =
      newRemaining === 0
        ? "paid"
        : newRemaining < debt.amount
          ? "partial"
          : "active";

    // 1. Perbarui daftar hutang
    const updatedDebts = state.debts.map((d) =>
      d.id === id
        ? {
            ...d,
            remaining: newRemaining,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          }
        : d,
    );

    const targetWalletId =
      walletId ||
      state.wallets?.find((w) => w.isDefault)?.id ||
      DEFAULT_WALLET_ID;

    // 2. Buat transaksi otomatis
    // Jika 'borrowed' (hutang kita), maka itu pengeluaran (expense)
    // Jika 'lent' (piutang), maka itu pemasukan (income)
    const newTransaction: Transaction = {
      id: generateTransactionId(),
      amount: amount,
      type: debt.type === "borrowed" ? "expense" : "income",
      category: "Hutang",
      description: `Pembayaran ${
        debt.type === "borrowed" ? "Hutang" : "Piutang"
      }: ${debt.name}`,
      date: getJakartaDateKey(),
      createdAt: new Date().toISOString(),
      walletId: targetWalletId,
    };

    const updatedTransactions = [newTransaction, ...state.transactions];

    const baseState: AppState = {
      ...state,
      debts: updatedDebts,
    };
    const newState = computeFullState(baseState, updatedTransactions);

    // 3. Simpan ke state dan storage
    setState(newState);
    await storageService.saveData(newState);
    await notificationService.updateNotifications(newState);

    if (newStatus === "paid") {
      gamificationBus.award("debt_cleared");
    }

    // Notifikasi jika transaksi besar
    if (amount >= 1000000) {
      await notificationService.sendNotification({
        title: "💰 Pembayaran Hutang",
        body: `Berhasil mencatat pembayaran Rp ${amount.toLocaleString("id-ID")}`,
        data: { type: "NEW_TRANSACTION", transactionId: newTransaction.id },
      });
    }
  };

  // ========== CUSTOM CATEGORIES FUNCTIONS ==========
  const addCustomCategory = async (
    category: Omit<CustomCategory, "id" | "createdAt" | "isCustom">,
  ) => {
    const newCategory: CustomCategory = {
      ...category,
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    const newState: AppState = {
      ...state,
      customCategories: [...state.customCategories, newCategory],
    };
    setState(newState);
    await storageService.saveData(newState);
  };

  const editCustomCategory = async (
    id: string,
    updates: Partial<Omit<CustomCategory, "id" | "isCustom" | "createdAt">>,
  ) => {
    const existing = state.customCategories.find((c) => c.id === id);
    if (!existing) return;

    const oldName = existing.name;
    const newName = updates.name && updates.name.trim().length > 0 ? updates.name.trim() : oldName;
    const nameChanged = oldName !== newName;

    const updatedCategories = state.customCategories.map((c) =>
      c.id === id ? { ...c, ...updates, name: newName } : c,
    );

    let updatedTransactions = state.transactions;
    let updatedBudgets = state.budgets;
    let updatedRecurring = state.recurringTransactions;

    if (nameChanged) {
      updatedTransactions = state.transactions.map((t) =>
        t.category === oldName ? { ...t, category: newName } : t
      );
      updatedBudgets = updateBudgetsFromTransactions(
        updatedTransactions,
        state.budgets.map((b) =>
          b.category === oldName ? { ...b, category: newName } : b
        )
      );
      updatedRecurring = (state.recurringTransactions || []).map((r) =>
        r.category === oldName ? { ...r, category: newName } : r
      );
    }

    const newState: AppState = {
      ...state,
      customCategories: updatedCategories,
      transactions: updatedTransactions,
      budgets: updatedBudgets,
      recurringTransactions: updatedRecurring,
    };
    setState(newState);
    await storageService.saveData(newState);
    await notificationService.updateNotifications(newState);
  };

  const deleteCustomCategory = async (id: string) => {
    const categoryToDelete = state.customCategories.find((c) => c.id === id);
    if (!categoryToDelete) return;

    // Smart delete: migrate existing transactions, budgets, & recurring to 'Lainnya'
    const updatedTransactions = state.transactions.map((t) =>
      t.category === categoryToDelete.name ? { ...t, category: "Lainnya" } : t,
    );
    const updatedBudgets = updateBudgetsFromTransactions(
      updatedTransactions,
      state.budgets.map((b) =>
        b.category === categoryToDelete.name ? { ...b, category: "Lainnya" } : b,
      )
    );
    const updatedRecurring = (state.recurringTransactions || []).map((r) =>
      r.category === categoryToDelete.name ? { ...r, category: "Lainnya" } : r
    );

    const newState: AppState = {
      ...state,
      customCategories: state.customCategories.filter((c) => c.id !== id),
      transactions: updatedTransactions,
      budgets: updatedBudgets,
      recurringTransactions: updatedRecurring,
    };
    setState(newState);
    await storageService.saveData(newState);
    await notificationService.updateNotifications(newState);
  };

  // ========== RECURRING TRANSACTIONS FUNCTIONS ==========
  const addRecurringTransaction = async (
    recurring: Omit<RecurringTransaction, "id" | "createdAt" | "nextRunDate"> & {
      nextRunDate?: string;
    },
  ) => {
    const nextRun =
      recurring.nextRunDate ||
      calculateInitialRunDate(
        recurring.frequency,
        recurring.startDate,
        recurring.dayOfWeek,
        recurring.dayOfMonth,
      );

    const newRecurring: RecurringTransaction = {
      ...recurring,
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      nextRunDate: nextRun,
      createdAt: new Date().toISOString(),
    };

    const updatedList = [...(state.recurringTransactions || []), newRecurring];
    const tempState: AppState = {
      ...state,
      recurringTransactions: updatedList,
    };

    // Auto-check immediately in case startDate/nextRunDate <= today
    const { updatedState, executedCount } = processRecurringTransactions(tempState);
    if (executedCount > 0) {
      const updatedBudgets = updateBudgetsFromTransactions(
        updatedState.transactions,
        updatedState.budgets,
      );
      const finalState = {
        ...updatedState,
        budgets: updatedBudgets,
      };
      setState(finalState);
      await storageService.saveData(finalState);
      await notificationService.updateNotifications(finalState);
    } else {
      setState(tempState);
      await storageService.saveData(tempState);
    }
  };

  const editRecurringTransaction = async (
    id: string,
    updates: Partial<RecurringTransaction>,
  ) => {
    const existing = (state.recurringTransactions || []).find((r) => r.id === id);
    if (!existing) return;

    let nextRun = updates.nextRunDate || existing.nextRunDate;
    if (
      (updates.frequency && updates.frequency !== existing.frequency) ||
      (updates.startDate && updates.startDate !== existing.startDate) ||
      updates.dayOfWeek !== undefined ||
      updates.dayOfMonth !== undefined ||
      updates.intervalDays !== undefined
    ) {
      const targetFrequency = updates.frequency || existing.frequency;
      const targetStartDate = updates.startDate || existing.startDate;
      const targetDayOfWeek =
        updates.dayOfWeek !== undefined ? updates.dayOfWeek : existing.dayOfWeek;
      const targetDayOfMonth =
        updates.dayOfMonth !== undefined ? updates.dayOfMonth : existing.dayOfMonth;
      nextRun = calculateInitialRunDate(
        targetFrequency,
        targetStartDate,
        targetDayOfWeek,
        targetDayOfMonth,
      );
    }

    const updated = (state.recurringTransactions || []).map((r) =>
      r.id === id
        ? {
            ...r,
            ...updates,
            nextRunDate: nextRun,
            updatedAt: new Date().toISOString(),
          }
        : r,
    );

    const tempState: AppState = { ...state, recurringTransactions: updated };
    const { updatedState, executedCount } = processRecurringTransactions(tempState);
    if (executedCount > 0) {
      const updatedBudgets = updateBudgetsFromTransactions(
        updatedState.transactions,
        updatedState.budgets,
      );
      const finalState = {
        ...updatedState,
        budgets: updatedBudgets,
      };
      setState(finalState);
      await storageService.saveData(finalState);
      await notificationService.updateNotifications(finalState);
    } else {
      setState(tempState);
      await storageService.saveData(tempState);
    }
  };

  const deleteRecurringTransaction = async (id: string) => {
    const updated = (state.recurringTransactions || []).filter((r) => r.id !== id);
    const newState: AppState = { ...state, recurringTransactions: updated };
    setState(newState);
    await storageService.saveData(newState);
  };

  const toggleRecurringTransaction = async (id: string) => {
    const existing = (state.recurringTransactions || []).find((r) => r.id === id);
    if (!existing) return;

    const willBeActive = !existing.isActive;
    let nextRun = existing.nextRunDate;
    const todayStr = getJakartaDateKey();

    if (willBeActive) {
      if (nextRun < todayStr) {
        nextRun = calculateInitialRunDate(
          existing.frequency,
          todayStr,
          existing.dayOfWeek,
          existing.dayOfMonth,
        );
      }
    }

    const updated = (state.recurringTransactions || []).map((r) =>
      r.id === id
        ? {
            ...r,
            isActive: willBeActive,
            nextRunDate: nextRun,
            updatedAt: new Date().toISOString(),
          }
        : r,
    );

    const tempState: AppState = { ...state, recurringTransactions: updated };

    if (willBeActive && nextRun <= todayStr) {
      const { updatedState, executedCount } = processRecurringTransactions(tempState);
      if (executedCount > 0) {
        const updatedBudgets = updateBudgetsFromTransactions(
          updatedState.transactions,
          updatedState.budgets,
        );
        const finalState = {
          ...updatedState,
          budgets: updatedBudgets,
        };
        setState(finalState);
        await storageService.saveData(finalState);
        await notificationService.updateNotifications(finalState);
        return;
      }
    }

    setState(tempState);
    await storageService.saveData(tempState);
  };

  // ========== PROVIDER VALUE ==========
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    const newState = {
      ...state,
      userProfile: { ...state.userProfile, ...updates },
    };
    setState(newState);
    await storageService.saveData(newState);
  };

  const updatePaydayCutoff = async (
    day: number,
    syncRecurringSalary: boolean = false,
  ) => {
    try {
      const validDay = Math.max(1, Math.min(31, Math.floor(day)));

      await AsyncStorage.setItem("@mymoney_payday_cutoff", validDay.toString());

      let updatedRecurring = [...state.recurringTransactions];
      if (syncRecurringSalary) {
        const todayStr = getJakartaDateKey();
        updatedRecurring = updatedRecurring.map((r) => {
          if (r.type === "income" && r.frequency === "monthly") {
            const nextStr = calculateInitialRunDate(
              "monthly",
              todayStr,
              undefined,
              validDay
            );
            return {
              ...r,
              dayOfMonth: validDay,
              nextRunDate: nextStr,
              updatedAt: new Date().toISOString(),
            };
          }
          return r;
        });
      }

      const updatedState: AppState = {
        ...state,
        paydayCutoff: validDay,
        recurringTransactions: updatedRecurring,
      };

      await storageService.saveData(updatedState);
      setState(updatedState);

      try {
        await notificationService.updateQuickActionWidget(updatedState);
      } catch {}
    } catch (error) {
      console.error("Error updating payday cutoff:", error);
      throw error;
    }
  };

  const contextValue: AppContextType = {
    state,
    isLoading,

    addTransaction,
    editTransaction,
    deleteTransaction,

    addWallet,
    editWallet,
    deleteWallet,
    reconcileWallet,

    addBudget,
    editBudget,
    deleteBudget,
    addSavings,
    editSavings,
    deleteSavings,
    addSavingsTransaction,
    getSavingsTransactions,

    addNote,
    editNote,
    deleteNote,
    getNote,

    addDebt,
    editDebt,
    deleteDebt,
    payDebt,

    addCustomCategory,
    editCustomCategory,
    deleteCustomCategory,

    addRecurringTransaction,
    editRecurringTransaction,
    deleteRecurringTransaction,
    toggleRecurringTransaction,
    processRecurringNow,

    updateUserProfile,
    updatePaydayCutoff,

    triggerNotificationCheck,

    refreshData,
    importBackupData,
    clearAllData,
    debugStorage,
    globalLoading,
    setLoading,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};
