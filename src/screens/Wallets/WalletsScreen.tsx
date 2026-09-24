import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Animated,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { Wallet, WalletType, WalletRole } from "../../types";
import { useTheme } from "../../theme/ThemeContext";
import { formatCurrency, safeNumber } from "../../utils/calculations";
import { AppHeader, AppFAB } from "../../components/common";

type SafeIconName = keyof typeof Ionicons.glyphMap;

const DefaultWalletToggle = ({
  active,
  walletName,
  onActivate,
}: {
  active: boolean;
  walletName: string;
  onActivate: () => void;
}) => {
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;

  const handlePress = () => {
    progress.stopAnimation();
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
    onActivate();
  };

  useEffect(() => {
    Animated.timing(progress, {
      toValue: active ? 1 : 0,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [active, progress]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={active}
      activeOpacity={0.8}
      accessibilityRole="switch"
      accessibilityState={{ checked: active, disabled: active }}
      accessibilityLabel={`Jadikan ${walletName} sebagai rekening utama`}
      style={{
        height: 28,
        paddingHorizontal: 7,
        borderRadius: 14,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: active
          ? "rgba(16,185,129,0.22)"
          : "rgba(15,23,42,0.88)",
        borderWidth: 1,
        borderColor: active
          ? "rgba(110,231,183,0.65)"
          : "rgba(255,255,255,0.3)",
      }}
    >
      <Text
        style={{
          color: active ? "#A7F3D0" : "#FFFFFF",
          fontSize: 9,
          fontWeight: "800",
        }}
      >
        {active ? "Default" : "Jadikan Default"}
      </Text>
      <View
        style={{
          width: 30,
          height: 18,
          padding: 2,
          borderRadius: 9,
          justifyContent: "center",
          marginLeft: 6,
          backgroundColor: active ? "#10B981" : "#64748B",
        }}
      >
        <Animated.View
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: "#FFFFFF",
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 12],
                }),
              },
            ],
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 2,
            elevation: 2,
          }}
        />
      </View>
    </TouchableOpacity>
  );
};

const WALLET_TYPE_OPTIONS: {
  id: WalletType;
  label: string;
  icon: SafeIconName;
}[] = [
  { id: "bank", label: "Bank", icon: "card" },
  { id: "ewallet", label: "E-Wallet", icon: "phone-portrait" },
  { id: "cash", label: "Tunai", icon: "wallet" },
  { id: "investment", label: "Investasi", icon: "trending-up" },
  { id: "credit", label: "Paylater", icon: "pricetag" },
];

const WALLET_COLOR_PALETTES = [
  { id: "#10B981", label: "Emerald" },
  { id: "#1E40AF", label: "Navy" },
  { id: "#0284C7", label: "Sky" },
  { id: "#8B5CF6", label: "Purple" },
  { id: "#EC4899", label: "Pink" },
  { id: "#F59E0B", label: "Amber" },
  { id: "#EF4444", label: "Ruby" },
  { id: "#475569", label: "Slate" },
];

const WalletsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { state, addWallet, editWallet, deleteWallet } = useAppContext();

  const [filterRole, setFilterRole] = useState<
    "all" | "liquid" | "nonliquid" | string
  >("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<WalletType>("bank");
  const [formRole, setFormRole] = useState<WalletRole>("operational");
  const [formIsLiquid, setFormIsLiquid] = useState<boolean>(true);
  const [formCustomRole, setFormCustomRole] = useState("");
  const [formInitialBalance, setFormInitialBalance] = useState("");
  const [formAccountNumber, setFormAccountNumber] = useState("");
  const [formColor, setFormColor] = useState("#10B981");
  const [pendingDefaultId, setPendingDefaultId] = useState<string | null>(null);

  const wallets = state.wallets || [];

  useEffect(() => {
    if (
      pendingDefaultId &&
      wallets.some(
        (wallet) => wallet.id === pendingDefaultId && wallet.isDefault,
      )
    ) {
      setPendingDefaultId(null);
    }
  }, [pendingDefaultId, wallets]);

  // Filtered wallets with default wallet always placed first
  const filteredWallets = useMemo(() => {
    let result = wallets;
    if (filterRole === "liquid") {
      result = wallets.filter((w) =>
        w.isLiquid !== undefined ? w.isLiquid : w.role === "operational",
      );
    } else if (filterRole === "nonliquid") {
      result = wallets.filter((w) =>
        w.isLiquid !== undefined ? !w.isLiquid : w.role !== "operational",
      );
    } else if (filterRole !== "all") {
      result = wallets.filter((w) => w.role === filterRole);
    }

    return [...result].sort((a, b) => {
      const aDef = pendingDefaultId
        ? a.id === pendingDefaultId
        : Boolean(a.isDefault);
      const bDef = pendingDefaultId
        ? b.id === pendingDefaultId
        : Boolean(b.isDefault);
      if (aDef && !bDef) return -1;
      if (!aDef && bDef) return 1;
      return 0;
    });
  }, [wallets, filterRole, pendingDefaultId]);

  // Calculations for overview
  const totalBalance = safeNumber(state.balance);
  const operationalBalance = safeNumber(state.operationalBalance);
  const savingsBalance = safeNumber(state.savingsBalance);
  const totalPart =
    Math.max(0, operationalBalance) + Math.max(0, savingsBalance);
  const opPct =
    totalPart > 0
      ? Math.round((Math.max(0, operationalBalance) / totalPart) * 100)
      : 50;
  const svPct = 100 - opPct;

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingWallet(null);
    setFormName("");
    setFormType("bank");
    setFormRole("operational");
    setFormIsLiquid(true);
    setFormCustomRole("");
    setFormInitialBalance("");
    setFormAccountNumber("");
    setFormColor("#10B981");
    setModalVisible(true);
  };

  useEffect(() => {
    if (route.params?.openAddModal) {
      handleOpenCreate();
    }
  }, [route.params?.openAddModal]);

  // Open Edit Modal
  const handleOpenEdit = (w: Wallet) => {
    setEditingWallet(w);
    setFormName(w.name);
    setFormType(w.type);
    setFormRole(w.role);
    setFormIsLiquid(
      w.isLiquid !== undefined ? w.isLiquid : w.role === "operational",
    );
    const presetRoles = [
      "operational",
      "savings",
      "credit",
      "investasi",
      "belanja",
      "tabungan",
    ];
    setFormCustomRole(
      !presetRoles.includes(w.role.toLowerCase()) ? w.role : "",
    );
    setFormInitialBalance(String(w.initialBalance || 0));
    setFormAccountNumber(w.accountNumber || "");
    setFormColor(w.color || "#10B981");
    setModalVisible(true);
  };


  const parseSignedBalance = (val: string): number => {
    const trimmed = val.trim();
    const isNegative = trimmed.startsWith("-");
    const digits = trimmed.replace(/[^\d.]/g, "");
    const num = parseFloat(digits) || 0;
    return isNegative ? -num : num;
  };

  // Save Wallet
  const handleSaveWallet = async () => {
    if (!formName.trim()) {
      Alert.alert("Perhatian", "Silakan masukkan nama rekening / dompet");
      return;
    }

    const finalRole = formCustomRole.trim() ? formCustomRole.trim() : formRole;
    const numInitial = parseSignedBalance(formInitialBalance);
    const defaultIcon: SafeIconName =
      formType === "bank"
        ? "card"
        : formType === "ewallet"
          ? "phone-portrait"
          : formType === "investment"
            ? "trending-up"
            : formType === "credit"
              ? "pricetag"
              : "wallet";

    try {
      if (editingWallet) {
        await editWallet(editingWallet.id, {
          name: formName.trim(),
          type: formType,
          role: finalRole,
          isLiquid: formIsLiquid,
          accountNumber: formAccountNumber.trim() || undefined,
          color: formColor,
          icon: (editingWallet.icon as SafeIconName) || defaultIcon,
        });
      } else {
        await addWallet({
          name: formName.trim(),
          type: formType,
          role: finalRole,
          isLiquid: formIsLiquid,
          initialBalance: numInitial,
          accountNumber: formAccountNumber.trim() || undefined,
          color: formColor,
          icon: defaultIcon,
          isDefault: wallets.length === 0,
        });
      }
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert("Gagal Menyimpan", err.message || "Terjadi kesalahan sistem");
    }
  };

  const handleSetDefault = async (wallet: Wallet) => {
    if (wallet.isDefault || pendingDefaultId === wallet.id) return;

    setPendingDefaultId(wallet.id);

    try {
      await editWallet(wallet.id, { isDefault: true });
    } catch (err: any) {
      setPendingDefaultId(null);
      Alert.alert("Gagal", err.message || "Gagal menjadikan rekening utama");
    }
  };

  // Delete Wallet
  const handleDeleteWallet = (w: Wallet) => {
    if (wallets.length <= 1) {
      Alert.alert(
        "Tidak Dapat Dihapus",
        "Anda harus memiliki minimal satu dompet utama di dalam aplikasi.",
      );
      return;
    }

    Alert.alert(
      "Hapus Rekening",
      `Hapus rekening "${w.name}"? Rekening yang sudah memiliki transaksi atau batas uang tidak dapat dihapus agar riwayat saldo tidak berubah.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteWallet(w.id);
            } catch (err: any) {
              Alert.alert("Gagal", err.message || "Gagal menghapus dompet");
            }
          },
        },
      ],
    );
  };


  const CARD_BG = colors.surface;
  const TEXT_PRIMARY = colors.textPrimary;
  const TEXT_SECONDARY = colors.textSecondary;
  const BORDER_COLOR = colors.border;

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: colors.background }]}>
      {/* ── COMPACT HEADER BAR ── */}
      <AppHeader
        title="Dompet & Rekening"
        subtitle={`${wallets.length} Akun Terdaftar`}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`p-3.5 pb-24`}
      >
        {/* ── COMPACT EXECUTIVE NET WORTH CARD ── */}
        <View
          style={[
            tw`rounded-2xl p-3.5 mb-3 border relative overflow-hidden`,
            {
              backgroundColor: CARD_BG,
              borderColor: `${BORDER_COLOR}70`,
            },
          ]}
        >
          {/* Subtle gradient sheen */}
          <LinearGradient
            colors={[`${colors.accent}14`, `${colors.surface}`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />

          {/* Top row: Net worth total */}
          <View style={tw`flex-row items-center justify-between mb-2`}>
            <View>
              <Text
                style={[
                  tw`text-[10px] font-bold uppercase tracking-wider`,
                  { color: TEXT_SECONDARY },
                ]}
              >
                Total Kekayaan Bersih
              </Text>
              <Text
                style={[
                  tw`text-xl font-black mt-0.5 tracking-tight`,
                  { color: TEXT_PRIMARY },
                ]}
              >
                {formatCurrency(totalBalance)}
              </Text>
            </View>

            <View
              style={[
                tw`w-9 h-9 rounded-xl items-center justify-center`,
                { backgroundColor: `${colors.accent}18` },
              ]}
            >
              <Ionicons name="wallet-outline" size={18} color={colors.accent} />
            </View>
          </View>

          {/* Bottom row: Ambient Liquidity Capsule */}
          <View
            style={[
              tw`rounded-xl p-2 mt-1 border`,
              {
                backgroundColor: `${colors.background}80`,
                borderColor: `${BORDER_COLOR}50`,
              },
            ]}
          >
            <View style={tw`flex-row items-center justify-between mb-1.5`}>
              {/* Belanja (Liquid) */}
              <View style={tw`flex-row items-center gap-1.5`}>
                <View
                  style={[
                    tw`w-2 h-2 rounded-full`,
                    { backgroundColor: colors.success },
                  ]}
                />
                <Text
                  style={[
                    tw`text-[10px] font-semibold`,
                    { color: TEXT_SECONDARY },
                  ]}
                >
                  Belanja:
                </Text>
                <Text
                  style={[
                    tw`text-[11px] font-black`,
                    { color: colors.success },
                  ]}
                >
                  {formatCurrency(operationalBalance)}
                </Text>
                <Text
                  style={[tw`text-[9px] font-bold`, { color: colors.success }]}
                >
                  ({opPct}%)
                </Text>
              </View>

              <View
                style={[tw`w-[1px] h-3`, { backgroundColor: BORDER_COLOR }]}
              />

              {/* Dingin (Savings) */}
              <View style={tw`flex-row items-center gap-1.5`}>
                <View
                  style={[
                    tw`w-2 h-2 rounded-full`,
                    { backgroundColor: colors.info },
                  ]}
                />
                <Text
                  style={[
                    tw`text-[10px] font-semibold`,
                    { color: TEXT_SECONDARY },
                  ]}
                >
                  Dingin:
                </Text>
                <Text
                  style={[tw`text-[11px] font-black`, { color: colors.info }]}
                >
                  {formatCurrency(savingsBalance)}
                </Text>
                <Text
                  style={[tw`text-[9px] font-bold`, { color: colors.info }]}
                >
                  ({svPct}%)
                </Text>
              </View>
            </View>

            {/* Ratio progress line */}
            <View
              style={[
                tw`h-1 rounded-full overflow-hidden flex-row`,
                { backgroundColor: `${BORDER_COLOR}60` },
              ]}
            >
              <View
                style={[
                  tw`h-full`,
                  {
                    width: `${Math.max(4, Math.min(96, opPct))}%`,
                    backgroundColor: colors.success,
                  },
                ]}
              />
              <View
                style={[tw`h-full flex-1`, { backgroundColor: colors.info }]}
              />
            </View>
          </View>
        </View>

        {/* ── FILTER CHIPS (COMPACT PILLS) ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tw`flex-row mb-3`}
        >
          {[
            {
              id: "all",
              label: `Semua (${wallets.length})`,
              color: colors.accent,
            },
            { id: "liquid", label: "Uang Belanja", color: colors.success },
            { id: "nonliquid", label: "Uang Dingin", color: colors.info },
          ].map((chip) => {
            const isSelected = filterRole === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                onPress={() => setFilterRole(chip.id)}
                activeOpacity={0.7}
                style={[
                  tw`px-3 py-1.5 rounded-xl mr-2 border flex-row items-center`,
                  isSelected
                    ? {
                        backgroundColor: `${chip.color}20`,
                        borderColor: chip.color,
                      }
                    : {
                        backgroundColor: CARD_BG,
                        borderColor: `${BORDER_COLOR}70`,
                      },
                ]}
              >
                <Text
                  style={[
                    tw`text-[11px] font-bold`,
                    { color: isSelected ? chip.color : TEXT_SECONDARY },
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── WALLETS LIST (COMPACT FINTECH CARDS) ── */}
        {filteredWallets.length === 0 ? (
          <View style={tw`items-center justify-center py-10`}>
            <View
              style={[
                tw`w-12 h-12 rounded-2xl items-center justify-center mb-2`,
                { backgroundColor: `${colors.accent}15` },
              ]}
            >
              <Ionicons name="wallet-outline" size={24} color={colors.accent} />
            </View>
            <Text style={[tw`text-xs font-bold`, { color: TEXT_PRIMARY }]}>
              Tidak ada rekening pada filter ini
            </Text>
            <Text
              style={[
                tw`text-[10px] mt-0.5 text-center`,
                { color: TEXT_SECONDARY },
              ]}
            >
              Tekan tombol "+" di kanan bawah untuk membuat rekening baru.
            </Text>
          </View>
        ) : (
          filteredWallets.map((wallet) => {
            const isDefault = pendingDefaultId
              ? wallet.id === pendingDefaultId
              : Boolean(wallet.isDefault);
            const walletColor = wallet.color || colors.accent;
            const isLiquid =
              wallet.isLiquid !== undefined
                ? wallet.isLiquid
                : wallet.role === "operational";
            const isCredit =
              wallet.role === "credit" && wallet.isLiquid === false;
            const roleBadgeColor = isCredit
              ? colors.error
              : isLiquid
                ? colors.success
                : colors.info;

            const roleDisplayName =
              wallet.role === "operational"
                ? "Belanja"
                : wallet.role
                  ? wallet.role.length > 10
                    ? wallet.role.slice(0, 9) + "…"
                    : wallet.role
                  : isLiquid
                    ? "Belanja"
                    : "Dingin";

            const typeLabel =
              wallet.type === "bank"
                ? "Bank"
                : wallet.type === "ewallet"
                  ? "E-Wallet"
                  : wallet.type === "investment"
                    ? "Investasi"
                    : wallet.type === "credit"
                      ? "Paylater"
                      : "Tunai";

            return (
              <View
                key={wallet.id}
                style={[
                  tw`rounded-3xl p-4 mb-3 border relative overflow-hidden`,
                  {
                    minHeight: 180,
                    backgroundColor: `${walletColor}18`,
                    borderColor: `${walletColor}35`,
                    shadowColor: walletColor,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.16,
                    shadowRadius: 14,
                    elevation: 5,
                  },
                ]}
              >
                {/* ATM-style card surface */}
                <LinearGradient
                  colors={[`${walletColor}C7`, "#06334F", "#011827"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                />

                {/* Signature leaf motif */}
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    right: -26,
                    bottom: -96,
                    width: 102,
                    height: 238,
                    borderRadius: 110,
                    backgroundColor: walletColor,
                    opacity: 0.38,
                    transform: [{ rotate: "38deg" }],
                  }}
                />
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    right: 38,
                    bottom: -116,
                    width: 74,
                    height: 180,
                    borderRadius: 90,
                    backgroundColor: "#73E6D0",
                    opacity: 0.18,
                    transform: [{ rotate: "40deg" }],
                  }}
                />

                {/* Subtle Decorative Holographic Watermark Rings */}
                <View
                  style={{
                    position: "absolute",
                    right: -12,
                    top: -12,
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    borderWidth: 1.5,
                    borderColor: `${walletColor}18`,
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    right: 6,
                    top: -6,
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    borderWidth: 1,
                    borderColor: `${walletColor}12`,
                  }}
                />

                <View style={tw`flex-row items-center justify-between mb-3`}>
                  <View style={tw`flex-row items-center`}>
                    <Ionicons name="leaf" size={17} color="#77E1D2" />
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 13,
                        fontWeight: "800",
                        marginLeft: 5,
                      }}
                    >
                      MyMoney
                    </Text>
                  </View>
                  <View style={tw`flex-row items-center`}>
                    <TouchableOpacity
                      onPress={() => handleOpenEdit(wallet)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(255,255,255,0.12)",
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.16)",
                      }}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={13}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                    {!isDefault && (
                      <TouchableOpacity
                        onPress={() => handleDeleteWallet(wallet)}
                        style={{
                          width: 28,
                          height: 28,
                          marginLeft: 5,
                          borderRadius: 10,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "rgba(244,63,94,0.18)",
                          borderWidth: 1,
                          borderColor: "rgba(244,63,94,0.3)",
                        }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={13}
                          color="#FDA4AF"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Chip and contactless marks */}
                <View style={tw`flex-row items-center mb-3`}>
                  <View
                    style={{
                      width: 39,
                      height: 28,
                      borderRadius: 7,
                      backgroundColor: "#E7C677",
                      borderWidth: 1,
                      borderColor: "#F6DEA1",
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        position: "absolute",
                        left: 12,
                        top: 0,
                        bottom: 0,
                        width: 1,
                        backgroundColor: "#9C7835",
                      }}
                    />
                    <View
                      style={{
                        position: "absolute",
                        left: 24,
                        top: 0,
                        bottom: 0,
                        width: 1,
                        backgroundColor: "#9C7835",
                      }}
                    />
                    <View
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 13,
                        height: 1,
                        backgroundColor: "#9C7835",
                      }}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={tw`flex-row items-center justify-between`}>
                      <Text
                        numberOfLines={1}
                        style={{
                          color: "#FFFFFF",
                          fontSize: 14,
                          fontWeight: "800",
                          flex: 1,
                        }}
                      >
                        {wallet.name}
                      </Text>
                      <View style={{ marginLeft: 8 }}>
                        <DefaultWalletToggle
                          active={isDefault}
                          walletName={wallet.name}
                          onActivate={() => handleSetDefault(wallet)}
                        />
                      </View>
                    </View>
                    <View style={tw`flex-row items-center mt-0.5`}>
                      <Text
                        style={{
                          color: "rgba(255,255,255,0.75)",
                          fontSize: 10,
                          fontWeight: "600",
                          marginRight: 5,
                        }}
                      >
                        {typeLabel}
                      </Text>
                      <Text
                        style={{
                          color: "rgba(255,255,255,0.4)",
                          fontSize: 9,
                          marginRight: 5,
                        }}
                      >
                        •
                      </Text>
                      <View
                        style={{
                          paddingHorizontal: 6,
                          paddingVertical: 1,
                          borderRadius: 6,
                          backgroundColor: `${roleBadgeColor}25`,
                          borderWidth: 1,
                          borderColor: `${roleBadgeColor}50`,
                        }}
                      >
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 8.5,
                            fontWeight: "700",
                          }}
                        >
                          {roleDisplayName}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <Text
                  style={{
                    color: "rgba(255,255,255,0.92)",
                    fontSize: 14,
                    fontWeight: "700",
                    letterSpacing: 2,
                    marginTop: 8,
                  }}
                >
                  {wallet.accountNumber || "Nomor rekening belum diisi"}
                </Text>

                {/* UI Bulet bulet */}
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    right: 16,
                    bottom: 20,
                    flexDirection: "row",
                    opacity: 0.96,
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: "#F0261D",
                    }}
                  />
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: "#FF9F1C",
                      marginLeft: -8,
                    }}
                  />
                </View>

                {/* Saldo dan tombol cocokkan */}
                <View
                  style={[
                    tw`flex-row items-end justify-between pt-2 mt-2 border-t`,
                    { borderTopColor: "rgba(255,255,255,0.18)" },
                  ]}
                >
                  <View>
                    <Text
                      style={[
                        tw`text-[9px] font-semibold uppercase`,
                        { color: "rgba(255,255,255,0.72)" },
                      ]}
                    >
                      Saldo Rekening
                    </Text>
                    <Text
                      style={[
                        tw`text-base font-black mt-0.5 tracking-tight`,
                        {
                          color: wallet.balance < 0 ? "#FCA5A5" : "#FFFFFF",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {formatCurrency(wallet.balance)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── FULL SCREEN MODAL CREATE / EDIT WALLET ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          {/* ── Standard AppHeader ── */}
          <AppHeader
            title={editingWallet ? "Edit Rekening" : "Tambah Rekening Baru"}
            subtitle="Kelola detail dan saldo rekening"
            showBack={true}
            onBackPress={() => setModalVisible(false)}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={tw`p-4 pb-12`}
            >
              {/* Nama Rekening */}
              <Text
                style={[
                  tw`text-[10px] font-bold uppercase mb-1`,
                  { color: TEXT_SECONDARY },
                ]}
              >
                Nama Rekening / Dompet
              </Text>
              <TextInput
                value={formName}
                onChangeText={setFormName}
                placeholder="Contoh: BCA Utama, GoPay, Dompet Tunai"
                placeholderTextColor={TEXT_SECONDARY}
                style={[
                  tw`border rounded-xl px-3.5 py-2.5 text-xs mb-3 font-semibold`,
                  {
                    color: TEXT_PRIMARY,
                    borderColor: `${BORDER_COLOR}80`,
                    backgroundColor: colors.surfaceLight,
                  },
                ]}
              />

              {/* Tipe Rekening (Horizontal Scrollable Pills) */}
              <Text
                style={[
                  tw`text-[10px] font-bold uppercase mb-1.5`,
                  { color: TEXT_SECONDARY },
                ]}
              >
                Tipe Rekening
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={tw`flex-row mb-2.5`}
              >
                {WALLET_TYPE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setFormType(opt.id)}
                    style={[
                      tw`flex-row items-center px-3 py-1.5 rounded-xl mr-2 border`,
                      formType === opt.id
                        ? {
                            backgroundColor: colors.accent,
                            borderColor: colors.accent,
                          }
                        : {
                            backgroundColor: colors.surfaceLight,
                            borderColor: `${BORDER_COLOR}70`,
                          },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={13}
                      color={formType === opt.id ? "#FFFFFF" : TEXT_SECONDARY}
                    />
                    <Text
                      style={[
                        tw`text-[10.5px] font-bold ml-1.5`,
                        {
                          color: formType === opt.id ? "#FFFFFF" : TEXT_PRIMARY,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Peran Rekening (Horizontal Scrollable Chips) */}
              <Text
                style={[
                  tw`text-[10px] font-bold uppercase mb-1.5`,
                  { color: TEXT_SECONDARY },
                ]}
              >
                Peran Rekening
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={tw`flex-row mb-2`}
              >
                {[
                  {
                    id: "operational",
                    label: "Belanja",
                    icon: "cart-outline",
                    color: colors.success,
                  },
                  {
                    id: "savings",
                    label: "Tabungan",
                    icon: "lock-closed-outline",
                    color: colors.info,
                  },
                  {
                    id: "credit",
                    label: "Kredit",
                    icon: "card-outline",
                    color: colors.error,
                  },
                  {
                    id: "investasi",
                    label: "Investasi",
                    icon: "trending-up-outline",
                    color: colors.warning,
                  },
                  {
                    id: "custom",
                    label: "+ Kustom",
                    icon: "pencil-outline",
                    color: colors.purple,
                  },
                ].map((opt) => {
                  const isSelected = formCustomRole.trim()
                    ? opt.id === "custom"
                    : formRole === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => {
                        if (opt.id === "custom") {
                          setFormRole("custom");
                          setFormCustomRole("");
                        } else {
                          setFormRole(opt.id);
                          setFormCustomRole("");
                          setFormIsLiquid(
                            opt.id === "operational" || opt.id === "investasi",
                          );
                        }
                      }}
                      style={[
                        tw`flex-row items-center px-3 py-1.5 rounded-xl mr-2 border`,
                        isSelected
                          ? {
                              backgroundColor: `${opt.color}20`,
                              borderColor: opt.color,
                            }
                          : {
                              backgroundColor: colors.surfaceLight,
                              borderColor: `${BORDER_COLOR}70`,
                            },
                      ]}
                    >
                      <Ionicons
                        name={opt.icon as any}
                        size={12}
                        color={isSelected ? opt.color : TEXT_SECONDARY}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          tw`text-[10.5px] font-bold`,
                          { color: isSelected ? opt.color : TEXT_PRIMARY },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Custom Role Input */}
              {(formRole === "custom" || formCustomRole.trim().length > 0) && (
                <TextInput
                  value={formCustomRole}
                  onChangeText={(v) => {
                    setFormCustomRole(v);
                    if (v.trim()) setFormRole("custom");
                  }}
                  placeholder="Ketik peran kustom (cth: Dana Darurat)"
                  placeholderTextColor={TEXT_SECONDARY}
                  style={[
                    tw`border rounded-xl px-3 py-2 text-xs mb-2.5 font-semibold`,
                    {
                      color: TEXT_PRIMARY,
                      borderColor: colors.purple,
                      backgroundColor: `${colors.purple}10`,
                    },
                  ]}
                />
              )}

              {/* Liquid Toggle */}
              <View
                style={[
                  tw`flex-row items-center justify-between p-3 rounded-xl mb-3 border`,
                  {
                    backgroundColor: formIsLiquid
                      ? `${colors.success}10`
                      : `${colors.info}10`,
                    borderColor: formIsLiquid
                      ? `${colors.success}50`
                      : `${colors.info}50`,
                  },
                ]}
              >
                <View style={tw`flex-1 pr-3`}>
                  <View style={tw`flex-row items-center mb-0.5`}>
                    <Ionicons
                      name={formIsLiquid ? "water-outline" : "snow-outline"}
                      size={13}
                      color={formIsLiquid ? colors.success : colors.info}
                      style={{ marginRight: 5 }}
                    />
                    <Text
                      style={[
                        tw`text-xs font-bold`,
                        { color: formIsLiquid ? colors.success : colors.info },
                      ]}
                    >
                      {formIsLiquid ? "Uang Belanja" : "Uang Dingin"}
                    </Text>
                  </View>
                  <Text style={[tw`text-[9.5px]`, { color: TEXT_SECONDARY }]}>
                    {formIsLiquid
                      ? "Masuk ke jatah belanja harian"
                      : "Tidak dihitung sebagai jatah belanja harian"}
                  </Text>
                </View>
                <Switch
                  value={formIsLiquid}
                  onValueChange={setFormIsLiquid}
                  trackColor={{
                    false: `${colors.info}30`,
                    true: `${colors.success}30`,
                  }}
                  thumbColor={formIsLiquid ? colors.success : colors.info}
                />
              </View>

              {/* Saldo Awal */}
              {!editingWallet && (
                <>
                  <Text
                    style={[
                      tw`text-[10px] font-bold uppercase mb-1`,
                      { color: TEXT_SECONDARY },
                    ]}
                  >
                    Saldo Saat Ini (Saldo Awal)
                  </Text>
                  <TextInput
                    value={formInitialBalance}
                    onChangeText={setFormInitialBalance}
                    placeholder="Rp 0"
                    placeholderTextColor={TEXT_SECONDARY}
                    keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
                    style={[
                      tw`border rounded-xl px-3.5 py-2.5 text-sm font-black mb-3`,
                      {
                        color: TEXT_PRIMARY,
                        borderColor: `${BORDER_COLOR}80`,
                        backgroundColor: colors.surfaceLight,
                      },
                    ]}
                  />
                </>
              )}

              {/* Nomor Akun Opsional */}
              <Text
                style={[
                  tw`text-[10px] font-bold uppercase mb-1`,
                  { color: TEXT_SECONDARY },
                ]}
              >
                Nomor Akun / 4 Digit Kartu (Opsional)
              </Text>
              <TextInput
                value={formAccountNumber}
                onChangeText={setFormAccountNumber}
                placeholder="Misal: 4892"
                placeholderTextColor={TEXT_SECONDARY}
                maxLength={20}
                style={[
                  tw`border rounded-xl px-3 py-2 text-xs mb-3 font-semibold`,
                  {
                    color: TEXT_PRIMARY,
                    borderColor: `${BORDER_COLOR}80`,
                    backgroundColor: colors.surfaceLight,
                  },
                ]}
              />

              {/* Pilihan Warna (Horizontal Scrollable Swatches) */}
              <Text
                style={[
                  tw`text-[10px] font-bold uppercase mb-1.5`,
                  { color: TEXT_SECONDARY },
                ]}
              >
                Warna Kartu
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={tw`flex-row mb-3`}
              >
                {WALLET_COLOR_PALETTES.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setFormColor(c.id)}
                    style={[
                      tw`w-8 h-8 rounded-full mr-2.5 items-center justify-center border-2`,
                      { backgroundColor: c.id },
                      formColor === c.id
                        ? { borderColor: "#FFFFFF" }
                        : { borderColor: "transparent" },
                    ]}
                  >
                    {formColor === c.id && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>


              {/* Tombol Simpan */}
              <TouchableOpacity
                onPress={handleSaveWallet}
                activeOpacity={0.8}
                style={[
                  tw`py-3 rounded-xl items-center shadow-sm`,
                  { backgroundColor: colors.accent },
                ]}
              >
                <Text style={tw`text-white text-xs font-black`}>
                  {editingWallet ? "Simpan Perubahan" : "Buat Rekening"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ── Standardized Bottom-Right Squircle FAB ── */}
      <AppFAB
        onPress={handleOpenCreate}
        accessibilityLabel="Tambah Dompet atau Rekening Baru"
      />
    </SafeAreaView>
  );
};

export default WalletsScreen;
