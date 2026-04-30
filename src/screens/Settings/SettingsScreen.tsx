// File: src/screens/Settings/SettingsScreen.tsx
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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import LottieView from "lottie-react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

import { notificationService } from "../../utils/notifications";
import { useAppContext } from "../../context/AppContext";
import { storageService } from "../../utils/storage";
import { Colors } from "../../theme/theme";

// ─── Konstanta ───────────────────────────────────────────────────────────────
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

// ─── Theme colors (konsisten) ────────────────────────────────────────────────
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR    = Colors.surface;
const TEXT_PRIMARY     = Colors.textPrimary;
const TEXT_SECONDARY   = Colors.textSecondary;
const ACCENT_COLOR     = Colors.accent;
const SUCCESS_COLOR    = Colors.success;
const WARNING_COLOR    = Colors.warning;
const ERROR_COLOR      = Colors.error;
const INFO_COLOR       = Colors.info;
const PURPLE_COLOR     = Colors.purple || "#8B5CF6";
const PINK_COLOR       = Colors.pink || "#EC4899";

const CARD_RADIUS  = 20;
const INNER_RADIUS = 14;
const CARD_PAD     = 20;
const CARD_BORDER  = "rgba(255,255,255,0.06)";

// ─── Komponen UI (konsisten) ──────────────────────────────────────────────────

const SectionHeader = ({ title }: { title: string }) => (
  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
    <View
      style={{
        width: 3, height: 13, backgroundColor: ACCENT_COLOR,
        borderRadius: 2, marginRight: 8,
      }}
    />
    <Text
      style={{
        color: Colors.gray400, fontSize: 10, fontWeight: "700",
        letterSpacing: 1.2, textTransform: "uppercase",
      }}
    >
      {title}
    </Text>
  </View>
);

