// File: src/screens/SavingsHistoryScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppContext } from "../../context/AppContext";
import { formatCurrency, safeNumber } from "../../utils/calculations";
import { formatDate } from "../../utils/formatters";
import { Colors } from "../../theme/theme";

// ─── Theme colors (tidak diubah) ──────────────────────────────────────────────
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR    = Colors.surface;
const TEXT_PRIMARY     = Colors.textPrimary;
const TEXT_SECONDARY   = Colors.textSecondary;
const ACCENT_COLOR     = Colors.accent;
const SUCCESS_COLOR    = Colors.success;
const ERROR_COLOR      = Colors.error;

// ─── Design tokens (konsisten dengan seluruh app) ─────────────────────────────
const CARD_RADIUS  = 20;
const INNER_RADIUS = 14;
const CARD_PAD     = 20;
const CARD_BORDER  = "rgba(255,255,255,0.06)";

// ─── Komponen UI (konsisten) ──────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

const SavingsHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { savingsId } = route.params;

  const { state, refreshData, getSavingsTransactions } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]         = useState<"all" | "deposit" | "withdrawal">("all");

  // ── Semua logika di bawah ini TIDAK DIUBAH ────────────────────────────────

  const saving          = state.savings.find((s) => s.id === savingsId);
  const allTransactions = getSavingsTransactions(savingsId);

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
          <Text
            style={{ color: BACKGROUND_COLOR, fontWeight: "700", fontSize: 13 }}
          >
            Kembali
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      if (filter === "all")        return true;
      if (filter === "deposit")    return t.type === "deposit" || t.type === "initial";
      if (filter === "withdrawal") return t.type === "withdrawal";
      return true;
    });
  }, [allTransactions, filter]);

  const stats = useMemo(() => {
    let totalDeposits    = 0;
    let totalWithdrawals = 0;
    let depositCount     = 0;
    let withdrawalCount  = 0;
    allTransactions.forEach((t) => {
      if (t.type === "deposit" || t.type === "initial") {
        totalDeposits += safeNumber(t.amount);
        depositCount++;
      } else if (t.type === "withdrawal") {
        totalWithdrawals += safeNumber(t.amount);
        withdrawalCount++;
      }
    });
    return {
      totalDeposits,
      totalWithdrawals,
      depositCount,
      withdrawalCount,
      totalTransactions: allTransactions.length,
      netFlow: totalDeposits - totalWithdrawals,
    };
  }, [allTransactions]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredTransactions.forEach((transaction) => {
      const dateKey = transaction.date;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(transaction);
    });
    return Object.entries(groups)
      .sort(
        ([dateA], [dateB]) =>
          new Date(dateB).getTime() - new Date(dateA).getTime()
      )
      .map(([date, transactions]) => ({
        date,
        formattedDate: formatDate(date),
        transactions: transactions.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      }));
  }, [filteredTransactions]);

  // ── Transaction item renderer ─────────────────────────────────────────────
  const renderTransactionItem = (
    transaction: any,
    index: number,
    groupLength: number
  ) => {
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
          borderBottomWidth: index < groupLength - 1 ? 1 : 0,
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
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 16,
          paddingBottom: 100,
        }}
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
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <TouchableOpacity
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${ACCENT_COLOR}15`,
              marginRight: 12,
            }}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={ACCENT_COLOR} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: "700" }}
            >
              Riwayat Transaksi
            </Text>
            <Text style={{ color: Colors.gray400, fontSize: 10, marginTop: 1 }}>
              {saving.name}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View
          style={{
            backgroundColor: SURFACE_COLOR,
            borderRadius: CARD_RADIUS,
            borderWidth: 1,
            borderColor: CARD_BORDER,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <View style={{ flex: 1, alignItems: "center" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
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
                Setoran
              </Text>
            </View>
            <Text
              style={{ color: SUCCESS_COLOR, fontSize: 14, fontWeight: "700" }}
            >
              {formatCurrency(stats.totalDeposits)}
            </Text>
          </View>

          <View
            style={{ width: 1, height: 32, backgroundColor: CARD_BORDER }}
          />

          <View style={{ flex: 1, alignItems: "center" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
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
                Penarikan
              </Text>
            </View>
            <Text
              style={{ color: ERROR_COLOR, fontSize: 14, fontWeight: "700" }}
            >
              {formatCurrency(stats.totalWithdrawals)}
            </Text>
          </View>

          <View
            style={{ width: 1, height: 32, backgroundColor: CARD_BORDER }}
          />

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
              Total
            </Text>
            <Text
              style={{ color: ACCENT_COLOR, fontSize: 14, fontWeight: "700" }}
            >
              {stats.totalTransactions}
            </Text>
          </View>
        </View>

        {/* Filter — segmented control */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: SURFACE_COLOR,
            borderRadius: 13,
            padding: 3,
            borderWidth: 1,
            borderColor: CARD_BORDER,
            marginBottom: 24,
          }}
        >
          {[
            {
              key: "all",
              label: "Semua",
              count: allTransactions.length,
            },
            { key: "deposit", label: "Setoran", count: stats.depositCount },
            {
              key: "withdrawal",
              label: "Penarikan",
              count: stats.withdrawalCount,
            },
          ].map((tab) => {
            const isActive = filter === tab.key;
            const tabColor =
              tab.key === "deposit"
                ? SUCCESS_COLOR
                : tab.key === "withdrawal"
                ? ERROR_COLOR
                : ACCENT_COLOR;
            return (
              <TouchableOpacity
                key={tab.key}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: isActive ? `${tabColor}20` : "transparent",
                }}
                onPress={() => setFilter(tab.key as any)}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: isActive ? "700" : "500",
                    color: isActive ? tabColor : Colors.gray400,
                  }}
                >
                  {tab.label}
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    color: isActive ? tabColor : Colors.gray400,
                    marginTop: 1,
                    fontWeight: isActive ? "700" : "400",
                  }}
                >
                  {tab.count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {groupedTransactions.length === 0 ? (
          /* Empty state */
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
              {filter === "all" ? "Belum ada transaksi" : "Tidak ada transaksi"}
            </Text>
            <Text
              style={{
                color: Colors.gray400,
                fontSize: 12,
                textAlign: "center",
                lineHeight: 18,
              }}
            >
              {filter === "all"
                ? "Mulai dengan menambahkan setoran pertama"
                : `Tidak ada transaksi dengan tipe "${filter === "deposit" ? "Setoran" : "Penarikan"}"`}
            </Text>
          </View>
        ) : (
          groupedTransactions.map((group) => {
            // Hitung subtotal per grup hari
            const dayDeposits = group.transactions
              .filter((t: any) => t.type === "deposit" || t.type === "initial")
              .reduce((s: number, t: any) => s + safeNumber(t.amount), 0);
            const dayWithdrawals = group.transactions
              .filter((t: any) => t.type === "withdrawal")
              .reduce((s: number, t: any) => s + safeNumber(t.amount), 0);
            const dayNet = dayDeposits - dayWithdrawals;

            return (
              <View key={group.date} style={{ marginBottom: 14 }}>
                {/* Day header */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                    paddingHorizontal: 2,
                  }}
                >
                  <Text
                    style={{
                      color: Colors.gray400,
                      fontSize: 11,
                      fontWeight: "700",
                      letterSpacing: 0.3,
                    }}
                  >
                    {group.formattedDate}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 9,
                      paddingVertical: 3,
                      borderRadius: 20,
                      backgroundColor:
                        dayNet >= 0
                          ? `${SUCCESS_COLOR}15`
                          : `${ERROR_COLOR}15`,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: dayNet >= 0 ? SUCCESS_COLOR : ERROR_COLOR,
                      }}
                    >
                      {dayNet >= 0 ? "+" : ""}
                      {formatCurrency(dayNet)}
                    </Text>
                  </View>
                </View>

                {/* Transaction group card */}
                <View
                  style={{
                    backgroundColor: SURFACE_COLOR,
                    borderRadius: CARD_RADIUS,
                    borderWidth: 1,
                    borderColor: CARD_BORDER,
                    overflow: "hidden",
                  }}
                >
                  {group.transactions.map((transaction: any, index: number) =>
                    renderTransactionItem(
                      transaction,
                      index,
                      group.transactions.length
                    )
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Bottom CTA bar ───────────────────────────────────────────────── */}
      <View
        style={{
          paddingHorizontal: 18,
          paddingVertical: 14,
          backgroundColor: BACKGROUND_COLOR,
          borderTopWidth: 1,
          borderTopColor: CARD_BORDER,
        }}
      >
        <TouchableOpacity
          style={{
            borderRadius: INNER_RADIUS,
            paddingVertical: 14,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            backgroundColor: ACCENT_COLOR,
            shadowColor: ACCENT_COLOR,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 8,
          }}
          onPress={() =>
            navigation.navigate("AddSavingsTransaction", {
              savingsId: saving.id,
              type: "deposit",
            })
          }
          activeOpacity={0.85}
        >
          <Ionicons
            name="add-circle-outline"
            size={17}
            color={BACKGROUND_COLOR}
          />
          <Text
            style={{ color: BACKGROUND_COLOR, fontSize: 14, fontWeight: "700" }}
          >
            Tambah Transaksi Baru
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SavingsHistoryScreen;