// File: src/screens/NoteDetailScreen.tsx
import React, { useState } from "react";
import {
  View,
  ScrollView,
  Alert,
  Share,
  TouchableOpacity,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { useAppContext } from "../../context/AppContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Colors } from "../../theme/theme";

// ─── Theme colors (tidak diubah) ──────────────────────────────────────────────
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR    = Colors.surface;
const TEXT_PRIMARY     = Colors.textPrimary;
const TEXT_SECONDARY   = Colors.textSecondary;
const ACCENT_COLOR     = Colors.accent;
const ERROR_COLOR      = Colors.error;

// ─── Design tokens (konsisten dengan seluruh app) ─────────────────────────────
const CARD_RADIUS  = 20;
const INNER_RADIUS = 14;
const CARD_PAD     = 20;
const CARD_BORDER  = "rgba(255,255,255,0.06)";

// ─── Note type config (tidak diubah) ─────────────────────────────────────────
const TYPE_CONFIG: Record<string, { color: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  financial_decision: { color: "#3B82F6", label: "Keputusan Keuangan", icon: "bulb-outline" },
  expense_reflection: { color: "#10B981", label: "Refleksi Pengeluaran", icon: "analytics-outline" },
  goal_progress:      { color: "#8B5CF6", label: "Progress Target",     icon: "trophy-outline" },
  investment_idea:    { color: "#F59E0B", label: "Ide Investasi",       icon: "trending-up-outline" },
  budget_analysis:    { color: "#EC4899", label: "Analisis Anggaran",   icon: "pie-chart-outline" },
  general:            { color: "#6B7280", label: "Umum",                icon: "document-text-outline" },
};

// ─── Main component ───────────────────────────────────────────────────────────

const NoteDetailScreen: React.FC = () => {
  const { state, deleteNote } = useAppContext();
  const { notes }    = state;
  const navigation   = useNavigation<any>();
  const route        = useRoute<any>();

  const params = route.params as { noteId?: string };
  const note   = notes.find((n) => n.id === params?.noteId);

  const [showMenu, setShowMenu]     = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // ── Semua logika di bawah ini TIDAK DIUBAH ────────────────────────────────

  if (!note) return null;

  const typeConfig = TYPE_CONFIG[note.type] || TYPE_CONFIG.general;

  const handleShare = async () => {
    try {
      await Share.share({
        title: note.title,
        message: `${note.title}\n\n${note.content}`,
      });
    } catch {
      Alert.alert("Gagal", "Tidak bisa membagikan catatan");
    }
  };

  const handleDelete = () => {
    deleteNote(note.id);
    navigation.goBack();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
      {/* ── Custom Header / Action Bar ── */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 15,
        }}
      >
        <TouchableOpacity
          style={{
            padding: 8,
            backgroundColor: `${ACCENT_COLOR}15`,
            borderRadius: 12,
          }}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={ACCENT_COLOR} />
        </TouchableOpacity>

        {/* Right actions */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={{
              padding: 8,
              backgroundColor: SURFACE_COLOR,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: CARD_BORDER,
            }}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={18} color={Colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              padding: 8,
              backgroundColor: `${ACCENT_COLOR}15`,
              borderRadius: 12,
            }}
            onPress={() => navigation.navigate("NoteForm", { noteId: note.id })}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil-outline" size={18} color={ACCENT_COLOR} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              padding: 8,
              backgroundColor: `${ERROR_COLOR}15`,
              borderRadius: 12,
            }}
            onPress={() => setShowDelete(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color={ERROR_COLOR} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60, paddingTop: 10 }}
        style={{ flex: 1 }}
      >
        {/* Category Badge */}
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: `${typeConfig.color}15`,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            marginBottom: 16,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: `${typeConfig.color}30`,
          }}
        >
          <Ionicons
            name={typeConfig.icon}
            size={14}
            color={typeConfig.color}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              color: typeConfig.color,
              fontSize: 11,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {typeConfig.label}
          </Text>
        </View>

        {/* Title */}
        <Text
          style={{
            color: TEXT_PRIMARY,
            fontSize: 26,
            fontWeight: "800",
            lineHeight: 34,
            marginBottom: 12,
          }}
        >
          {note.title}
        </Text>

        {/* Meta Data */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="time-outline" size={14} color={Colors.gray400} style={{ marginRight: 6 }} />
            <Text style={{ color: Colors.gray400, fontSize: 12 }}>
              {format(new Date(note.createdAt), "dd MMM yyyy • HH:mm", { locale: id })}
            </Text>
          </View>

          {note.updatedAt && (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="refresh-outline" size={14} color={Colors.gray400} style={{ marginRight: 6 }} />
              <Text style={{ color: Colors.gray400, fontSize: 12 }}>
                Diedit: {format(new Date(note.updatedAt), "dd MMM yyyy", { locale: id })}
              </Text>
            </View>
          )}
        </View>

        {/* Amount Banner (if present) */}
        {note.amount && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: `${ACCENT_COLOR}10`,
              padding: 16,
              borderRadius: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: `${ACCENT_COLOR}30`,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: `${ACCENT_COLOR}20`,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}
            >
              <Ionicons name="cash-outline" size={22} color={ACCENT_COLOR} />
            </View>
            <View>
              <Text style={{ color: Colors.gray400, fontSize: 11, marginBottom: 4, fontWeight: "600" }}>
                NOMINAL TERKAIT
              </Text>
              <Text style={{ color: ACCENT_COLOR, fontSize: 20, fontWeight: "800" }}>
                Rp {note.amount.toLocaleString("id-ID")}
              </Text>
            </View>
          </View>
        )}

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: CARD_BORDER, marginBottom: 24 }} />

        {/* Main Content */}
        <Text
          style={{
            color: TEXT_PRIMARY,
            fontSize: 16,
            lineHeight: 28,
            letterSpacing: 0.3,
            marginBottom: 32,
          }}
        >
          {note.content}
        </Text>

        {/* Tags Section */}
        {note.tags && note.tags.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text
              style={{
                color: Colors.gray400,
                fontSize: 11,
                fontWeight: "700",
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: 1.2,
              }}
            >
              Tags
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {note.tags.map((tag: string) => (
                <View
                  key={tag}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: SURFACE_COLOR,
                    borderWidth: 1,
                    borderColor: CARD_BORDER,
                  }}
                >
                  <Text style={{ color: TEXT_SECONDARY, fontSize: 13, fontWeight: "600" }}>
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ═══════════════════════════════════════════════════════════════════
          DELETE CONFIRMATION MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDelete(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.6)",
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: SURFACE_COLOR,
              borderRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: CARD_BORDER,
              padding: CARD_PAD,
              width: "100%",
            }}
          >
            {/* Icon */}
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${ERROR_COLOR}15`,
                alignSelf: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons name="trash-outline" size={24} color={ERROR_COLOR} />
            </View>

            <Text
              style={{
                color: TEXT_PRIMARY,
                fontSize: 17,
                fontWeight: "700",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Hapus Catatan
            </Text>
            <Text
              style={{
                color: Colors.gray400,
                fontSize: 13,
                textAlign: "center",
                lineHeight: 19,
                marginBottom: 24,
              }}
            >
              Catatan ini akan dihapus permanen dan tidak dapat dipulihkan.
            </Text>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderRadius: INNER_RADIUS,
                  paddingVertical: 13,
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderWidth: 1,
                  borderColor: CARD_BORDER,
                }}
                onPress={() => setShowDelete(false)}
                activeOpacity={0.7}
              >
                <Text
                  style={{ color: TEXT_SECONDARY, fontSize: 14, fontWeight: "600" }}
                >
                  Batal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  borderRadius: INNER_RADIUS,
                  paddingVertical: 13,
                  alignItems: "center",
                  backgroundColor: ERROR_COLOR,
                  shadowColor: ERROR_COLOR,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
                onPress={handleDelete}
                activeOpacity={0.85}
              >
                <Text
                  style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}
                >
                  Hapus
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default NoteDetailScreen;