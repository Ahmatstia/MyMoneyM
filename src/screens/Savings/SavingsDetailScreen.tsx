// File: src/screens/SavingsDetailScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useAppContext } from "../../context/AppContext";
import {
  formatCurrency,
  safeNumber,
  getSafePercentage,
} from "../../utils/calculations";
import { formatDate } from "../../utils/formatters";
import { Colors } from "../../theme/theme";

// ─── Theme colors (tidak diubah) ──────────────────────────────────────────────
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR    = Colors.surface;
const TEXT_PRIMARY     = Colors.textPrimary;
const TEXT_SECONDARY   = Colors.textSecondary;
const ACCENT_COLOR     = Colors.accent;
const SUCCESS_COLOR    = Colors.success;
const WARNING_COLOR    = Colors.warning;
const ERROR_COLOR      = Colors.error;

// ─── Design tokens (konsisten dengan seluruh app) ─────────────────────────────
const CARD_RADIUS  = 20;
const INNER_RADIUS = 14;
const CARD_PAD     = 20;
const CARD_BORDER  = "rgba(255,255,255,0.06)";

// ─── Komponen UI (konsisten) ──────────────────────────────────────────────────

const Spacer = ({ size = 20 }: { size?: number }) => (
  <View style={{ height: size }} />
);

