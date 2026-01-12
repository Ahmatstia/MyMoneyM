import React, { useState } from "react";
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
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { Colors } from "../../theme/theme";

const PRIMARY_COLOR = Colors.primary;
const ACCENT_COLOR = Colors.accent;
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR = Colors.surface;
const TEXT_PRIMARY = Colors.textPrimary;
const TEXT_SECONDARY = Colors.textSecondary;
const BORDER_COLOR = Colors.border;
const SUCCESS_COLOR = Colors.success;
const WARNING_COLOR = Colors.warning;
const ERROR_COLOR = Colors.error;
const INFO_COLOR = Colors.info;

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

const ProfileScreen: React.FC = () => {
  const { state, clearAllData, debugStorage, isLoading } = useAppContext();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
      <ScrollView
        style={tw`flex-1`}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
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
                MyMoney
              </Text>
              <Text style={[tw`text-sm mt-1`, { color: TEXT_SECONDARY }]}>
                Manajemen Keuangan Pribadi
              </Text>
              <Text style={[tw`text-xs mt-1`, { color: Colors.textTertiary }]}>
                Versi 1.0.0
              </Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={tw`mt-6`}>
            <View style={tw`flex-row justify-between`}>
              <View style={tw`items-center`}>
                <Text style={[tw`text-2xl font-bold`, { color: ACCENT_COLOR }]}>
                  {state.transactions?.length || 0}
                </Text>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  Transaksi
                </Text>
              </View>
              <View style={tw`items-center`}>
                <Text
                  style={[tw`text-2xl font-bold`, { color: SUCCESS_COLOR }]}
                >
                  {state.budgets?.length || 0}
                </Text>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  Anggaran
                </Text>
              </View>
              <View style={tw`items-center`}>
                <Text style={[tw`text-2xl font-bold`, { color: INFO_COLOR }]}>
                  {state.savings?.length || 0}
                </Text>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  Tabungan
                </Text>
              </View>
              <View style={tw`items-center`}>
                <Text
                  style={[tw`text-2xl font-bold`, { color: WARNING_COLOR }]}
                >
                  {state.notes?.length || 0}
                </Text>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  Catatan
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Data Information */}
        <View style={tw`p-4`}>
          <View
            style={[
              tw`rounded-xl p-5 mb-6`,
              { backgroundColor: SURFACE_COLOR },
            ]}
          >
            <Text style={[tw`text-lg font-bold mb-4`, { color: TEXT_PRIMARY }]}>
              📊 Ringkasan Keuangan
            </Text>

            <View>
              <View style={tw`flex-row justify-between mb-3`}>
                <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
                  Total Pemasukan
                </Text>
                <Text
                  style={[tw`text-sm font-medium`, { color: SUCCESS_COLOR }]}
                >
                  {formatCurrency(state.totalIncome || 0)}
                </Text>
              </View>

              <View style={tw`flex-row justify-between mb-3`}>
                <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
                  Total Pengeluaran
                </Text>
                <Text style={[tw`text-sm font-medium`, { color: ERROR_COLOR }]}>
                  {formatCurrency(state.totalExpense || 0)}
                </Text>
              </View>

              <View style={tw`flex-row justify-between`}>
                <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
                  Saldo Bersih
                </Text>
                <Text
                  style={[tw`text-sm font-medium`, { color: ACCENT_COLOR }]}
                >
                  {formatCurrency(state.balance || 0)}
                </Text>
              </View>
            </View>
          </View>

          {/* Info Simple */}
          <View
            style={[
              tw`rounded-xl p-5 mb-6`,
              { backgroundColor: Colors.surfaceLight },
            ]}
          >
            <Text style={[tw`font-bold mb-3`, { color: TEXT_PRIMARY }]}>
              💡 Informasi
            </Text>
            <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
              • Data tersimpan lokal di perangkat Anda
            </Text>
            <Text style={[tw`text-sm mt-1`, { color: TEXT_SECONDARY }]}>
              • Aplikasi berfungsi tanpa internet
            </Text>
            <Text style={[tw`text-sm mt-1`, { color: TEXT_SECONDARY }]}>
              • Update aplikasi untuk fitur terbaru
            </Text>
          </View>

          {/* Debug Section */}
          <View
            style={[
              tw`mt-8 pt-6`,
              { borderTopWidth: 1, borderTopColor: BORDER_COLOR },
            ]}
          >
            <Text style={[tw`font-medium mb-4`, { color: TEXT_SECONDARY }]}>
              Pengaturan Sistem
            </Text>

            <TouchableOpacity
              style={[
                tw`p-4 rounded-xl flex-row items-center mb-3`,
                {
                  backgroundColor: SURFACE_COLOR,
                  borderWidth: 1,
                  borderColor: BORDER_COLOR,
                },
              ]}
              onPress={debugStorage}
              disabled={isLoading}
            >
              <View
                style={[
                  tw`w-10 h-10 rounded-lg items-center justify-center mr-3`,
                  { backgroundColor: SUCCESS_COLOR + "20" },
                ]}
              >
                <Ionicons name="bug-outline" size={20} color={SUCCESS_COLOR} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`font-medium`, { color: TEXT_PRIMARY }]}>
                  Cek Storage
                </Text>
                <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
                  Verifikasi penyimpanan data
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={TEXT_SECONDARY}
              />
            </TouchableOpacity>

            {/* Clear All Data */}
            <TouchableOpacity
              style={[
                tw`p-4 rounded-xl flex-row items-center`,
                {
                  backgroundColor: Colors.error + "10",
                  borderWidth: 1,
                  borderColor: Colors.error + "30",
                },
              ]}
              onPress={() => {
                Alert.alert(
                  "Hapus Semua Data",
                  "Apakah Anda yakin ingin menghapus SEMUA data?\n\nSemua transaksi, anggaran, tabungan, dan catatan akan dihapus permanen.",
                  [
                    { text: "Batalkan", style: "cancel" },
                    {
                      text: "Hapus Semua",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await clearAllData();
                          Alert.alert(
                            "✅ Berhasil",
                            "Semua data telah dihapus"
                          );
                        } catch (error) {
                          Alert.alert("Error", "Gagal menghapus data");
                        }
                      },
                    },
                  ]
                );
              }}
              disabled={isLoading}
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
                  Reset aplikasi ke kondisi awal
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={ERROR_COLOR} />
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View style={tw`mt-8 mb-8`}>
            <View
              style={[
                tw`p-4 rounded-xl`,
                {
                  backgroundColor: Colors.surfaceLight,
                  borderWidth: 1,
                  borderColor: BORDER_COLOR,
                },
              ]}
            >
              <Text
                style={[tw`text-center text-sm`, { color: TEXT_SECONDARY }]}
              >
                Aplikasi MyMoney v1.0.0
              </Text>
              <Text
                style={[
                  tw`text-center text-xs mt-1`,
                  { color: Colors.textTertiary },
                ]}
              >
                © 2024 - Dibuat dengan ❤️
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
