// File: src/screens/Onboarding/SplashScreen.tsx
import React, { useEffect } from "react";
import { View, Text, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import { Ionicons } from "@expo/vector-icons";

const SplashScreen = ({ navigation }: any) => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigasi setelah 2.5 detik
    const timer = setTimeout(() => {
      navigation.replace("Onboarding");
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={["#4F46E5", "#7C3AED", "#8B5CF6"]}
      style={tw`flex-1 items-center justify-center`}
    >
      <Animated.View
        style={[
          tw`items-center`,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo Animation */}
        <View style={tw`mb-6`}>
          <View
            style={tw`w-32 h-32 rounded-3xl bg-white/20 items-center justify-center`}
          >
            <Ionicons name="wallet" size={60} color="#FFFFFF" />
          </View>
        </View>

        {/* App Name */}
        <Text style={tw`text-white text-4xl font-bold mb-2`}>MyMoney</Text>
        <Text style={tw`text-white/80 text-lg`}>
          Kelola Keuangan dengan Bijak
        </Text>

        {/* Loading Indicator */}
        <View
          style={tw`mt-12 w-48 h-2 bg-white/30 rounded-full overflow-hidden`}
        >
          <Animated.View
            style={[
              tw`h-full bg-white rounded-full`,
              {
                width: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>

        {/* Tagline */}
        <Text style={tw`text-white/60 text-sm mt-8`}>
          "Keuangan sehat, hidup tenang"
        </Text>
      </Animated.View>
    </LinearGradient>
  );
};

export default SplashScreen;
