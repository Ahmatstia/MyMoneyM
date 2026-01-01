import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { useAppContext } from "../../context/AppContext";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { formatCurrency, formatDate } from "../../utils/calculations";
import { RootStackParamList, Transaction } from "../../types";

type TransactionsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// Sorting options
type SortOption =
  | "date-desc"
  | "date-asc"
  | "amount-desc"
  | "amount-asc"
  | "category";
type FilterType = "all" | "income" | "expense";

// Available categories
const AVAILABLE_CATEGORIES = [
  "Makanan & Minuman",
  "Transportasi",
  "Belanja",
  "Hiburan",
  "Kesehatan",
  "Pendidikan",
  "Tagihan",
  "Lainnya",
];

// Month names
const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const TransactionsScreen: React.FC = () => {
  const navigation = useNavigation<TransactionsScreenNavigationProp>();
  const { state, deleteTransaction } = useAppContext();

  // State for filtering
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");

  // Modal states
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const [swipeableRefs, setSwipeableRefs] = useState<{
    [key: string]: Swipeable | null;
  }>({});

  // Get unique years from transactions
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    state.transactions.forEach((t) => {
      const date = new Date(t.date);
      years.add(date.getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [state.transactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...state.transactions];

    // Filter by type (income/expense)
    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
      );
    }

    // Filter by month
    if (selectedMonth !== null) {
      filtered = filtered.filter((t) => {
        const date = new Date(t.date);
        return (
          date.getMonth() === selectedMonth &&
          date.getFullYear() === selectedYear
        );
      });
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((t) =>
        selectedCategories.includes(t.category)
      );
    }

    // Sorting
    switch (sortBy) {
      case "date-desc":
        filtered.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        break;
      case "date-asc":
        filtered.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        break;
      case "amount-desc":
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      case "amount-asc":
        filtered.sort((a, b) => a.amount - b.amount);
        break;
      case "category":
        filtered.sort((a, b) => a.category.localeCompare(b.category));
        break;
    }

    return filtered;
  }, [
    state.transactions,
    filterType,
    searchQuery,
    selectedMonth,
    selectedYear,
    selectedCategories,
    sortBy,
  ]);

  // Stats calculation
  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      total: filteredTransactions.length,
      income,
      expense,
      balance: income - expense,
    };
  }, [filteredTransactions]);

  const handleDelete = (id: string) => {
    if (swipeableRefs[id]) {
      swipeableRefs[id]?.close();
    }

    Alert.alert(
      "Hapus Transaksi",
      "Apakah Anda yakin ingin menghapus transaksi ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => deleteTransaction(id),
        },
      ]
    );
  };

  const handleEdit = (transaction: Transaction) => {
    if (swipeableRefs[transaction.id]) {
      swipeableRefs[transaction.id]?.close();
    }

    navigation.navigate("AddTransaction", {
      editMode: true,
      transactionData: transaction,
    });
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setFilterType("all");
    setSearchQuery("");
    setSelectedMonth(null);
    setSelectedCategories([]);
    setSortBy("date-desc");
  };

  const renderRightActions = (transaction: Transaction) => (
    <TouchableOpacity
      style={styles.editAction}
      onPress={() => handleEdit(transaction)}
    >
      <Ionicons name="pencil" size={20} color="#FFFFFF" />
      <Text style={styles.actionText}>Edit</Text>
    </TouchableOpacity>
  );

  const renderLeftActions = (id: string) => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => handleDelete(id)}
    >
      <Ionicons name="trash" size={20} color="#FFFFFF" />
      <Text style={styles.actionText}>Hapus</Text>
    </TouchableOpacity>
  );

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <Swipeable
      ref={(ref) => {
        if (ref) {
          swipeableRefs[item.id] = ref;
        }
      }}
      renderRightActions={() => renderRightActions(item)}
      renderLeftActions={() => renderLeftActions(item.id)}
      overshootRight={false}
      overshootLeft={false}
    >
      <Card style={styles.transactionItem}>
        <View style={styles.transactionContent}>
          <View style={styles.transactionInfo}>
            <View style={styles.categoryRow}>
              <Text style={styles.transactionCategory}>{item.category}</Text>
              <View
                style={[
                  styles.typeBadge,
                  item.type === "income"
                    ? styles.incomeBadge
                    : styles.expenseBadge,
                ]}
              >
                <Text style={styles.typeBadgeText}>
                  {item.type === "income" ? "Pemasukan" : "Pengeluaran"}
                </Text>
              </View>
            </View>
            {item.description ? (
              <Text style={styles.transactionDescription}>
                {item.description}
              </Text>
            ) : null}
            <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
          </View>
          <Text
            style={[
              styles.transactionAmount,
              item.type === "income" ? styles.incomeText : styles.expenseText,
            ]}
          >
            {item.type === "income" ? "+" : "-"}
            {formatCurrency(item.amount)}
          </Text>
        </View>
      </Card>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <Card style={styles.searchCard}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari transaksi..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </Card>

      {/* Filter Buttons Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterRowContent}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            filterType === "all" && styles.filterChipActive,
          ]}
          onPress={() => setFilterType("all")}
        >
          <Text
            style={[
              styles.filterChipText,
              filterType === "all" && styles.filterChipTextActive,
            ]}
          >
            Semua
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filterType === "income" && styles.filterChipActive,
          ]}
          onPress={() => setFilterType("income")}
        >
          <Ionicons
            name="arrow-up"
            size={14}
            color={filterType === "income" ? "#FFFFFF" : "#10B981"}
          />
          <Text
            style={[
              styles.filterChipText,
              filterType === "income" && styles.filterChipTextActive,
            ]}
          >
            Pemasukan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filterType === "expense" && styles.filterChipActive,
          ]}
          onPress={() => setFilterType("expense")}
        >
          <Ionicons
            name="arrow-down"
            size={14}
            color={filterType === "expense" ? "#FFFFFF" : "#DC2626"}
          />
          <Text
            style={[
              styles.filterChipText,
              filterType === "expense" && styles.filterChipTextActive,
            ]}
          >
            Pengeluaran
          </Text>
        </TouchableOpacity>

        {/* Month Filter */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedMonth !== null && styles.filterChipActive,
          ]}
          onPress={() => setShowMonthModal(true)}
        >
          <Ionicons
            name="calendar"
            size={14}
            color={selectedMonth !== null ? "#FFFFFF" : "#6B7280"}
          />
          <Text
            style={[
              styles.filterChipText,
              selectedMonth !== null && styles.filterChipTextActive,
            ]}
          >
            {selectedMonth !== null ? MONTHS[selectedMonth] : "Bulan"}
          </Text>
        </TouchableOpacity>

        {/* Category Filter */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedCategories.length > 0 && styles.filterChipActive,
          ]}
          onPress={() => setShowCategoryModal(true)}
        >
          <Ionicons
            name="pricetags"
            size={14}
            color={selectedCategories.length > 0 ? "#FFFFFF" : "#6B7280"}
          />
          <Text
            style={[
              styles.filterChipText,
              selectedCategories.length > 0 && styles.filterChipTextActive,
            ]}
          >
            Kategori{" "}
            {selectedCategories.length > 0
              ? `(${selectedCategories.length})`
              : ""}
          </Text>
        </TouchableOpacity>

        {/* Sort Button */}
        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical" size={14} color="#6B7280" />
          <Text style={styles.filterChipText}>Urutkan</Text>
        </TouchableOpacity>

        {/* Clear Filters */}
        {(searchQuery !== "" ||
          selectedMonth !== null ||
          selectedCategories.length > 0) && (
          <TouchableOpacity
            style={[styles.filterChip, styles.clearFilterChip]}
            onPress={clearFilters}
          >
            <Ionicons name="close" size={14} color="#FFFFFF" />
            <Text style={[styles.filterChipText, styles.clearFilterChipText]}>
              Bersihkan
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Stats Summary */}
      <Card style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Transaksi</Text>
            <Text style={styles.statValue}>{stats.total}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Pemasukan</Text>
            <Text style={[styles.statValue, styles.incomeText]}>
              {formatCurrency(stats.income)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Pengeluaran</Text>
            <Text style={[styles.statValue, styles.expenseText]}>
              {formatCurrency(stats.expense)}
            </Text>
          </View>
        </View>
        {selectedMonth !== null && (
          <Text style={styles.monthInfo}>
            Menampilkan data untuk {MONTHS[selectedMonth]} {selectedYear}
          </Text>
        )}
      </Card>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {searchQuery !== "" ||
              selectedMonth !== null ||
              selectedCategories.length > 0
                ? "Tidak ada transaksi yang sesuai dengan filter"
                : "Belum ada transaksi"}
            </Text>
            <Button
              title="Tambah Transaksi"
              onPress={() =>
                navigation.navigate("AddTransaction", { editMode: false })
              }
              style={styles.addButton}
            />
          </View>
        }
      />

      {/* Month Selection Modal */}
      <Modal
        visible={showMonthModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMonthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Bulan</Text>
              <TouchableOpacity onPress={() => setShowMonthModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* Year Selection */}
              <Text style={styles.modalSubtitle}>Tahun</Text>
              <View style={styles.yearContainer}>
                {availableYears.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearButton,
                      selectedYear === year && styles.yearButtonActive,
                    ]}
                    onPress={() => setSelectedYear(year)}
                  >
                    <Text
                      style={[
                        styles.yearButtonText,
                        selectedYear === year && styles.yearButtonTextActive,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Month Selection */}
              <Text style={styles.modalSubtitle}>Bulan</Text>
              <View style={styles.monthGrid}>
                {MONTHS.map((month, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.monthButton,
                      selectedMonth === index &&
                        selectedYear === new Date().getFullYear() &&
                        styles.monthButtonActive,
                    ]}
                    onPress={() => {
                      setSelectedMonth(index);
                      setShowMonthModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.monthButtonText,
                        selectedMonth === index &&
                          selectedYear === new Date().getFullYear() &&
                          styles.monthButtonTextActive,
                      ]}
                    >
                      {month.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                title="Tampilkan Semua Bulan"
                variant="secondary"
                onPress={() => {
                  setSelectedMonth(null);
                  setShowMonthModal(false);
                }}
                style={styles.clearButton}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Kategori</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.categoryModalGrid}>
              {AVAILABLE_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryModalButton,
                    selectedCategories.includes(category) &&
                      styles.categoryModalButtonActive,
                  ]}
                  onPress={() => toggleCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryModalText,
                      selectedCategories.includes(category) &&
                        styles.categoryModalTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                  {selectedCategories.includes(category) && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color="#FFFFFF"
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Terapkan"
                onPress={() => setShowCategoryModal(false)}
                style={styles.applyButton}
              />
              <Button
                title="Reset"
                variant="secondary"
                onPress={() => setSelectedCategories([])}
                style={styles.resetButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.sortModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Urutkan Berdasarkan</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.sortOptions}>
              {[
                {
                  value: "date-desc",
                  label: "Tanggal (Terbaru)",
                  icon: "calendar",
                },
                {
                  value: "date-asc",
                  label: "Tanggal (Terlama)",
                  icon: "calendar-outline",
                },
                {
                  value: "amount-desc",
                  label: "Jumlah (Terbesar)",
                  icon: "cash",
                },
                {
                  value: "amount-asc",
                  label: "Jumlah (Terkecil)",
                  icon: "cash-outline",
                },
                {
                  value: "category",
                  label: "Kategori (A-Z)",
                  icon: "pricetag",
                },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.sortOption}
                  onPress={() => {
                    setSortBy(option.value as SortOption);
                    setShowSortModal(false);
                  }}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={sortBy === option.value ? "#4F46E5" : "#6B7280"}
                  />
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === option.value && styles.sortOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {sortBy === option.value && (
                    <Ionicons name="checkmark" size={20} color="#4F46E5" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          navigation.navigate("AddTransaction", { editMode: false })
        }
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  searchCard: {
    margin: 16,
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 8,
    fontSize: 16,
    color: "#111827",
  },
  filterRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterRowContent: {
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterChipActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  filterChipText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  clearFilterChip: {
    backgroundColor: "#DC2626",
    borderColor: "#DC2626",
  },
  clearFilterChipText: {
    color: "#FFFFFF",
  },
  statsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  monthInfo: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  transactionItem: {
    marginBottom: 8,
  },
  transactionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionInfo: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  incomeBadge: {
    backgroundColor: "#D1FAE5",
  },
  expenseBadge: {
    backgroundColor: "#FEE2E2",
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#374151",
  },
  transactionDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 16,
  },
  incomeText: {
    color: "#10B981",
  },
  expenseText: {
    color: "#DC2626",
  },
  editAction: {
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginBottom: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  deleteAction: {
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginBottom: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  addButton: {
    width: "60%",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 12,
    marginTop: 16,
  },
  yearContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  yearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  yearButtonActive: {
    backgroundColor: "#4F46E5",
  },
  yearButtonText: {
    fontSize: 14,
    color: "#6B7280",
  },
  yearButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  monthButton: {
    width: "23%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    marginBottom: 8,
  },
  monthButtonActive: {
    backgroundColor: "#4F46E5",
  },
  monthButtonText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  monthButtonTextActive: {
    color: "#FFFFFF",
  },
  clearButton: {
    marginTop: 8,
  },
  categoryModalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  categoryModalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
  },
  categoryModalButtonActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  categoryModalText: {
    fontSize: 14,
    color: "#6B7280",
  },
  categoryModalTextActive: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  checkIcon: {
    marginLeft: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  applyButton: {
    flex: 2,
  },
  resetButton: {
    flex: 1,
  },
  sortModalContent: {
    maxHeight: "60%",
  },
  sortOptions: {
    marginBottom: 20,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sortOptionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  sortOptionTextActive: {
    color: "#4F46E5",
    fontWeight: "500",
  },
});

export default TransactionsScreen;
