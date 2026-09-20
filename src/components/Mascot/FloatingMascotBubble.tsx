import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  PanResponder,
  Dimensions,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useIsFocused } from "@react-navigation/native";

import { useGamification } from "../../context/GamificationContext";
import { useAppContext } from "../../context/AppContext";
import { useTheme } from "../../theme/ThemeContext";
import { CatMascotSvg } from "./CatMascotSvg";
import { CatMood } from "../../types/gamification";
import { getTierTheme } from "../../utils/gamificationEngine";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const BUBBLE_SIZE = 54;
const TAB_WIDTH = 18;
const TAB_HEIGHT = 30;
const TAB_GAP = 4;
const TOTAL_WIDTH = BUBBLE_SIZE + TAB_GAP + TAB_WIDTH; // 76
const EDGE_PADDING = 8;
const TUCK_DISTANCE = 42;
const TOP_BOUND = 60;
const BOTTOM_BOUND = SCREEN_HEIGHT - 120;

const DEFAULT_X = EDGE_PADDING; // Top-Left default
const DEFAULT_Y = 80;

const STORAGE_KEY_POS_X = "@mymoney_mascot_pos_x";
const STORAGE_KEY_POS_Y = "@mymoney_mascot_pos_y";
const STORAGE_KEY_MINIMIZED = "@mymoney_mascot_minimized";
export const STORAGE_KEY_MASCOT_HIDDEN = "@mymoney_mascot_hidden";

// In-memory session dismissal flag (resets automatically whenever app restarts)
let sessionDismissed = false;

export const resetSessionDismissed = () => {
  sessionDismissed = false;
};

