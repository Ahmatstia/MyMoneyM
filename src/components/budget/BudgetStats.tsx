import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { formatCurrency } from "../../utils/calculations";

interface BudgetStatsProps {
  totalLimit: number;
  totalSpent: number;
  totalRemaining: number;
  safeBudgets: number;
  warningBudgets: number;
  overBudgets: number;
}

const BudgetStats: React.FC<BudgetStatsProps> = ({
  totalLimit,
  totalSpent,
  totalRemaining,
  safeBudgets,
  warningBudgets,
  overBudgets,
}) => {
  const stats = [
    {
      label: "Total Limit",
      value: formatCurrency(totalLimit),
      color: "#111827",
    },
    {
      label: "Total Terpakai",
      value: formatCurrency(totalSpent),
      color: "#111827",
    },
    {
      label: "Total Sisa",
      value: formatCurrency(totalRemaining),
      color: totalRemaining >= 0 ? "#10B981" : "#DC2626",
    },
  ];

  const statusStats = [
    { label: "Aman", value: safeBudgets, color: "#10B981" },
    { label: "Perhatian", value: warningBudgets, color: "#F59E0B" },
    { label: "Melebihi", value: overBudgets, color: "#DC2626" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ringkasan Anggaran</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsScroll}
        contentContainerStyle={styles.statsContent}
      >
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <Text style={[styles.statValue, { color: stat.color }]}>
              {stat.value}
            </Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.statusContainer}>
        {statusStats.map((stat, index) => (
          <View key={index} style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: stat.color }]} />
            <Text style={styles.statusLabel}>{stat.label}</Text>
            <Text style={styles.statusValue}>{stat.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  statsScroll: {
    marginBottom: 16,
  },
  statsContent: {
    gap: 12,
  },
  statCard: {
    minWidth: 140,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  statusItem: {
    alignItems: "center",
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
});

export default BudgetStats;
