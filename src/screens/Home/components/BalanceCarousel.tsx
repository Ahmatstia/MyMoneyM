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
import { Transaction, Budget, CustomCategory, Wallet } from "../../../types";
import { DEFAULT_CATEGORIES, ALL_SYSTEM_CATEGORIES } from "../../../constants/categories";

// ─── Constants ──────────────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = 210;
const CARD_RADIUS = 28;
const BORDER_W = 1.5;
const SLIDE_COUNT = 4;

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
const SLIDE_THEMES = [
  {
    // Slide 0 — Default Wallet Card (Indigo/Violet)
    accent: "#818CF8",
    gradientStart: "#050814",
    gradientEnd: "#0D1230",
    glowColor: "#6366F1",
    accentDark: "#6366F1",
    accentDeep: "#312E81",
  },
  {
    // Slide 1 — Total Balance (Green)
    accent: G_GREEN_PRIMARY,
    gradientStart: "#001A08",
    gradientEnd: "#0A2E15",
    glowColor: G_GREEN_PRIMARY,
    accentDark: G_GREEN_DARK,
    accentDeep: G_GREEN_DEEP,
  },
  {
    // Slide 2 — Batas Uang (Teal)
    accent: "#00D4AA",
    gradientStart: "#001A14",
    gradientEnd: "#052E24",
    glowColor: "#00D4AA",
    accentDark: "#00B894",
    accentDeep: "#006B56",
  },
  {
    // Slide 3 — Kontrol Anggaran (Gold)
    accent: G_GOLD,
    gradientStart: "#1A1100",
    gradientEnd: "#2A1C05",
    glowColor: G_GOLD,
    accentDark: "#D4890A",
    accentDeep: "#8B5E00",
  },
];

// ─── Interface ──────────────────────────────────────────────────────────────────
interface BalanceCarouselProps {
  hasFinancialData: boolean;
  balance: number;             // Net worth total (income − expense all wallets) → Slide 1
  operationalBalance: number;  // Saldo kas yang bisa dibelanjakan (non-savings wallets) → Slide 2
  filteredIncome: number;
  filteredExpense: number;
  timeFilter: string;
  filteredPeriodNetto: number;
  projectionData: any;
  openingBalance: number;
  filteredTransactions?: Transaction[];
  budgets?: Budget[];
  customCategories?: CustomCategory[];
  defaultWallet?: Wallet | null;  // Default wallet for Slide 0 card display
}

// ─── Helper: Resolve Category Info ──────────────────────────────────────────────
const resolveCategoryInfo = (
  categoryName: string,
  customCategories?: CustomCategory[]
): { icon: string; color: string; name: string } => {
  if (!categoryName) {
    return { icon: "receipt-outline", color: G_DIM, name: "Lainnya" };
  }
  const custom = customCategories?.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase()
  );
  if (custom) {
    return {
      icon: custom.icon || "pricetag-outline",
      color: custom.color || G_GOLD,
      name: custom.name,
    };
  }
  const def = ALL_SYSTEM_CATEGORIES.find(
    (c) =>
      c.name.toLowerCase() === categoryName.toLowerCase() ||
      (categoryName.toLowerCase() === "gaji" && c.id === "pemasukan"),
  );
  if (def) {
    return { icon: def.icon, color: def.color, name: def.name };
  }
  return { icon: "receipt-outline", color: G_DIM, name: categoryName };
};

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
    return days === 1 ? "Sisa 1 hari lagi (Mingguan)" : `Sisa ${days} hari lagi (Mingguan)`;
  }
  if (timeFilter === "monthly") {
    return days === 1 ? "Sisa 1 hari lagi bulan ini" : `Sisa ${days} hari lagi bulan ini`;
  }
  if (timeFilter === "yearly") {
    return days === 1 ? "Sisa 1 hari lagi tahun ini" : `Sisa ${days} hari lagi tahun ini`;
  }
  return days === 1 ? "Sisa 1 hari lagi" : `Sisa ${days} hari lagi`;
};

