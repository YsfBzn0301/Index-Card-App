import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLanguage } from '../state/LanguageContext';
import { useLibrary } from '../state/LibraryContext';
import { AppTheme } from '../theme/palette';
import { Deck } from '../types/flashcards';
import { confirmAction } from '../utils/confirm';

type Props = {
  deck: Deck | undefined;
  theme: AppTheme;
  onClose: () => void;
};

type Mode = 'menu' | 'rename' | 'cards';

// Bottom sheet opened by long-pressing a deck: delete, rename, or clean up cards without leaving the list.
export function DeckActionSheet({ deck, theme, onClose }: Props) {
  const { t } = useLanguage();
  const { bottom } = useSafeAreaInsets();
  const { deleteDeck, deleteCard, renameDeck } = useLibrary();
  const [mode, setMode] = useState<Mode>('menu');
  const [name, setName] = useState('');

  function close() {
    setMode('menu');
    onClose();
  }

  function startRename() {
    setName(deck?.title ?? '');
    setMode('rename');
  }

  function saveName() {
    if (deck && name.trim()) {
      renameDeck(deck.id, name);
      close();
    }
  }

  function removeDeck() {
    if (!deck) {
      return;
    }
    const target = deck;
    confirmAction({
      title: t('deckDeleteTitle'),
      message: `${target.title} ${t('deckDeleteBody')}`,
      cancelLabel: t('cancel'),
      confirmLabel: t('deckDelete'),
      destructive: true,
      onConfirm: () => {
        deleteDeck(target.id);
        close();
      },
    });
  }

  const actions = [
    { key: 'rename', icon: 'create-outline', label: t('renameDeck'), color: theme.text, onPress: startRename },
    { key: 'cards', icon: 'list-outline', label: t('manageCards'), color: theme.text, onPress: () => setMode('cards') },
    { key: 'delete', icon: 'trash-outline', label: t('deckDelete'), color: theme.primary, onPress: removeDeck },
  ] as const;

  return (
    <Modal transparent statusBarTranslucent visible={!!deck} animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior="padding" style={styles.backdrop}>
        <Pressable accessibilityLabel={t('cancel')} style={StyleSheet.absoluteFill} onPress={close} />
        <View style={[styles.sheet, { backgroundColor: theme.surface, paddingBottom: 20 + bottom }]}>
          <View style={[styles.grabber, { backgroundColor: theme.border }]} />
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{deck?.title}</Text>

          {mode === 'menu' &&
            actions.map((action) => (
              <Pressable key={action.key} accessibilityRole="button" onPress={action.onPress} style={({ pressed }) => [styles.action, { backgroundColor: theme.elevated }, pressed && styles.pressed]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
                <Text style={[styles.actionText, { color: action.color }]}>{action.label}</Text>
              </Pressable>
            ))}

          {mode === 'rename' && (
            <>
              <TextInput
                autoFocus
                value={name}
                onChangeText={setName}
                onSubmitEditing={saveName}
                placeholder={t('deckPlaceholder')}
                placeholderTextColor={theme.muted}
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              />
              <View style={styles.row}>
                <Pressable style={[styles.button, { backgroundColor: theme.elevated }]} onPress={() => setMode('menu')}>
                  <Text style={[styles.buttonText, { color: theme.text }]}>{t('cancel')}</Text>
                </Pressable>
                <Pressable style={[styles.button, { backgroundColor: theme.secondary }]} onPress={saveName}>
                  <Text style={styles.buttonText}>{t('save')}</Text>
                </Pressable>
              </View>
            </>
          )}

          {mode === 'cards' && (
            <>
              <ScrollView style={styles.cardList} contentContainerStyle={styles.cardListContent}>
                {deck?.cards.length === 0 && <Text style={[styles.empty, { color: theme.muted }]}>{t('noCardsInDeck')}</Text>}
                {deck?.cards.map((card) => (
                  <View key={card.id} style={[styles.cardRow, { backgroundColor: theme.elevated }]}>
                    {!!(card.frontImageUri || card.backImageUri) && (
                      <Image source={{ uri: card.frontImageUri ?? card.backImageUri }} contentFit="cover" style={styles.thumb} />
                    )}
                    <View style={styles.cardText}>
                      <Text style={[styles.cardFront, { color: theme.text }]} numberOfLines={1}>{card.front || '🖼'}</Text>
                      <Text style={[styles.cardBack, { color: theme.muted }]} numberOfLines={1}>{card.back || '🖼'}</Text>
                    </View>
                    <Pressable accessibilityRole="button" accessibilityLabel={t('cardDelete')} hitSlop={8} onPress={() => deleteCard(deck.id, card.id)} style={styles.trash}>
                      <Ionicons name="trash-outline" size={22} color={theme.primary} />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
              <Pressable style={[styles.button, { backgroundColor: theme.elevated }]} onPress={() => setMode('menu')}>
                <Text style={[styles.buttonText, { color: theme.text }]}>{t('done')}</Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, gap: 12, maxHeight: '80%' },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '900', marginBottom: 4 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 16 },
  actionText: { fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.7 },
  input: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16 },
  row: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, borderRadius: 18, paddingVertical: 15, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '900' },
  cardList: { flexGrow: 0 },
  cardListContent: { gap: 8 },
  empty: { textAlign: 'center', paddingVertical: 20, fontSize: 15 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, paddingLeft: 12, paddingRight: 6, paddingVertical: 8 },
  thumb: { width: 40, height: 40, borderRadius: 8 },
  cardText: { flex: 1, gap: 2 },
  cardFront: { fontSize: 15, fontWeight: '800' },
  cardBack: { fontSize: 13, fontWeight: '600' },
  trash: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
