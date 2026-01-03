import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface BudgetFilterProps {
  filter: "all" | "over" | "warning" | "safe";
  onFilterChange: (filter: "all" | "over" | "warning" | "safe") => void;
  counts: {
    all: number;
    safe: number;
    warning: number;
    over: number;
  };
}

const BudgetFilter: React.FC<BudgetFilterProps> = ({
  filter,
  onFilterChange,
  counts,
}) => {
  const filters = [
    {
      key: "all" as const,
      label: "Semua",
      icon: "list" as const,
      color: "#6B7280", // ✅ TAMBAHKAN color untuk "all"
    },
    {
      key: "safe" as const,
      label: "Aman",
      icon: "checkmark-circle" as const,
      color: "#10B981",
    },
    {
      key: "warning" as const,
      label: "Perhatian",
      icon: "alert-circle" as const,
      color: "#F59E0B",
    },
    {
      key: "over" as const,
      label: "Melebihi",
      icon: "warning" as const,
      color: "#DC2626",
    },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {filters.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={[
            styles.filterChip,
            filter === item.key && styles.filterChipActive,
          ]}
          onPress={() => onFilterChange(item.key)}
        >
          <Ionicons
            name={item.icon}
            size={16}
            color={filter === item.key ? "#FFFFFF" : item.color} // ✅ Sekarang semua item punya color
          />
          <Text
            style={[
              styles.filterText,
              filter === item.key && styles.filterTextActive,
            ]}
          >
            {item.label} ({counts[item.key]})
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  content: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterChipActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  filterText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
});

export default BudgetFilter;
