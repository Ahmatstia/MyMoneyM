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
import { notificationService } from "../../utils/notifications";

const NotificationSettingsScreen = () => {
  const [settings, setSettings] = useState({
    dailyReminders: true,
    budgetAlerts: true,
    savingsProgress: true,
    transactionReminders: true,
    notesReminders: true,
    weeklyReports: true,
    financialTips: true,
  });

  const [hasPermission, setHasPermission] = useState(false);
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>(
    []
  );

  useEffect(() => {
    checkPermission();
    loadScheduledNotifications();
  }, []);

  const checkPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const loadScheduledNotifications = async () => {
    const notifications = await notificationService.getScheduledNotifications();
    setScheduledNotifications(notifications);
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

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const testNotification = async () => {
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

        {/* Permission Section */}
        <View style={tw`bg-[#1E293B] rounded-xl p-5 mb-6`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <View>
              <Text style={tw`text-white text-lg font-semibold`}>
                Izin Notifikasi
              </Text>
              <Text style={tw`text-[#94A3B8] text-sm mt-1`}>
                {hasPermission
                  ? "Izin sudah diberikan"
                  : "Izin belum diberikan"}
              </Text>
            </View>
            <View style={tw`flex-row items-center`}>
              <View
                style={tw`w-3 h-3 rounded-full mr-2 ${
                  hasPermission ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <Text style={tw`text-white`}>
                {hasPermission ? "Aktif" : "Nonaktif"}
              </Text>
            </View>
          </View>

          {!hasPermission ? (
            <TouchableOpacity
              style={tw`bg-[#22D3EE] py-3 rounded-lg items-center`}
              onPress={requestPermission}
            >
              <Text style={tw`text-white font-semibold`}>Berikan Izin</Text>
            </TouchableOpacity>
          ) : (
            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                style={tw`flex-1 bg-[#334155] py-3 rounded-lg items-center`}
                onPress={testNotification}
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

        {/* Notification Types */}
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
                {getDescription(key as keyof typeof settings)}
              </Text>
            </View>
            <Switch
              value={settings[key as keyof typeof settings]}
              onValueChange={() => toggleSetting(key as keyof typeof settings)}
              trackColor={{ false: "#64748B", true: "#22D3EE" }}
              thumbColor="#FFFFFF"
            />
          </View>
        ))}

        {/* Scheduled Notifications */}
        <View style={tw`mt-8`}>
          <Text style={tw`text-white text-lg font-semibold mb-4`}>
            Notifikasi Terjadwal ({scheduledNotifications.length})
          </Text>

          {scheduledNotifications.length === 0 ? (
            <View style={tw`bg-[#1E293B] rounded-xl p-6 items-center`}>
              <Ionicons name="notifications-off" size={48} color="#64748B" />
              <Text style={tw`text-white mt-3`}>
                Tidak ada notifikasi terjadwal
              </Text>
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
  };
  return descriptions[key] || "";
};

export default NotificationSettingsScreen;
