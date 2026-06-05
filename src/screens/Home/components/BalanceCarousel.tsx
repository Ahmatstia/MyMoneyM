/**
 * BalanceCarousel — "AURORA GLASS" Edition
 * ─────────────────────────────────────────────────────────────────────────────
 * Design language:
 *   • Aurora nebula background: 4 layered translucent glow orbs per slide
 *   • Gradient border ring via outer wrapper (no BorderImage hack)
 *   • Abstract decorative rings cut by overflow:hidden
 *   • Neon accent typography, glowing badges
 *   • Diagonal slash accent line (Slide 1)
 *   • Pill-shaped animated pagination dots with gradient color
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
const CARD_WIDTH  = SCREEN_WIDTH - 32;
const CARD_HEIGHT = 210;
const CARD_RADIUS = 26;
const BORDER_WIDTH = 1.5;

const C_SUCCESS  = "#22D3A0";   // neon emerald
const C_ERROR    = "#FF5F7E";   // neon rose
const C_WARNING  = "#FFBA3B";   // neon amber
const C_ACCENT   = "#7C6FF7";   // electric violet
const C_CYAN     = "#22D3EE";   // neon cyan
const C_PINK     = "#EC4899";   // neon pink

const SLIDE_COUNT = 3;

// ─── Interfaces ────────────────────────────────────────────────────────────────
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

// ─── Utility: neon pill badge ──────────────────────────────────────────────────
const NeonBadge = ({
  label,
  color,
  icon,
}: {
  label: string;
  color: string;
  icon?: string;
}) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 99,
      backgroundColor: `${color}18`,
      borderWidth: 1,
      borderColor: `${color}45`,
    }}
  >
    {icon && (
      <Ionicons name={icon as any} size={9} color={color} style={{ marginRight: 4 }} />
    )}
    <Text style={{ color, fontSize: 9, fontWeight: "800", letterSpacing: 0.6 }}>
      {label}
    </Text>
  </View>
);

// ─── Utility: glowing horizontal bar ──────────────────────────────────────────
const GlowBar = ({
  percent,
  color,
  height = 3,
}: {
  percent: number;
  color: string;
  height?: number;
}) => {
  const pct = Math.max(0, Math.min(percent, 100));
  return (
    <View
      style={{
        height,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: height,
        overflow: "hidden",
      }}
    >
      <LinearGradient
        colors={[color, `${color}AA`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          height,
          borderRadius: height,
          width: `${pct}%`,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 6,
        }}
      />
    </View>
  );
};

// ─── Aurora Card Shell ─────────────────────────────────────────────────────────
// Outer wrapper creates the gradient-border illusion.
// Inner card has the dark background + glow orbs + content.
const AuroraCard = ({
  children,
  gradientBorder,
  orb1Color = C_ACCENT,
  orb2Color = C_CYAN,
  orb3Color,
  orb4Color,
}: {
  children: React.ReactNode;
  gradientBorder: readonly [string, string, ...string[]];
  orb1Color?: string;
  orb2Color?: string;
  orb3Color?: string;
  orb4Color?: string;
}) => (
  /* Gradient border wrapper */
  <LinearGradient
    colors={gradientBorder}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={{
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: CARD_RADIUS + BORDER_WIDTH,
      padding: BORDER_WIDTH,
    }}
  >
    {/* Dark inner card */}
    <View
      style={{
        flex: 1,
        borderRadius: CARD_RADIUS,
        overflow: "hidden",
        backgroundColor: "#070D1A",
      }}
    >
      {/* Aurora background gradient */}
      <LinearGradient
        colors={["#0A1428", "#060E1E", "#060A16"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", inset: 0 } as any}
      />

      {/* Glow orb — top right (large) */}
      <View
        style={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: `${orb1Color}12`,
        }}
      />
      {/* Glow orb — bottom left (medium) */}
      <View
        style={{
          position: "absolute",
          bottom: -40,
          left: -30,
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: `${orb2Color}0E`,
        }}
      />
      {/* Glow orb — top left (tiny accent) */}
      {orb3Color && (
        <View
          style={{
            position: "absolute",
            top: 20,
            left: -20,
            width: 90,
            height: 90,
            borderRadius: 45,
            backgroundColor: `${orb3Color}09`,
          }}
        />
      )}
      {/* Glow orb — bottom right (tiny accent) */}
      {orb4Color && (
        <View
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: `${orb4Color}0A`,
          }}
        />
      )}

      {/* Abstract decorative ring — top right */}
      <View
        style={{
          position: "absolute",
          top: -38,
          right: -38,
          width: 140,
          height: 140,
          borderRadius: 70,
          borderWidth: 1.5,
          borderColor: `${orb1Color}20`,
        }}
      />
      {/* Abstract decorative ring — smaller inside */}
      <View
        style={{
          position: "absolute",
          top: -12,
          right: -12,
          width: 88,
          height: 88,
          borderRadius: 44,
          borderWidth: 1,
          borderColor: `${orb1Color}14`,
        }}
      />

      {/* Content layer */}
      <View style={{ flex: 1, padding: 20 }}>{children}</View>
    </View>
  </LinearGradient>
);

