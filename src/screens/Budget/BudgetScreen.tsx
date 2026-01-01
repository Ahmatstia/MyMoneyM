import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { useAppContext } from "../../context/AppContext";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import {
  formatCurrency,
  calculateBudgetProgress,
} from "../../utils/calculations";
import { Budget } from "../../types";

// Simple navigation type to avoid complex type issues
type NavigationProps = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
  setOptions: (options: any) => void;
};

const BudgetScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const { state, deleteBudget, resetBudget } = useAppContext();

  // Use ref instead of state for swipeable to avoid re-renders
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [resetAmount, setResetAmount] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "over" | "warning" | "safe">(
    "all"
  );

  // Filter budgets based on status
  const filteredBudgets = useMemo(() => {
    const budgets = [...state.budgets];

    switch (filter) {
      case "over":
        return budgets.filter((b) => b.spent > b.limit);
      case "warning":
        return budgets.filter((b) => {
          const progress = (b.spent / b.limit) * 100;
          return progress >= 80 && progress <= 100;
        });
      case "safe":
        return budgets.filter((b) => {
          const progress = (b.spent / b.limit) * 100;
          return progress < 80;
        });
      default:
        return budgets;
    }
  }, [state.budgets, filter]);

  // Calculate budget statistics
  const budgetStats = useMemo(() => {
    const totalBudgets = state.budgets.length;
    const totalLimit = state.budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = state.budgets.reduce((sum, b) => sum + b.spent, 0);
    const overBudgets = state.budgets.filter((b) => b.spent > b.limit).length;
    const warningBudgets = state.budgets.filter((b) => {
      const progress = (b.spent / b.limit) * 100;
      return progress >= 80 && progress <= 100;
    }).length;

    return {
      totalBudgets,
      totalLimit,
      totalSpent,
      overBudgets,
      warningBudgets,
      safeBudgets: totalBudgets - overBudgets - warningBudgets,
      remaining: totalLimit - totalSpent,
      overallProgress: totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0,
    };
  }, [state.budgets]);

  const handleDelete = (budget: Budget) => {
    // Close swipeable if open
    const swipeable = swipeableRefs.current[budget.id];
    if (swipeable) {
      swipeable.close();
    }

    Alert.alert(
      "Hapus Anggaran",
      `Apakah Anda yakin ingin menghapus anggaran "${budget.category}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => deleteBudget(budget.id),
        },
      ]
    );
  };

  const handleEdit = (budget: Budget) => {
    // Close swipeable if open
    const swipeable = swipeableRefs.current[budget.id];
    if (swipeable) {
      swipeable.close();
    }

    navigation.navigate("AddBudget", {
      editMode: true,
      budgetData: budget,
    });
  };

  const handleResetBudget = (budget: Budget) => {
    setSelectedBudgetId(budget.id);
    setResetAmount(budget.limit.toString());
    setShowResetModal(true);

    // Close swipeable if open
    const swipeable = swipeableRefs.current[budget.id];
    if (swipeable) {
      swipeable.close();
    }
  };

  const confirmResetBudget = async () => {
    if (!selectedBudgetId) return;

    const newLimitNum = resetAmount ? parseFloat(resetAmount) : undefined;

    if (newLimitNum !== undefined && (isNaN(newLimitNum) || newLimitNum <= 0)) {
      Alert.alert("Error", "Limit baru harus berupa angka positif");
      return;
    }

    setResetLoading(true);
    try {
      await resetBudget(selectedBudgetId, newLimitNum);
      setShowResetModal(false);
      setSelectedBudgetId(null);
      setResetAmount("");
      Alert.alert("Sukses", "Anggaran berhasil direset");
    } catch (error) {
      console.error("Error resetting budget:", error);
      Alert.alert("Error", "Gagal mereset anggaran");
    } finally {
      setResetLoading(false);
    }
  };

  const getBudgetStatus = (budget: Budget) => {
    const progress = calculateBudgetProgress(budget);

    if (progress > 100) {
      return { color: "#DC2626", label: "Melebihi", icon: "warning" as const };
    }
    if (progress >= 80) {
      return {
        color: "#F59E0B",
        label: "Hampir Habis",
        icon: "alert-circle" as const,
      };
    }
    return {
      color: "#10B981",
      label: "Aman",
      icon: "checkmark-circle" as const,
    };
  };

  const renderRightActions = (budget: Budget) => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={styles.resetAction}
        onPress={() => handleResetBudget(budget)}
      >
        <Ionicons name="refresh" size={20} color="#FFFFFF" />
        <Text style={styles.actionText}>Reset</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.editAction}
        onPress={() => handleEdit(budget)}
      >
        <Ionicons name="pencil" size={20} color="#FFFFFF" />
        <Text style={styles.actionText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLeftActions = (budget: Budget) => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => handleDelete(budget)}
    >
      <Ionicons name="trash" size={20} color="#FFFFFF" />
      <Text style={styles.actionText}>Hapus</Text>
    </TouchableOpacity>
  );

  const renderBudgetItem = (budget: Budget) => {
    const progress = calculateBudgetProgress(budget);
    const remaining = budget.limit - budget.spent;
    const status = getBudgetStatus(budget);
    const isOverBudget = budget.spent > budget.limit;

    // Determine card style based on budget status
    const cardStyle = isOverBudget
      ? [styles.budgetCard, styles.overBudgetCard]
      : styles.budgetCard;

    return (
      <Swipeable
        ref={(ref) => {
          if (ref) {
            swipeableRefs.current[budget.id] = ref;
          }
        }}
        renderRightActions={() => renderRightActions(budget)}
        renderLeftActions={() => renderLeftActions(budget)}
        overshootRight={false}
        overshootLeft={false}
        key={budget.id}
      >
        <View style={cardStyle}>
          <View style={styles.budgetHeader}>
            <View style={styles.budgetTitle}>
              <Text style={styles.budgetCategory}>{budget.category}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${status.color}20` },
                ]}
              >
                <Ionicons name={status.icon} size={12} color={status.color} />
                <Text style={[styles.statusText, { color: status.color }]}>
                  {status.label}
                </Text>
              </View>
            </View>
            <View style={styles.budgetMeta}>
              <Text style={styles.budgetPeriod}>
                {budget.period === "monthly" ? "Bulanan" : "Mingguan"}
              </Text>
              <Text style={styles.progressPercentage}>
                {progress.toFixed(1)}%
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>Rp0</Text>
              <Text style={styles.progressLabel}>
                {formatCurrency(budget.limit)}
              </Text>
            </View>
            <View style={styles.progressBackground}>
              {/* Safe zone (0-80%) */}
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(progress, 80)}%`,
                    backgroundColor: "#10B981",
                  },
                ]}
              />

              {/* Warning zone (80-100%) */}
              {progress > 80 && (
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(progress, 100) - 80}%`,
                      left: "80%",
                      backgroundColor: "#F59E0B",
                    },
                  ]}
                />
              )}

              {/* Over budget zone (>100%) */}
              {progress > 100 && (
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress - 100}%`,
                      left: "100%",
                      backgroundColor: "#DC2626",
                    },
                  ]}
                />
              )}

              {/* Current spent indicator */}
              <View
                style={[
                  styles.spentIndicator,
                  { left: `${Math.min(progress, 100)}%` },
                ]}
              >
                <View style={styles.indicatorDot} />
                <Text style={styles.spentIndicatorText}>
                  {formatCurrency(budget.spent)}
                </Text>
              </View>
            </View>
          </View>

          {/* Budget Details */}
          <View style={styles.budgetDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Terpakai</Text>
              <Text
                style={[
                  styles.detailValue,
                  isOverBudget && styles.overBudgetText,
                ]}
              >
                {formatCurrency(budget.spent)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Limit</Text>
              <Text style={styles.detailValue}>
                {formatCurrency(budget.limit)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Sisa</Text>
              <Text
                style={[
                  styles.detailValue,
                  remaining >= 0 ? styles.positiveText : styles.negativeText,
                ]}
              >
                {formatCurrency(remaining)}
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate("TransactionsTab")}
            >
              <Ionicons name="list" size={16} color="#6B7280" />
              <Text style={styles.quickActionText}>Lihat Transaksi</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => handleEdit(budget)}
            >
              <Ionicons name="settings" size={16} color="#6B7280" />
              <Text style={styles.quickActionText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Stats Summary */}
      <Card style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>Ringkasan Anggaran</Text>
          <TouchableOpacity onPress={() => setFilter("all")}>
            <Text style={styles.resetFilterText}>Reset Filter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{budgetStats.totalBudgets}</Text>
            <Text style={styles.statLabel}>Total Anggaran</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.safeStat]}>
              {budgetStats.safeBudgets}
            </Text>
            <Text style={styles.statLabel}>Aman</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.warningStat]}>
              {budgetStats.warningBudgets}
            </Text>
            <Text style={styles.statLabel}>Perhatian</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.overStat]}>
              {budgetStats.overBudgets}
            </Text>
            <Text style={styles.statLabel}>Melebihi</Text>
          </View>
        </View>

        <View style={styles.overallProgress}>
          <Text style={styles.overallLabel}>Total Penggunaan: </Text>
          <Text
            style={[
              styles.overallValue,
              budgetStats.overallProgress >= 100
                ? styles.negativeText
                : budgetStats.overallProgress >= 80
                ? styles.warningText
                : styles.positiveText,
            ]}
          >
            {budgetStats.overallProgress.toFixed(1)}%
          </Text>
        </View>
      </Card>

      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            filter === "all" && styles.filterChipActive,
          ]}
          onPress={() => setFilter("all")}
        >
          <Text
            style={[
              styles.filterChipText,
              filter === "all" && styles.filterChipTextActive,
            ]}
          >
            Semua
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filter === "safe" && styles.filterChipActive,
          ]}
          onPress={() => setFilter("safe")}
        >
          <Ionicons
            name="checkmark-circle"
            size={14}
            color={filter === "safe" ? "#FFFFFF" : "#10B981"}
          />
          <Text
            style={[
              styles.filterChipText,
              filter === "safe" && styles.filterChipTextActive,
            ]}
          >
            Aman
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filter === "warning" && styles.filterChipActive,
          ]}
          onPress={() => setFilter("warning")}
        >
          <Ionicons
            name="alert-circle"
            size={14}
            color={filter === "warning" ? "#FFFFFF" : "#F59E0B"}
          />
          <Text
            style={[
              styles.filterChipText,
              filter === "warning" && styles.filterChipTextActive,
            ]}
          >
            Perhatian
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filter === "over" && styles.filterChipActive,
          ]}
          onPress={() => setFilter("over")}
        >
          <Ionicons
            name="warning"
            size={14}
            color={filter === "over" ? "#FFFFFF" : "#DC2626"}
          />
          <Text
            style={[
              styles.filterChipText,
              filter === "over" && styles.filterChipTextActive,
            ]}
          >
            Melebihi
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Budget List */}
      <ScrollView
        style={styles.budgetList}
        contentContainerStyle={styles.listContent}
      >
        {filteredBudgets.map(renderBudgetItem)}

        {filteredBudgets.length === 0 && (
          <Card style={styles.emptyCard}>
            <Ionicons name="pie-chart-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>
              {filter === "all"
                ? "Belum ada anggaran"
                : `Tidak ada anggaran dengan status "${filter}"`}
            </Text>
            <Text style={styles.emptyText}>
              {filter === "all"
                ? "Buat anggaran pertama Anda untuk mengelola pengeluaran"
                : "Semua anggaran Anda dalam kondisi baik! 🎉"}
            </Text>
            {filter === "all" && (
              <Button
                title="Buat Anggaran Pertama"
                onPress={() => navigation.navigate("AddBudget")}
                style={styles.emptyButton}
              />
            )}
          </Card>
        )}
      </ScrollView>

      {/* Reset Budget Modal */}
      <Modal
        visible={showResetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Anggaran</Text>
            <Text style={styles.modalText}>
              Atur ulang jumlah yang terpakai untuk periode berikutnya. Limit
              anggaran akan tetap sama kecuali Anda ubah.
            </Text>

            <Input
              label="Limit Baru (opsional)"
              placeholder="Masukkan limit baru"
              value={resetAmount}
              onChangeText={setResetAmount}
              keyboardType="numeric"
              prefix="Rp"
            />

            <View style={styles.modalActions}>
              <Button
                title="Batal"
                variant="secondary"
                onPress={() => setShowResetModal(false)}
                style={styles.modalButton}
              />
              <Button
                title="Reset"
                onPress={confirmResetBudget}
                loading={resetLoading}
                style={styles.modalButton}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddBudget")}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  statsCard: {
    margin: 16,
    marginBottom: 8,
  },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  resetFilterText: {
    fontSize: 12,
    color: "#4F46E5",
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  safeStat: {
    color: "#10B981",
  },
  warningStat: {
    color: "#F59E0B",
  },
  overStat: {
    color: "#DC2626",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  overallProgress: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  overallLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  overallValue: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 4,
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterChipActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  filterChipText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  budgetList: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  budgetCard: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  overBudgetCard: {
    borderColor: "#FEE2E2",
    borderWidth: 2,
    backgroundColor: "#FEF2F2",
  },
  budgetHeader: {
    marginBottom: 16,
  },
  budgetTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  budgetCategory: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "500",
  },
  budgetMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  budgetPeriod: {
    fontSize: 12,
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  progressBackground: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    position: "absolute",
    top: 0,
    borderRadius: 4,
  },
  spentIndicator: {
    position: "absolute",
    top: -4,
    alignItems: "center",
    transform: [{ translateX: -6 }],
  },
  indicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4F46E5",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  spentIndicatorText: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "500",
  },
  budgetDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingTop: 12,
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
  warningText: {
    color: "#F59E0B",
  },
  overBudgetText: {
    color: "#DC2626",
    fontWeight: "700",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  quickActionText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  actionsContainer: {
    flexDirection: "row",
    height: "100%",
  },
  resetAction: {
    backgroundColor: "#F59E0B",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginBottom: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  editAction: {
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginBottom: 12,
    borderRadius: 8,
    marginLeft: 4,
  },
  deleteAction: {
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginBottom: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  emptyCard: {
    alignItems: "center",
    padding: 32,
    marginTop: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
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
  emptyButton: {
    width: "80%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  modalText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
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
});

export default BudgetScreen;
