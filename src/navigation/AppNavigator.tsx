import React, { useState, useEffect } from "react";
import FloatingDrawerHandle from "../components/FloatingDrawerHandle";
import {
  NavigationContainer,
  DarkTheme as NavigationDarkTheme,
} from "@react-navigation/native";
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
  StyleSheet,
} from "react-native";
import tw from "twrnc";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../theme/ThemeContext";

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
import ManageCategoriesScreen from "../screens/Settings/ManageCategoriesScreen";

import NotesScreen from "../screens/Notes/NotesScreen";
import NoteFormScreen from "../screens/Notes/NoteFormScreen";
import NoteDetailScreen from "../screens/Notes/NoteDetailScreen";
import DebtScreen from "../screens/Debt/DebtScreen";
import AddDebtScreen from "../screens/Debt/AddDebtScreen";
import ToolsScreen from "../screens/Tools/ToolsScreen";

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
  ManageCategories: undefined;
  Debt: undefined;
  Tools: undefined;
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

// ─── Custom Drawer Content ────────────────────────────────────────────────────

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const { state } = useAppContext();
  const { colors } = useTheme();
  const { userProfile } = state;

  if (!userProfile) return null;

  const menuItems = [
    {
      name: "Home",
      label: "Beranda",
      icon: "home-outline" as const,
      color: colors.accent,
    },
    {
      name: "Transactions",
      label: "Transaksi",
      icon: "swap-horizontal-outline" as const,
      color: colors.success,
    },
    {
      name: "Calendar",
      label: "Kalender",
      icon: "calendar-outline" as const,
      color: colors.info,
    },
    {
      name: "Analytics",
      label: "Analitik",
      icon: "stats-chart-outline" as const,
      color: colors.warning,
    },
    {
      name: "Budget",
      label: "Anggaran",
      icon: "pie-chart-outline" as const,
      color: colors.purple,
    },
    {
      name: "Savings",
      label: "Tabungan",
      icon: "wallet-outline" as const,
      color: colors.accent,
    },
    {
      name: "Notes",
      label: "Catatan",
      icon: "document-text-outline" as const,
      color: colors.pink,
    },
    {
      name: "Debt",
      label: "Hutang",
      icon: "card-outline" as const,
      color: colors.error,
    },
    {
      name: "Tools",
      label: "Alat Cerdas",
      icon: "calculator-outline" as const,
      color: colors.purple,
    },
    {
      name: "Profile",
      label: "Profil Saya",
      icon: "person-outline" as const,
      color: colors.accent,
    },
  ];

  const navigateToScreen = (screenName: keyof StackParamList) => {
    props.navigation.navigate(screenName);
    props.navigation.closeDrawer();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 0 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header dengan foto profil */}
        <TouchableOpacity
          onPress={() => {
            props.navigation.navigate("Profile");
            props.navigation.closeDrawer();
          }}
          activeOpacity={0.9}
        >
          <ImageBackground
            source={
              userProfile.coverImage
                ? { uri: userProfile.coverImage }
                : require("../../assets/bg.png")
            }
            style={{
              paddingTop: 56,
              paddingBottom: 32,
              paddingHorizontal: 24,
              marginBottom: 16,
            }}
            imageStyle={{ opacity: 0.4 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  backgroundColor: colors.surface,
                  borderWidth: 2,
                  borderColor: colors.accent,
                  borderRadius: 32,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {userProfile.avatar ? (
                  <Image
                    source={{ uri: userProfile.avatar }}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <Ionicons name="person" size={32} color={colors.accent} />
                )}
              </View>
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 18,
                    fontWeight: "700",
                  }}
                  numberOfLines={1}
                >
                  {userProfile.name}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 4,
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.success,
                      marginRight: 6,
                    }}
                  />
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 12,
                      fontWeight: "500",
                    }}
                  >
                    Online
                  </Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        {/* Label */}
        <View style={{ paddingHorizontal: 24, marginBottom: 12 }}>
          <Text
            style={{
              color: colors.gray400,
              fontSize: 10,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 1.4,
            }}
          >
            Menu Utama
          </Text>
        </View>

        {/* Menu Items */}
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              paddingHorizontal: 24,
              marginHorizontal: 16,
              borderRadius: 12,
              marginBottom: 4,
            }}
            onPress={() => navigateToScreen(item.name as keyof StackParamList)}
            activeOpacity={0.7}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 14,
                fontWeight: "500",
                flex: 1,
              }}
            >
              {item.label}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.border} />
          </TouchableOpacity>
        ))}

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: colors.border,
            marginVertical: 20,
            marginHorizontal: 24,
          }}
        />

        {/* Settings */}
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
            paddingHorizontal: 24,
            marginHorizontal: 16,
            borderRadius: 12,
            marginBottom: 8,
          }}
          onPress={() => props.navigation.navigate("Settings")}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 11,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={colors.warning}
            />
          </View>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 14,
              fontWeight: "500",
              flex: 1,
            }}
          >
            Pengaturan
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.border} />
        </TouchableOpacity>
      </DrawerContentScrollView>
    </View>
  );
};

// ─── Main Stack Navigator ─────────────────────────────────────────────────────