// ─── Slide 1 — Total Saldo ─────────────────────────────────────────────────────
const Slide1 = (props: BalanceCarouselProps) => {
  const total = props.filteredIncome + props.filteredExpense;
  const incomePercent = total > 0 ? (props.filteredIncome / total) * 100 : 0;
  const isPositive = props.filteredPeriodNetto >= 0;
  const netColor = isPositive ? C_SUCCESS : C_ERROR;

  return (
    <AuroraCard
      gradientBorder={[`${C_ACCENT}80`, `${C_CYAN}40`, `${C_PINK}30`, `${C_ACCENT}60`]}
      orb1Color={C_ACCENT}
      orb2Color={C_CYAN}
      orb3Color={C_PINK}
      orb4Color={C_SUCCESS}
    >
      <View style={{ flex: 1, justifyContent: "space-between" }}>

        {/* ── Top row ── */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* Glowing dot */}
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: C_ACCENT,
                marginRight: 7,
                shadowColor: C_ACCENT,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 4,
              }}
            />
            <Text style={{
              color: "rgba(148,163,184,0.6)",
              fontSize: 9,
              fontWeight: "700",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}>
              {props.hasFinancialData ? "Total Saldo" : "Selamat Datang"}
            </Text>
          </View>

          {props.hasFinancialData && props.filteredPeriodNetto !== 0 && (
            <NeonBadge
              label={isPositive
                ? `▲ ${formatCurrency(safeNumber(Math.abs(props.filteredPeriodNetto)))}`
                : `▼ ${formatCurrency(safeNumber(Math.abs(props.filteredPeriodNetto)))}`
              }
              color={netColor}
            />
          )}
        </View>

        {/* ── Hero Balance ── */}
        <View>
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 34,
              fontWeight: "900",
              letterSpacing: -1,
              lineHeight: 42,
              textShadowColor: `${C_ACCENT}60`,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 16,
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {props.hasFinancialData
              ? formatCurrency(safeNumber(props.balance))
              : "Rp 0"}
          </Text>
          {props.timeFilter !== "all" && props.openingBalance !== 0 && (
            <Text style={{ color: "rgba(148,163,184,0.35)", fontSize: 9, fontStyle: "italic", marginTop: 3 }}>
              * termasuk saldo awal {formatCurrency(props.openingBalance)}
            </Text>
          )}
          {!props.hasFinancialData && (
            <Text style={{ color: "rgba(148,163,184,0.4)", fontSize: 10, marginTop: 4 }}>
              Mulai catat transaksi pertamamu →
            </Text>
          )}
        </View>

        {/* ── Flow bars ── */}
        {props.hasFinancialData && total > 0 ? (
          <View>
            {/* Dual bar track */}
            <View style={{ height: 3, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden", flexDirection: "row" }}>
              {/* Income portion */}
              <View style={{ flex: incomePercent, backgroundColor: C_SUCCESS, borderRadius: 3 }} />
              {/* Expense portion */}
              <View style={{ flex: 100 - incomePercent, backgroundColor: C_ERROR, opacity: 0.6 }} />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
              {/* Income label */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C_SUCCESS, marginRight: 6,
                  shadowColor: C_SUCCESS, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 3 }} />
                <View>
                  <Text style={{ color: "rgba(148,163,184,0.45)", fontSize: 8, letterSpacing: 1, textTransform: "uppercase" }}>Masuk</Text>
                  <Text style={{ color: C_SUCCESS, fontSize: 11, fontWeight: "700" }}>
                    +{formatCurrency(safeNumber(props.filteredIncome))}
                  </Text>
                </View>
              </View>

              {/* Expense label */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View>
                  <Text style={{ color: "rgba(148,163,184,0.45)", fontSize: 8, letterSpacing: 1, textTransform: "uppercase", textAlign: "right" }}>Keluar</Text>
                  <Text style={{ color: C_ERROR, fontSize: 11, fontWeight: "700", textAlign: "right" }}>
                    -{formatCurrency(safeNumber(props.filteredExpense))}
                  </Text>
                </View>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C_ERROR, marginLeft: 6,
                  shadowColor: C_ERROR, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 3 }} />
              </View>
            </View>
          </View>
        ) : (
          <View style={{ height: 28 }} />
        )}
      </View>
    </AuroraCard>
  );
};

