import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
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
  Alert,
  ActivityIndicator,
} from "react-native";
import tw from "twrnc";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Screens
import HomeScreen from "../screens/Home/HomeScreen";
import TransactionsScreen from "../screens/Transactions/TransactionsScreen";
import BudgetScreen from "../screens/Budget/BudgetScreen";
import SavingsScreen from "../screens/Savings/SavingsScreen";
import SavingsDetailScreen from "../screens/Savings/SavingsDetailScreen";
import AnalyticsScreen from "../screens/Analytics/AnalyticsScreen";
import AddTransactionScreen from "../screens/Transactions/AddTransactionScreen";
import AddBudgetScreen from "../screens/Budget/AddBudgetScreen";
import AddSavingsScreen from "../screens/Savings/AddSavingsScreen";
import CalendarScreen from "../screens/Calendar/CalendarScreen";
import AddSavingsTransactionScreen from "../screens/Savings/AddSavingsTransactionScreen";
import SavingsHistoryScreen from "../screens/Savings/SavingsHistoryScreen";
import ProfileScreen from "../screens/Profile/ProfileScreen";
import OnboardingScreen from "../screens/Onboarding/OnboardingScreen";
import SettingsScreen from "../screens/Settings/SettingsScreen"; // ✅ TAMBAH INI

import NotesScreen from "../screens/Notes/NotesScreen";
import NoteFormScreen from "../screens/Notes/NoteFormScreen";
import NoteDetailScreen from "../screens/Notes/NoteDetailScreen";

// TEMA NAVY BLUE YANG DISEMPURNAKAN
const PRIMARY_COLOR = "#0F172A"; // Navy blue gelap (utama)
const ACCENT_COLOR = "#22D3EE"; // Cyan terang (aksen)
const BACKGROUND_COLOR = "#0F172A"; // Background navy blue gelap
const SURFACE_COLOR = "#1E293B"; // Permukaan navy blue medium
const TEXT_PRIMARY = "#F8FAFC"; // Teks utama putih
const TEXT_SECONDARY = "#CBD5E1"; // Teks sekunder abu-abu muda
const BORDER_COLOR = "#334155"; // Border navy blue lebih terang
const SUCCESS_COLOR = "#10B981"; // Hijau
const WARNING_COLOR = "#F59E0B"; // Kuning
const ERROR_COLOR = "#EF4444"; // Merah
const INFO_COLOR = "#3B82F6"; // Biru terang

// Types
type StackParamList = {
  Onboarding: undefined;
  MainDrawer: undefined;
  Home: undefined;
  Transactions: undefined;
  Budget: undefined;
  Savings: undefined;
  Analytics: undefined;
  Calendar: undefined;
  Profile: undefined;
  Notes: undefined;
  Settings: undefined; // ✅ TAMBAH INI
  SavingsDetail: { savingsId: string };
  SavingsHistory: { savingsId: string };
  AddTransaction: { editMode?: boolean; transactionData?: any };
  AddBudget: { editMode?: boolean; budgetData?: any };
  AddSavings: { editMode?: boolean; savingsData?: any };
  AddSavingsTransaction: { savingsId: string; type?: "deposit" | "withdrawal" };
  NoteForm: { noteId?: string };
  NoteDetail: { noteId: string };
};

// BUAT DUA STACK NAVIGATOR TERPISAH
const MainStack = createStackNavigator<StackParamList>();
const RootStack = createStackNavigator();
const Drawer = createDrawerNavigator();
const { width } = Dimensions.get("window");

