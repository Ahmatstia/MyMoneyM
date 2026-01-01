import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Svg, { Circle } from "react-native-svg";

import { useAppContext } from "../../context/AppContext";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import {
  formatCurrency,
  calculateSavingsProgress,
} from "../../utils/calculations";
import { formatDate } from "../../utils/formatters";
import { RootStackParamList, Savings } from "../../types";

type SavingsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Savings"
>;

const { width } = Dimensions.get("window");

const SavingsScreen: React.FC = () => {
  const navigation = useNavigation<SavingsScreenNavigationProp>();
  const { state, deleteSavings, updateSavings } = useAppContext();

  // State
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSavings, setSelectedSavings] = useState<Savings | null>(null);
  const [amountToAdd, setAmountToAdd] = useState("");
  const [loading, setLoading] = useState(false);

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "#10B981";
    if (progress >= 80) return "#F59E0B";
    return "#4F46E5";
  };

  // Filter savings
  const filteredSavings = useMemo(() => {
    const savings = [...state.savings];

    switch (filter) {
      case "active":
        return savings.filter((s) => s.current < s.target);
      case "completed":
        return savings.filter((s) => s.current >= s.target);
      default:
        return savings;
    }
  }, [state.savings, filter]);

  // Calculate statistics
  const savingsStats = useMemo(() => {
    const totalSavings = state.savings.length;
    const totalTarget = state.savings.reduce((sum, s) => sum + s.target, 0);
    const totalCurrent = state.savings.reduce((sum, s) => sum + s.current, 0);
    const completedSavings = state.savings.filter(
      (s) => s.current >= s.target
    ).length;
    const activeSavings = totalSavings - completedSavings;

    return {
      totalSavings,
      totalTarget,
      totalCurrent,
      completedSavings,
      activeSavings,
      overallProgress: totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0,
      remaining: totalTarget - totalCurrent,
    };
  }, [state.savings]);

  // Calculate days remaining
  const getDaysRemaining = (deadline?: string) => {
    if (!deadline) return null;

    try {
      const deadlineDate = new Date(deadline);
      const today = new Date();
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays > 0 ? diffDays : 0;
    } catch (error) {
      return null;
    }
  };

  const handleDelete = (savings: Savings) => {
    Alert.alert(
      "Hapus Target Tabungan",
      `Apakah Anda yakin ingin menghapus target "${savings.name}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => deleteSavings(savings.id),
        },
      ]
    );
  };

  const handleEdit = (savings: Savings) => {
    setSelectedSavings(savings);
    setShowEditModal(true);
  };

  const handleAddAmount = (savings: Savings) => {
    setSelectedSavings(savings);
    setAmountToAdd("");
    setShowAddModal(true);
  };

  const confirmAddAmount = async () => {
    if (!selectedSavings || !amountToAdd) return;

    const amountNum = parseFloat(amountToAdd);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Error", "Jumlah harus berupa angka positif");
      return;
    }

    setLoading(true);
    try {
      await updateSavings(selectedSavings.id, amountNum);
      setShowAddModal(false);
      setSelectedSavings(null);
      setAmountToAdd("");
    } catch (error) {
      console.error("Error adding to savings:", error);
      Alert.alert("Error", "Gagal menambahkan jumlah");
    } finally {
      setLoading(false);
    }
  };

  const CircularProgress = ({
    progress,
    size = 80,
    strokeWidth = 8,
  }: {
    progress: number;
    size?: number;
    strokeWidth?: number;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            stroke="#E5E7EB"
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <Circle
            stroke={progress >= 100 ? "#10B981" : "#4F46E5"}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFillObject, styles.progressCenter]}>
          <Text style={styles.progressPercentage}>
            {Math.min(progress, 100).toFixed(0)}%
          </Text>
        </View>
      </View>
    );
  };

  const renderSavingsItem = (savings: Savings) => {
    const progress = calculateSavingsProgress(savings);
    const remaining = savings.target - savings.current;
    const isCompleted = savings.current >= savings.target;
    const daysRemaining = getDaysRemaining(savings.deadline);
    const progressColor = getProgressColor(progress);

    // Determine card style
    let cardStyle = styles.savingsCard;
    if (isCompleted) {
      cardStyle = { ...styles.savingsCard, ...styles.completedCard };
    }

    return (
      <View key={savings.id} style={cardStyle}>
        <View style={styles.savingsHeader}>
          <View style={styles.savingsTitle}>
            <Text style={styles.savingsName}>{savings.name}</Text>
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Ionicons name="trophy" size={12} color="#FFFFFF" />
                <Text style={styles.completedBadgeText}>Selesai!</Text>
              </View>
            )}
          </View>

          <View style={styles.savingsActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAddAmount(savings)}
            >
              <Ionicons name="add-circle" size={20} color="#10B981" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEdit(savings)}
            >
              <Ionicons name="pencil" size={18} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(savings)}
            >
              <Ionicons name="trash" size={18} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <CircularProgress progress={progress} />

          <View style={styles.savingsDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Terkumpul</Text>
              <Text
                style={[
                  styles.detailValue,
                  isCompleted && styles.completedText,
                ]}
              >
                {formatCurrency(savings.current)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Target</Text>
              <Text style={styles.detailValue}>
                {formatCurrency(savings.target)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sisa</Text>
              <Text
                style={[
                  styles.detailValue,
                  isCompleted ? styles.completedText : styles.remainingText,
                ]}
              >
                {formatCurrency(remaining)}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.linearProgressContainer}>
          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: progressColor,
                },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>0%</Text>
            <Text style={styles.progressLabel}>100%</Text>
          </View>
        </View>

        {/* Deadline & Quick Actions */}
        <View style={styles.footer}>
          {savings.deadline && (
            <View style={styles.deadlineContainer}>
              <Ionicons name="calendar" size={14} color="#6B7280" />
              <Text style={styles.deadlineText}>
                Target: {formatDate(savings.deadline)}
                {daysRemaining !== null && (
                  <Text style={styles.daysRemaining}>
                    {" "}
                    ({daysRemaining} hari lagi)
                  </Text>
                )}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.addButton, isCompleted && styles.addButtonDisabled]}
            onPress={() => handleAddAmount(savings)}
            disabled={isCompleted}
          >
            <Ionicons
              name="add"
              size={16}
              color={isCompleted ? "#9CA3AF" : "#FFFFFF"}
            />
            <Text
              style={[
                styles.addButtonText,
                isCompleted && styles.addButtonTextDisabled,
              ]}
            >
              Tambah
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Stats Summary */}
      <Card style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>Ringkasan Tabungan</Text>
          <Text style={styles.statsSubtitle}>
            Total: {formatCurrency(savingsStats.totalCurrent)} /{" "}
            {formatCurrency(savingsStats.totalTarget)}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{savingsStats.totalSavings}</Text>
            <Text style={styles.statLabel}>Total Target</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.activeStat]}>
              {savingsStats.activeSavings}
            </Text>
            <Text style={styles.statLabel}>Aktif</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.completedStat]}>
              {savingsStats.completedSavings}
            </Text>
            <Text style={styles.statLabel}>Selesai</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.progressStat]}>
              {savingsStats.overallProgress.toFixed(0)}%
            </Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
        </View>

        <View style={styles.overallProgress}>
          <Text style={styles.overallLabel}>Sisa yang perlu ditabung: </Text>
          <Text style={styles.overallValue}>
            {formatCurrency(savingsStats.remaining)}
          </Text>
        </View>
      </Card>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
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
              filter === "active" && styles.filterChipActive,
            ]}
            onPress={() => setFilter("active")}
          >
            <Ionicons
              name="trending-up"
              size={14}
              color={filter === "active" ? "#FFFFFF" : "#4F46E5"}
            />
            <Text
              style={[
                styles.filterChipText,
                filter === "active" && styles.filterChipTextActive,
              ]}
            >
              Aktif
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              filter === "completed" && styles.filterChipActive,
            ]}
            onPress={() => setFilter("completed")}
          >
            <Ionicons
              name="trophy"
              size={14}
              color={filter === "completed" ? "#FFFFFF" : "#10B981"}
            />
            <Text
              style={[
                styles.filterChipText,
                filter === "completed" && styles.filterChipTextActive,
              ]}
            >
              Selesai
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Savings List */}
      <ScrollView
        style={styles.savingsList}
        contentContainerStyle={styles.listContent}
      >
        {filteredSavings.map(renderSavingsItem)}

        {filteredSavings.length === 0 && (
          <Card style={styles.emptyCard}>
            <Ionicons name="wallet-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>
              {filter === "all"
                ? "Belum ada target tabungan"
                : `Tidak ada tabungan dengan status "${filter}"`}
            </Text>
            <Text style={styles.emptyText}>
              {filter === "all"
                ? "Buat target tabungan pertama Anda untuk membantu mencapai tujuan keuangan"
                : filter === "completed"
                ? "Belum ada tabungan yang selesai. Terus semangat menabung! 💪"
                : "Semua target tabungan sudah tercapai! 🎉"}
            </Text>
            {filter === "all" && (
              <Button
                title="Buat Target Tabungan"
                onPress={() => navigation.navigate("AddSavings" as never)}
                style={styles.emptyButton}
              />
            )}
          </Card>
        )}
      </ScrollView>

      {/* Add Amount Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Tambah ke {selectedSavings?.name}
            </Text>

            <Text style={styles.modalSubtitle}>
              Saat ini: {formatCurrency(selectedSavings?.current || 0)} /{" "}
              {formatCurrency(selectedSavings?.target || 0)}
            </Text>

            <Input
              label="Jumlah yang ditambahkan"
              placeholder="Masukkan jumlah"
              value={amountToAdd}
              onChangeText={setAmountToAdd}
              keyboardType="numeric"
              prefix="Rp"
              autoFocus
            />

            <View style={styles.modalActions}>
              <Button
                title="Batal"
                variant="secondary"
                onPress={() => setShowAddModal(false)}
                style={styles.modalButton}
              />
              <Button
                title="Tambahkan"
                onPress={confirmAddAmount}
                loading={loading}
                style={styles.modalButton}
                disabled={!amountToAdd}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* Edit Savings Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Target Tabungan</Text>

            <Text style={styles.modalText}>
              Fitur edit lengkap akan segera tersedia. Untuk sekarang, Anda
              bisa:
            </Text>

            <View style={styles.editOptions}>
              <TouchableOpacity
                style={styles.editOption}
                onPress={() => {
                  setShowEditModal(false);
                  if (selectedSavings) {
                    navigation.navigate("AddSavings", {
                      editMode: true,
                      savingsData: selectedSavings,
                    });
                  }
                }}
              >
                <Ionicons name="create-outline" size={24} color="#4F46E5" />
                <Text style={styles.editOptionText}>Edit Detail</Text>
                <Text style={styles.editOptionSubtext}>
                  Ubah nama, target, deadline
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editOption}
                onPress={() => {
                  setShowEditModal(false);
                  if (selectedSavings) {
                    handleAddAmount(selectedSavings);
                  }
                }}
              >
                <Ionicons name="add-circle-outline" size={24} color="#10B981" />
                <Text style={styles.editOptionText}>Tambah Saldo</Text>
                <Text style={styles.editOptionSubtext}>
                  Tambahkan jumlah tabungan
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Tutup"
              onPress={() => setShowEditModal(false)}
              variant="secondary"
            />
          </Card>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddSavings" as never)}
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
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  statsSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
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
  activeStat: {
    color: "#4F46E5",
  },
  completedStat: {
    color: "#10B981",
  },
  progressStat: {
    color: "#F59E0B",
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
    color: "#111827",
    marginLeft: 4,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterContent: {
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
  savingsList: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  savingsCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  completedCard: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  savingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  savingsTitle: {
    flex: 1,
  },
  savingsName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 4,
  },
  completedBadgeText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  savingsActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  progressCenter: {
    justifyContent: "center",
    alignItems: "center",
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  savingsDetails: {
    flex: 1,
    marginLeft: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  completedText: {
    color: "#10B981",
  },
  remainingText: {
    color: "#4F46E5",
  },
  linearProgressContainer: {
    marginBottom: 16,
  },
  progressBackground: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
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
    fontSize: 10,
    color: "#9CA3AF",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  deadlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  deadlineText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  daysRemaining: {
    color: "#DC2626",
    fontWeight: "500",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4F46E5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  addButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  addButtonText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
    marginLeft: 4,
  },
  addButtonTextDisabled: {
    color: "#9CA3AF",
  },
  emptyCard: {
    alignItems: "center",
    padding: 32,
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
  modalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
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
  editOptions: {
    marginBottom: 24,
  },
  editOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  editOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginLeft: 12,
  },
  editOptionSubtext: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 12,
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

export default SavingsScreen;
