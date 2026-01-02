// File: src/screens/Calendar/CalendarScreen.tsx - FIXED VERSION
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
  calculateDailyTotals,
  getMonthlyTransactions,
  getWeeklyTransactions,
  getBusiestDays,
  getHighestSpendingDays,
  generateCalendarInsights,
} from "../../utils/calendarCalculations";

// Type definition untuk IconName
type IconName = keyof typeof Ionicons.glyphMap;

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
          dotColor: transaction.type === "income" ? "#10B981" : "#EF4444",
          selected: date === selectedDate,
          selectedColor: "#4F46E5",
        };
      } else {
        // Jika sudah ada transaksi di tanggal itu, kasih dot warna ungu
        marks[date].dotColor = "#8B5CF6";
      }
    });

    // Highlight selected date
    if (marks[selectedDate]) {
      marks[selectedDate].selected = true;
      marks[selectedDate].selectedColor = "#4F46E5";
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
    if (selectedDayTotals.net > 0) return "#10B981";
    if (selectedDayTotals.net < 0) return "#EF4444";
    return "#6B7280";
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
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-24`}
      >
        {/* Header */}
        <View style={tw`px-5 pt-3 pb-4`}>
          <Text style={tw`text-gray-800 text-2xl font-bold mb-1`}>
            Kalender Keuangan
          </Text>
          <Text style={tw`text-gray-500 text-sm`}>
            Pantau aktivitas keuangan berdasarkan waktu
          </Text>
        </View>

        {/* Monthly Stats */}
        <View style={tw`px-5 mb-6`}>
          <View style={tw`bg-white rounded-2xl p-4 border border-gray-100`}>
            <Text
              style={tw`text-gray-600 text-xs font-medium mb-3 uppercase tracking-wider`}
            >
              Overview Bulan Ini
            </Text>

            <View style={tw`flex-row justify-between mb-3`}>
              <View>
                <Text style={tw`text-gray-500 text-xs mb-1`}>Pemasukan</Text>
                <Text style={tw`text-emerald-600 text-lg font-bold`}>
                  {formatCurrency(monthlyOverview.totalIncome)}
                </Text>
              </View>

              <View>
                <Text style={tw`text-gray-500 text-xs mb-1`}>Pengeluaran</Text>
                <Text style={tw`text-red-500 text-lg font-bold`}>
                  {formatCurrency(monthlyOverview.totalExpense)}
                </Text>
              </View>

              <View>
                <Text style={tw`text-gray-500 text-xs mb-1`}>Bersih</Text>
                <Text
                  style={[
                    tw`text-lg font-bold`,
                    { color: monthlyOverview.net >= 0 ? "#10B981" : "#EF4444" },
                  ]}
                >
                  {formatCurrency(monthlyOverview.net)}
                </Text>
              </View>
            </View>

            <View
              style={tw`flex-row justify-between pt-3 border-t border-gray-100`}
            >
              <View style={tw`items-center`}>
                <Text style={tw`text-gray-700 text-sm font-medium`}>
                  {monthlyOverview.transactionDays}
                </Text>
                <Text style={tw`text-gray-500 text-xs`}>Hari Aktif</Text>
              </View>

              <View style={tw`w-px h-8 bg-gray-200`} />

              <View style={tw`items-center`}>
                <Text style={tw`text-gray-700 text-sm font-medium`}>
                  {monthlyOverview.totalTransactions}
                </Text>
                <Text style={tw`text-gray-500 text-xs`}>Transaksi</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Calendar */}
        <View style={tw`px-5 mb-6`}>
          <View
            style={tw`bg-white rounded-2xl overflow-hidden border border-gray-100`}
          >
            <Calendar
              current={selectedDate}
              onDayPress={handleDayPress}
              markedDates={markedDates}
              theme={{
                backgroundColor: "#FFFFFF",
                calendarBackground: "#FFFFFF",
                textSectionTitleColor: "#4F46E5",
                selectedDayBackgroundColor: "#4F46E5",
                selectedDayTextColor: "#FFFFFF",
                todayTextColor: "#4F46E5",
                dayTextColor: "#111827",
                textDisabledColor: "#D1D5DB",
                dotColor: "#4F46E5",
                selectedDotColor: "#FFFFFF",
                arrowColor: "#4F46E5",
                monthTextColor: "#111827",
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
            <Text style={tw`text-gray-800 text-lg font-semibold mb-3`}>
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
                    insight.type === "warning" &&
                      tw`bg-red-50 border border-red-100`,
                    insight.type === "info" &&
                      tw`bg-blue-50 border border-blue-100`,
                    insight.type === "success" &&
                      tw`bg-emerald-50 border border-emerald-100`,
                  ]}
                >
                  <View style={tw`flex-row items-center mb-2`}>
                    <View
                      style={[
                        tw`w-8 h-8 rounded-lg items-center justify-center mr-2`,
                        insight.type === "warning" && tw`bg-red-100`,
                        insight.type === "info" && tw`bg-blue-100`,
                        insight.type === "success" && tw`bg-emerald-100`,
                      ]}
                    >
                      <Ionicons
                        name={insight.icon as IconName}
                        size={16}
                        color={
                          insight.type === "warning"
                            ? "#EF4444"
                            : insight.type === "info"
                            ? "#3B82F6"
                            : "#10B981"
                        }
                      />
                    </View>
                    <Text
                      style={[
                        tw`text-sm font-semibold flex-1`,
                        insight.type === "warning" && tw`text-red-700`,
                        insight.type === "info" && tw`text-blue-700`,
                        insight.type === "success" && tw`text-emerald-700`,
                      ]}
                    >
                      {insight.title}
                    </Text>
                  </View>
                  <Text
                    style={[
                      tw`text-xs`,
                      insight.type === "warning" && tw`text-red-600`,
                      insight.type === "info" && tw`text-blue-600`,
                      insight.type === "success" && tw`text-emerald-600`,
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
              <View style={tw`bg-white rounded-xl p-3 border border-gray-100`}>
                <Text style={tw`text-gray-700 text-sm font-medium mb-2`}>
                  Hari Teraktif
                </Text>
                {busiestDays.map((day, index) => (
                  <View
                    key={index}
                    style={tw`flex-row justify-between items-center py-1`}
                  >
                    <Text style={tw`text-gray-600 text-xs`}>
                      {new Date(day.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>
                    <View style={tw`flex-row items-center`}>
                      <Text style={tw`text-gray-800 text-xs font-medium mr-1`}>
                        {day.count}x
                      </Text>
                      <Ionicons name="pulse" size={12} color="#4F46E5" />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Highest Spending Days */}
            <View style={tw`w-1/2 px-1 mb-2`}>
              <View style={tw`bg-white rounded-xl p-3 border border-gray-100`}>
                <Text style={tw`text-gray-700 text-sm font-medium mb-2`}>
                  Pengeluaran Tertinggi
                </Text>
                {highestSpendingDays.map((day, index) => (
                  <View
                    key={index}
                    style={tw`flex-row justify-between items-center py-1`}
                  >
                    <Text style={tw`text-gray-600 text-xs`}>
                      {new Date(day.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>
                    <Text style={tw`text-red-500 text-xs font-medium`}>
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
            style={tw`bg-white rounded-2xl p-4 border border-gray-100`}
            onPress={() => setShowDayDetail(true)}
            disabled={selectedDayTransactions.length === 0}
            activeOpacity={0.7}
          >
            <View style={tw`flex-row justify-between items-center mb-3`}>
              <Text style={tw`text-gray-800 text-lg font-semibold`}>
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
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </View>
              ) : (
                <Text style={tw`text-gray-400 text-sm`}>
                  Tidak ada transaksi
                </Text>
              )}
            </View>

            {selectedDayTransactions.length > 0 ? (
              <View style={tw`flex-row justify-between`}>
                <View style={tw`items-center flex-1`}>
                  <Text style={tw`text-emerald-600 text-lg font-bold`}>
                    {formatCurrency(selectedDayTotals.income)}
                  </Text>
                  <Text style={tw`text-gray-500 text-xs`}>Pemasukan</Text>
                </View>

                <View style={tw`w-px h-10 bg-gray-200`} />

                <View style={tw`items-center flex-1`}>
                  <Text style={tw`text-red-500 text-lg font-bold`}>
                    {formatCurrency(selectedDayTotals.expense)}
                  </Text>
                  <Text style={tw`text-gray-500 text-xs`}>Pengeluaran</Text>
                </View>
              </View>
            ) : (
              <View style={tw`items-center py-4`}>
                <Ionicons
                  name="calendar-outline"
                  size={32}
                  color="#9CA3AF"
                  style={tw`mb-2`}
                />
                <Text style={tw`text-gray-500 text-sm`}>
                  Tidak ada transaksi di tanggal ini
                </Text>
                <Text style={tw`text-gray-400 text-xs mt-1`}>
                  Tap tanggal lain yang memiliki indikator
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={tw`px-5 mt-6`}>
          <View style={tw`bg-white rounded-xl p-3 border border-gray-100`}>
            <Text style={tw`text-gray-600 text-xs font-medium mb-2`}>
              Kode Warna Kalender
            </Text>

            <View style={tw`flex-row flex-wrap gap-3`}>
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-3 h-3 rounded-full bg-emerald-500 mr-2`} />
                <Text style={tw`text-gray-700 text-xs`}>Pemasukan</Text>
              </View>

              <View style={tw`flex-row items-center`}>
                <View style={tw`w-3 h-3 rounded-full bg-red-500 mr-2`} />
                <Text style={tw`text-gray-700 text-xs`}>Pengeluaran</Text>
              </View>

              <View style={tw`flex-row items-center`}>
                <View style={tw`w-3 h-3 rounded-full bg-purple-500 mr-2`} />
                <Text style={tw`text-gray-700 text-xs`}>Keduanya</Text>
              </View>

              <View style={tw`flex-row items-center`}>
                <View style={tw`w-3 h-3 rounded-full bg-indigo-500 mr-2`} />
                <Text style={tw`text-gray-700 text-xs`}>Dipilih</Text>
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
          <View style={tw`bg-white rounded-t-3xl max-h-3/4`}>
            <View style={tw`p-5 border-b border-gray-100`}>
              <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text style={tw`text-gray-800 text-xl font-bold`}>
                  Detail Transaksi
                </Text>
                <TouchableOpacity onPress={() => setShowDayDetail(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <Text style={tw`text-gray-600`}>
                {new Date(selectedDate).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>

              <View style={tw`flex-row mt-3`}>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-gray-500 text-xs`}>Total Pemasukan</Text>
                  <Text style={tw`text-emerald-600 text-lg font-bold`}>
                    {formatCurrency(selectedDayTotals.income)}
                  </Text>
                </View>

                <View style={tw`flex-1`}>
                  <Text style={tw`text-gray-500 text-xs`}>
                    Total Pengeluaran
                  </Text>
                  <Text style={tw`text-red-500 text-lg font-bold`}>
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
                    style={tw`flex-row justify-between items-center py-3 border-b border-gray-100`}
                  >
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-gray-800 font-medium`}>
                        {transaction.category}
                      </Text>
                      <Text style={tw`text-gray-500 text-xs mt-0.5`}>
                        {transaction.description || "Tidak ada deskripsi"}
                      </Text>
                    </View>

                    <Text
                      style={[
                        tw`font-semibold`,
                        transaction.type === "income"
                          ? tw`text-emerald-600`
                          : tw`text-red-500`,
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
                    color="#D1D5DB"
                    style={tw`mb-3`}
                  />
                  <Text style={tw`text-gray-500`}>
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
