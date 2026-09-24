import React, { useEffect, useRef, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useGamification } from "../../context/GamificationContext";
import { CatMascotSvg } from "../Mascot/CatMascotSvg";
import { getTierTheme, triggerHaptic } from "../../utils/gamificationEngine";

const { width } = Dimensions.get("window");

export const LevelUpModal: React.FC = () => {
  const { state: game, dismissLevelUp, progress } = useGamification();
  const pending = game.pendingLevelUp;

  // ─── Animations ─────────────────────────────────────────────────────────────
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const tierTheme = useMemo(
    () => getTierTheme(progress.borderTier),
    [progress.borderTier]
  );

  useEffect(() => {
    if (pending) {
      triggerHaptic("success");

      // Entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous slow glow rotation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(0);
    }
  }, [pending]);

  if (!pending) return null;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Modal
      visible={!!pending}
      transparent
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={dismissLevelUp}
    >
      <View style={styles.backdrop}>
        {/* Glowing Background Rays */}
        <Animated.View
          style={[
            styles.glowContainer,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <LinearGradient
            colors={[tierTheme.glowColor, "transparent"]}
            style={styles.glowCircle}
          />
        </Animated.View>

        {/* Modal Content Card */}
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={["#1E293B", "#0F172A"]}
            style={[styles.card, { borderColor: tierTheme.primary }]}
          >
            {/* Header Badge */}
            <LinearGradient
              colors={tierTheme.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerRibbon}
            >
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              <Text style={styles.headerRibbonText}>LEVEL UP!</Text>
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
            </LinearGradient>

            {/* Celebratory Mascot */}
            <View style={styles.mascotContainer}>
              <CatMascotSvg
                mood="celebrate"
                accessory="crown"
                size={130}
              />
            </View>

            {/* Level Transition Indicator */}
            <View style={styles.levelRow}>
              <View style={styles.levelBubble}>
                <Text style={styles.oldLevelText}>Lv. {pending.oldLevel}</Text>
              </View>
              <Ionicons name="arrow-forward" size={24} color="#FACC15" />
              <LinearGradient
                colors={tierTheme.gradient}
                style={styles.newLevelBubble}
              >
                <Text style={styles.newLevelText}>Lv. {pending.newLevel}</Text>
              </LinearGradient>
            </View>

            {/* Unlocked Title */}
            <Text style={styles.congratsTitle}>Gelar Baru Terbuka!</Text>
            <View style={styles.titleBadge}>
              <Text style={styles.titleText}>{pending.unlockedTitle}</Text>
            </View>

            <Text style={styles.flavorText}>
              Luar biasa! Disiplin finansialmu terbukti nyata. Border profilmu kini
              telah diperbarui dengan tier yang lebih prestisius!
            </Text>

            {/* Confirm Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={dismissLevelUp}
              style={styles.actionButton}
            >
              <LinearGradient
                colors={tierTheme.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Lanjutkan Petualangan! 🚀</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  glowContainer: {
    position: "absolute",
    width: width * 1.2,
    height: width * 1.2,
    justifyContent: "center",
    alignItems: "center",
  },
  glowCircle: {
    width: "100%",
    height: "100%",
    borderRadius: (width * 1.2) / 2,
  },
  cardWrapper: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    elevation: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  headerRibbon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: -10,
    marginBottom: 16,
    elevation: 4,
  },
  headerRibbonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  mascotContainer: {
    marginVertical: 6,
    alignItems: "center",
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginVertical: 14,
  },
  levelBubble: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#334155",
  },
  oldLevelText: {
    color: "#94A3B8",
    fontSize: 16,
    fontWeight: "700",
  },
  newLevelBubble: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 14,
    elevation: 4,
  },
  newLevelText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  congratsTitle: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 6,
  },
  titleBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  titleText: {
    color: "#FDE047",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  flavorText: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginVertical: 10,
    paddingHorizontal: 8,
  },
  actionButton: {
    width: "100%",
    marginTop: 12,
    borderRadius: 14,
    overflow: "hidden",
    elevation: 4,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
