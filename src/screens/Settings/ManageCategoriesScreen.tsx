import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  PanResponder,
  Dimensions,
  Modal,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppContext } from "../../context/AppContext";
import { CustomCategory } from "../../types";
import { Colors } from "../../theme/theme";
import { DEFAULT_CATEGORIES } from "../../components/CategoryPickerModal";

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

// ─── HSV ↔ HEX helpers ────────────────────────────────────────────────────────
function hsvToHex(h: number, s: number, v: number): string {
  s /= 100; v /= 100;
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    const val = v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    return Math.round(val * 255).toString(16).padStart(2, "0");
  };
  return `#${f(5)}${f(3)}${f(1)}`;
}

function hexToHsv(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : Math.round((d / max) * 100);
  const v = Math.round(max * 100);
  return [h, s, v];
}

// ─── Single draggable slider bar ─────────────────────────────────────────────
const SliderBar: React.FC<{
  value: number; min: number; max: number;
  gradientColors: string[];
  onChange: (v: number) => void;
  label: string;
}> = ({ value, min, max, gradientColors, onChange, label }) => {
  const barWidth = Dimensions.get("window").width - 80;
  const thumbX = useRef(((value - min) / (max - min)) * barWidth);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const px = evt.nativeEvent.locationX;
        const clamped = Math.max(0, Math.min(px, barWidth));
        const newVal = Math.round(min + (clamped / barWidth) * (max - min));
        thumbX.current = clamped;
        onChange(newVal);
      },
      onPanResponderMove: (evt) => {
        const px = evt.nativeEvent.locationX;
        const clamped = Math.max(0, Math.min(px, barWidth));
        const newVal = Math.round(min + (clamped / barWidth) * (max - min));
        thumbX.current = clamped;
        onChange(newVal);
      },
    })
  ).current;

  const thumbPos = ((value - min) / (max - min)) * barWidth;

  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
        <Text style={{ color: TS, fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</Text>
        <Text style={{ color: TP, fontSize: 11, fontWeight: "700" }}>{value}</Text>
      </View>
      <View
        style={{ height: 22, borderRadius: 11, overflow: "hidden" }}
        {...pan.panHandlers}
      >
        <LinearGradient
          colors={gradientColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, borderRadius: 11 }}
        />
        <View
          style={{
            position: "absolute",
            top: 1, left: thumbPos - 10,
            width: 20, height: 20, borderRadius: 10,
            backgroundColor: "#FFF",
            shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 4, elevation: 4,
          }}
        />
      </View>
    </View>
  );
};

