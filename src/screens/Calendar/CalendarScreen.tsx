// File: src/screens/Calendar/CalendarScreen.tsx - FIXED VERSION WITH NAVY BLUE THEME
import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";

// FIXED IMPORTS
import { useAppContext } from "../../context/AppContext";
import { formatCurrency } from "../../utils/calculations";
import {
  getBusiestDays,
  getHighestSpendingDays,
  generateCalendarInsights,
} from "../../utils/calendarCalculations";
import { Colors } from "../../theme/theme";

// Type definition untuk IconName
type IconName = keyof typeof Ionicons.glyphMap;

// GUNAKAN WARNA DARI TEMA NAVY BLUE
const PRIMARY_COLOR = Colors.primary; // "#0F172A" - Navy blue gelap
const ACCENT_COLOR = Colors.accent; // "#22D3EE" - Cyan terang
const BACKGROUND_COLOR = Colors.background; // "#0F172A" - Background navy blue gelap
const SURFACE_COLOR = Colors.surface; // "#1E293B" - Permukaan navy blue medium
const TEXT_PRIMARY = Colors.textPrimary; // "#F8FAFC" - Teks utama putih
const TEXT_SECONDARY = Colors.textSecondary; // "#CBD5E1" - Teks sekunder abu-abu muda
const BORDER_COLOR = Colors.border; // "#334155" - Border navy blue lebih terang
const SUCCESS_COLOR = Colors.success; // "#10B981" - Hijau
const WARNING_COLOR = Colors.warning; // "#F59E0B" - Kuning
const ERROR_COLOR = Colors.error; // "#EF4444" - Merah
const INFO_COLOR = Colors.info; // "#3B82F6" - Biru terang
const PURPLE_COLOR = Colors.purple || "#8B5CF6"; // Ungu

