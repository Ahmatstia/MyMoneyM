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
import { useNavigation, useRoute } from "@react-navigation/native";

import { useAppContext } from "../../context/AppContext";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { getCurrentDate } from "../../utils/calculations";
import { Savings } from "../../types";

type NavigationProps = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
  setOptions: (options: any) => void;
};

const AddSavingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute();

  const params = route.params as any;
  const isEditMode = params?.editMode || false;
  const savingsData = params?.savingsData;

  const { addSavings, editSavings, deleteSavings } = useAppContext();

  const [name, setName] = useState(savingsData?.name || "");
  const [target, setTarget] = useState(savingsData?.target.toString() || "");
  const [current, setCurrent] = useState(savingsData?.current.toString() || "");
  const [deadline, setDeadline] = useState(savingsData?.deadline || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? "Edit Target Tabungan" : "Tambah Target Tabungan",
    });
  }, [isEditMode, navigation]);

  const handleSubmit = async () => {
    if (!name || !target) {
      Alert.alert("Error", "Mohon isi nama dan target tabungan");
      return;
    }

    const targetNum = parseFloat(target);
    const currentNum = current ? parseFloat(current) : 0;

    if (isNaN(targetNum) || targetNum <= 0) {
      Alert.alert("Error", "Target harus berupa angka positif");
      return;
    }

    if (currentNum > targetNum) {
      Alert.alert(
        "Error",
        "Jumlah saat ini tidak boleh lebih besar dari target"
      );
      return;
    }

    setLoading(true);
    try {
      if (isEditMode && savingsData) {
        await editSavings(savingsData.id, {
          name,
          target: targetNum,
          current: currentNum,
          deadline: deadline || undefined,
        });
      } else {
        await addSavings({
          name,
          target: targetNum,
          current: currentNum,
          deadline: deadline || undefined,
        });
      }

      navigation.goBack();
    } catch (error) {
      console.error("Error saving savings:", error);
      Alert.alert(
        "Error",
        `Gagal ${isEditMode ? "mengedit" : "menambah"} target tabungan`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!isEditMode || !savingsData) return;

    Alert.alert(
      "Hapus Target Tabungan",
      `Apakah Anda yakin ingin menghapus target "${savingsData.name}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSavings(savingsData.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Gagal menghapus target tabungan");
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Text style={styles.title}>
          {isEditMode ? "Edit Target Tabungan" : "Tambah Target Tabungan"}
        </Text>

        {/* Info jika edit mode */}
        {isEditMode && savingsData && (
          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>Informasi Saat Ini</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Progress:</Text>
              <Text
                style={[
                  styles.infoValue,
                  {
                    color:
                      savingsData.current / savingsData.target >= 1
                        ? "#10B981"
                        : "#4F46E5",
                  },
                ]}
              >
                {((savingsData.current / savingsData.target) * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sisa:</Text>
              <Text
                style={[
                  styles.infoValue,
                  savingsData.target - savingsData.current <= 0
                    ? "#10B981"
                    : "#111827",
                ]}
              >
                {savingsData.target - savingsData.current <= 0
                  ? "Tercapai! 🎉"
                  : `${savingsData.target - savingsData.current} lagi`}
              </Text>
            </View>
          </Card>
        )}

        {/* Name Input */}
        <Input
          label="Nama Target"
          placeholder="Contoh: Liburan, Beli Laptop, dll."
          value={name}
          onChangeText={setName}
          returnKeyType="next"
        />

        {/* Target Amount */}
        <Input
          label="Target Jumlah"
          placeholder="Masukkan target jumlah tabungan"
          value={target}
          onChangeText={setTarget}
          keyboardType="numeric"
          prefix="Rp"
          returnKeyType="next"
        />

        {/* Current Amount */}
        <Input
          label="Jumlah Saat Ini (opsional)"
          placeholder="Masukkan jumlah yang sudah terkumpul"
          value={current}
          onChangeText={setCurrent}
          keyboardType="numeric"
          prefix="Rp"
          returnKeyType="next"
        />

        {/* Deadline */}
        <Input
          label="Target Tanggal (opsional)"
          placeholder="YYYY-MM-DD"
          value={deadline}
          onChangeText={setDeadline}
          returnKeyType="done"
        />

        <Text style={styles.dateHint}>
          Contoh: {getCurrentDate()} atau kosongkan jika tidak ada deadline
        </Text>

        {/* Tips */}
        <Card style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips Menabung yang Efektif</Text>
          <Text style={styles.tipText}>
            • Tetapkan target yang realistis dan terukur
          </Text>
          <Text style={styles.tipText}>
            • Otomatiskan transfer tabungan setiap bulan
          </Text>
          <Text style={styles.tipText}>
            • Prioritaskan tabungan sebelum pengeluaran lainnya
          </Text>
          <Text style={styles.tipText}>• Review progress secara berkala</Text>
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
            title={isEditMode ? "Simpan Perubahan" : "Simpan Target"}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
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
  dateHint: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: -8,
    marginBottom: 24,
    fontStyle: "italic",
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
});

export default AddSavingsScreen;
