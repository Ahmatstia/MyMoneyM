// File: src/screens/AddTransactionScreen.tsx
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
  Animated,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";

import { useAppContext } from "../../context/AppContext";
import { getCurrentDate, safeNumber } from "../../utils/calculations";
import { RootStackParamList, TransactionType } from "../../types";
import { Colors } from "../../theme/theme";

type AddTransactionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddTransaction"
>;
type AddTransactionScreenRouteProp = RouteProp<
  RootStackParamList,
  "AddTransaction"
>;

// ─── Theme colors (tidak diubah) ──────────────────────────────────────────────
const PRIMARY_COLOR    = Colors.primary;
const ACCENT_COLOR     = Colors.accent;
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR    = Colors.surface;
const TEXT_PRIMARY     = Colors.textPrimary;
const TEXT_SECONDARY   = Colors.textSecondary;
const SUCCESS_COLOR    = Colors.success;
const ERROR_COLOR      = Colors.error;
const WARNING_COLOR    = Colors.warning;

// ─── Design tokens (konsisten dengan seluruh app) ─────────────────────────────
const CARD_RADIUS  = 20;
const INNER_RADIUS = 14;
const CARD_PAD     = 20;
const CARD_BORDER  = "rgba(255,255,255,0.06)";

// ─── Kategori (tidak diubah) ──────────────────────────────────────────────────
const CATEGORIES = [
  { id: "makanan",      name: "Makanan",      icon: "restaurant-outline" },
  { id: "transportasi", name: "Transportasi", icon: "car-outline" },
  { id: "belanja",      name: "Belanja",      icon: "cart-outline" },
  { id: "hiburan",      name: "Hiburan",      icon: "film-outline" },
  { id: "kesehatan",    name: "Kesehatan",    icon: "medical-outline" },
  { id: "pendidikan",   name: "Pendidikan",   icon: "school-outline" },
  { id: "tagihan",      name: "Tagihan",      icon: "document-text-outline" },
  { id: "gaji",         name: "Gaji",         icon: "cash-outline" },
  { id: "investasi",    name: "Investasi",    icon: "trending-up-outline" },
  { id: "lainnya",      name: "Lainnya",      icon: "ellipsis-horizontal-outline" },
] as const;

