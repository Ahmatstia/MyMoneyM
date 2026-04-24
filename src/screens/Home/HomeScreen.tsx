// File: src/screens/HomeScreen.tsx
import React, { useMemo, useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { useHomeData } from "./hooks/useHomeData";
import {
  formatCurrency,
  safeNumber,
  safePositiveNumber,
  TimeFilter,
  filterTransactionsByTime,
  calculateTotals,
  getActiveCycleInfo,
  calculateProjection,
  calculateOpeningBalance,
} from "../../utils/calculations";
import { calculateTransactionAnalytics } from "../../utils/analytics";
import { calculateFinancialHealthScore } from "../../utils/analytics";

import { Colors } from "../../theme/theme";

type SafeIconName = keyof typeof Ionicons.glyphMap;

// ─── Theme colors (tidak diubah) ──────────────────────────────────────────────
const PRIMARY_COLOR    = Colors.primary;
const ACCENT_COLOR     = Colors.accent;
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR    = Colors.surface;
const TEXT_PRIMARY     = Colors.textPrimary;
const TEXT_SECONDARY   = Colors.textSecondary;
const BORDER_COLOR     = Colors.border;
const SUCCESS_COLOR    = Colors.success;
const WARNING_COLOR    = Colors.warning;
const ERROR_COLOR      = Colors.error;

// ─── Design tokens ────────────────────────────────────────────────────────────
const CARD_RADIUS  = 20;
const INNER_RADIUS = 14;
const CARD_PAD     = 20;
const SECTION_GAP  = 24;
const CARD_BORDER  = "rgba(255,255,255,0.06)";

// ─── Komponen UI ──────────────────────────────────────────────────────────────

/** Spacer vertikal antar section */
const Spacer = ({ size = SECTION_GAP }: { size?: number }) => (
  <View style={{ height: size }} />
);

/** Section header dengan accent bar kiri */
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

/** Kartu dengan background surface dan border tipis */
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

/** Divider vertikal */
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

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state, isLoading, refreshData } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("monthly");

  const { activeCycle, filteredTransactions, filteredIncome, filteredExpense, filteredPeriodNetto, openingBalance, filteredBalance, hasFinancialData, transactionAnalytics, financialHealthScore, smartInsights, dynamicQuickActions, projectionData, goalsPreview, quickStats, getCurrentDate, getTransactionIcon, getPersonalizedGreeting } = useHomeData(state, timeFilter, navigation);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return Colors.success;
    if (score >= 60) return Colors.info;
    if (score >= 40) return Colors.warning;
    if (score >= 20) return Colors.error;
    return Colors.errorDark;
  };

  const getScoreDescription = (score: number) => {
    if (score >= 80) return "Sangat Sehat";
    if (score >= 60) return "Sehat";
    if (score >= 40) return "Cukup";
    if (score >= 20) return "Perlu Perbaikan";
    return "Kritis";
  };

  // ── Progress bar color helper ───────────────────────────────────────────
  const getProgressColor = (status: string | undefined) => {
    if (status === "surplus") return SUCCESS_COLOR;
    if (status === "warning") return WARNING_COLOR;
    return ERROR_COLOR;
  };

  // ── Skeleton loading ───────────────────────────────────────────────────────
  if (isLoading && !refreshing) {
    const SkeletonBox = ({
      w,
      h,
      radius = 8,
      style,
    }: {
      w?: number | string;
      h: number;
      radius?: number;
      style?: object;
    }) => (
      <View
        style={[
          {
            width: w,
            height: h,
            borderRadius: radius,
            backgroundColor: SURFACE_COLOR,
          },
          style,
        ]}
      />
    );

    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 18 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header skeleton */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 16,
              paddingBottom: 14,
            }}
          >
            <View>
              <SkeletonBox w={120} h={10} style={{ marginBottom: 8 }} />
              <SkeletonBox w={200} h={18} radius={10} />
            </View>
            <SkeletonBox w={100} h={36} radius={20} />
          </View>

          <Spacer size={12} />

          {/* Time filter skeleton */}
          <SkeletonBox w="100%" h={40} radius={13} style={{ marginBottom: 20 }} />

          {/* Balance card skeleton */}
          <View
            style={{
              backgroundColor: SURFACE_COLOR,
              borderRadius: CARD_RADIUS,
              padding: CARD_PAD,
              marginBottom: 20,
            }}
          >
            <SkeletonBox w={60} h={10} style={{ marginBottom: 10 }} />
            <SkeletonBox w={180} h={34} radius={10} style={{ marginBottom: 20 }} />
            <View style={{ flexDirection: "row" }}>
              <SkeletonBox w="30%" h={36} radius={8} />
              <SkeletonBox w="30%" h={36} radius={8} style={{ marginLeft: "5%" }} />
              <SkeletonBox w="30%" h={36} radius={8} style={{ marginLeft: "5%" }} />
            </View>
            <SkeletonBox w="100%" h={4} radius={4} style={{ marginTop: 16 }} />
          </View>

          {/* Quick actions skeleton */}
          <SkeletonBox w={80} h={10} style={{ marginBottom: 14 }} />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={{ alignItems: "center", flex: 1 }}>
                <SkeletonBox w={44} h={44} radius={14} style={{ marginBottom: 6 }} />
                <SkeletonBox w={34} h={8} radius={4} />
              </View>
            ))}
          </View>

          {/* Stats skeleton */}
          <SkeletonBox w={80} h={10} style={{ marginBottom: 14 }} />
          <View
            style={{
              backgroundColor: SURFACE_COLOR,
              borderRadius: INNER_RADIUS,
              padding: 16,
              flexDirection: "row",
              marginBottom: 20,
            }}
          >
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={{ flex: 1, alignItems: "center" }}
              >
                <SkeletonBox w={50} h={8} style={{ marginBottom: 6 }} />
                <SkeletonBox w={40} h={16} radius={6} />
              </View>
            ))}
          </View>

          {/* Transactions skeleton */}
          <SkeletonBox w={120} h={10} style={{ marginBottom: 14 }} />
          <View
            style={{
              backgroundColor: SURFACE_COLOR,
              borderRadius: CARD_RADIUS,
              padding: 4,
            }}
          >
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  borderBottomWidth: i < 3 ? 1 : 0,
                  borderBottomColor: CARD_BORDER,
                }}
              >
                <SkeletonBox w={38} h={38} radius={12} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <SkeletonBox w={100} h={11} style={{ marginBottom: 6 }} />
                  <SkeletonBox w={140} h={9} radius={5} />
                </View>
                <SkeletonBox w={70} h={11} radius={5} />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[ACCENT_COLOR]}
            tintColor={ACCENT_COLOR}
            title="Memperbarui data..."
            titleColor={TEXT_SECONDARY}
          />
        }
      >
        {/* ══════════════════════════════════════════
            HEADER
        ══════════════════════════════════════════ */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            paddingTop: 14,
            paddingBottom: 10,
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text
              style={{
                color: Colors.gray400,
                fontSize: 11,
                marginBottom: 4,
              }}
            >
              {getCurrentDate()}
            </Text>
            <Text
              style={{
                color: TEXT_PRIMARY,
                fontSize: 18,
                fontWeight: "700",
                lineHeight: 24,
              }}
            >
              {getPersonalizedGreeting()}
            </Text>
          </View>

          {/* Health score chip */}
          {hasFinancialData ? (
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: `${getScoreColor(
                  financialHealthScore.overallScore
                )}14`,
                borderWidth: 1,
                borderColor: `${getScoreColor(
                  financialHealthScore.overallScore
                )}30`,
              }}
              onPress={() =>
                navigation.navigate("Analytics", { tab: "health" })
              }
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: getScoreColor(financialHealthScore.overallScore),
                  fontSize: 16,
                  fontWeight: "800",
                  marginRight: 7,
                }}
              >
                {financialHealthScore.overallScore}
              </Text>
              <View>
                <Text
                  style={{
                    color: getScoreColor(financialHealthScore.overallScore),
                    fontSize: 10,
                    fontWeight: "700",
                  }}
                >
                  {getScoreDescription(financialHealthScore.overallScore)}
                </Text>
                <Text
                  style={{ color: Colors.gray400, fontSize: 9, marginTop: 1 }}
                >
                  Skor keuangan
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: `${ACCENT_COLOR}14`,
                borderWidth: 1,
                borderColor: `${ACCENT_COLOR}30`,
              }}
              onPress={() => navigation.navigate("AddTransaction")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="rocket-outline"
                size={13}
                color={ACCENT_COLOR}
                style={{ marginRight: 5 }}
              />
              <View>
                <Text
                  style={{
                    color: ACCENT_COLOR,
                    fontSize: 10,
                    fontWeight: "700",
                  }}
                >
                  Mulai!
                </Text>
                <Text
                  style={{
                    color: Colors.gray400,
                    fontSize: 9,
                    marginTop: 1,
                  }}
                >
                  Catat keuangan
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <Spacer size={14} />

        {/* ══════════════════════════════════════════
            TIME FILTER — segmented control
        ══════════════════════════════════════════ */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: SURFACE_COLOR,
            borderRadius: 13,
            padding: 3,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: CARD_BORDER,
          }}
        >
          {(["weekly", "monthly", "yearly", "all"] as TimeFilter[]).map(
            (filter) => {
              const labels: Record<string, string> = {
                weekly: activeCycle ? activeCycle.label : "Minggu Ini",
                monthly: "Bulan Ini",
                yearly: "Tahun Ini",
                all: "Semua",
              };
              const isActive = timeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: isActive
                      ? `${ACCENT_COLOR}20`
                      : "transparent",
                    alignItems: "center",
                  }}
                  onPress={() => setTimeFilter(filter)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: isActive ? ACCENT_COLOR : Colors.gray400,
                      fontSize: 10,
                      fontWeight: isActive ? "700" : "500",
                    }}
                  >
                    {labels[filter]}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>

        {/* ══════════════════════════════════════════
            BALANCE HERO CARD
        ══════════════════════════════════════════ */}
        <Card style={{ marginBottom: 20 }}>
          <Text
            style={{
              color: Colors.gray400,
              fontSize: 10,
              fontWeight: "700",
              letterSpacing: 1.2,
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            {hasFinancialData ? "Total Saldo" : "Selamat Datang"}
          </Text>

          <Text
            style={{
              color: TEXT_PRIMARY,
              fontSize: 34,
              fontWeight: "800",
              letterSpacing: -0.5,
              marginBottom: 18,
            }}
          >
            {hasFinancialData
              ? formatCurrency(safeNumber(state.balance))
              : "Rp 0"}
          </Text>

          {/* Income / Expense / Net row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            {/* Pemasukan */}
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: SUCCESS_COLOR,
                    marginRight: 5,
                  }}
                />
                <Text
                  style={{
                    color: Colors.gray400,
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  Pemasukan
                </Text>
              </View>
              <Text
                style={{
                  color: SUCCESS_COLOR,
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                {formatCurrency(safeNumber(filteredIncome))}
              </Text>
            </View>

            <VDivider />

            {/* Pengeluaran */}
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: ERROR_COLOR,
                    marginRight: 5,
                  }}
                />
                <Text
                  style={{
                    color: Colors.gray400,
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  Pengeluaran
                </Text>
              </View>
              <Text
                style={{
                  color: ERROR_COLOR,
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                {formatCurrency(safeNumber(filteredExpense))}
              </Text>
            </View>

            <VDivider />

            {/* Saldo Akhir */}
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text
                style={{
                  color: Colors.gray400,
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 4,
                }}
              >
                {timeFilter === "all" ? "Sisa" : "Arus Kas"}
              </Text>
              <Text
                style={{
                  color:
                    filteredPeriodNetto > 0 ? SUCCESS_COLOR : filteredPeriodNetto < 0 ? ERROR_COLOR : TEXT_SECONDARY,
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                {filteredPeriodNetto > 0 ? "+" : ""}{formatCurrency(safeNumber(filteredPeriodNetto))}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View
            style={{
              height: 4,
              backgroundColor: "rgba(255,255,255,0.07)",
              borderRadius: 4,
              overflow: "hidden",
              marginBottom: 10,
            }}
          >
            <View
              style={{
                height: 4,
                borderRadius: 4,
                width: `${Math.max(
                  0,
                  Math.min(safeNumber(projectionData?.progress), 100)
                )}%`,
                backgroundColor:
                  hasFinancialData && projectionData
                    ? getProgressColor(projectionData.status)
                    : Colors.gray400,
              }}
            />
          </View>

          {/* Projected balance */}
          {hasFinancialData &&
            projectionData &&
            projectionData.daysRemaining > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: Colors.gray400, fontSize: 10 }}>
                  Proyeksi {projectionData.label} (
                  {projectionData.daysRemaining} hari lagi)
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color:
                      projectionData.projectedBalance >= 0
                        ? SUCCESS_COLOR
                        : ERROR_COLOR,
                  }}
                >
                  {projectionData.projectedBalance >= 0 ? "+" : ""}
                  {formatCurrency(safeNumber(projectionData.projectedBalance))}
                </Text>
              </View>
            )}

          {/* Opening Balance Hint */}
          {timeFilter !== "all" && openingBalance !== 0 && (
            <Text
              style={{
                color: Colors.gray500,
                fontSize: 10,
                fontStyle: "italic",
                marginTop: 8,
              }}
            >
              * Sudah termasuk saldo bawaan{" "}
              {formatCurrency(openingBalance)} dari periode sebelumnya
            </Text>
          )}
        </Card>

        {/* ══════════════════════════════════════════
            QUICK ACTIONS
        ══════════════════════════════════════════ */}
        <SectionHeader title="Aksi Cepat" />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          {dynamicQuickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={{ flex: 1, alignItems: "center" }}
              onPress={action.onPress}
              activeOpacity={0.7}
              accessible
              accessibilityLabel={`${action.title} button`}
              accessibilityHint={`Navigates to ${action.title} screen`}
              accessibilityRole="button"
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Animated.View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: INNER_RADIUS,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 6,
                  backgroundColor: `${action.color}18`,
                  borderWidth: 1,
                  borderColor: `${action.color}25`,
                  transform: [{ scale: scaleAnim }],
                }}
              >
                <Ionicons name={action.icon} size={19} color={action.color} />
              </Animated.View>
              <Text
                style={{
                  color: Colors.gray400,
                  fontSize: 9,
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ══════════════════════════════════════════
            QUICK STATS
        ══════════════════════════════════════════ */}
        <SectionHeader title="Statistik" />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: SURFACE_COLOR,
            borderRadius: INNER_RADIUS,
            paddingVertical: 16,
            paddingHorizontal: 8,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: CARD_BORDER,
          }}
        >
          {quickStats.map((stat, index) => (
            <React.Fragment key={stat.id}>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    color: Colors.gray400,
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    fontWeight: "600",
                    marginBottom: 5,
                    textAlign: "center",
                  }}
                  numberOfLines={1}
                >
                  {stat.label}
                </Text>
                <Text
                  style={{
                    color: stat.color,
                    fontSize: 15,
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                >
                  {stat.value}
                </Text>
                {stat.unit && (
                  <Text
                    style={{
                      color: Colors.gray400,
                      fontSize: 9,
                      marginTop: 2,
                      textAlign: "center",
                    }}
                  >
                    {stat.unit}
                  </Text>
                )}
              </View>
              {index < quickStats.length - 1 && (
                <View
                  style={{
                    width: 1,
                    height: 36,
                    backgroundColor: CARD_BORDER,
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* ══════════════════════════════════════════
            SMART INSIGHTS
        ══════════════════════════════════════════ */}
        {smartInsights.length > 0 && (
          <>
            <SectionHeader
              title="Insight Cerdas"
              linkLabel="Analitik"
              onPress={() => navigation.navigate("Analytics")}
            />
            <View style={{ marginBottom: 20 }}>
              {smartInsights.map((insight, i) => (
                <TouchableOpacity
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    backgroundColor: `${insight.color}09`,
                    borderRadius: INNER_RADIUS,
                    borderWidth: 1,
                    borderColor: `${insight.color}18`,
                    marginBottom: i < smartInsights.length - 1 ? 8 : 0,
                  }}
                  onPress={insight.onPress}
                  activeOpacity={0.7}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: `${insight.color}18`,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                      flexShrink: 0,
                    }}
                  >
                    <Ionicons
                      name={insight.icon}
                      size={16}
                      color={insight.color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: TEXT_PRIMARY,
                        fontSize: 12,
                        fontWeight: "600",
                        marginBottom: 2,
                      }}
                    >
                      {insight.title}
                    </Text>
                    <Text
                      style={{
                        color: Colors.gray400,
                        fontSize: 11,
                        lineHeight: 15,
                      }}
                    >
                      {insight.message}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: insight.color,
                      fontSize: 10,
                      fontWeight: "700",
                      marginLeft: 10,
                      flexShrink: 0,
                    }}
                  >
                    {insight.action}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ══════════════════════════════════════════
            RECENT TRANSACTIONS
        ══════════════════════════════════════════ */}
        <SectionHeader
          title={
            filteredTransactions.length > 0
              ? "Transaksi Terbaru"
              : state.transactions.length > 0
              ? "Belum Ada Transaksi"
              : "Mulai Catat Keuangan"
          }
          linkLabel={
            state.transactions.length > 0 ? "Lihat Semua" : "Mulai Sekarang"
          }
          onPress={() =>
            state.transactions.length > 0
              ? navigation.navigate("Transactions")
              : navigation.navigate("AddTransaction")
          }
        />

        {filteredTransactions.length > 0 ? (
          <View
            style={{
              backgroundColor: SURFACE_COLOR,
              borderRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: CARD_BORDER,
              paddingHorizontal: 4,
              marginBottom: 20,
            }}
          >
            {filteredTransactions
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )
              .slice(0, 5)
              .map((transaction, index, arr) => (
                <TouchableOpacity
                  key={transaction.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderBottomWidth: index < arr.length - 1 ? 1 : 0,
                    borderBottomColor: CARD_BORDER,
                  }}
                  onPress={() =>
                    navigation.navigate("AddTransaction", {
                      editMode: true,
                      transactionData: transaction,
                    })
                  }
                  activeOpacity={0.6}
                  accessible
                  accessibilityLabel={`Transaksi ${
                    transaction.type === "income"
                      ? "pemasukan"
                      : "pengeluaran"
                  } di kategori ${
                    transaction.category
                  } senilai ${formatCurrency(transaction.amount)}`}
                  accessibilityHint="Tekan untuk mengedit transaksi ini"
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 13,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 13,
                      backgroundColor:
                        transaction.type === "income"
                          ? `${SUCCESS_COLOR}15`
                          : `${ERROR_COLOR}15`,
                    }}
                  >
                    <Ionicons
                      name={getTransactionIcon(transaction.category)}
                      size={17}
                      color={
                        transaction.type === "income"
                          ? SUCCESS_COLOR
                          : ERROR_COLOR
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: TEXT_PRIMARY,
                        fontSize: 13,
                        fontWeight: "500",
                        marginBottom: 2,
                      }}
                    >
                      {transaction.category}
                    </Text>
                    <Text
                      style={{ color: Colors.gray400, fontSize: 11 }}
                      numberOfLines={1}
                    >
                      {transaction.description || "Tidak ada deskripsi"} ·{" "}
                      {new Date(transaction.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color:
                        transaction.type === "income"
                          ? SUCCESS_COLOR
                          : ERROR_COLOR,
                      marginLeft: 8,
                    }}
                  >
                    {transaction.type === "income" ? "+" : "−"}
                    {formatCurrency(safeNumber(transaction.amount))}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        ) : state.transactions.length > 0 ? (
          /* Empty state — periode ini kosong */
          <View
            style={{
              paddingVertical: 28,
              alignItems: "center",
              marginBottom: 20,
              backgroundColor: SURFACE_COLOR,
              borderRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: CARD_BORDER,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${Colors.gray400}14`,
                marginBottom: 10,
              }}
            >
              <Ionicons
                name="documents-outline"
                size={22}
                color={Colors.gray400}
              />
            </View>
            <Text
              style={{
                color: Colors.gray400,
                fontSize: 12,
                fontWeight: "500",
              }}
            >
              Tidak ada transaksi di periode ini
            </Text>
          </View>
        ) : (
          /* Empty state total */
          <TouchableOpacity
            onPress={() => navigation.navigate("AddTransaction")}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 18,
              paddingHorizontal: 18,
              borderRadius: CARD_RADIUS,
              backgroundColor: `${ACCENT_COLOR}0C`,
              borderWidth: 1,
              borderColor: `${ACCENT_COLOR}20`,
              marginBottom: 20,
            }}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Animated.View
              style={{
                width: 42,
                height: 42,
                borderRadius: 13,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
                backgroundColor: `${ACCENT_COLOR}22`,
                transform: [{ scale: scaleAnim }],
              }}
            >
              <Ionicons name="add" size={20} color={ACCENT_COLOR} />
            </Animated.View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: TEXT_PRIMARY,
                  fontSize: 13,
                  fontWeight: "600",
                  marginBottom: 3,
                }}
              >
                Tambah transaksi pertama
              </Text>
              <Text style={{ color: Colors.gray400, fontSize: 11 }}>
                💡 Catat pemasukan atau pengeluaran · Buat anggaran · Tetapkan tabungan
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={Colors.gray400}
            />
          </TouchableOpacity>
        )}

        {/* ══════════════════════════════════════════
            BUDGET + GOALS
        ══════════════════════════════════════════ */}
        {hasFinancialData &&
          (state.budgets.length > 0 || goalsPreview.length > 0) && (
            <>
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
                    Progress & Target
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  {state.budgets.length > 0 && (
                    <TouchableOpacity
                      onPress={() => navigation.navigate("Budget")}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          color: ACCENT_COLOR,
                          fontSize: 11,
                          fontWeight: "600",
                        }}
                      >
                        Anggaran
                      </Text>
                    </TouchableOpacity>
                  )}
                  {goalsPreview.length > 0 && (
                    <TouchableOpacity
                      onPress={() => navigation.navigate("Savings")}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          color: SUCCESS_COLOR,
                          fontSize: 11,
                          fontWeight: "600",
                        }}
                      >
                        Tabungan
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: SURFACE_COLOR,
                  borderRadius: CARD_RADIUS,
                  borderWidth: 1,
                  borderColor: CARD_BORDER,
                  padding: CARD_PAD,
                  marginBottom: 20,
                }}
              >
                {/* LEFT — Budget */}
                {state.budgets.length > 0 && (
                  <View
                    style={[
                      { flex: 1 },
                      goalsPreview.length > 0 && {
                        paddingRight: 16,
                        borderRightWidth: 1,
                        borderRightColor: CARD_BORDER,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: Colors.gray400,
                        fontSize: 9,
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                        fontWeight: "600",
                        marginBottom: 12,
                      }}
                    >
                      Anggaran ({state.budgets.slice(0, 3).length})
                    </Text>
                    {state.budgets.slice(0, 3).map((budget) => {
                      const safeSpent = safeNumber(budget.spent);
                      const safeLimit = safeNumber(budget.limit);
                      const progress =
                        safeLimit > 0 ? (safeSpent / safeLimit) * 100 : 0;
                      const barColor =
                        progress > 90
                          ? ERROR_COLOR
                          : progress > 70
                          ? WARNING_COLOR
                          : SUCCESS_COLOR;
                      return (
                        <View key={budget.id} style={{ marginBottom: 14 }}>
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
                                color: TEXT_SECONDARY,
                                fontSize: 11,
                                fontWeight: "500",
                              }}
                            >
                              {budget.category}
                            </Text>
                            <Text
                              style={{
                                color:
                                  progress > 90
                                    ? ERROR_COLOR
                                    : Colors.gray400,
                                fontSize: 10,
                                fontWeight: "600",
                              }}
                            >
                              {Math.round(safeNumber(progress))}%
                            </Text>
                          </View>
                          <View
                            style={{
                              height: 4,
                              backgroundColor: "rgba(255,255,255,0.07)",
                              borderRadius: 4,
                              overflow: "hidden",
                            }}
                          >
                            <View
                              style={{
                                height: 4,
                                borderRadius: 4,
                                width: `${Math.max(
                                  0,
                                  Math.min(safeNumber(progress), 100)
                                )}%`,
                                backgroundColor: barColor,
                              }}
                            />
                          </View>
                          <Text
                            style={{
                              color: Colors.gray400,
                              fontSize: 9,
                              marginTop: 4,
                            }}
                          >
                            {formatCurrency(safeSpent)} /{" "}
                            {formatCurrency(safeLimit)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* RIGHT — Goals */}
                {goalsPreview.length > 0 && (
                  <View
                    style={[
                      { flex: 1 },
                      state.budgets.length > 0 && { paddingLeft: 16 },
                    ]}
                  >
                    <Text
                      style={{
                        color: Colors.gray400,
                        fontSize: 9,
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                        fontWeight: "600",
                        marginBottom: 12,
                      }}
                    >
                      Tabungan ({goalsPreview.length})
                    </Text>
                    {goalsPreview.slice(0, 3).map((goal) => {
                      const safeCurrent = safeNumber(goal.current);
                      const safeTarget = safeNumber(goal.target);
                      const progress =
                        safeTarget > 0
                          ? (safeCurrent / safeTarget) * 100
                          : 0;
                      const barColor =
                        progress >= 80
                          ? SUCCESS_COLOR
                          : progress >= 50
                          ? WARNING_COLOR
                          : ACCENT_COLOR;
                      return (
                        <TouchableOpacity
                          key={goal.id}
                          style={{ marginBottom: 14 }}
                          onPress={() => navigation.navigate("Savings")}
                          activeOpacity={0.7}
                        >
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
                                color: TEXT_SECONDARY,
                                fontSize: 11,
                                fontWeight: "500",
                              }}
                              numberOfLines={1}
                            >
                              {goal.name}
                            </Text>
                            <Text
                              style={{
                                color: barColor,
                                fontSize: 10,
                                fontWeight: "600",
                              }}
                            >
                              {Math.round(safeNumber(progress))}%
                            </Text>
                          </View>
                          <View
                            style={{
                              height: 4,
                              backgroundColor: "rgba(255,255,255,0.07)",
                              borderRadius: 4,
                              overflow: "hidden",
                            }}
                          >
                            <View
                              style={{
                                height: 4,
                                borderRadius: 4,
                                width: `${Math.max(
                                  0,
                                  Math.min(safeNumber(progress), 100)
                                )}%`,
                                backgroundColor: barColor,
                              }}
                            />
                          </View>
                          <Text
                            style={{
                              color: Colors.gray400,
                              fontSize: 9,
                              marginTop: 4,
                            }}
                          >
                            {formatCurrency(safeCurrent)} /{" "}
                            {formatCurrency(safeTarget)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </>
          )}

        {/* ══════════════════════════════════════════
            HEALTH SCORE RECOMMENDATIONS
        ══════════════════════════════════════════ */}
        {hasFinancialData &&
          financialHealthScore.recommendations &&
          financialHealthScore.recommendations.length > 0 &&
          financialHealthScore.overallScore < 70 && (
            <>
              <SectionHeader
                title="Rekomendasi"
                linkLabel="Lihat Analitik"
                onPress={() =>
                  navigation.navigate("Analytics", { tab: "health" })
                }
              />
              <View
                style={{
                  backgroundColor: SURFACE_COLOR,
                  borderRadius: CARD_RADIUS,
                  borderWidth: 1,
                  borderColor: CARD_BORDER,
                  padding: CARD_PAD,
                  marginBottom: 20,
                }}
              >
                {financialHealthScore.recommendations
                  .slice(0, 2)
                  .map((rec, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        marginBottom: i < 1 ? 14 : 0,
                      }}
                    >
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                          marginTop: 1,
                          backgroundColor: `${ACCENT_COLOR}20`,
                          flexShrink: 0,
                        }}
                      >
                        <Text
                          style={{
                            color: ACCENT_COLOR,
                            fontSize: 10,
                            fontWeight: "700",
                          }}
                        >
                          {i + 1}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: TEXT_SECONDARY,
                          fontSize: 12,
                          flex: 1,
                          lineHeight: 18,
                        }}
                      >
                        {rec}
                      </Text>
                    </View>
                  ))}
              </View>
            </>
          )}
      </ScrollView>

      {/* ══════════════════════════════════════════
          FLOATING ADD BUTTON
      ══════════════════════════════════════════ */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 24,
          right: 20,
          width: 54,
          height: 54,
          borderRadius: 17,
          backgroundColor: ACCENT_COLOR,
          shadowColor: ACCENT_COLOR,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.45,
          shadowRadius: 14,
          elevation: 12,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <TouchableOpacity
          style={{
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => navigation.navigate("AddTransaction")}
          activeOpacity={0.8}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessible
          accessibilityLabel="Tambah transaksi baru"
          accessibilityHint="Tekan untuk menambahkan transaksi pemasukan atau pengeluaran"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={28} color={BACKGROUND_COLOR} />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

export default HomeScreen;