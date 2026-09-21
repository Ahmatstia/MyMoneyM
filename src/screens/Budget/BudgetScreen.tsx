// File: src/screens/BudgetScreen.tsx
import React, { useState, useMemo } from "react";
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, ScrollView, Alert, TouchableOpacity, Animated } from "react-native";
import { Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { formatCurrency, safeNumber, formatToDateKey } from "../../utils/calculations";
import { Budget } from "../../types";
import { useTheme } from '../../theme/ThemeContext';


// ─── Theme colors (tidak diubah) ──────────────────────────────────────────────
// ─── Design tokens (konsisten dengan seluruh app) ─────────────────────────────
const CARD_RADIUS  = 16;
const INNER_RADIUS = 12;
const CARD_PAD     = 13;
const SECTION_GAP  = 16;
// ─── Komponen UI (konsisten) ──────────────────────────────────────────────────

const Spacer = ({ size = SECTION_GAP }: { size?: number }) => (
  <View style={{ height: size }} />
);

const SectionHeader = ({
  title,
  linkLabel,
  onPress,
}: {
  title: string;
  linkLabel?: string;
  onPress?: () => void;
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
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
      {linkLabel && onPress && (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "600" }}>
            {linkLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const Card = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: CARD_RADIUS,
          borderWidth: 1,
          borderColor: `${colors.border}80`,
          padding: CARD_PAD,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const ThinBar = ({
  progress,
  color,
}: {
  progress: number;
  color: string;
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        height: 4,
        backgroundColor: `${colors.border}80`,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: 4,
          borderRadius: 4,
          width: `${Math.max(0, Math.min(progress, 100))}%`,
          backgroundColor: color,
        }}
      />
    </View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const BudgetScreen: React.FC = () => {
  const { colors } = useTheme();
  const CARD_BORDER = `${colors.border}80`;
  const navigation = useNavigation<any>();
  const { state, deleteBudget } = useAppContext();
  const [filter, setFilter] = useState<"all" | "over" | "warning" | "safe">("all");
  const [fabScaleAnim] = useState(new Animated.Value(1));

  const fabPressIn  = () =>
    Animated.spring(fabScaleAnim, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start();
  const fabPressOut = () =>
    Animated.spring(fabScaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  // ── Tanggal hari ini untuk deteksi status selesai ─────────────────────────
  const today = formatToDateKey(new Date());

  const parseDate = (dateStr: string): Date => {
    try { return new Date(dateStr); }
    catch { return new Date(); }
  };

  // Anggaran sekali pakai yang sudah melewati batas akhir diarsipkan ke completed
  const isBudgetCompleted = (b: Budget): boolean => {
    return b.isRecurring === false && today > b.endDate;
  };

  const activeBudgets = useMemo(() => {
    return state.budgets.filter((b) => !isBudgetCompleted(b));
  }, [state.budgets, today]);

  const completedBudgets = useMemo(() => {
    return state.budgets.filter(isBudgetCompleted);
  }, [state.budgets, today]);

  const summary = useMemo(() => {
    const totalLimit = activeBudgets.reduce((sum, b) => sum + safeNumber(b.limit), 0);
    const totalSpent = activeBudgets.reduce((sum, b) => sum + safeNumber(b.spent), 0);
    const overBudgets = activeBudgets.filter((b) => {
      const s = safeNumber(b.spent);
      const l = safeNumber(b.limit);
      return l > 0 && s > l;
    }).length;
    const warningBudgets = activeBudgets.filter((b) => {
      const s = safeNumber(b.spent);
      const l = safeNumber(b.limit);
      if (l <= 0) return false;
      const p = (s / l) * 100;
      return p >= 80 && p <= 100;
    }).length;
    return {
      totalLimit:      safeNumber(totalLimit),
      totalSpent:      safeNumber(totalSpent),
      totalRemaining:  safeNumber(totalLimit - totalSpent),
      overBudgets,
      warningBudgets,
      safeBudgets:     activeBudgets.length - overBudgets - warningBudgets,
    };
  }, [activeBudgets]);

  const filteredBudgets = useMemo(() => {
    return activeBudgets.filter((b) => {
      const s = safeNumber(b.spent);
      const l = safeNumber(b.limit);
      if (l <= 0) return filter === "all";
      const p = (s / l) * 100;
      switch (filter) {
        case "over":    return s > l;
        case "warning": return p >= 80 && p <= 100;
        case "safe":    return p < 80;
        default:        return true;
      }
    });
  }, [activeBudgets, filter]);

  const getProgress = (b: Budget): number => {
    const s = safeNumber(b.spent);
    const l = safeNumber(b.limit);
    if (l <= 0) return 0;
    const p = (s / l) * 100;
    return isNaN(p) ? 0 : p;
  };

  const getStatusColor = (b: Budget) => {
    const p = getProgress(b);
    if (p > 100) return colors.error;
    if (p >= 80)  return colors.warning;
    return colors.success;
  };

  const getDaysRemaining = (b: Budget): number => {
    const now  = new Date();
    const end  = parseDate(b.endDate);
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getDailyRemaining = (b: Budget): number => {
    const days      = getDaysRemaining(b);
    const remaining = safeNumber(b.limit) - safeNumber(b.spent);
    if (days <= 0 || remaining <= 0) return 0;
    return safeNumber(remaining / days);
  };

  const formatPeriod = (b: Budget): string => {
    if (b.isRecurring === false) {
      return "Sekali Pakai";
    }
    if (b.period === "custom" && b.cycleDays) {
      return `Tiap ${b.cycleDays} Hari`;
    }
    const map: Record<string, string> = {
      monthly: "Bulanan",
      weekly:  "Mingguan",
      yearly:  "Tahunan",
      custom:  "Custom",
    };
    return map[b.period] || "Bulanan";
  };

  const formatDateRange = (b: Budget): string => {
    try {
      const s   = parseDate(b.startDate);
      const e   = parseDate(b.endDate);
      const fmt = (d: Date) =>
        d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      return `${fmt(s)} – ${fmt(e)}`;
    } catch { return "Periode aktif"; }
  };

  const handleDelete = (b: Budget) => {
    Alert.alert(
      "Hapus Anggaran",
      `Hapus anggaran "${b.category}"?\n\nTransaksi terkait tetap tersimpan.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try { await deleteBudget(b.id); }
            catch { Alert.alert("Error", "Gagal menghapus anggaran"); }
          },
        },
      ]
    );
  };

  const filterTabs = [
    { key: "all",     label: "Semua",     count: activeBudgets.length },
    { key: "safe",    label: "Aman",      count: summary.safeBudgets },
    { key: "warning", label: "Perhatian", count: summary.warningBudgets },
    { key: "over",    label: "Melebihi",  count: summary.overBudgets },
  ];

  // ── Progress ring arc helper (SVG-like via border) ────────────────────────
  const utilizationRate =
    summary.totalLimit > 0
      ? (summary.totalSpent / summary.totalLimit) * 100
      : 0;

  const utilizationColor =
    utilizationRate > 100
      ? colors.error
      : utilizationRate >= 80
      ? colors.warning
      : colors.success;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page header ─────────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingTop: 16,
            paddingBottom: 20,
          }}
        >
          <View>
            <Text
              style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "700" }}
            >
              Anggaran
            </Text>
            <Text
              style={{ color: colors.gray400, fontSize: 11, marginTop: 3 }}
            >
              {activeBudgets.length} anggaran aktif{completedBudgets.length > 0 ? ` • ${completedBudgets.length} selesai` : ""}
            </Text>
          </View>
        </View>

        {/* ── Summary hero card ────────────────────────────────────────── */}
        {activeBudgets.length > 0 && (
          <View
            style={{
              borderRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: CARD_BORDER,
              overflow: "hidden",
              marginBottom: 16,
              backgroundColor: colors.surface,
            }}
          >
            <LinearGradient
              colors={[colors.accent + "18", colors.surface, colors.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                padding: CARD_PAD,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Decorative watermark ring */}
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  right: -16,
                  top: -16,
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  borderWidth: 1,
                  borderColor: colors.accent + "20",
                }}
              />

              {/* Total limit + bar */}
              <Text
                style={{
                  color: colors.gray400,
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: 1.1,
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                Total Anggaran
              </Text>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 22,
                  fontWeight: "800",
                  letterSpacing: -0.4,
                  marginBottom: 12,
                }}
              >
                {formatCurrency(summary.totalLimit)}
              </Text>

              {/* Limit / Spent / Remaining row */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
                    <View
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 2.5,
                        backgroundColor: colors.accent,
                        marginRight: 5,
                      }}
                    />
                    <Text style={{ color: colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8 }}>
                      Terpakai
                    </Text>
                  </View>
                  <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "700" }}>
                    {formatCurrency(summary.totalSpent)}
                  </Text>
                </View>

                <View style={{ width: 1, height: 26, backgroundColor: CARD_BORDER, marginHorizontal: 12 }} />

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
                    <View
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 2.5,
                        backgroundColor: summary.totalRemaining >= 0 ? colors.success : colors.error,
                        marginRight: 5,
                      }}
                    />
                    <Text style={{ color: colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8 }}>
                      Sisa
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: summary.totalRemaining >= 0 ? colors.success : colors.error,
                    }}
                  >
                    {formatCurrency(summary.totalRemaining)}
                  </Text>
                </View>
              </View>

              {/* Overall utilization bar */}
              <ThinBar progress={utilizationRate} color={utilizationColor} />
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 5 }}>
                <Text style={{ color: colors.gray400, fontSize: 9 }}>
                  {utilizationRate.toFixed(1)}% terpakai
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "600",
                    color: utilizationColor,
                  }}
                >
                  {utilizationRate > 100
                    ? "Melebihi batas!"
                    : utilizationRate >= 80
                    ? "Perlu perhatian"
                    : "Dalam batas aman"}
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* ── Filter — segmented control ───────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.surface,
            borderRadius: 13,
            padding: 3,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: CARD_BORDER,
          }}
        >
          {filterTabs.map((tab) => {
            const isActive    = filter === tab.key;
            const tabColor    =
              tab.key === "over"    ? colors.error   :
              tab.key === "warning" ? colors.warning :
              tab.key === "safe"    ? colors.success : colors.accent;
            return (
              <TouchableOpacity
                key={tab.key}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isActive ? `${tabColor}20` : "transparent",
                  gap: 6,
                }}
                onPress={() => setFilter(tab.key as any)}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: isActive ? "700" : "500",
                    color: isActive ? tabColor : colors.gray400,
                  }}
                >
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View
                    style={{
                      backgroundColor: isActive ? tabColor : `${colors.border}70`,
                      paddingHorizontal: 5,
                      paddingVertical: 2,
                      borderRadius: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 9,
                        color: isActive ? colors.background : colors.gray400,
                        fontWeight: "700",
                      }}
                    >
                      {tab.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Budget cards / empty state ───────────────────────────────── */}
        {filteredBudgets.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              paddingVertical: 48,
              backgroundColor: colors.surface,
              borderRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: CARD_BORDER,
              paddingHorizontal: 24,
            }}
          >
            <View
              style={{
                width: 64, height: 64, borderRadius: 20,
                alignItems: "center", justifyContent: "center",
                backgroundColor: `${colors.gray400}14`,
                marginBottom: 14,
              }}
            >
              <Ionicons name="pie-chart-outline" size={26} color={colors.gray400} />
            </View>
            <Text
              style={{
                color: colors.textPrimary, fontSize: 15, fontWeight: "700",
                marginBottom: 6, textAlign: "center",
              }}
            >
              {filter === "all" ? "Belum ada anggaran" : "Tidak ada anggaran"}
            </Text>
            <Text
              style={{
                color: colors.gray400, fontSize: 12,
                textAlign: "center", lineHeight: 18, marginBottom: 20,
              }}
            >
              {filter === "all"
                ? "Mulai dengan membuat anggaran pertama Anda"
                : `Tidak ada anggaran dengan status "${filterTabs.find(t => t.key === filter)?.label}"`}
            </Text>
            {filter === "all" && (
              <TouchableOpacity
                style={{
                  flexDirection: "row", alignItems: "center",
                  paddingHorizontal: 20, paddingVertical: 10,
                  borderRadius: 13, backgroundColor: colors.accent,
                  shadowColor: colors.accent,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
                }}
                onPress={() => navigation.navigate("AddBudget")}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color={colors.background} style={{ marginRight: 6 }} />
                <Text style={{ color: colors.background, fontSize: 13, fontWeight: "700" }}>
                  Buat Anggaran Pertama
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View>
            {filteredBudgets.map((budget, idx) => {
              const progress    = getProgress(budget);
              const remaining   = safeNumber(budget.limit) - safeNumber(budget.spent);
              const statusColor = getStatusColor(budget);
              const daysLeft    = getDaysRemaining(budget);
              const dailyLeft   = getDailyRemaining(budget);

              return (
                <View
                  key={budget.id}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: CARD_RADIUS,
                    borderWidth: 1,
                    borderColor: CARD_BORDER,
                    padding: CARD_PAD,
                    marginBottom: 12,
                    // Subtle left accent stripe per status
                    borderLeftWidth: 3,
                    borderLeftColor: statusColor,
                  }}
                >
                  {/* Row 1: Category + Status badge + Actions */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 8 }}>
                      {/* Category icon */}
                      <View
                        style={{
                          width: 32, height: 32, borderRadius: 10,
                          alignItems: "center", justifyContent: "center",
                          backgroundColor: `${statusColor}18`,
                        }}
                      >
                        <Ionicons name="pie-chart-outline" size={15} color={statusColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: colors.textPrimary, fontSize: 14,
                            fontWeight: "700", marginBottom: 2,
                          }}
                        >
                          {budget.category}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          {/* Period badge */}
                          <View
                            style={{
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                              borderRadius: 20,
                              backgroundColor: budget.isRecurring === false ? `${colors.info}18` : `${colors.accent}15`,
                              borderWidth: 1,
                              borderColor: budget.isRecurring === false ? `${colors.info}30` : `${colors.accent}25`,
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <Ionicons
                              name={budget.isRecurring === false ? "flag-outline" : "sync-outline"}
                              size={10}
                              color={budget.isRecurring === false ? colors.info : colors.accent}
                            />
                            <Text
                              style={{
                                color: budget.isRecurring === false ? colors.info : colors.accent,
                                fontSize: 9,
                                fontWeight: "600",
                              }}
                            >
                              {formatPeriod(budget)}
                            </Text>
                          </View>
                          <Text style={{ color: colors.gray400, fontSize: 10 }}>
                            {formatDateRange(budget)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Action buttons */}
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <TouchableOpacity
                        style={{
                          width: 30, height: 30, borderRadius: 8,
                          alignItems: "center", justifyContent: "center",
                          backgroundColor: `${colors.accent}15`,
                          borderWidth: 1, borderColor: `${colors.accent}20`,
                        }}
                        onPress={() =>
                          navigation.navigate("AddBudget", {
                            editMode: true,
                            budgetData: budget,
                          })
                        }
                        activeOpacity={0.7}
                      >
                        <Ionicons name="pencil-outline" size={13} color={colors.accent} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          width: 30, height: 30, borderRadius: 8,
                          alignItems: "center", justifyContent: "center",
                          backgroundColor: `${colors.error}15`,
                          borderWidth: 1, borderColor: `${colors.error}20`,
                        }}
                        onPress={() => handleDelete(budget)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={13} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Row 2: Progress bar + percentage */}
                  <View style={{ marginBottom: 12 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 7,
                      }}
                    >
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                        {formatCurrency(safeNumber(budget.spent))}
                        <Text style={{ color: colors.gray400 }}>
                          {" "}/ {formatCurrency(safeNumber(budget.limit))}
                        </Text>
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        {daysLeft > 0 && (
                          <View
                            style={{
                              paddingHorizontal: 8, paddingVertical: 2,
                              borderRadius: 20, backgroundColor: `${colors.info}15`,
                              borderWidth: 1, borderColor: `${colors.info}25`,
                            }}
                          >
                            <Text style={{ color: colors.info, fontSize: 9, fontWeight: "600" }}>
                              {daysLeft} hari lagi
                            </Text>
                          </View>
                        )}
                        <Text style={{ color: statusColor, fontSize: 13, fontWeight: "800" }}>
                          {progress.toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                    <ThinBar progress={progress} color={statusColor} />
                  </View>

                  {/* Row 3: Stats row */}
                  <View
                    style={{
                      height: 1, backgroundColor: CARD_BORDER, marginBottom: 12,
                    }}
                  />
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {/* Terpakai */}
                    <View style={{ flex: 1, alignItems: "center" }}>
                      <Text
                        style={{
                          color: colors.gray400, fontSize: 9,
                          textTransform: "uppercase", letterSpacing: 0.8,
                          marginBottom: 4,
                        }}
                      >
                        Terpakai
                      </Text>
                      <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "700" }}>
                        {formatCurrency(safeNumber(budget.spent))}
                      </Text>
                    </View>

                    <View style={{ width: 1, height: 28, backgroundColor: CARD_BORDER }} />

                    {/* Sisa */}
                    <View style={{ flex: 1, alignItems: "center" }}>
                      <Text
                        style={{
                          color: colors.gray400, fontSize: 9,
                          textTransform: "uppercase", letterSpacing: 0.8,
                          marginBottom: 4,
                        }}
                      >
                        Sisa
                      </Text>
                      <Text
                        style={{
                          fontSize: 13, fontWeight: "700",
                          color: remaining >= 0 ? colors.success : colors.error,
                        }}
                      >
                        {formatCurrency(remaining)}
                      </Text>
                    </View>

                    <View style={{ width: 1, height: 28, backgroundColor: CARD_BORDER }} />

                    {/* Target/Hari atau Status */}
                    <View style={{ flex: 1, alignItems: "center" }}>
                      <Text
                        style={{
                          color: colors.gray400, fontSize: 9,
                          textTransform: "uppercase", letterSpacing: 0.8,
                          marginBottom: 4,
                        }}
                      >
                        {daysLeft > 0 ? "Per Hari" : "Status"}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13, fontWeight: "700",
                          color:
                            daysLeft > 0
                              ? dailyLeft > 0 ? colors.success : colors.error
                              : colors.warning,
                        }}
                      >
                        {daysLeft > 0
                          ? formatCurrency(dailyLeft)
                          : "Berakhir"}
                      </Text>
                    </View>
                  </View>

                  {/* Overspend warning */}
                  {progress > 100 && (
                    <>
                      <View
                        style={{ height: 1, backgroundColor: CARD_BORDER, marginTop: 12, marginBottom: 10 }}
                      />
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 10,
                          borderRadius: INNER_RADIUS,
                          backgroundColor: `${colors.error}0C`,
                          borderWidth: 1,
                          borderColor: `${colors.error}20`,
                        }}
                      >
                        <Ionicons
                          name="warning-outline"
                          size={14}
                          color={colors.error}
                          style={{ marginRight: 8, flexShrink: 0 }}
                        />
                        <Text style={{ color: colors.error, fontSize: 11, fontWeight: "600", flex: 1 }}>
                          Anggaran melebihi {formatCurrency(Math.abs(remaining))}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* ── Riwayat Anggaran Selesai ───────────────────────────────── */}
        {completedBudgets.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <SectionHeader
              title={`Riwayat Anggaran Selesai (${completedBudgets.length})`}
            />
            <Text style={{ color: colors.gray400, fontSize: 11, marginBottom: 12, marginTop: -6 }}>
              Anggaran sekali pakai yang telah selesai. Data tersimpan rapi sebagai arsip evaluasi Anda.
            </Text>

            {completedBudgets.map((b) => {
              const spent = safeNumber(b.spent);
              const limit = safeNumber(b.limit);
              const diff = limit - spent;
              const isSaved = diff >= 0;
              const progress = limit > 0 ? (spent / limit) * 100 : 0;
              const statusColor = isSaved ? colors.success : colors.error;

              return (
                <View
                  key={b.id}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: CARD_RADIUS,
                    borderWidth: 1,
                    borderColor: CARD_BORDER,
                    padding: 16,
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 10,
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "700" }}>
                          {b.category}
                        </Text>
                        <View
                          style={{
                            paddingHorizontal: 6,
                            paddingVertical: 1.5,
                            borderRadius: 10,
                            backgroundColor: `${colors.gray400}20`,
                          }}
                        >
                          <Text style={{ color: colors.gray400, fontSize: 9, fontWeight: "700" }}>
                            SELESAI
                          </Text>
                        </View>
                      </View>
                      <Text style={{ color: colors.gray400, fontSize: 11 }}>
                        {formatDateRange(b)}
                      </Text>
                    </View>

                    {/* Result badge */}
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 12,
                        backgroundColor: `${statusColor}15`,
                        borderWidth: 1,
                        borderColor: `${statusColor}30`,
                        marginRight: 6,
                      }}
                    >
                      <Text style={{ color: statusColor, fontSize: 10, fontWeight: "700" }}>
                        {isSaved ? `Hemat ${formatCurrency(diff)}` : `Over ${formatCurrency(Math.abs(diff))}`}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDelete(b)}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: `${colors.error}12`,
                      }}
                    >
                      <Ionicons name="trash-outline" size={14} color={colors.error} />
                    </TouchableOpacity>
                  </View>

                  {/* Progress Bar */}
                  <View style={{ marginVertical: 6 }}>
                    <ThinBar progress={progress} color={statusColor} />
                  </View>

                  {/* Limit vs Spent info */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                    <Text style={{ color: colors.gray400, fontSize: 11 }}>
                      Limit: <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>{formatCurrency(limit)}</Text>
                    </Text>
                    <Text style={{ color: colors.gray400, fontSize: 11 }}>
                      Terpakai: <Text style={{ color: statusColor, fontWeight: "700" }}>{formatCurrency(spent)}</Text> ({progress.toFixed(0)}%)
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 24,
          right: 20,
          width: 54,
          height: 54,
          borderRadius: 17,
          backgroundColor: colors.accent,
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.45,
          shadowRadius: 14,
          elevation: 12,
          transform: [{ scale: fabScaleAnim }],
        }}
      >
        <TouchableOpacity
          style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}
          onPress={() => navigation.navigate("AddBudget")}
          activeOpacity={0.8}
          onPressIn={fabPressIn}
          onPressOut={fabPressOut}
          accessibilityLabel="Tambah anggaran baru"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={28} color={colors.background} />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

export default BudgetScreen;