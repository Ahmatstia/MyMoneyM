// File: src/components/CategoryPickerModal.tsx
import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useAppContext } from "../context/AppContext";
import { Colors } from "../theme/theme";
import { RootStackParamList } from "../types";

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  isCustom?: boolean;
  customId?: string;
}

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  // Kebutuhan Pokok & Sehari-hari
  { id: "makanan",      name: "Makanan",       icon: "restaurant-outline",          color: "#F59E0B" },
  { id: "jajan",        name: "Jajan",         icon: "fast-food-outline",           color: "#F43F5E" },
  { id: "ngopi",        name: "Ngopi",         icon: "cafe-outline",                color: "#A855F7" },
  { id: "belanja",      name: "Belanja",       icon: "cart-outline",                color: "#8B5CF6" },
  { id: "pakaian",      name: "Pakaian",       icon: "shirt-outline",               color: "#EC4899" },
  
  // Transportasi
  { id: "transportasi", name: "Transportasi",  icon: "car-outline",                 color: "#3B82F6" },
  { id: "bbm",          name: "BBM",           icon: "flame-outline",               color: "#EF4444" },
  { id: "tol_parkir",   name: "Parkir",        icon: "navigate-outline",            color: "#6366F1" },
  
  // Rumah & Keluarga
  { id: "rumah",        name: "Rumah",         icon: "home-outline",                color: "#22C55E" },
  { id: "keluarga",     name: "Keluarga",      icon: "people-outline",              color: "#3B82F6" },
  { id: "hewan",        name: "Hewan",         icon: "paw-outline",                 color: "#F97316" },
  
  // Tagihan & Kewajiban
  { id: "tagihan",      name: "Tagihan",       icon: "document-text-outline",       color: "#6366F1" },
  { id: "listrik",      name: "Listrik",       icon: "flash-outline",               color: "#EAB308" },
  { id: "air",          name: "Air",           icon: "water-outline",               color: "#06B6D4" },
  { id: "internet",     name: "Internet",      icon: "wifi-outline",                color: "#3B82F6" },
  { id: "pulsa",        name: "Pulsa",         icon: "call-outline",                color: "#06B6D4" },
  { id: "cicilan",      name: "Cicilan",       icon: "calendar-outline",            color: "#8B5CF6" },
  { id: "pajak",        name: "Pajak",         icon: "receipt-outline",             color: "#F59E0B" },
  { id: "asuransi",     name: "Asuransi",      icon: "shield-checkmark-outline",    color: "#10B981" },
  
  // Gaya Hidup & Hiburan
  { id: "hiburan",      name: "Hiburan",       icon: "film-outline",                color: "#EC4899" },
  { id: "langganan",    name: "Langganan",     icon: "play-circle-outline",         color: "#EF4444" },
  { id: "hobi",         name: "Hobi",          icon: "color-palette-outline",       color: "#EC4899" },
  { id: "liburan",      name: "Liburan",       icon: "airplane-outline",            color: "#3B82F6" },
  { id: "olahraga",     name: "Olahraga",      icon: "barbell-outline",             color: "#F97316" },
  { id: "perawatan",    name: "Perawatan",     icon: "body-outline",                color: "#F43F5E" },
  { id: "buku",         name: "Buku",          icon: "book-outline",                color: "#8B5CF6" },
  
  // Kesehatan & Pendidikan
  { id: "kesehatan",    name: "Kesehatan",     icon: "medical-outline",             color: "#EF4444" },
  { id: "pendidikan",   name: "Pendidikan",    icon: "school-outline",              color: "#10B981" },
  
  // Sosial
  { id: "hadiah",       name: "Hadiah",        icon: "gift-outline",                color: "#EC4899" },
  { id: "donasi",       name: "Donasi",        icon: "heart-half-outline",          color: "#EF4444" },
  
  // Pemasukan & Keuangan
  { id: "gaji",         name: "Gaji",          icon: "cash-outline",                color: "#22D3EE" },
  { id: "investasi",    name: "Investasi",     icon: "trending-up-outline",         color: "#06B6D4" },
  { id: "tabungan",     name: "Tabungan",      icon: "wallet-outline",              color: "#14B8A6" },
  { id: "hutang",       name: "Hutang",        icon: "card-outline",                color: "#F97316" },
  
  // Lainnya
  { id: "lainnya",      name: "Lainnya",       icon: "ellipsis-horizontal-outline", color: "#94A3B8" },
];

const SURF   = Colors.surface;
const TP     = Colors.textPrimary;
const TS     = Colors.textSecondary;
const ACCENT = Colors.accent;