// ─── PeriodEndBadge ─────────────────────────────────────────────────────────────
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
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
      <Ionicons
        name="hourglass-outline"
        size={7}
        color={isUrgent ? "#FFB84D" : "rgba(255,255,255,0.25)"}
        style={{ marginRight: 3 }}
      />
      <Text
        style={{
          color: isUrgent ? "rgba(255,184,77,0.8)" : "rgba(255,255,255,0.25)",
          fontSize: 7,
          fontWeight: isUrgent ? "600" : "400",
        }}
      >
        {label}
      </Text>
    </View>
  );
};

// ─── AnimatedNumber ──────────────────────────────────────────────────────────────
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

// ─── GlowOrb ────────────────────────────────────────────────────────────────────
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

// ─── ChromaCard ─────────────────────────────────────────────────────────────────
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
      <View
        style={{
          flex: 1,
          borderRadius: CARD_RADIUS,
          overflow: "hidden",
          backgroundColor: "rgba(6,13,10,0.6)",
        }}
      >
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
        <View style={{ flex: 1, padding: 20 }}>{children}</View>
      </View>
    </LinearGradient>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════
// SLIDE 0 — Kartu Dompet Default (Default Wallet Card)
// ═════════════════════════════════════════════════════════════════════════════════
const Slide0 = (props: BalanceCarouselProps) => {
  const t = SLIDE_THEMES[0];
  const wallet = props.defaultWallet;

  // Format account number with dots masking (e.g. ••• ••• 1234)
  const formatAccountNumber = (num?: string) => {
    if (!num) return null;
    if (num.length <= 4) return `•••• ${num}`;
    return `•••• •••• ${num.slice(-4)}`;
  };

  const walletTypeLabel = {
    bank: "Rekening Bank",
    ewallet: "Dompet Digital",
    cash: "Uang Tunai",
    investment: "Investasi",
    credit: "Kredit / Paylater",
  }[wallet?.type || "cash"] || "Dompet";

  const walletIcon = wallet?.icon || "card";
  const walletColor = wallet?.color || t.accent;

  return (
    <ChromaCard slideIndex={0}>
      <View style={{ flex: 1, justifyContent: "space-between" }}>
        {/* Row 1: Brand + Default Badge */}
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
                width: 26,
                height: 26,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 8,
              }}
            >
              <Ionicons name={walletIcon as any} size={13} color="#050814" />
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
                Dompet Utama
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 7,
                  marginTop: 1,
                }}
              >
                {walletTypeLabel}
              </Text>
            </View>
          </View>
          <GlassChip
            icon="star"
            label="Default"
            color={t.accent}
            compact
          />
        </View>

        {/* Row 2: Wallet Name + Account Number */}
        <View style={{ marginTop: 4 }}>
          <Text
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 8,
              fontWeight: "600",
              letterSpacing: 0.8,
              textTransform: "uppercase",
              marginBottom: 2,
            }}
          >
            {wallet ? wallet.name : "Belum Ada Dompet"}
          </Text>
          {wallet?.accountNumber ? (
            <Text
              style={{
                color: G_TEXT,
                fontSize: 18,
                fontWeight: "700",
                letterSpacing: 4,
                lineHeight: 26,
              }}
            >
              {formatAccountNumber(wallet.accountNumber)}
            </Text>
          ) : (
            <Text
              style={{
                color: "rgba(255,255,255,0.25)",
                fontSize: 13,
                fontWeight: "500",
                letterSpacing: 2,
                lineHeight: 22,
              }}
            >
              •••• •••• ••••
            </Text>
          )}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: walletColor,
                marginRight: 5,
                opacity: 0.9,
              }}
            />
            <Text
              style={{
                color: t.accent,
                fontSize: 9,
                fontWeight: "700",
              }}
            >
              Saldo Khusus Rekening Ini
            </Text>
          </View>
          <AnimatedNumber
            value={wallet ? `${wallet.balance < 0 ? "-" : ""}${formatCurrency(Math.abs(wallet.balance || 0))}` : "Rp 0"}
            style={{
              color: wallet && wallet.balance < 0 ? G_ERROR : G_TEXT,
              fontSize: 22,
              lineHeight: 28,
            }}
          />
        </View>

        {/* Row 3: Footer with chip details */}
        <View
          style={{
            paddingTop: 4,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.06)",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="shield-checkmark-outline"
              size={8}
              color="rgba(255,255,255,0.3)"
              style={{ marginRight: 4 }}
            />
            <Text
              style={{
                color: "rgba(255,255,255,0.35)",
                fontSize: 8,
              }}
            >
              {wallet?.isDefault ? "Rekening transaksi utama" : "Bukan rekening utama"}
            </Text>
          </View>
          <Text
            style={{
              color: t.accent,
              fontSize: 9,
              fontWeight: "600",
            }}
          >
            {wallet?.role
              ? wallet.role.charAt(0).toUpperCase() + wallet.role.slice(1)
              : "Dompet"}
          </Text>
        </View>
      </View>
    </ChromaCard>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — Saldo Utama
// ═════════════════════════════════════════════════════════════════════════════════
const Slide1 = (props: BalanceCarouselProps) => {
  const t = SLIDE_THEMES[1];
  const isPositive = props.filteredPeriodNetto >= 0;
  const netColor = isPositive ? G_SUCCESS : G_ERROR;
  const hasChange = props.hasFinancialData && props.filteredPeriodNetto !== 0;

  return (
    <ChromaCard slideIndex={0}>
      <View style={{ flex: 1, justifyContent: "space-between" }}>
        {/* Row 1: Brand */}
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
                  Semua Dompet
                </Text>
              )}
            </View>
          </View>
          {hasChange && (
            <GlassChip
              icon={isPositive ? "trending-up" : "trending-down"}
              label={`${isPositive ? "+" : "-"}${formatCurrency(safeNumber(Math.abs(props.filteredPeriodNetto)))}`}
              color={netColor}
              compact
            />
          )}
        </View>

        {/* Row 2: Balance */}
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
              }}
            />
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
          {props.timeFilter !== "all" && props.openingBalance !== 0 && (
            <Text
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 9,
                marginTop: 1,
              }}
            >
              Termasuk saldo awal {formatCurrency(props.openingBalance)}
            </Text>
          )}
        </View>

        {/* Row 3: Income/Expense with divider */}
        {props.hasFinancialData && (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 9,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  textAlign: "center",
                }}
              >
                Masuk
              </Text>
              <Text
                style={{
                  color: G_TEXT,
                  fontSize: 12,
                  fontWeight: "700",
                  textAlign: "center",
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(safeNumber(props.filteredIncome))}
              </Text>
            </View>
            <View
              style={{
                width: 1,
                height: 32,
                backgroundColor: "rgba(255,255,255,0.1)",
                marginHorizontal: 8,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 9,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  textAlign: "center",
                }}
              >
                Keluar
              </Text>
              <Text
                style={{
                  color: G_TEXT,
                  fontSize: 12,
                  fontWeight: "700",
                  textAlign: "center",
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(safeNumber(props.filteredExpense))}
              </Text>
            </View>
          </View>
        )}

        {/* Row 4: Period end badge only */}
        <View
          style={{
            paddingTop: 4,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.06)",
          }}
        >
          <PeriodEndBadge
            timeFilter={props.timeFilter}
            projectionData={props.projectionData}
          />
        </View>
      </View>
    </ChromaCard>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — Batas Uang & Uang Bertahan (Safe Daily Spend)
