// File: src/screens/Tools/FinancialCalculator/FinancialCalculatorScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../../../theme/theme";
import { AppHeader } from "../../../components/common";
import { useToolsTheme } from "../common";

export const FinancialCalculatorScreen: React.FC = () => {
  const { BG, SURF, ACCENT, TP, TS, BORDER, colors } = useToolsTheme();
  const navigation = useNavigation<any>();

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
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      {/* ── Standardized AppHeader ── */}
      <AppHeader
        title="Kalkulator Cepat"
        subtitle="Hitung-hitungan manual instan"
        showBack={true}
        rightComponent={
          <TouchableOpacity
            onPress={handleRefresh}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: `${colors.border}40`,
              alignItems: "center",
              justifyContent: "center",
            }}
            accessibilityLabel="Reset Kalkulator"
          >
            <Ionicons name="refresh" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={{ padding: 20, flexGrow: 1, justifyContent: "space-between" }}
        showsVerticalScrollIndicator={false}
      >
        {/* Display Screen */}
        <View
          style={{
            backgroundColor: SURF,
            borderRadius: 24,
            padding: 24,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: BORDER,
            minHeight: 140,
            justifyContent: "flex-end",
            alignItems: "flex-end",
          }}
        >
          <Text
            style={{
              color: TS,
              fontSize: 22,
              marginBottom: 8,
              textAlign: "right",
              fontWeight: "600",
            }}
          >
            {formatExpr(expression) || "0"}
          </Text>
          <Text
            style={{
              color: result === "Error" ? Colors.error : TP,
              fontSize: 42,
              fontWeight: "800",
              textAlign: "right",
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {result ? formatRes(result) : expression ? "" : "0"}
          </Text>
        </View>

        {/* Keypad Grid */}
        <View style={{ gap: 12, paddingBottom: 20 }}>
          {rows.map((row, rIdx) => (
            <View key={rIdx} style={{ flexDirection: "row", gap: 12 }}>
              {row.map((btn, bIdx) => (
                <TouchableOpacity
                  key={bIdx}
                  onPress={() => handlePress(btn.l)}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    height: 64,
                    borderRadius: 18,
                    backgroundColor: btn.c ? `${btn.c}15` : SURF,
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default FinancialCalculatorScreen;
