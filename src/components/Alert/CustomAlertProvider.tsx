import React, { useState, useEffect, ReactNode } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Alert as NativeAlert,
  AlertButton,
  AlertOptions,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/theme";

// Konsisten dengan theme
const SURFACE_COLOR = Colors.surface;
const TEXT_PRIMARY = Colors.textPrimary;
const TEXT_SECONDARY = Colors.textSecondary;
const ACCENT_COLOR = Colors.accent;
const ERROR_COLOR = Colors.error;
const INFO_COLOR = Colors.info;
const SUCCESS_COLOR = Colors.success;
const WARNING_COLOR = Colors.warning;

const CARD_RADIUS = 20;
const INNER_RADIUS = 12;
const CARD_BORDER = "rgba(255,255,255,0.06)";

const { width } = Dimensions.get("window");

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: AlertOptions;
}

export const CustomAlertProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: "",
  });

  useEffect(() => {
    // ─── MONKEY PATCHING NATIVE ALERT ─────────────────────────────────────────
    const originalAlert = NativeAlert.alert;

    NativeAlert.alert = (
      title: string,
      message?: string,
      buttons?: AlertButton[],
      options?: AlertOptions
    ) => {
      setAlertState({
        visible: true,
        title,
        message,
        buttons: buttons || [{ text: "OK" }],
        options,
      });
    };

    return () => {
      // Revert patch on unmount
      NativeAlert.alert = originalAlert;
    };
  }, []);

  const handleClose = () => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  };

  const handlePress = (onPress?: () => void) => {
    handleClose();
    if (onPress) {
      // Allow modal close animation to start before executing the callback
      setTimeout(() => onPress(), 50);
    }
  };

  // ─── RENDER HELPER ──────────────────────────────────────────────────────────
  const { visible, title, message, buttons } = alertState;

  // Tentukan tipe alert berdasarkan judul (heuristik sederhana)
  const isError = title.toLowerCase().includes("error") || title.toLowerCase().includes("gagal") || title.toLowerCase().includes("hapus");
  const isSuccess = title.toLowerCase().includes("sukses") || title.toLowerCase().includes("berhasil");
  const isWarning = title.toLowerCase().includes("peringatan") || title.toLowerCase().includes("izin");

  const themeColor = isError
    ? ERROR_COLOR
    : isSuccess
    ? SUCCESS_COLOR
    : isWarning
    ? WARNING_COLOR
    : ACCENT_COLOR;

  const iconName = isError
    ? "alert-circle-outline"
    : isSuccess
    ? "checkmark-circle-outline"
    : isWarning
    ? "warning-outline"
    : "information-circle-outline";

  return (
    <View style={{ flex: 1 }}>
      {children}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (alertState.options?.cancelable !== false) {
            handleClose();
          }
        }}
      >
        <View style={styles.overlay}>
          {/* Background press to dismiss (if cancelable) */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              if (alertState.options?.cancelable !== false) {
                handleClose();
              }
            }}
          />

          <View style={styles.alertBox}>
            {/* Header Icon */}
            <View style={[styles.iconContainer, { backgroundColor: `${themeColor}15` }]}>
              <Ionicons name={iconName} size={28} color={themeColor} />
            </View>

            {/* Content */}
            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}

            {/* Buttons Layout */}
            <View
              style={[
                styles.buttonContainer,
                // Jika tombol lebih dari 2, susun ke bawah
                buttons && buttons.length > 2 ? { flexDirection: "column" } : { flexDirection: "row" },
              ]}
            >
              {buttons?.map((btn, index) => {
                const isCancel = btn.style === "cancel";
                const isDestructive = btn.style === "destructive" || (isError && !isCancel && index === buttons.length - 1);
                const isPrimary = !isCancel && !isDestructive && (index === buttons.length - 1 || buttons.length === 1);

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      {
                        marginLeft: buttons.length <= 2 && index > 0 ? 10 : 0,
                        marginTop: buttons.length > 2 && index > 0 ? 10 : 0,
                        backgroundColor: isPrimary ? themeColor : isDestructive ? ERROR_COLOR : "rgba(255,255,255,0.06)",
                        borderColor: isPrimary ? themeColor : isDestructive ? ERROR_COLOR : CARD_BORDER,
                        borderWidth: 1,
                      },
                    ]}
                    onPress={() => handlePress(btn.onPress)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        { color: isPrimary || isDestructive ? "#FFFFFF" : TEXT_SECONDARY },
                      ]}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: width * 0.1,
  },
  alertBox: {
    width: "100%",
    backgroundColor: SURFACE_COLOR,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    color: TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    color: Colors.gray400,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    width: "100%",
    justifyContent: "center",
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: INNER_RADIUS,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
