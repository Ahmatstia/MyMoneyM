// File: src/screens/Home/HomeScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppContext } from "../../context/AppContext";
import { formatCurrency } from "../../utils/calculations";

type IconName = keyof typeof Ionicons.glyphMap;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state } = useAppContext();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 19) return "Selamat Sore";
    return "Selamat Malam";
  };

  const getCurrentDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return now.toLocaleDateString("id-ID", options);
  };

  const quickActions: Array<{
    id: number;
    title: string;
    icon: IconName;
    color: string;
    onPress: () => void;
  }> = [
    {
      id: 1,
      title: "Transaksi",
      icon: "swap-horizontal",
      color: "#4F46E5",
      onPress: () => navigation.navigate("Transactions"),
    },
    {
      id: 2,
      title: "Analitik",
      icon: "stats-chart-outline",
      color: "#10B981",
      onPress: () => navigation.navigate("Analytics"),
    },
    {
      id: 3,
      title: "Anggaran",
      icon: "pie-chart-outline",
      color: "#F59E0B",
      onPress: () => navigation.navigate("Budget"),
    },
    {
      id: 4,
      title: "Tabungan",
      icon: "wallet-outline",
      color: "#8B5CF6",
      onPress: () => navigation.navigate("Savings"),
    },
  ];

  const transactionIcons: Record<string, IconName> = {
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

  const getTransactionIcon = (category: string): IconName => {
    return transactionIcons[category] || "receipt-outline";
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.welcomeText}>Selamat datang kembali</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => console.log("Notification pressed")}
          >
            <Ionicons name="notifications-outline" size={22} color="#4B5563" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Date */}
        <Text style={styles.dateText}>{getCurrentDate()}</Text>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>SALDO ANDA</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(state.balance)}
          </Text>

          <View style={styles.balanceBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Pemasukan</Text>
              <Text style={[styles.breakdownValue, { color: "#10B981" }]}>
                {formatCurrency(state.totalIncome)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Pengeluaran</Text>
              <Text style={[styles.breakdownValue, { color: "#EF4444" }]}>
                {formatCurrency(state.totalExpense)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickAction}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: `${action.color}15` },
                ]}
              >
                <Ionicons name={action.icon} size={20} color={action.color} />
              </View>
              <Text style={styles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Transactions Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
          {state.transactions.length > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate("Transactions")}
            >
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Transactions List */}
        {state.transactions.length > 0 ? (
          <View style={styles.transactionsList}>
            {state.transactions.slice(0, 5).map((transaction, index) => (
              <TouchableOpacity
                key={transaction.id}
                style={[
                  styles.transactionItem,
                  index === state.transactions.slice(0, 5).length - 1 &&
                    styles.lastTransactionItem,
                ]}
                onPress={() =>
                  navigation.navigate("AddTransaction", {
                    editMode: true,
                    transactionData: transaction,
                  })
                }
                activeOpacity={0.7}
              >
                <View style={styles.transactionLeft}>
                  <View
                    style={[
                      styles.transactionIcon,
                      {
                        backgroundColor:
                          transaction.type === "income"
                            ? "rgba(16, 185, 129, 0.1)"
                            : "rgba(239, 68, 68, 0.1)",
                      },
                    ]}
                  >
                    <Ionicons
                      name={getTransactionIcon(transaction.category)}
                      size={18}
                      color={
                        transaction.type === "income" ? "#10B981" : "#EF4444"
                      }
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle}>
                      {transaction.category}
                    </Text>
                    <Text style={styles.transactionDescription}>
                      {transaction.description || "Tidak ada deskripsi"}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                </View>

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
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="receipt-outline" size={32} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>Belum ada transaksi</Text>
            <Text style={styles.emptyText}>Mulai catat keuangan Anda</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate("AddTransaction")}
            >
              <Text style={styles.emptyButtonText}>Tambah Transaksi</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Budget Summary (Minimal) */}
        {state.budgets.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Anggaran</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Budget")}>
                <Text style={styles.seeAll}>Kelola</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.budgetSummary}>
              {state.budgets.slice(0, 3).map((budget) => {
                const progress = (budget.spent / budget.limit) * 100;
                return (
                  <View key={budget.id} style={styles.budgetItem}>
                    <View style={styles.budgetHeader}>
                      <Text style={styles.budgetCategory}>
                        {budget.category}
                      </Text>
                      <Text style={styles.budgetAmount}>
                        {formatCurrency(budget.spent)} /{" "}
                        {formatCurrency(budget.limit)}
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor:
                              progress > 90
                                ? "#EF4444"
                                : progress > 70
                                ? "#F59E0B"
                                : "#10B981",
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.budgetPercentage}>
                      {Math.round(progress)}%
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("AddTransaction")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
  },
  welcomeText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  notificationButton: {
    padding: 8,
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  dateText: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 24,
  },
  balanceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  balanceBreakdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  quickAction: {
    alignItems: "center",
    width: "23%",
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  seeAll: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "500",
  },
  transactionsList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  lastTransactionItem: {
    borderBottomWidth: 0,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: "600",
  },
  incomeAmount: {
    color: "#10B981",
  },
  expenseAmount: {
    color: "#EF4444",
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  budgetSummary: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  budgetItem: {
    marginBottom: 16,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  budgetCategory: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  budgetAmount: {
    fontSize: 13,
    color: "#6B7280",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  budgetPercentage: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
});

export default HomeScreen;
