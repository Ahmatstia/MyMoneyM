// File: src/screens/BudgetScreen.tsx
import React, { useState, useMemo } from "react";
import { View, ScrollView, Alert, TouchableOpacity, Animated } from "react-native";
import { Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { formatCurrency, safeNumber } from "../../utils/calculations";
import { Budget } from "../../types";
import { Colors } from "../../theme/theme";

// ─── Theme colors (tidak diubah) ──────────────────────────────────────────────
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR    = Colors.surface;
const TEXT_PRIMARY     = Colors.textPrimary;
const TEXT_SECONDARY   = Colors.textSecondary;
const ACCENT_COLOR     = Colors.accent;
const SUCCESS_COLOR    = Colors.success;
const WARNING_COLOR    = Colors.warning;
const ERROR_COLOR      = Colors.error;

// ─── Design tokens (konsisten dengan seluruh app) ─────────────────────────────
const CARD_RADIUS  = 20;
const INNER_RADIUS = 14;
const CARD_PAD     = 20;
const SECTION_GAP  = 24;
const CARD_BORDER  = "rgba(255,255,255,0.06)";

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
}) => (
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
          backgroundColor: ACCENT_COLOR,
          borderRadius: 2,
          marginRight: 8,
        }}
      />
      <Text
        style={{
          color: Colors.gray400,
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
        <Text style={{ color: ACCENT_COLOR, fontSize: 11, fontWeight: "600" }}>
          {linkLabel}
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

const Card = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) => (
  <View
    style={[
      {
        backgroundColor: SURFACE_COLOR,
        borderRadius: CARD_RADIUS,
        borderWidth: 1,
        borderColor: CARD_BORDER,
        padding: CARD_PAD,
      },
      style,
    ]}
  >
    {children}
  </View>
);

const ThinBar = ({
  progress,
  color,
}: {
  progress: number;
  color: string;
}) => (
  <View
    style={{
      height: 4,
      backgroundColor: "rgba(255,255,255,0.07)",
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

// ─── Main component ───────────────────────────────────────────────────────────

const BudgetScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state, deleteBudget } = useAppContext();
  const [filter, setFilter] = useState<"all" | "over" | "warning" | "safe">("all");
  const [fabScaleAnim] = useState(new Animated.Value(1));

  const fabPressIn  = () =>
    Animated.spring(fabScaleAnim, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start();
  const fabPressOut = () =>
    Animated.spring(fabScaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  // ── Semua logika kalkulasi di bawah ini TIDAK DIUBAH ─────────────────────

  const parseDate = (dateStr: string): Date => {
    try { return new Date(dateStr); }
    catch { return new Date(); }
  };

  const summary = useMemo(() => {
    const totalLimit = state.budgets.reduce((sum, b) => sum + safeNumber(b.limit), 0);
    const totalSpent = state.budgets.reduce((sum, b) => sum + safeNumber(b.spent), 0);
    const overBudgets = state.budgets.filter((b) => {
      const s = safeNumber(b.spent);
      const l = safeNumber(b.limit);
      return l > 0 && s > l;
    }).length;
    const warningBudgets = state.budgets.filter((b) => {
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
      safeBudgets:     state.budgets.length - overBudgets - warningBudgets,
    };
  }, [state.budgets]);

  const filteredBudgets = useMemo(() => {
    return state.budgets.filter((b) => {
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
  }, [state.budgets, filter]);

  const getProgress = (b: Budget): number => {
    const s = safeNumber(b.spent);
    const l = safeNumber(b.limit);
    if (l <= 0) return 0;
    const p = (s / l) * 100;
    return isNaN(p) ? 0 : p;
  };

  const getStatusColor = (b: Budget) => {
    const p = getProgress(b);
    if (p > 100) return ERROR_COLOR;
    if (p >= 80)  return WARNING_COLOR;
    return SUCCESS_COLOR;
  };

  const getStatusLabel = (b: Budget) => {
    const p = getProgress(b);
    if (p > 100) return "Melebihi";
    if (p >= 80)  return "Perhatian";
    return "Aman";
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
    { key: "all",     label: "Semua",     count: state.budgets.length },
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
      ? ERROR_COLOR
      : utilizationRate >= 80
      ? WARNING_COLOR
      : SUCCESS_COLOR;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <View style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
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
              style={{ color: TEXT_PRIMARY, fontSize: 20, fontWeight: "700" }}
            >
              Anggaran
            </Text>
            <Text
              style={{ color: Colors.gray400, fontSize: 11, marginTop: 3 }}
            >
              {state.budgets.length} anggaran aktif
            </Text>
          </View>
        </View>

        {/* ── Summary hero card ────────────────────────────────────────── */}
        {state.budgets.length > 0 && (
          <Card style={{ marginBottom: 20 }}>
            {/* Total limit + bar */}
            <Text
              style={{
                color: Colors.gray400,
                fontSize: 10,
                fontWeight: "700",
                letterSpacing: 1.2,
                textTransform: "uppercase",
                marginBottom: 5,
              }}
            >
              Total Anggaran
            </Text>
            <Text
              style={{
                color: TEXT_PRIMARY,
                fontSize: 30,
                fontWeight: "800",
                letterSpacing: -0.5,
                marginBottom: 16,
              }}
            >
              {formatCurrency(summary.totalLimit)}
            </Text>

            {/* Limit / Spent / Remaining row */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                  <View
                    style={{
                      width: 6, height: 6, borderRadius: 3,
                      backgroundColor: ACCENT_COLOR, marginRight: 5,
                    }}
                  />
                  <Text style={{ color: Colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8 }}>
                    Terpakai
                  </Text>
                </View>
                <Text style={{ color: ACCENT_COLOR, fontSize: 14, fontWeight: "700" }}>
                  {formatCurrency(summary.totalSpent)}
                </Text>
              </View>

              <View style={{ width: 1, height: 32, backgroundColor: CARD_BORDER, marginHorizontal: 14 }} />

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                  <View
                    style={{
                      width: 6, height: 6, borderRadius: 3,
                      backgroundColor: summary.totalRemaining >= 0 ? SUCCESS_COLOR : ERROR_COLOR,
                      marginRight: 5,
                    }}
                  />
                  <Text style={{ color: Colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8 }}>
                    Sisa
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 14, fontWeight: "700",
                    color: summary.totalRemaining >= 0 ? SUCCESS_COLOR : ERROR_COLOR,
                  }}
                >
                  {formatCurrency(summary.totalRemaining)}
                </Text>
              </View>

              <View style={{ width: 1, height: 32, backgroundColor: CARD_BORDER, marginHorizontal: 14 }} />

              {/* Status chips */}
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: Colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>
                  Status
                </Text>
                <View style={{ flexDirection: "row", gap: 4 }}>
                  {summary.overBudgets > 0 && (
                    <View
                      style={{
                        paddingHorizontal: 7, paddingVertical: 2,
                        borderRadius: 20, backgroundColor: `${ERROR_COLOR}18`,
                        borderWidth: 1, borderColor: `${ERROR_COLOR}28`,
                      }}
                    >
                      <Text style={{ color: ERROR_COLOR, fontSize: 10, fontWeight: "700" }}>
                        {summary.overBudgets} ↑
                      </Text>
                    </View>
                  )}
                  {summary.safeBudgets > 0 && (
                    <View
                      style={{
                        paddingHorizontal: 7, paddingVertical: 2,
                        borderRadius: 20, backgroundColor: `${SUCCESS_COLOR}18`,
                        borderWidth: 1, borderColor: `${SUCCESS_COLOR}28`,
                      }}
                    >
                      <Text style={{ color: SUCCESS_COLOR, fontSize: 10, fontWeight: "700" }}>
                        {summary.safeBudgets} ✓
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Overall utilization bar */}
            <ThinBar progress={utilizationRate} color={utilizationColor} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
              <Text style={{ color: Colors.gray400, fontSize: 10 }}>
                {utilizationRate.toFixed(1)}% terpakai
              </Text>
              <Text
                style={{
                  fontSize: 10, fontWeight: "600",
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
          </Card>
        )}

        {/* ── Filter — segmented control ───────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: SURFACE_COLOR,
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
              tab.key === "over"    ? ERROR_COLOR   :
              tab.key === "warning" ? WARNING_COLOR :
              tab.key === "safe"    ? SUCCESS_COLOR : ACCENT_COLOR;
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
                    color: isActive ? tabColor : Colors.gray400,
                  }}
                >
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View
                    style={{
                      backgroundColor: isActive ? tabColor : "rgba(255,255,255,0.08)",
                      paddingHorizontal: 5,
                      paddingVertical: 2,
                      borderRadius: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 9,
                        color: isActive ? BACKGROUND_COLOR : Colors.gray400,
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
              backgroundColor: SURFACE_COLOR,
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
                backgroundColor: `${Colors.gray400}14`,
                marginBottom: 14,
              }}
            >
              <Ionicons name="pie-chart-outline" size={26} color={Colors.gray400} />
            </View>
            <Text
              style={{
                color: TEXT_PRIMARY, fontSize: 15, fontWeight: "700",
                marginBottom: 6, textAlign: "center",
              }}
            >
              {filter === "all" ? "Belum ada anggaran" : "Tidak ada anggaran"}
            </Text>
            <Text
              style={{
                color: Colors.gray400, fontSize: 12,
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
                  borderRadius: 13, backgroundColor: ACCENT_COLOR,
                  shadowColor: ACCENT_COLOR,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
                }}
                onPress={() => navigation.navigate("AddBudget")}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color={BACKGROUND_COLOR} style={{ marginRight: 6 }} />
                <Text style={{ color: BACKGROUND_COLOR, fontSize: 13, fontWeight: "700" }}>
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
                    backgroundColor: SURFACE_COLOR,
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
                          width: 38, height: 38, borderRadius: 12,
                          alignItems: "center", justifyContent: "center",
                          backgroundColor: `${statusColor}15`,
                        }}
                      >
                        <Ionicons name="pie-chart-outline" size={17} color={statusColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: TEXT_PRIMARY, fontSize: 14,
                            fontWeight: "700", marginBottom: 2,
                          }}
                        >
                          {budget.category}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          {/* Period badge */}
                          <View
                            style={{
                              paddingHorizontal: 7, paddingVertical: 2,
                              borderRadius: 20, backgroundColor: `${ACCENT_COLOR}15`,
                              borderWidth: 1, borderColor: `${ACCENT_COLOR}25`,
                            }}
                          >
                            <Text style={{ color: ACCENT_COLOR, fontSize: 9, fontWeight: "600" }}>
                              {formatPeriod(budget)}
                            </Text>
                          </View>
                          <Text style={{ color: Colors.gray400, fontSize: 10 }}>
                            {formatDateRange(budget)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Action buttons */}
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <TouchableOpacity
                        style={{
                          width: 34, height: 34, borderRadius: 10,
                          alignItems: "center", justifyContent: "center",
                          backgroundColor: `${ACCENT_COLOR}15`,
                          borderWidth: 1, borderColor: `${ACCENT_COLOR}20`,
                        }}
                        onPress={() =>
                          navigation.navigate("AddBudget", {
                            editMode: true,
                            budgetData: budget,
                          })
                        }
                        activeOpacity={0.7}
                      >
                        <Ionicons name="pencil-outline" size={15} color={ACCENT_COLOR} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          width: 34, height: 34, borderRadius: 10,
                          alignItems: "center", justifyContent: "center",
                          backgroundColor: `${ERROR_COLOR}15`,
                          borderWidth: 1, borderColor: `${ERROR_COLOR}20`,
                        }}
                        onPress={() => handleDelete(budget)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={15} color={ERROR_COLOR} />
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
                      <Text style={{ color: TEXT_SECONDARY, fontSize: 12 }}>
                        {formatCurrency(safeNumber(budget.spent))}
                        <Text style={{ color: Colors.gray400 }}>
                          {" "}/ {formatCurrency(safeNumber(budget.limit))}
                        </Text>
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        {daysLeft > 0 && (
                          <View
                            style={{
                              paddingHorizontal: 8, paddingVertical: 2,
                              borderRadius: 20, backgroundColor: `${Colors.info}15`,
                              borderWidth: 1, borderColor: `${Colors.info}25`,
                            }}
                          >
                            <Text style={{ color: Colors.info, fontSize: 9, fontWeight: "600" }}>
                              {daysLeft} hari lagi
                            </Text>
                          </View>
                        )}
                        <View
                          style={{
                            paddingHorizontal: 8, paddingVertical: 2,
                            borderRadius: 20, backgroundColor: `${statusColor}15`,
                            borderWidth: 1, borderColor: `${statusColor}25`,
                          }}
                        >
                          <Text style={{ color: statusColor, fontSize: 9, fontWeight: "700" }}>
                            {getStatusLabel(budget)}
                          </Text>
                        </View>
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
                          color: Colors.gray400, fontSize: 9,
                          textTransform: "uppercase", letterSpacing: 0.8,
                          marginBottom: 4,
                        }}
                      >
                        Terpakai
                      </Text>
                      <Text style={{ color: ACCENT_COLOR, fontSize: 13, fontWeight: "700" }}>
                        {formatCurrency(safeNumber(budget.spent))}
                      </Text>
                    </View>

                    <View style={{ width: 1, height: 28, backgroundColor: CARD_BORDER }} />

                    {/* Sisa */}
                    <View style={{ flex: 1, alignItems: "center" }}>
                      <Text
                        style={{
                          color: Colors.gray400, fontSize: 9,
                          textTransform: "uppercase", letterSpacing: 0.8,
                          marginBottom: 4,
                        }}
                      >
                        Sisa
                      </Text>
                      <Text
                        style={{
                          fontSize: 13, fontWeight: "700",
                          color: remaining >= 0 ? SUCCESS_COLOR : ERROR_COLOR,
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
                          color: Colors.gray400, fontSize: 9,
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
                              ? dailyLeft > 0 ? SUCCESS_COLOR : ERROR_COLOR
                              : WARNING_COLOR,
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
                          backgroundColor: `${ERROR_COLOR}0C`,
                          borderWidth: 1,
                          borderColor: `${ERROR_COLOR}20`,
                        }}
                      >
                        <Ionicons
                          name="warning-outline"
                          size={14}
                          color={ERROR_COLOR}
                          style={{ marginRight: 8, flexShrink: 0 }}
                        />
                        <Text style={{ color: ERROR_COLOR, fontSize: 11, fontWeight: "600", flex: 1 }}>
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
          backgroundColor: ACCENT_COLOR,
          shadowColor: ACCENT_COLOR,
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
          <Ionicons name="add" size={28} color={BACKGROUND_COLOR} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default BudgetScreen;