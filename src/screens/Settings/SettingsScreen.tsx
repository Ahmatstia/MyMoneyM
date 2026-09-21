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
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import LottieView from "lottie-react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation } from "@react-navigation/native";
import * as Updates from "expo-updates";

import { notificationService } from "../../utils/notifications";
import { useAppContext } from "../../context/AppContext";
import { storageService } from "../../utils/storage";
import { exportAllCsv } from "../../utils/csvExport";
import { useTheme } from "../../theme/ThemeContext";
import { THEMES, ThemeId } from "../../theme/theme";
import {
  STORAGE_KEY_MASCOT_HIDDEN,
  resetSessionDismissed,
} from "../../components/Mascot/FloatingMascotBubble";
import { DEFAULT_CATEGORIES } from "../../components/CategoryPickerModal";

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
  quickActionsWidget: true,
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

const CARD_RADIUS = 20;
const INNER_RADIUS = 14;
const CARD_PAD = 20;
// ─── Komponen UI (konsisten) ──────────────────────────────────────────────────

const SectionHeader = ({ title }: { title: string }) => {
  const { colors } = useTheme();
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}
    >
      <View
        style={{
          width: 3,
          height: 13,
          backgroundColor: colors.accent,
          borderRadius: 2,
          marginRight: 8,
        }}
      />
      <Text
        style={{
          color: colors.gray400,
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 1.2,
          textTransform: "uppercase",
        }}
      >
        {title}
      </Text>
    </View>
  );
};