const SettingRow = ({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  icon,
  iconColor = ACCENT_COLOR,
  isLast = false,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  isLast?: boolean;
}) => (
  <View>
    <View
      style={{
        flexDirection: "row", alignItems: "center", paddingVertical: 12,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {icon && (
        <View
          style={{
            width: 36, height: 36, borderRadius: 10,
            alignItems: "center", justifyContent: "center",
            backgroundColor: `${iconColor}15`, marginRight: 14, flexShrink: 0,
          }}
        >
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "600", marginBottom: description ? 2 : 0 }}>
          {label}
        </Text>
        {description && (
          <Text style={{ color: Colors.gray400, fontSize: 11, paddingRight: 8, lineHeight: 16 }}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.surfaceLight, true: ACCENT_COLOR }}
        thumbColor="#FFFFFF"
        disabled={disabled}
        style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
      />
    </View>
    {!isLast && <View style={{ height: 1, backgroundColor: CARD_BORDER, marginLeft: icon ? 50 : 0 }} />}
  </View>
);

// ─── TimePickerModal ──────────────────────────────────────────────────────────

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

  if (Platform.OS === "ios") {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={{ flex: 1, justifyContent: "flex-end" }} pointerEvents="box-none">
          <TouchableOpacity
            style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.6)" }}
            activeOpacity={1}
            onPress={onClose}
          />
          <View style={{ backgroundColor: SURFACE_COLOR, borderTopLeftRadius: CARD_RADIUS, borderTopRightRadius: CARD_RADIUS }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1, borderBottomColor: CARD_BORDER }}>
              <Text style={{ color: TEXT_PRIMARY, fontSize: 16, fontWeight: "700" }}>{title}</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={Colors.gray400} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                style={{ width: "100%" }}
                textColor={TEXT_PRIMARY}
                themeVariant="dark"
              />
              <View style={{ alignItems: "center", marginTop: 16 }}>
                <Text style={{ color: TEXT_PRIMARY, fontSize: 36, fontWeight: "800" }}>
                  {selectedTime.getHours().toString().padStart(2, "0")}:{selectedTime.getMinutes().toString().padStart(2, "0")}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", padding: 20, paddingTop: 0, gap: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 14, borderRadius: INNER_RADIUS, alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: CARD_BORDER }}
                onPress={onClose}
              >
                <Text style={{ color: Colors.gray300, fontSize: 14, fontWeight: "600" }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 14, borderRadius: INNER_RADIUS, alignItems: "center", backgroundColor: ACCENT_COLOR, shadowColor: ACCENT_COLOR, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}
                onPress={handleConfirm}
              >
                <Text style={{ color: BACKGROUND_COLOR, fontSize: 14, fontWeight: "800" }}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  if (Platform.OS === "android" && showPicker) {
    return <DateTimePicker value={selectedTime} mode="time" display="default" onChange={handleTimeChange} themeVariant="dark" />;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }} pointerEvents="box-none">
        <TouchableOpacity style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.6)" }} activeOpacity={1} onPress={onClose} />
        <View style={{ width: "100%", backgroundColor: SURFACE_COLOR, borderRadius: CARD_RADIUS, borderWidth: 1, borderColor: CARD_BORDER, overflow: "hidden" }}>
          <View style={{ padding: 24, paddingBottom: 16 }}>
            <Text style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: "800", textAlign: "center", marginBottom: 6 }}>{title}</Text>
            <Text style={{ color: Colors.gray400, fontSize: 12, textAlign: "center", marginBottom: 24 }}>Pilih waktu notifikasi</Text>
            <View style={{ alignItems: "center", marginBottom: 24 }}>
              <Text style={{ color: TEXT_PRIMARY, fontSize: 48, fontWeight: "800", letterSpacing: -1 }}>
                {selectedTime.getHours().toString().padStart(2, "0")}:{selectedTime.getMinutes().toString().padStart(2, "0")}
              </Text>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 10 }}>
              {["07:30", "12:00", "15:00", "20:00", "22:00"].map((time) => {
                const [h, m] = time.split(":").map(Number);
                const isSelected = selectedTime.getHours() === h && selectedTime.getMinutes() === m;
                return (
                  <TouchableOpacity
                    key={time}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                      backgroundColor: isSelected ? ACCENT_COLOR : `${Colors.gray400}15`,
                      borderWidth: 1, borderColor: isSelected ? ACCENT_COLOR : `${Colors.gray400}25`,
                    }}
                    onPress={() => {
                      const d = new Date(); d.setHours(h, m, 0, 0); setSelectedTime(d);
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "700", color: isSelected ? BACKGROUND_COLOR : TEXT_SECONDARY }}>{time}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={{ flexDirection: "row", padding: 24, paddingTop: 16, gap: 12 }}>
            <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: INNER_RADIUS, alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: CARD_BORDER }} onPress={onClose}>
              <Text style={{ color: Colors.gray300, fontSize: 14, fontWeight: "600" }}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: INNER_RADIUS, alignItems: "center", backgroundColor: ACCENT_COLOR, shadowColor: ACCENT_COLOR, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }} onPress={() => setShowPicker(true)}>
              <Text style={{ color: BACKGROUND_COLOR, fontSize: 14, fontWeight: "800" }}>Pilih Waktu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SettingsScreen = () => {
  const { clearAllData, refreshData, debugStorage, state, setLoading } = useAppContext();

  const [notificationSettings, setNotificationSettings] = useState(DEFAULT_NOTIFICATION_SETTINGS);
  const [appSettings, setAppSettings]                   = useState(DEFAULT_APP_SETTINGS);
  const [hasPermission, setHasPermission]               = useState(false);
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading]                       = useState(true);
  const [activeTab, setActiveTab]                       = useState<"notifications" | "data">("notifications");
  const [showAdvanced, setShowAdvanced]                 = useState(false);
  const [timePickerConfig, setTimePickerConfig]         = useState<{ visible: boolean; type: "morning" | "evening" | "quietStart" | "quietEnd" | null; }>({ visible: false, type: null });

  useEffect(() => {
    loadAllSettings();
    checkPermission();
    loadScheduledNotifications();
  }, []);

  const loadAllSettings = async () => {
    try {
      const savedNotifSettings = await notificationService.getNotificationSettings();
      setNotificationSettings(savedNotifSettings);
      const savedAppSettings = await AsyncStorage.getItem(APP_SETTINGS_KEY);
      if (savedAppSettings) setAppSettings(JSON.parse(savedAppSettings));
    } catch (error) {  }
    finally { setIsLoading(false); }
  };

  const saveNotificationSettings = async (newSettings: typeof DEFAULT_NOTIFICATION_SETTINGS) => {
    try {
      // Optimistic UI update
      setNotificationSettings(newSettings);
      
      // Update asynchronously to prevent UI lag (especially when re-scheduling 35+ notifications)
      notificationService.updateNotificationSettings(newSettings, state).catch(() => {});
    } catch (error) {  }
  };

  const saveAppSettings = async (newSettings: typeof DEFAULT_APP_SETTINGS) => {
    try {
      await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(newSettings));
      setAppSettings(newSettings);
    } catch (error) {  }
  };

  const checkPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const loadScheduledNotifications = async () => {
    try {
      const notifications = await notificationService.getScheduledNotifications();
      setScheduledNotifications(notifications);
    } catch (error) {  }
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const requestPermission = async () => {
    try {
      const granted = await notificationService.registerForPushNotificationsAsync();
      setHasPermission(granted);
      if (granted) {
        await notificationService.reinitializeNotifications(state);
        Alert.alert("Berhasil", "Izin notifikasi diberikan!");
      } else {
        Alert.alert("Izin Dibutuhkan", "Untuk mengirim notifikasi, aplikasi membutuhkan izin. Silakan aktifkan di pengaturan perangkat.", [
          { text: "OK" }, { text: "Buka Pengaturan", onPress: () => Linking.openSettings() }
        ]);
      }
    } catch (error) {

      Alert.alert("Error", "Gagal meminta izin notifikasi");
    }
  };

  const toggleNotificationMaster = async (value: boolean) => {
    await saveNotificationSettings({ ...notificationSettings, enabled: value });
    if (!value) Alert.alert("Notifikasi Dimatikan", "Semua notifikasi telah dimatikan.");
  };

  const toggleNotificationSetting = async (key: keyof Omit<typeof DEFAULT_NOTIFICATION_SETTINGS, "advanced">) => {
    if (!notificationSettings.enabled) { Alert.alert("Notifikasi Dimatikan", "Aktifkan notifikasi terlebih dahulu."); return; }
    await saveNotificationSettings({ ...notificationSettings, [key]: !notificationSettings[key] });
  };

  const updateCustomSchedule = async (key: string, value: any) => {
    await saveNotificationSettings({
      ...notificationSettings,
      advanced: { ...notificationSettings.advanced, customSchedule: { ...notificationSettings.advanced?.customSchedule, [key]: value } },
    });
  };

  const updateQuietHours = async (key: string, value: any) => {
    await saveNotificationSettings({
      ...notificationSettings,
      advanced: { ...notificationSettings.advanced, quietHours: { ...notificationSettings.advanced?.quietHours, [key]: value } as AdvancedNotificationSettings["quietHours"] },
    });
  };

  const updateAdvancedSetting = async (key: keyof AdvancedNotificationSettings, value: any) => {
    await saveNotificationSettings({ ...notificationSettings, advanced: { ...notificationSettings.advanced, [key]: value } });
  };

  const toggleActiveDay = async (dayIndex: number) => {
    const currentDays = notificationSettings.advanced?.activeDays || [];
    const newDays = currentDays.includes(dayIndex) ? currentDays.filter((d) => d !== dayIndex) : [...currentDays, dayIndex];
    await updateAdvancedSetting("activeDays", newDays.sort());
  };

  const testNotification = async () => {
    if (!notificationSettings.enabled) { Alert.alert("Notifikasi Dimatikan", "Aktifkan notifikasi terlebih dahulu."); return; }
    await notificationService.sendNotification({
      title: "🔔 Test Notification", body: "Ini adalah notifikasi test dari MyMoney!", data: { type: "TEST" }, urgent: true,
    });
    Alert.alert("Berhasil", "Notifikasi test terkirim!");
  };

  const clearAllNotifications = async () => {
    await notificationService.cancelAllNotifications();
    await loadScheduledNotifications();
    Alert.alert("Berhasil", "Semua notifikasi dibersihkan");
  };

  const handleClearData = () => {
    Alert.alert("Hapus Semua Data", "Apakah Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.", [
      { text: "Batal", style: "cancel" },
      { 
        text: "Hapus", 
        style: "destructive", 
        onPress: async () => { 
          setLoading(true, "Menghapus data...");
          
          // Beri jeda sedikit agar animasi Among Us terlihat
          setTimeout(async () => {
            try {
              await clearAllData();
              setLoading(false);
              // Gunakan setTimeout agar alert tidak tertutup modal loading
              setTimeout(() => {
                Alert.alert("Berhasil", "Semua data telah dibersihkan.");
              }, 100);
            } catch (err) {
              setLoading(false);
            }
          }, 1500);
        } 
      }
    ]);
  };

  const handleExportData = async () => {
    try {
      setLoading(true, "Menyiapkan data backup...");
      // Ambil data langsung dari state AppContext
      const dataToExport = JSON.stringify(state, null, 2);
      
      const fileName = `MyMoney_Backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, dataToExport, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      setLoading(false);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: "Simpan Backup MyMoney",
          UTI: "public.json" // iOS specific
        });
      } else {
        Alert.alert("Gagal", "Fitur berbagi tidak tersedia di perangkat ini.");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Gagal melakukan ekspor data.");
    }
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "*/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        
        Alert.alert(
          "Konfirmasi Pulihkan Data",
          "Data saat ini akan DITIMPA dengan data dari file backup. Pastikan ini adalah file backup MyMoney yang valid. Lanjutkan?",
          [
            { text: "Batal", style: "cancel" },
            { 
              text: "Pulihkan", 
              style: "destructive", 
              onPress: async () => {
                setLoading(true, "Memulihkan data...");
                try {
                  const fileContent = await FileSystem.readAsStringAsync(fileUri, {
                    encoding: FileSystem.EncodingType.UTF8,
                  });
                  
                  const importedData = JSON.parse(fileContent);
                  
                  // Validasi sederhana
                  if (typeof importedData !== 'object' || !Array.isArray(importedData.transactions)) {
                    throw new Error("Format file tidak valid.");
                  }

                  // Timpa data menggunakan storageService
                  await storageService.saveData(importedData);
                  
                  // Refresh context
                  await refreshData();
                  
                  setLoading(false);
                  setTimeout(() => {
                    Alert.alert("Berhasil", "Data berhasil dipulihkan!");
                  }, 500);
                  
                } catch (error) {
                  setLoading(false);
                  setTimeout(() => {
                    Alert.alert("Error", "File backup tidak valid atau rusak.");
                  }, 500);
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert("Error", "Gagal membaca file.");
    }
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date(); date.setHours(hours, minutes);
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const getDayName = (index: number) => ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"][index];

  // ── Render ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: BACKGROUND_COLOR, alignItems: "center", justifyContent: "center" }}>
        <LottieView
          source={require("../../../assets/lottie/Loading 50 _ Among Us.json")}
          autoPlay
          loop
          style={{ width: 180, height: 180 }}
        />
        <Text style={{ color: TEXT_SECONDARY, fontSize: 13, marginTop: 10, fontWeight: "500" }}>
          Menyiapkan Pengaturan...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 20 }}>
        <Text style={{ color: TEXT_PRIMARY, fontSize: 20, fontWeight: "700" }}>Pengaturan</Text>
        <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 3 }}>Kelola prevensi dan data aplikasi</Text>
      </View>

      {/* ── Tab Control ─────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 18, marginBottom: 20 }}>
        <View style={{ flexDirection: "row", backgroundColor: SURFACE_COLOR, borderRadius: 13, padding: 3, borderWidth: 1, borderColor: CARD_BORDER }}>
          {(["notifications", "data"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center", backgroundColor: isActive ? `${ACCENT_COLOR}20` : "transparent" }}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 11, fontWeight: isActive ? "700" : "500", color: isActive ? ACCENT_COLOR : Colors.gray400 }}>
                  {tab === "notifications" ? "Notifikasi" : "Manajemen Data"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        
        {/* ══════════════════════════════════════════════════════════════════════
            NOTIFIKASI
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "notifications" && (
          <>
            {/* Master Toggle */}
            <View style={{ backgroundColor: SURFACE_COLOR, borderRadius: CARD_RADIUS, borderWidth: 1, borderColor: CARD_BORDER, padding: CARD_PAD, marginBottom: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: !hasPermission ? 16 : 0 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: notificationSettings.enabled ? `${ACCENT_COLOR}15` : `${Colors.gray500}15`, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                  <Ionicons name={notificationSettings.enabled ? "notifications" : "notifications-off"} size={22} color={notificationSettings.enabled ? ACCENT_COLOR : Colors.gray500} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: TEXT_PRIMARY, fontSize: 16, fontWeight: "700", marginBottom: 2 }}>{notificationSettings.enabled ? "Notifikasi Aktif" : "Notifikasi Mati"}</Text>
                  <Text style={{ color: Colors.gray400, fontSize: 11 }}>{hasPermission ? "Aplikasi memiliki izin mengirim push." : "Izin OS dibutuhkan."}</Text>
                </View>
                <Switch
                  value={notificationSettings.enabled}
                  onValueChange={toggleNotificationMaster}
                  trackColor={{ false: Colors.surfaceLight, true: ACCENT_COLOR }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {!hasPermission ? (
                <TouchableOpacity
                  style={{ backgroundColor: ACCENT_COLOR, paddingVertical: 12, borderRadius: INNER_RADIUS, alignItems: "center" }}
                  onPress={requestPermission}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: BACKGROUND_COLOR, fontSize: 13, fontWeight: "700" }}>Berikan Izin OS</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Notification Types */}
            <SectionHeader title="Jenis Peringatan" />
            <View style={{ backgroundColor: SURFACE_COLOR, borderRadius: CARD_RADIUS, borderWidth: 1, borderColor: CARD_BORDER, paddingHorizontal: 16, marginBottom: 20 }}>
              {[
                { key: "dailyReminders",       label: "Pengingat Harian",    desc: "Alert rutin di pagi & malam",          icon: "alarm-outline"         as const, color: ACCENT_COLOR },
                { key: "budgetAlerts",          label: "Peringatan Anggaran", desc: "Beritahu bila hampir capai limit", icon: "pie-chart-outline"     as const, color: WARNING_COLOR },
                { key: "savingsProgress",       label: "Target Tabungan",     desc: "Info capaian nominal tabungan",        icon: "wallet-outline"        as const, color: SUCCESS_COLOR },
                { key: "transactionReminders",  label: "Pencatatan",          desc: "Ingatkan catat uang masuk & keluar",   icon: "receipt-outline"       as const, color: INFO_COLOR },
                { key: "notesReminders",        label: "Buku Catatan",        desc: "Jadwal tenggat catatan tersimpan",     icon: "document-text-outline" as const, color: PURPLE_COLOR },
                { key: "weeklyReports",         label: "Laporan Mingguan",    desc: "Rekap data tiap hari minggu",          icon: "bar-chart-outline"     as const, color: PINK_COLOR },
              ].map(({ key, label, desc, icon, color }, idx, arr) => (
                <SettingRow
                  key={key} label={label} description={desc} icon={icon} iconColor={color}
                  value={notificationSettings[key as keyof typeof DEFAULT_NOTIFICATION_SETTINGS] as boolean}
                  onValueChange={() => toggleNotificationSetting(key as any)}
                  disabled={!notificationSettings.enabled}
                  isLast={idx === arr.length - 1}
                />
              ))}
            </View>

            {/* Advanced Trigger */}
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: SURFACE_COLOR, borderRadius: 16, borderWidth: 1, borderColor: CARD_BORDER, padding: 16, marginBottom: 20 }}
              onPress={() => setShowAdvanced(!showAdvanced)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${Colors.gray400}15`, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                  <Ionicons name="options-outline" size={18} color={Colors.gray400} />
                </View>
                <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "600" }}>Pengaturan Jadwal Tepat</Text>
              </View>
              <Ionicons name={showAdvanced ? "chevron-up" : "chevron-down"} size={18} color={Colors.gray400} />
            </TouchableOpacity>

            {/* Advanced Section */}
            {showAdvanced && (
              <>
                <SectionHeader title="Jadwal & Waktu" />
                <View style={{ backgroundColor: SURFACE_COLOR, borderRadius: CARD_RADIUS, borderWidth: 1, borderColor: CARD_BORDER, paddingHorizontal: 16, marginBottom: 20 }}>
                  
                  {/* Morning Routine */}
                  <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: CARD_BORDER }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${WARNING_COLOR}15`, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                      <Ionicons name="sunny-outline" size={18} color={WARNING_COLOR} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "600", marginBottom: 4 }}>Notifikasi Pagi</Text>
                      <TouchableOpacity onPress={() => setTimePickerConfig({ visible: true, type: "morning" })}>
                        <View style={{ alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: `${ACCENT_COLOR}15` }}>
                          <Text style={{ color: ACCENT_COLOR, fontSize: 11, fontWeight: "700" }}>{formatTime(notificationSettings.advanced?.customSchedule?.morning || "07:30")}</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                    <Switch
                      value={notificationSettings.advanced?.customSchedule?.morningEnabled !== false}
                      onValueChange={(v) => updateCustomSchedule("morningEnabled", v)}
                      trackColor={{ false: Colors.surfaceLight, true: ACCENT_COLOR }}
                      thumbColor="#FFFFFF"
                      style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                    />
                  </View>

                  {/* Evening Routine */}
                  <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${PURPLE_COLOR}15`, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                      <Ionicons name="moon-outline" size={18} color={PURPLE_COLOR} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "600", marginBottom: 4 }}>Rekapitulasi Malam</Text>
                      <TouchableOpacity onPress={() => setTimePickerConfig({ visible: true, type: "evening" })}>
                        <View style={{ alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: `${ACCENT_COLOR}15` }}>
                          <Text style={{ color: ACCENT_COLOR, fontSize: 11, fontWeight: "700" }}>{formatTime(notificationSettings.advanced?.customSchedule?.evening || "20:00")}</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                    <Switch
                      value={notificationSettings.advanced?.customSchedule?.eveningEnabled !== false}
                      onValueChange={(v) => updateCustomSchedule("eveningEnabled", v)}
                      trackColor={{ false: Colors.surfaceLight, true: ACCENT_COLOR }}
                      thumbColor="#FFFFFF"
                      style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                    />
                  </View>
                </View>

                {/* Days Active */}
                <SectionHeader title="Hari Aktif" />
                <View style={{ backgroundColor: SURFACE_COLOR, borderRadius: CARD_RADIUS, borderWidth: 1, borderColor: CARD_BORDER, padding: CARD_PAD, marginBottom: 20 }}>
                  <Text style={{ color: Colors.gray400, fontSize: 11, marginBottom: 12 }}>Filter notifikasi diabaikan pasca tidak diceklis</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                      const isActive = notificationSettings.advanced?.activeDays?.includes(dayIndex);
                      return (
                        <TouchableOpacity
                          key={dayIndex}
                          style={{
                            width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center",
                            backgroundColor: isActive ? ACCENT_COLOR : "transparent",
                            borderWidth: 1, borderColor: isActive ? ACCENT_COLOR : CARD_BORDER,
                          }}
                          onPress={() => toggleActiveDay(dayIndex)}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 11, fontWeight: "700", color: isActive ? BACKGROUND_COLOR : Colors.gray400 }}>{getDayName(dayIndex)}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            DATA DAN SISTEM
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "data" && (
          <>
            <SectionHeader title="Backup & Restore (Offline)" />
            <View style={{ backgroundColor: SURFACE_COLOR, borderRadius: CARD_RADIUS, borderWidth: 1, borderColor: CARD_BORDER, paddingHorizontal: 16, marginBottom: 20 }}>
              <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: CARD_BORDER }} onPress={handleExportData} activeOpacity={0.7}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${ACCENT_COLOR}15`, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                  <Ionicons name="cloud-upload-outline" size={18} color={ACCENT_COLOR} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "600", marginBottom: 2 }}>Cadangkan Data (Backup)</Text>
                  <Text style={{ color: Colors.gray400, fontSize: 11, paddingRight: 8 }} numberOfLines={2}>Simpan seluruh data menjadi file .json yang aman</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.gray500} />
              </TouchableOpacity>

              <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14 }} onPress={handleImportData} activeOpacity={0.7}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${SUCCESS_COLOR}15`, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                  <Ionicons name="cloud-download-outline" size={18} color={SUCCESS_COLOR} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "600", marginBottom: 2 }}>Pulihkan Data (Restore)</Text>
                  <Text style={{ color: Colors.gray400, fontSize: 11, paddingRight: 8 }} numberOfLines={2}>Kembalikan data dari file backup .json sebelumnya</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.gray500} />
              </TouchableOpacity>
            </View>

            <SectionHeader title="Zona Kritis" />
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: `${ERROR_COLOR}10`, borderRadius: CARD_RADIUS, borderWidth: 1, borderColor: `${ERROR_COLOR}25`, padding: 16 }}
              onPress={handleClearData}
              activeOpacity={0.7}
            >
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${ERROR_COLOR}20`, alignItems: "center", justifyContent: "center", marginRight: 16 }}>
                <Ionicons name="trash" size={20} color={ERROR_COLOR} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: ERROR_COLOR, fontSize: 14, fontWeight: "700" }}>Wipe All Data</Text>
                <Text style={{ color: `${ERROR_COLOR}90`, fontSize: 11, marginTop: 4, lineHeight: 16 }}>Seluruh catatan keuangan, hutang, catatan akan dihapus permanen.</Text>
              </View>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <TimePickerModal
        visible={timePickerConfig.visible}
        onClose={() => setTimePickerConfig({ visible: false, type: null })}
        onTimeSelected={(time) => {
          if (timePickerConfig.type === "morning") updateCustomSchedule("morning", time);
          if (timePickerConfig.type === "evening") updateCustomSchedule("evening", time);
          if (timePickerConfig.type === "quietStart") updateQuietHours("start", time);
          if (timePickerConfig.type === "quietEnd") updateQuietHours("end", time);
          setTimePickerConfig({ visible: false, type: null });
        }}
        initialTime={
          timePickerConfig.type === "morning"     ? notificationSettings.advanced?.customSchedule?.morning || "07:30" :
          timePickerConfig.type === "evening"     ? notificationSettings.advanced?.customSchedule?.evening || "20:00" :
          timePickerConfig.type === "quietStart"  ? notificationSettings.advanced?.quietHours?.start       || "22:00" :
                                                    notificationSettings.advanced?.quietHours?.end         || "07:00"
        }
        title={
          timePickerConfig.type === "morning"     ? "Notifikasi Pagi"    :
          timePickerConfig.type === "evening"     ? "Rekapitulasi Malam"   :
          timePickerConfig.type === "quietStart"  ? "Mulai Quiet Hours" : "Akhir Quiet Hours"
        }
      />
    </SafeAreaView>
  );
};

export default SettingsScreen;