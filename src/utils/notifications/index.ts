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

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
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
      console.error("❌ Error loading notification settings:", error);
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
      console.error("❌ Error saving notification settings:", error);
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
      console.error("❌ Error checking notification settings:", error);
      return true; // Default enabled jika error
    }
  }

  // Check if within quiet hours
  private isWithinQuietHours(
    quietHours: AdvancedNotificationSettings["quietHours"]
  ): boolean {
    // Use optional chaining dengan fallback ke default
    if (!quietHours?.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const startTime = this.timeToMinutes(quietHours.start || "22:00");
    const endTime = this.timeToMinutes(quietHours.end || "07:00");

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }

    return currentTime >= startTime && currentTime < endTime;
  }

  private timeToMinutes(timeStr: string | undefined): number {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
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
        console.log("❌ Izin notifikasi ditolak");
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
      console.log("⚠️ Harus menggunakan perangkat fisik untuk notifikasi");
      return false;
    }
  }

  // ==================== INITIALIZATION ====================

  // Initialize all notifications
  async initialize(appState: AppState): Promise<void> {
    try {
      console.log("🔔 Menginisialisasi notifikasi...");

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

      console.log("✅ Notifikasi siap");
    } catch (error) {
      console.error("❌ Error menginisialisasi notifikasi:", error);
    }
  }

  // ==================== SCHEDULING ====================

  // Schedule daily reminders dengan custom schedule
  private async scheduleDailyReminders(appState: AppState): Promise<void> {
    try {
      console.log("⏰ Menjadwalkan pengingat harian...");

      // Check settings sebelum schedule
      const settings = await this.loadSettings();

      // Morning reminder dengan custom time
      if (
        settings.dailyReminders &&
        settings.advanced?.customSchedule?.morningEnabled !== false
      ) {
        const morningTime =
          settings.advanced?.customSchedule?.morning || "07:30";
        const [morningHour, morningMinute] = morningTime.split(":").map(Number);

        await this.sendScheduledNotification({
          title: "🌅 Pagi yang produktif!",
          body: "Jangan lupa catat semua transaksi hari ini untuk tracking yang akurat!",
          hour: morningHour,
          minute: morningMinute,
          repeats: true,
          data: { type: "MORNING_REMINDER" },
        });
      }

      // Budget check reminder (12:00 PM)
      if (settings.dailyReminders) {
        await this.sendScheduledNotification({
          title: "🍽️ Cek Budget Makan Siang",
          body: "Jangan lupa periksa budget makan siang hari ini",
          hour: 12,
          minute: 0,
          repeats: true,
          data: { type: "MIDDAY_CHECK" },
        });
      }

      // Transaction reminder (3:00 PM)
      if (settings.dailyReminders) {
        await this.sendScheduledNotification({
          title: "📝 Ingat Catat Transaksi",
          body: "Jangan lupa catat semua transaksi yang sudah dilakukan hari ini!",
          hour: 15,
          minute: 0,
          repeats: true,
          data: { type: "TRANSACTION_REMINDER" },
        });
      }

      // Evening summary dengan custom time
      if (
        settings.dailyReminders &&
        settings.advanced?.customSchedule?.eveningEnabled !== false
      ) {
        const eveningTime =
          settings.advanced?.customSchedule?.evening || "20:00";
        const [eveningHour, eveningMinute] = eveningTime.split(":").map(Number);
        const eveningSummary = generateDailySummary(appState);

        await this.sendScheduledNotification({
          title: "🌙 Waktunya Review Harian",
          body: eveningSummary,
          hour: eveningHour,
          minute: eveningMinute,
          repeats: true,
          data: { type: "EVENING_SUMMARY" },
        });
      }

      // Random financial tip dengan custom time
      if (
        settings.financialTips &&
        settings.advanced?.customSchedule?.financialTipEnabled !== false
      ) {
        const tipTime =
          settings.advanced?.customSchedule?.financialTip || "10:00";
        const [tipHour, tipMinute] = tipTime.split(":").map(Number);
        const randomTip =
          NotificationMessages.financialTips[
            Math.floor(
              Math.random() * NotificationMessages.financialTips.length
            )
          ];

        await this.sendScheduledNotification({
          ...randomTip,
          hour: tipHour,
          minute: tipMinute,
          repeats: true,
        });
      }

      console.log("✅ Pengingat harian terjadwal");
    } catch (error) {
      console.error("❌ Error menjadwalkan pengingat harian:", error);
    }
  }

  // ==================== NOTIFICATION SENDING ====================

  // Send single notification (immediate) dengan cek advanced settings
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
        console.log(
          `🔕 Notification skipped (type: ${data.type}) - disabled in settings`
        );
        return;
      }

      // Cek quiet hours dengan safe access
      if (
        settings.advanced?.quietHours &&
        this.isWithinQuietHours(settings.advanced.quietHours)
      ) {
        // Jika urgent dan ignoreUrgent false, tetap kirim
        if (urgent && !settings.advanced.quietHours.ignoreUrgent) {
          console.log("🔔 Urgent notification sent during quiet hours");
        } else {
          console.log("🔕 Notification skipped (quiet hours)");
          return;
        }
      }

      // Cek active days
      if (!this.isActiveDay(settings.advanced?.activeDays)) {
        console.log("🔕 Notification skipped (inactive day)");
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
      console.log(`📨 Notifikasi terkirim: ${title}`);
    } catch (error) {
      console.error("❌ Error mengirim notifikasi:", error);
    }
  }

  // Send scheduled notification dengan cek advanced settings
  async sendScheduledNotification({
    title,
    body,
    hour,
    minute,
    repeats = false,
    data = {},
  }: {
    title: string;
    body: string;
    hour: number;
    minute: number;
    repeats?: boolean;
    data?: any;
  }): Promise<void> {
    try {
      const settings = await this.loadSettings();

      // Cek apakah notification type ini enabled
      if (data.type && !(await this.isNotificationTypeEnabled(data.type))) {
        console.log(
          `🔕 Scheduled notification skipped (type: ${data.type}) - disabled in settings`
        );
        return;
      }

      // Cek active days untuk scheduled notifications
      if (!this.isActiveDay(settings.advanced?.activeDays)) {
        console.log("🔕 Scheduled notification skipped (inactive day)");
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: settings.advanced?.soundEnabled !== false,
        },
        trigger: {
          hour,
          minute,
          repeats,
        },
      });
    } catch (error) {
      console.error("❌ Error menjadwalkan notifikasi:", error);
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
      console.error("❌ Error checking monthly reminders:", error);
    }
  }

  // Check for immediate alerts (budget exceeded, etc)
  async checkImmediateAlerts(appState: AppState): Promise<void> {
    try {
      console.log("🔍 Mengecek alert segera...");

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
        console.log(`📤 Mengirim ${allAlerts.length} alert`);
      }
    } catch (error) {
      console.error("❌ Error checking immediate alerts:", error);
    }
  }

  // ==================== UTILITY FUNCTIONS ====================

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("🗑️ Semua notifikasi dibatalkan");
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
      console.log("🔄 Reinitializing notifications with current settings...");

      // Cancel semua notifikasi lama
      await this.cancelAllNotifications();

      // Load current settings
      const settings = await this.loadSettings();

      // Jika notifications enabled, schedule ulang
      if (settings.enabled) {
        await this.scheduleDailyReminders(appState);
        await this.checkImmediateAlerts(appState);
      }

      console.log("✅ Notifications reinitialized");
    } catch (error) {
      console.error("❌ Error reinitializing notifications:", error);
    }
  }

  // Update notifications when app state changes
  async updateNotifications(appState: AppState): Promise<void> {
    try {
      // Check for new alerts based on state changes
      await this.checkImmediateAlerts(appState);

      // Update evening summary if needed
      const settings = await this.loadSettings();
      if (
        settings.dailyReminders &&
        settings.advanced?.customSchedule?.eveningEnabled !== false
      ) {
        const scheduled = await this.getScheduledNotifications();
        const eveningNotification = scheduled.find(
          (n) => n.content.data?.type === "EVENING_SUMMARY"
        );

        if (eveningNotification) {
          const newSummary = generateDailySummary(appState);
          await Notifications.cancelScheduledNotificationAsync(
            eveningNotification.identifier
          );

          const eveningTime =
            settings.advanced?.customSchedule?.evening || "20:00";
          const [eveningHour, eveningMinute] = eveningTime
            .split(":")
            .map(Number);

          await this.sendScheduledNotification({
            title: "🌙 Waktunya Review Harian",
            body: newSummary,
            hour: eveningHour,
            minute: eveningMinute,
            repeats: true,
            data: { type: "EVENING_SUMMARY" },
          });
        }
      }
    } catch (error) {
      console.error("❌ Error updating notifications:", error);
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

      console.log("✅ Notification settings updated");
    } catch (error) {
      console.error("❌ Error updating notification settings:", error);
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// Export DEFAULT_SETTINGS untuk digunakan di SettingsScreen
export { DEFAULT_SETTINGS };
