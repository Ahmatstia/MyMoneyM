// File: src/screens/AddSavingsScreen.tsx - KONSISTEN DENGAN TEMA NAVY BLUE
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import {
  formatCurrency,
  safeNumber,
  getCurrentDate,
} from "../../utils/calculations";
import { RootStackParamList } from "../../types";
import { Colors } from "../../theme/theme";

type AddSavingsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddSavings"
>;

type AddSavingsScreenRouteProp = RouteProp<RootStackParamList, "AddSavings">;

// WARNA KONSISTEN
const PRIMARY_COLOR = Colors.primary;
const ACCENT_COLOR = Colors.accent;
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR = Colors.surface;
const TEXT_PRIMARY = Colors.textPrimary;
const TEXT_SECONDARY = Colors.textSecondary;
const BORDER_COLOR = Colors.border;
const SUCCESS_COLOR = Colors.success;
const WARNING_COLOR = Colors.warning;
const ERROR_COLOR = Colors.error;
const INFO_COLOR = Colors.info;
const PURPLE_COLOR = Colors.purple;
const PINK_COLOR = Colors.pink;

const CATEGORIES = [
  { id: "emergency", name: "Dana Darurat", icon: "shield" as const },
  { id: "vacation", name: "Liburan", icon: "airplane" as const },
  { id: "gadget", name: "Gadget", icon: "phone-portrait" as const },
  { id: "education", name: "Pendidikan", icon: "school" as const },
  { id: "house", name: "Rumah", icon: "home" as const },
  { id: "car", name: "Mobil", icon: "car" as const },
  { id: "health", name: "Kesehatan", icon: "medical" as const },
  { id: "wedding", name: "Pernikahan", icon: "heart" as const },
  { id: "other", name: "Lainnya", icon: "wallet" as const },
];

const PRIORITIES = [
  { id: "low" as const, name: "Rendah", icon: "flag" as const },
  { id: "medium" as const, name: "Sedang", icon: "flag" as const },
  { id: "high" as const, name: "Tinggi", icon: "flag" as const },
];

