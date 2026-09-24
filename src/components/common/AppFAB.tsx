// File: src/components/common/AppFAB.tsx
import React, { useRef } from "react";
import { Animated, TouchableOpacity, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";

interface AppFABProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  accessibilityLabel?: string;
  bottom?: number;
  right?: number;
  style?: ViewStyle;
}

/**
 * Standardized Floating Action Button (FAB)
 * Petak rounded / squircle (54x54, r: 17) positioned at bottom-right.
 * Replaces divergent add button placements (e.g. header buttons) across screens.
 */
export const AppFAB: React.FC<AppFABProps> = ({
  onPress,
  icon = "add",
  accessibilityLabel = "Tambah",
  bottom = 24,
  right = 20,
  style,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          bottom,
          right,
          width: 54,
          height: 54,
          borderRadius: 17,
          backgroundColor: colors.accent,
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.45,
          shadowRadius: 14,
          elevation: 12,
          transform: [{ scale: scaleAnim }],
          zIndex: 999,
        },
        style,
      ]}
    >
      <TouchableOpacity
        style={{
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
        onPress={onPress}
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        <Ionicons name={icon} size={28} color={colors.background} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default AppFAB;
