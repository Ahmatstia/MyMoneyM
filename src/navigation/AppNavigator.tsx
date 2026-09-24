import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  createContext,
  useContext,
} from "react";
import {
  NavigationContainer,
  DarkTheme as NavigationDarkTheme,
  useNavigation,
} from "@react-navigation/native";
import { navigationRef } from "./navigationRef";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Platform,
  Alert,
  Image,
  ImageBackground,
  StyleSheet,
  Easing,
  BackHandler,
  PanResponder,
  ScrollView,
} from "react-native";
import tw from "twrnc";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "../context/AppContext";
import { useGamification } from "../context/GamificationContext";
import { useTheme } from "../theme/ThemeContext";
import { LevelAvatarBorder } from "../components/Gamification/LevelAvatarBorder";

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

import DebtScreen from "../screens/Debt/DebtScreen";
import AddDebtScreen from "../screens/Debt/AddDebtScreen";
import ToolsScreen from "../screens/Tools/ToolsScreen";
import RecurringTransactionsScreen from "../screens/Recurring/RecurringTransactionsScreen";
import WalletsScreen from "../screens/Wallets/WalletsScreen";
import MoniScreen from "../screens/Gamification/MoniScreen";

// Types
type StackParamList = {
  Onboarding: undefined;
  MainDrawer: undefined;
  MainTabs: undefined;
  Home: undefined;
  MoniScreen: undefined;
  Transactions: undefined;
  Budget: undefined;
  Savings: undefined;
  Analytics:
    | {
        tab?: "summary" | "trends" | "categories" | "insights";
      }
    | undefined;
  Calendar: undefined;
  Profile: undefined;
  Settings: undefined;
  ManageCategories: undefined;
  Debt: undefined;
  Tools: undefined;
  RecurringTransactions: undefined;
  Wallets: undefined;
  SavingsDetail: { savingsId: string };
  SavingsHistory: { savingsId: string };
  AddTransaction: { editMode?: boolean; transactionData?: any };
  AddBudget: { editMode?: boolean; budgetData?: any };
  AddSavings: { editMode?: boolean; savingsData?: any };
  AddSavingsTransaction: { savingsId: string; type?: "deposit" | "withdrawal" };
  AddDebt: { editMode?: boolean; debtData?: any };
};

const MainStack = createStackNavigator<StackParamList>();
const RootStack = createStackNavigator();
const Tab = createBottomTabNavigator();
const { width } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(width * 0.82, 320);

// ─── Drawer Context & Global Helpers ──────────────────────────────────────────

interface DrawerContextType {
  openDrawer: () => void;
  closeDrawer: () => void;
  isOpen: boolean;
}

export const DrawerContext = createContext<DrawerContextType>({
  openDrawer: () => {},
  closeDrawer: () => {},
  isOpen: false,
});

export const useDrawer = () => useContext(DrawerContext);

const drawerActionsRef: { open?: () => void; close?: () => void } = {};

export const openAppDrawer = () => {
  drawerActionsRef.open?.();
};

export const closeAppDrawer = () => {
  drawerActionsRef.close?.();
};

// ─── Drawer Menu Item ─────────────────────────────────────────────────────────

interface DrawerMenuItemProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  surfaceColor: string;
  borderColor: string;
  textColor: string;
  onPress: () => void;
}

const DrawerMenuItem = React.memo<DrawerMenuItemProps>(
  ({ label, icon, color, surfaceColor, borderColor, textColor, onPress }) => (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 11,
        paddingHorizontal: 20,
        marginHorizontal: 16,
        borderRadius: 12,
        marginBottom: 4,
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          backgroundColor: surfaceColor,
          borderWidth: 1,
          borderColor: borderColor,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text
        style={{
          color: textColor,
          fontSize: 14,
          fontWeight: "500",
          flex: 1,
        }}
      >
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={borderColor} />
    </TouchableOpacity>
  )
);

// ─── Custom Drawer Component (Native Animated) ────────────────────────────────

interface CustomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  animProgress: Animated.Value;
}