// ─── Field label helper ───────────────────────────────────────────────────────
const FieldLabel = ({
  label,
  suffix,
}: {
  label: string;
  suffix?: React.ReactNode;
}) => (
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View
        style={{
          width: 3,
          height: 12,
          backgroundColor: ACCENT_COLOR,
          borderRadius: 2,
          marginRight: 7,
        }}
      />
      <Text
        style={{
          color: Colors.gray400,
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 1.2,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </View>
    {suffix}
  </View>
);

// ─── Main component ───────────────────────────────────────────────────────────

const AddTransactionScreen: React.FC = () => {
  const navigation = useNavigation<AddTransactionScreenNavigationProp>();
  const route      = useRoute<AddTransactionScreenRouteProp>();
  const { addTransaction, editTransaction, deleteTransaction } = useAppContext();

  const [type, setType]               = useState<TransactionType>("expense");
  const [amount, setAmount]           = useState("");
  const [category, setCategory]       = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate]               = useState(getCurrentDate());
  const [showCalendar, setShowCalendar]         = useState(false);
  const [loading, setLoading]                   = useState(false);
  const [amountError, setAmountError]           = useState("");
  const [isCycleActive, setIsCycleActive]       = useState(false);
  const [cyclePreset, setCyclePreset]           = useState<"weekly" | "monthly" | "custom">("weekly");
  const [customDays, setCustomDays]             = useState("14");
  const [amountFocused, setAmountFocused]       = useState(false);
  const [descFocused, setDescFocused]           = useState(false);

  const params          = route.params || {};
  const isEditMode      = params.editMode || false;
  const transactionData = params.transactionData;

  // ── Semua logika di bawah ini TIDAK DIUBAH ────────────────────────────────

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
        { text: "Hapus", style: "destructive", onPress: handleDeleteTransaction },
      ]
    );
  }, [isEditMode, transactionData, handleDeleteTransaction]);

  useEffect(() => {
    if (isEditMode && transactionData) {
      setType(transactionData.type);
      setAmount(safeNumber(transactionData.amount).toString());
      setCategory(transactionData.category);
      setDescription(transactionData.description || "");
      setDate(transactionData.date);
      if (transactionData.cyclePeriod) {
        setIsCycleActive(true);
        if (transactionData.cyclePeriod === 7)       setCyclePreset("weekly");
        else if (transactionData.cyclePeriod === 30) setCyclePreset("monthly");
        else {
          setCyclePreset("custom");
          setCustomDays(transactionData.cyclePeriod.toString());
        }
      }
    }

    navigation.setOptions({
      title: isEditMode ? "Edit Transaksi" : "Tambah Transaksi",
      headerStyle: { backgroundColor: BACKGROUND_COLOR },
      headerTintColor: TEXT_PRIMARY,
      headerTitleStyle: { fontWeight: "700", fontSize: 16 },
      headerShadowVisible: false,
      headerRight: () =>
        isEditMode ? (
          <TouchableOpacity
            onPress={showDeleteConfirmation}
            style={{
              marginRight: 16,
              width: 34,
              height: 34,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${ERROR_COLOR}18`,
            }}
            disabled={loading}
          >
            <Ionicons name="trash-outline" size={16} color={ERROR_COLOR} />
          </TouchableOpacity>
        ) : null,
    });
  }, [isEditMode, transactionData, navigation, loading, showDeleteConfirmation]);

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
    const parts      = cleanValue.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(cleanValue);
    if (cleanValue) validateAmount(cleanValue);
    else setAmountError("");
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
      if (isNaN(selectedDate.getTime())) throw new Error("Tanggal tidak valid");
      const year  = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const dayStr = String(selectedDate.getDate()).padStart(2, "0");
      setDate(`${year}-${month}-${dayStr}`);
      setShowCalendar(false);
    } catch { Alert.alert("Error", "Gagal memilih tanggal"); }
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
      if (cyclePreset === "weekly")       finalCyclePeriod = 7;
      else if (cyclePreset === "monthly") finalCyclePeriod = 30;
      else finalCyclePeriod = Math.max(1, safeNumber(parseInt(customDays)) || 7);
    }

    setLoading(true);
    try {
      if (isEditMode && transactionData) {
        await editTransaction(transactionData.id, {
          amount: amountNum, type, category,
          description: description.trim(), date,
          ...(finalCyclePeriod ? { cyclePeriod: finalCyclePeriod } : {}),
        });
        Alert.alert("Sukses", "Transaksi berhasil diperbarui", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        await addTransaction({
          amount: amountNum, type, category,
          description: description.trim(), date,
          ...(finalCyclePeriod ? { cyclePeriod: finalCyclePeriod } : {}),
        });
        Alert.alert("Sukses", "Transaksi berhasil ditambahkan", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || `Gagal ${isEditMode ? "mengedit" : "menambah"} transaksi`);
    } finally {
      setLoading(false);
    }
  };

  const getFormattedDate = () => {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return date;
      return dateObj.toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });
    } catch { return date; }
  };

  const renderCategoryIcon = (iconName: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      "restaurant-outline":         "restaurant-outline",
      "car-outline":                "car-outline",
      "cart-outline":               "cart-outline",
      "film-outline":               "film-outline",
      "medical-outline":            "medical-outline",
      "school-outline":             "school-outline",
      "document-text-outline":      "document-text-outline",
      "cash-outline":               "cash-outline",
      "trending-up-outline":        "trending-up-outline",
      "ellipsis-horizontal-outline":"ellipsis-horizontal-outline",
    };
    return iconMap[iconName] || "receipt-outline";
  };

  const activeTypeColor = type === "income" ? SUCCESS_COLOR : ERROR_COLOR;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <View style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Transaction type — segmented control ─────────────────────── */}
        <View style={{ marginBottom: 22 }}>
          <FieldLabel label="Tipe Transaksi" />
          <View
            style={{
              flexDirection: "row",
              backgroundColor: SURFACE_COLOR,
              borderRadius: 13,
              padding: 3,
              borderWidth: 1,
              borderColor: CARD_BORDER,
            }}
          >
            {[
              { key: "expense", label: "Pengeluaran", icon: "arrow-up-outline" as keyof typeof Ionicons.glyphMap, color: ERROR_COLOR },
              { key: "income",  label: "Pemasukan",   icon: "arrow-down-outline" as keyof typeof Ionicons.glyphMap, color: SUCCESS_COLOR },
            ].map((item) => {
              const isActive = type === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 11,
                    borderRadius: 10,
                    gap: 7,
                    backgroundColor: isActive ? `${item.color}20` : "transparent",
                  }}
                  onPress={() => setType(item.key as TransactionType)}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.icon}
                    size={15}
                    color={isActive ? item.color : Colors.gray400}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? "700" : "500",
                      color: isActive ? item.color : Colors.gray400,
                    }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Amount input ─────────────────────────────────────────────── */}
        <View style={{ marginBottom: 22 }}>
          <FieldLabel label="Jumlah" />

          {/* Quick amount suggestions */}
          {!amount && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
            >
              {[10000, 25000, 50000, 100000, 250000, 500000].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: `${ACCENT_COLOR}12`,
                    borderWidth: 1,
                    borderColor: `${ACCENT_COLOR}25`,
                  }}
                  onPress={() => setAmount(value.toString())}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: ACCENT_COLOR, fontSize: 11, fontWeight: "600" }}>
                    {new Intl.NumberFormat("id-ID", {
                      notation: "compact",
                      compactDisplay: "short",
                    }).format(value)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Amount input card */}
          <View
            style={{
              backgroundColor: SURFACE_COLOR,
              borderRadius: CARD_RADIUS,
              borderWidth: 1.5,
              borderColor: amountError
                ? ERROR_COLOR
                : amountFocused
                ? `${ACCENT_COLOR}60`
                : CARD_BORDER,
              padding: CARD_PAD,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{ color: Colors.gray400, fontSize: 20, fontWeight: "600", marginRight: 8 }}
              >
                Rp
              </Text>
              <TextInput
                style={{ flex: 1, color: TEXT_PRIMARY, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 }}
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.15)"
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="decimal-pad"
                returnKeyType="done"
                maxLength={15}
                editable={!loading}
                onFocus={() => setAmountFocused(true)}
                onBlur={() => setAmountFocused(false)}
              />
              {amount ? (
                <TouchableOpacity
                  onPress={() => { setAmount(""); setAmountError(""); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color={Colors.gray400} />
                </TouchableOpacity>
              ) : null}
            </View>

            {amount && !amountError && (
              <View
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: CARD_BORDER,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: Colors.gray400, fontSize: 12 }}>
                  {formatAmountDisplay()}
                </Text>
                {parseFloat(amount) > 1000000 && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 9,
                      paddingVertical: 3,
                      borderRadius: 20,
                      backgroundColor: `${WARNING_COLOR}15`,
                      borderWidth: 1,
                      borderColor: `${WARNING_COLOR}25`,
                    }}
                  >
                    <Ionicons name="alert-circle-outline" size={11} color={WARNING_COLOR} style={{ marginRight: 4 }} />
                    <Text style={{ color: WARNING_COLOR, fontSize: 10, fontWeight: "600" }}>
                      Transaksi besar
                    </Text>
                  </View>
                )}
              </View>
            )}

            {amountError ? (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                <Ionicons name="alert-circle-outline" size={12} color={ERROR_COLOR} style={{ marginRight: 5 }} />
                <Text style={{ color: ERROR_COLOR, fontSize: 11 }}>
                  {amountError}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Category grid ────────────────────────────────────────────── */}
        <View style={{ marginBottom: 22 }}>
          <FieldLabel
            label="Kategori"
            suffix={
              category ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 9,
                    paddingVertical: 3,
                    borderRadius: 20,
                    backgroundColor: `${activeTypeColor}15`,
                    borderWidth: 1,
                    borderColor: `${activeTypeColor}25`,
                  }}
                >
                  <Ionicons name="checkmark" size={10} color={activeTypeColor} style={{ marginRight: 4 }} />
                  <Text style={{ color: activeTypeColor, fontSize: 10, fontWeight: "600" }}>
                    {category}
                  </Text>
                </View>
              ) : null
            }
          />

          <View
            style={{
              backgroundColor: SURFACE_COLOR,
              borderRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: CARD_BORDER,
              padding: 14,
            }}
          >
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={{
                      width: "18%",
                      minWidth: 56,
                      alignItems: "center",
                    }}
                    onPress={() => setCategory(cat.name)}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 15,
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 5,
                        backgroundColor: isSelected
                          ? `${activeTypeColor}20`
                          : "rgba(255,255,255,0.05)",
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected
                          ? activeTypeColor
                          : CARD_BORDER,
                      }}
                    >
                      <Ionicons
                        name={renderCategoryIcon(cat.icon)}
                        size={22}
                        color={isSelected ? activeTypeColor : Colors.gray400}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 10,
                        textAlign: "center",
                        color: isSelected ? TEXT_PRIMARY : Colors.gray400,
                        fontWeight: isSelected ? "700" : "400",
                      }}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Date picker ──────────────────────────────────────────────── */}
        <View style={{ marginBottom: 22 }}>
          <FieldLabel label="Tanggal" />
          <TouchableOpacity
            style={{
              backgroundColor: SURFACE_COLOR,
              borderRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: CARD_BORDER,
              padding: CARD_PAD,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            onPress={() => setShowCalendar(true)}
            disabled={loading}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 11,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: `${ACCENT_COLOR}15`,
                  marginRight: 13,
                }}
              >
                <Ionicons name="calendar-outline" size={17} color={ACCENT_COLOR} />
              </View>
              <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "500" }}>
                {getFormattedDate()}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* ── Cycle toggle (income only) ───────────────────────────────── */}
        {type === "income" && (
          <View style={{ marginBottom: 22 }}>
            <FieldLabel label="Periode Baru" />
            <View
              style={{
                backgroundColor: SURFACE_COLOR,
                borderRadius: CARD_RADIUS,
                borderWidth: 1.5,
                borderColor: isCycleActive ? `${ACCENT_COLOR}40` : CARD_BORDER,
                padding: CARD_PAD,
              }}
            >
              {/* Toggle row */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1, marginRight: 16 }}>
                  <View
                    style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}
                  >
                    <View
                      style={{
                        width: 30, height: 30, borderRadius: 9,
                        alignItems: "center", justifyContent: "center",
                        backgroundColor: `${ACCENT_COLOR}15`, marginRight: 10,
                      }}
                    >
                      <Ionicons name="sync-outline" size={15} color={ACCENT_COLOR} />
                    </View>
                    <Text style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: "600" }}>
                      Mulai Periode Baru
                    </Text>
                  </View>
                  <Text style={{ color: Colors.gray400, fontSize: 11, lineHeight: 16, marginLeft: 40 }}>
                    Jadikan patokan jatah "Minggu Ini" di layar Utama.
                  </Text>
                </View>
                <Switch
                  value={isCycleActive}
                  onValueChange={setIsCycleActive}
                  trackColor={{ false: "rgba(255,255,255,0.1)", true: ACCENT_COLOR }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Cycle preset options */}
              {isCycleActive && (
                <View
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: CARD_BORDER,
                  }}
                >
                  <Text
                    style={{
                      color: Colors.gray400, fontSize: 9, fontWeight: "700",
                      letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10,
                    }}
                  >
                    Durasi Periode
                  </Text>
                  {/* Segmented */}
                  <View
                    style={{
                      flexDirection: "row",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      borderRadius: 12,
                      padding: 3,
                    }}
                  >
                    {[
                      { key: "weekly",  label: "7 Hari" },
                      { key: "monthly", label: "30 Hari" },
                      { key: "custom",  label: "Kustom" },
                    ].map((opt) => {
                      const isActive = cyclePreset === opt.key;
                      return (
                        <TouchableOpacity
                          key={opt.key}
                          style={{
                            flex: 1,
                            paddingVertical: 8,
                            borderRadius: 9,
                            alignItems: "center",
                            backgroundColor: isActive ? `${ACCENT_COLOR}25` : "transparent",
                          }}
                          onPress={() => setCyclePreset(opt.key as any)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: isActive ? "700" : "500",
                              color: isActive ? ACCENT_COLOR : Colors.gray400,
                            }}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Custom days input */}
                  {cyclePreset === "custom" && (
                    <View
                      style={{
                        marginTop: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        borderRadius: INNER_RADIUS,
                        paddingHorizontal: 16,
                        paddingVertical: 4,
                        borderWidth: 1,
                        borderColor: CARD_BORDER,
                      }}
                    >
                      <TextInput
                        style={{ flex: 1, color: TEXT_PRIMARY, fontSize: 15, fontWeight: "600", paddingVertical: 8 }}
                        value={customDays}
                        onChangeText={setCustomDays}
                        keyboardType="number-pad"
                        placeholder="Contoh: 15"
                        placeholderTextColor={Colors.gray400}
                        maxLength={3}
                      />
                      <Text style={{ color: Colors.gray400, fontSize: 13, fontWeight: "500" }}>
                        Hari
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Description ──────────────────────────────────────────────── */}
        <View style={{ marginBottom: 22 }}>
          <FieldLabel
            label="Catatan (opsional)"
            suffix={
              <Text style={{ color: Colors.gray400, fontSize: 10 }}>
                {description.length}/200
              </Text>
            }
          />
          <View
            style={{
              backgroundColor: SURFACE_COLOR,
              borderRadius: CARD_RADIUS,
              borderWidth: 1.5,
              borderColor: descFocused ? `${ACCENT_COLOR}60` : CARD_BORDER,
              padding: CARD_PAD,
            }}
          >
            <TextInput
              style={{ color: TEXT_PRIMARY, fontSize: 13, minHeight: 80, lineHeight: 20 }}
              placeholder="Tambahkan catatan untuk memudahkan pelacakan..."
              placeholderTextColor={Colors.gray400}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              maxLength={200}
              editable={!loading}
              onFocus={() => setDescFocused(true)}
              onBlur={() => setDescFocused(false)}
            />
          </View>
        </View>

        {/* ── Preview card ─────────────────────────────────────────────── */}
        {amount && category && (
          <View
            style={{
              backgroundColor: `${activeTypeColor}09`,
              borderRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: `${activeTypeColor}22`,
              padding: CARD_PAD,
              marginBottom: 22,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  width: 28, height: 28, borderRadius: 9,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: `${activeTypeColor}18`, marginRight: 10,
                }}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={15}
                  color={activeTypeColor}
                />
              </View>
              <Text style={{ color: activeTypeColor, fontSize: 11, fontWeight: "700" }}>
                Preview Transaksi
              </Text>
            </View>
            <Text style={{ color: TEXT_SECONDARY, fontSize: 13, lineHeight: 19 }}>
              {type === "income" ? "Pemasukan" : "Pengeluaran"} sebesar{" "}
              <Text style={{ color: TEXT_PRIMARY, fontWeight: "700" }}>
                Rp {formatAmountDisplay()}
              </Text>{" "}
              untuk <Text style={{ color: TEXT_PRIMARY, fontWeight: "700" }}>{category}</Text>
              {description
                ? ` · ${description.substring(0, 40)}${description.length > 40 ? "..." : ""}`
                : ""}
            </Text>
          </View>
        )}

        {/* ── Action buttons ───────────────────────────────────────────── */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              borderRadius: INNER_RADIUS,
              paddingVertical: 14,
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.06)",
              borderWidth: 1,
              borderColor: CARD_BORDER,
            }}
            onPress={() => navigation.goBack()}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={{ color: TEXT_SECONDARY, fontSize: 14, fontWeight: "600" }}>
              Batal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 2,
              borderRadius: INNER_RADIUS,
              paddingVertical: 14,
              alignItems: "center",
              backgroundColor: loading ? `${ACCENT_COLOR}70` : ACCENT_COLOR,
              shadowColor: ACCENT_COLOR,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: loading ? 0 : 0.35,
              shadowRadius: 10,
              elevation: loading ? 0 : 8,
            }}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={{ color: BACKGROUND_COLOR, fontSize: 14, fontWeight: "700" }}>
              {loading ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : "Tambah Transaksi"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Calendar modal ───────────────────────────────────────────────── */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }} pointerEvents="box-none">
          <TouchableOpacity
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.55)" }}
            activeOpacity={1}
            onPress={() => setShowCalendar(false)}
          />
          <View
            style={{
              backgroundColor: SURFACE_COLOR,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 36,
              borderTopWidth: 1,
              borderTopColor: CARD_BORDER,
            }}
          >
            {/* Drag handle */}
            <View
              style={{
                width: 36, height: 4, borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignSelf: "center", marginBottom: 16,
              }}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
                paddingHorizontal: 4,
              }}
            >
              <Text style={{ color: TEXT_PRIMARY, fontSize: 16, fontWeight: "700" }}>
                Pilih Tanggal
              </Text>
              <TouchableOpacity
                style={{
                  width: 32, height: 32, borderRadius: 10,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.07)",
                }}
                onPress={() => setShowCalendar(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={16} color={Colors.gray400} />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={{
                [date]: {
                  selected: true,
                  selectedColor: ACCENT_COLOR,
                  selectedTextColor: BACKGROUND_COLOR,
                },
              }}
              theme={{
                backgroundColor:            SURFACE_COLOR,
                calendarBackground:         SURFACE_COLOR,
                textSectionTitleColor:      Colors.gray400,
                selectedDayBackgroundColor: ACCENT_COLOR,
                selectedDayTextColor:       BACKGROUND_COLOR,
                todayTextColor:             ACCENT_COLOR,
                dayTextColor:               TEXT_PRIMARY,
                textDisabledColor:          Colors.textTertiary,
                dotColor:                   ACCENT_COLOR,
                selectedDotColor:           BACKGROUND_COLOR,
                arrowColor:                 ACCENT_COLOR,
                monthTextColor:             TEXT_PRIMARY,
                textMonthFontWeight:        "700",
                textDayFontSize:            15,
                textMonthFontSize:          16,
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AddTransactionScreen;