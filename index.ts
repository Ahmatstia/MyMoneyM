import "react-native-gesture-handler";
import { registerRootComponent } from "expo";

import { LogBox } from "react-native";
import App from "./App";

const ignoredWarnings = [
  "InteractionManager has been deprecated",
  "expo-notifications: Android Push notifications",
  "`expo-notifications` functionality is not fully supported in Expo Go",
  "Error encountered while fetching auto-registration state",
  "⚠️ MULTIPLE CYCLE INCOMES DETECTED",
];

LogBox.ignoreLogs(ignoredWarnings);

// Filter out known third-party / framework deprecation warnings from terminal console
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const firstArg = typeof args[0] === "string" ? args[0] : "";
  if (ignoredWarnings.some((w) => firstArg.includes(w))) {
    return;
  }
  originalWarn(...args);
};

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
