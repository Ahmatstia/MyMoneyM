// ─── Gamification Types & Constants ───────────────────────────────────────────

export type XpSourceKey =
  | "transaction"
  | "savings_created"
  | "savings_deposit"
  | "savings_completed"
  | "debt_recorded"
  | "debt_cleared"
  | "budget_created"
  | "budget_adhered"
  | "daily_checkin"
  | "streak_7"
  | "streak_30"
  | "pet_moni"
  | "report_exported";

export type AccessoryId =
  | "none"
  | "bell"
  | "sunglasses"
  | "bow"
  | "chef_hat"
  | "crown";

export type BorderTier =
  | "bronze"    // Level 1-4: Pemula
  | "silver"    // Level 5-9: Disiplin
  | "gold"      // Level 10-14: Ahli
  | "emerald"   // Level 15-19: Master
  | "ruby"      // Level 20-24: Grandmaster
  | "rainbow";  // Level 25+: Sultan Legendaris (Pelangi berkilau)

export type CatMood =
  | "happy"     // Finansial sehat, tabungan bertambah
  | "playful"   // Baru saja dielus / berinteraksi
  | "sleepy"    // Jam malam (22:00 - 05:00)
  | "proud"     // Selesai target tabungan / lunas hutang
  | "worried"   // Pengeluaran mendekati atau lewat batas anggaran
  | "celebrate"; // Baru saja naik level

export type MilestoneRewardType = "badge" | "accessory" | "border_title";

export interface MilestoneDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconFamily: "Ionicons" | "MaterialCommunityIcons";
  category: "transaction" | "savings" | "discipline" | "streak" | "level";
  rewardType: MilestoneRewardType;
  rewardValue: string; // e.g. "sunglasses" for accessory
  rewardLabel: string;
  xpBonus: number;
}

export interface GamificationState {
  totalXp: number;
  level: number;
  claimedMilestoneIds: string[];
  unlockedAccessories: AccessoryId[];
  equippedAccessory: AccessoryId;
  petCountToday: number;
  lastPetDate: string; // YYYY-MM-DD
  lastCheckInRewardedDate: string; // YYYY-MM-DD
  pendingLevelUp: {
    oldLevel: number;
    newLevel: number;
    unlockedTitle: string;
  } | null;
  updatedAt: string;
}

export interface LevelProgress {
  level: number;
  title: string;
  currentLevelXp: number;
  xpNeededForNext: number;
  percent: number; // 0 to 1
  totalXp: number;
  borderTier: BorderTier;
}

export interface LevelInfo {
  level: number;
  title: string;
  minCumulativeXp: number;
  borderTier: BorderTier;
}

// ─── Default Gamification State ──────────────────────────────────────────────
export const DEFAULT_GAMIFICATION_STATE: GamificationState = {
  totalXp: 0,
  level: 1,
  claimedMilestoneIds: [],
  unlockedAccessories: ["none"],
  equippedAccessory: "none",
  petCountToday: 0,
  lastPetDate: "",
  lastCheckInRewardedDate: "",
  pendingLevelUp: null,
  updatedAt: new Date().toISOString(),
};

// ─── XP Rewards per Event ───────────────────────────────────────────────────
export const XP_REWARDS: Record<XpSourceKey, { xp: number; label: string }> = {
  transaction: { xp: 15, label: "Catat Transaksi" },
  savings_created: { xp: 40, label: "Target Tabungan Baru" },
  savings_deposit: { xp: 20, label: "Setor Tabungan" },
  savings_completed: { xp: 200, label: "Target Tabungan Tercapai! 🎉" },
  debt_recorded: { xp: 25, label: "Catat Hutang/Piutang" },
  debt_cleared: { xp: 100, label: "Hutang Lunas! 🥳" },
  budget_created: { xp: 30, label: "Buat Anggaran Kategori" },
  budget_adhered: { xp: 80, label: "Disiplin Anggaran Bulanan" },
  daily_checkin: { xp: 10, label: "Check-in Harian" },
  streak_7: { xp: 150, label: "Streak 7 Hari Disiplin 🔥" },
  streak_30: { xp: 500, label: "Streak 30 Hari Luar Biasa 🏆" },
  pet_moni: { xp: 5, label: "Elus Moni si Kucing 🐱" },
  report_exported: { xp: 30, label: "Ekspor Rapor Finansial 📊" },
};

// ─── Official Titles ────────────────────────────────────────────────────────
export const LEVEL_TITLES: { minLevel: number; title: string; tier: BorderTier }[] = [
  { minLevel: 1, title: "🐱 Kucing Baru Lahir", tier: "bronze" },
  { minLevel: 3, title: "💸 Murid Dompet", tier: "bronze" },
  { minLevel: 5, title: "🏷️ Pemburu Diskon", tier: "silver" },
  { minLevel: 8, title: "📒 Pencatat Rajin", tier: "silver" },
  { minLevel: 10, title: "⚔️ Penjaga Keuangan", tier: "gold" },
  { minLevel: 13, title: "🎯 Ahli Strategi", tier: "gold" },
  { minLevel: 15, title: "🧠 Analis Mandiri", tier: "emerald" },
  { minLevel: 18, title: "💎 Kolektor Cuan", tier: "emerald" },
  { minLevel: 20, title: "👑 Sultan Finansial", tier: "ruby" },
  { minLevel: 25, title: "🌟 Legenda Dompet", tier: "rainbow" },
  { minLevel: 30, title: "🏆 Grandmaster MyMoney", tier: "rainbow" },
];

