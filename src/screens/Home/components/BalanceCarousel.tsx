import React, { useEffect } from "react";
import { View, Text, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { formatCurrency, safeNumber } from "../../../utils/calculations";

// ─── Constants ──────────────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = 210;
const CARD_RADIUS = 28;
const BORDER_W = 1.5;
const SLIDE_COUNT = 3;

// ─── GoPay-Inspired Color Palette ───────────────────────────────────────────────
const G_TEXT = "#FFFFFF";
const G_DIM = "#A0AEC0";
const G_GREEN_PRIMARY = "#00D84A";
const G_GREEN_DARK = "#00B341";
const G_GREEN_DEEP = "#007A2F";
const G_SUCCESS = "#00ED64";
const G_ERROR = "#FF4D6A";
const G_WARNING = "#FFB84D";
const G_GOLD = "#F5A623";

// ─── Per-slide identity ─────────────────────────────────────────────────────────
// Each slide has distinct chromatic personality
const SLIDE_THEMES = [
  {
    // Slide 1 — Saldo Utama (GoPay Green)
    accent: G_GREEN_PRIMARY,
    gradientStart: "#001A08",
    gradientEnd: "#0A2E15",
    glowColor: G_GREEN_PRIMARY,
    accentDark: G_GREEN_DARK,
    accentDeep: G_GREEN_DEEP,
  },
  {
    // Slide 2 — Aktivitas (Gold/Amber)
    accent: G_GOLD,
    gradientStart: "#1A1100",
    gradientEnd: "#2A1C05",
    glowColor: G_GOLD,
    accentDark: "#D4890A",
    accentDeep: "#8B5E00",
  },
  {
    // Slide 3 — Proyeksi (Violet/Teal)
    accent: "#00D4AA",
    gradientStart: "#001A14",
    gradientEnd: "#052E24",
    glowColor: "#00D4AA",
    accentDark: "#00B894",
    accentDeep: "#006B56",
  },
];

// ─── Interface ──────────────────────────────────────────────────────────────────
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

// ─── Counting Number Component ──────────────────────────────────────────────────
const AnimatedNumber = ({
  value,
  style,
  duration = 800,
}: {
  value: string;
  style?: any;
  duration?: number;
}) => {
  const animVal = useSharedValue(0);

  useEffect(() => {
    animVal.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  return (
    <Animated.Text
      style={[
        {
          color: G_TEXT,
          fontSize: 26,
          fontWeight: "800",
          letterSpacing: -1,
          lineHeight: 32,
        },
        style,
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit
    >
      {value}
    </Animated.Text>
  );
};

// ─── Glass Chip ─────────────────────────────────────────────────────────────────
const GlassChip = ({
  icon,
  label,
  color,
  compact = false,
}: {
  icon: string;
  label: string;
  color: string;
  compact?: boolean;
}) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: compact ? 8 : 12,
      paddingVertical: compact ? 4 : 6,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.08)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
      alignSelf: "flex-start",
    }}
  >
    <Ionicons
      name={icon as any}
      size={compact ? 10 : 12}
      color={color}
      style={{ marginRight: 4 }}
    />
    <Text
      style={{
        color,
        fontSize: compact ? 9 : 10,
        fontWeight: "700",
        letterSpacing: 0.3,
      }}
    >
      {label}
    </Text>
  </View>
);

// ─── Decorative Glow Orbs ───────────────────────────────────────────────────────
const GlowOrb = ({
  color,
  size = 120,
  top,
  right,
  bottom,
  left,
  opacity = 0.15,
}: {
  color: string;
  size?: number;
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  opacity?: number;
}) => (
  <View
    style={{
      position: "absolute",
      top,
      right,
      bottom,
      left,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
      opacity,
      overflow: "hidden",
    }}
  >
    <LinearGradient
      colors={[color, "transparent"]}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    />
  </View>
);

// ─── ChromaCard — Premium sliding card ──────────────────────────────────────────
const ChromaCard = ({
  slideIndex,
  children,
}: {
  slideIndex: number;
  children: React.ReactNode;
}) => {
  const t = SLIDE_THEMES[slideIndex];
  return (
    <LinearGradient
      colors={[t.gradientStart, t.gradientEnd, "#060D0A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1.2, y: 1 }}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: CARD_RADIUS + BORDER_W,
        padding: BORDER_W,
      }}
    >
      {/* Inner surface */}
      <View
        style={{
          flex: 1,
          borderRadius: CARD_RADIUS,
          overflow: "hidden",
          backgroundColor: "rgba(6,13,10,0.6)",
        }}
      >
        {/* Glow orbs */}
        <GlowOrb
          color={t.glowColor}
          size={160}
          top={-60}
          right={-50}
          opacity={0.12}
        />
        <GlowOrb
          color={t.glowColor}
          size={100}
          bottom={-20}
          left={-30}
          opacity={0.08}
        />

        {/* Top accent line */}
        <LinearGradient
          colors={[`${t.accent}00`, t.accent, `${t.accent}00`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            position: "absolute",
            top: 0,
            left: CARD_RADIUS / 2,
            right: CARD_RADIUS / 2,
            height: 1.5,
          }}
        />

        {/* Decorative circular ring */}
        <View
          style={{
            position: "absolute",
            bottom: -40,
            right: -40,
            width: 140,
            height: 140,
            borderRadius: 70,
            borderWidth: 1,
            borderColor: `${t.accent}10`,
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: -16,
            right: -16,
            width: 80,
            height: 80,
            borderRadius: 40,
            borderWidth: 1,
            borderColor: `${t.accent}18`,
          }}
        />

        {/* Content layer */}
        <View style={{ flex: 1, padding: 20 }}>{children}</View>
      </View>
    </LinearGradient>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// SLIDE 1 — Saldo Utama (GoPay Style)
// Hero: Big balance number, action buttons, glow effects
// ─────────────────────────────────────────────────────────────────────────────────
const Slide1 = (props: BalanceCarouselProps) => {
  const t = SLIDE_THEMES[0];
  const isPositive = props.filteredPeriodNetto >= 0;
  const netColor = isPositive ? G_SUCCESS : G_ERROR;

  // Calculate percentage change (dummy example — in real app this could be from props)
  const hasChange = props.hasFinancialData && props.filteredPeriodNetto !== 0;

  const periodLabel =
    props.timeFilter === "all"
      ? "Seluruh riwayat"
      : props.timeFilter === "monthly"
        ? "Bulan ini"
        : props.timeFilter === "weekly"
          ? "Minggu ini"
          : props.timeFilter === "yearly"
            ? "Tahun ini"
            : props.timeFilter;

  return (
    <ChromaCard slideIndex={0}>
      <View style={{ flex: 1, justifyContent: "space-between" }}>
        {/* ── Row 1: Brand + Status ── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* GoPay-style icon badge */}
            <LinearGradient
              colors={[t.accent, t.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 8,
              }}
            >
              <Ionicons name="wallet" size={13} color="#001A08" />
            </LinearGradient>
            <View>
              <Text
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 8,
                  fontWeight: "600",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                {props.hasFinancialData ? "Total Saldo" : "My Money"}
              </Text>
              {props.hasFinancialData && (
                <Text
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    fontSize: 8,
                    marginTop: 1,
                  }}
                >
                  Akun Utama
                </Text>
              )}
            </View>
          </View>

          {/* Change indicator chip */}
          {hasChange && (
            <GlassChip
              icon={isPositive ? "trending-up" : "trending-down"}
              label={`${isPositive ? "+" : "-"}${formatCurrency(
                safeNumber(Math.abs(props.filteredPeriodNetto)),
              )}`}
              color={netColor}
              compact
            />
          )}
        </View>

        {/* ── Row 2: Hero Balance Number ── */}
        <View style={{ marginTop: 2 }}>
          {!props.hasFinancialData && (
            <Text
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 10,
                marginBottom: 4,
              }}
            >
              Mulai catat transaksi pertamamu
            </Text>
          )}
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <AnimatedNumber
              value={
                props.hasFinancialData
                  ? formatCurrency(Math.abs(safeNumber(props.balance)))
                  : "Rp 0"
              }
              duration={1000}
              style={{
                color:
                  props.hasFinancialData && props.balance < 0
                    ? G_ERROR
                    : G_TEXT,
              }}
            />
            {/* Small decorative indicator */}
            {hasChange && (
              <View
                style={{
                  marginLeft: 8,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: netColor,
                  opacity: 0.6,
                }}
              />
            )}
          </View>

          {/* Subtle opening balance info */}
          {props.timeFilter !== "all" && props.openingBalance !== 0 && (
            <Text
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 7,
                marginTop: 1,
              }}
            >
              Termasuk saldo awal {formatCurrency(props.openingBalance)}
            </Text>
          )}
        </View>

        {/* ── Row 2.5: Mini period stat cards ── */}
        {props.hasFinancialData && (
          <View style={{ flexDirection: "row", gap: 6, marginVertical: 2 }}>
            {/* Income mini card */}
            <View
              style={{
                flex: 1,
                backgroundColor: `${G_SUCCESS}12`,
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: `${G_SUCCESS}18`,
              }}
            >
              <Text
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 7,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  marginBottom: 1,
                }}
              >
                Masuk
              </Text>
              <Text
                style={{
                  color: G_TEXT,
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: -0.3,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(safeNumber(props.filteredIncome))}
              </Text>
            </View>

            {/* Expense mini card */}
            <View
              style={{
                flex: 1,
                backgroundColor: `${G_ERROR}12`,
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: `${G_ERROR}18`,
              }}
            >
              <Text
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 7,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  marginBottom: 1,
                }}
              >
                Keluar
              </Text>
              <Text
                style={{
                  color: G_TEXT,
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: -0.3,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(safeNumber(props.filteredExpense))}
              </Text>
            </View>
          </View>
        )}

        {/* ── Row 3: Period indicator ── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 6,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.06)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="calendar-outline"
              size={8}
              color="rgba(255,255,255,0.3)"
              style={{ marginRight: 4 }}
            />
            <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 7 }}>
              {props.hasFinancialData ? periodLabel : "Belum ada transaksi"}
            </Text>
          </View>
          <Text
            style={{
              color: `${t.accent}60`,
              fontSize: 7,
              fontWeight: "600",
            }}
          >
            Geser →
          </Text>
        </View>
      </View>
    </ChromaCard>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// SLIDE 2 — Cash Flow Activity (Gold/Amber theme)
// Hero: Income vs Expense with animated thick bars
// ─────────────────────────────────────────────────────────────────────────────────
const Slide2 = (props: BalanceCarouselProps) => {
  const total = props.filteredIncome + props.filteredExpense;
  const incomeRatio = total > 0 ? (props.filteredIncome / total) * 100 : 0;
  const expenseRatio = total > 0 ? (props.filteredExpense / total) * 100 : 0;
  const isPositive = props.filteredPeriodNetto >= 0;
  const netColor = isPositive ? G_SUCCESS : G_ERROR;
  const t = SLIDE_THEMES[1];

  const incomeBarWidth = useSharedValue(0);
  const expenseBarWidth = useSharedValue(0);

  useEffect(() => {
    incomeBarWidth.value = withDelay(
      200,
      withTiming(incomeRatio, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      }),
    );
    expenseBarWidth.value = withDelay(
      400,
      withTiming(expenseRatio, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [incomeRatio, expenseRatio]);

  const incomeAnimStyle = useAnimatedStyle(() => ({
    width: `${Math.max(incomeBarWidth.value, 1)}%`,
  }));
  const expenseAnimStyle = useAnimatedStyle(() => ({
    width: `${Math.max(expenseBarWidth.value, 1)}%`,
  }));

  return (
    <ChromaCard slideIndex={1}>
      <View style={{ flex: 1, justifyContent: "space-between" }}>
        {/* ── Header ── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <LinearGradient
              colors={[t.accent, t.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <Ionicons name="pulse" size={16} color="#1A1100" />
            </LinearGradient>
            <View>
              <Text
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 9,
                  fontWeight: "600",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                Aktivitas
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 7,
                  marginTop: 1,
                }}
              >
                {props.timeFilter === "all" ? "Semua riwayat" : "Periode ini"}
              </Text>
            </View>
          </View>
          <GlassChip
            icon={isPositive ? "arrow-up" : "arrow-down"}
            label={isPositive ? "Surplus" : "Defisit"}
            color={netColor}
          />
        </View>

        {/* ── Income Bar ── */}
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: G_SUCCESS,
                  marginRight: 8,
                }}
              />
              <Text
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 11,
                  fontWeight: "500",
                }}
              >
                Pemasukan
              </Text>
            </View>
            <Text
              style={{
                color: G_TEXT,
                fontSize: 15,
                fontWeight: "700",
                letterSpacing: -0.3,
              }}
            >
              {formatCurrency(safeNumber(props.filteredIncome))}
            </Text>
          </View>
          <View
            style={{
              height: 10,
              backgroundColor: "rgba(255,255,255,0.06)",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <Animated.View
              style={[
                {
                  height: 10,
                  borderRadius: 6,
                  backgroundColor: G_SUCCESS,
                },
                incomeAnimStyle,
              ]}
            />
          </View>
        </View>

        {/* ── Expense Bar ── */}
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: G_ERROR,
                  marginRight: 8,
                }}
              />
              <Text
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 11,
                  fontWeight: "500",
                }}
              >
                Pengeluaran
              </Text>
            </View>
            <Text
              style={{
                color: G_TEXT,
                fontSize: 15,
                fontWeight: "700",
                letterSpacing: -0.3,
              }}
            >
              {formatCurrency(safeNumber(props.filteredExpense))}
            </Text>
          </View>
          <View
            style={{
              height: 10,
              backgroundColor: "rgba(255,255,255,0.06)",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <Animated.View
              style={[
                {
                  height: 10,
                  borderRadius: 6,
                  backgroundColor: G_ERROR,
                },
                expenseAnimStyle,
              ]}
            />
          </View>
        </View>

        {/* ── Net Kas Footer ── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: `${netColor}15`,
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: `${netColor}25`,
          }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 9,
              fontWeight: "700",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Net Kas
          </Text>
          <Text
            style={{
              color: netColor,
              fontSize: 18,
              fontWeight: "800",
              letterSpacing: -0.5,
            }}
          >
            {props.filteredPeriodNetto > 0 ? "+" : ""}
            {formatCurrency(safeNumber(props.filteredPeriodNetto))}
          </Text>
        </View>
      </View>
    </ChromaCard>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// SLIDE 3 — Proyeksi & Insight (Teal theme)
// Hero: Circular gauge + glass pills for projection
// ─────────────────────────────────────────────────────────────────────────────────
const Slide3 = (props: BalanceCarouselProps) => {
  const projStatus = props.projectionData?.status;
  const statusColor =
    projStatus === "surplus"
      ? G_SUCCESS
      : projStatus === "warning"
        ? G_WARNING
        : G_ERROR;
  const statusLabel =
    projStatus === "surplus"
      ? "Aman"
      : projStatus === "warning"
        ? "Hati-hati"
        : "Waspada";
  const statusIcon =
    projStatus === "surplus"
      ? "shield-checkmark"
      : projStatus === "warning"
        ? "warning"
        : "alert-circle";

  const netColor =
    props.filteredPeriodNetto > 0
      ? G_SUCCESS
      : props.filteredPeriodNetto < 0
        ? G_ERROR
        : G_DIM;
  const projBalColor =
    (props.projectionData?.projectedBalance ?? 0) >= 0 ? G_SUCCESS : G_ERROR;
  const progressPct = Math.max(
    0,
    Math.min(safeNumber(props.projectionData?.progress ?? 0), 100),
  );
  const t = SLIDE_THEMES[2];

  // Animated gauge
  const gaugeValue = useSharedValue(0);
  useEffect(() => {
    gaugeValue.value = withDelay(
      300,
      withTiming(progressPct, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [progressPct]);

  const gaugeAnimStyle = useAnimatedStyle(() => {
    const clampedWidth = Math.max(gaugeValue.value, 2);
    return {
      width: `${clampedWidth}%`,
    };
  });

  return (
    <ChromaCard slideIndex={2}>
      <View style={{ flex: 1, justifyContent: "space-between" }}>
        {/* ── Header ── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <LinearGradient
              colors={[t.accent, t.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <Ionicons name="compass" size={16} color="#001A14" />
            </LinearGradient>
            <View>
              <Text
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 9,
                  fontWeight: "600",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                {props.timeFilter === "all" ? "Ringkasan" : "Proyeksi"}
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 8,
                  marginTop: 1,
                }}
              >
                Estimasi keuangan
              </Text>
            </View>
          </View>
          {props.projectionData && (
            <GlassChip
              icon={statusIcon}
              label={statusLabel}
              color={statusColor}
            />
          )}
        </View>

        {/* ── Hero Net Cashflow ── */}
        <View>
          <Text
            style={{
              color: "rgba(255,255,255,0.35)",
              fontSize: 10,
              letterSpacing: 0.8,
              marginBottom: 2,
              textTransform: "uppercase",
            }}
          >
            {props.timeFilter === "all" ? "Saldo Netto" : "Arus Kas"}
          </Text>
          <AnimatedNumber
            value={`${props.filteredPeriodNetto > 0 ? "+" : ""}${formatCurrency(
              safeNumber(props.filteredPeriodNetto),
            )}`}
            duration={1000}
            style={{ color: netColor, fontSize: 28, lineHeight: 36 }}
          />
        </View>

        {/* ── Gauge Bar + Detail Pills ── */}
        {props.hasFinancialData && props.projectionData ? (
          <View>
            {/* Animated gauge */}
            <View style={{ marginBottom: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 5,
                }}
              >
                <Text
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 8,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Periode berjalan
                </Text>
                <Text
                  style={{
                    color: t.accent,
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  {Math.round(progressPct)}%
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <Animated.View
                  style={[
                    {
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: statusColor,
                    },
                    gaugeAnimStyle,
                  ]}
                />
              </View>
            </View>

            {/* Detail pills */}
            {props.projectionData.daysRemaining > 0 && (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(255,255,255,0.04)",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.08)",
                    padding: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <Ionicons
                      name="time-outline"
                      size={11}
                      color={t.accent}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: 8,
                        fontWeight: "600",
                        letterSpacing: 0.8,
                        textTransform: "uppercase",
                      }}
                    >
                      Tersisa
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: G_TEXT,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    {props.projectionData.daysRemaining} hari
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(255,255,255,0.04)",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.08)",
                    padding: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <Ionicons
                      name="calculator-outline"
                      size={11}
                      color={projBalColor}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: 8,
                        fontWeight: "600",
                        letterSpacing: 0.8,
                        textTransform: "uppercase",
                      }}
                    >
                      Est. Saldo
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: projBalColor,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {(props.projectionData.projectedBalance ?? 0) >= 0
                      ? "+"
                      : ""}
                    {formatCurrency(
                      safeNumber(props.projectionData.projectedBalance),
                    )}
                  </Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={{ height: 40 }} />
        )}
      </View>
    </ChromaCard>
  );
};