// Custom Drawer Content (DIPERBAIKI)
const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const menuItems = [
    {
      name: "Home",
      label: "Beranda",
      icon: "home-outline" as const,
      activeIcon: "home" as const,
      color: "#22D3EE",
    },
    {
      name: "Transactions",
      label: "Transaksi",
      icon: "swap-horizontal-outline" as const,
      activeIcon: "swap-horizontal" as const,
      color: "#10B981",
    },
    {
      name: "Calendar",
      label: "Kalender",
      icon: "calendar-outline" as const,
      activeIcon: "calendar" as const,
      color: "#3B82F6",
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
      color: "#22D3EE",
    },
    {
      name: "Notes",
      label: "Catatan",
      icon: "document-text-outline" as const,
      activeIcon: "document-text" as const,
      color: "#EC4899",
    },
  ];

  const navigateToScreen = (screenName: keyof StackParamList) => {
    props.navigation.navigate(screenName);
    props.navigation.closeDrawer();
  };

  const handleOpenProfile = () => {
    props.navigation.navigate("Profile");
    props.navigation.closeDrawer();
  };

  const handleOpenSettings = () => {
    props.navigation.navigate("Settings"); // ✅ GANTI KE Settings
    props.navigation.closeDrawer();
  };

  return (
    <View style={tw`flex-1 bg-[#0F172A]`}>
      {/* Header */}
      <View style={tw`pt-10 pb-6 px-6 bg-[#0F172A] border-b border-[#334155]`}>
        <TouchableOpacity onPress={handleOpenProfile} activeOpacity={0.8}>
          <View style={tw`flex-row items-center`}>
            <View
              style={tw`w-14 h-14 bg-[#1E293B] border border-[#334155] rounded-full items-center justify-center`}
            >
              <Ionicons name="person" size={24} color="#22D3EE" />
            </View>
            <View style={tw`ml-4 flex-1`}>
              <Text style={tw`text-[#F8FAFC] text-lg font-bold`}>MyMoney</Text>
              <Text style={tw`text-[#CBD5E1] text-xs mt-0.5`}>
                Keuangan Pribadi
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={tw`pt-4`}
        showsVerticalScrollIndicator={false}
      >
        <View style={tw`px-6 mb-3`}>
          <Text
            style={tw`text-[#CBD5E1] text-xs font-medium uppercase tracking-wider`}
          >
            Menu Utama
          </Text>
        </View>

        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={tw`flex-row items-center py-3 px-6 mx-4 rounded-xl mb-1`}
            onPress={() => navigateToScreen(item.name as keyof StackParamList)}
            activeOpacity={0.7}
          >
            <View
              style={tw`w-10 h-10 rounded-lg bg-[#1E293B] border border-[#334155] items-center justify-center mr-3`}
            >
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>

            <Text style={tw`text-[#F8FAFC] text-sm font-medium flex-1`}>
              {item.label}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#334155" />
          </TouchableOpacity>
        ))}

        {/* Divider */}
        <View style={tw`h-px bg-[#334155] my-6 mx-6`} />

        {/* Menu Profil */}
        <TouchableOpacity
          style={tw`flex-row items-center py-3 px-6 mx-4 rounded-xl mb-2`}
          onPress={handleOpenProfile}
        >
          <View
            style={tw`w-10 h-10 rounded-lg bg-[#1E293B] border border-[#334155] items-center justify-center mr-3`}
          >
            <Ionicons name="person-outline" size={20} color="#22D3EE" />
          </View>
          <Text style={tw`text-[#F8FAFC] text-sm font-medium flex-1`}>
            Profil Saya
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#334155" />
        </TouchableOpacity>

        {/* Pengaturan (Sekarang termasuk notifikasi) */}
        <TouchableOpacity
          style={tw`flex-row items-center py-3 px-6 mx-4 rounded-xl mb-2`}
          onPress={handleOpenSettings}
        >
          <View
            style={tw`w-10 h-10 rounded-lg bg-[#1E293B] border border-[#334155] items-center justify-center mr-3`}
          >
            <Ionicons name="settings-outline" size={20} color="#F59E0B" />
          </View>
          <Text style={tw`text-[#F8FAFC] text-sm font-medium flex-1`}>
            Pengaturan
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#334155" />
        </TouchableOpacity>

        {/* Bantuan */}
        <TouchableOpacity
          style={tw`flex-row items-center py-3 px-6 mx-4 rounded-xl mb-2`}
          onPress={() => Alert.alert("Bantuan", "Hubungi: support@mymoney.app")}
        >
          <View
            style={tw`w-10 h-10 rounded-lg bg-[#1E293B] border border-[#334155] items-center justify-center mr-3`}
          >
            <Ionicons name="help-circle-outline" size={20} color="#3B82F6" />
          </View>
          <Text style={tw`text-[#F8FAFC] text-sm font-medium flex-1`}>
            Bantuan & FAQ
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#334155" />
        </TouchableOpacity>
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={tw`p-6 border-t border-[#334155]`}>
        <Text style={tw`text-[#CBD5E1] text-xs text-center`}>
          MyMoney v1.0.1 • © Lexa
        </Text>
      </View>
    </View>
  );
};

