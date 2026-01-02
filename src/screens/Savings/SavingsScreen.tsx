// File: src/screens/Savings/SavingsScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
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
import tw from "twrnc";

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
  RootStackParamList & { SavingsDetail: { savingsId: string } },
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

  const handleViewDetail = (savings: Savings) => {
    navigation.navigate("SavingsDetail", { savingsId: savings.id });
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
        <View style={[tw`absolute inset-0 justify-center items-center`]}>
          <Text style={tw`text-sm font-semibold text-gray-900`}>
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

    return (
      <TouchableOpacity
        key={savings.id}
        onPress={() => handleViewDetail(savings)}
        activeOpacity={0.7}
      >
        <View
          style={[
            tw`mb-4 p-4 bg-white rounded-xl shadow-sm`,
            isCompleted && tw`bg-green-50 border border-green-100`,
          ]}
        >
          <View style={tw`flex-row justify-between items-start mb-4`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-lg font-semibold text-gray-900 mb-1`}>
                {savings.name}
              </Text>
              {isCompleted && (
                <View
                  style={tw`flex-row items-center bg-green-500 px-2 py-1 rounded-full self-start`}
                >
                  <Ionicons name="trophy" size={12} color="#FFFFFF" />
                  <Text style={tw`text-white text-xs font-medium ml-1`}>
                    Selesai!
                  </Text>
                </View>
              )}
            </View>

            <View style={tw`flex-row gap-2`}>
              <TouchableOpacity
                style={tw`p-1`}
                onPress={(e) => {
                  e.stopPropagation();
                  handleAddAmount(savings);
                }}
              >
                <Ionicons name="add-circle" size={20} color="#10B981" />
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`p-1`}
                onPress={(e) => {
                  e.stopPropagation();
                  handleEdit(savings);
                }}
              >
                <Ionicons name="pencil" size={18} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`p-1`}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDelete(savings);
                }}
              >
                <Ionicons name="trash" size={18} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Progress Section */}
          <View style={tw`flex-row items-center mb-4`}>
            <CircularProgress progress={progress} />

            <View style={tw`flex-1 ml-4`}>
              <View style={tw`flex-row justify-between items-center mb-2`}>
                <Text style={tw`text-xs text-gray-500`}>Terkumpul</Text>
                <Text
                  style={[
                    tw`text-sm font-semibold`,
                    isCompleted && tw`text-green-500`,
                  ]}
                >
                  {formatCurrency(savings.current)}
                </Text>
              </View>

              <View style={tw`flex-row justify-between items-center mb-2`}>
                <Text style={tw`text-xs text-gray-500`}>Target</Text>
                <Text style={tw`text-sm font-semibold text-gray-900`}>
                  {formatCurrency(savings.target)}
                </Text>
              </View>

              <View style={tw`flex-row justify-between items-center`}>
                <Text style={tw`text-xs text-gray-500`}>Sisa</Text>
                <Text
                  style={[
                    tw`text-sm font-semibold`,
                    isCompleted ? tw`text-green-500` : tw`text-indigo-600`,
                  ]}
                >
                  {formatCurrency(remaining)}
                </Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={tw`mb-4`}>
            <View style={tw`h-2 bg-gray-200 rounded-full overflow-hidden mb-1`}>
              <View
                style={[
                  tw`h-full rounded-full`,
                  {
                    width: `${Math.min(progress, 100)}%`,
                    backgroundColor: progressColor,
                  },
                ]}
              />
            </View>
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-xs text-gray-400`}>0%</Text>
              <Text style={tw`text-xs text-gray-400`}>100%</Text>
            </View>
          </View>

          {/* Deadline & Quick Actions */}
          <View
            style={tw`flex-row justify-between items-center pt-3 border-t border-gray-200`}
          >
            {savings.deadline && (
              <View style={tw`flex-row items-center flex-1`}>
                <Ionicons name="calendar" size={14} color="#6B7280" />
                <Text style={tw`text-xs text-gray-500 ml-1`}>
                  Target: {formatDate(savings.deadline)}
                  {daysRemaining !== null && (
                    <Text style={tw`text-red-500 font-medium`}>
                      {" "}
                      ({daysRemaining} hari lagi)
                    </Text>
                  )}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                tw`flex-row items-center bg-indigo-600 px-3 py-2 rounded-lg ml-3`,
                isCompleted && tw`bg-gray-200`,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleAddAmount(savings);
              }}
              disabled={isCompleted}
            >
              <Ionicons
                name="add"
                size={16}
                color={isCompleted ? "#9CA3AF" : "#FFFFFF"}
              />
              <Text
                style={[
                  tw`text-white text-xs font-medium ml-1`,
                  isCompleted && tw`text-gray-400`,
                ]}
              >
                Tambah
              </Text>
            </TouchableOpacity>
          </View>

          {/* View Detail Hint */}
          <View style={tw`mt-3 pt-2 border-t border-gray-100`}>
            <Text style={tw`text-xs text-gray-400 text-center`}>
              Ketuk untuk lihat detail
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {/* Stats Summary */}
      <Card style={tw`m-4 mb-2`}>
        <View style={tw`mb-4`}>
          <Text style={tw`text-base font-semibold text-gray-900`}>
            Ringkasan Tabungan
          </Text>
          <Text style={tw`text-sm text-gray-500 mt-1`}>
            Total: {formatCurrency(savingsStats.totalCurrent)} /{" "}
            {formatCurrency(savingsStats.totalTarget)}
          </Text>
        </View>

        <View style={tw`flex-row justify-between mb-4`}>
          <View style={tw`items-center flex-1`}>
            <Text style={tw`text-xl font-bold text-gray-900 mb-1`}>
              {savingsStats.totalSavings}
            </Text>
            <Text style={tw`text-xs text-gray-500`}>Total Target</Text>
          </View>
          <View style={tw`items-center flex-1`}>
            <Text style={[tw`text-xl font-bold mb-1`, tw`text-indigo-600`]}>
              {savingsStats.activeSavings}
            </Text>
            <Text style={tw`text-xs text-gray-500`}>Aktif</Text>
          </View>
          <View style={tw`items-center flex-1`}>
            <Text style={[tw`text-xl font-bold mb-1`, tw`text-green-500`]}>
              {savingsStats.completedSavings}
            </Text>
            <Text style={tw`text-xs text-gray-500`}>Selesai</Text>
          </View>
          <View style={tw`items-center flex-1`}>
            <Text style={[tw`text-xl font-bold mb-1`, tw`text-amber-500`]}>
              {savingsStats.overallProgress.toFixed(0)}%
            </Text>
            <Text style={tw`text-xs text-gray-500`}>Progress</Text>
          </View>
        </View>

        <View style={tw`flex-row items-center pt-3 border-t border-gray-200`}>
          <Text style={tw`text-sm text-gray-500`}>
            Sisa yang perlu ditabung:
          </Text>
          <Text style={tw`text-base font-semibold text-gray-900 ml-1`}>
            {formatCurrency(savingsStats.remaining)}
          </Text>
        </View>
      </Card>

      {/* Filter Buttons */}
      <View style={tw`px-4 mb-2`}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tw`py-1`}
        >
          <TouchableOpacity
            style={[
              tw`flex-row items-center bg-gray-100 px-3 py-1.5 rounded-full mr-2 border border-gray-200`,
              filter === "all" && tw`bg-indigo-600 border-indigo-600`,
            ]}
            onPress={() => setFilter("all")}
          >
            <Text
              style={[
                tw`text-xs text-gray-600`,
                filter === "all" && tw`text-white font-medium`,
              ]}
            >
              Semua
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              tw`flex-row items-center bg-gray-100 px-3 py-1.5 rounded-full mr-2 border border-gray-200`,
              filter === "active" && tw`bg-indigo-600 border-indigo-600`,
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
                tw`text-xs text-gray-600 ml-1`,
                filter === "active" && tw`text-white font-medium`,
              ]}
            >
              Aktif
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              tw`flex-row items-center bg-gray-100 px-3 py-1.5 rounded-full mr-2 border border-gray-200`,
              filter === "completed" && tw`bg-green-500 border-green-500`,
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
                tw`text-xs text-gray-600 ml-1`,
                filter === "completed" && tw`text-white font-medium`,
              ]}
            >
              Selesai
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Savings List */}
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-4 pb-20`}>
        {filteredSavings.map(renderSavingsItem)}

        {filteredSavings.length === 0 && (
          <Card style={tw`items-center p-8 mt-10`}>
            <Ionicons name="wallet-outline" size={64} color="#9CA3AF" />
            <Text
              style={tw`text-lg font-semibold text-gray-900 mt-4 mb-2 text-center`}
            >
              {filter === "all"
                ? "Belum ada target tabungan"
                : `Tidak ada tabungan dengan status "${filter}"`}
            </Text>
            <Text style={tw`text-sm text-gray-500 text-center mb-6 leading-5`}>
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
                style={tw`w-4/5`}
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
        <View style={tw`flex-1 bg-black/50 justify-center p-5`}>
          <Card style={tw`p-5 bg-white rounded-xl`}>
            <Text
              style={tw`text-xl font-semibold text-gray-900 mb-3 text-center`}
            >
              Tambah ke {selectedSavings?.name}
            </Text>

            <Text style={tw`text-sm text-gray-500 text-center mb-6`}>
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

            <View style={tw`flex-row gap-3 mt-4`}>
              <Button
                title="Batal"
                variant="secondary"
                onPress={() => setShowAddModal(false)}
                style={tw`flex-1`}
              />
              <Button
                title="Tambahkan"
                onPress={confirmAddAmount}
                loading={loading}
                style={tw`flex-1`}
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
        <View style={tw`flex-1 bg-black/50 justify-center p-5`}>
          <Card style={tw`p-5 bg-white rounded-xl`}>
            <Text
              style={tw`text-xl font-semibold text-gray-900 mb-3 text-center`}
            >
              Edit Target Tabungan
            </Text>

            <Text style={tw`text-sm text-gray-500 text-center mb-6 leading-5`}>
              Fitur edit lengkap akan segera tersedia. Untuk sekarang, Anda
              bisa:
            </Text>

            <View style={tw`mb-6`}>
              <TouchableOpacity
                style={tw`flex-row items-center p-4 bg-gray-50 rounded-xl mb-3 border border-gray-200`}
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
                <View style={tw`ml-3 flex-1`}>
                  <Text style={tw`text-base font-medium text-gray-900`}>
                    Edit Detail
                  </Text>
                  <Text style={tw`text-xs text-gray-500`}>
                    Ubah nama, target, deadline
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={tw`flex-row items-center p-4 bg-gray-50 rounded-xl border border-gray-200`}
                onPress={() => {
                  setShowEditModal(false);
                  if (selectedSavings) {
                    handleAddAmount(selectedSavings);
                  }
                }}
              >
                <Ionicons name="add-circle-outline" size={24} color="#10B981" />
                <View style={tw`ml-3 flex-1`}>
                  <Text style={tw`text-base font-medium text-gray-900`}>
                    Tambah Saldo
                  </Text>
                  <Text style={tw`text-xs text-gray-500`}>
                    Tambahkan jumlah tabungan
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={tw`flex-row items-center p-4 bg-gray-50 rounded-xl mt-3 border border-gray-200`}
                onPress={() => {
                  setShowEditModal(false);
                  if (selectedSavings) {
                    handleViewDetail(selectedSavings);
                  }
                }}
              >
                <Ionicons name="eye-outline" size={24} color="#8B5CF6" />
                <View style={tw`ml-3 flex-1`}>
                  <Text style={tw`text-base font-medium text-gray-900`}>
                    Lihat Detail Lengkap
                  </Text>
                  <Text style={tw`text-xs text-gray-500`}>
                    Lihat statistik dan riwayat
                  </Text>
                </View>
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
        style={tw`absolute bottom-5 right-5 w-14 h-14 rounded-full bg-indigo-600 justify-center items-center shadow-lg`}
        onPress={() => navigation.navigate("AddSavings" as never)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

export default SavingsScreen;
