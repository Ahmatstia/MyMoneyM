// File: src/screens/Profile/ProfileScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { storageService } from "../../utils/storage";
import {
  clearCurrentUser,
  saveUsers,
  loadUsers,
} from "../../utils/userManager";

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { currentUser, allUsers, refreshUserList, switchToUser } =
    useAppContext();

  const [showEditModal, setShowEditModal] = useState(false);
  const [newName, setNewName] = useState(currentUser?.name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [userStats, setUserStats] = useState({
    transactions: 0,
    budgets: 0,
    savings: 0,
  });

  // Load user stats
  useEffect(() => {
    if (currentUser) {
      loadStats();
      setNewName(currentUser.name);
    }
  }, [currentUser]);

  const loadStats = async () => {
    if (!currentUser) return;

    try {
      const userData = await storageService.loadUserData(currentUser.id);
      setUserStats({
        transactions: userData.transactions?.length || 0,
        budgets: userData.budgets?.length || 0,
        savings: userData.savings?.length || 0,
      });
    } catch (error) {
      console.error("Error loading user stats:", error);
    }
  };

  // Format tanggal
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // ✅ HAPUS AKUN SENDIRI
  const handleDeleteAccount = async () => {
    if (!currentUser) return;

    Alert.alert(
      "Hapus Akun",
      `Apakah Anda yakin ingin menghapus akun "${currentUser.name}"?\n\nSemua data akan dihapus permanen dan tidak dapat dikembalikan.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus Akun",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);

              // 1. Hapus data user dari storage
              await storageService.clearUserData(currentUser.id);

              // 2. Hapus user dari daftar users
              const updatedUsers = allUsers.filter(
                (u) => u.id !== currentUser.id
              );
              await saveUsers(updatedUsers);

              // 3. Clear current user
              await clearCurrentUser();

              setIsLoading(false);

              // 4. Navigasi ke UserSelectScreen
              navigation.reset({
                index: 0,
                routes: [{ name: "UserSelect" }],
              });

              Alert.alert(
                "✅ Berhasil",
                `Akun "${currentUser.name}" telah dihapus`
              );
            } catch (error) {
              setIsLoading(false);
              console.error("❌ Error menghapus akun:", error);
              Alert.alert("Error", "Gagal menghapus akun");
            }
          },
        },
      ]
    );
  };

  // ✅ EDIT NAMA USER
  const handleEditName = async () => {
    if (!currentUser || !newName.trim()) return;

    try {
      setIsLoading(true);

      // Update user in users list
      const updatedUsers = allUsers.map((user) =>
        user.id === currentUser.id ? { ...user, name: newName.trim() } : user
      );

      await saveUsers(updatedUsers);

      // Update current user
      const updatedUser = { ...currentUser, name: newName.trim() };

      // Jika user ini sedang aktif, update currentUser
      if (currentUser.id === updatedUser.id) {
        const {
          setCurrentUser: updateCurrentUser,
        } = require("../../utils/userManager");
        await updateCurrentUser(updatedUser);
      }

      // Refresh user list
      await refreshUserList();

      setIsLoading(false);
      setShowEditModal(false);

      Alert.alert("✅ Berhasil", "Nama berhasil diperbarui");
    } catch (error) {
      setIsLoading(false);
      console.error("❌ Error update nama:", error);
      Alert.alert("Error", "Gagal memperbarui nama");
    }
  };

  // ✅ SWITCH KE USER LAIN
  const handleSwitchUser = async (userId: string) => {
    try {
      await switchToUser(userId);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Gagal beralih pengguna");
    }
  };

  if (!currentUser) {
    return (
      <View style={tw`flex-1 items-center justify-center`}>
        <Text style={tw`text-gray-600`}>Tidak ada user yang aktif</Text>
        <TouchableOpacity
          style={tw`mt-4 bg-indigo-600 px-4 py-2 rounded-lg`}
          onPress={() => navigation.navigate("UserSelect")}
        >
          <Text style={tw`text-white`}>Pilih Pengguna</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <ScrollView style={tw`flex-1`}>
        {/* Header */}
        <View style={tw`bg-indigo-600 p-6`}>
          <View style={tw`flex-row items-center`}>
            <View
              style={tw`w-20 h-20 bg-white rounded-full items-center justify-center`}
            >
              <Text style={tw`text-3xl`}>{currentUser.avatar || "👤"}</Text>
            </View>
            <View style={tw`ml-4 flex-1`}>
              <Text style={tw`text-white text-2xl font-bold`}>
                {currentUser.name}
              </Text>
              <Text style={tw`text-indigo-100 text-sm mt-1`}>
                ID: {currentUser.id}
              </Text>
              <Text style={tw`text-indigo-200 text-xs mt-1`}>
                Dibuat: {formatDate(currentUser.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={tw`px-4 -mt-4`}>
          <View style={tw`bg-white rounded-xl p-4 shadow-sm mb-4`}>
            <Text style={tw`text-gray-900 font-bold text-lg mb-4`}>
              Statistik Akun
            </Text>

            <View style={tw`flex-row justify-between mb-3`}>
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

            <TouchableOpacity
              style={tw`mt-2 bg-indigo-50 py-2 rounded-lg items-center`}
              onPress={loadStats}
            >
              <Text style={tw`text-indigo-600 text-sm font-medium`}>
                Refresh Statistik
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={tw`px-4`}>
          {/* Edit Profile */}
          <TouchableOpacity
            style={tw`bg-white p-4 rounded-xl mb-3 flex-row items-center`}
            onPress={() => setShowEditModal(true)}
          >
            <View
              style={tw`w-10 h-10 bg-blue-50 rounded-lg items-center justify-center mr-3`}
            >
              <Ionicons name="pencil-outline" size={20} color="#3B82F6" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-gray-900 font-medium`}>Edit Profil</Text>
              <Text style={tw`text-gray-500 text-sm`}>Ubah nama pengguna</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Switch User */}
          <TouchableOpacity
            style={tw`bg-white p-4 rounded-xl mb-3 flex-row items-center`}
            onPress={() => navigation.navigate("UserSelect")}
          >
            <View
              style={tw`w-10 h-10 bg-green-50 rounded-lg items-center justify-center mr-3`}
            >
              <Ionicons
                name="swap-horizontal-outline"
                size={20}
                color="#10B981"
              />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-gray-900 font-medium`}>Ganti Pengguna</Text>
              <Text style={tw`text-gray-500 text-sm`}>Pilih pengguna lain</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Delete Account - DANGER ZONE */}
          <View style={tw`mt-6 border-t border-gray-200 pt-4`}>
            <Text style={tw`text-red-600 font-medium mb-3`}>Zona Bahaya</Text>

            <TouchableOpacity
              style={tw`bg-red-50 p-4 rounded-xl flex-row items-center`}
              onPress={handleDeleteAccount}
              disabled={isLoading}
            >
              <View
                style={tw`w-10 h-10 bg-red-100 rounded-lg items-center justify-center mr-3`}
              >
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-red-700 font-medium`}>Hapus Akun</Text>
                <Text style={tw`text-red-500 text-sm`}>
                  Hapus akun dan semua data permanen
                </Text>
              </View>
              {isLoading ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <Ionicons name="chevron-forward" size={20} color="#DC2626" />
              )}
            </TouchableOpacity>

            <Text style={tw`text-red-400 text-xs mt-2 text-center`}>
              Tindakan ini tidak dapat dibatalkan
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal Edit Nama */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={tw`flex-1 bg-black bg-opacity-50 justify-center px-5`}>
          <View style={tw`bg-white rounded-2xl p-6`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-gray-900 text-xl font-bold`}>
                Edit Nama Pengguna
              </Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                disabled={isLoading}
              >
                <Ionicons name="close-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={tw`mb-6`}>
              <Text style={tw`text-gray-700 text-sm font-medium mb-2`}>
                Nama Baru
              </Text>
              <TextInput
                style={tw`bg-gray-100 rounded-xl px-4 py-3 text-gray-900 text-base border border-gray-300`}
                placeholder="Masukkan nama baru"
                placeholderTextColor="#9CA3AF"
                value={newName}
                onChangeText={setNewName}
                autoFocus
                maxLength={30}
                editable={!isLoading}
              />
            </View>

            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                style={tw`flex-1 border border-gray-300 rounded-xl py-3 items-center`}
                onPress={() => setShowEditModal(false)}
                disabled={isLoading}
              >
                <Text style={tw`text-gray-700 font-medium`}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  tw`flex-1 rounded-xl py-3 items-center`,
                  newName.trim() && !isLoading
                    ? tw`bg-indigo-600`
                    : tw`bg-gray-300`,
                ]}
                onPress={handleEditName}
                disabled={!newName.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      tw`font-medium`,
                      newName.trim() && !isLoading
                        ? tw`text-white`
                        : tw`text-gray-500`,
                    ]}
                  >
                    Simpan
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;