const SettingRow = ({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  icon,
  iconColor,
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
}) => {
  const { colors } = useTheme();
  const resolvedIconColor = iconColor ?? colors.accent;
  const CARD_BORDER = `${colors.border}80`;
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          opacity: disabled ? 0.45 : 1,
        }}
      >
        {icon && (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${resolvedIconColor}15`,
              marginRight: 14,
              flexShrink: 0,
            }}
          >
            <Ionicons name={icon} size={18} color={resolvedIconColor} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 13,
              fontWeight: "600",
              marginBottom: description ? 2 : 0,
            }}
          >
            {label}
          </Text>
          {description && (
            <Text
              style={{
                color: colors.gray400,
                fontSize: 11,
                paddingRight: 8,
                lineHeight: 16,
              }}
            >
              {description}
            </Text>
          )}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.surfaceLight, true: colors.accent }}
          thumbColor="#FFFFFF"
          disabled={disabled}
          style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
        />
      </View>
      {!isLast && (
        <View
          style={{
            height: 1,
            backgroundColor: CARD_BORDER,
            marginLeft: icon ? 50 : 0,
          }}
        />
      )}
    </View>
  );
};

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
  const { colors } = useTheme();
  const CARD_BORDER = `${colors.border}80`;
  const [selectedTime, setSelectedTime] = useState(() => {
    const [hours, minutes] = initialTime.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  });
  const [showPicker, setShowPicker] = useState(false);

  const handleTimeChange = (_event: any, time?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (time) {
      setSelectedTime(time);
      if (Platform.OS === "android") {
        const h = time.getHours().toString().padStart(2, "0");
        const m = time.getMinutes().toString().padStart(2, "0");
        onTimeSelected(`${h}:${m}`);
        onClose();
      }
    }
  };

  const handleTimeDismiss = () => {
    if (Platform.OS === "android") {
      setShowPicker(false);
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
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View
          style={{ flex: 1, justifyContent: "flex-end" }}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
            }}
            activeOpacity={1}
            onPress={onClose}
          />
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: CARD_RADIUS,
              borderTopRightRadius: CARD_RADIUS,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: CARD_BORDER,
              }}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                {title}
              </Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={colors.gray400} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="spinner"
                onValueChange={handleTimeChange}
                onDismiss={handleTimeDismiss}
                style={{ width: "100%" }}
                textColor={colors.textPrimary}
                themeVariant="dark"
              />
              <View style={{ alignItems: "center", marginTop: 16 }}>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 36,
                    fontWeight: "800",
                  }}
                >
                  {selectedTime.getHours().toString().padStart(2, "0")}:
                  {selectedTime.getMinutes().toString().padStart(2, "0")}
                </Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                padding: 20,
                paddingTop: 0,
                gap: 12,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: INNER_RADIUS,
                  alignItems: "center",
                  backgroundColor: `${colors.border}70`,
                  borderWidth: 1,
                  borderColor: CARD_BORDER,
                }}
                onPress={onClose}
              >
                <Text
                  style={{
                    color: colors.gray300,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  Batal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: INNER_RADIUS,
                  alignItems: "center",
                  backgroundColor: colors.accent,
                  shadowColor: colors.accent,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
                onPress={handleConfirm}
              >
                <Text
                  style={{
                    color: colors.background,
                    fontSize: 14,
                    fontWeight: "800",
                  }}
                >
                  Simpan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  if (Platform.OS === "android" && showPicker) {
    return (
      <DateTimePicker
        value={selectedTime}
        mode="time"
        display="default"
        onValueChange={handleTimeChange}
        onDismiss={handleTimeDismiss}
        themeVariant="dark"
      />
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={{
            width: "100%",
            backgroundColor: colors.surface,
            borderRadius: CARD_RADIUS,
            borderWidth: 1,
            borderColor: CARD_BORDER,
            overflow: "hidden",
          }}
        >
          <View style={{ padding: 24, paddingBottom: 16 }}>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 18,
                fontWeight: "800",
                textAlign: "center",
                marginBottom: 6,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                color: colors.gray400,
                fontSize: 12,
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              Pilih waktu notifikasi
            </Text>
            <View style={{ alignItems: "center", marginBottom: 24 }}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 48,
                  fontWeight: "800",
                  letterSpacing: -1,
                }}
              >
                {selectedTime.getHours().toString().padStart(2, "0")}:
                {selectedTime.getMinutes().toString().padStart(2, "0")}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              {["07:30", "12:00", "15:00", "20:00", "22:00"].map((time) => {
                const [h, m] = time.split(":").map(Number);
                const isSelected =
                  selectedTime.getHours() === h &&
                  selectedTime.getMinutes() === m;
                return (
                  <TouchableOpacity
                    key={time}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: isSelected
                        ? colors.accent
                        : `${colors.gray400}15`,
                      borderWidth: 1,
                      borderColor: isSelected
                        ? colors.accent
                        : `${colors.gray400}25`,
                    }}
                    onPress={() => {
                      const d = new Date();
                      d.setHours(h, m, 0, 0);
                      setSelectedTime(d);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: isSelected
                          ? colors.background
                          : colors.textSecondary,
                      }}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              padding: 24,
              paddingTop: 16,
              gap: 12,
            }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: INNER_RADIUS,
                alignItems: "center",
                backgroundColor: `${colors.border}70`,
                borderWidth: 1,
                borderColor: CARD_BORDER,
              }}
              onPress={onClose}
            >
              <Text
                style={{
                  color: colors.gray300,
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                Batal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: INNER_RADIUS,
                alignItems: "center",
                backgroundColor: colors.accent,
                shadowColor: colors.accent,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
              onPress={() => setShowPicker(true)}
            >
              <Text
                style={{
                  color: colors.background,
                  fontSize: 14,
                  fontWeight: "800",
                }}
              >
                Pilih Waktu
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SettingsScreen = () => {
  const { colors, themeId, setTheme } = useTheme();
  const navigation = useNavigation<any>();
  const CARD_BORDER = `${colors.border}80`;
  const { clearAllData, refreshData, debugStorage, state, setLoading, updatePaydayCutoff } =
    useAppContext();

  const [notificationSettings, setNotificationSettings] = useState(
    DEFAULT_NOTIFICATION_SETTINGS,
  );
  const [appSettings, setAppSettings] = useState(DEFAULT_APP_SETTINGS);
  const [hasPermission, setHasPermission] = useState(false);
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "financial" | "appearance" | "notifications" | "data"
  >("financial");
  const [paydayDate, setPaydayDate] = useState<number>(state.paydayCutoff || 1);
  const [tempPaydayInput, setTempPaydayInput] = useState<string>(
    (state.paydayCutoff || 1).toString(),
  );
  const [showPaydayModal, setShowPaydayModal] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isMoniVisible, setIsMoniVisible] = useState(true);
  const [timePickerConfig, setTimePickerConfig] = useState<{
    visible: boolean;
    type: "morning" | "evening" | "quietStart" | "quietEnd" | null;
  }>({ visible: false, type: null });

  useEffect(() => {
    loadAllSettings();
    checkPermission();
    loadScheduledNotifications();
  }, []);

  const loadAllSettings = async () => {
    try {
      const savedNotifSettings =
        await notificationService.getNotificationSettings();
      setNotificationSettings(savedNotifSettings);
      const savedAppSettings = await AsyncStorage.getItem(APP_SETTINGS_KEY);
      if (savedAppSettings) setAppSettings(JSON.parse(savedAppSettings));
      const savedMoniHidden = await AsyncStorage.getItem(STORAGE_KEY_MASCOT_HIDDEN);
      if (savedMoniHidden !== null) {
        setIsMoniVisible(savedMoniHidden !== "true");
      }
      const currentCutoff = state.paydayCutoff || 1;
      setPaydayDate(currentCutoff);
      setTempPaydayInput(currentCutoff.toString());
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMoniVisible = async (val: boolean) => {
    setIsMoniVisible(val);
    if (val) {
      resetSessionDismissed();
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEY_MASCOT_HIDDEN, val ? "false" : "true");
    } catch (e) {
      console.warn("Failed to toggle mascot visibility:", e);
    }
  };

  const handleSelectPayday = async (day: number) => {
    setPaydayDate(day);
    setShowPaydayModal(false);
    try {
      // Langsung simpan dan selaraskan otomatis di latar belakang secara mulus
      await updatePaydayCutoff(day, true);
    } catch (e) {
      console.warn("Failed to update payday cutoff:", e);
    }
  };

  const activeRecurringCount = (state.recurringTransactions || []).filter(
    (r) => r.isActive
  ).length;
  const totalRecurringCount = (state.recurringTransactions || []).length;
  const totalCategories =
    DEFAULT_CATEGORIES.length + (state.customCategories || []).length;

  const saveNotificationSettings = async (
    newSettings: typeof DEFAULT_NOTIFICATION_SETTINGS,
  ) => {
    try {
      // Optimistic UI update
      setNotificationSettings(newSettings);

      // Update asynchronously to prevent UI lag (especially when re-scheduling 35+ notifications)
      notificationService
        .updateNotificationSettings(newSettings, state)
        .catch(() => {});
    } catch (error) {}
  };

  const saveAppSettings = async (newSettings: typeof DEFAULT_APP_SETTINGS) => {
    try {
      await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(newSettings));
      setAppSettings(newSettings);
    } catch (error) {}
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
    } catch (error) {}
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const requestPermission = async () => {
    try {
      const granted =
        await notificationService.registerForPushNotificationsAsync();
      setHasPermission(granted);
      if (granted) {
        await notificationService.reinitializeNotifications(state);
        Alert.alert("Berhasil", "Izin notifikasi diberikan!");
      } else {
        Alert.alert(
          "Izin Dibutuhkan",
          "Untuk mengirim notifikasi, aplikasi membutuhkan izin. Silakan aktifkan di pengaturan perangkat.",
          [
            { text: "OK" },
            { text: "Buka Pengaturan", onPress: () => Linking.openSettings() },
          ],
        );
      }
    } catch (error) {
      Alert.alert("Error", "Gagal meminta izin notifikasi");
    }
  };

  const toggleNotificationMaster = async (value: boolean) => {
    await saveNotificationSettings({ ...notificationSettings, enabled: value });
    if (!value)
      Alert.alert("Notifikasi Dimatikan", "Semua notifikasi telah dimatikan.");
  };

  const toggleNotificationSetting = async (
    key: keyof Omit<typeof DEFAULT_NOTIFICATION_SETTINGS, "advanced">,
  ) => {
    if (!notificationSettings.enabled) {
      Alert.alert(
        "Notifikasi Dimatikan",
        "Aktifkan notifikasi terlebih dahulu.",
      );
      return;
    }
    await saveNotificationSettings({
      ...notificationSettings,
      [key]: !notificationSettings[key],
    });
  };

  const updateCustomSchedule = async (key: string, value: any) => {
    await saveNotificationSettings({
      ...notificationSettings,
      advanced: {
        ...notificationSettings.advanced,
        customSchedule: {
          ...notificationSettings.advanced?.customSchedule,
          [key]: value,
        },
      },
    });
  };

  const updateQuietHours = async (key: string, value: any) => {
    await saveNotificationSettings({
      ...notificationSettings,
      advanced: {
        ...notificationSettings.advanced,
        quietHours: {
          ...notificationSettings.advanced?.quietHours,
          [key]: value,
        } as AdvancedNotificationSettings["quietHours"],
      },
    });
  };

  const updateAdvancedSetting = async (
    key: keyof AdvancedNotificationSettings,
    value: any,
  ) => {
    await saveNotificationSettings({
      ...notificationSettings,
      advanced: { ...notificationSettings.advanced, [key]: value },
    });
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
      Alert.alert(
        "Notifikasi Dimatikan",
        "Aktifkan notifikasi terlebih dahulu.",
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
            setLoading(true, "Menghapus data...");

            // Beri jeda sedikit agar animasi Among Us terlihat
            setTimeout(async () => {
              try {
                await clearAllData();
                setLoading(false);
                // Langsung navigasi ke Onboarding tanpa reload app
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Onboarding" }],
                });
              } catch (err) {
                setLoading(false);
              }
            }, 1500);
          },
        },
      ],
    );
  };

  const handleExportData = async () => {
    try {
      setLoading(true, "Menyiapkan data backup...");
      // Ambil data langsung dari state AppContext
      const dataToExport = JSON.stringify(state, null, 2);

      const fileName = `MyMoney_Backup_${new Date().toISOString().split("T")[0]}.json`;
      const file = new File(Paths.join(Paths.document, fileName));
      await file.write(dataToExport);

      setLoading(false);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/json",
          dialogTitle: "Simpan Backup MyMoney",
          UTI: "public.json", // iOS specific
        });
      } else {
        Alert.alert("Gagal", "Fitur berbagi tidak tersedia di perangkat ini.");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Gagal melakukan ekspor data.");
    }
  };

  const handleExportCsv = async () => {
    try {
      setLoading(true, "Menyiapkan data CSV untuk Machine Learning...");

      const csvFiles = exportAllCsv(state);
      let exportedCount = 0;

      for (const { filename, content } of csvFiles) {
        const file = new File(Paths.join(Paths.document, filename));
        await file.write(content);
        exportedCount++;
      }

      setLoading(false);

      // Opsi berbagi file CSV (All-in-One gabungan atau Transaksi)
      if (csvFiles.length > 0 && (await Sharing.isAvailableAsync())) {
        Alert.alert(
          "Ekspor CSV Selesai",
          `${exportedCount} berkas CSV tersimpan di memori lokal. Pilih berkas yang ingin dibagikan:`,
          [
            {
              text: "Semua Data (All-in-One)",
              onPress: async () => {
                const target =
                  csvFiles.find((f) => f.filename === "mymoney_all_in_one.csv") ||
                  csvFiles[0];
                const fileUri = Paths.join(Paths.document, target.filename);
                await Sharing.shareAsync(fileUri, {
                  mimeType: "text/csv",
                  dialogTitle: "Bagikan Ekspor Semua Data MyMoney",
                  UTI: "public.comma-separated-values-text",
                });
              },
            },
            {
              text: "Transaksi Saja",
              onPress: async () => {
                const target =
                  csvFiles.find((f) => f.filename === "mymoney_transactions.csv") ||
                  csvFiles[0];
                const fileUri = Paths.join(Paths.document, target.filename);
                await Sharing.shareAsync(fileUri, {
                  mimeType: "text/csv",
                  dialogTitle: "Bagikan Riwayat Transaksi CSV",
                  UTI: "public.comma-separated-values-text",
                });
              },
            },
            { text: "Tutup", style: "cancel" },
          ],
        );
      } else {
        Alert.alert(
          "CSV Siap",
          `${exportedCount} file CSV berhasil dibuat di penyimpanan lokal:\n${csvFiles.map((f) => f.filename).join("\n")}`,
        );
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Gagal melakukan ekspor CSV.");
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
                  const fileContent = await new File(fileUri).text();

                  const importedData = JSON.parse(fileContent);

                  // Validasi sederhana
                  if (
                    typeof importedData !== "object" ||
                    !Array.isArray(importedData.transactions)
                  ) {
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
              },
            },
          ],
        );
      }
    } catch (error) {
      Alert.alert("Error", "Gagal membaca file.");
    }
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

  const getDayName = (index: number) =>
    ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"][index];

  // ── Render ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LottieView
          source={require("../../../assets/lottie/task/Loading 50 _ Among Us.json")}
          autoPlay
          loop
          style={{ width: 180, height: 180 }}
        />
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 13,
            marginTop: 10,
            fontWeight: "500",
          }}
        >
          Menyiapkan Pengaturan...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <View
        style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 20 }}
      >
        <Text
          style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "700" }}
        >
          Pengaturan
        </Text>
        <Text style={{ color: colors.gray400, fontSize: 11, marginTop: 3 }}>
          Kelola prevensi dan data aplikasi
        </Text>
      </View>

      {/* ── Tab Control ─────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 18, marginBottom: 20 }}>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.surface,
            borderRadius: 13,
            padding: 3,
            borderWidth: 1,
            borderColor: CARD_BORDER,
          }}
        >
          {(["financial", "appearance", "notifications", "data"] as const).map(
            (tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: isActive
                      ? `${colors.accent}20`
                      : "transparent",
                  }}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: isActive ? "700" : "500",
                      color: isActive ? colors.accent : colors.gray400,
                    }}
                    numberOfLines={1}
                  >
                    {tab === "financial"
                      ? "Pembukuan"
                      : tab === "appearance"
                        ? "Tampilan"
                        : tab === "notifications"
                          ? "Notifikasi"
                          : "Data & Info"}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════════════════════════════════════════════
            PEMBUKUAN (FINANCIAL MASTER DATA)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "financial" && (
          <>
            <SectionHeader title="Master Data & Jadwal" />
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: CARD_RADIUS,
                borderWidth: 1,
                borderColor: CARD_BORDER,
                paddingHorizontal: 16,
                marginBottom: 24,
              }}
            >
              {/* Transaksi Rutin */}
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: CARD_BORDER,
                }}
                onPress={() => navigation.navigate("RecurringTransactions")}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: `${colors.accent}15`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Ionicons name="repeat-outline" size={20} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "700" }}>
                      Transaksi Rutin
                    </Text>
                    <View style={{ backgroundColor: `${colors.accent}20`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                      <Text style={{ color: colors.accent, fontSize: 10, fontWeight: "700" }}>
                        {activeRecurringCount} Aktif
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: colors.gray400, fontSize: 11, lineHeight: 16 }} numberOfLines={2}>
                    Otomatisasi pencatatan gaji berkala, tagihan bulanan, dan langganan rutin
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.gray500} style={{ marginLeft: 8 }} />
              </TouchableOpacity>

              {/* Kategori Transaksi */}
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 14,
                }}
                onPress={() => navigation.navigate("ManageCategories")}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: `${colors.info}15`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Ionicons name="pricetags-outline" size={20} color={colors.info} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "700" }}>
                      Kategori
                    </Text>
                    <View style={{ backgroundColor: `${colors.info}20`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                      <Text style={{ color: colors.info, fontSize: 10, fontWeight: "700" }}>
                        {totalCategories} Kategori
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: colors.gray400, fontSize: 11, lineHeight: 16 }} numberOfLines={2}>
                    Kelola nama, ikon visual, dan warna kategori transaksi kustom Anda
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.gray500} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>

            <SectionHeader title="Periode & Aturan Pembukuan" />
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: CARD_RADIUS,
                borderWidth: 1,
                borderColor: CARD_BORDER,
                paddingHorizontal: 16,
                marginBottom: 24,
              }}
            >
              {/* Tanggal Cut-off / Gajian */}
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: CARD_BORDER,
                }}
                onPress={() => {
                  setTempPaydayInput(paydayDate.toString());
                  setShowPaydayModal(true);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: `${colors.success}15`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "700", marginBottom: 2 }}>
                    Awal Siklus 
                  </Text>
                  <Text style={{ color: colors.gray400, fontSize: 11, lineHeight: 16 }}>
                    Acuan perputaran bulan finansial Anda (Tiap tanggal {paydayDate})
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "700", marginRight: 4 }}>
                    Tgl {paydayDate}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.gray500} />
                </View>
              </TouchableOpacity>

              {/* Sinkronisasi Kas Otomatis */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: CARD_BORDER,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: `${colors.warning}15`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Ionicons name="swap-horizontal-outline" size={20} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "700", marginBottom: 2 }}>
                    Prinsip Pembukuan Ganda
                  </Text>
                  <Text style={{ color: colors.gray400, fontSize: 11, lineHeight: 16 }}>
                    Pinjaman utang & setoran tabungan terintegrasi otomatis dengan saldo dompet kas
                  </Text>
                </View>
                <View style={{ backgroundColor: `${colors.success}20`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                  <Text style={{ color: colors.success, fontSize: 10, fontWeight: "700" }}>Aktif ✓</Text>
                </View>
              </View>

              {/* Mata Uang */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 14,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: `${colors.purple}15`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Ionicons name="cash-outline" size={20} color={colors.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "700", marginBottom: 2 }}>
                    Format Mata Uang
                  </Text>
                  <Text style={{ color: colors.gray400, fontSize: 11, lineHeight: 16 }}>
                    Format nominal Indonesia (IDR - Rp) dengan pemisah titik ribuan
                  </Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "600" }}>
                  IDR (Rp)
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAMPILAN
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "appearance" && (
          <>
            <SectionHeader title="Maskot Finansial" />
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: CARD_RADIUS,
                borderWidth: 1,
                borderColor: CARD_BORDER,
                padding: CARD_PAD,
                marginBottom: 20,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: `${colors.accent}15`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>🐱</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 15,
                      fontWeight: "700",
                      marginBottom: 2,
                    }}
                  >
                    Maskot Moni di Beranda
                  </Text>
                  <Text style={{ color: colors.gray400, fontSize: 11 }}>
                    Tampilkan widget interaktif Moni melayang di layar beranda
                  </Text>
                </View>
                <Switch
                  value={isMoniVisible}
                  onValueChange={toggleMoniVisible}
                  trackColor={{
                    false: colors.surfaceLight,
                    true: colors.accent,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <SectionHeader title="Tema Aplikasi" />
            <View style={{ marginBottom: 24 }}>
              {Object.entries(THEMES).map(([id, themeData], index) => {
                const isSelected = themeId === id;
                return (
                  <TouchableOpacity
                    key={id}
                    onPress={() => setTheme(id as ThemeId)}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.surface,
                      padding: 16,
                      borderRadius: CARD_RADIUS,
                      borderWidth: 1,
                      borderColor: isSelected ? themeData.accent : CARD_BORDER,
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      {/* Warna preview */}
                      <View style={{ flexDirection: "row", marginRight: 14 }}>
                        <View
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 9,
                            backgroundColor: themeData.background,
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.1)",
                            zIndex: 3,
                          }}
                        />
                        <View
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 9,
                            backgroundColor: themeData.surface,
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.1)",
                            marginLeft: -8,
                            zIndex: 2,
                          }}
                        />
                        <View
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 9,
                            backgroundColor: themeData.accent,
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.1)",
                            marginLeft: -8,
                            zIndex: 1,
                          }}
                        />
                      </View>
                      <View>
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: 14,
                            fontWeight: isSelected ? "700" : "600",
                          }}
                        >
                          {id
                            .split("-")
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(" ")}
                        </Text>
                        <Text
                          style={{
                            color: colors.gray400,
                            fontSize: 11,
                            marginTop: 2,
                          }}
                        >
                          {id === "emerald"
                            ? "Tema default (Hijau zamrud)"
                            : id === "sapphire"
                              ? "Elegan (Biru safir)"
                              : id === "ruby"
                                ? "Berani (Merah rubi)"
                                : id === "amethyst"
                                  ? "Mewah (Ungu ametis)"
                                  : id === "midnight"
                                    ? "Gelap murni (Midnight)"
                                    : "Tema kustom"}
                        </Text>
                      </View>
                    </View>

                    {isSelected && (
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: themeData.accent,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={themeData.background}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            NOTIFIKASI
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "notifications" && (
          <>
            {/* Master Toggle */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: CARD_RADIUS,
                borderWidth: 1,
                borderColor: CARD_BORDER,
                padding: CARD_PAD,
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: !hasPermission ? 16 : 0,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: notificationSettings.enabled
                      ? `${colors.accent}15`
                      : `${colors.gray500}15`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Ionicons
                    name={
                      notificationSettings.enabled
                        ? "notifications"
                        : "notifications-off"
                    }
                    size={22}
                    color={
                      notificationSettings.enabled
                        ? colors.accent
                        : colors.gray500
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 16,
                      fontWeight: "700",
                      marginBottom: 2,
                    }}
                  >
                    {notificationSettings.enabled
                      ? "Notifikasi Aktif"
                      : "Notifikasi Mati"}
                  </Text>
                  <Text style={{ color: colors.gray400, fontSize: 11 }}>
                    {hasPermission
                      ? "Aplikasi memiliki izin mengirim push."
                      : "Izin OS dibutuhkan."}
                  </Text>
                </View>
                <Switch
                  value={notificationSettings.enabled}
                  onValueChange={toggleNotificationMaster}
                  trackColor={{
                    false: colors.surfaceLight,
                    true: colors.accent,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {!hasPermission ? (
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.accent,
                    paddingVertical: 12,
                    borderRadius: INNER_RADIUS,
                    alignItems: "center",
                  }}
                  onPress={requestPermission}
                  activeOpacity={0.8}
                >
                  <Text
                    style={{
                      color: colors.background,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    Berikan Izin OS
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Notification Types */}
            <SectionHeader title="Jenis Peringatan" />
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: CARD_RADIUS,
                borderWidth: 1,
                borderColor: CARD_BORDER,
                paddingHorizontal: 16,
                marginBottom: 20,
              }}
            >
              {[
                {
                  key: "quickActionsWidget",
                  label: "Widget Layar Atas (Cepat)",
                  desc: "Tampilkan jatah harian & tombol catat di bar status",
                  icon: "flash-outline" as const,
                  color: colors.accent,
                },
                {
                  key: "dailyReminders",
                  label: "Pengingat Harian",
                  desc: "Alert rutin di pagi & malam",
                  icon: "alarm-outline" as const,
                  color: colors.info,
                },
                {
                  key: "budgetAlerts",
                  label: "Peringatan Anggaran",
                  desc: "Beritahu bila hampir capai limit",
                  icon: "pie-chart-outline" as const,
                  color: colors.warning,
                },
                {
                  key: "savingsProgress",
                  label: "Target Tabungan",
                  desc: "Info capaian nominal tabungan",
                  icon: "wallet-outline" as const,
                  color: colors.success,
                },
                {
                  key: "transactionReminders",
                  label: "Pencatatan",
                  desc: "Ingatkan catat uang masuk & keluar",
                  icon: "receipt-outline" as const,
                  color: colors.info,
                },
                {
                  key: "notesReminders",
                  label: "Buku Catatan",
                  desc: "Jadwal tenggat catatan tersimpan",
                  icon: "document-text-outline" as const,
                  color: colors.purple,
                },
                {
                  key: "weeklyReports",
                  label: "Laporan Mingguan",
                  desc: "Rekap data tiap hari minggu",
                  icon: "bar-chart-outline" as const,
                  color: colors.pink,
                },
              ].map(({ key, label, desc, icon, color }, idx, arr) => (
                <SettingRow
                  key={key}
                  label={label}
                  description={desc}
                  icon={icon}
                  iconColor={color}
                  value={
                    notificationSettings[
                      key as keyof typeof DEFAULT_NOTIFICATION_SETTINGS
                    ] as boolean
                  }
                  onValueChange={() => toggleNotificationSetting(key as any)}
                  disabled={!notificationSettings.enabled}
                  isLast={idx === arr.length - 1}
                />
              ))}
            </View>

            {/* Advanced Trigger */}
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: CARD_BORDER,
                padding: 16,
                marginBottom: 20,
              }}
              onPress={() => setShowAdvanced(!showAdvanced)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: `${colors.gray400}15`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Ionicons
                    name="options-outline"
                    size={18}
                    color={colors.gray400}
                  />
                </View>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  Pengaturan Jadwal Tepat
                </Text>
              </View>
              <Ionicons
                name={showAdvanced ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.gray400}
              />
            </TouchableOpacity>

            {/* Advanced Section */}
            {showAdvanced && (
              <>
                <SectionHeader title="Jadwal & Waktu" />
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: CARD_RADIUS,
                    borderWidth: 1,
                    borderColor: CARD_BORDER,
                    paddingHorizontal: 16,
                    marginBottom: 20,
                  }}
                >
                  {/* Morning Routine */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: CARD_BORDER,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: `${colors.warning}15`,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 14,
                      }}
                    >
                      <Ionicons
                        name="sunny-outline"
                        size={18}
                        color={colors.warning}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontSize: 13,
                          fontWeight: "600",
                          marginBottom: 4,
                        }}
                      >
                        Notifikasi Pagi
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          setTimePickerConfig({
                            visible: true,
                            type: "morning",
                          })
                        }
                      >
                        <View
                          style={{
                            alignSelf: "flex-start",
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            backgroundColor: `${colors.accent}15`,
                          }}
                        >
                          <Text
                            style={{
                              color: colors.accent,
                              fontSize: 11,
                              fontWeight: "700",
                            }}
                          >
                            {formatTime(
                              notificationSettings.advanced?.customSchedule
                                ?.morning || "07:30",
                            )}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                    <Switch
                      value={
                        notificationSettings.advanced?.customSchedule
                          ?.morningEnabled !== false
                      }
                      onValueChange={(v) =>
                        updateCustomSchedule("morningEnabled", v)
                      }
                      trackColor={{
                        false: colors.surfaceLight,
                        true: colors.accent,
                      }}
                      thumbColor="#FFFFFF"
                      style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                    />
                  </View>

                  {/* Evening Routine */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 14,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: `${colors.purple}15`,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 14,
                      }}
                    >
                      <Ionicons
                        name="moon-outline"
                        size={18}
                        color={colors.purple}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontSize: 13,
                          fontWeight: "600",
                          marginBottom: 4,
                        }}
                      >
                        Rekapitulasi Malam
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          setTimePickerConfig({
                            visible: true,
                            type: "evening",
                          })
                        }
                      >
                        <View
                          style={{
                            alignSelf: "flex-start",
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            backgroundColor: `${colors.accent}15`,
                          }}
                        >
                          <Text
                            style={{
                              color: colors.accent,
                              fontSize: 11,
                              fontWeight: "700",
                            }}
                          >
                            {formatTime(
                              notificationSettings.advanced?.customSchedule
                                ?.evening || "20:00",
                            )}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                    <Switch
                      value={
                        notificationSettings.advanced?.customSchedule
                          ?.eveningEnabled !== false
                      }
                      onValueChange={(v) =>
                        updateCustomSchedule("eveningEnabled", v)
                      }
                      trackColor={{
                        false: colors.surfaceLight,
                        true: colors.accent,
                      }}
                      thumbColor="#FFFFFF"
                      style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                    />
                  </View>
                </View>

                {/* Days Active */}
                <SectionHeader title="Hari Aktif" />
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: CARD_RADIUS,
                    borderWidth: 1,
                    borderColor: CARD_BORDER,
                    padding: CARD_PAD,
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{
                      color: colors.gray400,
                      fontSize: 11,
                      marginBottom: 12,
                    }}
                  >
                    Filter notifikasi diabaikan pasca tidak diceklis
                  </Text>
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                      const isActive =
                        notificationSettings.advanced?.activeDays?.includes(
                          dayIndex,
                        );
                      return (
                        <TouchableOpacity
                          key={dayIndex}
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: isActive
                              ? colors.accent
                              : "transparent",
                            borderWidth: 1,
                            borderColor: isActive ? colors.accent : CARD_BORDER,
                          }}
                          onPress={() => toggleActiveDay(dayIndex)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "700",
                              color: isActive
                                ? colors.background
                                : colors.gray400,
                            }}
                          >
                            {getDayName(dayIndex)}
                          </Text>
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
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: CARD_RADIUS,
                borderWidth: 1,
                borderColor: CARD_BORDER,
                paddingHorizontal: 16,
                marginBottom: 20,
              }}
            >
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: CARD_BORDER,
                }}
                onPress={handleExportData}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: `${colors.accent}15`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Ionicons
                    name="cloud-upload-outline"
                    size={18}
                    color={colors.accent}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 13,
                      fontWeight: "600",
                      marginBottom: 2,
                    }}
                  >
                    Cadangkan Data (Backup JSON)
                  </Text>
                  <Text
                    style={{
                      color: colors.gray400,
                      fontSize: 11,
                      paddingRight: 8,
                    }}
                    numberOfLines={2}
                  >
                    Simpan seluruh data menjadi file .json
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.gray500}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: CARD_BORDER,
                }}
                onPress={handleExportCsv}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: `${colors.info}15`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Ionicons name="grid-outline" size={18} color={colors.info} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 13,
                      fontWeight: "600",
                      marginBottom: 2,
                    }}
                  >
                    Ekspor Data CSV (ML Ready)
                  </Text>
                  <Text
                    style={{
                      color: colors.gray400,
                      fontSize: 11,
                      paddingRight: 8,
                    }}
                    numberOfLines={2}
                  >
                    6 file CSV siap olah untuk Machine Learning
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.gray500}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 14,
                }}
                onPress={handleImportData}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: `${colors.success}15`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Ionicons
                    name="cloud-download-outline"
                    size={18}
                    color={colors.success}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 13,
                      fontWeight: "600",
                      marginBottom: 2,
                    }}
                  >
                    Pulihkan Data (Restore JSON)
                  </Text>
                  <Text
                    style={{
                      color: colors.gray400,
                      fontSize: 11,
                      paddingRight: 8,
                    }}
                    numberOfLines={2}
                  >
                    Kembalikan data dari file backup .json
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.gray500}
                />
              </TouchableOpacity>
            </View>

            <SectionHeader title="Tentang Aplikasi" />
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: CARD_RADIUS,
                borderWidth: 1,
                borderColor: CARD_BORDER,
                padding: 18,
                marginBottom: 24,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: `${colors.accent}15`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Ionicons name="wallet" size={24} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "700" }}>
                    MyMoney Mobile
                  </Text>
                  <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "600", marginTop: 1 }}>
                    Versi 1.0.4 • Offline-First Edition
                  </Text>
                </View>
              </View>

              <View style={{ backgroundColor: `${colors.border}40`, height: 1, marginBottom: 12 }} />

              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} style={{ marginRight: 8, marginTop: 1 }} />
                <Text style={{ color: colors.gray400, fontSize: 11, flex: 1, lineHeight: 16 }}>
                  Seluruh data keuangan disimpan secara lokal di perangkat Anda. Tidak ada data yang dikirim ke server pihak ketiga demi keamanan dan privasi finansial maksimal.
                </Text>
              </View>
            </View>

            <SectionHeader title="Zona Kritis" />
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: `${colors.error}10`,
                borderRadius: CARD_RADIUS,
                borderWidth: 1,
                borderColor: `${colors.error}25`,
                padding: 16,
              }}
              onPress={handleClearData}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: `${colors.error}20`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <Ionicons name="trash" size={20} color={colors.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.error,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  Wipe All Data
                </Text>
                <Text
                  style={{
                    color: `${colors.error}90`,
                    fontSize: 11,
                    marginTop: 4,
                    lineHeight: 16,
                  }}
                >
                  Seluruh catatan keuangan, hutang, catatan akan dihapus
                  permanen.
                </Text>
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
          if (timePickerConfig.type === "morning")
            updateCustomSchedule("morning", time);
          if (timePickerConfig.type === "evening")
            updateCustomSchedule("evening", time);
          if (timePickerConfig.type === "quietStart")
            updateQuietHours("start", time);
          if (timePickerConfig.type === "quietEnd")
            updateQuietHours("end", time);
          setTimePickerConfig({ visible: false, type: null });
        }}
        initialTime={
          timePickerConfig.type === "morning"
            ? notificationSettings.advanced?.customSchedule?.morning || "07:30"
            : timePickerConfig.type === "evening"
              ? notificationSettings.advanced?.customSchedule?.evening ||
                "20:00"
              : timePickerConfig.type === "quietStart"
                ? notificationSettings.advanced?.quietHours?.start || "22:00"
                : notificationSettings.advanced?.quietHours?.end || "07:00"
        }
        title={
          timePickerConfig.type === "morning"
            ? "Notifikasi Pagi"
            : timePickerConfig.type === "evening"
              ? "Rekapitulasi Malam"
              : timePickerConfig.type === "quietStart"
                ? "Mulai Quiet Hours"
                : "Akhir Quiet Hours"
        }
      />

      {/* ── Modal Pemilih Tanggal Siklus / Gajian (Interactive Bottom Sheet) ── */}
      <Modal
        visible={showPaydayModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaydayModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowPaydayModal(false)}
          />
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderTopWidth: 1,
              borderColor: CARD_BORDER,
              padding: 24,
              paddingBottom: Platform.OS === "ios" ? 40 : 28,
            }}
          >
            {/* Drag Handle Indicator */}
            <View
              style={{
                width: 42,
                height: 4,
                backgroundColor: `${colors.border}80`,
                borderRadius: 2,
                alignSelf: "center",
                marginBottom: 18,
              }}
            />

            {/* Modal Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: `${colors.accent}15`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="calendar" size={22} color={colors.accent} />
                </View>
                <View>
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "800" }}>
                    Awal Siklus Pembukuan
                  </Text>
                  <Text style={{ color: colors.gray400, fontSize: 11, marginTop: 2 }}>
                    Tentukan tanggal gajian / awal perputaran bulanan
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowPaydayModal(false)}
                style={{ padding: 4 }}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={24} color={colors.gray400} />
              </TouchableOpacity>
            </View>

            {/* Stepper & Manual Input Hero Box */}
            <View
              style={{
                backgroundColor: colors.background,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: `${colors.border}60`,
                padding: 16,
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                Tanggal Setiap Bulan
              </Text>

              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20 }}>
                {/* Decrement Button */}
                <TouchableOpacity
                  onPress={() => {
                    const currentVal = Math.max(1, Math.min(31, parseInt(tempPaydayInput, 10) || 1));
                    const newVal = currentVal > 1 ? currentVal - 1 : 31;
                    setTempPaydayInput(newVal.toString());
                  }}
                  activeOpacity={0.7}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: CARD_BORDER,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="remove" size={24} color={colors.textPrimary} />
                </TouchableOpacity>

                {/* Direct Number Input */}
                <View style={{ alignItems: "center", minWidth: 90 }}>
                  <TextInput
                    value={tempPaydayInput}
                    onChangeText={(val) => {
                      const clean = val.replace(/\D/g, "");
                      if (clean === "") {
                        setTempPaydayInput("");
                        return;
                      }
                      const num = parseInt(clean, 10);
                      if (num <= 31) {
                        setTempPaydayInput(num.toString());
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    textAlign="center"
                    placeholder="1"
                    placeholderTextColor={colors.gray500}
                    style={{
                      color: colors.accent,
                      fontSize: 40,
                      fontWeight: "900",
                      padding: 0,
                      height: 52,
                      minWidth: 70,
                    }}
                  />
                  <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "500", marginTop: 2 }}>
                    (Ketik 1 — 31)
                  </Text>
                </View>

                {/* Increment Button */}
                <TouchableOpacity
                  onPress={() => {
                    const currentVal = Math.max(1, Math.min(31, parseInt(tempPaydayInput, 10) || 1));
                    const newVal = currentVal < 31 ? currentVal + 1 : 1;
                    setTempPaydayInput(newVal.toString());
                  }}
                  activeOpacity={0.7}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: CARD_BORDER,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="add" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>


            {/* Live Explanation Box */}
            <View
              style={{
                backgroundColor: `${colors.info}12`,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: `${colors.info}25`,
                padding: 14,
                marginBottom: 20,
                flexDirection: "row",
                alignItems: "flex-start",
              }}
            >
              <Ionicons name="information-circle" size={18} color={colors.info} style={{ marginRight: 10, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: "700", lineHeight: 17 }}>
                  Simulasi Siklus Finansial:
                </Text>
                <Text style={{ color: colors.gray400, fontSize: 11, lineHeight: 16, marginTop: 2 }}>
                  Siklus 1 bulan Anda akan dihitung dari <Text style={{ color: colors.info, fontWeight: "700" }}>Tanggal {Math.max(1, Math.min(31, parseInt(tempPaydayInput, 10) || 1))}</Text> hingga <Text style={{ color: colors.info, fontWeight: "700" }}>{((Math.max(1, Math.min(31, parseInt(tempPaydayInput, 10) || 1)) - 1) === 0 ? "Akhir Bulan" : `Tanggal ${Math.max(1, Math.min(31, parseInt(tempPaydayInput, 10) || 1)) - 1}`)}</Text> bulan berikutnya.
                </Text>
              </View>
            </View>

            {/* Action Save Button */}
            <TouchableOpacity
              onPress={() => {
                const finalDay = Math.max(1, Math.min(31, parseInt(tempPaydayInput, 10) || 1));
                handleSelectPayday(finalDay);
              }}
              activeOpacity={0.8}
              style={{
                backgroundColor: colors.accent,
                borderRadius: 16,
                paddingVertical: 15,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
                Simpan Tanggal Siklus
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default SettingsScreen;
