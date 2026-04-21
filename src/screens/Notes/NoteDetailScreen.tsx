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
    <View style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 60 }}
        style={{ flex: 1 }}
      >
        {/* ── Action bar ──────────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 10,
            marginBottom: 16,
          }}
        >
          <TouchableOpacity
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${ACCENT_COLOR}15`,
            }}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color={ACCENT_COLOR} />
          </TouchableOpacity>

          {/* Right actions */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: SURFACE_COLOR,
                borderWidth: 1,
                borderColor: CARD_BORDER,
              }}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={15} color={Colors.gray400} />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${ACCENT_COLOR}15`,
                borderWidth: 1,
                borderColor: `${ACCENT_COLOR}20`,
              }}
              onPress={() => navigation.navigate("NoteForm", { noteId: note.id })}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil-outline" size={15} color={ACCENT_COLOR} />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${ERROR_COLOR}15`,
                borderWidth: 1,
                borderColor: `${ERROR_COLOR}20`,
              }}
              onPress={() => setShowDelete(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={15} color={ERROR_COLOR} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Main note card ───────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: SURFACE_COLOR,
            borderRadius: CARD_RADIUS,
            borderWidth: 1,
            borderColor: CARD_BORDER,
            // Left accent stripe per type
            borderLeftWidth: 3,
            borderLeftColor: typeConfig.color,
            padding: CARD_PAD,
            marginBottom: 12,
          }}
        >
          {/* Type badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${typeConfig.color}18`,
                marginRight: 10,
              }}
            >
              <Ionicons
                name={typeConfig.icon}
                size={15}
                color={typeConfig.color}
              />
            </View>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 20,
                backgroundColor: `${typeConfig.color}15`,
                borderWidth: 1,
                borderColor: `${typeConfig.color}25`,
              }}
            >
              <Text
                style={{
                  color: typeConfig.color,
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: 0.4,
                }}
              >
                {typeConfig.label}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text
            style={{
              color: TEXT_PRIMARY,
              fontSize: 20,
              fontWeight: "800",
              letterSpacing: -0.3,
              marginBottom: note.amount ? 8 : 14,
              lineHeight: 26,
            }}
          >
            {note.title}
          </Text>

          {/* Amount (optional) */}
          {note.amount && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 14,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: INNER_RADIUS,
                backgroundColor: `${ACCENT_COLOR}10`,
                borderWidth: 1,
                borderColor: `${ACCENT_COLOR}20`,
                alignSelf: "flex-start",
              }}
            >
              <Ionicons
                name="cash-outline"
                size={14}
                color={ACCENT_COLOR}
                style={{ marginRight: 7 }}
              />
              <Text
                style={{
                  color: ACCENT_COLOR,
                  fontSize: 15,
                  fontWeight: "700",
                }}
              >
                Rp {note.amount.toLocaleString("id-ID")}
              </Text>
            </View>
          )}

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: CARD_BORDER,
              marginBottom: 16,
            }}
          />

          {/* Content */}
          <Text
            style={{
              color: TEXT_SECONDARY,
              fontSize: 14,
              lineHeight: 22,
              marginBottom: 16,
            }}
          >
            {note.content}
          </Text>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 16,
              }}
            >
              {note.tags.map((tag: string) => (
                <View
                  key={tag}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 20,
                    backgroundColor: "rgba(255,255,255,0.07)",
                    borderWidth: 1,
                    borderColor: CARD_BORDER,
                  }}
                >
                  <Text
                    style={{ color: Colors.gray400, fontSize: 11, fontWeight: "500" }}
                  >
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Meta */}
          <View
            style={{
              height: 1,
              backgroundColor: CARD_BORDER,
              marginBottom: 12,
            }}
          />
          <View style={{ gap: 5 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="time-outline"
                size={12}
                color={Colors.gray400}
                style={{ marginRight: 6 }}
              />
              <Text style={{ color: Colors.gray400, fontSize: 11 }}>
                Dibuat:{" "}
                {format(new Date(note.createdAt), "dd MMM yyyy • HH:mm", {
                  locale: id,
                })}
              </Text>
            </View>
            {note.updatedAt && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="refresh-outline"
                  size={12}
                  color={Colors.gray400}
                  style={{ marginRight: 6 }}
                />
                <Text style={{ color: Colors.gray400, fontSize: 11 }}>
                  Diperbarui:{" "}
                  {format(new Date(note.updatedAt), "dd MMM yyyy • HH:mm", {
                    locale: id,
                  })}
                </Text>
              </View>
            )}
          </View>
        </View>
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
    </View>
  );
};

export default NoteDetailScreen;