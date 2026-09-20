// File: src/screens/Analytics/components/MonthlyReportModal.tsx
import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { format, isSameMonth, subMonths, addMonths } from "date-fns";
import { id } from "date-fns/locale";
import tw from "twrnc";

import { useTheme } from "../../../theme/ThemeContext";
import { useAppContext } from "../../../context/AppContext";
import { formatCurrency, safeNumber } from "../../../utils/calculations";
import {
  exportMonthlyReportPdf,
  MonthlyReportData,
} from "../../../utils/reportPdfGenerator";

interface MonthlyReportModalProps {
  visible: boolean;
  onClose: () => void;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors } = useTheme();
  const { state } = useAppContext();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isExporting, setIsExporting] = useState(false);

  const prevMonth = () => setSelectedMonth((d) => subMonths(d, 1));
  const nextMonth = () => setSelectedMonth((d) => addMonths(d, 1));

  // ── Monthly Calculations ──────────────────────────────────────────────────
  const reportData: MonthlyReportData = useMemo(() => {
    const monthTransactions = state.transactions.filter((t) =>
      isSameMonth(new Date(t.date), selectedMonth),
    );

    const totalIncome = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (safeNumber(t.amount) || 0), 0);

    const totalExpense = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (safeNumber(t.amount) || 0), 0);

    const netSavings = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0 ? Math.max(0, (netSavings / totalIncome) * 100) : 0;

    // Categories breakdown
    const catMap: Record<string, number> = {};
    monthTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const cat = t.category || "Lainnya";
        catMap[cat] = (catMap[cat] || 0) + (safeNumber(t.amount) || 0);
      });

    const topCategories = Object.entries(catMap)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Peak day
    const dayMap: Record<string, number> = {};
    monthTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        dayMap[t.date] = (dayMap[t.date] || 0) + (safeNumber(t.amount) || 0);
      });

    const sortedDays = Object.entries(dayMap).sort((a, b) => b[1] - a[1]);
    const peakDay =
      sortedDays.length > 0 ? { date: sortedDays[0][0], amount: sortedDays[0][1] } : null;

    // Top transactions
    const topTransactions = [...monthTransactions]
      .sort((a, b) => (safeNumber(b.amount) || 0) - (safeNumber(a.amount) || 0))
      .slice(0, 5)
      .map((t) => ({
        description: t.description || t.category,
        category: t.category,
        amount: safeNumber(t.amount) || 0,
        date: t.date,
        type: t.type,
      }));

    // Health score estimation for month
    let healthScore = 60;
    if (savingsRate >= 20) healthScore += 25;
    else if (savingsRate >= 10) healthScore += 15;
    if (netSavings > 0) healthScore += 15;
    else healthScore -= 20;
    healthScore = Math.max(10, Math.min(100, healthScore));

    let healthCategory = "Cukup Sehat";
    if (healthScore >= 80) healthCategory = "Sangat Prima";
    else if (healthScore >= 65) healthCategory = "Sehat";
    else if (healthScore < 45) healthCategory = "Perlu Perhatian";

    // Insights
    const insights: string[] = [];
    if (totalExpense === 0 && totalIncome === 0) {
      insights.push("Belum ada pencatatan transaksi pada bulan ini.");
    } else {
      if (netSavings >= 0) {
        insights.push(
          `Arus kas surplus ${formatCurrency(netSavings)}. Anda berhasil menyisihkan ${savingsRate.toFixed(1)}% pemasukan.`,
        );
      } else {
        insights.push(
          `Pengeluaran melebihi pemasukan (defisit ${formatCurrency(Math.abs(netSavings))}). Evaluasi pos belanja tidak mendesak.`,
        );
      }

      if (topCategories.length > 0 && topCategories[0].percentage >= 40) {
        insights.push(
          `Pengeluaran terkonsentrasi di kategori "${topCategories[0].category}" (${topCategories[0].percentage.toFixed(0)}% dari total belanja).`,
        );
      }
    }

    const monthName = format(selectedMonth, "MMMM yyyy", { locale: id });
    const generatedDate = format(new Date(), "d MMMM yyyy", { locale: id });

    return {
      monthName,
      userName: state.userProfile?.name || "Pengguna MyMoney",
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      healthScore,
      healthCategory,
      topCategories,
      topTransactions,
      insights,
      peakDay,
      generatedDate,
    };
  }, [state.transactions, state.userProfile?.name, selectedMonth]);

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      await exportMonthlyReportPdf(reportData);
    } catch (error: any) {
      Alert.alert("Gagal Ekspor", error.message || "Terjadi kesalahan saat mengekspor laporan.");
    } finally {
      setIsExporting(false);
    }
  };

  const isSurplus = reportData.netSavings >= 0;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[tw`flex-1`, { backgroundColor: colors.background }]}>
        {/* ── HEADER ───────────────────────────────────────────────────────── */}
        <View
          style={[
            tw`flex-row items-center justify-between px-5 py-3 border-b`,
            { borderColor: `${colors.border}60` },
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            style={[
              tw`w-10 h-10 rounded-full items-center justify-center`,
              { backgroundColor: `${colors.border}40` },
            ]}
          >
            <Ionicons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={tw`items-center`}>
            <Text style={[tw`text-xs font-bold uppercase tracking-wider`, { color: colors.accent }]}>
              Laporan Keuangan
            </Text>
            <Text style={[tw`text-base font-extrabold capitalize`, { color: colors.textPrimary }]}>
              {reportData.monthName}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleExportPdf}
            disabled={isExporting}
            style={[
              tw`px-3 py-2 rounded-xl flex-row items-center gap-1.5`,
              { backgroundColor: `${colors.accent}20` },
            ]}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <>
                <Ionicons name="share-outline" size={16} color={colors.accent} />
                <Text style={[tw`text-xs font-bold`, { color: colors.accent }]}>PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── CONTENT SCROLLVIEW ───────────────────────────────────────────── */}
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`p-5 pb-24`}
          showsVerticalScrollIndicator={false}
        >
          {/* Month Selector Bar */}
          <View
            style={[
              tw`flex-row items-center justify-between p-2 rounded-2xl mb-5`,
              { backgroundColor: colors.surface, borderWidth: 1, borderColor: `${colors.border}60` },
            ]}
          >
            <TouchableOpacity
              onPress={prevMonth}
              style={[tw`w-9 h-9 rounded-xl items-center justify-center`, { backgroundColor: `${colors.border}40` }]}
            >
              <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
            </TouchableOpacity>

            <Text style={[tw`text-sm font-black capitalize`, { color: colors.textPrimary }]}>
              {reportData.monthName}
            </Text>

            <TouchableOpacity
              onPress={nextMonth}
              style={[tw`w-9 h-9 rounded-xl items-center justify-center`, { backgroundColor: `${colors.border}40` }]}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Hero Cashflow Card */}
          <View
            style={[
              tw`p-5 rounded-3xl mb-5 relative overflow-hidden`,
              {
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: `${colors.border}80`,
              },
            ]}
          >
            <LinearGradient
              colors={[`${colors.accent}12`, "transparent"]}
              style={tw`absolute inset-0`}
            />
            <View style={tw`flex-row justify-between items-start mb-4`}>
              <View>
                <Text style={[tw`text-[10px] font-bold uppercase tracking-wider`, { color: colors.textTertiary }]}>
                  Arus Kas Bersih
                </Text>
                <Text
                  style={[
                    tw`text-2xl font-black mt-0.5`,
                    { color: isSurplus ? colors.success : colors.error },
                  ]}
                >
                  {formatCurrency(reportData.netSavings)}
                </Text>
              </View>
              <View
                style={[
                  tw`px-2.5 py-1 rounded-full`,
                  { backgroundColor: isSurplus ? `${colors.success}20` : `${colors.error}20` },
                ]}
              >
                <Text
                  style={[
                    tw`text-[10px] font-extrabold uppercase`,
                    { color: isSurplus ? colors.success : colors.error },
                  ]}
                >
                  {isSurplus ? "Surplus (Hemat)" : "Defisit (Boncos)"}
                </Text>
              </View>
            </View>

            {/* In vs Out mini grid */}
            <View style={tw`flex-row items-center gap-3 pt-3 border-t border-gray-800`}>
              <View style={tw`flex-1`}>
                <Text style={[tw`text-[10px] font-bold uppercase`, { color: colors.textTertiary }]}>
                  Pemasukan
                </Text>
                <Text style={[tw`text-sm font-black`, { color: colors.success }]}>
                  +{formatCurrency(reportData.totalIncome)}
                </Text>
              </View>
              <View style={[tw`w-px h-8`, { backgroundColor: `${colors.border}60` }]} />
              <View style={tw`flex-1`}>
                <Text style={[tw`text-[10px] font-bold uppercase`, { color: colors.textTertiary }]}>
                  Pengeluaran
                </Text>
                <Text style={[tw`text-sm font-black`, { color: colors.error }]}>
                  -{formatCurrency(reportData.totalExpense)}
                </Text>
              </View>
            </View>
          </View>

          {/* Metric Cards: Savings Rate & Peak Day */}
          <View style={tw`flex-row gap-3 mb-5`}>
            {/* Savings Rate */}
            <View
              style={[
                tw`flex-1 p-4 rounded-2xl`,
                { backgroundColor: colors.surface, borderWidth: 1, borderColor: `${colors.border}60` },
              ]}
            >
              <Text style={[tw`text-[10px] font-bold uppercase`, { color: colors.textTertiary }]}>
                Rasio Tabungan
              </Text>
              <Text style={[tw`text-xl font-black mt-1`, { color: colors.accent }]}>
                {reportData.savingsRate.toFixed(1)}%
              </Text>
              <Text style={[tw`text-[9px] mt-1`, { color: colors.textSecondary }]}>
                {reportData.savingsRate >= 20 ? "Target tercapai!" : "Target ideal: ≥ 20%"}
              </Text>
            </View>

            {/* Health Score */}
            <View
              style={[
                tw`flex-1 p-4 rounded-2xl`,
                { backgroundColor: colors.surface, borderWidth: 1, borderColor: `${colors.border}60` },
              ]}
            >
              <Text style={[tw`text-[10px] font-bold uppercase`, { color: colors.textTertiary }]}>
                Skor Keuangan
              </Text>
              <Text style={[tw`text-xl font-black mt-1`, { color: colors.warning }]}>
                {reportData.healthScore}/100
              </Text>
              <Text style={[tw`text-[9px] mt-1`, { color: colors.textSecondary }]}>
                {reportData.healthCategory}
              </Text>
            </View>
          </View>

          {/* Top Spending Categories */}
          <View
            style={[
              tw`p-5 rounded-3xl mb-5`,
              { backgroundColor: colors.surface, borderWidth: 1, borderColor: `${colors.border}60` },
            ]}
          >
            <Text style={[tw`text-xs font-black uppercase tracking-wider mb-3`, { color: colors.textPrimary }]}>
              Distribusi Kategori Pengeluaran
            </Text>

            {reportData.topCategories.length === 0 ? (
              <Text style={[tw`text-xs`, { color: colors.textSecondary }]}>
                Tidak ada data pengeluaran pada bulan ini.
              </Text>
            ) : (
              <View style={tw`gap-3`}>
                {reportData.topCategories.slice(0, 5).map((cat, idx) => (
                  <View key={cat.category}>
                    <View style={tw`flex-row justify-between items-center mb-1`}>
                      <Text style={[tw`text-xs font-bold`, { color: colors.textPrimary }]}>
                        <Text style={{ color: colors.textTertiary }}>#{idx + 1} </Text>
                        {cat.category}
                      </Text>
                      <Text style={[tw`text-xs font-black`, { color: colors.textPrimary }]}>
                        {formatCurrency(cat.amount)}{" "}
                        <Text style={[tw`text-[10px] font-normal`, { color: colors.textTertiary }]}>
                          ({cat.percentage.toFixed(0)}%)
                        </Text>
                      </Text>
                    </View>
                    <View
                      style={[
                        tw`w-full h-2 rounded-full overflow-hidden`,
                        { backgroundColor: `${colors.border}40` },
                      ]}
                    >
                      <View
                        style={[
                          tw`h-full rounded-full`,
                          {
                            width: `${Math.min(100, Math.max(5, cat.percentage))}%`,
                            backgroundColor:
                              idx === 0
                                ? colors.accent
                                : idx === 1
                                  ? colors.warning
                                  : colors.purple || "#8B5CF6",
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Smart Insights Card */}
          {reportData.insights.length > 0 && (
            <View
              style={[
                tw`p-4 rounded-2xl mb-5 flex-row items-start gap-3`,
                { backgroundColor: `${colors.accent}12`, borderWidth: 1, borderColor: `${colors.accent}30` },
              ]}
            >
              <Ionicons name="bulb-outline" size={20} color={colors.accent} style={tw`mt-0.5`} />
              <View style={tw`flex-1 gap-1`}>
                <Text style={[tw`text-xs font-black`, { color: colors.accent }]}>
                  Insight Performa Bulan Ini
                </Text>
                {reportData.insights.map((ins, i) => (
                  <Text key={i} style={[tw`text-[11px] leading-4`, { color: colors.textPrimary }]}>
                    • {ins}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Bottom Export Action Button */}
          <TouchableOpacity
            onPress={handleExportPdf}
            disabled={isExporting}
            style={[
              tw`w-full py-4 rounded-2xl items-center justify-center flex-row gap-2 shadow-lg`,
              { backgroundColor: colors.accent },
            ]}
            activeOpacity={0.85}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
                <Text style={tw`text-white font-black text-sm`}>
                  Bagikan & Simpan PDF Resmi
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default MonthlyReportModal;
