// File: src/screens/Home/components/ExpenseTrendChart.tsx
// Dual-line crypto-style chart — Income (green) + Expense (red)
// Change % = current period total vs previous equivalent period total

import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Circle,
  Line,
} from "react-native-svg";
import { useTheme } from "../../../theme/ThemeContext";
import { formatCurrency } from "../../../utils/calculations";
import { Transaction } from "../../../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_W   = SCREEN_WIDTH - 36 - 40; // 18px padding x2 + 20 card pad x2
const CHART_H   = 150;
const PAD_TOP   = 14;
const PAD_BOT   = 10;
const PAD_L     = 0;
const PAD_R     = 0;

type FilterKey = "7D" | "1M" | "3M" | "1Y";
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "7D",  label: "7H" },
  { key: "1M",  label: "1B" },
  { key: "3M",  label: "3B" },
  { key: "1Y",  label: "1T" },
];

interface ChartPoint { x: number; y: number; value: number; dateStr: string }

/** Smooth cubic bezier path from points */
function smoothPath(pts: ChartPoint[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cp = (pts[i - 1].x + pts[i].x) / 2;
    d += ` C ${cp} ${pts[i - 1].y}, ${cp} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }
  return d;
}

/** Area path (closed at bottom) */
function areaPath(pts: ChartPoint[], bottom: number): string {
  if (pts.length < 2) return "";
  return `${smoothPath(pts)} L ${pts[pts.length - 1].x} ${bottom} L ${pts[0].x} ${bottom} Z`;
}

/** Build daily bucket map for a date range */
function buildBuckets(
  transactions: Transaction[],
  type: "income" | "expense",
  startDate: Date,
  days: number
): { keys: string[]; values: number[] } {
  const buckets: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    buckets[`${year}-${month}-${day}`] = 0;
  }
  transactions.forEach((t) => {
    const tDate = t.date.split("T")[0]; // safely get YYYY-MM-DD
    if (t.type === type && buckets[tDate] !== undefined) {
      buckets[tDate] += t.amount;
    }
  });
  const keys = Object.keys(buckets).sort();
  return { keys, values: keys.map((k) => buckets[k]) };
}

/** Map values to screen coordinates given shared min/max */
function toPoints(keys: string[], values: number[], minV: number, maxV: number): ChartPoint[] {
  const range = maxV - minV || 1;
  const w = CHART_W - PAD_L - PAD_R;
  const h = CHART_H - PAD_TOP - PAD_BOT;
  return keys.map((k, i) => ({
    x: PAD_L + (i / (keys.length - 1 || 1)) * w,
    y: PAD_TOP + h - ((values[i] - minV) / range) * h,
    value: values[i],
    dateStr: k,
  }));
}

interface Props { transactions: Transaction[] }

const ExpenseTrendChart: React.FC<Props> = ({ transactions }) => {
  const { colors } = useTheme();
  const [filter, setFilter]           = useState<FilterKey>("1M");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [activeType, setActiveType]   = useState<"both" | "income" | "expense">("both");

  const COLOR_INC  = "#22C55E";   // hijau income
  const COLOR_EXP  = "#EF4444";   // merah expense
  const GRAD_INC   = "gradInc";
  const GRAD_EXP   = "gradExp";

  const data = useMemo(() => {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let days: number;
    let labelEvery: number;
    switch (filter) {
      case "7D":  days = 7;   labelEvery = 1;  break;
      case "3M":  days = 90;  labelEvery = 15; break;
      case "1Y":  days = 365; labelEvery = 60; break;
      default:    days = 30;  labelEvery = 7;  break;
    }

    // Current period start
    const curStart = new Date(today);
    curStart.setDate(curStart.getDate() - days + 1);

    // Previous period start (same length, immediately before)
    const prevStart = new Date(curStart);
    prevStart.setDate(prevStart.getDate() - days);

    // Build current period buckets
    const incB = buildBuckets(transactions, "income",  curStart, days);
    const expB = buildBuckets(transactions, "expense", curStart, days);

    // Build previous period buckets (for accurate change %)
    const prevIncB = buildBuckets(transactions, "income",  prevStart, days);
    const prevExpB = buildBuckets(transactions, "expense", prevStart, days);

    const curIncTotal  = incB.values.reduce((s, v) => s + v, 0);
    const curExpTotal  = expB.values.reduce((s, v) => s + v, 0);
    const prevIncTotal = prevIncB.values.reduce((s, v) => s + v, 0);
    const prevExpTotal = prevExpB.values.reduce((s, v) => s + v, 0);

    // Change % vs previous period
    const incChange  = prevIncTotal > 0 ? ((curIncTotal - prevIncTotal) / prevIncTotal) * 100 : 0;
    const expChange  = prevExpTotal > 0 ? ((curExpTotal - prevExpTotal) / prevExpTotal) * 100 : 0;

    // Shared Y scale (both series on same axis so you can compare)
    const allVals = [...incB.values, ...expB.values];
    const rawMax  = Math.max(...allVals, 0);
    const rawMin  = 0; // always start from 0 for financial charts
    const maxV    = rawMax * 1.12 || 1;

    const incPts = toPoints(incB.keys, incB.values, rawMin, maxV);
    const expPts = toPoints(expB.keys, expB.values, rawMin, maxV);

    // X-axis labels
    const xLabels = incB.keys
      .map((k, i) => ({ k, i }))
      .filter(({ i }) => {
        if (i === 0 || i === incB.keys.length - 1) return true;
        if (i % labelEvery === 0) {
          // Jangan tampilkan label tengah jika terlalu dekat dengan label terakhir
          if (incB.keys.length - 1 - i < labelEvery * 0.7) return false;
          return true;
        }
        return false;
      })
      .map(({ k, i }) => {
        const w = CHART_W - PAD_L - PAD_R;
        const x = PAD_L + (i / (incB.keys.length - 1 || 1)) * w;
        const d = new Date(k);
        const lbl = filter === "1Y"
          ? d.toLocaleDateString("id-ID", { month: "short" })
          : `${d.getDate()}/${d.getMonth() + 1}`;
        return { x, lbl };
      });

    return {
      incPts, expPts,
      curIncTotal, curExpTotal,
      prevIncTotal, prevExpTotal,
      incChange, expChange,
      hasData: rawMax > 0,
      xLabels,
      days,
      netChange: curIncTotal - curExpTotal,
    };
  }, [transactions, filter]);

  const selectedInc = selectedIdx !== null ? data.incPts[selectedIdx] : null;
  const selectedExp = selectedIdx !== null ? data.expPts[selectedIdx] : null;

  const showInc = activeType !== "expense";
  const showExp = activeType !== "income";

  const handleChartTap = (e: any) => {
    const tapX = e.nativeEvent?.locationX ?? 0;
    if (data.incPts.length === 0) return;
    let minDist = Infinity;
    let nearestIdx = 0;
    data.incPts.forEach((p, i) => {
      const dist = Math.abs(p.x - tapX);
      if (dist < minDist) { minDist = dist; nearestIdx = i; }
    });
    setSelectedIdx(selectedIdx === nearestIdx ? null : nearestIdx);
  };

  const bottom = CHART_H - PAD_BOT;

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: `${colors.border}80`,
      padding: 20,
      marginBottom: 20,
    }}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ color: colors.gray400, fontSize: 9, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>
            Tren Keuangan
          </Text>

          {selectedInc ? (
            // Tooltip mode — tampilkan nilai hari tertentu
            <View>
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "700", marginBottom: 2 }}>
                {new Date(selectedInc.dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLOR_INC, marginRight: 4 }} />
                  <Text style={{ color: COLOR_INC, fontSize: 12, fontWeight: "700" }}>{formatCurrency(selectedInc.value)}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLOR_EXP, marginRight: 4 }} />
                  <Text style={{ color: COLOR_EXP, fontSize: 12, fontWeight: "700" }}>{formatCurrency(selectedExp?.value ?? 0)}</Text>
                </View>
              </View>
            </View>
          ) : (
            // Default: tampilkan ringkasan perubahan vs periode sebelumnya
            <View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLOR_INC, marginRight: 4 }} />
                  <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: "700" }}>{formatCurrency(data.curIncTotal)}</Text>
                  <Text style={{
                    color: data.incChange >= 0 ? COLOR_INC : COLOR_EXP,
                    fontSize: 10, fontWeight: "600", marginLeft: 5,
                  }}>
                    {data.incChange >= 0 ? "▲" : "▼"} {Math.abs(data.incChange).toFixed(1)}%
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLOR_EXP, marginRight: 4 }} />
                <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: "700" }}>{formatCurrency(data.curExpTotal)}</Text>
                <Text style={{
                  color: data.expChange <= 0 ? COLOR_INC : COLOR_EXP,
                  fontSize: 10, fontWeight: "600", marginLeft: 5,
                }}>
                  {data.expChange >= 0 ? "▲" : "▼"} {Math.abs(data.expChange).toFixed(1)}%
                </Text>
              </View>
              <Text style={{ color: colors.gray400, fontSize: 9, marginTop: 3 }}>vs periode sebelumnya</Text>
            </View>
          )}
        </View>

        {/* Filter pills */}
        <View style={{
          flexDirection: "row",
          backgroundColor: colors.background,
          borderRadius: 10,
          padding: 2,
          borderWidth: 1,
          borderColor: `${colors.border}60`,
        }}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => { setFilter(f.key); setSelectedIdx(null); }}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: 9,
                  paddingVertical: 5,
                  borderRadius: 8,
                  backgroundColor: active ? "#6366F1" : "transparent",
                }}
              >
                <Text style={{ color: active ? "#fff" : colors.gray400, fontSize: 10, fontWeight: "700" }}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Series toggle ─────────────────────────────────────────────── */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        {([
          { key: "both",    label: "Semua"   },
          { key: "income",  label: "Masuk"   },
          { key: "expense", label: "Keluar"  },
        ] as const).map((opt) => (
          <TouchableOpacity
            key={opt.key}
            onPress={() => setActiveType(opt.key)}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
              backgroundColor: activeType === opt.key ? `${colors.accent}20` : `${colors.border}40`,
              borderWidth: 1,
              borderColor: activeType === opt.key ? `${colors.accent}40` : "transparent",
            }}
          >
            <Text style={{ color: activeType === opt.key ? colors.accent : colors.gray400, fontSize: 10, fontWeight: "700" }}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Chart ─────────────────────────────────────────────────────── */}
      {!data.hasData ? (
        <View style={{ height: CHART_H, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.gray400, fontSize: 12 }}>Belum ada data transaksi</Text>
        </View>
      ) : (
        <View>
          <Svg width={CHART_W} height={CHART_H} onPress={handleChartTap}>
            <Defs>
              <SvgLinearGradient id={GRAD_INC} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={COLOR_INC} stopOpacity="0.28" />
                <Stop offset="100%" stopColor={COLOR_INC} stopOpacity="0" />
              </SvgLinearGradient>
              <SvgLinearGradient id={GRAD_EXP} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={COLOR_EXP} stopOpacity="0.22" />
                <Stop offset="100%" stopColor={COLOR_EXP} stopOpacity="0" />
              </SvgLinearGradient>
            </Defs>

            {/* Horizontal grid lines */}
            {[0.25, 0.5, 0.75].map((frac, i) => (
              <Line
                key={i}
                x1={PAD_L} y1={PAD_TOP + (CHART_H - PAD_TOP - PAD_BOT) * (1 - frac)}
                x2={CHART_W - PAD_R} y2={PAD_TOP + (CHART_H - PAD_TOP - PAD_BOT) * (1 - frac)}
                stroke={`${colors.border}35`} strokeWidth="1" strokeDasharray="4,4"
              />
            ))}

            {/* INCOME — gradient area + line */}
            {showInc && data.incPts.length > 1 && (
              <>
                <Path d={areaPath(data.incPts, bottom)} fill={`url(#${GRAD_INC})`} />
                <Path
                  d={smoothPath(data.incPts)}
                  fill="none" stroke={COLOR_INC}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
              </>
            )}

            {/* EXPENSE — gradient area + line */}
            {showExp && data.expPts.length > 1 && (
              <>
                <Path d={areaPath(data.expPts, bottom)} fill={`url(#${GRAD_EXP})`} />
                <Path
                  d={smoothPath(data.expPts)}
                  fill="none" stroke={COLOR_EXP}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
              </>
            )}

            {/* Tooltip crosshair */}
            {selectedInc && (
              <>
                <Line
                  x1={selectedInc.x} y1={PAD_TOP}
                  x2={selectedInc.x} y2={bottom}
                  stroke={`${colors.textPrimary}30`} strokeWidth="1" strokeDasharray="3,3"
                />
                {showInc && (
                  <>
                    <Circle cx={selectedInc.x} cy={selectedInc.y} r={5} fill={COLOR_INC} />
                    <Circle cx={selectedInc.x} cy={selectedInc.y} r={9} fill={`${COLOR_INC}25`} />
                  </>
                )}
                {showExp && selectedExp && (
                  <>
                    <Circle cx={selectedExp.x} cy={selectedExp.y} r={5} fill={COLOR_EXP} />
                    <Circle cx={selectedExp.x} cy={selectedExp.y} r={9} fill={`${COLOR_EXP}25`} />
                  </>
                )}
              </>
            )}

            {/* End dots (latest point glow) */}
            {!selectedInc && data.incPts.length > 0 && showInc && (
              <>
                <Circle cx={data.incPts[data.incPts.length - 1].x} cy={data.incPts[data.incPts.length - 1].y} r={4} fill={COLOR_INC} />
                <Circle cx={data.incPts[data.incPts.length - 1].x} cy={data.incPts[data.incPts.length - 1].y} r={8} fill={`${COLOR_INC}25`} />
              </>
            )}
            {!selectedInc && data.expPts.length > 0 && showExp && (
              <>
                <Circle cx={data.expPts[data.expPts.length - 1].x} cy={data.expPts[data.expPts.length - 1].y} r={4} fill={COLOR_EXP} />
                <Circle cx={data.expPts[data.expPts.length - 1].x} cy={data.expPts[data.expPts.length - 1].y} r={8} fill={`${COLOR_EXP}25`} />
              </>
            )}
          </Svg>

          {/* X-axis labels */}
          <View style={{ height: 16, position: "relative", marginTop: 4 }}>
            {data.xLabels.map((xl, i) => (
              <Text key={i} style={{
                position: "absolute",
                left: xl.x - 16,
                color: colors.gray400,
                fontSize: 9,
                width: 32,
                textAlign: "center",
              }}>
                {xl.lbl}
              </Text>
            ))}
          </View>
        </View>
      )}


    </View>
  );
};

export default ExpenseTrendChart;
