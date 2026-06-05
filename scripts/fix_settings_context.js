const fs = require('fs');

try {
  let file = fs.readFileSync('src/screens/Settings/SettingsScreen.tsx', 'utf8');

  // fix destructuring
  file = file.replace(
    /const \{ colors, themeName, changeTheme \} = useTheme\(\);/g,
    `const { colors, themeId, setTheme } = useTheme();`
  );

  // fix references
  file = file.replace(
    /const isSelected = themeName === id;/g,
    `const isSelected = themeId === id;`
  );

  file = file.replace(
    /onPress=\{\(\) => changeTheme\(id as ThemeId\)\}/g,
    `onPress={() => setTheme(id as ThemeId)}`
  );

  fs.writeFileSync('src/screens/Settings/SettingsScreen.tsx', file, 'utf8');
} catch (e) {
  console.log("Error:", e);
}
console.log("Settings fixed");
