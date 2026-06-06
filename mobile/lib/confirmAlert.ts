import { Alert, Platform } from "react-native";

type ConfirmAlertOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

/** Cross-platform confirm — uses `window.confirm` on web where `Alert.alert` buttons are unsupported. */
export function confirmAlert({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
}: ConfirmAlertOptions): void {
  if (Platform.OS === "web") {
    const prompt = message ? `${title}\n\n${message}` : title;
    if (window.confirm(prompt)) {
      void onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: "cancel" },
    {
      text: confirmLabel,
      style: destructive ? "destructive" : "default",
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
}

/** Cross-platform info alert — invokes `onOk` after dismiss on web. */
export function showAlert(title: string, message?: string, onOk?: () => void): void {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
    onOk?.();
    return;
  }

  if (onOk) {
    Alert.alert(title, message, [{ text: "OK", onPress: onOk }]);
    return;
  }

  Alert.alert(title, message);
}
