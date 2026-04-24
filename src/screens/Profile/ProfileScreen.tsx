// File: src/screens/Profile/ProfileScreen.tsx
// ═══════════════════════════════════════════════════════════════
// OBSIDIAN VAULT — Premium Profile UI Redesign
// UI Designer: Claude | No business logic was harmed in this file
// ═══════════════════════════════════════════════════════════════

import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  Image,
  ImageBackground,
  TextInput,
  Modal,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import tw from "twrnc";
import { LinearGradient } from "expo-linear-gradient";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  getDay,
  isSameMonth,
  isToday,
  differenceInCalendarDays,
} from "date-fns";
import { id } from "date-fns/locale";

import { useAppContext } from "../../context/AppContext";
import { Colors } from "../../theme/theme";
import { formatCurrency } from "../../utils/calculations";

const { width } = Dimensions.get("window");

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  bg:          "#080C14",
  surface:     "#0E1521",
  card:        "#111827",
  border:      "rgba(255,255,255,0.06)",
  borderAccent:"rgba(34,211,238,0.25)",
  cyan:        "#22D3EE",
  cyanDim:     "rgba(34,211,238,0.12)",
  gold:        "#F59E0B",
  goldDim:     "rgba(245,158,11,0.12)",
  emerald:     "#10B981",
  emeraldDim:  "rgba(16,185,129,0.12)",
  rose:        "#F43F5E",
  roseDim:     "rgba(244,63,94,0.12)",
  violet:      "#8B5CF6",
  violetDim:   "rgba(139,92,246,0.12)",
  text1:       "#F8FAFC",
  text2:       "#94A3B8",
  text3:       "#475569",
};

// ─── ACHIEVEMENT DEFINITIONS (UI only — no logic) ────────────────────────────
const ACHIEVEMENTS = [
  { id: "first_steps",   icon: "footsteps",      color: C.cyan,    label: "First Steps",      desc: "Transaksi pertama",      unlocked: true  },
  { id: "week_warrior",  icon: "flame",           color: C.gold,    label: "Week Warrior",     desc: "7 hari berturut-turut",  unlocked: true  },
  { id: "century",       icon: "trophy",          color: C.violet,  label: "The Century",      desc: "100 transaksi",          unlocked: false },
  { id: "savings_king",  icon: "diamond",         color: C.emerald, label: "Savings King",     desc: "Hemat 50% sebulan",      unlocked: false },
  { id: "night_owl",     icon: "moon",            color: C.rose,    label: "Night Owl",        desc: "Catat jam 12 malam",     unlocked: false },
  { id: "analyst",       icon: "bar-chart",       color: C.cyan,    label: "Analyst",          desc: "Lihat laporan 30x",      unlocked: false },
];

// ─── REUSABLE ATOMS ──────────────────────────────────────────────────────────

const Divider = () => (
  <View style={[tw`h-px mx-5 my-0`, { backgroundColor: C.border }]} />
);

const SectionLabel = ({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
}) => (
  <View style={tw`flex-row items-center justify-between mb-4 mt-8 px-0.5`}>
    <View style={tw`flex-row items-center gap-2.5`}>
      {icon && (
        <View
          style={[
            tw`w-6 h-6 rounded-lg items-center justify-center`,
            { backgroundColor: C.cyanDim },
          ]}
        >
          <Ionicons name={icon as any} size={12} color={C.cyan} />
        </View>
      )}
      <Text
        style={[
          tw`text-xs font-black uppercase tracking-[2.5px]`,
          { color: C.text2, letterSpacing: 2.5 },
        ]}
      >
        {title}
      </Text>
    </View>
    {subtitle && (
      <Text style={[tw`text-[10px] font-bold`, { color: C.text3 }]}>
        {subtitle}
      </Text>
    )}
  </View>
);

