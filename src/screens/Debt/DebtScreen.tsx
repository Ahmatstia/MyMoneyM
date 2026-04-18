// File: src/screens/Debt/DebtScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Animated,
} from "react-native";
import { Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { Debt } from "../../types";
import { Colors } from "../../theme/theme";
import { formatCurrency, safeNumber, safePositiveNumber } from "../../utils/calculations";

type SafeIconName = keyof typeof Ionicons.glyphMap;

// ─── Tema warna (Konsisten dengan HomeScreen) ──────────────────────────────────
const PRIMARY_COLOR    = Colors.primary;
const ACCENT_COLOR     = Colors.accent;
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR    = Colors.surface;
const TEXT_PRIMARY     = Colors.textPrimary;
const TEXT_SECONDARY   = Colors.textSecondary;
const BORDER_COLOR     = Colors.border;
const SUCCESS_COLOR    = Colors.success;
const WARNING_COLOR    = Colors.warning;
const ERROR_COLOR      = Colors.error;

// ─── Komponen UI kecil (Konsisten dengan HomeScreen) ─────────────────────────
const Sep = ({ marginV = 20 }: { marginV?: number }) => (
  <View
    style={{
      height: 1,
      backgroundColor: SURFACE_COLOR,
      marginHorizontal: -16,
      marginVertical: marginV,
    }}
  />
);

const SectionHeader = ({
  title,
  linkLabel,
  onPress,
}: {
  title: string;
  linkLabel?: string;
  onPress?: () => void;
}) => (
  <View style={tw`flex-row justify-between items-center mb-3`}>
    <Text
      style={{
        color: Colors.gray400,
        fontSize: 10,
        fontWeight: "600",
        letterSpacing: 1,
        textTransform: "uppercase",
      }}
    >
      {title}
    </Text>
    {linkLabel && onPress && (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Text style={{ color: ACCENT_COLOR, fontSize: 12 }}>{linkLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const ThinBar = ({
  progress,
  color,
}: {
  progress: number;
  color: string;
}) => (
  <View style={{ height: 3, backgroundColor: Colors.surfaceLight, borderRadius: 3 }}>
    <View
      style={{
        height: 3,
        borderRadius: 3,
        width: `${Math.max(0, Math.min(progress * 100, 100))}%`,
        backgroundColor: color,
      }}
    />
  </View>
);

const STATUS_COLOR: Record<Debt["status"], string> = {
  active: ERROR_COLOR,
  partial: WARNING_COLOR,
  paid: SUCCESS_COLOR,
};
const STATUS_LABEL: Record<Debt["status"], string> = {
  active: "Belum Dibayar",
  partial: "Sebagian",
  paid: "Lunas",
};

const DebtScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state, deleteDebt, payDebt } = useAppContext();

  const [activeTab, setActiveTab] = useState<"borrowed" | "lent">("borrowed");
  const [payModal, setPayModal] = useState<{ visible: boolean; debt: Debt | null }>({
    visible: false,
    debt: null,
  });
  const [payAmount, setPayAmount] = useState("");
  const [scaleAnim] = useState(new Animated.Value(1));

  const debts = useMemo(() => 
    (state.debts || []).filter((d) => d.type === activeTab),
  [state.debts, activeTab]);

  // Ringkasan
  const totalBorrowed = useMemo(() => 
    (state.debts || [])
      .filter((d) => d.type === "borrowed" && d.status !== "paid")
      .reduce((s, d) => s + safeNumber(d.remaining), 0),
  [state.debts]);

  const totalLent = useMemo(() => 
    (state.debts || [])
      .filter((d) => d.type === "lent" && d.status !== "paid")
      .reduce((s, d) => s + safeNumber(d.remaining), 0),
  [state.debts]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleDelete = (debt: Debt) => {
    Alert.alert(
      "Hapus Data",
      `Yakin ingin menghapus catatan "${debt.name}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => deleteDebt(debt.id),
        },
      ]
    );
  };

  const handlePay = async () => {
    if (!payModal.debt) return;
    const amount = parseFloat(payAmount.replace(/\D/g, ""));
    if (!amount || amount <= 0) {
      Alert.alert("Error", "Masukkan nominal yang valid");
      return;
    }
    if (amount > payModal.debt.remaining) {
      Alert.alert("Error", "Nominal melebihi sisa sisa");
      return;
    }
    await payDebt(payModal.debt.id, amount);
    setPayModal({ visible: false, debt: null });
    setPayAmount("");
  };

  const getDaysUntilDue = (dueDate?: string) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={tw`flex-row justify-between items-center mb-6`}>
          <View>
            <Text style={{ color: TEXT_PRIMARY, fontSize: 24, fontWeight: "800" }}>
              Hutang & Piutang
            </Text>
            <Text style={{ color: Colors.gray400, fontSize: 12, marginTop: 2 }}>
              Kelola beban dan pinjaman uang Anda
            </Text>
          </View>
          <TouchableOpacity
            style={[tw`w-10 h-10 rounded-full items-center justify-center`, { backgroundColor: `${ACCENT_COLOR}15` }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={20} color={ACCENT_COLOR} />
          </TouchableOpacity>
        </View>

        {/* Summary Cards - Premium Look (Like Balance Card) */}
        <View style={tw`flex-row gap-3 mb-6`}>
          <View
            style={[
              tw`flex-1 rounded-3xl p-4`,
              { 
                backgroundColor: SURFACE_COLOR, 
                borderWidth: 1, 
                borderColor: `${ERROR_COLOR}30`,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4
              },
            ]}
          >
          <View
            style={[
              tw`w-8 h-8 rounded-xl items-center justify-center mb-3`,
              { backgroundColor: `${ERROR_COLOR}15` }
            ]}
          >
              <Ionicons name="arrow-down-outline" size={16} color={ERROR_COLOR} />
            </View>
            <Text style={{ color: Colors.gray400, fontSize: 10, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" }}>
              Hutang Saya
            </Text>
            <Text style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: "800", marginTop: 2 }}>
              {formatCurrency(totalBorrowed)}
            </Text>
          </View>

          <View
            style={[
              tw`flex-1 rounded-3xl p-4`,
              { 
                backgroundColor: SURFACE_COLOR, 
                borderWidth: 1, 
                borderColor: `${SUCCESS_COLOR}30`,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4
              },
            ]}
          >
          <View
            style={[
              tw`w-8 h-8 rounded-xl items-center justify-center mb-3`,
              { backgroundColor: `${SUCCESS_COLOR}15` }
            ]}
          >
              <Ionicons name="arrow-up-outline" size={16} color={SUCCESS_COLOR} />
            </View>
            <Text style={{ color: Colors.gray400, fontSize: 10, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" }}>
              Piutang
            </Text>
            <Text style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: "800", marginTop: 2 }}>
              {formatCurrency(totalLent)}
            </Text>
          </View>
        </View>

        {/* Tab Selection (Premium Style) */}
        <View style={[tw`flex-row p-1 rounded-2xl mb-6`, { backgroundColor: SURFACE_COLOR }]}>
          {(["borrowed", "lent"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  tw`flex-1 py-2.5 rounded-xl items-center justify-center`,
                  isActive ? { backgroundColor: ACCENT_COLOR } : null,
                ]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    color: isActive ? BACKGROUND_COLOR : TEXT_SECONDARY,
                    fontSize: 12,
                    fontWeight: isActive ? "700" : "500",
                  }}
                >
                  {tab === "borrowed" ? "🏦 Hutang Saya" : "💳 Piutang"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <SectionHeader title={activeTab === "borrowed" ? "Daftar Hutang" : "Daftar Piutang"} />

        {/* List Content */}
        {debts.length === 0 ? (
          <View style={tw`items-center py-16`}>
            <View style={[tw`w-16 h-16 rounded-full items-center justify-center mb-4`, { backgroundColor: `${SURFACE_COLOR}50` }]}>
              <Ionicons
                name={activeTab === "borrowed" ? "card-outline" : "people-outline"}
                size={32}
                color={Colors.gray500}
              />
            </View>
            <Text style={{ color: TEXT_SECONDARY, fontSize: 15, fontWeight: "600" }}>
              Kosong
            </Text>
            <Text style={{ color: Colors.gray500, fontSize: 12, marginTop: 4, textAlign: "center" }}>
              {activeTab === "borrowed"
                ? "Bagus! Kamu tidak punya beban hutang."
                : "Belum ada piutang yang tercatat."}
            </Text>
          </View>
        ) : (
          debts.map((debt) => {
            const progress = debt.amount > 0 ? (debt.amount - debt.remaining) / debt.amount : 0;
            const days = getDaysUntilDue(debt.dueDate);
            const isOverdue = days !== null && days < 0;
            const statusColor = STATUS_COLOR[debt.status];

            return (
              <TouchableOpacity
                key={debt.id}
                onPress={() => navigation.navigate("AddDebt", { editMode: true, debtData: debt })}
                activeOpacity={0.7}
                style={[
                  tw`rounded-2xl mb-4 p-4`,
                  {
                    backgroundColor: SURFACE_COLOR,
                    borderWidth: 1,
                    borderColor: debt.status === "paid" ? `${SUCCESS_COLOR}20` : BORDER_COLOR,
                  },
                ]}
              >
                {/* Top Info */}
                <View style={tw`flex-row justify-between items-start mb-3`}>
                  <View style={tw`flex-1`}>
                    <Text style={{ color: TEXT_PRIMARY, fontSize: 16, fontWeight: "700" }}>
                      {debt.name}
                    </Text>
                    <View style={tw`flex-row items-center mt-1`}>
                      <View style={[tw`px-1.5 py-0.5 rounded-md mr-2`, { backgroundColor: `${ACCENT_COLOR}10` }]}>
                        <Text style={{ color: ACCENT_COLOR, fontSize: 9, fontWeight: "700", textTransform: "uppercase" }}>
                          {debt.category}
                        </Text>
                      </View>
                      {debt.dueDate && debt.status !== "paid" && (
                        <Text style={{ color: isOverdue ? ERROR_COLOR : Colors.gray400, fontSize: 10 }}>
                          {isOverdue ? "Terlambat" : `H-${days}`}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={[tw`px-2 py-1 rounded-lg`, { backgroundColor: `${statusColor}15` }]}>
                    <Text style={{ color: statusColor, fontSize: 9, fontWeight: "800" }}>
                      {STATUS_LABEL[debt.status].toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Progress & Amount */}
                <View style={tw`flex-row justify-between items-end mb-2`}>
                   <View>
                     <Text style={{ color: Colors.gray500, fontSize: 10 }}>Sisa</Text>
                     <Text style={{ color: statusColor, fontSize: 18, fontWeight: "800" }}>
                        {formatCurrency(debt.remaining)}
                     </Text>
                   </View>
                   <Text style={{ color: Colors.gray500, fontSize: 11 }}>
                     Total: {formatCurrency(debt.amount)}
                   </Text>
                </View>

                <ThinBar progress={progress} color={debt.status === "paid" ? SUCCESS_COLOR : statusColor} />

                {/* Quick Actions inside Card */}
                {debt.status !== "paid" && (
                  <View style={tw`flex-row gap-2 mt-4`}>
                    <TouchableOpacity
                      style={[
                        tw`flex-1 py-2.5 rounded-xl items-center justify-center`,
                        { backgroundColor: `${ACCENT_COLOR}15` },
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        setPayModal({ visible: true, debt });
                        setPayAmount("");
                      }}
                    >
                      <Text style={{ color: ACCENT_COLOR, fontSize: 12, fontWeight: "700" }}>Bayar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        tw`flex-1 py-2.5 rounded-xl items-center justify-center`,
                        { backgroundColor: `${Colors.gray600}20` },
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(debt);
                      }}
                    >
                      <Text style={{ color: Colors.gray400, fontSize: 12, fontWeight: "600" }}>Hapus</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <Animated.View
        style={[
          tw`absolute bottom-6 right-5`,
          {
            width: 52,
            height: 52,
            borderRadius: 16,
            backgroundColor: ACCENT_COLOR,
            shadowColor: ACCENT_COLOR,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 10,
            elevation: 10,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={tw`w-full h-full items-center justify-center`}
          onPress={() => navigation.navigate("AddDebt")}
          activeOpacity={0.8}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Ionicons name="add" size={26} color={BACKGROUND_COLOR} />
        </TouchableOpacity>
      </Animated.View>

      {/* Pay Modal (Standardized Style) */}
      <Modal
        visible={payModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setPayModal({ visible: false, debt: null })}
      >
        <View style={[tw`flex-1 justify-center items-center p-6`, { backgroundColor: "rgba(2, 6, 23, 0.85)" }]}>
          <View style={[tw`w-full rounded-3xl p-6`, { backgroundColor: SURFACE_COLOR, borderWidth: 1, borderColor: BORDER_COLOR }]}>
            <Text style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: "800", marginBottom: 4 }}>
              Catat Pembayaran
            </Text>
            {payModal.debt && (
              <Text style={{ color: Colors.gray400, fontSize: 12, marginBottom: 20 }}>
                {payModal.debt.name} · Sisa {formatCurrency(payModal.debt.remaining)}
              </Text>
            )}

            <SectionHeader title="Nominal Bayar" />
            <TextInput
              value={payAmount}
              onChangeText={(t) => setPayAmount(t.replace(/\D/g, ""))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.gray500}
              autoFocus
              style={{
                backgroundColor: BACKGROUND_COLOR,
                borderRadius: 16,
                padding: 16,
                color: TEXT_PRIMARY,
                fontSize: 22,
                fontWeight: "800",
                marginBottom: 24,
                borderWidth: 1,
                borderColor: BORDER_COLOR,
              }}
            />

            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                style={[tw`flex-1 py-4 rounded-xl items-center`, { backgroundColor: `${Colors.gray600}20` }]}
                onPress={() => setPayModal({ visible: false, debt: null })}
              >
                <Text style={{ color: Colors.gray400, fontWeight: "600" }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[tw`flex-1 py-4 rounded-xl items-center`, { backgroundColor: ACCENT_COLOR }]}
                onPress={handlePay}
              >
                <Text style={{ color: BACKGROUND_COLOR, fontWeight: "800" }}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default DebtScreen;
