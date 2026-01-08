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
      title: "Uang Bocor\nTanpa Disadari?",
      description:
        "Pengeluaran kecil yang tak tercatat bisa bikin keuangan berantakan. Saatnya ambil kendali.",
      image: require("../../../assets/ob1.png"),
    },
    {
      id: "2",
      title: "Semua Keuangan\nDalam Genggaman",
      description:
        "Pantau pemasukan, pengeluaran, dan asetmu secara real-time lewat satu aplikasi.",
      image: require("../../../assets/ob2.png"),
    },
    {
      id: "3",
      title: "Keuangan Terkontrol,\nMasa Depan Terarah",
      description:
        "Lihat perkembangan uangmu, capai target finansial, dan bangun kebiasaan keuangan sehat.",
      image: require("../../../assets/ob3.png"),
    },
  ];

  /* Floating animation */
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

  const animateTransition = (callback: () => void) => {
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
      callback();

      Animated.parallel([
        Animated.spring(fadeAnim, {
          toValue: 1,
          damping: 12,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 12,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      animateTransition(() => setCurrentPage((p) => p + 1));
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      animateTransition(() => setCurrentPage((p) => p - 1));
    }
  };

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem("@onboarding_completed", "true");
    } catch (e) {
      console.log(e);
    }
    navigation.replace("MainDrawer");
  };

  const handleSkip = () => {
    navigation.replace("MainDrawer");
  };

  const floatInterpolate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });

  const currentSlide = onboardingData[currentPage];

  return (
    <View style={tw`flex-1 bg-white`}>
      <StatusBar backgroundColor="#0F172A" barStyle="light-content" />

      {/* Skip */}
      {currentPage < onboardingData.length - 1 && (
        <TouchableOpacity
          style={tw`absolute top-12 right-6 z-10`}
          onPress={handleSkip}
        >
          <Text style={tw`text-gray-500 text-sm font-medium`}>Lewati</Text>
        </TouchableOpacity>
      )}

      {/* Bottom Curved Section */}
      <View
        style={[
          tw`absolute bottom-0 left-0 right-0 bg-[#0F172A]`,
          {
            height: height * 0.48,
            borderTopLeftRadius: 120,
            borderTopRightRadius: 40,
          },
        ]}
      />

      {/* Main Content */}
      <View style={tw`flex-1 justify-center items-center px-8`}>
        {/* Image */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: floatInterpolate }],
            marginBottom: 24,
          }}
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

        {/* Indicator */}
        <Animated.View style={[tw`flex-row gap-2 mb-8`, { opacity: fadeAnim }]}>
          {onboardingData.map((_, index) => (
            <Animated.View
              key={index}
              style={{
                height: 6,
                width: index === currentPage ? 28 : 8,
                borderRadius: 99,
                backgroundColor: index === currentPage ? "#4F46E5" : "#CBD5E1",
              }}
            />
          ))}
        </Animated.View>

        {/* Text */}
        <Animated.View
          style={{
            alignItems: "center",
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <View style={tw`mb-4`}>
            {currentSlide.title.split("\n").map((line, index) => (
              <Text
                key={index}
                style={{
                  fontSize: 36,
                  lineHeight: 44,
                  fontWeight: "800",
                  textAlign: "center",
                  letterSpacing: -0.5,
                  color: index === 0 ? "#E0E7FF" : "#4F46E5",
                }}
              >
                {line}
              </Text>
            ))}
          </View>

          <Text
            style={{
              fontSize: 15,
              lineHeight: 24,
              textAlign: "center",
              color: "#7688A0",
              paddingHorizontal: 16,
            }}
          >
            {currentSlide.description}
          </Text>
        </Animated.View>
      </View>

      {/* Navigation */}
      <Animated.View
        style={[
          tw`absolute bottom-0 left-0 right-0 px-8 pb-10`,
          { opacity: fadeAnim },
        ]}
      >
        <View style={tw`flex-row items-center gap-3`}>
          {currentPage > 0 && (
            <TouchableOpacity
              onPress={handlePrevious}
              style={tw`w-12 h-12 rounded-full bg-white/20 items-center justify-center`}
            >
              <Text style={tw`text-white text-lg font-bold`}>←</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleNext}
            style={[
              tw`flex-1 h-12 rounded-full bg-white items-center justify-center`,
              {
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 10,
                elevation: 4,
              },
            ]}
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
