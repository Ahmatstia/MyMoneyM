// File: src/utils/imageStorage.ts
import { File, Paths } from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";

/**
 * Menyimpan gambar dari temporary cache (ImagePicker) ke permanent sandbox directory (Paths.document).
 * Ini mencegah foto profil, cover, atau target tabungan terhapus otomatis oleh sistem operasi saat aplikasi ditutup.
 */
export async function persistImageAsync(
  sourceUri: string,
  prefix: "avatar" | "cover" | "savings"
): Promise<string> {
  if (!sourceUri) {
    throw new Error("Source URI cannot be empty");
  }

  // Jika sudah merupakan URI remote (http/https), tidak perlu dipindahkan
  if (sourceUri.startsWith("http://") || sourceUri.startsWith("https://")) {
    return sourceUri;
  }

  try {
    // Tentukan ekstensi berkas
    const cleanUri = sourceUri.split("?")[0];
    const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
    const extension = match ? match[1].toLowerCase() : "jpg";

    const targetFileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension}`;
    const destFile = new File(Paths.document, targetFileName);

    // Coba copy dengan modern Expo File API
    let copied = false;
    try {
      const sourceFile = new File(sourceUri);
      await sourceFile.copy(destFile);
      if (destFile.exists) {
        copied = true;
      }
    } catch (modernErr) {
      // Fallback ke legacy FileSystem.copyAsync jika API modern memerlukan native binding khusus
      try {
        await FileSystemLegacy.copyAsync({
          from: sourceUri,
          to: destFile.uri,
        });
        copied = true;
      } catch (legacyErr) {
        // Fallback terakhir: copy menggunakan base64
        try {
          const base64Content = await FileSystemLegacy.readAsStringAsync(sourceUri, {
            encoding: FileSystemLegacy.EncodingType.Base64,
          });
          await FileSystemLegacy.writeAsStringAsync(destFile.uri, base64Content, {
            encoding: FileSystemLegacy.EncodingType.Base64,
          });
          copied = true;
        } catch (base64Err) {
          copied = false;
        }
      }
    }

    if (copied && destFile.exists) {
      return destFile.uri;
    }

    // Jika gagal copy, kembalikan sourceUri asli sebagai fallback terbaik
    return sourceUri;
  } catch (error) {
    return sourceUri;
  }
}

/**
 * Menghapus file gambar lama jika tersimpan di direktori dokumen permanen.
 */
export async function deleteImageFileAsync(uri?: string): Promise<void> {
  if (!uri || !uri.startsWith("file://")) return;

  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch (e) {
    try {
      await FileSystemLegacy.deleteAsync(uri, { idempotent: true });
    } catch {}
  }
}

/**
 * Memeriksa apakah berkas gambar lokal masih ada di penyimpanan.
 */
export function isImageFileExisting(uri?: string): boolean {
  if (!uri) return false;
  if (uri.startsWith("http://") || uri.startsWith("https://")) return true;
  if (!uri.startsWith("file://")) return true;

  try {
    const file = new File(uri);
    return file.exists;
  } catch {
    return true;
  }
}

/**
 * Menghapus seluruh berkas cache, gambar, dan dokumen yang tersimpan di direktori sandbox permanen
 * saat pengguna melakukan wipe data / hapus semua data.
 */
export async function clearAllPersistedFilesAsync(): Promise<void> {
  try {
    const docPath = (Paths.document as any)?.uri || String(Paths.document);
    const files = await FileSystemLegacy.readDirectoryAsync(docPath);
    for (const fileName of files) {
      try {
        await FileSystemLegacy.deleteAsync(`${docPath}/${fileName}`, { idempotent: true });
      } catch {}
    }
  } catch (err) {}
}

