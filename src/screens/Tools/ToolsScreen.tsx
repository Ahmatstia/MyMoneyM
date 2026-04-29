// File: src/screens/Tools/ToolsScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../../context/AppContext";
import { Colors } from "../../theme/theme";
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
  const [days, setDays]       = useState(String(daysLeftInMonth()));
  const [reserve, setReserve] = useState("");

  // Reset & sync every time modal opens
  React.useEffect(() => {
    if (visible) {
      handleRefresh();
    }
  }, [visible, balance]);

  const handleRefresh = () => {
    setCustomBalance(String(balance));
    setDays(String(daysLeftInMonth()));
    setReserve("");
  };

  const currentBal  = safeNumber(Number(customBalance));
  const safeBalance = Math.max(0, currentBal - totalDebt - safeNumber(Number(reserve)));
  const numDays     = Math.max(1, Number(days) || 1);
  const perDay      = safeBalance / numDays;
  const perWeek     = perDay * 7;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(2,6,23,0.88)" }}>
        <View style={{ backgroundColor: SURF, borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: PAD, paddingBottom: 36, borderTopWidth: 1, borderTopColor: BORDER, maxHeight: "90%" }}>
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

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <Label text="Dana yang Tersedia (Bisa Diubah)" />
            <InputBox value={customBalance} onChange={setCustomBalance} placeholder="Saldo saat ini" />

            <Label text="Reservasi / Keperluan Wajib" />
            <InputBox value={reserve} onChange={setReserve} placeholder="Misal: tagihan, dll" />

            <Label text="Jumlah Hari" />
            <InputBox value={days} onChange={setDays} placeholder="Sisa hari bulan ini" isCurrency={false} />

            <View style={{ backgroundColor: `${ACCENT}10`, borderRadius: 16, padding: 16,
              borderWidth: 1, borderColor: `${ACCENT}20`, marginTop: 4 }}>
              <Text style={{ color: TP, fontSize: 13, fontWeight: "700", marginBottom: 12 }}>
                Kesimpulan untukmu:
              </Text>
              
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: TS, fontSize: 12, marginBottom: 4 }}>Uang yang BISA dipakai</Text>
                <Text style={{ color: ACCENT, fontSize: 20, fontWeight: "800" }}>{fmt(safeBalance)}</Text>
                {totalDebt > 0 && (
                   <Text style={{ color: Colors.error, fontSize: 10, marginTop: 4 }}>*Telah dipotong hutang (Rp {fmt(totalDebt)})</Text>
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
      </View>
    </Modal>
  );
};

