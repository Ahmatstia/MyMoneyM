// [file name]: src/navigation/AppNavigator.tsx
// [file content begin]
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
  MainStack: undefined;
  Home: undefined;
  Transactions: undefined;
  Budget: undefined;
  Savings: undefined;
  Analytics: undefined;
  Calendar: undefined;
  Profile: undefined;
  SavingsDetail: { savingsId: string };
  SavingsHistory: { savingsId: string };
  AddTransaction: { editMode?: boolean; transactionData?: any };
  AddBudget: { editMode?: boolean; budgetData?: any };
  AddSavings: { editMode?: boolean; savingsData?: any };
  AddSavingsTransaction: { savingsId: string; type?: "deposit" | "withdrawal" };
};

const Stack = createStackNavigator<StackParamList>();
const Drawer = createDrawerNavigator();
const { width } = Dimensions.get("window");

// Custom Drawer Content
const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const menuItems = [
    {
      name: "Home",
      label: "Beranda",
      icon: "home-outline" as const,
      activeIcon: "home" as const,
      color: ACCENT_COLOR, // Cyan untuk highlight
    },
    {
      name: "Transactions",
      label: "Transaksi",
      icon: "swap-horizontal-outline" as const,
      activeIcon: "swap-horizontal" as const,
      color: SUCCESS_COLOR, // Hijau untuk transaksi
    },
    {
      name: "Calendar",
      label: "Kalender",
      icon: "calendar-outline" as const,
      activeIcon: "calendar" as const,
      color: INFO_COLOR, // Biru untuk kalender
    },
    {
      name: "Analytics",
      label: "Analitik",
      icon: "stats-chart-outline" as const,
      activeIcon: "stats-chart" as const,
      color: WARNING_COLOR, // Kuning untuk analitik
    },
    {
      name: "Budget",
      label: "Anggaran",
      icon: "pie-chart-outline" as const,
      activeIcon: "pie-chart" as const,
      color: "#8B5CF6", // Ungu untuk anggaran
    },
    {
      name: "Savings",
      label: "Tabungan",
      icon: "wallet-outline" as const,
      activeIcon: "wallet" as const,
      color: ACCENT_COLOR, // Cyan untuk tabungan
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

  return (
    <View style={tw`flex-1 bg-[${BACKGROUND_COLOR}]`}>
      {/* Header */}
      <View
        style={tw`pt-10 pb-6 px-6 bg-[${PRIMARY_COLOR}] border-b border-[${BORDER_COLOR}]`}
      >
        <TouchableOpacity onPress={handleOpenProfile} activeOpacity={0.8}>
          <View style={tw`flex-row items-center`}>
            <View
              style={tw`w-14 h-14 bg-[${SURFACE_COLOR}] border border-[${BORDER_COLOR}] rounded-full items-center justify-center`}
            >
              <Ionicons name="person" size={24} color={ACCENT_COLOR} />
            </View>
            <View style={tw`ml-4 flex-1`}>
              <Text style={tw`text-[${TEXT_PRIMARY}] text-lg font-bold`}>
                MyMoney
              </Text>
              <Text style={tw`text-[${TEXT_SECONDARY}] text-xs mt-0.5`}>
                Keuangan Pribadi
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={TEXT_SECONDARY} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={tw`pt-4`}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={tw`text-[${TEXT_SECONDARY}] text-xs font-medium px-6 mb-3 uppercase tracking-wider`}
        >
          Menu Utama
        </Text>

        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={tw`flex-row items-center py-3 px-6 mx-4 rounded-xl mb-1 active:bg-[${SURFACE_COLOR}]`}
            onPress={() => navigateToScreen(item.name as keyof StackParamList)}
            activeOpacity={0.7}
          >
            <View
              style={tw`w-10 h-10 rounded-lg bg-[${SURFACE_COLOR}] border border-[${BORDER_COLOR}] items-center justify-center mr-3`}
            >
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>

            <Text style={tw`text-[${TEXT_PRIMARY}] text-sm font-medium flex-1`}>
              {item.label}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={BORDER_COLOR} />
          </TouchableOpacity>
        ))}

        {/* Divider */}
        <View style={tw`h-px bg-[${BORDER_COLOR}] my-6 mx-6`} />

        {/* Menu Profil */}
        <TouchableOpacity
          style={tw`flex-row items-center py-3 px-6 mx-4 rounded-xl mb-2 active:bg-[${SURFACE_COLOR}]`}
          onPress={handleOpenProfile}
        >
          <View
            style={tw`w-10 h-10 rounded-lg bg-[${SURFACE_COLOR}] border border-[${BORDER_COLOR}] items-center justify-center mr-3`}
          >
            <Ionicons name="person-outline" size={20} color={ACCENT_COLOR} />
          </View>
          <Text style={tw`text-[${TEXT_PRIMARY}] text-sm font-medium flex-1`}>
            Profil Saya
          </Text>
          <Ionicons name="chevron-forward" size={16} color={BORDER_COLOR} />
        </TouchableOpacity>

        {/* Bantuan */}
        <TouchableOpacity
          style={tw`flex-row items-center py-3 px-6 mx-4 rounded-xl mb-2 active:bg-[${SURFACE_COLOR}]`}
          onPress={() => Alert.alert("Bantuan", "Hubungi: support@mymoney.app")}
        >
          <View
            style={tw`w-10 h-10 rounded-lg bg-[${SURFACE_COLOR}] border border-[${BORDER_COLOR}] items-center justify-center mr-3`}
          >
            <Ionicons
              name="help-circle-outline"
              size={20}
              color={WARNING_COLOR}
            />
          </View>
          <Text style={tw`text-[${TEXT_PRIMARY}] text-sm font-medium flex-1`}>
            Bantuan & FAQ
          </Text>
          <Ionicons name="chevron-forward" size={16} color={BORDER_COLOR} />
        </TouchableOpacity>

        {/* Pengaturan */}
        <TouchableOpacity
          style={tw`flex-row items-center py-3 px-6 mx-4 rounded-xl active:bg-[${SURFACE_COLOR}]`}
          onPress={() =>
            Alert.alert("Pengaturan", "Fitur pengaturan akan segera hadir")
          }
        >
          <View
            style={tw`w-10 h-10 rounded-lg bg-[${SURFACE_COLOR}] border border-[${BORDER_COLOR}] items-center justify-center mr-3`}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={TEXT_SECONDARY}
            />
          </View>
          <Text style={tw`text-[${TEXT_PRIMARY}] text-sm font-medium flex-1`}>
            Pengaturan
          </Text>
          <Ionicons name="chevron-forward" size={16} color={BORDER_COLOR} />
        </TouchableOpacity>
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={tw`p-6 border-t border-[${BORDER_COLOR}]`}>
        <Text style={tw`text-[${TEXT_SECONDARY}] text-xs text-center`}>
          MyMoney v1.0 • © Lexa
        </Text>
      </View>
    </View>
  );
};

