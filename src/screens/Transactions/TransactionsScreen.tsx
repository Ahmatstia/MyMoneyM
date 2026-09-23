// File: src/screens/TransactionsScreen.tsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  SectionList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Dimensions,
  Modal,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Swipeable } from "react-native-gesture-handler";
import { Calendar } from "react-native-calendars";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import {
  formatCurrency,
  safeNumber,
  getMonthlyCycleRange,
  formatToDateKey,
} from "../../utils/calculations";
import { Transaction } from "../../types";
import { useTheme } from '../../theme/ThemeContext';
import { DEFAULT_CATEGORIES, ALL_SYSTEM_CATEGORIES, CategoryItem } from "../../components/CategoryPickerModal";

const { width } = Dimensions.get("window");

type SafeIconName = keyof typeof Ionicons.glyphMap;

// ─── Theme colors (tidak diubah) ──────────────────────────────────────────────
// ─── Design tokens (konsisten dengan HomeScreen & WalletsScreen) ──────────────
const CARD_RADIUS  = 16;
const INNER_RADIUS = 12;
const CARD_PAD     = 14;
const SECTION_GAP  = 16;
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
  const [filterType, setFilterType]           = useState<"all" | "income" | "expense" | "transfer">("all");
  const [walletFilterId, setWalletFilterId]   = useState<string>("all");
  const [dateFilter, setDateFilter]           = useState<"all" | "today" | "week" | "month" | "custom">("month");
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate]     = useState<Date>(new Date());
  const [showCalendar, setShowCalendar]       = useState<"start" | "end" | null>(null);
  const [isRefreshing, setIsRefreshing]       = useState(false);
  const [searchFocused, setSearchFocused]     = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);

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
      ...(state.customCategories || []).map((c) => ({
        id: c.id, name: c.name, icon: c.icon, color: c.color,
        isCustom: true as const, customId: c.id,
      })),
      ...ALL_SYSTEM_CATEGORIES,
    ];
    const found = all.find((c) => c.name === categoryName || (categoryName === "Gaji" && c.id === "pemasukan"));
    return found || { id: "unknown", name: categoryName, icon: "receipt-outline", color: colors.gray400 };
  };

  const getWalletName = (walletId?: string) =>
    state.wallets.find((wallet) => wallet.id === walletId)?.name || "Dompet Utama";

  const filteredTransactions = useMemo(() => {
    let filtered = [...state.transactions];

    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    if (walletFilterId !== "all") {
      filtered = filtered.filter(
        (transaction) =>
          transaction.walletId === walletFilterId ||
          transaction.toWalletId === walletFilterId,
      );
    }

    if (dateFilter !== "all") {
      const now = new Date();
      let startDateStr = "";
      let endDateStr = "";

      switch (dateFilter) {
        case "today": {
          startDateStr = formatToDateKey(now);
          endDateStr = startDateStr;
          break;
        }
        case "week": {
          const past = new Date(now);
          past.setDate(now.getDate() - 6);
          startDateStr = formatToDateKey(past);
          endDateStr = formatToDateKey(now);
          break;
        }
        case "month": {
          if (state.paydayCutoff && state.paydayCutoff > 1) {
            const cycleRange = getMonthlyCycleRange(state.paydayCutoff, now);
            startDateStr = formatToDateKey(cycleRange.startDate);
            endDateStr = formatToDateKey(cycleRange.endDate);
          } else {
            const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            startDateStr = formatToDateKey(startMonth);
            endDateStr = formatToDateKey(endMonth);
          }
          break;
        }
        case "custom": {
          if (customStartDate && customEndDate) {
            startDateStr = formatToDateKey(new Date(customStartDate));
            endDateStr = formatToDateKey(new Date(customEndDate));
          }
          break;
        }
      }

      if (startDateStr && endDateStr) {
        filtered = filtered.filter((t) => {
          try {
            const txDate = (t?.date || "").slice(0, 10);
            return txDate >= startDateStr && txDate <= endDateStr;
          } catch {
            return false;
          }
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
            getWalletName(t.walletId).toLowerCase().includes(query) ||
            (t.toWalletId && getWalletName(t.toWalletId).toLowerCase().includes(query)) ||
            amountString.includes(query) ||
            t.date.toLowerCase().includes(query)
          );
        } catch { return false; }
      });
    }

    return filtered.sort((a, b) => {
      try {
        const timeDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (timeDiff !== 0) return timeDiff;
        const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bCreated - aCreated;
      } catch { return 0; }
    });
  }, [state.transactions, state.wallets, filterType, walletFilterId, dateFilter, searchQuery, customStartDate, customEndDate]);

  interface TransactionSection {
    title: string;
    dayNet: number;
    data: Transaction[];
  }

  const sections = useMemo<TransactionSection[]>(() => {
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

    return Object.entries(groups).map(([day, transactions]) => {
      const dayIncome  = transactions.filter((t) => t.type === "income") .reduce((s, t) => s + safeNumber(t.amount), 0);
      const dayNormalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + safeNumber(t.amount), 0);
      const dayTransferFees = transactions.filter((t) => t.type === "transfer").reduce((s, t) => s + safeNumber(t.adminFee), 0);
      const dayExpense = dayNormalExpense + dayTransferFees;
      const dayNet     = dayIncome - dayExpense;
      return {
        title: day,
        dayNet,
        data: transactions,
      };
    });
  }, [filteredTransactions]);

  const totals = useMemo(() => {
    const totalIncome  = filteredTransactions.filter((t) => t.type === "income") .reduce((sum, t) => sum + safeNumber(t.amount), 0);
    const normalExpense = filteredTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + safeNumber(t.amount), 0);
    const transferFees = filteredTransactions.filter((t) => t.type === "transfer").reduce((sum, t) => sum + safeNumber(t.adminFee), 0);
    const totalExpense = normalExpense + transferFees;
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
      case "today": return "Hari Ini";
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
    setDateFilter("month");
    const today = new Date();
    setCustomStartDate(today);
    setCustomEndDate(today);
  };

  const resetAllFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setWalletFilterId("all");
    resetDateFilter();
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
    } catch { return formatToDateKey(new Date()); }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const hasActiveFilter =
    Boolean(searchQuery || filterType !== "all" || walletFilterId !== "all" || dateFilter !== "month");

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
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {navigation.canGoBack() && (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ marginRight: 10, padding: 4 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Kembali"
              >
                <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            )}
            <Text
              style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "700" }}
            >
              Transaksi
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 11,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: `${colors.accent}15`,
                borderWidth: 1,
                borderColor: `${colors.accent}30`,
                marginRight: 8,
              }}
              onPress={() => navigation.navigate("RecurringTransactions")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="repeat-outline"
                size={13}
                color={colors.accent}
                style={{ marginRight: 4 }}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: colors.accent,
                }}
              >
                Rutin
              </Text>
            </TouchableOpacity>

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
            { key: "transfer", label: "Transfer" },
          ].map((item) => {
            const isActive = filterType === item.key;
            const activeColor =
              item.key === "income"
                ? colors.success
                : item.key === "expense"
                ? colors.error
                : item.key === "transfer"
                ? colors.accent
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

        {state.wallets.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 10 }}>
            {[{ id: "all", name: "Semua Rekening", icon: "wallet-outline", color: colors.accent }, ...state.wallets].map((wallet) => {
              const isActive = walletFilterId === wallet.id;
              return (
                <TouchableOpacity key={wallet.id} onPress={() => setWalletFilterId(wallet.id)} activeOpacity={0.7} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, backgroundColor: isActive ? `${wallet.color}20` : colors.surface, borderWidth: 1, borderColor: isActive ? wallet.color : CARD_BORDER }}>
                  <Ionicons name={(wallet.icon as any) || "wallet-outline"} size={12} color={isActive ? wallet.color : colors.gray400} style={{ marginRight: 5 }} />
                  <Text numberOfLines={1} style={{ maxWidth: 130, fontSize: 11, fontWeight: isActive ? "700" : "500", color: isActive ? wallet.color : colors.gray400 }}>{wallet.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Quick Date Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingTop: 10 }}
        >
          {[
            { key: "today",  label: "Hari Ini", icon: "today-outline" },
            { key: "week",   label: "7 Hari",   icon: "time-outline" },
            { key: "month",  label: "Bulan Ini", icon: "calendar-outline" },
            { key: "custom", label: "Rentang 📅", icon: "calendar" },
            { key: "all",    label: "Semua",    icon: "infinite-outline" },
          ].map((chip) => {
            const isActive = dateFilter === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: isActive ? `${colors.accent}22` : colors.surface,
                  borderWidth: 1,
                  borderColor: isActive ? colors.accent : CARD_BORDER,
                }}
                onPress={() => {
                  if (chip.key === "custom") {
                    setShowFilterModal(true);
                  } else {
                    setDateFilter(chip.key as any);
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={chip.icon as any}
                  size={12}
                  color={isActive ? colors.accent : colors.gray400}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: isActive ? "700" : "500",
                    color: isActive ? colors.accent : colors.gray400,
                  }}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Virtualized SectionList ───────────────────────────────────────── */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === "android"}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
            {/* ── Summary Card (Neo-Fintech Ambient Sheen) ─────────────────────────────────────────── */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: CARD_RADIUS,
                borderWidth: 1,
                borderColor: `${CARD_BORDER}`,
                padding: 12,
                marginBottom: 4,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Subtle Gradient Sheen */}
              <LinearGradient
                colors={[`${totals.balance >= 0 ? colors.success : colors.error}15`, colors.surface]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              />

              {/* Holographic Watermark Ring */}
              <View
                style={{
                  position: "absolute",
                  right: -12,
                  top: -12,
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  borderWidth: 1.2,
                  borderColor: `${totals.balance >= 0 ? colors.success : colors.error}18`,
                }}
              />

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" }}>
                  Ringkasan Transaksi ({getDateFilterLabel()}{walletFilterId !== "all" ? ` · ${getWalletName(walletFilterId)}` : ""})
                </Text>
                <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "600" }}>
                  {filteredTransactions.length} transaksi
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {/* Income */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success, marginRight: 5 }} />
                    <Text style={{ color: colors.gray400, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.3, fontWeight: "600" }}>
                      Pemasukan
                    </Text>
                  </View>
                  <Text style={{ color: colors.success, fontSize: 13, fontWeight: "800", letterSpacing: -0.2 }} numberOfLines={1}>
                    +{formatCurrency(totals.totalIncome)}
                  </Text>
                </View>

                <View style={{ width: 1, height: 26, backgroundColor: `${CARD_BORDER}60`, marginHorizontal: 6 }} />

                {/* Expense */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.error, marginRight: 5 }} />
                    <Text style={{ color: colors.gray400, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.3, fontWeight: "600" }}>
                      Pengeluaran
                    </Text>
                  </View>
                  <Text style={{ color: colors.error, fontSize: 13, fontWeight: "800", letterSpacing: -0.2 }} numberOfLines={1}>
                    -{formatCurrency(totals.totalExpense)}
                  </Text>
                </View>

                <View style={{ width: 1, height: 26, backgroundColor: `${CARD_BORDER}60`, marginHorizontal: 6 }} />

                {/* Net */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: totals.balance >= 0 ? colors.accent : colors.warning, marginRight: 5 }} />
                    <Text style={{ color: colors.gray400, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.3, fontWeight: "600" }}>
                      Selisih
                    </Text>
                  </View>
                  <Text style={{ color: totals.balance >= 0 ? colors.textPrimary : colors.warning, fontSize: 13, fontWeight: "800", letterSpacing: -0.2 }} numberOfLines={1}>
                    {totals.balance >= 0 ? "+" : ""}{formatCurrency(totals.balance)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        }
        renderSectionHeader={({ section: { title, dayNet } }) => (
          <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
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
                {title}
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
          </View>
        )}
        renderItem={({ item: transaction, index, section }) => {
          const isFirst = index === 0;
          const isLast = index === section.data.length - 1;
          const categoryInfo = resolveCategory(transaction.category);
          const isIncome = transaction.type === "income";
          const isTransfer = transaction.type === "transfer";
          const sourceWalletName = getWalletName(transaction.walletId);
          const destinationWalletName = transaction.toWalletId
            ? getWalletName(transaction.toWalletId)
            : "Rekening tujuan";
          const transactionColor = isIncome
            ? colors.success
            : isTransfer
              ? colors.accent
              : colors.error;

          return (
            <View style={{ paddingHorizontal: 18 }}>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderTopLeftRadius: isFirst ? CARD_RADIUS : 0,
                  borderTopRightRadius: isFirst ? CARD_RADIUS : 0,
                  borderBottomLeftRadius: isLast ? CARD_RADIUS : 0,
                  borderBottomRightRadius: isLast ? CARD_RADIUS : 0,
                  borderWidth: 1,
                  borderTopWidth: isFirst ? 1 : 0,
                  borderBottomWidth: isLast ? 1 : 1,
                  borderColor: CARD_BORDER,
                  borderLeftWidth: 3,
                  borderLeftColor: transactionColor,
                  overflow: "hidden",
                }}
              >
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
                      paddingVertical: 10,
                      paddingHorizontal: 13,
                      backgroundColor: colors.surface,
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
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 11,
                        flexShrink: 0,
                        backgroundColor: `${categoryInfo.color}18`,
                      }}
                    >
                      <Ionicons
                        name={resolveCategory(transaction.category).icon as any}
                        size={15}
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
                      <View style={{ flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginTop: 4 }}>
                        <Ionicons name={isTransfer ? "swap-horizontal-outline" : "wallet-outline"} size={11} color={transactionColor} style={{ marginRight: 4 }} />
                        <Text numberOfLines={1} style={{ color: transactionColor, fontSize: 10, fontWeight: "600" }}>
                          {isTransfer ? `${sourceWalletName} → ${destinationWalletName}` : sourceWalletName}
                        </Text>
                      </View>
                      {transaction.subTransactions && transaction.subTransactions.length > 0 && (
                        <TouchableOpacity
                          onPress={() => setSelectedReceiptTx(transaction)}
                          activeOpacity={0.7}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: `${colors.accent}18`,
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            alignSelf: "flex-start",
                            marginTop: 5,
                            borderWidth: 1,
                            borderColor: `${colors.accent}30`,
                          }}
                        >
                          <Ionicons name="receipt-outline" size={11} color={colors.accent} style={{ marginRight: 4 }} />
                          <Text style={{ color: colors.accent, fontSize: 10, fontWeight: "700" }}>
                            Lihat {transaction.subTransactions.length} item struk
                          </Text>
                          <Ionicons name="chevron-forward" size={10} color={colors.accent} style={{ marginLeft: 2 }} />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Amount */}
                    <View
                      style={{
                        alignItems: "flex-end",
                        marginLeft: 8,
                        justifyContent: "center"
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: transactionColor,
                        }}
                      >
                        {transaction.type === "income" ? "+" : "−"}
                        {formatCurrency(
                          safeNumber(transaction.amount)
                        )}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Swipeable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
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
                  ? "Coba kata kunci lain atau pilih filter waktu berbeda"
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
                    Reset Filter ke Bulan Ini
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
      />

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
                { key: "today",  label: "Hari Ini" },
                { key: "week",   label: "7 Hari Terakhir" },
                { key: "month",  label: "Bulan Ini" },
                { key: "custom", label: "Tanggal Kustom" },
                { key: "all",    label: "Semua Waktu" },
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

      {/* Modal Rincian Struk / Item Belanja */}
      <Modal
        visible={!!selectedReceiptTx}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedReceiptTx(null)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(2,6,23,0.75)" }}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setSelectedReceiptTx(null)}
          />
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 20,
              paddingBottom: 36,
              borderTopWidth: 1,
              borderTopColor: CARD_BORDER,
              maxHeight: "80%",
            }}
          >
            {/* Header Modal */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: `${colors.accent}15`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="receipt" size={20} color={colors.accent} />
                </View>
                <View>
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "800" }}>
                    Rincian Struk Belanja
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                    {selectedReceiptTx?.description || selectedReceiptTx?.category} · {selectedReceiptTx ? formatDisplayDate(selectedReceiptTx.date) : ""}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedReceiptTx(null)}>
                <Ionicons name="close-circle" size={24} color={colors.gray400} />
              </TouchableOpacity>
            </View>

            {/* List Item */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280, marginBottom: 16 }}>
              {selectedReceiptTx?.subTransactions?.map((item, index) => (
                <View
                  key={item.id || index}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: `${colors.border}30`,
                  }}
                >
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "600" }}>
                      {item.name}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                      {item.qty || 1}x @ {formatCurrency(item.amount)}
                      {item.note ? ` · ${item.note}` : ""}
                    </Text>
                  </View>
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "700" }}>
                    {formatCurrency(item.amount * (item.qty || 1))}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Total Footer */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: `${colors.accent}12`,
                padding: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: `${colors.accent}25`,
              }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "700" }}>
                Total Belanja ({selectedReceiptTx?.subTransactions?.length || 0} item)
              </Text>
              <Text style={{ color: colors.accent, fontSize: 16, fontWeight: "800" }}>
                {formatCurrency(safeNumber(selectedReceiptTx?.amount))}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default TransactionsScreen;
