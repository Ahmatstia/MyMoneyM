# CONTEXT FILE — Fitur Ganti Tema MyMoney
## (Baca file ini terlebih dahulu jika kamu AI baru yang melanjutkan sesi ini)

---

## 🎯 Tujuan Fitur

Menambahkan **sistem ganti tema warna dinamis** ke aplikasi MyMoney (React Native + Expo).
Saat ini seluruh warna hardcoded ke objek `Colors` di `src/theme/theme.ts`.
Tujuannya: pengguna bisa memilih tema favorit dari halaman Settings, dan warna seluruh app ikut berubah.

**Fase 1 yang sedang dikerjakan:** Hanya tema **Emerald Finance** dulu.

---

## 📁 Struktur Project

```
d:\IT\mobile\MyMoney\
├── src/
│   ├── theme/
│   │   ├── theme.ts              ← Sumber warna saat ini (statis, perlu dimodifikasi)
│   │   └── ThemeContext.tsx      ← [NEW] Akan dibuat di Fase 1
│   ├── context/
│   │   └── AppContext.tsx        ← Global state (transaksi, budget, dll) — JANGAN dicampur tema
│   ├── navigation/
│   │   └── AppNavigator.tsx      ← Navigator utama, perlu dimigrasikan
│   ├── screens/
│   │   ├── Home/HomeScreen.tsx   ← Layar utama, prioritas migrasi tinggi
│   │   ├── Transactions/TransactionsScreen.tsx
│   │   ├── Budget/BudgetScreen.tsx
│   │   ├── Analytics/AnalyticsScreen.tsx
│   │   ├── Debt/DebtScreen.tsx
│   │   └── Settings/SettingsScreen.tsx ← Tambah UI pemilih tema di sini
│   └── types/index.ts            ← Tambah ThemeId type
├── App.tsx                       ← Bungkus dengan ThemeProvider
└── app.json                      ← SDK 54, newArchEnabled: true
```

---

## 🏗️ Arsitektur Tema Baru

### Cara Kerjanya:
1. `ThemeContext.tsx` membuat React Context yang menyimpan **tema aktif**.
2. Tema aktif dimuat dari `AsyncStorage` key `@mymoney_theme` saat app start.
3. Semua layar menggunakan hook `useTheme()` untuk mendapat warna.
4. Pengguna ganti tema di Settings → tersimpan ke AsyncStorage → seluruh app reaktif.

### Perubahan Pola Kode:

**SEBELUM (hardcoded):**
```tsx
import { Colors } from '../../theme/theme';
const BACKGROUND_COLOR = Colors.background; // '#0F172A' — tidak reaktif
```

**SESUDAH (reaktif):**
```tsx
import { useTheme } from '../../theme/ThemeContext';
// Di dalam komponen:
const { colors } = useTheme();
const BACKGROUND_COLOR = colors.background; // mengikuti tema aktif
```

---

## 🎨 Palet Warna: Emerald Finance

Tema ini akan menjadi **default baru** menggantikan Navy Blue saat ini.

