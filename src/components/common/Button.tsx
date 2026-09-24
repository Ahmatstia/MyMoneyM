// File: src/components/common/Button.tsx
import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  loading = false,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  leftIcon,
  rightIcon,
  iconSize = 18,
  disabled,
  style,
  ...props
}) => {
  const { colors } = useTheme();

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case "primary":
        return {
          container: {
            backgroundColor: colors.accent,
            borderColor: colors.accent,
          },
          text: { color: "#FFFFFF" },
        };
      case "secondary":
        return {
          container: {
            backgroundColor: colors.surface,
            borderColor: `${colors.border}80`,
            borderWidth: 1,
          },
          text: { color: colors.textPrimary },
        };
      case "outline":
        return {
          container: {
            backgroundColor: "transparent",
            borderColor: `${colors.border}80`,
            borderWidth: 1,
          },
          text: { color: colors.textPrimary },
        };
      case "danger":
        return {
          container: {
            backgroundColor: colors.error,
            borderColor: colors.error,
          },
          text: { color: "#FFFFFF" },
        };
      case "ghost":
        return {
          container: {
            backgroundColor: "transparent",
            borderColor: "transparent",
          },
          text: { color: colors.accent },
        };
      default:
        return {
          container: {
            backgroundColor: colors.accent,
            borderColor: colors.accent,
          },
          text: { color: "#FFFFFF" },
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case "small":
        return {
          container: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
          text: { fontSize: 12 },
        };
      case "medium":
        return {
          container: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, minHeight: 48 },
          text: { fontSize: 13 },
        };
      case "large":
        return {
          container: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, minHeight: 52 },
          text: { fontSize: 15 },
        };
      default:
        return {
          container: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, minHeight: 48 },
          text: { fontSize: 13 },
        };
    }
  };

  const variantStyle = getVariantStyles();
  const sizeStyle = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.baseButton,
        variantStyle.container,
        sizeStyle.container,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <View style={styles.contentRow}>
          <ActivityIndicator color={variantStyle.text.color} size="small" />
          <Text style={[styles.baseText, sizeStyle.text, variantStyle.text, styles.loadingText]}>
            Memproses...
          </Text>
        </View>
      ) : (
        <View style={styles.contentRow}>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={iconSize}
              color={variantStyle.text.color as string}
              style={styles.leftIcon}
            />
          )}
          <Text style={[styles.baseText, sizeStyle.text, variantStyle.text]}>
            {title}
          </Text>
          {rightIcon && (
            <Ionicons
              name={rightIcon}
              size={iconSize}
              color={variantStyle.text.color as string}
              style={styles.rightIcon}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  baseText: {
    fontWeight: "700",
  },
  loadingText: {
    marginLeft: 8,
  },
  leftIcon: {
    marginRight: 6,
  },
  rightIcon: {
    marginLeft: 6,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.6,
  },
});

export default Button;
