// File: src/components/common/AppHeader.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../theme/ThemeContext";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  showBorderBottom?: boolean;
  style?: ViewStyle;
}

/**
 * Standard Screen Header Bar
 * Unified 56px pattern across all non-dashboard and push screens.
 */
export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = true,
  onBackPress,
  rightComponent,
  showBorderBottom = false,
  style,
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const canGoBack = showBack && (onBackPress || navigation.canGoBack());

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderBottomColor: `${colors.border}80`,
          borderBottomWidth: showBorderBottom ? 1 : 0,
        },
        style,
      ]}
    >
      <View style={styles.leftRow}>
        {canGoBack && (
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[
              styles.backButton,
              { backgroundColor: `${colors.surfaceLight}80` },
            ]}
            accessibilityLabel="Kembali"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.titleWrapper}>
          <Text
            style={[styles.title, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[styles.subtitle, { color: colors.gray400 }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {rightComponent && (
        <View style={styles.rightWrapper}>
          {rightComponent}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  titleWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  rightWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
});

export default AppHeader;
