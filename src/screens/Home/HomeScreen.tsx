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
import { StackNavigationProp } from "@react-navigation/stack";

import { useAppContext } from "../../context/AppContext";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { formatCurrency } from "../../utils/calculations";
import { RootStackParamList, Transaction } from "../../types";

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { state } = useAppContext();

  const quickActions = [
    {
      title: "Tambah Transaksi",
      icon: "add-circle" as const,
      onPress: () => navigation.navigate("AddTransaction"),
      color: "#4F46E5",
    },
    {
      title: "Tambah Anggaran",
      icon: "pie-chart" as const,
      onPress: () => navigation.navigate("AddBudget"),
      color: "#10B981",
    },
    {
      title: "Tambah Tabungan",
      icon: "wallet" as const,
      onPress: () => navigation.navigate("AddSavings"),
      color: "#F59E0B",
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Selamat Datang</Text>
        <Text style={styles.subtitle}>Kelola keuanganmu dengan mudah</Text>
      </View>

      {/* Balance Card */}
      <Card style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo Saat Ini</Text>
        <Text style={styles.balanceAmount}>
          {formatCurrency(state.balance)}
        </Text>
        <View style={styles.incomeExpenseContainer}>
          <View style={styles.incomeExpenseItem}>
            <Text style={styles.incomeLabel}>Pemasukan</Text>
            <Text style={styles.incomeAmount}>
              {formatCurrency(state.totalIncome)}
            </Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.incomeExpenseItem}>
            <Text style={styles.expenseLabel}>Pengeluaran</Text>
            <Text style={styles.expenseAmount}>
              {formatCurrency(state.totalExpense)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aksi Cepat</Text>
        <View style={styles.quickActions}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickAction}
              onPress={action.onPress}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: action.color },
                ]}
              >
                <Ionicons name={action.icon} size={24} color="#FFF" />
              </View>
              <Text style={styles.quickActionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
          <Button
            title="Lihat Semua"
            onPress={() => navigation.navigate("Transactions")}
            variant="secondary"
            style={styles.seeAllButton}
          />
        </View>
        {state.transactions.slice(0, 5).map((transaction: Transaction) => (
          <Card key={transaction.id} style={styles.transactionCard}>
            <View style={styles.transactionRow}>
              <View>
                <Text style={styles.transactionCategory}>
                  {transaction.category}
                </Text>
                <Text style={styles.transactionDescription}>
                  {transaction.description}
                </Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  transaction.type === "income"
                    ? styles.incomeText
                    : styles.expenseText,
                ]}
              >
                {transaction.type === "income" ? "+" : "-"}
                {formatCurrency(transaction.amount)}
              </Text>
            </View>
          </Card>
        ))}
        {state.transactions.length === 0 && (
          <Card>
            <Text style={styles.emptyText}>
              Belum ada transaksi. Tambah transaksi pertama kamu!
            </Text>
          </Card>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    padding: 20,
    backgroundColor: "#4F46E5",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 16,
    color: "#E5E7EB",
    marginTop: 4,
  },
  balanceCard: {
    marginTop: -20,
    marginHorizontal: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  incomeExpenseContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  incomeExpenseItem: {
    flex: 1,
    alignItems: "center",
  },
  separator: {
    width: 1,
    backgroundColor: "#E5E7EB",
  },
  incomeLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  incomeAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#10B981",
    marginTop: 4,
  },
  expenseLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#DC2626",
    marginTop: 4,
  },
  section: {
    padding: 20,
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
  seeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  quickAction: {
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: "#374151",
    textAlign: "center",
  },
  transactionCard: {
    marginVertical: 4,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  transactionDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  incomeText: {
    color: "#10B981",
  },
  expenseText: {
    color: "#DC2626",
  },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    padding: 16,
  },
});

export default HomeScreen;