export const FloatingMascotBubble: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { state: appState } = useAppContext();
  const { state: game, progress, claimableMilestones } = useGamification();

  // ─── Drag State ─────────────────────────────────────────────────────────────
  const pan = useRef(new Animated.ValueXY({ x: DEFAULT_X, y: DEFAULT_Y })).current;
  const currentPos = useRef({ x: DEFAULT_X, y: DEFAULT_Y });

  const [isOnLeftSide, setIsOnLeftSide] = useState(true);
  const [isTucked, setIsTucked] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [activeMood, setActiveMood] = useState<CatMood>("happy");
  const [shortSpeech, setShortSpeech] = useState<string | null>(null);

  // ─── Animations ─────────────────────────────────────────────────────────────
  const floatAnim = useRef(new Animated.Value(0)).current;
  const speechOpacity = useRef(new Animated.Value(0)).current;
  const tuckAnim = useRef(new Animated.Value(0)).current; // 0 = normal, 1 = tucked into border
  const dismissScale = useRef(new Animated.Value(1)).current;
  const dismissOpacity = useRef(new Animated.Value(1)).current;

  const tierTheme = useMemo(
    () => getTierTheme(progress.borderTier),
    [progress.borderTier]
  );

  // ─── 1. Load Saved Position & Tucked & Hidden State ────────────────────────
  useEffect(() => {
    const loadState = async () => {
      try {
        const [savedX, savedY, savedMin, savedHidden] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_POS_X),
          AsyncStorage.getItem(STORAGE_KEY_POS_Y),
          AsyncStorage.getItem(STORAGE_KEY_MINIMIZED),
          AsyncStorage.getItem(STORAGE_KEY_MASCOT_HIDDEN),
        ]);

        if (savedHidden === "true" || sessionDismissed) {
          setIsHidden(true);
        }

        let x = DEFAULT_X;
        let y = DEFAULT_Y;

        if (savedX !== null) x = parseFloat(savedX);
        if (savedY !== null) y = parseFloat(savedY);

        const isLeft = x + TOTAL_WIDTH / 2 < SCREEN_WIDTH / 2;
        x = isLeft ? EDGE_PADDING : SCREEN_WIDTH - TOTAL_WIDTH - EDGE_PADDING;
        y = Math.max(TOP_BOUND, Math.min(y, BOTTOM_BOUND));

        currentPos.current = { x, y };
        pan.setValue({ x, y });
        setIsOnLeftSide(isLeft);

        if (savedMin === "true") {
          setIsTucked(true);
          tuckAnim.setValue(1);
        }
      } catch (err) {
        console.warn("[FloatingMascotBubble] Load state error:", err);
      }
    };

    loadState();
  }, []);

  // Sync when screen is focused (in case toggled from Settings)
  useEffect(() => {
    if (isFocused) {
      AsyncStorage.getItem(STORAGE_KEY_MASCOT_HIDDEN).then((val) => {
        const permanentlyHidden = val === "true";
        if (permanentlyHidden) {
          setIsHidden(true);
        } else if (!sessionDismissed) {
          setIsHidden(false);
          dismissScale.setValue(1);
          dismissOpacity.setValue(1);
        }
      });
    }
  }, [isFocused]);

  // ─── 2. Idle Float Animation ────────────────────────────────────────────────
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -4,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ─── 3. Speech & Mood Update ────────────────────────────────────────────────
  useEffect(() => {
    const isAnyBudgetOver = (appState.budgets || []).some(
      (b) => b.limit > 0 && b.spent >= b.limit
    );

    if (claimableMilestones.length > 0) {
      setShortSpeech("Hadiah siap klaim! 🎁");
      setActiveMood("celebrate");
    } else if (isAnyBudgetOver) {
      setShortSpeech("Awas budget! ⚠️");
      setActiveMood("worried");
    } else if (game.petCountToday < 5) {
      setShortSpeech("Elus Moni! ✨");
      setActiveMood("happy");
    } else {
      setShortSpeech(null);
      setActiveMood("happy");
    }

    if (shortSpeech) {
      Animated.timing(speechOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: false,
      }).start();
    }
  }, [appState.budgets, claimableMilestones.length, game.petCountToday]);

  // ─── 4. Toggle Tuck (Minimize into side edge) ───────────────────────────────
  const toggleTuck = (toTuck: boolean) => {
    setIsTucked(toTuck);
    AsyncStorage.setItem(STORAGE_KEY_MINIMIZED, toTuck ? "true" : "false");

    Animated.spring(tuckAnim, {
      toValue: toTuck ? 1 : 0,
      friction: 6,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  const handleCatPress = () => {
    if (isTucked) {
      toggleTuck(false);
    } else {
      navigation.navigate("MoniScreen");
    }
  };

  const handleDismiss = () => {
    Alert.alert(
      "Sembunyikan Moni?",
      "Moni akan disembunyikan untuk sesi ini dan akan muncul kembali saat aplikasi dibuka lagi.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Sembunyikan",
          style: "destructive",
          onPress: () => {
            Animated.parallel([
              Animated.timing(dismissScale, {
                toValue: 0,
                duration: 220,
                easing: Easing.back(1.2),
                useNativeDriver: false,
              }),
              Animated.timing(dismissOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
              }),
            ]).start(() => {
              sessionDismissed = true;
              setIsHidden(true);
            });
          },
        },
      ]
    );
  };

  // ─── 5. PanResponder for Free Dragging with Edge Snapping ───────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        return Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4;
      },
      onPanResponderGrant: (_evt, gestureState) => {
        if (isTucked) {
          setIsTucked(false);
          AsyncStorage.setItem(STORAGE_KEY_MINIMIZED, "false");
          tuckAnim.setValue(0);
        }
        pan.setOffset({
          x: currentPos.current.x,
          y: currentPos.current.y,
        });
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderMove: (_evt, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (_evt, gestureState) => {
        pan.flattenOffset();

        const dragDistance = Math.sqrt(
          gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy
        );

        // Tap fallback
        if (dragDistance < 7) {
          handleCatPress();
          return;
        }

        // Calculate final release coordinates
        const rawX = currentPos.current.x + gestureState.dx;
        const rawY = currentPos.current.y + gestureState.dy;

        // Snap to nearest horizontal edge (Left or Right)
        const snapLeft = rawX + TOTAL_WIDTH / 2 < SCREEN_WIDTH / 2;
        const targetX = snapLeft
          ? EDGE_PADDING
          : SCREEN_WIDTH - TOTAL_WIDTH - EDGE_PADDING;

        // Clamp Y safely
        const targetY = Math.max(TOP_BOUND, Math.min(rawY, BOTTOM_BOUND));

        currentPos.current = { x: targetX, y: targetY };
        setIsOnLeftSide(snapLeft);

        // Save position
        AsyncStorage.setItem(STORAGE_KEY_POS_X, targetX.toString());
        AsyncStorage.setItem(STORAGE_KEY_POS_Y, targetY.toString());

        // Spring snap to edge
        Animated.spring(pan, {
          toValue: { x: targetX, y: targetY },
          friction: 6,
          tension: 45,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  // Horizontal translation when tucked (-TUCK_DISTANCE on left, +TUCK_DISTANCE on right)
  const tuckOffset = tuckAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isOnLeftSide ? -TUCK_DISTANCE : TUCK_DISTANCE],
  });

  if (isHidden) return null;

  return (
    <Animated.View
      style={[
        styles.floatingContainer,
        {
          opacity: dismissOpacity,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { translateX: tuckOffset },
            { translateY: floatAnim },
            { scale: dismissScale },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* ─── Speech Tip Bubble (when expanded and not tucked) ─────────── */}
      {!isTucked && shortSpeech && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.speechBubble,
            isOnLeftSide ? styles.speechBubbleRight : styles.speechBubbleLeft,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
              opacity: speechOpacity,
            },
          ]}
        >
          <Text style={[styles.speechText, { color: colors.textPrimary }]}>
            {shortSpeech}
          </Text>
          <View
            style={[
              styles.speechArrow,
              isOnLeftSide ? styles.speechArrowLeft : styles.speechArrowRight,
              {
                [isOnLeftSide ? "borderRightColor" : "borderLeftColor"]: colors.surface,
              },
            ]}
          />
        </Animated.View>
      )}

      {/* ─── Main Draggable Assembly (Bubble + Tuck Tab) ─────────────── */}
      <View
        style={[
          styles.bubbleInner,
          { flexDirection: isOnLeftSide ? "row" : "row-reverse" },
        ]}
      >
        <View style={styles.bubbleWrapper}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleCatPress}
            style={[
              styles.bubbleTouchable,
              {
                borderColor: tierTheme.primary,
                backgroundColor: colors.surface,
                shadowColor: tierTheme.primary,
              },
            ]}
          >
            {/* Glowing Tier Ring */}
            <LinearGradient
              colors={tierTheme.gradient}
              style={styles.gradientRing}
            >
              <View
                style={[
                  styles.innerCircle,
                  { backgroundColor: colors.surface },
                ]}
              >
                <CatMascotSvg
                  mood={activeMood}
                  accessory={game.equippedAccessory}
                  size={44}
                />
              </View>
            </LinearGradient>

            {/* Mini Level Badge */}
            <View style={styles.levelPillWrapper}>
              <LinearGradient
                colors={tierTheme.gradient}
                style={styles.levelPill}
              >
                <Text style={styles.levelPillText}>Lv.{progress.level}</Text>
              </LinearGradient>
            </View>

            {/* Unclaimed Red Dot Badge */}
            {claimableMilestones.length > 0 && (
              <View style={styles.claimDot}>
                <Text style={styles.claimDotText}>
                  {claimableMilestones.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Mini 'X' Close Button (Sibling to avoid touch responder conflict) */}
          {!isTucked && (
            <TouchableOpacity
              onPress={handleDismiss}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              activeOpacity={0.7}
              style={[
                styles.closeBtn,
                isOnLeftSide ? styles.closeBtnInwardLeft : styles.closeBtnInwardRight,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                },
              ]}
            >
              <Ionicons name="close" size={12} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* ─── Quick Tuck Button (Chevron tab) ────────────────────────── */}
        <TouchableOpacity
          onPress={() => toggleTuck(!isTucked)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
          style={[
            styles.tuckToggleTab,
            isOnLeftSide ? styles.tuckTabRight : styles.tuckTabLeft,
            {
              backgroundColor: colors.surfaceLight,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <Ionicons
            name={
              isTucked
                ? isOnLeftSide
                  ? "chevron-forward"
                  : "chevron-back"
                : isOnLeftSide
                ? "chevron-back"
                : "chevron-forward"
            }
            size={13}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleInner: {
    alignItems: "center",
  },
  bubbleTouchable: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  gradientRing: {
    padding: 2.5,
    borderRadius: BUBBLE_SIZE / 2,
  },
  innerCircle: {
    width: BUBBLE_SIZE - 5,
    height: BUBBLE_SIZE - 5,
    borderRadius: (BUBBLE_SIZE - 5) / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  levelPillWrapper: {
    position: "absolute",
    bottom: -3,
    alignSelf: "center",
  },
  levelPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  levelPillText: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontWeight: "900",
  },
  claimDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  claimDotText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
  speechBubble: {
    position: "absolute",
    top: 6,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    minWidth: 100,
    maxWidth: 140,
    zIndex: 10,
  },
  speechBubbleRight: {
    left: TOTAL_WIDTH + 8,
  },
  speechBubbleLeft: {
    right: TOTAL_WIDTH + 8,
  },
  speechText: {
    fontSize: 10.5,
    fontWeight: "700",
    textAlign: "center",
  },
  speechArrow: {
    position: "absolute",
    top: 10,
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  speechArrowLeft: {
    left: -6,
    borderRightWidth: 6,
    borderLeftWidth: 0,
    borderLeftColor: "transparent",
  },
  speechArrowRight: {
    right: -6,
    borderLeftWidth: 6,
    borderRightWidth: 0,
    borderRightColor: "transparent",
  },
  tuckToggleTab: {
    width: TAB_WIDTH,
    height: TAB_HEIGHT,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  tuckTabRight: {
    marginLeft: TAB_GAP,
  },
  tuckTabLeft: {
    marginRight: TAB_GAP,
  },
  bubbleWrapper: {
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: -10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 3,
    zIndex: 20,
  },
  closeBtnInwardLeft: {
    right: -4,
  },
  closeBtnInwardRight: {
    left: -4,
  },
});
