// File: src/screens/Notes/NotesScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../../context/AppContext";
import { Colors } from "../../theme/theme";

const { width } = Dimensions.get("window");
const COLUMN_GAP  = 12;
const CARD_WIDTH  = (width - 36 - COLUMN_GAP) / 2; // 18px padding each side + gap

// ─── Theme colors (konsisten dengan seluruh app) ──────────────────────────────
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR    = Colors.surface;
const TEXT_PRIMARY     = Colors.textPrimary;
const ACCENT_COLOR     = Colors.accent;

// ─── Design tokens ────────────────────────────────────────────────────────────
const CARD_RADIUS = 20;
const CARD_PAD    = 20;
const CARD_BORDER = "rgba(255,255,255,0.06)";

// Warna kartu note (dikurasi, sesuai dark theme)
const NOTE_COLORS = [
  { bg: "rgba(34,211,238,0.10)", border: "rgba(34,211,238,0.20)", text: Colors.accent },
  { bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.20)", text: Colors.success },
  { bg: "rgba(139,92,246,0.10)", border: "rgba(139,92,246,0.20)", text: Colors.purple },
  { bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.20)", text: Colors.warning },
  { bg: "rgba(236,72,153,0.10)", border: "rgba(236,72,153,0.20)", text: Colors.pink },
  { bg: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.20)", text: Colors.info },
];

