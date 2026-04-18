// File: src/screens/Debt/AddDebtScreen.tsx
import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Text } from "react-native-paper";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { Debt, RootStackParamList } from "../../types";
import { Colors } from "../../theme/theme";

type AddDebtRoute = RouteProp<RootStackParamList, "AddDebt">;

const CATEGORIES = ["Kebutuhan", "Darurat", "Konsumtif", "Usaha", "Pendidikan", "Lainnya"];

// ─── Tema warna (Konsisten dengan HomeScreen) ──────────────────────────────────
const PRIMARY_COLOR    = Colors.primary;
const ACCENT_COLOR     = Colors.accent;
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR    = Colors.surface;
const TEXT_PRIMARY     = Colors.textPrimary;
const TEXT_SECONDARY   = Colors.textSecondary;
const BORDER_COLOR     = Colors.border;

const SectionHeader = ({ title }: { title: string }) => (
  <Text
    style={{
      color: Colors.gray400,
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 10,
    }}
  >
    {title}
  </Text>
);

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
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={tw`flex-1`}
      >
        {/* Header */}
        <View style={tw`flex-row items-center px-4 py-4 mb-2`}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[tw`w-10 h-10 rounded-full items-center justify-center mr-3`, { backgroundColor: `${SURFACE_COLOR}80` }]}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: "800" }}>
            {editMode ? "Edit Catatan" : "Catatan Baru"}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Type Selector (Premium Style consistent with DebtScreen) */}
          <SectionHeader title="Jenis Transaksi" />
          <View style={[tw`flex-row p-1 rounded-2xl mb-6`, { backgroundColor: SURFACE_COLOR }]}>
            {(["borrowed", "lent"] as const).map((t) => {
              const isActive = type === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    tw`flex-1 py-3 rounded-xl items-center justify-center`,
                    isActive ? { backgroundColor: ACCENT_COLOR } : null,
                  ]}
                  onPress={() => setType(t)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: isActive ? BACKGROUND_COLOR : TEXT_SECONDARY,
                      fontSize: 13,
                      fontWeight: isActive ? "700" : "500",
                    }}
                  >
                    {t === "borrowed" ? "Hutang Saya" : "Piutang"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Amount Input (Large & Prominent) */}
          <SectionHeader title="Nominal" />
          <View
            style={[
              tw`flex-row items-center px-4 py-5 rounded-3xl mb-6`,
              { backgroundColor: SURFACE_COLOR, borderWidth: 1, borderColor: BORDER_COLOR }
            ]}
          >
            <Text style={{ color: ACCENT_COLOR, fontSize: 18, fontWeight: "700", marginRight: 8 }}>Rp</Text>
            <TextInput
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/\D/g, ""))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.gray500}
              style={{
                flex: 1,
                color: TEXT_PRIMARY,
                fontSize: 28,
                fontWeight: "800",
                padding: 0,
              }}
            />
          </View>

          {/* Name Input */}
          <SectionHeader title={type === "borrowed" ? "Pemberi Hutang" : "Peminjam"} />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={type === "borrowed" ? "Bank, Teman, Keluarga..." : "Nama orang yang meminjam..."}
            placeholderTextColor={Colors.gray500}
            style={{
              backgroundColor: SURFACE_COLOR,
              borderRadius: 16,
              padding: 16,
              color: TEXT_PRIMARY,
              fontSize: 15,
              fontWeight: "600",
              marginBottom: 20,
              borderWidth: 1,
              borderColor: BORDER_COLOR,
            }}
          />

          {/* Category Selection */}
          <SectionHeader title="Kategori" />
          <View style={tw`flex-row flex-wrap gap-2 mb-6`}>
            {CATEGORIES.map((cat) => {
              const isActive = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    tw`px-4 py-2.5 rounded-xl`,
                    isActive
                      ? { backgroundColor: ACCENT_COLOR }
                      : { backgroundColor: SURFACE_COLOR, borderWidth: 1, borderColor: BORDER_COLOR },
                  ]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: isActive ? BACKGROUND_COLOR : TEXT_SECONDARY,
                      fontSize: 12,
                      fontWeight: "700",
                    }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Due Date & Description Rows */}
          <View style={tw`flex-row gap-4 mb-6`}>
            <View style={tw`flex-1`}>
              <SectionHeader title="Jatuh Tempo" />
              <TouchableOpacity
                activeOpacity={1}
                style={[
                  tw`flex-row items-center px-4 py-4 rounded-xl`,
                  { backgroundColor: SURFACE_COLOR, borderWidth: 1, borderColor: BORDER_COLOR }
                ]}
              >
                <TextInput
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.gray500}
                  style={{ flex: 1, color: TEXT_PRIMARY, fontSize: 13, fontWeight: "600", padding: 0 }}
                />
                <Ionicons name="calendar-outline" size={16} color={ACCENT_COLOR} />
              </TouchableOpacity>
            </View>
          </View>

          <SectionHeader title="Keterangan" />
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Tambahkan detail jika perlu..."
            placeholderTextColor={Colors.gray500}
            multiline
            numberOfLines={2}
            style={{
              backgroundColor: SURFACE_COLOR,
              borderRadius: 16,
              padding: 16,
              color: TEXT_PRIMARY,
              fontSize: 14,
              fontWeight: "500",
              marginBottom: 30,
              borderWidth: 1,
              borderColor: BORDER_COLOR,
              minHeight: 80,
              textAlignVertical: "top",
            }}
          />

          {/* Action Buttons */}
          <TouchableOpacity
            style={[
              tw`py-4 rounded-2xl items-center justify-center flex-row`,
              { backgroundColor: isLoading ? Colors.gray600 : ACCENT_COLOR },
            ]}
            onPress={handleSave}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <Ionicons name="sync" size={20} color={BACKGROUND_COLOR} style={tw`mr-2`} />
            ) : (
              <Ionicons name="checkmark-circle" size={20} color={BACKGROUND_COLOR} style={tw`mr-2`} />
            )}
            <Text style={{ color: BACKGROUND_COLOR, fontWeight: "800", fontSize: 16 }}>
              {isLoading ? "Menyimpan..." : editMode ? "Simpan Perubahan" : "Simpan Catatan"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddDebtScreen;
