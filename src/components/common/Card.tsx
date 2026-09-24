// File: src/components/common/Card.tsx
import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: "none" | "small" | "medium" | "large";
  radius?: number;
  border?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = "medium",
  radius = 16,
  border = true,
  style,
  ...props
}) => {
  const { colors } = useTheme();

  const getPadding = () => {
    switch (padding) {
      case "none":
        return 0;
      case "small":
        return 12;
      case "medium":
        return 16;
      case "large":
        return 20;
      default:
        return 16;
    }
  };

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius,
          borderWidth: border ? 1 : 0,
          borderColor: `${colors.border}80`,
          padding: getPadding(),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

export default Card;