const SectionHeader = ({
  title,
  linkLabel,
  onPress,
}: {
  title: string;
  linkLabel?: string;
  onPress?: () => void;
}) => (
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center" }}>
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
    {linkLabel && onPress && (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Text style={{ color: ACCENT_COLOR, fontSize: 11, fontWeight: "600" }}>
          {linkLabel}
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

const ThinBar = ({
  progress,
  color,
}: {
  progress: number;
  color: string;
}) => (
  <View
    style={{
      height: 6,
      backgroundColor: "rgba(255,255,255,0.07)",
      borderRadius: 6,
      overflow: "hidden",
    }}
  >
    <View
      style={{
        height: 6,
        borderRadius: 6,
        width: `${Math.max(0, Math.min(progress, 100))}%`,
        backgroundColor: color,
      }}
    />
  </View>
);

// ─── Main component ───────────────────────────────────────────────────────────

const SavingsDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { savingsId } = route.params;

  const { state, deleteSavings, refreshData, getSavingsTransactions } =
    useAppContext();
  const [refreshing, setRefreshing] = useState(false);

  // ── Semua logika di bawah ini TIDAK DIUBAH ────────────────────────────────

  const saving              = state.savings?.find((s) => s.id === savingsId);
  const savingsTransactions = getSavingsTransactions(savingsId);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Not found state
  if (!saving) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          backgroundColor: BACKGROUND_COLOR,
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 24,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${ERROR_COLOR}15`,
            marginBottom: 16,
          }}
        >
          <Ionicons name="warning-outline" size={32} color={ERROR_COLOR} />
        </View>
        <Text
          style={{
            color: TEXT_PRIMARY,
            fontSize: 16,
            fontWeight: "700",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Tabungan tidak ditemukan
        </Text>
        <TouchableOpacity
          style={{
            marginTop: 12,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 13,
            backgroundColor: ACCENT_COLOR,
          }}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={{ color: BACKGROUND_COLOR, fontWeight: "700", fontSize: 13 }}>
            Kembali
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const current     = safeNumber(saving.current);
  const target      = safeNumber(saving.target);
  const progress    = getSafePercentage(current, target);
  const remaining   = target - current;
  const isCompleted = current >= target;
  const activeColor = isCompleted ? SUCCESS_COLOR : ACCENT_COLOR;

  const stats = useMemo(() => {
    const deposits = savingsTransactions
      .filter((t) => t.type === "deposit" || t.type === "initial")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0);
    const withdrawals = savingsTransactions
      .filter((t) => t.type === "withdrawal")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0);
    const lastTransaction =
      savingsTransactions.length > 0
        ? savingsTransactions[savingsTransactions.length - 1]
        : null;
    return {
      deposits,
      withdrawals,
      transactionCount: savingsTransactions.length,
      lastTransactionDate: lastTransaction?.date,
    };
  }, [savingsTransactions]);

  const formatDeadlineInfo = () => {
    if (!saving.deadline)
      return { text: "Tanpa deadline", color: Colors.textTertiary };
    try {
      const deadlineDate = new Date(saving.deadline);
      const today        = new Date();
      const diffTime     = deadlineDate.getTime() - today.getTime();
      const diffDays     = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0)   return { text: "Terlambat",                              color: ERROR_COLOR };
      if (diffDays === 0) return { text: "Hari ini",                               color: ERROR_COLOR };
      if (diffDays <= 7)  return { text: `${diffDays} hari lagi`,                  color: WARNING_COLOR };
      if (diffDays <= 30) return { text: `${Math.floor(diffDays / 7)} minggu lagi`, color: Colors.info };
      return              { text: `${Math.floor(diffDays / 30)} bulan lagi`,       color: SUCCESS_COLOR };
    } catch {
      return { text: saving.deadline, color: Colors.textTertiary };
    }
  };

  const deadlineInfo = formatDeadlineInfo();

  const handleDelete = () => {
    Alert.alert(
      "Hapus Tabungan",
      `Hapus tabungan "${saving.name}"? Semua riwayat transaksi juga akan dihapus.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSavings(saving.id);
              navigation.goBack();
            } catch {
              Alert.alert("Error", "Gagal menghapus tabungan");
            }
          },
        },
      ]
    );
  };

  // ── Transaction item renderer ─────────────────────────────────────────────
  const renderTransactionItem = (transaction: any, index: number) => {
    const isDeposit =
      transaction.type === "deposit" || transaction.type === "initial";
    const txColor = isDeposit ? SUCCESS_COLOR : ERROR_COLOR;

    return (
      <View
        key={transaction.id}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 13,
          paddingHorizontal: 16,
          borderBottomWidth: index < savingsTransactions.slice(0, 10).length - 1 ? 1 : 0,
          borderBottomColor: CARD_BORDER,
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 13,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 13,
            flexShrink: 0,
            backgroundColor: `${txColor}15`,
          }}
        >
          <Ionicons
            name={isDeposit ? "arrow-down-outline" : "arrow-up-outline"}
            size={17}
            color={txColor}
          />
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: TEXT_PRIMARY,
              fontSize: 13,
              fontWeight: "500",
              marginBottom: 2,
            }}
          >
            {isDeposit ? "Setoran" : "Penarikan"}
          </Text>
          <Text style={{ color: Colors.gray400, fontSize: 11 }}>
            {formatDate(transaction.date)}
            {transaction.note ? ` · ${transaction.note}` : ""}
          </Text>
        </View>

        {/* Amount + balance */}
        <View style={{ alignItems: "flex-end", marginLeft: 8 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: txColor,
              marginBottom: 2,
            }}
          >
            {isDeposit ? "+" : "−"}{formatCurrency(transaction.amount)}
          </Text>
          <Text style={{ color: Colors.gray400, fontSize: 10 }}>
            {formatCurrency(transaction.newBalance)}
          </Text>
        </View>
      </View>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[ACCENT_COLOR]}
            tintColor={ACCENT_COLOR}
          />
        }
      >
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 16,
            paddingBottom: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TouchableOpacity
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${ACCENT_COLOR}15`,
              }}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color={ACCENT_COLOR} />
            </TouchableOpacity>
            <View>
              <Text
                style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: "700" }}
              >
                Detail Tabungan
              </Text>
              <Text style={{ color: Colors.gray400, fontSize: 10, marginTop: 1 }}>
                Informasi & riwayat tabungan
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${ACCENT_COLOR}12`,
                borderWidth: 1,
                borderColor: `${ACCENT_COLOR}20`,
              }}
              onPress={() =>
                navigation.navigate("AddSavings", {
                  editMode: true,
                  savingsData: saving,
                })
              }
              activeOpacity={0.7}
            >
              <Ionicons name="pencil-outline" size={16} color={ACCENT_COLOR} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${ERROR_COLOR}12`,
                borderWidth: 1,
                borderColor: `${ERROR_COLOR}20`,
              }}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color={ERROR_COLOR} />
            </TouchableOpacity>
          </View>
        </View>
        <Spacer size={18} />

        {/* ── Hero identity card ───────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: SURFACE_COLOR,
            borderRadius: CARD_RADIUS,
            borderWidth: 1,
            borderColor: CARD_BORDER,
            // Left accent stripe per completion status
            borderLeftWidth: 3,
            borderLeftColor: activeColor,
            padding: CARD_PAD,
            marginBottom: 16,
          }}
        >
          {/* Icon + name row */}
          <View
            style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${activeColor}18`,
                borderWidth: 1.5,
                borderColor: `${activeColor}30`,
                marginRight: 14,
              }}
            >
              <Ionicons
                name={(saving.icon as any) || "wallet-outline"}
                size={24}
                color={activeColor}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: TEXT_PRIMARY,
                  fontSize: 17,
                  fontWeight: "700",
                  marginBottom: 3,
                }}
              >
                {saving.name}
              </Text>
              {saving.description ? (
                <Text
                  style={{ color: Colors.gray400, fontSize: 12, lineHeight: 17 }}
                  numberOfLines={2}
                >
                  {saving.description}
                </Text>
              ) : null}
            </View>

            {/* Status badge */}
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 20,
                backgroundColor: `${activeColor}18`,
                borderWidth: 1,
                borderColor: `${activeColor}28`,
              }}
            >
              <Text style={{ color: activeColor, fontSize: 10, fontWeight: "700" }}>
                {isCompleted ? "Selesai ✓" : "Berlangsung"}
              </Text>
            </View>
          </View>

          {/* Progress percentage */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                color: Colors.gray400,
                fontSize: 10,
                fontWeight: "700",
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              Progress Tabungan
            </Text>
            <Text style={{ color: activeColor, fontSize: 15, fontWeight: "800" }}>
              {progress.toFixed(1)}%
            </Text>
          </View>

          {/* Progress bar 6px */}
          <ThinBar progress={progress} color={activeColor} />

          {/* Terkumpul / Target */}
          <View style={{ height: 1, backgroundColor: CARD_BORDER, marginTop: 14, marginBottom: 12 }} />
          
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* Terkumpul */}
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  color: Colors.gray400,
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 4,
                }}
              >
                Terkumpul
              </Text>
              <Text style={{ color: SUCCESS_COLOR, fontSize: 14, fontWeight: "700" }}>
                {formatCurrency(current)}
              </Text>
            </View>

            {/* Garis Pembatas Vertikal */}
            <View style={{ width: 1, height: 26, backgroundColor: CARD_BORDER }} />

            {/* Target */}
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  color: Colors.gray400,
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 4,
                }}
              >
                Target
              </Text>
              <Text style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: "700" }}>
                {formatCurrency(target)}
              </Text>
            </View>
          </View>

          {/* Garis Pembatas Horizontal */}
          <View style={{ height: 1, backgroundColor: CARD_BORDER, marginVertical: 12 }} />

          {/* Sisa */}
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                color: Colors.gray400,
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                marginBottom: 2,
              }}
            >
              Sisa Target
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: remaining <= 0 ? SUCCESS_COLOR : ERROR_COLOR,
              }}
            >
              {remaining <= 0 ? "Tercapai 🎉" : formatCurrency(remaining)}
            </Text>
          </View>

          {/* Deadline row */}
          <View
            style={{
              height: 1,
              backgroundColor: CARD_BORDER,
              marginVertical: 12,
            }}
          />
          <View
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="time-outline"
                size={13}
                color={deadlineInfo.color}
                style={{ marginRight: 6 }}
              />
              <Text style={{ color: deadlineInfo.color, fontSize: 12, fontWeight: "600" }}>
                {deadlineInfo.text}
              </Text>
            </View>
            {saving.deadline && (
              <Text style={{ color: Colors.gray400, fontSize: 11 }}>
                {new Date(saving.deadline).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            )}
          </View>
        </View>
 
         {/* ── Primary Actions ─────────────────────────────────────────── */}
         <View
           style={{
             flexDirection: "row",
             gap: 10,
             marginBottom: 20,
           }}
         >
           <TouchableOpacity
             style={{
               flex: 1,
               flexDirection: "row",
               alignItems: "center",
               justifyContent: "center",
               paddingVertical: 14,
               borderRadius: INNER_RADIUS,
               backgroundColor: SUCCESS_COLOR,
               shadowColor: SUCCESS_COLOR,
               shadowOffset: { width: 0, height: 4 },
               shadowOpacity: 0.2,
               shadowRadius: 8,
               elevation: 4,
             }}
             onPress={() =>
               navigation.navigate("AddSavingsTransaction", {
                 savingsId: saving.id,
                 type: "deposit",
               })
             }
             activeOpacity={0.8}
           >
             <Ionicons
               name="add-circle"
               size={20}
               color={BACKGROUND_COLOR}
               style={{ marginRight: 8 }}
             />
             <Text
               style={{ color: BACKGROUND_COLOR, fontSize: 14, fontWeight: "700" }}
             >
               Tambah Setoran
             </Text>
           </TouchableOpacity>
 
           <TouchableOpacity
             style={{
               width: 52,
               alignItems: "center",
               justifyContent: "center",
               borderRadius: INNER_RADIUS,
               backgroundColor: `${ERROR_COLOR}15`,
               borderWidth: 1,
               borderColor: `${ERROR_COLOR}25`,
             }}
             onPress={() =>
               navigation.navigate("AddSavingsTransaction", {
                 savingsId: saving.id,
                 type: "withdrawal",
               })
             }
             activeOpacity={0.7}
           >
             <Ionicons name="arrow-up" size={20} color={ERROR_COLOR} />
           </TouchableOpacity>
         </View>

        {/* ── Stats row ────────────────────────────────────────────────── */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
          {/* Setoran */}
          <View
            style={{
              flex: 1,
              backgroundColor: SURFACE_COLOR,
              borderRadius: INNER_RADIUS,
              borderWidth: 1,
              borderColor: CARD_BORDER,
              padding: 14,
            }}
          >
            <Text
              style={{
                color: Colors.gray600,
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                marginBottom: 4,
              }}
            >
              Setoran
            </Text>
            <Text style={{ color: SUCCESS_COLOR, fontSize: 13, fontWeight: "700" }}>
              {formatCurrency(stats.deposits)}
            </Text>
          </View>

          {/* Penarikan */}
          <View
            style={{
              flex: 1,
              backgroundColor: SURFACE_COLOR,
              borderRadius: INNER_RADIUS,
              borderWidth: 1,
              borderColor: CARD_BORDER,
              padding: 14,
            }}
          >
            <Text
              style={{
                color: Colors.gray400,
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                marginBottom: 4,
              }}
            >
              Penarikan
            </Text>
            <Text style={{ color: ERROR_COLOR, fontSize: 13, fontWeight: "700" }}>
              {formatCurrency(stats.withdrawals)}
            </Text>
          </View>

          {/* Transaksi */}
          <View
            style={{
              flex: 1,
              backgroundColor: SURFACE_COLOR,
              borderRadius: INNER_RADIUS,
              borderWidth: 1,
              borderColor: CARD_BORDER,
              padding: 14,
            }}
          >
            <Text
              style={{
                color: Colors.gray400,
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                marginBottom: 4,
              }}
            >
              Transaksi
            </Text>
            <Text style={{ color: ACCENT_COLOR, fontSize: 13, fontWeight: "700" }}>
              {stats.transactionCount}
            </Text>
          </View>
        </View>

        {/* ── Transaction history ──────────────────────────────────────── */}
        <SectionHeader
          title="Riwayat Transaksi"
          linkLabel={savingsTransactions.length > 0 ? "Lihat Semua" : undefined}
          onPress={() => navigation.navigate("SavingsHistory", { savingsId })}
        />

        {savingsTransactions.length === 0 ? (
          <View
            style={{
              backgroundColor: SURFACE_COLOR,
              borderRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: CARD_BORDER,
              paddingVertical: 40,
              paddingHorizontal: 24,
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${Colors.gray400}14`,
                marginBottom: 14,
              }}
            >
              <Ionicons name="receipt-outline" size={26} color={Colors.gray400} />
            </View>
            <Text
              style={{
                color: TEXT_PRIMARY,
                fontSize: 15,
                fontWeight: "700",
                marginBottom: 6,
                textAlign: "center",
              }}
            >
              Belum ada transaksi
            </Text>
            <Text
              style={{
                color: Colors.gray400,
                fontSize: 12,
              }}
            >
              Mulai dengan menambahkan setoran pertama
            </Text>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: SURFACE_COLOR,
              borderRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: CARD_BORDER,
              overflow: "hidden",
              marginBottom: 20,
            }}
          >
            {savingsTransactions
              .slice(0, 10)
              .map((transaction, index) =>
                renderTransactionItem(transaction, index)
              )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

export default SavingsDetailScreen;