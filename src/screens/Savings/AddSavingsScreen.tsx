// File: src/screens/AddSavingsScreen.tsx - KONSISTEN DENGAN TEMA NAVY BLUE
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import tw from "twrnc";
import { AppHeader } from "../../components/common";

import { useAppContext } from "../../context/AppContext";
import { persistImageAsync, deleteImageFileAsync } from "../../utils/imageStorage";
import {
  formatCurrency,
  safeNumber,
  getCurrentDate,
} from "../../utils/calculations";
import { RootStackParamList } from "../../types";
import { useTheme } from "../../theme/ThemeContext";
import CategoryPickerModal, {
  ALL_SYSTEM_CATEGORIES,
  CategoryItem,
} from "../../components/CategoryPickerModal";

type AddSavingsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddSavings"
>;

type AddSavingsScreenRouteProp = RouteProp<RootStackParamList, "AddSavings">;

const LEGACY_SAVINGS_CATEGORY_MAP: Record<
  string,
  { name: string; icon: string; color: string }
> = {
  emergency: { name: "Dana Darurat", icon: "shield-checkmark-outline", color: "#EF4444" },
  vacation:  { name: "Liburan",      icon: "airplane-outline",         color: "#3B82F6" },
  gadget:    { name: "Gadget",       icon: "phone-portrait-outline",  color: "#8B5CF6" },
  education: { name: "Pendidikan",   icon: "school-outline",          color: "#10B981" },
  house:     { name: "Rumah",        icon: "home-outline",            color: "#F59E0B" },
  car:       { name: "Kendaraan",    icon: "car-outline",             color: "#06B6D4" },
  health:    { name: "Kesehatan",    icon: "medical-outline",         color: "#EC4899" },
  wedding:   { name: "Pernikahan",   icon: "heart-outline",           color: "#F43F5E" },
  other:     { name: "Lainnya",      icon: "wallet-outline",          color: "#94A3B8" },
};

const PRIORITIES = [
  { id: "low" as const, name: "Rendah", icon: "flag" as const },
  { id: "medium" as const, name: "Sedang", icon: "flag" as const },
  { id: "high" as const, name: "Tinggi", icon: "flag" as const },
];

