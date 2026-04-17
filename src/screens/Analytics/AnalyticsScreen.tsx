// File: src/screens/Analytics/AnalyticsScreen.tsx
import React, { useState, useMemo } from "react";
import { View, ScrollView, TouchableOpacity, Share, Alert } from "react-native";
import { Text, ProgressBar, Divider } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
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
} from "../../utils/calculations";
import { Colors } from "../../theme/theme";

type SafeIconName = keyof typeof Ionicons.glyphMap;

// ─── Warna konsisten dengan HomeScreen ───────────────────────────────────────
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR    = Colors.surface;
const TEXT_PRIMARY     = Colors.textPrimary;
const TEXT_SECONDARY   = Colors.textSecondary;
const BORDER_COLOR     = Colors.border;
const ACCENT_COLOR     = Colors.accent;
const SUCCESS_COLOR    = Colors.success;
const WARNING_COLOR    = Colors.warning;
const ERROR_COLOR      = Colors.error;

// ─── Komponen UI kecil (konsisten dengan HomeScreen) ─────────────────────────

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
  linkLabel,
  onPress,
}: {
  title: string;
  linkLabel?: string;
  onPress?: () => void;
}) => (
  <View style={tw`flex-row justify-between items-center mb-3`}>
    <Text
      style={{
        color: Colors.gray400,
        fontSize: 10,
        fontWeight: "600",
        letterSpacing: 1,
        textTransform: "uppercase",
      }}
    >
      {title}
    </Text>
    {linkLabel && onPress && (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Text style={{ color: ACCENT_COLOR, fontSize: 12 }}>{linkLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

/** Progress bar tipis 3px — konsisten dengan HomeScreen */
const ThinBar = ({
  progress,
  color,
}: {
  progress: number;
  color: string;
}) => (
  <View style={{ height: 3, backgroundColor: Colors.surfaceLight, borderRadius: 3 }}>
    <View
      style={{
        height: 3,
        borderRadius: 3,
        width: `${Math.max(0, Math.min(progress * 100, 100))}%`,
        backgroundColor: color,
      }}
    />
  </View>
);

// ─── Main component ───────────────────────────────────────────────────────────

const AnalyticsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state } = useAppContext();

  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");
  const [activeTab, setActiveTab] = useState<
    "health" | "summary" | "trends" | "categories" | "insights"
  >("health");

  // ── Safe icon helper (sama dengan asli) ──────────────────────────────────
  const getSafeIcon = (iconName: string): SafeIconName => {
    const defaultIcon: SafeIconName = "alert-circle-outline";
    if (iconName in Ionicons.glyphMap) return iconName as SafeIconName;
    return defaultIcon;
  };

  // ── Has data check (sama dengan asli) ────────────────────────────────────
  const hasData = useMemo(() => {
    return (
      state.transactions.length > 0 ||
      state.budgets.length > 0 ||
      state.savings.length > 0
    );
  }, [state.transactions, state.budgets, state.savings]);

  // ── Transaction analytics (sama dengan asli) ─────────────────────────────
  const transactionAnalytics = useMemo(() => {
    try {
      const analytics = calculateTransactionAnalytics(state.transactions || [], timeRange);
      return {
        ...analytics,
        totalIncome:              safeNumber(analytics.totalIncome),
        totalExpense:             safeNumber(analytics.totalExpense),
        netSavings:               safeNumber(analytics.netSavings),
        savingsRate:              safeNumber(analytics.savingsRate),
        avgDailyExpense:          safeNumber(analytics.avgDailyExpense),
        transactionCount:         analytics.transactionCount || 0,
        incomeTransactionCount:   analytics.incomeTransactionCount || 0,
        expenseTransactionCount:  analytics.expenseTransactionCount || 0,
        topCategories:            analytics.topCategories || [],
        dailyTrends:              analytics.dailyTrends || [],
      };
    } catch (error) {
      console.error("Error calculating transaction analytics:", error);
      return {
        totalIncome: 0, totalExpense: 0, netSavings: 0, savingsRate: 0,
        avgDailyExpense: 0, transactionCount: 0, incomeTransactionCount: 0,
        expenseTransactionCount: 0, topCategories: [], dailyTrends: [],
        timeRange, startDate: new Date(), endDate: new Date(),
      };
    }
  }, [state.transactions, timeRange]);

  // ── Budget analytics (sama dengan asli) ──────────────────────────────────
  const budgetAnalytics = useMemo(() => {
    try {
      return calculateBudgetAnalytics(state.budgets || []);
    } catch (error) {
      console.error("Error calculating budget analytics:", error);
      return {
        totalBudget: 0, totalSpent: 0, utilizationRate: 0,
        overBudgetCount: 0, underBudgetCount: 0, budgetsAtRisk: [], hasBudgets: false,
      };
    }
  }, [state.budgets]);

  // ── Savings analytics (sama dengan asli) ─────────────────────────────────
  const savingsAnalytics = useMemo(() => {
    try {
      return calculateSavingsAnalytics(state.savings || []);
    } catch (error) {
      console.error("Error calculating savings analytics:", error);
      return {
        totalTarget: 0, totalCurrent: 0, overallProgress: 0,
        completedSavings: 0, activeSavings: 0, nearingCompletion: [], hasSavings: false,
      };
    }
  }, [state.savings]);

  // ── Financial health score (sama dengan asli) ─────────────────────────────
  const financialHealthScore = useMemo(() => {
    try {
      return calculateFinancialHealthScore(transactionAnalytics, budgetAnalytics, savingsAnalytics);
    } catch (error) {
      console.error("Error calculating health score:", error);
      return {
        overallScore: 0,
        category: "Belum Ada Data",
        color: Colors.gray500,
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

  // ── Insights (sama dengan asli) ───────────────────────────────────────────
  const insights = useMemo(() => {
    try {
      return generateFinancialInsights(transactionAnalytics, budgetAnalytics, savingsAnalytics);
    } catch (error) {
      console.error("Error generating insights:", error);
      return [
        { type: "info", title: "Data Dimuat", message: "Analitik keuangan Anda sedang diproses", icon: "information-circle", color: Colors.info },
      ];
    }
  }, [transactionAnalytics, budgetAnalytics, savingsAnalytics]);

  // ── Score helpers (sama dengan asli) ─────────────────────────────────────
  const getScoreColor = (score: number) => {
    if (score === 0) return Colors.gray500;
    if (score >= 80)  return Colors.success;
    if (score >= 60)  return Colors.info;
    if (score >= 40)  return Colors.warning;
    if (score >= 20)  return Colors.error;
    return Colors.errorDark;
  };

  const getScoreDescription = (score: number) => {
    if (score >= 80) return "Sangat Sehat";
    if (score >= 60) return "Sehat";
    if (score >= 40) return "Cukup";
    if (score >= 20) return "Perlu Perbaikan";
    if (score === 0) return "Belum Ada Data";
    return "Kritis";
  };

  // ── Comparative data (sama dengan asli) ──────────────────────────────────
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
      const lastMonthAnalytics = calculateTransactionAnalytics(lastMonthTransactions, "month");
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
      console.error("Error in getComparativeData:", error);
      return {
        current:  { totalIncome: 0, totalExpense: 0, savingsRate: 0 },
        previous: { totalIncome: 0, totalExpense: 0, savingsRate: 0 },
        incomeChange: 0, expenseChange: 0, savingsRateChange: 0,
      };
    }
  };

  const comparativeData = getComparativeData();

  // ── Cash flow forecast (sama dengan asli) ────────────────────────────────
  const getCashFlowForecast = () => {
    try {
      const dailyAvgSpending = safeNumber(transactionAnalytics.avgDailyExpense);
      const daysRemaining    = Math.max(0, 30 - new Date().getDate());
      const forecast         = safeNumber(transactionAnalytics.netSavings - dailyAvgSpending * daysRemaining);
      return {
        dailyAvg: dailyAvgSpending,
        daysRemaining,
        forecast,
        status: forecast > 100000 ? "safe" : forecast > -100000 ? "warning" : "danger",
      };
    } catch (error) {
      console.error("Error in cash flow forecast:", error);
      return { dailyAvg: 0, daysRemaining: 0, forecast: 0, status: "safe" };
    }
  };

  const cashFlowForecast = getCashFlowForecast();

  // ── Category benchmarks (sama dengan asli) ───────────────────────────────
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
          const safeAmount      = safeNumber(amount);
          const yourPercentage  = getSafePercentage(safeAmount, totalExpense);
          const avgPercentage   = averagePercentages[category] || 15;
          const difference      = safeNumber(yourPercentage - avgPercentage);
          const status: "above" | "below" | "normal" =
            difference > 5 ? "above" : difference < -5 ? "below" : "normal";
          return { category, yourPercentage, avgPercentage, difference, status };
        }
      );
    } catch (error) {
      console.error("Error in category benchmarks:", error);
      return [];
    }
  };

  const categoryBenchmarks = getCategoryBenchmarks();

  // ── Export (sama dengan asli) ─────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const summary = `
📊 LAPORAN KEUANGAN - ${getCurrentMonth()}

PEMASUKAN: ${formatCurrency(transactionAnalytics.totalIncome)}
PENGELUARAN: ${formatCurrency(transactionAnalytics.totalExpense)}
TABUNGAN BERSIH: ${formatCurrency(transactionAnalytics.netSavings)}
RASIO TABUNGAN: ${safeNumber(transactionAnalytics.savingsRate).toFixed(1)}%

📈 SKOR KESEHATAN KEUANGAN: ${financialHealthScore.overallScore}/100
Kategori: ${financialHealthScore.category}

💰 TABUNGAN: ${formatCurrency(savingsAnalytics.totalCurrent)} / ${formatCurrency(savingsAnalytics.totalTarget)} (${savingsAnalytics.overallProgress.toFixed(1)}%)

💡 INSIGHT: ${insights[0]?.message || "Keuangan dalam kondisi stabil"}

#MyMoney #KeuanganSehat
      `.trim();

      const fileUri = FileSystem.documentDirectory + `laporan-${new Date().toISOString().slice(0, 10)}.txt`;
      await FileSystem.writeAsStringAsync(fileUri, summary, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, { mimeType: "text/plain", dialogTitle: "Bagikan Laporan Keuangan" });
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Error", "Gagal mengekspor laporan");
    }
  };

  // ── Format change helper (sama dengan asli) ───────────────────────────────
  const formatChange = (value: number, isPercent = false) => {
    try {
      const safeValue = safeNumber(value);
      const absValue  = Math.abs(safeValue);
      const prefix    = safeValue >= 0 ? "+" : "-";
      if (isPercent) return `${prefix}${absValue.toFixed(1)}%`;
      if (absValue >= 1000000) return `${prefix}Rp ${(absValue / 1000000).toFixed(1)}jt`;
      if (absValue >= 1000)    return `${prefix}Rp ${(absValue / 1000).toFixed(0)}rb`;
      return `${prefix}Rp ${absValue}`;
    } catch { return "+Rp 0"; }
  };

  // ── Benchmark item renderer ────────────────────────────────────────────────
  const renderBenchmarkItem = (item: BenchmarkItem) => (
    <View key={item.category} style={tw`mb-4`}>
      <View style={tw`flex-row justify-between items-center mb-1.5`}>
        <Text style={{ color: TEXT_SECONDARY, fontSize: 12, fontWeight: "500" }}>
          {item.category}
        </Text>
        <View style={tw`flex-row items-center gap-2`}>
          <Text style={{ color: TEXT_PRIMARY, fontSize: 12 }}>
            {item.yourPercentage.toFixed(0)}%
          </Text>
          <View
            style={[
              tw`px-2 py-0.5 rounded-full`,
              item.status === "above" && { backgroundColor: `${ERROR_COLOR}20` },
              item.status === "below" && { backgroundColor: `${SUCCESS_COLOR}20` },
              item.status === "normal" && { backgroundColor: Colors.surfaceLight },
            ]}
          >
            <Text
              style={[
                { fontSize: 10, fontWeight: "500" },
                item.status === "above"  && { color: ERROR_COLOR },
                item.status === "below"  && { color: SUCCESS_COLOR },
                item.status === "normal" && { color: Colors.textSecondary },
              ]}
            >
              {item.status === "above" ? "↑ Tinggi" : item.status === "below" ? "↓ Rendah" : "Normal"}
            </Text>
          </View>
        </View>
      </View>
      <ThinBar
        progress={item.yourPercentage / 100}
        color={
          item.status === "above" ? ERROR_COLOR :
          item.status === "below" ? SUCCESS_COLOR : Colors.info
        }
      />
      <Text style={{ color: Colors.gray400, fontSize: 10, marginTop: 2 }}>
        Rata-rata: {item.avgPercentage}%
      </Text>
    </View>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // NO DATA SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  if (!hasData) {
    return (
      <View style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
        {/* Header */}
        <View style={[tw`px-4 pt-3 pb-3`, { borderBottomWidth: 1, borderBottomColor: SURFACE_COLOR }]}>
          <Text style={{ color: TEXT_PRIMARY, fontSize: 20, fontWeight: "700" }}>Analitik</Text>
          <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 2 }}>{getCurrentMonth()}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          <Sep marginV={24} />

          {/* Empty state */}
          <View style={tw`items-center`}>
            <View
              style={[
                tw`w-20 h-20 rounded-full items-center justify-center mb-4`,
                { backgroundColor: `${Colors.gray500}15` },
              ]}
            >
              <Ionicons name="analytics-outline" size={36} color={Colors.gray500} />
            </View>

            <Text style={{ color: TEXT_PRIMARY, fontSize: 17, fontWeight: "700", marginBottom: 8, textAlign: "center" }}>
              Belum Ada Data Keuangan
            </Text>
            <Text style={{ color: Colors.gray400, fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 24 }}>
              Mulai catat transaksi, buat anggaran, atau tambah target tabungan untuk melihat analitik kesehatan keuangan Anda.
            </Text>

            {/* Score placeholder */}
            <View style={[tw`items-center mb-8`]}>
              <View
                style={[
                  tw`w-28 h-28 rounded-full items-center justify-center`,
                  { backgroundColor: `${Colors.gray500}15`, borderWidth: 3, borderColor: `${Colors.gray500}40` },
                ]}
              >
                <Text style={{ color: Colors.gray500, fontSize: 36, fontWeight: "700" }}>0</Text>
                <Text style={{ color: Colors.gray400, fontSize: 12, marginTop: 2 }}>/100</Text>
              </View>
              <Text style={{ color: Colors.gray500, fontSize: 14, fontWeight: "600", marginTop: 10 }}>
                Belum Ada Data
              </Text>
              <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 3 }}>
                Mulai catat keuangan untuk melihat skor
              </Text>
            </View>

            <Sep />

            {/* Quick start actions */}
            <SectionHeader title="Mulai Dari Sini" />
            <View style={tw`flex-row gap-3 mb-6`}>
              {[
                { label: "Transaksi Pertama", icon: "add-circle-outline" as SafeIconName, color: ACCENT_COLOR,   nav: "AddTransaction" },
                { label: "Buat Anggaran",     icon: "pie-chart-outline"  as SafeIconName, color: Colors.purple, nav: "AddBudget" },
                { label: "Target Tabungan",   icon: "wallet-outline"     as SafeIconName, color: Colors.pink,   nav: "AddSavings" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    tw`flex-1 items-center py-4 rounded-xl`,
                    { backgroundColor: SURFACE_COLOR },
                  ]}
                  onPress={() => navigation.navigate(item.nav as any)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      tw`w-10 h-10 rounded-xl items-center justify-center mb-2`,
                      { backgroundColor: `${item.color}18` },
                    ]}
                  >
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text style={{ color: TEXT_PRIMARY, fontSize: 10, fontWeight: "500", textAlign: "center" }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Sep />

            {/* Tips for beginners */}
            <SectionHeader title="Tips Untuk Pemula" />
            {[
              "Catat semua pemasukan dan pengeluaran",
              "Buat anggaran untuk 3 kategori utama",
              "Tetapkan target tabungan kecil",
              "Review mingguan progress Anda",
            ].map((tip, i) => (
              <View key={i} style={tw`flex-row items-start mb-3`}>
                <View
                  style={[
                    tw`w-5 h-5 rounded-full items-center justify-center mr-3 mt-0.5`,
                    { backgroundColor: `${ACCENT_COLOR}20`, flexShrink: 0 },
                  ]}
                >
                  <Text style={{ color: ACCENT_COLOR, fontSize: 10, fontWeight: "700" }}>{i + 1}</Text>
                </View>
                <Text style={{ color: TEXT_SECONDARY, fontSize: 12, flex: 1, lineHeight: 18 }}>{tip}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HEALTH TAB RENDERER
  // ═══════════════════════════════════════════════════════════════════════════
  const renderHealthScore = () => {
    const { overallScore, factors, recommendations } = financialHealthScore;

    return (
      <View>
        {/* Score hero */}
        <View style={tw`items-center py-6`}>
          <View
            style={[
              tw`w-28 h-28 rounded-full items-center justify-center mb-4`,
              {
                backgroundColor: `${getScoreColor(overallScore)}18`,
                borderWidth: 3,
                borderColor: `${getScoreColor(overallScore)}50`,
              },
            ]}
          >
            <Text style={{ color: getScoreColor(overallScore), fontSize: 36, fontWeight: "700" }}>
              {overallScore}
            </Text>
            <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 2 }}>/100</Text>
          </View>
          <Text style={{ color: getScoreColor(overallScore), fontSize: 16, fontWeight: "700" }}>
            {getScoreDescription(overallScore)}
          </Text>
          <Text style={{ color: Colors.gray400, fontSize: 12, marginTop: 3 }}>
            {financialHealthScore.category}
          </Text>
        </View>

        <Sep marginV={16} />

        {/* Factor breakdown */}
        <SectionHeader title="Detail Skor" />
        {Object.entries(factors).map(([key, factor]) => (
          <View key={key} style={tw`mb-5`}>
            <View style={tw`flex-row justify-between items-center mb-1.5`}>
              <Text style={{ color: TEXT_SECONDARY, fontSize: 12, fontWeight: "500" }}>
                {key === "savingsRate"     && "Rasio Tabungan"}
                {key === "budgetAdherence" && "Kepatuhan Anggaran"}
                {key === "expenseControl"  && "Kontrol Pengeluaran"}
                {key === "goalProgress"    && "Progress Target Tabungan"}
              </Text>
              <Text style={{ color: getScoreColor(factor.score), fontSize: 12, fontWeight: "600" }}>
                {factor.score}/100
              </Text>
            </View>
            <ThinBar progress={Math.max(0, Math.min(factor.score / 100, 1))} color={getScoreColor(factor.score)} />
            <View style={tw`flex-row justify-between mt-1`}>
              <Text style={{ color: Colors.gray400, fontSize: 10 }}>
                Bobot: {(factor.weight * 100).toFixed(0)}%
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  color:
                    factor.status === "good"    ? SUCCESS_COLOR :
                    factor.status === "warning" ? WARNING_COLOR : ERROR_COLOR,
                }}
              >
                {factor.status === "good"    ? "✓ Baik" :
                 factor.status === "warning" ? "⚠ Perlu perbaikan" : "✗ Perlu perhatian"}
              </Text>
            </View>
          </View>
        ))}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <>
            <Sep marginV={16} />
            <SectionHeader title="Rekomendasi Perbaikan" />
            {recommendations.map((rec, index) => (
              <View key={index} style={tw`flex-row items-start mb-3`}>
                <View
                  style={[
                    tw`w-5 h-5 rounded-full items-center justify-center mr-3 mt-0.5`,
                    { backgroundColor: `${SUCCESS_COLOR}20`, flexShrink: 0 },
                  ]}
                >
                  <Ionicons name="checkmark" size={10} color={SUCCESS_COLOR} />
                </View>
                <Text style={{ color: TEXT_SECONDARY, fontSize: 12, flex: 1, lineHeight: 18 }}>
                  {rec}
                </Text>
              </View>
            ))}
          </>
        )}

        <Sep marginV={16} />

        {/* Score legend */}
        <SectionHeader title="Keterangan Skor" />
        <View style={tw`flex-row flex-wrap gap-2`}>
          {[
            { range: "0",      label: "Belum Ada Data",  color: Colors.gray500 },
            { range: "80-100", label: "Sangat Sehat",    color: SUCCESS_COLOR },
            { range: "60-79",  label: "Sehat",           color: Colors.info },
            { range: "40-59",  label: "Cukup",           color: WARNING_COLOR },
            { range: "20-39",  label: "Perlu Perbaikan", color: ERROR_COLOR },
            { range: "1-19",   label: "Kritis",          color: Colors.errorDark },
          ].map((item) => (
            <View
              key={item.range}
              style={[tw`flex-row items-center px-2.5 py-1.5 rounded-lg`, { backgroundColor: SURFACE_COLOR }]}
            >
              <View style={[tw`w-2 h-2 rounded-full mr-2`, { backgroundColor: item.color }]} />
              <Text style={{ color: TEXT_SECONDARY, fontSize: 11 }}>
                {item.range}: {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <View style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>

      {/* ── Tab navigation (top bar) ────────────────────────────────────── */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: SURFACE_COLOR, backgroundColor: BACKGROUND_COLOR }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
        >
          {[
            { key: "health",     label: "Kesehatan", icon: "heart-outline"      as SafeIconName },
            { key: "summary",    label: "Ringkasan", icon: "stats-chart-outline" as SafeIconName },
            { key: "trends",     label: "Tren",      icon: "trending-up-outline" as SafeIconName },
            { key: "categories", label: "Kategori",  icon: "pricetags-outline"   as SafeIconName },
            { key: "insights",   label: "Tips",      icon: "bulb-outline"        as SafeIconName },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  tw`flex-row items-center px-3 py-1.5 rounded-full`,
                  isActive
                    ? { backgroundColor: `${ACCENT_COLOR}20` }
                    : { backgroundColor: SURFACE_COLOR },
                ]}
                onPress={() => setActiveTab(tab.key as any)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon}
                  size={14}
                  color={isActive ? ACCENT_COLOR : Colors.gray400}
                />
                <Text
                  style={{
                    color: isActive ? ACCENT_COLOR : Colors.gray400,
                    fontSize: 12,
                    fontWeight: "500",
                    marginLeft: 5,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Main scrollable content ─────────────────────────────────────── */}
      <ScrollView style={tw`flex-1`} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* Page header */}
        <View style={tw`flex-row justify-between items-center pt-4 pb-2`}>
          <View>
            <Text style={{ color: TEXT_PRIMARY, fontSize: 20, fontWeight: "700" }}>Analitik</Text>
            <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 2 }}>{getCurrentMonth()}</Text>
          </View>
          <TouchableOpacity
            style={[
              tw`w-9 h-9 rounded-full items-center justify-center`,
              { backgroundColor: `${ACCENT_COLOR}18` },
            ]}
            onPress={handleExport}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={17} color={ACCENT_COLOR} />
          </TouchableOpacity>
        </View>

        {/* Time range selector */}
        <View style={tw`flex-row gap-2 mb-2`}>
          {[
            { key: "week",  label: "Minggu" },
            { key: "month", label: "Bulan" },
            { key: "year",  label: "Tahun" },
          ].map((tab) => {
            const isActive = timeRange === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  tw`px-3.5 py-1.5 rounded-full`,
                  isActive ? { backgroundColor: ACCENT_COLOR } : { backgroundColor: SURFACE_COLOR },
                ]}
                onPress={() => setTimeRange(tab.key as any)}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "500",
                    color: isActive ? BACKGROUND_COLOR : Colors.gray400,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Sep marginV={16} />

        {/* ══════════════════════════════════════
            HEALTH TAB
        ══════════════════════════════════════ */}
        {activeTab === "health" && renderHealthScore()}

        {/* ══════════════════════════════════════
            SUMMARY TAB
        ══════════════════════════════════════ */}
        {activeTab === "summary" && (
          <>
            {/* Income / Expense */}
            <View style={tw`flex-row items-center mb-4`}>
              <View style={tw`flex-1`}>
                <Text style={{ color: Colors.gray400, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>
                  Pemasukan
                </Text>
                <Text style={{ color: SUCCESS_COLOR, fontSize: 18, fontWeight: "700" }}>
                  {formatCurrency(transactionAnalytics.totalIncome)}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    marginTop: 1,
                    color: comparativeData.incomeChange >= 0 ? SUCCESS_COLOR : ERROR_COLOR,
                  }}
                >
                  {formatChange(comparativeData.incomeChange)} vs bln lalu
                </Text>
              </View>

              <View style={{ width: 1, height: 40, backgroundColor: SURFACE_COLOR, marginHorizontal: 16 }} />

              <View style={tw`flex-1`}>
                <Text style={{ color: Colors.gray400, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>
                  Pengeluaran
                </Text>
                <Text style={{ color: ERROR_COLOR, fontSize: 18, fontWeight: "700" }}>
                  {formatCurrency(transactionAnalytics.totalExpense)}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    marginTop: 1,
                    color: comparativeData.expenseChange >= 0 ? ERROR_COLOR : SUCCESS_COLOR,
                  }}
                >
                  {formatChange(comparativeData.expenseChange)} vs bln lalu
                </Text>
              </View>
            </View>

            {/* Savings rate */}
            <View style={tw`mb-4`}>
              <View style={tw`flex-row justify-between items-center mb-1.5`}>
                <Text style={{ color: TEXT_SECONDARY, fontSize: 12, fontWeight: "500" }}>Rasio Tabungan</Text>
                <Text style={{ color: ACCENT_COLOR, fontSize: 14, fontWeight: "700" }}>
                  {transactionAnalytics.savingsRate.toFixed(1)}%
                </Text>
              </View>
              <ThinBar
                progress={Math.max(0, Math.min(safeNumber(transactionAnalytics.savingsRate) / 100, 1))}
                color={
                  transactionAnalytics.savingsRate >= 20 ? SUCCESS_COLOR :
                  transactionAnalytics.savingsRate >= 10 ? WARNING_COLOR : ERROR_COLOR
                }
              />
              <View style={tw`flex-row justify-between mt-1`}>
                <Text style={{ color: Colors.gray400, fontSize: 10 }}>0% (Defisit)</Text>
                <Text style={{ color: Colors.gray400, fontSize: 10 }}>20% (Sehat)</Text>
                <Text style={{ color: Colors.gray400, fontSize: 10 }}>100%</Text>
              </View>
            </View>

            {/* Cash flow forecast */}
            {cashFlowForecast.daysRemaining > 0 && (
              <>
                <Sep marginV={16} />
                <SectionHeader title="Proyeksi Akhir Bulan" />
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={{ color: Colors.gray400, fontSize: 12 }}>
                    {cashFlowForecast.daysRemaining} hari lagi · rata-rata {formatCurrency(cashFlowForecast.dailyAvg)}/hari
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color:
                        cashFlowForecast.status === "safe"    ? SUCCESS_COLOR :
                        cashFlowForecast.status === "warning" ? WARNING_COLOR : ERROR_COLOR,
                    }}
                  >
                    {formatCurrency(cashFlowForecast.forecast)}
                  </Text>
                </View>
              </>
            )}

            <Sep marginV={16} />

            {/* Quick stats row */}
            <SectionHeader title="Statistik" />
            <View style={tw`flex-row gap-3 mb-4`}>
              {/* Transaksi */}
              <View style={[tw`flex-1 rounded-xl p-3`, { backgroundColor: SURFACE_COLOR }]}>
                <Text style={{ color: Colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>
                  Transaksi
                </Text>
                <Text style={{ color: TEXT_PRIMARY, fontSize: 16, fontWeight: "700" }}>
                  {transactionAnalytics.transactionCount}
                </Text>
                <Text style={{ color: Colors.gray400, fontSize: 9, marginTop: 1 }}>
                  {transactionAnalytics.incomeTransactionCount} masuk · {transactionAnalytics.expenseTransactionCount} keluar
                </Text>
              </View>

              {/* Anggaran */}
              <View style={[tw`flex-1 rounded-xl p-3`, { backgroundColor: SURFACE_COLOR }]}>
                <Text style={{ color: Colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>
                  Anggaran
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color:
                      budgetAnalytics.overBudgetCount > 0 ? ERROR_COLOR :
                      budgetAnalytics.hasBudgets ? SUCCESS_COLOR : TEXT_PRIMARY,
                  }}
                >
                  {budgetAnalytics.hasBudgets
                    ? budgetAnalytics.overBudgetCount > 0
                      ? `${budgetAnalytics.overBudgetCount} ⚠`
                      : `${budgetAnalytics.underBudgetCount} ✓`
                    : "0"}
                </Text>
                <Text style={{ color: Colors.gray400, fontSize: 9, marginTop: 1 }}>
                  {budgetAnalytics.hasBudgets
                    ? budgetAnalytics.overBudgetCount > 0 ? "Melebihi limit" : "Semua aman"
                    : "Belum ada anggaran"}
                </Text>
              </View>

              {/* Tabungan */}
              <View style={[tw`flex-1 rounded-xl p-3`, { backgroundColor: SURFACE_COLOR }]}>
                <Text style={{ color: Colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>
                  Tabungan
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color:
                      !savingsAnalytics.hasSavings ? TEXT_PRIMARY :
                      savingsAnalytics.overallProgress >= 100 ? SUCCESS_COLOR :
                      savingsAnalytics.overallProgress >= 50  ? WARNING_COLOR : TEXT_PRIMARY,
                  }}
                >
                  {savingsAnalytics.hasSavings
                    ? `${savingsAnalytics.completedSavings}/${savingsAnalytics.activeSavings + savingsAnalytics.completedSavings}`
                    : "0"}
                </Text>
                <Text style={{ color: Colors.gray400, fontSize: 9, marginTop: 1 }}>
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
                <Sep marginV={16} />
                <SectionHeader
                  title="Progress Tabungan"
                  linkLabel="Detail"
                  onPress={() => navigation.navigate("Savings")}
                />

                <View style={tw`mb-4`}>
                  <View style={tw`flex-row justify-between items-center mb-1.5`}>
                    <Text style={{ color: TEXT_SECONDARY, fontSize: 12, fontWeight: "500" }}>Total Tabungan</Text>
                    <Text style={{ color: Colors.gray400, fontSize: 11 }}>
                      {formatCurrency(savingsAnalytics.totalCurrent)} / {formatCurrency(savingsAnalytics.totalTarget)}
                    </Text>
                  </View>
                  <ThinBar
                    progress={Math.max(0, Math.min(safeNumber(savingsAnalytics.overallProgress) / 100, 1))}
                    color={
                      savingsAnalytics.overallProgress >= 100 ? SUCCESS_COLOR :
                      savingsAnalytics.overallProgress >= 75  ? Colors.info :
                      savingsAnalytics.overallProgress >= 50  ? WARNING_COLOR : ACCENT_COLOR
                    }
                  />
                  <Text style={{ color: Colors.gray400, fontSize: 10, marginTop: 2 }}>
                    {savingsAnalytics.overallProgress.toFixed(1)}% tercapai
                  </Text>
                </View>

                {/* Savings status row */}
                <View style={tw`flex-row gap-3 mb-2`}>
                  {[
                    { label: "Selesai", value: savingsAnalytics.completedSavings, color: SUCCESS_COLOR },
                    { label: "Aktif",   value: savingsAnalytics.activeSavings,    color: ACCENT_COLOR },
                    { label: "Hampir",  value: savingsAnalytics.nearingCompletion?.length || 0, color: WARNING_COLOR },
                  ].map((item) => (
                    <View key={item.label} style={[tw`flex-1 rounded-xl p-3 items-center`, { backgroundColor: SURFACE_COLOR }]}>
                      <Text style={{ color: Colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>
                        {item.label}
                      </Text>
                      <Text style={{ color: item.color, fontSize: 18, fontWeight: "700" }}>{item.value}</Text>
                    </View>
                  ))}
                </View>

                {/* Nearing completion */}
                {savingsAnalytics.nearingCompletion && savingsAnalytics.nearingCompletion.length > 0 && (
                  <View style={tw`mt-2`}>
                    <Text style={{ color: Colors.gray400, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
                      Hampir Tercapai
                    </Text>
                    {savingsAnalytics.nearingCompletion.slice(0, 2).map((saving, index) => (
                      <View key={index} style={tw`flex-row justify-between items-center mb-1`}>
                        <Text style={{ color: TEXT_SECONDARY, fontSize: 12 }}>{saving.name}</Text>
                        <Text style={{ color: WARNING_COLOR, fontSize: 12, fontWeight: "600" }}>
                          {((saving.current / saving.target) * 100).toFixed(0)}%
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* Budget progress */}
            {budgetAnalytics.hasBudgets && (
              <>
                <Sep marginV={16} />
                <SectionHeader
                  title="Progress Anggaran"
                  linkLabel="Detail"
                  onPress={() => navigation.navigate("Budget")}
                />
                <View style={tw`mb-1.5`}>
                  <View style={tw`flex-row justify-between items-center mb-1.5`}>
                    <Text style={{ color: TEXT_SECONDARY, fontSize: 12, fontWeight: "500" }}>Total Anggaran</Text>
                    <Text style={{ color: Colors.gray400, fontSize: 11 }}>
                      {formatCurrency(budgetAnalytics.totalSpent)} / {formatCurrency(budgetAnalytics.totalBudget)}
                    </Text>
                  </View>
                  <ThinBar
                    progress={Math.max(0, Math.min(safeNumber(budgetAnalytics.utilizationRate) / 100, 1))}
                    color={
                      budgetAnalytics.utilizationRate <= 80  ? SUCCESS_COLOR :
                      budgetAnalytics.utilizationRate <= 100 ? WARNING_COLOR : ERROR_COLOR
                    }
                  />
                  <Text style={{ color: Colors.gray400, fontSize: 10, marginTop: 2 }}>
                    {budgetAnalytics.utilizationRate.toFixed(1)}% terpakai
                  </Text>
                </View>
              </>
            )}
          </>
        )}

        {/* ══════════════════════════════════════
            TRENDS TAB
        ══════════════════════════════════════ */}
        {activeTab === "trends" && (
          <>
            {/* Spending trend */}
            <SectionHeader title={`Tren ${timeRange}`} />

            {[
              {
                label:   "Pengeluaran",
                change:  comparativeData.expenseChange,
                current: safeNumber(transactionAnalytics.totalExpense),
                max:     safeNumber(transactionAnalytics.totalIncome) * 1.5 || 1,
                color:   ERROR_COLOR,
                upLabel: "Naik", downLabel: "Turun",
                upGood:  false,
              },
              {
                label:   "Pemasukan",
                change:  comparativeData.incomeChange,
                current: safeNumber(transactionAnalytics.totalIncome),
                max:     safeNumber(comparativeData.previous.totalIncome) * 1.3 || 1,
                color:   SUCCESS_COLOR,
                upLabel: "Naik", downLabel: "Turun",
                upGood:  true,
              },
              {
                label:   "Rasio Tabungan",
                change:  comparativeData.savingsRateChange,
                current: safeNumber(transactionAnalytics.savingsRate) / 100,
                max:     1,
                color:   ACCENT_COLOR,
                upLabel: "Membaik", downLabel: "Memburuk",
                upGood:  true,
              },
            ].map((item) => (
              <View key={item.label} style={tw`mb-5`}>
                <View style={tw`flex-row justify-between items-center mb-1.5`}>
                  <Text style={{ color: TEXT_SECONDARY, fontSize: 12, fontWeight: "500" }}>{item.label}</Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: item.change >= 0
                        ? (item.upGood ? SUCCESS_COLOR : ERROR_COLOR)
                        : (item.upGood ? ERROR_COLOR : SUCCESS_COLOR),
                    }}
                  >
                    {item.change >= 0 ? item.upLabel : item.downLabel}{" "}
                    {formatChange(Math.abs(item.change))}
                  </Text>
                </View>
                <ThinBar
                  progress={Math.max(0, Math.min(item.current / (item.max || 1), 1))}
                  color={item.color}
                />
              </View>
            ))}

            {/* Savings rate comparison */}
            <View style={tw`flex-row justify-between mb-1`}>
              <Text style={{ color: Colors.gray400, fontSize: 11 }}>
                Bulan lalu: {safeNumber(comparativeData.previous.savingsRate).toFixed(1)}%
              </Text>
              <Text style={{ color: Colors.gray400, fontSize: 11 }}>
                Sekarang: {safeNumber(transactionAnalytics.savingsRate).toFixed(1)}%
              </Text>
            </View>

            <Sep marginV={16} />

            {/* Daily average */}
            <SectionHeader title="Rata-rata Harian" />
            <View style={tw`flex-row items-center`}>
              <View style={tw`flex-1`}>
                <Text style={{ color: Colors.gray400, fontSize: 10, marginBottom: 2 }}>Pengeluaran/hari</Text>
                <Text style={{ color: ERROR_COLOR, fontSize: 16, fontWeight: "700" }}>
                  {formatCurrency(transactionAnalytics.avgDailyExpense)}
                </Text>
              </View>
              <View style={{ width: 1, height: 32, backgroundColor: SURFACE_COLOR, marginHorizontal: 16 }} />
              <View style={tw`flex-1`}>
                <Text style={{ color: Colors.gray400, fontSize: 10, marginBottom: 2 }}>vs Rata-rata*</Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: transactionAnalytics.avgDailyExpense > 100000 ? ERROR_COLOR : SUCCESS_COLOR,
                  }}
                >
                  {transactionAnalytics.avgDailyExpense > 100000 ? "↑ Tinggi" : "↓ Rendah"}
                </Text>
              </View>
            </View>
            <Text style={{ color: Colors.gray400, fontSize: 10, marginTop: 8 }}>
              *Berdasarkan data pengguna di kota besar
            </Text>
          </>
        )}

        {/* ══════════════════════════════════════
            CATEGORIES TAB
        ══════════════════════════════════════ */}
        {activeTab === "categories" && (
          <>
            <SectionHeader title="Analisis Kategori" />

            {transactionAnalytics.topCategories.length > 0 ? (
              <>
                {categoryBenchmarks.slice(0, 5).map(renderBenchmarkItem)}

                {/* Top spending alert */}
                {transactionAnalytics.topCategories[0] &&
                  safeNumber(transactionAnalytics.topCategories[0][1]) >
                    safeNumber(transactionAnalytics.totalExpense) * 0.4 && (
                  <>
                    <Sep marginV={16} />
                    <View style={tw`flex-row items-start`}>
                      <View
                        style={[
                          tw`w-5 h-5 rounded-full items-center justify-center mr-3 mt-0.5`,
                          { backgroundColor: `${ERROR_COLOR}20`, flexShrink: 0 },
                        ]}
                      >
                        <Ionicons name="warning-outline" size={11} color={ERROR_COLOR} />
                      </View>
                      <View style={tw`flex-1`}>
                        <Text style={{ color: ERROR_COLOR, fontSize: 12, fontWeight: "600", marginBottom: 2 }}>
                          Konsentrasi Pengeluaran Tinggi
                        </Text>
                        <Text style={{ color: Colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
                          {transactionAnalytics.topCategories[0][0]} menghabiskan{" "}
                          {getSafePercentage(
                            transactionAnalytics.topCategories[0][1],
                            transactionAnalytics.totalExpense
                          ).toFixed(0)}
                          % dari total pengeluaran
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </>
            ) : (
              <View style={tw`items-center py-10`}>
                <View style={[tw`w-14 h-14 rounded-full items-center justify-center mb-3`, { backgroundColor: SURFACE_COLOR }]}>
                  <Ionicons name="pricetags-outline" size={24} color={Colors.gray400} />
                </View>
                <Text style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: "600", marginBottom: 4 }}>
                  Belum ada data kategori
                </Text>
                <Text style={{ color: Colors.gray400, fontSize: 12, textAlign: "center" }}>
                  Mulai catat transaksi untuk melihat analisis kategori
                </Text>
              </View>
            )}
          </>
        )}

        {/* ══════════════════════════════════════
            INSIGHTS TAB
        ══════════════════════════════════════ */}
        {activeTab === "insights" && (
          <>
            {/* Financial insights */}
            {insights.length > 0 && (
              <>
                <SectionHeader title="Insights Keuangan" />
                {insights.map((insight, index) => {
                  const insightColor =
                    insight.type === "success" ? SUCCESS_COLOR :
                    insight.type === "warning" ? ERROR_COLOR : Colors.info;
                  return (
                    <View
                      key={index}
                      style={[
                        tw`flex-row items-start mb-3 p-3 rounded-xl`,
                        { backgroundColor: `${insightColor}10` },
                      ]}
                    >
                      <View
                        style={[
                          tw`w-7 h-7 rounded-lg items-center justify-center mr-3`,
                          { backgroundColor: `${insightColor}20`, flexShrink: 0 },
                        ]}
                      >
                        <Ionicons name={getSafeIcon(insight.icon)} size={14} color={insightColor} />
                      </View>
                      <View style={tw`flex-1`}>
                        <Text style={{ color: insightColor, fontSize: 12, fontWeight: "600", marginBottom: 2 }}>
                          {insight.title}
                        </Text>
                        <Text style={{ color: TEXT_SECONDARY, fontSize: 12, lineHeight: 18 }}>
                          {insight.message}
                        </Text>
                      </View>
                    </View>
                  );
                })}
                <Sep marginV={16} />
              </>
            )}

            {/* Daily tips */}
            <SectionHeader title="Tips Harian" />
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
            ].map((tip) => (
              <View key={tip.num} style={tw`flex-row items-start mb-4`}>
                <View
                  style={[
                    tw`w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5`,
                    { backgroundColor: `${tip.color}20`, flexShrink: 0 },
                  ]}
                >
                  <Text style={{ color: tip.color, fontSize: 10, fontWeight: "700" }}>{tip.num}</Text>
                </View>
                <View style={tw`flex-1`}>
                  <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "500", marginBottom: 2 }}>
                    {tip.title}
                  </Text>
                  <Text style={{ color: TEXT_SECONDARY, fontSize: 12, lineHeight: 18 }}>{tip.desc}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <Sep marginV={16} />

        {/* ── Quick actions (semua tab) ──────────────────────────────────── */}
        <SectionHeader title="Aksi Cepat" />
        <View style={tw`flex-row gap-3`}>
          {[
            { label: "Transaksi Baru",    icon: "add-circle-outline" as SafeIconName, color: ACCENT_COLOR,   nav: "AddTransaction" },
            { label: "Cek Anggaran",      icon: "pie-chart-outline"  as SafeIconName, color: Colors.purple, nav: "Budget" },
            { label: "Progress Tabungan", icon: "wallet-outline"     as SafeIconName, color: Colors.pink,   nav: "Savings" },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[tw`flex-1 items-center py-4 rounded-xl`, { backgroundColor: SURFACE_COLOR }]}
              onPress={() => navigation.navigate(item.nav as any)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  tw`w-9 h-9 rounded-xl items-center justify-center mb-2`,
                  { backgroundColor: `${item.color}18` },
                ]}
              >
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={{ color: TEXT_PRIMARY, fontSize: 10, fontWeight: "500", textAlign: "center" }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
};

export default AnalyticsScreen;