import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";

const ProfileScreen: React.FC = () => {
  const isFocused = useIsFocused();
  const { state, clearAllData, debugStorage, isLoading } = useAppContext();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userStats, setUserStats] = useState({
    transactions: 0,
    budgets: 0,
    savings: 0,
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });

  // Load user stats
  useEffect(() => {
    if (isFocused) {
      console.log("🔄 ProfileScreen: Loading stats");
      loadStats();
    }
  }, [isFocused, state]);

  const loadStats = async () => {
    try {
      setIsRefreshing(true);
      console.log(`📊 Loading stats from context`);

      // Ambil data dari context state
      const statsFromContext = {
        transactions: state.transactions?.length || 0,
        budgets: state.budgets?.length || 0,
        savings: state.savings?.length || 0,
        totalIncome: state.totalIncome || 0,
        totalExpense: state.totalExpense || 0,
        balance: state.balance || 0,
      };

      console.log("📈 Stats from context:", statsFromContext);

      // Update state
      setUserStats(statsFromContext);
      console.log("✅ Stats updated successfully");
    } catch (error) {
      console.error("❌ Error loading stats:", error);

      // Fallback
      setUserStats({
        transactions: state.transactions?.length || 0,
        budgets: state.budgets?.length || 0,
        savings: state.savings?.length || 0,
        totalIncome: state.totalIncome || 0,
        totalExpense: state.totalExpense || 0,
        balance: state.balance || 0,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Clear all data
  const handleClearAllData = useCallback(() => {
    Alert.alert(
      "Hapus Semua Data",
      "Apakah Anda yakin ingin menghapus SEMUA data?\n\nSemua transaksi, anggaran, dan tabungan akan dihapus permanen.",
      [
        { text: "Batalkan", style: "cancel" },
        {
          text: "Hapus Semua",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert("✅ Berhasil", "Semua data telah dihapus");
            } catch (error) {
              Alert.alert("Error", "Gagal menghapus data");
            }
          },
        },
      ]
    );
  }, [clearAllData]);

  // Debug storage
  const handleDebugStorage = async () => {
    await debugStorage();
    Alert.alert("Debug", "Check console for storage debug info");
  };

  // Export data (placeholder)
  const handleExportData = () => {
    Alert.alert("Ekspor Data", "Fitur ekspor data akan segera hadir!");
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <ScrollView
        style={tw`flex-1`}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={loadStats}
            colors={["#4F46E5"]}
            tintColor="#4F46E5"
          />
        }
      >
        {/* Header */}
        <View style={tw`bg-indigo-600 p-6`}>
          <View style={tw`flex-row items-center`}>
            <View
              style={tw`w-20 h-20 bg-white rounded-full items-center justify-center shadow-lg`}
            >
              <Text style={tw`text-3xl`}>👤</Text>
            </View>
            <View style={tw`ml-4 flex-1`}>
              <Text style={tw`text-white text-2xl font-bold`}>
                Pengguna Saya
              </Text>
              <Text style={tw`text-indigo-100 text-sm mt-1`}>
                Aplikasi Manajemen Keuangan Pribadi
              </Text>
              <Text style={tw`text-indigo-200 text-xs mt-1`}>
                Data tersimpan lokal di perangkat Anda
              </Text>
            </View>
          </View>

          {/* Refresh Button */}
          <TouchableOpacity
            style={tw`mt-4 flex-row items-center justify-center bg-indigo-700 py-2 rounded-lg`}
            onPress={loadStats}
            disabled={isRefreshing}
          >
            <Ionicons
              name="refresh"
              size={16}
              color="#FFFFFF"
              style={tw`mr-2`}
            />
            <Text style={tw`text-white text-sm font-medium`}>
              {isRefreshing ? "Memuat..." : "Refresh Statistik"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={tw`px-4 -mt-4`}>
          <View
            style={tw`bg-white rounded-xl p-4 shadow-lg mb-4 border border-gray-100`}
          >
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-gray-900 font-bold text-lg`}>
                Statistik Keuangan
              </Text>
              <View style={tw`px-2 py-1 bg-indigo-100 rounded-full`}>
                <Text style={tw`text-xs font-medium text-indigo-700`}>
                  Real-time
                </Text>
              </View>
            </View>

            <View style={tw`flex-row justify-between mb-4`}>
              <View style={tw`items-center`}>
                <Text style={tw`text-2xl font-bold text-indigo-600`}>
                  {userStats.transactions}
                </Text>
                <Text style={tw`text-gray-600 text-sm`}>Transaksi</Text>
              </View>

              <View style={tw`items-center`}>
                <Text style={tw`text-2xl font-bold text-green-600`}>
                  {userStats.budgets}
                </Text>
                <Text style={tw`text-gray-600 text-sm`}>Anggaran</Text>
              </View>

              <View style={tw`items-center`}>
                <Text style={tw`text-2xl font-bold text-purple-600`}>
                  {userStats.savings}
                </Text>
                <Text style={tw`text-gray-600 text-sm`}>Tabungan</Text>
              </View>
            </View>

            {/* Financial Summary */}
            <View style={tw`pt-4 border-t border-gray-100`}>
              <Text style={tw`text-gray-700 font-medium mb-2`}>
                Ringkasan Keuangan
              </Text>

              <View>
                <View style={tw`flex-row justify-between mb-2`}>
                  <Text style={tw`text-gray-600 text-sm`}>Total Pemasukan</Text>
                  <Text style={tw`text-emerald-600 text-sm font-medium`}>
                    {formatCurrency(userStats.totalIncome)}
                  </Text>
                </View>

                <View style={tw`flex-row justify-between mb-2`}>
                  <Text style={tw`text-gray-600 text-sm`}>
                    Total Pengeluaran
                  </Text>
                  <Text style={tw`text-red-600 text-sm font-medium`}>
                    {formatCurrency(userStats.totalExpense)}
                  </Text>
                </View>

                <View style={tw`flex-row justify-between`}>
                  <Text style={tw`text-gray-600 text-sm`}>Saldo Bersih</Text>
                  <Text style={tw`text-indigo-600 text-sm font-medium`}>
                    {formatCurrency(userStats.balance)}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={tw`text-xs text-gray-400 text-center mt-4`}>
              Terakhir diperbarui: {new Date().toLocaleTimeString("id-ID")}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={tw`px-4`}>
          {/* Export Data */}
          <TouchableOpacity
            style={tw`bg-white p-4 rounded-xl mb-3 flex-row items-center shadow-sm border border-gray-100`}
            onPress={handleExportData}
            disabled={isLoading}
          >
            <View
              style={tw`w-10 h-10 bg-blue-50 rounded-lg items-center justify-center mr-3`}
            >
              <Ionicons name="download-outline" size={20} color="#3B82F6" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-gray-900 font-medium`}>Ekspor Data</Text>
              <Text style={tw`text-gray-500 text-sm`}>
                Backup data ke file (Coming Soon)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Debug Storage */}
          <TouchableOpacity
            style={tw`bg-white p-4 rounded-xl mb-3 flex-row items-center shadow-sm border border-gray-100`}
            onPress={handleDebugStorage}
            disabled={isLoading}
          >
            <View
              style={tw`w-10 h-10 bg-green-50 rounded-lg items-center justify-center mr-3`}
            >
              <Ionicons name="bug-outline" size={20} color="#10B981" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-gray-900 font-medium`}>Debug Storage</Text>
              <Text style={tw`text-gray-500 text-sm`}>
                Cek status penyimpanan (Developer)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Clear All Data - DANGER ZONE */}
          <View style={tw`mt-6 border-t border-gray-200 pt-4`}>
            <Text style={tw`text-red-600 font-medium mb-3`}>Zona Bahaya</Text>

            <TouchableOpacity
              style={tw`bg-red-50 p-4 rounded-xl flex-row items-center border border-red-100`}
              onPress={handleClearAllData}
              disabled={isLoading || isRefreshing}
            >
              <View
                style={tw`w-10 h-10 bg-red-100 rounded-lg items-center justify-center mr-3`}
              >
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-red-700 font-medium`}>
                  Hapus Semua Data
                </Text>
                <Text style={tw`text-red-500 text-sm`}>
                  Hapus semua transaksi, anggaran, dan tabungan
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#DC2626" />
            </TouchableOpacity>

            <Text style={tw`text-red-400 text-xs mt-2 text-center`}>
              Tindakan ini tidak dapat dibatalkan
            </Text>
          </View>
        </View>

        {/* App Info */}
        <View style={tw`px-4 mt-6 mb-8`}>
          <View style={tw`bg-gray-50 p-3 rounded-xl border border-gray-200`}>
            <Text style={tw`text-xs text-gray-500 text-center`}>
              Aplikasi MyMoney v1.0.0
            </Text>
            <Text style={tw`text-xs text-gray-400 text-center mt-1`}>
              Data tersimpan lokal di perangkat Anda
            </Text>
            <Text style={tw`text-xs text-gray-400 text-center mt-1`}>
              {userStats.transactions} transaksi • {userStats.budgets} anggaran
              • {userStats.savings} tabungan
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