const CustomDrawer: React.FC<CustomDrawerProps> = React.memo(
  ({ isOpen, onClose, animProgress }) => {
    const { state } = useAppContext();
    const { progress } = useGamification();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const { userProfile } = state;

    const [avatarError, setAvatarError] = useState(false);
    const [coverError, setCoverError] = useState(false);

    useEffect(() => {
      setAvatarError(false);
    }, [userProfile?.avatar]);

    useEffect(() => {
      setCoverError(false);
    }, [userProfile?.coverImage]);

    const navigateTo = useCallback(
      (screenName: string) => {
        onClose();
        requestAnimationFrame(() => {
          if (screenName === "Home") {
            navigationRef.navigate("MainTabs", { screen: "HomeTab" });
          } else if (screenName === "Transactions") {
            navigationRef.navigate("MainTabs", { screen: "TransactionsTab" });
          } else if (screenName === "Budget") {
            navigationRef.navigate("MainTabs", { screen: "BudgetTab" });
          } else {
            navigationRef.navigate(screenName);
          }
        });
      },
      [onClose]
    );

    const menuItems = useMemo(
      () => [
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
          name: "Debt",
          label: "Hutang",
          icon: "card-outline" as const,
          color: colors.error,
        },
        {
          name: "Wallets",
          label: "Rekening",
          icon: "wallet-outline" as const,
          color: colors.success,
        },
        {
          name: "RecurringTransactions",
          label: "Transaksi Rutin",
          icon: "repeat-outline" as const,
          color: colors.accent,
        },
        {
          name: "Tools",
          label: "Alat Cerdas",
          icon: "calculator-outline" as const,
          color: colors.purple,
        },
        {
          name: "MoniScreen",
          label: "Ruang Moni 🐱",
          icon: "sparkles-outline" as const,
          color: colors.warning,
        },
        {
          name: "Profile",
          label: "Profil Saya",
          icon: "person-outline" as const,
          color: colors.accent,
        },
      ],
      [colors]
    );

    const translateX = animProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [-DRAWER_WIDTH, 0],
    });

    const backdropOpacity = animProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.55],
    });

    // Swipe left gesture on drawer to close
    const drawerPanResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => false,
          onMoveShouldSetPanResponder: (_, gs) => {
            return gs.dx < -10 && Math.abs(gs.dy) < Math.abs(gs.dx);
          },
          onPanResponderMove: (_, gs) => {
            if (gs.dx < 0) {
              const val = Math.max(0, Math.min(1, 1 + gs.dx / DRAWER_WIDTH));
              animProgress.setValue(val);
            }
          },
          onPanResponderRelease: (_, gs) => {
            if (gs.dx < -50 || gs.vx < -0.4) {
              onClose();
            } else {
              Animated.timing(animProgress, {
                toValue: 1,
                duration: 150,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }).start();
            }
          },
        }),
      [animProgress, onClose]
    );

    return (
      <View
        pointerEvents={isOpen ? "auto" : "none"}
        style={StyleSheet.absoluteFill}
      >
        {/* Backdrop Overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "#000000",
              opacity: backdropOpacity,
            },
          ]}
        >
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Drawer Panel */}
        <Animated.View
          {...drawerPanResponder.panHandlers}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: DRAWER_WIDTH,
            backgroundColor: colors.background,
            borderTopRightRadius: 20,
            borderBottomRightRadius: 20,
            borderRightWidth: 1,
            borderRightColor: colors.border,
            transform: [{ translateX }],
            shadowColor: "#000",
            shadowOffset: { width: 4, height: 0 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: Platform.OS === "android" ? 12 : 0,
          }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 16) + 24,
            }}
            style={{ flex: 1 }}
          >
            {/* Header Profile */}
            {userProfile && (
              <View style={{ position: "relative" }}>
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    requestAnimationFrame(() => {
                      navigationRef.navigate("Profile");
                    });
                  }}
                  activeOpacity={0.9}
                >
                  {userProfile.coverImage && !coverError ? (
                    <ImageBackground
                      source={{ uri: userProfile.coverImage }}
                      onError={() => setCoverError(true)}
                      style={{
                        paddingTop: 48,
                        paddingBottom: 24,
                        paddingHorizontal: 20,
                        marginBottom: 16,
                      }}
                      imageStyle={{ opacity: 0.4 }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <LevelAvatarBorder
                          avatarUri={
                            userProfile.avatar && !avatarError
                              ? userProfile.avatar
                              : null
                          }
                          name={userProfile.name}
                          size={60}
                          showLevelBadge={true}
                        />
                        <View
                          style={{ marginLeft: 14, flex: 1, paddingRight: 36 }}
                        >
                          <Text
                            style={{
                              color: colors.textPrimary,
                              fontSize: 17,
                              fontWeight: "700",
                            }}
                            numberOfLines={1}
                          >
                            {userProfile.name}
                          </Text>
                          <Text
                            style={{
                              color: colors.accent,
                              fontSize: 12,
                              fontWeight: "600",
                              marginTop: 3,
                            }}
                            numberOfLines={1}
                          >
                            {progress.title}
                          </Text>
                        </View>
                      </View>
                    </ImageBackground>
                  ) : (
                    <LinearGradient
                      colors={[
                        colors.surfaceLight,
                        colors.surface,
                        colors.background,
                      ]}
                      style={{
                        paddingTop: 48,
                        paddingBottom: 24,
                        paddingHorizontal: 20,
                        marginBottom: 16,
                      }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <LevelAvatarBorder
                          avatarUri={
                            userProfile.avatar && !avatarError
                              ? userProfile.avatar
                              : null
                          }
                          name={userProfile.name}
                          size={60}
                          showLevelBadge={true}
                        />
                        <View
                          style={{ marginLeft: 14, flex: 1, paddingRight: 36 }}
                        >
                          <Text
                            style={{
                              color: colors.textPrimary,
                              fontSize: 17,
                              fontWeight: "700",
                            }}
                            numberOfLines={1}
                          >
                            {userProfile.name}
                          </Text>
                          <Text
                            style={{
                              color: colors.accent,
                              fontSize: 12,
                              fontWeight: "600",
                              marginTop: 3,
                            }}
                            numberOfLines={1}
                          >
                            MyMoney
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>
                  )}
                </TouchableOpacity>

                {/* Close Button X */}
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  accessibilityLabel="Tutup Menu"
                  accessibilityRole="button"
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 14,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "rgba(0,0,0,0.45)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                  }}
                >
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* Label Section */}
            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
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
              <DrawerMenuItem
                key={item.name}
                label={item.label}
                icon={item.icon}
                color={item.color}
                surfaceColor={colors.surface}
                borderColor={colors.border}
                textColor={colors.textPrimary}
                onPress={() => navigateTo(item.name)}
              />
            ))}

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: colors.border,
                marginVertical: 16,
                marginHorizontal: 20,
              }}
            />

            {/* Settings */}
            <DrawerMenuItem
              label="Pengaturan"
              icon="settings-outline"
              color={colors.warning}
              surfaceColor={colors.surface}
              borderColor={colors.border}
              textColor={colors.textPrimary}
              onPress={() => {
                onClose();
                requestAnimationFrame(() => {
                  navigationRef.navigate("Settings");
                });
              }}
            />
          </ScrollView>
        </Animated.View>
      </View>
    );
  }
);

