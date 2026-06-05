/**
 * migrate_screens.js
 * Menambah const { colors } = useTheme() di dalam komponen utama setiap screen
 * dan mengganti konstanta statis yang masih memakai Colors.xxx
 */
const fs = require('fs');

// Pasangan: konstanta lama → referensi colors baru
// Script akan mengganti pemakaian konstanta statis dengan colors.xxx
const CONST_MAP = {
  'BACKGROUND_COLOR': 'colors.background',
  'SURFACE_COLOR':    'colors.surface',
  'TEXT_PRIMARY':     'colors.textPrimary',
  'TEXT_SECONDARY':   'colors.textSecondary',
  'ACCENT_COLOR':     'colors.accent',
  'SUCCESS_COLOR':    'colors.success',
  'WARNING_COLOR':    'colors.warning',
  'ERROR_COLOR':      'colors.error',
  'INFO_COLOR':       'colors.info',
  'BORDER_COLOR':     'colors.border',
  'PRIMARY_COLOR':    'colors.primary',
  'SURFACE_LIGHT':    'colors.surfaceLight',
  'PURPLE_COLOR':     'colors.purple',
  'PINK_COLOR':       'colors.pink',
};

// Juga ganti Colors.xxx langsung
const COLORS_MAP = {
  'Colors.background':    'colors.background',
  'Colors.surface':       'colors.surface',
  'Colors.surfaceLight':  'colors.surfaceLight',
  'Colors.textPrimary':   'colors.textPrimary',
  'Colors.textSecondary': 'colors.textSecondary',
  'Colors.textTertiary':  'colors.textTertiary',
  'Colors.textDisabled':  'colors.textDisabled',
  'Colors.accent':        'colors.accent',
  'Colors.accentDark':    'colors.accentDark',
  'Colors.accentLight':   'colors.accentLight',
  'Colors.success':       'colors.success',
  'Colors.successLight':  'colors.successLight',
  'Colors.successDark':   'colors.successDark',
  'Colors.warning':       'colors.warning',
  'Colors.warningLight':  'colors.warningLight',
  'Colors.warningDark':   'colors.warningDark',
  'Colors.error':         'colors.error',
  'Colors.errorLight':    'colors.errorLight',
  'Colors.errorDark':     'colors.errorDark',
  'Colors.info':          'colors.info',
  'Colors.infoLight':     'colors.infoLight',
  'Colors.infoDark':      'colors.infoDark',
  'Colors.border':        'colors.border',
  'Colors.borderLight':   'colors.borderLight',
  'Colors.primary':       'colors.primary',
  'Colors.primaryDark':   'colors.primaryDark',
  'Colors.primaryLight':  'colors.primaryLight',
  'Colors.purple':        'colors.purple',
  'Colors.purpleLight':   'colors.purpleLight',
  'Colors.pink':          'colors.pink',
  'Colors.gray50':        'colors.gray50',
  'Colors.gray100':       'colors.gray100',
  'Colors.gray200':       'colors.gray200',
  'Colors.gray300':       'colors.gray300',
  'Colors.gray400':       'colors.gray400',
  'Colors.gray500':       'colors.gray500',
  'Colors.gray600':       'colors.gray600',
  'Colors.gray700':       'colors.gray700',
  'Colors.gray800':       'colors.gray800',
  'Colors.gray900':       'colors.gray900',
};

const targets = [
  'src/screens/Home/HomeScreen.tsx',
  'src/screens/Transactions/TransactionsScreen.tsx',
  'src/screens/Budget/BudgetScreen.tsx',
  'src/screens/Analytics/AnalyticsScreen.tsx',
  'src/screens/Debt/DebtScreen.tsx',
  'src/screens/Settings/SettingsScreen.tsx',
];

targets.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');

  // 1. Hapus deklarasi const statis yang masih tersisa (yang belum dihapus sebelumnya)
  Object.keys(CONST_MAP).forEach(name => {
    const re = new RegExp(`^const ${name}\\s*=\\s*Colors\\.\\w+;?\\s*\\r?\\n`, 'gm');
    c = c.replace(re, '');
  });

  // 2. Hapus sisa baris "const XXX_COLOR = Colors.xxx;"
  c = c.replace(/^const \w+_COLOR\s*=\s*Colors\.\w+;?\s*\r?\n/gm, '');
  c = c.replace(/^const CARD_BORDER\s*=\s*["']rgba.*?["'];?\s*\r?\n/gm, '');

  // 3. Tambah const { colors } = useTheme() setelah baris pembuka komponen utama
  //    Cari pola: "const XxxScreen: React.FC = () => {" atau "const XxxScreen = () => {"
  //    Lalu sisipkan "  const { colors } = useTheme();" di baris berikutnya
  if (!c.includes('const { colors } = useTheme()')) {
    // Cari opening brace komponen React utama
    c = c.replace(
      /^(const \w+Screen(?::\s*React\.FC)?\s*=\s*\([^)]*\)\s*=>\s*\{)/m,
      '$1\n  const { colors } = useTheme();'
    );
  }

  // 4. Ganti semua referensi konstanta statis dengan colors.xxx
  Object.entries(CONST_MAP).forEach(([oldName, newRef]) => {
    const re = new RegExp(`\\b${oldName}\\b`, 'g');
    c = c.replace(re, newRef);
  });

  // 5. Ganti semua Colors.xxx langsung
  Object.entries(COLORS_MAP).forEach(([oldRef, newRef]) => {
    // Escape dots for regex
    const escaped = oldRef.replace(/\./g, '\\.');
    const re = new RegExp(escaped, 'g');
    c = c.replace(re, newRef);
  });

  // 6. Ganti CARD_BORDER yang tersisa (rgba statis) dengan dynamic border
  c = c.replace(/["']rgba\(255,255,255,0\.0[67]\)["']/g, '`${colors.border}80`');
  c = c.replace(/["']rgba\(255,255,255,0\.0[5-9]\)["']/g, '`${colors.border}70`');

  // 7. Hapus baris komentar "── Theme colors" yang sudah kosong
  c = c.replace(/^\/\/ ─+ Theme colors.*\n/gm, '');
  c = c.replace(/^\/\/ ─+ Design tokens.*\n/gm, '');

  fs.writeFileSync(f, c, 'utf8');
  console.log('Migrated:', f);
});

console.log('Done!');
