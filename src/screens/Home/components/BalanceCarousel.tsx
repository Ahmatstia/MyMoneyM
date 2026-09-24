import React, { useEffect, useState } from "react";
import { View, Text, Dimensions, TouchableOpacity } from "react-native";
import * as Clipboard from "expo-clipboard";
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
import {
  calculateDailyPlanAllowance,
  formatCurrency,
  safeNumber,
} from "../../../utils/calculations";
import { getJakartaDateKey } from "../../../utils/dailyCheckIn";
import {
  Transaction,
  Budget,
  CustomCategory,
  Wallet,
  DailyPlan,
} from "../../../types";

// ─── Constants & Card Geometry (ISO 7810 Ratio ~1.58:1) ───────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 44;
const CARD_HEIGHT = 216;
const CARD_RADIUS = 22;
const CARD_GAP = 12;
const SLIDE_COUNT = 4;

// ─── Color Tokens ──────────────────────────────────────────────────────────────
const G_TEXT = "#FFFFFF";
const G_DIM = "#A0AEC0";
const G_SUCCESS = "#10B981";
const G_ERROR = "#F43F5E";
const G_WARNING = "#F59E0B";

// ─── Helper: Hex to RGB ────────────────────────────────────────────────────────
export interface SlideTheme {
  accent: string;
  gradientColors: [string, string, string];
  subtlePatternColor: string;
  networkColor1: string;
  networkColor2: string;
}

// ─── Dynamic Palette Generator for Primary Wallet (Slide 1) ───────────────────
export const buildDynamicTheme = (walletColor?: string): SlideTheme => {
  const base = walletColor || "#10B981";
  const startColor =
    base.startsWith("#") && base.length === 7 ? `${base}C7` : base;

  return {
    accent: base,
    gradientColors: [startColor, "#06334F", "#011827"],
    subtlePatternColor: `${base}18`,
    networkColor1: "#EF4444",
    networkColor2: "#F59E0B",
  };
};

// ─── Curated Distinct Themes for Slides 2, 3, 4 ─────────────────────────────────
export const FIXED_SLIDE_THEMES: Record<number, SlideTheme> = {
  1: {
    accent: "#A78BFA",
    gradientColors: ["#26203D", "#151226", "#090812"],
    subtlePatternColor: "rgba(255,255,255,0.05)",
    networkColor1: "#C4B5FD",
    networkColor2: "#7C3AED",
  },
  2: {
    accent: "#22D3EE",
    gradientColors: ["#15313A", "#0B1C22", "#070C0E"],
    subtlePatternColor: "rgba(255,255,255,0.05)",
    networkColor1: "#06B6D4",
    networkColor2: "#0EA5E9",
  },
  3: {
    accent: "#FBBF24",
    gradientColors: ["#342712", "#1D160B", "#0D0A05"],
    subtlePatternColor: "rgba(255,255,255,0.05)",
    networkColor1: "#F59E0B",
    networkColor2: "#EF4444",
  },
};

// ─── Interface ──────────────────────────────────────────────────────────────────
export interface BalanceCarouselProps {
  hasFinancialData: boolean;
  balance: number;
  operationalBalance: number;
  filteredIncome: number;
  filteredExpense: number;
  timeFilter: string;
  filteredPeriodNetto: number;
  projectionData: any;
  activeCycle?: any;
  openingBalance: number;
  filteredTransactions?: Transaction[];
  allTransactions?: Transaction[];
  budgets?: Budget[];
  customCategories?: CustomCategory[];
  dailyPlans?: DailyPlan[];
  wallets?: Wallet[];
  defaultWallet?: Wallet | null;
  profileName?: string;
}

// ─── Helper: Teks "sisa X hari lagi" ──────────────────────────────────────────
const getPeriodEndLabel = (
  timeFilter: string,
  projectionData: any,
): string | null => {
  if (!projectionData || timeFilter === "all") return null;

  const days = safeNumber(projectionData.daysRemaining);

  if (days <= 0) {
    if (timeFilter === "weekly") return "Minggu berakhir hari ini";
    if (timeFilter === "monthly") return "Bulan berakhir hari ini";
    if (timeFilter === "yearly") return "Tahun berakhir hari ini";
    return "Hari terakhir pembukuan";
  }

  if (timeFilter === "weekly") {
    return days === 1
      ? "Sisa 1 hari lagi (Mingguan)"
      : `Sisa ${days} hari lagi (Mingguan)`;
  }
  if (timeFilter === "monthly") {
    return days === 1
      ? "Sisa 1 hari lagi bulan ini"
      : `Sisa ${days} hari lagi bulan ini`;
  }
  if (timeFilter === "yearly") {
    return days === 1
      ? "Sisa 1 hari lagi tahun ini"
      : `Sisa ${days} hari lagi tahun ini`;
  }
  return days === 1 ? "Sisa 1 hari lagi" : `Sisa ${days} hari lagi`;
};

