import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { useAppContext } from "../../context/AppContext";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { budgetService } from "../../services/budgetService";
import { formatCurrency } from "../../utils/calculations";
import { RootStackParamList } from "../../types";

type AddBudgetScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const categories = [
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
  const { refreshData } = useAppContext();

  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [period, setPeriod] = useState<"monthly" | "weekly">("monthly");
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    try {
      await budgetService.addBudget({
        category,
        limit: limitNum,
        period,
      });

      await refreshData();
      navigation.goBack();
    } catch (error) {
      console.error("Error adding budget:", error);
      Alert.alert("Error", "Gagal menambah anggaran");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Text style={styles.title}>Tambah Anggaran Baru</Text>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Kategori</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  category === cat && styles.categoryButtonActive,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === cat && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amount Input */}
        <Input
          label="Limit Anggaran"
          placeholder="Masukkan limit anggaran"
          value={limit}
          onChangeText={setLimit}
          keyboardType="numeric"
          returnKeyType="done"
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
              <Text
                style={[
                  styles.periodText,
                  period === "monthly" && styles.periodTextActive,
                ]}
              >
                Bulanan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                period === "weekly" && styles.periodButtonActive,
              ]}
              onPress={() => setPeriod("weekly")}
            >
              <Text
                style={[
                  styles.periodText,
                  period === "weekly" && styles.periodTextActive,
                ]}
              >
                Mingguan
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button */}
        <Button
          title="Simpan Anggaran"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
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
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
    color: "#374151",
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryButtonActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  categoryText: {
    fontSize: 12,
    color: "#6B7280",
  },
  categoryTextActive: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  periodContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  periodTextActive: {
    color: "#4F46E5",
  },
  submitButton: {
    marginTop: 24,
  },
});

export default AddBudgetScreen;
