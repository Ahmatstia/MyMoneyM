import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { formatCurrency } from "../../utils/calculations";
import { Budget } from "../../types";

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
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

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

  // State untuk calculator
  const [calculatorInput, setCalculatorInput] = useState("");
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorResult, setCalculatorResult] = useState<{
    daily: number;
    weekly: number;
    monthly: number;
  } | null>(null);

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

  // Fungsi untuk menghitung budget calculator
  const calculateBudget = (amountStr: string) => {
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setCalculatorResult(null);
      return;
    }

    // Hitung per hari, per minggu, per bulan
    const daily = amount / 30; // Asumsi 30 hari per bulan
    const weekly = amount / 4; // Asumsi 4 minggu per bulan
    const monthly = amount;

    setCalculatorResult({
      daily,
      weekly,
      monthly,
    });
  };

  // Handle calculator input change
  const handleCalculatorInputChange = (text: string) => {
    // Hanya allow angka dan titik
    const cleanedText = text.replace(/[^0-9.]/g, "");
    setCalculatorInput(cleanedText);

    if (cleanedText) {
      calculateBudget(cleanedText);
    } else {
      setCalculatorResult(null);
    }
  };

  // Apply calculator result to limit
  const applyCalculatorResult = (type: "daily" | "weekly" | "monthly") => {
    if (!calculatorResult) return;

    let calculatedLimit = 0;

    switch (type) {
      case "daily":
        calculatedLimit = calculatorResult.daily * 30; // Hari ke bulan
        break;
      case "weekly":
        calculatedLimit = calculatorResult.weekly * 4; // Minggu ke bulan
        break;
      case "monthly":
        calculatedLimit = calculatorResult.monthly;
        break;
    }

    setLimit(calculatedLimit.toFixed(0));
    setShowCalculator(false);
    setCalculatorInput("");
    setCalculatorResult(null);
  };

  // Quick calculator presets
  const QUICK_PRESETS = [
    { label: "50rb", value: "50000" },
    { label: "100rb", value: "100000" },
    { label: "200rb", value: "200000" },
    { label: "500rb", value: "500000" },
    { label: "1jt", value: "1000000" },
    { label: "2jt", value: "2000000" },
  ];

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
    <ScrollView style={tw`flex-1 bg-gray-50 p-4`}>
      {/* Title */}
      <Text style={tw`text-xl font-semibold text-gray-900 mb-6 text-center`}>
        {isEditMode ? "Edit Anggaran" : "Tambah Anggaran Baru"}
      </Text>

      {/* Info jika edit mode */}
      {isEditMode && budgetData && (
        <View style={tw`bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6`}>
          <Text style={tw`text-sm font-semibold text-blue-800 mb-3`}>
            Informasi Anggaran Saat Ini
          </Text>
          <View style={tw`flex-row justify-between mb-2`}>
            <Text style={tw`text-xs text-gray-600`}>Terpakai:</Text>
            <Text style={tw`text-xs font-semibold text-gray-900`}>
              {formatCurrency(budgetData.spent)}
            </Text>
          </View>
          <View style={tw`flex-row justify-between mb-2`}>
            <Text style={tw`text-xs text-gray-600`}>Progress:</Text>
            <Text
              style={[
                tw`text-xs font-semibold`,
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
          <View style={tw`flex-row justify-between`}>
            <Text style={tw`text-xs text-gray-600`}>Sisa:</Text>
            <Text
              style={[
                tw`text-xs font-semibold`,
                budgetData.limit - budgetData.spent >= 0
                  ? tw`text-emerald-600`
                  : tw`text-red-600`,
              ]}
            >
              {formatCurrency(budgetData.limit - budgetData.spent)}
            </Text>
          </View>
        </View>
      )}

      {/* Category Selection */}
      <View style={tw`mb-6`}>
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <Text style={tw`text-sm font-medium text-gray-700`}>Kategori</Text>
          {isCategoryUsed && !isEditMode && (
            <Text style={tw`text-xs text-red-600`}>
              Kategori sudah digunakan
            </Text>
          )}
        </View>
        <View style={tw`flex-row flex-wrap -mx-1`}>
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
                  tw`m-1 px-3 py-2 rounded-lg border flex-1 min-w-[45%]`,
                  category === cat
                    ? tw`bg-indigo-600 border-indigo-600`
                    : tw`bg-gray-100 border-gray-200`,
                  isUsed && !isEditMode && tw`bg-gray-50 opacity-70`,
                ]}
                onPress={() => {
                  if (!isUsed || isEditMode) {
                    setCategory(cat);
                  }
                }}
                disabled={isUsed && !isEditMode}
              >
                <View style={tw`items-center`}>
                  <Text
                    style={[
                      tw`text-xs text-center`,
                      category === cat
                        ? tw`text-white font-medium`
                        : tw`text-gray-700`,
                      isUsed && !isEditMode && tw`text-gray-500`,
                    ]}
                  >
                    {cat}
                  </Text>
                  {isUsed && !isEditMode && (
                    <Text style={tw`text-xs text-red-500 mt-1 font-medium`}>
                      Terpakai
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Period Selection */}
      <View style={tw`mb-6`}>
        <Text style={tw`text-sm font-medium text-gray-700 mb-3`}>Periode</Text>
        <View style={tw`flex-row gap-3`}>
          <TouchableOpacity
            style={[
              tw`flex-1 p-4 bg-white rounded-xl border-2 items-center`,
              period === "monthly"
                ? tw`border-indigo-500 bg-indigo-50`
                : tw`border-gray-200`,
            ]}
            onPress={() => setPeriod("monthly")}
          >
            <View style={tw`mb-2`}>
              <Ionicons
                name="calendar"
                size={24}
                color={period === "monthly" ? "#4F46E5" : "#6B7280"}
              />
            </View>
            <Text
              style={[
                tw`text-sm font-semibold mb-1`,
                period === "monthly" ? tw`text-indigo-600` : tw`text-gray-600`,
              ]}
            >
              Bulanan
            </Text>
            <Text style={tw`text-xs text-gray-500 text-center`}>
              30 hari (1 bulan)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              tw`flex-1 p-4 bg-white rounded-xl border-2 items-center`,
              period === "weekly"
                ? tw`border-indigo-500 bg-indigo-50`
                : tw`border-gray-200`,
            ]}
            onPress={() => setPeriod("weekly")}
          >
            <View style={tw`mb-2`}>
              <Ionicons
                name="calendar-outline"
                size={24}
                color={period === "weekly" ? "#4F46E5" : "#6B7280"}
              />
            </View>
            <Text
              style={[
                tw`text-sm font-semibold mb-1`,
                period === "weekly" ? tw`text-indigo-600` : tw`text-gray-600`,
              ]}
            >
              Mingguan
            </Text>
            <Text style={tw`text-xs text-gray-500 text-center`}>
              7 hari (1 minggu)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Amount Input dengan Calculator Button */}
      <View style={tw`mb-6`}>
        <View style={tw`flex-row justify-between items-center mb-2`}>
          <Text style={tw`text-sm font-medium text-gray-700`}>
            Limit Anggaran
          </Text>
          <TouchableOpacity
            style={tw`flex-row items-center gap-1`}
            onPress={() => setShowCalculator(!showCalculator)}
          >
            <Ionicons
              name="calculator"
              size={16}
              color={showCalculator ? "#4F46E5" : "#6B7280"}
            />
            <Text
              style={[
                tw`text-xs`,
                showCalculator
                  ? tw`text-indigo-600 font-medium`
                  : tw`text-gray-600`,
              ]}
            >
              {showCalculator ? "Tutup Kalkulator" : "Buka Kalkulator"}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={tw`flex-row items-center bg-white border border-gray-300 rounded-lg px-3`}
        >
          <Text style={tw`text-gray-600 mr-2`}>Rp</Text>
          <TextInput
            style={tw`flex-1 py-3 text-gray-800`}
            placeholder="Masukkan limit anggaran"
            placeholderTextColor="#9CA3AF"
            value={limit}
            onChangeText={setLimit}
            keyboardType="numeric"
            returnKeyType="next"
          />
        </View>

        {/* Quick Presets */}
        <View style={tw`mt-3`}>
          <Text style={tw`text-xs text-gray-600 mb-2`}>Pilih cepat:</Text>
          <View style={tw`flex-row flex-wrap gap-2`}>
            {QUICK_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.label}
                style={tw`px-3 py-1.5 bg-gray-100 rounded-lg`}
                onPress={() => setLimit(preset.value)}
              >
                <Text style={tw`text-xs text-gray-700`}>{preset.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Budget Calculator */}
        {showCalculator && (
          <View style={tw`mt-4 bg-white border border-gray-300 rounded-xl p-4`}>
            <View style={tw`flex-row justify-between items-center mb-3`}>
              <Text style={tw`text-sm font-medium text-gray-800`}>
                🧮 Kalkulator Anggaran
              </Text>
              <TouchableOpacity onPress={() => setShowCalculator(false)}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={tw`text-xs text-gray-600 mb-2`}>
              Masukkan jumlah untuk melihat perhitungan:
            </Text>

            <View
              style={tw`flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 mb-4`}
            >
              <Text style={tw`text-gray-600 mr-2`}>Rp</Text>
              <TextInput
                style={tw`flex-1 py-3 text-gray-800`}
                placeholder="Contoh: 200000"
                placeholderTextColor="#9CA3AF"
                value={calculatorInput}
                onChangeText={handleCalculatorInputChange}
                keyboardType="numeric"
              />
            </View>

            {/* Calculator Results */}
            {calculatorResult && (
              <View style={tw`mb-4`}>
                <Text style={tw`text-xs font-medium text-gray-700 mb-2`}>
                  Perkiraan Pengeluaran:
                </Text>

                <View style={tw`bg-gray-50 rounded-lg p-3`}>
                  {/* Per Hari */}
                  <TouchableOpacity
                    style={tw`flex-row justify-between items-center p-2 mb-2 bg-white rounded-lg border border-gray-200`}
                    onPress={() => applyCalculatorResult("daily")}
                  >
                    <View>
                      <Text style={tw`text-sm font-medium text-gray-900`}>
                        Per Hari
                      </Text>
                      <Text style={tw`text-xs text-gray-500`}>
                        Untuk pengeluaran harian
                      </Text>
                    </View>
                    <View style={tw`items-end`}>
                      <Text style={tw`text-sm font-bold text-gray-900`}>
                        {formatCurrency(calculatorResult.daily)}
                      </Text>
                      <Text style={tw`text-xs text-gray-500`}>
                        × 30 = {formatCurrency(calculatorResult.daily * 30)}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Per Minggu */}
                  <TouchableOpacity
                    style={tw`flex-row justify-between items-center p-2 mb-2 bg-white rounded-lg border border-gray-200`}
                    onPress={() => applyCalculatorResult("weekly")}
                  >
                    <View>
                      <Text style={tw`text-sm font-medium text-gray-900`}>
                        Per Minggu
                      </Text>
                      <Text style={tw`text-xs text-gray-500`}>
                        Untuk pengeluaran mingguan
                      </Text>
                    </View>
                    <View style={tw`items-end`}>
                      <Text style={tw`text-sm font-bold text-gray-900`}>
                        {formatCurrency(calculatorResult.weekly)}
                      </Text>
                      <Text style={tw`text-xs text-gray-500`}>
                        × 4 = {formatCurrency(calculatorResult.weekly * 4)}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Per Bulan */}
                  <TouchableOpacity
                    style={tw`flex-row justify-between items-center p-2 bg-white rounded-lg border border-gray-200`}
                    onPress={() => applyCalculatorResult("monthly")}
                  >
                    <View>
                      <Text style={tw`text-sm font-medium text-gray-900`}>
                        Per Bulan
                      </Text>
                      <Text style={tw`text-xs text-gray-500`}>
                        Untuk pengeluaran bulanan
                      </Text>
                    </View>
                    <View style={tw`items-end`}>
                      <Text style={tw`text-sm font-bold text-gray-900`}>
                        {formatCurrency(calculatorResult.monthly)}
                      </Text>
                      <Text style={tw`text-xs text-gray-500`}>
                        ÷ 30 = {formatCurrency(calculatorResult.monthly / 30)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <Text style={tw`text-xs text-gray-500 mt-2 text-center`}>
                  Tap salah satu untuk mengatur sebagai limit
                </Text>
              </View>
            )}

            {/* Calculation Info */}
            <View style={tw`bg-blue-50 p-3 rounded-lg`}>
              <Text style={tw`text-xs font-medium text-blue-800 mb-1`}>
                💡 Cara Hitung:
              </Text>
              <Text style={tw`text-xs text-blue-700`}>
                • <Text style={tw`font-medium`}>Per Hari</Text>: Jumlah ÷ 30
                hari
              </Text>
              <Text style={tw`text-xs text-blue-700`}>
                • <Text style={tw`font-medium`}>Per Minggu</Text>: Jumlah ÷ 4
                minggu
              </Text>
              <Text style={tw`text-xs text-blue-700`}>
                • <Text style={tw`font-medium`}>Per Bulan</Text>: Jumlah
                langsung
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Estimated Daily if limit filled */}
      {limit && parseFloat(limit) > 0 && (
        <View
          style={tw`mb-6 bg-emerald-50 border border-emerald-100 rounded-xl p-4`}
        >
          <Text style={tw`text-sm font-semibold text-emerald-800 mb-2`}>
            📊 Estimasi Pengeluaran Harian
          </Text>

          <View style={tw`flex-row justify-between items-center mb-3`}>
            <View>
              <Text style={tw`text-xs text-gray-600`}>Per Hari</Text>
              <Text style={tw`text-base font-bold text-emerald-700`}>
                {formatCurrency(
                  parseFloat(limit) / (period === "monthly" ? 30 : 7)
                )}
              </Text>
            </View>
            <View>
              <Text style={tw`text-xs text-gray-600`}>
                Per {period === "monthly" ? "Minggu" : "Hari"}
              </Text>
              <Text style={tw`text-base font-bold text-emerald-700`}>
                {period === "monthly"
                  ? formatCurrency(parseFloat(limit) / 4)
                  : formatCurrency(parseFloat(limit))}
              </Text>
            </View>
          </View>

          <Text style={tw`text-xs text-emerald-700`}>
            Dengan limit {formatCurrency(parseFloat(limit))}{" "}
            {period === "monthly" ? "per bulan" : "per minggu"}, Anda bisa
            menghabiskan maksimal{" "}
            <Text style={tw`font-bold`}>
              {formatCurrency(
                parseFloat(limit) / (period === "monthly" ? 30 : 7)
              )}
            </Text>{" "}
            per hari.
          </Text>
        </View>
      )}

      {/* Tips */}
      <View style={tw`bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6`}>
        <Text style={tw`text-sm font-semibold text-blue-800 mb-2`}>
          💡 Tips Menentukan Anggaran
        </Text>
        <Text style={tw`text-xs text-blue-700 mb-1`}>
          • <Text style={tw`font-medium`}>Makanan</Text>: Rp 15.000-30.000/hari
        </Text>
        <Text style={tw`text-xs text-blue-700 mb-1`}>
          • <Text style={tw`font-medium`}>Transportasi</Text>: Rp
          10.000-20.000/hari
        </Text>
        <Text style={tw`text-xs text-blue-700 mb-1`}>
          • <Text style={tw`font-medium`}>Hiburan</Text>: 10-20% dari pendapatan
        </Text>
        <Text style={tw`text-xs text-blue-700`}>
          • <Text style={tw`font-medium`}>Tabungan</Text>: Minimal 20% dari
          pendapatan
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={tw`flex-row gap-3 mb-3`}>
        {isEditMode && (
          <TouchableOpacity
            style={tw`flex-1 py-3 bg-red-600 rounded-lg items-center`}
            onPress={handleDelete}
          >
            <Text style={tw`text-white font-medium`}>Hapus</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            tw`${
              isEditMode ? "flex-2" : "flex-1"
            } py-3 rounded-lg items-center`,
            !category || !limit ? tw`bg-gray-400` : tw`bg-indigo-600`,
          ]}
          onPress={handleSubmit}
          disabled={!category || !limit || loading}
        >
          {loading ? (
            <Text style={tw`text-white`}>Menyimpan...</Text>
          ) : (
            <Text style={tw`text-white font-medium`}>
              {isEditMode ? "Simpan Perubahan" : "Simpan Anggaran"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Cancel Button */}
      <TouchableOpacity
        style={tw`py-3 border border-gray-300 rounded-lg items-center mb-8`}
        onPress={() => navigation.goBack()}
      >
        <Text style={tw`text-gray-700`}>Batal</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddBudgetScreen;
