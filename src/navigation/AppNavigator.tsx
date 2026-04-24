import React, { useState, useEffect } from "react";
import FloatingDrawerHandle from "../components/FloatingDrawerHandle";
import { NavigationContainer, DarkTheme as NavigationDarkTheme } from "@react-navigation/native";
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
  Image,
  ImageBackground,
} from "react-native";
import tw from "twrnc";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";
import { useAppContext } from "../context/AppContext";

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
import SettingsScreen from "../screens/Settings/SettingsScreen";

import NotesScreen from "../screens/Notes/NotesScreen";
import NoteFormScreen from "../screens/Notes/NoteFormScreen";
import NoteDetailScreen from "../screens/Notes/NoteDetailScreen";
import DebtScreen from "../screens/Debt/DebtScreen";
import AddDebtScreen from "../screens/Debt/AddDebtScreen";

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
  Settings: undefined;
  Debt: undefined;
  SavingsDetail: { savingsId: string };
  SavingsHistory: { savingsId: string };
  AddTransaction: { editMode?: boolean; transactionData?: any };
  AddBudget: { editMode?: boolean; budgetData?: any };
  AddSavings: { editMode?: boolean; savingsData?: any };
  AddSavingsTransaction: { savingsId: string; type?: "deposit" | "withdrawal" };
  NoteForm: { noteId?: string };
  NoteDetail: { noteId: string };
  AddDebt: { editMode?: boolean; debtData?: any };
};

const MainStack = createStackNavigator<StackParamList>();
const RootStack = createStackNavigator();
const Drawer = createDrawerNavigator();
const { width } = Dimensions.get("window");

// Custom Drawer Content
const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const { state } = useAppContext();
  const { userProfile } = state;

  if (!userProfile) return null;

  const menuItems = [
    { name: "Home", label: "Beranda", icon: "home-outline" as const, color: "#22D3EE" },
    { name: "Transactions", label: "Transaksi", icon: "swap-horizontal-outline" as const, color: "#10B981" },
    { name: "Calendar", label: "Kalender", icon: "calendar-outline" as const, color: "#3B82F6" },
    { name: "Analytics", label: "Analitik", icon: "stats-chart-outline" as const, color: "#F59E0B" },
    { name: "Budget", label: "Anggaran", icon: "pie-chart-outline" as const, color: "#8B5CF6" },
    { name: "Savings", label: "Tabungan", icon: "wallet-outline" as const, color: "#22D3EE" },
    { name: "Notes", label: "Catatan", icon: "document-text-outline" as const, color: "#EC4899" },
    { name: "Debt", label: "Hutang", icon: "card-outline" as const, color: "#EF4444" },
    { name: "Profile", label: "Profil Saya", icon: "person-outline" as const, color: "#22D3EE" },
  ];

  const navigateToScreen = (screenName: keyof StackParamList) => {
    props.navigation.navigate(screenName);
    props.navigation.closeDrawer();
  };

  return (
    <View style={tw`flex-1 bg-[#0F172A]`}>
      <DrawerContentScrollView {...props} contentContainerStyle={tw`pt-0`} showsVerticalScrollIndicator={false}>
        {/* Header dengan Gambar Latar (Sekarang bisa di-scroll) */}
        <TouchableOpacity 
          onPress={() => {
            props.navigation.navigate("Profile");
            props.navigation.closeDrawer();
          }} 
          activeOpacity={0.9}
        >
          <ImageBackground
            source={userProfile.coverImage ? { uri: userProfile.coverImage } : require("../../assets/bg.png")}
            style={tw`pt-14 pb-8 px-6 mb-4`}
            imageStyle={{ opacity: 0.4 }}
          >
            <View style={tw`flex-row items-center`}>
              <View style={tw`w-16 h-16 bg-[#1E293B] border-2 border-[#22D3EE] rounded-full items-center justify-center overflow-hidden`}>
                {userProfile.avatar ? (
                  <Image source={{ uri: userProfile.avatar }} style={tw`w-full h-full`} />
                ) : (
                  <Ionicons name="person" size={32} color="#22D3EE" />
                )}
              </View>
              <View style={tw`ml-4 flex-1`}>
                <Text style={tw`text-[#F8FAFC] text-xl font-bold`} numberOfLines={1}>
                  {userProfile.name}
                </Text>
                <View style={tw`flex-row items-center mt-1`}>
                  <View style={tw`w-2 h-2 rounded-full bg-[#10B981] mr-2`} />
                  <Text style={tw`text-[#CBD5E1] text-xs font-medium`}>Online</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        <View style={tw`px-6 mb-3`}>
          <Text style={tw`text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider`}>Menu Utama</Text>
        </View>

        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={tw`flex-row items-center py-3 px-6 mx-4 rounded-xl mb-1`}
            onPress={() => navigateToScreen(item.name as keyof StackParamList)}
            activeOpacity={0.7}
          >
            <View style={tw`w-10 h-10 rounded-lg bg-[#1E293B] border border-[#334155] items-center justify-center mr-3`}>
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
            <Text style={tw`text-[#F8FAFC] text-sm font-medium flex-1`}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color="#334155" />
          </TouchableOpacity>
        ))}

        <View style={tw`h-px bg-[#334155] my-6 mx-6`} />

        <TouchableOpacity style={tw`flex-row items-center py-3 px-6 mx-4 rounded-xl mb-2`} onPress={() => props.navigation.navigate("Settings")}>
          <View style={tw`w-10 h-10 rounded-lg bg-[#1E293B] border border-[#334155] items-center justify-center mr-3`}>
            <Ionicons name="settings-outline" size={20} color="#F59E0B" />
          </View>
          <Text style={tw`text-[#F8FAFC] text-sm font-medium flex-1`}>Pengaturan</Text>
          <Ionicons name="chevron-forward" size={16} color="#334155" />
        </TouchableOpacity>
      </DrawerContentScrollView>

      <View style={tw`p-6 border-t border-[#334155]`}>
        <Text style={tw`text-[#CBD5E1] text-xs text-center`}>MyMoney v1.0.1 • © Lexa</Text>
      </View>
    </View>
  );
};

