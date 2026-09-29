import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';

import { useLanguage } from '../state/LanguageContext';
import { ImageLightbox } from './ImageLightbox';

type Props = {
  text: string;
  imageUri?: string;
  textStyle: StyleProp<TextStyle>;
};

type Size = { width: number; height: number };

// Largest size of the image that fits the slot without cropping. The touch target is exactly this
// box, so the empty space around a letterboxed image still flips the card instead of opening the preview.
function fit(natural: Size, slot: Size): Size {
  const scale = Math.min(slot.width / natural.width, slot.height / natural.height);
  return { width: natural.width * scale, height: natural.height * scale };
}

// Text only: centered. Image only: centered, at most 70% of the card. Both: image on top, text below.
export function CardFace({ text, imageUri, textStyle }: Props) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [natural, setNatural] = useState<Size | null>(null);
  const [slot, setSlot] = useState<Size | null>(null);
  const { t } = useLanguage();
  const hasText = !!text.trim();
  const size = natural && slot && natural.width > 0 && natural.height > 0 ? fit(natural, slot) : null;

  return (
    <View style={styles.face}>
      {imageUri ? (
        <View
          onLayout={(event) => setSlot({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
          style={hasText ? styles.slotWithText : styles.slotOnly}
        >
          <Pressable
            accessibilityRole="imagebutton"
            onPress={() => setIsPreviewOpen(true)}
            style={[styles.image, size ?? styles.unmeasured]}
          >
            <Image
              source={{ uri: imageUri }}
              contentFit="contain"
              onLoad={(event) => {
                if (event.source.width > 0 && event.source.height > 0) {
                  setNatural({ width: event.source.width, height: event.source.height });
                }
              }}
              style={StyleSheet.absoluteFill}
            />
          </Pressable>
        </View>
      ) : null}
      {hasText ? <Text style={[textStyle, imageUri ? styles.textUnderImage : styles.textOnly]}>{text}</Text> : null}
      {imageUri ? <ImageLightbox uri={imageUri} visible={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} closeLabel={t('closePreview')} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  face: {
    flex: 1,
    justifyContent: 'center',
  },
  slotOnly: {
    height: '70%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotWithText: {
    flex: 1,
    maxHeight: '60%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  // Until the image reports its size it fills the slot (still fitted), so it is never invisible.
  unmeasured: {
    width: '100%',
    height: '100%',
  },
  textOnly: {
    textAlign: 'center',
  },
  textUnderImage: {
    textAlign: 'center',
    paddingTop: 14,
    paddingHorizontal: 8,
  },
});
