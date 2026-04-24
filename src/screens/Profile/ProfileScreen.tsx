// File: src/screens/Profile/ProfileScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAppContext } from "../../context/AppContext";
import { Colors } from "../../theme/theme";
import { formatCurrency } from "../../utils/calculations";

type SafeIconName = keyof typeof Ionicons.glyphMap;

// ─── Theme colors (konsisten dengan seluruh app) ──────────────────────────────
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR    = Colors.surface;
const TEXT_PRIMARY     = Colors.textPrimary;
const TEXT_SECONDARY   = Colors.textSecondary;
const ACCENT_COLOR     = Colors.accent;
const SUCCESS_COLOR    = Colors.success;
const WARNING_COLOR    = Colors.warning;
const ERROR_COLOR      = Colors.error;
const INFO_COLOR       = Colors.info;
const PURPLE_COLOR     = Colors.purple || "#8B5CF6";

// ─── Design tokens (konsisten dengan seluruh app) ─────────────────────────────
const CARD_RADIUS  = 20;
const INNER_RADIUS = 14;
const CARD_PAD     = 20;
const CARD_BORDER  = "rgba(255,255,255,0.06)";

// ─── Komponen UI (konsisten) ──────────────────────────────────────────────────

const SectionHeader = ({
  title,
}: {
  title: string;
}) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 14,
    }}
  >
    <View
      style={{
        width: 3,
        height: 13,
        backgroundColor: ACCENT_COLOR,
        borderRadius: 2,
        marginRight: 8,
      }}
    />
    <Text
      style={{
        color: Colors.gray400,
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.2,
        textTransform: "uppercase",
      }}
    >
      {title}
    </Text>
  </View>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: SafeIconName;
}) => (
  <View
    style={{
      flex: 1,
      backgroundColor: SURFACE_COLOR,
      borderRadius: CARD_RADIUS,
      borderWidth: 1,
      borderColor: CARD_BORDER,
      padding: 16,
      alignItems: "center",
    }}
  >
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: `${color}15`,
        marginBottom: 10,
      }}
    >
      <Ionicons name={icon} size={17} color={color} />
    </View>
    <Text
      style={{
        color: color,
        fontSize: 20,
        fontWeight: "800",
        marginBottom: 4,
      }}
    >
      {value}
    </Text>
    <Text
      style={{
        color: Colors.gray400,
        fontSize: 9,
        fontWeight: "600",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        textAlign: "center",
      }}
    >
      {label}
    </Text>
  </View>
);

const MenuRow = ({
  icon,
  iconColor,
  label,
  subtitle,
  onPress,
  isDestructive,
  disabled,
}: {
  icon: SafeIconName;
  iconColor: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  isDestructive?: boolean;
  disabled?: boolean;
}) => (
  <TouchableOpacity
    style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDestructive ? `${ERROR_COLOR}08` : SURFACE_COLOR,
      borderRadius: INNER_RADIUS,
      borderWidth: 1,
      borderColor: isDestructive ? `${ERROR_COLOR}20` : CARD_BORDER,
      padding: 16,
      marginBottom: 10,
    }}
    onPress={onPress}
    activeOpacity={0.7}
    disabled={disabled}
  >
    <View
      style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: `${iconColor}15`,
        marginRight: 14,
      }}
    >
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <View style={{ flex: 1 }}>
      <Text
        style={{
          color: isDestructive ? ERROR_COLOR : TEXT_PRIMARY,
          fontSize: 13,
          fontWeight: "600",
          marginBottom: subtitle ? 2 : 0,
        }}
      >
        {label}
      </Text>
      {subtitle && (
        <Text style={{ color: Colors.gray400, fontSize: 11 }}>
          {subtitle}
        </Text>
      )}
    </View>
    <Ionicons
      name="chevron-forward"
      size={16}
      color={isDestructive ? ERROR_COLOR : Colors.gray500}
    />
  </TouchableOpacity>
);

