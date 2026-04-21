import React, { useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const BUTTON_W       = 26;
const BUTTON_H       = 52;
const MIN_Y          = 80;
const MAX_Y          = SCREEN_HEIGHT - 160;
const INITIAL_Y      = SCREEN_HEIGHT / 2 - BUTTON_H / 2;
const SNAP_THRESHOLD = SCREEN_WIDTH * 0.25; // pull 25% to switch side
const MAX_STRETCH    = 72;

type Side = "left" | "right";
type Mode = "idle" | "horizontal" | "vertical";

const FloatingDrawerHandle: React.FC = () => {
  const navigation = useNavigation<any>();

  const [side, setSide] = useState<Side>("left");
  const sideRef = useRef<Side>("left");

  // Y position for vertical movement
  const yAnim  = useRef(new Animated.Value(INITIAL_Y)).current;
  const lastY  = useRef(INITIAL_Y);

  // Elastic pull distance (drives width stretch)
  const stretch = useRef(new Animated.Value(0)).current;

  const mode = useRef<Mode>("idle");

  // ── helpers ─────────────────────────────────────────────────────────────────
  const springBack = () =>
    Animated.spring(stretch, {
      toValue: 0,
      useNativeDriver: false,
      speed: 24,
      bounciness: 14,
    }).start();

  const fastSnapBack = (cb: () => void) =>
    Animated.timing(stretch, {
      toValue: 0,
      duration: 120, // Sangat cepat, tanpa bounce delay
      useNativeDriver: false,
    }).start(cb);

  const snapToSide = (newSide: Side) => {
    setSide(newSide);
    sideRef.current = newSide;
  };

  // ── PanResponder ─────────────────────────────────────────────────────────────
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,

      onPanResponderGrant: () => {
        mode.current = "idle";
      },

      onPanResponderMove: (_, g) => {
        // Determine direction once
        if (mode.current === "idle") {
          const isH = Math.abs(g.dx) > Math.abs(g.dy) * 1.5 && Math.abs(g.dx) > 8;
          const isV = Math.abs(g.dy) > Math.abs(g.dx) * 1.5 && Math.abs(g.dy) > 8;
          if (isH) mode.current = "horizontal";
          else if (isV) mode.current = "vertical";
        }

        if (mode.current === "horizontal") {
          // Pull inward: left-side → drag right, right-side → drag left
          const raw =
            sideRef.current === "left"
              ? Math.max(0, g.dx)
              : Math.max(0, -g.dx);
          stretch.setValue(Math.min(raw, MAX_STRETCH));
        }

        if (mode.current === "vertical") {
          const ny = Math.min(Math.max(lastY.current + g.dy, MIN_Y), MAX_Y);
          yAnim.setValue(ny);
        }
      },

      onPanResponderRelease: (_, g) => {
        // If movement was very small, treat it as a tap
        if (Math.abs(g.dx) < 5 && Math.abs(g.dy) < 5) {
          navigation.dispatch(DrawerActions.openDrawer());
          mode.current = "idle";
          return;
        }

        if (mode.current === "horizontal") {
          const pulled =
            sideRef.current === "left" ? g.dx : -g.dx;

          if (pulled > SNAP_THRESHOLD) {
            // Switch side: use fast snap to avoid 2s spring delay!
            const newSide: Side = sideRef.current === "left" ? "right" : "left";
            fastSnapBack(() => snapToSide(newSide));
          } else {
            // Not far enough — elastic snap back
            springBack();
          }
        }

        if (mode.current === "vertical") {
          lastY.current = Math.min(Math.max(lastY.current + g.dy, MIN_Y), MAX_Y);
        }

        mode.current = "idle";
      },
    })
  ).current;

  // ── Animated styles ──────────────────────────────────────────────────────────
  // Button width grows as user pulls
  const animatedWidth = stretch.interpolate({
    inputRange: [0, MAX_STRETCH],
    outputRange: [BUTTON_W, BUTTON_W + 50],
    extrapolate: "clamp",
  });

  // Chevron moves inward as button stretches
  const chevronTranslate = stretch.interpolate({
    inputRange: [0, MAX_STRETCH],
    outputRange: [0, side === "left" ? 22 : -22],
    extrapolate: "clamp",
  });

  // Trail becomes visible when pulled
  const trailOpacity = stretch.interpolate({
    inputRange: [0, 16, MAX_STRETCH],
    outputRange: [0, 0, 0.55],
    extrapolate: "clamp",
  });

  const isRight = side === "right";

  return (
    <Animated.View
      style={[
        styles.wrapper,
        isRight ? { right: 0, left: undefined } : { left: 0 },
        { transform: [{ translateY: yAnim }] },
      ]}
      {...pan.panHandlers}
    >
      <View
        style={{
          // Transparent padding expands the invisible hit area
          paddingVertical: 30, // 30px tap area above & below
          paddingRight: isRight ? 0 : 30, // 30px tap area to the right
          paddingLeft: isRight ? 30 : 0,  // 30px tap area to the left
        }}
      >
        <Animated.View
          style={[
            styles.button,
            isRight ? styles.btnRight : styles.btnLeft,
            { width: animatedWidth },
          ]}
        >
          {/* Stretch trail */}
          <Animated.Text
            style={[
              styles.trail,
              isRight ? { left: 6 } : { right: 6 },
              { opacity: trailOpacity },
            ]}
          >
            {isRight ? "‹" : "›"}
          </Animated.Text>

          {/* Main icon — slides inward while pulling */}
          <Animated.View
            style={{ transform: [{ translateX: chevronTranslate }] }}
          >
            <Ionicons
              name={isRight ? "chevron-back" : "chevron-forward"}
              size={16}
              color="#22D3EE"
            />
          </Animated.View>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    zIndex: 999,
  },
  button: {
    width: undefined, // driven by Animated.View inside
    height: BUTTON_H,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#22D3EE",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 10,
  },
  btnLeft: {
    width: BUTTON_W,
    borderLeftWidth: 0,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderColor: "#334155",
  },
  btnRight: {
    width: BUTTON_W,
    borderRightWidth: 0,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderColor: "#334155",
  },
  trail: {
    position: "absolute",
    color: "#22D3EE",
    fontSize: 20,
    fontWeight: "200",
    top: 14,
  },
});

export default FloatingDrawerHandle;
