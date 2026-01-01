import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { useAppContext } from "../../context/AppContext";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { savingsService } from "../../services/savingsService";
import { getCurrentDate } from "../../utils/calculations";
import { RootStackParamList } from "../../types";

type AddSavingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const AddSavingsScreen: React.FC = () => {
  const navigation = useNavigation<AddSavingsScreenNavigationProp>();
  const { refreshData } = useAppContext();

  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);

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
      await savingsService.addSavings({
        name,
        target: targetNum,
        current: currentNum,
        deadline: deadline || undefined,
      });

      await refreshData();
      navigation.goBack();
    } catch (error) {
      console.error("Error adding savings:", error);
      Alert.alert("Error", "Gagal menambah target tabungan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Text style={styles.title}>Tambah Target Tabungan</Text>

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
          returnKeyType="next"
        />

        {/* Current Amount */}
        <Input
          label="Jumlah Saat Ini (opsional)"
          placeholder="Masukkan jumlah yang sudah terkumpul"
          value={current}
          onChangeText={setCurrent}
          keyboardType="numeric"
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

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Tips: Buat target yang realistis dan pantau progress secara
            berkala
          </Text>
        </View>

        {/* Submit Button */}
        <Button
          title="Simpan Target"
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
  infoBox: {
    backgroundColor: "#F0F9FF",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 24,
  },
  infoText: {
    color: "#0369A1",
    fontSize: 14,
    textAlign: "center",
  },
  submitButton: {
    marginTop: 8,
  },
});

export default AddSavingsScreen;
