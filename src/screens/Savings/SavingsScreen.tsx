// File: src/screens/SavingsScreen.tsx - FIXED VERSION
import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { Text, ProgressBar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import {
  formatCurrency,
  safeNumber,
  getSafePercentage,
} from "../../utils/calculations";
import { formatDateShort } from "../../utils/formatters";
import { Savings } from "../../types";

const SavingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state, deleteSavings, refreshData } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const savings = state.savings || [];

  // Hitung total progress
  const totalStats = useMemo(() => {
    const totalTarget = savings.reduce(
      (sum, s) => sum + safeNumber(s.target),
      0
    );
    const totalCurrent = savings.reduce(
      (sum, s) => sum + safeNumber(s.current),
      0
    );
    const overallProgress = getSafePercentage(totalCurrent, totalTarget);

    const activeSavings = savings.filter(
      (s) => safeNumber(s.current) < safeNumber(s.target)
    );
    const completedSavings = savings.filter(
      (s) => safeNumber(s.current) >= safeNumber(s.target)
    );

    return {
      totalTarget,
      totalCurrent,
      overallProgress,
      activeCount: activeSavings.length,
      completedCount: completedSavings.length,
    };
  }, [savings]);

  // Filter savings
  const filteredSavings = useMemo(() => {
    return savings.filter((saving) => {
      const current = safeNumber(saving.current);
      const target = safeNumber(saving.target);
      const isCompleted = current >= target;

      switch (filter) {
        case "active":
          return !isCompleted;
        case "completed":
          return isCompleted;
        default:
          return true;
      }
    });
  }, [savings, filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Dapatkan icon berdasarkan kategori
  const getIcon = (saving: Savings) => {
    if (saving.icon) return saving.icon;

    switch (saving.category) {
      case "emergency":
        return "shield";
      case "vacation":
        return "airplane";
      case "gadget":
        return "phone-portrait";
      case "education":
        return "school";
      case "house":
        return "home";
      case "car":
        return "car";
      case "health":
        return "medical";
      case "wedding":
        return "heart";
      default:
        return "wallet";
    }
  };

  // Dapatkan warna berdasarkan progress
  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "#10B981"; // hijau
    if (progress >= 75) return "#3B82F6"; // biru
    if (progress >= 50) return "#F59E0B"; // kuning
    if (progress >= 25) return "#EF4444"; // merah muda
    return "#6B7280"; // abu-abu
  };

  // Format deadline
  const formatDeadline = (deadline?: string) => {
    if (!deadline) return "Tanpa deadline";

    try {
      const deadlineDate = new Date(deadline);
      const today = new Date();
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return "Terlambat";
      if (diffDays === 0) return "Hari ini";
      if (diffDays === 1) return "Besok";
      if (diffDays < 7) return `${diffDays} hari lagi`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lagi`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan lagi`;
      return `${Math.floor(diffDays / 365)} tahun lagi`;
    } catch {
      return deadline;
    }
  };

  // Handle delete savings
  const handleDelete = (saving: Savings) => {
    Alert.alert(
      "Hapus Tabungan",
      `Hapus tabungan "${saving.name}"?\n\nSemua riwayat transaksi juga akan dihapus.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSavings(saving.id);
              Alert.alert("✅ Berhasil", "Tabungan telah dihapus");
            } catch (error) {
              Alert.alert("Error", "Gagal menghapus tabungan");
            }
          },
        },
      ]
    );
  };

  // Empty state component
  const renderEmptyState = () => (
    <View style={tw`items-center py-12`}>
      <Ionicons name="wallet-outline" size={48} color="#9CA3AF" />
      <Text
        style={tw`text-lg font-semibold text-gray-900 mt-4 mb-2 text-center`}
      >
        {filter === "all" ? "Belum ada tabungan" : "Tidak ada tabungan"}
      </Text>
      <Text style={tw`text-sm text-gray-600 text-center mb-6 leading-5`}>
        {filter === "all"
          ? "Mulai dengan membuat target tabungan pertama Anda"
          : `Tidak ada tabungan dengan status "${filter}"`}
      </Text>
      {filter === "all" && (
        <TouchableOpacity
          style={tw`flex-row items-center bg-indigo-600 px-5 py-3 rounded-lg gap-2`}
          onPress={() => navigation.navigate("AddSavings")}
        >
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={tw`text-sm font-semibold text-white`}>
            Buat Target Tabungan
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render savings card
  const renderSavingsCard = (saving: Savings) => {
    const current = safeNumber(saving.current);
    const target = safeNumber(saving.target);
    const progress = getSafePercentage(current, target);
    const remaining = target - current;
    const progressNormalized = Math.min(progress / 100, 1);
    const progressColor = getProgressColor(progress);
    const iconName = getIcon(saving) as keyof typeof Ionicons.glyphMap;
    const isCompleted = current >= target;

    return (
      <View
        key={saving.id}
        style={tw`bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100`}
      >
        {/* Card Header */}
        <View style={tw`flex-row justify-between items-start mb-3`}>
          <View style={tw`flex-row items-center gap-2`}>
            <View
              style={[
                tw`w-10 h-10 rounded-full items-center justify-center`,
                { backgroundColor: `${progressColor}20` }, // 20% opacity
              ]}
            >
              <Ionicons name={iconName} size={20} color={progressColor} />
            </View>
            <View>
              <Text style={tw`text-base font-semibold text-gray-900`}>
                {saving.name}
              </Text>
              {saving.category && (
                <Text style={tw`text-xs text-gray-500`}>
                  {saving.category.charAt(0).toUpperCase() +
                    saving.category.slice(1)}
                </Text>
              )}
            </View>
          </View>

          <View style={tw`flex-row gap-2`}>
            <TouchableOpacity
              style={tw`w-8 h-8 rounded-lg bg-gray-100 justify-center items-center`}
              onPress={() => {
                navigation.navigate("AddSavingsTransaction", {
                  savingsId: saving.id,
                  type: "deposit",
                });
              }}
            >
              <Ionicons name="add" size={18} color="#4F46E5" />
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`w-8 h-8 rounded-lg bg-gray-100 justify-center items-center`}
              onPress={() => {
                navigation.navigate("AddSavings", {
                  editMode: true,
                  savingsData: saving,
                });
              }}
            >
              <Ionicons name="pencil-outline" size={18} color="#4F46E5" />
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`w-8 h-8 rounded-lg bg-gray-100 justify-center items-center`}
              onPress={() => handleDelete(saving)}
            >
              <Ionicons name="trash-outline" size={18} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={tw`mb-4`}>
          <View style={tw`flex-row justify-between items-center mb-1`}>
            <Text style={tw`text-sm font-semibold text-gray-900`}>
              {formatCurrency(current)} / {formatCurrency(target)}
            </Text>
            <Text
              style={tw`text-sm font-semibold ${
                isCompleted ? "text-emerald-600" : "text-indigo-600"
              }`}
            >
              {progress.toFixed(1)}%
            </Text>
          </View>
          <ProgressBar
            progress={progressNormalized}
            color={progressColor}
            style={tw`h-2 rounded-full`}
          />
          <View style={tw`flex-row justify-between mt-1`}>
            <Text style={tw`text-xs text-gray-400`}>Rp0</Text>
            <Text style={tw`text-xs text-gray-400`}>
              {formatCurrency(target)}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <View>
            <Text style={tw`text-xs text-gray-600 mb-1`}>Sisa</Text>
            <Text
              style={tw`text-sm font-semibold ${
                remaining >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {formatCurrency(remaining)}
            </Text>
          </View>

          <View>
            <Text style={tw`text-xs text-gray-600 mb-1`}>Deadline</Text>
            <Text
              style={tw`text-sm font-semibold ${
                saving.deadline ? "text-gray-900" : "text-gray-500"
              }`}
            >
              {formatDeadline(saving.deadline)}
            </Text>
          </View>

          <TouchableOpacity
            style={tw`px-3 py-1.5 rounded-lg bg-indigo-50`}
            onPress={() =>
              navigation.navigate("SavingsDetail", { savingsId: saving.id })
            }
          >
            <Text style={tw`text-xs font-medium text-indigo-700`}>Detail</Text>
          </TouchableOpacity>
        </View>

        {/* Status Badge */}
        <View style={tw`mt-2 pt-3 border-t border-gray-200`}>
          <View style={tw`flex-row justify-between items-center`}>
            <View style={tw`flex-row items-center gap-2`}>
              {isCompleted ? (
                <View style={tw`flex-row items-center gap-1`}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={tw`text-xs font-medium text-emerald-700`}>
                    Tercapai
                  </Text>
                </View>
              ) : (
                <View style={tw`flex-row items-center gap-1`}>
                  <Ionicons name="time" size={16} color={progressColor} />
                  <Text
                    style={[tw`text-xs font-medium`, { color: progressColor }]}
                  >
                    {progress >= 50 ? "Sedang berjalan" : "Baru dimulai"}
                  </Text>
                </View>
              )}
            </View>

            <Text style={tw`text-xs text-gray-500`}>
              Dibuat: {formatDateShort(saving.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {/* Header */}
      <View style={tw`px-4 pt-3 pb-4 bg-white border-b border-gray-200`}>
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <View>
            <Text style={tw`text-2xl font-bold text-gray-900`}>Tabungan</Text>
            <Text style={tw`text-sm text-gray-600 mt-0.5`}>
              {savings.length} target tabungan
            </Text>
          </View>
          <TouchableOpacity
            style={tw`w-10 h-10 rounded-full bg-indigo-600 justify-center items-center`}
            onPress={() => navigation.navigate("AddSavings")}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Overall Stats - FIXED: Tanpa gradient */}
        <View style={tw`bg-indigo-50 rounded-xl p-4 border border-indigo-100`}>
          <Text style={tw`text-sm font-semibold text-gray-900 mb-3`}>
            Progress Tabungan Total
          </Text>

          <View style={tw`mb-3`}>
            <View style={tw`flex-row justify-between items-center mb-1`}>
              <Text style={tw`text-sm font-medium text-gray-700`}>
                {formatCurrency(totalStats.totalCurrent)} /{" "}
                {formatCurrency(totalStats.totalTarget)}
              </Text>
              <Text style={tw`text-sm font-bold text-indigo-600`}>
                {totalStats.overallProgress.toFixed(1)}%
              </Text>
            </View>
            <ProgressBar
              progress={Math.min(totalStats.overallProgress / 100, 1)}
              color="#4F46E5"
              style={tw`h-2 rounded-full`}
            />
          </View>

          <View style={tw`flex-row justify-between`}>
            <View style={tw`items-center`}>
              <Text style={tw`text-xs text-gray-600 mb-1`}>Aktif</Text>
              <Text style={tw`text-lg font-bold text-indigo-600`}>
                {totalStats.activeCount}
              </Text>
            </View>

            <View style={tw`w-px h-8 bg-gray-300`} />

            <View style={tw`items-center`}>
              <Text style={tw`text-xs text-gray-600 mb-1`}>Tercapai</Text>
              <Text style={tw`text-lg font-bold text-emerald-600`}>
                {totalStats.completedCount}
              </Text>
            </View>

            <View style={tw`w-px h-8 bg-gray-300`} />

            <View style={tw`items-center`}>
              <Text style={tw`text-xs text-gray-600 mb-1`}>Total</Text>
              <Text style={tw`text-lg font-bold text-gray-900`}>
                {savings.length}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={tw`bg-white border-b border-gray-200 py-2 px-4`}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tw`flex-row gap-2`}
        >
          {[
            { key: "all", label: "Semua", count: savings.length },
            { key: "active", label: "Aktif", count: totalStats.activeCount },
            {
              key: "completed",
              label: "Tercapai",
              count: totalStats.completedCount,
            },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                tw`px-3 py-1.5 rounded-full`,
                filter === tab.key ? tw`bg-indigo-100` : tw`bg-gray-100`,
              ]}
              onPress={() => setFilter(tab.key as any)}
            >
              <Text
                style={[
                  tw`text-xs font-medium`,
                  filter === tab.key ? tw`text-indigo-700` : tw`text-gray-700`,
                ]}
              >
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Savings List */}
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4 pb-8`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredSavings.length === 0
          ? renderEmptyState()
          : filteredSavings.map(renderSavingsCard)}
      </ScrollView>
    </View>
  );
};

export default SavingsScreen;