// ─── HEALTH SCORE RING ───────────────────────────────────────────────────────
const HealthRing = ({ score }: { score: number }) => {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const progress = (score / 100) * circ;
  const color = score >= 75 ? C.emerald : score >= 50 ? C.gold : C.rose;
  const label = score >= 75 ? "Sangat Baik" : score >= 50 ? "Cukup Baik" : "Perlu Perhatian";

  return (
    <View style={tw`items-center justify-center`}>
      {/* SVG-like ring using border radius trick */}
      <View style={tw`relative w-24 h-24 items-center justify-center`}>
        {/* Background ring */}
        <View
          style={[
            tw`absolute w-24 h-24 rounded-full`,
            { borderWidth: 5, borderColor: "rgba(255,255,255,0.05)" },
          ]}
        />
        {/* Progress arc — approximated via rotation */}
        <View
          style={[
            tw`absolute w-24 h-24 rounded-full`,
            {
              borderWidth: 5,
              borderColor: color,
              borderTopColor: "transparent",
              borderRightColor: score > 50 ? color : "transparent",
              transform: [{ rotate: `-135deg` }],
              shadowColor: color,
              shadowOpacity: 0.6,
              shadowRadius: 8,
            },
          ]}
        />
        {/* Center content */}
        <View style={tw`items-center`}>
          <Text style={[tw`text-2xl font-black`, { color: C.text1 }]}>{score}</Text>
          <Text style={[tw`text-[8px] font-black uppercase tracking-widest`, { color }]}>
            SCORE
          </Text>
        </View>
      </View>
      <Text style={[tw`text-[10px] font-bold mt-2`, { color }]}>{label}</Text>
    </View>
  );
};

// ─── STREAK BADGE ────────────────────────────────────────────────────────────
const StreakBadge = ({ streak }: { streak: number }) => (
  <View style={tw`items-center flex-1`}>
    <LinearGradient
      colors={["rgba(245,158,11,0.2)", "rgba(245,158,11,0.05)"]}
      style={[
        tw`w-16 h-16 rounded-2xl items-center justify-center mb-1.5`,
        { borderWidth: 1, borderColor: "rgba(245,158,11,0.3)" },
      ]}
    >
      <Text style={tw`text-2xl`}>🔥</Text>
    </LinearGradient>
    <Text style={[tw`text-xl font-black`, { color: C.gold }]}>{streak}</Text>
    <Text style={[tw`text-[9px] font-bold uppercase tracking-wider`, { color: C.text3 }]}>
      Day Streak
    </Text>
  </View>
);

// ─── ACHIEVEMENT CARD ────────────────────────────────────────────────────────
const AchievementCard = ({
  achievement,
}: {
  achievement: (typeof ACHIEVEMENTS)[0];
}) => (
  <View
    style={[
      tw`w-28 mr-3 rounded-2xl p-3.5 items-center`,
      {
        backgroundColor: achievement.unlocked
          ? `${achievement.color}18`
          : "rgba(255,255,255,0.03)",
        borderWidth: 1,
        borderColor: achievement.unlocked
          ? `${achievement.color}35`
          : C.border,
      },
    ]}
  >
    <View
      style={[
        tw`w-11 h-11 rounded-xl items-center justify-center mb-2`,
        {
          backgroundColor: achievement.unlocked
            ? `${achievement.color}25`
            : "rgba(255,255,255,0.04)",
        },
      ]}
    >
      <Ionicons
        name={achievement.icon as any}
        size={20}
        color={achievement.unlocked ? achievement.color : C.text3}
      />
      {!achievement.unlocked && (
        <View
          style={[
            tw`absolute inset-0 rounded-xl items-center justify-center`,
            { backgroundColor: "rgba(8,12,20,0.55)" },
          ]}
        >
          <Ionicons name="lock-closed" size={10} color={C.text3} />
        </View>
      )}
    </View>
    <Text
      style={[
        tw`text-[10px] font-black text-center leading-tight`,
        { color: achievement.unlocked ? C.text1 : C.text3 },
      ]}
      numberOfLines={1}
    >
      {achievement.label}
    </Text>
    <Text
      style={[tw`text-[8px] text-center mt-0.5`, { color: C.text3 }]}
      numberOfLines={2}
    >
      {achievement.desc}
    </Text>
  </View>
);