// ─── Slide 2 — Aktivitas ───────────────────────────────────────────────────────
const Slide2 = (props: BalanceCarouselProps) => {
  const total = props.filteredIncome + props.filteredExpense;
  const incomeRatio = total > 0 ? (props.filteredIncome / total) * 100 : 0;
  const expenseRatio = total > 0 ? (props.filteredExpense / total) * 100 : 0;
  const isPositive = props.filteredPeriodNetto >= 0;
  const netColor = isPositive ? C_SUCCESS : C_ERROR;

  return (
    <AuroraCard
      gradientBorder={isPositive
        ? [`${C_SUCCESS}70`, `${C_CYAN}30`, `${C_ACCENT}40`, `${C_SUCCESS}50`]
        : [`${C_ERROR}70`, `${C_PINK}30`, `${C_ACCENT}40`, `${C_ERROR}50`]}
      orb1Color={isPositive ? C_SUCCESS : C_ERROR}
      orb2Color={C_ACCENT}
      orb3Color={isPositive ? C_CYAN : C_PINK}
      orb4Color={C_WARNING}
    >
      <View style={{ flex: 1, justifyContent: "space-between" }}>

        {/* ── Header ── */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: netColor, marginRight: 7,
              shadowColor: netColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4 }} />
            <Text style={{ color: "rgba(148,163,184,0.6)", fontSize: 9, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>
              Aktivitas · {props.timeFilter === "all" ? "Semua Data" : "Periode Ini"}
            </Text>
          </View>
          <NeonBadge
            label={isPositive ? "Surplus" : "Defisit"}
            color={netColor}
            icon={isPositive ? "trending-up" : "trending-down"}
          />
        </View>

        {/* ── Income row ── */}
        <View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{
                width: 26, height: 26, borderRadius: 9,
                backgroundColor: "rgba(34,211,160,0.14)",
                alignItems: "center", justifyContent: "center", marginRight: 9,
                borderWidth: 1, borderColor: `${C_SUCCESS}30`,
              }}>
                <Ionicons name="arrow-down" size={12} color={C_SUCCESS} />
              </View>
              <Text style={{ color: "rgba(203,213,225,0.75)", fontSize: 12, fontWeight: "600" }}>Pemasukan</Text>
            </View>
            <Text style={{ color: C_SUCCESS, fontSize: 15, fontWeight: "800",
              textShadowColor: `${C_SUCCESS}50`, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }}>
              +{formatCurrency(safeNumber(props.filteredIncome))}
            </Text>
          </View>
          <GlowBar percent={incomeRatio} color={C_SUCCESS} height={3} />
        </View>

        {/* ── Expense row ── */}
        <View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{
                width: 26, height: 26, borderRadius: 9,
                backgroundColor: "rgba(255,95,126,0.14)",
                alignItems: "center", justifyContent: "center", marginRight: 9,
                borderWidth: 1, borderColor: `${C_ERROR}30`,
              }}>
                <Ionicons name="arrow-up" size={12} color={C_ERROR} />
              </View>
              <Text style={{ color: "rgba(203,213,225,0.75)", fontSize: 12, fontWeight: "600" }}>Pengeluaran</Text>
            </View>
            <Text style={{ color: C_ERROR, fontSize: 15, fontWeight: "800",
              textShadowColor: `${C_ERROR}50`, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }}>
              −{formatCurrency(safeNumber(props.filteredExpense))}
            </Text>
          </View>
          <GlowBar percent={expenseRatio} color={C_ERROR} height={3} />
        </View>

        {/* ── Net footer ── */}
        <View style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.05)",
        }}>
          <Text style={{ color: "rgba(148,163,184,0.4)", fontSize: 9, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" }}>
            Net Periode
          </Text>
          <Text style={{
            color: netColor,
            fontSize: 18,
            fontWeight: "900",
            letterSpacing: -0.5,
            textShadowColor: `${netColor}60`,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 12,
          }}>
            {props.filteredPeriodNetto > 0 ? "+" : ""}
            {formatCurrency(safeNumber(props.filteredPeriodNetto))}
          </Text>
        </View>
      </View>
    </AuroraCard>
  );
};

