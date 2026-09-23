import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DeckCard } from '../../components/DeckCard';
import { useLanguage } from '../../state/LanguageContext';
import { useLibrary } from '../../state/LibraryContext';
import { createTheme } from '../../theme/palette';

type DictationTarget = 'front' | 'back';

export default function DecksScreen() {
  const theme = createTheme(useColorScheme());
  const { decks, createDeck, addCard, deleteCard } = useLibrary();
  const { languageCode, t } = useLanguage();
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [dictationTarget, setDictationTarget] = useState<DictationTarget | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [folder, setFolder] = useState('');
  const [lesson, setLesson] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId);
  const categories = Array.from(new Set(decks.map((deck) => deck.category)));

  function saveDeck() {
    createDeck(title, category, folder, lesson);
    setTitle('');
    setCategory('');
    setFolder('');
    setLesson('');
    setIsDeckModalOpen(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }

  function saveCard() {
    if (!selectedDeck || !front.trim() || !back.trim()) {
      return;
    }

    addCard(selectedDeck.id, front, back);
    setFront('');
    setBack('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
  }

  function confirmDeleteCard(cardId: string) {
    if (!selectedDeck) {
      return;
    }

    Alert.alert('Karte loeschen?', 'Diese Karte wird aus dem Deck entfernt.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Loeschen', style: 'destructive', onPress: () => deleteCard(selectedDeck.id, cardId) },
    ]);
  }

  async function startDictation(target: DictationTarget) {
    try {
      const { ExpoSpeechRecognitionModule } = await import('expo-speech-recognition');
      const permissions = await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (!permissions.granted || !ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
        Alert.alert(t('language'), t('speechUnavailable'));
        return;
      }

      setDictationTarget(target);

      let cleanup = () => undefined;
      const resultListener = ExpoSpeechRecognitionModule.addListener('result', (event) => {
        const transcript = event.results[0]?.transcript?.trim();
        if (!transcript) {
          return;
        }

        const setText = target === 'front' ? setFront : setBack;
        setText((currentText) => (currentText.trim() ? `${currentText.trim()} ${transcript}` : transcript));
      });
      const endListener = ExpoSpeechRecognitionModule.addListener('end', () => {
        setDictationTarget(null);
        cleanup();
      });
      const errorListener = ExpoSpeechRecognitionModule.addListener('error', (event) => {
        setDictationTarget(null);
        cleanup();
        Alert.alert(t('language'), event.message || t('speechUnavailable'));
      });

      cleanup = () => {
        resultListener.remove();
        endListener.remove();
        errorListener.remove();
      };

      ExpoSpeechRecognitionModule.start({
        lang: languageCode,
        interimResults: false,
        continuous: false,
        maxAlternatives: 1,
        iosTaskHint: 'dictation',
        androidIntentOptions: {
          EXTRA_LANGUAGE_MODEL: 'free_form',
        },
      });
    } catch {
      setDictationTarget(null);
      Alert.alert(t('language'), t('speechUnavailable'));
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>{t('decks')}</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>Fach / Ordner / Lektion / Deck</Text>
          </View>
          <Pressable style={[styles.addButton, { backgroundColor: theme.primary }]} onPress={() => setIsDeckModalOpen(true)}>
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>

        {categories.map((currentCategory) => {
          const categoryDecks = decks.filter((deck) => deck.category === currentCategory);
          const folders = Array.from(new Set(categoryDecks.map((deck) => deck.folder)));

          return (
            <View key={currentCategory} style={styles.hierarchyGroup}>
              <Text style={[styles.categoryTitle, { color: theme.text }]}>{currentCategory}</Text>
              {folders.map((currentFolder) => {
                const folderDecks = categoryDecks.filter((deck) => deck.folder === currentFolder);
                const lessons = Array.from(new Set(folderDecks.map((deck) => deck.lesson)));

                return (
                  <View key={`${currentCategory}-${currentFolder}`} style={[styles.folderGroup, { borderColor: theme.border }]}> 
                    <Text style={[styles.folderTitle, { color: theme.muted }]}>{currentFolder}</Text>
                    {lessons.map((currentLesson) => (
                      <View key={`${currentCategory}-${currentFolder}-${currentLesson}`} style={styles.lessonGroup}>
                        <Text style={[styles.lessonTitle, { color: theme.text }]}>{currentLesson}</Text>
                        {folderDecks
                          .filter((deck) => deck.lesson === currentLesson)
                          .map((deck) => (
                            <Pressable key={deck.id} onPress={() => setSelectedDeckId(deck.id)}>
                              <DeckCard deck={deck} theme={theme} />
                            </Pressable>
                          ))}
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      <Modal transparent visible={isDeckModalOpen} animationType="slide" onRequestClose={() => setIsDeckModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
          <View style={[styles.modal, { backgroundColor: theme.surface }]}> 
            <Text style={[styles.modalTitle, { color: theme.text }]}>Neues Deck</Text>
            <TextInput value={category} onChangeText={setCategory} placeholder="Hauptkategorie / Fach, z. B. Englisch" placeholderTextColor={theme.muted} style={[styles.input, { color: theme.text, borderColor: theme.border }]} />
            <TextInput value={folder} onChangeText={setFolder} placeholder="Unterordner, z. B. Vokabeln" placeholderTextColor={theme.muted} style={[styles.input, { color: theme.text, borderColor: theme.border }]} />
            <TextInput value={lesson} onChangeText={setLesson} placeholder="Lektion, z. B. Unit 5" placeholderTextColor={theme.muted} style={[styles.input, { color: theme.text, borderColor: theme.border }]} />
            <TextInput value={title} onChangeText={setTitle} placeholder="Deck / Stack, z. B. Irregular Verbs" placeholderTextColor={theme.muted} style={[styles.input, { color: theme.text, borderColor: theme.border }]} />
            <View style={styles.modalActions}>
              <Pressable style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={() => setIsDeckModalOpen(false)}>
                <Text style={[styles.secondaryText, { color: theme.text }]}>Abbrechen</Text>
              </Pressable>
              <Pressable style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={saveDeck}>
                <Text style={styles.primaryText}>Speichern</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal transparent visible={!!selectedDeck} animationType="slide" onRequestClose={() => setSelectedDeckId(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
          <View style={[styles.modal, { backgroundColor: theme.surface }]}> 
            <Text style={[styles.modalTitle, { color: theme.text }]}>Karte fuer {selectedDeck?.title}</Text>
            <View style={styles.inputBlock}>
              <TextInput value={front} onChangeText={setFront} placeholder="Vorderseite / Frage" placeholderTextColor={theme.muted} multiline style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]} />
              <Pressable style={[styles.dictationButton, { backgroundColor: theme.elevated }]} onPress={() => startDictation('front')}>
                <Text style={[styles.dictationButtonText, { color: theme.text }]}>{dictationTarget === 'front' ? '...' : t('recordFront')}</Text>
              </Pressable>
            </View>
            <View style={styles.inputBlock}>
              <TextInput value={back} onChangeText={setBack} placeholder="Rueckseite / Antwort" placeholderTextColor={theme.muted} multiline style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]} />
              <Pressable style={[styles.dictationButton, { backgroundColor: theme.elevated }]} onPress={() => startDictation('back')}>
                <Text style={[styles.dictationButtonText, { color: theme.text }]}>{dictationTarget === 'back' ? '...' : t('recordBack')}</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.cardList} contentContainerStyle={styles.cardListContent} showsVerticalScrollIndicator={false}>
              {selectedDeck?.cards.map((card) => (
                <View key={card.id} style={[styles.cardRow, { borderColor: theme.border, backgroundColor: theme.elevated }]}> 
                  <View style={styles.cardRowText}>
                    <Text style={[styles.cardRowLabel, { color: theme.muted }]}>{t('front')}</Text>
                    <Text style={[styles.cardRowValue, { color: theme.text }]}>{card.front}</Text>
                    <Text style={[styles.cardRowLabel, { color: theme.muted }]}>{t('answer')}</Text>
                    <Text style={[styles.cardRowValue, { color: theme.text }]}>{card.back}</Text>
                  </View>
                  <Pressable style={[styles.deleteButton, { backgroundColor: theme.primary }]} onPress={() => confirmDeleteCard(card.id)}>
                    <Text style={styles.deleteButtonText}>Loeschen</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={() => setSelectedDeckId(null)}>
                <Text style={[styles.secondaryText, { color: theme.text }]}>{t('done')}</Text>
              </Pressable>
              <Pressable style={[styles.primaryButton, { backgroundColor: theme.secondary }]} onPress={saveCard}>
                <Text style={styles.primaryText}>Hinzufuegen</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 110,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  addButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '700',
  },
  hierarchyGroup: {
    gap: 12,
    marginTop: 8,
  },
  categoryTitle: {
    fontSize: 23,
    fontWeight: '900',
  },
  folderGroup: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    gap: 12,
  },
  folderTitle: {
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  lessonGroup: {
    gap: 10,
  },
  lessonTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modal: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    gap: 14,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    fontWeight: '700',
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  inputBlock: {
    gap: 8,
  },
  dictationButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  dictationButtonText: {
    fontSize: 12,
    fontWeight: '900',
  },
  cardList: {
    maxHeight: 220,
  },
  cardListContent: {
    gap: 10,
  },
  cardRow: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 12,
  },
  cardRowText: {
    gap: 4,
  },
  cardRowLabel: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  cardRowValue: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryText: {
    fontWeight: '900',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
