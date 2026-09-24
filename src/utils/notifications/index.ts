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
  generateDailySummary,
} from "./triggers";
import {
  calculateTotals,
  calculateDailyPlanAllowance,
  formatCurrency,
} from "../calculations";

// Key untuk menyimpan settings & alert cache di AsyncStorage
const NOTIFICATION_SETTINGS_KEY = "@mymoney_notification_settings";
const ALERT_CACHE_PREFIX = "@mymoney_alert_sent_";

// Advanced notification settings types
export interface AdvancedNotificationSettings {
  customSchedule?: {
    morning?: string;
    morningEnabled?: boolean;
    midday?: string;
    middayEnabled?: boolean;
    afternoon?: string;
    afternoonEnabled?: boolean;
    evening?: string;
    eveningEnabled?: boolean;
    financialTip?: string;
    financialTipEnabled?: boolean;
  };
  quietHours?: {
    enabled?: boolean;
    start?: string;
    end?: string;
    ignoreUrgent?: boolean;
  };
  activeDays?: number[]; // [0, 1, 2, 3, 4, 5, 6] (0 = Minggu, 6 = Sabtu)
  vibrationPattern?: "light" | "medium" | "heavy";
  soundEnabled?: boolean;
}

export interface NotificationSettings {
  enabled: boolean; // Master toggle
  quickActionsWidget: boolean; // Sticky widget di notification bar
  dailyReminders: boolean; // Pengingat Rutin Harian (Pagi/Siang/Sore/Malam)
  budgetAlerts: boolean; // Peringatan Limit Anggaran
  savingsProgress: boolean; // Peringatan Target & Milestone Tabungan
  transactionReminders: boolean; // Pengingat Pencatatan & Transaksi Besar
  notesReminders: boolean; // Pengingat Buku Catatan Keuangan
  weeklyReports: boolean; // Laporan Rekap Mingguan
  financialTips: boolean; // Tips & Edukasi Finansial
  transactionRecordedConfirmations: boolean; // Notifikasi toast/push saat mencatat transaksi (default: false agar tidak spam)
  advanced: AdvancedNotificationSettings;
}

// Default settings
export const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  quickActionsWidget: true, // Aktifkan default agar widget muncul di bar notifikasi
  dailyReminders: true,
  budgetAlerts: true,
  savingsProgress: true,
  transactionReminders: true,
  notesReminders: false,
  weeklyReports: true,
  financialTips: true,
  transactionRecordedConfirmations: false,
  advanced: {
    customSchedule: {
      morning: "07:30",
      morningEnabled: true,
      midday: "12:00",
      middayEnabled: true,
      afternoon: "15:00",
      afternoonEnabled: true,
      evening: "20:00",
      eveningEnabled: true,
      financialTip: "10:00",
      financialTipEnabled: true,
    },
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "07:00",
      ignoreUrgent: true, // Urgent alerts (e.g. budget 100% exceeded) bypass quiet hours
    },
    activeDays: [0, 1, 2, 3, 4, 5, 6], // All days active
    vibrationPattern: "medium",
    soundEnabled: true,
  },
};

// Configure notification foreground handler
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isWidget =
      notification.request.identifier === "MYMONEY_QUICK_WIDGET" ||
      notification.request.content.data?.type === "quick_widget";

    return {
      // shouldShowAlert is deprecated — use shouldShowBanner + shouldShowList
      shouldShowBanner: !isWidget,
      shouldShowList: true, // WAJIB TRUE agar widget & notifikasi tetap muncul di tray
      shouldPlaySound: !isWidget,
      shouldSetBadge: !isWidget,
    };
  },
});

export class NotificationService {
  private static instance: NotificationService;
  private sentAlertCooldown: Map<string, number> = new Map();
  private static COOLDOWN_MS = 15 * 60 * 1000; // 15 menit cooldown in-memory

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Check if a notification type/entity key is on cooldown (in-memory)
  private isOnCooldown(key: string): boolean {
    const lastSent = this.sentAlertCooldown.get(key);
    if (!lastSent) return false;
    return Date.now() - lastSent < NotificationService.COOLDOWN_MS;
  }