// Main Stack Navigator
const MainStackNavigator = () => {
  return (
    <MainStack.Navigator
      screenOptions={({ navigation, route }) => {
        const mainScreens = [
          "Home", "Transactions", "Analytics", "Calendar", "Budget", 
          "Savings", "Profile", "Settings", "Notes", "Debt",
          "SavingsDetail", "SavingsHistory", "AddSavings", "AddSavingsTransaction"
        ];
        const isMainScreen = mainScreens.includes(route.name);

        return {
          headerShown: !isMainScreen,
          cardStyle: { backgroundColor: "#0F172A" }, // Mencegah flash putih saat transisi antar layar utama
          headerStyle: {
            backgroundColor: "#0F172A",
            height: Platform.OS === "ios" ? 100 : 80,
            borderBottomWidth: 1,
            borderBottomColor: "#334155",
          },
          headerTintColor: "#F8FAFC",
          headerTitleStyle: { fontWeight: "700", fontSize: 20 },
          headerTitleAlign: "center" as const,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => route.name === "Home" ? navigation.openDrawer() : navigation.goBack()}
              style={tw`ml-4 p-2 rounded-lg`}
            >
              <Ionicons name={route.name === "Home" ? "menu" : "arrow-back"} size={26} color="#22D3EE" />
            </TouchableOpacity>
          ),
        };
      }}
    >
      <MainStack.Screen name="Home" component={HomeScreen} options={{ title: "Beranda" }} />
      <MainStack.Screen name="Transactions" component={TransactionsScreen} options={{ title: "Transaksi" }} />
      <MainStack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: "Analitik" }} />
      <MainStack.Screen name="Calendar" component={CalendarScreen} options={{ title: "Kalender Keuangan" }} />
      <MainStack.Screen name="Budget" component={BudgetScreen} options={{ title: "Anggaran" }} />
      <MainStack.Screen name="Savings" component={SavingsScreen} options={{ title: "Tabungan" }} />
      <MainStack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profil Saya" }} />
      <MainStack.Screen name="Settings" component={SettingsScreen} options={{ title: "Pengaturan" }} />
      <MainStack.Screen name="Notes" component={NotesScreen} options={{ title: "Catatan Finansial" }} />
      <MainStack.Screen name="SavingsDetail" component={SavingsDetailScreen} options={{ title: "Detail Tabungan" }} />
      <MainStack.Screen name="SavingsHistory" component={SavingsHistoryScreen} options={{ title: "Riwayat Transaksi" }} />
      <MainStack.Screen name="NoteDetail" component={NoteDetailScreen} options={{ headerShown: false }} />
      <MainStack.Screen name="AddTransaction" component={AddTransactionScreen} options={({ route }: any) => ({ title: route.params?.editMode ? "Edit Transaksi" : "Transaksi Baru" })} />
      <MainStack.Screen name="AddBudget" component={AddBudgetScreen} options={({ route }: any) => ({ title: route.params?.editMode ? "Edit Anggaran" : "Anggaran Baru" })} />
      <MainStack.Screen name="AddSavings" component={AddSavingsScreen} options={({ route }: any) => ({ title: route.params?.editMode ? "Edit Tabungan" : "Tabungan Baru" })} />
      <MainStack.Screen name="AddSavingsTransaction" component={AddSavingsTransactionScreen} options={({ route }: any) => ({ title: route.params?.type === "deposit" ? "Tambah Setoran" : "Penarikan Dana" })} />
      <MainStack.Screen name="NoteForm" component={NoteFormScreen} options={({ route }: any) => ({ title: route.params?.noteId ? "Edit Catatan" : "Catatan Baru" })} />
      <MainStack.Screen name="Debt" component={DebtScreen} options={{ title: "Hutang & Piutang" }} />
      <MainStack.Screen name="AddDebt" component={AddDebtScreen} options={({ route }: any) => ({ title: route.params?.editMode ? "Edit Hutang" : "Tambah Hutang" })} />
    </MainStack.Navigator>
  );
};

