// File: src/components/common/AppSectionHeader.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

interface AppSectionHeaderProps {
  title: string;
  linkLabel?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * Standardized Section Header with Accent Bar
 * Replaces duplicate local SectionHeader across all screens.
 */
export const AppSectionHeader: React.FC<AppSectionHeaderProps> = ({
  title,
  linkLabel,
  onPress,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleRow}>
        <View
          style={[
            styles.accentBar,
            { backgroundColor: colors.accent },
          ]}
        />
        <Text
          style={[
            styles.titleText,
            { color: colors.gray400 },
          ]}
        >
          {title}
        </Text>
      </View>
      {linkLabel && onPress && (
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.linkText, { color: colors.accent }]}>
            {linkLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  accentBar: {
    width: 3,
    height: 13,
    borderRadius: 2,
    marginRight: 8,
  },
  titleText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  linkText: {
    fontSize: 11,
    fontWeight: "600",
  },
});

export default AppSectionHeader;
