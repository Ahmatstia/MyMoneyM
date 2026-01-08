// File: src/screens/Notes/NoteFormScreen.tsx - KONSISTEN DENGAN TEMA NAVY BLUE
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput as RNTextInput,
  Modal,
  FlatList,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { format, subDays } from "date-fns";
import { id } from "date-fns/locale";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { safeNumber, getCurrentDate } from "../../utils/calculations";
import { RootStackParamList } from "../../types";
import { Colors } from "../../theme/theme";

type NoteFormScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "NoteForm"
>;

type NoteFormScreenRouteProp = RouteProp<RootStackParamList, "NoteForm">;

// WARNA KONSISTEN
const PRIMARY_COLOR = Colors.primary;
const ACCENT_COLOR = Colors.accent;
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR = Colors.surface;
const TEXT_PRIMARY = Colors.textPrimary;
const TEXT_SECONDARY = Colors.textSecondary;
const BORDER_COLOR = Colors.border;
const SUCCESS_COLOR = Colors.success;
const WARNING_COLOR = Colors.warning;
const ERROR_COLOR = Colors.error;
const INFO_COLOR = Colors.info;
const PURPLE_COLOR = Colors.purple;
const PINK_COLOR = Colors.pink;

const NOTE_TYPES = [
  {
    id: "financial_decision",
    name: "Keputusan Finansial",
    icon: "cash" as const,
    color: ACCENT_COLOR,
  },
  {
    id: "expense_reflection",
    name: "Refleksi Pengeluaran",
    icon: "receipt" as const,
    color: SUCCESS_COLOR,
  },
  {
    id: "goal_progress",
    name: "Progress Tujuan",
    icon: "flag" as const,
    color: WARNING_COLOR,
  },
  {
    id: "investment_idea",
    name: "Ide Investasi",
    icon: "trending-up" as const,
    color: INFO_COLOR,
  },
  {
    id: "budget_analysis",
    name: "Analisis Budget",
    icon: "pie-chart" as const,
    color: PURPLE_COLOR,
  },
  {
    id: "general",
    name: "Catatan Umum",
    icon: "document-text" as const,
    color: PINK_COLOR,
  },
] as const;

const MOODS = [
  {
    id: "positive" as const,
    name: "😊 Positif",
    icon: "happy" as const,
    color: SUCCESS_COLOR,
  },
  {
    id: "neutral" as const,
    name: "😐 Netral",
    icon: "remove" as const,
    color: WARNING_COLOR,
  },
  {
    id: "negative" as const,
    name: "😔 Negatif",
    icon: "sad" as const,
    color: ERROR_COLOR,
  },
  {
    id: "reflective" as const,
    name: "🤔 Reflektif",
    icon: "bulb" as const,
    color: INFO_COLOR,
  },
] as const;

const IMPACTS = [
  { id: "positive" as const, name: "Positif (+💰)", color: SUCCESS_COLOR },
  { id: "neutral" as const, name: "Netral", color: WARNING_COLOR },
  { id: "negative" as const, name: "Negatif (-💰)", color: ERROR_COLOR },
] as const;

