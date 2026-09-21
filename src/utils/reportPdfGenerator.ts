// File: src/utils/reportPdfGenerator.ts
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { formatCurrency } from "./calculations";
import { gamificationBus } from "./gamificationBus";

export interface MonthlyReportCategoryItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface MonthlyReportTransactionItem {
  description: string;
  category: string;
  amount: number;
  date: string;
  type: "income" | "expense" | "transfer";
}

export interface MonthlyReportData {
  monthName: string;
  userName: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  healthScore: number;
  healthCategory: string;
  topCategories: MonthlyReportCategoryItem[];
  topTransactions: MonthlyReportTransactionItem[];
  insights: string[];
  peakDay?: { date: string; amount: number } | null;
  generatedDate: string;
}

export const generateMonthlyReportHtml = (data: MonthlyReportData): string => {
  const isSurplus = data.netSavings >= 0;
  const netColor = isSurplus ? "#10B981" : "#EF4444";
  const netBadge = isSurplus ? "Surplus (Hemat)" : "Defisit (Boncos)";

  const categoryRows = data.topCategories
    .slice(0, 6)
    .map((cat, index) => {
      const barWidth = Math.min(100, Math.max(8, Math.round(cat.percentage)));
      return `
        <tr>
          <td style="padding: 10px 12px; font-weight: 600; color: #1E293B;">
            <span style="display:inline-block; width:20px; color:#64748B;">#${index + 1}</span> ${cat.category}
          </td>
          <td style="padding: 10px 12px; font-weight: 700; text-align: right; color: #0F172A;">
            ${formatCurrency(cat.amount)}
          </td>
          <td style="padding: 10px 12px; width: 140px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="flex: 1; background: #E2E8F0; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: #0284C7; height: 100%; width: ${barWidth}%;"></div>
              </div>
              <span style="font-size: 11px; font-weight: 700; color: #475569; width: 36px; text-align: right;">
                ${cat.percentage.toFixed(0)}%
              </span>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  const transactionRows = data.topTransactions
    .slice(0, 5)
    .map((tx) => {
      const isExp = tx.type === "expense";
      const badgeColor = isExp ? "#EF4444" : "#10B981";
      const sign = isExp ? "-" : "+";
      return `
        <tr>
          <td style="padding: 8px 12px; color: #334155; font-size: 12px;">${tx.date}</td>
          <td style="padding: 8px 12px; color: #0F172A; font-weight: 600; font-size: 12px;">
            ${tx.description || tx.category}
            <div style="font-size: 10px; color: #64748B; font-weight: normal;">${tx.category}</div>
          </td>
          <td style="padding: 8px 12px; font-weight: 700; text-align: right; color: ${badgeColor}; font-size: 12px;">
            ${sign}${formatCurrency(tx.amount)}
          </td>
        </tr>
      `;
    })
    .join("");

  const insightsList = data.insights
    .slice(0, 3)
    .map(
      (ins) => `
      <li style="margin-bottom: 8px; font-size: 12px; color: #334155; line-height: 1.5;">
        ${ins}
      </li>
    `,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8" />
      <title>Laporan Keuangan MyMoney - ${data.monthName}</title>
      <style>
        @page {
          size: A4;
          margin: 18mm 16mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0F172A;
          background: #FFFFFF;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .header-card {
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
          border-radius: 16px;
          padding: 24px;
          color: #FFFFFF;
          margin-bottom: 20px;
        }
        .app-title {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #22D3EE;
          margin: 0 0 4px 0;
        }
        .report-subtitle {
          font-size: 12px;
          color: #94A3B8;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }
        .grid-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 22px;
        }
        .metric-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 14px 16px;
        }
        .metric-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #64748B;
          margin-bottom: 4px;
        }
        .metric-value {
          font-size: 16px;
          font-weight: 800;
          color: #0F172A;
        }
        .section-title {
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #0F172A;
          border-left: 4px solid #0284C7;
          padding-left: 8px;
          margin: 18px 0 10px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          font-size: 12px;
        }
        th {
          background: #F1F5F9;
          color: #475569;
          font-weight: 700;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          padding: 8px 12px;
          text-align: left;
        }
        tr:nth-child(even) {
          background: #F8FAFC;
        }
        .badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 800;
        }
        .footer {
          margin-top: 30px;
          padding-top: 14px;
          border-top: 1px solid #E2E8F0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          color: #94A3B8;
        }
      </style>
    </head>
    <body>
      <!-- Header Banner -->
      <div class="header-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1 class="app-title">MyMoney • Rapor Keuangan Bulanan</h1>
            <p class="report-subtitle">Periode: ${data.monthName}</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; color: #94A3B8;">Pengguna:</div>
            <div style="font-size: 15px; font-weight: 800; color: #FFFFFF;">${data.userName || "Pengguna MyMoney"}</div>
            <div style="font-size: 10px; color: #38BDF8; margin-top: 2px;">Skor Kesehatan: ${data.healthScore}/100 (${data.healthCategory})</div>
          </div>
        </div>
      </div>

      <!-- 4 Executive Cards -->
      <div class="grid-cards">
        <div class="metric-card">
          <div class="metric-label">Total Pemasukan</div>
          <div class="metric-value" style="color: #10B981;">${formatCurrency(data.totalIncome)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Pengeluaran</div>
          <div class="metric-value" style="color: #EF4444;">${formatCurrency(data.totalExpense)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Arus Kas Bersih</div>
          <div class="metric-value" style="color: ${netColor};">${formatCurrency(data.netSavings)}</div>
          <div style="font-size: 9px; font-weight: 700; color: ${netColor}; margin-top: 3px;">${netBadge}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Rasio Tabungan</div>
          <div class="metric-value" style="color: #0284C7;">${data.savingsRate.toFixed(1)}%</div>
          <div style="font-size: 9px; color: #64748B; margin-top: 3px;">Target ideal: ≥ 20%</div>
        </div>
      </div>

      <!-- Categories Table -->
      <div class="section-title">Distribusi Kategori Pengeluaran Terbesar</div>
      <table>
        <thead>
          <tr>
            <th>Kategori</th>
            <th style="text-align: right;">Nominal</th>
            <th>Porsi Anggaran</th>
          </tr>
        </thead>
        <tbody>
          ${categoryRows || '<tr><td colspan="3" style="text-align:center; padding:12px; color:#94A3B8;">Tidak ada pengeluaran pada periode ini.</td></tr>'}
        </tbody>
      </table>

      <!-- Top Transactions -->
      ${
        data.topTransactions.length > 0
          ? `
        <div class="section-title">Transaksi Utama Bulan Ini</div>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Deskripsi</th>
              <th style="text-align: right;">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            ${transactionRows}
          </tbody>
        </table>
      `
          : ""
      }

      <!-- Insights / Smart Evaluation -->
      ${
        data.insights.length > 0
          ? `
        <div class="section-title">Analisis & Rekomendasi Cerdas</div>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;">
          <ul style="margin: 0; padding-left: 18px;">
            ${insightsList}
          </ul>
        </div>
      `
          : ""
      }

      <!-- Footer -->
      <div class="footer">
        <div>Dicetak secara privat & offline oleh <strong>MyMoney App</strong></div>
        <div>Tanggal cetak: ${data.generatedDate}</div>
      </div>
    </body>
    </html>
  `;
};

export const exportMonthlyReportPdf = async (data: MonthlyReportData): Promise<void> => {
  try {
    const html = generateMonthlyReportHtml(data);
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
        dialogTitle: `Laporan Keuangan MyMoney - ${data.monthName}`,
      });
      gamificationBus.award("report_exported");
    } else {
      throw new Error("Fitur berbagi tidak didukung pada perangkat ini.");
    }
  } catch (error: any) {
    console.error("Gagal mengekspor laporan PDF:", error);
    throw error;
  }
};
