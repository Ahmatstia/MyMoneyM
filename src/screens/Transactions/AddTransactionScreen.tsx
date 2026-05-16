import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Switch,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { getCurrentDate, safeNumber } from "../../utils/calculations";
import { RootStackParamList, TransactionType, SubTransaction } from "../../types";
import { Colors } from "../../theme/theme";
import CategoryPickerModal, { DEFAULT_CATEGORIES, CategoryItem } from "../../components/CategoryPickerModal";

type AddTransactionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddTransaction"
>;

type AddTransactionScreenRouteProp = RouteProp<
  RootStackParamList,
  "AddTransaction"
>;

const PRIMARY_COLOR = Colors.primary;
const ACCENT_COLOR = Colors.accent;
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR = Colors.surface;
const TEXT_PRIMARY = Colors.textPrimary;
const TEXT_SECONDARY = Colors.textSecondary;
const BORDER_COLOR = Colors.border;
const SUCCESS_COLOR = Colors.success;
const ERROR_COLOR = Colors.error;
const WARNING_COLOR = Colors.warning;


const AddTransactionScreen: React.FC = () => {
  const navigation = useNavigation<AddTransactionScreenNavigationProp>();
  const route = useRoute<AddTransactionScreenRouteProp>();
  const { addTransaction, editTransaction, deleteTransaction, state } =
    useAppContext();

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(getCurrentDate());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amountError, setAmountError] = useState("");
  const [isCycleActive, setIsCycleActive] = useState(false);
  const [cyclePreset, setCyclePreset] = useState<"weekly" | "monthly" | "custom">("weekly");
  const [customDays, setCustomDays] = useState("14");
  // Sub-transaction (itemized cart) state
  const [subItems, setSubItems] = useState<SubTransaction[]>([]);
  const [showSubItems, setShowSubItems] = useState(false);

  // Helper: change type and clear sub-items (sub-items only for expense)
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === "income") {
      setShowSubItems(false);
      setSubItems([]);
    }
  };

  // Sync main amount automatically when subItems change and subItems view is active
  useEffect(() => {
    if (showSubItems && type === "expense") {
      const total = subItems.reduce((acc, item) => {
        const itemAmount = safeNumber(item.amount);
        const itemQty = safeNumber(item.qty) || 1;
        return acc + (itemAmount * itemQty);
      }, 0);
      
      setAmount(total > 0 ? total.toString() : "");
      setAmountError("");
    }
  }, [subItems, showSubItems, type]);

  const params = route.params || {};
  const isEditMode = params.editMode || false;
  const transactionData = params.transactionData;

  const handleDeleteTransaction = useCallback(async () => {
    if (!transactionData?.id) {
      Alert.alert("Error", "Data transaksi tidak valid");
      return;
    }

    try {
      await deleteTransaction(transactionData.id);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Gagal menghapus transaksi");
    }
  }, [transactionData, deleteTransaction, navigation]);

  const showDeleteConfirmation = useCallback(() => {
    if (!isEditMode || !transactionData) return;

    Alert.alert(
      "Hapus Transaksi",
      "Apakah Anda yakin ingin menghapus transaksi ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: handleDeleteTransaction,
        },
      ]
    );
  }, [isEditMode, transactionData, handleDeleteTransaction]);

  // ── INIT: run only ONCE when entering the screen ──────────────────────────
  useEffect(() => {
    if (isEditMode && transactionData) {
      setType(transactionData.type);
      setAmount(safeNumber(transactionData.amount).toString());
      setCategory(transactionData.category);
      setDescription(transactionData.description || "");
      setDate(transactionData.date);
      if (transactionData.cyclePeriod) {
        setIsCycleActive(true);
        if (transactionData.cyclePeriod === 7) setCyclePreset("weekly");
        else if (transactionData.cyclePeriod === 30) setCyclePreset("monthly");
        else {
          setCyclePreset("custom");
          setCustomDays(transactionData.cyclePeriod.toString());
        }
      }
      if (transactionData.subTransactions && transactionData.subTransactions.length > 0) {
        setSubItems(transactionData.subTransactions);
        setShowSubItems(true);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — run once on mount

  // ── Navigation header — re-run when loading or edit mode changes ──────────
  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? "Edit Transaksi" : "Tambah Transaksi",
      headerStyle: { backgroundColor: PRIMARY_COLOR },
      headerTintColor: TEXT_PRIMARY,
      headerTitleStyle: { fontWeight: "600" },
      headerRight: () => (
        <TouchableOpacity
          onPress={showDeleteConfirmation}
          style={tw`mr-4 ${isEditMode ? "opacity-100" : "opacity-0"}`}
          disabled={!isEditMode || loading}
        >
          <Ionicons
            name="trash-outline"
            size={22}
            color={isEditMode && !loading ? TEXT_PRIMARY : "transparent"}
          />
        </TouchableOpacity>
      ),
    });
  }, [
    isEditMode,
    navigation,
    loading,
    showDeleteConfirmation,
  ]);

  const validateAmount = (value: string): boolean => {
    setAmountError("");

    if (!value.trim()) {
      setAmountError("Jumlah harus diisi");
      return false;
    }

    const amountNum = safeNumber(parseFloat(value.replace(/[^0-9.]/g, "")));
    if (isNaN(amountNum) || amountNum <= 0) {
      setAmountError("Jumlah harus angka positif");
      return false;
    }

    if (amountNum > 1000000000) {
      setAmountError("Jumlah terlalu besar");
      return false;
    }

    return true;
  };

  const handleAmountChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, "");
    const parts = cleanValue.split(".");

    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;

    setAmount(cleanValue);
    if (cleanValue) {
      validateAmount(cleanValue);
    } else {
      setAmountError("");
    }
  };

  const formatAmountDisplay = () => {
    if (!amount) return "";
    const amountNum = safeNumber(parseFloat(amount));
    if (isNaN(amountNum)) return amount;

    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amountNum);
  };

  const handleDateSelect = (day: any) => {
    try {
      const selectedDate = new Date(day.dateString);
      if (isNaN(selectedDate.getTime())) {
        throw new Error("Tanggal tidak valid");
      }

      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const dayStr = String(selectedDate.getDate()).padStart(2, "0");

      setDate(`${year}-${month}-${dayStr}`);
      setShowCalendar(false);
    } catch (error) {
      Alert.alert("Error", "Gagal memilih tanggal");
    }
  };

  const handleSubmit = async () => {
    if (!validateAmount(amount)) {
      Alert.alert("Error", amountError || "Jumlah tidak valid");
      return;
    }

    if (!category) {
      Alert.alert("Error", "Pilih kategori transaksi");
      return;
    }

    if (!date) {
      Alert.alert("Error", "Pilih tanggal transaksi");
      return;
    }

    const amountNum = safeNumber(parseFloat(amount));

    let finalCyclePeriod: number | undefined = undefined;
    if (type === "income" && isCycleActive) {
      if (cyclePreset === "weekly") finalCyclePeriod = 7;
      else if (cyclePreset === "monthly") finalCyclePeriod = 30;
      else finalCyclePeriod = Math.max(1, safeNumber(parseInt(customDays)) || 7);
    }

    // Filter valid sub-items (must have name AND amount > 0)
    const validSubItems = (showSubItems && subItems.length > 0)
      ? subItems.filter((s) => s.name.trim().length > 0 && s.amount > 0)
      : [];
    // undefined = no sub-items (removes on edit); array with items = save
    const finalSubItems: SubTransaction[] | undefined =
      validSubItems.length > 0 ? validSubItems : undefined;

    setLoading(true);
    try {
      if (isEditMode && transactionData) {
        await editTransaction(transactionData.id, {
          amount: amountNum,
          type,
          category,
          description: description.trim(),
          date,
          ...(finalCyclePeriod ? { cyclePeriod: finalCyclePeriod } : { cyclePeriod: undefined }),
          subTransactions: finalSubItems, // always passed — undefined clears it
        });
        Alert.alert("Sukses", "Transaksi berhasil diperbarui", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        await addTransaction({
          amount: amountNum,
          type,
          category,
          description: description.trim(),
          date,
          ...(finalCyclePeriod ? { cyclePeriod: finalCyclePeriod } : {}),
          ...(finalSubItems ? { subTransactions: finalSubItems } : {}),
        });
        Alert.alert("Sukses", "Transaksi berhasil ditambahkan", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message ||
          `Gagal ${isEditMode ? "mengedit" : "menambah"} transaksi`
      );
    } finally {
      setLoading(false);
    }
  };

  const getFormattedDate = () => {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return date;

      return dateObj.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return date;
    }
  };

  // Resolve icon + color for the currently selected category
  const resolvedCategory = React.useMemo((): CategoryItem | null => {
    const all: CategoryItem[] = [
      ...DEFAULT_CATEGORIES,
      ...(state.customCategories || []).map((c) => ({
        id: c.id, name: c.name, icon: c.icon, color: c.color,
        isCustom: true as const, customId: c.id,
      })),
    ];
    return all.find((c) => c.name === category) || null;
  }, [category, state.customCategories]);

  return (
    <View style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-4 pt-4 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        {/* Transaction Type - 2 Columns Compact */}
        <View style={tw`mb-4`}>
          <Text
            style={[tw`text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1`, { color: TEXT_SECONDARY }]}
          >
            Tipe Transaksi
          </Text>
          <View style={tw`flex-row gap-3`}>
            {/* Pengeluaran */}
            <TouchableOpacity
              style={[
                tw`flex-1 rounded-xl px-3 py-3`,
                type === "expense"
                  ? { backgroundColor: ERROR_COLOR + "15" }
                  : { backgroundColor: SURFACE_COLOR },
              ]}
              onPress={() => handleTypeChange("expense")}
              disabled={loading}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <Ionicons name="arrow-up" size={16} color={type === "expense" ? ERROR_COLOR : TEXT_SECONDARY} />
                <Text style={[tw`text-xs font-bold ml-1.5`, { color: type === "expense" ? ERROR_COLOR : TEXT_SECONDARY }]}>
                  Pengeluaran
                </Text>
              </View>
            </TouchableOpacity>

            {/* Pemasukan */}
            <TouchableOpacity
              style={[
                tw`flex-1 rounded-xl px-3 py-3`,
                type === "income"
                  ? { backgroundColor: SUCCESS_COLOR + "15" }
                  : { backgroundColor: SURFACE_COLOR },
              ]}
              onPress={() => handleTypeChange("income")}
              disabled={loading}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <Ionicons name="arrow-down" size={16} color={type === "income" ? SUCCESS_COLOR : TEXT_SECONDARY} />
                <Text style={[tw`text-xs font-bold ml-1.5`, { color: type === "income" ? SUCCESS_COLOR : TEXT_SECONDARY }]}>
                  Pemasukan
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Amount Suggestions */}
        {!amount && (
          <View style={tw`mb-4`}>
            <Text style={[tw`text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1`, { color: TEXT_SECONDARY }]}>
              💡 Jumlah Cepat
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-1`}>
              <View style={tw`flex-row px-1`}>
                {[10000, 25000, 50000, 100000, 250000, 500000].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[tw`rounded-xl px-4 py-2 mr-2`, { backgroundColor: SURFACE_COLOR }]}
                    onPress={() => setAmount(value.toString())}
                  >
                    <Text style={[tw`text-xs font-bold`, { color: ACCENT_COLOR }]}>
                      {new Intl.NumberFormat("id-ID", { notation: "compact", compactDisplay: "short" }).format(value)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Amount Input */}
        <View style={tw`mb-4`}>
          <Text style={[tw`text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1`, { color: TEXT_SECONDARY }]}>
            Jumlah
          </Text>
          <View style={[tw`rounded-xl px-4 py-3`, { backgroundColor: SURFACE_COLOR, borderWidth: amountError ? 1 : 0, borderColor: amountError ? ERROR_COLOR : "transparent" }]}>
            <View style={tw`flex-row items-center`}>
              <Text style={[tw`text-lg font-bold mr-2`, { color: TEXT_SECONDARY }]}>Rp</Text>
              <TextInput
                style={[tw`flex-1 text-xl font-bold`, { color: TEXT_PRIMARY, padding: 0 }]}
                placeholder="0"
                placeholderTextColor={Colors.textTertiary}
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="decimal-pad"
                returnKeyType="done"
                maxLength={15}
                editable={!loading && !(showSubItems && type === "expense")}
              />
            </View>
            {amount && !amountError ? (
              <View style={tw`mt-2 pt-2 border-t border-gray-700`}>
                <Text style={[tw`text-[10px] font-medium`, { color: TEXT_SECONDARY }]}>{formatAmountDisplay()}</Text>
                {parseFloat(amount) > 1000000 && (
                  <View style={tw`flex-row items-center mt-1`}>
                    <Ionicons name="bulb-outline" size={10} color={WARNING_COLOR} />
                    <Text style={[tw`text-[10px] ml-1`, { color: WARNING_COLOR }]}>💰 Transaksi besar!</Text>
                  </View>
                )}
              </View>
            ) : null}
            {amountError ? <Text style={[tw`text-[10px] mt-1`, { color: ERROR_COLOR }]}>{amountError}</Text> : null}
          </View>
        </View>

        {/* Category Selection */}
        <View style={tw`mb-4`}>
          <Text style={[tw`text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1`, { color: TEXT_SECONDARY }]}>Kategori</Text>
          <TouchableOpacity
            onPress={() => setShowCategoryPicker(true)}
            disabled={loading}
            style={[tw`rounded-xl px-4 py-3 flex-row items-center`, { backgroundColor: SURFACE_COLOR }]}
          >
            {resolvedCategory ? (
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${resolvedCategory.color}20`, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Ionicons name={resolvedCategory.icon as any} size={16} color={resolvedCategory.color} />
              </View>
            ) : (
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${ACCENT_COLOR}12`, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Ionicons name="grid-outline" size={16} color={ACCENT_COLOR} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ color: category ? TEXT_PRIMARY : Colors.textTertiary, fontSize: 13, fontWeight: "600" }}>
                {category || "Pilih kategori..."}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.gray500} />
          </TouchableOpacity>
        </View>

        {/* CategoryPickerModal */}
        <CategoryPickerModal
          visible={showCategoryPicker}
          onClose={() => setShowCategoryPicker(false)}
          onSelect={(name) => setCategory(name)}
          selectedName={category}
        />

        {/* Date Selection */}
        <View style={tw`mb-4`}>
          <Text style={[tw`text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1`, { color: TEXT_SECONDARY }]}>Tanggal</Text>
          <TouchableOpacity
            style={[tw`rounded-xl px-4 py-3 flex-row justify-between items-center`, { backgroundColor: SURFACE_COLOR }]}
            onPress={() => setShowCalendar(true)}
            disabled={loading}
          >
            <Text style={[tw`text-[13px] font-semibold`, { color: TEXT_PRIMARY }]}>{getFormattedDate()}</Text>
            <Ionicons name="calendar-outline" size={16} color={Colors.gray500} />
          </TouchableOpacity>
        </View>



        {/* Start New Cycle Toggle - Only for Income */}
        {type === "income" && (
          <View style={tw`mb-5`}>
            <View
              style={[
                tw`rounded-xl p-4`,
                { backgroundColor: SURFACE_COLOR },
                isCycleActive && { backgroundColor: ACCENT_COLOR + "05", borderWidth: 1, borderColor: ACCENT_COLOR }
              ]}
            >
              <View style={tw`flex-row items-center justify-between`}>
                <View style={tw`flex-1 mr-4`}>
                  <View style={tw`flex-row items-center mb-1`}>
                    <Ionicons name="sync-outline" size={16} color={ACCENT_COLOR} style={tw`mr-2`} />
                    <Text style={[tw`text-sm font-semibold`, { color: TEXT_PRIMARY }]}>
                      Mulai Periode Baru
                    </Text>
                  </View>
                  <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                    Jadikan uang ini patokan jatah waktu "Minggu Ini" di layar Utama.
                  </Text>
                </View>
                <Switch
                  value={isCycleActive}
                  onValueChange={setIsCycleActive}
                  trackColor={{ false: Colors.gray400, true: ACCENT_COLOR }}
                  thumbColor={"#FFFFFF"}
                />
              </View>

              {/* Cycle Options */}
              {isCycleActive && (
                <View style={tw`mt-4 pt-4 border-t border-gray-700`}>
                  <Text style={[tw`text-xs font-medium mb-3`, { color: TEXT_SECONDARY }]}>DURASI PERIODE:</Text>
                  <View style={tw`flex-row gap-2`}>
                    <TouchableOpacity
                      style={[
                        tw`flex-1 py-2 items-center rounded-xl border`,
                        cyclePreset === "weekly" ? { backgroundColor: ACCENT_COLOR + "20", borderColor: ACCENT_COLOR } : { backgroundColor: Colors.surfaceLight, borderColor: BORDER_COLOR }
                      ]}
                      onPress={() => setCyclePreset("weekly")}
                    >
                      <Text style={[tw`text-xs font-medium`, { color: cyclePreset === "weekly" ? ACCENT_COLOR : TEXT_SECONDARY }]}>7 Hari</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        tw`flex-1 py-2 items-center rounded-xl border`,
                        cyclePreset === "monthly" ? { backgroundColor: ACCENT_COLOR + "20", borderColor: ACCENT_COLOR } : { backgroundColor: Colors.surfaceLight, borderColor: BORDER_COLOR }
                      ]}
                      onPress={() => setCyclePreset("monthly")}
                    >
                      <Text style={[tw`text-xs font-medium`, { color: cyclePreset === "monthly" ? ACCENT_COLOR : TEXT_SECONDARY }]}>30 Hari</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        tw`flex-1 py-2 items-center rounded-xl border`,
                        cyclePreset === "custom" ? { backgroundColor: ACCENT_COLOR + "20", borderColor: ACCENT_COLOR } : { backgroundColor: Colors.surfaceLight, borderColor: BORDER_COLOR }
                      ]}
                      onPress={() => setCyclePreset("custom")}
                    >
                      <Text style={[tw`text-xs font-medium`, { color: cyclePreset === "custom" ? ACCENT_COLOR : TEXT_SECONDARY }]}>Kustom</Text>
                    </TouchableOpacity>
                  </View>

                  {cyclePreset === "custom" && (
                    <View style={tw`mt-3 flex-row items-center bg-gray-800 rounded-xl px-4 py-1 border border-gray-700`}>
                      <TextInput
                        style={[tw`flex-1 py-2 text-base font-semibold`, { color: TEXT_PRIMARY }]}
                        value={customDays}
                        onChangeText={setCustomDays}
                        keyboardType="number-pad"
                        placeholder="Contoh: 15"
                        placeholderTextColor={Colors.gray400}
                        maxLength={3}
                      />
                      <Text style={[tw`text-sm font-medium`, { color: TEXT_SECONDARY }]}>Hari</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Description Input */}
        <View style={tw`mb-4`}>
          <View style={tw`flex-row items-center justify-between mb-1.5 ml-1`}>
            <Text style={[tw`text-[10px] font-bold uppercase tracking-widest`, { color: TEXT_SECONDARY }]}>Catatan (Opsional)</Text>
            <Text style={[tw`text-[10px]`, { color: Colors.gray500 }]}>{description.length}/200</Text>
          </View>
          <View style={[tw`rounded-xl px-4 py-3`, { backgroundColor: SURFACE_COLOR }]}>
            <TextInput
              style={[tw`text-[13px] font-medium min-h-[60px]`, { color: TEXT_PRIMARY, padding: 0 }]}
              placeholder="Catat rincian atau info tambahan..."
              placeholderTextColor={Colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              maxLength={200}
              editable={!loading}
            />
          </View>
        </View>

        {/* ── Sub-Transaksi (Keranjang Belanja) ─────────── */}
        {type === "expense" && (
          <View style={{ marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => {
                if (!showSubItems) {
                  setShowSubItems(true);
                  if (subItems.length === 0) setSubItems([{ id: `sub_${Date.now()}`, name: "", amount: 0, qty: 1 }]);
                } else {
                  setShowSubItems(false);
                }
              }}
              style={{
                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                backgroundColor: showSubItems ? `${ACCENT_COLOR}12` : SURFACE_COLOR,
                borderRadius: 12, padding: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${ACCENT_COLOR}20`, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                  <Ionicons name="cart-outline" size={16} color={ACCENT_COLOR} />
                </View>
                <View>
                  <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "700" }}>Rincian Belanja</Text>
                  <Text style={{ color: Colors.gray400, fontSize: 10, marginTop: 1 }}>
                    {showSubItems && subItems.length > 0
                      ? `${subItems.length} item · Rp ${subItems.reduce((s, i) => s + i.amount * i.qty, 0).toLocaleString("id-ID")}`
                      : "Opsional — catat per item"}
                  </Text>
                </View>
              </View>
              <Ionicons name={showSubItems ? "chevron-up" : "chevron-down"} size={16} color={ACCENT_COLOR} />
            </TouchableOpacity>

            {showSubItems && (
              <View style={{ backgroundColor: SURFACE_COLOR, borderRadius: 16, borderWidth: 1, borderColor: BORDER_COLOR, overflow: "hidden" }}>
                {subItems.map((item, idx) => (
                  <View key={item.id} style={{ padding: 12, borderBottomWidth: idx < subItems.length - 1 ? 1 : 0, borderBottomColor: BORDER_COLOR }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                      <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: `${ACCENT_COLOR}20`,
                        alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                        <Text style={{ color: ACCENT_COLOR, fontSize: 11, fontWeight: "800" }}>{idx + 1}</Text>
                      </View>
                      <TextInput
                        style={{ flex: 1, color: TEXT_PRIMARY, fontSize: 13, fontWeight: "600",
                          backgroundColor: Colors.background, borderRadius: 10,
                          paddingHorizontal: 12, paddingVertical: 7,
                          borderWidth: 1, borderColor: BORDER_COLOR }}
                        placeholder="Nama item..."
                        placeholderTextColor={Colors.gray500}
                        value={item.name}
                        onChangeText={(v) => setSubItems((p) => p.map((s, i) => i === idx ? { ...s, name: v } : s))}
                        maxLength={50}
                      />
                      <TouchableOpacity onPress={() => setSubItems((p) => p.filter((_, i) => i !== idx))} style={{ marginLeft: 8, padding: 4 }}>
                        <Ionicons name="close-circle" size={20} color={ERROR_COLOR} />
                      </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: "row", gap: 8, marginLeft: 36 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: Colors.background,
                        borderRadius: 10, borderWidth: 1, borderColor: BORDER_COLOR, paddingHorizontal: 8, paddingVertical: 4 }}>
                        <TouchableOpacity
                          onPress={() => setSubItems((p) => {
                            return p.map((s, i) =>
                              i === idx ? { ...s, qty: Math.max(1, s.qty - 1) } : s
                            );
                          })}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="remove" size={16} color={Colors.gray400} />
                        </TouchableOpacity>
                        <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "700", marginHorizontal: 10 }}>{item.qty}x</Text>
                        <TouchableOpacity
                          onPress={() => setSubItems((p) => {
                            return p.map((s, i) =>
                              i === idx ? { ...s, qty: s.qty + 1 } : s
                            );
                          })}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="add" size={16} color={ACCENT_COLOR} />
                        </TouchableOpacity>
                      </View>
                      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: Colors.background,
                        borderRadius: 10, borderWidth: 1, borderColor: BORDER_COLOR, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ color: Colors.gray400, fontSize: 12, marginRight: 4 }}>Rp</Text>
                        <TextInput
                          style={{ flex: 1, color: TEXT_PRIMARY, fontSize: 13, fontWeight: "600" }}
                          placeholder="0"
                          placeholderTextColor={Colors.gray500}
                          value={item.amount > 0 ? item.amount.toString() : ""}
                          onChangeText={(v) => {
                            const num = parseInt(v.replace(/[^0-9]/g, ""), 10) || 0;
                            setSubItems((prev) => {
                              return prev.map((s, i) =>
                                i === idx ? { ...s, amount: num } : s
                              );
                            });
                          }}
                          keyboardType="number-pad"
                          maxLength={12}
                        />
                        {item.qty > 1 && item.amount > 0 && (
                          <Text style={{ color: Colors.gray500, fontSize: 10 }}>={( item.amount * item.qty).toLocaleString("id-ID")}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => setSubItems((p) => [...p, { id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name: "", amount: 0, qty: 1 }])}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderTopWidth: 1, borderTopColor: BORDER_COLOR }}
                >
                  <Ionicons name="add-circle-outline" size={18} color={ACCENT_COLOR} style={{ marginRight: 6 }} />
                  <Text style={{ color: ACCENT_COLOR, fontSize: 13, fontWeight: "700" }}>Tambah Item</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Transaction Summary Preview */}
        {amount && category && (
          <View
            style={[
              tw`rounded-2xl p-4 mb-5`,
              {
                backgroundColor:
                  type === "income" ? SUCCESS_COLOR + "10" : ERROR_COLOR + "10",
                borderWidth: 1,
                borderColor:
                  type === "income" ? SUCCESS_COLOR + "30" : ERROR_COLOR + "30",
              },
            ]}
          >
            <View style={tw`flex-row items-center mb-2`}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={type === "income" ? SUCCESS_COLOR : ERROR_COLOR}
              />
              <Text
                style={[
                  tw`text-xs font-semibold ml-2`,
                  { color: type === "income" ? SUCCESS_COLOR : ERROR_COLOR },
                ]}
              >
                Preview Transaksi
              </Text>
            </View>
            <Text style={[tw`text-sm`, { color: TEXT_PRIMARY }]}>
              {type === "income" ? "💰 Pemasukan" : "💸 Pengeluaran"} sebesar{" "}
              <Text style={tw`font-bold`}>Rp {formatAmountDisplay()}</Text>{" "}
              untuk kategori <Text style={tw`font-bold`}>{category}</Text>
              {description
                ? ` - ${description.substring(0, 30)}${
                    description.length > 30 ? "..." : ""
                  }`
                : ""}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={tw`flex-row gap-3 mt-4`}>
          <TouchableOpacity
            style={[tw`flex-1 rounded-xl py-3.5 items-center`, { backgroundColor: SURFACE_COLOR }]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={[tw`text-[13px] font-bold`, { color: TEXT_PRIMARY }]}>Batal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[tw`flex-1 rounded-xl py-3.5 items-center`, { backgroundColor: ACCENT_COLOR, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={tw`text-white text-[13px] font-bold`}>
              {loading ? "Menyimpan..." : isEditMode ? "Simpan" : "Tambah"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
          <View
            style={[tw`rounded-t-3xl p-5`, { backgroundColor: SURFACE_COLOR }]}
          >
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={[tw`text-lg font-bold`, { color: TEXT_PRIMARY }]}>
                Pilih Tanggal
              </Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={TEXT_SECONDARY}
                />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={{
                [date]: {
                  selected: true,
                  selectedColor: ACCENT_COLOR,
                  selectedTextColor: "#FFFFFF",
                },
              }}
              theme={{
                backgroundColor: SURFACE_COLOR,
                calendarBackground: SURFACE_COLOR,
                textSectionTitleColor: TEXT_SECONDARY,
                selectedDayBackgroundColor: ACCENT_COLOR,
                selectedDayTextColor: "#FFFFFF",
                todayTextColor: ACCENT_COLOR,
                dayTextColor: TEXT_PRIMARY,
                textDisabledColor: Colors.textTertiary,
                dotColor: ACCENT_COLOR,
                selectedDotColor: "#FFFFFF",
                arrowColor: ACCENT_COLOR,
                monthTextColor: ACCENT_COLOR,
                textMonthFontWeight: "bold",
                textDayFontSize: 16,
                textMonthFontSize: 18,
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AddTransactionScreen;
