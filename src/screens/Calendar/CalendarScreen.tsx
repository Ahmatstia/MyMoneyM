// File: src/screens/Calendar/CalendarScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";

import { useAppContext } from "../../context/AppContext";
import { formatCurrency } from "../../utils/calculations";
import {
  getBusiestDays,
  getHighestSpendingDays,
  generateCalendarInsights,
} from "../../utils/calendarCalculations";
import { Colors } from "../../theme/theme";

type IconName = keyof typeof Ionicons.glyphMap;

// ─── Theme colors (tidak diubah) ──────────────────────────────────────────────
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR    = Colors.surface;
const TEXT_PRIMARY     = Colors.textPrimary;
const TEXT_SECONDARY   = Colors.textSecondary;
const ACCENT_COLOR     = Colors.accent;
const SUCCESS_COLOR    = Colors.success;
const WARNING_COLOR    = Colors.warning;
const ERROR_COLOR      = Colors.error;
const INFO_COLOR       = Colors.info;
const PURPLE_COLOR     = Colors.purple || "#8B5CF6";

// ─── Design tokens (konsisten dengan seluruh app) ─────────────────────────────
const CARD_RADIUS  = 20;
const INNER_RADIUS = 14;
const CARD_PAD     = 20;
const SECTION_GAP  = 24;
const CARD_BORDER  = "rgba(255,255,255,0.06)";

// ─── Komponen UI (konsisten) ──────────────────────────────────────────────────

const Spacer = ({ size = SECTION_GAP }: { size?: number }) => (
  <View style={{ height: size }} />
);

