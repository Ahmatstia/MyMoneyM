// File: src/screens/SavingsDetailScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { Text, ProgressBar } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import {
  formatCurrency,
  safeNumber,
  getSafePercentage,
} from "../../utils/calculations";
import { formatDate } from "../../utils/formatters";

const SavingsDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { savingsId } = route.params;

  const { state, deleteSavings, refreshData, getSavingsTransactions } =
    useAppContext();
  const [refreshing, setRefreshing] = useState(false);

  // Temukan savings berdasarkan ID
  const saving = state.savings?.find((s) => s.id === savingsId);
  const savingsTransactions = getSavingsTransactions(savingsId);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  if (!saving) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50 p-4`}>
        <Ionicons name="warning-outline" size={48} color="#EF4444" />
        <Text style={tw`text-lg font-semibold text-gray-900 mt-4 mb-2`}>
          Tabungan tidak ditemukan
        </Text>
        <TouchableOpacity
          style={tw`mt-4 px-4 py-2 bg-indigo-600 rounded-lg`}
          onPress={() => navigation.goBack()}
        >
          <Text style={tw`text-white font-medium`}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const current = safeNumber(saving.current);
  const target = safeNumber(saving.target);
  const progress = getSafePercentage(current, target);
  const remaining = target - current;
  const isCompleted = current >= target;

  // Hitung statistik transaksi
  const stats = useMemo(() => {
    const deposits = savingsTransactions
      .filter((t) => t.type === "deposit" || t.type === "initial")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0);

    const withdrawals = savingsTransactions
      .filter((t) => t.type === "withdrawal")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0);

    const lastTransaction =
      savingsTransactions.length > 0
        ? savingsTransactions[savingsTransactions.length - 1]
        : null;

    return {
      deposits,
      withdrawals,
      transactionCount: savingsTransactions.length,
      lastTransactionDate: lastTransaction?.date,
    };
  }, [savingsTransactions]);

  // Format deadline
  const formatDeadlineInfo = () => {
    if (!saving.deadline) return { text: "Tanpa deadline", color: "#6B7280" };

    try {
      const deadlineDate = new Date(saving.deadline);
      const today = new Date();
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return { text: "Terlambat", color: "#DC2626" };
      if (diffDays === 0) return { text: "Hari ini", color: "#EF4444" };
      if (diffDays <= 7)
        return { text: `${diffDays} hari lagi`, color: "#F59E0B" };
      if (diffDays <= 30)
        return {
          text: `${Math.floor(diffDays / 7)} minggu lagi`,
          color: "#3B82F6",
        };
      return {
        text: `${Math.floor(diffDays / 30)} bulan lagi`,
        color: "#10B981",
      };
    } catch {
      return { text: saving.deadline, color: "#6B7280" };
    }
  };

  const deadlineInfo = formatDeadlineInfo();

  const handleDelete = () => {
    Alert.alert(
      "Hapus Tabungan",
      `Hapus tabungan "${saving.name}"? Semua riwayat transaksi juga akan dihapus.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSavings(saving.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Gagal menghapus tabungan");
            }
          },
        },
      ]
    );
  };

  // Render transaction item yang lebih minimalis
  const renderTransactionItem = (transaction: any, index: number) => {
    const isDeposit =
      transaction.type === "deposit" || transaction.type === "initial";

    return (
      <View
        key={transaction.id}
        style={[
          tw`py-3 px-4`,
          index < savingsTransactions.length - 1 &&
            tw`border-b border-gray-100`,
        ]}
      >
        <View style={tw`flex-row justify-between items-center`}>
          <View style={tw`flex-row items-center gap-3`}>
            <View
              style={[
                tw`w-10 h-10 rounded-full items-center justify-center`,
                isDeposit ? tw`bg-emerald-50` : tw`bg-red-50`,
              ]}
            >
              <Ionicons
                name={isDeposit ? "arrow-down" : "arrow-up"}
                size={18}
                color={isDeposit ? "#10B981" : "#DC2626"}
              />
            </View>
            <View>
              <Text style={tw`text-sm font-medium text-gray-900`}>
                {isDeposit ? "Setoran" : "Penarikan"}
              </Text>
              <Text style={tw`text-xs text-gray-500 mt-0.5`}>
                {formatDate(transaction.date)}
              </Text>
            </View>
          </View>

          <View style={tw`items-end`}>
            <Text
              style={[
                tw`text-base font-semibold`,
                isDeposit ? tw`text-emerald-600` : tw`text-red-600`,
              ]}
            >
              {isDeposit ? "+" : "-"} {formatCurrency(transaction.amount)}
            </Text>
            <Text style={tw`text-xs text-gray-500 mt-0.5`}>
              Saldo: {formatCurrency(transaction.newBalance)}
            </Text>
          </View>
        </View>
        {transaction.note && (
          <Text style={tw`text-xs text-gray-400 mt-2 ml-13`}>
            {transaction.note}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {/* Header - Super Minimalis */}
      <View style={tw`px-4 pt-2 pb-3 bg-white`}>
        {/* Navigation Bar */}
        <View style={tw`flex-row justify-between items-center mb-2`}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2`}>
            <Ionicons name="chevron-back" size={22} color="#4F46E5" />
          </TouchableOpacity>

          <View style={tw`flex-row gap-1`}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("AddSavings", {
                  editMode: true,
                  savingsData: saving,
                });
              }}
              style={tw`p-2`}
            >
              <Ionicons name="create-outline" size={20} color="#4F46E5" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDelete} style={tw`p-2`}>
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Savings Info - Ultra Minimalis */}
        <View style={tw`items-center`}>
          <View
            style={[
              tw`w-14 h-14 rounded-full items-center justify-center mb-2`,
              { backgroundColor: `${isCompleted ? "#10B981" : "#4F46E5"}10` },
            ]}
          >
            <Ionicons
              name={(saving.icon as any) || "wallet-outline"}
              size={24}
              color={isCompleted ? "#10B981" : "#4F46E5"}
            />
          </View>

          <Text style={tw`text-lg font-semibold text-gray-900 text-center`}>
            {saving.name}
          </Text>

          {saving.description && (
            <Text
              style={tw`text-xs text-gray-500 text-center mt-0.5 leading-4`}
            >
              {saving.description}
            </Text>
          )}
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={tw`pb-24`}
      >
        {/* Progress Card - Minimalis */}
        <View style={tw`mx-4 mt-4`}>
          {/* Header Progress */}
          <View style={tw`flex-row justify-between items-center mb-3`}>
            <Text style={tw`text-sm font-medium text-gray-700`}>
              Progress Tabungan
            </Text>
            <View style={tw`flex-row items-center gap-1`}>
              <Ionicons
                name={isCompleted ? "checkmark-circle" : "time-outline"}
                size={14}
                color={isCompleted ? "#10B981" : "#4F46E5"}
              />
              <Text
                style={tw`text-xs font-medium ${
                  isCompleted ? "text-emerald-600" : "text-indigo-600"
                }`}
              >
                {progress.toFixed(1)}%
              </Text>
            </View>
          </View>

          {/* Progress Bar dengan Label */}
          <View style={tw`mb-4`}>
            <ProgressBar
              progress={Math.min(progress / 100, 1)}
              color={isCompleted ? "#10B981" : "#4F46E5"}
              style={tw`h-1.5 rounded-full`}
            />
            <View style={tw`flex-row justify-between mt-1`}>
              <Text style={tw`text-xs text-gray-500`}>Rp0</Text>
              <Text style={tw`text-xs text-gray-500`}>
                {formatCurrency(target)}
              </Text>
            </View>
          </View>

          {/* Angka-angka Penting - Compact Layout */}
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <View style={tw`items-center`}>
              <Text style={tw`text-xs text-gray-500 mb-0.5`}>Terkumpul</Text>
              <Text style={tw`text-base font-bold text-emerald-600`}>
                {formatCurrency(current)}
              </Text>
            </View>

            <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />

            <View style={tw`items-center`}>
              <Text style={tw`text-xs text-gray-500 mb-0.5`}>Target</Text>
              <Text style={tw`text-base font-bold text-gray-900`}>
                {formatCurrency(target)}
              </Text>
            </View>

            <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />

            <View style={tw`items-center`}>
              <Text style={tw`text-xs text-gray-500 mb-0.5`}>Sisa</Text>
              <Text
                style={tw`text-base font-bold ${
                  remaining >= 0 ? "text-indigo-600" : "text-red-600"
                }`}
              >
                {formatCurrency(remaining)}
              </Text>
            </View>
          </View>

          {/* Info Status & Deadline - Single Line */}
          <View
            style={tw`flex-row justify-between items-center py-2 border-t border-gray-100`}
          >
            <View style={tw`flex-row items-center gap-2`}>
              <View
                style={[
                  tw`w-2 h-2 rounded-full`,
                  { backgroundColor: deadlineInfo.color },
                ]}
              />
              <Text style={tw`text-xs text-gray-600`}>{deadlineInfo.text}</Text>
            </View>

            <View style={tw`flex-row items-center gap-1`}>
              <View
                style={[
                  tw`w-2 h-2 rounded-full`,
                  { backgroundColor: isCompleted ? "#10B981" : "#4F46E5" },
                ]}
              />
              <Text style={tw`text-xs text-gray-600`}>
                {isCompleted ? "Selesai" : "Berlangsung"}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Cards - Super Minimalis */}
        <View style={tw`flex-row mx-4 mt-3 gap-2`}>
          <View style={tw`flex-1`}>
            <View style={tw`bg-emerald-50 rounded-lg p-3`}>
              <View style={tw`flex-row items-center justify-between mb-1`}>
                <Text style={tw`text-xs font-medium text-emerald-700`}>
                  Setoran
                </Text>
                <Ionicons name="arrow-down" size={12} color="#10B981" />
              </View>
              <Text style={tw`text-sm font-bold text-emerald-600`}>
                {formatCurrency(stats.deposits)}
              </Text>
            </View>
          </View>

          <View style={tw`flex-1`}>
            <View style={tw`bg-red-50 rounded-lg p-3`}>
              <View style={tw`flex-row items-center justify-between mb-1`}>
                <Text style={tw`text-xs font-medium text-red-700`}>
                  Penarikan
                </Text>
                <Ionicons name="arrow-up" size={12} color="#DC2626" />
              </View>
              <Text style={tw`text-sm font-bold text-red-600`}>
                {formatCurrency(stats.withdrawals)}
              </Text>
            </View>
          </View>

          <View style={tw`flex-1`}>
            <View style={tw`bg-gray-50 rounded-lg p-3`}>
              <View style={tw`flex-row items-center justify-between mb-1`}>
                <Text style={tw`text-xs font-medium text-gray-700`}>
                  Transaksi
                </Text>
                <Ionicons name="receipt-outline" size={12} color="#6B7280" />
              </View>
              <Text style={tw`text-sm font-bold text-gray-900`}>
                {stats.transactionCount}
              </Text>
            </View>
          </View>
        </View>

        {/* Transactions Section */}
        <View style={tw`bg-white mx-4 mt-4 rounded-xl border border-gray-100`}>
          <View style={tw`px-4 py-3 border-b border-gray-100`}>
            <View style={tw`flex-row justify-between items-center`}>
              <Text style={tw`text-base font-semibold text-gray-900`}>
                Riwayat Transaksi
              </Text>
              {savingsTransactions.length > 0 && (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("SavingsHistory", { savingsId })
                  }
                >
                  <Text style={tw`text-sm text-indigo-600 font-medium`}>
                    Lihat Semua
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {savingsTransactions.length === 0 ? (
            <View style={tw`py-8 px-4 items-center`}>
              <View
                style={tw`w-16 h-16 rounded-full bg-gray-50 items-center justify-center mb-3`}
              >
                <Ionicons name="receipt-outline" size={24} color="#9CA3AF" />
              </View>
              <Text style={tw`text-base font-semibold text-gray-900 mb-2`}>
                Belum ada transaksi
              </Text>
              <Text style={tw`text-sm text-gray-500 text-center mb-4`}>
                Mulai dengan menambahkan setoran pertama
              </Text>
              <TouchableOpacity
                style={tw`px-4 py-2 bg-indigo-600 rounded-lg`}
                onPress={() => {
                  navigation.navigate("AddSavingsTransaction", {
                    savingsId: saving.id,
                    type: "deposit",
                  });
                }}
              >
                <Text style={tw`text-white font-medium`}>Tambah Setoran</Text>
              </TouchableOpacity>
            </View>
          ) : (
            savingsTransactions
              .slice(0, 10)
              .map((transaction, index) =>
                renderTransactionItem(transaction, index)
              )
          )}
        </View>

        {/* Action Buttons - Sticky di bottom scroll */}
        <View style={tw`mx-4 mt-4 mb-8`}>
          {!isCompleted && (
            <TouchableOpacity
              style={tw`bg-indigo-600 rounded-xl py-3 items-center shadow-sm`}
              onPress={() => {
                navigation.navigate("AddSavingsTransaction", {
                  savingsId: saving.id,
                  type: "deposit",
                });
              }}
            >
              <Text style={tw`text-white font-semibold`}>+ Tambah Setoran</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              tw`mt-2 border border-gray-300 rounded-xl py-3 items-center`,
              !isCompleted && tw`mt-3`,
            ]}
            onPress={() => {
              navigation.navigate("AddSavingsTransaction", {
                savingsId: saving.id,
                type: "withdrawal",
              });
            }}
          >
            <Text style={tw`text-gray-700 font-medium`}>Penarikan Dana</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default SavingsDetailScreen;