// ═════════════════════════════════════════════════════════════════════════════════
const Slide2 = (props: BalanceCarouselProps) => {
  const t = SLIDE_THEMES[2];

  // Sisa hari menuju reset bulan atau siklus
  const daysRemaining = safeNumber(props.projectionData?.daysRemaining) > 0
    ? safeNumber(props.projectionData?.daysRemaining)
    : (() => {
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        return Math.max(1, lastDay - now.getDate());
      })();

  // Total hari dalam bulan ini (untuk progress bar visual)
  const totalDaysInMonth = (() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  })();
  const daysPassed = Math.max(1, totalDaysInMonth - daysRemaining);
  const timeProgressPct = Math.min(100, Math.round((daysPassed / totalDaysInMonth) * 100));

  // Jatah aman harian kas operasional
  const opBalance = safeNumber(props.operationalBalance);
  const safeDaily = Math.max(0, Math.round(opBalance / Math.max(1, daysRemaining)));

  // Status kas
  let statusLabel = "Kas Aman";
  let statusColor = G_SUCCESS;
  let statusIcon = "shield-checkmark";

  if (opBalance <= 0) {
    statusLabel = "Kas Habis";
    statusColor = G_ERROR;
    statusIcon = "alert-circle";
  } else if (safeDaily < 25000) {
    statusLabel = "Perlu Hemat";
    statusColor = G_WARNING;
    statusIcon = "warning";
  } else {
    statusLabel = "Kas Aman";
    statusColor = "#00D4AA";
    statusIcon = "shield-checkmark";
  }

  const progressBarWidth = useSharedValue(0);

  useEffect(() => {
    progressBarWidth.value = withDelay(
      200,
      withTiming(timeProgressPct, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [timeProgressPct]);

  const progressAnimStyle = useAnimatedStyle(() => ({
    width: `${Math.max(progressBarWidth.value, 5)}%`,
  }));

  return (
    <ChromaCard slideIndex={1}>
      <View style={{ flex: 1, justifyContent: "space-between" }}>
        {/* Row 1: Header */}
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
                width: 26,
                height: 26,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 8,
              }}
            >
              <Ionicons name="compass" size={13} color="#001A14" />
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
                Batas Uang
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 7,
                  marginTop: 1,
                }}
              >
                Jatah Belanja Kas Harian
              </Text>
            </View>
          </View>
          <GlassChip
            icon={statusIcon}
            label={statusLabel}
            color={statusColor}
            compact
          />
        </View>

        {/* Row 2: Hero Amount & Label */}
        <View style={{ marginTop: 2 }}>
          <Text
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 8,
              fontWeight: "600",
              letterSpacing: 0.8,
              textTransform: "uppercase",
              marginBottom: 2,
            }}
          >
            Jatah Kas Aman Belanja
          </Text>
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
                color: "rgba(255,255,255,0.4)",
                fontSize: 10,
                fontWeight: "600",
                marginLeft: 4,
              }}
            >
              /hari
            </Text>
          </View>
          <Text
            style={{
              color: "rgba(255,255,255,0.35)",
              fontSize: 9,
              marginTop: 1,
            }}
            numberOfLines={1}
          >
            {`Dihitung dari kas operasional ${formatCurrency(opBalance)} ÷ sisa ${daysRemaining} hari`}
          </Text>
        </View>

        {/* Row 3: Progress Bar Waktu Pembukuan */}
        <View style={{ marginTop: 2 }}>
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
                color: "rgba(255,255,255,0.45)",
                fontSize: 8,
                fontWeight: "600",
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              Siklus Pembukuan Bulan Ini
            </Text>
            <Text
              style={{
                color: t.accent,
                fontSize: 9,
                fontWeight: "700",
              }}
            >
              Hari ke-{daysPassed} ({timeProgressPct}%)
            </Text>
          </View>
          <View
            style={{
              height: 5,
              backgroundColor: "rgba(255,255,255,0.06)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <Animated.View
              style={[
                {
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: t.accent,
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
              marginTop: 4,
            }}
          >
            <Text
              style={{
                color: "rgba(255,255,255,0.35)",
                fontSize: 8,
              }}
            >
              Kas Bebas: {formatCurrency(opBalance)}
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.35)",
                fontSize: 8,
              }}
            >
              Sisa {daysRemaining} hari
            </Text>
          </View>
        </View>

        {/* Row 4: Footer */}
        <View
          style={{
            paddingTop: 4,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.06)",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="hourglass-outline"
              size={8}
              color={daysRemaining <= 3 ? G_WARNING : "rgba(255,255,255,0.3)"}
              style={{ marginRight: 4 }}
            />
            <Text
              style={{
                color:
                  daysRemaining <= 3 ? G_WARNING : "rgba(255,255,255,0.35)",
                fontSize: 8,
                fontWeight: daysRemaining <= 3 ? "600" : "400",
              }}
            >
              {daysRemaining === 1
                ? "Reset pembukuan besok"
                : `${daysRemaining} hari menuju reset`}
            </Text>
          </View>
          <Text
            style={{
              color: t.accent,
              fontSize: 9,
              fontWeight: "600",
            }}
          >
            Uang Bertahan
          </Text>
        </View>
      </View>
    </ChromaCard>
  );
};

