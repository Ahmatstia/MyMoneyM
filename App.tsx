import "react-native-gesture-handler";
import React from "react";
import { StatusBar, Platform } from "react-native"; // IMPORT DARI REACT-NATIVE
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider, DefaultTheme } from "react-native-paper";
import { AppProvider } from "./src/context/AppContext";
import AppNavigator from "./src/navigation/AppNavigator";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    // Primary & Secondary Colors dari Logo
    primary: "#0B4FB3", // Deep Blue / Royal Blue dari logo
    onPrimary: "#FFFFFF", // White text on primary

    secondary: "#2EE6C8", // Teal / Mint Green dari logo
    onSecondary: "#0B4FB3", // Deep Blue text on secondary

    // Surface & Background (Light Mode - Professional)
    background: "#F8FAFC", // Very light blue-gray (clean & professional)
    surface: "#FFFFFF", // Pure white for cards

    // Text Colors
    onSurface: "#1E293B", // Dark blue-gray for text (professional)
    onBackground: "#1E293B", // Dark blue-gray for text

    // Variants
    surfaceVariant: "#F1F5F9", // Light gray for subtle elevation
    onSurfaceVariant: "#64748B", // Medium gray for secondary text

    // Outline
    outline: "#E2E8F0", // Light border
    outlineVariant: "#CBD5E1", // Slightly darker border

    // Error & Status
    error: "#EF4444",
    onError: "#FFFFFF",

    // Untuk kompatibilitas dengan kode lama
    accent: "#2EE6C8", // Teal/Mint Green untuk aksen
    text: "#1E293B", // Text color untuk kompatibilitas

    // Success/Warning/Info colors untuk keuangan
    success: "#10B981", // Green for positive
    warning: "#F59E0B", // Amber for warning
    info: "#3B82F6", // Blue for info
  },
  roundness: 12, // Modern rounded corners
  dark: false, // Light mode
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          {/* UPDATE STATUS BAR UNTUK DARK MODE */}
          <StatusBar
            backgroundColor="#0E1624" // Sama dengan background theme
            barStyle="light-content" // Teks putih untuk kontras
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
