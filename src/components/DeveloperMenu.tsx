import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tw from "twrnc";

const DeveloperMenu: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const navigation = useNavigation();

  const showStorageKeys = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const userKeys = keys.filter((k) => k.includes("@mymoney_user_"));

      Alert.alert(
        "Storage Keys",
        `Total: ${keys.length}\nUser Keys: ${userKeys.length}\n\n` +
          userKeys.map((k) => `• ${k}`).join("\n"),
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert("Error", "Gagal membaca storage");
    }
  };

  const clearAllStorage = () => {
    Alert.alert("Clear All Storage", "Hapus SEMUA data aplikasi?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.clear();
            Alert.alert("✅", "Storage cleared");
            setVisible(false);
          } catch (error) {
            Alert.alert("❌", "Gagal clear storage");
          }
        },
      },
    ]);
  };

  return (
    <>
      {/* Trigger Button - Hidden in corner */}
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={tw`absolute top-10 right-5 w-10 h-10 rounded-full bg-gray-800 opacity-30 items-center justify-center`}
      >
        <Text style={tw`text-white text-xs`}>DEV</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
          <View style={tw`bg-white rounded-t-3xl p-6 max-h-3/4`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-xl font-bold text-gray-900`}>
                🛠️ Developer Menu
              </Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={tw`text-gray-500 text-lg`}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={tw`text-gray-600 mb-4`}>
                Tools for testing multi-user storage
              </Text>

              <View style={tw`gap-3 mb-4`}>
                <TouchableOpacity
                  style={tw`bg-blue-100 p-4 rounded-xl`}
                  onPress={() => navigation.navigate("StorageTest" as any)}
                >
                  <Text style={tw`text-blue-800 font-medium`}>
                    🧪 Open Storage Test Screen
                  </Text>
                  <Text style={tw`text-blue-600 text-sm mt-1`}>
                    Comprehensive storage testing
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={tw`bg-green-100 p-4 rounded-xl`}
                  onPress={showStorageKeys}
                >
                  <Text style={tw`text-green-800 font-medium`}>
                    🔍 Show Storage Keys
                  </Text>
                  <Text style={tw`text-green-600 text-sm mt-1`}>
                    Debug AsyncStorage keys
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={tw`bg-yellow-100 p-4 rounded-xl`}
                  onPress={() => {
                    // Test create users quickly
                    navigation.navigate("Welcome" as any);
                    setVisible(false);
                  }}
                >
                  <Text style={tw`text-yellow-800 font-medium`}>
                    👥 Go to User Selection
                  </Text>
                  <Text style={tw`text-yellow-600 text-sm mt-1`}>
                    Test user creation flow
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={tw`bg-red-100 p-4 rounded-xl`}
                  onPress={clearAllStorage}
                >
                  <Text style={tw`text-red-800 font-medium`}>
                    🗑️ Clear All Storage (DANGER)
                  </Text>
                  <Text style={tw`text-red-600 text-sm mt-1`}>
                    Delete all app data
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={tw`bg-gray-100 p-3 rounded-lg items-center mt-4`}
                onPress={() => setVisible(false)}
              >
                <Text style={tw`text-gray-700`}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default DeveloperMenu;
