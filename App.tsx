// App.tsx - Pastikan sudah seperti ini
import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider, MD3LightTheme } from "react-native-paper";

import { AppProvider } from "./src/context/AppContext";
import AppNavigator from "./src/navigation/AppNavigator";

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#4F46E5",
    secondary: "#10B981",
    tertiary: "#F59E0B",
    error: "#DC2626",
    background: "#F9FAFB",
    surface: "#FFFFFF",
    surfaceVariant: "#F3F4F6",
    outline: "#D1D5DB",
  },
  roundness: 8,
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <AppProvider>
            <AppNavigator />
          </AppProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </PaperProvider>
  );
}
