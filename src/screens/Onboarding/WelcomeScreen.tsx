import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { initializeUser } = useAppContext();

  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Nama diperlukan", "Silakan masukkan nama Anda");
      return;
    }

    try {
      setIsSubmitting(true);

      // Buat user baru
      await initializeUser(name.trim());

      // ✅ BENAR: Navigasi ke MainDrawer (sesuai dengan AppNavigator)
      navigation.reset({
        index: 0,
        routes: [{ name: "MainDrawer" }],
      });
    } catch (error) {
      console.error("Error creating user:", error);
      Alert.alert("Error", "Gagal membuat profil. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-indigo-600`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={tw`flex-1`}
      >
        <View style={tw`flex-1 justify-center px-8`}>
          {/* Logo */}
          <View style={tw`items-center mb-12`}>
            <View
              style={tw`w-24 h-24 bg-white rounded-3xl items-center justify-center mb-6`}
            >
              <Ionicons name="wallet" size={48} color="#4F46E5" />
            </View>
            <Text style={tw`text-white text-3xl font-bold text-center`}>
              MyMoney
            </Text>
            <Text style={tw`text-indigo-200 text-center mt-2`}>
              Kelola keuangan dengan mudah
            </Text>
          </View>

          {/* Form */}
          <View style={tw`bg-white rounded-3xl p-8`}>
            <Text style={tw`text-gray-900 text-2xl font-bold mb-2`}>
              Selamat Datang! 👋
            </Text>
            <Text style={tw`text-gray-600 mb-6`}>
              Masukkan nama Anda untuk mulai menggunakan aplikasi
            </Text>

            <View style={tw`mb-6`}>
              <Text style={tw`text-gray-700 text-sm font-medium mb-2`}>
                Nama Anda
              </Text>
              <TextInput
                style={tw`bg-gray-100 rounded-xl px-4 py-3 text-gray-900 text-base border border-gray-300`}
                placeholder="Contoh: Andi, Sari, Budi"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                autoFocus
                maxLength={30}
                editable={!isSubmitting}
              />
              <Text style={tw`text-gray-400 text-xs mt-1`}>
                Data Anda akan disimpan secara lokal di perangkat ini
              </Text>
            </View>

            <TouchableOpacity
              style={[
                tw`rounded-xl py-3 items-center`,
                isSubmitting ? tw`bg-indigo-400` : tw`bg-indigo-600`,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <Text style={tw`text-white text-base font-medium`}>
                  Membuat profil...
                </Text>
              ) : (
                <Text style={tw`text-white text-base font-medium`}>
                  Mulai Gunakan Aplikasi
                </Text>
              )}
            </TouchableOpacity>

            <Text style={tw`text-gray-400 text-xs text-center mt-6`}>
              Anda bisa menambah pengguna lain nanti melalui pengaturan
            </Text>
          </View>

          {/* Footer */}
          <Text style={tw`text-indigo-200 text-center mt-8 text-sm`}>
            Data aman tersimpan di perangkat Anda
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default WelcomeScreen;
