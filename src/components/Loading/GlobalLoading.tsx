import React from "react";
import { View, StyleSheet, Dimensions, Modal, Text } from "react-native";
import LottieView from "lottie-react-native";
import { Colors } from "../../theme/theme";

const { width, height } = Dimensions.get("window");

interface GlobalLoadingProps {
  visible: boolean;
  message?: string;
}

const GlobalLoading: React.FC<GlobalLoadingProps> = ({ visible, message = "Memuat data..." }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.container}>
        <View style={styles.card}>
          <LottieView
            source={require("../../../assets/lottie/Loading 50 _ Among Us.json")}
            autoPlay
            loop
            style={styles.lottie}
          />
          <Text style={styles.text}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: Colors.surface,
    padding: 30,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
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
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    letterSpacing: 0.5,
  },
});

export default GlobalLoading;
