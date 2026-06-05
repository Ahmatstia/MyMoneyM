const fs = require('fs');

try {
  let trans = fs.readFileSync('src/screens/Transactions/TransactionsScreen.tsx', 'utf8');
  // fix duplication
  trans = trans.replace(
    /type SafeIconName = keyof typeof Ionicons\.glyphMap;\s*\/\/\s*─── Theme colors \(tidak diubah\) ──────────────────────────────────────────────\s*\/\/\s*─── Design tokens \(konsisten dengan HomeScreen & AnalyticsScreen\) ────────────\s*import \{ DEFAULT_CATEGORIES, CategoryItem \} from "\.\.\/\.\.\/components\/CategoryPickerModal";\s*const \{ width \} = Dimensions\.get\("window"\);\s*type SafeIconName = keyof typeof Ionicons\.glyphMap;\s*\/\/\s*─── Theme colors \(tidak diubah\) ──────────────────────────────────────────────\s*\/\/\s*─── Design tokens \(konsisten dengan HomeScreen & AnalyticsScreen\) ────────────/m,
    `type SafeIconName = keyof typeof Ionicons.glyphMap;\n\nimport { DEFAULT_CATEGORIES, CategoryItem } from "../../components/CategoryPickerModal";\n\nconst { width } = Dimensions.get("window");\n\n// ─── Theme colors (tidak diubah) ──────────────────────────────────────────────\n// ─── Design tokens (konsisten dengan HomeScreen & AnalyticsScreen) ────────────`
  );

  // fix SectionHeader
  trans = trans.replace(
    /const SectionHeader = \(\{[\s\S]*?\}\) => \{\n  const \{ colors \} = useTheme\(\);\n  <\/View>\n\);/m,
    `const SectionHeader = ({
  title,
  linkLabel,
  onPress,
}: {
  title: string;
  linkLabel?: string;
  onPress?: () => void;
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 3,
            height: 13,
            backgroundColor: colors.accent,
            borderRadius: 2,
            marginRight: 8,
          }}
        />
        <Text
          style={{
            color: colors.gray400,
            fontSize: 10,
            fontWeight: "700",
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          {title}
        </Text>
      </View>
      {linkLabel && onPress && (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "600" }}>
            {linkLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};`
  );
  
  fs.writeFileSync('src/screens/Transactions/TransactionsScreen.tsx', trans, 'utf8');
} catch (e) {
  console.log("Error in trans:", e.message);
}

try {
  let home = fs.readFileSync('src/screens/Home/HomeScreen.tsx', 'utf8');
  home = home.replace(
    /const `\$\{colors\.border\}80` = `\$\{colors\.border\}80`;/g,
    ''
  );
  fs.writeFileSync('src/screens/Home/HomeScreen.tsx', home, 'utf8');
} catch(e) {
  console.log("Error in home:", e.message);
}
console.log("Syntax fixed");