| Token | Nilai | Perubahan vs. Navy |
|-------|-------|-------------------|
| `background` | `#0B1220` | Lebih gelap, biru-kehijauan |
| `surface` | `#111827` | Slate → dark gray |
| **`accent`** | **`#10B981`** | **CYAN (#22D3EE) → EMERALD GREEN** ← Perubahan paling terlihat |
| `accentDark` | `#059669` | |
| `accentLight` | `#34D399` | |
| `success` | `#22C55E` | Hijau lebih cerah |
| `error` | `#EF4444` | Sama |
| `warning` | `#F59E0B` | Sama |
| `textPrimary` | `#F9FAFB` | Hampir sama |
| `border` | `#1F2D3D` | |

Warna **semantik** (success/error/warning/income/expense) dari gambar referensi:
- Income/success: `#22C55E`
- Expense/error: `#EF4444`

---

## 📋 File yang Perlu Dibuat / Dimodifikasi

### File BARU yang dibuat:
- `src/theme/ThemeContext.tsx` — Context provider + hook `useTheme()`

### File yang perlu DIMODIFIKASI:
| File | Perubahan |
|------|-----------|
| `src/theme/theme.ts` | Tambah `AppColors` interface, `ThemeId` type, `THEMES` object, `DEFAULT_THEME_ID` |
| `App.tsx` | Bungkus app dengan `<ThemeProvider>` |
| `src/types/index.ts` | Export `ThemeId` type |
| `src/navigation/AppNavigator.tsx` | Migrasi `Colors.xxx` → `useTheme()` |
| `src/screens/Home/HomeScreen.tsx` | Migrasi warna |
| `src/screens/Transactions/TransactionsScreen.tsx` | Migrasi warna |
| `src/screens/Budget/BudgetScreen.tsx` | Migrasi warna |
| `src/screens/Analytics/AnalyticsScreen.tsx` | Migrasi warna |
| `src/screens/Debt/DebtScreen.tsx` | Migrasi warna |
| `src/screens/Settings/SettingsScreen.tsx` | Migrasi warna + tambah UI pemilih tema |

---

## ⚡ Kode `ThemeContext.tsx` (Rancangan Lengkap)

```tsx
// src/theme/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, AppColors, ThemeId, DEFAULT_THEME_ID } from './theme';

interface ThemeContextType {
  themeId: ThemeId;
  colors: AppColors;
  setTheme: (id: ThemeId) => Promise<void>;
}

const STORAGE_KEY = '@mymoney_theme';

const ThemeContext = createContext<ThemeContextType>({
  themeId: DEFAULT_THEME_ID,
  colors: THEMES[DEFAULT_THEME_ID],
  setTheme: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME_ID);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && saved in THEMES) setThemeId(saved as ThemeId);
    });
  }, []);

  const setTheme = async (id: ThemeId) => {
    setThemeId(id);
    await AsyncStorage.setItem(STORAGE_KEY, id);
  };

  return (
    <ThemeContext.Provider value={{ themeId, colors: THEMES[themeId], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
```

---

## ⚡ Perubahan `theme.ts` (Rancangan)

```ts
// Tambahkan ini ke theme.ts

export type ThemeId = 'emerald' | 'navy_gold' | 'indigo' | 'deep_purple' | 'teal_calm' | 'light_clean';
export const DEFAULT_THEME_ID: ThemeId = 'emerald';

export interface AppColors {
  background: string;
  surface: string;
  surfaceLight: string;
  surfaceDark: string;
  accent: string;
  accentDark: string;
  accentLight: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
  border: string;
  borderLight: string;
  success: string;
  successLight: string;
  successDark: string;
  warning: string;
  warningLight: string;
  warningDark: string;
  error: string;
  errorLight: string;
  errorDark: string;
  info: string;
  infoLight: string;
  infoDark: string;
  gray50: string; gray100: string; gray200: string; gray300: string;
  gray400: string; gray500: string; gray600: string; gray700: string;
  gray800: string; gray900: string;
  white: string;
  black: string;
  transparent: string;
  // Backward compat
  primary?: string;
  primaryDark?: string;
  primaryLight?: string;
}

export const THEMES: Record<ThemeId, AppColors> = {
  emerald: {
    background:   '#0B1220',
    surface:      '#111827',
    surfaceLight: '#1F2D3D',
    surfaceDark:  '#060D18',
    accent:       '#10B981',
    accentDark:   '#059669',
    accentLight:  '#34D399',
    textPrimary:   '#F9FAFB',
    textSecondary: '#D1D5DB',
    textTertiary:  '#9CA3AF',
    textDisabled:  '#6B7280',
    border:      '#1F2D3D',
    borderLight: '#2D3F52',
    success:      '#22C55E',
    successLight: '#4ADE80',
    successDark:  '#16A34A',
    warning:      '#F59E0B',
    warningLight: '#FBBF24',
    warningDark:  '#D97706',
    error:        '#EF4444',
    errorLight:   '#F87171',
    errorDark:    '#DC2626',
    info:         '#3B82F6',
    infoLight:    '#60A5FA',
    infoDark:     '#2563EB',
    gray50: '#F9FAFB', gray100: '#F3F4F6', gray200: '#E5E7EB', gray300: '#D1D5DB',
    gray400: '#9CA3AF', gray500: '#6B7280', gray600: '#4B5563', gray700: '#374151',
    gray800: '#1F2937', gray900: '#111827',
    white: '#FFFFFF', black: '#000000', transparent: 'transparent',
    // Backward compat
    primary: '#0B1220', primaryDark: '#060D18', primaryLight: '#111827',
  },
  // Tema lain ditambahkan di Fase 2
  navy_gold: { /* ... */ } as AppColors,
  indigo: { /* ... */ } as AppColors,
  deep_purple: { /* ... */ } as AppColors,
  teal_calm: { /* ... */ } as AppColors,
  light_clean: { /* ... */ } as AppColors,
};

// Backward compat: Colors masih bisa diimport lama
export const Colors: AppColors & { gradient: any; shadow: any } = {
  ...THEMES.emerald,
  gradient: {
    primary: ['#0B1220', '#111827', '#1F2D3D'],
    accent:  ['#10B981', '#059669', '#047857'],
    success: ['#22C55E', '#4ADE80', '#16A34A'],
    purple:  ['#8B5CF6', '#7C3AED', '#6D28D9'],
  },
  shadow: {
    light:  'rgba(11, 18, 32, 0.8)',
    medium: 'rgba(6, 13, 24, 0.9)',
    dark:   'rgba(0, 0, 0, 0.95)',
  },
};
```

---

## 🎭 UI Pemilih Tema di Settings

Di `SettingsScreen.tsx`, tambahkan section baru dengan **kartu pratinjau tema**:

```tsx
// Contoh satu kartu tema
<TouchableOpacity
  onPress={() => setTheme('emerald')}
  style={{
    padding: 16,
    borderRadius: 16,
    borderWidth: themeId === 'emerald' ? 2 : 1,
    borderColor: themeId === 'emerald' ? colors.accent : colors.border,
    marginBottom: 12,
  }}
>
  <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
    🌿 Emerald Finance
  </Text>
  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
    Modern, aman, identik dengan uang dan pertumbuhan
  </Text>
  {/* Swatch row */}
  <View style={{ flexDirection: 'row', marginTop: 8, gap: 6 }}>
    {['#0B1220', '#111827', '#10B981', '#22C55E', '#EF4444'].map(c => (
      <View key={c} style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: c }} />
    ))}
  </View>
  {themeId === 'emerald' && (
    <View style={{ position: 'absolute', top: 12, right: 12 }}>
      <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
    </View>
  )}
</TouchableOpacity>
```

---

## ✅ Checklist Implementasi Fase 1

- [ ] Modifikasi `src/theme/theme.ts` — tambah `AppColors`, `ThemeId`, `THEMES`, `DEFAULT_THEME_ID`
- [ ] Buat `src/theme/ThemeContext.tsx`
- [ ] Modifikasi `App.tsx` — bungkus dengan `<ThemeProvider>`
- [ ] Migrasi `src/navigation/AppNavigator.tsx` ke `useTheme()`
- [ ] Migrasi `src/screens/Home/HomeScreen.tsx` ke `useTheme()`
- [ ] Migrasi `src/screens/Transactions/TransactionsScreen.tsx` ke `useTheme()`
- [ ] Migrasi `src/screens/Budget/BudgetScreen.tsx` ke `useTheme()`
- [ ] Migrasi `src/screens/Analytics/AnalyticsScreen.tsx` ke `useTheme()`
- [ ] Migrasi `src/screens/Debt/DebtScreen.tsx` ke `useTheme()`
- [ ] Migrasi + tambah UI tema di `src/screens/Settings/SettingsScreen.tsx`
- [ ] Jalankan `npx tsc --noEmit` — pastikan tidak ada error
- [ ] Test manual: ganti tema → restart → cek tersimpan

---

## 📝 Catatan Penting untuk AI Penerus

1. **Jangan ubah logika bisnis** (AppContext, storage, calculations) — hanya bagian warna/tampilan.
2. **Backward compatibility**: `Colors` dari `theme.ts` masih bisa diimport agar tidak memecahkan layar yang belum dimigrasikan.
3. **Pola migrasi konsisten**: Setiap screen meletakkan `const { colors } = useTheme()` **di dalam komponen** (bukan di luar), karena hook tidak boleh dipanggil di luar komponen.
4. **Variabel lokal di setiap screen**: Tetap gunakan `const BACKGROUND_COLOR = colors.background` dll untuk konsistensi baca dan menghindari refaktor masif.
5. Layar yang menggunakan Tailwind (`twrnc`) seperti `AddTransactionScreen` — warna dynamic tidak bisa lewat twrnc, harus pakai inline style untuk warna yang berubah per tema.
