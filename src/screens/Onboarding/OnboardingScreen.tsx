// [file name]: src/screens/Onboarding/OnboardingScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
} from "react-native";
import tw from "twrnc";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

const OnboardingScreen = ({ navigation }: any) => {
  const [currentPage, setCurrentPage] = useState(0);

  const onboardingData = [
    {
      id: "1",
      title: "Kelola Keuangan\nDengan Mudah",
      description:
        "Pantau semua pemasukan dan pengeluaran Anda di satu tempat dengan interface yang intuitif dan ramah pengguna.",
      image: require("../../../assets/onboarding1.png"),
    },
    {
      id: "2",
      title: "Analisis Keuangan\nSecara Real-time",
      description:
        "Dapatkan insight mendalam tentang kebiasaan keuangan Anda dengan grafik dan laporan yang mudah dipahami.",
      image: require("../../../assets/onboarding2.png"),
    },
    {
      id: "3",
      title: "Raih Target\nKeuangan Anda",
      description:
        "Tetapkan target tabungan dan anggaran, lalu lacak progresnya secara berkala untuk mencapai tujuan finansial.",
      image: require("../../../assets/onboarding3.png"),
    },
  ];

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem("@onboarding_completed", "true");
      navigation.replace("MainDrawer");
    } catch (error) {
      console.error("Error saving onboarding status:", error);
      navigation.replace("MainDrawer");
    }
  };

  const currentSlide = onboardingData[currentPage];

  return (
    <View style={tw`flex-1 bg-white`}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

      {/* Skip Button - Minimalist */}
      {currentPage < 2 && (
        <TouchableOpacity
          style={tw`absolute top-12 right-6 z-10 px-4 py-2`}
          onPress={handleSkip}
          activeOpacity={0.6}
        >
          <Text style={tw`text-gray-500 text-sm font-medium`}>Lewati</Text>
        </TouchableOpacity>
      )}

      {/* Main Content */}
      <View style={tw`flex-1 justify-between px-6`}>
        {/* Top Section - Image & Indicator */}
        <View style={tw`flex-1 justify-center items-center pt-20 pb-8`}>
          {/* Image Container */}
          <View style={tw`items-center justify-center mb-8`}>
            <Image
              source={currentSlide.image}
              style={{
                width: width * 0.65,
                height: width * 0.65,
                resizeMode: "contain",
              }}
            />
          </View>

          {/* Page Indicator - Minimalist Dots */}
          <View style={tw`flex-row justify-center mt-4`}>
            {onboardingData.map((_, index) => (
              <View
                key={index}
                style={[
                  tw`h-1.5 rounded-full mx-1`,
                  {
                    width: index === currentPage ? 24 : 6,
                    backgroundColor:
                      index === currentPage ? "#4F46E5" : "#E0E7FF",
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Middle Section - Text Content */}
        <View style={tw`pb-8`}>
          <Text
            style={tw`text-gray-900 text-3xl font-bold text-center mb-4 leading-10`}
          >
            {currentSlide.title}
          </Text>
          <Text style={tw`text-gray-500 text-base text-center leading-6 px-4`}>
            {currentSlide.description}
          </Text>
        </View>

        {/* Bottom Section - Navigation */}
        <View style={tw`pb-10`}>
          {/* Navigation Buttons */}
          <View style={tw`flex-row items-center gap-3 mb-6`}>
            {/* Back Button - Only show if not first page */}
            {currentPage > 0 && (
              <TouchableOpacity
                onPress={handlePrevious}
                style={tw`flex-1 py-4 rounded-2xl border border-gray-200 bg-white`}
                activeOpacity={0.7}
              >
                <Text
                  style={tw`text-gray-700 font-semibold text-center text-base`}
                >
                  Kembali
                </Text>
              </TouchableOpacity>
            )}

            {/* Next/Start Button */}
            <TouchableOpacity
              onPress={handleNext}
              activeOpacity={0.8}
              style={tw`${
                currentPage > 0 ? "flex-1" : "flex-1"
              } py-4 rounded-2xl bg-[#4F46E5] shadow-sm`}
            >
              <Text style={tw`text-white font-semibold text-center text-base`}>
                {currentPage === onboardingData.length - 1
                  ? "Mulai Sekarang"
                  : "Lanjut"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Minimal Progress Bar */}
          <View style={tw`h-1 bg-gray-100 rounded-full overflow-hidden`}>
            <View
              style={[
                tw`h-full bg-[#4F46E5] rounded-full`,
                {
                  width: `${
                    ((currentPage + 1) / onboardingData.length) * 100
                  }%`,
                },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export default OnboardingScreen;