const StackWithHandle: React.FC = () => (
  <View style={{ flex: 1 }}>
    <MainStackNavigator />
    <FloatingDrawerHandle />
  </View>
);

const DrawerNavigator = () => (
  <Drawer.Navigator
    drawerContent={(props) => <CustomDrawerContent {...props} />}
    screenOptions={{
      drawerStyle: { width: width * 0.8, backgroundColor: "#0F172A" },
      drawerType: "front",
      overlayColor: "rgba(0,0,0,0.7)",
      swipeEnabled: false,
      headerShown: false,
    }}
  >
    <Drawer.Screen name="MainStack" component={StackWithHandle} />
  </Drawer.Navigator>
);

// Theme Navigation untuk mencegah "White Flash" saat ganti halaman
const MyNavigationTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    background: "#0F172A",
    card: "#0F172A",
    text: "#F8FAFC",
    border: "#334155",
    primary: "#22D3EE",
  },
};

const AppNavigator: React.FC = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem("@onboarding_completed");
        setIsFirstLaunch(value !== "true");
      } catch (error) {
        setIsFirstLaunch(true);
      }
    };
    checkOnboarding();
  }, []);

  if (isFirstLaunch === null) {
    return (
      <View style={tw`flex-1 bg-[#0F172A] justify-center items-center`}>
        <LottieView
          source={require("../../assets/lottie/Loading 50 _ Among Us.json")}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
        <Text style={tw`text-[#CBD5E1] mt-2 font-medium`}>Memuat MyMoney...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={MyNavigationTheme}>
      <RootStack.Navigator 
        screenOptions={{ 
          headerShown: false,
          cardStyle: { backgroundColor: "#0F172A" } // Mencegah flash putih di Root Stack
        }} 
        initialRouteName={isFirstLaunch ? "Onboarding" : "MainDrawer"}
      >
        {isFirstLaunch && <RootStack.Screen name="Onboarding" component={OnboardingScreen} />}
        <RootStack.Screen name="MainDrawer" component={DrawerNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
