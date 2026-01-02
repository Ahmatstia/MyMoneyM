// File: src/screens/Home/HomeScreen.tsx
import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { formatCurrency } from "../../utils/calculations";

type IconName = keyof typeof Ionicons.glyphMap;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state } = useAppContext();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 19) return "Selamat Sore";
    return "Selamat Malam";
  };

  const getCurrentDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return now.toLocaleDateString("id-ID", options);
  };

  const quickActions: Array<{
    id: number;
    title: string;
    icon: IconName;
    color: string;
    onPress: () => void;
  }> = [
    {
      id: 1,
      title: "Transaksi",
      icon: "swap-horizontal",
      color: "#4F46E5",
      onPress: () => navigation.navigate("Transactions"),
    },
    {
      id: 2,
      title: "Analitik",
      icon: "stats-chart-outline",
      color: "#10B981",
      onPress: () => navigation.navigate("Analytics"),
    },
    {
      id: 3,
      title: "Anggaran",
      icon: "pie-chart-outline",
      color: "#F59E0B",
      onPress: () => navigation.navigate("Budget"),
    },
    {
      id: 4,
      title: "Tabungan",
      icon: "wallet-outline",
      color: "#8B5CF6",
      onPress: () => navigation.navigate("Savings"),
    },
  ];

  const transactionIcons: Record<string, IconName> = {
    Makanan: "restaurant-outline",
    Transportasi: "car-outline",
    Belanja: "cart-outline",
    Hiburan: "film-outline",
    Kesehatan: "medical-outline",
    Pendidikan: "school-outline",
    Gaji: "cash-outline",
    Investasi: "trending-up-outline",
    Lainnya: "ellipsis-horizontal-outline",
  };

  const getTransactionIcon = (category: string): IconName => {
    return transactionIcons[category] || "receipt-outline";
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-5 pb-24`}
      >
        {/* Header */}
        <View style={tw`flex-row justify-between items-center pt-3 pb-3`}>
          <View>
            <Text style={tw`text-gray-800 text-xl font-bold`}>
              {getGreeting()}
            </Text>
            <Text style={tw`text-gray-500 text-sm mt-0.5`}>
              Selamat datang kembali
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => console.log("Notification pressed")}
            style={tw`relative`}
          >
            <Ionicons name="notifications-outline" size={22} color="#4B5563" />
            <View
              style={tw`absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full`}
            />
          </TouchableOpacity>
        </View>

        {/* Date */}
        <Text style={tw`text-gray-400 text-xs mb-6`}>{getCurrentDate()}</Text>

        {/* Balance Card */}
        <View
          style={tw`bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100`}
        >
          <Text
            style={tw`text-gray-500 text-xs font-medium uppercase tracking-wider mb-2`}
          >
            SALDO ANDA
          </Text>
          <Text style={tw`text-gray-800 text-2xl font-bold mb-5`}>
            {formatCurrency(state.balance)}
          </Text>

          <View style={tw`flex-row items-center`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-gray-500 text-xs mb-1`}>Pemasukan</Text>
              <Text style={tw`text-emerald-600 text-base font-semibold`}>
                {formatCurrency(state.totalIncome)}
              </Text>
            </View>

            <View style={tw`w-px h-10 bg-gray-200 mx-4`} />

            <View style={tw`flex-1`}>
              <Text style={tw`text-gray-500 text-xs mb-1`}>Pengeluaran</Text>
              <Text style={tw`text-red-500 text-base font-semibold`}>
                {formatCurrency(state.totalExpense)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={tw`flex-row justify-between mb-8`}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={tw`items-center w-1/4`}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View
                style={[
                  tw`w-12 h-12 rounded-xl items-center justify-center mb-2`,
                  { backgroundColor: `${action.color}15` },
                ]}
              >
                <Ionicons name={action.icon} size={20} color={action.color} />
              </View>
              <Text style={tw`text-gray-700 text-xs font-medium text-center`}>
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Transactions Header */}
        <View style={tw`flex-row justify-between items-center mb-4`}>
          <Text style={tw`text-gray-800 text-lg font-semibold`}>
            Transaksi Terbaru
          </Text>
          {state.transactions.length > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate("Transactions")}
            >
              <Text style={tw`text-indigo-600 text-sm font-medium`}>
                Lihat Semua
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Transactions List */}
        {state.transactions.length > 0 ? (
          <View
            style={tw`bg-white rounded-2xl mb-6 overflow-hidden border border-gray-100`}
          >
            {state.transactions.slice(0, 5).map((transaction, index) => (
              <TouchableOpacity
                key={transaction.id}
                style={[
                  tw`flex-row justify-between items-center p-4`,
                  index < state.transactions.slice(0, 5).length - 1 &&
                    tw`border-b border-gray-100`,
                ]}
                onPress={() =>
                  navigation.navigate("AddTransaction", {
                    editMode: true,
                    transactionData: transaction,
                  })
                }
                activeOpacity={0.7}
              >
                <View style={tw`flex-row items-center flex-1`}>
                  <View
                    style={[
                      tw`w-10 h-10 rounded-lg items-center justify-center mr-3`,
                      transaction.type === "income"
                        ? tw`bg-emerald-50`
                        : tw`bg-red-50`,
                    ]}
                  >
                    <Ionicons
                      name={getTransactionIcon(transaction.category)}
                      size={18}
                      color={
                        transaction.type === "income" ? "#10B981" : "#EF4444"
                      }
                    />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-gray-800 text-sm font-medium mb-0.5`}>
                      {transaction.category}
                    </Text>
                    <Text style={tw`text-gray-500 text-xs mb-1`}>
                      {transaction.description || "Tidak ada deskripsi"}
                    </Text>
                    <Text style={tw`text-gray-400 text-xs`}>
                      {new Date(transaction.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    tw`text-sm font-semibold`,
                    transaction.type === "income"
                      ? tw`text-emerald-600`
                      : tw`text-red-500`,
                  ]}
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View
            style={tw`bg-white rounded-2xl p-8 items-center mb-6 border border-gray-100`}
          >
            <View
              style={tw`w-16 h-16 rounded-xl bg-gray-50 items-center justify-center mb-4`}
            >
              <Ionicons name="receipt-outline" size={28} color="#9CA3AF" />
            </View>
            <Text style={tw`text-gray-800 text-base font-semibold mb-1`}>
              Belum ada transaksi
            </Text>
            <Text style={tw`text-gray-500 text-sm text-center mb-5`}>
              Mulai catat keuangan Anda
            </Text>
            <TouchableOpacity
              style={tw`bg-indigo-600 px-5 py-2.5 rounded-lg`}
              onPress={() => navigation.navigate("AddTransaction")}
            >
              <Text style={tw`text-white text-sm font-medium`}>
                Tambah Transaksi
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Budget Summary */}
        {state.budgets.length > 0 && (
          <>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-gray-800 text-lg font-semibold`}>
                Anggaran
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Budget")}>
                <Text style={tw`text-indigo-600 text-sm font-medium`}>
                  Kelola
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={tw`bg-white rounded-2xl p-4 mb-6 border border-gray-100`}
            >
              {state.budgets.slice(0, 3).map((budget) => {
                const progress = (budget.spent / budget.limit) * 100;
                const progressColor =
                  progress > 90
                    ? "#EF4444"
                    : progress > 70
                    ? "#F59E0B"
                    : "#10B981";

                return (
                  <View key={budget.id} style={tw`mb-4 last:mb-0`}>
                    <View
                      style={tw`flex-row justify-between items-center mb-2`}
                    >
                      <Text style={tw`text-gray-700 text-sm font-medium`}>
                        {budget.category}
                      </Text>
                      <Text style={tw`text-gray-500 text-xs`}>
                        {formatCurrency(budget.spent)} /{" "}
                        {formatCurrency(budget.limit)}
                      </Text>
                    </View>
                    <View
                      style={tw`h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1`}
                    >
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
                    <Text style={tw`text-gray-400 text-xs text-right`}>
                      {Math.round(progress)}%
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Spacer untuk floating button */}
        <View style={tw`h-16`} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={tw`absolute bottom-6 right-5 w-14 h-14 bg-indigo-600 rounded-2xl items-center justify-center shadow-lg`}
        onPress={() => navigation.navigate("AddTransaction")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default HomeScreen;
