import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
  Animated,
} from "react-native";
import tw from "twrnc";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

const OnboardingScreen = ({ navigation }: any) => {
  const [currentPage, setCurrentPage] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const onboardingData = [
    {
      id: "1",
      title: "Kelola Keuangan\nDengan Mudah",
      description:
        "Pantau semua pemasukan dan pengeluaran Anda di satu tempat dengan interface yang intuitif.",
      image: require("../../../assets/onboarding1.png"),
    },
    {
      id: "2",
      title: "Analisis Keuangan\nSecara Real-time",
      description:
        "Dapatkan insight mendalam tentang kebiasaan keuangan Anda dengan grafik yang mudah dipahami.",
      image: require("../../../assets/onboarding2.png"),
    },
    {
      id: "3",
      title: "Raih Target\nKeuangan Anda",
      description:
        "Tetapkan target tabungan dan lacak progresnya secara berkala untuk mencapai tujuan finansial.",
      image: require("../../../assets/onboarding3.png"),
    },
  ];

  // Floating animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleNext = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (currentPage < onboardingData.length - 1) {
        setCurrentPage(currentPage + 1);
      } else {
        handleFinish();
        return;
      }

      Animated.parallel([
        Animated.spring(fadeAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
        }),
      ]).start();
    });
  };

  const handlePrevious = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }

      Animated.parallel([
        Animated.spring(fadeAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
        }),
      ]).start();
    });
  };

  // PERBAIKAN: Ganti reset dengan navigation.replace
  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem("@onboarding_completed", "true");
    } catch (error) {
      console.error("Error saving onboarding status:", error);
    }

    // NAVIGASI YANG BENAR
    navigation.replace("MainDrawer");
  };

  const handleSkip = () => {
    // Skip juga navigasi yang sama
    navigation.replace("MainDrawer");
  };

  const currentSlide = onboardingData[currentPage];

  const floatInterpolate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  return (
    <View style={tw`flex-1 bg-white`}>
      <StatusBar backgroundColor="#0F172A" barStyle="dark-content" />

      {/* Skip Button */}
      {currentPage < 2 && (
        <TouchableOpacity
          style={tw`absolute top-12 right-6 z-10`}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={tw`text-gray-500 text-sm font-medium`}>Lewati</Text>
        </TouchableOpacity>
      )}

      {/* Bottom Curved Section - Indigo */}
      <View
        style={[
          tw`absolute bottom-0 left-0 right-0 bg-[#0F172A]`,
          {
            height: height * 0.5,
            borderTopLeftRadius: 100,
            borderTopRightRadius: 2,
          },
        ]}
      />

      {/* Main Content */}
      <View style={tw`flex-1 justify-center items-center px-8`}>
        {/* Image with Float Animation */}
        <Animated.View
          style={[
            tw`items-center mb-6`,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: floatInterpolate },
              ],
            },
          ]}
        >
          <Image
            source={currentSlide.image}
            style={{
              width: width * 0.7,
              height: width * 0.7,
              resizeMode: "contain",
            }}
          />
        </Animated.View>

        {/* Page Indicator */}
        <Animated.View
          style={[
            tw`flex-row justify-center gap-2 mb-8`,
            { opacity: fadeAnim },
          ]}
        >
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                tw`h-1.5 rounded-full`,
                {
                  width: index === currentPage ? 28 : 8,
                  backgroundColor:
                    index === currentPage ? "#4F46E5" : "#CBD5E1",
                },
              ]}
            />
          ))}
        </Animated.View>

        {/* Text Content */}
        <Animated.View
          style={[
            tw`items-center`,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Title */}
          <View style={tw`mb-4`}>
            {currentSlide.title.split("\n").map((line, index) => (
              <Text
                key={index}
                style={[
                  tw`text-center font-extrabold`,
                  {
                    fontSize: 38,
                    lineHeight: 46,
                    color: index === 0 ? "#98b7e9ff" : "#4F46E5",
                    letterSpacing: -0.5,
                  },
                ]}
              >
                {line}
              </Text>
            ))}
          </View>

          {/* Description */}
          <Text
            style={{
              fontSize: 15,
              color: "#7688a0ff",
              textAlign: "center",
              lineHeight: 24,
              paddingHorizontal: 16,
              fontWeight: "400",
            }}
          >
            {currentSlide.description}
          </Text>
        </Animated.View>
      </View>

      {/* Navigation - Inside Bottom Curved Section */}
      <Animated.View
        style={[
          tw`absolute bottom-0 left-0 right-0 px-8 pb-10`,
          { opacity: fadeAnim },
        ]}
      >
        <View style={tw`flex-row items-center gap-3`}>
          {/* Back Button */}
          {currentPage > 0 && (
            <TouchableOpacity
              onPress={handlePrevious}
              style={tw`w-12 h-12 rounded-full bg-white/20 items-center justify-center`}
              activeOpacity={0.8}
            >
              <Text style={tw`text-white font-bold text-lg`}>←</Text>
            </TouchableOpacity>
          )}

          {/* Next Button */}
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.9}
            style={tw`flex-1 h-12 rounded-full bg-white items-center justify-center`}
          >
            <Text style={tw`text-[#4F46E5] font-bold text-[15px]`}>
              {currentPage === onboardingData.length - 1
                ? "Mulai Sekarang"
                : "Lanjutkan"}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

export default OnboardingScreen;
