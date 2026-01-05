// File: src/screens/Onboarding/OnboardingScreen.tsx
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Animated,
  FlatList,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

const PRIMARY_COLOR = "#0B4FB3";
const ACCENT_COLOR = "#2EE6C8";
const BACKGROUND_COLOR = "#F8FAFC";

const onboardingData = [
  {
    id: "1",
    title: "Kelola Keuangan dengan Mudah",
    description:
      "Pantau semua transaksi, anggaran, dan tabungan dalam satu aplikasi yang sederhana",
    icon: "💰",
    backgroundColor: "#F0F9FF",
  },
  {
    id: "2",
    title: "Analisis Cerdas",
    description:
      "Dapatkan insight dari data keuangan Anda untuk pengambilan keputusan yang lebih baik",
    icon: "📊",
    backgroundColor: "#F0FDF4",
  },
  {
    id: "3",
    title: "Raih Target Keuangan",
    description:
      "Tetapkan target tabungan dan anggaran, lalu lacak progres Anda secara real-time",
    icon: "🎯",
    backgroundColor: "#FFFBEB",
  },
  {
    id: "4",
    title: "Siap Memulai?",
    description: "Bergabunglah dengan komunitas yang telah mempercayai MyMoney",
    icon: "🚀",
    backgroundColor: "#FEF2F2",
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems[0]?.index || 0);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < onboardingData.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem("@onboarding_completed", "true");
      navigation.replace("MainDrawer");
    } catch (error) {
      console.error(error);
    }
  };

  const renderItem = ({ item }: any) => {
    return (
      <View style={[tw`flex-1 items-center justify-center px-8`, { width }]}>
        <View
          style={[
            tw`w-64 h-64 rounded-full items-center justify-center mb-12`,
            { backgroundColor: item.backgroundColor },
          ]}
        >
          <Text style={tw`text-7xl`}>{item.icon}</Text>
        </View>

        <View style={tw`items-center`}>
          <Text
            style={tw`text-3xl font-bold text-center mb-6 text-[${PRIMARY_COLOR}]`}
          >
            {item.title}
          </Text>
          <Text
            style={tw`text-lg text-center text-gray-600 leading-relaxed px-4`}
          >
            {item.description}
          </Text>
        </View>
      </View>
    );
  };

  const Paginator = () => {
    return (
      <View style={tw`flex-row h-12 items-center justify-center`}>
        {onboardingData.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 30, 10],
            extrapolate: "clamp",
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              style={[
                tw`h-3 mx-1 rounded-full bg-[${PRIMARY_COLOR}]`,
                {
                  width: dotWidth,
                  opacity,
                },
              ]}
              key={i.toString()}
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Skip Button */}
      {currentIndex < onboardingData.length - 1 && (
        <TouchableOpacity
          style={tw`absolute top-12 right-6 z-10`}
          onPress={handleGetStarted}
        >
          <Text style={tw`text-[${PRIMARY_COLOR}] font-medium`}>Lewati</Text>
        </TouchableOpacity>
      )}

      {/* Logo */}
      <View style={tw`absolute top-12 left-6 z-10`}>
        <View style={tw`flex-row items-center`}>
          <View
            style={tw`w-10 h-10 rounded-full bg-[${PRIMARY_COLOR}] items-center justify-center mr-2`}
          >
            <Text style={tw`text-white text-lg font-bold`}>M</Text>
          </View>
          <Text style={tw`text-xl font-bold text-[${PRIMARY_COLOR}]`}>
            MyMoney
          </Text>
        </View>
      </View>

      {/* Slides */}
      <FlatList
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={32}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
      />

      {/* Paginator */}
      <View style={tw`absolute bottom-36 w-full`}>
        <Paginator />
      </View>

      {/* Next/Get Started Button */}
      <View style={tw`absolute bottom-10 w-full px-8`}>
        <TouchableOpacity
          style={tw`py-4 rounded-full items-center justify-center ${
            currentIndex === onboardingData.length - 1
              ? `bg-[${ACCENT_COLOR}]`
              : `bg-[${PRIMARY_COLOR}]`
          }`}
          onPress={scrollTo}
          activeOpacity={0.8}
        >
          <Text style={tw`text-white text-lg font-semibold`}>
            {currentIndex === onboardingData.length - 1
              ? "Mulai Sekarang"
              : "Lanjut"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
