import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  icon?: string;
  iconPosition?: "left" | "right";
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  loading = false,
  disabled = false,
  variant = "primary",
  icon,
  iconPosition = "left",
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case "secondary":
        return styles.secondary;
      case "danger":
        return styles.danger;
      case "outline":
        return styles.outline;
      case "ghost":
        return styles.ghost;
      default:
        return styles.primary;
    }
  };

  const getTextVariantStyle = () => {
    switch (variant) {
      case "secondary":
        return styles.secondaryText;
      case "danger":
        return styles.dangerText;
      case "outline":
        return styles.outlineText;
      case "ghost":
        return styles.ghostText;
      default:
        return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getVariantStyle(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === "left" && (
            <Ionicons
              name={icon as any}
              size={20}
              color={getTextVariantStyle().color}
              style={styles.iconLeft}
            />
          )}
          <Text style={[styles.text, getTextVariantStyle(), textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === "right" && (
            <Ionicons
              name={icon as any}
              size={20}
              color={getTextVariantStyle().color}
              style={styles.iconRight}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    flexDirection: "row",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: "#4F46E5",
  },
  secondary: {
    backgroundColor: "#10B981",
  },
  danger: {
    backgroundColor: "#DC2626",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#4F46E5",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  primaryText: {
    color: "#FFFFFF",
  },
  secondaryText: {
    color: "#FFFFFF",
  },
  dangerText: {
    color: "#FFFFFF",
  },
  outlineText: {
    color: "#4F46E5",
  },
  ghostText: {
    color: "#4F46E5",
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;
