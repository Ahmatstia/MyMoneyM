// File: src/components/common/Input.tsx
import React from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  prefix?: string;
  suffix?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  prefix,
  suffix,
  helperText,
  style,
  ...props
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : `${colors.border}80`,
          },
          props.editable === false ? { opacity: 0.6 } : null,
        ]}
      >
        {prefix && (
          <Text style={[styles.prefix, { color: colors.textSecondary }]}>
            {prefix}
          </Text>
        )}

        <TextInput
          style={[
            styles.input,
            { color: colors.textPrimary },
            prefix ? styles.inputWithPrefix : null,
            suffix ? styles.inputWithSuffix : null,
            style as TextStyle,
          ]}
          placeholderTextColor={colors.gray500}
          {...props}
        />

        {suffix && (
          <Text style={[styles.suffix, { color: colors.textSecondary }]}>
            {suffix}
          </Text>
        )}
      </View>

      {error ? (
        <Text style={[styles.error, { color: colors.error }]}>
          {error}
        </Text>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: colors.gray400 }]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 6,
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: "600",
  },
  inputWithPrefix: {
    paddingLeft: 6,
  },
  inputWithSuffix: {
    paddingRight: 6,
  },
  prefix: {
    fontSize: 14,
    fontWeight: "700",
  },
  suffix: {
    fontSize: 12,
    fontWeight: "500",
  },
  error: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default Input;
