// File: src/components/CategoryPickerModal.tsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../context/AppContext";
import { CustomCategory } from "../types";
import { Colors } from "../theme/theme";

// ─── Shared Built-in Categories ──────────────────────────────────────────────
export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  isCustom?: boolean;
  customId?: string;
}

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: "makanan",      name: "Makanan",      icon: "restaurant-outline",          color: "#F59E0B" },
  { id: "transportasi", name: "Transportasi", icon: "car-outline",                 color: "#3B82F6" },
  { id: "belanja",      name: "Belanja",       icon: "cart-outline",                color: "#8B5CF6" },
  { id: "hiburan",      name: "Hiburan",       icon: "film-outline",                color: "#EC4899" },
  { id: "kesehatan",    name: "Kesehatan",     icon: "medical-outline",             color: "#EF4444" },
  { id: "pendidikan",   name: "Pendidikan",    icon: "school-outline",              color: "#10B981" },
  { id: "tagihan",      name: "Tagihan",       icon: "document-text-outline",       color: "#6366F1" },
  { id: "gaji",         name: "Gaji",          icon: "cash-outline",                color: "#22D3EE" },
  { id: "investasi",    name: "Investasi",     icon: "trending-up-outline",         color: "#06B6D4" },
  { id: "tabungan",     name: "Tabungan",      icon: "wallet-outline",              color: "#14B8A6" },
  { id: "hutang",       name: "Hutang",        icon: "card-outline",                color: "#F97316" },
  { id: "lainnya",      name: "Lainnya",       icon: "ellipsis-horizontal-outline", color: "#94A3B8" },
];

// ─── Icon Groups ──────────────────────────────────────────────────────────────
const ICON_GROUPS = [
  { label: "🍔 Makanan",     icons: ["restaurant-outline","cafe-outline","pizza-outline","beer-outline","wine-outline","ice-cream-outline","fast-food-outline","nutrition-outline","fish-outline","leaf-outline"] },
  { label: "🚗 Transportasi", icons: ["car-outline","bus-outline","train-outline","airplane-outline","bicycle-outline","boat-outline","car-sport-outline","rocket-outline","walk-outline","navigate-outline"] },
  { label: "💰 Keuangan",    icons: ["cash-outline","card-outline","wallet-outline","trending-up-outline","trending-down-outline","bar-chart-outline","pie-chart-outline","calculator-outline","receipt-outline","pricetag-outline"] },
  { label: "🛒 Belanja",     icons: ["cart-outline","bag-outline","gift-outline","basket-outline","storefront-outline","shirt-outline","diamond-outline","watch-outline","glasses-outline","headset-outline"] },
  { label: "🏠 Rumah",       icons: ["home-outline","bed-outline","tv-outline","hardware-chip-outline","hammer-outline","construct-outline","water-outline","snow-outline","flame-outline","bulb-outline"] },
  { label: "🏥 Kesehatan",   icons: ["medical-outline","heart-outline","fitness-outline","bandage-outline","thermometer-outline","pulse-outline","eye-outline","body-outline","flower-outline","shield-checkmark-outline"] },
  { label: "🎮 Hiburan",     icons: ["game-controller-outline","film-outline","musical-notes-outline","football-outline","trophy-outline","camera-outline","image-outline","disc-outline","color-palette-outline","planet-outline"] },
  { label: "💼 Kerja",       icons: ["briefcase-outline","desktop-outline","laptop-outline","document-text-outline","clipboard-outline","person-circle-outline","school-outline","book-outline","pencil-outline","code-slash-outline"] },
  { label: "✨ Lainnya",     icons: ["star-outline","time-outline","location-outline","cloud-outline","umbrella-outline","paw-outline","rose-outline","ellipsis-horizontal-outline","apps-outline","layers-outline"] },
];

const COLOR_PALETTE = [
  "#EF4444","#F97316","#F59E0B","#EAB308",
  "#84CC16","#22C55E","#10B981","#14B8A6",
  "#06B6D4","#3B82F6","#6366F1","#8B5CF6",
  "#A855F7","#EC4899","#F43F5E","#94A3B8",
];

const BG     = Colors.background;
const SURF   = Colors.surface;
const TP     = Colors.textPrimary;
const TS     = Colors.textSecondary;
const BORDER = Colors.border;
const ACCENT = Colors.accent;

// ─── Create / Edit Form ───────────────────────────────────────────────────────
interface FormProps {
  title: string;
  initial?: { name: string; icon: string; color: string };
  onSave: (data: { name: string; icon: string; color: string }) => void;
  onCancel: () => void;
  saving?: boolean;
}

