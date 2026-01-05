import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { formatCurrency, safeNumber } from "../../utils/calculations";

const CATEGORIES = [
  { id: "emergency", name: "Dana Darurat", icon: "shield", color: "#EF4444" },
  { id: "vacation", name: "Liburan", icon: "airplane", color: "#3B82F6" },
  { id: "gadget", name: "Gadget", icon: "phone-portrait", color: "#8B5CF6" },
  { id: "education", name: "Pendidikan", icon: "school", color: "#10B981" },
  { id: "house", name: "Rumah", icon: "home", color: "#F59E0B" },
  { id: "car", name: "Mobil", icon: "car", color: "#6366F1" },
  { id: "health", name: "Kesehatan", icon: "medical", color: "#EC4899" },
  { id: "wedding", name: "Pernikahan", icon: "heart", color: "#F43F5E" },
  { id: "other", name: "Lainnya", icon: "wallet", color: "#6B7280" },
];

const PRIORITIES = [
  { id: "low", name: "Rendah", color: "#10B981", icon: "flag" },
  { id: "medium", name: "Sedang", color: "#F59E0B", icon: "flag" },
  { id: "high", name: "Tinggi", color: "#EF4444", icon: "flag" },
];

// Helper untuk format tanggal
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const AddSavingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const params = route.params || {};
  const isEditMode = params.editMode || false;
  const savingsData = params.savingsData;

  const { addSavings, editSavings } = useAppContext();

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

  // State untuk calendar modal
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempDate, setTempDate] = useState<string>("");

  // Update title
  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? "Edit Tabungan" : "Tambah Tabungan",
      headerStyle: {
        backgroundColor: "#4F46E5",
      },
      headerTintColor: "#FFFFFF",
      headerTitleStyle: {
        fontWeight: "600",
      },
    });
  }, [isEditMode, navigation]);

  // Format tanggal untuk display
  const formatDisplayDate = (dateStr?: string): string => {
    if (!dateStr) return "Pilih tanggal";

    try {
      const date = parseDate(dateStr);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return dateStr;
    }
  };

  // Handle calendar
  const openCalendar = () => {
    setTempDate(deadline || formatDate(new Date()));
    setShowCalendar(true);
  };

  const handleCalendarSelect = (date: any) => {
    setDeadline(date.dateString);
    setShowCalendar(false);
  };

  // Format input angka
  const handleAmountChange = (
    text: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const cleanedText = text.replace(/[^0-9]/g, "");
    setter(cleanedText);
  };

  // Hitung progress
  const calculateProgress = () => {
    const targetNum = safeNumber(parseFloat(target));
    const currentNum = safeNumber(parseFloat(current));

    if (targetNum <= 0) return 0;
    return (currentNum / targetNum) * 100;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Mohon isi nama tabungan");
      return;
    }

    const targetNum = safeNumber(parseFloat(target));
    const currentNum = safeNumber(parseFloat(current));

    if (targetNum <= 0) {
      Alert.alert("Error", "Target harus lebih dari 0");
      return;
    }

    if (currentNum < 0) {
      Alert.alert("Error", "Jumlah saat ini tidak boleh negatif");
      return;
    }

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
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        await addSavings(savingsDataToSave);
        Alert.alert("Sukses", "Tabungan berhasil ditambahkan", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error: any) {
      console.error("Error saving savings:", error);
      Alert.alert(
        "Error",
        error.message ||
          `Gagal ${isEditMode ? "mengedit" : "menambah"} tabungan`
      );
    } finally {
      setLoading(false);
    }
  };

  // Calendar Modal
  const renderCalendarModal = () => (
    <Modal
      visible={showCalendar}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCalendar(false)}
    >
      <View style={tw`flex-1 justify-center items-center bg-black/50`}>
        <View style={tw`bg-white rounded-xl p-4 w-11/12`}>
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text style={tw`text-lg font-semibold text-gray-900`}>
              Pilih Deadline
            </Text>
            <TouchableOpacity onPress={() => setShowCalendar(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Calendar
            current={tempDate}
            onDayPress={handleCalendarSelect}
            markedDates={{
              [tempDate]: {
                selected: true,
                selectedColor: "#4F46E5",
              },
            }}
            minDate={formatDate(new Date())}
            theme={{
              backgroundColor: "#ffffff",
              calendarBackground: "#ffffff",
              textSectionTitleColor: "#6B7280",
              selectedDayBackgroundColor: "#4F46E5",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#4F46E5",
              dayTextColor: "#111827",
              textDisabledColor: "#D1D5DB",
              dotColor: "#4F46E5",
              selectedDotColor: "#ffffff",
              arrowColor: "#4F46E5",
              monthTextColor: "#111827",
              textDayFontFamily: "System",
              textMonthFontFamily: "System",
              textDayHeaderFontFamily: "System",
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
            style={tw`rounded-lg`}
          />

          <View style={tw`mt-4 flex-row justify-between`}>
            <TouchableOpacity
              style={tw`px-4 py-2 bg-gray-200 rounded-lg`}
              onPress={() => {
                setDeadline(undefined);
                setShowCalendar(false);
              }}
            >
              <Text style={tw`text-gray-700 font-medium`}>Tanpa Deadline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`px-4 py-2 bg-indigo-600 rounded-lg`}
              onPress={() => setShowCalendar(false)}
            >
              <Text style={tw`text-white font-medium`}>Selesai</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const progress = calculateProgress();
  const selectedCategory = CATEGORIES.find((c) => c.id === category);
  const selectedPriority = PRIORITIES.find((p) => p.id === priority);

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        {/* Name Input */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>
            Nama Tabungan *
          </Text>
          <TextInput
            style={tw`bg-white border border-gray-300 rounded-lg px-3 py-3 text-gray-800`}
            placeholder="Contoh: Dana Liburan ke Bali"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            maxLength={50}
            editable={!loading}
          />
          <Text style={tw`text-xs text-gray-500 mt-1 text-right`}>
            {name.length}/50 karakter
          </Text>
        </View>

        {/* Amount Inputs */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>
            Target Tabungan *
          </Text>
          <View
            style={tw`flex-row items-center bg-white border border-gray-300 rounded-lg px-3 mb-3`}
          >
            <Text style={tw`text-gray-600 mr-2`}>Rp</Text>
            <TextInput
              style={tw`flex-1 py-3 text-gray-800 text-lg`}
              placeholder="1000000"
              placeholderTextColor="#9CA3AF"
              value={target}
              onChangeText={(text) => handleAmountChange(text, setTarget)}
              keyboardType="numeric"
              maxLength={15}
              editable={!loading}
            />
          </View>

          <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>
            Jumlah Saat Ini
          </Text>
          <View
            style={tw`flex-row items-center bg-white border border-gray-300 rounded-lg px-3`}
          >
            <Text style={tw`text-gray-600 mr-2`}>Rp</Text>
            <TextInput
              style={tw`flex-1 py-3 text-gray-800`}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              value={current}
              onChangeText={(text) => handleAmountChange(text, setCurrent)}
              keyboardType="numeric"
              maxLength={15}
              editable={!loading}
            />
          </View>

          {/* Progress Preview */}
          {target && safeNumber(parseFloat(target)) > 0 && (
            <View style={tw`mt-4 bg-blue-50 p-3 rounded-lg`}>
              <View style={tw`flex-row justify-between items-center mb-2`}>
                <Text style={tw`text-sm font-medium text-gray-700`}>
                  Progress: {progress.toFixed(1)}%
                </Text>
                <Text style={tw`text-sm font-medium text-gray-700`}>
                  {formatCurrency(safeNumber(parseFloat(current)))} /{" "}
                  {formatCurrency(safeNumber(parseFloat(target)))}
                </Text>
              </View>
              <View style={tw`h-2 bg-gray-200 rounded-full overflow-hidden`}>
                <View
                  style={[
                    tw`h-full rounded-full`,
                    {
                      backgroundColor: progress >= 100 ? "#10B981" : "#4F46E5",
                      width: `${Math.min(progress, 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={tw`text-xs text-gray-600 mt-2`}>
                Sisa:{" "}
                {formatCurrency(
                  safeNumber(parseFloat(target)) -
                    safeNumber(parseFloat(current))
                )}
              </Text>
            </View>
          )}
        </View>

        {/* Category Selection */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>
            Kategori
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`flex-row gap-2`}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  tw`px-4 py-3 rounded-lg border items-center min-w-[100px]`,
                  category === cat.id
                    ? {
                        borderColor: cat.color,
                        backgroundColor: `${cat.color}10`,
                      }
                    : tw`border-gray-200 bg-white`,
                ]}
                onPress={() => setCategory(cat.id)}
                disabled={loading}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={20}
                  color={category === cat.id ? cat.color : "#6B7280"}
                  style={tw`mb-1`}
                />
                <Text
                  style={[
                    tw`text-xs text-center`,
                    category === cat.id
                      ? { color: cat.color, fontWeight: "600" }
                      : tw`text-gray-700`,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Priority Selection */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>
            Prioritas
          </Text>
          <View style={tw`flex-row gap-3`}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  tw`flex-1 px-4 py-3 rounded-lg border items-center`,
                  priority === p.id
                    ? { borderColor: p.color, backgroundColor: `${p.color}10` }
                    : tw`border-gray-200 bg-white`,
                ]}
                onPress={() => setPriority(p.id as any)}
                disabled={loading}
              >
                <Ionicons
                  name={p.icon as any}
                  size={16}
                  color={priority === p.id ? p.color : "#6B7280"}
                  style={tw`mb-1`}
                />
                <Text
                  style={[
                    tw`text-sm text-center`,
                    priority === p.id
                      ? { color: p.color, fontWeight: "600" }
                      : tw`text-gray-700`,
                  ]}
                >
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Deadline Selection */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>
            Deadline (Opsional)
          </Text>
          <TouchableOpacity
            style={tw`flex-row items-center justify-between bg-white border border-gray-300 rounded-lg px-3 py-3`}
            onPress={openCalendar}
            disabled={loading}
          >
            <View style={tw`flex-row items-center`}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color="#4F46E5"
                style={tw`mr-2`}
              />
              <Text style={tw`text-gray-800`}>
                {formatDisplayDate(deadline)}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color="#6B7280" />
          </TouchableOpacity>
          <Text style={tw`text-xs text-gray-500 mt-1`}>
            Tetapkan deadline untuk membantu mencapai target tepat waktu
          </Text>
        </View>

        {/* Description */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-sm font-medium text-gray-700 mb-2`}>
            Deskripsi (Opsional)
          </Text>
          <TextInput
            style={tw`bg-white border border-gray-300 rounded-lg px-3 py-3 text-gray-800 min-h-[100px]`}
            placeholder="Tambahkan catatan atau motivasi..."
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            maxLength={200}
            editable={!loading}
          />
          <Text style={tw`text-xs text-gray-500 mt-1 text-right`}>
            {description.length}/200 karakter
          </Text>
        </View>

        {/* Tips */}
        <View style={tw`bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6`}>
          <Text style={tw`text-sm font-semibold text-blue-800 mb-2`}>
            💡 Tips Menabung
          </Text>
          <Text style={tw`text-xs text-blue-700 mb-1`}>
            • <Text style={tw`font-medium`}>Dana Darurat</Text>: 3-6 bulan
            pengeluaran
          </Text>
          <Text style={tw`text-xs text-blue-700 mb-1`}>
            • <Text style={tw`font-medium`}>50/30/20 Rule</Text>: 50% kebutuhan,
            30% keinginan, 20% tabungan
          </Text>
          <Text style={tw`text-xs text-blue-700 mb-1`}>
            • <Text style={tw`font-medium`}>Pay Yourself First</Text>: Sisihkan
            tabungan diawal bulan
          </Text>
          <Text style={tw`text-xs text-blue-700`}>
            • <Text style={tw`font-medium`}>Automate</Text>: Set autodebit untuk
            tabungan rutin
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={tw`flex-row gap-3`}>
          <TouchableOpacity
            style={[
              tw`flex-1 py-3 rounded-lg items-center`,
              !name || !target || loading
                ? tw`bg-gray-400`
                : tw`bg-indigo-600 active:bg-indigo-700`,
            ]}
            onPress={handleSubmit}
            disabled={!name || !target || loading}
          >
            {loading ? (
              <Text style={tw`text-white font-medium`}>Menyimpan...</Text>
            ) : (
              <Text style={tw`text-white font-medium`}>
                {isEditMode ? "Simpan Perubahan" : "Simpan Tabungan"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          style={tw`py-3 border border-gray-300 rounded-lg items-center mt-3 active:bg-gray-50`}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={tw`text-gray-700`}>Batal</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Calendar Modal */}
      {renderCalendarModal()}
    </View>
  );
};

export default AddSavingsScreen;
