import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../theme/theme";
import { useTheme } from "../../../theme/ThemeContext";
import { formatCurrency, safeNumber } from "../../../utils/calculations";
import {
  useToolsTheme,
  R,
  PAD,
  fmt,
  daysLeftInMonth,
  Label,
  InputBox,
  ResultRow,
} from "../common";

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
  const { BG, TP, BORDER } = useToolsTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      {/* Header: Label & Mode Switcher */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {icon && <Ionicons name={icon} size={14} color={Colors.gray400} />}
          <Text
            style={{
              color: Colors.gray400,
              fontSize: 10,
              fontWeight: "700",
              letterSpacing: 1.1,
              textTransform: "uppercase",
            }}
          >
            {label}
          </Text>
        </View>

        {/* Toggle [% Persen] vs [Rp Nominal] */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: BG,
            borderRadius: 8,
            padding: 2,
            borderWidth: 1,
            borderColor: BORDER,
          }}
        >
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
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: mode === "percent" ? "#FFF" : Colors.gray400,
              }}
            >
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
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: mode === "amount" ? "#FFF" : Colors.gray400,
              }}
            >
              Rp Nominal
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Input Box */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: BG,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: BORDER,
          paddingHorizontal: 14,
        }}
      >
        {mode === "amount" && (
          <Text
            style={{
              color: Colors.gray400,
              fontSize: 16,
              fontWeight: "700",
              marginRight: 4,
            }}
          >
            Rp
          </Text>
        )}
        <TextInput
          value={
            mode === "amount"
              ? value
                ? parseInt(value, 10).toLocaleString("id-ID")
                : ""
              : value
          }
          onChangeText={(t) => {
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
          placeholder={
            placeholder ||
            (mode === "percent" ? "0 (Bebas ketik %)" : "0 (Bebas ketik Rp)")
          }
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
          <Text
            style={{
              color: Colors.gray400,
              fontSize: 16,
              fontWeight: "700",
              marginLeft: 4,
            }}
          >
            %
          </Text>
        )}
      </View>

      {/* Preset Quick Chips */}
      {mode === "percent" && percentChips && percentChips.length > 0 && (
        <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
          {percentChips.map((chip) => {
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
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: isSelected ? "#EC4899" : Colors.gray400,
                  }}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {mode === "amount" && amountChips && amountChips.length > 0 && (
        <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
          {amountChips.map((chip) => {
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
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: isSelected ? "#EC4899" : Colors.gray400,
                  }}
                >
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

export const SplitBillCalc = ({
  visible,
  onClose,
  onRecordExpense,
}: {
  visible: boolean;
  onClose: () => void;
  onRecordExpense: (amount: number, desc: string) => void;
}) => {
  const { BG, SURF, ACCENT, TP, TS, BORDER, colors } = useToolsTheme();
  const [mode, setMode] = useState<"equal" | "itemized">("equal");

  // Mode 1: Bagi Rata
  const [totalBill, setTotalBill] = useState("");
  const [numPeople, setNumPeople] = useState("2");

  // Dynamic Tax, Service, and Discount
  const [taxMode, setTaxMode] = useState<"percent" | "amount">("percent");
  const [taxValue, setTaxValue] = useState<string>("");

  const [serviceMode, setServiceMode] = useState<"percent" | "amount">(
    "percent",
  );
  const [serviceValue, setServiceValue] = useState<string>("");

  const [discountMode, setDiscountMode] = useState<"amount" | "percent">(
    "amount",
  );
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
  const rawTax =
    taxMode === "percent"
      ? rawSubtotal * (parseNum(taxValue) / 100)
      : parseNum(taxValue);
  const rawService =
    serviceMode === "percent"
      ? rawSubtotal * (parseNum(serviceValue) / 100)
      : parseNum(serviceValue);
  const rawDiscount =
    discountMode === "percent"
      ? rawSubtotal * (parseNum(discountValue) / 100)
      : parseNum(discountValue);

  const rawTotal = Math.max(0, rawSubtotal + rawTax + rawService - rawDiscount);
  const countPeople = Math.max(1, parseInt(numPeople, 10) || 1);
  const perPersonRaw = countPeople > 0 ? rawTotal / countPeople : 0;
  const perPersonFinal = applyRounding(perPersonRaw, rounding);

  // Mode 2 calculations
  const itemizedSubtotal = people.reduce(
    (sum, p) => sum + safeNumber(Number(p.amount)),
    0,
  );
  const itemizedTax =
    taxMode === "percent"
      ? itemizedSubtotal * (parseNum(taxValue) / 100)
      : parseNum(taxValue);
  const itemizedService =
    serviceMode === "percent"
      ? itemizedSubtotal * (parseNum(serviceValue) / 100)
      : parseNum(serviceValue);
  const itemizedDiscount =
    discountMode === "percent"
      ? itemizedSubtotal * (parseNum(discountValue) / 100)
      : parseNum(discountValue);
  const itemizedTotal = Math.max(
    0,
    itemizedSubtotal + itemizedTax + itemizedService - itemizedDiscount,
  );

  const peopleResults = useMemo(() => {
    if (itemizedSubtotal === 0) {
      return people.map((p) => ({
        ...p,
        baseAmount: 0,
        extraShare: 0,
        finalAmount: 0,
      }));
    }
    return people.map((p) => {
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
  }, [
    people,
    itemizedSubtotal,
    itemizedTax,
    itemizedService,
    itemizedDiscount,
    rounding,
  ]);

  // Dynamic labels for share & receipts
  const taxLabel =
    taxMode === "percent" ? `Pajak (${taxValue || "0"}%)` : "Pajak";
  const serviceLabel =
    serviceMode === "percent"
      ? `Service (${serviceValue || "0"}%)`
      : "Biaya Layanan";
  const discountLabel =
    discountMode === "percent" ? `Diskon (${discountValue || "0"}%)` : "Diskon";

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
          (rawDiscount > 0
            ? `🏷️ ${discountLabel}: -${fmt(rawDiscount)}\n`
            : "") +
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
        if (itemizedTax > 0)
          extraItems.push(`${taxLabel}: +${fmt(itemizedTax)}`);
        if (itemizedService > 0)
          extraItems.push(`${serviceLabel}: +${fmt(itemizedService)}`);
        if (itemizedDiscount > 0)
          extraItems.push(`${discountLabel}: -${fmt(itemizedDiscount)}`);

        const extraNote =
          extraItems.length > 0
            ? `\n_Catatan Biaya Tambahan:_\n${extraItems.map((e) => `• ${e}`).join("\n")}\n`
            : "";

        message =
          `📋 *Rincian Patungan Tagihan*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          peopleResults
            .map(
              (p, i) =>
                `${i + 1}. *${p.name || (i === 0 ? "Saya" : `Teman ${i}`)}*: ${fmt(p.finalAmount)}`,
            )
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
      onRecordExpense(
        myShare,
        `Patungan (${peopleResults[0]?.name || "Saya"})`,
      );
    }
    onClose();
  };

  const addPerson = () => {
    // Cari nomor teman terkecil yang belum digunakan (agar jika Teman 2 dihapus lalu ditambah lagi, ia kembali memakai Teman 2)
    const usedNumbers = new Set<number>();
    people.forEach((p) => {
      const match = p.name.trim().match(/^(?:Teman|Orang)\s*(\d+)$/i);
      if (match) {
        usedNumbers.add(parseInt(match[1], 10));
      }
    });

    let nextNum = 1;
    while (usedNumbers.has(nextNum)) {
      nextNum++;
    }

    setPeople((prev) => [
      ...prev,
      { id: String(Date.now()), name: `Teman ${nextNum}`, amount: "" },
    ]);
  };

  const removePerson = (id: string) => {
    if (people.length <= 2) {
      Alert.alert("Minimal 2 Orang", "Patungan membutuhkan minimal 2 orang");
      return;
    }
    setPeople((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePerson = (id: string, field: "name" | "amount", val: string) => {
    setPeople((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: val } : p)),
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
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
        <View
          style={{
            backgroundColor: SURF,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: PAD,
            paddingBottom: 24,
            borderTopWidth: 1,
            borderTopColor: BORDER,
            maxHeight: "92%",
          }}
        >
          {/* Header Modal */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: "#EC489918",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Ionicons name="people-outline" size={20} color="#EC4899" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TP, fontSize: 16, fontWeight: "800" }}>
                Split Bill
              </Text>
              <Text
                style={{ color: Colors.gray400, fontSize: 11, marginTop: 2 }}
              >
                Hitung cepat bagi tagihan makan & nongkrong
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleRefresh}
              style={{ marginRight: 16 }}
            >
              <Ionicons name="refresh" size={24} color={Colors.gray400} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={Colors.gray500} />
            </TouchableOpacity>
          </View>

          {/* Mode Switcher */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: BG,
              borderRadius: 12,
              padding: 3,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: BORDER,
            }}
          >
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
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: mode === "equal" ? "#FFF" : Colors.gray400,
                }}
              >
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
                backgroundColor:
                  mode === "itemized" ? "#EC4899" : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: mode === "itemized" ? "#FFF" : Colors.gray400,
                }}
              >
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
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 16,
                  }}
                >
                  <TouchableOpacity
                    onPress={() =>
                      setNumPeople(
                        String(Math.max(1, (parseInt(numPeople, 10) || 1) - 1)),
                      )
                    }
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
                    onChangeText={(t) => setNumPeople(t.replace(/\D/g, ""))}
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
                    onPress={() =>
                      setNumPeople(String((parseInt(numPeople, 10) || 1) + 1))
                    }
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
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
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
                    <Text
                      style={{ color: ACCENT, fontSize: 11, fontWeight: "700" }}
                    >
                      Tambah
                    </Text>
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
                      onChangeText={(t) => updatePerson(p.id, "name", t)}
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
                        value={
                          p.amount
                            ? `Rp ${parseInt(p.amount, 10).toLocaleString("id-ID")}`
                            : ""
                        }
                        onChangeText={(t) =>
                          updatePerson(p.id, "amount", t.replace(/\D/g, ""))
                        }
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
                      <TouchableOpacity
                        onPress={() => removePerson(p.id)}
                        style={{ padding: 4 }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color={Colors.error}
                        />
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
              placeholder={
                taxMode === "percent"
                  ? "Masukan Pajak Restoran"
                  : "Masukan Pajak Restoran"
              }
            />

            <DualModeInput
              label="Biaya Layanan"
              icon="restaurant-outline"
              mode={serviceMode}
              setMode={setServiceMode}
              value={serviceValue}
              setValue={setServiceValue}
              placeholder={
                serviceMode === "percent"
                  ? "Masukan Biaya Layanan"
                  : "Masukan Biaya Layanan"
              }
            />

            <DualModeInput
              label="Potongan Diskon"
              icon="pricetag-outline"
              mode={discountMode}
              setMode={setDiscountMode}
              value={discountValue}
              setValue={setDiscountValue}
              placeholder={
                discountMode === "amount"
                  ? "Masukan Potongan Diskon"
                  : "Masukan Potongan Diskon"
              }
            />

            <Label text="Opsi Pembulatan" />
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 18 }}>
              {[
                { label: "Pas (Rp)", val: "none" as const },
                { label: "Ke Rp 500", val: "500" as const },
                { label: "Ke Rp 1.000", val: "1000" as const },
              ].map((item) => {
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
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: isSelected ? "#FFF" : Colors.gray400,
                      }}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ════════════ HASIL RINGKASAN ════════════ */}
            <View
              style={{
                backgroundColor: `${ACCENT}10`,
                borderRadius: 18,
                padding: 16,
                borderWidth: 1,
                borderColor: `${ACCENT}25`,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  color: TP,
                  fontSize: 13,
                  fontWeight: "700",
                  marginBottom: 12,
                }}
              >
                Rincian Tagihan:
              </Text>

              <ResultRow
                label="Subtotal Pesanan"
                value={fmt(mode === "equal" ? rawSubtotal : itemizedSubtotal)}
                color={TP}
              />
              {(mode === "equal" ? rawTax : itemizedTax) > 0 && (
                <ResultRow
                  label={
                    taxMode === "percent"
                      ? `Pajak (${taxValue || "0"}%)`
                      : "Pajak (Nominal)"
                  }
                  value={`+${fmt(mode === "equal" ? rawTax : itemizedTax)}`}
                  color={Colors.warning}
                />
              )}
              {(mode === "equal" ? rawService : itemizedService) > 0 && (
                <ResultRow
                  label={
                    serviceMode === "percent"
                      ? `Biaya Layanan (${serviceValue || "0"}%)`
                      : "Biaya Layanan / Service"
                  }
                  value={`+${fmt(mode === "equal" ? rawService : itemizedService)}`}
                  color={Colors.warning}
                />
              )}
              {(mode === "equal" ? rawDiscount : itemizedDiscount) > 0 && (
                <ResultRow
                  label={
                    discountMode === "percent"
                      ? `Diskon (${discountValue || "0"}%)`
                      : "Potongan Diskon"
                  }
                  value={`-${fmt(mode === "equal" ? rawDiscount : itemizedDiscount)}`}
                  color={Colors.success}
                />
              )}
              <ResultRow
                label="Total Bersih Kasir"
                value={fmt(mode === "equal" ? rawTotal : itemizedTotal)}
                color={ACCENT}
              />

              {/* Box Highlight Bagi Rata */}
              {mode === "equal" && (
                <View
                  style={{
                    marginTop: 14,
                    backgroundColor: "#EC489918",
                    padding: 14,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#EC489935",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: TS,
                      fontSize: 11,
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Masing-masing Bayar:
                  </Text>
                  <Text
                    style={{
                      color: "#EC4899",
                      fontSize: 24,
                      fontWeight: "800",
                      marginTop: 4,
                    }}
                  >
                    {fmt(perPersonFinal)}
                  </Text>
                  <Text
                    style={{
                      color: Colors.gray400,
                      fontSize: 10,
                      marginTop: 2,
                    }}
                  >
                    Dibagi rata {countPeople} orang{" "}
                    {rounding !== "none" ? `(Dibulatkan ke ${rounding})` : ""}
                  </Text>
                </View>
              )}

              {/* Box Highlight Per Orang */}
              {mode === "itemized" && (
                <View style={{ marginTop: 14 }}>
                  <Text
                    style={{
                      color: TP,
                      fontSize: 12,
                      fontWeight: "700",
                      marginBottom: 8,
                    }}
                  >
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
                        <Text
                          style={{ color: TP, fontSize: 13, fontWeight: "700" }}
                        >
                          {p.name || (i === 0 ? "Saya" : `Teman ${i}`)}
                        </Text>
                        <Text style={{ color: Colors.gray400, fontSize: 10 }}>
                          Pesanan: {fmt(p.baseAmount)}{" "}
                          {p.extraShare !== 0
                            ? `+ Biaya/Tax: ${fmt(p.extraShare)}`
                            : ""}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: "#EC4899",
                          fontSize: 15,
                          fontWeight: "800",
                        }}
                      >
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
                <Text
                  style={{ color: "#FFF", fontSize: 14, fontWeight: "700" }}
                >
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
                <Text
                  style={{ color: ACCENT, fontSize: 13, fontWeight: "700" }}
                >
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

export default SplitBillCalc;
