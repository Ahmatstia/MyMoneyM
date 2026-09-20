import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { CatMascotSvg } from "./CatMascotSvg";
import { useGamification } from "../../context/GamificationContext";
import { useAppContext } from "../../context/AppContext";
import { useTheme } from "../../theme/ThemeContext";
import { CatMood } from "../../types/gamification";
import { getTierTheme } from "../../utils/gamificationEngine";

interface CatMascotCardProps {
  onOpenMilestones?: () => void;
}

export const CatMascotCard: React.FC<CatMascotCardProps> = ({
  onOpenMilestones,
}) => {
  const { colors } = useTheme();
  const { state: appState } = useAppContext();
  const { state: game, progress, petMoni, claimableMilestones } = useGamification();

  // ─── Animations ─────────────────────────────────────────────────────────────
  const floatAnim = useRef(new Animated.Value(0)).current;
  const bounceScale = useRef(new Animated.Value(1)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const heartTranslateY = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // ─── Component Local State ──────────────────────────────────────────────────
  const [speech, setSpeech] = useState<string>("");
  const [isBlinking, setIsBlinking] = useState(false);
  const [activeMood, setActiveMood] = useState<CatMood>("happy");
  const [floatingHeartText, setFloatingHeartText] = useState("+5 XP 💕");

  // ─── 1. Determine Mascot Mood from Financial Data & Time ─────────────────────
  useEffect(() => {
    const currentHour = new Date().getHours();

    // Night time: Sleepy
    if (currentHour >= 23 || currentHour < 5) {
      setActiveMood("sleepy");
      setSpeech("Zzz... Sudah larut malam, jangan lupa istirahat ya! 🌙");
      return;
    }

    // Check if budget is exceeded
    const isAnyBudgetOver = (appState.budgets || []).some(
      (b) => b.limit > 0 && b.spent >= b.limit
    );

    if (isAnyBudgetOver) {
      setActiveMood("worried");
      setSpeech("Meow... Ada anggaran yang lewat batas, yuk tahan jajan dulu! 😿");
      return;
    }

    // Check if balance is healthy or recent savings
    const hasActiveSavings = (appState.savings || []).some((s) => s.current > 0);
    if (hasActiveSavings && appState.balance > 0) {
      setActiveMood("happy");
      setSpeech("Purrr~ Keuanganmu terkendali rapi hari ini! Bangga deh! 🐾");
      return;
    }

    setActiveMood("happy");
    setSpeech("Hai! Jangan lupa catat setiap pengeluaran kecil ya! 😺");
  }, [appState.budgets, appState.balance, appState.savings]);

  // ─── 2. Floating Idle Animation & Natural Blinking ───────────────────────────
  useEffect(() => {
    // Idle float loop
    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    floating.start();

    // Natural blinking interval
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 4500);

    return () => {
      floating.stop();
      clearInterval(blinkInterval);
    };
  }, []);

  // ─── 3. Animate XP Progress Bar Smoothly ────────────────────────────────────
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress.percent,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress.percent]);

  // ─── 4. Pet Interaction ─────────────────────────────────────────────────────
  const handlePetCat = async () => {
    // Spring bounce
    bounceScale.setValue(0.9);
    Animated.spring(bounceScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();

    const result = await petMoni();

    // Floating heart and XP popup animation
    setFloatingHeartText(
      result.xpEarned > 0 ? `+${result.xpEarned} XP 💕` : "Purrr~ 💤"
    );
    heartOpacity.setValue(1);
    heartTranslateY.setValue(0);

    Animated.parallel([
      Animated.timing(heartOpacity, {
        toValue: 0,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(heartTranslateY, {
        toValue: -40,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // Update speech bubble
    setSpeech(result.message);
    setActiveMood("playful");

    setTimeout(() => {
      setActiveMood("happy");
    }, 3000);
  };

  const tierTheme = useMemo(
    () => getTierTheme(progress.borderTier),
    [progress.borderTier]
  );

  const hasClaimable = claimableMilestones.length > 0;

  return (
    <View style={styles.outerContainer}>
      <LinearGradient
        colors={[colors.surface, colors.surfaceLight]}
        style={[
          styles.card,
          {
            borderColor: colors.borderLight,
            shadowColor: colors.primaryDark,
          },
        ]}
      >
        {/* ─── Header: Mascot Title & Level Pill ─────────────────────── */}
        <View style={styles.headerRow}>
          <View style={styles.titleInfo}>
            <Text style={[styles.mascotName, { color: colors.textPrimary }]}>
              Moni Si Kucing Finansial 🐾
            </Text>
            <Text style={[styles.mascotSubtitle, { color: colors.textTertiary }]}>
              {progress.title}
            </Text>
          </View>

          {/* Level Pill */}
          <LinearGradient
            colors={tierTheme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.levelBadge}
          >
            <Ionicons name="star" size={11} color="#FFFFFF" />
            <Text style={styles.levelText}>Lv. {progress.level}</Text>
          </LinearGradient>
        </View>

        {/* ─── Center: Interactive Cat & Speech Bubble ────────────────── */}
        <View style={styles.centerSection}>
          {/* Speech Bubble */}
          <View
            style={[
              styles.speechBubble,
              {
                backgroundColor: colors.surfaceLight,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <Text
              style={[styles.speechText, { color: colors.textSecondary }]}
              numberOfLines={3}
            >
              {speech}
            </Text>
            {/* Little bubble arrow pointing down */}
            <View
              style={[
                styles.bubbleArrow,
                { borderTopColor: colors.surfaceLight },
              ]}
            />
          </View>

          {/* Cat SVG with Floating & Bounce Animation */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePetCat}
            style={styles.mascotTouchable}
          >
            {/* Floating Heart / XP Indicator */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.floatingHeart,
                {
                  opacity: heartOpacity,
                  transform: [{ translateY: heartTranslateY }],
                },
              ]}
            >
              <Text style={styles.heartText}>{floatingHeartText}</Text>
            </Animated.View>

            <Animated.View
              style={{
                transform: [
                  { translateY: floatAnim },
                  { scale: bounceScale },
                ],
              }}
            >
              <CatMascotSvg
                mood={activeMood}
                accessory={game.equippedAccessory}
                isBlinking={isBlinking}
                size={110}
              />
            </Animated.View>

            <Text style={[styles.tapHint, { color: colors.textTertiary }]}>
              Ketuk untuk elus Moni ({game.petCountToday}/5)
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── Footer: XP Progress Bar ────────────────────────────────── */}
        <View style={styles.xpSection}>
          <View style={styles.xpHeader}>
            <Text style={[styles.xpLabel, { color: colors.textSecondary }]}>
              Progress Level {progress.level}
            </Text>
            <Text style={[styles.xpNumbers, { color: colors.accent }]}>
              {progress.currentLevelXp.toLocaleString("id-ID")} /{" "}
              {progress.xpNeededForNext.toLocaleString("id-ID")} XP
            </Text>
          </View>

          <View
            style={[
              styles.progressBarTrack,
              { backgroundColor: colors.background },
            ]}
          >
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: tierTheme.primary,
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
        </View>

        {/* ─── Unclaimed Milestones Banner (If Available) ─────────────── */}
        {hasClaimable && onOpenMilestones && (
          <TouchableOpacity
            onPress={onOpenMilestones}
            activeOpacity={0.8}
            style={styles.claimBanner}
          >
            <LinearGradient
              colors={["#D97706", "#B45309"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.claimGradient}
            >
              <Ionicons name="gift" size={16} color="#FEF08A" />
              <Text style={styles.claimText}>
                {claimableMilestones.length} Hadiah Milestone Siap Diklaim!
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#FEF08A" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  titleInfo: {
    flex: 1,
  },
  mascotName: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  mascotSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    elevation: 2,
  },
  levelText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  centerSection: {
    alignItems: "center",
    marginVertical: 4,
  },
  speechBubble: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    maxWidth: "92%",
    marginBottom: 6,
    alignItems: "center",
  },
  speechText: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    fontWeight: "500",
  },
  bubbleArrow: {
    position: "absolute",
    bottom: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  mascotTouchable: {
    alignItems: "center",
    justifyContent: "center",
  },
  floatingHeart: {
    position: "absolute",
    top: 0,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heartText: {
    color: "#FDE047",
    fontWeight: "800",
    fontSize: 12,
  },
  tapHint: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "500",
  },
  xpSection: {
    marginTop: 8,
  },
  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  xpLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  xpNumbers: {
    fontSize: 11,
    fontWeight: "700",
  },
  progressBarTrack: {
    height: 7,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  claimBanner: {
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  claimGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  claimText: {
    color: "#FEF08A",
    fontSize: 12,
    fontWeight: "700",
  },
});
