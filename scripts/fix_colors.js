/**
 * fix_colors.js
 * Perbaiki dua masalah pasca-migrasi:
 * 1. CARD_BORDER tidak ada → tambahkan di dalam komponen utama
 * 2. Helper components menggunakan colors tapi tidak punya scope → tambah useTheme()
 */
const fs = require('fs');

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

  // 1. Tambah CARD_BORDER setelah "const { colors } = useTheme();" di dalam komponen utama
  //    Ini membuat CARD_BORDER tersedia di dalam scope komponen.
  if (c.includes('const { colors } = useTheme();') && !c.includes('const CARD_BORDER =')) {
    c = c.replace(
      /(\s+const \{ colors \} = useTheme\(\);)/,
      '$1\n  const CARD_BORDER = `${colors.border}80`;'
    );
  }

  // 2. Cari helper components LUAR komponen yang menggunakan colors.xxx atau CARD_BORDER
  //    Tandai dengan: const XxxComp = (...) => ( atau => {
  //    Tambahkan useTheme() di awal body mereka jika belum ada.
  //
  //    Pola: komponen kecil yang di-define sebelum komponen utama.
  //    Kita ubah arrow-function-expression "=> (" menjadi "=> {" + return + useTheme
  
  // Ganti helper components yang pakai "colors." tapi belum punya useTheme
  // Cari pattern: "}) => (" lalu ada colors di body, ubah ke "}) => { const {colors}... return ("
  
  // Tangani SectionHeader, SettingRow, ThinBar, ProgressBar, dll.
  // Pattern: nama komponen diikuti ) => ( [multiline] );
  // Ini terlalu kompleks untuk regex sederhana, jadi kita tangani per-file di bawah.

  fs.writeFileSync(f, c, 'utf8');
  console.log('Fixed CARD_BORDER in:', f);
});

console.log('Done! Manual fix for helper components required.');
