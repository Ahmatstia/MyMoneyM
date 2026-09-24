// File: src/components/common/AppHeader.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../theme/ThemeContext";

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  showBorderBottom?: boolean;
  style?: ViewStyle;
}

/**
 * Standard Compact Fintech Header Bar
 * Formatted exactly according to the WalletsScreen compact header design:
 * - Surface background with subtle border bottom
 * - 40x40 circular arrow-back button (44+ touch target with hitSlop)
 * - 18px 700 title with -0.3 letter-spacing
 * - 11px 500 subtitle with textSecondary color
 * - Flexible rightComponent slot
 */
export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = true,
  onBackPress,
  rightComponent,
  showBorderBottom = true,
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
          backgroundColor: colors.surface,
          borderBottomColor: `${colors.border}60`,
          borderBottomWidth: showBorderBottom ? 1 : 0,
        },
        style,
      ]}
    >
      {canGoBack && (
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backButton}
          accessibilityLabel="Kembali"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      )}

      <View style={[styles.titleWrapper, { marginLeft: canGoBack ? 12 : 0, marginRight: rightComponent ? 8 : 0 }]}>
        <Text
          style={[styles.title, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.subtitle, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
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
    paddingVertical: 10,
    minHeight: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  rightWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default AppHeader;
