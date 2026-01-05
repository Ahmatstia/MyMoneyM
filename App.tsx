// [file name]: App.tsx
// [file content begin]
import "react-native-gesture-handler";
import React from "react";
import { StatusBar, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider, DefaultTheme } from "react-native-paper";
import { AppProvider } from "./src/context/AppContext";
import AppNavigator from "./src/navigation/AppNavigator";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#4F46E5", // Ganti ke indigo untuk konsisten dengan onboarding
    onPrimary: "#FFFFFF",
    secondary: "#2EE6C8",
    onSecondary: "#0B4FB3",
    background: "#F8FAFC",
    surface: "#FFFFFF",
    onSurface: "#1E293B",
    onBackground: "#1E293B",
    surfaceVariant: "#F1F5F9",
    onSurfaceVariant: "#64748B",
    outline: "#E2E8F0",
    outlineVariant: "#CBD5E1",
    error: "#EF4444",
    onError: "#FFFFFF",
    accent: "#2EE6C8",
    text: "#1E293B",
    success: "#10B981",
    warning: "#F59E0B",
    info: "#3B82F6",
  },
  roundness: 12,
  dark: false,
};

// HAPUS SplashScreen function yang lama
// HAPUS useState isLoading dan useEffect di App()

export default function App() {
  // HAPUS isLoading state dan timer

  // Langsung render AppNavigator, biar dia yang handle onboarding
  return (
    <PaperProvider theme={theme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar
            backgroundColor="#4F46E5"
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
// [file content end]
