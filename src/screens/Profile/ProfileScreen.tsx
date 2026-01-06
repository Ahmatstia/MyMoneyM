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
import { Colors } from "../../theme/theme";

// GUNAKAN WARNA DARI TEMA NAVY BLUE
const PRIMARY_COLOR = Colors.primary; // "#0F172A" - Navy blue gelap
const ACCENT_COLOR = Colors.accent; // "#22D3EE" - Cyan terang
const BACKGROUND_COLOR = Colors.background; // "#0F172A" - Background navy blue gelap
const SURFACE_COLOR = Colors.surface; // "#1E293B" - Permukaan navy blue medium
const TEXT_PRIMARY = Colors.textPrimary; // "#F8FAFC" - Teks utama putih
const TEXT_SECONDARY = Colors.textSecondary; // "#CBD5E1" - Teks sekunder abu-abu muda
const BORDER_COLOR = Colors.border; // "#334155" - Border navy blue lebih terang
const SUCCESS_COLOR = Colors.success; // "#10B981" - Hijau
const WARNING_COLOR = Colors.warning; // "#F59E0B" - Kuning
const ERROR_COLOR = Colors.error; // "#EF4444" - Merah
const INFO_COLOR = Colors.info; // "#3B82F6" - Biru terang
const PURPLE_COLOR = Colors.purple || "#8B5CF6"; // Ungu

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
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
      <ScrollView
        style={tw`flex-1`}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={loadStats}
            colors={[ACCENT_COLOR]}
            tintColor={ACCENT_COLOR}
          />
        }
      >
        {/* Header */}
        <View style={[tw`p-6`, { backgroundColor: PRIMARY_COLOR }]}>
          <View style={tw`flex-row items-center`}>
            <View
              style={[
                tw`w-20 h-20 rounded-full items-center justify-center shadow-lg`,
                { backgroundColor: SURFACE_COLOR },
              ]}
            >
              <Ionicons name="person" size={36} color={ACCENT_COLOR} />
            </View>
            <View style={tw`ml-4 flex-1`}>
              <Text style={[tw`text-2xl font-bold`, { color: TEXT_PRIMARY }]}>
                Pengguna Saya
              </Text>
              <Text style={[tw`text-sm mt-1`, { color: TEXT_SECONDARY }]}>
                Aplikasi Manajemen Keuangan Pribadi
              </Text>
              <Text style={[tw`text-xs mt-1`, { color: Colors.textTertiary }]}>
                Data tersimpan lokal di perangkat Anda
              </Text>
            </View>
          </View>

          {/* Refresh Button */}
          <TouchableOpacity
            style={[
              tw`mt-4 flex-row items-center justify-center py-2 rounded-lg`,
              {
                backgroundColor: Colors.surfaceLight,
                opacity: isRefreshing ? 0.7 : 1,
              },
            ]}
            onPress={loadStats}
            disabled={isRefreshing}
          >
            <Ionicons
              name="refresh"
              size={16}
              color={ACCENT_COLOR}
              style={tw`mr-2`}
            />
            <Text style={[tw`text-sm font-medium`, { color: ACCENT_COLOR }]}>
              {isRefreshing ? "Memuat..." : "Refresh Statistik"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={tw`px-4 -mt-4`}>
          <View
            style={[
              tw`rounded-xl p-4 shadow-lg mb-4`,
              {
                backgroundColor: SURFACE_COLOR,
                borderWidth: 1,
                borderColor: BORDER_COLOR,
              },
            ]}
          >
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={[tw`font-bold text-lg`, { color: TEXT_PRIMARY }]}>
                Statistik Keuangan
              </Text>
              <View
                style={[
                  tw`px-2 py-1 rounded-full`,
                  { backgroundColor: Colors.accent + "20" },
                ]}
              >
                <Text
                  style={[tw`text-xs font-medium`, { color: ACCENT_COLOR }]}
                >
                  Real-time
                </Text>
              </View>
            </View>

            <View style={tw`flex-row justify-between mb-4`}>
              <View style={tw`items-center`}>
                <Text style={[tw`text-2xl font-bold`, { color: ACCENT_COLOR }]}>
                  {userStats.transactions}
                </Text>
                <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
                  Transaksi
                </Text>
              </View>

              <View style={tw`items-center`}>
                <Text
                  style={[tw`text-2xl font-bold`, { color: SUCCESS_COLOR }]}
                >
                  {userStats.budgets}
                </Text>
                <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
                  Anggaran
                </Text>
              </View>

              <View style={tw`items-center`}>
                <Text style={[tw`text-2xl font-bold`, { color: PURPLE_COLOR }]}>
                  {userStats.savings}
                </Text>
                <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
                  Tabungan
                </Text>
              </View>
            </View>

            {/* Financial Summary */}
            <View
              style={[
                tw`pt-4`,
                { borderTopWidth: 1, borderTopColor: BORDER_COLOR },
              ]}
            >
              <Text style={[tw`font-medium mb-2`, { color: TEXT_PRIMARY }]}>
                Ringkasan Keuangan
              </Text>

              <View>
                <View style={tw`flex-row justify-between mb-2`}>
                  <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
                    Total Pemasukan
                  </Text>
                  <Text
                    style={[tw`text-sm font-medium`, { color: SUCCESS_COLOR }]}
                  >
                    {formatCurrency(userStats.totalIncome)}
                  </Text>
                </View>

                <View style={tw`flex-row justify-between mb-2`}>
                  <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
                    Total Pengeluaran
                  </Text>
                  <Text
                    style={[tw`text-sm font-medium`, { color: ERROR_COLOR }]}
                  >
                    {formatCurrency(userStats.totalExpense)}
                  </Text>
                </View>

                <View style={tw`flex-row justify-between`}>
                  <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
                    Saldo Bersih
                  </Text>
                  <Text
                    style={[tw`text-sm font-medium`, { color: ACCENT_COLOR }]}
                  >
                    {formatCurrency(userStats.balance)}
                  </Text>
                </View>
              </View>
            </View>

            <Text
              style={[
                tw`text-xs text-center mt-4`,
                { color: Colors.textTertiary },
              ]}
            >
              Terakhir diperbarui: {new Date().toLocaleTimeString("id-ID")}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={tw`px-4`}>
          {/* Export Data */}
          <TouchableOpacity
            style={[
              tw`p-4 rounded-xl mb-3 flex-row items-center`,
              {
                backgroundColor: SURFACE_COLOR,
                borderWidth: 1,
                borderColor: BORDER_COLOR,
              },
            ]}
            onPress={handleExportData}
            disabled={isLoading}
          >
            <View
              style={[
                tw`w-10 h-10 rounded-lg items-center justify-center mr-3`,
                { backgroundColor: Colors.info + "20" },
              ]}
            >
              <Ionicons name="download-outline" size={20} color={INFO_COLOR} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={[tw`font-medium`, { color: TEXT_PRIMARY }]}>
                Ekspor Data
              </Text>
              <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
                Backup data ke file (Coming Soon)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={TEXT_SECONDARY} />
          </TouchableOpacity>

          {/* Debug Storage */}
          <TouchableOpacity
            style={[
              tw`p-4 rounded-xl mb-3 flex-row items-center`,
              {
                backgroundColor: SURFACE_COLOR,
                borderWidth: 1,
                borderColor: BORDER_COLOR,
              },
            ]}
            onPress={handleDebugStorage}
            disabled={isLoading}
          >
            <View
              style={[
                tw`w-10 h-10 rounded-lg items-center justify-center mr-3`,
                { backgroundColor: Colors.success + "20" },
              ]}
            >
              <Ionicons name="bug-outline" size={20} color={SUCCESS_COLOR} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={[tw`font-medium`, { color: TEXT_PRIMARY }]}>
                Debug Storage
              </Text>
              <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
                Cek status penyimpanan (Developer)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={TEXT_SECONDARY} />
          </TouchableOpacity>

          {/* Clear All Data - DANGER ZONE */}
          <View
            style={[
              tw`mt-6 pt-4`,
              { borderTopWidth: 1, borderTopColor: BORDER_COLOR },
            ]}
          >
            <Text style={[tw`font-medium mb-3`, { color: ERROR_COLOR }]}>
              Zona Bahaya
            </Text>

            <TouchableOpacity
              style={[
                tw`p-4 rounded-xl flex-row items-center`,
                {
                  backgroundColor: Colors.error + "10",
                  borderWidth: 1,
                  borderColor: Colors.error + "30",
                },
              ]}
              onPress={handleClearAllData}
              disabled={isLoading || isRefreshing}
            >
              <View
                style={[
                  tw`w-10 h-10 rounded-lg items-center justify-center mr-3`,
                  { backgroundColor: Colors.error + "20" },
                ]}
              >
                <Ionicons name="trash-outline" size={20} color={ERROR_COLOR} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`font-medium`, { color: ERROR_COLOR }]}>
                  Hapus Semua Data
                </Text>
                <Text style={[tw`text-sm`, { color: Colors.error }]}>
                  Hapus semua transaksi, anggaran, dan tabungan
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={ERROR_COLOR} />
            </TouchableOpacity>

            <Text
              style={[tw`text-xs mt-2 text-center`, { color: Colors.error }]}
            >
              Tindakan ini tidak dapat dibatalkan
            </Text>
          </View>
        </View>

        {/* App Info */}
        <View style={tw`px-4 mt-6 mb-8`}>
          <View
            style={[
              tw`p-3 rounded-xl border`,
              {
                backgroundColor: Colors.surfaceLight,
                borderColor: BORDER_COLOR,
              },
            ]}
          >
            <Text style={[tw`text-xs text-center`, { color: TEXT_SECONDARY }]}>
              Aplikasi MyMoney v1.0.0
            </Text>
            <Text
              style={[
                tw`text-xs text-center mt-1`,
                { color: Colors.textTertiary },
              ]}
            >
              Data tersimpan lokal di perangkat Anda
            </Text>
            <Text
              style={[
                tw`text-xs text-center mt-1`,
                { color: Colors.textTertiary },
              ]}
            >
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
