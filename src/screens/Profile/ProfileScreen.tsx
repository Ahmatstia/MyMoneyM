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
  bg: "#080C14",
  surface: "#0E1521",
  card: "#111827",
  border: "rgba(255,255,255,0.06)",
  borderAccent: "rgba(34,211,238,0.25)",
  cyan: "#22D3EE",
  cyanDim: "rgba(34,211,238,0.12)",
  gold: "#F59E0B",
  goldDim: "rgba(245,158,11,0.12)",
  emerald: "#10B981",
  emeraldDim: "rgba(16,185,129,0.12)",
  rose: "#F43F5E",
  roseDim: "rgba(244,63,94,0.12)",
  violet: "#8B5CF6",
  violetDim: "rgba(139,92,246,0.12)",
  text1: "#F8FAFC",
  text2: "#94A3B8",
  text3: "#475569",
};

// ─── ACHIEVEMENT TYPE ─────────────────────────────────────────────────────────
type Achievement = {
  id: string;
  icon: string;
  color: string;
  label: string;
  desc: string;
  unlocked: boolean;
  progress?: number; // 0-100, optional progress ring
};

// Template definitions (unlocked computed dynamically in component)
const ACHIEVEMENT_DEFS = [
  {
    id: "first_steps",
    icon: "footsteps",
    color: C.cyan,
    label: "First Steps",
    desc: "Transaksi pertama",
  },
  {
    id: "week_warrior",
    icon: "flame",
    color: C.gold,
    label: "Week Warrior",
    desc: "7 hari berturut-turut",
  },
  {
    id: "century",
    icon: "trophy",
    color: C.violet,
    label: "The Century",
    desc: "100 transaksi",
  },
  {
    id: "savings_king",
    icon: "diamond",
    color: C.emerald,
    label: "Savings King",
    desc: "Punya tabungan aktif",
  },
  {
    id: "night_owl",
    icon: "moon",
    color: C.rose,
    label: "Night Owl",
    desc: "Catat lewat jam 11 PM",
  },
  {
    id: "diversified",
    icon: "grid",
    color: C.violet,
    label: "Diversified",
    desc: "5+ kategori berbeda",
  },
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
  const r = 24;
  const circ = 2 * Math.PI * r;
  const color = score >= 75 ? C.emerald : score >= 50 ? C.gold : C.rose;
  const label =
    score >= 75 ? "Sangat Baik" : score >= 50 ? "Cukup Baik" : "Perhatian";

  return (
    <View style={tw`items-center justify-center`}>
      {/* SVG-like ring using border radius trick */}
      <View style={tw`relative w-14 h-14 items-center justify-center`}>
        {/* Background ring */}
        <View
          style={[
            tw`absolute w-14 h-14 rounded-full`,
            { borderWidth: 3, borderColor: "rgba(255,255,255,0.05)" },
          ]}
        />
        {/* Progress arc — approximated via rotation */}
        <View
          style={[
            tw`absolute w-14 h-14 rounded-full`,
            {
              borderWidth: 3,
              borderColor: color,
              borderTopColor: "transparent",
              borderRightColor: score > 50 ? color : "transparent",
              transform: [{ rotate: `-135deg` }],
            },
          ]}
        />
        {/* Center content */}
        <View style={tw`items-center`}>
          <Text style={[tw`text-sm font-black`, { color: C.text1 }]}>
            {score}
          </Text>
        </View>
      </View>
      <Text style={[tw`text-[9px] font-bold mt-1.5`, { color }]}>{label}</Text>
    </View>
  );
};

// ─── STREAK BADGE ────────────────────────────────────────────────────────────
const StreakBadge = ({ streak }: { streak: number }) => (
  <View style={tw`items-center flex-1`}>
    <LinearGradient
      colors={["rgba(245,158,11,0.2)", "rgba(245,158,11,0.05)"]}
      style={[
        tw`w-10 h-10 rounded-xl items-center justify-center mb-1`,
        { borderWidth: 1, borderColor: "rgba(245,158,11,0.3)" },
      ]}
    >
      <Text style={tw`text-lg`}>🔥</Text>
    </LinearGradient>
    <Text style={[tw`text-sm font-black`, { color: C.gold }]}>{streak}</Text>
    <Text
      style={[
        tw`text-[8px] font-bold uppercase tracking-wider`,
        { color: C.text3 },
      ]}
    >
      Day Streak
    </Text>
  </View>
);