const SectionHeader = ({
  title,
  linkLabel,
  onPress,
}: {
  title: string;
  linkLabel?: string;
  onPress?: () => void;
}) => (
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View
        style={{
          width: 3,
          height: 13,
          backgroundColor: ACCENT_COLOR,
          borderRadius: 2,
          marginRight: 8,
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
        {title}
      </Text>
    </View>
    {linkLabel && onPress && (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Text style={{ color: ACCENT_COLOR, fontSize: 11, fontWeight: "600" }}>
          {linkLabel}
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

const Card = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) => (
  <View
    style={[
      {
        backgroundColor: SURFACE_COLOR,
        borderRadius: CARD_RADIUS,
        borderWidth: 1,
        borderColor: CARD_BORDER,
        padding: CARD_PAD,
      },
      style,
    ]}
  >
    {children}
  </View>
);

const VDivider = ({ height = 32 }: { height?: number }) => (
  <View
    style={{
      width: 1,
      height,
      backgroundColor: CARD_BORDER,
      marginHorizontal: 14,
    }}
  />
);

// ─── Main component ───────────────────────────────────────────────────────────

const CalendarScreen: React.FC = () => {
  const { state } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [showDayDetail, setShowDayDetail] = useState<boolean>(false);

  // ── Semua logika kalkulasi di bawah ini TIDAK DIUBAH ─────────────────────

  const markedDates = useMemo(() => {
    const marks: any = {};
    state.transactions.forEach((transaction) => {
      const date = transaction.date;
      if (!marks[date]) {
        marks[date] = {
          marked: true,
          dotColor:
            transaction.type === "income" ? SUCCESS_COLOR : ERROR_COLOR,
          selected: date === selectedDate,
          selectedColor: ACCENT_COLOR,
        };
      } else {
        marks[date].dotColor = PURPLE_COLOR;
      }
    });
    if (marks[selectedDate]) {
      marks[selectedDate].selected      = true;
      marks[selectedDate].selectedColor = ACCENT_COLOR;
    }
    return marks;
  }, [state.transactions, selectedDate]);

  const selectedDayTransactions = useMemo(
    () => state.transactions.filter((t) => t.date === selectedDate),
    [state.transactions, selectedDate]
  );

  const selectedDayTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    selectedDayTransactions.forEach((t) => {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    });
    return { income, expense, net: income - expense };
  }, [selectedDayTransactions]);

  const monthlyOverview = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear  = new Date().getFullYear();
    const monthTransactions = state.transactions.filter((t) => {
      const date = new Date(t.date);
      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
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
      transactionDays:    daysWithTransactions.size,
      totalTransactions:  monthTransactions.length,
    };
  }, [state.transactions]);

  const calendarInsights = useMemo(
    () => generateCalendarInsights(state.transactions),
    [state.transactions]
  );

  const busiestDays = useMemo(
    () => getBusiestDays(state.transactions, 3),
    [state.transactions]
  );

  const highestSpendingDays = useMemo(
    () => getHighestSpendingDays(state.transactions, 3),
    [state.transactions]
  );

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    const txs = state.transactions.filter((t) => t.date === day.dateString);
    if (txs.length > 0) setShowDayDetail(true);
  };

  const getDaySummaryColor = () => {
    if (selectedDayTotals.net > 0) return SUCCESS_COLOR;
    if (selectedDayTotals.net < 0) return ERROR_COLOR;
    return TEXT_SECONDARY;
  };

  const insightTypeColor = (type: string) =>
    type === "warning"
      ? ERROR_COLOR
      : type === "success"
      ? SUCCESS_COLOR
      : INFO_COLOR;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 100 }}
      >
        {/* ── Page header ─────────────────────────────────────────────── */}
        <View style={{ paddingTop: 16, paddingBottom: 20 }}>
          <Text
            style={{ color: TEXT_PRIMARY, fontSize: 20, fontWeight: "700" }}
          >
            Kalender
          </Text>
          <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 3 }}>
            {new Date().toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>

        {/* ── Monthly overview hero card ───────────────────────────────── */}
        <Card style={{ marginBottom: 20 }}>
          <Text
            style={{
              color: Colors.gray400,
              fontSize: 10,
              fontWeight: "700",
              letterSpacing: 1.2,
              textTransform: "uppercase",
              marginBottom: 5,
            }}
          >
            Overview Bulan Ini
          </Text>
          <Text
            style={{
              color:
                monthlyOverview.net >= 0 ? SUCCESS_COLOR : ERROR_COLOR,
              fontSize: 30,
              fontWeight: "800",
              letterSpacing: -0.5,
              marginBottom: 16,
            }}
          >
            {formatCurrency(monthlyOverview.net)}
          </Text>

          {/* Income / Expense row */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}
              >
                <View
                  style={{
                    width: 6, height: 6, borderRadius: 3,
                    backgroundColor: SUCCESS_COLOR, marginRight: 5,
                  }}
                />
                <Text
                  style={{
                    color: Colors.gray400, fontSize: 9,
                    textTransform: "uppercase", letterSpacing: 0.8,
                  }}
                >
                  Pemasukan
                </Text>
              </View>
              <Text
                style={{ color: SUCCESS_COLOR, fontSize: 14, fontWeight: "700" }}
              >
                {formatCurrency(monthlyOverview.totalIncome)}
              </Text>
            </View>

            <VDivider />

            <View style={{ flex: 1 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}
              >
                <View
                  style={{
                    width: 6, height: 6, borderRadius: 3,
                    backgroundColor: ERROR_COLOR, marginRight: 5,
                  }}
                />
                <Text
                  style={{
                    color: Colors.gray400, fontSize: 9,
                    textTransform: "uppercase", letterSpacing: 0.8,
                  }}
                >
                  Pengeluaran
                </Text>
              </View>
              <Text
                style={{ color: ERROR_COLOR, fontSize: 14, fontWeight: "700" }}
              >
                {formatCurrency(monthlyOverview.totalExpense)}
              </Text>
            </View>
          </View>

          {/* Divider + stats row */}
          <View
            style={{
              height: 1, backgroundColor: CARD_BORDER, marginBottom: 14,
            }}
          />
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  color: Colors.gray400, fontSize: 9,
                  textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4,
                }}
              >
                Hari Aktif
              </Text>
              <Text
                style={{ color: TEXT_PRIMARY, fontSize: 17, fontWeight: "700" }}
              >
                {monthlyOverview.transactionDays}
              </Text>
            </View>
            <View
              style={{ width: 1, height: 28, backgroundColor: CARD_BORDER }}
            />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  color: Colors.gray400, fontSize: 9,
                  textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4,
                }}
              >
                Transaksi
              </Text>
              <Text
                style={{ color: ACCENT_COLOR, fontSize: 17, fontWeight: "700" }}
              >
                {monthlyOverview.totalTransactions}
              </Text>
            </View>
          </View>
        </Card>

        {/* ── Calendar card ────────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: SURFACE_COLOR,
            borderRadius: CARD_RADIUS,
            borderWidth: 1,
            borderColor: CARD_BORDER,
            overflow: "hidden",
            marginBottom: 20,
          }}
        >
          <Calendar
            current={selectedDate}
            onDayPress={handleDayPress}
            markedDates={markedDates}
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
              textDayFontSize:            14,
              textMonthFontSize:          16,
              textDayHeaderFontSize:      12,
            }}
          />

          {/* Legend strip */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 16,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderTopWidth: 1,
              borderTopColor: CARD_BORDER,
            }}
          >
            {[
              { color: SUCCESS_COLOR, label: "Pemasukan" },
              { color: ERROR_COLOR,   label: "Pengeluaran" },
              { color: PURPLE_COLOR,  label: "Keduanya" },
              { color: ACCENT_COLOR,  label: "Dipilih" },
            ].map((item) => (
              <View
                key={item.label}
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <View
                  style={{
                    width: 7, height: 7, borderRadius: 4,
                    backgroundColor: item.color, marginRight: 5,
                  }}
                />
                <Text
                  style={{ color: Colors.gray400, fontSize: 10 }}
                >
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Selected day summary card ────────────────────────────────── */}
        <TouchableOpacity
          style={{
            backgroundColor: SURFACE_COLOR,
            borderRadius: CARD_RADIUS,
            borderWidth: 1,
            borderColor:
              selectedDayTransactions.length > 0
                ? `${ACCENT_COLOR}30`
                : CARD_BORDER,
            padding: CARD_PAD,
            marginBottom: 20,
          }}
          onPress={() => setShowDayDetail(true)}
          disabled={selectedDayTransactions.length === 0}
          activeOpacity={0.7}
        >
          {/* Date title row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: selectedDayTransactions.length > 0 ? 14 : 0,
            }}
          >
            <View>
              <Text
                style={{
                  color: Colors.gray400, fontSize: 10, fontWeight: "700",
                  letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4,
                }}
              >
                Tanggal Dipilih
              </Text>
              <Text
                style={{ color: TEXT_PRIMARY, fontSize: 14, fontWeight: "600" }}
              >
                {new Date(selectedDate).toLocaleDateString("id-ID", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}
              </Text>
            </View>

            {selectedDayTransactions.length > 0 ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text
                  style={{
                    fontSize: 14, fontWeight: "700",
                    color: getDaySummaryColor(),
                  }}
                >
                  {selectedDayTotals.net >= 0 ? "+" : ""}
                  {formatCurrency(selectedDayTotals.net)}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={Colors.gray400}
                />
              </View>
            ) : (
              <View
                style={{
                  paddingHorizontal: 10, paddingVertical: 4,
                  borderRadius: 20, backgroundColor: "rgba(255,255,255,0.05)",
                }}
              >
                <Text style={{ color: Colors.gray400, fontSize: 10 }}>
                  Kosong
                </Text>
              </View>
            )}
          </View>

          {selectedDayTransactions.length > 0 ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    color: Colors.gray400, fontSize: 9,
                    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4,
                  }}
                >
                  Masuk
                </Text>
                <Text
                  style={{ color: SUCCESS_COLOR, fontSize: 15, fontWeight: "700" }}
                >
                  {formatCurrency(selectedDayTotals.income)}
                </Text>
              </View>
              <View
                style={{ width: 1, height: 28, backgroundColor: CARD_BORDER }}
              />
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    color: Colors.gray400, fontSize: 9,
                    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4,
                  }}
                >
                  Keluar
                </Text>
                <Text
                  style={{ color: ERROR_COLOR, fontSize: 15, fontWeight: "700" }}
                >
                  {formatCurrency(selectedDayTotals.expense)}
                </Text>
              </View>
              <View
                style={{ width: 1, height: 28, backgroundColor: CARD_BORDER }}
              />
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    color: Colors.gray400, fontSize: 9,
                    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4,
                  }}
                >
                  Transaksi
                </Text>
                <Text
                  style={{ color: ACCENT_COLOR, fontSize: 15, fontWeight: "700" }}
                >
                  {selectedDayTransactions.length}
                </Text>
              </View>
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
              <Ionicons
                name="calendar-outline"
                size={28}
                color={Colors.gray400}
                style={{ marginBottom: 8 }}
              />
              <Text style={{ color: Colors.gray400, fontSize: 12 }}>
                Tidak ada transaksi di tanggal ini
              </Text>
              <Text
                style={{ color: Colors.gray400, fontSize: 10, marginTop: 3 }}
              >
                Tap tanggal lain yang memiliki indikator
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Calendar insights — horizontal scroll ────────────────────── */}
        {calendarInsights.length > 0 && (
          <>
            <SectionHeader title="Insights Kalender" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 4, gap: 10, marginBottom: 20 }}
              style={{ marginBottom: 6 }}
            >
              {calendarInsights.map((insight, index) => {
                const color = insightTypeColor(insight.type);
                return (
                  <View
                    key={index}
                    style={{
                      width: 220,
                      backgroundColor: `${color}09`,
                      borderRadius: INNER_RADIUS,
                      borderWidth: 1,
                      borderColor: `${color}20`,
                      padding: 14,
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
                    >
                      <View
                        style={{
                          width: 32, height: 32, borderRadius: 10,
                          alignItems: "center", justifyContent: "center",
                          backgroundColor: `${color}18`, marginRight: 10,
                        }}
                      >
                        <Ionicons
                          name={insight.icon as IconName}
                          size={15}
                          color={color}
                        />
                      </View>
                      <Text
                        style={{
                          color, fontSize: 12, fontWeight: "700", flex: 1,
                        }}
                      >
                        {insight.title}
                      </Text>
                    </View>
                    <Text
                      style={{ color: TEXT_SECONDARY, fontSize: 11, lineHeight: 16 }}
                    >
                      {insight.message}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* ── Stats grid: Busiest + Highest Spending ───────────────────── */}
        <SectionHeader title="Statistik Kalender" />
        <View
          style={{ flexDirection: "row", gap: 12, marginBottom: 4 }}
        >
          {/* Hari Teraktif */}
          <View
            style={{
              flex: 1,
              backgroundColor: SURFACE_COLOR,
              borderRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: CARD_BORDER,
              padding: 16,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
            >
              <View
                style={{
                  width: 30, height: 30, borderRadius: 9,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: `${ACCENT_COLOR}18`, marginRight: 8,
                }}
              >
                <Ionicons name="pulse" size={14} color={ACCENT_COLOR} />
              </View>
              <Text
                style={{
                  color: Colors.gray400, fontSize: 9, fontWeight: "700",
                  letterSpacing: 1.2, textTransform: "uppercase",
                }}
              >
                Teraktif
              </Text>
            </View>
            {busiestDays.length > 0 ? (
              busiestDays.map((day, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 6,
                    borderBottomWidth: index < busiestDays.length - 1 ? 1 : 0,
                    borderBottomColor: CARD_BORDER,
                  }}
                >
                  <Text style={{ color: TEXT_SECONDARY, fontSize: 11 }}>
                    {new Date(day.date).toLocaleDateString("id-ID", {
                      day: "numeric", month: "short",
                    })}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 8, paddingVertical: 2,
                      borderRadius: 20, backgroundColor: `${ACCENT_COLOR}15`,
                    }}
                  >
                    <Text
                      style={{ color: ACCENT_COLOR, fontSize: 10, fontWeight: "700" }}
                    >
                      {day.count}x
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ color: Colors.gray400, fontSize: 11 }}>
                Belum ada data
              </Text>
            )}
          </View>

          {/* Pengeluaran Tertinggi */}
          <View
            style={{
              flex: 1,
              backgroundColor: SURFACE_COLOR,
              borderRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: CARD_BORDER,
              padding: 16,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
            >
              <View
                style={{
                  width: 30, height: 30, borderRadius: 9,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: `${ERROR_COLOR}18`, marginRight: 8,
                }}
              >
                <Ionicons name="trending-up-outline" size={14} color={ERROR_COLOR} />
              </View>
              <Text
                style={{
                  color: Colors.gray400, fontSize: 9, fontWeight: "700",
                  letterSpacing: 1.2, textTransform: "uppercase",
                }}
              >
                Tertinggi
              </Text>
            </View>
            {highestSpendingDays.length > 0 ? (
              highestSpendingDays.map((day, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 6,
                    borderBottomWidth: index < highestSpendingDays.length - 1 ? 1 : 0,
                    borderBottomColor: CARD_BORDER,
                  }}
                >
                  <Text style={{ color: TEXT_SECONDARY, fontSize: 11 }}>
                    {new Date(day.date).toLocaleDateString("id-ID", {
                      day: "numeric", month: "short",
                    })}
                  </Text>
                  <Text
                    style={{ color: ERROR_COLOR, fontSize: 11, fontWeight: "700" }}
                  >
                    {formatCurrency(day.expense).replace("Rp", "").trim()}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ color: Colors.gray400, fontSize: 11 }}>
                Belum ada data
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ═══════════════════════════════════════════════════════════════════
          DAY DETAIL MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showDayDetail}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDayDetail(false)}
      >
        <View
          style={{ flex: 1, justifyContent: "flex-end" }}
          pointerEvents="box-none"
        >
          {/* Backdrop */}
          <TouchableOpacity
            style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(0,0,0,0.55)",
            }}
            activeOpacity={1}
            onPress={() => setShowDayDetail(false)}
          />

          <View
            style={{
              backgroundColor: SURFACE_COLOR,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: "78%",
              borderTopWidth: 1,
              borderTopColor: CARD_BORDER,
            }}
          >
            {/* Drag handle */}
            <View
              style={{
                width: 36, height: 4, borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignSelf: "center", marginTop: 12, marginBottom: 4,
              }}
            />

            {/* Modal header */}
            <View
              style={{
                padding: CARD_PAD,
                borderBottomWidth: 1,
                borderBottomColor: CARD_BORDER,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{ color: TEXT_PRIMARY, fontSize: 17, fontWeight: "700" }}
                >
                  Detail Transaksi
                </Text>
                <TouchableOpacity
                  style={{
                    width: 32, height: 32, borderRadius: 10,
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: "rgba(255,255,255,0.07)",
                  }}
                  onPress={() => setShowDayDetail(false)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={16} color={Colors.gray400} />
                </TouchableOpacity>
              </View>

              <Text style={{ color: Colors.gray400, fontSize: 12, marginBottom: 14 }}>
                {new Date(selectedDate).toLocaleDateString("id-ID", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}
              </Text>

              {/* Summary row */}
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderRadius: INNER_RADIUS,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: CARD_BORDER,
                }}
              >
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text
                    style={{
                      color: Colors.gray400, fontSize: 9,
                      textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4,
                    }}
                  >
                    Pemasukan
                  </Text>
                  <Text
                    style={{ color: SUCCESS_COLOR, fontSize: 14, fontWeight: "700" }}
                  >
                    {formatCurrency(selectedDayTotals.income)}
                  </Text>
                </View>
                <View
                  style={{ width: 1, height: 28, backgroundColor: CARD_BORDER }}
                />
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text
                    style={{
                      color: Colors.gray400, fontSize: 9,
                      textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4,
                    }}
                  >
                    Pengeluaran
                  </Text>
                  <Text
                    style={{ color: ERROR_COLOR, fontSize: 14, fontWeight: "700" }}
                  >
                    {formatCurrency(selectedDayTotals.expense)}
                  </Text>
                </View>
                <View
                  style={{ width: 1, height: 28, backgroundColor: CARD_BORDER }}
                />
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text
                    style={{
                      color: Colors.gray400, fontSize: 9,
                      textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4,
                    }}
                  >
                    Bersih
                  </Text>
                  <Text
                    style={{
                      fontSize: 14, fontWeight: "700",
                      color: getDaySummaryColor(),
                    }}
                  >
                    {selectedDayTotals.net >= 0 ? "+" : ""}
                    {formatCurrency(selectedDayTotals.net)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Transaction list */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: CARD_PAD }}
              showsVerticalScrollIndicator={false}
            >
              {selectedDayTransactions.length > 0 ? (
                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    borderRadius: CARD_RADIUS,
                    borderWidth: 1,
                    borderColor: CARD_BORDER,
                    overflow: "hidden",
                  }}
                >
                  {selectedDayTransactions.map((transaction, index) => (
                    <View
                      key={transaction.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 13,
                        paddingHorizontal: 16,
                        borderBottomWidth:
                          index < selectedDayTransactions.length - 1 ? 1 : 0,
                        borderBottomColor: CARD_BORDER,
                      }}
                    >
                      {/* Icon */}
                      <View
                        style={{
                          width: 38, height: 38, borderRadius: 12,
                          alignItems: "center", justifyContent: "center",
                          marginRight: 12, flexShrink: 0,
                          backgroundColor:
                            transaction.type === "income"
                              ? `${SUCCESS_COLOR}15`
                              : `${ERROR_COLOR}15`,
                        }}
                      >
                        <Ionicons
                          name="receipt-outline"
                          size={16}
                          color={
                            transaction.type === "income"
                              ? SUCCESS_COLOR
                              : ERROR_COLOR
                          }
                        />
                      </View>

                      {/* Info */}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: TEXT_PRIMARY, fontSize: 13,
                            fontWeight: "500", marginBottom: 2,
                          }}
                        >
                          {transaction.category}
                        </Text>
                        <Text
                          style={{ color: Colors.gray400, fontSize: 11 }}
                          numberOfLines={1}
                        >
                          {transaction.description || "Tidak ada deskripsi"}
                        </Text>
                      </View>

                      {/* Amount */}
                      <Text
                        style={{
                          fontSize: 13, fontWeight: "700", marginLeft: 8,
                          color:
                            transaction.type === "income"
                              ? SUCCESS_COLOR
                              : ERROR_COLOR,
                        }}
                      >
                        {transaction.type === "income" ? "+" : "−"}
                        {formatCurrency(transaction.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={{ alignItems: "center", paddingVertical: 32 }}>
                  <View
                    style={{
                      width: 56, height: 56, borderRadius: 18,
                      alignItems: "center", justifyContent: "center",
                      backgroundColor: `${Colors.gray400}14`, marginBottom: 12,
                    }}
                  >
                    <Ionicons
                      name="receipt-outline"
                      size={24}
                      color={Colors.gray400}
                    />
                  </View>
                  <Text style={{ color: TEXT_SECONDARY, fontSize: 13, fontWeight: "500" }}>
                    Tidak ada transaksi
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