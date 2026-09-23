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
import { useTheme } from "../theme/ThemeContext";
import { RootStackParamList } from "../types";

export {
  CategoryItem,
  DEFAULT_CATEGORIES,
  LEGACY_CATEGORIES,
  ALL_SYSTEM_CATEGORIES,
} from "../constants/categories";
import {
  CategoryItem,
  DEFAULT_CATEGORIES,
  ALL_SYSTEM_CATEGORIES,
} from "../constants/categories";

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
  const { colors } = useTheme();
  const SURF   = colors.surface;
  const TP     = colors.textPrimary;
  const TS     = colors.textSecondary;
  const ACCENT = colors.accent;

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
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: `${colors.border}C0`, alignSelf: "center", marginBottom: 16 }} />

          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ color: TP, fontSize: 17, fontWeight: "800" }}>Pilih Kategori</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={TS} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {customCategories.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 28, paddingHorizontal: 16 }}>
                <View style={{
                  width: 64, height: 64, borderRadius: 22,
                  backgroundColor: `${ACCENT}15`,
                  alignItems: "center", justifyContent: "center", marginBottom: 14,
                }}>
                  <Ionicons name="pricetags-outline" size={32} color={ACCENT} />
                </View>
                <Text style={{ color: TP, fontSize: 16, fontWeight: "800", marginBottom: 6, textAlign: "center" }}>
                  Belum Ada Kategori
                </Text>
                <Text style={{ color: TS, fontSize: 12, textAlign: "center", lineHeight: 18, marginBottom: 20 }}>
                  Kamu belum memiliki kategori transaksi. Buat kategori pertamamu untuk mulai mengelompokkan keuanganmu.
                </Text>
                <TouchableOpacity
                  onPress={handleManageCategories}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: "row", alignItems: "center",
                    backgroundColor: ACCENT, borderRadius: 14,
                    paddingHorizontal: 20, paddingVertical: 12,
                  }}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>Buat Kategori Baru</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>
                  Kategori Saya ({customCategories.length})
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 16, marginBottom: 20 }}>
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
                          borderWidth: 1.5, borderColor: isSelected ? cat.color : `${colors.border}40`,
                        }}>
                          <Ionicons name={cat.icon as any} size={22} color={isSelected ? "#FFFFFF" : cat.color} />
                        </View>
                        <Text style={{ color: isSelected ? cat.color : TS, fontSize: 11, fontWeight: isSelected ? "800" : "600", textAlign: "center" }} numberOfLines={1}>
                          {cat.name}
                        </Text>
                        {isUsed && <Text style={{ color: colors.gray400, fontSize: 9.5, fontWeight: "600", marginTop: 2 }}>Terpakai</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={{ height: 12 }} />

                {/* Manage Categories Button */}
                <TouchableOpacity
                  onPress={handleManageCategories}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "center",
                    backgroundColor: `${ACCENT}15`, borderRadius: 16,
                    padding: 14, marginBottom: 16,
                    borderWidth: 1.5, borderColor: `${ACCENT}40`, borderStyle: "dashed",
                  }}
                >
                  <Ionicons name="settings-outline" size={18} color={ACCENT} style={{ marginRight: 8 }} />
                  <Text style={{ color: ACCENT, fontSize: 13, fontWeight: "700" }}>Kelola / Tambah Kategori</Text>
                </TouchableOpacity>
              </>
            )}
            
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default CategoryPickerModal;
