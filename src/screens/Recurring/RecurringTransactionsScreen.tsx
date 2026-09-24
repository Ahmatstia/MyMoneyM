// File: src/screens/Recurring/RecurringTransactionsScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useAppContext } from "../../context/AppContext";
import { RecurringTransaction } from "../../types";
import { useTheme } from "../../theme/ThemeContext";
import { formatCurrency, safeNumber } from "../../utils/calculations";
import { getFrequencyLabel } from "../../utils/recurring";
import { getJakartaDateKey } from "../../utils/dailyCheckIn";
import { AppHeader, AppFAB } from "../../components/common";
import {
  ALL_SYSTEM_CATEGORIES,
  CategoryItem,
} from "../../components/CategoryPickerModal";

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

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function getTomorrowDateKey(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getFirstOfNextMonthKey(): string {
  const d = new Date();
  const y = d.getMonth() === 11 ? d.getFullYear() + 1 : d.getFullYear();
  const m = String(((d.getMonth() + 1) % 12) + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

const RecurringTransactionsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const {
    state,
    deleteRecurringTransaction,
    toggleRecurringTransaction,
    processRecurringNow,
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<"all" | "income" | "expense">("all");
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
      ...(state.customCategories || []).map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        isCustom: true as const,
        customId: c.id,
      })),
      ...ALL_SYSTEM_CATEGORIES,
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

  // Navigation to dedicated Add/Edit form screen
  const handleOpenAdd = () => {
    navigation.navigate("AddRecurringTransaction");
  };

  const handleOpenEdit = (item: RecurringTransaction) => {
    navigation.navigate("AddRecurringTransaction", {
      editMode: true,
      recurringData: item,
    });
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
      <AppHeader
        title="Transaksi Rutin"
        subtitle="Pemasukan & Pengeluaran Otomatis"
      />

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
                    {/* Wallet Badge */}
                    {item.walletId && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          alignSelf: "flex-start",
                          backgroundColor: `${colors.border}50`,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                          gap: 4,
                        }}
                      >
                        <Ionicons name="wallet-outline" size={11} color={colors.gray400} />
                        <Text style={{ color: colors.gray400, fontSize: 10, fontWeight: "600" }}>
                          {(state.wallets || []).find((w) => w.id === item.walletId)?.name || "Dompet"}
                        </Text>
                      </View>
                    )}

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

      {/* ── Standardized Bottom-Right Squircle FAB ── */}
      <AppFAB
        onPress={handleOpenAdd}
        accessibilityLabel="Tambah Transaksi Rutin Baru"
      />
    </SafeAreaView>
  );
};

export default RecurringTransactionsScreen;