// ─── QUICK STAT CARD ────────────────────────────────────────────────────────
const QuickStat = ({
  label,
  value,
  icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  sub?: string;
}) => (
  <View
    style={[
      tw`flex-1 rounded-2xl p-4`,
      {
        backgroundColor: `${color}0E`,
        borderWidth: 1,
        borderColor: `${color}25`,
      },
    ]}
  >
    <View
      style={[
        tw`w-8 h-8 rounded-xl items-center justify-center mb-3`,
        { backgroundColor: `${color}20` },
      ]}
    >
      <Ionicons name={icon as any} size={15} color={color} />
    </View>
    <Text style={[tw`text-xl font-black`, { color: C.text1 }]}>{value}</Text>
    {sub && (
      <Text style={[tw`text-[8px] font-bold uppercase`, { color }]}>{sub}</Text>
    )}
    <Text style={[tw`text-[9px] mt-0.5`, { color: C.text3 }]}>{label}</Text>
  </View>
);

// ─── MONTHLY PULSE CARD ──────────────────────────────────────────────────────
const MonthlyPulseCard = ({
  totalTx,
  activeDays,
  topCategory,
}: {
  totalTx: number;
  activeDays: number;
  topCategory: string;
}) => {
  const vibe =
    totalTx === 0
      ? { emoji: "🌙", label: "Bulan Tenang", color: C.violet }
      : totalTx < 10
      ? { emoji: "🌱", label: "Sedang Tumbuh", color: C.emerald }
      : totalTx < 30
      ? { emoji: "⚡", label: "Aktif Banget", color: C.cyan }
      : { emoji: "🚀", label: "Mode Hyper", color: C.gold };

  return (
    <LinearGradient
      colors={[`${vibe.color}18`, "rgba(8,12,20,0.9)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        tw`rounded-3xl p-5`,
        { borderWidth: 1, borderColor: `${vibe.color}30` },
      ]}
    >
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <View>
          <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, { color: C.text3 }]}>
            Monthly Pulse
          </Text>
          <View style={tw`flex-row items-center gap-2 mt-1`}>
            <Text style={tw`text-2xl`}>{vibe.emoji}</Text>
            <Text style={[tw`text-base font-black`, { color: vibe.color }]}>
              {vibe.label}
            </Text>
          </View>
        </View>
        <View
          style={[
            tw`px-3 py-1.5 rounded-full`,
            { backgroundColor: `${vibe.color}20`, borderWidth: 1, borderColor: `${vibe.color}35` },
          ]}
        >
          <Text style={[tw`text-[10px] font-black`, { color: vibe.color }]}>
            {format(new Date(), "MMM yyyy", { locale: id })}
          </Text>
        </View>
      </View>

      <View style={tw`flex-row gap-3`}>
        {[
          { label: "Transaksi", val: totalTx.toString(), icon: "flash-outline" },
          { label: "Hari Aktif", val: activeDays.toString(), icon: "calendar-outline" },
          { label: "Kategori", val: topCategory || "—", icon: "grid-outline" },
        ].map((item, i) => (
          <View
            key={i}
            style={[
              tw`flex-1 rounded-2xl p-3 items-center`,
              { backgroundColor: "rgba(255,255,255,0.04)" },
            ]}
          >
            <Ionicons name={item.icon as any} size={13} color={vibe.color} />
            <Text style={[tw`text-sm font-black mt-1`, { color: C.text1 }]} numberOfLines={1}>
              {item.val}
            </Text>
            <Text style={[tw`text-[8px] mt-0.5`, { color: C.text3 }]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
};

// ─── SETTINGS ROW ────────────────────────────────────────────────────────────
const SettingsRow = ({
  icon,
  iconColor,
  bgColor,
  title,
  subtitle,
  onPress,
  danger,
  last,
}: {
  icon: string;
  iconColor: string;
  bgColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}) => (
  <>
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={tw`flex-row items-center px-5 py-4`}
    >
      <View
        style={[
          tw`w-10 h-10 rounded-2xl items-center justify-center mr-4`,
          { backgroundColor: bgColor },
        ]}
      >
        <Ionicons name={icon as any} size={17} color={iconColor} />
      </View>
      <View style={tw`flex-1`}>
        <Text
          style={[tw`text-sm font-bold`, { color: danger ? C.rose : C.text1 }]}
        >
          {title}
        </Text>
        <Text style={[tw`text-[10px] mt-0.5`, { color: C.text3 }]}>
          {subtitle}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={14}
        color={danger ? `${C.rose}60` : C.text3}
      />
    </TouchableOpacity>
    {!last && <Divider />}
  </>
);

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const ProfileScreen: React.FC = () => {
  const { state, clearAllData, debugStorage, isLoading, updateUserProfile } =
    useAppContext();
  const { userProfile } = state;

  if (!userProfile) {
    return (
      <View
        style={[tw`flex-1 items-center justify-center`, { backgroundColor: C.bg }]}
      >
        <Text style={[tw`text-sm font-bold`, { color: C.text2 }]}>
          Memuat Profil…
        </Text>
      </View>
    );
  }

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [tempName, setTempName] = useState(userProfile.name);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const pickImage = async (type: "avatar" | "cover") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === "avatar" ? [1, 1] : [16, 9],
      quality: 0.7,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      if (type === "avatar") {
        await updateUserProfile({ avatar: uri });
      } else {
        await updateUserProfile({ coverImage: uri });
      }
    }
  };

  const handleUpdateName = async () => {
    if (tempName.trim().length === 0) {
      Alert.alert("Error", "Nama tidak boleh kosong");
      return;
    }
    await updateUserProfile({ name: tempName });
    setIsEditModalVisible(false);
  };

  // ─── DERIVED UI DATA (UI-only computations) ──────────────────────────────
  const uiData = useMemo(() => {
    const now = new Date();
    const thisMonthTx = state.transactions.filter((t) =>
      isSameMonth(new Date(t.date), now)
    );

    // Active days this month
    const activeDaysSet = new Set(
      thisMonthTx.map((t) => format(new Date(t.date), "yyyy-MM-dd"))
    );

    // Streak (consecutive days from today backward)
    let streak = 0;
    let cursor = new Date();
    while (true) {
      const key = format(cursor, "yyyy-MM-dd");
      if (activeDaysSet.has(key)) {
        streak++;
        cursor = new Date(cursor.getTime() - 86400000);
      } else break;
    }

    // Health score (purely decorative formula for UI)
    const consistency = Math.min((activeDaysSet.size / 20) * 40, 40);
    const volume = Math.min((thisMonthTx.length / 30) * 30, 30);
    const streakBonus = Math.min(streak * 3, 30);
    const healthScore = Math.round(consistency + volume + streakBonus);

    // Top category for pulse card
    const catCounts: Record<string, number> = {};
    thisMonthTx.forEach((t: any) => {
      if (t.category) catCounts[t.category] = (catCounts[t.category] || 0) + 1;
    });
    const topCategory =
      Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    return {
      totalTx: thisMonthTx.length,
      activeDays: activeDaysSet.size,
      streak,
      healthScore,
      topCategory,
      allTimeTx: state.transactions.length,
    };
  }, [state.transactions]);

  // ─── CALENDAR LOGIC (unchanged from original) ─────────────────────────────
  const { calendarDays, monthTotalActivity } = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    let firstDayIndex = getDay(start);
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const padding = Array(firstDayIndex).fill(null);

    const counts: Record<string, number> = {};
    let total = 0;
    state.transactions.forEach((t) => {
      const tDate = new Date(t.date);
      if (isSameMonth(tDate, currentMonth)) {
        const dateKey = format(tDate, "yyyy-MM-dd");
        counts[dateKey] = (counts[dateKey] || 0) + 1;
        total++;
      }
    });

    return {
      calendarDays: [
        ...padding,
        ...days.map((d) => ({
          date: d,
          count: counts[format(d, "yyyy-MM-dd")] || 0,
        })),
      ],
      monthTotalActivity: total,
    };
  }, [currentMonth, state.transactions]);

  const getActivityColor = (count: number) => {
    if (count === 0) return "rgba(255,255,255,0.04)";
    if (count === 1) return "rgba(34,211,238,0.18)";
    if (count === 2) return "rgba(34,211,238,0.36)";
    if (count === 3) return "rgba(34,211,238,0.55)";
    if (count === 4) return "rgba(34,211,238,0.78)";
    return C.cyan;
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: C.bg }]}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-36`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={C.cyan}
          />
        }
      >
        {/* ── HERO HEADER ────────────────────────────────────────────── */}
        <View>
          <ImageBackground
            source={
              userProfile.coverImage
                ? { uri: userProfile.coverImage }
                : require("../../../assets/bg.png")
            }
            style={tw`h-64 justify-end`}
            imageStyle={{ opacity: 0.45 }}
          >
            {/* Layered gradients for depth */}
            <LinearGradient
              colors={["transparent", "rgba(8,12,20,0.6)", C.bg]}
              style={tw`absolute inset-0`}
            />
            {/* Subtle vignette */}
            <LinearGradient
              colors={["rgba(8,12,20,0.4)", "transparent", "transparent"]}
              style={tw`absolute inset-0`}
            />

            {/* Cover edit button */}
            <View style={tw`absolute top-4 right-5`}>
              <TouchableOpacity
                onPress={() => pickImage("cover")}
                style={[
                  tw`flex-row items-center gap-1.5 px-3 py-2 rounded-full`,
                  {
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.12)",
                  },
                ]}
              >
                <Ionicons name="camera" size={13} color="rgba(255,255,255,0.7)" />
                <Text style={tw`text-white/70 text-[10px] font-bold`}>Edit Cover</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>

          {/* Profile info — sits below the hero, overlapping slightly */}
          <View style={[tw`px-6 pt-0 pb-6`, { backgroundColor: C.bg }]}>
            {/* Avatar row */}
            <View style={tw`flex-row items-end -mt-14 mb-5`}>
              {/* Avatar */}
              <View style={tw`relative`}>
                <View
                  style={[
                    tw`w-24 h-24 rounded-3xl overflow-hidden`,
                    {
                      borderWidth: 3,
                      borderColor: C.bg,
                      shadowColor: C.cyan,
                      shadowOpacity: 0.3,
                      shadowRadius: 16,
                      elevation: 12,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[`${C.cyan}40`, `${C.violet}30`]}
                    style={tw`absolute inset-0`}
                  />
                  {userProfile.avatar ? (
                    <Image
                      source={{ uri: userProfile.avatar }}
                      style={tw`w-full h-full`}
                    />
                  ) : (
                    <View style={tw`flex-1 items-center justify-center`}>
                      <Ionicons name="person" size={36} color={C.text3} />
                    </View>
                  )}
                </View>
                {/* Camera button */}
                <TouchableOpacity
                  onPress={() => pickImage("avatar")}
                  style={[
                    tw`absolute -bottom-1 -right-1 w-8 h-8 rounded-xl items-center justify-center`,
                    {
                      backgroundColor: C.cyan,
                      borderWidth: 2.5,
                      borderColor: C.bg,
                    },
                  ]}
                >
                  <Ionicons name="camera" size={13} color={C.bg} />
                </TouchableOpacity>
              </View>

              {/* Spacer + quick badges row */}
              <View style={tw`flex-1 ml-4 mb-1`}>
                <View style={tw`flex-row gap-2`}>
                  <View
                    style={[
                      tw`px-2.5 py-1 rounded-full flex-row items-center gap-1`,
                      {
                        backgroundColor: C.cyanDim,
                        borderWidth: 1,
                        borderColor: C.borderAccent,
                      },
                    ]}
                  >
                    <View
                      style={[
                        tw`w-1.5 h-1.5 rounded-full`,
                        { backgroundColor: C.cyan },
                      ]}
                    />
                    <Text
                      style={[
                        tw`text-[9px] font-black uppercase tracking-wider`,
                        { color: C.cyan },
                      ]}
                    >
                      Premium
                    </Text>
                  </View>
                  <View
                    style={[
                      tw`px-2.5 py-1 rounded-full`,
                      {
                        backgroundColor: "rgba(255,255,255,0.05)",
                        borderWidth: 1,
                        borderColor: C.border,
                      },
                    ]}
                  >
                    <Text style={[tw`text-[9px] font-bold`, { color: C.text3 }]}>
                      MM-2026
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Name row */}
            <View style={tw`flex-row items-center gap-3 mb-1`}>
              <Text
                style={[tw`text-2xl font-black flex-1`, { color: C.text1 }]}
                numberOfLines={1}
              >
                {userProfile.name}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setTempName(userProfile.name);
                  setIsEditModalVisible(true);
                }}
                style={[
                  tw`w-9 h-9 rounded-2xl items-center justify-center`,
                  {
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderWidth: 1,
                    borderColor: C.border,
                  },
                ]}
              >
                <Ionicons name="pencil" size={14} color={C.text2} />
              </TouchableOpacity>
            </View>
            <Text style={[tw`text-xs`, { color: C.text3 }]}>
              Anggota sejak 2026
            </Text>
          </View>
        </View>

        {/* ── CONTENT AREA ───────────────────────────────────────────── */}
        <View style={tw`px-5`}>

          {/* ── HEALTH SCORE + STREAK ROW ─────────────────────────────── */}
          <SectionLabel title="Ikhtisar" icon="pulse" />
          <View
            style={[
              tw`rounded-3xl p-5`,
              {
                backgroundColor: C.card,
                borderWidth: 1,
                borderColor: C.border,
              },
            ]}
          >
            <View style={tw`flex-row items-center justify-around`}>
              <HealthRing score={uiData.healthScore} />

              {/* Vertical divider */}
              <View
                style={[
                  tw`w-px self-stretch mx-2`,
                  { backgroundColor: C.border },
                ]}
              />

              <StreakBadge streak={uiData.streak} />

              <View
                style={[
                  tw`w-px self-stretch mx-2`,
                  { backgroundColor: C.border },
                ]}
              />

              {/* All-time counter */}
              <View style={tw`items-center flex-1`}>
                <LinearGradient
                  colors={[C.violetDim, "rgba(139,92,246,0.03)"]}
                  style={[
                    tw`w-16 h-16 rounded-2xl items-center justify-center mb-1.5`,
                    { borderWidth: 1, borderColor: "rgba(139,92,246,0.25)" },
                  ]}
                >
                  <Text style={tw`text-xl`}>📊</Text>
                </LinearGradient>
                <Text style={[tw`text-xl font-black`, { color: C.violet }]}>
                  {uiData.allTimeTx}
                </Text>
                <Text
                  style={[tw`text-[9px] font-bold uppercase tracking-wider`, { color: C.text3 }]}
                >
                  Total Tx
                </Text>
              </View>
            </View>

            {/* Mini tip */}
            <View
              style={[
                tw`mt-4 px-4 py-3 rounded-2xl flex-row items-center gap-2.5`,
                { backgroundColor: "rgba(255,255,255,0.03)" },
              ]}
            >
              <Ionicons name="information-circle" size={14} color={C.text3} />
              <Text style={[tw`text-[10px] flex-1 leading-4`, { color: C.text3 }]}>
                Skor kesehatan finansial dihitung dari konsistensi pencatatan dan frekuensi transaksi.
              </Text>
            </View>
          </View>

          {/* ── MONTHLY PULSE ──────────────────────────────────────────── */}
          <SectionLabel title="Monthly Pulse" icon="analytics" />
          <MonthlyPulseCard
            totalTx={uiData.totalTx}
            activeDays={uiData.activeDays}
            topCategory={uiData.topCategory}
          />

          {/* ── QUICK STATS ────────────────────────────────────────────── */}
          <SectionLabel title="Statistik Bulan Ini" icon="stats-chart" />
          <View style={tw`flex-row gap-3`}>
            <QuickStat
              label="Transaksi"
              value={uiData.totalTx}
              icon="flash"
              color={C.cyan}
              sub="bulan ini"
            />
            <QuickStat
              label="Hari Aktif"
              value={uiData.activeDays}
              icon="checkmark-circle"
              color={C.emerald}
              sub="hari"
            />
            <QuickStat
              label="Streak"
              value={`${uiData.streak}🔥`}
              icon="flame"
              color={C.gold}
              sub="hari"
            />
          </View>

          {/* ── ACHIEVEMENTS ───────────────────────────────────────────── */}
          <SectionLabel
            title="Achievements"
            icon="trophy"
            subtitle={`${ACHIEVEMENTS.filter((a) => a.unlocked).length}/${ACHIEVEMENTS.length} unlocked`}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`px-0.5 pb-1`}
          >
            {ACHIEVEMENTS.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </ScrollView>

          {/* ── CONSISTENCY CALENDAR ───────────────────────────────────── */}
          <SectionLabel
            title="Consistency Calendar"
            icon="calendar"
            subtitle={`${monthTotalActivity} aktivitas`}
          />
          <View
            style={[
              tw`rounded-3xl p-5`,
              {
                backgroundColor: C.card,
                borderWidth: 1,
                borderColor: C.border,
              },
            ]}
          >
            {/* Nav */}
            <View style={tw`flex-row items-center justify-between mb-6`}>
              <TouchableOpacity
                onPress={prevMonth}
                style={[
                  tw`w-9 h-9 rounded-2xl items-center justify-center`,
                  { backgroundColor: "rgba(255,255,255,0.05)" },
                ]}
              >
                <Ionicons name="chevron-back" size={16} color={C.cyan} />
              </TouchableOpacity>

              <View style={tw`items-center`}>
                <Text style={[tw`text-sm font-black capitalize`, { color: C.text1 }]}>
                  {format(currentMonth, "MMMM yyyy", { locale: id })}
                </Text>
                <Text
                  style={[tw`text-[9px] font-bold uppercase tracking-widest mt-0.5`, { color: C.text3 }]}
                >
                  {monthTotalActivity} entri dicatat
                </Text>
              </View>

              <TouchableOpacity
                onPress={nextMonth}
                style={[
                  tw`w-9 h-9 rounded-2xl items-center justify-center`,
                  { backgroundColor: "rgba(255,255,255,0.05)" },
                ]}
              >
                <Ionicons name="chevron-forward" size={16} color={C.cyan} />
              </TouchableOpacity>
            </View>

            {/* Day labels */}
            <View style={tw`flex-row justify-center gap-2 mb-4`}>
              {["S", "S", "R", "K", "J", "S", "M"].map((d, i) => (
                <View key={i} style={tw`w-8 items-center`}>
                  <Text
                    style={[tw`text-[9px] font-extrabold uppercase`, { color: C.text3 }]}
                  >
                    {d}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar grid */}
            <View>
              {(() => {
                const rows = [];
                for (let i = 0; i < calendarDays.length; i += 7) {
                  let week = calendarDays.slice(i, i + 7);
                  while (week.length < 7) week.push(null);
                  rows.push(week);
                }
                return rows.map((week, wIdx) => (
                  <View key={wIdx} style={tw`flex-row justify-center gap-2 mb-2`}>
                    {week.map((day, dIdx) => {
                      const isT = day && isToday(day.date);
                      return (
                        <View
                          key={dIdx}
                          style={[
                            tw`w-8 h-8 rounded-xl items-center justify-center`,
                            {
                              backgroundColor: day
                                ? getActivityColor(day.count)
                                : "transparent",
                              borderWidth: isT ? 1.5 : 0,
                              borderColor: isT ? C.cyan : "transparent",
                            },
                          ]}
                        >
                          {day && (
                            <Text
                              style={[
                                tw`text-[9px] font-bold`,
                                {
                                  color:
                                    day.count >= 4
                                      ? "#080C14"
                                      : isT
                                      ? C.cyan
                                      : C.text3,
                                },
                              ]}
                            >
                              {format(day.date, "d")}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ));
              })()}
            </View>

            {/* Legend */}
            <View style={tw`flex-row items-center justify-center gap-3 mt-5`}>
              <Text style={[tw`text-[8px] font-bold mr-1`, { color: C.text3 }]}>
                Lebih sedikit
              </Text>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  style={[
                    tw`w-3 h-3 rounded`,
                    { backgroundColor: getActivityColor(i) },
                  ]}
                />
              ))}
              <Text style={[tw`text-[8px] font-bold ml-1`, { color: C.text3 }]}>
                Lebih banyak
              </Text>
            </View>
          </View>

          {/* ── ACCOUNT MANAGEMENT ─────────────────────────────────────── */}
          <SectionLabel title="Kelola Akun" icon="settings" />
          <View
            style={[
              tw`rounded-3xl overflow-hidden`,
              {
                backgroundColor: C.card,
                borderWidth: 1,
                borderColor: C.border,
              },
            ]}
          >
            <SettingsRow
              icon="shield-checkmark-outline"
              iconColor="#3B82F6"
              bgColor="rgba(59,130,246,0.12)"
              title="Keamanan & Storage"
              subtitle="Cek integritas database lokal"
              onPress={debugStorage}
            />
            <SettingsRow
              icon="trash-outline"
              iconColor={C.rose}
              bgColor={C.roseDim}
              title="Hapus Semua Data"
              subtitle="Reset aplikasi ke pengaturan pabrik"
              onPress={() =>
                Alert.alert("Wipe Data", "Hapus semua data?", [
                  { text: "Batal", style: "cancel" },
                  { text: "Hapus", style: "destructive", onPress: clearAllData },
                ])
              }
              danger
              last
            />
          </View>

          {/* ── FOOTER ─────────────────────────────────────────────────── */}
          <View style={tw`items-center mt-10 mb-2`}>
            <Text style={[tw`text-[9px] font-bold uppercase tracking-widest`, { color: C.text3 }]}>
              MoneyMate · v2.0.0 · Obsidian Vault
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── EDIT NAME MODAL ───────────────────────────────────────────── */}
      <Modal visible={isEditModalVisible} transparent animationType="slide">
        <View
          style={[
            tw`flex-1 justify-end`,
            { backgroundColor: "rgba(0,0,0,0.75)" },
          ]}
        >
          <View
            style={[
              tw`rounded-t-[40px] p-8`,
              {
                backgroundColor: C.surface,
                borderTopWidth: 1,
                borderColor: C.border,
              },
            ]}
          >
            {/* Handle */}
            <View
              style={[
                tw`w-10 h-1 rounded-full self-center mb-8`,
                { backgroundColor: C.border },
              ]}
            />

            <Text style={[tw`text-2xl font-black mb-1`, { color: C.text1 }]}>
              Ubah Nama
            </Text>
            <Text style={[tw`text-xs mb-6`, { color: C.text3 }]}>
              Nama ini akan tampil di halaman profil kamu.
            </Text>

            <View
              style={[
                tw`rounded-2xl px-4 py-3.5 mb-8`,
                {
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderWidth: 1.5,
                  borderColor: C.borderAccent,
                },
              ]}
            >
              <Text style={[tw`text-[9px] font-black uppercase tracking-widest mb-1.5`, { color: C.cyan }]}>
                Nama
              </Text>
              <TextInput
                value={tempName}
                onChangeText={setTempName}
                placeholder="Nama Anda"
                placeholderTextColor={C.text3}
                style={[tw`text-base font-bold`, { color: C.text1 }]}
                autoFocus
              />
            </View>

            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                style={[
                  tw`flex-1 py-4 rounded-2xl items-center`,
                  {
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderWidth: 1,
                    borderColor: C.border,
                  },
                ]}
              >
                <Text style={[tw`font-black text-sm`, { color: C.text2 }]}>
                  Batal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateName}
                style={[
                  tw`flex-1 py-4 rounded-2xl items-center`,
                  { backgroundColor: C.cyan },
                ]}
              >
                <Text style={[tw`font-black text-sm`, { color: C.bg }]}>
                  Simpan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;