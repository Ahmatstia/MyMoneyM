import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { formatCurrency } from "../../utils/calculations";

interface TransactionChartProps {
  data: Array<{
    date: string;
    income: number;
    expense: number;
  }>;
}

const TransactionChart: React.FC<TransactionChartProps> = ({ data }) => {
  const screenWidth = Dimensions.get("window").width;
  const chartHeight = 200;

  // Cari nilai maksimum untuk skala
  const maxValue = Math.max(
    ...data.map((item) => Math.max(item.income, item.expense)),
    1000 // minimum 1000 agar chart tidak flat
  );

  // Format tanggal menjadi pendek
  const formatDateShort = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trend Keuangan 7 Hari Terakhir</Text>

      {/* Container Grafik */}
      <View style={[styles.chartContainer, { width: screenWidth - 32 }]}>
        {/* Grid Lines */}
        <View style={styles.gridContainer}>
          {[0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <View
              key={index}
              style={[styles.gridLine, { top: chartHeight * (1 - ratio) }]}
            >
              <Text style={styles.gridLabel}>
                {formatCurrency(maxValue * ratio)}
              </Text>
            </View>
          ))}
        </View>

        {/* Chart Bars */}
        <View style={styles.barsContainer}>
          {data.map((item, index) => {
            const incomeHeight = (item.income / maxValue) * chartHeight;
            const expenseHeight = (item.expense / maxValue) * chartHeight;

            return (
              <View key={index} style={styles.barGroup}>
                {/* Income Bar */}
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      styles.incomeBar,
                      { height: Math.max(incomeHeight, 2) },
                    ]}
                  />
                  <Text style={styles.barValue}>
                    {item.income > 0 ? formatCurrency(item.income) : ""}
                  </Text>
                </View>

                {/* Expense Bar */}
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      styles.expenseBar,
                      { height: Math.max(expenseHeight, 2) },
                    ]}
                  />
                  <Text style={styles.barValue}>
                    {item.expense > 0 ? formatCurrency(item.expense) : ""}
                  </Text>
                </View>

                {/* Date Label */}
                <Text style={styles.dateLabel}>
                  {formatDateShort(item.date)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.incomeColor]} />
          <Text style={styles.legendText}>Pemasukan</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.expenseColor]} />
          <Text style={styles.legendText}>Pengeluaran</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Pemasukan:</Text>
          <Text style={[styles.summaryValue, styles.incomeText]}>
            {formatCurrency(data.reduce((sum, item) => sum + item.income, 0))}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Pengeluaran:</Text>
          <Text style={[styles.summaryValue, styles.expenseText]}>
            {formatCurrency(data.reduce((sum, item) => sum + item.expense, 0))}
          </Text>
        </View>
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
    height: 250,
    flexDirection: "row",
    position: "relative",
  },
  gridContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 30, // space for labels
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    alignItems: "flex-start",
  },
  gridLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    backgroundColor: "#FFFFFF",
    paddingRight: 4,
  },
  barsContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    marginTop: 20,
    paddingBottom: 30,
  },
  barGroup: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  barWrapper: {
    alignItems: "center",
    marginBottom: 4,
  },
  bar: {
    width: 12,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  incomeBar: {
    backgroundColor: "#10B981",
    marginBottom: 2,
  },
  expenseBar: {
    backgroundColor: "#DC2626",
  },
  barValue: {
    fontSize: 9,
    color: "#6B7280",
    marginTop: 2,
    textAlign: "center",
  },
  dateLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 6,
  },
  incomeColor: {
    backgroundColor: "#10B981",
  },
  expenseColor: {
    backgroundColor: "#DC2626",
  },
  legendText: {
    fontSize: 12,
    color: "#6B7280",
  },
  summary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  incomeText: {
    color: "#10B981",
  },
  expenseText: {
    color: "#DC2626",
  },
});

export default TransactionChart;
