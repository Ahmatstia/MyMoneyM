import React, { useState, useEffect } from "react";
import { View, ScrollView, Alert, FlatList } from "react-native";
import {
  TextInput,
  Button,
  Chip,
  Text,
  HelperText,
  useTheme,
  Portal,
  Dialog,
  List,
  Snackbar,
} from "react-native-paper";
import { useAppContext } from "../../context/AppContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { format, subDays } from "date-fns";
import { id } from "date-fns/locale";

const NoteFormScreen = () => {
  const { state, addNote, editNote } = useAppContext();
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();

  const params = route.params as { noteId?: string };
  const noteId = params?.noteId;
  const existingNote = noteId ? state.notes.find((n) => n.id === noteId) : null;

  // State untuk form
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
  const [amount, setAmount] = useState(existingNote?.amount?.toString() || "");
  const [category, setCategory] = useState(existingNote?.category || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(existingNote?.tags || []);
  const [date, setDate] = useState(new Date(existingNote?.date || Date.now()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Debug: Log state changes
  useEffect(() => {
    console.log(
      "Title:",
      title,
      "Trimmed:",
      title.trim(),
      "Length:",
      title.trim().length
    );
    console.log("Is title empty?", !title.trim());
    console.log("Button disabled?", !title.trim());
  }, [title]);

  const noteTypes = [
    {
      label: "Keputusan Finansial",
      value: "financial_decision" as const,
      icon: "cash-check",
      color: "#3B82F6",
    },
    {
      label: "Refleksi Pengeluaran",
      value: "expense_reflection" as const,
      icon: "chart-bar",
      color: "#10B981",
    },
    {
      label: "Progress Tujuan",
      value: "goal_progress" as const,
      icon: "flag-checkered",
      color: "#8B5CF6",
    },
    {
      label: "Ide Investasi",
      value: "investment_idea" as const,
      icon: "lightbulb-on",
      color: "#F59E0B",
    },
    {
      label: "Analisis Budget",
      value: "budget_analysis" as const,
      icon: "chart-pie",
      color: "#EC4899",
    },
    {
      label: "Catatan Umum",
      value: "general" as const,
      icon: "note-text",
      color: "#6B7280",
    },
  ];

  const moods = [
    {
      label: "😊 Positif",
      value: "positive" as const,
      icon: "emoticon-happy",
      color: "#10B981",
    },
    {
      label: "😐 Netral",
      value: "neutral" as const,
      icon: "emoticon-neutral",
      color: "#6B7280",
    },
    {
      label: "😔 Negatif",
      value: "negative" as const,
      icon: "emoticon-sad",
      color: "#EF4444",
    },
    {
      label: "🤔 Reflektif",
      value: "reflective" as const,
      icon: "thought-bubble",
      color: "#8B5CF6",
    },
  ];

  const impacts = [
    { label: "Positif (+💰)", value: "positive" as const, color: "#10B981" },
    { label: "Netral", value: "neutral" as const, color: "#6B7280" },
    { label: "Negatif (-💰)", value: "negative" as const, color: "#EF4444" },
  ];

  // Generate 30 hari terakhir untuk date picker
  const dateOptions = Array.from({ length: 30 }, (_, i) => {
    const dateOption = subDays(new Date(), i);
    return {
      date: dateOption,
      label: format(dateOption, "EEEE, dd MMMM yyyy", { locale: id }),
      isToday: i === 0,
      isYesterday: i === 1,
    };
  });

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setTagInput("");
      } else {
        setSnackbarMessage("Tag sudah ada");
        setShowSnackbar(true);
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = async () => {
    console.log("SAVE CLICKED - Title:", title);

    if (!title.trim()) {
      Alert.alert("Perhatian", "Judul catatan harus diisi");
      return;
    }

    try {
      // Parse amount jika ada
      let parsedAmount: number | undefined = undefined;
      if (amount && amount.trim() !== "") {
        const cleanAmount = amount.replace(/\./g, "").replace(",", ".");
        parsedAmount = parseFloat(cleanAmount);
        if (isNaN(parsedAmount)) {
          parsedAmount = undefined;
        }
      }

      const noteData = {
        title: title.trim(),
        content: content.trim(),
        type,
        mood,
        financialImpact,
        amount: parsedAmount,
        category: category.trim() || undefined,
        tags,
        date: format(date, "yyyy-MM-dd"),
      };

      console.log("Saving note data:", noteData);

      if (existingNote) {
        await editNote(existingNote.id, noteData);
      } else {
        await addNote(noteData);
      }

      navigation.goBack();
    } catch (error) {
      console.error("Error saving note:", error);
      Alert.alert("Error", "Gagal menyimpan catatan");
    }
  };

  const formatCurrency = (value: string) => {
    if (!value) return "";
    const numericValue = value.replace(/[^0-9]/g, "");
    if (!numericValue) return "";
    return parseInt(numericValue, 10).toLocaleString("id-ID");
  };

  const handleAmountChange = (text: string) => {
    const formatted = formatCurrency(text);
    setAmount(formatted);
  };

  const handleSelectDate = (selectedDate: Date) => {
    setDate(selectedDate);
    setShowDatePicker(false);
  };

  // Fungsi untuk mendapatkan style berdasarkan selection
  const getChipStyle = (isSelected: boolean, color: string) => ({
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: isSelected ? color + "20" : "transparent",
    borderColor: isSelected ? color : theme.colors.outline,
    borderWidth: 1,
  });

  const getChipTextStyle = (isSelected: boolean, color: string) => ({
    color: isSelected ? color : theme.colors.onSurface,
  });

  // Debug current state
  const isButtonDisabled = !title.trim();
  console.log("Button disabled state:", isButtonDisabled);

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ padding: 16 }}>
          {/* Judul - HANYA INI YANG WAJIB */}
          <TextInput
            label="Judul Catatan*"
            value={title}
            onChangeText={(text) => {
              console.log("Title changed to:", text);
              setTitle(text);
            }}
            style={{ marginBottom: 16 }}
            mode="outlined"
            placeholder="Masukkan judul catatan..."
            maxLength={100}
            error={!title.trim()}
            right={<TextInput.Affix text={`${title.length}/100`} />}
          />

          {!title.trim() && (
            <HelperText type="error" visible={!title.trim()}>
              Judul harus diisi
            </HelperText>
          )}

          {/* Jenis Catatan */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 8,
              color: theme.colors.onSurface,
            }}
          >
            Jenis Catatan (opsional)
          </Text>
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}
          >
            {noteTypes.map((noteType) => {
              const isSelected = type === noteType.value;
              return (
                <Chip
                  key={noteType.value}
                  selected={isSelected}
                  onPress={() => setType(noteType.value)}
                  style={getChipStyle(isSelected, noteType.color)}
                  showSelectedCheck
                  icon={noteType.icon}
                  textStyle={getChipTextStyle(isSelected, noteType.color)}
                >
                  {noteType.label}
                </Chip>
              );
            })}
          </View>

          {/* Perasaan */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 8,
              color: theme.colors.onSurface,
            }}
          >
            Perasaan Anda (opsional)
          </Text>
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}
          >
            <Chip
              selected={mood === undefined}
              onPress={() => setMood(undefined)}
              style={getChipStyle(mood === undefined, theme.colors.outline)}
              showSelectedCheck
              icon="help-circle"
              textStyle={getChipTextStyle(
                mood === undefined,
                theme.colors.outline
              )}
            >
              Tidak memilih
            </Chip>
            {moods.map((m) => {
              const isSelected = mood === m.value;
              return (
                <Chip
                  key={m.value}
                  selected={isSelected}
                  onPress={() => setMood(m.value)}
                  style={getChipStyle(isSelected, m.color)}
                  showSelectedCheck
                  icon={m.icon}
                  textStyle={getChipTextStyle(isSelected, m.color)}
                >
                  {m.label}
                </Chip>
              );
            })}
          </View>

          {/* Dampak Finansial */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 8,
              color: theme.colors.onSurface,
            }}
          >
            Dampak Finansial (opsional)
          </Text>
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}
          >
            <Chip
              selected={financialImpact === undefined}
              onPress={() => setFinancialImpact(undefined)}
              style={getChipStyle(
                financialImpact === undefined,
                theme.colors.outline
              )}
              showSelectedCheck
              icon="help-circle"
              textStyle={getChipTextStyle(
                financialImpact === undefined,
                theme.colors.outline
              )}
            >
              Tidak memilih
            </Chip>
            {impacts.map((impact) => {
              const isSelected = financialImpact === impact.value;
              return (
                <Chip
                  key={impact.value}
                  selected={isSelected}
                  onPress={() => setFinancialImpact(impact.value)}
                  style={getChipStyle(isSelected, impact.color)}
                  showSelectedCheck
                  textStyle={getChipTextStyle(isSelected, impact.color)}
                >
                  {impact.label}
                </Chip>
              );
            })}
          </View>

          {/* Jumlah dan Kategori */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 8,
              color: theme.colors.onSurface,
            }}
          >
            Detail Lainnya (opsional)
          </Text>
          <View style={{ flexDirection: "row", marginBottom: 16 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <TextInput
                label="Jumlah (Rp)"
                value={amount}
                onChangeText={handleAmountChange}
                mode="outlined"
                keyboardType="numeric"
                placeholder="0"
              />
            </View>

            <View style={{ flex: 1 }}>
              <TextInput
                label="Kategori"
                value={category}
                onChangeText={setCategory}
                mode="outlined"
                placeholder="Misal: Investasi"
              />
            </View>
          </View>

          {/* Tanggal */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 8,
                color: theme.colors.onSurface,
              }}
            >
              Tanggal
            </Text>
            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              icon="calendar"
              style={{ marginBottom: 8 }}
            >
              {format(date, "dd MMMM yyyy", { locale: id })}
            </Button>

            {/* Date Picker Modal */}
            <Portal>
              <Dialog
                visible={showDatePicker}
                onDismiss={() => setShowDatePicker(false)}
                style={{ maxHeight: 400 }}
              >
                <Dialog.Title>Pilih Tanggal</Dialog.Title>
                <Dialog.Content>
                  <FlatList
                    data={dateOptions}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                      <List.Item
                        title={item.label}
                        description={
                          item.isToday
                            ? "Hari Ini"
                            : item.isYesterday
                            ? "Kemarin"
                            : ""
                        }
                        onPress={() => handleSelectDate(item.date)}
                        style={{ paddingVertical: 8 }}
                        left={(props) => (
                          <List.Icon
                            {...props}
                            icon={item.isToday ? "calendar-today" : "calendar"}
                          />
                        )}
                      />
                    )}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    showsVerticalScrollIndicator={false}
                  />
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={() => setShowDatePicker(false)}>
                    Batal
                  </Button>
                  <Button onPress={() => handleSelectDate(new Date())}>
                    Hari Ini
                  </Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>
          </View>

          {/* Tags */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 8,
              color: theme.colors.onSurface,
            }}
          >
            Tags (opsional)
          </Text>
          <View style={{ flexDirection: "row", marginBottom: 16 }}>
            <TextInput
              label="Tambah tag"
              value={tagInput}
              onChangeText={setTagInput}
              style={{ flex: 1, marginRight: 8 }}
              mode="outlined"
              onSubmitEditing={handleAddTag}
              placeholder="Contoh: penting, rencana"
            />
            <Button
              mode="outlined"
              onPress={handleAddTag}
              style={{ alignSelf: "center" }}
            >
              Tambah
            </Button>
          </View>

          {/* Tags yang sudah ditambahkan */}
          {tags.length > 0 && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  onClose={() => handleRemoveTag(tag)}
                  style={{ marginRight: 8, marginBottom: 8 }}
                  mode="outlined"
                >
                  {tag}
                </Chip>
              ))}
            </View>
          )}

          {/* Isi Catatan */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 8,
              color: theme.colors.onSurface,
            }}
          >
            Isi Catatan (opsional)
          </Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            style={{ marginBottom: 16, minHeight: 120 }}
            mode="outlined"
            multiline
            numberOfLines={6}
            placeholder="Tuliskan refleksi, analisis, atau keputusan keuangan Anda..."
            maxLength={2000}
            right={
              <TextInput.Affix
                text={`${content.length}/2000`}
                textStyle={{
                  color: content.length > 1500 ? theme.colors.error : undefined,
                }}
              />
            }
          />

          <HelperText type="info" style={{ marginBottom: 24 }}>
            * Hanya judul yang wajib diisi. Semua field lainnya opsional.
          </HelperText>

          {/* Debug Info */}
          <View
            style={{
              backgroundColor: theme.colors.surfaceVariant,
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <Text
              style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}
            >
              Debug Info:
            </Text>
            <Text
              style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}
            >
              Title: "{title}" (length: {title.length}, trimmed: "{title.trim()}
              ")
            </Text>
            <Text
              style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}
            >
              Button disabled: {isButtonDisabled ? "YA" : "TIDAK"}
            </Text>
          </View>

          {/* Tombol Aksi */}
          <View style={{ flexDirection: "row", marginBottom: 32 }}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={{ flex: 1, marginRight: 8 }}
            >
              Batal
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={{ flex: 1 }}
              icon={existingNote ? "content-save" : "plus"}
              disabled={isButtonDisabled}
            >
              {existingNote ? "Update" : "Simpan"}
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Snackbar untuk feedback */}
      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        duration={3000}
        action={{
          label: "OK",
          onPress: () => setShowSnackbar(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </>
  );
};

export default NoteFormScreen;
