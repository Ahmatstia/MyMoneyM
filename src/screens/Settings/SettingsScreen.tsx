// File: src/screens/SettingsScreen.tsx
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
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { notificationService } from "../../utils/notifications";
import { useAppContext } from "../../context/AppContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors } from "../../theme/theme";

// ─── Konstanta (sama dengan asli) ─────────────────────────────────────────────
const APP_SETTINGS_KEY = "@mymoney_app_settings";

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
    enabled?: boolean;
    start?: string;
    end?: string;
    ignoreUrgent?: boolean;
  };
  activeDays?: number[];
  vibrationPattern?: "light" | "medium" | "heavy";
  soundEnabled?: boolean;
}

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
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    vibrationPattern: "medium" as const,
    soundEnabled: true,
  } as AdvancedNotificationSettings,
};

const DEFAULT_APP_SETTINGS = {
  currency: "IDR",
  language: "id",
  theme: "dark",
  biometricLogin: false,
  autoBackup: false,
  showBalance: true,
  hapticFeedback: true,
};

// ─── Warna konsisten dengan semua screen ─────────────────────────────────────
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR    = Colors.surface;
const TEXT_PRIMARY     = Colors.textPrimary;
const TEXT_SECONDARY   = Colors.textSecondary;
const ACCENT_COLOR     = Colors.accent;
const SUCCESS_COLOR    = Colors.success;
const WARNING_COLOR    = Colors.warning;
const ERROR_COLOR      = Colors.error;

// ─── Komponen UI kecil (konsisten dengan semua screen) ───────────────────────

const Sep = ({ marginV = 20 }: { marginV?: number }) => (
  <View
    style={{
      height: 1,
      backgroundColor: SURFACE_COLOR,
      marginHorizontal: -16,
      marginVertical: marginV,
    }}
  />
);

const SectionHeader = ({
  title,
}: {
  title: string;
}) => (
  <Text
    style={{
      color: Colors.gray400,
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 12,
    }}
  >
    {title}
  </Text>
);

/** Row item dengan switch — flat tanpa card per-item */
const SettingRow = ({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  icon,
  iconColor,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}) => (
  <View
    style={[
      tw`flex-row items-center py-3`,
      { borderBottomWidth: 1, borderBottomColor: SURFACE_COLOR, opacity: disabled ? 0.45 : 1 },
    ]}
  >
    {icon && (
      <View
        style={[
          tw`w-8 h-8 rounded-lg items-center justify-center mr-3`,
          { backgroundColor: `${iconColor || ACCENT_COLOR}18`, flexShrink: 0 },
        ]}
      >
        <Ionicons name={icon} size={16} color={iconColor || ACCENT_COLOR} />
      </View>
    )}
    <View style={tw`flex-1`}>
      <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "500" }}>{label}</Text>
      {description && (
        <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 1 }}>{description}</Text>
      )}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: Colors.surfaceLight, true: ACCENT_COLOR }}
      thumbColor="#FFFFFF"
      disabled={disabled}
      style={{ marginLeft: 12 }}
    />
  </View>
);

