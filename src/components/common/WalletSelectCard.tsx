// File: src/components/common/WalletSelectCard.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Wallet } from "../../types";
import { useTheme } from "../../theme/ThemeContext";
import { formatCurrency } from "../../utils/calculations";

interface WalletSelectCardProps {
  wallet: Wallet;
  isSelected: boolean;
  onPress: () => void;
  showBalance?: boolean;
}

export const WalletSelectCard: React.FC<WalletSelectCardProps> = ({
  wallet,
  isSelected,
  onPress,
  showBalance = true,
}) => {
  const { colors } = useTheme();
  const walletColor = wallet.color || colors.accent;
  const startColor =
    walletColor.startsWith("#") && walletColor.length === 7
      ? `${walletColor}D9`
      : walletColor;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        minWidth: 120,
        height: 52,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderWidth: isSelected ? 1.5 : 1,
        borderColor: isSelected ? walletColor : `${colors.border}80`,
        overflow: "hidden",
        justifyContent: "center",
        backgroundColor: colors.surface,
        marginRight: 8,
      }}
    >
      {/* ── ATM-style Gradient Overlay ── */}
      {isSelected ? (
        <LinearGradient
          colors={[startColor, "#06334F", "#011827"]}
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
      ) : (
        <LinearGradient
          colors={[`${walletColor}10`, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.8 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
      )}

      {/* ── Signature Leaf Motif Watermark (Desain Aslinya) ── */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          right: -8,
          bottom: -22,
          width: 32,
          height: 64,
          borderRadius: 32,
          backgroundColor: walletColor,
          opacity: isSelected ? 0.35 : 0.12,
          transform: [{ rotate: "38deg" }],
        }}
      />

      {/* ── Holographic Rings Watermark ── */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          right: -6,
          top: -6,
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isSelected ? `${walletColor}40` : `${colors.border}40`,
        }}
      />

      {/* ── Card Content ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1, marginRight: 6 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: isSelected ? "#FFFFFF" : colors.textPrimary,
              letterSpacing: -0.2,
            }}
          >
            {wallet.name}
          </Text>
          {showBalance && (
            <Text
              numberOfLines={1}
              style={{
                fontSize: 10,
                fontWeight: "600",
                color: isSelected
                  ? wallet.balance < 0
                    ? "#FCA5A5"
                    : "rgba(255,255,255,0.85)"
                  : wallet.balance < 0
                  ? colors.error
                  : colors.textSecondary,
                marginTop: 1,
              }}
            >
              {formatCurrency(wallet.balance)}
            </Text>
          )}
        </View>

        {/* ── Selection Indicator Badge ── */}
        {isSelected ? (
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="checkmark" size={12} color={walletColor} />
          </View>
        ) : (
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: walletColor,
              opacity: 0.7,
            }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default WalletSelectCard;