// ─── PeriodEndBadge Component ───────────────────────────────────────────────────
const PeriodEndBadge = ({
  timeFilter,
  projectionData,
}: {
  timeFilter: string;
  projectionData: any;
}) => {
  const label = getPeriodEndLabel(timeFilter, projectionData);
  if (!label) return null;

  const isUrgent = safeNumber(projectionData?.daysRemaining) <= 3;

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Ionicons
        name="hourglass-outline"
        size={11}
        color={isUrgent ? "#F59E0B" : "rgba(255,255,255,0.6)"}
        style={{ marginRight: 4 }}
      />
      <Text
        style={{
          color: isUrgent ? "#F59E0B" : "rgba(255,255,255,0.75)",
          fontSize: 10.5,
          fontWeight: isUrgent ? "700" : "500",
        }}
      >
        {label}
      </Text>
    </View>
  );
};

// ─── Dual-Circle Payment Network Emblem ─────────────────────────────────────────
const NetworkEmblem = ({
  color1 = "#EF4444",
  color2 = "#F59E0B",
}: {
  color1?: string;
  color2?: string;
}) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      width: 30,
      height: 18,
      position: "relative",
    }}
  >
    <View
      style={{
        position: "absolute",
        left: 0,
        width: 17,
        height: 17,
        borderRadius: 8.5,
        backgroundColor: color1,
        opacity: 0.9,
      }}
    />
    <View
      style={{
        position: "absolute",
        left: 10,
        width: 17,
        height: 17,
        borderRadius: 8.5,
        backgroundColor: color2,
        opacity: 0.9,
      }}
    />
  </View>
);

// ─── AnimatedNumber ──────────────────────────────────────────────────────────────
const AnimatedNumber = ({
  value,
  style,
  duration = 600,
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
          fontSize: 24,
          fontWeight: "800",
          letterSpacing: -0.5,
          lineHeight: 30,
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

// ─── Neo-Fintech Luxe Card Wrapper (Clean Flat - No Shadows) ────────────────────
const LuxeCardWrapper = ({
  theme,
  children,
}: {
  theme: SlideTheme;
  children: React.ReactNode;
}) => {
  return (
    <View
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: CARD_RADIUS,
      }}
    >
      {/* Satu border lembut agar fokus tetap pada informasi, bukan efek dekoratif. */}
      <LinearGradient
        colors={[
          "rgba(255,255,255,0.18)",
          `${theme.accent}55`,
          "rgba(255,255,255,0.08)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flex: 1,
          borderRadius: CARD_RADIUS,
          padding: 1.5,
        }}
      >
        {/* Card Surface */}
        <LinearGradient
          colors={theme.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            borderRadius: CARD_RADIUS - 1.5,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Cahaya lembut memberi kedalaman tanpa membuat kartu ramai. */}
          <LinearGradient
            colors={[
              "rgba(255,255,255,0.10)",
              "rgba(255,255,255,0.02)",
              "transparent",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: "absolute",
              top: -CARD_HEIGHT * 0.4,
              left: -CARD_WIDTH * 0.3,
              width: CARD_WIDTH * 1.5,
              height: CARD_HEIGHT * 1.4,
              transform: [{ rotate: "-22deg" }],
              opacity: 0.45,
              pointerEvents: "none",
            }}
          />

          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              right: -22,
              bottom: -96,
              width: 118,
              height: 250,
              borderRadius: 118,
              backgroundColor: theme.accent,
              opacity: 0.28,
              transform: [{ rotate: "38deg" }],
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              right: 48,
              bottom: -124,
              width: 88,
              height: 194,
              borderRadius: 90,
              backgroundColor: "#74E6D0",
              opacity: 0.15,
              transform: [{ rotate: "40deg" }],
            }}
          />

          {/* Pola latar yang tenang. */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              bottom: -60,
              right: -50,
              width: 220,
              height: 220,
              borderRadius: 110,
              borderWidth: 1.2,
              borderColor: theme.subtlePatternColor,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              bottom: -35,
              right: -25,
              width: 160,
              height: 160,
              borderRadius: 80,
              borderWidth: 1,
              borderColor: theme.subtlePatternColor,
              opacity: 0.55,
            }}
          />

          {/* Top Edge Neon Accent Line */}
          <LinearGradient
            colors={["transparent", "#FFFFFF", theme.accent, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              position: "absolute",
              top: 0,
              left: 20,
              right: 20,
              height: 1.5,
              opacity: 0.45,
            }}
          />
          {/* Content Layer */}
          <View
            style={{
              flex: 1,
              paddingHorizontal: 16,
              paddingVertical: 13,
              justifyContent: "space-between",
            }}
          >
            {children}
          </View>
        </LinearGradient>
      </LinearGradient>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════