// ─── CarouselItem ────────────────────────────────────────────────────────────────
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
      [0.9, 1, 0.9],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolation.CLAMP,
    );
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [15, 0, 15],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
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

// ─── PaginationDot — color-coded per slide ───────────────────────────────────────
const PaginationDot = ({
  index,
  scrollX,
}: {
  index: number;
  scrollX: SharedValue<number>;
}) => {
  const accent = SLIDE_THEMES[index].accent;

  const dotStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];
    const width = interpolate(
      scrollX.value,
      inputRange,
      [6, 28, 6],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.15, 1, 0.15],
      Extrapolation.CLAMP,
    );
    const height = interpolate(
      scrollX.value,
      inputRange,
      [6, 6, 6],
      Extrapolation.CLAMP,
    );
    return { width, opacity, height };
  });

  return (
    <Animated.View
      style={[
        {
          borderRadius: 3,
          backgroundColor: accent,
          marginHorizontal: 4,
        },
        dotStyle,
      ]}
    />
  );
};

// ─── Main export ─────────────────────────────────────────────────────────────────
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
          <CarouselItem index={index} scrollX={scrollX} carouselProps={props} />
        )}
      />

      {/* Premium pagination dots */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          marginTop: 16,
        }}
      >
        {Array.from({ length: SLIDE_COUNT }, (_, i) => (
          <PaginationDot key={i} index={i} scrollX={scrollX} />
        ))}
      </View>
    </View>
  );
};
