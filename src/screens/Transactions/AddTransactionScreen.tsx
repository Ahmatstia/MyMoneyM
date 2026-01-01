import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { useAppContext } from "../../context/AppContext";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { getCurrentDate } from "../../utils/calculations";
import { RootStackParamList, TransactionType } from "../../types";

type AddTransactionScreenNavigationProp =
  StackNavigationProp<RootStackParamList>;
type AddTransactionScreenRouteProp = RouteProp<
  RootStackParamList,
  "AddTransaction"
>;

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

const AddTransactionScreen: React.FC = () => {
  const navigation = useNavigation<AddTransactionScreenNavigationProp>();
  const route = useRoute<AddTransactionScreenRouteProp>();
  const { addTransaction, editTransaction } = useAppContext();

  // Check if we're in edit mode
  const isEditMode = route.params?.editMode || false;
  const transactionData = route.params?.transactionData;

  const [type, setType] = useState<TransactionType>(
    transactionData?.type || "expense"
  );
  const [amount, setAmount] = useState(
    transactionData?.amount.toString() || ""
  );
  const [category, setCategory] = useState(transactionData?.category || "");
  const [description, setDescription] = useState(
    transactionData?.description || ""
  );
  const [date, setDate] = useState(transactionData?.date || getCurrentDate());
  const [loading, setLoading] = useState(false);

  // Update title based on mode
  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? "Edit Transaksi" : "Tambah Transaksi",
    });
  }, [isEditMode, navigation]);

  const handleSubmit = async () => {
    if (!amount || !category) {
      Alert.alert("Error", "Mohon isi jumlah dan kategori");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Error", "Jumlah harus berupa angka positif");
      return;
    }

    setLoading(true);
    try {
      if (isEditMode && transactionData) {
        // Edit mode
        await editTransaction(transactionData.id, {
          amount: amountNum,
          type,
          category,
          description,
          date,
        });
      } else {
        // Add mode
        await addTransaction({
          amount: amountNum,
          type,
          category,
          description,
          date,
        });
      }

      navigation.goBack();
    } catch (error) {
      console.error("Error saving transaction:", error);
      Alert.alert(
        "Error",
        `Gagal ${isEditMode ? "mengedit" : "menambah"} transaksi`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Text style={styles.title}>
          {isEditMode ? "Edit Transaksi" : "Tambah Transaksi Baru"}
        </Text>

        {/* Transaction Type Selection */}
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === "expense" && styles.typeButtonActive,
            ]}
            onPress={() => setType("expense")}
          >
            <Text
              style={[
                styles.typeText,
                type === "expense" && styles.typeTextActive,
              ]}
            >
              Pengeluaran
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === "income" && styles.typeButtonActive,
            ]}
            onPress={() => setType("income")}
          >
            <Text
              style={[
                styles.typeText,
                type === "income" && styles.typeTextActive,
              ]}
            >
              Pemasukan
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount Input */}
        <Input
          label="Jumlah"
          placeholder="Masukkan jumlah"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          returnKeyType="done"
        />

        {/* Category Selection */}
        <View style={styles.categorySection}>
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

        {/* Description Input */}
        <Input
          label="Deskripsi (opsional)"
          placeholder="Tambahkan deskripsi"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        {/* Date Input */}
        <Input
          label="Tanggal"
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
        />

        {/* Original Transaction Info (only in edit mode) */}
        {isEditMode && transactionData && (
          <Card style={styles.originalInfo}>
            <Text style={styles.originalTitle}>Informasi Asli:</Text>
            <View style={styles.originalRow}>
              <Text style={styles.originalLabel}>ID:</Text>
              <Text style={styles.originalValue}>{transactionData.id}</Text>
            </View>
            <View style={styles.originalRow}>
              <Text style={styles.originalLabel}>Tanggal dibuat:</Text>
              <Text style={styles.originalValue}>{transactionData.date}</Text>
            </View>
          </Card>
        )}

        {/* Submit Button */}
        <Button
          title={isEditMode ? "Simpan Perubahan" : "Simpan Transaksi"}
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
  typeContainer: {
    flexDirection: "row",
    marginBottom: 24,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 6,
  },
  typeButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  typeTextActive: {
    color: "#4F46E5",
  },
  categorySection: {
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
  originalInfo: {
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  originalTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  originalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  originalLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  originalValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#111827",
  },
  submitButton: {
    marginTop: 24,
  },
});

export default AddTransactionScreen;
