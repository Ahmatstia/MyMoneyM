import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import tw from "twrnc"; // TAMBAHKAN IMPORT

import { useAppContext } from "../../context/AppContext";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { getCurrentDate } from "../../utils/calculations";
import { RootStackParamList, Savings } from "../../types";

type AddSavingsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddSavings"
>;

type AddSavingsScreenRouteProp = RouteProp<RootStackParamList, "AddSavings">;

const AddSavingsScreen: React.FC = () => {
  const navigation = useNavigation<AddSavingsScreenNavigationProp>();
  const route = useRoute<AddSavingsScreenRouteProp>();

  const params = route.params || {};
  const isEditMode = params.editMode || false;
  const savingsData = params.savingsData;

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
    <ScrollView style={tw`flex-1 bg-gray-50 p-4`}>
      <Card>
        <Text style={tw`text-xl font-semibold text-gray-900 mb-6 text-center`}>
          {isEditMode ? "Edit Target Tabungan" : "Tambah Target Tabungan"}
        </Text>

        {/* Info jika edit mode */}
        {isEditMode && savingsData && (
          <Card
            style={tw`mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4`}
          >
            <Text style={tw`text-sm font-semibold text-blue-700 mb-3`}>
              Informasi Saat Ini
            </Text>
            <View style={tw`flex-row justify-between mb-2`}>
              <Text style={tw`text-xs text-gray-600`}>Progress:</Text>
              <Text
                style={[
                  tw`text-xs font-semibold`,
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
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-xs text-gray-600`}>Sisa:</Text>
              <Text
                style={[
                  tw`text-xs font-semibold`,
                  {
                    color:
                      savingsData.target - savingsData.current <= 0
                        ? "#10B981"
                        : "#4F46E5",
                  },
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

        <Text style={tw`text-xs text-gray-400 -mt-2 mb-6 italic`}>
          Contoh: {getCurrentDate()} atau kosongkan jika tidak ada deadline
        </Text>

        {/* Tips */}
        <Card
          style={tw`mb-6 bg-green-50 border border-green-100 rounded-lg p-4`}
        >
          <Text style={tw`text-sm font-semibold text-green-800 mb-2`}>
            💡 Tips Menabung yang Efektif
          </Text>
          <Text style={tw`text-xs text-green-800 mb-1`}>
            • Tetapkan target yang realistis dan terukur
          </Text>
          <Text style={tw`text-xs text-green-800 mb-1`}>
            • Otomatiskan transfer tabungan setiap bulan
          </Text>
          <Text style={tw`text-xs text-green-800 mb-1`}>
            • Prioritaskan tabungan sebelum pengeluaran lainnya
          </Text>
          <Text style={tw`text-xs text-green-800`}>
            • Review progress secara berkala
          </Text>
        </Card>

        {/* Action Buttons */}
        <View style={tw`flex-row gap-3 mb-3`}>
          {isEditMode && (
            <Button
              title="Hapus"
              onPress={handleDelete}
              variant="danger"
              style={tw`flex-1`}
            />
          )}
          <Button
            title={isEditMode ? "Simpan Perubahan" : "Simpan Target"}
            onPress={handleSubmit}
            loading={loading}
            style={isEditMode ? tw`flex-2` : tw`flex-1`}
          />
        </View>

        {/* Cancel Button */}
        <Button
          title="Batal"
          onPress={() => navigation.goBack()}
          variant="secondary"
          style={tw`mb-8`}
        />
      </Card>
    </ScrollView>
  );
};

export default AddSavingsScreen;
