import React, { useState } from "react";
import { View, ScrollView, Alert, Share } from "react-native";
import {
  Card,
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

  const params = route.params as { noteId?: string };
  const note = notes.find((n) => n.id === params?.noteId);

  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  if (!note) return null;

  const typeColor: Record<string, string> = {
    financial_decision: "#3B82F6",
    expense_reflection: "#10B981",
    goal_progress: "#8B5CF6",
    investment_idea: "#F59E0B",
    budget_analysis: "#EC4899",
    general: "#6B7280",
  };

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

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 pb-32`}
        style={{ backgroundColor: theme.colors.background }}
      >
        <Card
          style={[
            tw`mt-4`,
            {
              borderRadius: 24,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <Card.Content style={tw`p-5`}>
            {/* HEADER DALAM CARD */}
            <View style={tw`flex-row justify-between items-start `}>
              <View>
                <Chip
                  compact
                  style={{
                    backgroundColor: typeColor[note.type] + "20",
                  }}
                  textStyle={{
                    color: typeColor[note.type],
                    fontWeight: "600",
                  }}
                >
                  {note.type.replace("_", " ")}
                </Chip>
              </View>
              {/* MENU TITIK 3 */}
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    size={20}
                    onPress={() => setMenuVisible(true)}
                  />
                }
              >
                <Menu.Item
                  leadingIcon="pencil"
                  title="Edit"
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate("NoteForm", { noteId: note.id });
                  }}
                />
                <Menu.Item
                  leadingIcon="share-variant"
                  title="Bagikan"
                  onPress={() => {
                    setMenuVisible(false);
                    handleShare();
                  }}
                />
                <Divider />
                <Menu.Item
                  leadingIcon="delete"
                  title="Hapus"
                  titleStyle={{ color: theme.colors.error }}
                  onPress={() => {
                    setMenuVisible(false);
                    setDeleteDialogVisible(true);
                  }}
                />
              </Menu>
            </View>

            {/* TITLE */}
            <Text
              style={[tw`text-xl font-bold`, { color: theme.colors.onSurface }]}
            >
              {note.title}
            </Text>

            {/* AMOUNT */}
            {note.amount && (
              <Text
                style={[
                  tw`text-lg font-semibold mb-3`,
                  { color: theme.colors.primary },
                ]}
              >
                Rp {note.amount.toLocaleString("id-ID")}
              </Text>
            )}

            {/* CONTENT */}
            <Text
              style={[
                tw`text-base leading-6 mb-6`,
                { color: theme.colors.onSurface },
              ]}
            >
              {note.content}
            </Text>

            {/* TAGS */}
            {note.tags.length > 0 && (
              <View style={tw`flex-row flex-wrap mb-4`}>
                {note.tags.map((tag) => (
                  <Chip key={tag} compact style={tw`mr-2 mb-2`} mode="outlined">
                    {tag}
                  </Chip>
                ))}
              </View>
            )}

            {/* META */}
            <Divider />
            <View style={tw`mt-4`}>
              <Text
                style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}
              >
                Dibuat:{" "}
                {format(new Date(note.createdAt), "dd MMM yyyy • HH:mm", {
                  locale: id,
                })}
              </Text>
              {note.updatedAt && (
                <Text
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  Diperbarui:{" "}
                  {format(new Date(note.updatedAt), "dd MMM yyyy • HH:mm", {
                    locale: id,
                  })}
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* DELETE DIALOG */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Hapus Catatan</Dialog.Title>
          <Dialog.Content>
            <Text>Catatan ini akan dihapus permanen.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Batal</Button>
            <Button
              textColor={theme.colors.error}
              onPress={() => {
                deleteNote(note.id);
                navigation.goBack();
              }}
            >
              Hapus
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

export default NoteDetailScreen;