const AddSavingsScreen: React.FC = () => {
  const navigation = useNavigation<AddSavingsScreenNavigationProp>();
  const route = useRoute<AddSavingsScreenRouteProp>();

  const params = route.params || {};
  const isEditMode = params.editMode || false;
  const savingsData = params.savingsData;

  const { addSavings, editSavings, deleteSavings } = useAppContext();

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
  const [category, setCategory] = useState(savingsData?.category || "other");
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageCover(result.assets[0].uri);
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
  const handleDateSelect = (event: any, selectedDate?: Date) => {
    // Pada Android, ketika dialog ditutup (cancel), event.type akan "dismissed"
    if (event.type === "dismissed") {
      setShowCalendar(false);
      return;
    }
    
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

  // Get category color
  const getCategoryColor = (catId: string) => {
    switch (catId) {
      case "emergency":
        return ERROR_COLOR;
      case "vacation":
        return INFO_COLOR;
      case "gadget":
        return PURPLE_COLOR;
      case "education":
        return SUCCESS_COLOR;
      case "house":
        return WARNING_COLOR;
      case "car":
        return ACCENT_COLOR;
      case "health":
        return PINK_COLOR;
      case "wedding":
        return ERROR_COLOR + "CC";
      default:
        return Colors.textTertiary;
    }
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
      const selectedCategory = CATEGORIES.find((c) => c.id === category);

      const savingsDataToSave = {
        name: name.trim(),
        target: targetNum,
        current: currentNum,
        deadline,
        category: category || "other",
        priority: priority || "medium",
        description: description.trim() || "",
        imageCover: imageCover.trim() || undefined,
        icon: selectedCategory?.icon || "wallet",
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
  const categoryColor = getCategoryColor(category);
  const priorityColor = getPriorityColor(priority);
  const smartRecommendation = getSmartRecommendation();

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-4 pt-4 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${ACCENT_COLOR}15`,
                marginRight: 12,
              }}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color={ACCENT_COLOR} />
            </TouchableOpacity>
            <Text
              style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: "700" }}
            >
              {isEditMode ? "Edit Tabungan" : "Tabungan Baru"}
            </Text>
          </View>

          {isEditMode && (
            <TouchableOpacity
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${ERROR_COLOR}15`,
              }}
              onPress={showDeleteConfirmation}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={ERROR_COLOR} />
            </TouchableOpacity>
          )}
        </View>
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
          <View style={tw`flex-row items-center justify-between mb-1.5 ml-1`}>
            <Text style={[tw`text-[10px] font-bold uppercase tracking-widest`, { color: TEXT_SECONDARY }]}>Nama Tabungan</Text>
            <Text style={[tw`text-[10px]`, { color: nameError ? ERROR_COLOR : Colors.gray500 }]}>{name.length}/50</Text>
          </View>
          <View style={[tw`rounded-xl px-4 py-3`, { backgroundColor: SURFACE_COLOR, borderWidth: nameError ? 1 : 0, borderColor: nameError ? ERROR_COLOR : "transparent" }]}>
            <TextInput
              style={[tw`text-[13px] font-bold`, { color: TEXT_PRIMARY, padding: 0 }]}
              placeholder="Contoh: Dana Liburan ke Bali"
              placeholderTextColor={Colors.textTertiary}
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
            <Text style={[tw`text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1`, { color: TEXT_SECONDARY }]}>💡 Target Cepat</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-1`}>
              <View style={tw`flex-row px-1`}>
                {[1000000, 3000000, 5000000, 10000000, 20000000, 50000000].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[tw`rounded-xl px-4 py-2 mr-2`, { backgroundColor: SURFACE_COLOR }]}
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
          <Text style={[tw`text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1`, { color: TEXT_SECONDARY }]}>Target Tabungan</Text>
          <View style={[tw`rounded-xl px-4 py-3 mb-4`, { backgroundColor: SURFACE_COLOR, borderWidth: targetError ? 1 : 0, borderColor: targetError ? ERROR_COLOR : "transparent" }]}>
            <View style={tw`flex-row items-center`}>
              <Text style={[tw`text-lg font-bold mr-2`, { color: TEXT_SECONDARY }]}>Rp</Text>
              <TextInput
                style={[tw`flex-1 text-xl font-bold`, { color: TEXT_PRIMARY, padding: 0 }]}
                placeholder="0"
                placeholderTextColor={Colors.textTertiary}
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
          <Text style={[tw`text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1`, { color: TEXT_SECONDARY }]}>Jumlah Saat Ini</Text>
          <View style={[tw`rounded-xl px-4 py-3`, { backgroundColor: SURFACE_COLOR }]}>
            <View style={tw`flex-row items-center`}>
              <Text style={[tw`text-lg font-bold mr-2`, { color: TEXT_SECONDARY }]}>Rp</Text>
              <TextInput
                style={[tw`flex-1 text-xl font-bold`, { color: TEXT_PRIMARY, padding: 0 }]}
                placeholder="0"
                placeholderTextColor={Colors.textTertiary}
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
                  { backgroundColor: Colors.surfaceLight },
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
        <View style={tw`mb-5`}>
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <Text style={[tw`text-sm font-medium`, { color: TEXT_SECONDARY }]}>
              Kategori
            </Text>
            <Text style={[tw`text-xs`, { color: ACCENT_COLOR }]}>
              {CATEGORIES.find((c) => c.id === category)?.name || "Lainnya"}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={tw`-mx-1`}
          >
            <View style={tw`flex-row px-1`}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                const catColor = getCategoryColor(cat.id);

                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={tw`mr-3`}
                    onPress={() => setCategory(cat.id)}
                    disabled={loading}
                  >
                    <View
                      style={[
                        tw`rounded-2xl items-center p-3 w-20`,
                        isSelected
                          ? {
                              backgroundColor: catColor + "20",
                              borderWidth: 2,
                              borderColor: catColor,
                            }
                          : { backgroundColor: SURFACE_COLOR },
                      ]}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={24}
                        color={isSelected ? catColor : TEXT_SECONDARY}
                      />
                    </View>
                    <Text
                      style={[
                        tw`text-xs mt-1.5 text-center`,
                        isSelected
                          ? { fontWeight: "600", color: TEXT_PRIMARY }
                          : { color: TEXT_SECONDARY },
                      ]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Priority Selection */}
        <View style={tw`mb-4`}>
          <Text style={[tw`text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1`, { color: TEXT_SECONDARY }]}>
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
                    tw`flex-1 rounded-xl px-3 py-3`,
                    isSelected
                      ? { backgroundColor: priColor + "15" }
                      : { backgroundColor: SURFACE_COLOR },
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
          <Text style={[tw`text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1`, { color: TEXT_SECONDARY }]}>
            Deadline (Opsional)
          </Text>
          <TouchableOpacity
            style={[tw`rounded-xl p-3 flex-row justify-between items-center`, { backgroundColor: SURFACE_COLOR }]}
            onPress={() => setShowCalendar(true)}
            disabled={loading}
          >
            <View style={tw`flex-1 mr-3`}>
              <Text style={[tw`text-[13px] font-semibold`, { color: TEXT_PRIMARY }]}>
                {deadline ? formatDisplayDate(deadline) : "Pilih tanggal target"}
              </Text>
            </View>
            <Ionicons name="calendar-outline" size={16} color={Colors.gray500} />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={tw`mb-4`}>
          <View style={tw`flex-row items-center justify-between mb-1.5 ml-1`}>
            <Text style={[tw`text-[10px] font-bold uppercase tracking-widest`, { color: TEXT_SECONDARY }]}>Catatan (opsional)</Text>
            <Text style={[tw`text-[10px]`, { color: Colors.gray500 }]}>{description.length}/200</Text>
          </View>
          <View style={[tw`rounded-xl px-4 py-3`, { backgroundColor: SURFACE_COLOR }]}>
            <TextInput
              style={[tw`text-[13px] font-medium min-h-[60px]`, { color: TEXT_PRIMARY, padding: 0 }]}
              placeholder="Tambahkan catatan atau motivasi..."
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

        {/* Image Cover Pick (Poster Style) */}
        <View style={tw`mb-4`}>
          <View style={tw`flex-row items-center justify-between mb-1.5 ml-1`}>
            <Text style={[tw`text-[10px] font-bold uppercase tracking-widest`, { color: TEXT_SECONDARY }]}>Gambar Impian (Opsional)</Text>
            <Ionicons name="image-outline" size={12} color={Colors.gray500} />
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
              <Text style={[tw`text-[10px] text-center px-4`, { color: Colors.gray400 }]}>Pilih foto barang atau tempat impian Anda dari galeri</Text>
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
                {CATEGORIES.find((c) => c.id === category)?.name || "Lainnya"}
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
        <View style={tw`flex-row gap-3 mt-2`}>
          <TouchableOpacity
            style={[tw`flex-1 rounded-xl py-3.5 items-center`, { backgroundColor: SURFACE_COLOR }]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={[tw`text-[13px] font-bold`, { color: TEXT_PRIMARY }]}>Batal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[tw`flex-1 rounded-xl py-3.5 items-center`, { backgroundColor: ACCENT_COLOR, opacity: (!name || !target || loading) ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={!name || !target || loading}
          >
            <Text style={tw`text-white text-[13px] font-bold`}>
              {loading ? "Menyimpan..." : isEditMode ? "Simpan" : "Tambah"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* DateTime Picker Modal */}
      {showCalendar && (
        <DateTimePicker
          value={deadline ? new Date(deadline) : new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={handleDateSelect}
        />
      )}
    </SafeAreaView>
  );
};

export default AddSavingsScreen;
