/**
 * BalanceCarousel — redesigned
 *
 * Perubahan utama:
 *  - Slide1: balance + split-bar income/expense di bawah + status badge
 *  - Slide2: layout row (bukan dua box sejajar) — setiap baris punya
 *            label · amount · progress bar proporsional + net footer
 *  - Slide3: hierarchy lebih jelas, progress bar pakai overflow:hidden
 *  - Helper components: SlideBackground (terima accentColor), StatusBadge,
 *    SlideLabel, ProgressBar
 *  - PaginationDot: sedikit lebih besar, opacity lebih kontras
 */

import React from "react";
import { View, Text, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { formatCurrency, safeNumber } from "../../../utils/calculations";
import { Colors } from "../../../theme/theme";

// ─── Constants ─────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH  = SCREEN_WIDTH - 36; // 18dp margin each side
const CARD_HEIGHT = 192;               // sedikit lebih tinggi dari 180 → lebih nafas
const CARD_RADIUS = 22;

const C_SUCCESS = Colors.success ?? "#10B981";
const C_ERROR   = Colors.error   ?? "#F43F5E";
const C_WARNING = Colors.warning ?? "#F59E0B";
const C_ACCENT  = "#22D3EE";

const SLIDE_COUNT = 3;

// ─── Types ──────────────────────────────────────────────────────────────────────

interface BalanceCarouselProps {
  hasFinancialData: boolean;
  balance: number;
  filteredIncome: number;
  filteredExpense: number;
  timeFilter: string;
  filteredPeriodNetto: number;
  projectionData: any;
  openingBalance: number;
}

// ─── Shared micro-components ───────────────────────────────────────────────────

/**
 * Gradient card background.
 * accentColor mengubah warna glow di pojok kanan atas —
 * Slide2 pakai warna net (hijau/merah) untuk reinforcement visual.
 */
const SlideBackground = ({
  children,
  accentColor = C_ACCENT,
}: {
  children: React.ReactNode;
  accentColor?: string;
}) => (
  <LinearGradient
    colors={["#0F2444", "#0D1F3C", "#091428"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={{
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: CARD_RADIUS,
      padding: 20,
      borderWidth: 1,
      borderColor: `${accentColor}18`,
      overflow: "hidden",
    }}
  >
    {/* Glow kanan atas */}
    <View
      style={{
        position: "absolute",
        top: -55,
        right: -55,
        width: 170,
        height: 170,
        borderRadius: 85,
        backgroundColor: `${accentColor}07`,
      }}
    />
    {/* Glow kiri bawah */}
    <View
      style={{
        position: "absolute",
        bottom: -40,
        left: -30,
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: "rgba(99,102,241,0.07)",
      }}
    />
    {children}
  </LinearGradient>
);

/** Uppercase section label abu */
const SlideLabel = ({ children }: { children: React.ReactNode }) => (
  <Text
    style={{
      color: "rgba(148,163,184,0.65)",
      fontSize: 9,
      fontWeight: "700",
      letterSpacing: 1.5,
      textTransform: "uppercase",
    }}
  >
    {children}
  </Text>
);

/** Badge kecil berwarna (surplus, defisit, on track, dll) */
const StatusBadge = ({ label, color }: { label: string; color: string }) => (
  <View
    style={{
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 7,
      backgroundColor: `${color}18`,
      borderWidth: 1,
      borderColor: `${color}2E`,
    }}
  >
    <Text
      style={{ color, fontSize: 9, fontWeight: "700", letterSpacing: 0.5 }}
    >
      {label}
    </Text>
  </View>
);

/** Progress bar horizontal */
const ProgressBar = ({
  percent,
  color,
  height = 4,
}: {
  percent: number;
  color: string;
  height?: number;
}) => (
  <View
    style={{
      height,
      backgroundColor: "rgba(255,255,255,0.07)",
      borderRadius: height,
      overflow: "hidden",
    }}
  >
    <View
      style={{
        height,
        borderRadius: height,
        width: `${Math.max(0, Math.min(percent, 100))}%`,
        backgroundColor: color,
      }}
    />
  </View>
);

// ─── Slide 1 — Total Saldo ─────────────────────────────────────────────────────
//
//  [ Total Saldo ]              [ +Rp X.XXX · Surplus ↑ ]
//
//  Rp 12.500.000
//
//  ████████████░░░░  (income/expense ratio bar)
//  Rp 5.200.000                         Rp 3.100.000 ●

const Slide1 = (props: BalanceCarouselProps) => {
  const total = props.filteredIncome + props.filteredExpense;
  const incomePercent = total > 0 ? (props.filteredIncome / total) * 100 : 0;
  const isPositive    = props.filteredPeriodNetto >= 0;

  return (
    <SlideBackground>
      <View style={{ flex: 1, justifyContent: "space-between" }}>

        {/* ── Top row ── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <SlideLabel>
            {props.hasFinancialData ? "Total Saldo" : "Selamat Datang"}
          </SlideLabel>

          {props.hasFinancialData && props.filteredPeriodNetto !== 0 && (
            <StatusBadge
              label={
                isPositive
                  ? `+${formatCurrency(safeNumber(props.filteredPeriodNetto))} periode ini`
                  : `${formatCurrency(safeNumber(props.filteredPeriodNetto))} periode ini`
              }
              color={isPositive ? C_SUCCESS : C_ERROR}
            />
          )}
        </View>

        {/* ── Balance number ── */}
        <View>
          <Text
            style={{
              color: "#F8FAFC",
              fontSize: 32,
              fontWeight: "800",
              letterSpacing: -0.8,
              lineHeight: 40,
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {props.hasFinancialData
              ? formatCurrency(safeNumber(props.balance))
              : "Rp 0"}
          </Text>

          {props.timeFilter !== "all" && props.openingBalance !== 0 && (
            <Text
              style={{
                color: "rgba(148,163,184,0.4)",
                fontSize: 10,
                fontStyle: "italic",
                marginTop: 3,
              }}
            >
              * Termasuk saldo awal {formatCurrency(props.openingBalance)}
            </Text>
          )}

          {!props.hasFinancialData && (
            <Text
              style={{
                color: "rgba(148,163,184,0.4)",
                fontSize: 10,
                marginTop: 3,
              }}
            >
              Mulai catat transaksi pertamamu →
            </Text>
          )}
        </View>

        {/* ── Income/Expense split bar ── */}
        {props.hasFinancialData && total > 0 ? (
          <View>
            <ProgressBar percent={incomePercent} color={C_SUCCESS} height={4} />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 7,
              }}
            >
              {/* Kiri: income */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: C_SUCCESS,
                    marginRight: 5,
                  }}
                />
                <Text style={{ color: "rgba(148,163,184,0.55)", fontSize: 10 }}>
                  {formatCurrency(safeNumber(props.filteredIncome))}
                </Text>
              </View>

              {/* Kanan: expense */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{
                    color: "rgba(148,163,184,0.55)",
                    fontSize: 10,
                    marginRight: 5,
                  }}
                >
                  {formatCurrency(safeNumber(props.filteredExpense))}
                </Text>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: C_ERROR,
                  }}
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={{ height: 20 }} />
        )}
      </View>
    </SlideBackground>
  );
};

