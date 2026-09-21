// File: src/screens/Tools/ToolsScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, KeyboardAvoidingView, Platform, Keyboard, Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../../context/AppContext";
import { Colors } from "../../theme/theme";
import { useTheme } from "../../theme/ThemeContext";
import { formatCurrency, safeNumber } from "../../utils/calculations";

// ── Design tokens (konsisten dgn seluruh app) ────────────────────────────────
const BG     = Colors.background;
const SURF   = Colors.surface;
const ACCENT = Colors.accent;
const TP     = Colors.textPrimary;
const TS     = Colors.textSecondary;
const BORDER = "rgba(255,255,255,0.06)";
const R      = 20;
const PAD    = 20;

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => formatCurrency(n);

function daysLeftInMonth(): number {
  const now   = new Date();
  const last  = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return last.getDate() - now.getDate() + 1;
}

// ── Small reusable components ────────────────────────────────────────────────
const Label = ({ text }: { text: string }) => (
  <Text style={{ color: Colors.gray400, fontSize: 10, fontWeight: "700",
    letterSpacing: 1.1, textTransform: "uppercase", marginBottom: 8 }}>
    {text}
  </Text>
);

const InputBox = ({
  value, onChange, placeholder, isCurrency = true
}: { value: string; onChange: (t: string) => void; placeholder?: string; isCurrency?: boolean }) => {
  const displayValue = value
    ? (isCurrency
        ? `Rp ${parseInt(value, 10).toLocaleString("id-ID")}`
        : parseInt(value, 10).toLocaleString("id-ID"))
    : "";

  return (
    <TextInput
      value={displayValue}
      onChangeText={t => onChange(t.replace(/\D/g, ""))}
      keyboardType="numeric"
      placeholder={placeholder ?? "0"}
      placeholderTextColor={Colors.gray500}
      style={{
        backgroundColor: BG, borderRadius: 14, padding: 14,
        color: TP, fontSize: 20, fontWeight: "800",
        marginBottom: 16, borderWidth: 1, borderColor: BORDER,
      }}
    />
  );
};

const ResultRow = ({
  label, value, color,
}: { label: string; value: string; color?: string }) => (
  <View style={{ flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: BORDER }}>
    <Text style={{ color: TS, fontSize: 13 }}>{label}</Text>
    <Text style={{ color: color ?? ACCENT, fontSize: 14, fontWeight: "700" }}>{value}</Text>
  </View>
);

// ═════════════════════════════════════════════════════════════════════════════
// CALCULATOR MODALS
// ═════════════════════════════════════════════════════════════════════════════

