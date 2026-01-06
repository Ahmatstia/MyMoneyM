import React, { useState, useMemo } from "react";
import { View, FlatList, Alert } from "react-native";
import {
  Searchbar,
  FAB,
  Chip,
  Card,
  Text,
  useTheme,
  IconButton,
  Menu,
  Divider,
} from "react-native-paper";
import { useAppContext } from "../../context/AppContext";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import tw from "twrnc";

const NotesScreen = ({ navigation }: any) => {
  const { state, deleteNote } = useAppContext();
  const { notes } = state;
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "title">("date");
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const theme = useTheme();

  const filteredNotes = useMemo(() => {
    let filtered = [...notes];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Filter by type
    if (filterType) {
      filtered = filtered.filter((note) => note.type === filterType);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return a.title.localeCompare(b.title);
      }
    });

    return filtered;
  }, [notes, searchQuery, filterType, sortBy]);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      financial_decision: "Keputusan Finansial",
      expense_reflection: "Refleksi Pengeluaran",
      goal_progress: "Progress Tujuan",
      investment_idea: "Ide Investasi",
      budget_analysis: "Analisis Budget",
      general: "Catatan Umum",
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      financial_decision: "#3B82F6", // blue
      expense_reflection: "#10B981", // green
      goal_progress: "#8B5CF6", // purple
      investment_idea: "#F59E0B", // yellow
      budget_analysis: "#EC4899", // pink
      general: "#6B7280", // gray
    };
    return colors[type] || "#6B7280";
  };

  const getMoodIcon = (mood?: string) => {
    const icons: Record<string, string> = {
      positive: "emoticon-happy-outline",
      neutral: "emoticon-neutral-outline",
      negative: "emoticon-sad-outline",
      reflective: "lightbulb-outline",
    };
    return icons[mood || "neutral"] || "emoticon-neutral-outline";
  };

  const handleDeleteNote = (id: string, title: string) => {
    Alert.alert(
      "Hapus Catatan",
      `Apakah Anda yakin ingin menghapus catatan "${title}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            deleteNote(id);
            setMenuVisible(null);
          },
        },
      ]
    );
  };

  if (notes.length === 0) {
    return (
      <View
        style={[
          tw`flex-1 bg-[${theme.colors.background}] items-center justify-center p-8`,
        ]}
      >
        <IconButton
          icon="note-text-outline"
          size={80}
          iconColor={theme.colors.onSurfaceVariant}
          style={tw`mb-4`}
        />
        <Text
          style={[
            tw`text-xl font-bold mb-2`,
            { color: theme.colors.onSurface },
          ]}
        >
          Belum Ada Catatan
        </Text>
        <Text
          style={[
            tw`text-center mb-6`,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Mulai dengan mencatat keputusan finansial, refleksi pengeluaran, atau
          ide investasi Anda.
        </Text>
        <FAB
          icon="plus"
          label="Buat Catatan Pertama"
          style={[tw`mt-4`, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate("NoteForm")}
        />
      </View>
    );
  }

  return (
    <View style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
      {/* Header dengan Search dan Filter */}
      <View style={tw`p-4`}>
        <Searchbar
          placeholder="Cari catatan..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={tw`mb-4`}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          iconColor={theme.colors.primary}
        />

        <View style={tw`flex-row flex-wrap mb-4`}>
          <Chip
            selected={sortBy === "date"}
            onPress={() => setSortBy("date")}
            style={tw`mr-2 mb-2`}
            icon="calendar"
          >
            Terbaru
          </Chip>
          <Chip
            selected={sortBy === "title"}
            onPress={() => setSortBy("title")}
            style={tw`mr-2 mb-2`}
            icon="sort-alphabetical-ascending"
          >
            Judul
          </Chip>
        </View>

        <View style={tw`flex-row flex-wrap`}>
          {[
            "financial_decision",
            "expense_reflection",
            "goal_progress",
            "investment_idea",
            "budget_analysis",
          ].map((type) => (
            <Chip
              key={type}
              selected={filterType === type}
              onPress={() => setFilterType(filterType === type ? null : type)}
              style={tw`mr-2 mb-2`}
              mode="outlined"
              showSelectedCheck
            >
              {getTypeLabel(type)}
            </Chip>
          ))}
          {filterType && (
            <Chip
              icon="close"
              onPress={() => setFilterType(null)}
              style={tw`mb-2`}
              mode="outlined"
            >
              Clear
            </Chip>
          )}
        </View>
      </View>

      {/* Info Jumlah Catatan */}
      <View style={tw`px-4 mb-2`}>
        <Text style={[tw`text-sm`, { color: theme.colors.onSurfaceVariant }]}>
          {filteredNotes.length} catatan ditemukan
        </Text>
      </View>

      {/* Daftar Catatan */}
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={tw`pb-24 px-4`}
        renderItem={({ item }) => (
          <Card
            style={tw`mb-3`}
            onPress={() =>
              navigation.navigate("NoteDetail", { noteId: item.id })
            }
            onLongPress={() => setMenuVisible(item.id)}
          >
            <Card.Content>
              <View style={tw`flex-row justify-between items-start mb-2`}>
                <View style={tw`flex-row items-center`}>
                  <Chip
                    mode="outlined"
                    style={{ borderColor: getTypeColor(item.type) }}
                    textStyle={{ color: getTypeColor(item.type), fontSize: 12 }}
                  >
                    {getTypeLabel(item.type)}
                  </Chip>
                  {item.mood && (
                    <IconButton
                      icon={getMoodIcon(item.mood)}
                      size={16}
                      iconColor={getTypeColor(item.type)}
                      style={tw`ml-2`}
                    />
                  )}
                </View>

                <Menu
                  visible={menuVisible === item.id}
                  onDismiss={() => setMenuVisible(null)}
                  anchor={
                    <IconButton
                      icon="dots-vertical"
                      size={20}
                      onPress={() => setMenuVisible(item.id)}
                    />
                  }
                >
                  <Menu.Item
                    leadingIcon="pencil"
                    onPress={() => {
                      setMenuVisible(null);
                      navigation.navigate("NoteForm", { noteId: item.id });
                    }}
                    title="Edit"
                  />
                  <Divider />
                  <Menu.Item
                    leadingIcon="delete"
                    onPress={() => handleDeleteNote(item.id, item.title)}
                    title="Hapus"
                    titleStyle={{ color: theme.colors.error }}
                  />
                </Menu>
              </View>

              <Text
                style={[
                  tw`text-lg font-bold mb-1`,
                  { color: theme.colors.onSurface },
                ]}
              >
                {item.title}
              </Text>

              {item.amount && (
                <Text
                  style={[tw`text-sm mb-1`, { color: theme.colors.primary }]}
                >
                  Rp {item.amount.toLocaleString("id-ID")}
                </Text>
              )}

              <Text
                style={[
                  tw`text-sm mb-2`,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                numberOfLines={3}
              >
                {item.content}
              </Text>

              <View style={tw`flex-row justify-between items-center`}>
                <View style={tw`flex-row flex-wrap flex-1`}>
                  {item.tags.slice(0, 2).map((tag) => (
                    <Chip key={tag} style={tw`mr-1 mb-1`} mode="outlined">
                      {tag}
                    </Chip>
                  ))}
                  {item.tags.length > 2 && (
                    <Chip style={tw`mr-1 mb-1`} mode="outlined">
                      +{item.tags.length - 2}
                    </Chip>
                  )}
                </View>

                <Text
                  style={[
                    tw`text-xs`,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {format(new Date(item.date), "dd MMM yyyy", { locale: id })}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <View style={tw`items-center justify-center py-12`}>
            <IconButton
              icon="magnify"
              size={60}
              iconColor={theme.colors.onSurfaceVariant}
              style={tw`mb-4`}
            />
            <Text
              style={[
                tw`text-center`,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Tidak ada catatan yang cocok dengan pencarian
            </Text>
          </View>
        }
      />

      {/* FAB untuk Tambah Catatan */}
      <FAB
        icon="plus"
        style={[
          tw`absolute bottom-8 right-8`,
          { backgroundColor: theme.colors.primary },
        ]}
        onPress={() => navigation.navigate("NoteForm")}
        color={theme.colors.onPrimary}
      />
    </View>
  );
};

export default NotesScreen;