const NoteFormScreen: React.FC = () => {
  const navigation = useNavigation<NoteFormScreenNavigationProp>();
  const route = useRoute<NoteFormScreenRouteProp>();

  const { state, addNote, editNote, deleteNote } = useAppContext();
  const params = route.params || {};
  const noteId = params.noteId;
  const existingNote = noteId ? state.notes.find((n) => n.id === noteId) : null;
  const isEditMode = !!existingNote;

  // State utama dengan type safety
  const [title, setTitle] = useState(existingNote?.title || "");
  const [content, setContent] = useState(existingNote?.content || "");
  const [type, setType] = useState<
    | "financial_decision"
    | "expense_reflection"
    | "goal_progress"
    | "investment_idea"
    | "budget_analysis"
    | "general"
  >(existingNote?.type || "general");
  const [mood, setMood] = useState<
    "positive" | "neutral" | "negative" | "reflective" | undefined
  >(existingNote?.mood);
  const [financialImpact, setFinancialImpact] = useState<
    "positive" | "neutral" | "negative" | undefined
  >(existingNote?.financialImpact);
  const [amount, setAmount] = useState(
    existingNote?.amount ? safeNumber(existingNote.amount).toString() : ""
  );
  const [category, setCategory] = useState(existingNote?.category || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(existingNote?.tags || []);
  const [date, setDate] = useState<string>(
    existingNote?.date || getCurrentDate()
  );
  const [loading, setLoading] = useState(false);
  const [titleError, setTitleError] = useState("");

  // State untuk modals
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showImpactModal, setShowImpactModal] = useState(false);

  // Update title dan header
  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? "Edit Catatan" : "Tambah Catatan",
      headerStyle: { backgroundColor: PRIMARY_COLOR },
      headerTintColor: TEXT_PRIMARY,
      headerTitleStyle: { fontWeight: "600" },
      headerRight: () => (
        <TouchableOpacity
          onPress={showDeleteConfirmation}
          style={tw`mr-4 ${isEditMode ? "opacity-100" : "opacity-0"}`}
          disabled={!isEditMode || loading}
        >
          <Ionicons
            name="trash-outline"
            size={22}
            color={isEditMode && !loading ? TEXT_PRIMARY : "transparent"}
          />
        </TouchableOpacity>
      ),
    });
  }, [isEditMode, navigation, loading]);

  // Generate 30 hari terakhir untuk date picker
  const generateDateOptions = () => {
    return Array.from({ length: 30 }, (_, i) => {
      const dateOption = subDays(new Date(), i);
      return {
        date: dateOption,
        formatted: format(dateOption, "yyyy-MM-dd"),
        display: format(dateOption, "EEEE, dd MMMM yyyy", { locale: id }),
        isToday: i === 0,
        isYesterday: i === 1,
      };
    });
  };

  const dateOptions = generateDateOptions();

  // Validasi title
  const validateTitle = (value: string): boolean => {
    setTitleError("");

    if (!value.trim()) {
      setTitleError("Judul catatan harus diisi");
      return false;
    }

    if (value.trim().length < 3) {
      setTitleError("Judul minimal 3 karakter");
      return false;
    }

    if (value.trim().length > 100) {
      setTitleError("Judul maksimal 100 karakter");
      return false;
    }

    return true;
  };

  // Handle title change
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (value.trim()) {
      validateTitle(value);
    } else {
      setTitleError("");
    }
  };

  // Handle amount change
  const handleAmountChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, "");
    setAmount(cleanValue);
  };

  // Format amount display
  const formatAmountDisplay = () => {
    if (!amount) return "";
    const amountNum = safeNumber(parseFloat(amount));
    if (isNaN(amountNum)) return amount;

    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountNum);
  };

  // Handle tag add
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Handle delete
  const handleDeleteNote = useCallback(async () => {
    if (!existingNote?.id) return;

    try {
      await deleteNote(existingNote.id);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Gagal menghapus catatan");
    }
  }, [existingNote, deleteNote, navigation]);

  const showDeleteConfirmation = useCallback(() => {
    if (!isEditMode || !existingNote) return;

    Alert.alert(
      "Hapus Catatan",
      `Apakah Anda yakin ingin menghapus catatan "${existingNote.title}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: handleDeleteNote,
        },
      ]
    );
  }, [isEditMode, existingNote, handleDeleteNote]);

  // Handle submit - PERBAIKAN DI SINI
  const handleSubmit = async () => {
    if (!validateTitle(title)) {
      Alert.alert("Error", titleError || "Judul tidak valid");
      return;
    }

    setLoading(true);
    try {
      const amountNum = amount ? safeNumber(parseFloat(amount)) : undefined;

      // Untuk editNote (Partial<Note>)
      const editNoteData = {
        title: title.trim(),
        content: content.trim() || undefined,
        type,
        mood,
        financialImpact,
        amount: amountNum,
        category: category.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        date,
      };

      // Untuk addNote (Omit<Note, "id" | "createdAt" | "updatedAt">)
      // tags HARUS array, minimal array kosong, bukan undefined
      const addNoteData = {
        title: title.trim(),
        content: content.trim() || "", // Required field, minimal string kosong
        type,
        mood: mood || undefined,
        financialImpact: financialImpact || undefined,
        amount: amountNum,
        category: category.trim() || undefined,
        tags: tags, // HARUS array, tags sudah diinisialisasi sebagai [] di useState
        date,
      };

      if (isEditMode && existingNote) {
        await editNote(existingNote.id, editNoteData);
        Alert.alert("Sukses", "Catatan berhasil diperbarui", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        await addNote(addNoteData);
        Alert.alert("Sukses", "Catatan berhasil ditambahkan", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || `Gagal ${isEditMode ? "mengedit" : "menambah"} catatan`
      );
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDisplayDate = (dateStr: string): string => {
    try {
      const dateObj = new Date(dateStr);
      return format(dateObj, "EEEE, dd MMMM yyyy", { locale: id });
    } catch (error) {
      return dateStr;
    }
  };

  // Get selected type name
  const getSelectedTypeName = () => {
    return NOTE_TYPES.find((t) => t.id === type)?.name || "Catatan Umum";
  };

  // Get selected mood name
  const getSelectedMoodName = () => {
    return MOODS.find((m) => m.id === mood)?.name || "Pilih perasaan";
  };

  // Get selected impact name
  const getSelectedImpactName = () => {
    return (
      IMPACTS.find((i) => i.id === financialImpact)?.name || "Pilih dampak"
    );
  };

  return (
    <View style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-5 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Input - WAJIB */}
        <View style={tw`mb-5`}>
          <Text
            style={[tw`text-sm font-medium mb-3`, { color: TEXT_SECONDARY }]}
          >
            Judul Catatan *
          </Text>
          <View
            style={[
              tw`rounded-2xl p-4 border`,
              {
                backgroundColor: SURFACE_COLOR,
                borderColor: titleError ? ERROR_COLOR : BORDER_COLOR,
              },
            ]}
          >
            <RNTextInput
              style={[tw`text-base font-medium`, { color: TEXT_PRIMARY }]}
              placeholder="Masukkan judul catatan..."
              placeholderTextColor={Colors.textTertiary}
              value={title}
              onChangeText={handleTitleChange}
              maxLength={100}
              editable={!loading}
            />
            <View style={tw`flex-row justify-between mt-2`}>
              <Text
                style={[
                  tw`text-xs`,
                  { color: titleError ? ERROR_COLOR : TEXT_SECONDARY },
                ]}
              >
                {titleError || "Minimal 3 karakter"}
              </Text>
              <Text style={[tw`text-xs`, { color: Colors.textTertiary }]}>
                {title.length}/100
              </Text>
            </View>
          </View>
        </View>

        {/* Type Selection */}
        <View style={tw`mb-5`}>
          <Text
            style={[tw`text-sm font-medium mb-3`, { color: TEXT_SECONDARY }]}
          >
            Jenis Catatan (opsional)
          </Text>
          <TouchableOpacity
            style={[
              tw`rounded-2xl p-4 flex-row justify-between items-center border`,
              { backgroundColor: SURFACE_COLOR, borderColor: BORDER_COLOR },
            ]}
            onPress={() => setShowTypeModal(true)}
            disabled={loading}
          >
            <View style={tw`flex-row items-center`}>
              <Ionicons
                name={
                  NOTE_TYPES.find((t) => t.id === type)?.icon || "document-text"
                }
                size={20}
                color={
                  NOTE_TYPES.find((t) => t.id === type)?.color || TEXT_SECONDARY
                }
                style={tw`mr-3`}
              />
              <Text style={[tw`text-sm`, { color: TEXT_PRIMARY }]}>
                {getSelectedTypeName()}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>

        {/* Mood Selection */}
        <View style={tw`mb-5`}>
          <Text
            style={[tw`text-sm font-medium mb-3`, { color: TEXT_SECONDARY }]}
          >
            Perasaan Anda (opsional)
          </Text>
          <TouchableOpacity
            style={[
              tw`rounded-2xl p-4 flex-row justify-between items-center border`,
              { backgroundColor: SURFACE_COLOR, borderColor: BORDER_COLOR },
            ]}
            onPress={() => setShowMoodModal(true)}
            disabled={loading}
          >
            <View style={tw`flex-row items-center`}>
              <Ionicons
                name={MOODS.find((m) => m.id === mood)?.icon || "help-circle"}
                size={20}
                color={
                  MOODS.find((m) => m.id === mood)?.color || TEXT_SECONDARY
                }
                style={tw`mr-3`}
              />
              <Text style={[tw`text-sm`, { color: TEXT_PRIMARY }]}>
                {getSelectedMoodName()}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>

        {/* Financial Impact Selection */}
        <View style={tw`mb-5`}>
          <Text
            style={[tw`text-sm font-medium mb-3`, { color: TEXT_SECONDARY }]}
          >
            Dampak Finansial (opsional)
          </Text>
          <TouchableOpacity
            style={[
              tw`rounded-2xl p-4 flex-row justify-between items-center border`,
              { backgroundColor: SURFACE_COLOR, borderColor: BORDER_COLOR },
            ]}
            onPress={() => setShowImpactModal(true)}
            disabled={loading}
          >
            <View style={tw`flex-row items-center`}>
              <Ionicons
                name={financialImpact ? "trending-up" : "help-circle"}
                size={20}
                color={
                  financialImpact
                    ? IMPACTS.find((i) => i.id === financialImpact)?.color ||
                      ACCENT_COLOR
                    : TEXT_SECONDARY
                }
                style={tw`mr-3`}
              />
              <Text style={[tw`text-sm`, { color: TEXT_PRIMARY }]}>
                {getSelectedImpactName()}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>

        {/* Amount and Category */}
        <View style={tw`mb-5`}>
          <Text
            style={[tw`text-sm font-medium mb-3`, { color: TEXT_SECONDARY }]}
          >
            Detail Lainnya (opsional)
          </Text>
          <View style={tw`flex-row gap-3`}>
            {/* Amount Input */}
            <View style={tw`flex-1`}>
              <Text style={[tw`text-xs mb-2`, { color: TEXT_SECONDARY }]}>
                Jumlah (Rp)
              </Text>
              <View
                style={[
                  tw`rounded-xl p-3 border`,
                  { backgroundColor: SURFACE_COLOR, borderColor: BORDER_COLOR },
                ]}
              >
                <View style={tw`flex-row items-center`}>
                  <Text style={[tw`mr-2`, { color: TEXT_SECONDARY }]}>Rp</Text>
                  <RNTextInput
                    style={[tw`flex-1`, { color: TEXT_PRIMARY }]}
                    placeholder="0"
                    placeholderTextColor={Colors.textTertiary}
                    value={amount}
                    onChangeText={handleAmountChange}
                    keyboardType="numeric"
                    maxLength={15}
                    editable={!loading}
                  />
                </View>
              </View>
            </View>

            {/* Category Input */}
            <View style={tw`flex-1`}>
              <Text style={[tw`text-xs mb-2`, { color: TEXT_SECONDARY }]}>
                Kategori
              </Text>
              <View
                style={[
                  tw`rounded-xl p-3 border`,
                  { backgroundColor: SURFACE_COLOR, borderColor: BORDER_COLOR },
                ]}
              >
                <RNTextInput
                  style={[{ color: TEXT_PRIMARY }]}
                  placeholder="Contoh: Investasi"
                  placeholderTextColor={Colors.textTertiary}
                  value={category}
                  onChangeText={setCategory}
                  maxLength={50}
                  editable={!loading}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Date Selection */}
        <View style={tw`mb-5`}>
          <Text
            style={[tw`text-sm font-medium mb-3`, { color: TEXT_SECONDARY }]}
          >
            Tanggal
          </Text>
          <TouchableOpacity
            style={[
              tw`rounded-2xl p-4 flex-row justify-between items-center border`,
              { backgroundColor: SURFACE_COLOR, borderColor: BORDER_COLOR },
            ]}
            onPress={() => setShowDateModal(true)}
            disabled={loading}
          >
            <View style={tw`flex-row items-center`}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={ACCENT_COLOR}
                style={tw`mr-3`}
              />
              <Text style={[tw`text-sm`, { color: TEXT_PRIMARY }]}>
                {formatDisplayDate(date)}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>

        {/* Tags */}
        <View style={tw`mb-5`}>
          <Text
            style={[tw`text-sm font-medium mb-3`, { color: TEXT_SECONDARY }]}
          >
            Tags (opsional)
          </Text>
          <View style={tw`flex-row gap-2 mb-3`}>
            <View
              style={[
                tw`flex-1 rounded-xl p-3 border`,
                {
                  backgroundColor: SURFACE_COLOR,
                  borderColor: BORDER_COLOR,
                },
              ]}
            >
              <RNTextInput
                style={[{ color: TEXT_PRIMARY }]}
                placeholder="Tambah tag..."
                placeholderTextColor={Colors.textTertiary}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={handleAddTag}
                returnKeyType="done"
                editable={!loading}
              />
            </View>
            <TouchableOpacity
              style={[
                tw`rounded-xl px-4 justify-center`,
                { backgroundColor: ACCENT_COLOR },
              ]}
              onPress={handleAddTag}
              disabled={!tagInput.trim() || loading}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Tags List */}
          {tags.length > 0 && (
            <View style={tw`flex-row flex-wrap gap-2`}>
              {tags.map((tag, index) => (
                <View
                  key={index}
                  style={[
                    tw`rounded-full px-3 py-1.5 flex-row items-center`,
                    { backgroundColor: ACCENT_COLOR + "20" },
                  ]}
                >
                  <Text style={[tw`text-xs`, { color: ACCENT_COLOR }]}>
                    #{tag}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveTag(tag)}
                    style={tw`ml-2`}
                  >
                    <Ionicons name="close" size={14} color={ACCENT_COLOR} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Content Input */}
        <View style={tw`mb-5`}>
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <Text style={[tw`text-sm font-medium`, { color: TEXT_SECONDARY }]}>
              Isi Catatan (opsional)
            </Text>
            <Text style={[tw`text-xs`, { color: Colors.textTertiary }]}>
              {content.length}/2000
            </Text>
          </View>
          <View
            style={[
              tw`rounded-2xl p-4 border`,
              { backgroundColor: SURFACE_COLOR, borderColor: BORDER_COLOR },
            ]}
          >
            <RNTextInput
              style={[tw`text-sm min-h-40`, { color: TEXT_PRIMARY }]}
              placeholder="Tuliskan refleksi, analisis, atau keputusan keuangan Anda..."
              placeholderTextColor={Colors.textTertiary}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              maxLength={2000}
              editable={!loading}
            />
          </View>
          <Text style={[tw`text-xs mt-2`, { color: Colors.textTertiary }]}>
            * Hanya judul yang wajib diisi. Semua field lainnya opsional.
          </Text>
        </View>

        {/* Tips */}
        <View
          style={[
            tw`rounded-2xl p-4 mb-5`,
            {
              backgroundColor: INFO_COLOR + "10",
              borderWidth: 1,
              borderColor: INFO_COLOR + "30",
            },
          ]}
        >
          <View style={tw`flex-row items-center mb-3`}>
            <Ionicons name="bulb-outline" size={16} color={INFO_COLOR} />
            <Text
              style={[tw`text-sm font-semibold ml-2`, { color: INFO_COLOR }]}
            >
              💡 Tips Membuat Catatan Keuangan
            </Text>
          </View>

          <Text style={[tw`text-xs mb-1`, { color: INFO_COLOR }]}>
            • <Text style={tw`font-medium`}>Jujur</Text>: Catat perasaan dan
            keputusan apa adanya
          </Text>
          <Text style={[tw`text-xs mb-1`, { color: INFO_COLOR }]}>
            • <Text style={tw`font-medium`}>Spesifik</Text>: Sertakan angka dan
            detail untuk analisis
          </Text>
          <Text style={[tw`text-xs mb-1`, { color: INFO_COLOR }]}>
            • <Text style={tw`font-medium`}>Rutin</Text>: Buat catatan secara
            berkala
          </Text>
          <Text style={[tw`text-xs`, { color: INFO_COLOR }]}>
            • <Text style={tw`font-medium`}>Reflektif</Text>: Gunakan untuk
            evaluasi pola keuangan
          </Text>
        </View>

        {/* Action Buttons - KONSISTEN STYLE */}
        <View style={tw`flex-row gap-3 mt-3`}>
          {/* Batal Button */}
          <TouchableOpacity
            style={[
              tw`flex-1 rounded-2xl py-4 items-center border-2`,
              { borderColor: BORDER_COLOR, backgroundColor: SURFACE_COLOR },
            ]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={[tw`text-sm font-semibold`, { color: TEXT_PRIMARY }]}>
              Batal
            </Text>
          </TouchableOpacity>

          {/* Simpan Button */}
          <TouchableOpacity
            style={[
              tw`flex-1 rounded-2xl py-4 items-center`,
              { backgroundColor: ACCENT_COLOR, opacity: loading ? 0.7 : 1 },
            ]}
            onPress={handleSubmit}
            disabled={!title.trim() || loading}
          >
            <Text style={tw`text-white text-sm font-semibold`}>
              {loading ? "Menyimpan..." : isEditMode ? "Simpan" : "Tambah"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Selection Modal */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
          <View
            style={[tw`rounded-t-3xl p-5`, { backgroundColor: SURFACE_COLOR }]}
          >
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={[tw`text-lg font-bold`, { color: TEXT_PRIMARY }]}>
                Pilih Tanggal
              </Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={TEXT_SECONDARY}
                />
              </TouchableOpacity>
            </View>

            <FlatList
              data={dateOptions}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    tw`p-4 flex-row items-center border-b`,
                    {
                      borderColor: Colors.surfaceLight,
                      backgroundColor:
                        item.formatted === date
                          ? ACCENT_COLOR + "10"
                          : "transparent",
                    },
                  ]}
                  onPress={() => {
                    setDate(item.formatted);
                    setShowDateModal(false);
                  }}
                >
                  <Ionicons
                    name={item.isToday ? "calendar" : "calendar-outline"}
                    size={20}
                    color={
                      item.formatted === date ? ACCENT_COLOR : TEXT_SECONDARY
                    }
                    style={tw`mr-3`}
                  />
                  <View style={tw`flex-1`}>
                    <Text style={[tw`text-sm`, { color: TEXT_PRIMARY }]}>
                      {item.display}
                    </Text>
                    {item.isToday && (
                      <Text style={[tw`text-xs mt-1`, { color: ACCENT_COLOR }]}>
                        Hari Ini
                      </Text>
                    )}
                    {item.isYesterday && (
                      <Text
                        style={[
                          tw`text-xs mt-1`,
                          { color: Colors.textTertiary },
                        ]}
                      >
                        Kemarin
                      </Text>
                    )}
                  </View>
                  {item.formatted === date && (
                    <Ionicons name="checkmark" size={20} color={ACCENT_COLOR} />
                  )}
                </TouchableOpacity>
              )}
              style={tw`max-h-96`}
            />
          </View>
        </View>
      </Modal>

      {/* Type Selection Modal */}
      <Modal
        visible={showTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
          <View
            style={[tw`rounded-t-3xl p-5`, { backgroundColor: SURFACE_COLOR }]}
          >
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={[tw`text-lg font-bold`, { color: TEXT_PRIMARY }]}>
                Pilih Jenis Catatan
              </Text>
              <TouchableOpacity onPress={() => setShowTypeModal(false)}>
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={TEXT_SECONDARY}
                />
              </TouchableOpacity>
            </View>

            <View style={tw`flex-row flex-wrap justify-between`}>
              {NOTE_TYPES.map((noteType) => (
                <TouchableOpacity
                  key={noteType.id}
                  style={[
                    tw`w-[48%] rounded-xl p-4 items-center mb-3`,
                    {
                      backgroundColor:
                        type === noteType.id
                          ? noteType.color + "20"
                          : SURFACE_COLOR,
                      borderWidth: 2,
                      borderColor:
                        type === noteType.id ? noteType.color : BORDER_COLOR,
                    },
                  ]}
                  onPress={() => {
                    setType(noteType.id);
                    setShowTypeModal(false);
                  }}
                >
                  <Ionicons
                    name={noteType.icon}
                    size={24}
                    color={
                      type === noteType.id ? noteType.color : TEXT_SECONDARY
                    }
                    style={tw`mb-2`}
                  />
                  <Text
                    style={[
                      tw`text-xs text-center font-medium`,
                      {
                        color:
                          type === noteType.id ? noteType.color : TEXT_PRIMARY,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {noteType.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Mood Selection Modal */}
      <Modal
        visible={showMoodModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMoodModal(false)}
      >
        <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
          <View
            style={[tw`rounded-t-3xl p-5`, { backgroundColor: SURFACE_COLOR }]}
          >
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={[tw`text-lg font-bold`, { color: TEXT_PRIMARY }]}>
                Pilih Perasaan
              </Text>
              <TouchableOpacity onPress={() => setShowMoodModal(false)}>
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={TEXT_SECONDARY}
                />
              </TouchableOpacity>
            </View>

            <View style={tw`flex-row flex-wrap justify-between`}>
              <TouchableOpacity
                style={[
                  tw`w-[48%] rounded-xl p-4 items-center mb-3`,
                  {
                    backgroundColor: !mood
                      ? ACCENT_COLOR + "20"
                      : SURFACE_COLOR,
                    borderWidth: 2,
                    borderColor: !mood ? ACCENT_COLOR : BORDER_COLOR,
                  },
                ]}
                onPress={() => {
                  setMood(undefined);
                  setShowMoodModal(false);
                }}
              >
                <Ionicons
                  name="help-circle"
                  size={24}
                  color={!mood ? ACCENT_COLOR : TEXT_SECONDARY}
                  style={tw`mb-2`}
                />
                <Text
                  style={[
                    tw`text-xs text-center font-medium`,
                    { color: !mood ? ACCENT_COLOR : TEXT_PRIMARY },
                  ]}
                >
                  Tidak memilih
                </Text>
              </TouchableOpacity>

              {MOODS.map((moodItem) => (
                <TouchableOpacity
                  key={moodItem.id}
                  style={[
                    tw`w-[48%] rounded-xl p-4 items-center mb-3`,
                    {
                      backgroundColor:
                        mood === moodItem.id
                          ? moodItem.color + "20"
                          : SURFACE_COLOR,
                      borderWidth: 2,
                      borderColor:
                        mood === moodItem.id ? moodItem.color : BORDER_COLOR,
                    },
                  ]}
                  onPress={() => {
                    setMood(moodItem.id);
                    setShowMoodModal(false);
                  }}
                >
                  <Ionicons
                    name={moodItem.icon}
                    size={24}
                    color={
                      mood === moodItem.id ? moodItem.color : TEXT_SECONDARY
                    }
                    style={tw`mb-2`}
                  />
                  <Text
                    style={[
                      tw`text-xs text-center font-medium`,
                      {
                        color:
                          mood === moodItem.id ? moodItem.color : TEXT_PRIMARY,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {moodItem.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Impact Selection Modal */}
      <Modal
        visible={showImpactModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImpactModal(false)}
      >
        <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
          <View
            style={[tw`rounded-t-3xl p-5`, { backgroundColor: SURFACE_COLOR }]}
          >
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={[tw`text-lg font-bold`, { color: TEXT_PRIMARY }]}>
                Pilih Dampak Finansial
              </Text>
              <TouchableOpacity onPress={() => setShowImpactModal(false)}>
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={TEXT_SECONDARY}
                />
              </TouchableOpacity>
            </View>

            <View style={tw`flex-row flex-wrap justify-between`}>
              <TouchableOpacity
                style={[
                  tw`w-[48%] rounded-xl p-4 items-center mb-3`,
                  {
                    backgroundColor: !financialImpact
                      ? ACCENT_COLOR + "20"
                      : SURFACE_COLOR,
                    borderWidth: 2,
                    borderColor: !financialImpact ? ACCENT_COLOR : BORDER_COLOR,
                  },
                ]}
                onPress={() => {
                  setFinancialImpact(undefined);
                  setShowImpactModal(false);
                }}
              >
                <Ionicons
                  name="help-circle"
                  size={24}
                  color={!financialImpact ? ACCENT_COLOR : TEXT_SECONDARY}
                  style={tw`mb-2`}
                />
                <Text
                  style={[
                    tw`text-xs text-center font-medium`,
                    { color: !financialImpact ? ACCENT_COLOR : TEXT_PRIMARY },
                  ]}
                >
                  Tidak memilih
                </Text>
              </TouchableOpacity>

              {IMPACTS.map((impact) => (
                <TouchableOpacity
                  key={impact.id}
                  style={[
                    tw`w-[48%] rounded-xl p-4 items-center mb-3`,
                    {
                      backgroundColor:
                        financialImpact === impact.id
                          ? impact.color + "20"
                          : SURFACE_COLOR,
                      borderWidth: 2,
                      borderColor:
                        financialImpact === impact.id
                          ? impact.color
                          : BORDER_COLOR,
                    },
                  ]}
                  onPress={() => {
                    setFinancialImpact(impact.id);
                    setShowImpactModal(false);
                  }}
                >
                  <Ionicons
                    name="trending-up"
                    size={24}
                    color={
                      financialImpact === impact.id
                        ? impact.color
                        : TEXT_SECONDARY
                    }
                    style={tw`mb-2`}
                  />
                  <Text
                    style={[
                      tw`text-xs text-center font-medium`,
                      {
                        color:
                          financialImpact === impact.id
                            ? impact.color
                            : TEXT_PRIMARY,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {impact.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default NoteFormScreen;
