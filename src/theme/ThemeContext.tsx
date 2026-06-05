// File: src/theme/ThemeContext.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Sistem Tema Dinamis — MyMoney
//
// Penggunaan di komponen:
//   import { useTheme } from '../../theme/ThemeContext';
//   const { colors, themeId, setTheme } = useTheme();
//   const BG = colors.background;  // reaktif terhadap tema aktif
//
// Penggunaan di App.tsx:
//   import { ThemeProvider } from './src/theme/ThemeContext';
//   <ThemeProvider><RestOfApp /></ThemeProvider>
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppColors, ThemeId, THEMES, DEFAULT_THEME_ID } from "./theme";

// ─── Context Type ─────────────────────────────────────────────────────────────

interface ThemeContextType {
  /** ID tema aktif, misal: "emerald" | "navy_gold" | dll */
  themeId: ThemeId;
  /** Object warna sesuai tema aktif — gunakan ini di setiap komponen */
  colors: AppColors;
  /** Fungsi untuk mengganti tema (tersimpan permanen ke AsyncStorage) */
  setTheme: (id: ThemeId) => Promise<void>;
  /** True saat pertama kali memuat tema dari storage */
  isThemeLoading: boolean;
}

// ─── Storage Key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "@mymoney_theme";

// ─── Context & Default ───────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextType>({
  themeId:        DEFAULT_THEME_ID,
  colors:         THEMES[DEFAULT_THEME_ID],
  setTheme:       async () => {},
  isThemeLoading: true,
});

// ─── Provider ────────────────────────────────────────────────────────────────

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeId, setThemeId]           = useState<ThemeId>(DEFAULT_THEME_ID);
  const [isThemeLoading, setThemeLoading] = useState(true);

  // Muat tema tersimpan saat pertama kali app dibuka
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved && saved in THEMES) {
          setThemeId(saved as ThemeId);
        }
      })
      .finally(() => setThemeLoading(false));
  }, []);

  // Ganti tema & simpan ke storage
  const setTheme = useCallback(async (id: ThemeId) => {
    setThemeId(id);
    await AsyncStorage.setItem(STORAGE_KEY, id);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        colors:  THEMES[themeId],
        setTheme,
        isThemeLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Hook utama untuk mendapat warna tema aktif.
 *
 * @example
 * const { colors, themeId, setTheme } = useTheme();
 * // colors.accent  → '#10B981' (emerald) atau warna tema lain
 * // setTheme('navy_gold') → ganti tema & simpan
 */
export const useTheme = (): ThemeContextType => useContext(ThemeContext);