// SLIDE 0 (Slide 1 User) — Kartu Dompet Default (BCA Mobile Layout + Synchronized)
// ═════════════════════════════════════════════════════════════════════════════════
const Slide0 = ({
  props,
  isBalanceHidden,
  onToggleBalance,
}: {
  props: BalanceCarouselProps;
  isBalanceHidden: boolean;
  onToggleBalance: () => void;
}) => {
  const wallet = props.defaultWallet;
  const theme = buildDynamicTheme(wallet?.color);
  const profileName = (props.profileName || "MYMONEY").trim().toUpperCase();
  const [copied, setCopied] = useState(false);

  const formatDisplayAccountNumber = (num?: string) => {
    if (!num || !num.trim()) {
      return "•••• •••• ••••";
    }
    const clean = num.replace(/\s+/g, "");
    if (clean.length <= 4) {
      return `•••• •••• •••• ${clean}`;
    }
    return clean.match(/.{1,4}/g)?.join("  ") || clean;
  };

  const handleCopy = () => {
    if (wallet?.accountNumber) {
      Clipboard.setStringAsync(wallet.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <LuxeCardWrapper theme={theme}>
      {/* ── ROW 1 (TOP): Bank Brand + Contactless + EMV Chip + Hologram ── */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              backgroundColor: "rgba(255,255,255,0.22)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 8,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.35)",
            }}
          >
            <Ionicons name="leaf" size={15} color="#FFFFFF" />
          </View>
          <View>
            <Text
              style={{
                color: G_TEXT,
                fontSize: 13.5,
                fontWeight: "800",
                letterSpacing: -0.2,
              }}
              numberOfLines={1}
            >
              {wallet?.name || "Dompet Utama"}
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: 10.5,
                fontWeight: "700",
                letterSpacing: 0.5,
                marginTop: 0.5,
              }}
            >
              PERSONAL FINANCE
            </Text>
          </View>
        </View>
      </View>

      {/* ── ROW 2 (HERO SALDO - BCA Mobile Style on top) ── */}
      <View style={{ marginTop: 5 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 2,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 10.5,
                fontWeight: "800",
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}
            >
              Saldo Rekening
            </Text>
          </View>

          {/* Interactive Eye Button */}
          <TouchableOpacity
            onPress={onToggleBalance}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.18)",
              paddingHorizontal: 7,
              paddingVertical: 2.5,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.28)",
              gap: 4,
            }}
          >
            <Ionicons
              name={isBalanceHidden ? "eye-off-outline" : "eye-outline"}
              size={11}
              color={G_TEXT}
            />
          </TouchableOpacity>
        </View>

        {isBalanceHidden ? (
          <Text
            style={{
              color: G_TEXT,
              fontSize: 24,
              fontWeight: "800",
              letterSpacing: 3,
              lineHeight: 30,
            }}
          >
            Rp ••••••••
          </Text>
        ) : (
          <AnimatedNumber
            value={
              wallet
                ? `${wallet.balance < 0 ? "-" : ""}${formatCurrency(Math.abs(wallet.balance || 0))}`
                : "Rp 0"
            }
            style={{
              color: wallet && wallet.balance < 0 ? G_ERROR : G_TEXT,
              fontSize: 24,
              fontWeight: "800",
              lineHeight: 30,
            }}
          />
        )}
      </View>

      <Text
        numberOfLines={1}
        style={{
          color: "rgba(255,255,255,0.88)",
          fontSize: 13,
          fontWeight: "800",
          letterSpacing: 1.3,
          marginTop: 2,
          alignSelf: "flex-end",
        }}
      >
        {profileName}
      </Text>

      {/* ── ROW 3 (BOTTOM): Nomor Kartu + Detail Status + Copy Button ── */}
      <View
        style={{
          paddingTop: 6,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.15)",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Nomor Kartu */}
          <TouchableOpacity
            onPress={handleCopy}
            activeOpacity={0.7}
            style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
          >
            <Text
              style={{
                color: G_TEXT,
                fontSize: 13,
                fontWeight: "800",
                letterSpacing: 2,
              }}
            >
              {formatDisplayAccountNumber(wallet?.accountNumber)}
            </Text>
            {wallet?.accountNumber && (
              <View
                style={{
                  backgroundColor: copied
                    ? "rgba(16, 185, 129, 0.3)"
                    : "rgba(255,255,255,0.15)",
                  paddingHorizontal: 5,
                  paddingVertical: 1.5,
                  borderRadius: 5,
                }}
              >
                <Text
                  style={{
                    color: copied ? "#10B981" : "rgba(255,255,255,0.85)",
                    fontSize: 10.5,
                    fontWeight: "700",
                  }}
                >
                  {copied ? "Tersalin! ✓" : "Salin"}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <NetworkEmblem
            color1={theme.networkColor1}
            color2={theme.networkColor2}
          />
        </View>

        {/* Footer info: Default status & role badge */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 3,
          }}
        ></View>
      </View>
    </LuxeCardWrapper>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════
// SLIDE 1 (Slide 2 User) — Saldo Utama / Total Saldo Semua Dompet (RESTORED DETAILS)
// ═════════════════════════════════════════════════════════════════════════════════
const Slide1 = ({
  props,
  isBalanceHidden,
  onToggleBalance,
}: {
  props: BalanceCarouselProps;
  isBalanceHidden: boolean;
  onToggleBalance: () => void;
}) => {
  const theme = FIXED_SLIDE_THEMES[1];
  const isPositive = props.filteredPeriodNetto >= 0;
  const netColor = isPositive ? "#A7F3D0" : "#FCA5A5";
  const hasChange = props.hasFinancialData && props.filteredPeriodNetto !== 0;

  return (
    <LuxeCardWrapper theme={theme}>
      {/* Row 1: Header Brand + Netto Chip + Toggle Button */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              backgroundColor: "rgba(255,255,255,0.22)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 8,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.35)",
            }}
          >
            <Ionicons name="wallet" size={15} color="#FFFFFF" />
          </View>
          <View>
            <Text
              style={{
                color: G_TEXT,
                fontSize: 13.5,
                fontWeight: "800",
                letterSpacing: -0.2,
              }}
            >
              {props.hasFinancialData
                ? props.timeFilter === "target"
                  ? "Saldo Batas Hari"
                  : "Total Saldo"
                : "My Money"}
            </Text>
            {props.hasFinancialData && (
              <Text
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 10.5,
                  fontWeight: "600",
                }}
              >
                {props.timeFilter === "target"
                  ? "Periode Target Aktif"
                  : "Semua Dompet"}
              </Text>
            )}
          </View>
        </View>

        <View style={{ alignItems: "flex-end", gap: 4 }}>
          {/* Surplus / Deficit Badge placed directly UNDER the Sembunyikan button */}
          {hasChange && (
            <View>
              <Text
                style={{ color: netColor, fontSize: 10.5, fontWeight: "700" }}
              >
                {isPositive ? "+" : "-"}
                {isBalanceHidden
                  ? "••••••"
                  : formatCurrency(
                      safeNumber(Math.abs(props.filteredPeriodNetto)),
                    )}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Row 2: Hero Total Balance Amount */}
      <View style={{ marginTop: 2 }}>
        {!props.hasFinancialData && (
          <Text
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 11,
              marginBottom: 2,
            }}
          >
            Mulai catat transaksi pertamamu
          </Text>
        )}
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          {isBalanceHidden ? (
            <Text
              style={{
                color: G_TEXT,
                fontSize: 24,
                fontWeight: "800",
                letterSpacing: 3,
                lineHeight: 30,
              }}
            >
              Rp ••••••••
            </Text>
          ) : (
            <AnimatedNumber
              value={
                props.hasFinancialData
                  ? (() => {
                      const n = safeNumber(props.balance);
                      return `${n < 0 ? "-" : ""}${formatCurrency(Math.abs(n))}`;
                    })()
                  : "Rp 0"
              }
              style={{
                color:
                  props.hasFinancialData && props.balance < 0
                    ? G_ERROR
                    : G_TEXT,
                fontSize: 24,
                fontWeight: "800",
                lineHeight: 30,
              }}
            />
          )}
        </View>

        {/* RESTORED: Opening Balance Note */}
        {props.timeFilter !== "all" &&
          props.timeFilter !== "target" &&
          props.openingBalance !== 0 && (
          <Text
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: 10.5,
              marginTop: 1,
            }}
          >
            Termasuk saldo awal{" "}
            {isBalanceHidden ? "••••••" : formatCurrency(props.openingBalance)}
          </Text>
        )}
      </View>

      {/* Row 3 (RESTORED PREVIOUS DETAIL): Masuk (Income) & Keluar (Expense) Columns */}
      {props.hasFinancialData && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 10,
            paddingVertical: 5,
            paddingHorizontal: 8,
          }}
        >
          <View style={{ flex: 1, alignItems: "center" }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
            >
              <Ionicons name="arrow-down-circle" size={10} color="#A7F3D0" />
              <Text
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 10.5,
                  fontWeight: "700",
                  textTransform: "uppercase",
                }}
              >
                Masuk
              </Text>
            </View>
            <Text
              style={{
                color: G_TEXT,
                fontSize: 12,
                fontWeight: "800",
                marginTop: 1,
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {isBalanceHidden
                ? "••••••"
                : formatCurrency(safeNumber(props.filteredIncome))}
            </Text>
          </View>

          {/* Vertical Divider */}
          <View
            style={{
              width: 1,
              height: 24,
              backgroundColor: "rgba(255,255,255,0.15)",
              marginHorizontal: 8,
            }}
          />

          <View style={{ flex: 1, alignItems: "center" }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
            >
              <Ionicons name="arrow-up-circle" size={10} color="#FCA5A5" />
              <Text
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 10.5,
                  fontWeight: "700",
                  textTransform: "uppercase",
                }}
              >
                Keluar
              </Text>
            </View>
            <Text
              style={{
                color: G_TEXT,
                fontSize: 12,
                fontWeight: "800",
                marginTop: 1,
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {isBalanceHidden
                ? "••••••"
                : formatCurrency(safeNumber(props.filteredExpense))}
            </Text>
          </View>
        </View>
      )}

      {/* Row 4 (RESTORED PREVIOUS DETAIL): Period End Badge */}
      <View
        style={{
          paddingTop: 5,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.15)",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <PeriodEndBadge
          timeFilter={props.timeFilter}
          projectionData={props.projectionData}
        />
        <Text
          style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: 10.5,
            fontWeight: "600",
          }}
        >
          Seluruh Kas
        </Text>
      </View>
    </LuxeCardWrapper>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════
