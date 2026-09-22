import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
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

type SafeIconName = keyof typeof Ionicons.glyphMap;

const WALLET_TYPE_OPTIONS: { id: WalletType; label: string; icon: SafeIconName }[] = [
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

const WALLET_ICONS: SafeIconName[] = [
  "wallet",
  "card",
  "phone-portrait",
  "cash",
  "trending-up",
  "storefront",
  "business",
  "gift",
  "shield-checkmark",
  "diamond",
];

const WalletsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { state, addWallet, editWallet, deleteWallet, reconcileWallet } =
    useAppContext();

  const [filterRole, setFilterRole] = useState<"all" | "liquid" | "nonliquid" | string>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [reconcileModalVisible, setReconcileModalVisible] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [reconcilingWallet, setReconcilingWallet] = useState<Wallet | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<WalletType>("bank");
  const [formRole, setFormRole] = useState<WalletRole>("operational");
  const [formIsLiquid, setFormIsLiquid] = useState<boolean>(true);
  const [formCustomRole, setFormCustomRole] = useState("");
  const [formInitialBalance, setFormInitialBalance] = useState("");
  const [formAccountNumber, setFormAccountNumber] = useState("");
  const [formColor, setFormColor] = useState("#10B981");
  const [formIcon, setFormIcon] = useState<SafeIconName>("card");
  const [formIsDefault, setFormIsDefault] = useState(false);

  // Reconcile states
  const [reconcileRealBalance, setReconcileRealBalance] = useState("");
  const [reconcileNote, setReconcileNote] = useState("");

  const wallets = state.wallets || [];

  // Filtered wallets
  const filteredWallets = useMemo(() => {
    if (filterRole === "all") return wallets;
    if (filterRole === "liquid") {
      return wallets.filter((w) =>
        w.isLiquid !== undefined ? w.isLiquid : w.role === "operational"
      );
    }
    if (filterRole === "nonliquid") {
      return wallets.filter((w) =>
        w.isLiquid !== undefined ? !w.isLiquid : w.role !== "operational"
      );
    }
    return wallets.filter((w) => w.role === filterRole);
  }, [wallets, filterRole]);

  // Calculations for overview
  const totalBalance = safeNumber(state.balance);
  const operationalBalance = safeNumber(state.operationalBalance);
  const savingsBalance = safeNumber(state.savingsBalance);
  const totalPart = Math.max(0, operationalBalance) + Math.max(0, savingsBalance);
  const opPct = totalPart > 0 ? Math.round((Math.max(0, operationalBalance) / totalPart) * 100) : 50;
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
    setFormIcon("card");
    setFormIsDefault(wallets.length === 0);
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
    setFormIsLiquid(w.isLiquid !== undefined ? w.isLiquid : w.role === "operational");
    const presetRoles = ["operational", "savings", "credit", "investasi", "belanja", "tabungan"];
    setFormCustomRole(!presetRoles.includes(w.role.toLowerCase()) ? w.role : "");
    setFormInitialBalance(String(w.initialBalance || 0));
    setFormAccountNumber(w.accountNumber || "");
    setFormColor(w.color || "#10B981");
    setFormIcon((w.icon as SafeIconName) || "card");
    setFormIsDefault(Boolean(w.isDefault));
    setModalVisible(true);
  };

  // Open Reconcile Modal
  const handleOpenReconcile = (w: Wallet) => {
    setReconcilingWallet(w);
    setReconcileRealBalance(String(w.balance || 0));
    setReconcileNote("");
    setReconcileModalVisible(true);
  };

  // Save Wallet
  const handleSaveWallet = async () => {
    if (!formName.trim()) {
      Alert.alert("Perhatian", "Silakan masukkan nama rekening / dompet");
      return;
    }

    const finalRole = formCustomRole.trim() ? formCustomRole.trim() : formRole;
    const numInitial = parseFloat(formInitialBalance.replace(/\D/g, "")) || 0;

    try {
      if (editingWallet) {
        await editWallet(editingWallet.id, {
          name: formName.trim(),
          type: formType,
          role: finalRole,
          isLiquid: formIsLiquid,
          accountNumber: formAccountNumber.trim() || undefined,
          color: formColor,
          icon: formIcon,
          isDefault: formIsDefault,
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
          icon: formIcon,
          isDefault: formIsDefault,
        });
      }
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert("Gagal Menyimpan", err.message || "Terjadi kesalahan sistem");
    }
  };

  // Delete Wallet
  const handleDeleteWallet = (w: Wallet) => {
    if (wallets.length <= 1) {
      Alert.alert(
        "Tidak Dapat Dihapus",
        "Anda harus memiliki minimal satu dompet utama di dalam aplikasi."
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
      ]
    );
  };

  // Reconcile Wallet
  const handleExecuteReconcile = async () => {
    if (!reconcilingWallet) return;

    const actual = parseFloat(reconcileRealBalance.replace(/\D/g, "")) || 0;
    const current = safeNumber(reconcilingWallet.balance);
    const diff = actual - current;

    if (diff === 0) {
      Alert.alert("Info", "Saldo aplikasi sudah cocok dengan saldo fisik Anda.");
      setReconcileModalVisible(false);
      return;
    }

    const isSurplus = diff > 0;
    const diffLabel = isSurplus ? `+${formatCurrency(diff)}` : `-${formatCurrency(Math.abs(diff))}`;

    Alert.alert(
      "Konfirmasi Pencocokan Saldo",
      `Sistem akan membuat transaksi penyesuaian sebesar ${diffLabel} (${
        isSurplus ? "Pemasukan Kas" : "Pengeluaran Kas"
      }) agar saldo "${reconcilingWallet.name}" persis ${formatCurrency(actual)}. Lanjutkan?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Cocokkan Sekarang",
          onPress: async () => {
            try {
              await reconcileWallet(
                reconcilingWallet.id,
                actual,
                reconcileNote.trim() || undefined
              );
              setReconcileModalVisible(false);
              Alert.alert("Berhasil", "Saldo rekening berhasil disinkronkan.");
            } catch (err: any) {
              Alert.alert("Gagal", err.message || "Gagal mencocokkan saldo");
            }
          },
        },
      ]
    );
  };

  const CARD_BG = colors.surface;
  const TEXT_PRIMARY = colors.textPrimary;
  const TEXT_SECONDARY = colors.textSecondary;
  const BORDER_COLOR = colors.border;

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: colors.background }]}>
      {/* ── COMPACT HEADER BAR ── */}
      <View
        style={[
          tw`flex-row items-center justify-between px-4 py-2.5 border-b`,
          { borderBottomColor: `${BORDER_COLOR}60`, backgroundColor: colors.surface },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={tw`w-8 h-8 rounded-full items-center justify-center`}
        >
          <Ionicons name="arrow-back" size={20} color={TEXT_PRIMARY} />
        </TouchableOpacity>

        <View style={tw`flex-1 mx-2.5`}>
          <Text style={[tw`text-sm font-black`, { color: TEXT_PRIMARY, letterSpacing: -0.2 }]}>
            Dompet & Rekening
          </Text>
          <Text style={[tw`text-[10px] font-medium`, { color: TEXT_SECONDARY }]}>
            {wallets.length} Akun Terdaftar
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleOpenCreate}
          activeOpacity={0.8}
          style={[
            tw`flex-row items-center px-3 py-1.5 rounded-xl`,
            { backgroundColor: colors.accent },
          ]}
        >
          <Ionicons name="add" size={15} color="#FFFFFF" />
          <Text style={tw`text-white text-xs font-bold ml-1`}>Tambah</Text>
        </TouchableOpacity>
      </View>

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
              <Text style={[tw`text-[10px] font-bold uppercase tracking-wider`, { color: TEXT_SECONDARY }]}>
                Total Kekayaan Bersih (Net Worth)
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
                <View style={[tw`w-2 h-2 rounded-full`, { backgroundColor: colors.success }]} />
                <Text style={[tw`text-[10px] font-semibold`, { color: TEXT_SECONDARY }]}>
                  Belanja:
                </Text>
                <Text style={[tw`text-[11px] font-black`, { color: colors.success }]}>
                  {formatCurrency(operationalBalance)}
                </Text>
                <Text style={[tw`text-[9px] font-bold`, { color: colors.success }]}>
                  ({opPct}%)
                </Text>
              </View>

              <View style={[tw`w-[1px] h-3`, { backgroundColor: BORDER_COLOR }]} />

              {/* Dingin (Savings) */}
              <View style={tw`flex-row items-center gap-1.5`}>
                <View style={[tw`w-2 h-2 rounded-full`, { backgroundColor: colors.info }]} />
                <Text style={[tw`text-[10px] font-semibold`, { color: TEXT_SECONDARY }]}>
                  Dingin:
                </Text>
                <Text style={[tw`text-[11px] font-black`, { color: colors.info }]}>
                  {formatCurrency(savingsBalance)}
                </Text>
                <Text style={[tw`text-[9px] font-bold`, { color: colors.info }]}>
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
              <View style={[tw`h-full flex-1`, { backgroundColor: colors.info }]} />
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
            { id: "all", label: `Semua (${wallets.length})`, color: colors.accent },
            { id: "liquid", label: "💧 Likuid", color: colors.success },
            { id: "nonliquid", label: "❄️ Non-Likuid", color: colors.info },
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
                    ? { backgroundColor: `${chip.color}20`, borderColor: chip.color }
                    : { backgroundColor: CARD_BG, borderColor: `${BORDER_COLOR}70` },
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
            <Text style={[tw`text-[10px] mt-0.5 text-center`, { color: TEXT_SECONDARY }]}>
              Tekan tombol "+ Tambah" di atas untuk membuat rekening baru.
            </Text>
          </View>
        ) : (
          filteredWallets.map((wallet) => {
            const walletColor = wallet.color || colors.accent;
            const isLiquid =
              wallet.isLiquid !== undefined
                ? wallet.isLiquid
                : wallet.role === "operational";
            const isCredit = wallet.role === "credit" && wallet.isLiquid === false;
            const roleBadgeColor = isCredit
              ? colors.error
              : isLiquid
              ? colors.success
              : colors.info;

            const roleDisplayName = wallet.role === "operational"
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
                  tw`rounded-2xl p-3.5 mb-2.5 border relative overflow-hidden`,
                  {
                    backgroundColor: CARD_BG,
                    borderColor: `${walletColor}35`,
                  },
                ]}
              >
                {/* Dual-Tone Gradient Sheen */}
                <LinearGradient
                  colors={[`${walletColor}18`, `${colors.surface}`]}
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

                {/* Card Top: Icon, Identity, and Action Buttons */}
                <View style={tw`flex-row items-center justify-between mb-2`}>
                  <View style={tw`flex-row items-center flex-1 pr-2`}>
                    <View
                      style={[
                        tw`w-8 h-8 rounded-xl items-center justify-center mr-2.5`,
                        { backgroundColor: `${walletColor}25` },
                      ]}
                    >
                      <Ionicons
                        name={(wallet.icon as SafeIconName) || "card"}
                        size={16}
                        color={walletColor}
                      />
                    </View>

                    <View style={tw`flex-1`}>
                      <View style={tw`flex-row items-center gap-1.5`}>
                        <Text
                          style={[tw`text-xs font-black`, { color: TEXT_PRIMARY }]}
                          numberOfLines={1}
                        >
                          {wallet.name}
                        </Text>
                        {wallet.isDefault && (
                          <View
                            style={[
                              tw`px-1.5 py-0.2 rounded-md flex-row items-center`,
                              { backgroundColor: `${colors.accent}20` },
                            ]}
                          >
                            <Ionicons
                              name="star"
                              size={8}
                              color={colors.accent}
                              style={{ marginRight: 2 }}
                            />
                            <Text
                              style={{
                                fontSize: 8,
                                fontWeight: "800",
                                color: colors.accent,
                              }}
                            >
                              UTAMA
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[tw`text-[9.5px] mt-0.5`, { color: TEXT_SECONDARY }]}>
                        {typeLabel}
                        {wallet.accountNumber ? ` •••• ${wallet.accountNumber}` : ""}
                      </Text>
                    </View>
                  </View>

                  {/* Quick actions */}
                  <View style={tw`flex-row items-center gap-1.5`}>
                    {/* Edit button */}
                    <TouchableOpacity
                      onPress={() => handleOpenEdit(wallet)}
                      style={[
                        tw`w-7 h-7 rounded-lg items-center justify-center border`,
                        { borderColor: `${BORDER_COLOR}70`, backgroundColor: `${colors.surface}90` },
                      ]}
                    >
                      <Ionicons name="pencil-outline" size={12} color={TEXT_SECONDARY} />
                    </TouchableOpacity>

                    {/* Delete button (if not default) */}
                    {!wallet.isDefault && (
                      <TouchableOpacity
                        onPress={() => handleDeleteWallet(wallet)}
                        style={[
                          tw`w-7 h-7 rounded-lg items-center justify-center border border-red-500/20 bg-red-500/10`,
                        ]}
                      >
                        <Ionicons name="trash-outline" size={12} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Card Bottom: Balance & Compact Reconcile Pill */}
                <View
                  style={[
                    tw`flex-row items-end justify-between pt-2 mt-1 border-t`,
                    { borderTopColor: `${BORDER_COLOR}40` },
                  ]}
                >
                  <View>
                    <Text style={[tw`text-[9px] font-semibold uppercase`, { color: TEXT_SECONDARY }]}>
                      Saldo Rekening
                    </Text>
                    <Text
                      style={[
                        tw`text-base font-black mt-0.5 tracking-tight`,
                        {
                          color: wallet.balance < 0 ? colors.error : TEXT_PRIMARY,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {formatCurrency(wallet.balance)}
                    </Text>
                  </View>

                  {/* Compact Reconcile Button */}
                  <TouchableOpacity
                    onPress={() => handleOpenReconcile(wallet)}
                    activeOpacity={0.7}
                    style={[
                      tw`flex-row items-center px-2.5 py-1.2 rounded-lg`,
                      { backgroundColor: `${colors.info}15` },
                    ]}
                  >
                    <Ionicons name="sync-outline" size={11} color={colors.info} />
                    <Text
                      style={[
                        tw`text-[10px] font-bold ml-1`,
                        { color: colors.info },
                      ]}
                    >
                      Cocokkan Saldo
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── MODAL CREATE / EDIT WALLET (COMPACT FORM) ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={tw`flex-1 bg-black/60 justify-end`}
        >
          <View
            style={[
              tw`rounded-t-3xl max-h-[88%]`,
              { backgroundColor: CARD_BG },
            ]}
          >
            {/* Modal Header */}
            <View
              style={[
                tw`flex-row items-center justify-between px-4 py-3 border-b`,
                { borderBottomColor: `${BORDER_COLOR}60` },
              ]}
            >
              <Text style={[tw`text-sm font-black`, { color: TEXT_PRIMARY }]}>
                {editingWallet ? "Edit Rekening" : "Tambah Rekening Baru"}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={tw`w-7 h-7 rounded-full items-center justify-center`}
              >
                <Ionicons name="close" size={20} color={TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={tw`p-4 pb-8`}>
              {/* Nama Rekening */}
              <Text style={[tw`text-[10px] font-bold uppercase mb-1`, { color: TEXT_SECONDARY }]}>
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
              <Text style={[tw`text-[10px] font-bold uppercase mb-1.5`, { color: TEXT_SECONDARY }]}>
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
                        ? { backgroundColor: colors.accent, borderColor: colors.accent }
                        : { backgroundColor: colors.surfaceLight, borderColor: `${BORDER_COLOR}70` },
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
                        { color: formType === opt.id ? "#FFFFFF" : TEXT_PRIMARY },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Peran Rekening (Horizontal Scrollable Chips) */}
              <Text style={[tw`text-[10px] font-bold uppercase mb-1.5`, { color: TEXT_SECONDARY }]}>
                Peran Rekening
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={tw`flex-row mb-2`}
              >
                {[
                  { id: "operational", label: "Belanja", icon: "cart-outline", color: colors.success },
                  { id: "savings", label: "Tabungan", icon: "lock-closed-outline", color: colors.info },
                  { id: "credit", label: "Kredit", icon: "card-outline", color: colors.error },
                  { id: "investasi", label: "Investasi", icon: "trending-up-outline", color: colors.warning },
                  { id: "custom", label: "+ Kustom", icon: "pencil-outline", color: colors.purple },
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
                          setFormIsLiquid(opt.id === "operational" || opt.id === "investasi");
                        }
                      }}
                      style={[
                        tw`flex-row items-center px-3 py-1.5 rounded-xl mr-2 border`,
                        isSelected
                          ? { backgroundColor: `${opt.color}20`, borderColor: opt.color }
                          : { backgroundColor: colors.surfaceLight, borderColor: `${BORDER_COLOR}70` },
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
                    backgroundColor: formIsLiquid ? `${colors.success}10` : `${colors.info}10`,
                    borderColor: formIsLiquid ? `${colors.success}50` : `${colors.info}50`,
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
                      {formIsLiquid ? "Uang Likuid (Bisa Belanja)" : "Uang Dingin (Non-Likuid)"}
                    </Text>
                  </View>
                  <Text style={[tw`text-[9.5px]`, { color: TEXT_SECONDARY }]}>
                    {formIsLiquid
                      ? "Masuk ke jatah belanja harian"
                      : "Diisolasi dari jatah belanja harian"}
                  </Text>
                </View>
                <Switch
                  value={formIsLiquid}
                  onValueChange={setFormIsLiquid}
                  trackColor={{ false: `${colors.info}30`, true: `${colors.success}30` }}
                  thumbColor={formIsLiquid ? colors.success : colors.info}
                />
              </View>

              {/* Saldo Awal */}
              {!editingWallet && (
                <>
                  <Text style={[tw`text-[10px] font-bold uppercase mb-1`, { color: TEXT_SECONDARY }]}>
                    Saldo Saat Ini (Saldo Awal)
                  </Text>
                  <TextInput
                    value={formInitialBalance}
                    onChangeText={setFormInitialBalance}
                    placeholder="Rp 0"
                    placeholderTextColor={TEXT_SECONDARY}
                    keyboardType="numeric"
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
              <Text style={[tw`text-[10px] font-bold uppercase mb-1`, { color: TEXT_SECONDARY }]}>
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
              <Text style={[tw`text-[10px] font-bold uppercase mb-1.5`, { color: TEXT_SECONDARY }]}>
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

              {/* Pilihan Ikon (Horizontal Scrollable Icons) */}
              <Text style={[tw`text-[10px] font-bold uppercase mb-1.5`, { color: TEXT_SECONDARY }]}>
                Ikon Rekening
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={tw`flex-row mb-3`}
              >
                {WALLET_ICONS.map((iconName) => (
                  <TouchableOpacity
                    key={iconName}
                    onPress={() => setFormIcon(iconName)}
                    style={[
                      tw`w-8 h-8 rounded-xl mr-2 items-center justify-center border`,
                      formIcon === iconName
                        ? { backgroundColor: formColor, borderColor: formColor }
                        : { backgroundColor: colors.surfaceLight, borderColor: `${BORDER_COLOR}70` },
                    ]}
                  >
                    <Ionicons
                      name={iconName}
                      size={15}
                      color={formIcon === iconName ? "#FFFFFF" : TEXT_SECONDARY}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Jadikan Utama Switch */}
              <View
                style={[
                  tw`flex-row items-center justify-between p-3 rounded-xl mb-4 border`,
                  { borderColor: `${BORDER_COLOR}70`, backgroundColor: colors.surfaceLight },
                ]}
              >
                <View style={tw`flex-1 pr-3`}>
                  <Text style={[tw`text-xs font-bold`, { color: TEXT_PRIMARY }]}>
                    Jadikan Rekening Utama
                  </Text>
                  <Text style={[tw`text-[9.5px] mt-0.5`, { color: TEXT_SECONDARY }]}>
                    Otomatis dipilih saat transaksi baru
                  </Text>
                </View>
                <Switch
                  value={formIsDefault}
                  onValueChange={setFormIsDefault}
                  trackColor={{ false: BORDER_COLOR, true: colors.accent }}
                  thumbColor="#FFFFFF"
                />
              </View>

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
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MODAL SMART RECONCILE (COMPACT & INTUITIVE) ── */}
      <Modal
        visible={reconcileModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setReconcileModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={tw`flex-1 bg-black/60 justify-end`}
        >
          <View
            style={[
              tw`rounded-t-3xl p-4 pb-6`,
              { backgroundColor: CARD_BG },
            ]}
          >
            {/* Header */}
            <View
              style={[
                tw`flex-row items-center justify-between pb-2.5 border-b mb-3`,
                { borderBottomColor: `${BORDER_COLOR}60` },
              ]}
            >
              <View>
                <Text style={[tw`text-sm font-black`, { color: TEXT_PRIMARY }]}>
                  Pencocokan Saldo
                </Text>
                <Text style={[tw`text-[10px] font-semibold`, { color: TEXT_SECONDARY }]}>
                  {reconcilingWallet?.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setReconcileModalVisible(false)}
                style={tw`w-7 h-7 rounded-full items-center justify-center`}
              >
                <Ionicons name="close" size={20} color={TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>

            {/* Current Balance Box */}
            <View
              style={[
                tw`p-3 rounded-xl mb-3 border flex-row items-center justify-between`,
                { backgroundColor: colors.surfaceLight, borderColor: `${BORDER_COLOR}70` },
              ]}
            >
              <View>
                <Text style={[tw`text-[9.5px] font-bold uppercase`, { color: TEXT_SECONDARY }]}>
                  Saldo di Aplikasi Saat Ini
                </Text>
                <Text style={[tw`text-base font-black mt-0.5`, { color: TEXT_PRIMARY }]}>
                  {formatCurrency(reconcilingWallet?.balance || 0)}
                </Text>
              </View>
              <Ionicons name="calculator-outline" size={22} color={colors.info} />
            </View>

            {/* Input Real Balance */}
            <Text style={[tw`text-[10px] font-bold uppercase mb-1`, { color: TEXT_SECONDARY }]}>
              Saldo Riil di M-Banking / Dompet Fisik
            </Text>
            <TextInput
              value={reconcileRealBalance}
              onChangeText={setReconcileRealBalance}
              placeholder="Masukkan angka saldo riil"
              placeholderTextColor={TEXT_SECONDARY}
              keyboardType="numeric"
              style={[
                tw`border rounded-xl px-3.5 py-2.5 text-base font-black mb-2.5`,
                {
                  color: TEXT_PRIMARY,
                  borderColor: `${BORDER_COLOR}80`,
                  backgroundColor: colors.surfaceLight,
                },
              ]}
            />

            {/* Live Difference Box */}
            {(() => {
              const actual =
                parseFloat(reconcileRealBalance.replace(/\D/g, "")) || 0;
              const current = safeNumber(reconcilingWallet?.balance);
              const diff = actual - current;

              if (diff === 0) {
                return (
                  <View style={tw`p-2 bg-gray-500/10 rounded-lg mb-3`}>
                    <Text style={tw`text-[10.5px] text-gray-500 text-center font-bold`}>
                      ✓ Saldo sudah cocok sempurna (selisih Rp 0)
                    </Text>
                  </View>
                );
              }

              const isSurplus = diff > 0;
              const statusColor = isSurplus ? colors.success : colors.error;
              return (
                <View
                  style={[
                    tw`p-2.5 rounded-xl mb-3 border`,
                    {
                      backgroundColor: `${statusColor}12`,
                      borderColor: `${statusColor}40`,
                    },
                  ]}
                >
                  <View style={tw`flex-row items-center justify-between`}>
                    <Text style={[tw`text-[11px] font-bold`, { color: statusColor }]}>
                      {isSurplus ? "Selisih Masuk (Surplus):" : "Selisih Kurang (Defisit):"}
                    </Text>
                    <Text style={[tw`text-xs font-black`, { color: statusColor }]}>
                      {isSurplus
                        ? `+${formatCurrency(diff)}`
                        : `-${formatCurrency(Math.abs(diff))}`}
                    </Text>
                  </View>
                  <Text style={[tw`text-[9px] mt-0.5`, { color: TEXT_SECONDARY }]}>
                    {isSurplus
                      ? "Akan otomatis dicatat sebagai pemasukan penyesuaian."
                      : "Akan otomatis dicatat sebagai pengeluaran selisih kas."}
                  </Text>
                </View>
              );
            })()}

            {/* Catatan Penyesuaian */}
            <Text style={[tw`text-[10px] font-bold uppercase mb-1`, { color: TEXT_SECONDARY }]}>
              Catatan Penyesuaian (Opsional)
            </Text>
            <TextInput
              value={reconcileNote}
              onChangeText={setReconcileNote}
              placeholder="Contoh: Lupa catat jajan kemarin"
              placeholderTextColor={TEXT_SECONDARY}
              style={[
                tw`border rounded-xl px-3 py-2 text-xs mb-3.5 font-semibold`,
                {
                  color: TEXT_PRIMARY,
                  borderColor: `${BORDER_COLOR}80`,
                  backgroundColor: colors.surfaceLight,
                },
              ]}
            />

            {/* Button Submit Reconcile */}
            <TouchableOpacity
              onPress={handleExecuteReconcile}
              activeOpacity={0.8}
              style={[
                tw`py-3 rounded-xl items-center shadow-sm`,
                { backgroundColor: colors.info },
              ]}
            >
              <Text style={tw`text-white text-xs font-black`}>
                Sinkronkan Saldo Sekarang
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default WalletsScreen;
