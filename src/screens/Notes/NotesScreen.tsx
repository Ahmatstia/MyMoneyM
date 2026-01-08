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
      financial_decision: "Finansial",
      expense_reflection: "Pengeluaran",
      goal_progress: "Progress",
      investment_idea: "Investasi",
      budget_analysis: "Budget",
      general: "Umum",
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      financial_decision: "#3B82F6",
      expense_reflection: "#10B981",
      goal_progress: "#8B5CF6",
      investment_idea: "#F59E0B",
      budget_analysis: "#EC4899",
      general: "#6B7280",
    };
    return colors[type] || "#6B7280";
  };

  const handleDeleteNote = (id: string, title: string) => {
    Alert.alert("Hapus Catatan", `Hapus "${title}"?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: () => {
          deleteNote(id);
          setMenuVisible(null);
        },
      },
    ]);
  };

  if (notes.length === 0) {
    return (
      <View
        style={[
          tw`flex-1 bg-[${theme.colors.background}] items-center justify-center p-6`,
        ]}
      >
        <IconButton
          icon="note-text-outline"
          size={64}
          iconColor={theme.colors.onSurfaceVariant}
          style={tw`mb-3`}
        />
        <Text
          style={[
            tw`text-lg font-semibold mb-2`,
            { color: theme.colors.onSurface },
          ]}
        >
          Belum Ada Catatan
        </Text>
        <Text
          style={[
            tw`text-center text-sm mb-5 px-8`,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Mulai dengan mencatat keputusan finansial atau refleksi pengeluaran
          Anda.
        </Text>
        <FAB
          icon="plus"
          label="Buat Catatan"
          style={[tw`mt-2`, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate("NoteForm")}
          size="medium"
        />
      </View>
    );
  }

  return (
    <View style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
      {/* Header dengan Search */}
      <View style={tw`px-4 pt-4 pb-3`}>
        <Searchbar
          placeholder="Cari catatan..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={tw`mb-3`}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          iconColor={theme.colors.primary}
          mode="bar"
          elevation={0}
          inputStyle={tw`text-sm`}
        />

        {/* Filter Bar */}
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <View style={tw`flex-row items-center`}>
            <Chip
              selected={sortBy === "date"}
              onPress={() => setSortBy("date")}
              style={tw`mr-2`}
              icon="calendar"
              compact
              textStyle={tw`text-xs`}
            >
              Terbaru
            </Chip>
            <Chip
              selected={sortBy === "title"}
              onPress={() => setSortBy("title")}
              style={tw`mr-2`}
              icon="sort-alphabetical-ascending"
              compact
              textStyle={tw`text-xs`}
            >
              Judul
            </Chip>
          </View>

          {filteredNotes.length > 0 && (
            <Text
              style={[tw`text-xs`, { color: theme.colors.onSurfaceVariant }]}
            >
              {filteredNotes.length} catatan
            </Text>
          )}
        </View>

        {/* Type Filter Chips */}
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
              compact
              textStyle={tw`text-xs`}
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
              compact
              textStyle={tw`text-xs`}
            >
              Reset
            </Chip>
          )}
        </View>
      </View>

      {/* Daftar Catatan */}
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={tw`pb-20 px-4`}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Card
            style={tw`mb-3`}
            onPress={() =>
              navigation.navigate("NoteDetail", { noteId: item.id })
            }
            onLongPress={() => setMenuVisible(item.id)}
            mode="elevated"
            elevation={1}
          >
            <Card.Content style={tw`p-3`}>
              {/* Header Card */}
              <View style={tw`flex-row justify-between items-start mb-2`}>
                <View style={tw`flex-row items-center flex-1`}>
                  <Chip
                    mode="flat"
                    style={[
                      tw`px-2`,
                      {
                        backgroundColor: getTypeColor(item.type) + "20",
                        borderColor: getTypeColor(item.type) + "40",
                      },
                    ]}
                    textStyle={[
                      tw`text-xs font-medium`,
                      { color: getTypeColor(item.type) },
                    ]}
                    compact
                  >
                    {getTypeLabel(item.type)}
                  </Chip>

                  {item.mood && (
                    <IconButton
                      icon={
                        item.mood === "positive"
                          ? "emoticon-happy-outline"
                          : item.mood === "negative"
                          ? "emoticon-sad-outline"
                          : item.mood === "reflective"
                          ? "lightbulb-outline"
                          : "emoticon-neutral-outline"
                      }
                      size={16}
                      iconColor={getTypeColor(item.type)}
                      style={tw`ml-1`}
                    />
                  )}
                </View>

                <Menu
                  visible={menuVisible === item.id}
                  onDismiss={() => setMenuVisible(null)}
                  anchor={
                    <IconButton
                      icon="dots-vertical"
                      size={18}
                      onPress={() => setMenuVisible(item.id)}
                      style={tw`m-0`}
                    />
                  }
                  style={tw`mt-8`}
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

              {/* Judul dan Amount */}
              <View style={tw`mb-2`}>
                <Text
                  style={[
                    tw`text-base font-semibold mb-1`,
                    { color: theme.colors.onSurface },
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>

                {item.amount && (
                  <Text
                    style={[
                      tw`text-sm font-medium`,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Rp {item.amount.toLocaleString("id-ID")}
                  </Text>
                )}
              </View>

              {/* Content Preview */}
              <Text
                style={[
                  tw`text-sm mb-2`,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                numberOfLines={2}
              >
                {item.content}
              </Text>

              {/* Tags dan Date */}
              <View
                style={tw`flex-row justify-between items-center pt-2 border-t border-gray-800/30`}
              >
                <View style={tw`flex-row flex-wrap flex-1 mr-2`}>
                  {item.tags.slice(0, 2).map((tag) => (
                    <Chip
                      key={tag}
                      style={tw`mr-1 mb-1`}
                      mode="outlined"
                      compact
                      textStyle={tw`text-xs`}
                    >
                      {tag}
                    </Chip>
                  ))}
                  {item.tags.length > 2 && (
                    <Chip
                      style={tw`mr-1 mb-1`}
                      mode="outlined"
                      compact
                      textStyle={tw`text-xs`}
                    >
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
                  {format(new Date(item.date), "dd MMM", { locale: id })}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <View style={tw`items-center justify-center py-16 px-8`}>
            <IconButton
              icon="magnify"
              size={48}
              iconColor={theme.colors.onSurfaceVariant}
              style={tw`mb-3`}
            />
            <Text
              style={[
                tw`text-center text-base mb-1`,
                { color: theme.colors.onSurface },
              ]}
            >
              Tidak ada catatan
            </Text>
            <Text
              style={[
                tw`text-center text-sm`,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Coba ubah filter atau kata kunci pencarian
            </Text>
          </View>
        }
      />

      {/* FAB untuk Tambah Catatan */}
      <FAB
        icon="plus"
        style={[
          tw`absolute bottom-6 right-6`,
          {
            backgroundColor: theme.colors.primary,
            elevation: 3,
          },
        ]}
        onPress={() => navigation.navigate("NoteForm")}
        color={theme.colors.onPrimary}
        size="medium"
      />
    </View>
  );
};

export default NotesScreen;
