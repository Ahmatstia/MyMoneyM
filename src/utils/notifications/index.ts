import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { AppState } from "../../types";
import { NotificationMessages } from "./messages";
import {
  checkBudgetAlerts,
  checkSavingsProgress,
  checkTransactionReminders,
  checkNotesReminders,
  generateDailySummary,
} from "./triggers";

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

  private async checkMonthlyReminders(appState: AppState): Promise<void> {
    try {
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

  // Update method checkImmediateAlerts untuk include monthly checks:
  async checkImmediateAlerts(appState: AppState): Promise<void> {
    try {
      console.log("🔍 Mengecek alert segera...");

      const budgetAlerts = await checkBudgetAlerts(appState);
      const savingsAlerts = await checkSavingsProgress(appState);
      const transactionAlerts = await checkTransactionReminders(appState);
      const notesAlerts = await checkNotesReminders(appState);

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

      // Check monthly reminders
      await this.checkMonthlyReminders(appState);

      if (allAlerts.length > 0) {
        console.log(`📤 Mengirim ${allAlerts.length} alert`);
      }
    } catch (error) {
      console.error("❌ Error checking immediate alerts:", error);
    }
  }

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

  // Initialize all notifications
  async initialize(appState: AppState): Promise<void> {
    try {
      console.log("🔔 Menginisialisasi notifikasi...");

      // Clear all existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Schedule daily reminders
      await this.scheduleDailyReminders(appState);

      // Check for immediate alerts
      await this.checkImmediateAlerts(appState);

      console.log("✅ Notifikasi siap");
    } catch (error) {
      console.error("❌ Error menginisialisasi notifikasi:", error);
    }
  }

  // Schedule daily reminders
  private async scheduleDailyReminders(appState: AppState): Promise<void> {
    try {
      console.log("⏰ Menjadwalkan pengingat harian...");

      // Morning reminder (7:30 AM)
      await this.sendScheduledNotification({
        title: "🌅 Pagi yang produktif!",
        body: "Jangan lupa catat semua transaksi hari ini untuk tracking yang akurat!",
        hour: 7,
        minute: 30,
        repeats: true,
        data: { type: "MORNING_REMINDER" },
      });

      // Budget check reminder (12:00 PM)
      await this.sendScheduledNotification({
        title: "🍽️ Cek Budget Makan Siang",
        body: "Jangan lupa periksa budget makan siang hari ini",
        hour: 12,
        minute: 0,
        repeats: true,
        data: { type: "MIDDAY_CHECK" },
      });

      // Transaction reminder (3:00 PM)
      await this.sendScheduledNotification({
        title: "📝 Ingat Catat Transaksi",
        body: "Jangan lupa catat semua transaksi yang sudah dilakukan hari ini!",
        hour: 15,
        minute: 0,
        repeats: true,
        data: { type: "TRANSACTION_REMINDER" },
      });

      // Evening summary (8:00 PM)
      const eveningSummary = generateDailySummary(appState);
      await this.sendScheduledNotification({
        title: "🌙 Waktunya Review Harian",
        body: eveningSummary,
        hour: 20,
        minute: 0,
        repeats: true,
        data: { type: "EVENING_SUMMARY" },
      });

      // Random financial tip (10:00 AM)
      const randomTip =
        NotificationMessages.financialTips[
          Math.floor(Math.random() * NotificationMessages.financialTips.length)
        ];
      await this.sendScheduledNotification({
        ...randomTip,
        hour: 10,
        minute: 0,
        repeats: true,
      });

      console.log("✅ Pengingat harian terjadwal");
    } catch (error) {
      console.error("❌ Error menjadwalkan pengingat harian:", error);
    }
  }

  // Send single notification (immediate)
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

  // Send scheduled notification
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

  // Update notifications when app state changes
  async updateNotifications(appState: AppState): Promise<void> {
    try {
      // Check for new alerts based on state changes
      await this.checkImmediateAlerts(appState);

      // Update evening summary if needed
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
    } catch (error) {
      console.error("❌ Error updating notifications:", error);
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
