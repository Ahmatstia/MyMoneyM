import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import tw from "twrnc";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
// import * as Print from "expo-print";

import { useAppContext } from "../../context/AppContext";
import { Colors } from "../../theme/theme";
import { AppState } from "../../types";

// GUNAKAN WARNA DARI TEMA NAVY BLUE
const PRIMARY_COLOR = Colors.primary; // "#0F172A" - Navy blue gelap
const ACCENT_COLOR = Colors.accent; // "#22D3EE" - Cyan terang
const BACKGROUND_COLOR = Colors.background; // "#0F172A" - Background navy blue gelap
const SURFACE_COLOR = Colors.surface; // "#1E293B" - Permukaan navy blue medium
const TEXT_PRIMARY = Colors.textPrimary; // "#F8FAFC" - Teks utama putih
const TEXT_SECONDARY = Colors.textSecondary; // "#CBD5E1" - Teks sekunder abu-abu muda
const BORDER_COLOR = Colors.border; // "#334155" - Border navy blue lebih terang
const SUCCESS_COLOR = Colors.success; // "#10B981" - Hijau
const WARNING_COLOR = Colors.warning; // "#F59E0B" - Kuning
const ERROR_COLOR = Colors.error; // "#EF4444" - Merah
const INFO_COLOR = Colors.info; // "#3B82F6" - Biru terang
// Format tanggal untuk nama file
const formatDateForFilename = (): string => {
  const now = new Date();
  return now
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .split(".")[0];
};

