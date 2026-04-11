// File: src/screens/SavingsScreen.tsx — REDESIGNED with Design System
import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import {
  formatCurrency,
  safeNumber,
  getSafePercentage,
} from "../../utils/calculations";
import { formatDateShort } from "../../utils/formatters";
import { Savings } from "../../types";
import { Colors } from "../../theme/theme";
import {
  DS,
  pageContainer,
  headerBar,
  headerTitle,
  headerSubtitle,
  headerFAB,
  cardPadded,
  scrollContent,
  filterPill,
  filterPillActive,
  filterPillText,
  filterPillTextActive,
  statColumn,
  statLabel,
  statValue,
  statDivider,
  iconButton,
  badge,
  badgeText,
  progressTrack,
  progressFill,
  emptyState,
  emptyTitle,
  emptySubtitle,
  primaryButton,
  primaryButtonText,
  cardSeparator,
} from "../../theme/designSystem";

type SafeIconName = keyof typeof Ionicons.glyphMap;

const SavingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state, deleteSavings, refreshData } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const savings = state.savings || [];

  const totalStats = useMemo(() => {
    const totalTarget = savings.reduce(
      (sum, s) => sum + safeNumber(s.target),
      0
    );
    const totalCurrent = savings.reduce(
      (sum, s) => sum + safeNumber(s.current),
      0
    );
    const overallProgress = getSafePercentage(totalCurrent, totalTarget);
    const activeCount = savings.filter(
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
        case "active": return !isCompleted;
        case "completed": return isCompleted;
        default: return true;
      }
    });
  }, [savings, filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const getIcon = (s: Savings): SafeIconName => {
    if (s.icon) return s.icon as SafeIconName;
    const map: Record<string, SafeIconName> = {
      emergency: "shield", vacation: "airplane", gadget: "phone-portrait",
      education: "school", house: "home", car: "car",
      health: "medical", wedding: "heart",
    };
    return map[s.category || ""] || "wallet";
  };

  const getProgressColor = (p: number) => {
    if (p >= 100) return DS.success;
    if (p >= 75) return DS.info;
    if (p >= 50) return DS.warning;
    if (p >= 25) return DS.error;
    return DS.textMuted;
  };

  const formatDeadline = (deadline?: string) => {
    if (!deadline) return "Tanpa deadline";
    try {
      const d = new Date(deadline);
      const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (diff < 0) return "Terlambat";
      if (diff === 0) return "Hari ini";
      if (diff === 1) return "Besok";
      if (diff < 7) return `${diff} hari lagi`;
      if (diff < 30) return `${Math.floor(diff / 7)} minggu lagi`;
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
    { key: "all", label: "Semua", count: savings.length },
    { key: "active", label: "Aktif", count: totalStats.activeCount },
    { key: "completed", label: "Tercapai", count: totalStats.completedCount },
  ];

  return (
    <View style={pageContainer}>
      {/* ====== COMPACT HEADER ====== */}
      <View style={[headerBar, tw`flex-row justify-between items-center`]}>
        <View>
          <Text style={headerTitle}>Tabungan</Text>
          <Text style={headerSubtitle}>
            {savings.length} target tabungan
          </Text>
        </View>
        <TouchableOpacity
          style={headerFAB}
          onPress={() => navigation.navigate("AddSavings")}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* ====== SCROLLABLE CONTENT ====== */}
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Stats — inside scroll */}
        {savings.length > 0 && (
          <View style={[cardPadded, tw`mb-4`]}>
            {/* Progress */}
            <View style={tw`flex-row justify-between items-center mb-2`}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: DS.text }}>
                {formatCurrency(totalStats.totalCurrent)} /{" "}
                {formatCurrency(totalStats.totalTarget)}
              </Text>
              <Text
                style={{ fontSize: 13, fontWeight: "700", color: DS.accent }}
              >
                {totalStats.overallProgress.toFixed(1)}%
              </Text>
            </View>
            <View style={progressTrack}>
              <View
                style={progressFill(
                  DS.accent,
                  Math.min(totalStats.overallProgress, 100)
                )}
              />
            </View>

            {/* Stats Row */}
            <View style={tw`flex-row justify-between mt-3`}>
              <View style={statColumn}>
                <Text style={statLabel}>Aktif</Text>
                <Text style={[statValue, { color: DS.accent }]}>
                  {totalStats.activeCount}
                </Text>
              </View>
              <View style={statDivider} />
              <View style={statColumn}>
                <Text style={statLabel}>Tercapai</Text>
                <Text style={[statValue, { color: DS.success }]}>
                  {totalStats.completedCount}
                </Text>
              </View>
              <View style={statDivider} />
              <View style={statColumn}>
                <Text style={statLabel}>Total</Text>
                <Text style={statValue}>{savings.length}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={tw`mb-4`}
          contentContainerStyle={tw`flex-row gap-2`}
        >
          {filterTabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={filter === tab.key ? filterPillActive : filterPill}
              onPress={() => setFilter(tab.key as any)}
            >
              <Text
                style={
                  filter === tab.key ? filterPillTextActive : filterPillText
                }
              >
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Savings Cards */}
        {filteredSavings.length === 0 ? (
          <View style={emptyState}>
            <Ionicons name="wallet-outline" size={48} color={DS.textMuted} />
            <Text style={emptyTitle}>
              {filter === "all"
                ? "Belum ada tabungan"
                : "Tidak ada tabungan"}
            </Text>
            <Text style={emptySubtitle}>
              {filter === "all"
                ? "Mulai dengan membuat target tabungan pertama Anda"
                : `Tidak ada tabungan dengan status "${filter}"`}
            </Text>
            {filter === "all" && (
              <TouchableOpacity
                style={primaryButton}
                onPress={() => navigation.navigate("AddSavings")}
              >
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text style={primaryButtonText}>Buat Target Tabungan</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredSavings.map((saving) => {
            const current = safeNumber(saving.current);
            const target = safeNumber(saving.target);
            const progress = getSafePercentage(current, target);
            const remaining = target - current;
            const progressColor = getProgressColor(progress);
            const iconName = getIcon(saving);
            const isCompleted = current >= target;

            return (
              <View key={saving.id} style={[cardPadded, tw`mb-3`]}>
                {/* Row 1: Icon + Name + Actions */}
                <View
                  style={tw`flex-row justify-between items-center mb-3`}
                >
                  <View style={tw`flex-row items-center gap-3 flex-1`}>
                    <View
                      style={[
                        tw`w-10 h-10 rounded-full items-center justify-center`,
                        { backgroundColor: progressColor + "20" },
                      ]}
                    >
                      <Ionicons
                        name={iconName}
                        size={18}
                        color={progressColor}
                      />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: DS.text,
                        }}
                      >
                        {saving.name}
                      </Text>
                      {saving.category && (
                        <Text
                          style={{
                            fontSize: 11,
                            color: DS.textMuted,
                          }}
                        >
                          {saving.category.charAt(0).toUpperCase() +
                            saving.category.slice(1)}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={tw`flex-row gap-2`}>
                    <TouchableOpacity
                      style={iconButton}
                      onPress={() =>
                        navigation.navigate("AddSavingsTransaction", {
                          savingsId: saving.id,
                          type: "deposit",
                        })
                      }
                    >
                      <Ionicons name="add" size={16} color={DS.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={iconButton}
                      onPress={() =>
                        navigation.navigate("AddSavings", {
                          editMode: true,
                          savingsData: saving,
                        })
                      }
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={16}
                        color={DS.accent}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={iconButton}
                      onPress={() => handleDelete(saving)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={DS.error}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Row 2: Progress */}
                <View style={tw`mb-3`}>
                  <View
                    style={tw`flex-row justify-between items-center mb-1`}
                  >
                    <Text style={{ fontSize: 12, color: DS.textSub }}>
                      {formatCurrency(current)} / {formatCurrency(target)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: isCompleted ? DS.success : DS.accent,
                      }}
                    >
                      {progress.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={progressTrack}>
                    <View
                      style={progressFill(
                        progressColor,
                        Math.min(progress, 100)
                      )}
                    />
                  </View>
                </View>

                {/* Row 3: Details */}
                <View style={tw`flex-row justify-between items-center`}>
                  <View>
                    <Text style={statLabel}>Sisa</Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: remaining > 0 ? DS.success : DS.error,
                      }}
                    >
                      {formatCurrency(remaining)}
                    </Text>
                  </View>
                  <View style={tw`items-end`}>
                    <Text style={statLabel}>Deadline</Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: saving.deadline ? DS.text : DS.textMuted,
                      }}
                    >
                      {formatDeadline(saving.deadline)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={badge(DS.accent)}
                    onPress={() =>
                      navigation.navigate("SavingsDetail", {
                        savingsId: saving.id,
                      })
                    }
                  >
                    <Text style={badgeText(DS.accent)}>Detail</Text>
                  </TouchableOpacity>
                </View>

                {/* Row 4: Status */}
                <View style={cardSeparator} />
                <View style={tw`flex-row justify-between items-center`}>
                  <View style={tw`flex-row items-center gap-1`}>
                    <Ionicons
                      name={
                        isCompleted ? "checkmark-circle" : "time"
                      }
                      size={14}
                      color={isCompleted ? DS.success : progressColor}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "500",
                        color: isCompleted ? DS.success : progressColor,
                      }}
                    >
                      {isCompleted
                        ? "Tercapai"
                        : progress >= 50
                        ? "Sedang berjalan"
                        : "Baru dimulai"}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: DS.textMuted }}>
                    Dibuat: {formatDateShort(saving.createdAt)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

export default SavingsScreen;
