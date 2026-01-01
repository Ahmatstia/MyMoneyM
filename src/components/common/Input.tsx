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

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  prefix?: string;
  suffix?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  prefix,
  suffix,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          error ? styles.inputError : undefined,
          props.editable === false ? styles.inputDisabled : undefined,
        ]}
      >
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          style={[
            styles.input,
            prefix ? styles.inputWithPrefix : undefined,
            suffix ? styles.inputWithSuffix : undefined,
            style as TextStyle,
          ]}
          placeholderTextColor="#9CA3AF"
          {...props}
        />
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#374151",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
    minHeight: 48,
  },
  inputWithPrefix: {
    paddingLeft: 4,
  },
  inputWithSuffix: {
    paddingRight: 4,
  },
  inputError: {
    borderColor: "#DC2626",
  },
  inputDisabled: {
    backgroundColor: "#F3F4F6",
    opacity: 0.7,
  },
  error: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 4,
  },
  prefix: {
    fontSize: 16,
    color: "#6B7280",
    marginRight: 4,
  },
  suffix: {
    fontSize: 16,
    color: "#6B7280",
    marginLeft: 4,
  },
});

export default Input;