const CalendarScreen: React.FC = () => {
  const { state } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [showDayDetail, setShowDayDetail] = useState<boolean>(false);

  // Format marked dates from transactions
  const markedDates = useMemo(() => {
    const marks: any = {};

    state.transactions.forEach((transaction) => {
      const date = transaction.date;

      if (!marks[date]) {
        marks[date] = {
          marked: true,
          dotColor: transaction.type === "income" ? SUCCESS_COLOR : ERROR_COLOR,
          selected: date === selectedDate,
          selectedColor: ACCENT_COLOR,
        };
      } else {
        // Jika sudah ada transaksi di tanggal itu, kasih dot warna ungu
        marks[date].dotColor = PURPLE_COLOR;
      }
    });

    // Highlight selected date
    if (marks[selectedDate]) {
      marks[selectedDate].selected = true;
      marks[selectedDate].selectedColor = ACCENT_COLOR;
    }

    return marks;
  }, [state.transactions, selectedDate]);

  // Get transactions for selected date
  const selectedDayTransactions = useMemo(() => {
    return state.transactions.filter((t) => t.date === selectedDate);
  }, [state.transactions, selectedDate]);

  // Calculate totals for selected day
  const selectedDayTotals = useMemo(() => {
    let income = 0;
    let expense = 0;

    selectedDayTransactions.forEach((t) => {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    });

    return { income, expense, net: income - expense };
  }, [selectedDayTransactions]);

  // Calculate monthly overview
  const monthlyOverview = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthTransactions = state.transactions.filter((t) => {
      const date = new Date(t.date);
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const daysWithTransactions = new Set<string>();

    monthTransactions.forEach((t) => {
      daysWithTransactions.add(t.date);
      if (t.type === "income") totalIncome += t.amount;
      else totalExpense += t.amount;
    });

    return {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      transactionDays: daysWithTransactions.size,
      totalTransactions: monthTransactions.length,
    };
  }, [state.transactions]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    if (selectedDayTransactions.length > 0) {
      setShowDayDetail(true);
    }
  };

  const getDaySummaryColor = () => {
    if (selectedDayTotals.net > 0) return SUCCESS_COLOR;
    if (selectedDayTotals.net < 0) return ERROR_COLOR;
    return TEXT_SECONDARY;
  };

  // Calendar insights
  const calendarInsights = useMemo(() => {
    return generateCalendarInsights(state.transactions);
  }, [state.transactions]);

  // Busiest days and highest spending days
  const busiestDays = useMemo(() => {
    return getBusiestDays(state.transactions, 3);
  }, [state.transactions]);

  const highestSpendingDays = useMemo(() => {
    return getHighestSpendingDays(state.transactions, 3);
  }, [state.transactions]);

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-24`}
      >
        {/* Header */}

        {/* Monthly Stats */}
        <View style={tw`px-5 mb-6 pt-5`}>
          <View
            style={[
              tw`rounded-2xl p-4`,
              {
                backgroundColor: SURFACE_COLOR,
                borderWidth: 1,
                borderColor: BORDER_COLOR,
              },
            ]}
          >
            <Text
              style={[
                tw`text-xs font-medium mb-3 uppercase tracking-wider`,
                { color: TEXT_SECONDARY },
              ]}
            >
              Overview Bulan Ini
            </Text>

            <View style={tw`flex-row justify-between mb-3`}>
              <View>
                <Text style={[tw`text-xs mb-1`, { color: TEXT_SECONDARY }]}>
                  Pemasukan
                </Text>
                <Text style={[tw`text-lg font-bold`, { color: SUCCESS_COLOR }]}>
                  {formatCurrency(monthlyOverview.totalIncome)}
                </Text>
              </View>

              <View>
                <Text style={[tw`text-xs mb-1`, { color: TEXT_SECONDARY }]}>
                  Pengeluaran
                </Text>
                <Text style={[tw`text-lg font-bold`, { color: ERROR_COLOR }]}>
                  {formatCurrency(monthlyOverview.totalExpense)}
                </Text>
              </View>

              <View>
                <Text style={[tw`text-xs mb-1`, { color: TEXT_SECONDARY }]}>
                  Bersih
                </Text>
                <Text
                  style={[
                    tw`text-lg font-bold`,
                    {
                      color:
                        monthlyOverview.net >= 0 ? SUCCESS_COLOR : ERROR_COLOR,
                    },
                  ]}
                >
                  {formatCurrency(monthlyOverview.net)}
                </Text>
              </View>
            </View>

            <View
              style={[
                tw`flex-row justify-between pt-3`,
                { borderTopWidth: 1, borderTopColor: BORDER_COLOR },
              ]}
            >
              <View style={tw`items-center`}>
                <Text
                  style={[tw`text-sm font-medium`, { color: TEXT_PRIMARY }]}
                >
                  {monthlyOverview.transactionDays}
                </Text>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  Hari Aktif
                </Text>
              </View>

              <View style={[tw`w-px h-8`, { backgroundColor: BORDER_COLOR }]} />

              <View style={tw`items-center`}>
                <Text
                  style={[tw`text-sm font-medium`, { color: TEXT_PRIMARY }]}
                >
                  {monthlyOverview.totalTransactions}
                </Text>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  Transaksi
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Calendar */}
        <View style={tw`px-5 mb-6`}>
          <View
            style={[
              tw`rounded-2xl overflow-hidden`,
              {
                backgroundColor: SURFACE_COLOR,
                borderWidth: 1,
                borderColor: BORDER_COLOR,
              },
            ]}
          >
            <Calendar
              current={selectedDate}
              onDayPress={handleDayPress}
              markedDates={markedDates}
              theme={{
                backgroundColor: SURFACE_COLOR,
                calendarBackground: SURFACE_COLOR,
                textSectionTitleColor: ACCENT_COLOR,
                selectedDayBackgroundColor: ACCENT_COLOR,
                selectedDayTextColor: "#FFFFFF",
                todayTextColor: ACCENT_COLOR,
                dayTextColor: TEXT_PRIMARY,
                textDisabledColor: Colors.textTertiary,
                dotColor: ACCENT_COLOR,
                selectedDotColor: "#FFFFFF",
                arrowColor: ACCENT_COLOR,
                monthTextColor: TEXT_PRIMARY,
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 13,
              }}
              style={tw`rounded-2xl`}
            />
          </View>
        </View>

        {/* Insights Section */}
        {calendarInsights.length > 0 && (
          <View style={tw`px-5 mb-6`}>
            <Text
              style={[tw`text-lg font-semibold mb-3`, { color: TEXT_PRIMARY }]}
            >
              Insights Kalender
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={tw`pr-5`}
            >
              {calendarInsights.map((insight, index) => (
                <View
                  key={index}
                  style={[
                    tw`w-64 rounded-xl p-4 mr-3`,
                    {
                      backgroundColor: SURFACE_COLOR,
                      borderWidth: 1,
                      borderColor: BORDER_COLOR,
                    },
                    insight.type === "warning" && {
                      backgroundColor: Colors.error + "10",
                      borderColor: Colors.error + "30",
                    },
                    insight.type === "info" && {
                      backgroundColor: Colors.info + "10",
                      borderColor: Colors.info + "30",
                    },
                    insight.type === "success" && {
                      backgroundColor: Colors.success + "10",
                      borderColor: Colors.success + "30",
                    },
                  ]}
                >
                  <View style={tw`flex-row items-center mb-2`}>
                    <View
                      style={[
                        tw`w-8 h-8 rounded-lg items-center justify-center mr-2`,
                        insight.type === "warning" && {
                          backgroundColor: Colors.error + "20",
                        },
                        insight.type === "info" && {
                          backgroundColor: Colors.info + "20",
                        },
                        insight.type === "success" && {
                          backgroundColor: Colors.success + "20",
                        },
                      ]}
                    >
                      <Ionicons
                        name={insight.icon as IconName}
                        size={16}
                        color={
                          insight.type === "warning"
                            ? ERROR_COLOR
                            : insight.type === "info"
                            ? INFO_COLOR
                            : SUCCESS_COLOR
                        }
                      />
                    </View>
                    <Text
                      style={[
                        tw`text-sm font-semibold flex-1`,
                        insight.type === "warning" && { color: ERROR_COLOR },
                        insight.type === "info" && { color: INFO_COLOR },
                        insight.type === "success" && { color: SUCCESS_COLOR },
                      ]}
                    >
                      {insight.title}
                    </Text>
                  </View>
                  <Text
                    style={[
                      tw`text-xs`,
                      insight.type === "warning" && { color: ERROR_COLOR },
                      insight.type === "info" && { color: INFO_COLOR },
                      insight.type === "success" && { color: SUCCESS_COLOR },
                    ]}
                  >
                    {insight.message}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Stats Grid */}
        <View style={tw`px-5 mb-6`}>
          <View style={tw`flex-row flex-wrap -mx-1`}>
            {/* Busiest Days */}
            <View style={tw`w-1/2 px-1 mb-2`}>
              <View
                style={[
                  tw`rounded-xl p-3`,
                  {
                    backgroundColor: SURFACE_COLOR,
                    borderWidth: 1,
                    borderColor: BORDER_COLOR,
                  },
                ]}
              >
                <Text
                  style={[
                    tw`text-sm font-medium mb-2`,
                    { color: TEXT_PRIMARY },
                  ]}
                >
                  Hari Teraktif
                </Text>
                {busiestDays.map((day, index) => (
                  <View
                    key={index}
                    style={tw`flex-row justify-between items-center py-1`}
                  >
                    <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                      {new Date(day.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>
                    <View style={tw`flex-row items-center`}>
                      <Text
                        style={[
                          tw`text-xs font-medium mr-1`,
                          { color: TEXT_PRIMARY },
                        ]}
                      >
                        {day.count}x
                      </Text>
                      <Ionicons name="pulse" size={12} color={ACCENT_COLOR} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Highest Spending Days */}
            <View style={tw`w-1/2 px-1 mb-2`}>
              <View
                style={[
                  tw`rounded-xl p-3`,
                  {
                    backgroundColor: SURFACE_COLOR,
                    borderWidth: 1,
                    borderColor: BORDER_COLOR,
                  },
                ]}
              >
                <Text
                  style={[
                    tw`text-sm font-medium mb-2`,
                    { color: TEXT_PRIMARY },
                  ]}
                >
                  Pengeluaran Tertinggi
                </Text>
                {highestSpendingDays.map((day, index) => (
                  <View
                    key={index}
                    style={tw`flex-row justify-between items-center py-1`}
                  >
                    <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                      {new Date(day.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>
                    <Text
                      style={[tw`text-xs font-medium`, { color: ERROR_COLOR }]}
                    >
                      {formatCurrency(day.expense).replace("Rp", "")}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Selected Day Summary */}
        <View style={tw`px-5`}>
          <TouchableOpacity
            style={[
              tw`rounded-2xl p-4`,
              {
                backgroundColor: SURFACE_COLOR,
                borderWidth: 1,
                borderColor: BORDER_COLOR,
              },
            ]}
            onPress={() => setShowDayDetail(true)}
            disabled={selectedDayTransactions.length === 0}
            activeOpacity={0.7}
          >
            <View style={tw`flex-row justify-between items-center mb-3`}>
              <Text
                style={[tw`text-lg font-semibold`, { color: TEXT_PRIMARY }]}
              >
                {new Date(selectedDate).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>

              {selectedDayTransactions.length > 0 ? (
                <View style={tw`flex-row items-center`}>
                  <Text
                    style={[
                      tw`text-sm font-medium mr-2`,
                      { color: getDaySummaryColor() },
                    ]}
                  >
                    {formatCurrency(selectedDayTotals.net)}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={TEXT_SECONDARY}
                  />
                </View>
              ) : (
                <Text style={[tw`text-sm`, { color: Colors.textTertiary }]}>
                  Tidak ada transaksi
                </Text>
              )}
            </View>

            {selectedDayTransactions.length > 0 ? (
              <View style={tw`flex-row justify-between`}>
                <View style={tw`items-center flex-1`}>
                  <Text
                    style={[tw`text-lg font-bold`, { color: SUCCESS_COLOR }]}
                  >
                    {formatCurrency(selectedDayTotals.income)}
                  </Text>
                  <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                    Pemasukan
                  </Text>
                </View>

                <View
                  style={[tw`w-px h-10`, { backgroundColor: BORDER_COLOR }]}
                />

                <View style={tw`items-center flex-1`}>
                  <Text style={[tw`text-lg font-bold`, { color: ERROR_COLOR }]}>
                    {formatCurrency(selectedDayTotals.expense)}
                  </Text>
                  <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                    Pengeluaran
                  </Text>
                </View>
              </View>
            ) : (
              <View style={tw`items-center py-4`}>
                <Ionicons
                  name="calendar-outline"
                  size={32}
                  color={Colors.textTertiary}
                  style={tw`mb-2`}
                />
                <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
                  Tidak ada transaksi di tanggal ini
                </Text>
                <Text
                  style={[tw`text-xs mt-1`, { color: Colors.textTertiary }]}
                >
                  Tap tanggal lain yang memiliki indikator
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={tw`px-5 mt-6`}>
          <View
            style={[
              tw`rounded-xl p-3`,
              {
                backgroundColor: SURFACE_COLOR,
                borderWidth: 1,
                borderColor: BORDER_COLOR,
              },
            ]}
          >
            <Text
              style={[tw`text-xs font-medium mb-2`, { color: TEXT_SECONDARY }]}
            >
              Kode Warna Kalender
            </Text>

            <View style={tw`flex-row flex-wrap gap-3`}>
              <View style={tw`flex-row items-center`}>
                <View
                  style={[
                    tw`w-3 h-3 rounded-full mr-2`,
                    { backgroundColor: SUCCESS_COLOR },
                  ]}
                />
                <Text style={[tw`text-xs`, { color: TEXT_PRIMARY }]}>
                  Pemasukan
                </Text>
              </View>

              <View style={tw`flex-row items-center`}>
                <View
                  style={[
                    tw`w-3 h-3 rounded-full mr-2`,
                    { backgroundColor: ERROR_COLOR },
                  ]}
                />
                <Text style={[tw`text-xs`, { color: TEXT_PRIMARY }]}>
                  Pengeluaran
                </Text>
              </View>

              <View style={tw`flex-row items-center`}>
                <View
                  style={[
                    tw`w-3 h-3 rounded-full mr-2`,
                    { backgroundColor: PURPLE_COLOR },
                  ]}
                />
                <Text style={[tw`text-xs`, { color: TEXT_PRIMARY }]}>
                  Keduanya
                </Text>
              </View>

              <View style={tw`flex-row items-center`}>
                <View
                  style={[
                    tw`w-3 h-3 rounded-full mr-2`,
                    { backgroundColor: ACCENT_COLOR },
                  ]}
                />
                <Text style={[tw`text-xs`, { color: TEXT_PRIMARY }]}>
                  Dipilih
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Day Detail Modal */}
      <Modal
        visible={showDayDetail}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDayDetail(false)}
      >
        <View style={tw`flex-1 bg-black/50 justify-end`}>
          <View
            style={[
              tw`rounded-t-3xl max-h-3/4`,
              { backgroundColor: SURFACE_COLOR },
            ]}
          >
            <View
              style={[
                tw`p-5`,
                { borderBottomWidth: 1, borderBottomColor: BORDER_COLOR },
              ]}
            >
              <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text style={[tw`text-xl font-bold`, { color: TEXT_PRIMARY }]}>
                  Detail Transaksi
                </Text>
                <TouchableOpacity onPress={() => setShowDayDetail(false)}>
                  <Ionicons name="close" size={24} color={TEXT_SECONDARY} />
                </TouchableOpacity>
              </View>

              <Text style={[tw``, { color: TEXT_SECONDARY }]}>
                {new Date(selectedDate).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>

              <View style={tw`flex-row mt-3`}>
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                    Total Pemasukan
                  </Text>
                  <Text
                    style={[tw`text-lg font-bold`, { color: SUCCESS_COLOR }]}
                  >
                    {formatCurrency(selectedDayTotals.income)}
                  </Text>
                </View>

                <View style={tw`flex-1`}>
                  <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                    Total Pengeluaran
                  </Text>
                  <Text style={[tw`text-lg font-bold`, { color: ERROR_COLOR }]}>
                    {formatCurrency(selectedDayTotals.expense)}
                  </Text>
                </View>
              </View>
            </View>

            <ScrollView style={tw`p-5`}>
              {selectedDayTransactions.length > 0 ? (
                selectedDayTransactions.map((transaction) => (
                  <View
                    key={transaction.id}
                    style={[
                      tw`flex-row justify-between items-center py-3`,
                      { borderBottomWidth: 1, borderBottomColor: BORDER_COLOR },
                    ]}
                  >
                    <View style={tw`flex-1`}>
                      <Text style={[tw`font-medium`, { color: TEXT_PRIMARY }]}>
                        {transaction.category}
                      </Text>
                      <Text
                        style={[tw`text-xs mt-0.5`, { color: TEXT_SECONDARY }]}
                      >
                        {transaction.description || "Tidak ada deskripsi"}
                      </Text>
                    </View>

                    <Text
                      style={[
                        tw`font-semibold`,
                        transaction.type === "income"
                          ? { color: SUCCESS_COLOR }
                          : { color: ERROR_COLOR },
                      ]}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={tw`items-center py-10`}>
                  <Ionicons
                    name="receipt-outline"
                    size={48}
                    color={BORDER_COLOR}
                    style={tw`mb-3`}
                  />
                  <Text style={[tw``, { color: TEXT_SECONDARY }]}>
                    Tidak ada transaksi di tanggal ini
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CalendarScreen;
