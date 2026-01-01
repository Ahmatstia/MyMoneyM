import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { useAppContext } from "../../context/AppContext";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { formatCurrency } from "../../utils/calculations";
import { RootStackParamList, Budget } from "../../types";

type AddBudgetScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddBudget"
>;

type AddBudgetScreenRouteProp = RouteProp<RootStackParamList, "AddBudget">;

const AVAILABLE_CATEGORIES = [
  "Makanan & Minuman",
  "Transportasi",
  "Belanja",
  "Hiburan",
  "Kesehatan",
  "Pendidikan",
  "Tagihan",
  "Lainnya",
];

const AddBudgetScreen: React.FC = () => {
  const navigation = useNavigation<AddBudgetScreenNavigationProp>();
  const route = useRoute<AddBudgetScreenRouteProp>();

  // Gunakan default value untuk menghindari undefined
  const params = route.params || {};
  const isEditMode = params.editMode || false;
  const budgetData = params.budgetData;

  const { addBudget, editBudget, deleteBudget, state } = useAppContext();

  const [category, setCategory] = useState(budgetData?.category || "");
  const [limit, setLimit] = useState(budgetData?.limit.toString() || "");
  const [period, setPeriod] = useState<"monthly" | "weekly">(
    budgetData?.period || "monthly"
  );
  const [loading, setLoading] = useState(false);

  // Cek apakah kategori sudah digunakan (kecuali sedang edit kategori yang sama)
  const isCategoryUsed = state.budgets.some(
    (b) =>
      b.category === category &&
      (!isEditMode || (isEditMode && budgetData?.category !== category))
  );

  // Update title based on mode
  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? "Edit Anggaran" : "Tambah Anggaran",
    });
  }, [isEditMode, navigation]);

  const handleSubmit = async () => {
    if (!category || !limit) {
      Alert.alert("Error", "Mohon isi kategori dan limit anggaran");
      return;
    }

    const limitNum = parseFloat(limit);
    if (isNaN(limitNum) || limitNum <= 0) {
      Alert.alert("Error", "Limit harus berupa angka positif");
      return;
    }

    // Cek apakah kategori sudah digunakan (untuk mode tambah baru)
    if (!isEditMode) {
      const isDuplicate = state.budgets.some((b) => b.category === category);
      if (isDuplicate) {
        Alert.alert(
          "Error",
          `Kategori "${category}" sudah memiliki anggaran. Gunakan kategori lain atau edit anggaran yang sudah ada.`
        );
        return;
      }
    }

    setLoading(true);
    try {
      if (isEditMode && budgetData) {
        // Edit mode
        await editBudget(budgetData.id, {
          category,
          limit: limitNum,
          period,
        });
      } else {
        // Add mode
        await addBudget({
          category,
          limit: limitNum,
          period,
        });
      }

      navigation.goBack();
    } catch (error) {
      console.error("Error saving budget:", error);
      Alert.alert(
        "Error",
        `Gagal ${isEditMode ? "mengedit" : "menambah"} anggaran`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!isEditMode || !budgetData) return;

    Alert.alert(
      "Hapus Anggaran",
      `Apakah Anda yakin ingin menghapus anggaran "${budgetData.category}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBudget(budgetData.id);
              navigation.goBack();
            } catch (error) {
              console.error("Error deleting budget:", error);
              Alert.alert("Error", "Gagal menghapus anggaran");
            }
          },
        },
      ]
    );
  };

  const getProgressColor = (progress: number) => {
    if (progress > 100) return "#DC2626";
    if (progress >= 80) return "#F59E0B";
    return "#10B981";
  };

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Text style={styles.title}>
          {isEditMode ? "Edit Anggaran" : "Tambah Anggaran Baru"}
        </Text>

        {/* Info jika edit mode */}
        {isEditMode && budgetData && (
          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>Informasi Anggaran Saat Ini</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Terpakai:</Text>
              <Text style={styles.infoValue}>
                {formatCurrency(budgetData.spent)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Progress:</Text>
              <Text
                style={[
                  styles.infoValue,
                  {
                    color: getProgressColor(
                      (budgetData.spent / budgetData.limit) * 100
                    ),
                  },
                ]}
              >
                {((budgetData.spent / budgetData.limit) * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sisa:</Text>
              <Text
                style={[
                  styles.infoValue,
                  budgetData.limit - budgetData.spent >= 0
                    ? styles.positiveText
                    : styles.negativeText,
                ]}
              >
                {formatCurrency(budgetData.limit - budgetData.spent)}
              </Text>
            </View>
          </Card>
        )}

        {/* Category Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Kategori</Text>
            {isCategoryUsed && !isEditMode && (
              <Text style={styles.warningTextSmall}>
                Kategori sudah digunakan
              </Text>
            )}
          </View>
          <View style={styles.categoryGrid}>
            {AVAILABLE_CATEGORIES.map((cat) => {
              const isUsed = state.budgets.some(
                (b) =>
                  b.category === cat &&
                  (!isEditMode || (isEditMode && budgetData?.category !== cat))
              );

              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.categoryButtonActive,
                    isUsed && styles.categoryButtonDisabled,
                  ]}
                  onPress={() => {
                    if (!isUsed || isEditMode) {
                      setCategory(cat);
                    }
                  }}
                  disabled={isUsed && !isEditMode}
                >
                  <View style={styles.categoryButtonContent}>
                    <Text
                      style={[
                        styles.categoryText,
                        category === cat && styles.categoryTextActive,
                        isUsed && styles.categoryTextDisabled,
                      ]}
                    >
                      {cat}
                    </Text>
                    {isUsed && !isEditMode && (
                      <Text style={styles.usedBadge}>Terpakai</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Amount Input */}
        <Input
          label="Limit Anggaran"
          placeholder="Masukkan limit anggaran"
          value={limit}
          onChangeText={setLimit}
          keyboardType="numeric"
          returnKeyType="next"
          prefix="Rp"
        />

        {/* Period Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Periode</Text>
          <View style={styles.periodContainer}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                period === "monthly" && styles.periodButtonActive,
              ]}
              onPress={() => setPeriod("monthly")}
            >
              <View style={styles.periodIconContainer}>
                <Ionicons
                  name="calendar"
                  size={20}
                  color={period === "monthly" ? "#4F46E5" : "#6B7280"}
                />
              </View>
              <Text
                style={[
                  styles.periodText,
                  period === "monthly" && styles.periodTextActive,
                ]}
              >
                Bulanan
              </Text>
              <Text style={styles.periodSubtext}>
                Reset otomatis tiap bulan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                period === "weekly" && styles.periodButtonActive,
              ]}
              onPress={() => setPeriod("weekly")}
            >
              <View style={styles.periodIconContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={period === "weekly" ? "#4F46E5" : "#6B7280"}
                />
              </View>
              <Text
                style={[
                  styles.periodText,
                  period === "weekly" && styles.periodTextActive,
                ]}
              >
                Mingguan
              </Text>
              <Text style={styles.periodSubtext}>
                Reset otomatis tiap minggu
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tips */}
        <Card style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips Anggaran yang Efektif</Text>
          <Text style={styles.tipText}>
            • Mulai dari kategori pengeluaran terbesar
          </Text>
          <Text style={styles.tipText}>
            • Sisakan 10-20% untuk pengeluaran tak terduga
          </Text>
          <Text style={styles.tipText}>
            • Review anggaran Anda setiap bulan
          </Text>
          <Text style={styles.tipText}>
            • Gunakan notifikasi untuk pengingat
          </Text>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {isEditMode && (
            <Button
              title="Hapus"
              onPress={handleDelete}
              variant="danger"
              style={styles.deleteButton}
            />
          )}
          <Button
            title={isEditMode ? "Simpan Perubahan" : "Simpan Anggaran"}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
            disabled={!category || !limit}
          />
        </View>

        {/* Cancel Button */}
        <Button
          title="Batal"
          onPress={() => navigation.goBack()}
          variant="secondary"
          style={styles.cancelButton}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 24,
    textAlign: "center",
  },
  infoCard: {
    marginBottom: 24,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#E0F2FE",
    borderRadius: 8,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0369A1",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  warningTextSmall: {
    fontSize: 12,
    color: "#DC2626",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: "45%",
    flex: 1,
  },
  categoryButtonActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  categoryButtonDisabled: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    opacity: 0.7,
  },
  categoryButtonContent: {
    alignItems: "center",
  },
  categoryText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  categoryTextActive: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  categoryTextDisabled: {
    color: "#9CA3AF",
  },
  usedBadge: {
    fontSize: 10,
    color: "#DC2626",
    marginTop: 2,
    fontWeight: "500",
  },
  periodContainer: {
    flexDirection: "row",
    gap: 12,
  },
  periodButton: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  periodButtonActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
  },
  periodIconContainer: {
    marginBottom: 8,
  },
  periodText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  periodTextActive: {
    color: "#4F46E5",
  },
  periodSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
  tipsCard: {
    marginBottom: 24,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    borderRadius: 8,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#166534",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: "#166534",
    marginBottom: 4,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  deleteButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
  cancelButton: {
    marginBottom: 32,
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
});

export default AddBudgetScreen;
