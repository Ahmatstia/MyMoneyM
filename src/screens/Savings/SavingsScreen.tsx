import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { useAppContext } from "../../context/AppContext";
import Card from "../../components/common/Card";
import {
  formatCurrency,
  calculateSavingsProgress,
} from "../../utils/calculations";
import { RootStackParamList, Savings } from "../../types";

type SavingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const SavingsScreen: React.FC = () => {
  const navigation = useNavigation<SavingsScreenNavigationProp>();
  const { state } = useAppContext();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Target Tabungan</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("AddSavings")}
          >
            <Text style={styles.addButtonText}>+ Tambah</Text>
          </TouchableOpacity>
        </View>

        {/* Savings List */}
        {state.savings.map((saving: Savings) => {
          const progress = calculateSavingsProgress(saving);
          const remaining = saving.target - saving.current;

          return (
            <Card key={saving.id} style={styles.savingsCard}>
              <View style={styles.savingsHeader}>
                <Text style={styles.savingsName}>{saving.name}</Text>
                <Text style={styles.progressPercentage}>
                  {progress.toFixed(1)}%
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <View
                    style={[styles.progressFill, { width: `${progress}%` }]}
                  />
                </View>
              </View>

              <View style={styles.savingsDetails}>
                <View>
                  <Text style={styles.detailLabel}>Terkumpul</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(saving.current)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.detailLabel}>Target</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(saving.target)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.detailLabel}>Sisa</Text>
                  <Text style={styles.remainingText}>
                    {formatCurrency(remaining)}
                  </Text>
                </View>
              </View>

              {saving.deadline && (
                <Text style={styles.deadlineText}>
                  Target: {saving.deadline}
                </Text>
              )}
            </Card>
          );
        })}

        {state.savings.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Belum ada target tabungan. Buat target untuk membantu menabung!
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate("AddSavings")}
            >
              <Text style={styles.emptyButtonText}>Buat Target Pertama</Text>
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddSavings")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  addButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  savingsCard: {
    marginBottom: 16,
  },
  savingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  savingsName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4F46E5",
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBackground: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4F46E5",
    borderRadius: 4,
  },
  savingsDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  remainingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
  },
  deadlineText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  emptyCard: {
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 24,
    fontSize: 16,
  },
  emptyButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
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
  fabText: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "300",
  },
});

export default SavingsScreen;
