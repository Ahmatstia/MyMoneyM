/**
 * fix_helpers.js
 * Mengubah semua helper components "() => (" yang menggunakan colors menjadi
 * "() => { const {colors} = useTheme(); return (" agar bisa akses theme.
 * 
 * Juga memperbaiki STATUS_COLOR yang bergantung pada colors di scope module.
 */
const fs = require('fs');

function fixHelperComponents(content) {
  // Regex mendeteksi arrow function component yang menggunakan pattern:
  // }) => (       ← arrow function returning JSX
  // dan di dalam body-nya ada "colors."
  // 
  // Strategi: cari semua blok "}) => (\n  <..." dan jika ada colors. di dalamnya
  // ubah ke "}) => { const { colors } = useTheme(); return (\n..."
  
  // Juga tangani pola: ": {\n  ...\n}) => ("
  // Pattern lebih luas: tangkap semua SomeName = (...) => (
  
  // Pendekatan: ganti setiap "= (...) => (\n" yang diikuti oleh penggunaan colors
  // dengan "= (...) => { const {colors} = useTheme(); return (\n"
  
  let result = content;
  
  // Pattern 1: ") => (\n" (arrow fn tanpa body block)
  // Ganti dengan "{ const { colors } = useTheme(); return (" jika ada "colors." di block berikutnya
  
  // Kita pakai pendekatan sederhana: cari semua "}) => (" dan cek apakah block berikutnya mengandung "colors."
  // Jika ya, ubah ke function body
  
  // Split dan process per komponen
  // Karena complex multi-line, kita lakukan simple replacement:
  
  // Ganti "= ({\n ... }) => (\n  <...>\n    ...colors...\n  </...>\n);" 
  // Ini terlalu kompleks, gunakan pendekatan berbeda:
  
  // Tambahkan useTheme import jika belum ada (sudah ada di file)
  
  // Untuk DebtScreen: STATUS_COLOR menggunakan colors — kita pindahkan ke dalam komponen
  // Ganti const STATUS_COLOR = { ... } di luar komponen dengan definisi di dalam
  
  return result;
}

// Script khusus untuk setiap file bermasalah

// ── BudgetScreen: SectionHeader & Card menggunakan colors ──────────────────
function fixBudgetScreen() {
  const f = 'src/screens/Budget/BudgetScreen.tsx';
  let c = fs.readFileSync(f, 'utf8');
  
  // Fix SectionHeader: ubah "}) => (" menjadi "}) => { const { colors } = useTheme(); return ("
  c = c.replace(
    /^(const SectionHeader = \([^)]+\): {\n  title: string;\n  linkLabel\?: string;\n  onPress\?: \(\) => void;\n\}) => \(/m,
    '$1 => {\n  const { colors } = useTheme();\n  return ('
  );
  // Tutup dengan ); → ); }
  // Ini complex, gunakan pendekatan berbeda - tambahkan useTheme ke setiap helper
  
  fs.writeFileSync(f, c, 'utf8');
}

// Lebih mudah: ganti tiap helper dengan versi yang menggunakan useTheme()
// Lakukan per-string replacement

const fixes = {
  'src/screens/Budget/BudgetScreen.tsx': [
    // SectionHeader: arrow fn → fn body
    [
      "}) => (\n  <View\n    style={{\n      flexDirection: \"row\",\n      justifyContent: \"space-between\",\n      alignItems: \"center\",\n      marginBottom: 14,\n    }}\n  >\n    <View style={{ flexDirection: \"row\", alignItems: \"center\" }}>\n      <View\n        style={{\n          width: 3,\n          height: 13,\n          backgroundColor: colors.accent,",
      "}) => {\n  const { colors } = useTheme();\n  return (\n  <View\n    style={{\n      flexDirection: \"row\",\n      justifyContent: \"space-between\",\n      alignItems: \"center\",\n      marginBottom: 14,\n    }}\n  >\n    <View style={{ flexDirection: \"row\", alignItems: \"center\" }}>\n      <View\n        style={{\n          width: 3,\n          height: 13,\n          backgroundColor: colors.accent,",
    ],
  ],
};

// Approach yang lebih reliable: tambah useTheme() ke tiap helper langsung dgn regex
// yang mencocokkan signature komponen React dan mengecek apakah ada colors. di body

const helperFiles = [
  'src/screens/Budget/BudgetScreen.tsx',
  'src/screens/Debt/DebtScreen.tsx',
  'src/screens/Analytics/AnalyticsScreen.tsx',
  'src/screens/Settings/SettingsScreen.tsx',
  'src/screens/Transactions/TransactionsScreen.tsx',
];

helperFiles.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  
  // Tangani STATUS_COLOR di DebtScreen — pindahkan ke dalam komponen
  if (f.includes('DebtScreen')) {
    // Ganti definisi statis STATUS_COLOR yang menggunakan colors
    c = c.replace(
      /^const STATUS_COLOR: Record<Debt\["status"\], string> = \{[\s\S]*?^};/m,
      '// STATUS_COLOR defined inside component (uses theme colors)'
    );
  }
  
  // Untuk setiap helper component yang menggunakan "colors." tapi belum punya useTheme:
  // Kita ganti ") => (\n" dengan ") => { const { colors } = useTheme(); return (\n"
  // untuk komponen yang ada "colors." di body-nya
  
  // Regex: tangkap arrow komponen React yang return JSX langsung
  // Pattern: ") => (\n  <" dengan colors di dalamnya
  // Akhir blok: "\n);" atau "\n);\n\n"
  
  // Implementasi sederhana: proses line by line
  const lines = c.split('\n');
  const out = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Deteksi baris penutup tipe komponen yang diikuti "=> ("
    if (/^\}) => \($/.test(line.trimEnd())) {
      // Lihat ke belakang untuk cek apakah ini komponen React
      // Lihat ke depan untuk cek apakah ada "colors." di body
      let j = i + 1;
      let bodyLines = [];
      let depth = 1;
      
      // Kumpulkan body sampai tutup )
      while (j < lines.length && depth > 0) {
        const bl = lines[j];
        // Hitung bracket/paren depth
        for (const ch of bl) {
          if (ch === '(' || ch === '{') depth++;
          if (ch === ')' || ch === '}') depth--;
        }
        if (depth > 0) bodyLines.push(bl);
        j++;
      }
      
      const bodyStr = bodyLines.join('\n');
      
      // Jika body mengandung "colors." tapi belum ada useTheme di body
      if (bodyStr.includes('colors.') && !bodyStr.includes('useTheme()')) {
        // Ubah ke function body
        out.push('}) => {');
        out.push('  const { colors } = useTheme();');
        out.push('  return (');
        out.push(...bodyLines);
        out.push('  );');
        out.push('}');
        i = j; // skip baris yang sudah diproses
        continue;
      }
    }
    
    out.push(line);
    i++;
  }
  
  c = out.join('\n');
  
  fs.writeFileSync(f, c, 'utf8');
  console.log('Fixed helpers in:', f);
});

console.log('Done!');