// ─── ACHIEVEMENT CARD ────────────────────────────────────────────────────────
const AchievementCard = ({ achievement }: { achievement: Achievement }) => (
  <View
    style={[
      tw`w-28 mr-2.5 rounded-2xl p-3 items-center`,
      {
        backgroundColor: achievement.unlocked
          ? `${achievement.color}18`
          : "rgba(255,255,255,0.03)",
        borderWidth: 1,
        borderColor: achievement.unlocked ? `${achievement.color}35` : C.border,
      },
    ]}
  >
    <View
      style={[
        tw`w-9 h-9 rounded-xl items-center justify-center mb-2`,
        {
          backgroundColor: achievement.unlocked
            ? `${achievement.color}25`
            : "rgba(255,255,255,0.04)",
        },
      ]}
    >
      <Ionicons
        name={achievement.icon as any}
        size={16}
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
        tw`text-[9px] font-black text-center leading-tight`,
        { color: achievement.unlocked ? C.text1 : C.text3 },
      ]}
      numberOfLines={1}
    >
      {achievement.label}
    </Text>
    <Text
      style={[tw`text-[7px] text-center mt-0.5`, { color: C.text3 }]}
      numberOfLines={2}
    >
      {achievement.desc}
    </Text>
    {/* Progress bar untuk achievement yang punya progress */}
    {!achievement.unlocked && achievement.progress !== undefined && (
      <View
        style={[
          tw`w-full mt-1.5 rounded-full overflow-hidden`,
          { height: 2.5, backgroundColor: "rgba(255,255,255,0.06)" },
        ]}
      >
        <View
          style={[
            {
              height: 2.5,
              borderRadius: 99,
              backgroundColor: achievement.color,
              width: `${achievement.progress}%`,
            },
          ]}
        />
      </View>
    )}
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
      tw`flex-1 rounded-[14px] p-3 flex-row items-center`,
      {
        backgroundColor: `${color}0E`,
        borderWidth: 1,
        borderColor: `${color}25`,
      },
    ]}
  >
    <View
      style={[
        tw`w-8 h-8 rounded-lg items-center justify-center mr-2.5`,
        { backgroundColor: `${color}20` },
      ]}
    >
      <Ionicons name={icon as any} size={14} color={color} />
    </View>
    <View style={tw`flex-1`}>
      <Text
        style={[tw`text-sm font-black`, { color: C.text1 }]}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text
        style={[tw`text-[8px] mt-0.5`, { color: C.text3 }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
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
    <View
      style={[
        tw`rounded-2xl p-3.5 flex-row items-center`,
        {
          backgroundColor: `${vibe.color}10`,
          borderWidth: 1,
          borderColor: `${vibe.color}30`,
        },
      ]}
    >
      <View
        style={tw`flex-1 border-r border-[rgba(255,255,255,0.06)] pr-3 mr-3`}
      >
        <View style={tw`flex-row items-center justify-between mb-1.5`}>
          <Text
            style={[
              tw`text-[8px] font-black uppercase tracking-widest`,
              { color: C.text3 },
            ]}
          >
            {format(new Date(), "MMM yyyy", { locale: id })}
          </Text>
        </View>
        <View style={tw`flex-row items-center gap-1.5`}>
          <Text style={tw`text-lg`}>{vibe.emoji}</Text>
          <Text style={[tw`text-sm font-black`, { color: vibe.color }]}>
            {vibe.label}
          </Text>
        </View>
      </View>

      <View style={tw`flex-1 flex-row flex-wrap gap-y-2`}>
        <View style={tw`w-1/2`}>
          <Text style={[tw`text-[8px]`, { color: C.text3 }]}>Transaksi</Text>
          <Text style={[tw`text-xs font-bold`, { color: C.text1 }]}>
            {totalTx}
          </Text>
        </View>
        <View style={tw`w-1/2`}>
          <Text style={[tw`text-[8px]`, { color: C.text3 }]}>Hari Aktif</Text>
          <Text style={[tw`text-xs font-bold`, { color: C.text1 }]}>
            {activeDays}
          </Text>
        </View>
        <View style={tw`w-full`}>
          <Text style={[tw`text-[8px]`, { color: C.text3 }]}>
            Kategori Teratas
          </Text>
          <Text
            style={[tw`text-xs font-bold`, { color: C.text1 }]}
            numberOfLines={1}
          >
            {topCategory || "—"}
          </Text>
        </View>
      </View>
    </View>
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
        style={[
          tw`flex-1 items-center justify-center`,
          { backgroundColor: C.bg },
        ]}
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

  // ─── DERIVED UI DATA ──────────────────────────────────────────────────────
  const uiData = useMemo(() => {
    const now = new Date();
    const thisMonthTx = state.transactions.filter((t) =>
      isSameMonth(new Date(t.date), now),
    );

    // Active days this month
    const activeDaysSet = new Set(
      thisMonthTx.map((t) => format(new Date(t.date), "yyyy-MM-dd")),
    );

    // ── Streak: hitung dari SEMUA transaksi sepanjang waktu, mundur dari hari ini
    const allDaysWithTx = new Set(
      state.transactions.map((t) => format(new Date(t.date), "yyyy-MM-dd")),
    );
    let streak = 0;
    let cursor = new Date();
    // Kalau hari ini belum ada tx, mulai cek dari kemarin
    const todayKey = format(cursor, "yyyy-MM-dd");
    if (!allDaysWithTx.has(todayKey)) {
      cursor = new Date(cursor.getTime() - 86400000);
    }
    while (true) {
      const key = format(cursor, "yyyy-MM-dd");
      if (allDaysWithTx.has(key)) {
        streak++;
        cursor = new Date(cursor.getTime() - 86400000);
      } else break;
    }

    // ── Health score
    const consistency = Math.min((activeDaysSet.size / 20) * 40, 40);
    const volume = Math.min((thisMonthTx.length / 30) * 30, 30);
    const streakBonus = Math.min(streak * 3, 30);
    const healthScore = Math.round(consistency + volume + streakBonus);

    // ── Top category (semua transaksi) untuk Monthly Pulse
    const catCounts: Record<string, number> = {};
    thisMonthTx.forEach((t: any) => {
      if (t.category) catCounts[t.category] = (catCounts[t.category] || 0) + 1;
    });
    const topCategory =
      Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    // ── Savings Ratio bulan ini (tabungan / pemasukan * 100)
    const monthIncome = thisMonthTx
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const monthExpense = thisMonthTx
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const savingsRatio =
      monthIncome > 0
        ? Math.max(
            0,
            Math.round(((monthIncome - monthExpense) / monthIncome) * 100),
          )
        : 0;

    // ── Top expense category bulan ini
    const expCatCounts: Record<string, number> = {};
    thisMonthTx
      .filter((t) => t.type === "expense")
      .forEach((t: any) => {
        if (t.category)
          expCatCounts[t.category] = (expCatCounts[t.category] || 0) + 1;
      });
    const topExpenseCategory =
      Object.entries(expCatCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    // ── Night Owl: pernah catat transaksi jam >= 23:00
    const hasNightOwl = state.transactions.some((t) => {
      const h = new Date(t.createdAt).getHours();
      return h >= 23;
    });

    // ── Diversified: >= 5 kategori berbeda bulan ini
    const uniqueCategories = new Set(
      thisMonthTx.map((t: any) => t.category).filter(Boolean),
    );

    // ── Achievements logic
    const achievements: Achievement[] = ACHIEVEMENT_DEFS.map((def) => {
      let unlocked = false;
      let progress: number | undefined = undefined;

      switch (def.id) {
        case "first_steps":
          unlocked = state.transactions.length >= 1;
          break;
        case "week_warrior":
          unlocked = streak >= 7;
          progress = Math.min(100, Math.round((streak / 7) * 100));
          break;
        case "century":
          unlocked = state.transactions.length >= 100;
          progress = Math.min(
            100,
            Math.round((state.transactions.length / 100) * 100),
          );
          break;
        case "savings_king":
          unlocked = state.savings.length > 0;
          break;
        case "night_owl":
          unlocked = hasNightOwl;
          break;
        case "diversified":
          unlocked = uniqueCategories.size >= 5;
          progress = Math.min(
            100,
            Math.round((uniqueCategories.size / 5) * 100),
          );
          break;
      }

      return { ...def, unlocked, progress };
    });

    return {
      totalTx: thisMonthTx.length,
      activeDays: activeDaysSet.size,
      streak,
      healthScore,
      topCategory,
      savingsRatio,
      topExpenseCategory,
      allTimeTx: state.transactions.length,
      achievements,
    };
  }, [state.transactions, state.savings]);

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
            style={tw`h-56 justify-end`}
            imageStyle={{ opacity: 1 }}
          >
            {/* Smooth transition di bagian paling bawah saja */}
            <LinearGradient
              colors={["transparent", "transparent", C.bg]}
              style={tw`absolute inset-0`}
            />

            {/* Cover edit button */}
            <View style={tw`absolute top-4 right-4`}>
              <TouchableOpacity
                onPress={() => pickImage("cover")}
                style={[
                  tw`flex-row items-center gap-1 px-2.5 py-1.5 rounded-full`,
                  {
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.12)",
                  },
                ]}
              >
                <Ionicons
                  name="camera"
                  size={12}
                  color="rgba(255,255,255,0.7)"
                />
                <Text style={tw`text-white/70 text-[9px] font-bold`}>
                  Edit Cover
                </Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>

          {/* Profile info — sits below the hero, overlapping slightly */}
          <View style={[tw`px-5 pt-0 pb-4`, { backgroundColor: C.bg }]}>
            {/* Avatar row */}
            <View style={tw`flex-row items-end -mt-10 mb-4`}>
              {/* Avatar */}
              <View style={tw`relative`}>
                <View
                  style={[
                    tw`w-15 h-15 rounded-[24px] overflow-hidden`,
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
                      <Ionicons name="person" size={28} color={C.text3} />
                    </View>
                  )}
                </View>
                {/* Camera button */}
                <TouchableOpacity
                  onPress={() => pickImage("avatar")}
                  style={[
                    tw`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg items-center justify-center`,
                    {
                      backgroundColor: C.cyan,
                      borderWidth: 2,
                      borderColor: C.bg,
                    },
                  ]}
                >
                  <Ionicons name="camera" size={11} color={C.bg} />
                </TouchableOpacity>
              </View>

              {/* Name column next to Avatar */}
              <View style={tw`flex-1 ml-5 mb-1`}>
                <View style={tw`flex-row items-center gap-2 mb-0.5`}>
                  <Text
                    style={[tw`text-xl font-black`, { color: C.text1 }]}
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
                      tw`w-6 h-6 rounded-lg items-center justify-center`,
                      {
                        backgroundColor: "rgba(255,255,255,0.05)",
                        borderWidth: 1,
                        borderColor: C.border,
                      },
                    ]}
                  >
                    <Ionicons name="pencil" size={10} color={C.text2} />
                  </TouchableOpacity>
                </View>
                <Text style={[tw`text-[10px]`, { color: C.text3 }]}>
                  Anggota sejak 2026
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── CONTENT AREA ───────────────────────────────────────────── */}
        <View style={tw`px-5`}>
          {/* ── HEALTH SCORE + STREAK ROW ─────────────────────────────── */}
          <SectionLabel title="Ikhtisar" icon="pulse" />
          <View
            style={[
              tw`rounded-2xl p-4`,
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

              {/* Savings Ratio */}
              <View style={tw`items-center flex-1`}>
                <LinearGradient
                  colors={[C.emeraldDim, "rgba(16,185,129,0.03)"]}
                  style={[
                    tw`w-10 h-10 rounded-xl items-center justify-center mb-1`,
                    { borderWidth: 1, borderColor: "rgba(16,185,129,0.25)" },
                  ]}
                >
                  <Text style={tw`text-lg`}>💰</Text>
                </LinearGradient>
                <Text style={[tw`text-sm font-black`, { color: C.emerald }]}>
                  {uiData.savingsRatio}%
                </Text>
                <Text
                  style={[
                    tw`text-[8px] font-bold uppercase tracking-wider`,
                    { color: C.text3 },
                  ]}
                >
                  Rasio %
                </Text>
              </View>
            </View>

            {/* Mini tip */}
            <View
              style={[
                tw`mt-3 px-3 py-2 rounded-xl flex-row items-center gap-2.5`,
                { backgroundColor: "rgba(255,255,255,0.03)" },
              ]}
            >
              <Ionicons name="information-circle" size={12} color={C.text3} />
              <Text
                style={[tw`text-[9px] flex-1 leading-3`, { color: C.text3 }]}
              >
                Skor dari konsistensi · Rasio tabungan = (In - Out) ÷ In
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

          {/* ── ACHIEVEMENTS ───────────────────────────────────────────── */}
          <SectionLabel
            title="Achievements"
            icon="trophy"
            subtitle={`${uiData.achievements.filter((a) => a.unlocked).length}/${uiData.achievements.length} unlocked`}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`px-0.5 pb-1`}
          >
            {uiData.achievements.map((a) => (
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
              tw`rounded-2xl p-4`,
              {
                backgroundColor: C.card,
                borderWidth: 1,
                borderColor: C.border,
              },
            ]}
          >
            {/* Nav */}
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <TouchableOpacity
                onPress={prevMonth}
                style={[
                  tw`w-8 h-8 rounded-xl items-center justify-center`,
                  { backgroundColor: "rgba(255,255,255,0.05)" },
                ]}
              >
                <Ionicons name="chevron-back" size={14} color={C.cyan} />
              </TouchableOpacity>

              <View style={tw`items-center`}>
                <Text
                  style={[
                    tw`text-sm font-black capitalize`,
                    { color: C.text1 },
                  ]}
                >
                  {format(currentMonth, "MMMM yyyy", { locale: id })}
                </Text>
                <Text
                  style={[
                    tw`text-[8px] font-bold uppercase tracking-widest mt-0.5`,
                    { color: C.text3 },
                  ]}
                >
                  {monthTotalActivity} entri
                </Text>
              </View>

              <TouchableOpacity
                onPress={nextMonth}
                style={[
                  tw`w-8 h-8 rounded-xl items-center justify-center`,
                  { backgroundColor: "rgba(255,255,255,0.05)" },
                ]}
              >
                <Ionicons name="chevron-forward" size={14} color={C.cyan} />
              </TouchableOpacity>
            </View>

            {/* Day labels */}
            <View style={tw`flex-row justify-center gap-1.5 mb-3`}>
              {["S", "S", "R", "K", "J", "S", "M"].map((d, i) => (
                <View key={i} style={tw`w-6 items-center`}>
                  <Text
                    style={[
                      tw`text-[8px] font-extrabold uppercase`,
                      { color: C.text3 },
                    ]}
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
                  <View
                    key={wIdx}
                    style={tw`flex-row justify-center gap-1.5 mb-1.5`}
                  >
                    {week.map((day, dIdx) => {
                      const isT = day && isToday(day.date);
                      return (
                        <View
                          key={dIdx}
                          style={[
                            tw`w-6 h-6 rounded-lg items-center justify-center`,
                            {
                              backgroundColor: day
                                ? getActivityColor(day.count)
                                : "transparent",
                              borderWidth: isT ? 1 : 0,
                              borderColor: isT ? C.cyan : "transparent",
                            },
                          ]}
                        >
                          {day && (
                            <Text
                              style={[
                                tw`text-[8px] font-bold`,
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
            <View style={tw`flex-row items-center justify-center gap-2.5 mt-4`}>
              <Text style={[tw`text-[7px] font-bold mr-1`, { color: C.text3 }]}>
                Sedikit
              </Text>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  style={[
                    tw`w-2 h-2 rounded-sm`,
                    { backgroundColor: getActivityColor(i) },
                  ]}
                />
              ))}
              <Text style={[tw`text-[7px] font-bold ml-1`, { color: C.text3 }]}>
                Banyak
              </Text>
            </View>
          </View>

          {/* ── FOOTER ─────────────────────────────────────────────────── */}
          <View style={tw`items-center mt-10 mb-2`}>
            <Text
              style={[
                tw`text-[9px] font-bold uppercase tracking-widest`,
                { color: C.text3 },
              ]}
            >
              MyMoney
            </Text>
            <Text
              style={[
                tw`text-[9px] font-bold uppercase tracking-widest`,
                { color: C.text3 },
              ]}
            >
              Version 1.0.6
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
              <Text
                style={[
                  tw`text-[9px] font-black uppercase tracking-widest mb-1.5`,
                  { color: C.cyan },
                ]}
              >
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
