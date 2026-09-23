// File: src/screens/Savings/SavingsScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useAppContext } from "../../context/AppContext";
import {
  formatCurrency,
  safeNumber,
  getSafePercentage,
} from "../../utils/calculations";
import { Savings } from "../../types";
import { Colors } from "../../theme/theme";
import { useTheme } from "../../theme/ThemeContext";

type SafeIconName = keyof typeof Ionicons.glyphMap;

// ─── Design tokens (konsisten dengan seluruh app) ─────────────────────────────
const CARD_RADIUS  = 16;
const INNER_RADIUS = 12;
const CARD_PAD     = 14;
const SECTION_GAP  = 16;

// ─── Komponen UI (konsisten) ──────────────────────────────────────────────────

const SectionHeader = ({
  title,
  linkLabel,
  onPress,
}: {
  title: string;
  linkLabel?: string;
  onPress?: () => void;
}) => {
  const { colors } = useTheme();
  return (
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
            backgroundColor: colors.accent,
            borderRadius: 2,
            marginRight: 8,
          }}
        />
        <Text
          style={{
            color: colors.textSecondary,
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
          <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "600" }}>
            {linkLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const ThinBar = ({
  progress,
  color,
}: {
  progress: number;
  color: string;
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        height: 8,
        backgroundColor: `${colors.border}80`,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: 8,
          borderRadius: 4,
          width: `${Math.max(0, Math.min(progress, 100))}%`,
          backgroundColor: color,
        }}
      />
    </View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const SavingsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { state, deleteSavings } = useAppContext();

  const BACKGROUND_COLOR = colors.background;
  const SURFACE_COLOR    = colors.surface;
  const TEXT_PRIMARY     = colors.textPrimary;
  const TEXT_SECONDARY   = colors.textSecondary;
  const ACCENT_COLOR     = colors.accent;
  const SUCCESS_COLOR    = colors.success;
  const WARNING_COLOR    = colors.warning;
  const ERROR_COLOR      = colors.error;
  const CARD_BORDER      = `${colors.border}80`;

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

  const getCategoryDisplay = (s: Savings): string => {
    const raw = s.category || "";
    const lower = raw.toLowerCase();
    const legacyMap: Record<string, string> = {
      emergency: "Dana Darurat",
      vacation: "Liburan",
      gadget: "Gadget",
      education: "Pendidikan",
      house: "Rumah",
      car: "Kendaraan",
      health: "Kesehatan",
      wedding: "Pernikahan",
      other: "Lainnya",
    };
    return legacyMap[lower] || raw || "Lainnya";
  };

  const getIcon = (s: Savings): SafeIconName => {
    if (s.icon) return s.icon as SafeIconName;
    const map: Record<string, SafeIconName> = {
      emergency: "shield-checkmark-outline" as any,
      vacation:  "airplane-outline" as any,
      gadget:    "phone-portrait-outline" as any,
      education: "school-outline" as any,
      house:     "home-outline" as any,
      car:       "car-outline" as any,
      health:    "medical-outline" as any,
      wedding:   "heart-outline" as any,
    };
    return map[s.category || ""] || ("wallet-outline" as any);
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
      ? colors.info
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingTop: 16,
            paddingBottom: 20,
          }}
        >
          {navigation.canGoBack() && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginRight: 10, padding: 4 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Kembali"
            >
              <Ionicons name="arrow-back" size={22} color={TEXT_PRIMARY} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={{ color: TEXT_PRIMARY, fontSize: 20, fontWeight: "700" }}>
              Tabungan
            </Text>
            <Text style={{ color: colors.gray400, fontSize: 11, marginTop: 3 }}>
              {savings.length} target tabungan
            </Text>
          </View>
        </View>

        {/* ── Summary hero card ─────────────────────────────────────────── */}
        {savings.length > 0 && (
          <View
            style={{
              borderRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: CARD_BORDER,
              overflow: "hidden",
              marginBottom: 16,
              backgroundColor: SURFACE_COLOR,
            }}
          >
            <LinearGradient
              colors={[ACCENT_COLOR + "14", SURFACE_COLOR, SURFACE_COLOR]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                padding: CARD_PAD,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Decorative watermark ring */}
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  right: -16,
                  top: -16,
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  borderWidth: 1,
                  borderColor: ACCENT_COLOR + "20",
                }}
              />

              <Text
                style={{
                  color: Colors.gray400,
                  fontSize: 9,
                  fontWeight: "700",
                  letterSpacing: 1.1,
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                Total Tabungan
              </Text>
              <Text
                style={{
                  color: TEXT_PRIMARY,
                  fontSize: 22,
                  fontWeight: "800",
                  letterSpacing: -0.4,
                  marginBottom: 12,
                }}
              >
                {formatCurrency(totalStats.totalCurrent)}
              </Text>

              {/* Terkumpul / Target */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                    <View
                      style={{
                        width: 5, height: 5, borderRadius: 2.5,
                        backgroundColor: ACCENT_COLOR, marginRight: 5,
                      }}
                    />
                    <Text style={{ color: Colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8 }}>
                      Tersimpan
                    </Text>
                  </View>
                  <Text style={{ color: ACCENT_COLOR, fontSize: 13, fontWeight: "700" }}>
                    {formatCurrency(totalStats.totalCurrent)}
                  </Text>
                </View>

                <View style={{ width: 1, height: 26, backgroundColor: CARD_BORDER, marginHorizontal: 12 }} />

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                    <View
                      style={{
                        width: 5, height: 5, borderRadius: 2.5,
                        backgroundColor: SUCCESS_COLOR, marginRight: 5,
                      }}
                    />
                    <Text style={{ color: Colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8 }}>
                      Target
                    </Text>
                  </View>
                  <Text style={{ color: SUCCESS_COLOR, fontSize: 13, fontWeight: "700" }}>
                    {formatCurrency(totalStats.totalTarget)}
                  </Text>
                </View>
              </View>

              <ThinBar progress={totalStats.overallProgress} color={utilizationColor} />
            </LinearGradient>
          </View>
        )}

        {/* ── Helper Concept Hint ─────────────────────────────────────── */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: `${ACCENT_COLOR}10`,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 9,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: `${ACCENT_COLOR}20`,
        }}>
          <Ionicons name="bulb-outline" size={14} color={ACCENT_COLOR} style={{ marginRight: 8 }} />
          <Text style={{ flex: 1, color: TEXT_SECONDARY, fontSize: 11, lineHeight: 16 }}>
            Tabungan mencatat target impianmu secara mandiri tanpa memotong saldo kas harian secara otomatis.
          </Text>
        </View>

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
                  activeOpacity={0.9}
                  onPress={() =>
                    navigation.navigate("SavingsDetail", { savingsId: saving.id })
                  }
                  style={{
                    backgroundColor: SURFACE_COLOR,
                    borderRadius: CARD_RADIUS,
                    marginBottom: 16,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: CARD_BORDER,
                    borderLeftWidth: 3,
                    borderLeftColor: isCompleted
                      ? SUCCESS_COLOR
                      : progress >= 50
                      ? SUCCESS_COLOR
                      : ACCENT_COLOR,
                  }}
                >
                  <ImageBackground
                    source={saving.imageCover ? { uri: saving.imageCover } : require("../../../assets/bg.png")}
                    style={{ width: "100%" }}
                    imageStyle={{ opacity: saving.imageCover ? 1 : 0.2 }}
                  >
                    <LinearGradient
                      colors={["transparent", "rgba(8,12,20,0.4)", "rgba(8,12,20,0.9)"]}
                      style={{
                        position: "absolute",
                        left: 0, right: 0, bottom: 0, top: 0,
                      }}
                    />
                    
                    <View style={{ padding: CARD_PAD }}>
                      {/* Title & Category Row */}
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <Text
                          style={{
                            color: TEXT_PRIMARY, fontSize: 18,
                            fontWeight: "800", flex: 1, marginRight: 10
                          }}
                          numberOfLines={1}
                        >
                          {saving.name}
                        </Text>
                        
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <View
                            style={{
                              height: 22, paddingHorizontal: 8,
                              borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)",
                              borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
                              flexDirection: "row", alignItems: "center", gap: 4,
                            }}
                          >
                            <Ionicons name={iconName} size={11} color={Colors.gray400} />
                            <Text style={{ color: Colors.gray400, fontSize: 8, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 }}>
                              {getCategoryDisplay(saving)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                        <Ionicons name="time-outline" size={12} color={Colors.gray400} style={{ marginRight: 4 }} />
                        <Text style={{ color: Colors.gray400, fontSize: 11 }}>
                          Target: {formatDeadline(saving.deadline)}
                        </Text>
                      </View>

                      {/* Row 2: Progress Info (Left: Saved, Right: Target) */}
                      <View style={{ marginBottom: 14 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                          <View>
                            <Text style={{ color: Colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>
                              Tersimpan
                            </Text>
                            <Text style={{ color: TEXT_PRIMARY, fontSize: 15, fontWeight: "700" }}>
                              {formatCurrency(current)}
                            </Text>
                          </View>
                          <View style={{ alignItems: "flex-end" }}>
                            <Text style={{ color: Colors.gray400, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>
                              Target
                            </Text>
                            <Text style={{ color: Colors.gray400, fontSize: 13, fontWeight: "600" }}>
                              {formatCurrency(target)}
                            </Text>
                          </View>
                        </View>
                        <ThinBar progress={progress} color={progressColor} />
                        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 6 }}>
                          <Text style={{ color: isCompleted ? SUCCESS_COLOR : ACCENT_COLOR, fontSize: 11, fontWeight: "600" }}>
                            Sisa: {formatCurrency(remaining)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </ImageBackground>
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