const NotesScreen = ({ navigation }: any) => {
  const { state }    = useAppContext();
  const { notes }    = state;
  const [search, setSearch]       = useState("");
  const [fabScaleAnim]            = useState(new Animated.Value(1));

  const fabPressIn  = () =>
    Animated.spring(fabScaleAnim, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start();
  const fabPressOut = () =>
    Animated.spring(fabScaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  const filteredNotes = useMemo(() => {
    if (!search.trim()) return notes;
    const q = search.toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
    );
  }, [notes, search]);

  // Pisahkan menjadi 2 kolom (masonry-style)
  const [leftCol, rightCol] = useMemo(() => {
    const left: typeof filteredNotes  = [];
    const right: typeof filteredNotes = [];
    filteredNotes.forEach((note, i) => {
      if (i % 2 === 0) left.push(note);
      else right.push(note);
    });
    return [left, right];
  }, [filteredNotes]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return "";
    }
  };

  const renderNoteCard = (item: any, index: number) => {
    const colorTheme = NOTE_COLORS[index % NOTE_COLORS.length];
    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.75}
        onPress={() => navigation.navigate("NoteDetail", { noteId: item.id })}
        style={{
          width: CARD_WIDTH,
          backgroundColor: colorTheme.bg,
          borderRadius: CARD_RADIUS,
          borderWidth: 1,
          borderColor: colorTheme.border,
          padding: 16,
          marginBottom: COLUMN_GAP,
        }}
      >
        {/* Accent dot + title */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 8 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colorTheme.text,
              marginTop: 5,
              marginRight: 8,
              flexShrink: 0,
            }}
          />
          <Text
            style={{
              color: TEXT_PRIMARY,
              fontSize: 13,
              fontWeight: "700",
              lineHeight: 18,
              flex: 1,
            }}
            numberOfLines={2}
          >
            {item.title}
          </Text>
        </View>

        {/* Content preview */}
        {item.content ? (
          <Text
            style={{
              color: Colors.gray400,
              fontSize: 11,
              lineHeight: 16,
              marginBottom: 10,
            }}
            numberOfLines={4}
          >
            {item.content}
          </Text>
        ) : null}

        {/* Footer */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              color: colorTheme.text,
              fontSize: 9,
              fontWeight: "700",
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            {formatDate(item.createdAt || item.date)}
          </Text>
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 7,
              backgroundColor: colorTheme.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-forward" size={11} color={colorTheme.text} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page header ──────────────────────────────────────────────── */}
        <View style={{ paddingTop: 16, paddingBottom: 20 }}>
          <Text style={{ color: TEXT_PRIMARY, fontSize: 20, fontWeight: "700" }}>
            Catatan
          </Text>
          <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 3 }}>
            {notes.length} catatan tersimpan
          </Text>
        </View>

        {/* ── Search bar ───────────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: SURFACE_COLOR,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: CARD_BORDER,
            paddingHorizontal: 14,
            marginBottom: 20,
          }}
        >
          <Ionicons name="search-outline" size={16} color={Colors.gray400} style={{ marginRight: 10 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cari catatan…"
            placeholderTextColor={Colors.gray500}
            style={{
              flex: 1,
              color: TEXT_PRIMARY,
              fontSize: 13,
              paddingVertical: 12,
            }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={16} color={Colors.gray400} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Stats strip ──────────────────────────────────────────────── */}
        {notes.length > 0 && (
          <View
            style={{
              backgroundColor: SURFACE_COLOR,
              borderRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: CARD_BORDER,
              padding: CARD_PAD,
              marginBottom: 20,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  color: Colors.gray400, fontSize: 9,
                  textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4,
                }}
              >
                Total
              </Text>
              <Text style={{ color: TEXT_PRIMARY, fontSize: 20, fontWeight: "800" }}>
                {notes.length}
              </Text>
            </View>
            <View style={{ width: 1, height: 28, backgroundColor: CARD_BORDER }} />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  color: Colors.gray400, fontSize: 9,
                  textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4,
                }}
              >
                Hasil Cari
              </Text>
              <Text style={{ color: ACCENT_COLOR, fontSize: 20, fontWeight: "800" }}>
                {filteredNotes.length}
              </Text>
            </View>
            <View style={{ width: 1, height: 28, backgroundColor: CARD_BORDER }} />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  color: Colors.gray400, fontSize: 9,
                  textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4,
                }}
              >
                Terakhir
              </Text>
              <Text style={{ color: Colors.success, fontSize: 11, fontWeight: "700" }}>
                {notes.length > 0
                  ? formatDate(
                      notes
                        .slice()
                        .sort((a, b) =>
                          new Date(b.createdAt || b.date || 0).getTime() -
                          new Date(a.createdAt || a.date || 0).getTime()
                        )[0]?.createdAt || ""
                    )
                  : "-"}
              </Text>
            </View>
          </View>
        )}

        {/* ── Notes grid (2 kolom) ──────────────────────────────────────── */}
        {filteredNotes.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              paddingVertical: 48,
              backgroundColor: SURFACE_COLOR,
              borderRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: CARD_BORDER,
              paddingHorizontal: 24,
            }}
          >
            <View
              style={{
                width: 64, height: 64, borderRadius: 20,
                alignItems: "center", justifyContent: "center",
                backgroundColor: `${Colors.gray400}14`,
                marginBottom: 14,
              }}
            >
              <Ionicons name="document-text-outline" size={26} color={Colors.gray400} />
            </View>
            <Text
              style={{
                color: TEXT_PRIMARY, fontSize: 15, fontWeight: "700",
                marginBottom: 6, textAlign: "center",
              }}
            >
              {search ? "Catatan tidak ditemukan" : "Belum ada catatan"}
            </Text>
            <Text
              style={{
                color: Colors.gray400, fontSize: 12,
                textAlign: "center", lineHeight: 18, marginBottom: 20,
              }}
            >
              {search
                ? `Tidak ada catatan yang cocok dengan "${search}"`
                : "Buat catatan pertama Anda untuk menyimpan ide dan informasi penting"}
            </Text>
            {!search && (
              <TouchableOpacity
                style={{
                  flexDirection: "row", alignItems: "center",
                  paddingHorizontal: 20, paddingVertical: 10,
                  borderRadius: 13, backgroundColor: ACCENT_COLOR,
                  shadowColor: ACCENT_COLOR,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
                }}
                onPress={() => navigation.navigate("NoteForm")}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color={BACKGROUND_COLOR} style={{ marginRight: 6 }} />
                <Text style={{ color: BACKGROUND_COLOR, fontSize: 13, fontWeight: "700" }}>
                  Buat Catatan
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          /* 2-column masonry layout */
          <View style={{ flexDirection: "row", gap: COLUMN_GAP }}>
            <View style={{ flex: 1 }}>
              {leftCol.map((note, i) => renderNoteCard(note, i * 2))}
            </View>
            <View style={{ flex: 1 }}>
              {rightCol.map((note, i) => renderNoteCard(note, i * 2 + 1))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── FAB ──────────────────────────────────────────────────────────── */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 24,
          right: 18,
          width: 52,
          height: 52,
          borderRadius: 16,
          backgroundColor: ACCENT_COLOR,
          shadowColor: ACCENT_COLOR,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 10,
          transform: [{ scale: fabScaleAnim }],
        }}
      >
        <TouchableOpacity
          style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}
          onPress={() => navigation.navigate("NoteForm")}
          onPressIn={fabPressIn}
          onPressOut={fabPressOut}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={26} color={BACKGROUND_COLOR} />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

export default NotesScreen;
