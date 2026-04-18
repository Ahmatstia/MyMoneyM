// File: src/screens/TransactionsScreen.tsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Dimensions,
  Modal,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Swipeable } from "react-native-gesture-handler";
import { Calendar } from "react-native-calendars";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { formatCurrency, safeNumber } from "../../utils/calculations";
import { Transaction } from "../../types";
import { Colors } from "../../theme/theme";

const { width } = Dimensions.get("window");

type SafeIconName = keyof typeof Ionicons.glyphMap;

// ─── Warna konsisten dengan HomeScreen & AnalyticsScreen ─────────────────────
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR    = Colors.surface;
const TEXT_PRIMARY     = Colors.textPrimary;
const TEXT_SECONDARY   = Colors.textSecondary;
const BORDER_COLOR     = Colors.border;
const ACCENT_COLOR     = Colors.accent;
const SUCCESS_COLOR    = Colors.success;
const WARNING_COLOR    = Colors.warning;
const ERROR_COLOR      = Colors.error;

// ─── Komponen UI kecil (konsisten dengan HomeScreen & AnalyticsScreen) ────────

const Sep = ({ marginV = 16 }: { marginV?: number }) => (
  <View
    style={{
      height: 1,
      backgroundColor: SURFACE_COLOR,
      marginHorizontal: -16,
      marginVertical: marginV,
    }}
  />
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
  <View style={tw`flex-row justify-between items-center mb-3`}>
    <Text
      style={{
        color: Colors.gray400,
        fontSize: 10,
        fontWeight: "600",
        letterSpacing: 1,
        textTransform: "uppercase",
      }}
    >
      {title}
    </Text>
    {linkLabel && onPress && (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Text style={{ color: ACCENT_COLOR, fontSize: 12 }}>{linkLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Main component ───────────────────────────────────────────────────────────

const TransactionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state, deleteTransaction } = useAppContext();

  const [searchQuery, setSearchQuery]         = useState("");
  const [filterType, setFilterType]           = useState<"all" | "income" | "expense">("all");
  const [dateFilter, setDateFilter]           = useState<"all" | "week" | "month" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate]     = useState<Date>(new Date());
  const [showCalendar, setShowCalendar]       = useState<"start" | "end" | null>(null);
  const [isRefreshing, setIsRefreshing]       = useState(false);
  const [searchFocused, setSearchFocused]     = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});
  const [fabScaleAnim] = useState(new Animated.Value(1));

  // ── Cleanup on unmount (sama dengan asli) ────────────────────────────────
  useEffect(() => {
    return () => {
      Object.values(swipeableRefs.current).forEach((ref) => {
        if (ref) {
          try { ref.close(); } catch { }
        }
      });
      swipeableRefs.current = {};
    };
  }, []);

  // ── FAB press animation ───────────────────────────────────────────────────
  const fabPressIn  = () => Animated.spring(fabScaleAnim, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start();
  const fabPressOut = () => Animated.spring(fabScaleAnim, { toValue: 1,    useNativeDriver: true, speed: 50 }).start();

  // ── Safe icon helper (sama dengan asli) ──────────────────────────────────
  const getSafeIcon = (iconName: string): SafeIconName => {
    const defaultIcon: SafeIconName = "receipt-outline";
    if (iconName in Ionicons.glyphMap) return iconName as SafeIconName;
    return defaultIcon;
  };

  // ── Category icons (sama dengan asli) ────────────────────────────────────
  const getCategoryIcon = (category: string): SafeIconName => {
    const icons: Record<string, SafeIconName> = {
      Makanan:      "restaurant-outline",
      Transportasi: "car-outline",
      Belanja:      "cart-outline",
      Hiburan:      "film-outline",
      Kesehatan:    "medical-outline",
      Pendidikan:   "school-outline",
      Gaji:         "cash-outline",
      Investasi:    "trending-up-outline",
      Lainnya:      "ellipsis-horizontal-outline",
    };
    return icons[category] || "receipt-outline";
  };

  // ── Filter transactions (sama dengan asli) ───────────────────────────────
  const filteredTransactions = useMemo(() => {
    let filtered = [...state.transactions];

    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    if (dateFilter !== "all") {
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      let startDate = new Date();

      switch (dateFilter) {
        case "week":
          startDate.setDate(now.getDate() - 6);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "custom":
          if (customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end   = new Date(customEndDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter((t) => {
              try {
                const transDate = new Date(t.date);
                transDate.setHours(0, 0, 0, 0);
                return transDate >= start && transDate <= end;
              } catch { return false; }
            });
            return filtered;
          }
          break;
      }

      if (dateFilter !== "custom") {
        filtered = filtered.filter((t) => {
          try {
            const transDate = new Date(t.date);
            transDate.setHours(0, 0, 0, 0);
            return transDate >= startDate && transDate <= now;
          } catch { return false; }
        });
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((t) => {
        try {
          const amountString = safeNumber(t.amount).toString();
          return (
            t.category.toLowerCase().includes(query) ||
            (t.description && t.description.toLowerCase().includes(query)) ||
            amountString.includes(query) ||
            t.date.toLowerCase().includes(query)
          );
        } catch { return false; }
      });
    }

    return filtered.sort((a, b) => {
      try {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } catch { return 0; }
    });
  }, [state.transactions, filterType, dateFilter, searchQuery, customStartDate, customEndDate]);

  // ── Group by day (sama dengan asli) ──────────────────────────────────────
  const groupedByDay = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    filteredTransactions.forEach((transaction) => {
      try {
        const date = new Date(transaction.date);
        if (isNaN(date.getTime())) return;
        const dayKey = date.toLocaleDateString("id-ID", {
          day: "numeric", month: "short", year: "numeric",
        });
        if (!groups[dayKey]) groups[dayKey] = [];
        groups[dayKey].push(transaction);
      } catch (error) {
        console.warn("Error grouping transaction:", error);
      }
    });
    return groups;
  }, [filteredTransactions]);

  // ── Totals (sama dengan asli) ─────────────────────────────────────────────
  const totals = useMemo(() => {
    const totalIncome  = filteredTransactions.filter((t) => t.type === "income") .reduce((sum, t) => sum + safeNumber(t.amount), 0);
    const totalExpense = filteredTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + safeNumber(t.amount), 0);
    return {
      totalIncome:  safeNumber(totalIncome),
      totalExpense: safeNumber(totalExpense),
      balance:      safeNumber(totalIncome - totalExpense),
    };
  }, [filteredTransactions]);

  // ── Delete handler (sama dengan asli) ────────────────────────────────────
  const handleDelete = async (transactionId: string) => {
    const swipeable = swipeableRefs.current[transactionId];
    if (swipeable) {
      try { swipeable.close(); } catch { }
    }
    const transaction = state.transactions.find((t) => t.id === transactionId);
    if (!transaction) {
      Alert.alert("Error", "Transaksi tidak ditemukan");
      return;
    }
    Alert.alert(
      "Hapus Transaksi",
      "Apakah Anda yakin ingin menghapus transaksi ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTransaction(transactionId);
              delete swipeableRefs.current[transactionId];
            } catch (error) {
              console.error("Delete transaction error:", error);
              Alert.alert("Error", "Gagal menghapus transaksi");
            }
          },
        },
      ]
    );
  };

  // ── Edit handler (sama dengan asli) ──────────────────────────────────────
  const handleEdit = (transaction: Transaction) => {
    const swipeable = swipeableRefs.current[transaction.id];
    if (swipeable) {
      try { swipeable.close(); } catch { }
    }
    navigation.navigate("AddTransaction", { editMode: true, transactionData: transaction });
  };

  // ── Swipe actions (sama dengan asli, warna diselaraskan) ─────────────────
  const renderRightActions = (transaction: Transaction) => (
    <View style={tw`flex-row h-full`}>
      <TouchableOpacity
        style={[
          tw`w-12 justify-center items-center`,
          { backgroundColor: `${ACCENT_COLOR}25` },
        ]}
        onPress={() => handleEdit(transaction)}
      >
        <Ionicons name="pencil-outline" size={17} color={ACCENT_COLOR} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          tw`w-12 justify-center items-center`,
          { backgroundColor: `${ERROR_COLOR}25` },
        ]}
        onPress={() => handleDelete(transaction.id)}
      >
        <Ionicons name="trash-outline" size={17} color={ERROR_COLOR} />
      </TouchableOpacity>
    </View>
  );

  // ── Date helpers (sama dengan asli) ──────────────────────────────────────
  const formatDisplayDate = (dateString: string) => {
    try {
      const date      = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const today     = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === today.toDateString())     return "Hari Ini";
      if (date.toDateString() === yesterday.toDateString()) return "Kemarin";
      return date.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
    } catch { return dateString; }
  };

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case "week":   return "7 Hari";
      case "month":  return "Bulan Ini";
      case "custom":
        if (customStartDate && customEndDate) {
          try {
            return `${customStartDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} – ${customEndDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`;
          } catch { return "Tanggal"; }
        }
        return "Tanggal";
      default: return "Semua";
    }
  };

  const handleDateSelect = (day: any) => {
    try {
      const selectedDate = new Date(day.dateString);
      if (isNaN(selectedDate.getTime())) {
        Alert.alert("Error", "Tanggal tidak valid");
        return;
      }
      if (showCalendar === "start") {
        setCustomStartDate(selectedDate);
        if (selectedDate > customEndDate) setCustomEndDate(selectedDate);
      } else if (showCalendar === "end") {
        setCustomEndDate(selectedDate);
        if (selectedDate < customStartDate) setCustomStartDate(selectedDate);
      }
    } catch (error) {
      console.error("Date select error:", error);
      Alert.alert("Error", "Gagal memilih tanggal");
    } finally {
      setShowCalendar(null);
    }
  };

  const resetDateFilter = () => {
    setDateFilter("all");
    const today = new Date();
    setCustomStartDate(today);
    setCustomEndDate(today);
  };

  const applyFilter = () => {
    if (dateFilter === "custom" && customStartDate > customEndDate) {
      Alert.alert("Error", "Tanggal mulai tidak boleh setelah tanggal akhir");
      return;
    }
    setShowFilterModal(false);
  };

  const formatDateForCalendar = (date: Date): string => {
    try {
      const year  = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day   = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch { return new Date().toISOString().split("T")[0]; }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const hasActiveFilter = searchQuery || filterType !== "all" || dateFilter !== "all";

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <View style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>

      {/* ── Sticky header: search + filter ──────────────────────────────── */}
      <View
        style={{
          backgroundColor: BACKGROUND_COLOR,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: SURFACE_COLOR,
        }}
      >
        {/* Search bar */}
        <View style={tw`flex-row items-center mb-3`}>
          <View
            style={[
              tw`flex-1 flex-row items-center rounded-xl px-3 py-2.5`,
              {
                backgroundColor: SURFACE_COLOR,
                borderWidth: searchFocused ? 1 : 0,
                borderColor: searchFocused ? `${ACCENT_COLOR}50` : "transparent",
              },
            ]}
          >
            <Ionicons name="search-outline" size={15} color={Colors.gray400} />
            <TextInput
              style={[tw`flex-1 text-sm ml-2`, { color: TEXT_PRIMARY }]}
              placeholder="Cari kategori, deskripsi..."
              placeholderTextColor={Colors.gray400}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={15} color={Colors.gray400} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter button */}
          <TouchableOpacity
            style={[
              tw`ml-2 w-9 h-9 rounded-xl justify-center items-center`,
              {
                backgroundColor: dateFilter !== "all"
                  ? `${ACCENT_COLOR}20`
                  : SURFACE_COLOR,
              },
            ]}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="filter-outline"
              size={16}
              color={dateFilter !== "all" ? ACCENT_COLOR : Colors.gray400}
            />
          </TouchableOpacity>
        </View>

        {/* Type filter pills */}
        <View style={tw`flex-row gap-2`}>
          {[
            { key: "all",     label: "Semua",      icon: null },
            { key: "income",  label: "Pemasukan",  icon: "arrow-down-outline" as SafeIconName, color: SUCCESS_COLOR },
            { key: "expense", label: "Pengeluaran", icon: "arrow-up-outline"  as SafeIconName, color: ERROR_COLOR },
          ].map((item) => {
            const isActive = filterType === item.key;
            const activeColor =
              item.key === "income"  ? SUCCESS_COLOR :
              item.key === "expense" ? ERROR_COLOR   : ACCENT_COLOR;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  tw`flex-row items-center px-3 py-1.5 rounded-full`,
                  isActive
                    ? item.key === "all"
                      ? { backgroundColor: ACCENT_COLOR }
                      : { backgroundColor: `${activeColor}18`, borderWidth: 1, borderColor: `${activeColor}35` }
                    : { backgroundColor: SURFACE_COLOR },
                ]}
                onPress={() => setFilterType(item.key as any)}
                activeOpacity={0.7}
              >
                {item.icon && (
                  <Ionicons
                    name={item.icon}
                    size={11}
                    color={isActive ? activeColor : Colors.gray400}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: isActive
                      ? item.key === "all" ? BACKGROUND_COLOR : activeColor
                      : Colors.gray400,
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Active date filter chip */}
          {dateFilter !== "all" && (
            <TouchableOpacity
              style={[
                tw`flex-row items-center px-3 py-1.5 rounded-full`,
                { backgroundColor: `${ACCENT_COLOR}18`, borderWidth: 1, borderColor: `${ACCENT_COLOR}35` },
              ]}
              onPress={resetDateFilter}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 12, fontWeight: "500", color: ACCENT_COLOR, marginRight: 4 }}>
                {getDateFilterLabel()}
              </Text>
              <Ionicons name="close" size={11} color={ACCENT_COLOR} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Main scroll ──────────────────────────────────────────────────── */}
      <ScrollView
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[ACCENT_COLOR]}
            tintColor={ACCENT_COLOR}
          />
        }
      >
        {/* ── Summary row (flat, no card) ──────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }}>
          <View style={tw`flex-row items-center`}>
            <View style={tw`flex-1`}>
              <Text style={{ color: Colors.gray400, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>
                Saldo
              </Text>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  letterSpacing: -0.5,
                  color: totals.balance >= 0 ? TEXT_PRIMARY : ERROR_COLOR,
                }}
              >
                {formatCurrency(totals.balance)}
              </Text>
            </View>

            <View style={{ width: 1, height: 32, backgroundColor: SURFACE_COLOR, marginHorizontal: 16 }} />

            <View style={tw`items-end`}>
              <Text style={{ color: Colors.gray400, fontSize: 10, marginBottom: 2 }}>Masuk</Text>
              <Text style={{ color: SUCCESS_COLOR, fontSize: 13, fontWeight: "600" }}>
                {formatCurrency(totals.totalIncome)}
              </Text>
            </View>

            <View style={{ width: 1, height: 32, backgroundColor: SURFACE_COLOR, marginHorizontal: 16 }} />

            <View style={tw`items-end`}>
              <Text style={{ color: Colors.gray400, fontSize: 10, marginBottom: 2 }}>Keluar</Text>
              <Text style={{ color: ERROR_COLOR, fontSize: 13, fontWeight: "600" }}>
                {formatCurrency(totals.totalExpense)}
              </Text>
            </View>
          </View>

          {/* 2px thin bar menunjukkan rasio income vs expense */}
          {(totals.totalIncome > 0 || totals.totalExpense > 0) && (
            <View style={{ marginTop: 12 }}>
              <View style={{ height: 2, backgroundColor: SURFACE_COLOR, borderRadius: 2, overflow: "hidden" }}>
                <View
                  style={{
                    position: "absolute",
                    left: 0, top: 0, bottom: 0,
                    width: `${Math.min((totals.totalIncome / Math.max(totals.totalIncome, totals.totalExpense)) * 100, 100)}%`,
                    backgroundColor: SUCCESS_COLOR,
                    borderRadius: 2,
                  }}
                />
              </View>
              <Text style={{ color: Colors.gray400, fontSize: 10, marginTop: 4 }}>
                {filteredTransactions.length} transaksi ditampilkan
              </Text>
            </View>
          )}
        </View>

        {/* ── Transactions grouped by day ──────────────────────────────── */}
        {Object.entries(groupedByDay).length > 0 ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            {Object.entries(groupedByDay).map(([day, transactions], groupIndex) => {
              // Hitung subtotal per hari
              const dayIncome  = transactions.filter((t) => t.type === "income") .reduce((s, t) => s + safeNumber(t.amount), 0);
              const dayExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + safeNumber(t.amount), 0);

              return (
                <View key={day} style={{ marginBottom: 8 }}>
                  {/* Day header */}
                  <View style={tw`flex-row justify-between items-center mb-2`}>
                    <Text style={{ color: Colors.gray400, fontSize: 11, fontWeight: "600" }}>
                      {day}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: dayIncome - dayExpense >= 0 ? SUCCESS_COLOR : ERROR_COLOR,
                      }}
                    >
                      {dayIncome - dayExpense >= 0 ? "+" : ""}
                      {formatCurrency(dayIncome - dayExpense)}
                    </Text>
                  </View>

                  {/* Transaction items — plain list, border-bottom antar item */}
                  {transactions.map((transaction, index) => (
                    <Swipeable
                      key={transaction.id}
                      ref={(ref) => {
                        if (ref) {
                          swipeableRefs.current[transaction.id] = ref;
                        } else {
                          delete swipeableRefs.current[transaction.id];
                        }
                      }}
                      renderRightActions={() => renderRightActions(transaction)}
                      friction={2}
                      containerStyle={{ backgroundColor: BACKGROUND_COLOR }}
                      onSwipeableWillOpen={() => {
                        Object.keys(swipeableRefs.current).forEach((id) => {
                          if (id !== transaction.id && swipeableRefs.current[id]) {
                            try { swipeableRefs.current[id]?.close(); } catch { }
                          }
                        });
                      }}
                    >
                      <TouchableOpacity
                        style={[
                          tw`flex-row items-center py-3`,
                          {
                            backgroundColor: BACKGROUND_COLOR,
                            borderBottomWidth: index < transactions.length - 1 ? 1 : 0,
                            borderBottomColor: SURFACE_COLOR,
                          },
                        ]}
                        activeOpacity={0.6}
                        onPress={() => handleEdit(transaction)}
                        onLongPress={() => handleDelete(transaction.id)}
                        delayLongPress={500}
                      >
                        {/* Category icon */}
                        <View
                          style={[
                            tw`w-9 h-9 rounded-xl items-center justify-center mr-3`,
                            {
                              backgroundColor:
                                transaction.type === "income"
                                  ? `${SUCCESS_COLOR}15`
                                  : `${ERROR_COLOR}15`,
                              flexShrink: 0,
                            },
                          ]}
                        >
                          <Ionicons
                            name={getCategoryIcon(transaction.category)}
                            size={16}
                            color={transaction.type === "income" ? SUCCESS_COLOR : ERROR_COLOR}
                          />
                        </View>

                        {/* Info */}
                        <View style={tw`flex-1`}>
                          <Text
                            style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "500", marginBottom: 1 }}
                          >
                            {transaction.category}
                          </Text>
                          <Text
                            style={{ color: Colors.gray400, fontSize: 11 }}
                            numberOfLines={1}
                          >
                            {transaction.description || "—"} · {formatDisplayDate(transaction.date)}
                          </Text>
                        </View>

                        {/* Amount */}
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: transaction.type === "income" ? SUCCESS_COLOR : ERROR_COLOR,
                            marginLeft: 8,
                          }}
                        >
                          {transaction.type === "income" ? "+" : "−"}
                          {formatCurrency(safeNumber(transaction.amount))}
                        </Text>
                      </TouchableOpacity>
                    </Swipeable>
                  ))}

                  {/* Garis tipis antar grup hari */}
                  <View
                    style={{
                      height: 1,
                      backgroundColor: SURFACE_COLOR,
                      marginHorizontal: -16,
                      marginTop: 8,
                    }}
                  />
                </View>
              );
            })}
          </View>
        ) : (
          /* ── Empty state ───────────────────────────────────────────── */
          <View style={tw`items-center justify-center py-16 px-8`}>
            <View
              style={[
                tw`w-16 h-16 rounded-full items-center justify-center mb-4`,
                { backgroundColor: SURFACE_COLOR },
              ]}
            >
              <Ionicons
                name={hasActiveFilter ? "search-outline" : "receipt-outline"}
                size={26}
                color={Colors.gray400}
              />
            </View>
            <Text
              style={{ color: TEXT_PRIMARY, fontSize: 15, fontWeight: "600", marginBottom: 6, textAlign: "center" }}
            >
              {hasActiveFilter ? "Transaksi tidak ditemukan" : "Belum ada transaksi"}
            </Text>
            <Text
              style={{ color: Colors.gray400, fontSize: 12, textAlign: "center", lineHeight: 18, marginBottom: 20 }}
            >
              {hasActiveFilter
                ? "Coba kata kunci lain atau hapus filter yang aktif"
                : "Mulai catat transaksi pertama Anda"}
            </Text>

            {!hasActiveFilter ? (
              <TouchableOpacity
                style={[
                  tw`flex-row items-center px-5 py-2.5 rounded-xl`,
                  { backgroundColor: ACCENT_COLOR },
                ]}
                onPress={() => navigation.navigate("AddTransaction")}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color={BACKGROUND_COLOR} style={{ marginRight: 6 }} />
                <Text style={{ color: BACKGROUND_COLOR, fontSize: 13, fontWeight: "600" }}>
                  Tambah Transaksi
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  tw`flex-row items-center px-5 py-2.5 rounded-xl`,
                  { backgroundColor: SURFACE_COLOR },
                ]}
                onPress={() => {
                  setSearchQuery("");
                  setFilterType("all");
                  resetDateFilter();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close-outline" size={15} color={Colors.gray400} style={{ marginRight: 5 }} />
                <Text style={{ color: TEXT_SECONDARY, fontSize: 13, fontWeight: "500" }}>
                  Hapus Semua Filter
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          tw`absolute bottom-6 right-5`,
          {
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
          },
        ]}
      >
        <TouchableOpacity
          style={tw`w-full h-full items-center justify-center`}
          onPress={() => navigation.navigate("AddTransaction")}
          activeOpacity={0.8}
          onPressIn={fabPressIn}
          onPressOut={fabPressOut}
          accessibilityLabel="Tambah transaksi baru"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={26} color={BACKGROUND_COLOR} />
        </TouchableOpacity>
      </Animated.View>

      {/* ═══════════════════════════════════════════════════════════════════
          FILTER MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={tw`flex-1 justify-end`} pointerEvents="box-none">
          <TouchableOpacity
            style={[tw`absolute inset-0`, { backgroundColor: "rgba(0,0,0,0.5)" }]}
            activeOpacity={1}
            onPress={() => setShowFilterModal(false)}
          />
          <View
            style={[
              tw`rounded-t-3xl px-5 pt-5 pb-8`,
              { backgroundColor: SURFACE_COLOR },
            ]}
          >
            {/* Modal header */}
            <View style={tw`flex-row justify-between items-center mb-5`}>
              <Text style={{ color: TEXT_PRIMARY, fontSize: 16, fontWeight: "700" }}>
                Filter Tanggal
              </Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)} activeOpacity={0.7}>
                <Ionicons name="close-outline" size={22} color={Colors.gray400} />
              </TouchableOpacity>
            </View>

            {/* Time range options */}
            <Text style={{ color: Colors.gray400, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
              Rentang Waktu
            </Text>
            <View style={tw`flex-row flex-wrap gap-2 mb-5`}>
              {[
                { key: "all",    label: "Semua Waktu" },
                { key: "week",   label: "7 Hari Terakhir" },
                { key: "month",  label: "Bulan Ini" },
                { key: "custom", label: "Tanggal Kustom" },
              ].map((option) => {
                const isActive = dateFilter === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      tw`px-4 py-2 rounded-full`,
                      isActive
                        ? { backgroundColor: ACCENT_COLOR }
                        : { backgroundColor: Colors.surfaceLight },
                    ]}
                    onPress={() => setDateFilter(option.key as any)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "500",
                        color: isActive ? BACKGROUND_COLOR : TEXT_SECONDARY,
                      }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom date pickers */}
            {dateFilter === "custom" && (
              <>
                <View style={{ height: 1, backgroundColor: Colors.surfaceLight, marginBottom: 16 }} />
                <Text style={{ color: Colors.gray400, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  Tanggal Kustom
                </Text>
                <View style={tw`flex-row gap-3 mb-5`}>
                  <View style={tw`flex-1`}>
                    <Text style={{ color: Colors.gray400, fontSize: 11, marginBottom: 6 }}>Dari</Text>
                    <TouchableOpacity
                      style={[
                        tw`rounded-xl p-3`,
                        { backgroundColor: Colors.surfaceLight },
                      ]}
                      onPress={() => setShowCalendar("start")}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: TEXT_PRIMARY, fontSize: 13 }}>
                        {customStartDate.toLocaleDateString("id-ID")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={{ color: Colors.gray400, fontSize: 11, marginBottom: 6 }}>Sampai</Text>
                    <TouchableOpacity
                      style={[
                        tw`rounded-xl p-3`,
                        { backgroundColor: Colors.surfaceLight },
                      ]}
                      onPress={() => setShowCalendar("end")}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: TEXT_PRIMARY, fontSize: 13 }}>
                        {customEndDate.toLocaleDateString("id-ID")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {/* Action buttons */}
            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                style={[
                  tw`flex-1 rounded-xl py-3 items-center`,
                  { backgroundColor: Colors.surfaceLight },
                ]}
                onPress={() => { resetDateFilter(); setShowFilterModal(false); }}
                activeOpacity={0.7}
              >
                <Text style={{ color: TEXT_SECONDARY, fontSize: 14, fontWeight: "500" }}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  tw`flex-1 rounded-xl py-3 items-center`,
                  { backgroundColor: ACCENT_COLOR },
                ]}
                onPress={applyFilter}
                activeOpacity={0.8}
              >
                <Text style={{ color: BACKGROUND_COLOR, fontSize: 14, fontWeight: "600" }}>Terapkan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════
          CALENDAR MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showCalendar !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendar(null)}
      >
        <View style={tw`flex-1 justify-end`} pointerEvents="box-none">
          <TouchableOpacity
            style={[tw`absolute inset-0`, { backgroundColor: "rgba(0,0,0,0.5)" }]}
            activeOpacity={1}
            onPress={() => setShowCalendar(null)}
          />
          <View style={[tw`rounded-t-3xl px-4 pt-5 pb-8`, { backgroundColor: SURFACE_COLOR }]}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={{ color: TEXT_PRIMARY, fontSize: 16, fontWeight: "700" }}>
                {showCalendar === "start" ? "Pilih Tanggal Mulai" : "Pilih Tanggal Akhir"}
              </Text>
              <TouchableOpacity onPress={() => setShowCalendar(null)} activeOpacity={0.7}>
                <Ionicons name="close-outline" size={22} color={Colors.gray400} />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={{
                [formatDateForCalendar(
                  showCalendar === "start" ? customStartDate : customEndDate
                )]: {
                  selected: true,
                  selectedColor: ACCENT_COLOR,
                  selectedTextColor: BACKGROUND_COLOR,
                },
              }}
              minDate={showCalendar === "end"   ? formatDateForCalendar(customStartDate) : undefined}
              maxDate={showCalendar === "start" ? formatDateForCalendar(customEndDate)   : undefined}
              theme={{
                backgroundColor:             SURFACE_COLOR,
                calendarBackground:          SURFACE_COLOR,
                textSectionTitleColor:       Colors.gray400,
                selectedDayBackgroundColor:  ACCENT_COLOR,
                selectedDayTextColor:        BACKGROUND_COLOR,
                todayTextColor:              ACCENT_COLOR,
                dayTextColor:                TEXT_PRIMARY,
                textDisabledColor:           Colors.textTertiary,
                dotColor:                    ACCENT_COLOR,
                selectedDotColor:            BACKGROUND_COLOR,
                arrowColor:                  ACCENT_COLOR,
                monthTextColor:              TEXT_PRIMARY,
                textMonthFontWeight:         "700",
                textDayFontSize:             15,
                textMonthFontSize:           16,
                "stylesheet.calendar.main": {
                  week: {
                    marginTop: 0, marginBottom: 0,
                    flexDirection: "row", justifyContent: "space-around",
                  },
                },
              }}
            />
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default TransactionsScreen;