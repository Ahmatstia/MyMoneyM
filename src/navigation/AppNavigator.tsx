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
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { Avatar } from "react-native-paper";
import tw from "twrnc";

// Screens
import HomeScreen from "../screens/Home/HomeScreen";
import TransactionsScreen from "../screens/Transactions/TransactionsScreen";
import BudgetScreen from "../screens/Budget/BudgetScreen";
import SavingsScreen from "../screens/Savings/SavingsScreen";
import AnalyticsScreen from "../screens/Analytics/AnalyticsScreen";
import AddTransactionScreen from "../screens/Transactions/AddTransactionScreen";
import AddBudgetScreen from "../screens/Budget/AddBudgetScreen";
import AddSavingsScreen from "../screens/Savings/AddSavingsScreen";
import { RootStackParamList } from "../types/index";

const Stack = createStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<{
  MainStack: undefined;
}>();
const { width, height } = Dimensions.get("window");

// Custom Drawer Content Minimalis
const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const [activeRoute, setActiveRoute] = useState<string>("Home");

  const menuItems = [
    {
      name: "Home",
      label: "Beranda",
      icon: "home-outline" as const,
      activeIcon: "home" as const,
      color: "#4F46E5",
    },
    {
      name: "Transactions",
      label: "Transaksi",
      icon: "swap-horizontal-outline" as const,
      activeIcon: "swap-horizontal" as const,
      color: "#10B981",
    },
    {
      name: "Analytics",
      label: "Analitik",
      icon: "stats-chart-outline" as const,
      activeIcon: "stats-chart" as const,
      color: "#F59E0B",
    },
    {
      name: "Budget",
      label: "Anggaran",
      icon: "pie-chart-outline" as const,
      activeIcon: "pie-chart" as const,
      color: "#8B5CF6",
    },
    {
      name: "Savings",
      label: "Tabungan",
      icon: "wallet-outline" as const,
      activeIcon: "wallet" as const,
      color: "#EC4899",
    },
  ];

  const navigateToScreen = (screenName: keyof RootStackParamList) => {
    setActiveRoute(screenName);
    props.navigation.navigate("MainStack", { screen: screenName });
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      {/* Header Minimalis */}
      <View style={tw`pt-10 pb-6 px-6 bg-indigo-600`}>
        <View style={tw`flex-row items-center`}>
          <Avatar.Icon
            size={44}
            icon="currency-usd"
            style={tw`bg-white`}
            color="#4F46E5"
          />
          <View style={tw`ml-4 flex-1`}>
            <Text style={tw`text-white text-lg font-bold`}>MyMoney</Text>
            <Text style={tw`text-indigo-100 text-xs mt-0.5`}>
              Keuangan Pribadi
            </Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu Items Minimalis */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={tw`pt-2`}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={tw`text-gray-500 text-xs font-medium px-6 mb-2 uppercase tracking-wider`}
        >
          Menu
        </Text>

        {menuItems.map((item) => {
          const isActive = activeRoute === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[
                tw`flex-row items-center py-3 px-6 mx-4 rounded-lg mb-1`,
                isActive ? tw`bg-indigo-50` : tw``,
              ]}
              onPress={() =>
                navigateToScreen(item.name as keyof RootStackParamList)
              }
              activeOpacity={0.7}
            >
              <View
                style={[
                  tw`w-8 h-8 rounded-lg items-center justify-center mr-3`,
                  isActive ? tw`bg-indigo-100` : tw`bg-gray-50`,
                ]}
              >
                <Ionicons
                  name={isActive ? item.activeIcon : item.icon}
                  size={18}
                  color={isActive ? item.color : "#6B7280"}
                />
              </View>

              <Text
                style={[
                  tw`text-sm flex-1`,
                  isActive
                    ? tw`text-indigo-600 font-semibold`
                    : tw`text-gray-700`,
                ]}
              >
                {item.label}
              </Text>

              {isActive && (
                <View style={tw`w-1.5 h-1.5 rounded-full bg-indigo-500`} />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Divider */}
        <View style={tw`h-px bg-gray-100 my-4 mx-6`} />

        {/* Additional Menu */}
        <TouchableOpacity
          style={tw`flex-row items-center py-3 px-6 mx-4 rounded-lg mb-1`}
        >
          <View
            style={tw`w-8 h-8 rounded-lg bg-amber-50 items-center justify-center mr-3`}
          >
            <Ionicons name="help-circle-outline" size={18} color="#F59E0B" />
          </View>
          <Text style={tw`text-gray-700 text-sm flex-1`}>Bantuan & FAQ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`flex-row items-center py-3 px-6 mx-4 rounded-lg`}
        >
          <View
            style={tw`w-8 h-8 rounded-lg bg-blue-50 items-center justify-center mr-3`}
          >
            <Ionicons name="document-text-outline" size={18} color="#3B82F6" />
          </View>
          <Text style={tw`text-gray-700 text-sm flex-1`}>Laporan</Text>
        </TouchableOpacity>
      </DrawerContentScrollView>

      {/* Footer Minimalis */}
      <View style={tw`border-t border-gray-100 p-4`}>
        <TouchableOpacity style={tw`flex-row items-center`} activeOpacity={0.7}>
          <View
            style={tw`w-8 h-8 rounded-lg bg-red-50 items-center justify-center mr-3`}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          </View>
          <View style={tw`flex-1`}>
            <Text style={tw`text-gray-800 text-sm font-medium`}>Keluar</Text>
            <Text style={tw`text-gray-500 text-xs`}>Keluar dari akun</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Stack Navigator dengan Header Fixed
const MainStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={({ navigation }: any) => ({
        headerStyle: {
          backgroundColor: "#4F46E5",
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === "ios" ? 100 : 70, // Height disesuaikan platform
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
        },
        headerTitleAlign: "center" as const,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={tw`ml-4`}
          >
            <Ionicons name="menu" size={24} color="#fff" />
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
          title: route.params?.editMode ? "Edit Transaksi" : "Transaksi Baru",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={tw`ml-4`}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />

      <Stack.Screen
        name="AddBudget"
        component={AddBudgetScreen}
        options={({ route, navigation }: any) => ({
          title: route.params?.editMode ? "Edit Anggaran" : "Anggaran Baru",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={tw`ml-4`}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />

      <Stack.Screen
        name="AddSavings"
        component={AddSavingsScreen}
        options={({ route, navigation }: any) => ({
          title: route.params?.editMode ? "Edit Tabungan" : "Tabungan Baru",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={tw`ml-4`}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
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
        width: width * 0.75, // Lebih narrow
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

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <DrawerNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;
