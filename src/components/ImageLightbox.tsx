import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  uri: string;
  visible: boolean;
  onClose: () => void;
  closeLabel: string;
};

export function ImageLightbox({ uri, visible, onClose, closeLabel }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Image source={{ uri }} contentFit="contain" style={styles.image} />
        <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} onPress={onClose} style={[styles.close, { top: insets.top + 12 }]}>
          <Ionicons name="close" size={26} color="#fff" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
    justifyContent: 'center',
  },
  image: {
    flex: 1,
  },
  close: {
    position: 'absolute',
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});
