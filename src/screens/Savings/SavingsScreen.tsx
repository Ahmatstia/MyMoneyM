// File: src/screens/Savings/SavingsScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useAppContext } from "../../context/AppContext";
import {
  formatCurrency,
  safeNumber,
  getSafePercentage,
} from "../../utils/calculations";
import { Savings } from "../../types";
import { Colors } from "../../theme/theme";

type SafeIconName = keyof typeof Ionicons.glyphMap;

// ─── Theme colors (konsisten dengan seluruh app) ──────────────────────────────
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR    = Colors.surface;
const TEXT_PRIMARY     = Colors.textPrimary;
const TEXT_SECONDARY   = Colors.textSecondary;
const ACCENT_COLOR     = Colors.accent;
const SUCCESS_COLOR    = Colors.success;
const WARNING_COLOR    = Colors.warning;
const ERROR_COLOR      = Colors.error;

// ─── Design tokens (konsisten dengan seluruh app) ─────────────────────────────
const CARD_RADIUS  = 20;
const INNER_RADIUS = 14;
const CARD_PAD     = 20;
const SECTION_GAP  = 24;
const CARD_BORDER  = "rgba(255,255,255,0.06)";

// ─── Komponen UI (konsisten) ──────────────────────────────────────────────────

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

const ThinBar = ({
  progress,
  color,
}: {
  progress: number;
  color: string;
}) => (
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
        width: `${Math.max(0, Math.min(progress, 100))}%`,
        backgroundColor: color,
      }}
    />
  </View>
);

// ─── Main component ───────────────────────────────────────────────────────────

const SavingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state, deleteSavings } = useAppContext();
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [fabScaleAnim] = useState(new Animated.Value(1));

  const fabPressIn  = () =>
    Animated.spring(fabScaleAnim, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start();
  const fabPressOut = () =>
    Animated.spring(fabScaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  const savings = state.savings || [];

  const totalStats = useMemo(() => {
    const totalTarget  = savings.reduce((sum, s) => sum + safeNumber(s.target), 0);
    const totalCurrent = savings.reduce((sum, s) => sum + safeNumber(s.current), 0);
    const overallProgress = getSafePercentage(totalCurrent, totalTarget);
    const activeCount    = savings.filter(
      (s) => safeNumber(s.current) < safeNumber(s.target)
    ).length;
    const completedCount = savings.filter(
      (s) => safeNumber(s.current) >= safeNumber(s.target)
    ).length;
    return { totalTarget, totalCurrent, overallProgress, activeCount, completedCount };
  }, [savings]);

  const filteredSavings = useMemo(() => {
    return savings.filter((s) => {
      const isCompleted = safeNumber(s.current) >= safeNumber(s.target);
      switch (filter) {
        case "active":    return !isCompleted;
        case "completed": return isCompleted;
        default:          return true;
      }
    });
  }, [savings, filter]);

  const getIcon = (s: Savings): SafeIconName => {
    if (s.icon) return s.icon as SafeIconName;
    const map: Record<string, SafeIconName> = {
      emergency: "shield",     vacation: "airplane",
      gadget:    "phone-portrait", education: "school",
      house:     "home",       car: "car",
      health:    "medical",    wedding: "heart",
    };
    return map[s.category || ""] || "wallet";
  };

  const getProgressColor = (p: number) => {
    if (p >= 100) return SUCCESS_COLOR;
    if (p >= 75)  return Colors.info;
    if (p >= 50)  return WARNING_COLOR;
    if (p >= 25)  return ERROR_COLOR;
    return Colors.gray400;
  };

  const formatDeadline = (deadline?: string) => {
    if (!deadline) return "Tanpa deadline";
    try {
      const d    = new Date(deadline);
      const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (diff < 0)   return "Terlambat";
      if (diff === 0) return "Hari ini";
      if (diff === 1) return "Besok";
      if (diff < 7)   return `${diff} hari lagi`;
      if (diff < 30)  return `${Math.floor(diff / 7)} minggu lagi`;
      if (diff < 365) return `${Math.floor(diff / 30)} bulan lagi`;
      return `${Math.floor(diff / 365)} tahun lagi`;
    } catch {
      return deadline;
    }
  };

  const handleDelete = (s: Savings) => {
    Alert.alert(
      "Hapus Tabungan",
      `Hapus tabungan "${s.name}"?\n\nSemua riwayat transaksi juga akan dihapus.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSavings(s.id);
            } catch {
              Alert.alert("Error", "Gagal menghapus tabungan");
            }
          },
        },
      ]
    );
  };

  const filterTabs = [
    { key: "all",       label: "Semua",   count: savings.length },
    { key: "active",    label: "Aktif",   count: totalStats.activeCount },
    { key: "completed", label: "Tercapai", count: totalStats.completedCount },
  ];

  const utilizationColor =
    totalStats.overallProgress >= 100
      ? SUCCESS_COLOR
      : totalStats.overallProgress >= 75
      ? Colors.info
      : totalStats.overallProgress >= 50
      ? WARNING_COLOR
      : ACCENT_COLOR;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page header ─────────────────────────────────────────────── */}
        <View style={{ paddingTop: 16, paddingBottom: 20 }}>
          <Text style={{ color: TEXT_PRIMARY, fontSize: 20, fontWeight: "700" }}>
            Tabungan
          </Text>
          <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 3 }}>
            {savings.length} target tabungan
          </Text>
        </View>

        {/* ── Summary hero card ─────────────────────────────────────────── */}
        {savings.length > 0 && (
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
              Total Tabungan
            </Text>
            <Text
              style={{
                color: TEXT_PRIMARY,
                fontSize: 30,
                fontWeight: "800",
                letterSpacing: -0.5,
                marginBottom: 16,
              }}
            >
              {formatCurrency(totalStats.totalCurrent)}
            </Text>

            {/* Terkumpul / Target */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                  <View
                    style={{
                      width: 6, height: 6, borderRadius: 3,
                      backgroundColor: ACCENT_COLOR, marginRight: 5,
                    }}
                  />
                  <Text style={{ color: Colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8 }}>
                    Terkumpul
                  </Text>
                </View>
                <Text style={{ color: ACCENT_COLOR, fontSize: 14, fontWeight: "700" }}>
                  {formatCurrency(totalStats.totalCurrent)}
                </Text>
              </View>

              <View style={{ width: 1, height: 32, backgroundColor: CARD_BORDER, marginHorizontal: 14 }} />

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                  <View
                    style={{
                      width: 6, height: 6, borderRadius: 3,
                      backgroundColor: SUCCESS_COLOR, marginRight: 5,
                    }}
                  />
                  <Text style={{ color: Colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8 }}>
                    Target
                  </Text>
                </View>
                <Text style={{ color: SUCCESS_COLOR, fontSize: 14, fontWeight: "700" }}>
                  {formatCurrency(totalStats.totalTarget)}
                </Text>
              </View>

              <View style={{ width: 1, height: 32, backgroundColor: CARD_BORDER, marginHorizontal: 14 }} />

              {/* Status chips */}
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: Colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>
                  Status
                </Text>
                <View style={{ flexDirection: "row", gap: 4 }}>
                  {totalStats.completedCount > 0 && (
                    <View
                      style={{
                        paddingHorizontal: 7, paddingVertical: 2,
                        borderRadius: 20, backgroundColor: `${SUCCESS_COLOR}18`,
                        borderWidth: 1, borderColor: `${SUCCESS_COLOR}28`,
                      }}
                    >
                      <Text style={{ color: SUCCESS_COLOR, fontSize: 10, fontWeight: "700" }}>
                        {totalStats.completedCount} ✓
                      </Text>
                    </View>
                  )}
                  {totalStats.activeCount > 0 && (
                    <View
                      style={{
                        paddingHorizontal: 7, paddingVertical: 2,
                        borderRadius: 20, backgroundColor: `${ACCENT_COLOR}18`,
                        borderWidth: 1, borderColor: `${ACCENT_COLOR}28`,
                      }}
                    >
                      <Text style={{ color: ACCENT_COLOR, fontSize: 10, fontWeight: "700" }}>
                        {totalStats.activeCount} ●
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Overall progress bar */}
            <ThinBar progress={totalStats.overallProgress} color={utilizationColor} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
              <Text style={{ color: Colors.gray400, fontSize: 10 }}>
                {totalStats.overallProgress.toFixed(1)}% tercapai
              </Text>
              <Text style={{ fontSize: 10, fontWeight: "600", color: utilizationColor }}>
                {totalStats.overallProgress >= 100
                  ? "Semua tercapai! 🎉"
                  : totalStats.overallProgress >= 75
                  ? "Hampir sampai"
                  : "Terus menabung"}
              </Text>
            </View>
          </View>
        )}

        {/* ── Filter — segmented control ────────────────────────────────── */}
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
          {filterTabs.map((tab) => {
            const isActive = filter === tab.key;
            const tabColor =
              tab.key === "completed" ? SUCCESS_COLOR :
              tab.key === "active"    ? ACCENT_COLOR : Colors.gray400;
            return (
              <TouchableOpacity
                key={tab.key}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isActive ? `${tabColor}20` : "transparent",
                  gap: 6,
                }}
                onPress={() => setFilter(tab.key as any)}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: isActive ? "700" : "500",
                    color: isActive ? tabColor : Colors.gray400,
                  }}
                >
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View
                    style={{
                      backgroundColor: isActive ? tabColor : "rgba(255,255,255,0.08)",
                      paddingHorizontal: 5,
                      paddingVertical: 2,
                      borderRadius: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 9,
                        color: isActive ? BACKGROUND_COLOR : Colors.gray400,
                        fontWeight: "700",
                      }}
                    >
                      {tab.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Savings list / empty state ────────────────────────────────── */}
        <SectionHeader
          title={filter === "completed" ? "Tabungan Tercapai" : filter === "active" ? "Tabungan Aktif" : "Semua Tabungan"}
        />

        {filteredSavings.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              paddingVertical: 48,
              backgroundColor: SURFACE_COLOR,
              borderRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: CARD_BORDER,
              paddingHorizontal: 24,
            }}
          >
            <View
              style={{
                width: 64, height: 64, borderRadius: 20,
                alignItems: "center", justifyContent: "center",
                backgroundColor: `${Colors.gray400}14`,
                marginBottom: 14,
              }}
            >
              <Ionicons name="wallet-outline" size={26} color={Colors.gray400} />
            </View>
            <Text
              style={{
                color: TEXT_PRIMARY, fontSize: 15, fontWeight: "700",
                marginBottom: 6, textAlign: "center",
              }}
            >
              {filter === "all" ? "Belum ada tabungan" : "Tidak ada tabungan"}
            </Text>
            <Text
              style={{
                color: Colors.gray400, fontSize: 12,
                textAlign: "center", lineHeight: 18, marginBottom: 20,
              }}
            >
              {filter === "all"
                ? "Mulai dengan membuat target tabungan pertama Anda"
                : `Tidak ada tabungan dengan status "${filterTabs.find(t => t.key === filter)?.label}"`}
            </Text>
            {filter === "all" && (
              <TouchableOpacity
                style={{
                  flexDirection: "row", alignItems: "center",
                  paddingHorizontal: 20, paddingVertical: 10,
                  borderRadius: 13, backgroundColor: ACCENT_COLOR,
                  shadowColor: ACCENT_COLOR,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
                }}
                onPress={() => navigation.navigate("AddSavings")}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color={BACKGROUND_COLOR} style={{ marginRight: 6 }} />
                <Text style={{ color: BACKGROUND_COLOR, fontSize: 13, fontWeight: "700" }}>
                  Buat Target Pertama
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View>
            {filteredSavings.map((saving) => {
              const current       = safeNumber(saving.current);
              const target        = safeNumber(saving.target);
              const progress      = getSafePercentage(current, target);
              const remaining     = target - current;
              const progressColor = getProgressColor(progress);
              const iconName      = getIcon(saving);
              const isCompleted   = current >= target;

              return (
                <TouchableOpacity
                  key={saving.id}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate("SavingsDetail", { savingsId: saving.id })
                  }
                  style={{
                    backgroundColor: SURFACE_COLOR,
                    borderRadius: CARD_RADIUS,
                    borderWidth: 1,
                    borderColor: CARD_BORDER,
                    padding: CARD_PAD,
                    marginBottom: 12,
                    borderLeftWidth: 3,
                    borderLeftColor: progressColor,
                  }}
                >
                  {/* Row 1: Icon + Name + Actions */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 8 }}>
                      {/* Icon */}
                      <View
                        style={{
                          width: 38, height: 38, borderRadius: 12,
                          alignItems: "center", justifyContent: "center",
                          backgroundColor: `${progressColor}15`,
                        }}
                      >
                        <Ionicons name={iconName} size={17} color={progressColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: TEXT_PRIMARY, fontSize: 14,
                            fontWeight: "700", marginBottom: 2,
                          }}
                        >
                          {saving.name}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          {saving.category && (
                            <View
                              style={{
                                paddingHorizontal: 7, paddingVertical: 2,
                                borderRadius: 20, backgroundColor: `${ACCENT_COLOR}15`,
                                borderWidth: 1, borderColor: `${ACCENT_COLOR}25`,
                              }}
                            >
                              <Text style={{ color: ACCENT_COLOR, fontSize: 9, fontWeight: "600" }}>
                                {saving.category.charAt(0).toUpperCase() + saving.category.slice(1)}
                              </Text>
                            </View>
                          )}
                          <Text style={{ color: Colors.gray400, fontSize: 10 }}>
                            {formatDeadline(saving.deadline)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Row 2: Progress bar */}
                  <View style={{ marginBottom: 12 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 7,
                      }}
                    >
                      <Text style={{ color: TEXT_SECONDARY, fontSize: 12 }}>
                        {formatCurrency(current)}
                        <Text style={{ color: Colors.gray400 }}>
                          {" "}/ {formatCurrency(target)}
                        </Text>
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View
                          style={{
                            paddingHorizontal: 8, paddingVertical: 2,
                            borderRadius: 20, backgroundColor: `${progressColor}15`,
                            borderWidth: 1, borderColor: `${progressColor}25`,
                          }}
                        >
                          <Text style={{ color: progressColor, fontSize: 9, fontWeight: "700" }}>
                            {isCompleted ? "Tercapai" : progress >= 50 ? "Berjalan" : "Dimulai"}
                          </Text>
                        </View>
                        <Text style={{ color: progressColor, fontSize: 13, fontWeight: "800" }}>
                          {progress.toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                    <ThinBar progress={progress} color={progressColor} />
                  </View>

                  {/* Row 3: Stats row */}
                  <View style={{ height: 1, backgroundColor: CARD_BORDER, marginBottom: 12 }} />
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {/* Terkumpul */}
                    <View style={{ flex: 1, alignItems: "center" }}>
                      <Text
                        style={{
                          color: Colors.gray400, fontSize: 9,
                          textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4,
                        }}
                      >
                        Terkumpul
                      </Text>
                      <Text style={{ color: ACCENT_COLOR, fontSize: 13, fontWeight: "700" }}>
                        {formatCurrency(current)}
                      </Text>
                    </View>

                    <View style={{ width: 1, height: 28, backgroundColor: CARD_BORDER }} />

                    {/* Sisa */}
                    <View style={{ flex: 1, alignItems: "center" }}>
                      <Text
                        style={{
                          color: Colors.gray400, fontSize: 9,
                          textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4,
                        }}
                      >
                        Sisa
                      </Text>
                      <Text
                        style={{
                          fontSize: 13, fontWeight: "700",
                          color: remaining <= 0 ? SUCCESS_COLOR : ERROR_COLOR,
                        }}
                      >
                        {remaining <= 0 ? "Lunas 🎉" : formatCurrency(remaining)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── FAB ──────────────────────────────────────────────────────────── */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 24,
          right: 18,
          width: 52,
          height: 52,
          borderRadius: 16,
          backgroundColor: ACCENT_COLOR,
          shadowColor: ACCENT_COLOR,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 10,
          transform: [{ scale: fabScaleAnim }],
        }}
      >
        <TouchableOpacity
          style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}
          onPress={() => navigation.navigate("AddSavings")}
          onPressIn={fabPressIn}
          onPressOut={fabPressOut}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={26} color={BACKGROUND_COLOR} />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

export default SavingsScreen;
