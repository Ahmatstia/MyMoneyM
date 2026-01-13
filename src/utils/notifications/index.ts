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

// Default settings
const DEFAULT_SETTINGS = {
  dailyReminders: true,
  budgetAlerts: true,
  savingsProgress: true,
  transactionReminders: true,
  notesReminders: true,
  weeklyReports: true,
  financialTips: true,
  enabled: true, // Master switch
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
        return JSON.parse(savedSettings);
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
      await AsyncStorage.setItem(
        NOTIFICATION_SETTINGS_KEY,
        JSON.stringify(settings)
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

  // Update scheduled notifications berdasarkan settings
  async updateScheduledNotificationsBySettings(): Promise<void> {
    try {
      const settings = await this.loadSettings();
      const scheduled = await this.getScheduledNotifications();

      // Jika notifications disabled secara keseluruhan, cancel semua
      if (!settings.enabled) {
        await this.cancelAllNotifications();
        return;
      }

      // Cancel specific notifications berdasarkan settings
      for (const notification of scheduled) {
        const notificationType = notification.content.data?.type;

        if (
          notificationType &&
          !(await this.isNotificationTypeEnabled(notificationType))
        ) {
          await Notifications.cancelScheduledNotificationAsync(
            notification.identifier
          );
        }
      }
    } catch (error) {
      console.error(
        "❌ Error updating scheduled notifications by settings:",
        error
      );
    }
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
        // Schedule daily reminders
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

  // Schedule daily reminders
  private async scheduleDailyReminders(appState: AppState): Promise<void> {
    try {
      console.log("⏰ Menjadwalkan pengingat harian...");

      // Check settings sebelum schedule
      const settings = await this.loadSettings();

      // Morning reminder (7:30 AM) - hanya jika dailyReminders enabled
      if (settings.dailyReminders) {
        await this.sendScheduledNotification({
          title: "🌅 Pagi yang produktif!",
          body: "Jangan lupa catat semua transaksi hari ini untuk tracking yang akurat!",
          hour: 7,
          minute: 30,
          repeats: true,
          data: { type: "MORNING_REMINDER" },
        });
      }

      // Budget check reminder (12:00 PM) - hanya jika dailyReminders enabled
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

      // Transaction reminder (3:00 PM) - hanya jika dailyReminders enabled
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

      // Evening summary (8:00 PM) - hanya jika dailyReminders enabled
      if (settings.dailyReminders) {
        const eveningSummary = generateDailySummary(appState);
        await this.sendScheduledNotification({
          title: "🌙 Waktunya Review Harian",
          body: eveningSummary,
          hour: 20,
          minute: 0,
          repeats: true,
          data: { type: "EVENING_SUMMARY" },
        });
      }

      // Random financial tip (10:00 AM) - hanya jika financialTips enabled
      if (settings.financialTips) {
        const randomTip =
          NotificationMessages.financialTips[
            Math.floor(
              Math.random() * NotificationMessages.financialTips.length
            )
          ];
        await this.sendScheduledNotification({
          ...randomTip,
          hour: 10,
          minute: 0,
          repeats: true,
        });
      }

      console.log("✅ Pengingat harian terjadwal");
    } catch (error) {
      console.error("❌ Error menjadwalkan pengingat harian:", error);
    }
  }

  // ==================== NOTIFICATION SENDING ====================

  // Send single notification (immediate) dengan cek settings
  async sendNotification({
    title,
    body,
    data = {},
    sound = true,
  }: {
    title: string;
    body: string;
    data?: any;
    sound?: boolean;
  }): Promise<void> {
    try {
      // Cek apakah notification type ini enabled
      if (data.type && !(await this.isNotificationTypeEnabled(data.type))) {
        console.log(
          `🔕 Notification skipped (type: ${data.type}) - disabled in settings`
        );
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: sound,
        },
        trigger: null, // Immediate
      });
      console.log(`📨 Notifikasi terkirim: ${title}`);
    } catch (error) {
      console.error("❌ Error mengirim notifikasi:", error);
    }
  }

  // Send scheduled notification dengan cek settings
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
      // Cek apakah notification type ini enabled
      if (data.type && !(await this.isNotificationTypeEnabled(data.type))) {
        console.log(
          `🔕 Scheduled notification skipped (type: ${data.type}) - disabled in settings`
        );
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
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
        await this.sendNotification(alert);
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
      if (settings.dailyReminders) {
        const scheduled = await this.getScheduledNotifications();
        const eveningNotification = scheduled.find(
          (n) => n.content.data?.type === "EVENING_SUMMARY"
        );

        if (eveningNotification) {
          const newSummary = generateDailySummary(appState);
          await Notifications.cancelScheduledNotificationAsync(
            eveningNotification.identifier
          );

          await this.sendScheduledNotification({
            title: "🌙 Waktunya Review Harian",
            body: newSummary,
            hour: 20,
            minute: 0,
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

      // Save new settings
      await this.saveSettings(newSettings);

      // Jika ada perubahan pada enabled status atau type settings, reinitialize
      if (
        oldSettings.enabled !== newSettings.enabled ||
        oldSettings.dailyReminders !== newSettings.dailyReminders ||
        oldSettings.budgetAlerts !== newSettings.budgetAlerts ||
        oldSettings.financialTips !== newSettings.financialTips
      ) {
        if (appState) {
          await this.reinitializeNotifications(appState);
        } else {
          await this.updateScheduledNotificationsBySettings();
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

// Export DEFAULT_SETTINGS untuk digunakan di NotificationSettingsScreen
export { DEFAULT_SETTINGS };
