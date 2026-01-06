// File: src/screens/SavingsDetailScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { Text, ProgressBar } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";

import { useAppContext } from "../../context/AppContext";
import {
  formatCurrency,
  safeNumber,
  getSafePercentage,
} from "../../utils/calculations";
import { formatDate } from "../../utils/formatters";
import { Colors } from "../../theme/theme";

const SavingsDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { savingsId } = route.params;

  const { state, deleteSavings, refreshData, getSavingsTransactions } =
    useAppContext();
  const [refreshing, setRefreshing] = useState(false);

  // Temukan savings berdasarkan ID
  const saving = state.savings?.find((s) => s.id === savingsId);
  const savingsTransactions = getSavingsTransactions(savingsId);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  if (!saving) {
    return (
      <View
        style={tw.style(`flex-1 justify-center items-center p-4`, {
          backgroundColor: Colors.background,
        })}
      >
        <Ionicons name="warning-outline" size={48} color={Colors.error} />
        <Text
          style={tw.style(`text-lg font-semibold mt-4 mb-2`, {
            color: Colors.textPrimary,
          })}
        >
          Tabungan tidak ditemukan
        </Text>
        <TouchableOpacity
          style={tw.style(`mt-4 px-4 py-2 rounded-lg`, {
            backgroundColor: Colors.accent,
          })}
          onPress={() => navigation.goBack()}
        >
          <Text style={tw.style(`font-medium`, { color: Colors.textPrimary })}>
            Kembali
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const current = safeNumber(saving.current);
  const target = safeNumber(saving.target);
  const progress = getSafePercentage(current, target);
  const remaining = target - current;
  const isCompleted = current >= target;

  // Hitung statistik transaksi
  const stats = useMemo(() => {
    const deposits = savingsTransactions
      .filter((t) => t.type === "deposit" || t.type === "initial")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0);

    const withdrawals = savingsTransactions
      .filter((t) => t.type === "withdrawal")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0);

    const lastTransaction =
      savingsTransactions.length > 0
        ? savingsTransactions[savingsTransactions.length - 1]
        : null;

    return {
      deposits,
      withdrawals,
      transactionCount: savingsTransactions.length,
      lastTransactionDate: lastTransaction?.date,
    };
  }, [savingsTransactions]);

  // Format deadline
  const formatDeadlineInfo = () => {
    if (!saving.deadline)
      return { text: "Tanpa deadline", color: Colors.textTertiary };

    try {
      const deadlineDate = new Date(saving.deadline);
      const today = new Date();
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return { text: "Terlambat", color: Colors.error };
      if (diffDays === 0) return { text: "Hari ini", color: Colors.error };
      if (diffDays <= 7)
        return { text: `${diffDays} hari lagi`, color: Colors.warning };
      if (diffDays <= 30)
        return {
          text: `${Math.floor(diffDays / 7)} minggu lagi`,
          color: Colors.info,
        };
      return {
        text: `${Math.floor(diffDays / 30)} bulan lagi`,
        color: Colors.success,
      };
    } catch {
      return { text: saving.deadline, color: Colors.textTertiary };
    }
  };

  const deadlineInfo = formatDeadlineInfo();

  const handleDelete = () => {
    Alert.alert(
      "Hapus Tabungan",
      `Hapus tabungan "${saving.name}"? Semua riwayat transaksi juga akan dihapus.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSavings(saving.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Gagal menghapus tabungan");
            }
          },
        },
      ]
    );
  };

  // Render transaction item yang lebih minimalis
  const renderTransactionItem = (transaction: any, index: number) => {
    const isDeposit =
      transaction.type === "deposit" || transaction.type === "initial";

    return (
      <View
        key={transaction.id}
        style={[
          tw`py-3 px-4`,
          index < savingsTransactions.length - 1 && {
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
          },
        ]}
      >
        <View style={tw`flex-row justify-between items-center`}>
          <View style={tw`flex-row items-center gap-3`}>
            <View
              style={[
                tw`w-10 h-10 rounded-full items-center justify-center`,
                isDeposit
                  ? { backgroundColor: `${Colors.success}20` }
                  : { backgroundColor: `${Colors.error}20` },
              ]}
            >
              <Ionicons
                name={isDeposit ? "arrow-down" : "arrow-up"}
                size={18}
                color={isDeposit ? Colors.success : Colors.error}
              />
            </View>
            <View>
              <Text
                style={tw.style(`text-sm font-medium`, {
                  color: Colors.textPrimary,
                })}
              >
                {isDeposit ? "Setoran" : "Penarikan"}
              </Text>
              <Text
                style={tw.style(`text-xs mt-0.5`, {
                  color: Colors.textTertiary,
                })}
              >
                {formatDate(transaction.date)}
              </Text>
            </View>
          </View>

          <View style={tw`items-end`}>
            <Text
              style={[
                tw`text-base font-semibold`,
                isDeposit ? { color: Colors.success } : { color: Colors.error },
              ]}
            >
              {isDeposit ? "+" : "-"} {formatCurrency(transaction.amount)}
            </Text>
            <Text
              style={tw.style(`text-xs mt-0.5`, { color: Colors.textTertiary })}
            >
              Saldo: {formatCurrency(transaction.newBalance)}
            </Text>
          </View>
        </View>
        {transaction.note && (
          <Text
            style={tw.style(`text-xs mt-2 ml-13`, {
              color: Colors.textTertiary,
            })}
          >
            {transaction.note}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={tw.style(`flex-1`, { backgroundColor: Colors.background })}>
      {/* Header - Super Minimalis */}
      <View
        style={tw.style(`px-4 pt-2 pb-3`, { backgroundColor: Colors.surface })}
      >
        {/* Navigation Bar */}
        <View style={tw`flex-row justify-between items-center mb-2`}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2`}>
            <Ionicons name="chevron-back" size={22} color={Colors.accent} />
          </TouchableOpacity>

          <View style={tw`flex-row gap-1`}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("AddSavings", {
                  editMode: true,
                  savingsData: saving,
                });
              }}
              style={tw`p-2`}
            >
              <Ionicons name="create-outline" size={20} color={Colors.accent} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDelete} style={tw`p-2`}>
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Savings Info - Ultra Minimalis */}
        <View style={tw`items-center`}>
          <View
            style={[
              tw`w-14 h-14 rounded-full items-center justify-center mb-2`,
              {
                backgroundColor: `${
                  isCompleted ? Colors.success : Colors.accent
                }20`,
              },
            ]}
          >
            <Ionicons
              name={(saving.icon as any) || "wallet-outline"}
              size={24}
              color={isCompleted ? Colors.success : Colors.accent}
            />
          </View>

          <Text
            style={tw.style(`text-lg font-semibold text-center`, {
              color: Colors.textPrimary,
            })}
          >
            {saving.name}
          </Text>

          {saving.description && (
            <Text
              style={tw.style(`text-xs text-center mt-0.5 leading-4`, {
                color: Colors.textSecondary,
              })}
            >
              {saving.description}
            </Text>
          )}
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={tw`pb-24`}
      >
        {/* Progress Card - Minimalis */}
        <View style={tw`mx-4 mt-4`}>
          {/* Header Progress */}
          <View style={tw`flex-row justify-between items-center mb-3`}>
            <Text
              style={tw.style(`text-sm font-medium`, {
                color: Colors.textPrimary,
              })}
            >
              Progress Tabungan
            </Text>
            <View style={tw`flex-row items-center gap-1`}>
              <Ionicons
                name={isCompleted ? "checkmark-circle" : "time-outline"}
                size={14}
                color={isCompleted ? Colors.success : Colors.accent}
              />
              <Text
                style={tw.style(
                  `text-xs font-medium`,
                  isCompleted
                    ? { color: Colors.success }
                    : { color: Colors.accent }
                )}
              >
                {progress.toFixed(1)}%
              </Text>
            </View>
          </View>

          {/* Progress Bar dengan Label */}
          <View style={tw`mb-4`}>
            <ProgressBar
              progress={Math.min(progress / 100, 1)}
              color={isCompleted ? Colors.success : Colors.accent}
              style={tw.style(`h-1.5 rounded-full`, {
                backgroundColor: Colors.surfaceLight,
              })}
            />
            <View style={tw`flex-row justify-between mt-1`}>
              <Text style={tw.style(`text-xs`, { color: Colors.textTertiary })}>
                Rp0
              </Text>
              <Text style={tw.style(`text-xs`, { color: Colors.textTertiary })}>
                {formatCurrency(target)}
              </Text>
            </View>
          </View>

          {/* Angka-angka Penting - Compact Layout */}
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <View style={tw`items-center`}>
              <Text
                style={tw.style(`text-xs mb-0.5`, {
                  color: Colors.textSecondary,
                })}
              >
                Terkumpul
              </Text>
              <Text
                style={tw.style(`text-base font-bold`, {
                  color: Colors.success,
                })}
              >
                {formatCurrency(current)}
              </Text>
            </View>

            <Ionicons
              name="arrow-forward"
              size={16}
              color={Colors.textTertiary}
            />

            <View style={tw`items-center`}>
              <Text
                style={tw.style(`text-xs mb-0.5`, {
                  color: Colors.textSecondary,
                })}
              >
                Target
              </Text>
              <Text
                style={tw.style(`text-base font-bold`, {
                  color: Colors.textPrimary,
                })}
              >
                {formatCurrency(target)}
              </Text>
            </View>

            <Ionicons
              name="arrow-forward"
              size={16}
              color={Colors.textTertiary}
            />

            <View style={tw`items-center`}>
              <Text
                style={tw.style(`text-xs mb-0.5`, {
                  color: Colors.textSecondary,
                })}
              >
                Sisa
              </Text>
              <Text
                style={tw.style(
                  `text-base font-bold`,
                  remaining >= 0
                    ? { color: Colors.accent }
                    : { color: Colors.error }
                )}
              >
                {formatCurrency(remaining)}
              </Text>
            </View>
          </View>

          {/* Info Status & Deadline - Single Line */}
          <View
            style={tw.style(
              `flex-row justify-between items-center py-2 border-t`,
              { borderColor: Colors.border }
            )}
          >
            <View style={tw`flex-row items-center gap-2`}>
              <View
                style={[
                  tw`w-2 h-2 rounded-full`,
                  { backgroundColor: deadlineInfo.color },
                ]}
              />
              <Text
                style={tw.style(`text-xs`, { color: Colors.textSecondary })}
              >
                {deadlineInfo.text}
              </Text>
            </View>

            <View style={tw`flex-row items-center gap-1`}>
              <View
                style={[
                  tw`w-2 h-2 rounded-full`,
                  {
                    backgroundColor: isCompleted
                      ? Colors.success
                      : Colors.accent,
                  },
                ]}
              />
              <Text
                style={tw.style(`text-xs`, { color: Colors.textSecondary })}
              >
                {isCompleted ? "Selesai" : "Berlangsung"}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Cards - Super Minimalis */}
        <View style={tw`flex-row mx-4 mt-3 gap-2`}>
          <View style={tw`flex-1`}>
            <View
              style={tw.style(`rounded-lg p-3`, {
                backgroundColor: `${Colors.success}20`,
              })}
            >
              <View style={tw`flex-row items-center justify-between mb-1`}>
                <Text
                  style={tw.style(`text-xs font-medium`, {
                    color: Colors.success,
                  })}
                >
                  Setoran
                </Text>
                <Ionicons name="arrow-down" size={12} color={Colors.success} />
              </View>
              <Text
                style={tw.style(`text-sm font-bold`, { color: Colors.success })}
              >
                {formatCurrency(stats.deposits)}
              </Text>
            </View>
          </View>

          <View style={tw`flex-1`}>
            <View
              style={tw.style(`rounded-lg p-3`, {
                backgroundColor: `${Colors.error}20`,
              })}
            >
              <View style={tw`flex-row items-center justify-between mb-1`}>
                <Text
                  style={tw.style(`text-xs font-medium`, {
                    color: Colors.error,
                  })}
                >
                  Penarikan
                </Text>
                <Ionicons name="arrow-up" size={12} color={Colors.error} />
              </View>
              <Text
                style={tw.style(`text-sm font-bold`, { color: Colors.error })}
              >
                {formatCurrency(stats.withdrawals)}
              </Text>
            </View>
          </View>

          <View style={tw`flex-1`}>
            <View
              style={tw.style(`rounded-lg p-3`, {
                backgroundColor: Colors.surfaceLight,
              })}
            >
              <View style={tw`flex-row items-center justify-between mb-1`}>
                <Text
                  style={tw.style(`text-xs font-medium`, {
                    color: Colors.textPrimary,
                  })}
                >
                  Transaksi
                </Text>
                <Ionicons
                  name="receipt-outline"
                  size={12}
                  color={Colors.textTertiary}
                />
              </View>
              <Text
                style={tw.style(`text-sm font-bold`, {
                  color: Colors.textPrimary,
                })}
              >
                {stats.transactionCount}
              </Text>
            </View>
          </View>
        </View>

        {/* Transactions Section */}
        <View
          style={tw.style(`mx-4 mt-4 rounded-xl border`, {
            backgroundColor: Colors.surface,
            borderColor: Colors.border,
          })}
        >
          <View
            style={tw.style(`px-4 py-3 border-b`, {
              borderColor: Colors.border,
            })}
          >
            <View style={tw`flex-row justify-between items-center`}>
              <Text
                style={tw.style(`text-base font-semibold`, {
                  color: Colors.textPrimary,
                })}
              >
                Riwayat Transaksi
              </Text>
              {savingsTransactions.length > 0 && (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("SavingsHistory", { savingsId })
                  }
                >
                  <Text
                    style={tw.style(`text-sm font-medium`, {
                      color: Colors.accent,
                    })}
                  >
                    Lihat Semua
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {savingsTransactions.length === 0 ? (
            <View style={tw`py-8 px-4 items-center`}>
              <View
                style={tw.style(
                  `w-16 h-16 rounded-full items-center justify-center mb-3`,
                  { backgroundColor: Colors.surfaceLight }
                )}
              >
                <Ionicons
                  name="receipt-outline"
                  size={24}
                  color={Colors.textTertiary}
                />
              </View>
              <Text
                style={tw.style(`text-base font-semibold mb-2`, {
                  color: Colors.textPrimary,
                })}
              >
                Belum ada transaksi
              </Text>
              <Text
                style={tw.style(`text-sm text-center mb-4`, {
                  color: Colors.textSecondary,
                })}
              >
                Mulai dengan menambahkan setoran pertama
              </Text>
              <TouchableOpacity
                style={tw.style(`px-4 py-2 rounded-lg`, {
                  backgroundColor: Colors.accent,
                })}
                onPress={() => {
                  navigation.navigate("AddSavingsTransaction", {
                    savingsId: saving.id,
                    type: "deposit",
                  });
                }}
              >
                <Text
                  style={tw.style(`font-medium`, { color: Colors.textPrimary })}
                >
                  Tambah Setoran
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            savingsTransactions
              .slice(0, 10)
              .map((transaction, index) =>
                renderTransactionItem(transaction, index)
              )
          )}
        </View>

        {/* Action Buttons - Sticky di bottom scroll */}
        <View style={tw`mx-4 mt-4 mb-8`}>
          {!isCompleted && (
            <TouchableOpacity
              style={tw.style(`rounded-xl py-3 items-center shadow-sm`, {
                backgroundColor: Colors.accent,
              })}
              onPress={() => {
                navigation.navigate("AddSavingsTransaction", {
                  savingsId: saving.id,
                  type: "deposit",
                });
              }}
            >
              <Text
                style={tw.style(`font-semibold`, { color: Colors.textPrimary })}
              >
                + Tambah Setoran
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              tw.style(`border rounded-xl py-3 items-center`, {
                borderColor: Colors.border,
              }),
              !isCompleted && tw`mt-3`,
            ]}
            onPress={() => {
              navigation.navigate("AddSavingsTransaction", {
                savingsId: saving.id,
                type: "withdrawal",
              });
            }}
          >
            <Text
              style={tw.style(`font-medium`, { color: Colors.textPrimary })}
            >
              Penarikan Dana
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default SavingsDetailScreen;
