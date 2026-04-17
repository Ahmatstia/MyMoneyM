// File: src/screens/Debt/AddDebtScreen.tsx
import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { Text } from "react-native-paper";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { Debt, RootStackParamList } from "../../types";
import { Colors } from "../../theme/theme";

type AddDebtRoute = RouteProp<RootStackParamList, "AddDebt">;

const CATEGORIES = ["Kebutuhan", "Darurat", "Konsumtif", "Usaha", "Pendidikan", "Lainnya"];

const AddDebtScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<AddDebtRoute>();
  const { addDebt, editDebt } = useAppContext();

  const editMode = route.params?.editMode ?? false;
  const existingDebt = route.params?.debtData;

  const [type, setType] = useState<"borrowed" | "lent">(existingDebt?.type ?? "borrowed");
  const [name, setName] = useState(existingDebt?.name ?? "");
  const [amount, setAmount] = useState(existingDebt?.amount ? String(existingDebt.amount) : "");
  const [category, setCategory] = useState(existingDebt?.category ?? "Lainnya");
  const [description, setDescription] = useState(existingDebt?.description ?? "");
  const [dueDate, setDueDate] = useState(existingDebt?.dueDate ?? "");
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    if (!name.trim()) { Alert.alert("Error", "Nama wajib diisi"); return false; }
    const amt = parseFloat(amount.replace(/\D/g, ""));
    if (!amt || amt <= 0) { Alert.alert("Error", "Nominal hutang wajib diisi"); return false; }
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      Alert.alert("Error", "Format tanggal: YYYY-MM-DD");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const amt = parseFloat(amount.replace(/\D/g, ""));
      const payload = {
        type,
        name: name.trim(),
        amount: amt,
        remaining: editMode && existingDebt ? existingDebt.remaining : amt,
        category,
        description: description.trim(),
        dueDate: dueDate || undefined,
        status: (editMode && existingDebt ? existingDebt.status : "active") as Debt["status"],
      };

      if (editMode && existingDebt) {
        await editDebt(existingDebt.id, payload);
      } else {
        await addDebt(payload);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", "Gagal menyimpan data hutang");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[tw`flex-1`, { backgroundColor: Colors.background }]}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: Colors.surface,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={tw`mr-3`}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text
          style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: "700", flex: 1 }}
        >
          {editMode ? "Edit Hutang" : "Tambah Hutang"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        {/* Type selector */}
        <Text style={{ color: Colors.gray400, fontSize: 11, fontWeight: "600", letterSpacing: 1, marginBottom: 8 }}>
          JENIS
        </Text>
        <View style={tw`flex-row gap-3 mb-5`}>
          {(["borrowed", "lent"] as const).map((t) => {
            const isActive = type === t;
            return (
              <TouchableOpacity
                key={t}
                style={[
                  tw`flex-1 py-3 rounded-xl items-center`,
                  isActive
                    ? { backgroundColor: Colors.accent }
                    : { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
                ]}
                onPress={() => setType(t)}
                activeOpacity={0.7}
              >
                <Text style={{ color: isActive ? Colors.background : Colors.textSecondary, fontWeight: "700", fontSize: 13 }}>
                  {t === "borrowed" ? "🏦 Hutang Saya" : "💳 Piutang"}
                </Text>
                <Text style={{ color: isActive ? Colors.background : Colors.gray400, fontSize: 10, marginTop: 2 }}>
                  {t === "borrowed" ? "Saya yang berhutang" : "Orang lain berhutang ke saya"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Name */}
        <Text style={{ color: Colors.gray400, fontSize: 11, fontWeight: "600", letterSpacing: 1, marginBottom: 8 }}>
          {type === "borrowed" ? "NAMA PEMBERI HUTANG" : "NAMA PEMINJAM"}
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={type === "borrowed" ? "Contoh: Mama, Bank BRI" : "Contoh: Budi, Siti"}
          placeholderTextColor={Colors.gray400}
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 12,
            padding: 14,
            color: Colors.textPrimary,
            fontSize: 15,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        />

        {/* Amount */}
        <Text style={{ color: Colors.gray400, fontSize: 11, fontWeight: "600", letterSpacing: 1, marginBottom: 8 }}>
          NOMINAL HUTANG
        </Text>
        <TextInput
          value={amount}
          onChangeText={(t) => setAmount(t.replace(/\D/g, ""))}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={Colors.gray400}
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 12,
            padding: 14,
            color: Colors.textPrimary,
            fontSize: 22,
            fontWeight: "800",
            marginBottom: 16,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        />

        {/* Category */}
        <Text style={{ color: Colors.gray400, fontSize: 11, fontWeight: "600", letterSpacing: 1, marginBottom: 8 }}>
          KATEGORI
        </Text>
        <View style={tw`flex-row flex-wrap gap-2 mb-5`}>
          {CATEGORIES.map((cat) => {
            const isActive = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  tw`px-3 py-2 rounded-xl`,
                  isActive
                    ? { backgroundColor: Colors.accent }
                    : { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
                ]}
                onPress={() => setCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={{ color: isActive ? Colors.background : Colors.textSecondary, fontSize: 12, fontWeight: "600" }}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Due Date */}
        <Text style={{ color: Colors.gray400, fontSize: 11, fontWeight: "600", letterSpacing: 1, marginBottom: 8 }}>
          TANGGAL JATUH TEMPO (Opsional)
        </Text>
        <TextInput
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.gray400}
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 12,
            padding: 14,
            color: Colors.textPrimary,
            fontSize: 15,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        />

        {/* Description */}
        <Text style={{ color: Colors.gray400, fontSize: 11, fontWeight: "600", letterSpacing: 1, marginBottom: 8 }}>
          KETERANGAN (Opsional)
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Contoh: Untuk beli buku semester ini"
          placeholderTextColor={Colors.gray400}
          multiline
          numberOfLines={3}
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 12,
            padding: 14,
            color: Colors.textPrimary,
            fontSize: 14,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: Colors.border,
            minHeight: 80,
            textAlignVertical: "top",
          }}
        />

        {/* Save Button */}
        <TouchableOpacity
          style={[
            tw`py-4 rounded-2xl items-center`,
            { backgroundColor: isLoading ? Colors.gray400 : Colors.accent },
          ]}
          onPress={handleSave}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={{ color: Colors.background, fontWeight: "700", fontSize: 16 }}>
            {isLoading ? "Menyimpan..." : editMode ? "Simpan Perubahan" : "Tambah Hutang"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default AddDebtScreen;