// 1. Batas Aman Harian
const DailyLimitCalc = ({ visible, onClose, balance, totalDebt }: {
  visible: boolean; onClose: () => void; balance: number; totalDebt: number;
}) => {
  // Custom flexibility
  const [customBalance, setCustomBalance] = useState(String(balance));
  const [days, setDays]       = useState("");
  const [reserve, setReserve] = useState("");

  // Reset & sync every time modal opens
  React.useEffect(() => {
    if (visible) {
      handleRefresh();
    }
  }, [visible, balance]);

  const handleRefresh = () => {
    setCustomBalance(String(balance));
    setDays("");
    setReserve("");
  };

  const remainingDays = daysLeftInMonth();
  const currentBal    = safeNumber(Number(customBalance));
  const safeBalance   = Math.max(0, currentBal - totalDebt - safeNumber(Number(reserve)));
  const numDays       = days ? Math.max(1, Number(days)) : remainingDays;
  const perDay        = safeBalance / numDays;
  const perWeek       = perDay * 7;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: "rgba(2,6,23,0.88)" }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        />
        <View style={{ backgroundColor: SURF, borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: PAD, paddingBottom: 24, borderTopWidth: 1, borderTopColor: BORDER, maxHeight: "88%" }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${ACCENT}18`,
              alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <Ionicons name="shield-checkmark-outline" size={20} color={ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TP, fontSize: 16, fontWeight: "800" }}>Batas Aman Harian</Text>
              <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 2 }}>
                Hitung jatah aman per hari
              </Text>
            </View>
            <TouchableOpacity onPress={handleRefresh} style={{ marginRight: 16 }}>
              <Ionicons name="refresh" size={24} color={Colors.gray400} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={Colors.gray500} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <Label text="Dana yang Tersedia (Bisa Diubah)" />
            <InputBox value={customBalance} onChange={setCustomBalance} placeholder="Saldo saat ini" />

            <Label text="Reservasi / Keperluan Wajib" />
            <InputBox value={reserve} onChange={setReserve} placeholder="Misal: tagihan, dll" />

            <Label text={`Jumlah Hari (Default: ${remainingDays} Hari)`} />
            <InputBox value={days} onChange={setDays} placeholder={`Sisa ${remainingDays} hari`} isCurrency={false} />

            <View style={{ backgroundColor: `${ACCENT}10`, borderRadius: 16, padding: 16,
              borderWidth: 1, borderColor: `${ACCENT}20`, marginTop: 4 }}>
              <Text style={{ color: TP, fontSize: 13, fontWeight: "700", marginBottom: 12 }}>
                Kesimpulan untukmu:
              </Text>
              
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: TS, fontSize: 12, marginBottom: 4 }}>Uang yang BISA dipakai</Text>
                <Text style={{ color: ACCENT, fontSize: 20, fontWeight: "800" }}>{fmt(safeBalance)}</Text>
                {totalDebt > 0 && (
                   <Text style={{ color: Colors.error, fontSize: 10, marginTop: 4 }}>*Telah dipotong hutang ({fmt(totalDebt)})</Text>
                )}
              </View>

              <View style={{ height: 1, backgroundColor: BORDER, marginBottom: 12 }} />

              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: TS, fontSize: 12, marginBottom: 4 }}>Maka, jatah maksimal belanjamu:</Text>
                <Text style={{ color: Colors.success, fontSize: 24, fontWeight: "800" }}>{fmt(perDay)} <Text style={{fontSize: 14, color: TS, fontWeight: "600"}}>/ hari</Text></Text>
              </View>

              <View style={{ marginTop: 4, padding: 10, borderRadius: 10,
                backgroundColor: perDay < 50000 ? `${Colors.error}15` : `${Colors.success}15` }}>
                <Text style={{ color: perDay < 50000 ? Colors.error : Colors.success,
                  fontSize: 12, fontWeight: "700", textAlign: "center", lineHeight: 18 }}>
                  {perDay < 50000
                    ? "⚠️ Anggaran cukup ketat! Sebaiknya mulai berhemat dari sekarang."
                    : "✅ Anggaran aman. Kamu bisa pakai sesuai jatah harian di atas."}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// 2. Bagi Anggaran 50/30/20
const SalaryCalc = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [salary, setSalary] = useState("");
  const [extra, setExtra]   = useState("");

  const handleRefresh = () => {
    setSalary("");
    setExtra("");
  };

  const total    = safeNumber(Number(salary)) + safeNumber(Number(extra));
  const needs    = total * 0.50;
  const wants    = total * 0.30;
  const savings  = total * 0.20;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: "rgba(2,6,23,0.88)" }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        />
        <View style={{ backgroundColor: SURF, borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: PAD, paddingBottom: 24, borderTopWidth: 1, borderTopColor: BORDER, maxHeight: "88%" }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${Colors.success}18`,
              alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <Ionicons name="pie-chart-outline" size={20} color={Colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TP, fontSize: 16, fontWeight: "800" }}>Bagi Anggaran 50/30/20</Text>
              <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 2 }}>
                Alokasi pemasukan otomatis: Kebutuhan, Keinginan, Tabungan
              </Text>
            </View>
            <TouchableOpacity onPress={handleRefresh} style={{ marginRight: 16 }}>
              <Ionicons name="refresh" size={24} color={Colors.gray400} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={Colors.gray500} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <Label text="Pemasukan Utama" />
            <InputBox value={salary} onChange={setSalary} placeholder="Nominal uang masuk utama" />
            <Label text="Pemasukan Tambahan (opsional)" />
            <InputBox value={extra} onChange={setExtra} placeholder="Freelance, uang saku, bonus, dll" />

            <View style={{ backgroundColor: `${Colors.success}10`, borderRadius: 16, padding: 16,
              borderWidth: 1, borderColor: `${Colors.success}20` }}>
              <Text style={{ color: Colors.gray400, fontSize: 10, fontWeight: "700",
                textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                Total: {fmt(total)}
              </Text>
              {[
                { pct: "50%", label: "🏠 Kebutuhan Pokok", sub: "Makan, kos, listrik, transportasi", val: needs, c: Colors.info },
                { pct: "30%", label: "🎮 Keinginan", sub: "Nongkrong, hiburan, belanja", val: wants, c: Colors.warning },
                { pct: "20%", label: "🏦 Tabungan & Investasi", sub: "Dana darurat, tabungan, hutang", val: savings, c: Colors.success },
              ].map((row) => (
                <View key={row.pct} style={{ backgroundColor: `${row.c}12`, borderRadius: 12, padding: 12,
                  marginBottom: 8, borderWidth: 1, borderColor: `${row.c}20` }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View>
                      <Text style={{ color: TP, fontSize: 13, fontWeight: "700" }}>{row.label}</Text>
                      <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 2 }}>{row.sub}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ color: row.c, fontSize: 15, fontWeight: "800" }}>{fmt(row.val)}</Text>
                      <Text style={{ color: Colors.gray500, fontSize: 10 }}>{row.pct}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// 3. Beli atau Tunda?
const BuyOrWaitCalc = ({ visible, onClose, balance, avgExpense }: {
  visible: boolean; onClose: () => void; balance: number; avgExpense: number;
}) => {
  const [price, setPrice]   = useState("");
  const [label, setLabel]   = useState("");
  
  // Custom flexibility
  const [customBalance, setCustomBalance] = useState(String(balance));
  const [customDays, setCustomDays]       = useState("");

  // Reset & sync every time modal opens
  React.useEffect(() => {
    if (visible) {
      handleRefresh();
    }
  }, [visible, balance]);

  const handleRefresh = () => {
    setCustomBalance(String(balance));
    setCustomDays("");
    setPrice("");
    setLabel("");
  };

  const remainingDays = daysLeftInMonth();
  const itemPrice    = safeNumber(Number(price));
  const currentBal   = safeNumber(Number(customBalance));
  const numDays      = customDays ? Math.max(1, Number(customDays)) : remainingDays;
  const afterBuy     = currentBal - itemPrice;
  const dailyAfter   = numDays > 0 ? afterBuy / numDays : 0;
  const canBuy       = afterBuy >= 0 && dailyAfter >= 30000;
  const savePerDay   = 50000;
  const daysToSave   = itemPrice > 0 ? Math.ceil(itemPrice / savePerDay) : 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: "rgba(2,6,23,0.88)" }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        />
        <View style={{ backgroundColor: SURF, borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: PAD, paddingBottom: 24, borderTopWidth: 1, borderTopColor: BORDER, maxHeight: "88%" }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${Colors.warning}18`,
              alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <Ionicons name="cart-outline" size={20} color={Colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TP, fontSize: 16, fontWeight: "800" }}>Beli atau Tunda?</Text>
              <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 2 }}>
                Simulasikan dampak pembelian
              </Text>
            </View>
            <TouchableOpacity onPress={handleRefresh} style={{ marginRight: 16 }}>
              <Ionicons name="refresh" size={24} color={Colors.gray400} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={Colors.gray500} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <Label text="Dana yang Tersedia (Bisa Diubah)" />
            <InputBox value={customBalance} onChange={setCustomBalance} placeholder="Saldo saat ini" />

            <Label text="Harga Barang" />
            <InputBox value={price} onChange={setPrice} placeholder="Masukkan harga" />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Label text="Nama Barang (Opsional)" />
                <TextInput
                  value={label} onChangeText={setLabel} placeholder="Misal: Sepatu"
                  placeholderTextColor={Colors.gray500}
                  style={{ backgroundColor: BG, borderRadius: 14, padding: 14, color: TP,
                    fontSize: 15, marginBottom: 16, borderWidth: 1, borderColor: BORDER }}
                />
              </View>
              <View style={{ flex: 0.9 }}>
                <Label text={`Hari (Default: ${remainingDays})`} />
                <InputBox value={customDays} onChange={setCustomDays} placeholder={String(remainingDays)} isCurrency={false} />
              </View>
            </View>

            {itemPrice > 0 && (
              <View style={{ borderRadius: 16, padding: 16, borderWidth: 1,
                backgroundColor: canBuy ? `${Colors.success}10` : `${Colors.error}10`,
                borderColor: canBuy ? `${Colors.success}25` : `${Colors.error}25` }}>
                <Text style={{ color: canBuy ? Colors.success : Colors.error,
                  fontSize: 15, fontWeight: "800", marginBottom: 12, textAlign: "center" }}>
                  {canBuy ? "✅ AMAN DIBELI SEKARANG" : "🔴 SEBAIKNYA DITUNDA"}
                </Text>
                
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: TS, fontSize: 12, marginBottom: 4 }}>Jika dibeli, sisa uangmu tinggal:</Text>
                  <Text style={{ color: afterBuy < 0 ? Colors.error : TP, fontSize: 18, fontWeight: "800" }}>{fmt(afterBuy)}</Text>
                </View>
                
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: TS, fontSize: 12, marginBottom: 4 }}>Jatah makan/hari jadi sisa:</Text>
                  <Text style={{ color: dailyAfter < 30000 ? Colors.error : Colors.success, fontSize: 18, fontWeight: "800" }}>{fmt(dailyAfter)} <Text style={{fontSize: 12, color: TS, fontWeight: "600"}}>/ hari</Text></Text>
                </View>
                
                {!canBuy && (
                  <View style={{ marginTop: 10, backgroundColor: `${Colors.info}15`, borderRadius: 10,
                    padding: 10, borderWidth: 1, borderColor: `${Colors.info}25` }}>
                    <Text style={{ color: Colors.info, fontSize: 12, fontWeight: "600", lineHeight: 18 }}>
                      💡 Saran: Tahan dulu! Coba sisihkan {fmt(savePerDay)}/hari. Kamu bisa beli {label || 'barang ini'} dalam <Text style={{ fontWeight: "800" }}>{daysToSave} hari</Text> tanpa khawatir melarat.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// 4. Nafas Hidup
const RunwayCalc = ({ visible, onClose, balance, avgExpense }: {
  visible: boolean; onClose: () => void; balance: number; avgExpense: number;
}) => {
  const dailyAvg   = avgExpense / 30;
  const isDeficit  = balance <= 0;
  const runwayDays = !isDeficit && dailyAvg > 0 ? Math.max(0, Math.floor(balance / dailyAvg)) : 0;
  const months     = Math.floor(runwayDays / 30);
  const remDays    = runwayDays % 30;
  const idealDE    = avgExpense * 3;
  const idealSingle= avgExpense * 6;
  const status     = isDeficit ? "defisit" : runwayDays >= 90 ? "aman" : runwayDays >= 30 ? "waspada" : "kritis";
  const statusColor= status === "aman" ? Colors.success : status === "waspada" ? Colors.warning : Colors.error;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(2,6,23,0.88)" }}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={{ backgroundColor: SURF, borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: PAD, paddingBottom: 36, borderTopWidth: 1, borderTopColor: BORDER }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${Colors.purple}18`,
              alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <Ionicons name="timer-outline" size={20} color={Colors.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TP, fontSize: 16, fontWeight: "800" }}>Cek Nafas Hidup</Text>
              <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 2 }}>
                Berapa lama kamu bisa bertahan tanpa pemasukan?
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Alert.alert("Tersinkron", "Data nafas hidup dihitung otomatis berdasarkan saldo kas terkini.");
              }}
              style={{ marginRight: 16 }}
            >
              <Ionicons name="refresh" size={24} color={Colors.gray400} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={Colors.gray500} />
            </TouchableOpacity>
          </View>

          <View style={{ backgroundColor: `${statusColor}12`, borderRadius: 18, padding: 20,
            alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: `${statusColor}25` }}>
            <Text style={{ color: Colors.gray400, fontSize: 11, textTransform: "uppercase",
              letterSpacing: 1, marginBottom: 6 }}>Jika Tidak Ada Pemasukan</Text>
            <Text style={{ color: statusColor, fontSize: isDeficit ? 30 : 38, fontWeight: "800" }}>
              {isDeficit ? "0 Hari (Defisit)" : `${months > 0 ? `${months} bln ` : ""}${remDays} hari`}
            </Text>
            <View style={{ paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
              backgroundColor: `${statusColor}20`, marginTop: 8 }}>
              <Text style={{ color: statusColor, fontSize: 11, fontWeight: "700",
                textTransform: "uppercase", letterSpacing: 0.8 }}>
                Status: {status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={{ backgroundColor: `${Colors.purple}10`, borderRadius: 16, padding: 16,
            borderWidth: 1, borderColor: `${Colors.purple}20` }}>
            <ResultRow label="Saldo Total" value={fmt(balance)} color={ACCENT} />
            <ResultRow label="Avg Pengeluaran/Bulan" value={fmt(avgExpense)} color={Colors.warning} />
            <ResultRow label="Avg Pengeluaran/Hari" value={fmt(dailyAvg)} color={Colors.warning} />
            <ResultRow label="Dana Darurat Ideal (3x)" value={fmt(idealDE)} color={Colors.info} />
            <ResultRow label="Dana Darurat Ideal (6x)" value={fmt(idealSingle)} color={Colors.info} />
            <View style={{ marginTop: 10, backgroundColor: `${Colors.info}12`, borderRadius: 10,
              padding: 10, borderWidth: 1, borderColor: `${Colors.info}25` }}>
              <Text style={{ color: Colors.info, fontSize: 12, fontWeight: "600", lineHeight: 18 }}>
                💡 Para ahli keuangan menyarankan dana darurat minimal{" "}
                <Text style={{ fontWeight: "800" }}>3-6× pengeluaran bulanan</Text> agar finansialmu aman.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// 5. Kalkulator Biasa
const BasicCalc = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");

  const handleRefresh = () => {
    setExpression("");
    setResult("");
  };

  const handlePress = (val: string) => {
    if (val === "C") {
      setExpression("");
      setResult("");
      return;
    }
    if (val === "DEL") {
      setExpression(prev => prev.slice(0, -1));
      setResult("");
      return;
    }
    if (val === "=") {
      try {
        const sanitized = expression.replace(/[^0-9+\-*/.%]/g, '');
        if (!sanitized) return;
        const withPercent = sanitized.replace(/%/g, '/100');
        const evalResult = new Function('return ' + withPercent)();
        if (evalResult !== undefined && !isNaN(evalResult) && isFinite(evalResult)) {
          setResult(parseFloat(evalResult.toFixed(10)).toString());
        } else {
          setResult("Error");
        }
      } catch (e) {
        setResult("Error");
      }
      return;
    }
    
    let char = val;
    if (val === "×") char = "*";
    if (val === "÷") char = "/";
    if (val === ",") char = ".";

    if (result && !['+','-','*','/','%'].includes(char)) {
        setExpression(char);
        setResult("");
        return;
    }
    if (result && ['+','-','*','/','%'].includes(char)) {
        setExpression(result + char);
        setResult("");
        return;
    }

    // prevent multiple consecutive dots
    if (char === ".") {
       const parts = expression.split(/[\+\-\*\/]/);
       const lastPart = parts[parts.length - 1];
       if (lastPart.includes(".")) return; // already has decimal
    }

    setExpression(prev => prev + char);
  };

  const formatExpr = (expr: string) => {
    return expr.replace(/\d+(\.\d*)?/g, (match) => {
      const parts = match.split('.');
      if (!parts[0] && parts[0] !== "0") return match;
      const intPart = parseInt(parts[0], 10).toLocaleString('id-ID');
      if (parts.length > 1) {
        return `${intPart},${parts[1]}`;
      }
      return intPart;
    }).replace(/\*/g, ' × ').replace(/\//g, ' ÷ ').replace(/\+/g, ' + ').replace(/-/g, ' - ');
  };

  const formatRes = (res: string) => {
    if (!res || res === "Error") return res;
    if (res.includes('e')) return res;
    const parts = res.split('.');
    const isNeg = parts[0].startsWith('-');
    const rawInt = isNeg ? parts[0].substring(1) : parts[0];
    const intPart = parseInt(rawInt || "0", 10).toLocaleString('id-ID');
    const signedInt = isNeg ? `-${intPart}` : intPart;
    if (parts.length > 1) {
      return `${signedInt},${parts[1]}`;
    }
    return signedInt;
  };

  const rows = [
    [{ l: "C", c: Colors.error }, { l: "DEL", c: Colors.warning }, { l: "%", c: ACCENT }, { l: "÷", c: ACCENT }],
    [{ l: "7" }, { l: "8" }, { l: "9" }, { l: "×", c: ACCENT }],
    [{ l: "4" }, { l: "5" }, { l: "6" }, { l: "-", c: ACCENT }],
    [{ l: "1" }, { l: "2" }, { l: "3" }, { l: "+", c: ACCENT }],
    [{ l: "00" }, { l: "0" }, { l: "," }, { l: "=", c: Colors.success }],
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(2,6,23,0.88)" }}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={{ backgroundColor: SURF, borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: PAD, paddingBottom: 36, borderTopWidth: 1, borderTopColor: BORDER }}>
          
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${Colors.info}18`,
              alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <Ionicons name="calculator-outline" size={20} color={Colors.info} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TP, fontSize: 16, fontWeight: "800" }}>Kalkulator Biasa</Text>
              <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 2 }}>
                Hitung-hitungan manual cepat
              </Text>
            </View>
            <TouchableOpacity onPress={handleRefresh} style={{ marginRight: 16 }}>
              <Ionicons name="refresh" size={24} color={Colors.gray400} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={Colors.gray500} />
            </TouchableOpacity>
          </View>

          <View style={{ backgroundColor: BG, borderRadius: 20, padding: 20, marginBottom: 24,
            borderWidth: 1, borderColor: BORDER, minHeight: 120, justifyContent: 'flex-end', alignItems: 'flex-end' }}>
            <Text style={{ color: TS, fontSize: 24, marginBottom: 8, textAlign: 'right' }}>{formatExpr(expression) || "0"}</Text>
            <Text style={{ color: result === "Error" ? Colors.error : TP, fontSize: 44, fontWeight: "800", textAlign: 'right' }}>
              {result ? formatRes(result) : (expression ? "" : "0")}
            </Text>
          </View>

          <View style={{ gap: 12 }}>
            {rows.map((row, rIdx) => (
              <View key={rIdx} style={{ flexDirection: "row", gap: 12 }}>
                {row.map((btn, bIdx) => (
                  <TouchableOpacity
                    key={bIdx}
                    onPress={() => handlePress(btn.l)}
                    activeOpacity={0.7}
                    style={{
                      flex: 1, height: 60, borderRadius: 16,
                      backgroundColor: btn.c ? `${btn.c}15` : `${BG}`,
                      borderWidth: 1, borderColor: btn.c ? `${btn.c}30` : BORDER,
                      alignItems: "center", justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: btn.c || TP, fontSize: 22, fontWeight: "700" }}>{btn.l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ── Reusable DualModeInput for Split Bill (Persen vs Nominal) ───────────────
interface DualModeInputProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  mode: "percent" | "amount";
  setMode: (m: "percent" | "amount") => void;
  value: string;
  setValue: (v: string) => void;
  percentChips?: { label: string; val: string }[];
  amountChips?: { label: string; val: string }[];
  placeholder?: string;
}

const DualModeInput: React.FC<DualModeInputProps> = ({
  label,
  icon,
  mode,
  setMode,
  value,
  setValue,
  percentChips,
  amountChips,
  placeholder,
}) => {
  return (
    <View style={{ marginBottom: 14 }}>
      {/* Header: Label & Mode Switcher */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {icon && <Ionicons name={icon} size={14} color={Colors.gray400} />}
          <Text style={{
            color: Colors.gray400,
            fontSize: 10,
            fontWeight: "700",
            letterSpacing: 1.1,
            textTransform: "uppercase"
          }}>
            {label}
          </Text>
        </View>

        {/* Toggle [% Persen] vs [Rp Nominal] */}
        <View style={{
          flexDirection: "row",
          backgroundColor: BG,
          borderRadius: 8,
          padding: 2,
          borderWidth: 1,
          borderColor: BORDER,
        }}>
          <TouchableOpacity
            onPress={() => {
              if (mode !== "percent") {
                setMode("percent");
                setValue("");
              }
            }}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: mode === "percent" ? "#EC4899" : "transparent",
            }}
          >
            <Text style={{
              fontSize: 10,
              fontWeight: "700",
              color: mode === "percent" ? "#FFF" : Colors.gray400,
            }}>
              % Persen
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (mode !== "amount") {
                setMode("amount");
                setValue("");
              }
            }}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: mode === "amount" ? "#EC4899" : "transparent",
            }}
          >
            <Text style={{
              fontSize: 10,
              fontWeight: "700",
              color: mode === "amount" ? "#FFF" : Colors.gray400,
            }}>
              Rp Nominal
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Input Box */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: BG,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: BORDER,
        paddingHorizontal: 14,
      }}>
        {mode === "amount" && (
          <Text style={{ color: Colors.gray400, fontSize: 16, fontWeight: "700", marginRight: 4 }}>
            Rp
          </Text>
        )}
        <TextInput
          value={mode === "amount" ? (value ? parseInt(value, 10).toLocaleString("id-ID") : "") : value}
          onChangeText={t => {
            if (mode === "amount") {
              setValue(t.replace(/\D/g, ""));
            } else {
              // Allow numbers and decimal dot or comma
              const clean = t.replace(/[^0-9.,]/g, "").replace(",", ".");
              const parts = clean.split(".");
              if (parts.length > 2) {
                setValue(`${parts[0]}.${parts.slice(1).join("")}`);
              } else {
                setValue(clean);
              }
            }
          }}
          keyboardType={mode === "amount" ? "numeric" : "decimal-pad"}
          placeholder={placeholder || (mode === "percent" ? "0 (Bebas ketik %)" : "0 (Bebas ketik Rp)")}
          placeholderTextColor={Colors.gray500}
          style={{
            flex: 1,
            color: TP,
            fontSize: 16,
            fontWeight: "700",
            paddingVertical: 12,
          }}
        />
        {mode === "percent" && (
          <Text style={{ color: Colors.gray400, fontSize: 16, fontWeight: "700", marginLeft: 4 }}>
            %
          </Text>
        )}
      </View>

      {/* Preset Quick Chips */}
      {mode === "percent" && percentChips && percentChips.length > 0 && (
        <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
          {percentChips.map(chip => {
            const isSelected = value === chip.val;
            return (
              <TouchableOpacity
                key={chip.label}
                onPress={() => setValue(chip.val)}
                style={{
                  flex: 1,
                  paddingVertical: 6,
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor: isSelected ? "#EC489922" : BG,
                  borderWidth: 1,
                  borderColor: isSelected ? "#EC4899" : BORDER,
                }}
              >
                <Text style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: isSelected ? "#EC4899" : Colors.gray400,
                }}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {mode === "amount" && amountChips && amountChips.length > 0 && (
        <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
          {amountChips.map(chip => {
            const isSelected = value === chip.val;
            return (
              <TouchableOpacity
                key={chip.label}
                onPress={() => setValue(chip.val)}
                style={{
                  flex: 1,
                  paddingVertical: 6,
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor: isSelected ? "#EC489922" : BG,
                  borderWidth: 1,
                  borderColor: isSelected ? "#EC4899" : BORDER,
                }}
              >
                <Text style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: isSelected ? "#EC4899" : Colors.gray400,
                }}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

// 6. Kalkulator Split Bill (Patungan Pintar)
interface SplitPerson {
  id: string;
  name: string;
  amount: string;
}

const SplitBillCalc = ({
  visible,
  onClose,
  onRecordExpense,
}: {
  visible: boolean;
  onClose: () => void;
  onRecordExpense: (amount: number, desc: string) => void;
}) => {
  const [mode, setMode] = useState<"equal" | "itemized">("equal");

  // Mode 1: Bagi Rata
  const [totalBill, setTotalBill] = useState("");
  const [numPeople, setNumPeople] = useState("2");
  
  // Dynamic Tax, Service, and Discount
  const [taxMode, setTaxMode] = useState<"percent" | "amount">("percent");
  const [taxValue, setTaxValue] = useState<string>("");

  const [serviceMode, setServiceMode] = useState<"percent" | "amount">("percent");
  const [serviceValue, setServiceValue] = useState<string>("");

  const [discountMode, setDiscountMode] = useState<"amount" | "percent">("amount");
  const [discountValue, setDiscountValue] = useState<string>("");

  const [rounding, setRounding] = useState<"none" | "500" | "1000">("none");

  // Mode 2: Per Orang
  const [people, setPeople] = useState<SplitPerson[]>([
    { id: "1", name: "Saya", amount: "" },
    { id: "2", name: "Teman 1", amount: "" },
  ]);

  const handleRefresh = () => {
    setTotalBill("");
    setNumPeople("2");
    setTaxMode("percent");
    setTaxValue("");
    setServiceMode("percent");
    setServiceValue("");
    setDiscountMode("amount");
    setDiscountValue("");
    setRounding("none");
    setPeople([
      { id: "1", name: "Saya", amount: "" },
      { id: "2", name: "Teman 1", amount: "" },
    ]);
  };

  // Rounding helper
  const applyRounding = (val: number, roundType: "none" | "500" | "1000") => {
    if (roundType === "500") return Math.ceil(val / 500) * 500;
    if (roundType === "1000") return Math.ceil(val / 1000) * 1000;
    return Math.round(val);
  };

  // Safe parse numeric value
  const parseNum = (str: string) => safeNumber(str.replace(",", "."));

  // Mode 1 calculations
  const rawSubtotal = safeNumber(Number(totalBill));
  const rawTax = taxMode === "percent"
    ? rawSubtotal * (parseNum(taxValue) / 100)
    : parseNum(taxValue);
  const rawService = serviceMode === "percent"
    ? rawSubtotal * (parseNum(serviceValue) / 100)
    : parseNum(serviceValue);
  const rawDiscount = discountMode === "percent"
    ? rawSubtotal * (parseNum(discountValue) / 100)
    : parseNum(discountValue);

  const rawTotal = Math.max(0, rawSubtotal + rawTax + rawService - rawDiscount);
  const countPeople = Math.max(1, parseInt(numPeople, 10) || 1);
  const perPersonRaw = countPeople > 0 ? rawTotal / countPeople : 0;
  const perPersonFinal = applyRounding(perPersonRaw, rounding);

  // Mode 2 calculations
  const itemizedSubtotal = people.reduce((sum, p) => sum + safeNumber(Number(p.amount)), 0);
  const itemizedTax = taxMode === "percent"
    ? itemizedSubtotal * (parseNum(taxValue) / 100)
    : parseNum(taxValue);
  const itemizedService = serviceMode === "percent"
    ? itemizedSubtotal * (parseNum(serviceValue) / 100)
    : parseNum(serviceValue);
  const itemizedDiscount = discountMode === "percent"
    ? itemizedSubtotal * (parseNum(discountValue) / 100)
    : parseNum(discountValue);
  const itemizedTotal = Math.max(0, itemizedSubtotal + itemizedTax + itemizedService - itemizedDiscount);

  const peopleResults = useMemo(() => {
    if (itemizedSubtotal === 0) {
      return people.map(p => ({
        ...p,
        baseAmount: 0,
        extraShare: 0,
        finalAmount: 0,
      }));
    }
    return people.map(p => {
      const base = safeNumber(Number(p.amount));
      const ratio = base / itemizedSubtotal;
      const extra = (itemizedTax + itemizedService - itemizedDiscount) * ratio;
      const finalRaw = Math.max(0, base + extra);
      const finalAmount = applyRounding(finalRaw, rounding);
      return {
        ...p,
        baseAmount: base,
        extraShare: extra,
        finalAmount,
      };
    });
  }, [people, itemizedSubtotal, itemizedTax, itemizedService, itemizedDiscount, rounding]);

  // Dynamic labels for share & receipts
  const taxLabel = taxMode === "percent" ? `Pajak (${taxValue || "0"}%)` : "Pajak";
  const serviceLabel = serviceMode === "percent" ? `Service (${serviceValue || "0"}%)` : "Biaya Layanan";
  const discountLabel = discountMode === "percent" ? `Diskon (${discountValue || "0"}%)` : "Diskon";

  // Share to WhatsApp
  const handleShareWhatsApp = async () => {
    try {
      let message = "";
      if (mode === "equal") {
        if (perPersonFinal <= 0) {
          Alert.alert("Perhatian", "Masukkan total tagihan terlebih dahulu");
          return;
        }
        message =
          `📋 *Rekap Patungan Tagihan*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `💰 Subtotal: ${fmt(rawSubtotal)}\n` +
          (rawTax > 0 ? `🏛️ ${taxLabel}: +${fmt(rawTax)}\n` : "") +
          (rawService > 0 ? `🛎️ ${serviceLabel}: +${fmt(rawService)}\n` : "") +
          (rawDiscount > 0 ? `🏷️ ${discountLabel}: -${fmt(rawDiscount)}\n` : "") +
          `💳 *Total Tagihan: ${fmt(rawTotal)}*\n` +
          `👥 Jumlah Orang: ${countPeople} orang\n\n` +
          `👉 *Masing-masing bayar: ${fmt(perPersonFinal)}*\n\n` +
          `Bisa transfer ke rekening / e-wallet saya ya. Terima kasih! 🙏`;
      } else {
        if (itemizedTotal <= 0) {
          Alert.alert("Perhatian", "Masukkan nominal pesanan terlebih dahulu");
          return;
        }
        const extraItems: string[] = [];
        if (itemizedTax > 0) extraItems.push(`${taxLabel}: +${fmt(itemizedTax)}`);
        if (itemizedService > 0) extraItems.push(`${serviceLabel}: +${fmt(itemizedService)}`);
        if (itemizedDiscount > 0) extraItems.push(`${discountLabel}: -${fmt(itemizedDiscount)}`);

        const extraNote = extraItems.length > 0
          ? `\n_Catatan Biaya Tambahan:_\n${extraItems.map(e => `• ${e}`).join("\n")}\n`
          : "";

        message =
          `📋 *Rincian Patungan Tagihan*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          peopleResults
            .map((p, i) => `${i + 1}. *${p.name || (i === 0 ? "Saya" : `Teman ${i}`)}*: ${fmt(p.finalAmount)}`)
            .join("\n") +
          `\n\n💰 *Total Tagihan: ${fmt(itemizedTotal)}*\n` +
          extraNote +
          `\nBisa transfer ke rekening / e-wallet saya ya. Terima kasih! 🙏`;
      }

      await Share.share({ message });
    } catch (error) {
      console.warn("Share error:", error);
    }
  };

  const handleRecordSelf = () => {
    if (mode === "equal") {
      if (perPersonFinal <= 0) {
        Alert.alert("Perhatian", "Nominal tagihan belum dimasukkan");
        return;
      }
      onRecordExpense(perPersonFinal, "Patungan (Bagi Rata)");
    } else {
      const myShare = peopleResults[0]?.finalAmount || 0;
      if (myShare <= 0) {
        Alert.alert("Perhatian", "Nominal pesanan Saya belum dimasukkan");
        return;
      }
      onRecordExpense(myShare, `Patungan (${peopleResults[0]?.name || "Saya"})`);
    }
    onClose();
  };

  const addPerson = () => {
    // Cari nomor teman terkecil yang belum digunakan (agar jika Teman 2 dihapus lalu ditambah lagi, ia kembali memakai Teman 2)
    const usedNumbers = new Set<number>();
    people.forEach(p => {
      const match = p.name.trim().match(/^(?:Teman|Orang)\s*(\d+)$/i);
      if (match) {
        usedNumbers.add(parseInt(match[1], 10));
      }
    });

    let nextNum = 1;
    while (usedNumbers.has(nextNum)) {
      nextNum++;
    }

    setPeople(prev => [...prev, { id: String(Date.now()), name: `Teman ${nextNum}`, amount: "" }]);
  };

  const removePerson = (id: string) => {
    if (people.length <= 2) {
      Alert.alert("Minimal 2 Orang", "Patungan membutuhkan minimal 2 orang");
      return;
    }
    setPeople(prev => prev.filter(p => p.id !== id));
  };

  const updatePerson = (id: string, field: "name" | "amount", val: string) => {
    setPeople(prev =>
      prev.map(p => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: "rgba(2,6,23,0.88)" }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        />
        <View style={{
          backgroundColor: SURF,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: PAD,
          paddingBottom: 24,
          borderTopWidth: 1,
          borderTopColor: BORDER,
          maxHeight: "92%"
        }}>
          {/* Header Modal */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: "#EC489918",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12
            }}>
              <Ionicons name="people-outline" size={20} color="#EC4899" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TP, fontSize: 16, fontWeight: "800" }}>Split Bill</Text>
              <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 2 }}>
                Hitung cepat bagi tagihan makan & nongkrong
              </Text>
            </View>
            <TouchableOpacity onPress={handleRefresh} style={{ marginRight: 16 }}>
              <Ionicons name="refresh" size={24} color={Colors.gray400} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={Colors.gray500} />
            </TouchableOpacity>
          </View>

          {/* Mode Switcher */}
          <View style={{
            flexDirection: "row",
            backgroundColor: BG,
            borderRadius: 12,
            padding: 3,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: BORDER,
          }}>
            <TouchableOpacity
              onPress={() => setMode("equal")}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: "center",
                borderRadius: 9,
                backgroundColor: mode === "equal" ? "#EC4899" : "transparent",
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: "700",
                color: mode === "equal" ? "#FFF" : Colors.gray400,
              }}>
                Bagi Rata (Equal)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode("itemized")}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: "center",
                borderRadius: 9,
                backgroundColor: mode === "itemized" ? "#EC4899" : "transparent",
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: "700",
                color: mode === "itemized" ? "#FFF" : Colors.gray400,
              }}>
                Per Orang (Itemized)
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 30 }}
          >
            {/* ════════════ MODE 1: BAGI RATA ════════════ */}
            {mode === "equal" && (
              <>
                <Label text="Total Tagihan " />
                <InputBox
                  value={totalBill}
                  onChange={setTotalBill}
                  placeholder="Misal: 200.000"
                />

                <Label text="Jumlah Orang" />
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <TouchableOpacity
                    onPress={() => setNumPeople(String(Math.max(1, (parseInt(numPeople, 10) || 1) - 1)))}
                    style={{
                      width: 44,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: BG,
                      borderWidth: 1,
                      borderColor: BORDER,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="remove" size={20} color={TP} />
                  </TouchableOpacity>

                  <TextInput
                    value={numPeople}
                    onChangeText={t => setNumPeople(t.replace(/\D/g, ""))}
                    keyboardType="numeric"
                    placeholder="2"
                    placeholderTextColor={Colors.gray500}
                    style={{
                      flex: 1,
                      backgroundColor: BG,
                      borderRadius: 12,
                      paddingVertical: 12,
                      textAlign: "center",
                      color: TP,
                      fontSize: 18,
                      fontWeight: "800",
                      borderWidth: 1,
                      borderColor: BORDER,
                    }}
                  />

                  <TouchableOpacity
                    onPress={() => setNumPeople(String((parseInt(numPeople, 10) || 1) + 1))}
                    style={{
                      width: 44,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: BG,
                      borderWidth: 1,
                      borderColor: BORDER,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="add" size={20} color={TP} />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ════════════ MODE 2: PER ORANG ════════════ */}
            {mode === "itemized" && (
              <>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Label text="Pesanan Masing-Masing Orang" />
                  <TouchableOpacity
                    onPress={addPerson}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                      backgroundColor: `${ACCENT}15`,
                    }}
                  >
                    <Ionicons name="add" size={14} color={ACCENT} />
                    <Text style={{ color: ACCENT, fontSize: 11, fontWeight: "700" }}>Tambah</Text>
                  </TouchableOpacity>
                </View>

                {people.map((p, idx) => (
                  <View
                    key={p.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 10,
                      backgroundColor: BG,
                      padding: 8,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: BORDER,
                    }}
                  >
                    <TextInput
                      value={p.name}
                      onChangeText={t => updatePerson(p.id, "name", t)}
                      placeholder={idx === 0 ? "Saya" : `Teman ${idx}`}
                      placeholderTextColor={Colors.gray500}
                      style={{
                        width: 90,
                        color: TP,
                        fontSize: 13,
                        fontWeight: "700",
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                      }}
                    />

                    <View style={{ flex: 1 }}>
                      <TextInput
                        value={p.amount ? `Rp ${parseInt(p.amount, 10).toLocaleString("id-ID")}` : ""}
                        onChangeText={t => updatePerson(p.id, "amount", t.replace(/\D/g, ""))}
                        keyboardType="numeric"
                        placeholder="Rp 0"
                        placeholderTextColor={Colors.gray500}
                        style={{
                          color: TP,
                          fontSize: 14,
                          fontWeight: "700",
                          textAlign: "right",
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                        }}
                      />
                    </View>

                    {people.length > 2 && (
                      <TouchableOpacity onPress={() => removePerson(p.id)} style={{ padding: 4 }}>
                        <Ionicons name="trash-outline" size={16} color={Colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </>
            )}

            {/* ════════════ PAJAK, SERVICE & DISKON DUAL-MODE INPUTS ════════════ */}
            <DualModeInput
              label="Pajak Restoran / PPN"
              icon="business-outline"
              mode={taxMode}
              setMode={setTaxMode}
              value={taxValue}
              setValue={setTaxValue}
              placeholder={taxMode === "percent" ? "Masukan Pajak Restoran" : "Masukan Pajak Restoran"}
              percentChips={[
                { label: "0%", val: "0" },
                { label: "10% PB1", val: "10" },
                { label: "11% PPN", val: "11" },
                { label: "12%", val: "12" },
              ]}
              amountChips={[
                { label: "Rp 0", val: "0" },
                { label: "Rp 5.000", val: "5000" },
                { label: "Rp 10.000", val: "10000" },
                { label: "Rp 15.000", val: "15000" },
              ]}
            />

            <DualModeInput
              label="Biaya Layanan"
              icon="restaurant-outline"
              mode={serviceMode}
              setMode={setServiceMode}
              value={serviceValue}
              setValue={setServiceValue}
              placeholder={serviceMode === "percent" ? "0 (Bebas ketik % service)" : "Masukan Biaya Layanan"}
              percentChips={[
                { label: "0%", val: "0" },
                { label: "5%", val: "5" },
                { label: "7.5%", val: "7.5" },
                { label: "10%", val: "10" },
              ]}
              amountChips={[
                { label: "Rp 0", val: "0" },
                { label: "Rp 2.000", val: "2000" },
                { label: "Rp 5.000", val: "5000" },
                { label: "Rp 10.000", val: "10000" },
              ]}
            />

            <DualModeInput
              label="Potongan Diskon"
              icon="pricetag-outline"
              mode={discountMode}
              setMode={setDiscountMode}
              value={discountValue}
              setValue={setDiscountValue}
              placeholder={discountMode === "amount" ? "Masukan Potongan Diskon" : "0 (Bebas ketik % diskon)"}
              amountChips={[
                { label: "Rp 0", val: "0" },
                { label: "Rp 10rb", val: "10000" },
                { label: "Rp 20rb", val: "20000" },
                { label: "Rp 50rb", val: "50000" },
              ]}
              percentChips={[
                { label: "0%", val: "0" },
                { label: "10%", val: "10" },
                { label: "20%", val: "20" },
                { label: "50%", val: "50" },
              ]}
            />

            <Label text="Opsi Pembulatan" />
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 18 }}>
              {[
                { label: "Pas (Rp)", val: "none" as const },
                { label: "Ke Rp 500", val: "500" as const },
                { label: "Ke Rp 1.000", val: "1000" as const },
              ].map(item => {
                const isSelected = rounding === item.val;
                return (
                  <TouchableOpacity
                    key={item.label}
                    onPress={() => setRounding(item.val)}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      alignItems: "center",
                      borderRadius: 10,
                      backgroundColor: isSelected ? "#EC4899" : BG,
                      borderWidth: 1,
                      borderColor: isSelected ? "#EC4899" : BORDER,
                    }}
                  >
                    <Text style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: isSelected ? "#FFF" : Colors.gray400,
                    }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ════════════ HASIL RINGKASAN ════════════ */}
            <View style={{
              backgroundColor: `${ACCENT}10`,
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: `${ACCENT}25`,
              marginBottom: 16,
            }}>
              <Text style={{ color: TP, fontSize: 13, fontWeight: "700", marginBottom: 12 }}>
                Rincian Tagihan:
              </Text>

              <ResultRow label="Subtotal Pesanan" value={fmt(mode === "equal" ? rawSubtotal : itemizedSubtotal)} color={TP} />
              {((mode === "equal" ? rawTax : itemizedTax) > 0) && (
                <ResultRow
                  label={taxMode === "percent" ? `Pajak (${taxValue || "0"}%)` : "Pajak (Nominal)"}
                  value={`+${fmt(mode === "equal" ? rawTax : itemizedTax)}`}
                  color={Colors.warning}
                />
              )}
              {((mode === "equal" ? rawService : itemizedService) > 0) && (
                <ResultRow
                  label={serviceMode === "percent" ? `Biaya Layanan (${serviceValue || "0"}%)` : "Biaya Layanan / Service"}
                  value={`+${fmt(mode === "equal" ? rawService : itemizedService)}`}
                  color={Colors.warning}
                />
              )}
              {((mode === "equal" ? rawDiscount : itemizedDiscount) > 0) && (
                <ResultRow
                  label={discountMode === "percent" ? `Diskon (${discountValue || "0"}%)` : "Potongan Diskon"}
                  value={`-${fmt(mode === "equal" ? rawDiscount : itemizedDiscount)}`}
                  color={Colors.success}
                />
              )}
              <ResultRow label="Total Bersih Kasir" value={fmt(mode === "equal" ? rawTotal : itemizedTotal)} color={ACCENT} />

              {/* Box Highlight Bagi Rata */}
              {mode === "equal" && (
                <View style={{
                  marginTop: 14,
                  backgroundColor: "#EC489918",
                  padding: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#EC489935",
                  alignItems: "center",
                }}>
                  <Text style={{ color: TS, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 }}>
                    Masing-masing Bayar:
                  </Text>
                  <Text style={{ color: "#EC4899", fontSize: 24, fontWeight: "800", marginTop: 4 }}>
                    {fmt(perPersonFinal)}
                  </Text>
                  <Text style={{ color: Colors.gray400, fontSize: 10, marginTop: 2 }}>
                    Dibagi rata {countPeople} orang {rounding !== "none" ? `(Dibulatkan ke ${rounding})` : ""}
                  </Text>
                </View>
              )}

              {/* Box Highlight Per Orang */}
              {mode === "itemized" && (
                <View style={{ marginTop: 14 }}>
                  <Text style={{ color: TP, fontSize: 12, fontWeight: "700", marginBottom: 8 }}>
                    Rincian Pembayaran Tiap Orang:
                  </Text>
                  {peopleResults.map((p, i) => (
                    <View
                      key={p.id}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingVertical: 8,
                        borderBottomWidth: i < peopleResults.length - 1 ? 1 : 0,
                        borderBottomColor: BORDER,
                      }}
                    >
                      <View>
                        <Text style={{ color: TP, fontSize: 13, fontWeight: "700" }}>
                          {p.name || (i === 0 ? "Saya" : `Teman ${i}`)}
                        </Text>
                        <Text style={{ color: Colors.gray400, fontSize: 10 }}>
                          Pesanan: {fmt(p.baseAmount)} {p.extraShare !== 0 ? `+ Biaya/Tax: ${fmt(p.extraShare)}` : ""}
                        </Text>
                      </View>
                      <Text style={{ color: "#EC4899", fontSize: 15, fontWeight: "800" }}>
                        {fmt(p.finalAmount)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ════════════ TOMBOL AKSI ════════════ */}
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={handleShareWhatsApp}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: "#25D366", // WhatsApp Green
                  paddingVertical: 14,
                  borderRadius: 14,
                  elevation: 3,
                }}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
                <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "700" }}>
                  Salin / Kirim Rekap ke WhatsApp
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRecordSelf}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: `${ACCENT}20`,
                  borderWidth: 1,
                  borderColor: ACCENT,
                  paddingVertical: 13,
                  borderRadius: 14,
                }}
              >
                <Ionicons name="receipt-outline" size={17} color={ACCENT} />
                <Text style={{ color: ACCENT, fontSize: 13, fontWeight: "700" }}>
                  {mode === "equal"
                    ? `Catat Bagian Saya (${fmt(perPersonFinal)})`
                    : `Catat Bagian Saya (${fmt(peopleResults[0]?.finalAmount || 0)})`}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═════════════════════════════════════════════════════════════════════════════
const ToolsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { state } = useAppContext();

  const BG     = colors.background;
  const SURF   = colors.surface;
  const ACCENT = colors.accent;
  const TP     = colors.textPrimary;
  const TS     = colors.textSecondary;
  const BORDER = `${colors.border}80`;

  const [modal, setModal] = useState<
    "daily" | "salary" | "buy" | "runway" | "basic" | "splitbill" | null
  >(null);

  // Derived values from real app data
  const balance = safeNumber(state.balance);

  const totalDebt = useMemo(
    () =>
      (state.debts || [])
        .filter(d => d.type === "borrowed" && d.status !== "paid")
        .reduce((s, d) => s + safeNumber(d.remaining), 0),
    [state.debts]
  );

  const avgMonthlyExpense = useMemo(() => {
    const txs = state.transactions || [];
    if (txs.length === 0) return 0;
    const expenses = txs.filter(t => t.type === "expense");
    if (expenses.length === 0) return 0;
    const months = new Set(expenses.map(t => t.date.slice(0, 7))).size;
    const total  = expenses.reduce((s, t) => s + safeNumber(t.amount), 0);
    return months > 0 ? total / months : total;
  }, [state.transactions]);

  const tools = [
    {
      id: "splitbill",
      icon: "people-outline" as const,
      color: "#EC4899",
      title: "Split Bill",
      desc: "Hitung cepat patungan makan & nongkrong secara rata atau per pesanan dengan adil.",
      tag: "Patungan",
    },
    {
      id: "recurring",
      icon: "repeat-outline" as const,
      color: colors.accent,
      title: "Transaksi Rutin",
      desc: "Atur pemasukan rutin & pengeluaran tagihan berulang agar otomatis tercatat.",
      tag: "Otomatis",
      onPress: () => navigation.navigate("RecurringTransactions"),
    },
    {
      id: "daily",
      icon: "shield-checkmark-outline" as const,
      color: ACCENT,
      title: "Batas Aman Harian",
      desc: "Hitung jatah aman per hari sampai akhir bulan berdasarkan saldo & hutang.",
      tag: "Harian",
    },
    {
      id: "salary",
      icon: "pie-chart-outline" as const,
      color: colors.success,
      title: "Bagi Anggaran 50/30/20",
      desc: "Alokasikan uang pemasukan ke kebutuhan, keinginan, dan tabungan secara otomatis.",
      tag: "Bulanan",
    },
    {
      id: "buy",
      icon: "cart-outline" as const,
      color: Colors.warning,
      title: "Beli atau Tunda?",
      desc: "Simulasikan dampak pembelian terhadap saldo & jatah harianmu.",
      tag: "Insidental",
    },
    {
      id: "runway",
      icon: "timer-outline" as const,
      color: Colors.purple,
      title: "Cek Nafas Hidup",
      desc: "Lihat berapa lama kamu bisa bertahan jika tidak ada pemasukan sama sekali.",
      tag: "Masa Depan",
    },
    {
      id: "basic",
      icon: "calculator-outline" as const,
      color: Colors.info,
      title: "Kalkulator Biasa",
      desc: "Hitung-hitungan manual (tambah, kurang, kali, bagi) dengan cepat.",
      tag: "Umum",
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingTop: 16, paddingBottom: 22 }}>
          <Text style={{ color: TP, fontSize: 22, fontWeight: "800" }}>
            Alat Keuangan Cerdas
          </Text>
          <Text style={{ color: Colors.gray400, fontSize: 12, marginTop: 4 }}>
            Simulasi & kalkulator berbasis data keuanganmu
          </Text>
        </View>

        {/* Tool cards list */}
        <View style={{ gap: 14 }}>
          {tools.map(tool => (
            <TouchableOpacity
              key={tool.id}
              onPress={() => (tool as any).onPress ? (tool as any).onPress() : setModal(tool.id as any)}
              activeOpacity={0.7}
              style={{
                width: "100%",
                backgroundColor: SURF, borderRadius: 24,
                borderWidth: 1, borderColor: BORDER,
                borderLeftWidth: 3, borderLeftColor: tool.color,
                padding: 16,
                flexDirection: "row", alignItems: "center"
              }}
            >
              {/* Icon */}
              <View style={{ width: 56, height: 56, borderRadius: 18,
                backgroundColor: `${tool.color}15`, alignItems: "center",
                justifyContent: "center", marginRight: 16,
                borderWidth: 1, borderColor: `${tool.color}25` }}>
                <Ionicons name={tool.icon} size={28} color={tool.color} />
              </View>

              {/* Text Info */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  <Text style={{ color: TP, fontSize: 16, fontWeight: "800", flex: 1 }} numberOfLines={1}>
                    {tool.title}
                  </Text>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
                    backgroundColor: `${tool.color}12`, marginLeft: 8 }}>
                    <Text style={{ color: tool.color, fontSize: 9, fontWeight: "800",
                      textTransform: "uppercase", letterSpacing: 1 }}>
                      {tool.tag}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: Colors.gray400, fontSize: 12, lineHeight: 18, paddingRight: 8 }} numberOfLines={2}>
                  {tool.desc}
                </Text>
              </View>

              {/* Chevron */}
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: BG, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: BORDER }}>
                <Ionicons name="chevron-forward" size={16} color={Colors.gray400} style={{ marginLeft: 2 }} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info note */}
        <View style={{ backgroundColor: `${ACCENT}08`, borderRadius: 14, padding: 14,
          borderWidth: 1, borderColor: `${ACCENT}15`, marginTop: 20, flexDirection: "row", gap: 10 }}>
          <Ionicons name="information-circle-outline" size={18} color={ACCENT} style={{ marginTop: 1 }} />
          <Text style={{ color: Colors.gray400, fontSize: 12, lineHeight: 18, flex: 1 }}>
            Semua kalkulator ini menggunakan data nyata dari transaksi, saldo, dan hutang kamu
            secara otomatis — tidak perlu input manual berulang.
          </Text>
        </View>
      </ScrollView>

      {/* Modals */}
      <DailyLimitCalc
        visible={modal === "daily"}
        onClose={() => setModal(null)}
        balance={balance}
        totalDebt={totalDebt}
      />
      <SalaryCalc
        visible={modal === "salary"}
        onClose={() => setModal(null)}
      />
      <BuyOrWaitCalc
        visible={modal === "buy"}
        onClose={() => setModal(null)}
        balance={balance}
        avgExpense={avgMonthlyExpense}
      />
      <RunwayCalc
        visible={modal === "runway"}
        onClose={() => setModal(null)}
        balance={balance}
        avgExpense={avgMonthlyExpense}
      />
      <BasicCalc
        visible={modal === "basic"}
        onClose={() => setModal(null)}
      />
      <SplitBillCalc
        visible={modal === "splitbill"}
        onClose={() => setModal(null)}
        onRecordExpense={(amount, desc) => {
          navigation.navigate("AddTransaction", {
            type: "expense",
            initialAmount: amount,
            initialDescription: desc,
            initialCategory: "Makanan & Minuman",
          });
        }}
      />
    </SafeAreaView>
  );
};

export default ToolsScreen;
