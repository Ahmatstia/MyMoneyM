import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Swipeable } from "react-native-gesture-handler";

import { useAppContext } from "../../context/AppContext";
import { formatCurrency } from "../../utils/calculations";
import { RootStackParamList, Transaction } from "../../types";

const TransactionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state, deleteTransaction } = useAppContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const swipeableRefs = React.useRef<{ [key: string]: Swipeable | null }>({});

  // Debug log untuk memantau state
  useEffect(() => {
    console.log("📊 TransactionsScreen mounted");
    console.log("Total transactions in state:", state.transactions.length);
    console.log("First few transactions:", state.transactions.slice(0, 3));
  }, []);

  // Refresh data saat screen focus
  useFocusEffect(
    React.useCallback(() => {
      console.log("🔄 TransactionsScreen focused");
      return () => {
        // Close semua swipeable saat unfocus
        Object.values(swipeableRefs.current).forEach((ref) => {
          if (ref) ref.close();
        });
      };
    }, [])
  );

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...state.transactions];
    console.log(`🔍 Filtering ${filtered.length} transactions`);

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.type === filterType);
      console.log(`After type filter (${filterType}): ${filtered.length}`);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (t) =>
          t.category.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          formatCurrency(t.amount).toLowerCase().includes(query) ||
          t.date.toLowerCase().includes(query)
      );
      console.log(`After search filter: ${filtered.length}`);
    }

    // Sort by date (newest first)
    const sorted = filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    console.log(`✅ Final filtered: ${sorted.length} transactions`);
    return sorted;
  }, [state.transactions, filterType, searchQuery]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};

    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.date).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });

    console.log(`📅 Grouped into ${Object.keys(groups).length} date groups`);
    return groups;
  }, [filteredTransactions]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    console.log(
      `💰 Totals - Income: ${totalIncome}, Expense: ${totalExpense}, Balance: ${balance}`
    );
    return { totalIncome, totalExpense, balance };
  }, [filteredTransactions]);

  const handleDelete = async (transactionId: string) => {
    console.log(`🗑️ Attempting to delete transaction: ${transactionId}`);

    // Close swipeable
    const swipeable = swipeableRefs.current[transactionId];
    if (swipeable) {
      swipeable.close();
    }

    // Cari transaction untuk debug
    const transactionToDelete = state.transactions.find(
      (t) => t.id === transactionId
    );
    console.log("Transaction to delete:", transactionToDelete);

    Alert.alert(
      "Hapus Transaksi",
      "Apakah Anda yakin ingin menghapus transaksi ini?",
      [
        {
          text: "Batal",
          style: "cancel",
          onPress: () => {
            console.log("❌ Deletion cancelled");
          },
        },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            console.log("✅ Confirm delete, calling deleteTransaction...");
            try {
              setIsRefreshing(true);
              await deleteTransaction(transactionId);
              console.log("✅ Transaction deleted successfully");

              // Update refs
              delete swipeableRefs.current[transactionId];
            } catch (error) {
              console.error("❌ Error deleting transaction:", error);
              Alert.alert("Error", "Gagal menghapus transaksi");
            } finally {
              setIsRefreshing(false);
            }
          },
        },
      ]
    );
  };

  const handleEdit = (transaction: Transaction) => {
    console.log(`✏️ Editing transaction: ${transaction.id}`);

    // Close swipeable
    const swipeable = swipeableRefs.current[transaction.id];
    if (swipeable) {
      swipeable.close();
    }

    navigation.navigate("AddTransaction", {
      editMode: true,
      transactionData: transaction,
    });
  };

  const renderRightActions = (transaction: Transaction) => (
    <View style={styles.swipeActions}>
      <TouchableOpacity
        style={styles.editAction}
        onPress={() => handleEdit(transaction)}
      >
        <Ionicons name="pencil" size={20} color="#FFFFFF" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDelete(transaction.id)}
      >
        <Ionicons name="trash" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const formatTransactionDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
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
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  const handleRefresh = async () => {
    console.log("🔄 Manual refresh triggered");
    // Anda bisa menambahkan refresh logic di sini jika diperlukan
  };

  const handleClearSearch = () => {
    console.log("🧹 Clearing search");
    setSearchQuery("");
  };

  const handleClearFilter = () => {
    console.log("🧹 Clearing filter");
    setFilterType("all");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaksi</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, styles.debugButton]}
            onPress={() => {
              console.log("🔍 Current state:", {
                totalTransactions: state.transactions.length,
                filteredTransactions: filteredTransactions.length,
                filterType,
                searchQuery,
                totals,
              });
            }}
          >
            <Ionicons name="bug" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("AddTransaction")}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari transaksi..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType !== "all" && styles.filterButtonActive,
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons
            name="filter"
            size={20}
            color={filterType === "all" ? "#6B7280" : "#4F46E5"}
          />
          {filterType !== "all" && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {filterType === "income" ? "P" : "K"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={[
            styles.statCard,
            filterType === "all" && styles.statCardActive,
          ]}
          onPress={() => setFilterType("all")}
        >
          <Text style={styles.statNumber}>{filteredTransactions.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
          {filterType === "all" && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statCard,
            filterType === "income" && styles.statCardActive,
          ]}
          onPress={() => setFilterType("income")}
        >
          <Text style={[styles.statNumber, styles.incomeStat]}>
            {formatCurrency(totals.totalIncome)}
          </Text>
          <Text style={styles.statLabel}>Pemasukan</Text>
          {filterType === "income" && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statCard,
            filterType === "expense" && styles.statCardActive,
          ]}
          onPress={() => setFilterType("expense")}
        >
          <Text style={[styles.statNumber, styles.expenseStat]}>
            {formatCurrency(totals.totalExpense)}
          </Text>
          <Text style={styles.statLabel}>Pengeluaran</Text>
          {filterType === "expense" && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Clear Filters Button */}
      {(searchQuery || filterType !== "all") && (
        <View style={styles.clearFiltersContainer}>
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={() => {
              handleClearSearch();
              handleClearFilter();
            }}
          >
            <Ionicons name="close-circle" size={16} color="#6B7280" />
            <Text style={styles.clearFiltersText}>Bersihkan filter</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Transactions List */}
      <ScrollView
        style={styles.transactionsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={["#4F46E5"]}
            tintColor="#4F46E5"
          />
        }
      >
        {Object.entries(groupedTransactions).map(([date, transactions]) => (
          <View key={date} style={styles.dateGroup}>
            <View style={styles.dateHeader}>
              <Text style={styles.dateTitle}>{date}</Text>
              <Text style={styles.dateAmount}>
                {formatCurrency(
                  transactions.reduce((sum, t) => sum + t.amount, 0)
                )}
              </Text>
            </View>

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
                containerStyle={styles.swipeableContainer}
                onSwipeableWillOpen={() => {
                  // Close other swipeables
                  Object.keys(swipeableRefs.current).forEach((id) => {
                    if (id !== transaction.id && swipeableRefs.current[id]) {
                      swipeableRefs.current[id]?.close();
                    }
                  });
                }}
              >
                <TouchableOpacity
                  style={styles.transactionItem}
                  activeOpacity={0.7}
                  onPress={() => handleEdit(transaction)}
                  onLongPress={() => {
                    console.log("ℹ️ Transaction details:", transaction);
                  }}
                >
                  <View
                    style={[
                      styles.transactionIcon,
                      transaction.type === "income"
                        ? styles.incomeIcon
                        : styles.expenseIcon,
                    ]}
                  >
                    <Ionicons
                      name={
                        transaction.type === "income"
                          ? "arrow-down"
                          : "arrow-up"
                      }
                      size={20}
                      color={
                        transaction.type === "income" ? "#10B981" : "#DC2626"
                      }
                    />
                  </View>

                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionCategory} numberOfLines={1}>
                      {transaction.category}
                    </Text>
                    <Text
                      style={styles.transactionDescription}
                      numberOfLines={1}
                    >
                      {transaction.description || "Tidak ada deskripsi"}
                    </Text>
                    <Text style={styles.transactionTime}>
                      {formatTransactionDate(transaction.date)}
                      {transaction.createdAt &&
                        ` • ID: ${transaction.id.substring(0, 8)}`}
                    </Text>
                  </View>

                  <View style={styles.transactionAmountContainer}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        transaction.type === "income"
                          ? styles.incomeAmount
                          : styles.expenseAmount,
                      ]}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Swipeable>
            ))}
          </View>
        ))}

        {filteredTransactions.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name={searchQuery ? "search-outline" : "receipt-outline"}
              size={64}
              color="#D1D5DB"
            />
            <Text style={styles.emptyTitle}>
              {searchQuery ? "Tidak ditemukan" : "Belum ada transaksi"}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? "Coba dengan kata kunci lain"
                : "Tambahkan transaksi pertama Anda"}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate("AddTransaction")}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Tambah Transaksi</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Debug Info */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              Total: {state.transactions.length} | Filtered:{" "}
              {filteredTransactions.length}
            </Text>
            <Text style={styles.debugText}>
              Last updated: {new Date().toLocaleTimeString()}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Transaksi</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterOptions}>
              {(["all", "income", "expense"] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterOption,
                    filterType === type && styles.filterOptionActive,
                  ]}
                  onPress={() => {
                    console.log(`Filter changed to: ${type}`);
                    setFilterType(type);
                    setShowFilterModal(false);
                  }}
                >
                  <View style={styles.filterOptionIcon}>
                    <Ionicons
                      name={
                        type === "all"
                          ? "list"
                          : type === "income"
                          ? "arrow-down-circle"
                          : "arrow-up-circle"
                      }
                      size={20}
                      color={filterType === type ? "#FFFFFF" : "#6B7280"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.filterOptionText,
                      filterType === type && styles.filterOptionTextActive,
                    ]}
                  >
                    {type === "all"
                      ? "Semua"
                      : type === "income"
                      ? "Pemasukan"
                      : "Pengeluaran"}
                  </Text>
                  {filterType === type && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color="#FFFFFF"
                      style={styles.filterCheckmark}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#4F46E5",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  debugButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    marginLeft: 8,
    marginRight: 8,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  filterButtonActive: {
    backgroundColor: "#EEF2FF",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    marginHorizontal: 4,
    position: "relative",
  },
  statCardActive: {
    backgroundColor: "#EEF2FF",
    borderWidth: 2,
    borderColor: "#4F46E5",
  },
  activeIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4F46E5",
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  incomeStat: {
    color: "#10B981",
  },
  expenseStat: {
    color: "#DC2626",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  clearFiltersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  clearFiltersButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
  },
  clearFiltersText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  transactionsList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  dateGroup: {
    marginTop: 20,
  },
  dateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  dateTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  dateAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
  },
  swipeableContainer: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    overflow: "hidden",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  incomeIcon: {
    backgroundColor: "#D1FAE5",
  },
  expenseIcon: {
    backgroundColor: "#FEE2E2",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  transactionTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  transactionAmountContainer: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  incomeAmount: {
    color: "#10B981",
  },
  expenseAmount: {
    color: "#DC2626",
  },
  swipeActions: {
    flexDirection: "row",
    width: 120,
    height: "88%",
    marginVertical: 8,
    borderRadius: 16,
    overflow: "hidden",
  },
  editAction: {
    flex: 1,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteAction: {
    flex: 1,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    padding: 48,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4F46E5",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
  },
  debugInfo: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    marginHorizontal: 20,
  },
  debugText: {
    fontSize: 11,
    color: "#6B7280",
    fontFamily: "monospace",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
  },
  filterOptionActive: {
    backgroundColor: "#4F46E5",
  },
  filterOptionIcon: {
    marginRight: 12,
  },
  filterOptionText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
    flex: 1,
  },
  filterOptionTextActive: {
    color: "#FFFFFF",
  },
  filterCheckmark: {
    marginLeft: 8,
  },
});

export default TransactionsScreen;
