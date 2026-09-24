// File: src/screens/Recurring/AddRecurringTransactionScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useAppContext } from "../../context/AppContext";
import { RecurringTransaction, RootStackParamList } from "../../types";
import { useTheme } from "../../theme/ThemeContext";
import { AppHeader } from "../../components/common";
import CategoryPickerModal from "../../components/CategoryPickerModal";
import {
  calculateInitialRunDate,
  formatDisplayDate,
  DAYS_OF_WEEK,
} from "../../utils/recurring";

type AddRecurringRouteProp = RouteProp<RootStackParamList, "AddRecurringTransaction">;

export const AddRecurringTransactionScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<AddRecurringRouteProp>();
  const {
    state,
    addRecurringTransaction,
    editRecurringTransaction,
    deleteRecurringTransaction,
  } = useAppContext();

  const isEditMode = route.params?.editMode || false;
  const editingItem = route.params?.recurringData;

  const wallets = state.wallets || [];
  const defaultWallet = wallets.find((w) => w.isDefault) || wallets[0];

  // Form states
  const [formType, setFormType] = useState<"income" | "expense">(
    editingItem?.type === "transfer" ? "expense" : (editingItem?.type || "expense")
  );
  const [formAmount, setFormAmount] = useState(
    editingItem?.amount ? String(editingItem.amount) : ""
  );
  const [formCategory, setFormCategory] = useState(
    editingItem?.category || (editingItem?.type === "income" ? "Uang Bulanan" : "Tagihan")
  );
  const [formFrequency, setFormFrequency] = useState<"weekly" | "monthly" | "custom_days">(
    editingItem?.frequency || "monthly"
  );
  const [formDayOfWeek, setFormDayOfWeek] = useState<number>(editingItem?.dayOfWeek || 1);
  const [formDayOfMonth, setFormDayOfMonth] = useState<number>(editingItem?.dayOfMonth || 1);
  const [formIntervalDays, setFormIntervalDays] = useState<string>(
    String(editingItem?.intervalDays || 7)
  );
  const [formStartDate, setFormStartDate] = useState(
    editingItem?.startDate || new Date().toISOString().split("T")[0]
  );
  // Display version of start date for text input (DD/MM/YYYY)
  const toDisplay = (iso: string) => {
    const parts = iso.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return iso;
  };
  const toIso = (display: string): string | null => {
    // Accept DD/MM/YYYY or YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(display)) return display;
    const m = display.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    return null;
  };
  const [startDateInput, setStartDateInput] = useState(toDisplay(editingItem?.startDate || new Date().toISOString().split("T")[0]));
  const [startDateError, setStartDateError] = useState("");
  const [formAutoCycle, setFormAutoCycle] = useState<boolean>(
    editingItem?.autoStartNewCycle ?? true
  );

  const initialCyclePreset = (): "weekly" | "biweekly" | "monthly" | "custom" => {
    if (!editingItem) return "monthly";
    const days = editingItem.cyclePeriodDays || (editingItem.frequency === "weekly" ? 7 : 30);
    if (days === 7) return "weekly";
    if (days === 14) return "biweekly";
    if (days === 30) return "monthly";
    return "custom";
  };

  const [cyclePreset, setCyclePreset] = useState<"weekly" | "biweekly" | "monthly" | "custom">(
    initialCyclePreset()
  );
  const [customDays, setCustomDays] = useState(
    editingItem?.cyclePeriodDays ? String(editingItem.cyclePeriodDays) : "14"
  );
  const [formWalletId, setFormWalletId] = useState(
    editingItem?.walletId || defaultWallet?.id || ""
  );
  const [formDescription, setFormDescription] = useState(
    editingItem?.description || (editingItem && editingItem.name !== editingItem.category ? editingItem.name : "")
  );

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Live execution date calculation
  const previewFirstRunDateStr = useMemo(() => {
    try {
      return calculateInitialRunDate(
        formFrequency,
        formStartDate,
        formFrequency === "weekly" ? formDayOfWeek : undefined,
        formFrequency === "monthly" ? formDayOfMonth : undefined
      );
    } catch {
      return formStartDate;
    }
  }, [formFrequency, formDayOfWeek, formDayOfMonth, formStartDate]);

  const isFirstRunToday = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return previewFirstRunDateStr === today;
  }, [previewFirstRunDateStr]);

  const handleSave = async () => {
    if (!formCategory.trim()) {
      Alert.alert("Perhatian", "Silakan pilih atau buat kategori terlebih dahulu");
      return;
    }

    const numAmount = parseFloat(formAmount.replace(/\D/g, ""));
    if (!numAmount || numAmount <= 0) {
      Alert.alert("Perhatian", "Silakan masukkan nominal yang valid");
      return;
    }

    const effectiveName = formDescription.trim() || formCategory;

    let cycleDaysVal: number | undefined = undefined;
    if (formType === "income" && formAutoCycle) {
      if (cyclePreset === "weekly") cycleDaysVal = 7;
      else if (cyclePreset === "biweekly") cycleDaysVal = 14;
      else if (cyclePreset === "monthly") cycleDaysVal = 30;
      else cycleDaysVal = Math.max(1, parseInt(customDays, 10) || 7);
    }

    const intervalDaysVal =
      formFrequency === "custom_days"
        ? Math.max(1, parseInt(formIntervalDays, 10) || 7)
        : undefined;

    setLoading(true);
    try {
      if (isEditMode && editingItem) {
        await editRecurringTransaction(editingItem.id, {
          name: effectiveName,
          amount: numAmount,
          type: formType,
          category: formCategory,
          frequency: formFrequency,
          dayOfWeek: formFrequency === "weekly" ? formDayOfWeek : undefined,
          dayOfMonth: formFrequency === "monthly" ? formDayOfMonth : undefined,
          intervalDays: intervalDaysVal,
          startDate: formStartDate,
          autoStartNewCycle: formType === "income" ? formAutoCycle : undefined,
          cyclePeriodDays: cycleDaysVal,
          description: formDescription.trim(),
          walletId: formWalletId || defaultWallet?.id,
        });
      } else {
        await addRecurringTransaction({
          name: effectiveName,
          amount: numAmount,
          type: formType,
          category: formCategory,
          frequency: formFrequency,
          dayOfWeek: formFrequency === "weekly" ? formDayOfWeek : undefined,
          dayOfMonth: formFrequency === "monthly" ? formDayOfMonth : undefined,
          intervalDays: intervalDaysVal,
          startDate: formStartDate,
          autoStartNewCycle: formType === "income" ? formAutoCycle : undefined,
          cyclePeriodDays: cycleDaysVal,
          description: formDescription.trim(),
          isActive: true,
          walletId: formWalletId || defaultWallet?.id,
        });
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Gagal Menyimpan", err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!editingItem) return;
    Alert.alert(
      "Hapus Transaksi Rutin",
      `Hapus jadwal rutin "${editingItem.name}"?\n\nTransaksi yang sudah dicatat sebelumnya tidak akan terpengaruh.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRecurringTransaction(editingItem.id);
              navigation.goBack();
            } catch {
              Alert.alert("Error", "Gagal menghapus jadwal");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Standard AppHeader ── */}
      <AppHeader
        title={isEditMode ? "Ubah Transaksi Rutin" : "Tambah Transaksi Rutin"}
        subtitle="Tentukan jadwal otomatis dan frekuensi"
        showBack={true}
        rightComponent={
          isEditMode ? (
            <TouchableOpacity
              onPress={handleDelete}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${colors.error}15`,
                borderWidth: 1,
                borderColor: `${colors.error}30`,
              }}
              disabled={loading}
              accessibilityLabel="Hapus Jadwal"
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 48 }}
        >
          {/* Type Switcher */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 4,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: `${colors.border}80`,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setFormType("income");
                if (formCategory === "Makanan" || formCategory === "Transportasi") {
                  setFormCategory("Uang Bulanan");
                }
              }}
              activeOpacity={0.7}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: "center",
                borderRadius: 9,
                backgroundColor: formType === "income" ? colors.success : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: formType === "income" ? "#FFFFFF" : colors.gray400,
                }}
              >
                Pemasukan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setFormType("expense");
                if (
                  formCategory === "Uang Bulanan" ||
                  formCategory === "Pemasukan Rutin" ||
                  formCategory === "Investasi" ||
                  formCategory === "Gaji"
                ) {
                  setFormCategory("Tagihan");
                }
              }}
              activeOpacity={0.7}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: "center",
                borderRadius: 9,
                backgroundColor: formType === "expense" ? colors.error : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: formType === "expense" ? "#FFFFFF" : colors.gray400,
                }}
              >
                Pengeluaran
              </Text>
            </TouchableOpacity>
          </View>

          {/* Nominal */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>
              NOMINAL (RP)
            </Text>
            <TextInput
              value={
                formAmount
                  ? `Rp ${parseInt(formAmount.replace(/\D/g, ""), 10).toLocaleString("id-ID")}`
                  : ""
              }
              onChangeText={(t) => setFormAmount(t.replace(/\D/g, ""))}
              keyboardType="numeric"
              placeholder="Rp 0"
              placeholderTextColor={colors.gray500}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: formType === "income" ? colors.success : colors.error,
                fontSize: 18,
                fontWeight: "800",
                borderWidth: 1,
                borderColor: `${colors.border}80`,
              }}
            />
          </View>

          {/* Kategori Selector */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>
              KATEGORI
            </Text>
            <TouchableOpacity
              onPress={() => setShowCategoryPicker(true)}
              activeOpacity={0.7}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 13,
                borderWidth: 1,
                borderColor: `${colors.border}80`,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  color: formCategory ? colors.textPrimary : colors.gray500,
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                {formCategory || "Pilih Kategori..."}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
            </TouchableOpacity>
          </View>

          {/* Dompet / Rekening Selector */}
          {wallets.length > 0 && (
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>
                DOMPET / REKENING EKSEKUSI
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {wallets.map((w) => {
                    const isSelected = formWalletId === w.id;
                    return (
                      <TouchableOpacity
                        key={w.id}
                        onPress={() => setFormWalletId(w.id)}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 12,
                          paddingVertical: 9,
                          borderRadius: 12,
                          backgroundColor: isSelected ? `${colors.accent}20` : colors.surface,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.accent : `${colors.border}80`,
                        }}
                      >
                        <Ionicons
                          name={(w.icon as any) || "card-outline"}
                          size={14}
                          color={isSelected ? colors.accent : colors.gray400}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={{
                            color: isSelected ? colors.accent : colors.textPrimary,
                            fontSize: 12,
                            fontWeight: "700",
                          }}
                        >
                          {w.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Frekuensi Selector */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>
              FREKUENSI EKSEKUSI
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[
                { id: "monthly" as const, label: "Bulanan" },
                { id: "weekly" as const, label: "Mingguan" },
                { id: "custom_days" as const, label: "X Hari Sekali" },
              ].map((freq) => {
                const isSelected = formFrequency === freq.id;
                return (
                  <TouchableOpacity
                    key={freq.id}
                    onPress={() => setFormFrequency(freq.id)}
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      alignItems: "center",
                      borderRadius: 12,
                      backgroundColor: isSelected ? `${colors.accent}20` : colors.surface,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.accent : `${colors.border}80`,
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? colors.accent : colors.textPrimary,
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      {freq.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Conditional Schedule Options */}
          {formFrequency === "weekly" && (
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>
                HARI EKSEKUSI SETIAP MINGGU
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {DAYS_OF_WEEK.map((d: { id: number; name: string }) => {
                    const isSelected = formDayOfWeek === d.id;
                    return (
                      <TouchableOpacity
                        key={d.id}
                        onPress={() => setFormDayOfWeek(d.id)}
                        activeOpacity={0.7}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 10,
                          backgroundColor: isSelected ? colors.accent : colors.surface,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.accent : `${colors.border}80`,
                        }}
                      >
                        <Text
                          style={{
                            color: isSelected ? "#FFFFFF" : colors.textPrimary,
                            fontSize: 12,
                            fontWeight: "700",
                          }}
                        >
                          {d.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}

          {formFrequency === "monthly" && (
            <View style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "700" }}>
                  TANGGAL SETIAP BULAN (1 - 31)
                </Text>
                {state.paydayCutoff && state.paydayCutoff > 1 && (
                  <TouchableOpacity
                    onPress={() => setFormDayOfMonth(state.paydayCutoff!)}
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: `${colors.accent}15`,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: colors.accent, fontSize: 10, fontWeight: "700" }}>
                      Awal Pembukuan (Tgl {state.paydayCutoff})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  padding: 8,
                  borderWidth: 1,
                  borderColor: `${colors.border}80`,
                  marginBottom: 8,
                }}
              >
                <TouchableOpacity
                  onPress={() => setFormDayOfMonth((prev) => Math.max(1, (prev || 1) - 1))}
                  activeOpacity={0.7}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: colors.background,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: `${colors.border}80`,
                  }}
                >
                  <Ionicons name="remove" size={18} color={colors.textPrimary} />
                </TouchableOpacity>

                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "800" }}>
                  Tanggal {formDayOfMonth || 1} setiap bulan
                </Text>

                <TouchableOpacity
                  onPress={() => setFormDayOfMonth((prev) => Math.min(31, (prev || 1) + 1))}
                  activeOpacity={0.7}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: colors.background,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: `${colors.border}80`,
                  }}
                >
                  <Ionicons name="add" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {Array.from(new Set([1, 5, 10, 15, 20, state.paydayCutoff || 25, 28, 30]))
                    .sort((a, b) => a - b)
                    .map((dayNum) => {
                      const isSelected = formDayOfMonth === dayNum;
                      return (
                        <TouchableOpacity
                          key={dayNum}
                          onPress={() => setFormDayOfMonth(dayNum)}
                          activeOpacity={0.7}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 10,
                            backgroundColor: isSelected ? colors.accent : colors.surface,
                            borderWidth: 1,
                            borderColor: isSelected ? colors.accent : `${colors.border}80`,
                          }}
                        >
                          <Text
                            style={{
                              color: isSelected ? "#FFFFFF" : colors.gray400,
                              fontSize: 12,
                              fontWeight: "700",
                            }}
                          >
                            Tgl {dayNum}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              </ScrollView>
            </View>
          )}

          {formFrequency === "custom_days" && (
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>
                INTERVAL HARI EKSEKUSI
              </Text>
              <TextInput
                value={formIntervalDays}
                onChangeText={(t) => setFormIntervalDays(t.replace(/\D/g, ""))}
                keyboardType="numeric"
                placeholder="Contoh: 14"
                placeholderTextColor={colors.gray500}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  color: colors.textPrimary,
                  fontSize: 14,
                  fontWeight: "700",
                  borderWidth: 1,
                  borderColor: `${colors.border}80`,
                }}
              />
            </View>
          )}

          {/* Mulai Dari Tanggal */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>
              MULAI DARI TANGGAL
            </Text>
            <TextInput
              value={startDateInput}
              onChangeText={(t) => {
                setStartDateInput(t);
                const iso = toIso(t);
                if (iso) {
                  setFormStartDate(iso);
                  setStartDateError("");
                } else if (t.length >= 8) {
                  setStartDateError("Format: DD/MM/YYYY (contoh: 26/01/2025)");
                } else {
                  setStartDateError("");
                }
              }}
              keyboardType="numeric"
              placeholder="DD/MM/YYYY — Kapan mulai?"
              placeholderTextColor={colors.gray500}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: colors.textPrimary,
                fontSize: 14,
                fontWeight: "600",
                borderWidth: 1,
                borderColor: startDateError ? `${colors.error}80` : `${colors.border}80`,
              }}
            />
            {startDateError ? (
              <Text style={{ color: colors.error, fontSize: 11, marginTop: 4, marginLeft: 4 }}>
                {startDateError}
              </Text>
            ) : (
              <Text style={{ color: colors.gray500, fontSize: 11, marginTop: 4, marginLeft: 4 }}>
                Tanggal kapan jadwal rutin ini pertama kali aktif / dimulai.
              </Text>
            )}
          </View>

          {/* Khusus Pemasukan: Target Uang Bertahan Otomatis (Batas Hari) */}
          {formType === "income" && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: `${colors.accent}40`,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "700" }}>
                    Target Bertahan Otomatis (Batas Siklus)
                  </Text>
                  <Text style={{ color: colors.gray400, fontSize: 11, marginTop: 2, lineHeight: 16 }}>
                    Otomatis atur batas hari uang bertahan & jatah belanja harian di Beranda setiap pemasukan ini tercatat.
                  </Text>
                </View>
                <Switch
                  value={formAutoCycle}
                  onValueChange={setFormAutoCycle}
                  trackColor={{
                    false: colors.surfaceLight || "#334155",
                    true: `${colors.accent}70`,
                  }}
                  thumbColor={formAutoCycle ? colors.accent : "#94A3B8"}
                />
              </View>

              {formAutoCycle && (
                <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: `${colors.border}50` }}>
                  <Text style={{ color: colors.gray400, fontSize: 10, fontWeight: "700", marginBottom: 6 }}>
                    TARGET BERTAHAN (HARI):
                  </Text>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {[
                      { id: "weekly", label: "7 hr" },
                      { id: "biweekly", label: "14 hr" },
                      { id: "monthly", label: "30 hr" },
                      { id: "custom", label: "Kustom" },
                    ].map((p) => {
                      const isSelected = cyclePreset === p.id;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={{
                            flex: 1,
                            paddingVertical: 8,
                            alignItems: "center",
                            borderRadius: 10,
                            backgroundColor: isSelected ? `${colors.accent}20` : colors.background,
                            borderWidth: 1,
                            borderColor: isSelected ? colors.accent : `${colors.border}60`,
                          }}
                          onPress={() => setCyclePreset(p.id as any)}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "700",
                              color: isSelected ? colors.accent : colors.gray400,
                            }}
                          >
                            {p.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {cyclePreset === "custom" && (
                    <View
                      style={{
                        marginTop: 10,
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: colors.background,
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        paddingVertical: 4,
                        borderWidth: 1,
                        borderColor: `${colors.border}80`,
                      }}
                    >
                      <TextInput
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          fontSize: 14,
                          fontWeight: "600",
                          color: colors.textPrimary,
                        }}
                        value={customDays}
                        onChangeText={(t) => setCustomDays(t.replace(/\D/g, ""))}
                        keyboardType="number-pad"
                        placeholder="Berapa hari? Contoh: 15"
                        placeholderTextColor={colors.gray500}
                        maxLength={3}
                      />
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.gray400 }}>
                        Hari
                      </Text>
                    </View>
                  )}

                  {/* Live Simulation Preview */}
                  {(() => {
                    const cleanAmount = parseFloat(formAmount.replace(/\D/g, ""));
                    const days =
                      cyclePreset === "weekly"
                        ? 7
                        : cyclePreset === "biweekly"
                        ? 14
                        : cyclePreset === "monthly"
                        ? 30
                        : Math.max(1, parseInt(customDays, 10) || 7);
                    if (cleanAmount > 0) {
                      const dailyRate = Math.round(cleanAmount / days);
                      return (
                        <View
                          style={{
                            marginTop: 10,
                            padding: 10,
                            borderRadius: 12,
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: `${colors.accent}12`,
                            borderWidth: 1,
                            borderColor: `${colors.accent}30`,
                          }}
                        >
                          <Ionicons
                            name="speedometer-outline"
                            size={16}
                            color={colors.accent}
                            style={{ marginRight: 8 }}
                          />
                          <Text style={{ color: colors.textPrimary, fontSize: 11, flex: 1, lineHeight: 16 }}>
                            Simulasi jatah:{" "}
                            <Text style={{ fontWeight: "700", color: colors.accent }}>
                              Rp {dailyRate.toLocaleString("id-ID")}
                            </Text>{" "}
                            / hari selama{" "}
                            <Text style={{ fontWeight: "700" }}>{days} hari</Text>
                          </Text>
                        </View>
                      );
                    }
                    return null;
                  })()}
                </View>
              )}
            </View>
          )}

          {/* Catatan / Keterangan */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: colors.gray400, fontSize: 11, fontWeight: "700", marginBottom: 6 }}>
              CATATAN / KETERANGAN (OPSIONAL)
            </Text>
            <TextInput
              value={formDescription}
              onChangeText={setFormDescription}
              placeholder={
                formType === "income"
                  ? "Contoh: Gaji Kantor, Honor Project, dll."
                  : "Contoh: Netflix, Kost Kamar 12, dll."
              }
              placeholderTextColor={colors.gray500}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: colors.textPrimary,
                fontSize: 14,
                borderWidth: 1,
                borderColor: `${colors.border}80`,
              }}
            />
          </View>

          {/* Pratinjau Jadwal */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: isFirstRunToday ? `${colors.accent}60` : `${colors.border}80`,
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={colors.accent}
                style={{ marginRight: 6 }}
              />
              <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: "700" }}>
                Pratinjau Jadwal Eksekusi
              </Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ color: colors.gray400, fontSize: 11 }}>Pencatatan Pertama:</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 11, fontWeight: "700" }}>
                {formatDisplayDate(previewFirstRunDateStr)}
              </Text>
            </View>

            {isFirstRunToday && (
              <View
                style={{
                  backgroundColor: `${colors.accent}15`,
                  padding: 8,
                  borderRadius: 8,
                  marginTop: 6,
                }}
              >
                <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "600" }}>
                  ⚡ Eksekusi pertama dijadwalkan HARI INI saat jadwal dibuat.
                </Text>
              </View>
            )}
          </View>

          {/* Tombol Aksi */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: `${colors.border}80`,
              }}
            >
              <Text style={{ color: colors.gray400, fontSize: 14, fontWeight: "700" }}>
                Batal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
              style={{
                flex: 2,
                backgroundColor: colors.accent,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>
                {loading
                  ? "Menyimpan..."
                  : isEditMode
                  ? "Simpan Perubahan"
                  : "Buat Jadwal Rutin"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* CategoryPickerModal */}
      <CategoryPickerModal
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        onSelect={(name) => setFormCategory(name)}
        selectedName={formCategory}
      />
    </SafeAreaView>
  );
};

export default AddRecurringTransactionScreen;
