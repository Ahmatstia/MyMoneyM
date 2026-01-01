// File: src/navigation/AppNavigator.tsx
import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import {
  createStackNavigator,
  StackNavigationOptions,
} from "@react-navigation/stack";
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Avatar } from "react-native-paper";
import { CommonActions } from "@react-navigation/native";

// Screens
import HomeScreen from "../screens/Home/HomeScreen";
import TransactionsScreen from "../screens/Transactions/TransactionsScreen";
import BudgetScreen from "../screens/Budget/BudgetScreen";
import SavingsScreen from "../screens/Savings/SavingsScreen";
import AnalyticsScreen from "../screens/Analytics/AnalyticsScreen";
import AddTransactionScreen from "../screens/Transactions/AddTransactionScreen";
import AddBudgetScreen from "../screens/Budget/AddBudgetScreen";
import AddSavingsScreen from "../screens/Savings/AddSavingsScreen";
import { RootStackParamList } from "../types/index"; // HANYA import RootStackParamList

const Stack = createStackNavigator<RootStackParamList>();
// Buat Drawer dengan inline type
const Drawer = createDrawerNavigator<{
  MainStack: undefined;
}>();
const { width } = Dimensions.get("window");

// Custom Drawer Content dengan UI yang menarik
const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const [activeRoute, setActiveRoute] = useState<string>("Home");

  const menuItems = [
    {
      name: "Home",
      label: "Beranda",
      icon: "home-outline" as const,
      activeIcon: "home" as const,
    },
    {
      name: "Transactions",
      label: "Transaksi",
      icon: "swap-horizontal-outline" as const,
      activeIcon: "swap-horizontal" as const,
    },
    {
      name: "Analytics",
      label: "Analitik",
      icon: "stats-chart-outline" as const,
      activeIcon: "stats-chart" as const,
    },
    {
      name: "Budget",
      label: "Anggaran",
      icon: "pie-chart-outline" as const,
      activeIcon: "pie-chart" as const,
    },
    {
      name: "Savings",
      label: "Tabungan",
      icon: "wallet-outline" as const,
      activeIcon: "wallet" as const,
    },
  ];

  const navigateToScreen = (screenName: keyof RootStackParamList) => {
    setActiveRoute(screenName);
    // Navigasi ke screen yang dipilih
    props.navigation.navigate("MainStack", { screen: screenName });
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Drawer */}
      <LinearGradient
        colors={["#4F46E5", "#6366F1"]}
        style={styles.drawerHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.profileContainer}>
          <Avatar.Icon
            size={50}
            icon="account"
            style={styles.avatar}
            color="#4F46E5"
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>MyMoney App</Text>
            <Text style={styles.profileEmail}>Keuangan Pribadi</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => {
          const isActive = activeRoute === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() =>
                navigateToScreen(item.name as keyof RootStackParamList)
              }
              activeOpacity={0.7}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons
                  name={isActive ? item.activeIcon : item.icon}
                  size={24}
                  color={isActive ? "#4F46E5" : "#6B7280"}
                />
                {isActive && <View style={styles.activeIndicator} />}
              </View>
              <Text
                style={[styles.menuLabel, isActive && styles.menuLabelActive]}
              >
                {item.label}
              </Text>
              {isActive && (
                <View style={styles.activeArrow}>
                  <Ionicons name="chevron-forward" size={16} color="#4F46E5" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.drawerFooter}>
        <TouchableOpacity style={styles.footerItem}>
          <Ionicons name="settings-outline" size={22} color="#6B7280" />
          <Text style={styles.footerText}>Pengaturan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerItem}>
          <Ionicons name="help-circle-outline" size={22} color="#6B7280" />
          <Text style={styles.footerText}>Bantuan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerItem}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={[styles.footerText, { color: "#EF4444" }]}>Keluar</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

// Stack Navigator untuk semua screens
const MainStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={({ navigation }: any) => ({
        headerStyle: {
          backgroundColor: "#4F46E5",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
        },
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={{ marginLeft: 15 }}
          >
            <Ionicons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
        ),
      })}
    >
      {/* Main Screens */}
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Beranda",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => console.log("Notifikasi")}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      <Stack.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          title: "Transaksi",
        }}
      />

      <Stack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: "Analitik",
        }}
      />

      <Stack.Screen
        name="Budget"
        component={BudgetScreen}
        options={{
          title: "Anggaran",
        }}
      />

      <Stack.Screen
        name="Savings"
        component={SavingsScreen}
        options={{
          title: "Tabungan",
        }}
      />

      {/* Modal/Form Screens */}
      <Stack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={({ route, navigation }: any) => ({
          title: route.params?.editMode ? "Edit Transaksi" : "Tambah Transaksi",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />

      <Stack.Screen
        name="AddBudget"
        component={AddBudgetScreen}
        options={({ route, navigation }: any) => ({
          title: route.params?.editMode ? "Edit Anggaran" : "Tambah Anggaran",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />

      <Stack.Screen
        name="AddSavings"
        component={AddSavingsScreen}
        options={({ route, navigation }: any) => ({
          title: route.params?.editMode ? "Edit Tabungan" : "Tambah Tabungan",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
};

// Drawer Navigator
const DrawerNavigator = () => (
  <Drawer.Navigator
    drawerContent={(props) => <CustomDrawerContent {...props} />}
    screenOptions={{
      drawerStyle: {
        width: width * 0.8,
        backgroundColor: "transparent",
      },
      drawerType: "slide",
      overlayColor: "rgba(0,0,0,0.3)",
      swipeEdgeWidth: width,
      headerShown: false,
      swipeEnabled: true,
    }}
  >
    <Drawer.Screen
      name="MainStack"
      component={MainStackNavigator}
      options={{
        drawerLabel: () => null,
      }}
    />
  </Drawer.Navigator>
);

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  drawerHeader: {
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomRightRadius: 30,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  avatar: {
    backgroundColor: "#FFFFFF",
    marginRight: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  menuContainer: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginVertical: 4,
    borderRadius: 15,
    backgroundColor: "transparent",
  },
  menuItemActive: {
    backgroundColor: "rgba(79, 70, 229, 0.08)",
    borderLeftWidth: 4,
    borderLeftColor: "#4F46E5",
  },
  menuIconContainer: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4F46E5",
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginLeft: 15,
    flex: 1,
  },
  menuLabelActive: {
    color: "#4F46E5",
    fontWeight: "600",
  },
  activeArrow: {
    marginLeft: 10,
  },
  drawerFooter: {
    marginTop: "auto",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  footerText: {
    fontSize: 15,
    color: "#6B7280",
    marginLeft: 15,
    fontWeight: "500",
  },
});

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <DrawerNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;