// ─── TimePickerModal (sama dengan asli, hanya warna diselaraskan) ─────────────

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

  const handleTimeChange = (event: any, time?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (time) {
      setSelectedTime(time);
      if (Platform.OS === "android" && event.type === "set") {
        const h = time.getHours().toString().padStart(2, "0");
        const m = time.getMinutes().toString().padStart(2, "0");
        onTimeSelected(`${h}:${m}`);
        onClose();
      }
    } else if (Platform.OS === "android") {
      onClose();
    }
  };

  const handleConfirm = () => {
    const h = selectedTime.getHours().toString().padStart(2, "0");
    const m = selectedTime.getMinutes().toString().padStart(2, "0");
    onTimeSelected(`${h}:${m}`);
    onClose();
  };

  // iOS
  if (Platform.OS === "ios") {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={tw`flex-1 justify-end`} pointerEvents="box-none">
          <TouchableOpacity
            style={[tw`absolute inset-0`, { backgroundColor: "rgba(0,0,0,0.5)" }]}
            activeOpacity={1}
            onPress={onClose}
          />
          <View style={[tw`rounded-t-3xl`, { backgroundColor: SURFACE_COLOR }]}>
            <View style={[tw`flex-row items-center justify-between px-5 py-4`, { borderBottomWidth: 1, borderBottomColor: Colors.surfaceLight }]}>
              <Text style={{ color: TEXT_PRIMARY, fontSize: 16, fontWeight: "700" }}>{title}</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={Colors.gray400} />
              </TouchableOpacity>
            </View>
            <View style={tw`px-5 py-4`}>
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                style={tw`w-full`}
                textColor={TEXT_PRIMARY}
                themeVariant="dark"
              />
              <View style={tw`items-center mt-4`}>
                <Text style={{ color: TEXT_PRIMARY, fontSize: 36, fontWeight: "700" }}>
                  {selectedTime.getHours().toString().padStart(2, "0")}:
                  {selectedTime.getMinutes().toString().padStart(2, "0")}
                </Text>
              </View>
            </View>
            <View style={[tw`flex-row px-5 py-4 gap-3`, { borderTopWidth: 1, borderTopColor: Colors.surfaceLight }]}>
              <TouchableOpacity
                style={[tw`flex-1 py-3 rounded-xl items-center`, { backgroundColor: Colors.surfaceLight }]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={{ color: TEXT_SECONDARY, fontSize: 14, fontWeight: "500" }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[tw`flex-1 py-3 rounded-xl items-center`, { backgroundColor: ACCENT_COLOR }]}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <Text style={{ color: BACKGROUND_COLOR, fontSize: 14, fontWeight: "600" }}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Android — native picker
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

  // Android — modal dengan preset
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={tw`flex-1 justify-center items-center`} pointerEvents="box-none">
        <TouchableOpacity
          style={[tw`absolute inset-0`, { backgroundColor: "rgba(0,0,0,0.5)" }]}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[tw`rounded-2xl w-11/12 max-w-sm overflow-hidden`, { backgroundColor: SURFACE_COLOR }]}>
          <View style={tw`px-5 pt-5 pb-4`}>
            <Text style={{ color: TEXT_PRIMARY, fontSize: 16, fontWeight: "700", textAlign: "center", marginBottom: 4 }}>
              {title}
            </Text>
            <Text style={{ color: Colors.gray400, fontSize: 12, textAlign: "center", marginBottom: 16 }}>
              Pilih waktu notifikasi
            </Text>
            <View style={tw`items-center mb-5`}>
              <Text style={{ color: TEXT_PRIMARY, fontSize: 44, fontWeight: "700" }}>
                {selectedTime.getHours().toString().padStart(2, "0")}:
                {selectedTime.getMinutes().toString().padStart(2, "0")}
              </Text>
            </View>
            {/* Quick presets */}
            <View style={tw`flex-row flex-wrap justify-center gap-2 mb-5`}>
              {["07:30", "12:00", "15:00", "20:00", "22:00"].map((time) => {
                const [h, m] = time.split(":").map(Number);
                const isSelected = selectedTime.getHours() === h && selectedTime.getMinutes() === m;
                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      tw`px-4 py-2 rounded-full`,
                      isSelected ? { backgroundColor: ACCENT_COLOR } : { backgroundColor: Colors.surfaceLight },
                    ]}
                    onPress={() => {
                      const d = new Date();
                      d.setHours(h, m, 0, 0);
                      setSelectedTime(d);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "500", color: isSelected ? BACKGROUND_COLOR : TEXT_SECONDARY }}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={[tw`flex-row px-5 pb-5 gap-3`]}>
            <TouchableOpacity
              style={[tw`flex-1 py-3 rounded-xl items-center`, { backgroundColor: Colors.surfaceLight }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={{ color: TEXT_SECONDARY, fontSize: 14, fontWeight: "500" }}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[tw`flex-1 py-3 rounded-xl items-center`, { backgroundColor: ACCENT_COLOR }]}
              onPress={() => setShowPicker(true)}
              activeOpacity={0.8}
            >
              <Text style={{ color: BACKGROUND_COLOR, fontSize: 14, fontWeight: "600" }}>Pilih Waktu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const SettingsScreen = () => {
  const { clearAllData, debugStorage, state } = useAppContext();

  const [notificationSettings, setNotificationSettings] = useState(DEFAULT_NOTIFICATION_SETTINGS);
  const [appSettings, setAppSettings]                   = useState(DEFAULT_APP_SETTINGS);
  const [hasPermission, setHasPermission]               = useState(false);
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading]                       = useState(true);
  const [activeSection, setActiveSection]               = useState<"notifications" | "data">("notifications");
  const [showAdvanced, setShowAdvanced]                 = useState(false);
  const [timePickerConfig, setTimePickerConfig]         = useState<{
    visible: boolean;
    type: "morning" | "evening" | "quietStart" | "quietEnd" | null;
  }>({ visible: false, type: null });

  useEffect(() => {
    loadAllSettings();
    checkPermission();
    loadScheduledNotifications();
  }, []);

  // ── Load / save (sama dengan asli) ───────────────────────────────────────
  const loadAllSettings = async () => {
    try {
      const savedNotifSettings = await notificationService.getNotificationSettings();
      setNotificationSettings(savedNotifSettings);
      const savedAppSettings = await AsyncStorage.getItem(APP_SETTINGS_KEY);
      if (savedAppSettings) setAppSettings(JSON.parse(savedAppSettings));
    } catch (error) {
      console.error("❌ Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveNotificationSettings = async (newSettings: typeof DEFAULT_NOTIFICATION_SETTINGS) => {
    try {
      await notificationService.updateNotificationSettings(newSettings, state);
      setNotificationSettings(newSettings);
    } catch (error) {
      console.error("❌ Error saving notification settings:", error);
    }
  };

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
      const notifications = await notificationService.getScheduledNotifications();
      setScheduledNotifications(notifications);
    } catch (error) {
      console.error("❌ Error loading scheduled notifications:", error);
    }
  };

  // ── Notification actions (sama dengan asli) ───────────────────────────────
  const requestPermission = async () => {
    try {
      const granted = await notificationService.registerForPushNotificationsAsync();
      setHasPermission(granted);
      if (granted) {
        await notificationService.reinitializeNotifications(state);
        Alert.alert("Berhasil", "Izin notifikasi diberikan!");
      } else {
        Alert.alert(
          "Izin Dibutuhkan",
          "Untuk mengirim notifikasi, aplikasi membutuhkan izin. Silakan aktifkan di pengaturan perangkat.",
          [{ text: "OK" }, { text: "Buka Pengaturan", onPress: () => Linking.openSettings() }]
        );
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
      Alert.alert("Error", "Gagal meminta izin notifikasi");
    }
  };

  const toggleNotificationMaster = async (value: boolean) => {
    const newSettings = { ...notificationSettings, enabled: value };
    await saveNotificationSettings(newSettings);
    if (!value) Alert.alert("Notifikasi Dimatikan", "Semua notifikasi telah dimatikan.");
  };

  const toggleNotificationSetting = async (
    key: keyof Omit<typeof DEFAULT_NOTIFICATION_SETTINGS, "advanced">
  ) => {
    if (!notificationSettings.enabled) {
      Alert.alert("Notifikasi Dimatikan", "Aktifkan notifikasi terlebih dahulu.");
      return;
    }
    const newSettings = { ...notificationSettings, [key]: !notificationSettings[key] };
    await saveNotificationSettings(newSettings);
  };

  const updateCustomSchedule = async (key: string, value: any) => {
    const newSettings = {
      ...notificationSettings,
      advanced: {
        ...notificationSettings.advanced,
        customSchedule: { ...notificationSettings.advanced?.customSchedule, [key]: value },
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
      advanced: { ...notificationSettings.advanced, [key]: value },
    };
    await saveNotificationSettings(newSettings);
  };

  const toggleActiveDay = async (dayIndex: number) => {
    const currentDays = notificationSettings.advanced?.activeDays || [];
    const newDays = currentDays.includes(dayIndex)
      ? currentDays.filter((d) => d !== dayIndex)
      : [...currentDays, dayIndex];
    await updateAdvancedSetting("activeDays", newDays.sort());
  };

  const testNotification = async () => {
    if (!notificationSettings.enabled) {
      Alert.alert("Notifikasi Dimatikan", "Aktifkan notifikasi terlebih dahulu.");
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

  // ── App settings actions (sama dengan asli) ───────────────────────────────
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
    Alert.alert("Ekspor Data", "Fitur ekspor data akan segera tersedia dalam update berikutnya.", [{ text: "OK" }]);
  };

  const handleDebug = async () => {
    await debugStorage();
    Alert.alert("Debug", "Check console untuk detail storage");
  };

  // ── Helper formatters (sama dengan asli) ─────────────────────────────────
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const getDayName = (index: number) => {
    return ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"][index];
  };

  // ── Skeleton loading ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[tw`flex-1 items-center justify-center`, { backgroundColor: BACKGROUND_COLOR }]}>
        <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mb-3`, { backgroundColor: `${ACCENT_COLOR}20` }]}>
          <Ionicons name="settings-outline" size={24} color={ACCENT_COLOR} />
        </View>
        <Text style={{ color: Colors.gray400, fontSize: 13 }}>Memuat pengaturan...</Text>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <View style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>

      {/* ── Tab navigation ──────────────────────────────────────────────── */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: SURFACE_COLOR, backgroundColor: BACKGROUND_COLOR }}>
        <View style={tw`flex-row`}>
          {(["notifications", "data"] as const).map((section) => {
            const isActive = activeSection === section;
            return (
              <TouchableOpacity
                key={section}
                style={[
                  tw`flex-1 py-3 items-center`,
                  isActive && { borderBottomWidth: 2, borderBottomColor: ACCENT_COLOR },
                ]}
                onPress={() => setActiveSection(section)}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? "600" : "400",
                    color: isActive ? ACCENT_COLOR : Colors.gray400,
                  }}
                >
                  {section === "notifications" ? "Notifikasi" : "Data"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Main scroll ──────────────────────────────────────────────────── */}
      <ScrollView
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}
      >
        {/* Page header */}
        <View style={tw`pt-4 pb-2`}>
          <Text style={{ color: TEXT_PRIMARY, fontSize: 20, fontWeight: "700" }}>Pengaturan</Text>
          <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 2 }}>Kelola aplikasi sesuai kebutuhan</Text>
        </View>

        <Sep marginV={16} />

        {/* ══════════════════════════════════════
            NOTIFICATION TAB
        ══════════════════════════════════════ */}
        {activeSection === "notifications" && (
          <>
            {/* Master toggle */}
            <View style={tw`flex-row items-center pb-3`} >
              <View
                style={[
                  tw`w-9 h-9 rounded-xl items-center justify-center mr-3`,
                  {
                    backgroundColor: notificationSettings.enabled
                      ? `${ACCENT_COLOR}20`
                      : `${Colors.gray500}20`,
                    flexShrink: 0,
                  },
                ]}
              >
                <Ionicons
                  name={notificationSettings.enabled ? "notifications-outline" : "notifications-off-outline"}
                  size={18}
                  color={notificationSettings.enabled ? ACCENT_COLOR : Colors.gray500}
                />
              </View>
              <View style={tw`flex-1`}>
                <Text style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: "600" }}>Notifikasi</Text>
                <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 1 }}>
                  {notificationSettings.enabled ? "Aktif" : "Nonaktif"} ·{" "}
                  {hasPermission ? "Izin diberikan" : "Izin dibutuhkan"}
                </Text>
              </View>
              <Switch
                value={notificationSettings.enabled}
                onValueChange={toggleNotificationMaster}
                trackColor={{ false: Colors.surfaceLight, true: ACCENT_COLOR }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Permission / action row */}
            {!hasPermission ? (
              <TouchableOpacity
                style={[
                  tw`py-3 rounded-xl items-center mb-2`,
                  {
                    backgroundColor: ACCENT_COLOR,
                    opacity: notificationSettings.enabled ? 1 : 0.5,
                  },
                ]}
                onPress={requestPermission}
                disabled={!notificationSettings.enabled}
                activeOpacity={0.8}
              >
                <Text style={{ color: BACKGROUND_COLOR, fontSize: 13, fontWeight: "600" }}>
                  Berikan Izin Notifikasi
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={tw`flex-row gap-3 mb-2`}>
                <TouchableOpacity
                  style={[
                    tw`flex-1 py-2.5 rounded-xl items-center`,
                    {
                      backgroundColor: SURFACE_COLOR,
                      opacity: notificationSettings.enabled ? 1 : 0.5,
                    },
                  ]}
                  onPress={testNotification}
                  disabled={!notificationSettings.enabled}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: TEXT_SECONDARY, fontSize: 12, fontWeight: "500" }}>
                    Test Notifikasi
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[tw`flex-1 py-2.5 rounded-xl items-center`, { backgroundColor: `${ERROR_COLOR}18` }]}
                  onPress={clearAllNotifications}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: ERROR_COLOR, fontSize: 12, fontWeight: "500" }}>
                    Hapus Semua
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <Sep marginV={16} />

            {/* Notification types */}
            <SectionHeader title="Jenis Notifikasi" />
            {[
              { key: "dailyReminders",       label: "Pengingat Harian",    desc: "Pengingat pagi, siang, dan malam",      icon: "alarm-outline"          as const, color: ACCENT_COLOR },
              { key: "budgetAlerts",          label: "Alert Budget",        desc: "Alert ketika budget hampir habis",       icon: "wallet-outline"         as const, color: WARNING_COLOR },
              { key: "savingsProgress",       label: "Progress Tabungan",   desc: "Update progress tabungan",               icon: "trending-up-outline"    as const, color: SUCCESS_COLOR },
              { key: "transactionReminders",  label: "Pengingat Transaksi", desc: "Pengingat catat transaksi",              icon: "receipt-outline"        as const, color: Colors.info },
              { key: "notesReminders",        label: "Pengingat Catatan",   desc: "Pengingat buat catatan finansial",       icon: "document-text-outline"  as const, color: Colors.purple },
              { key: "weeklyReports",         label: "Laporan Mingguan",    desc: "Laporan mingguan setiap Minggu",         icon: "bar-chart-outline"      as const, color: Colors.pink },
              { key: "financialTips",         label: "Tips Finansial",      desc: "Tips finansial acak setiap hari",        icon: "bulb-outline"           as const, color: WARNING_COLOR },
            ].map(({ key, label, desc, icon, color }) => (
              <SettingRow
                key={key}
                label={label}
                description={desc}
                icon={icon}
                iconColor={color}
                value={notificationSettings[key as keyof typeof DEFAULT_NOTIFICATION_SETTINGS] as boolean}
                onValueChange={() => toggleNotificationSetting(key as any)}
                disabled={!notificationSettings.enabled}
              />
            ))}

            <Sep marginV={20} />

            {/* Advanced settings toggle */}
            <TouchableOpacity
              style={tw`flex-row items-center justify-between py-2`}
              onPress={() => setShowAdvanced(!showAdvanced)}
              activeOpacity={0.7}
            >
              <View style={tw`flex-row items-center`}>
                <View
                  style={[
                    tw`w-8 h-8 rounded-lg items-center justify-center mr-3`,
                    { backgroundColor: `${ACCENT_COLOR}18` },
                  ]}
                >
                  <Ionicons name="settings-outline" size={16} color={ACCENT_COLOR} />
                </View>
                <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "500" }}>
                  Pengaturan Lanjutan
                </Text>
              </View>
              <Ionicons
                name={showAdvanced ? "chevron-up" : "chevron-down"}
                size={16}
                color={Colors.gray400}
              />
            </TouchableOpacity>

            {showAdvanced && (
              <>
                <Sep marginV={16} />

                {/* Custom schedule */}
                <SectionHeader title="Jadwal Kustom" />

                {/* Morning */}
                <View style={[tw`flex-row items-center py-3`, { borderBottomWidth: 1, borderBottomColor: SURFACE_COLOR }]}>
                  <View style={[tw`w-8 h-8 rounded-lg items-center justify-center mr-3`, { backgroundColor: `${WARNING_COLOR}18` }]}>
                    <Ionicons name="sunny-outline" size={16} color={WARNING_COLOR} />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "500" }}>Pengingat Pagi</Text>
                    <TouchableOpacity
                      onPress={() => setTimePickerConfig({ visible: true, type: "morning" })}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: ACCENT_COLOR, fontSize: 11, marginTop: 1 }}>
                        {formatTime(notificationSettings.advanced?.customSchedule?.morning || "07:30")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Switch
                    value={notificationSettings.advanced?.customSchedule?.morningEnabled !== false}
                    onValueChange={(v) => updateCustomSchedule("morningEnabled", v)}
                    trackColor={{ false: Colors.surfaceLight, true: ACCENT_COLOR }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* Evening */}
                <View style={[tw`flex-row items-center py-3`, { borderBottomWidth: 1, borderBottomColor: SURFACE_COLOR }]}>
                  <View style={[tw`w-8 h-8 rounded-lg items-center justify-center mr-3`, { backgroundColor: `${Colors.purple}18` }]}>
                    <Ionicons name="moon-outline" size={16} color={Colors.purple} />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "500" }}>Ringkasan Malam</Text>
                    <TouchableOpacity
                      onPress={() => setTimePickerConfig({ visible: true, type: "evening" })}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: ACCENT_COLOR, fontSize: 11, marginTop: 1 }}>
                        {formatTime(notificationSettings.advanced?.customSchedule?.evening || "20:00")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Switch
                    value={notificationSettings.advanced?.customSchedule?.eveningEnabled !== false}
                    onValueChange={(v) => updateCustomSchedule("eveningEnabled", v)}
                    trackColor={{ false: Colors.surfaceLight, true: ACCENT_COLOR }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <Sep marginV={16} />

                {/* Quiet hours */}
                <SectionHeader title="Quiet Hours" />
                <View style={[tw`flex-row items-center py-3`, { borderBottomWidth: 1, borderBottomColor: SURFACE_COLOR }]}>
                  <View style={[tw`w-8 h-8 rounded-lg items-center justify-center mr-3`, { backgroundColor: `${Colors.info}18` }]}>
                    <Ionicons name="volume-mute-outline" size={16} color={Colors.info} />
                  </View>
                  <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "500", flex: 1 }}>
                    Aktifkan Quiet Hours
                  </Text>
                  <Switch
                    value={notificationSettings.advanced?.quietHours?.enabled || false}
                    onValueChange={(v) => updateQuietHours("enabled", v)}
                    trackColor={{ false: Colors.surfaceLight, true: ACCENT_COLOR }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {notificationSettings.advanced?.quietHours?.enabled && (
                  <>
                    {/* Time range row */}
                    <View style={[tw`flex-row items-center py-3`, { borderBottomWidth: 1, borderBottomColor: SURFACE_COLOR }]}>
                      <TouchableOpacity
                        style={tw`flex-1 flex-row items-center`}
                        onPress={() => setTimePickerConfig({ visible: true, type: "quietStart" })}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="moon-outline" size={16} color={Colors.purple} style={{ marginRight: 6 }} />
                        <Text style={{ color: ACCENT_COLOR, fontSize: 13 }}>
                          {formatTime(notificationSettings.advanced?.quietHours?.start || "22:00")}
                        </Text>
                      </TouchableOpacity>
                      <Text style={{ color: Colors.gray400, fontSize: 12, marginHorizontal: 8 }}>sampai</Text>
                      <TouchableOpacity
                        style={tw`flex-1 flex-row items-center justify-end`}
                        onPress={() => setTimePickerConfig({ visible: true, type: "quietEnd" })}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="sunny-outline" size={16} color={WARNING_COLOR} style={{ marginRight: 6 }} />
                        <Text style={{ color: ACCENT_COLOR, fontSize: 13 }}>
                          {formatTime(notificationSettings.advanced?.quietHours?.end || "07:00")}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Ignore urgent */}
                    <View style={[tw`flex-row items-center py-3`, { borderBottomWidth: 1, borderBottomColor: SURFACE_COLOR }]}>
                      <Text style={{ color: TEXT_SECONDARY, fontSize: 13, flex: 1 }}>
                        Abaikan Notifikasi Penting
                      </Text>
                      <Switch
                        value={notificationSettings.advanced?.quietHours?.ignoreUrgent || false}
                        onValueChange={(v) => updateQuietHours("ignoreUrgent", v)}
                        trackColor={{ false: Colors.surfaceLight, true: ACCENT_COLOR }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  </>
                )}

                <Sep marginV={16} />

                {/* Active days */}
                <SectionHeader title="Hari Aktif" />
                <View style={tw`flex-row flex-wrap gap-2 mb-2`}>
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                    const isActive = notificationSettings.advanced?.activeDays?.includes(dayIndex);
                    return (
                      <TouchableOpacity
                        key={dayIndex}
                        style={[
                          tw`w-10 h-10 rounded-full items-center justify-center`,
                          isActive
                            ? { backgroundColor: ACCENT_COLOR }
                            : { backgroundColor: SURFACE_COLOR },
                        ]}
                        onPress={() => toggleActiveDay(dayIndex)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "600",
                            color: isActive ? BACKGROUND_COLOR : Colors.gray400,
                          }}
                        >
                          {getDayName(dayIndex)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={{ color: Colors.gray400, fontSize: 11, marginBottom: 4 }}>
                  Notifikasi hanya dikirim di hari yang dipilih
                </Text>

                <Sep marginV={16} />

                {/* Vibration pattern */}
                <SectionHeader title="Pola Getar" />
                <View style={tw`flex-row gap-3 mb-2`}>
                  {[
                    { value: "light"  as const, label: "Ringan" },
                    { value: "medium" as const, label: "Sedang" },
                    { value: "heavy"  as const, label: "Kuat" },
                  ].map((pattern) => {
                    const isActive = notificationSettings.advanced?.vibrationPattern === pattern.value;
                    return (
                      <TouchableOpacity
                        key={pattern.value}
                        style={[
                          tw`flex-1 py-2.5 rounded-xl items-center`,
                          isActive
                            ? { backgroundColor: ACCENT_COLOR }
                            : { backgroundColor: SURFACE_COLOR },
                        ]}
                        onPress={() => updateAdvancedSetting("vibrationPattern", pattern.value)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "500",
                            color: isActive ? BACKGROUND_COLOR : Colors.gray400,
                          }}
                        >
                          {pattern.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Sep marginV={16} />

                {/* Sound */}
                <View style={tw`flex-row items-center py-2`}>
                  <View style={[tw`w-8 h-8 rounded-lg items-center justify-center mr-3`, { backgroundColor: `${SUCCESS_COLOR}18` }]}>
                    <Ionicons name="musical-notes-outline" size={16} color={SUCCESS_COLOR} />
                  </View>
                  <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "500", flex: 1 }}>
                    Suara Notifikasi
                  </Text>
                  <Switch
                    value={notificationSettings.advanced?.soundEnabled !== false}
                    onValueChange={(v) => updateAdvancedSetting("soundEnabled", v)}
                    trackColor={{ false: Colors.surfaceLight, true: ACCENT_COLOR }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </>
            )}
          </>
        )}

        {/* ══════════════════════════════════════
            DATA TAB
        ══════════════════════════════════════ */}
        {activeSection === "data" && (
          <>
            <SectionHeader title="Manajemen Data" />

            {/* Export */}
            <TouchableOpacity
              style={[
                tw`flex-row items-center py-3`,
                { borderBottomWidth: 1, borderBottomColor: SURFACE_COLOR },
              ]}
              onPress={handleExportData}
              activeOpacity={0.7}
            >
              <View style={[tw`w-9 h-9 rounded-xl items-center justify-center mr-3`, { backgroundColor: `${ACCENT_COLOR}18` }]}>
                <Ionicons name="download-outline" size={18} color={ACCENT_COLOR} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "500" }}>Ekspor Data</Text>
                <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 1 }}>
                  Ekspor semua data ke file CSV
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={Colors.gray400} />
            </TouchableOpacity>

            {/* Debug */}
            <TouchableOpacity
              style={[
                tw`flex-row items-center py-3`,
                { borderBottomWidth: 1, borderBottomColor: SURFACE_COLOR },
              ]}
              onPress={handleDebug}
              activeOpacity={0.7}
            >
              <View style={[tw`w-9 h-9 rounded-xl items-center justify-center mr-3`, { backgroundColor: `${WARNING_COLOR}18` }]}>
                <Ionicons name="bug-outline" size={18} color={WARNING_COLOR} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "500" }}>Debug Storage</Text>
                <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 1 }}>
                  Cek status storage di console
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={Colors.gray400} />
            </TouchableOpacity>

            <Sep marginV={20} />

            {/* Danger zone */}
            <SectionHeader title="Zona Berbahaya" />
            <TouchableOpacity
              style={[
                tw`flex-row items-center py-3 px-4 rounded-xl`,
                { backgroundColor: `${ERROR_COLOR}12`, borderWidth: 1, borderColor: `${ERROR_COLOR}25` },
              ]}
              onPress={handleClearData}
              activeOpacity={0.7}
            >
              <View style={[tw`w-9 h-9 rounded-xl items-center justify-center mr-3`, { backgroundColor: `${ERROR_COLOR}20` }]}>
                <Ionicons name="trash-outline" size={18} color={ERROR_COLOR} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={{ color: ERROR_COLOR, fontSize: 13, fontWeight: "600" }}>Hapus Semua Data</Text>
                <Text style={{ color: `${ERROR_COLOR}99`, fontSize: 11, marginTop: 1 }}>
                  Reset aplikasi ke keadaan awal · Tidak dapat dibatalkan
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>

      {/* ── Time Picker Modal ────────────────────────────────────────────── */}
      <TimePickerModal
        visible={timePickerConfig.visible}
        onClose={() => setTimePickerConfig({ visible: false, type: null })}
        onTimeSelected={(time) => {
          if (timePickerConfig.type) {
            if (timePickerConfig.type === "morning" || timePickerConfig.type === "evening") {
              updateCustomSchedule(timePickerConfig.type, time);
            } else if (timePickerConfig.type === "quietStart") {
              updateQuietHours("start", time);
            } else if (timePickerConfig.type === "quietEnd") {
              updateQuietHours("end", time);
            }
          }
          setTimePickerConfig({ visible: false, type: null });
        }}
        initialTime={
          timePickerConfig.type === "morning"     ? notificationSettings.advanced?.customSchedule?.morning || "07:30" :
          timePickerConfig.type === "evening"     ? notificationSettings.advanced?.customSchedule?.evening || "20:00" :
          timePickerConfig.type === "quietStart"  ? notificationSettings.advanced?.quietHours?.start       || "22:00" :
                                                    notificationSettings.advanced?.quietHours?.end         || "07:00"
        }
        title={
          timePickerConfig.type === "morning"     ? "Pengingat Pagi"    :
          timePickerConfig.type === "evening"     ? "Ringkasan Malam"   :
          timePickerConfig.type === "quietStart"  ? "Mulai Quiet Hours" : "Akhir Quiet Hours"
        }
      />
    </View>
  );
};

export default SettingsScreen;