// ─── Milestone Definitions ──────────────────────────────────────────────────
export const MILESTONES: MilestoneDefinition[] = [
  {
    id: "m_first_tx",
    title: "Langkah Awal 🐾",
    description: "Catat transaksi pertamamu di MyMoney.",
    icon: "receipt-outline",
    iconFamily: "Ionicons",
    category: "transaction",
    rewardType: "badge",
    rewardValue: "badge_first_tx",
    rewardLabel: "Lencana: Baby Steps 🐾",
    xpBonus: 50,
  },
  {
    id: "m_10tx",
    title: "Mulai Terbiasa 🔔",
    description: "Catat 10 transaksi finansial.",
    icon: "notifications-outline",
    iconFamily: "Ionicons",
    category: "transaction",
    rewardType: "accessory",
    rewardValue: "bell",
    rewardLabel: "Aksesoris: Lonceng Moni 🔔",
    xpBonus: 80,
  },
  {
    id: "m_50tx",
    title: "Gaya Keren 😎",
    description: "Catat 50 transaksi finansial.",
    icon: "glasses-outline",
    iconFamily: "Ionicons",
    category: "transaction",
    rewardType: "accessory",
    rewardValue: "sunglasses",
    rewardLabel: "Aksesoris: Kacamata Hitam 😎",
    xpBonus: 150,
  },
  {
    id: "m_100tx",
    title: "Pencatat Sejati 💯",
    description: "Catat 100 transaksi finansial.",
    icon: "shield-checkmark-outline",
    iconFamily: "Ionicons",
    category: "transaction",
    rewardType: "border_title",
    rewardValue: "border_centurion",
    rewardLabel: "Gelar: Sang Centurion 💯",
    xpBonus: 300,
  },
  {
    id: "m_first_savings",
    title: "Mimpi Pertama 💭",
    description: "Buat target tabungan pertamamu.",
    icon: "wallet-outline",
    iconFamily: "Ionicons",
    category: "savings",
    rewardType: "badge",
    rewardValue: "badge_first_savings",
    rewardLabel: "Lencana: Pemimpi Bijak 💭",
    xpBonus: 60,
  },
  {
    id: "m_savings_100",
    title: "Misi Terwujud! 🎀",
    description: "Selesaikan 1 target tabungan hingga 100%.",
    icon: "gift-outline",
    iconFamily: "Ionicons",
    category: "savings",
    rewardType: "accessory",
    rewardValue: "bow",
    rewardLabel: "Aksesoris: Pita Emas Moni 🎀",
    xpBonus: 250,
  },
  {
    id: "m_streak_7",
    title: "Seminggu Konsisten 🔥",
    description: "Capai streak check-in 7 hari berturut-turut.",
    icon: "flame-outline",
    iconFamily: "Ionicons",
    category: "streak",
    rewardType: "badge",
    rewardValue: "badge_streak_7",
    rewardLabel: "Lencana: Api Konsisten 🔥",
    xpBonus: 150,
  },
  {
    id: "m_streak_30",
    title: "Disiplin Baja ⚡",
    description: "Capai streak check-in 30 hari berturut-turut.",
    icon: "flash-outline",
    iconFamily: "Ionicons",
    category: "streak",
    rewardType: "border_title",
    rewardValue: "border_master_streak",
    rewardLabel: "Gelar: Disiplin Baja ⚡",
    xpBonus: 500,
  },
  {
    id: "m_level_5",
    title: "Koki Anggaran 👨‍🍳",
    description: "Capai Level 5 dalam perjalanan finansialmu.",
    icon: "restaurant-outline",
    iconFamily: "Ionicons",
    category: "level",
    rewardType: "accessory",
    rewardValue: "chef_hat",
    rewardLabel: "Aksesoris: Topi Koki Moni 👨‍🍳",
    xpBonus: 200,
  },
  {
    id: "m_level_10",
    title: "Mahkota Keuangan 👑",
    description: "Capai Level 10: Penjaga Keuangan.",
    icon: "crown-outline",
    iconFamily: "MaterialCommunityIcons",
    category: "level",
    rewardType: "accessory",
    rewardValue: "crown",
    rewardLabel: "Aksesoris: Mahkota Emas Moni 👑",
    xpBonus: 500,
  },
  {
    id: "m_debt_cleared",
    title: "Bebas Merdeka! 💪",
    description: "Lunasi 1 catatan hutang secara tuntas.",
    icon: "lock-open-outline",
    iconFamily: "Ionicons",
    category: "discipline",
    rewardType: "badge",
    rewardValue: "badge_debt_free",
    rewardLabel: "Lencana: Bebas Beban 💪",
    xpBonus: 150,
  },
  {
    id: "m_report_pdf",
    title: "Rapor Eksekutif 📊",
    description: "Ekspor laporan transaksi PDF.",
    icon: "document-text-outline",
    iconFamily: "Ionicons",
    category: "discipline",
    rewardType: "badge",
    rewardValue: "badge_financial_report",
    rewardLabel: "Lencana: Analis Cermat 📊",
    xpBonus: 80,
  },
];
