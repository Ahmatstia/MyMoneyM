// File: src/screens/BudgetScreen.tsx — REDESIGNED with Design System
import React, { useState, useMemo } from "react";
import { View, ScrollView, Alert, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { formatCurrency, safeNumber } from "../../utils/calculations";
import { Budget } from "../../types";
import { Colors } from "../../theme/theme";
import {
  DS,
  pageContainer,
  headerBar,
  headerTitle,
  headerSubtitle,
  headerFAB,
  card,
  cardPadded,
  scrollContent,
  filterPill,
  filterPillActive,
  filterPillText,
  filterPillTextActive,
  statColumn,
  statLabel,
  statValue,
  statDivider,
  iconButton,
  badge,
  badgeText,
  progressTrack,
  progressFill,
  emptyState,
  emptyTitle,
  emptySubtitle,
  primaryButton,
  primaryButtonText,
  sectionTitle,
  cardSeparator,
} from "../../theme/designSystem";

const BudgetScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state, deleteBudget } = useAppContext();
  const [filter, setFilter] = useState<"all" | "over" | "warning" | "safe">(
    "all"
  );

  const parseDate = (dateStr: string): Date => {
    try {
      return new Date(dateStr);
    } catch {
      return new Date();
    }
  };

  // Calculate summary
  const summary = useMemo(() => {
    const totalLimit = state.budgets.reduce(
      (sum, b) => sum + safeNumber(b.limit),
      0
    );
    const totalSpent = state.budgets.reduce(
      (sum, b) => sum + safeNumber(b.spent),
      0
    );
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
      totalLimit: safeNumber(totalLimit),
      totalSpent: safeNumber(totalSpent),
      totalRemaining: safeNumber(totalLimit - totalSpent),
      overBudgets,
      warningBudgets,
      safeBudgets: state.budgets.length - overBudgets - warningBudgets,
    };
  }, [state.budgets]);

  const filteredBudgets = useMemo(() => {
    return state.budgets.filter((b) => {
      const s = safeNumber(b.spent);
      const l = safeNumber(b.limit);
      if (l <= 0) return filter === "all";
      const p = (s / l) * 100;
      switch (filter) {
        case "over": return s > l;
        case "warning": return p >= 80 && p <= 100;
        case "safe": return p < 80;
        default: return true;
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
    if (p > 100) return DS.error;
    if (p >= 80) return DS.warning;
    return DS.success;
  };

  const getStatusText = (b: Budget) => {
    const p = getProgress(b);
    if (p > 100) return "Melebihi";
    if (p >= 80) return "Perhatian";
    return "Aman";
  };

  const getDaysRemaining = (b: Budget): number => {
    const now = new Date();
    const end = parseDate(b.endDate);
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getDaysPassed = (b: Budget): number => {
    const now = new Date();
    const start = parseDate(b.startDate);
    const diff = now.getTime() - start.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  const getDailyRemaining = (b: Budget): number => {
    const days = getDaysRemaining(b);
    const remaining = safeNumber(b.limit) - safeNumber(b.spent);
    if (days <= 0 || remaining <= 0) return 0;
    return safeNumber(remaining / days);
  };

  const formatPeriod = (b: Budget): string => {
    const map: Record<string, string> = {
      monthly: "Bulanan",
      weekly: "Mingguan",
      yearly: "Tahunan",
      custom: "Custom",
    };
    return map[b.period] || "Bulanan";
  };

  const formatDateRange = (b: Budget): string => {
    try {
      const s = parseDate(b.startDate);
      const e = parseDate(b.endDate);
      const fmt = (d: Date) =>
        d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      return `${fmt(s)} - ${fmt(e)}`;
    } catch {
      return "Periode aktif";
    }
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
            try {
              await deleteBudget(b.id);
            } catch {
              Alert.alert("Error", "Gagal menghapus anggaran");
            }
          },
        },
      ]
    );
  };

  const filterTabs = [
    { key: "all", label: "Semua", count: state.budgets.length },
    { key: "safe", label: "Aman", count: summary.safeBudgets },
    { key: "warning", label: "Perhatian", count: summary.warningBudgets },
    { key: "over", label: "Melebihi", count: summary.overBudgets },
  ];

  return (
    <View style={pageContainer}>
      {/* ====== COMPACT HEADER ====== */}
      <View style={[headerBar, tw`flex-row justify-between items-center`]}>
        <View>
          <Text style={headerTitle}>Anggaran</Text>
          <Text style={headerSubtitle}>
            {state.budgets.length} anggaran aktif
          </Text>
        </View>
        <TouchableOpacity
          style={headerFAB}
          onPress={() => navigation.navigate("AddBudget")}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* ====== SCROLLABLE CONTENT ====== */}
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Stats — now inside scroll */}
        <View style={[cardPadded, tw`mb-4`]}>
          <View style={tw`flex-row justify-between items-center`}>
            <View style={statColumn}>
              <Text style={statLabel}>Total Limit</Text>
              <Text style={statValue}>
                {formatCurrency(summary.totalLimit)}
              </Text>
            </View>
            <View style={statDivider} />
            <View style={statColumn}>
              <Text style={statLabel}>Terpakai</Text>
              <Text style={statValue}>
                {formatCurrency(summary.totalSpent)}
              </Text>
            </View>
            <View style={statDivider} />
            <View style={statColumn}>
              <Text style={statLabel}>Sisa</Text>
              <Text
                style={[
                  statValue,
                  {
                    color:
                      summary.totalRemaining >= 0 ? DS.success : DS.error,
                  },
                ]}
              >
                {formatCurrency(summary.totalRemaining)}
              </Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs — inside scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={tw`mb-4`}
          contentContainerStyle={tw`flex-row gap-2`}
        >
          {filterTabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={filter === tab.key ? filterPillActive : filterPill}
              onPress={() => setFilter(tab.key as any)}
            >
              <Text
                style={
                  filter === tab.key ? filterPillTextActive : filterPillText
                }
              >
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Budget Cards */}
        {filteredBudgets.length === 0 ? (
          <View style={emptyState}>
            <Ionicons
              name="pie-chart-outline"
              size={48}
              color={DS.textMuted}
            />
            <Text style={emptyTitle}>
              {filter === "all"
                ? "Belum ada anggaran"
                : "Tidak ada anggaran"}
            </Text>
            <Text style={emptySubtitle}>
              {filter === "all"
                ? "Mulai dengan membuat anggaran pertama Anda"
                : `Tidak ada anggaran dengan status "${filter}"`}
            </Text>
            {filter === "all" && (
              <TouchableOpacity
                style={primaryButton}
                onPress={() => navigation.navigate("AddBudget")}
              >
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text style={primaryButtonText}>Buat Anggaran Pertama</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredBudgets.map((budget) => {
            const progress = getProgress(budget);
            const remaining = safeNumber(budget.limit - budget.spent);
            const statusColor = getStatusColor(budget);
            const daysLeft = getDaysRemaining(budget);
            const dailyLeft = getDailyRemaining(budget);

            return (
              <View key={budget.id} style={[cardPadded, tw`mb-3`]}>
                {/* Row 1: Category + Status + Actions */}
                <View
                  style={tw`flex-row justify-between items-center mb-3`}
                >
                  <View style={tw`flex-row items-center gap-2 flex-1`}>
                    <Text
                      style={[
                        tw`text-base font-semibold`,
                        { color: DS.text },
                      ]}
                    >
                      {budget.category}
                    </Text>
                    <View style={badge(statusColor)}>
                      <Text style={badgeText(statusColor)}>
                        {getStatusText(budget)}
                      </Text>
                    </View>
                  </View>
                  <View style={tw`flex-row gap-2`}>
                    <TouchableOpacity
                      style={iconButton}
                      onPress={() =>
                        navigation.navigate("AddBudget", {
                          editMode: true,
                          budgetData: budget,
                        })
                      }
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={16}
                        color={DS.accent}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={iconButton}
                      onPress={() => handleDelete(budget)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={DS.error}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Row 2: Period + Days + Percentage */}
                <View
                  style={tw`flex-row justify-between items-center mb-3`}
                >
                  <View style={tw`flex-row items-center gap-2`}>
                    <View style={badge(DS.accent)}>
                      <Text style={badgeText(DS.accent)}>
                        {formatPeriod(budget)}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: DS.textSub }}>
                      {formatDateRange(budget)}
                    </Text>
                  </View>
                  {daysLeft > 0 && (
                    <View style={badge(DS.info)}>
                      <Text style={badgeText(DS.info)}>
                        {daysLeft} hari lagi
                      </Text>
                    </View>
                  )}
                </View>

                {/* Row 3: Progress Bar */}
                <View style={tw`mb-3`}>
                  <View
                    style={tw`flex-row justify-between items-center mb-1`}
                  >
                    <Text style={{ fontSize: 12, color: DS.textSub }}>
                      {formatCurrency(safeNumber(budget.spent))} /{" "}
                      {formatCurrency(safeNumber(budget.limit))}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: statusColor,
                      }}
                    >
                      {progress.toFixed(0)}%
                    </Text>
                  </View>
                  <View style={progressTrack}>
                    <View
                      style={progressFill(
                        statusColor,
                        Math.min(progress, 100)
                      )}
                    />
                  </View>
                </View>

                {/* Row 4: Compact stats row */}
                <View style={cardSeparator} />
                <View style={tw`flex-row`}>
                  <View style={tw`flex-1 items-center`}>
                    <Text style={statLabel}>Terpakai</Text>
                    <Text style={[statValue, { fontSize: 13 }]}>
                      {formatCurrency(safeNumber(budget.spent))}
                    </Text>
                  </View>
                  <View style={statDivider} />
                  <View style={tw`flex-1 items-center`}>
                    <Text style={statLabel}>Sisa</Text>
                    <Text
                      style={[
                        statValue,
                        {
                          fontSize: 13,
                          color: remaining >= 0 ? DS.success : DS.error,
                        },
                      ]}
                    >
                      {formatCurrency(remaining)}
                    </Text>
                  </View>
                  <View style={statDivider} />
                  <View style={tw`flex-1 items-center`}>
                    <Text style={statLabel}>
                      {daysLeft > 0 ? "Target/Hari" : "Status"}
                    </Text>
                    <Text
                      style={[
                        statValue,
                        {
                          fontSize: 13,
                          color:
                            daysLeft > 0
                              ? dailyLeft > 0
                                ? DS.success
                                : DS.error
                              : DS.warning,
                        },
                      ]}
                    >
                      {daysLeft > 0
                        ? formatCurrency(dailyLeft)
                        : "Berakhir"}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

export default BudgetScreen;
