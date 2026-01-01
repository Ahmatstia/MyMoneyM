import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import {
  Button,
  Text,
  ProgressBar,
  Modal,
  Portal,
  TextInput,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useAppContext } from "../../context/AppContext";
import { formatCurrency } from "../../utils/calculations";
import { Budget } from "../../types";

const BudgetScreen: React.FC = () => {
  const navigation = useNavigation();
  const { state, deleteBudget, resetBudget } = useAppContext();

  const [filter, setFilter] = useState<"all" | "over" | "warning" | "safe">(
    "all"
  );
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [resetAmount, setResetAmount] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Calculate summary
  const summary = useMemo(() => {
    const totalLimit = state.budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = state.budgets.reduce((sum, b) => sum + b.spent, 0);
    const overBudgets = state.budgets.filter((b) => b.spent > b.limit).length;
    const warningBudgets = state.budgets.filter((b) => {
      const progress = (b.spent / b.limit) * 100;
      return progress >= 80 && progress <= 100;
    }).length;

    return {
      totalLimit,
      totalSpent,
      totalRemaining: totalLimit - totalSpent,
      overBudgets,
      warningBudgets,
      safeBudgets: state.budgets.length - overBudgets - warningBudgets,
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

  const getStatusColor = (budget: Budget) => {
    const progress = (budget.spent / budget.limit) * 100;
    if (progress > 100) return "#DC2626";
    if (progress >= 80) return "#F59E0B";
    return "#10B981";
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

  const handleReset = async () => {
    if (!selectedBudget) return;

    const newLimitNum = resetAmount ? parseFloat(resetAmount) : undefined;

    if (newLimitNum !== undefined && (isNaN(newLimitNum) || newLimitNum <= 0)) {
      Alert.alert("Error", "Limit baru harus berupa angka positif");
      return;
    }

    setResetLoading(true);
    try {
      await resetBudget(selectedBudget.id, newLimitNum);
      setShowResetModal(false);
      setSelectedBudget(null);
      setResetAmount("");
      Alert.alert("Sukses", "Anggaran berhasil direset");
    } catch (error) {
      console.error("Error resetting budget:", error);
      Alert.alert("Error", "Gagal mereset anggaran");
    } finally {
      setResetLoading(false);
    }
  };

  const StatusBadge = ({ budget }: { budget: Budget }) => {
    const progress = (budget.spent / budget.limit) * 100;
    const color = getStatusColor(budget);
    const text =
      progress > 100 ? "Melebihi" : progress >= 80 ? "Perhatian" : "Aman";

    return (
      <View style={[styles.statusBadge, { backgroundColor: `${color}15` }]}>
        <Text style={[styles.statusText, { color }]}>{text}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Minimal Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Anggaran</Text>
          <Text style={styles.headerSubtitle}>
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

      {/* Summary Stats - Horizontal Row */}
      <View style={styles.summaryRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {formatCurrency(summary.totalLimit)}
          </Text>
          <Text style={styles.statLabel}>Total Limit</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {formatCurrency(summary.totalSpent)}
          </Text>
          <Text style={styles.statLabel}>Total Terpakai</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statValue,
              { color: summary.totalRemaining >= 0 ? "#10B981" : "#DC2626" },
            ]}
          >
            {formatCurrency(summary.totalRemaining)}
          </Text>
          <Text style={styles.statLabel}>Total Sisa</Text>
        </View>
      </View>

      {/* Filter Tabs - Scrollable Horizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterTab, filter === "all" && styles.filterTabActive]}
          onPress={() => setFilter("all")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "all" && styles.filterTextActive,
            ]}
          >
            Semua ({state.budgets.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === "safe" && styles.filterTabActive,
          ]}
          onPress={() => setFilter("safe")}
        >
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={filter === "safe" ? "#FFFFFF" : "#10B981"}
          />
          <Text
            style={[
              styles.filterText,
              filter === "safe" && styles.filterTextActive,
            ]}
          >
            Aman ({summary.safeBudgets})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === "warning" && styles.filterTabActive,
          ]}
          onPress={() => setFilter("warning")}
        >
          <Ionicons
            name="alert-circle"
            size={16}
            color={filter === "warning" ? "#FFFFFF" : "#F59E0B"}
          />
          <Text
            style={[
              styles.filterText,
              filter === "warning" && styles.filterTextActive,
            ]}
          >
            Perhatian ({summary.warningBudgets})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === "over" && styles.filterTabActive,
          ]}
          onPress={() => setFilter("over")}
        >
          <Ionicons
            name="warning"
            size={16}
            color={filter === "over" ? "#FFFFFF" : "#DC2626"}
          />
          <Text
            style={[
              styles.filterText,
              filter === "over" && styles.filterTextActive,
            ]}
          >
            Melebihi ({summary.overBudgets})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Budget List - Simple Scroll */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredBudgets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="pie-chart-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>
              {filter === "all" ? "Belum ada anggaran" : "Tidak ada anggaran"}
            </Text>
            <Text style={styles.emptyText}>
              {filter === "all"
                ? "Mulai dengan membuat anggaran pertama Anda"
                : `Tidak ada anggaran dengan status "${filter}"`}
            </Text>
            {filter === "all" && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => navigation.navigate("AddBudget" as never)}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>
                  Buat Anggaran Pertama
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredBudgets.map((budget) => {
            const progress = (budget.spent / budget.limit) * 100;
            const remaining = budget.limit - budget.spent;
            const statusColor = getStatusColor(budget);

            return (
              <View key={budget.id} style={styles.budgetCard}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitle}>
                    <Text style={styles.category}>{budget.category}</Text>
                    <StatusBadge budget={budget} />
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => {
                        navigation.navigate("AddBudget", {
                          editMode: true,
                          budgetData: budget,
                        });
                      }}
                    >
                      <Ionicons name="pencil" size={18} color="#4F46E5" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleDelete(budget)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#DC2626"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Period */}
                <View style={styles.periodRow}>
                  <Text style={styles.periodText}>
                    {budget.period === "monthly" ? "Bulanan" : "Mingguan"}
                  </Text>
                  <Text style={styles.progressPercent}>
                    {progress.toFixed(0)}%
                  </Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <ProgressBar
                    progress={Math.min(progress / 100, 1)}
                    color={statusColor}
                    style={styles.progressBar}
                  />
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressLabel}>Rp0</Text>
                    <Text style={styles.progressLabel}>
                      {formatCurrency(budget.limit)}
                    </Text>
                  </View>
                  <View style={styles.spentIndicator}>
                    <Text style={styles.spentIndicatorText}>
                      {formatCurrency(budget.spent)}
                    </Text>
                  </View>
                </View>

                {/* Details */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailColumn}>
                    <Text style={styles.detailLabel}>Terpakai</Text>
                    <Text style={styles.detailValue}>
                      {formatCurrency(budget.spent)}
                    </Text>
                  </View>
                  <View style={styles.detailColumn}>
                    <Text style={styles.detailLabel}>Limit</Text>
                    <Text style={styles.detailValue}>
                      {formatCurrency(budget.limit)}
                    </Text>
                  </View>
                  <View style={styles.detailColumn}>
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
                  onPress={() => {
                    setSelectedBudget(budget);
                    setResetAmount(budget.limit.toString());
                    setShowResetModal(true);
                  }}
                >
                  <Ionicons name="refresh" size={16} color="#4F46E5" />
                  <Text style={styles.resetButtonText}>Reset Anggaran</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Reset Modal - Simple */}
      <Portal>
        <Modal
          visible={showResetModal}
          onDismiss={() => setShowResetModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Anggaran</Text>
            <Text style={styles.modalText}>
              Atur ulang pengeluaran untuk periode berikutnya.
            </Text>

            <TextInput
              label="Limit Baru (opsional)"
              value={resetAmount}
              onChangeText={setResetAmount}
              keyboardType="numeric"
              mode="outlined"
              left={<TextInput.Affix text="Rp" />}
              style={styles.modalInput}
            />

            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowResetModal(false)}
                style={styles.modalButton}
              >
                Batal
              </Button>
              <Button
                mode="contained"
                onPress={handleReset}
                loading={resetLoading}
                style={styles.modalButton}
              >
                Reset
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  // Summary Row
  summaryRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
  },
  // Filter Scroll Container
  filterScrollContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    maxHeight: 52,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  filterTabActive: {
    backgroundColor: "#4F46E5",
  },
  filterText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  // List
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  // Budget Card
  budgetCard: {
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  category: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "500",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  periodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  periodText: {
    fontSize: 12,
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
  },
  progressContainer: {
    marginBottom: 16,
    position: "relative",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  spentIndicator: {
    position: "absolute",
    top: -8,
    alignItems: "center",
    transform: [{ translateX: -25 }],
    left: "50%",
  },
  spentIndicatorText: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "500",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  detailsRow: {
    flexDirection: "row",
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  detailColumn: {
    flex: 1,
    alignItems: "center",
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
  resetButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4F46E5",
  },
  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
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
    marginBottom: 24,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4F46E5",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Modal
  modalContainer: {
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  modalText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});

export default BudgetScreen;
