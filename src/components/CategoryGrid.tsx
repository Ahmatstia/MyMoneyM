// File: src/components/CategoryGrid.tsx
// Reusable inline category grid — no modal, no wrapper.
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useAppContext } from "../context/AppContext";
import { Colors } from "../theme/theme";
import { DEFAULT_CATEGORIES, CategoryItem } from "./CategoryPickerModal";
import { RootStackParamList } from "../types";

const TP     = Colors.textPrimary;
const TS     = Colors.textSecondary;
const SURF   = Colors.surface;
const BORDER = Colors.border;
const ACCENT = Colors.accent;

interface CategoryGridProps {
  selectedName: string;
  onSelect: (name: string) => void;
  usedCategories?: string[]; // names already used (e.g. by budgets)
  disabled?: boolean;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({
  selectedName,
  onSelect,
  usedCategories = [],
  disabled = false,
}) => {
  const { state } = useAppContext();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const customCategories: CategoryItem[] = (state.customCategories || []).map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
    isCustom: true as const,
    customId: c.id,
  }));

  const renderItem = (cat: CategoryItem) => {
    const isSelected = selectedName === cat.name;
    const isUsed = usedCategories.includes(cat.name);

    return (
      <TouchableOpacity
        key={cat.id}
        onPress={() => !isUsed && !disabled && onSelect(cat.name)}
        disabled={isUsed || disabled}
        activeOpacity={0.75}
        style={{
          width: "22%",
          alignItems: "center",
          paddingVertical: 10,
          paddingHorizontal: 2,
          borderRadius: 16,
          backgroundColor: isSelected ? `${cat.color}18` : "transparent",
          borderWidth: isSelected ? 1.5 : 0,
          borderColor: isSelected ? cat.color : "transparent",
          opacity: isUsed ? 0.3 : 1,
        }}
      >
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            backgroundColor: isSelected ? cat.color : `${cat.color}15`,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 6,
          }}
        >
          <Ionicons
            name={cat.icon as any}
            size={22}
            color={isSelected ? "#FFFFFF" : cat.color}
          />
        </View>
        <Text
          style={{
            color: isSelected ? cat.color : TS,
            fontSize: 10,
            fontWeight: isSelected ? "800" : "500",
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          {cat.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      {/* Default categories */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {DEFAULT_CATEGORIES.map(renderItem)}
      </View>

      {/* Custom categories */}
      {customCategories.length > 0 && (
        <>
          <Text style={{ color: Colors.gray500, fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            Kustom ({customCategories.length})
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {customCategories.map(renderItem)}
          </View>
        </>
      )}

      {/* Manage link */}
      <TouchableOpacity
        onPress={() => navigation.navigate("ManageCategories")}
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-start",
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 20,
          backgroundColor: `${ACCENT}12`,
          borderWidth: 1,
          borderColor: `${ACCENT}25`,
          marginTop: 4,
        }}
      >
        <Ionicons name="settings-outline" size={12} color={ACCENT} style={{ marginRight: 6 }} />
        <Text style={{ color: ACCENT, fontSize: 11, fontWeight: "700" }}>Kelola Kategori Kustom</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CategoryGrid;