interface CategoryPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (categoryName: string) => void;
  selectedName?: string;
  usedBudgetCategories?: string[];
}

const CategoryPickerModal: React.FC<CategoryPickerModalProps> = ({
  visible, onClose, onSelect, selectedName = "", usedBudgetCategories = [],
}) => {
  const { state } = useAppContext();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const customCategories = state.customCategories || [];

  const handleSelect = (cat: CategoryItem) => {
    onSelect(cat.name);
    onClose();
  };

  const handleManageCategories = () => {
    onClose();
    // Navigate to ManageCategories screen
    navigation.navigate("ManageCategories");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {/* swallow */}}
          style={{
            backgroundColor: SURF,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 24,
            maxHeight: "80%",
          }}
        >
          {/* Drag handle */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.gray600, alignSelf: "center", marginBottom: 16 }} />

          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ color: TP, fontSize: 17, fontWeight: "800" }}>Pilih Kategori</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={TS} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Built-in categories */}
            <Text style={{ color: Colors.gray500, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
              Kategori Bawaan
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 16, marginBottom: 20 }}>
              {DEFAULT_CATEGORIES.map((cat) => {
                const isSelected = selectedName === cat.name;
                const isUsed     = usedBudgetCategories.includes(cat.name);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => !isUsed && handleSelect(cat)}
                    disabled={isUsed}
                    activeOpacity={0.8}
                    style={{
                      width: "20%", alignItems: "center",
                      opacity: isUsed ? 0.35 : 1,
                    }}
                  >
                    <View style={{
                      width: 44, height: 44, borderRadius: 14,
                      backgroundColor: isSelected ? cat.color : SURF,
                      alignItems: "center", justifyContent: "center", marginBottom: 6,
                      borderWidth: 1.5, borderColor: isSelected ? cat.color : "rgba(255,255,255,0.07)",
                    }}>
                      <Ionicons name={cat.icon as any} size={22} color={isSelected ? "#FFFFFF" : cat.color} />
                    </View>
                    <Text style={{ color: isSelected ? cat.color : TS, fontSize: 9, fontWeight: isSelected ? "800" : "500", textAlign: "center" }} numberOfLines={1}>
                      {cat.name}
                    </Text>
                    {isUsed && <Text style={{ color: Colors.gray600, fontSize: 7, marginTop: 2 }}>Terpakai</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom categories */}
            {customCategories.length > 0 && (
              <>
                <Text style={{ color: Colors.gray500, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  Kategori Kustom ({customCategories.length})
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 16, marginBottom: 16 }}>
                  {customCategories.map((cat) => {
                    const isSelected = selectedName === cat.name;
                    const isUsed     = usedBudgetCategories.includes(cat.name);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => !isUsed && handleSelect({ id: cat.id, name: cat.name, icon: cat.icon, color: cat.color, isCustom: true, customId: cat.id })}
                        disabled={isUsed}
                        activeOpacity={0.8}
                        style={{
                          width: "20%", alignItems: "center",
                          opacity: isUsed ? 0.35 : 1,
                        }}
                      >
                        <View style={{
                          width: 44, height: 44, borderRadius: 14,
                          backgroundColor: isSelected ? cat.color : SURF,
                          alignItems: "center", justifyContent: "center", marginBottom: 6,
                          borderWidth: 1.5, borderColor: isSelected ? cat.color : "rgba(255,255,255,0.07)",
                        }}>
                          <Ionicons name={cat.icon as any} size={22} color={isSelected ? "#FFFFFF" : cat.color} />
                        </View>
                        <Text style={{ color: isSelected ? cat.color : TS, fontSize: 9, fontWeight: isSelected ? "800" : "500", textAlign: "center" }} numberOfLines={1}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <View style={{ height: 16 }} />

            {/* Manage Categories Button */}
            <TouchableOpacity
              onPress={handleManageCategories}
              activeOpacity={0.8}
              style={{
                flexDirection: "row", alignItems: "center", justifyContent: "center",
                backgroundColor: `${ACCENT}15`, borderRadius: 16,
                padding: 16, marginBottom: 16,
                borderWidth: 1.5, borderColor: `${ACCENT}40`, borderStyle: "dashed",
              }}
            >
              <Ionicons name="settings-outline" size={20} color={ACCENT} style={{ marginRight: 8 }} />
              <Text style={{ color: ACCENT, fontSize: 14, fontWeight: "700" }}>Kelola Kategori Kustom</Text>
            </TouchableOpacity>
            
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default CategoryPickerModal;
