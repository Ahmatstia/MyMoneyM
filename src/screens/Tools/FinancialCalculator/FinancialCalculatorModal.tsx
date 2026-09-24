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

// 5. Kalkulator Biasa
export const BasicCalc = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const { BG, SURF, ACCENT, TP, TS, BORDER, colors } = useToolsTheme();
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
      setExpression((prev) => prev.slice(0, -1));
      setResult("");
      return;
    }
    if (val === "=") {
      try {
        const sanitized = expression.replace(/[^0-9+\-*/.%]/g, "");
        if (!sanitized) return;
        const withPercent = sanitized.replace(/%/g, "/100");
        const evalResult = new Function("return " + withPercent)();
        if (
          evalResult !== undefined &&
          !isNaN(evalResult) &&
          isFinite(evalResult)
        ) {
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

    if (result && !["+", "-", "*", "/", "%"].includes(char)) {
      setExpression(char);
      setResult("");
      return;
    }
    if (result && ["+", "-", "*", "/", "%"].includes(char)) {
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

    setExpression((prev) => prev + char);
  };

  const formatExpr = (expr: string) => {
    return expr
      .replace(/\d+(\.\d*)?/g, (match) => {
        const parts = match.split(".");
        if (!parts[0] && parts[0] !== "0") return match;
        const intPart = parseInt(parts[0], 10).toLocaleString("id-ID");
        if (parts.length > 1) {
          return `${intPart},${parts[1]}`;
        }
        return intPart;
      })
      .replace(/\*/g, " × ")
      .replace(/\//g, " ÷ ")
      .replace(/\+/g, " + ")
      .replace(/-/g, " - ");
  };

  const formatRes = (res: string) => {
    if (!res || res === "Error") return res;
    if (res.includes("e")) return res;
    const parts = res.split(".");
    const isNeg = parts[0].startsWith("-");
    const rawInt = isNeg ? parts[0].substring(1) : parts[0];
    const intPart = parseInt(rawInt || "0", 10).toLocaleString("id-ID");
    const signedInt = isNeg ? `-${intPart}` : intPart;
    if (parts.length > 1) {
      return `${signedInt},${parts[1]}`;
    }
    return signedInt;
  };

  const rows = [
    [
      { l: "C", c: Colors.error },
      { l: "DEL", c: Colors.warning },
      { l: "%", c: ACCENT },
      { l: "÷", c: ACCENT },
    ],
    [{ l: "7" }, { l: "8" }, { l: "9" }, { l: "×", c: ACCENT }],
    [{ l: "4" }, { l: "5" }, { l: "6" }, { l: "-", c: ACCENT }],
    [{ l: "1" }, { l: "2" }, { l: "3" }, { l: "+", c: ACCENT }],
    [{ l: "00" }, { l: "0" }, { l: "," }, { l: "=", c: Colors.success }],
  ];

  return (
    <Modal
      visible={visible}
      statusBarTranslucent={true}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "transparent",
        }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={{
            backgroundColor: SURF,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: PAD,
            paddingBottom: 36,
            borderTopWidth: 1,
            borderTopColor: BORDER,
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
                backgroundColor: `${Colors.info}18`,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Ionicons
                name="calculator-outline"
                size={20}
                color={Colors.info}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TP, fontSize: 16, fontWeight: "800" }}>
                Kalkulator Biasa
              </Text>
              <Text
                style={{ color: Colors.gray400, fontSize: 11, marginTop: 2 }}
              >
                Hitung-hitungan manual cepat
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

          <View
            style={{
              backgroundColor: BG,
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: BORDER,
              minHeight: 120,
              justifyContent: "flex-end",
              alignItems: "flex-end",
            }}
          >
            <Text
              style={{
                color: TS,
                fontSize: 24,
                marginBottom: 8,
                textAlign: "right",
              }}
            >
              {formatExpr(expression) || "0"}
            </Text>
            <Text
              style={{
                color: result === "Error" ? Colors.error : TP,
                fontSize: 44,
                fontWeight: "800",
                textAlign: "right",
              }}
            >
              {result ? formatRes(result) : expression ? "" : "0"}
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
                      flex: 1,
                      height: 60,
                      borderRadius: 16,
                      backgroundColor: btn.c ? `${btn.c}15` : `${BG}`,
                      borderWidth: 1,
                      borderColor: btn.c ? `${btn.c}30` : BORDER,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: btn.c || TP,
                        fontSize: 22,
                        fontWeight: "700",
                      }}
                    >
                      {btn.l}
                    </Text>
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


export default BasicCalc;
