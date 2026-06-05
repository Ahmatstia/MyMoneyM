// File: src/screens/Debt/DebtScreen.tsx — redesigned
//
// Perubahan utama vs versi lama:
//  1. Due date sekarang ditampilkan — dihitung & dirender sebagai pill (was: dihitung tapi invisible)
//  2. Status badge menggunakan STATUS_LABEL teks (was: hanya lewat warna)
//  3. isOverdue dipakai untuk card background + border (was: diabaikan)
//  4. Hero number = "Sisa Tagihan" bukan "Terbayar" (lebih relevan buat user)
//  5. Progress bar 6px + persentase terbayar
//  6. Hapus borderLeftWidth: 3 → gantinya subtle background tint per status
//  7. Summary card: tambah overdue badge + active count per kategori
//  8. Paid card: tampilan khusus (background hijau lembut, no Bayar button)
//  9. ProgressBar jadi komponen bersama dengan prop `height`

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useAppContext } from "../../context/AppContext";
import { Debt } from "../../types";
import { Colors } from "../../theme/theme";
import { formatCurrency, safeNumber } from "../../utils/calculations";

type SafeIconName = keyof typeof Ionicons.glyphMap;

// ─── Theme colors ─────────────────────────────────────────────────────────────
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR    = Colors.surface;
const TEXT_PRIMARY     = Colors.textPrimary;
const TEXT_SECONDARY   = Colors.textSecondary;
const ACCENT_COLOR     = Colors.accent;
const SUCCESS_COLOR    = Colors.success;
const WARNING_COLOR    = Colors.warning;
const ERROR_COLOR      = Colors.error;

// ─── Design tokens ─────────────────────────────────────────────────────────────
const CARD_RADIUS  = 20;
const INNER_RADIUS = 14;
const CARD_PAD     = 20;
const CARD_BORDER  = "rgba(255,255,255,0.06)";

// ─── Status maps ──────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<Debt["status"], string> = {
  active:  ERROR_COLOR,
  partial: WARNING_COLOR,
  paid:    SUCCESS_COLOR,
};
const STATUS_LABEL: Record<Debt["status"], string> = {
  active:  "Belum Bayar",
  partial: "Cicilan",
  paid:    "Lunas ✓",
};

// ─── Shared components ────────────────────────────────────────────────────────

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

/** Progress bar — terima height agar bisa dipakai di summary (4px) & debt card (6px) */
const ProgressBar = ({
  progress,
  color,
  height = 5,
}: {
  progress: number; // 0 – 1
  color: string;
  height?: number;
}) => (
  <View
    style={{
      height,
      backgroundColor: "rgba(255,255,255,0.07)",
      borderRadius: height,
      overflow: "hidden",
    }}
  >
    <View
      style={{
        height,
        borderRadius: height,
        width: `${Math.max(0, Math.min(progress * 100, 100))}%`,
        backgroundColor: color,
      }}
    />
  </View>
);

// ─── Main component ───────────────────────────────────────────────────────────

const DebtScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state, deleteDebt, payDebt } = useAppContext();

  const [activeTab, setActiveTab] = useState<"borrowed" | "lent">("borrowed");
  const [payModal, setPayModal]   = useState<{ visible: boolean; debt: Debt | null }>({
    visible: false,
    debt: null,
  });
  const [payAmount, setPayAmount] = useState("");
  const [fabScaleAnim]            = useState(new Animated.Value(1));

  const fabPressIn  = () =>
    Animated.spring(fabScaleAnim, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start();
  const fabPressOut = () =>
    Animated.spring(fabScaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  const allDebts = state.debts || [];

  const debts = useMemo(
    () => allDebts.filter((d) => d.type === activeTab),
    [allDebts, activeTab]
  );

  const totalBorrowed = useMemo(
    () =>
      allDebts
        .filter((d) => d.type === "borrowed" && d.status !== "paid")
        .reduce((s, d) => s + safeNumber(d.remaining), 0),
    [allDebts]
  );

  const totalLent = useMemo(
    () =>
      allDebts
        .filter((d) => d.type === "lent" && d.status !== "paid")
        .reduce((s, d) => s + safeNumber(d.remaining), 0),
    [allDebts]
  );

  const net = totalLent - totalBorrowed;

  // ── Hitung overdue count untuk warning badge di summary card ──────────────
  const overdueCount = useMemo(
    () =>
      allDebts.filter((d) => {
        if (d.status === "paid" || !d.dueDate) return false;
        const due   = new Date(d.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return due.getTime() < today.getTime();
      }).length,
    [allDebts]
  );

  const borrowedActiveCount = allDebts.filter(
    (d) => d.type === "borrowed" && d.status !== "paid"
  ).length;
  const lentActiveCount = allDebts.filter(
    (d) => d.type === "lent" && d.status !== "paid"
  ).length;

  const handleDelete = (debt: Debt) => {
    Alert.alert(
      "Hapus Data",
      `Yakin ingin menghapus catatan "${debt.name}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => deleteDebt(debt.id),
        },
      ]
    );
  };

  const handlePay = async () => {
    if (!payModal.debt) return;
    const amount = parseFloat(payAmount.replace(/\D/g, ""));
    if (!amount || amount <= 0) {
      Alert.alert("Error", "Masukkan nominal yang valid");
      return;
    }
    if (amount > payModal.debt.remaining) {
      Alert.alert("Error", "Nominal melebihi sisa tagihan");
      return;
    }
    await payDebt(payModal.debt.id, amount);
    setPayModal({ visible: false, debt: null });
    setPayAmount("");
  };

  const getDaysUntilDue = (dueDate?: string): number | null => {
    if (!dueDate) return null;
    const due   = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
      >
        {/* ── Page header ───────────────────────────────────────────────── */}
        <View style={{ paddingTop: 16, paddingBottom: 20 }}>
          <Text style={{ color: TEXT_PRIMARY, fontSize: 20, fontWeight: "700" }}>
            Hutang & Piutang
          </Text>
          <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 3 }}>
            Kelola beban dan pinjaman uang Anda
          </Text>
        </View>

        {/* ══════════════════════════════════════════
            SUMMARY HERO CARD (REDESIGNED)
            Tambahan: overdue badge, active count per kategori,
            label kontekstual di bawah ratio bar
        ══════════════════════════════════════════ */}
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
          {/* Label + overdue warning badge */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                color: Colors.gray400,
                fontSize: 9,
                fontWeight: "700",
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              Posisi Bersih
            </Text>
            {overdueCount > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                  borderRadius: 7,
                  backgroundColor: `${ERROR_COLOR}16`,
                  borderWidth: 1,
                  borderColor: `${ERROR_COLOR}28`,
                }}
              >
                <Ionicons
                  name="warning-outline"
                  size={10}
                  color={ERROR_COLOR}
                  style={{ marginRight: 4 }}
                />
                <Text style={{ color: ERROR_COLOR, fontSize: 9, fontWeight: "700" }}>
                  {overdueCount} terlambat
                </Text>
              </View>
            )}
          </View>

          {/* Net amount */}
          <Text
            style={{
              color: net >= 0 ? SUCCESS_COLOR : ERROR_COLOR,
              fontSize: 28,
              fontWeight: "800",
              letterSpacing: -0.5,
              marginBottom: 16,
            }}
          >
            {formatCurrency(net)}
          </Text>

          {/* Hutang / Piutang row */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            {/* Hutang */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: ERROR_COLOR,
                    marginRight: 5,
                  }}
                />
                <Text
                  style={{
                    color: Colors.gray400,
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  Hutang Saya
                </Text>
              </View>
              <Text style={{ color: ERROR_COLOR, fontSize: 16, fontWeight: "700" }}>
                {formatCurrency(totalBorrowed)}
              </Text>
              <Text style={{ color: Colors.gray400, fontSize: 10, marginTop: 2 }}>
                {borrowedActiveCount} catatan aktif
              </Text>
            </View>

            <View
              style={{
                width: 1,
                height: 44,
                backgroundColor: CARD_BORDER,
                marginHorizontal: 14,
              }}
            />

            {/* Piutang */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: SUCCESS_COLOR,
                    marginRight: 5,
                  }}
                />
                <Text
                  style={{
                    color: Colors.gray400,
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  Piutang
                </Text>
              </View>
              <Text style={{ color: SUCCESS_COLOR, fontSize: 16, fontWeight: "700" }}>
                {formatCurrency(totalLent)}
              </Text>
              <Text style={{ color: Colors.gray400, fontSize: 10, marginTop: 2 }}>
                {lentActiveCount} catatan aktif
              </Text>
            </View>
          </View>

          {/* Ratio bar */}
          <ProgressBar
            progress={
              totalBorrowed + totalLent > 0
                ? totalLent / (totalBorrowed + totalLent)
                : 0.5
            }
            color={net >= 0 ? SUCCESS_COLOR : ERROR_COLOR}
            height={4}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 6,
            }}
          >
            <Text style={{ color: Colors.gray400, fontSize: 10 }}>
              {allDebts.filter((d) => d.status !== "paid").length} aktif
            </Text>
            <Text style={{ color: Colors.gray400, fontSize: 10 }}>
              {net >= 0 ? "Piutang lebih besar" : "Hutang lebih besar"}
            </Text>
          </View>
        </View>

        {/* ══════════════════════════════════════════
            TAB — segmented control
        ══════════════════════════════════════════ */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: SURFACE_COLOR,
            borderRadius: 13,
            padding: 3,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: CARD_BORDER,
          }}
        >
          {(["borrowed", "lent"] as const).map((tab) => {
            const isActive = activeTab === tab;
            const tabColor = tab === "borrowed" ? ERROR_COLOR : SUCCESS_COLOR;
            const count    = allDebts.filter((d) => d.type === tab).length;
            return (
              <TouchableOpacity
                key={tab}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isActive ? `${tabColor}20` : "transparent",
                  gap: 6,
                }}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: isActive ? "700" : "500",
                    color: isActive ? tabColor : Colors.gray400,
                  }}
                >
                  {tab === "borrowed" ? "Hutang Saya" : "Piutang"}
                </Text>
                {count > 0 && (
                  <View
                    style={{
                      backgroundColor: isActive
                        ? tabColor
                        : "rgba(255,255,255,0.08)",
                      paddingHorizontal: 5,
                      paddingVertical: 2,
                      borderRadius: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 9,
                        color: isActive ? BACKGROUND_COLOR : Colors.gray400,
                        fontWeight: "700",
                      }}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ══════════════════════════════════════════
            DEBT LIST
        ══════════════════════════════════════════ */}
        <SectionHeader
          title={activeTab === "borrowed" ? "Daftar Hutang" : "Daftar Piutang"}
        />

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {debts.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              paddingVertical: 48,
              backgroundColor: SURFACE_COLOR,
              borderRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: CARD_BORDER,
              paddingHorizontal: 24,
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
              <Ionicons
                name={
                  activeTab === "borrowed" ? "card-outline" : "people-outline"
                }
                size={26}
                color={Colors.gray400}
              />
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
              {activeTab === "borrowed"
                ? "Tidak ada hutang"
                : "Tidak ada piutang"}
            </Text>
            <Text
              style={{
                color: Colors.gray400,
                fontSize: 12,
                textAlign: "center",
                lineHeight: 18,
                marginBottom: 22,
              }}
            >
              {activeTab === "borrowed"
                ? "Bagus! Kamu tidak punya beban hutang saat ini."
                : "Belum ada piutang yang tercatat."}
            </Text>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 13, // ≥44dp touch target
                borderRadius: 13,
                backgroundColor: ACCENT_COLOR,
              }}
              onPress={() => navigation.navigate("AddDebt")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="add"
                size={16}
                color={BACKGROUND_COLOR}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color: BACKGROUND_COLOR,
                  fontSize: 13,
                  fontWeight: "700",
                }}
              >
                Catat {activeTab === "borrowed" ? "Hutang" : "Piutang"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── Debt cards (REDESIGNED) ───────────────────────────────── */
          <View>
            {debts.map((debt) => {
              const paidAmount  = safeNumber(debt.amount) - safeNumber(debt.remaining);
              const progress    = safeNumber(debt.amount) > 0
                ? paidAmount / safeNumber(debt.amount)
                : 0;
              const days        = getDaysUntilDue(debt.dueDate);
              const isOverdue   = days !== null && days < 0;
              const isDueSoon   = days !== null && days >= 0 && days <= 7;
              const isPaid      = debt.status === "paid";
              const statusColor = STATUS_COLOR[debt.status];

              // Due date label
              const dueDateColor =
                isOverdue ? ERROR_COLOR : isDueSoon ? WARNING_COLOR : Colors.gray400;
              const dueDateLabel =
                days === null
                  ? null
                  : isOverdue
                  ? `Terlambat ${Math.abs(days)} hari`
                  : days === 0
                  ? "Jatuh tempo hari ini"
                  : `${days} hari lagi`;

              // Card background & border tint berdasarkan status
              // Tidak ada lagi borderLeftWidth: 3 — gantinya subtle bg tint
              const cardBg =
                isPaid
                  ? `${SUCCESS_COLOR}07`
                  : isOverdue
                  ? `${ERROR_COLOR}09`
                  : SURFACE_COLOR;
              const cardBorderColor =
                isPaid
                  ? `${SUCCESS_COLOR}18`
                  : isOverdue
                  ? `${ERROR_COLOR}22`
                  : CARD_BORDER;

              return (
                <View
                  key={debt.id}
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: CARD_RADIUS,
                    borderWidth: 1,
                    borderColor: cardBorderColor,
                    padding: CARD_PAD,
                    marginBottom: 12,
                  }}
                >
                  {/* ── Row 1: Icon · Name · Category · Status badge ──── */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      marginBottom: 14,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 13,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: `${statusColor}15`,
                        marginRight: 12,
                        flexShrink: 0,
                      }}
                    >
                      <Ionicons
                        name={
                          debt.type === "borrowed"
                            ? "arrow-down-outline"
                            : "arrow-up-outline"
                        }
                        size={18}
                        color={statusColor}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: TEXT_PRIMARY,
                          fontSize: 14,
                          fontWeight: "700",
                          marginBottom: 2,
                        }}
                      >
                        {debt.name}
                      </Text>
                      <Text style={{ color: Colors.gray400, fontSize: 11 }}>
                        {debt.category}
                      </Text>
                    </View>

                    {/* Status badge — teks, bukan hanya warna */}
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor: `${statusColor}16`,
                        borderWidth: 1,
                        borderColor: `${statusColor}28`,
                        alignSelf: "flex-start",
                        flexShrink: 0,
                        marginLeft: 8,
                      }}
                    >
                      <Text
                        style={{ color: statusColor, fontSize: 9, fontWeight: "700" }}
                      >
                        {STATUS_LABEL[debt.status]}
                      </Text>
                    </View>
                  </View>

                  {/* ── Row 2: Sisa Tagihan (hero) · Due date pill ─────── */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-end",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          color: Colors.gray400,
                          fontSize: 9,
                          fontWeight: "700",
                          letterSpacing: 0.8,
                          textTransform: "uppercase",
                          marginBottom: 3,
                        }}
                      >
                        {isPaid ? "Dilunasi" : "Sisa Tagihan"}
                      </Text>
                      <Text
                        style={{
                          color: isPaid ? SUCCESS_COLOR : statusColor,
                          fontSize: 22,
                          fontWeight: "800",
                          letterSpacing: -0.3,
                        }}
                      >
                        {formatCurrency(
                          isPaid
                            ? safeNumber(debt.amount)
                            : safeNumber(debt.remaining)
                        )}
                      </Text>
                    </View>

                    {/* Due date pill — hanya untuk debt aktif */}
                    {!isPaid && dueDateLabel && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 8,
                          paddingVertical: 5,
                          borderRadius: 9,
                          backgroundColor: isOverdue
                            ? `${ERROR_COLOR}18`
                            : isDueSoon
                            ? `${WARNING_COLOR}15`
                            : "rgba(255,255,255,0.05)",
                          borderWidth: 1,
                          borderColor: `${dueDateColor}22`,
                        }}
                      >
                        <Ionicons
                          name="time-outline"
                          size={10}
                          color={dueDateColor}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={{
                            color: dueDateColor,
                            fontSize: 10,
                            fontWeight: "600",
                          }}
                        >
                          {dueDateLabel}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* ── Row 3: Progress bar 6px + persentase ───────────── */}
                  <ProgressBar
                    progress={isPaid ? 1 : progress}
                    color={isPaid ? SUCCESS_COLOR : statusColor}
                    height={6}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 7,
                    }}
                  >
                    <Text style={{ color: Colors.gray400, fontSize: 10 }}>
                      Terbayar {formatCurrency(paidAmount)} dari{" "}
                      {formatCurrency(safeNumber(debt.amount))}
                    </Text>
                    <Text
                      style={{
                        color: isPaid ? SUCCESS_COLOR : statusColor,
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      {Math.round((isPaid ? 1 : progress) * 100)}%
                    </Text>
                  </View>

                  {/* ── Divider ─────────────────────────────────────────── */}
                  <View
                    style={{
                      height: 1,
                      backgroundColor: CARD_BORDER,
                      marginTop: 14,
                      marginBottom: 14,
                    }}
                  />

                  {/* ── Row 4: Actions ──────────────────────────────────── */}
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {isPaid ? (
                      // Paid state: tidak ada tombol Bayar, tampilkan keterangan
                      <View
                        style={{
                          flex: 1,
                          height: 40,
                          borderRadius: 12,
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "row",
                          backgroundColor: `${SUCCESS_COLOR}10`,
                          borderWidth: 1,
                          borderColor: `${SUCCESS_COLOR}20`,
                          gap: 6,
                        }}
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={14}
                          color={SUCCESS_COLOR}
                        />
                        <Text
                          style={{
                            color: SUCCESS_COLOR,
                            fontSize: 12,
                            fontWeight: "600",
                          }}
                        >
                          Semua tagihan lunas
                        </Text>
                      </View>
                    ) : (
                      // Active/partial: tombol Bayar Cicilan
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          height: 40,
                          borderRadius: 12,
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "row",
                          backgroundColor: `${ACCENT_COLOR}15`,
                          borderWidth: 1,
                          borderColor: `${ACCENT_COLOR}25`,
                          gap: 6,
                        }}
                        onPress={() => {
                          setPayModal({ visible: true, debt });
                          setPayAmount("");
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="cash-outline" size={14} color={ACCENT_COLOR} />
                        <Text
                          style={{
                            color: ACCENT_COLOR,
                            fontSize: 12,
                            fontWeight: "700",
                          }}
                        >
                          Bayar Cicilan
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Hapus button — selalu ada */}
                    <TouchableOpacity
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: `${ERROR_COLOR}14`,
                        borderWidth: 1,
                        borderColor: `${ERROR_COLOR}22`,
                      }}
                      onPress={() => handleDelete(debt)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color={ERROR_COLOR} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ══════════════════════════════════════════
          FAB
      ══════════════════════════════════════════ */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 24,
          right: 18,
          width: 52,
          height: 52,
          borderRadius: 16,
          backgroundColor: ACCENT_COLOR,
          shadowColor: ACCENT_COLOR,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 10,
          transform: [{ scale: fabScaleAnim }],
        }}
      >
        <TouchableOpacity
          style={{
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => navigation.navigate("AddDebt")}
          onPressIn={fabPressIn}
          onPressOut={fabPressOut}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={26} color={BACKGROUND_COLOR} />
        </TouchableOpacity>
      </Animated.View>

      {/* ══════════════════════════════════════════
          PAY MODAL
      ══════════════════════════════════════════ */}
      <Modal
        visible={payModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setPayModal({ visible: false, debt: null })}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
            backgroundColor: "rgba(2, 6, 23, 0.85)",
          }}
        >
          <View
            style={{
              width: "100%",
              backgroundColor: SURFACE_COLOR,
              borderRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: CARD_BORDER,
              padding: CARD_PAD,
            }}
          >
            {/* Modal header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 11,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: `${ACCENT_COLOR}15`,
                  marginRight: 12,
                }}
              >
                <Ionicons name="cash-outline" size={18} color={ACCENT_COLOR} />
              </View>
              <View>
                <Text
                  style={{ color: TEXT_PRIMARY, fontSize: 16, fontWeight: "800" }}
                >
                  Catat Pembayaran
                </Text>
                {payModal.debt && (
                  <Text
                    style={{ color: Colors.gray400, fontSize: 11, marginTop: 2 }}
                  >
                    {payModal.debt.name} · Sisa{" "}
                    {formatCurrency(payModal.debt.remaining)}
                  </Text>
                )}
              </View>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: CARD_BORDER,
                marginVertical: 16,
              }}
            />

            <Text
              style={{
                color: Colors.gray400,
                fontSize: 10,
                fontWeight: "700",
                letterSpacing: 1.2,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Nominal Bayar
            </Text>
            <TextInput
              value={payAmount}
              onChangeText={(t) => setPayAmount(t.replace(/\D/g, ""))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.gray500}
              autoFocus
              style={{
                backgroundColor: BACKGROUND_COLOR,
                borderRadius: INNER_RADIUS,
                padding: 16,
                color: TEXT_PRIMARY,
                fontSize: 24,
                fontWeight: "800",
                marginBottom: 20,
                borderWidth: 1,
                borderColor: CARD_BORDER,
              }}
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: INNER_RADIUS,
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderWidth: 1,
                  borderColor: CARD_BORDER,
                }}
                onPress={() => setPayModal({ visible: false, debt: null })}
              >
                <Text style={{ color: Colors.gray400, fontWeight: "600" }}>
                  Batal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: INNER_RADIUS,
                  alignItems: "center",
                  backgroundColor: ACCENT_COLOR,
                  shadowColor: ACCENT_COLOR,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
                onPress={handlePay}
              >
                <Text
                  style={{ color: BACKGROUND_COLOR, fontWeight: "800" }}
                >
                  Simpan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default DebtScreen;