const AddSavingsScreen: React.FC = () => {
  const { colors } = useTheme();
  const PRIMARY_COLOR = colors.primary;
  const ACCENT_COLOR = colors.accent;
  const BACKGROUND_COLOR = colors.background;
  const SURFACE_COLOR = colors.surface;
  const TEXT_PRIMARY = colors.textPrimary;
  const TEXT_SECONDARY = colors.textSecondary;
  const BORDER_COLOR = colors.border;
  const SUCCESS_COLOR = colors.success;
  const WARNING_COLOR = colors.warning;
  const ERROR_COLOR = colors.error;
  const INFO_COLOR = colors.info;
  const PURPLE_COLOR = colors.purple;
  const PINK_COLOR = colors.pink;

  const navigation = useNavigation<AddSavingsScreenNavigationProp>();
  const route = useRoute<AddSavingsScreenRouteProp>();

  const params = route.params || {};
  const isEditMode = params.editMode || false;
  const savingsData = params.savingsData;

  const { addSavings, editSavings, deleteSavings, state } = useAppContext();

  // State utama
  const [name, setName] = useState(savingsData?.name || "");
  const [target, setTarget] = useState(
    savingsData?.target ? safeNumber(savingsData.target).toString() : ""
  );
  const [current, setCurrent] = useState(
    savingsData?.current ? safeNumber(savingsData.current).toString() : "0"
  );
  const [deadline, setDeadline] = useState<string | undefined>(
    savingsData?.deadline
  );

  // Inisialisasi kategori: petakan jika savingsData memakai id legacy (misal "emergency")
  const initialCategory = useMemo(() => {
    if (!savingsData?.category) return "";
    const lower = savingsData.category.toLowerCase();
    if (LEGACY_SAVINGS_CATEGORY_MAP[lower]) {
      return LEGACY_SAVINGS_CATEGORY_MAP[lower].name;
    }
    return savingsData.category;
  }, [savingsData?.category]);

  const [category, setCategory] = useState(initialCategory);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    savingsData?.priority || "medium"
  );
  const [description, setDescription] = useState(
    savingsData?.description || ""
  );
  const [imageCover, setImageCover] = useState(
    savingsData?.imageCover || ""
  );
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [targetError, setTargetError] = useState("");

  // State untuk calendar modal
  const [showCalendar, setShowCalendar] = useState(false);

  // Resolve kategori dari custom categories pengguna & system categories
  const resolvedCategory = useMemo((): CategoryItem | null => {
    const all: CategoryItem[] = [
      ...(state.customCategories || []).map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        isCustom: true as const,
        customId: c.id,
      })),
      ...ALL_SYSTEM_CATEGORIES,
    ];

    if (!category) return null;

    const lower = category.toLowerCase();
    const foundByName = all.find((c) => c.name.toLowerCase() === lower);
    if (foundByName) return foundByName;

    const foundById = all.find((c) => c.id.toLowerCase() === lower);
    if (foundById) return foundById;

    const legacy = LEGACY_SAVINGS_CATEGORY_MAP[lower];
    if (legacy) {
      return {
        id: category,
        name: legacy.name,
        icon: legacy.icon,
        color: legacy.color,
      };
    }

    return null;
  }, [category, state.customCategories]);

  // Validasi nama
  const validateName = (value: string): boolean => {
    setNameError("");

    if (!value.trim()) {
      setNameError("Nama tabungan harus diisi");
      return false;
    }

    if (value.trim().length < 3) {
      setNameError("Nama minimal 3 karakter");
      return false;
    }

    if (value.trim().length > 50) {
      setNameError("Nama maksimal 50 karakter");
      return false;
    }

    return true;
  };

  // Validasi target
  const validateTarget = (value: string): boolean => {
    setTargetError("");

    if (!value.trim()) {
      setTargetError("Target harus diisi");
      return false;
    }

    const targetNum = safeNumber(parseFloat(value.replace(/[^0-9]/g, "")));
    if (isNaN(targetNum) || targetNum <= 0) {
      setTargetError("Target harus angka positif");
      return false;
    }

    if (targetNum > 10000000000) {
      setTargetError("Target terlalu besar (maks: 10M)");
      return false;
    }

    return true;
  };

  // Handle name change
  const handleNameChange = (value: string) => {
    setName(value);
    if (value.trim()) {
      validateName(value);
    } else {
      setNameError("");
    }
  };

  // Handle pick image
  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Izin Ditolak", "Anda perlu memberikan izin akses galeri untuk mengunggah gambar impian.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const rawUri = result.assets[0].uri;
        const permanentUri = await persistImageAsync(rawUri, "savings");
        if (imageCover && imageCover !== permanentUri) {
          await deleteImageFileAsync(imageCover);
        }
        setImageCover(permanentUri);
      }
    } catch (error) {
      Alert.alert("Error", "Gagal membuka galeri");
    }
  };

  // Handle target change


  const handleTargetChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, "");
    setTarget(cleanValue);
    if (cleanValue) {
      validateTarget(cleanValue);
    } else {
      setTargetError("");
    }
  };

  // Handle current change
  const handleCurrentChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, "");
    setCurrent(cleanValue);
  };

  // Format tanggal untuk display
  const formatDisplayDate = (dateStr?: string): string => {
    if (!dateStr) return "Pilih tanggal";

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return dateStr;
    }
  };

  // Handle date select
  const handleDateSelect = (_event: any, selectedDate?: Date) => {
    setShowCalendar(false);
    
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const dayStr = String(selectedDate.getDate()).padStart(2, "0");

      setDeadline(`${year}-${month}-${dayStr}`);
    }
  };

  // Handle delete savings
  const handleDeleteSavings = useCallback(async () => {
    if (!savingsData?.id) {
      Alert.alert("Error", "Data tabungan tidak valid");
      return;
    }

    try {
      await deleteSavings(savingsData.id);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Gagal menghapus tabungan");
    }
  }, [savingsData, deleteSavings, navigation]);

  // Show delete confirmation
  const showDeleteConfirmation = useCallback(() => {
    if (!isEditMode || !savingsData) return;

    Alert.alert(
      "Hapus Tabungan",
      `Apakah Anda yakin ingin menghapus tabungan "${savingsData.name}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: handleDeleteSavings,
        },
      ]
    );
  }, [isEditMode, savingsData, handleDeleteSavings]);

  // Hitung progress
  const calculateProgress = () => {
    const targetNum = safeNumber(parseFloat(target));
    const currentNum = safeNumber(parseFloat(current));

    if (targetNum <= 0) return 0;
    return (currentNum / targetNum) * 100;
  };

  // Format amount display
  const formatAmountDisplay = (value: string) => {
    if (!value) return "";
    const amountNum = safeNumber(parseFloat(value));
    if (isNaN(amountNum)) return value;

    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountNum);
  };

  // Get priority color
  const getPriorityColor = (pri: "low" | "medium" | "high") => {
    switch (pri) {
      case "low":
        return SUCCESS_COLOR;
      case "medium":
        return WARNING_COLOR;
      case "high":
        return ERROR_COLOR;
      default:
        return WARNING_COLOR;
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateName(name)) {
      Alert.alert("Error", nameError || "Nama tidak valid");
      return;
    }

    if (!category.trim()) {
      Alert.alert("Perhatian", "Silakan pilih kategori tabungan terlebih dahulu");
      return;
    }

    if (!validateTarget(target)) {
      Alert.alert("Error", targetError || "Target tidak valid");
      return;
    }

    const targetNum = safeNumber(parseFloat(target));
    const currentNum = safeNumber(parseFloat(current));

    if (currentNum > targetNum) {
      Alert.alert(
        "Perhatian",
        "Jumlah saat ini melebihi target. Apakah Anda yakin?",
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Ya, Simpan",
            onPress: () => saveSavings(targetNum, currentNum),
          },
        ]
      );
      return;
    }

    await saveSavings(targetNum, currentNum);
  };

  const saveSavings = async (targetNum: number, currentNum: number) => {
    setLoading(true);
    try {
      const categoryName = resolvedCategory?.name || category || "Lainnya";
      const categoryIcon = resolvedCategory?.icon || "wallet-outline";

      const savingsDataToSave = {
        name: name.trim(),
        target: targetNum,
        current: currentNum,
        deadline,
        category: categoryName,
        priority: priority || "medium",
        description: description.trim() || "",
        imageCover: imageCover.trim() || undefined,
        icon: categoryIcon,
      };

      if (isEditMode && savingsData) {
        await editSavings(savingsData.id, savingsDataToSave);
        Alert.alert("Sukses", "Tabungan berhasil diperbarui", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        await addSavings(savingsDataToSave);
        Alert.alert("Sukses", "Tabungan berhasil ditambahkan", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message ||
          `Gagal ${isEditMode ? "mengedit" : "menambah"} tabungan`
      );
    } finally {
      setLoading(false);
    }
  };

  // Hitung rekomendasi tabungan bulanan berdasarkan deadline
  const getSmartRecommendation = () => {
    const targetNum = safeNumber(parseFloat(target));
    const currentNum = safeNumber(parseFloat(current));
    const remaining = targetNum - currentNum;

    if (remaining <= 0 || !deadline) return null;

    const deadlineDate = new Date(deadline);
    const today = new Date();
    
    let months = (deadlineDate.getFullYear() - today.getFullYear()) * 12;
    months -= today.getMonth();
    months += deadlineDate.getMonth();
    
    if (months <= 0) {
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        return `Sisa ${diffDays} hari lagi! Yuk nabung Rp ${formatAmountDisplay(remaining.toString())} sekarang agar impianmu tercapai.`;
      }
      return "Waktu pencapaian sudah hampir habis.";
    }

    const perMonth = remaining / months;
    return `Mulai nabung Rp ${formatAmountDisplay(perMonth.toString())} / bulan untuk mencapai targetmu tepat waktu.`;
  };

  const progress = calculateProgress();
  const categoryColor = resolvedCategory?.color || ACCENT_COLOR;
  const priorityColor = getPriorityColor(priority);
  const smartRecommendation = getSmartRecommendation();

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]} edges={['top', 'bottom']}>
      {/* ── Standardized AppHeader ── */}
      <AppHeader
        title={isEditMode ? "Edit Tabungan" : "Tabungan Baru"}
        subtitle={isEditMode ? "Ubah target dan preferensi" : "Tentukan target finansial impianmu"}
        showBack={true}
        rightComponent={
          isEditMode ? (
            <TouchableOpacity
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${ERROR_COLOR}15`,
                borderWidth: 1,
                borderColor: `${ERROR_COLOR}30`,
              }}
              onPress={showDeleteConfirmation}
              activeOpacity={0.7}
              accessibilityLabel="Hapus Tabungan"
            >
              <Ionicons name="trash-outline" size={18} color={ERROR_COLOR} />
            </TouchableOpacity>
          ) : undefined
        }
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={tw`flex-1`}
      >
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={[tw`px-4 pt-4`, { paddingBottom: 60 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Info jika edit mode */}
        {isEditMode && savingsData && (
          <View
            style={[
              tw`rounded-2xl p-4 mb-5`,
              {
                backgroundColor: INFO_COLOR + "10",
                borderWidth: 1,
                borderColor: INFO_COLOR + "30",
              },
            ]}
          >
            <View style={tw`flex-row items-center mb-3`}>
              <Ionicons
                name="information-circle"
                size={16}
                color={INFO_COLOR}
              />
              <Text
                style={[tw`text-sm font-semibold ml-2`, { color: INFO_COLOR }]}
              >
                Informasi Tabungan Saat Ini
              </Text>
            </View>

            <View style={tw`mt-2`}>
              <View style={tw`flex-row justify-between mb-2`}>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  Progress:
                </Text>
                <Text
                  style={[tw`text-xs font-medium`, { color: TEXT_PRIMARY }]}
                >
                  {((savingsData.current / savingsData.target) * 100).toFixed(
                    1
                  )}
                  %
                </Text>
              </View>

              <View style={tw`flex-row justify-between mb-2`}>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  Sisa:
                </Text>
                <Text
                  style={[tw`text-xs font-medium`, { color: TEXT_PRIMARY }]}
                >
                  {formatCurrency(
                    safeNumber(savingsData.target - savingsData.current)
                  )}
                </Text>
              </View>

              <View style={tw`pt-2 border-t border-gray-700`}>
                <Text style={[tw`text-xs`, { color: INFO_COLOR }]}>
                  Dibuat:{" "}
                  {new Date(savingsData.createdAt).toLocaleDateString("id-ID")}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Name Input */}
        <View style={tw`mb-4`}>
          <View style={tw`flex-row items-center justify-between mb-1.5 ml-0.5`}>
            <Text style={[tw`text-[11px] font-bold uppercase tracking-wider`, { color: TEXT_SECONDARY }]}>Nama Tabungan</Text>
            <Text style={[tw`text-[10px]`, { color: nameError ? ERROR_COLOR : colors.gray500 }]}>{name.length}/50</Text>
          </View>
          <View style={[tw`rounded-xl px-4 py-3 border`, { backgroundColor: SURFACE_COLOR, borderColor: nameError ? ERROR_COLOR : `${BORDER_COLOR}80` }]}>
            <TextInput
              style={[tw`text-sm font-semibold`, { color: TEXT_PRIMARY, padding: 0 }]}
              placeholder="Contoh: Dana Liburan ke Bali"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={handleNameChange}
              maxLength={50}
              editable={!loading}
            />
          </View>
          {nameError ? <Text style={[tw`text-[10px] mt-1 ml-1`, { color: ERROR_COLOR }]}>{nameError}</Text> : null}
        </View>

        {/* Quick Target Suggestions */}
        {!target && (
          <View style={tw`mb-4`}>
            <Text style={[tw`text-[11px] font-bold uppercase tracking-wider mb-1.5 ml-0.5`, { color: TEXT_SECONDARY }]}>💡 Target Cepat</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-1`}>
              <View style={tw`flex-row px-1`}>
                {[1000000, 3000000, 5000000, 10000000, 20000000, 50000000].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[tw`rounded-xl px-4 py-2 mr-2 border`, { backgroundColor: SURFACE_COLOR, borderColor: `${BORDER_COLOR}80` }]}
                    onPress={() => setTarget(value.toString())}
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

        {/* Amount Inputs */}
        <View style={tw`mb-4`}>
          {/* Target Input */}
          <Text style={[tw`text-[11px] font-bold uppercase tracking-wider mb-1.5 ml-0.5`, { color: TEXT_SECONDARY }]}>Target Tabungan</Text>
          <View style={[tw`rounded-xl px-4 py-3 mb-4 border`, { backgroundColor: SURFACE_COLOR, borderColor: targetError ? ERROR_COLOR : `${BORDER_COLOR}80`, minHeight: 56 }]}>
            <View style={tw`flex-row items-center`}>
              <Text style={[tw`text-lg font-bold mr-2`, { color: TEXT_SECONDARY }]}>Rp</Text>
              <TextInput
                style={[tw`flex-1 text-[22px] font-extrabold`, { color: TEXT_PRIMARY, padding: 0 }]}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                value={target}
                onChangeText={handleTargetChange}
                keyboardType="numeric"
                returnKeyType="done"
                maxLength={15}
                editable={!loading}
              />
            </View>
            {target && !targetError && (
              <View style={tw`mt-2 pt-2 border-t border-gray-700`}>
                <Text style={[tw`text-[10px] font-medium`, { color: TEXT_SECONDARY }]}>{formatAmountDisplay(target)}</Text>
              </View>
            )}
            {targetError && <Text style={[tw`text-[10px] mt-1`, { color: ERROR_COLOR }]}>{targetError}</Text>}
          </View>

          {/* Current Amount Input */}
          <Text style={[tw`text-[11px] font-bold uppercase tracking-wider mb-1.5 ml-0.5`, { color: TEXT_SECONDARY }]}>Jumlah Saat Ini</Text>
          <View style={[tw`rounded-xl px-4 py-3 border`, { backgroundColor: SURFACE_COLOR, borderColor: `${BORDER_COLOR}80`, minHeight: 56 }]}>
            <View style={tw`flex-row items-center`}>
              <Text style={[tw`text-lg font-bold mr-2`, { color: TEXT_SECONDARY }]}>Rp</Text>
              <TextInput
                style={[tw`flex-1 text-[22px] font-extrabold`, { color: TEXT_PRIMARY, padding: 0 }]}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                value={current}
                onChangeText={handleCurrentChange}
                keyboardType="numeric"
                returnKeyType="done"
                maxLength={15}
                editable={!loading}
              />
            </View>
            {current && (
              <View style={tw`mt-2 pt-2 border-t border-gray-700`}>
                <Text style={[tw`text-[10px] font-medium`, { color: TEXT_SECONDARY }]}>{formatAmountDisplay(current)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Progress Preview */}
        {target && safeNumber(parseFloat(target)) > 0 && (
          <View
            style={[
              tw`rounded-2xl p-4 mb-5`,
              {
                backgroundColor: INFO_COLOR + "10",
                borderWidth: 1,
                borderColor: INFO_COLOR + "30",
              },
            ]}
          >
            <View style={tw`flex-row items-center mb-3`}>
              <Ionicons name="stats-chart" size={16} color={INFO_COLOR} />
              <Text
                style={[tw`text-sm font-semibold ml-2`, { color: INFO_COLOR }]}
              >
                Progress Saat Ini
              </Text>
            </View>

            <View style={tw`mb-3`}>
              <View style={tw`flex-row justify-between mb-2`}>
                <Text
                  style={[tw`text-sm font-medium`, { color: TEXT_PRIMARY }]}
                >
                  {progress.toFixed(1)}%
                </Text>
                <Text
                  style={[tw`text-sm font-medium`, { color: TEXT_PRIMARY }]}
                >
                  {formatCurrency(safeNumber(parseFloat(current)))} /{" "}
                  {formatCurrency(safeNumber(parseFloat(target)))}
                </Text>
              </View>

              {/* Progress Bar */}
              <View
                style={[
                  tw`h-2 rounded-full overflow-hidden`,
                  { backgroundColor: colors.surfaceLight },
                ]}
              >
                <View
                  style={{
                    height: "100%",
                    borderRadius: 9999,
                    backgroundColor:
                      progress >= 100 ? SUCCESS_COLOR : ACCENT_COLOR,
                    width: `${Math.min(progress, 100)}%`,
                  }}
                />
              </View>
            </View>

            <Text style={[tw`text-xs`, { color: INFO_COLOR }]}>
              Sisa:{" "}
              {formatCurrency(
                safeNumber(parseFloat(target)) - safeNumber(parseFloat(current))
              )}
            </Text>
          </View>
        )}

        {/* Category Selection */}
        <View style={tw`mb-4`}>
          <View style={tw`flex-row items-center justify-between mb-1.5 ml-0.5`}>
            <Text style={[tw`text-[11px] font-bold uppercase tracking-wider`, { color: TEXT_SECONDARY }]}>
              Kategori Tabungan
            </Text>
            {category ? (
              <Text style={[tw`text-[11px] font-bold`, { color: ACCENT_COLOR }]}>
                ✓ Terpilih
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={() => setShowCategoryPicker(true)}
            disabled={loading}
            style={[
              tw`rounded-xl px-4 py-3 flex-row items-center border`,
              { backgroundColor: SURFACE_COLOR, borderColor: `${BORDER_COLOR}80`, minHeight: 48 },
            ]}
          >
            {resolvedCategory ? (
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: `${resolvedCategory.color}20`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Ionicons
                  name={resolvedCategory.icon as any}
                  size={16}
                  color={resolvedCategory.color}
                />
              </View>
            ) : (
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: `${ACCENT_COLOR}12`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Ionicons name="grid-outline" size={16} color={ACCENT_COLOR} />
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: category ? TEXT_PRIMARY : colors.textTertiary,
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                {category ? (resolvedCategory?.name || category) : "Pilih kategori tabungan..."}
              </Text>
              {resolvedCategory?.isCustom && (
                <Text style={{ color: ACCENT_COLOR, fontSize: 10, marginTop: 1 }}>
                  Kategori Kustom
                </Text>
              )}
            </View>

            <Ionicons name="chevron-forward" size={16} color={colors.gray500} />
          </TouchableOpacity>

          <CategoryPickerModal
            visible={showCategoryPicker}
            onClose={() => setShowCategoryPicker(false)}
            onSelect={(catName) => setCategory(catName)}
            selectedName={category}
          />
        </View>

        {/* Priority Selection */}
        <View style={tw`mb-4`}>
          <Text style={[tw`text-[11px] font-bold uppercase tracking-wider mb-1.5 ml-0.5`, { color: TEXT_SECONDARY }]}>
            Prioritas
          </Text>
          <View style={tw`flex-row gap-3`}>
            {PRIORITIES.map((p) => {
              const isSelected = priority === p.id;
              const priColor = getPriorityColor(p.id);

              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    tw`flex-1 rounded-xl px-3 py-3 border`,
                    isSelected
                      ? { backgroundColor: priColor + "15", borderColor: priColor }
                      : { backgroundColor: SURFACE_COLOR, borderColor: `${BORDER_COLOR}80` },
                  ]}
                  onPress={() => setPriority(p.id)}
                  disabled={loading}
                >
                  <View style={tw`items-center`}>
                    <Ionicons name={p.icon} size={16} color={isSelected ? priColor : TEXT_SECONDARY} />
                    <Text style={[tw`text-[11px] font-bold mt-1`, isSelected ? { color: priColor } : { color: TEXT_SECONDARY }]}>
                      {p.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Deadline Selection */}
        <View style={tw`mb-4`}>
          <Text style={[tw`text-[11px] font-bold uppercase tracking-wider mb-1.5 ml-0.5`, { color: TEXT_SECONDARY }]}>
            Deadline (Opsional)
          </Text>
          <TouchableOpacity
            style={[tw`rounded-xl px-4 py-3 flex-row justify-between items-center border`, { backgroundColor: SURFACE_COLOR, borderColor: `${BORDER_COLOR}80`, minHeight: 48 }]}
            onPress={() => setShowCalendar(true)}
            disabled={loading}
          >
            <View style={tw`flex-1 mr-3`}>
              <Text style={[tw`text-sm font-semibold`, { color: TEXT_PRIMARY }]}>
                {deadline ? formatDisplayDate(deadline) : "Pilih tanggal target"}
              </Text>
            </View>
            <Ionicons name="calendar-outline" size={16} color={colors.gray500} />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={tw`mb-4`}>
          <View style={tw`flex-row items-center justify-between mb-1.5 ml-0.5`}>
            <Text style={[tw`text-[11px] font-bold uppercase tracking-wider`, { color: TEXT_SECONDARY }]}>Catatan (opsional)</Text>
            <Text style={[tw`text-[10px]`, { color: colors.gray500 }]}>{description.length}/200</Text>
          </View>
          <View style={[tw`rounded-xl px-4 py-3 border`, { backgroundColor: SURFACE_COLOR, borderColor: `${BORDER_COLOR}80` }]}>
            <TextInput
              style={[tw`text-sm font-medium min-h-[60px]`, { color: TEXT_PRIMARY, padding: 0 }]}
              placeholder="Tambahkan catatan atau motivasi..."
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              maxLength={200}
              editable={!loading}
            />
          </View>
        </View>

        {/* Image Cover Pick (Poster Style) */}
        <View style={tw`mb-4`}>
          <View style={tw`flex-row items-center justify-between mb-1.5 ml-0.5`}>
            <Text style={[tw`text-[11px] font-bold uppercase tracking-wider`, { color: TEXT_SECONDARY }]}>Gambar Impian (Opsional)</Text>
            <Ionicons name="image-outline" size={12} color={colors.gray500} />
          </View>
          
          {imageCover ? (
            <View style={[tw`rounded-xl overflow-hidden mb-1 relative`, { backgroundColor: SURFACE_COLOR }]}>
              <Image source={{ uri: imageCover }} style={{ width: "100%", height: 160 }} />
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  padding: 8,
                  borderRadius: 20,
                }}
                onPress={() => setImageCover("")}
              >
                <Ionicons name="close" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[tw`rounded-xl px-4 py-5 items-center justify-center border-dashed border-2`, { backgroundColor: SURFACE_COLOR, borderColor: BORDER_COLOR }]}
              onPress={handlePickImage}
              activeOpacity={0.7}
              disabled={loading}
            >
              <View style={[tw`w-12 h-12 rounded-full items-center justify-center mb-3`, { backgroundColor: `${ACCENT_COLOR}15` }]}>
                <Ionicons name="camera" size={24} color={ACCENT_COLOR} />
              </View>
              <Text style={[tw`text-[13px] font-bold mb-1`, { color: TEXT_PRIMARY }]}>Unggah Gambar Impian</Text>
              <Text style={[tw`text-[10px] text-center px-4`, { color: colors.gray400 }]}>Pilih foto barang atau tempat impian Anda dari galeri</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Savings Summary Preview */}
        {name && target && safeNumber(parseFloat(target)) > 0 && (
          <View
            style={[
              tw`rounded-2xl p-4 mb-5`,
              {
                backgroundColor: categoryColor + "10",
                borderWidth: 1,
                borderColor: categoryColor + "30",
              },
            ]}
          >
            <View style={tw`flex-row items-center mb-2`}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={categoryColor}
              />
              <Text
                style={[
                  tw`text-xs font-semibold ml-2`,
                  { color: categoryColor },
                ]}
              >
                Preview Tabungan
              </Text>
            </View>
            <Text style={[tw`text-sm`, { color: TEXT_PRIMARY }]}>
              Tabungan <Text style={tw`font-bold`}>{name}</Text> dengan target{" "}
              <Text style={tw`font-bold`}>
                Rp {formatAmountDisplay(target)}
              </Text>{" "}
              untuk kategori{" "}
              <Text style={tw`font-bold`}>
                {resolvedCategory?.name || category || "Lainnya"}
              </Text>
              {description
                ? ` - ${description.substring(0, 30)}${
                    description.length > 30 ? "..." : ""
                  }`
                : ""}
            </Text>

            {smartRecommendation && (
              <View style={[tw`mt-3 pt-3`, { borderTopWidth: 1, borderTopColor: `${categoryColor}30` }]}>
                <View style={tw`flex-row items-start`}>
                  <Ionicons name="bulb" size={14} color={categoryColor} style={tw`mt-0.5 mr-2`} />
                  <Text style={[tw`text-[12px] font-bold flex-1`, { color: categoryColor, lineHeight: 18 }]}>
                    {smartRecommendation}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Tips */}
        <View style={[tw`rounded-xl p-4 mb-4`, { backgroundColor: INFO_COLOR + "10" }]}>
          <View style={tw`flex-row items-center mb-2`}>
            <Ionicons name="bulb-outline" size={14} color={INFO_COLOR} />
            <Text style={[tw`text-[11px] font-bold uppercase tracking-widest ml-1`, { color: INFO_COLOR }]}>Tips Menabung</Text>
          </View>

          <Text style={[tw`text-[11px] mb-1`, { color: INFO_COLOR }]}><Text style={tw`font-bold`}>Dana Darurat</Text>: 3-6 bln</Text>
          <Text style={[tw`text-[11px] mb-1`, { color: INFO_COLOR }]}><Text style={tw`font-bold`}>50/30/20 Rule</Text>: 50% Butuh, 30% Ingin, 20% Tabung</Text>
          <Text style={[tw`text-[11px] mb-1`, { color: INFO_COLOR }]}><Text style={tw`font-bold`}>Pay Yourself First</Text>: Sisihkan awal bln</Text>
          <Text style={[tw`text-[11px]`, { color: INFO_COLOR }]}><Text style={tw`font-bold`}>Automate</Text>: Set autodebit</Text>
        </View>

        {/* Action Buttons */}
        <View style={tw`flex-row gap-3 mt-4`}>
          <TouchableOpacity
            style={[tw`flex-1 rounded-xl py-3.5 items-center border`, { backgroundColor: SURFACE_COLOR, borderColor: `${BORDER_COLOR}80` }]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={[tw`text-sm font-bold`, { color: TEXT_PRIMARY }]}>Batal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[tw`flex-1 rounded-xl py-3.5 items-center shadow-sm`, { backgroundColor: ACCENT_COLOR, opacity: (!name || !target || loading) ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={!name || !target || loading}
          >
            <Text style={tw`text-white text-sm font-bold`}>
              {loading ? "Menyimpan..." : isEditMode ? "Simpan" : "Tambah"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* DateTime Picker Modal */}
      {showCalendar && (
        <DateTimePicker
          value={deadline ? new Date(deadline) : new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onValueChange={handleDateSelect}
          onDismiss={() => setShowCalendar(false)}
        />
      )}
    </SafeAreaView>
  );
};

export default AddSavingsScreen;
