import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "../../types";
import { NotificationMessages } from "./messages";
import {
  checkBudgetAlerts,
  checkSavingsProgress,
  checkTransactionReminders,
  checkNotesReminders,
  generateDailySummary,
} from "./triggers";

// Key untuk menyimpan settings
const NOTIFICATION_SETTINGS_KEY = "@mymoney_notification_settings";

// Advanced notification settings types - HARUS SAMA PERSIS dengan SettingsScreen
export interface AdvancedNotificationSettings {
  customSchedule?: {
    morning?: string;
    morningEnabled?: boolean;
    evening?: string;
    eveningEnabled?: boolean;
    financialTip?: string;
    financialTipEnabled?: boolean;
  };
  quietHours?: {
    enabled?: boolean; // UBAH: jadi optional
    start?: string;
    end?: string;
    ignoreUrgent?: boolean;
  };
  activeDays?: number[];
  vibrationPattern?: "light" | "medium" | "heavy";
  soundEnabled?: boolean;
}

// Default settings with advanced features
const DEFAULT_SETTINGS = {
  dailyReminders: true,
  budgetAlerts: true,
  savingsProgress: true,
  transactionReminders: true,
  notesReminders: true,
  weeklyReports: true,
  financialTips: true,
  enabled: true,
  advanced: {
    customSchedule: {
      morning: "07:30",
      morningEnabled: true,
      evening: "20:00",
      eveningEnabled: true,
      financialTip: "10:00",
      financialTipEnabled: true,
    },
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "07:00",
      ignoreUrgent: false,
    },
    activeDays: [0, 1, 2, 3, 4, 5, 6], // All days
    vibrationPattern: "medium" as const,
    soundEnabled: true,
  } as AdvancedNotificationSettings,
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  // Cooldown map to prevent duplicate notifications within a time window
  private sentAlertCooldown: Map<string, number> = new Map();
  private static COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes cooldown

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Check if a notification type is on cooldown (prevents duplicates)
  private isOnCooldown(type: string): boolean {
    const lastSent = this.sentAlertCooldown.get(type);
    if (!lastSent) return false;
    return Date.now() - lastSent < NotificationService.COOLDOWN_MS;
  }

  // Mark a notification type as sent
  private markAsSent(type: string): void {
    this.sentAlertCooldown.set(type, Date.now());
  }

  // Clear all cooldowns (used on reinitialize)
  private clearCooldowns(): void {
    this.sentAlertCooldown.clear();
  }

  // ==================== SETTINGS MANAGEMENT ====================

  // Load settings dari AsyncStorage
  async loadSettings(): Promise<typeof DEFAULT_SETTINGS> {
    try {
      const savedSettings = await AsyncStorage.getItem(
        NOTIFICATION_SETTINGS_KEY
      );
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Ensure advanced settings exist dengan default values
        const loadedAdvanced = {
          ...DEFAULT_SETTINGS.advanced,
          ...(parsed.advanced || {}),
          quietHours: {
            ...DEFAULT_SETTINGS.advanced.quietHours,
            ...(parsed.advanced?.quietHours || {}),
          },
          customSchedule: {
            ...DEFAULT_SETTINGS.advanced.customSchedule,
            ...(parsed.advanced?.customSchedule || {}),
          },
        };

        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          advanced: loadedAdvanced,
        };
      }
      return DEFAULT_SETTINGS;
    } catch (error) {

      return DEFAULT_SETTINGS;
    }
  }

  // Save settings ke AsyncStorage
  async saveSettings(settings: typeof DEFAULT_SETTINGS): Promise<void> {
    try {
      // Ensure all advanced fields have values
      const safeSettings = {
        ...settings,
        advanced: {
          ...DEFAULT_SETTINGS.advanced,
          ...settings.advanced,
          quietHours: {
            ...DEFAULT_SETTINGS.advanced.quietHours,
            ...settings.advanced?.quietHours,
          },
          customSchedule: {
            ...DEFAULT_SETTINGS.advanced.customSchedule,
            ...settings.advanced?.customSchedule,
          },
        },
      };

      await AsyncStorage.setItem(
        NOTIFICATION_SETTINGS_KEY,
        JSON.stringify(safeSettings)
      );
    } catch (error) {

    }
  }

  // Check if notification type is enabled
  async isNotificationTypeEnabled(type: string): Promise<boolean> {
    try {
      const settings = await this.loadSettings();

      // Master switch
      if (!settings.enabled) return false;

      // Map notification types to settings
      const typeMapping: Record<string, keyof typeof DEFAULT_SETTINGS> = {
        MORNING_REMINDER: "dailyReminders",
        MIDDAY_CHECK: "dailyReminders",
        TRANSACTION_REMINDER: "dailyReminders",
        EVENING_SUMMARY: "dailyReminders",
        BUDGET_WARNING: "budgetAlerts",
        BUDGET_EXCEEDED: "budgetAlerts",
        SAVINGS_MILESTONE: "savingsProgress",
        SAVINGS_COMPLETE: "savingsProgress",
        SAVINGS_DEADLINE: "savingsProgress",
        NO_TRANSACTION_TODAY: "transactionReminders",
        LARGE_TRANSACTION: "transactionReminders",
        NOTES_REMINDER: "notesReminders",
        IMPORTANT_NOTES: "notesReminders",
        FINANCIAL_TIP: "financialTips",
        WEEKLY_REPORT: "weeklyReports",
        MONTHLY_RESET: "weeklyReports",
        MONTHLY_REVIEW: "weeklyReports",
      };

      const settingKey = typeMapping[type];
      return settingKey ? settings[settingKey] !== false : true;
    } catch (error) {

      return true; // Default enabled jika error
    }
  }

  // Check if a specific time or current time is within quiet hours
  private isWithinQuietHours(
    quietHours: AdvancedNotificationSettings["quietHours"],
    checkHour?: number,
    checkMinute?: number
  ): boolean {
    if (!quietHours?.enabled) return false;

    let totalMinutes: number;
    if (checkHour !== undefined && checkMinute !== undefined) {
      totalMinutes = checkHour * 60 + checkMinute;
    } else {
      const now = new Date();
      totalMinutes = now.getHours() * 60 + now.getMinutes();
    }

    const startTime = this.timeToMinutes(quietHours.start || "22:00");
    const endTime = this.timeToMinutes(quietHours.end || "07:00");

    if (startTime > endTime) {
      return totalMinutes >= startTime || totalMinutes < endTime;
    }

    return totalMinutes >= startTime && totalMinutes < endTime;
  }

  private timeToMinutes(timeStr: string | undefined): number {
    if (!timeStr || typeof timeStr !== "string" || !timeStr.includes(":"))
      return 0;
    try {
      const [hours, minutes] = timeStr.split(":").map(Number);
      if (isNaN(hours) || isNaN(minutes)) return 0;
      return Math.max(0, Math.min(23, hours)) * 60 +
        Math.max(0, Math.min(59, minutes));
    } catch {
      return 0;
    }
  }

  // Check if today is active day
  private isActiveDay(activeDays?: number[]): boolean {
    if (!activeDays || activeDays.length === 0) return true;

    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    return activeDays.includes(today);
  }

  // ==================== PERMISSION & SETUP ====================

  // Request permissions
  async registerForPushNotificationsAsync(): Promise<boolean> {
    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus !== "granted") {

        return false;
      }

      // Setup Android channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
          sound: "default",
          enableVibrate: true,
          showBadge: true,
        });
      }

      return true;
    } else {

      return false;
    }
  }

  // ==================== INITIALIZATION ====================

  // Initialize all notifications
  async initialize(appState: AppState): Promise<void> {
    try {

      // Load settings
      const settings = await this.loadSettings();

      // Clear all existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Only schedule if notifications enabled
      if (settings.enabled) {
        // Schedule daily reminders dengan custom schedule
        await this.scheduleDailyReminders(appState);

        // Check for immediate alerts
        await this.checkImmediateAlerts(appState);
      }


    } catch (error) {

    }
  }

  // ==================== SCHEDULING ====================

  // Schedule daily reminders dengan custom schedule
  private async scheduleDailyReminders(appState: AppState): Promise<void> {
    try {

      const settings = await this.loadSettings();
      const activeDays = settings.advanced?.activeDays || [0, 1, 2, 3, 4, 5, 6];

      // Alih-alih 1 notifikasi harian yang mengabaikan hari aktif,
      // kita buat notifikasi mingguan untuk setiap hari yang aktif.
      // Expo: 1=Sunday, 2=Monday, ..., 7=Saturday
      for (const day of activeDays) {
        const expoWeekday = day + 1;

        // 1. Morning reminder
        if (
          settings.dailyReminders &&
          settings.advanced?.customSchedule?.morningEnabled !== false
        ) {
          const morningTime =
            settings.advanced?.customSchedule?.morning || "07:30";
          const [hour, minute] = morningTime.split(":").map(Number);

          await this.sendScheduledNotification({
            title: "🌅 Pagi yang produktif!",
            body: "Jangan lupa catat semua transaksi hari ini untuk tracking yang akurat!",
            hour,
            minute,
            weekday: expoWeekday,
            repeats: true,
            data: { type: "MORNING_REMINDER" },
          });
        }

        // 2. Budget check (12:00)
        if (settings.dailyReminders) {
          await this.sendScheduledNotification({
            title: "🍽️ Cek Budget Makan Siang",
            body: "Jangan lupa periksa budget makan siang hari ini",
            hour: 12,
            minute: 0,
            weekday: expoWeekday,
            repeats: true,
            data: { type: "MIDDAY_CHECK" },
          });
        }

        // 3. Transaction reminders (15:00)
        if (settings.dailyReminders) {
          await this.sendScheduledNotification({
            title: "📝 Ingat Catat Transaksi",
            body: "Jangan lupa catat semua transaksi yang sudah dilakukan hari ini!",
            hour: 15,
            minute: 0,
            weekday: expoWeekday,
            repeats: true,
            data: { type: "TRANSACTION_REMINDER" },
          });
        }

        // 4. Evening summary
        if (
          settings.dailyReminders &&
          settings.advanced?.customSchedule?.eveningEnabled !== false
        ) {
          const eveningTime =
            settings.advanced?.customSchedule?.evening || "20:00";
          const [hour, minute] = eveningTime.split(":").map(Number);
          const eveningSummary = generateDailySummary(appState);

          await this.sendScheduledNotification({
            title: "🌙 Waktunya Review Harian",
            body: eveningSummary,
            hour,
            minute,
            weekday: expoWeekday,
            repeats: true,
            data: { type: "EVENING_SUMMARY" },
          });
        }

        // 5. Financial Tip
        if (
          settings.financialTips &&
          settings.advanced?.customSchedule?.financialTipEnabled !== false
        ) {
          const tipTime =
            settings.advanced?.customSchedule?.financialTip || "10:00";
          const [hour, minute] = tipTime.split(":").map(Number);
          const randomTip =
            NotificationMessages.financialTips[
              Math.floor(
                Math.random() * NotificationMessages.financialTips.length
              )
            ];

          await this.sendScheduledNotification({
            ...randomTip,
            hour,
            minute,
            weekday: expoWeekday,
            repeats: true,
          });
        }
      }

      
    } catch (error) {

    }
  }

  // ==================== NOTIFICATION SENDING ====================

  // Send single notification (immediate) dengan cek advanced settings + cooldown dedup
  async sendNotification({
    title,
    body,
    data = {},
    sound = true,
    urgent = false,
  }: {
    title: string;
    body: string;
    data?: any;
    sound?: boolean;
    urgent?: boolean;
  }): Promise<void> {
    try {
      const settings = await this.loadSettings();

      // Cek apakah notification type ini enabled
      if (data.type && !(await this.isNotificationTypeEnabled(data.type))) {
        
        return;
      }

      // DEDUP: Skip if same alert type was sent recently (30 min cooldown)
      if (data.type && this.isOnCooldown(data.type)) {
        
        return;
      }

      // Cek quiet hours dengan safe access
      if (
        settings.advanced?.quietHours &&
        this.isWithinQuietHours(settings.advanced.quietHours)
      ) {
        // Jika urgent dan ignoreUrgent false, tetap kirim
        if (urgent && !settings.advanced.quietHours.ignoreUrgent) {

        } else {

          return;
        }
      }

      // Cek active days
      if (!this.isActiveDay(settings.advanced?.activeDays)) {

        return;
      }

      // Use custom sound setting dengan safe access
      const useSound =
        settings.advanced?.soundEnabled !== false ? sound : false;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: useSound,
        },
        trigger: null, // Immediate
      });

      // Mark this type as sent for cooldown
      if (data.type) {
        this.markAsSent(data.type);
      }


    } catch (error) {

    }
  }

  // Send scheduled notification dengan cek advanced settings
  async sendScheduledNotification({
    title,
    body,
    hour,
    minute,
    weekday,
    repeats = false,
    data = {},
  }: {
    title: string;
    body: string;
    hour: number;
    minute: number;
    weekday?: number;
    repeats?: boolean;
    data?: any;
  }): Promise<void> {
    try {
      const settings = await this.loadSettings();

      // 1. Cek master switch
      if (!settings.enabled) return;

      // 2. Cek apakah notification type ini enabled
      if (data.type && !(await this.isNotificationTypeEnabled(data.type))) {
        return;
      }

      // 3. PENTING: Cek Quiet Hours untuk waktu terjadwal ini
      // Jika waktu yang dijadwalkan masuk jam tenang, jangan schedule
      if (this.isWithinQuietHours(settings.advanced?.quietHours, hour, minute)) {
        
        return;
      }

      // 4. Construct trigger (Daily atau Weekly)
      const trigger: Notifications.NotificationTriggerInput = weekday
        ? { weekday, hour, minute, repeats } // Weekly
        : { hour, minute, repeats }; // Daily

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: settings.advanced?.soundEnabled !== false,
        },
        trigger,
      });
    } catch (error) {

    }
  }

  // ==================== ALERTS & CHECKS ====================

  private async checkMonthlyReminders(appState: AppState): Promise<void> {
    try {
      const settings = await this.loadSettings();

      // Cek apakah weekly reports enabled
      if (!settings.weeklyReports) return;

      const today = new Date();
      const date = today.getDate();
      const hour = today.getHours();

      // Check if today is 1st of month (at 10:00 AM)
      if (date === 1 && hour === 10) {
        await this.sendNotification({
          title: "📋 Awal Bulan Baru!",
          body: "Waktunya reset budget dan set target bulan ini",
          data: { type: "MONTHLY_RESET" },
        });
      }

      // Check if today is 28th of month (at 8:00 PM)
      if (date === 28 && hour === 20) {
        await this.sendNotification({
          title: "📊 Review Akhir Bulan",
          body: "Cek pencapaian finansial bulan ini",
          data: { type: "MONTHLY_REVIEW" },
        });
      }
    } catch (error) {

    }
  }

  // Check for immediate alerts (budget exceeded, etc)
  async checkImmediateAlerts(appState: AppState): Promise<void> {
    try {

      const settings = await this.loadSettings();

      // Cek settings untuk masing-masing alert type
      const budgetAlerts = settings.budgetAlerts
        ? await checkBudgetAlerts(appState)
        : [];
      const savingsAlerts = settings.savingsProgress
        ? await checkSavingsProgress(appState)
        : [];
      const transactionAlerts = settings.transactionReminders
        ? await checkTransactionReminders(appState)
        : [];
      const notesAlerts = settings.notesReminders
        ? await checkNotesReminders(appState)
        : [];

      const allAlerts = [
        ...budgetAlerts,
        ...savingsAlerts,
        ...transactionAlerts,
        ...notesAlerts,
      ];

      // Send immediate notifications if any
      for (const alert of allAlerts) {
        // Mark budget exceeded as urgent
        const isUrgent =
          alert.data?.type === "BUDGET_EXCEEDED" ||
          alert.data?.type === "SAVINGS_DEADLINE";

        await this.sendNotification({
          ...alert,
          urgent: isUrgent,
        });
      }

      // Check monthly reminders (jika weekly reports enabled)
      await this.checkMonthlyReminders(appState);

      if (allAlerts.length > 0) {

      }
    } catch (error) {

    }
  }

  // ==================== UTILITY FUNCTIONS ====================

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();

  }

  // Get scheduled notifications
  async getScheduledNotifications(): Promise<
    Notifications.NotificationRequest[]
  > {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  // Reinitialize notifications dengan settings baru
  async reinitializeNotifications(appState: AppState): Promise<void> {
    try {

      // Cancel semua notifikasi lama
      await this.cancelAllNotifications();

      // Clear cooldowns so alerts can fire fresh
      this.clearCooldowns();

      // Load current settings
      const settings = await this.loadSettings();

      // Jika notifications enabled, schedule ulang
      if (settings.enabled) {
        await this.scheduleDailyReminders(appState);
        await this.checkImmediateAlerts(appState);
      }


    } catch (error) {

    }
  }

  // Update notifications when app state changes
  // NOTE: Does NOT call checkImmediateAlerts — that's done by initialize() on startup
  // and by cooldown-protected sendNotification() in mutation functions
  async updateNotifications(appState: AppState): Promise<void> {
    try {
      // Update evening summaries if needed (handles multiple per-day schedules)
      const settings = await this.loadSettings();
      if (
        settings.dailyReminders &&
        settings.advanced?.customSchedule?.eveningEnabled !== false
      ) {
        const scheduled = await this.getScheduledNotifications();
        const eveningNotifications = scheduled.filter(
          (n) => n.content.data?.type === "EVENING_SUMMARY"
        );

        if (eveningNotifications.length > 0) {
          const newSummary = generateDailySummary(appState);
          const eveningTime =
            settings.advanced?.customSchedule?.evening || "20:00";
          const [eveningHour, eveningMinute] = eveningTime
            .split(":")
            .map(Number);

          for (const notification of eveningNotifications) {
            // Get the weekday if it exists in trigger
            const trigger = notification.trigger as any;
            const weekday = trigger?.weekday;

            await Notifications.cancelScheduledNotificationAsync(
              notification.identifier
            );

            await this.sendScheduledNotification({
              title: "🌙 Waktunya Review Harian",
              body: newSummary,
              hour: eveningHour,
              minute: eveningMinute,
              weekday: weekday,
              repeats: true,
              data: { type: "EVENING_SUMMARY" },
            });
          }
        }
      }
    } catch (error) {

    }
  }

  // Get current notification settings
  async getNotificationSettings(): Promise<typeof DEFAULT_SETTINGS> {
    return await this.loadSettings();
  }

  // Update notification settings dan reinitialize jika diperlukan
  async updateNotificationSettings(
    newSettings: typeof DEFAULT_SETTINGS,
    appState?: AppState
  ): Promise<void> {
    try {
      const oldSettings = await this.loadSettings();

      // Save new settings dengan safe merge
      const safeNewSettings = {
        ...newSettings,
        advanced: {
          ...DEFAULT_SETTINGS.advanced,
          ...newSettings.advanced,
          quietHours: {
            ...DEFAULT_SETTINGS.advanced.quietHours,
            ...newSettings.advanced?.quietHours,
          },
          customSchedule: {
            ...DEFAULT_SETTINGS.advanced.customSchedule,
            ...newSettings.advanced?.customSchedule,
          },
        },
      };

      await this.saveSettings(safeNewSettings);

      // Jika ada perubahan pada enabled status atau type settings, reinitialize
      if (
        oldSettings.enabled !== safeNewSettings.enabled ||
        oldSettings.dailyReminders !== safeNewSettings.dailyReminders ||
        oldSettings.budgetAlerts !== safeNewSettings.budgetAlerts ||
        oldSettings.financialTips !== safeNewSettings.financialTips ||
        JSON.stringify(oldSettings.advanced?.customSchedule) !==
          JSON.stringify(safeNewSettings.advanced?.customSchedule) ||
        JSON.stringify(oldSettings.advanced?.activeDays) !==
          JSON.stringify(safeNewSettings.advanced?.activeDays)
      ) {
        if (appState) {
          await this.reinitializeNotifications(appState);
        }
      }


    } catch (error) {

    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// Export DEFAULT_SETTINGS untuk digunakan di SettingsScreen
export { DEFAULT_SETTINGS };
