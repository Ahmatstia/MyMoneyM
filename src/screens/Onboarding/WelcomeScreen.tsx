// File: src/screens/Onboarding/WelcomeScreen.tsx - ALTERNATIF SEDERHANA
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const PRIMARY_COLOR = "#0B4FB3";
const ACCENT_COLOR = "#2EE6C8";

export default function WelcomeScreen({ navigation }: any) {
  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem("@onboarding_completed", "true");
      navigation.replace("MainDrawer");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <LinearGradient
      colors={["#0B4FB3", "#2EE6C8"]}
      style={tw`flex-1`}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={tw`flex-1`}>
        <View style={tw`flex-1 items-center justify-center px-8`}>
          {/* Logo Animation Placeholder */}
          <View
            style={tw`w-48 h-48 rounded-full bg-white/20 items-center justify-center mb-12`}
          >
            <View
              style={tw`w-36 h-36 rounded-full bg-white/30 items-center justify-center`}
            >
              <View
                style={tw`w-24 h-24 rounded-full bg-white items-center justify-center`}
              >
                <Text style={tw`text-4xl text-[${PRIMARY_COLOR}] font-bold`}>
                  💰
                </Text>
              </View>
            </View>
          </View>

          {/* Title */}
          <Text
            style={tw`text-4xl font-bold text-white text-center mb-4 leading-tight`}
          >
            Selamat Datang di
          </Text>
          <Text
            style={tw`text-5xl font-bold text-white text-center mb-6 leading-tight`}
          >
            MyMoney
          </Text>

          {/* Subtitle */}
          <Text style={tw`text-lg text-white/90 text-center mb-12 px-4`}>
            Aplikasi pengelolaan keuangan pribadi yang mudah, aman, dan intuitif
          </Text>

          {/* Features */}
          <View style={tw`w-full mb-12`}>
            {[
              { icon: "📱", text: "Kelola keuangan di mana saja" },
              { icon: "🔒", text: "Data aman dan terenkripsi" },
              { icon: "📊", text: "Analisis keuangan mendalam" },
              { icon: "🎯", text: "Capai target finansial Anda" },
            ].map((item, index) => (
              <View
                key={index}
                style={tw`flex-row items-center mb-4 bg-white/10 p-4 rounded-xl`}
              >
                <Text style={tw`text-2xl mr-4`}>{item.icon}</Text>
                <Text style={tw`text-white text-base flex-1`}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* Get Started Button */}
          <TouchableOpacity
            style={tw`w-full py-5 bg-white rounded-2xl items-center justify-center shadow-lg`}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={tw`text-[${PRIMARY_COLOR}] text-xl font-bold`}>
              Mulai Sekarang
            </Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={tw`text-white/70 text-center mt-6 text-sm px-8`}>
            Dengan melanjutkan, Anda menyetujui Ketentuan Layanan dan Kebijakan
            Privasi kami
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
