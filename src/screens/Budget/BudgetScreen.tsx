import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { useAppContext } from "../../context/AppContext";
import Card from "../../components/common/Card";
import {
  formatCurrency,
  calculateBudgetProgress,
} from "../../utils/calculations";
import { RootStackParamList, Budget } from "../../types";

type BudgetScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const BudgetScreen: React.FC = () => {
  const navigation = useNavigation<BudgetScreenNavigationProp>();
  const { state } = useAppContext();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Anggaran Bulan Ini</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("AddBudget")}
          >
            <Text style={styles.addButtonText}>+ Tambah</Text>
          </TouchableOpacity>
        </View>

        {/* Budget List */}
        {state.budgets.map((budget: Budget) => {
          const progress = calculateBudgetProgress(budget);
          const remaining = budget.limit - budget.spent;

          return (
            <Card key={budget.id} style={styles.budgetCard}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetCategory}>{budget.category}</Text>
                <Text style={styles.budgetPeriod}>
                  {budget.period === "monthly" ? "Bulanan" : "Mingguan"}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${progress}%`,
                        backgroundColor:
                          progress > 100
                            ? "#DC2626"
                            : progress > 80
                            ? "#F59E0B"
                            : "#10B981",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{progress.toFixed(1)}%</Text>
              </View>

              <View style={styles.budgetDetails}>
                <View>
                  <Text style={styles.detailLabel}>Terpakai</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(budget.spent)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.detailLabel}>Limit</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(budget.limit)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.detailLabel}>Sisa</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      remaining < 0 ? styles.negativeText : styles.positiveText,
                    ]}
                  >
                    {formatCurrency(remaining)}
                  </Text>
                </View>
              </View>
            </Card>
          );
        })}

        {state.budgets.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Belum ada anggaran. Tambah anggaran untuk mengelola pengeluaranmu!
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate("AddBudget")}
            >
              <Text style={styles.emptyButtonText}>
                Tambah Anggaran Pertama
              </Text>
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddBudget")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  addButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  budgetCard: {
    marginBottom: 16,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  budgetCategory: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  budgetPeriod: {
    fontSize: 12,
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBackground: {
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
  progressText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
  },
  budgetDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  positiveText: {
    color: "#10B981",
  },
  negativeText: {
    color: "#DC2626",
  },
  emptyCard: {
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 24,
    fontSize: 16,
  },
  emptyButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "300",
  },
});

export default BudgetScreen;
