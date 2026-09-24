import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { useGamification } from "../../context/GamificationContext";
import { useAppContext } from "../../context/AppContext";
import { useTheme } from "../../theme/ThemeContext";
import { CatMascotSvg } from "../../components/Mascot/CatMascotSvg";
import {
  AccessoryId,
  CatMood,
  MILESTONES,
  MilestoneDefinition,
  LEVEL_TITLES,
} from "../../types/gamification";
import {
  getTierTheme,
  isMilestoneUnlocked,
  getCumulativeXpForLevel,
} from "../../utils/gamificationEngine";
import { LevelUpModal } from "../../components/Gamification/LevelUpModal";

const { width } = Dimensions.get("window");

type MoniTab = "milestones" | "wardrobe" | "roadmap";

const CATEGORY_COLOR: Record<string, string> = {
  transaction: "#3B82F6",
  savings:     "#10B981",
  streak:      "#F59E0B",
  discipline:  "#8B5CF6",
  level:       "#EC4899",
};

export const MoniScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { state: appState } = useAppContext();
  const {
    state: game,
    progress,
    petMoni,
    claimMilestone,
    equipAccessory,
    claimableMilestones,
  } = useGamification();

  // --- State ------------------------------------------------------------
  const [activeTab, setActiveTab]           = useState<MoniTab>("milestones");
  const [speech, setSpeech]                 = useState("");
  const [activeMood, setActiveMood]         = useState<CatMood>("happy");
  const [isBlinking, setIsBlinking]         = useState(false);
  const [floatingHeartText, setFloatingHeartText] = useState("+5 XP 💕");
  const [claimedRewardPopup, setClaimedRewardPopup] =
    useState<MilestoneDefinition | null>(null);

  // --- Animations ------------------------------------------------------------
  const floatAnim     = useRef(new Animated.Value(0)).current;
  const bounceScale   = useRef(new Animated.Value(1)).current;
  const heartOpacity  = useRef(new Animated.Value(0)).current;
  const slideAnim     = useRef(new Animated.Value(0)).current;
  const heartY        = useRef(new Animated.Value(0)).current;
  const progressAnim  = useRef(new Animated.Value(0)).current;
  const speechPop     = useRef(new Animated.Value(0)).current;
  const rippleAnim    = useRef(new Animated.Value(0)).current;
  const spark1        = useRef(new Animated.Value(0)).current;
  const spark2        = useRef(new Animated.Value(0)).current;

  const tierTheme = useMemo(() => getTierTheme(progress.borderTier), [progress.borderTier]);

  // --- Effects ------------------------------------------------------------
  useEffect(() => {
    // idle float
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -9, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,  duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();

    // sparkle particles
    const s1 = Animated.loop(Animated.sequence([
      Animated.timing(spark1, { toValue: 1, duration: 2800, useNativeDriver: true }),
      Animated.timing(spark1, { toValue: 0, duration: 2800, useNativeDriver: true }),
    ]));
    const s2 = Animated.loop(Animated.sequence([
      Animated.timing(spark2, { toValue: 1, duration: 2200, useNativeDriver: true }),
      Animated.timing(spark2, { toValue: 0, duration: 2200, useNativeDriver: true }),
    ]));
    s1.start();
    s2.start();

    // blink
    const blink = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 4000);

    return () => { loop.stop(); s1.stop(); s2.stop(); clearInterval(blink); };
  }, []);

  // speech bubble pop
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 23 || hour < 5) {
      setActiveMood("sleepy");  setSpeech("Hoammm... Sudah larut malam 🌙");
    } else if ((appState.budgets || []).some((b) => b.limit > 0 && b.spent >= b.limit)) {
      setActiveMood("worried"); setSpeech("Awas! Ada anggaran yg melewati batas 😿");
    } else if ((appState.savings || []).some((s) => s.current > 0)) {
      setActiveMood("happy");   setSpeech("Tabungan kita terus bertumbuh! 🌱");
    } else {
      setActiveMood("happy");   setSpeech("Elus aku untuk bonus XP harian! ✨");
    }

    speechPop.setValue(0);
    Animated.spring(speechPop, { toValue: 1, friction: 5, tension: 65, useNativeDriver: true }).start();
  }, [appState.budgets, appState.savings]);

  // XP bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress.percent,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress.percent]);

  // --- Handlers ------------------------------------------------------------
  const handlePetCat = async () => {
    rippleAnim.setValue(0);
    Animated.timing(rippleAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();

    bounceScale.setValue(0.8);
    Animated.spring(bounceScale, { toValue: 1, friction: 3, tension: 55, useNativeDriver: true }).start();

    const result = await petMoni();
    setFloatingHeartText(result.xpEarned > 0 ? `+${result.xpEarned} XP 💕` : "Purrr~ 💤");
    heartOpacity.setValue(1);
    heartY.setValue(0);
    Animated.parallel([
      Animated.timing(heartOpacity, { toValue: 0, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(heartY, { toValue: -55, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();

    setSpeech(result.message);
    setActiveMood("playful");
    setTimeout(() => setActiveMood("happy"), 3000);
  };

  const handleClaim = async (m: MilestoneDefinition) => {
    const ok = await claimMilestone(m.id);
    if (ok) setClaimedRewardPopup(m);
  };

  // --- Data ------------------------------------------------------------
  const accessoryList: { id: AccessoryId; emoji: string; name: string; desc: string }[] = [
    { id: "none",       emoji: "😺", name: "Natural",     desc: "Tampilan alami Moni" },
    { id: "bell",       emoji: "🔔", name: "Lonceng",     desc: "10 transaksi" },
    { id: "sunglasses", emoji: "😎", name: "Kacamata",    desc: "50 transaksi" },
    { id: "bow",        emoji: "🎀", name: "Pita Emas",   desc: "Selesaikan tabungan" },
    { id: "chef_hat",   emoji: "👨‍🍳", name: "Topi Koki", desc: "Level 5" },
    { id: "crown",      emoji: "👑", name: "Mahkota",     desc: "Level 10" },
  ];

  const rippleScale   = rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 3.5] });
  const rippleOpacity = rippleAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.5, 0.2, 0] });

  // --- Render ------------------------------------------------------------
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >

        {/* ============================================================
            HERO SECTION — flex column, no absolute content
        ============================================================ */}
        <LinearGradient
          colors={["#0B0B14", "#0F0F1A", tierTheme.gradient[0] + "55"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 8 }]}
        >
          {/* Decorative background orbs (truly absolute, behind content) */}
          <View style={[styles.orb1, { backgroundColor: tierTheme.glowColor }]} />
          <View style={[styles.orb2, { backgroundColor: tierTheme.gradient[1] + "33" }]} />

          {/* Sparkle particles */}
          <Animated.Text style={[styles.sparkle, {
            top: "22%", left: "8%",
            opacity: spark1.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.85] }),
            transform: [{ translateY: spark1.interpolate({ inputRange: [0, 1], outputRange: [0, -16] }) }],
          }]}>✦</Animated.Text>
          <Animated.Text style={[styles.sparkle, {
            top: "38%", right: "10%", fontSize: 9,
            opacity: spark2.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.65] }),
            transform: [{ translateY: spark2.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) }],
          }]}>✦</Animated.Text>

          {/* -- HEADER ROW: back + title centered + level badge -- */}
          <View style={styles.heroHeader}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={19} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.heroHeaderCenter}>
              <Text style={styles.heroScreenLabel}>RUANG MONI</Text>
              <Text style={[styles.heroTierTitle, { color: tierTheme.primary }]}>
                {progress.title}
              </Text>
            </View>

            <LinearGradient
              colors={tierTheme.gradient as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.lvBadge}
            >
              <Ionicons name="star" size={9} color="#FFF" />
              <Text style={styles.lvBadgeText}>Lv.{progress.level}</Text>
            </LinearGradient>
          </View>

          {/* -- SPEECH BUBBLE (above mascot) -- */}
          {speech !== "" && (
            <Animated.View style={[styles.speechWrap, { transform: [{ scale: speechPop }] }]}>
              <View style={styles.speechBubble}>
                <Text style={styles.speechText}>{speech}</Text>
              </View>
              <View style={styles.speechTail} />
            </Animated.View>
          )}

          {/* -- MASCOT — free floating, no box -- */}
          <View style={styles.mascotZone}>
            {/* floating XP popup */}
            <Animated.View
              pointerEvents="none"
              style={[styles.heartPop, { opacity: heartOpacity, transform: [{ translateY: heartY }] }]}
            >
              <Text style={styles.heartPopText}>{floatingHeartText}</Text>
            </Animated.View>

            {/* ripple behind mascot */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.ripple,
                { borderColor: tierTheme.primary + "88", opacity: rippleOpacity, transform: [{ scale: rippleScale }] },
              ]}
            />

            <TouchableOpacity activeOpacity={0.9} onPress={handlePetCat}>
              <Animated.View style={{ transform: [{ translateY: floatAnim }, { scale: bounceScale }] }}>
                <CatMascotSvg
                  mood={activeMood}
                  accessory={game.equippedAccessory}
                  isBlinking={isBlinking}
                  size={160}
                />
              </Animated.View>
            </TouchableOpacity>

            {/* soft glow shadow under cat */}
            <View style={[styles.catShadow, { backgroundColor: tierTheme.glowColor }]} />
          </View>

          {/* -- PET HINT -- */}
          <Text style={styles.petHint}>
            Ketuk Moni  ·  {game.petCountToday}/5 hari ini 🐾
          </Text>

          {/* -- XP PROGRESS STRIP -- */}
          <View style={styles.xpStrip}>
            <View style={styles.xpRow}>
              <Text style={styles.xpTierLabel}>{tierTheme.label}</Text>
              <Text style={styles.xpNums}>
                {progress.currentLevelXp.toLocaleString("id-ID")} / {progress.xpNeededForNext.toLocaleString("id-ID")} XP
              </Text>
              <Text style={[styles.xpPct, { color: tierTheme.primary }]}>
                {Math.round(progress.percent * 100)}%
              </Text>
            </View>
            <View style={styles.xpTrackBg}>
              <Animated.View
                style={[
                  styles.xpFill,
                  { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) },
                ]}
              >
                <LinearGradient
                  colors={tierTheme.gradient as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.xpDot} />
              </Animated.View>
            </View>
          </View>

          {/* -- SEGMENTED PILL TAB (inside hero, above content) -- */}
          {(() => {
            const TABS: { id: MoniTab; icon: string; label: string }[] = [
              { id: "milestones", icon: "trophy",  label: "Pencapaian" },
              { id: "wardrobe",   icon: "shirt",   label: "Lemari" },
              { id: "roadmap",    icon: "map",     label: "Level" },
            ];
            const TAB_IDX = { milestones: 0, wardrobe: 1, roadmap: 2 };
            const SEG_W = (width - 48) / 3;

            const handleTabChange = (tab: MoniTab) => {
              setActiveTab(tab);
              Animated.spring(slideAnim, {
                toValue: TAB_IDX[tab] * SEG_W,
                friction: 6,
                tension: 80,
                useNativeDriver: true,
              }).start();
            };

            return (
              <View style={styles.segContainer}>
                {/* sliding pill */}
                <Animated.View
                  style={[
                    styles.segSlider,
                    {
                      width: SEG_W,
                      transform: [{ translateX: slideAnim }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={tierTheme.gradient as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>

                {/* tab buttons */}
                {TABS.map((t) => {
                  const active = activeTab === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => handleTabChange(t.id)}
                      style={styles.segBtn}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={t.icon as any}
                        size={15}
                        color={active ? "#FFF" : "rgba(255,255,255,0.38)"}
                      />
                      <Text style={[styles.segLabel, { color: active ? "#FFF" : "rgba(255,255,255,0.38)" }]}>
                        {t.label}
                      </Text>
                      {t.id === "milestones" && claimableMilestones.length > 0 && (
                        <View style={styles.segDot}>
                          <Text style={styles.segDotText}>{claimableMilestones.length}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })()}
        </LinearGradient>


        {/* ============================================================
            TAB CONTENT
        ============================================================ */}
        <View style={{ backgroundColor: colors.background }}>

          {/* ------------------------------------------------------------ MILESTONES ------------------------------------------------------------ */}
          {activeTab === "milestones" && (
            <View style={styles.pad}>
              {MILESTONES.map((item) => {
                const isClaimed = game.claimedMilestoneIds.includes(item.id);
                const isUnlocked = isMilestoneUnlocked(item, appState, game);
                const canClaim   = isUnlocked && !isClaimed;
                const accent     = CATEGORY_COLOR[item.category] || "#64748B";

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.mCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: canClaim ? "#F59E0B55"
                          : isClaimed ? "#10B98133"
                          : colors.borderLight,
                        shadowColor: canClaim ? "#F59E0B" : "#000",
                      },
                    ]}
                  >
                    {/* colored left bar */}
                    <View style={[styles.mBar, {
                      backgroundColor: canClaim ? "#F59E0B"
                        : isClaimed ? "#10B981"
                        : accent + "70",
                    }]} />

                    {/* icon circle */}
                    <View style={[styles.mIconCircle, { backgroundColor: accent + "1A" }]}>
                      {item.iconFamily === "MaterialCommunityIcons" ? (
                        <MaterialCommunityIcons
                          name={item.icon as any}
                          size={20}
                          color={isClaimed ? "#10B981" : canClaim ? "#F59E0B" : accent}
                        />
                      ) : (
                        <Ionicons
                          name={item.icon as any}
                          size={20}
                          color={isClaimed ? "#10B981" : canClaim ? "#F59E0B" : accent}
                        />
                      )}
                    </View>

                    {/* text */}
                    <View style={styles.mBody}>
                      <Text style={[styles.mTitle, { color: colors.textPrimary, opacity: isClaimed ? 0.55 : 1 }]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.mDesc, { color: colors.textSecondary }]}>
                        {item.description}
                      </Text>
                      <View style={styles.mRewardRow}>
                        <Text style={[styles.mRewardText, { color: accent }]} numberOfLines={1}>
                          {item.rewardLabel}
                        </Text>
                        <View style={styles.mXpChip}>
                          <Text style={styles.mXpText}>+{item.xpBonus} XP</Text>
                        </View>
                      </View>
                    </View>

                    {/* action */}
                    {isClaimed ? (
                      <View style={styles.doneWrap}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      </View>
                    ) : canClaim ? (
                      <TouchableOpacity onPress={() => handleClaim(item)} activeOpacity={0.8}>
                        <LinearGradient colors={["#F59E0B", "#D97706"]} style={styles.claimBtn}>
                          <Ionicons name="gift" size={12} color="#FFF" />
                          <Text style={styles.claimTxt}>KLAIM</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.lockWrap}>
                        <Ionicons name="lock-closed" size={14} color={colors.textTertiary} />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* ------------------------------------------------------------ WARDROBE ------------------------------------------------------------ */}
          {activeTab === "wardrobe" && (
            <View style={styles.pad}>
              <Text style={[styles.secLabel, { color: colors.textTertiary }]}>
                Koleksi Aksesori Moni
              </Text>

              {/* 3 kolom, centered */}
              <View style={styles.wGrid}>
                {accessoryList.map((item) => {
                  const unlocked  = item.id === "none" || game.unlockedAccessories.includes(item.id);
                  const equipped  = game.equippedAccessory === item.id;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      disabled={!unlocked}
                      onPress={() => equipAccessory(item.id)}
                      activeOpacity={0.82}
                      style={[
                        styles.wCard,
                        {
                          backgroundColor: colors.surface,
                          opacity: unlocked ? 1 : 0.38,
                          borderColor: equipped ? tierTheme.primary : colors.borderLight,
                          borderWidth: equipped ? 2 : 1,
                          shadowColor: equipped ? tierTheme.primary : "#000",
                          shadowOpacity: equipped ? 0.35 : 0.08,
                        },
                      ]}
                    >
                      {/* gradient fill when equipped */}
                      {equipped && (
                        <LinearGradient
                          colors={[tierTheme.gradient[0] + "CC", tierTheme.gradient[1] + "BB"]}
                          style={StyleSheet.absoluteFill}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        />
                      )}

                      <Text style={styles.wEmoji}>{item.emoji}</Text>
                      <Text style={[styles.wName, { color: equipped ? "#FFF" : colors.textPrimary }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.wDesc, { color: equipped ? "rgba(255,255,255,0.65)" : colors.textTertiary }]}
                        numberOfLines={1}
                      >
                        {item.desc}
                      </Text>

                      {equipped ? (
                        <View style={styles.wChipOn}>
                          <Text style={styles.wChipOnText}>✓ Dipakai</Text>
                        </View>
                      ) : !unlocked ? (
                        <View style={[styles.wChipOff, { backgroundColor: colors.surfaceLight }]}>
                          <Ionicons name="lock-closed" size={9} color={colors.textTertiary} />
                          <Text style={[styles.wChipOffText, { color: colors.textTertiary }]}>Terkunci</Text>
                        </View>
                      ) : (
                        <View style={[styles.wChipUse, { borderColor: colors.accent + "55" }]}>
                          <Text style={[styles.wChipUseText, { color: colors.accent }]}>Pakai</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ------------------------------------------------------------ ROADMAP ------------------------------------------------------------ */}
          {activeTab === "roadmap" && (
            <View style={styles.pad}>
              <Text style={[styles.secLabel, { color: colors.textTertiary }]}>
                Jalur Gelar RPG
              </Text>

              {LEVEL_TITLES.map((titleItem, index) => {
                const passed  = progress.level >= titleItem.minLevel;
                const current = passed &&
                  (index === LEVEL_TITLES.length - 1 || progress.level < LEVEL_TITLES[index + 1].minLevel);
                const tt     = getTierTheme(titleItem.tier);
                const cumXp  = getCumulativeXpForLevel(titleItem.minLevel);

                return (
                  <View key={titleItem.minLevel} style={styles.rmRow}>
                    {/* vertical connector line */}
                    <View style={styles.rmLeft}>
                      {/* node */}
                      {passed ? (
                        <LinearGradient
                          colors={tt.gradient as [string, string, ...string[]]}
                          style={[styles.rmNode, current && { elevation: 8, shadowOpacity: 0.5 }]}
                        >
                          <Text style={styles.rmNodeStar}>{current ? "★" : "✓"}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={[styles.rmNodeEmpty, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
                          <Text style={[styles.rmNodeLv, { color: colors.textTertiary }]}>
                            {titleItem.minLevel}
                          </Text>
                        </View>
                      )}

                      {/* line below node (except last) */}
                      {index < LEVEL_TITLES.length - 1 && (
                        <View style={[styles.rmLine, {
                          backgroundColor: passed ? tt.primary + "80" : colors.borderLight,
                        }]} />
                      )}
                    </View>

                    {/* card */}
                    <View style={[
                      styles.rmCard,
                      {
                        backgroundColor: current
                          ? colors.surface
                          : passed
                          ? colors.surface
                          : colors.background,
                        borderColor: current ? tt.primary : passed ? colors.borderLight : colors.borderLight,
                        borderWidth: current ? 1.5 : 1,
                        marginBottom: index < LEVEL_TITLES.length - 1 ? 0 : 0,
                      },
                    ]}>
                      {/* gradient top bar for current */}
                      {current && (
                        <LinearGradient
                          colors={[tt.primary + "40", "transparent"]}
                          style={styles.rmCardTopBar}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        />
                      )}

                      <View style={styles.rmCardMain}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.rmCardTitle, {
                            color: current ? tt.primary
                              : passed ? colors.textPrimary
                              : colors.textTertiary,
                          }]}>
                            {titleItem.title}
                          </Text>
                          <Text style={[styles.rmCardTier, { color: tt.primary + "CC" }]}>
                            {tt.label}
                          </Text>
                          <Text style={[styles.rmCardXp, { color: colors.textTertiary }]}>
                            Lv.{titleItem.minLevel} · {cumXp.toLocaleString("id-ID")} XP total
                          </Text>
                        </View>

                        {current ? (
                          <View style={[styles.rmChipActive, { backgroundColor: tt.primary }]}>
                            <Text style={styles.rmChipActiveText}>Aktif</Text>
                          </View>
                        ) : passed ? (
                          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                        ) : (
                          <Ionicons name="lock-closed" size={16} color={colors.textTertiary} style={{ opacity: 0.4 }} />
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

        </View>
      </ScrollView>

      <LevelUpModal />

      {/* -- CLAIM REWARD MODAL -- */}
      {claimedRewardPopup && (
        <View style={styles.backdropOuter}>
          <View style={styles.backdropTint} />
          <View style={styles.rewardWrap}>
            <LinearGradient
              colors={["#1A1A2E", "#16213E", "#0D1B2A"]}
              style={styles.rewardBox}
            >
              <View style={styles.rewardGlow} />

              <LinearGradient colors={["#F59E0B", "#D97706"]} style={styles.rewardIconRing}>
                <Ionicons name="sparkles" size={30} color="#FFF" />
              </LinearGradient>

              <Text style={styles.rewardTitle}>Hadiah Diklaim! 🎉</Text>
              <Text style={styles.rewardLabel}>{claimedRewardPopup.rewardLabel}</Text>

              <View style={styles.rewardXpPill}>
                <Text style={styles.rewardXpText}>+{claimedRewardPopup.xpBonus} XP</Text>
              </View>

              {claimedRewardPopup.rewardType === "accessory" && (
                <TouchableOpacity
                  onPress={() => { equipAccessory(claimedRewardPopup.rewardValue as AccessoryId); setClaimedRewardPopup(null); }}
                  style={styles.rewardEquipBtn}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={["#F59E0B", "#D97706"]} style={styles.rewardEquipGrad}>
                    <Text style={styles.rewardEquipText}>Pakaikan ke Moni 🐾</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => setClaimedRewardPopup(null)} style={styles.rewardCloseBtn}>
                <Text style={styles.rewardCloseText}>Tutup</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      )}
    </View>
  );
};

// ------------------------------------------------------------
// STYLES
// ------------------------------------------------------------
const CARD_W = (width - 32 - 12) / 3; // 3 kolom, 16px padding kiri-kanan, 6px jarak antar kartu

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0F0F1A" },

  // -- HERO ------------------------------------------------------------
  hero: {
    alignItems: "center",
    paddingBottom: 0,
    overflow: "hidden",
  },
  orb1: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    top: 40,
    alignSelf: "center",
    opacity: 0.28,
  },
  orb2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    bottom: 80,
    right: -30,
    opacity: 0.22,
  },
  sparkle: {
    position: "absolute",
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
  },

  // header row
  heroHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroHeaderCenter: { alignItems: "center", flex: 1, paddingHorizontal: 8 },
  heroScreenLabel: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 3,
  },
  heroTierTitle: {
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2,
    textAlign: "center",
  },
  lvBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    elevation: 3,
  },
  lvBadgeText: { color: "#FFF", fontSize: 12, fontWeight: "800" },

  // speech bubble
  speechWrap: { alignItems: "center", marginBottom: 10, paddingHorizontal: 24 },
  speechBubble: {
    backgroundColor: "rgba(255,255,255,0.09)",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    maxWidth: width - 80,
  },
  speechText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
  speechTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "rgba(255,255,255,0.09)",
  },

  // mascot zone
  mascotZone: { alignItems: "center", justifyContent: "center", marginBottom: 4 },
  heartPop: {
    position: "absolute",
    top: -10,
    zIndex: 20,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  heartPopText: { color: "#FDE047", fontSize: 13, fontWeight: "800" },
  ripple: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  catShadow: {
    width: 90,
    height: 16,
    borderRadius: 45,
    opacity: 0.25,
    marginTop: -6,
  },

  petHint: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 16,
    marginTop: 4,
  },

  // XP strip
  xpStrip: { width: "100%", paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10, backgroundColor: "rgba(0,0,0,0.25)", gap: 8 },
  xpRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  xpTierLabel: { color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.7, flex: 1 },
  xpNums: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "600" },
  xpPct: { fontSize: 12, fontWeight: "800", minWidth: 34, textAlign: "right" },
  xpTrackBg: { height: 7, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" },
  xpFill: { height: "100%", borderRadius: 4, overflow: "hidden", alignItems: "flex-end", justifyContent: "center" },
  xpDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "rgba(255,255,255,0.9)", marginRight: 3 },

  // -- SEGMENTED PILL ------------------------------------------------------------
  segContainer: {
    flexDirection: "row",
    width: width - 48,
    height: 44,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 14,
    marginHorizontal: 24,
    marginBottom: 20,
    marginTop: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  segSlider: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  segBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    zIndex: 1,
  },
  segLabel: { fontSize: 12, fontWeight: "700" },
  segDot: {
    backgroundColor: "#EF4444",
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  segDotText: { color: "#FFF", fontSize: 8, fontWeight: "900" },

  // -- GENERAL SECTION ------------------------------------------------------------
  pad: { padding: 16, gap: 10 },
  secLabel: { fontSize: 10.5, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 },

  // -- MILESTONE CARDS ------------------------------------------------------------
  mCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  mBar: { width: 4, alignSelf: "stretch" },
  mIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    margin: 12,
  },
  mBody: { flex: 1, paddingVertical: 12, paddingRight: 4 },
  mTitle: { fontSize: 13.5, fontWeight: "700" },
  mDesc:  { fontSize: 11, marginTop: 2, lineHeight: 15 },
  mRewardRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 5 },
  mRewardText: { fontSize: 10, fontWeight: "600", flex: 1 },
  mXpChip: { backgroundColor: "rgba(16,185,129,0.15)", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  mXpText: { color: "#10B981", fontSize: 9.5, fontWeight: "800" },
  doneWrap: { paddingHorizontal: 12 },
  claimBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 13, paddingVertical: 10 },
  claimTxt: { color: "#FFF", fontSize: 11, fontWeight: "900" },
  lockWrap: { paddingHorizontal: 14, paddingVertical: 10, opacity: 0.45 },

  // -- WARDROBE GRID ------------------------------------------------------------
  wGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  wCard: {
    width: CARD_W,
    minHeight: CARD_W * 1.15,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
    overflow: "hidden",
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  wEmoji: { fontSize: 28, marginBottom: 5 },
  wName:  { fontSize: 11, fontWeight: "700", textAlign: "center" },
  wDesc:  { fontSize: 9.5, marginTop: 2, textAlign: "center" },
  wChipOn: { marginTop: 7, backgroundColor: "rgba(255,255,255,0.22)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  wChipOnText: { color: "#FFF", fontSize: 9, fontWeight: "800" },
  wChipOff: { marginTop: 7, flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  wChipOffText: { fontSize: 9, fontWeight: "600" },
  wChipUse: { marginTop: 7, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  wChipUseText: { fontSize: 9, fontWeight: "700" },

  // -- ROADMAP ------------------------------------------------------------
  rmRow: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 14,
  },
  rmLeft: { alignItems: "center", width: 40 },
  rmNode: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  rmNodeEmpty: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rmNodeStar: { color: "#FFF", fontSize: 16, fontWeight: "900" },
  rmNodeLv:   { fontSize: 10, fontWeight: "800" },
  rmLine: { width: 2, flex: 1, borderRadius: 1, marginTop: 4, minHeight: 30 },
  rmCard: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  rmCardTopBar: { height: 3, width: "100%" },
  rmCardMain:   { padding: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  rmCardTitle:  { fontSize: 13.5, fontWeight: "800", lineHeight: 18 },
  rmCardTier:   { fontSize: 10.5, fontWeight: "600", marginTop: 2 },
  rmCardXp:     { fontSize: 10, marginTop: 3 },
  rmChipActive: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexShrink: 0 },
  rmChipActiveText: { color: "#FFF", fontSize: 9.5, fontWeight: "800" },

  // -- REWARD MODAL ------------------------------------------------------------
  backdropOuter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 100,
  },
  backdropTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "transparent",
  },
  rewardWrap: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 26,
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  rewardBox:     { padding: 28, alignItems: "center" },
  rewardGlow:    { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(245,158,11,0.1)", top: -30, alignSelf: "center" },
  rewardIconRing: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  rewardTitle:   { color: "#FFF", fontSize: 20, fontWeight: "900", marginTop: 14 },
  rewardLabel:   { color: "rgba(255,255,255,0.65)", fontSize: 13.5, fontWeight: "600", marginTop: 6, textAlign: "center" },
  rewardXpPill:  { marginTop: 10, backgroundColor: "rgba(16,185,129,0.18)", paddingHorizontal: 16, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: "#10B98133" },
  rewardXpText:  { color: "#10B981", fontSize: 14, fontWeight: "800" },
  rewardEquipBtn: { marginTop: 18, width: "100%", borderRadius: 14, overflow: "hidden" },
  rewardEquipGrad: { paddingVertical: 13, alignItems: "center" },
  rewardEquipText: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  rewardCloseBtn: { marginTop: 8, width: "100%", paddingVertical: 12, alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14 },
  rewardCloseText: { color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "600" },
});

export default MoniScreen;