// Main Stack Navigator untuk aplikasi
const MainStackNavigator = () => {
  return (
    <MainStack.Navigator
      screenOptions={({ navigation, route }) => ({
        headerStyle: {
          backgroundColor: "#0F172A",
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === "ios" ? 100 : 80,
          borderBottomWidth: 1,
          borderBottomColor: "#334155",
        },
        headerTintColor: "#F8FAFC",
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 20,
          letterSpacing: -0.5,
        },
        headerTitleAlign: "center" as const,
        headerLeft: () => {
          if (route.name === "Home") {
            return (
              <TouchableOpacity
                onPress={() => navigation.openDrawer()}
                style={tw`ml-4 p-2 rounded-lg`}
              >
                <Ionicons name="menu" size={26} color="#22D3EE" />
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={tw`ml-4 p-2 rounded-lg`}
            >
              <Ionicons name="arrow-back" size={26} color="#22D3EE" />
            </TouchableOpacity>
          );
        },
      })}
    >
      {/* Main Screens */}
      <MainStack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Beranda",
        }}
      />

      <MainStack.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          title: "Transaksi",
        }}
      />

      <MainStack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: "Analitik",
        }}
      />

      <MainStack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: "Kalender Keuangan",
        }}
      />

      <MainStack.Screen
        name="Budget"
        component={BudgetScreen}
        options={{
          title: "Anggaran",
        }}
      />

      <MainStack.Screen
        name="Savings"
        component={SavingsScreen}
        options={{
          title: "Tabungan",
        }}
      />

      {/* PROFILE SCREEN */}
      <MainStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profil Saya",
        }}
      />

      {/* SETTINGS SCREEN (REPLACES NotificationSettings) */}
      <MainStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Pengaturan",
        }}
      />

      {/* NOTES SCREEN */}
      <MainStack.Screen
        name="Notes"
        component={NotesScreen}
        options={{
          title: "Catatan Finansial",
        }}
      />

      {/* Detail Screens */}
      <MainStack.Screen
        name="SavingsDetail"
        component={SavingsDetailScreen}
        options={{
          title: "Detail Tabungan",
        }}
      />

      <MainStack.Screen
        name="SavingsHistory"
        component={SavingsHistoryScreen}
        options={{
          title: "Riwayat Transaksi",
        }}
      />

      <MainStack.Screen
        name="NoteDetail"
        component={NoteDetailScreen}
        options={{
          title: "Detail Catatan",
        }}
      />

      {/* Add/Edit Screens */}
      <MainStack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={({ route }: any) => ({
          title: route.params?.editMode ? "Edit Transaksi" : "Transaksi Baru",
        })}
      />

      <MainStack.Screen
        name="AddBudget"
        component={AddBudgetScreen}
        options={({ route }: any) => ({
          title: route.params?.editMode ? "Edit Anggaran" : "Anggaran Baru",
        })}
      />

      <MainStack.Screen
        name="AddSavings"
        component={AddSavingsScreen}
        options={({ route }: any) => ({
          title: route.params?.editMode ? "Edit Tabungan" : "Tabungan Baru",
        })}
      />

      <MainStack.Screen
        name="AddSavingsTransaction"
        component={AddSavingsTransactionScreen}
        options={({ route }: any) => ({
          title:
            route.params?.type === "deposit"
              ? "Tambah Setoran"
              : "Penarikan Dana",
        })}
      />

      <MainStack.Screen
        name="NoteForm"
        component={NoteFormScreen}
        options={({ route }: any) => ({
          title: route.params?.noteId ? "Edit Catatan" : "Catatan Baru",
        })}
      />
    </MainStack.Navigator>
  );
};

// Drawer Navigator
const DrawerNavigator = () => (
  <Drawer.Navigator
    drawerContent={(props) => <CustomDrawerContent {...props} />}
    screenOptions={{
      drawerStyle: {
        width: width * 0.8,
        backgroundColor: "#0F172A",
      },
      drawerType: "front",
      overlayColor: "rgba(0,0,0,0.7)",
      swipeEnabled: true,
      headerShown: false,
    }}
  >
    <Drawer.Screen name="MainStack" component={MainStackNavigator} />
  </Drawer.Navigator>
);

// Root App Navigator
const AppNavigator: React.FC = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem("@onboarding_completed");
        console.log("DEBUG: Onboarding status =", value);
        setIsFirstLaunch(value !== "true");
      } catch (error) {
        console.error(error);
        setIsFirstLaunch(true);
      }
    };

    checkOnboarding();
  }, []);

  // Loading screen
  if (isFirstLaunch === null) {
    return (
      <View style={tw`flex-1 bg-[#0F172A] justify-center items-center`}>
        <ActivityIndicator size="large" color="#22D3EE" />
        <Text style={tw`text-[#CBD5E1] mt-4`}>Memuat...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={isFirstLaunch ? "Onboarding" : "MainDrawer"}
      >
        {isFirstLaunch ? (
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : null}

        <RootStack.Screen name="MainDrawer" component={DrawerNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
