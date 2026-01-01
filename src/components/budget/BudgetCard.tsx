import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Budget } from "../../types";
import { formatCurrency } from "../../utils/calculations";

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
  onReset: (budget: Budget) => void;
}

const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  onEdit,
  onDelete,
  onReset,
}) => {
  const progress = (budget.spent / budget.limit) * 100;
  const remaining = budget.limit - budget.spent;

  const getStatus = () => {
    if (progress > 100) return { color: "#DC2626", label: "Melebihi" };
    if (progress >= 80) return { color: "#F59E0B", label: "Perhatian" };
    return { color: "#10B981", label: "Aman" };
  };

  const status = getStatus();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.category}>{budget.category}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${status.color}20` },
            ]}
          >
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => onEdit(budget)}
            style={styles.iconButton}
          >
            <Ionicons name="pencil" size={20} color="#4F46E5" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(budget)}
            style={styles.iconButton}
          >
            <Ionicons name="trash" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: status.color,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{progress.toFixed(1)}%</Text>
      </View>

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Terpakai</Text>
          <Text style={styles.detailValue}>{formatCurrency(budget.spent)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Limit</Text>
          <Text style={styles.detailValue}>{formatCurrency(budget.limit)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Sisa</Text>
          <Text
            style={[
              styles.detailValue,
              { color: remaining >= 0 ? "#10B981" : "#DC2626" },
            ]}
          >
            {formatCurrency(remaining)}
          </Text>
        </View>
      </View>

      {/* Reset Button */}
      <TouchableOpacity
        style={styles.resetButton}
        onPress={() => onReset(budget)}
      >
        <Ionicons name="refresh" size={16} color="#4F46E5" />
        <Text style={styles.resetText}>Reset Anggaran</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titleSection: {
    flex: 1,
  },
  category: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
    textAlign: "center",
  },
  details: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  detailItem: {
    alignItems: "center",
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    gap: 8,
  },
  resetText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4F46E5",
  },
});

export default BudgetCard;