const CategoryForm: React.FC<FormProps> = ({ title, initial, onSave, onCancel, saving }) => {
  const [name,      setName]      = useState(initial?.name  || "");
  const [icon,      setIcon]      = useState(initial?.icon  || "star-outline");
  const [color,     setColor]     = useState(initial?.color || "#8B5CF6");
  const [iconGroup, setIconGroup] = useState(0);
  const nameRef = useRef<TextInput>(null);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed)             { Alert.alert("Error", "Nama kategori tidak boleh kosong."); return; }
    if (trimmed.length > 20)  { Alert.alert("Error", "Nama kategori maksimal 20 karakter."); return; }
    onSave({ name: trimmed, icon, color });
  };

  return (
    <View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <Text style={{ color: TP, fontSize: 16, fontWeight: "800" }}>{title}</Text>
          <TouchableOpacity
            onPress={onCancel}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={22} color={TS} />
          </TouchableOpacity>
        </View>

        {/* Preview */}
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 22,
            backgroundColor: `${color}25`, alignItems: "center", justifyContent: "center",
            borderWidth: 2, borderColor: color,
          }}>
            <Ionicons name={icon as any} size={34} color={color} />
          </View>
          <Text style={{ color: TP, fontSize: 14, fontWeight: "700", marginTop: 8 }}>
            {name || "Nama Kategori"}
          </Text>
        </View>

        {/* Name Input — no autoFocus to prevent button disappearance */}
        <Text style={{ color: TS, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Nama</Text>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => nameRef.current?.focus()}
          style={{
            backgroundColor: BG, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER,
            paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20,
          }}
        >
          <TextInput
            ref={nameRef}
            value={name}
            onChangeText={setName}
            placeholder="Contoh: Vape, Kopi, Skincare..."
            placeholderTextColor={Colors.gray500}
            style={{ color: TP, fontSize: 14, fontWeight: "600", padding: 0 }}
            maxLength={20}
            returnKeyType="done"
            blurOnSubmit
          />
        </TouchableOpacity>

        {/* Color Picker */}
        <Text style={{ color: TS, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Warna</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
          {COLOR_PALETTE.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setColor(c)}
              activeOpacity={0.8}
              style={{
                width: 36, height: 36, borderRadius: 18, backgroundColor: c,
                borderWidth: color === c ? 3 : 1.5,
                borderColor: color === c ? "#FFFFFF" : `${c}60`,
              }}
            />
          ))}
        </View>

        {/* Icon Group Tabs */}
        <Text style={{ color: TS, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Ikon</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 12 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: "row", gap: 8, paddingRight: 8 }}>
            {ICON_GROUPS.map((g, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setIconGroup(i)}
                activeOpacity={0.8}
                style={{
                  paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
                  backgroundColor: iconGroup === i ? `${ACCENT}20` : BG,
                  borderWidth: 1.5, borderColor: iconGroup === i ? ACCENT : BORDER,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: iconGroup === i ? ACCENT : TS }}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Icon Grid */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {ICON_GROUPS[iconGroup].icons.map((ic) => (
            <TouchableOpacity
              key={ic}
              onPress={() => setIcon(ic)}
              activeOpacity={0.8}
              style={{
                width: 52, height: 52, borderRadius: 16,
                backgroundColor: icon === ic ? `${color}20` : BG,
                alignItems: "center", justifyContent: "center",
                borderWidth: 2, borderColor: icon === ic ? color : BORDER,
              }}
            >
              <Ionicons name={ic as any} size={24} color={icon === ic ? color : TS} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Buttons — always visible, placed last so keyboard scrolls up to them */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={onCancel}
            activeOpacity={0.8}
            style={{
              flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: "center",
              backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER,
            }}
          >
            <Text style={{ color: TS, fontSize: 14, fontWeight: "700" }}>Batal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
            style={{
              flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: "center",
              backgroundColor: saving ? Colors.gray600 : color,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
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
  const { state, addCustomCategory, editCustomCategory, deleteCustomCategory } = useAppContext();

  const [view,       setView]       = useState<"list" | "create" | "edit" | "options" | "delete">("list");
  const [editTarget, setEditTarget] = useState<CustomCategory | null>(null);
  const [saving,     setSaving]     = useState(false);

  // Always read from state directly (no stale closure)
  const customCategories = state.customCategories || [];

  const resetAndClose = () => {
    setView("list");
    setEditTarget(null);
    setSaving(false);
    onClose();
  };

  const handleSelect = (cat: CategoryItem) => {
    onSelect(cat.name);
    resetAndClose();
  };

  // Re-read customCategories fresh inside handlers to avoid stale closure
  const handleCreate = async (data: { name: string; icon: string; color: string }) => {
    const freshCustom = state.customCategories || [];
    const allNames = [...DEFAULT_CATEGORIES.map((c) => c.name.toLowerCase()), ...freshCustom.map((c) => c.name.toLowerCase())];
    if (allNames.includes(data.name.trim().toLowerCase())) {
      Alert.alert("Duplikat", `Kategori "${data.name}" sudah ada.`);
      return;
    }
    setSaving(true);
    try {
      await addCustomCategory(data);
      setView("list");
    } catch (e) {
      Alert.alert("Error", "Gagal menyimpan kategori.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data: { name: string; icon: string; color: string }) => {
    if (!editTarget) return;
    const freshCustom = state.customCategories || [];
    const allNames = [
      ...DEFAULT_CATEGORIES.map((c) => c.name.toLowerCase()),
      ...freshCustom.filter((c) => c.id !== editTarget.id).map((c) => c.name.toLowerCase()),
    ];
    if (allNames.includes(data.name.trim().toLowerCase())) {
      Alert.alert("Duplikat", `Kategori "${data.name}" sudah ada.`);
      return;
    }
    setSaving(true);
    try {
      await editCustomCategory(editTarget.id, data);
      setView("list");
      setEditTarget(null);
    } catch (e) {
      Alert.alert("Error", "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRequest = () => {
    if (editTarget) {
      setView("delete");
    }
  };

  const confirmDelete = async () => {
    if (editTarget) {
      setSaving(true);
      try {
        await deleteCustomCategory(editTarget.id);
        setView("list");
        setEditTarget(null);
      } catch (e) {
        Alert.alert("Error", "Gagal menghapus kategori.");
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={resetAndClose}
      statusBarTranslucent
    >
      {/* Outer Pressable = backdrop (closes on tap) */}
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}
        onPress={view === "list" ? resetAndClose : undefined}
      >
        {/* Inner Pressable = modal card — absorbs all touches, never triggers backdrop */}
        <Pressable
          onPress={() => {/* swallow */}}
          style={{
            backgroundColor: SURF,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 12,
            maxHeight: "90%",
          }}
        >
          {view === "list" && (
            <>
              {/* Drag handle */}
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.gray600, alignSelf: "center", marginBottom: 16 }} />

              {/* Header */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <Text style={{ color: TP, fontSize: 17, fontWeight: "800" }}>Pilih Kategori</Text>
                <TouchableOpacity onPress={resetAndClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} activeOpacity={0.7}>
                  <Ionicons name="close" size={22} color={TS} />
                </TouchableOpacity>
              </View>

              {/* Create new button */}
              <TouchableOpacity
                onPress={() => setView("create")}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row", alignItems: "center",
                  backgroundColor: `${ACCENT}10`, borderRadius: 16,
                  padding: 14, marginBottom: 16,
                  borderWidth: 1.5, borderColor: `${ACCENT}30`, borderStyle: "dashed",
                }}
              >
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: `${ACCENT}20`,
                  alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                  <Ionicons name="add" size={22} color={ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: ACCENT, fontSize: 14, fontWeight: "700" }}>Buat Kategori Baru</Text>
                  <Text style={{ color: Colors.gray500, fontSize: 11, marginTop: 1 }}>Pilih ikon, warna, dan nama sendiri</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={ACCENT} />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Built-in categories */}
                <Text style={{ color: Colors.gray500, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  Kategori Bawaan
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 20 }}>
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
                          width: "23%", alignItems: "center", paddingVertical: 10,
                          opacity: isUsed ? 0.4 : 1,
                        }}
                      >
                        <View style={{ 
                          width: 50, height: 50, borderRadius: 25,
                          backgroundColor: isSelected ? cat.color : `${cat.color}15`, 
                          alignItems: "center", justifyContent: "center", marginBottom: 6,
                          borderWidth: isSelected ? 0 : 1, borderColor: `${cat.color}30`
                        }}>
                          <Ionicons name={cat.icon as any} size={24} color={isSelected ? "#FFFFFF" : cat.color} />
                        </View>
                        <Text style={{ color: isSelected ? TP : TS, fontSize: 11, fontWeight: isSelected ? "800" : "500", textAlign: "center" }} numberOfLines={1}>
                          {cat.name}
                        </Text>
                        {isUsed && <Text style={{ color: Colors.gray500, fontSize: 9, marginTop: 2 }}>Terpakai</Text>}
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
                    <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 16 }}>
                      {customCategories.map((cat) => {
                        const isSelected = selectedName === cat.name;
                        const isUsed     = usedBudgetCategories.includes(cat.name);
                        return (
                          <TouchableOpacity
                            key={cat.id}
                            onPress={() => !isUsed && handleSelect({ id: cat.id, name: cat.name, icon: cat.icon, color: cat.color, isCustom: true, customId: cat.id })}
                            onLongPress={() => {
                              setEditTarget(cat);
                              setView("options");
                            }}
                            disabled={isUsed}
                            activeOpacity={0.8}
                            style={{
                              width: "23%", alignItems: "center", paddingVertical: 10,
                              opacity: isUsed ? 0.4 : 1,
                            }}
                          >
                            <View style={{ 
                              width: 50, height: 50, borderRadius: 25,
                              backgroundColor: isSelected ? cat.color : `${cat.color}15`, 
                              alignItems: "center", justifyContent: "center", marginBottom: 6,
                              borderWidth: isSelected ? 0 : 1, borderColor: `${cat.color}30`
                            }}>
                              <Ionicons name={cat.icon as any} size={24} color={isSelected ? "#FFFFFF" : cat.color} />
                            </View>
                            <Text style={{ color: isSelected ? TP : TS, fontSize: 11, fontWeight: isSelected ? "800" : "500", textAlign: "center" }} numberOfLines={1}>
                              {cat.name}
                            </Text>
                            <Text style={{ color: Colors.gray500, fontSize: 9, marginTop: 2 }}>Tahan edit</Text>
                          </TouchableOpacity>
                        );
                      })}
                      {/* Fill empty spaces to keep left alignment if not a multiple of 4 */}
                      {Array.from({ length: (4 - (customCategories.length % 4)) % 4 }).map((_, i) => (
                        <View key={`empty-${i}`} style={{ width: "23%" }} />
                      ))}
                    </View>
                  </>
                )}

                <View style={{ height: 20 }} />
              </ScrollView>
            </>
          )}

          {(view === "create" || view === "edit") && (
            <CategoryForm
              title={view === "create" ? "Kategori Baru" : `Edit: ${editTarget?.name || ""}`}
              initial={view === "edit" && editTarget
                ? { name: editTarget.name, icon: editTarget.icon, color: editTarget.color }
                : undefined
              }
              onSave={view === "create" ? handleCreate : handleEdit}
              onCancel={() => { setView("list"); setEditTarget(null); }}
              saving={saving}
            />
          )}

          {view === "options" && editTarget && (
            <View style={{ paddingVertical: 10 }}>
              <Text style={{ color: TP, fontSize: 18, fontWeight: "800", marginBottom: 24, textAlign: "center" }}>
                ✦ {editTarget.name}
              </Text>
              
              <TouchableOpacity
                onPress={() => setView("edit")}
                activeOpacity={0.8}
                style={{ backgroundColor: `${Colors.info}15`, padding: 16, borderRadius: 16, marginBottom: 12, alignItems: "center", borderWidth: 1, borderColor: `${Colors.info}40` }}
              >
                <Text style={{ color: Colors.info, fontSize: 16, fontWeight: "700" }}>✏️ Edit Kategori</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteRequest}
                activeOpacity={0.8}
                style={{ backgroundColor: `${Colors.error}15`, padding: 16, borderRadius: 16, marginBottom: 24, alignItems: "center", borderWidth: 1, borderColor: `${Colors.error}40` }}
              >
                <Text style={{ color: Colors.error, fontSize: 16, fontWeight: "700" }}>🗑️ Hapus Kategori</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { setView("list"); setEditTarget(null); }}
                activeOpacity={0.8}
                style={{ padding: 16, borderRadius: 16, alignItems: "center", backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER }}
              >
                <Text style={{ color: TS, fontSize: 16, fontWeight: "700" }}>Batal</Text>
              </TouchableOpacity>
            </View>
          )}

          {view === "delete" && editTarget && (
            <View style={{ paddingVertical: 10 }}>
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: `${Colors.error}20`, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Ionicons name="warning" size={32} color={Colors.error} />
                </View>
                <Text style={{ color: TP, fontSize: 18, fontWeight: "800", marginBottom: 8 }}>Hapus "{editTarget.name}"?</Text>
                <Text style={{ color: TS, fontSize: 14, textAlign: "center", lineHeight: 20 }}>Semua transaksi dan anggaran dengan kategori ini akan dipindahkan ke "Lainnya".</Text>
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setView("options")}
                  disabled={saving}
                  style={{ flex: 1, padding: 14, borderRadius: 16, alignItems: "center", backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER }}
                >
                  <Text style={{ color: TS, fontSize: 14, fontWeight: "700" }}>Kembali</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmDelete}
                  disabled={saving}
                  style={{ flex: 1, padding: 14, borderRadius: 16, alignItems: "center", backgroundColor: Colors.error }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>{saving ? "Menghapus..." : "Ya, Hapus"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default CategoryPickerModal;
