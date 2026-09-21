// File: src/screens/Recurring/RecurringTransactionsScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useAppContext } from "../../context/AppContext";
import { RecurringTransaction, RecurringFrequency, TransactionType } from "../../types";
import { useTheme } from "../../theme/ThemeContext";
import { formatCurrency, safeNumber } from "../../utils/calculations";
import { getFrequencyLabel, formatDateString } from "../../utils/recurring";
import { getJakartaDateKey } from "../../utils/dailyCheckIn";
import { DEFAULT_CATEGORIES, CategoryItem } from "../../components/CategoryPickerModal";

type SafeIconName = keyof typeof Ionicons.glyphMap;

const CARD_RADIUS = 20;
const INNER_RADIUS = 14;

const DAYS_OF_WEEK = [
  { id: 1, name: "Senin" },
  { id: 2, name: "Selasa" },
  { id: 3, name: "Rabu" },
  { id: 4, name: "Kamis" },
  { id: 5, name: "Jumat" },
  { id: 6, name: "Sabtu" },
  { id: 7, name: "Minggu" },
];

const RecurringTransactionsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const {
    state,
    addRecurringTransaction,
    editRecurringTransaction,
    deleteRecurringTransaction,
    toggleRecurringTransaction,
    processRecurringNow,
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<"all" | "income" | "expense">("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);

  // Form states
  const [formType, setFormType] = useState<TransactionType>("income");
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("Uang Bulanan");
  const [formFrequency, setFormFrequency] = useState<RecurringFrequency>("monthly");
  const [formDayOfWeek, setFormDayOfWeek] = useState<number>(1);
  const [formDayOfMonth, setFormDayOfMonth] = useState<number>(25);
  const [formIntervalDays, setFormIntervalDays] = useState<string>("7");
  const [formStartDate, setFormStartDate] = useState<string>(getJakartaDateKey());
  const [formAutoCycle, setFormAutoCycle] = useState<boolean>(true);
  const [formCycleDays, setFormCycleDays] = useState<string>("30");
  const [formDescription, setFormDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const recurringList = state.recurringTransactions || [];

  // Filtered recurring list
  const filteredList = useMemo(() => {
    if (activeTab === "all") return recurringList;
    return recurringList.filter((item) => item.type === activeTab);
  }, [recurringList, activeTab]);

  // Summary counts
  const summary = useMemo(() => {
    const activeIncomes = recurringList.filter((r) => r.isActive && r.type === "income");
    const activeExpenses = recurringList.filter((r) => r.isActive && r.type === "expense");
    const totalIncomeEst = activeIncomes.reduce((s, r) => s + safeNumber(r.amount), 0);
    const totalExpenseEst = activeExpenses.reduce((s, r) => s + safeNumber(r.amount), 0);

    return {
      activeCount: recurringList.filter((r) => r.isActive).length,
      incomeCount: activeIncomes.length,
      expenseCount: activeExpenses.length,
      totalIncomeEst,
      totalExpenseEst,
    };
  }, [recurringList]);

  // Categories resolution
  const allCategories: CategoryItem[] = useMemo(() => {
    return [
      ...DEFAULT_CATEGORIES,
      ...(state.customCategories || []).map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        isCustom: true as const,
        customId: c.id,
      })),
    ];
  }, [state.customCategories]);

  const resolveCategory = (categoryName: string): CategoryItem => {
    const found = allCategories.find((c) => c.name === categoryName || (categoryName === "Gaji" && c.id === "pemasukan"));
    return (
      found || {
        id: "unknown",
        name: categoryName,
        icon: "receipt-outline",
        color: colors.gray400,
      }
    );
  };

  const getSafeIcon = (iconName: string): SafeIconName => {
    if (iconName in Ionicons.glyphMap) return iconName as SafeIconName;
    return "receipt-outline";
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormType("income");
    setFormName("");
    setFormAmount("");
    setFormCategory("Uang Bulanan");
    setFormFrequency("monthly");
    setFormDayOfWeek(1);
    setFormDayOfMonth(state.paydayCutoff || 25);
    setFormIntervalDays("7");
    setFormStartDate(getJakartaDateKey());
    setFormAutoCycle(true);
    setFormCycleDays("30");
    setFormDescription("");
    setModalVisible(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: RecurringTransaction) => {
    setEditingItem(item);
    setFormType(item.type);
    setFormName(item.name);
    setFormAmount(String(item.amount));
    setFormCategory(item.category);
    setFormFrequency(item.frequency);
    setFormDayOfWeek(item.dayOfWeek || 1);
    setFormDayOfMonth(item.dayOfMonth || 1);
    setFormIntervalDays(String(item.intervalDays || 7));
    setFormStartDate(item.startDate);
    setFormAutoCycle(item.autoStartNewCycle ?? true);
    setFormCycleDays(String(item.cyclePeriodDays || (item.frequency === "weekly" ? 7 : 30)));
    setFormDescription(item.description || "");
    setModalVisible(true);
  };

  // Save Modal Form
  const handleSave = async () => {
    const rawName = formName.trim();
    if (!rawName) {
      Alert.alert("Perhatian", "Silakan masukkan nama transaksi rutin");
      return;
    }

    const numAmount = parseFloat(formAmount.replace(/\D/g, ""));
    if (!numAmount || numAmount <= 0) {
      Alert.alert("Perhatian", "Silakan masukkan nominal yang valid");
      return;
    }

    const cycleDaysVal =
      formType === "income" && formAutoCycle
        ? Math.max(1, parseInt(formCycleDays, 10) || (formFrequency === "weekly" ? 7 : 30))
        : undefined;

    const intervalDaysVal =
      formFrequency === "custom_days"
        ? Math.max(1, parseInt(formIntervalDays, 10) || 7)
        : undefined;

    if (editingItem) {
      await editRecurringTransaction(editingItem.id, {
        name: rawName,
        amount: numAmount,
        type: formType,
        category: formCategory,
        frequency: formFrequency,
        dayOfWeek: formFrequency === "weekly" ? formDayOfWeek : undefined,
        dayOfMonth: formFrequency === "monthly" ? formDayOfMonth : undefined,
        intervalDays: intervalDaysVal,
        startDate: formStartDate,
        autoStartNewCycle: formType === "income" ? formAutoCycle : undefined,
        cyclePeriodDays: cycleDaysVal,
        description: formDescription.trim(),
      });
    } else {
      await addRecurringTransaction({
        name: rawName,
        amount: numAmount,
        type: formType,
        category: formCategory,
        frequency: formFrequency,
        dayOfWeek: formFrequency === "weekly" ? formDayOfWeek : undefined,
        dayOfMonth: formFrequency === "monthly" ? formDayOfMonth : undefined,
        intervalDays: intervalDaysVal,
        startDate: formStartDate,
        autoStartNewCycle: formType === "income" ? formAutoCycle : undefined,
        cyclePeriodDays: cycleDaysVal,
        description: formDescription.trim(),
        isActive: true,
      });
    }

    setModalVisible(false);
  };

  // Delete Action
  const handleDelete = (item: RecurringTransaction) => {
    Alert.alert(
      "Hapus Transaksi Rutin",
      `Apakah Anda yakin ingin menghapus jadwal "${item.name}"? Transaksi yang sudah tercatat sebelumnya tidak akan dihapus.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => deleteRecurringTransaction(item.id),
        },
      ]
    );
  };

  // Trigger Sync / Catch-up Now
  const handleTriggerSync = async () => {
    setIsProcessing(true);
    try {
      await processRecurringNow();
      Alert.alert(
        "Pemeriksaan Selesai",
        "Pemeriksaan jadwal transaksi rutin telah berhasil dijalankan."
      );
    } catch {
      Alert.alert("Info", "Tidak ada transaksi yang perlu dieksekusi saat ini.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate relative days
  const getRelativeDayLabel = (dateStr: string): string => {
    const todayStr = getJakartaDateKey();
    if (dateStr === todayStr) return "Hari Ini ⚡";

    const [y1, m1, d1] = todayStr.split("-").map(Number);
    const [y2, m2, d2] = dateStr.split("-").map(Number);
    const date1 = new Date(y1, m1 - 1, d1);
    const date2 = new Date(y2, m2 - 1, d2);
    const diffDays = Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Besok";
    if (diffDays > 1) return `${diffDays} hari lagi`;
    if (diffDays < 0) return `${Math.abs(diffDays)} hari lalu`;
    return dateStr;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 18,
          paddingTop: 14,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: `${colors.border}80`,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "800" }}>
              Transaksi Rutin
            </Text>
            <Text style={{ color: colors.gray400, fontSize: 11, marginTop: 1 }}>
              Pemasukan & Pengeluaran Otomatis
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleTriggerSync}
          disabled={isProcessing}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: `${colors.accent}18`,
            borderWidth: 1,
            borderColor: `${colors.accent}30`,
          }}
        >
          <Ionicons
            name="sync-outline"
            size={14}
            color={colors.accent}
            style={{ marginRight: 5 }}
          />
          <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "700" }}>
            {isProcessing ? "Memproses..." : "Cek Jadwal"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 110, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Info & Summary Banner ────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: CARD_RADIUS,
            padding: 16,
            borderWidth: 1,
            borderColor: `${colors.border}80`,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: `${colors.accent}18`,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <Ionicons name="repeat-outline" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "700" }}>
                Otomatisasi Keuangan
              </Text>
              <Text style={{ color: colors.gray400, fontSize: 11, marginTop: 1 }}>
                Transaksi dicatat otomatis saat aplikasi dibuka
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: `${colors.accent}15`,
              }}
            >
              <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "800" }}>
                {summary.activeCount} Aktif
              </Text>
            </View>
          </View>

          {/* Mini Stats Grid */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.background,
                borderRadius: INNER_RADIUS,
                padding: 12,
                borderLeftWidth: 3,
                borderLeftColor: colors.success,
              }}
            >
              <Text style={{ color: colors.gray400, fontSize: 10, fontWeight: "600" }}>
                Pemasukan Rutin ({summary.incomeCount})
              </Text>
              <Text
                style={{
                  color: colors.success,
                  fontSize: 14,
                  fontWeight: "800",
                  marginTop: 4,
                }}
              >
                {formatCurrency(summary.totalIncomeEst)}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: colors.background,
                borderRadius: INNER_RADIUS,
                padding: 12,
                borderLeftWidth: 3,
                borderLeftColor: colors.error,
              }}
            >
              <Text style={{ color: colors.gray400, fontSize: 10, fontWeight: "600" }}>
                Pengeluaran Rutin ({summary.expenseCount})
              </Text>
              <Text
                style={{
                  color: colors.error,
                  fontSize: 14,
                  fontWeight: "800",
                  marginTop: 4,
                }}
              >
                {formatCurrency(summary.totalExpenseEst)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Filter Tabs ─────────────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 4,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: `${colors.border}60`,
          }}
        >
          {[
            { id: "all", label: "Semua" },
            { id: "income", label: "Pemasukan" },
            { id: "expense", label: "Pengeluaran" },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id as any)}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  alignItems: "center",
                  borderRadius: 10,
                  backgroundColor: isSelected ? colors.accent : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: isSelected ? "700" : "500",
                    color: isSelected ? "#FFFFFF" : colors.gray400,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── List of Recurring Items ──────────────────────────────────────── */}
        {filteredList.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: CARD_RADIUS,
              padding: 32,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: `${colors.border}80`,
              marginTop: 10,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 24,
                backgroundColor: `${colors.accent}12`,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons name="repeat-outline" size={32} color={colors.accent} />
            </View>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 16,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              Belum Ada Transaksi Rutin
            </Text>
            <Text
              style={{
                color: colors.gray400,
                fontSize: 12,
                textAlign: "center",
                marginTop: 6,
                lineHeight: 18,
                maxWidth: 260,
              }}
            >
              Atur pemasukan berkala (uang bulanan/uang saku) atau tagihan rutin agar tercatat otomatis
              tepat waktu tanpa repot.
            </Text>
            <TouchableOpacity
              onPress={handleOpenAdd}
              activeOpacity={0.8}
              style={{
                marginTop: 20,
                backgroundColor: colors.accent,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 14,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>
                Tambah Jadwal Baru
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filteredList.map((item) => {
              const isIncome = item.type === "income";
              const accentColor = isIncome ? colors.success : colors.error;
              const catInfo = resolveCategory(item.category);
              const relativeLabel = getRelativeDayLabel(item.nextRunDate);

              return (
                <View
                  key={item.id}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: CARD_RADIUS,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: `${colors.border}80`,
                    borderLeftWidth: 4,
                    borderLeftColor: item.isActive ? accentColor : colors.gray500,
                    opacity: item.isActive ? 1 : 0.65,
                  }}
                >
                  {/* Top Row: Icon, Title & Switch */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                        marginRight: 10,
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          backgroundColor: `${catInfo.color}18`,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                        }}
                      >
                        <Ionicons
                          name={getSafeIcon(catInfo.icon)}
                          size={20}
                          color={catInfo.color}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: 15,
                            fontWeight: "800",
                          }}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 2,
                            gap: 6,
                          }}
                        >
                          <Text style={{ color: colors.gray400, fontSize: 11 }}>
                            {item.category}
                          </Text>
                          <Text style={{ color: colors.gray500, fontSize: 10 }}>•</Text>
                          <Text
                            style={{
                              color: isIncome ? colors.success : colors.error,
                              fontSize: 11,
                              fontWeight: "700",
                            }}
                          >
                            {isIncome ? "Pemasukan" : "Pengeluaran"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Switch Active/Paused */}
                    <View style={{ alignItems: "flex-end" }}>
                      <Switch
                        value={item.isActive}
                        onValueChange={() => toggleRecurringTransaction(item.id)}
                        trackColor={{
                          false: colors.surfaceLight || "#334155",
                          true: `${accentColor}70`,
                        }}
                        thumbColor={item.isActive ? accentColor : "#94A3B8"}
                        style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                      />
                      <Text
                        style={{
                          color: item.isActive ? colors.gray400 : colors.warning,
                          fontSize: 9,
                          fontWeight: "700",
                          marginTop: -2,
                        }}
                      >
                        {item.isActive ? "Aktif" : "Dijeda"}
                      </Text>
                    </View>
                  </View>

                  {/* Nominal & Schedule Badge */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 8,
                      borderTopWidth: 1,
                      borderBottomWidth: 1,
                      borderColor: `${colors.border}40`,
                      marginBottom: 10,
                    }}
                  >
                    <View>
                      <Text style={{ color: colors.gray400, fontSize: 10 }}>
                        Nominal Rutin
                      </Text>
                      <Text
                        style={{
                          color: accentColor,
                          fontSize: 16,
                          fontWeight: "800",
                          marginTop: 1,
                        }}
                      >
                        {isIncome ? "+ " : "- "}
                        {formatCurrency(item.amount)}
                      </Text>
                    </View>

                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 10,
                        backgroundColor: colors.background,
                        borderWidth: 1,
                        borderColor: `${colors.border}60`,
                        alignItems: "flex-end",
                      }}
                    >
                      <Text style={{ color: colors.gray400, fontSize: 10 }}>Frekuensi</Text>
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontSize: 12,
                          fontWeight: "700",
                          marginTop: 1,
                        }}
                      >
                        {getFrequencyLabel(item)}
                      </Text>
                    </View>
                  </View>

                  {/* Badges / Information Tags */}
                  <View style={{ gap: 6, marginBottom: 12 }}>
                    {/* Auto period cycle badge */}
                    {isIncome && item.autoStartNewCycle && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: `${colors.accent}12`,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 8,
                        }}
                      >
                        <Ionicons
                          name="sparkles"
                          size={12}
                          color={colors.accent}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={{
                            color: colors.accent,
                            fontSize: 11,
                            fontWeight: "700",
                            flex: 1,
                          }}
                        >
                          Target Bertahan Otomatis ({item.cyclePeriodDays || 30} Hari)
                        </Text>
                      </View>
                    )}

                    {/* Next Run & Last Run */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons
                          name="calendar-outline"
                          size={12}
                          color={colors.gray400}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={{ color: colors.gray400, fontSize: 11 }}>
                          Jadwal Berikutnya:{" "}
                          <Text
                            style={{
                              color: colors.textPrimary,
                              fontWeight: "700",
                            }}
                          >
                            {item.nextRunDate}
                          </Text>
                        </Text>
                      </View>

                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                          backgroundColor: `${colors.accent}18`,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.accent,
                            fontSize: 10,
                            fontWeight: "700",
                          }}
                        >
                          {relativeLabel}
                        </Text>
                      </View>
                    </View>

                    {item.lastRunDate && (
                      <Text style={{ color: colors.gray500, fontSize: 10 }}>
                        Terakhir dicatat: {item.lastRunDate}
                      </Text>
                    )}
                  </View>

                  {/* Actions Row: Edit & Delete */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "flex-end",
                      gap: 8,
                      borderTopWidth: 1,
                      borderTopColor: `${colors.border}40`,
                      paddingTop: 10,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => handleOpenEdit(item)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: `${colors.accent}12`,
                      }}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={13}
                        color={colors.accent}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={{
                          color: colors.accent,
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        Ubah
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDelete(item)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: `${colors.error}12`,
                      }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={13}
                        color={colors.error}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={{
                          color: colors.error,
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        Hapus
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── Floating Add Button ─────────────────────────────────────────────── */}
      <TouchableOpacity
        onPress={handleOpenAdd}
        activeOpacity={0.85}
        style={{
          position: "absolute",
          bottom: 24,
          right: 20,
          backgroundColor: colors.accent,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderRadius: 30,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>
          Jadwal Baru
        </Text>
      </TouchableOpacity>

      {/* ── Add / Edit Modal ────────────────────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: "90%",
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: Platform.OS === "ios" ? 36 : 24,
              borderTopWidth: 1,
              borderTopColor: `${colors.border}80`,
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <View>
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "800" }}>
                  {editingItem ? "Ubah Transaksi Rutin" : "Tambah Transaksi Rutin"}
                </Text>
                <Text style={{ color: colors.gray400, fontSize: 11, marginTop: 2 }}>
                  Tentukan jadwal otomatis dan frekuensi
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={20} color={colors.gray400} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
              {/* Type Switcher */}
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  padding: 4,
                  marginBottom: 16,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setFormType("income");
                    if (formCategory === "Makanan" || formCategory === "Transportasi") {
                      setFormCategory("Uang Bulanan");
                    }
                  }}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    alignItems: "center",
                    borderRadius: 9,
                    backgroundColor: formType === "income" ? colors.success : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: formType === "income" ? "#FFFFFF" : colors.gray400,
                    }}
                  >
                    Pemasukan
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setFormType("expense");
                    if (formCategory === "Uang Bulanan" || formCategory === "Pemasukan Rutin" || formCategory === "Investasi" || formCategory === "Gaji") {
                      setFormCategory("Tagihan");
                    }
                  }}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    alignItems: "center",
                    borderRadius: 9,
                    backgroundColor: formType === "expense" ? colors.error : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: formType === "expense" ? "#FFFFFF" : colors.gray400,
                    }}
                  >
                    Pengeluaran
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Nama Transaksi */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>
                  NAMA JADWAL / TRANSAKSI
                </Text>
                <TextInput
                  value={formName}
                  onChangeText={setFormName}
                  placeholder={
                    formType === "income" ? "Contoh: Uang Bulanan / Honor" : "Contoh: Tagihan Kost"
                  }
                  placeholderTextColor={colors.gray500}
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: colors.textPrimary,
                    fontSize: 14,
                    borderWidth: 1,
                    borderColor: `${colors.border}80`,
                  }}
                />
              </View>

              {/* Nominal */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>
                  NOMINAL (RP)
                </Text>
                <TextInput
                  value={
                    formAmount
                      ? `Rp ${parseInt(formAmount.replace(/\D/g, ""), 10).toLocaleString("id-ID")}`
                      : ""
                  }
                  onChangeText={(t) => setFormAmount(t.replace(/\D/g, ""))}
                  keyboardType="numeric"
                  placeholder="Rp 0"
                  placeholderTextColor={colors.gray500}
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: formType === "income" ? colors.success : colors.error,
                    fontSize: 18,
                    fontWeight: "800",
                    borderWidth: 1,
                    borderColor: `${colors.border}80`,
                  }}
                />
              </View>

              {/* Kategori Quick Chips */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>
                  KATEGORI
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {(formType === "income"
                      ? ["Uang Bulanan", "Pemasukan Rutin", "Investasi", "Tabungan", "Hadiah", "Lainnya"]
                      : ["Tagihan", "Listrik", "Air", "Internet", "Cicilan", "Makanan", "Rumah", "Langganan", "Lainnya"]
                    ).map((catName) => {
                      const isSelected = formCategory === catName;
                      return (
                        <TouchableOpacity
                          key={catName}
                          onPress={() => setFormCategory(catName)}
                          activeOpacity={0.7}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 12,
                            backgroundColor: isSelected
                              ? `${colors.accent}20`
                              : colors.background,
                            borderWidth: 1,
                            borderColor: isSelected ? colors.accent : `${colors.border}60`,
                          }}
                        >
                          <Text
                            style={{
                              color: isSelected ? colors.accent : colors.gray400,
                              fontSize: 12,
                              fontWeight: isSelected ? "700" : "500",
                            }}
                          >
                            {catName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              {/* Frekuensi Selector */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>
                  FREKUENSI RUTIN
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {[
                    { id: "weekly", label: "Mingguan" },
                    { id: "monthly", label: "Bulanan" },
                    { id: "custom_days", label: "Setiap X Hari" },
                  ].map((freq) => {
                    const isSelected = formFrequency === freq.id;
                    return (
                      <TouchableOpacity
                        key={freq.id}
                        onPress={() => {
                          setFormFrequency(freq.id as any);
                          if (freq.id === "weekly") {
                            setFormCycleDays("7");
                          } else if (freq.id === "monthly") {
                            setFormCycleDays("30");
                          }
                        }}
                        activeOpacity={0.7}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          alignItems: "center",
                          borderRadius: 12,
                          backgroundColor: isSelected
                            ? `${colors.accent}20`
                            : colors.background,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.accent : `${colors.border}60`,
                        }}
                      >
                        <Text
                          style={{
                            color: isSelected ? colors.accent : colors.gray400,
                            fontSize: 12,
                            fontWeight: isSelected ? "700" : "500",
                          }}
                        >
                          {freq.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Detail Hari / Tanggal Berdasarkan Frekuensi */}
              {formFrequency === "weekly" && (
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>
                    PILIH HARI DALAM SEMINGGU
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {DAYS_OF_WEEK.map((d) => {
                        const isSelected = formDayOfWeek === d.id;
                        return (
                          <TouchableOpacity
                            key={d.id}
                            onPress={() => setFormDayOfWeek(d.id)}
                            activeOpacity={0.7}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              borderRadius: 10,
                              backgroundColor: isSelected ? colors.accent : colors.background,
                              borderWidth: 1,
                              borderColor: isSelected ? colors.accent : `${colors.border}60`,
                            }}
                          >
                            <Text
                              style={{
                                color: isSelected ? "#FFFFFF" : colors.gray400,
                                fontSize: 12,
                                fontWeight: "700",
                              }}
                            >
                              {d.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              )}

              {formFrequency === "monthly" && (
                <View style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "700" }}>
                      TANGGAL SETIAP BULAN (1 - 31)
                    </Text>
                    {state.paydayCutoff && state.paydayCutoff > 1 && (
                      <TouchableOpacity
                        onPress={() => setFormDayOfMonth(state.paydayCutoff!)}
                        activeOpacity={0.7}
                        style={{
                          backgroundColor: `${colors.accent}15`,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ color: colors.accent, fontSize: 10, fontWeight: "700" }}>
                          Awal Pembukuan (Tgl {state.paydayCutoff})
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: colors.background,
                      borderRadius: 14,
                      padding: 8,
                      borderWidth: 1,
                      borderColor: `${colors.border}80`,
                      marginBottom: 8,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => setFormDayOfMonth((prev) => Math.max(1, (prev || 1) - 1))}
                      activeOpacity={0.7}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: `${colors.border}80`,
                      }}
                    >
                      <Ionicons name="remove" size={18} color={colors.textPrimary} />
                    </TouchableOpacity>

                    <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "800" }}>
                      Tanggal {formDayOfMonth || 1} setiap bulan
                    </Text>

                    <TouchableOpacity
                      onPress={() => setFormDayOfMonth((prev) => Math.min(31, (prev || 1) + 1))}
                      activeOpacity={0.7}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: `${colors.border}80`,
                      }}
                    >
                      <Ionicons name="add" size={18} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {Array.from(
                        new Set([
                          1,
                          5,
                          10,
                          15,
                          20,
                          state.paydayCutoff || 25,
                          28,
                          30,
                        ]),
                      )
                        .sort((a, b) => a - b)
                        .map((dayNum) => {
                          const isSelected = formDayOfMonth === dayNum;
                          const isPayday =
                            dayNum === state.paydayCutoff &&
                            state.paydayCutoff > 1;
                          return (
                            <TouchableOpacity
                              key={dayNum}
                              onPress={() => setFormDayOfMonth(dayNum)}
                              activeOpacity={0.7}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 10,
                                backgroundColor: isSelected
                                  ? colors.accent
                                  : colors.background,
                                borderWidth: 1,
                                borderColor: isSelected
                                  ? colors.accent
                                  : isPayday
                                    ? `${colors.accent}60`
                                    : `${colors.border}60`,
                              }}
                            >
                              <Text
                                style={{
                                  color: isSelected ? "#FFFFFF" : colors.gray400,
                                  fontSize: 12,
                                  fontWeight: "700",
                                }}
                              >
                                Tgl {dayNum} {isPayday ? "⭐" : ""}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                    </View>
                  </ScrollView>
                </View>
              )}

              {formFrequency === "custom_days" && (
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>
                    INTERVAL HARI
                  </Text>
                  <TextInput
                    value={formIntervalDays}
                    onChangeText={(t) => setFormIntervalDays(t.replace(/\D/g, ""))}
                    keyboardType="numeric"
                    placeholder="Contoh: 14 (tiap 2 minggu)"
                    placeholderTextColor={colors.gray500}
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      color: colors.textPrimary,
                      fontSize: 14,
                      borderWidth: 1,
                      borderColor: `${colors.border}80`,
                    }}
                  />
                </View>
              )}

              {/* Khusus Pemasukan: Target Uang Bertahan Otomatis */}
              {formType === "income" && (
                <View
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 14,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: `${colors.accent}40`,
                    marginBottom: 16,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "700" }}>
                        Perbarui Target Uang Bertahan Otomatis
                      </Text>
                      <Text style={{ color: colors.gray400, fontSize: 11, marginTop: 2, lineHeight: 16 }}>
                        Otomatis perbarui jatah belanja harian di Beranda setiap transaksi ini tercatat.
                      </Text>
                    </View>
                    <Switch
                      value={formAutoCycle}
                      onValueChange={setFormAutoCycle}
                      trackColor={{
                        false: colors.surfaceLight || "#334155",
                        true: `${colors.accent}70`,
                      }}
                      thumbColor={formAutoCycle ? colors.accent : "#94A3B8"}
                    />
                  </View>

                  {formAutoCycle && (
                    <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: `${colors.border}50` }}>
                      <Text style={{ color: colors.gray400, fontSize: 10, fontWeight: "700", marginBottom: 6 }}>
                        DURASI UANG BERTAHAN (HARI)
                      </Text>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        {["7", "14", "30"].map((d) => (
                          <TouchableOpacity
                            key={d}
                            onPress={() => setFormCycleDays(d)}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 8,
                              backgroundColor: formCycleDays === d ? colors.accent : colors.surface,
                            }}
                          >
                            <Text
                              style={{
                                color: formCycleDays === d ? "#FFFFFF" : colors.gray400,
                                fontSize: 11,
                                fontWeight: "700",
                              }}
                            >
                              {d} Hari
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Tanggal Mulai */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>
                  TANGGAL MULAI (YYYY-MM-DD)
                </Text>
                <TextInput
                  value={formStartDate}
                  onChangeText={setFormStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.gray500}
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: colors.textPrimary,
                    fontSize: 14,
                    borderWidth: 1,
                    borderColor: `${colors.border}80`,
                  }}
                />
              </View>

              {/* Deskripsi Tambahan */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>
                  CATATAN / KETERANGAN (OPSIONAL)
                </Text>
                <TextInput
                  value={formDescription}
                  onChangeText={setFormDescription}
                  placeholder="Keterangan tambahan..."
                  placeholderTextColor={colors.gray500}
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: colors.textPrimary,
                    fontSize: 14,
                    borderWidth: 1,
                    borderColor: `${colors.border}80`,
                  }}
                />
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: `${colors.border}80`,
                  }}
                >
                  <Text style={{ color: colors.gray400, fontSize: 14, fontWeight: "700" }}>
                    Batal
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSave}
                  activeOpacity={0.8}
                  style={{
                    flex: 2,
                    backgroundColor: colors.accent,
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>
                    {editingItem ? "Simpan Perubahan" : "Buat Jadwal Rutin"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default RecurringTransactionsScreen;
