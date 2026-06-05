// File: src/screens/Analytics/AnalyticsScreen.tsx
import React, { useState, useMemo } from "react";
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, ScrollView, TouchableOpacity, Share, Alert } from "react-native";
import { Text, ProgressBar, Divider } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system/next";
import * as Sharing from "expo-sharing";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import {
  calculateTransactionAnalytics,
  calculateBudgetAnalytics,
  calculateSavingsAnalytics,
  generateFinancialInsights,
  calculateFinancialHealthScore,
} from "../../utils/analytics";
import {
  formatCurrency,
  getCurrentMonth,
  getSafePercentage,
  safeNumber,
  calculateProjection,
  calculateOpeningBalance,
  getActiveCycleInfo,
} from "../../utils/calculations";
import { useTheme } from '../../theme/ThemeContext';

type SafeIconName = keyof typeof Ionicons.glyphMap;

// â”€â”€â”€ Design tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CARD_RADIUS  = 20;
const INNER_RADIUS = 14;
const CARD_PAD     = 18;
const SECTION_GAP  = 20;

// â”€â”€â”€ UI Components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const Spacer = ({ size = SECTION_GAP }: { size?: number }) => (
  <View style={{ height: size }} />
);

const SectionHeader = ({
  title, linkLabel, onPress,
}: {
  title: string; linkLabel?: string; onPress?: () => void;
}) => {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <Text style={{ color: colors.gray400, fontSize: 10, fontWeight: "700", letterSpacing: 1.3, textTransform: "uppercase" }}>
        {title}
      </Text>
      {linkLabel && onPress && (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "600" }}>{linkLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const ThinBar = ({ progress, color }: { progress: number; color: string }) => {
  const { colors } = useTheme();
  return (
    <View style={{ height: 5, backgroundColor: `${colors.border}80`, borderRadius: 99, overflow: "hidden" }}>
      <View style={{ height: 5, borderRadius: 99, width: `${Math.max(0, Math.min(progress * 100, 100))}%`, backgroundColor: color }} />
    </View>
  );
};

const Card = ({ children, style }: { children: React.ReactNode; style?: object }) => {
  const { colors } = useTheme();
  return (
    <View style={[{ backgroundColor: colors.surface, borderRadius: CARD_RADIUS, borderWidth: 1, borderColor: `${colors.border}80`, padding: CARD_PAD }, style]}>
      {children}
    </View>
  );
};

const VDivider = ({ height = 36 }: { height?: number }) => {
  const { colors } = useTheme();
  return <View style={{ width: 1, height, backgroundColor: `${colors.border}80`, marginHorizontal: 14 }} />;
};

// â”€â”€â”€ Tab definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TABS = [
  { key: "health",     label: "Kesehatan", icon: "heart-outline"      as SafeIconName },
  { key: "summary",    label: "Ringkasan", icon: "stats-chart-outline" as SafeIconName },
  { key: "trends",     label: "Tren",      icon: "trending-up-outline" as SafeIconName },
  { key: "categories", label: "Kategori",  icon: "pricetags-outline"   as SafeIconName },
  { key: "insights",   label: "Tips",      icon: "bulb-outline"        as SafeIconName },
];

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const AnalyticsScreen: React.FC = () => {
  const { colors } = useTheme();
  const CARD_BORDER = `${colors.border}80`;
  const BACKGROUND_COLOR = colors.background;
  const SURFACE_COLOR    = colors.surface;
  const TEXT_PRIMARY     = colors.textPrimary;
  const TEXT_SECONDARY   = colors.textSecondary;
  const ACCENT_COLOR     = colors.accent;
  const SUCCESS_COLOR    = colors.success;
  const WARNING_COLOR    = colors.warning;
  const ERROR_COLOR      = colors.error;



  const navigation = useNavigation<any>();
  const { state } = useAppContext();

  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");

  const [activeTab, setActiveTab] = useState<
    "health" | "summary" | "trends" | "categories" | "insights"
  >("health");

  // â”€â”€ Semua logika kalkulasi di bawah ini TIDAK DIUBAH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const getSafeIcon = (iconName: string): SafeIconName => {
    const defaultIcon: SafeIconName = "alert-circle-outline";
    if (iconName in Ionicons.glyphMap) return iconName as SafeIconName;
    return defaultIcon;
  };

  const hasData = useMemo(() => {
    return (
      state.transactions.length > 0 ||
      state.budgets.length > 0 ||
      state.savings.length > 0
    );
  }, [state.transactions, state.budgets, state.savings]);

  const transactionAnalytics = useMemo(() => {
    try {
      const analytics = calculateTransactionAnalytics(
        state.transactions || [],
        timeRange
      );
      return {
        ...analytics,
        totalIncome:             safeNumber(analytics.totalIncome),
        totalExpense:            safeNumber(analytics.totalExpense),
        netSavings:              safeNumber(analytics.netSavings),
        savingsRate:             safeNumber(analytics.savingsRate),
        avgDailyExpense:         safeNumber(analytics.avgDailyExpense),
        transactionCount:        analytics.transactionCount || 0,
        incomeTransactionCount:  analytics.incomeTransactionCount || 0,
        expenseTransactionCount: analytics.expenseTransactionCount || 0,
        topCategories:           analytics.topCategories || [],
        dailyTrends:             analytics.dailyTrends || [],
      };
    } catch (error) {
      return {
        totalIncome: 0, totalExpense: 0, netSavings: 0, savingsRate: 0,
        avgDailyExpense: 0, transactionCount: 0, incomeTransactionCount: 0,
        expenseTransactionCount: 0, topCategories: [], dailyTrends: [],
        timeRange, startDate: new Date(), endDate: new Date(),
      };
    }
  }, [state.transactions, timeRange]);

  const budgetAnalytics = useMemo(() => {
    try {
      return calculateBudgetAnalytics(state.budgets || []);
    } catch (error) {
      return {
        totalBudget: 0, totalSpent: 0, utilizationRate: 0,
        overBudgetCount: 0, underBudgetCount: 0, budgetsAtRisk: [], hasBudgets: false,
      };
    }
  }, [state.budgets]);

  const savingsAnalytics = useMemo(() => {
    try {
      return calculateSavingsAnalytics(state.savings || []);
    } catch (error) {
      return {
        totalTarget: 0, totalCurrent: 0, overallProgress: 0,
        completedSavings: 0, activeSavings: 0, nearingCompletion: [], hasSavings: false,
      };
    }
  }, [state.savings]);

  const financialHealthScore = useMemo(() => {
    try {
      const totalActiveDebt = (state.debts || [])
        .filter((d) => d.type === "borrowed" && d.status !== "paid")
        .reduce((sum, d) => sum + safeNumber(d.remaining), 0);
      return calculateFinancialHealthScore(
        transactionAnalytics,
        budgetAnalytics,
        savingsAnalytics,
        totalActiveDebt
      );
    } catch (error) {
      return {
        overallScore: 0,
        category: "Belum Ada Data",
        color: colors.gray500,
        factors: {
          savingsRate:     { score: 0, weight: 0.3,  status: "poor" },
          budgetAdherence: { score: 0, weight: 0.3,  status: "poor" },
          expenseControl:  { score: 0, weight: 0.25, status: "poor" },
          goalProgress:    { score: 0, weight: 0.15, status: "poor" },
        },
        recommendations: [
          "Mulai dengan mencatat transaksi pertama Anda",
          "Buat anggaran sederhana untuk pengeluaran utama",
          "Tetapkan target tabungan kecil untuk memulai",
        ],
      };
    }
  }, [transactionAnalytics, budgetAnalytics, savingsAnalytics]);

  const insights = useMemo(() => {
    try {
      return generateFinancialInsights(
        transactionAnalytics,
        budgetAnalytics,
        savingsAnalytics
      );
    } catch (error) {
      return [
        {
          type: "info",
          title: "Data Dimuat",
          message: "Analitik keuangan Anda sedang diproses",
          icon: "information-circle",
          color: colors.info,
        },
      ];
    }
  }, [transactionAnalytics, budgetAnalytics, savingsAnalytics]);

  const getScoreColor = (score: number) => {
    if (score === 0) return colors.gray500;
    if (score >= 80)  return colors.success;
    if (score >= 60)  return colors.info;
    if (score >= 40)  return colors.warning;
    if (score >= 20)  return colors.error;
    return colors.errorDark;
  };

  const getScoreDescription = (score: number) => {
    if (score >= 80) return "Sangat Sehat";
    if (score >= 60) return "Sehat";
    if (score >= 40) return "Cukup";
    if (score >= 20) return "Perlu Perbaikan";
    if (score === 0) return "Belum Ada Data";
    return "Kritis";
  };

  const getComparativeData = () => {
    try {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthTransactions = (state.transactions || []).filter((t) => {
        try {
          if (!t || !t.date) return false;
          const transDate = new Date(t.date);
          if (isNaN(transDate.getTime())) return false;
          return (
            transDate.getMonth() === lastMonth.getMonth() &&
            transDate.getFullYear() === lastMonth.getFullYear()
          );
        } catch { return false; }
      });
      const lastMonthAnalytics = calculateTransactionAnalytics(
        lastMonthTransactions,
        "month"
      );
      const safeCurrentIncome      = safeNumber(transactionAnalytics.totalIncome);
      const safeCurrentExpense     = safeNumber(transactionAnalytics.totalExpense);
      const safeCurrentSavingsRate = safeNumber(transactionAnalytics.savingsRate);
      const safeLastIncome         = safeNumber(lastMonthAnalytics.totalIncome);
      const safeLastExpense        = safeNumber(lastMonthAnalytics.totalExpense);
      const safeLastSavingsRate    = safeNumber(lastMonthAnalytics.savingsRate);
      return {
        current:  { totalIncome: safeCurrentIncome, totalExpense: safeCurrentExpense, savingsRate: safeCurrentSavingsRate },
        previous: { totalIncome: safeLastIncome,    totalExpense: safeLastExpense,    savingsRate: safeLastSavingsRate },
        incomeChange:      safeCurrentIncome      - safeLastIncome,
        expenseChange:     safeCurrentExpense     - safeLastExpense,
        savingsRateChange: safeCurrentSavingsRate - safeLastSavingsRate,
      };
    } catch (error) {
      return {
        current:  { totalIncome: 0, totalExpense: 0, savingsRate: 0 },
        previous: { totalIncome: 0, totalExpense: 0, savingsRate: 0 },
        incomeChange: 0, expenseChange: 0, savingsRateChange: 0,
      };
    }
  };

  const comparativeData = getComparativeData();

  const cashFlowForecast = useMemo(() => {
    try {
      let startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      let cycleIncomeId: string | undefined;

      if (timeRange === "week") {
        const cycle = getActiveCycleInfo(state.transactions);
        if (cycle) {
          startDate = cycle.startDate;
          cycleIncomeId = cycle.cycleIncomeId;
        } else {
          const currentDay = startDate.getDay() === 0 ? 7 : startDate.getDay();
          startDate.setDate(startDate.getDate() - currentDay + 1);
        }
      } else if (timeRange === "month") {
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      } else if (timeRange === "year") {
        startDate = new Date(startDate.getFullYear(), 0, 1);
      }

      const openingBalance = calculateOpeningBalance(
        state.transactions,
        startDate,
        cycleIncomeId
      );
      const totalAvailableCash =
        transactionAnalytics.totalIncome + openingBalance;

      const projection = calculateProjection(
        totalAvailableCash,
        transactionAnalytics.totalExpense,
        transactionAnalytics.startDate,
        transactionAnalytics.endDate
      );

      return {
        dailyAvg: projection.dailyAvgExpense,
        daysRemaining: projection.daysRemaining,
        forecast: projection.projectedBalance,
        status:
          projection.projectedBalance > 100000
            ? "safe"
            : projection.projectedBalance > -100000
            ? "warning"
            : "danger",
      };
    } catch (error) {
      return { dailyAvg: 0, daysRemaining: 0, forecast: 0, status: "safe" };
    }
  }, [transactionAnalytics, state.transactions, timeRange]);

  type BenchmarkItem = {
    category: string;
    yourPercentage: number;
    avgPercentage: number;
    difference: number;
    status: "above" | "below" | "normal";
  };

  const getCategoryBenchmarks = (): BenchmarkItem[] => {
    try {
      const averagePercentages: Record<string, number> = {
        Makanan: 30, Transportasi: 20, Belanja: 15,
        Hiburan: 10, Tagihan: 15,     Lainnya: 10,
      };
      const totalExpense = safeNumber(transactionAnalytics.totalExpense);
      if (totalExpense <= 0) return [];
      return (transactionAnalytics.topCategories || []).map(
        ([category, amount]): BenchmarkItem => {
          const safeAmount     = safeNumber(amount);
          const yourPercentage = getSafePercentage(safeAmount, totalExpense);
          const avgPercentage  = averagePercentages[category] || 15;
          const difference     = safeNumber(yourPercentage - avgPercentage);
          const status: "above" | "below" | "normal" =
            difference > 5 ? "above" : difference < -5 ? "below" : "normal";
          return { category, yourPercentage, avgPercentage, difference, status };
        }
      );
    } catch (error) {
      return [];
    }
  };

  const categoryBenchmarks = getCategoryBenchmarks();

  const handleExport = async () => {
    try {
      const summary = `
ðŸ“Š LAPORAN KEUANGAN - ${getCurrentMonth()}

PEMASUKAN: ${formatCurrency(transactionAnalytics.totalIncome)}
PENGELUARAN: ${formatCurrency(transactionAnalytics.totalExpense)}
TABUNGAN BERSIH: ${formatCurrency(transactionAnalytics.netSavings)}
RASIO TABUNGAN: ${safeNumber(transactionAnalytics.savingsRate).toFixed(1)}%

ðŸ“ˆ SKOR KESEHATAN KEUANGAN: ${financialHealthScore.overallScore}/100
Kategori: ${financialHealthScore.category}

ðŸ’° TABUNGAN: ${formatCurrency(savingsAnalytics.totalCurrent)} / ${formatCurrency(savingsAnalytics.totalTarget)} (${savingsAnalytics.overallProgress.toFixed(1)}%)

ðŸ’¡ INSIGHT: ${insights[0]?.message || "Keuangan dalam kondisi stabil"}

#MyMoney #KeuanganSehat
      `.trim();

      const filename = `laporan-${new Date().toISOString().slice(0, 10)}.txt`;
      const file = new File(Paths.join(Paths.document, filename));
      await file.write(summary);
      await Sharing.shareAsync(file.uri, {
        mimeType: "text/plain",
        dialogTitle: "Bagikan Laporan Keuangan",
      });
    } catch (error) {
      Alert.alert("Error", "Gagal mengekspor laporan");
    }
  };

  const formatChange = (value: number, isPercent = false) => {
    try {
      const safeValue = safeNumber(value);
      const absValue  = Math.abs(safeValue);
      const prefix    = safeValue >= 0 ? "+" : "-";
      if (isPercent) return `${prefix}${absValue.toFixed(1)}%`;
      if (absValue >= 1000000)
        return `${prefix}Rp ${(absValue / 1000000).toFixed(1)}jt`;
      if (absValue >= 1000)
        return `${prefix}Rp ${(absValue / 1000).toFixed(0)}rb`;
      return `${prefix}Rp ${absValue}`;
    } catch { return "+Rp 0"; }
  };

  // â”€â”€ Benchmark item renderer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderBenchmarkItem = (item: BenchmarkItem) => {
    const statusColor =
      item.status === "above"
        ? ERROR_COLOR
        : item.status === "below"
        ? SUCCESS_COLOR
        : colors.info;
    return (
      <View key={item.category} style={{ marginBottom: 16 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 7,
          }}
        >
          <Text style={{ color: TEXT_SECONDARY, fontSize: 12, fontWeight: "500" }}>
            {item.category}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ color: TEXT_PRIMARY, fontSize: 12, fontWeight: "600" }}>
              {item.yourPercentage.toFixed(0)}%
            </Text>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 20,
                backgroundColor: `${statusColor}15`,
                borderWidth: 1,
                borderColor: `${statusColor}25`,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "600", color: statusColor }}>
                {item.status === "above"
                  ? "â†‘ Tinggi"
                  : item.status === "below"
                  ? "â†“ Rendah"
                  : "Normal"}
              </Text>
            </View>
          </View>
        </View>
        <ThinBar progress={item.yourPercentage / 100} color={statusColor} />
        <Text style={{ color: colors.gray400, fontSize: 10, marginTop: 4 }}>
          Rata-rata: {item.avgPercentage}%
        </Text>
      </View>
    );
  };

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // NO DATA SCREEN
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  if (!hasData) {
    return (
      <View style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>

        {/* â”€â”€ Header (redesigned) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: CARD_BORDER,
          }}
        >
          <Text
            style={{
              color: colors.gray400,
              fontSize: 10,
              fontWeight: "600",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Laporan Keuangan
          </Text>
          <Text
            style={{
              color: TEXT_PRIMARY,
              fontSize: 26,
              fontWeight: "800",
              letterSpacing: -0.5,
            }}
          >
            Analitik
          </Text>
          <Text style={{ color: colors.gray400, fontSize: 12, marginTop: 4 }}>
            {getCurrentMonth()}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 60 }}
        >
          <Spacer size={28} />

          {/* Empty hero */}
          <View style={{ alignItems: "center", marginBottom: 28 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 26,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${colors.gray500}10`,
                borderWidth: 1,
                borderColor: CARD_BORDER,
                marginBottom: 16,
              }}
            >
              <Ionicons name="analytics-outline" size={36} color={colors.gray500} />
            </View>
            <Text
              style={{
                color: TEXT_PRIMARY,
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 8,
                textAlign: "center",
                letterSpacing: -0.3,
              }}
            >
              Belum Ada Data Keuangan
            </Text>
            <Text
              style={{
                color: colors.gray400,
                fontSize: 13,
                textAlign: "center",
                lineHeight: 20,
                maxWidth: 280,
              }}
            >
              Mulai catat transaksi, buat anggaran, atau tambah target tabungan
              untuk melihat analitik kesehatan keuangan Anda.
            </Text>
          </View>

          {/* Score placeholder â€” double ring */}
          <View style={{ alignItems: "center", marginBottom: 28 }}>
            <View
              style={{
                width: 144,
                height: 144,
                borderRadius: 72,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${colors.gray500}08`,
                borderWidth: 2,
                borderColor: `${colors.gray500}20`,
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  width: 116,
                  height: 116,
                  borderRadius: 58,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: `${colors.gray500}08`,
                  borderWidth: 1,
                  borderColor: `${colors.gray500}15`,
                }}
              >
                <Text
                  style={{
                    color: colors.gray500,
                    fontSize: 40,
                    fontWeight: "800",
                    letterSpacing: -2,
                  }}
                >
                  0
                </Text>
                <Text style={{ color: colors.gray400, fontSize: 11, marginTop: -2 }}>
                  /100
                </Text>
              </View>
            </View>
            <Text
              style={{
                color: colors.gray500,
                fontSize: 15,
                fontWeight: "600",
                marginBottom: 4,
              }}
            >
              Belum Ada Data
            </Text>
            <Text style={{ color: colors.gray400, fontSize: 12 }}>
              Mulai catat keuangan untuk melihat skor
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: CARD_BORDER, marginBottom: SECTION_GAP }} />

          {/* Quick start actions */}
          <SectionHeader title="Mulai Dari Sini" />
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
            {[
              { label: "Transaksi Pertama", icon: "add-circle-outline" as SafeIconName, color: ACCENT_COLOR,    nav: "AddTransaction" },
              { label: "Buat Anggaran",     icon: "pie-chart-outline"  as SafeIconName, color: colors.purple,  nav: "AddBudget"      },
              { label: "Target Tabungan",   icon: "wallet-outline"     as SafeIconName, color: colors.pink,    nav: "AddSavings"     },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 18,
                  borderRadius: INNER_RADIUS,
                  backgroundColor: SURFACE_COLOR,
                  borderWidth: 1,
                  borderColor: CARD_BORDER,
                }}
                onPress={() => navigation.navigate(item.nav as any)}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: `${item.color}18`,
                    marginBottom: 8,
                  }}
                >
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <Text
                  style={{
                    color: TEXT_PRIMARY,
                    fontSize: 10,
                    fontWeight: "600",
                    textAlign: "center",
                    lineHeight: 14,
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 1, backgroundColor: CARD_BORDER, marginBottom: SECTION_GAP }} />

          {/* Tips */}
          <SectionHeader title="Tips Untuk Pemula" />
          <Card>
            {[
              "Catat semua pemasukan dan pengeluaran",
              "Buat anggaran untuk 3 kategori utama",
              "Tetapkan target tabungan kecil",
              "Review mingguan progress Anda",
            ].map((tip, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  marginBottom: i < 3 ? 14 : 0,
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                    marginTop: 1,
                    backgroundColor: `${ACCENT_COLOR}20`,
                    flexShrink: 0,
                  }}
                >
                  <Text style={{ color: ACCENT_COLOR, fontSize: 10, fontWeight: "700" }}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={{ color: TEXT_SECONDARY, fontSize: 12, flex: 1, lineHeight: 18 }}>
                  {tip}
                </Text>
              </View>
            ))}
          </Card>
        </ScrollView>
      </View>
    );
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // HEALTH TAB RENDERER
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const renderHealthScore = () => {
    const { overallScore, factors, recommendations } = financialHealthScore;
    const scoreColor = getScoreColor(overallScore);

    return (
      <View>
        {/* Score hero â€” double ring */}
        <View style={{ alignItems: "center", paddingTop: 24, paddingBottom: 20 }}>
          <View
            style={{
              width: 148,
              height: 148,
              borderRadius: 74,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${scoreColor}08`,
              borderWidth: 2,
              borderColor: `${scoreColor}25`,
              marginBottom: 14,
            }}
          >
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${scoreColor}12`,
                borderWidth: 1.5,
                borderColor: `${scoreColor}40`,
              }}
            >
              <Text
                style={{
                  color: scoreColor,
                  fontSize: 44,
                  fontWeight: "800",
                  letterSpacing: -2,
                }}
              >
                {overallScore}
              </Text>
              <Text style={{ color: colors.gray400, fontSize: 11, marginTop: -2 }}>
                /100
              </Text>
            </View>
          </View>
          <Text
            style={{
              color: scoreColor,
              fontSize: 18,
              fontWeight: "700",
              marginBottom: 4,
            }}
          >
            {getScoreDescription(overallScore)}
          </Text>
          <Text style={{ color: colors.gray400, fontSize: 12 }}>
            {financialHealthScore.category}
          </Text>
        </View>

        <Spacer size={4} />

        {/* Pengeluaran & Hutang Card */}
        {(() => {
          const totalActiveDebt = (state.debts || [])
            .filter((d) => d.type === "borrowed" && d.status !== "paid")
            .reduce((sum, d) => sum + safeNumber(d.remaining), 0);
          const totalIncome  = safeNumber(transactionAnalytics.totalIncome);
          const totalExpense = safeNumber(transactionAnalytics.totalExpense);

          const debtRatio      = totalIncome > 0 ? (totalActiveDebt / totalIncome) * 100 : 0;
          const expenseRatio   = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;
          const effectiveRatio = totalIncome > 0
            ? ((totalExpense + totalActiveDebt) / totalIncome) * 100
            : 0;

          return (
            <Card style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: `${ERROR_COLOR}15`,
                    marginRight: 10,
                  }}
                >
                  <Ionicons name="pie-chart-outline" size={15} color={ERROR_COLOR} />
                </View>
                <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "700", letterSpacing: 0.4 }}>
                  PENGELUARAN & HUTANG
                </Text>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Text style={{ color: TEXT_SECONDARY, fontSize: 12, fontWeight: "500" }}>Pengeluaran</Text>
                <Text style={{ color: TEXT_PRIMARY, fontSize: 12, fontWeight: "600" }}>
                  {totalIncome > 0 ? expenseRatio.toFixed(1) : 0}% dari aset
                </Text>
              </View>
              <ThinBar
                progress={Math.min(expenseRatio / 100, 1)}
                color={expenseRatio > 60 ? ERROR_COLOR : expenseRatio > 40 ? WARNING_COLOR : SUCCESS_COLOR}
              />

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6, marginTop: 16 }}>
                <Text style={{ color: TEXT_SECONDARY, fontSize: 12, fontWeight: "500" }}>Sisa Hutang Aktif</Text>
                <Text style={{ color: debtRatio > 0 ? ERROR_COLOR : SUCCESS_COLOR, fontSize: 12, fontWeight: "600" }}>
                  {totalIncome > 0 ? debtRatio.toFixed(1) : 0}% dari aset
                </Text>
              </View>
              <ThinBar
                progress={Math.min(debtRatio / 100, 1)}
                color={debtRatio > 0 ? ERROR_COLOR : colors.gray500}
              />

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 16,
                  paddingTop: 14,
                  borderTopWidth: 1,
                  borderTopColor: CARD_BORDER,
                }}
              >
                <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "700" }}>
                  Total Beban Keuangan
                </Text>
                <Text
                  style={{
                    color: effectiveRatio >= 80 ? ERROR_COLOR : effectiveRatio >= 60 ? WARNING_COLOR : SUCCESS_COLOR,
                    fontSize: 15,
                    fontWeight: "800",
                  }}
                >
                  {effectiveRatio.toFixed(1)}%
                </Text>
              </View>
              <Text style={{ color: colors.gray400, fontSize: 10, marginTop: 5 }}>
                Aman jika total beban berada di bawah 60%
              </Text>
            </Card>
          );
        })()}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <>
            <SectionHeader title="Rekomendasi Perbaikan" />
            <Card style={{ marginBottom: 16 }}>
              {recommendations.map((rec, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    marginBottom: index < recommendations.length - 1 ? 14 : 0,
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                      marginTop: 1,
                      backgroundColor: `${SUCCESS_COLOR}20`,
                      flexShrink: 0,
                    }}
                  >
                    <Ionicons name="checkmark" size={11} color={SUCCESS_COLOR} />
                  </View>
                  <Text style={{ color: TEXT_SECONDARY, fontSize: 12, flex: 1, lineHeight: 18 }}>
                    {rec}
                  </Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Score legend */}
        <SectionHeader title="Keterangan Skor" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {[
            { range: "0",      label: "Belum Ada Data",  color: colors.gray500   },
            { range: "80-100", label: "Sangat Sehat",    color: SUCCESS_COLOR    },
            { range: "60-79",  label: "Sehat",           color: colors.info      },
            { range: "40-59",  label: "Cukup",           color: WARNING_COLOR    },
            { range: "20-39",  label: "Perlu Perbaikan", color: ERROR_COLOR      },
            { range: "1-19",   label: "Kritis",          color: colors.errorDark },
          ].map((item) => (
            <View
              key={item.range}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 10,
                backgroundColor: SURFACE_COLOR,
                borderWidth: 1,
                borderColor: CARD_BORDER,
              }}
            >
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: item.color,
                  marginRight: 6,
                }}
              />
              <Text style={{ color: TEXT_SECONDARY, fontSize: 11 }}>
                {item.range}: {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // MAIN RENDER
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>

      {/* â”€â”€ Fixed Header (redesigned) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: CARD_BORDER,
        }}
      >
        {/* Title row + Export button */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <View>
            <Text
              style={{
                color: colors.gray400,
                fontSize: 10,
                fontWeight: "600",
                letterSpacing: 1.5,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Laporan Keuangan
            </Text>
            <Text
              style={{
                color: TEXT_PRIMARY,
                fontSize: 26,
                fontWeight: "800",
                letterSpacing: -0.5,
                lineHeight: 30,
              }}
            >
              Analitik
            </Text>
            <Text style={{ color: colors.gray400, fontSize: 12, marginTop: 4 }}>
              {getCurrentMonth()}
            </Text>
          </View>

          {/* Export â€” pill button dengan label */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 22,
              backgroundColor: `${ACCENT_COLOR}15`,
              borderWidth: 1,
              borderColor: `${ACCENT_COLOR}28`,
              marginTop: 2,
            }}
            onPress={handleExport}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={13} color={ACCENT_COLOR} />
            <Text style={{ color: ACCENT_COLOR, fontSize: 12, fontWeight: "700" }}>
              Ekspor
            </Text>
          </TouchableOpacity>
        </View>

        {/* Time range â€” segmented control, sekarang di header (fixed) */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "rgba(255,255,255,0.04)",
            borderRadius: 12,
            padding: 3,
            borderWidth: 1,
            borderColor: CARD_BORDER,
          }}
        >
          {[
            { key: "week",  label: "Minggu" },
            { key: "month", label: "Bulan"  },
            { key: "year",  label: "Tahun"  },
          ].map((tab) => {
            const isActive = timeRange === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 9,
                  backgroundColor: isActive ? `${ACCENT_COLOR}22` : "transparent",
                  alignItems: "center",
                }}
                onPress={() => setTimeRange(tab.key as any)}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: isActive ? "700" : "500",
                    color: isActive ? ACCENT_COLOR : colors.gray400,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* â”€â”€ Tab navigation (redesigned) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/*   Fixed row, icon + label + bottom indicator â€” tidak perlu scroll   */}
      <View
        style={{
          backgroundColor: BACKGROUND_COLOR,
          borderBottomWidth: 1,
          borderBottomColor: CARD_BORDER,
        }}
      >
        <View style={{ flexDirection: "row" }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingTop: 11,
                  paddingBottom: 10,
                  position: "relative",
                }}
                onPress={() => setActiveTab(tab.key as any)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon}
                  size={18}
                  color={isActive ? ACCENT_COLOR : colors.gray500}
                />
                <Text
                  style={{
                    color: isActive ? ACCENT_COLOR : colors.gray500,
                    fontSize: 9,
                    fontWeight: isActive ? "700" : "500",
                    marginTop: 4,
                    letterSpacing: 0.1,
                  }}
                >
                  {tab.label}
                </Text>
                {/* Active bottom indicator */}
                {isActive && (
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      width: "44%",
                      height: 2,
                      borderTopLeftRadius: 2,
                      borderTopRightRadius: 2,
                      backgroundColor: ACCENT_COLOR,
                    }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* â”€â”€ Main scrollable content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* Catatan: page header & time range sudah dipindah ke fixed area atas */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 70 }}
        showsVerticalScrollIndicator={false}
      >
        <Spacer size={16} />

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            HEALTH TAB
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {activeTab === "health" && renderHealthScore()}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            SUMMARY TAB
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {activeTab === "summary" && (
          <>
            {/* Income / Expense hero */}
            <Card style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: SUCCESS_COLOR, marginRight: 5 }} />
                    <Text style={{ color: colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8 }}>
                      Pemasukan
                    </Text>
                  </View>
                  <Text style={{ color: SUCCESS_COLOR, fontSize: 18, fontWeight: "700", marginBottom: 3 }}>
                    {formatCurrency(transactionAnalytics.totalIncome)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: comparativeData.incomeChange >= 0 ? SUCCESS_COLOR : ERROR_COLOR,
                    }}
                  >
                    {formatChange(comparativeData.incomeChange)} vs bln lalu
                  </Text>
                </View>

                <VDivider height={52} />

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ERROR_COLOR, marginRight: 5 }} />
                    <Text style={{ color: colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8 }}>
                      Pengeluaran
                    </Text>
                  </View>
                  <Text style={{ color: ERROR_COLOR, fontSize: 18, fontWeight: "700", marginBottom: 3 }}>
                    {formatCurrency(transactionAnalytics.totalExpense)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: comparativeData.expenseChange >= 0 ? ERROR_COLOR : SUCCESS_COLOR,
                    }}
                  >
                    {formatChange(comparativeData.expenseChange)} vs bln lalu
                  </Text>
                </View>
              </View>
            </Card>

            {/* Savings rate */}
            <Card style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ color: TEXT_SECONDARY, fontSize: 12, fontWeight: "500" }}>Rasio Tabungan</Text>
                <Text style={{ color: ACCENT_COLOR, fontSize: 15, fontWeight: "700" }}>
                  {transactionAnalytics.savingsRate.toFixed(1)}%
                </Text>
              </View>
              <ThinBar
                progress={Math.max(0, Math.min(safeNumber(transactionAnalytics.savingsRate) / 100, 1))}
                color={
                  transactionAnalytics.savingsRate >= 20
                    ? SUCCESS_COLOR
                    : transactionAnalytics.savingsRate >= 10
                    ? WARNING_COLOR
                    : ERROR_COLOR
                }
              />
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
                <Text style={{ color: colors.gray400, fontSize: 10 }}>0% (Defisit)</Text>
                <Text style={{ color: colors.gray400, fontSize: 10 }}>20% (Sehat)</Text>
                <Text style={{ color: colors.gray400, fontSize: 10 }}>100%</Text>
              </View>
            </Card>

            {/* Cash flow forecast */}
            {cashFlowForecast.daysRemaining > 0 && (
              <>
                <SectionHeader title="Proyeksi Akhir Bulan" />
                <Card style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View>
                      <Text style={{ color: colors.gray400, fontSize: 11, marginBottom: 4 }}>
                        {cashFlowForecast.daysRemaining} hari lagi
                      </Text>
                      <Text style={{ color: TEXT_SECONDARY, fontSize: 12 }}>
                        Rata-rata {formatCurrency(cashFlowForecast.dailyAvg)}/hari
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        color:
                          cashFlowForecast.status === "safe"
                            ? SUCCESS_COLOR
                            : cashFlowForecast.status === "warning"
                            ? WARNING_COLOR
                            : ERROR_COLOR,
                      }}
                    >
                      {formatCurrency(cashFlowForecast.forecast)}
                    </Text>
                  </View>
                </Card>
              </>
            )}

            {/* Quick stats row */}
            <SectionHeader title="Statistik" />
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
              {/* Transaksi */}
              <View style={{ flex: 1, borderRadius: INNER_RADIUS, padding: 14, backgroundColor: SURFACE_COLOR, borderWidth: 1, borderColor: CARD_BORDER }}>
                <Text style={{ color: colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>
                  Transaksi
                </Text>
                <Text style={{ color: TEXT_PRIMARY, fontSize: 17, fontWeight: "700", marginBottom: 3 }}>
                  {transactionAnalytics.transactionCount}
                </Text>
                <Text style={{ color: colors.gray400, fontSize: 9 }}>
                  {transactionAnalytics.incomeTransactionCount} masuk Â· {transactionAnalytics.expenseTransactionCount} keluar
                </Text>
              </View>

              {/* Anggaran */}
              <View style={{ flex: 1, borderRadius: INNER_RADIUS, padding: 14, backgroundColor: SURFACE_COLOR, borderWidth: 1, borderColor: CARD_BORDER }}>
                <Text style={{ color: colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>
                  Anggaran
                </Text>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "700",
                    marginBottom: 3,
                    color:
                      budgetAnalytics.overBudgetCount > 0
                        ? ERROR_COLOR
                        : budgetAnalytics.hasBudgets
                        ? SUCCESS_COLOR
                        : TEXT_PRIMARY,
                  }}
                >
                  {budgetAnalytics.hasBudgets
                    ? budgetAnalytics.overBudgetCount > 0
                      ? `${budgetAnalytics.overBudgetCount} âš `
                      : `${budgetAnalytics.underBudgetCount} âœ“`
                    : "0"}
                </Text>
                <Text style={{ color: colors.gray400, fontSize: 9 }}>
                  {budgetAnalytics.hasBudgets
                    ? budgetAnalytics.overBudgetCount > 0
                      ? "Melebihi limit"
                      : "Semua aman"
                    : "Belum ada anggaran"}
                </Text>
              </View>

              {/* Tabungan */}
              <View style={{ flex: 1, borderRadius: INNER_RADIUS, padding: 14, backgroundColor: SURFACE_COLOR, borderWidth: 1, borderColor: CARD_BORDER }}>
                <Text style={{ color: colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>
                  Tabungan
                </Text>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "700",
                    marginBottom: 3,
                    color: !savingsAnalytics.hasSavings
                      ? TEXT_PRIMARY
                      : savingsAnalytics.overallProgress >= 100
                      ? SUCCESS_COLOR
                      : savingsAnalytics.overallProgress >= 50
                      ? WARNING_COLOR
                      : TEXT_PRIMARY,
                  }}
                >
                  {savingsAnalytics.hasSavings
                    ? `${savingsAnalytics.completedSavings}/${savingsAnalytics.activeSavings + savingsAnalytics.completedSavings}`
                    : "0"}
                </Text>
                <Text style={{ color: colors.gray400, fontSize: 9 }}>
                  {savingsAnalytics.hasSavings
                    ? savingsAnalytics.overallProgress > 0
                      ? `${savingsAnalytics.overallProgress.toFixed(0)}% tercapai`
                      : "Belum ada progress"
                    : "Belum ada tabungan"}
                </Text>
              </View>
            </View>

            {/* Savings progress */}
            {savingsAnalytics.hasSavings && (
              <>
                <SectionHeader
                  title="Progress Tabungan"
                  linkLabel="Detail"
                  onPress={() => navigation.navigate("Savings")}
                />
                <Card style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Text style={{ color: TEXT_SECONDARY, fontSize: 12, fontWeight: "500" }}>Total Tabungan</Text>
                    <Text style={{ color: colors.gray400, fontSize: 11 }}>
                      {formatCurrency(savingsAnalytics.totalCurrent)} / {formatCurrency(savingsAnalytics.totalTarget)}
                    </Text>
                  </View>
                  <ThinBar
                    progress={Math.max(0, Math.min(safeNumber(savingsAnalytics.overallProgress) / 100, 1))}
                    color={
                      savingsAnalytics.overallProgress >= 100
                        ? SUCCESS_COLOR
                        : savingsAnalytics.overallProgress >= 75
                        ? colors.info
                        : savingsAnalytics.overallProgress >= 50
                        ? WARNING_COLOR
                        : ACCENT_COLOR
                    }
                  />
                  <Text style={{ color: colors.gray400, fontSize: 10, marginTop: 5 }}>
                    {savingsAnalytics.overallProgress.toFixed(1)}% tercapai
                  </Text>

                  <View style={{ height: 1, backgroundColor: CARD_BORDER, marginVertical: 14 }} />

                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {[
                      { label: "Selesai", value: savingsAnalytics.completedSavings,               color: SUCCESS_COLOR  },
                      { label: "Aktif",   value: savingsAnalytics.activeSavings,                  color: ACCENT_COLOR   },
                      { label: "Hampir",  value: savingsAnalytics.nearingCompletion?.length || 0, color: WARNING_COLOR  },
                    ].map((item, i) => (
                      <React.Fragment key={item.label}>
                        <View style={{ flex: 1, alignItems: "center" }}>
                          <Text style={{ color: colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>
                            {item.label}
                          </Text>
                          <Text style={{ color: item.color, fontSize: 19, fontWeight: "700" }}>
                            {item.value}
                          </Text>
                        </View>
                        {i < 2 && <View style={{ width: 1, height: 32, backgroundColor: CARD_BORDER }} />}
                      </React.Fragment>
                    ))}
                  </View>

                  {savingsAnalytics.nearingCompletion && savingsAnalytics.nearingCompletion.length > 0 && (
                    <View style={{ marginTop: 14 }}>
                      <View style={{ height: 1, backgroundColor: CARD_BORDER, marginBottom: 12 }} />
                      <Text style={{ color: colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                        Hampir Tercapai
                      </Text>
                      {savingsAnalytics.nearingCompletion.slice(0, 2).map((saving, index) => (
                        <View key={index} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <Text style={{ color: TEXT_SECONDARY, fontSize: 12 }}>{saving.name}</Text>
                          <Text style={{ color: WARNING_COLOR, fontSize: 12, fontWeight: "600" }}>
                            {((saving.current / saving.target) * 100).toFixed(0)}%
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Card>
              </>
            )}

            {/* Budget progress */}
            {budgetAnalytics.hasBudgets && (
              <>
                <SectionHeader
                  title="Progress Anggaran"
                  linkLabel="Detail"
                  onPress={() => navigation.navigate("Budget")}
                />
                <Card>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Text style={{ color: TEXT_SECONDARY, fontSize: 12, fontWeight: "500" }}>Total Anggaran</Text>
                    <Text style={{ color: colors.gray400, fontSize: 11 }}>
                      {formatCurrency(budgetAnalytics.totalSpent)} / {formatCurrency(budgetAnalytics.totalBudget)}
                    </Text>
                  </View>
                  <ThinBar
                    progress={Math.max(0, Math.min(safeNumber(budgetAnalytics.utilizationRate) / 100, 1))}
                    color={
                      budgetAnalytics.utilizationRate <= 80
                        ? SUCCESS_COLOR
                        : budgetAnalytics.utilizationRate <= 100
                        ? WARNING_COLOR
                        : ERROR_COLOR
                    }
                  />
                  <Text style={{ color: colors.gray400, fontSize: 10, marginTop: 5 }}>
                    {budgetAnalytics.utilizationRate.toFixed(1)}% terpakai
                  </Text>
                </Card>
              </>
            )}
          </>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            TRENDS TAB
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {activeTab === "trends" && (
          <>
            <SectionHeader title={`Tren ${timeRange}`} />
            <Card style={{ marginBottom: 16 }}>
              {[
                {
                  label: "Pengeluaran", change: comparativeData.expenseChange,
                  current: safeNumber(transactionAnalytics.totalExpense),
                  max: safeNumber(transactionAnalytics.totalIncome) * 1.5 || 1,
                  color: ERROR_COLOR, upLabel: "Naik", downLabel: "Turun", upGood: false,
                },
                {
                  label: "Pemasukan", change: comparativeData.incomeChange,
                  current: safeNumber(transactionAnalytics.totalIncome),
                  max: safeNumber(comparativeData.previous.totalIncome) * 1.3 || 1,
                  color: SUCCESS_COLOR, upLabel: "Naik", downLabel: "Turun", upGood: true,
                },
                {
                  label: "Rasio Tabungan", change: comparativeData.savingsRateChange,
                  current: safeNumber(transactionAnalytics.savingsRate) / 100, max: 1,
                  color: ACCENT_COLOR, upLabel: "Membaik", downLabel: "Memburuk", upGood: true,
                },
              ].map((item, i, arr) => (
                <View key={item.label} style={{ marginBottom: i < arr.length - 1 ? 18 : 0 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <Text style={{ color: TEXT_SECONDARY, fontSize: 12, fontWeight: "500" }}>{item.label}</Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color:
                          item.change >= 0
                            ? item.upGood ? SUCCESS_COLOR : ERROR_COLOR
                            : item.upGood ? ERROR_COLOR : SUCCESS_COLOR,
                      }}
                    >
                      {item.change >= 0 ? item.upLabel : item.downLabel}{" "}
                      {formatChange(Math.abs(item.change))}
                    </Text>
                  </View>
                  <ThinBar progress={Math.max(0, Math.min(item.current / (item.max || 1), 1))} color={item.color} />
                </View>
              ))}
            </Card>

            {/* Savings comparison */}
            <Card style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ color: colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>
                    Bulan Lalu
                  </Text>
                  <Text style={{ color: TEXT_SECONDARY, fontSize: 16, fontWeight: "700" }}>
                    {safeNumber(comparativeData.previous.savingsRate).toFixed(1)}%
                  </Text>
                </View>
                <View style={{ width: 1, height: 36, backgroundColor: CARD_BORDER }} />
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ color: colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>
                    Sekarang
                  </Text>
                  <Text style={{ color: ACCENT_COLOR, fontSize: 16, fontWeight: "700" }}>
                    {safeNumber(transactionAnalytics.savingsRate).toFixed(1)}%
                  </Text>
                </View>
                <View style={{ width: 1, height: 36, backgroundColor: CARD_BORDER }} />
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ color: colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>
                    Perubahan
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: comparativeData.savingsRateChange >= 0 ? SUCCESS_COLOR : ERROR_COLOR,
                    }}
                  >
                    {formatChange(comparativeData.savingsRateChange, true)}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Daily average */}
            <SectionHeader title="Rata-rata Harian" />
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>
                    Pengeluaran/hari
                  </Text>
                  <Text style={{ color: ERROR_COLOR, fontSize: 17, fontWeight: "700" }}>
                    {formatCurrency(transactionAnalytics.avgDailyExpense)}
                  </Text>
                </View>
                <VDivider height={40} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>
                    vs Rata-rata*
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: transactionAnalytics.avgDailyExpense > 100000 ? ERROR_COLOR : SUCCESS_COLOR,
                    }}
                  >
                    {transactionAnalytics.avgDailyExpense > 100000 ? "â†‘ Tinggi" : "â†“ Hemat"}
                  </Text>
                </View>
              </View>
              <Text style={{ color: colors.gray400, fontSize: 10, marginTop: 12 }}>
                *Berdasarkan data pengguna di kota besar
              </Text>
            </Card>
          </>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            CATEGORIES TAB
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {activeTab === "categories" && (
          <>
            <SectionHeader title="Analisis Kategori" />

            {transactionAnalytics.topCategories.length > 0 ? (
              <>
                <Card style={{ marginBottom: 16 }}>
                  {categoryBenchmarks.slice(0, 5).map(renderBenchmarkItem)}
                </Card>

                {transactionAnalytics.topCategories[0] &&
                  safeNumber(transactionAnalytics.topCategories[0][1]) >
                    safeNumber(transactionAnalytics.totalExpense) * 0.4 && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      padding: 14,
                      borderRadius: INNER_RADIUS,
                      backgroundColor: `${ERROR_COLOR}0C`,
                      borderWidth: 1,
                      borderColor: `${ERROR_COLOR}20`,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: `${ERROR_COLOR}18`,
                        marginRight: 12,
                        flexShrink: 0,
                      }}
                    >
                      <Ionicons name="warning-outline" size={14} color={ERROR_COLOR} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: ERROR_COLOR, fontSize: 12, fontWeight: "600", marginBottom: 3 }}>
                        Konsentrasi Pengeluaran Tinggi
                      </Text>
                      <Text style={{ color: TEXT_SECONDARY, fontSize: 12, lineHeight: 18 }}>
                        {transactionAnalytics.topCategories[0][0]} menghabiskan{" "}
                        {getSafePercentage(
                          transactionAnalytics.topCategories[0][1],
                          transactionAnalytics.totalExpense
                        ).toFixed(0)}% dari total pengeluaran
                      </Text>
                    </View>
                  </View>
                )}
              </>
            ) : (
              <View
                style={{
                  alignItems: "center",
                  paddingVertical: 40,
                  backgroundColor: SURFACE_COLOR,
                  borderRadius: CARD_RADIUS,
                  borderWidth: 1,
                  borderColor: CARD_BORDER,
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: `${colors.gray400}14`,
                    marginBottom: 12,
                  }}
                >
                  <Ionicons name="pricetags-outline" size={24} color={colors.gray400} />
                </View>
                <Text style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: "600", marginBottom: 5 }}>
                  Belum ada data kategori
                </Text>
                <Text style={{ color: colors.gray400, fontSize: 12, textAlign: "center" }}>
                  Mulai catat transaksi untuk melihat analisis kategori
                </Text>
              </View>
            )}
          </>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            INSIGHTS TAB
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {activeTab === "insights" && (
          <>
            {insights.length > 0 && (
              <>
                <SectionHeader title="Insights Keuangan" />
                <View style={{ marginBottom: 20 }}>
                  {insights.map((insight, index) => {
                    const insightColor =
                      insight.type === "success"
                        ? SUCCESS_COLOR
                        : insight.type === "warning"
                        ? ERROR_COLOR
                        : colors.info;
                    return (
                      <View
                        key={index}
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                          paddingVertical: 12,
                          paddingHorizontal: 14,
                          backgroundColor: `${insightColor}09`,
                          borderRadius: INNER_RADIUS,
                          borderWidth: 1,
                          borderColor: `${insightColor}18`,
                          marginBottom: index < insights.length - 1 ? 8 : 0,
                        }}
                      >
                        <View
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: `${insightColor}18`,
                            marginRight: 12,
                            flexShrink: 0,
                          }}
                        >
                          <Ionicons name={getSafeIcon(insight.icon)} size={15} color={insightColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: insightColor, fontSize: 12, fontWeight: "700", marginBottom: 3 }}>
                            {insight.title}
                          </Text>
                          <Text style={{ color: TEXT_SECONDARY, fontSize: 12, lineHeight: 18 }}>
                            {insight.message}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            <SectionHeader title="Tips Harian" />
            <Card>
              {[
                {
                  num: 1, color: ACCENT_COLOR,
                  title: "Review Mingguan",
                  desc: "Luangkan 10 menit setiap Minggu malam untuk review pengeluaran minggu ini",
                },
                {
                  num: 2, color: SUCCESS_COLOR,
                  title: "Auto-Saving",
                  desc: "Set up auto-transfer 10% gaji ke rekening tabungan setiap tanggal gajian",
                },
                {
                  num: 3, color: WARNING_COLOR,
                  title: "Cash-Only Weekend",
                  desc: "Coba metode cash-only untuk pengeluaran weekend, terbukti kurangi impulse buying 30%",
                },
              ].map((tip, i) => (
                <View key={tip.num} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: i < 2 ? 16 : 0 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                      marginTop: 1,
                      backgroundColor: `${tip.color}18`,
                      flexShrink: 0,
                    }}
                  >
                    <Text style={{ color: tip.color, fontSize: 12, fontWeight: "700" }}>
                      {tip.num}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "600", marginBottom: 4 }}>
                      {tip.title}
                    </Text>
                    <Text style={{ color: TEXT_SECONDARY, fontSize: 12, lineHeight: 18 }}>
                      {tip.desc}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}

        <Spacer size={20} />

        {/* â”€â”€ Quick actions (semua tab) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <SectionHeader title="Aksi Cepat" />
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { label: "Transaksi Baru",    icon: "add-circle-outline" as SafeIconName, color: ACCENT_COLOR,   nav: "AddTransaction" },
            { label: "Cek Anggaran",      icon: "pie-chart-outline"  as SafeIconName, color: colors.purple, nav: "Budget"          },
            { label: "Progress Tabungan", icon: "wallet-outline"     as SafeIconName, color: colors.pink,   nav: "Savings"         },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 18,
                borderRadius: INNER_RADIUS,
                backgroundColor: SURFACE_COLOR,
                borderWidth: 1,
                borderColor: CARD_BORDER,
              }}
              onPress={() => navigation.navigate(item.nav as any)}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 13,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: `${item.color}18`,
                  marginBottom: 8,
                }}
              >
                <Ionicons name={item.icon} size={19} color={item.color} />
              </View>
              <Text style={{ color: TEXT_PRIMARY, fontSize: 10, fontWeight: "600", textAlign: "center" }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default AnalyticsScreen;