// Format uang
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Format tanggal untuk tampilan
const formatDateForDisplay = (dateStr: string): string => {
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

// Generate HTML untuk PDF
const generatePDFHTML = (appState: AppState): string => {
  const formatCurrencyForPDF = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const now = new Date();
  const exportDate = now.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

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
                  <span class="badge badge-${
                    transaction.type
                  }">${transaction.type.toUpperCase()}</span>
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
        <div class="section-title">📓 CATATAN FINSANSIAL</div>
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

const ProfileScreen: React.FC = () => {
  const isFocused = useIsFocused();
  const {
    state,
    clearAllData,
    debugStorage,
    isLoading,
    importBackup,
    exportBackup,
    restoreFromBackup,
  } = useAppContext();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backupProgress, setBackupProgress] = useState<string>("");
  const [showBackupOptions, setShowBackupOptions] = useState(false);
  const [backupFiles, setBackupFiles] = useState<string[]>([]);

  // Load backup files list
  useEffect(() => {
    if (isFocused) {
      loadBackupFiles();
    }
  }, [isFocused]);

  const loadBackupFiles = async () => {
    try {
      const documentDir = FileSystem.documentDirectory;
      if (!documentDir) {
        console.warn("Document directory not available");
        setBackupFiles([]);
        return;
      }

      const files = await FileSystem.readDirectoryAsync(documentDir);
      const backupFiles = files
        .filter((file) => file.includes("mymoney_"))
        .sort()
        .reverse();
      setBackupFiles(backupFiles);
    } catch (error) {
      console.error("Error loading backup files:", error);
    }
  };

  // Fungsi ekspor ke JSON
  // GANTI fungsi handleExportJSON() di ProfileScreen.tsx
  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      setBackupProgress("Menyiapkan backup...");

      // 1. Dapatkan data backup dari context
      const result = await exportBackup();

      if (!result.success) {
        throw new Error(result.error || "Gagal membuat backup");
      }

      setBackupProgress("Membuat file JSON...");

      // 2. Buat objek backup lengkap dengan metadata
      const backupData = {
        metadata: {
          appName: "MyMoney",
          version: "1.0.0",
          exportDate: new Date().toISOString(),
          dataVersion: 5,
          itemCounts: {
            transactions: state.transactions.length,
            budgets: state.budgets.length,
            savings: state.savings.length,
            notes: state.notes.length,
            savingsTransactions: state.savingsTransactions.length,
          },
        },
        data: state,
      };

      const jsonString = JSON.stringify(backupData, null, 2);

      // 3. Buat nama file
      const timestamp = formatDateForFilename();
      const fileName = `mymoney_backup_${timestamp}.json`;

      const documentDir = FileSystem.documentDirectory;
      if (!documentDir) {
        throw new Error("Document directory tidak tersedia");
      }

      const filePath = `${documentDir}${fileName}`;

      // 4. Tulis file ke storage
      await FileSystem.writeAsStringAsync(filePath, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      setBackupProgress("Backup berhasil dibuat!");

      // 5. Dapatkan info file
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      const fileSize =
        fileInfo.exists && fileInfo.size
          ? `${(fileInfo.size / 1024).toFixed(2)} KB`
          : "0 KB";

      Alert.alert(
        "✅ Backup JSON Berhasil",
        `File: ${fileName}\nUkuran: ${fileSize}\n\nBackup berhasil disimpan di perangkat.`,
        [
          {
            text: "Bagikan",
            onPress: async () => {
              try {
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(filePath, {
                    mimeType: "application/json",
                    dialogTitle: "Bagikan Backup Data",
                    UTI: "public.json",
                  });
                }
              } catch (error) {
                console.error("Error sharing:", error);
              }
            },
          },
          {
            text: "OK",
            style: "default",
          },
        ]
      );

      // 6. Refresh list file
      await loadBackupFiles();
    } catch (error) {
      console.error("Error exporting JSON:", error);
      Alert.alert(
        "❌ Error",
        "Gagal membuat backup: " + (error as Error).message
      );
    } finally {
      setIsExporting(false);
      setBackupProgress("");
    }
  };

  // Fungsi ekspor ke PDF
  const handleExportPDF = async () => {
    Alert.alert(
      "⏳ Fitur PDF Sementara Dinonaktifkan",
      "Fitur export PDF sedang dalam perbaikan teknis.\n\n" +
        "Untuk backup data, Anda masih bisa:\n" +
        "✅ Export backup JSON (lengkap)\n" +
        "✅ Lihat file backup\n" +
        "✅ Share file backup\n\n" +
        "Fitur PDF akan tersedia di update berikutnya!",
      [{ text: "Export JSON Sekarang", onPress: () => handleExportJSON() }]
    );
    return;

    // KODE ASLI DI-COMMENT:
    /*
  try {
    setIsExporting(true);
    setBackupProgress("Membuat laporan PDF...");

    const html = generatePDFHTML(state);
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });
    
    // ... sisa kode
  } catch (error) {
    Alert.alert("❌ Error", "Gagal membuat PDF");
  } finally {
    setIsExporting(false);
    setBackupProgress("");
  }
  */
  };

  // Fungsi import dari JSON
  // Fungsi import dari JSON
  const handleImportData = async () => {
    try {
      setIsImporting(true);
      setBackupProgress("Memilih file backup...");

      // ========== PAKAI expo-document-picker ==========
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json"],
        multiple: false,
      });

      if (result.canceled || result.assets.length === 0) {
        setIsImporting(false);
        setBackupProgress("");
        return;
      }

      const fileUri = result.assets[0].uri;
      // ========== SAMPAI SINI ==========

      setBackupProgress("Membaca file...");

      // Read file
      const jsonString = await FileSystem.readAsStringAsync(fileUri);
      const backupData = JSON.parse(jsonString);

      // Validate structure
      if (!backupData.metadata || !backupData.data) {
        throw new Error("Format file backup tidak valid");
      }

      if (backupData.metadata.appName !== "MyMoney") {
        throw new Error("File bukan backup dari MyMoney");
      }

      setBackupProgress("Validasi data...");

      // Show import summary
      Alert.alert(
        "⚠️ Import Data",
        `Anda akan mengimpor:\n\n` +
          `• ${backupData.data.transactions?.length || 0} transaksi\n` +
          `• ${backupData.data.budgets?.length || 0} anggaran\n` +
          `• ${backupData.data.savings?.length || 0} tabungan\n` +
          `• ${backupData.data.notes?.length || 0} catatan\n\n` +
          `Semua data yang ada akan diganti!`,
        [
          { text: "Batalkan", style: "cancel" },
          {
            text: "Import",
            style: "destructive",
            onPress: async () => {
              try {
                setBackupProgress("Mengganti data...");

                // Gunakan fungsi importBackup dari context
                const importResult = await importBackup(backupData.data);

                if (importResult.success) {
                  Alert.alert("✅ Sukses", importResult.message);
                } else {
                  Alert.alert("❌ Error", importResult.message);
                }
              } catch (error) {
                Alert.alert("Error", "Gagal mengimpor data");
              } finally {
                setIsImporting(false);
                setBackupProgress("");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error importing:", error);

      // Type casting untuk error
      const err = error as any;

      // Error handling untuk expo-document-picker
      if (err.code === "ERR_DOCUMENT_PICKER_CANCELED") {
        console.log("User cancelled document picker");
      } else {
        Alert.alert(
          "❌ Error",
          "Gagal mengimpor data: " + (err.message || "Unknown error")
        );
      }

      setIsImporting(false);
      setBackupProgress("");
    }
  };

  // Fungsi share file
  const handleShareFile = async (fileName: string) => {
    try {
      const documentDir = FileSystem.documentDirectory;
      if (!documentDir) {
        Alert.alert("Error", "Directory tidak tersedia");
        return;
      }

      const filePath = `${documentDir}${fileName}`;

      if (await Sharing.isAvailableAsync()) {
        const mimeType = fileName.endsWith(".pdf")
          ? "application/pdf"
          : "application/json";

        await Sharing.shareAsync(filePath, {
          mimeType,
          dialogTitle: `Bagikan ${fileName}`,
          UTI: fileName.endsWith(".pdf") ? "com.adobe.pdf" : "public.json",
        });
      } else {
        Alert.alert("Info", `File: ${filePath}`);
      }
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("Error", "Gagal membagikan file");
    }
  };

  // Fungsi delete file
  const handleDeleteFile = async (fileName: string) => {
    Alert.alert("Hapus File", `Hapus file ${fileName}?`, [
      { text: "Batalkan", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            const documentDir = FileSystem.documentDirectory;
            if (!documentDir) {
              Alert.alert("Error", "Directory tidak tersedia");
              return;
            }

            const filePath = `${documentDir}${fileName}`;
            await FileSystem.deleteAsync(filePath);
            await loadBackupFiles();
            Alert.alert("File berhasil dihapus");
          } catch (error) {
            Alert.alert("Error", "Gagal menghapus file");
          }
        },
      },
    ]);
  };

  // Fungsi backup options
  const handleBackupOptions = () => {
    setShowBackupOptions(true);
  };

  // Modal untuk backup options
  const BackupOptionsModal = () => (
    <Modal
      visible={showBackupOptions}
      transparent
      animationType="fade"
      onRequestClose={() => setShowBackupOptions(false)}
    >
      <View
        style={[
          tw`flex-1 justify-center items-center`,
          { backgroundColor: "rgba(0,0,0,0.7)" },
        ]}
      >
        <View
          style={[
            tw`w-4/5 rounded-2xl p-6`,
            { backgroundColor: SURFACE_COLOR },
          ]}
        >
          <Text
            style={[
              tw`text-xl font-bold mb-4 text-center`,
              { color: TEXT_PRIMARY },
            ]}
          >
            📁 Backup & Restore
          </Text>

          <Text
            style={[tw`text-sm mb-6 text-center`, { color: TEXT_SECONDARY }]}
          >
            Pilih opsi backup atau restore data
          </Text>

          {/* Ekspor Options */}
          <View style={tw`mb-6`}>
            <Text style={[tw`font-medium mb-3`, { color: TEXT_PRIMARY }]}>
              Ekspor Data:
            </Text>

            <TouchableOpacity
              style={[
                tw`flex-row items-center p-4 rounded-xl mb-3`,
                { backgroundColor: Colors.surfaceLight },
              ]}
              onPress={() => {
                setShowBackupOptions(false);
                setTimeout(() => handleExportJSON(), 300);
              }}
              disabled={isExporting}
            >
              <View
                style={[
                  tw`w-12 h-12 rounded-lg items-center justify-center mr-3`,
                  { backgroundColor: SUCCESS_COLOR + "20" },
                ]}
              >
                <Ionicons name="code" size={24} color={SUCCESS_COLOR} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`font-medium`, { color: TEXT_PRIMARY }]}>
                  Backup JSON
                </Text>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  Backup lengkap semua data
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={TEXT_SECONDARY}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                tw`flex-row items-center p-4 rounded-xl`,
                { backgroundColor: Colors.surfaceLight },
              ]}
              onPress={() => {
                setShowBackupOptions(false);
                setTimeout(() => handleExportPDF(), 300);
              }}
              disabled={isExporting}
            >
              <View
                style={[
                  tw`w-12 h-12 rounded-lg items-center justify-center mr-3`,
                  { backgroundColor: ERROR_COLOR + "20" },
                ]}
              >
                <Ionicons name="document-text" size={24} color={ERROR_COLOR} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`font-medium`, { color: TEXT_PRIMARY }]}>
                  Laporan PDF
                </Text>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  Ringkasan keuangan dalam PDF
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={TEXT_SECONDARY}
              />
            </TouchableOpacity>
          </View>

          {/* Import Option */}
          <View style={tw`mb-6`}>
            <Text style={[tw`font-medium mb-3`, { color: TEXT_PRIMARY }]}>
              Import Data:
            </Text>

            <TouchableOpacity
              style={[
                tw`flex-row items-center p-4 rounded-xl`,
                { backgroundColor: Colors.surfaceLight },
              ]}
              onPress={() => {
                setShowBackupOptions(false);
                setTimeout(() => handleImportData(), 300);
              }}
              disabled={isImporting}
            >
              <View
                style={[
                  tw`w-12 h-12 rounded-lg items-center justify-center mr-3`,
                  { backgroundColor: WARNING_COLOR + "20" },
                ]}
              >
                <Ionicons name="cloud-upload" size={24} color={WARNING_COLOR} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`font-medium`, { color: TEXT_PRIMARY }]}>
                  Import dari JSON
                </Text>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  Restore data dari backup
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={TEXT_SECONDARY}
              />
            </TouchableOpacity>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={[
              tw`py-3 rounded-xl items-center mt-2`,
              { backgroundColor: BORDER_COLOR },
            ]}
            onPress={() => setShowBackupOptions(false)}
          >
            <Text style={[tw`font-medium`, { color: TEXT_PRIMARY }]}>
              Tutup
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
      <ScrollView
        style={tw`flex-1`}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={loadBackupFiles}
            colors={[ACCENT_COLOR]}
            tintColor={ACCENT_COLOR}
          />
        }
      >
        {/* Header */}
        <View style={[tw`p-6`, { backgroundColor: PRIMARY_COLOR }]}>
          <View style={tw`flex-row items-center`}>
            <View
              style={[
                tw`w-20 h-20 rounded-full items-center justify-center shadow-lg`,
                { backgroundColor: SURFACE_COLOR },
              ]}
            >
              <Ionicons name="person" size={36} color={ACCENT_COLOR} />
            </View>
            <View style={tw`ml-4 flex-1`}>
              <Text style={[tw`text-2xl font-bold`, { color: TEXT_PRIMARY }]}>
                MyMoney
              </Text>
              <Text style={[tw`text-sm mt-1`, { color: TEXT_SECONDARY }]}>
                Manajemen data dan backup
              </Text>
              <Text style={[tw`text-xs mt-1`, { color: Colors.textTertiary }]}>
                Data tersimpan lokal di perangkat Anda
              </Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={tw`mt-6`}>
            <View style={tw`flex-row justify-between`}>
              <View style={tw`items-center`}>
                <Text style={[tw`text-2xl font-bold`, { color: ACCENT_COLOR }]}>
                  {state.transactions?.length || 0}
                </Text>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  Transaksi
                </Text>
              </View>
              <View style={tw`items-center`}>
                <Text
                  style={[tw`text-2xl font-bold`, { color: SUCCESS_COLOR }]}
                >
                  {state.budgets?.length || 0}
                </Text>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  Anggaran
                </Text>
              </View>
              <View style={tw`items-center`}>
                <Text style={[tw`text-2xl font-bold`, { color: INFO_COLOR }]}>
                  {state.savings?.length || 0}
                </Text>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  Tabungan
                </Text>
              </View>
              <View style={tw`items-center`}>
                <Text
                  style={[tw`text-2xl font-bold`, { color: WARNING_COLOR }]}
                >
                  {state.notes?.length || 0}
                </Text>
                <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                  Catatan
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Backup Progress Indicator */}
        {(isExporting || isImporting) && (
          <View
            style={[
              tw`mx-4 mt-4 p-4 rounded-xl`,
              { backgroundColor: SURFACE_COLOR },
            ]}
          >
            <View style={tw`flex-row items-center`}>
              <ActivityIndicator
                size="small"
                color={ACCENT_COLOR}
                style={tw`mr-3`}
              />
              <View style={tw`flex-1`}>
                <Text style={[tw`font-medium`, { color: TEXT_PRIMARY }]}>
                  {isExporting ? "Mengekspor..." : "Mengimpor..."}
                </Text>
                {backupProgress ? (
                  <Text style={[tw`text-xs mt-1`, { color: TEXT_SECONDARY }]}>
                    {backupProgress}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        )}

        {/* Main Backup Section */}
        <View style={tw`p-4`}>
          {/* Backup Action Card */}
          <View
            style={[
              tw`rounded-xl p-5 mb-6`,
              {
                backgroundColor: SURFACE_COLOR,
                borderWidth: 2,
                borderColor: ACCENT_COLOR,
              },
            ]}
          >
            <View style={tw`flex-row items-center mb-4`}>
              <View
                style={[
                  tw`w-14 h-14 rounded-full items-center justify-center mr-4`,
                  { backgroundColor: ACCENT_COLOR + "20" },
                ]}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={28}
                  color={ACCENT_COLOR}
                />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`text-lg font-bold`, { color: TEXT_PRIMARY }]}>
                  Backup Data Anda
                </Text>
                <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
                  Lindungi data keuangan Anda dengan backup reguler
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                tw`py-1 rounded-xl items-center`,
                { backgroundColor: ACCENT_COLOR },
              ]}
              onPress={handleBackupOptions}
              disabled={isExporting || isImporting}
            >
              <Text style={[tw`font-bold text-lg`, { color: TEXT_PRIMARY }]}>
                {isExporting ? "SEDANG MENGESPORT..." : "BACKUP SEKARANG"}
              </Text>
              <Text style={[tw`text-xs mt-1`, { color: TEXT_PRIMARY + "CC" }]}>
                Pilih format: JSON atau PDF
              </Text>
            </TouchableOpacity>

            <View style={tw`mt-4 flex-row justify-between`}>
              <View style={tw`items-center`}>
                <Ionicons name="save" size={20} color={SUCCESS_COLOR} />
                <Text style={[tw`text-xs mt-1`, { color: TEXT_SECONDARY }]}>
                  Backup Aman
                </Text>
              </View>
              <View style={tw`items-center`}>
                <Ionicons name="lock-closed" size={20} color={INFO_COLOR} />
                <Text style={[tw`text-xs mt-1`, { color: TEXT_SECONDARY }]}>
                  Data Privat
                </Text>
              </View>
              <View style={tw`items-center`}>
                <Ionicons name="cloud" size={20} color={WARNING_COLOR} />
                <Text style={[tw`text-xs mt-1`, { color: TEXT_SECONDARY }]}>
                  Restore Mudah
                </Text>
              </View>
            </View>
          </View>

          {/* File Backup List */}
          <View
            style={[
              tw`rounded-xl p-5 mb-6`,
              { backgroundColor: SURFACE_COLOR },
            ]}
          >
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={[tw`text-lg font-bold`, { color: TEXT_PRIMARY }]}>
                File Backup Tersimpan
              </Text>
              <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
                {backupFiles.length} file
              </Text>
            </View>

            {backupFiles.length === 0 ? (
              <View style={tw`items-center py-6`}>
                <Ionicons
                  name="folder-open"
                  size={48}
                  color={TEXT_SECONDARY}
                  style={tw`mb-3`}
                />
                <Text style={[tw`text-center`, { color: TEXT_SECONDARY }]}>
                  Belum ada file backup
                </Text>
                <Text
                  style={[
                    tw`text-center text-xs mt-1`,
                    { color: Colors.textTertiary },
                  ]}
                >
                  Buat backup pertama Anda sekarang
                </Text>
              </View>
            ) : (
              <View>
                {backupFiles.slice(0, 5).map((fileName, index) => {
                  const isPDF = fileName.endsWith(".pdf");
                  return (
                    <View
                      key={fileName}
                      style={[
                        tw`flex-row items-center p-3 rounded-lg mb-2`,
                        { backgroundColor: Colors.surfaceLight },
                      ]}
                    >
                      <View
                        style={[
                          tw`w-10 h-10 rounded-lg items-center justify-center mr-3`,
                          {
                            backgroundColor: isPDF
                              ? ERROR_COLOR + "20"
                              : SUCCESS_COLOR + "20",
                          },
                        ]}
                      >
                        <Ionicons
                          name={isPDF ? "document-text" : "code"}
                          size={20}
                          color={isPDF ? ERROR_COLOR : SUCCESS_COLOR}
                        />
                      </View>

                      <View style={tw`flex-1`}>
                        <Text
                          style={[tw`font-medium`, { color: TEXT_PRIMARY }]}
                          numberOfLines={1}
                        >
                          {fileName}
                        </Text>
                        <Text style={[tw`text-xs`, { color: TEXT_SECONDARY }]}>
                          {isPDF ? "Laporan PDF" : "Backup JSON"}
                        </Text>
                      </View>

                      <View style={tw`flex-row`}>
                        <TouchableOpacity
                          style={tw`p-2`}
                          onPress={() => handleShareFile(fileName)}
                        >
                          <Ionicons
                            name="share-outline"
                            size={20}
                            color={INFO_COLOR}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={tw`p-2`}
                          onPress={() => handleDeleteFile(fileName)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color={ERROR_COLOR}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                {backupFiles.length > 5 && (
                  <Text
                    style={[
                      tw`text-center text-xs mt-2`,
                      { color: TEXT_SECONDARY },
                    ]}
                  >
                    + {backupFiles.length - 5} file lainnya
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Data Information */}
          <View
            style={[
              tw`rounded-xl p-5 mb-6`,
              { backgroundColor: SURFACE_COLOR },
            ]}
          >
            <Text style={[tw`text-lg font-bold mb-4`, { color: TEXT_PRIMARY }]}>
              📊 Ringkasan Data
            </Text>

            <View>
              <View style={tw`flex-row justify-between mb-3`}>
                <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
                  Total Pemasukan
                </Text>
                <Text
                  style={[tw`text-sm font-medium`, { color: SUCCESS_COLOR }]}
                >
                  {formatCurrency(state.totalIncome || 0)}
                </Text>
              </View>

              <View style={tw`flex-row justify-between mb-3`}>
                <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
                  Total Pengeluaran
                </Text>
                <Text style={[tw`text-sm font-medium`, { color: ERROR_COLOR }]}>
                  {formatCurrency(state.totalExpense || 0)}
                </Text>
              </View>

              <View style={tw`flex-row justify-between`}>
                <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
                  Saldo Bersih
                </Text>
                <Text
                  style={[tw`text-sm font-medium`, { color: ACCENT_COLOR }]}
                >
                  {formatCurrency(state.balance || 0)}
                </Text>
              </View>
            </View>
          </View>

          {/* Tips Section */}
          <View
            style={[
              tw`rounded-xl p-5`,
              { backgroundColor: Colors.surfaceLight },
            ]}
          >
            <Text style={[tw`font-bold mb-4`, { color: TEXT_PRIMARY }]}>
              💡 Tips Backup
            </Text>

            <View>
              <View style={tw`flex-row items-start mb-3`}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={SUCCESS_COLOR}
                  style={tw`mt-0.5 mr-2`}
                />
                <Text style={[tw`text-sm flex-1`, { color: TEXT_SECONDARY }]}>
                  Backup secara rutin (minimal seminggu sekali)
                </Text>
              </View>

              <View style={tw`flex-row items-start mb-3`}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={SUCCESS_COLOR}
                  style={tw`mt-0.5 mr-2`}
                />
                <Text style={[tw`text-sm flex-1`, { color: TEXT_SECONDARY }]}>
                  Simpan file backup di cloud atau komputer
                </Text>
              </View>

              <View style={tw`flex-row items-start mb-3`}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={SUCCESS_COLOR}
                  style={tw`mt-0.5 mr-2`}
                />
                <Text style={[tw`text-sm flex-1`, { color: TEXT_SECONDARY }]}>
                  Gunakan JSON untuk backup lengkap, PDF untuk laporan
                </Text>
              </View>

              <View style={tw`flex-row items-start`}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={SUCCESS_COLOR}
                  style={tw`mt-0.5 mr-2`}
                />
                <Text style={[tw`text-sm flex-1`, { color: TEXT_SECONDARY }]}>
                  Data bersifat privat, jangan bagikan ke orang lain
                </Text>
              </View>
            </View>
          </View>

          {/* Debug Section */}
          <View
            style={[
              tw`mt-8 pt-6`,
              { borderTopWidth: 1, borderTopColor: BORDER_COLOR },
            ]}
          >
            <Text style={[tw`font-medium mb-4`, { color: TEXT_SECONDARY }]}>
              Untuk Pengembang
            </Text>

            <TouchableOpacity
              style={[
                tw`p-4 rounded-xl flex-row items-center mb-3`,
                {
                  backgroundColor: SURFACE_COLOR,
                  borderWidth: 1,
                  borderColor: BORDER_COLOR,
                },
              ]}
              onPress={debugStorage}
              disabled={isLoading}
            >
              <View
                style={[
                  tw`w-10 h-10 rounded-lg items-center justify-center mr-3`,
                  { backgroundColor: SUCCESS_COLOR + "20" },
                ]}
              >
                <Ionicons name="bug-outline" size={20} color={SUCCESS_COLOR} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`font-medium`, { color: TEXT_PRIMARY }]}>
                  Debug Storage
                </Text>
                <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
                  Cek status penyimpanan
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={TEXT_SECONDARY}
              />
            </TouchableOpacity>

            {/* Clear All Data - DANGER ZONE */}
            <TouchableOpacity
              style={[
                tw`p-4 rounded-xl flex-row items-center`,
                {
                  backgroundColor: Colors.error + "10",
                  borderWidth: 1,
                  borderColor: Colors.error + "30",
                },
              ]}
              onPress={() => {
                Alert.alert(
                  "Hapus Semua Data",
                  "Apakah Anda yakin ingin menghapus SEMUA data?\n\nSemua transaksi, anggaran, tabungan, dan catatan akan dihapus permanen.",
                  [
                    { text: "Batalkan", style: "cancel" },
                    {
                      text: "Hapus Semua",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await clearAllData();
                          Alert.alert(
                            "✅ Berhasil",
                            "Semua data telah dihapus"
                          );
                        } catch (error) {
                          Alert.alert("Error", "Gagal menghapus data");
                        }
                      },
                    },
                  ]
                );
              }}
              disabled={isLoading}
            >
              <View
                style={[
                  tw`w-10 h-10 rounded-lg items-center justify-center mr-3`,
                  { backgroundColor: Colors.error + "20" },
                ]}
              >
                <Ionicons name="trash-outline" size={20} color={ERROR_COLOR} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`font-medium`, { color: ERROR_COLOR }]}>
                  Hapus Semua Data
                </Text>
                <Text style={[tw`text-sm`, { color: Colors.error }]}>
                  Hapus semua data (tidak dapat dibatalkan)
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={ERROR_COLOR} />
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View style={tw`mt-8 mb-8`}>
            <View
              style={[
                tw`p-4 rounded-xl`,
                {
                  backgroundColor: Colors.surfaceLight,
                  borderWidth: 1,
                  borderColor: BORDER_COLOR,
                },
              ]}
            >
              <Text
                style={[tw`text-center text-sm`, { color: TEXT_SECONDARY }]}
              >
                Aplikasi MyMoney v1.0.0
              </Text>
              <Text
                style={[
                  tw`text-center text-xs mt-1`,
                  { color: Colors.textTertiary },
                ]}
              >
                Data tersimpan lokal di perangkat Anda
              </Text>
              <Text
                style={[
                  tw`text-center text-xs mt-1`,
                  { color: Colors.textTertiary },
                ]}
              >
                Backup terakhir:{" "}
                {backupFiles.length > 0 ? backupFiles[0] : "Belum ada"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Backup Options Modal */}
      <BackupOptionsModal />
    </SafeAreaView>
  );
};

export default ProfileScreen;
