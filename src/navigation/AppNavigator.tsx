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
  ActivityIndicator,
  Alert,
} from "react-native";
import { Avatar } from "react-native-paper";
import tw from "twrnc";

// Screens
import UserSelectScreen from "../screens/Onboarding/UserSelectScreen";
import WelcomeScreen from "../screens/Onboarding/WelcomeScreen";
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

// Import user manager - ✅ UPDATE IMPORT
import {
  hasUsers,
  getCurrentUser,
  clearCurrentUser, // ✅ INI YANG PERLU DITAMBAH
} from "../utils/userManager";
import { User } from "../types";

// Types
type StackParamList = {
  Welcome: undefined;
  UserSelect: undefined;
  MainDrawer: undefined;
  MainStack: undefined;
  Home: undefined;
  Transactions: undefined;
  Budget: undefined;
  Savings: undefined;
  Analytics: undefined;
  Calendar: undefined;
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
  const [activeRoute, setActiveRoute] = useState<string>("Home");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
  };

  // FUNGSI LOGOUT
  const handleLogout = async () => {
    Alert.alert(
      "Keluar",
      "Apakah Anda yakin ingin keluar dari akun saat ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Keluar",
          style: "destructive",
          onPress: async () => {
            try {
              await clearCurrentUser();
              props.navigation.closeDrawer();

              // Navigate ke UserSelect
              props.navigation.navigate("UserSelect");

              console.log("✅ Logout berhasil");
            } catch (error) {
              console.error("❌ Error logout:", error);
              Alert.alert("Error", "Gagal keluar dari akun");
            }
          },
        },
      ]
    );
  };

  // FUNGSI UNTUK BUKA PROFIL USER
  const handleOpenProfile = () => {
    Alert.alert(
      "Profil Pengguna",
      `Nama: ${currentUser?.name}\nID: ${currentUser?.id}\nDibuat: ${
        currentUser?.createdAt
          ? new Date(currentUser.createdAt).toLocaleDateString("id-ID")
          : "-"
      }`,
      [
        { text: "Tutup", style: "cancel" },
        {
          text: "Ganti Pengguna",
          onPress: () => {
            props.navigation.reset({
              index: 0,
              routes: [{ name: "UserSelect" }],
            });
          },
        },
      ]
    );
  };

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
      name: "Calendar",
      label: "Kalender",
      icon: "calendar-outline" as const,
      activeIcon: "calendar" as const,
      color: "#EC4899",
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

  const navigateToScreen = (screenName: keyof StackParamList) => {
    setActiveRoute(screenName);
    props.navigation.navigate(screenName);
    props.navigation.closeDrawer();
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      {/* Header */}
      <View style={tw`pt-10 pb-6 px-6 bg-indigo-600`}>
        <View style={tw`flex-row items-center`}>
          <TouchableOpacity onPress={handleOpenProfile}>
            <View
              style={tw`w-14 h-14 bg-white rounded-full items-center justify-center`}
            >
              <Text style={tw`text-2xl`}>{currentUser?.avatar || "👤"}</Text>
            </View>
          </TouchableOpacity>
          <View style={tw`ml-4 flex-1`}>
            <Text style={tw`text-white text-lg font-bold`}>MyMoney</Text>
            <Text style={tw`text-indigo-100 text-xs mt-0.5`}>
              {currentUser ? `Halo, ${currentUser.name}!` : "Keuangan Pribadi"}
            </Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
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
                navigateToScreen(item.name as keyof StackParamList)
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

        {/* Menu Profil */}
        <TouchableOpacity
          style={tw`flex-row items-center py-3 px-6 mx-4 rounded-lg mb-1`}
          onPress={handleOpenProfile}
        >
          <View
            style={tw`w-8 h-8 rounded-lg bg-blue-50 items-center justify-center mr-3`}
          >
            <Ionicons name="person-outline" size={18} color="#3B82F6" />
          </View>
          <Text style={tw`text-gray-700 text-sm flex-1`}>Profil Saya</Text>
        </TouchableOpacity>

        {/* Bantuan */}
        <TouchableOpacity
          style={tw`flex-row items-center py-3 px-6 mx-4 rounded-lg mb-1`}
          onPress={() => Alert.alert("Bantuan", "Hubungi: support@mymoney.app")}
        >
          <View
            style={tw`w-8 h-8 rounded-lg bg-amber-50 items-center justify-center mr-3`}
          >
            <Ionicons name="help-circle-outline" size={18} color="#F59E0B" />
          </View>
          <Text style={tw`text-gray-700 text-sm flex-1`}>Bantuan & FAQ</Text>
        </TouchableOpacity>
      </DrawerContentScrollView>

      {/* Footer - LOGOUT */}
      <View style={tw`border-t border-gray-100 p-4`}>
        <TouchableOpacity
          style={tw`flex-row items-center`}
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <View
            style={tw`w-8 h-8 rounded-lg bg-red-50 items-center justify-center mr-3`}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          </View>
          <View style={tw`flex-1`}>
            <Text style={tw`text-gray-800 text-sm font-medium`}>
              Keluar dari {currentUser?.name || "Akun"}
            </Text>
            <Text style={tw`text-gray-500 text-xs`}>Pilih pengguna lain</Text>
          </View>
        </TouchableOpacity>
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
          backgroundColor: "#4F46E5",
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === "ios" ? 100 : 70,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
        },
        headerTitleAlign: "center" as const,
        // HAMBURGER MENU hanya untuk Home screen
        headerLeft: () => {
          if (route.name === "Home") {
            return (
              <TouchableOpacity
                onPress={() => navigation.openDrawer()}
                style={tw`ml-4`}
              >
                <Ionicons name="menu" size={24} color="#fff" />
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={tw`ml-4`}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          );
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
        width: width * 0.75,
        backgroundColor: "transparent",
      },
      drawerType: "front",
      overlayColor: "rgba(0,0,0,0.3)",
      swipeEnabled: false,
      headerShown: false,
    }}
  >
    <Drawer.Screen name="MainStack" component={MainStackNavigator} />
  </Drawer.Navigator>
);

// ROOT Navigator
const RootNavigator: React.FC = () => {
  const [hasExistingUsers, setHasExistingUsers] = useState<boolean | null>(
    null
  );
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkUsers();
  }, []);

  const checkUsers = async () => {
    try {
      const usersExist = await hasUsers();
      setHasExistingUsers(usersExist);
    } catch (error) {
      console.error("Error checking users:", error);
      setHasExistingUsers(false);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <View style={tw`flex-1 bg-gray-50 items-center justify-center`}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={tw`mt-4 text-gray-600`}>Memeriksa data...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasExistingUsers ? (
          // First time: Welcome → MainDrawer
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="MainDrawer" component={DrawerNavigator} />
          </>
        ) : (
          // Already have users: UserSelect → MainDrawer
          <>
            <Stack.Screen name="UserSelect" component={UserSelectScreen} />
            <Stack.Screen name="MainDrawer" component={DrawerNavigator} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const AppNavigator: React.FC = () => {
  return <RootNavigator />;
};

export default AppNavigator;