// ═════════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — Kontrol Anggaran Bulanan (Category Budgets)
// ═════════════════════════════════════════════════════════════════════════════════
const Slide3 = (props: BalanceCarouselProps) => {
  const t = SLIDE_THEMES[3];
  const budgets = props.budgets || [];
  const hasBudgets = budgets.length > 0;

  const totalLimit = budgets.reduce(
    (sum, b) => sum + safeNumber(b.limit),
    0
  );
  const totalSpent = budgets.reduce(
    (sum, b) => sum + safeNumber(b.spent),
    0
  );
  const remainingBudget = Math.max(0, totalLimit - totalSpent);
  const isOverbudget = totalLimit > 0 && totalSpent > totalLimit;
  const burnRatePct = totalLimit > 0
    ? Math.round((totalSpent / totalLimit) * 100)
    : 0;

  // Sisa hari menuju reset bulan
  const daysRemaining = safeNumber(props.projectionData?.daysRemaining) > 0
    ? safeNumber(props.projectionData?.daysRemaining)
    : (() => {
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        return Math.max(1, lastDay - now.getDate());
      })();

  // Jatah harian khusus dari sisa anggaran
  const dailyBudgetQuota = hasBudgets
    ? Math.max(0, Math.round(remainingBudget / Math.max(1, daysRemaining)))
    : 0;

  // Status computation
  let statusLabel = "Terkendali";
  let statusColor = G_SUCCESS;
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
      statusColor = G_SUCCESS;
      statusIcon = "shield-checkmark";
    }
  } else {
    statusLabel = "Belum Ada";
    statusColor = G_DIM;
    statusIcon = "options-outline";
  }

  const budgetBarWidth = useSharedValue(0);

  useEffect(() => {
    budgetBarWidth.value = withDelay(
      200,
      withTiming(hasBudgets ? Math.min(100, burnRatePct) : 0, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [hasBudgets, burnRatePct]);

  const budgetAnimStyle = useAnimatedStyle(() => ({
    width: `${Math.max(budgetBarWidth.value, hasBudgets && burnRatePct > 0 ? 3 : 0)}%`,
  }));

  return (
    <ChromaCard slideIndex={2}>
      <View style={{ flex: 1, justifyContent: "space-between" }}>
        {/* Row 1: Header */}
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
                width: 26,
                height: 26,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 8,
              }}
            >
              <Ionicons name="calculator" size={13} color="#1A1100" />
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
                Kontrol Anggaran
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 7,
                  marginTop: 1,
                }}
              >
                {hasBudgets ? "Batas Belanja Pos Kategori" : "Belum Ada Pos Anggaran"}
              </Text>
            </View>
          </View>
          <GlassChip
            icon={statusIcon}
            label={statusLabel}
            color={statusColor}
            compact
          />
        </View>

        {/* Row 2: Hero Content */}
        <View style={{ marginTop: 2 }}>
          {hasBudgets ? (
            <>
              <Text
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 8,
                  fontWeight: "600",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}
              >
                Sisa Plafon Anggaran
              </Text>
              <AnimatedNumber
                value={formatCurrency(remainingBudget)}
                style={{
                  color: isOverbudget ? G_ERROR : G_TEXT,
                  fontSize: 24,
                  lineHeight: 30,
                }}
              />
              <Text
                style={{
                  color: isOverbudget ? G_ERROR : "rgba(255,255,255,0.35)",
                  fontSize: 9,
                  marginTop: 1,
                }}
                numberOfLines={1}
              >
                {isOverbudget
                  ? `Overbudget ${formatCurrency(totalSpent - totalLimit)}!`
                  : `Jatah belanja pos anggaran ~${formatCurrency(dailyBudgetQuota)}/hari`}
              </Text>
            </>
          ) : (
            <>
              <Text
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 8,
                  fontWeight: "600",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}
              >
                Plafon Kategori
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 22,
                  fontWeight: "700",
                  lineHeight: 28,
                }}
              >
                Belum Ada Anggaran
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: 9,
                  marginTop: 1,
                }}
                numberOfLines={1}
              >
                Pasang limit belanja bulanan per pos kategori
              </Text>
            </>
          )}
        </View>

        {/* Row 3: Progress Bar & Info */}
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
                    color: "rgba(255,255,255,0.45)",
                    fontSize: 8,
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
                    fontSize: 9,
                    fontWeight: "700",
                  }}
                >
                  {burnRatePct}% ({formatCurrency(totalSpent)})
                </Text>
              </View>
              <View
                style={{
                  height: 5,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <Animated.View
                  style={[
                    {
                      height: 5,
                      borderRadius: 3,
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
                  marginTop: 4,
                }}
              >
                <Text
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    fontSize: 8,
                  }}
                >
                  Limit Total: {formatCurrency(totalLimit)}
                </Text>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    fontSize: 8,
                  }}
                >
                  {budgets.length} pos aktif
                </Text>
              </View>
            </>
          ) : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(245,166,35,0.08)",
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: "rgba(245,166,35,0.15)",
              }}
            >
              <Ionicons
                name="bulb-outline"
                size={13}
                color={G_GOLD}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 9,
                  fontWeight: "500",
                  flex: 1,
                }}
                numberOfLines={1}
              >
                Atur Anggaran di menu untuk kunci batas belanja tiap kategori.
              </Text>
            </View>
          )}
        </View>

        {/* Row 4: Footer */}
        <View
          style={{
            paddingTop: 4,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.06)",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name={hasBudgets ? "layers-outline" : "add-circle-outline"}
              size={8}
              color="rgba(255,255,255,0.35)"
              style={{ marginRight: 4 }}
            />
            <Text
              style={{
                color: "rgba(255,255,255,0.35)",
                fontSize: 8,
              }}
            >
              {hasBudgets
                ? `${budgets.length} pos anggaran dibuat`
                : "Belum ada anggaran disetel"}
            </Text>
          </View>
          <Text
            style={{
              color: hasBudgets ? t.accent : G_DIM,
              fontSize: 9,
              fontWeight: "600",
            }}
          >
            {hasBudgets ? "Plafon Belanja" : "Menu Anggaran"}
          </Text>
        </View>
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
    return {
      transform: [
        {
          scale: interpolate(
            scrollX.value,
            inputRange,
            [0.9, 1, 0.9],
            Extrapolation.CLAMP,
          ),
        },
        {
          translateY: interpolate(
            scrollX.value,
            inputRange,
            [15, 0, 15],
            Extrapolation.CLAMP,
          ),
        },
      ],
      opacity: interpolate(
        scrollX.value,
        inputRange,
        [0.4, 1, 0.4],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <View style={{ width: CARD_WIDTH, marginHorizontal: 16 }}>
      <Animated.View style={animStyle}>
        {index === 0 && <Slide0 {...carouselProps} />}
        {index === 1 && <Slide1 {...carouselProps} />}
        {index === 2 && <Slide2 {...carouselProps} />}
        {index === 3 && <Slide3 {...carouselProps} />}
      </Animated.View>
    </View>
  );
};

// ─── PaginationDot ──────────────────────────────────────────────────────────────
const PaginationDot = ({
  index,
  scrollX,
}: {
  index: number;
  scrollX: SharedValue<number>;
}) => {
  const accent = SLIDE_THEMES[Math.min(index, SLIDE_THEMES.length - 1)].accent;
  const dotStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];
    return {
      width: interpolate(
        scrollX.value,
        inputRange,
        [6, 28, 6],
        Extrapolation.CLAMP,
      ),
      opacity: interpolate(
        scrollX.value,
        inputRange,
        [0.15, 1, 0.15],
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
          marginHorizontal: 4,
          height: 6,
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
      <Text
        style={{
          color: "rgba(255,255,255,0.3)",
          fontSize: 9,
          textAlign: "center",
          marginTop: 8,
          letterSpacing: 0.5,
        }}
      >
        {props.timeFilter === "all"
          ? "Seluruh riwayat"
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