// ─── Full HSV Color Picker ────────────────────────────────────────────────────
const HSVColorPicker: React.FC<{ color: string; onChange: (hex: string) => void }> = ({ color, onChange }) => {
  const safeHex = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#8B5CF6";
  const [h, s, v] = hexToHsv(safeHex);
  const [hue, setHue]   = useState(h);
  const [sat, setSat]   = useState(s);
  const [val, setVal]   = useState(v);
  const [hexInput, setHexInput] = useState(safeHex.toUpperCase());

  const update = useCallback((nh: number, ns: number, nv: number) => {
    const hex = hsvToHex(nh, ns, nv);
    setHexInput(hex.toUpperCase());
    onChange(hex);
  }, [onChange]);

  const hueColors = Array.from({ length: 13 }, (_, i) => `hsl(${i * 30},100%,50%)`);
  const satColors = [`hsl(${hue},0%,${val}%)`, `hsl(${hue},100%,${val * 0.5}%)`];
  const valColors = [`#000000`, hsvToHex(hue, sat, 100)];

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Preview + hex */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: hsvToHex(hue,sat,val), borderWidth: 2, borderColor: "rgba(255,255,255,0.2)" }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: TS, fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Kode Hex</Text>
          <TextInput
            value={hexInput}
            onChangeText={(t) => {
              const cleaned = t.startsWith("#") ? t : `#${t}`;
              setHexInput(cleaned.toUpperCase());
              if (/^#[0-9A-Fa-f]{6}$/.test(cleaned)) {
                const [nh,ns,nv] = hexToHsv(cleaned);
                setHue(nh); setSat(ns); setVal(nv);
                onChange(cleaned);
              }
            }}
            maxLength={7}
            autoCapitalize="characters"
            placeholder="#RRGGBB"
            placeholderTextColor={Colors.gray500}
            style={{ backgroundColor: BG, borderRadius: 10, borderWidth: 1.5, borderColor: BORDER, paddingHorizontal: 12, paddingVertical: 8, color: TP, fontSize: 14, fontWeight: "700" }}
          />
        </View>
      </View>

      <SliderBar label="Hue (Warna)" value={hue} min={0} max={360} gradientColors={hueColors} onChange={(v) => { setHue(v); update(v, sat, val); }} />
      <SliderBar label="Saturasi" value={sat} min={0} max={100} gradientColors={satColors} onChange={(v) => { setSat(v); update(hue, v, val); }} />
      <SliderBar label="Kecerahan" value={val} min={0} max={100} gradientColors={valColors} onChange={(v) => { setVal(v); update(hue, sat, v); }} />

      {/* Quick palette */}
      <Text style={{ color: TS, fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Warna Cepat</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {COLOR_PALETTE.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => {
              const [nh,ns,nv] = hexToHsv(c);
              setHue(nh); setSat(ns); setVal(nv);
              setHexInput(c.toUpperCase());
              onChange(c);
            }}
            activeOpacity={0.8}
            style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c, borderWidth: hsvToHex(hue,sat,val).toUpperCase() === c.toUpperCase() ? 3 : 1.5, borderColor: hsvToHex(hue,sat,val).toUpperCase() === c.toUpperCase() ? "#FFF" : `${c}80` }}
          />
        ))}
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ManageCategoriesScreen() {
  const navigation = useNavigation();
  const { state, addCustomCategory, editCustomCategory, deleteCustomCategory } = useAppContext();
  
  const customCategories = state.customCategories || [];

  const [view, setView] = useState<"list" | "create" | "edit" | "delete">("list");
  const [editTarget, setEditTarget] = useState<CustomCategory | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [optionsTarget, setOptionsTarget] = useState<CustomCategory | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("star-outline");
  const [color, setColor] = useState("#8B5CF6");
  const [iconGroup, setIconGroup] = useState(0);

  const resetForm = () => {
    setName("");
    setIcon("star-outline");
    setColor("#8B5CF6");
    setIconGroup(0);
  };

  const handleCreateNew = () => {
    resetForm();
    setView("create");
  };

  const handleEditPress = (cat: CustomCategory) => {
    setEditTarget(cat);
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
    setView("edit");
  };

  const handleDeleteRequest = (cat: CustomCategory) => {
    setEditTarget(cat);
    setView("delete");
  };

  const handleLongPress = (cat: CustomCategory) => {
    setOptionsTarget(cat);
    setOptionsVisible(true);
  };

  const handleSaveForm = async () => {
    const trimmed = name.trim();
    if (!trimmed) { Alert.alert("Error", "Nama kategori tidak boleh kosong."); return; }
    if (trimmed.length > 20) { Alert.alert("Error", "Nama kategori maksimal 20 karakter."); return; }

    const allNames = [
      ...DEFAULT_CATEGORIES.map((c) => c.name.toLowerCase()),
      ...customCategories.filter((c) => c.id !== editTarget?.id).map((c) => c.name.toLowerCase()),
    ];

    if (allNames.includes(trimmed.toLowerCase())) {
      Alert.alert("Duplikat", `Kategori "${trimmed}" sudah ada.`);
      return;
    }

    setSaving(true);
    try {
      if (view === "create") {
        await addCustomCategory({ name: trimmed, icon, color });
      } else if (view === "edit" && editTarget) {
        await editCustomCategory(editTarget.id, { name: trimmed, icon, color });
      }
      setView("list");
      setEditTarget(null);
    } catch (e) {
      Alert.alert("Error", "Gagal menyimpan kategori.");
    } finally {
      setSaving(false);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['bottom']}>
      {/* ─── LIST VIEW ─── */}
      {view === "list" && (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <TouchableOpacity
            onPress={handleCreateNew}
            activeOpacity={0.8}
            style={{
              flexDirection: "row", alignItems: "center",
              backgroundColor: `${ACCENT}10`, borderRadius: 16,
              padding: 16, marginBottom: 24,
              borderWidth: 1.5, borderColor: `${ACCENT}30`, borderStyle: "dashed",
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${ACCENT}20`,
              alignItems: "center", justifyContent: "center", marginRight: 16 }}>
              <Ionicons name="add" size={24} color={ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: ACCENT, fontSize: 16, fontWeight: "700" }}>Buat Kategori Baru</Text>
              <Text style={{ color: Colors.gray400, fontSize: 12, marginTop: 2 }}>Tambahkan kategori sesuai kebutuhanmu</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={ACCENT} />
          </TouchableOpacity>

          <Text style={{ color: TS, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>
            Kategori Kustom ({customCategories.length})
          </Text>
          
          {customCategories.length === 0 ? (
            <View style={{ padding: 20, backgroundColor: SURF, borderRadius: 16, alignItems: "center", marginBottom: 24 }}>
              <Ionicons name="folder-open-outline" size={40} color={BORDER} />
              <Text style={{ color: TS, fontSize: 14, marginTop: 12 }}>Belum ada kategori kustom.</Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 16, marginBottom: 24 }}>
              {customCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => {}}
                  onLongPress={() => handleLongPress(cat)}
                  activeOpacity={0.8}
                  style={{
                    width: "20%", alignItems: "center"
                  }}
                >
                  <View style={{
                    width: 44, height: 44, borderRadius: 14,
                    backgroundColor: SURF,
                    alignItems: "center", justifyContent: "center", marginBottom: 6,
                    borderWidth: 1, borderColor: BORDER
                  }}>
                    <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                  </View>
                  <Text style={{ color: TS, fontSize: 9, textAlign: "center" }} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={{ color: TS, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>
            Kategori Bawaan
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 16 }}>
            {DEFAULT_CATEGORIES.map((cat) => (
              <View key={cat.id} style={{ width: "20%", alignItems: "center" }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: SURF, alignItems: "center", justifyContent: "center", marginBottom: 6, borderWidth: 1, borderColor: BORDER }}>
                  <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                </View>
                <Text style={{ color: TS, fontSize: 9, textAlign: "center" }} numberOfLines={1}>{cat.name}</Text>
              </View>
            ))}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ─── CREATE / EDIT VIEW ─── */}
      {(view === "create" || view === "edit") && (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={{ color: TP, fontSize: 20, fontWeight: "800", marginBottom: 24 }}>
            {view === "create" ? "Kategori Baru" : `Edit Kategori`}
          </Text>

          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <View style={{
              width: 80, height: 80, borderRadius: 24,
              backgroundColor: `${color}25`, alignItems: "center", justifyContent: "center",
              borderWidth: 2, borderColor: color,
            }}>
              <Ionicons name={icon as any} size={40} color={color} />
            </View>
            <Text style={{ color: TP, fontSize: 16, fontWeight: "700", marginTop: 12 }}>
              {name || "Nama Kategori"}
            </Text>
          </View>

          <Text style={{ color: TS, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Nama Kategori</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Contoh: Vape, Kopi, Skincare..."
            placeholderTextColor={Colors.gray500}
            style={{ backgroundColor: SURF, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, paddingHorizontal: 16, paddingVertical: 14, color: TP, fontSize: 15, fontWeight: "600", marginBottom: 24 }}
            maxLength={20}
          />

          <Text style={{ color: TS, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Warna</Text>
          <View style={{ backgroundColor: SURF, padding: 16, borderRadius: 16, marginBottom: 24 }}>
            <HSVColorPicker color={color} onChange={setColor} />
          </View>

          <Text style={{ color: TS, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Pilih Ikon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", gap: 10, paddingRight: 10 }}>
              {ICON_GROUPS.map((g, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setIconGroup(i)}
                  activeOpacity={0.8}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                    backgroundColor: iconGroup === i ? `${ACCENT}20` : SURF,
                    borderWidth: 1.5, borderColor: iconGroup === i ? ACCENT : BORDER,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: iconGroup === i ? ACCENT : TS }}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 32 }}>
            {ICON_GROUPS[iconGroup].icons.map((ic) => (
              <TouchableOpacity
                key={ic}
                onPress={() => setIcon(ic)}
                activeOpacity={0.8}
                style={{
                  width: 56, height: 56, borderRadius: 18,
                  backgroundColor: icon === ic ? `${color}20` : SURF,
                  alignItems: "center", justifyContent: "center",
                  borderWidth: 2, borderColor: icon === ic ? color : BORDER,
                }}
              >
                <Ionicons name={ic as any} size={28} color={icon === ic ? color : TS} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: 12, paddingBottom: 40 }}>
            <TouchableOpacity onPress={() => setView("list")} activeOpacity={0.8} style={{ flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: "center", backgroundColor: SURF, borderWidth: 1.5, borderColor: BORDER }}>
              <Text style={{ color: TS, fontSize: 15, fontWeight: "700" }}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveForm} disabled={saving} activeOpacity={0.8} style={{ flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: "center", backgroundColor: saving ? Colors.gray600 : color }}>
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800" }}>{saving ? "Menyimpan..." : "Simpan Kategori"}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ─── DELETE VIEW ─── */}
      {view === "delete" && editTarget && (
        <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: `${Colors.error}20`, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <Ionicons name="warning" size={40} color={Colors.error} />
            </View>
            <Text style={{ color: TP, fontSize: 22, fontWeight: "800", marginBottom: 12, textAlign: "center" }}>Hapus Kategori "{editTarget.name}"?</Text>
            <Text style={{ color: TS, fontSize: 15, textAlign: "center", lineHeight: 22 }}>
              Semua transaksi dan anggaran yang menggunakan kategori ini akan secara otomatis dipindahkan ke kategori "Lainnya". Tindakan ini tidak dapat dibatalkan.
            </Text>
          </View>

            <View style={{ gap: 12 }}>
              <TouchableOpacity onPress={confirmDelete} disabled={saving} style={{ padding: 18, borderRadius: 16, alignItems: "center", backgroundColor: Colors.error }}>
                <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>{saving ? "Menghapus..." : "Ya, Hapus Kategori"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setView("list")} disabled={saving} style={{ padding: 18, borderRadius: 16, alignItems: "center", backgroundColor: SURF, borderWidth: 1.5, borderColor: BORDER }}>
                <Text style={{ color: TS, fontSize: 16, fontWeight: "700" }}>Batal</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── OPTIONS MODAL ─── */}
        <Modal visible={optionsVisible} transparent animationType="fade" onRequestClose={() => setOptionsVisible(false)}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24 }} onPress={() => setOptionsVisible(false)}>
            <Pressable onPress={() => {}} style={{ backgroundColor: SURF, borderRadius: 24, padding: 24 }}>
              <Text style={{ color: TP, fontSize: 18, fontWeight: "800", marginBottom: 8, textAlign: "center" }}>Kategori Kustom</Text>
              <Text style={{ color: TS, fontSize: 14, textAlign: "center", marginBottom: 24 }}>
                Pilih tindakan untuk kategori "{optionsTarget?.name}"
              </Text>
              
              <TouchableOpacity 
                style={{ backgroundColor: `${Colors.info}15`, padding: 16, borderRadius: 16, alignItems: "center", marginBottom: 12, borderWidth: 1.5, borderColor: `${Colors.info}30` }}
                onPress={() => {
                  setOptionsVisible(false);
                  if (optionsTarget) handleEditPress(optionsTarget);
                }}
              >
                <Text style={{ color: Colors.info, fontSize: 16, fontWeight: "700" }}>Edit Kategori</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={{ backgroundColor: `${Colors.error}15`, padding: 16, borderRadius: 16, alignItems: "center", marginBottom: 16, borderWidth: 1.5, borderColor: `${Colors.error}30` }}
                onPress={() => {
                  setOptionsVisible(false);
                  if (optionsTarget) handleDeleteRequest(optionsTarget);
                }}
              >
                <Text style={{ color: Colors.error, fontSize: 16, fontWeight: "700" }}>Hapus Kategori</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={{ padding: 16, borderRadius: 16, alignItems: "center", borderWidth: 1.5, borderColor: BORDER }}
                onPress={() => setOptionsVisible(false)}
              >
                <Text style={{ color: TS, fontSize: 16, fontWeight: "700" }}>Batal</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

      </SafeAreaView>
    );
  }
