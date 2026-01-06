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

// Type untuk icon yang aman
type SafeIconName = keyof typeof Ionicons.glyphMap;

// GUNAKAN WARNA DARI TEMA NAVY BLUE
const PRIMARY_COLOR = Colors.primary; // "#0F172A" - Navy blue gelap
const ACCENT_COLOR = Colors.accent; // "#22D3EE" - Cyan terang
const BACKGROUND_COLOR = Colors.background; // "#0F172A" - Background navy blue gelap
const SURFACE_COLOR = Colors.surface; // "#1E293B" - Permukaan navy blue medium
const TEXT_PRIMARY = Colors.textPrimary; // "#F8FAFC" - Teks utama putih
const TEXT_SECONDARY = Colors.textSecondary; // "#CBD5E1" - Teks sekunder abu-abu muda
const BORDER_COLOR = Colors.border; // "#334155" - Border navy blue lebih terang
const SUCCESS_COLOR = Colors.success; // "#10B981" - Hijau
const WARNING_COLOR = Colors.warning; // "#F59E0B" - Kuning
const ERROR_COLOR = Colors.error; // "#EF4444" - Merah
const INFO_COLOR = Colors.info; // "#3B82F6" - Biru terang
const PURPLE_COLOR = Colors.purple || "#8B5CF6"; // Ungu

const TransactionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state, deleteTransaction } = useAppContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [dateFilter, setDateFilter] = useState<
    "all" | "week" | "month" | "custom"
  >("all");
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState<"start" | "end" | null>(
    null
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  // Cleanup on unmount - FIXED
  useEffect(() => {
    return () => {
      // Close all swipeables
      Object.values(swipeableRefs.current).forEach((ref) => {
        if (ref) {
          try {
            ref.close();
          } catch (error) {
            // Ignore errors on cleanup
          }
        }
      });
      // Clear refs
      swipeableRefs.current = {};
    };
  }, []);

  // Helper untuk mendapatkan icon yang aman
  const getSafeIcon = (iconName: string): SafeIconName => {
    const defaultIcon: SafeIconName = "receipt-outline";
    if (iconName in Ionicons.glyphMap) {
      return iconName as SafeIconName;
    }
    return defaultIcon;
  };

  // Category icons - FIXED dengan icon yang valid
  const getCategoryIcon = (category: string): SafeIconName => {
    const icons: Record<string, SafeIconName> = {
      Makanan: "restaurant-outline",
      Transportasi: "car-outline",
      Belanja: "cart-outline",
      Hiburan: "film-outline",
      Kesehatan: "medical-outline",
      Pendidikan: "school-outline",
      Gaji: "cash-outline",
      Investasi: "trending-up-outline",
      Lainnya: "ellipsis-horizontal-outline",
    };
    return icons[category] || "receipt-outline";
  };

  // Filter transactions - SINGLE USER VERSION (tidak perlu filter userId)
  const filteredTransactions = useMemo(() => {
    let filtered = [...state.transactions];

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    // Filter by date - FIXED logic
    if (dateFilter !== "all") {
      const now = new Date();
      now.setHours(23, 59, 59, 999); // End of day

      let startDate = new Date();

      switch (dateFilter) {
        case "week":
          startDate.setDate(now.getDate() - 6); // 7 hari termasuk hari ini
          startDate.setHours(0, 0, 0, 0);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "custom":
          if (customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            filtered = filtered.filter((t) => {
              try {
                const transDate = new Date(t.date);
                transDate.setHours(0, 0, 0, 0);
                return transDate >= start && transDate <= end;
              } catch (error) {
                return false; // Skip invalid dates
              }
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
          } catch (error) {
            return false; // Skip invalid dates
          }
        });
      }
    }

    // Filter by search query - FIXED
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
        } catch (error) {
          return false; // Skip jika ada error
        }
      });
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      try {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } catch (error) {
        return 0; // Jika error date, tetap di posisi
      }
    });
  }, [
    state.transactions,
    filterType,
    dateFilter,
    searchQuery,
    customStartDate,
    customEndDate,
  ]);

  // Group transactions by date (day) - FIXED dengan error handling
  const groupedByDay = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};

    filteredTransactions.forEach((transaction) => {
      try {
        const date = new Date(transaction.date);
        if (isNaN(date.getTime())) {
          console.warn("Invalid date in transaction:", transaction.date);
          return;
        }

        const dayKey = date.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        if (!groups[dayKey]) {
          groups[dayKey] = [];
        }
        groups[dayKey].push(transaction);
      } catch (error) {
        console.warn("Error grouping transaction:", error);
      }
    });

    return groups;
  }, [filteredTransactions]);

  // Calculate totals - FIXED dengan safeNumber
  const totals = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0);

    const totalExpense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0);

    const balance = safeNumber(totalIncome - totalExpense);

    return {
      totalIncome: safeNumber(totalIncome),
      totalExpense: safeNumber(totalExpense),
      balance,
    };
  }, [filteredTransactions]);

  // Handle delete transaction - SINGLE USER VERSION (tidak perlu cek userId)
  const handleDelete = async (transactionId: string) => {
    const swipeable = swipeableRefs.current[transactionId];
    if (swipeable) {
      try {
        swipeable.close();
      } catch (error) {
        // Ignore close errors
      }
    }

    // ✅ SINGLE USER: Tidak perlu cek userId
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

  const handleEdit = (transaction: Transaction) => {
    const swipeable = swipeableRefs.current[transaction.id];
    if (swipeable) {
      try {
        swipeable.close();
      } catch (error) {
        // Ignore close errors
      }
    }

    navigation.navigate("AddTransaction", {
      editMode: true,
      transactionData: transaction,
    });
  };

  // Render swipe actions - FIXED styling dengan tema navy blue
  // Render swipe actions - FIXED styling dengan tema navy blue
  const renderRightActions = (transaction: Transaction) => (
    <View style={tw`flex-row w-24 h-11/12 my-2 rounded-xl overflow-hidden`}>
      <TouchableOpacity
        style={[
          tw`flex-1 justify-center items-center`,
          { backgroundColor: ACCENT_COLOR },
        ]}
        onPress={() => handleEdit(transaction)}
      >
        <Ionicons name="pencil-outline" size={18} color="#FFFFFF" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          tw`flex-1 justify-center items-center`,
          { backgroundColor: ERROR_COLOR },
        ]}
        onPress={() => handleDelete(transaction.id)}
      >
        <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  // Format date for display - FIXED dengan error handling
  const formatDisplayDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return "Hari Ini";
      } else if (date.toDateString() === yesterday.toDateString()) {
        return "Kemarin";
      } else {
        return date.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });
      }
    } catch (error) {
      return dateString;
    }
  };

  // Date filter label - FIXED
  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case "week":
        return "7 Hari";
      case "month":
        return "Bulan Ini";
      case "custom":
        if (customStartDate && customEndDate) {
          try {
            return `${customStartDate.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
            })}-${customEndDate.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
            })}`;
          } catch (error) {
            return "Tanggal";
          }
        }
        return "Tanggal";
      default:
        return "Semua";
    }
  };

  // Handle calendar date select - FIXED
  const handleDateSelect = (day: any) => {
    try {
      const selectedDate = new Date(day.dateString);
      if (isNaN(selectedDate.getTime())) {
        Alert.alert("Error", "Tanggal tidak valid");
        return;
      }

      if (showCalendar === "start") {
        setCustomStartDate(selectedDate);
        // Jika end date sebelum start date, update end date
        if (selectedDate > customEndDate) {
          setCustomEndDate(selectedDate);
        }
      } else if (showCalendar === "end") {
        setCustomEndDate(selectedDate);
        // Jika start date setelah end date, update start date
        if (selectedDate < customStartDate) {
          setCustomStartDate(selectedDate);
        }
      }
    } catch (error) {
      console.error("Date select error:", error);
      Alert.alert("Error", "Gagal memilih tanggal");
    } finally {
      setShowCalendar(null);
    }
  };

  // Reset date filter
  const resetDateFilter = () => {
    setDateFilter("all");
    const today = new Date();
    setCustomStartDate(today);
    setCustomEndDate(today);
  };

  // Apply filter
  const applyFilter = () => {
    if (dateFilter === "custom") {
      if (customStartDate > customEndDate) {
        Alert.alert("Error", "Tanggal mulai tidak boleh setelah tanggal akhir");
        return;
      }
    }
    setShowFilterModal(false);
  };

  // Format date for Calendar markedDates - FIXED
  const formatDateForCalendar = (date: Date): string => {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (error) {
      return new Date().toISOString().split("T")[0];
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <View style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
      {/* Minimal Header */}
      <View
        style={[
          tw`px-4 pt-3 pb-3`,
          {
            backgroundColor: SURFACE_COLOR,
            borderBottomWidth: 1,
            borderBottomColor: BORDER_COLOR,
          },
        ]}
      >
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <View>
            <Text style={[tw`text-lg font-bold`, { color: TEXT_PRIMARY }]}>
              Transaksi
            </Text>
            <Text style={[tw`text-xs mt-0.5`, { color: TEXT_SECONDARY }]}>
              {filteredTransactions.length} transaksi
            </Text>
          </View>
          <TouchableOpacity
            style={[
              tw`w-9 h-9 rounded-lg justify-center items-center`,
              {
                backgroundColor: Colors.surfaceLight,
              },
            ]}
            onPress={() => navigation.navigate("AddTransaction")}
          >
            <Ionicons name="add" size={18} color={ACCENT_COLOR} />
          </TouchableOpacity>
        </View>

        {/* Search Bar - Compact */}
        <View style={tw`flex-row items-center mb-2`}>
          <View
            style={[
              tw`flex-1 flex-row items-center rounded-lg px-3 py-2`,
              {
                backgroundColor: Colors.surfaceLight,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={16}
              color={Colors.textTertiary}
            />
            <TextInput
              style={[tw`flex-1 text-sm ml-2`, { color: TEXT_PRIMARY }]}
              placeholder="Cari transaksi..."
              placeholderTextColor={Colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={Colors.textTertiary}
                />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            style={[
              tw`ml-2 w-9 h-9 rounded-lg justify-center items-center`,
              {
                backgroundColor: Colors.surfaceLight,
              },
            ]}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="filter-outline" size={16} color={TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>

        {/* Quick Filter Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={tw`-mx-1`}
        >
          <View style={tw`flex-row px-1`}>
            <TouchableOpacity
              style={[
                tw`mr-2 px-3 py-1.5 rounded-full`,
                filterType === "all"
                  ? { backgroundColor: ACCENT_COLOR }
                  : { backgroundColor: Colors.surfaceLight },
              ]}
              onPress={() => setFilterType("all")}
            >
              <Text
                style={[
                  tw`text-xs`,
                  filterType === "all"
                    ? { color: "#FFFFFF", fontWeight: "500" }
                    : { color: TEXT_SECONDARY },
                ]}
              >
                Semua
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                tw`mr-2 px-3 py-1.5 rounded-full flex-row items-center`,
                filterType === "income"
                  ? {
                      backgroundColor: Colors.success + "20",
                      borderWidth: 1,
                      borderColor: Colors.success + "40",
                    }
                  : { backgroundColor: Colors.surfaceLight },
              ]}
              onPress={() => setFilterType("income")}
            >
              <Ionicons
                name="arrow-down-outline"
                size={12}
                color={filterType === "income" ? SUCCESS_COLOR : TEXT_SECONDARY}
              />
              <Text
                style={[
                  tw`text-xs ml-1`,
                  filterType === "income"
                    ? { color: SUCCESS_COLOR, fontWeight: "500" }
                    : { color: TEXT_SECONDARY },
                ]}
              >
                Pemasukan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                tw`mr-2 px-3 py-1.5 rounded-full flex-row items-center`,
                filterType === "expense"
                  ? {
                      backgroundColor: Colors.error + "20",
                      borderWidth: 1,
                      borderColor: Colors.error + "40",
                    }
                  : { backgroundColor: Colors.surfaceLight },
              ]}
              onPress={() => setFilterType("expense")}
            >
              <Ionicons
                name="arrow-up-outline"
                size={12}
                color={filterType === "expense" ? ERROR_COLOR : TEXT_SECONDARY}
              />
              <Text
                style={[
                  tw`text-xs ml-1`,
                  filterType === "expense"
                    ? { color: ERROR_COLOR, fontWeight: "500" }
                    : { color: TEXT_SECONDARY },
                ]}
              >
                Pengeluaran
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Compact Summary Cards */}
      <View
        style={[
          tw`px-4 py-2`,
          {
            backgroundColor: SURFACE_COLOR,
            borderBottomWidth: 1,
            borderBottomColor: BORDER_COLOR,
          },
        ]}
      >
        <View style={tw`flex-row justify-between items-center`}>
          <View style={tw`items-center flex-1`}>
            <Text style={[tw`text-xs mb-0.5`, { color: TEXT_SECONDARY }]}>
              Saldo
            </Text>
            <Text style={[tw`text-sm font-bold`, { color: TEXT_PRIMARY }]}>
              {formatCurrency(totals.balance)}
            </Text>
          </View>
          <View style={[tw`w-px h-6`, { backgroundColor: BORDER_COLOR }]} />
          <View style={tw`items-center flex-1`}>
            <Text style={[tw`text-xs mb-0.5`, { color: SUCCESS_COLOR }]}>
              Pemasukan
            </Text>
            <Text style={[tw`text-sm font-bold`, { color: SUCCESS_COLOR }]}>
              {formatCurrency(totals.totalIncome)}
            </Text>
          </View>
          <View style={[tw`w-px h-6`, { backgroundColor: BORDER_COLOR }]} />
          <View style={tw`items-center flex-1`}>
            <Text style={[tw`text-xs mb-0.5`, { color: ERROR_COLOR }]}>
              Pengeluaran
            </Text>
            <Text style={[tw`text-sm font-bold`, { color: ERROR_COLOR }]}>
              {formatCurrency(totals.totalExpense)}
            </Text>
          </View>
        </View>
      </View>

      {/* Transactions List - Minimal */}
      <ScrollView
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-20`}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[ACCENT_COLOR]}
            tintColor={ACCENT_COLOR}
          />
        }
      >
        {Object.entries(groupedByDay).length > 0 ? (
          Object.entries(groupedByDay).map(([day, transactions]) => (
            <View key={day} style={tw`mb-3`}>
              {/* Day Header */}
              <View style={tw`px-4 mb-2 mt-3`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text
                    style={[tw`text-sm font-medium`, { color: TEXT_PRIMARY }]}
                  >
                    {day}
                  </Text>
                </View>
              </View>

              {/* Transactions */}
              <View style={tw`px-2`}>
                {transactions.map((transaction) => (
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
                    overshootRight={false}
                    friction={2}
                    containerStyle={tw`mb-1.5 mx-1`}
                    onSwipeableWillOpen={() => {
                      // Close other swipeables
                      Object.keys(swipeableRefs.current).forEach((id) => {
                        if (
                          id !== transaction.id &&
                          swipeableRefs.current[id]
                        ) {
                          try {
                            swipeableRefs.current[id]?.close();
                          } catch (error) {
                            // Ignore close errors
                          }
                        }
                      });
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        tw`p-3 rounded-xl`,
                        {
                          backgroundColor: SURFACE_COLOR,
                          borderWidth: 1,
                          borderColor: BORDER_COLOR,
                        },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => handleEdit(transaction)}
                      onLongPress={() => handleDelete(transaction.id)}
                      delayLongPress={500}
                    >
                      <View style={tw`flex-row items-center justify-between`}>
                        <View style={tw`flex-row items-center flex-1`}>
                          <View
                            style={[
                              tw`w-10 h-10 rounded-lg justify-center items-center mr-3`,
                              transaction.type === "income"
                                ? { backgroundColor: Colors.success + "20" }
                                : { backgroundColor: Colors.error + "20" },
                            ]}
                          >
                            <Ionicons
                              name={getCategoryIcon(transaction.category)}
                              size={18}
                              color={
                                transaction.type === "income"
                                  ? SUCCESS_COLOR
                                  : ERROR_COLOR
                              }
                            />
                          </View>

                          <View style={tw`flex-1`}>
                            <View
                              style={tw`flex-row items-center justify-between mb-0.5`}
                            >
                              <Text
                                style={[
                                  tw`text-sm font-medium`,
                                  { color: TEXT_PRIMARY },
                                ]}
                              >
                                {transaction.category}
                              </Text>
                              <Text
                                style={[
                                  tw`text-sm font-medium`,
                                  transaction.type === "income"
                                    ? { color: SUCCESS_COLOR }
                                    : { color: ERROR_COLOR },
                                ]}
                              >
                                {transaction.type === "income" ? "+" : "-"}
                                {formatCurrency(safeNumber(transaction.amount))}
                              </Text>
                            </View>
                            <Text
                              style={[
                                tw`text-xs mb-0.5`,
                                { color: TEXT_SECONDARY },
                              ]}
                              numberOfLines={1}
                            >
                              {transaction.description || "Tidak ada deskripsi"}
                            </Text>
                            <View style={tw`flex-row items-center`}>
                              <Text
                                style={[
                                  tw`text-xs`,
                                  { color: Colors.textTertiary },
                                ]}
                              >
                                {formatDisplayDate(transaction.date)}
                              </Text>
                              <View
                                style={[
                                  tw`w-1 h-1 rounded-full mx-2`,
                                  { backgroundColor: BORDER_COLOR },
                                ]}
                              />
                              <View
                                style={[
                                  tw`px-1.5 py-0.5 rounded-full`,
                                  transaction.type === "income"
                                    ? { backgroundColor: Colors.success + "20" }
                                    : { backgroundColor: Colors.error + "20" },
                                ]}
                              >
                                <Text
                                  style={[
                                    tw`text-xs`,
                                    transaction.type === "income"
                                      ? { color: SUCCESS_COLOR }
                                      : { color: ERROR_COLOR },
                                  ]}
                                >
                                  {transaction.type === "income"
                                    ? "Masuk"
                                    : "Keluar"}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Swipeable>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={tw`items-center justify-center py-16 px-10`}>
            <View
              style={[
                tw`w-20 h-20 rounded-full justify-center items-center mb-4`,
                { backgroundColor: Colors.surfaceLight },
              ]}
            >
              <Ionicons
                name={
                  searchQuery || filterType !== "all" || dateFilter !== "all"
                    ? "search-outline"
                    : "receipt-outline"
                }
                size={32}
                color={Colors.textTertiary}
              />
            </View>
            <Text
              style={[
                tw`text-base font-medium text-center mb-1.5`,
                { color: TEXT_PRIMARY },
              ]}
            >
              {searchQuery || filterType !== "all" || dateFilter !== "all"
                ? "Transaksi tidak ditemukan"
                : "Belum ada transaksi"}
            </Text>
            <Text
              style={[tw`text-sm text-center mb-5`, { color: TEXT_SECONDARY }]}
            >
              {searchQuery || filterType !== "all" || dateFilter !== "all"
                ? "Coba kata kunci lain atau hapus filter"
                : "Mulai catat transaksi pertama Anda"}
            </Text>
            {!searchQuery && filterType === "all" && dateFilter === "all" && (
              <TouchableOpacity
                style={[
                  tw`px-5 py-2.5 rounded-lg flex-row items-center`,
                  { backgroundColor: ACCENT_COLOR },
                ]}
                onPress={() => navigation.navigate("AddTransaction")}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={tw`text-white text-sm font-medium ml-1.5`}>
                  Tambah Transaksi
                </Text>
              </TouchableOpacity>
            )}
            {(searchQuery || filterType !== "all" || dateFilter !== "all") && (
              <TouchableOpacity
                style={[
                  tw`mt-3 px-4 py-2 rounded-lg flex-row items-center`,
                  {
                    borderWidth: 1,
                    borderColor: BORDER_COLOR,
                  },
                ]}
                onPress={() => {
                  setSearchQuery("");
                  setFilterType("all");
                  resetDateFilter();
                }}
              >
                <Ionicons
                  name="close-outline"
                  size={16}
                  color={TEXT_SECONDARY}
                />
                <Text
                  style={[
                    tw`text-sm font-medium ml-1.5`,
                    { color: TEXT_PRIMARY },
                  ]}
                >
                  Hapus Filter
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add FAB - Smaller */}
      <TouchableOpacity
        style={[
          tw`absolute bottom-5 right-4 w-14 h-14 rounded-xl justify-center items-center shadow-lg`,
          { backgroundColor: ACCENT_COLOR },
        ]}
        onPress={() => navigation.navigate("AddTransaction")}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={22} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
          <View
            style={[
              tw`rounded-t-3xl p-5 max-h-3/4`,
              { backgroundColor: SURFACE_COLOR },
            ]}
          >
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={[tw`text-lg font-bold`, { color: TEXT_PRIMARY }]}>
                Filter Tanggal
              </Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons
                  name="close-outline"
                  size={22}
                  color={TEXT_SECONDARY}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={tw`max-h-64`}
            >
              <View style={tw`mb-4`}>
                <Text style={[tw`text-sm mb-2`, { color: TEXT_SECONDARY }]}>
                  Rentang Waktu
                </Text>
                <View style={tw`flex-row flex-wrap gap-2`}>
                  {[
                    { key: "all", label: "Semua Waktu" },
                    { key: "week", label: "7 Hari Terakhir" },
                    { key: "month", label: "Bulan Ini" },
                    { key: "custom", label: "Tanggal Kustom" },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        tw`px-3 py-2 rounded-full`,
                        dateFilter === option.key
                          ? { backgroundColor: ACCENT_COLOR }
                          : { backgroundColor: Colors.surfaceLight },
                      ]}
                      onPress={() => setDateFilter(option.key as any)}
                    >
                      <Text
                        style={[
                          tw`text-sm`,
                          dateFilter === option.key
                            ? { color: "#FFFFFF", fontWeight: "500" }
                            : { color: TEXT_PRIMARY },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {dateFilter === "custom" && (
                <View style={tw`mb-4`}>
                  <Text style={[tw`text-sm mb-2`, { color: TEXT_SECONDARY }]}>
                    Tanggal Kustom
                  </Text>
                  <View style={tw`flex-row gap-3`}>
                    <View style={tw`flex-1`}>
                      <Text
                        style={[
                          tw`text-xs mb-1`,
                          { color: Colors.textTertiary },
                        ]}
                      >
                        Dari Tanggal
                      </Text>
                      <TouchableOpacity
                        style={[
                          tw`border rounded-lg p-3`,
                          { borderColor: BORDER_COLOR },
                        ]}
                        onPress={() => setShowCalendar("start")}
                      >
                        <Text style={{ color: TEXT_PRIMARY }}>
                          {customStartDate.toLocaleDateString("id-ID")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={tw`flex-1`}>
                      <Text
                        style={[
                          tw`text-xs mb-1`,
                          { color: Colors.textTertiary },
                        ]}
                      >
                        Sampai Tanggal
                      </Text>
                      <TouchableOpacity
                        style={[
                          tw`border rounded-lg p-3`,
                          { borderColor: BORDER_COLOR },
                        ]}
                        onPress={() => setShowCalendar("end")}
                      >
                        <Text style={{ color: TEXT_PRIMARY }}>
                          {customEndDate.toLocaleDateString("id-ID")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              <View style={tw`flex-row gap-3 mt-4 mb-2`}>
                <TouchableOpacity
                  style={[
                    tw`flex-1 rounded-xl py-3 items-center`,
                    {
                      borderWidth: 1,
                      borderColor: BORDER_COLOR,
                    },
                  ]}
                  onPress={() => {
                    resetDateFilter();
                    setShowFilterModal(false);
                  }}
                >
                  <Text style={[tw`font-medium`, { color: TEXT_PRIMARY }]}>
                    Reset & Tutup
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    tw`flex-1 rounded-xl py-3 items-center`,
                    { backgroundColor: ACCENT_COLOR },
                  ]}
                  onPress={applyFilter}
                >
                  <Text style={tw`text-white font-medium`}>Terapkan</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendar(null)}
      >
        <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
          <View
            style={[tw`rounded-t-3xl p-4`, { backgroundColor: SURFACE_COLOR }]}
          >
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={[tw`text-lg font-bold`, { color: TEXT_PRIMARY }]}>
                {showCalendar === "start"
                  ? "Pilih Tanggal Mulai"
                  : "Pilih Tanggal Akhir"}
              </Text>
              <TouchableOpacity onPress={() => setShowCalendar(null)}>
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={TEXT_SECONDARY}
                />
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
                  selectedTextColor: "#FFFFFF",
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
                backgroundColor: SURFACE_COLOR,
                calendarBackground: SURFACE_COLOR,
                textSectionTitleColor: TEXT_SECONDARY,
                selectedDayBackgroundColor: ACCENT_COLOR,
                selectedDayTextColor: "#FFFFFF",
                todayTextColor: ACCENT_COLOR,
                dayTextColor: TEXT_PRIMARY,
                textDisabledColor: Colors.textTertiary,
                dotColor: ACCENT_COLOR,
                selectedDotColor: "#FFFFFF",
                arrowColor: ACCENT_COLOR,
                monthTextColor: ACCENT_COLOR,
                textMonthFontWeight: "bold",
                textDayFontSize: 16,
                textMonthFontSize: 18,
                "stylesheet.calendar.main": {
                  week: {
                    marginTop: 0,
                    marginBottom: 0,
                    flexDirection: "row",
                    justifyContent: "space-around",
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
