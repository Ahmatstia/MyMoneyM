import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../../theme/ThemeContext";
import { Wallet } from "../../../types";
import { formatCurrency, safeNumber } from "../../../utils/calculations";

interface WalletHorizontalListProps {
  wallets: Wallet[];
  operationalBalance: number;
  savingsBalance: number;
  onManagePress: () => void;
  onAddWalletPress: () => void;
}

export const WalletHorizontalList: React.FC<WalletHorizontalListProps> = ({
  wallets,
  operationalBalance,
  savingsBalance,
  onManagePress,
  onAddWalletPress,
}) => {
  const { colors } = useTheme();

  // Liquidity ratio calculations for the ambient micro-meter
  const opSafe = Math.max(0, safeNumber(operationalBalance));
  const svSafe = Math.max(0, safeNumber(savingsBalance));
  const totalPartitioned = opSafe + svSafe;
  const opPercent =
    totalPartitioned > 0 ? Math.round((opSafe / totalPartitioned) * 100) : 50;
  const svPercent = 100 - opPercent;

  return (
    <View style={{ marginBottom: 18 }}>
      {/* ── HEADER ROW & MANAGE LINK ── */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          paddingHorizontal: 2,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 13,
              fontWeight: "800",
              letterSpacing: -0.2,
            }}
          >
            Rekening & Dompet
          </Text>
          <View
            style={{
              backgroundColor: `${colors.accent}18`,
              paddingHorizontal: 6,
              paddingVertical: 1.5,
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                color: colors.accent,
                fontSize: 9.5,
                fontWeight: "700",
              }}
            >
              {wallets.length}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onManagePress}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 2,
            paddingHorizontal: 4,
          }}
        >
          <Text
            style={{
              color: colors.accent,
              fontSize: 11,
              fontWeight: "700",
              marginRight: 2,
            }}
          >
            Kelola
          </Text>
          <Ionicons name="chevron-forward" size={11} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* ── OUT-OF-THE-BOX AMBIENT LIQUIDITY CAPSULE (ULTRA-COMPACT) ── */}
      {/* Replaces the old bulky 100px dual box with a sleek 26px executive strip + 2px ratio meter */}
     

      {/* ── HORIZONTAL FINTECH MICRO-CARD DECK ── */}
      {wallets.length === 0 ? (
        <TouchableOpacity
          onPress={onAddWalletPress}
          activeOpacity={0.8}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: colors.accent,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: `${colors.accent}20`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="add" size={16} color={colors.accent} />
          </View>
          <View>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 11,
                fontWeight: "700",
              }}
            >
              Belum Ada Rekening
            </Text>
            <Text style={{ color: colors.gray400, fontSize: 9.5 }}>
              Tap untuk tambah akun & pisahkan uang belanja vs dingin
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 4 }}
        >
          {wallets.map((wallet) => {
            const walletColor = wallet.color || colors.accent;
            const isLiquid =
              wallet.isLiquid !== undefined
                ? wallet.isLiquid
                : wallet.role === "operational";

            // Format type label / masked account
            const typeLabel =
              wallet.type === "bank"
                ? "Bank"
                : wallet.type === "ewallet"
                  ? "E-Wallet"
                  : wallet.type === "investment"
                    ? "Investasi"
                    : wallet.type === "credit"
                      ? "Paylater"
                      : "Tunai";

            const roleDisplayName =
              wallet.role === "operational"
                ? "Belanja"
                : wallet.role
                  ? wallet.role.length > 8
                    ? wallet.role.slice(0, 7) + "…"
                    : wallet.role
                  : isLiquid
                    ? "Belanja"
                    : "Dingin";

            return (
              <TouchableOpacity
                key={wallet.id}
                onPress={onManagePress}
                activeOpacity={0.75}
                style={{
                  width: 125,
                  height: 78,
                  borderRadius: 14,
                  padding: 9,
                  borderWidth: 1,
                  borderColor: `${walletColor}38`,
                  overflow: "hidden",
                  justifyContent: "space-between",
                  backgroundColor: colors.surface,
                }}
              >
                {/* Sleek Dual-Tone Gradient Overlay */}
                <LinearGradient
                  colors={[`${walletColor}24`, `${colors.surface}`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                />

                {/* Decorative Fintech Card Holographic Rings (Out of the Box Watermark) */}
                <View
                  style={{
                    position: "absolute",
                    right: -10,
                    top: -10,
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    borderWidth: 1.2,
                    borderColor: `${walletColor}18`,
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    right: 4,
                    top: -6,
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    borderWidth: 1,
                    borderColor: `${walletColor}14`,
                  }}
                />

                {/* Middle: Wallet Name & Masked Type */}
                <View style={{ marginTop: 2 }}>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 11,
                      fontWeight: "700",
                      letterSpacing: -0.2,
                    }}
                    numberOfLines={1}
                  >
                    {wallet.name}
                  </Text>
                  <Text
                    style={{
                      color: colors.gray400,
                      fontSize: 9.5,
                      fontWeight: "500",
                      marginTop: 0.5,
                    }}
                    numberOfLines={1}
                  >
                    {wallet.accountNumber
                      ? `${wallet.accountNumber}`
                      : typeLabel}
                  </Text>

                  {/* Bottom: Crisp Balance */}
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 12,
                      fontWeight: "800",
                      letterSpacing: -0.3,
                      marginTop: 10,
                    }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatCurrency(wallet.balance)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Add Wallet Compact Card */}
          <TouchableOpacity
            onPress={onAddWalletPress}
            activeOpacity={0.7}
            style={{
              width: 125,
              height: 78,
              backgroundColor: `${colors.surface}80`,
              borderRadius: 14,
              padding: 8,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: `${colors.border}90`,
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: `${colors.accent}18`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="add" size={14} color={colors.accent} />
            </View>
            <Text
              style={{
                color: colors.accent,
                fontSize: 9.5,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              Tambah Rekening
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};
