import * as Haptics from "expo-haptics";
import {
  BorderTier,
  GamificationState,
  LevelProgress,
  LEVEL_TITLES,
  MILESTONES,
  MilestoneDefinition,
} from "../types/gamification";
import { calculateDailyCheckInStreak } from "./dailyCheckIn";
import { AppState } from "../types";

// ─── Level XP Calculations ───────────────────────────────────────────────────

/**
 * Returns XP required to go from `level` to `level + 1`.
 * Exponential RPG curve: 200 * level * (1.35 ^ level)
 */
export function getXpRequiredForLevel(level: number): number {
  if (level < 1) return 200;
  return Math.round(200 * level * Math.pow(1.35, level));
}

// Precompute cumulative XP thresholds up to level 50 for ultra-fast O(1) lookups
const MAX_PRECOMPUTED_LEVEL = 50;
const CUMULATIVE_XP_TABLE: number[] = [0]; // index = level - 1; CUMULATIVE_XP_TABLE[0] = 0 (lvl 1)

for (let lvl = 1; lvl <= MAX_PRECOMPUTED_LEVEL; lvl++) {
  const nextCumulative = CUMULATIVE_XP_TABLE[lvl - 1] + getXpRequiredForLevel(lvl);
  CUMULATIVE_XP_TABLE.push(nextCumulative);
}

/**
 * Returns the cumulative XP needed to reach a given level from level 1.
 */
export function getCumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level <= MAX_PRECOMPUTED_LEVEL + 1) {
    return CUMULATIVE_XP_TABLE[level - 1];
  }
  // Fallback for levels > 50
  let cumulative = CUMULATIVE_XP_TABLE[MAX_PRECOMPUTED_LEVEL];
  for (let lvl = MAX_PRECOMPUTED_LEVEL + 1; lvl < level; lvl++) {
    cumulative += getXpRequiredForLevel(lvl);
  }
  return cumulative;
}

/**
 * Determines current level based on total lifetime XP earned.
 */
export function getLevelFromTotalXp(totalXp: number): number {
  if (totalXp <= 0) return 1;

  for (let lvl = 1; lvl <= MAX_PRECOMPUTED_LEVEL; lvl++) {
    if (totalXp < CUMULATIVE_XP_TABLE[lvl]) {
      return lvl;
    }
  }

  // If beyond precomputed range
  let lvl = MAX_PRECOMPUTED_LEVEL + 1;
  while (totalXp >= getCumulativeXpForLevel(lvl + 1)) {
    lvl++;
  }
  return lvl;
}

/**
 * Returns the official title and tier for a given level.
 */
export function getLevelTitleAndTier(level: number): { title: string; tier: BorderTier } {
  let matched = LEVEL_TITLES[0];
  for (const item of LEVEL_TITLES) {
    if (level >= item.minLevel) {
      matched = item;
    } else {
      break;
    }
  }
  return { title: matched.title, tier: matched.tier };
}

/**
 * Detailed progress information for the current level.
 */
export function getLevelProgress(totalXp: number): LevelProgress {
  const safeTotalXp = Math.max(0, Math.floor(totalXp || 0));
  const level = getLevelFromTotalXp(safeTotalXp);
  const { title, tier } = getLevelTitleAndTier(level);

  const currentLevelBaseXp = getCumulativeXpForLevel(level);
  const nextLevelBaseXp = getCumulativeXpForLevel(level + 1);
  const xpNeededForNext = nextLevelBaseXp - currentLevelBaseXp;
  const currentLevelXp = safeTotalXp - currentLevelBaseXp;

  const percent = xpNeededForNext > 0
    ? Math.min(1, Math.max(0, currentLevelXp / xpNeededForNext))
    : 1;

  return {
    level,
    title,
    currentLevelXp,
    xpNeededForNext,
    percent,
    totalXp: safeTotalXp,
    borderTier: tier,
  };
}

// ─── Border & Avatar Aesthetics ──────────────────────────────────────────────

export interface TierTheme {
  primary: string;
  secondary: string;
  gradient: readonly [string, string, ...string[]];
  badgeBg: string;
  badgeText: string;
  glowColor: string;
  label: string;
}