// ─── Slide 3 — Proyeksi ────────────────────────────────────────────────────────
const Slide3 = (props: BalanceCarouselProps) => {
  const projStatus = props.projectionData?.status;
  const statusColor =
    projStatus === "surplus" ? C_SUCCESS :
    projStatus === "warning" ? C_WARNING :
    C_ERROR;
  const statusLabel =
    projStatus === "surplus" ? "On Track" :
    projStatus === "warning" ? "Hati-hati" :
    "Waspada";

  const netColor =
    props.filteredPeriodNetto > 0 ? C_SUCCESS :
    props.filteredPeriodNetto < 0 ? C_ERROR :
    "rgba(148,163,184,0.8)";

  const projBalColor =
    props.projectionData?.projectedBalance >= 0 ? C_SUCCESS : C_ERROR;

  const progressPct = Math.max(0, Math.min(safeNumber(props.projectionData?.progress ?? 0), 100));

  return (
    <AuroraCard
      gradientBorder={[`${C_CYAN}60`, `${C_ACCENT}50`, `${statusColor}40`, `${C_CYAN}40`]}
      orb1Color={C_CYAN}
      orb2Color={statusColor}
      orb3Color={C_ACCENT}
      orb4Color={C_PINK}
    >
      <View style={{ flex: 1, justifyContent: "space-between" }}>

        {/* ── Header ── */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C_CYAN, marginRight: 7,
              shadowColor: C_CYAN, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4 }} />
            <Text style={{ color: "rgba(148,163,184,0.6)", fontSize: 9, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>
              {props.timeFilter === "all" ? "Ringkasan Saldo" : "Proyeksi Periode"}
            </Text>
          </View>
          {props.projectionData && (
            <NeonBadge
              label={statusLabel}
              color={statusColor}
              icon={projStatus === "surplus" ? "checkmark-circle" : projStatus === "warning" ? "alert-circle" : "close-circle"}
            />
          )}
        </View>

        {/* ── Hero net cashflow ── */}
        <View>
          <Text style={{ color: "rgba(148,163,184,0.45)", fontSize: 9, marginBottom: 3, letterSpacing: 1, textTransform: "uppercase" }}>
            {props.timeFilter === "all" ? "Sisa Saldo" : "Arus Kas Bersih"}
          </Text>
          <Text style={{
            color: netColor,
            fontSize: 30,
            fontWeight: "900",
            letterSpacing: -0.8,
            textShadowColor: `${netColor}50`,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 14,
          }}>
            {props.filteredPeriodNetto > 0 ? "+" : ""}
            {formatCurrency(safeNumber(props.filteredPeriodNetto))}
          </Text>
        </View>

        {/* ── Progress + Projection details ── */}
        {props.hasFinancialData && props.projectionData ? (
          <View>
            {/* Gradient progress track */}
            <View style={{ height: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
              <LinearGradient
                colors={
                  projStatus === "surplus" ? [C_SUCCESS, "#34D399"] :
                  projStatus === "warning" ? [C_WARNING, "#FCD34D"] :
                  [C_ERROR, "#FB7185"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 4, borderRadius: 4, width: `${progressPct}%` }}
              />
            </View>

            {/* Projection row */}
            {props.projectionData.daysRemaining > 0 && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
                <View>
                  <Text style={{ color: "rgba(148,163,184,0.5)", fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 2 }}>
                    Proyeksi {props.projectionData.label}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="time-outline" size={10} color="rgba(148,163,184,0.35)" style={{ marginRight: 4 }} />
                    <Text style={{ color: "rgba(148,163,184,0.35)", fontSize: 10 }}>
                      {props.projectionData.daysRemaining} hari tersisa
                    </Text>
                  </View>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{
                    color: projBalColor,
                    fontSize: 16,
                    fontWeight: "800",
                    textShadowColor: `${projBalColor}50`,
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 8,
                  }}>
                    {props.projectionData.projectedBalance >= 0 ? "+" : ""}
                    {formatCurrency(safeNumber(props.projectionData.projectedBalance))}
                  </Text>
                  <Text style={{ color: "rgba(148,163,184,0.3)", fontSize: 9 }}>Estimasi akhir periode</Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={{ height: 36 }} />
        )}
      </View>
    </AuroraCard>
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
      [0.88, 1, 0.88],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [8, 0, 8],
      Extrapolation.CLAMP
    );
    return { transform: [{ scale }, { translateY }], opacity };
  });

  return (
    <View style={{ width: CARD_WIDTH, marginHorizontal: 16 }}>
      <Animated.View style={animStyle}>
        {index === 0 && <Slide1 {...carouselProps} />}
        {index === 1 && <Slide2 {...carouselProps} />}
        {index === 2 && <Slide3 {...carouselProps} />}
      </Animated.View>
    </View>
  );
};

// ─── PaginationDot — animated pill with glow ──────────────────────────────────
const PaginationDot = ({
  index,
  scrollX,
}: {
  index: number;
  scrollX: SharedValue<number>;
}) => {
  const SLIDE_COLORS = [C_ACCENT, C_SUCCESS, C_CYAN];
  const color = SLIDE_COLORS[index] ?? C_ACCENT;

  const dotStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];
    const width = interpolate(
      scrollX.value,
      inputRange,
      [5, 22, 5],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.2, 1, 0.2],
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
          backgroundColor: color,
          marginHorizontal: 3,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 5,
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
        style={{ marginHorizontal: -16 }}
        renderItem={({ index }) => (
          <CarouselItem
            index={index}
            scrollX={scrollX}
            carouselProps={props}
          />
        )}
      />

      {/* Pagination — pill dots with per-slide glow color */}
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