const EmptyComponent = () => null;

const QuickAddButton = ({ onPress }: { onPress: () => void }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        top: -12,
        justifyContent: "center",
        alignItems: "center",
      }}
      accessibilityLabel="Catat Transaksi Baru"
      accessibilityRole="button"
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: colors.accent,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </View>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          color: colors.textSecondary,
          marginTop: 2,
        }}
      >
        Catat
      </Text>
    </TouchableOpacity>
  );
};

const MainBottomTabs = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 58 + Math.max(insets.bottom, 6),
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 6,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: -2,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: "Beranda",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size || 22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="TransactionsTab"
        component={TransactionsScreen}
        options={{
          tabBarLabel: "Transaksi",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "receipt" : "receipt-outline"}
              size={size || 22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="QuickAdd"
        component={EmptyComponent}
        options={{
          tabBarLabel: "Catat",
          tabBarButton: () => (
            <QuickAddButton
              onPress={() => navigation.navigate("AddTransaction", {})}
            />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("AddTransaction", {});
          },
        }}
      />
      <Tab.Screen
        name="BudgetTab"
        component={BudgetScreen}
        options={{
          tabBarLabel: "Anggaran",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "pie-chart" : "pie-chart-outline"}
              size={size || 22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="DrawerMenu"
        component={EmptyComponent}
        options={{
          tabBarLabel: "Menu",
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => {
                openAppDrawer();
              }}
              activeOpacity={0.7}
              accessibilityLabel="Buka Menu"
              accessibilityRole="button"
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="menu-outline"
                size={23}
                color={colors.textSecondary}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginTop: -2,
                }}
              >
                Menu
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// ─── Main Stack Navigator ─────────────────────────────────────────────────────

const MainStackNavigator = () => {
  const { colors } = useTheme();

  return (
    <MainStack.Navigator
      initialRouteName="MainTabs"
      screenOptions={({ navigation, route }) => {
        // Screens that render their own custom headers
        const screensWithCustomHeader = [
          "MainTabs",
          "Home",
          "Transactions",
          "Analytics",
          "Calendar",
          "Budget",
          "Savings",
          "Profile",
          "Settings",
          "ManageCategories",
          "Debt",
          "Tools",
          "SavingsDetail",
          "SavingsHistory",
          "RecurringTransactions",
          "Wallets",
          "MoniScreen",
          "AddSavings",
          "AddTransaction",
          "AddBudget",
          "AddDebt",
          "AddSavingsTransaction",
        ];
        const hasCustomHeader = screensWithCustomHeader.includes(route.name);

        return {
          headerShown: !hasCustomHeader,
          cardStyle: { backgroundColor: colors.background },
          headerStyle: {
            backgroundColor: colors.background,
            height: Platform.OS === "ios" ? 100 : 80,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontWeight: "700", fontSize: 18 },
          headerTitleAlign: "center" as const,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={tw`ml-4 p-2 rounded-lg`}
              accessibilityLabel="Kembali"
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          ),
        };
      }}
    >
      <MainStack.Screen
        name="MainTabs"
        component={MainBottomTabs}
        options={{ headerShown: false }}
      />
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
      <MainStack.Screen
        name="RecurringTransactions"
        component={RecurringTransactionsScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name="Wallets"
        component={WalletsScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name="MoniScreen"
        component={MoniScreen}
        options={{ headerShown: false }}
      />
    </MainStack.Navigator>
  );
};

// ─── Drawer Navigator ─────────────────────────────────────────────────────────

const DrawerNavigator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const animProgress = useRef(new Animated.Value(0)).current;

  const openDrawer = useCallback(() => {
    setIsOpen(true);
    Animated.timing(animProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [animProgress]);

  const closeDrawer = useCallback(() => {
    Animated.timing(animProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setIsOpen(false);
    });
  }, [animProgress]);

  useEffect(() => {
    drawerActionsRef.open = openDrawer;
    drawerActionsRef.close = closeDrawer;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (!isOpen) return false;
        closeDrawer();
        return true;
      }
    );

    return () => {
      subscription.remove();
      delete drawerActionsRef.open;
      delete drawerActionsRef.close;
    };
  }, [closeDrawer, isOpen, openDrawer]);

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer, isOpen }}>
      <View style={{ flex: 1 }}>
        <MainStackNavigator />
        <CustomDrawer
          isOpen={isOpen}
          onClose={closeDrawer}
          animProgress={animProgress}
        />
      </View>
    </DrawerContext.Provider>
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
  const MyNavigationTheme = useMemo(
    () => ({
      ...NavigationDarkTheme,
      colors: {
        ...NavigationDarkTheme.colors,
        background: colors.background,
        card: colors.background,
        text: colors.textPrimary,
        border: colors.border,
        primary: colors.accent,
      },
    }),
    [colors]
  );

  if (isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
        {/* Subtle premium dark gradient */}
        <LinearGradient
          colors={["#0F172A", "#1E293B", "#0F172A"]}
          style={StyleSheet.absoluteFill}
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
            style={{ width: 140, height: 140, resizeMode: "contain" }}
          />
        </View>
        {/* Sleek bottom loading dots */}
        <View style={{ paddingBottom: 60, alignItems: "center" }}>
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            {[0.2, 0.4, 0.6, 0.8, 0.6, 0.4, 0.2].map((opacity, i) => (
              <View
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#0284C7",
                  opacity,
                }}
              />
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={MyNavigationTheme}>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.background },
        }}
        initialRouteName={isFirstLaunch ? "Onboarding" : "MainDrawer"}
      >
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        <RootStack.Screen name="MainDrawer" component={DrawerNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