  private markAsSent(key: string): void {
    this.sentAlertCooldown.set(key, Date.now());
  }

  private clearCooldowns(): void {
    this.sentAlertCooldown.clear();
  }

  // Persistent daily deduplication for automatic alerts (budget warnings, savings milestones)
  private async isAlertSentToday(alertKey: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const storageKey = `${ALERT_CACHE_PREFIX}${today}_${alertKey}`;
      const existing = await AsyncStorage.getItem(storageKey);
      return existing !== null;
    } catch {
      return false;
    }
  }

  private async markAlertSentToday(alertKey: string): Promise<void> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const storageKey = `${ALERT_CACHE_PREFIX}${today}_${alertKey}`;
      await AsyncStorage.setItem(storageKey, "1");
    } catch {}
  }

  // ==================== SETTINGS MANAGEMENT ====================

  async loadSettings(): Promise<NotificationSettings> {
    try {
      const savedSettings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        const loadedAdvanced: AdvancedNotificationSettings = {
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
          quickActionsWidget:
            parsed.quickActionsWidget !== undefined
              ? parsed.quickActionsWidget
              : true,
          advanced: loadedAdvanced,
        };
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: NotificationSettings): Promise<void> {
    try {
      const safeSettings: NotificationSettings = {
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
      console.warn("Gagal menyimpan preferensi notifikasi:", error);
    }
  }

  // Verifikasi apakah suatu tipe notifikasi diizinkan berdasarkan pengaturan pengguna
  async isNotificationTypeEnabled(type: string): Promise<boolean> {
    try {
      const settings = await this.loadSettings();
      if (!settings.enabled) return false;

      const typeMapping: Record<string, keyof NotificationSettings> = {
        // Daily reminders
        MORNING_REMINDER: "dailyReminders",
        DAILY_MORNING: "dailyReminders",
        MIDDAY_CHECK: "dailyReminders",
        AFTERNOON_CHECK: "dailyReminders",
        EVENING_SUMMARY: "dailyReminders",

        // Budget alerts
        BUDGET_WARNING: "budgetAlerts",
        BUDGET_EXCEEDED: "budgetAlerts",
        BUDGET_CREATED: "transactionRecordedConfirmations",
        NEW_BUDGET: "transactionRecordedConfirmations",

        // Savings progress
        SAVINGS_MILESTONE: "savingsProgress",
        SAVINGS_COMPLETE: "savingsProgress",
        SAVINGS_DEADLINE: "savingsProgress",
        SAVINGS_GOAL_REACHED: "savingsProgress",
        NEW_SAVINGS: "transactionRecordedConfirmations",

        // Transaction reminders
        NO_TRANSACTION_TODAY: "transactionReminders",
        LARGE_TRANSACTION: "transactionReminders",
        TRANSACTION_REMINDER: "transactionReminders",
        RECURRING_PROCESSED: "transactionReminders",
        TRANSACTION_RECORDED: "transactionRecordedConfirmations",
        NEW_TRANSACTION: "transactionRecordedConfirmations",
        DEBT_ADDED: "transactionRecordedConfirmations",

        // Financial Tips
        FINANCIAL_TIP: "financialTips",

        // Weekly reports
        WEEKLY_REPORT: "weeklyReports",
        MONTHLY_RESET: "weeklyReports",
        MONTHLY_REVIEW: "weeklyReports",
        MONDAY_MESSAGE: "weeklyReports",
        FRIDAY_MESSAGE: "weeklyReports",
        SUNDAY_MESSAGE: "weeklyReports",

        // Test
        TEST: "enabled",
      };

      const settingKey = typeMapping[type];
      if (settingKey) {
        return settings[settingKey] === true;
      }

      // Jika tipe tidak dikenali dalam preferensi, jangan kirimkan
      return false;
    } catch {
      return false;
    }
  }

  // Cek apakah waktu saat ini / waktu yang ditentukan berada dalam rentang Jam Tenang (Quiet Hours)
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
      return (
        Math.max(0, Math.min(23, hours)) * 60 +
        Math.max(0, Math.min(59, minutes))
      );
    } catch {
      return 0;
    }
  }

  private isActiveDay(activeDays?: number[]): boolean {
    if (!activeDays || activeDays.length === 0) return true;
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    return activeDays.includes(today);
  }

  // ==================== PERMISSION & CHANNELS ====================

  async registerForPushNotificationsAsync(): Promise<boolean> {
    try {
      // 1. Android Notification Channels (Wajib untuk Android 8.0+)
      // Dibungkus per-channel agar NullPointerException pada satu channel
      // tidak membatalkan seluruh proses registrasi.
      if (Platform.OS === "android") {
        // Tunggu sebentar agar ChannelManager Android selesai diinisialisasi
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Channel 1: Default (Rutin, Harian, Tips)
        try {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Pemberitahuan Umum",
            description: "Pengingat harian, tips finansial, dan pengingat pencatatan",
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#22D3EE",
            sound: "default",
            enableVibrate: true,
            showBadge: true,
          });
        } catch (channelErr) {
          console.warn("[Notif] Gagal membuat channel 'default':", channelErr);
        }

        // Channel 2: Urgent Alerts (Limit Anggaran, Tenggat Penting)
        try {
          await Notifications.setNotificationChannelAsync("urgent_alerts", {
            name: "Peringatan Penting & Limit",
            description: "Peringatan anggaran jebol dan tenggat waktu tabungan",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 500, 200, 500],
            lightColor: "#EF4444",
            sound: "default",
            enableVibrate: true,
            showBadge: true,
          });
        } catch (channelErr) {
          console.warn("[Notif] Gagal membuat channel 'urgent_alerts':", channelErr);
        }

        // Channel 3: Widget Layar Atas (Sticky - LOW importance agar tetap tampil di tray)
        try {
          await Notifications.setNotificationChannelAsync("quick_widget", {
            name: "Widget Cepat Layar Atas",
            description: "Status jatah belanja harian & akses catat transaksi cepat",
            importance: Notifications.AndroidImportance.LOW,
            sound: null,
            enableVibrate: false,
            showBadge: false,
            lockscreenVisibility:
              Notifications.AndroidNotificationVisibility.PUBLIC,
          });
        } catch (channelErr) {
          console.warn("[Notif] Gagal membuat channel 'quick_widget':", channelErr);
        }
      }

      // 2. Request permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      // 3. Action categories untuk widget cepat
      try {
        await Notifications.setNotificationCategoryAsync("quick_widget_actions", [
          {
            identifier: "ACTION_ADD_EXPENSE",
            buttonTitle: "➖ Pengeluaran",
            options: { opensAppToForeground: true },
          },
          {
            identifier: "ACTION_ADD_INCOME",
            buttonTitle: "➕ Pemasukan",
            options: { opensAppToForeground: true },
          },
        ]);
      } catch (catErr) {
        console.warn("Gagal mendaftarkan kategori notifikasi:", catErr);
      }

      return finalStatus === "granted";
    } catch (e) {
      console.warn("Gagal register notifikasi:", e);
      return false;
    }
  }

  // ==================== INITIALIZATION & SCHEDULING ====================

  async initialize(appState: AppState): Promise<void> {
    try {
      const settings = await this.loadSettings();

      // Bersihkan jadwal lama dan atur ulang
      await Notifications.cancelAllScheduledNotificationsAsync();

      if (settings.enabled) {
        await this.scheduleDailyReminders(appState);
        await this.checkImmediateAlerts(appState);
        if (settings.quickActionsWidget) {
          await this.updateQuickActionWidget(appState);
        } else {
          await this.dismissQuickActionWidget();
        }
      } else {
        await this.dismissQuickActionWidget();
      }
    } catch (error) {
      console.warn("Error saat inisialisasi notifikasi:", error);
    }
  }

  // Menjadwalkan pengingat berulang (AlarmManager di Android & Calendar di iOS)
  private async scheduleDailyReminders(appState: AppState): Promise<void> {
    try {
      const settings = await this.loadSettings();
      if (!settings.enabled) return;

      const activeDays = settings.advanced?.activeDays || [0, 1, 2, 3, 4, 5, 6];
      if (activeDays.length === 0) return;

      const scheduleConfig = settings.advanced?.customSchedule || {};
      const allDaysActive = activeDays.length === 7;

      // Helper untuk mendaftarkan jadwal ke OS
      const scheduleRoutine = async ({
        title,
        body,
        timeStr,
        type,
      }: {
        title: string;
        body: string;
        timeStr: string;
        type: string;
      }) => {
        const [hour, minute] = timeStr.split(":").map(Number);
        if (isNaN(hour) || isNaN(minute)) return;

        if (allDaysActive) {
          // Jadwalkan 1 alarm harian berulang (Lebih hemat resource)
          await this.sendScheduledNotification({
            title,
            body,
            hour,
            minute,
            repeats: true,
            data: { type },
          });
        } else {
          // Jadwalkan untuk setiap hari aktif yang dipilih pengguna (1=Minggu, 7=Sabtu di Expo)
          for (const day of activeDays) {
            const expoWeekday = day + 1;
            await this.sendScheduledNotification({
              title,
              body,
              hour,
              minute,
              weekday: expoWeekday,
              repeats: true,
              data: { type },
            });
          }
        }
      };

      // 1. Pengingat Pagi (Morning Routine)
      if (
        settings.dailyReminders &&
        scheduleConfig.morningEnabled !== false
      ) {
        await scheduleRoutine({
          title: "🌅 Pagi yang produktif!",
          body: "Jangan lupa catat semua transaksi hari ini untuk tracking yang akurat!",
          timeStr: scheduleConfig.morning || "07:30",
          type: "MORNING_REMINDER",
        });
      }

      // 2. Cek Pengeluaran Siang (Midday)
      if (
        settings.dailyReminders &&
        scheduleConfig.middayEnabled !== false
      ) {
        await scheduleRoutine({
          title: "🍽️ Cek Pengeluaran Siang",
          body: "Sudah mencatat makan siang atau pengeluaran pagi ini?",
          timeStr: scheduleConfig.midday || "12:00",
          type: "MIDDAY_CHECK",
        });
      }

      // 3. Pengingat Sore (Afternoon)
      if (
        settings.dailyReminders &&
        scheduleConfig.afternoonEnabled !== false
      ) {
        await scheduleRoutine({
          title: "📝 Pengingat Sore",
          body: "Yuk luangkan 1 menit untuk catat transaksi Anda hari ini!",
          timeStr: scheduleConfig.afternoon || "15:00",
          type: "AFTERNOON_CHECK",
        });
      }

      // 4. Rekapitulasi Malam (Evening Summary)
      if (
        settings.dailyReminders &&
        scheduleConfig.eveningEnabled !== false
      ) {
        const eveningSummary = generateDailySummary(appState);
        await scheduleRoutine({
          title: "🌙 Waktunya Review Harian",
          body: eveningSummary,
          timeStr: scheduleConfig.evening || "20:00",
          type: "EVENING_SUMMARY",
        });
      }

      // 5. Tips Finansial Berkala
      if (
        settings.financialTips &&
        scheduleConfig.financialTipEnabled !== false
      ) {
        const randomTip =
          NotificationMessages.financialTips[
            Math.floor(Math.random() * NotificationMessages.financialTips.length)
          ];
        await scheduleRoutine({
          title: randomTip.title,
          body: randomTip.body,
          timeStr: scheduleConfig.financialTip || "10:00",
          type: "FINANCIAL_TIP",
        });
      }

      // 6. Laporan Rekap Mingguan (Setiap Hari Minggu Pukul 19:30)
      if (settings.weeklyReports) {
        await this.sendScheduledNotification({
          title: "📊 Laporan Evaluasi Mingguan",
          body: "Buka MyMoney untuk melihat rangkuman pengeluaran & tabungan minggu ini!",
          hour: 19,
          minute: 30,
          weekday: 1, // Minggu
          repeats: true,
          data: { type: "WEEKLY_REPORT" },
        });
      }
    } catch (error) {
      console.warn("Gagal mengatur jadwal notifikasi berulang:", error);
    }
  }

  // ==================== NOTIFICATION SENDING ====================

  // Mengirim notifikasi langsung (Immediate Alert)
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

      // 1. Cek master switch
      if (!settings.enabled) return;

      // 2. Cek apakah tipe notifikasi ini diizinkan
      if (data.type && !(await this.isNotificationTypeEnabled(data.type))) {
        return;
      }

      // 3. Dedup: Jangan kirim alert yang sama berulang kali dalam waktu singkat
      const cooldownKey = data?.budgetId
        ? `${data.type}_${data.budgetId}_${data.tier || ""}`
        : data?.savingsId
          ? `${data.type}_${data.savingsId}`
          : data?.type || "general";

      if (this.isOnCooldown(cooldownKey)) {
        return;
      }

      // 4. Cek Jam Tenang (Quiet Hours)
      const isUrgent =
        urgent ||
        data?.type === "BUDGET_EXCEEDED" ||
        data?.tier === "90" ||
        data?.type === "SAVINGS_DEADLINE";

      if (
        settings.advanced?.quietHours?.enabled &&
        this.isWithinQuietHours(settings.advanced.quietHours)
      ) {
        // Jika urgent dan ignoreUrgent aktif, perbolehkan tembus
        if (!isUrgent || !settings.advanced.quietHours.ignoreUrgent) {
          return;
        }
      }

      // 5. Cek Hari Aktif
      if (!this.isActiveDay(settings.advanced?.activeDays)) {
        return;
      }

      const useSound =
        settings.advanced?.soundEnabled !== false ? sound : false;
      const channelId = isUrgent ? "urgent_alerts" : "default";

      const vibrationPattern =
        settings.advanced?.vibrationPattern === "light"
          ? [0, 150]
          : settings.advanced?.vibrationPattern === "heavy"
            ? [0, 500, 200, 500]
            : [0, 250, 250, 250];

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: useSound,
          vibrate: vibrationPattern,
          ...(Platform.OS === "android" ? { channelId } : {}),
        },
        trigger: null, // Segera tampilkan
      });

      this.markAsSent(cooldownKey);
    } catch (error) {
      console.warn("Gagal mengirim notifikasi langsung:", error);
    }
  }

  // Menjadwalkan notifikasi di masa depan (OS ALARM LEVEL)
  async sendScheduledNotification({
    title,
    body,
    hour,
    minute,
    weekday,
    repeats = true,
    data = {},
  }: {
    title: string;
    body: string;
    hour: number;
    minute: number;
    weekday?: number; // 1 = Sunday ... 7 = Saturday
    repeats?: boolean;
    data?: any;
  }): Promise<string | null> {
    try {
      const settings = await this.loadSettings();

      // 1. Cek master switch
      if (!settings.enabled) return null;

      // 2. Cek apakah tipe notifikasi ini aktif
      if (data.type && !(await this.isNotificationTypeEnabled(data.type))) {
        return null;
      }

      // 3. Cek Jam Tenang untuk waktu yang dijadwalkan
      if (this.isWithinQuietHours(settings.advanced?.quietHours, hour, minute)) {
        return null;
      }

      const isUrgent =
        data.type === "BUDGET_EXCEEDED" || data.type === "SAVINGS_DEADLINE";
      const channelId = isUrgent ? "urgent_alerts" : "default";

      // 4. TRIGGER PEMBAHARUAN (KRITIKAL: Android menggunakan DAILY/WEEKLY, iOS menggunakan CALENDAR)
      let trigger: Notifications.NotificationTriggerInput;

      if (Platform.OS === "android") {
        if (weekday !== undefined) {
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            channelId,
            weekday,
            hour,
            minute,
          };
        } else {
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            channelId,
            hour,
            minute,
          };
        }
      } else {
        // iOS: UNCalendarNotificationTrigger
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          ...(weekday !== undefined ? { weekday } : {}),
          hour,
          minute,
          repeats,
        };
      }

      const vibrationPattern =
        settings.advanced?.vibrationPattern === "light"
          ? [0, 150]
          : settings.advanced?.vibrationPattern === "heavy"
            ? [0, 500, 200, 500]
            : [0, 250, 250, 250];

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: settings.advanced?.soundEnabled !== false,
          vibrate: vibrationPattern,
          ...(Platform.OS === "android" ? { channelId } : {}),
        },
        trigger,
      });

      return id;
    } catch (error) {
      console.warn("Gagal menjadwalkan alarm notifikasi:", error);
      return null;
    }
  }

  // ==================== ALERTS & DEDUPLICATION ====================

  // Memeriksa dan mengirim peringatan sistem (dengan dedup per-hari agar tidak spam saat buka aplikasi)
  async checkImmediateAlerts(appState: AppState): Promise<void> {
    try {
      const settings = await this.loadSettings();
      if (!settings.enabled) return;

      const budgetAlerts = settings.budgetAlerts
        ? await checkBudgetAlerts(appState)
        : [];
      const savingsAlerts = settings.savingsProgress
        ? await checkSavingsProgress(appState)
        : [];

      // Hanya evaluasi peringatan kritis (anggaran & tabungan).
      // Pengingat pencatatan harian berjalan otomatis via alarm OS terjadwal.
      const allAlerts = [
        ...budgetAlerts,
        ...savingsAlerts,
      ];

      for (const alert of allAlerts) {
        // Buat ID unik untuk alert ini berdasarkan entity ID & tipe alert
        // Sertakan tier (80/90) agar 90% tidak terblokir oleh 80% pada hari yang sama
        const tier = alert.data?.tier ? `_${alert.data.tier}` : "";
        const alertKey = alert.data?.budgetId
          ? `budget_${alert.data.budgetId}_${alert.data.type}${tier}`
          : alert.data?.savingsId
            ? `savings_${alert.data.savingsId}_${alert.data.type}`
            : alert.data?.type || "generic_alert";

        // Cek apakah alert ini sudah pernah ditampilkan kepada pengguna hari ini
        const alreadySentToday = await this.isAlertSentToday(alertKey);
        if (alreadySentToday) {
          continue; // Lewati, jangan spam pengguna setiap kali buka app
        }

        // 90% kritis & melebihi batas = urgent (channel MAX importance)
        const isUrgent =
          alert.data?.type === "BUDGET_EXCEEDED" ||
          alert.data?.tier === "90" ||
          alert.data?.type === "SAVINGS_DEADLINE";

        await this.sendNotification({
          ...alert,
          urgent: isUrgent,
        });

        // Tandai sudah terkirim hari ini
        await this.markAlertSentToday(alertKey);
      }
    } catch (error) {
      console.warn("Error saat memeriksa alert otomatis:", error);
    }
  }

  // ==================== UTILITY & DIAGNOSTICS ====================

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await this.dismissQuickActionWidget();
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  async reinitializeNotifications(appState: AppState): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.clearCooldowns();

      const settings = await this.loadSettings();
      if (settings.enabled) {
        await this.scheduleDailyReminders(appState);
        if (settings.quickActionsWidget) {
          await this.updateQuickActionWidget(appState);
        } else {
          await this.dismissQuickActionWidget();
        }
      } else {
        await this.dismissQuickActionWidget();
      }
    } catch (error) {
      console.warn("Gagal inisialisasi ulang notifikasi:", error);
    }
  }

  async updateNotifications(appState: AppState): Promise<void> {
    try {
      const settings = await this.loadSettings();
      if (!settings.enabled) return;

      // Selalu evaluasi peringatan anggaran/tabungan saat ada perubahan data
      // (dipanggil setiap addTransaction/editTransaction/addBudget, dll.)
      await this.checkImmediateAlerts(appState);

      if (settings.quickActionsWidget) {
        await this.updateQuickActionWidget(appState);
      }
    } catch (error) {
      console.warn("Gagal update notifikasi:", error);
    }
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    return await this.loadSettings();
  }

  // Memperbarui preferensi pengguna dan menyinkronkan alarm tanpa memicu notifikasi pop-up/suara instan
  async updateNotificationSettings(
    newSettings: NotificationSettings,
    appState?: AppState
  ): Promise<void> {
    try {
      const oldSettings = await this.loadSettings();
      await this.saveSettings(newSettings);

      // 1. Jika master notifikasi dimatikan, bersihkan semua jadwal & hilangkan widget
      if (!newSettings.enabled) {
        await Notifications.cancelAllScheduledNotificationsAsync();
        await this.dismissQuickActionWidget();
        return;
      }

      // 2. Perbarui atau sembunyikan widget sesuai pengaturan baru
      if (!newSettings.quickActionsWidget) {
        await this.dismissQuickActionWidget();
      } else if (appState) {
        // Selalu refresh widget saat quickActionsWidget aktif (baik baru diaktifkan maupun sudah aktif)
        await this.updateQuickActionWidget(appState);
      }

      // 3. Sinkronkan jadwal alarm masa depan di background OS tanpa menimbulkan suara
      if (appState) {
        await Notifications.cancelAllScheduledNotificationsAsync();
        await this.scheduleDailyReminders(appState);
        // Evaluasi peringatan kritis setelah settings berubah
        await this.checkImmediateAlerts(appState);
      }
    } catch (error) {
      console.warn("Gagal memperbarui pengaturan notifikasi:", error);
    }
  }

  // Notifikasi Uji Coba (Test Notification)
  async sendTestNotification(): Promise<void> {
    const settings = await this.loadSettings();
    if (!settings.enabled) {
      throw new Error("Aktifkan sakelar master notifikasi terlebih dahulu");
    }

    const sound = settings.advanced?.soundEnabled !== false;
    const vibrationPattern =
      settings.advanced?.vibrationPattern === "light"
        ? [0, 150]
        : settings.advanced?.vibrationPattern === "heavy"
          ? [0, 500, 200, 500]
          : [0, 250, 250, 250];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔔 Tes Notifikasi MyMoney Berhasil!",
        body: `Sistem notifikasi aktif sempurna dengan suara: ${sound ? "Nyala" : "Mati"} & getaran: ${settings.advanced?.vibrationPattern || "medium"}.`,
        data: { type: "TEST" },
        sound,
        vibrate: vibrationPattern,
        ...(Platform.OS === "android" ? { channelId: "default" } : {}),
      },
      trigger: null,
    });
  }

  // ==================== QUICK ACTION NOTIFICATION TRAY ====================

  async updateQuickActionWidget(appState: AppState): Promise<void> {
    try {
      const settings = await this.loadSettings();

      if (!settings.enabled || settings.quickActionsWidget === false) {
        await this.dismissQuickActionWidget();
        return;
      }

      const totals = calculateTotals(appState.transactions);
      const planSummary = calculateDailyPlanAllowance(
        appState.dailyPlans || [],
        appState.transactions
      );

      let title = "";
      let body = "";

      if (planSummary.activePlans.length) {
        const daysRemaining = planSummary.nearestDaysRemaining;
        const dailyPacing = Math.max(0, Math.round(planSummary.dailyAmount));
        const pacingText = formatCurrency(dailyPacing);
        const balanceText = formatCurrency(totals.balance);

        title = `Jatah Belanja Aman: ${pacingText}/hari`;
        body =
          daysRemaining <= 1
            ? `Hari terakhir pembukuan • Saldo: ${balanceText}`
            : `Sisa ${daysRemaining} hari lagi • Saldo: ${balanceText}`;
      } else {
        const balanceText = formatCurrency(totals.balance);
        const expenseText = formatCurrency(totals.totalExpense);
        title = `MyMoney • Saldo Kas: ${balanceText}`;
        body = `Total Pengeluaran: ${expenseText} • Ketuk untuk catat`;
      }

      await Notifications.scheduleNotificationAsync({
        identifier: "MYMONEY_QUICK_WIDGET",
        content: {
          title,
          body,
          categoryIdentifier: "quick_widget_actions",
          sticky: true,
          autoDismiss: false,
          sound: false,
          vibrate: [],
          data: { type: "quick_widget" },
          ...(Platform.OS === "android" ? { channelId: "quick_widget" } : {}),
        },
        trigger: null,
      });
    } catch (error) {
      console.warn("Gagal memperbarui widget notifikasi cepat:", error);
    }
  }

  async dismissQuickActionWidget(): Promise<void> {
    try {
      await Notifications.dismissNotificationAsync("MYMONEY_QUICK_WIDGET").catch(
        () => {}
      );
    } catch {}
  }
}

export const notificationService = NotificationService.getInstance();
