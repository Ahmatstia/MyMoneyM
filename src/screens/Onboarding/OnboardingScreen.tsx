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
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const G_GREEN_PRIMARY = "#00D84A";
const G_TEXT = "#FFFFFF";

const OnboardingScreen = ({ navigation }: any) => {
  const [currentPage, setCurrentPage] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const lottieRef = useRef<LottieView>(null);

  const onboardingData = [
    {
      id: "1",
      title: "Kelola Keuangan\nLebih Santai",
      description:
        "Pantau arus kas dengan mudah dan menyenangkan tanpa pusing hitung manual.",
      lottie: require("../../../assets/lottie/Finance Surfer.json"),
      accent: G_GREEN_PRIMARY,
    },
    {
      id: "2",
      title: "Analisis Pintar\n& Akurat",
      description:
        "Dapatkan wawasan mendalam tentang pola pengeluaranmu secara otomatis.",
      lottie: require("../../../assets/lottie/Credit Assessment Animated.json"),
      accent: "#F5A623",
    },
    {
      id: "3",
      title: "Masa Depan\nTerjamin",
      description:
        "Rencanakan tabungan dan capai target finansialmu demi masa depan yang lebih mapan.",
      lottie: require("../../../assets/lottie/Annual Revenue Chart.json"),
      accent: "#00D4AA",
    },
  ];

  useEffect(() => {
    startAnimation();
  }, [currentPage]);

  const startAnimation = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    scaleAnim.setValue(0.9);

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
      Animated.spring(scaleAnim, {
        toValue: 1,
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
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Background gradient — dark green/teal base */}
      <LinearGradient
        colors={["#001A08", "#0A2E15", "#060D0A"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative glow orbs */}
      <View
        style={{
          position: "absolute",
          top: -100,
          right: -80,
          width: 250,
          height: 250,
          borderRadius: 125,
          backgroundColor: currentSlide.accent,
          opacity: 0.06,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -60,
          left: -60,
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: currentSlide.accent,
          opacity: 0.04,
        }}
      />

      {/* Top accent line */}
      <LinearGradient
        colors={["transparent", currentSlide.accent, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          position: "absolute",
          top: 0,
          left: 60,
          right: 60,
          height: 1.5,
        }}
      />

      {/* Skip Button */}
      {currentPage < onboardingData.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Lewati</Text>
          <Ionicons
            name="chevron-forward"
            size={12}
            color="rgba(255,255,255,0.4)"
            style={{ marginLeft: 2 }}
          />
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
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          {/* Glow behind lottie */}
          <View
            style={{
              position: "absolute",
              width: width * 0.5,
              height: width * 0.5,
              borderRadius: width * 0.25,
              backgroundColor: currentSlide.accent,
              opacity: 0.08,
              top: width * 0.15,
            }}
          />
          <LottieView
            ref={lottieRef}
            source={currentSlide.lottie}
            autoPlay
            loop
            style={styles.lottie}
          />
        </Animated.View>

        {/* Premium Pagination Dots */}
        <View style={styles.indicatorContainer}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  width: index === currentPage ? 28 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor:
                    index === currentPage
                      ? currentSlide.accent
                      : "rgba(255,255,255,0.12)",
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
          style={[
            styles.nextButton,
            {
              shadowColor: currentSlide.accent,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            },
          ]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[currentSlide.accent, `${currentSlide.accent}CC`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.nextButtonText}>
              {currentPage === onboardingData.length - 1
                ? "Mulai Sekarang"
                : "Lanjutkan"}
            </Text>
            <Ionicons
              name={
                currentPage === onboardingData.length - 1
                  ? "rocket-outline"
                  : "arrow-forward"
              }
              size={16}
              color="#001A08"
              style={{ marginLeft: 6 }}
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* Page indicator text */}
        <Text
          style={{
            color: "rgba(255,255,255,0.2)",
            fontSize: 10,
            textAlign: "center",
            marginTop: 12,
            letterSpacing: 2,
          }}
        >
          {currentPage + 1} / {onboardingData.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: "absolute",
    top: 54,
    right: 24,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  skipText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  lottieContainer: {
    width: width * 0.7,
    height: width * 0.7,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  lottie: {
    width: "100%",
    height: "100%",
  },
  indicatorContainer: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 28,
    alignItems: "center",
  },
  indicator: {
    height: 6,
    borderRadius: 3,
  },
  textSection: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "800",
    textAlign: "center",
    color: G_TEXT,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    color: "rgba(255,255,255,0.5)",
    paddingHorizontal: 4,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 44,
  },
  nextButton: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    overflow: "hidden",
  },
  gradientButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    color: "#001A08",
    fontSize: 16,
    fontWeight: "800",
  },
});

export default OnboardingScreen;
