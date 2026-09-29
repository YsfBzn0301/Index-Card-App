import { Alert, Platform } from 'react-native';

type ConfirmOptions = {
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
};

// Alert.alert with buttons does nothing on web, so the browser's confirm dialog stands in there.
export function confirmAction({ title, message, cancelLabel, confirmLabel, destructive, onConfirm }: ConfirmOptions) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
