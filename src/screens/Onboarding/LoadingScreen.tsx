// File: src/screens/Onboarding/LoadingScreen.tsx
import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";

const LoadingScreen = () => {
  return (
    <SafeAreaView style={tw`flex-1 justify-center items-center bg-[#0B4FB3]`}>
      <View style={tw`items-center`}>
        <Text style={tw`text-4xl mb-4`}>💰</Text>
        <Text style={tw`text-3xl font-bold text-white mb-2`}>MyMoney</Text>
        <Text style={tw`text-white/80`}>Memuat aplikasi...</Text>
        <ActivityIndicator size="large" color="#FFFFFF" style={tw`mt-8`} />
      </View>
    </SafeAreaView>
  );
};

export default LoadingScreen;
