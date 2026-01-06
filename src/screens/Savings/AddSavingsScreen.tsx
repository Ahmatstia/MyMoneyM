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
import { Colors } from "../../theme/theme";

const CATEGORIES = [
  {
    id: "emergency",
    name: "Dana Darurat",
    icon: "shield",
    color: Colors.error,
  },
  { id: "vacation", name: "Liburan", icon: "airplane", color: Colors.info },
  {
    id: "gadget",
    name: "Gadget",
    icon: "phone-portrait",
    color: Colors.purple,
  },
  {
    id: "education",
    name: "Pendidikan",
    icon: "school",
    color: Colors.success,
  },
  { id: "house", name: "Rumah", icon: "home", color: Colors.warning },
  { id: "car", name: "Mobil", icon: "car", color: Colors.accent },
  { id: "health", name: "Kesehatan", icon: "medical", color: Colors.pink },
  {
    id: "wedding",
    name: "Pernikahan",
    icon: "heart",
    color: Colors.errorLight,
  },
  { id: "other", name: "Lainnya", icon: "wallet", color: Colors.textTertiary },
];

const PRIORITIES = [
  { id: "low", name: "Rendah", color: Colors.success, icon: "flag" },
  { id: "medium", name: "Sedang", color: Colors.warning, icon: "flag" },
  { id: "high", name: "Tinggi", color: Colors.error, icon: "flag" },
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
        backgroundColor: Colors.surface,
      },
      headerTintColor: Colors.textPrimary,
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
      <View
        style={tw.style(`flex-1 justify-center items-center`, {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        })}
      >
        <View
          style={tw.style(`rounded-xl p-4 w-11/12`, {
            backgroundColor: Colors.surface,
          })}
        >
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text
              style={tw.style(`text-lg font-semibold`, {
                color: Colors.textPrimary,
              })}
            >
              Pilih Deadline
            </Text>
            <TouchableOpacity onPress={() => setShowCalendar(false)}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Calendar
            current={tempDate}
            onDayPress={handleCalendarSelect}
            markedDates={{
              [tempDate]: {
                selected: true,
                selectedColor: Colors.accent,
              },
            }}
            minDate={formatDate(new Date())}
            theme={{
              backgroundColor: Colors.surface,
              calendarBackground: Colors.surface,
              textSectionTitleColor: Colors.textSecondary,
              selectedDayBackgroundColor: Colors.accent,
              selectedDayTextColor: Colors.textPrimary,
              todayTextColor: Colors.accent,
              dayTextColor: Colors.textPrimary,
              textDisabledColor: Colors.textTertiary,
              dotColor: Colors.accent,
              selectedDotColor: Colors.textPrimary,
              arrowColor: Colors.accent,
              monthTextColor: Colors.textPrimary,
              textDayFontFamily: "System",
              textMonthFontFamily: "System",
              textDayHeaderFontFamily: "System",
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
            style={tw.style(`rounded-lg`, { backgroundColor: Colors.surface })}
          />

          <View style={tw`mt-4 flex-row justify-between`}>
            <TouchableOpacity
              style={tw.style(`px-4 py-2 rounded-lg`, {
                backgroundColor: Colors.surfaceLight,
              })}
              onPress={() => {
                setDeadline(undefined);
                setShowCalendar(false);
              }}
            >
              <Text
                style={tw.style(`font-medium`, { color: Colors.textPrimary })}
              >
                Tanpa Deadline
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw.style(`px-4 py-2 rounded-lg`, {
                backgroundColor: Colors.accent,
              })}
              onPress={() => setShowCalendar(false)}
            >
              <Text
                style={tw.style(`font-medium`, { color: Colors.textPrimary })}
              >
                Selesai
              </Text>
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
    <View style={tw.style(`flex-1`, { backgroundColor: Colors.background })}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        {/* Name Input */}
        <View style={tw`mb-6`}>
          <Text
            style={tw.style(`text-sm font-medium mb-2`, {
              color: Colors.textPrimary,
            })}
          >
            Nama Tabungan *
          </Text>
          <TextInput
            style={tw.style(`border rounded-lg px-3 py-3`, {
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
              color: Colors.textPrimary,
            })}
            placeholder="Contoh: Dana Liburan ke Bali"
            placeholderTextColor={Colors.textTertiary}
            value={name}
            onChangeText={setName}
            maxLength={50}
            editable={!loading}
          />
          <Text
            style={tw.style(`text-xs mt-1 text-right`, {
              color: Colors.textSecondary,
            })}
          >
            {name.length}/50 karakter
          </Text>
        </View>

        {/* Amount Inputs */}
        <View style={tw`mb-6`}>
          <Text
            style={tw.style(`text-sm font-medium mb-2`, {
              color: Colors.textPrimary,
            })}
          >
            Target Tabungan *
          </Text>
          <View
            style={tw.style(
              `flex-row items-center border rounded-lg px-3 mb-3`,
              {
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              }
            )}
          >
            <Text style={tw.style(`mr-2`, { color: Colors.textSecondary })}>
              Rp
            </Text>
            <TextInput
              style={tw.style(`flex-1 py-3 text-lg`, {
                color: Colors.textPrimary,
              })}
              placeholder="1000000"
              placeholderTextColor={Colors.textTertiary}
              value={target}
              onChangeText={(text) => handleAmountChange(text, setTarget)}
              keyboardType="numeric"
              maxLength={15}
              editable={!loading}
            />
          </View>

          <Text
            style={tw.style(`text-sm font-medium mb-2`, {
              color: Colors.textPrimary,
            })}
          >
            Jumlah Saat Ini
          </Text>
          <View
            style={tw.style(`flex-row items-center border rounded-lg px-3`, {
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            })}
          >
            <Text style={tw.style(`mr-2`, { color: Colors.textSecondary })}>
              Rp
            </Text>
            <TextInput
              style={tw.style(`flex-1 py-3`, { color: Colors.textPrimary })}
              placeholder="0"
              placeholderTextColor={Colors.textTertiary}
              value={current}
              onChangeText={(text) => handleAmountChange(text, setCurrent)}
              keyboardType="numeric"
              maxLength={15}
              editable={!loading}
            />
          </View>

          {/* Progress Preview */}
          {target && safeNumber(parseFloat(target)) > 0 && (
            <View
              style={tw.style(`mt-4 p-3 rounded-lg`, {
                backgroundColor: `${Colors.info}20`,
              })}
            >
              <View style={tw`flex-row justify-between items-center mb-2`}>
                <Text
                  style={tw.style(`text-sm font-medium`, {
                    color: Colors.textPrimary,
                  })}
                >
                  Progress: {progress.toFixed(1)}%
                </Text>
                <Text
                  style={tw.style(`text-sm font-medium`, {
                    color: Colors.textPrimary,
                  })}
                >
                  {formatCurrency(safeNumber(parseFloat(current)))} /{" "}
                  {formatCurrency(safeNumber(parseFloat(target)))}
                </Text>
              </View>
              <View
                style={tw.style(`h-2 rounded-full overflow-hidden`, {
                  backgroundColor: Colors.surfaceLight,
                })}
              >
                <View
                  style={[
                    tw`h-full rounded-full`,
                    {
                      backgroundColor:
                        progress >= 100 ? Colors.success : Colors.accent,
                      width: `${Math.min(progress, 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text
                style={tw.style(`text-xs mt-2`, {
                  color: Colors.textSecondary,
                })}
              >
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
          <Text
            style={tw.style(`text-sm font-medium mb-2`, {
              color: Colors.textPrimary,
            })}
          >
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
                        backgroundColor: `${cat.color}20`,
                      }
                    : {
                        borderColor: Colors.border,
                        backgroundColor: Colors.surface,
                      },
                ]}
                onPress={() => setCategory(cat.id)}
                disabled={loading}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={20}
                  color={category === cat.id ? cat.color : Colors.textSecondary}
                  style={tw`mb-1`}
                />
                <Text
                  style={[
                    tw`text-xs text-center`,
                    category === cat.id
                      ? { color: cat.color, fontWeight: "600" }
                      : { color: Colors.textPrimary },
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
          <Text
            style={tw.style(`text-sm font-medium mb-2`, {
              color: Colors.textPrimary,
            })}
          >
            Prioritas
          </Text>
          <View style={tw`flex-row gap-3`}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  tw`flex-1 px-4 py-3 rounded-lg border items-center`,
                  priority === p.id
                    ? { borderColor: p.color, backgroundColor: `${p.color}20` }
                    : {
                        borderColor: Colors.border,
                        backgroundColor: Colors.surface,
                      },
                ]}
                onPress={() => setPriority(p.id as any)}
                disabled={loading}
              >
                <Ionicons
                  name={p.icon as any}
                  size={16}
                  color={priority === p.id ? p.color : Colors.textSecondary}
                  style={tw`mb-1`}
                />
                <Text
                  style={[
                    tw`text-sm text-center`,
                    priority === p.id
                      ? { color: p.color, fontWeight: "600" }
                      : { color: Colors.textPrimary },
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
          <Text
            style={tw.style(`text-sm font-medium mb-2`, {
              color: Colors.textPrimary,
            })}
          >
            Deadline (Opsional)
          </Text>
          <TouchableOpacity
            style={tw.style(
              `flex-row items-center justify-between border rounded-lg px-3 py-3`,
              {
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              }
            )}
            onPress={openCalendar}
            disabled={loading}
          >
            <View style={tw`flex-row items-center`}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={Colors.accent}
                style={tw`mr-2`}
              />
              <Text style={tw.style({ color: Colors.textPrimary })}>
                {formatDisplayDate(deadline)}
              </Text>
            </View>
            <Ionicons
              name="chevron-down"
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
          <Text
            style={tw.style(`text-xs mt-1`, { color: Colors.textSecondary })}
          >
            Tetapkan deadline untuk membantu mencapai target tepat waktu
          </Text>
        </View>

        {/* Description */}
        <View style={tw`mb-6`}>
          <Text
            style={tw.style(`text-sm font-medium mb-2`, {
              color: Colors.textPrimary,
            })}
          >
            Deskripsi (Opsional)
          </Text>
          <TextInput
            style={tw.style(`border rounded-lg px-3 py-3 min-h-[100px]`, {
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
              color: Colors.textPrimary,
            })}
            placeholder="Tambahkan catatan atau motivasi..."
            placeholderTextColor={Colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            maxLength={200}
            editable={!loading}
          />
          <Text
            style={tw.style(`text-xs mt-1 text-right`, {
              color: Colors.textSecondary,
            })}
          >
            {description.length}/200 karakter
          </Text>
        </View>

        {/* Tips */}
        <View
          style={tw.style(`border rounded-xl p-4 mb-6`, {
            backgroundColor: `${Colors.info}10`,
            borderColor: Colors.info,
          })}
        >
          <Text
            style={tw.style(`text-sm font-semibold mb-2`, {
              color: Colors.info,
            })}
          >
            💡 Tips Menabung
          </Text>
          <Text style={tw.style(`text-xs mb-1`, { color: Colors.info })}>
            • <Text style={tw.style(`font-medium`)}>Dana Darurat</Text>: 3-6
            bulan pengeluaran
          </Text>
          <Text style={tw.style(`text-xs mb-1`, { color: Colors.info })}>
            • <Text style={tw.style(`font-medium`)}>50/30/20 Rule</Text>: 50%
            kebutuhan, 30% keinginan, 20% tabungan
          </Text>
          <Text style={tw.style(`text-xs mb-1`, { color: Colors.info })}>
            • <Text style={tw.style(`font-medium`)}>Pay Yourself First</Text>:
            Sisihkan tabungan diawal bulan
          </Text>
          <Text style={tw.style(`text-xs`, { color: Colors.info })}>
            • <Text style={tw.style(`font-medium`)}>Automate</Text>: Set
            autodebit untuk tabungan rutin
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={tw`flex-row gap-3`}>
          <TouchableOpacity
            style={[
              tw`flex-1 py-3 rounded-lg items-center`,
              !name || !target || loading
                ? { backgroundColor: Colors.textTertiary }
                : { backgroundColor: Colors.accent },
            ]}
            onPress={handleSubmit}
            disabled={!name || !target || loading}
          >
            {loading ? (
              <Text
                style={tw.style(`font-medium`, { color: Colors.textPrimary })}
              >
                Menyimpan...
              </Text>
            ) : (
              <Text
                style={tw.style(`font-medium`, { color: Colors.textPrimary })}
              >
                {isEditMode ? "Simpan Perubahan" : "Simpan Tabungan"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          style={tw.style(
            `py-3 border rounded-lg items-center mt-3 active:opacity-80`,
            {
              borderColor: Colors.border,
              backgroundColor: Colors.surface,
            }
          )}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={tw.style({ color: Colors.textPrimary })}>Batal</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Calendar Modal */}
      {renderCalendarModal()}
    </View>
  );
};

export default AddSavingsScreen;
