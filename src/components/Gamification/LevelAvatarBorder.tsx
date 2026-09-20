import React, { useMemo } from "react";
import { View, Image, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useGamification } from "../../context/GamificationContext";
import { getTierTheme } from "../../utils/gamificationEngine";
import { useTheme } from "../../theme/ThemeContext";

interface LevelAvatarBorderProps {
  avatarUri?: string | null;
  name?: string;
  size?: number;
  showLevelBadge?: boolean;
  onPress?: () => void;
}

export const LevelAvatarBorder: React.FC<LevelAvatarBorderProps> = ({
  avatarUri,
  name = "User",
  size = 80,
  showLevelBadge = true,
  onPress,
}) => {
  const { colors } = useTheme();
  const { progress } = useGamification();

  const tierTheme = useMemo(
    () => getTierTheme(progress.borderTier),
    [progress.borderTier]
  );

  const borderWidth = Math.max(3, Math.round(size * 0.045));
  const innerSize = size - borderWidth * 2;
  const badgeSize = Math.max(18, Math.round(size * 0.28));

  const content = (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {/* ─── Outer Gradient Border ───────────────────────────────────── */}
      <LinearGradient
        colors={tierTheme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradientBorder,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            padding: borderWidth,
            shadowColor: tierTheme.primary,
          },
        ]}
      >
        {/* Inner Avatar Container */}
        <View
          style={[
            styles.innerContainer,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              backgroundColor: colors.surface,
            },
          ]}
        >
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={{
                width: innerSize,
                height: innerSize,
                borderRadius: innerSize / 2,
              }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.fallbackAvatar,
                {
                  width: innerSize,
                  height: innerSize,
                  borderRadius: innerSize / 2,
                  backgroundColor: colors.surfaceLight,
                },
              ]}
            >
              <Text
                style={[
                  styles.initialText,
                  {
                    color: tierTheme.primary,
                    fontSize: Math.round(innerSize * 0.42),
                  },
                ]}
              >
                {(name || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* ─── Level Badge Pill at Bottom ─────────────────────────────── */}
      {showLevelBadge && (
        <View style={styles.badgeWrapper}>
          <LinearGradient
            colors={tierTheme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.levelBadge,
              {
                minHeight: badgeSize,
                borderRadius: badgeSize / 2,
                borderColor: colors.background,
              },
            ]}
          >
            <Ionicons
              name="star"
              size={Math.round(badgeSize * 0.55)}
              color="#FFFFFF"
            />
            <Text
              style={[
                styles.badgeText,
                {
                  fontSize: Math.max(9, Math.round(badgeSize * 0.52)),
                },
              ]}
            >
              Lv.{progress.level}
            </Text>
          </LinearGradient>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  gradientBorder: {
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  innerContainer: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackAvatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  initialText: {
    fontWeight: "800",
  },
  badgeWrapper: {
    position: "absolute",
    bottom: -4,
    zIndex: 10,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderWidth: 1.5,
    elevation: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontWeight: "900",
    letterSpacing: 0.2,
  },
});
