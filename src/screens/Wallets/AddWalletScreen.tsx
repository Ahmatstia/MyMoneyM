// File: src/screens/Wallets/AddWalletScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { Wallet, WalletType, WalletRole, RootStackParamList } from "../../types";
import { useTheme } from "../../theme/ThemeContext";
import { AppHeader } from "../../components/common";

type SafeIconName = keyof typeof Ionicons.glyphMap;

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

type AddWalletRouteProp = RouteProp<RootStackParamList, "AddWallet">;

export const AddWalletScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<AddWalletRouteProp>();
  const { state, addWallet, editWallet, deleteWallet } = useAppContext();

  const isEditMode = route.params?.editMode || false;
  const editingWallet = route.params?.walletData;

  const wallets = state.wallets || [];

  // Form states
  const [formName, setFormName] = useState(editingWallet?.name || "");
  const [formType, setFormType] = useState<WalletType>(editingWallet?.type || "bank");
  const [formRole, setFormRole] = useState<WalletRole>(editingWallet?.role || "operational");
  const [formIsLiquid, setFormIsLiquid] = useState<boolean>(
    editingWallet?.isLiquid !== undefined
      ? editingWallet.isLiquid
      : editingWallet?.role === "operational" || true
  );
  const [formCustomRole, setFormCustomRole] = useState(
    editingWallet?.role &&
      !["operational", "savings", "credit", "investasi", "belanja"].includes(editingWallet.role)
      ? editingWallet.role
      : ""
  );
  const [formInitialBalance, setFormInitialBalance] = useState("");
  const [formAccountNumber, setFormAccountNumber] = useState(
    editingWallet?.accountNumber || ""
  );
  const [formColor, setFormColor] = useState(editingWallet?.color || "#10B981");
  const [loading, setLoading] = useState(false);

  const parseSignedBalance = (val: string): number => {
    const trimmed = val.trim();
    const isNegative = trimmed.startsWith("-");
    const digits = trimmed.replace(/[^\d.]/g, "");
    const num = parseFloat(digits) || 0;
    return isNegative ? -num : num;
  };

  const handleSave = async () => {
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

    setLoading(true);
    try {
      if (isEditMode && editingWallet) {
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
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Gagal Menyimpan", err.message || "Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!editingWallet) return;
    if (wallets.length <= 1) {
      Alert.alert(
        "Tidak Dapat Dihapus",
        "Anda harus memiliki minimal satu dompet utama di dalam aplikasi."
      );
      return;
    }

    Alert.alert(
      "Hapus Rekening",
      `Hapus rekening "${editingWallet.name}"?\n\nRekening ini akan dihapus dari daftar akun.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteWallet(editingWallet.id);
              navigation.goBack();
            } catch (err: any) {
              Alert.alert("Gagal", err.message || "Gagal menghapus dompet");
            }
          },
        },
      ]
    );
  };

  const TEXT_PRIMARY = colors.textPrimary;
  const TEXT_SECONDARY = colors.textSecondary;
  const BORDER_COLOR = colors.border;
  const SURFACE_COLOR = colors.surface;

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: colors.background }]}>
      {/* ── Standard AppHeader ── */}
      <AppHeader
        title={isEditMode ? "Edit Rekening" : "Tambah Rekening Baru"}
        subtitle="Kelola detail dan saldo akun keuangan"
        showBack={true}
        rightComponent={
          isEditMode ? (
            <TouchableOpacity
              onPress={handleDelete}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${colors.error}15`,
                borderWidth: 1,
                borderColor: `${colors.error}30`,
              }}
              disabled={loading}
              accessibilityLabel="Hapus Rekening"
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`p-4 pb-16`}
        >
          {/* Nama Rekening */}
          <Text
            style={[
              tw`text-[11px] font-bold uppercase mb-1.5`,
              { color: TEXT_SECONDARY },
            ]}
          >
            Nama Rekening / Dompet
          </Text>
          <TextInput
            value={formName}
            onChangeText={setFormName}
            placeholder="Misal: BCA Utama, Gopay, Dompet Fisik"
            placeholderTextColor={TEXT_SECONDARY}
            style={[
              tw`border rounded-xl px-3.5 py-3 text-sm mb-4 font-semibold`,
              {
                color: TEXT_PRIMARY,
                borderColor: `${BORDER_COLOR}80`,
                backgroundColor: SURFACE_COLOR,
              },
            ]}
          />

          {/* Jenis Rekening */}
          <Text
            style={[
              tw`text-[11px] font-bold uppercase mb-1.5`,
              { color: TEXT_SECONDARY },
            ]}
          >
            Jenis Akun
          </Text>
          <View style={tw`flex-row flex-wrap gap-2 mb-4`}>
            {WALLET_TYPE_OPTIONS.map((t) => {
              const active = formType === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => {
                    setFormType(t.id);
                    if (t.id === "credit") {
                      setFormRole("credit");
                      setFormIsLiquid(false);
                    } else if (t.id === "investment") {
                      setFormRole("investasi");
                      setFormIsLiquid(false);
                    } else if (formRole === "credit" || formRole === "investasi") {
                      setFormRole("operational");
                      setFormIsLiquid(true);
                    }
                  }}
                  style={[
                    tw`flex-row items-center px-3 py-2 rounded-xl border`,
                    active
                      ? {
                          backgroundColor: `${colors.accent}20`,
                          borderColor: colors.accent,
                        }
                      : {
                          backgroundColor: SURFACE_COLOR,
                          borderColor: `${BORDER_COLOR}80`,
                        },
                  ]}
                >
                  <Ionicons
                    name={t.icon}
                    size={15}
                    color={active ? colors.accent : TEXT_SECONDARY}
                    style={tw`mr-1.5`}
                  />
                  <Text
                    style={[
                      tw`text-xs font-bold`,
                      { color: active ? colors.accent : TEXT_PRIMARY },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Saldo Awal (hanya saat buat baru) */}
          {!isEditMode && (
            <>
              <Text
                style={[
                  tw`text-[11px] font-bold uppercase mb-1.5`,
                  { color: TEXT_SECONDARY },
                ]}
              >
                Saldo Awal Saat Ini
              </Text>
              <TextInput
                value={formInitialBalance}
                onChangeText={setFormInitialBalance}
                placeholder="0 (atau minus jika paylater/hutang)"
                placeholderTextColor={TEXT_SECONDARY}
                keyboardType="numeric"
                style={[
                  tw`border rounded-xl px-3.5 py-3 text-sm mb-4 font-semibold`,
                  {
                    color: TEXT_PRIMARY,
                    borderColor: `${BORDER_COLOR}80`,
                    backgroundColor: SURFACE_COLOR,
                  },
                ]}
              />
            </>
          )}

          {/* Peruntukan / Pos Dana */}
          <Text
            style={[
              tw`text-[11px] font-bold uppercase mb-1.5`,
              { color: TEXT_SECONDARY },
            ]}
          >
            Fungsi / Pos Dana
          </Text>
          <View style={tw`flex-row flex-wrap gap-2 mb-2`}>
            {[
              { id: "operational", label: "Operasional (Harian)" },
              { id: "savings", label: "Tabungan / Darurat" },
              { id: "credit", label: "Paylater / Hutang" },
              { id: "investasi", label: "Investasi" },
              { id: "belanja", label: "Belanja / Hiburan" },
              { id: "custom", label: "Kustom Lainnya" },
            ].map((r) => {
              const active =
                r.id === "custom"
                  ? Boolean(formCustomRole)
                  : formRole === r.id && !formCustomRole;
              return (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => {
                    if (r.id === "custom") {
                      setFormCustomRole(" ");
                    } else {
                      setFormCustomRole("");
                      setFormRole(r.id as WalletRole);
                      setFormIsLiquid(r.id === "operational" || r.id === "belanja");
                    }
                  }}
                  style={[
                    tw`px-3 py-1.5 rounded-xl border`,
                    active
                      ? {
                          backgroundColor: `${colors.accent}20`,
                          borderColor: colors.accent,
                        }
                      : {
                          backgroundColor: SURFACE_COLOR,
                          borderColor: `${BORDER_COLOR}80`,
                        },
                  ]}
                >
                  <Text
                    style={[
                      tw`text-xs font-bold`,
                      { color: active ? colors.accent : TEXT_PRIMARY },
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Input Pos Dana Kustom */}
          {Boolean(formCustomRole) && (
            <TextInput
              value={formCustomRole === " " ? "" : formCustomRole}
              onChangeText={(text) => setFormCustomRole(text || " ")}
              placeholder="Tulis nama pos dana kustom..."
              placeholderTextColor={TEXT_SECONDARY}
              style={[
                tw`border rounded-xl px-3.5 py-2.5 text-xs mb-3 font-semibold`,
                {
                  color: TEXT_PRIMARY,
                  borderColor: `${colors.accent}80`,
                  backgroundColor: SURFACE_COLOR,
                },
              ]}
            />
          )}

          {/* Toggle Likuiditas */}
          <TouchableOpacity
            onPress={() => setFormIsLiquid(!formIsLiquid)}
            activeOpacity={0.7}
            style={[
              tw`flex-row items-center justify-between p-3.5 rounded-xl border mb-4`,
              {
                backgroundColor: SURFACE_COLOR,
                borderColor: `${BORDER_COLOR}80`,
              },
            ]}
          >
            <View style={tw`flex-1 pr-3`}>
              <Text style={[tw`text-xs font-bold`, { color: TEXT_PRIMARY }]}>
                Aset Likuid (Dana Siap Pakai)
              </Text>
              <Text
                style={[
                  tw`text-[10px] mt-0.5 leading-tight`,
                  { color: TEXT_SECONDARY },
                ]}
              >
                Aktifkan jika dana di rekening ini mudah dicairkan untuk kebutuhan harian.
              </Text>
            </View>
            <View
              style={[
                tw`w-6 h-6 rounded-md items-center justify-center border`,
                formIsLiquid
                  ? {
                      backgroundColor: colors.accent,
                      borderColor: colors.accent,
                    }
                  : {
                      backgroundColor: "transparent",
                      borderColor: TEXT_SECONDARY,
                    },
              ]}
            >
              {formIsLiquid && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>

          {/* Nomor Rekening (Opsional) */}
          <Text
            style={[
              tw`text-[11px] font-bold uppercase mb-1.5`,
              { color: TEXT_SECONDARY },
            ]}
          >
            Nomor Rekening / Kartu (Opsional)
          </Text>
          <TextInput
            value={formAccountNumber}
            onChangeText={setFormAccountNumber}
            placeholder="Misal: 4892 (hanya untuk pengingat)"
            placeholderTextColor={TEXT_SECONDARY}
            maxLength={25}
            style={[
              tw`border rounded-xl px-3.5 py-3 text-sm mb-4 font-semibold`,
              {
                color: TEXT_PRIMARY,
                borderColor: `${BORDER_COLOR}80`,
                backgroundColor: SURFACE_COLOR,
              },
            ]}
          />

          {/* Pilihan Warna Kartu */}
          <Text
            style={[
              tw`text-[11px] font-bold uppercase mb-2`,
              { color: TEXT_SECONDARY },
            ]}
          >
            Warna Kartu Rekening
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`flex-row gap-3 mb-6`}
          >
            {WALLET_COLOR_PALETTES.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => setFormColor(c.id)}
                style={[
                  tw`w-10 h-10 rounded-full items-center justify-center border-2`,
                  { backgroundColor: c.id },
                  formColor === c.id
                    ? { borderColor: "#FFFFFF" }
                    : { borderColor: "transparent" },
                ]}
              >
                {formColor === c.id && (
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Tombol Simpan & Batal */}
          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
              style={[
                tw`flex-1 py-3.5 rounded-xl items-center border`,
                {
                  backgroundColor: SURFACE_COLOR,
                  borderColor: `${BORDER_COLOR}80`,
                },
              ]}
            >
              <Text style={[tw`text-xs font-bold`, { color: TEXT_SECONDARY }]}>
                Batal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
              style={[
                tw`flex-2 py-3.5 rounded-xl items-center shadow-sm`,
                { backgroundColor: colors.accent },
              ]}
            >
              <Text style={tw`text-white text-xs font-black`}>
                {loading
                  ? "Menyimpan..."
                  : isEditMode
                  ? "Simpan Perubahan"
                  : "Buat Rekening"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddWalletScreen;
