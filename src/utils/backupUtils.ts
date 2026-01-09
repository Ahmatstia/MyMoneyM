import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
// import * as Print from "expo-print";
import { Alert, Platform } from "react-native";
import {
  AppState,
  Transaction,
  Budget,
  Savings,
  Note,
  SavingsTransaction,
} from "../types";
import { calculateTotals } from "./calculations";

// Format tanggal untuk nama file
export const formatDateForFilename = (): string => {
  const now = new Date();
  return now
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .split(".")[0];
};

// Format uang untuk PDF
export const formatCurrencyForPDF = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Format tanggal untuk tampilan
export const formatDateForDisplay = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

// Validasi transaction
const validateTransaction = (obj: any): Transaction | null => {
  if (!obj || typeof obj !== "object") return null;

  try {
    if (
      typeof obj.id !== "string" ||
      typeof obj.amount !== "number" ||
      !["income", "expense"].includes(obj.type) ||
      typeof obj.category !== "string"
    ) {
      return null;
    }

    return {
      id: obj.id,
      amount: Math.max(0, obj.amount),
      type: obj.type,
      category: obj.category,
      description: obj.description || "",
      date: obj.date || new Date().toISOString().split("T")[0],
      createdAt: obj.createdAt || new Date().toISOString(),
    };
  } catch (error) {
    console.warn("Transaction validation error:", error);
    return null;
  }
};

// Validasi budget
const validateBudget = (obj: any): Budget | null => {
  if (!obj || typeof obj !== "object") return null;

  try {
    if (
      typeof obj.id !== "string" ||
      typeof obj.category !== "string" ||
      typeof obj.limit !== "number" ||
      !["monthly", "weekly", "yearly", "custom"].includes(
        obj.period || "monthly"
      )
    ) {
      return null;
    }

    return {
      id: obj.id,
      category: obj.category,
      limit: Math.max(0, obj.limit || 0),
      spent: Math.max(0, obj.spent || 0),
      period: obj.period || "monthly",
      startDate: obj.startDate || new Date().toISOString().split("T")[0],
      endDate: obj.endDate || new Date().toISOString().split("T")[0],
      lastResetDate: obj.lastResetDate,
      createdAt: obj.createdAt || new Date().toISOString(),
    };
  } catch (error) {
    console.warn("Budget validation error:", error);
    return null;
  }
};

// Validasi savings
const validateSavings = (obj: any): Savings | null => {
  if (!obj || typeof obj !== "object") return null;

  try {
    if (
      typeof obj.id !== "string" ||
      typeof obj.name !== "string" ||
      typeof obj.target !== "number"
    ) {
      return null;
    }

    return {
      id: obj.id,
      name: obj.name,
      target: Math.max(0, obj.target || 0),
      current: Math.max(0, obj.current || 0),
      deadline: obj.deadline,
      description: obj.description || "",
      category: obj.category || "other",
      priority: obj.priority || "medium",
      icon: obj.icon || "wallet",
      createdAt: obj.createdAt || new Date().toISOString(),
    };
  } catch (error) {
    console.warn("Savings validation error:", error);
    return null;
  }
};

// Validasi savings transaction
const validateSavingsTransaction = (obj: any): SavingsTransaction | null => {
  if (!obj || typeof obj !== "object") return null;

  try {
    if (
      typeof obj.id !== "string" ||
      typeof obj.savingsId !== "string" ||
      typeof obj.amount !== "number" ||
      !["deposit", "withdrawal", "initial", "adjustment"].includes(
        obj.type || "deposit"
      )
    ) {
      return null;
    }

    return {
      id: obj.id,
      savingsId: obj.savingsId,
      type: obj.type || "deposit",
      amount: Math.max(0, obj.amount || 0),
      date: obj.date || new Date().toISOString().split("T")[0],
      note: obj.note || "",
      previousBalance: Math.max(0, obj.previousBalance || 0),
      newBalance: Math.max(0, obj.newBalance || 0),
      createdAt: obj.createdAt || new Date().toISOString(),
    };
  } catch (error) {
    console.warn("Savings transaction validation error:", error);
    return null;
  }
};