export function getTierTheme(tier: BorderTier): TierTheme {
  switch (tier) {
    case "bronze":
      return {
        primary: "#B45309",
        secondary: "#78350F",
        gradient: ["#D97706", "#B45309", "#92400E"],
        badgeBg: "#78350F",
        badgeText: "#FEF3C7",
        glowColor: "rgba(217, 119, 6, 0.25)",
        label: "Pemula (Bronze)",
      };
    case "silver":
      return {
        primary: "#94A3B8",
        secondary: "#475569",
        gradient: ["#CBD5E1", "#94A3B8", "#64748B"],
        badgeBg: "#334155",
        badgeText: "#F8FAFC",
        glowColor: "rgba(148, 163, 184, 0.3)",
        label: "Disiplin (Silver)",
      };
    case "gold":
      return {
        primary: "#F59E0B",
        secondary: "#B45309",
        gradient: ["#FDE047", "#F59E0B", "#D97706"],
        badgeBg: "#78350F",
        badgeText: "#FEF08A",
        glowColor: "rgba(245, 158, 11, 0.4)",
        label: "Ahli (Gold)",
      };
    case "emerald":
      return {
        primary: "#10B981",
        secondary: "#047857",
        gradient: ["#6EE7B7", "#10B981", "#059669"],
        badgeBg: "#064E3B",
        badgeText: "#D1FAE5",
        glowColor: "rgba(16, 185, 129, 0.4)",
        label: "Master (Emerald)",
      };
    case "ruby":
      return {
        primary: "#F43F5E",
        secondary: "#BE123C",
        gradient: ["#FDA4AF", "#F43F5E", "#BE123C"],
        badgeBg: "#881337",
        badgeText: "#FFE4E6",
        glowColor: "rgba(244, 63, 94, 0.45)",
        label: "Grandmaster (Ruby)",
      };
    case "rainbow":
    default:
      return {
        primary: "#8B5CF6",
        secondary: "#EC4899",
        gradient: ["#EC4899", "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B"],
        badgeBg: "#1E1B4B",
        badgeText: "#FDF2F8",
        glowColor: "rgba(139, 92, 246, 0.5)",
        label: "Sultan Legendaris (Rainbow)",
      };
  }
}

// ─── Milestone Condition Evaluator ──────────────────────────────────────────

/**
 * Checks if a milestone condition has been met.
 */
export function isMilestoneUnlocked(
  milestone: MilestoneDefinition,
  appState: AppState | null,
  gamificationState: GamificationState
): boolean {
  if (!appState) return false;

  const txCount = appState.transactions ? appState.transactions.length : 0;
  const streak = calculateDailyCheckInStreak(appState.dailyCheckIns || []);

  switch (milestone.id) {
    case "m_first_tx":
      return txCount >= 1;
    case "m_10tx":
      return txCount >= 10;
    case "m_50tx":
      return txCount >= 50;
    case "m_100tx":
      return txCount >= 100;
    case "m_first_savings":
      return (appState.savings || []).length >= 1;
    case "m_savings_100":
      return (appState.savings || []).some(
        (s) => (s.target || 0) > 0 && (s.current || 0) >= (s.target || 0)
      );
    case "m_streak_7":
      return streak >= 7;
    case "m_streak_30":
      return streak >= 30;
    case "m_level_5":
      return gamificationState.level >= 5;
    case "m_level_10":
      return gamificationState.level >= 10;
    case "m_debt_cleared":
      return (appState.debts || []).some((d) => d.status === "paid" || d.remaining === 0);
    case "m_report_pdf":
      // Unlocked if claimed or manually triggered via event
      return gamificationState.claimedMilestoneIds.includes("m_report_pdf");
    default:
      return false;
  }
}

/**
 * Returns list of milestones that are met but NOT yet claimed by user.
 */
export function getClaimableMilestones(
  appState: AppState | null,
  gamificationState: GamificationState
): MilestoneDefinition[] {
  return MILESTONES.filter((m) => {
    const isClaimed = gamificationState.claimedMilestoneIds.includes(m.id);
    if (isClaimed) return false;
    return isMilestoneUnlocked(m, appState, gamificationState);
  });
}

// ─── Haptics Trigger Helpers ────────────────────────────────────────────────

export async function triggerHaptic(
  type: "light" | "medium" | "heavy" | "success" | "warning" = "light"
) {
  try {
    switch (type) {
      case "light":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "heavy":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case "success":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "warning":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
    }
  } catch {
    // Ignore haptic errors on platforms/devices that do not support it
  }
}
