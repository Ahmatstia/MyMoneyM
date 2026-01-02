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
    primary: "#4F46E5",
    accent: "#10B981",
    background: "#F9FAFB",
    surface: "#FFFFFF",
    error: "#DC2626",
    text: "#111827",
  },
  roundness: 12,
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          {/* GANTI StatusBar dari expo ke react-native */}
          <StatusBar
            backgroundColor="#4F46E5"
            barStyle="light-content"
            translucent={false} // Jangan translucent
          />
          <AppProvider>
            <AppNavigator />
          </AppProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </PaperProvider>
  );
}