// ─── Slide 2 — Aktivitas (REDESIGNED) ────────────────────────────────────────
//
//  AKTIVITAS · PERIODE INI
//
//  ↑ Pemasukan          +Rp 5.200.000
//  ████████████░░░░░░  (62% dari total arus)
//
//  ↓ Pengeluaran         Rp 3.100.000
//  ████████░░░░░░░░░░  (38% dari total arus)
//
//  ───────────────────────────────────
//  Net Periode  [ Surplus ]   +Rp 2.100.000

const Slide2 = (props: BalanceCarouselProps) => {
  const total       = props.filteredIncome + props.filteredExpense;
  const incomeRatio = total > 0 ? (props.filteredIncome / total) * 100 : 0;
  const expenseRatio = total > 0 ? (props.filteredExpense / total) * 100 : 0;
  const isPositive  = props.filteredPeriodNetto >= 0;
  const netColor    = isPositive ? C_SUCCESS : C_ERROR;

  return (
    <SlideBackground accentColor={netColor}>
      <View style={{ flex: 1, justifyContent: "space-between" }}>

        {/* ── Header ── */}
        <SlideLabel>
          Aktivitas ·{" "}
          {props.timeFilter === "all" ? "Semua Data" : "Periode Ini"}
        </SlideLabel>

        {/* ── Income row ── */}
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            {/* Label + icon */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  backgroundColor: "rgba(16,185,129,0.18)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                }}
              >
                <Ionicons
                  name="trending-up-outline"
                  size={13}
                  color={C_SUCCESS}
                />
              </View>
              <Text
                style={{
                  color: "rgba(203,213,225,0.8)",
                  fontSize: 12,
                  fontWeight: "500",
                }}
              >
                Pemasukan
              </Text>
            </View>

            {/* Amount */}
            <Text
              style={{ color: C_SUCCESS, fontSize: 15, fontWeight: "700" }}
            >
              +{formatCurrency(safeNumber(props.filteredIncome))}
            </Text>
          </View>

          {/* Income bar — proporsi relatif thd total arus */}
          <ProgressBar percent={incomeRatio} color={C_SUCCESS} height={4} />
        </View>

        {/* ── Expense row ── */}
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            {/* Label + icon */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  backgroundColor: "rgba(244,63,94,0.16)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                }}
              >
                <Ionicons
                  name="trending-down-outline"
                  size={13}
                  color={C_ERROR}
                />
              </View>
              <Text
                style={{
                  color: "rgba(203,213,225,0.8)",
                  fontSize: 12,
                  fontWeight: "500",
                }}
              >
                Pengeluaran
              </Text>
            </View>

            {/* Amount */}
            <Text
              style={{ color: C_ERROR, fontSize: 15, fontWeight: "700" }}
            >
              −{formatCurrency(safeNumber(props.filteredExpense))}
            </Text>
          </View>

          {/* Expense bar */}
          <ProgressBar percent={expenseRatio} color={C_ERROR} height={4} />
        </View>

        {/* ── Net footer ── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 11,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.055)",
          }}
        >
          {/* Label + badge */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={{
                color: "rgba(148,163,184,0.5)",
                fontSize: 9,
                fontWeight: "700",
                letterSpacing: 0.8,
                textTransform: "uppercase",
                marginRight: 7,
              }}
            >
              Net Periode
            </Text>
            <StatusBadge
              label={isPositive ? "Surplus" : "Defisit"}
              color={netColor}
            />
          </View>

          {/* Net amount */}
          <Text
            style={{ color: netColor, fontSize: 16, fontWeight: "800" }}
          >
            {props.filteredPeriodNetto > 0 ? "+" : ""}
            {formatCurrency(safeNumber(props.filteredPeriodNetto))}
          </Text>
        </View>
      </View>
    </SlideBackground>
  );
};

// ─── Slide 3 — Proyeksi ────────────────────────────────────────────────────────

const Slide3 = (props: BalanceCarouselProps) => {
  const projStatus  = props.projectionData?.status;
  const statusColor =
    projStatus === "surplus"
      ? C_SUCCESS
      : projStatus === "warning"
      ? C_WARNING
      : C_ERROR;

  const statusLabel =
    projStatus === "surplus"
      ? "On Track"
      : projStatus === "warning"
      ? "Hati-hati"
      : "Waspada";

  const netColor =
    props.filteredPeriodNetto > 0
      ? C_SUCCESS
      : props.filteredPeriodNetto < 0
      ? C_ERROR
      : "rgba(148,163,184,0.8)";

  const projBalColor =
    props.projectionData?.projectedBalance >= 0 ? C_SUCCESS : C_ERROR;

  return (
    <SlideBackground accentColor={C_ACCENT}>
      <View style={{ flex: 1, justifyContent: "space-between" }}>

        {/* ── Header ── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <SlideLabel>
            {props.timeFilter === "all"
              ? "Ringkasan Saldo"
              : "Proyeksi Periode"}
          </SlideLabel>

          {props.projectionData && (
            <StatusBadge label={statusLabel} color={statusColor} />
          )}
        </View>

        {/* ── Net cashflow hero number ── */}
        <View>
          <Text
            style={{
              color: "rgba(148,163,184,0.55)",
              fontSize: 10,
              marginBottom: 4,
            }}
          >
            {props.timeFilter === "all"
              ? "Sisa Saldo"
              : "Arus Kas Bersih"}
          </Text>
          <Text
            style={{
              color: netColor,
              fontSize: 28,
              fontWeight: "800",
              letterSpacing: -0.5,
            }}
          >
            {props.filteredPeriodNetto > 0 ? "+" : ""}
            {formatCurrency(safeNumber(props.filteredPeriodNetto))}
          </Text>
        </View>

        {/* ── Progress + Projection details ── */}
        {props.hasFinancialData && props.projectionData && (
          <View>
            {/* Gradient progress bar — overflow:hidden style */}
            <View
              style={{
                height: 5,
                backgroundColor: "rgba(255,255,255,0.07)",
                borderRadius: 5,
                overflow: "hidden",
                marginBottom: 9,
              }}
            >
              <LinearGradient
                colors={
                  projStatus === "surplus"
                    ? [C_SUCCESS, "#34D399"]
                    : projStatus === "warning"
                    ? [C_WARNING, "#FCD34D"]
                    : [C_ERROR, "#FB7185"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 5,
                  borderRadius: 5,
                  width: `${Math.max(
                    0,
                    Math.min(safeNumber(props.projectionData.progress), 100)
                  )}%`,
                }}
              />
            </View>

            {/* Projection row */}
            {props.projectionData.daysRemaining > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {/* Left: label + days */}
                <View>
                  <Text
                    style={{
                      color: "rgba(148,163,184,0.6)",
                      fontSize: 10,
                      marginBottom: 2,
                    }}
                  >
                    Proyeksi {props.projectionData.label}
                  </Text>
                  <Text
                    style={{
                      color: "rgba(148,163,184,0.35)",
                      fontSize: 9,
                    }}
                  >
                    {props.projectionData.daysRemaining} hari tersisa
                  </Text>
                </View>

                {/* Right: projected balance */}
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{
                      color: projBalColor,
                      fontSize: 15,
                      fontWeight: "700",
                    }}
                  >
                    {props.projectionData.projectedBalance >= 0 ? "+" : ""}
                    {formatCurrency(
                      safeNumber(props.projectionData.projectedBalance)
                    )}
                  </Text>
                  <Text
                    style={{
                      color: "rgba(148,163,184,0.35)",
                      fontSize: 9,
                    }}
                  >
                    Estimasi akhir periode
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </SlideBackground>
  );
};

// ─── CarouselItem ──────────────────────────────────────────────────────────────

const CarouselItem = ({
  index,
  scrollX,
  carouselProps,
}: {
  index: number;
  scrollX: SharedValue<number>;
  carouselProps: BalanceCarouselProps;
}) => {
  const animStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.92, 1, 0.92],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.45, 1, 0.45],
      Extrapolation.CLAMP
    );
    return { transform: [{ scale }], opacity };
  });

  return (
    <View style={{ width: CARD_WIDTH, marginHorizontal: 18 }}>
      <Animated.View style={animStyle}>
        {index === 0 && <Slide1 {...carouselProps} />}
        {index === 1 && <Slide2 {...carouselProps} />}
        {index === 2 && <Slide3 {...carouselProps} />}
      </Animated.View>
    </View>
  );
};

