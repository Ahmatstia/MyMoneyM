import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import * as FileSystem from "expo-file-system";

import { Colors } from "../../theme/theme";
import {
  listBackupFiles,
  deleteBackupFile,
  shareFile,
} from "../../utils/backupUtils";

const PRIMARY_COLOR = Colors.primary;
const ACCENT_COLOR = Colors.accent;
const BACKGROUND_COLOR = Colors.background;
const SURFACE_COLOR = Colors.surface;
const TEXT_PRIMARY = Colors.textPrimary;
const TEXT_SECONDARY = Colors.textSecondary;
const BORDER_COLOR = Colors.border;
const INFO_COLOR = "#3B82F6"; // Biru terang
const ERROR_COLOR = "#EF4444"; // Merah

const BackupManagerScreen: React.FC = () => {
  const [backupFiles, setBackupFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    loadBackupFiles();
  }, []);

  const loadBackupFiles = async () => {
    try {
      setIsLoading(true);
      const files = await listBackupFiles();
      setBackupFiles(files);
    } catch (error) {
      console.error("Error loading backup files:", error);
      Alert.alert("Error", "Gagal memuat daftar backup");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    Alert.alert("Hapus Backup", `Hapus file ${fileName}?`, [
      { text: "Batalkan", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            const success = await deleteBackupFile(fileName);
            if (success) {
              await loadBackupFiles();
              Alert.alert("✅", "File berhasil dihapus");
            }
          } catch (error) {
            Alert.alert("Error", "Gagal menghapus file");
          }
        },
      },
    ]);
  };

  const handleShareFile = async (fileName: string) => {
    try {
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      await shareFile(filePath);
    } catch (error) {
      Alert.alert("Error", "Gagal membagikan file");
    }
  };

  const formatFileSize = async (fileName: string): Promise<string> => {
    try {
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      const info = await FileSystem.getInfoAsync(filePath);

      if (info.exists && info.size) {
        const sizeKB = info.size / 1024;
        if (sizeKB > 1024) {
          return `${(sizeKB / 1024).toFixed(2)} MB`;
        }
        return `${sizeKB.toFixed(2)} KB`;
      }
      return "0 KB";
    } catch {
      return "? KB";
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".pdf")) {
      return "document-text";
    }
    return "code";
  };

  const getFileTypeColor = (fileName: string) => {
    if (fileName.endsWith(".pdf")) {
      return Colors.error;
    }
    return Colors.success;
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: BACKGROUND_COLOR }]}>
      <ScrollView style={tw`flex-1`}>
        {/* Header */}
        <View style={[tw`p-6`, { backgroundColor: PRIMARY_COLOR }]}>
          <Text style={[tw`text-2xl font-bold`, { color: TEXT_PRIMARY }]}>
            Manajer Backup
          </Text>
          <Text style={[tw`text-sm mt-2`, { color: TEXT_SECONDARY }]}>
            Kelola file backup dan laporan PDF
          </Text>
        </View>

        {/* Content */}
        <View style={tw`p-4`}>
          {/* Refresh Button */}
          <TouchableOpacity
            style={[
              tw`flex-row items-center justify-center py-3 rounded-xl mb-6`,
              {
                backgroundColor: SURFACE_COLOR,
                borderWidth: 1,
                borderColor: BORDER_COLOR,
              },
            ]}
            onPress={loadBackupFiles}
            disabled={isLoading}
          >
            <Ionicons
              name="refresh"
              size={18}
              color={ACCENT_COLOR}
              style={tw`mr-2`}
            />
            <Text style={[tw`font-medium`, { color: ACCENT_COLOR }]}>
              {isLoading ? "Memuat..." : "Refresh Daftar"}
            </Text>
          </TouchableOpacity>

          {/* File List */}
          {isLoading ? (
            <View style={tw`items-center py-8`}>
              <ActivityIndicator size="large" color={ACCENT_COLOR} />
              <Text style={[tw`mt-4`, { color: TEXT_SECONDARY }]}>
                Memuat daftar backup...
              </Text>
            </View>
          ) : backupFiles.length === 0 ? (
            <View style={tw`items-center py-8`}>
              <Ionicons name="folder-open" size={64} color={TEXT_SECONDARY} />
              <Text
                style={[tw`text-lg font-medium mt-4`, { color: TEXT_PRIMARY }]}
              >
                Tidak Ada Backup
              </Text>
              <Text
                style={[tw`text-center mt-2 px-8`, { color: TEXT_SECONDARY }]}
              >
                Buat backup terlebih dahulu melalui menu Ekspor Data di halaman
                Profil
              </Text>
            </View>
          ) : (
            <View>
              <Text style={[tw`font-medium mb-4`, { color: TEXT_PRIMARY }]}>
                File Backup ({backupFiles.length})
              </Text>

              {backupFiles.map((fileName, index) => (
                <TouchableOpacity
                  key={fileName}
                  style={[
                    tw`flex-row items-center p-4 rounded-xl mb-3`,
                    {
                      backgroundColor: SURFACE_COLOR,
                      borderWidth: 1,
                      borderColor:
                        selectedFile === fileName ? ACCENT_COLOR : BORDER_COLOR,
                    },
                  ]}
                  onPress={() =>
                    setSelectedFile(selectedFile === fileName ? null : fileName)
                  }
                >
                  <View
                    style={[
                      tw`w-12 h-12 rounded-lg items-center justify-center mr-3`,
                      { backgroundColor: getFileTypeColor(fileName) + "20" },
                    ]}
                  >
                    <Ionicons
                      name={getFileIcon(fileName)}
                      size={24}
                      color={getFileTypeColor(fileName)}
                    />
                  </View>

                  <View style={tw`flex-1`}>
                    <Text
                      style={[tw`font-medium`, { color: TEXT_PRIMARY }]}
                      numberOfLines={1}
                    >
                      {fileName}
                    </Text>
                    <Text style={[tw`text-xs mt-1`, { color: TEXT_SECONDARY }]}>
                      {fileName.includes("backup")
                        ? "Backup JSON"
                        : "Laporan PDF"}
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
                      style={tw`p-2 ml-2`}
                      onPress={() => handleDeleteFile(fileName)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={ERROR_COLOR}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Info Section */}
          <View
            style={[
              tw`mt-8 p-4 rounded-xl`,
              { backgroundColor: SURFACE_COLOR + "50" },
            ]}
          >
            <Text style={[tw`font-bold mb-2`, { color: TEXT_PRIMARY }]}>
              💡 Tips Backup
            </Text>
            <Text style={[tw`text-sm mb-1`, { color: TEXT_SECONDARY }]}>
              • Backup secara rutin untuk melindungi data Anda
            </Text>
            <Text style={[tw`text-sm mb-1`, { color: TEXT_SECONDARY }]}>
              • Simpan file backup di tempat yang aman (cloud, komputer)
            </Text>
            <Text style={[tw`text-sm`, { color: TEXT_SECONDARY }]}>
              • PDF cocok untuk laporan, JSON untuk backup lengkap
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BackupManagerScreen;
