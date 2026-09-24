// File: src/screens/Tools/ToolsScreen.tsx
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../../theme/theme";
import { AppHeader } from "../../components/common";
import { useToolsTheme } from "./common";

interface ToolItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  desc: string;
  tag: string;
  screen:
    | "SplitBill"
    | "DailyLimit"
    | "SalaryAllocator"
    | "BuyOrWait"
    | "EmergencyRunway"
    | "FinancialCalculator";
}

const ToolsScreen: React.FC = () => {
  const { BG, SURF, ACCENT, TP, BORDER, colors } = useToolsTheme();
  const navigation = useNavigation<any>();

  // Tools list - each tool opens its own dedicated full-screen page
  const tools: ToolItem[] = [
    {
      id: "splitbill",
      icon: "people-outline",
      color: "#EC4899",
      title: "Split Bill",
      desc: "Hitung cepat patungan makan & nongkrong secara rata atau per pesanan dengan adil.",
      tag: "Patungan",
      screen: "SplitBill",
    },
    {
      id: "daily",
      icon: "shield-checkmark-outline",
      color: ACCENT,
      title: "Batas Aman Harian",
      desc: "Hitung jatah aman per hari sampai akhir bulan berdasarkan saldo & hutang.",
      tag: "Harian",
      screen: "DailyLimit",
    },
    {
      id: "salary",
      icon: "pie-chart-outline",
      color: colors.success,
      title: "Bagi Anggaran 50/30/20",
      desc: "Alokasikan uang pemasukan ke kebutuhan, keinginan, dan tabungan secara otomatis.",
      tag: "Bulanan",
      screen: "SalaryAllocator",
    },
    {
      id: "buy",
      icon: "cart-outline",
      color: Colors.warning,
      title: "Beli atau Tunda?",
      desc: "Simulasikan dampak pembelian terhadap saldo & jatah harianmu.",
      tag: "Insidental",
      screen: "BuyOrWait",
    },
    {
      id: "runway",
      icon: "timer-outline",
      color: Colors.purple,
      title: "Cek Nafas Hidup",
      desc: "Lihat berapa lama kamu bisa bertahan jika tidak ada pemasukan sama sekali.",
      tag: "Masa Depan",
      screen: "EmergencyRunway",
    },
    {
      id: "basic",
      icon: "calculator-outline",
      color: Colors.info,
      title: "Kalkulator Biasa",
      desc: "Hitung-hitungan manual (tambah, kurang, kali, bagi) dengan cepat.",
      tag: "Umum",
      screen: "FinancialCalculator",
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      {/* ── Standardized AppHeader ── */}
      <AppHeader
        title="Alat Finansial"
        subtitle="Simulasi & kalkulator berbasis data keuanganmu"
        showBack={navigation.canGoBack()}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Tool cards list */}
        <View style={{ gap: 14 }}>
          {tools.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              onPress={() => navigation.navigate(tool.screen)}
              activeOpacity={0.7}
              style={{
                width: "100%",
                backgroundColor: SURF,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: BORDER,
                borderLeftWidth: 3,
                borderLeftColor: tool.color,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {/* Icon */}
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: `${tool.color}15`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                  borderWidth: 1,
                  borderColor: `${tool.color}25`,
                }}
              >
                <Ionicons name={tool.icon} size={28} color={tool.color} />
              </View>

              {/* Text Info */}
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <Text
                    style={{
                      color: TP,
                      fontSize: 16,
                      fontWeight: "800",
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {tool.title}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 10,
                      backgroundColor: `${tool.color}12`,
                      marginLeft: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: tool.color,
                        fontSize: 9,
                        fontWeight: "800",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      {tool.tag}
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    color: Colors.gray400,
                    fontSize: 12,
                    lineHeight: 18,
                    paddingRight: 8,
                  }}
                  numberOfLines={2}
                >
                  {tool.desc}
                </Text>
              </View>

              {/* Chevron */}
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: BG,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: BORDER,
                }}
              >
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={Colors.gray400}
                  style={{ marginLeft: 2 }}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info note */}
        <View
          style={{
            backgroundColor: `${ACCENT}08`,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: `${ACCENT}15`,
            marginTop: 20,
            flexDirection: "row",
            gap: 10,
          }}
        >
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={ACCENT}
            style={{ marginTop: 1 }}
          />
          <Text
            style={{
              color: Colors.gray400,
              fontSize: 12,
              lineHeight: 18,
              flex: 1,
            }}
          >
            Semua kalkulator ini menggunakan data nyata dari transaksi, saldo,
            dan hutang kamu secara otomatis — tidak perlu input manual berulang.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ToolsScreen;
