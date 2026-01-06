// File: App.tsx
import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  PaperProvider,
  MD3DarkTheme,
  MD3LightTheme,
  adaptNavigationTheme,
} from "react-native-paper";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";
import { AppProvider } from "./src/context/AppContext";
import { Colors } from "./src/theme/theme";
import AppNavigator from "./src/navigation/AppNavigator";

// Adaptasi tema navigasi dengan React Native Paper
const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

// Buat tema kustom untuk React Native Paper MD3
const CustomDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Override dengan warna Navy Blue Anda
    primary: Colors.accent, // Cyan sebagai primary
    primaryContainer: Colors.surfaceLight, // Container untuk primary
    secondary: Colors.info, // Biru sebagai secondary
    secondaryContainer: Colors.surface, // Container untuk secondary
    tertiary: Colors.warning, // Kuning sebagai tertiary
    tertiaryContainer: Colors.surface, // Container untuk tertiary
    surface: Colors.surface, // Surface navy blue medium
    surfaceVariant: Colors.surfaceLight, // Surface variant
    background: Colors.background, // Background navy blue gelap
    error: Colors.error, // Merah
    errorContainer: Colors.error + "20", // Container error dengan opacity
    onPrimary: Colors.textPrimary, // Teks di atas primary
    onPrimaryContainer: Colors.textPrimary, // Teks di atas primary container
    onSecondary: Colors.textPrimary, // Teks di atas secondary
    onSecondaryContainer: Colors.textPrimary, // Teks di atas secondary container
    onSurface: Colors.textPrimary, // Teks di atas surface
    onSurfaceVariant: Colors.textSecondary, // Teks di atas surface variant
    onBackground: Colors.textPrimary, // Teks di atas background
    outline: Colors.border, // Outline/border
    outlineVariant: Colors.borderLight, // Outline variant
    inverseSurface: Colors.textPrimary, // Inverse surface
    inverseOnSurface: Colors.primary, // Teks di atas inverse surface
    inversePrimary: Colors.accent, // Inverse primary
    shadow: Colors.primaryDark, // Shadow
    scrim: Colors.primaryDark + "CC", // Scrim dengan opacity
    surfaceDisabled: Colors.surface + "80", // Surface disabled
    onSurfaceDisabled: Colors.textTertiary + "80", // Teks di surface disabled
    backdrop: Colors.primaryDark + "CC", // Backdrop
    elevation: {
      level0: "transparent",
      level1: Colors.surface, // Elevation level 1
      level2: Colors.surfaceLight, // Elevation level 2
      level3: Colors.surfaceLight, // Elevation level 3
      level4: Colors.surfaceLight, // Elevation level 4
      level5: Colors.surfaceLight, // Elevation level 5
    },
  },
  // Custom roundness
  roundness: 14,
};

// Jika ingin versi light theme juga (opsional)
const CustomLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    surface: Colors.surface,
    // ... tambahkan override lainnya jika perlu
  },
  roundness: 14,
};

export default function App() {
  return (
    <PaperProvider theme={CustomDarkTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar
            backgroundColor={Colors.primary} // Navy blue gelap
            barStyle="light-content" // Teks putih di status bar
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
