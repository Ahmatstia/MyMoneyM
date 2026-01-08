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
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
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
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [targetError, setTargetError] = useState("");

  // State untuk calendar modal
  const [showCalendar, setShowCalendar] = useState(false);

  // Update title dan header
  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? "Edit Tabungan" : "Tambah Tabungan",
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
  }, [isEditMode, navigation, loading]);

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
  const handleDateSelect = (day: any) => {
    try {
      const selectedDate = new Date(day.dateString);
      if (isNaN(selectedDate.getTime())) {
        throw new Error("Tanggal tidak valid");
      }

      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const dayStr = String(selectedDate.getDate()).padStart(2, "0");

      setDeadline(`${year}-${month}-${dayStr}`);
      setShowCalendar(false);
    } catch (error) {
      Alert.alert("Error", "Gagal memilih tanggal");
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

  const progress = calculateProgress();
  const categoryColor = getCategoryColor(category);
  const priorityColor = getPriorityColor(priority);

  return (
    <View style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-5 pb-8`}
        showsVerticalScrollIndicator={false}
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
        <View style={tw`mb-5`}>
          <Text
            style={[tw`text-sm font-medium mb-3`, { color: TEXT_SECONDARY }]}
          >
            Nama Tabungan
          </Text>
          <View
            style={[
              tw`rounded-2xl p-4 border`,
              {
                backgroundColor: SURFACE_COLOR,
                borderColor: nameError ? ERROR_COLOR : BORDER_COLOR,
              },
            ]}
          >
            <TextInput
              style={[tw`text-base font-medium`, { color: TEXT_PRIMARY }]}
              placeholder="Contoh: Dana Liburan ke Bali"
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={handleNameChange}
              maxLength={50}
              editable={!loading}
            />
            <View style={tw`flex-row justify-between mt-2`}>
              <Text
                style={[
                  tw`text-xs`,
                  { color: nameError ? ERROR_COLOR : TEXT_SECONDARY },
                ]}
              >
                {nameError || "Minimal 3 karakter"}
              </Text>
              <Text style={[tw`text-xs`, { color: Colors.textTertiary }]}>
                {name.length}/50
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Target Suggestions */}
        {!target && (
          <View style={tw`mb-5`}>
            <Text
              style={[tw`text-xs font-medium mb-2`, { color: TEXT_SECONDARY }]}
            >
              💡 Target Cepat
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={tw`-mx-1`}
            >
              <View style={tw`flex-row px-1`}>
                {[1000000, 3000000, 5000000, 10000000, 20000000, 50000000].map(
                  (value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        tw`rounded-xl px-4 py-2 mr-2`,
                        {
                          backgroundColor: SURFACE_COLOR,
                          borderWidth: 1,
                          borderColor: BORDER_COLOR,
                        },
                      ]}
                      onPress={() => setTarget(value.toString())}
                    >
                      <Text
                        style={[
                          tw`text-xs font-medium`,
                          { color: ACCENT_COLOR },
                        ]}
                      >
                        {new Intl.NumberFormat("id-ID", {
                          notation: "compact",
                          compactDisplay: "short",
                        }).format(value)}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Amount Inputs */}
        <View style={tw`mb-5`}>
          {/* Target Input */}
          <Text
            style={[tw`text-sm font-medium mb-3`, { color: TEXT_SECONDARY }]}
          >
            Target Tabungan
          </Text>
          <View
            style={[
              tw`rounded-2xl p-5 border mb-4`,
              {
                backgroundColor: SURFACE_COLOR,
                borderColor: targetError ? ERROR_COLOR : BORDER_COLOR,
              },
            ]}
          >
            <View style={tw`flex-row items-center`}>
              <Text style={[tw`text-xl mr-2`, { color: TEXT_SECONDARY }]}>
                Rp
              </Text>
              <TextInput
                style={[
                  tw`flex-1 text-2xl font-semibold`,
                  { color: TEXT_PRIMARY },
                ]}
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
              <View style={tw`mt-3 pt-3 border-t border-gray-700`}>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  {formatAmountDisplay(target)}
                </Text>
              </View>
            )}
            {targetError && (
              <Text style={[tw`text-xs mt-2`, { color: ERROR_COLOR }]}>
                {targetError}
              </Text>
            )}
          </View>

          {/* Current Amount Input */}
          <Text
            style={[tw`text-sm font-medium mb-3`, { color: TEXT_SECONDARY }]}
          >
            Jumlah Saat Ini
          </Text>
          <View
            style={[
              tw`rounded-2xl p-5 border`,
              {
                backgroundColor: SURFACE_COLOR,
                borderColor: BORDER_COLOR,
              },
            ]}
          >
            <View style={tw`flex-row items-center`}>
              <Text style={[tw`text-xl mr-2`, { color: TEXT_SECONDARY }]}>
                Rp
              </Text>
              <TextInput
                style={[
                  tw`flex-1 text-2xl font-semibold`,
                  { color: TEXT_PRIMARY },
                ]}
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
              <View style={tw`mt-3 pt-3 border-t border-gray-700`}>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  {formatAmountDisplay(current)}
                </Text>
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
        <View style={tw`mb-5`}>
          <Text
            style={[tw`text-sm font-medium mb-3`, { color: TEXT_SECONDARY }]}
          >
            Prioritas
          </Text>
          <View style={tw`flex-row gap-2`}>
            {PRIORITIES.map((p) => {
              const isSelected = priority === p.id;
              const priColor = getPriorityColor(p.id);

              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    tw`flex-1 rounded-xl px-3 py-2.5 border`,
                    isSelected
                      ? {
                          backgroundColor: priColor + "15",
                          borderColor: priColor,
                        }
                      : {
                          backgroundColor: SURFACE_COLOR,
                          borderColor: BORDER_COLOR,
                        },
                  ]}
                  onPress={() => setPriority(p.id)}
                  disabled={loading}
                >
                  <View style={tw`items-center`}>
                    <Ionicons
                      name={p.icon}
                      size={16}
                      color={isSelected ? priColor : TEXT_SECONDARY}
                    />
                    <Text
                      style={[
                        tw`text-xs font-semibold mt-1.5`,
                        isSelected
                          ? { color: priColor }
                          : { color: TEXT_SECONDARY },
                      ]}
                    >
                      {p.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Deadline Selection */}
        <View style={tw`mb-5`}>
          <Text
            style={[tw`text-sm font-medium mb-3`, { color: TEXT_SECONDARY }]}
          >
            Deadline (Opsional)
          </Text>
          <TouchableOpacity
            style={[
              tw`rounded-2xl p-4 flex-row justify-between items-center border`,
              { backgroundColor: SURFACE_COLOR, borderColor: BORDER_COLOR },
            ]}
            onPress={() => setShowCalendar(true)}
            disabled={loading}
          >
            <View style={tw`flex-1 mr-3`}>
              <Text style={[tw`text-sm font-medium`, { color: TEXT_PRIMARY }]}>
                {deadline ? formatDisplayDate(deadline) : "Pilih tanggal"}
              </Text>
            </View>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={TEXT_SECONDARY}
            />
          </TouchableOpacity>
          <Text style={[tw`text-xs mt-2`, { color: Colors.textTertiary }]}>
            Tetapkan deadline untuk membantu mencapai target tepat waktu
          </Text>
        </View>

        {/* Description */}
        <View style={tw`mb-5`}>
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <Text style={[tw`text-sm font-medium`, { color: TEXT_SECONDARY }]}>
              Catatan (opsional)
            </Text>
            <Text style={[tw`text-xs`, { color: Colors.textTertiary }]}>
              {description.length}/200
            </Text>
          </View>
          <View
            style={[
              tw`rounded-2xl p-4 border`,
              { backgroundColor: SURFACE_COLOR, borderColor: BORDER_COLOR },
            ]}
          >
            <TextInput
              style={[tw`text-sm min-h-20`, { color: TEXT_PRIMARY }]}
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
          </View>
        )}

        {/* Tips */}
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
            <Ionicons name="bulb-outline" size={16} color={INFO_COLOR} />
            <Text
              style={[tw`text-sm font-semibold ml-2`, { color: INFO_COLOR }]}
            >
              💡 Tips Menabung
            </Text>
          </View>

          <Text style={[tw`text-xs mb-1`, { color: INFO_COLOR }]}>
            • <Text style={tw`font-medium`}>Dana Darurat</Text>: 3-6 bulan
            pengeluaran
          </Text>
          <Text style={[tw`text-xs mb-1`, { color: INFO_COLOR }]}>
            • <Text style={tw`font-medium`}>50/30/20 Rule</Text>: 50% kebutuhan,
            30% keinginan, 20% tabungan
          </Text>
          <Text style={[tw`text-xs mb-1`, { color: INFO_COLOR }]}>
            • <Text style={tw`font-medium`}>Pay Yourself First</Text>: Sisihkan
            tabungan diawal bulan
          </Text>
          <Text style={[tw`text-xs`, { color: INFO_COLOR }]}>
            • <Text style={tw`font-medium`}>Automate</Text>: Set autodebit untuk
            tabungan rutin
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={tw`flex-row gap-3 mt-3`}>
          {/* Batal Button */}
          <TouchableOpacity
            style={[
              tw`flex-1 rounded-2xl py-4 items-center border-2`,
              { borderColor: BORDER_COLOR, backgroundColor: SURFACE_COLOR },
            ]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={[tw`text-sm font-semibold`, { color: TEXT_PRIMARY }]}>
              Batal
            </Text>
          </TouchableOpacity>

          {/* Simpan Button */}
          <TouchableOpacity
            style={[
              tw`flex-1 rounded-2xl py-4 items-center`,
              { backgroundColor: ACCENT_COLOR, opacity: loading ? 0.7 : 1 },
            ]}
            onPress={handleSubmit}
            disabled={!name || !target || loading}
          >
            <Text style={tw`text-white text-sm font-semibold`}>
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
                Pilih Deadline
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
                [deadline || getCurrentDate()]: {
                  selected: true,
                  selectedColor: ACCENT_COLOR,
                  selectedTextColor: "#FFFFFF",
                },
              }}
              minDate={getCurrentDate()}
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

export default AddSavingsScreen;
