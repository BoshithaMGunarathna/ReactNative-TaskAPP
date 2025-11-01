import { Platform, Alert as RNAlert } from "react-native";

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

/**
 * Cross-platform alert function that works on both React Native and Web
 */
export const showAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[]
) => {
  if (Platform.OS === "web") {
    // For web, use window.alert or custom modal
    const alertMessage = message ? `${title}\n\n${message}` : title;

    // If there are buttons with actions, use confirm dialog
    if (buttons && buttons.length > 0) {
      const result = window.confirm(alertMessage);

      if (result && buttons.length > 0) {
        const okButton = buttons.find((b) => b.style !== "cancel");
        okButton?.onPress?.();
      } else if (!result && buttons.length > 1) {
        const cancelButton = buttons.find((b) => b.style === "cancel");
        cancelButton?.onPress?.();
      }
    } else {
      window.alert(alertMessage);
      buttons?.[0]?.onPress?.();
    }
  } else {
    RNAlert.alert(title, message, buttons);
  }
};

/**
 * Simple alert with just an OK button
 */
export const showSimpleAlert = (title: string, message?: string) => {
  showAlert(title, message, [{ text: "OK" }]);
};

/**
 * Alert with OK and Cancel buttons
 */
export const showConfirmAlert = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) => {
  showAlert(title, message, [
    { text: "Cancel", style: "cancel", onPress: onCancel },
    { text: "OK", onPress: onConfirm },
  ]);
};
