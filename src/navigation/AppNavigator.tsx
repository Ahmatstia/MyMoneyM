// File: src/navigation/AppNavigator.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";

// Screens
import HomeScreen from "../screens/Home/HomeScreen";
import TransactionsScreen from "../screens/Transactions/TransactionsScreen";
import BudgetScreen from "../screens/Budget/BudgetScreen";
import SavingsScreen from "../screens/Savings/SavingsScreen";
import AddTransactionScreen from "../screens/Transactions/AddTransactionScreen";
import AddBudgetScreen from "../screens/Budget/AddBudgetScreen";
import AddSavingsScreen from "../screens/Savings/AddSavingsScreen";
import { RootStackParamList } from "../types";

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: "#4F46E5",
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "600",
      },
    }}
  >
    <Stack.Screen
      name="Home"
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="AddTransaction"
      component={AddTransactionScreen}
      options={{ title: "Tambah Transaksi" }}
    />
    <Stack.Screen
      name="AddBudget"
      component={AddBudgetScreen}
      options={{ title: "Tambah Anggaran" }}
    />
    <Stack.Screen
      name="AddSavings"
      component={AddSavingsScreen}
      options={{ title: "Tambah Target Tabungan" }}
    />
  </Stack.Navigator>
);

const TransactionStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: "#4F46E5",
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "600",
      },
    }}
  >
    <Stack.Screen
      name="Transactions"
      component={TransactionsScreen}
      options={{ title: "Transaksi" }}
    />
    <Stack.Screen
      name="AddTransaction"
      component={AddTransactionScreen}
      options={({ route }) => ({
        title: route.params?.editMode ? "Edit Transaksi" : "Tambah Transaksi",
      })}
    />
    {/* HAPUS EditTransaction Screen karena sudah digabung */}
  </Stack.Navigator>
);

const BudgetStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: "#4F46E5",
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "600",
      },
    }}
  >
    <Stack.Screen
      name="Budget"
      component={BudgetScreen}
      options={{ title: "Anggaran" }}
    />
    <Stack.Screen
      name="AddBudget"
      component={AddBudgetScreen}
      options={{ title: "Tambah Anggaran" }}
    />
  </Stack.Navigator>
);

const SavingsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: "#4F46E5",
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "600",
      },
    }}
  >
    <Stack.Screen
      name="Savings"
      component={SavingsScreen}
      options={{ title: "Tabungan" }}
    />
    <Stack.Screen
      name="AddSavings"
      component={AddSavingsScreen}
      options={{ title: "Tambah Target Tabungan" }}
    />
  </Stack.Navigator>
);

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: "#4F46E5",
      tabBarInactiveTintColor: "#6B7280",
      tabBarStyle: {
        paddingBottom: 5,
        height: 60,
      },
      headerShown: false,
    }}
  >
    <Tab.Screen
      name="HomeTab"
      component={HomeStack}
      options={{
        title: "Beranda",
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="home" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="TransactionsTab"
      component={TransactionStack}
      options={{
        title: "Transaksi",
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="swap-horizontal" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="BudgetTab"
      component={BudgetStack}
      options={{
        title: "Anggaran",
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="pie-chart" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="SavingsTab"
      component={SavingsStack}
      options={{
        title: "Tabungan",
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="wallet" size={size} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;