// Validasi note
const validateNote = (obj: any): Note | null => {
  if (!obj || typeof obj !== "object") return null;

  try {
    const validTypes = [
      "financial_decision",
      "expense_reflection",
      "goal_progress",
      "investment_idea",
      "budget_analysis",
      "general",
    ];

    if (
      typeof obj.id !== "string" ||
      typeof obj.title !== "string" ||
      !validTypes.includes(obj.type || "general")
    ) {
      return null;
    }

    return {
      id: obj.id,
      title: obj.title || "",
      content: obj.content || "",
      type: obj.type || "general",
      mood: ["positive", "neutral", "negative", "reflective"].includes(obj.mood)
        ? obj.mood
        : undefined,
      financialImpact: ["positive", "neutral", "negative"].includes(
        obj.financialImpact
      )
        ? obj.financialImpact
        : undefined,
      amount:
        typeof obj.amount === "number" ? Math.max(0, obj.amount) : undefined,
      category: obj.category || undefined,
      tags: Array.isArray(obj.tags) ? obj.tags : [],
      relatedTransactionIds: Array.isArray(obj.relatedTransactionIds)
        ? obj.relatedTransactionIds
        : [],
      relatedSavingsIds: Array.isArray(obj.relatedSavingsIds)
        ? obj.relatedSavingsIds
        : [],
      relatedBudgetIds: Array.isArray(obj.relatedBudgetIds)
        ? obj.relatedBudgetIds
        : [],
      date: obj.date || new Date().toISOString().split("T")[0],
      createdAt: obj.createdAt || new Date().toISOString(),
      updatedAt: obj.updatedAt || new Date().toISOString(),
    };
  } catch (error) {
    console.warn("Note validation error:", error);
    return null;
  }
};

