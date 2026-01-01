// src/components/analytics/CategoryPieChart.tsx
import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { formatCurrency } from "../../utils/calculations";

interface CategoryPieChartProps {
  data: Array<{
    category: string;
    amount: number;
    color: string;
  }>;
}

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  if (total === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Distribusi Pengeluaran</Text>
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>Belum ada data pengeluaran</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Distribusi Pengeluaran</Text>

      <View style={styles.chartContainer}>
        {/* Legend */}
        <View style={styles.legendContainer}>
          {data.map((item, index) => {
            const percentage = ((item.amount / total) * 100).toFixed(1);

            return (
              <View key={index} style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: item.color }]}
                />
                <View style={styles.legendTextContainer}>
                  <Text style={styles.legendCategory} numberOfLines={1}>
                    {item.category}
                  </Text>
                  <Text style={styles.legendAmount}>
                    {formatCurrency(item.amount)} ({percentage}%)
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Simple Pie Representation */}
        <View style={styles.pieContainer}>
          {data.map((item, index, arr) => {
            const percentage = (item.amount / total) * 100;
            const prevPercentage = arr
              .slice(0, index)
              .reduce(
                (sum, prevItem) => sum + (prevItem.amount / total) * 100,
                0
              );

            return (
              <View
                key={index}
                style={[
                  styles.pieSlice,
                  {
                    backgroundColor: item.color,
                    width: percentage < 5 ? 5 : percentage, // Minimum width
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.summary}>
        <Text style={styles.totalLabel}>Total Pengeluaran:</Text>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendContainer: {
    flex: 1,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendCategory: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  legendAmount: {
    fontSize: 11,
    color: "#6B7280",
  },
  pieContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    flexDirection: "row",
    overflow: "hidden",
    marginLeft: 16,
  },
  pieSlice: {
    height: "100%",
  },
  emptyChart: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
  },
  summary: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
});

export default CategoryPieChart;
