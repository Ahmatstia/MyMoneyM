// File: src/screens/AddSavingsTransactionScreen.tsx - FIXED VERSION
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

const AddSavingsTransactionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { savingsId, type = "deposit" } = route.params;

  const { state, addSavingsTransaction } = useAppContext();
  const [loading, setLoading] = useState(false);

  // Temukan savings berdasarkan ID
  const saving = state.savings?.find((s) => s.id === savingsId);

  if (!saving) {
    return (
      <View
        style={tw.style("flex-1 justify-center items-center p-4", {
          backgroundColor: Colors.background,
        })}
      >
        <Ionicons name="warning-outline" size={48} color={Colors.error} />
        <Text
          style={tw.style("text-lg font-semibold mt-4 mb-2", {
            color: Colors.textPrimary,
          })}
        >
          Tabungan tidak ditemukan
        </Text>
        <TouchableOpacity
          style={tw.style("mt-4 px-4 py-2 rounded-lg", {
            backgroundColor: Colors.accent,
          })}
          onPress={() => navigation.goBack()}
        >
          <Text style={tw.style("font-medium", { color: Colors.textPrimary })}>
            Kembali
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // State form
  const [transactionType, setTransactionType] = useState<
    "deposit" | "withdrawal"
  >(type);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(formatDate(new Date()));
  const [note, setNote] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  // Update title
  useEffect(() => {
    navigation.setOptions({
      title:
        transactionType === "deposit" ? "Tambah Setoran" : "Penarikan Dana",
      headerStyle: {
        backgroundColor: Colors.surface,
      },
      headerTintColor: Colors.textPrimary,
      headerTitleStyle: {
        fontWeight: "600",
      },
    });
  }, [transactionType, navigation]);

  // Format tanggal untuk display
  const formatDisplayDate = (dateStr: string): string => {
    try {
      const dateObj = parseDate(dateStr);
      return dateObj.toLocaleDateString("id-ID", {
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
    setShowCalendar(true);
  };

  const handleCalendarSelect = (selectedDate: any) => {
    setDate(selectedDate.dateString);
    setShowCalendar(false);
  };

  // Format input angka
  const handleAmountChange = (text: string) => {
    const cleanedText = text.replace(/[^0-9]/g, "");
    setAmount(cleanedText);
  };

  // Handle submit - FIXED VERSION
  const handleSubmit = async () => {
    const amountNum = safeNumber(parseFloat(amount));

    if (amountNum <= 0) {
      Alert.alert("Error", "Jumlah harus lebih dari 0");
      return;
    }

    if (transactionType === "withdrawal") {
      const currentBalance = safeNumber(saving.current);
      if (amountNum > currentBalance) {
        Alert.alert(
          "Error",
          `Jumlah penarikan melebihi saldo (${formatCurrency(currentBalance)})`
        );
        return;
      }
    }

    setLoading(true);
    try {
      // Panggil fungsi dari context untuk menambahkan transaksi
      await addSavingsTransaction(saving.id, {
        type: transactionType,
        amount: amountNum,
        date,
        note,
      });

      Alert.alert(
        "Sukses",
        `${
          transactionType === "deposit" ? "Setoran" : "Penarikan"
        } berhasil ditambahkan`,
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("SavingsDetail", { savingsId }),
          },
        ]
      );
    } catch (error: any) {
      console.error("Error adding transaction:", error);
      Alert.alert("Error", error.message || "Gagal menambahkan transaksi");
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
        style={tw.style("flex-1 justify-center items-center", {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        })}
      >
        <View
          style={tw.style("rounded-xl p-4 w-11/12", {
            backgroundColor: Colors.surface,
          })}
        >
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text
              style={tw.style("text-lg font-semibold", {
                color: Colors.textPrimary,
              })}
            >
              Pilih Tanggal
            </Text>
            <TouchableOpacity onPress={() => setShowCalendar(false)}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Calendar
            current={date}
            onDayPress={handleCalendarSelect}
            markedDates={{
              [date]: {
                selected: true,
                selectedColor: Colors.accent,
              },
            }}
            maxDate={formatDate(new Date())}
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
            style={tw.style("rounded-lg", { backgroundColor: Colors.surface })}
          />

          <View style={tw`mt-4 flex-row justify-end`}>
            <TouchableOpacity
              style={tw.style("px-4 py-2 rounded-lg", {
                backgroundColor: Colors.accent,
              })}
              onPress={() => setShowCalendar(false)}
            >
              <Text
                style={tw.style("font-medium", { color: Colors.textPrimary })}
              >
                Selesai
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const currentBalance = safeNumber(saving.current);
  const maxWithdrawal = currentBalance;

  return (
    <View style={tw.style("flex-1", { backgroundColor: Colors.background })}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        {/* Savings Info */}
        <View
          style={tw.style("rounded-xl p-4 mb-6 border", {
            backgroundColor: Colors.surface,
            borderColor: Colors.border,
          })}
        >
          <View style={tw`flex-row items-center gap-3 mb-3`}>
            <View
              style={tw.style(
                "w-12 h-12 rounded-full items-center justify-center",
                {
                  backgroundColor: Colors.accent + "20",
                }
              )}
            >
              <Ionicons
                name={(saving.icon as any) || "wallet"}
                size={24}
                color={Colors.accent}
              />
            </View>
            <View style={tw`flex-1`}>
              <Text
                style={tw.style("text-base font-semibold", {
                  color: Colors.textPrimary,
                })}
              >
                {saving.name}
              </Text>
              <Text
                style={tw.style("text-sm", { color: Colors.textSecondary })}
              >
                Saldo saat ini: {formatCurrency(currentBalance)}
              </Text>
            </View>
          </View>

          <View style={tw`flex-row gap-2`}>
            <TouchableOpacity
              style={[
                tw.style("flex-1 py-2 rounded-lg items-center"),
                transactionType === "deposit"
                  ? { backgroundColor: Colors.success }
                  : { backgroundColor: Colors.surfaceLight },
              ]}
              onPress={() => setTransactionType("deposit")}
            >
              <Text
                style={[
                  tw.style("text-sm font-medium"),
                  transactionType === "deposit"
                    ? { color: Colors.textPrimary }
                    : { color: Colors.textSecondary },
                ]}
              >
                Setoran
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                tw.style("flex-1 py-2 rounded-lg items-center"),
                transactionType === "withdrawal"
                  ? { backgroundColor: Colors.error }
                  : { backgroundColor: Colors.surfaceLight },
              ]}
              onPress={() => setTransactionType("withdrawal")}
              disabled={currentBalance <= 0}
            >
              <Text
                style={[
                  tw.style("text-sm font-medium"),
                  transactionType === "withdrawal"
                    ? { color: Colors.textPrimary }
                    : currentBalance <= 0
                    ? { color: Colors.textTertiary }
                    : { color: Colors.textSecondary },
                ]}
              >
                Penarikan
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount Input */}
        <View style={tw`mb-6`}>
          <Text
            style={tw.style("text-sm font-medium mb-2", {
              color: Colors.textPrimary,
            })}
          >
            Jumlah *
          </Text>
          <View
            style={tw.style("flex-row items-center border rounded-lg px-3", {
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            })}
          >
            <Text style={tw.style("mr-2", { color: Colors.textSecondary })}>
              Rp
            </Text>
            <TextInput
              style={tw.style("flex-1 py-3 text-lg", {
                color: Colors.textPrimary,
              })}
              placeholder="0"
              placeholderTextColor={Colors.textTertiary}
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              maxLength={15}
            />
          </View>

          {/* Quick Amount Presets */}
          <View style={tw`mt-3`}>
            <Text
              style={tw.style("text-xs mb-2", { color: Colors.textSecondary })}
            >
              Pilih cepat:
            </Text>
            <View style={tw`flex-row flex-wrap gap-2`}>
              {transactionType === "deposit"
                ? [
                    { label: "50rb", value: "50000" },
                    { label: "100rb", value: "100000" },
                    { label: "200rb", value: "200000" },
                    { label: "500rb", value: "500000" },
                  ].map((preset) => (
                    <TouchableOpacity
                      key={preset.label}
                      style={tw.style(
                        "px-3 py-1.5 rounded-lg active:opacity-80",
                        {
                          backgroundColor: Colors.surfaceLight,
                        }
                      )}
                      onPress={() => setAmount(preset.value)}
                    >
                      <Text
                        style={tw.style("text-xs", {
                          color: Colors.textSecondary,
                        })}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  ))
                : [
                    { label: "50rb", value: "50000" },
                    { label: "100rb", value: "100000" },
                    { label: "200rb", value: "200000" },
                    {
                      label: `Semua (${formatCurrency(maxWithdrawal)})`,
                      value: maxWithdrawal.toString(),
                    },
                  ].map((preset) => (
                    <TouchableOpacity
                      key={preset.label}
                      style={[
                        tw.style("px-3 py-1.5 rounded-lg active:opacity-80", {
                          backgroundColor: Colors.surfaceLight,
                        }),
                        parseFloat(preset.value) > maxWithdrawal && {
                          opacity: 0.5,
                        },
                      ]}
                      onPress={() => {
                        if (parseFloat(preset.value) <= maxWithdrawal) {
                          setAmount(preset.value);
                        }
                      }}
                      disabled={parseFloat(preset.value) > maxWithdrawal}
                    >
                      <Text
                        style={tw.style("text-xs", {
                          color: Colors.textSecondary,
                        })}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
            </View>
          </View>

          {/* Balance Preview */}
          {amount && safeNumber(parseFloat(amount)) > 0 && (
            <View
              style={tw.style("mt-4 p-3 rounded-lg", {
                backgroundColor: Colors.info + "20",
              })}
            >
              <View style={tw`flex-row justify-between items-center`}>
                <Text
                  style={tw.style("text-sm font-medium", {
                    color: Colors.textPrimary,
                  })}
                >
                  Saldo saat ini:
                </Text>
                <Text
                  style={tw.style("text-sm font-medium", {
                    color: Colors.textPrimary,
                  })}
                >
                  {formatCurrency(currentBalance)}
                </Text>
              </View>

              <View style={tw`flex-row justify-between items-center mt-1`}>
                <Text
                  style={tw.style("text-sm font-medium", {
                    color: Colors.textPrimary,
                  })}
                >
                  {transactionType === "deposit" ? "+" : "-"}:
                </Text>
                <Text
                  style={tw.style(
                    "text-sm font-medium",
                    transactionType === "deposit"
                      ? { color: Colors.success }
                      : { color: Colors.error }
                  )}
                >
                  {formatCurrency(safeNumber(parseFloat(amount)))}
                </Text>
              </View>

              <View
                style={tw.style("h-px my-2", {
                  backgroundColor: Colors.border,
                })}
              />

              <View style={tw`flex-row justify-between items-center`}>
                <Text
                  style={tw.style("text-sm font-semibold", {
                    color: Colors.textPrimary,
                  })}
                >
                  Saldo baru:
                </Text>
                <Text
                  style={tw.style("text-sm font-semibold", {
                    color: Colors.textPrimary,
                  })}
                >
                  {formatCurrency(
                    transactionType === "deposit"
                      ? currentBalance + safeNumber(parseFloat(amount))
                      : currentBalance - safeNumber(parseFloat(amount))
                  )}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Date Selection */}
        <View style={tw`mb-6`}>
          <Text
            style={tw.style("text-sm font-medium mb-2", {
              color: Colors.textPrimary,
            })}
          >
            Tanggal Transaksi
          </Text>
          <TouchableOpacity
            style={tw.style(
              "flex-row items-center justify-between border rounded-lg px-3 py-3",
              {
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              }
            )}
            onPress={openCalendar}
          >
            <View style={tw`flex-row items-center`}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={Colors.accent}
                style={tw`mr-2`}
              />
              <Text style={tw.style({ color: Colors.textPrimary })}>
                {formatDisplayDate(date)}
              </Text>
            </View>
            <Ionicons
              name="chevron-down"
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Note Input */}
        <View style={tw`mb-6`}>
          <Text
            style={tw.style("text-sm font-medium mb-2", {
              color: Colors.textPrimary,
            })}
          >
            Catatan (Opsional)
          </Text>
          <TextInput
            style={tw.style("border rounded-lg px-3 py-3 min-h-[80px]", {
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
              color: Colors.textPrimary,
            })}
            placeholder="Tambahkan catatan..."
            placeholderTextColor={Colors.textTertiary}
            value={note}
            onChangeText={setNote}
            multiline
            textAlignVertical="top"
            maxLength={100}
          />
          <Text
            style={tw.style("text-xs mt-1 text-right", {
              color: Colors.textSecondary,
            })}
          >
            {note.length}/100 karakter
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={tw`flex-row gap-3`}>
          <TouchableOpacity
            style={[
              tw.style("flex-1 py-3 rounded-lg items-center"),
              !amount || loading
                ? { backgroundColor: Colors.textTertiary }
                : transactionType === "deposit"
                ? { backgroundColor: Colors.success }
                : { backgroundColor: Colors.error },
            ]}
            onPress={handleSubmit}
            disabled={!amount || loading}
          >
            {loading ? (
              <Text
                style={tw.style("font-medium", { color: Colors.textPrimary })}
              >
                Menyimpan...
              </Text>
            ) : (
              <Text
                style={tw.style("font-medium", { color: Colors.textPrimary })}
              >
                {transactionType === "deposit"
                  ? "Tambah Setoran"
                  : "Lakukan Penarikan"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          style={tw.style(
            "py-3 border rounded-lg items-center mt-3 active:opacity-80",
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

export default AddSavingsTransactionScreen;
