import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { notificationService } from "../../utils/notifications";
import { useAppContext } from "../../context/AppContext";
import DateTimePicker from "@react-native-community/datetimepicker";

// Key untuk menyimpan settings
const APP_SETTINGS_KEY = "@mymoney_app_settings";

// Advanced notification settings types
interface AdvancedNotificationSettings {
  customSchedule?: {
    morning?: string;
    morningEnabled?: boolean;
    evening?: string;
    eveningEnabled?: boolean;
    financialTip?: string;
    financialTipEnabled?: boolean;
  };
  quietHours?: {
    enabled?: boolean; // FIX: ubah menjadi optional
    start?: string;
    end?: string;
    ignoreUrgent?: boolean;
  };
  activeDays?: number[];
  vibrationPattern?: "light" | "medium" | "heavy";
  soundEnabled?: boolean;
}

// Default notification settings
const DEFAULT_NOTIFICATION_SETTINGS = {
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

// Default app settings
const DEFAULT_APP_SETTINGS = {
  currency: "IDR",
  language: "id",
  theme: "dark",
  biometricLogin: false,
  autoBackup: false,
  showBalance: true,
  hapticFeedback: true,
};

// TimePicker Component (sama seperti sebelumnya)
const TimePickerModal = ({
  visible,
  onClose,
  onTimeSelected,
  initialTime = "07:00",
  title = "Pilih Waktu",
}: {
  visible: boolean;
  onClose: () => void;
  onTimeSelected: (time: string) => void;
  initialTime?: string;
  title?: string;
}) => {
  const [selectedTime, setSelectedTime] = useState(() => {
    const [hours, minutes] = initialTime.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  });

  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState<"time" | "date">("time");

  const handleTimeChange = (event: any, time?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    if (time) {
      setSelectedTime(time);

      // Untuk Android, langsung simpan saat user pilih waktu
      if (Platform.OS === "android" && event.type === "set") {
        const hours = time.getHours().toString().padStart(2, "0");
        const minutes = time.getMinutes().toString().padStart(2, "0");
        onTimeSelected(`${hours}:${minutes}`);
        onClose();
      }
    } else if (Platform.OS === "android") {
      // User cancel di Android
      onClose();
    }
  };

  const handleConfirm = () => {
    const hours = selectedTime.getHours().toString().padStart(2, "0");
    const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
    onTimeSelected(`${hours}:${minutes}`);
    onClose();
  };

  const showAndroidPicker = () => {
    setShowPicker(true);
  };

  // Untuk iOS, kita buat modal custom dengan DateTimePicker di dalamnya
  if (Platform.OS === "ios") {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={tw`flex-1 bg-black/50 justify-end`}>
          <View style={tw`bg-[#1E293B] rounded-t-3xl`}>
            {/* Header */}
            <View
              style={tw`flex-row items-center justify-between p-6 border-b border-[#334155]`}
            >
              <Text style={tw`text-white text-lg font-semibold`}>{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#CBD5E1" />
              </TouchableOpacity>
            </View>

            {/* DateTimePicker untuk iOS */}
            <View style={tw`p-6`}>
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                style={tw`w-full`}
                textColor="#FFFFFF"
                themeVariant="dark"
              />

              <View style={tw`mt-6 items-center`}>
                <Text style={tw`text-white text-4xl font-bold`}>
                  {selectedTime.getHours().toString().padStart(2, "0")}:
                  {selectedTime.getMinutes().toString().padStart(2, "0")}
                </Text>
              </View>
            </View>

            {/* Action Buttons untuk iOS */}
            <View style={tw`flex-row p-6 border-t border-[#334155]`}>
              <TouchableOpacity
                style={tw`flex-1 bg-[#334155] py-3 rounded-lg mr-3 items-center`}
                onPress={onClose}
              >
                <Text style={tw`text-white font-medium`}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 bg-[#22D3EE] py-3 rounded-lg items-center`}
                onPress={handleConfirm}
              >
                <Text style={tw`text-white font-semibold`}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Untuk Android, tampilkan DateTimePicker langsung
  if (Platform.OS === "android" && showPicker) {
    return (
      <DateTimePicker
        value={selectedTime}
        mode="time"
        display="default"
        onChange={handleTimeChange}
        themeVariant="dark"
      />
    );
  }

  // Untuk Android - Modal dengan button untuk trigger DateTimePicker
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 bg-black/50 justify-center items-center`}>
        <View style={tw`bg-[#1E293B] rounded-2xl w-11/12 max-w-md`}>
          <View style={tw`p-6`}>
            <Text style={tw`text-white text-xl font-bold text-center mb-2`}>
              {title}
            </Text>
            <Text style={tw`text-[#94A3B8] text-center mb-6`}>
              Pilih waktu notifikasi
            </Text>

            <View style={tw`items-center mb-6`}>
              <Text style={tw`text-white text-5xl font-bold`}>
                {selectedTime.getHours().toString().padStart(2, "0")}:
                {selectedTime.getMinutes().toString().padStart(2, "0")}
              </Text>
            </View>

            {/* Quick Time Presets untuk Android */}
            <View style={tw`flex-row flex-wrap justify-center gap-2 mb-6`}>
              {["07:30", "12:00", "15:00", "20:00", "22:00"].map((time) => {
                const [hours, minutes] = time.split(":").map(Number);
                const isSelected =
                  selectedTime.getHours() === hours &&
                  selectedTime.getMinutes() === minutes;

                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      tw`px-4 py-2 rounded-lg`,
                      isSelected ? tw`bg-[#22D3EE]` : tw`bg-[#334155]`,
                    ]}
                    onPress={() => {
                      const date = new Date();
                      date.setHours(hours, minutes, 0, 0);
                      setSelectedTime(date);
                    }}
                  >
                    <Text
                      style={[
                        tw`font-medium`,
                        isSelected ? tw`text-white` : tw`text-[#CBD5E1]`,
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                style={tw`flex-1 bg-[#334155] py-3 rounded-lg items-center`}
                onPress={onClose}
              >
                <Text style={tw`text-white font-medium`}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 bg-[#22D3EE] py-3 rounded-lg items-center`}
                onPress={showAndroidPicker}
              >
                <Text style={tw`text-white font-semibold`}>Pilih Waktu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const SettingsScreen = () => {
  const { clearAllData, debugStorage, state } = useAppContext();
  const [notificationSettings, setNotificationSettings] = useState(
    DEFAULT_NOTIFICATION_SETTINGS
  );
  const [appSettings, setAppSettings] = useState(DEFAULT_APP_SETTINGS);
  const [hasPermission, setHasPermission] = useState(false);
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<
    "general" | "notifications" | "data"
  >("notifications");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [timePickerConfig, setTimePickerConfig] = useState<{
    visible: boolean;
    type: "morning" | "evening" | "quietStart" | "quietEnd" | null;
  }>({ visible: false, type: null });

  useEffect(() => {
    loadAllSettings();
    checkPermission();
    loadScheduledNotifications();
  }, []);

  // Load semua settings
  const loadAllSettings = async () => {
    try {
      // Load notification settings
      const savedNotifSettings =
        await notificationService.getNotificationSettings();
      setNotificationSettings(savedNotifSettings);

      // Load app settings
      const savedAppSettings = await AsyncStorage.getItem(APP_SETTINGS_KEY);
      if (savedAppSettings) {
        setAppSettings(JSON.parse(savedAppSettings));
      }
    } catch (error) {
      console.error("❌ Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save notification settings
  const saveNotificationSettings = async (
    newSettings: typeof DEFAULT_NOTIFICATION_SETTINGS
  ) => {
    try {
      await notificationService.updateNotificationSettings(newSettings, state);
      setNotificationSettings(newSettings);
    } catch (error) {
      console.error("❌ Error saving notification settings:", error);
    }
  };

  // Save app settings
  const saveAppSettings = async (newSettings: typeof DEFAULT_APP_SETTINGS) => {
    try {
      await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(newSettings));
      setAppSettings(newSettings);
    } catch (error) {
      console.error("❌ Error saving app settings:", error);
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
    try {
      const granted =
        await notificationService.registerForPushNotificationsAsync();
      setHasPermission(granted);

      if (granted) {
        // Reinitialize notifications setelah dapat permission
        await notificationService.reinitializeNotifications(state);
        Alert.alert("Berhasil", "Izin notifikasi diberikan!");
      } else {
        Alert.alert(
          "Izin Dibutuhkan",
          "Untuk mengirim notifikasi, aplikasi membutuhkan izin. Silakan aktifkan di pengaturan perangkat.",
          [
            { text: "OK" },
            { text: "Buka Pengaturan", onPress: () => Linking.openSettings() },
          ]
        );
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
      Alert.alert("Error", "Gagal meminta izin notifikasi");
    }
  };

  // ================= NOTIFICATION FUNCTIONS =================
  const toggleNotificationMaster = async (value: boolean) => {
    const newSettings = { ...notificationSettings, enabled: value };
    await saveNotificationSettings(newSettings);

    if (!value) {
      Alert.alert("Notifikasi Dimatikan", "Semua notifikasi telah dimatikan.");
    }
  };

  // FIX 1: Tambahkan "enabled" ke dalam type parameter
  const toggleNotificationSetting = async (
    key: keyof Omit<typeof DEFAULT_NOTIFICATION_SETTINGS, "advanced">
  ) => {
    if (!notificationSettings.enabled) {
      Alert.alert(
        "Notifikasi Dimatikan",
        "Aktifkan notifikasi terlebih dahulu."
      );
      return;
    }

    const newSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key],
    };
    await saveNotificationSettings(newSettings);
  };

  // Advanced settings functions
  const updateCustomSchedule = async (key: string, value: any) => {
    const newSettings = {
      ...notificationSettings,
      advanced: {
        ...notificationSettings.advanced,
        customSchedule: {
          ...notificationSettings.advanced?.customSchedule,
          [key]: value,
        },
      },
    };
    await saveNotificationSettings(newSettings);
  };

  const updateQuietHours = async (key: string, value: any) => {
    const newSettings = {
      ...notificationSettings,
      advanced: {
        ...notificationSettings.advanced,
        quietHours: {
          ...notificationSettings.advanced?.quietHours,
          [key]: value,
        } as AdvancedNotificationSettings["quietHours"],
      },
    };
    await saveNotificationSettings(newSettings);
  };

  const updateAdvancedSetting = async (
    key: keyof AdvancedNotificationSettings,
    value: any
  ) => {
    const newSettings = {
      ...notificationSettings,
      advanced: {
        ...notificationSettings.advanced,
        [key]: value,
      },
    };
    await saveNotificationSettings(newSettings);
  };

  const toggleActiveDay = async (dayIndex: number) => {
    const currentDays = notificationSettings.advanced?.activeDays || [];
    let newDays: number[];

    if (currentDays.includes(dayIndex)) {
      newDays = currentDays.filter((day) => day !== dayIndex);
    } else {
      newDays = [...currentDays, dayIndex];
    }

    await updateAdvancedSetting("activeDays", newDays.sort());
  };

  const testNotification = async () => {
    if (!notificationSettings.enabled) {
      Alert.alert(
        "Notifikasi Dimatikan",
        "Aktifkan notifikasi terlebih dahulu."
      );
      return;
    }

    await notificationService.sendNotification({
      title: "🔔 Test Notification",
      body: "Ini adalah notifikasi test dari MyMoney!",
      data: { type: "TEST" },
      urgent: true,
    });
    Alert.alert("Berhasil", "Notifikasi test terkirim!");
  };

  const clearAllNotifications = async () => {
    await notificationService.cancelAllNotifications();
    await loadScheduledNotifications();
    Alert.alert("Berhasil", "Semua notifikasi dibersihkan");
  };

  // ================= APP SETTINGS FUNCTIONS =================
  const toggleAppSetting = async (key: keyof typeof DEFAULT_APP_SETTINGS) => {
    const newSettings = { ...appSettings, [key]: !appSettings[key] };
    await saveAppSettings(newSettings);
  };

  const handleClearData = () => {
    Alert.alert(
      "Hapus Semua Data",
      "Apakah Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            await clearAllData();
            Alert.alert("Berhasil", "Semua data telah dihapus");
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    Alert.alert(
      "Ekspor Data",
      "Fitur ekspor data akan segera tersedia dalam update berikutnya.",
      [{ text: "OK" }]
    );
  };

  const handleDebug = async () => {
    await debugStorage();
    Alert.alert("Debug", "Check console untuk detail storage");
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getDayName = (index: number) => {
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    return days[index];
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 bg-[#0F172A] justify-center items-center`}>
        <Ionicons name="settings" size={48} color="#22D3EE" />
        <Text style={tw`text-white mt-4`}>Memuat pengaturan...</Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-[#0F172A]`}>
      {/* Header */}
      <View style={tw`pt-3 px-6 pb-4 border-b border-[#334155]`}>
        <Text style={tw`text-2xl font-bold text-white mb-2`}>Pengaturan</Text>
        <Text style={tw`text-[#CBD5E1]`}>Kelola aplikasi sesuai kebutuhan</Text>
      </View>

      {/* Tab Navigation */}
      <View style={tw`flex-row border-b border-[#334155]`}>
        {["general", "notifications", "data"].map((section) => (
          <TouchableOpacity
            key={section}
            style={[
              tw`flex-1 py-4 items-center`,
              activeSection === section && tw`border-b-2 border-[#22D3EE]`,
            ]}
            onPress={() => setActiveSection(section as any)}
          >
            <Text
              style={[
                tw``,
                activeSection === section
                  ? tw`text-[#22D3EE] font-semibold`
                  : tw`text-[#CBD5E1]`,
              ]}
            >
              {section === "general" && "Umum"}
              {section === "notifications" && "Notifikasi"}
              {section === "data" && "Data"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
        <View style={tw`p-6`}>
          {/* GENERAL SETTINGS */}
          {activeSection === "general" && (
            <>
              <View style={tw`mb-8`}>
                <Text style={tw`text-white text-lg font-semibold mb-4`}>
                  Tampilan
                </Text>
                <View style={tw`mb-4`}>
                  <View
                    style={tw`flex-row items-center justify-between bg-[#1E293B] rounded-xl p-4 mb-3`}
                  >
                    <Text style={tw`text-white`}>Tampilkan Saldo</Text>
                    <Switch
                      value={appSettings.showBalance}
                      onValueChange={() => toggleAppSetting("showBalance")}
                      trackColor={{ false: "#64748B", true: "#22D3EE" }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  <View
                    style={tw`flex-row items-center justify-between bg-[#1E293B] rounded-xl p-4 mb-3`}
                  >
                    <Text style={tw`text-white`}>Getar (Haptic)</Text>
                    <Switch
                      value={appSettings.hapticFeedback}
                      onValueChange={() => toggleAppSetting("hapticFeedback")}
                      trackColor={{ false: "#64748B", true: "#22D3EE" }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  <View
                    style={tw`flex-row items-center justify-between bg-[#1E293B] rounded-xl p-4 mb-3`}
                  >
                    <Text style={tw`text-white`}>Login dengan Biometrik</Text>
                    <Switch
                      value={appSettings.biometricLogin}
                      onValueChange={() => toggleAppSetting("biometricLogin")}
                      trackColor={{ false: "#64748B", true: "#22D3EE" }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  <View
                    style={tw`flex-row items-center justify-between bg-[#1E293B] rounded-xl p-4`}
                  >
                    <Text style={tw`text-white`}>Backup Otomatis</Text>
                    <Switch
                      value={appSettings.autoBackup}
                      onValueChange={() => toggleAppSetting("autoBackup")}
                      trackColor={{ false: "#64748B", true: "#22D3EE" }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
              </View>

              <View>
                <Text style={tw`text-white text-lg font-semibold mb-4`}>
                  Mata Uang
                </Text>
                <View style={tw`flex-row gap-2`}>
                  {["IDR", "USD", "EUR"].map((currency) => (
                    <TouchableOpacity
                      key={currency}
                      style={[
                        tw`flex-1 py-3 rounded-lg items-center`,
                        appSettings.currency === currency
                          ? tw`bg-[#22D3EE]`
                          : tw`bg-[#1E293B]`,
                      ]}
                      onPress={() =>
                        saveAppSettings({ ...appSettings, currency })
                      }
                    >
                      <Text
                        style={[
                          tw``,
                          appSettings.currency === currency
                            ? tw`text-white font-bold`
                            : tw`text-[#CBD5E1]`,
                        ]}
                      >
                        {currency}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* NOTIFICATION SETTINGS */}
          {activeSection === "notifications" && (
            <>
              {/* Master Switch Section */}
              <View style={tw`bg-[#1E293B] rounded-xl p-5 mb-6`}>
                <View style={tw`flex-row items-center justify-between mb-4`}>
                  <View>
                    <Text style={tw`text-white text-lg font-semibold`}>
                      Notifikasi
                    </Text>
                    <Text style={tw`text-[#94A3B8] text-sm mt-1`}>
                      {notificationSettings.enabled ? "Aktif" : "Nonaktif"} •{" "}
                      {hasPermission ? "Izin diberikan" : "Izin dibutuhkan"}
                    </Text>
                  </View>
                  <Switch
                    value={notificationSettings.enabled}
                    onValueChange={toggleNotificationMaster}
                    trackColor={{ false: "#64748B", true: "#22D3EE" }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {!hasPermission ? (
                  <TouchableOpacity
                    style={tw`bg-[#22D3EE] py-3 rounded-lg items-center`}
                    onPress={requestPermission}
                    disabled={!notificationSettings.enabled}
                  >
                    <Text style={tw`text-white font-semibold`}>
                      Berikan Izin
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={tw`flex-row gap-3`}>
                    <TouchableOpacity
                      style={[
                        tw`flex-1 bg-[#334155] py-3 rounded-lg items-center`,
                        !notificationSettings.enabled && tw`opacity-50`,
                      ]}
                      onPress={testNotification}
                      disabled={!notificationSettings.enabled}
                    >
                      <Text style={tw`text-white font-semibold`}>
                        Test Notifikasi
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={tw`flex-1 bg-[#EF4444] py-3 rounded-lg items-center`}
                      onPress={clearAllNotifications}
                    >
                      <Text style={tw`text-white font-semibold`}>
                        Hapus Semua
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Basic Notification Types */}
              <Text style={tw`text-white text-lg font-semibold mb-4`}>
                Jenis Notifikasi
              </Text>

              {[
                {
                  key: "dailyReminders",
                  label: "Pengingat Harian",
                  desc: "Pengingat pagi, siang, dan malam",
                },
                {
                  key: "budgetAlerts",
                  label: "Alert Budget",
                  desc: "Alert ketika budget hampir habis",
                },
                {
                  key: "savingsProgress",
                  label: "Progress Tabungan",
                  desc: "Update progress tabungan",
                },
                {
                  key: "transactionReminders",
                  label: "Pengingat Transaksi",
                  desc: "Pengingat catat transaksi",
                },
                {
                  key: "notesReminders",
                  label: "Pengingat Catatan",
                  desc: "Pengingat buat catatan finansial",
                },
                {
                  key: "weeklyReports",
                  label: "Laporan Mingguan",
                  desc: "Laporan mingguan setiap Minggu",
                },
                {
                  key: "financialTips",
                  label: "Tips Finansial",
                  desc: "Tips finansial acak setiap hari",
                },
              ].map(({ key, label, desc }) => (
                <View
                  key={key}
                  style={tw`flex-row items-center justify-between bg-[#1E293B] rounded-xl p-4 mb-3`}
                >
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-white font-medium`}>{label}</Text>
                    <Text style={tw`text-[#94A3B8] text-sm mt-1`}>{desc}</Text>
                  </View>
                  <Switch
                    value={
                      notificationSettings[
                        key as keyof typeof DEFAULT_NOTIFICATION_SETTINGS
                      ] as boolean
                    }
                    onValueChange={() => toggleNotificationSetting(key as any)}
                    trackColor={{ false: "#64748B", true: "#22D3EE" }}
                    thumbColor="#FFFFFF"
                    disabled={!notificationSettings.enabled}
                  />
                </View>
              ))}

              {/* Advanced Notification Settings */}
              <TouchableOpacity
                style={tw`flex-row items-center justify-between bg-[#1E293B] rounded-xl p-4 mt-6 mb-4`}
                onPress={() => setShowAdvanced(!showAdvanced)}
              >
                <View style={tw`flex-row items-center`}>
                  <Ionicons
                    name="settings-outline"
                    size={20}
                    color="#22D3EE"
                    style={tw`mr-3`}
                  />
                  <Text style={tw`text-white font-medium`}>
                    ⚙️ Pengaturan Lanjutan Notifikasi
                  </Text>
                </View>
                <Ionicons
                  name={showAdvanced ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#CBD5E1"
                />
              </TouchableOpacity>

              {showAdvanced && (
                <View style={tw`bg-[#1E293B] rounded-xl p-4 mb-6`}>
                  {/* CUSTOM SCHEDULE */}
                  <Text style={tw`text-white font-medium mb-3`}>
                    ⏰ Jadwal Kustom
                  </Text>

                  <View style={tw`mb-4`}>
                    <Text style={tw`text-[#CBD5E1] text-sm mb-2`}>
                      Pengingat Pagi
                    </Text>
                    <View style={tw`flex-row items-center justify-between`}>
                      <TouchableOpacity
                        style={tw`flex-row items-center`}
                        onPress={() =>
                          setTimePickerConfig({
                            visible: true,
                            type: "morning",
                          })
                        }
                      >
                        <Ionicons
                          name="time-outline"
                          size={20}
                          color="#22D3EE"
                        />
                        <Text style={tw`text-white ml-2`}>
                          {formatTime(
                            notificationSettings.advanced?.customSchedule
                              ?.morning || "07:30"
                          )}
                        </Text>
                      </TouchableOpacity>
                      <Switch
                        value={
                          notificationSettings.advanced?.customSchedule
                            ?.morningEnabled !== false
                        }
                        onValueChange={(value) =>
                          updateCustomSchedule("morningEnabled", value)
                        }
                        trackColor={{ false: "#64748B", true: "#22D3EE" }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  </View>

                  <View style={tw`mb-6`}>
                    <Text style={tw`text-[#CBD5E1] text-sm mb-2`}>
                      Ringkasan Malam
                    </Text>
                    <View style={tw`flex-row items-center justify-between`}>
                      <TouchableOpacity
                        style={tw`flex-row items-center`}
                        onPress={() =>
                          setTimePickerConfig({
                            visible: true,
                            type: "evening",
                          })
                        }
                      >
                        <Ionicons
                          name="time-outline"
                          size={20}
                          color="#22D3EE"
                        />
                        <Text style={tw`text-white ml-2`}>
                          {formatTime(
                            notificationSettings.advanced?.customSchedule
                              ?.evening || "20:00"
                          )}
                        </Text>
                      </TouchableOpacity>
                      <Switch
                        value={
                          notificationSettings.advanced?.customSchedule
                            ?.eveningEnabled !== false
                        }
                        onValueChange={(value) =>
                          updateCustomSchedule("eveningEnabled", value)
                        }
                        trackColor={{ false: "#64748B", true: "#22D3EE" }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  </View>

                  {/* QUIET HOURS */}
                  <Text style={tw`text-white font-medium mb-3`}>
                    🔇 Quiet Hours
                  </Text>

                  <View style={tw`mb-3`}>
                    <View
                      style={tw`flex-row items-center justify-between mb-2`}
                    >
                      <Text style={tw`text-[#CBD5E1]`}>
                        Aktifkan Quiet Hours
                      </Text>
                      <Switch
                        value={
                          notificationSettings.advanced?.quietHours?.enabled ||
                          false
                        }
                        onValueChange={(value) =>
                          updateQuietHours("enabled", value)
                        }
                        trackColor={{ false: "#64748B", true: "#22D3EE" }}
                        thumbColor="#FFFFFF"
                      />
                    </View>

                    {notificationSettings.advanced?.quietHours?.enabled && (
                      <View style={tw`pl-2`}>
                        <View style={tw`flex-row items-center mb-3`}>
                          <TouchableOpacity
                            style={tw`flex-row items-center flex-1`}
                            onPress={() =>
                              setTimePickerConfig({
                                visible: true,
                                type: "quietStart",
                              })
                            }
                          >
                            <Ionicons
                              name="moon-outline"
                              size={18}
                              color="#8B5CF6"
                            />
                            <Text style={tw`text-white ml-2`}>
                              {formatTime(
                                notificationSettings.advanced?.quietHours
                                  ?.start || "22:00"
                              )}
                            </Text>
                          </TouchableOpacity>

                          <Text style={tw`text-[#CBD5E1] mx-2`}>sampai</Text>

                          <TouchableOpacity
                            style={tw`flex-row items-center flex-1`}
                            onPress={() =>
                              setTimePickerConfig({
                                visible: true,
                                type: "quietEnd",
                              })
                            }
                          >
                            <Ionicons
                              name="sunny-outline"
                              size={18}
                              color="#F59E0B"
                            />
                            <Text style={tw`text-white ml-2`}>
                              {formatTime(
                                notificationSettings.advanced?.quietHours
                                  ?.end || "07:00"
                              )}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <View style={tw`flex-row items-center justify-between`}>
                          <Text style={tw`text-[#94A3B8] text-sm`}>
                            Abaikan Notifikasi Penting
                          </Text>
                          <Switch
                            value={
                              notificationSettings.advanced?.quietHours
                                ?.ignoreUrgent || false
                            }
                            onValueChange={(value) =>
                              updateQuietHours("ignoreUrgent", value)
                            }
                            trackColor={{ false: "#64748B", true: "#22D3EE" }}
                            thumbColor="#FFFFFF"
                          />
                        </View>
                      </View>
                    )}
                  </View>

                  {/* DAYS SELECTION */}
                  <Text style={tw`text-white font-medium mb-3 mt-4`}>
                    📅 Hari Aktif
                  </Text>
                  <View style={tw`flex-row flex-wrap mb-2`}>
                    {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                      <TouchableOpacity
                        key={dayIndex}
                        style={[
                          tw`w-10 h-10 rounded-full items-center justify-center mr-2 mb-2`,
                          notificationSettings.advanced?.activeDays?.includes(
                            dayIndex
                          )
                            ? tw`bg-[#22D3EE]`
                            : tw`bg-[#334155]`,
                        ]}
                        onPress={() => toggleActiveDay(dayIndex)}
                      >
                        <Text
                          style={[
                            tw`font-medium`,
                            notificationSettings.advanced?.activeDays?.includes(
                              dayIndex
                            )
                              ? tw`text-white`
                              : tw`text-[#CBD5E1]`,
                          ]}
                        >
                          {getDayName(dayIndex)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={tw`text-[#94A3B8] text-xs text-center mb-4`}>
                    Notifikasi hanya akan dikirim di hari yang dipilih
                  </Text>

                  {/* VIBRATION PATTERN */}
                  <Text style={tw`text-white font-medium mb-3`}>
                    📳 Pola Getar
                  </Text>
                  <View style={tw`flex-row gap-2 mb-6`}>
                    {[
                      { value: "light" as const, label: "Ringan" },
                      { value: "medium" as const, label: "Sedang" },
                      { value: "heavy" as const, label: "Kuat" },
                    ].map((pattern) => (
                      <TouchableOpacity
                        key={pattern.value}
                        style={[
                          tw`flex-1 py-2 rounded-lg items-center`,
                          notificationSettings.advanced?.vibrationPattern ===
                          pattern.value
                            ? tw`bg-[#22D3EE]`
                            : tw`bg-[#334155]`,
                        ]}
                        onPress={() =>
                          updateAdvancedSetting(
                            "vibrationPattern",
                            pattern.value
                          )
                        }
                      >
                        <Text
                          style={[
                            tw`font-medium`,
                            notificationSettings.advanced?.vibrationPattern ===
                            pattern.value
                              ? tw`text-white`
                              : tw`text-[#CBD5E1]`,
                          ]}
                        >
                          {pattern.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* SOUND SETTINGS */}
                  <View style={tw`flex-row items-center justify-between`}>
                    <Text style={tw`text-white`}>Suara Notifikasi</Text>
                    <Switch
                      value={
                        notificationSettings.advanced?.soundEnabled !== false
                      }
                      onValueChange={(value) =>
                        updateAdvancedSetting("soundEnabled", value)
                      }
                      trackColor={{ false: "#64748B", true: "#22D3EE" }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
              )}
            </>
          )}

          {/* DATA SETTINGS */}
          {activeSection === "data" && (
            <View style={tw`mb-4`}>
              <TouchableOpacity
                style={tw`bg-[#1E293B] rounded-xl p-5 items-center mb-4`}
                onPress={handleExportData}
              >
                <Ionicons name="download-outline" size={32} color="#22D3EE" />
                <Text style={tw`text-white font-semibold mt-3`}>
                  Ekspor Data
                </Text>
                <Text style={tw`text-[#94A3B8] text-center mt-2`}>
                  Ekspor semua data ke file CSV
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={tw`bg-[#1E293B] rounded-xl p-5 items-center mb-4`}
                onPress={handleDebug}
              >
                <Ionicons name="bug-outline" size={32} color="#F59E0B" />
                <Text style={tw`text-white font-semibold mt-3`}>
                  Debug Storage
                </Text>
                <Text style={tw`text-[#94A3B8] text-center mt-2`}>
                  Cek status storage di console
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={tw`bg-[#EF4444] rounded-xl p-5 items-center`}
                onPress={handleClearData}
              >
                <Ionicons name="trash-outline" size={32} color="#FFFFFF" />
                <Text style={tw`text-white font-semibold mt-3`}>
                  Hapus Semua Data
                </Text>
                <Text style={tw`text-white/80 text-center mt-2`}>
                  Reset aplikasi ke keadaan awal
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Time Picker Modal */}
      <TimePickerModal
        visible={timePickerConfig.visible}
        onClose={() => setTimePickerConfig({ visible: false, type: null })}
        onTimeSelected={(time) => {
          if (timePickerConfig.type) {
            updateCustomSchedule(timePickerConfig.type, time);
          }
          setTimePickerConfig({ visible: false, type: null });
        }}
        initialTime={
          timePickerConfig.type === "morning"
            ? notificationSettings.advanced?.customSchedule?.morning || "07:30"
            : timePickerConfig.type === "evening"
            ? notificationSettings.advanced?.customSchedule?.evening || "20:00"
            : timePickerConfig.type === "quietStart"
            ? notificationSettings.advanced?.quietHours?.start || "22:00"
            : notificationSettings.advanced?.quietHours?.end || "07:00"
        }
        title={
          timePickerConfig.type === "morning"
            ? "Pengingat Pagi"
            : timePickerConfig.type === "evening"
            ? "Ringkasan Malam"
            : timePickerConfig.type === "quietStart"
            ? "Mulai Quiet Hours"
            : "Akhir Quiet Hours"
        }
      />
    </View>
  );
};

export default SettingsScreen;
