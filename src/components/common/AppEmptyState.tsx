// File: src/components/common/AppEmptyState.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";

interface AppEmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

/**
 * Standardized Empty State View
 * Replaces ad-hoc empty states across all screens.
 */
export const AppEmptyState: React.FC<AppEmptyStateProps> = ({
  icon = "file-tray-outline",
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: `${colors.surfaceLight}60`,
            borderColor: `${colors.border}80`,
          },
        ]}
      >
        <Ionicons name={icon} size={36} color={colors.gray400} />
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {title}
      </Text>

      {description ? (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      ) : null}

      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.8}
          style={[styles.actionButton, { backgroundColor: colors.accent }]}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
    maxWidth: 280,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});

export default AppEmptyState;
