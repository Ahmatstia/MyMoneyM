import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { notificationService } from "../../utils/notifications";

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

const NotificationSettingsScreen = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hasPermission, setHasPermission] = useState(false);
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    checkPermission();
    loadScheduledNotifications();
  }, []);

  // Load settings dari AsyncStorage
  const loadSettings = async () => {
    try {
      const savedSettings = await notificationService.getNotificationSettings();
      setSettings(savedSettings);
    } catch (error) {
      console.error("❌ Error loading notification settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save settings ke AsyncStorage
  const saveSettings = async (newSettings: typeof DEFAULT_SETTINGS) => {
    try {
      // Save ke service (yang akan handle reinitialize)
      await notificationService.updateNotificationSettings(newSettings);
      setSettings(newSettings);

      Alert.alert("Berhasil", "Pengaturan notifikasi telah diperbarui", [
        { text: "OK" },
      ]);
    } catch (error) {
      console.error("❌ Error saving notification settings:", error);
      Alert.alert("Error", "Gagal menyimpan pengaturan notifikasi");
    }
  };

  // Update scheduled notifications berdasarkan settings
  const updateScheduledNotifications = async (
    currentSettings: typeof DEFAULT_SETTINGS
  ) => {
    try {
      const scheduled = await notificationService.getScheduledNotifications();

      // Jika notifications disabled secara keseluruhan, cancel semua
      if (!currentSettings.enabled) {
        await notificationService.cancelAllNotifications();
        return;
      }

      // Cancel specific notifications berdasarkan settings
      for (const notification of scheduled) {
        const notificationType = notification.content.data?.type;

        switch (notificationType) {
          case "MORNING_REMINDER":
          case "MIDDAY_CHECK":
          case "TRANSACTION_REMINDER":
          case "EVENING_SUMMARY":
            if (!currentSettings.dailyReminders) {
              await Notifications.cancelScheduledNotificationAsync(
                notification.identifier
              );
            }
            break;

          case "BUDGET_WARNING":
          case "BUDGET_EXCEEDED":
            if (!currentSettings.budgetAlerts) {
              await Notifications.cancelScheduledNotificationAsync(
                notification.identifier
              );
            }
            break;

          case "SAVINGS_MILESTONE":
          case "SAVINGS_COMPLETE":
          case "SAVINGS_DEADLINE":
            if (!currentSettings.savingsProgress) {
              await Notifications.cancelScheduledNotificationAsync(
                notification.identifier
              );
            }
            break;

          case "NO_TRANSACTION_TODAY":
          case "LARGE_TRANSACTION":
            if (!currentSettings.transactionReminders) {
              await Notifications.cancelScheduledNotificationAsync(
                notification.identifier
              );
            }
            break;

          case "NOTES_REMINDER":
          case "IMPORTANT_NOTES":
            if (!currentSettings.notesReminders) {
              await Notifications.cancelScheduledNotificationAsync(
                notification.identifier
              );
            }
            break;

          case "FINANCIAL_TIP":
            if (!currentSettings.financialTips) {
              await Notifications.cancelScheduledNotificationAsync(
                notification.identifier
              );
            }
            break;
        }
      }

      // Reload scheduled notifications
      await loadScheduledNotifications();
    } catch (error) {
      console.error("❌ Error updating scheduled notifications:", error);
    }
  };

  const checkPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const loadScheduledNotifications = async () => {
    try {
      const notifications =
        await notificationService.getScheduledNotifications();
      setScheduledNotifications(notifications);
    } catch (error) {
      console.error("❌ Error loading scheduled notifications:", error);
    }
  };

  const requestPermission = async () => {
    const granted =
      await notificationService.registerForPushNotificationsAsync();
    setHasPermission(granted);

    if (!granted) {
      Alert.alert(
        "Izin Dibutuhkan",
        "Untuk mengirim notifikasi, aplikasi membutuhkan izin. Silakan aktifkan di pengaturan perangkat.",
        [
          { text: "OK" },
          { text: "Buka Pengaturan", onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  // Master toggle - enable/disable semua notifikasi
  const toggleMasterSwitch = async (value: boolean) => {
    const newSettings = { ...settings, enabled: value };
    await saveSettings(newSettings);

    if (!value) {
      // Jika dimatikan, cancel semua scheduled notifications
      await notificationService.cancelAllNotifications();
      Alert.alert(
        "Notifikasi Dimatikan",
        "Semua notifikasi telah dimatikan. Tidak akan ada pengingat atau alert yang dikirim."
      );
    } else {
      // Jika dihidupkan, schedule ulang berdasarkan settings
      // (Ini butuh re-initialize dengan current app state)
      Alert.alert(
        "Notifikasi Dihidupkan",
        "Notifikasi akan aktif sesuai pengaturan masing-masing tipe."
      );
    }
  };

  // Toggle specific setting
  const toggleSetting = async (key: keyof typeof DEFAULT_SETTINGS) => {
    // Skip jika master switch mati
    if (!settings.enabled && key !== "enabled") {
      Alert.alert(
        "Notifikasi Dimatikan",
        "Aktifkan notifikasi terlebih dahulu untuk mengatur jenis notifikasi."
      );
      return;
    }

    const newSettings = { ...settings, [key]: !settings[key] };
    await saveSettings(newSettings);
  };

  const testNotification = async () => {
    // Cek apakah notifications enabled
    if (!settings.enabled) {
      Alert.alert(
        "Notifikasi Dimatikan",
        "Aktifkan notifikasi terlebih dahulu untuk testing."
      );
      return;
    }

    await notificationService.sendNotification({
      title: "🔔 Test Notification",
      body: "Ini adalah notifikasi test dari MyMoney!",
      data: { type: "TEST" },
    });
    Alert.alert("Berhasil", "Notifikasi test terkirim!");
  };

  const clearAllNotifications = async () => {
    await notificationService.cancelAllNotifications();
    await loadScheduledNotifications();
    Alert.alert("Berhasil", "Semua notifikasi dibersihkan");
  };

  const resetToDefaults = async () => {
    Alert.alert(
      "Reset Pengaturan",
      "Apakah Anda yakin ingin mengembalikan pengaturan notifikasi ke default?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await saveSettings(DEFAULT_SETTINGS);
            Alert.alert("Berhasil", "Pengaturan telah direset ke default");
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 bg-[#0F172A] justify-center items-center`}>
        <Ionicons name="notifications" size={48} color="#22D3EE" />
        <Text style={tw`text-white mt-4`}>Memuat pengaturan...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={tw`flex-1 bg-[#0F172A]`}>
      <View style={tw`p-6`}>
        {/* Header */}
        <View style={tw`mb-8`}>
          <Text style={tw`text-2xl font-bold text-white mb-2`}>
            Pengaturan Notifikasi
          </Text>
          <Text style={tw`text-[#CBD5E1]`}>
            Kelola notifikasi dan pengingat keuangan
          </Text>
        </View>

        {/* Master Switch Section */}
        <View style={tw`bg-[#1E293B] rounded-xl p-5 mb-6`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <View>
              <Text style={tw`text-white text-lg font-semibold`}>
                Notifikasi
              </Text>
              <Text style={tw`text-[#94A3B8] text-sm mt-1`}>
                {settings.enabled ? "Aktif" : "Nonaktif"} •{" "}
                {hasPermission ? "Izin diberikan" : "Izin dibutuhkan"}
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={toggleMasterSwitch}
              trackColor={{ false: "#64748B", true: "#22D3EE" }}
              thumbColor="#FFFFFF"
            />
          </View>

          {!hasPermission ? (
            <TouchableOpacity
              style={tw`bg-[#22D3EE] py-3 rounded-lg items-center`}
              onPress={requestPermission}
              disabled={!settings.enabled}
            >
              <Text style={tw`text-white font-semibold`}>Berikan Izin</Text>
            </TouchableOpacity>
          ) : (
            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                style={tw`flex-1 bg-[#334155] py-3 rounded-lg items-center ${
                  !settings.enabled ? "opacity-50" : ""
                }`}
                onPress={testNotification}
                disabled={!settings.enabled}
              >
                <Text style={tw`text-white font-semibold`}>
                  Test Notifikasi
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 bg-[#EF4444] py-3 rounded-lg items-center`}
                onPress={clearAllNotifications}
              >
                <Text style={tw`text-white font-semibold`}>Hapus Semua</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Notification Types - Hanya tampil jika notifications enabled */}
        {settings.enabled && (
          <>
            <Text style={tw`text-white text-lg font-semibold mb-4`}>
              Jenis Notifikasi
            </Text>

            {Object.entries({
              dailyReminders: "Pengingat Harian",
              budgetAlerts: "Alert Budget",
              savingsProgress: "Progress Tabungan",
              transactionReminders: "Pengingat Transaksi",
              notesReminders: "Pengingat Catatan",
              weeklyReports: "Laporan Mingguan",
              financialTips: "Tips Finansial",
            }).map(([key, label]) => (
              <View
                key={key}
                style={tw`flex-row items-center justify-between bg-[#1E293B] rounded-xl p-4 mb-3`}
              >
                <View style={tw`flex-1`}>
                  <Text style={tw`text-white font-medium`}>{label}</Text>
                  <Text style={tw`text-[#94A3B8] text-sm mt-1`}>
                    {getDescription(key as keyof typeof DEFAULT_SETTINGS)}
                  </Text>
                </View>
                <Switch
                  value={
                    settings[key as keyof typeof DEFAULT_SETTINGS] as boolean
                  }
                  onValueChange={() =>
                    toggleSetting(key as keyof typeof DEFAULT_SETTINGS)
                  }
                  trackColor={{ false: "#64748B", true: "#22D3EE" }}
                  thumbColor="#FFFFFF"
                  disabled={!settings.enabled}
                />
              </View>
            ))}

            {/* Reset Button */}
            <TouchableOpacity
              style={tw`bg-[#334155] py-3 rounded-lg items-center mt-4`}
              onPress={resetToDefaults}
            >
              <Text style={tw`text-white font-semibold`}>Reset ke Default</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Scheduled Notifications */}
        <View style={tw`mt-8`}>
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text style={tw`text-white text-lg font-semibold`}>
              Notifikasi Terjadwal ({scheduledNotifications.length})
            </Text>
            <TouchableOpacity onPress={loadScheduledNotifications}>
              <Ionicons name="refresh" size={20} color="#22D3EE" />
            </TouchableOpacity>
          </View>

          {scheduledNotifications.length === 0 ? (
            <View style={tw`bg-[#1E293B] rounded-xl p-6 items-center`}>
              <Ionicons
                name={settings.enabled ? "notifications-off" : "notifications"}
                size={48}
                color="#64748B"
              />
              <Text style={tw`text-white mt-3 text-center`}>
                {settings.enabled
                  ? "Tidak ada notifikasi terjadwal"
                  : "Notifikasi dimatikan"}
              </Text>
              {!settings.enabled && (
                <Text style={tw`text-[#94A3B8] text-sm mt-2 text-center`}>
                  Aktifkan notifikasi untuk menjadwalkan pengingat
                </Text>
              )}
            </View>
          ) : (
            scheduledNotifications.map((notification, index) => (
              <View key={index} style={tw`bg-[#1E293B] rounded-xl p-4 mb-3`}>
                <View style={tw`flex-row justify-between items-start mb-2`}>
                  <Text style={tw`text-white font-medium flex-1`}>
                    {notification.content.title}
                  </Text>
                  <Text style={tw`text-[#22D3EE] text-xs`}>
                    {notification.trigger.type === "daily"
                      ? "Harian"
                      : "Sekali"}
                  </Text>
                </View>
                <Text style={tw`text-[#94A3B8] text-sm`}>
                  {notification.content.body}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const getDescription = (key: string): string => {
  const descriptions: Record<string, string> = {
    dailyReminders: "Pengingat pagi, siang, dan malam",
    budgetAlerts: "Alert ketika budget hampir habis",
    savingsProgress: "Update progress tabungan",
    transactionReminders: "Pengingat catat transaksi",
    notesReminders: "Pengingat buat catatan finansial",
    weeklyReports: "Laporan mingguan setiap Minggu",
    financialTips: "Tips finansial acak setiap hari",
    enabled: "Aktifkan/matikan semua notifikasi",
  };
  return descriptions[key] || "";
};

export default NotificationSettingsScreen;
