import "react-native-gesture-handler";
import React, { useEffect, useCallback } from "react";
import { StatusBar, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider, MD3DarkTheme } from "react-native-paper";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";
import { AppProvider, useAppContext } from "./src/context/AppContext";
import { Colors } from "./src/theme/theme";
import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";
import AppNavigator from "./src/navigation/AppNavigator";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { adaptNavigationTheme } from "react-native-paper";
import { CustomAlertProvider } from "./src/components/Alert/CustomAlertProvider";
import GlobalLoading from "./src/components/Loading/GlobalLoading";

// Prevent native splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {});

// Adaptasi tema navigasi dengan React Native Paper
const { DarkTheme } = adaptNavigationTheme({
  reactNavigationDark: NavigationDarkTheme,
});

// ─── AppContent: Wrapper di dalam ThemeProvider agar bisa pakai useTheme ─────
const AppContent = () => {
  const { globalLoading } = useAppContext();
  const { colors } = useTheme();

  // Hide native splash screen immediately on first render, jangan nunggu data
  const splashHidden = React.useRef(false);
  useEffect(() => {
    if (!splashHidden.current) {
      splashHidden.current = true;
      // Small delay agar native splash sempat terlihat, lalu langsung hide
      const timer = setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {});
      }, 200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Buat tema React Native Paper yang reaktif terhadap tema aktif
  const CustomDarkTheme = {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      primary: colors.accent,
      primaryContainer: colors.surfaceLight,
      secondary: colors.info,
      secondaryContainer: colors.surface,
      tertiary: colors.warning,
      tertiaryContainer: colors.surface,
      surface: colors.surface,
      surfaceVariant: colors.surfaceLight,
      background: colors.background,
      error: colors.error,
      errorContainer: colors.error + "20",
      onPrimary: colors.textPrimary,
      onPrimaryContainer: colors.textPrimary,
      onSecondary: colors.textPrimary,
      onSecondaryContainer: colors.textPrimary,
      onSurface: colors.textPrimary,
      onSurfaceVariant: colors.textSecondary,
      onBackground: colors.textPrimary,
      outline: colors.border,
      outlineVariant: colors.borderLight,
      inverseSurface: colors.textPrimary,
      inverseOnSurface: colors.primary,
      inversePrimary: colors.accent,
      shadow: colors.primaryDark,
      scrim: colors.primaryDark + "CC",
      surfaceDisabled: colors.surface + "80",
      onSurfaceDisabled: colors.textTertiary + "80",
      backdrop: colors.primaryDark + "CC",
      elevation: {
        level0: "transparent",
        level1: colors.surface,
        level2: colors.surfaceLight,
        level3: colors.surfaceLight,
        level4: colors.surfaceLight,
        level5: colors.surfaceLight,
      },
    },
    roundness: 14,
  };

  return (
    <PaperProvider theme={CustomDarkTheme}>
      <StatusBar
        backgroundColor={colors.background}
        barStyle={
          colors.background === "#F8FAFC" ? "dark-content" : "light-content"
        }
        translucent={false}
      />
      <AppNavigator />
      <GlobalLoading
        visible={globalLoading.visible}
        message={globalLoading.message}
      />
    </PaperProvider>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (_notification) => {
        // Handle notification foreground receipt
      },
    );

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        // Handle navigation based on notification type
        const _data = response.notification.request.content.data;
      });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* ThemeProvider harus di luar AppProvider agar warna bisa dipakai oleh AppContent */}
        <ThemeProvider>
          <AppProvider>
            <CustomAlertProvider>
              <AppContent />
            </CustomAlertProvider>
          </AppProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
