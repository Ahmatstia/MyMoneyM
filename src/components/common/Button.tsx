// File: src/components/common/Button.tsx
import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
} from "react-native";
import tw from "twrnc";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  leftIcon?: string;
  rightIcon?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  loading = false,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return tw`bg-indigo-600`;
      case "secondary":
        return tw`bg-gray-600`;
      case "outline":
        return tw`bg-transparent border border-gray-300`;
      case "danger":
        return tw`bg-red-600`;
      default:
        return tw`bg-indigo-600`;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return tw`py-2 px-3`;
      case "medium":
        return tw`py-3 px-4`;
      case "large":
        return tw`py-4 px-6`;
      default:
        return tw`py-3 px-4`;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "outline":
        return tw`text-gray-700`;
      default:
        return tw`text-white`;
    }
  };

  return (
    <TouchableOpacity
      style={[
        tw`rounded-lg items-center justify-center flex-row`,
        getVariantStyles(),
        getSizeStyles(),
        fullWidth && tw`w-full`,
        (disabled || loading) && tw`opacity-60`,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <>
          <ActivityIndicator color="#FFFFFF" size="small" />
          <Text style={[tw`text-base font-medium ml-2`, getTextColor()]}>
            Memproses...
          </Text>
        </>
      ) : (
        <>
          {leftIcon && <Text style={tw`mr-2`}>{leftIcon}</Text>}
          <Text style={[tw`text-base font-medium`, getTextColor()]}>
            {title}
          </Text>
          {rightIcon && <Text style={tw`ml-2`}>{rightIcon}</Text>}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
