import React from "react";
import { View, StyleSheet, Dimensions, Modal, Text } from "react-native";
import LottieView from "lottie-react-native";
import { useTheme } from "../../theme/ThemeContext";

const { width, height } = Dimensions.get("window");

interface GlobalLoadingProps {
  visible: boolean;
  message?: string;
}

const GlobalLoading: React.FC<GlobalLoadingProps> = ({ visible, message = "Memuat data..." }) => {
  const { colors } = useTheme();

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent={true}>
      <View style={styles.container}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: `${colors.border}80` }]}>
          <LottieView
            source={require("../../../assets/lottie/task/Loading 50 _ Among Us.json")}
            autoPlay
            loop
            style={styles.lottie}
          />
          <Text style={[styles.text, { color: colors.textSecondary }]}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    padding: 30,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  lottie: {
    width: 150,
    height: 150,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    letterSpacing: 0.5,
  },
});

export default GlobalLoading;
