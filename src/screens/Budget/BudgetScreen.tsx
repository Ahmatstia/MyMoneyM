import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { useAppContext } from "../../context/AppContext";
import BudgetCard from "../../components/budget/BudgetCard";
import BudgetStats from "../../components/budget/BudgetStats";
import BudgetFilter from "../../components/budget/BudgetFilter";
import { Budget } from "../../types";

const BudgetScreen: React.FC = () => {
  const navigation = useNavigation();
  const { state, deleteBudget } = useAppContext();

  const [filter, setFilter] = useState<"all" | "over" | "warning" | "safe">(
    "all"
  );

  // Calculate statistics
  const { stats, counts } = useMemo(() => {
    const totalLimit = state.budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = state.budgets.reduce((sum, b) => sum + b.spent, 0);
    const overBudgets = state.budgets.filter((b) => b.spent > b.limit).length;
    const warningBudgets = state.budgets.filter((b) => {
      const progress = (b.spent / b.limit) * 100;
      return progress >= 80 && progress <= 100;
    }).length;

    return {
      stats: {
        totalLimit,
        totalSpent,
        totalRemaining: totalLimit - totalSpent,
        safeBudgets: state.budgets.length - overBudgets - warningBudgets,
        warningBudgets,
        overBudgets,
      },
      counts: {
        all: state.budgets.length,
        safe: state.budgets.length - overBudgets - warningBudgets,
        warning: warningBudgets,
        over: overBudgets,
      },
    };
  }, [state.budgets]);

  // Filter budgets
  const filteredBudgets = useMemo(() => {
    switch (filter) {
      case "over":
        return state.budgets.filter((b) => b.spent > b.limit);
      case "warning":
        return state.budgets.filter((b) => {
          const progress = (b.spent / b.limit) * 100;
          return progress >= 80 && progress <= 100;
        });
      case "safe":
        return state.budgets.filter((b) => {
          const progress = (b.spent / b.limit) * 100;
          return progress < 80;
        });
      default:
        return state.budgets;
    }
  }, [state.budgets, filter]);

  const handleEdit = (budget: Budget) => {
    navigation.navigate("AddBudget", {
      editMode: true,
      budgetData: budget,
    });
  };

  const handleDelete = (budget: Budget) => {
    Alert.alert("Hapus Anggaran", `Hapus anggaran "${budget.category}"?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: () => deleteBudget(budget.id),
      },
    ]);
  };

  const handleReset = (budget: Budget) => {
    Alert.alert("Reset Anggaran", `Reset anggaran "${budget.category}"?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Reset",
        onPress: () => {
          // Implement reset logic here
          console.log("Reset budget:", budget.id);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Anggaran</Text>
          <Text style={styles.subtitle}>
            {state.budgets.length} anggaran aktif
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("AddBudget" as never)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Statistics */}
      <BudgetStats {...stats} />

      {/* Filter */}
      <BudgetFilter
        filter={filter}
        onFilterChange={setFilter}
        counts={counts}
      />

      {/* Budget List */}
      <ScrollView style={styles.list}>
        {filteredBudgets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="pie-chart-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>
              {filter === "all" ? "Belum ada anggaran" : "Tidak ada anggaran"}
            </Text>
            <Text style={styles.emptyText}>
              {filter === "all"
                ? "Mulai dengan membuat anggaran pertama Anda"
                : `Tidak ada anggaran dengan status "${filter}"`}
            </Text>
          </View>
        ) : (
          filteredBudgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReset={handleReset}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  list: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default BudgetScreen;
