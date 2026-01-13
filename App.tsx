import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider, MD3DarkTheme } from "react-native-paper";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";
import { AppProvider } from "./src/context/AppContext";
import { Colors } from "./src/theme/theme";
import AppNavigator from "./src/navigation/AppNavigator";
import * as Notifications from "expo-notifications";
import { adaptNavigationTheme } from "react-native-paper";

// Adaptasi tema navigasi dengan React Native Paper
const { DarkTheme } = adaptNavigationTheme({
  reactNavigationDark: NavigationDarkTheme,
});

// Buat tema kustom untuk React Native Paper MD3
const CustomDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.accent,
    primaryContainer: Colors.surfaceLight,
    secondary: Colors.info,
    secondaryContainer: Colors.surface,
    tertiary: Colors.warning,
    tertiaryContainer: Colors.surface,
    surface: Colors.surface,
    surfaceVariant: Colors.surfaceLight,
    background: Colors.background,
    error: Colors.error,
    errorContainer: Colors.error + "20",
    onPrimary: Colors.textPrimary,
    onPrimaryContainer: Colors.textPrimary,
    onSecondary: Colors.textPrimary,
    onSecondaryContainer: Colors.textPrimary,
    onSurface: Colors.textPrimary,
    onSurfaceVariant: Colors.textSecondary,
    onBackground: Colors.textPrimary,
    outline: Colors.border,
    outlineVariant: Colors.borderLight,
    inverseSurface: Colors.textPrimary,
    inverseOnSurface: Colors.primary,
    inversePrimary: Colors.accent,
    shadow: Colors.primaryDark,
    scrim: Colors.primaryDark + "CC",
    surfaceDisabled: Colors.surface + "80",
    onSurfaceDisabled: Colors.textTertiary + "80",
    backdrop: Colors.primaryDark + "CC",
    elevation: {
      level0: "transparent",
      level1: Colors.surface,
      level2: Colors.surfaceLight,
      level3: Colors.surfaceLight,
      level4: Colors.surfaceLight,
      level5: Colors.surfaceLight,
    },
  },
  roundness: 14,
};

export default function App() {
  // Configure notification behavior
  useEffect(() => {
    // Listen for notifications when app is foreground
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log(
          "📱 Notification received:",
          notification.request.content.title
        );
      }
    );

    // Handle notification response (user taps)
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          "👆 Notification tapped:",
          response.notification.request.content.data
        );

        // Here you can handle navigation based on notification type
        const data = response.notification.request.content.data;

        // Example: Navigate based on notification type
        // if (data.type === 'BUDGET_WARNING') {
        //   // Use navigation ref or context to navigate
        // }
      });

    // Configure notification appearance
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return (
    <PaperProvider theme={CustomDarkTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar
            backgroundColor={Colors.primary}
            barStyle="light-content"
            translucent={false}
          />
          <AppProvider>
            <AppNavigator />
          </AppProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </PaperProvider>
  );
}