const MainStackNavigator = () => {
  const { colors } = useTheme();

  return (
    <MainStack.Navigator
      screenOptions={({ navigation, route }) => {
        const mainScreens = [
          "Home",
          "Transactions",
          "Analytics",
          "Calendar",
          "Budget",
          "Savings",
          "Profile",
          "Settings",
          "Notes",
          "Debt",
          "Tools",
          "SavingsDetail",
          "SavingsHistory",
          "AddSavings",
          "AddSavingsTransaction",
        ];
        const isMainScreen = mainScreens.includes(route.name);

        return {
          headerShown: !isMainScreen,
          cardStyle: { backgroundColor: colors.background },
          headerStyle: {
            backgroundColor: colors.background,
            height: Platform.OS === "ios" ? 100 : 80,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontWeight: "700", fontSize: 20 },
          headerTitleAlign: "center" as const,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                route.name === "Home"
                  ? navigation.openDrawer()
                  : navigation.goBack()
              }
              style={tw`ml-4 p-2 rounded-lg`}
            >
              <Ionicons
                name={route.name === "Home" ? "menu" : "arrow-back"}
                size={26}
                color={colors.accent}
              />
            </TouchableOpacity>
          ),
        };
      }}
    >
      <MainStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Beranda" }}
      />
      <MainStack.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{ title: "Transaksi" }}
      />
      <MainStack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ title: "Analitik" }}
      />
      <MainStack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: "Kalender Keuangan" }}
      />
      <MainStack.Screen
        name="Budget"
        component={BudgetScreen}
        options={{ title: "Anggaran" }}
      />
      <MainStack.Screen
        name="Savings"
        component={SavingsScreen}
        options={{ title: "Tabungan" }}
      />
      <MainStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profil Saya" }}
      />
      <MainStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Pengaturan" }}
      />
      <MainStack.Screen
        name="ManageCategories"
        component={ManageCategoriesScreen}
        options={{ title: "Kelola Kategori" }}
      />
      <MainStack.Screen
        name="Notes"
        component={NotesScreen}
        options={{ title: "Catatan Finansial" }}
      />
      <MainStack.Screen
        name="SavingsDetail"
        component={SavingsDetailScreen}
        options={{ title: "Detail Tabungan" }}
      />
      <MainStack.Screen
        name="SavingsHistory"
        component={SavingsHistoryScreen}
        options={{ title: "Riwayat Transaksi" }}
      />
      <MainStack.Screen
        name="NoteDetail"
        component={NoteDetailScreen}
        options={{ headerShown: false }}
      />
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
      <MainStack.Screen
        name="Debt"
        component={DebtScreen}
        options={{ title: "Hutang & Piutang" }}
      />
      <MainStack.Screen
        name="AddDebt"
        component={AddDebtScreen}
        options={({ route }: any) => ({
          title: route.params?.editMode ? "Edit Hutang" : "Tambah Hutang",
        })}
      />
      <MainStack.Screen
        name="Tools"
        component={ToolsScreen}
        options={{ title: "Alat Cerdas" }}
      />
    </MainStack.Navigator>
  );
};

const StackWithHandle: React.FC = () => (
  <View style={{ flex: 1 }}>
    <MainStackNavigator />
    <FloatingDrawerHandle />
  </View>
);

// ─── Drawer Navigator ─────────────────────────────────────────────────────────

const DrawerNavigator = () => {
  const { colors } = useTheme();

  return (
    <Drawer.Navigator
      useLegacyImplementation={false}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: { width: width * 0.8, backgroundColor: colors.background },
        drawerType: "front",
        overlayColor: "rgba(0,0,0,0.7)",
        swipeEnabled: true,
        headerShown: false,
      }}
    >
      <Drawer.Screen name="MainStack" component={StackWithHandle} />
    </Drawer.Navigator>
  );
};

// ─── Root App Navigator ───────────────────────────────────────────────────────

const AppNavigator: React.FC = () => {
  const { colors } = useTheme();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("@onboarding_completed")
      .then((value) => setIsFirstLaunch(value !== "true"))
      .catch(() => setIsFirstLaunch(true));
  }, []);

  // Tema navigasi mengikuti warna tema aktif — menghindari "white flash"
  const MyNavigationTheme = {
    ...NavigationDarkTheme,
    colors: {
      ...NavigationDarkTheme.colors,
      background: colors.background,
      card: colors.background,
      text: colors.textPrimary,
      border: colors.border,
      primary: colors.accent,
    },
  };

  if (isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, backgroundColor: "#001A08" }}>
        {/* Background gradient */}
        <LinearGradient
          colors={["#001A08", "#0A2E15", "#060D0A"]}
          style={StyleSheet.absoluteFill}
        />
        {/* Glow behind logo */}
        <View
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: "#00D84A",
            opacity: 0.06,
            transform: [{ translateX: -100 }, { translateY: -100 }],
          }}
        />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            source={require("../../assets/logo.png")}
            style={{ width: 90, height: 90, resizeMode: "contain" }}
          />
        </View>
        {/* Bottom loading text */}
        <View style={{ paddingBottom: 60, alignItems: "center" }}>
          <View
            style={{
              flexDirection: "row",
              gap: 5,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: "#00D84A",
                opacity: 0.3,
              }}
            />
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: "#00D84A",
                opacity: 0.5,
              }}
            />
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: "#00D84A",
                opacity: 0.7,
              }}
            />
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: "#00D84A",
                opacity: 0.5,
              }}
            />
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: "#00D84A",
                opacity: 0.3,
              }}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer theme={MyNavigationTheme}>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.background },
        }}
        initialRouteName={isFirstLaunch ? "Onboarding" : "MainDrawer"}
      >
        {isFirstLaunch && (
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        )}
        <RootStack.Screen name="MainDrawer" component={DrawerNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