// ─── Main component ───────────────────────────────────────────────────────────

const ProfileScreen: React.FC = () => {
  const { state, clearAllData, debugStorage, isLoading } = useAppContext();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={ACCENT_COLOR}
            colors={[ACCENT_COLOR]}
          />
        }
      >
        {/* ── Page header ─────────────────────────────────────────────── */}
        <View style={{ paddingTop: 16, paddingBottom: 20 }}>
          <Text style={{ color: TEXT_PRIMARY, fontSize: 20, fontWeight: "700" }}>
            Profil
          </Text>
          <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 3 }}>
            Ringkasan dan pengaturan aplikasi
          </Text>
        </View>

        {/* ── Avatar + app info card ────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: SURFACE_COLOR,
            borderRadius: CARD_RADIUS,
            borderWidth: 1,
            borderColor: CARD_BORDER,
            padding: CARD_PAD,
            marginBottom: 20,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {/* Avatar */}
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: `${ACCENT_COLOR}15`,
              borderWidth: 1,
              borderColor: `${ACCENT_COLOR}30`,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
            }}
          >
            <Ionicons name="person" size={28} color={ACCENT_COLOR} />
          </View>

          {/* Info */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: "800", marginBottom: 2 }}>
              MyMoney
            </Text>
            <Text style={{ color: Colors.gray400, fontSize: 11, marginBottom: 8 }}>
              Manajemen Keuangan Pribadi
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 20,
                  backgroundColor: `${ACCENT_COLOR}15`,
                  borderWidth: 1,
                  borderColor: `${ACCENT_COLOR}25`,
                }}
              >
                <Text style={{ color: ACCENT_COLOR, fontSize: 9, fontWeight: "700" }}>
                  v1.0.0
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 20,
                  backgroundColor: `${SUCCESS_COLOR}15`,
                  borderWidth: 1,
                  borderColor: `${SUCCESS_COLOR}25`,
                }}
              >
                <Text style={{ color: SUCCESS_COLOR, fontSize: 9, fontWeight: "700" }}>
                  Offline Mode
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Ringkasan keuangan ────────────────────────────────────────── */}
        <SectionHeader title="Ringkasan Keuangan" />
        <View
          style={{
            backgroundColor: SURFACE_COLOR,
            borderRadius: CARD_RADIUS,
            borderWidth: 1,
            borderColor: CARD_BORDER,
            padding: CARD_PAD,
            marginBottom: 20,
          }}
        >
          {/* Net balance besar */}
          <Text
            style={{
              color: Colors.gray400,
              fontSize: 10,
              fontWeight: "700",
              letterSpacing: 1.2,
              textTransform: "uppercase",
              marginBottom: 5,
            }}
          >
            Saldo Bersih
          </Text>
          <Text
            style={{
              color: (state.balance || 0) >= 0 ? SUCCESS_COLOR : ERROR_COLOR,
              fontSize: 30,
              fontWeight: "800",
              letterSpacing: -0.5,
              marginBottom: 16,
            }}
          >
            {formatCurrency(state.balance || 0)}
          </Text>

          {/* Income / Expense */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <View
                  style={{
                    width: 6, height: 6, borderRadius: 3,
                    backgroundColor: SUCCESS_COLOR, marginRight: 5,
                  }}
                />
                <Text style={{ color: Colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Pemasukan
                </Text>
              </View>
              <Text style={{ color: SUCCESS_COLOR, fontSize: 14, fontWeight: "700" }}>
                {formatCurrency(state.totalIncome || 0)}
              </Text>
            </View>

            <View style={{ width: 1, height: 32, backgroundColor: CARD_BORDER, marginHorizontal: 14 }} />

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <View
                  style={{
                    width: 6, height: 6, borderRadius: 3,
                    backgroundColor: ERROR_COLOR, marginRight: 5,
                  }}
                />
                <Text style={{ color: Colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Pengeluaran
                </Text>
              </View>
              <Text style={{ color: ERROR_COLOR, fontSize: 14, fontWeight: "700" }}>
                {formatCurrency(state.totalExpense || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Informasi aplikasi ────────────────────────────────────────── */}
        <SectionHeader title="Informasi" />
        <View
          style={{
            backgroundColor: SURFACE_COLOR,
            borderRadius: CARD_RADIUS,
            borderWidth: 1,
            borderColor: CARD_BORDER,
            padding: CARD_PAD,
            marginBottom: 20,
          }}
        >
          {[
            {
              icon: "server-outline" as SafeIconName,
              color: ACCENT_COLOR,
              label: "Penyimpanan",
              value: "Lokal di perangkat",
            },
            {
              icon: "wifi-outline" as SafeIconName,
              color: SUCCESS_COLOR,
              label: "Koneksi",
              value: "Tidak perlu internet",
            },
            {
              icon: "shield-checkmark-outline" as SafeIconName,
              color: PURPLE_COLOR,
              label: "Privasi",
              value: "Data tidak dikirim keluar",
            },
            {
              icon: "refresh-outline" as SafeIconName,
              color: INFO_COLOR,
              label: "Update",
              value: "Perbarui untuk fitur baru",
            },
          ].map((item, idx, arr) => (
            <View key={item.label}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: `${item.color}15`,
                    marginRight: 12,
                  }}
                >
                  <Ionicons name={item.icon} size={15} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.gray400, fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
                    {item.label}
                  </Text>
                  <Text style={{ color: TEXT_SECONDARY, fontSize: 12, fontWeight: "500" }}>
                    {item.value}
                  </Text>
                </View>
              </View>
              {idx < arr.length - 1 && (
                <View style={{ height: 1, backgroundColor: CARD_BORDER }} />
              )}
            </View>
          ))}
        </View>

        {/* ── Pengaturan sistem ─────────────────────────────────────────── */}
        <SectionHeader title="Pengaturan Sistem" />

        <MenuRow
          icon="bug-outline"
          iconColor={SUCCESS_COLOR}
          label="Cek Storage"
          subtitle="Verifikasi integritas data"
          onPress={debugStorage}
          disabled={isLoading}
        />

        <MenuRow
          icon="trash-outline"
          iconColor={ERROR_COLOR}
          label="Hapus Semua Data"
          subtitle="Reset aplikasi ke kondisi awal"
          isDestructive
          onPress={() => {
            Alert.alert(
              "Hapus Semua Data",
              "Apakah Anda yakin ingin menghapus SEMUA data?\n\nSemua transaksi, anggaran, tabungan, dan catatan akan dihapus permanen.",
              [
                { text: "Batalkan", style: "cancel" },
                {
                  text: "Hapus Semua",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await clearAllData();
                      Alert.alert("✅ Berhasil", "Semua data telah dihapus");
                    } catch {
                      Alert.alert("Error", "Gagal menghapus data");
                    }
                  },
                },
              ]
            );
          }}
          disabled={isLoading}
        />

        {/* ── App footer ────────────────────────────────────────────────── */}
        <View
          style={{
            alignItems: "center",
            marginTop: 16,
            paddingVertical: 20,
            backgroundColor: SURFACE_COLOR,
            borderRadius: CARD_RADIUS,
            borderWidth: 1,
            borderColor: CARD_BORDER,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: `${ACCENT_COLOR}15`,
              borderWidth: 1,
              borderColor: `${ACCENT_COLOR}25`,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
            }}
          >
            <Ionicons name="cash-outline" size={22} color={ACCENT_COLOR} />
          </View>
          <Text style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: "700", marginBottom: 4 }}>
            MyMoney
          </Text>
          <Text style={{ color: Colors.gray400, fontSize: 11, marginBottom: 2 }}>
            Versi 1.0.0
          </Text>
          <Text style={{ color: Colors.gray500, fontSize: 10 }}>
            © Lexanova 2026
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