// SLIDE 2 (Slide 3 User) — Batas Uang & Jatah Kas Harian (RESTORED ALL DETAILS)
// ═════════════════════════════════════════════════════════════════════════════════
const Slide2 = ({
  props,
  isBalanceHidden,
}: {
  props: BalanceCarouselProps;
  isBalanceHidden: boolean;
}) => {
  const theme = FIXED_SLIDE_THEMES[2];

  // Gunakan periode yang sudah dipilih filter Home; projectionData adalah sumber tunggalnya.
  const cycle = props.projectionData?.activeCycle;
  const now = new Date();

  let daysRemaining = 1;
  let totalDays = 30;
  let daysPassed = 1;
  let cycleLabel = "Siklus Bulan Ini";
  let isCustomTarget = false;

  if (cycle && cycle.hasCycle) {
    isCustomTarget = !cycle.isPaydayCycle;
    totalDays = Math.max(1, safeNumber(cycle.totalDays || cycle.period) || 7);
    daysRemaining =
      safeNumber(cycle.daysRemaining) > 0
        ? safeNumber(cycle.daysRemaining)
        : (() => {
            if (cycle.endDate) {
              const endMs = new Date(cycle.endDate).getTime();
              return Math.max(
                1,
                Math.ceil((endMs - now.getTime()) / (1000 * 60 * 60 * 24)),
              );
            }
            return 1;
          })();
    daysPassed = Math.max(
      1,
      Math.min(
        totalDays,
        safeNumber(cycle.daysPassed) || totalDays - daysRemaining + 1,
      ),
    );
    cycleLabel = cycle.label || `Target ${totalDays} Hari`;
  } else if (safeNumber(props.projectionData?.daysRemaining) > 0) {
    daysRemaining = safeNumber(props.projectionData?.daysRemaining);
    totalDays =
      safeNumber(props.projectionData?.totalDays) ||
      new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    daysPassed = Math.max(
      1,
      Math.min(
        totalDays,
        safeNumber(props.projectionData?.daysPassed) ||
          totalDays - daysRemaining,
      ),
    );
    cycleLabel = props.projectionData?.label
      ? `Siklus ${props.projectionData.label}`
      : "Siklus Pembukuan";
  } else {
    const lastDay = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    totalDays = lastDay;
    daysRemaining = Math.max(1, lastDay - now.getDate());
    daysPassed = Math.max(1, totalDays - daysRemaining);
    cycleLabel = "Siklus Bulan Ini";
  }

  // Jatah aman harian dari rencana rekening yang aktif.
  const opBalance = safeNumber(props.operationalBalance);
  const todayKey = getJakartaDateKey();
  const {
    activePlans,
    dailyAmount: planDailyTotal,
    nearestDaysRemaining: planDaysRemaining,
  } = calculateDailyPlanAllowance(
    props.dailyPlans || [],
    props.allTransactions || [],
    todayKey,
  );
  const planTotalDays = activePlans.length
    ? Math.max(
        1,
        (() => {
          const p = activePlans[0];
          const start = new Date(`${p.startDate}T00:00:00`).getTime();
          const end = new Date(`${p.endDate}T00:00:00`).getTime();
          return Math.max(1, Math.round((end - start) / 86400000) + 1);
        })(),
      )
    : Math.max(1, totalDays);

  const planDaysPassed = Math.max(0, planTotalDays - planDaysRemaining + 1);
  const timeProgressPct = activePlans.length
    ? Math.min(
        100,
        Math.max(0, Math.round((planDaysPassed / planTotalDays) * 100)),
      )
    : 0;
  const safeDaily = activePlans.length
    ? Math.max(0, Math.round(planDailyTotal))
    : 0;

  // Status kas
  let statusLabel = "Kas Aman";
  let statusColor = "#67E8F9";
  let statusIcon = "shield-checkmark";

  if (!activePlans.length) {
    statusLabel = "Belum Diatur";
    statusColor = G_WARNING;
    statusIcon = "settings-outline";
  } else if (opBalance <= 0) {
    statusLabel = "Kas Habis";
    statusColor = G_ERROR;
    statusIcon = "alert-circle";
  } else if (safeDaily < 25000) {
    statusLabel = "Perlu Hemat";
    statusColor = G_WARNING;
    statusIcon = "warning";
  } else {
    statusLabel = "Kas Aman";
    statusColor = "#67E8F9";
    statusIcon = "shield-checkmark";
  }

  const progressBarWidth = useSharedValue(0);

  useEffect(() => {
    progressBarWidth.value = withDelay(
      200,
      withTiming(timeProgressPct, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [timeProgressPct]);

  const progressAnimStyle = useAnimatedStyle(() => ({
    width: `${Math.max(progressBarWidth.value, 5)}%`,
  }));

  return (
    <LuxeCardWrapper theme={theme}>
      {/* Row 1: Header + Status Chip */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              backgroundColor: "rgba(255,255,255,0.22)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 8,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.35)",
            }}
          >
            <Ionicons name="compass" size={15} color="#FFFFFF" />
          </View>
          <View>
            <Text
              style={{
                color: G_TEXT,
                fontSize: 13.5,
                fontWeight: "800",
                letterSpacing: -0.2,
              }}
            >
              Batas Belanja
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: 10.5,
                fontWeight: "600",
              }}
            >
              Rekomendasi hari ini
            </Text>
          </View>
        </View>

        {/* Status Chip */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.25)",
            paddingHorizontal: 7,
            paddingVertical: 2.5,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.2)",
            gap: 4,
          }}
        >
          <Ionicons name={statusIcon as any} size={11} color={statusColor} />
          <Text
            style={{ color: statusColor, fontSize: 10.5, fontWeight: "800" }}
          >
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Row 2: Hero Amount & (RESTORED FORMULA NOTE) */}
      <View style={{ marginTop: 2 }}>
        <Text
          style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: 10.5,
            fontWeight: "700",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            marginBottom: 2,
          }}
        >
          Batas belanja hari ini
        </Text>
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          {isBalanceHidden ? (
            <Text
              style={{
                color: G_TEXT,
                fontSize: 24,
                fontWeight: "800",
                letterSpacing: 3,
                lineHeight: 30,
              }}
            >
              Rp •••••• / hari
            </Text>
          ) : activePlans.length ? (
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <AnimatedNumber
                value={formatCurrency(safeDaily)}
                style={{
                  color: opBalance <= 0 ? G_ERROR : G_TEXT,
                  fontSize: 24,
                  lineHeight: 30,
                }}
              />
              <Text
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 10,
                  fontWeight: "600",
                  marginLeft: 4,
                }}
              >
                /hari
              </Text>
            </View>
          ) : (
            <Text style={{ color: G_TEXT, fontSize: 20, fontWeight: "800" }}>
              Belum diatur
            </Text>
          )}
        </View>

        <Text
          style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: 10.5,
            marginTop: 1,
          }}
          numberOfLines={1}
        >
          {isBalanceHidden
            ? "Rencana belanja aktif"
            : activePlans.length
              ? `${activePlans.length} rekening memiliki target aktif`
              : "Belum ada target belanja aktif"}
        </Text>
      </View>

      {/* Progress detail is intentionally hidden: one card should show one clear decision. */}
      <View style={{ display: "none" }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 3,
          }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: 10.5,
              fontWeight: "600",
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            {activePlans.length
              ? "Rencana belanja aktif"
              : "Belum ada rencana aktif"}
          </Text>
          <Text
            style={{
              color: "#67E8F9",
              fontSize: 10.5,
              fontWeight: "700",
            }}
          >
            {activePlans.length
              ? `${planDaysRemaining} hari tersisa`
              : "Atur dari transaksi pemasukan"}
          </Text>
        </View>

        <View
          style={{
            height: 4.5,
            backgroundColor: "rgba(0,0,0,0.3)",
            borderRadius: 2.5,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={[
              {
                height: 4.5,
                borderRadius: 2.5,
                backgroundColor: "#22D3EE",
              },
              progressAnimStyle,
            ]}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 3,
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 10.5 }}>
            Rekening aktif: {activePlans.length}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 10.5 }}>
            {activePlans.length ? "Berjalan" : "Menunggu target"}
          </Text>
        </View>
      </View>

      {/* Row 4 (RESTORED PREVIOUS DETAIL): Footer Hourglass & Status */}
      <View
        style={{
          paddingTop: 5,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.15)",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons
            name="hourglass-outline"
            size={8}
            color={daysRemaining <= 3 ? G_WARNING : "rgba(255,255,255,0.7)"}
            style={{ marginRight: 4 }}
          />
          <Text
            style={{
              color: daysRemaining <= 3 ? G_WARNING : "rgba(255,255,255,0.75)",
              fontSize: 10.5,
              fontWeight: daysRemaining <= 3 ? "700" : "500",
            }}
          >
            {activePlans.length
              ? planDaysRemaining <= 1
                ? "Target berakhir besok"
                : `Target berakhir dalam ${planDaysRemaining} hari`
              : "Buat target saat mencatat pemasukan"}
          </Text>
        </View>
        <Text
          style={{
            color: "#67E8F9",
            fontSize: 10.5,
            fontWeight: "700",
          }}
        >
          Target Harian
        </Text>
      </View>
    </LuxeCardWrapper>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════
// SLIDE 3 (Slide 4 User) — Kontrol Anggaran Bulanan (RESTORED ALL DETAILS)
// ═════════════════════════════════════════════════════════════════════════════════
const Slide3 = ({
  props,
  isBalanceHidden,
}: {
  props: BalanceCarouselProps;
  isBalanceHidden: boolean;
}) => {
  const theme = FIXED_SLIDE_THEMES[3];
  const budgets = props.budgets || [];
  const hasBudgets = budgets.length > 0;

  const totalLimit = budgets.reduce((sum, b) => sum + safeNumber(b.limit), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + safeNumber(b.spent), 0);
  const remainingBudget = Math.max(0, totalLimit - totalSpent);
  const isOverbudget = totalLimit > 0 && totalSpent > totalLimit;
  const burnRatePct =
    totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  // Sisa hari menuju reset bulan
  const daysRemaining =
    safeNumber(props.projectionData?.daysRemaining) > 0
      ? safeNumber(props.projectionData?.daysRemaining)
      : (() => {
          const now = new Date();
          const lastDay = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
          ).getDate();
          return Math.max(1, lastDay - now.getDate());
        })();

  // Jatah harian khusus dari sisa anggaran
  const dailyBudgetQuota = hasBudgets
    ? Math.max(0, Math.round(remainingBudget / Math.max(1, daysRemaining)))
    : 0;

  // Status computation
  let statusLabel = "Terkendali";
  let statusColor = "#FDE68A";
  let statusIcon = "shield-checkmark";

  if (hasBudgets) {
    if (isOverbudget) {
      statusLabel = "Overbudget";
      statusColor = G_ERROR;
      statusIcon = "alert-circle";
    } else if (burnRatePct >= 80) {
      statusLabel = "Waspada";
      statusColor = G_WARNING;
      statusIcon = "warning";
    } else {
      statusLabel = "Terkendali";
      statusColor = "#FDE68A";
      statusIcon = "shield-checkmark";
    }
  } else {
    statusLabel = "Belum Ada";
    statusColor = G_DIM;
    statusIcon = "options-outline";
  }

  const budgetProgress = useSharedValue(0);

  useEffect(() => {
    budgetProgress.value = withDelay(
      200,
      withTiming(hasBudgets ? Math.min(100, burnRatePct) : 0, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [hasBudgets, burnRatePct]);

  const budgetAnimStyle = useAnimatedStyle(() => ({
    width: `${Math.max(budgetProgress.value, hasBudgets && burnRatePct > 0 ? 3 : 0)}%`,
  }));

  return (
    <LuxeCardWrapper theme={theme}>
      {/* Row 1: Header + Status Chip */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              backgroundColor: "rgba(255,255,255,0.22)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 8,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.35)",
            }}
          >
            <Ionicons name="calculator" size={15} color="#FFFFFF" />
          </View>
          <View>
            <Text
              style={{
                color: G_TEXT,
                fontSize: 13.5,
                fontWeight: "800",
                letterSpacing: -0.2,
              }}
            >
              Kontrol Anggaran
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: 10.5,
                fontWeight: "600",
              }}
            >
              {hasBudgets ? "Anggaran Bulan Ini" : "Belum Ada Pos Anggaran"}
            </Text>
          </View>
        </View>

        {/* Status Badge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.25)",
            paddingHorizontal: 7,
            paddingVertical: 2.5,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.2)",
            gap: 4,
          }}
        >
          <Ionicons name={statusIcon as any} size={11} color={statusColor} />
          <Text
            style={{ color: statusColor, fontSize: 10.5, fontWeight: "800" }}
          >
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Row 2: Hero Content & Target Harian */}
      <View style={{ marginTop: 2 }}>
        {hasBudgets ? (
          <>
            <Text
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: 10.5,
                fontWeight: "700",
                letterSpacing: 0.8,
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              Sisa Anggaran
            </Text>
            {isBalanceHidden ? (
              <Text
                style={{
                  color: G_TEXT,
                  fontSize: 24,
                  fontWeight: "800",
                  letterSpacing: 3,
                  lineHeight: 30,
                }}
              >
                Rp ••••••
              </Text>
            ) : (
              <AnimatedNumber
                value={formatCurrency(remainingBudget)}
                style={{
                  color: isOverbudget ? G_ERROR : G_TEXT,
                  fontSize: 24,
                  lineHeight: 30,
                }}
              />
            )}
            {/* Target Harian / Status Overbudget */}
            <Text
              style={{
                color: isOverbudget ? G_ERROR : "rgba(255,255,255,0.75)",
                fontSize: 10.5,
                marginTop: 1,
              }}
              numberOfLines={1}
            >
              {isOverbudget
                ? `Melebihi anggaran ${isBalanceHidden ? "••••••" : formatCurrency(totalSpent - totalLimit)}!`
                : `Target: ~${isBalanceHidden ? "••••••" : formatCurrency(dailyBudgetQuota)} / hari`}
            </Text>
          </>
        ) : (
          <>
            <Text
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 20,
                fontWeight: "700",
                lineHeight: 26,
              }}
            >
              Belum Ada Anggaran
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: 10.5,
                marginTop: 1,
              }}
              numberOfLines={1}
            >
              Pasang batas belanja bulanan per pos kategori
            </Text>
          </>
        )}
      </View>

      {/* Row 3: Progress Bar & Ringkasan */}
      <View style={{ marginTop: 2 }}>
        {hasBudgets ? (
          <>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 3,
              }}
            >
              <Text
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 10.5,
                  fontWeight: "600",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                Anggaran Terpakai
              </Text>
              <Text
                style={{
                  color: statusColor,
                  fontSize: 10.5,
                  fontWeight: "700",
                }}
              >
                {burnRatePct}%
              </Text>
            </View>
            <View
              style={{
                height: 4.5,
                backgroundColor: "rgba(0,0,0,0.3)",
                borderRadius: 2.5,
                overflow: "hidden",
              }}
            >
              <Animated.View
                style={[
                  {
                    height: 4.5,
                    borderRadius: 2.5,
                    backgroundColor: statusColor,
                  },
                  budgetAnimStyle,
                ]}
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 3,
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 10.5 }}>
                Terpakai: {isBalanceHidden ? "••••••" : formatCurrency(totalSpent)}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 10.5 }}>
                Total: {isBalanceHidden ? "••••••" : formatCurrency(totalLimit)}
              </Text>
            </View>
          </>
        ) : (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(245,166,35,0.12)",
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 5,
              borderWidth: 1,
              borderColor: "rgba(245,166,35,0.2)",
            }}
          >
            <Ionicons
              name="bulb-outline"
              size={12}
              color={theme.accent}
              style={{ marginRight: 5 }}
            />
            <Text
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 10.5,
                fontWeight: "600",
              }}
            >
              Pasang limit belanja bulanan di menu Anggaran.
            </Text>
          </View>
        )}
      </View>

      {/* Row 4: Footer */}
      <View
        style={{
          paddingTop: 5,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.15)",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons
            name="calendar-outline"
            size={10}
            color="rgba(255,255,255,0.7)"
            style={{ marginRight: 4 }}
          />
          <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 10.5 }}>
            {hasBudgets
              ? `${daysRemaining} hari tersisa bulan ini`
              : "Disiplin finansial dimulai dari limit"}
          </Text>
        </View>
        <Text
          style={{ color: theme.accent, fontSize: 10.5, fontWeight: "700" }}
        >
          Anggaran Bulanan
        </Text>
      </View>
    </LuxeCardWrapper>
  );
};

