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
import DateTimePicker from "@react-native-community/datetimepicker";
import { Text } from "react-native-paper";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { Debt, RootStackParamList } from "../../types";
import { useTheme } from "../../theme/ThemeContext";
import { AppHeader } from "../../components/common";
import { useKeyboardBottomInset } from "../../utils/keyboard";

type AddDebtRoute = RouteProp<RootStackParamList, "AddDebt">;

const CATEGORIES = ["Kebutuhan", "Darurat", "Konsumtif", "Usaha", "Pendidikan", "Lainnya"];

const AddDebtScreen: React.FC = () => {
  const { colors } = useTheme();
  const PRIMARY_COLOR    = colors.primary;
  const ACCENT_COLOR     = colors.accent;
  const BACKGROUND_COLOR = colors.background;
  const SURFACE_COLOR    = colors.surface;
  const TEXT_PRIMARY     = colors.textPrimary;
  const TEXT_SECONDARY   = colors.textSecondary;
  const BORDER_COLOR     = colors.border;

  const navigation = useNavigation<any>();
  const route = useRoute<AddDebtRoute>();
  const { addDebt, editDebt } = useAppContext();
  const keyboardInset = useKeyboardBottomInset(24);

  const editMode = route.params?.editMode ?? false;
  const existingDebt = route.params?.debtData;

  const [type, setType] = useState<"borrowed" | "lent">(existingDebt?.type ?? "borrowed");
  const [name, setName] = useState(existingDebt?.name ?? "");
  const [amount, setAmount] = useState(existingDebt?.amount ? String(existingDebt.amount) : "");
  const [category, setCategory] = useState(existingDebt?.category ?? "");
  const [description, setDescription] = useState(existingDebt?.description ?? "");
  const [dueDate, setDueDate] = useState(existingDebt?.dueDate ?? "");
  const [syncWithCash, setSyncWithCash] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // RISK-006 FIX: Use a date picker instead of free-text input
  const [showDatePicker, setShowDatePicker] = useState(false);



  const SectionHeader = ({ title }: { title: string }) => (
    <Text
      style={[tw`text-[11px] font-bold uppercase tracking-wider mb-1.5 ml-0.5`, { color: TEXT_SECONDARY }]}
    >
      {title}
    </Text>
  );

  const validate = () => {
    if (!name.trim()) { Alert.alert("Error", "Nama wajib diisi"); return false; }
    const amt = parseFloat(amount.replace(/\D/g, ""));
    if (!amt || amt <= 0) { Alert.alert("Error", "Nominal hutang wajib diisi"); return false; }
    if (!category.trim()) { Alert.alert("Error", "Kategori wajib dipilih"); return false; }
    // dueDate is set via date picker so format is always valid — no regex check needed
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
        await addDebt(payload, syncWithCash);
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
      {/* ── Standard AppHeader ── */}
      <AppHeader
        title={editMode ? "Edit Hutang / Piutang" : "Tambah Hutang / Piutang"}
        subtitle={
          type === "borrowed"
            ? "Catat pinjaman yang harus kamu bayar"
            : "Catat uang yang kamu pinjamkan"
        }
        showBack={true}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={tw`flex-1`}
      >
        <ScrollView
          contentContainerStyle={[tw`px-4 pt-4`, { paddingBottom: keyboardInset }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type Selector */}
          <View style={tw`mb-4`}>
            <SectionHeader title="Jenis Transaksi" />
            <View style={[tw`flex-row rounded-xl p-1 border`, { backgroundColor: SURFACE_COLOR, borderColor: `${BORDER_COLOR}80` }]}>
              {(["borrowed", "lent"] as const).map((t) => {
                const isActive = type === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[tw`flex-1 py-2.5 rounded-lg items-center justify-center`, isActive ? { backgroundColor: ACCENT_COLOR } : null]}
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

          {/* Info Hint */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: `${ACCENT_COLOR}12`,
            borderRadius: 14,
            padding: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: `${ACCENT_COLOR}25`,
          }}>
            <Ionicons name="information-circle-outline" size={18} color={ACCENT_COLOR} style={{ marginRight: 8 }} />
            <Text style={{ flex: 1, color: TEXT_SECONDARY, fontSize: 11, lineHeight: 16 }}>
              {type === "borrowed"
                ? "Mencatat kewajiban hutang. Saat Anda melunasi/mencicil nanti, sistem akan otomatis memotong saldo kas."
                : "Mencatat dana pinjaman ke orang lain. Saat teman melunasi nanti, uang akan otomatis masuk ke saldo kas."}
            </Text>
          </View>

          {/* Amount Input */}
          <View style={tw`mb-4`}>
            <SectionHeader title="Nominal" />
            <View style={[tw`flex-row items-center px-4 py-3 rounded-xl border`, { backgroundColor: SURFACE_COLOR, borderColor: `${BORDER_COLOR}80`, minHeight: 56 }]}>
              <Text style={{ color: TEXT_SECONDARY, fontSize: 18, fontWeight: "700", marginRight: 8 }}>Rp</Text>
              <TextInput
                value={amount}
                onChangeText={(t) => setAmount(t.replace(/\D/g, ""))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.gray500}
                style={{ flex: 1, color: TEXT_PRIMARY, fontSize: 22, fontWeight: "800", padding: 0 }}
              />
            </View>
          </View>

          {/* Name Input */}
          <View style={tw`mb-4`}>
            <SectionHeader title={type === "borrowed" ? "Pemberi Hutang" : "Peminjam"} />
            <View style={[tw`rounded-xl px-4 py-3 border`, { backgroundColor: SURFACE_COLOR, borderColor: `${BORDER_COLOR}80` }]}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={type === "borrowed" ? "Contoh: Budi, Bank..." : "Contoh: Andi, Teman..."}
                placeholderTextColor={colors.gray500}
                style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: "600", padding: 0 }}
              />
            </View>
          </View>

          {/* Category Selection */}
          <View style={tw`mb-4`}>
            <SectionHeader title="Kategori" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
              {CATEGORIES.map((cat) => {
                const isActive = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      tw`px-4 py-2.5 rounded-xl border`,
                      isActive
                        ? { backgroundColor: `${ACCENT_COLOR}20`, borderColor: ACCENT_COLOR }
                        : { backgroundColor: SURFACE_COLOR, borderColor: `${BORDER_COLOR}80` },
                    ]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: isActive ? ACCENT_COLOR : TEXT_SECONDARY, fontSize: 12, fontWeight: "700" }}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>


          {/* Due Date */}
          <View style={tw`mb-4`}>
            <SectionHeader title="Jatuh Tempo (Opsional)" />
            <View style={tw`flex-row gap-2`}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[tw`flex-1 flex-row items-center px-4 py-3 rounded-xl border`, { backgroundColor: SURFACE_COLOR, borderColor: `${BORDER_COLOR}80` }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={16} color={colors.gray500} style={tw`mr-2`} />
                <Text style={{ flex: 1, color: dueDate ? TEXT_PRIMARY : colors.gray500, fontSize: 14, fontWeight: "600" }}>
                  {dueDate || "Pilih tanggal..."}
                </Text>
              </TouchableOpacity>
              {dueDate ? (
                <TouchableOpacity
                  style={[tw`px-3 rounded-xl items-center justify-center border`, { backgroundColor: SURFACE_COLOR, borderColor: `${BORDER_COLOR}80` }]}
                  onPress={() => setDueDate("")}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={18} color={colors.gray500} />
                </TouchableOpacity>
              ) : null}
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={dueDate ? new Date(dueDate) : new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={new Date()}
                onValueChange={(_event, selectedDate) => {
                  if (Platform.OS === "android") {
                    setShowDatePicker(false);
                  }
                  if (selectedDate) {
                    const y = selectedDate.getFullYear();
                    const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
                    const d = String(selectedDate.getDate()).padStart(2, "0");
                    setDueDate(`${y}-${m}-${d}`);
                  }
                }}
                onDismiss={() => setShowDatePicker(false)}
              />
            )}
          </View>

          {/* Description */}
          <View style={tw`mb-4`}>
            <SectionHeader title="Keterangan" />
            <View style={[tw`rounded-xl px-4 py-3 border`, { backgroundColor: SURFACE_COLOR, borderColor: `${BORDER_COLOR}80` }]}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Tambahkan detail..."
                placeholderTextColor={colors.gray500}
                multiline
                numberOfLines={2}
                style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: "600", minHeight: 60, textAlignVertical: "top", padding: 0 }}
              />
            </View>
          </View>

          {/* Opsi Sinkronisasi Saldo Kas */}
          {!editMode && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSyncWithCash(!syncWithCash)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: syncWithCash ? `${ACCENT_COLOR}15` : SURFACE_COLOR,
                borderWidth: 1,
                borderColor: syncWithCash ? ACCENT_COLOR : `${colors.border}60`,
                borderRadius: 14,
                padding: 14,
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 1.5,
                  borderColor: syncWithCash ? ACCENT_COLOR : colors.gray500,
                  backgroundColor: syncWithCash ? ACCENT_COLOR : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                {syncWithCash && (
                  <Ionicons name="checkmark" size={16} color={BACKGROUND_COLOR} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "700" }}>
                  {type === "borrowed"
                    ? "Tambah ke Saldo Kas (Pemasukan)"
                    : "Kurangi dari Saldo Kas (Pengeluaran)"}
                </Text>
                <Text style={{ color: colors.gray400, fontSize: 11, marginTop: 2, lineHeight: 15 }}>
                  {type === "borrowed"
                    ? "Saldo dompet bertambah dan otomatis tercatat sebagai transaksi pemasukan pinjaman."
                    : "Saldo dompet berkurang dan otomatis tercatat sebagai transaksi pengeluaran pinjaman."}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Action Buttons */}
          <View style={tw`flex-row gap-3 mt-4`}>
            <TouchableOpacity
              style={[tw`flex-1 rounded-xl py-3.5 items-center border`, { backgroundColor: SURFACE_COLOR, borderColor: `${BORDER_COLOR}80` }]}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Text style={[tw`text-sm font-bold`, { color: TEXT_PRIMARY }]}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[tw`flex-1 rounded-xl py-3.5 items-center justify-center flex-row`, { backgroundColor: ACCENT_COLOR, opacity: isLoading ? 0.7 : 1 }]}
              onPress={handleSave}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <Ionicons name="sync" size={16} color="#FFFFFF" style={tw`mr-2`} />
              ) : (
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={tw`mr-2`} />
              )}
              <Text style={tw`text-white text-sm font-bold`}>
                {isLoading ? "Menyimpan..." : editMode ? "Simpan" : "Tambah"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddDebtScreen;
