import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Alert, Share } from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  useTheme,
  IconButton,
  Divider,
  Menu,
  Dialog,
  Portal,
  Text,
} from "react-native-paper";
import { useAppContext } from "../../context/AppContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import tw from "twrnc";

const NoteDetailScreen = () => {
  const { state, deleteNote } = useAppContext();
  const { notes } = state;
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();

  // Perbaiki: Type assertion untuk params
  const params = route.params as { noteId?: string };
  const noteId = params?.noteId;
  const note = notes.find((n) => n.id === noteId);

  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  if (!note) {
    return (
      <View
        style={[
          tw`flex-1 bg-[${theme.colors.background}] items-center justify-center p-8`,
        ]}
      >
        <IconButton
          icon="alert-circle-outline"
          size={80}
          iconColor={theme.colors.error}
          style={tw`mb-4`}
        />
        <Title style={[tw`mb-4`, { color: theme.colors.onSurface }]}>
          Catatan Tidak Ditemukan
        </Title>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Kembali
        </Button>
      </View>
    );
  }

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

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      financial_decision: "cash-check",
      expense_reflection: "chart-bar",
      goal_progress: "flag-checkered",
      investment_idea: "lightbulb-on",
      budget_analysis: "chart-pie",
      general: "note-text",
    };
    return icons[type] || "note-text";
  };

  const getMoodIcon = (mood?: string) => {
    const icons: Record<string, string> = {
      positive: "emoticon-happy-outline",
      neutral: "emoticon-neutral-outline",
      negative: "emoticon-sad-outline",
      reflective: "thought-bubble-outline",
    };
    return icons[mood || "neutral"] || "emoticon-neutral-outline";
  };

  const getImpactIcon = (impact?: string) => {
    const icons: Record<string, string> = {
      positive: "trending-up",
      neutral: "trending-neutral",
      negative: "trending-down",
    };
    return icons[impact || "neutral"] || "trending-neutral";
  };

  const getImpactColor = (impact?: string) => {
    const colors: Record<string, string> = {
      positive: "#10B981",
      neutral: "#6B7280",
      negative: "#EF4444",
    };
    return colors[impact || "neutral"] || "#6B7280";
  };

  const handleShare = async () => {
    try {
      const message = `📝 ${note.title}\n\n${note.content}\n\n💰 ${
        note.amount
          ? `Rp ${note.amount.toLocaleString("id-ID")}`
          : "Tidak ada jumlah"
      }\n📅 ${format(new Date(note.date), "dd MMMM yyyy", { locale: id })}`;

      await Share.share({
        message,
        title: note.title,
      });
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("Error", "Gagal membagikan catatan");
    }
  };

  const handleDelete = () => {
    deleteNote(note.id);
    navigation.goBack();
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "EEEE, dd MMMM yyyy", { locale: id });
  };

  return (
    <>
      <ScrollView
        style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}
      >
        {/* Header dengan Menu */}
        <View style={tw`p-4 flex-row justify-between items-center`}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Title
            style={[tw`flex-1 text-center`, { color: theme.colors.onSurface }]}
          >
            Detail Catatan
          </Title>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={24}
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              leadingIcon="pencil"
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate("NoteForm", { noteId: note.id });
              }}
              title="Edit"
            />
            <Menu.Item
              leadingIcon="share-variant"
              onPress={() => {
                setMenuVisible(false);
                handleShare();
              }}
              title="Bagikan"
            />
            <Divider />
            <Menu.Item
              leadingIcon="delete"
              onPress={() => {
                setMenuVisible(false);
                setDeleteDialogVisible(true);
              }}
              title="Hapus"
              titleStyle={{ color: theme.colors.error }}
            />
          </Menu>
        </View>

        {/* Konten Catatan */}
        <Card style={tw`mx-4 mb-4`}>
          <Card.Content>
            {/* Header dengan Type dan Mood */}
            <View style={tw`flex-row justify-between items-start mb-4`}>
              <View style={tw`flex-row items-center`}>
                <Chip
                  mode="outlined"
                  icon={getTypeIcon(note.type)}
                  style={tw`mr-2`}
                >
                  {getTypeLabel(note.type)}
                </Chip>
                {note.mood && (
                  <Chip mode="outlined" icon={getMoodIcon(note.mood)}>
                    {note.mood}
                  </Chip>
                )}
              </View>

              {note.financialImpact && (
                <Chip
                  mode="outlined"
                  icon={getImpactIcon(note.financialImpact)}
                  textStyle={{ color: getImpactColor(note.financialImpact) }}
                  style={{ borderColor: getImpactColor(note.financialImpact) }}
                >
                  {note.financialImpact}
                </Chip>
              )}
            </View>

            {/* Judul */}
            <Title style={[tw`mb-3`, { color: theme.colors.onSurface }]}>
              {note.title}
            </Title>

            {/* Tanggal */}
            <Paragraph
              style={[
                tw`mb-4 text-sm`,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              📅 {formatDate(note.date)}
            </Paragraph>

            {/* Jumlah dan Kategori */}
            {(note.amount || note.category) && (
              <View style={tw`flex-row flex-wrap mb-4`}>
                {note.amount && (
                  <Chip mode="outlined" icon="cash" style={tw`mr-2 mb-2`}>
                    Rp {note.amount.toLocaleString("id-ID")}
                  </Chip>
                )}
                {note.category && (
                  <Chip mode="outlined" icon="tag" style={tw`mr-2 mb-2`}>
                    {note.category}
                  </Chip>
                )}
              </View>
            )}

            {/* Isi Catatan */}
            <View style={tw`mb-4`}>
              <Text
                style={[
                  tw`text-sm mb-2 font-medium`,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Isi Catatan:
              </Text>
              <Paragraph
                style={[
                  tw`text-base leading-6`,
                  { color: theme.colors.onSurface },
                ]}
              >
                {note.content}
              </Paragraph>
            </View>

            {/* Tags */}
            {note.tags.length > 0 && (
              <View style={tw`mb-4`}>
                <Text
                  style={[
                    tw`text-sm mb-2 font-medium`,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Tags:
                </Text>
                <View style={tw`flex-row flex-wrap`}>
                  {note.tags.map((tag) => (
                    <Chip key={tag} style={tw`mr-2 mb-2`} mode="outlined">
                      {tag}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            {/* Metadata */}
            <View style={tw`mt-6 pt-4 border-t`}>
              <Paragraph
                style={[tw`text-xs`, { color: theme.colors.onSurfaceVariant }]}
              >
                Dibuat:{" "}
                {format(new Date(note.createdAt), "dd MMM yyyy HH:mm", {
                  locale: id,
                })}
              </Paragraph>
              {note.updatedAt && (
                <Paragraph
                  style={[
                    tw`text-xs`,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Diupdate:{" "}
                  {format(new Date(note.updatedAt), "dd MMM yyyy HH:mm", {
                    locale: id,
                  })}
                </Paragraph>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Tombol Aksi */}
        <View style={tw`px-4 pb-8`}>
          <Button
            mode="contained"
            icon="pencil"
            onPress={() => navigation.navigate("NoteForm", { noteId: note.id })}
            style={tw`mb-3`}
          >
            Edit Catatan
          </Button>
          <Button
            mode="outlined"
            icon="share-variant"
            onPress={handleShare}
            style={tw`mb-3`}
          >
            Bagikan
          </Button>
        </View>
      </ScrollView>

      {/* Dialog Hapus */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Hapus Catatan</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Apakah Anda yakin ingin menghapus catatan "{note.title}"? Tindakan
              ini tidak dapat dibatalkan.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Batal</Button>
            <Button onPress={handleDelete} textColor={theme.colors.error}>
              Hapus
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

export default NoteDetailScreen;