// ─── CarouselItem ────────────────────────────────────────────────────────────────
const CarouselItem = ({
  index,
  scrollX,
  carouselProps,
  isBalanceHidden,
  onToggleBalance,
}: {
  index: number;
  scrollX: SharedValue<number>;
  carouselProps: BalanceCarouselProps;
  isBalanceHidden: boolean;
  onToggleBalance: () => void;
}) => {
  const step = CARD_WIDTH + CARD_GAP;
  const animStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * step, index * step, (index + 1) * step];
    return {
      transform: [
        {
          scale: interpolate(
            scrollX.value,
            inputRange,
            [0.92, 1, 0.92],
            Extrapolation.CLAMP,
          ),
        },
      ],
      opacity: interpolate(
        scrollX.value,
        inputRange,
        [0.65, 1, 0.65],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <Animated.View
      style={[{ width: CARD_WIDTH, marginRight: CARD_GAP }, animStyle]}
    >
      {index === 0 && (
        <Slide0
          props={carouselProps}
          isBalanceHidden={isBalanceHidden}
          onToggleBalance={onToggleBalance}
        />
      )}
      {index === 1 && (
        <Slide1
          props={carouselProps}
          isBalanceHidden={isBalanceHidden}
          onToggleBalance={onToggleBalance}
        />
      )}
      {index === 2 && (
        <Slide2 props={carouselProps} isBalanceHidden={isBalanceHidden} />
      )}
      {index === 3 && (
        <Slide3 props={carouselProps} isBalanceHidden={isBalanceHidden} />
      )}
    </Animated.View>
  );
};