// ─── PaginationDot ─────────────────────────────────────────────────────────────

const PaginationDot = ({
  index,
  scrollX,
}: {
  index: number;
  scrollX: SharedValue<number>;
}) => {
  const dotStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];
    const width = interpolate(
      scrollX.value,
      inputRange,
      [5, 24, 5],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.25, 1, 0.25],
      Extrapolation.CLAMP
    );
    return { width, opacity };
  });

  return (
    <Animated.View
      style={[
        {
          height: 5,
          borderRadius: 3,
          backgroundColor: C_ACCENT,
          marginHorizontal: 3,
        },
        dotStyle,
      ]}
    />
  );
};

// ─── Main export ───────────────────────────────────────────────────────────────

export const BalanceCarousel: React.FC<BalanceCarouselProps> = (props) => {
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  return (
    <View style={{ marginBottom: 24 }}>
      <Animated.FlatList
        data={Array.from({ length: SLIDE_COUNT }, (_, i) => i)}
        keyExtractor={(item) => item.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        decelerationRate="fast"
        style={{ marginHorizontal: -18 }}
        renderItem={({ index }) => (
          <CarouselItem
            index={index}
            scrollX={scrollX}
            carouselProps={props}
          />
        )}
      />

      {/* Pagination dots */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          marginTop: 14,
        }}
      >
        {Array.from({ length: SLIDE_COUNT }, (_, i) => (
          <PaginationDot key={i} index={i} scrollX={scrollX} />
        ))}
      </View>
    </View>
  );
};