// Ekspor ke JSON
export const exportToJSON = async (
  appState: AppState
): Promise<string | null> => {
  try {
    console.log("🔄 Memulai ekspor ke JSON...");

    // Buat objek data yang lengkap dengan metadata
    const backupData = {
      metadata: {
        appName: "MyMoney",
        version: "1.0.0",
        exportDate: new Date().toISOString(),
        dataVersion: 5,
        itemCounts: {
          transactions: appState.transactions.length,
          budgets: appState.budgets.length,
          savings: appState.savings.length,
          notes: appState.notes.length,
          savingsTransactions: appState.savingsTransactions.length,
        },
      },
      data: appState,
    };

    const jsonString = JSON.stringify(backupData, null, 2);

    // Buat nama file
    const timestamp = formatDateForFilename();
    const fileName = `mymoney_backup_${timestamp}.json`;

    // Tentukan path penyimpanan
    const documentDir = FileSystem.documentDirectory;
    if (!documentDir) {
      console.error("Document directory not available");
      return null;
    }

    const filePath = `${documentDir}${fileName}`;

    // Tulis file
    await FileSystem.writeAsStringAsync(filePath, jsonString, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    console.log(`✅ JSON backup saved to: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error("❌ Error exporting to JSON:", error);
    return null;
  }
};

// Generate HTML untuk PDF
const generatePDFHTML = (appState: AppState): string => {
  const now = new Date();
  const exportDate = now.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Hitung kategori pengeluaran teratas
  const categoryStats: Record<string, number> = {};
  appState.transactions.forEach((transaction) => {
    if (transaction.type === "expense") {
      categoryStats[transaction.category] =
        (categoryStats[transaction.category] || 0) + transaction.amount;
    }
  });

  const topCategories = Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #0F172A;
        }
        .header h1 {
          color: #0F172A;
          margin: 0;
          font-size: 24px;
        }
        .header .subtitle {
          color: #666;
          font-size: 14px;
          margin-top: 5px;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          background-color: #0F172A;
          color: white;
          padding: 10px 15px;
          border-radius: 5px;
          margin-bottom: 15px;
          font-size: 16px;
          font-weight: bold;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        .stat-card {
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }
        .stat-value {
          font-size: 22px;
          font-weight: bold;
          color: #0F172A;
          margin-bottom: 5px;
        }
        .stat-label {
          font-size: 12px;
          color: #666;
        }
        .financial-summary {
          background-color: #e8f4fd;
          border: 1px solid #b3e0ff;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }
        .financial-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #ddd;
        }
        .financial-item:last-child {
          border-bottom: none;
        }
        .financial-item.positive {
          color: #10B981;
        }
        .financial-item.negative {
          color: #EF4444;
        }
        .financial-item.net {
          font-weight: bold;
          background-color: #f0f9ff;
          padding: 10px;
          border-radius: 5px;
          margin-top: 5px;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: 12px;
        }
        .table th {
          background-color: #0F172A;
          color: white;
          padding: 10px;
          text-align: left;
          font-size: 13px;
        }
        .table td {
          padding: 8px 10px;
          border-bottom: 1px solid #ddd;
        }
        .table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        .badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: bold;
          margin-left: 5px;
        }
        .badge-income {
          background-color: #10B98120;
          color: #10B981;
        }
        .badge-expense {
          background-color: #EF444420;
          color: #EF4444;
        }
        .progress-bar {
          background-color: #e5e7eb;
          border-radius: 10px;
          height: 10px;
          margin: 5px 0;
          overflow: hidden;
        }
        .progress-fill {
          background-color: #22D3EE;
          height: 100%;
          border-radius: 10px;
        }
        .note-type {
          display: inline-block;
          padding: 3px 8px;
          background-color: #f3f4f6;
          border-radius: 4px;
          font-size: 11px;
          margin-right: 5px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>LAPORAN KEUANGAN MYMONEY</h1>
        <div class="subtitle">Diberikan pada: ${exportDate}</div>
      </div>

      <div class="section">
        <div class="section-title">📊 STATISTIK DATA</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${appState.transactions.length}</div>
            <div class="stat-label">Transaksi</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${appState.budgets.length}</div>
            <div class="stat-label">Anggaran</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${appState.savings.length}</div>
            <div class="stat-label">Tabungan</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${appState.notes.length}</div>
            <div class="stat-label">Catatan</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">💰 RINGKASAN KEUANGAN</div>
        <div class="financial-summary">
          <div class="financial-item">
            <span>Total Pemasukan:</span>
            <span class="positive">${formatCurrencyForPDF(
              appState.totalIncome
            )}</span>
          </div>
          <div class="financial-item">
            <span>Total Pengeluaran:</span>
            <span class="negative">${formatCurrencyForPDF(
              appState.totalExpense
            )}</span>
          </div>
          <div class="financial-item net">
            <span>Saldo Bersih:</span>
            <span>${formatCurrencyForPDF(appState.balance)}</span>
          </div>
        </div>
      </div>

      ${
        topCategories.length > 0
          ? `
      <div class="section">
        <div class="section-title">🏷️ 5 KATEGORI PENGELUARAN TERATAS</div>
        <div class="financial-summary">
          ${topCategories
            .map(
              ([category, amount]) => `
            <div class="financial-item">
              <span>${category}:</span>
              <span class="negative">${formatCurrencyForPDF(amount)}</span>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
      `
          : ""
      }

      ${
        appState.transactions.length > 0
          ? `
      <div class="section">
        <div class="section-title">📝 TRANSAKSI TERBARU</div>
        <table class="table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Tipe</th>
              <th>Kategori</th>
              <th>Jumlah</th>
            </tr>
          </thead>
          <tbody>
            ${appState.transactions
              .slice(0, 15)
              .map(
                (transaction) => `
                <tr>
                  <td>${formatDateForDisplay(transaction.date)}</td>
                  <td>
                    <span class="badge badge-${transaction.type}">
                      ${transaction.type.toUpperCase()}
                    </span>
                  </td>
                  <td>${transaction.category}</td>
                  <td class="${
                    transaction.type === "income" ? "positive" : "negative"
                  }">
                    ${
                      transaction.type === "income" ? "+" : "-"
                    } ${formatCurrencyForPDF(transaction.amount)}
                  </td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>
      </div>
      `
          : ""
      }

      ${
        appState.savings.length > 0
          ? `
      <div class="section">
        <div class="section-title">💰 STATUS TABUNGAN</div>
        <table class="table">
          <thead>
            <tr>
              <th>Nama Tabungan</th>
              <th>Target</th>
              <th>Terkumpul</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            ${appState.savings
              .map((saving) => {
                const percentage =
                  saving.target > 0
                    ? Math.round((saving.current / saving.target) * 100)
                    : 0;
                return `
                <tr>
                  <td>${saving.name}</td>
                  <td>${formatCurrencyForPDF(saving.target)}</td>
                  <td>${formatCurrencyForPDF(saving.current)}</td>
                  <td>
                    <div>${percentage}%</div>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                  </td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
      `
          : ""
      }

      ${
        appState.notes.length > 0
          ? `
      <div class="section">
        <div class="section-title">📓 CATATAN FINANSIAL</div>
        <table class="table">
          <thead>
            <tr>
              <th>Judul</th>
              <th>Tanggal</th>
              <th>Tipe</th>
            </tr>
          </thead>
          <tbody>
            ${appState.notes
              .slice(0, 10)
              .map(
                (note) => `
                <tr>
                  <td>${note.title}</td>
                  <td>${formatDateForDisplay(note.date)}</td>
                  <td><span class="note-type">${note.type.replace(
                    "_",
                    " "
                  )}</span></td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>
      </div>
      `
          : ""
      }

      <div class="footer">
        <p>Laporan ini dibuat otomatis oleh aplikasi MyMoney v1.0.0</p>
        <p>Data bersifat sensitif, harap simpan dengan aman</p>
        <p>Total Data: ${appState.transactions.length} transaksi • ${
    appState.budgets.length
  } anggaran • ${appState.savings.length} tabungan • ${
    appState.notes.length
  } catatan</p>
      </div>
    </body>
    </html>
  `;
};

// Ekspor ke PDF
export const exportToPDF = async (
  appState: AppState
): Promise<string | null> => {
  Alert.alert("Info", "Fitur PDF sementara dinonaktifkan");
  return null;

  /*
  // KODE ASLI DI-COMMENT
  try {
    console.log("🔄 Memulai ekspor ke PDF...");
    const html = generatePDFHTML(appState);
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });
    // ... sisa kode
  } catch (error) {
    console.error("❌ Error generating PDF:", error);
    return null;
  }
  */
};

// Bagikan file
export const shareFile = async (filePath: string): Promise<boolean> => {
  try {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("Perhatian", "Fitur sharing tidak tersedia di perangkat ini");
      return false;
    }

    const canShare = await Sharing.shareAsync(filePath, {
      mimeType: filePath.endsWith(".pdf")
        ? "application/pdf"
        : "application/json",
      dialogTitle: "Bagikan Backup Data",
      UTI: filePath.endsWith(".pdf") ? "com.adobe.pdf" : "public.json",
    });

    return true;
  } catch (error) {
    console.error("❌ Error sharing file:", error);
    Alert.alert("Error", "Gagal membagikan file");
    return false;
  }
};

// Import dari JSON
export const importFromJSON = async (uri: string): Promise<AppState | null> => {
  try {
    console.log("🔄 Memulai import dari JSON...");

    // Baca file
    const jsonString = await FileSystem.readAsStringAsync(uri);
    const backupData = JSON.parse(jsonString);

    // Validasi struktur data
    if (!backupData.metadata || !backupData.data) {
      throw new Error("Format file backup tidak valid");
    }

    if (backupData.metadata.appName !== "MyMoney") {
      throw new Error("File bukan backup dari MyMoney");
    }

    // Validasi versi data
    const dataVersion = backupData.metadata.dataVersion || 1;
    if (dataVersion < 1 || dataVersion > 5) {
      throw new Error(`Versi data (${dataVersion}) tidak didukung`);
    }

    // Validasi semua data
    const transactions: Transaction[] = Array.isArray(
      backupData.data.transactions
    )
      ? backupData.data.transactions
          .map((t: any) => validateTransaction(t))
          .filter((t: Transaction | null): t is Transaction => t !== null)
      : [];

    const budgets: Budget[] = Array.isArray(backupData.data.budgets)
      ? backupData.data.budgets
          .map((b: any) => validateBudget(b))
          .filter((b: Budget | null): b is Budget => b !== null)
      : [];

    const savings: Savings[] = Array.isArray(backupData.data.savings)
      ? backupData.data.savings
          .map((s: any) => validateSavings(s))
          .filter((s: Savings | null): s is Savings => s !== null)
      : [];

    const savingsTransactions: SavingsTransaction[] = Array.isArray(
      backupData.data.savingsTransactions
    )
      ? backupData.data.savingsTransactions
          .map((st: any) => validateSavingsTransaction(st))
          .filter(
            (st: SavingsTransaction | null): st is SavingsTransaction =>
              st !== null
          )
      : [];

    const notes: Note[] = Array.isArray(backupData.data.notes)
      ? backupData.data.notes
          .map((n: any) => validateNote(n))
          .filter((n: Note | null): n is Note => n !== null)
      : [];

    // Hitung totals
    const totals = calculateTotals(transactions);

    const importedData: AppState = {
      transactions,
      budgets,
      savings,
      savingsTransactions,
      notes,
      ...totals,
    };

    console.log("✅ Data berhasil diimpor dari backup");
    return importedData;
  } catch (error) {
    console.error("❌ Error importing from JSON:", error);
    throw error;
  }
};

// Cek apakah ada file backup
export const listBackupFiles = async (): Promise<string[]> => {
  try {
    const documentDir = FileSystem.documentDirectory;
    if (!documentDir) {
      console.warn("Document directory not available");
      return [];
    }

    const files = await FileSystem.readDirectoryAsync(documentDir);
    const backupFiles = files.filter(
      (file) =>
        file.startsWith("mymoney_backup_") || file.startsWith("mymoney_report_")
    );

    return backupFiles.sort().reverse(); // Urutkan dari yang terbaru
  } catch (error) {
    console.error("❌ Error listing backup files:", error);
    return [];
  }
};

// Hapus file backup
export const deleteBackupFile = async (fileName: string): Promise<boolean> => {
  try {
    const documentDir = FileSystem.documentDirectory;
    if (!documentDir) {
      console.error("Document directory not available");
      return false;
    }

    const filePath = `${documentDir}${fileName}`;
    await FileSystem.deleteAsync(filePath);
    console.log(`🗑️ Deleted backup file: ${fileName}`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting backup file:", error);
    return false;
  }
};

// Validasi data backup
export const validateBackupData = (backupData: any): AppState => {
  try {
    console.log("🔄 Validating backup data...");

    // Validasi struktur dasar
    if (!backupData || typeof backupData !== "object") {
      throw new Error("Data backup tidak valid: struktur tidak sesuai");
    }

    // Validasi arrays
    const transactions: Transaction[] = Array.isArray(backupData.transactions)
      ? backupData.transactions
          .map((t: any) => validateTransaction(t))
          .filter((t: Transaction | null): t is Transaction => t !== null)
      : [];

    const budgets: Budget[] = Array.isArray(backupData.budgets)
      ? backupData.budgets
          .map((b: any) => validateBudget(b))
          .filter((b: Budget | null): b is Budget => b !== null)
      : [];

    const savings: Savings[] = Array.isArray(backupData.savings)
      ? backupData.savings
          .map((s: any) => validateSavings(s))
          .filter((s: Savings | null): s is Savings => s !== null)
      : [];

    const savingsTransactions: SavingsTransaction[] = Array.isArray(
      backupData.savingsTransactions
    )
      ? backupData.savingsTransactions
          .map((st: any) => validateSavingsTransaction(st))
          .filter(
            (st: SavingsTransaction | null): st is SavingsTransaction =>
              st !== null
          )
      : [];

    const notes: Note[] = Array.isArray(backupData.notes)
      ? backupData.notes
          .map((n: any) => validateNote(n))
          .filter((n: Note | null): n is Note => n !== null)
      : [];

    // Hitung ulang totals
    const totals = calculateTotals(transactions);

    const validatedState: AppState = {
      transactions,
      budgets,
      savings,
      savingsTransactions,
      notes,
      ...totals,
    };

    console.log(`✅ Backup data validated successfully:
      - Transactions: ${transactions.length}
      - Budgets: ${budgets.length}
      - Savings: ${savings.length}
      - Notes: ${notes.length}
      - Savings Transactions: ${savingsTransactions.length}`);

    return validatedState;
  } catch (error) {
    console.error("❌ Error validating backup data:", error);
    throw new Error(`Validasi gagal: ${(error as Error).message}`);
  }
};