// ─── PaginationDot ──────────────────────────────────────────────────────────────
const PaginationDot = ({
  index,
  scrollX,
  walletColor,
}: {
  index: number;
  scrollX: SharedValue<number>;
  walletColor?: string;
}) => {
  const accent =
    index === 0
      ? walletColor || "#3B82F6"
      : FIXED_SLIDE_THEMES[index]?.accent || "#10B981";

  const step = CARD_WIDTH + CARD_GAP;
  const dotStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * step, index * step, (index + 1) * step];
    return {
      width: interpolate(
        scrollX.value,
        inputRange,
        [6, 26, 6],
        Extrapolation.CLAMP,
      ),
      opacity: interpolate(
        scrollX.value,
        inputRange,
        [0.25, 1, 0.25],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <Animated.View
      style={[
        {
          borderRadius: 3,
          backgroundColor: accent,
          marginHorizontal: 3,
          height: 6,
        },
        dotStyle,
      ]}
    />
  );
};

// ─── Main Component Export ──────────────────────────────────────────────────────
export const BalanceCarousel: React.FC<BalanceCarouselProps> = (props) => {
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const handleToggleBalance = () => setIsBalanceHidden((prev) => !prev);
  const scrollX = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const snapInterval = CARD_WIDTH + CARD_GAP;

  return (
    <View style={{ marginBottom: 20 }}>
      <Animated.FlatList
        data={Array.from({ length: SLIDE_COUNT }, (_, i) => i)}
        keyExtractor={(item) => item.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        snapToAlignment="start"
        decelerationRate="fast"
        bounces={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingHorizontal: 0,
        }}
        renderItem={({ index }) => (
          <CarouselItem
            index={index}
            scrollX={scrollX}
            carouselProps={props}
            isBalanceHidden={isBalanceHidden}
            onToggleBalance={handleToggleBalance}
          />
        )}
      />

      {/* Dynamic Luminous Pagination Indicator */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          marginTop: 12,
        }}
      >
        {Array.from({ length: SLIDE_COUNT }, (_, i) => (
          <PaginationDot
            key={i}
            index={i}
            scrollX={scrollX}
            walletColor={props.defaultWallet?.color}
          />
        ))}
      </View>

      {/* Time Filter Subtitle */}
      <Text
        style={{
          color: "rgba(255,255,255,0.45)",
          fontSize: 11,
          textAlign: "center",
          marginTop: 5,
          fontWeight: "600",
          letterSpacing: 0.5,
        }}
      >
        {props.timeFilter === "all"
          ? "Seluruh riwayat keuangan"
          : props.timeFilter === "monthly"
            ? "Bulan ini"
            : props.timeFilter === "weekly"
              ? "Minggu ini"
              : props.timeFilter === "yearly"
                ? "Tahun ini"
                : props.timeFilter}
      </Text>
    </View>
  );
};
