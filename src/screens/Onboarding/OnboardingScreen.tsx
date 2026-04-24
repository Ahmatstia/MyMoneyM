import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../../theme/theme";

const { width, height } = Dimensions.get("window");

const OnboardingScreen = ({ navigation }: any) => {
  const [currentPage, setCurrentPage] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const lottieRef = useRef<LottieView>(null);

  const onboardingData = [
    {
      id: "1",
      title: "Kelola Keuangan\nLebih Santai",
      description:
        "Pantau arus kas dengan mudah dan menyenangkan tanpa pusing hitung manual.",
      lottie: require("../../../assets/lottie/Businessman flies up with rocket.json"),
    },
    {
      id: "2",
      title: "Analisis Pintar\n& Akurat",
      description:
        "Dapatkan wawasan mendalam tentang pola pengeluaranmu secara otomatis.",
      lottie: require("../../../assets/lottie/Credit Assessment Animated.json"),
    },
    {
      id: "3",
      title: "Masa Depan\nTerjamin",
      description:
        "Rencanakan tabungan dan capai target finansialmu demi masa depan yang lebih mapan.",
      lottie: require("../../../assets/lottie/Job Success.json"),
    },
  ];

  useEffect(() => {
    startAnimation();
  }, [currentPage]);

  const startAnimation = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      setCurrentPage((p) => p + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem("@onboarding_completed", "true");
    } catch (e) {
      // Error saving
    }
    navigation.replace("MainDrawer");
  };

  const currentSlide = onboardingData[currentPage];

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary, Colors.primaryLight]}
        style={StyleSheet.absoluteFill}
      />

      {/* Skip Button */}
      {currentPage < onboardingData.length - 1 && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Lewati</Text>
        </TouchableOpacity>
      )}

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Lottie Animation */}
        <Animated.View
          style={[
            styles.lottieContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LottieView
            ref={lottieRef}
            source={currentSlide.lottie}
            autoPlay
            loop
            style={styles.lottie}
          />
        </Animated.View>

        {/* Indicators */}
        <View style={styles.indicatorContainer}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  width: index === currentPage ? 24 : 8,
                  backgroundColor: index === currentPage ? Colors.accent : "rgba(255,255,255,0.2)",
                },
              ]}
            />
          ))}
        </View>

        {/* Text Section */}
        <Animated.View
          style={[
            styles.textSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>{currentSlide.title}</Text>
          <Text style={styles.description}>{currentSlide.description}</Text>
        </Animated.View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={Colors.gradient.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.nextButtonText}>
              {currentPage === onboardingData.length - 1
                ? "Mulai Sekarang"
                : "Lanjutkan"}
            </Text>
            <Text style={styles.arrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  skipButton: {
    position: "absolute",
    top: 50,
    right: 24,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    color: Colors.textTertiary,
    fontSize: 14,
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  lottieContainer: {
    width: width * 0.8,
    height: width * 0.8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  lottie: {
    width: "100%",
    height: "100%",
  },
  indicatorContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 32,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
  textSection: {
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "800",
    textAlign: "center",
    color: Colors.textPrimary,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    color: Colors.textSecondary,
    paddingHorizontal: 8,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 50,
  },
  nextButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    overflow: "hidden",
  },
  gradientButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  nextButtonText: {
    color: Colors.primaryDark,
    fontSize: 16,
    fontWeight: "800",
  },
  arrow: {
    color: Colors.primaryDark,
    fontSize: 18,
    fontWeight: "800",
  },
});

export default OnboardingScreen;
