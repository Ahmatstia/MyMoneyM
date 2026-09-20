import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AccessoryId,
  DEFAULT_GAMIFICATION_STATE,
  GamificationState,
  LevelProgress,
  MILESTONES,
  MilestoneDefinition,
  XpSourceKey,
  XP_REWARDS,
} from "../types/gamification";
import {
  getLevelFromTotalXp,
  getLevelProgress,
  getLevelTitleAndTier,
  getClaimableMilestones,
  triggerHaptic,
} from "../utils/gamificationEngine";
import { gamificationBus } from "../utils/gamificationBus";
import { useAppContext } from "./AppContext";
import { getJakartaDateKey } from "../utils/dailyCheckIn";

const STORAGE_KEY = "@mymoney_gamification_v2";

interface GamificationContextType {
  state: GamificationState;
  progress: LevelProgress;
  claimableMilestones: MilestoneDefinition[];
  isLoading: boolean;
  awardXp: (
    source: XpSourceKey,
    customXp?: number,
    label?: string
  ) => Promise<{ earned: number; didLevelUp: boolean }>;
  claimMilestone: (milestoneId: string) => Promise<boolean>;
  equipAccessory: (accessoryId: AccessoryId) => Promise<void>;
  dismissLevelUp: () => void;
  petMoni: () => Promise<{
    success: boolean;
    xpEarned: number;
    remainingPets: number;
    message: string;
  }>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(
  undefined
);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { state: appState } = useAppContext();
  const [gamificationState, setGamificationState] = useState<GamificationState>(
    DEFAULT_GAMIFICATION_STATE
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Keep a ref to avoid stale closures in event bus listener
  const stateRef = useRef(gamificationState);
  stateRef.current = gamificationState;

  // ─── 1. Load Initial State from Storage ─────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const loadState = async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json && isMounted) {
          const parsed = JSON.parse(json);
          // Cleanly merge with default state to guarantee schema validity
          const merged: GamificationState = {
            ...DEFAULT_GAMIFICATION_STATE,
            ...parsed,
            level: getLevelFromTotalXp(parsed.totalXp || 0),
          };
          setGamificationState(merged);
        }
      } catch (e) {
        console.warn("[GamificationContext] Error loading state:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadState();

    return () => {
      isMounted = false;
    };
  }, []);

  // ─── 2. Persist Helper ──────────────────────────────────────────────────────
  const persistState = async (newState: GamificationState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.warn("[GamificationContext] Error saving state:", e);
    }
  };

  // ─── 3. Award XP Core Function ──────────────────────────────────────────────
  const awardXp = useCallback(
    async (
      source: XpSourceKey,
      customXp?: number,
      _label?: string
    ): Promise<{ earned: number; didLevelUp: boolean }> => {
      const current = stateRef.current;
      const today = getJakartaDateKey();

      // Check specific cooldowns
      if (source === "daily_checkin") {
        if (current.lastCheckInRewardedDate === today) {
          return { earned: 0, didLevelUp: false };
        }
      }

      const rewardInfo = XP_REWARDS[source];
      const xpToAdd = customXp !== undefined ? customXp : rewardInfo?.xp || 10;
      if (xpToAdd <= 0) return { earned: 0, didLevelUp: false };

      const newTotalXp = current.totalXp + xpToAdd;
      const oldLevel = current.level;
      const newLevel = getLevelFromTotalXp(newTotalXp);
      const didLevelUp = newLevel > oldLevel;

      let newPending = current.pendingLevelUp;
      if (didLevelUp) {
        const { title } = getLevelTitleAndTier(newLevel);
        newPending = {
          oldLevel,
          newLevel,
          unlockedTitle: title,
        };
        // Haptic fanfare for level up
        triggerHaptic("success");
      } else {
        triggerHaptic("light");
      }

      const updatedState: GamificationState = {
        ...current,
        totalXp: newTotalXp,
        level: newLevel,
        lastCheckInRewardedDate:
          source === "daily_checkin" ? today : current.lastCheckInRewardedDate,
        pendingLevelUp: newPending,
        updatedAt: new Date().toISOString(),
      };

      setGamificationState(updatedState);
      await persistState(updatedState);

      return { earned: xpToAdd, didLevelUp };
    },
    []
  );

  // ─── 4. Pet Moni Function (HomeScreen interaction) ──────────────────────────
  const petMoni = useCallback(async () => {
    const current = stateRef.current;
    const today = getJakartaDateKey();

    const isNewDay = current.lastPetDate !== today;
    const petCount = isNewDay ? 0 : current.petCountToday;

    const MAX_DAILY_PETS = 5;
    if (petCount >= MAX_DAILY_PETS) {
      triggerHaptic("warning");
      return {
        success: false,
        xpEarned: 0,
        remainingPets: 0,
        message: "Moni sudah kenyang elusan hari ini! Purrr~ 🐱💤",
      };
    }

    const newPetCount = petCount + 1;
    const xpPerPet = XP_REWARDS.pet_moni.xp;
    const newTotalXp = current.totalXp + xpPerPet;
    const oldLevel = current.level;
    const newLevel = getLevelFromTotalXp(newTotalXp);
    const didLevelUp = newLevel > oldLevel;

    let newPending = current.pendingLevelUp;
    if (didLevelUp) {
      const { title } = getLevelTitleAndTier(newLevel);
      newPending = {
        oldLevel,
        newLevel,
        unlockedTitle: title,
      };
      triggerHaptic("success");
    } else {
      triggerHaptic("medium");
    }

    const updatedState: GamificationState = {
      ...current,
      totalXp: newTotalXp,
      level: newLevel,
      petCountToday: newPetCount,
      lastPetDate: today,
      pendingLevelUp: newPending,
      updatedAt: new Date().toISOString(),
    };

    setGamificationState(updatedState);
    await persistState(updatedState);

    const purrMessages = [
      "Purrr~ Moni senang sekali! ✨",
      "Meow! Moni makin sayang sama kamu! 💖",
      "Ngeong~ Elusanmu bikin Moni semangat berhemat! 🐾",
      "Purrrr... Terasa hangat! 🌟",
      "Moni mendengkur puas! Nyaaa~ 😻",
    ];
    const message = purrMessages[(newPetCount - 1) % purrMessages.length];

    return {
      success: true,
      xpEarned: xpPerPet,
      remainingPets: MAX_DAILY_PETS - newPetCount,
      message,
    };
  }, []);

  // ─── 5. Claim Milestone Function ───────────────────────────────────────────
  const claimMilestone = useCallback(
    async (milestoneId: string): Promise<boolean> => {
      const current = stateRef.current;
      if (current.claimedMilestoneIds.includes(milestoneId)) {
        return false; // Already claimed
      }

      const milestone = MILESTONES.find((m) => m.id === milestoneId);
      if (!milestone) return false;

      const newClaimed = [...current.claimedMilestoneIds, milestoneId];
      const newUnlockedAccessories = [...current.unlockedAccessories];

      if (
        milestone.rewardType === "accessory" &&
        !newUnlockedAccessories.includes(milestone.rewardValue as AccessoryId)
      ) {
        newUnlockedAccessories.push(milestone.rewardValue as AccessoryId);
      }

      // Award bonus XP if milestone provides one
      const bonusXp = milestone.xpBonus || 0;
      const newTotalXp = current.totalXp + bonusXp;
      const oldLevel = current.level;
      const newLevel = getLevelFromTotalXp(newTotalXp);
      const didLevelUp = newLevel > oldLevel;

      let newPending = current.pendingLevelUp;
      if (didLevelUp) {
        const { title } = getLevelTitleAndTier(newLevel);
        newPending = {
          oldLevel,
          newLevel,
          unlockedTitle: title,
        };
      }

      triggerHaptic("success");

      const updatedState: GamificationState = {
        ...current,
        totalXp: newTotalXp,
        level: newLevel,
        claimedMilestoneIds: newClaimed,
        unlockedAccessories: newUnlockedAccessories,
        pendingLevelUp: newPending,
        updatedAt: new Date().toISOString(),
      };

      setGamificationState(updatedState);
      await persistState(updatedState);

      return true;
    },
    []
  );

  // ─── 6. Equip Accessory ─────────────────────────────────────────────────────
  const equipAccessory = useCallback(async (accessoryId: AccessoryId) => {
    const current = stateRef.current;
    if (!current.unlockedAccessories.includes(accessoryId) && accessoryId !== "none") {
      return;
    }

    triggerHaptic("light");
    const updatedState: GamificationState = {
      ...current,
      equippedAccessory: accessoryId,
      updatedAt: new Date().toISOString(),
    };

    setGamificationState(updatedState);
    await persistState(updatedState);
  }, []);

  // ─── 7. Dismiss Level Up Modal ──────────────────────────────────────────────
  const dismissLevelUp = useCallback(() => {
    setGamificationState((prev) => {
      const updated = { ...prev, pendingLevelUp: null };
      persistState(updated);
      return updated;
    });
  }, []);

  // ─── 8. Connect to GamificationBus (Decoupled Pub/Sub) ──────────────────────
  useEffect(() => {
    const unsubscribe = gamificationBus.subscribe(async (event) => {
      if (event.type === "award") {
        await awardXp(event.source, event.customXp, event.label);
      }
    });

    return unsubscribe;
  }, [awardXp]);

  // ─── 9. Reactive Progress & Claimable Milestones ────────────────────────────
  const progress = useMemo(() => {
    return getLevelProgress(gamificationState.totalXp);
  }, [gamificationState.totalXp]);

  const claimableMilestones = useMemo(() => {
    return getClaimableMilestones(appState, gamificationState);
  }, [appState, gamificationState]);

  const value = useMemo(
    () => ({
      state: gamificationState,
      progress,
      claimableMilestones,
      isLoading,
      awardXp,
      claimMilestone,
      equipAccessory,
      dismissLevelUp,
      petMoni,
    }),
    [
      gamificationState,
      progress,
      claimableMilestones,
      isLoading,
      awardXp,
      claimMilestone,
      equipAccessory,
      dismissLevelUp,
      petMoni,
    ]
  );

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = (): GamificationContextType => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error("useGamification must be used within a GamificationProvider");
  }
  return context;
};
