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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Swipeable } from "react-native-gesture-handler";
import { Calendar } from "react-native-calendars";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { formatCurrency, safeNumber } from "../../utils/calculations";
import { Transaction } from "../../types";
import { useTheme } from '../../theme/ThemeContext';
import { DEFAULT_CATEGORIES, CategoryItem } from "../../components/CategoryPickerModal";

const { width } = Dimensions.get("window");

type SafeIconName = keyof typeof Ionicons.glyphMap;

// ─── Theme colors (tidak diubah) ──────────────────────────────────────────────
// ─── Design tokens (konsisten dengan HomeScreen & AnalyticsScreen) ────────────
const CARD_RADIUS  = 20;
const INNER_RADIUS = 14;
const CARD_PAD     = 20;
const SECTION_GAP  = 24;
// ─── Komponen UI (konsisten) ──────────────────────────────────────────────────

const Spacer = ({ size = SECTION_GAP }: { size?: number }) => (
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
}) => {
  const { colors } = useTheme();
  return (
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
            backgroundColor: colors.accent,
            borderRadius: 2,
            marginRight: 8,
          }}
        />
        <Text
          style={{
            color: colors.gray400,
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
          <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "600" }}>
            {linkLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const TransactionsScreen: React.FC = () => {
  const { colors } = useTheme();
  const CARD_BORDER = `${colors.border}80`;
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

  // ── Semua logika di bawah ini TIDAK DIUBAH ────────────────────────────────

  useEffect(() => {
    return () => {
      Object.values(swipeableRefs.current).forEach((ref) => {
        if (ref) { try { ref.close(); } catch { } }
      });
      swipeableRefs.current = {};
    };
  }, []);

  const fabPressIn  = () =>
    Animated.spring(fabScaleAnim, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start();
  const fabPressOut = () =>
    Animated.spring(fabScaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  const getSafeIcon = (iconName: string): SafeIconName => {
    const defaultIcon: SafeIconName = "receipt-outline";
    if (iconName in Ionicons.glyphMap) return iconName as SafeIconName;
    return defaultIcon;
  };

  const resolveCategory = (categoryName: string): CategoryItem => {
    const all: CategoryItem[] = [
      ...DEFAULT_CATEGORIES,
      ...(state.customCategories || []).map((c) => ({
        id: c.id, name: c.name, icon: c.icon, color: c.color,
        isCustom: true as const, customId: c.id,
      })),
    ];
    const found = all.find((c) => c.name === categoryName);
    return found || { id: "unknown", name: categoryName, icon: "receipt-outline", color: colors.gray400 };
  };

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
      try { return new Date(b.date).getTime() - new Date(a.date).getTime(); }
      catch { return 0; }
    });
  }, [state.transactions, filterType, dateFilter, searchQuery, customStartDate, customEndDate]);

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

      }
    });
    return groups;
  }, [filteredTransactions]);

  const totals = useMemo(() => {
    const totalIncome  = filteredTransactions.filter((t) => t.type === "income") .reduce((sum, t) => sum + safeNumber(t.amount), 0);
    const totalExpense = filteredTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + safeNumber(t.amount), 0);
    return {
      totalIncome:  safeNumber(totalIncome),
      totalExpense: safeNumber(totalExpense),
      balance:      safeNumber(totalIncome - totalExpense),
    };
  }, [filteredTransactions]);

  const handleDelete = async (transactionId: string) => {
    const swipeable = swipeableRefs.current[transactionId];
    if (swipeable) { try { swipeable.close(); } catch { } }
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

              Alert.alert("Error", "Gagal menghapus transaksi");
            }
          },
        },
      ]
    );
  };

  const handleEdit = (transaction: Transaction) => {
    const swipeable = swipeableRefs.current[transaction.id];
    if (swipeable) { try { swipeable.close(); } catch { } }
    navigation.navigate("AddTransaction", { editMode: true, transactionData: transaction });
  };

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
      case "week":  return "7 Hari";
      case "month": return "Bulan Ini";
      case "custom":
        if (customStartDate && customEndDate) {
          try {
            return `${customStartDate.toLocaleDateString("id-ID", {
              day: "numeric", month: "short",
            })} – ${customEndDate.toLocaleDateString("id-ID", {
              day: "numeric", month: "short",
            })}`;
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

  const hasActiveFilter =
    searchQuery || filterType !== "all" || dateFilter !== "all";

  // ── Swipe actions ─────────────────────────────────────────────────────────
  const renderRightActions = (transaction: Transaction) => (
    <View style={{ flexDirection: "row", height: "100%" }}>
      <TouchableOpacity
        style={{
          width: 52,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: `${colors.accent}20`,
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
        }}
        onPress={() => handleEdit(transaction)}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${colors.accent}25`,
          }}
        >
          <Ionicons name="pencil-outline" size={15} color={colors.accent} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          width: 52,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: `${colors.error}20`,
        }}
        onPress={() => handleDelete(transaction.id)}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${colors.error}25`,
          }}
        >
          <Ionicons name="trash-outline" size={15} color={colors.error} />
        </View>
      </TouchableOpacity>
    </View>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ── Sticky header ───────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: colors.background,
          paddingHorizontal: 18,
          paddingTop: 14,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: CARD_BORDER,
        }}
      >
        {/* Page title row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <Text
            style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "700" }}
          >
            Transaksi
          </Text>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 20,
              backgroundColor: dateFilter !== "all"
                ? `${colors.accent}18`
                : colors.surface,
              borderWidth: 1,
              borderColor: dateFilter !== "all"
                ? `${colors.accent}30`
                : "transparent",
            }}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="calendar-outline"
              size={13}
              color={dateFilter !== "all" ? colors.accent : colors.gray400}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: dateFilter !== "all" ? "700" : "500",
                color: dateFilter !== "all" ? colors.accent : colors.gray400,
                marginLeft: 5,
              }}
            >
              {getDateFilterLabel()}
            </Text>
            {dateFilter !== "all" && (
              <TouchableOpacity
                onPress={resetDateFilter}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ marginLeft: 5 }}
              >
                <Ionicons name="close" size={11} color={colors.accent} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderRadius: INNER_RADIUS,
            paddingHorizontal: 13,
            paddingVertical: 10,
            borderWidth: searchFocused ? 1 : 1,
            borderColor: searchFocused
              ? `${colors.accent}45`
              : CARD_BORDER,
            marginBottom: 12,
          }}
        >
          <Ionicons
            name="search-outline"
            size={15}
            color={searchFocused ? colors.accent : colors.gray400}
          />
          <TextInput
            style={{
              flex: 1,
              color: colors.textPrimary,
              fontSize: 13,
              marginLeft: 9,
              paddingVertical: 0,
            }}
            placeholder="Cari kategori, deskripsi..."
            placeholderTextColor={colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close-circle"
                size={16}
                color={colors.gray400}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Type filter — segmented control */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.surface,
            borderRadius: 13,
            padding: 3,
            borderWidth: 1,
            borderColor: CARD_BORDER,
          }}
        >
          {[
            { key: "all",     label: "Semua" },
            { key: "income",  label: "Pemasukan" },
            { key: "expense", label: "Pengeluaran" },
          ].map((item) => {
            const isActive = filterType === item.key;
            const activeColor =
              item.key === "income"
                ? colors.success
                : item.key === "expense"
                ? colors.error
                : colors.accent;
            return (
              <TouchableOpacity
                key={item.key}
                style={{
                  flex: 1,
                  paddingVertical: 7,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: isActive
                    ? `${activeColor}20`
                    : "transparent",
                }}
                onPress={() => setFilterType(item.key as any)}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: isActive ? "700" : "500",
                    color: isActive ? activeColor : colors.gray400,
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Main scroll ──────────────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
      >
        {/* ── Transactions grouped by day ─────────────────────────────── */}
        <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
          {Object.entries(groupedByDay).length > 0 ? (
            <View>
              {Object.entries(groupedByDay).map(([day, transactions], groupIndex) => {
                const dayIncome  = transactions.filter((t) => t.type === "income") .reduce((s, t) => s + safeNumber(t.amount), 0);
                const dayExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + safeNumber(t.amount), 0);
                const dayNet     = dayIncome - dayExpense;

                return (
                  <View
                    key={day}
                    style={{ marginBottom: 14 }}
                  >
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
                          color: colors.gray400,
                          fontSize: 11,
                          fontWeight: "700",
                          letterSpacing: 0.3,
                        }}
                      >
                        {day}
                      </Text>
                      <View
                        style={{
                          paddingHorizontal: 9,
                          paddingVertical: 3,
                          borderRadius: 20,
                          backgroundColor:
                            dayNet >= 0
                              ? `${colors.success}15`
                              : `${colors.error}15`,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: dayNet >= 0 ? colors.success : colors.error,
                          }}
                        >
                          {dayNet >= 0 ? "+" : ""}
                          {formatCurrency(dayNet)}
                        </Text>
                      </View>
                    </View>

                    {/* Transaction card */}
                    <View
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: CARD_RADIUS,
                        borderWidth: 1,
                        borderColor: CARD_BORDER,
                        overflow: "hidden",
                      }}
                    >
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
                          renderRightActions={() =>
                            renderRightActions(transaction)
                          }
                          friction={2}
                          containerStyle={{
                            backgroundColor: colors.surface,
                          }}
                          onSwipeableWillOpen={() => {
                            Object.keys(swipeableRefs.current).forEach(
                              (id) => {
                                if (
                                  id !== transaction.id &&
                                  swipeableRefs.current[id]
                                ) {
                                  try {
                                    swipeableRefs.current[id]?.close();
                                  } catch { }
                                }
                              }
                            );
                          }}
                        >
                          <TouchableOpacity
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingVertical: 13,
                              paddingHorizontal: 16,
                              backgroundColor: colors.surface,
                              borderBottomWidth:
                                index < transactions.length - 1 ? 1 : 0,
                              borderBottomColor: CARD_BORDER,
                            }}
                            activeOpacity={0.6}
                            onPress={() => handleEdit(transaction)}
                            onLongPress={() =>
                              handleDelete(transaction.id)
                            }
                            delayLongPress={500}
                          >
                              {/* Category icon */}
                              <View
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 13,
                                  alignItems: "center",
                                  justifyContent: "center",
                                  marginRight: 13,
                                  flexShrink: 0,
                                  backgroundColor: `${resolveCategory(transaction.category).color}15`,
                                }}
                              >
                                <Ionicons
                                  name={resolveCategory(transaction.category).icon as any}
                                  size={17}
                                  color={resolveCategory(transaction.category).color}
                                />
                              </View>

                            {/* Info */}
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  color: colors.textPrimary,
                                  fontSize: 13,
                                  fontWeight: "500",
                                  marginBottom: 2,
                                }}
                              >
                                {transaction.category}
                              </Text>
                              <Text
                                style={{
                                  color: colors.gray400,
                                  fontSize: 11,
                                }}
                                numberOfLines={1}
                              >
                                {transaction.description || "—"} ·{" "}
                                {formatDisplayDate(transaction.date)} ·{" "}
                                {new Date(transaction.createdAt).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Text>
                              {transaction.subTransactions && transaction.subTransactions.length > 0 && (
                                <View style={{
                                  flexDirection: "row", alignItems: "center",
                                  backgroundColor: `${colors.accent}15`,
                                  borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
                                  alignSelf: "flex-start", marginTop: 4,
                                }}>
                                  <Ionicons name="cart-outline" size={10} color={colors.accent} style={{ marginRight: 3 }} />
                                  <Text style={{ color: colors.accent, fontSize: 10, fontWeight: "700" }}>
                                    {transaction.subTransactions.length} item
                                  </Text>
                                </View>
                              )}
                            </View>

                            {/* Amount + chevron */}
                            <View
                              style={{
                                alignItems: "flex-end",
                                marginLeft: 8,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 13,
                                  fontWeight: "700",
                                  color:
                                    transaction.type === "income"
                                      ? colors.success
                                      : colors.error,
                                  marginBottom: 2,
                                }}
                              >
                                {transaction.type === "income" ? "+" : "−"}
                                {formatCurrency(
                                  safeNumber(transaction.amount)
                                )}
                              </Text>
                              <Ionicons
                                name="chevron-forward"
                                size={11}
                                color={colors.gray400}
                              />
                            </View>
                          </TouchableOpacity>
                        </Swipeable>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            /* ── Empty state ───────────────────────────────────────────── */
            <View
              style={{
                alignItems: "center",
                paddingVertical: 48,
                backgroundColor: colors.surface,
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
                  backgroundColor: `${colors.gray400}14`,
                  marginBottom: 14,
                }}
              >
                <Ionicons
                  name={
                    hasActiveFilter ? "search-outline" : "receipt-outline"
                  }
                  size={26}
                  color={colors.gray400}
                />
              </View>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 15,
                  fontWeight: "700",
                  marginBottom: 6,
                  textAlign: "center",
                }}
              >
                {hasActiveFilter
                  ? "Transaksi tidak ditemukan"
                  : "Belum ada transaksi"}
              </Text>
              <Text
                style={{
                  color: colors.gray400,
                  fontSize: 12,
                  textAlign: "center",
                  lineHeight: 18,
                  marginBottom: 20,
                }}
              >
                {hasActiveFilter
                  ? "Coba kata kunci lain atau hapus filter yang aktif"
                  : "Mulai catat transaksi pertama Anda"}
              </Text>

              {!hasActiveFilter ? (
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 13,
                    backgroundColor: colors.accent,
                  }}
                  onPress={() => navigation.navigate("AddTransaction")}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="add"
                    size={16}
                    color={colors.background}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      color: colors.background,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    Tambah Transaksi
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    borderRadius: 13,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: CARD_BORDER,
                  }}
                  onPress={() => {
                    setSearchQuery("");
                    setFilterType("all");
                    resetDateFilter();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="close-outline"
                    size={15}
                    color={colors.gray400}
                    style={{ marginRight: 5 }}
                  />
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 13,
                      fontWeight: "500",
                    }}
                  >
                    Hapus Semua Filter
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 24,
          right: 20,
          width: 54,
          height: 54,
          borderRadius: 17,
          backgroundColor: colors.accent,
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.45,
          shadowRadius: 14,
          elevation: 12,
          transform: [{ scale: fabScaleAnim }],
        }}
      >
        <TouchableOpacity
          style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}
          onPress={() => navigation.navigate("AddTransaction")}
          activeOpacity={0.8}
          onPressIn={fabPressIn}
          onPressOut={fabPressOut}
          accessibilityLabel="Tambah transaksi baru"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={28} color={colors.background} />
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
        <View style={{ flex: 1, justifyContent: "flex-end" }} pointerEvents="box-none">
          <TouchableOpacity
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.55)" }}
            activeOpacity={1}
            onPress={() => setShowFilterModal(false)}
          />
          <View
            style={{
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 36,
              backgroundColor: colors.surface,
              borderTopWidth: 1,
              borderTopColor: CARD_BORDER,
            }}
          >
            {/* Drag handle */}
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignSelf: "center",
                marginBottom: 18,
              }}
            />

            {/* Modal header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                Filter Tanggal
              </Text>
              <TouchableOpacity
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: `${colors.border}80`,
                }}
                onPress={() => setShowFilterModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={16} color={colors.gray400} />
              </TouchableOpacity>
            </View>

            {/* Time range label */}
            <Text
              style={{
                color: colors.gray400,
                fontSize: 10,
                fontWeight: "700",
                letterSpacing: 1.2,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Rentang Waktu
            </Text>

            {/* Segmented options */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 20,
              }}
            >
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
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 9,
                      borderRadius: 20,
                      backgroundColor: isActive
                        ? `${colors.accent}20`
                        : `${colors.border}80`,
                      borderWidth: 1,
                      borderColor: isActive
                        ? `${colors.accent}35`
                        : "transparent",
                    }}
                    onPress={() => setDateFilter(option.key as any)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: isActive ? "700" : "500",
                        color: isActive ? colors.accent : colors.textSecondary,
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
                <View
                  style={{
                    height: 1,
                    backgroundColor: CARD_BORDER,
                    marginBottom: 18,
                  }}
                />
                <Text
                  style={{
                    color: colors.gray400,
                    fontSize: 10,
                    fontWeight: "700",
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Tanggal Kustom
                </Text>
                <View
                  style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.gray400,
                        fontSize: 11,
                        marginBottom: 7,
                      }}
                    >
                      Dari
                    </Text>
                    <TouchableOpacity
                      style={{
                        borderRadius: INNER_RADIUS,
                        padding: 13,
                        backgroundColor: `${colors.border}80`,
                        borderWidth: 1,
                        borderColor: CARD_BORDER,
                      }}
                      onPress={() => setShowCalendar("start")}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{ color: colors.textPrimary, fontSize: 13 }}
                      >
                        {customStartDate.toLocaleDateString("id-ID")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.gray400,
                        fontSize: 11,
                        marginBottom: 7,
                      }}
                    >
                      Sampai
                    </Text>
                    <TouchableOpacity
                      style={{
                        borderRadius: INNER_RADIUS,
                        padding: 13,
                        backgroundColor: `${colors.border}80`,
                        borderWidth: 1,
                        borderColor: CARD_BORDER,
                      }}
                      onPress={() => setShowCalendar("end")}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{ color: colors.textPrimary, fontSize: 13 }}
                      >
                        {customEndDate.toLocaleDateString("id-ID")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {/* Action buttons */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderRadius: INNER_RADIUS,
                  paddingVertical: 13,
                  alignItems: "center",
                  backgroundColor: `${colors.border}80`,
                  borderWidth: 1,
                  borderColor: CARD_BORDER,
                }}
                onPress={() => {
                  resetDateFilter();
                  setShowFilterModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                >
                  Reset
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderRadius: INNER_RADIUS,
                  paddingVertical: 13,
                  alignItems: "center",
                  backgroundColor: colors.accent,
                  shadowColor: colors.accent,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
                onPress={applyFilter}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    color: colors.background,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  Terapkan
                </Text>
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
        <View style={{ flex: 1, justifyContent: "flex-end" }} pointerEvents="box-none">
          <TouchableOpacity
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.55)" }}
            activeOpacity={1}
            onPress={() => setShowCalendar(null)}
          />
          <View
            style={{
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 16,
              paddingTop: 20,
              paddingBottom: 36,
              backgroundColor: colors.surface,
              borderTopWidth: 1,
              borderTopColor: CARD_BORDER,
            }}
          >
            {/* Drag handle */}
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignSelf: "center",
                marginBottom: 18,
              }}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                paddingHorizontal: 4,
              }}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                {showCalendar === "start"
                  ? "Pilih Tanggal Mulai"
                  : "Pilih Tanggal Akhir"}
              </Text>
              <TouchableOpacity
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: `${colors.border}80`,
                }}
                onPress={() => setShowCalendar(null)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={16} color={colors.gray400} />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={{
                [formatDateForCalendar(
                  showCalendar === "start" ? customStartDate : customEndDate
                )]: {
                  selected: true,
                  selectedColor: colors.accent,
                  selectedTextColor: colors.background,
                },
              }}
              minDate={
                showCalendar === "end"
                  ? formatDateForCalendar(customStartDate)
                  : undefined
              }
              maxDate={
                showCalendar === "start"
                  ? formatDateForCalendar(customEndDate)
                  : undefined
              }
              theme={{
                backgroundColor:            colors.surface,
                calendarBackground:         colors.surface,
                textSectionTitleColor:      colors.gray400,
                selectedDayBackgroundColor: colors.accent,
                selectedDayTextColor:       colors.background,
                todayTextColor:             colors.accent,
                dayTextColor:               colors.textPrimary,
                textDisabledColor:          colors.textTertiary,
                dotColor:                   colors.accent,
                selectedDotColor:           colors.background,
                arrowColor:                 colors.accent,
                monthTextColor:             colors.textPrimary,
                textMonthFontWeight:        "700",
                textDayFontSize:            15,
                textMonthFontSize:          16,
                "stylesheet.calendar.main": {
                  week: {
                    marginTop: 0,
                    marginBottom: 0,
                    flexDirection: "row",
                    justifyContent: "space-around",
                  },
                },
              } as any}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default TransactionsScreen;