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

// 2. Bagi Anggaran 50/30/20
export const SalaryCalc = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const { BG, SURF, ACCENT, TP, TS, BORDER, colors } = useToolsTheme();
  const [salary, setSalary] = useState("");
  const [extra, setExtra] = useState("");

  const handleRefresh = () => {
    setSalary("");
    setExtra("");
  };

  const total = safeNumber(Number(salary)) + safeNumber(Number(extra));
  const needs = total * 0.5;
  const wants = total * 0.3;
  const savings = total * 0.2;

  return (
    <Modal
      visible={visible}
      statusBarTranslucent={true}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: "transparent" }}
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
            maxHeight: "88%",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: `${Colors.success}18`,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Ionicons
                name="pie-chart-outline"
                size={20}
                color={Colors.success}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TP, fontSize: 16, fontWeight: "800" }}>
                Bagi Anggaran 50/30/20
              </Text>
              <Text
                style={{ color: Colors.gray400, fontSize: 11, marginTop: 2 }}
              >
                Alokasi pemasukan otomatis: Kebutuhan, Keinginan, Tabungan
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

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <Label text="Pemasukan Utama" />
            <InputBox
              value={salary}
              onChange={setSalary}
              placeholder="Nominal uang masuk utama"
            />
            <Label text="Pemasukan Tambahan (opsional)" />
            <InputBox
              value={extra}
              onChange={setExtra}
              placeholder="Freelance, uang saku, bonus, dll"
            />

            <View
              style={{
                backgroundColor: `${Colors.success}10`,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: `${Colors.success}20`,
              }}
            >
              <Text
                style={{
                  color: Colors.gray400,
                  fontSize: 10,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                Total: {fmt(total)}
              </Text>
              {[
                {
                  pct: "50%",
                  label: "🏠 Kebutuhan Pokok",
                  sub: "Makan, kos, listrik, transportasi",
                  val: needs,
                  c: Colors.info,
                },
                {
                  pct: "30%",
                  label: "🎮 Keinginan",
                  sub: "Nongkrong, hiburan, belanja",
                  val: wants,
                  c: Colors.warning,
                },
                {
                  pct: "20%",
                  label: "🏦 Tabungan & Investasi",
                  sub: "Dana darurat, tabungan, hutang",
                  val: savings,
                  c: Colors.success,
                },
              ].map((row) => (
                <View
                  key={row.pct}
                  style={{
                    backgroundColor: `${row.c}12`,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: `${row.c}20`,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View>
                      <Text
                        style={{ color: TP, fontSize: 13, fontWeight: "700" }}
                      >
                        {row.label}
                      </Text>
                      <Text
                        style={{
                          color: Colors.gray400,
                          fontSize: 11,
                          marginTop: 2,
                        }}
                      >
                        {row.sub}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text
                        style={{
                          color: row.c,
                          fontSize: 15,
                          fontWeight: "800",
                        }}
                      >
                        {fmt(row.val)}
                      </Text>
                      <Text style={{ color: Colors.gray500, fontSize: 10 }}>
                        {row.pct}
                      </Text>
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


export default SalaryCalc;
