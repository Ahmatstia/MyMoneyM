import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useGamification } from "../../context/GamificationContext";
import { useAppContext } from "../../context/AppContext";
import { useTheme } from "../../theme/ThemeContext";
import {
  MILESTONES,
  MilestoneDefinition,
  AccessoryId,
} from "../../types/gamification";
import { isMilestoneUnlocked } from "../../utils/gamificationEngine";
import { CatMascotSvg } from "../Mascot/CatMascotSvg";

interface MilestoneClaimModalProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = "all" | "claimable" | "wardrobe";

export const MilestoneClaimModal: React.FC<MilestoneClaimModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors } = useTheme();
  const { state: appState } = useAppContext();
  const {
    state: game,
    claimMilestone,
    equipAccessory,
    claimableMilestones,
  } = useGamification();

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [justClaimedReward, setJustClaimedReward] = useState<MilestoneDefinition | null>(
    null
  );

  // ─── Filtered Milestones ───────────────────────────────────────────────────
  const displayMilestones = useMemo(() => {
    if (activeTab === "claimable") {
      return claimableMilestones;
    }
    return MILESTONES;
  }, [activeTab, claimableMilestones]);

  const handleClaim = async (milestone: MilestoneDefinition) => {
    const success = await claimMilestone(milestone.id);
    if (success) {
      setJustClaimedReward(milestone);
    }
  };

  // ─── Accessory Catalog for Wardrobe ─────────────────────────────────────────
  const accessoryList: { id: AccessoryId; name: string; icon: string }[] = [
    { id: "none", name: "Tanpa Aksesoris", icon: "close-circle-outline" },
    { id: "bell", name: "Lonceng Emas 🔔", icon: "notifications-outline" },
    { id: "sunglasses", name: "Kacamata Hitam 😎", icon: "glasses-outline" },
    { id: "bow", name: "Pita Emas 🎀", icon: "gift-outline" },
    { id: "chef_hat", name: "Topi Koki 👨‍🍳", icon: "restaurant-outline" },
    { id: "crown", name: "Mahkota Emas 👑", icon: "trophy-outline" },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* ─── Top Header Bar ────────────────────────────────────────── */}
        <View
          style={[
            styles.headerBar,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.borderLight,
            },
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.backButton}
          >
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Pusat Pencapaian 🏆
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
              Klaim hadiah eksklusif & aksesoris Moni
            </Text>
          </View>

          <View style={{ width: 32 }} />
        </View>

        {/* ─── Filter Tabs ───────────────────────────────────────────── */}
        <View
          style={[
            styles.tabContainer,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.borderLight,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("all")}
            style={[
              styles.tabButton,
              activeTab === "all" && {
                borderBottomColor: colors.accent,
                borderBottomWidth: 3,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "all"
                      ? colors.accent
                      : colors.textSecondary,
                  fontWeight: activeTab === "all" ? "700" : "500",
                },
              ]}
            >
              Semua ({MILESTONES.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("claimable")}
            style={[
              styles.tabButton,
              activeTab === "claimable" && {
                borderBottomColor: colors.accent,
                borderBottomWidth: 3,
              },
            ]}
          >
            <View style={styles.claimTabBadge}>
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "claimable"
                        ? colors.accent
                        : colors.textSecondary,
                    fontWeight: activeTab === "claimable" ? "700" : "500",
                  },
                ]}
              >
                Bisa Diklaim
              </Text>
              {claimableMilestones.length > 0 && (
                <View style={styles.claimCounterBadge}>
                  <Text style={styles.claimCounterText}>
                    {claimableMilestones.length}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("wardrobe")}
            style={[
              styles.tabButton,
              activeTab === "wardrobe" && {
                borderBottomColor: colors.accent,
                borderBottomWidth: 3,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "wardrobe"
                      ? colors.accent
                      : colors.textSecondary,
                  fontWeight: activeTab === "wardrobe" ? "700" : "500",
                },
              ]}
            >
              Lemari Moni 👔
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── Content Area ──────────────────────────────────────────── */}
        {activeTab === "wardrobe" ? (
          // ─── WARDROBE TAB ───────────────────────────────────────────
          <ScrollView
            contentContainerStyle={styles.wardrobeContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.wardrobePreviewCard}>
              <LinearGradient
                colors={[colors.surface, colors.surfaceLight]}
                style={[
                  styles.wardrobeMascotBox,
                  { borderColor: colors.borderLight },
                ]}
              >
                <CatMascotSvg
                  mood="happy"
                  accessory={game.equippedAccessory}
                  size={140}
                />
                <Text
                  style={[
                    styles.equippedLabel,
                    { color: colors.textPrimary },
                  ]}
                >
                  Sedang Dipakai:{" "}
                  {accessoryList.find((a) => a.id === game.equippedAccessory)
                    ?.name || "Tanpa Aksesoris"}
                </Text>
              </LinearGradient>
            </View>

            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Koleksi Aksesoris Kamu
            </Text>

            <View style={styles.accessoryGrid}>
              {accessoryList.map((item) => {
                const isUnlocked =
                  item.id === "none" ||
                  game.unlockedAccessories.includes(item.id);
                const isEquipped = game.equippedAccessory === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    disabled={!isUnlocked}
                    onPress={() => equipAccessory(item.id)}
                    style={[
                      styles.accessoryItem,
                      {
                        backgroundColor: colors.surface,
                        borderColor: isEquipped
                          ? colors.accent
                          : colors.borderLight,
                        borderWidth: isEquipped ? 2 : 1,
                        opacity: isUnlocked ? 1 : 0.45,
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={28}
                      color={
                        isEquipped
                          ? colors.accent
                          : isUnlocked
                          ? colors.textPrimary
                          : colors.textTertiary
                      }
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.accessoryItemName,
                        {
                          color: isEquipped
                            ? colors.accent
                            : colors.textPrimary,
                        },
                      ]}
                    >
                      {item.name}
                    </Text>

                    {isEquipped ? (
                      <View style={styles.equippedPill}>
                        <Text style={styles.equippedPillText}>Dipakai</Text>
                      </View>
                    ) : !isUnlocked ? (
                      <View style={styles.lockedPill}>
                        <Ionicons name="lock-closed" size={10} color="#94A3B8" />
                        <Text style={styles.lockedPillText}>Terkunci</Text>
                      </View>
                    ) : (
                      <Text
                        style={[
                          styles.equipActionText,
                          { color: colors.accent },
                        ]}
                      >
                        Gunakan
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          // ─── MILESTONE LIST TAB ─────────────────────────────────────
          <FlatList
            data={displayMilestones}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={56}
                  color={colors.textTertiary}
                />
                <Text
                  style={[styles.emptyText, { color: colors.textSecondary }]}
                >
                  Semua hadiah yang tercapai sudah diklaim!
                </Text>
                <Text
                  style={[styles.emptySubtext, { color: colors.textTertiary }]}
                >
                  Terus catat transaksi & disiplin finansial untuk membuka lebih
                  banyak lagi.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isClaimed = game.claimedMilestoneIds.includes(item.id);
              const isUnlocked = isMilestoneUnlocked(item, appState, game);
              const canClaim = isUnlocked && !isClaimed;

              return (
                <View
                  style={[
                    styles.milestoneCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: canClaim
                        ? "#F59E0B"
                        : colors.borderLight,
                      borderWidth: canClaim ? 1.5 : 1,
                    },
                  ]}
                >
                  {/* Left Icon */}
                  <View
                    style={[
                      styles.milestoneIconBox,
                      {
                        backgroundColor: canClaim
                          ? "rgba(245, 158, 11, 0.15)"
                          : isClaimed
                          ? "rgba(16, 185, 129, 0.12)"
                          : colors.surfaceLight,
                      },
                    ]}
                  >
                    {item.iconFamily === "MaterialCommunityIcons" ? (
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={24}
                        color={
                          canClaim
                            ? "#F59E0B"
                            : isClaimed
                            ? "#10B981"
                            : colors.textTertiary
                        }
                      />
                    ) : (
                      <Ionicons
                        name={item.icon as any}
                        size={24}
                        color={
                          canClaim
                            ? "#F59E0B"
                            : isClaimed
                            ? "#10B981"
                            : colors.textTertiary
                        }
                      />
                    )}
                  </View>

                  {/* Middle Info */}
                  <View style={styles.milestoneContent}>
                    <Text
                      style={[
                        styles.milestoneTitle,
                        { color: colors.textPrimary },
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.milestoneDesc,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.description}
                    </Text>

                    {/* Reward Tag */}
                    <View style={styles.rewardTag}>
                      <Ionicons name="gift-outline" size={11} color="#CA8A04" />
                      <Text style={styles.rewardTagText}>
                        {item.rewardLabel} (+{item.xpBonus} XP)
                      </Text>
                    </View>
                  </View>

                  {/* Right Action Button */}
                  <View style={styles.actionColumn}>
                    {isClaimed ? (
                      <View style={styles.claimedBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={15}
                          color="#10B981"
                        />
                        <Text style={styles.claimedText}>Klaim</Text>
                      </View>
                    ) : canClaim ? (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleClaim(item)}
                        style={styles.claimButton}
                      >
                        <LinearGradient
                          colors={["#F59E0B", "#D97706"]}
                          style={styles.claimButtonGradient}
                        >
                          <Ionicons name="gift" size={13} color="#FFFFFF" />
                          <Text style={styles.claimButtonText}>KLAIM</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.lockedBadge}>
                        <Ionicons
                          name="lock-closed"
                          size={14}
                          color={colors.textTertiary}
                        />
                      </View>
                    )}
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* ─── Just Claimed Congratulation Popup ─────────────────────── */}
        {justClaimedReward && (
          <Modal transparent animationType="fade" visible={!!justClaimedReward} statusBarTranslucent={true}>
            <View style={styles.rewardBackdrop}>
              <View
                style={[
                  styles.rewardCard,
                  { backgroundColor: colors.surface, borderColor: "#F59E0B" },
                ]}
              >
                <Ionicons name="sparkles" size={38} color="#F59E0B" />
                <Text
                  style={[
                    styles.rewardCongratsTitle,
                    { color: colors.textPrimary },
                  ]}
                >
                  Hadiah Diklaim! 🎉
                </Text>
                <Text
                  style={[
                    styles.rewardCongratsName,
                    { color: colors.accent },
                  ]}
                >
                  {justClaimedReward.rewardLabel}
                </Text>
                <Text
                  style={[styles.rewardXpBonus, { color: "#10B981" }]}
                >
                  +{justClaimedReward.xpBonus} XP Ditambahkan ke Akunmu!
                </Text>

                {justClaimedReward.rewardType === "accessory" && (
                  <TouchableOpacity
                    onPress={() => {
                      equipAccessory(
                        justClaimedReward.rewardValue as AccessoryId
                      );
                      setJustClaimedReward(null);
                    }}
                    style={styles.equipNowButton}
                  >
                    <Text style={styles.equipNowText}>
                      Langsung Pakaikan ke Moni! 🐾
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => setJustClaimedReward(null)}
                  style={[
                    styles.closeRewardButton,
                    { backgroundColor: colors.surfaceLight },
                  ]}
                >
                  <Text
                    style={[
                      styles.closeRewardText,
                      { color: colors.textPrimary },
                    ]}
                  >
                    Tutup
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 13,
  },
  claimTabBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  claimCounterBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 9,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  claimCounterText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 18,
  },
  milestoneCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    gap: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  milestoneIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  milestoneDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  rewardTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  rewardTagText: {
    color: "#F59E0B",
    fontSize: 11,
    fontWeight: "600",
  },
  actionColumn: {
    alignItems: "center",
    justifyContent: "center",
  },
  claimedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  claimedText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "700",
  },
  claimButton: {
    borderRadius: 10,
    overflow: "hidden",
    elevation: 3,
  },
  claimButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  claimButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  lockedBadge: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  wardrobeContainer: {
    padding: 16,
  },
  wardrobePreviewCard: {
    alignItems: "center",
    marginBottom: 20,
  },
  wardrobeMascotBox: {
    width: "100%",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
  },
  equippedLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  accessoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  accessoryItem: {
    width: "48%",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  accessoryItemName: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },
  equippedPill: {
    marginTop: 8,
    backgroundColor: "#3B82F6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  equippedPillText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  lockedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 8,
  },
  lockedPillText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "600",
  },
  equipActionText: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "700",
  },
  rewardBackdrop: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  rewardCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    elevation: 8,
  },
  rewardCongratsTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 10,
  },
  rewardCongratsName: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },
  rewardXpBonus: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 8,
  },
  equipNowButton: {
    marginTop: 18,
    backgroundColor: "#F59E0B",
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  equipNowText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  closeRewardButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  closeRewardText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