// 2. Pecah Gaji 50/30/20
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
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(2,6,23,0.88)" }}>
        <View style={{ backgroundColor: SURF, borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: PAD, paddingBottom: 36, borderTopWidth: 1, borderTopColor: BORDER }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${Colors.success}18`,
              alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <Ionicons name="pie-chart-outline" size={20} color={Colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TP, fontSize: 16, fontWeight: "800" }}>Pecah Gaji 50/30/20</Text>
              <Text style={{ color: Colors.gray400, fontSize: 11, marginTop: 2 }}>
                Alokasi gaji secara otomatis
              </Text>
            </View>
            <TouchableOpacity onPress={handleRefresh} style={{ marginRight: 16 }}>
              <Ionicons name="refresh" size={24} color={Colors.gray400} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={Colors.gray500} />
            </TouchableOpacity>
          </View>

          <Label text="Gaji Utama" />
          <InputBox value={salary} onChange={setSalary} placeholder="Nominal gaji" />
          <Label text="Penghasilan Tambahan (opsional)" />
          <InputBox value={extra} onChange={setExtra} placeholder="Freelance, bonus, dll" />

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
        </View>
      </View>
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
  const [customDays, setCustomDays]       = useState(String(daysLeftInMonth()));

  // Reset & sync every time modal opens
  React.useEffect(() => {
    if (visible) {
      handleRefresh();
    }
  }, [visible, balance]);

  const handleRefresh = () => {
    setCustomBalance(String(balance));
    setCustomDays(String(daysLeftInMonth()));
    setPrice("");
    setLabel("");
  };

  const itemPrice    = safeNumber(Number(price));
  const currentBal   = safeNumber(Number(customBalance));
  const numDays      = Math.max(1, Number(customDays) || 1);
  const afterBuy     = currentBal - itemPrice;
  const dailyAfter   = numDays > 0 ? afterBuy / numDays : 0;
  const canBuy       = afterBuy >= 0 && dailyAfter >= 30000;
  const savePerDay   = 50000;
  const daysToSave   = itemPrice > 0 ? Math.ceil(itemPrice / savePerDay) : 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(2,6,23,0.88)" }}>
        <View style={{ backgroundColor: SURF, borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: PAD, paddingBottom: 36, borderTopWidth: 1, borderTopColor: BORDER, maxHeight: "90%" }}>
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

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
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
                <Label text="Untuk Berapa Hari?" />
                <InputBox value={customDays} onChange={setCustomDays} placeholder="Hari" isCurrency={false} />
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
      </View>
    </Modal>
  );
};

// 4. Nafas Hidup
const RunwayCalc = ({ visible, onClose, balance, avgExpense }: {
  visible: boolean; onClose: () => void; balance: number; avgExpense: number;
}) => {
  const dailyAvg   = avgExpense / 30;
  const runwayDays = dailyAvg > 0 ? Math.floor(balance / dailyAvg) : 0;
  const months     = Math.floor(runwayDays / 30);
  const remDays    = runwayDays % 30;
  const idealDE    = avgExpense * 3;
  const idealSingle= avgExpense * 6;
  const status     = runwayDays >= 90 ? "aman" : runwayDays >= 30 ? "waspada" : "kritis";
  const statusColor= status === "aman" ? Colors.success : status === "waspada" ? Colors.warning : Colors.error;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(2,6,23,0.88)" }}>
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
            <TouchableOpacity onPress={() => {}} style={{ marginRight: 16 }}>
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
            <Text style={{ color: statusColor, fontSize: 38, fontWeight: "800" }}>
              {months > 0 ? `${months} bln ` : ""}{remDays} hari
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
        if (evalResult !== undefined && !isNaN(evalResult)) {
          setResult(parseFloat(evalResult.toFixed(10)).toString());
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

// ═════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═════════════════════════════════════════════════════════════════════════════
const ToolsScreen: React.FC = () => {
  const { state } = useAppContext();

  const [modal, setModal] = useState<
    "daily" | "salary" | "buy" | "runway" | "basic" | null
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
      color: Colors.success,
      title: "Pecah Gaji 50/30/20",
      desc: "Alokasikan gajimu ke kebutuhan, keinginan, dan tabungan secara otomatis.",
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

        {/* Quick stats strip */}
        <View style={{ backgroundColor: SURF, borderRadius: R, borderWidth: 1,
          borderColor: BORDER, padding: 16, marginBottom: 24,
          flexDirection: "row", justifyContent: "space-between" }}>
          {[
            { label: "Saldo", value: fmt(balance), color: ACCENT },
            { label: "Hutang", value: fmt(totalDebt), color: Colors.error },
            { label: "Avg/Bln", value: fmt(avgMonthlyExpense), color: Colors.warning },
          ].map(s => (
            <View key={s.label} style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ color: Colors.gray400, fontSize: 9, fontWeight: "700",
                textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>
                {s.label}
              </Text>
              <Text style={{ color: s.color, fontSize: 13, fontWeight: "800" }} numberOfLines={1}>
                {s.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Tool cards */}
        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
          {tools.map(tool => (
            <TouchableOpacity
              key={tool.id}
              onPress={() => setModal(tool.id as any)}
              activeOpacity={0.8}
              style={{
                width: "47.5%",
                backgroundColor: SURF, borderRadius: R,
                borderWidth: 1, borderColor: BORDER,
                padding: PAD, minHeight: 170,
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 13,
                backgroundColor: `${tool.color}18`, alignItems: "center",
                justifyContent: "center", marginBottom: 14,
                borderWidth: 1, borderColor: `${tool.color}25` }}>
                <Ionicons name={tool.icon} size={22} color={tool.color} />
              </View>

              <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20,
                backgroundColor: `${tool.color}15`, alignSelf: "flex-start", marginBottom: 8 }}>
                <Text style={{ color: tool.color, fontSize: 9, fontWeight: "700",
                  textTransform: "uppercase", letterSpacing: 0.8 }}>
                  {tool.tag}
                </Text>
              </View>

              <Text style={{ color: TP, fontSize: 13, fontWeight: "800", marginBottom: 6 }}>
                {tool.title}
              </Text>
              <Text style={{ color: Colors.gray400, fontSize: 11, lineHeight: 16 }}>
                {tool.desc}
              </Text>

              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 14 }}>
                <Text style={{ color: tool.color, fontSize: 11, fontWeight: "700", marginRight: 4 }}>
                  Buka
                </Text>
                <Ionicons name="arrow-forward" size={13} color={tool.color} />
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
    </SafeAreaView>
  );
};

export default ToolsScreen;
