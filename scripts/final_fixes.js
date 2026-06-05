const fs = require('fs');

// 1. TransactionsScreen.tsx
try {
  let trans = fs.readFileSync('src/screens/Transactions/TransactionsScreen.tsx', 'utf8');
  trans = trans.replace(
    /const SectionHeader = \(\{[\s\S]*?\}\) => \(/m,
    `const SectionHeader = ({\n  title,\n  linkLabel,\n  onPress,\n}: {\n  title: string;\n  linkLabel?: string;\n  onPress?: () => void;\n}) => {\n  const { colors } = useTheme();\n  return (`
  );
  trans = trans.replace(
    /      <\/TouchableOpacity>\n    \)}\n  <\/View>\n\);/m,
    `      </TouchableOpacity>\n    )}\n  </View>\n  );\n};`
  );
  fs.writeFileSync('src/screens/Transactions/TransactionsScreen.tsx', trans, 'utf8');
} catch (e) {
  console.log("Error in TransactionsScreen:", e.message);
}

// 2. HomeScreen.tsx
try {
  let home = fs.readFileSync('src/screens/Home/HomeScreen.tsx', 'utf8');
  if (!home.includes('const CARD_BORDER =')) {
    home = home.replace(
      /const HomeScreen: React\.FC = \(\) => \{\n\s+const \{ colors \} = useTheme\(\);/m,
      `const HomeScreen: React.FC = () => {\n  const { colors } = useTheme();\n  const CARD_BORDER = \`\${colors.border}80\`;`
    );
  }
  // If the regex failed, let's just replace CARD_BORDER with \`\${colors.border}80\`
  home = home.replace(/\bCARD_BORDER\b/g, '`${colors.border}80`');
  fs.writeFileSync('src/screens/Home/HomeScreen.tsx', home, 'utf8');
} catch (e) {
  console.log("Error in HomeScreen:", e.message);
}

// 3. DebtScreen.tsx
try {
  let debt = fs.readFileSync('src/screens/Debt/DebtScreen.tsx', 'utf8');
  if (!debt.includes('const STATUS_COLOR: Record<Debt["status"], string> = {')) {
    debt = debt.replace(
      /const DebtScreen: React\.FC = \(\) => \{\n\s+const \{ colors \} = useTheme\(\);/m,
      `const DebtScreen: React.FC = () => {\n  const { colors } = useTheme();\n  const STATUS_COLOR: Record<Debt["status"], string> = {\n    active: colors.error,\n    partial: colors.warning,\n    paid: colors.success,\n  };`
    );
  }
  fs.writeFileSync('src/screens/Debt/DebtScreen.tsx', debt, 'utf8');
} catch (e) {
  console.log("Error in DebtScreen:", e.message);
}

console.log("Fixes applied");
