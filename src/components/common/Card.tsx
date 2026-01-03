// File: src/components/common/Card.tsx
import React from "react";
import { View, ViewProps } from "react-native";
import tw from "twrnc";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  elevated?: boolean;
  padding?: "none" | "small" | "medium" | "large";
}

const Card: React.FC<CardProps> = ({
  children,
  elevated = true,
  padding = "medium",
  style,
  ...props
}) => {
  const getPadding = () => {
    switch (padding) {
      case "none":
        return tw`p-0`;
      case "small":
        return tw`p-3`;
      case "medium":
        return tw`p-4`;
      case "large":
        return tw`p-6`;
      default:
        return tw`p-4`;
    }
  };

  return (
    <View
      style={[
        tw`bg-white rounded-xl`,
        elevated && tw`shadow-sm border border-gray-100`,
        getPadding(),
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

export default Card;
