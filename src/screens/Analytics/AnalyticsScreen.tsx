// File: src/screens/Analytics/AnalyticsScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { useAppContext } from "../../context/AppContext";
import { formatCurrency, getCurrentMonth } from "../../utils/calculations";

const { width } = Dimensions.get("window");

type TimeRange = "week" | "month" | "year";

const AnalyticsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state } = useAppContext();
  const [timeRange, setTimeRange] = useState<TimeRange>("month");

  // Get current month
  const currentMonth = getCurrentMonth();

  // Calculate monthly statistics
  const monthlyStats = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const monthlyTransactions = state.transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return (
        transactionDate.getFullYear() === currentYear &&
        transactionDate.getMonth() === currentMonth
      );
    });

    const income = monthlyTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = monthlyTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const savings = income - expense;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    return { income, expense, savings, savingsRate, monthlyTransactions };
  }, [state.transactions]);

  // Calculate category spending
  const categorySpending = useMemo(() => {
    const categories: Record<string, number> = {};

    monthlyStats.monthlyTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });

    return Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [monthlyStats.monthlyTransactions]);

  // Calculate biggest transaction
  const biggestTransaction = useMemo(() => {
    if (state.transactions.length === 0) return null;

    return state.transactions.reduce((prev, current) =>
      current.amount > prev.amount ? current : prev
    );
  }, [state.transactions]);

  // Time range buttons
  const timeRangeButtons: Array<{ label: string; value: TimeRange }> = [
    { label: "Minggu", value: "week" },
    { label: "Bulan", value: "month" },
    { label: "Tahun", value: "year" },
  ];

  // Get progress color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return "#10B981"; // Green
    if (percentage < 70) return "#F59E0B"; // Orange
    return "#EF4444"; // Red
  };

  // Category colors
  const categoryColors = [
    "#4F46E5",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#F97316",
    "#8B5CF6",
    "#06B6D4",
    "#84CC16",
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Analitik</Text>
            <Text style={styles.subtitle}>{currentMonth}</Text>
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => console.log("Filter pressed")}
          >
            <Ionicons name="options-outline" size={22} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {timeRangeButtons.map((button) => (
            <TouchableOpacity
              key={button.value}
              style={[
                styles.timeRangeButton,
                timeRange === button.value && styles.timeRangeButtonActive,
              ]}
              onPress={() => setTimeRange(button.value)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === button.value && styles.timeRangeTextActive,
                ]}
              >
                {button.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: "rgba(16, 185, 129, 0.1)" },
              ]}
            >
              <Ionicons name="arrow-down" size={20} color="#10B981" />
            </View>
            <Text style={styles.statLabel}>Pemasukan</Text>
            <Text style={[styles.statValue, { color: "#10B981" }]}>
              {formatCurrency(monthlyStats.income)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: "rgba(239, 68, 68, 0.1)" },
              ]}
            >
              <Ionicons name="arrow-up" size={20} color="#EF4444" />
            </View>
            <Text style={styles.statLabel}>Pengeluaran</Text>
            <Text style={[styles.statValue, { color: "#EF4444" }]}>
              {formatCurrency(monthlyStats.expense)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: "rgba(79, 70, 229, 0.1)" },
              ]}
            >
              <Ionicons name="trending-up" size={20} color="#4F46E5" />
            </View>
            <Text style={styles.statLabel}>Tabungan</Text>
            <Text style={[styles.statValue, { color: "#4F46E5" }]}>
              {formatCurrency(monthlyStats.savings)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: "rgba(245, 158, 11, 0.1)" },
              ]}
            >
              <Ionicons name="pie-chart-outline" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statLabel}>Rasio</Text>
            <Text style={[styles.statValue, { color: "#F59E0B" }]}>
              {monthlyStats.savingsRate.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Savings Progress */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Progress Tabungan</Text>
            <Text style={styles.sectionSubtitle}>Bulan Ini</Text>
          </View>

          <View style={styles.savingsCard}>
            <View style={styles.savingsInfo}>
              <Text style={styles.savingsAmount}>
                {formatCurrency(monthlyStats.savings)}
              </Text>
              <Text style={styles.savingsLabel}>
                Dari {formatCurrency(monthlyStats.income)}
              </Text>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(monthlyStats.savingsRate, 100)}%`,
                      backgroundColor: getProgressColor(
                        monthlyStats.savingsRate
                      ),
                    },
                  ]}
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>0%</Text>
                <Text style={styles.progressLabel}>100%</Text>
              </View>
            </View>

            <View style={styles.savingsFooter}>
              <View style={styles.savingsTarget}>
                <Ionicons name="flag-outline" size={16} color="#6B7280" />
                <Text style={styles.targetText}>
                  Target: {monthlyStats.savingsRate >= 20 ? "✅" : "20%"}
                </Text>
              </View>
              <Text style={styles.savingsPercentage}>
                {monthlyStats.savingsRate.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Top Categories */}
        {categorySpending.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pengeluaran per Kategori</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Transactions")}
              >
                <Text style={styles.seeAll}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.categoriesList}>
              {categorySpending.map(([category, amount], index) => {
                const percentage = (amount / monthlyStats.expense) * 100;
                return (
                  <View key={category} style={styles.categoryItem}>
                    <View style={styles.categoryInfo}>
                      <View
                        style={[
                          styles.categoryDot,
                          {
                            backgroundColor:
                              categoryColors[index % categoryColors.length],
                          },
                        ]}
                      />
                      <Text style={styles.categoryName}>{category}</Text>
                    </View>

                    <View style={styles.categoryRight}>
                      <Text style={styles.categoryAmount}>
                        {formatCurrency(amount)}
                      </Text>
                      <Text style={styles.categoryPercentage}>
                        {percentage.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Budget Overview */}
        {state.budgets.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Status Anggaran</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Budget")}>
                <Text style={styles.seeAll}>Kelola</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.budgetsList}>
              {state.budgets.slice(0, 3).map((budget) => {
                const progress = (budget.spent / budget.limit) * 100;
                const exceeded = budget.spent > budget.limit;
                return (
                  <View key={budget.id} style={styles.budgetItem}>
                    <View style={styles.budgetHeader}>
                      <Text style={styles.budgetCategory}>
                        {budget.category}
                      </Text>
                      <Text
                        style={[
                          styles.budgetAmount,
                          exceeded && styles.budgetAmountExceeded,
                        ]}
                      >
                        {formatCurrency(budget.spent)} /{" "}
                        {formatCurrency(budget.limit)}
                      </Text>
                    </View>

                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor: exceeded
                              ? "#EF4444"
                              : getProgressColor(progress),
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.budgetFooter}>
                      <Text style={styles.budgetPeriod}>
                        {budget.period === "monthly" ? "Bulanan" : "Mingguan"}
                      </Text>
                      <Text
                        style={[
                          styles.budgetPercentage,
                          exceeded && styles.budgetPercentageExceeded,
                        ]}
                      >
                        {Math.round(progress)}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Biggest Transaction */}
        {biggestTransaction && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Transaksi Terbesar</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Transactions")}
              >
                <Text style={styles.seeAll}>Lihat Detail</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bigTransactionCard}>
              <View style={styles.transactionIcon}>
                <Ionicons
                  name={
                    biggestTransaction.type === "income"
                      ? "arrow-down"
                      : "arrow-up"
                  }
                  size={24}
                  color={
                    biggestTransaction.type === "income" ? "#10B981" : "#EF4444"
                  }
                />
              </View>

              <View style={styles.transactionInfo}>
                <Text style={styles.transactionCategory}>
                  {biggestTransaction.category}
                </Text>
                <Text style={styles.transactionDescription}>
                  {biggestTransaction.description || "Tidak ada deskripsi"}
                </Text>
                <Text style={styles.transactionDate}>
                  {new Date(biggestTransaction.date).toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </Text>
              </View>

              <Text
                style={[
                  styles.transactionAmount,
                  biggestTransaction.type === "income"
                    ? styles.incomeAmount
                    : styles.expenseAmount,
                ]}
              >
                {biggestTransaction.type === "income" ? "+" : "-"}
                {formatCurrency(biggestTransaction.amount)}
              </Text>
            </View>
          </View>
        )}

        {/* Insights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Insights</Text>
          </View>

          <View style={styles.insightsCard}>
            {monthlyStats.savingsRate >= 20 ? (
              <View style={styles.insightItem}>
                <View
                  style={[
                    styles.insightIcon,
                    { backgroundColor: "rgba(16, 185, 129, 0.1)" },
                  ]}
                >
                  <Ionicons name="trophy" size={20} color="#10B981" />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Tabungan Optimal</Text>
                  <Text style={styles.insightText}>
                    Anda menabung {monthlyStats.savingsRate.toFixed(1)}% dari
                    pemasukan, melebihi target sehat 20%!
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.insightItem}>
                <View
                  style={[
                    styles.insightIcon,
                    { backgroundColor: "rgba(245, 158, 11, 0.1)" },
                  ]}
                >
                  <Ionicons name="trending-up" size={20} color="#F59E0B" />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Potensi Tabungan</Text>
                  <Text style={styles.insightText}>
                    Targetkan rasio tabungan 20% (
                    {formatCurrency(monthlyStats.income * 0.2)}) untuk kesehatan
                    finansial yang optimal.
                  </Text>
                </View>
              </View>
            )}

            {monthlyStats.expense > monthlyStats.income * 0.7 && (
              <View style={styles.insightItem}>
                <View
                  style={[
                    styles.insightIcon,
                    { backgroundColor: "rgba(239, 68, 68, 0.1)" },
                  ]}
                >
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Pengeluaran Tinggi</Text>
                  <Text style={styles.insightText}>
                    Pengeluaran mencapai{" "}
                    {(
                      (monthlyStats.expense / monthlyStats.income) *
                      100
                    ).toFixed(1)}
                    % dari pemasukan. Pertimbangkan untuk meninjau pengeluaran
                    rutin.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  filterButton: {
    padding: 8,
  },
  timeRangeContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  timeRangeButtonActive: {
    backgroundColor: "#4F46E5",
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  timeRangeTextActive: {
    color: "#FFFFFF",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  seeAll: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "500",
  },
  savingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  savingsInfo: {
    marginBottom: 16,
  },
  savingsAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  savingsLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  savingsFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  savingsTarget: {
    flexDirection: "row",
    alignItems: "center",
  },
  targetText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 6,
  },
  savingsPercentage: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4F46E5",
  },
  categoriesList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    flex: 1,
  },
  categoryRight: {
    alignItems: "flex-end",
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  categoryPercentage: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  budgetsList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  budgetItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  budgetCategory: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  budgetAmount: {
    fontSize: 14,
    color: "#6B7280",
  },
  budgetAmountExceeded: {
    color: "#EF4444",
    fontWeight: "600",
  },
  budgetFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  budgetPeriod: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  budgetPercentage: {
    fontSize: 12,
    color: "#6B7280",
  },
  budgetPercentageExceeded: {
    color: "#EF4444",
    fontWeight: "600",
  },
  bigTransactionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  transactionInfo: {
    marginBottom: 16,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  transactionDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  transactionAmount: {
    fontSize: 20,
    fontWeight: "700",
  },
  incomeAmount: {
    color: "#10B981",
  },
  expenseAmount: {
    color: "#EF4444",
  },
  insightsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  insightItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
});

export default AnalyticsScreen;