// Stack Navigator untuk Main App
const MainStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        headerStyle: {
          backgroundColor: PRIMARY_COLOR,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === "ios" ? 100 : 80,
          borderBottomWidth: 1,
          borderBottomColor: BORDER_COLOR,
        },
        headerTintColor: TEXT_PRIMARY,
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
                style={tw`ml-4 p-2 rounded-lg active:bg-[${SURFACE_COLOR}]`}
              >
                <Ionicons name="menu" size={26} color={ACCENT_COLOR} />
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={tw`ml-4 p-2 rounded-lg active:bg-[${SURFACE_COLOR}]`}
            >
              <Ionicons name="arrow-back" size={26} color={ACCENT_COLOR} />
            </TouchableOpacity>
          );
        },
        headerRight: () => {
          // Tambahkan aksi di header kanan jika perlu
          if (route.name === "Home") {
            return (
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Notifikasi", "Tidak ada notifikasi baru")
                }
                style={tw`mr-4 p-2 rounded-lg active:bg-[${SURFACE_COLOR}]`}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={TEXT_SECONDARY}
                />
              </TouchableOpacity>
            );
          }
          return null;
        },
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
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: "Kalender Keuangan",
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

      {/* PROFILE SCREEN */}
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profil Saya",
        }}
      />

      {/* Detail Screens */}
      <Stack.Screen
        name="SavingsDetail"
        component={SavingsDetailScreen}
        options={{
          title: "Detail Tabungan",
        }}
      />

      <Stack.Screen
        name="SavingsHistory"
        component={SavingsHistoryScreen}
        options={{
          title: "Riwayat Transaksi",
        }}
      />

      {/* Add/Edit Screens */}
      <Stack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={({ route }: any) => ({
          title: route.params?.editMode ? "Edit Transaksi" : "Transaksi Baru",
        })}
      />

      <Stack.Screen
        name="AddBudget"
        component={AddBudgetScreen}
        options={({ route }: any) => ({
          title: route.params?.editMode ? "Edit Anggaran" : "Anggaran Baru",
        })}
      />

      <Stack.Screen
        name="AddSavings"
        component={AddSavingsScreen}
        options={({ route }: any) => ({
          title: route.params?.editMode ? "Edit Tabungan" : "Tabungan Baru",
        })}
      />

      <Stack.Screen
        name="AddSavingsTransaction"
        component={AddSavingsTransactionScreen}
        options={({ route }: any) => ({
          title:
            route.params?.type === "deposit"
              ? "Tambah Setoran"
              : "Penarikan Dana",
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
      drawerType: "front",
      overlayColor: "rgba(0,0,0,0.7)",
      swipeEnabled: true,
      headerShown: false,
    }}
  >
    <Drawer.Screen name="MainStack" component={MainStackNavigator} />
  </Drawer.Navigator>
);

// Main App Navigator
const AppNavigator: React.FC = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem("@onboarding_completed");
        console.log("DEBUG: Onboarding status =", value);
        if (value !== null) {
          setIsFirstLaunch(false); // Sudah pernah onboard
        }
      } catch (error) {
        console.error(error);
      }
    };

    checkOnboarding();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isFirstLaunch ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="MainDrawer" component={DrawerNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
// [file content end]
