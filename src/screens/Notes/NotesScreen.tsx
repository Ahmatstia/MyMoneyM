import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { Searchbar, FAB, Avatar } from "react-native-paper";
import { useAppContext } from "../../context/AppContext";
import tw from "twrnc";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 45) / 2;

const NotesScreen = ({ navigation }: any) => {
  const { state } = useAppContext();
  const { notes } = state;
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notes, searchQuery]);

  const renderCard = ({ item, index }: any) => {
    const colors = ["#657db2ff", "#2fb193ff", "#a48f38ff", "#a26c3dff"];
    const bgColor = colors[index % colors.length];

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate("NoteDetail", { noteId: item.id })}
        style={[
          tw`rounded-2xl p-4 mb-3`,
          {
            width: CARD_WIDTH,
            backgroundColor: bgColor,
          },
        ]}
      >
        <Text
          style={tw`text-white font-semibold text-base mb-2`}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        <Text style={tw`text-white/80 text-xs`} numberOfLines={4}>
          {item.content}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={tw`flex-1 bg-[#0B1220]`}>
      {/* Search */}
      <View style={tw`px-6 mb-2 pt-2`}>
        <Searchbar
          placeholder="Search your notes"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={tw`rounded-full bg-[#111827]`}
          inputStyle={tw`text-sm`}
          iconColor="#94A3B8"
          placeholderTextColor="#64748B"
          elevation={0}
        />
      </View>

      {/* Notes Grid */}
      <FlatList
        data={filteredNotes}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: "space-between",
          marginBottom: 3,
        }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10 }}
        renderItem={renderCard}
      />

      {/* FAB */}
      <FAB
        icon="plus"
        style={[tw`absolute bottom-8 right-8`, { backgroundColor: "#2563EB" }]}
        color="white"
        onPress={() => navigation.navigate("NoteForm")}
      />
    </View>
  );
};

export default NotesScreen;
