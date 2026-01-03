// File: src/screens/Onboarding/UserSelectScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { User } from "../../types";

const UserSelectScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    allUsers,
    currentUser,
    switchToUser,
    refreshUserList,
    initializeUser,
  } = useAppContext();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    currentUser?.id || null
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUserList();
    setRefreshing(false);
  };

  const handleSelectUser = (user: User) => {
    setSelectedUserId(user.id);
  };

  const handleConfirmSelection = async () => {
    if (!selectedUserId) {
      Alert.alert("Pilih Pengguna", "Silakan pilih pengguna terlebih dahulu");
      return;
    }

    try {
      await switchToUser(selectedUserId);
      navigation.reset({
        index: 0,
        routes: [{ name: "MainDrawer" }],
      });
    } catch (error) {
      Alert.alert("Error", "Gagal beralih pengguna");
    }
  };

  const handleAddNewUser = () => {
    setShowAddModal(true);
  };

  const handleCreateUser = async () => {
    if (!newUserName.trim()) {
      Alert.alert("Nama diperlukan", "Silakan masukkan nama");
      return;
    }

    try {
      const newUser = await initializeUser(newUserName.trim());
      setShowAddModal(false);
      setNewUserName("");

      // Auto select new user
      setSelectedUserId(newUser.id);

      Alert.alert("Berhasil", `Pengguna "${newUser.name}" telah ditambahkan`);
    } catch (error) {
      Alert.alert("Error", "Gagal menambahkan pengguna");
    }
  };

  const renderUserItem = ({ item: user }: { item: User }) => (
    <TouchableOpacity
      style={[
        tw`flex-row items-center p-4 rounded-xl mb-3 border`,
        selectedUserId === user.id
          ? tw`bg-indigo-50 border-indigo-200`
          : tw`bg-white border-gray-200`,
      ]}
      onPress={() => handleSelectUser(user)}
      activeOpacity={0.7}
    >
      <View
        style={[
          tw`w-12 h-12 rounded-full items-center justify-center mr-4`,
          { backgroundColor: `${user.color || "#4F46E5"}20` },
        ]}
      >
        <Text style={[tw`text-2xl`, { color: user.color || "#4F46E5" }]}>
          {user.avatar || "👤"}
        </Text>
      </View>

      <View style={tw`flex-1`}>
        <Text style={tw`text-gray-900 text-base font-semibold`}>
          {user.name}
          {currentUser?.id === user.id && (
            <Text style={tw`text-indigo-600 text-xs font-normal ml-2`}>
              (Sedang Aktif)
            </Text>
          )}
        </Text>
        <Text style={tw`text-gray-500 text-xs mt-0.5`}>
          Dibuat: {new Date(user.createdAt).toLocaleDateString("id-ID")}
        </Text>
      </View>

      {selectedUserId === user.id && (
        <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <View style={tw`flex-1 px-5 pt-5`}>
        {/* Header */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-gray-900 text-2xl font-bold`}>
            Pilih Pengguna
          </Text>
          <Text style={tw`text-gray-600 mt-1`}>
            Pilih profil untuk melanjutkan
          </Text>
        </View>

        {/* User List */}
        <FlatList
          data={allUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`pb-4`}
          ListEmptyComponent={
            <View style={tw`items-center py-12`}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text style={tw`text-gray-900 text-lg font-medium mt-4 mb-2`}>
                Belum ada pengguna
              </Text>
              <Text style={tw`text-gray-600 text-center`}>
                Tambahkan pengguna pertama Anda
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4F46E5"]}
            />
          }
        />

        {/* Action Buttons */}
        <View style={tw`mt-4`}>
          <TouchableOpacity
            style={tw`bg-white border border-indigo-600 rounded-xl py-3 items-center mb-3`}
            onPress={handleAddNewUser}
          >
            <Text style={tw`text-indigo-600 text-base font-medium`}>
              + Tambah Pengguna Baru
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              tw`rounded-xl py-3 items-center`,
              selectedUserId ? tw`bg-indigo-600` : tw`bg-gray-300`,
            ]}
            onPress={handleConfirmSelection}
            disabled={!selectedUserId}
            activeOpacity={0.8}
          >
            <Text
              style={[
                tw`text-base font-medium`,
                selectedUserId ? tw`text-white` : tw`text-gray-500`,
              ]}
            >
              Lanjutkan ke Aplikasi
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal Tambah User */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={tw`flex-1 bg-black bg-opacity-50 justify-center px-5`}>
          <View style={tw`bg-white rounded-2xl p-6`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-gray-900 text-xl font-bold`}>
                Tambah Pengguna Baru
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={tw`mb-6`}>
              <Text style={tw`text-gray-700 text-sm font-medium mb-2`}>
                Nama Pengguna
              </Text>
              <TextInput
                style={tw`bg-gray-100 rounded-xl px-4 py-3 text-gray-900 text-base border border-gray-300`}
                placeholder="Masukkan nama"
                placeholderTextColor="#9CA3AF"
                value={newUserName}
                onChangeText={setNewUserName}
                autoFocus
                maxLength={30}
              />
            </View>

            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                style={tw`flex-1 border border-gray-300 rounded-xl py-3 items-center`}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={tw`text-gray-700 font-medium`}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  tw`flex-1 rounded-xl py-3 items-center`,
                  newUserName.trim() ? tw`bg-indigo-600` : tw`bg-gray-300`,
                ]}
                onPress={handleCreateUser}
                disabled={!newUserName.trim()}
              >
                <Text
                  style={[
                    tw`font-medium`,
                    newUserName.trim() ? tw`text-white` : tw`text-gray-500`,
                  ]}
                >
                  Tambah
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default UserSelectScreen;
