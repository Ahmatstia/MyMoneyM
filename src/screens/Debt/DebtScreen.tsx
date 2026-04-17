// File: src/screens/Debt/DebtScreen.tsx
import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import { Debt } from "../../types";
import { Colors } from "../../theme/theme";

const formatCurrency = (amount: number) => {
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  return `Rp ${amount.toLocaleString("id-ID")}`;
};

const STATUS_COLOR: Record<Debt["status"], string> = {
  active: Colors.error,
  partial: Colors.warning,
  paid: Colors.success,
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

  const debts = (state.debts || []).filter((d) => d.type === activeTab);

  // Ringkasan
  const totalBorrowed = (state.debts || [])
    .filter((d) => d.type === "borrowed" && d.status !== "paid")
    .reduce((s, d) => s + d.remaining, 0);
  const totalLent = (state.debts || [])
    .filter((d) => d.type === "lent" && d.status !== "paid")
    .reduce((s, d) => s + d.remaining, 0);

  const handleDelete = (debt: Debt) => {
    Alert.alert(
      "Hapus Hutang",
      `Yakin ingin menghapus hutang "${debt.name}"?`,
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
      Alert.alert("Error", "Nominal melebihi sisa hutang");
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
    <View style={[tw`flex-1`, { backgroundColor: Colors.background }]}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: Colors.surface,
        }}
      >
        <View style={tw`flex-row justify-between items-center`}>
          <Text style={{ color: Colors.textPrimary, fontSize: 22, fontWeight: "700" }}>
            Hutang & Piutang
          </Text>
          <TouchableOpacity
            style={[
              tw`flex-row items-center px-3 py-2 rounded-xl`,
              { backgroundColor: `${Colors.accent}18` },
            ]}
            onPress={() => navigation.navigate("AddDebt")}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color={Colors.accent} />
            <Text style={{ color: Colors.accent, fontSize: 13, fontWeight: "600", marginLeft: 4 }}>
              Tambah
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={tw`flex-row gap-3 px-4 pt-4 pb-2`}>
        {/* Hutang Saya */}
        <View
          style={[
            tw`flex-1 rounded-2xl p-4`,
            { backgroundColor: `${Colors.error}12`, borderWidth: 1, borderColor: `${Colors.error}25` },
          ]}
        >
          <View style={tw`flex-row items-center mb-2`}>
            <Ionicons name="arrow-down-circle-outline" size={16} color={Colors.error} />
            <Text style={{ color: Colors.error, fontSize: 11, fontWeight: "600", marginLeft: 5 }}>
              HUTANG SAYA
            </Text>
          </View>
          <Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: "800" }}>
            {formatCurrency(totalBorrowed)}
          </Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 10, marginTop: 2 }}>
            Total belum lunas
          </Text>
        </View>

        {/* Piutang */}
        <View
          style={[
            tw`flex-1 rounded-2xl p-4`,
            { backgroundColor: `${Colors.success}12`, borderWidth: 1, borderColor: `${Colors.success}25` },
          ]}
        >
          <View style={tw`flex-row items-center mb-2`}>
            <Ionicons name="arrow-up-circle-outline" size={16} color={Colors.success} />
            <Text style={{ color: Colors.success, fontSize: 11, fontWeight: "600", marginLeft: 5 }}>
              PIUTANG
            </Text>
          </View>
          <Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: "800" }}>
            {formatCurrency(totalLent)}
          </Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 10, marginTop: 2 }}>
            Yang belum kembali
          </Text>
        </View>
      </View>

      {/* Tab */}
      <View style={tw`flex-row px-4 py-2 gap-2`}>
        {(["borrowed", "lent"] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                tw`flex-1 py-2 rounded-full items-center`,
                isActive
                  ? { backgroundColor: Colors.accent }
                  : { backgroundColor: Colors.surface },
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: isActive ? Colors.background : Colors.textSecondary,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {tab === "borrowed" ? "🏦 Hutang Saya" : "💳 Piutang"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {debts.length === 0 ? (
          <View style={tw`items-center py-16`}>
            <Ionicons
              name={activeTab === "borrowed" ? "card-outline" : "people-outline"}
              size={48}
              color={Colors.gray400}
            />
            <Text
              style={{
                color: Colors.textSecondary,
                fontSize: 15,
                fontWeight: "600",
                marginTop: 12,
                textAlign: "center",
              }}
            >
              {activeTab === "borrowed"
                ? "Tidak ada hutang aktif 🎉"
                : "Tidak ada piutang tercatat"}
            </Text>
            <Text
              style={{
                color: Colors.gray400,
                fontSize: 12,
                marginTop: 6,
                textAlign: "center",
              }}
            >
              Tekan tombol Tambah untuk mencatat
            </Text>
          </View>
        ) : (
          debts.map((debt) => {
            const progress = debt.amount > 0 ? (debt.amount - debt.remaining) / debt.amount : 0;
            const days = getDaysUntilDue(debt.dueDate);
            const isOverdue = days !== null && days < 0;
            const statusColor = STATUS_COLOR[debt.status];

            return (
              <View
                key={debt.id}
                style={[
                  tw`rounded-2xl mb-3 p-4`,
                  {
                    backgroundColor: Colors.surface,
                    borderWidth: 1,
                    borderColor: debt.status === "paid" ? `${Colors.success}25` : Colors.border,
                  },
                ]}
              >
                {/* Top row */}
                <View style={tw`flex-row justify-between items-start mb-3`}>
                  <View style={tw`flex-1`}>
                    <Text
                      style={{
                        color: Colors.textPrimary,
                        fontSize: 15,
                        fontWeight: "700",
                      }}
                    >
                      {debt.name}
                    </Text>
                    <Text style={{ color: Colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                      {debt.category}
                      {debt.description ? ` • ${debt.description}` : ""}
                    </Text>
                  </View>
                  <View
                    style={[
                      tw`px-2 py-1 rounded-full`,
                      { backgroundColor: `${statusColor}20` },
                    ]}
                  >
                    <Text
                      style={{ color: statusColor, fontSize: 10, fontWeight: "700" }}
                    >
                      {STATUS_LABEL[debt.status]}
                    </Text>
                  </View>
                </View>

                {/* Amount */}
                <View style={tw`flex-row justify-between items-center mb-2`}>
                  <Text style={{ color: Colors.gray400, fontSize: 11 }}>Total</Text>
                  <Text
                    style={{
                      color: Colors.textPrimary,
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    {formatCurrency(debt.amount)}
                  </Text>
                </View>
                {debt.status !== "paid" && (
                  <View style={tw`flex-row justify-between items-center mb-2`}>
                    <Text style={{ color: Colors.gray400, fontSize: 11 }}>Sisa</Text>
                    <Text
                      style={{
                        color: statusColor,
                        fontSize: 14,
                        fontWeight: "800",
                      }}
                    >
                      {formatCurrency(debt.remaining)}
                    </Text>
                  </View>
                )}

                {/* Progress bar */}
                {debt.amount > 0 && (
                  <View style={{ height: 4, backgroundColor: Colors.surfaceLight, borderRadius: 4, marginBottom: 8 }}>
                    <View
                      style={{
                        height: 4,
                        borderRadius: 4,
                        width: `${Math.min(progress * 100, 100)}%`,
                        backgroundColor: debt.status === "paid" ? Colors.success : Colors.accent,
                      }}
                    />
                  </View>
                )}

                {/* Due date */}
                {debt.dueDate && debt.status !== "paid" && (
                  <Text
                    style={{
                      color: isOverdue ? Colors.error : Colors.gray400,
                      fontSize: 11,
                      marginBottom: 8,
                    }}
                  >
                    {isOverdue
                      ? `⚠️ Jatuh tempo ${Math.abs(days!)} hari lalu`
                      : days === 0
                      ? "⏰ Jatuh tempo hari ini!"
                      : `📅 Jatuh tempo dalam ${days} hari`}
                  </Text>
                )}

                {/* Actions */}
                {debt.status !== "paid" && (
                  <View style={tw`flex-row gap-2 mt-1`}>
                    <TouchableOpacity
                      style={[
                        tw`flex-1 py-2 rounded-xl items-center`,
                        { backgroundColor: `${Colors.accent}18` },
                      ]}
                      onPress={() => {
                        setPayModal({ visible: true, debt });
                        setPayAmount("");
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          color: Colors.accent,
                          fontSize: 12,
                          fontWeight: "600",
                        }}
                      >
                        💸 Bayar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        tw`flex-1 py-2 rounded-xl items-center`,
                        { backgroundColor: Colors.surfaceLight },
                      ]}
                      onPress={() =>
                        navigation.navigate("AddDebt", {
                          editMode: true,
                          debtData: debt,
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          color: Colors.textSecondary,
                          fontSize: 12,
                          fontWeight: "600",
                        }}
                      >
                        ✏️ Edit
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        tw`py-2 px-3 rounded-xl items-center`,
                        { backgroundColor: `${Colors.error}15` },
                      ]}
                      onPress={() => handleDelete(debt)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={14} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                )}

                {debt.status === "paid" && (
                  <View style={tw`flex-row justify-between items-center`}>
                    <Text style={{ color: Colors.success, fontSize: 12, fontWeight: "600" }}>
                      ✅ Sudah Lunas
                    </Text>
                    <TouchableOpacity onPress={() => handleDelete(debt)} activeOpacity={0.7}>
                      <Ionicons name="trash-outline" size={16} color={Colors.gray400} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Pay Modal */}
      <Modal
        visible={payModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setPayModal({ visible: false, debt: null })}
      >
        <View
          style={[
            tw`flex-1 justify-center items-center`,
            { backgroundColor: "rgba(0,0,0,0.6)" },
          ]}
        >
          <View
            style={[
              tw`mx-6 rounded-2xl p-6`,
              { backgroundColor: Colors.surface, width: "90%" },
            ]}
          >
            <Text
              style={{
                color: Colors.textPrimary,
                fontSize: 17,
                fontWeight: "700",
                marginBottom: 4,
              }}
            >
              Catat Pembayaran
            </Text>
            {payModal.debt && (
              <Text style={{ color: Colors.textSecondary, fontSize: 13, marginBottom: 16 }}>
                {payModal.debt.name} • Sisa {formatCurrency(payModal.debt.remaining)}
              </Text>
            )}
            <Text style={{ color: Colors.gray400, fontSize: 11, marginBottom: 6 }}>
              Nominal Bayar
            </Text>
            <TextInput
              value={payAmount}
              onChangeText={(t) => setPayAmount(t.replace(/\D/g, ""))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.gray400}
              style={{
                backgroundColor: Colors.background,
                borderRadius: 12,
                padding: 12,
                color: Colors.textPrimary,
                fontSize: 16,
                fontWeight: "700",
                marginBottom: 16,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            />
            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                style={[
                  tw`flex-1 py-3 rounded-xl items-center`,
                  { backgroundColor: Colors.surfaceLight },
                ]}
                onPress={() => setPayModal({ visible: false, debt: null })}
                activeOpacity={0.7}
              >
                <Text style={{ color: Colors.textSecondary, fontWeight: "600" }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  tw`flex-1 py-3 rounded-xl items-center`,
                  { backgroundColor: Colors.accent },
                ]}
                onPress={handlePay}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    color: Colors.background,
                    fontWeight: "700",
                    fontSize: 14,
                  }}
                >
                  Simpan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DebtScreen;
