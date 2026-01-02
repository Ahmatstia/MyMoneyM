// File: src/screens/Savings/SavingsDetailScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import tw from "twrnc";
import Svg, { Circle } from "react-native-svg";

import { useAppContext } from "../../context/AppContext";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import {
  formatCurrency,
  calculateSavingsProgress,
  formatDate,
} from "../../utils/calculations";
import { RootStackParamList, Savings } from "../../types";

type SavingsDetailScreenRouteProp = RouteProp<
  RootStackParamList & { SavingsDetail: { savingsId: string } },
  "SavingsDetail"
>;

type SavingsDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList & { SavingsDetail: { savingsId: string } },
  "SavingsDetail"
>;

const SavingsDetailScreen: React.FC = () => {
  const navigation = useNavigation<SavingsDetailScreenNavigationProp>();
  const route = useRoute<SavingsDetailScreenRouteProp>();
  const { savingsId } = route.params;

  const { state, updateSavings, deleteSavings } = useAppContext();

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const savings = state.savings.find((s) => s.id === savingsId);

  const stats = useMemo(() => {
    if (!savings) return null;

    const progress = calculateSavingsProgress(savings);
    const remaining = savings.target - savings.current;
    const isCompleted = savings.current >= savings.target;

    // Hitung hari tersisa jika ada deadline
    let daysRemaining = null;
    let dailyNeeded = 0;
    if (savings.deadline) {
      try {
        const deadlineDate = new Date(savings.deadline);
        const today = new Date();
        const diffTime = deadlineDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysRemaining = diffDays > 0 ? diffDays : 0;

        if (daysRemaining > 0) {
          dailyNeeded = remaining / daysRemaining;
        }
      } catch (error) {
        console.error("Error calculating days:", error);
      }
    }

    // Milestone progress
    const milestones = [
      { percentage: 25, label: "25%", reached: progress >= 25 },
      { percentage: 50, label: "50%", reached: progress >= 50 },
      { percentage: 75, label: "75%", reached: progress >= 75 },
      { percentage: 100, label: "100%", reached: progress >= 100 },
    ];

    return {
      progress,
      remaining,
      isCompleted,
      daysRemaining,
      dailyNeeded,
      milestones,
    };
  }, [savings]);

  const handleDeposit = async () => {
    if (!savings || !amount) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Error", "Jumlah harus berupa angka positif");
      return;
    }

    setLoading(true);
    try {
      await updateSavings(savings.id, amountNum);
      setShowDepositModal(false);
      setAmount("");
      Alert.alert("Berhasil", `Berhasil menambah ${formatCurrency(amountNum)}`);
    } catch (error) {
      console.error("Deposit error:", error);
      Alert.alert("Error", "Gagal menambah deposit");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!savings) return;

    Alert.alert("Hapus Tabungan", `Hapus tabungan "${savings.name}"?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSavings(savings.id);
            navigation.goBack();
          } catch (error) {
            Alert.alert("Error", "Gagal menghapus tabungan");
          }
        },
      },
    ]);
  };

  const handleShare = async () => {
    if (!savings || !stats) return;

    const progress = stats.progress.toFixed(1);
    const message = `Tabungan "${savings.name}": ${progress}% tercapai
${formatCurrency(savings.current)} / ${formatCurrency(savings.target)}
${savings.deadline ? `Target: ${formatDate(savings.deadline)}` : ""}`;

    try {
      await Share.share({ message, title: "Progress Tabungan" });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const CircularProgress = ({ size = 100 }: { size?: number }) => {
    if (!savings || !stats) return null;

    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset =
      circumference - (stats.progress / 100) * circumference;

    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            stroke="#E5E7EB"
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <Circle
            stroke={stats.progress >= 100 ? "#10B981" : "#4F46E5"}
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
        <View style={tw`absolute inset-0 justify-center items-center`}>
          <Text style={tw`text-xl font-bold text-gray-900`}>
            {stats.progress.toFixed(0)}%
          </Text>
        </View>
      </View>
    );
  };

  if (!savings || !stats) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50 p-4`}>
        <Text style={tw`text-lg text-gray-500`}>Tabungan tidak ditemukan</Text>
        <Button
          title="Kembali"
          onPress={() => navigation.goBack()}
          style={tw`mt-4`}
        />
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {/* Header - Mirip BudgetScreen */}
      <View style={tw`px-4 pt-3 pb-4 bg-white border-b border-gray-200`}>
        <View style={tw`flex-row justify-between items-center mb-4`}>
          <View style={tw`flex-row items-center gap-3`}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={tw`p-1`}
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <View>
              <Text style={tw`text-lg font-bold text-gray-900`}>
                {savings.name}
              </Text>
              <Text style={tw`text-sm text-gray-600`}>
                {state.savings.length} tabungan aktif
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleShare}
            style={tw`w-10 h-10 rounded-full bg-gray-100 justify-center items-center`}
          >
            <Ionicons name="share-outline" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Progress Circle dan Info */}
        <View style={tw`flex-row items-center gap-4`}>
          <CircularProgress size={100} />

          <View style={tw`flex-1 gap-1`}>
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-sm text-gray-600`}>Terkumpul</Text>
              <Text style={tw`text-sm font-semibold text-gray-900`}>
                {formatCurrency(savings.current)}
              </Text>
            </View>

            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-sm text-gray-600`}>Target</Text>
              <Text style={tw`text-sm font-semibold text-gray-900`}>
                {formatCurrency(savings.target)}
              </Text>
            </View>

            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-sm text-gray-600`}>Sisa</Text>
              <Text
                style={[
                  tw`text-sm font-semibold`,
                  stats.isCompleted
                    ? tw`text-emerald-600`
                    : tw`text-indigo-600`,
                ]}
              >
                {formatCurrency(stats.remaining)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-4 pb-8`}>
        {/* Info Cards - Mirip BudgetScreen */}
        <View style={tw`gap-3 mb-4`}>
          {/* Deadline Card */}
          {savings.deadline && (
            <View style={tw`bg-white rounded-xl p-4 border border-gray-100`}>
              <View style={tw`flex-row items-center justify-between mb-2`}>
                <View style={tw`flex-row items-center gap-2`}>
                  <Ionicons name="calendar" size={18} color="#3B82F6" />
                  <Text style={tw`text-sm font-semibold text-gray-900`}>
                    Target Tanggal
                  </Text>
                </View>
                <View style={tw`px-2 py-1 bg-blue-100 rounded-lg`}>
                  <Text style={tw`text-xs font-medium text-blue-700`}>
                    {stats.daysRemaining} hari lagi
                  </Text>
                </View>
              </View>

              <Text style={tw`text-sm text-gray-700 mb-1`}>
                {formatDate(savings.deadline)}
              </Text>

              {stats.daysRemaining && stats.daysRemaining > 0 && (
                <View style={tw`mt-2 p-2 bg-gray-50 rounded-lg`}>
                  <Text style={tw`text-xs text-gray-600 text-center`}>
                    Perlu menabung{" "}
                    <Text style={tw`font-bold text-indigo-600`}>
                      {formatCurrency(stats.dailyNeeded)}
                    </Text>{" "}
                    per hari
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Status Card */}
          <View style={tw`bg-white rounded-xl p-4 border border-gray-100`}>
            <View style={tw`flex-row items-center gap-2 mb-3`}>
              <Ionicons
                name={stats.isCompleted ? "checkmark-circle" : "time"}
                size={18}
                color={stats.isCompleted ? "#10B981" : "#F59E0B"}
              />
              <Text style={tw`text-sm font-semibold text-gray-900`}>
                Status
              </Text>
            </View>

            <View style={tw`gap-2`}>
              <View style={tw`flex-row justify-between items-center`}>
                <Text style={tw`text-sm text-gray-600`}>Progress</Text>
                <Text style={tw`text-sm font-semibold text-indigo-600`}>
                  {stats.progress.toFixed(1)}%
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={tw`h-2 bg-gray-200 rounded-full overflow-hidden`}>
                <View
                  style={[
                    tw`h-full rounded-full`,
                    {
                      width: `${Math.min(stats.progress, 100)}%`,
                      backgroundColor:
                        stats.progress >= 100 ? "#10B981" : "#4F46E5",
                    },
                  ]}
                />
              </View>

              <View style={tw`flex-row justify-between mt-1`}>
                <Text style={tw`text-xs text-gray-400`}>0%</Text>
                <Text style={tw`text-xs text-gray-400`}>100%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Milestones - Simple Version */}
        <View style={tw`bg-white rounded-xl p-4 border border-gray-100 mb-4`}>
          <Text style={tw`text-sm font-semibold text-gray-900 mb-3`}>
            Milestone Progress
          </Text>

          <View style={tw`flex-row justify-between`}>
            {stats.milestones.map((milestone) => (
              <View key={milestone.percentage} style={tw`items-center`}>
                <View
                  style={[
                    tw`w-10 h-10 rounded-full items-center justify-center mb-1`,
                    milestone.reached ? tw`bg-emerald-100` : tw`bg-gray-100`,
                  ]}
                >
                  <Text style={tw`text-sm font-medium text-gray-700`}>
                    {milestone.label}
                  </Text>
                </View>
                <Text
                  style={[
                    tw`text-xs`,
                    milestone.reached
                      ? tw`text-emerald-600 font-medium`
                      : tw`text-gray-500`,
                  ]}
                >
                  {milestone.reached ? "✓" : "•"}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={tw`bg-white rounded-xl p-4 border border-gray-100 mb-4`}>
          <Text style={tw`text-sm font-semibold text-gray-900 mb-3`}>
            Aksi Cepat
          </Text>

          <View style={tw`flex-row gap-2`}>
            <Button
              title="Tambah Dana"
              onPress={() => setShowDepositModal(true)}
              icon="add-circle"
              style={tw`flex-1`}
              size="small"
              disabled={stats.isCompleted}
            />
            <Button
              title="Edit"
              onPress={() =>
                navigation.navigate("AddSavings", {
                  editMode: true,
                  savingsData: savings,
                })
              }
              icon="pencil"
              variant="secondary"
              style={tw`flex-1`}
              size="small"
            />
            <TouchableOpacity
              style={tw`w-10 h-10 rounded-lg bg-red-50 justify-center items-center border border-red-100`}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={18} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Details Card */}
        <View style={tw`bg-white rounded-xl p-4 border border-gray-100`}>
          <Text style={tw`text-sm font-semibold text-gray-900 mb-3`}>
            Detail
          </Text>

          <View style={tw`gap-2`}>
            <View
              style={tw`flex-row justify-between items-center py-2 border-b border-gray-100`}
            >
              <Text style={tw`text-sm text-gray-600`}>Nama Tabungan</Text>
              <Text style={tw`text-sm font-medium text-gray-900`}>
                {savings.name}
              </Text>
            </View>

            <View
              style={tw`flex-row justify-between items-center py-2 border-b border-gray-100`}
            >
              <Text style={tw`text-sm text-gray-600`}>Dibuat</Text>
              <Text style={tw`text-sm font-medium text-gray-900`}>
                {formatDate(new Date().toISOString())}
              </Text>
            </View>

            <View style={tw`flex-row justify-between items-center py-2`}>
              <Text style={tw`text-sm text-gray-600`}>Status</Text>
              <View
                style={[
                  tw`px-2 py-1 rounded-lg`,
                  stats.isCompleted ? tw`bg-emerald-100` : tw`bg-blue-100`,
                ]}
              >
                <Text
                  style={[
                    tw`text-xs font-medium`,
                    stats.isCompleted
                      ? tw`text-emerald-700`
                      : tw`text-blue-700`,
                  ]}
                >
                  {stats.isCompleted ? "Selesai" : "Dalam Progres"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Deposit Modal - Minimalis */}
      <Modal
        visible={showDepositModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDepositModal(false)}
      >
        <View style={tw`flex-1 bg-black/50 justify-center p-4`}>
          <View style={tw`bg-white rounded-xl p-5`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-lg font-semibold text-gray-900`}>
                Tambah Dana
              </Text>
              <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={tw`text-sm text-gray-500 mb-1`}>Tabungan</Text>
            <Text style={tw`text-base font-medium text-gray-900 mb-4`}>
              {savings.name}
            </Text>

            <Input
              placeholder="Masukkan jumlah"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              prefix="Rp"
              autoFocus
              style={tw`mb-4`}
            />

            {/* Quick Amounts - Grid */}
            <View style={tw`flex-row flex-wrap gap-2 mb-6`}>
              {[50000, 100000, 200000, 500000].map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={tw`flex-1 min-w-[45%] px-3 py-2 bg-gray-100 rounded-lg items-center`}
                  onPress={() => setAmount(quickAmount.toString())}
                >
                  <Text style={tw`text-sm text-gray-700`}>
                    {formatCurrency(quickAmount)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={tw`flex-row gap-2`}>
              <Button
                title="Batal"
                variant="secondary"
                onPress={() => setShowDepositModal(false)}
                style={tw`flex-1`}
                size="small"
              />
              <Button
                title="Simpan"
                onPress={handleDeposit}
                loading={loading}
                style={tw`flex-1`}
                size="small"
                disabled={!amount}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SavingsDetailScreen;
