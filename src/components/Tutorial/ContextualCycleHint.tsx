// File: src/components/Tutorial/ContextualCycleHint.tsx
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tw from "twrnc";
import { useTheme } from "../../theme/ThemeContext";

export const CYCLE_HINT_STORAGE_KEY = "@mymoney_dismissed_cycle_hint_v1";

interface ContextualCycleHintProps {
  onLearnMore: () => void;
}

export const ContextualCycleHint: React.FC<ContextualCycleHintProps> = ({
  onLearnMore,
}) => {
  const { colors } = useTheme();
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(CYCLE_HINT_STORAGE_KEY).then((val) => {
      if (!val) {
        setIsDismissed(false);
      }
    });
  }, []);

  const handleDismiss = async () => {
    setIsDismissed(true);
    try {
      await AsyncStorage.setItem(CYCLE_HINT_STORAGE_KEY, "true");
    } catch {}
  };

  if (isDismissed) return null;

  return (
    <View
      style={[
        tw`p-4 rounded-2xl mb-4 border relative overflow-hidden`,
        {
          backgroundColor: `${colors.accent}12`,
          borderColor: `${colors.accent}35`,
        },
      ]}
    >
      <View style={tw`flex-row items-start gap-3`}>
        <View
          style={[
            tw`w-8 h-8 rounded-xl items-center justify-center mt-0.5`,
            { backgroundColor: `${colors.accent}25` },
          ]}
        >
          <Ionicons
            name="bulb-outline"
            size={18}
            color={colors.accent}
          />
        </View>

        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-center justify-between`}>
            <Text
              style={[
                tw`text-xs font-bold mb-0.5`,
                { color: colors.textPrimary },
              ]}
            >
              Aktifkan Siklus Gajian Nyata
            </Text>
            <TouchableOpacity
              onPress={handleDismiss}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={tw`p-0.5`}
            >
              <Ionicons
                name="close"
                size={16}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          </View>

          <Text
            style={[
              tw`text-[11px] leading-4 mb-2.5`,
              { color: colors.textSecondary },
            ]}
          >
            Saat mencatat Pemasukan (gaji/uang saku), aktifkan opsi{" "}
            <Text style={[tw`font-bold`, { color: colors.accent }]}>
              Siklus (Hari)
            </Text>{" "}
            agar aplikasi menghitung jatah belanja aman harian Anda!
          </Text>

          <View style={tw`flex-row items-center gap-2`}>
            <TouchableOpacity
              onPress={onLearnMore}
              style={[
                tw`px-3 py-1.5 rounded-lg flex-row items-center gap-1`,
                { backgroundColor: colors.accent },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons name="book-outline" size={12} color="#FFFFFF" />
              <Text style={tw`text-[10px] font-bold text-white`}>
                Pelajari Cara Kerja
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDismiss}
              style={[
                tw`px-2.5 py-1.5 rounded-lg`,
                { backgroundColor: "transparent" },
              ]}
            >
              <Text
                style={[
                  tw`text-[10px] font-semibold`,
                  { color: colors.textTertiary },
                ]}
              >
                Saya Paham
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ContextualCycleHint;
