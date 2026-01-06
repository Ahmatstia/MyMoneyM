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
import { Colors } from "../../theme/theme";

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
    if (progress >= 100) return Colors.success; // hijau
    if (progress >= 75) return Colors.info; // biru
    if (progress >= 50) return Colors.warning; // kuning
    if (progress >= 25) return Colors.error; // merah
    return Colors.textTertiary; // abu-abu
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
      <Ionicons name="wallet-outline" size={48} color={Colors.textTertiary} />
      <Text
        style={tw`text-lg font-semibold text-[${Colors.textPrimary}] mt-4 mb-2 text-center`}
      >
        {filter === "all" ? "Belum ada tabungan" : "Tidak ada tabungan"}
      </Text>
      <Text
        style={tw`text-sm text-[${Colors.textSecondary}] text-center mb-6 leading-5`}
      >
        {filter === "all"
          ? "Mulai dengan membuat target tabungan pertama Anda"
          : `Tidak ada tabungan dengan status "${filter}"`}
      </Text>
      {filter === "all" && (
        <TouchableOpacity
          style={tw`flex-row items-center bg-[${Colors.accent}] px-5 py-3 rounded-lg gap-2`}
          onPress={() => navigation.navigate("AddSavings")}
        >
          <Ionicons name="add-circle" size={20} color={Colors.textPrimary} />
          <Text style={tw`text-sm font-semibold text-[${Colors.textPrimary}]`}>
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
        style={tw`bg-[${Colors.surface}] rounded-xl p-4 mb-3 border border-[${Colors.border}]`}
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
              <Text
                style={tw`text-base font-semibold text-[${Colors.textPrimary}]`}
              >
                {saving.name}
              </Text>
              {saving.category && (
                <Text style={tw`text-xs text-[${Colors.textTertiary}]`}>
                  {saving.category.charAt(0).toUpperCase() +
                    saving.category.slice(1)}
                </Text>
              )}
            </View>
          </View>

          <View style={tw`flex-row gap-2`}>
            <TouchableOpacity
              style={tw`w-8 h-8 rounded-lg bg-[${Colors.surfaceLight}] justify-center items-center`}
              onPress={() => {
                navigation.navigate("AddSavingsTransaction", {
                  savingsId: saving.id,
                  type: "deposit",
                });
              }}
            >
              <Ionicons name="add" size={18} color={Colors.accent} />
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`w-8 h-8 rounded-lg bg-[${Colors.surfaceLight}] justify-center items-center`}
              onPress={() => {
                navigation.navigate("AddSavings", {
                  editMode: true,
                  savingsData: saving,
                });
              }}
            >
              <Ionicons name="pencil-outline" size={18} color={Colors.accent} />
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`w-8 h-8 rounded-lg bg-[${Colors.surfaceLight}] justify-center items-center`}
              onPress={() => handleDelete(saving)}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={tw`mb-4`}>
          <View style={tw`flex-row justify-between items-center mb-1`}>
            <Text
              style={tw`text-sm font-semibold text-[${Colors.textPrimary}]`}
            >
              {formatCurrency(current)} / {formatCurrency(target)}
            </Text>
            <Text
              style={tw`text-sm font-semibold ${
                isCompleted
                  ? "text-[${Colors.success}]"
                  : "text-[${Colors.accent}]"
              }`}
            >
              {progress.toFixed(1)}%
            </Text>
          </View>
          <ProgressBar
            progress={progressNormalized}
            color={progressColor}
            style={tw`h-2 rounded-full bg-[${Colors.surfaceLight}]`}
          />
          <View style={tw`flex-row justify-between mt-1`}>
            <Text style={tw`text-xs text-[${Colors.textTertiary}]`}>Rp0</Text>
            <Text style={tw`text-xs text-[${Colors.textTertiary}]`}>
              {formatCurrency(target)}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <View>
            <Text style={tw`text-xs text-[${Colors.textSecondary}] mb-1`}>
              Sisa
            </Text>
            <Text
              style={tw`text-sm font-semibold ${
                remaining >= 0
                  ? "text-[${Colors.success}]"
                  : "text-[${Colors.error}]"
              }`}
            >
              {formatCurrency(remaining)}
            </Text>
          </View>

          <View>
            <Text style={tw`text-xs text-[${Colors.textSecondary}] mb-1`}>
              Deadline
            </Text>
            <Text
              style={tw`text-sm font-semibold ${
                saving.deadline
                  ? "text-[${Colors.textPrimary}]"
                  : "text-[${Colors.textTertiary}]"
              }`}
            >
              {formatDeadline(saving.deadline)}
            </Text>
          </View>

          <TouchableOpacity
            style={tw`px-3 py-1.5 rounded-lg bg-[${Colors.accent}]/20`}
            onPress={() =>
              navigation.navigate("SavingsDetail", { savingsId: saving.id })
            }
          >
            <Text style={tw`text-xs font-medium text-[${Colors.accent}]`}>
              Detail
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status Badge */}
        <View style={tw`mt-2 pt-3 border-t border-[${Colors.border}]`}>
          <View style={tw`flex-row justify-between items-center`}>
            <View style={tw`flex-row items-center gap-2`}>
              {isCompleted ? (
                <View style={tw`flex-row items-center gap-1`}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={Colors.success}
                  />
                  <Text
                    style={tw`text-xs font-medium text-[${Colors.success}]`}
                  >
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

            <Text style={tw`text-xs text-[${Colors.textTertiary}]`}>
              Dibuat: {formatDateShort(saving.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={tw`flex-1 bg-[${Colors.background}]`}>
      {/* Header */}
      <View
        style={tw`px-4 pt-3 pb-4 bg-[${Colors.surface}] border-b border-[${Colors.border}]`}
      >
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <View>
            <Text style={tw`text-2xl font-bold text-[${Colors.textPrimary}]`}>
              Tabungan
            </Text>
            <Text style={tw`text-sm text-[${Colors.textSecondary}] mt-0.5`}>
              {savings.length} target tabungan
            </Text>
          </View>
          <TouchableOpacity
            style={tw`w-10 h-10 rounded-full bg-[${Colors.accent}] justify-center items-center`}
            onPress={() => navigation.navigate("AddSavings")}
          >
            <Ionicons name="add" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Overall Stats - FIXED: Tanpa gradient */}
        <View
          style={tw`bg-[${Colors.surfaceLight}] rounded-xl p-4 border border-[${Colors.border}]`}
        >
          <Text
            style={tw`text-sm font-semibold text-[${Colors.textPrimary}] mb-3`}
          >
            Progress Tabungan Total
          </Text>

          <View style={tw`mb-3`}>
            <View style={tw`flex-row justify-between items-center mb-1`}>
              <Text
                style={tw`text-sm font-medium text-[${Colors.textPrimary}]`}
              >
                {formatCurrency(totalStats.totalCurrent)} /{" "}
                {formatCurrency(totalStats.totalTarget)}
              </Text>
              <Text style={tw`text-sm font-bold text-[${Colors.accent}]`}>
                {totalStats.overallProgress.toFixed(1)}%
              </Text>
            </View>
            <ProgressBar
              progress={Math.min(totalStats.overallProgress / 100, 1)}
              color={Colors.accent}
              style={tw`h-2 rounded-full bg-[${Colors.surfaceLight}]`}
            />
          </View>

          <View style={tw`flex-row justify-between`}>
            <View style={tw`items-center`}>
              <Text style={tw`text-xs text-[${Colors.textSecondary}] mb-1`}>
                Aktif
              </Text>
              <Text style={tw`text-lg font-bold text-[${Colors.accent}]`}>
                {totalStats.activeCount}
              </Text>
            </View>

            <View style={tw`w-px h-8 bg-[${Colors.border}]`} />

            <View style={tw`items-center`}>
              <Text style={tw`text-xs text-[${Colors.textSecondary}] mb-1`}>
                Tercapai
              </Text>
              <Text style={tw`text-lg font-bold text-[${Colors.success}]`}>
                {totalStats.completedCount}
              </Text>
            </View>

            <View style={tw`w-px h-8 bg-[${Colors.border}]`} />

            <View style={tw`items-center`}>
              <Text style={tw`text-xs text-[${Colors.textSecondary}] mb-1`}>
                Total
              </Text>
              <Text style={tw`text-lg font-bold text-[${Colors.textPrimary}]`}>
                {savings.length}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View
        style={tw`bg-[${Colors.surface}] border-b border-[${Colors.border}] py-2 px-4`}
      >
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
                filter === tab.key
                  ? tw`bg-[${Colors.accent}]/20`
                  : tw`bg-[${Colors.surfaceLight}]`,
              ]}
              onPress={() => setFilter(tab.key as any)}
            >
              <Text
                style={[
                  tw`text-xs font-medium`,
                  filter === tab.key
                    ? tw`text-[${Colors.accent}]`
                    : tw`text-[${Colors.textSecondary}]`,
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
