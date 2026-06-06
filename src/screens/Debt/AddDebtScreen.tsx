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
    style={[tw`text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1`, { color: TEXT_SECONDARY }]}
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
      
      let finalRemaining = amt;
      let finalStatus = (editMode && existingDebt ? existingDebt.status : "active") as Debt["status"];

      if (editMode && existingDebt) {
        // Hitung berapa nominal yang sudah dibayar sebelumnya
        const paidAmount = existingDebt.amount - existingDebt.remaining;
        
        // Sisa hutang baru adalah nominal baru dikurangi yang sudah dibayar
        finalRemaining = amt - paidAmount;
        
        if (finalRemaining <= 0) {
          finalRemaining = 0;
          finalStatus = "paid";
        } else if (finalStatus === "paid" && finalRemaining > 0) {
          // Jika sebelumnya lunas tapi nominal dinaikkan, kembalikan ke aktif
          finalStatus = "active";
        }
      }

      const payload = {
        type,
        name: name.trim(),
        amount: amt,
        remaining: finalRemaining,
        category,
        description: description.trim(),
        dueDate: dueDate || undefined,
        status: finalStatus,
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
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={tw`flex-1`}
      >
        <ScrollView contentContainerStyle={tw`px-4 pt-4 pb-2`} showsVerticalScrollIndicator={false}>
          {/* Type Selector */}
          <View style={tw`mb-4`}>
            <SectionHeader title="Jenis Transaksi" />
            <View style={[tw`flex-row rounded-xl p-1`, { backgroundColor: SURFACE_COLOR }]}>
              {(["borrowed", "lent"] as const).map((t) => {
                const isActive = type === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[tw`flex-1 py-3 rounded-lg items-center justify-center`, isActive ? { backgroundColor: ACCENT_COLOR } : null]}
                    onPress={() => setType(t)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: isActive ? BACKGROUND_COLOR : TEXT_SECONDARY, fontSize: 13, fontWeight: "700" }}>
                      {t === "borrowed" ? "Hutang Saya" : "Piutang"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Amount Input */}
          <View style={tw`mb-4`}>
            <SectionHeader title="Nominal" />
            <View style={[tw`flex-row items-center px-4 py-3 rounded-xl`, { backgroundColor: SURFACE_COLOR }]}>
              <Text style={{ color: TEXT_SECONDARY, fontSize: 18, fontWeight: "700", marginRight: 8 }}>Rp</Text>
              <TextInput
                value={amount}
                onChangeText={(t) => setAmount(t.replace(/\D/g, ""))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={Colors.gray500}
                style={{ flex: 1, color: TEXT_PRIMARY, fontSize: 24, fontWeight: "800", padding: 0 }}
              />
            </View>
          </View>

          {/* Name Input */}
          <View style={tw`mb-4`}>
            <SectionHeader title={type === "borrowed" ? "Pemberi Hutang" : "Peminjam"} />
            <View style={[tw`rounded-xl px-4 py-3`, { backgroundColor: SURFACE_COLOR }]}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={type === "borrowed" ? "Contoh: Budi, Bank..." : "Contoh: Andi, Teman..."}
                placeholderTextColor={Colors.gray500}
                style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "700", padding: 0 }}
              />
            </View>
          </View>

          {/* Category Selection */}
          <View style={tw`mb-4`}>
            <SectionHeader title="Kategori" />
            <View style={tw`flex-row flex-wrap gap-2`}>
              {CATEGORIES.map((cat) => {
                const isActive = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[tw`px-4 py-2.5 rounded-xl`, isActive ? { backgroundColor: ACCENT_COLOR } : { backgroundColor: SURFACE_COLOR }]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: isActive ? BACKGROUND_COLOR : TEXT_SECONDARY, fontSize: 11, fontWeight: "700" }}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>


          {/* Due Date */}
          <View style={tw`mb-4`}>
            <SectionHeader title="Jatuh Tempo (Opsional)" />
            <TouchableOpacity activeOpacity={1} style={[tw`flex-row items-center px-4 py-3 rounded-xl`, { backgroundColor: SURFACE_COLOR }]}>
              <TextInput
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.gray500}
                style={{ flex: 1, color: TEXT_PRIMARY, fontSize: 13, fontWeight: "700", padding: 0 }}
              />
              <Ionicons name="calendar-outline" size={16} color={Colors.gray500} />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={tw`mb-6`}>
            <SectionHeader title="Keterangan" />
            <View style={[tw`rounded-xl px-4 py-3`, { backgroundColor: SURFACE_COLOR }]}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Tambahkan detail..."
                placeholderTextColor={Colors.gray500}
                multiline
                numberOfLines={2}
                style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "600", minHeight: 60, textAlignVertical: "top", padding: 0 }}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={[tw`py-4 rounded-xl items-center justify-center flex-row`, { backgroundColor: isLoading ? Colors.gray600 : ACCENT_COLOR }]}
            onPress={handleSave}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <Ionicons name="sync" size={16} color={BACKGROUND_COLOR} style={tw`mr-2`} />
            ) : (
              <Ionicons name="checkmark-circle" size={16} color={BACKGROUND_COLOR} style={tw`mr-2`} />
            )}
            <Text style={{ color: BACKGROUND_COLOR, fontWeight: "800", fontSize: 14 }}>
              {isLoading ? "Menyimpan..." : editMode ? "Simpan Perubahan" : "Simpan Catatan"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddDebtScreen;
