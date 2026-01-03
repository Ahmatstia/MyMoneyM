import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { formatCurrency, safeNumber } from "../../utils/calculations";
import { formatDate } from "../../utils/formatters";

const SavingsHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { savingsId } = route.params;

  const { state, refreshData, getSavingsTransactions } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "deposit" | "withdrawal">("all");

  // Temukan savings berdasarkan ID
  const saving = state.savings.find((s) => s.id === savingsId);
  const allTransactions = getSavingsTransactions(savingsId);

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

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      if (filter === "all") return true;
      if (filter === "deposit")
        return t.type === "deposit" || t.type === "initial";
      if (filter === "withdrawal") return t.type === "withdrawal";
      return true;
    });
  }, [allTransactions, filter]);

  // Hitung statistik
  const stats = useMemo(() => {
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let depositCount = 0;
    let withdrawalCount = 0;

    allTransactions.forEach((t) => {
      if (t.type === "deposit" || t.type === "initial") {
        totalDeposits += safeNumber(t.amount);
        depositCount++;
      } else if (t.type === "withdrawal") {
        totalWithdrawals += safeNumber(t.amount);
        withdrawalCount++;
      }
    });

    return {
      totalDeposits,
      totalWithdrawals,
      depositCount,
      withdrawalCount,
      totalTransactions: allTransactions.length,
      netFlow: totalDeposits - totalWithdrawals,
    };
  }, [allTransactions]);

  // Render transaction item
  const renderTransactionItem = (transaction: any, index: number) => {
    const isDeposit =
      transaction.type === "deposit" || transaction.type === "initial";

    return (
      <View
        key={transaction.id}
        style={[
          tw`flex-row justify-between items-center py-4 px-4`,
          index !== filteredTransactions.length - 1 &&
            tw`border-b border-gray-100`,
        ]}
      >
        <View style={tw`flex-row items-center gap-3`}>
          <View
            style={[
              tw`w-10 h-10 rounded-full items-center justify-center`,
              isDeposit ? tw`bg-emerald-100` : tw`bg-red-100`,
            ]}
          >
            <Ionicons
              name={isDeposit ? "arrow-down" : "arrow-up"}
              size={18}
              color={isDeposit ? "#10B981" : "#DC2626"}
            />
          </View>
          <View>
            <Text style={tw`text-sm font-semibold text-gray-900`}>
              {isDeposit ? "Setoran" : "Penarikan"}
            </Text>
            <Text style={tw`text-xs text-gray-500 mt-0.5`}>
              {formatDate(transaction.date)}
            </Text>
            {transaction.note && (
              <Text style={tw`text-xs text-gray-400 mt-1`}>
                {transaction.note}
              </Text>
            )}
          </View>
        </View>

        <View style={tw`items-end`}>
          <Text
            style={[
              tw`text-base font-bold`,
              isDeposit ? tw`text-emerald-600` : tw`text-red-600`,
            ]}
          >
            {isDeposit ? "+" : "-"} {formatCurrency(transaction.amount)}
          </Text>
          <Text style={tw`text-xs text-gray-500 mt-1`}>
            Saldo: {formatCurrency(transaction.newBalance)}
          </Text>
        </View>
      </View>
    );
  };

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, any[]> = {};

    filteredTransactions.forEach((transaction) => {
      const dateKey = transaction.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
    });

    return Object.entries(groups)
      .sort(
        ([dateA], [dateB]) =>
          new Date(dateB).getTime() - new Date(dateA).getTime()
      )
      .map(([date, transactions]) => ({
        date,
        formattedDate: formatDate(date),
        transactions: transactions.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      }));
  }, [filteredTransactions]);

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {/* Header */}
      <View style={tw`px-4 pt-3 pb-4 bg-white border-b border-gray-200`}>
        <View style={tw`flex-row items-center mb-4`}>
          <TouchableOpacity
            style={tw`w-10 h-10 rounded-full bg-gray-100 justify-center items-center`}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#4F46E5" />
          </TouchableOpacity>
          <View style={tw`ml-3 flex-1`}>
            <Text style={tw`text-lg font-bold text-gray-900`}>
              Riwayat Transaksi
            </Text>
            <Text style={tw`text-sm text-gray-600`}>{saving.name}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={tw`flex-row justify-between mb-3`}>
          <View style={tw`items-center flex-1`}>
            <Text style={tw`text-xs text-gray-600 mb-1`}>Total Setoran</Text>
            <Text style={tw`text-base font-bold text-emerald-600`}>
              {formatCurrency(stats.totalDeposits)}
            </Text>
          </View>

          <View style={tw`w-px h-8 bg-gray-300`} />

          <View style={tw`items-center flex-1`}>
            <Text style={tw`text-xs text-gray-600 mb-1`}>Total Penarikan</Text>
            <Text style={tw`text-base font-bold text-red-600`}>
              {formatCurrency(stats.totalWithdrawals)}
            </Text>
          </View>

          <View style={tw`w-px h-8 bg-gray-300`} />

          <View style={tw`items-center flex-1`}>
            <Text style={tw`text-xs text-gray-600 mb-1`}>Transaksi</Text>
            <Text style={tw`text-base font-bold text-gray-900`}>
              {stats.totalTransactions}
            </Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={tw`flex-row gap-2`}>
          {[
            { key: "all", label: "Semua", count: allTransactions.length },
            { key: "deposit", label: "Setoran", count: stats.depositCount },
            {
              key: "withdrawal",
              label: "Penarikan",
              count: stats.withdrawalCount,
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
        </View>
      </View>

      {/* Transactions List */}
      <ScrollView
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {groupedTransactions.length === 0 ? (
          <View style={tw`items-center py-12`}>
            <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
            <Text style={tw`text-base font-semibold text-gray-900 mt-4 mb-2`}>
              {filter === "all" ? "Belum ada transaksi" : "Tidak ada transaksi"}
            </Text>
            <Text style={tw`text-sm text-gray-600 text-center px-8`}>
              {filter === "all"
                ? "Mulai dengan menambahkan setoran pertama"
                : `Tidak ada transaksi dengan tipe "${filter}"`}
            </Text>
          </View>
        ) : (
          groupedTransactions.map((group) => (
            <View key={group.date} style={tw`mb-4`}>
              {/* Date Header */}
              <View style={tw`px-4 py-2 bg-gray-50`}>
                <Text style={tw`text-sm font-medium text-gray-700`}>
                  {group.formattedDate}
                </Text>
              </View>

              {/* Transactions for this date */}
              <View style={tw`bg-white`}>
                {group.transactions.map((transaction, index) =>
                  renderTransactionItem(transaction, index)
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View style={tw`p-4 bg-white border-t border-gray-200`}>
        <TouchableOpacity
          style={tw`bg-indigo-600 rounded-lg py-3 items-center`}
          onPress={() => {
            navigation.navigate("AddSavingsTransaction", {
              savingsId: saving.id,
              type: "deposit",
            });
          }}
        >
          <Text style={tw`text-white font-semibold`}>
            + Tambah Transaksi Baru
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SavingsHistoryScreen;
